#!/usr/bin/env python3
"""MeeGame API: danh sách game, lượt chơi, lượt khách và phòng biên tập trên một file SQLite.

Chỉ dùng thư viện có sẵn của Python 3.8+, không cần pip. Chạy trong Docker sau Cloudflare + Traefik trên VPS (xem server/compose.yml).

  python3 meegame_api.py serve                      chạy API (mặc định 127.0.0.1:8787)
  python3 meegame_api.py add-admin EMAIL            tạo / đổi mật khẩu người biên tập
  python3 meegame_api.py remove-admin EMAIL         bỏ quyền biên tập
  python3 meegame_api.py import-seed games-seed.js  nhập danh sách game dự phòng
  python3 meegame_api.py import-supabase            chép game + lượt chơi + lượt khách từ Supabase cũ

Biến môi trường:
  MEEGAME_DB       đường dẫn file SQLite (mặc định ./meegame.db)
  MEEGAME_HOST     mặc định 127.0.0.1
  MEEGAME_PORT     mặc định 8787
  MEEGAME_ORIGINS  các trang được gọi API, cách nhau bằng dấu phẩy
                   (mặc định https://hyenni151.github.io)
  JEV_API_KEY      khoá Jev cho ô "Hôm nay muốn chơi gì?". Trống thì tắt AI, trang tự tìm bằng từ khoá.
"""
import getpass
import hashlib
import hmac
import ipaddress
import json
import os
import re
import secrets
import sqlite3
import sys
import threading
import time
import urllib.request
from datetime import date, datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

DB_PATH = os.environ.get('MEEGAME_DB', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'meegame.db'))
HOST = os.environ.get('MEEGAME_HOST', '127.0.0.1')
PORT = int(os.environ.get('MEEGAME_PORT', '8787'))
ORIGINS = {o.strip().rstrip('/') for o in os.environ.get('MEEGAME_ORIGINS', 'https://hyenni151.github.io').split(',') if o.strip()}
# Proxy được tin (dải mạng, cách nhau dấu phẩy). Chỉ request từ đây mới được đọc IP thật trong header.
TRUSTED_PROXIES = [ipaddress.ip_network(n.strip(), strict=False)
                   for n in os.environ.get('MEEGAME_TRUSTED_PROXIES', '127.0.0.1/32,::1/128').split(',') if n.strip()]
# Sau Cloudflare: đặt 'CF-Connecting-IP'. Để trống thì lấy phần cuối X-Forwarded-For.
REAL_IP_HEADER = os.environ.get('MEEGAME_REAL_IP_HEADER', '').strip()


def peer_trusted(ip):
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return False
    return any(addr in net for net in TRUSTED_PROXIES)

# Giữ khớp với categories.js ở trang web.
CATEGORY_NAMES = {
    'food': 'Quán ăn, nấu ăn',
    'drink': 'Trà, cà phê & bánh',
    'shop': 'Tiệm & buôn bán',
    'farm': 'Nông trại & xây làng',
    'life': 'Đời sống & câu chuyện',
    'brain': 'Cờ & trí tuệ',
    'horror': 'Kinh dị',
}
CATEGORIES = tuple(CATEGORY_NAMES)

# Ô "Hôm nay muốn chơi gì?" dùng Jev (TypeSafe). Khoá chỉ nằm trên VPS, trong /etc/meegame/jev.env.
JEV_KEY = os.environ.get('JEV_API_KEY', '').strip()
JEV_URL = 'https://api.typesafe.ai/v1/systemone'
JEV_MODEL = 'jev-latest'
JEV_MAX_OPTIONS = 250       # Jev nhận tối đa 255 lựa chọn cho một câu hỏi
SUGGEST_PER_MIN = 12        # mỗi máy hỏi AI tối đa 12 lần / phút
SUGGEST_CACHE_TTL = 15 * 60

SESSION_DAYS = 30
MAX_BODY = 16 * 1024
PLAY_COOLDOWN = 20          # giây: một máy bấm cùng một game nhiều lần chỉ tính một
LOGIN_WINDOW = 15 * 60      # giây
LOGIN_MAX_FAILS = 8

SCHEMA = """
create table if not exists games (
  id          integer primary key,
  name        text not null check (length(trim(name)) between 1 and 120),
  url         text not null unique check (url like 'http://%' or url like 'https://%'),
  cover_url   text,
  title_en    text,
  aliases     text,
  added_at    text,
  category    text,
  hidden      integer not null default 0,
  created_at  text not null,
  updated_at  text not null
);
create table if not exists plays (
  game_url    text primary key,
  game_name   text,
  play_count  integer not null default 0,
  updated_at  text not null
);
create table if not exists visitors (
  visitor_id  text primary key,
  first_seen  text not null,
  last_seen   text not null
);
create table if not exists admins (
  email       text primary key,
  pw_hash     text not null,
  created_at  text not null
);
create table if not exists sessions (
  token_hash  text primary key,
  email       text not null references admins(email) on delete cascade,
  expires_at  integer not null
);
"""

GAME_COLS = ('id', 'name', 'url', 'cover_url', 'title_en', 'aliases', 'added_at', 'category', 'hidden', 'created_at')
PUBLIC_COLS = ('name', 'url', 'cover_url', 'title_en', 'aliases', 'added_at', 'category')


def now_iso():
    return datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%fZ')


def connect():
    db = sqlite3.connect(DB_PATH, timeout=10)
    db.row_factory = sqlite3.Row
    db.execute('pragma foreign_keys = on')
    db.execute('pragma busy_timeout = 10000')
    return db


def init_db():
    db = connect()
    db.execute('pragma journal_mode = wal')
    db.executescript(SCHEMA)
    db.commit()
    db.close()


def url_key(u):
    """So link không phân biệt hoa thường ở tên miền và dấu / ở cuối."""
    try:
        p = urlsplit(u.strip())
        return (p.scheme.lower() + '://' + p.netloc.lower() + p.path.rstrip('/') + ('?' + p.query if p.query else ''))
    except Exception:
        return ''


def clean_url(u):
    if not isinstance(u, str):
        return None
    u = u.strip()
    if len(u) > 500:
        return None
    try:
        p = urlsplit(u)
    except ValueError:
        return None
    if p.scheme not in ('http', 'https') or '.' not in (p.hostname or ''):
        return None
    return u


# ---------- Mật khẩu & phiên đăng nhập ----------

def hash_password(pw):
    salt = secrets.token_bytes(16)
    dk = hashlib.scrypt(pw.encode(), salt=salt, n=2 ** 14, r=8, p=1, dklen=32)
    return 'scrypt$' + salt.hex() + '$' + dk.hex()


def check_password(pw, stored):
    try:
        _, salt, want = stored.split('$')
        dk = hashlib.scrypt(pw.encode(), salt=bytes.fromhex(salt), n=2 ** 14, r=8, p=1, dklen=32)
        return hmac.compare_digest(dk.hex(), want)
    except Exception:
        return False


DUMMY_HASH = hash_password(secrets.token_hex(8))


def token_hash(token):
    return hashlib.sha256(token.encode()).hexdigest()


# ---------- Chống spam (trong bộ nhớ) ----------

_lock = threading.Lock()
_recent_plays = {}
_login_fails = {}


def allow_play(ip, key):
    t = time.time()
    with _lock:
        if len(_recent_plays) > 50000:
            for k in [k for k, v in _recent_plays.items() if t - v > PLAY_COOLDOWN]:
                del _recent_plays[k]
        last = _recent_plays.get((ip, key))
        if last and t - last < PLAY_COOLDOWN:
            return False
        _recent_plays[(ip, key)] = t
        return True


_suggest_hits = {}
_suggest_cache = {}


def allow_suggest(ip):
    t = time.time()
    with _lock:
        if len(_suggest_hits) > 20000:
            _suggest_hits.clear()
        hits = [x for x in _suggest_hits.get(ip, []) if t - x < 60]
        ok = len(hits) < SUGGEST_PER_MIN
        if ok:
            hits.append(t)
        _suggest_hits[ip] = hits
        return ok


def cached_suggest(key):
    with _lock:
        hit = _suggest_cache.get(key)
        return hit[1] if hit and time.time() - hit[0] < SUGGEST_CACHE_TTL else None


def remember_suggest(key, value):
    with _lock:
        if len(_suggest_cache) > 500:
            _suggest_cache.clear()
        _suggest_cache[key] = (time.time(), value)


def login_blocked(ip):
    t = time.time()
    with _lock:
        fails = [x for x in _login_fails.get(ip, []) if t - x < LOGIN_WINDOW]
        _login_fails[ip] = fails
        return len(fails) >= LOGIN_MAX_FAILS


def login_failed(ip):
    with _lock:
        _login_fails.setdefault(ip, []).append(time.time())


# ---------- Kiểm tra dữ liệu game ----------

class Invalid(Exception):
    def __init__(self, field, message):
        super().__init__(message)
        self.field = field
        self.message = message


def opt_text(v, limit):
    if v is None:
        return None
    if not isinstance(v, str):
        raise Invalid(None, 'Dữ liệu không hợp lệ.')
    v = v.strip()
    return v[:limit] or None


def game_fields(body, partial):
    out = {}
    if not partial or 'name' in body:
        name = re.sub(r'\s+', ' ', str(body.get('name') or '')).strip()
        if not 1 <= len(name) <= 120:
            raise Invalid('name', 'Chưa có tên game.')
        out['name'] = name
    if not partial or 'url' in body:
        url = clean_url(body.get('url'))
        if not url:
            raise Invalid('url', 'Link game chưa đúng. Link phải bắt đầu bằng https:// hoặc http://')
        out['url'] = url
    if 'cover_url' in body:
        cover = body.get('cover_url')
        if cover in (None, ''):
            out['cover_url'] = None
        else:
            out['cover_url'] = clean_url(cover)
            if not out['cover_url']:
                raise Invalid('cover_url', 'Link ảnh bìa chưa đúng. Để trống nếu không cần.')
    for k, limit in (('title_en', 120), ('aliases', 300)):
        if k in body:
            out[k] = opt_text(body.get(k), limit)
    if 'added_at' in body:
        d = body.get('added_at')
        if d in (None, ''):
            out['added_at'] = None
        else:
            try:
                out['added_at'] = date.fromisoformat(str(d)).isoformat()
            except ValueError:
                raise Invalid('added_at', 'Ngày lên kệ chưa đúng.')
    if not partial or 'category' in body:
        cat = body.get('category')
        if cat not in CATEGORIES:
            raise Invalid('category', 'Chưa chọn thể loại.')
        out['category'] = cat
    if 'hidden' in body:
        out['hidden'] = 1 if body.get('hidden') else 0
    if not partial:
        out.setdefault('added_at', date.today().isoformat())
    return out


def game_row(r):
    g = {k: r[k] for k in GAME_COLS}
    g['hidden'] = bool(g['hidden'])
    return g


# ---------- HTTP ----------

class Handler(BaseHTTPRequestHandler):
    server_version = 'MeeGame'
    sys_version = ''
    protocol_version = 'HTTP/1.1'

    def log_message(self, fmt, *args):
        sys.stderr.write('%s %s\n' % (self.client_ip(), fmt % args))

    def client_ip(self):
        peer = self.client_address[0]
        if not peer_trusted(peer):
            return peer
        if REAL_IP_HEADER:
            real = (self.headers.get(REAL_IP_HEADER) or '').strip()
            if real:
                return real
        fwd = self.headers.get('X-Forwarded-For', '')
        return fwd.split(',')[-1].strip() if fwd else peer

    # --- trả lời ---
    def cors(self):
        origin = (self.headers.get('Origin') or '').rstrip('/')
        if origin and (origin in ORIGINS or '*' in ORIGINS):
            self.send_header('Access-Control-Allow-Origin', origin)
            self.send_header('Vary', 'Origin')

    def send_json(self, status, data, extra=None):
        body = json.dumps(data, ensure_ascii=False, separators=(',', ':')).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.cors()
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(body)

    def fail(self, status, code, message, field=None):
        data = {'error': code, 'message': message}
        if field:
            data['field'] = field
        self.send_json(status, data)

    def read_json(self):
        try:
            n = int(self.headers.get('Content-Length') or 0)
        except ValueError:
            n = -1
        if n < 0 or n > MAX_BODY:
            raise Invalid(None, 'Dữ liệu gửi lên quá lớn.')
        raw = self.rfile.read(n) if n else b''
        if not raw:
            return {}
        try:
            data = json.loads(raw)
        except ValueError:
            raise Invalid(None, 'Dữ liệu không phải JSON.')
        if not isinstance(data, dict):
            raise Invalid(None, 'Dữ liệu không hợp lệ.')
        return data

    # --- định tuyến ---
    def do_OPTIONS(self):
        self.send_response(204)
        self.cors()
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Max-Age', '86400')
        self.send_header('Content-Length', '0')
        self.end_headers()

    def do_GET(self):
        self.route('GET')

    def do_HEAD(self):
        self.route('GET')

    def do_POST(self):
        self.route('POST')

    def do_PATCH(self):
        self.route('PATCH')

    def do_DELETE(self):
        self.route('DELETE')

    def route(self, method):
        path = urlsplit(self.path).path.rstrip('/') or '/'
        m = re.fullmatch(r'/api/admin/games/(\d+)', path)
        table = {
            ('GET', '/api/health'): self.health,
            ('GET', '/api/games'): self.public_games,
            ('GET', '/api/plays'): self.public_plays,
            ('POST', '/api/plays'): self.add_play,
            ('GET', '/api/visitors'): self.visitor_count,
            ('POST', '/api/visitors'): self.add_visitor,
            ('POST', '/api/suggest'): self.suggest,
            ('POST', '/api/admin/login'): self.login,
            ('POST', '/api/admin/logout'): self.logout,
            ('GET', '/api/admin/me'): self.me,
            ('GET', '/api/admin/games'): self.admin_games,
            ('POST', '/api/admin/games'): self.create_game,
        }
        handler = table.get((method, path))
        db = None
        try:
            db = connect()
            if handler:
                handler(db)
            elif m and method in ('PATCH', 'DELETE'):
                (self.update_game if method == 'PATCH' else self.delete_game)(db, int(m.group(1)))
            else:
                self.fail(404, 'not_found', 'Không có địa chỉ này.')
        except Invalid as e:
            self.fail(400, 'invalid', e.message, e.field)
        except Exception as e:  # không để lộ lỗi nội bộ ra ngoài
            sys.stderr.write('ERROR %s %s: %r\n' % (method, path, e))
            self.fail(500, 'server_error', 'Máy chủ gặp lỗi. Thử lại sau.')
        finally:
            if db is not None:
                db.close()

    # --- công khai ---
    def health(self, db):
        self.send_json(200, {'ok': True})

    def public_games(self, db):
        rows = db.execute('select %s from games where hidden = 0 order by name collate nocase' % ','.join(PUBLIC_COLS)).fetchall()
        self.send_json(200, [{k: r[k] for k in PUBLIC_COLS} for r in rows])

    def plays_map(self, db):
        return {r['game_url']: r['play_count'] for r in db.execute('select game_url, play_count from plays')}

    def public_plays(self, db):
        self.send_json(200, self.plays_map(db))

    def add_play(self, db):
        body = self.read_json()
        url = clean_url(body.get('url'))
        if not url:
            raise Invalid('url', 'Link game chưa đúng.')
        key = url_key(url)
        game = next((r for r in db.execute('select name, url from games where hidden = 0') if url_key(r['url']) == key), None)
        if not game:
            return self.fail(404, 'not_found', 'Không có game này.')
        if allow_play(self.client_ip(), key):
            db.execute('insert into plays (game_url, game_name, play_count, updated_at) values (?, ?, 1, ?) '
                       'on conflict(game_url) do update set play_count = play_count + 1, game_name = excluded.game_name, updated_at = excluded.updated_at',
                       (url, game['name'], now_iso()))
            db.commit()
        row = db.execute('select play_count from plays where game_url = ?', (url,)).fetchone()
        self.send_json(200, {'url': url, 'play_count': row['play_count'] if row else 0})

    def visitor_count(self, db):
        self.send_json(200, {'count': db.execute('select count(*) from visitors').fetchone()[0]})

    def add_visitor(self, db):
        body = self.read_json()
        vid = body.get('visitor_id')
        if not isinstance(vid, str) or not re.fullmatch(r'[A-Za-z0-9-]{8,80}', vid):
            raise Invalid('visitor_id', 'Mã khách không hợp lệ.')
        t = now_iso()
        db.execute('insert into visitors (visitor_id, first_seen, last_seen) values (?, ?, ?) '
                   'on conflict(visitor_id) do update set last_seen = excluded.last_seen', (vid, t, t))
        db.commit()
        self.visitor_count(db)

    # --- AI gợi ý game (Jev chấm xác suất từng game hợp với mô tả) ---
    def suggest(self, db):
        if not JEV_KEY:
            return self.fail(503, 'ai_off', 'Chưa bật AI.')
        body = self.read_json()
        text = re.sub(r'\s+', ' ', str(body.get('text') or '')).strip()
        if not 1 <= len(text) <= 200:
            raise Invalid('text', 'Mô tả cần từ 1 đến 200 ký tự.')
        rows = db.execute('select id, name, url, title_en, aliases, category from games where hidden = 0 '
                          'order by added_at is null, added_at desc, id desc limit ?', (JEV_MAX_OPTIONS,)).fetchall()
        version = '%d:%s' % (len(rows), db.execute('select max(updated_at) from games').fetchone()[0])
        key = version + '|' + text.lower()
        hit = cached_suggest(key)
        if hit is not None:
            return self.send_json(200, hit)
        if not allow_suggest(self.client_ip()):
            return self.fail(429, 'too_many', 'Hỏi nhanh quá, đợi một chút nhé.')
        criteria = {'none': 'Không game nào trong danh sách hợp với mô tả'}
        by_option = {}
        for r in rows:
            bits = [r['name'], CATEGORY_NAMES.get(r['category'], ''), r['title_en'] or '', r['aliases'] or '']
            criteria['g%d' % r['id']] = ' · '.join(b for b in bits if b)[:200]
            by_option['g%d' % r['id']] = r['url']
        payload = {
            'model': JEV_MODEL,
            'state': text,
            'questions': {
                'game': {
                    'type': 'choice',
                    'instructions': 'Người chơi gõ mô tả game họ muốn chơi, hoặc tên một game. '
                                    'Chọn game trong danh sách hợp nhất với mô tả đó.',
                    'criteria': criteria,
                },
            },
        }
        req = urllib.request.Request(JEV_URL, data=json.dumps(payload, ensure_ascii=False).encode(), method='POST',
                                     headers={'Authorization': 'Bearer ' + JEV_KEY, 'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=8) as res:
                probs = json.loads(res.read())['answers']['game'].get('probabilities') or {}
        except Exception as e:
            sys.stderr.write('JEV ERROR: %r\n' % e)
            return self.fail(502, 'ai_failed', 'AI chưa trả lời được.')
        ranked = sorted(((float(p), k) for k, p in probs.items() if k in by_option), reverse=True)
        out = {
            'results': [{'url': by_option[k], 'p': round(p, 4)} for p, k in ranked if p >= 0.01][:24],
            'none': round(float(probs.get('none', 0)), 4),
        }
        remember_suggest(key, out)
        self.send_json(200, out)

    # --- biên tập ---
    def admin_email(self, db):
        auth = self.headers.get('Authorization') or ''
        if not auth.startswith('Bearer '):
            return None
        row = db.execute('select email from sessions where token_hash = ? and expires_at > ?',
                         (token_hash(auth[7:].strip()), int(time.time()))).fetchone()
        return row['email'] if row else None

    def require_admin(self, db):
        email = self.admin_email(db)
        if not email:
            self.fail(401, 'unauthorized', 'Phiên đăng nhập đã hết. Đăng nhập lại.')
        return email

    def login(self, db):
        ip = self.client_ip()
        if login_blocked(ip):
            return self.fail(429, 'too_many', 'Sai quá nhiều lần. Đợi 15 phút rồi thử lại.')
        body = self.read_json()
        email = str(body.get('email') or '').strip().lower()
        password = str(body.get('password') or '')
        row = db.execute('select pw_hash from admins where email = ?', (email,)).fetchone()
        ok = check_password(password, row['pw_hash'] if row else DUMMY_HASH) and row is not None
        if not ok:
            login_failed(ip)
            return self.fail(401, 'bad_login', 'Sai email hoặc mật khẩu.')
        token = secrets.token_urlsafe(32)
        db.execute('delete from sessions where expires_at <= ?', (int(time.time()),))
        db.execute('insert into sessions (token_hash, email, expires_at) values (?, ?, ?)',
                   (token_hash(token), email, int(time.time()) + SESSION_DAYS * 86400))
        db.commit()
        self.send_json(200, {'token': token, 'email': email})

    def logout(self, db):
        auth = self.headers.get('Authorization') or ''
        if auth.startswith('Bearer '):
            db.execute('delete from sessions where token_hash = ?', (token_hash(auth[7:].strip()),))
            db.commit()
        self.send_json(200, {'ok': True})

    def me(self, db):
        email = self.require_admin(db)
        if email:
            self.send_json(200, {'email': email})

    def admin_games(self, db):
        if not self.require_admin(db):
            return
        rows = db.execute('select %s from games order by added_at is null, added_at desc, name collate nocase' % ','.join(GAME_COLS)).fetchall()
        self.send_json(200, {'games': [game_row(r) for r in rows], 'plays': self.plays_map(db)})

    def url_taken(self, db, url, except_id=None):
        key = url_key(url)
        for r in db.execute('select id, name, hidden, url from games'):
            if r['id'] != except_id and url_key(r['url']) == key:
                return r
        return None

    def duplicate(self, dup):
        self.fail(409, 'duplicate_url', 'Link này đã có trong danh sách: “%s”%s.' % (dup['name'], ' (đang ẩn)' if dup['hidden'] else ''), 'url')

    def create_game(self, db):
        if not self.require_admin(db):
            return
        f = game_fields(self.read_json(), partial=False)
        dup = self.url_taken(db, f['url'])
        if dup:
            return self.duplicate(dup)
        t = now_iso()
        f['created_at'] = t
        f['updated_at'] = t
        cur = db.execute('insert into games (%s) values (%s)' % (','.join(f), ','.join('?' * len(f))), tuple(f.values()))
        db.commit()
        row = db.execute('select %s from games where id = ?' % ','.join(GAME_COLS), (cur.lastrowid,)).fetchone()
        self.send_json(201, game_row(row))

    def update_game(self, db, gid):
        if not self.require_admin(db):
            return
        f = game_fields(self.read_json(), partial=True)
        if not db.execute('select 1 from games where id = ?', (gid,)).fetchone():
            return self.fail(404, 'not_found', 'Game này không còn trong danh sách.')
        if 'url' in f:
            dup = self.url_taken(db, f['url'], gid)
            if dup:
                return self.duplicate(dup)
        if f:
            f['updated_at'] = now_iso()
            db.execute('update games set %s where id = ?' % ','.join(k + ' = ?' for k in f), tuple(f.values()) + (gid,))
            db.commit()
        row = db.execute('select %s from games where id = ?' % ','.join(GAME_COLS), (gid,)).fetchone()
        self.send_json(200, game_row(row))

    def delete_game(self, db, gid):
        if not self.require_admin(db):
            return
        cur = db.execute('delete from games where id = ?', (gid,))
        db.commit()
        if not cur.rowcount:
            return self.fail(404, 'not_found', 'Game này không còn trong danh sách.')
        self.send_json(200, {'ok': True})


# ---------- Lệnh quản trị ----------

def cmd_serve():
    init_db()
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    httpd.daemon_threads = True
    print('MeeGame API: http://%s:%d  ·  DB %s  ·  cho phép %s' % (HOST, PORT, DB_PATH, ', '.join(sorted(ORIGINS))), flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass


def cmd_add_admin(email):
    email = email.strip().lower()
    if '@' not in email:
        sys.exit('Email chưa đúng.')
    pw = os.environ.get('MEEGAME_ADMIN_PASSWORD') or getpass.getpass('Mật khẩu mới cho %s: ' % email)
    if len(pw) < 8:
        sys.exit('Mật khẩu cần ít nhất 8 ký tự.')
    if not os.environ.get('MEEGAME_ADMIN_PASSWORD') and getpass.getpass('Nhập lại: ') != pw:
        sys.exit('Hai lần nhập không khớp.')
    init_db()
    db = connect()
    db.execute('insert into admins (email, pw_hash, created_at) values (?, ?, ?) '
               'on conflict(email) do update set pw_hash = excluded.pw_hash', (email, hash_password(pw), now_iso()))
    db.execute('delete from sessions where email = ?', (email,))
    db.commit()
    print('Đã lưu người biên tập %s.' % email)


def cmd_remove_admin(email):
    init_db()
    db = connect()
    n = db.execute('delete from admins where email = ?', (email.strip().lower(),)).rowcount
    db.commit()
    print('Đã bỏ quyền.' if n else 'Không có email này.')


def insert_games(db, rows):
    added = 0
    have = {url_key(r['url']) for r in db.execute('select url from games')}
    for r in rows:
        url = clean_url(r.get('url'))
        name = re.sub(r'\s+', ' ', str(r.get('name') or '')).strip()
        if not url or not name or url_key(url) in have:
            continue
        t = now_iso()
        cat = r.get('category') if r.get('category') in CATEGORIES else None
        db.execute('insert into games (name, url, cover_url, title_en, aliases, added_at, category, hidden, created_at, updated_at) '
                   'values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                   (name[:120], url, clean_url(r.get('cover_url')) if r.get('cover_url') else None, r.get('title_en') or None,
                    r.get('aliases') or None, r.get('added_at') or None, cat, 1 if r.get('hidden') else 0,
                    r.get('created_at') or t, t))
        have.add(url_key(url))
        added += 1
    return added


def cmd_import_seed(path):
    text = open(path, encoding='utf-8').read()
    m = re.search(r'=\s*(\[.*\])\s*;', text, re.S)
    if not m:
        sys.exit('Không đọc được danh sách trong %s' % path)
    rows = json.loads(m.group(1))
    init_db()
    db = connect()
    n = insert_games(db, rows)
    db.commit()
    print('Đã nhập %d game mới (bỏ qua %d game đã có).' % (n, len(rows) - n))


def fetch_all(base, key, table, cols):
    out, start, step = [], 0, 1000
    while True:
        req = urllib.request.Request('%s/rest/v1/%s?select=%s' % (base, table, cols), headers={
            'apikey': key, 'Authorization': 'Bearer ' + key, 'Range': '%d-%d' % (start, start + step - 1)})
        with urllib.request.urlopen(req, timeout=30) as res:
            rows = json.loads(res.read())
        out += rows
        if len(rows) < step:
            return out
        start += step


def cmd_import_supabase():
    """Chép dữ liệu công khai từ Supabase cũ. Chạy lại được: game trùng link được bỏ qua, lượt chơi lấy số lớn hơn."""
    base = os.environ.get('SUPABASE_URL', 'https://htrnwvupteggobokcrvb.supabase.co').rstrip('/')
    key = os.environ.get('SUPABASE_KEY', 'sb_publishable_pSqGk-pV3ZI1jmAuIujS1g_CxVVHx67')
    init_db()
    db = connect()
    try:
        games = fetch_all(base, key, 'games', 'name,url,cover_url,title_en,aliases,added_at,category,created_at')
    except Exception as e:
        print('Không đọc được bảng games (%s), bỏ qua.' % e)
        games = []
    n = insert_games(db, games)
    plays = fetch_all(base, key, 'game_play_stats', 'game_url,game_name,play_count')
    for r in plays:
        if not r.get('game_url'):
            continue
        db.execute('insert into plays (game_url, game_name, play_count, updated_at) values (?, ?, ?, ?) '
                   'on conflict(game_url) do update set play_count = max(play_count, excluded.play_count)',
                   (r['game_url'], r.get('game_name'), int(r.get('play_count') or 0), now_iso()))
    visitors = fetch_all(base, key, 'site_visitors', 'visitor_id')
    t = now_iso()
    for r in visitors:
        if r.get('visitor_id'):
            db.execute('insert or ignore into visitors (visitor_id, first_seen, last_seen) values (?, ?, ?)', (str(r['visitor_id']), t, t))
    db.commit()
    total_plays = db.execute('select coalesce(sum(play_count), 0) from plays').fetchone()[0]
    print('Đã chép: %d game mới, %d dòng lượt chơi (tổng %d lượt), %d khách.' % (n, len(plays), total_plays, len(visitors)))


def main(argv):
    cmd = argv[1] if len(argv) > 1 else 'serve'
    if cmd == 'serve':
        cmd_serve()
    elif cmd == 'add-admin' and len(argv) == 3:
        cmd_add_admin(argv[2])
    elif cmd == 'remove-admin' and len(argv) == 3:
        cmd_remove_admin(argv[2])
    elif cmd == 'import-seed' and len(argv) == 3:
        cmd_import_seed(argv[2])
    elif cmd == 'import-supabase':
        cmd_import_supabase()
    else:
        sys.exit(__doc__)


if __name__ == '__main__':
    main(sys.argv)

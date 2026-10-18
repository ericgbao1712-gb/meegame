# Chuyển ảnh bìa về máy chủ: chạy 5 phút một lần (cron của root, xem HUONG-DAN.md).
# - cover_url là link ngoài (admin dán) -> tải về, cắt 10:7, lưu covers/<mã>-x<băm>.webp (+ -s.webp), sửa cover_url.
# - cover_url trống (game mới) -> lấy ảnh chụp mshots khi đã chụp xong, làm như trên.
# Link ngoài hay hỏng (host ảnh miễn phí chặn, hết hạn...) nên trang chỉ nên trỏ vào meegame.shop/covers.
import hashlib, io, ipaddress, json, os, socket, sqlite3, sys, time, urllib.parse, urllib.request, warnings
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

DB = os.environ.get('MEEGAME_DB', '/data/meegame.db')
OUT = os.environ.get('COVERS_DIR', '/covers')
STATE = os.environ.get('COVERS_STATE', '/data/covers-state.json')
BASE = 'https://meegame.shop/covers/'
BIG, SMALL, R = (720, 504), (240, 168), 10 / 7
MAX_BYTES = 15 * 1024 * 1024
MAX_TRIES = 12          # 12 lần x 5 phút = 1 giờ, sau đó bỏ qua tới khi link đổi
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
Image.MAX_IMAGE_PIXELS = 40_000_000
warnings.simplefilter('error', Image.DecompressionBombWarning)


def log(*a):
    print(time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), *a, flush=True)


def mshots(url):
    return 'https://s.wordpress.com/mshots/v1/' + urllib.parse.quote(url, safe='') + '?w=720&h=504&vpw=1200&vph=840'


def public_host(host):
    # Chặn link trỏ vào mạng trong (127.x, 10.x, 172.16-31.x, 192.168.x...).
    for info in socket.getaddrinfo(host, None):
        ip = ipaddress.ip_address(info[4][0])
        if not ip.is_global:
            return False
    return True


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        u = urllib.parse.urlsplit(newurl)
        if u.scheme not in ('http', 'https') or not u.hostname or not public_host(u.hostname):
            raise ValueError('chuyển hướng tới địa chỉ không cho phép')
        if u.path.startswith('/mshots/v1/default'):
            raise ValueError('mshots chưa chụp xong')
        return super().redirect_request(req, fp, code, msg, headers, newurl)


opener = urllib.request.build_opener(NoRedirect)


def fetch(url):
    u = urllib.parse.urlsplit(url)
    if u.scheme not in ('http', 'https') or not u.hostname or not public_host(u.hostname):
        raise ValueError('link không cho phép')
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'image/avif,image/webp,image/*,*/*;q=0.8'})
    with opener.open(req, timeout=25) as r:
        data = r.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise ValueError('ảnh quá 15MB')
    return data


def render(data):
    im = Image.open(io.BytesIO(data))
    im.load()
    if getattr(im, 'n_frames', 1) > 1:
        im.seek(0)
    im = ImageOps.exif_transpose(im).convert('RGB')
    if im.width < 200 or im.height < 140:
        raise ValueError(f'ảnh quá nhỏ {im.size}')
    r = im.width / im.height
    if 0.85 * R <= r <= 1.2 * R:    # gần 10:7: cắt giữa cho vừa khung
        big = ImageOps.fit(im, BIG, Image.LANCZOS)
    else:                           # quá dọc/ngang: giữ cả ảnh, nền là chính ảnh làm mờ
        big = ImageOps.fit(im, BIG, Image.LANCZOS).filter(ImageFilter.GaussianBlur(28))
        big = ImageEnhance.Brightness(big).enhance(.9)
        s = min(BIG[0] / im.width, BIG[1] / im.height) * .92
        fg = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        big.paste(fg, ((BIG[0] - fg.width) // 2, (BIG[1] - fg.height) // 2))
    return big


def save(key, data, big):
    name = f'{key}-x{hashlib.sha1(data).hexdigest()[:6]}'
    for suffix, im, q in (('', big, 82), ('-s', big.resize(SMALL, Image.LANCZOS).filter(ImageFilter.UnsharpMask(1, 40, 2)), 80)):
        tmp = f'{OUT}/.{name}{suffix}.tmp'
        im.save(tmp, 'WEBP', quality=q, method=6)
        os.chmod(tmp, 0o644)
        os.replace(tmp, f'{OUT}/{name}{suffix}.webp')
    return BASE + name + '.webp'


def main():
    try:
        state = json.load(open(STATE))
    except (OSError, ValueError):
        state = {}
    db = sqlite3.connect(DB, timeout=15)
    rows = db.execute('select id, name, url, cover_url from games').fetchall()
    seen = set()
    for gid, name, url, cover in rows:
        cover = (cover or '').strip()
        if cover.startswith(BASE):
            continue
        src = cover or mshots(url.strip())
        tag = f'{gid}|{src}'
        seen.add(tag)
        tries = state.get(tag, 0)
        if tries >= MAX_TRIES:
            continue
        try:
            data = fetch(src)
            new = save(hashlib.sha1(url.strip().encode()).hexdigest()[:10], data, render(data))
        except Exception as e:
            state[tag] = tries + 1
            log('lỗi', gid, name, src[:90], '-', str(e)[:120])
            continue
        # Chỉ ghi khi admin chưa sửa link trong lúc tải.
        n = db.execute("update games set cover_url = ? where id = ? and coalesce(cover_url, '') = ?", (new, gid, cover)).rowcount
        db.commit()
        state.pop(tag, None)
        log('xong' if n else 'bỏ (link vừa đổi)', gid, name, '->', new)
    state = {k: v for k, v in state.items() if k in seen}
    tmp = STATE + '.tmp'
    json.dump(state, open(tmp, 'w'))
    os.replace(tmp, STATE)


if __name__ == '__main__':
    main()

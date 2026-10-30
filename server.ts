import express from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MEEGAME_SEED } from './src/data/seed.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

// In-memory store pre-seeded with MeeGame games, play counts, visitors, players, saves, and gift codes
let nextGameId = 1;
const nowIso = () => new Date().toISOString();

const gamesStore = MEEGAME_SEED.map(g => ({
  id: nextGameId++,
  name: g.name,
  url: g.url,
  cover_url: g.cover_url || null,
  title_en: g.title_en || null,
  aliases: g.aliases || null,
  added_at: g.added_at || '2026-10-13',
  category: g.category || 'other',
  hidden: false,
  created_at: nowIso(),
  updated_at: nowIso(),
}));

const playsStore: Record<string, number> = {
  'https://meegame.io.vn/quanlau/': 18420,
  'https://meegame.io.vn/xoailac/': 16350,
  'https://meegame.io.vn/tiramee/': 12890,
  'https://meegame.io.vn/banhtrang/': 11420,
  'https://meegame.io.vn/tiranho/': 9850,
  'https://meegame.io.vn/quanlyidol/': 8740,
  'https://banh-cuon-di.banh-cuon-di.workers.dev/': 7620,
  'https://com-tam-ba-thao.bachvinhtran.workers.dev/': 6890,
  'https://khoi-nghiep-tra-da.vercel.app/': 5430,
  'https://tiem-mi-cay.vercel.app/': 4910,
  'https://starfall-valley.vercel.app/': 4320,
  'https://ondagames.github.io/ganh-bun-bo-hue/': 3980,
};

const visitorsStore = new Set<string>();
for (let i = 1; i <= 4280; i++) {
  visitorsStore.add(`seed-visitor-${i}`);
}

const adminAccounts = new Map<string, string>([
  ['admin@meegame.shop', 'admin123'],
  ['ericgbao1712@gmail.com', 'admin123'],
]);
const adminSessions = new Map<string, { email: string; expiresAt: number }>();

const giftCodesStore = [
  {
    code: 'MEEGAME2026',
    game: '*',
    money: 500,
    xp: 300,
    maxUses: null as number | null,
    uses: 142,
    expiresAt: null as number | null,
    disabled: false,
    note: 'Quà mừng nhà mới MeeGame',
    createdAt: Date.now() - 86400000 * 3,
    forEmail: null as string | null,
  },
  {
    code: 'LAUOI888',
    game: 'quanlau',
    money: 888,
    xp: 500,
    maxUses: 500 as number | null,
    uses: 89,
    expiresAt: null as number | null,
    disabled: false,
    note: 'Quà khai trương Lẩu Ơi!',
    createdAt: Date.now() - 86400000 * 2,
    forEmail: null as string | null,
  },
  {
    code: 'XOAILACVIP',
    game: 'xoailac',
    money: 1000,
    xp: 800,
    maxUses: 200 as number | null,
    uses: 64,
    expiresAt: null as number | null,
    disabled: false,
    note: 'Quà livestream Xoài Lắc Ơi!',
    createdAt: Date.now() - 86400000,
    forEmail: null as string | null,
  },
  {
    code: 'TIRANHO150',
    game: 'tiranho',
    money: 600,
    xp: 350,
    maxUses: 500 as number | null,
    uses: 38,
    expiresAt: null as number | null,
    disabled: false,
    note: 'Mừng bản cập nhật Tiramisu Xe Đẩy 1.5.0 tối ưu mượt mà',
    createdAt: Date.now() - 3600000 * 6,
    forEmail: null as string | null,
  },
  {
    code: 'CHUTRO2026',
    game: 'nhatkychutro',
    money: 50000,
    xp: 500,
    maxUses: 10000 as number | null,
    uses: 18,
    expiresAt: null as number | null,
    disabled: false,
    note: 'Lì xì ban quản trị Nhật Ký Chủ Trọ',
    createdAt: Date.now() - 86400000,
    forEmail: null as string | null,
  },
];

interface PlayerRecord {
  id: number;
  email: string;
  name: string;
  picture: string;
  hidden: boolean;
  createdAt: string;
  lastLogin: string;
  lastRedeemAt: number;
}

let nextPlayerId = 5;
const playersStore: PlayerRecord[] = [
  {
    id: 1,
    email: 'nhuhuyen.mee@gmail.com',
    name: 'Như Huyền',
    picture: '',
    hidden: false,
    createdAt: '2026-10-15T08:00:00Z',
    lastLogin: nowIso(),
    lastRedeemAt: Date.now() - 86400000 * 2,
  },
  {
    id: 2,
    email: 'minhanh.gamer@gmail.com',
    name: 'Minh Anh',
    picture: '',
    hidden: false,
    createdAt: '2026-10-18T10:30:00Z',
    lastLogin: nowIso(),
    lastRedeemAt: Date.now() - 86400000,
  },
  {
    id: 3,
    email: 'baolong.saigon@gmail.com',
    name: 'Bảo Long',
    picture: '',
    hidden: false,
    createdAt: '2026-10-20T14:15:00Z',
    lastLogin: nowIso(),
    lastRedeemAt: 0,
  },
  {
    id: 4,
    email: 'test.flagged@gmail.com',
    name: 'Quán Thử Nghiệm',
    picture: '',
    hidden: false,
    createdAt: '2026-10-22T19:00:00Z',
    lastLogin: nowIso(),
    lastRedeemAt: 0,
  },
];

interface PlayerSaveRecord {
  playerId: number;
  game: string;
  shopName: string;
  avatar: number;
  badge?: string | null;
  level: number;
  xp: number;
  day: number;
  moneyEarned: number;
  potsSold: number;
  cheat: boolean;
  flagged: boolean;
  flagReason: string;
  updatedAt: number;
  savedAt: number;
  data?: Record<string, any>;
  giftMoneyChecked?: number;
}

const playerSavesStore: PlayerSaveRecord[] = [
  {
    playerId: 1,
    game: 'quanlau',
    shopName: 'Lẩu Nhà Mee',
    avatar: 1,
    badge: null,
    level: 28,
    xp: 4500,
    day: 64,
    moneyEarned: 148500,
    potsSold: 1920,
    cheat: false,
    flagged: false,
    flagReason: '',
    updatedAt: Date.now() - 1800000,
    savedAt: Date.now() - 1800000,
  },
  {
    playerId: 2,
    game: 'quanlau',
    shopName: 'Lẩu Hẻm Nhỏ',
    avatar: 2,
    badge: null,
    level: 22,
    xp: 2800,
    day: 45,
    moneyEarned: 86400,
    potsSold: 1180,
    cheat: false,
    flagged: false,
    flagReason: '',
    updatedAt: Date.now() - 3600000 * 3,
    savedAt: Date.now() - 3600000 * 3,
  },
  {
    playerId: 3,
    game: 'quanlau',
    shopName: 'Lẩu Cay Sài Gòn',
    avatar: 3,
    badge: null,
    level: 17,
    xp: 1600,
    day: 31,
    moneyEarned: 49200,
    potsSold: 740,
    cheat: false,
    flagged: false,
    flagReason: '',
    updatedAt: Date.now() - 3600000 * 8,
    savedAt: Date.now() - 3600000 * 8,
  },
  {
    playerId: 4,
    game: 'quanlau',
    shopName: 'Lẩu Siêu Tốc',
    avatar: 4,
    badge: null,
    level: 35,
    xp: 9000,
    day: 5,
    moneyEarned: 950000,
    potsSold: 4200,
    cheat: false,
    flagged: true,
    flagReason: 'Tiền tăng nhanh bất thường',
    updatedAt: Date.now() - 3600000 * 12,
    savedAt: Date.now() - 3600000 * 12,
  },
  {
    playerId: 1,
    game: 'xoailac',
    shopName: 'Xoài Lắc Nhà Mee',
    avatar: 1,
    badge: null,
    level: 25,
    xp: 3900,
    day: 52,
    moneyEarned: 112000,
    potsSold: 2340,
    cheat: false,
    flagged: false,
    flagReason: '',
    updatedAt: Date.now() - 2400000,
    savedAt: Date.now() - 2400000,
  },
  {
    playerId: 2,
    game: 'tiramee',
    shopName: 'Tiệm Bánh TiraMee',
    avatar: 2,
    badge: null,
    level: 19,
    xp: 2100,
    day: 38,
    moneyEarned: 68500,
    potsSold: 980,
    cheat: false,
    flagged: false,
    flagReason: '',
    updatedAt: Date.now() - 5400000,
    savedAt: Date.now() - 5400000,
  },
  {
    playerId: 1,
    game: 'banhtrang',
    shopName: 'Bánh Tráng Nhà Mee',
    avatar: 1,
    badge: null,
    level: 21,
    xp: 2600,
    day: 40,
    moneyEarned: 74200,
    potsSold: 1560,
    cheat: false,
    flagged: false,
    flagReason: '',
    updatedAt: Date.now() - 7200000,
    savedAt: Date.now() - 7200000,
  },
  {
    playerId: 3,
    game: 'tiranho',
    shopName: 'Tiramisu Xe Đẩy',
    avatar: 2,
    badge: null,
    level: 16,
    xp: 1450,
    day: 29,
    moneyEarned: 42800,
    potsSold: 830,
    cheat: false,
    flagged: false,
    flagReason: '',
    updatedAt: Date.now() - 9600000,
    savedAt: Date.now() - 9600000,
  },
  {
    playerId: 1,
    game: 'tiranho',
    shopName: 'Tiramisu Nhà Mee',
    avatar: 1,
    badge: null,
    level: 24,
    xp: 3420,
    day: 48,
    moneyEarned: 98400,
    potsSold: 1640,
    cheat: false,
    flagged: false,
    flagReason: '',
    updatedAt: Date.now() - 3600000,
    savedAt: Date.now() - 3600000,
  },
  {
    playerId: 2,
    game: 'tiranho',
    shopName: 'Xe Bánh Phố Đêm',
    avatar: 3,
    badge: null,
    level: 19,
    xp: 2150,
    day: 35,
    moneyEarned: 64200,
    potsSold: 1120,
    cheat: false,
    flagged: false,
    flagReason: '',
    updatedAt: Date.now() - 5400000,
    savedAt: Date.now() - 5400000,
  },
  {
    playerId: 1,
    game: 'nhatkychutro',
    shopName: 'Dãy Trọ Mee',
    avatar: 1,
    badge: 'vip',
    level: 18,
    xp: 2200,
    day: 35,
    moneyEarned: 245000,
    potsSold: 8,
    cheat: false,
    flagged: false,
    flagReason: '',
    updatedAt: Date.now() - 1200000,
    savedAt: Date.now() - 1200000,
    data: { money: 245000, lv: 18, xp: 2200, day: 35, branches: 2 },
  },
  {
    playerId: 2,
    game: 'nhatkychutro',
    shopName: 'Mee Đèn Lồng',
    avatar: 2,
    badge: null,
    level: 12,
    xp: 1400,
    day: 22,
    moneyEarned: 138000,
    potsSold: 4,
    cheat: false,
    flagged: false,
    flagReason: '',
    updatedAt: Date.now() - 3600000 * 2,
    savedAt: Date.now() - 3600000 * 2,
    data: { money: 138000, lv: 12, xp: 1400, day: 22, branches: 1 },
  },
];

interface SaveBackupRecord {
  playerId: number;
  game: string;
  day: number;
  level: number;
  moneyEarned: number;
  potsSold: number;
  createdAt: number;
  data?: Record<string, any>;
}

const saveBackupsStore: SaveBackupRecord[] = [
  {
    playerId: 3,
    game: 'tiranho',
    day: 26,
    level: 14,
    moneyEarned: 36500,
    potsSold: 710,
    createdAt: Date.now() - 3600000 * 14,
  },
  {
    playerId: 3,
    game: 'tiranho',
    day: 29,
    level: 16,
    moneyEarned: 42800,
    potsSold: 830,
    createdAt: Date.now() - 3600000 * 7,
  },
];

const redemptionsStore = [
  {
    playerId: 1,
    email: 'nhuhuyen.mee@gmail.com',
    name: 'Như Huyền',
    code: 'MEEGAME2026',
    game: 'quanlau',
    money: 500,
    xp: 300,
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    playerId: 2,
    email: 'minhanh.gamer@gmail.com',
    name: 'Minh Anh',
    code: 'LAUOI888',
    game: 'quanlau',
    money: 888,
    xp: 500,
    createdAt: Date.now() - 86400000,
  },
];

// Player sessions (mapped by cookie mee_sid or Bearer token)
const playerSessions = new Map<string, { playerId: number; expiresAt: number }>();

// Server-side Optimization #5: Schema initialization version guard in memory
let schemaVersion = 0;
const TARGET_SCHEMA_VERSION = 3;
function ensureLauSchema() {
  if (schemaVersion >= TARGET_SCHEMA_VERSION) return;
  schemaVersion = TARGET_SCHEMA_VERSION;
}

// Server-side Optimization #6: 60s in-memory cache for public endpoints (leaderboard & codes/active)
const LAU_CACHE_TTL = 60_000;
const lauCache = new Map<string, { at: number; data: any }>();

function getLauCache<T>(key: string): T | null {
  const hit = lauCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > LAU_CACHE_TTL) {
    lauCache.delete(key);
    return null;
  }
  return hit.data as T;
}

function setLauCache(key: string, data: any) {
  lauCache.set(key, { at: Date.now(), data });
}

function invalidateLauCache(prefix?: string) {
  if (!prefix) {
    lauCache.clear();
    return;
  }
  for (const k of lauCache.keys()) {
    if (k.startsWith(prefix)) lauCache.delete(k);
  }
}

function parseCookies(req: express.Request): Record<string, string> {
  const header = req.headers.cookie || '';
  const out: Record<string, string> = {};
  header.split(';').forEach(part => {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const k = part.slice(0, idx).trim();
      const v = decodeURIComponent(part.slice(idx + 1).trim());
      out[k] = v;
    }
  });
  return out;
}

function getPlayerFromReq(req: express.Request): PlayerRecord | null {
  const cookies = parseCookies(req);
  let token = cookies['mee_sid'] || '';
  if (!token) {
    const auth = req.headers.authorization || '';
    if (auth.startsWith('Bearer ')) token = auth.slice(7).trim();
  }
  if (!token) return null;
  const sess = playerSessions.get(token);
  if (!sess || sess.expiresAt < Date.now()) return null;
  return playersStore.find(p => p.id === sess.playerId) || null;
}

function getLatestCodeAtForGame(game: string, playerEmail?: string | null): number {
  const now = Date.now();
  let latest = 0;
  for (const c of giftCodesStore) {
    if (c.disabled) continue;
    if (c.game !== '*' && c.game !== game) continue;
    if (c.expiresAt && c.expiresAt <= now) continue;
    if (c.maxUses && c.uses >= c.maxUses) continue;
    if (c.forEmail && (!playerEmail || c.forEmail.toLowerCase() !== playerEmail.toLowerCase())) continue;
    if (c.createdAt > latest) latest = c.createdAt;
  }
  return latest;
}

function buildCloudSummary(save: PlayerSaveRecord | undefined | null) {
  if (!save) return null;
  return {
    updatedAt: save.updatedAt,
    savedAt: Number(save.data?.savedAt || save.savedAt || save.updatedAt),
    day: save.day,
    level: save.level,
    xp: save.xp,
    shopName: save.shopName,
    moneyEarned: save.moneyEarned,
    potsSold: save.potsSold,
    badge: save.badge || null,
  };
}

function getAdminEmailFromReq(req: express.Request): string | null {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  const sess = adminSessions.get(token);
  if (!sess || sess.expiresAt < Date.now()) return null;
  return sess.email;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // --- API: Health ---
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // --- API: Public Games ---
  app.get('/api/games', (_req, res) => {
    const visible = gamesStore
      .filter(g => !g.hidden)
      .map(g => ({
        name: g.name,
        url: g.url,
        cover_url: g.cover_url,
        title_en: g.title_en,
        aliases: g.aliases,
        added_at: g.added_at,
        category: g.category,
      }));
    res.json(visible);
  });

  // --- API: Public Plays ---
  app.get('/api/plays', (_req, res) => {
    res.json(playsStore);
  });

  app.post('/api/plays', (req, res) => {
    const url = String(req.body?.url || '').trim();
    if (!url) {
      res.status(400).json({ error: 'invalid', message: 'Link game chưa đúng.' });
      return;
    }
    playsStore[url] = (playsStore[url] || 0) + 1;
    res.json({ url, play_count: playsStore[url] });
  });

  // --- API: Visitors ---
  app.get('/api/visitors', (_req, res) => {
    res.json({ count: visitorsStore.size });
  });

  app.post('/api/visitors', (req, res) => {
    const vid = String(req.body?.visitor_id || '').trim();
    if (vid) visitorsStore.add(vid);
    res.json({ count: visitorsStore.size });
  });

  // --- API: Suggest ---
  app.post('/api/suggest', (_req, res) => {
    res.json({ results: [] });
  });

  // --- API: Admin Auth & Games CRUD ---
  app.post('/api/admin/login', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const expected = adminAccounts.get(email);
    if (!expected || expected !== password) {
      res.status(401).json({ error: 'bad_login', message: 'Sai email hoặc mật khẩu. (Gợi ý: admin@meegame.shop / admin123)' });
      return;
    }
    const token = crypto.randomBytes(24).toString('hex');
    adminSessions.set(token, { email, expiresAt: Date.now() + 30 * 86400000 });
    res.json({ token, email });
  });

  app.post('/api/admin/logout', (req, res) => {
    const auth = req.headers.authorization || '';
    if (auth.startsWith('Bearer ')) {
      adminSessions.delete(auth.slice(7).trim());
    }
    res.json({ ok: true });
  });

  app.get('/api/admin/me', (req, res) => {
    const email = getAdminEmailFromReq(req);
    if (!email) {
      res.status(401).json({ error: 'unauthorized', message: 'Phiên đăng nhập đã hết.' });
      return;
    }
    res.json({ email });
  });

  app.get('/api/admin/games', (req, res) => {
    const email = getAdminEmailFromReq(req);
    if (!email) {
      res.status(401).json({ error: 'unauthorized', message: 'Phiên đăng nhập đã hết.' });
      return;
    }
    res.json({ games: gamesStore, plays: playsStore });
  });

  app.post('/api/admin/games', (req, res) => {
    const email = getAdminEmailFromReq(req);
    if (!email) {
      res.status(401).json({ error: 'unauthorized', message: 'Phiên đăng nhập đã hết.' });
      return;
    }
    const b = req.body || {};
    const name = String(b.name || '').trim();
    const url = String(b.url || '').trim();
    if (!name) {
      res.status(400).json({ error: 'invalid', field: 'name', message: 'Chưa có tên game.' });
      return;
    }
    if (!url) {
      res.status(400).json({ error: 'invalid', field: 'url', message: 'Link game chưa đúng.' });
      return;
    }
    const newGame = {
      id: nextGameId++,
      name,
      url,
      cover_url: b.cover_url || null,
      title_en: b.title_en || null,
      aliases: b.aliases || null,
      added_at: b.added_at || nowIso().slice(0, 10),
      category: b.category || 'other',
      hidden: Boolean(b.hidden),
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    gamesStore.unshift(newGame);
    res.status(201).json(newGame);
  });

  app.patch('/api/admin/games/:id', (req, res) => {
    const email = getAdminEmailFromReq(req);
    if (!email) {
      res.status(401).json({ error: 'unauthorized', message: 'Phiên đăng nhập đã hết.' });
      return;
    }
    const id = Number(req.params.id);
    const idx = gamesStore.findIndex(g => g.id === id);
    if (idx < 0) {
      res.status(404).json({ error: 'not_found', message: 'Không tìm thấy game.' });
      return;
    }
    const b = req.body || {};
    const current = gamesStore[idx];
    const updated = {
      ...current,
      name: b.name !== undefined ? String(b.name).trim() : current.name,
      url: b.url !== undefined ? String(b.url).trim() : current.url,
      cover_url: b.cover_url !== undefined ? b.cover_url : current.cover_url,
      title_en: b.title_en !== undefined ? b.title_en : current.title_en,
      aliases: b.aliases !== undefined ? b.aliases : current.aliases,
      added_at: b.added_at !== undefined ? b.added_at : current.added_at,
      category: b.category !== undefined ? b.category : current.category,
      hidden: b.hidden !== undefined ? Boolean(b.hidden) : current.hidden,
      updated_at: nowIso(),
    };
    gamesStore[idx] = updated;
    res.json(updated);
  });

  app.delete('/api/admin/games/:id', (req, res) => {
    const email = getAdminEmailFromReq(req);
    if (!email) {
      res.status(401).json({ error: 'unauthorized', message: 'Phiên đăng nhập đã hết.' });
      return;
    }
    const id = Number(req.params.id);
    const idx = gamesStore.findIndex(g => g.id === id);
    if (idx >= 0) gamesStore.splice(idx, 1);
    res.json({ ok: true });
  });

  // --- API: /api/lau and /api/lau/* (Cloud saves, leaderboards, gift codes, game admin) ---
  const handleLau = (req: express.Request, res: express.Response) => {
    ensureLauSchema();
    let rawR = '';
    if (req.query && req.query.r) {
      rawR = String(req.query.r);
    } else {
      const splat = (req.params as any)?.splat ?? (req.params as any)?.[0];
      if (splat !== undefined && splat !== null) {
        rawR = Array.isArray(splat) ? splat.join('/') : String(splat);
      } else {
        rawR = req.path.replace(/^\/api\/lau\/?/, '');
      }
    }
    rawR = rawR.replace(/^\/+|\/+$/g, '');
    const routePath = '/' + rawR;
    const game = String(req.query.g || (req.body && req.body.game) || 'quanlau');
    const player = getPlayerFromReq(req);

    // Public Leaderboard (cached 60s in memory per game + sort criterion)
    if (req.method === 'GET' && routePath === '/leaderboard') {
      const by = String(req.query.by || 'level');
      const cacheKey = `lb:${game}:${by}`;
      let baseRows = getLauCache<any[]>(cacheKey);
      if (!baseRows) {
        const saves = playerSavesStore.filter(s => {
          const pl = playersStore.find(p => p.id === s.playerId);
          return s.game === game && !s.cheat && !s.flagged && pl && !pl.hidden;
        });
        saves.sort((a, b) => {
          if (by === 'money') return b.moneyEarned - a.moneyEarned;
          if (by === 'pots') return b.potsSold - a.potsSold;
          return b.level - a.level || b.xp - a.xp;
        });
        baseRows = saves.slice(0, 50).map((s, idx) => ({
          rank: idx + 1,
          playerId: s.playerId,
          shopName: s.shopName,
          avatar: s.avatar,
          badge: s.badge || null,
          level: s.level,
          value: by === 'money' ? s.moneyEarned : by === 'pots' ? s.potsSold : s.level,
        }));
        setLauCache(cacheKey, baseRows);
      }

      const rows = baseRows.map(r => ({
        rank: r.rank,
        shopName: r.shopName,
        avatar: r.avatar,
        badge: r.badge,
        level: r.level,
        value: r.value,
        me: Boolean(player && r.playerId === player.id),
      }));

      let meRow = rows.find(r => r.me) || null;
      if (!meRow && player) {
        const mySave = playerSavesStore.find(s => s.playerId === player.id && s.game === game);
        if (mySave) {
          meRow = {
            rank: baseRows.length + 1,
            shopName: mySave.shopName,
            avatar: mySave.avatar,
            badge: mySave.badge || null,
            level: mySave.level,
            value: by === 'money' ? mySave.moneyEarned : by === 'pots' ? mySave.potsSold : mySave.level,
            me: true,
          };
        }
      }
      res.json({ by, rows, me: meRow });
      return;
    }

    // Public active gift codes (cached 60s in memory for public list, enriched per player if logged in)
    if (req.method === 'GET' && routePath === '/codes/active') {
      const now = Date.now();
      const cacheKey = `codes:${game}`;
      let publicCodes = getLauCache<typeof giftCodesStore>(cacheKey);
      if (!publicCodes) {
        publicCodes = giftCodesStore.filter(
          c =>
            !c.disabled &&
            (c.game === '*' || c.game === game) &&
            (!c.expiresAt || c.expiresAt > now) &&
            (!c.maxUses || c.uses < c.maxUses) &&
            !c.forEmail
        );
        setLauCache(cacheKey, publicCodes);
      }

      // Include personal gift codes if player is logged in
      const personalCodes = player
        ? giftCodesStore.filter(
            c =>
              !c.disabled &&
              (c.game === '*' || c.game === game) &&
              (!c.expiresAt || c.expiresAt > now) &&
              (!c.maxUses || c.uses < c.maxUses) &&
              c.forEmail &&
              c.forEmail.toLowerCase() === player.email.toLowerCase()
          )
        : [];

      const combined = [...personalCodes, ...publicCodes];
      const active = combined.map(c => {
        const redeemed = player
          ? redemptionsStore.some(r => r.playerId === player.id && r.code === c.code)
          : false;
        return {
          code: c.code,
          forMe: Boolean(c.forEmail),
          money: c.money,
          xp: c.xp,
          note: c.note,
          expiresAt: c.expiresAt,
          left: c.maxUses ? Math.max(0, c.maxUses - c.uses) : null,
          createdAt: c.createdAt,
          redeemed,
        };
      });
      res.json({ codes: active });
      return;
    }

    // Server-side Optimization #7: Auth me returns cloud save summary + latestCodeAt in 1 call
    if (req.method === 'GET' && routePath === '/auth/me') {
      const latestCodeAt = getLatestCodeAtForGame(game, player?.email);
      if (!player) {
        res.status(401).json({
          error: 'unauthorized',
          message: 'Chưa đăng nhập.',
          player: null,
          cloud: null,
          latestCodeAt,
        });
        return;
      }
      const save = playerSavesStore.find(s => s.playerId === player.id && s.game === game);
      res.json({
        player: {
          id: player.id,
          email: player.email,
          name: player.name,
          picture: player.picture,
        },
        cloud: buildCloudSummary(save),
        latestCodeAt,
      });
      return;
    }

    // Player login / session creation (Google, Guest, or Direct)
    if (req.method === 'POST' && (routePath === '/auth/google' || routePath === '/auth/login' || routePath === '/auth/guest')) {
      const b = req.body || {};
      let email = String(b.email || '').trim().toLowerCase();
      let name = String(b.name || '').trim();
      let picture = String(b.picture || '').trim();

      // Decode JWT payload if id_token / credential was sent
      const cred = String(b.credential || b.id_token || '').trim();
      if (!email && cred.includes('.')) {
        try {
          const payloadPart = cred.split('.')[1];
          const parsed = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
          email = String(parsed.email || '').trim().toLowerCase();
          name = String(parsed.name || parsed.given_name || email.split('@')[0] || 'Người chơi');
          picture = String(parsed.picture || '');
        } catch (_e) {
          // ignore invalid jwt format
        }
      }
      if (!email) {
        const guestId = String(b.guestId || b.uid || '').trim() || crypto.randomBytes(4).toString('hex');
        email = `guest_${guestId}@meegame.shop`;
        name = name || 'Chủ trọ ' + guestId.slice(0, 4).toUpperCase();
      }
      let p = playersStore.find(x => x.email.toLowerCase() === email);
      if (!p) {
        p = {
          id: nextPlayerId++,
          email,
          name: name || email.split('@')[0],
          picture,
          hidden: false,
          createdAt: nowIso(),
          lastLogin: nowIso(),
          lastRedeemAt: 0,
        };
        playersStore.push(p);
      } else {
        p.lastLogin = nowIso();
        if (name) p.name = name;
        if (picture) p.picture = picture;
      }
      const sid = crypto.randomBytes(24).toString('hex');
      playerSessions.set(sid, { playerId: p.id, expiresAt: Date.now() + 30 * 86400000 });
      res.setHeader('Set-Cookie', `mee_sid=${sid}; Path=/; Max-Age=${30 * 86400}; SameSite=Lax`);
      const save = playerSavesStore.find(s => s.playerId === p!.id && s.game === game);
      res.json({
        token: sid,
        player: { id: p.id, email: p.email, name: p.name, picture: p.picture },
        cloud: buildCloudSummary(save),
        latestCodeAt: getLatestCodeAtForGame(game, p.email),
      });
      return;
    }

    if (req.method === 'POST' && routePath === '/auth/logout') {
      const cookies = parseCookies(req);
      if (cookies['mee_sid']) playerSessions.delete(cookies['mee_sid']);
      res.setHeader('Set-Cookie', 'mee_sid=; Path=/; Max-Age=0; SameSite=Lax');
      res.json({ ok: true });
      return;
    }

    // Cloud save GET (only called when auth/me indicates cloud save is newer or user manually restores)
    if (req.method === 'GET' && routePath === '/save') {
      if (!player) {
        res.status(401).json({ error: 'unauthorized', message: 'Chưa đăng nhập.' });
        return;
      }
      const save = playerSavesStore.find(s => s.playerId === player.id && s.game === game);
      if (!save) {
        res.json({ save: null });
        return;
      }
      res.json({
        save: {
          shopName: save.shopName,
          avatar: save.avatar,
          badge: save.badge || null,
          level: save.level,
          xp: save.xp,
          day: save.day,
          moneyEarned: save.moneyEarned,
          potsSold: save.potsSold,
          updatedAt: save.updatedAt,
          savedAt: Number(save.data?.savedAt || save.savedAt || save.updatedAt),
          data: save.data || {
            shopName: save.shopName,
            avatar: save.avatar,
            badge: save.badge || null,
            level: save.level,
            xp: save.xp,
            day: save.day,
            totalEarned: save.moneyEarned,
            totalSold: save.potsSold,
            savedAt: save.savedAt,
          },
        },
      });
      return;
    }

    // Cloud save PUT with conflict detection, backup throttling (6h / 3 game days), badge storage, and conditional anti-cheat
    if (req.method === 'PUT' && routePath === '/save') {
      if (!player) {
        res.status(401).json({ error: 'unauthorized', message: 'Chưa đăng nhập.' });
        return;
      }
      const b = req.body || {};
      const data = b.data && typeof b.data === 'object' ? b.data : {};
      const base = Number(b.base) || 0;
      const force = Boolean(b.force);

      const existing = playerSavesStore.find(s => s.playerId === player.id && s.game === game);

      // Multi-device conflict check: if cloud has a newer save than client's base and not forced
      if (existing && !force && base > 0 && existing.updatedAt > base + 1000) {
        res.status(409).json({
          error: 'conflict',
          message: 'Trên mây đang có bản lưu mới hơn từ thiết bị khác.',
          cloud: buildCloudSummary(existing),
        });
        return;
      }

      const now = Date.now();
      const day = Math.max(1, Number(data.day ?? b.day ?? existing?.day ?? 1));
      const level = Math.max(1, Number(data.level ?? b.level ?? existing?.level ?? 1));
      const xp = Math.max(0, Number(data.xp ?? b.xp ?? existing?.xp ?? 0));
      const moneyEarned = Math.max(
        0,
        Number(data.totalEarned ?? data.moneyEarned ?? b.moneyEarned ?? existing?.moneyEarned ?? 0)
      );
      const potsSold = Math.max(
        0,
        Number(data.totalSold ?? data.potsSold ?? b.potsSold ?? existing?.potsSold ?? 0)
      );
      const shopName = String(data.shopName ?? b.shopName ?? existing?.shopName ?? 'Xe Tiramisu').slice(0, 40);
      const avatar = Number(data.avatar ?? b.avatar ?? existing?.avatar ?? 0);
      // Server-side Optimization #2: Store badge directly on player_saves record
      const badge = data.badge !== undefined ? data.badge : existing?.badge ?? null;
      const savedAt = Number(data.savedAt || now);

      // Server-side Optimization #1: Only create a backup when previous backup is >= 6 hours old or >= 3 game days apart
      if (existing) {
        const playerBackups = saveBackupsStore
          .filter(bk => bk.playerId === player.id && bk.game === game)
          .sort((a, b2) => b2.createdAt - a.createdAt);
        const latestBackup = playerBackups[0];
        const SIX_HOURS = 6 * 3600 * 1000;
        const shouldBackup =
          !latestBackup ||
          now - latestBackup.createdAt >= SIX_HOURS ||
          Math.abs(existing.day - latestBackup.day) >= 3;

        if (shouldBackup) {
          saveBackupsStore.push({
            playerId: player.id,
            game,
            day: existing.day,
            level: existing.level,
            moneyEarned: existing.moneyEarned,
            potsSold: existing.potsSold,
            createdAt: now,
            data: existing.data,
          });
          // Keep at most 10 backups per (playerId, game)
          const allForPlayer = saveBackupsStore
            .map((bk, idx) => ({ bk, idx }))
            .filter(item => item.bk.playerId === player.id && item.bk.game === game)
            .sort((a, b2) => b2.bk.createdAt - a.bk.createdAt);
          if (allForPlayer.length > 10) {
            const toRemove = allForPlayer.slice(10).map(x => x.idx).sort((a, b2) => b2 - a);
            for (const remIdx of toRemove) {
              saveBackupsStore.splice(remIdx, 1);
            }
          }
        }
      }

      // Server-side Optimization #3: Only query gift code redemptions for anti-cheat when player redeemed a code since last save
      let giftMoneyAllowance = existing?.giftMoneyChecked ?? 0;
      if (!existing || player.lastRedeemAt > existing.updatedAt) {
        giftMoneyAllowance = redemptionsStore
          .filter(r => r.playerId === player.id && (r.game === game || r.game === '*'))
          .reduce((sum, r) => sum + (Number(r.money) || 0), 0);
      }

      const suspiciousJump =
        existing &&
        moneyEarned - existing.moneyEarned > 500000 + giftMoneyAllowance &&
        day - existing.day <= 1;

      if (existing) {
        existing.shopName = shopName;
        existing.avatar = avatar;
        existing.badge = badge;
        existing.level = level;
        existing.xp = xp;
        existing.day = day;
        existing.moneyEarned = moneyEarned;
        existing.potsSold = potsSold;
        existing.updatedAt = now;
        existing.savedAt = savedAt;
        existing.data = data;
        existing.giftMoneyChecked = giftMoneyAllowance;
        if (suspiciousJump) {
          existing.flagged = true;
          existing.flagReason = 'Tiền tăng nhanh bất thường';
        }
      } else {
        playerSavesStore.push({
          playerId: player.id,
          game,
          shopName,
          avatar,
          badge,
          level,
          xp,
          day,
          moneyEarned,
          potsSold,
          cheat: false,
          flagged: Boolean(suspiciousJump),
          flagReason: suspiciousJump ? 'Tiền tăng nhanh bất thường' : '',
          updatedAt: now,
          savedAt,
          data,
          giftMoneyChecked: giftMoneyAllowance,
        });
      }

      invalidateLauCache(`lb:${game}:`);
      res.json({ ok: true, updatedAt: now, savedAt });
      return;
    }

    // Redeem a gift code
    if (req.method === 'POST' && (routePath === '/code/redeem' || routePath === '/codes/redeem')) {
      if (!player) {
        res.status(401).json({ error: 'unauthorized', message: 'Bạn cần đăng nhập Google để đổi mã quà.' });
        return;
      }
      const rawCode = String(req.body?.code || '').trim().toUpperCase();
      if (!rawCode) {
        res.status(400).json({ error: 'invalid', message: 'Vui lòng nhập mã quà.' });
        return;
      }
      const codeObj = giftCodesStore.find(
        c => c.code === rawCode && (c.game === '*' || c.game === game)
      );
      if (!codeObj || codeObj.disabled) {
        res.status(404).json({ error: 'not_found', message: 'Mã quà không tồn tại hoặc đã ngưng.' });
        return;
      }
      if (codeObj.expiresAt && codeObj.expiresAt <= Date.now()) {
        res.status(400).json({ error: 'expired', message: 'Mã quà này đã hết hạn.' });
        return;
      }
      if (codeObj.maxUses && codeObj.uses >= codeObj.maxUses) {
        res.status(400).json({ error: 'exhausted', message: 'Mã quà này đã hết lượt nhận.' });
        return;
      }
      if (codeObj.forEmail && codeObj.forEmail.toLowerCase() !== player.email.toLowerCase()) {
        res.status(403).json({ error: 'forbidden', message: 'Mã quà này dành riêng cho tài khoản khác.' });
        return;
      }
      const already = redemptionsStore.some(
        r => r.playerId === player.id && r.code === codeObj.code
      );
      if (already) {
        res.status(409).json({ error: 'already_redeemed', message: 'Bạn đã nhận mã quà này rồi.' });
        return;
      }

      codeObj.uses += 1;
      const now = Date.now();
      player.lastRedeemAt = now;
      redemptionsStore.unshift({
        playerId: player.id,
        email: player.email,
        name: player.name,
        code: codeObj.code,
        game,
        money: codeObj.money,
        xp: codeObj.xp,
        createdAt: now,
      });
      invalidateLauCache(`codes:${game}`);
      res.json({
        ok: true,
        code: codeObj.code,
        money: codeObj.money,
        xp: codeObj.xp,
        note: codeObj.note,
      });
      return;
    }

    // Admin endpoints under /api/lau
    if (routePath.startsWith('/admin/')) {
      const admin = getAdminEmailFromReq(req);
      if (!admin) {
        res.status(401).json({ error: 'unauthorized', message: 'Phiên đăng nhập admin đã hết.' });
        return;
      }

      if (req.method === 'GET' && routePath === '/admin/codes') {
        res.json({ codes: giftCodesStore });
        return;
      }

      if (req.method === 'POST' && routePath === '/admin/codes') {
        const b = req.body || {};
        const code = String(b.code || '').trim().toUpperCase();
        if (code.length < 3) {
          res.status(400).json({ error: 'invalid', message: 'Mã cần ít nhất 3 ký tự.' });
          return;
        }
        if (giftCodesStore.some(c => c.code === code)) {
          res.status(409).json({ error: 'exists', message: 'Mã này đã có rồi.' });
          return;
        }
        const newCode = {
          code,
          game: b.game || '*',
          money: Number(b.money) || 0,
          xp: Number(b.xp) || 0,
          maxUses: b.maxUses ? Number(b.maxUses) : null,
          uses: 0,
          expiresAt: b.expiresAt ? Number(b.expiresAt) : null,
          disabled: false,
          note: b.note || '',
          createdAt: Date.now(),
          forEmail: b.forEmail || null,
        };
        giftCodesStore.unshift(newCode);
        invalidateLauCache('codes:');
        res.json({ code: newCode });
        return;
      }

      const codeMatch = routePath.match(/^\/admin\/codes\/([A-Za-z0-9_-]+)$/);
      if (codeMatch) {
        const targetCode = codeMatch[1].toUpperCase();
        if (req.method === 'GET') {
          const list = redemptionsStore.filter(r => r.code === targetCode);
          res.json({ redemptions: list });
          return;
        }
        if (req.method === 'POST') {
          const b = req.body || {};
          const idx = giftCodesStore.findIndex(c => c.code === targetCode);
          if (idx < 0) {
            res.status(404).json({ error: 'not_found', message: 'Không có mã này.' });
            return;
          }
          if (b.delete) {
            giftCodesStore.splice(idx, 1);
            invalidateLauCache('codes:');
            res.json({ ok: true });
            return;
          }
          if ('disabled' in b) {
            giftCodesStore[idx].disabled = Boolean(b.disabled);
            invalidateLauCache('codes:');
          }
          res.json({ code: giftCodesStore[idx] });
          return;
        }
      }

      if (req.method === 'GET' && routePath === '/admin/stats') {
        const saves = playerSavesStore.filter(s => s.game === game);
        const now = Date.now();
        const active1d = saves.filter(s => s.updatedAt > now - 86400000).length;
        const active7d = saves.filter(s => s.updatedAt > now - 7 * 86400000).length;
        const flagged = saves.filter(s => s.flagged).length;
        const cheat = saves.filter(s => s.cheat).length;
        const hidden = saves.filter(s => playersStore.find(p => p.id === s.playerId)?.hidden).length;
        const avgLevel = saves.length
          ? Math.round((saves.reduce((acc, s) => acc + s.level, 0) / saves.length) * 10) / 10
          : 0;
        const maxLevel = saves.length ? Math.max(...saves.map(s => s.level)) : 0;
        const moneyEarned = saves.reduce((acc, s) => acc + s.moneyEarned, 0);
        const potsSold = saves.reduce((acc, s) => acc + s.potsSold, 0);

        const bands = ['1–5', '6–10', '11–15', '16–20', '21–30', '31+'];
        const levels = bands.map(b => ({
          band: b,
          n: saves.filter(s => {
            if (b === '1–5') return s.level <= 5;
            if (b === '6–10') return s.level > 5 && s.level <= 10;
            if (b === '11–15') return s.level > 10 && s.level <= 15;
            if (b === '16–20') return s.level > 15 && s.level <= 20;
            if (b === '21–30') return s.level > 20 && s.level <= 30;
            return s.level > 30;
          }).length,
        }));

        const relevantCodes = giftCodesStore.filter(c => c.game === '*' || c.game === game);
        const codesLive = relevantCodes.filter(c => !c.disabled).length;
        const reds = redemptionsStore.filter(r => r.game === game);

        res.json({
          game,
          accounts: playersStore.length,
          saves: saves.length,
          active1d,
          active7d,
          flagged,
          cheat,
          hidden,
          avgLevel,
          maxLevel,
          moneyEarned,
          potsSold,
          levels,
          codes: relevantCodes.length,
          codesLive,
          redemptions: reds.length,
          redemptions7d: reds.length,
        });
        return;
      }

      if (req.method === 'GET' && routePath === '/admin/players') {
        const q = String(req.query.q || '').trim().toLowerCase();
        const filter = String(req.query.filter || 'all');
        const sort = String(req.query.sort || 'recent');

        let list = playerSavesStore
          .filter(s => s.game === game)
          .map(s => {
            const p = playersStore.find(x => x.id === s.playerId)!;
            return {
              id: p.id,
              email: p.email,
              name: p.name,
              picture: p.picture,
              hidden: p.hidden,
              createdAt: p.createdAt,
              lastLogin: p.lastLogin,
              shopName: s.shopName,
              badge: s.badge || null,
              level: s.level,
              xp: s.xp,
              day: s.day,
              moneyEarned: s.moneyEarned,
              potsSold: s.potsSold,
              cheat: s.cheat,
              flagged: s.flagged,
              flagReason: s.flagReason,
              updatedAt: s.updatedAt,
            };
          });

        if (filter === 'flagged') list = list.filter(x => x.flagged);
        else if (filter === 'hidden') list = list.filter(x => x.hidden);
        else if (filter === 'cheat') list = list.filter(x => x.cheat);

        if (q) {
          list = list.filter(
            x =>
              x.email.toLowerCase().includes(q) ||
              x.name.toLowerCase().includes(q) ||
              x.shopName.toLowerCase().includes(q) ||
              String(x.id) === q
          );
        }

        list.sort((a, b) => {
          if (sort === 'money') return b.moneyEarned - a.moneyEarned;
          if (sort === 'level') return b.level - a.level || b.xp - a.xp;
          if (sort === 'pots') return b.potsSold - a.potsSold;
          if (sort === 'new') return b.id - a.id;
          return b.updatedAt - a.updatedAt;
        });

        res.json({ total: list.length, players: list });
        return;
      }

      const playerMatch = routePath.match(/^\/admin\/players\/(\d+)$/);
      if (playerMatch) {
        const pid = Number(playerMatch[1]);
        const p = playersStore.find(x => x.id === pid);
        if (!p) {
          res.status(404).json({ error: 'not_found', message: 'Không tìm thấy người chơi này.' });
          return;
        }
        if (req.method === 'GET') {
          const saves = playerSavesStore.filter(s => s.playerId === pid);
          const backups = saveBackupsStore
            .filter(bk => bk.playerId === pid && (!req.query.g || bk.game === game))
            .sort((a, b2) => b2.createdAt - a.createdAt)
            .slice(0, 10);
          const reds = redemptionsStore.filter(r => r.playerId === pid);
          res.json({
            player: p,
            saves,
            backups,
            redemptions: reds,
          });
          return;
        }
        if (req.method === 'POST') {
          const b = req.body || {};
          if ('hidden' in b) p.hidden = Boolean(b.hidden);
          const save = playerSavesStore.find(s => s.playerId === pid && s.game === game);
          if (save) {
            if ('flagged' in b) {
              save.flagged = Boolean(b.flagged);
              save.flagReason = save.flagged ? 'Admin đánh dấu' : '';
            }
            if ('cheat' in b) save.cheat = Boolean(b.cheat);
          }
          if (b.deleteAccount) {
            const pIdx = playersStore.findIndex(x => x.id === pid);
            if (pIdx >= 0) playersStore.splice(pIdx, 1);
          }
          invalidateLauCache(`lb:${game}:`);
          res.json({ ok: true });
          return;
        }
      }
    }

    res.status(404).json({ error: 'not_found', message: 'Không có địa chỉ này.' });
  };

  app.all('/api/lau', handleLau);
  app.all('/api/lau/*splat', handleLau);

  // Serve static assets from public/
  const publicDir = path.join(__dirname, 'public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
  }

  // Vite middleware in dev or static dist in production
  const distDir = path.join(__dirname, 'dist');
  if (process.env.NODE_ENV === 'production' && fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*splat', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MeeGame server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

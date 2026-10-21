// v1.15 Vé số + Đoán số (Lẩu Ơi!). Mua vé từ cô bán vé số (vé có số 6 chữ số) và đặt cược Đoán số (2 số cuối).
// Hết ngày: quay kết quả. Người chơi tự dò từng vé rồi bấm Nhận thưởng (vé trúng để quá claimDays ngày thì hết hạn).
import * as C from '../config.js';
import { round2 } from './util.js';
import { fmtMoney } from './format.js';
import { addMoney, spend, featureUnlocked } from './economy.js';

const fail = (reason, msg) => ({ ok: false, reason, msg });
const LT = () => C.LOTTERY;
export function lot(s) {
  if (!s.lottery || typeof s.lottery !== 'object') s.lottery = {};
  const l = s.lottery;
  if (!(l.tickets >= 0)) l.tickets = 0;           // số vé mua HÔM NAY (giới hạn maxPerDay)
  if (!(l.bets >= 0)) l.bets = 0;                 // số lần cược hôm nay
  if (!Array.isArray(l.list)) l.list = [];        // [{ id, kind: 've' | 'cuoc', num, amount?, day, status, tier?, prize? }]
  if (!l.results || typeof l.results !== 'object') l.results = {};   // day → { db: ['123456'], nhat: [...], ... }
  if (!(l.nextId >= 1)) l.nextId = 1;
  return l;
}
const digits = (G, n) => { let t = ''; for (let i = 0; i < n; i++) t += String(G.rng.int(0, 9)); return t; };

/** Mua 1 vé từ cô bán vé số (cô phải đang đứng ở quán). */
export function buyTicket(G) {
  const s = G.state, w = G.world, L = lot(s), T = LT();
  if (!featureUnlocked(G, 'lottery')) return fail('locked', `Vé số mở ở Lv ${C.FEATURES.lottery} nha!`);
  if (!w || !w.veso || w.veso.leaving || w.veso.path) return fail('noLady', 'Cô bán vé số đi mất rồi.');
  if (L.tickets >= T.maxPerDay) return fail('max', `Mỗi ngày mua tối đa ${T.maxPerDay} tờ thôi nha.`);
  if (s.money + 1e-9 < T.ticketPrice) return fail('money', `Vé số ${fmtMoney(T.ticketPrice)} một tờ, chưa đủ tiền nha.`);
  spend(G, 'lottery', T.ticketPrice, 'lottery');
  L.tickets++;
  const it = { id: L.nextId++, kind: 've', num: digits(G, 6), day: s.day, status: 'wait' };
  L.list.unshift(it);
  return { ok: true, ticket: Object.assign({}, it), left: T.maxPerDay - L.tickets };
}

/** Giới hạn tiền cược lúc này. */
export function betLimit(G) {
  const g = LT().guess, s = G.state;
  return Math.max(0, Math.floor(Math.min(g.maxBet, s.money * g.maxShare)));
}

/** Đoán số: num = 0..99, amount (k). Kết quả tính theo 2 số cuối giải đặc biệt tối nay. */
export function placeBet(G, num, amount) {
  const s = G.state, L = lot(s), g = LT().guess;
  if (!featureUnlocked(G, 'lottery')) return fail('locked', `Xổ số mở ở Lv ${C.FEATURES.lottery} nha!`);
  if (s.phase === 'report') return fail('phase', 'Đã quay số rồi, mai cược tiếp nha.');
  if (L.bets >= g.maxBets) return fail('max', `Mỗi ngày đoán tối đa ${g.maxBets} lần thôi nha.`);
  const n = Math.floor(Number(num));
  if (!(n >= 0 && n <= 99)) return fail('num', 'Chọn một số từ 00 đến 99 nha.');
  const a = Math.floor(Number(amount));
  if (!(a >= 1)) return fail('amount', 'Chọn tiền cược trước nha.');
  const lim = betLimit(G);
  if (a > lim) return fail('amount', `Cược tối đa ${fmtMoney(lim)} (không quá ${Math.round(g.maxShare * 100)}% tiền đang có).`);
  spend(G, 'lottery', a, 'lottery');
  L.bets++;
  const it = { id: L.nextId++, kind: 'cuoc', num: String(n).padStart(2, '0'), amount: a, day: s.day, status: 'wait' };
  L.list.unshift(it);
  return { ok: true, bet: Object.assign({}, it) };
}

/** Giải cao nhất của một vé / phiếu cược với bảng kết quả r. */
export function prizeOf(it, r) {
  if (!r) return { tier: null, prize: 0 };
  if (it.kind === 'cuoc') {
    const hit = r.db && r.db[0] && r.db[0].slice(-2) === it.num;
    return hit ? { tier: 'doan', prize: it.amount * LT().guess.payout } : { tier: null, prize: 0 };
  }
  for (const t of LT().tiers) {
    const tail = it.num.slice(-t.digits);
    if ((r[t.id] || []).includes(tail)) return { tier: t.id, prize: t.prize };
  }
  return { tier: null, prize: 0 };
}

/** Cuối ngày: quay kết quả cho hôm nay, vé / phiếu hôm nay chuyển sang "chờ dò", dọn vé quá hạn. */
export function drawDay(G) {
  const s = G.state, L = lot(s), T = LT();
  const today = L.list.filter((x) => x.day === s.day && x.status === 'wait');
  const r = {};
  const used = new Set();   // v1.18: giải tư / giải năm (cùng 2 số) không trùng nhau
  for (const t of T.tiers) {
    r[t.id] = [];
    for (let i = 0; i < t.count; i++) {
      let n = digits(G, t.digits);
      for (let k = 0; k < 50 && used.has(t.digits + ':' + n); k++) n = digits(G, t.digits);
      used.add(t.digits + ':' + n); r[t.id].push(n);
    }
  }
  L.results[s.day] = r;
  for (const it of today) it.status = 'drawn';
  for (const d of Object.keys(L.results)) if (+d < s.day - T.keepDays) delete L.results[d];
  for (const it of L.list) if (it.status === 'drawn' || it.status === 'checked') {
    if (s.day - it.day >= T.claimDays) it.status = 'expired';
  }
  L.list = L.list.filter((it) => s.day - it.day < T.keepDays).slice(0, 80);
  const nT = today.filter((x) => x.kind === 've').length, nB = today.length - nT;
  L.tickets = 0; L.bets = 0;
  return { tickets: nT, bets: nB };
}

/** Dò một vé (hoặc tất cả: id = null). Trả về các vé vừa dò kèm giải. */
export function checkTickets(G, id = null) {
  const L = lot(G.state);
  const out = [];
  for (const it of L.list) {
    if (it.status !== 'drawn' || (id != null && it.id !== id)) continue;
    const p = prizeOf(it, L.results[it.day]);
    it.status = 'checked'; it.tier = p.tier; it.prize = p.prize;
    out.push(Object.assign({}, it));
  }
  if (!out.length) return fail('none', id != null ? 'Vé này dò rồi nha.' : 'Không còn vé nào chờ dò.');
  G.counter('lotteryChecked', out.length);
  return { ok: true, items: out, won: out.filter((x) => x.prize > 0).length };
}

/** Nhận thưởng một vé trúng (hoặc tất cả vé trúng đã dò: id = null). */
export function claimPrize(G, id = null) {
  const s = G.state, L = lot(s);
  let total = 0, n = 0;
  for (const it of L.list) {
    if (it.status !== 'checked' || !(it.prize > 0) || (id != null && it.id !== id)) continue;
    it.status = 'claimed';
    addMoney(G, it.prize, 'lottery');
    s.today.lotteryWon = round2((s.today.lotteryWon || 0) + it.prize);
    total += it.prize; n++;
  }
  if (!n) return fail('none', 'Không có vé trúng nào để nhận.');
  G.counter('lotteryWon', total);
  G.emit('lotteryPrize', { total, n });
  return { ok: true, total, n };
}

export function lotteryInfo(G) {
  const s = G.state, L = lot(s), T = LT();
  const days = [...new Set(L.list.map((x) => x.day))].filter((d) => L.results[d]).sort((a, b) => b - a);
  const list = L.list.map((it) => Object.assign({}, it, { claimBy: it.day + T.claimDays - 1 }));
  return {
    unlocked: featureUnlocked(G, 'lottery'), ticketPrice: T.ticketPrice, maxPerDay: T.maxPerDay, boughtToday: L.tickets,
    betsToday: L.bets, maxBets: T.guess.maxBets, payout: T.guess.payout, betLimit: betLimit(G), chips: T.guess.chips.slice(),
    tiers: T.tiers.map((t) => Object.assign({}, t)), results: Object.assign({}, L.results), days, list,
    waiting: list.filter((x) => x.status === 'drawn').length, unclaimed: list.filter((x) => x.status === 'checked' && x.prize > 0).length,
    ladyHere: !!(G.world && G.world.veso && !G.world.veso.leaving && !G.world.veso.path),
  };
}

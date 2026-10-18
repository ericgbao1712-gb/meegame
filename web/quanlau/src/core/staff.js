// Hiring board, candidates, staff levelling (TECH_SPEC §6.6).
import * as C from '../config.js';
import { clamp } from './util.js';
import { fmtMoney } from './format.js';
import { dirtyMods, staffSalary, spend, tierDef } from './economy.js';

const SC = C.STAFF;
const ROLE_BIAS = { phucvu: [1.4, 0.7, 1.2], daubep: [1.1, 1.6, 0.5], thungan: [0.8, 0.8, 1.6], quankho: [1, 1.2, 0.8] };
const fail = (reason, msg) => ({ ok: false, reason, msg });

export const roleUnlocked = (G, role) => !!SC.roles[role] && G.state.level >= SC.roles[role].unlockLv && G.state.tier >= SC.roles[role].minTier;
export const staffSlots = (G) => ({ used: G.state.staff.length, max: SC.slotsByTier[G.state.tier - 1] });
export const roleCount = (G, role) => G.state.staff.filter((m) => m.role === role).length;
export const candidatesOf = (G, role) => G.state.candidates.list.filter((c) => c.role === role);

function genCandidate(G, role, minRarity = 1) {
  const rng = G.rng, s = G.state;
  const rarity = rng.weighted([1, 2, 3, 4, 5], (r) => (r < minRarity ? 0 : SC.rarityWeights[r - 1])) || minRarity;
  const points = Math.max(3, SC.rarityPoints[rarity - 1] + rng.int(-2, 2));
  const st = [1, 1, 1];
  const bias = ROLE_BIAS[role] || [1, 1, 1];
  for (let left = points - 3; left > 0; left--) {
    const i = rng.weighted([0, 1, 2], (k) => (st[k] < 10 ? bias[k] : 0));
    if (i === undefined) break;
    st[i]++;
  }
  const lookSeed = rng.int(1, 999999);
  return {
    cid: s.nextCid++, role, name: rng.pick(SC.names), rarity, spd: st[0], skl: st[1], chm: st[2],
    trait: rng.chance(SC.traitChance) ? rng.pick(SC.traits).id : null,
    lvl: 1, jobs: 0, look: { lookSeed }, lookSeed, hiredDay: 0,
  };
}

/** Morning regeneration (all roles) and top-up when a role unlocks mid-run. */
export function genCandidates(G, force = false) {
  const s = G.state;
  if (force || s.candidates.day !== s.day) s.candidates = { day: s.day, list: [] };
  for (const role of Object.keys(SC.roles)) {
    if (!roleUnlocked(G, role)) continue;
    const have = candidatesOf(G, role).length;
    for (let i = have; i < 3; i++) s.candidates.list.push(genCandidate(G, role));
  }
}

export function refreshCandidates(G, role) {
  const s = G.state;
  if (!roleUnlocked(G, role)) return fail('locked', 'Vị trí này chưa mở nha.');
  let minR = 1, free = false;
  if (s.staffTickets > 0) { free = true; minR = 3; }
  else {
    const cost = SC.refreshCost(s.tier);
    if (s.money + 1e-9 < cost) return fail('money', `Làm mới cần ${fmtMoney(cost)} nha.`);
    spend(G, 'salary', cost, 'refresh');
  }
  if (free) s.staffTickets--;
  s.candidates.list = s.candidates.list.filter((c) => c.role !== role);
  for (let i = 0; i < 3; i++) s.candidates.list.push(genCandidate(G, role, minR));
  return { ok: true, usedTicket: free };
}

export function hire(G, role, idx) {
  const s = G.state;
  if (!SC.roles[role]) return fail('unknown', 'Không có vị trí này.');
  if (!roleUnlocked(G, role)) return fail('locked', `${SC.roles[role].name} mở ở Lv ${SC.roles[role].unlockLv}${SC.roles[role].minTier > s.tier ? ' và quán lớn hơn' : ''} nha!`);
  const list = candidatesOf(G, role);
  const cand = typeof idx === 'string' ? list.find((c) => String(c.cid) === idx) : list[idx];
  if (!cand) return fail('none', 'Chọn một ứng viên nha.');
  if (roleCount(G, role) >= SC.roles[role].max) return fail('roleMax', `Quán chỉ cần ${SC.roles[role].max} ${SC.roles[role].name.toLowerCase()} thôi nha.`);
  const sl = staffSlots(G);
  if (sl.used >= sl.max) return fail('slots', 'Hết chỗ rồi, mở rộng quán để thuê thêm nha.');
  const fee = staffSalary(G, cand) * SC.hireFeeDays;
  if (s.money + 1e-9 < fee) return fail('money', `Cần ${fmtMoney(fee)} (lương 1 ngày) để thuê nha.`);
  spend(G, 'salary', fee, 'hire');
  const m = { id: s.nextStaffId++, name: cand.name, role, rarity: cand.rarity, spd: cand.spd, skl: cand.skl, chm: cand.chm, trait: cand.trait,
    lvl: 1, jobs: 0, look: { lookSeed: cand.lookSeed }, lookSeed: cand.lookSeed, hiredDay: s.day };
  s.staff.push(m);
  s.candidates.list = s.candidates.list.filter((c) => c !== cand);
  dirtyMods(G);
  G.workersDirty = true;
  G.counter('hire:' + role, 1);
  G.counter('staffHired', 1);
  G.mom('firstStaff');
  G.emit('hired', { staff: m });
  G.toast(`${m.name} đã vào làm ${SC.roles[role].name.toLowerCase()}!`, 'good', SC.roles[role].icon);
  return { ok: true, staff: m, fee };
}

export function fire(G, staffId) {
  const s = G.state;
  const i = s.staff.findIndex((m) => m.id === staffId || String(m.id) === String(staffId));
  if (i < 0) return fail('none', 'Không tìm thấy nhân viên này.');
  const [m] = s.staff.splice(i, 1);
  dirtyMods(G);
  G.workersDirty = true;
  G.toast(`Đã cho ${m.name} nghỉ việc.`, 'info', 'ui_staff');
  return { ok: true };
}

/** One completed task. Levels the member up when the job threshold is reached. */
export function staffJob(G, m) {
  m.jobs = (m.jobs || 0) + 1;
  if (m.lvl >= 10) return;
  let need = SC.levelXp[m.lvl - 1];
  if (m.trait === 'chamchi') need *= 2;
  if (m.jobs < need) return;
  m.lvl++;
  const stats = ['spd', 'skl', 'chm'];
  let low = null;
  for (const k of stats) if (m[k] < 10 && (low === null || m[k] < m[low])) low = k;
  if (low) m[low] = clamp(m[low] + 1, 1, 10);
  G.emit('staffLevel', { staff: m, stat: low });
  G.toast(`${m.name} lên cấp ${m.lvl}!`, 'good', 'ui_up');
}

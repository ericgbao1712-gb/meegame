// Save storage (TECH_SPEC §8). Async API so the lead can swap in a cloud adapter with the same signatures.
// Every access is wrapped: private windows / blocked storage just behave as "no save".
const KEY = 'lau-oi/save/v1';

function store() {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch (e) { return null; }
}

/** Resolves to the saved object, or null when there is none / storage is unavailable / data is corrupt. */
export async function loadSave() {
  try {
    const ls = store();
    if (!ls) return null;
    const raw = ls.getItem(KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : null;
  } catch (e) {
    return null;
  }
}

/** Persist `obj`. The write itself happens synchronously (safe to call from pagehide). Resolves true on success. */
export async function writeSave(obj) {
  try {
    const ls = store();
    if (!ls) return false;
    ls.setItem(KEY, JSON.stringify(obj));
    return true;
  } catch (e) {
    return false;
  }
}

/** Delete the save. Resolves true when nothing is left behind. */
export async function clearSave() {
  try {
    const ls = store();
    if (!ls) return false;
    ls.removeItem(KEY);
    return true;
  } catch (e) {
    return false;
  }
}

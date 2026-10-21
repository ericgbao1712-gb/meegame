// v1.18d Thẻ thành tích (Hộp mù) dạng bảng tên: huy chương + hạng thẻ (N / R / SR / SSR) + tên.
// Thường (N) giấy, Hiếm (R) bạc xanh lấp lánh, Cực hiếm (SR) vàng có vệt sáng, Bí ẩn (SSR) cầu vồng chuyển màu.
import { span, ico } from './dom.js';
import * as C from '../config.js';

export const BADGE_TAG = ['', 'N', 'R', 'SR', 'SSR'];
/** id thẻ → phần tử bảng tên (null nếu không có thẻ) */
export function badgePlate(id, { big = false } = {}) {
  const b = id ? C.badgeOf(id) : null;
  if (!b) return null;
  const r = Math.max(1, Math.min(4, b.r | 0));
  return span('cl-badge b' + r + (big ? ' big' : ''),
    span('cb-medal', ico(b.icon, 16)),
    span('cb-tag', BADGE_TAG[r]),
    span('cb-name', b.name),
    r >= 2 ? span('cb-spark', span(''), span(''), span('')) : null);
}
/** lớp khung cho cả dòng trên bảng xếp hạng */
export const badgeRowCls = (id) => { const b = id ? C.badgeOf(id) : null; return b && b.r >= 2 ? ' bdg' + b.r : ''; };

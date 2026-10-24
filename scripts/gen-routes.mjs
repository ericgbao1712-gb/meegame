// Quét thư mục api/ theo quy tắc đặt tên file của Vercel rồi sinh worker/routes.generated.js.
// Chạy tự động mỗi lần build/deploy (xem "build.command" trong wrangler.jsonc). Không sửa file sinh ra bằng tay.
import { readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiDir = path.join(root, 'api');
const outFile = path.join(root, 'worker', 'routes.generated.js');

const seg = (name) => {
    let m;
    if ((m = /^\[\[\.\.\.(.+)\]\]$/.exec(name))) return { t: 'rest', v: m[1], optional: true };
    if ((m = /^\[\.\.\.(.+)\]$/.exec(name))) return { t: 'rest', v: m[1] };
    if ((m = /^\[(.+)\]$/.exec(name))) return { t: 'param', v: m[1] };
    return { t: 'static', v: name };
};

const found = [];
(function walk(dir, rel) {
    for (const e of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        if (e.name.startsWith('_') || e.name.startsWith('.')) continue;   // _db.js, _player.js… là file dùng chung, không phải route
        if (e.isDirectory()) { walk(path.join(dir, e.name), rel.concat(e.name)); continue; }
        const m = /^(.+)\.(m?js)$/.exec(e.name);
        if (!m) continue;
        const segs = rel.map(seg).concat(m[1] === 'index' ? [] : [seg(m[1])]);
        found.push({ segs, file: rel.concat(e.name).join('/') });
    }
})(apiDir, []);

const rank = (r) => (r.segs.some((s) => s.t === 'rest') ? 2 : r.segs.some((s) => s.t === 'param') ? 1 : 0);
found.sort((a, b) => rank(a) - rank(b) || b.segs.length - a.segs.length);

const lines = ['// FILE TỰ SINH bởi scripts/gen-routes.mjs — đừng sửa tay.'];
found.forEach((r, i) => lines.push(`import * as m${i} from '../api/${r.file}';`));
lines.push('export const routes = [');
found.forEach((r, i) => lines.push(`  { segs: ${JSON.stringify(r.segs)}, mod: m${i} },`));
lines.push('];', '');
writeFileSync(outFile, lines.join('\n'));
console.log(`[gen-routes] ${found.length} route(s):`, found.map((r) => '/api/' + r.segs.map((s) => (s.t === 'static' ? s.v : s.t === 'param' ? ':' + s.v : '...' + s.v)).join('/')).join('  '));

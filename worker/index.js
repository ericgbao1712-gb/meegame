// Cloudflare Worker cho MeeGame.
//  - /api/*        : chạy các hàm trong api/ (viết theo kiểu Vercel: handler(req, res)) qua một lớp chuyển đổi nhỏ.
//  - /admin/games  : rewrite sang web/game-admin.html (vercel.json cũ).
//  - còn lại       : file tĩnh trong web/ (Cloudflare tự phục vụ, miễn phí không giới hạn request).
import { routes } from './routes.generated.js';

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const jsonResponse = (status, data) => new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });

function matchRoute(parts) {
    for (const r of routes) {
        const query = {};
        let i = 0;
        let ok = true;
        for (const s of r.segs) {
            if (s.t === 'rest') {
                if (i >= parts.length && !s.optional) { ok = false; break; }
                query[s.v] = parts.slice(i);
                i = parts.length;
            } else if (i >= parts.length) { ok = false; break; }
            else if (s.t === 'param') { try { query[s.v] = decodeURIComponent(parts[i]); } catch { query[s.v] = parts[i]; } i++; }
            else if (s.v === parts[i]) i++;
            else { ok = false; break; }
        }
        if (ok && i === parts.length) return { mod: r.mod, query };
    }
    return null;
}

/** Dựng đối tượng req giống Node/Vercel: method, url, headers (chữ thường), query, body (đã parse JSON), và có thể `for await`. */
async function makeReq(request, url, search, query) {
    const headers = {};
    request.headers.forEach((v, k) => { headers[k] = v; });
    if (!headers.host) headers.host = url.host;
    let raw = new Uint8Array(0);
    if (request.method !== 'GET' && request.method !== 'HEAD') raw = new Uint8Array(await request.arrayBuffer());
    const q = {};
    for (const [k, v] of search) q[k] = k in q ? [].concat(q[k], v) : v;
    const req = {
        method: request.method,
        url: url.pathname + (search.toString() ? '?' + search.toString() : ''),
        headers,
        query: { ...q, ...query },
        async *[Symbol.asyncIterator]() { if (raw.length) yield Buffer.from(raw); },
    };
    if (raw.length) {
        const text = new TextDecoder().decode(raw);
        if ((headers['content-type'] || '').includes('application/json')) { try { req.body = JSON.parse(text); } catch { req.body = text; } }
        else req.body = text;
    }
    return req;
}

/** Dựng đối tượng res giống Node/Vercel; toResponse() đổi kết quả thành Response của Workers. */
function makeRes() {
    const headers = new Headers();
    const chunks = [];
    const enc = new TextEncoder();
    const st = { status: 200, ended: false };
    const put = (k, v) => {
        if (Array.isArray(v)) { headers.delete(k); v.forEach((x) => headers.append(k, String(x))); }
        else if (String(k).toLowerCase() === 'set-cookie') headers.append(k, String(v));
        else headers.set(k, String(v));
    };
    const add = (c) => { if (c == null) return; chunks.push(typeof c === 'string' ? enc.encode(c) : new Uint8Array(c)); };
    const res = {
        get statusCode() { return st.status; },
        set statusCode(v) { st.status = v; },
        get headersSent() { return st.ended; },
        setHeader(k, v) { put(k, v); return res; },
        getHeader(k) { return headers.get(k) ?? undefined; },
        removeHeader(k) { headers.delete(k); },
        writeHead(status, h) { st.status = status; if (h && typeof h === 'object') for (const [k, v] of Object.entries(h)) put(k, v); return res; },
        write(c) { add(c); return true; },
        end(c) { add(c); st.ended = true; return res; },
        status(n) { st.status = n; return res; },
        json(o) { if (!headers.has('content-type')) headers.set('Content-Type', 'application/json; charset=utf-8'); return res.end(JSON.stringify(o)); },
        send(b) { return res.end(typeof b === 'object' && b !== null && !(b instanceof Uint8Array) ? JSON.stringify(b) : b); },
    };
    res.toResponse = () => {
        const size = chunks.reduce((n, c) => n + c.length, 0);
        const body = new Uint8Array(size);
        let off = 0;
        for (const c of chunks) { body.set(c, off); off += c.length; }
        const noBody = st.status === 204 || st.status === 205 || st.status === 304;
        return new Response(noBody ? null : body, { status: st.status, headers });
    };
    return res;
}

async function handleApi(request, url) {
    let pathname = url.pathname.replace(/\/+$/, '') || '/';
    let search = new URLSearchParams(url.search);
    // vercel.json cũ: /api/lau/(.*) → /api/lau?r=$1
    const lau = pathname.match(/^\/api\/lau\/(.+)$/);
    if (lau) {
        const merged = new URLSearchParams();
        merged.set('r', lau[1]);
        for (const [k, v] of search) merged.append(k, v);
        pathname = '/api/lau';
        search = merged;
    }
    const hit = matchRoute(pathname.split('/').filter(Boolean).slice(1));
    if (!hit || typeof hit.mod.default !== 'function') return jsonResponse(404, { error: 'not_found', message: 'Không có địa chỉ này.' });
    const req = await makeReq(request, new URL(pathname, url), search, hit.query);
    const res = makeRes();
    try {
        await hit.mod.default(req, res);
        return res.toResponse();
    } catch (e) {
        console.error('[api] lỗi không bắt được:', pathname, e && e.stack || e);
        return jsonResponse(500, { error: 'server_error', message: 'Máy chủ gặp lỗi. Thử lại sau nha.' });
    }
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const p = url.pathname.replace(/\/+$/, '');
        if (p === '/admin/games') return env.ASSETS.fetch(new Request(new URL('/game-admin', url), request));
        if (p === '/api' || p.startsWith('/api/')) return handleApi(request, url);
        return env.ASSETS.fetch(request);
    },
};

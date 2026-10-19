import { sendJson, fail } from './_db.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  if (req.method !== 'POST') {
    return fail(res, 405, 'method_not_allowed', 'Phương thức không được hỗ trợ');
  }

  const jevKey = process.env.JEV_API_KEY;
  if (!jevKey) {
    return fail(res, 503, 'ai_off', 'Chưa bật AI.');
  }

  return sendJson(res, 200, { results: [] });
}

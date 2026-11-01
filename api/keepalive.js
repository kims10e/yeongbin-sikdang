const crypto = require('node:crypto');
const SB_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const sbHeaders = () => ({
  apikey: SB_KEY,
  ...(String(SB_KEY).startsWith('eyJ') ? { Authorization: `Bearer ${SB_KEY}` } : {}),
});
const same = (a, b) => {
  const h = (s) => crypto.createHash('sha256').update(String(s)).digest();
  return crypto.timingSafeEqual(h(a), h(b));
};

// 무료 Supabase는 7일 동안 쓰지 않으면 멈춘다. Vercel이 하루 한 번 불러 깨워 둔다(vercel.json의 crons).
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const secret = process.env.CRON_SECRET;
  if (secret && !same(req.headers.authorization || '', `Bearer ${secret}`)) return res.status(401).json({ error: '권한이 없어요.' });
  if (!SB_URL || !SB_KEY) return res.status(500).json({ error: 'Supabase 연결 정보가 없어요.' });
  const r = await fetch(`${SB_URL}/rest/v1/inquiries?select=id&limit=1`, { headers: sbHeaders() });
  if (!r.ok) return res.status(502).json({ error: '데이터베이스에 닿지 못했어요.' });
  return res.status(200).json({ ok: true });
};

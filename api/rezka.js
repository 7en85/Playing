const MIRRORS = [
  'https://hdrezka.ag',
  'https://rezka.ag',
  'https://hdrezka.fans',
  'https://hdrezka.video',
  'https://hdrezka.style',
  'https://hdrezka.ax',
  'https://hdrezkaonline.net',
  'https://hdrzk.org',
  'https://rezkify.com',
  'https://hdrezka.name',
  'https://hdrezka.info',
  'https://hdrezka.website'
];

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
};

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
}

async function tryMirror(mirror, path, method, body) {
  const url = mirror + path;
  const opts = {
    method,
    headers: { ...HEADERS, 'Referer': mirror + '/', 'Origin': mirror },
  };
  if (method === 'POST' && body) {
    opts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    opts.headers['X-Requested-With'] = 'XMLHttpRequest';
    opts.body = body;
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(url, { ...opts, signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) return null;
    const text = await r.text();
    return { text, mirror };
  } catch (e) {
    clearTimeout(timer);
    return null;
  }
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { path = '/', mirror } = req.query;
  const postBody = req.method === 'POST'
    ? (typeof req.body === 'string' ? req.body : new URLSearchParams(req.body).toString())
    : null;
  const method = req.method === 'POST' ? 'POST' : 'GET';

  const mirrorsToTry = mirror ? [mirror] : MIRRORS;

  for (const m of mirrorsToTry) {
    const result = await tryMirror(m, path, method, postBody);
    if (result) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('X-Used-Mirror', result.mirror);
      return res.status(200).send(result.text);
    }
  }

  return res.status(502).json({ error: 'All mirrors down', tried: mirrorsToTry.length });
}

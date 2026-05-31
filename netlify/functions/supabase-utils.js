const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

function json(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    },
    body: JSON.stringify(data)
  };
}

function configured() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

async function sb(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!response.ok) {
    throw new Error(typeof data === 'string' ? data : JSON.stringify(data));
  }
  return data;
}

async function getOrCreateStudent(user = {}) {
  const email = String(user.email || 'guest@demo.local').toLowerCase();
  const existing = await sb(`students?email=eq.${encodeURIComponent(email)}&limit=1`);
  if (existing && existing.length) return existing[0];

  const inserted = await sb('students', {
    method: 'POST',
    body: JSON.stringify({
      name: user.name || 'Demo User',
      email,
      role: user.role || 'student'
    })
  });
  return inserted[0];
}

module.exports = { json, configured, sb, getOrCreateStudent };

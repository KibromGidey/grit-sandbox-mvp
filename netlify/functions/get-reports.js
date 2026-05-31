const { json, configured, sb, getOrCreateStudent } = require('./supabase-utils');

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  if (!configured()) return json(200, { cloudReports: [], message: 'Supabase environment variables are not configured.' });

  try {
    const email = event.queryStringParameters?.email || 'guest@demo.local';
    const name = event.queryStringParameters?.name || 'Demo User';
    const role = event.queryStringParameters?.role || 'student';
    const student = await getOrCreateStudent({ email, name, role });
    const rows = await sb(`reports?student_id=eq.${student.id}&order=created_at.desc&limit=25`);
    const cloudReports = rows.map(row => {
      try { return JSON.parse(row.analysis); }
      catch { return { id: row.id, title: 'Saved Report', createdAt: row.created_at, outputs: [{ title: 'Analysis', text: row.analysis || '' }] }; }
    });
    return json(200, { cloudReports });
  } catch (error) {
    return json(500, { cloudReports: [], error: error.message });
  }
};

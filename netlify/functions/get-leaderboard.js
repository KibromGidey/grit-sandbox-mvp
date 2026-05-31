const { json, configured, sb } = require('./supabase-utils');

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  if (!configured()) return json(200, { cloudLeaderboard: [], message: 'Supabase environment variables are not configured.' });

  try {
    const students = await sb('students?select=id,name,email,role');
    const verifications = await sb('verifications?select=student_id,skill,tokens_awarded');
    const totals = new Map();
    for (const v of verifications) {
      const entry = totals.get(v.student_id) || { tokens: 0, count: 0 };
      entry.tokens += Number(v.tokens_awarded || 0);
      entry.count += 1;
      totals.set(v.student_id, entry);
    }
    const cloudLeaderboard = students.map(s => {
      const entry = totals.get(s.id) || { tokens: 0, count: 0 };
      return { user: s, tokens: entry.tokens, count: entry.count };
    }).filter(r => r.tokens > 0).sort((a, b) => b.tokens - a.tokens).slice(0, 10);
    return json(200, { cloudLeaderboard });
  } catch (error) {
    return json(500, { cloudLeaderboard: [], error: error.message });
  }
};

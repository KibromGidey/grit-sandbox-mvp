const { json, configured, sb, getOrCreateStudent } = require('./supabase-utils');

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  if (!configured()) return json(200, { cloudSaved: false, message: 'Supabase environment variables are not configured.' });

  try {
    const body = JSON.parse(event.body || '{}');
    const user = body.user || {};
    const verification = body.verification || {};
    const student = await getOrCreateStudent(user);

    const inserted = await sb('verifications', {
      method: 'POST',
      body: JSON.stringify({
        student_id: student.id,
        skill: verification.skill || '',
        verifier: verification.role || 'verifier',
        tokens_awarded: verification.reward || 0
      })
    });

    return json(200, { cloudSaved: true, verification: inserted[0] });
  } catch (error) {
    return json(500, { cloudSaved: false, error: error.message });
  }
};

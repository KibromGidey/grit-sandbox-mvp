const { json, configured, sb, getOrCreateStudent } = require('./supabase-utils');

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  if (!configured()) return json(200, { cloudSaved: false, message: 'Supabase environment variables are not configured.' });

  try {
    const body = JSON.parse(event.body || '{}');
    const user = body.user || body.owner || {};
    const report = body.report || {};
    const student = await getOrCreateStudent(user);

    const inserted = await sb('reports', {
      method: 'POST',
      body: JSON.stringify({
        student_id: student.id,
        resume_text: body.resume || report.resumePreview || '',
        job_description: body.job || report.jobPreview || '',
        analysis: JSON.stringify(report)
      })
    });

    return json(200, { cloudSaved: true, report: inserted[0] });
  } catch (error) {
    return json(500, { cloudSaved: false, error: error.message });
  }
};

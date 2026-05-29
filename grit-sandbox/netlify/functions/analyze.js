exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const { resume, jobDescription } = JSON.parse(event.body || '{}');
    if (!resume || !jobDescription) {
      return json(400, { error: 'Resume and job description are required.' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return json(500, { error: 'OPENAI_API_KEY is not configured.' });
    }

    const prompt = `You are the Translator, Talent, and Curriculum agents of the GRIT/GIVT Sandbox MVP.

Analyze the student's resume/profile against the target job description.

Return a clear report with these headings:
1. Student Current Skills
2. Job Required Skills
3. Skill Gaps
4. Job Readiness Score out of 100
5. Recommended Learning Path
6. Suggested Portfolio Projects
7. Resume Improvement Suggestions

Student resume/profile:
${resume}

Target job description:
${jobDescription}`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful AI career-readiness and skill-gap analysis assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      })
    });

    const data = await aiResponse.json();
    if (!aiResponse.ok) {
      return json(aiResponse.status, { error: data.error?.message || 'AI request failed.' });
    }

    const report = data.choices?.[0]?.message?.content || 'No report generated.';
    return json(200, { report });
  } catch (error) {
    return json(500, { error: error.message || 'Server error.' });
  }
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

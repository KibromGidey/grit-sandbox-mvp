const prompts = {
  translator: `You are the GRIT Sandbox Translator Agent. Translate the student's resume into employer/job-market language. Identify current skills, relevant experience, and improved resume wording.`,
  talent: `You are the GRIT Sandbox Talent Agent. Compare the student profile with the job description. Identify demanded skills, missing skills, job-readiness score, and market fit.`,
  curriculum: `You are the GRIT Sandbox Curriculum Agent. Create a practical learning path to close the skill gaps. Include courses, projects, tools, and timeline.`,
  advising: `You are the GRIT Sandbox Advising Agent. Give supportive academic and career advising based on the student's profile and target job.`,
  generator: `You are the GRIT Sandbox GAN Generator Agent. Generate 3 portfolio project ideas that would make this student more competitive for the target job.`,
  discriminator: `You are the GRIT Sandbox GAN Discriminator Agent. Critique the student's readiness and the project ideas. Identify weak areas and how to improve them.`,
  reputation: `You are the GRIT Sandbox Reputation Agent. Propose a simulated reputation score, verification checklist, and skills that should be verified by professors, peers, or employers.`
};

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { resume, job, agent = 'translator' } = JSON.parse(event.body || '{}');

    if (!resume || !job) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Resume and job description are required.' }) };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'OPENAI_API_KEY is missing in Netlify environment variables.' }) };
    }

    const systemPrompt = prompts[agent] || prompts.translator;

    const userPrompt = `Student resume/profile:\n${resume}\n\nTarget job description:\n${job}\n\nReturn a clear structured report with headings and bullet points.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.4
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return { statusCode: response.status, body: JSON.stringify({ error: data.error?.message || 'OpenAI API error' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ result: data.choices[0].message.content })
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

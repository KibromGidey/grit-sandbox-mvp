exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const resume = body.resume || body.profile || body.studentProfile || '';
    const jobDescription = body.jobDescription || body.job || body.jd || '';
    const agent = body.agent || 'translator';

    if (!resume.trim() || !jobDescription.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Please provide both resume/profile text and job description text.' })
      };
    }

    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 200,
        body: JSON.stringify({ result: getDemoResponse(agent), demoMode: true })
      };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: getSystemPrompt(agent) },
          { role: 'user', content: `Student resume/profile:\n${resume}\n\nTarget job description:\n${jobDescription}\n\nReturn a clear structured report with headings and bullet points.` }
        ],
        temperature: 0.4
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return { statusCode: response.status, body: JSON.stringify({ error: data.error?.message || 'OpenAI API error' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ result: data.choices?.[0]?.message?.content || 'No result returned.', demoMode: false }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

function getSystemPrompt(agent) {
  const prompts = {
    translator: 'You are the GRIT Sandbox Translator Agent. Translate the student profile into employer/job-market language. Identify current skills, relevant experience, and improved resume wording.',
    talent: 'You are the GRIT Sandbox Talent Agent. Compare the student profile with the job description. Identify demanded skills, missing skills, job-readiness score, and market fit.',
    curriculum: 'You are the GRIT Sandbox Curriculum Agent. Create a practical learning path to close the skill gaps. Include courses, projects, tools, and timeline.',
    advising: 'You are the GRIT Sandbox Advising Agent. Give supportive academic and career advising based on the student profile and target job.',
    generator: 'You are the GRIT Sandbox GAN Generator Agent. Generate portfolio project ideas that would make this student more competitive for the target job.',
    discriminator: 'You are the GRIT Sandbox GAN Discriminator Agent. Critique readiness and project ideas. Identify weak areas and how to improve them.',
    reputation: 'You are the GRIT Sandbox Reputation Agent. Propose a simulated reputation score, verification checklist, and skills that should be verified by professors, peers, or employers.'
  };
  return prompts[agent] || prompts.translator;
}

function getDemoResponse(agent) {
  const demoResponses = {
    translator: `🟡 DEMO MODE - Translator Agent\n\nStudent Skills Identified:\n- Python programming\n- SQL and database management\n- Basic web development\n- Data analysis with Excel/Pandas\n- Machine learning project experience\n\nSkill Gaps:\n- Power BI\n- Tableau\n- Applied statistics\n- Dashboard storytelling\n\nResume Improvement Suggestions:\n- Add measurable project outcomes.\n- Highlight data visualization experience.\n- Add portfolio links.`,
    talent: `🟡 DEMO MODE - Talent Agent\n\nIn-Demand Skills:\n- SQL\n- Python\n- Power BI\n- Tableau\n- Excel\n- Data visualization\n- Communication\n\nMarket Fit:\nThe student is a good entry-level match but needs stronger BI tool evidence.`,
    curriculum: `🟡 DEMO MODE - Curriculum Agent\n\nLearning Path:\nWeek 1-2: Power BI basics and dashboard creation.\nWeek 3-4: Tableau or advanced visualization.\nWeek 5-6: Statistics for analysts.\nWeek 7-8: Portfolio project published on GitHub.`,
    advising: `🟡 DEMO MODE - Advising Agent\n\nPriority Actions:\n1. Build one dashboard project.\n2. Add Power BI or Tableau to the resume.\n3. Practice explaining insights.\n4. Apply for junior analyst or BI assistant roles.`,
    generator: `🟡 DEMO MODE - GAN Generator Agent\n\nProject Ideas:\n1. Student Performance Analytics Dashboard.\n2. Healthcare Appointment No-Show Dashboard.\n3. Job Market Skill Tracker.\n\nBest Choice: Job Market Skill Tracker because it directly supports GRIT Sandbox.`,
    discriminator: `🟡 DEMO MODE - GAN Discriminator Agent\n\nCritique:\nThe student has good foundations but lacks visible proof of BI skills.\n\nImprove by adding dashboard screenshots, GitHub links, project outcomes, and business explanations.`,
    reputation: `🟡 DEMO MODE - Reputation Agent\n\nJob Readiness Score: 72/100\n\nReady for Verification:\n- Python\n- SQL\n- Data analysis\n\nNeeds More Evidence:\n- Power BI\n- Tableau\n- Statistics\n\nSimulated OEF Recommendation: 300 OEF after verification of Python, SQL, and dashboard skills.`
  };
  return demoResponses[agent] || demoResponses.translator;
}

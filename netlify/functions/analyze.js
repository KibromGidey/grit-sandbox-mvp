exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");

    const resume = body.resume || "";
    const jobDescription = body.jobDescription || "";
    const agent = body.agent || "translator";

    if (!resume.trim() || !jobDescription.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Please provide both resume/profile text and job description text.",
        }),
      };
    }

    // DEMO MODE: works even when no OpenAI API key is configured.
    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          result: getDemoResponse(agent, resume, jobDescription),
          demoMode: true,
        }),
      };
    }

    const prompt = buildPrompt(agent, resume, jobDescription);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are GRIT Sandbox, an AI career-readiness assistant. Give structured, practical, student-friendly outputs.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: "OpenAI API request failed.",
          details: errorText,
        }),
      };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        result: data.choices?.[0]?.message?.content || "No result returned.",
        demoMode: false,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Server error.",
        details: error.message,
      }),
    };
  }
};

function buildPrompt(agent, resume, jobDescription) {
  const agentInstructions = {
    translator: `
You are the Translator Agent.
Translate the student's resume/profile into employer-friendly language.
Extract current skills, experiences, strengths, and weaknesses.
Compare the student profile with the job description.
`,

    talent: `
You are the Talent Agent.
Identify the job-market skills demanded by the job description.
Classify the required skills into technical, analytical, communication, and domain skills.
`,

    curriculum: `
You are the Curriculum Agent.
Create a learning path to close the student's skill gaps.
Recommend courses, topics, certifications, and practice projects.
`,

    advising: `
You are the Advising Agent.
Give personalized academic and career advice to help the student become job-ready.
Prioritize practical next steps.
`,

    generator: `
You are the GAN Generator Agent.
Generate project ideas the student can build to prove readiness for the target job.
Each project should be realistic, portfolio-worthy, and connected to the job description.
`,

    discriminator: `
You are the GAN Discriminator Agent.
Critique the student's readiness and the proposed project direction.
Identify weaknesses, risks, missing evidence, and how to improve.
`,

    reputation: `
You are the Reputation Agent.
Create a simple reputation and verification profile.
Suggest which skills should be verified by professors, employers, advisors, or peers.
Estimate a job-readiness score out of 100.
`,
  };

  return `
${agentInstructions[agent] || agentInstructions.translator}

Student Resume/Profile:
${resume}

Target Job Description:
${jobDescription}

Return the answer with clear headings and bullet points.
`;
}

function getDemoResponse(agent, resume, jobDescription) {
  const demoResponses = {
    translator: `
🟡 DEMO MODE — Translator Agent

## Student Skills Identified
- Python programming
- SQL and database management
- Basic web development
- Data analysis with Excel/Pandas
- Machine learning project experience
- Research and problem-solving

## Job Requirements Identified
- Python
- SQL
- Power BI or Tableau
- Data visualization
- Statistics
- Communication skills
- Business reporting

## Skill Match
The student already matches several core requirements, especially Python, SQL, and data analysis.

## Skill Gaps
- Power BI
- Tableau
- Applied statistics
- Dashboard storytelling
- Business presentation skills

## Resume Improvement Suggestions
- Add measurable project outcomes.
- Highlight data visualization experience.
- Add a portfolio link.
- Use job-market language such as "business intelligence," "dashboard development," and "decision support."
`,

    talent: `
🟡 DEMO MODE — Talent Agent

## In-Demand Skills for This Job
### Technical Skills
- SQL
- Python
- Power BI
- Tableau
- Excel

### Analytical Skills
- Data cleaning
- Exploratory data analysis
- Statistical reasoning
- Dashboard interpretation

### Communication Skills
- Presenting findings
- Writing concise reports
- Explaining insights to non-technical users

## Market Interpretation
This role is suitable for an entry-level data analyst profile, but the student should strengthen BI tools and statistical analysis.
`,

    curriculum: `
🟡 DEMO MODE — Curriculum Agent

## Recommended Learning Path

### Week 1–2: Business Intelligence Basics
- Learn Power BI fundamentals.
- Build simple dashboards using Excel or CSV data.

### Week 3–4: Tableau or Advanced Visualization
- Create charts and dashboards.
- Practice visual storytelling.

### Week 5–6: Statistics for Data Analysts
- Descriptive statistics
- Correlation
- Hypothesis testing
- Regression basics

### Week 7–8: Portfolio Project
Build a complete dashboard project and publish it on GitHub.
`,

    advising: `
🟡 DEMO MODE — Advising Agent

## Career Advice
The student should target junior data analyst, BI assistant, or research data assistant roles.

## Priority Actions
1. Build one strong dashboard project.
2. Add Power BI or Tableau to the resume.
3. Improve statistical analysis confidence.
4. Prepare a short portfolio explanation.
5. Practice explaining insights clearly.

## Suggested Next Step
Create a project titled "Student Performance Dashboard" or "Healthcare Service Analytics Dashboard."
`,

    generator: `
🟡 DEMO MODE — GAN Generator Agent

## Portfolio Project Ideas

### Project 1: Student Performance Analytics Dashboard
Analyze student grades, attendance, and demographic factors to identify academic risk patterns.

### Project 2: Healthcare Appointment No-Show Dashboard
Analyze patient appointment data to predict and explain no-show behavior.

### Project 3: Job Market Skill Tracker
Scrape or collect job descriptions and visualize the most demanded data skills.

## Best Project Choice
The Job Market Skill Tracker best matches the GRIT Sandbox idea and demonstrates direct career-readiness.
`,

    discriminator: `
🟡 DEMO MODE — GAN Discriminator Agent

## Readiness Critique
The student has a good foundation but lacks visible proof of business intelligence skills.

## Weaknesses
- No Power BI/Tableau evidence
- Limited statistics evidence
- Projects need measurable outcomes
- Resume could be more employer-focused

## Improvement Recommendations
- Add screenshots of dashboards.
- Include GitHub links.
- Quantify project results.
- Practice explaining project business value.
`,

    reputation: `
🟡 DEMO MODE — Reputation Agent

## Job Readiness Score
72/100

## Verified Strengths
- Python: ready for verification
- SQL: ready for verification
- Data analysis: ready for verification
- Machine learning basics: partially ready

## Skills Needing Verification
- Power BI
- Tableau
- Statistics
- Business communication

## Suggested Verifiers
- Professor: Python, SQL, statistics
- Employer/supervisor: communication and professionalism
- Peer: teamwork and project contribution
- Advisor: career-readiness progress

## Simulated OEF Token Recommendation
Award 300 OEF after verification of Python, SQL, and dashboard project skills.
`,
  };

  return demoResponses[agent] || demoResponses.translator;
}
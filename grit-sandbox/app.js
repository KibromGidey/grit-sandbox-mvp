const resumeEl = document.getElementById('resume');
const jobEl = document.getElementById('jobDescription');
const analyzeBtn = document.getElementById('analyzeBtn');
const demoBtn = document.getElementById('demoBtn');
const statusEl = document.getElementById('status');
const reportEl = document.getElementById('report');

function setStatus(message, show = true) {
  statusEl.textContent = message;
  statusEl.classList.toggle('hidden', !show);
}

function setReport(text) {
  reportEl.textContent = text;
  reportEl.classList.remove('empty');
}

analyzeBtn.addEventListener('click', async () => {
  const resume = resumeEl.value.trim();
  const jobDescription = jobEl.value.trim();

  if (!resume || !jobDescription) {
    setStatus('Please paste both a resume/profile and a job description.');
    return;
  }

  analyzeBtn.disabled = true;
  setStatus('Analyzing skill gap...');
  setReport('Working...');

  try {
    const response = await fetch('/.netlify/functions/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume, jobDescription })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Analysis failed.');

    setStatus('Analysis complete.');
    setReport(data.report);
  } catch (error) {
    setStatus('Using demo fallback because the AI service is not configured or failed.');
    setReport(`DEMO REPORT\n\n1. Current Skills\n- Communication\n- Basic technical knowledge\n- Academic project experience\n\n2. Missing Skills\n- Tools and technologies named in the job description\n- Evidence of applied experience\n- Stronger achievement-based resume language\n\n3. Job Readiness Score\n65/100\n\n4. Recommended Learning Path\n- Complete one project aligned with the target job\n- Add measurable outcomes to resume bullets\n- Build a portfolio section\n\n5. Resume Improvement\nRewrite duties as achievements and include tools, results, and impact.\n\nTechnical note: ${error.message}`);
  } finally {
    analyzeBtn.disabled = false;
  }
});

demoBtn.addEventListener('click', () => {
  resumeEl.value = `BSc student with experience in information systems, database design, academic research, teamwork, and basic Python. Completed a class project on student record management. Interested in AI and digital transformation.`;
  jobEl.value = `Junior AI/Information Systems Analyst. Requirements: Python, SQL, data analysis, dashboard development, problem solving, communication, documentation, and experience with machine learning concepts.`;
  setStatus('Sample loaded. Click Analyze Skill Gap.');
});

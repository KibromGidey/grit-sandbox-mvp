const resumeEl = document.getElementById('resume');
const jobEl = document.getElementById('job');
const resultsEl = document.getElementById('results');
const statusEl = document.getElementById('status');
const runAllBtn = document.getElementById('runAllBtn');
const clearBtn = document.getElementById('clearBtn');
const saveReportBtn = document.getElementById('saveReportBtn');
const downloadReportBtn = document.getElementById('downloadReportBtn');
const historyListEl = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

const userNameEl = document.getElementById('userName');
const userEmailEl = document.getElementById('userEmail');
const userRoleEl = document.getElementById('userRole');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loggedOutBox = document.getElementById('loggedOutBox');
const loggedInBox = document.getElementById('loggedInBox');
const profileNameEl = document.getElementById('profileName');
const profileEmailEl = document.getElementById('profileEmail');
const profileRoleEl = document.getElementById('profileRole');
const avatarEl = document.getElementById('avatar');
const dashboardTitleEl = document.getElementById('dashboardTitle');
const dashboardContentEl = document.getElementById('dashboardContent');

const USER_KEY = 'gritSandboxDemoUser';
const REPORTS_KEY = 'gritSandboxSavedReportsByUser';
let currentReport = [];

const agentLabels = {
  translator: 'Translator Agent',
  talent: 'Talent Agent',
  curriculum: 'Curriculum Agent',
  advising: 'Advising Agent',
  generator: 'GAN Generator Agent',
  discriminator: 'GAN Discriminator Agent',
  reputation: 'Reputation Agent'
};

const dashboards = {
  student: [
    'Run all 7 agents using your resume and target job description.',
    'Save your multi-agent report after the workflow completes.',
    'Use the recommendations to build portfolio projects and close skill gaps.'
  ],
  advisor: [
    'Review student readiness reports and learning path recommendations.',
    'Use the Advising Agent output to guide mentoring conversations.',
    'Suggest courses, certifications, and projects based on gaps.'
  ],
  verifier: [
    'Review evidence of student skills from reports and projects.',
    'Identify skills that are ready for verification.',
    'Prepare feedback that can later become reputation evidence.'
  ],
  admin: [
    'Monitor demo usage and saved report flow.',
    'Prepare next implementation step: Supabase/Auth0 real accounts.',
    'Review which features are ready for professor demonstration.'
  ]
};

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

function setCurrentUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function getUserId() {
  const user = getCurrentUser();
  return user ? user.email.toLowerCase() : 'guest';
}

function getSavedReportsStore() {
  try {
    return JSON.parse(localStorage.getItem(REPORTS_KEY) || '{}');
  } catch {
    return {};
  }
}

function setSavedReportsStore(store) {
  localStorage.setItem(REPORTS_KEY, JSON.stringify(store));
}

function getSavedReports() {
  const store = getSavedReportsStore();
  return store[getUserId()] || [];
}

function setSavedReports(reports) {
  const store = getSavedReportsStore();
  store[getUserId()] = reports;
  setSavedReportsStore(store);
}

function login() {
  const name = userNameEl.value.trim() || 'Demo User';
  const email = userEmailEl.value.trim() || `${Date.now()}@demo.local`;
  const role = userRoleEl.value;
  setCurrentUser({ name, email, role, createdAt: new Date().toISOString() });
  renderUser();
  renderHistory();
}

function logout() {
  localStorage.removeItem(USER_KEY);
  currentReport = [];
  resultsEl.innerHTML = '<p>Agent outputs will appear here.</p>';
  renderUser();
  renderHistory();
}

function renderUser() {
  const user = getCurrentUser();
  if (!user) {
    loggedOutBox.classList.remove('hidden');
    loggedInBox.classList.add('hidden');
    dashboardTitleEl.textContent = 'Demo Dashboard';
    dashboardContentEl.innerHTML = '<p class="small">Start a demo session to see role-based guidance. This is not real authentication yet; it is a Phase 4 placeholder before Supabase/Auth0.</p>';
    return;
  }

  loggedOutBox.classList.add('hidden');
  loggedInBox.classList.remove('hidden');
  profileNameEl.textContent = user.name;
  profileEmailEl.textContent = user.email;
  profileRoleEl.textContent = titleCase(user.role);
  avatarEl.textContent = user.name.charAt(0).toUpperCase();
  dashboardTitleEl.textContent = `${titleCase(user.role)} Dashboard`;

  const points = dashboards[user.role] || dashboards.student;
  dashboardContentEl.innerHTML = `
    <ul>${points.map(point => `<li>${escapeHtml(point)}</li>`).join('')}</ul>
    <p class="small"><strong>Note:</strong> This phase simulates login with browser storage. The next upgrade can replace it with Supabase/Auth0 while keeping the same role structure.</p>
  `;
}

function titleCase(text) {
  return String(text).charAt(0).toUpperCase() + String(text).slice(1);
}

async function runAgent(agent) {
  const resume = resumeEl.value.trim();
  const job = jobEl.value.trim();

  if (!resume || !job) {
    alert('Please paste both a resume/profile and a job description.');
    return;
  }

  statusEl.textContent = `Running ${agentLabels[agent]}...`;

  const user = getCurrentUser();
  const response = await fetch('/.netlify/functions/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume, job, jobDescription: job, agent, user })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong.');
  }

  addResult(agentLabels[agent], data.result);
  currentReport.push({ agent, title: agentLabels[agent], text: data.result });
  statusEl.textContent = `${agentLabels[agent]} finished.${data.demoMode ? ' Demo mode is active.' : ''}`;
}

function addResult(title, text) {
  if (resultsEl.textContent.includes('Agent outputs will appear here')) {
    resultsEl.innerHTML = '';
  }
  const div = document.createElement('div');
  div.className = 'agent-output';
  div.innerHTML = `<h3>${title}</h3><div>${escapeHtml(text)}</div>`;
  resultsEl.appendChild(div);
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
    .replaceAll('\n', '<br>');
}

function saveCurrentReport() {
  const resume = resumeEl.value.trim();
  const job = jobEl.value.trim();
  const user = getCurrentUser();

  if (!user) {
    alert('Start a demo user session before saving a report.');
    return;
  }

  if (!currentReport.length) {
    alert('Run at least one agent before saving a report.');
    return;
  }

  const saved = getSavedReports();
  const report = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    createdAt: new Date().toISOString(),
    owner: user,
    title: inferReportTitle(job),
    resumePreview: resume.slice(0, 160),
    jobPreview: job.slice(0, 160),
    outputs: currentReport
  };

  saved.unshift(report);
  setSavedReports(saved.slice(0, 25));
  renderHistory();
  statusEl.textContent = 'Report saved for the active demo user.';
}

function inferReportTitle(job) {
  const firstLine = job.split('\n').map(line => line.trim()).find(Boolean);
  return firstLine ? firstLine.slice(0, 80) : 'GRIT Sandbox Report';
}

function buildReportText(report = null) {
  const outputs = report ? report.outputs : currentReport;
  const title = report ? report.title : inferReportTitle(jobEl.value.trim());
  const createdAt = report ? report.createdAt : new Date().toISOString();
  const user = report?.owner || getCurrentUser();

  let text = `GRIT Sandbox Multi-Agent Report\n`;
  text += `Title: ${title}\n`;
  text += `Generated: ${new Date(createdAt).toLocaleString()}\n`;
  if (user) text += `User: ${user.name} (${user.role}) - ${user.email}\n`;
  text += `\n`;

  outputs.forEach(item => {
    text += `==============================\n${item.title}\n==============================\n${item.text}\n\n`;
  });

  return text;
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadCurrentReport() {
  if (!currentReport.length) {
    alert('Run at least one agent before downloading a report.');
    return;
  }
  downloadText(`grit-sandbox-report-${Date.now()}.txt`, buildReportText());
}

function renderHistory() {
  const saved = getSavedReports();
  const user = getCurrentUser();
  historyListEl.innerHTML = '';

  if (!user) {
    historyListEl.innerHTML = '<p class="small">Start a demo session to save and view reports for a user.</p>';
    return;
  }

  if (!saved.length) {
    historyListEl.innerHTML = '<p class="small">No saved reports yet for this demo user.</p>';
    return;
  }

  saved.forEach(report => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <h3>${escapeHtml(report.title)}</h3>
      <div class="history-meta">Saved: ${new Date(report.createdAt).toLocaleString()} | Outputs: ${report.outputs.length}</div>
      <p><strong>Owner:</strong> ${escapeHtml(report.owner?.name || 'Unknown')} (${escapeHtml(report.owner?.role || 'user')})</p>
      <p><strong>Job preview:</strong> ${escapeHtml(report.jobPreview || '')}</p>
      <div class="history-buttons">
        <button class="secondary" data-load="${report.id}">Load Report</button>
        <button class="secondary" data-download="${report.id}">Download</button>
        <button class="danger" data-delete="${report.id}">Delete</button>
      </div>
    `;
    historyListEl.appendChild(item);
  });
}

function loadReport(id) {
  const report = getSavedReports().find(r => r.id === id);
  if (!report) return;
  currentReport = [...report.outputs];
  resultsEl.innerHTML = '';
  currentReport.forEach(output => addResult(output.title, output.text));
  statusEl.textContent = 'Saved report loaded.';
}

function deleteReport(id) {
  const saved = getSavedReports().filter(r => r.id !== id);
  setSavedReports(saved);
  renderHistory();
}

document.querySelectorAll('[data-agent]').forEach(button => {
  button.addEventListener('click', async () => {
    try {
      await runAgent(button.dataset.agent);
    } catch (err) {
      statusEl.textContent = 'Error.';
      alert(err.message);
    }
  });
});

runAllBtn.addEventListener('click', async () => {
  resultsEl.innerHTML = '';
  currentReport = [];
  const agents = ['translator', 'talent', 'curriculum', 'advising', 'generator', 'discriminator', 'reputation'];
  for (const agent of agents) {
    try {
      await runAgent(agent);
    } catch (err) {
      addResult(agentLabels[agent], `ERROR: ${err.message}`);
      break;
    }
  }
  statusEl.textContent = 'Multi-agent workflow complete.';
});

clearBtn.addEventListener('click', () => {
  resumeEl.value = '';
  jobEl.value = '';
  statusEl.textContent = 'Inputs cleared.';
});

loginBtn.addEventListener('click', login);
logoutBtn.addEventListener('click', logout);
saveReportBtn.addEventListener('click', saveCurrentReport);
downloadReportBtn.addEventListener('click', downloadCurrentReport);
clearHistoryBtn.addEventListener('click', () => {
  if (confirm('Clear all saved reports for this demo user?')) {
    setSavedReports([]);
    renderHistory();
  }
});

historyListEl.addEventListener('click', event => {
  const loadId = event.target.getAttribute('data-load');
  const downloadId = event.target.getAttribute('data-download');
  const deleteId = event.target.getAttribute('data-delete');
  const saved = getSavedReports();

  if (loadId) loadReport(loadId);
  if (downloadId) {
    const report = saved.find(r => r.id === downloadId);
    if (report) downloadText(`grit-sandbox-saved-report-${Date.now()}.txt`, buildReportText(report));
  }
  if (deleteId) deleteReport(deleteId);
});

renderUser();
renderHistory();

// ------------------------------
// Phase 5: Reputation + Verification
// ------------------------------
const REP_KEY = 'gritSandboxReputationByUser';
const readinessScoreEl = document.getElementById('readinessScore');
const verifiedSkillCountEl = document.getElementById('verifiedSkillCount');
const oefBalanceEl = document.getElementById('oefBalance');
const skillNameEl = document.getElementById('skillName');
const verifierRoleEl = document.getElementById('verifierRole');
const ratingEl = document.getElementById('rating');
const verificationCommentEl = document.getElementById('verificationComment');
const verifySkillBtn = document.getElementById('verifySkillBtn');
const verificationLogEl = document.getElementById('verificationLog');
const leaderboardListEl = document.getElementById('leaderboardList');

const verifierWeights = {
  professor: 120,
  employer: 150,
  advisor: 90,
  peer: 60
};

function getReputationStore() {
  try {
    return JSON.parse(localStorage.getItem(REP_KEY) || '{}');
  } catch {
    return {};
  }
}

function setReputationStore(store) {
  localStorage.setItem(REP_KEY, JSON.stringify(store));
}

function getCurrentReputation() {
  const store = getReputationStore();
  const user = getCurrentUser();
  const userId = getUserId();
  if (!store[userId]) {
    store[userId] = {
      user: user || { name: 'Guest', email: 'guest', role: 'student' },
      tokens: 0,
      verifications: []
    };
    setReputationStore(store);
  }
  if (user) store[userId].user = user;
  return store[userId];
}

function setCurrentReputation(rep) {
  const store = getReputationStore();
  store[getUserId()] = rep;
  setReputationStore(store);
}

function calculateReadinessScore(rep) {
  const verificationScore = Math.min(rep.verifications.length * 8, 40);
  const tokenScore = Math.min(Math.floor(rep.tokens / 20), 40);
  const reportScore = Math.min(getSavedReports().length * 5, 20);
  return Math.min(100, verificationScore + tokenScore + reportScore);
}

function submitVerification() {
  const user = getCurrentUser();
  if (!user) {
    alert('Start a demo user session before submitting verifications.');
    return;
  }

  const skill = skillNameEl.value.trim();
  const role = verifierRoleEl.value;
  const rating = Number(ratingEl.value || 3);
  const comment = verificationCommentEl.value.trim();

  if (!skill) {
    alert('Enter a skill name to verify.');
    return;
  }

  const rep = getCurrentReputation();
  const alreadyVerified = rep.verifications.some(v => v.skill.toLowerCase() === skill.toLowerCase());
  if (alreadyVerified) {
    alert('This skill is already verified for this demo user.');
    return;
  }

  const baseReward = verifierWeights[role] || 60;
  const reward = Math.round(baseReward * (rating / 5));
  const verification = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    skill,
    role,
    rating,
    comment,
    reward,
    createdAt: new Date().toISOString()
  };

  rep.tokens += reward;
  rep.verifications.unshift(verification);
  setCurrentReputation(rep);

  skillNameEl.value = '';
  verificationCommentEl.value = '';
  renderReputation();
  statusEl.textContent = `Verified ${skill}. +${reward} simulated OEF tokens awarded.`;
}

function renderReputation() {
  const user = getCurrentUser();
  if (!user) {
    readinessScoreEl.textContent = '0';
    verifiedSkillCountEl.textContent = '0';
    oefBalanceEl.textContent = '0';
    verificationLogEl.innerHTML = '<p class="small">Start a demo session to track reputation.</p>';
    renderLeaderboard();
    return;
  }

  const rep = getCurrentReputation();
  readinessScoreEl.textContent = calculateReadinessScore(rep);
  verifiedSkillCountEl.textContent = rep.verifications.length;
  oefBalanceEl.textContent = rep.tokens;

  if (!rep.verifications.length) {
    verificationLogEl.innerHTML = '<p class="small">No verified skills yet. Add a skill after reviewing the agent report.</p>';
  } else {
    verificationLogEl.innerHTML = rep.verifications.map(v => `
      <div class="history-item">
        <h3>${escapeHtml(v.skill)} <span class="token-badge">+${v.reward} OEF</span></h3>
        <div class="history-meta">${titleCase(v.role)} verification | Rating: ${v.rating}/5 | ${new Date(v.createdAt).toLocaleString()}</div>
        <p>${escapeHtml(v.comment || 'No comment provided.')}</p>
      </div>
    `).join('');
  }

  renderLeaderboard();
}

function renderLeaderboard() {
  const store = getReputationStore();
  const rows = Object.values(store)
    .filter(rep => rep && rep.user)
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 10);

  if (!rows.length) {
    leaderboardListEl.innerHTML = '<p class="small">No leaderboard entries yet.</p>';
    return;
  }

  leaderboardListEl.innerHTML = rows.map((rep, index) => `
    <div class="history-item">
      <h3>#${index + 1} ${escapeHtml(rep.user.name || 'Demo User')} <span class="token-badge">${rep.tokens} OEF</span></h3>
      <div class="history-meta">${escapeHtml(titleCase(rep.user.role || 'student'))} | Verified skills: ${rep.verifications.length} | Readiness: ${calculateReadinessScore(rep)}/100</div>
    </div>
  `).join('');
}

if (verifySkillBtn) {
  verifySkillBtn.addEventListener('click', submitVerification);
}

// Wrap earlier render calls with phase 5 rendering too.
const originalRenderUserForPhase5 = renderUser;
renderUser = function () {
  originalRenderUserForPhase5();
  renderReputation();
};

const originalRenderHistoryForPhase5 = renderHistory;
renderHistory = function () {
  originalRenderHistoryForPhase5();
  renderReputation();
};

renderReputation();

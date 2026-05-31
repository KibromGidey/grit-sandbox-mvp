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

const STORAGE_KEY = 'gritSandboxSavedReports';
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

async function runAgent(agent) {
  const resume = resumeEl.value.trim();
  const job = jobEl.value.trim();

  if (!resume || !job) {
    alert('Please paste both a resume/profile and a job description.');
    return;
  }

  statusEl.textContent = `Running ${agentLabels[agent]}...`;

  const response = await fetch('/.netlify/functions/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume, job, jobDescription: job, agent })
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

function getSavedReports() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function setSavedReports(reports) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

function saveCurrentReport() {
  const resume = resumeEl.value.trim();
  const job = jobEl.value.trim();

  if (!currentReport.length) {
    alert('Run at least one agent before saving a report.');
    return;
  }

  const saved = getSavedReports();
  const report = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    createdAt: new Date().toISOString(),
    title: inferReportTitle(job),
    resumePreview: resume.slice(0, 160),
    jobPreview: job.slice(0, 160),
    outputs: currentReport
  };

  saved.unshift(report);
  setSavedReports(saved.slice(0, 25));
  renderHistory();
  statusEl.textContent = 'Report saved in this browser.';
}

function inferReportTitle(job) {
  const firstLine = job.split('\n').map(line => line.trim()).find(Boolean);
  return firstLine ? firstLine.slice(0, 80) : 'GRIT Sandbox Report';
}

function buildReportText(report = null) {
  const outputs = report ? report.outputs : currentReport;
  const title = report ? report.title : inferReportTitle(jobEl.value.trim());
  const createdAt = report ? report.createdAt : new Date().toISOString();

  let text = `GRIT Sandbox Multi-Agent Report\n`;
  text += `Title: ${title}\n`;
  text += `Generated: ${new Date(createdAt).toLocaleString()}\n\n`;

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
  historyListEl.innerHTML = '';

  if (!saved.length) {
    historyListEl.innerHTML = '<p class="small">No saved reports yet.</p>';
    return;
  }

  saved.forEach(report => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <h3>${escapeHtml(report.title)}</h3>
      <div class="history-meta">Saved: ${new Date(report.createdAt).toLocaleString()} | Outputs: ${report.outputs.length}</div>
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

saveReportBtn.addEventListener('click', saveCurrentReport);
downloadReportBtn.addEventListener('click', downloadCurrentReport);
clearHistoryBtn.addEventListener('click', () => {
  if (confirm('Clear all saved reports from this browser?')) {
    localStorage.removeItem(STORAGE_KEY);
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

renderHistory();

const resumeEl = document.getElementById('resume');
const jobEl = document.getElementById('job');
const resultsEl = document.getElementById('results');
const statusEl = document.getElementById('status');
const runAllBtn = document.getElementById('runAllBtn');

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
    body: JSON.stringify({ resume, job, agent })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong.');
  }

  addResult(agentLabels[agent], data.result);
  statusEl.textContent = `${agentLabels[agent]} finished.`;
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
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
    .replaceAll('\n', '<br>');
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

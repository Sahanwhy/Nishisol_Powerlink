/* ============================================================
   NISHISOL POWERLINK — ADMIN DASHBOARD JS
   ============================================================ */

// ─── CONFIG ─────────────────────────────────────────────────
const CREDENTIALS = {
  username: 'admin',
  get password() {
    return localStorage.getItem('nishisol_admin_pass') || 'nishisol2025';
  }
};

const STORAGE_KEYS = {
  session:  'nishisol_admin_session'
};

const COLORS = ['#22C55E', '#FFD600', '#3B82F6', '#F97316', '#EC4899', '#8B5CF6'];
const API_BASE = 'https://nishisol-powerlink.onrender.com/api';

let state = {
  leads: [],
  views: 0,
  viewLog: [],
  activeTab: 'overview',
  currentLeadIndex: null
};

// ─── UTILS ──────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const fmt = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

function showToast(msg, type = 'info') {
  const t = $('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.className = 'toast', 3000);
}

async function fetchLeads() {
  try {
    const res = await fetch(`${API_BASE}/leads`);
    state.leads = await res.json();
    return state.leads;
  } catch (err) {
    console.error('Error fetching leads:', err);
    showToast('Failed to load leads from server', 'error');
    return [];
  }
}

async function fetchViews() {
  try {
    const res = await fetch(`${API_BASE}/views`);
    const data = await res.json();
    state.views = data.total;
    state.viewLog = data.log;
    return data;
  } catch (err) {
    console.error('Error fetching views:', err);
    return { total: 0, log: [] };
  }
}

function getActivity() {
  const activities = [];
  
  // Add leads to activity
  state.leads.slice(-5).forEach(l => {
    activities.push({
      type: 'lead',
      text: `New lead: ${l.name}`,
      time: l.submittedAt
    });
  });

  // Sort by time
  return activities.sort((a, b) => new Date(b.time) - new Date(a.time));
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function dateLabel(dateStr) {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function isToday(d) {
  const now = new Date(), date = new Date(d);
  return now.toDateString() === date.toDateString();
}
function isYesterday(d) {
  const y = new Date(); y.setDate(y.getDate() - 1);
  return y.toDateString() === new Date(d).toDateString();
}
function isThisWeek(d) {
  const now = new Date(), date = new Date(d);
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0,0,0,0);
  return date >= startOfWeek;
}
function isThisMonth(d) {
  const now = new Date(), date = new Date(d);
  return now.getMonth() === date.getMonth() && now.getFullYear() === date.getFullYear();
}

// ─── LOGIN ──────────────────────────────────────────────────
function initLogin() {
  // Auto-login if session active
  if (localStorage.getItem(STORAGE_KEYS.session) === '1') {
    showDashboard();
    return;
  }

  $('loginBtn').addEventListener('click', doLogin);
  $('loginUser').addEventListener('keydown', e => e.key === 'Enter' && doLogin());
  $('loginPass').addEventListener('keydown', e => e.key === 'Enter' && doLogin());

  $('togglePw').addEventListener('click', () => {
    const inp = $('loginPass');
    const icon = $('togglePw').querySelector('i');
    if (inp.type === 'password') {
      inp.type = 'text';
      icon.className = 'fas fa-eye-slash';
    } else {
      inp.type = 'password';
      icon.className = 'fas fa-eye';
    }
  });
}

function doLogin() {
  const u = $('loginUser').value.trim();
  const p = $('loginPass').value;
  if (u === CREDENTIALS.username && p === CREDENTIALS.password) {
    localStorage.setItem(STORAGE_KEYS.session, '1');
    // Simulate a page view increment on admin login
    showDashboard();
  } else {
    $('loginError').textContent = 'Invalid username or password.';
    $('loginPass').value = '';
    setTimeout(() => $('loginError').textContent = '', 3000);
  }
}

function showDashboard() {
  $('loginScreen').classList.add('hidden');
  $('dashboard').classList.remove('hidden');
  initDashboard();
}

// ─── DASHBOARD INIT ─────────────────────────────────────────
async function initDashboard() {
  initClock();
  initSidebar();
  initTabs();
  await loadAll();
  startAutoRefresh();

  $('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEYS.session);
    location.reload();
  });

  $('refreshBtn').addEventListener('click', async () => {
    await loadAll();
    showToast('Dashboard refreshed!', 'success');
  });

  $('modalClose').addEventListener('click', closeModal);
  $('leadModal').addEventListener('click', e => {
    if (e.target === $('leadModal')) closeModal();
  });

  // Export
  $('exportCSV').addEventListener('click', exportCSV);
  $('exportJSON').addEventListener('click', exportJSON);
  $('printReport').addEventListener('click', () => window.print());

  // Settings
  $('savePass').addEventListener('click', savePassword);
  $('resetAllData').addEventListener('click', resetAllData);
  $('clearLeads').addEventListener('click', clearLeads);

  // Search & filter
  $('leadSearch').addEventListener('input', renderAllLeads);
  $('filterInquiry').addEventListener('change', renderAllLeads);

  // Modal actions
  $('markContacted').addEventListener('click', markContacted);
  $('deleteLead').addEventListener('click', deleteLead);
  $('waLead').addEventListener('click', waLead);

  // View all links
  document.querySelectorAll('[data-tab]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      switchTab(el.dataset.tab);
    });
  });

  // Track a view (simulate frontend view tracking)
  trackView();

  // Greeting
  const h = new Date().getHours();
  $('greeting').textContent = h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
}

// ─── CLOCK ──────────────────────────────────────────────────
function initClock() {
  function tick() {
    const now = new Date();
    $('topbarTime').textContent = now.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    $('topbarDate').textContent = now.toLocaleDateString('en-IN', {
      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
    });
  }
  tick();
  setInterval(tick, 1000);
}

// ─── SIDEBAR ────────────────────────────────────────────────
function initSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const main = document.querySelector('.main-content');
  let mobileMode = window.innerWidth <= 900;

  $('sidebarToggle').addEventListener('click', () => {
    if (mobileMode) {
      sidebar.classList.toggle('mobile-open');
    } else {
      sidebar.classList.toggle('collapsed');
      main.classList.toggle('expanded');
    }
  });

  window.addEventListener('resize', () => {
    mobileMode = window.innerWidth <= 900;
    if (!mobileMode) {
      sidebar.classList.remove('mobile-open');
    }
  });
}

// ─── TABS ────────────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      switchTab(item.dataset.tab);
    });
  });
}

function switchTab(tabId) {
  state.activeTab = tabId;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

  const navItem = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
  if (navItem) navItem.classList.add('active');

  const tab = $(`tab-${tabId}`);
  if (tab) tab.classList.add('active');

  const titles = { overview:'Overview', leads:'All Leads', analytics:'Analytics', export:'Export Data', settings:'Settings' };
  $('pageTitle').textContent = titles[tabId] || tabId;

  if (tabId === 'leads') renderAllLeads();
  if (tabId === 'analytics') renderAnalytics();
}

// ─── LOAD ALL ────────────────────────────────────────────────
async function loadAll() {
  const [leads, viewsData] = await Promise.all([
    fetchLeads(),
    fetchViews()
  ]);
  const views = state.views;

  // Stat cards
  $('stat-views').textContent = fmt(views);
  $('stat-leads').textContent = fmt(leads.length);
  $('stat-calls').textContent = fmt(leads.filter(l => !l.email || l.inquiry?.includes('Call')).length);
  $('stat-email').textContent = fmt(leads.filter(l => l.email).length);

  // Trend
  const todayLeads = leads.filter(l => isToday(l.submittedAt)).length;
  $('trend-leads').textContent = `+${todayLeads} today`;

  // Badge
  const newLeads = leads.filter(l => l.status === 'new').length;
  $('leadsBadge').textContent = newLeads;
  $('notifDot').classList.toggle('show', newLeads > 0);

  renderRecentTable(leads.slice(-5).reverse());
  renderBarChart(leads);
  renderDonut(leads);

  // Auto-refresh active tab content
  if (state.activeTab === 'leads') renderAllLeads();
  if (state.activeTab === 'analytics') renderAnalytics();
}

// ─── RECENT TABLE ────────────────────────────────────────────
function renderRecentTable(leads) {
  const tbody = $('recentTableBody');
  if (!leads.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-row"><i class="fas fa-inbox"></i><br>No leads yet</td></tr>`;
    return;
  }
  tbody.innerHTML = leads.map((l, i) => `
    <tr>
      <td>${leads.length - i}</td>
      <td><strong>${esc(l.name || '—')}</strong></td>
      <td>${esc(l.phone || '—')}</td>
      <td>${esc(l.inquiry || 'General Query')}</td>
      <td>${l.submittedAt ? dateLabel(l.submittedAt) : '—'}</td>
      <td><span class="status-badge ${l.status || 'new'}">${l.status || 'new'}</span></td>
    </tr>
  `).join('');
}

// ─── ALL LEADS TABLE ─────────────────────────────────────────
function renderAllLeads() {
  const search = ($('leadSearch').value || '').toLowerCase();
  const filter = $('filterInquiry').value;
  let leads = [...state.leads];

  if (search) {
    leads = leads.filter(l =>
      (l.name || '').toLowerCase().includes(search) ||
      (l.phone || '').toLowerCase().includes(search) ||
      (l.email || '').toLowerCase().includes(search)
    );
  }
  if (filter) {
    leads = leads.filter(l => l.inquiry === filter);
  }

  leads = leads.slice().reverse();
  $('leadCount').textContent = leads.length;

  const tbody = $('allLeadsBody');
  if (!leads.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="empty-row"><i class="fas fa-inbox"></i><br>No leads found.</td></tr>`;
    return;
  }

  const allLeads = state.leads;
  tbody.innerHTML = leads.map((l) => {
    const realIdx = allLeads.indexOf(l);
    return `
    <tr>
      <td>${realIdx + 1}</td>
      <td><strong>${esc(l.name || '—')}</strong></td>
      <td><a href="tel:${esc(l.phone || '')}" style="color:#3B82F6">${esc(l.phone || '—')}</a></td>
      <td><a href="mailto:${esc(l.email || '')}" style="color:#22C55E">${esc(l.email || '—')}</a></td>
      <td>${esc(l.inquiry || 'General Query')}</td>
      <td title="${esc(l.message || '')}">${esc((l.message || '—').slice(0, 60))}${l.message && l.message.length > 60 ? '…' : ''}</td>
      <td>${l.submittedAt ? dateLabel(l.submittedAt) : '—'}</td>
      <td><span class="status-badge ${l.status || 'new'}">${l.status || 'new'}</span></td>
      <td>
        <button class="action-btn" onclick="openModal(${realIdx})" title="View">
          <i class="fas fa-eye"></i>
        </button>
      </td>
    </tr>
  `}).join('');
}

// ─── BAR CHART ───────────────────────────────────────────────
function renderBarChart(leads) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      dateStr: d.toDateString(),
      count: 0
    });
  }
  leads.forEach(l => {
    if (l.submittedAt) {
      const ds = new Date(l.submittedAt).toDateString();
      const day = days.find(d => d.dateStr === ds);
      if (day) day.count++;
    }
  });

  const max = Math.max(...days.map(d => d.count), 1);
  const container = $('barChart');
  container.innerHTML = days.map(d => {
    const pct = Math.max((d.count / max) * 130, 4);
    return `
      <div class="bar-item">
        <div class="bar-fill-wrap">
          <div class="bar-fill" style="height:${pct}px">
            <div class="bar-tip">${d.count} lead${d.count !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div class="bar-day">${d.label}</div>
      </div>
    `;
  }).join('');
}

// ─── DONUT CHART ─────────────────────────────────────────────
function renderDonut(leads) {
  const canvas = $('donutChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const typeCounts = {};
  leads.forEach(l => {
    const t = l.inquiry || 'General Query';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });

  const entries = Object.entries(typeCounts).sort((a,b) => b[1]-a[1]);
  const total = leads.length;

  ctx.clearRect(0, 0, 180, 180);

  if (!total) {
    ctx.beginPath();
    ctx.arc(90, 90, 70, 0, Math.PI * 2);
    ctx.strokeStyle = '#1E2535';
    ctx.lineWidth = 28;
    ctx.stroke();
    $('donutCenter').textContent = '0';
    $('donutLegend').innerHTML = '';
    return;
  }

  let startAngle = -Math.PI / 2;
  entries.forEach(([type, count], i) => {
    const slice = (count / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(90, 90, 70, startAngle, startAngle + slice);
    ctx.strokeStyle = COLORS[i % COLORS.length];
    ctx.lineWidth = 28;
    ctx.stroke();
    startAngle += slice;
  });

  $('donutCenter').textContent = total;

  const shortLabels = { 'Residential Solar Installation': 'Residential', 'Commercial Solar Installation': 'Commercial', 'PM Surya Ghar Yojana Subsidy': 'Subsidy', 'AMC & Maintenance': 'AMC', 'General Query': 'General' };

  $('donutLegend').innerHTML = entries.slice(0, 5).map(([type, count], i) => `
    <div class="dl-row">
      <div class="dl-dot" style="background:${COLORS[i % COLORS.length]}"></div>
      <div class="dl-label">${shortLabels[type] || type}</div>
      <div class="dl-val">${count}</div>
    </div>
  `).join('');
}

// ─── ANALYTICS ───────────────────────────────────────────────
function renderAnalytics() {
  const leads = state.leads;
  const views = state.views;
  const viewLog = state.viewLog;

  // Views
  $('pv-today').textContent = viewLog.filter(d => isToday(d)).length;
  $('pv-yesterday').textContent = viewLog.filter(d => isYesterday(d)).length;
  $('pv-week').textContent = viewLog.filter(d => isThisWeek(d)).length;
  $('pv-month').textContent = viewLog.filter(d => isThisMonth(d)).length;
  $('pv-total').textContent = views;

  // Leads
  $('ld-today').textContent = leads.filter(l => isToday(l.submittedAt)).length;
  $('ld-yesterday').textContent = leads.filter(l => isYesterday(l.submittedAt)).length;
  $('ld-week').textContent = leads.filter(l => isThisWeek(l.submittedAt)).length;
  $('ld-month').textContent = leads.filter(l => isThisMonth(l.submittedAt)).length;
  $('ld-total').textContent = leads.length;

  // Top inquiry types
  const typeCounts = {};
  leads.forEach(l => {
    const t = l.inquiry || 'General Query';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const entries = Object.entries(typeCounts).sort((a,b) => b[1]-a[1]);
  const shortLabels = { 'Residential Solar Installation': 'Residential', 'Commercial Solar Installation': 'Commercial', 'PM Surya Ghar Yojana Subsidy': 'Subsidy', 'AMC & Maintenance': 'AMC', 'General Query': 'General' };

  $('topInquiries').innerHTML = entries.length
    ? entries.map(([type, count]) => `
      <div class="an-row">
        <span>${shortLabels[type] || type}</span>
        <strong>${count}</strong>
      </div>
    `).join('')
    : `<div class="an-row empty-row">No data yet</div>`;

  // Activity feed
  const activity = getActivity();
  const feed = $('activityFeed');
  if (!activity.length) {
    feed.innerHTML = '<div class="af-empty">No recent activity</div>';
    return;
  }
  feed.innerHTML = activity.slice(-8).reverse().map(a => `
    <div class="af-item">
      <div class="af-dot ${a.type === 'lead' ? 'yellow' : 'green'}"></div>
      <div>
        <div class="af-text">${esc(a.text)}</div>
        <div class="af-time">${timeAgo(a.time)}</div>
      </div>
    </div>
  `).join('');
}


async function clearLeads() {
  if (!confirm('Delete all leads? This cannot be undone.')) return;
  try {
    await fetch(`${API_BASE}/leads`, { method: 'DELETE' });
    await loadAll();
    renderAllLeads();
    showToast('All leads cleared.', 'info');
  } catch (err) {
    showToast('Failed to clear leads', 'error');
  }
}

// ─── MODAL ───────────────────────────────────────────────────
function openModal(idx) {
  state.currentLeadIndex = idx;
  const l = state.leads[idx];
  if (!l) return;

  $('modalBody').innerHTML = `
    <div class="modal-field"><label>Name</label><span>${esc(l.name || '—')}</span></div>
    <div class="modal-field"><label>Phone</label><span><a href="tel:${esc(l.phone || '')}" style="color:#3B82F6">${esc(l.phone || '—')}</a></span></div>
    <div class="modal-field"><label>Email</label><span><a href="mailto:${esc(l.email || '')}" style="color:#22C55E">${esc(l.email || '—')}</a></span></div>
    <div class="modal-field"><label>Inquiry Type</label><span>${esc(l.inquiry || 'General Query')}</span></div>
    <div class="modal-field"><label>Message</label><span style="white-space:pre-wrap">${esc(l.message || '—')}</span></div>
    <div class="modal-field"><label>Submitted At</label><span>${l.submittedAt ? dateLabel(l.submittedAt) : '—'}</span></div>
    <div class="modal-field"><label>Status</label><span class="status-badge ${l.status || 'new'}">${l.status || 'new'}</span></div>
  `;

  $('leadModal').classList.add('open');
}

function closeModal() {
  $('leadModal').classList.remove('open');
  state.currentLeadIndex = null;
}

async function markContacted() {
  if (state.currentLeadIndex === null) return;
  const lead = state.leads[state.currentLeadIndex];
  try {
    await fetch(`${API_BASE}/leads/${lead._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'contacted' })
    });
    await loadAll();
    renderAllLeads();
    closeModal();
    showToast('Lead marked as contacted.', 'success');
  } catch (err) {
    showToast('Failed to update status', 'error');
  }
}

async function deleteLead() {
  if (state.currentLeadIndex === null) return;
  if (!confirm('Delete this lead?')) return;
  const lead = state.leads[state.currentLeadIndex];
  try {
    await fetch(`${API_BASE}/leads/${lead._id}`, { method: 'DELETE' });
    await loadAll();
    renderAllLeads();
    closeModal();
    showToast('Lead deleted.', 'error');
  } catch (err) {
    showToast('Failed to delete lead', 'error');
  }
}

function waLead() {
  if (state.currentLeadIndex === null) return;
  const l = state.leads[state.currentLeadIndex];
  const phone = (l.phone || '').replace(/\D/g, '');
  const msg = encodeURIComponent(`Hi ${l.name || ''}, this is Nishisol Powerlink. We received your inquiry about solar installation. How can we help you?`);
  window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
}

// ─── EXPORT ──────────────────────────────────────────────────
function exportCSV() {
  const leads = state.leads;
  if (!leads.length) { showToast('No leads to export.', 'info'); return; }
  const headers = ['#', 'Name', 'Phone', 'Email', 'Inquiry Type', 'Message', 'Submitted At', 'Status'];
  const rows = leads.map((l, i) => [
    i + 1,
    `"${(l.name || '').replace(/"/g, '""')}"`,
    `"${(l.phone || '').replace(/"/g, '""')}"`,
    `"${(l.email || '').replace(/"/g, '""')}"`,
    `"${(l.inquiry || '').replace(/"/g, '""')}"`,
    `"${(l.message || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    `"${l.submittedAt ? dateLabel(l.submittedAt) : ''}"`,
    l.status || 'new'
  ].join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  download('nishisol_leads.csv', 'text/csv', csv);
  showToast('CSV downloaded!', 'success');
}

function exportJSON() {
  const data = {
    exported_at: new Date().toISOString(),
    total_leads: state.leads.length,
    total_views: getViews(),
    leads: state.leads
  };
  download('nishisol_data.json', 'application/json', JSON.stringify(data, null, 2));
  showToast('JSON downloaded!', 'success');
}

function download(filename, type, content) {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ─── VIEW TRACKER ────────────────────────────────────────────
async function trackView() {
  // On admin login/refresh, we also track a view
  try {
    await fetch(`${API_BASE}/views`, { method: 'POST' });
  } catch (err) {
    console.error('Error tracking view:', err);
  }
}

// ─── AUTO REFRESH ────────────────────────────────────────────
function startAutoRefresh() {
  setInterval(() => {
    loadAll();
  }, 5000); // Live refresh every 5s
}

// ─── FRONTEND BRIDGE (add to script.js in frontend) ──────────
// This function is called by the frontend contact form submission
// and is also injected here for demo seeding
// Seed data functionality removed in favor of backend persistence


// ─── ESCAPE HTML ─────────────────────────────────────────────
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initLogin();
});


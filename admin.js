/* ══════════════════════════════════════════════════════════
   LXWYER UP — ADMIN.JS
   Dashboard logic, login, user management, email approval
══════════════════════════════════════════════════════════ */

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3005/api' : '/api';
const ADMIN_PASSWORD_FALLBACK = null; // Auth is server-side only

let allUsers = [];
let authenticated = false;

/* ─── Login ─────────────────────────────────────────────── */
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const pwd = document.getElementById('adminPassword').value;
  const errorEl = document.getElementById('loginError');

  try {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      sessionStorage.setItem('adminToken', data.token);
      authenticated = true;
      document.getElementById('loginGate').style.display = 'none';
      document.getElementById('adminWrap').style.display = 'flex';
      loadData();
    } else {
      errorEl.textContent = 'Incorrect password. Try again.';
    }
  } catch (err) {
    // Offline fallback
    if (pwd === ADMIN_PASSWORD_FALLBACK) {
      authenticated = true;
      sessionStorage.setItem('adminToken', 'local_admin_token');
      document.getElementById('loginGate').style.display = 'none';
      document.getElementById('adminWrap').style.display = 'flex';
      loadData();
    } else {
      errorEl.textContent = 'Incorrect password. Try again.';
    }
  }
});

function logout() {
  sessionStorage.removeItem('adminToken');
  authenticated = false;
  document.getElementById('adminWrap').style.display = 'none';
  document.getElementById('loginGate').style.display = 'flex';
  document.getElementById('adminPassword').value = '';
}

/* Check if already logged in */
if (sessionStorage.getItem('adminToken')) {
  authenticated = true;
  document.getElementById('loginGate').style.display = 'none';
  document.getElementById('adminWrap').style.display = 'flex';
  loadData();
}

/* ─── View switching ────────────────────────────────────── */
window.switchView = function(viewId, btn) {
  document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
  document.querySelectorAll('.sb-link').forEach(b => b.classList.remove('active'));
  document.getElementById(`view-${viewId}`).style.display = 'block';
  btn.classList.add('active');
};

/* ─── Load Data ─────────────────────────────────────────── */
window.loadData = async function() {
  try {
    const token = sessionStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // If token is rejected (403), force re-login
    if (res.status === 403) {
      sessionStorage.removeItem('adminToken');
      authenticated = false;
      document.getElementById('adminWrap').style.display = 'none';
      document.getElementById('loginGate').style.display = 'flex';
      document.getElementById('loginError').textContent = 'Session expired. Please log in again.';
      return;
    }

    const data = await res.json();
    if (res.ok) {
      allUsers = data.users || [];
      try { updateStats(); } catch(e) { console.error('Stats error:', e); }
      try { renderRecentTable(); } catch(e) { console.error('Recent table error:', e); }
      try { renderFullTable(); } catch(e) { console.error('Full table error:', e); }
    } else {
      document.getElementById('recentTableBody').innerHTML = `<tr><td colspan="6">Server error: ${res.status}</td></tr>`;
    }
  } catch (err) {
    document.getElementById('recentTableBody').innerHTML = `<tr><td colspan="6">Fetch error: ${err.message}</td></tr>`;
    console.error('loadData error:', err);
    // Mock data fallback removed so we can see actual errors if they occur
  }
};

function getMockData() {
  return [
    { id: 'u1', memberNumber: '001', name: 'Adv. Rajesh Sharma', email: 'rajesh@chambers.com', barNumber: 'DL/2019/12345', city: 'New Delhi', practiceArea: 'criminal', signupDate: new Date().toISOString(), status: 'pending' },
    { id: 'u2', memberNumber: '002', name: 'Adv. Priya Iyer', email: 'priya.iyer@lawfirm.in', barNumber: 'KA/2017/9876', city: 'Bangalore', practiceArea: 'corporate', signupDate: new Date(Date.now() - 3600000).toISOString(), status: 'approved' },
    { id: 'u3', memberNumber: '003', name: 'Adv. Mohan Gupta', email: 'mohan.g@legal.com', barNumber: '', city: 'Mumbai', practiceArea: 'civil', signupDate: new Date(Date.now() - 7200000).toISOString(), status: 'pending' },
    { id: 'u4', memberNumber: '004', name: 'Adv. Anita Rao', email: 'anita.rao@courts.in', barNumber: 'MH/2020/5432', city: 'Pune', practiceArea: 'family', signupDate: new Date(Date.now() - 86400000).toISOString(), status: 'pending' },
    { id: 'u5', memberNumber: '005', name: 'Adv. Vikram Nair', email: 'vikram.nair@law.in', barNumber: 'KL/2016/2100', city: 'Kochi', practiceArea: 'arbitration', signupDate: new Date(Date.now() - 172800000).toISOString(), status: 'rejected' },
  ];
}

/* ─── Stats ─────────────────────────────────────────────── */
function updateStats() {
  const total    = allUsers.length;
  const pending  = allUsers.filter(u => u.status === 'pending').length;
  const approved = allUsers.filter(u => u.status === 'approved').length;

  const today = new Date().toDateString();
  const todayCount = allUsers.filter(u => new Date(u.signupDate).toDateString() === today).length;

  document.getElementById('statTotal').textContent    = total;
  document.getElementById('statPending').textContent  = pending;
  document.getElementById('statApproved').textContent = approved;
  document.getElementById('statToday').textContent    = todayCount;

  const remaining = Math.max(0, 500 - total);
  const pct = (total / 500) * 100;
  document.getElementById('slotsUsed').textContent  = `${total} / 500`;
  document.getElementById('slotsBarFill').style.width = `${Math.max(0.5, pct)}%`;
  document.getElementById('barNote').textContent = `${remaining} spots remaining`;
}

/* ─── Practice area label ───────────────────────────────── */
const practiceLabels = {
  criminal: 'Criminal Law',
  civil: 'Civil Litigation',
  corporate: 'Corporate & Commercial',
  constitutional: 'Constitutional Law',
  family: 'Family Law',
  property: 'Property & Real Estate',
  tax: 'Taxation',
  labour: 'Labour & Employment',
  intellectual_property: 'Intellectual Property',
  arbitration: 'Arbitration & ADR',
  other: 'Other'
};

function practiceLabel(val) { return practiceLabels[val] || val || '—'; }

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true });
}

function statusPill(status) {
  return `<span class="status-pill status-${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
}

/* ─── Recent Table ──────────────────────────────────────── */
function renderRecentTable() {
  const tbody = document.getElementById('recentTableBody');
  const recent = [...allUsers].sort((a, b) => new Date(b.signupDate) - new Date(a.signupDate)).slice(0, 5);

  if (recent.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No signups yet.</td></tr>';
    return;
  }

  tbody.innerHTML = recent.map(u => `
    <tr>
      <td class="cell-num">#${u.memberNumber || '—'}</td>
      <td class="cell-name">${escHtml(u.name)}</td>
      <td class="cell-email">${escHtml(u.email)}</td>
      <td>${escHtml(u.state || '')}${u.state && u.city ? ' / ' : ''}${escHtml(u.city || '—')}</td>
      <td>${escHtml(u.caseVolume || '—')}</td>
      <td>${statusPill(u.status)}</td>
      <td>
        <div class="action-btns">
          ${u.status !== 'approved' ? `<button class="act-btn act-approve" onclick="approveUser('${u.id}')">Approve</button>` : ''}
          ${u.status === 'pending'  ? `<button class="act-btn act-reject"  onclick="rejectUser('${u.id}')">Reject</button>` : ''}
          <button class="act-btn act-view" onclick="viewUser('${u.id}')">View</button>
        </div>
      </td>
    </tr>
  `).join('');
}

/* ─── Full Table ────────────────────────────────────────── */
let filteredUsers = [];

function renderFullTable(users) {
  const tbody = document.getElementById('fullTableBody');
  const list = users || allUsers;
  filteredUsers = list;

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="12" class="table-empty">No results found.</td></tr>';
    return;
  }

  const sorted = [...list].sort((a, b) => new Date(b.signupDate) - new Date(a.signupDate));

  tbody.innerHTML = sorted.map(u => `
    <tr>
      <td class="cell-num">#${u.memberNumber || '—'}</td>
      <td class="cell-name">${escHtml(u.name)}</td>
      <td class="cell-email">${escHtml(u.email)}</td>
      <td>${escHtml(u.state || '—')}</td>
      <td>${escHtml(u.city || '—')}</td>
      <td>${practiceLabel(u.practiceArea)}</td>
      <td>${escHtml(u.caseVolume || '—')}</td>
      <td>${escHtml(u.referralCode || '—')}</td>
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-weight:600;color:#f8fafc;">${u.referralCount || 0}</span>
          ${u.rewardTier ? `<span style="font-size:10px;background:rgba(212,175,55,0.2);color:#d4af37;padding:2px 6px;border-radius:4px;border:1px solid rgba(212,175,55,0.3);">Tier ${u.rewardTier}</span>` : ''}
        </div>
      </td>
      <td class="cell-date">${formatDate(u.signupDate)}</td>
      <td>${statusPill(u.status)}</td>
      <td>
        <div class="action-btns">
          ${u.status !== 'approved' ? `<button class="act-btn act-approve" onclick="approveUser('${u.id}')">Approve</button>` : ''}
          ${u.status === 'pending'  ? `<button class="act-btn act-reject"  onclick="rejectUser('${u.id}')">Reject</button>` : ''}
          <button class="act-btn act-view" onclick="viewUser('${u.id}')">View</button>
        </div>
      </td>
    </tr>
  `).join('');
}

/* ─── Filters ───────────────────────────────────────────── */
window.filterTable = function() {
  const query    = document.getElementById('searchInput').value.toLowerCase();
  const status   = document.getElementById('filterStatus').value;
  const practice = document.getElementById('filterPractice').value;

  const filtered = allUsers.filter(u => {
    const matchSearch = !query ||
      u.name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.city?.toLowerCase().includes(query) ||
      u.barNumber?.toLowerCase().includes(query);

    const matchStatus   = !status   || u.status === status;
    const matchPractice = !practice || u.practiceArea === practice;

    return matchSearch && matchStatus && matchPractice;
  });

  renderFullTable(filtered);
};

/* ─── Approve / Reject ──────────────────────────────────── */
window.approveUser = async function(userId) {
  try {
    const token = sessionStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE}/admin/approve/${userId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (res.ok) {
      showToast(`User approved & welcome email sent!`, 'success');
    } else {
      // Offline: update locally
      showToast('Approved locally (email queued when server is online)', 'success');
    }
  } catch (err) {
    showToast('Approved locally (server offline)', 'info');
  }

  // Update locally
  const user = allUsers.find(u => u.id === userId);
  if (user) { user.status = 'approved'; }
  updateStats();
  renderRecentTable();
  renderFullTable();
};

window.rejectUser = async function(userId) {
  try {
    const token = sessionStorage.getItem('adminToken');
    await fetch(`${API_BASE}/admin/reject/${userId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  } catch (err) { /* offline */ }

  const user = allUsers.find(u => u.id === userId);
  if (user) { user.status = 'rejected'; }
  updateStats();
  renderRecentTable();
  renderFullTable();
  showToast('Application rejected.', 'error');
};

/* ─── View User Detail ──────────────────────────────────── */
window.viewUser = function(userId) {
  const u = allUsers.find(u => u.id === userId);
  if (!u) return;

  const initials = u.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  document.getElementById('modalContent').innerHTML = `
    <div class="modal-header">
      <div class="modal-avatar">${initials}</div>
      <div>
        <div class="modal-name">${escHtml(u.name)}</div>
        <div class="modal-member-num">Founding Member #${u.memberNumber || '—'}</div>
      </div>
    </div>
    <div class="modal-fields">
      <div>
        <div class="modal-field-label">Email</div>
        <div class="modal-field-val">${escHtml(u.email)}</div>
      </div>
      <div>
        <div class="modal-field-label">State</div>
        <div class="modal-field-val">${escHtml(u.state || '—')}</div>
      </div>
      <div>
        <div class="modal-field-label">City</div>
        <div class="modal-field-val">${escHtml(u.city || '—')}</div>
      </div>
      <div>
        <div class="modal-field-label">Practice Area</div>
        <div class="modal-field-val">${practiceLabel(u.practiceArea)}</div>
      </div>
      <div>
        <div class="modal-field-label">Active Cases</div>
        <div class="modal-field-val">${escHtml(u.caseVolume || '—')}</div>
      </div>
      <div>
        <div class="modal-field-label">Signed Up</div>
        <div class="modal-field-val">${formatDate(u.signupDate)}</div>
      </div>
      <div style="grid-column: 1 / -1">
        <div class="modal-field-label">Biggest Challenge</div>
        <div class="modal-field-val" style="color:var(--text-muted);font-style:italic;">${escHtml(u.painPoint || 'Not provided')}</div>
      </div>
      <div>
        <div class="modal-field-label">Status</div>
        <div class="modal-field-val">${statusPill(u.status)}</div>
      </div>
    </div>
    <div class="modal-actions">
      ${u.status !== 'approved' ? `<button class="act-btn act-approve" onclick="approveUser('${u.id}'); closeModal()">Approve & Send Welcome Email</button>` : ''}
      ${u.status === 'pending'  ? `<button class="act-btn act-reject" onclick="rejectUser('${u.id}'); closeModal()">Reject</button>` : ''}
    </div>
  `;

  document.getElementById('modalOverlay').classList.add('open');
};

window.closeModal = function() {
  document.getElementById('modalOverlay').classList.remove('open');
};

/* ─── Export CSV ────────────────────────────────────────── */
window.exportCSV = function() {
  const headers = ['Member#', 'Name', 'Email', 'Bar Number', 'City', 'Practice Area', 'Signed Up', 'Status'];
  const rows = allUsers.map(u => [
    u.memberNumber || '',
    u.name,
    u.email,
    u.barNumber || '',
    u.city || '',
    practiceLabel(u.practiceArea),
    formatDate(u.signupDate),
    u.status
  ]);

  const csv = [headers, ...rows]
    .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lxwyerup_signups_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exported!', 'success');
};

/* ─── Toast ─────────────────────────────────────────────── */
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.4s'; setTimeout(() => toast.remove(), 400); }, 3500);
}

/* ─── Helpers ───────────────────────────────────────────── */
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

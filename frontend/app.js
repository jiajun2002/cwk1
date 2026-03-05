const API = '/api';
let token = localStorage.getItem('token') || null;
let stopsPage = 1;
let logsPage = 1;

// ── Tab switching ──────────────────────────────────────────────
function switchTab(name) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + name).classList.add('active');
    event.target.classList.add('active');
}

// ── Auth state ─────────────────────────────────────────────────
function updateAuthUI() {
    const el = document.getElementById('auth-status');
    const btn = document.getElementById('logout-btn');
    if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        el.textContent = 'Logged in as: ' + payload.username;
        btn.style.display = 'inline';
    } else {
        el.textContent = 'Not logged in';
        btn.style.display = 'none';
    }
}

function logout() {
    token = null;
    localStorage.removeItem('token');
    updateAuthUI();
}

// ── Helpers ────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
    if (token) {
        options.headers = { ...options.headers, Authorization: 'Bearer ' + token };
    }
    if (options.body && typeof options.body === 'object') {
        options.headers = { ...options.headers, 'Content-Type': 'application/json' };
        options.body = JSON.stringify(options.body);
    }
    const res = await fetch(API + path, options);
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
}

function showResult(id, data, ok) {
    const el = document.getElementById(id);
    el.style.display = 'block';
    el.className = 'result-box' + (ok ? '' : ' error');
    el.textContent = JSON.stringify(data, null, 2);
}

function renderTable(containerId, rows) {
    if (!rows.length) {
        document.getElementById(containerId).innerHTML = '<p>No results.</p>';
        return;
    }
    const cols = Object.keys(rows[0]);
    const ths = cols.map(c => `<th>${c}</th>`).join('');
    const trs = rows.map(r =>
        '<tr>' + cols.map(c => `<td>${r[c] ?? ''}</td>`).join('') + '</tr>'
    ).join('');
    document.getElementById(containerId).innerHTML =
        `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

function renderPaginated(containerId, result, fetchFn) {
    const { data, page, limit, total } = result;
    const totalPages = Math.ceil(total / limit);
    const container = document.getElementById(containerId);
    if (!data.length) { container.innerHTML = '<p>No results.</p>'; return; }
    const cols = Object.keys(data[0]);
    const ths = cols.map(c => `<th>${c}</th>`).join('');
    const trs = data.map(r =>
        '<tr>' + cols.map(c => `<td>${r[c] ?? ''}</td>`).join('') + '</tr>'
    ).join('');
    const prevBtn = `<button class="btn btn-secondary" ${page <= 1 ? 'disabled' : ''} onclick="${fetchFn}(${page - 1})">&#8249; Prev</button>`;
    const nextBtn = `<button class="btn btn-secondary" ${page >= totalPages ? 'disabled' : ''} onclick="${fetchFn}(${page + 1})">Next &#8250;</button>`;
    container.innerHTML =
        `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>` +
        `<div style="display:flex;align-items:center;gap:8px;margin-top:8px;font-size:0.85rem">` +
        `${prevBtn}${nextBtn}<span>Page ${page} of ${totalPages} &nbsp;(${total} total)</span></div>`;
}

function renderStats(containerId, data) {
    const s = data.stats;
    document.getElementById(containerId).innerHTML = `
        <table>
            <tr><th>Total Arrivals</th><td>${s.total_arrivals}</td></tr>
            <tr><th>Avg Delay (min)</th><td>${s.avg_delay ?? 'N/A'}</td></tr>
            <tr><th>Late</th><td>${s.late_count}</td></tr>
            <tr><th>Cancelled</th><td>${s.cancelled_count}</td></tr>
            <tr><th>Punctuality Score</th><td>${s.punctuality_score}%</td></tr>
        </table>`;
}

// ── Auth ───────────────────────────────────────────────────────
async function register() {
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    const { ok, data } = await apiFetch('/auth/register', { method: 'POST', body: { username, password } });
    showResult('reg-result', data, ok);
}

async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const { ok, data } = await apiFetch('/auth/login', { method: 'POST', body: { username, password } });
    if (ok) {
        token = data.token;
        localStorage.setItem('token', token);
        updateAuthUI();
    }
    showResult('login-result', data, ok);
}

// ── Stops ──────────────────────────────────────────────────────
async function getStops(page = 1) {
    stopsPage = page;
    const atco = document.getElementById('stops-atco').value;
    const name = document.getElementById('stops-name').value;
    const locality = document.getElementById('stops-locality').value;
    const params = new URLSearchParams();
    if (atco) params.append('atco_code', atco);
    if (name) params.append('name', name);
    if (locality) params.append('locality', locality);
    params.append('page', page);
    params.append('limit', 20);
    const { ok, data } = await apiFetch('/stops?' + params);
    if (ok) renderPaginated('stops-list-result', data, 'getStops');
    else document.getElementById('stops-list-result').innerHTML =
        `<div class="result-box error">${JSON.stringify(data)}</div>`;
}

async function createStop() {
    const body = {
        atco_code:  document.getElementById('stop-atco').value,
        stop_name:  document.getElementById('stop-name').value,
        street:     document.getElementById('stop-street').value || undefined,
        indicator:  document.getElementById('stop-indicator').value || undefined,
        latitude:   parseFloat(document.getElementById('stop-lat').value) || undefined,
        longitude:  parseFloat(document.getElementById('stop-lon').value) || undefined,
        locality:   document.getElementById('stop-locality').value || undefined,
    };
    const { ok, data } = await apiFetch('/stops', { method: 'POST', body });
    showResult('stop-create-result', data, ok);
}

async function updateStop() {
    const id = document.getElementById('stop-update-id').value;
    const body = {
        stop_name:  document.getElementById('stop-update-name').value || undefined,
        street:     document.getElementById('stop-update-street').value || undefined,
        indicator:  document.getElementById('stop-update-indicator').value || undefined,
        latitude:   parseFloat(document.getElementById('stop-update-lat').value) || undefined,
        longitude:  parseFloat(document.getElementById('stop-update-lon').value) || undefined,
        locality:   document.getElementById('stop-update-locality').value || undefined,
    };
    const { ok, data } = await apiFetch('/stops/' + encodeURIComponent(id), { method: 'PUT', body });
    showResult('stop-update-result', data, ok);
}

async function deleteStop() {
    const id = document.getElementById('stop-delete-id').value;
    const { ok, data } = await apiFetch('/stops/' + encodeURIComponent(id), { method: 'DELETE' });
    showResult('stop-delete-result', data, ok);
}

// ── Logs ───────────────────────────────────────────────────────
async function getLogs(page = 1) {
    logsPage = page;
    const stop_id = document.getElementById('logs-stop-id').value;
    const route_number = document.getElementById('logs-route').value;
    const params = new URLSearchParams();
    if (stop_id) params.append('stop_id', stop_id);
    if (route_number) params.append('route_number', route_number);
    params.append('page', page);
    params.append('limit', 20);
    const { ok, data } = await apiFetch('/logs?' + params);
    if (ok) renderPaginated('logs-list-result', data, 'getLogs');
    else document.getElementById('logs-list-result').innerHTML =
        `<div class="result-box error">${JSON.stringify(data)}</div>`;
}

async function createLog() {
    const body = {
        stop_id:        document.getElementById('log-stop-id').value,
        route_number:   document.getElementById('log-route').value,
        scheduled_time: document.getElementById('log-scheduled').value || undefined,
        actual_time:    document.getElementById('log-actual').value || undefined,
    };
    const { ok, data } = await apiFetch('/logs', { method: 'POST', body });
    showResult('log-create-result', data, ok);
}

async function updateLog() {
    const id = document.getElementById('log-update-id').value;
    const body = {
        stop_id:        document.getElementById('log-update-stop-id').value || undefined,
        route_number:   document.getElementById('log-update-route').value || undefined,
        scheduled_time: document.getElementById('log-update-scheduled').value || undefined,
        actual_time:    document.getElementById('log-update-actual').value || undefined,
    };
    const { ok, data } = await apiFetch('/logs/' + id, { method: 'PUT', body });
    showResult('log-update-result', data, ok);
}

async function deleteLog() {
    const id = document.getElementById('log-delete-id').value;
    const { ok, data } = await apiFetch('/logs/' + id, { method: 'DELETE' });
    showResult('log-delete-result', data, ok);
}

// ── Reliability ────────────────────────────────────────────────
async function getStopReliability() {
    const id = document.getElementById('rel-stop-id').value;
    const { ok, data } = await apiFetch('/reliability/' + encodeURIComponent(id));
    if (ok) renderStats('rel-stop-result', data);
    else document.getElementById('rel-stop-result').innerHTML =
        `<div class="result-box error">${JSON.stringify(data)}</div>`;
}

async function getRouteReliability() {
    const route = document.getElementById('rel-route').value;
    const stop_id = document.getElementById('rel-route-stop-id').value;
    const params = new URLSearchParams();
    if (stop_id) params.append('stop_id', stop_id);
    const { ok, data } = await apiFetch('/reliability/route/' + encodeURIComponent(route) + '?' + params);
    if (ok) renderStats('rel-route-result', data);
    else document.getElementById('rel-route-result').innerHTML =
        `<div class="result-box error">${JSON.stringify(data)}</div>`;
}

// ── Init ───────────────────────────────────────────────────────
updateAuthUI();

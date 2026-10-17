document.addEventListener('layoutReady', async () => {
  const content = document.getElementById('page-content');
  const user = window.currentUser;
  const canEdit = user.role === 'ADMIN' || user.role === 'SUPPORT_ENGINEER';

  content.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2 style="color: var(--navy);">Incident Management</h2>
      ${canEdit ? '<button class="btn btn-primary" style="width: auto;" id="btnAddIncident">+ Buat Insiden</button>' : ''}
    </div>

    <div style="background: white; padding: 1rem; border-radius: 8px; border: 1px solid var(--border); margin-bottom: 1rem; display: flex; gap: 1rem;">
      <input type="text" id="searchIncident" placeholder="Cari judul atau kode insiden..." style="flex: 1; padding: 0.5rem; border: 1px solid var(--border); border-radius: 4px;">
      <select id="statusFilter" style="padding: 0.5rem; border: 1px solid var(--border); border-radius: 4px;">
        <option value="">Semua Status</option>
        <option value="OPEN">OPEN</option>
        <option value="IN_PROGRESS">IN PROGRESS</option>
        <option value="RESOLVED">RESOLVED</option>
        <option value="CLOSED">CLOSED</option>
      </select>
    </div>

    <div style="background: white; border-radius: 8px; border: 1px solid var(--border); overflow: hidden;">
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead style="background: var(--bg); border-bottom: 1px solid var(--border);">
          <tr>
            <th style="padding: 1rem;">Code</th>
            <th style="padding: 1rem;">Title</th>
            <th style="padding: 1rem;">Severity</th>
            <th style="padding: 1rem;">Status</th>
            <th style="padding: 1rem;">Opened At</th>
            <th style="padding: 1rem; text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody id="incidentTableBody">
          <tr><td colspan="6" style="text-align: center; padding: 2rem;">Memuat data...</td></tr>
        </tbody>
      </table>
    </div>
    <div id="pagination" style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;"></div>
  `;

  let state = { page: 1, limit: 10, search: '', status: '' };

  function getSeverityBadge(sev) {
    const colors = { CRITICAL: 'var(--danger)', HIGH: '#f97316', MEDIUM: 'var(--warning)', LOW: 'var(--primary)' };
    return `<span style="background: ${colors[sev]}; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">${sev}</span>`;
  }
  
  function getStatusBadge(status) {
    const colors = { OPEN: 'var(--danger)', IN_PROGRESS: 'var(--warning)', RESOLVED: 'var(--success)', CLOSED: 'var(--text-muted)' };
    return `<span style="background: ${colors[status]}; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">${status}</span>`;
  }

  async function loadIncidents() {
    const tbody = document.getElementById('incidentTableBody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">Memuat data...</td></tr>';
    
    try {
      const query = new URLSearchParams({ page: state.page, limit: state.limit, search: state.search, status: state.status }).toString();
      const res = await apiFetch(`/incidents?${query}`);
      const { data, pagination } = res;

      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">Tidak ada insiden ditemukan.</td></tr>';
      } else {
        tbody.innerHTML = data.map(inc => `
          <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 1rem; font-family: monospace; font-size: 0.9rem;">${inc.incident_code}</td>
            <td style="padding: 1rem; font-weight: 600;">${inc.title}</td>
            <td style="padding: 1rem;">${getSeverityBadge(inc.severity)}</td>
            <td style="padding: 1rem;">${getStatusBadge(inc.status)}</td>
            <td style="padding: 1rem; font-size: 0.9rem;">${new Date(inc.opened_at).toLocaleString('id-ID')}</td>
            <td style="padding: 1rem; text-align: right;">
              <a href="/incident-detail.html?id=${inc.id}" class="action-btn edit" style="text-decoration: none;">Lihat Detail</a>
            </td>
          </tr>
        `).join('');
      }

      document.getElementById('pagination').innerHTML = `
        <span style="font-size: 0.9rem; color: var(--text-muted);">Halaman ${pagination.page} dari ${pagination.totalPages || 1} (Total: ${pagination.total})</span>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn" data-action="prev" style="width: auto; padding: 0.5rem 1rem; background: ${pagination.page <= 1 ? 'var(--border)' : 'var(--primary)'}; color: ${pagination.page <= 1 ? 'var(--text-muted)' : 'white'};" ${pagination.page <= 1 ? 'disabled' : ''}>Prev</button>
          <button class="btn" data-action="next" style="width: auto; padding: 0.5rem 1rem; background: ${pagination.page >= pagination.totalPages ? 'var(--border)' : 'var(--primary)'}; color: ${pagination.page >= pagination.totalPages ? 'var(--text-muted)' : 'white'};" ${pagination.page >= pagination.totalPages ? 'disabled' : ''}>Next</button>
        </div>
      `;
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--danger);">Error: ${err.message}</td></tr>`;
    }
  }

  document.getElementById('pagination').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || btn.disabled) return;
    if (btn.dataset.action === 'prev') { state.page--; loadIncidents(); }
    if (btn.dataset.action === 'next') { state.page++; loadIncidents(); }
  });

  let searchTimeout;
  document.getElementById('searchIncident').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => { state.search = e.target.value; state.page = 1; loadIncidents(); }, 300);
  });

  document.getElementById('statusFilter').addEventListener('change', (e) => {
    state.status = e.target.value; state.page = 1; loadIncidents();
  });

  // Buat insiden manual (sederhana via prompt)
  if (canEdit) {
    document.getElementById('btnAddIncident').addEventListener('click', async () => {
      const title = prompt('Judul Insiden:');
      if (!title) return;
      const desc = prompt('Deskripsi Masalah:');
      if (!desc) return;
      
      try {
        await apiFetch('/incidents', {
          method: 'POST',
          body: { title, description: desc, severity: 'MEDIUM' }
        });
        loadIncidents();
      } catch (err) { alert('Gagal: ' + err.message); }
    });
  }

  loadIncidents();
});
document.addEventListener('layoutReady', async () => {
  const content = document.getElementById('page-content');
  
  if (window.currentUser.role !== 'ADMIN') {
    content.innerHTML = '<h2 style="color: var(--danger);">403 - Hanya Admin yang dapat melihat Log.</h2>';
    return;
  }

  content.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2 style="color: var(--navy);">Application Logs</h2>
    </div>

    <div style="background: white; padding: 1rem; border-radius: 8px; border: 1px solid var(--border); margin-bottom: 1rem; display: flex; gap: 1rem;">
      <input type="text" id="searchLog" placeholder="Cari pesan, endpoint, atau request ID..." style="flex: 1; padding: 0.5rem; border: 1px solid var(--border); border-radius: 4px;">
      <select id="levelFilter" style="padding: 0.5rem; border: 1px solid var(--border); border-radius: 4px;">
        <option value="">Semua Level</option>
        <option value="INFO">INFO</option>
        <option value="WARN">WARN</option>
        <option value="ERROR">ERROR</option>
      </select>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Waktu</th>
            <th>Level</th>
            <th>Pesan</th>
            <th>Endpoint</th>
            <th>Request ID</th>
          </tr>
        </thead>
        <tbody id="logTableBody">
          <tr><td colspan="5" style="text-align: center; padding: 2rem;">Memuat data...</td></tr>
        </tbody>
      </table>
    </div>
    <div id="logPagination" style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;"></div>
  `;

  let state = { page: 1, limit: 15, search: '', level: '' };

  function getLevelBadge(level) {
    const cssClass = level === 'ERROR' ? 'down' : (level === 'WARN' ? 'maintenance' : 'in_use');
    return `<span class="badge badge-${cssClass}">${level}</span>`;
  }

  async function loadLogs() {
    const tbody = document.getElementById('logTableBody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">Memuat data...</td></tr>';
    
    try {
      const query = new URLSearchParams({ page: state.page, limit: state.limit, search: state.search, level: state.level }).toString();
      const res = await apiFetch(`/logs?${query}`);
      const { data, pagination } = res;

      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">Tidak ada log ditemukan.</td></tr>';
      } else {
        tbody.innerHTML = data.map(log => `
          <tr>
            <td style="font-size: 0.85rem; white-space: nowrap;">${new Date(log.created_at).toLocaleString('id-ID')}</td>
            <td>${getLevelBadge(log.level)}</td>
            <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${log.message}">${log.message}</td>
            <td style="font-family: monospace; font-size: 0.85rem;">${log.method ? log.method + ' ' : ''}${log.endpoint || '-'}</td>
            <td style="font-family: monospace; font-size: 0.8rem; color: var(--text-muted);">${log.request_id ? log.request_id.substring(0, 8) + '...' : '-'}</td>
          </tr>
        `).join('');
      }

      document.getElementById('logPagination').innerHTML = `
        <span style="font-size: 0.9rem; color: var(--text-muted);">Halaman ${pagination.page} dari ${pagination.totalPages || 1} (Total: ${pagination.total})</span>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary" data-action="prev" style="width: auto; padding: 0.5rem 1rem;" ${pagination.page <= 1 ? 'disabled' : ''}>Prev</button>
          <button class="btn btn-primary" data-action="next" style="width: auto; padding: 0.5rem 1rem;" ${pagination.page >= pagination.totalPages ? 'disabled' : ''}>Next</button>
        </div>
      `;
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--danger);">Error: ${err.message}</td></tr>`;
    }
  }

  document.getElementById('logPagination').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || btn.disabled) return;
    if (btn.dataset.action === 'prev') { state.page--; loadLogs(); }
    if (btn.dataset.action === 'next') { state.page++; loadLogs(); }
  });

  let searchTimeout;
  document.getElementById('searchLog').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => { state.search = e.target.value; state.page = 1; loadLogs(); }, 300);
  });

  document.getElementById('levelFilter').addEventListener('change', (e) => {
    state.level = e.target.value; state.page = 1; loadLogs();
  });

  loadLogs();
});
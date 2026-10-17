document.addEventListener('layoutReady', async () => {
  const content = document.getElementById('page-content');
  const user = window.currentUser;
  const canEdit = user.role === 'ADMIN' || user.role === 'SUPPORT_ENGINEER';

  content.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2 style="color: var(--navy);">Application Monitoring</h2>
      ${canEdit ? '<button class="btn btn-primary" style="width: auto;" id="btnAddMonitor">+ Tambah Target</button>' : ''}
    </div>

    <div style="background: white; border-radius: 8px; border: 1px solid var(--border); overflow: hidden;">
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead style="background: var(--bg); border-bottom: 1px solid var(--border);">
          <tr>
            <th style="padding: 1rem;">Service Name</th>
            <th style="padding: 1rem;">URL</th>
            <th style="padding: 1rem;">Status</th>
            <th style="padding: 1rem;">Last Checked</th>
            <th style="padding: 1rem; text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody id="monitorTableBody">
          <tr><td colspan="5" style="text-align: center; padding: 2rem;">Memuat data...</td></tr>
        </tbody>
      </table>
    </div>
  `;

  function getStatusBadge(status) {
    const colors = { UP: 'var(--success)', DOWN: 'var(--danger)', DEGRADED: 'var(--warning)', UNKNOWN: 'var(--text-muted)' };
    return `<span style="background: ${colors[status] || 'gray'}; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">${status}</span>`;
  }

  async function loadMonitors() {
    const tbody = document.getElementById('monitorTableBody');
    try {
      const res = await apiFetch('/monitors');
      const data = res.data;

      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">Belum ada target monitoring.</td></tr>';
        return;
      }

      tbody.innerHTML = data.map(m => `
        <tr style="border-bottom: 1px solid var(--border);">
          <td style="padding: 1rem; font-weight: 600;">${m.name}</td>
          <td style="padding: 1rem; font-family: monospace; font-size: 0.85rem; color: var(--text-muted);">${m.url}</td>
          <td style="padding: 1rem;">${getStatusBadge(m.current_status)}</td>
          <td style="padding: 1rem; font-size: 0.9rem;">${m.last_checked_at ? new Date(m.last_checked_at).toLocaleString('id-ID') : '-'}</td>
          <td style="padding: 1rem; text-align: right;">
            <a href="/monitor-detail.html?id=${m.id}" class="action-btn edit" style="text-decoration: none;">Lihat Detail</a>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--danger);">Error: ${err.message}</td></tr>`;
    }
  }

  // Fitur Tambah Monitor menggunakan prompt sederhana
  if (canEdit) {
    document.getElementById('btnAddMonitor').addEventListener('click', async () => {
      const name = prompt('Nama Service (misal: Google):');
      if (!name) return;
      const url = prompt('URL lengkap (misal: https://www.google.com):');
      if (!url) return;

      try {
        await apiFetch('/monitors', {
          method: 'POST',
          body: {
            name: name,
            url: url,
            checkIntervalSeconds: 60, // Cek tiap 60 detik
            timeoutMs: 5000,
            failureThreshold: 2,
            recoveryThreshold: 1
          }
        });
        loadMonitors();
      } catch (err) {
        alert('Gagal menambah: ' + err.message);
      }
    });
  }

  loadMonitors();
  
  // Auto-refresh tabel setiap 10 detik
  setInterval(loadMonitors, 10000);
});
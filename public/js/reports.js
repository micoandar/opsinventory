document.addEventListener('layoutReady', async () => {
  const content = document.getElementById('page-content');
  const user = window.currentUser;

  if (user.role === 'VIEWER') {
    content.innerHTML = '<h2 style="color: var(--danger);">403 - Akses Ditolak. Halaman ini hanya untuk Admin dan Support.</h2>';
    return;
  }

  content.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2 style="color: var(--navy);">Reporting & Export</h2>
    </div>

    <div class="stats-grid">
      <!-- Kartu Export Assets -->
      <div class="stat-card">
        <h3>Inventory Report</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">
          Unduh seluruh data aset IT beserta status dan lokasinya dalam format CSV (dapat dibuka di Excel).
        </p>
        <button class="btn btn-primary" id="btnExportCSV" style="width: auto;">📥 Download Assets CSV</button>
      </div>
    </div>
  `;

  document.getElementById('btnExportCSV').addEventListener('click', async () => {
    const btn = document.getElementById('btnExportCSV');
    const originalText = btn.textContent;
    btn.textContent = 'Mengunduh...';
    btn.disabled = true;

    try {
      // Fetch data CSV dari backend
      const response = await fetch('/api/v1/reports/assets/csv', {
        headers: { 'Accept': 'text/csv' }
      });

      if (!response.ok) throw new Error('Gagal mengunduh laporan');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `opsinventory_assets_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      alert(err.message);
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
});
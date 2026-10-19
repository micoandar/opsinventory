document.addEventListener('layoutReady', async () => {
  const content = document.getElementById('page-content');
  
  content.innerHTML = '<p style="color: var(--text-muted);">Memuat data statistik...</p>';

  try {
    const res = await apiFetch('/dashboard/stats');
    const stats = res.data;

    content.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Total Assets</h3>
          <div class="stat-value">${stats.totalAssets}</div>
        </div>
        <div class="stat-card">
          <h3>Available</h3>
          <div class="stat-value" style="color: var(--success)">${stats.assetsByStatus.AVAILABLE}</div>
        </div>
        <div class="stat-card">
          <h3>In Use</h3>
          <div class="stat-value" style="color: var(--primary)">${stats.assetsByStatus.IN_USE}</div>
        </div>
        <div class="stat-card">
          <h3>Maintenance</h3>
          <div class="stat-value" style="color: var(--warning)">${stats.assetsByStatus.MAINTENANCE}</div>
        </div>
      </div>
      
      <div class="stat-card" style="padding: 2.5rem; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <h2 style="margin-bottom: 0.5rem; color: var(--text-main); font-size: 1.5rem;">Selamat datang, ${window.currentUser.fullName}! 👋</h2>
          <p style="color: var(--text-muted); font-size: 1rem;">
            Sistem OpsInventory siap digunakan. Pantau aset dan layanan Anda dari dashboard ini.
          </p>
        </div>
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<p style="color: var(--danger)">Gagal memuat dashboard: ${err.message}</p>`;
  }
});
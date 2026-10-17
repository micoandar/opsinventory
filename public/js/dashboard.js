document.addEventListener('layoutReady', async () => {
  const content = document.getElementById('page-content');
  
  // Tampilkan Loading State
  content.innerHTML = '<p>Memuat data statistik...</p>';

  try {
    const res = await apiFetch('/dashboard/stats');
    const stats = res.data;

    // Render UI Dashboard
    content.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Total Assets</h3>
          <div class="stat-value">${stats.totalAssets}</div>
        </div>
        <div class="stat-card">
          <h3>Assets Available</h3>
          <div class="stat-value" style="color: var(--success)">${stats.assetsByStatus.AVAILABLE}</div>
        </div>
        <div class="stat-card">
          <h3>Assets In Use</h3>
          <div class="stat-value" style="color: var(--primary)">${stats.assetsByStatus.IN_USE}</div>
        </div>
        <div class="stat-card">
          <h3>Maintenance</h3>
          <div class="stat-value" style="color: var(--warning)">${stats.assetsByStatus.MAINTENANCE}</div>
        </div>
      </div>
      
      <div style="background: white; padding: 2rem; border-radius: 8px; border: 1px solid var(--border); margin-top: 2rem;">
        <h2 style="margin-bottom: 1rem; color: var(--navy);">Selamat datang, ${window.currentUser.fullName}!</h2>
        <p style="color: var(--text-muted);">
          Gunakan menu di sebelah kiri untuk mengelola inventaris. 
          Fitur Application Monitoring dan Incident Management akan segera hadir.
        </p>
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<p style="color: var(--danger)">Gagal memuat dashboard: ${err.message}</p>`;
  }
});
document.addEventListener('layoutReady', async () => {
  const content = document.getElementById('page-content');
  
  // Ambil ID dari URL (contoh: monitor-detail.html?id=1)
  const urlParams = new URLSearchParams(window.location.search);
  const monitorId = urlParams.get('id');

  if (!monitorId) {
    content.innerHTML = '<h2 style="color: var(--danger);">ID Monitor tidak valid.</h2>';
    return;
  }

  content.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2 style="color: var(--navy);">Detail Monitoring</h2>
      <a href="/monitoring.html" class="btn btn-secondary" style="width: auto; text-decoration: none;">&larr; Kembali</a>
    </div>

    <!-- Grafik Response Time -->
    <div style="background: white; padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border); margin-bottom: 1.5rem; height: 400px;">
      <h3 style="margin-bottom: 1rem; color: var(--navy);">Tren Response Time (50 Pengecekan Terakhir)</h3>
      <canvas id="responseChart"></canvas>
    </div>

    <!-- Tabel Riwayat -->
    <div style="background: white; border-radius: 8px; border: 1px solid var(--border); overflow: hidden;">
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead style="background: var(--bg); border-bottom: 1px solid var(--border);">
          <tr>
            <th style="padding: 1rem;">Waktu Pengecekan</th>
            <th style="padding: 1rem;">Status</th>
            <th style="padding: 1rem;">HTTP Code</th>
            <th style="padding: 1rem;">Response Time</th>
            <th style="padding: 1rem;">Pesan Error</th>
          </tr>
        </thead>
        <tbody id="logTableBody">
          <tr><td colspan="5" style="text-align: center; padding: 2rem;">Memuat data...</td></tr>
        </tbody>
      </table>
    </div>
  `;

  function getResultBadge(result) {
    const colors = { UP: 'var(--success)', DOWN: 'var(--danger)', DEGRADED: 'var(--warning)', ERROR: 'var(--danger)' };
    return `<span style="background: ${colors[result] || 'gray'}; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">${result}</span>`;
  }

  try {
    // Ambil data logs dari API
    const res = await apiFetch(`/monitors/${monitorId}/logs`);
    const logs = res.data;

    if (logs.length === 0) {
      document.getElementById('logTableBody').innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">Belum ada data pengecekan.</td></tr>';
      return;
    }

    // 1. Render Tabel Riwayat
    document.getElementById('logTableBody').innerHTML = logs.map(log => `
      <tr style="border-bottom: 1px solid var(--border);">
        <td style="padding: 1rem; font-size: 0.9rem;">${new Date(log.checked_at).toLocaleString('id-ID')}</td>
        <td style="padding: 1rem;">${getResultBadge(log.result)}</td>
        <td style="padding: 1rem; font-weight: 600;">${log.status_code || '-'}</td>
        <td style="padding: 1rem;">${log.response_time_ms ? log.response_time_ms + ' ms' : '-'}</td>
        <td style="padding: 1rem; color: var(--danger); font-size: 0.85rem;">${log.error_message || '-'}</td>
      </tr>
    `).join('');

    // 2. Render Grafik (Chart.js)
    // API mengembalikan data terbaru di atas (DESC), kita balik agar grafik dari kiri ke kanan (ASC)
    const chartData = [...logs].reverse();

    const labels = chartData.map(log => new Date(log.checked_at).toLocaleTimeString('id-ID'));
    const dataPoints = chartData.map(log => log.response_time_ms || 0);

    const ctx = document.getElementById('responseChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Response Time (ms)',
          data: dataPoints,
          borderColor: '#3b82f6', // var(--primary)
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3, // Membuat garis melengkung halus
          pointRadius: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Milidetik (ms)' }
          }
        }
      }
    });

  } catch (err) {
    document.getElementById('logTableBody').innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--danger);">Error: ${err.message}</td></tr>`;
  }
});
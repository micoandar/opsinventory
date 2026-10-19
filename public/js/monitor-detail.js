document.addEventListener('layoutReady', async () => {
  const content = document.getElementById('page-content');
  
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
    <div class="stat-card" style="margin-bottom: 1.5rem; height: 400px; padding: 1.5rem;">
      <h3 style="margin-bottom: 1rem; color: var(--navy);">Tren Response Time (50 Pengecekan Terakhir)</h3>
      <div style="height: 300px; position: relative;">
        <canvas id="responseChart"></canvas>
      </div>
    </div>

    <!-- Tabel Riwayat -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Waktu Pengecekan</th>
            <th>Status</th>
            <th>HTTP Code</th>
            <th>Response Time</th>
            <th>Pesan Error</th>
          </tr>
        </thead>
        <tbody id="logTableBody">
          <tr><td colspan="5" style="text-align: center; padding: 2rem;">Memuat data...</td></tr>
        </tbody>
      </table>
    </div>
  `;

  function getResultBadge(result) {
    const cssClass = result.toLowerCase();
    return `<span class="badge badge-${cssClass}">${result}</span>`;
  }

  try {
    const res = await apiFetch(`/monitors/${monitorId}/logs`);
    const logs = res.data;

    if (logs.length === 0) {
      document.getElementById('logTableBody').innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">Belum ada data pengecekan.</td></tr>';
      return;
    }

    // 1. Render Tabel Riwayat
    document.getElementById('logTableBody').innerHTML = logs.map(log => `
      <tr>
        <td>${new Date(log.checked_at).toLocaleString('id-ID')}</td>
        <td>${getResultBadge(log.result)}</td>
        <td style="font-weight: 600;">${log.status_code || '-'}</td>
        <td>${log.response_time_ms ? log.response_time_ms + ' ms' : '-'}</td>
        <td style="color: var(--danger); font-size: 0.85rem;">${log.error_message || '-'}</td>
      </tr>
    `).join('');

    // 2. Render Grafik (Chart.js)
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
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointBackgroundColor: '#3b82f6'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Milidetik (ms)' },
            grid: { borderDash: [5, 5] }
          },
          x: {
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });

  } catch (err) {
    document.getElementById('logTableBody').innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--danger);">Error: ${err.message}</td></tr>`;
  }
});
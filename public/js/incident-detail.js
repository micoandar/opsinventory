document.addEventListener('layoutReady', async () => {
  const content = document.getElementById('page-content');
  const user = window.currentUser;
  const canEdit = user.role === 'ADMIN' || user.role === 'SUPPORT_ENGINEER';
  
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  if (!id) return content.innerHTML = '<h2 style="color: var(--danger);">ID tidak valid.</h2>';

  content.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2 style="color: var(--navy);" id="titleHeader">Memuat...</h2>
      <a href="/incidents.html" class="btn btn-secondary" style="width: auto; text-decoration: none;">&larr; Kembali</a>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 1.5rem;">
      <!-- Panel Kiri: Info Tiket -->
      <div class="stat-card">
        <h3 style="margin-bottom: 1rem; color: var(--navy);">Informasi Insiden</h3>
        <div id="incidentInfo">Memuat...</div>
      </div>

      <!-- Panel Kanan: Timeline & Form -->
      <div class="stat-card">
        <h3 style="margin-bottom: 1rem; color: var(--navy);">Riwayat Investigasi</h3>
        <div id="incidentTimeline" style="margin-bottom: 1.5rem; max-height: 300px; overflow-y: auto;">Memuat...</div>
        
        <form id="noteForm" style="display: ${canEdit ? 'block' : 'none'}; border-top: 1px solid var(--border); padding-top: 1.5rem;">
          <div class="form-group">
            <label>Tambahkan Catatan Investigasi</label>
            <textarea id="noteMessage" rows="3" required placeholder="Tulis temuan atau tindakan yang dilakukan..."></textarea>
          </div>
          <button type="submit" class="btn btn-primary" style="width: auto;">Kirim Catatan</button>
        </form>
      </div>
    </div>
  `;

  function getStatusBadge(status) {
    const cssClass = status.toLowerCase().replace('_', '-'); 
    const targetClass = cssClass === 'in-progress' ? 'in_progress' : cssClass;
    return `<span class="badge badge-${targetClass}">${status}</span>`;
  }

  async function loadData() {
    try {
      const res = await apiFetch(`/incidents/${id}`);
      const inc = res.data;

      document.getElementById('titleHeader').textContent = inc.title;
      
      // Render Info Panel
      document.getElementById('incidentInfo').innerHTML = `
        <p style="margin-bottom: 0.75rem;"><strong>Kode:</strong> <span style="font-family: monospace;">${inc.incident_code}</span></p>
        <p style="margin-bottom: 0.75rem;"><strong>Status:</strong> ${getStatusBadge(inc.status)}</p>
        <p style="margin-bottom: 0.75rem;"><strong>Severity:</strong> <span class="badge badge-${inc.severity.toLowerCase()}">${inc.severity}</span></p>
        <p style="margin-bottom: 0.75rem;"><strong>Layanan:</strong> ${inc.service_name || '-'}</p>
        <p style="margin-bottom: 0.75rem;"><strong>Dibuka:</strong> ${new Date(inc.opened_at).toLocaleString('id-ID')}</p>
        <hr style="margin: 1rem 0; border: 0; border-top: 1px solid var(--border);">
        <p style="margin-bottom: 0.5rem; font-size: 0.9rem;"><strong>Deskripsi:</strong><br>${inc.description}</p>
        ${inc.resolution ? `<p style="margin-top: 1rem; font-size: 0.9rem; color: var(--success-text);"><strong>Resolusi:</strong><br>${inc.resolution}</p>` : ''}
      `;

      // Render Timeline
      if (inc.updates.length === 0) {
        document.getElementById('incidentTimeline').innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">Belum ada catatan.</p>';
      } else {
        document.getElementById('incidentTimeline').innerHTML = inc.updates.map(u => `
          <div style="border-left: 3px solid var(--primary); padding-left: 1rem; margin-bottom: 1rem;">
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.25rem;">
              ${new Date(u.created_at).toLocaleString('id-ID')} - <strong>${u.user_name || 'Sistem'}</strong> (${u.update_type})
            </div>
            <div style="font-size: 0.95rem; color: var(--text);">${u.message}</div>
          </div>
        `).join('');
      }

    } catch (err) {
      document.getElementById('incidentInfo').innerHTML = `<p style="color: var(--danger);">Error: ${err.message}</p>`;
    }
  }

  document.getElementById('noteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('noteMessage').value;
    try {
      await apiFetch(`/incidents/${id}/updates`, { method: 'POST', body: { message: msg } });
      document.getElementById('noteMessage').value = '';
      loadData();
    } catch (err) { alert('Gagal: ' + err.message); }
  });

  loadData();
});
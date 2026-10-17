document.addEventListener('layoutReady', async () => {
  const content = document.getElementById('page-content');
  const user = window.currentUser;
  
  // Tentukan apakah user boleh mengubah data (Admin / Support)
  const canEdit = user.role === 'ADMIN' || user.role === 'SUPPORT_ENGINEER';

  // Template UI Halaman Assets + Modal
  content.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2 style="color: var(--navy);">IT Asset Inventory</h2>
      ${canEdit ? '<button class="btn btn-primary" style="width: auto;" id="btnAddAsset">+ Tambah Aset</button>' : ''}
    </div>

    <div style="background: white; padding: 1rem; border-radius: 8px; border: 1px solid var(--border); margin-bottom: 1rem; display: flex; gap: 1rem;">
      <input type="text" id="searchInput" placeholder="Cari kode, nama, atau serial..." style="flex: 1; padding: 0.5rem; border: 1px solid var(--border); border-radius: 4px;">
      <select id="statusFilter" style="padding: 0.5rem; border: 1px solid var(--border); border-radius: 4px;">
        <option value="">Semua Status</option>
        <option value="AVAILABLE">Available</option>
        <option value="IN_USE">In Use</option>
        <option value="MAINTENANCE">Maintenance</option>
        <option value="RETIRED">Retired</option>
      </select>
    </div>

    <div style="background: white; border-radius: 8px; border: 1px solid var(--border); overflow: hidden;">
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead style="background: var(--bg); border-bottom: 1px solid var(--border);">
          <tr>
            <th style="padding: 1rem;">Asset Code</th>
            <th style="padding: 1rem;">Name</th>
            <th style="padding: 1rem;">Category</th>
            <th style="padding: 1rem;">Status</th>
            <th style="padding: 1rem;">Location</th>
            ${canEdit ? '<th style="padding: 1rem; text-align: right;">Actions</th>' : ''}
          </tr>
        </thead>
        <tbody id="assetTableBody">
          <tr><td colspan="6" style="text-align: center; padding: 2rem;">Memuat data...</td></tr>
        </tbody>
      </table>
    </div>

    <div id="pagination" style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;"></div>

    <!-- Modal Form -->
    <div class="modal-overlay" id="assetModal">
      <div class="modal-box">
        <div class="modal-header">
          <h3 id="modalTitle">Tambah Aset</h3>
          <button class="modal-close" id="btnCloseModal">&times;</button>
        </div>
        <form id="assetForm">
          <div class="modal-body">
            <input type="hidden" id="assetId">
            <div class="form-group">
              <label>Kode Aset *</label>
              <input type="text" id="assetCode" required>
            </div>
            <div class="form-group">
              <label>Nama Aset *</label>
              <input type="text" id="assetName" required>
            </div>
            <div class="form-group">
              <label>Kategori *</label>
              <select id="assetCategory" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 4px;"></select>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Brand</label>
                <input type="text" id="assetBrand">
              </div>
              <div class="form-group">
                <label>Model</label>
                <input type="text" id="assetModel">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Serial Number</label>
                <input type="text" id="assetSerial">
              </div>
              <div class="form-group">
                <label>Lokasi</label>
                <input type="text" id="assetLocation">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Tanggal Pembelian</label>
                <input type="date" id="assetDate">
              </div>
              <div class="form-group">
                <label>Status *</label>
                <select id="assetStatus" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 4px;">
                  <option value="AVAILABLE">Available</option>
                  <option value="IN_USE">In Use</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="RETIRED">Retired</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Catatan</label>
              <textarea id="assetNotes" rows="2" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 4px;"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="btnCancelModal" style="width: auto;">Batal</button>
            <button type="submit" class="btn btn-primary" id="btnSaveAsset" style="width: auto;">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // State
  let state = { page: 1, limit: 5, search: '', status: '' };
  let categoriesList = [];

  // Helper Elements
  const modal = document.getElementById('assetModal');
  const form = document.getElementById('assetForm');
  const catSelect = document.getElementById('assetCategory');
  const btnAdd = document.getElementById('btnAddAsset');

  // 1. Ambil Data Kategori untuk Dropdown
  try {
    const res = await apiFetch('/categories');
    categoriesList = res.data;
    catSelect.innerHTML = '<option value="">Pilih Kategori...</option>' + 
      categoriesList.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  } catch (err) {
    alert('Gagal memuat kategori: ' + err.message);
  }

  // Helper Badge Status
  function getStatusBadge(status) {
    const colors = { AVAILABLE: 'var(--success)', IN_USE: 'var(--primary)', MAINTENANCE: 'var(--warning)', RETIRED: 'var(--danger)' };
    return `<span style="background: ${colors[status]}; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">${status}</span>`;
  }

  // 2. Fetch & Render Tabel
  async function loadAssets() {
    const tbody = document.getElementById('assetTableBody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">Memuat data...</td></tr>';
    
    try {
      const query = new URLSearchParams({ page: state.page, limit: state.limit, search: state.search, status: state.status }).toString();
      const res = await apiFetch(`/assets?${query}`);
      const { data, pagination } = res;

      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">Tidak ada aset ditemukan.</td></tr>';
      } else {
        tbody.innerHTML = data.map(asset => `
          <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 1rem; font-weight: 600;">${asset.assetCode}</td>
            <td style="padding: 1rem;">${asset.name}</td>
            <td style="padding: 1rem;">${asset.categoryName}</td>
            <td style="padding: 1rem;">${getStatusBadge(asset.status)}</td>
            <td style="padding: 1rem;">${asset.location || '-'}</td>
            ${canEdit ? `
              <td style="padding: 1rem; text-align: right;">
                <button class="action-btn edit" onclick='openModal("edit", ${JSON.stringify(asset).replace(/'/g, "&#39;")})'>Edit</button>
                <button class="action-btn delete" onclick="deleteAsset(${asset.id})">Hapus</button>
              </td>
            ` : ''}
          </tr>
        `).join('');
      }

      // Pagination
      document.getElementById('pagination').innerHTML = `
        <span style="font-size: 0.9rem; color: var(--text-muted);">Halaman ${pagination.page} dari ${pagination.totalPages || 1} (Total: ${pagination.total})</span>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn" style="width: auto; padding: 0.5rem 1rem; background: ${pagination.page <= 1 ? 'var(--border)' : 'var(--primary)'}; color: ${pagination.page <= 1 ? 'var(--text-muted)' : 'white'};" 
            onclick="changePage(${pagination.page - 1})" ${pagination.page <= 1 ? 'disabled' : ''}>Prev</button>
          <button class="btn" style="width: auto; padding: 0.5rem 1rem; background: ${pagination.page >= pagination.totalPages ? 'var(--border)' : 'var(--primary)'}; color: ${pagination.page >= pagination.totalPages ? 'var(--text-muted)' : 'white'};" 
            onclick="changePage(${pagination.page + 1})" ${pagination.page >= pagination.totalPages ? 'disabled' : ''}>Next</button>
        </div>
      `;
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--danger);">Error: ${err.message}</td></tr>`;
    }
  }

  // 3. Buka Modal (Tambah / Edit)
  window.openModal = (mode, asset = null) => {
    form.reset();
    document.getElementById('assetId').value = '';
    
    if (mode === 'edit') {
      document.getElementById('modalTitle').textContent = 'Edit Aset';
      document.getElementById('assetId').value = asset.id;
      document.getElementById('assetCode').value = asset.assetCode;
      document.getElementById('assetName').value = asset.name;
      catSelect.value = asset.categoryId;
      document.getElementById('assetBrand').value = asset.brand || '';
      document.getElementById('assetModel').value = asset.model || '';
      document.getElementById('assetSerial').value = asset.serialNumber || '';
      document.getElementById('assetLocation').value = asset.location || '';
      document.getElementById('assetDate').value = asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '';
      document.getElementById('assetStatus').value = asset.status;
      document.getElementById('assetNotes').value = asset.notes || '';
    } else {
      document.getElementById('modalTitle').textContent = 'Tambah Aset';
    }
    
    modal.classList.add('active');
  };

  // 4. Tutup Modal
  const closeModal = () => modal.classList.remove('active');
  document.getElementById('btnCloseModal').addEventListener('click', closeModal);
  document.getElementById('btnCancelModal').addEventListener('click', closeModal);

  // 5. Submit Form (Create / Update)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSaveAsset');
    const id = document.getElementById('assetId').value;
    
    const payload = {
      assetCode: document.getElementById('assetCode').value.trim(),
      name: document.getElementById('assetName').value.trim(),
      categoryId: Number(catSelect.value),
      brand: document.getElementById('assetBrand').value.trim(),
      model: document.getElementById('assetModel').value.trim(),
      serialNumber: document.getElementById('assetSerial').value.trim(),
      location: document.getElementById('assetLocation').value.trim(),
      purchaseDate: document.getElementById('assetDate').value || null,
      status: document.getElementById('assetStatus').value,
      notes: document.getElementById('assetNotes').value.trim()
    };

    btn.textContent = 'Menyimpan...'; btn.disabled = true;

    try {
      if (id) {
        await apiFetch(`/assets/${id}`, { method: 'PATCH', body: payload });
      } else {
        await apiFetch('/assets', { method: 'POST', body: payload });
      }
      closeModal();
      loadAssets(); // Refresh tabel
    } catch (err) {
      alert('Gagal menyimpan: ' + (err.code === 'DUPLICATE_ASSET' ? 'Kode aset atau serial sudah ada.' : err.message));
    } finally {
      btn.textContent = 'Simpan'; btn.disabled = false;
    }
  });

  // 6. Hapus Aset
  window.deleteAsset = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus aset ini? Tindakan ini tidak dapat dibatalkan.')) return;
    try {
      await apiFetch(`/assets/${id}`, { method: 'DELETE' });
      loadAssets();
    } catch (err) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  // Event Listeners Filter
  let searchTimeout;
  document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.search = e.target.value; state.page = 1; loadAssets();
    }, 300); // Debounce 300ms agar tidak spam request
  });

  document.getElementById('statusFilter').addEventListener('change', (e) => {
    state.status = e.target.value; state.page = 1; loadAssets();
  });

  window.changePage = (newPage) => { if (newPage < 1) return; state.page = newPage; loadAssets(); };
  
  if (canEdit && btnAdd) btnAdd.addEventListener('click', () => window.openModal('create'));

  // Initial Load
  loadAssets();
});
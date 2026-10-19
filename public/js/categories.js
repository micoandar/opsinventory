document.addEventListener('layoutReady', async () => {
  const content = document.getElementById('page-content');
  const user = window.currentUser;
  const canEdit = user.role === 'ADMIN' || user.role === 'SUPPORT_ENGINEER';

  content.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2 style="color: var(--navy);">Asset Categories</h2>
      ${canEdit ? '<button class="btn btn-primary" style="width: auto;" id="btnAddCategory">+ Tambah Kategori</button>' : ''}
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="cursor: pointer;" id="thId">ID <span id="sortId">↕</span></th>
            <th style="cursor: pointer;" id="thName">Name <span id="sortName">↕</span></th>
            <th>Description</th>
            ${canEdit ? '<th style="text-align: right;">Actions</th>' : ''}
          </tr>
        </thead>
        <tbody id="categoryTableBody">
          <tr><td colspan="4" style="text-align: center; padding: 2rem;">Memuat data...</td></tr>
        </tbody>
      </table>
    </div>

    <div class="modal-overlay" id="categoryModal">
      <div class="modal-box">
        <div class="modal-header">
          <h3 id="modalTitle">Tambah Kategori</h3>
          <button class="modal-close" id="btnCloseModal">&times;</button>
        </div>
        <form id="categoryForm">
          <div class="modal-body">
            <input type="hidden" id="categoryId">
            <div class="form-group">
              <label>Nama Kategori *</label>
              <input type="text" id="categoryName" required>
            </div>
            <div class="form-group">
              <label>Deskripsi</label>
              <textarea id="categoryDesc" rows="3"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="btnCancelModal" style="width: auto;">Batal</button>
            <button type="submit" class="btn btn-primary" id="btnSaveCategory" style="width: auto;">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const modal = document.getElementById('categoryModal');
  const form = document.getElementById('categoryForm');
  let categoriesData = []; 
  
  // State untuk Sorting
  let sortState = { key: 'id', order: 'ASC' };

  async function loadCategories() {
    const tbody = document.getElementById('categoryTableBody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">Memuat data...</td></tr>';
    
    try {
      const res = await apiFetch('/categories');
      categoriesData = res.data;
      renderTable();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem; color: var(--danger);">Error: ${err.message}</td></tr>`;
    }
  }

  // Fungsi untuk merender tabel berdasarkan state sorting
  function renderTable() {
    const tbody = document.getElementById('categoryTableBody');
    
    // Update indikator panah
    document.getElementById('sortId').textContent = sortState.key === 'id' ? (sortState.order === 'ASC' ? '↑' : '↓') : '↕';
    document.getElementById('sortName').textContent = sortState.key === 'name' ? (sortState.order === 'ASC' ? '↑' : '↓') : '↕';

    // Proses Sorting
    const sortedData = [...categoriesData].sort((a, b) => {
      let valA = a[sortState.key];
      let valB = b[sortState.key];
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      
      if (valA < valB) return sortState.order === 'ASC' ? -1 : 1;
      if (valA > valB) return sortState.order === 'ASC' ? 1 : -1;
      return 0;
    });

    if (sortedData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-muted);">Belum ada kategori.</td></tr>';
      return;
    }

    tbody.innerHTML = sortedData.map(cat => `
      <tr>
        <td>${cat.id}</td>
        <td style="font-weight: 600;">${cat.name}</td>
        <td style="color: var(--text-muted);">${cat.description || '-'}</td>
        ${canEdit ? `
          <td style="text-align: right;">
            <button class="action-btn edit" data-action="edit" data-id="${cat.id}">Edit</button>
            <button class="action-btn delete" data-action="delete" data-id="${cat.id}">Hapus</button>
          </td>
        ` : ''}
      </tr>
    `).join('');
  }

  // Event Listener untuk Sorting Header
  document.getElementById('thId').addEventListener('click', () => {
    sortState.order = (sortState.key === 'id' && sortState.order === 'ASC') ? 'DESC' : 'ASC';
    sortState.key = 'id';
    renderTable();
  });

  document.getElementById('thName').addEventListener('click', () => {
    sortState.order = (sortState.key === 'name' && sortState.order === 'ASC') ? 'DESC' : 'ASC';
    sortState.key = 'name';
    renderTable();
  });

  // Event Delegation untuk Tombol Edit/Hapus
  document.getElementById('categoryTableBody').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = Number(btn.dataset.id);
    const cat = categoriesData.find(c => c.id === id);

    if (action === 'edit') openModal('edit', cat);
    if (action === 'delete') deleteCategory(id);
  });

  function openModal(mode, cat = null) {
    form.reset();
    document.getElementById('categoryId').value = '';
    
    if (mode === 'edit') {
      document.getElementById('modalTitle').textContent = 'Edit Kategori';
      document.getElementById('categoryId').value = cat.id;
      document.getElementById('categoryName').value = cat.name;
      document.getElementById('categoryDesc').value = cat.description || '';
    } else {
      document.getElementById('modalTitle').textContent = 'Tambah Kategori';
    }
    modal.classList.add('active');
  }

  const closeModal = () => modal.classList.remove('active');
  document.getElementById('btnCloseModal').addEventListener('click', closeModal);
  document.getElementById('btnCancelModal').addEventListener('click', closeModal);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSaveCategory');
    const id = document.getElementById('categoryId').value;
    const payload = {
      name: document.getElementById('categoryName').value.trim(),
      description: document.getElementById('categoryDesc').value.trim()
    };

    btn.textContent = 'Menyimpan...'; btn.disabled = true;

    try {
      if (id) await apiFetch(`/categories/${id}`, { method: 'PATCH', body: payload });
      else await apiFetch('/categories', { method: 'POST', body: payload });
      
      closeModal();
      loadCategories();
    } catch (err) {
      alert('Gagal menyimpan: ' + (err.code === 'DUPLICATE_CATEGORY' ? 'Nama kategori sudah ada.' : err.message));
    } finally {
      btn.textContent = 'Simpan'; btn.disabled = false;
    }
  });

  async function deleteCategory(id) {
    if (!confirm('Hapus kategori ini? Pastikan tidak ada aset yang menggunakan kategori ini.')) return;
    try {
      await apiFetch(`/categories/${id}`, { method: 'DELETE' });
      loadCategories();
    } catch (err) {
      alert('Gagal menghapus: Kategori ini mungkin sedang digunakan oleh aset.');
    }
  }

  if (canEdit) document.getElementById('btnAddCategory').addEventListener('click', () => openModal('create'));
  
  // Muat data pertama kali (default urut berdasarkan ID Ascending)
  loadCategories();
});
document.addEventListener('layoutReady', async () => {
  const content = document.getElementById('page-content');
  const user = window.currentUser;
  const canEdit = user.role === 'ADMIN' || user.role === 'SUPPORT_ENGINEER';

  content.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2 style="color: var(--navy);">Asset Categories</h2>
      ${canEdit ? '<button class="btn btn-primary" style="width: auto;" id="btnAddCategory">+ Tambah Kategori</button>' : ''}
    </div>

    <div style="background: white; border-radius: 8px; border: 1px solid var(--border); overflow: hidden;">
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead style="background: var(--bg); border-bottom: 1px solid var(--border);">
          <tr>
            <th style="padding: 1rem;">ID</th>
            <th style="padding: 1rem;">Name</th>
            <th style="padding: 1rem;">Description</th>
            ${canEdit ? '<th style="padding: 1rem; text-align: right;">Actions</th>' : ''}
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
  let categoriesData = []; // Simpan data di memori

  async function loadCategories() {
    const tbody = document.getElementById('categoryTableBody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">Memuat data...</td></tr>';
    
    try {
      const res = await apiFetch('/categories');
      categoriesData = res.data;
      
      if (categoriesData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-muted);">Belum ada kategori.</td></tr>';
      } else {
        // Gunakan data-action
        tbody.innerHTML = categoriesData.map(cat => `
          <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 1rem;">${cat.id}</td>
            <td style="padding: 1rem; font-weight: 600;">${cat.name}</td>
            <td style="padding: 1rem; color: var(--text-muted);">${cat.description || '-'}</td>
            ${canEdit ? `
              <td style="padding: 1rem; text-align: right;">
                <button class="action-btn edit" data-action="edit" data-id="${cat.id}">Edit</button>
                <button class="action-btn delete" data-action="delete" data-id="${cat.id}">Hapus</button>
              </td>
            ` : ''}
          </tr>
        `).join('');
      }
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem; color: var(--danger);">Error: ${err.message}</td></tr>`;
    }
  }

  // Event Delegation
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
  loadCategories();
});
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

    <!-- Modal Form -->
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
              <input type="text" id="categoryName" required placeholder="Contoh: Laptop, Monitor">
            </div>
            <div class="form-group">
              <label>Deskripsi</label>
              <textarea id="categoryDesc" rows="3" placeholder="Keterangan singkat..."></textarea>
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

  // 1. Load Data
  async function loadCategories() {
    const tbody = document.getElementById('categoryTableBody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">Memuat data...</td></tr>';
    
    try {
      const res = await apiFetch('/categories');
      const data = res.data;
      
      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-muted);">Belum ada kategori.</td></tr>';
      } else {
        tbody.innerHTML = data.map(cat => `
          <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 1rem;">${cat.id}</td>
            <td style="padding: 1rem; font-weight: 600;">${cat.name}</td>
            <td style="padding: 1rem; color: var(--text-muted);">${cat.description || '-'}</td>
            ${canEdit ? `
              <td style="padding: 1rem; text-align: right;">
                <button class="action-btn edit" onclick='openModal("edit", ${JSON.stringify(cat).replace(/'/g, "&#39;")})'>Edit</button>
                <button class="action-btn delete" onclick="deleteCategory(${cat.id})">Hapus</button>
              </td>
            ` : ''}
          </tr>
        `).join('');
      }
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem; color: var(--danger);">Error: ${err.message}</td></tr>`;
    }
  }

  // 2. Buka Modal
  window.openModal = (mode, cat = null) => {
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
  };

  // 3. Tutup Modal
  const closeModal = () => modal.classList.remove('active');
  document.getElementById('btnCloseModal').addEventListener('click', closeModal);
  document.getElementById('btnCancelModal').addEventListener('click', closeModal);

  // 4. Submit Form
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
      if (id) {
        await apiFetch(`/categories/${id}`, { method: 'PATCH', body: payload });
      } else {
        await apiFetch('/categories', { method: 'POST', body: payload });
      }
      closeModal();
      loadCategories();
    } catch (err) {
      alert('Gagal menyimpan: ' + (err.code === 'DUPLICATE_CATEGORY' ? 'Nama kategori sudah ada.' : err.message));
    } finally {
      btn.textContent = 'Simpan'; btn.disabled = false;
    }
  });

  // 5. Hapus Data
  window.deleteCategory = async (id) => {
    if (!confirm('Hapus kategori ini? Pastikan tidak ada aset yang menggunakan kategori ini.')) return;
    try {
      await apiFetch(`/categories/${id}`, { method: 'DELETE' });
      loadCategories();
    } catch (err) {
      // Tangkap error jika kategori masih dipakai oleh aset (RESTRICT foreign key)
      alert('Gagal menghapus: Kategori ini mungkin sedang digunakan oleh aset lain.');
    }
  };

  if (canEdit) {
    document.getElementById('btnAddCategory').addEventListener('click', () => window.openModal('create'));
  }

  // Load awal
  loadCategories();
});
document.addEventListener('layoutReady', async () => {
  const content = document.getElementById('page-content');
  const user = window.currentUser;

  // Proteksi ekstra di frontend
  if (user.role !== 'ADMIN') {
    content.innerHTML = '<h2 style="color: var(--danger);">403 - Akses Ditolak. Halaman ini hanya untuk Admin.</h2>';
    return;
  }

  content.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2 style="color: var(--navy);">User Management</h2>
      <button class="btn btn-primary" style="width: auto;" id="btnAddUser">+ Tambah User</button>
    </div>

    <div style="background: white; border-radius: 8px; border: 1px solid var(--border); overflow: hidden;">
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead style="background: var(--bg); border-bottom: 1px solid var(--border);">
          <tr>
            <th style="padding: 1rem;">Username</th>
            <th style="padding: 1rem;">Nama Lengkap</th>
            <th style="padding: 1rem;">Role</th>
            <th style="padding: 1rem;">Status</th>
            <th style="padding: 1rem; text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody id="userTableBody">
          <tr><td colspan="5" style="text-align: center; padding: 2rem;">Memuat data...</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Create/Edit User -->
    <div class="modal-overlay" id="userModal">
      <div class="modal-box">
        <div class="modal-header">
          <h3 id="modalTitle">Tambah User</h3>
          <button class="modal-close" id="btnCloseModal">&times;</button>
        </div>
        <form id="userForm">
          <div class="modal-body">
            <input type="hidden" id="userId">
            <div class="form-group">
              <label>Username *</label>
              <input type="text" id="username" required>
            </div>
            <div class="form-group">
              <label>Email *</label>
              <input type="email" id="email" required>
            </div>
            <div class="form-group" id="passwordGroup">
              <label>Password *</label>
              <input type="password" id="password" required minlength="8">
            </div>
            <div class="form-group">
              <label>Nama Lengkap *</label>
              <input type="text" id="fullName" required>
            </div>
            <div class="form-group">
              <label>Role *</label>
              <select id="role" required>
                <option value="VIEWER">VIEWER (Hanya Lihat)</option>
                <option value="SUPPORT_ENGINEER">SUPPORT ENGINEER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="btnCancelModal" style="width: auto;">Batal</button>
            <button type="submit" class="btn btn-primary" id="btnSaveUser" style="width: auto;">Simpan</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Reset Password -->
    <div class="modal-overlay" id="passwordModal">
      <div class="modal-box">
        <div class="modal-header">
          <h3>Reset Password</h3>
          <button class="modal-close" id="btnClosePwdModal">&times;</button>
        </div>
        <form id="passwordForm">
          <div class="modal-body">
            <input type="hidden" id="pwdUserId">
            <p style="margin-bottom: 1rem; font-size: 0.9rem; color: var(--text-muted);">Masukkan password baru untuk user ini.</p>
            <div class="form-group">
              <label>Password Baru *</label>
              <input type="password" id="newPassword" required minlength="8">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="btnCancelPwdModal" style="width: auto;">Batal</button>
            <button type="submit" class="btn btn-primary" id="btnSavePwd" style="width: auto;">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const userModal = document.getElementById('userModal');
  const pwdModal = document.getElementById('passwordModal');
  let usersData = []; // Simpan data user di memori

  // Helper Badge Status
  function getStatusBadge(isActive) {
    return isActive 
      ? '<span style="background: var(--success); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">ACTIVE</span>'
      : '<span style="background: var(--danger); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">INACTIVE</span>';
  }

  // 1. Load Users
  async function loadUsers() {
    const tbody = document.getElementById('userTableBody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">Memuat data...</td></tr>';
    
    try {
      const res = await apiFetch('/users?limit=100');
      usersData = res.data;
      
      // Render tabel menggunakan data-action (BUKAN onclick)
      tbody.innerHTML = usersData.map(u => `
        <tr style="border-bottom: 1px solid var(--border);">
          <td style="padding: 1rem; font-weight: 600;">${u.username}</td>
          <td style="padding: 1rem;">${u.fullName}</td>
          <td style="padding: 1rem;">
            <span style="background: var(--bg); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">${u.role}</span>
          </td>
          <td style="padding: 1rem;">${getStatusBadge(u.isActive)}</td>
          <td style="padding: 1rem; text-align: right;">
            <button class="action-btn edit" data-action="edit" data-id="${u.id}">Edit</button>
            <button class="action-btn edit" data-action="reset-pwd" data-id="${u.id}">Reset Pwd</button>
            ${u.id !== 1 ? `<button class="action-btn delete" data-action="toggle-status" data-id="${u.id}">${u.isActive ? 'Nonaktifkan' : 'Aktifkan'}</button>` : ''}
          </td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--danger);">Error: ${err.message}</td></tr>`;
    }
  }

  // 2. Event Delegation untuk Tombol Tabel
  document.getElementById('userTableBody').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const action = btn.dataset.action;
    const id = Number(btn.dataset.id);
    const targetUser = usersData.find(x => x.id === id);

    if (action === 'edit') editUser(targetUser);
    else if (action === 'reset-pwd') openPwdModal(id);
    else if (action === 'toggle-status') toggleStatus(id, targetUser.isActive);
  });

  // 3. Modal User (Create/Edit)
  function editUser(u) {
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = u.id;
    document.getElementById('username').value = u.username;
    document.getElementById('username').disabled = true;
    document.getElementById('email').value = u.email;
    document.getElementById('fullName').value = u.fullName;
    document.getElementById('role').value = u.role;
    
    document.getElementById('passwordGroup').style.display = 'none';
    document.getElementById('password').required = false;

    document.getElementById('modalTitle').textContent = 'Edit User';
    userModal.classList.add('active');
  }

  document.getElementById('btnAddUser').addEventListener('click', () => {
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('username').disabled = false;
    
    document.getElementById('passwordGroup').style.display = 'block';
    document.getElementById('password').required = true;

    document.getElementById('modalTitle').textContent = 'Tambah User';
    userModal.classList.add('active');
  });

  const closeModal = () => userModal.classList.remove('active');
  document.getElementById('btnCloseModal').addEventListener('click', closeModal);
  document.getElementById('btnCancelModal').addEventListener('click', closeModal);

  // 4. Submit Form User
  document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSaveUser');
    const id = document.getElementById('userId').value;
    
    const payload = {
      email: document.getElementById('email').value.trim(),
      fullName: document.getElementById('fullName').value.trim(),
      role: document.getElementById('role').value
    };

    if (!id) {
      payload.username = document.getElementById('username').value.trim();
      payload.password = document.getElementById('password').value;
    }

    btn.textContent = 'Menyimpan...'; btn.disabled = true;

    try {
      if (id) {
        await apiFetch(`/users/${id}`, { method: 'PATCH', body: payload });
      } else {
        await apiFetch('/users', { method: 'POST', body: payload });
      }
      closeModal();
      loadUsers();
    } catch (err) {
      alert('Gagal menyimpan: ' + (err.code === 'DUPLICATE_USER' ? 'Username/Email sudah ada.' : err.message));
    } finally {
      btn.textContent = 'Simpan'; btn.disabled = false;
    }
  });

  // 5. Toggle Status (Aktif/Nonaktif)
  async function toggleStatus(id, currentStatus) {
    const action = currentStatus ? 'menonaktifkan' : 'mengaktifkan';
    if (!confirm(`Yakin ingin ${action} user ini?`)) return;
    
    try {
      await apiFetch(`/users/${id}/status`, { method: 'PATCH', body: { isActive: !currentStatus } });
      loadUsers();
    } catch (err) {
      alert('Gagal: ' + err.message);
    }
  }

  // 6. Modal Reset Password
  function openPwdModal(id) {
    document.getElementById('passwordForm').reset();
    document.getElementById('pwdUserId').value = id;
    pwdModal.classList.add('active');
  }

  const closePwdModal = () => pwdModal.classList.remove('active');
  document.getElementById('btnClosePwdModal').addEventListener('click', closePwdModal);
  document.getElementById('btnCancelPwdModal').addEventListener('click', closePwdModal);

  document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSavePwd');
    const id = document.getElementById('pwdUserId').value;
    
    btn.textContent = 'Menyimpan...'; btn.disabled = true;

    try {
      await apiFetch(`/users/${id}/password`, { 
        method: 'PATCH', 
        body: { password: document.getElementById('newPassword').value } 
      });
      closePwdModal();
      alert('Password berhasil direset!');
    } catch (err) {
      alert('Gagal reset password: ' + err.message);
    } finally {
      btn.textContent = 'Simpan'; btn.disabled = false;
    }
  });

  loadUsers();
});
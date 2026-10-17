document.addEventListener('DOMContentLoaded', async () => {
  // 1. Proteksi Halaman: Cek apakah user valid
  try {
    const res = await apiFetch('/auth/me');
    const user = res.data.user;

    // Simpan user di memori untuk dipakai script lain
    window.currentUser = user;

    // 2. Render Layout (Sidebar & Topbar)
    const layoutContainer = document.getElementById('app-layout');
    if (layoutContainer) {
      layoutContainer.innerHTML = `
        <div class="app-wrapper">
          <!-- Sidebar -->
          <aside class="sidebar">
            <div class="sidebar-header">OpsInventory</div>
            <ul class="sidebar-menu">
              <li><a href="/dashboard.html">📊 Dashboard</a></li>
              <li><a href="/assets.html">💻 Assets</a></li>
              <li><a href="/categories.html">📁 Categories</a></li>
              <!-- Menu di bawah ini hanya untuk ADMIN -->
              ${user.role === 'ADMIN' ? '<li><a href="/users.html">👥 Users</a></li>' : ''}
              ${user.role === 'ADMIN' ? '<li><a href="/logs.html">📝 System Logs</a></li>' : ''}
            </ul>
          </aside>

          <!-- Main Content -->
          <main class="main-content">
            <header class="topbar">
              <div class="topbar-title">Dashboard</div>
              <div class="user-info">
                <span>${user.fullName}</span>
                <span class="user-badge">${user.role}</span>
                <button id="logoutBtn" class="btn-logout">Logout</button>
              </div>
            </header>
            
            <div class="content-inner" id="page-content">
              <!-- Konten dinamis akan dimuat di sini oleh script halaman -->
            </div>
          </main>
        </div>
      `;

      // Handle Logout
      document.getElementById('logoutBtn').addEventListener('click', async () => {
        await apiFetch('/auth/logout', { method: 'POST' });
        window.location.href = '/login.html';
      });

      // Beri sinyal bahwa layout sudah siap
      document.dispatchEvent(new Event('layoutReady'));
    }
  } catch (err) {
    // Jika 401 (tidak ada sesi), tendang ke halaman login
    window.location.href = '/login.html';
  }
});
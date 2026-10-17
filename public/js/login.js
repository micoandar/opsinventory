document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('submitBtn');
    const errorBox = document.getElementById('errorBox');
    
    // Ambil nilai dan bersihkan spasi
    const identifier = document.getElementById('identifier').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!identifier || !password) {
      errorBox.textContent = 'Username/Email dan Password tidak boleh kosong.';
      errorBox.style.display = 'block';
      return;
    }

    // Reset UI
    btn.textContent = 'Memproses...';
    btn.disabled = true;
    errorBox.style.display = 'none';

    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: {
          usernameOrEmail: identifier,
          password: password
        }
      });
      
      // Sukses, alihkan ke dashboard
      window.location.href = '/dashboard.html';
    } catch (err) {
      // Tampilkan error
      errorBox.textContent = err.code === 'INVALID_CREDENTIALS' 
        ? 'Username/Email atau password salah.' 
        : err.message;
      errorBox.style.display = 'block';
      
      btn.textContent = 'Masuk';
      btn.disabled = false;
    }
  });
});
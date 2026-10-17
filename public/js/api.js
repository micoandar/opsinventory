const API_BASE = '/api/v1';

async function apiFetch(endpoint, options = {}) {
  const defaultHeaders = { 'Content-Type': 'application/json' };
  
  const config = {
    ...options,
    headers: { ...defaultHeaders, ...options.headers },
    credentials: 'include' // Wajib agar session cookie terkirim
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      // Lemparkan error agar bisa ditangkap di blok catch
      const error = new Error(data.message || 'Terjadi kesalahan sistem');
      error.code = data.error ? data.error.code : 'UNKNOWN';
      error.status = response.status;
      throw error;
    }
    return data;
  } catch (err) {
    // Jika error jaringan (server mati)
    if (err.name === 'TypeError') {
      err.message = 'Tidak dapat terhubung ke server.';
    }
    throw err;
  }
}
const authLog = document.getElementById('authLog');

function showError(msg) {
  authLog.hidden = false;
  authLog.className = 'log error';
  authLog.textContent = '✗ ' + msg;
}

function clearError() {
  authLog.hidden = true;
}

function saveSession(data) {
  localStorage.setItem('zt_token', data.access_token);
  localStorage.setItem('zt_username', data.username);
  localStorage.setItem('zt_role', data.role);
}

function targetFor(role) {
  return role === 'admin' ? 'admin-dashboard.html' : 'user-dashboard.html';
}

function setBtnLoading(btn, loading, label) {
  if (!btn) return;
  if (loading) {
    btn.dataset.label = btn.textContent;
    btn.disabled = true;
    btn.textContent = label || 'Chargement…';
  } else {
    btn.disabled = false;
    btn.textContent = btn.dataset.label || btn.textContent;
  }
}

async function api(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur HTTP ${res.status}`);
  return data;
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const btn = document.getElementById('loginSubmitBtn');
    setBtnLoading(btn, true, 'Connexion…');
    try {
      const data = await api('/auth/login', {
        username: loginUsername.value.trim(),
        password: loginPassword.value,
      });
      saveSession(data);
      location.href = targetFor(data.role);
    } catch (err) {
      showError(err.message);
      setBtnLoading(btn, false);
    }
  });
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const btn = document.getElementById('registerSubmitBtn');
    setBtnLoading(btn, true, 'Création…');
    try {
      const data = await api('/auth/register', {
        username: registerUsername.value.trim(),
        password: registerPassword.value,
      });
      saveSession(data);
      location.href = targetFor(data.role);
    } catch (err) {
      showError(err.message);
      setBtnLoading(btn, false);
    }
  });
}

const guestBtn = document.getElementById('guestBtn');
if (guestBtn) {
  guestBtn.addEventListener('click', async () => {
    clearError();
    setBtnLoading(guestBtn, true, 'Accès invité…');
    try {
      const data = await api('/auth/guest', {});
      saveSession(data);
      location.href = targetFor(data.role);
    } catch (err) {
      showError(err.message);
      setBtnLoading(guestBtn, false);
    }
  });
}

// Redirect if already logged in
if (localStorage.getItem('zt_token')) {
  location.href = targetFor(localStorage.getItem('zt_role') || 'user');
}

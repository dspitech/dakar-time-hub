/* Zero-Trust HLS — Dashboard (admin & user) */

const state = {
  token: localStorage.getItem('zt_token'),
  username: localStorage.getItem('zt_username'),
  role: localStorage.getItem('zt_role'),
  currentVideo: null,
  videosCache: [],
  pendingCount: 0,
};

if (!state.token) location.href = 'login.html';
if (state.token && state.role === 'admin' && location.pathname.endsWith('user-dashboard.html')) {
  location.href = 'admin-dashboard.html';
}
if (state.token && state.role !== 'admin' && location.pathname.endsWith('admin-dashboard.html')) {
  location.href = 'user-dashboard.html';
}

const $ = (id) => document.getElementById(id);
const q = (s) => document.querySelector(s);
const qa = (s) => Array.from(document.querySelectorAll(s));

const ROLE_LABELS = { admin: 'Administrateur', user: 'Utilisateur', guest: 'Invité' };
const STATUS_LABELS = { pending: 'En attente', approved: 'Approuvé', denied: 'Refusé', expired: 'Expiré' };

function esc(v) {
  const d = document.createElement('div');
  d.textContent = v == null ? '' : String(v);
  return d.innerHTML;
}

function clearSession() {
  ['zt_token', 'zt_username', 'zt_role'].forEach((k) => localStorage.removeItem(k));
  state.token = null;
}

async function api(pathname, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  if (opts.body && !(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(pathname, { ...opts, headers });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.blob();
  if (res.status === 401) {
    clearSession();
    location.href = 'login.html';
    throw new Error('Session expirée');
  }
  if (!res.ok) {
    const msg = data && data.error ? data.error : `Erreur HTTP ${res.status}`;
    const detail = data && data.detail ? ` — ${data.detail}` : '';
    throw new Error(msg + detail);
  }
  return data;
}

/* ----- Toasts ----- */
function toast(message, type = 'success', title) {
  const container = $('toastContainer');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = { success: '✓', error: '✗', info: 'ℹ' };
  el.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <div class="toast-body">
      ${title ? `<strong>${esc(title)}</strong>` : ''}
      ${esc(message)}
    </div>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    el.style.transition = 'opacity 0.25s, transform 0.25s';
    setTimeout(() => el.remove(), 280);
  }, 4200);
}

/* ----- Confirm modal ----- */
let confirmResolve = null;

function confirmAction(title, message, okLabel = 'Confirmer', okClass = 'primary') {
  return new Promise((resolve) => {
    confirmResolve = resolve;
    $('confirmTitle').textContent = title;
    $('confirmMessage').textContent = message;
    const okBtn = $('confirmOk');
    okBtn.textContent = okLabel;
    okBtn.className = `btn-action ${okClass}`;
    $('confirmOverlay').classList.add('active');
  });
}

function closeConfirm(result) {
  $('confirmOverlay').classList.remove('active');
  if (confirmResolve) {
    confirmResolve(result);
    confirmResolve = null;
  }
}

$('confirmCancel').addEventListener('click', () => closeConfirm(false));
$('confirmOk').addEventListener('click', () => closeConfirm(true));
$('confirmOverlay').addEventListener('click', (e) => {
  if (e.target === $('confirmOverlay')) closeConfirm(false);
});

function setBtnLoading(btn, loading, label) {
  if (!btn) return;
  if (loading) {
    btn.dataset.origLabel = btn.textContent;
    btn.disabled = true;
    btn.textContent = label || 'Chargement…';
  } else {
    btn.disabled = false;
    btn.textContent = btn.dataset.origLabel || btn.textContent;
  }
}

function statusBadge(status) {
  const cls = status === 'approved' ? 'approved' : status === 'pending' ? 'pending' : 'denied';
  return `<span class="status-badge ${cls}">${esc(STATUS_LABELS[status] || status)}</span>`;
}

const fmt = (iso) => (iso ? new Date(iso).toLocaleString('fr-FR') : '—');

/* ----- Role & health ----- */
function initRole() {
  $('usernameLabel').textContent = state.username || '';
  $('roleBadge').textContent = ROLE_LABELS[state.role] || state.role;
  $('roleBadge').className = `role-badge role-${state.role}`;

  const statRole = $('statRole');
  if (statRole) statRole.textContent = ROLE_LABELS[state.role] || state.role;

  const admin = state.role === 'admin';
  qa('[data-admin], .admin-only').forEach((el) => {
    el.hidden = !admin;
  });

  if ($('dashTitle')) {
    $('dashTitle').textContent = admin ? 'Dashboard administrateur' : 'Dashboard utilisateur';
  }
  if ($('dashEyebrow')) {
    $('dashEyebrow').textContent = admin ? 'Console d\'administration' : 'Espace lecture sécurisé';
  }
  if ($('welcomeText')) {
    $('welcomeText').textContent = admin
      ? 'Console complète : upload, gestion des vidéos, modération des téléchargements, utilisateurs et audit.'
      : 'Consultez la bibliothèque, lisez les vidéos en streaming sécurisé, commentez et demandez un téléchargement motivé.';
  }
}

async function checkHealth() {
  try {
    const r = await fetch('/healthz');
    if (!r.ok) throw 0;
    $('apiStatus').className = 'status-pill ok';
    $('apiStatus').innerHTML = '<span class="dot"></span> serveur en ligne';
  } catch {
    $('apiStatus').className = 'status-pill bad';
    $('apiStatus').innerHTML = '<span class="dot"></span> serveur injoignable';
  }
}

/* ----- Navigation ----- */
qa('.side-menu button').forEach((btn) => {
  btn.addEventListener('click', () => showView(btn.dataset.view));
});

qa('[data-goto]').forEach((btn) => {
  btn.addEventListener('click', () => showView(btn.dataset.goto));
});

function showView(view) {
  qa('.side-menu button').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  qa('.dash-view').forEach((v) => { v.hidden = true; });
  const target = $(`view-${view}`);
  if (target) target.hidden = false;

  if (view === 'videos') loadAdminVideos();
  if (view === 'users') loadUsers();
  if (view === 'audit') loadAudit();
  if (view === 'requests') loadDownloadRequests();
  if (view === 'comments') loadComments(state.currentVideo ? state.currentVideo.videoId : null);
}

$('logoutBtn').addEventListener('click', async () => {
  try {
    await api('/auth/logout', { method: 'POST' });
  } catch { /* ignore */ }
  clearSession();
  location.href = 'login.html';
});

/* ----- Videos library ----- */
async function loadVideos() {
  try {
    const data = await api('/videos');
    state.videosCache = data.videos || [];
    renderVideoList();
    $('statVideos').textContent = state.videosCache.length;
    $('statSegments').textContent = state.videosCache.reduce((n, v) => n + (v.segmentCount || 0), 0);
  } catch (err) {
    $('videoList').innerHTML = `<li class="empty">${esc(err.message)}</li>`;
    toast(err.message, 'error', 'Bibliothèque');
  }
}

function renderVideoList() {
  const list = $('videoList');
  if (!state.videosCache.length) {
    list.innerHTML = '<li class="empty">Aucune vidéo disponible pour le moment.</li>';
    return;
  }
  list.innerHTML = '';
  state.videosCache.forEach((v) => {
    const li = document.createElement('li');
    li.className = 'video-item';
    li.innerHTML = `
      <div>
        <div class="vt">${esc(v.title)}</div>
        <div class="vd">${esc(v.ownerUsername || '?')} · ${new Date(v.createdAt).toLocaleString('fr-FR')} · ${v.segmentCount || 0} segments</div>
      </div>
      <span class="play-badge">▶ Lire</span>`;
    li.onclick = () => playVideo(v);
    list.appendChild(li);
  });
}

$('refreshBtn').addEventListener('click', () => {
  loadVideos();
  toast('Bibliothèque actualisée', 'success');
});

/* ----- HLS Player ----- */
const videoEl = $('video');
let hls = null;
let segmentCount = 0;

/* ----- Sous-titres automatiques (transcription façon YouTube) ----- */
let subtitleTrackEl = null;
let subtitlePollTimer = null;

const ccBtn = $('ccBtn');
if (ccBtn) {
  ccBtn.addEventListener('click', () => {
    if (!videoEl.textTracks || !videoEl.textTracks.length) return;
    const track = videoEl.textTracks[0];
    const enabled = track.mode === 'showing';
    track.mode = enabled ? 'hidden' : 'showing';
    ccBtn.classList.toggle('active', !enabled);
  });
}
function ensureCcButton() { return ccBtn; }

function clearSubtitles() {
  if (subtitlePollTimer) { clearTimeout(subtitlePollTimer); subtitlePollTimer = null; }
  if (subtitleTrackEl) { subtitleTrackEl.remove(); subtitleTrackEl = null; }
  const btn = $('ccBtn');
  if (btn) { btn.hidden = true; btn.classList.remove('active'); }
}

function attachSubtitleTrack(url) {
  if (subtitleTrackEl) subtitleTrackEl.remove();
  subtitleTrackEl = document.createElement('track');
  subtitleTrackEl.kind = 'subtitles';
  subtitleTrackEl.label = 'Français (auto)';
  subtitleTrackEl.srclang = 'fr';
  subtitleTrackEl.src = url;
  subtitleTrackEl.default = false;
  videoEl.appendChild(subtitleTrackEl);
  const btn = ensureCcButton();
  btn.hidden = false;
  btn.disabled = false;
  btn.title = 'Activer/désactiver les sous-titres';
}

/* Le statut passe par "processing" tant que la transcription tourne en
 * arrière-plan côté serveur (voir §upload). On ré-interroge doucement
 * jusqu'à ce que les sous-titres soient prêts (ou indisponibles), comme
 * les sous-titres auto générés par YouTube qui apparaissent quelques
 * instants après le début de la lecture. */
async function pollTranscriptionStatus(videoId) {
  try {
    const data = await api(`/videos/${videoId}/transcription-status`);
    if (!state.currentVideo || state.currentVideo.videoId !== videoId) return;
    if (data.transcriptionStatus === 'ready' && data.subtitlesUrl) {
      attachSubtitleTrack(data.subtitlesUrl);
      return;
    }
    if (data.transcriptionStatus === 'processing') {
      const btn = ensureCcButton();
      btn.hidden = false;
      btn.disabled = true;
      btn.title = 'Sous-titres en cours de génération…';
      subtitlePollTimer = setTimeout(() => pollTranscriptionStatus(videoId), 4000);
    }
  } catch { /* non bloquant pour la lecture */ }
}

function setupSubtitles(v) {
  clearSubtitles();
  if (!v.transcriptionStatus || v.transcriptionStatus === 'unavailable') return;
  if (v.transcriptionStatus === 'ready' && v.subtitlesUrl) {
    attachSubtitleTrack(v.subtitlesUrl);
  } else if (v.transcriptionStatus === 'processing') {
    pollTranscriptionStatus(v.videoId);
  }
}

function buildSegmentTimeline(n) {
  const box = $('segmentTimeline');
  box.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const s = document.createElement('div');
    s.className = 'segment';
    s.title = `Segment ${i + 1}`;
    box.appendChild(s);
  }
  $('segmentMonitor').hidden = false;
}

function markSegmentFromTime() {
  if (!state.currentVideo || !segmentCount) return;
  const dur = videoEl.duration || 0;
  const idx = dur ? Math.min(segmentCount - 1, Math.floor((videoEl.currentTime / dur) * segmentCount)) : 0;
  qa('#segmentTimeline .segment').forEach((s, i) => s.classList.toggle('locked', i <= idx));
}

videoEl.addEventListener('play', () => {
  if (state.currentVideo) buildSegmentTimeline(state.currentVideo.segmentCount || 0);
  markSegmentFromTime();
});
videoEl.addEventListener('timeupdate', markSegmentFromTime);

async function playVideo(v) {
  state.currentVideo = v;
  segmentCount = v.segmentCount || 0;
  $('playerTitle').textContent = v.title;
  $('commentsTitle').textContent = `Commentaires — ${v.title}`;
  setupSubtitles(v);

  let keyTokenData;
  try {
    keyTokenData = await api(`/videos/${v.videoId}/key-token`, { method: 'POST' });
  } catch (err) {
    $('playerTitle').textContent = 'Erreur de lecture';
    toast(err.message, 'error', 'Lecteur');
    return;
  }

  if (hls) {
    hls.destroy();
    hls = null;
  }

  if (window.Hls && Hls.isSupported()) {
    hls = new Hls({
      xhrSetup: (xhr, url) => {
        if (url.includes('/keys/')) {
          xhr.setRequestHeader('Authorization', `Bearer ${keyTokenData.access_token}`);
        }
      },
    });
    hls.loadSource(v.playlistUrl);
    hls.attachMedia(videoEl);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      buildSegmentTimeline(segmentCount);
      videoEl.play().catch(() => {});
    });
    hls.on(Hls.Events.FRAG_CHANGED, (_, data) => {
      qa('#segmentTimeline .segment').forEach((s, i) => s.classList.toggle('locked', i <= data.frag.sn));
    });
  } else {
    videoEl.src = v.playlistUrl;
    videoEl.play().catch(() => {});
  }

  ['downloadBtn', 'exportJsonBtn', 'exportCsvBtn'].forEach((id) => {
    const el = $(id);
    if (el) el.hidden = false;
  });
  loadComments(v.videoId);
  showView('library');
  toast(`Lecture de « ${v.title} »`, 'info', 'Lecteur');
}

function resetPlayer() {
  if (hls) {
    hls.destroy();
    hls = null;
  }
  clearSubtitles();
  videoEl.removeAttribute('src');
  videoEl.load();
  state.currentVideo = null;
  segmentCount = 0;
  $('playerTitle').textContent = 'Sélectionnez une vidéo';
  $('commentsTitle').textContent = 'Sélectionnez une vidéo dans la bibliothèque';
  $('segmentMonitor').hidden = true;
  $('commentList').innerHTML = '<li class="empty">Sélectionnez une vidéo pour voir ses commentaires.</li>';
  ['downloadBtn', 'exportJsonBtn', 'exportCsvBtn'].forEach((id) => {
    const el = $(id);
    if (el) el.hidden = true;
  });
}

/* ----- Comments CRUD ----- */
function initials(name) {
  return (name || '?').trim().slice(0, 2).toUpperCase();
}

function relativeTime(iso) {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diffMs / 1000);
  if (s < 5) return 'à l\'instant';
  if (s < 60) return `il y a ${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `il y a ${d} j`;
  return new Date(iso).toLocaleDateString('fr-FR');
}

function setCommentFormEnabled(enabled) {
  const input = $('commentInput');
  const form = $('commentForm');
  if (!input || !form) return;
  input.disabled = !enabled;
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = !enabled;
  input.placeholder = enabled
    ? 'Ajouter un commentaire…'
    : 'Sélectionnez une vidéo dans la bibliothèque pour commenter';
}

async function loadComments(videoId) {
  setCommentFormEnabled(!!videoId);
  const list = $('commentList');
  if (!videoId) {
    list.innerHTML = `
      <li class="empty comment-empty-state">
        <div>Aucune vidéo sélectionnée.</div>
        <button type="button" class="btn-action ghost small" data-goto="library">Parcourir la bibliothèque</button>
      </li>`;
    const gotoBtn = list.querySelector('[data-goto]');
    if (gotoBtn) gotoBtn.onclick = () => showView('library');
    return;
  }
  try {
    const data = await api(`/videos/${videoId}/comments`);
    list.innerHTML = '';
    if (!data.comments.length) {
      list.innerHTML = '<li class="empty">Aucun commentaire pour cette vidéo — soyez le premier à réagir.</li>';
      return;
    }
    data.comments.slice().reverse().forEach((c) => renderCommentItem(list, c, videoId));
  } catch (err) {
    list.innerHTML = `<li class="empty">${esc(err.message)}</li>`;
  }
}

function renderCommentItem(list, c, videoId) {
  const li = document.createElement('li');
  li.className = 'comment-item';
  const isOwner = c.username === state.username;
  const canEdit = isOwner;
  const canDelete = isOwner || state.role === 'admin';
  const edited = c.updatedAt && c.updatedAt !== c.createdAt;

  li.innerHTML = `
    <div class="comment-avatar" aria-hidden="true">${esc(initials(c.username))}</div>
    <div class="comment-body">
      <div class="comment-head">
        <strong>${esc(c.username)}</strong>
        ${c.username === state.username ? '<span class="comment-you-badge">vous</span>' : ''}
        <span class="vd" title="${esc(new Date(c.createdAt).toLocaleString('fr-FR'))}">${relativeTime(c.createdAt)}${edited ? ' · modifié' : ''}</span>
        <div class="comment-actions">
          ${canEdit ? '<button type="button" class="btn-ghost tiny edit-comment">Modifier</button>' : ''}
          ${canDelete ? '<button type="button" class="btn-ghost tiny danger del-comment">Supprimer</button>' : ''}
        </div>
      </div>
      <div class="comment-text">${esc(c.text)}</div>
    </div>`;

  if (canEdit) {
    li.querySelector('.edit-comment').onclick = () => startEditComment(li, c, videoId);
  }
  if (canDelete) {
    li.querySelector('.del-comment').onclick = async () => {
      const ok = await confirmAction('Supprimer le commentaire', 'Cette action est irréversible.', 'Supprimer', 'danger');
      if (!ok) return;
      try {
        await api(`/videos/${videoId}/comments/${c.commentId}`, { method: 'DELETE' });
        toast('Commentaire supprimé', 'success', 'Commentaire');
        loadComments(videoId);
      } catch (err) {
        toast(err.message, 'error', 'Commentaire');
      }
    };
  }
  list.appendChild(li);
}

function startEditComment(li, c, videoId) {
  const body = li.querySelector('.comment-body');
  const originalHtml = body.innerHTML;
  body.innerHTML = `
    <textarea class="text-input comment-edit-input" maxlength="500" rows="3">${esc(c.text)}</textarea>
    <div class="comment-edit-actions">
      <span class="comment-char-count"></span>
      <div>
        <button type="button" class="btn-action ghost small cancel-edit">Annuler</button>
        <button type="button" class="btn-action primary small save-edit">Enregistrer</button>
      </div>
    </div>`;
  const textarea = body.querySelector('textarea');
  const counter = body.querySelector('.comment-char-count');
  const updateCounter = () => { counter.textContent = `${textarea.value.length}/500`; };
  updateCounter();
  textarea.addEventListener('input', updateCounter);
  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);

  body.querySelector('.cancel-edit').onclick = () => { body.innerHTML = originalHtml; rewireComment(li, c, videoId); };
  body.querySelector('.save-edit').onclick = async (e) => {
    const text = textarea.value.trim();
    if (!text) { toast('Le commentaire ne peut pas être vide', 'error', 'Commentaire'); return; }
    setBtnLoading(e.currentTarget, true, '…');
    try {
      await api(`/videos/${videoId}/comments/${c.commentId}`, { method: 'PATCH', body: JSON.stringify({ text }) });
      toast('Commentaire mis à jour', 'success', 'Commentaire');
      loadComments(videoId);
    } catch (err) {
      toast(err.message, 'error', 'Commentaire');
      setBtnLoading(e.currentTarget, false);
    }
  };
}

// Ré-attache les handlers d'origine si l'utilisateur annule une édition
// sans devoir recharger toute la liste depuis le serveur.
function rewireComment(li, c, videoId) {
  const editBtn = li.querySelector('.edit-comment');
  const delBtn = li.querySelector('.del-comment');
  if (editBtn) editBtn.onclick = () => startEditComment(li, c, videoId);
  if (delBtn) {
    delBtn.onclick = async () => {
      const ok = await confirmAction('Supprimer le commentaire', 'Cette action est irréversible.', 'Supprimer', 'danger');
      if (!ok) return;
      try {
        await api(`/videos/${videoId}/comments/${c.commentId}`, { method: 'DELETE' });
        toast('Commentaire supprimé', 'success', 'Commentaire');
        loadComments(videoId);
      } catch (err) {
        toast(err.message, 'error', 'Commentaire');
      }
    };
  }
}

const commentInputEl = $('commentInput');
const commentCounterEl = document.createElement('div');
if (commentInputEl) {
  commentCounterEl.className = 'comment-char-count form-hint';
  commentCounterEl.textContent = '0/500';
  commentInputEl.insertAdjacentElement('afterend', commentCounterEl);
  commentInputEl.addEventListener('input', () => {
    commentCounterEl.textContent = `${commentInputEl.value.length}/500`;
  });
  setCommentFormEnabled(false);
}

$('commentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!state.currentVideo) {
    toast('Sélectionnez d\'abord une vidéo dans la bibliothèque', 'error', 'Commentaire');
    return;
  }
  const text = $('commentInput').value.trim();
  if (!text) return;
  const btn = e.submitter;
  setBtnLoading(btn, true, 'Publication…');
  try {
    await api(`/videos/${state.currentVideo.videoId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    $('commentInput').value = '';
    commentCounterEl.textContent = '0/500';
    toast('Commentaire publié', 'success', 'Commentaire');
    loadComments(state.currentVideo.videoId);
  } catch (err) {
    toast(err.message, 'error', 'Commentaire');
  } finally {
    setBtnLoading(btn, false);
  }
});

/* ----- Export ----- */
function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function exportVideo(format, btn) {
  if (!state.currentVideo) return;
  setBtnLoading(btn, true, 'Export…');
  try {
    // NB : on ne passe pas par api() ici. api() décode automatiquement les
    // réponses "application/json" en objet JS (utile pour le reste de
    // l'app), mais l'export JSON a justement ce content-type : il serait
    // alors converti en objet au lieu de rester un Blob téléchargeable,
    // et URL.createObjectURL() échouerait silencieusement (c'était le bug
    // du bouton "Export JSON"). On fait donc un fetch direct et on
    // reconstruit nous-mêmes le Blob à télécharger, comme pour le CSV.
    const res = await fetch(`/videos/${state.currentVideo.videoId}/export?format=${format}`, {
      headers: { Authorization: `Bearer ${state.token}` },
    });
    if (!res.ok) {
      const ct = res.headers.get('content-type') || '';
      const errBody = ct.includes('application/json') ? await res.json() : { error: `Erreur HTTP ${res.status}` };
      throw new Error(errBody.error || `Erreur HTTP ${res.status}`);
    }
    const blob = await res.blob();
    downloadBlob(blob, `${state.currentVideo.videoId}.${format}`);
    toast(`Export ${format.toUpperCase()} téléchargé`, 'success', 'Export');
  } catch (err) {
    toast(err.message, 'error', 'Export');
  } finally {
    setBtnLoading(btn, false);
  }
}

$('exportJsonBtn').onclick = (e) => exportVideo('json', e.currentTarget);
$('exportCsvBtn').onclick = (e) => exportVideo('csv', e.currentTarget);

/* ----- Upload (admin) ----- */
const dropzone = $('dropzone');
const fileInput = $('fileInput');
const uploadBtn = $('uploadBtn');
let selectedFile = null;
let segmentTimer = null;

if (dropzone) {
  ['dragenter', 'dragover'].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });
  ['dragleave', 'drop'].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });
  dropzone.addEventListener('drop', (e) => {
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  });
}

if (fileInput) {
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) setFile(fileInput.files[0]);
  });
}

function setFile(file) {
  selectedFile = file;
  $('dropzoneText').textContent = `${file.name} — ${(file.size / 1048576).toFixed(1)} Mo`;
  if (uploadBtn) uploadBtn.disabled = false;
}

function buildSegmentChain(n) {
  const chain = $('segmentChain');
  if (!chain) return;
  chain.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const s = document.createElement('div');
    s.className = 'segment';
    chain.appendChild(s);
  }
}

function startEncryptionAnimation() {
  const seg = qa('#segmentChain .segment');
  let i = 0;
  segmentTimer = setInterval(() => {
    if (i >= seg.length) i = 0;
    seg[i++].classList.add('locked');
  }, 180);
}

function stopEncryptionAnimation() {
  clearInterval(segmentTimer);
}

const uploadForm = $('uploadForm');
if (uploadForm) {
  uploadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    uploadBtn.disabled = true;
    $('pipeline').hidden = false;
    $('uploadLog').hidden = true;
    buildSegmentChain(28);

    const fd = new FormData();
    fd.append('video', selectedFile);
    if ($('titleInput').value.trim()) fd.append('title', $('titleInput').value.trim());

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/upload');
    xhr.setRequestHeader('Authorization', `Bearer ${state.token}`);
    xhr.upload.onprogress = (evt) => {
      if (!evt.lengthComputable) return;
      const pct = Math.round((evt.loaded / evt.total) * 100);
      $('uploadBarFill').style.width = pct + '%';
      $('pipelinePct').textContent = pct + '%';
      if (pct >= 100) {
        $('pipelineLabel').textContent = 'Segmentation & chiffrement…';
        startEncryptionAnimation();
      }
    };
    xhr.onload = () => {
      stopEncryptionAnimation();
      uploadBtn.disabled = false;
      $('uploadLog').hidden = false;
      let data = {};
      try {
        data = JSON.parse(xhr.responseText || '{}');
      } catch { /* ignore */ }
      if (xhr.status < 300) {
        qa('#segmentChain .segment').forEach((s) => s.classList.add('locked'));
        $('uploadLog').className = 'log success';
        $('uploadLog').textContent = `✓ ${data.message} — ${data.videoId}`;
        toast('Vidéo uploadée et chiffrée avec succès', 'success', 'Upload');
        selectedFile = null;
        fileInput.value = '';
        $('titleInput').value = '';
        $('dropzoneText').textContent = 'Glissez un fichier ici, ou cliquez pour parcourir';
        loadVideos();
        loadAdminVideos();
      } else {
        $('uploadLog').className = 'log error';
        $('uploadLog').textContent = '✗ ' + (data.error || 'Erreur serveur');
        toast(data.error || 'Erreur serveur', 'error', 'Upload');
      }
    };
    xhr.onerror = () => {
      stopEncryptionAnimation();
      uploadBtn.disabled = false;
      $('uploadLog').hidden = false;
      $('uploadLog').className = 'log error';
      $('uploadLog').textContent = '✗ Échec réseau';
      toast('Échec réseau lors de l\'upload', 'error', 'Upload');
    };
    xhr.send(fd);
  });
}

/* ----- Admin videos CRUD ----- */
async function loadAdminVideos() {
  const tbody = q('#adminVideoTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" class="table-empty">Chargement…</td></tr>';
  try {
    const data = await api('/videos');
    tbody.innerHTML = '';
    if (!data.videos.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="table-empty"><div class="table-empty-icon">🎬</div>Aucune vidéo dans le catalogue</td></tr>';
      return;
    }
    data.videos.forEach((v) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input class="text-input small" value="${esc(v.title)}"></td>
        <td>${esc(v.ownerUsername || '?')}</td>
        <td>${new Date(v.createdAt).toLocaleDateString('fr-FR')}</td>
        <td>${v.segmentCount || 0}</td>
        <td>
          <div class="row-actions">
            <button type="button" class="btn-action success small save-video">Enregistrer</button>
            <button type="button" class="btn-action danger small del-video">Supprimer</button>
          </div>
        </td>`;

      tr.querySelector('.save-video').onclick = async (e) => {
        const btn = e.currentTarget;
        const title = tr.querySelector('input').value.trim();
        if (!title) {
          toast('Le titre ne peut pas être vide', 'error', 'Vidéo');
          return;
        }
        setBtnLoading(btn, true, '…');
        try {
          await api(`/videos/${v.videoId}`, { method: 'PATCH', body: JSON.stringify({ title }) });
          toast('Titre mis à jour', 'success', 'Vidéo');
          v.title = title;
          if (state.currentVideo && state.currentVideo.videoId === v.videoId) {
            state.currentVideo.title = title;
            $('playerTitle').textContent = title;
            $('commentsTitle').textContent = `Commentaires — ${title}`;
          }
          loadVideos();
          loadAdminVideos();
        } catch (err) {
          toast(err.message, 'error', 'Vidéo');
        } finally {
          setBtnLoading(btn, false);
        }
      };

      tr.querySelector('.del-video').onclick = async () => {
        const ok = await confirmAction(
          'Supprimer la vidéo',
          `Supprimer définitivement « ${v.title} » et tous ses segments chiffrés ?`,
          'Supprimer',
          'danger'
        );
        if (!ok) return;
        try {
          await api(`/videos/${v.videoId}`, { method: 'DELETE' });
          toast('Vidéo supprimée', 'success', 'Vidéo');
          if (state.currentVideo && state.currentVideo.videoId === v.videoId) {
            resetPlayer();
          }
          loadAdminVideos();
          loadVideos();
        } catch (err) {
          toast(err.message, 'error', 'Vidéo');
        }
      };

      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty">${esc(err.message)}</td></tr>`;
  }
}

const refreshVideosBtn = $('refreshVideosBtn');
if (refreshVideosBtn) refreshVideosBtn.onclick = () => { loadAdminVideos(); toast('Catalogue actualisé', 'success'); };

/* ----- Admin users CRUD ----- */
async function loadUsers() {
  const tbody = q('#usersTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="4" class="table-empty">Chargement…</td></tr>';
  try {
    const data = await api('/admin/users');
    tbody.innerHTML = '';
    if (!data.users.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="table-empty"><div class="table-empty-icon">👤</div>Aucun utilisateur</td></tr>';
      return;
    }
    data.users.forEach((u) => {
      const tr = document.createElement('tr');
      const canDelete = u.username !== state.username;
      tr.innerHTML = `
        <td><strong>${esc(u.username)}</strong></td>
        <td><span class="role-badge role-${u.role}">${ROLE_LABELS[u.role] || u.role}</span></td>
        <td>${new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
        <td>
          ${canDelete
            ? '<div class="row-actions"><button type="button" class="btn-action danger small del-user">Supprimer</button></div>'
            : '<span class="vd">Compte actuel</span>'}
        </td>`;
      const btn = tr.querySelector('.del-user');
      if (btn) {
        btn.onclick = async () => {
          const ok = await confirmAction(
            'Supprimer l\'utilisateur',
            `Supprimer le compte « ${u.username} » ? Cette action est irréversible.`,
            'Supprimer',
            'danger'
          );
          if (!ok) return;
          setBtnLoading(btn, true, '…');
          try {
            await api(`/admin/users/${u.username}`, { method: 'DELETE' });
            toast(`Utilisateur ${u.username} supprimé`, 'success', 'Utilisateurs');
            loadUsers();
          } catch (err) {
            toast(err.message, 'error', 'Utilisateurs');
          } finally {
            setBtnLoading(btn, false);
          }
        };
      }
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="table-empty">${esc(err.message)}</td></tr>`;
  }
}

const refreshUsersBtn = $('refreshUsersBtn');
if (refreshUsersBtn) refreshUsersBtn.onclick = () => { loadUsers(); toast('Utilisateurs actualisés', 'success'); };

/* ----- Audit ----- */
async function loadAudit() {
  const tbody = q('#auditTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Chargement…</td></tr>';
  try {
    const data = await api('/admin/audit?limit=150');
    tbody.innerHTML = '';
    if (!data.entries.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty"><div class="table-empty-icon">📋</div>Aucun événement enregistré</td></tr>';
      return;
    }
    data.entries.forEach((e) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="mono">${new Date(e.ts).toLocaleString('fr-FR')}</td>
        <td>${esc(e.type)}</td>
        <td>${esc(e.username)}</td>
        <td class="mono">${esc(e.videoId || '—')}</td>
        <td class="mono">${esc(e.ip || '—')}</td>
        <td><span class="result-badge result-${esc(e.result)}">${esc(e.result)}</span></td>`;
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty">${esc(err.message)}</td></tr>`;
  }
}

const refreshAuditBtn = $('refreshAuditBtn');
if (refreshAuditBtn) refreshAuditBtn.onclick = () => { loadAudit(); toast('Journal actualisé', 'success'); };

/* ----- Download modal (user) ----- */
function openModal() {
  $('downloadModalOverlay').hidden = false;
  $('downloadModalOverlay').classList.add('active');
}

function closeModal() {
  $('downloadModalOverlay').hidden = true;
  $('downloadModalOverlay').classList.remove('active');
}

$('downloadModalClose').onclick = closeModal;
$('downloadModalOverlay').onclick = (e) => {
  if (e.target === $('downloadModalOverlay')) closeModal();
};

async function refreshDownloadModal() {
  if (!state.currentVideo) return;
  $('downloadModalBody').innerHTML = '<h3>Vérification de vos droits…</h3><p class="muted">Interrogation du serveur…</p>';
  openModal();
  try {
    const d = await api(`/videos/${state.currentVideo.videoId}/download-status`);
    renderDownloadModal(d.request, state.currentVideo.videoId);
  } catch (err) {
    $('downloadModalBody').innerHTML = `<h3>Erreur</h3><p>${esc(err.message)}</p>`;
  }
}

function renderDownloadModal(request, videoId) {
  if (!request || request.status === 'denied' || request.status === 'expired') {
    $('downloadModalBody').innerHTML = `
      <h3>Demande de téléchargement</h3>
      <p>Indiquez la raison de votre demande. Ce commentaire sera visible par l'administrateur.</p>
      <textarea id="downloadReason" class="text-input" rows="4" placeholder="Exemple : besoin d'analyse hors-ligne pour le comité projet" required>${request?.reason ? esc(request.reason) : ''}</textarea>
      <button type="button" class="btn-primary" id="requestAccessBtn">Envoyer la demande</button>`;
    $('requestAccessBtn').onclick = async () => {
      const reason = $('downloadReason').value.trim();
      if (reason.length < 10) {
        toast('Veuillez préciser une raison d\'au moins 10 caractères', 'error', 'Téléchargement');
        return;
      }
      const btn = $('requestAccessBtn');
      setBtnLoading(btn, true, 'Envoi…');
      try {
        const req = await api(`/videos/${videoId}/download-request`, {
          method: 'POST',
          body: JSON.stringify({ reason }),
        });
        toast('Demande envoyée — en attente de validation admin', 'success', 'Téléchargement');
        renderDownloadModal(req, videoId);
      } catch (err) {
        toast(err.message, 'error', 'Téléchargement');
      } finally {
        setBtnLoading(btn, false);
      }
    };
    return;
  }

  if (request.status === 'pending') {
    $('downloadModalBody').innerHTML = `
      <h3>Demande en attente</h3>
      <p>Votre demande est en cours d'examen par un administrateur.</p>
      <p class="modal-note"><b>Raison :</b> ${esc(request.reason || '—')}</p>
      <p class="modal-note">Demandée le ${fmt(request.requestedAt)}</p>
      <button type="button" class="btn-outline full" id="checkAgainBtn">Vérifier le statut</button>`;
    $('checkAgainBtn').onclick = refreshDownloadModal;
    return;
  }

  if (request.status === 'approved') {
    $('downloadModalBody').innerHTML = `
      <h3>Autorisation accordée</h3>
      <p>Clé valide jusqu'au <b>${fmt(request.downloadKeyExpiresAt)}</b>.</p>
      <button type="button" class="btn-primary" id="doDownloadBtn">Télécharger le fichier chiffré</button>
      <a class="btn-outline as-link full" href="offline-player.html?video=${videoId}" target="_blank" rel="noopener">Ouvrir le lecteur hors-ligne</a>`;
    $('doDownloadBtn').onclick = () => downloadEncryptedFile(videoId);
  }
}

async function downloadEncryptedFile(videoId) {
  const btn = $('doDownloadBtn');
  setBtnLoading(btn, true, 'Téléchargement…');
  try {
    const res = await fetch(`/videos/${videoId}/download`, {
      headers: { Authorization: `Bearer ${state.token}` },
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error || 'Échec téléchargement');
    }
    downloadBlob(await res.blob(), `${videoId}.enc`);
    toast('Fichier chiffré téléchargé', 'success', 'Téléchargement');
  } catch (err) {
    toast(err.message, 'error', 'Téléchargement');
  } finally {
    setBtnLoading(btn, false);
  }
}

$('downloadBtn').onclick = refreshDownloadModal;

/* ----- Download requests (admin approve/reject) ----- */
function updatePendingUI(count) {
  state.pendingCount = count;
  const badge = $('pendingBadge');
  const statPending = $('statPending');
  const statHint = $('statPendingHint');

  if (badge) {
    if (count > 0) {
      badge.hidden = false;
      badge.textContent = count;
    } else {
      badge.hidden = true;
    }
  }
  if (statPending) statPending.textContent = count;
  if (statHint) {
    statHint.textContent = count > 0
      ? `${count} demande${count > 1 ? 's' : ''} à traiter`
      : 'Aucune action requise';
    statHint.style.color = count > 0 ? 'var(--amber)' : '';
  }
}

async function approveRequest(r, btn) {
  const ok = await confirmAction(
    'Approuver la demande',
    `Autoriser le téléchargement de « ${r.videoTitle} » pour ${r.username} ?\n\nRaison : ${r.reason || '—'}\n\nUn fichier chiffré sera généré automatiquement.`,
    'Approuver',
    'success'
  );
  if (!ok) return;

  setBtnLoading(btn, true, 'Traitement…');
  try {
    await api(`/admin/download-requests/${r.videoId}/${r.requestId}/approve`, { method: 'POST' });
    toast(`Demande approuvée pour ${r.username}`, 'success', 'Téléchargement');
    loadDownloadRequests();
    loadAudit();
  } catch (err) {
    toast(err.message, 'error', 'Approbation');
    setBtnLoading(btn, false);
  }
}

async function denyRequest(r, btn) {
  const ok = await confirmAction(
    'Refuser la demande',
    `Refuser le téléchargement de « ${r.videoTitle} » demandé par ${r.username} ?\n\nRaison indiquée : ${r.reason || '—'}`,
    'Refuser',
    'danger'
  );
  if (!ok) return;

  setBtnLoading(btn, true, 'Traitement…');
  try {
    await api(`/admin/download-requests/${r.videoId}/${r.requestId}/deny`, { method: 'POST' });
    toast(`Demande refusée pour ${r.username}`, 'success', 'Téléchargement');
    loadDownloadRequests();
    loadAudit();
  } catch (err) {
    toast(err.message, 'error', 'Refus');
    setBtnLoading(btn, false);
  }
}

async function loadDownloadRequests() {
  const tbody = q('#downloadReqTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Chargement…</td></tr>';
  try {
    const data = await api('/admin/download-requests');
    tbody.innerHTML = '';

    const pending = (data.requests || []).filter((r) => r.status === 'pending').length;
    updatePendingUI(pending);

    if (!data.requests.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty"><div class="table-empty-icon">📥</div>Aucune demande de téléchargement</td></tr>';
      return;
    }

    data.requests.forEach((r) => {
      const tr = document.createElement('tr');
      const isPending = r.status === 'pending';
      tr.innerHTML = `
        <td><strong>${esc(r.videoTitle)}</strong></td>
        <td>${esc(r.username)}</td>
        <td style="max-width:220px; word-break:break-word; overflow-wrap:anywhere;">${esc(r.reason || '—')}</td>
        <td class="mono">${fmt(r.requestedAt)}</td>
        <td>${statusBadge(r.status)}</td>
        <td>
          ${isPending
            ? `<div class="row-actions">
                <button type="button" class="btn-action success small approve-req">✓ Approuver</button>
                <button type="button" class="btn-action danger small deny-req">✕ Refuser</button>
               </div>`
            : `<span class="vd">${r.decidedBy ? `Par ${esc(r.decidedBy)}` : '—'}${r.decidedAt ? `<br>${fmt(r.decidedAt)}` : ''}</span>`}
        </td>`;

      const approveBtn = tr.querySelector('.approve-req');
      const denyBtn = tr.querySelector('.deny-req');
      if (approveBtn) approveBtn.onclick = () => approveRequest(r, approveBtn);
      if (denyBtn) denyBtn.onclick = () => denyRequest(r, denyBtn);

      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty">${esc(err.message)}</td></tr>`;
    toast(err.message, 'error', 'Demandes');
  }
}

const refreshDownloadReqBtn = $('refreshDownloadReqBtn');
if (refreshDownloadReqBtn) {
  refreshDownloadReqBtn.onclick = () => {
    loadDownloadRequests();
    toast('Demandes actualisées', 'success');
  };
}

/* ----- Init ----- */
initRole();
checkHealth();
setInterval(checkHealth, 20000);
loadVideos();
loadComments(null);

if (state.role === 'admin') {
  loadDownloadRequests();
}

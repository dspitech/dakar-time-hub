import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Hls from 'hls.js';
import './styles.css';

const session = {
  get token() { return localStorage.getItem('zt_token'); },
  get username() { return localStorage.getItem('zt_username'); },
  get role() { return localStorage.getItem('zt_role'); },
  set(data) {
    localStorage.setItem('zt_token', data.access_token);
    localStorage.setItem('zt_username', data.username);
    localStorage.setItem('zt_role', data.role);
  },
  clear() {
    localStorage.removeItem('zt_token');
    localStorage.removeItem('zt_username');
    localStorage.removeItem('zt_role');
  }
};

async function api(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (session.token) headers.Authorization = `Bearer ${session.token}`;
  if (opts.body && !(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const res = await fetch(path, { ...opts, headers });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.blob();
  if (res.status === 401) {
    session.clear();
    window.dispatchEvent(new Event('auth-change'));
  }
  if (!res.ok) throw new Error((data && (data.error || data.detail)) || `HTTP ${res.status}`);
  return data;
}

function routeTo(path) {
  history.pushState(null, '', path);
  window.dispatchEvent(new Event('popstate'));
}

function useRoute() {
  const [path, setPath] = useState(location.pathname);
  useEffect(() => {
    const on = () => setPath(location.pathname);
    addEventListener('popstate', on);
    return () => removeEventListener('popstate', on);
  }, []);
  return path;
}

function useAuth() {
  const [auth, setAuth] = useState({ token: session.token, username: session.username, role: session.role });
  useEffect(() => {
    const refresh = () => setAuth({ token: session.token, username: session.username, role: session.role });
    addEventListener('auth-change', refresh);
    addEventListener('storage', refresh);
    return () => {
      removeEventListener('auth-change', refresh);
      removeEventListener('storage', refresh);
    };
  }, []);
  return auth;
}

function Layout({ children }) {
  const auth = useAuth();
  async function logout() {
    try { await api('/auth/logout', { method: 'POST' }); } catch {}
    session.clear();
    window.dispatchEvent(new Event('auth-change'));
    routeTo('/login');
  }
  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><span className="logo">ZT</span><div><b>ZT Stream</b><small>React Vite</small></div></div>
      <nav>
        <button onClick={() => routeTo('/presentation')}>Présentation</button>
        {!auth.token && <button onClick={() => routeTo('/login')}>Connexion</button>}
        {!auth.token && <button onClick={() => routeTo('/register')}>Inscription</button>}
        {auth.token && auth.role !== 'admin' && <button onClick={() => routeTo('/dashboard')}>Dashboard utilisateur</button>}
        {auth.token && auth.role === 'admin' && <button onClick={() => routeTo('/admin')}>Dashboard admin</button>}
      </nav>
      <div className="sessionBox">
        {auth.token ? <>
          <small>Connecté</small><b>{auth.username}</b><span className="pill">{auth.role}</span><button className="danger" onClick={logout}>Déconnexion</button>
        </> : <><small>Session</small><b>Non connecté</b></>}
      </div>
    </aside>
    <main className="main">{children}</main>
  </div>;
}

function Presentation() {
  return <Layout><section className="hero">
    <div><span className="eyebrow">Plateforme sécurisée</span><h1>Streaming vidéo Zero‑Trust avec dashboards React</h1><p>Une interface React JS Vite pour la présentation globale, la connexion, l'inscription, le dashboard utilisateur et le dashboard admin.</p><div className="actions"><button onClick={() => routeTo('/login')}>Se connecter</button><button className="ghost" onClick={() => routeTo('/register')}>Créer un compte</button></div></div>
    <div className="heroCard"><h3>Fonctionnalités</h3><ul><li>Lecture HLS chiffrée AES‑128</li><li>Demande de téléchargement avec raison</li><li>Export JSON / CSV des métadonnées vidéo</li><li>Permissions admin / utilisateur</li><li>Tables Cosmos DB analytics prêtes</li></ul></div>
  </section><section className="grid3"><Card title="Utilisateur" text="Consulter, lire, commenter et demander le téléchargement d'une vidéo."/><Card title="Admin" text="Uploader, approuver/refuser les demandes, consulter les logs, gérer utilisateurs et vidéos."/><Card title="Analytics" text="ViewingLogs, VideoSegments et RetentionScores sont créées au démarrage côté serveur."/></section></Layout>;
}

function Card({ title, text }) { return <div className="card"><h3>{title}</h3><p>{text}</p></div>; }

function AuthForm({ mode }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [msg, setMsg] = useState('');
  async function submit(e) {
    e.preventDefault(); setMsg('');
    try {
      const data = await api(mode === 'login' ? '/auth/login' : '/auth/register', { method: 'POST', body: JSON.stringify(form) });
      session.set(data); window.dispatchEvent(new Event('auth-change'));
      routeTo(data.role === 'admin' ? '/admin' : '/dashboard');
    } catch (e) { setMsg(e.message); }
  }
  return <Layout><div className="authPanel"><h1>{mode === 'login' ? 'Connexion' : 'Inscription'}</h1><p>{mode === 'login' ? 'Accédez à votre espace sécurisé.' : 'Créez votre compte utilisateur.'}</p><form onSubmit={submit} className="form"><label>Nom d'utilisateur<input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required /></label><label>Mot de passe<input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></label><button>{mode === 'login' ? 'Se connecter' : 'S’inscrire'}</button>{msg && <div className="alert">{msg}</div>}</form><button className="linkBtn" onClick={() => routeTo(mode === 'login' ? '/register' : '/login')}>{mode === 'login' ? 'Créer un compte' : 'J’ai déjà un compte'}</button></div></Layout>;
}

function DashboardBase({ admin = false }) {
  const auth = useAuth();
  const [videos, setVideos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    if (!auth.token) return;
    api('/videos').then(d => { setVideos(d.videos || []); if (!selected && d.videos?.[0]) setSelected(d.videos[0]); }).catch(e => setError(e.message));
  }, [auth.token, refreshKey]);
  if (!auth.token) return <Layout><div className="card"><h2>Connexion requise</h2><button onClick={() => routeTo('/login')}>Se connecter</button></div></Layout>;
  if (admin && auth.role !== 'admin') return <Layout><div className="alert">Accès refusé : section réservée à l'administrateur.</div></Layout>;
  return <Layout><header className="top"><div><span className="eyebrow">{admin ? 'Admin' : 'Utilisateur'}</span><h1>{admin ? 'Dashboard administrateur' : 'Dashboard utilisateur'}</h1></div><button onClick={() => setRefreshKey(k => k + 1)}>Actualiser</button></header>{error && <div className="alert">{error}</div>}<section className="dashboardGrid"><div className="panel"><h2>Catalogue vidéo</h2><VideoList videos={videos} selected={selected} onSelect={setSelected} admin={admin} onRefresh={() => setRefreshKey(k => k + 1)} /></div><div className="panel wide"><VideoPlayer video={selected} admin={admin} /></div></section>{admin ? <AdminSections onRefresh={() => setRefreshKey(k => k + 1)} /> : <UserSections video={selected} />}</Layout>;
}

function VideoList({ videos, selected, onSelect, admin, onRefresh }) {
  async function remove(v) {
    if (!confirm(`Supprimer ${v.title} ?`)) return;
    await api(`/videos/${v.videoId}`, { method: 'DELETE' });
    onRefresh();
  }
  return <div className="videoList">{videos.map(v => <div key={v.videoId} className={`videoItem ${selected?.videoId === v.videoId ? 'active' : ''}`}><button onClick={() => onSelect(v)}><b>{v.title}</b><small>{v.segmentCount || 0} segments · {new Date(v.createdAt).toLocaleString()}</small></button>{admin && <button className="danger mini" onClick={() => remove(v)}>Supprimer</button>}</div>)}{videos.length === 0 && <p>Aucune vidéo disponible.</p>}</div>;
}

function VideoPlayer({ video }) {
  const ref = useRef(null);
  const hlsRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [segment, setSegment] = useState(0);
  const segments = useMemo(() => Array.from({ length: video?.segmentCount || 0 }, (_, i) => i), [video]);
  useEffect(() => () => { if (hlsRef.current) hlsRef.current.destroy(); }, []);
  useEffect(() => { setStarted(false); setSegment(0); if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } if (ref.current) ref.current.removeAttribute('src'); }, [video?.videoId]);

  async function start() {
    if (!video || !ref.current) return;
    const token = await api(`/videos/${video.videoId}/key-token`, { method: 'POST' });
    if (hlsRef.current) hlsRef.current.destroy();
    if (Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: (xhr, url) => {
          if (url.includes('/keys/')) xhr.setRequestHeader('Authorization', `Bearer ${token.keyToken}`);
        }
      });
      hlsRef.current = hls;
      hls.loadSource(video.playlistUrl);
      hls.attachMedia(ref.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => ref.current.play().catch(() => {}));
      hls.on(Hls.Events.FRAG_CHANGED, (_, data) => setSegment(data.frag?.sn ?? 0));
    } else {
      ref.current.src = video.playlistUrl;
      ref.current.play().catch(() => {});
    }
    setStarted(true);
  }
  return <div><h2>{video?.title || 'Sélectionnez une vidéo'}</h2>{video && <><video ref={ref} controls className="player" onPlay={() => setStarted(true)} onTimeUpdate={e => setSegment(Math.floor((e.currentTarget.currentTime || 0) / 6))} /> <div className="actions"><button onClick={start}>Démarrer la lecture</button><ExportButtons video={video} /></div>{started && <div className="segments"><h3>Segments de la vidéo</h3><div className="segmentGrid">{segments.map(i => <span key={i} className={i === segment ? 'active' : ''}>Segment {i + 1}</span>)}</div></div>}</>}</div>;
}

function ExportButtons({ video }) {
  async function exportData(format) {
    try {
      const blob = await api(`/videos/${video.videoId}/export?format=${format}`);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = `${video.videoId}.${format}`; a.click(); URL.revokeObjectURL(a.href);
    } catch (e) { alert(e.message); }
  }
  return <><button className="ghost" onClick={() => exportData('json')}>Export JSON</button><button className="ghost" onClick={() => exportData('csv')}>Export CSV</button></>;
}

function UserSections({ video }) {
  const [reason, setReason] = useState(''); const [msg, setMsg] = useState('');
  async function requestDownload() {
    if (!video) return;
    if (!reason.trim()) return setMsg('Veuillez indiquer une raison.');
    try { await api(`/videos/${video.videoId}/download-request`, { method: 'POST', body: JSON.stringify({ reason }) }); setMsg('Demande envoyée.'); setReason(''); } catch(e) { setMsg(e.message); }
  }
  return <section className="panel"><h2>Demande de téléchargement</h2><p>Une raison est obligatoire. L'administrateur pourra approuver ou refuser votre demande.</p><textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Expliquez la raison de la demande..." /><div className="actions"><button disabled={!video} onClick={requestDownload}>Envoyer la demande</button></div>{msg && <div className="alert info">{msg}</div>}</section>;
}

function AdminSections({ onRefresh }) {
  const [file, setFile] = useState(null); const [title, setTitle] = useState(''); const [msg, setMsg] = useState('');
  async function upload(e) {
    e.preventDefault(); if (!file) return;
    const fd = new FormData(); fd.append('video', file); fd.append('title', title || file.name);
    try { setMsg('Upload en cours...'); await api('/upload', { method: 'POST', body: fd }); setMsg('Vidéo uploadée.'); setFile(null); setTitle(''); onRefresh(); } catch (e) { setMsg(e.message); }
  }
  return <><section className="panel"><h2>Uploader une vidéo</h2><form className="form" onSubmit={upload}><label>Titre<input value={title} onChange={e => setTitle(e.target.value)} /></label><label>Fichier vidéo<input type="file" accept="video/*" onChange={e => setFile(e.target.files?.[0])} required /></label><button>Uploader</button></form>{msg && <div className="alert info">{msg}</div>}</section><DownloadRequests /><AdminAudit /></>;
}

function DownloadRequests() {
  const [requests, setRequests] = useState([]); const [msg, setMsg] = useState('');
  async function load() { try { const d = await api('/admin/download-requests'); setRequests(d.requests || []); } catch (e) { setMsg(e.message); } }
  useEffect(() => { load(); }, []);
  async function decide(r, action) { try { await api(`/admin/download-requests/${r.videoId}/${r.requestId}/${action}`, { method: 'POST' }); setMsg(action === 'approve' ? 'Demande approuvée.' : 'Demande refusée.'); load(); } catch (e) { setMsg(e.message); } }
  return <section className="panel"><h2>Demandes de téléchargement</h2>{msg && <div className="alert info">{msg}</div>}<div className="table">{requests.map(r => <div className="row" key={r.requestId}><div><b>{r.videoTitle || r.videoId}</b><small>{r.username} · {r.status} · {r.reason}</small></div><div className="actions">{r.status === 'pending' && <><button onClick={() => decide(r, 'approve')}>Approuver</button><button className="danger" onClick={() => decide(r, 'deny')}>Refuser</button></>}</div></div>)}</div></section>;
}

function AdminAudit() {
  const [entries, setEntries] = useState([]);
  useEffect(() => { api('/admin/audit?limit=20').then(d => setEntries(d.entries || [])).catch(() => {}); }, []);
  return <section className="panel"><h2>Logs admin</h2><div className="table">{entries.map((e, i) => <div className="row" key={i}><div><b>{e.type || e.result}</b><small>{e.username} · {e.videoId || '-'} · {e.ts}</small></div></div>)}</div></section>;
}

function App() {
  const path = useRoute();
  useEffect(() => { if (location.pathname === '/') routeTo('/presentation'); }, []);
  if (path === '/login') return <AuthForm mode="login" />;
  if (path === '/register') return <AuthForm mode="register" />;
  if (path === '/admin') return <DashboardBase admin />;
  if (path === '/dashboard') return <DashboardBase />;
  return <Presentation />;
}

createRoot(document.getElementById('root')).render(<App />);

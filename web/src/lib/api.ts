const TOKEN_KEY = "zt_token";
const USER_KEY = "zt_user";

export type Role = "admin" | "user" | "guest";
export interface AuthUser { username: string; role: Role; }

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string) { localStorage.setItem(TOKEN_KEY, t); }
export function clearToken() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
export function setUser(u: AuthUser) { localStorage.setItem(USER_KEY, JSON.stringify(u)); }

async function req<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(path, { ...init, headers });
  const text = await res.text();
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
  if (!res.ok) throw new Error((data as any)?.error || res.statusText);
  return data as T;
}

export const api = {
  login: (username: string, password: string) => req<{ token: string; role: Role; username: string }>("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  register: (username: string, password: string) => req<{ token: string; role: Role; username: string }>("/auth/register", { method: "POST", body: JSON.stringify({ username, password }) }),
  guest: () => req<{ token: string; role: Role; username: string }>("/auth/guest", { method: "POST" }),
  logout: () => req("/auth/logout", { method: "POST" }).catch(() => {}),

  listVideos: () => req<any[]>("/videos"),
  getVideo: (id: string) => req<any>(`/videos/${id}`),
  deleteVideo: (id: string) => req(`/videos/${id}`, { method: "DELETE" }),
  renameVideo: (id: string, title: string) => req(`/videos/${id}`, { method: "PATCH", body: JSON.stringify({ title }) }),
  exportVideo: async (id: string, format: "json" | "csv") => {
    const token = getToken();
    const res = await fetch(`/videos/${id}/export?format=${format}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) throw new Error("Export impossible");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `video-${id}.${format}`; a.click();
    URL.revokeObjectURL(url);
  },

  listComments: (videoId: string) => req<any[]>(`/videos/${videoId}/comments`),
  addComment: (videoId: string, text: string) => req(`/videos/${videoId}/comments`, { method: "POST", body: JSON.stringify({ text }) }),

  listUsers: () => req<any[]>("/users"),

  audit: () => req<any[]>("/audit"),

  requestDownload: (videoId: string, reason: string) => req(`/download-requests`, { method: "POST", body: JSON.stringify({ videoId, reason }) }),
  listDownloadRequests: () => req<any[]>("/download-requests"),
  approveDownloadRequest: (id: string) => req(`/download-requests/${id}/approve`, { method: "POST" }),
  rejectDownloadRequest: (id: string) => req(`/download-requests/${id}/reject`, { method: "POST" }),

  uploadVideo: (file: File, title: string, onProgress: (pct: number) => void) => new Promise<any>((resolve, reject) => {
    const fd = new FormData();
    fd.append("video", file);
    if (title) fd.append("title", title);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/videos");
    const token = getToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => { try { const d = JSON.parse(xhr.responseText); xhr.status < 400 ? resolve(d) : reject(new Error(d.error || "Upload échoué")); } catch { reject(new Error("Réponse invalide")); } };
    xhr.onerror = () => reject(new Error("Erreur réseau"));
    xhr.send(fd);
  }),
};

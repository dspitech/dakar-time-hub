import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Shield, LibraryBig, Upload, Video, Users, FileCheck2, Activity, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const items = [
  { to: "/admin/library", label: "Bibliothèque", icon: LibraryBig },
  { to: "/admin/upload", label: "Upload", icon: Upload },
  { to: "/admin/videos", label: "Vidéos", icon: Video },
  { to: "/admin/users", label: "Utilisateurs", icon: Users },
  { to: "/admin/download-requests", label: "Demandes", icon: FileCheck2 },
  { to: "/admin/audit", label: "Audit", icon: Activity },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const doLogout = async () => { await logout(); nav("/", { replace: true }); };

  return (
    <div className="min-h-screen flex bg-secondary/30">
      <aside className={cn("fixed lg:sticky top-0 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border w-64 flex-shrink-0 flex flex-col transition-transform z-40", open ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
        <div className="h-16 flex items-center gap-2 px-6 border-b border-sidebar-border">
          <div className="h-8 w-8 rounded-lg bg-primary grid place-items-center text-primary-foreground"><Shield className="h-4 w-4" /></div>
          <div>
            <div className="text-sm font-semibold text-white">Zero-Trust HLS</div>
            <div className="text-xs text-sidebar-foreground/60">Administration</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} onClick={() => setOpen(false)} className={({ isActive }) => cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors", isActive ? "bg-sidebar-accent text-white" : "hover:bg-sidebar-accent/60")}>
              <it.icon className="h-4 w-4" /> {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-2">
          <div className="px-3 py-2 text-xs">
            <div className="text-sidebar-foreground/60">Connecté en tant que</div>
            <div className="text-white font-medium">{user?.username}</div>
            <div className="text-primary text-[10px] uppercase tracking-wider mt-0.5">Admin</div>
          </div>
          <Button onClick={doLogout} variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground hover:text-white hover:bg-sidebar-accent"><LogOut className="h-4 w-4" /> Déconnexion</Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-background sticky top-0 z-30 flex items-center px-4 lg:px-8 gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(!open)}><Menu className="h-5 w-5" /></Button>
          <div className="text-sm text-muted-foreground">Dashboard Admin</div>
        </header>
        <main className="flex-1 p-4 lg:p-8 animate-fade-in"><Outlet /></main>
      </div>
    </div>
  );
}

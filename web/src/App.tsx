import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "@/pages/NotFound";
import AdminLayout from "@/layouts/AdminLayout";
import UserLayout from "@/layouts/UserLayout";
import AdminLibrary from "@/pages/admin/Library";
import AdminUpload from "@/pages/admin/Upload";
import AdminVideos from "@/pages/admin/Videos";
import AdminUsers from "@/pages/admin/Users";
import AdminDownloadReqs from "@/pages/admin/DownloadRequests";
import AdminAudit from "@/pages/admin/Audit";
import UserLibrary from "@/pages/user/Library";
import UserRequests from "@/pages/user/MyRequests";

const qc = new QueryClient();

function RequireRole({ role, children }: { role: "admin" | "user"; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Chargement…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role === "admin" && user.role !== "admin") return <Navigate to="/user" replace />;
  if (role === "user" && user.role === "admin") return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" richColors />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/admin" element={<RequireRole role="admin"><AdminLayout /></RequireRole>}>
              <Route index element={<Navigate to="library" replace />} />
              <Route path="library" element={<AdminLibrary />} />
              <Route path="upload" element={<AdminUpload />} />
              <Route path="videos" element={<AdminVideos />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="download-requests" element={<AdminDownloadReqs />} />
              <Route path="audit" element={<AdminAudit />} />
            </Route>

            <Route path="/user" element={<RequireRole role="user"><UserLayout /></RequireRole>}>
              <Route index element={<Navigate to="library" replace />} />
              <Route path="library" element={<UserLibrary />} />
              <Route path="my-requests" element={<UserRequests />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

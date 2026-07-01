import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Shield, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Login() {
  const nav = useNavigate();
  const { login, guest } = useAuth();
  const [u, setU] = useState(""); const [p, setP] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const user = await login(u, p);
      toast.success("Connecté");
      nav(user.role === "admin" ? "/admin" : "/user", { replace: true });
    } catch (err: any) { toast.error(err.message || "Échec de la connexion"); }
    finally { setLoading(false); }
  };

  const asGuest = async () => {
    setLoading(true);
    try { await guest(); toast.success("Session invité ouverte"); nav("/user", { replace: true }); }
    catch (err: any) { toast.error(err.message || "Échec"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-gradient-to-br from-background via-background to-accent/30">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"><ArrowLeft className="h-4 w-4" /> Retour</Link>
        <Card className="border-border/60 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-xl bg-primary grid place-items-center text-primary-foreground mb-2"><Shield className="h-6 w-6" /></div>
            <CardTitle>Connexion</CardTitle>
            <CardDescription>Accédez à votre espace Zero-Trust HLS</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="u">Identifiant</Label>
                <Input id="u" value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p">Mot de passe</Label>
                <Input id="p" type="password" value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "…" : "Se connecter"}</Button>
            </form>
            <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">ou</span></div></div>
            <Button variant="outline" className="w-full" onClick={asGuest} disabled={loading}>Continuer en invité</Button>
            <p className="text-center text-sm text-muted-foreground">
              Pas de compte ? <Link to="/register" className="text-primary hover:underline font-medium">Créer un compte</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

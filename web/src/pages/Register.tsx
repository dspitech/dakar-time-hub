import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Shield, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Register() {
  const nav = useNavigate();
  const { register } = useAuth();
  const [u, setU] = useState(""); const [p, setP] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (p.length < 6) { toast.error("Mot de passe : 6 caractères minimum"); return; }
    setLoading(true);
    try {
      const user = await register(u, p);
      toast.success("Compte créé");
      nav(user.role === "admin" ? "/admin" : "/user", { replace: true });
    } catch (err: any) { toast.error(err.message || "Échec de la création"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-gradient-to-br from-background via-background to-accent/30">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"><ArrowLeft className="h-4 w-4" /> Retour</Link>
        <Card className="border-border/60 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-xl bg-primary grid place-items-center text-primary-foreground mb-2"><Shield className="h-6 w-6" /></div>
            <CardTitle>Créer un compte</CardTitle>
            <CardDescription>Nouveau compte utilisateur — accès à la bibliothèque</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="u">Identifiant</Label>
                <Input id="u" value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" required minLength={3} maxLength={40} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p">Mot de passe</Label>
                <Input id="p" type="password" value={p} onChange={(e) => setP(e.target.value)} autoComplete="new-password" required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "…" : "Créer mon compte"}</Button>
              <p className="text-center text-sm text-muted-foreground">
                Déjà inscrit ? <Link to="/login" className="text-primary hover:underline font-medium">Se connecter</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

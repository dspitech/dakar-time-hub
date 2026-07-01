import { Link } from "react-router-dom";
import { Shield, Lock, KeyRound, FileCheck2, ArrowRight, Sparkles, Users, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 backdrop-blur-xl sticky top-0 z-40 bg-background/80">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <div className="h-8 w-8 rounded-lg bg-primary grid place-items-center text-primary-foreground"><Shield className="h-4 w-4" /></div>
            Zero-Trust HLS
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost" size="sm">Connexion</Button></Link>
            <Link to="/register"><Button size="sm">Créer un compte</Button></Link>
          </div>
        </div>
      </nav>

      <section className="container py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full border bg-accent/50 px-3 py-1 text-xs font-medium text-accent-foreground mb-8">
            <Sparkles className="h-3 w-3" /> Chiffrement AES-128 · Azure Container Apps
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Diffusion vidéo <span className="gradient-text">Zero-Trust</span>,<br />clé unique par session
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Vos vidéos ne circulent jamais en clair. Chaque segment HLS est chiffré, chaque clé
            délivrée à une identité vérifiée, chaque accès journalisé.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/register"><Button size="lg">Commencer <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link to="/login"><Button size="lg" variant="outline">Se connecter</Button></Link>
          </div>
        </div>
      </section>

      <section className="container pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Lock, title: "Chiffrement automatique", desc: "Segmentation HLS + AES-128 à l'upload, clé unique par vidéo générée aléatoirement." },
            { icon: KeyRound, title: "Key Server Zero-Trust", desc: "Jeton scopé, TTL 120s, révocable. La clé n'existe jamais en cache côté serveur d'origine." },
            { icon: FileCheck2, title: "Audit intégral", desc: "Chaque délivrance de clé, upload, suppression et connexion est tracée et exportable." },
          ].map((f, i) => (
            <div key={i} className="rounded-xl border bg-card p-6 hover:shadow-lg transition-shadow">
              <div className="h-10 w-10 rounded-lg bg-accent grid place-items-center mb-4"><f.icon className="h-5 w-5 text-accent-foreground" /></div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t bg-secondary/30">
        <div className="container py-20">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Trois rôles, un modèle strict</h2>
            <p className="text-muted-foreground">Chaque action est vérifiée côté serveur — jamais uniquement côté interface.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Shield, badge: "Professionnel", desc: "Dépose, renomme, supprime les vidéos. Modère les commentaires. Consulte l'audit complet." },
              { icon: Users, badge: "Utilisateur", desc: "Visionne les vidéos, commente, demande des téléchargements avec justification." },
              { icon: Activity, badge: "Invité", desc: "Session éphémère en lecture seule. Purgée automatiquement à la déconnexion." },
            ].map((r, i) => (
              <div key={i} className="rounded-xl border bg-card p-6">
                <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center mb-4"><r.icon className="h-5 w-5 text-primary" /></div>
                <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">{r.badge}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="container py-8 text-sm text-muted-foreground flex flex-wrap justify-between gap-4">
          <span>© Zero-Trust HLS — Azure Container Apps · Key Vault · Cosmos DB</span>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-foreground">Connexion</Link>
            <Link to="/register" className="hover:text-foreground">Inscription</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

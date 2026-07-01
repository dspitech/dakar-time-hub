import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="text-center space-y-4">
        <div className="text-6xl font-bold gradient-text">404</div>
        <p className="text-muted-foreground">Cette page n'existe pas.</p>
        <Link to="/"><Button>Retour à l'accueil</Button></Link>
      </div>
    </div>
  );
}

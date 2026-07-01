import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { MessageSquare } from "lucide-react";

export default function MyRequests() {
  const { user } = useAuth();
  const [reqs, setReqs] = useState<any[]>([]);
  useEffect(() => {
    api.listDownloadRequests()
      .then((r) => setReqs(r.filter((x: any) => x.requester === user?.username)))
      .catch((e) => toast.error(e.message));
  }, [user]);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Mes demandes de téléchargement</h1><p className="text-muted-foreground text-sm">Suivez le statut de vos demandes.</p></div>
      <Card>
        <CardHeader><CardTitle className="text-base">{reqs.length} demande{reqs.length > 1 ? "s" : ""}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {reqs.length === 0 && <div className="text-sm text-muted-foreground text-center py-8">Vous n'avez fait aucune demande</div>}
          {reqs.map((r) => (
            <div key={r.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex justify-between gap-4 flex-wrap">
                <div>
                  <div className="font-medium">{r.videoTitle || r.videoId}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</div>
                </div>
                <span className={"px-2 py-0.5 h-fit rounded text-xs font-medium " + (r.status === "pending" ? "bg-amber-500/10 text-amber-600" : r.status === "approved" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive")}>{r.status}</span>
              </div>
              {r.reason && (
                <div className="rounded-md bg-muted/50 p-3 text-sm flex gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div><div className="text-xs font-medium text-muted-foreground mb-1">Votre raison</div>{r.reason}</div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

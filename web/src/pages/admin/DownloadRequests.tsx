import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Check, X, MessageSquare } from "lucide-react";

export default function AdminDownloadRequests() {
  const [reqs, setReqs] = useState<any[]>([]);
  const load = () => api.listDownloadRequests().then(setReqs).catch((e) => toast.error(e.message));
  useEffect(() => { load(); }, []);
  const approve = async (id: string) => { try { await api.approveDownloadRequest(id); toast.success("Approuvée"); load(); } catch (e: any) { toast.error(e.message); } };
  const reject = async (id: string) => { try { await api.rejectDownloadRequest(id); toast.success("Refusée"); load(); } catch (e: any) { toast.error(e.message); } };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Demandes de téléchargement</h1><p className="text-muted-foreground text-sm">Approuver ou refuser les demandes avec justification.</p></div>
      <Card>
        <CardHeader><CardTitle className="text-base">{reqs.length} demande{reqs.length > 1 ? "s" : ""}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {reqs.length === 0 && <div className="text-sm text-muted-foreground p-8 text-center">Aucune demande</div>}
          {reqs.map((r) => (
            <div key={r.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex flex-wrap gap-4 justify-between">
                <div>
                  <div className="font-medium">{r.videoTitle || r.videoId}</div>
                  <div className="text-xs text-muted-foreground">Par {r.requester} · {formatDate(r.createdAt)}</div>
                </div>
                <span className={"px-2 py-0.5 h-fit rounded text-xs font-medium " + (r.status === "pending" ? "bg-amber-500/10 text-amber-600" : r.status === "approved" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive")}>{r.status}</span>
              </div>
              {r.reason && (
                <div className="rounded-md bg-muted/50 p-3 text-sm flex gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div><div className="text-xs font-medium text-muted-foreground mb-1">Raison</div>{r.reason}</div>
                </div>
              )}
              {r.status === "pending" && (
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => reject(r.id)}><X className="h-4 w-4" /> Refuser</Button>
                  <Button size="sm" onClick={() => approve(r.id)}><Check className="h-4 w-4" /> Approuver</Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default function AdminAudit() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api.audit().then(setRows).catch((e) => toast.error(e.message)); }, []);
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Journal d'audit</h1><p className="text-muted-foreground text-sm">Délivrances de clé, connexions, CRUD, rotations.</p></div>
      <Card>
        <CardHeader><CardTitle className="text-base">{rows.length} événement{rows.length > 1 ? "s" : ""}</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-muted/50"><tr>
                <th className="text-left p-3 font-medium">Horodatage</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-left p-3 font-medium">Utilisateur</th>
                <th className="text-left p-3 font-medium">Vidéo</th>
                <th className="text-left p-3 font-medium">IP</th>
                <th className="text-left p-3 font-medium">Résultat</th>
              </tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-3 text-muted-foreground font-mono text-xs">{formatDate(r.timestamp || r.time)}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-muted text-xs font-medium">{r.type || r.event}</span></td>
                    <td className="p-3">{r.username || r.user || "—"}</td>
                    <td className="p-3 text-muted-foreground">{r.videoTitle || r.videoId || "—"}</td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{r.ip || "—"}</td>
                    <td className="p-3"><span className={"text-xs font-medium " + (r.result === "success" || r.result === "ok" ? "text-primary" : r.result ? "text-destructive" : "text-muted-foreground")}>{r.result || "—"}</span></td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Aucun événement</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

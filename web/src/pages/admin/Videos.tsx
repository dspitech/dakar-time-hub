import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExportButtons } from "@/components/VideoActions";
import { formatDate } from "@/lib/utils";

export default function AdminVideos() {
  const [videos, setVideos] = useState<any[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const load = () => api.listVideos().then(setVideos).catch((e) => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const del = async (id: string) => {
    if (!confirm("Supprimer définitivement cette vidéo ?")) return;
    try { await api.deleteVideo(id); toast.success("Supprimée"); load(); } catch (e: any) { toast.error(e.message); }
  };
  const rename = async (id: string) => {
    try { await api.renameVideo(id, editTitle); toast.success("Renommée"); setEditing(null); load(); } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestion des vidéos</h1>
        <p className="text-muted-foreground text-sm">Renommer, exporter les métadonnées ou supprimer.</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">{videos.length} vidéo{videos.length > 1 ? "s" : ""}</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50"><tr>
                <th className="text-left p-3 font-medium">Titre</th>
                <th className="text-left p-3 font-medium">Propriétaire</th>
                <th className="text-left p-3 font-medium">Créée</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr></thead>
              <tbody>
                {videos.map((v) => (
                  <tr key={v.id} className="border-t">
                    <td className="p-3">{editing === v.id ? (
                      <div className="flex gap-2 items-center">
                        <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="h-8" />
                        <Button size="icon" variant="ghost" onClick={() => rename(v.id)}><Check className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditing(null)}><X className="h-4 w-4" /></Button>
                      </div>
                    ) : (<span className="font-medium">{v.title || v.id}</span>)}</td>
                    <td className="p-3 text-muted-foreground">{v.owner || "—"}</td>
                    <td className="p-3 text-muted-foreground">{formatDate(v.createdAt)}</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2 items-center">
                        <ExportButtons videoId={v.id} />
                        <Button size="icon" variant="ghost" onClick={() => { setEditing(v.id); setEditTitle(v.title || ""); }}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => del(v.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {videos.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Aucune vidéo</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

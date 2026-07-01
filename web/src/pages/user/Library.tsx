import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { HlsPlayer } from "@/components/HlsPlayer";
import { ExportButtons, DownloadRequestButton } from "@/components/VideoActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video as VideoIcon, Send } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function UserLibrary() {
  const { user } = useAuth();
  const isGuest = user?.role === "guest";
  const [videos, setVideos] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [comment, setComment] = useState("");

  useEffect(() => { api.listVideos().then(setVideos).catch((e) => toast.error(e.message)); }, []);
  useEffect(() => {
    if (!selected) return;
    api.listComments(selected.id).then(setComments).catch(() => setComments([]));
  }, [selected]);

  const sendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !comment.trim()) return;
    try { await api.addComment(selected.id, comment.trim()); setComment(""); const c = await api.listComments(selected.id); setComments(c); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bibliothèque</h1>
        <p className="text-muted-foreground text-sm">{isGuest ? "Mode invité — lecture seule." : "Regardez, commentez, demandez à télécharger."}</p>
      </div>
      <div className="grid lg:grid-cols-[300px_1fr] gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">{videos.length} vidéo{videos.length > 1 ? "s" : ""}</CardTitle></CardHeader>
          <CardContent className="space-y-1 max-h-[70vh] overflow-y-auto">
            {videos.length === 0 && <div className="text-sm text-muted-foreground">Aucune vidéo</div>}
            {videos.map((v) => (
              <button key={v.id} onClick={() => setSelected(v)} className={"w-full text-left rounded-lg px-3 py-2 text-sm transition-colors " + (selected?.id === v.id ? "bg-accent text-accent-foreground" : "hover:bg-muted")}>
                <div className="font-medium truncate">{v.title || v.id}</div>
                <div className="text-xs text-muted-foreground">{formatDate(v.createdAt)}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <CardTitle className="text-base">{selected?.title || "Sélectionnez une vidéo"}</CardTitle>
              {selected && !isGuest && (
                <div className="flex gap-2 items-center">
                  <ExportButtons videoId={selected.id} />
                  <DownloadRequestButton videoId={selected.id} />
                </div>
              )}
            </CardHeader>
            <CardContent>
              {selected ? <HlsPlayer videoId={selected.id} title={selected.title} /> : (
                <div className="aspect-video rounded-lg border border-dashed grid place-items-center text-muted-foreground">
                  <div className="text-center"><VideoIcon className="h-8 w-8 mx-auto mb-2 opacity-50" /><div className="text-sm">Choisissez une vidéo</div></div>
                </div>
              )}
            </CardContent>
          </Card>

          {selected && (
            <Card>
              <CardHeader><CardTitle className="text-base">Commentaires ({comments.length})</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {!isGuest && (
                  <form onSubmit={sendComment} className="flex gap-2">
                    <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ajouter un commentaire…" maxLength={500} />
                    <Button type="submit" size="icon"><Send className="h-4 w-4" /></Button>
                  </form>
                )}
                <div className="space-y-3">
                  {comments.length === 0 && <div className="text-sm text-muted-foreground text-center py-4">Aucun commentaire pour l'instant</div>}
                  {comments.map((c: any, i: number) => (
                    <div key={i} className="rounded-lg border p-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1"><span className="font-medium text-foreground">{c.author || c.username}</span><span>{formatDate(c.createdAt || c.timestamp)}</span></div>
                      <div className="text-sm">{c.text || c.content}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

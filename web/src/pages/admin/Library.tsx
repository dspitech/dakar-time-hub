import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { HlsPlayer } from "@/components/HlsPlayer";
import { ExportButtons } from "@/components/VideoActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Video as VideoIcon } from "lucide-react";

export default function AdminLibrary() {
  const [videos, setVideos] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => { api.listVideos().then(setVideos).catch((e) => toast.error(e.message)); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bibliothèque</h1>
        <p className="text-muted-foreground text-sm">Toutes les vidéos disponibles sur la plateforme.</p>
      </div>
      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div><CardTitle className="text-base">{selected?.title || "Sélectionnez une vidéo"}</CardTitle></div>
            {selected && <ExportButtons videoId={selected.id} />}
          </CardHeader>
          <CardContent>
            {selected ? <HlsPlayer videoId={selected.id} title={selected.title} /> : (
              <div className="aspect-video rounded-lg border border-dashed grid place-items-center text-muted-foreground">
                <div className="text-center"><VideoIcon className="h-8 w-8 mx-auto mb-2 opacity-50" /><div className="text-sm">Choisissez une vidéo</div></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

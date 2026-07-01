import { useState } from "react";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [pct, setPct] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [phase, setPhase] = useState<"idle" | "upload" | "encrypt" | "done">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Sélectionnez un fichier");
    setUploading(true); setPct(0); setPhase("upload");
    try {
      await api.uploadVideo(file, title, (p) => { setPct(p); if (p >= 100) setPhase("encrypt"); });
      setPhase("done"); toast.success("Vidéo chiffrée avec succès");
      setFile(null); setTitle("");
    } catch (e: any) { toast.error(e.message); setPhase("idle"); }
    finally { setUploading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload d'une vidéo</h1>
        <p className="text-muted-foreground text-sm">Segmentation HLS + chiffrement AES-128 automatique.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Nouveau fichier</CardTitle><CardDescription>MP4, MOV, MKV — jusqu'à 1 Go</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <label className="block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-accent/40 transition-colors">
              <input type="file" accept="video/*" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <UploadCloud className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <div className="font-medium">{file ? file.name : "Cliquez pour choisir un fichier"}</div>
              {file && <div className="text-xs text-muted-foreground mt-1">{(file.size / 1024 / 1024).toFixed(1)} Mo</div>}
            </label>
            <div className="space-y-2">
              <Label>Titre (optionnel)</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
            </div>
            <Button type="submit" disabled={!file || uploading} className="w-full">{uploading ? "En cours…" : "Téléverser & chiffrer"}</Button>

            {phase !== "idle" && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>{phase === "upload" ? "Téléversement" : phase === "encrypt" ? "Chiffrement HLS…" : "Terminé"}</span>
                  <span>{phase === "encrypt" ? "" : `${pct}%`}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: phase === "encrypt" ? "100%" : `${pct}%` }} /></div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

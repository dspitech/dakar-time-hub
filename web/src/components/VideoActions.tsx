import { useState } from "react";
import { Download, FileJson, FileSpreadsheet, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ExportButtons({ videoId }: { videoId: string }) {
  const doExport = async (format: "json" | "csv") => {
    try { await api.exportVideo(videoId, format); toast.success(`Export ${format.toUpperCase()} téléchargé`); }
    catch (e: any) { toast.error(e.message); }
  };
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={() => doExport("json")}><FileJson className="h-4 w-4" /> JSON</Button>
      <Button size="sm" variant="outline" onClick={() => doExport("csv")}><FileSpreadsheet className="h-4 w-4" /> CSV</Button>
    </div>
  );
}

export function DownloadRequestButton({ videoId }: { videoId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (reason.trim().length < 10) { toast.error("Merci de détailler votre raison (10 caractères min)"); return; }
    setLoading(true);
    try { await api.requestDownload(videoId, reason.trim()); toast.success("Demande envoyée"); setOpen(false); setReason(""); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Download className="h-4 w-4" /> Télécharger</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" /> Demande de téléchargement</DialogTitle>
          <DialogDescription>Un administrateur devra approuver votre demande. Indiquez la raison précise de votre demande.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reason">Raison de la demande *</Label>
          <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={5} placeholder="Ex : revue interne du projet X, archivage réglementaire, ..." maxLength={500} />
          <div className="text-xs text-muted-foreground text-right">{reason.length}/500</div>
        </div>
        <div className="flex justify-end gap-2">
          <DialogClose asChild><Button variant="ghost">Annuler</Button></DialogClose>
          <Button onClick={submit} disabled={loading}>{loading ? "…" : "Envoyer la demande"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

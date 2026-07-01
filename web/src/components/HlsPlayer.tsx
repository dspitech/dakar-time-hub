import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Play, Layers } from "lucide-react";

interface Segment { index: number; state: "pending" | "loading" | "loaded"; }

export function HlsPlayer({ videoId, title }: { videoId: string; title?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoId) return;
    setSegments([]); setStarted(false);

    const src = `/videos/${videoId}/playlist.m3u8`;

    if (Hls.isSupported()) {
      const hls = new Hls({ lowLatencyMode: true, autoStartLoad: true, startPosition: 0, maxBufferLength: 30 });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
        const segs: Segment[] = (data.levels[0]?.details?.fragments || []).map((_f: any, i: number) => ({ index: i, state: "pending" }));
        setSegments(segs);
      });
      hls.on(Hls.Events.FRAG_LOADING, (_e, data) => {
        setSegments((prev) => prev.map((s) => s.index === data.frag.sn ? { ...s, state: "loading" } : s));
      });
      hls.on(Hls.Events.FRAG_LOADED, (_e, data) => {
        setSegments((prev) => prev.map((s) => s.index === data.frag.sn ? { ...s, state: "loaded" } : s));
      });
      return () => { hls.destroy(); hlsRef.current = null; };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    }
  }, [videoId]);

  const play = () => {
    setStarted(true);
    videoRef.current?.play().catch(() => {});
  };

  return (
    <div className="space-y-4">
      <div className="relative rounded-xl overflow-hidden border bg-black aspect-video">
        <video ref={videoRef} controls className="w-full h-full" />
        {!started && (
          <button onClick={play} className="absolute inset-0 grid place-items-center bg-black/40 hover:bg-black/50 transition-colors group">
            <div className="flex flex-col items-center gap-2 text-white">
              <div className="h-16 w-16 rounded-full bg-primary grid place-items-center group-hover:scale-110 transition-transform"><Play className="h-7 w-7 fill-current" /></div>
              <div className="text-sm font-medium">{title ? `Lire — ${title}` : "Lecture"}</div>
            </div>
          </button>
        )}
      </div>

      {segments.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-medium mb-3"><Layers className="h-4 w-4 text-primary" /> Segments chiffrés ({segments.length})</div>
          <div className="flex flex-wrap gap-1">
            {segments.map((s) => (
              <div key={s.index} title={`Segment ${s.index} · ${s.state}`} className={
                "h-3 w-6 rounded-sm transition-colors " +
                (s.state === "loaded" ? "bg-primary" : s.state === "loading" ? "bg-primary/40 animate-pulse" : "bg-muted")
              } />
            ))}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">Chaque segment est déchiffré à la volée avec une clé unique délivrée par le Key Server.</div>
        </div>
      )}
    </div>
  );
}

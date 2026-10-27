import { useEffect, useRef, useState } from "react";
import { site } from "@/config/site";

export function MusicPlayer() {
  const [entered, setEntered] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [trackIdx, setTrackIdx] = useState(0);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [coverIdx, setCoverIdx] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const h = () => setEntered(true);
    window.addEventListener("sayu:enter", h);
    return () => window.removeEventListener("sayu:enter", h);
  }, []);

  const track = site.playlist[trackIdx] ?? site.playlist[0]!;

  useEffect(() => {
    if (!entered || site.photos.length < 2) return;
    const id = window.setInterval(() => setCoverIdx((i) => (i + 1) % site.photos.length), 4000);
    return () => window.clearInterval(id);
  }, [entered]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !entered) return;
    if (playing) a.play().catch(() => setPlaying(false));
    else a.pause();
  }, [playing, trackIdx, entered]);

  if (!entered) return null;

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className="fixed bottom-[max(10px,env(safe-area-inset-bottom))] left-1/2 z-50 w-[min(96vw,440px)] -translate-x-1/2">
      <audio
        ref={audioRef}
        src={track.src}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
        onEnded={() => {
          setTime(0);
          setTrackIdx((i) => (i + 1) % site.playlist.length);
        }}
      />
      <div className="flex w-full items-center gap-2 rounded-2xl border border-white/25 bg-white/[0.11] p-2.5 shadow-[0_12px_50px_rgba(0,0,0,.45),inset_0_1px_0_rgba(255,255,255,.2)] backdrop-blur-2xl sm:gap-3 sm:p-3 sm:pr-4">
        <img
          key={coverIdx}
          src={site.photos[coverIdx] ?? track.cover}
          alt={`${site.name} photo`}
          className="h-10 w-10 shrink-0 animate-[cover-fade_1s_ease-in-out] rounded-lg border border-white/30 object-cover shadow-lg sm:h-12 sm:w-12"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold text-paper">{track.title}</p>
          <p className="font-mono text-[9px] tracking-[0.18em] text-paper/50">{track.subtitle}</p>
          <div className="mt-1 flex min-w-0 items-center gap-1.5 sm:gap-2">
            <span className="shrink-0 font-mono text-[8px] text-paper/50 sm:text-[9px]">{fmt(time)}</span>
            <div
              className="flex h-7 min-w-0 flex-1 cursor-pointer items-center rounded-full bg-transparent py-2"
              onClick={(e) => {
                const a = audioRef.current;
                if (!a || !dur) return;
                const rect = e.currentTarget.getBoundingClientRect();
                a.currentTime = ((e.clientX - rect.left) / rect.width) * dur;
              }}
            >
              <div
                className="h-1 w-full rounded-full bg-paper/20"
              ><div
                  className="h-full rounded-full bg-paper/70"
                  style={{ width: dur ? `${(time / dur) * 100}%` : "0%" }}
                /></div>
            </div>
            <span className="shrink-0 font-mono text-[8px] text-paper/50 sm:text-[9px]">{fmt(dur)}</span>
          </div>
        </div>
        {site.playlist.length > 1 && (
          <button
            onClick={() => {
              setTime(0);
              setTrackIdx((i) => (i + 1) % site.playlist.length);
              setCoverIdx((i) => (i + 1) % site.photos.length);
            }}
            aria-label="Next song"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-paper/75 transition hover:border-white/50 hover:text-white sm:h-9 sm:w-9"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M2 2v10l7-5-7-5zm8 0h2v10h-2z" />
            </svg>
          </button>
        )}
        <button
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause" : "Play"}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-paper text-stage transition-transform hover:scale-105 active:scale-95 sm:ml-1 sm:h-10 sm:w-10"
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="2" y="1" width="3.5" height="12" rx="1" />
              <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M3 1.5v11l9-5.5-9-5.5z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

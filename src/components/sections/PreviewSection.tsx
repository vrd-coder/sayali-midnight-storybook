import { useEffect, useState } from "react";
import { site } from "@/config/site";

function useCountdown() {
  const target = new Date(site.birthdayISO).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, []);
  const remaining = Math.max(0, target - (now ?? target));
  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  return { days, hours, minutes, seconds, unlocked: now !== null && now >= target };
}

export function PreviewSection() {
  const { days, hours, minutes, seconds, unlocked } = useCountdown();
  const [opening, setOpening] = useState(false);
  const enter = () => {
    if (!unlocked || opening) return;
    setOpening(true);
    window.dispatchEvent(new CustomEvent("sayu:enter"));
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("sayu:scroll-unlock"));
      window.requestAnimationFrame(() => {
        document.getElementById("counter")?.scrollIntoView({ behavior: "smooth" });
      });
    }, 1700);
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#350909] px-6 text-[#ffe6b0]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(160,35,35,.4),transparent_65%),linear-gradient(90deg,#39090d_0%,#842326_12%,#4b1017_22%,#9c3030_34%,#581419_50%,#9c3030_66%,#4b1017_78%,#842326_88%,#39090d_100%)]" />
      <div className="pointer-events-none absolute inset-5 border border-amber-200/25 shadow-[inset_0_0_50px_#160306] sm:inset-8" />
      <div className="pointer-events-none absolute inset-x-6 top-[15%] h-px bg-amber-300/50 shadow-[0_0_18px_#f7b942]" />
      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center text-center">
        <p className="font-mono text-[10px] tracking-[0.35em] text-amber-200/75">
          A LITTLE SOMETHING FOR
        </p>
        <h1 className="mt-3 font-display text-[16vmin] leading-none text-[#ffedcc] drop-shadow-[0_5px_0_#43100d] sm:text-[9rem]">
          {site.name}
        </h1>
        <p className="mt-4 font-hand text-2xl text-amber-200">{site.previewSubtitle}</p>
        <p className="mt-6 font-mono text-[10px] tracking-[0.3em] text-amber-100/75">
          {site.birthdayLabel}
        </p>
        <div className="mt-8 flex flex-wrap items-end justify-center gap-1 sm:gap-4" aria-live="polite">
          {[
            [days, "DAYS"],
            [hours, "HRS"],
            [minutes, "MIN"],
            [seconds, "SEC"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="min-w-[52px] rounded-lg border border-amber-200/20 bg-black/40 px-1 py-2 shadow-lg sm:min-w-[92px] sm:px-5 sm:py-3"
            >
              <span className="block font-display text-2xl text-[#ffb23e] sm:text-5xl">
                {String(value).padStart(2, "0")}
              </span>
              <span className="font-mono text-[7px] tracking-[0.16em] text-amber-100/60 sm:text-[8px] sm:tracking-[0.25em]">
                {label}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-5 font-mono text-[9px] tracking-[0.25em] text-amber-100/60">
          THE CURTAINS OPEN AT MIDNIGHT · IST
        </p>
        <button
          onClick={enter}
          disabled={!unlocked || opening}
          className="mt-8 min-h-11 rounded-full border border-amber-200/50 bg-black/35 px-8 py-3 font-mono text-[10px] tracking-[0.3em] text-amber-100 transition hover:border-amber-200 hover:bg-amber-100/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {opening ? "THE SHOW BEGINS…" : unlocked ? "PREVIEW  →" : "LOCKED"}
        </button>
        <p className="mt-5 font-mono text-[9px] tracking-[0.25em] text-amber-100/45">
          HEADPHONES ON · TURN IT UP
        </p>
      </div>
      <div className={`curtain-panel curtain-left ${opening ? "curtain-open-left" : ""}`} />
      <div className={`curtain-panel curtain-right ${opening ? "curtain-open-right" : ""}`} />
    </section>
  );
}

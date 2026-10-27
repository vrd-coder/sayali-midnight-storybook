import { useEffect, useRef, useState } from "react";
import { site } from "@/config/site";

export function ChatSection() {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(0);
  const [typing, setTyping] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ob = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          ob.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    let cancelled = false;
    const timers: number[] = [];
    let t = 700;
    site.chatMessages.forEach((_, i) => {
      timers.push(window.setTimeout(() => !cancelled && setTyping(true), t));
      t += 1300;
      timers.push(
        window.setTimeout(() => {
          if (cancelled) return;
          setTyping(false);
          setVisible(i + 1);
        }, t),
      );
      t += 1100;
    });
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, replayKey]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visible, typing]);

  const replay = () => {
    setVisible(0);
    setTyping(false);
    setReplayKey((k) => k + 1);
  };

  const [stamp, setStamp] = useState("");
  useEffect(() => {
    const now = new Date();
    const hh = now.getHours() % 12 || 12;
    setStamp(
      `${String(hh).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} ${now.getHours() >= 12 ? "pm" : "am"}`,
    );
  }, []);

  return (
    <section
      id="chat"
      ref={ref}
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-3 pb-32 pt-10 sm:py-16 sm:pb-32"
      style={{
        background:
          "radial-gradient(ellipse at 20% 35%, oklch(0.58 0.16 25 / .9), transparent 45%), radial-gradient(ellipse at 80% 60%, oklch(0.48 0.13 265 / .9), transparent 48%), linear-gradient(135deg, oklch(0.27 0.11 25), oklch(0.23 0.09 300), oklch(0.3 0.08 260))",
      }}
    >
      <div className="relative rounded-[3.2rem] bg-[#09080d] p-2.5 shadow-[0_0_0_1px_#ffffff33,0_35px_90px_#000a,0_0_65px_#c14d5266]">
        <div className="chat-phone flex h-[min(84svh,720px)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-[2.7rem] bg-[linear-gradient(160deg,#1d1920,#09090d_45%,#151119)]">
          {/* header */}
          <div className="relative flex items-center gap-3 px-5 pb-3 pt-8">
            <span className="absolute left-1/2 top-3 h-5 w-24 -translate-x-1/2 rounded-full border border-white/5 bg-black shadow-[0_1px_4px_#ffffff1c]" />
            <img src={site.chatAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
            <div>
              <p className="text-[15px] font-semibold text-paper">{site.chatContact}</p>
              <p className="text-[11px] text-paper/40">iMessage · online now</p>
            </div>
          </div>

          {/* messages */}
          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 pb-4">
            <p className="text-center font-mono text-[9px] tracking-[0.2em] text-paper/40">
              TODAY · {stamp}
            </p>
            {site.chatMessages.slice(0, visible).map((m, i) => (
              <div
                key={`${replayKey}-${i}`}
                className="flex justify-end"
                style={{ animation: "bubble-in 0.35s ease-out" }}
              >
                <p className="max-w-[84%] rounded-2xl rounded-br-md bg-[#ff9d4d] px-4 py-2.5 text-[12px] leading-relaxed text-[#23140b] shadow-[0_4px_12px_#0003]">
                  {m}
                </p>
              </div>
            ))}
            {typing && (
              <div className="flex justify-end">
                <div className="flex gap-1 rounded-2xl rounded-br-md bg-bubble/70 px-4 py-3">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="h-1.5 w-1.5 rounded-full bg-stage/60"
                      style={{
                        animation: `twinkle 1s ease-in-out ${d * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* message composer */}
          <div className="flex items-center gap-2 border-t border-white/5 px-4 py-3">
            <div className="flex-1 truncate rounded-full bg-white/10 px-4 py-2 text-[12px] text-paper/35">
              iMessage
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-paper/40">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="currentColor"
                style={{ transform: "rotate(180deg)" }}
              >
                <path d="M2 7l10-5-4 5 4 5-10-5z" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={replay}
        disabled={!inView || visible < site.chatMessages.length}
        aria-hidden={!inView || visible < site.chatMessages.length}
        tabIndex={inView && visible >= site.chatMessages.length ? 0 : -1}
        className={`relative z-10 mt-3 min-h-11 rounded-full px-4 py-2 font-mono text-[10px] tracking-[0.3em] text-white/60 transition-colors hover:text-white ${inView && visible >= site.chatMessages.length ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        REPLAY ↺
      </button>
    </section>
  );
}

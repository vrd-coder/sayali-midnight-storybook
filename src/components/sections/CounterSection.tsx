import { useEffect, useRef, useState } from "react";
import { site } from "@/config/site";

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function RollingDigit({
  digit,
  rolling,
  delay,
}: {
  digit: number;
  rolling: boolean;
  delay: number;
}) {
  const sequence = Array.from({ length: 30 }, (_, i) => i % 10);
  const stopAt = 10 + digit;
  return (
    <span className="counter-digit-window">
      <span
        className="counter-digit-track"
        style={{
          transform: rolling ? `translateY(-${stopAt}em)` : "translateY(0)",
          transitionDelay: rolling ? `${delay}s` : "0s",
        }}
      >
        {sequence.map((value, i) => (
          <span className="counter-digit" aria-hidden={i !== stopAt} key={i}>
            {value}
          </span>
        ))}
      </span>
    </span>
  );
}

export function CounterSection() {
  const ref = useRef<HTMLElement>(null);
  const [started, setStarted] = useState(false);
  const [showReels, setShowReels] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [settled, setSettled] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [fire, setFire] = useState(false);
  const now = useClock();

  useEffect(() => {
    let activated = false;
    const activate = () => {
      if (activated) return;
      activated = true;
      setStarted(true);
      observer.disconnect();
      window.removeEventListener("scroll", checkVisibility);
      window.removeEventListener("resize", checkVisibility);
    };
    const checkVisibility = () => {
      const bounds = ref.current?.getBoundingClientRect();
      if (bounds && bounds.top < window.innerHeight && bounds.bottom > 0) activate();
    };
    const ob = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) activate();
      },
      { threshold: 0 },
    );
    const observer = ob;
    if (ref.current) ob.observe(ref.current);
    window.addEventListener("scroll", checkVisibility, { passive: true });
    window.addEventListener("resize", checkVisibility);
    checkVisibility();
    return () => {
      ob.disconnect();
      window.removeEventListener("scroll", checkVisibility);
      window.removeEventListener("resize", checkVisibility);
    };
  }, []);

  useEffect(() => {
    if (!started) return;
    const timers = [
      window.setTimeout(() => setShowReels(true), 300),
      window.setTimeout(() => setRolling(true), 620),
      window.setTimeout(() => setSettled(true), 5_300),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [started]);

  const target = new Date(site.birthdayISO);
  const isBirthday = now !== null && now.getTime() >= target.getTime();
  const istCalendar = (date: Date) => {
    const parts = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).formatToParts(date);
    return {
      year: Number(parts.find((part) => part.type === "year")?.value),
      month: Number(parts.find((part) => part.type === "month")?.value),
      day: Number(parts.find((part) => part.type === "day")?.value),
    };
  };
  const todayIst = now ? istCalendar(now) : null;
  const birthdayIst = istCalendar(target);
  const monthsSince =
    todayIst && isBirthday
      ? (todayIst.year - birthdayIst.year) * 12 +
        todayIst.month -
        birthdayIst.month -
        (todayIst.day < birthdayIst.day ? 1 : 0)
      : 0;
  const totalAgeMonths = site.turnsAge * 12 + Math.max(0, monthsSince);
  const years = Math.floor(totalAgeMonths / 12);
  const months = totalAgeMonths % 12;
  const clock =
    now?.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }) ?? "--:--:--";

  const celebrate = () => {
    if (!settled || celebrating || fire) return;
    setFire(true);
    window.setTimeout(() => {
      setFire(false);
      setCelebrating(true);
    }, 1500);
  };

  return (
    <section
      id="counter"
      ref={ref}
      className="counter-atmosphere relative flex min-h-[100svh] items-center justify-center overflow-hidden px-4 text-white"
    >
      <p className="absolute left-6 top-7 font-mono text-[9px] tracking-[0.3em] text-white/35">
        {site.name.toUpperCase()} · MIDNIGHT IN IST
      </p>
      <div
        className={`counter-focus relative flex flex-col items-center ${settled ? "counter-zoom" : ""}`}
      >
        <button
          type="button"
          onClick={celebrate}
          disabled={!settled || fire || celebrating}
          aria-label={celebrating ? "17" : settled ? "Click 16 to reveal 17" : "Rolling toward 16"}
          className={`counter-number relative touch-manipulation font-display leading-none tracking-[-0.08em] text-white transition-colors duration-700 ${settled && !celebrating && !fire ? "cursor-pointer hover:text-white" : "cursor-default"}`}
          style={{ fontSize: "min(46vw, 40vmin)" }}
        >
          <span className={`counter-zero ${showReels || celebrating ? "counter-zero-hidden" : ""}`}>
            {celebrating ? "" : "0"}
          </span>
          {!celebrating && (
            <span className={`counter-reels ${showReels ? "counter-reels-visible" : ""}`}>
              {String(site.turnsAge - 1)
                .padStart(2, "0")
                .split("")
                .map((value, i) => (
                  <RollingDigit key={i} digit={Number(value)} rolling={rolling} delay={i * 0.18} />
                ))}
            </span>
          )}
          {celebrating && site.turnsAge}
        </button>
        {fire && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-1/2 flex -translate-y-1/2 justify-center gap-5 text-5xl sm:text-7xl"
            aria-hidden="true"
          >
            {[0, 1, 2].map((i) => (
              <svg
                key={i}
                className="birthday-flame"
                style={{ animationDelay: `${i * 90}ms` }}
                viewBox="0 0 100 120"
                role="presentation"
              >
                <defs>
                  <linearGradient id={`flame-outer-${i}`} x1="0" x2="0" y1="1" y2="0">
                    <stop offset="0" stopColor="#ed3108" />
                    <stop offset="0.6" stopColor="#ff8a00" />
                    <stop offset="1" stopColor="#ffe66d" />
                  </linearGradient>
                  <linearGradient id={`flame-inner-${i}`} x1="0" x2="0" y1="1" y2="0">
                    <stop offset="0" stopColor="#ffb000" />
                    <stop offset="1" stopColor="#fff5b0" />
                  </linearGradient>
                </defs>
                <path
                  d="M50 4C59 20 53 30 67 43c13 13 24 24 20 43-4 20-19 31-37 31-24 0-40-16-39-39 1-20 20-32 20-49 10 7 12 18 10 26C53 43 59 27 50 4Z"
                  fill={`url(#flame-outer-${i})`}
                />
                <path
                  d="M51 65c10 12 17 19 12 33-4 11-17 14-25 6-11-12 1-28 13-39Z"
                  fill={`url(#flame-inner-${i})`}
                />
              </svg>
            ))}
          </div>
        )}
        {celebrating && (
          <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden="true">
            {Array.from({ length: 18 }, (_, i) => (
              <span
                key={i}
                className={`balloon-rise birthday-balloon balloon-color-${i % 6} absolute bottom-0 left-1/2`}
                style={{
                  animationDelay: `${(i % 6) * 0.22}s`,
                  transform: `translateX(${(i - 9) * 8}vw)`,
                }}
                aria-hidden="true"
              />
            ))}
          </div>
        )}
        <p
          className={`mt-5 font-hand text-3xl transition-opacity duration-500 ${celebrating ? "opacity-100" : "opacity-0"}`}
        >
          {site.birthdayGreeting}, {site.name}! 🎂
        </p>
      </div>
      <div className="counter-age-clock absolute bottom-6 right-6 text-right font-mono text-[9px] leading-relaxed tracking-[0.17em] text-white/45 sm:text-[10px]">
        {isBirthday ? (
          <>
            <span>
              {years}Y · {months}M
            </span>
            <br />
          </>
        ) : (
          <>
            <span>COUNTING DOWN TO {site.turnsAge}</span>
            <br />
          </>
        )}
        <span>{clock} IST</span>
      </div>
      {!celebrating && settled && (
        <div className="counter-instruction absolute bottom-24 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 whitespace-nowrap">
          <svg
            className="counter-instruction-arrow h-5 w-5 text-white/70"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 20V5m0 0L6 11m6-6 6 6"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="rounded-full border border-white/20 bg-white/[0.07] px-5 py-2.5 font-mono text-[10px] tracking-[0.2em] text-white/75 shadow-[0_0_24px_#ffffff12] backdrop-blur-sm">
            {site.counterTapPrompt}
          </p>
        </div>
      )}
    </section>
  );
}

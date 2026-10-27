import { useState } from "react";
import { site } from "@/config/site";

type Turn = { from: number; to: number; direction: "forward" | "backward" };

const PHOTO_SCATTER_SLOTS = [
  "left-[4%] sm:left-[6%] lg:left-[9%] top-[18%]",
  "left-[14%] sm:left-[19%] lg:left-[25%] top-[18%] max-sm:hidden",
  "right-[14%] sm:right-[19%] lg:right-[25%] top-[18%] max-sm:hidden",
  "right-[4%] sm:right-[6%] lg:right-[9%] top-[18%]",
  "left-[4%] sm:left-[6%] lg:left-[9%] top-1/2",
  "left-[14%] sm:left-[19%] lg:left-[25%] top-1/2 max-sm:hidden",
  "right-[14%] sm:right-[19%] lg:right-[25%] top-1/2 max-sm:hidden",
  "right-[4%] sm:right-[6%] lg:right-[9%] top-1/2",
  "left-[4%] sm:left-[6%] lg:left-[9%] top-[82%]",
  "left-[14%] sm:left-[19%] lg:left-[25%] top-[82%] max-sm:hidden",
  "right-[14%] sm:right-[19%] lg:right-[25%] top-[82%] max-sm:hidden",
  "right-[4%] sm:right-[6%] lg:right-[9%] top-[82%]",
];

const viewStarts = [0, 1, 3, 5, 7];

export function SketchbookSection() {
  const pages = site.sketchbookPhotos;
  const [view, setView] = useState(0);
  const [turn, setTurn] = useState<Turn | null>(null);
  const turnPage = (direction: Turn["direction"]) => {
    if (turn) return;
    const currentIndex = viewStarts.indexOf(view);
    const nextIndex = currentIndex + (direction === "forward" ? 1 : -1);
    if (nextIndex < 0 || nextIndex >= viewStarts.length) return;
    setTurn({ from: view, to: viewStarts[nextIndex], direction });
  };

  const finishTurn = () => {
    if (!turn) return;
    setView(turn.to);
    setTurn(null);
  };

  const bookView = turn?.to ?? view;
  const bookSpread = bookView === 0 ? null : [bookView, bookView + 1];
  const leafIndex = turn
    ? turn.direction === "forward"
      ? turn.from === 0 ? 0 : turn.from + 1
      : turn.from
    : -1;
  const reverseLeafIndex = turn
    ? turn.direction === "forward"
      ? turn.from === 0 ? 1 : turn.from + 2
      : turn.from - 1
    : -1;

  return (
    <section className="relative isolate min-h-screen overflow-hidden bg-stage">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {site.sketchbookBackdropPhotos.map((src, i) => {
          const random = (salt: number) => {
            const value = Math.sin((i + 1) * 127.1 + salt * 311.7) * 43758.5453;
            return value - Math.floor(value);
          };
          const rotateX = -16 + random(3) * 32;
          const rotateY = -20 + random(4) * 40;
          const rotateZ = -30 + random(5) * 60;
          const scale = 0.76 + random(6) * 0.5;

          return (
            <div
              key={`background-${src}`}
              className={`absolute aspect-[4/5] w-[clamp(58px,10vw,140px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border border-white/15 bg-white/10 shadow-[0_18px_50px_#0008] blur-[2px] ${PHOTO_SCATTER_SLOTS[i % PHOTO_SCATTER_SLOTS.length]}`}
              style={{
                opacity: 0.2 + random(7) * 0.18,
                transform: `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
              }}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </div>
          );
        })}
        <div className="absolute inset-0 bg-stage/45 backdrop-blur-[2px]" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 48%, rgba(113, 83, 55, .32), rgba(3, 4, 5, .58) 75%)",
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center py-14 sm:py-16">
        <p className="mb-5 font-mono text-[10px] tracking-[0.35em] text-paper/60 sm:mb-7">
          FLIP THROUGH OUR PAGES
        </p>
        <div
          className="sketchbook-frame relative"
          style={{ perspective: "1800px", perspectiveOrigin: "50% 50%" }}
          aria-label={view === 0 ? `Sketchbook cover, ${pages.length} pages` : `Sketchbook spread, pages ${view + 1} and ${Math.min(view + 2, pages.length)} of ${pages.length}`}
        >
          {bookSpread ? (
            <div className="absolute inset-0 grid grid-cols-2">
              {bookSpread.map((pageIndex, side) => (
                <div key={`${bookView}-${side}`} className={`sketchbook-page relative min-w-0 ${side === 0 ? "sketchbook-left-page" : "sketchbook-right-page"}`}>
                  {pageIndex < pages.length && (
                    <img
                      src={pages[pageIndex]}
                      alt={`Sketchbook page ${pageIndex + 1}`}
                      draggable={false}
                      className="block h-full w-full select-none object-contain"
                    />
                  )}
                </div>
              ))}
              <div className="pointer-events-none absolute inset-y-0 left-1/2 w-4 -translate-x-1/2 bg-gradient-to-r from-black/20 via-black/5 to-white/10" />
            </div>
          ) : (
            <img
              src={pages[0]}
              alt="Sketchbook cover"
              draggable={false}
              className="absolute inset-y-0 right-0 h-full w-1/2 select-none object-contain"
            />
          )}
          {turn && turn.from > 0 && (turn.direction === "forward" ? turn.from : turn.from + 1) < pages.length && (
            <img
              src={pages[turn.direction === "forward" ? turn.from : turn.from + 1]}
              alt=""
              aria-hidden="true"
              draggable={false}
              className={`sketchbook-page absolute inset-y-0 z-10 h-full w-1/2 object-contain ${turn.direction === "forward" ? "left-0" : "right-0"}`}
            />
          )}
          {turn && leafIndex >= 0 && (
            <div
              key={`${turn.from}-${turn.to}`}
              onAnimationEnd={finishTurn}
              className={`absolute inset-y-0 z-20 w-1/2 [transform-style:preserve-3d] ${turn.direction === "forward" ? "right-0 origin-left sketchbook-leaf-forward" : "left-0 origin-right sketchbook-leaf-backward"}`}
            >
              <img
                src={pages[leafIndex]}
                alt=""
                aria-hidden="true"
                draggable={false}
                className="absolute inset-0 h-full w-full object-contain [backface-visibility:hidden]"
              />
              {reverseLeafIndex >= 0 && reverseLeafIndex < pages.length && (
                <img
                  src={pages[reverseLeafIndex]}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-contain [backface-visibility:hidden] [transform:rotateY(180deg)]"
                />
              )}
            </div>
          )}
        </div>
        <div className="mt-5 flex items-center gap-3 sm:mt-7 sm:gap-4">
          <button
            type="button"
            onClick={() => turnPage("backward")}
            disabled={view === 0 || turn !== null}
            aria-label="Previous sketchbook spread"
            className="touch-manipulation min-h-11 rounded-full border border-paper/35 bg-black/20 px-4 py-2 font-mono text-[10px] tracking-[0.2em] text-paper/85 transition hover:border-paper disabled:cursor-default disabled:opacity-35 sm:px-5"
          >
            ‹ PREV
          </button>
          <span className="min-w-12 text-center font-mono text-[10px] tracking-[0.22em] text-paper/75">
            {view === 0 ? `COVER / ${pages.length}` : `${view + 1}–${Math.min(view + 2, pages.length)} / ${pages.length}`}
          </span>
          <button
            type="button"
            onClick={() => turnPage("forward")}
            disabled={view === viewStarts[viewStarts.length - 1] || turn !== null}
            aria-label="Next sketchbook spread"
            className="touch-manipulation min-h-11 rounded-full border border-paper/35 bg-black/20 px-4 py-2 font-mono text-[10px] tracking-[0.2em] text-paper/85 transition hover:border-paper disabled:cursor-default disabled:opacity-35 sm:px-5"
          >
            NEXT ›
          </button>
        </div>
      </div>
    </section>
  );
}

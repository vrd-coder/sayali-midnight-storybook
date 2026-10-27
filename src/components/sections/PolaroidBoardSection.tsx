import { useEffect, useRef, useState } from "react";
import { polaroidDefaults, site } from "@/config/site";

type Pos = { x: number; y: number; z: number };
type Def = { x: number; y: number; rot: number };
type PosMap = Record<string, Pos>;
const STORE_KEY = "sayu-board-v1";

export function PolaroidBoardSection() {
  const items = site.boardPhotos.map((src, i) => ({
    id: `b${i}`,
    src,
    label: site.boardLabels[i] ?? "❤️",
    def: polaroidDefaults[i] ?? { x: 50, y: 50, rot: 0 },
  }));

  const boardRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [pos, setPos] = useState<PosMap>(() => {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved) return JSON.parse(saved) as PosMap;
    } catch {
      /* ignore */
    }
    return {};
  });
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const getPos = (id: string, def: Def): Pos => {
    const p = pos[id];
    if (viewport.width === 0 || viewport.width >= 860) return p ? { x: p.x, y: p.y, z: p.z } : { x: def.x, y: def.y, z: 1 };

    const index = Number(id.slice(1));
    const width = Math.max(viewport.width, 320);
    const height = Math.max(viewport.height, 560) * 1.2;
    const card = Math.max(104, Math.min(190, Math.min(width, viewport.height || 560) * 0.26));
    const columns = width < 640 ? 2 : 3;
    const mobileX = columns === 2
      ? index % columns ? 55 : 5
      : [5, 38, 70][index % columns]!;
    const mobileY = columns === 2
      ? 10 + Math.floor(index / columns) * 22
      : 12 + Math.floor(index / columns) * 30;
    return {
      x: Math.min(100 - (card / width) * 100, Math.max(0, p?.x ?? mobileX)),
      y: Math.min(100 - ((card * 1.4) / height) * 100, Math.max(0, p?.y ?? mobileY)),
      z: p?.z ?? 1,
    };
  };

  const onPointerDown = (e: React.PointerEvent, id: string, def: Def, el: HTMLElement) => {
    const board = boardRef.current;
    if (!board) return;
    const rect = board.getBoundingClientRect();
    const p = getPos(id, def);
    drag.current = {
      id,
      dx: ((e.clientX - rect.left) / rect.width) * 100 - p.x,
      dy: ((e.clientY - rect.top) / rect.height) * 100 - p.y,
    };
    setDragging(id);
    setPos((prev) => ({ ...prev, [id]: { ...getPos(id, def), z: 99 } }));
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const board = boardRef.current;
    if (!d || !board) return;
    const rect = board.getBoundingClientRect();
    const cardWidth = Math.min(190, Math.max(104, Math.min(rect.width, viewport.height || 560) * 0.26));
    const cardHeight = cardWidth * 1.4;
    const maxX = Math.max(0, 100 - (cardWidth / rect.width) * 100);
    const maxY = Math.max(0, 100 - (cardHeight / rect.height) * 100);
    const x = Math.min(maxX, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100 - d.dx));
    const y = Math.min(maxY, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100 - d.dy));
    setPos((prev) => {
      const cur = prev[d.id] ?? { x: 0, y: 0, z: 1 };
      return { ...prev, [d.id]: { ...cur, x, y } };
    });
  };

  const onPointerUp = () => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(null);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(pos));
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!dragging) return;
    const up = () => onPointerUp();
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, pos]);

  return (
    <section className="relative min-h-[120svh] w-full overflow-hidden min-[860px]:min-h-screen">
      <div
        ref={boardRef}
        className="grid-paper relative min-h-[120svh] w-full max-w-none select-none px-0 min-[860px]:min-h-screen"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {[
          { x: 7, y: 30, delay: "0s" },
          { x: 31, y: 69, delay: "1.4s" },
          { x: 55, y: 18, delay: "2.5s" },
          { x: 88, y: 38, delay: ".7s" },
        ].map((b, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="board-butterfly pointer-events-none absolute z-0 text-2xl opacity-70"
            style={{ left: `${b.x}%`, top: `${b.y}%`, animationDelay: b.delay }}
          >
            🦋
          </span>
        ))}
        <p className="absolute left-1/2 top-8 -translate-x-1/2 font-mono text-[10px] tracking-[0.35em] text-stage/40">
          DRAG THEM AROUND · {site.name.toUpperCase()}'S WALL
        </p>

        {items.map((it) => {
          const p = getPos(it.id, it.def);
          return (
            <div
              key={it.id}
              onPointerDown={(e) => onPointerDown(e, it.id, it.def, e.currentTarget)}
              className="absolute w-[clamp(104px,26vmin,190px)] cursor-grab touch-none rounded-sm bg-white p-2 pb-3 shadow-xl"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                transform: `rotate(${it.def.rot}deg)`,
                zIndex: p.z,
                animation: `pop-in 0.6s cubic-bezier(0.2,1.4,0.4,1) ${Number(it.id.slice(1)) * 0.1}s backwards`,
                boxShadow: dragging === it.id ? "0 24px 48px -12px rgba(0,0,0,0.35)" : undefined,
              }}
            >
              <span className="absolute -right-2 -top-3 z-10 text-2xl drop-shadow">❤️</span>
              <img
                src={it.src}
                alt={it.label}
                draggable={false}
                className="aspect-square w-full rounded-sm object-cover"
              />
              <p className="mt-1 text-center font-hand text-xl leading-tight text-stage">
                {it.label}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

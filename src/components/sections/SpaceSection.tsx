import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { site } from "@/config/site";

/**
 * First-person "VR headset" photo room.
 *
 * The camera sits at the exact center of the room. Instead of moving a camera, we
 * rotate the whole room around that point (yaw = look left/right, pitch = look
 * up/down). The CSS `perspective` distance and the world's `translateZ` are the
 * same value (P), which puts the world's origin on the camera, so rotating the room
 * is the same as turning your head on the spot. Photos hang on the inside of the
 * walls and already face the center, so nothing has to be flipped around.
 */

type Look = { x: number; y: number }; // x = pitch, y = yaw (degrees)
type Layout = { P: number; panelW: number; rowGap: number; floorY: number };

const PITCH_LIMIT = 65;
const ROWS = 3;
const LOOK_HINT = "drag to look around";
const GLOW_GUTTER = 100; // px of breathing room around each photo for the blue glow

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function computeLayout(width: number, height: number): Layout {
  // P is both the camera focal length and the wall distance, so a photo straight
  // ahead is drawn at its true pixel size. Tied to the smaller screen side so the
  // field of view stays comfortable on phones, tablets and desktops alike.
  const P = clamp(Math.min(width, height) * 0.95, 340, 920);
  const panelW = height < 520 ? clamp(height * 0.2, 80, 110) : clamp(P * 0.17, 92, 176);
  const panelH = (panelW - 12) * 1.25 + 12 + 30; // photo + frame padding + caption
  const rowGap = panelH * 1.22;
  return { P, panelW, rowGap, floorY: rowGap + panelH * 0.8 };
}

function initialLayout(): Layout {
  if (typeof window === "undefined") return computeLayout(1280, 800);
  return computeLayout(window.innerWidth, window.innerHeight);
}

export function SpaceSection() {
  const photos = site.photos;
  const sectionRef = useRef<HTMLElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const look = useRef<Look>({ x: 0, y: 0 });
  const velocity = useRef<Look>({ x: 0, y: 0 }); // degrees per millisecond
  const drag = useRef<{ id: number; x: number; y: number; t: number } | null>(null);
  const lastTouch = useRef(-Infinity);
  const [layout, setLayout] = useState<Layout>(initialLayout);
  const [touched, setTouched] = useState(false);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  const toChat = () => document.getElementById("chat")?.scrollIntoView({ behavior: "smooth" });

  const applyLook = () => {
    if (!worldRef.current) return;
    const { x, y } = look.current;
    worldRef.current.style.transform = `translateZ(${layoutRef.current.P}px) rotateX(${x}deg) rotateY(${y}deg)`;
  };

  // Keep the layout in step with the real size of the section (rotation, resize, mobile toolbars).
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width && height) setLayout(computeLayout(width, height));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(applyLook, [layout.P]);

  // Inertia after a drag, plus a slow idle drift until the viewer takes over.
  useEffect(() => {
    let frame = 0;
    let previous = performance.now();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = (now: number) => {
      const dt = Math.min(now - previous, 40);
      previous = now;
      if (!drag.current) {
        const decay = Math.exp(-dt / 320);
        velocity.current.x *= decay;
        velocity.current.y *= decay;
        look.current.y += velocity.current.y * dt;
        look.current.x = clamp(look.current.x + velocity.current.x * dt, -PITCH_LIMIT, PITCH_LIMIT);
        if (!reduceMotion && now - lastTouch.current > 3500) look.current.y += dt * 0.0025;
      }
      applyLook();
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const beginLook = (event: PointerEvent<HTMLElement>) => {
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, t: event.timeStamp };
    velocity.current = { x: 0, y: 0 };
    lastTouch.current = performance.now();
    event.currentTarget.setPointerCapture(event.pointerId);
    setTouched(true);
  };

  const lookAround = (event: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d || d.id !== event.pointerId) return;
    // ~1 degree of head turn per (focal length / 57.3) pixels, nudged up a touch so
    // a normal swipe can sweep a good part of the room.
    const perPixel = (180 / Math.PI / layoutRef.current.P) * 1.25;
    const dYaw = -(event.clientX - d.x) * perPixel; // drag right -> the room follows your hand
    const dPitch = (event.clientY - d.y) * perPixel; // drag down -> you look up
    const dt = Math.max(1, event.timeStamp - d.t);
    look.current.y += dYaw;
    look.current.x = clamp(look.current.x + dPitch, -PITCH_LIMIT, PITCH_LIMIT);
    velocity.current = {
      x: lerp(velocity.current.x, dPitch / dt, 0.5),
      y: lerp(velocity.current.y, dYaw / dt, 0.5),
    };
    d.x = event.clientX;
    d.y = event.clientY;
    d.t = event.timeStamp;
    lastTouch.current = performance.now();
    applyLook();
  };

  const stopLooking = (event: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (d && event.timeStamp - d.t > 80) velocity.current = { x: 0, y: 0 }; // paused before letting go
    drag.current = null;
    lastTouch.current = performance.now();
  };

  const nudge = (event: KeyboardEvent<HTMLElement>) => {
    const step = 9;
    if (event.key === "ArrowLeft") look.current.y -= step;
    else if (event.key === "ArrowRight") look.current.y += step;
    else if (event.key === "ArrowUp") look.current.x = clamp(look.current.x + step, -PITCH_LIMIT, PITCH_LIMIT);
    else if (event.key === "ArrowDown") look.current.x = clamp(look.current.x - step, -PITCH_LIMIT, PITCH_LIMIT);
    else return;
    event.preventDefault();
    lastTouch.current = performance.now();
    setTouched(true);
    applyLook();
  };

  // Photos hang on the inside of a cylindrical wall, in three rows. The middle row is
  // lined up with the starting view; the top and bottom rows sit half a step off.
  const panels = useMemo(() => {
    const count = photos.length;
    if (!count) return [];
    const columns = clamp(count, 6, 12);
    const step = 360 / columns;
    const shift = Math.max(1, Math.floor(count / ROWS));
    const labels = site.spaceLabels;
    return Array.from({ length: ROWS }, (_, row) =>
      Array.from({ length: columns }, (_, column) => {
        const index = (column + row * shift) % count;
        return {
          key: `${row}-${column}`,
          src: photos[index],
          alt: `${site.name} memory ${index + 1}`,
          label: labels[(row * columns + column) % labels.length],
          angle: step * (column + (row === 1 ? 0 : 0.5)),
          y: (row - 1) * layout.rowGap,
        };
      }),
    ).flat();
  }, [photos, layout.rowGap]);

  const { P, panelW, floorY } = layout;
  const grid = "rgba(56,189,248,.24)";
  const plane = (y: number, tilt: number, opacity: number) => (
    <div
      aria-hidden
      className="pointer-events-none absolute rounded-full"
      style={{
        left: -P,
        top: -P,
        width: P * 2,
        height: P * 2,
        opacity,
        transform: `translateY(${y}px) rotateX(${tilt}deg)`,
        backgroundImage: `linear-gradient(${grid} 1px, transparent 1px), linear-gradient(90deg, ${grid} 1px, transparent 1px)`,
        backgroundSize: `${P / 7}px ${P / 7}px`,
        backgroundPosition: "center",
        maskImage: "radial-gradient(circle closest-side, #000 0%, rgba(0,0,0,.7) 45%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(circle closest-side, #000 0%, rgba(0,0,0,.7) 45%, transparent 100%)",
      }}
    />
  );

  return (
    <section
      ref={sectionRef}
      tabIndex={0}
      onKeyDown={nudge}
      className="starfield relative h-[100svh] min-h-[560px] select-none overflow-hidden outline-none"
      aria-label="360 degree photo room. Drag, or use the arrow keys, to look around."
    >
      <div
        className="absolute inset-0 touch-pan-y cursor-grab active:cursor-grabbing"
        style={{ perspective: `${P}px`, perspectiveOrigin: "50% 50%" }}
        onPointerDown={beginLook}
        onPointerMove={lookAround}
        onPointerUp={stopLooking}
        onPointerCancel={stopLooking}
      >
        {/* The room. Its origin is the camera, so rotating it turns your head. */}
        <div
          ref={worldRef}
          className="absolute left-1/2 top-1/2 h-0 w-0"
          style={{ transformStyle: "preserve-3d" }}
        >
          {plane(floorY, 90, 0.9)}
          {plane(-floorY, -90, 0.6)}

          {panels.map((panel) => (
            <article
              key={panel.key}
              className="group absolute left-0 top-0 h-0 w-0"
              style={{
                transformStyle: "preserve-3d",
                // Turn to the wall position, step out to the wall (in front of the viewer),
                // then slide up/down to the row. The front face already looks back at the center.
                transform: `rotateY(${panel.angle}deg) translateZ(${-P}px) translateY(${panel.y}px)`,
              }}
            >
              {/* The padding is a gutter so the hover glow has room to paint on every side
                  (browsers clip a 3D layer's shadow to its own box). It never catches the pointer. */}
              <div
                className="pointer-events-none absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 transition duration-500 ease-out group-hover:scale-110"
                style={{ width: panelW + GLOW_GUTTER * 2, padding: GLOW_GUTTER }}
              >
                <div className="pointer-events-auto overflow-hidden rounded-xl border border-white/25 bg-black/45 p-1.5 shadow-[0_18px_55px_#0009] transition duration-500 ease-out group-hover:border-sky-300 group-hover:shadow-[0_0_10px_#38bdf8,0_0_34px_#0284c7,0_0_85px_#0284c766]">
                  <img
                    src={panel.src}
                    alt={panel.alt}
                    draggable={false}
                    className="aspect-[4/5] w-full rounded-lg object-cover"
                  />
                  <p className="py-1.5 text-center font-hand text-sm text-white/85 sm:text-base">{panel.label}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Headset-lens vignette and edge shading */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,.6) 100%)" }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-black/45 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-black/55 to-transparent" />

      <p className="pointer-events-none absolute left-1/2 top-7 z-20 -translate-x-1/2 whitespace-nowrap font-display text-lg tracking-[0.12em] text-white sm:top-9 sm:text-2xl">
        {site.spaceHeading}
      </p>

      <div
        className={`pointer-events-none absolute bottom-40 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-sky-200/20 bg-black/35 px-4 py-2 font-mono text-[8px] uppercase tracking-[0.18em] text-sky-100/65 backdrop-blur-md transition-opacity duration-1000 sm:bottom-40 sm:gap-3 sm:px-5 sm:text-[9px] sm:tracking-[0.23em] ${
          touched ? "opacity-0" : "opacity-100"
        }`}
      >
        <svg width="14" height="8" viewBox="0 0 14 8" fill="none" className="animate-pulse" aria-hidden>
          <path d="M5 1 1.5 4 5 7M1.5 4H13" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {LOOK_HINT}
        <svg width="14" height="8" viewBox="0 0 14 8" fill="none" className="animate-pulse" aria-hidden>
          <path d="M9 1 12.5 4 9 7M12.5 4H1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <button
        onClick={toChat}
        className="absolute bottom-24 left-1/2 z-20 flex min-h-11 -translate-x-1/2 items-center whitespace-nowrap rounded-full border border-white/25 bg-black/45 px-6 py-2 font-mono text-[9px] tracking-[0.25em] text-white/80 backdrop-blur transition hover:border-sky-300 hover:text-sky-100 sm:bottom-24"
      >
        {site.spaceContinueLabel}
      </button>
    </section>
  );
}

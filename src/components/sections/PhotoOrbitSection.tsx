import { useEffect, useRef, useState } from "react";
import { site } from "@/config/site";

const threadPath =
  "M -120 520 C 130 600 190 575 355 560 C 520 545 400 465 410 325 C 420 175 510 95 590 145 C 685 205 590 345 485 265 C 420 215 500 120 585 165 C 690 245 760 445 915 410 C 1090 365 1190 270 1510 115 C 1580 -90 1300 -125 1100 -125 C 680 -125 280 -125 -120 -125 C -210 60 -210 405 -120 520 Z";
const phoneThreadPath =
  "M 18 520 C 72 552 137 528 164 478 C 195 420 264 448 292 498 C 326 558 309 406 250 352 C 204 310 116 335 70 276 C 19 211 86 145 151 185 C 217 226 250 309 185 315 C 120 321 76 255 111 204 C 148 150 246 169 281 114 C 328 41 246 -2 180 30 C 111 64 56 124 20 90 C -18 54 -3 2 25 -20 C 52 -42 31 80 16 151 C 3 229 -9 388 18 520 Z";

export function PhotoOrbitSection() {
  const photos = site.photos;
  const count = Math.max(photos.length, 1);
  const pathRef = useRef<SVGPathElement>(null);
  const photoRefs = useRef<Array<HTMLDivElement | null>>([]);
  const hoveredPhoto = useRef<number | null>(null);
  const [coloredPhoto, setColoredPhoto] = useState<number | null>(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const update = () => setCompact(window.innerWidth <= 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const path = pathRef.current;
    const svg = path?.ownerSVGElement;
    if (!path || !svg || photos.length === 0) return;

    const pathLength = path.getTotalLength();
    const pathBounds = compact ? path.getBBox() : null;
    const distances = Array.from({ length: count }, (_, index) => (index * pathLength) / count);
    let lastFrame = 0;
    let animationFrame = 0;

    const animate = (timestamp: number) => {
      const delta = lastFrame ? Math.min(timestamp - lastFrame, 40) / 1000 : 0;
      lastFrame = timestamp;
      const bounds = svg.getBoundingClientRect();
      const cardSize = Math.max(58, Math.min(150, bounds.width * 0.18));
      const scaleX = bounds.width / 1440;
      const scaleY = bounds.height / 620;
      photoRefs.current.forEach((photo, index) => {
        if (!photo) return;
        const speed = hoveredPhoto.current === index ? 22 : 105;
        distances[index] = (distances[index]! + delta * speed) % pathLength;
        const point = path.getPointAtLength(distances[index]!);
        if (compact && pathBounds) {
          const fitX = (bounds.width - cardSize) / pathBounds.width;
          const fitY = (bounds.height - cardSize) / pathBounds.height;
          photo.style.left = `${(point.x - pathBounds.x) * fitX + cardSize / 2}px`;
          photo.style.top = `${(point.y - pathBounds.y) * fitY + cardSize / 2}px`;
        } else {
          photo.style.left = `${point.x * scaleX}px`;
          photo.style.top = `${point.y * scaleY}px`;
        }
      });

      animationFrame = window.requestAnimationFrame(animate);
    };

    animationFrame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [compact, count, photos.length]);

  return (
    <section className="relative min-h-[150svh] overflow-hidden bg-[#faf9f6] py-12 text-[#171614] sm:min-h-[100svh] sm:py-20">
      <div className="relative z-10 mx-auto max-w-[1440px] px-7 pt-6 sm:px-12 lg:pt-14">
        <p className="font-mono text-[9px] tracking-[0.3em] text-black/35">
          {site.photoOrbitLabel}
        </p>
        <h2 className="mt-8 font-sans text-[clamp(40px,13vw,56px)] font-light leading-[0.9] tracking-[-0.065em] sm:mt-12 sm:text-7xl lg:text-[5.7rem]">
          Happy
          <br />
          <strong className="font-semibold">Birthday</strong>
          <br />
          <span className="font-semibold text-orange-500">{site.name}</span>
        </h2>
        <div className="mt-6 h-px w-16 bg-orange-500/70" />
        <p className="mt-5 max-w-[290px] text-sm leading-relaxed text-black/65">{site.wishText}</p>
      </div>

      <div
        className="photo-thread pointer-events-none absolute inset-x-0 bottom-12 top-0 z-20 overflow-hidden"
        aria-label="A moving strand of Sayali's photos"
      >
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={compact ? "0 0 320 560" : "0 0 1440 620"}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path ref={pathRef} d={compact ? phoneThreadPath : threadPath} fill="none" />
        </svg>
        {photos.map((src, i) => (
          <div
            key={`${src}-${i}`}
            ref={(node) => {
              photoRefs.current[i] = node;
            }}
            onPointerEnter={() => {
              hoveredPhoto.current = i;
              setColoredPhoto(i);
            }}
            onPointerDown={() => {
              hoveredPhoto.current = i;
              setColoredPhoto(i);
            }}
            onPointerLeave={(event) => {
              if (event.pointerType === "touch") return;
              if (hoveredPhoto.current === i) {
                hoveredPhoto.current = null;
                setColoredPhoto((current) => (current === i ? null : current));
              }
            }}
            onPointerCancel={() => {
              if (hoveredPhoto.current === i) hoveredPhoto.current = null;
              setColoredPhoto((current) => (current === i ? null : current));
            }}
            className="thread-photo group pointer-events-auto absolute w-[clamp(58px,18vw,150px)] rounded-md bg-white p-1 shadow-[0_3px_12px_#0004] sm:w-[18vw] sm:min-w-[82px]"
            style={{
              transform: `translate(-50%,-50%) rotate(${(i % 2 ? 1 : -1) * (7 + (i % 3))}deg)`,
            }}
          >
            <img
              src={src}
              alt={`${site.name} memory ${i + 1}`}
              draggable={false}
              className={`aspect-square w-full rounded-sm object-cover transition-[filter,transform,box-shadow] duration-500 group-hover:scale-110 group-hover:grayscale-0 group-hover:shadow-xl ${coloredPhoto === i ? "grayscale-0" : "grayscale"}`}
            />
          </div>
        ))}
      </div>

      <div className="absolute bottom-8 left-[4%] right-[4%] z-20 flex items-center gap-4 border-t border-black/10 pt-3">
        <span className="h-px flex-1 bg-black/10" />
        <p className="font-mono text-[9px] tracking-[0.35em] text-black/40">MADE FOR YOU</p>
      </div>
    </section>
  );
}

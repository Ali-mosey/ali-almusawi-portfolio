"use client";

import { useEffect, useRef } from "react";

export type CatVariant = "watcher" | "ball" | "scratcher";

/**
 * Per-project cat companion, in the same style as the homepage cat.
 *  - "watcher":   sits fixed bottom-left of the screen, head follows the mouse.
 *  - "ball":      perched on the hero image's top edge, batting a black ball.
 *  - "scratcher": on hind legs, reaching up to scratch at the image.
 */
export default function ProjectCat({ variant }: { variant: CatVariant }) {
  if (variant === "watcher") return <WatcherCat />;
  if (variant === "ball") return <BallCat />;
  return <ScratcherCat />;
}

/* ------------------------------------------------------------------ */
/* A — sitting bottom-left, head tracks the mouse                      */
/* ------------------------------------------------------------------ */

function WatcherCat() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const pupilsRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const wrap = wrapRef.current;
        const head = headRef.current;
        const pupils = pupilsRef.current;
        if (!wrap || !head || !pupils) return;

        const r = wrap.getBoundingClientRect();
        // approximate head centre within the wrapper
        const cx = r.left + r.width * 0.5;
        const cy = r.top + r.height * 0.33;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;

        // tilt the head toward the cursor ("up" = 0°), gently damped
        let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
        deg = Math.max(-30, Math.min(30, deg * 0.5));
        head.style.transform = `rotate(${deg}deg)`;

        // pupils glance the same way
        const px = Math.max(-2.4, Math.min(2.4, dx / 90));
        const py = Math.max(-1.6, Math.min(2.2, dy / 140));
        pupils.style.transform = `translate(${px}px, ${py}px)`;
      });
    };

    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={wrapRef} className="cat-watcher" aria-hidden="true">
      <svg viewBox="0 0 90 104" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* tail wrapped around the front */}
        <path
          d="M68 92 q18 4 16 -14 q-1 -10 -10 -11"
          fill="none"
          stroke="#2b2f3a"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* sitting body */}
        <ellipse cx="45" cy="79" rx="26" ry="24" fill="#2b2f3a" />
        {/* front paws */}
        <ellipse cx="36" cy="100" rx="8" ry="4" fill="#2b2f3a" />
        <ellipse cx="54" cy="100" rx="8" ry="4" fill="#2b2f3a" />

        {/* head (rotates to follow the mouse) */}
        <g ref={headRef} className="cat-head">
          <circle cx="45" cy="36" r="17" fill="#2b2f3a" />
          {/* ears */}
          <path d="M31 25 l-3 -13 l12 7 z" fill="#2b2f3a" />
          <path d="M59 25 l3 -13 l-12 7 z" fill="#2b2f3a" />
          {/* eyes */}
          <ellipse cx="38" cy="36" rx="3.4" ry="4.2" fill="#ffd76a" />
          <ellipse cx="52" cy="36" rx="3.4" ry="4.2" fill="#ffd76a" />
          <g ref={pupilsRef} className="cat-pupils">
            <circle cx="38" cy="37" r="1.7" fill="#111" />
            <circle cx="52" cy="37" r="1.7" fill="#111" />
          </g>
          {/* nose */}
          <path d="M43.5 44 l3 0 l-1.5 2.2 z" fill="#e8a0a8" />
        </g>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* B — crouched on the hero's top edge, playing with a black ball      */
/* ------------------------------------------------------------------ */

function BallCat() {
  return (
    <div className="cat-ball-wrap" aria-hidden="true">
      {/* the y = 58 line is the "wall edge"; CSS aligns it to the image top */}
      <svg viewBox="0 0 150 74" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* flicking tail */}
        <g className="cat-tail">
          <path
            d="M32 44 q-14 -12 -2 -24"
            fill="none"
            stroke="#2b2f3a"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </g>
        {/* crouched body, facing the ball */}
        <rect x="26" y="32" width="68" height="26" rx="13" fill="#2b2f3a" />
        {/* head */}
        <circle cx="96" cy="34" r="13" fill="#2b2f3a" />
        {/* ears */}
        <path d="M86 26 l-2 -11 l9 6 z" fill="#2b2f3a" />
        <path d="M99 23 l5 -10 l3 10 z" fill="#2b2f3a" />
        {/* alert eye, watching the ball */}
        <circle cx="101" cy="33" r="2.2" fill="#ffd76a" />
        {/* batting front paw */}
        <g className="cat-paw">
          <path
            d="M100 44 q6 8 12 10"
            fill="none"
            stroke="#2b2f3a"
            strokeWidth="9"
            strokeLinecap="round"
          />
        </g>
        {/* the black ball */}
        <g className="cat-ball">
          <circle cx="124" cy="51.5" r="6.5" fill="#111" />
          <path
            d="M119 49 a6.5 6.5 0 0 1 8 -2"
            stroke="#3a3a3a"
            strokeWidth="1.2"
            fill="none"
          />
        </g>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* C — on hind legs, reaching up and scratching at the image           */
/* ------------------------------------------------------------------ */

function ScratcherCat() {
  return (
    <div className="cat-scratcher" aria-hidden="true">
      <svg viewBox="0 0 70 112" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* scratch marks where the paws are working */}
        <g className="cat-scratch-marks" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" opacity="0.7">
          <path d="M20 8 l-3 10" />
          <path d="M26 6 l-3 10" />
          <path d="M32 7 l-3 10" />
        </g>

        {/* swaying tail */}
        <g className="cat-tail">
          <path
            d="M44 100 q16 -2 12 -20"
            fill="none"
            stroke="#2b2f3a"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </g>

        {/* hind feet planted */}
        <ellipse cx="28" cy="107" rx="9" ry="4.5" fill="#2b2f3a" />
        <ellipse cx="43" cy="108" rx="8" ry="4" fill="#2b2f3a" />

        {/* front paws reaching up (alternate scratching) */}
        <g className="cat-paw-a">
          <path
            d="M27 52 q-6 -22 -5 -34"
            fill="none"
            stroke="#2b2f3a"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </g>
        <g className="cat-paw-b">
          <path
            d="M38 52 q0 -24 -3 -36"
            fill="none"
            stroke="#2b2f3a"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </g>

        {/* stretched-up body (slight reach-and-relax) */}
        <g className="cat-body">
          <ellipse cx="34" cy="76" rx="14" ry="32" fill="#2b2f3a" />
          {/* head tipped back, looking up at the target */}
          <circle cx="30" cy="40" r="12" fill="#2b2f3a" />
          {/* ears */}
          <path d="M20 32 l-3 -11 l10 6 z" fill="#2b2f3a" />
          <path d="M33 29 l4 -10 l4 10 z" fill="#2b2f3a" />
          {/* eye looking up */}
          <circle cx="26" cy="36" r="2" fill="#ffd76a" />
        </g>
      </svg>
    </div>
  );
}

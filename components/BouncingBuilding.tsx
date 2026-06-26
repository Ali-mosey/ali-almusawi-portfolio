"use client";

import { useEffect, useRef } from "react";

/**
 * A small highrise that drifts and bounces around the viewport
 * (DVD-logo style). Fixed-position, non-interactive overlay.
 */
export default function BouncingBuilding() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.display = "none";
      return;
    }

    const size = { w: 56, h: 104 };
    let x = Math.random() * Math.max(1, window.innerWidth - size.w);
    let y = Math.random() * Math.max(1, window.innerHeight - size.h);
    let vx = 1.3;
    let vy = 1.0;
    let raf = 0;

    const step = () => {
      const maxX = window.innerWidth - size.w;
      const maxY = window.innerHeight - size.h;

      x += vx;
      y += vy;

      if (x <= 0) {
        x = 0;
        vx = Math.abs(vx);
      } else if (x >= maxX) {
        x = maxX;
        vx = -Math.abs(vx);
      }
      if (y <= 0) {
        y = 0;
        vy = Math.abs(vy);
      } else if (y >= maxY) {
        y = maxY;
        vy = -Math.abs(vy);
      }

      el.style.transform = `translate(${x}px, ${y}px)`;
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={ref} className="bouncing-building" aria-hidden="true">
      <svg
        width="56"
        height="104"
        viewBox="0 0 56 104"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* tower body */}
        <rect x="10" y="14" width="36" height="90" fill="#1d2433" />
        {/* slim setback top */}
        <rect x="18" y="4" width="20" height="12" fill="#252e40" />
        {/* antenna */}
        <rect x="27" y="0" width="2" height="6" fill="#6b7689" />
        {/* windows grid */}
        <g fill="#ffd76a">
          <rect x="15" y="22" width="5" height="6" />
          <rect x="24" y="22" width="5" height="6" />
          <rect x="33" y="22" width="5" height="6" opacity="0.45" />
          <rect x="15" y="34" width="5" height="6" opacity="0.45" />
          <rect x="24" y="34" width="5" height="6" />
          <rect x="33" y="34" width="5" height="6" />
          <rect x="15" y="46" width="5" height="6" />
          <rect x="24" y="46" width="5" height="6" opacity="0.45" />
          <rect x="33" y="46" width="5" height="6" />
          <rect x="15" y="58" width="5" height="6" opacity="0.45" />
          <rect x="24" y="58" width="5" height="6" />
          <rect x="33" y="58" width="5" height="6" opacity="0.45" />
          <rect x="15" y="70" width="5" height="6" />
          <rect x="24" y="70" width="5" height="6" />
          <rect x="33" y="70" width="5" height="6" />
          <rect x="15" y="82" width="5" height="6" opacity="0.45" />
          <rect x="24" y="82" width="5" height="6" />
          <rect x="33" y="82" width="5" height="6" opacity="0.45" />
        </g>
      </svg>
    </div>
  );
}

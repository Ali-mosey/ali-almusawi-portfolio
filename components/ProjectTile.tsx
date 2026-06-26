"use client";

import Link from "next/link";
import { useRef, type MouseEvent } from "react";
import SleepingCat from "./SleepingCat";

type TileProject = {
  slug: string;
  title: string;
  subtitle?: string | null;
  hero?: { src: string } | null;
};

/**
 * Homepage project tile. Emits an expanding "ripple" ring from the
 * cursor position while the mouse moves across the image, and can host
 * a sleeping cat on top of the image.
 */
export default function ProjectTile({
  project,
  withCat = false,
}: {
  project: TileProject;
  withCat?: boolean;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const lastRipple = useRef(0);

  const spawnRipple = (event: MouseEvent<HTMLDivElement>) => {
    const frame = frameRef.current;
    if (!frame) return;

    // throttle so a fast drag doesn't flood the DOM
    const now = Date.now();
    if (now - lastRipple.current < 180) return;
    lastRipple.current = now;

    const rect = frame.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;
    frame.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  };

  return (
    <Link href={`/projects/${project.slug}`} className="tile">
      <div
        ref={frameRef}
        className="frame"
        onMouseEnter={spawnRipple}
        onMouseMove={spawnRipple}
      >
        {project.hero && <img src={project.hero.src} alt={project.title} />}
      </div>
      {withCat && <SleepingCat />}
      <div className="caption">
        <h2>{project.title}</h2>
        {project.subtitle && <span>{project.subtitle}</span>}
      </div>
    </Link>
  );
}

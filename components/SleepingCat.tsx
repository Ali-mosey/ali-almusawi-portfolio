"use client";

/**
 * A cat loafing on the top edge of a project image as if it were a wall:
 * lying on its side, sleeping, with one front leg dangling over the edge.
 * Breathing body + softly swaying leg + floating "z z z".
 *
 * The viewBox's y = 55 line is the "wall edge"; everything below it (the
 * dangling leg) hangs down over the image. CSS lifts the cat so that line
 * sits on the image's top border.
 */
export default function SleepingCat() {
  return (
    <div className="sleeping-cat" aria-hidden="true">
      <svg
        viewBox="0 0 116 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* snooze marks above the head */}
        <g className="cat-zzz" fill="#ffffff" stroke="#1d2433" strokeWidth="1">
          <text x="9" y="27" fontSize="9" fontFamily="sans-serif">z</text>
          <text x="16" y="18" fontSize="11" fontFamily="sans-serif">z</text>
          <text x="25" y="10" fontSize="13" fontFamily="sans-serif">z</text>
        </g>

        {/* dangling front leg hangs below the wall edge (y = 55) */}
        <g className="cat-leg">
          <path
            d="M44 50 C 42 62, 41 72, 43 82"
            fill="none"
            stroke="#2b2f3a"
            strokeWidth="10"
            strokeLinecap="round"
          />
        </g>

        {/* breathing body */}
        <g className="cat-body">
          {/* tail curling up at the back */}
          <path
            d="M94 52 q16 2 17 -14 q1 -11 -9 -12"
            fill="none"
            stroke="#2b2f3a"
            strokeWidth="7"
            strokeLinecap="round"
          />
          {/* loaf body lying on the edge */}
          <rect x="22" y="32" width="74" height="23" rx="11" fill="#2b2f3a" />
          {/* tucked resting front paw */}
          <ellipse cx="34" cy="53" rx="7" ry="4" fill="#2b2f3a" />
          {/* head resting down on the left */}
          <circle cx="26" cy="42" r="12" fill="#2b2f3a" />
          {/* ears */}
          <path d="M15 33 l1 -12 l9 8 z" fill="#2b2f3a" />
          <path d="M27 30 l5 -11 l5 10 z" fill="#2b2f3a" />
          {/* closed, sleeping eye */}
          <path
            d="M20 43 q3 3 6 0"
            fill="none"
            stroke="#cfd4dd"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}

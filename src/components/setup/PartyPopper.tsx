"use client";

import { useEffect, useState } from "react";

/** Short, accessible celebration — respects reduced motion. */
export function PartyPopper() {
  const [burst, setBurst] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setBurst(false), 2200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className="relative mx-auto flex h-32 w-32 items-center justify-center"
      aria-hidden
    >
      <span
        className={`text-7xl ${burst ? "animate-bounce" : ""} motion-reduce:animate-none`}
      >
        🎉
      </span>
      {burst ? (
        <div className="pointer-events-none absolute inset-0 motion-reduce:hidden">
          {["#0B4F8A", "#0D6B3D", "#F4B400", "#B00020"].map((color, i) => (
            <span
              key={color}
              className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full opacity-80"
              style={{
                background: color,
                animation: `unk-confetti 1.6s ease-out ${i * 0.08}s forwards`,
                transform: `rotate(${i * 90}deg) translateY(-2rem)`,
              }}
            />
          ))}
        </div>
      ) : null}
      <style jsx>{`
        @keyframes unk-confetti {
          to {
            transform: rotate(360deg) translate(3.5rem, 3.5rem);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

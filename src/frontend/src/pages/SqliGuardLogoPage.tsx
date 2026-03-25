import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface SqliGuardLogoPageProps {
  onComplete: () => void;
}

export default function SqliGuardLogoPage({
  onComplete,
}: SqliGuardLogoPageProps) {
  const [phase, setPhase] = useState<"assemble" | "spin" | "glitch" | "pulse">(
    "assemble",
  );

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("spin"), 800);
    const t2 = setTimeout(() => setPhase("glitch"), 1600);
    const t3 = setTimeout(() => setPhase("pulse"), 2600);
    const t4 = setTimeout(() => onComplete(), 4200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ background: "#000" }}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.45 0.18 142 / 0.07) 1px, transparent 1px), linear-gradient(90deg, oklch(0.45 0.18 142 / 0.07) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, oklch(0.03 0 0 / 0.9) 100%)",
        }}
      />

      {/* Pulse rings */}
      {phase === "pulse" &&
        [0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border pointer-events-none"
            style={{ borderColor: "oklch(0.72 0.22 142 / 0.3)" }}
            initial={{ width: 140, height: 140, opacity: 0.7 }}
            animate={{ width: 320 + i * 60, height: 320 + i * 60, opacity: 0 }}
            transition={{
              duration: 1.6,
              delay: i * 0.4,
              ease: "easeOut",
              repeat: Number.POSITIVE_INFINITY,
              repeatDelay: 0.2,
            }}
          />
        ))}

      <div className="relative flex flex-col items-center gap-6 z-10">
        {/* Shield SVG with assembly animation */}
        <motion.div
          animate={
            phase === "spin"
              ? { rotate: [0, 360], scale: [1, 1.15, 1] }
              : phase === "pulse"
                ? { scale: [1, 1.06, 1] }
                : {}
          }
          transition={
            phase === "spin"
              ? { duration: 0.8, ease: "easeInOut" }
              : phase === "pulse"
                ? {
                    duration: 1.2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }
                : {}
          }
          style={{
            filter:
              "drop-shadow(0 0 20px oklch(0.72 0.22 142 / 0.8)) drop-shadow(0 0 50px oklch(0.72 0.22 142 / 0.4))",
          }}
        >
          <svg
            width="140"
            height="160"
            viewBox="0 0 130 148"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="SQLi Guard logo"
          >
            {/* Outer shield - assembles from top */}
            <motion.path
              d="M65 4L8 26V70C8 102 32 130 65 144C98 130 122 102 122 70V26L65 4Z"
              fill="oklch(0.10 0.04 142)"
              stroke="oklch(0.72 0.22 142)"
              strokeWidth="3"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
            {/* Inner shield */}
            <motion.path
              d="M65 14L18 33V70C18 98 38 123 65 135C92 123 112 98 112 70V33L65 14Z"
              fill="oklch(0.07 0.03 142)"
              stroke="oklch(0.72 0.22 142 / 0.3)"
              strokeWidth="1"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            />
            {/* Lock body */}
            <motion.rect
              x="48"
              y="78"
              width="34"
              height="26"
              rx="4"
              fill="oklch(0.72 0.22 142)"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.95, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            />
            {/* Lock shackle */}
            <motion.path
              d="M55 78V68C55 60 75 60 75 68V78"
              stroke="oklch(0.72 0.22 142)"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.35 }}
            />
            {/* Lock keyhole */}
            <motion.circle
              cx="65"
              cy="91"
              r="4.5"
              fill="oklch(0.08 0.03 142)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            />
            <motion.rect
              x="63"
              y="91"
              width="4"
              height="7"
              rx="1"
              fill="oklch(0.08 0.03 142)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            />
            {/* Scan lines */}
            {[0, 1, 2, 3].map((i) => (
              <motion.line
                key={i}
                x1={23 + i * 28}
                y1="60"
                x2={23 + i * 28}
                y2="66"
                stroke="oklch(0.72 0.22 142 / 0.45)"
                strokeWidth="1.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.05 }}
              />
            ))}
          </svg>
        </motion.div>

        {/* Text section */}
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {/* Glitch title */}
          <div className="relative">
            <h1
              className="text-3xl font-bold tracking-[0.4em] uppercase select-none"
              style={{
                color: "oklch(0.72 0.22 142)",
                fontFamily: "'JetBrains Mono', monospace",
                textShadow:
                  "0 0 18px oklch(0.72 0.22 142 / 0.65), 0 0 40px oklch(0.72 0.22 142 / 0.3)",
                animation:
                  phase === "glitch"
                    ? "sqliGlitch 0.08s steps(1) 12 alternate"
                    : "none",
              }}
            >
              SQLi GUARD
            </h1>
            {/* Glitch layers */}
            {phase === "glitch" && (
              <>
                <div
                  className="text-3xl font-bold tracking-[0.4em] uppercase absolute inset-0 select-none"
                  style={{
                    color: "oklch(0.72 0.22 142)",
                    fontFamily: "'JetBrains Mono', monospace",
                    clipPath: "inset(0 0 60% 0)",
                    transform: "translateX(-3px)",
                    opacity: 0.6,
                    mixBlendMode: "screen",
                  }}
                  aria-hidden="true"
                >
                  SQLi GUARD
                </div>
                <div
                  className="text-3xl font-bold tracking-[0.4em] uppercase absolute inset-0 select-none"
                  style={{
                    color: "oklch(0.55 0.28 180)",
                    fontFamily: "'JetBrains Mono', monospace",
                    clipPath: "inset(40% 0 30% 0)",
                    transform: "translateX(4px)",
                    opacity: 0.5,
                    mixBlendMode: "screen",
                  }}
                  aria-hidden="true"
                >
                  SQLi GUARD
                </div>
              </>
            )}
          </div>

          <motion.p
            className="text-[10px] tracking-[0.3em] uppercase"
            style={{
              color: "oklch(0.50 0.14 142)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.4 }}
          >
            ADVANCED THREAT PREVENTION SYSTEM
          </motion.p>

          <motion.div
            className="flex items-center gap-2 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.4 }}
          >
            {["SQL", "XSS", "CSRF", "MITM", "BUFFER"].map((tag, i) => (
              <motion.span
                key={tag}
                className="text-[9px] font-mono px-1.5 py-0.5 border rounded-sm"
                style={{
                  color: "oklch(0.60 0.18 142)",
                  borderColor: "oklch(0.45 0.14 142 / 0.5)",
                  background: "oklch(0.12 0.04 142 / 0.6)",
                }}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + i * 0.08 }}
              >
                {tag}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <style>{`
        @keyframes sqliGlitch {
          0%   { transform: translateX(0); }
          20%  { transform: translateX(-4px) skewX(-2deg); }
          40%  { transform: translateX(4px) skewX(2deg); }
          60%  { transform: translateX(-2px); }
          80%  { transform: translateX(3px) skewX(-1deg); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

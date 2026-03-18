import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

interface SecurityLogoPageProps {
  onComplete: () => void;
}

export default function SecurityLogoPage({
  onComplete,
}: SecurityLogoPageProps) {
  const [phase, setPhase] = useState<"logo" | "text" | "done">("logo");
  const [cursorVisible, setCursorVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("text"), 800);
    const t2 = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 10000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

  useEffect(() => {
    const interval = setInterval(() => setCursorVisible((v) => !v), 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const start = Date.now();
    const duration = 10000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (pct >= 100) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ background: "#000" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.45 0.18 142 / 0.07) 1px, transparent 1px), linear-gradient(90deg, oklch(0.45 0.18 142 / 0.07) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, oklch(0.03 0 0 / 0.85) 100%)",
        }}
      />
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border pointer-events-none"
          style={{ borderColor: "oklch(0.72 0.22 142 / 0.35)" }}
          initial={{ width: 120, height: 120, opacity: 0 }}
          animate={
            phase !== "logo"
              ? {
                  width: [120, 340 + i * 60],
                  height: [120, 340 + i * 60],
                  opacity: [0.6, 0],
                }
              : {}
          }
          transition={{
            duration: 2.2,
            delay: i * 0.5,
            ease: "easeOut",
            repeat: Number.POSITIVE_INFINITY,
            repeatDelay: 0.5,
          }}
        />
      ))}
      <div className="relative flex flex-col items-center gap-8 z-10">
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 18,
            delay: 0.1,
          }}
          style={{
            filter:
              "drop-shadow(0 0 18px oklch(0.72 0.22 142 / 0.7)) drop-shadow(0 0 40px oklch(0.72 0.22 142 / 0.35))",
          }}
        >
          <svg
            role="img"
            aria-label="Security shield"
            width="130"
            height="148"
            viewBox="0 0 130 148"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M65 4L8 26V70C8 102 32 130 65 144C98 130 122 102 122 70V26L65 4Z"
              fill="oklch(0.12 0.04 142)"
              stroke="oklch(0.72 0.22 142)"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path
              d="M65 14L18 33V70C18 98 38 123 65 135C92 123 112 98 112 70V33L65 14Z"
              fill="oklch(0.08 0.03 142)"
              stroke="oklch(0.72 0.22 142 / 0.35)"
              strokeWidth="1"
              strokeLinejoin="round"
            />
            <rect
              x="48"
              y="78"
              width="34"
              height="26"
              rx="4"
              fill="oklch(0.72 0.22 142)"
              opacity="0.95"
            />
            <path
              d="M55 78V68C55 60 75 60 75 68V78"
              stroke="oklch(0.72 0.22 142)"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="65" cy="91" r="4.5" fill="oklch(0.08 0.03 142)" />
            <rect
              x="63"
              y="91"
              width="4"
              height="7"
              rx="1"
              fill="oklch(0.08 0.03 142)"
            />
            {[0, 1, 2, 3].map((i) => (
              <line
                key={i}
                x1={23 + i * 28}
                y1="60"
                x2={23 + i * 28}
                y2="66"
                stroke="oklch(0.72 0.22 142 / 0.4)"
                strokeWidth="1.5"
              />
            ))}
          </svg>
        </motion.div>
        <AnimatePresence>
          {phase !== "logo" && (
            <motion.div
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <h1
                className="text-2xl font-bold tracking-[0.35em] uppercase"
                style={{
                  color: "oklch(0.72 0.22 142)",
                  fontFamily: "'JetBrains Mono', monospace",
                  textShadow: "0 0 16px oklch(0.72 0.22 142 / 0.6)",
                }}
              >
                COMBO DEFENSE CONSOLE
              </h1>
              <motion.p
                className="text-xs tracking-widest"
                style={{
                  color: "oklch(0.55 0.15 142)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                SECURITY PROTOCOL INITIALIZING
                <span
                  style={{
                    opacity: cursorVisible ? 1 : 0,
                    transition: "opacity 0.1s",
                    color: "oklch(0.72 0.22 142)",
                  }}
                >
                  _
                </span>
              </motion.p>
              <motion.div
                className="w-64 h-0.5 rounded-full overflow-hidden mt-1"
                style={{ background: "oklch(0.2 0.05 142)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    background: "oklch(0.72 0.22 142)",
                    width: `${progress}%`,
                    transition: "width 0.05s linear",
                  }}
                />
              </motion.div>
              <motion.p
                className="text-[10px] tracking-widest"
                style={{
                  color: "oklch(0.4 0.1 142)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {Math.round(progress)}%
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

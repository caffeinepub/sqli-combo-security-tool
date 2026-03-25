import { ShieldCheck, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { playResolutionChime } from "../hooks/useSoundEffect";

interface AnalystDefendedNotificationProps {
  attack: { name: string } | null;
  onDismiss: () => void;
}

const DURATION = 10;

export default function AnalystDefendedNotification({
  attack,
  onDismiss,
}: AnalystDefendedNotificationProps) {
  const [remaining, setRemaining] = useState(DURATION);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const handleDismiss = useCallback(() => {
    onDismissRef.current();
  }, []);

  useEffect(() => {
    if (!attack) {
      setRemaining(DURATION);
      return;
    }
    setRemaining(DURATION);
    playResolutionChime();
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          onDismissRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [attack]);

  const progress = (remaining / DURATION) * 100;

  return (
    <AnimatePresence>
      {attack && (
        <motion.div
          key="analyst-defended-overlay"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: "spring", stiffness: 280, damping: 26 }}
          className="fixed bottom-6 right-6 z-50 w-full max-w-sm"
          data-ocid="analyst_notification.modal"
        >
          {/* Card */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: "rgba(5, 20, 12, 0.97)",
              border: "1px solid rgba(34,197,94,0.4)",
              boxShadow:
                "0 0 32px rgba(34,197,94,0.25), 0 8px 32px rgba(0,0,0,0.7)",
            }}
          >
            {/* Top accent bar */}
            <div
              className="w-full h-1"
              style={{
                background:
                  "linear-gradient(90deg, #15803d, #22c55e, #4ade80, #22c55e, #15803d)",
                backgroundSize: "200% 100%",
                animation: "slideBar 2s linear infinite",
              }}
            />

            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="relative flex items-center justify-center w-12 h-12 rounded-full"
                    style={{
                      background: "rgba(34,197,94,0.1)",
                      border: "1px solid rgba(34,197,94,0.4)",
                      boxShadow: "0 0 16px rgba(34,197,94,0.3)",
                    }}
                  >
                    <ShieldCheck className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <div className="text-xs font-mono tracking-[0.2em] text-green-500/70 mb-0.5">
                      ✓ THREAT NEUTRALIZED
                    </div>
                    <h2
                      className="text-xl font-mono font-bold tracking-widest text-green-400"
                      style={{
                        textShadow:
                          "0 0 16px rgba(34,197,94,0.7), 0 0 32px rgba(34,197,94,0.35)",
                      }}
                    >
                      ATTACK DEFENDED
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDismiss}
                  data-ocid="analyst_notification.close_button"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-green-500/60 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Attack name */}
              <div
                className="rounded-lg px-4 py-3 mb-4"
                style={{
                  background: "rgba(34,197,94,0.07)",
                  border: "1px solid rgba(34,197,94,0.2)",
                }}
              >
                <p className="font-mono text-sm text-green-300 tracking-wide">
                  <span className="text-green-500/60 mr-2">&gt;</span>
                  {attack.name}
                </p>
                <p className="font-mono text-xs text-green-400/60 mt-1">
                  Alert resolved — threat vector blocked and logged.
                </p>
              </div>

              {/* Countdown bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-mono text-xs text-green-500/50 tracking-widest">
                    AUTO-DISMISS
                  </span>
                  <span className="font-mono text-xs font-bold text-green-400/70">
                    IN {remaining}s
                  </span>
                </div>
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{ background: "rgba(34,197,94,0.12)" }}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-1000 ease-linear"
                    style={{
                      width: `${progress}%`,
                      background:
                        "linear-gradient(90deg, #15803d, #22c55e, #4ade80)",
                      boxShadow: "0 0 6px rgba(34,197,94,0.7)",
                    }}
                  />
                </div>
              </div>

              {/* Dismiss button */}
              <button
                type="button"
                onClick={handleDismiss}
                data-ocid="analyst_notification.confirm_button"
                className="w-full py-2 rounded-lg font-mono text-sm font-bold tracking-widest uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.99]"
                style={{
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.35)",
                  color: "#4ade80",
                }}
              >
                DISMISS
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { AlertTriangle, Ban, ShieldAlert, X, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { playAlarmSound } from "../hooks/useSoundEffect";
import type { BlockedIp } from "../types";

interface AttackInfo {
  name: string;
  severity: string;
  signal: string;
  city?: string;
  attackerIp?: string;
}

interface AttackAlertPopupProps {
  attack: AttackInfo | null;
  onDismiss: () => void;
  blockedIps?: BlockedIp[];
  onBlockIp?: (ip: string, reason: string, blockedBy: string) => void;
  currentUserEmail?: string;
}

const DURATION = 90;

export default function AttackAlertPopup({
  attack,
  onDismiss,
  blockedIps = [],
  onBlockIp,
  currentUserEmail = "admin@combodefense.local",
}: AttackAlertPopupProps) {
  const [remaining, setRemaining] = useState(DURATION);
  const [glitch, setGlitch] = useState(false);
  const [justBlocked, setJustBlocked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const glitchRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const handleDismiss = useCallback(() => {
    onDismissRef.current();
    setJustBlocked(false);
  }, []);

  useEffect(() => {
    if (!attack) {
      setRemaining(DURATION);
      setJustBlocked(false);
      return;
    }

    setRemaining(DURATION);
    setJustBlocked(false);
    playAlarmSound();

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

    glitchRef.current = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 150);
    }, 2000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (glitchRef.current) clearInterval(glitchRef.current);
    };
  }, [attack]);

  const progress = (remaining / DURATION) * 100;

  const severityColorMap: Record<string, string> = {
    critical: "text-red-500 bg-red-500/10 border-red-500/50",
    high: "text-orange-400 bg-orange-400/10 border-orange-400/50",
    medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/50",
    low: "text-green-400 bg-green-400/10 border-green-400/50",
  };
  const severityColor =
    severityColorMap[attack?.severity ?? "high"] ??
    "text-orange-400 bg-orange-400/10 border-orange-400/50";

  const isAlreadyBlocked =
    attack?.attackerIp != null &&
    blockedIps.some((b) => b.ip === attack.attackerIp);

  const handleBlockIp = () => {
    if (!attack?.attackerIp || !onBlockIp) return;
    onBlockIp(
      attack.attackerIp,
      `Auto-alert: ${attack.name}${attack.city ? ` from ${attack.city}` : ""}`,
      currentUserEmail,
    );
    setJustBlocked(true);
  };

  return (
    <AnimatePresence>
      {attack && (
        <motion.div
          key="attack-alert-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4"
          data-ocid="attack_alert.modal"
          style={{
            background: "rgba(0,0,0,0.88)",
            backdropFilter: "blur(4px)",
          }}
        >
          {/* Scan lines overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,0,0,0.03) 2px, rgba(255,0,0,0.03) 4px)",
              backgroundSize: "100% 4px",
            }}
          />

          <motion.div
            key="attack-alert-card"
            initial={{ y: -80, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -80, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="relative w-full max-w-lg rounded-xl overflow-hidden attack-popup-card"
          >
            {/* Top accent bar */}
            <div className="w-full h-1 attack-bar-slide" />

            <div className="p-6">
              {/* Header row */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center w-14 h-14 rounded-full attack-icon-pulse">
                    <ShieldAlert className="w-7 h-7 text-red-500" />
                    <span className="absolute inset-0 rounded-full attack-ring-1" />
                    <span className="absolute inset-0 rounded-full attack-ring-2" />
                  </div>

                  <div>
                    <div className="text-xs font-mono tracking-[0.25em] text-red-400 mb-1 opacity-80">
                      &#9888; SECURITY BREACH
                    </div>
                    <h2
                      className={`text-2xl font-mono font-bold tracking-widest text-red-500 ${
                        glitch ? "attack-glitch" : ""
                      }`}
                      style={{
                        textShadow:
                          "0 0 20px rgba(220,30,30,0.8), 0 0 40px rgba(220,30,30,0.4)",
                        letterSpacing: "0.2em",
                      }}
                    >
                      ATTACK DETECTED
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDismiss}
                  data-ocid="attack_alert.close_button"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Attack details */}
              <div
                className="rounded-lg p-4 mb-4"
                style={{
                  background: "rgba(220,30,30,0.07)",
                  border: "1px solid rgba(220,30,30,0.2)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-400" />
                    <span className="font-mono text-sm text-orange-300 font-semibold tracking-wide">
                      {attack.name}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-xs font-bold uppercase px-2 py-1 rounded border tracking-widest ${severityColor}`}
                  >
                    {attack.severity}
                  </span>
                </div>
                <div className="flex items-start gap-2 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" />
                  <p className="font-mono text-xs text-yellow-300/80 leading-relaxed">
                    {attack.signal}
                  </p>
                </div>
                {attack.city && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs">📍</span>
                    <p className="font-mono text-xs text-orange-300/80">
                      {attack.city}, India
                    </p>
                  </div>
                )}
                {attack.attackerIp && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs">🖥</span>
                    <p className="font-mono text-xs text-orange-300/80">
                      {attack.attackerIp}
                    </p>
                  </div>
                )}
              </div>

              {/* IP Block Button */}
              {attack.attackerIp && onBlockIp && (
                <div className="mb-4">
                  {isAlreadyBlocked || justBlocked ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded border border-green-500/30 bg-green-500/5">
                      <Ban className="w-3.5 h-3.5 text-green-400" />
                      <span className="font-mono text-xs text-green-400 tracking-widest">
                        IP {attack.attackerIp} IS BLOCKED
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleBlockIp}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded border border-red-500/50 text-red-400 font-mono text-xs font-bold tracking-widest hover:bg-red-500/10 transition-colors"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      BLOCK ATTACKER IP: {attack.attackerIp}
                    </button>
                  )}
                </div>
              )}

              {/* Countdown bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-xs text-red-400/70 tracking-widest">
                    AUTO-DISMISS
                  </span>
                  <span className="font-mono text-xs font-bold text-red-400">
                    IN {remaining}s
                  </span>
                </div>
                <div
                  className="w-full h-2 rounded-full overflow-hidden"
                  style={{ background: "rgba(220,30,30,0.15)" }}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-1000 ease-linear"
                    style={{
                      width: `${progress}%`,
                      background:
                        "linear-gradient(90deg, #991b1b, #dc2626, #ef4444)",
                      boxShadow: "0 0 8px rgba(220,38,38,0.8)",
                    }}
                  />
                </div>
              </div>

              {/* Dismiss button */}
              <button
                type="button"
                onClick={handleDismiss}
                data-ocid="attack_alert.confirm_button"
                className="w-full py-2.5 rounded-lg font-mono text-sm font-bold tracking-widest uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.99] attack-dismiss-btn"
              >
                DISMISS ALERT
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

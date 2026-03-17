import { Progress } from "@/components/ui/progress";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const SCAN_LINES = [
  { id: "init", text: "Initializing threat scanner...", delay: 0 },
  { id: "creds", text: "Scanning login credentials...", delay: 400 },
  { id: "sqli", text: "Checking for SQL injection patterns...", delay: 800 },
  { id: "token", text: "Scanning session token...", delay: 1200 },
  { id: "brute", text: "Checking brute-force indicators...", delay: 1600 },
  { id: "xss", text: "Cross-site scripting check...", delay: 2000 },
  { id: "priv", text: "Privilege escalation scan...", delay: 2400 },
  {
    id: "done",
    text: ">> SCAN COMPLETE — COMPILING ATTACK REPORT...",
    delay: 2900,
    highlight: true,
  },
];

const DETECTED_ATTACKS = [
  {
    id: 1,
    type: "SQL Injection",
    severity: "CRITICAL",
    detail: "UNION-based SQLi detected in login parameter",
    color: "text-red-400",
    border: "border-red-500/40",
  },
  {
    id: 2,
    type: "Brute Force",
    severity: "HIGH",
    detail: "12 failed login attempts from 192.168.1.45 in 60s",
    color: "text-orange-400",
    border: "border-orange-500/40",
  },
  {
    id: 3,
    type: "XSS Attempt",
    severity: "MEDIUM",
    detail: "Script injection in user-agent header",
    color: "text-yellow-400",
    border: "border-yellow-500/40",
  },
  {
    id: 4,
    type: "Session Hijack",
    severity: "HIGH",
    detail: "Suspicious token reuse from different IP",
    color: "text-orange-400",
    border: "border-orange-500/40",
  },
  {
    id: 5,
    type: "Privilege Escalation",
    severity: "MEDIUM",
    detail: "Unauthorized access to admin endpoint attempted",
    color: "text-yellow-400",
    border: "border-yellow-500/40",
  },
];

interface ScanPageProps {
  onScanComplete: () => void;
}

export default function ScanPage({ onScanComplete }: ScanPageProps) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const start = Date.now();
    const duration = 3500;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);
      if (pct >= 100) clearInterval(interval);
    }, 30);

    const timers: ReturnType<typeof setTimeout>[] = SCAN_LINES.map((line, i) =>
      setTimeout(() => setVisibleLines(i + 1), line.delay),
    );

    const showResultsTimer = setTimeout(() => setShowResults(true), 3600);

    return () => {
      clearInterval(interval);
      timers.forEach(clearTimeout);
      clearTimeout(showResultsTimer);
    };
  }, []);

  useEffect(() => {
    if (!showResults) return;
    if (countdown <= 0) {
      onScanComplete();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [showResults, countdown, onScanComplete]);

  const hackingBg = "/assets/generated/hacking-bg.dim_1920x1080.jpg";

  if (showResults) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        style={{
          backgroundImage: `url(${hackingBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/75" />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.78 0.14 193) 1px, transparent 1px), linear-gradient(90deg, oklch(0.78 0.14 193) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 w-full max-w-2xl px-6"
        >
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              <span className="font-mono text-xs text-destructive tracking-widest uppercase">
                Threats Detected
              </span>
              <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            </div>
            <h1 className="font-mono text-2xl font-bold text-destructive tracking-widest uppercase drop-shadow-[0_0_12px_rgba(255,50,50,0.6)]">
              ATTACK DETECTION REPORT
            </h1>
            <p className="font-mono text-xs text-muted-foreground mt-1">
              {DETECTED_ATTACKS.length} attacks identified — entering dashboard
              in <span className="text-primary font-bold">{countdown}s</span>
            </p>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {DETECTED_ATTACKS.map((attack, i) => (
                <motion.div
                  key={attack.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.12, duration: 0.3 }}
                  className={`bg-black/70 border ${attack.border} rounded-lg px-5 py-3 flex items-center justify-between backdrop-blur-sm`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${attack.color.replace("text-", "bg-")} shrink-0`}
                    />
                    <div>
                      <div
                        className={`font-mono text-sm font-semibold ${attack.color}`}
                      >
                        {attack.type}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {attack.detail}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${attack.color} ${attack.border}`}
                  >
                    {attack.severity}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-5">
            <div className="flex justify-between mb-1">
              <span className="font-mono text-xs text-muted-foreground">
                Auto-entering dashboard
              </span>
              <span className="font-mono text-xs text-primary">
                {countdown}s
              </span>
            </div>
            <Progress
              value={(countdown / 10) * 100}
              className="h-1.5 bg-secondary [&>div]:bg-primary [&>div]:transition-all [&>div]:duration-1000"
            />
          </div>

          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={onScanComplete}
              className="font-mono text-sm font-bold px-8 py-2.5 rounded border border-primary text-primary hover:bg-primary hover:text-black transition-colors tracking-widest uppercase"
            >
              CLOSE REPORT
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        backgroundImage: `url(${hackingBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/80" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.78 0.14 193) 1px, transparent 1px), linear-gradient(90deg, oklch(0.78 0.14 193) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-full max-w-2xl px-6"
      >
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
              Security Scan Protocol
            </span>
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          </div>
          <h1 className="font-mono text-3xl font-bold text-primary tracking-widest uppercase drop-shadow-[0_0_16px_rgba(0,255,150,0.5)]">
            SCANNING SYSTEM...
          </h1>
        </div>

        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="font-mono text-xs text-muted-foreground">
              Scan progress
            </span>
            <span className="font-mono text-xs text-primary">{progress}%</span>
          </div>
          <Progress
            value={progress}
            className="h-2 bg-secondary [&>div]:bg-primary [&>div]:transition-all [&>div]:duration-100"
          />
        </div>

        <div className="bg-black/70 border border-border rounded-lg p-6 font-mono text-sm min-h-[280px] backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <div className="w-3 h-3 rounded-full bg-[oklch(0.82_0.19_95)]" />
            <div className="w-3 h-3 rounded-full bg-[oklch(0.72_0.18_143)]" />
            <span className="ml-2 text-xs text-muted-foreground">
              threat-scanner v2.1.0
            </span>
          </div>

          <div className="space-y-1.5">
            <AnimatePresence>
              {SCAN_LINES.slice(0, visibleLines).map((line) => (
                <motion.div
                  key={line.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-start gap-2 ${
                    line.highlight
                      ? "text-destructive font-semibold"
                      : "text-foreground"
                  }`}
                >
                  <span className="text-muted-foreground shrink-0">$</span>
                  <span>{line.text}</span>
                </motion.div>
              ))}
            </AnimatePresence>

            {visibleLines < SCAN_LINES.length && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <span className="inline-block w-2 h-4 bg-primary animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

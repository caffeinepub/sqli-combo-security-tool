import { Activity, Bell, Radio, Shield } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AttackEvent, ScannerEvent, ThreatPoint } from "../types";

interface DashboardPageProps {
  threatLevel: number;
  openAlerts: number;
  blockedAttempts: number;
  simulatedAttacks: number;
  threatTrend: ThreatPoint[];
  preventionCoverage: number;
  scannerEvents?: ScannerEvent[];
  attackEvents?: AttackEvent[];
}

function StatCard({
  label,
  value,
  valueColor,
  sublabel,
}: {
  label: string;
  value: string | number;
  valueColor: string;
  sublabel?: string;
}) {
  return (
    <div className="bg-card border border-border rounded p-4 flex flex-col gap-1">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={`text-3xl font-mono font-bold ${valueColor}`}>{value}</p>
      {sublabel && (
        <p className="text-[10px] text-muted-foreground font-mono">
          {sublabel}
        </p>
      )}
    </div>
  );
}

type ScanStatus = "OK" | "CLEAR" | "FLAGGED" | "BLOCKED" | "WARNING";

interface ScanEntry {
  id: number;
  timestamp: string;
  message: string;
  status: ScanStatus;
  isRealEvent?: boolean;
}

const SCAN_POOL: { message: string; status: ScanStatus }[] = [
  { message: "Scanning 192.168.1.1", status: "OK" },
  { message: "Checking SQL injection vectors", status: "CLEAR" },
  { message: "Probing XSS entry points", status: "FLAGGED" },
  { message: "Brute-force pattern analysis", status: "CLEAR" },
  { message: "Session token integrity check", status: "OK" },
  { message: "Privilege escalation probe", status: "WARNING" },
  { message: "Scanning 10.0.0.254", status: "OK" },
  { message: "CSRF header validation", status: "CLEAR" },
  { message: "Directory traversal check", status: "BLOCKED" },
  { message: "Open redirect detection", status: "CLEAR" },
  { message: "Scanning 172.16.0.1", status: "OK" },
  { message: "RCE payload inspection", status: "FLAGGED" },
  { message: "HTTP header injection scan", status: "CLEAR" },
  { message: "Command injection pattern check", status: "WARNING" },
  { message: "DNS rebinding probe", status: "OK" },
  { message: "JWT token tampering analysis", status: "CLEAR" },
  { message: "SSRF vector enumeration", status: "BLOCKED" },
  { message: "XML entity injection check", status: "CLEAR" },
  { message: "Scanning 192.168.0.100", status: "OK" },
  { message: "Path traversal fingerprint", status: "WARNING" },
];

const BLIP_DOTS = [
  { id: "b1", x: 15, y: 30, delay: 0 },
  { id: "b2", x: 55, y: 60, delay: 0.4 },
  { id: "b3", x: 75, y: 20, delay: 0.8 },
  { id: "b4", x: 35, y: 80, delay: 1.2 },
  { id: "b5", x: 85, y: 55, delay: 1.6 },
  { id: "b6", x: 45, y: 45, delay: 2.0 },
];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatTs(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

const STATUS_STYLES: Record<ScanStatus, string> = {
  OK: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
  CLEAR: "text-green-400 border-green-400/40 bg-green-400/10",
  FLAGGED: "text-red-400 border-red-400/40 bg-red-400/10",
  BLOCKED: "text-cyan-400 border-cyan-400/40 bg-cyan-400/10",
  WARNING: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
};

const MSG_COLORS: Record<ScanStatus, string> = {
  OK: "text-emerald-300",
  CLEAR: "text-green-300",
  FLAGGED: "text-red-300",
  BLOCKED: "text-cyan-300",
  WARNING: "text-yellow-300",
};

const MAX_ENTRIES = 12;

function LiveScanner({ externalEvents }: { externalEvents?: ScannerEvent[] }) {
  const [entries, setEntries] = useState<ScanEntry[]>([]);
  const [progress, setProgress] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  const poolIndexRef = useRef(0);
  const secondsRef = useRef(0);
  const prevExternalLengthRef = useRef(0);
  const [flashIds, setFlashIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      secondsRef.current += 2;
      const idx = poolIndexRef.current % SCAN_POOL.length;
      poolIndexRef.current += 1;
      const item = SCAN_POOL[idx];
      const newEntry: ScanEntry = {
        id: Date.now(),
        timestamp: formatTs(secondsRef.current),
        message: item.message,
        status: item.status,
      };
      setEntries((prev) => {
        const next = [...prev, newEntry];
        const trimmed =
          next.length > MAX_ENTRIES
            ? next.slice(next.length - MAX_ENTRIES)
            : next;
        requestAnimationFrame(() => {
          if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
          }
        });
        return trimmed;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!externalEvents || externalEvents.length === 0) return;
    if (externalEvents.length <= prevExternalLengthRef.current) return;

    const newEvents = externalEvents.slice(prevExternalLengthRef.current);
    prevExternalLengthRef.current = externalEvents.length;

    const injected: ScanEntry[] = newEvents.map((ev) => ({
      id: ev.id,
      timestamp: ev.timestamp,
      message: ev.message,
      status: "FLAGGED" as ScanStatus,
      isRealEvent: true,
    }));

    setEntries((prev) => {
      const combined = [...prev, ...injected];
      const trimmed =
        combined.length > MAX_ENTRIES
          ? combined.slice(combined.length - MAX_ENTRIES)
          : combined;
      requestAnimationFrame(() => {
        if (logRef.current) {
          logRef.current.scrollTop = logRef.current.scrollHeight;
        }
      });
      return trimmed;
    });

    const newIds = new Set(injected.map((e) => e.id));
    setFlashIds((prev) => new Set([...prev, ...newIds]));
    setTimeout(() => {
      setFlashIds((prev) => {
        const next = new Set(prev);
        for (const id of newIds) next.delete(id);
        return next;
      });
    }, 1200);
  }, [externalEvents]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => (p >= 100 ? 0 : p + 1));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="bg-card border border-border rounded p-4 mt-4"
      data-ocid="dashboard.scanner.panel"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-0.5">
            LIVE FEED
          </p>
          <p className="text-sm font-mono font-bold uppercase tracking-wide text-foreground">
            REAL-TIME SCANNER
          </p>
        </div>
        <div className="flex items-center gap-2 border border-emerald-500/40 bg-emerald-500/10 rounded px-3 py-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <Radio size={11} className="text-emerald-400" />
          <span className="text-[10px] font-mono text-emerald-400 tracking-widest">
            SCANNING...
          </span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <div
          className="col-span-2 relative rounded overflow-hidden border border-border"
          style={{ height: 220, background: "oklch(0.09 0.012 248)" }}
        >
          <svg
            aria-hidden="true"
            className="absolute inset-0 w-full h-full opacity-20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="scanner-grid"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 20 0 L 0 0 0 20"
                  fill="none"
                  stroke="#00d4d4"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#scanner-grid)" />
          </svg>

          {[20, 40, 60, 80].map((x) => (
            <div
              key={x}
              className="absolute top-0 bottom-0 w-px opacity-10"
              style={{ left: `${x}%`, background: "#00d4d4" }}
            />
          ))}

          <div className="scan-sweep-line" />

          <div className="absolute top-2 left-2 text-[9px] font-mono text-emerald-400/60 tracking-widest">
            NET::SCAN
          </div>
          <div className="absolute bottom-2 right-2 text-[9px] font-mono text-cyan-400/50 tracking-widest">
            LIVE
          </div>

          {BLIP_DOTS.map((dot) => (
            <div
              key={dot.id}
              className="absolute rounded-full bg-emerald-400 blip-pulse"
              style={{
                left: `${dot.x}%`,
                top: `${dot.y}%`,
                width: 5,
                height: 5,
                animationDelay: `${dot.delay}s`,
              }}
            />
          ))}
        </div>

        <div className="col-span-3 flex flex-col">
          <div
            ref={logRef}
            className="flex-1 overflow-y-auto space-y-1 pr-1 scanner-log"
            style={{ height: 200 }}
          >
            {entries.length === 0 && (
              <p className="text-[11px] font-mono text-muted-foreground animate-pulse">
                Initializing scanner...
              </p>
            )}
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center gap-2 text-[11px] font-mono leading-relaxed rounded ${
                  flashIds.has(entry.id) ? "scanner-event-flash" : ""
                }`}
              >
                <span className="text-muted-foreground shrink-0">
                  [{entry.timestamp}]
                </span>
                {entry.isRealEvent && (
                  <span className="shrink-0 text-red-500 font-bold text-[10px]">
                    [ATTACK]
                  </span>
                )}
                <span
                  className={`flex-1 truncate ${
                    entry.isRealEvent
                      ? "text-red-400 font-semibold"
                      : MSG_COLORS[entry.status]
                  }`}
                >
                  {entry.message}
                  {!entry.isRealEvent && " ..."}
                </span>
                <span
                  className={`shrink-0 text-[9px] border rounded px-1.5 py-0.5 tracking-widest font-bold ${
                    STATUS_STYLES[entry.status]
                  }`}
                >
                  {entry.status}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-mono text-muted-foreground tracking-widest">
                SCAN PROGRESS
              </span>
              <span className="text-[9px] font-mono text-cyan-400">
                {progress}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${progress}%`,
                  background:
                    "linear-gradient(90deg, oklch(0.72 0.2 182), oklch(0.75 0.18 220))",
                  boxShadow: "0 0 8px oklch(0.72 0.2 182 / 0.7)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ML Anomaly Panel ────────────────────────────────────────────────────────

type AnomalyStatus = "NORMAL" | "ANOMALOUS" | "CRITICAL";

interface AnomalyPoint {
  time: string;
  score: number;
  status: AnomalyStatus;
}

const TFIDF_FEATURES = [
  { keyword: "sql_union_select", weight: 0.94 },
  { keyword: "xss_script_tag", weight: 0.87 },
  { keyword: "csrf_token_missing", weight: 0.76 },
  { keyword: "cmd_injection", weight: 0.71 },
  { keyword: "path_traversal", weight: 0.65 },
  { keyword: "brute_force_pattern", weight: 0.58 },
];

function getAnomalyStatus(score: number): AnomalyStatus {
  if (score < 30) return "NORMAL";
  if (score <= 70) return "ANOMALOUS";
  return "CRITICAL";
}

function makeTimeLabel() {
  const now = new Date();
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
}

function MLAnomalyPanel() {
  const [dataPoints, setDataPoints] = useState<AnomalyPoint[]>(() => {
    const pts: AnomalyPoint[] = [];
    let score = 45;
    for (let i = 0; i < 20; i++) {
      score = Math.min(95, Math.max(5, score + (Math.random() * 30 - 15)));
      pts.push({
        time: `T-${20 - i}`,
        score: Math.round(score),
        status: getAnomalyStatus(score),
      });
    }
    return pts;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setDataPoints((prev) => {
        const last = prev[prev.length - 1];
        const newScore = Math.min(
          95,
          Math.max(5, last.score + (Math.random() * 30 - 15)),
        );
        const rounded = Math.round(newScore);
        const next: AnomalyPoint = {
          time: makeTimeLabel(),
          score: rounded,
          status: getAnomalyStatus(rounded),
        };
        const updated = [...prev.slice(1), next];
        return updated;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const current = dataPoints[dataPoints.length - 1];
  const statusColor =
    current.status === "NORMAL"
      ? "text-emerald-400 border-emerald-400/40 bg-emerald-400/10"
      : current.status === "ANOMALOUS"
        ? "text-yellow-400 border-yellow-400/40 bg-yellow-400/10"
        : "text-red-400 border-red-400/40 bg-red-400/10";

  const dotColor =
    current.status === "NORMAL"
      ? "bg-emerald-400"
      : current.status === "ANOMALOUS"
        ? "bg-yellow-400"
        : "bg-red-400";

  return (
    <div
      className="bg-card border border-border rounded p-4 mt-4"
      data-ocid="dashboard.ml.panel"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-cyber-cyan text-[10px] font-mono">■</span>
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          ML ENGINE
        </span>
      </div>
      <p className="text-sm font-mono font-bold uppercase tracking-wide text-foreground mb-4">
        MACHINE LEARNING ANALYSIS
      </p>

      <div className="grid grid-cols-5 gap-4">
        {/* Left: anomaly graph (60%) */}
        <div className="col-span-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                ML ANOMALY DETECTION
              </p>
              <p className="text-[9px] font-mono text-muted-foreground/60">
                XGBoost Real-Time Classifier
              </p>
            </div>
            <span
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-mono font-bold tracking-widest ${statusColor}`}
            >
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor}`}
              />
              {current.status}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart
              data={dataPoints}
              margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.22 0.01 248)"
                strokeOpacity={0.4}
              />
              <XAxis
                dataKey="time"
                tick={{
                  fill: "oklch(0.45 0 0)",
                  fontSize: 9,
                  fontFamily: "monospace",
                }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                tick={{
                  fill: "oklch(0.45 0 0)",
                  fontSize: 9,
                  fontFamily: "monospace",
                }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.13 0.012 248)",
                  border: "1px solid oklch(0.22 0.01 248)",
                  borderRadius: 4,
                  fontFamily: "monospace",
                  fontSize: 10,
                }}
                labelStyle={{ color: "oklch(0.55 0 0)" }}
                itemStyle={{ color: "#00d4d4" }}
                formatter={(v: number) => [`${v}%`, "Anomaly Score"]}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#00d4d4"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: "#00d4d4" }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Right: TF-IDF feature weights (40%) */}
        <div className="col-span-2">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">
            TF-IDF FEATURE WEIGHTS
          </p>
          <div className="space-y-2">
            {TFIDF_FEATURES.map((f) => (
              <div key={f.keyword}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-mono text-foreground/80 truncate pr-2">
                    {f.keyword}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 shrink-0">
                    {f.weight.toFixed(2)}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${f.weight * 100}%`,
                      background:
                        "linear-gradient(90deg, oklch(0.55 0.18 145), oklch(0.72 0.2 155))",
                      boxShadow: "0 0 6px oklch(0.65 0.2 150 / 0.6)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Recent Attack Details Panel ─────────────────────────────────────────────

function getSeverityBadgeStyle(severity: string): string {
  switch (severity.toLowerCase()) {
    case "critical":
      return "text-red-400 border-red-400/50 bg-red-400/10";
    case "high":
      return "text-orange-400 border-orange-400/50 bg-orange-400/10";
    case "medium":
      return "text-yellow-400 border-yellow-400/50 bg-yellow-400/10";
    case "low":
      return "text-green-400 border-green-400/50 bg-green-400/10";
    default:
      return "text-muted-foreground border-border bg-card";
  }
}

function getSourceBadgeStyle(source: string): string {
  switch (source) {
    case "auto":
      return "text-cyan-400 border-cyan-400/50 bg-cyan-400/10";
    case "manual":
      return "text-yellow-400 border-yellow-400/50 bg-yellow-400/10";
    case "replay":
      return "text-purple-400 border-purple-400/50 bg-purple-400/10";
    default:
      return "text-muted-foreground border-border";
  }
}

function formatEventTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

function RecentAttackDetailsPanel({
  attackEvents,
}: {
  attackEvents?: AttackEvent[];
}) {
  const recent = attackEvents ? [...attackEvents].slice(-5).reverse() : [];

  return (
    <div
      className="bg-card border border-border rounded p-4 mt-4"
      data-ocid="dashboard.recent_attacks.panel"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <Shield
          size={14}
          className="text-red-400"
          style={{ filter: "drop-shadow(0 0 6px oklch(0.55 0.22 25))" }}
        />
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          LIVE INTEL
        </span>
      </div>
      <p
        className="text-sm font-mono font-bold uppercase tracking-wide mb-4"
        style={{
          color: "oklch(0.72 0.2 35)",
          textShadow: "0 0 10px oklch(0.62 0.22 35 / 0.6)",
        }}
      >
        RECENT ATTACK DETAILS
      </p>

      {recent.length === 0 ? (
        <div
          className="flex items-center justify-center py-8"
          data-ocid="dashboard.recent_attacks.empty_state"
        >
          <p className="text-[11px] font-mono text-emerald-500/60 tracking-widest animate-pulse">
            ◈ NO ATTACK DATA YET — SYSTEM MONITORING ACTIVE
          </p>
        </div>
      ) : (
        <div className="space-y-3" data-ocid="dashboard.recent_attacks.list">
          {recent.map((event, idx) => (
            <div
              key={event.id}
              data-ocid={`dashboard.recent_attacks.item.${idx + 1}`}
              className="border border-border rounded p-3 flex flex-col gap-2"
              style={{
                background: "oklch(0.09 0.012 248)",
                borderLeft: `2px solid ${
                  event.severity === "critical"
                    ? "oklch(0.55 0.22 25)"
                    : event.severity === "high"
                      ? "oklch(0.65 0.18 50)"
                      : event.severity === "medium"
                        ? "oklch(0.78 0.18 80)"
                        : "oklch(0.62 0.18 145)"
                }`,
              }}
            >
              {/* Row 1: timestamp + attack name + severity + source */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                  {formatEventTimestamp(event.timestamp)}
                </span>
                <span
                  className="text-[11px] font-mono font-bold flex-1 min-w-0 truncate"
                  style={{ color: "oklch(0.72 0.18 50)" }}
                >
                  {event.name.toUpperCase()}
                </span>
                <span
                  className={`text-[9px] font-mono font-bold border rounded px-1.5 py-0.5 tracking-widest shrink-0 ${getSeverityBadgeStyle(
                    event.severity,
                  )}`}
                >
                  {event.severity.toUpperCase()}
                </span>
                <span
                  className={`text-[9px] font-mono font-bold border rounded px-1.5 py-0.5 tracking-widest shrink-0 ${getSourceBadgeStyle(
                    event.source,
                  )}`}
                >
                  {event.source.toUpperCase()}
                </span>
              </div>

              {/* Row 2: IP + city + attack type */}
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                  <span>🖥</span>
                  <span className="text-foreground/70">{event.attackerIp}</span>
                </span>
                <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                  <span>📍</span>
                  <span className="text-foreground/70">
                    {event.city
                      ? event.city.includes("India") || event.city.includes(",")
                        ? event.city
                        : `${event.city}, India`
                      : "Unknown"}
                  </span>
                </span>
                <span className="text-[10px] font-mono text-muted-foreground/60 truncate">
                  {event.attackType}
                </span>
              </div>

              {/* Row 3: website target if present */}
              {event.websiteName && (
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-mono font-bold tracking-widest"
                    style={{ color: "oklch(0.72 0.2 182)" }}
                  >
                    TARGET: {event.websiteName}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage({
  threatLevel,
  openAlerts,
  blockedAttempts,
  simulatedAttacks,
  threatTrend,
  preventionCoverage,
  scannerEvents,
  attackEvents,
}: DashboardPageProps) {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
          <span className="text-cyber-cyan">■</span>
          <span>DASHBOARD</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bell size={16} />
          </button>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Activity size={16} />
          </button>
        </div>
      </div>

      <p className="text-[10px] font-mono uppercase tracking-widest text-cyber-cyan mb-1">
        MISSION CONTROL
      </p>
      <h1 className="text-2xl font-mono font-bold uppercase tracking-wide text-foreground mb-2">
        LIVE THREAT DASHBOARD
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Real-time visibility into active threats, blocked attempts, and
        prevention coverage across all simulated vectors.
      </p>

      {/* Stats */}
      <div
        className="grid grid-cols-4 gap-4 mb-6"
        data-ocid="dashboard.stats.panel"
      >
        <StatCard
          label="THREAT LEVEL"
          value={`${threatLevel}%`}
          valueColor="text-cyber-red"
          sublabel="Current risk score"
        />
        <StatCard
          label="ACTIVE ALERTS"
          value={openAlerts}
          valueColor="text-cyber-yellow"
          sublabel="Awaiting triage"
        />
        <StatCard
          label="BLOCKED ATTEMPTS"
          value={blockedAttempts}
          valueColor="text-foreground"
          sublabel="Resolved detections"
        />
        <StatCard
          label="SIMULATED ATTACKS"
          value={simulatedAttacks}
          valueColor="text-foreground"
          sublabel="Total replays run"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Threat Trend */}
        <div className="col-span-2 bg-card border border-border rounded p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
            LIVE FEED
          </p>
          <p className="text-sm font-mono font-bold uppercase tracking-wide text-foreground mb-4">
            THREAT TREND
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart
              data={threatTrend}
              margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.22 0.01 248)"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="time"
                tick={{
                  fill: "oklch(0.55 0 0)",
                  fontSize: 10,
                  fontFamily: "monospace",
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fill: "oklch(0.55 0 0)",
                  fontSize: 10,
                  fontFamily: "monospace",
                }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.13 0.012 248)",
                  border: "1px solid oklch(0.22 0.01 248)",
                  borderRadius: 4,
                  fontFamily: "monospace",
                  fontSize: 11,
                }}
                labelStyle={{ color: "oklch(0.55 0 0)" }}
                itemStyle={{ color: "#00d4d4" }}
              />
              <Line
                type="monotone"
                dataKey="level"
                stroke="#00d4d4"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#00d4d4" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Prevention Coverage */}
        <div className="bg-card border border-border rounded p-4 flex flex-col">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
            HARDENING STATUS
          </p>
          <p className="text-sm font-mono font-bold uppercase tracking-wide text-foreground mb-4">
            PREVENTION COVERAGE
          </p>
          <div className="flex-1 flex flex-col items-center justify-center">
            <p className="text-5xl font-mono font-bold text-cyber-cyan mb-2">
              {preventionCoverage}%
            </p>
            <p className="text-[10px] font-mono text-muted-foreground mb-4">
              TASKS COMPLETED
            </p>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-cyber-cyan h-2 rounded-full transition-all duration-500"
                style={{ width: `${preventionCoverage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Scanner */}
      <LiveScanner externalEvents={scannerEvents} />

      {/* ML Anomaly Panel */}
      <MLAnomalyPanel />

      {/* Recent Attack Details Panel */}
      <RecentAttackDetailsPanel attackEvents={attackEvents} />
    </div>
  );
}

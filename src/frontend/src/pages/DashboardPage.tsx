import {
  Activity,
  Bell,
  Brain,
  ChevronDown,
  ChevronUp,
  Radio,
  RefreshCw,
  Shield,
  TrendingUp,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  AttackEvent,
  IpStats,
  RetrainingCase,
  ScannerEvent,
  ThreatPoint,
} from "../types";

interface DashboardPageProps {
  threatLevel: number;
  openAlerts: number;
  blockedAttempts: number;
  simulatedAttacks: number;
  threatTrend: ThreatPoint[];
  preventionCoverage: number;
  scannerEvents?: ScannerEvent[];
  attackEvents?: AttackEvent[];
  retrainingQueue?: RetrainingCase[];
  onRetrainModel?: () => void;
  modelVersion?: string;
  ipAttackCounts?: Record<string, IpStats>;
  isRetraining?: boolean;
}

function StatCard({
  label,
  value,
  valueColor,
  sublabel,
  sparkData,
}: {
  label: string;
  value: string | number;
  valueColor: string;
  sublabel?: string;
  sparkData?: number[];
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
      {sparkData && sparkData.length > 1 && (
        <div className="flex items-end gap-0.5 mt-1" style={{ height: 20 }}>
          {sparkData.map((v, i) => {
            const max = Math.max(...sparkData, 1);
            return (
              <div
                key={`spark-${i}-${v}`}
                className="flex-1 rounded-sm transition-all duration-300"
                style={{
                  height: `${Math.round((v / max) * 100)}%`,
                  background: "oklch(0.72 0.2 182 / 0.5)",
                  minHeight: 2,
                }}
              />
            );
          })}
        </div>
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

// ─── ML Anomaly Panel ─────────────────────────────────────────────────────────────────────────────

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

// Top 8 XAI feature keywords for dashboard panel
const TOP_FEATURES = [
  { keyword: "sql_union_select", score: 0.94 },
  { keyword: "xss_script_tag", score: 0.87 },
  { keyword: "csrf_token_missing", score: 0.76 },
  { keyword: "cmd_injection", score: 0.71 },
  { keyword: "path_traversal", score: 0.65 },
  { keyword: "brute_force_pattern", score: 0.58 },
  { keyword: "onerror_handler", score: 0.52 },
  { keyword: "payload_entropy", score: 0.47 },
];

// Model metrics
const MODEL_METRICS = [
  { model: "XGBoost", accuracy: 96.2, precision: 94.8, recall: 97.1, f1: 95.9 },
  { model: "SVM", accuracy: 93.7, precision: 91.2, recall: 95.4, f1: 93.3 },
  {
    model: "Ensemble",
    accuracy: 97.8,
    precision: 96.4,
    recall: 98.2,
    f1: 97.3,
  },
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

function MLAnomalyPanel({ modelVersion }: { modelVersion?: string }) {
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
        {modelVersion && (
          <span className="ml-auto text-[9px] font-mono text-purple-400 border border-purple-500/30 rounded px-1.5 py-0.5">
            {modelVersion}
          </span>
        )}
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

// ─── Model Comparison Panel ────────────────────────────────────────────────────────────────────────
function ModelComparisonPanel() {
  return (
    <div
      className="bg-card border border-border rounded p-4 mt-4"
      data-ocid="dashboard.model_comparison.panel"
    >
      <div className="flex items-center gap-2 mb-3">
        <Brain size={14} className="text-purple-400" />
        <p className="text-sm font-mono font-bold uppercase tracking-wide text-foreground">
          MODEL COMPARISON
        </p>
        <span className="ml-auto text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-cyan-400/40 text-cyan-400 bg-cyan-400/5">
          VOTING WINNER: ENSEMBLE
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="border-b border-border">
              {["MODEL", "ACCURACY", "PRECISION", "RECALL", "F1"].map((h) => (
                <th
                  key={h}
                  className="text-left text-muted-foreground uppercase tracking-widest py-2 pr-4"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODEL_METRICS.map((m) => (
              <tr
                key={m.model}
                className={`border-b border-border/40 ${m.model === "Ensemble" ? "bg-cyan-400/5" : ""}`}
              >
                <td
                  className={`py-2 pr-4 font-bold ${m.model === "Ensemble" ? "text-cyan-400" : m.model === "XGBoost" ? "text-purple-400" : "text-blue-400"}`}
                >
                  {m.model}
                  {m.model === "Ensemble" && (
                    <span className="ml-1.5 text-[8px] border border-cyan-400/40 rounded px-1 text-cyan-300">
                      ★ BEST
                    </span>
                  )}
                </td>
                <td className="py-2 pr-4 text-emerald-400">{m.accuracy}%</td>
                <td className="py-2 pr-4 text-emerald-300">{m.precision}%</td>
                <td className="py-2 pr-4 text-emerald-300">{m.recall}%</td>
                <td className="py-2 pr-4 text-cyan-400 font-bold">{m.f1}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── XAI Top Features Panel ──────────────────────────────────────────────────────────────────────
function XAITopFeaturesPanel() {
  return (
    <div
      className="bg-card border border-border rounded p-4 mt-4"
      data-ocid="dashboard.xai_features.panel"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-emerald-400 text-[10px] font-mono">■</span>
        <p className="text-sm font-mono font-bold uppercase tracking-wide text-foreground">
          XAI — TOP ATTACK SIGNAL FEATURES
        </p>
      </div>
      <p className="text-[10px] font-mono text-muted-foreground mb-4">
        TF-IDF importance scores for top 8 keywords driving ML threat
        classification
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={TOP_FEATURES}
          layout="vertical"
          margin={{ top: 0, right: 20, bottom: 0, left: 20 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="oklch(0.22 0.01 248)"
            strokeOpacity={0.4}
            horizontal={false}
          />
          <XAxis
            type="number"
            domain={[0, 1]}
            tick={{
              fill: "oklch(0.45 0 0)",
              fontSize: 9,
              fontFamily: "monospace",
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="keyword"
            tick={{
              fill: "oklch(0.65 0 0)",
              fontSize: 9,
              fontFamily: "monospace",
            }}
            axisLine={false}
            tickLine={false}
            width={140}
          />
          <Tooltip
            contentStyle={{
              background: "oklch(0.13 0.012 248)",
              border: "1px solid oklch(0.22 0.01 248)",
              borderRadius: 4,
              fontFamily: "monospace",
              fontSize: 10,
            }}
            formatter={(v: number) => [v.toFixed(3), "TF-IDF Score"]}
          />
          <Bar
            dataKey="score"
            fill="oklch(0.72 0.2 145)"
            radius={[0, 3, 3, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── AI Retraining Panel ───────────────────────────────────────────────────────────────────────────
function AIRetrainingPanel({
  queue,
  onRetrain,
  modelVersion,
  isRetraining,
}: {
  queue: RetrainingCase[];
  onRetrain: () => void;
  modelVersion: string;
  isRetraining: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const lastRetrainRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isRetraining) {
      lastRetrainRef.current = new Date().toLocaleTimeString();
    }
  }, [isRetraining]);

  return (
    <div
      className="bg-card border border-border rounded p-4 mt-4"
      data-ocid="dashboard.retraining.panel"
    >
      <button
        type="button"
        className="w-full flex items-center gap-2"
        onClick={() => setExpanded((v) => !v)}
      >
        <RefreshCw size={14} className="text-orange-400" />
        <p className="text-sm font-mono font-bold uppercase tracking-wide text-foreground flex-1 text-left">
          AI RETRAINING CENTER
        </p>
        {queue.length > 0 && (
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-400/20 text-orange-400 border border-orange-400/40">
            {queue.length} QUEUED
          </span>
        )}
        <span className="text-[9px] font-mono text-purple-400 border border-purple-400/30 rounded px-1.5 py-0.5 ml-2">
          {modelVersion}
        </span>
        {expanded ? (
          <ChevronUp size={14} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={14} className="text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-mono text-muted-foreground">
                Last retrain: {lastRetrainRef.current ?? "Never"}
              </p>
              <p className="text-[10px] font-mono text-muted-foreground">
                Queue: {queue.length} case{queue.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={onRetrain}
              disabled={isRetraining || queue.length === 0}
              data-ocid="dashboard.retrain.button"
              className="flex items-center gap-2 px-3 py-1.5 rounded border font-mono text-[11px] font-bold tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-orange-400/50 text-orange-400 hover:bg-orange-400/10"
            >
              <RefreshCw
                size={11}
                className={isRetraining ? "animate-spin" : ""}
              />
              {isRetraining ? "RETRAINING..." : "🔄 RETRAIN MODEL"}
            </button>
          </div>

          {isRetraining && (
            <div className="mb-3">
              <div className="h-1.5 rounded bg-secondary overflow-hidden">
                <div
                  className="h-full rounded bg-orange-400 transition-all duration-300 animate-pulse"
                  style={{ width: "100%" }}
                />
              </div>
              <p className="text-[9px] font-mono text-orange-400 mt-1 animate-pulse">
                TRAINING IN PROGRESS...
              </p>
            </div>
          )}

          {queue.length === 0 ? (
            <p
              className="text-[10px] font-mono text-muted-foreground text-center py-4"
              data-ocid="dashboard.retraining.empty_state"
            >
              No cases queued — mark alerts as FP/FN from the Detect page
            </p>
          ) : (
            <div className="space-y-2" data-ocid="dashboard.retraining.list">
              {queue.map((c, idx) => (
                <div
                  key={c.id}
                  data-ocid={`dashboard.retraining.item.${idx + 1}`}
                  className="flex items-center gap-3 px-3 py-2 rounded border border-border bg-secondary/20"
                >
                  <span
                    className={`text-[9px] font-mono font-bold border rounded px-1.5 py-0.5 ${
                      c.label === "FP"
                        ? "text-yellow-400 border-yellow-400/40 bg-yellow-400/10"
                        : "text-red-400 border-red-400/40 bg-red-400/10"
                    }`}
                  >
                    {c.label}
                  </span>
                  <span className="text-[10px] font-mono text-foreground/70 flex-1 truncate">
                    {c.attackType}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground shrink-0">
                    {new Date(c.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── System Risk Score Gauge ──────────────────────────────────────────────────────────────────────

function getRiskLabel(score: number): {
  label: string;
  color: string;
  glow: string;
} {
  if (score <= 25)
    return {
      label: "LOW",
      color: "text-green-400",
      glow: "oklch(0.62 0.18 145)",
    };
  if (score <= 50)
    return {
      label: "MEDIUM",
      color: "text-yellow-400",
      glow: "oklch(0.78 0.18 80)",
    };
  if (score <= 75)
    return {
      label: "HIGH",
      color: "text-orange-400",
      glow: "oklch(0.65 0.18 50)",
    };
  return {
    label: "CRITICAL",
    color: "text-red-400",
    glow: "oklch(0.55 0.22 25)",
  };
}

function SystemRiskGauge({ score }: { score: number }) {
  const risk = getRiskLabel(score);
  const barColor =
    score > 75
      ? "linear-gradient(90deg, oklch(0.55 0.22 25), oklch(0.65 0.2 30))"
      : score > 50
        ? "linear-gradient(90deg, oklch(0.65 0.18 50), oklch(0.72 0.16 60))"
        : score > 25
          ? "linear-gradient(90deg, oklch(0.72 0.18 80), oklch(0.78 0.16 90))"
          : "linear-gradient(90deg, oklch(0.55 0.18 145), oklch(0.65 0.16 155))";

  return (
    <div
      className="bg-card border border-border rounded p-4 mt-4"
      data-ocid="dashboard.risk_gauge.panel"
    >
      <div className="flex items-center gap-2 mb-3">
        <Shield size={14} className="text-red-400" />
        <p className="text-sm font-mono font-bold uppercase tracking-wide text-foreground">
          SYSTEM RISK SCORE
        </p>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center">
          <p
            className={`text-5xl font-mono font-bold ${risk.color}`}
            style={{ textShadow: `0 0 20px ${risk.glow}` }}
          >
            {score}
          </p>
          <p
            className={`text-xs font-mono font-bold tracking-widest mt-1 ${risk.color}`}
          >
            {risk.label}
          </p>
        </div>
        <div className="flex-1">
          <div className="w-full h-3 rounded bg-secondary overflow-hidden mb-2">
            <div
              className="h-full rounded transition-all duration-700"
              style={{
                width: `${score}%`,
                background: barColor,
                boxShadow: `0 0 10px ${risk.glow} / 0.7`,
              }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
            <span className="text-green-400">LOW</span>
            <span className="text-yellow-400">MEDIUM</span>
            <span className="text-orange-400">HIGH</span>
            <span className="text-red-400">CRITICAL</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Behavioral Analysis Panel ──────────────────────────────────────────────────────────────────────

interface BehaviorEntry {
  ip: string;
  requests: number;
  reqPerMin: number;
  sessionDuration: string;
  status: "NORMAL" | "SUSPICIOUS" | "ANOMALOUS";
}

const INITIAL_BEHAVIOR: BehaviorEntry[] = [
  {
    ip: "192.168.1.101",
    requests: 23,
    reqPerMin: 1.2,
    sessionDuration: "12m 45s",
    status: "NORMAL",
  },
  {
    ip: "192.168.1.102",
    requests: 54,
    reqPerMin: 3.4,
    sessionDuration: "8m 10s",
    status: "NORMAL",
  },
  {
    ip: "192.168.1.103",
    requests: 187,
    reqPerMin: 7.8,
    sessionDuration: "24m 02s",
    status: "SUSPICIOUS",
  },
  {
    ip: "10.0.0.55",
    requests: 312,
    reqPerMin: 11.3,
    sessionDuration: "4m 30s",
    status: "SUSPICIOUS",
  },
  {
    ip: "45.227.253.11",
    requests: 88,
    reqPerMin: 2.1,
    sessionDuration: "3m 15s",
    status: "NORMAL",
  },
  {
    ip: "103.45.67.89",
    requests: 1044,
    reqPerMin: 22.4,
    sessionDuration: "47m 10s",
    status: "ANOMALOUS",
  },
];

function BehavioralAnalysisPanel() {
  const [behavior, setBehavior] = useState<BehaviorEntry[]>(INITIAL_BEHAVIOR);

  useEffect(() => {
    const interval = setInterval(() => {
      setBehavior((prev) =>
        prev.map((entry) => {
          const delta = Math.floor(Math.random() * 5) - 1;
          const newRequests = Math.max(1, entry.requests + delta);
          const newReqPerMin = Math.max(
            0.1,
            Math.round((entry.reqPerMin + (Math.random() * 0.4 - 0.2)) * 10) /
              10,
          );
          let newStatus: BehaviorEntry["status"] = "NORMAL";
          if (newReqPerMin > 15) newStatus = "ANOMALOUS";
          else if (newReqPerMin > 5) newStatus = "SUSPICIOUS";
          return {
            ...entry,
            requests: newRequests,
            reqPerMin: newReqPerMin,
            status: newStatus,
          };
        }),
      );
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const statusStyle: Record<BehaviorEntry["status"], string> = {
    NORMAL: "text-green-400 border-green-400/40 bg-green-400/10",
    SUSPICIOUS: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
    ANOMALOUS: "text-red-400 border-red-400/40 bg-red-400/10",
  };

  return (
    <div
      className="bg-card border border-border rounded p-4 mt-4"
      data-ocid="dashboard.behavioral.panel"
    >
      <div className="flex items-center gap-2 mb-1">
        <Activity size={14} className="text-cyan-400" />
        <p className="text-sm font-mono font-bold uppercase tracking-wide text-foreground">
          BEHAVIORAL ANALYSIS
        </p>
        <span className="ml-auto text-[9px] font-mono text-cyan-400/70">
          Updates every 8s
        </span>
      </div>
      <p className="text-[10px] font-mono text-muted-foreground mb-3">
        Anomaly threshold: &gt;5 req/min = SUSPICIOUS | &gt;15 req/min =
        ANOMALOUS
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="border-b border-border">
              {["IP ADDRESS", "REQUESTS", "REQ/MIN", "SESSION", "STATUS"].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left text-muted-foreground uppercase tracking-widest py-2 pr-4"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {behavior.map((entry, idx) => (
              <tr
                key={entry.ip}
                data-ocid={`dashboard.behavioral.item.${idx + 1}`}
                className="border-b border-border/40 hover:bg-secondary/10 transition-colors"
              >
                <td className="py-2 pr-4 text-cyber-cyan">{entry.ip}</td>
                <td className="py-2 pr-4 text-foreground">
                  {entry.requests.toLocaleString()}
                </td>
                <td
                  className={`py-2 pr-4 font-bold ${
                    entry.reqPerMin > 15
                      ? "text-red-400"
                      : entry.reqPerMin > 5
                        ? "text-yellow-400"
                        : "text-emerald-400"
                  }`}
                >
                  {entry.reqPerMin.toFixed(1)}
                </td>
                <td className="py-2 pr-4 text-muted-foreground">
                  {entry.sessionDuration}
                </td>
                <td className="py-2 pr-4">
                  <span
                    className={`text-[9px] border rounded px-1.5 py-0.5 font-bold ${statusStyle[entry.status]}`}
                  >
                    {entry.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Next Predicted Threat Panel ───────────────────────────────────────────────────────────────────
const THREAT_PROBS = [
  { type: "SQL Injection", prob: 35, color: "#ef4444" },
  { type: "XSS", prob: 22, color: "#f97316" },
  { type: "Brute Force", prob: 18, color: "#eab308" },
  { type: "CSRF", prob: 12, color: "#06b6d4" },
  { type: "Command Injection", prob: 8, color: "#a855f7" },
  { type: "Other", prob: 5, color: "#6b7280" },
];

function NextPredictedThreatPanel() {
  const [countdown, setCountdown] = useState(90);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => (c <= 1 ? 90 : c - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const top = THREAT_PROBS[0];

  return (
    <div
      className="bg-card border border-border rounded p-4 mt-4"
      data-ocid="dashboard.next_threat.panel"
    >
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={14} className="text-purple-400" />
        <p className="text-sm font-mono font-bold uppercase tracking-wide text-foreground">
          NEXT PREDICTED THREAT
        </p>
        <span className="ml-auto text-[9px] font-mono text-muted-foreground">
          predicted in ~{countdown}s
        </span>
      </div>
      <div className="flex items-center gap-3 mb-4 p-3 rounded border border-red-500/30 bg-red-500/5">
        <div>
          <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
            Most Likely
          </p>
          <p className="text-sm font-mono font-bold text-red-400">{top.type}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-2xl font-mono font-bold text-red-400">
            {top.prob}%
          </p>
          <p className="text-[9px] font-mono text-muted-foreground">
            probability
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {THREAT_PROBS.map((t) => (
          <div key={t.type}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-mono text-foreground/80">
                {t.type}
              </span>
              <span
                className="text-[10px] font-mono"
                style={{ color: t.color }}
              >
                {t.prob}%
              </span>
            </div>
            <div className="h-1.5 rounded bg-secondary overflow-hidden">
              <div
                className="h-full rounded transition-all duration-500"
                style={{
                  width: `${t.prob * 2.8}%`,
                  background: t.color,
                  boxShadow: `0 0 6px ${t.color}88`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Recent Attack Details Panel ─────────────────────────────────────────────────────────────────────

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
  retrainingQueue = [],
  onRetrainModel,
  modelVersion = "v1.0.0",
  ipAttackCounts: _ipAttackCounts = {},
  isRetraining = false,
}: DashboardPageProps) {
  // Threat Status Bar
  const threatStatus =
    openAlerts === 0 ? "SAFE" : openAlerts <= 2 ? "WARNING" : "CRITICAL";
  const threatStatusStyle =
    threatStatus === "SAFE"
      ? "bg-green-500/10 border-green-500/40 text-green-400"
      : threatStatus === "WARNING"
        ? "bg-yellow-500/10 border-yellow-500/40 text-yellow-400"
        : "bg-red-500/10 border-red-500/40 text-red-400";
  const threatStatusDot =
    threatStatus === "SAFE"
      ? "bg-green-400"
      : threatStatus === "WARNING"
        ? "bg-yellow-400"
        : "bg-red-400";

  // System risk score = max from threat level + open alerts bonus
  const systemRiskScore = Math.min(100, threatLevel + openAlerts * 5);

  // Sparkline data for stat cards
  const sparklines = {
    threat: [threatLevel - 30, threatLevel - 15, threatLevel - 5, threatLevel],
    alerts: [
      Math.max(0, openAlerts - 2),
      Math.max(0, openAlerts - 1),
      openAlerts,
      openAlerts,
    ],
    blocked: [
      blockedAttempts,
      blockedAttempts,
      blockedAttempts + 1,
      blockedAttempts,
    ],
    attacks: [
      simulatedAttacks - 3,
      simulatedAttacks - 1,
      simulatedAttacks,
      simulatedAttacks,
    ],
  };

  return (
    <div className="p-6">
      {/* Threat Status Bar */}
      <div
        data-ocid="dashboard.threat_status.panel"
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded border mb-6 ${threatStatusStyle}`}
        style={{
          boxShadow:
            threatStatus === "CRITICAL"
              ? "0 0 20px oklch(0.55 0.22 25 / 0.2)"
              : threatStatus === "WARNING"
                ? "0 0 20px oklch(0.78 0.18 80 / 0.2)"
                : "0 0 20px oklch(0.62 0.18 145 / 0.2)",
        }}
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${threatStatusDot}`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${threatStatusDot}`}
          />
        </span>
        <span className="text-xs font-mono font-bold tracking-widest">
          SYSTEM STATUS: {threatStatus}
        </span>
        <span className="text-[10px] font-mono opacity-70 ml-2">
          {threatStatus === "SAFE"
            ? "All systems nominal — no active threats detected"
            : threatStatus === "WARNING"
              ? `${openAlerts} open alert${openAlerts !== 1 ? "s" : ""} require attention`
              : `CRITICAL: ${openAlerts} open alerts — immediate action required`}
        </span>
      </div>

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
          sparkData={sparklines.threat}
        />
        <StatCard
          label="ACTIVE ALERTS"
          value={openAlerts}
          valueColor="text-cyber-yellow"
          sublabel="Awaiting triage"
          sparkData={sparklines.alerts}
        />
        <StatCard
          label="BLOCKED ATTEMPTS"
          value={blockedAttempts}
          valueColor="text-foreground"
          sublabel="Resolved detections"
          sparkData={sparklines.blocked}
        />
        <StatCard
          label="SIMULATED ATTACKS"
          value={simulatedAttacks}
          valueColor="text-foreground"
          sublabel="Total replays run"
          sparkData={sparklines.attacks}
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

      {/* System Risk Score Gauge */}
      <SystemRiskGauge score={systemRiskScore} />

      {/* Live Scanner */}
      <LiveScanner externalEvents={scannerEvents} />

      {/* ML Anomaly Panel */}
      <MLAnomalyPanel modelVersion={modelVersion} />

      {/* Model Comparison Panel */}
      <ModelComparisonPanel />

      {/* XAI Top Features Panel */}
      <XAITopFeaturesPanel />

      {/* Next Predicted Threat Panel */}
      <NextPredictedThreatPanel />

      {/* Behavioral Analysis */}
      <BehavioralAnalysisPanel />

      {/* AI Retraining Center */}
      <AIRetrainingPanel
        queue={retrainingQueue}
        onRetrain={onRetrainModel ?? (() => {})}
        modelVersion={modelVersion}
        isRetraining={isRetraining}
      />

      {/* Recent Attack Details Panel */}
      <RecentAttackDetailsPanel attackEvents={attackEvents} />
    </div>
  );
}

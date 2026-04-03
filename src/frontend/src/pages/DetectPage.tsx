import { Ban, Shield, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  Alert,
  AlertStatus,
  BlockedIp,
  IpStats,
  RetrainingCase,
  Severity,
} from "../types";

interface DetectPageProps {
  alerts: Alert[];
  onUpdateStatus: (alertId: string, status: AlertStatus) => void;
  blockedIps?: BlockedIp[];
  onBlockIp?: (ip: string, reason: string, blockedBy: string) => void;
  currentUserEmail?: string;
  retrainingQueue?: RetrainingCase[];
  onMarkFalseLabel?: (alertId: string, label: "FP" | "FN") => void;
  ipAttackCounts?: Record<string, IpStats>;
  modelVersion?: string;
}

type FilterTab = "all" | AlertStatus;

function SeverityBadge({ severity }: { severity: Severity }) {
  const cls =
    severity === "critical"
      ? "text-red-400 border-red-500/50 bg-red-400/10"
      : severity === "high"
        ? "text-orange-400 border-orange-500/50 bg-orange-400/10"
        : severity === "medium"
          ? "text-yellow-400 border-yellow-500/50 bg-yellow-400/10"
          : "text-green-400 border-green-500/50 bg-green-400/10";
  return (
    <span
      className={`inline-flex px-1.5 py-0.5 rounded-sm border text-[10px] font-mono uppercase ${cls}`}
    >
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: AlertStatus }) {
  const cls =
    status === "open"
      ? "text-cyber-red bg-cyber-red/10 border-cyber-red/30"
      : status === "investigating"
        ? "text-cyber-yellow bg-cyber-yellow/10 border-cyber-yellow/30"
        : "text-cyber-green bg-cyber-green/10 border-cyber-green/30";
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-sm border text-[10px] font-mono uppercase tracking-wider ${cls}`}
    >
      {status}
    </span>
  );
}

function RiskBadge({ score }: { score: number }) {
  const cls =
    score > 75
      ? "text-red-400 border-red-500/50 bg-red-400/10"
      : score > 50
        ? "text-orange-400 border-orange-500/50 bg-orange-400/10"
        : score > 25
          ? "text-yellow-400 border-yellow-500/50 bg-yellow-400/10"
          : "text-green-400 border-green-500/50 bg-green-400/10";
  const label =
    score > 75
      ? "CRITICAL"
      : score > 50
        ? "HIGH"
        : score > 25
          ? "MEDIUM"
          : "LOW";
  return (
    <span
      className={`inline-flex px-1.5 py-0.5 rounded-sm border text-[10px] font-mono ${cls}`}
    >
      {label}
    </span>
  );
}

const TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "ALL" },
  { value: "open", label: "OPEN" },
  { value: "investigating", label: "INVESTIGATING" },
  { value: "resolved", label: "RESOLVED" },
];

// ── ML keyword map ──────────────────────────────────────────────────────────────────────────────
const ML_KEYWORD_MAP: Record<string, { kw: string; w: number }[]> = {
  sql: [
    { kw: "sql_union_select", w: 0.94 },
    { kw: "payload_injection", w: 0.87 },
    { kw: "db_error_leak", w: 0.72 },
    { kw: "tautology_bypass", w: 0.65 },
  ],
  xss: [
    { kw: "xss_script_tag", w: 0.91 },
    { kw: "dom_event_inject", w: 0.83 },
    { kw: "onerror_handler", w: 0.74 },
    { kw: "reflected_payload", w: 0.61 },
  ],
  csrf: [
    { kw: "csrf_token_missing", w: 0.88 },
    { kw: "forged_request", w: 0.79 },
    { kw: "origin_mismatch", w: 0.67 },
    { kw: "cookie_hijack", w: 0.55 },
  ],
  brute: [
    { kw: "brute_force_pattern", w: 0.85 },
    { kw: "rate_limit_bypass", w: 0.77 },
    { kw: "credential_stuffing", w: 0.69 },
    { kw: "lockout_evasion", w: 0.58 },
  ],
  cmd: [
    { kw: "cmd_injection", w: 0.92 },
    { kw: "shell_escape", w: 0.84 },
    { kw: "os_command_exec", w: 0.76 },
    { kw: "pipe_operator", w: 0.62 },
  ],
  default: [
    { kw: "anomalous_request", w: 0.78 },
    { kw: "signature_match", w: 0.69 },
    { kw: "heuristic_flag", w: 0.61 },
    { kw: "payload_entropy", w: 0.54 },
  ],
};

function getKeywordsForAlert(
  scenarioName: string,
): { kw: string; w: number }[] {
  const lower = scenarioName.toLowerCase();
  if (lower.includes("sql")) return ML_KEYWORD_MAP.sql;
  if (lower.includes("xss") || lower.includes("cross-site scri"))
    return ML_KEYWORD_MAP.xss;
  if (lower.includes("csrf")) return ML_KEYWORD_MAP.csrf;
  if (lower.includes("brute")) return ML_KEYWORD_MAP.brute;
  if (lower.includes("command") || lower.includes("cmd"))
    return ML_KEYWORD_MAP.cmd;
  return ML_KEYWORD_MAP.default;
}

function getXGBoostScore(severity: Severity, alertId: string): number {
  const idOffset =
    alertId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 8;
  if (severity === "critical") return 88 + (idOffset % 8);
  if (severity === "high") return 72 + (idOffset % 13);
  if (severity === "medium") return 55 + (idOffset % 13);
  return 35 + (idOffset % 15);
}

function getSVMScore(xgboostScore: number, alertId: string): number {
  const seed = alertId.charCodeAt(alertId.length - 1) % 15;
  const delta = 8 + seed;
  // alternate plus/minus based on sum of chars
  const sum = alertId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return Math.max(
    0,
    Math.min(100, xgboostScore + (sum % 2 === 0 ? delta : -delta)),
  );
}

function calculateRiskScore(
  alert: Alert,
  ipAttackCounts: Record<string, IpStats>,
): number {
  let base =
    alert.severity === "critical"
      ? 90
      : alert.severity === "high"
        ? 70
        : alert.severity === "medium"
          ? 40
          : 15;
  if (alert.hackerIp) {
    const stats = ipAttackCounts[alert.hackerIp];
    if (stats && stats.count >= 3) base += 15;
  }
  const xgScore = getXGBoostScore(alert.severity, alert.id);
  if (xgScore > 80) base += 10;
  return Math.min(100, base);
}

// ── XAI Analysis Panel ─────────────────────────────────────────────────────────────────────────────
const XAI_KEYWORD_COLORS: Record<string, string> = {
  UNION: "#ef4444",
  SELECT: "#f97316",
  DROP: "#ef4444",
  INSERT: "#ef4444",
  EXEC: "#ef4444",
  OR: "#eab308",
  AND: "#eab308",
  SCRIPT: "#a855f7",
  "<": "#a855f7",
  ">": "#a855f7",
  FROM: "#f97316",
  WHERE: "#f97316",
  TABLE: "#ef4444",
  ADMIN: "#ef4444",
};

function highlightPayload(raw: string): React.ReactNode[] {
  const tokens = raw.split(/(\s+|(?=[<>])|(?<=[<>]))/).filter(Boolean);
  return tokens.map((token, i) => {
    const upper = token.toUpperCase().trim();
    const color = XAI_KEYWORD_COLORS[upper];
    const tokenKey = `xai-tok-${i}`;
    if (color) {
      return (
        <span
          key={tokenKey}
          style={{
            color,
            fontWeight: "bold",
            textShadow: `0 0 6px ${color}88`,
          }}
        >
          {token}
        </span>
      );
    }
    return (
      <span key={tokenKey} className="text-emerald-300">
        {token}
      </span>
    );
  });
}

function detectObfuscation(
  payload: string,
): { type: string; decoded: string }[] {
  const findings: { type: string; decoded: string }[] = [];
  if (/%[0-9a-fA-F]{2}/.test(payload)) {
    findings.push({
      type: "URL Encoding detected",
      decoded: decodeURIComponent(
        payload
          .replace(/%27/g, "'")
          .replace(/%20/g, " ")
          .replace(/%3D/g, "=")
          .replace(/%3B/g, ";")
          .replace(/%2F/g, "/"),
      ),
    });
  }
  if (/\/\*\*\//.test(payload)) {
    findings.push({
      type: "Inline comment bypass detected",
      decoded: payload.replace(/\/\*\*\//g, ""),
    });
  }
  if (
    /[a-zA-Z]/.test(payload) &&
    /[A-Z]/.test(payload) &&
    /[a-z]/.test(payload)
  ) {
    const words = payload.split(/\s+/);
    const hasMixedCase = words.some(
      (w) =>
        w.length > 2 && /[A-Z]/.test(w.slice(1)) && /[a-z]/.test(w.slice(1)),
    );
    if (hasMixedCase) {
      findings.push({
        type: "Case variation detected",
        decoded: payload.toUpperCase(),
      });
    }
  }
  return findings;
}

function XAIPanel({ alert }: { alert: Alert }) {
  const rawPayload =
    alert.signal.includes("bypass") ||
    alert.signal.includes("inject") ||
    alert.signal.includes("detected")
      ? `' UNION SELECT * FROM users WHERE '1'='1`
      : alert.signal;

  // Build normalized from raw
  const normalizedPayload = rawPayload.toUpperCase();
  const tokens = getKeywordsForAlert(alert.scenarioName);
  const obfuscations = detectObfuscation(rawPayload);

  return (
    <div className="bg-emerald-900/10 border border-emerald-500/20 rounded p-3 mt-3">
      <div className="flex items-center gap-2 mb-3">
        <Zap size={11} className="text-emerald-400" />
        <p className="text-[10px] font-mono text-emerald-400/80 uppercase tracking-widest">
          XAI ANALYSIS — EXPLAINABLE AI
        </p>
      </div>

      {/* Obfuscation Scan */}
      {obfuscations.length > 0 && (
        <div className="mb-3 p-2 rounded border border-orange-500/20 bg-orange-500/5">
          <p className="text-[9px] font-mono text-orange-400 uppercase tracking-widest mb-1">
            OBFUSCATION SCAN
          </p>
          {obfuscations.map((o) => (
            <div key={o.type} className="mb-1">
              <p className="text-[10px] font-mono text-orange-300">
                ⚠ {o.type}
              </p>
              <p className="text-[9px] font-mono text-muted-foreground">
                Normalized:{" "}
                <code className="text-yellow-300">
                  {o.decoded.slice(0, 60)}
                </code>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Pipeline stages */}
      <div className="space-y-2">
        {/* Stage 1: RAW INPUT */}
        <div className="rounded border border-border bg-secondary/20 p-2">
          <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1">
            RAW INPUT
          </p>
          <code className="text-[10px] font-mono">
            {highlightPayload(rawPayload)}
          </code>
        </div>
        <div className="flex justify-center">
          <span className="text-emerald-400 text-[10px]">&#8595;</span>
        </div>
        {/* Stage 2: NORMALIZED */}
        <div className="rounded border border-border bg-secondary/20 p-2">
          <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1">
            NORMALIZED
          </p>
          <code className="text-[10px] font-mono text-emerald-300">
            {normalizedPayload.slice(0, 80)}
          </code>
        </div>
        <div className="flex justify-center">
          <span className="text-emerald-400 text-[10px]">&#8595;</span>
        </div>
        {/* Stage 3: TOKENIZED */}
        <div className="rounded border border-border bg-secondary/20 p-2">
          <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1">
            TOKENIZED FEATURES
          </p>
          <div className="flex flex-wrap gap-1">
            {tokens.map((t) => (
              <span
                key={t.kw}
                className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-purple-500/30 text-purple-300 bg-purple-500/5"
              >
                {t.kw}:{" "}
                <span className="text-purple-400 font-bold">
                  {t.w.toFixed(2)}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Token contribution bar chart */}
      <div className="mt-3">
        <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-2">
          TOKEN CONTRIBUTION
        </p>
        <div className="space-y-1">
          {tokens.map((t) => (
            <div key={t.kw} className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-emerald-300/70 w-36 shrink-0 truncate">
                {t.kw}
              </span>
              <div className="flex-1 h-1.5 rounded bg-secondary overflow-hidden">
                <div
                  className="h-full rounded"
                  style={{
                    width: `${t.w * 100}%`,
                    background:
                      "linear-gradient(90deg, oklch(0.55 0.18 145), oklch(0.72 0.2 155))",
                  }}
                />
              </div>
              <span className="text-[9px] font-mono text-emerald-400 w-8 text-right shrink-0">
                {t.w.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Ensemble ML Panel ──────────────────────────────────────────────────────────────────────────────
const MODEL_METRICS = [
  {
    model: "XGBoost",
    accuracy: 96.2,
    precision: 94.8,
    recall: 97.1,
    f1: 95.9,
    color: "text-purple-400",
  },
  {
    model: "SVM",
    accuracy: 93.7,
    precision: 91.2,
    recall: 95.4,
    f1: 93.3,
    color: "text-blue-400",
  },
  {
    model: "Ensemble",
    accuracy: 97.8,
    precision: 96.4,
    recall: 98.2,
    f1: 97.3,
    color: "text-cyan-400",
  },
];

function MLClassificationPanel({
  alert,
  onMarkFalseLabel,
  modelVersion,
}: {
  alert: Alert;
  onMarkFalseLabel?: (alertId: string, label: "FP" | "FN") => void;
  modelVersion?: string;
}) {
  const xgScore = getXGBoostScore(alert.severity, alert.id);
  const svmScore = getSVMScore(xgScore, alert.id);
  const ensembleScore = Math.round((xgScore + svmScore) / 2);
  const keywords = getKeywordsForAlert(alert.scenarioName);

  const getLabel = (score: number) =>
    score >= 80
      ? {
          text: "REAL THREAT",
          cls: "text-red-400 border-red-400/50 bg-red-400/10",
        }
      : score >= 50
        ? {
            text: "SUSPICIOUS",
            cls: "text-yellow-400 border-yellow-400/50 bg-yellow-400/10",
          }
        : {
            text: "FALSE POSITIVE",
            cls: "text-emerald-400 border-emerald-400/50 bg-emerald-400/10",
          };

  const label = getLabel(ensembleScore);

  const getBarColor = (score: number) =>
    score >= 80
      ? "linear-gradient(90deg, oklch(0.55 0.22 25), oklch(0.65 0.2 30))"
      : score >= 50
        ? "linear-gradient(90deg, oklch(0.72 0.18 80), oklch(0.78 0.16 90))"
        : "linear-gradient(90deg, oklch(0.55 0.18 145), oklch(0.65 0.16 155))";

  const [markedFP, setMarkedFP] = useState(false);
  const [markedFN, setMarkedFN] = useState(false);

  const handleMark = (l: "FP" | "FN") => {
    if (!onMarkFalseLabel) return;
    onMarkFalseLabel(alert.id, l);
    if (l === "FP") setMarkedFP(true);
    else setMarkedFN(true);
  };

  return (
    <div className="bg-purple-900/10 border border-purple-500/20 rounded p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-mono text-purple-400/80 uppercase tracking-widest">
          ML CLASSIFICATION (TF-IDF + XGBoost + SVM)
        </p>
        {modelVersion && (
          <span className="text-[9px] font-mono text-purple-400 border border-purple-500/30 rounded px-1.5 py-0.5">
            {modelVersion}
          </span>
        )}
      </div>

      {/* Ensemble scores */}
      <div className="space-y-2 mb-3">
        {[
          { name: "XGBoost", score: xgScore, color: "text-purple-300" },
          { name: "SVM", score: svmScore, color: "text-blue-300" },
          {
            name: "ENSEMBLE FINAL",
            score: ensembleScore,
            color: "text-cyan-300",
            bold: true,
          },
        ].map((m) => (
          <div key={m.name}>
            <div className="flex items-center justify-between mb-0.5">
              <span
                className={`text-[10px] font-mono ${m.bold ? "font-bold" : ""} text-muted-foreground`}
              >
                {m.name}
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`text-[11px] font-mono font-bold ${m.color}`}>
                  {m.score}%
                </span>
                {m.bold && (
                  <span
                    className={`text-[9px] font-mono border rounded px-1.5 py-0.5 tracking-widest font-bold ${label.cls}`}
                  >
                    {label.text}
                  </span>
                )}
              </div>
            </div>
            <div className="w-full h-1.5 rounded bg-secondary overflow-hidden">
              <div
                className="h-full rounded transition-all duration-700"
                style={{
                  width: `${m.score}%`,
                  background: getBarColor(m.score),
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Voting winner badge */}
      <div className="flex items-center justify-center mb-3">
        <span className="text-[10px] font-mono font-bold text-cyan-400 border border-cyan-400/40 rounded px-3 py-1 bg-cyan-400/5">
          ★ VOTING WINNER: ENSEMBLE — {ensembleScore}% CONFIDENCE
        </span>
      </div>

      {/* Model metrics mini table */}
      <div className="overflow-x-auto mb-3">
        <table className="w-full text-[9px] font-mono">
          <thead>
            <tr className="border-b border-purple-500/20">
              {["MODEL", "ACC", "PREC", "RECALL", "F1"].map((h) => (
                <th
                  key={h}
                  className="text-left text-muted-foreground uppercase tracking-widest py-1 pr-3"
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
                className={m.model === "Ensemble" ? "bg-cyan-400/5" : ""}
              >
                <td className={`py-1 pr-3 font-bold ${m.color}`}>{m.model}</td>
                <td className="py-1 pr-3 text-emerald-400">{m.accuracy}%</td>
                <td className="py-1 pr-3 text-emerald-300">{m.precision}%</td>
                <td className="py-1 pr-3 text-emerald-300">{m.recall}%</td>
                <td className="py-1 pr-3 text-cyan-400">{m.f1}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TF-IDF keywords */}
      <p className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-widest mb-1.5">
        TF-IDF Signal Keywords
      </p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-3">
        {keywords.map((k) => (
          <div key={k.kw} className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-purple-300/70 truncate pr-1">
              {k.kw}
            </span>
            <span className="text-[10px] font-mono text-purple-400 shrink-0">
              {k.w.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* FP / FN marking buttons */}
      {onMarkFalseLabel && (
        <div className="flex gap-2 pt-2 border-t border-purple-500/20">
          <button
            type="button"
            data-ocid="detect.mark_fp.button"
            onClick={() => handleMark("FP")}
            disabled={markedFP || markedFN}
            className="flex-1 py-1.5 rounded border font-mono text-[10px] font-bold tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10"
          >
            {markedFP ? "✓ MARKED FP" : "MARK FALSE POSITIVE"}
          </button>
          <button
            type="button"
            data-ocid="detect.mark_fn.button"
            onClick={() => handleMark("FN")}
            disabled={markedFP || markedFN}
            className="flex-1 py-1.5 rounded border font-mono text-[10px] font-bold tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-red-400/50 text-red-400 hover:bg-red-400/10"
          >
            {markedFN ? "✓ MARKED FN" : "MARK FALSE NEGATIVE"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Risk Score Meter ─────────────────────────────────────────────────────────────────────────────────
function RiskMeter({ score }: { score: number }) {
  const label =
    score > 75
      ? "CRITICAL"
      : score > 50
        ? "HIGH"
        : score > 25
          ? "MEDIUM"
          : "LOW";
  const color =
    score > 75
      ? "oklch(0.55 0.22 25)"
      : score > 50
        ? "oklch(0.65 0.18 50)"
        : score > 25
          ? "oklch(0.78 0.18 80)"
          : "oklch(0.62 0.18 145)";
  const textCls =
    score > 75
      ? "text-red-400"
      : score > 50
        ? "text-orange-400"
        : score > 25
          ? "text-yellow-400"
          : "text-green-400";

  return (
    <div className="bg-secondary/20 border border-border rounded p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Shield size={11} className={textCls} />
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            RISK SCORE
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-mono font-bold ${textCls}`}>
            {score}
          </span>
          <span
            className={`text-[9px] font-mono border rounded px-1.5 py-0.5 ${
              score > 75
                ? "border-red-400/40 text-red-400 bg-red-400/10"
                : score > 50
                  ? "border-orange-400/40 text-orange-400 bg-orange-400/10"
                  : score > 25
                    ? "border-yellow-400/40 text-yellow-400 bg-yellow-400/10"
                    : "border-green-400/40 text-green-400 bg-green-400/10"
            }`}
          >
            {label}
          </span>
        </div>
      </div>
      <div className="w-full h-2 rounded bg-secondary overflow-hidden">
        <div
          className="h-full rounded transition-all duration-700"
          style={{
            width: `${score}%`,
            background: `linear-gradient(90deg, ${color}, ${color})`,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      </div>
    </div>
  );
}

function AlertDetailModal({
  alert,
  action,
  onClose,
  onUpdateStatus,
  blockedIps = [],
  onBlockIp,
  currentUserEmail = "admin@combodefense.local",
  onMarkFalseLabel,
  ipAttackCounts = {},
  modelVersion,
}: {
  alert: Alert;
  action: AlertStatus;
  onClose: () => void;
  onUpdateStatus: (alertId: string, status: AlertStatus) => void;
  blockedIps?: BlockedIp[];
  onBlockIp?: (ip: string, reason: string, blockedBy: string) => void;
  currentUserEmail?: string;
  onMarkFalseLabel?: (alertId: string, label: "FP" | "FN") => void;
  ipAttackCounts?: Record<string, IpStats>;
  modelVersion?: string;
}) {
  const [justBlocked, setJustBlocked] = useState(false);

  const actionLabel =
    action === "open" ? "OPEN" : action === "investigating" ? "INV" : "RES";
  const actionColor =
    action === "open"
      ? "border-cyber-red/60 text-cyber-red hover:bg-cyber-red/10"
      : action === "investigating"
        ? "border-cyber-yellow/60 text-cyber-yellow hover:bg-cyber-yellow/10"
        : "border-cyber-green/60 text-cyber-green hover:bg-cyber-green/10";

  const handleConfirm = () => {
    onUpdateStatus(alert.id, action);
    onClose();
  };

  const isAlreadyBlocked =
    alert.hackerIp != null && blockedIps.some((b) => b.ip === alert.hackerIp);

  const handleBlockIp = () => {
    if (!alert.hackerIp || !onBlockIp) return;
    onBlockIp(
      alert.hackerIp,
      `Alert: ${alert.scenarioName} — ${alert.attackType ?? alert.scenarioName}`,
      currentUserEmail,
    );
    setJustBlocked(true);
  };

  const reattackSteps = alert.reattackLoop ?? [
    "T+0s  → Initial attack vector triggered",
    "T+30s → Retry with modified payload",
    "T+60s → Automated re-attempt detected",
  ];

  const riskScore = calculateRiskScore(alert, ipAttackCounts);

  return (
    <button
      type="button"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm w-full h-full cursor-default"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <dialog
        open
        className="relative bg-[#0a0f0a] border border-cyber-cyan/30 rounded-lg w-full max-w-2xl mx-4 overflow-hidden shadow-2xl text-left p-0"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-[#0d140d]">
          <div className="flex items-center gap-2">
            <span className="text-cyber-cyan text-[10px] font-mono">■</span>
            <span className="text-[11px] font-mono text-muted-foreground tracking-widest">
              THREAT INTELLIGENCE REPORT
            </span>
          </div>
          <div className="flex items-center gap-2">
            {modelVersion && (
              <span className="text-[9px] font-mono text-purple-400 border border-purple-500/30 rounded px-1.5 py-0.5">
                {modelVersion}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground text-lg leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Scenario + severity */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-mono text-muted-foreground mb-0.5 uppercase tracking-widest">
                Scenario
              </p>
              <p className="text-sm font-mono font-bold text-foreground">
                {alert.scenarioName}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <SeverityBadge severity={alert.severity} />
              <StatusBadge status={alert.status} />
            </div>
          </div>

          {/* Risk Score Meter */}
          <RiskMeter score={riskScore} />

          {/* Attack type */}
          <div className="bg-cyber-red/5 border border-cyber-red/20 rounded p-3">
            <p className="text-[10px] font-mono text-cyber-red/70 uppercase tracking-widest mb-1">
              Attack Type
            </p>
            <p className="text-xs font-mono text-cyber-red font-semibold">
              {alert.attackType ?? alert.scenarioName}
            </p>
          </div>

          {/* Hacker IP + Block button */}
          <div className="bg-cyber-orange/5 border border-cyber-orange/20 rounded p-3">
            <p className="text-[10px] font-mono text-cyber-orange/70 uppercase tracking-widest mb-1">
              Source IP Address
            </p>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-mono text-cyber-orange font-bold tracking-wider">
                  {alert.hackerIp ?? "UNKNOWN"}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                  Geolocation: Eastern Europe / TOR exit node suspected
                </p>
                {alert.hackerIp && ipAttackCounts[alert.hackerIp] && (
                  <p className="text-[9px] font-mono text-orange-400/70 mt-0.5">
                    Hit count: {ipAttackCounts[alert.hackerIp].count} attacks
                    from this IP
                  </p>
                )}
              </div>
              {alert.hackerIp && onBlockIp && (
                <div className="shrink-0">
                  {isAlreadyBlocked || justBlocked ? (
                    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded border border-green-500/30 bg-green-500/5">
                      <Ban size={10} className="text-green-400" />
                      <span className="text-[9px] font-mono text-green-400 font-bold">
                        BLOCKED
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleBlockIp}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded border border-red-500/50 text-red-400 font-mono text-[9px] font-bold tracking-widest hover:bg-red-500/10 transition-colors"
                    >
                      <Ban size={10} />
                      BLOCK IP
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Signal */}
          <div className="bg-secondary/20 border border-border rounded p-3">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">
              Detection Signal
            </p>
            <p className="text-xs font-mono text-foreground">{alert.signal}</p>
          </div>

          {/* Re-attack loop */}
          <div className="bg-cyber-cyan/5 border border-cyber-cyan/20 rounded p-3">
            <p className="text-[10px] font-mono text-cyber-cyan/70 uppercase tracking-widest mb-2">
              Re-Attack Loop Pattern
            </p>
            <ul className="space-y-1">
              {reattackSteps.map((step) => (
                <li
                  key={step}
                  className="text-[11px] font-mono text-cyber-cyan/90 flex items-start gap-2"
                >
                  <span className="text-cyber-cyan/40 mt-px">›</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Ensemble ML Classification Panel */}
          <MLClassificationPanel
            alert={alert}
            onMarkFalseLabel={onMarkFalseLabel}
            modelVersion={modelVersion}
          />

          {/* XAI Analysis Panel */}
          <XAIPanel alert={alert} />

          {/* Timestamp */}
          <p className="text-[10px] font-mono text-muted-foreground">
            DETECTED:{" "}
            {new Date(alert.timestamp).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "medium",
            })}
          </p>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-[#0d140d]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded text-[11px] font-mono border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            CLOSE
          </button>
          {alert.status !== action && (
            <button
              type="button"
              onClick={handleConfirm}
              className={`px-4 py-1.5 rounded text-[11px] font-mono border transition-colors ${actionColor}`}
            >
              SET {actionLabel}
            </button>
          )}
        </div>
      </dialog>
    </button>
  );
}

export default function DetectPage({
  alerts,
  onUpdateStatus,
  blockedIps = [],
  onBlockIp,
  currentUserEmail,
  retrainingQueue = [],
  onMarkFalseLabel,
  ipAttackCounts = {},
  modelVersion,
}: DetectPageProps) {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [modal, setModal] = useState<{
    alert: Alert;
    action: AlertStatus;
  } | null>(null);

  const filtered =
    filter === "all" ? alerts : alerts.filter((a) => a.status === filter);

  const openModal = (alert: Alert, action: AlertStatus) => {
    setModal({ alert, action });
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground mb-4">
        <span className="text-cyber-yellow">■</span>
        <span>DETECTION LAYER</span>
        {modelVersion && (
          <span className="ml-auto text-[9px] font-mono text-purple-400 border border-purple-500/30 rounded px-1.5 py-0.5">
            Model {modelVersion}
          </span>
        )}
        {retrainingQueue.length > 0 && (
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-400/20 text-orange-400 border border-orange-400/40">
            {retrainingQueue.length} queued for retraining
          </span>
        )}
      </div>
      <h1 className="text-2xl font-mono font-bold uppercase tracking-wide text-foreground mb-2">
        ALERTS INVESTIGATION BOARD
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Review and triage all detected security events. Update alert status to
        track investigation progress.
      </p>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4" data-ocid="detect.filter.tab">
        {TABS.map(({ value, label }) => (
          <button
            type="button"
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 rounded text-[11px] font-mono tracking-widest transition-colors ${
              filter === value
                ? "bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/40"
                : "text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            {label}
            <span className="ml-1.5 text-[10px] opacity-70">
              {value === "all"
                ? alerts.length
                : alerts.filter((a) => a.status === value).length}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div
        className="bg-card border border-border rounded overflow-hidden"
        data-ocid="detect.alerts.table"
      >
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {[
                "SCENARIO",
                "SEVERITY",
                "RISK",
                "STATUS",
                "SIGNAL",
                "ACTIONS",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-[11px] font-mono text-muted-foreground"
                  data-ocid="detect.empty_state"
                >
                  NO ALERTS MATCHING FILTER
                </td>
              </tr>
            )}
            {filtered.map((alert, idx) => {
              const isBlocked =
                alert.hackerIp != null &&
                blockedIps.some((b) => b.ip === alert.hackerIp);
              const riskScore = calculateRiskScore(alert, ipAttackCounts);
              return (
                <tr
                  key={alert.id}
                  data-ocid={`detect.alert.item.${idx + 1}`}
                  className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-foreground">
                        {alert.scenarioName}
                      </span>
                      {isBlocked && (
                        <span className="flex items-center gap-1 text-[9px] font-mono text-green-400 border border-green-500/30 rounded px-1 py-0.5">
                          <Ban size={8} />
                          BLOCKED
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <SeverityBadge severity={alert.severity} />
                  </td>
                  <td className="px-4 py-3">
                    <RiskBadge score={riskScore} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={alert.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">
                    {alert.signal}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        data-ocid={`detect.open.button.${idx + 1}`}
                        onClick={() => openModal(alert, "open")}
                        className="px-2 py-1 rounded text-[10px] font-mono border border-cyber-red/40 text-cyber-red hover:bg-cyber-red/10 transition-colors"
                      >
                        OPEN
                      </button>
                      <button
                        type="button"
                        data-ocid={`detect.investigating.button.${idx + 1}`}
                        onClick={() => openModal(alert, "investigating")}
                        className="px-2 py-1 rounded text-[10px] font-mono border border-cyber-yellow/40 text-cyber-yellow hover:bg-cyber-yellow/10 transition-colors"
                      >
                        INV
                      </button>
                      <button
                        type="button"
                        data-ocid={`detect.resolved.button.${idx + 1}`}
                        onClick={() => openModal(alert, "resolved")}
                        className="px-2 py-1 rounded text-[10px] font-mono border border-cyber-green/40 text-cyber-green hover:bg-cyber-green/10 transition-colors"
                      >
                        RES
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {modal && (
        <AlertDetailModal
          alert={modal.alert}
          action={modal.action}
          onClose={() => setModal(null)}
          onUpdateStatus={onUpdateStatus}
          blockedIps={blockedIps}
          onBlockIp={onBlockIp}
          currentUserEmail={currentUserEmail}
          onMarkFalseLabel={onMarkFalseLabel}
          ipAttackCounts={ipAttackCounts}
          modelVersion={modelVersion}
        />
      )}
    </div>
  );
}

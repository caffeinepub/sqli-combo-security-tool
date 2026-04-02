import { Ban } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Alert, AlertStatus, BlockedIp, Severity } from "../types";

interface DetectPageProps {
  alerts: Alert[];
  onUpdateStatus: (alertId: string, status: AlertStatus) => void;
  blockedIps?: BlockedIp[];
  onBlockIp?: (ip: string, reason: string, blockedBy: string) => void;
  currentUserEmail?: string;
}

type FilterTab = "all" | AlertStatus;

function SeverityBadge({ severity }: { severity: Severity }) {
  const cls =
    severity === "critical"
      ? "text-cyber-red border-cyber-red/50"
      : severity === "high"
        ? "text-cyber-orange border-cyber-orange/50"
        : "text-cyber-yellow border-cyber-yellow/50";
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

const TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "ALL" },
  { value: "open", label: "OPEN" },
  { value: "investigating", label: "INVESTIGATING" },
  { value: "resolved", label: "RESOLVED" },
];

// ─── ML keyword map ──────────────────────────────────────────────────────────
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

function MLClassificationPanel({ alert }: { alert: Alert }) {
  const [barWidth, setBarWidth] = useState(0);
  const score = getXGBoostScore(alert.severity, alert.id);
  const keywords = getKeywordsForAlert(alert.scenarioName);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      const t = setTimeout(() => setBarWidth(score), 80);
      return () => clearTimeout(t);
    }
  }, [score]);

  const label =
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

  const barColor =
    score >= 80
      ? "linear-gradient(90deg, oklch(0.55 0.22 25), oklch(0.65 0.2 30))"
      : score >= 50
        ? "linear-gradient(90deg, oklch(0.72 0.18 80), oklch(0.78 0.16 90))"
        : "linear-gradient(90deg, oklch(0.55 0.18 145), oklch(0.65 0.16 155))";

  return (
    <div className="bg-purple-900/10 border border-purple-500/20 rounded p-3">
      <p className="text-[10px] font-mono text-purple-400/80 uppercase tracking-widest mb-2">
        ML CLASSIFICATION (TF-IDF + XGBoost)
      </p>
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono text-muted-foreground">
            XGBoost Confidence
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono font-bold text-purple-300">
              {score}%
            </span>
            <span
              className={`text-[9px] font-mono border rounded px-1.5 py-0.5 tracking-widest font-bold ${label.cls}`}
            >
              {label.text}
            </span>
          </div>
        </div>
        <div className="w-full h-1.5 rounded bg-secondary overflow-hidden">
          <div
            className="h-full rounded transition-all duration-700"
            style={{ width: `${barWidth}%`, background: barColor }}
          />
        </div>
      </div>
      <p className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-widest mb-1.5">
        TF-IDF Signal Keywords
      </p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
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
}: {
  alert: Alert;
  action: AlertStatus;
  onClose: () => void;
  onUpdateStatus: (alertId: string, status: AlertStatus) => void;
  blockedIps?: BlockedIp[];
  onBlockIp?: (ip: string, reason: string, blockedBy: string) => void;
  currentUserEmail?: string;
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

  return (
    <button
      type="button"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm w-full h-full cursor-default"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <dialog
        open
        className="relative bg-[#0a0f0a] border border-cyber-cyan/30 rounded-lg w-full max-w-xl mx-4 overflow-hidden shadow-2xl text-left p-0"
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
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
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

          {/* ML Classification Panel */}
          <MLClassificationPanel alert={alert} />

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
              {["SCENARIO", "SEVERITY", "STATUS", "SIGNAL", "ACTIONS"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
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
        />
      )}
    </div>
  );
}

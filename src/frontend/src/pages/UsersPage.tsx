import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Monitor,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { EXTENDED_USERS } from "../data";
import type { User } from "../types";

interface UsersPageProps {
  currentUser: User;
}

type ScanTarget =
  | "entire"
  | "browser"
  | "os"
  | "network"
  | "database"
  | "firewall"
  | "webserver";

interface ScanFinding {
  label: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  detail: string;
}

const SCAN_FINDINGS: Record<ScanTarget, ScanFinding[]> = {
  entire: [
    {
      label: "SQL Injection vector detected",
      severity: "CRITICAL",
      detail: "Unparameterized query in /api/login endpoint",
    },
    {
      label: "Cross-Site Scripting (XSS) exposure",
      severity: "HIGH",
      detail: "Reflected input unsanitized in search results",
    },
    {
      label: "Brute-force attack surface open",
      severity: "HIGH",
      detail: "No rate-limiting on authentication endpoint",
    },
    {
      label: "Session token predictability",
      severity: "MEDIUM",
      detail: "Sequential session IDs detected, weak entropy",
    },
    {
      label: "Privilege escalation path identified",
      severity: "MEDIUM",
      detail: "Role check bypass via parameter tampering",
    },
  ],
  browser: [
    {
      label: "Cross-Site Scripting (XSS) via DOM",
      severity: "HIGH",
      detail: "innerHTML usage with unsanitized user data",
    },
    {
      label: "Content Security Policy missing",
      severity: "MEDIUM",
      detail: "No CSP headers detected on application",
    },
    {
      label: "Clickjacking vulnerability",
      severity: "LOW",
      detail: "X-Frame-Options header absent",
    },
  ],
  os: [
    {
      label: "Privilege escalation path identified",
      severity: "HIGH",
      detail: "Sudo misconfiguration in service account",
    },
    {
      label: "Outdated kernel version",
      severity: "MEDIUM",
      detail: "Kernel 5.4.0 — known CVE-2023-3269 applies",
    },
    {
      label: "Writable system directories",
      severity: "MEDIUM",
      detail: "/tmp writable by unprivileged users",
    },
  ],
  network: [
    {
      label: "Unencrypted traffic on port 8080",
      severity: "HIGH",
      detail: "HTTP without TLS on internal API channel",
    },
    {
      label: "Open ports beyond baseline",
      severity: "MEDIUM",
      detail: "Ports 3306, 5432 exposed to LAN segment",
    },
    {
      label: "DNS spoofing susceptibility",
      severity: "LOW",
      detail: "DNSSEC not configured on zone",
    },
  ],
  database: [
    {
      label: "SQL Injection vector detected",
      severity: "CRITICAL",
      detail: "Unparameterized query found in auth module",
    },
    {
      label: "Unparameterized query found",
      severity: "HIGH",
      detail: "Raw string concatenation in search handler",
    },
    {
      label: "Excessive DB user privileges",
      severity: "MEDIUM",
      detail: "App account has DROP TABLE permission",
    },
    {
      label: "No query logging enabled",
      severity: "LOW",
      detail: "Audit trail absent for sensitive queries",
    },
  ],
  firewall: [
    {
      label: "Overly permissive inbound rules",
      severity: "HIGH",
      detail: "Port range 1024-65535 open inbound",
    },
    {
      label: "No egress filtering",
      severity: "MEDIUM",
      detail: "Unrestricted outbound connections permitted",
    },
    {
      label: "Default firewall policy allows all",
      severity: "HIGH",
      detail: "Missing explicit deny-all baseline rule",
    },
  ],
  webserver: [
    {
      label: "Directory listing enabled",
      severity: "HIGH",
      detail: "Apache autoindex active on /static/",
    },
    {
      label: "Server version disclosure",
      severity: "MEDIUM",
      detail: "Server header exposes Nginx 1.18.0",
    },
    {
      label: "Brute-force attack surface open",
      severity: "HIGH",
      detail: "No rate-limiting on /api/auth",
    },
    {
      label: "Insecure cookie attributes",
      severity: "MEDIUM",
      detail: "Session cookie missing HttpOnly flag",
    },
  ],
};

const SCAN_LOG_LINES: Record<ScanTarget, string[]> = {
  entire: [
    "Initializing full system scan...",
    "Probing SQL injection vectors...",
    "Probing XSS attack surfaces...",
    "Analyzing brute-force exposure...",
    "Checking session token entropy...",
    "Testing privilege escalation paths...",
    "Generating threat report...",
  ],
  browser: [
    "Targeting browser environment...",
    "Probing DOM XSS vectors...",
    "Checking CSP headers...",
    "Testing clickjacking surface...",
    "Generating report...",
  ],
  os: [
    "Targeting OS services...",
    "Scanning sudo configurations...",
    "Checking kernel version...",
    "Probing filesystem permissions...",
    "Generating report...",
  ],
  network: [
    "Targeting network layer...",
    "Scanning open ports...",
    "Probing TLS configurations...",
    "Testing DNS security...",
    "Generating report...",
  ],
  database: [
    "Targeting database layer...",
    "Probing SQL injection vectors...",
    "Checking query parameterization...",
    "Auditing user privileges...",
    "Generating report...",
  ],
  firewall: [
    "Targeting firewall ruleset...",
    "Mapping inbound policies...",
    "Checking egress filtering...",
    "Validating deny-all baseline...",
    "Generating report...",
  ],
  webserver: [
    "Targeting web server...",
    "Probing directory listing...",
    "Checking server headers...",
    "Testing rate-limiting...",
    "Auditing cookie security...",
    "Generating report...",
  ],
};

const TARGET_LABELS: Record<ScanTarget, string> = {
  entire: "ENTIRE SYSTEM",
  browser: "Browser",
  os: "OS Services",
  network: "Network Layer",
  database: "Database",
  firewall: "Firewall",
  webserver: "Web Server",
};

const severityColor: Record<string, string> = {
  CRITICAL: "text-red-400 border-red-500/60 bg-red-500/10",
  HIGH: "text-orange-400 border-orange-400/60 bg-orange-400/10",
  MEDIUM: "text-yellow-400 border-yellow-400/60 bg-yellow-400/10",
  LOW: "text-green-400 border-green-400/60 bg-green-400/10",
};

const ROLE_COLORS: Record<
  string,
  { text: string; border: string; bg: string }
> = {
  admin: {
    text: "#22c55e",
    border: "rgba(34,197,94,0.5)",
    bg: "rgba(34,197,94,0.1)",
  },
  coadmin: {
    text: "#a855f7",
    border: "rgba(168,85,247,0.5)",
    bg: "rgba(168,85,247,0.1)",
  },
  analyst: {
    text: "#22d3ee",
    border: "rgba(34,211,238,0.5)",
    bg: "rgba(34,211,238,0.1)",
  },
  viewer: {
    text: "#9ca3af",
    border: "rgba(156,163,175,0.5)",
    bg: "rgba(156,163,175,0.1)",
  },
  monitor: {
    text: "#facc15",
    border: "rgba(250,204,21,0.5)",
    bg: "rgba(250,204,21,0.1)",
  },
  auditor: {
    text: "#60a5fa",
    border: "rgba(96,165,250,0.5)",
    bg: "rgba(96,165,250,0.1)",
  },
  responder: {
    text: "#fb923c",
    border: "rgba(251,146,60,0.5)",
    bg: "rgba(251,146,60,0.1)",
  },
};

export default function UsersPage({ currentUser }: UsersPageProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [scanMode, setScanMode] = useState<"entire" | "specific">("entire");
  const [specificTarget, setSpecificTarget] =
    useState<Exclude<ScanTarget, "entire">>("browser");
  const [scanning, setScanning] = useState(false);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [results, setResults] = useState<ScanFinding[] | null>(null);
  const [scanTimestamp, setScanTimestamp] = useState("");
  const scanTarget: ScanTarget =
    scanMode === "entire" ? "entire" : specificTarget;
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const onlineCount = EXTENDED_USERS.filter(
    (u) => u.status === "online",
  ).length;

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearScan = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    setScanning(false);
    setLogLines([]);
    setScanProgress(0);
    setResults(null);
  };

  const runScan = () => {
    setResults(null);
    setLogLines([]);
    setScanProgress(0);
    setScanning(true);
    setScanTimestamp(new Date().toLocaleString());

    const lines = SCAN_LOG_LINES[scanTarget];
    let step = 0;
    const totalSteps = lines.length;
    const interval = 4000 / totalSteps;

    scanIntervalRef.current = setInterval(() => {
      step++;
      const progress = Math.min(100, Math.round((step / totalSteps) * 100));
      setScanProgress(progress);
      setLogLines((prev) => [...prev, lines[step - 1] ?? ""]);

      if (step >= totalSteps) {
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        setTimeout(() => {
          setScanning(false);
          setResults(SCAN_FINDINGS[scanTarget]);
        }, 400);
      }
    }, interval);
  };

  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background p-6 font-mono">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-1">
          COMBO DEFENSE CONSOLE
        </p>
        <h1 className="text-xl font-bold tracking-widest text-cyber-cyan">
          USER MANAGEMENT &amp; SYSTEM SCANNER
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Active sessions and targeted vulnerability scanning
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ── Panel 1: Users ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <UserIcon size={14} className="text-cyber-cyan" />
            <h2 className="text-xs font-bold tracking-[0.25em] text-cyber-cyan uppercase">
              System Users
            </h2>
            <span className="ml-auto text-[10px] text-green-400 border border-green-400/40 bg-green-400/10 px-2 py-0.5 rounded tracking-widest">
              {onlineCount} ONLINE
            </span>
          </div>

          <div className="space-y-2">
            {EXTENDED_USERS.map((u, idx) => {
              const roleColors = ROLE_COLORS[u.role] ?? ROLE_COLORS.viewer;
              const isExpanded = expandedIds.has(u.id);
              const isCurrentUser = u.email === currentUser.email;

              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  data-ocid={`users.item.${idx + 1}`}
                  className="rounded-lg border bg-card overflow-hidden"
                  style={{
                    borderColor: roleColors.border,
                    background: roleColors.bg.replace("0.1", "0.04"),
                  }}
                >
                  {/* Role stripe */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg"
                    style={{ background: roleColors.text }}
                  />

                  {/* Collapsed header — always visible, click to expand */}
                  <button
                    type="button"
                    className="w-full text-left p-3 relative"
                    onClick={() => toggleExpand(u.id)}
                    data-ocid={`users.toggle.${idx + 1}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{
                          background: roleColors.bg,
                          border: `1px solid ${roleColors.border}`,
                          color: roleColors.text,
                        }}
                      >
                        {u.name.charAt(0)}
                      </div>

                      {/* Name + email */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-foreground tracking-wide truncate">
                            {u.name}
                          </p>
                          {isCurrentUser && (
                            <span className="text-[9px] text-cyber-cyan border border-cyber-cyan/40 bg-cyber-cyan/5 px-1.5 py-0.5 rounded tracking-widest shrink-0">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {u.email}
                        </p>
                      </div>

                      {/* Role badge */}
                      <span
                        className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border tracking-widest shrink-0"
                        style={{
                          color: roleColors.text,
                          borderColor: roleColors.border,
                          background: roleColors.bg,
                        }}
                      >
                        {u.role}
                      </span>

                      {/* Status dot */}
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          u.status === "online"
                            ? "bg-green-400 animate-pulse"
                            : "bg-gray-600"
                        }`}
                      />

                      {/* Expand chevron */}
                      {isExpanded ? (
                        <ChevronUp
                          size={12}
                          className="text-muted-foreground shrink-0"
                        />
                      ) : (
                        <ChevronDown
                          size={12}
                          className="text-muted-foreground shrink-0"
                        />
                      )}
                    </div>

                    {/* Quick stats row */}
                    <div className="mt-2 grid grid-cols-3 gap-2 text-[9px]">
                      <div>
                        <p className="text-muted-foreground tracking-widest">
                          STATUS
                        </p>
                        <p
                          className="font-bold uppercase mt-0.5"
                          style={{
                            color:
                              u.status === "online" ? "#4ade80" : "#6b7280",
                          }}
                        >
                          {u.status}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground tracking-widest">
                          SESSION IP
                        </p>
                        <p className="text-foreground mt-0.5">{u.sessionIp}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground tracking-widest">
                          LAST LOGIN
                        </p>
                        <p className="text-foreground mt-0.5">{u.lastLogin}</p>
                      </div>
                    </div>
                  </button>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        key={`expand-${u.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div
                          className="px-3 pb-3 pt-0 border-t"
                          style={{ borderColor: roleColors.border }}
                        >
                          {/* Pages visited */}
                          <div className="mt-2 mb-2">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Monitor
                                size={10}
                                className="text-muted-foreground"
                              />
                              <p className="text-[9px] text-muted-foreground tracking-widest uppercase">
                                Pages Visited
                              </p>
                            </div>
                            <p className="text-[10px] text-foreground">
                              {u.pagesVisited.join(", ")}
                            </p>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div
                              className="rounded p-2 text-center"
                              style={{
                                background: "rgba(251,146,60,0.08)",
                                border: "1px solid rgba(251,146,60,0.2)",
                              }}
                            >
                              <p className="text-[9px] text-muted-foreground tracking-widest">
                                ATTACKS TRIGGERED
                              </p>
                              <p className="text-sm font-bold text-orange-400 mt-0.5">
                                {u.attacksTriggered}
                              </p>
                            </div>
                            <div
                              className="rounded p-2 text-center"
                              style={{
                                background: "rgba(34,197,94,0.08)",
                                border: "1px solid rgba(34,197,94,0.2)",
                              }}
                            >
                              <p className="text-[9px] text-muted-foreground tracking-widest">
                                ALERTS RESOLVED
                              </p>
                              <p className="text-sm font-bold text-green-400 mt-0.5">
                                {u.alertsResolved}
                              </p>
                            </div>
                          </div>

                          {/* Activity log */}
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <Activity
                                size={10}
                                className="text-muted-foreground"
                              />
                              <p className="text-[9px] text-muted-foreground tracking-widest uppercase">
                                Activity Log
                              </p>
                            </div>
                            <div
                              className="space-y-0.5 overflow-y-auto rounded"
                              style={{
                                maxHeight: 120,
                                background: "rgba(0,0,0,0.3)",
                                padding: "6px",
                              }}
                            >
                              {u.activityLog.map((entry, i) => (
                                <div
                                  key={`${u.id}-log-${i}`}
                                  className="flex items-start gap-2"
                                >
                                  <Clock
                                    size={8}
                                    className="text-muted-foreground mt-0.5 shrink-0"
                                  />
                                  <span className="text-[9px] text-muted-foreground shrink-0">
                                    {entry.timestamp}
                                  </span>
                                  <span className="text-[9px] text-foreground/80">
                                    {entry.action}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── Panel 2: System Scanner ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={14} className="text-cyber-cyan" />
            <h2 className="text-xs font-bold tracking-[0.25em] text-cyber-cyan uppercase">
              System Scanner
            </h2>
          </div>

          <div
            className="rounded-lg border border-border bg-card p-4"
            style={{ borderColor: "rgba(34,211,238,0.25)" }}
          >
            {/* Mode toggle */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                data-ocid="scanner.entire_system.button"
                onClick={() => {
                  setScanMode("entire");
                  setResults(null);
                }}
                className={`flex-1 py-2 text-[11px] font-bold tracking-widest uppercase rounded border transition-colors ${
                  scanMode === "entire"
                    ? "bg-cyber-cyan/10 border-cyber-cyan text-cyber-cyan"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-cyber-cyan/40"
                }`}
              >
                [ ENTIRE SYSTEM ]
              </button>
              <button
                type="button"
                data-ocid="scanner.specific_app.button"
                onClick={() => {
                  setScanMode("specific");
                  setResults(null);
                }}
                className={`flex-1 py-2 text-[11px] font-bold tracking-widest uppercase rounded border transition-colors ${
                  scanMode === "specific"
                    ? "bg-cyber-cyan/10 border-cyber-cyan text-cyber-cyan"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-cyber-cyan/40"
                }`}
              >
                [ SPECIFIC APP ]
              </button>
            </div>

            {/* Specific app dropdown */}
            <AnimatePresence>
              {scanMode === "specific" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <label
                    htmlFor="scanner-target-select"
                    className="block text-[10px] tracking-widest text-muted-foreground mb-1.5 uppercase"
                  >
                    Select Target App
                  </label>
                  <select
                    id="scanner-target-select"
                    data-ocid="scanner.target.select"
                    value={specificTarget}
                    onChange={(e) =>
                      setSpecificTarget(
                        e.target.value as Exclude<ScanTarget, "entire">,
                      )
                    }
                    className="w-full bg-background border border-border rounded px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-cyber-cyan/60"
                  >
                    <option value="browser">Browser</option>
                    <option value="os">OS Services</option>
                    <option value="network">Network Layer</option>
                    <option value="database">Database</option>
                    <option value="firewall">Firewall</option>
                    <option value="webserver">Web Server</option>
                  </select>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Initiate button */}
            <button
              type="button"
              data-ocid="scanner.initiate.button"
              onClick={runScan}
              disabled={scanning}
              className="w-full py-2.5 mb-4 text-xs font-bold tracking-[0.2em] uppercase rounded border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: scanning
                  ? "rgba(34,211,238,0.05)"
                  : "rgba(34,211,238,0.12)",
                borderColor: "rgba(34,211,238,0.6)",
                color: "#22d3ee",
                boxShadow: scanning ? "none" : "0 0 12px rgba(34,211,238,0.15)",
              }}
            >
              {scanning ? "▶ SCANNING IN PROGRESS..." : "[ INITIATE SCAN ]"}
            </button>

            {/* Scanning animation */}
            <AnimatePresence>
              {scanning && (
                <motion.div
                  key="scan-animation"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded border border-green-500/30 overflow-hidden mb-4"
                  style={{
                    background: "rgba(0,20,0,0.95)",
                    backgroundImage: `url('/assets/generated/hacking-bg.dim_1920x1080.jpg')`,
                    backgroundSize: "cover",
                    backgroundBlendMode: "overlay",
                  }}
                >
                  <div
                    className="p-3"
                    style={{ background: "rgba(0,0,0,0.82)" }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-green-400 tracking-widest">
                        SCANNING: {TARGET_LABELS[scanTarget]}
                      </span>
                      <span className="text-[10px] text-green-300 font-bold">
                        {scanProgress}%
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-green-950 rounded-full overflow-hidden mb-3">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background:
                            "linear-gradient(90deg, #166534, #22c55e, #4ade80)",
                          boxShadow: "0 0 8px rgba(34,197,94,0.8)",
                        }}
                        animate={{ width: `${scanProgress}%` }}
                        transition={{ ease: "linear" }}
                      />
                    </div>
                    {/* Log lines */}
                    <div className="space-y-0.5 min-h-[80px]">
                      {logLines.map((line, i) => (
                        <motion.p
                          key={`log-${i}-${line.slice(0, 8)}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-[11px] text-green-400 font-mono"
                        >
                          <span className="text-green-600 mr-2">▶</span>
                          {line}
                        </motion.p>
                      ))}
                      <motion.span
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{
                          repeat: Number.POSITIVE_INFINITY,
                          duration: 0.8,
                        }}
                        className="inline-block w-2 h-3.5 bg-green-400 ml-4"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scan results */}
            <AnimatePresence>
              {results && (
                <motion.div
                  key="scan-results"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  data-ocid="scanner.results.panel"
                >
                  <div
                    className="rounded border border-green-500/30 overflow-hidden"
                    style={{ background: "rgba(0,20,0,0.7)" }}
                  >
                    <div className="flex items-center justify-between px-3 py-2 border-b border-green-500/20">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={12} className="text-green-400" />
                        <span className="text-[10px] text-green-400 font-bold tracking-widest uppercase">
                          SCAN COMPLETE — {TARGET_LABELS[scanTarget]}
                        </span>
                      </div>
                      <span className="text-[9px] text-muted-foreground">
                        {scanTimestamp}
                      </span>
                    </div>

                    <div className="p-3 space-y-2">
                      {results.map((finding, i) => (
                        <motion.div
                          key={finding.label}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          data-ocid={`scanner.finding.item.${i + 1}`}
                          className="flex items-start gap-2 p-2 rounded border"
                          style={{
                            borderColor:
                              finding.severity === "CRITICAL"
                                ? "rgba(239,68,68,0.3)"
                                : finding.severity === "HIGH"
                                  ? "rgba(251,146,60,0.3)"
                                  : finding.severity === "MEDIUM"
                                    ? "rgba(250,204,21,0.3)"
                                    : "rgba(74,222,128,0.3)",
                            background:
                              finding.severity === "CRITICAL"
                                ? "rgba(239,68,68,0.05)"
                                : finding.severity === "HIGH"
                                  ? "rgba(251,146,60,0.05)"
                                  : finding.severity === "MEDIUM"
                                    ? "rgba(250,204,21,0.05)"
                                    : "rgba(74,222,128,0.05)",
                          }}
                        >
                          <AlertTriangle
                            size={11}
                            className="mt-0.5 shrink-0"
                            style={{
                              color:
                                finding.severity === "CRITICAL"
                                  ? "#ef4444"
                                  : finding.severity === "HIGH"
                                    ? "#fb923c"
                                    : finding.severity === "MEDIUM"
                                      ? "#facc15"
                                      : "#4ade80",
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[11px] text-foreground font-bold truncate">
                                {finding.label}
                              </p>
                              <span
                                className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border tracking-widest shrink-0 ${severityColor[finding.severity]}`}
                              >
                                {finding.severity}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {finding.detail}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    data-ocid="scanner.clear_results.button"
                    onClick={clearScan}
                    className="mt-3 w-full py-2 text-[11px] font-bold tracking-[0.2em] uppercase rounded border border-border text-muted-foreground hover:text-foreground hover:border-cyber-cyan/40 transition-colors"
                  >
                    CLEAR RESULTS
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="mt-10 text-center text-[10px] text-muted-foreground">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}

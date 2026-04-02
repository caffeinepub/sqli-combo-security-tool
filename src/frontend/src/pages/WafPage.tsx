import {
  AlertTriangle,
  Ban,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Globe,
  Lock,
  MonitorPlay,
  RefreshCw,
  Shield,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Wifi,
  Zap,
} from "lucide-react";
import { useState } from "react";
import WafSimulationModal from "../components/WafSimulationModal";
import type { BlockedIp } from "../types";

interface WafPageProps {
  blockedIps: BlockedIp[];
  onUnblockIp: (id: string) => void;
}

interface WafRule {
  id: string;
  name: string;
  type: string;
  severity: "critical" | "high" | "medium";
  pattern: string;
  action: "BLOCK" | "LOG" | "CHALLENGE";
  hits: number;
  enabled: boolean;
  owasp: string;
}

const INITIAL_WAF_RULES: WafRule[] = [
  {
    id: "waf-1",
    name: "SQL Injection Guard",
    type: "SQLi",
    severity: "critical",
    pattern: "UNION SELECT|' OR '1'='1|DROP TABLE|xp_cmdshell",
    action: "BLOCK",
    hits: 247,
    enabled: true,
    owasp: "A03:2021",
  },
  {
    id: "waf-2",
    name: "XSS Filter",
    type: "XSS",
    severity: "high",
    pattern: "<script>|javascript:|onerror=|onload=|<svg/onload",
    action: "BLOCK",
    hits: 189,
    enabled: true,
    owasp: "A03:2021",
  },
  {
    id: "waf-3",
    name: "CSRF Token Enforcer",
    type: "CSRF",
    severity: "high",
    pattern: "Missing X-CSRF-Token on state-change requests",
    action: "BLOCK",
    hits: 54,
    enabled: true,
    owasp: "A01:2021",
  },
  {
    id: "waf-4",
    name: "Command Injection Shield",
    type: "CMDi",
    severity: "critical",
    pattern: "; cat /etc|&& whoami|`uname|\\$({IFS})|%3B%20ls",
    action: "BLOCK",
    hits: 31,
    enabled: true,
    owasp: "A03:2021",
  },
  {
    id: "waf-5",
    name: "Path Traversal Blocker",
    type: "LFI",
    severity: "high",
    pattern: "../|..\\\\|%2F%2E%2E|%252F|..%00",
    action: "BLOCK",
    hits: 78,
    enabled: true,
    owasp: "A01:2021",
  },
  {
    id: "waf-6",
    name: "Rate Limiter",
    type: "DDoS",
    severity: "high",
    pattern: ">500 req/min per IP to /api/*",
    action: "BLOCK",
    hits: 412,
    enabled: true,
    owasp: "A05:2021",
  },
  {
    id: "waf-7",
    name: "Brute Force Guard",
    type: "BruteForce",
    severity: "high",
    pattern: ">10 failed logins per IP in 15 min",
    action: "BLOCK",
    hits: 166,
    enabled: true,
    owasp: "A07:2021",
  },
  {
    id: "waf-8",
    name: "MITM/SSL Enforcer",
    type: "MITM",
    severity: "critical",
    pattern: "HTTP Strict Transport Security — downgrade attempt",
    action: "BLOCK",
    hits: 19,
    enabled: true,
    owasp: "A02:2021",
  },
  {
    id: "waf-9",
    name: "Bot Signature Detector",
    type: "Bot",
    severity: "medium",
    pattern: "curl/|python-requests/|Nikto|sqlmap|masscan",
    action: "CHALLENGE",
    hits: 533,
    enabled: true,
    owasp: "A05:2021",
  },
  {
    id: "waf-10",
    name: "Header Injection Filter",
    type: "HeaderInject",
    severity: "medium",
    pattern: "\\r\\n in headers|X-Forwarded-For manipulation",
    action: "LOG",
    hits: 22,
    enabled: false,
    owasp: "A03:2021",
  },
];

const BLOCKED_REQUESTS_LOG = [
  {
    id: "r1",
    time: "08:21:04",
    ip: "45.227.253.111",
    rule: "SQL Injection Guard",
    method: "POST",
    path: "/api/login",
    severity: "critical",
  },
  {
    id: "r2",
    time: "08:19:52",
    ip: "91.108.56.22",
    rule: "XSS Filter",
    method: "GET",
    path: "/search?q=<script>",
    severity: "high",
  },
  {
    id: "r3",
    time: "08:17:30",
    ip: "77.88.55.66",
    rule: "Command Injection Shield",
    method: "POST",
    path: "/api/ping",
    severity: "critical",
  },
  {
    id: "r4",
    time: "08:14:11",
    ip: "194.165.16.11",
    rule: "Path Traversal Blocker",
    method: "GET",
    path: "/files?path=../../etc",
    severity: "high",
  },
  {
    id: "r5",
    time: "08:12:44",
    ip: "185.156.73.44",
    rule: "Brute Force Guard",
    method: "POST",
    path: "/api/auth",
    severity: "high",
  },
  {
    id: "r6",
    time: "08:10:02",
    ip: "198.54.117.200",
    rule: "Rate Limiter",
    method: "GET",
    path: "/api/data",
    severity: "high",
  },
  {
    id: "r7",
    time: "08:07:15",
    ip: "5.188.206.14",
    rule: "MITM/SSL Enforcer",
    method: "GET",
    path: "/",
    severity: "critical",
  },
  {
    id: "r8",
    time: "08:03:58",
    ip: "62.233.57.12",
    rule: "XSS Filter",
    method: "POST",
    path: "/api/comment",
    severity: "high",
  },
];

const SEVERITY_COLORS: Record<string, string> = {
  critical: "text-red-400 border-red-400/40",
  high: "text-orange-400 border-orange-400/40",
  medium: "text-yellow-400 border-yellow-400/40",
};

const ACTION_COLORS: Record<string, string> = {
  BLOCK: "text-red-400 bg-red-400/10 border-red-400/30",
  LOG: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  CHALLENGE: "text-blue-400 bg-blue-400/10 border-blue-400/30",
};

export default function WafPage({ blockedIps, onUnblockIp }: WafPageProps) {
  const [rules, setRules] = useState<WafRule[]>(INITIAL_WAF_RULES);
  const [wafEnabled, setWafEnabled] = useState(true);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"rules" | "blocked" | "ips">(
    "rules",
  );
  const [showSimulation, setShowSimulation] = useState(false);

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    );
  };

  const totalBlocked = rules.reduce(
    (sum, r) => sum + (r.enabled ? r.hits : 0),
    0,
  );
  const activeRules = rules.filter((r) => r.enabled).length;

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Lock size={16} className="text-cyber-cyan" />
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            COMBO DEFENSE CONSOLE
          </p>
        </div>
        <h1 className="text-2xl font-mono font-bold text-foreground tracking-widest">
          SECURE WEB APPLICATION FIREWALL
        </h1>
        <p className="text-xs font-mono text-muted-foreground mt-1">
          Real-time WAF rule management, blocked request log, and IP block list
        </p>
      </div>

      {/* VIEW ATTACK SIMULATION button */}
      <div className="mb-5">
        <button
          type="button"
          onClick={() => setShowSimulation(true)}
          data-ocid="waf.open_modal_button"
          className="relative flex items-center gap-3 px-6 py-3 rounded-lg border-2 font-mono text-sm font-bold tracking-widest transition-all group overflow-hidden"
          style={{
            borderColor: "rgba(0,229,255,0.55)",
            color: "#00e5ff",
            background: "rgba(0,229,255,0.04)",
            boxShadow:
              "0 0 20px rgba(0,229,255,0.12), inset 0 0 20px rgba(0,229,255,0.03)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 0 35px rgba(0,229,255,0.3), inset 0 0 30px rgba(0,229,255,0.07)";
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(0,229,255,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 0 20px rgba(0,229,255,0.12), inset 0 0 20px rgba(0,229,255,0.03)";
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(0,229,255,0.04)";
          }}
        >
          {/* Animated scan line */}
          <span
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(0,229,255,0.08) 50%, transparent 100%)",
              animation: "scanLine 2.5s linear infinite",
            }}
          />
          <MonitorPlay size={18} style={{ color: "#00e5ff" }} />
          <span>▶ VIEW ATTACK SIMULATION</span>
          <span
            className="text-[9px] font-mono tracking-widest ml-2 px-1.5 py-0.5 rounded border"
            style={{
              borderColor: "rgba(0,255,65,0.4)",
              color: "#00ff41",
              background: "rgba(0,255,65,0.08)",
            }}
          >
            LIVE DEMO
          </span>
          <style>{`
            @keyframes scanLine {
              from { transform: translateX(-100%); }
              to   { transform: translateX(200%); }
            }
          `}</style>
        </button>
        <p className="text-[9px] font-mono text-muted-foreground/60 mt-1.5 ml-1 tracking-widest">
          Visualize how WAF intercepts attacks and redirects to honeypot clone
        </p>
      </div>

      {/* WAF Master Switch */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {wafEnabled ? (
            <ShieldCheck size={28} className="text-green-400" />
          ) : (
            <ShieldOff size={28} className="text-red-400" />
          )}
          <div>
            <p className="text-sm font-mono font-bold text-foreground tracking-widest">
              FIREWALL STATUS
            </p>
            <p
              className={`text-xs font-mono tracking-widest ${
                wafEnabled ? "text-green-400" : "text-red-400"
              }`}
            >
              {wafEnabled
                ? "● ACTIVE — PROTECTING"
                : "○ DISABLED — UNPROTECTED"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-mono font-bold text-cyber-cyan">
                {activeRules}
              </p>
              <p className="text-[9px] font-mono text-muted-foreground uppercase">
                ACTIVE RULES
              </p>
            </div>
            <div>
              <p className="text-lg font-mono font-bold text-red-400">
                {totalBlocked.toLocaleString()}
              </p>
              <p className="text-[9px] font-mono text-muted-foreground uppercase">
                TOTAL BLOCKED
              </p>
            </div>
            <div>
              <p className="text-lg font-mono font-bold text-orange-400">
                {blockedIps.length}
              </p>
              <p className="text-[9px] font-mono text-muted-foreground uppercase">
                BLOCKED IPs
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setWafEnabled((v) => !v)}
            className={`px-4 py-2 rounded font-mono text-xs font-bold border tracking-widest transition-colors ${
              wafEnabled
                ? "border-red-500/50 text-red-400 hover:bg-red-500/10"
                : "border-green-500/50 text-green-400 hover:bg-green-500/10"
            }`}
          >
            {wafEnabled ? "DISABLE WAF" : "ENABLE WAF"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {(["rules", "blocked", "ips"] as const).map((tab) => (
          <button
            type="button"
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded text-[11px] font-mono tracking-widest transition-colors border ${
              activeTab === tab
                ? "bg-cyber-cyan/10 text-cyber-cyan border-cyber-cyan/40"
                : "text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            {tab === "rules"
              ? "WAF RULES"
              : tab === "blocked"
                ? "BLOCKED REQUESTS"
                : "BLOCKED IPs"}
            {tab === "ips" && blockedIps.length > 0 && (
              <span className="ml-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded px-1">
                {blockedIps.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* WAF Rules Tab */}
      {activeTab === "rules" && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={12} className="text-cyber-cyan" />
              <span className="text-[10px] font-mono text-cyber-cyan uppercase tracking-widest">
                {rules.length} RULES CONFIGURED
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground">
              <RefreshCw size={10} />
              <span>LAST SYNCED: 08:21:04</span>
            </div>
          </div>
          <div className="divide-y divide-border">
            {rules.map((rule) => (
              <div key={rule.id}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-secondary/10 transition-colors ${
                    !rule.enabled ? "opacity-50" : ""
                  }`}
                >
                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleRule(rule.id)}
                    className={`relative w-8 h-4 rounded-full transition-colors shrink-0 ${
                      rule.enabled ? "bg-green-500/40" : "bg-red-500/20"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${
                        rule.enabled
                          ? "left-[18px] bg-green-400"
                          : "left-0.5 bg-red-400"
                      }`}
                    />
                  </button>

                  {/* Rule info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-foreground">
                        {rule.name}
                      </span>
                      <span
                        className={`text-[9px] font-mono border rounded px-1 py-0.5 ${SEVERITY_COLORS[rule.severity]}`}
                      >
                        {rule.severity.toUpperCase()}
                      </span>
                      <span
                        className={`text-[9px] font-mono border rounded px-1 py-0.5 ${ACTION_COLORS[rule.action]}`}
                      >
                        {rule.action}
                      </span>
                      <span className="text-[9px] font-mono text-muted-foreground">
                        {rule.owasp}
                      </span>
                    </div>
                  </div>

                  {/* Hits */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-mono font-bold text-cyber-cyan">
                      {rule.hits.toLocaleString()}
                    </p>
                    <p className="text-[9px] font-mono text-muted-foreground">
                      HITS
                    </p>
                  </div>

                  {/* Expand */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedRule(expandedRule === rule.id ? null : rule.id)
                    }
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {expandedRule === rule.id ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                </div>

                {/* Expanded pattern */}
                {expandedRule === rule.id && (
                  <div className="px-4 pb-3 ml-11">
                    <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1">
                      MATCH PATTERN
                    </p>
                    <code className="text-[10px] font-mono text-yellow-300/80 bg-yellow-500/5 border border-yellow-500/10 rounded px-2 py-1 block">
                      {rule.pattern}
                    </code>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blocked Requests Tab */}
      {activeTab === "blocked" && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Ban size={12} className="text-red-400" />
            <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest">
              BLOCKED REQUESTS LOG
            </span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {[
                  "TIME",
                  "SOURCE IP",
                  "RULE TRIGGERED",
                  "METHOD",
                  "PATH",
                  "SEVERITY",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left text-[9px] font-mono uppercase tracking-widest text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BLOCKED_REQUESTS_LOG.map((req) => (
                <tr
                  key={req.id}
                  className="border-b border-border/40 hover:bg-secondary/10 transition-colors"
                >
                  <td className="px-4 py-2 text-[10px] font-mono text-muted-foreground">
                    {req.time}
                  </td>
                  <td className="px-4 py-2 text-[10px] font-mono text-cyber-cyan">
                    {req.ip}
                  </td>
                  <td className="px-4 py-2 text-[10px] font-mono text-foreground">
                    {req.rule}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`text-[9px] font-mono border rounded px-1 py-0.5 ${
                        req.method === "POST"
                          ? "text-orange-400 border-orange-400/30"
                          : "text-blue-400 border-blue-400/30"
                      }`}
                    >
                      {req.method}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-[10px] font-mono text-muted-foreground max-w-[200px] truncate">
                    <code>{req.path}</code>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`text-[9px] font-mono border rounded px-1.5 py-0.5 ${SEVERITY_COLORS[req.severity]}`}
                    >
                      {req.severity.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Blocked IPs Tab */}
      {activeTab === "ips" && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe size={12} className="text-red-400" />
              <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest">
                BLOCKED IP ADDRESSES ({blockedIps.length})
              </span>
            </div>
          </div>
          {blockedIps.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle size={24} className="text-green-400 mx-auto mb-2" />
              <p className="text-xs font-mono text-muted-foreground">
                NO IPs CURRENTLY BLOCKED
              </p>
              <p className="text-[10px] font-mono text-muted-foreground/60 mt-1">
                Block IPs from the Live Map, Attack Popup, or Detect alerts
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {[
                    "IP ADDRESS",
                    "REASON",
                    "BLOCKED BY",
                    "BLOCKED AT",
                    "ACTION",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2 text-left text-[9px] font-mono uppercase tracking-widest text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {blockedIps.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-border/40 hover:bg-secondary/10 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Ban size={10} className="text-red-400" />
                        <span className="text-[11px] font-mono font-bold text-red-400">
                          {entry.ip}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[10px] font-mono text-muted-foreground max-w-[200px] truncate">
                      {entry.reason}
                    </td>
                    <td className="px-4 py-3 text-[10px] font-mono text-cyber-cyan truncate">
                      {entry.blockedBy}
                    </td>
                    <td className="px-4 py-3 text-[10px] font-mono text-muted-foreground">
                      {new Date(entry.blockedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onUnblockIp(entry.id)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono border border-green-500/40 text-green-400 hover:bg-green-500/10 transition-colors"
                      >
                        <Trash2 size={10} />
                        UNBLOCK
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Security posture summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          {
            icon: <Zap size={14} className="text-red-400" />,
            label: "SQL INJECTION",
            count: 247,
            color: "red",
          },
          {
            icon: <Globe size={14} className="text-orange-400" />,
            label: "XSS ATTACKS",
            count: 189,
            color: "orange",
          },
          {
            icon: <Wifi size={14} className="text-yellow-400" />,
            label: "BOT REQUESTS",
            count: 533,
            color: "yellow",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-card border border-border rounded-lg p-4 flex items-center gap-3"
          >
            <div
              className={`w-10 h-10 rounded-full bg-${item.color}-500/10 flex items-center justify-center`}
            >
              {item.icon}
            </div>
            <div>
              <p
                className={`text-xl font-mono font-bold text-${item.color}-400`}
              >
                {item.count}
              </p>
              <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                {item.label} BLOCKED TODAY
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* WAF Attack Simulation Modal */}
      <WafSimulationModal
        open={showSimulation}
        onClose={() => setShowSimulation(false)}
      />
    </div>
  );
}

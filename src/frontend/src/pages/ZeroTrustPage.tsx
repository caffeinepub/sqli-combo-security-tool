import { Fingerprint, ShieldCheck, ShieldOff } from "lucide-react";
import { useEffect, useState } from "react";
import type { ZeroTrustRequest } from "../types";

const PATHS = [
  "/api/v1/users",
  "/api/v1/auth",
  "/api/v1/admin/config",
  "/api/v1/data/export",
  "/dashboard",
  "/api/v1/payments",
  "/api/v1/reports",
  "/admin/panel",
  "/api/v1/profile",
  "/api/v1/audit-log",
];
const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];
const DENY_REASONS = [
  "Invalid JWT token",
  "Session expired",
  "Unauthorized IP range",
  "Rate limit exceeded",
  "Suspicious payload detected",
  "Missing MFA token",
  "Privilege escalation attempt",
];
const IPS = [
  "192.168.1.",
  "10.0.0.",
  "172.16.0.",
  "185.220.101.",
  "45.33.32.",
  "103.21.58.",
];

function generateRequest(): ZeroTrustRequest {
  const denied = Math.random() < 0.35;
  const ip = `${IPS[Math.floor(Math.random() * IPS.length)]}${Math.floor(Math.random() * 254 + 1)}`;
  const riskScore = denied
    ? Math.floor(Math.random() * 40 + 50)
    : Math.floor(Math.random() * 40 + 5);
  return {
    id: `zt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    ip,
    path: PATHS[Math.floor(Math.random() * PATHS.length)],
    method: METHODS[Math.floor(Math.random() * METHODS.length)],
    result: denied ? "denied" : "granted",
    reason: denied
      ? DENY_REASONS[Math.floor(Math.random() * DENY_REASONS.length)]
      : undefined,
    token: denied
      ? undefined
      : `eyJ.${Math.random().toString(36).slice(2, 10)}.sig`,
    riskScore,
  };
}

export default function ZeroTrustPage() {
  const [requests, setRequests] = useState<ZeroTrustRequest[]>(() =>
    Array.from({ length: 8 }, generateRequest),
  );
  const [trustScore, setTrustScore] = useState(72);

  useEffect(() => {
    const iv = setInterval(() => {
      const r = generateRequest();
      setRequests((prev) => [r, ...prev].slice(0, 50));
      setTrustScore((prev) => {
        const delta = r.result === "denied" ? -2 : 1;
        return Math.max(10, Math.min(100, prev + delta));
      });
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  const granted = requests.filter((r) => r.result === "granted").length;
  const denied = requests.filter((r) => r.result === "denied").length;
  const total = requests.length;
  const grantedPct = total > 0 ? Math.round((granted / total) * 100) : 0;
  const deniedPct = total > 0 ? Math.round((denied / total) * 100) : 0;
  const avgRisk =
    total > 0
      ? Math.round(requests.reduce((a, b) => a + b.riskScore, 0) / total)
      : 0;

  const trustColor =
    trustScore >= 70
      ? "text-green-400"
      : trustScore >= 40
        ? "text-yellow-400"
        : "text-red-400";
  const trustLabel =
    trustScore >= 70
      ? "TRUSTED"
      : trustScore >= 40
        ? "ELEVATED RISK"
        : "UNTRUSTED";

  const PRINCIPLES = [
    {
      title: "VERIFY EXPLICITLY",
      desc: "Always authenticate and authorize based on all available data points: identity, location, device, service.",
      active: trustScore > 50,
      icon: "🔐",
    },
    {
      title: "USE LEAST PRIVILEGE",
      desc: "Limit user access with Just-In-Time and Just-Enough-Access, risk-based adaptive policies.",
      active: denied > 0,
      icon: "🛡️",
    },
    {
      title: "ASSUME BREACH",
      desc: "Minimize blast radius. Encrypt everything. Verify end-to-end. Use analytics to get visibility.",
      active: true,
      icon: "⚠️",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground mb-2">
          <Fingerprint size={12} className="text-cyber-cyan" />
          <span>SOC MODULE</span>
        </div>
        <h1 className="text-2xl font-mono font-bold uppercase tracking-wide text-foreground mb-1">
          ZERO TRUST SECURITY ENGINE
        </h1>
        <p className="text-sm text-muted-foreground">
          Every request is validated. No implicit trust granted. Live access
          control feed.
        </p>
      </div>

      {/* Trust gauge + session summary */}
      <div className="grid grid-cols-2 gap-4">
        {/* Trust Score */}
        <div className="bg-card border border-border rounded p-5 flex flex-col items-center justify-center gap-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            SESSION TRUST SCORE
          </p>
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg
              className="absolute inset-0"
              viewBox="0 0 100 100"
              role="img"
              aria-label="Trust score gauge"
            >
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="oklch(0.22 0.01 248)"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke={
                  trustScore >= 70
                    ? "#00ff88"
                    : trustScore >= 40
                      ? "#ffcc00"
                      : "#ff3333"
                }
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(trustScore / 100) * 276.46} 276.46`}
                transform="rotate(-90 50 50)"
                style={{ transition: "stroke-dasharray 0.5s ease" }}
              />
            </svg>
            <div className="text-center">
              <p className={`text-2xl font-mono font-bold ${trustColor}`}>
                {trustScore}
              </p>
              <p className={`text-[8px] font-mono font-bold ${trustColor}`}>
                {trustLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Session Summary */}
        <div className="bg-card border border-border rounded p-4 space-y-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            SESSION SUMMARY
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                label: "TOTAL REQUESTS",
                value: total,
                color: "text-foreground",
              },
              {
                label: "GRANTED",
                value: `${grantedPct}%`,
                color: "text-green-400",
              },
              {
                label: "DENIED",
                value: `${deniedPct}%`,
                color: "text-red-400",
              },
              {
                label: "AVG RISK SCORE",
                value: avgRisk,
                color: avgRisk > 50 ? "text-red-400" : "text-yellow-400",
              },
            ].map((s) => (
              <div key={s.label} className="bg-secondary/20 rounded p-2">
                <p className="text-[9px] font-mono text-muted-foreground uppercase">
                  {s.label}
                </p>
                <p className={`text-lg font-mono font-bold ${s.color}`}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Zero Trust Principles */}
      <div className="grid grid-cols-3 gap-3">
        {PRINCIPLES.map((p) => (
          <div
            key={p.title}
            className={`border rounded p-4 transition-all ${
              p.active
                ? "border-cyber-cyan/40 bg-cyber-cyan/5"
                : "border-border/30 bg-secondary/5"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{p.icon}</span>
              {p.active ? (
                <ShieldCheck size={12} className="text-green-400" />
              ) : (
                <ShieldOff size={12} className="text-muted-foreground/30" />
              )}
            </div>
            <p
              className={`text-[10px] font-mono font-bold uppercase tracking-widest mb-1 ${
                p.active ? "text-cyber-cyan" : "text-muted-foreground/40"
              }`}
            >
              {p.title}
            </p>
            <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
              {p.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Live request feed */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-foreground">
            LIVE REQUEST VALIDATION FEED
          </p>
          <span className="ml-auto text-[9px] font-mono text-muted-foreground">
            Updates every 3s
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {[
                  "TIME",
                  "IP",
                  "PATH",
                  "METHOD",
                  "TOKEN",
                  "RESULT",
                  "RISK",
                  "REASON",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left text-[9px] font-mono uppercase tracking-widest text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.slice(0, 15).map((req, idx) => (
                <tr
                  key={req.id}
                  data-ocid={`zero-trust.row.${idx + 1}`}
                  className={`border-b border-border/30 text-[10px] font-mono transition-colors ${
                    req.result === "denied"
                      ? "bg-red-900/10 hover:bg-red-900/15"
                      : "hover:bg-secondary/10"
                  }`}
                >
                  <td className="px-3 py-2 text-muted-foreground">
                    {new Date(req.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-3 py-2 text-cyber-cyan/80">{req.ip}</td>
                  <td className="px-3 py-2 text-foreground">{req.path}</td>
                  <td className="px-3 py-2">
                    <span className="text-[9px] font-mono text-muted-foreground border border-border/50 rounded px-1">
                      {req.method}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {req.token ? (
                      <span className="text-[9px] text-green-400">✓ VALID</span>
                    ) : (
                      <span className="text-[9px] text-red-400">✗ MISSING</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        req.result === "granted"
                          ? "text-green-400 border-green-500/40 bg-green-400/10"
                          : "text-red-400 border-red-500/40 bg-red-400/10"
                      }`}
                    >
                      {req.result.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`font-bold ${
                        req.riskScore > 75
                          ? "text-red-400"
                          : req.riskScore > 50
                            ? "text-orange-400"
                            : req.riskScore > 25
                              ? "text-yellow-400"
                              : "text-green-400"
                      }`}
                    >
                      {req.riskScore}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground/70 text-[9px]">
                    {req.reason ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

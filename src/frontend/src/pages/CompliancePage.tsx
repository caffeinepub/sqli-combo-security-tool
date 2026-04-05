import { ClipboardCheck } from "lucide-react";
import type { AttackEvent } from "../types";

interface CompliancePageProps {
  attackEvents: AttackEvent[];
}

const OWASP_MAP = [
  {
    id: "A01:2021",
    title: "Broken Access Control",
    nist: "Protect",
    attackTypes: [
      "CSRF",
      "Directory Traversal",
      "Privilege Escalation",
      "Session Hijack",
    ],
    desc: "Restrictions on what authenticated users are allowed to do are not properly enforced.",
    color: "border-red-500/40 bg-red-500/5",
    badge: "text-red-400 border-red-500/40 bg-red-400/10",
  },
  {
    id: "A02:2021",
    title: "Cryptographic Failures",
    nist: "Protect",
    attackTypes: ["MITM", "Session Hijack Token Replay"],
    desc: "Failures related to cryptography that lead to exposure of sensitive data.",
    color: "border-orange-500/40 bg-orange-500/5",
    badge: "text-orange-400 border-orange-500/40 bg-orange-400/10",
  },
  {
    id: "A03:2021",
    title: "Injection",
    nist: "Detect",
    attackTypes: [
      "SQLi",
      "SQL Injection",
      "XSS",
      "Command Injection",
      "Script Injection",
      "Cross-Site Scripting",
    ],
    desc: "User-supplied data is not validated, filtered, or sanitized by the application.",
    color: "border-red-600/40 bg-red-600/5",
    badge: "text-red-400 border-red-500/40 bg-red-400/10",
  },
  {
    id: "A04:2021",
    title: "Insecure Design",
    nist: "Identify",
    attackTypes: ["Business Logic Abuse"],
    desc: "Missing or ineffective control design — a broad category representing different weaknesses.",
    color: "border-yellow-500/40 bg-yellow-500/5",
    badge: "text-yellow-400 border-yellow-500/40 bg-yellow-400/10",
  },
  {
    id: "A05:2021",
    title: "Security Misconfiguration",
    nist: "Identify",
    attackTypes: ["DNS Spoofing", "Buffer Overflow"],
    desc: "Missing appropriate security hardening, permissive permissions, unnecessary features enabled.",
    color: "border-yellow-500/40 bg-yellow-500/5",
    badge: "text-yellow-400 border-yellow-500/40 bg-yellow-400/10",
  },
  {
    id: "A06:2021",
    title: "Vulnerable & Outdated Components",
    nist: "Identify",
    attackTypes: ["Buffer Overflow"],
    desc: "Using components with known vulnerabilities that undermine application defenses.",
    color: "border-orange-500/40 bg-orange-500/5",
    badge: "text-orange-400 border-orange-500/40 bg-orange-400/10",
  },
  {
    id: "A07:2021",
    title: "Identification & Authentication Failures",
    nist: "Protect",
    attackTypes: [
      "Brute Force",
      "Credential Stuffing",
      "Forced Login",
      "Session Hijack",
    ],
    desc: "Confirmation of the user's identity, authentication, and session management is not done correctly.",
    color: "border-red-500/40 bg-red-500/5",
    badge: "text-red-400 border-red-500/40 bg-red-400/10",
  },
  {
    id: "A08:2021",
    title: "Software & Data Integrity Failures",
    nist: "Protect",
    attackTypes: ["Script Injection"],
    desc: "Code and infrastructure not protected against integrity violations (CI/CD, auto-update).",
    color: "border-purple-500/40 bg-purple-500/5",
    badge: "text-purple-400 border-purple-500/40 bg-purple-400/10",
  },
  {
    id: "A09:2021",
    title: "Security Logging & Monitoring Failures",
    nist: "Detect",
    attackTypes: [],
    desc: "Insufficient logging and monitoring — attacks go undetected for extended periods.",
    color: "border-blue-500/40 bg-blue-500/5",
    badge: "text-blue-400 border-blue-500/40 bg-blue-400/10",
  },
  {
    id: "A10:2021",
    title: "Server-Side Request Forgery (SSRF)",
    nist: "Protect",
    attackTypes: ["SSRF"],
    desc: "SSRF flaws occur when a web app fetches a remote resource without validating the user-supplied URL.",
    color: "border-cyan-500/40 bg-cyan-500/5",
    badge: "text-cyan-400 border-cyan-500/40 bg-cyan-400/10",
  },
];

const NIST_COLORS: Record<string, string> = {
  Identify: "text-blue-400 border-blue-400/40 bg-blue-400/10",
  Protect: "text-green-400 border-green-400/40 bg-green-400/10",
  Detect: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
  Respond: "text-orange-400 border-orange-400/40 bg-orange-400/10",
  Recover: "text-purple-400 border-purple-400/40 bg-purple-400/10",
};

export default function CompliancePage({ attackEvents }: CompliancePageProps) {
  const attackTypeSet = new Set(
    attackEvents.flatMap((e) => [
      e.attackType,
      e.name,
      e.attackType?.replace(" Replay", ""),
    ]),
  );

  const mapWithCounts = OWASP_MAP.map((owasp) => {
    const hits = attackEvents.filter((ev) =>
      owasp.attackTypes.some(
        (t) =>
          ev.attackType?.toLowerCase().includes(t.toLowerCase()) ||
          ev.name?.toLowerCase().includes(t.toLowerCase()),
      ),
    ).length;
    return { ...owasp, hits };
  });

  const covered = mapWithCounts.filter(
    (m) => m.hits > 0 || m.attackTypes.length === 0,
  ).length;
  const coveragePercent = Math.round((covered / OWASP_MAP.length) * 100);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground mb-2">
          <ClipboardCheck size={12} className="text-cyber-cyan" />
          <span>SOC MODULE</span>
        </div>
        <h1 className="text-2xl font-mono font-bold uppercase tracking-wide text-foreground mb-1">
          COMPLIANCE &amp; REGULATORY MAPPING
        </h1>
        <p className="text-sm text-muted-foreground">
          OWASP Top 10 coverage mapped to NIST CSF categories and detected
          attack events.
        </p>
      </div>

      {/* Compliance bar */}
      <div className="bg-card border border-border rounded p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-foreground">
            OWASP TOP 10 COVERAGE
          </p>
          <span className="text-lg font-mono font-bold text-cyber-cyan">
            {coveragePercent}%
          </span>
        </div>
        <div className="w-full h-2.5 rounded bg-secondary overflow-hidden">
          <div
            className="h-full rounded bg-cyber-cyan transition-all duration-700"
            style={{ width: `${coveragePercent}%` }}
          />
        </div>
        <div className="flex gap-4 mt-3">
          {Object.entries(NIST_COLORS).map(([nist, cls]) => (
            <div key={nist} className="flex items-center gap-1">
              <span
                className={`text-[8px] font-mono font-bold px-1 py-0.5 rounded border ${cls}`}
              >
                {nist.toUpperCase()}
              </span>
            </div>
          ))}
          <span className="text-[9px] font-mono text-muted-foreground ml-auto">
            NIST CSF categories
          </span>
        </div>
      </div>

      {/* OWASP cards grid */}
      <div className="grid grid-cols-2 gap-3">
        {mapWithCounts.map((owasp, idx) => (
          <div
            key={owasp.id}
            data-ocid={`compliance.item.${idx + 1}`}
            className={`border rounded p-4 transition-all duration-300 ${
              owasp.hits > 0
                ? `${owasp.color} shadow-sm`
                : "border-border/30 bg-secondary/5"
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${owasp.badge}`}
                >
                  {owasp.id}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className={`text-[8px] font-mono font-bold px-1 py-0.5 rounded border ${
                    NIST_COLORS[owasp.nist] ?? "text-muted-foreground"
                  }`}
                >
                  {owasp.nist.toUpperCase()}
                </span>
                {owasp.hits > 0 && (
                  <span className="text-[9px] font-mono font-bold text-red-400 border border-red-500/40 bg-red-400/10 rounded px-1.5 py-0.5">
                    {owasp.hits} incident{owasp.hits !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
            <p
              className={`text-[11px] font-mono font-bold mb-1 ${
                owasp.hits > 0 ? "text-foreground" : "text-muted-foreground/60"
              }`}
            >
              {owasp.title}
            </p>
            <p className="text-[10px] text-muted-foreground/70 mb-2 leading-relaxed">
              {owasp.desc}
            </p>
            {owasp.attackTypes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {owasp.attackTypes.map((at) => (
                  <span
                    key={at}
                    className={`text-[8px] font-mono px-1 py-0.5 rounded border ${
                      attackTypeSet.has(at) ||
                      [...attackTypeSet].some((s) =>
                        s?.toLowerCase().includes(at.toLowerCase()),
                      )
                        ? "text-red-400 border-red-500/40 bg-red-400/10"
                        : "text-muted-foreground/40 border-border/30"
                    }`}
                  >
                    {at}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Attack to OWASP mapping table */}
      {attackEvents.length > 0 && (
        <div className="bg-card border border-border rounded overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-foreground">
              ATTACK → OWASP MAPPING
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {[
                    "ATTACK NAME",
                    "TYPE",
                    "OWASP ID",
                    "CATEGORY",
                    "NIST CSF",
                    "SEVERITY",
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
                {attackEvents
                  .slice(-15)
                  .reverse()
                  .map((ev, idx) => {
                    const match = OWASP_MAP.find((o) =>
                      o.attackTypes.some(
                        (t) =>
                          ev.attackType
                            ?.toLowerCase()
                            .includes(t.toLowerCase()) ||
                          ev.name?.toLowerCase().includes(t.toLowerCase()),
                      ),
                    );
                    return (
                      <tr
                        key={ev.id}
                        data-ocid={`compliance.row.${idx + 1}`}
                        className="border-b border-border/40 hover:bg-secondary/10"
                      >
                        <td className="px-3 py-2 text-[10px] font-mono text-foreground">
                          {ev.name}
                        </td>
                        <td className="px-3 py-2 text-[10px] font-mono text-muted-foreground">
                          {ev.attackType}
                        </td>
                        <td className="px-3 py-2">
                          {match ? (
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${match.badge}`}
                            >
                              {match.id}
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono text-muted-foreground/40">
                              N/A
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-[10px] font-mono text-muted-foreground">
                          {match?.title ?? "—"}
                        </td>
                        <td className="px-3 py-2">
                          {match && (
                            <span
                              className={`text-[9px] font-mono px-1 py-0.5 rounded border ${
                                NIST_COLORS[match.nist] ?? ""
                              }`}
                            >
                              {match.nist}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                              ev.severity === "critical"
                                ? "text-red-400 border-red-500/40 bg-red-400/10"
                                : ev.severity === "high"
                                  ? "text-orange-400 border-orange-500/40 bg-orange-400/10"
                                  : "text-yellow-400 border-yellow-500/40 bg-yellow-400/10"
                            }`}
                          >
                            {ev.severity?.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

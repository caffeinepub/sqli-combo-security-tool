import { Braces } from "lucide-react";
import { useEffect, useState } from "react";
import type { ApiAttackLog } from "../types";

const API_ENDPOINTS = [
  "/api/v1/users",
  "/api/v1/auth/login",
  "/api/v1/admin/config",
  "/api/v1/data/export",
  "/api/v1/payments",
  "/api/v1/reports",
  "/api/v1/profile/update",
  "/api/v2/graphql",
];

const CLEAN_PAYLOADS = [
  `{"username": "john_doe", "password": "secure123"}`,
  `{"page": 1, "limit": 20, "sort": "name"}`,
  `{"token": "Bearer eyJ0eXAiOiJKV1Q", "user_id": 42}`,
  `{"query": "SELECT id FROM users WHERE active=1"}`,
];

const MALICIOUS_PAYLOADS: {
  payload: string;
  type: ApiAttackLog["attackType"];
  fields: string[];
}[] = [
  {
    payload: `{"username": "admin', DROP TABLE users;--", "role": "admin"}`,
    type: "json-injection",
    fields: ["username"],
  },
  {
    payload: `{"__proto__": {"admin": true}, "id": 1}`,
    type: "suspicious-payload",
    fields: ["__proto__"],
  },
  {
    payload: "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJyb2xlIjoiYWRtaW4ifQ.",
    type: "token-tampering",
    fields: ["alg=none", "role=admin"],
  },
  {
    payload: `{"data": [{"id": 1}, {"id": 2}, ...x1000]}`,
    type: "suspicious-payload",
    fields: ["oversized-array"],
  },
  {
    payload: `{"cmd": "ls -la /etc/passwd", "debug": true}`,
    type: "json-injection",
    fields: ["cmd"],
  },
];

function generateApiLog(): ApiAttackLog {
  const isMalicious = Math.random() < 0.35;
  if (isMalicious) {
    const m =
      MALICIOUS_PAYLOADS[Math.floor(Math.random() * MALICIOUS_PAYLOADS.length)];
    const mlScore = Math.floor(Math.random() * 30 + 65);
    return {
      id: `api-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: new Date().toISOString(),
      endpoint: API_ENDPOINTS[Math.floor(Math.random() * API_ENDPOINTS.length)],
      method: ["POST", "PUT", "PATCH"][Math.floor(Math.random() * 3)],
      payload: m.payload,
      attackType: m.type,
      mlScore,
      maliciousFields: m.fields,
      blocked: mlScore > 75,
    };
  }
  return {
    id: `api-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    timestamp: new Date().toISOString(),
    endpoint: API_ENDPOINTS[Math.floor(Math.random() * API_ENDPOINTS.length)],
    method: ["GET", "POST", "PUT"][Math.floor(Math.random() * 3)],
    payload: CLEAN_PAYLOADS[Math.floor(Math.random() * CLEAN_PAYLOADS.length)],
    attackType: "clean",
    mlScore: Math.floor(Math.random() * 20 + 2),
    maliciousFields: [],
    blocked: false,
  };
}

const ATTACK_TYPE_LABELS: Record<string, string> = {
  "json-injection": "JSON INJECTION",
  "token-tampering": "TOKEN TAMPERING",
  "suspicious-payload": "SUSPICIOUS PAYLOAD",
  clean: "CLEAN",
};

const ATTACK_EXAMPLES = [
  {
    type: "JSON INJECTION",
    payload: `{"username": "admin', DROP TABLE users;--", "role": "admin"}`,
    desc: "SQL code embedded in JSON body field",
  },
  {
    type: "TOKEN TAMPERING",
    payload: "eyJhbGciOiJub25lIn0.eyJyb2xlIjoiYWRtaW4ifQ.",
    desc: "JWT with alg=none and role=admin injected",
  },
  {
    type: "SUSPICIOUS PAYLOAD",
    payload: `{"__proto__": {"admin": true}, "constructor": {...}}`,
    desc: "Prototype pollution attempt via JSON body",
  },
];

export default function APISecurityPage() {
  const [logs, setLogs] = useState<ApiAttackLog[]>(() =>
    Array.from({ length: 8 }, generateApiLog),
  );

  useEffect(() => {
    const iv = setInterval(() => {
      setLogs((prev) => [generateApiLog(), ...prev].slice(0, 60));
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  const total = logs.length;
  const threats = logs.filter((l) => l.attackType !== "clean").length;
  const blocked = logs.filter((l) => l.blocked).length;
  const avgScore =
    total > 0 ? Math.round(logs.reduce((a, b) => a + b.mlScore, 0) / total) : 0;

  const typeCounts = logs.reduce(
    (acc, l) => {
      if (l.attackType !== "clean") {
        acc[l.attackType] = (acc[l.attackType] ?? 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground mb-2">
          <Braces size={12} className="text-cyber-cyan" />
          <span>SOC MODULE</span>
        </div>
        <h1 className="text-2xl font-mono font-bold uppercase tracking-wide text-foreground mb-1">
          API ATTACK DETECTION &amp; MONITORING
        </h1>
        <p className="text-sm text-muted-foreground">
          Real-time ML analysis of API requests — detecting JSON injection,
          token tampering, and suspicious payloads.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "TOTAL API CALLS", value: total, color: "text-foreground" },
          { label: "THREATS DETECTED", value: threats, color: "text-red-400" },
          { label: "BLOCKED", value: blocked, color: "text-orange-400" },
          {
            label: "AVG ML SCORE",
            value: avgScore,
            color: avgScore > 40 ? "text-red-400" : "text-green-400",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-card border border-border rounded p-3"
          >
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
              {s.label}
            </p>
            <p className={`text-2xl font-mono font-bold ${s.color}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Attack type breakdown */}
        <div className="bg-card border border-border rounded p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
            ATTACK TYPE BREAKDOWN
          </p>
          <div className="space-y-3">
            {Object.entries(typeCounts).length === 0 ? (
              <p className="text-[11px] font-mono text-muted-foreground/40">
                No threats detected yet
              </p>
            ) : (
              Object.entries(typeCounts).map(([type, count]) => (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-foreground">
                      {ATTACK_TYPE_LABELS[type] ?? type}
                    </span>
                    <span className="text-[10px] font-mono text-red-400 font-bold">
                      {count}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded bg-red-400/60 transition-all duration-500"
                      style={{
                        width: `${Math.round((count / (threats || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sample payloads panel */}
        <div className="col-span-2 bg-card border border-border rounded p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
            ATTACK PAYLOAD EXAMPLES
          </p>
          <div className="space-y-3">
            {ATTACK_EXAMPLES.map((ex) => (
              <div
                key={ex.type}
                className="bg-red-900/10 border border-red-500/20 rounded p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-mono text-red-400 font-bold border border-red-500/30 rounded px-1.5 py-0.5">
                    {ex.type}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground">
                    {ex.desc}
                  </span>
                </div>
                <code className="text-[9px] font-mono text-red-300 break-all">
                  {ex.payload}
                </code>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live API log table */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-foreground">
            LIVE API REQUEST LOG
          </p>
          <span className="ml-auto text-[9px] font-mono text-muted-foreground">
            Updates every 4s
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {[
                  "TIME",
                  "ENDPOINT",
                  "METHOD",
                  "ATTACK TYPE",
                  "MALICIOUS FIELDS",
                  "ML SCORE",
                  "STATUS",
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
              {logs.slice(0, 20).map((log, idx) => (
                <tr
                  key={log.id}
                  data-ocid={`api-security.row.${idx + 1}`}
                  className={`border-b border-border/30 text-[10px] font-mono transition-colors ${
                    log.blocked
                      ? "bg-red-900/15 hover:bg-red-900/20"
                      : log.attackType !== "clean"
                        ? "bg-yellow-900/10 hover:bg-yellow-900/15"
                        : "hover:bg-secondary/10"
                  }`}
                >
                  <td className="px-3 py-2 text-muted-foreground">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-3 py-2 text-cyber-cyan/80 max-w-[120px] truncate">
                    {log.endpoint}
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-[8px] border border-border/50 rounded px-1 text-muted-foreground">
                      {log.method}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        log.attackType === "json-injection"
                          ? "text-red-400 border-red-500/40 bg-red-400/10"
                          : log.attackType === "token-tampering"
                            ? "text-orange-400 border-orange-500/40 bg-orange-400/10"
                            : log.attackType === "suspicious-payload"
                              ? "text-yellow-400 border-yellow-500/40 bg-yellow-400/10"
                              : "text-green-400 border-green-500/40 bg-green-400/10"
                      }`}
                    >
                      {ATTACK_TYPE_LABELS[log.attackType] ?? log.attackType}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-0.5">
                      {log.maliciousFields.length === 0 ? (
                        <span className="text-green-400/60">—</span>
                      ) : (
                        log.maliciousFields.map((f) => (
                          <span
                            key={f}
                            className="text-[8px] font-mono text-red-400 border border-red-500/30 bg-red-400/10 rounded px-1"
                          >
                            {f}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1.5 rounded bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded transition-all ${
                            log.mlScore > 75
                              ? "bg-red-400"
                              : log.mlScore > 40
                                ? "bg-yellow-400"
                                : "bg-green-400"
                          }`}
                          style={{ width: `${log.mlScore}%` }}
                        />
                      </div>
                      <span
                        className={`font-bold ${
                          log.mlScore > 75
                            ? "text-red-400"
                            : log.mlScore > 40
                              ? "text-yellow-400"
                              : "text-green-400"
                        }`}
                      >
                        {log.mlScore}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        log.blocked
                          ? "text-red-400 border-red-500/40 bg-red-400/10"
                          : "text-green-400 border-green-500/40 bg-green-400/10"
                      }`}
                    >
                      {log.blocked ? "BLOCKED" : "ALLOWED"}
                    </span>
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

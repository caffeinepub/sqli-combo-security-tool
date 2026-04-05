import {
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Pause,
  Play,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { AttackEvent } from "../types";

interface AttackChainPageProps {
  attackEvents: AttackEvent[];
}

const CHAIN_STAGES = [
  {
    id: "recon",
    label: "RECON",
    icon: "🔍",
    color: "border-blue-500/50 bg-blue-500/10 text-blue-400",
    glowColor: "shadow-blue-500/20",
    description: "Reconnaissance & Enumeration",
    details:
      "Attacker scans ports, fingerprints services, harvests emails, maps attack surface via OSINT and active probing.",
    iocs: [
      "Port scan activity (SYN/TCP)",
      "DNS enumeration queries",
      "Service version detection",
      "Subdomain brute-force",
    ],
  },
  {
    id: "injection",
    label: "INJECTION",
    icon: "💉",
    color: "border-orange-500/50 bg-orange-500/10 text-orange-400",
    glowColor: "shadow-orange-500/20",
    description: "Payload Delivery & Injection",
    details:
      "Crafted malicious payloads are injected into input vectors: SQL parameters, script tags, API bodies, auth fields.",
    iocs: [
      "SQL UNION SELECT payloads",
      "XSS script tag injection",
      "Command separator chars",
      "Obfuscated encoding (%27, %3D)",
    ],
  },
  {
    id: "exploitation",
    label: "EXPLOITATION",
    icon: "💥",
    color: "border-red-500/50 bg-red-500/10 text-red-400",
    glowColor: "shadow-red-500/20",
    description: "Vulnerability Exploitation",
    details:
      "Exploit succeeds — authentication bypassed, code executed, privilege escalated, session token hijacked.",
    iocs: [
      "Auth bypass confirmation",
      "Error-based data extraction",
      "RCE shell callback",
      "Session token theft",
    ],
  },
  {
    id: "data-access",
    label: "DATA ACCESS",
    icon: "📂",
    color: "border-purple-500/50 bg-purple-500/10 text-purple-400",
    glowColor: "shadow-purple-500/20",
    description: "Data Exfiltration & Persistence",
    details:
      "Sensitive data extracted — user records, credentials, PII, financial data. Backdoor implanted for persistence.",
    iocs: [
      "Large outbound data transfer",
      "Credential dump access",
      "Persistence mechanism created",
      "Lateral movement signals",
    ],
  },
];

const TEMPLATE_CHAINS = [
  { name: "SQL Injection Chain", type: "SQLi", severity: "critical" },
  { name: "XSS Attack Chain", type: "XSS", severity: "high" },
  { name: "Brute Force Chain", type: "Brute Force", severity: "high" },
  {
    name: "Command Injection Chain",
    type: "Command Injection",
    severity: "critical",
  },
];

export default function AttackChainPage({
  attackEvents,
}: AttackChainPageProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  const recentEvents = attackEvents.slice(-10).reverse();
  const allChains = [
    ...recentEvents.map((e) => ({
      name: e.name,
      type: e.attackType,
      severity: e.severity,
    })),
    ...TEMPLATE_CHAINS,
  ];
  const selectedChain = allChains[selectedIdx] ?? allChains[0];

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally reset on selectedIdx change
  useEffect(() => {
    setCurrentStep(0);
  }, [selectedIdx]);

  useEffect(() => {
    if (!autoPlay) return;
    const iv = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= CHAIN_STAGES.length - 1) {
          setAutoPlay(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1800);
    return () => clearInterval(iv);
  }, [autoPlay]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground mb-2">
          <GitBranch size={12} className="text-cyber-cyan" />
          <span>SOC MODULE</span>
        </div>
        <h1 className="text-2xl font-mono font-bold uppercase tracking-wide text-foreground mb-1">
          ATTACK CHAIN VISUALIZATION
        </h1>
        <p className="text-sm text-muted-foreground">
          Visualize the full lifecycle of an attack from initial recon through
          to data exfiltration.
        </p>
      </div>

      {/* Chain selector */}
      <div className="bg-card border border-border rounded p-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
          SELECT ATTACK CHAIN
        </p>
        <div className="flex flex-wrap gap-2">
          {allChains.map((chain, idx) => (
            <button
              key={`chain-${chain.name}-${idx}`}
              type="button"
              data-ocid={`attack-chain.item.${idx + 1}`}
              onClick={() => setSelectedIdx(idx)}
              className={`px-3 py-1.5 rounded border text-[10px] font-mono transition-colors ${
                selectedIdx === idx
                  ? "bg-cyber-cyan/10 text-cyber-cyan border-cyber-cyan/40"
                  : "text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {chain.name}
              <span
                className={`ml-1.5 text-[8px] ${
                  chain.severity === "critical"
                    ? "text-red-400"
                    : chain.severity === "high"
                      ? "text-orange-400"
                      : "text-yellow-400"
                }`}
              >
                [{chain.severity?.toUpperCase()}]
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Active chain display */}
      <div className="bg-card border border-border rounded p-5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-0.5">
              ACTIVE CHAIN
            </p>
            <p className="text-sm font-mono font-bold text-foreground">
              {selectedChain?.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-ocid="attack-chain.secondary_button"
              onClick={() => setCurrentStep((p) => Math.max(0, p - 1))}
              disabled={currentStep === 0}
              className="p-1.5 rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              data-ocid="attack-chain.toggle"
              onClick={() => setAutoPlay((p) => !p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-[10px] font-mono transition-colors ${
                autoPlay
                  ? "border-yellow-400/40 text-yellow-400 bg-yellow-400/10"
                  : "border-cyber-cyan/40 text-cyber-cyan bg-cyber-cyan/10"
              }`}
            >
              {autoPlay ? <Pause size={12} /> : <Play size={12} />}
              {autoPlay ? "PAUSE" : "AUTO PLAY"}
            </button>
            <button
              type="button"
              data-ocid="attack-chain.primary_button"
              onClick={() =>
                setCurrentStep((p) => Math.min(CHAIN_STAGES.length - 1, p + 1))
              }
              disabled={currentStep === CHAIN_STAGES.length - 1}
              className="p-1.5 rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Flow diagram */}
        <div className="flex items-stretch gap-0 mb-6">
          {CHAIN_STAGES.map((stage, i) => (
            <div key={stage.id} className="flex items-center flex-1">
              <button
                type="button"
                className={`flex-1 border rounded p-4 transition-all duration-500 cursor-pointer text-left ${
                  i <= currentStep
                    ? `${stage.color} shadow-lg ${stage.glowColor}`
                    : "border-border/30 bg-secondary/10 text-muted-foreground/30"
                }`}
                onClick={() => setCurrentStep(i)}
              >
                <div className="text-xl mb-1">{stage.icon}</div>
                <p
                  className={`text-[9px] font-mono font-bold uppercase tracking-widest mb-1 ${
                    i <= currentStep ? "" : "text-muted-foreground/30"
                  }`}
                >
                  STAGE {i + 1}
                </p>
                <p
                  className={`text-[11px] font-mono font-bold uppercase tracking-wide ${
                    i <= currentStep ? "" : "opacity-30"
                  }`}
                >
                  {stage.label}
                </p>
                {i === currentStep && (
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-current animate-pulse" />
                )}
              </button>
              {i < CHAIN_STAGES.length - 1 && (
                <div
                  className={`w-6 h-0.5 mx-1 transition-all duration-500 ${
                    i < currentStep ? "bg-cyber-cyan" : "bg-border/30"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Current stage detail */}
        {CHAIN_STAGES[currentStep] && (
          <div
            className={`border rounded p-4 transition-all duration-300 ${CHAIN_STAGES[currentStep].color}`}
          >
            <p className="text-[10px] font-mono uppercase tracking-widest opacity-70 mb-1">
              {CHAIN_STAGES[currentStep].description}
            </p>
            <p className="text-sm font-mono text-foreground mb-3">
              {CHAIN_STAGES[currentStep].details}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {CHAIN_STAGES[currentStep].iocs.map((ioc) => (
                <div key={ioc} className="flex items-center gap-2">
                  <span className="text-current opacity-50">›</span>
                  <span className="text-[10px] font-mono text-foreground/80">
                    {ioc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Attack events table */}
      {attackEvents.length > 0 && (
        <div className="bg-card border border-border rounded overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-foreground">
              RECENT ATTACK EVENTS — CHAIN MAPPING
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {[
                    "ATTACK NAME",
                    "TYPE",
                    "SEVERITY",
                    "CITY",
                    "ATTACKER IP",
                    "CHAIN STAGE",
                    "TIMESTAMP",
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
                  .slice(-10)
                  .reverse()
                  .map((ev, idx) => {
                    // Map attack type to likely chain stage
                    const stageIdx = ev.attackType
                      ?.toLowerCase()
                      .includes("recon")
                      ? 0
                      : ev.attackType?.toLowerCase().includes("data") ||
                          ev.attackType?.toLowerCase().includes("credential")
                        ? 3
                        : ev.attackType?.toLowerCase().includes("exploit") ||
                            ev.attackType?.toLowerCase().includes("privilege")
                          ? 2
                          : 1;
                    const stage = CHAIN_STAGES[stageIdx];
                    return (
                      <tr
                        key={ev.id}
                        data-ocid={`attack-chain.row.${idx + 1}`}
                        className="border-b border-border/40 hover:bg-secondary/10 transition-colors"
                      >
                        <td className="px-3 py-2 text-[10px] font-mono text-foreground">
                          {ev.name}
                        </td>
                        <td className="px-3 py-2 text-[10px] font-mono text-muted-foreground">
                          {ev.attackType}
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
                        <td className="px-3 py-2 text-[10px] font-mono text-muted-foreground">
                          {ev.city}
                        </td>
                        <td className="px-3 py-2 text-[10px] font-mono text-cyber-cyan/80">
                          {ev.attackerIp}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${stage.color}`}
                          >
                            {stage.label}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[9px] font-mono text-muted-foreground">
                          {new Date(ev.timestamp).toLocaleTimeString()}
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

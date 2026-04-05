import { CheckCircle, Circle, ServerCrash, Zap } from "lucide-react";
import type { SiemEvent } from "../types";

interface SIEMPageProps {
  siemEvents: SiemEvent[];
}

const PIPELINE_STEPS = [
  {
    key: "alert",
    label: "ALERT RECEIVED",
    color: "text-red-400",
    bg: "bg-red-400/10 border-red-400/30",
  },
  {
    key: "ingestion",
    label: "LOG INGESTION",
    color: "text-orange-400",
    bg: "bg-orange-400/10 border-orange-400/30",
  },
  {
    key: "correlation",
    label: "CORRELATION",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10 border-yellow-400/30",
  },
  {
    key: "incident",
    label: "INCIDENT CREATED",
    color: "text-cyber-cyan",
    bg: "bg-cyber-cyan/10 border-cyber-cyan/30",
  },
] as const;

function StatusBadge({ status }: { status: SiemEvent["status"] }) {
  const map = {
    ingested: "text-blue-400 border-blue-400/40 bg-blue-400/10",
    correlated: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
    incident: "text-red-400 border-red-400/40 bg-red-400/10",
    closed: "text-muted-foreground border-border bg-secondary/30",
  };
  return (
    <span
      className={`inline-flex px-1.5 py-0.5 rounded-sm border text-[9px] font-mono uppercase tracking-wider ${map[status]}`}
    >
      {status}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: SiemEvent["severity"] }) {
  const map = {
    critical: "text-red-400 border-red-500/50 bg-red-400/10",
    high: "text-orange-400 border-orange-500/50 bg-orange-400/10",
    medium: "text-yellow-400 border-yellow-500/50 bg-yellow-400/10",
    low: "text-green-400 border-green-500/50 bg-green-400/10",
  };
  return (
    <span
      className={`inline-flex px-1.5 py-0.5 rounded-sm border text-[9px] font-mono uppercase ${map[severity]}`}
    >
      {severity}
    </span>
  );
}

function PipelineTracker({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-1">
      {PIPELINE_STEPS.map((step, i) => (
        <div key={step.key} className="flex items-center gap-1">
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[8px] font-mono transition-all duration-500 ${
              i <= currentStep
                ? step.bg
                : "text-muted-foreground/30 border-border/30 bg-transparent"
            }`}
          >
            {i < currentStep ? (
              <CheckCircle size={7} className="shrink-0" />
            ) : i === currentStep ? (
              <Zap size={7} className="shrink-0 animate-pulse" />
            ) : (
              <Circle size={7} className="shrink-0" />
            )}
            <span
              className={`hidden lg:inline ${i <= currentStep ? step.color : ""}`}
            >
              {step.label}
            </span>
          </div>
          {i < PIPELINE_STEPS.length - 1 && (
            <div
              className={`w-3 h-px ${
                i < currentStep ? "bg-cyber-cyan/60" : "bg-border/40"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function SIEMPage({ siemEvents }: SIEMPageProps) {
  const totalEvents = siemEvents.length;
  const incidents = siemEvents.filter((e) => e.status === "incident").length;
  const open = siemEvents.filter((e) => e.status !== "closed").length;
  const correlated = siemEvents.filter((e) => e.status === "correlated").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground mb-2">
          <ServerCrash size={12} className="text-cyber-cyan" />
          <span>SOC MODULE</span>
          <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded border border-cyber-cyan/30 text-cyber-cyan/70">
            ADMIN ONLY
          </span>
        </div>
        <h1 className="text-2xl font-mono font-bold uppercase tracking-wide text-foreground mb-1">
          SECURITY INFORMATION &amp; EVENT MANAGEMENT
        </h1>
        <p className="text-sm text-muted-foreground">
          Unified event pipeline — ingest, correlate, and escalate security
          alerts into actionable incidents.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: "TOTAL EVENTS",
            value: totalEvents,
            color: "text-foreground",
          },
          { label: "INCIDENTS", value: incidents, color: "text-red-400" },
          { label: "CORRELATED", value: correlated, color: "text-yellow-400" },
          { label: "OPEN", value: open, color: "text-orange-400" },
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

      {/* Pipeline visualization */}
      <div className="bg-card border border-border rounded p-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
          SIEM PIPELINE
        </p>
        <div className="flex items-center justify-between gap-2">
          {PIPELINE_STEPS.map((step, i) => (
            <div key={step.key} className="flex items-center gap-2 flex-1">
              <div
                className={`flex-1 border rounded p-3 text-center ${step.bg}`}
              >
                <p
                  className={`text-[10px] font-mono font-bold uppercase tracking-widest ${step.color}`}
                >
                  {step.label}
                </p>
                <p className="text-[9px] font-mono text-muted-foreground mt-1">
                  {i === 0 && "Alert forwarded from dashboard"}
                  {i === 1 && "Parse, normalize, enrich log"}
                  {i === 2 && "Pattern-match across events"}
                  {i === 3 && "Create ticket & notify team"}
                </p>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <div className="text-cyber-cyan/50 text-lg font-mono">
                  &rarr;
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Event table */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-foreground">
            SIEM EVENTS
          </p>
          {totalEvents === 0 && (
            <span className="text-[10px] font-mono text-muted-foreground">
              Forward alerts from DETECT page to populate
            </span>
          )}
        </div>

        {totalEvents === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 gap-3"
            data-ocid="siem.empty_state"
          >
            <ServerCrash size={32} className="text-muted-foreground/30" />
            <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">
              NO SIEM EVENTS YET
            </p>
            <p className="text-[10px] font-mono text-muted-foreground/60 text-center max-w-sm">
              Open the DETECT page, click OPEN/INV/RES on any alert, and use the
              &ldquo;FORWARD TO SIEM&rdquo; button in the detail modal to
              populate this feed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {[
                    "EVENT ID",
                    "SEVERITY",
                    "ATTACK TYPE",
                    "SOURCE IP",
                    "STATUS",
                    "PIPELINE",
                    "CORRELATED",
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
                {siemEvents.map((ev, idx) => (
                  <tr
                    key={ev.id}
                    data-ocid={`siem.event.item.${idx + 1}`}
                    className="border-b border-border/40 hover:bg-secondary/10 transition-colors"
                  >
                    <td className="px-3 py-2.5 text-[10px] font-mono text-cyber-cyan">
                      {ev.eventId}
                    </td>
                    <td className="px-3 py-2.5">
                      <SeverityBadge severity={ev.severity} />
                    </td>
                    <td className="px-3 py-2.5 text-[10px] font-mono text-foreground">
                      {ev.attackType}
                    </td>
                    <td className="px-3 py-2.5 text-[10px] font-mono text-muted-foreground">
                      {ev.sourceIp}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={ev.status} />
                    </td>
                    <td className="px-3 py-2.5">
                      <PipelineTracker currentStep={ev.currentStep} />
                    </td>
                    <td className="px-3 py-2.5 text-[10px] font-mono text-muted-foreground">
                      {ev.correlatedCount}
                    </td>
                    <td className="px-3 py-2.5 text-[9px] font-mono text-muted-foreground">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

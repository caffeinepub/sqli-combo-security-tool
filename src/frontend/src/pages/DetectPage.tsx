import { useState } from "react";
import type { Alert, AlertStatus, Severity } from "../types";

interface DetectPageProps {
  alerts: Alert[];
  onUpdateStatus: (alertId: string, status: AlertStatus) => void;
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

export default function DetectPage({
  alerts,
  onUpdateStatus,
}: DetectPageProps) {
  const [filter, setFilter] = useState<FilterTab>("all");

  const filtered =
    filter === "all" ? alerts : alerts.filter((a) => a.status === filter);

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
            {filtered.map((alert, idx) => (
              <tr
                key={alert.id}
                data-ocid={`detect.alert.item.${idx + 1}`}
                className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
              >
                <td className="px-4 py-3 text-xs font-mono text-foreground">
                  {alert.scenarioName}
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
                      onClick={() => onUpdateStatus(alert.id, "open")}
                      disabled={alert.status === "open"}
                      className="px-2 py-1 rounded text-[10px] font-mono border border-cyber-red/40 text-cyber-red hover:bg-cyber-red/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      OPEN
                    </button>
                    <button
                      type="button"
                      data-ocid={`detect.investigating.button.${idx + 1}`}
                      onClick={() => onUpdateStatus(alert.id, "investigating")}
                      disabled={alert.status === "investigating"}
                      className="px-2 py-1 rounded text-[10px] font-mono border border-cyber-yellow/40 text-cyber-yellow hover:bg-cyber-yellow/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      INV
                    </button>
                    <button
                      type="button"
                      data-ocid={`detect.resolved.button.${idx + 1}`}
                      onClick={() => onUpdateStatus(alert.id, "resolved")}
                      disabled={alert.status === "resolved"}
                      className="px-2 py-1 rounded text-[10px] font-mono border border-cyber-green/40 text-cyber-green hover:bg-cyber-green/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      RES
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

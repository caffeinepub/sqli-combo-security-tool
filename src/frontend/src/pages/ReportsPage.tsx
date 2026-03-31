import { Copy, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Alert } from "../types";

interface ReportsPageProps {
  threatLevel: number;
  preventionCoverage: number;
  alerts: Alert[];
}

export default function ReportsPage({
  threatLevel,
  preventionCoverage,
  alerts,
}: ReportsPageProps) {
  const [generated, setGenerated] = useState(new Date().toISOString());

  const openAlerts = alerts.filter((a) => a.status === "open");
  const criticalCount = alerts.filter(
    (a) => a.severity === "critical" && a.status !== "resolved",
  ).length;
  const highCount = alerts.filter(
    (a) => a.severity === "high" && a.status !== "resolved",
  ).length;

  const recommendations = [
    "Complete all pending prevention hardening tasks",
    `Investigate ${openAlerts.length} open alert(s) immediately`,
    `Prioritize ${criticalCount} critical and ${highCount} high severity findings`,
    "Run safe replays to validate detection coverage",
    "Review WAF rules and update to latest OWASP vectors",
  ];

  const handleRefresh = () => {
    setGenerated(new Date().toISOString());
    toast.success("Report snapshot refreshed.");
  };

  const summaryText = `SECURITY POSTURE REPORT — ${new Date(generated).toLocaleString()}

THREAT LEVEL: ${threatLevel}%
PREVENTION COVERAGE: ${preventionCoverage}%

EXECUTIVE SUMMARY:
The Combo Defense Console has detected ${alerts.length} total events. ${openAlerts.length} alerts remain open requiring triage. Prevention hardening is at ${preventionCoverage}% completion.

RECOMMENDATIONS:
${recommendations.map((r) => `• ${r}`).join("\n")}`;

  const handleCopy = () => {
    navigator.clipboard
      .writeText(summaryText)
      .then(() => toast.success("Report copied to clipboard."));
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground mb-4">
        <span className="text-cyber-cyan">■</span>
        <span>REPORTING LAYER</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-mono font-bold uppercase tracking-wide text-foreground mb-2">
            SECURITY POSTURE REPORT
          </h1>
          <p className="text-sm text-muted-foreground">
            Automated executive summary of current security posture and open
            findings.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            data-ocid="reports.refresh.button"
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-2 rounded border border-border text-[11px] font-mono text-muted-foreground hover:text-foreground hover:border-cyber-cyan/40 transition-colors"
          >
            <RefreshCw size={12} />
            REFRESH
          </button>
          <button
            type="button"
            data-ocid="reports.copy.button"
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-2 rounded border border-cyber-cyan/40 text-cyber-cyan text-[11px] font-mono hover:bg-cyber-cyan/10 transition-colors"
          >
            <Copy size={12} />
            COPY SUMMARY
          </button>
        </div>
      </div>

      <div className="col-span-3 bg-card border border-border rounded p-5 mb-6">
        <p className="text-[10px] font-mono uppercase tracking-widest text-cyber-cyan mb-3">
          LATEST SNAPSHOT
        </p>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
              THREAT LEVEL
            </p>
            <p className="text-3xl font-mono font-bold text-cyber-red">
              {threatLevel}%
            </p>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
              PREVENTION COVERAGE
            </p>
            <p className="text-3xl font-mono font-bold text-cyber-cyan">
              {preventionCoverage}%
            </p>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
              GENERATED
            </p>
            <p className="text-xs font-mono text-foreground">
              {new Date(generated).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded p-5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
            EXECUTIVE SUMMARY
          </p>
          <p className="text-xs text-foreground leading-relaxed">
            The Combo Defense Console has detected{" "}
            <span className="text-cyber-cyan font-mono">{alerts.length}</span>{" "}
            total security events across all simulated attack vectors.{" "}
            <span className="text-cyber-red font-mono">
              {openAlerts.length}
            </span>{" "}
            alerts remain open and require immediate triage. Prevention
            hardening is at{" "}
            <span className="text-cyber-cyan font-mono">
              {preventionCoverage}%
            </span>{" "}
            completion. The current threat posture indicates{" "}
            <span className="text-cyber-red font-mono">{criticalCount}</span>{" "}
            critical and{" "}
            <span className="text-cyber-orange font-mono">{highCount}</span>{" "}
            high severity findings pending resolution.
          </p>

          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-4 mb-2">
            RECOMMENDATIONS
          </p>
          <ul className="space-y-1.5">
            {recommendations.map((rec) => (
              <li
                key={rec}
                className="flex items-start gap-2 text-xs text-muted-foreground"
              >
                <span className="text-cyber-cyan font-mono shrink-0">›</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-card border border-border rounded p-5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
            TOP OPEN ALERTS
          </p>
          {openAlerts.length === 0 ? (
            <p
              className="text-xs font-mono text-cyber-green"
              data-ocid="reports.empty_state"
            >
              ✓ NO OPEN ALERTS — ALL CLEAR
            </p>
          ) : (
            <div className="space-y-2" data-ocid="reports.alerts.list">
              {openAlerts.slice(0, 5).map((alert, idx) => (
                <div
                  key={alert.id}
                  data-ocid={`reports.alert.item.${idx + 1}`}
                  className="flex items-start gap-3 p-2 rounded bg-secondary/30"
                >
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm border ${
                      alert.severity === "critical"
                        ? "text-cyber-red border-cyber-red/40"
                        : "text-cyber-orange border-cyber-orange/40"
                    }`}
                  >
                    {alert.severity.toUpperCase()}
                  </span>
                  <div>
                    <p className="text-xs font-mono text-foreground">
                      {alert.scenarioName}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {alert.signal}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

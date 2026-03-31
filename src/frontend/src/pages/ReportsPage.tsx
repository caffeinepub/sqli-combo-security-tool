import { Download, FileText, Lock, X } from "lucide-react";
import { useState } from "react";
import type { Alert } from "../types";

interface ReportsPageProps {
  threatLevel: number;
  preventionCoverage: number;
  alerts: Alert[];
}

function StatusBadge({ status }: { status: string }) {
  if (status === "open") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-sm border border-red-400/40 text-red-400 text-[10px] font-mono tracking-widest">
        OPEN
      </span>
    );
  }
  if (status === "investigating") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-sm border border-yellow-400/40 text-yellow-400 text-[10px] font-mono tracking-widest">
        INVEST
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-sm border border-green-400/40 text-green-400 text-[10px] font-mono tracking-widest">
      RESOLVED
    </span>
  );
}

function MlScoreBar({ score }: { score: number }) {
  const color =
    score > 70 ? "bg-red-500" : score > 40 ? "bg-orange-400" : "bg-green-400";
  const textColor =
    score > 70
      ? "text-red-400"
      : score > 40
        ? "text-orange-400"
        : "text-green-400";
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
      <span className={`text-[10px] font-mono tabular-nums ${textColor}`}>
        {score}%
      </span>
    </div>
  );
}

export default function ReportsPage({ alerts }: ReportsPageProps) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const filteredAlerts = alerts.filter((a) => {
    const ts = new Date(a.timestamp).getTime();
    const from = appliedFrom ? new Date(appliedFrom).getTime() : 0;
    const to = appliedTo
      ? new Date(`${appliedTo}T23:59:59`).getTime()
      : Number.POSITIVE_INFINITY;
    return ts >= from && ts <= to;
  });

  const totalEvents = filteredAlerts.length;
  const openCount = filteredAlerts.filter((a) => a.status === "open").length;
  const resolvedCount = filteredAlerts.filter(
    (a) => a.status === "resolved",
  ).length;
  const criticalCount = filteredAlerts.filter(
    (a) => a.severity === "critical",
  ).length;

  const handleApplyFilter = () => {
    setAppliedFrom(fromDate);
    setAppliedTo(toDate);
  };

  const handleClear = () => {
    setFromDate("");
    setToDate("");
    setAppliedFrom("");
    setAppliedTo("");
  };

  const downloadCSV = () => {
    const headers = [
      "Timestamp",
      "Attack Type",
      "Attacker IP",
      "City",
      "Status",
      "Triggered By",
      "Resolved By",
      "ML Score",
    ];
    const rows = filteredAlerts.map((a) => [
      new Date(a.timestamp).toLocaleString(),
      a.attackType ?? a.scenarioName,
      a.hackerIp ?? "",
      a.city ?? "",
      a.status.toUpperCase(),
      a.triggeredBy ?? "",
      a.resolvedBy ?? "",
      `${a.mlThreatScore ?? 0}%`,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${v}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `attack-report-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    const printContent = `
      <html><head><title>Attack Activity Report</title>
      <style>
        body { font-family: monospace; background: #fff; color: #000; padding: 20px; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        p { font-size: 11px; color: #666; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        th { background: #111; color: #fff; padding: 6px 8px; text-align: left; }
        td { padding: 5px 8px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) { background: #f5f5f5; }
        .open { color: red; font-weight: bold; }
        .resolved { color: green; font-weight: bold; }
        .investigating { color: orange; font-weight: bold; }
      </style></head><body>
      <h1>COMBO DEFENSE CONSOLE — ATTACK ACTIVITY REPORT</h1>
      <p>Generated: ${new Date().toLocaleString()} | Total Events: ${filteredAlerts.length}</p>
      <table>
        <tr><th>Timestamp</th><th>Attack Type</th><th>IP</th><th>City</th><th>Status</th><th>Triggered By</th><th>Resolved By</th><th>ML Score</th></tr>
        ${filteredAlerts
          .map(
            (a) => `<tr>
          <td>${new Date(a.timestamp).toLocaleString()}</td>
          <td>${a.attackType ?? a.scenarioName}</td>
          <td>${a.hackerIp ?? "—"}</td>
          <td>${a.city ?? "—"}</td>
          <td class="${a.status}">${a.status.toUpperCase()}</td>
          <td>${a.triggeredBy ?? "—"}</td>
          <td>${a.resolvedBy ?? "—"}</td>
          <td>${a.mlThreatScore ?? 0}%</td>
        </tr>`,
          )
          .join("")}
      </table>
      </body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(printContent);
      win.document.close();
      win.print();
    }
  };

  return (
    <div className="p-6 min-h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground mb-3">
            <span className="text-cyber-cyan">■</span>
            <span>REPORTING LAYER</span>
          </div>
          <h1 className="text-2xl font-mono font-bold uppercase tracking-wide text-foreground mb-1">
            ATTACK ACTIVITY REPORT
          </h1>
          <p className="text-xs text-muted-foreground font-mono">
            Admin-only — Full attack event log with download options
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            data-ocid="reports.admin.badge"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-red-500/50 bg-red-500/10 text-red-400 text-[10px] font-mono tracking-widest"
          >
            <Lock size={10} />
            ADMIN RESTRICTED
          </span>
        </div>
      </div>

      {/* Date Range Filter */}
      <div
        data-ocid="reports.filter.panel"
        className="bg-card border border-border rounded p-4 mb-5"
      >
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
          DATE RANGE FILTER
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="report-from-date"
              className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest"
            >
              FROM DATE
            </label>
            <input
              id="report-from-date"
              data-ocid="reports.from_date.input"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-secondary border border-border rounded px-3 py-1.5 text-[11px] font-mono text-foreground focus:outline-none focus:border-cyber-cyan/60 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="report-to-date"
              className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest"
            >
              TO DATE
            </label>
            <input
              id="report-to-date"
              data-ocid="reports.to_date.input"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-secondary border border-border rounded px-3 py-1.5 text-[11px] font-mono text-foreground focus:outline-none focus:border-cyber-cyan/60 transition-colors"
            />
          </div>
          <button
            type="button"
            data-ocid="reports.apply_filter.button"
            onClick={handleApplyFilter}
            className="px-4 py-1.5 rounded border border-cyber-cyan/60 text-cyber-cyan text-[11px] font-mono tracking-widest hover:bg-cyber-cyan/10 transition-colors"
          >
            APPLY FILTER
          </button>
          <button
            type="button"
            data-ocid="reports.clear_filter.button"
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border text-muted-foreground text-[11px] font-mono tracking-widest hover:text-foreground hover:border-border/80 transition-colors"
          >
            <X size={11} />
            CLEAR
          </button>
          <span className="ml-auto text-[11px] font-mono text-cyber-cyan">
            SHOWING <span className="font-bold">{totalEvents}</span> EVENTS
          </span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <div
          data-ocid="reports.total_events.card"
          className="bg-card border border-border rounded p-4"
        >
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
            TOTAL EVENTS
          </p>
          <p className="text-2xl font-mono font-bold text-foreground">
            {totalEvents}
          </p>
        </div>
        <div
          data-ocid="reports.open_alerts.card"
          className="bg-card border border-border rounded p-4"
        >
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
            OPEN ALERTS
          </p>
          <p className="text-2xl font-mono font-bold text-red-400">
            {openCount}
          </p>
        </div>
        <div
          data-ocid="reports.resolved.card"
          className="bg-card border border-border rounded p-4"
        >
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
            RESOLVED
          </p>
          <p className="text-2xl font-mono font-bold text-green-400">
            {resolvedCount}
          </p>
        </div>
        <div
          data-ocid="reports.critical_events.card"
          className="bg-card border border-border rounded p-4"
        >
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
            CRITICAL EVENTS
          </p>
          <p className="text-2xl font-mono font-bold text-orange-400">
            {criticalCount}
          </p>
        </div>
      </div>

      {/* Download Buttons + Table */}
      <div className="bg-card border border-border rounded">
        {/* Table Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-muted-foreground" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              ATTACK EVENT LOG
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-ocid="reports.csv.download_button"
              onClick={downloadCSV}
              className="flex items-center gap-2 px-3 py-1.5 rounded border border-cyber-cyan/50 text-cyber-cyan text-[10px] font-mono tracking-widest hover:bg-cyber-cyan/10 transition-colors"
            >
              <Download size={11} />
              DOWNLOAD CSV
            </button>
            <button
              type="button"
              data-ocid="reports.pdf.download_button"
              onClick={downloadPDF}
              className="flex items-center gap-2 px-3 py-1.5 rounded border border-orange-500/50 text-orange-400 text-[10px] font-mono tracking-widest hover:bg-orange-500/10 transition-colors"
            >
              <Download size={11} />
              DOWNLOAD PDF
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {filteredAlerts.length === 0 ? (
            <div
              data-ocid="reports.empty_state"
              className="flex items-center justify-center py-16"
            >
              <p className="text-[11px] font-mono text-cyber-cyan tracking-widest">
                NO EVENTS MATCH THE SELECTED DATE RANGE
              </p>
            </div>
          ) : (
            <table className="w-full" data-ocid="reports.table">
              <thead>
                <tr className="bg-secondary/40 border-b border-border">
                  {[
                    "TIMESTAMP",
                    "ATTACK TYPE",
                    "ATTACKER IP",
                    "CITY",
                    "STATUS",
                    "TRIGGERED BY",
                    "RESOLVED BY",
                    "ML SCORE",
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((alert, idx) => (
                  <tr
                    key={alert.id}
                    data-ocid={`reports.alert.item.${idx + 1}`}
                    className={`border-b border-border/50 hover:bg-secondary/20 transition-colors ${
                      idx % 2 === 0 ? "bg-secondary/10" : ""
                    }`}
                  >
                    <td className="px-3 py-2.5 text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                      {new Date(alert.timestamp).toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] font-mono text-foreground max-w-[200px] truncate">
                      {alert.attackType ?? alert.scenarioName}
                    </td>
                    <td className="px-3 py-2.5 text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                      {alert.hackerIp ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-[10px] font-mono text-cyber-cyan whitespace-nowrap">
                      {alert.city ?? "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={alert.status} />
                    </td>
                    <td className="px-3 py-2.5 text-[10px] font-mono text-muted-foreground max-w-[160px] truncate">
                      {alert.triggeredBy ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-[10px] font-mono text-muted-foreground max-w-[160px] truncate">
                      {alert.resolvedBy ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 min-w-[100px]">
                      <MlScoreBar score={alert.mlThreatScore ?? 0} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-[10px] font-mono text-muted-foreground">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyber-cyan hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}

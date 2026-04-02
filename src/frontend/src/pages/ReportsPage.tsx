import { Copy, Download, FileText, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Alert } from "../types";

interface ReportsPageProps {
  threatLevel: number;
  preventionCoverage: number;
  alerts: Alert[];
}

const getCityFromId = (id: string) => {
  const cities = [
    "Mumbai",
    "Delhi",
    "Bengaluru",
    "Chennai",
    "Hyderabad",
    "Kolkata",
    "Pune",
    "Ahmedabad",
    "Jaipur",
    "Surat",
    "Lucknow",
    "Nagpur",
  ];
  return cities[id.charCodeAt(0) % cities.length];
};

const getMlScore = (id: string, severity: string) => {
  const last = id.charCodeAt(id.length - 1);
  if (severity === "critical") return 87 + (last % 13);
  if (severity === "high") return 65 + (last % 20);
  return 40 + (last % 25);
};

export default function ReportsPage({
  threatLevel,
  preventionCoverage,
  alerts,
}: ReportsPageProps) {
  const [generated, setGenerated] = useState(new Date().toISOString());
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>(alerts);
  const [isFiltered, setIsFiltered] = useState(false);

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

  const applyFilter = () => {
    let result = [...alerts];
    if (fromDate) {
      result = result.filter(
        (a) => new Date(a.timestamp) >= new Date(fromDate),
      );
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      result = result.filter((a) => new Date(a.timestamp) <= to);
    }
    setFilteredAlerts(result);
    setIsFiltered(true);
    toast.success(`Filtered: ${result.length} record(s) found.`);
  };

  const clearFilter = () => {
    setFromDate("");
    setToDate("");
    setFilteredAlerts(alerts);
    setIsFiltered(false);
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === "resolved") return "text-cyber-green border-cyber-green/40";
    if (status === "investigating")
      return "text-cyber-orange border-cyber-orange/40";
    return "text-cyber-red border-cyber-red/40";
  };

  const buildRows = (data: Alert[]) =>
    data.map((a) => ({
      timestamp: new Date(a.timestamp).toLocaleString(),
      attackType: a.attackType ?? a.scenarioName,
      ip:
        a.hackerIp ??
        `192.168.${a.id.charCodeAt(0) % 255}.${a.id.charCodeAt(1) % 255}`,
      city: getCityFromId(a.id),
      status: a.status.toUpperCase(),
      triggeredBy: "admin",
      resolvedBy: a.status === "resolved" ? "analyst" : "-",
      mlScore: `${getMlScore(a.id, a.severity)}%`,
      severity: a.severity,
    }));

  const downloadCsv = () => {
    const rows = buildRows(filteredAlerts);
    const header =
      "TIMESTAMP,ATTACK TYPE,ATTACKER IP,CITY,STATUS,TRIGGERED BY,RESOLVED BY,ML SCORE\n";
    const body = rows
      .map(
        (r) =>
          `"${r.timestamp}","${r.attackType}","${r.ip}","${r.city}","${r.status}","${r.triggeredBy}","${r.resolvedBy}","${r.mlScore}"`,
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `combo-defense-report-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded.");
  };

  const downloadPdf = () => {
    const rows = buildRows(filteredAlerts);
    const now = new Date();
    const dateRange =
      fromDate || toDate
        ? `${fromDate || "Start"} to ${toDate || "Now"}`
        : "All Records";

    const criticalRows = rows.filter((r) => r.severity === "critical").length;
    const highRows = rows.filter((r) => r.severity === "high").length;
    const mediumRows = rows.filter((r) => r.severity === "medium").length;
    const lowRows = rows.filter((r) => r.severity === "low").length;
    const resolvedRows = rows.filter((r) => r.status === "RESOLVED").length;
    const openRows = rows.filter((r) => r.status === "OPEN").length;

    const recRows = [
      "Complete all pending prevention hardening tasks",
      `Investigate ${openRows} open alert(s) immediately`,
      `Prioritize ${criticalRows} critical and ${highRows} high severity findings`,
      "Run safe replays to validate detection coverage",
      "Review WAF rules and update to latest OWASP threat vectors",
      "Enable IP blocking for repeat attackers via the WAF module",
      "Ensure TF-IDF + XGBoost model scores are reviewed per alert",
    ];

    const tableRows = rows
      .map(
        (r, i) => `
        <tr class="${i % 2 === 0 ? "row-even" : "row-odd"}">
          <td>${i + 1}</td>
          <td>${r.timestamp}</td>
          <td>${r.attackType}</td>
          <td>${r.ip}</td>
          <td>${r.city}</td>
          <td class="status-${r.status.toLowerCase()}">${r.status}</td>
          <td class="ml-score">${r.mlScore}</td>
        </tr>`,
      )
      .join("");

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Combo Defense Console — Attack Activity Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #000;
    color: #00ff99;
    font-family: 'Courier New', Courier, monospace;
    font-size: 11px;
    padding: 32px;
    line-height: 1.5;
  }
  .cover {
    text-align: center;
    margin-bottom: 40px;
    padding: 30px;
    border: 2px solid #00ff99;
    border-radius: 4px;
    background: #001a0d;
  }
  .cover h1 {
    font-size: 22px;
    letter-spacing: 6px;
    text-transform: uppercase;
    color: #00ff99;
    text-shadow: 0 0 12px #00ff99;
    margin-bottom: 6px;
  }
  .cover h2 {
    font-size: 14px;
    letter-spacing: 4px;
    color: #00ccff;
    text-shadow: 0 0 8px #00ccff;
    margin-bottom: 16px;
  }
  .cover .meta {
    color: #669988;
    font-size: 10px;
    letter-spacing: 2px;
  }
  .divider {
    color: #003322;
    font-size: 10px;
    margin: 16px 0;
    letter-spacing: 1px;
  }
  .section-title {
    font-size: 13px;
    letter-spacing: 4px;
    color: #00ccff;
    text-transform: uppercase;
    border-bottom: 1px solid #00ccff33;
    padding-bottom: 6px;
    margin-bottom: 14px;
    margin-top: 28px;
  }
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }
  .summary-card {
    background: #001a0d;
    border: 1px solid #00ff9933;
    border-radius: 3px;
    padding: 10px 14px;
  }
  .summary-card .label {
    font-size: 9px;
    letter-spacing: 2px;
    color: #669988;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .summary-card .value {
    font-size: 20px;
    font-weight: bold;
  }
  .value-critical { color: #ef4444; text-shadow: 0 0 6px #ef444466; }
  .value-high { color: #f97316; text-shadow: 0 0 6px #f9731666; }
  .value-medium { color: #eab308; text-shadow: 0 0 6px #eab30866; }
  .value-low { color: #22c55e; text-shadow: 0 0 6px #22c55e66; }
  .value-cyan { color: #00ccff; text-shadow: 0 0 6px #00ccff66; }
  .value-green { color: #00ff99; text-shadow: 0 0 6px #00ff9966; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
    font-size: 10px;
  }
  thead tr {
    background: #001a0d;
    border-bottom: 2px solid #00ff9933;
  }
  th {
    text-align: left;
    padding: 8px 10px;
    letter-spacing: 2px;
    color: #00ccff;
    font-size: 9px;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .row-even { background: #00060300; }
  .row-odd { background: #00110800; }
  td {
    padding: 6px 10px;
    border-bottom: 1px solid #00331122;
    color: #99ddbb;
    white-space: nowrap;
  }
  .status-open { color: #ef4444; }
  .status-resolved { color: #22c55e; }
  .status-investigating { color: #f97316; }
  .ml-score { color: #00ccff; }
  .rec-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .rec-list li {
    padding: 5px 0;
    border-bottom: 1px solid #00331133;
    color: #99ddbb;
  }
  .rec-list li::before {
    content: '▸  ';
    color: #00ff99;
  }
  .footer {
    margin-top: 40px;
    text-align: center;
    color: #336655;
    font-size: 9px;
    letter-spacing: 2px;
    border-top: 1px solid #003322;
    padding-top: 12px;
  }
  @media print {
    body { background: #000 !important; color: #00ff99 !important; }
    .cover { break-after: page; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<div class="cover">
  <h1>COMBO DEFENSE CONSOLE</h1>
  <h2>ATTACK ACTIVITY REPORT</h2>
  <div class="meta">
    <div>GENERATED: ${now.toLocaleString()}</div>
    <div>DATE RANGE: ${dateRange}</div>
    <div>REPORT BY: Combo Defense Console v32 — Cybersecurity Training Platform</div>
  </div>
</div>

<div class="divider">═══════════════════════════════════════════════════════════════════════════════</div>

<div class="section-title">EXECUTIVE SUMMARY</div>

<div class="summary-grid">
  <div class="summary-card">
    <div class="label">Total Events</div>
    <div class="value value-cyan">${rows.length}</div>
  </div>
  <div class="summary-card">
    <div class="label">Critical</div>
    <div class="value value-critical">${criticalRows}</div>
  </div>
  <div class="summary-card">
    <div class="label">High</div>
    <div class="value value-high">${highRows}</div>
  </div>
  <div class="summary-card">
    <div class="label">Medium</div>
    <div class="value value-medium">${mediumRows}</div>
  </div>
  <div class="summary-card">
    <div class="label">Low</div>
    <div class="value value-low">${lowRows}</div>
  </div>
  <div class="summary-card">
    <div class="label">Open Alerts</div>
    <div class="value value-critical">${openRows}</div>
  </div>
  <div class="summary-card">
    <div class="label">Resolved</div>
    <div class="value value-green">${resolvedRows}</div>
  </div>
  <div class="summary-card">
    <div class="label">Threat Level</div>
    <div class="value value-high">${threatLevel}%</div>
  </div>
</div>

<div class="divider">═══════════════════════════════════════════════════════════════════════════════</div>

<div class="section-title">ATTACK FINDINGS</div>

<table>
  <thead>
    <tr>
      <th>#</th>
      <th>Timestamp</th>
      <th>Attack Type</th>
      <th>Attacker IP</th>
      <th>City</th>
      <th>Status</th>
      <th>ML Score</th>
    </tr>
  </thead>
  <tbody>
    ${tableRows || "<tr><td colspan='7' style='text-align:center;color:#336655;padding:20px;'>NO RECORDS FOUND</td></tr>"}
  </tbody>
</table>

<div class="divider">═══════════════════════════════════════════════════════════════════════════════</div>

<div class="section-title">RECOMMENDATIONS</div>
<ul class="rec-list">
  ${recRows.map((r) => `<li>${r}</li>`).join("")}
</ul>

<div class="footer">
  GENERATED BY COMBO DEFENSE CONSOLE SECURITY PLATFORM &nbsp;|&nbsp; CONFIDENTIAL — FOR AUTHORIZED USE ONLY
</div>

</body>
</html>`;

    // Use print-in-iframe approach to save as PDF
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.top = "-9999px";
    iframe.style.left = "-9999px";
    iframe.style.width = "1px";
    iframe.style.height = "1px";
    iframe.style.opacity = "0";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      toast.error("Failed to generate PDF.");
      return;
    }

    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (_e) {
        // ignore
      }
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);

    toast.success("PDF report opened in print dialog — save as PDF.");
  };

  const previewRows = buildRows(filteredAlerts).slice(0, 8);

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

      {/* Download Attack Activity Report Section */}
      <div className="mt-6 bg-card border border-cyber-cyan/30 rounded p-5">
        <div className="flex items-center gap-2 mb-5">
          <FileText size={16} className="text-cyber-cyan" />
          <p className="text-[11px] font-mono uppercase tracking-widest text-cyber-cyan">
            DOWNLOAD ATTACK ACTIVITY REPORT
          </p>
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-wrap items-end gap-3 mb-5">
          <div>
            <label
              htmlFor="report-from"
              className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1"
            >
              FROM
            </label>
            <input
              id="report-from"
              type="date"
              data-ocid="reports.from.input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-secondary border border-border text-xs font-mono text-foreground rounded px-2 py-1.5 focus:outline-none focus:border-cyber-cyan/50"
            />
          </div>
          <div>
            <label
              htmlFor="report-to"
              className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1"
            >
              TO
            </label>
            <input
              id="report-to"
              type="date"
              data-ocid="reports.to.input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-secondary border border-border text-xs font-mono text-foreground rounded px-2 py-1.5 focus:outline-none focus:border-cyber-cyan/50"
            />
          </div>
          <button
            type="button"
            data-ocid="reports.filter.button"
            onClick={applyFilter}
            className="px-3 py-1.5 rounded border border-cyber-cyan/40 text-cyber-cyan text-[11px] font-mono hover:bg-cyber-cyan/10 transition-colors"
          >
            FILTER
          </button>
          {isFiltered && (
            <button
              type="button"
              data-ocid="reports.clear.button"
              onClick={clearFilter}
              className="px-3 py-1.5 rounded border border-border text-[11px] font-mono text-muted-foreground hover:text-foreground hover:border-cyber-cyan/30 transition-colors"
            >
              CLEAR
            </button>
          )}
          <span className="text-[10px] font-mono text-muted-foreground ml-auto">
            {filteredAlerts.length} record(s){" "}
            {isFiltered ? "(filtered)" : "total"}
          </span>
        </div>

        {/* Preview Table */}
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-[10px] font-mono border-collapse">
            <thead>
              <tr className="border-b border-border">
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
                    className="text-left text-muted-foreground uppercase tracking-widest py-2 pr-4 whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-4 text-center text-muted-foreground"
                    data-ocid="reports.table.empty_state"
                  >
                    NO RECORDS MATCH THE SELECTED DATE RANGE
                  </td>
                </tr>
              ) : (
                previewRows.map((row, idx) => (
                  <tr
                    key={row.timestamp + row.attackType}
                    data-ocid={`reports.row.item.${idx + 1}`}
                    className="border-b border-border/40 hover:bg-secondary/20 transition-colors"
                  >
                    <td className="py-2 pr-4 text-muted-foreground whitespace-nowrap">
                      {row.timestamp}
                    </td>
                    <td className="py-2 pr-4 text-foreground whitespace-nowrap">
                      {row.attackType}
                    </td>
                    <td className="py-2 pr-4 text-cyber-cyan whitespace-nowrap">
                      {row.ip}
                    </td>
                    <td className="py-2 pr-4 text-foreground whitespace-nowrap">
                      {row.city}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`px-1.5 py-0.5 rounded-sm border ${getStatusBadgeClass(filteredAlerts[idx]?.status ?? "open")}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {row.triggeredBy}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {row.resolvedBy}
                    </td>
                    <td className="py-2 pr-4">
                      <span className="text-cyber-green">{row.mlScore}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredAlerts.length > 8 && (
          <p className="text-[10px] font-mono text-muted-foreground mb-4">
            Showing 8 of {filteredAlerts.length} records. Download for full
            data.
          </p>
        )}

        {/* Download Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            data-ocid="reports.download_csv.button"
            onClick={downloadCsv}
            disabled={filteredAlerts.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded border border-cyber-cyan/40 text-cyber-cyan text-[11px] font-mono hover:bg-cyber-cyan/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={12} />
            DOWNLOAD CSV
          </button>
          <button
            type="button"
            data-ocid="reports.download_pdf.button"
            onClick={downloadPdf}
            disabled={filteredAlerts.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded border border-cyber-green/40 text-cyber-green text-[11px] font-mono hover:bg-cyber-green/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={12} />
            DOWNLOAD PDF
          </button>
        </div>
      </div>
    </div>
  );
}

import { Activity, Bell } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ThreatPoint } from "../types";

interface DashboardPageProps {
  threatLevel: number;
  openAlerts: number;
  blockedAttempts: number;
  simulatedAttacks: number;
  threatTrend: ThreatPoint[];
  preventionCoverage: number;
}

function StatCard({
  label,
  value,
  valueColor,
  sublabel,
}: {
  label: string;
  value: string | number;
  valueColor: string;
  sublabel?: string;
}) {
  return (
    <div className="bg-card border border-border rounded p-4 flex flex-col gap-1">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={`text-3xl font-mono font-bold ${valueColor}`}>{value}</p>
      {sublabel && (
        <p className="text-[10px] text-muted-foreground font-mono">
          {sublabel}
        </p>
      )}
    </div>
  );
}

export default function DashboardPage({
  threatLevel,
  openAlerts,
  blockedAttempts,
  simulatedAttacks,
  threatTrend,
  preventionCoverage,
}: DashboardPageProps) {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
          <span className="text-cyber-cyan">■</span>
          <span>DASHBOARD</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bell size={16} />
          </button>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Activity size={16} />
          </button>
        </div>
      </div>

      <p className="text-[10px] font-mono uppercase tracking-widest text-cyber-cyan mb-1">
        MISSION CONTROL
      </p>
      <h1 className="text-2xl font-mono font-bold uppercase tracking-wide text-foreground mb-2">
        LIVE THREAT DASHBOARD
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Real-time visibility into active threats, blocked attempts, and
        prevention coverage across all simulated vectors.
      </p>

      {/* Stats */}
      <div
        className="grid grid-cols-4 gap-4 mb-6"
        data-ocid="dashboard.stats.panel"
      >
        <StatCard
          label="THREAT LEVEL"
          value={`${threatLevel}%`}
          valueColor="text-cyber-red"
          sublabel="Current risk score"
        />
        <StatCard
          label="ACTIVE ALERTS"
          value={openAlerts}
          valueColor="text-cyber-yellow"
          sublabel="Awaiting triage"
        />
        <StatCard
          label="BLOCKED ATTEMPTS"
          value={blockedAttempts}
          valueColor="text-foreground"
          sublabel="Resolved detections"
        />
        <StatCard
          label="SIMULATED ATTACKS"
          value={simulatedAttacks}
          valueColor="text-foreground"
          sublabel="Total replays run"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Threat Trend */}
        <div className="col-span-2 bg-card border border-border rounded p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
            LIVE FEED
          </p>
          <p className="text-sm font-mono font-bold uppercase tracking-wide text-foreground mb-4">
            THREAT TREND
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart
              data={threatTrend}
              margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.22 0.01 248)"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="time"
                tick={{
                  fill: "oklch(0.55 0 0)",
                  fontSize: 10,
                  fontFamily: "monospace",
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fill: "oklch(0.55 0 0)",
                  fontSize: 10,
                  fontFamily: "monospace",
                }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.13 0.012 248)",
                  border: "1px solid oklch(0.22 0.01 248)",
                  borderRadius: 4,
                  fontFamily: "monospace",
                  fontSize: 11,
                }}
                labelStyle={{ color: "oklch(0.55 0 0)" }}
                itemStyle={{ color: "#00d4d4" }}
              />
              <Line
                type="monotone"
                dataKey="level"
                stroke="#00d4d4"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#00d4d4" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Prevention Coverage */}
        <div className="bg-card border border-border rounded p-4 flex flex-col">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
            HARDENING STATUS
          </p>
          <p className="text-sm font-mono font-bold uppercase tracking-wide text-foreground mb-4">
            PREVENTION COVERAGE
          </p>
          <div className="flex-1 flex flex-col items-center justify-center">
            <p className="text-5xl font-mono font-bold text-cyber-cyan mb-2">
              {preventionCoverage}%
            </p>
            <p className="text-[10px] font-mono text-muted-foreground mb-4">
              TASKS COMPLETED
            </p>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-cyber-cyan h-2 rounded-full transition-all duration-500"
                style={{ width: `${preventionCoverage}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

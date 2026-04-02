import { AlertTriangle, Clock, Globe, MapPin, Shield, Zap } from "lucide-react";
import { useEffect, useRef } from "react";
import type { AttackEvent } from "../types";

interface AttackTimelinePageProps {
  events: AttackEvent[];
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "text-red-400 border-red-500/60 bg-red-950/30",
  high: "text-orange-400 border-orange-500/60 bg-orange-950/30",
  medium: "text-yellow-400 border-yellow-500/60 bg-yellow-950/30",
  low: "text-green-400 border-green-500/60 bg-green-950/30",
};

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]",
  high: "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]",
  medium: "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]",
  low: "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]",
};

const SOURCE_LABEL: Record<string, { label: string; color: string }> = {
  auto: { label: "AUTO", color: "text-cyan-400 border-cyan-500/60" },
  manual: { label: "MANUAL", color: "text-purple-400 border-purple-500/60" },
  replay: { label: "REPLAY", color: "text-yellow-400 border-yellow-500/60" },
};

function formatTimestamp(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDate(ts: string) {
  const d = new Date(ts);
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AttackTimelinePage({
  events,
}: AttackTimelinePageProps) {
  const topRef = useRef<HTMLDivElement>(null);
  const sorted = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  // Scroll to top when new event appears
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div ref={topRef} />
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} className="text-cyber-cyan" />
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              COMBO DEFENSE CONSOLE
            </p>
          </div>
          <h1 className="text-2xl font-mono font-bold text-foreground tracking-widest">
            ATTACK TIMELINE
          </h1>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            Real-time chronological log of all attack events
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-card border border-border rounded px-4 py-2 text-center">
            <p className="text-2xl font-mono font-bold text-red-400">
              {events.length}
            </p>
            <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
              TOTAL EVENTS
            </p>
          </div>
          <div className="bg-card border border-border rounded px-4 py-2 text-center">
            <p className="text-2xl font-mono font-bold text-cyber-cyan">
              {events.filter((e) => e.severity === "critical").length}
            </p>
            <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
              CRITICAL
            </p>
          </div>
        </div>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2 mb-6">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        <span className="text-[10px] font-mono text-red-400 tracking-widest">
          LIVE FEED — AUTO-UPDATING
        </span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 p-3 bg-card border border-border rounded">
        {["critical", "high", "medium", "low"].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${SEVERITY_DOT[s]}`} />
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {s}
            </span>
          </div>
        ))}
        <div className="ml-auto flex gap-3">
          {Object.entries(SOURCE_LABEL).map(([k, v]) => (
            <span
              key={k}
              className={`text-[9px] font-mono border rounded px-1.5 py-0.5 ${v.color}`}
            >
              {v.label}
            </span>
          ))}
        </div>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Shield size={48} className="text-muted-foreground/30" />
          <p className="text-sm font-mono text-muted-foreground">
            NO ATTACK EVENTS YET
          </p>
          <p className="text-xs font-mono text-muted-foreground/60">
            Events will appear here as attacks are triggered or auto-generated
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />

          <div className="space-y-4">
            {sorted.map((event, idx) => {
              const prev = sorted[idx - 1];
              const showDateDivider =
                !prev ||
                formatDate(prev.timestamp) !== formatDate(event.timestamp);
              return (
                <div key={event.id}>
                  {showDateDivider && (
                    <div className="flex items-center gap-3 ml-10 mb-4 mt-2">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground px-2">
                        {formatDate(event.timestamp)}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}
                  <div className="flex gap-4 items-start">
                    {/* Timeline dot */}
                    <div className="relative z-10 flex-shrink-0 mt-3">
                      <span
                        className={`block w-4 h-4 rounded-full border-2 border-background ${SEVERITY_DOT[event.severity] ?? "bg-gray-500"}`}
                      />
                    </div>

                    {/* Card */}
                    <div
                      className={`flex-1 bg-card border rounded-lg p-4 transition-all hover:border-cyber-cyan/40 ${
                        idx === 0
                          ? "border-cyber-cyan/30 shadow-[0_0_12px_rgba(0,255,200,0.05)]"
                          : "border-border"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {idx === 0 && (
                            <span className="text-[9px] font-mono text-cyber-cyan border border-cyber-cyan/50 rounded px-1.5 py-0.5 animate-pulse">
                              LATEST
                            </span>
                          )}
                          <span
                            className={`text-[9px] font-mono border rounded px-1.5 py-0.5 ${SEVERITY_COLORS[event.severity] ?? ""}`}
                          >
                            {event.severity.toUpperCase()}
                          </span>
                          <span
                            className={`text-[9px] font-mono border rounded px-1.5 py-0.5 ${SOURCE_LABEL[event.source]?.color ?? ""}`}
                          >
                            {SOURCE_LABEL[event.source]?.label ?? event.source}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock size={10} />
                          <span className="text-[10px] font-mono">
                            {formatTimestamp(event.timestamp)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <Zap size={12} className="text-red-400 flex-shrink-0" />
                        <p className="text-sm font-mono font-bold text-foreground">
                          {event.name}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                        <div className="flex items-center gap-1.5">
                          <Globe size={10} className="text-muted-foreground" />
                          <div>
                            <p className="text-[8px] font-mono uppercase text-muted-foreground">
                              ATTACKER IP
                            </p>
                            <p className="text-[10px] font-mono text-cyber-cyan">
                              {event.attackerIp}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin size={10} className="text-muted-foreground" />
                          <div>
                            <p className="text-[8px] font-mono uppercase text-muted-foreground">
                              LOCATION
                            </p>
                            <p className="text-[10px] font-mono text-orange-400">
                              {event.city}, IN
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle
                            size={10}
                            className="text-muted-foreground"
                          />
                          <div>
                            <p className="text-[8px] font-mono uppercase text-muted-foreground">
                              ATTACK TYPE
                            </p>
                            <p className="text-[10px] font-mono text-yellow-400">
                              {event.attackType}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

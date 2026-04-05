import { Database, Globe, Shield } from "lucide-react";
import { useState } from "react";
import type { AttackEvent, IpStats, ThreatIntelEntry } from "../types";

interface ThreatIntelPageProps {
  threatIntelDb: ThreatIntelEntry[];
  attackEvents: AttackEvent[];
  ipAttackCounts: Record<string, IpStats>;
}

type RepFilter = "all" | "high" | "medium" | "low";

function RepBadge({ rep }: { rep: ThreatIntelEntry["reputation"] }) {
  const map = {
    high: "text-red-400 border-red-500/50 bg-red-400/10",
    medium: "text-orange-400 border-orange-500/50 bg-orange-400/10",
    low: "text-yellow-400 border-yellow-500/50 bg-yellow-400/10",
  };
  return (
    <span
      className={`inline-flex px-1.5 py-0.5 rounded-sm border text-[9px] font-mono uppercase font-bold ${map[rep]}`}
    >
      {rep}
    </span>
  );
}

export default function ThreatIntelPage({
  threatIntelDb,
  attackEvents,
  ipAttackCounts,
}: ThreatIntelPageProps) {
  const [repFilter, setRepFilter] = useState<RepFilter>("all");
  const [search, setSearch] = useState("");

  const filtered = threatIntelDb.filter((e) => {
    if (repFilter !== "all" && e.reputation !== repFilter) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      e.ip?.toLowerCase().includes(q) ||
      e.domain?.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      e.country.toLowerCase().includes(q) ||
      e.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  // Cross-reference: attack event IPs that appear in threat intel
  const knownAttackerIps = new Set(
    threatIntelDb.filter((e) => e.ip).map((e) => e.ip as string),
  );
  const crossRefEvents = attackEvents.filter((ev) =>
    knownAttackerIps.has(ev.attackerIp),
  );

  const highCount = threatIntelDb.filter((e) => e.reputation === "high").length;
  const medCount = threatIntelDb.filter(
    (e) => e.reputation === "medium",
  ).length;
  const lowCount = threatIntelDb.filter((e) => e.reputation === "low").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground mb-2">
          <Database size={12} className="text-cyber-cyan" />
          <span>SOC MODULE</span>
        </div>
        <h1 className="text-2xl font-mono font-bold uppercase tracking-wide text-foreground mb-1">
          THREAT INTELLIGENCE FEED
        </h1>
        <p className="text-sm text-muted-foreground">
          Global database of malicious IPs, domains, and threat actor
          infrastructure.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: "TOTAL IOCs",
            value: threatIntelDb.length,
            color: "text-foreground",
          },
          { label: "HIGH RISK", value: highCount, color: "text-red-400" },
          { label: "MEDIUM RISK", value: medCount, color: "text-orange-400" },
          { label: "LOW RISK", value: lowCount, color: "text-yellow-400" },
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

      {/* Cross-reference panel */}
      {crossRefEvents.length > 0 && (
        <div className="bg-red-900/10 border border-red-500/30 rounded p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <p className="text-[11px] font-mono font-bold text-red-400 uppercase tracking-widest">
              KNOWN ATTACKERS DETECTED — {crossRefEvents.length} MATCHES IN
              THREAT DB
            </p>
          </div>
          <div className="space-y-1.5">
            {crossRefEvents.slice(0, 5).map((ev) => {
              const intel = threatIntelDb.find((t) => t.ip === ev.attackerIp);
              return (
                <div
                  key={ev.id}
                  className="flex items-center gap-3 px-3 py-2 rounded bg-red-400/5 border border-red-500/20"
                >
                  <span className="text-[9px] font-mono text-red-300 font-bold px-1.5 py-0.5 rounded border border-red-500/30 bg-red-500/10 animate-pulse">
                    KNOWN ATTACKER
                  </span>
                  <span className="text-[10px] font-mono text-red-300 font-bold">
                    {ev.attackerIp}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {ev.attackType}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground ml-auto">
                    {intel?.category} — {intel?.country}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1" data-ocid="threat-intel.filter.tab">
          {(["all", "high", "medium", "low"] as RepFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setRepFilter(f)}
              className={`px-3 py-1.5 rounded text-[11px] font-mono tracking-widest transition-colors ${
                repFilter === f
                  ? "bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/40"
                  : "text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search IP, domain, category..."
          data-ocid="threat-intel.search_input"
          className="flex-1 px-3 py-1.5 rounded border border-border bg-card text-[11px] font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-cyber-cyan/40"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {[
                  "IP / DOMAIN",
                  "REPUTATION",
                  "CATEGORY",
                  "COUNTRY",
                  "LAST SEEN",
                  "ATTACKS",
                  "TAGS",
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
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-[11px] font-mono text-muted-foreground"
                    data-ocid="threat-intel.empty_state"
                  >
                    NO RESULTS MATCHING FILTER
                  </td>
                </tr>
              )}
              {filtered.map((entry, idx) => {
                const isKnownAttacker = entry.ip
                  ? attackEvents.some((ev) => ev.attackerIp === entry.ip)
                  : false;
                return (
                  <tr
                    key={entry.id}
                    data-ocid={`threat-intel.item.${idx + 1}`}
                    className={`border-b border-border/40 hover:bg-secondary/10 transition-colors ${
                      isKnownAttacker ? "bg-red-900/5" : ""
                    }`}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {isKnownAttacker && (
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0" />
                        )}
                        <span className="text-[10px] font-mono text-cyber-cyan">
                          {entry.ip ?? entry.domain}
                        </span>
                        {entry.domain && (
                          <Globe
                            size={9}
                            className="text-muted-foreground/40"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <RepBadge rep={entry.reputation} />
                    </td>
                    <td className="px-3 py-2.5 text-[10px] font-mono text-foreground">
                      {entry.category}
                    </td>
                    <td className="px-3 py-2.5 text-[10px] font-mono text-muted-foreground">
                      {entry.country}
                    </td>
                    <td className="px-3 py-2.5 text-[9px] font-mono text-muted-foreground">
                      {entry.lastSeen}
                    </td>
                    <td className="px-3 py-2.5 text-[10px] font-mono">
                      <span
                        className={`font-bold ${
                          entry.attackCount > 500
                            ? "text-red-400"
                            : entry.attackCount > 100
                              ? "text-orange-400"
                              : "text-muted-foreground"
                        }`}
                      >
                        {entry.attackCount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {entry.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-1 py-0.5 rounded text-[8px] font-mono bg-secondary/50 text-muted-foreground border border-border/50"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* IP Attack Count Cross-reference */}
      {Object.keys(ipAttackCounts).length > 0 && (
        <div className="bg-card border border-border rounded p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
            <Shield size={10} className="inline mr-1" />
            ACTIVE IP RISK SCORES
          </p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(ipAttackCounts)
              .sort((a, b) => b[1].riskScore - a[1].riskScore)
              .slice(0, 6)
              .map(([ip, stats]) => (
                <div
                  key={ip}
                  className="flex items-center justify-between px-3 py-2 rounded bg-secondary/20 border border-border/50"
                >
                  <span className="text-[10px] font-mono text-cyber-cyan">
                    {ip}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {stats.count} hits
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold ${
                        stats.riskScore > 75
                          ? "text-red-400"
                          : stats.riskScore > 50
                            ? "text-orange-400"
                            : "text-yellow-400"
                      }`}
                    >
                      {stats.riskScore}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

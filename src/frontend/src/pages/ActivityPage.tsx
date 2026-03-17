import { Activity } from "lucide-react";
import type { ActivityEntry } from "../types";

interface ActivityPageProps {
  activity: ActivityEntry[];
}

export default function ActivityPage({ activity }: ActivityPageProps) {
  const sorted = [...activity].reverse();

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground mb-4">
        <span className="text-cyber-cyan">■</span>
        <span>SYSTEM LOG</span>
      </div>
      <h1 className="text-2xl font-mono font-bold uppercase tracking-wide text-foreground mb-2">
        ACTIVITY LOG
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Chronological record of all actions, replays, and system events.
      </p>

      <div
        className="bg-card border border-border rounded overflow-hidden"
        data-ocid="activity.log.list"
      >
        {sorted.length === 0 && (
          <div
            className="px-6 py-12 text-center"
            data-ocid="activity.empty_state"
          >
            <Activity
              size={32}
              className="mx-auto text-muted-foreground mb-3"
            />
            <p className="text-[11px] font-mono text-muted-foreground">
              NO ACTIVITY YET
            </p>
          </div>
        )}
        {sorted.map((entry, idx) => (
          <div
            key={entry.id}
            data-ocid={`activity.log.item.${idx + 1}`}
            className="flex items-start gap-4 px-5 py-4 border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-cyber-cyan mt-1.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-foreground">
                {entry.action}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {entry.actor}
              </p>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground shrink-0">
              {new Date(entry.timestamp).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

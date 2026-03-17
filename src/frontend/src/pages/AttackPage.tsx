import { ATTACK_SCENARIOS } from "../data";
import type { Severity } from "../types";

interface AttackPageProps {
  onRunReplay: (scenarioName: string, scenarioId: string) => void;
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const cls =
    severity === "critical"
      ? "text-cyber-red border-cyber-red/50 bg-cyber-red/10"
      : severity === "high"
        ? "text-cyber-orange border-cyber-orange/50 bg-cyber-orange/10"
        : severity === "medium"
          ? "text-cyber-yellow border-cyber-yellow/50 bg-cyber-yellow/10"
          : "text-foreground border-border bg-secondary";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-sm border text-[10px] font-mono uppercase tracking-widest ${cls}`}
    >
      {severity}
    </span>
  );
}

export default function AttackPage({ onRunReplay }: AttackPageProps) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground mb-4">
        <span className="text-cyber-red">■</span>
        <span>ATTACK LAYER</span>
      </div>
      <h1 className="text-2xl font-mono font-bold uppercase tracking-wide text-foreground mb-2">
        SCENARIO REPLAY LIBRARY
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Execute safe replays of known attack vectors. All simulations are
        sandboxed and do not affect production systems.
      </p>

      <div className="grid grid-cols-2 gap-4" data-ocid="attack.scenarios.list">
        {ATTACK_SCENARIOS.map((scenario, idx) => (
          <div
            key={scenario.id}
            data-ocid={`attack.scenario.item.${idx + 1}`}
            className="bg-card border border-border rounded p-5 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-sm font-mono font-bold uppercase tracking-wide text-foreground leading-tight">
                {scenario.name}
              </h2>
              <SeverityBadge severity={scenario.severity} />
            </div>

            <p className="text-xs text-muted-foreground">
              {scenario.description}
            </p>

            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                REPLAY STEPS
              </p>
              <ol className="space-y-1">
                {scenario.steps.map((step, i) => (
                  <li
                    key={step}
                    className="flex items-start gap-2 text-xs text-foreground"
                  >
                    <span className="text-cyber-cyan font-mono text-[10px] mt-0.5 shrink-0">
                      {i + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="border border-cyber-cyan/20 bg-cyber-cyan/5 rounded p-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-cyber-cyan mb-1">
                PREVENTION HINT
              </p>
              <p className="text-xs text-muted-foreground">
                {scenario.prevention}
              </p>
            </div>

            <button
              type="button"
              data-ocid={`attack.run_replay.button.${idx + 1}`}
              onClick={() => onRunReplay(scenario.name, scenario.id)}
              className="w-full py-2.5 rounded bg-cyber-cyan/10 border border-cyber-cyan/40 text-cyber-cyan text-[11px] font-mono uppercase tracking-widest hover:bg-cyber-cyan/20 transition-colors"
            >
              ▶ RUN SAFE REPLAY
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

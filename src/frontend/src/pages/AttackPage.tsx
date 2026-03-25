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

// ─── ML Prediction Panel ─────────────────────────────────────────────────────

const ATTACK_TYPES = [
  "SQLi",
  "XSS",
  "CSRF",
  "Brute Force",
  "Command Injection",
];

interface MLPrediction {
  nextAttack: string;
  probabilities: { type: string; pct: number }[];
  similarity: number;
}

function getMLPrediction(scenarioId: string): MLPrediction {
  // Deterministic derivation from scenario id
  const hash = scenarioId
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const nextIdx = hash % ATTACK_TYPES.length;
  const nextAttack = ATTACK_TYPES[nextIdx];

  // Generate 3 probabilities that sum to ~100%
  const base = [78, 14, 8];
  const offset = hash % 10;
  const probs = [
    { type: ATTACK_TYPES[nextIdx], pct: base[0] - offset },
    {
      type: ATTACK_TYPES[(nextIdx + 1) % ATTACK_TYPES.length],
      pct: base[1] + Math.floor(offset / 2),
    },
    {
      type: ATTACK_TYPES[(nextIdx + 2) % ATTACK_TYPES.length],
      pct: base[2] + Math.ceil(offset / 2),
    },
  ];

  const similarity = 65 + (hash % 31); // 65-95

  return { nextAttack, probabilities: probs, similarity };
}

function MLPredictionPanel({ scenarioId }: { scenarioId: string }) {
  const pred = getMLPrediction(scenarioId);

  return (
    <div className="bg-purple-900/10 border border-purple-400/20 rounded p-3">
      <p className="text-[10px] font-mono text-purple-400/80 uppercase tracking-widest mb-2">
        ML PREDICTION ENGINE
      </p>

      {/* Next likely attack */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono text-muted-foreground">
          Next Likely Attack
        </span>
        <span className="text-[11px] font-mono font-bold text-purple-300">
          {pred.nextAttack}
        </span>
      </div>

      {/* XGBoost probability breakdown */}
      <p className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-widest mb-1">
        XGBoost Probability Breakdown
      </p>
      <div className="space-y-1 mb-2">
        {pred.probabilities.map((p) => (
          <div key={p.type} className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-purple-300/70 w-28 shrink-0 truncate">
              {p.type}
            </span>
            <div className="flex-1 h-1 rounded bg-secondary overflow-hidden">
              <div
                className="h-full rounded"
                style={{
                  width: `${p.pct}%`,
                  background:
                    "linear-gradient(90deg, oklch(0.45 0.15 290), oklch(0.6 0.18 300))",
                }}
              />
            </div>
            <span className="text-[10px] font-mono text-purple-300 w-8 text-right shrink-0">
              {p.pct}%
            </span>
          </div>
        ))}
      </div>

      {/* TF-IDF similarity */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted-foreground">
          TF-IDF Payload Similarity
        </span>
        <span className="text-[11px] font-mono text-emerald-400 font-bold">
          {pred.similarity}%
        </span>
      </div>
    </div>
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

            {/* ML Prediction Panel */}
            <MLPredictionPanel scenarioId={scenario.id} />

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

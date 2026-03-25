import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Code2,
  Shield,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { PREVENTION_GUIDES } from "../data";
import type { PreventionTask } from "../types";

interface PreventPageProps {
  tasks: PreventionTask[];
  onToggle: (taskId: string) => void;
  preventionCoverage: number;
}

type SimState = "idle" | "attacking" | "blocked";

function PreventionGuideCard({
  guide,
  index,
}: { guide: (typeof PREVENTION_GUIDES)[0]; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [simState, setSimState] = useState<SimState>("idle");

  const runSimulation = () => {
    if (simState !== "idle") return;
    setSimState("attacking");
    setTimeout(() => setSimState("blocked"), 1500);
    setTimeout(() => setSimState("idle"), 4500);
  };

  const isCritical = guide.severity === "critical";

  return (
    <div
      className="border rounded overflow-hidden transition-colors"
      style={{
        borderColor: expanded
          ? "oklch(0.55 0.18 142 / 0.5)"
          : "oklch(0.28 0.06 142 / 0.4)",
        background: "oklch(0.08 0.025 142 / 0.6)",
      }}
      data-ocid={`prevent.guide.item.${index + 1}`}
    >
      {/* Card header — always visible, click to expand */}
      <button
        type="button"
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors"
        onClick={() => setExpanded((v) => !v)}
        data-ocid={`prevent.guide.toggle.${index + 1}`}
      >
        <Shield
          size={16}
          style={{
            color: isCritical ? "oklch(0.65 0.22 25)" : "oklch(0.72 0.22 142)",
          }}
          className="shrink-0"
        />
        <span
          className="flex-1 text-sm font-mono font-bold uppercase tracking-wide"
          style={{ color: "oklch(0.88 0.06 142)" }}
        >
          {guide.title}
        </span>
        <span
          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm border uppercase tracking-widest shrink-0"
          style={{
            color: isCritical ? "oklch(0.65 0.22 25)" : "oklch(0.72 0.18 55)",
            borderColor: isCritical
              ? "oklch(0.65 0.22 25 / 0.5)"
              : "oklch(0.72 0.18 55 / 0.5)",
            background: isCritical
              ? "oklch(0.65 0.22 25 / 0.1)"
              : "oklch(0.72 0.18 55 / 0.1)",
          }}
        >
          {guide.severity.toUpperCase()}
        </span>
        {expanded ? (
          <ChevronDown
            size={14}
            style={{ color: "oklch(0.55 0.14 142)" }}
            className="shrink-0"
          />
        ) : (
          <ChevronRight
            size={14}
            style={{ color: "oklch(0.55 0.14 142)" }}
            className="shrink-0"
          />
        )}
      </button>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Attack vector */}
              <div>
                <p
                  className="text-[10px] font-mono uppercase tracking-widest mb-1.5"
                  style={{ color: "oklch(0.50 0.12 142)" }}
                >
                  ATTACK VECTOR
                </p>
                <p
                  className="text-xs"
                  style={{ color: "oklch(0.70 0.04 142)" }}
                >
                  {guide.attackVector}
                </p>
              </div>

              {/* Mitigation steps */}
              <div>
                <p
                  className="text-[10px] font-mono uppercase tracking-widest mb-2"
                  style={{ color: "oklch(0.50 0.12 142)" }}
                >
                  MITIGATION STEPS
                </p>
                <ol className="space-y-1.5">
                  {guide.mitigation.map((step, i) => (
                    <li key={step.slice(0, 30)} className="flex gap-2 text-xs">
                      <span
                        className="font-mono font-bold shrink-0 mt-0.5"
                        style={{ color: "oklch(0.72 0.22 142)" }}
                      >
                        {String(i + 1).padStart(2, "0")}.
                      </span>
                      <span style={{ color: "oklch(0.72 0.05 142)" }}>
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Compliance tags */}
              <div className="flex flex-wrap gap-2">
                <span
                  className="text-[10px] font-mono px-2 py-1 rounded-sm border"
                  style={{
                    color: "oklch(0.70 0.18 200)",
                    borderColor: "oklch(0.55 0.18 200 / 0.5)",
                    background: "oklch(0.55 0.18 200 / 0.08)",
                  }}
                  data-ocid={`prevent.guide.owasp.${index + 1}`}
                >
                  {guide.owasp}
                </span>
                <span
                  className="text-[10px] font-mono px-2 py-1 rounded-sm border"
                  style={{
                    color: "oklch(0.65 0.18 142)",
                    borderColor: "oklch(0.55 0.18 142 / 0.5)",
                    background: "oklch(0.55 0.18 142 / 0.08)",
                  }}
                  data-ocid={`prevent.guide.nist.${index + 1}`}
                >
                  {guide.nist}
                </span>
              </div>

              {/* Code example collapsible */}
              <div>
                <button
                  type="button"
                  className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest mb-2 hover:opacity-80 transition-opacity"
                  style={{ color: "oklch(0.60 0.16 142)" }}
                  onClick={() => setCodeOpen((v) => !v)}
                  data-ocid={`prevent.guide.code.${index + 1}`}
                >
                  <Code2 size={12} />
                  {codeOpen ? "HIDE CODE EXAMPLE" : "VIEW CODE EXAMPLE"}
                  {codeOpen ? (
                    <ChevronDown size={11} />
                  ) : (
                    <ChevronRight size={11} />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {codeOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <pre
                        className="text-[11px] p-3 rounded overflow-x-auto"
                        style={{
                          background: "oklch(0.05 0.015 142)",
                          border: "1px solid oklch(0.25 0.07 142 / 0.4)",
                          color: "oklch(0.72 0.22 142)",
                          fontFamily: "'JetBrains Mono', monospace",
                          lineHeight: 1.6,
                        }}
                      >
                        {guide.codeExample}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Simulate Block button */}
              <div>
                <button
                  type="button"
                  className="text-[11px] font-mono font-bold uppercase tracking-widest px-4 py-2 rounded border transition-all"
                  style={{
                    color:
                      simState === "idle"
                        ? "oklch(0.72 0.22 142)"
                        : "oklch(0.88 0.05 142)",
                    borderColor:
                      simState === "idle"
                        ? "oklch(0.55 0.18 142 / 0.6)"
                        : "oklch(0.55 0.18 142 / 0.3)",
                    background:
                      simState === "idle"
                        ? "oklch(0.55 0.18 142 / 0.1)"
                        : "oklch(0.10 0.03 142)",
                    opacity: simState !== "idle" ? 0.7 : 1,
                    cursor: simState !== "idle" ? "not-allowed" : "pointer",
                  }}
                  onClick={runSimulation}
                  disabled={simState !== "idle"}
                  data-ocid={`prevent.guide.simulate.${index + 1}`}
                >
                  ▶ SIMULATE BLOCK
                </button>

                <AnimatePresence>
                  {simState !== "idle" && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="mt-2 p-3 rounded border font-mono text-xs"
                      style={{
                        background: "oklch(0.05 0.015 142)",
                        borderColor:
                          simState === "attacking"
                            ? "oklch(0.55 0.22 25 / 0.6)"
                            : "oklch(0.55 0.22 142 / 0.6)",
                      }}
                    >
                      {simState === "attacking" ? (
                        <motion.p
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{
                            duration: 0.4,
                            repeat: Number.POSITIVE_INFINITY,
                          }}
                          style={{ color: "oklch(0.65 0.22 25)" }}
                          data-ocid={`prevent.guide.attack_state.${index + 1}`}
                        >
                          ⚠ ATTACK ATTEMPT IN PROGRESS...
                        </motion.p>
                      ) : (
                        <div
                          data-ocid={`prevent.guide.blocked_state.${index + 1}`}
                        >
                          <p
                            className="font-bold text-sm tracking-widest"
                            style={{ color: "oklch(0.72 0.22 142)" }}
                          >
                            &gt;&gt;&gt; BLOCKED &lt;&lt;&lt;
                          </p>
                          <p
                            className="mt-1"
                            style={{ color: "oklch(0.60 0.12 142)" }}
                          >
                            Prevention rule applied: {guide.mitigation[0]}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PreventPage({
  tasks,
  onToggle,
  preventionCoverage,
}: PreventPageProps) {
  const completed = tasks.filter((t) => t.completed).length;

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground mb-4">
        <span className="text-cyber-green">■</span>
        <span>PREVENTION LAYER</span>
      </div>
      <h1 className="text-2xl font-mono font-bold uppercase tracking-wide text-foreground mb-2">
        HARDENING TASK BOARD
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Track and complete security hardening tasks to improve your prevention
        coverage score.
      </p>

      {/* Coverage summary */}
      <div className="bg-card border border-border rounded p-4 mb-6 flex items-center gap-6">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
            PREVENTION COVERAGE
          </p>
          <p className="text-4xl font-mono font-bold text-cyber-cyan">
            {preventionCoverage}%
          </p>
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1.5">
            <span>
              {completed} of {tasks.length} TASKS COMPLETED
            </span>
            <span>{preventionCoverage}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-3">
            <div
              className="bg-cyber-cyan h-3 rounded-full transition-all duration-500"
              style={{ width: `${preventionCoverage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-10" data-ocid="prevent.tasks.list">
        {tasks.map((task, idx) => (
          <div
            key={task.id}
            data-ocid={`prevent.task.item.${idx + 1}`}
            className={`bg-card border rounded p-4 flex items-start gap-4 transition-colors ${
              task.completed
                ? "border-cyber-cyan/30 bg-cyber-cyan/5"
                : "border-border"
            }`}
          >
            <button
              type="button"
              data-ocid={`prevent.task.checkbox.${idx + 1}`}
              onClick={() => onToggle(task.id)}
              className="mt-0.5 text-cyber-cyan hover:opacity-80 transition-opacity"
            >
              {task.completed ? (
                <CheckCircle2 size={18} />
              ) : (
                <Circle size={18} className="text-muted-foreground" />
              )}
            </button>
            <div className="flex-1">
              <p
                className={`text-sm font-mono font-bold uppercase tracking-wide mb-1 ${
                  task.completed
                    ? "text-cyber-cyan line-through opacity-70"
                    : "text-foreground"
                }`}
              >
                {task.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {task.description}
              </p>
            </div>
            {task.completed && (
              <span className="text-[10px] font-mono text-cyber-green border border-cyber-green/40 bg-cyber-green/10 px-2 py-0.5 rounded-sm uppercase tracking-widest">
                DONE
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ── Prevention Guides section ── */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground mb-3">
          <span style={{ color: "oklch(0.72 0.22 142)" }}>■</span>
          <span>THREAT INTELLIGENCE</span>
        </div>
        <h2 className="text-xl font-mono font-bold uppercase tracking-wide text-foreground mb-1">
          PREVENTION GUIDES
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          OWASP &amp; NIST-mapped defense playbooks for each threat vector.
          Expand a card to view mitigations, compliance references, code
          examples, and run an interactive block simulation.
        </p>
      </div>

      <div className="space-y-3" data-ocid="prevent.guides.list">
        {PREVENTION_GUIDES.map((guide, i) => (
          <PreventionGuideCard key={guide.id} guide={guide} index={i} />
        ))}
      </div>

      <footer className="mt-10 pt-4 border-t border-border text-center">
        <p className="text-[11px] text-muted-foreground">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}

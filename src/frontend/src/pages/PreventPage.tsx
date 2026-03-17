import { CheckCircle2, Circle } from "lucide-react";
import type { PreventionTask } from "../types";

interface PreventPageProps {
  tasks: PreventionTask[];
  onToggle: (taskId: string) => void;
  preventionCoverage: number;
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

      <div className="space-y-3" data-ocid="prevent.tasks.list">
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
    </div>
  );
}

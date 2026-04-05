import { Shield, Swords, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AttackEvent } from "../types";

interface RedBluePageProps {
  mode: "red" | "blue";
  onSetMode: (m: "red" | "blue") => void;
  score: { attacks: number; defenses: number };
  attackEvents: AttackEvent[];
  onRunAttack: () => void;
}

const RED_ATTACKS = [
  {
    id: "sqli",
    name: "SQL Injection",
    severity: "CRITICAL",
    desc: "Payload: ' OR 1=1 --",
  },
  {
    id: "xss",
    name: "XSS Script Injection",
    severity: "HIGH",
    desc: "Payload: <script>alert(1)</script>",
  },
  {
    id: "brute",
    name: "Brute Force",
    severity: "HIGH",
    desc: "1000 credential pairs/min",
  },
  {
    id: "cmd",
    name: "Command Injection",
    severity: "CRITICAL",
    desc: "Payload: ; cat /etc/passwd",
  },
  {
    id: "csrf",
    name: "CSRF Attack",
    severity: "MEDIUM",
    desc: "Forged cross-origin request",
  },
  {
    id: "cred",
    name: "Credential Stuffing",
    severity: "HIGH",
    desc: "10k leaked credential pairs",
  },
];

const BLUE_COUNTERMEASURES = [
  { id: "waf", name: "WAF Active", status: "ACTIVE", color: "text-green-400" },
  {
    id: "ids",
    name: "IDS/IPS Monitoring",
    status: "ACTIVE",
    color: "text-green-400",
  },
  {
    id: "ratelimit",
    name: "Rate Limiting",
    status: "ACTIVE",
    color: "text-green-400",
  },
  {
    id: "mfa",
    name: "MFA Enforcement",
    status: "ACTIVE",
    color: "text-green-400",
  },
  {
    id: "honeypot",
    name: "Honeypot Deployed",
    status: "ACTIVE",
    color: "text-green-400",
  },
  {
    id: "ml",
    name: "ML Anomaly Detection",
    status: "ACTIVE",
    color: "text-green-400",
  },
];

type BattleEvent = {
  id: string;
  timestamp: string;
  side: "red" | "blue";
  action: string;
  result: string;
};

function AnimatedBattle({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let t = 0;
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      color: string;
    }[] = [];

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Red attacker side
      ctx.save();
      ctx.shadowColor = "#ff3333";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#ff3333";
      ctx.font = "bold 11px monospace";
      ctx.fillText("RED TEAM", 10, 18);

      // Attacker icon
      ctx.fillStyle = "#ff3333";
      ctx.beginPath();
      ctx.arc(45, 70, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.font = "bold 12px monospace";
      ctx.fillText("\u2620", 38, 76);
      ctx.restore();

      // Blue defender side
      ctx.save();
      ctx.shadowColor = "#00d4d4";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#00d4d4";
      ctx.font = "bold 11px monospace";
      ctx.fillText("BLUE TEAM", canvas.width - 85, 18);

      // Defender icon
      ctx.fillStyle = "#00d4d4";
      ctx.beginPath();
      ctx.arc(canvas.width - 45, 70, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.font = "bold 12px monospace";
      ctx.fillText("\u26e8", canvas.width - 52, 76);
      ctx.restore();

      if (active) {
        // Animated arc line
        const progress = (Math.sin(t * 0.03) + 1) / 2;
        const startX = 60;
        const endX = canvas.width - 60;
        const midX = (startX + endX) / 2;
        const arcY = 40 - Math.sin(progress * Math.PI) * 30;
        const px = startX + (endX - startX) * progress;
        const py = arcY + (70 - arcY) * (2 * progress * (1 - progress));

        // Arc trail
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(startX, 70);
        ctx.quadraticCurveTo(midX, 10, endX, 70);
        ctx.strokeStyle = "rgba(255, 51, 51, 0.3)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.restore();

        // Packet dot
        ctx.save();
        ctx.shadowColor = "#ff3333";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "#ff3333";
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Shield effect at destination
        const shieldAlpha = progress > 0.85 ? (1 - progress) * 8 : 0;
        if (shieldAlpha > 0) {
          ctx.save();
          ctx.globalAlpha = shieldAlpha;
          ctx.shadowColor = "#00d4d4";
          ctx.shadowBlur = 20;
          ctx.strokeStyle = "#00d4d4";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(endX, 70, 20, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Particles at impact
        if (Math.random() < 0.1) {
          particles.push({
            x: endX,
            y: 70,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1,
            color: progress > 0.9 ? "#00d4d4" : "#ff3333",
          });
        }
      }

      // Draw particles
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
        if (p.life <= 0) {
          particles.splice(i, 1);
          return;
        }
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      t++;
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={110}
      className="w-full rounded"
      style={{ background: "oklch(0.1 0.01 248)" }}
    />
  );
}

export default function RedBluePage({
  mode,
  onSetMode,
  score,
  attackEvents,
  onRunAttack,
}: RedBluePageProps) {
  const [battleEvents, setBattleEvents] = useState<BattleEvent[]>([]);
  const [launchingId, setLaunchingId] = useState<string | null>(null);

  const handleLaunch = (attack: (typeof RED_ATTACKS)[0]) => {
    setLaunchingId(attack.id);
    onRunAttack();
    const ev: BattleEvent = {
      id: `be-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      side: "red",
      action: `Launched ${attack.name}`,
      result: Math.random() > 0.5 ? "BLOCKED by WAF" : "Partially detected",
    };
    setBattleEvents((prev) => [ev, ...prev].slice(0, 20));
    setTimeout(() => {
      setLaunchingId(null);
      const blueEv: BattleEvent = {
        id: `be-blue-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        side: "blue",
        action: `Responded to ${attack.name}`,
        result: "Alert raised + IP logged",
      };
      setBattleEvents((prev) => [blueEv, ...prev].slice(0, 20));
    }, 1500);
  };

  const recentEvents = [
    ...battleEvents,
    ...attackEvents
      .slice(-5)
      .reverse()
      .map((ev) => ({
        id: ev.id,
        timestamp: new Date(ev.timestamp).toLocaleTimeString(),
        side: "red" as const,
        action: ev.name,
        result: ev.source,
      })),
  ]
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, 10);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground mb-2">
          <Swords size={12} className="text-cyber-cyan" />
          <span>SOC MODULE</span>
        </div>
        <h1 className="text-2xl font-mono font-bold uppercase tracking-wide text-foreground mb-1">
          RED TEAM VS BLUE TEAM OPERATIONS
        </h1>
        <p className="text-sm text-muted-foreground">
          Simulate adversarial attacks (Red) and defensive countermeasures
          (Blue) in a controlled environment.
        </p>
      </div>

      {/* Mode Toggle */}
      <div
        className="flex gap-0 rounded overflow-hidden border border-border w-fit"
        data-ocid="red-blue.toggle"
      >
        <button
          type="button"
          data-ocid="red-blue.red_tab"
          onClick={() => onSetMode("red")}
          className={`px-8 py-3 text-[12px] font-mono font-bold uppercase tracking-widest transition-all ${
            mode === "red"
              ? "bg-red-500/20 text-red-400 border-r border-red-500/40"
              : "bg-secondary/10 text-muted-foreground hover:text-foreground border-r border-border"
          }`}
        >
          🗡️ RED TEAM
        </button>
        <button
          type="button"
          data-ocid="red-blue.blue_tab"
          onClick={() => onSetMode("blue")}
          className={`px-8 py-3 text-[12px] font-mono font-bold uppercase tracking-widest transition-all ${
            mode === "blue"
              ? "bg-cyan-500/20 text-cyber-cyan"
              : "bg-secondary/10 text-muted-foreground hover:text-foreground"
          }`}
        >
          🛡️ BLUE TEAM
        </button>
      </div>

      {/* Scoreboard */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-900/10 border border-red-500/30 rounded p-4 text-center">
          <p className="text-[10px] font-mono uppercase tracking-widest text-red-400/70 mb-1">
            RED TEAM ATTACKS
          </p>
          <p className="text-4xl font-mono font-bold text-red-400">
            {score.attacks}
          </p>
        </div>
        <div className="flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-mono font-bold text-muted-foreground">
              VS
            </p>
            <p className="text-[9px] font-mono text-muted-foreground/50 mt-1">
              SCORE
            </p>
          </div>
        </div>
        <div className="bg-cyan-900/10 border border-cyan-500/30 rounded p-4 text-center">
          <p className="text-[10px] font-mono uppercase tracking-widest text-cyber-cyan/70 mb-1">
            BLUE TEAM DEFENSES
          </p>
          <p className="text-4xl font-mono font-bold text-cyber-cyan">
            {score.defenses}
          </p>
        </div>
      </div>

      {/* Battle animation */}
      <div className="bg-card border border-border rounded p-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
          BATTLE VISUALIZATION
        </p>
        <AnimatedBattle
          active={launchingId !== null || attackEvents.length > 0}
        />
      </div>

      {/* Mode-specific panels */}
      <div className="grid grid-cols-2 gap-4">
        {/* Red Team Panel */}
        <div
          className={`border rounded p-4 transition-all ${
            mode === "red"
              ? "border-red-500/40 bg-red-500/5"
              : "border-border/30 bg-secondary/5 opacity-60"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Swords
              size={14}
              className={
                mode === "red" ? "text-red-400" : "text-muted-foreground/30"
              }
            />
            <p
              className={`text-[11px] font-mono font-bold uppercase tracking-widest ${
                mode === "red" ? "text-red-400" : "text-muted-foreground/30"
              }`}
            >
              RED TEAM — ATTACK LAUNCHER
            </p>
          </div>
          <div className="space-y-2">
            {RED_ATTACKS.map((attack) => (
              <div
                key={attack.id}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded bg-red-900/10 border border-red-500/20"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-mono text-foreground font-bold">
                    {attack.name}
                  </p>
                  <p className="text-[9px] font-mono text-muted-foreground/60 truncate">
                    {attack.desc}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[8px] font-mono px-1 py-0.5 rounded border ${
                      attack.severity === "CRITICAL"
                        ? "text-red-400 border-red-500/40"
                        : attack.severity === "HIGH"
                          ? "text-orange-400 border-orange-500/40"
                          : "text-yellow-400 border-yellow-500/40"
                    }`}
                  >
                    {attack.severity}
                  </span>
                  <button
                    type="button"
                    data-ocid={`red-blue.launch_button.${attack.id}`}
                    disabled={mode !== "red" || launchingId === attack.id}
                    onClick={() => handleLaunch(attack)}
                    className="flex items-center gap-1 px-2 py-1 rounded border border-red-500/50 text-red-400 text-[9px] font-mono font-bold tracking-widest hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {launchingId === attack.id ? (
                      <>
                        <Zap size={9} className="animate-pulse" /> FIRING
                      </>
                    ) : (
                      "LAUNCH"
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Blue Team Panel */}
        <div
          className={`border rounded p-4 transition-all ${
            mode === "blue"
              ? "border-cyber-cyan/40 bg-cyber-cyan/5"
              : "border-border/30 bg-secondary/5 opacity-60"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Shield
              size={14}
              className={
                mode === "blue" ? "text-cyber-cyan" : "text-muted-foreground/30"
              }
            />
            <p
              className={`text-[11px] font-mono font-bold uppercase tracking-widest ${
                mode === "blue" ? "text-cyber-cyan" : "text-muted-foreground/30"
              }`}
            >
              BLUE TEAM — DEFENSE DASHBOARD
            </p>
          </div>
          <div className="space-y-2 mb-4">
            {BLUE_COUNTERMEASURES.map((cm) => (
              <div
                key={cm.id}
                className="flex items-center justify-between px-3 py-2 rounded bg-cyan-900/10 border border-cyan-500/20"
              >
                <span className="text-[10px] font-mono text-foreground">
                  {cm.name}
                </span>
                <span className={`text-[9px] font-mono font-bold ${cm.color}`}>
                  ● {cm.status}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-border/30 pt-3">
            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-2">
              RESPONSE METRICS
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: "AVG DETECTION",
                  value: "342ms",
                  color: "text-green-400",
                },
                {
                  label: "AVG RESPONSE",
                  value: "1.2s",
                  color: "text-cyber-cyan",
                },
                {
                  label: "BLOCKS TODAY",
                  value: attackEvents.filter((e) => e.source === "auto").length,
                  color: "text-green-400",
                },
                {
                  label: "THREATS ACTIVE",
                  value: attackEvents.length,
                  color:
                    attackEvents.length > 5
                      ? "text-red-400"
                      : "text-yellow-400",
                },
              ].map((m) => (
                <div key={m.label} className="text-center">
                  <p className="text-[8px] font-mono text-muted-foreground/60">
                    {m.label}
                  </p>
                  <p className={`text-lg font-mono font-bold ${m.color}`}>
                    {m.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent events timeline */}
      <div className="bg-card border border-border rounded p-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
          BATTLE EVENTS TIMELINE
        </p>
        {recentEvents.length === 0 ? (
          <p
            className="text-[11px] font-mono text-muted-foreground/40"
            data-ocid="red-blue.empty_state"
          >
            No battle events yet. Switch to RED TEAM and launch an attack.
          </p>
        ) : (
          <div className="space-y-1.5">
            {recentEvents.map((ev, idx) => (
              <div
                key={ev.id}
                data-ocid={`red-blue.item.${idx + 1}`}
                className="flex items-center gap-3 px-3 py-2 rounded text-[10px] font-mono"
              >
                <span className="text-muted-foreground/50 w-16 shrink-0">
                  {ev.timestamp}
                </span>
                <span
                  className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                    ev.side === "red"
                      ? "text-red-400 border-red-500/40 bg-red-400/10"
                      : "text-cyber-cyan border-cyan-500/40 bg-cyan-400/10"
                  }`}
                >
                  {ev.side === "red" ? "RED" : "BLUE"}
                </span>
                <span className="text-foreground flex-1">{ev.action}</span>
                <span className="text-muted-foreground/60 text-[9px]">
                  {ev.result}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

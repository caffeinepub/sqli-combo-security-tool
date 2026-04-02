import {
  Globe,
  Lock,
  Pause,
  Play,
  Shield,
  SkipBack,
  SkipForward,
  Skull,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface WafSimulationModalProps {
  open: boolean;
  onClose: () => void;
}

const PHASES = [
  {
    id: 1,
    label: "DIRECT ATTACK",
    icon: "💀",
    description:
      "Attacker launches malicious payload directly at the main site. No defenses active. Attack packets breach all layers — SQL injections, XSS, brute force attempts flood the target.",
  },
  {
    id: 2,
    label: "WAF INTERCEPTS",
    icon: "🛡️",
    description:
      "WAF firewall activates. All incoming attack traffic is inspected and blocked at the perimeter. A decoy honeypot clone is silently deployed behind the shield.",
  },
  {
    id: 3,
    label: "REDIRECT TO HONEYPOT",
    icon: "🎯",
    description:
      "WAF silently redirects attacker to the clone honeypot. Attacker believes they've succeeded — but they're isolated in a fake environment. Main site remains fully secured.",
  },
];

const ATTACK_LABELS = [
  "SQL INJECT",
  "XSS PAYLOAD",
  "BRUTE FORCE",
  "CSRF TOKEN",
  "CMD INJECT",
  "PATH TRAVERSAL",
  "BUFFER OVERFLOW",
  "DNS SPOOF",
];

type Packet = {
  id: number;
  label: string;
  progress: number;
  lane: number;
  exploding: boolean;
  explodeAt: number;
};

function useMatrixRain(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const fontSize = 12;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(columns).fill(1);
    const chars =
      "アイウエオカキクケコ01ｦｧｨｩｪｫｬｭｮｯABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*";

    let raf: number;
    const draw = () => {
      ctx.fillStyle = "rgba(0,0,0,0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(0,255,65,0.15)";
      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975)
          drops[i] = 0;
        drops[i]++;
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [active, canvasRef]);
}

type BrowserRole = "attacker" | "waf" | "main" | "clone";

function BrowserWindow({
  browserRole,
  phase,
}: {
  browserRole: BrowserRole;
  phase: number;
}) {
  type Config = {
    border: string;
    glow: string;
    headerBg: string;
    headerText: string;
    dotColors: string[];
    url: string;
    icon: React.ReactNode;
    visible: boolean;
    status: string;
    statusColor: string;
    contentBars: string[];
  };

  const configs: Record<BrowserRole, Config> = {
    attacker: {
      border: "border-red-500/70",
      glow: "shadow-[0_0_30px_rgba(255,45,45,0.5)]",
      headerBg: "bg-red-950/60",
      headerText: "text-red-300",
      dotColors: ["bg-red-500", "bg-red-400", "bg-red-300"],
      url: "hxxp://attk3r.darkweb:8080",
      icon: <Skull size={14} className="text-red-400" />,
      visible: true,
      status: phase === 3 ? "CONFUSED" : "ATTACKING",
      statusColor: phase === 3 ? "text-yellow-400" : "text-red-400",
      contentBars: ["bg-red-900/60", "bg-red-800/40", "bg-red-700/20"],
    },
    waf: {
      border: phase >= 2 ? "border-cyan-400/80" : "border-gray-700/50",
      glow: phase >= 2 ? "shadow-[0_0_35px_rgba(0,229,255,0.55)]" : "",
      headerBg: phase >= 2 ? "bg-cyan-950/70" : "bg-gray-900/50",
      headerText: phase >= 2 ? "text-cyan-300" : "text-gray-600",
      dotColors:
        phase >= 2
          ? ["bg-cyan-500", "bg-cyan-400", "bg-cyan-300"]
          : ["bg-gray-700", "bg-gray-700", "bg-gray-700"],
      url: "waf-shield.defense:443",
      icon: (
        <Shield
          size={14}
          className={phase >= 2 ? "text-cyan-400" : "text-gray-600"}
        />
      ),
      visible: true,
      status: phase === 1 ? "STANDBY" : "ACTIVE",
      statusColor: phase === 1 ? "text-gray-600" : "text-cyan-400",
      contentBars:
        phase >= 2
          ? ["bg-cyan-900/60", "bg-cyan-800/40", "bg-cyan-700/20"]
          : ["bg-gray-900/40", "bg-gray-800/20", "bg-gray-700/10"],
    },
    main: {
      border: phase === 1 ? "border-red-500/70" : "border-blue-400/70",
      glow:
        phase === 1
          ? "shadow-[0_0_25px_rgba(255,45,45,0.45)]"
          : "shadow-[0_0_30px_rgba(56,189,248,0.45)]",
      headerBg: phase === 1 ? "bg-red-950/50" : "bg-blue-950/60",
      headerText: phase === 1 ? "text-red-300" : "text-blue-300",
      dotColors: ["bg-blue-500", "bg-blue-400", "bg-blue-300"],
      url: "mainsite.production.app",
      icon: (
        <Globe
          size={14}
          className={phase === 1 ? "text-red-400" : "text-blue-400"}
        />
      ),
      visible: true,
      status:
        phase === 1 ? "UNDER ATTACK" : phase === 2 ? "PROTECTED" : "SECURED ✓",
      statusColor: phase === 1 ? "text-red-400" : "text-green-400",
      contentBars: ["bg-blue-900/60", "bg-blue-800/40", "bg-blue-700/20"],
    },
    clone: {
      border: "border-green-400/70",
      glow: "shadow-[0_0_30px_rgba(0,255,65,0.4)]",
      headerBg: "bg-green-950/60",
      headerText: "text-green-300",
      dotColors: ["bg-green-500", "bg-green-400", "bg-green-300"],
      url: "clone-decoy.honeypot:9090",
      icon: <Lock size={14} className="text-green-400" />,
      visible: phase >= 2,
      status: phase === 2 ? "DEPLOYING..." : "RECEIVING",
      statusColor: phase === 2 ? "text-yellow-400" : "text-green-400",
      contentBars: ["bg-green-900/60", "bg-green-800/40", "bg-green-700/20"],
    },
  };
  const c = configs[browserRole];

  if (!c.visible) return null;

  return (
    <div
      className={`relative rounded-lg border-2 ${c.border} ${c.glow} transition-all duration-700 overflow-hidden bg-[#050508]`}
      style={{ width: 170, minHeight: 195 }}
    >
      <div className={`${c.headerBg} px-2 py-1.5 border-b border-white/5`}>
        <div className="flex items-center gap-1 mb-1">
          {c.dotColors.map((dc, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static fixed-length array
            <span key={i} className={`w-2 h-2 rounded-full ${dc}`} />
          ))}
        </div>
        <div className="flex items-center gap-1">
          {c.icon}
          <span className={`text-[8px] font-mono truncate ${c.headerText}`}>
            {c.url}
          </span>
        </div>
      </div>

      <div className="p-2 space-y-1.5">
        <div className={`h-2 rounded ${c.contentBars[0]} w-full`} />
        <div className="flex gap-1">
          <div className={`h-1.5 rounded ${c.contentBars[1]} w-1/3`} />
          <div className={`h-1.5 rounded ${c.contentBars[1]} w-1/4`} />
          <div className={`h-1.5 rounded ${c.contentBars[1]} w-1/4`} />
        </div>
        <div className={`h-12 rounded ${c.contentBars[0]} w-full mt-1`} />
        <div className={`h-1.5 rounded ${c.contentBars[2]} w-3/4`} />
        <div className={`h-1.5 rounded ${c.contentBars[2]} w-2/3`} />
        <div className="flex gap-1 mt-1">
          <div className={`h-8 rounded ${c.contentBars[1]} w-1/2`} />
          <div className={`h-8 rounded ${c.contentBars[1]} w-1/2`} />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 text-center py-1 bg-black/60">
        <span
          className={`text-[9px] font-mono font-bold ${c.statusColor} tracking-widest`}
        >
          {c.status}
        </span>
      </div>

      {browserRole === "main" && phase === 1 && (
        <div className="absolute inset-0 rounded-lg border-2 border-red-500/50 animate-ping pointer-events-none" />
      )}
      {browserRole === "waf" && phase === 2 && (
        <div className="absolute inset-0 rounded-lg border-2 border-cyan-400/40 animate-ping pointer-events-none" />
      )}
    </div>
  );
}

function AttackPackets({ phase }: { phase: number }) {
  const [packets, setPackets] = useState<Packet[]>([]);
  const counterRef = useRef(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // Spawn a single packet using phaseRef so no stale closure on phase
  const spawnPacket = useCallback(() => {
    const id = counterRef.current++;
    const label = ATTACK_LABELS[id % ATTACK_LABELS.length];
    const lane = Math.floor(Math.random() * 4);
    const currentPhase = phaseRef.current;
    const explodeAt = currentPhase === 2 ? 45 + Math.random() * 10 : 101;
    setPackets((prev) => [
      ...prev.slice(-8),
      { id, label, progress: 0, lane, exploding: false, explodeAt },
    ]);
  }, []);

  // Reset + restart spawn loop on phase change
  // biome-ignore lint/correctness/useExhaustiveDependencies: phase triggers intentional reset
  useEffect(() => {
    setPackets([]);
    counterRef.current = 0;
    const interval = setInterval(spawnPacket, 600);
    spawnPacket();
    spawnPacket();
    spawnPacket();
    return () => clearInterval(interval);
  }, [phase, spawnPacket]);

  // RAF animation loop
  useEffect(() => {
    let rafId: number;
    const tick = () => {
      setPackets((prev) =>
        prev
          .map((p) => {
            if (p.exploding) return { ...p, progress: p.progress + 3 };
            const newProgress = p.progress + 1.2 + Math.random() * 0.5;
            if (newProgress >= p.explodeAt && p.explodeAt <= 100) {
              return { ...p, progress: p.explodeAt, exploding: true };
            }
            return { ...p, progress: newProgress };
          })
          .filter((p) => p.progress < 130),
      );
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const getPacketStyle = (p: Packet) => {
    const laneOffset = (p.lane - 1.5) * 12;
    let left: number;
    if (phase === 1) {
      left = 5 + (p.progress / 100) * 83;
    } else if (phase === 2) {
      left = 5 + (p.progress / 100) * 42;
    } else {
      left = 5 + (p.progress / 100) * 90;
    }
    const color =
      phase === 1
        ? "#ff2d2d"
        : phase === 2
          ? p.exploding
            ? "#fff"
            : "#ff6b35"
          : "#00ff41";
    const opacity = p.exploding
      ? Math.max(0, 1 - (p.progress - p.explodeAt) / 20)
      : 1;
    return { left, top: `calc(50% + ${laneOffset}px)`, opacity, color };
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {packets.map((p) => {
        const style = getPacketStyle(p);
        return (
          <div
            key={p.id}
            className="absolute transform -translate-y-1/2 flex flex-col items-center"
            style={{
              left: `${style.left}%`,
              top: style.top,
              opacity: style.opacity,
              transition: "none",
            }}
          >
            {p.exploding ? (
              <div
                style={{
                  width: `${6 + (p.progress - p.explodeAt) * 2}px`,
                  height: `${6 + (p.progress - p.explodeAt) * 2}px`,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, #fff 0%, #ff6b35 40%, transparent 70%)",
                  opacity: Math.max(0, 1 - (p.progress - p.explodeAt) / 15),
                }}
              />
            ) : (
              <>
                <span
                  className="text-[7px] font-mono font-bold tracking-wider mb-0.5"
                  style={{
                    color: style.color,
                    textShadow: `0 0 6px ${style.color}`,
                  }}
                >
                  {p.label}
                </span>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: style.color,
                    boxShadow: `0 0 10px ${style.color}, 0 0 20px ${style.color}80`,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: "100%",
                    transform: "translateY(-50%)",
                    width: 24,
                    height: 2,
                    background: `linear-gradient(to left, ${style.color}80, transparent)`,
                  }}
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Typewriter effect: resets when `text` changes (triggered via prop)
function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const fullText = text;
    const interval = setInterval(() => {
      if (i < fullText.length) {
        setDisplayed(fullText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 22);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span className="text-cyan-300 font-mono text-xs tracking-wide">
      {displayed}
      <span className="animate-pulse">▊</span>
    </span>
  );
}

export default function WafSimulationModal({
  open,
  onClose,
}: WafSimulationModalProps) {
  const [phase, setPhase] = useState(1);
  const [autoLoop, setAutoLoop] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useMatrixRain(canvasRef as React.RefObject<HTMLCanvasElement | null>, open);

  const advancePhase = useCallback(() => {
    setPhase((p) => (p >= 3 ? 1 : p + 1));
  }, []);

  const prevPhase = useCallback(() => {
    setPhase((p) => (p <= 1 ? 3 : p - 1));
  }, []);

  useEffect(() => {
    if (!open) return;
    if (!autoLoop) {
      if (autoRef.current) clearTimeout(autoRef.current);
      return;
    }
    if (autoRef.current) clearTimeout(autoRef.current);
    const delay = phase === 3 ? 5000 : 3500;
    autoRef.current = setTimeout(() => {
      setPhase((p) => (p >= 3 ? 1 : p + 1));
    }, delay);
    return () => {
      if (autoRef.current) clearTimeout(autoRef.current);
    };
  }, [phase, autoLoop, open]);

  useEffect(() => {
    if (!open) {
      setPhase(1);
      setAutoLoop(true);
      if (autoRef.current) clearTimeout(autoRef.current);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") advancePhase();
      if (e.key === "ArrowLeft") prevPhase();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, advancePhase, prevPhase]);

  if (!open) return null;

  const currentPhase = PHASES[phase - 1];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)" }}
      data-ocid="waf.modal"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
        style={{ zIndex: 0 }}
      />

      <div
        className="relative z-10 w-full max-w-5xl mx-4 rounded-xl border border-cyan-500/40 bg-[#07080f]/95 overflow-hidden"
        style={{
          boxShadow:
            "0 0 60px rgba(0,229,255,0.15), 0 0 120px rgba(0,229,255,0.05), inset 0 0 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-[#050508]">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <div
              className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"
              style={{ animationDelay: "0.3s" }}
            />
            <div
              className="w-2 h-2 rounded-full bg-red-400 animate-pulse"
              style={{ animationDelay: "0.6s" }}
            />
            <span
              className="text-sm font-mono font-bold tracking-[0.3em] ml-3"
              style={{ color: "#00ff41", textShadow: "0 0 10px #00ff41" }}
            >
              WAF ATTACK SIMULATION
            </span>
            <span className="text-[10px] font-mono text-cyan-500/60 tracking-widest">
              {"// LIVE DEMO MODE"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded border border-red-500/40 text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors"
            data-ocid="waf.close_button"
          >
            <X size={14} />
          </button>
        </div>

        {/* Phase indicator */}
        <div className="flex items-center justify-center gap-0 px-6 py-3 border-b border-cyan-500/10 bg-[#050508]">
          {PHASES.map((ph, idx) => (
            <div key={ph.id} className="flex items-center">
              <button
                type="button"
                onClick={() => setPhase(ph.id)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-mono tracking-widest transition-all border ${
                  phase === ph.id
                    ? "border-cyan-400/60 bg-cyan-500/10 text-cyan-300"
                    : phase > ph.id
                      ? "border-green-500/40 bg-green-500/5 text-green-400/70"
                      : "border-gray-700/40 text-gray-600"
                }`}
                data-ocid="waf.tab"
              >
                <span
                  className={`w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-bold ${
                    phase === ph.id
                      ? "border-cyan-400 bg-cyan-500/20 text-cyan-300"
                      : phase > ph.id
                        ? "border-green-400 bg-green-500/20 text-green-300"
                        : "border-gray-700 text-gray-600"
                  }`}
                >
                  {phase > ph.id ? "✓" : ph.id}
                </span>
                <span>{ph.label}</span>
              </button>
              {idx < PHASES.length - 1 && (
                <div
                  className={`w-8 h-px mx-1 ${
                    phase > ph.id ? "bg-green-500/40" : "bg-gray-700/40"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Main simulation area */}
        <div className="px-6 py-8">
          <div
            className="relative rounded-lg border border-cyan-500/10 bg-[#030407] overflow-hidden"
            style={{ height: 280 }}
          >
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(0,229,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.15) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />

            <div className="absolute inset-0 flex items-center justify-around px-6">
              <div className="flex flex-col items-center gap-2">
                <span className="text-[9px] font-mono text-red-400 tracking-widest uppercase">
                  ATTACKER
                </span>
                <BrowserWindow browserRole="attacker" phase={phase} />
              </div>

              <div
                className="flex flex-col items-center gap-1"
                style={{ minWidth: 28 }}
              >
                <div
                  className="text-[18px] transition-all duration-500"
                  style={{
                    color: phase === 1 ? "#ff2d2d" : "#ff6b35",
                    textShadow: `0 0 10px ${phase === 1 ? "#ff2d2d" : "#ff6b35"}`,
                  }}
                >
                  →
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <span
                  className={`text-[9px] font-mono tracking-widest uppercase ${
                    phase >= 2 ? "text-cyan-400" : "text-gray-600"
                  }`}
                >
                  WAF SHIELD
                </span>
                <BrowserWindow browserRole="waf" phase={phase} />
              </div>

              <div
                className="flex flex-col items-center gap-1"
                style={{ minWidth: 28 }}
              >
                <div
                  className="text-[18px] transition-all duration-500"
                  style={{
                    color:
                      phase === 1
                        ? "#374151"
                        : phase === 2
                          ? "#00e5ff"
                          : "#00ff41",
                    textShadow:
                      phase >= 2
                        ? `0 0 10px ${phase === 3 ? "#00ff41" : "#00e5ff"}`
                        : "none",
                  }}
                >
                  {phase === 1 ? "→" : phase === 2 ? "✕" : "↗"}
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <span
                  className={`text-[9px] font-mono tracking-widest uppercase ${
                    phase === 1 ? "text-red-400" : "text-blue-400"
                  }`}
                >
                  MAIN SITE
                </span>
                <BrowserWindow browserRole="main" phase={phase} />
              </div>

              {phase >= 2 && (
                <>
                  <div
                    className="flex flex-col items-center gap-1"
                    style={{ minWidth: 18 }}
                  >
                    <div
                      className="text-[14px] text-green-500"
                      style={{ textShadow: "0 0 10px #00ff41" }}
                    >
                      {phase === 2 ? "…" : "→"}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[9px] font-mono text-green-400 tracking-widest uppercase">
                      CLONE / HONEYPOT
                    </span>
                    <BrowserWindow browserRole="clone" phase={phase} />
                  </div>
                </>
              )}
            </div>

            <AttackPackets phase={phase} />

            {phase === 3 && (
              <div
                className="absolute bottom-3 left-1/2 -translate-x-1/2 px-6 py-1.5 rounded border border-green-400/60 bg-green-950/80 whitespace-nowrap"
                style={{ boxShadow: "0 0 20px rgba(0,255,65,0.3)" }}
              >
                <span
                  className="text-[11px] font-mono font-bold tracking-widest text-green-400"
                  style={{ textShadow: "0 0 8px #00ff41" }}
                >
                  🎯 ATTACKER TRAPPED IN CLONE — MAIN SITE SECURED ✓
                </span>
              </div>
            )}

            {phase === 2 && (
              <div
                className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded border border-cyan-400/60 bg-cyan-950/80 whitespace-nowrap"
                style={{ boxShadow: "0 0 20px rgba(0,229,255,0.3)" }}
              >
                <span
                  className="text-[10px] font-mono font-bold tracking-widest text-cyan-400"
                  style={{ textShadow: "0 0 8px #00e5ff" }}
                >
                  🛡️ FIREWALL ACTIVE — ALL PAYLOADS INTERCEPTED
                </span>
              </div>
            )}

            {phase === 1 && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded border border-red-500/60 bg-red-950/80 animate-pulse whitespace-nowrap">
                <span className="text-[10px] font-mono font-bold tracking-widest text-red-400">
                  ⚠ SITE UNDER DIRECT ATTACK — NO DEFENSES ACTIVE
                </span>
              </div>
            )}
          </div>

          {/* Phase description */}
          <div className="mt-4 rounded-lg border border-cyan-500/20 bg-[#050508] px-5 py-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs">{currentPhase.icon}</span>
              <span
                className="text-[10px] font-mono font-bold tracking-[0.25em] uppercase"
                style={{ color: "#00e5ff", textShadow: "0 0 8px #00e5ff" }}
              >
                PHASE {currentPhase.id}: {currentPhase.label}
              </span>
            </div>
            <TypewriterText text={currentPhase.description} />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-6 pb-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={prevPhase}
              className="flex items-center gap-1.5 px-4 py-2 rounded border border-gray-600/40 text-gray-400 hover:border-cyan-500/40 hover:text-cyan-400 text-[11px] font-mono tracking-widest transition-colors"
              data-ocid="waf.secondary_button"
            >
              <SkipBack size={12} />
              PREV
            </button>
            <button
              type="button"
              onClick={advancePhase}
              className="flex items-center gap-1.5 px-4 py-2 rounded border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 text-[11px] font-mono tracking-widest transition-colors"
              style={{ boxShadow: "0 0 10px rgba(0,229,255,0.1)" }}
              data-ocid="waf.primary_button"
            >
              NEXT STEP
              <SkipForward size={12} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-muted-foreground tracking-widest">
              AUTO LOOP
            </span>
            <button
              type="button"
              onClick={() => setAutoLoop((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-[10px] font-mono tracking-widest transition-colors ${
                autoLoop
                  ? "border-green-500/40 text-green-400 bg-green-500/5"
                  : "border-gray-600/40 text-gray-600"
              }`}
              data-ocid="waf.toggle"
            >
              {autoLoop ? <Play size={10} /> : <Pause size={10} />}
              {autoLoop ? "ON" : "OFF"}
            </button>

            <div className="flex items-center gap-1.5 ml-4">
              {PHASES.map((ph) => (
                <button
                  key={ph.id}
                  type="button"
                  onClick={() => setPhase(ph.id)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    phase === ph.id
                      ? "bg-cyan-400 scale-125"
                      : phase > ph.id
                        ? "bg-green-500/60"
                        : "bg-gray-700"
                  }`}
                  data-ocid="waf.toggle"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-3 flex items-center justify-between border-t border-cyan-500/10 pt-2">
          <span className="text-[9px] font-mono text-gray-700 tracking-widest">
            ARROW KEYS: ← → TO NAVIGATE · ESC TO CLOSE
          </span>
          <span className="text-[9px] font-mono text-gray-700 tracking-widest">
            COMBO DEFENSE CONSOLE — WAF SIM v2.0
          </span>
        </div>
      </div>
    </div>
  );
}

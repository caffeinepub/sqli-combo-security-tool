import { AlertTriangle, Globe, MapPin, Radio, Wifi } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AttackEvent } from "../types";

interface LiveAttackMapPageProps {
  events: AttackEvent[];
}

// India bounding box: lat 6-38, lon 66-99
const LAT_MIN = 6;
const LAT_MAX = 38;
const LON_MIN = 66;
const LON_MAX = 99;

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  Mumbai: { lat: 19.08, lon: 72.88 },
  Delhi: { lat: 28.61, lon: 77.21 },
  Bengaluru: { lat: 12.97, lon: 77.59 },
  Chennai: { lat: 13.08, lon: 80.27 },
  Hyderabad: { lat: 17.38, lon: 78.49 },
  Kolkata: { lat: 22.57, lon: 88.36 },
  Pune: { lat: 18.52, lon: 73.86 },
  Ahmedabad: { lat: 23.03, lon: 72.58 },
  Jaipur: { lat: 26.92, lon: 75.79 },
  Surat: { lat: 21.17, lon: 72.83 },
  Lucknow: { lat: 26.85, lon: 80.95 },
  Kanpur: { lat: 26.46, lon: 80.35 },
  Nagpur: { lat: 21.15, lon: 79.09 },
  Indore: { lat: 22.72, lon: 75.86 },
  Bhopal: { lat: 23.26, lon: 77.4 },
  Patna: { lat: 25.6, lon: 85.13 },
  Vadodara: { lat: 22.31, lon: 73.18 },
  Coimbatore: { lat: 11.02, lon: 76.96 },
  Visakhapatnam: { lat: 17.69, lon: 83.22 },
  Chandigarh: { lat: 30.73, lon: 76.78 },
  Kochi: { lat: 9.93, lon: 76.26 },
  Thiruvananthapuram: { lat: 8.52, lon: 76.94 },
  Guwahati: { lat: 26.18, lon: 91.74 },
  Bhubaneswar: { lat: 20.3, lon: 85.84 },
  Ranchi: { lat: 23.34, lon: 85.31 },
  Amritsar: { lat: 31.63, lon: 74.87 },
  Ludhiana: { lat: 30.9, lon: 75.85 },
  Agra: { lat: 27.18, lon: 78.01 },
  Varanasi: { lat: 25.32, lon: 83.01 },
  Meerut: { lat: 28.98, lon: 77.71 },
};

const SVG_W = 500;
const SVG_H = 560;

function latLonToSvg(lat: number, lon: number) {
  const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * SVG_W;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * SVG_H;
  return { x, y };
}

const INDIA_PATH = `
M 195 30 L 220 20 L 255 18 L 290 25 L 330 22 L 360 35 L 380 55 L 400 80
L 410 105 L 415 130 L 420 150 L 430 170 L 440 195 L 445 220 L 440 245
L 430 265 L 415 280 L 400 295 L 385 315 L 370 335 L 355 355 L 340 375
L 325 395 L 310 415 L 295 430 L 280 445 L 265 455 L 255 465 L 245 475
L 240 485 L 238 495 L 240 505 L 245 515 L 252 522 L 258 518 L 262 510
L 260 500 L 258 490 L 262 480 L 268 470 L 278 460 L 285 450
L 295 440 L 310 425 L 325 410 L 340 390 L 355 370 L 368 350
L 380 328 L 390 305 L 398 282 L 402 258 L 400 232 L 395 208
L 385 185 L 375 162 L 360 142 L 345 125 L 325 112 L 305 102
L 280 95 L 255 90 L 232 92 L 210 98 L 192 110 L 178 128
L 168 150 L 162 175 L 158 200 L 160 225 L 165 248 L 172 268
L 180 285 L 175 290 L 162 295 L 148 292 L 138 280 L 132 265
L 128 248 L 125 228 L 126 208 L 130 188 L 136 168 L 145 150
L 155 133 L 167 117 L 182 104 L 195 93 L 200 75 L 198 55 L 195 30
Z
`;

const SEVERITY_COLORS_HEX: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

const SEVERITY_GLOW: Record<string, string> = {
  critical: "rgba(239,68,68,0.6)",
  high: "rgba(249,115,22,0.6)",
  medium: "rgba(234,179,8,0.6)",
  low: "rgba(34,197,94,0.6)",
};

interface MapDot {
  id: string;
  x: number;
  y: number;
  city: string;
  severity: string;
  name: string;
  attackerIp: string;
  timestamp: string;
  attackType: string;
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function LiveAttackMapPage({ events }: LiveAttackMapPageProps) {
  const [dots, setDots] = useState<MapDot[]>([]);
  const [selected, setSelected] = useState<MapDot | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const prevLen = useRef(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional sync on events.length
  useEffect(() => {
    const newEvents = events.slice(prevLen.current);
    prevLen.current = events.length;

    if (newEvents.length === 0 && dots.length === 0) {
      const allDots: MapDot[] = events.map((e) => {
        const coords = CITY_COORDS[e.city] ?? { lat: 20.5, lon: 78.9 };
        const { x, y } = latLonToSvg(coords.lat, coords.lon);
        return {
          id: e.id,
          x: x + (Math.random() - 0.5) * 8,
          y: y + (Math.random() - 0.5) * 8,
          city: e.city,
          severity: e.severity,
          name: e.name,
          attackerIp: e.attackerIp,
          timestamp: e.timestamp,
          attackType: e.attackType,
        };
      });
      setDots(allDots);
      return;
    }

    if (newEvents.length > 0) {
      const newDots: MapDot[] = newEvents.map((e) => {
        const coords = CITY_COORDS[e.city] ?? { lat: 20.5, lon: 78.9 };
        const { x, y } = latLonToSvg(coords.lat, coords.lon);
        return {
          id: e.id,
          x: x + (Math.random() - 0.5) * 8,
          y: y + (Math.random() - 0.5) * 8,
          city: e.city,
          severity: e.severity,
          name: e.name,
          attackerIp: e.attackerIp,
          timestamp: e.timestamp,
          attackType: e.attackType,
        };
      });
      setDots((prev) => [...prev, ...newDots]);
    }
  }, [events.length]);

  const recentEvents = [...events]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Globe size={16} className="text-cyber-cyan" />
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            COMBO DEFENSE CONSOLE
          </p>
        </div>
        <h1 className="text-2xl font-mono font-bold text-foreground tracking-widest">
          LIVE ATTACK MAP
        </h1>
        <p className="text-xs font-mono text-muted-foreground mt-1">
          Real-time geographic visualization of attack origins across India
        </p>
      </div>

      <div className="flex gap-4 items-center mb-4">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        <span className="text-[10px] font-mono text-red-400 tracking-widest">
          LIVE — TRACKING {dots.length} ATTACK ORIGIN
          {dots.length !== 1 ? "S" : ""}
        </span>
        <div className="ml-auto flex gap-3">
          {["critical", "high", "medium", "low"].map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background: SEVERITY_COLORS_HEX[s],
                  boxShadow: `0 0 6px ${SEVERITY_GLOW[s]}`,
                }}
              />
              <span className="text-[9px] font-mono uppercase text-muted-foreground">
                {s}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Map */}
        <div className="xl:col-span-2 bg-card border border-border rounded-lg overflow-hidden relative">
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 bg-black/60 rounded px-2 py-1">
            <Radio size={10} className="text-cyber-cyan animate-pulse" />
            <span className="text-[9px] font-mono text-cyber-cyan">
              SCANNING
            </span>
          </div>

          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full h-auto"
            role="img"
            aria-label="Live attack map of India showing attack origin locations"
            style={{
              background: "linear-gradient(135deg, #0a0f0a 0%, #050d0f 100%)",
            }}
          >
            {/* Grid lines */}
            {Array.from({ length: 10 }).map((_, i) => (
              <line
                key={`vg-${(i * SVG_W) / 10}`}
                x1={i * (SVG_W / 10)}
                y1={0}
                x2={i * (SVG_W / 10)}
                y2={SVG_H}
                stroke="rgba(0,255,200,0.04)"
                strokeWidth="1"
              />
            ))}
            {Array.from({ length: 10 }).map((_, i) => (
              <line
                key={`hg-${(i * SVG_H) / 10}`}
                x1={0}
                y1={i * (SVG_H / 10)}
                x2={SVG_W}
                y2={i * (SVG_H / 10)}
                stroke="rgba(0,255,200,0.04)"
                strokeWidth="1"
              />
            ))}

            {/* India outline */}
            <path
              d={INDIA_PATH}
              fill="rgba(0,255,200,0.04)"
              stroke="rgba(0,255,200,0.25)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />

            {/* City background dots */}
            {Object.entries(CITY_COORDS).map(([city, coord]) => {
              const { x, y } = latLonToSvg(coord.lat, coord.lon);
              return (
                <circle
                  key={city}
                  cx={x}
                  cy={y}
                  r={1.5}
                  fill="rgba(0,255,200,0.15)"
                />
              );
            })}

            {/* City labels */}
            {Object.entries(CITY_COORDS).map(([city, coord]) => {
              const { x, y } = latLonToSvg(coord.lat, coord.lon);
              const hasDot = dots.some((d) => d.city === city);
              if (!hasDot) return null;
              return (
                <text
                  key={`lbl-${city}`}
                  x={x + 6}
                  y={y + 3}
                  fontSize="6"
                  fontFamily="monospace"
                  fill="rgba(0,255,200,0.5)"
                >
                  {city}
                </text>
              );
            })}

            {/* Attack dots */}
            {dots.map((dot) => {
              const color = SEVERITY_COLORS_HEX[dot.severity] ?? "#888";
              const glow = SEVERITY_GLOW[dot.severity] ?? "transparent";
              const isSelected = selected?.id === dot.id;
              const isHovered = hovered === dot.id;
              return (
                <g
                  key={dot.id}
                  style={{ cursor: "pointer" }}
                  // biome-ignore lint/a11y/useSemanticElements: SVG g element
                  tabIndex={0}
                  aria-label={`Attack from ${dot.city}: ${dot.name}`}
                  onClick={() => setSelected(isSelected ? null : dot)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      setSelected(isSelected ? null : dot);
                  }}
                  onMouseEnter={() => setHovered(dot.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Ripple rings */}
                  <circle
                    cx={dot.x}
                    cy={dot.y}
                    r={isSelected || isHovered ? 18 : 14}
                    fill="none"
                    stroke={color}
                    strokeOpacity="0.12"
                    strokeWidth="1"
                  >
                    <animate
                      attributeName="r"
                      values={`6;${isSelected ? 22 : 18};6`}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="stroke-opacity"
                      values="0.4;0;0.4"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle
                    cx={dot.x}
                    cy={dot.y}
                    r={isSelected || isHovered ? 12 : 9}
                    fill="none"
                    stroke={color}
                    strokeOpacity="0.25"
                    strokeWidth="1"
                  >
                    <animate
                      attributeName="r"
                      values={`3;${isSelected ? 14 : 11};3`}
                      dur="2s"
                      begin="0.5s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="stroke-opacity"
                      values="0.6;0;0.6"
                      dur="2s"
                      begin="0.5s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  {/* Core dot */}
                  <circle
                    cx={dot.x}
                    cy={dot.y}
                    r={isSelected ? 5 : 3.5}
                    fill={color}
                    style={{ filter: `drop-shadow(0 0 4px ${glow})` }}
                  />
                  {/* Crosshair on selected */}
                  {isSelected && (
                    <>
                      <line
                        x1={dot.x - 10}
                        y1={dot.y}
                        x2={dot.x + 10}
                        y2={dot.y}
                        stroke={color}
                        strokeWidth="0.8"
                        strokeOpacity="0.6"
                      />
                      <line
                        x1={dot.x}
                        y1={dot.y - 10}
                        x2={dot.x}
                        y2={dot.y + 10}
                        stroke={color}
                        strokeWidth="0.8"
                        strokeOpacity="0.6"
                      />
                    </>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Selected tooltip */}
          {selected && (
            <div className="absolute bottom-4 left-4 right-4 bg-black/90 border border-cyber-cyan/40 rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[9px] font-mono border rounded px-1.5 py-0.5"
                      style={{
                        color: SEVERITY_COLORS_HEX[selected.severity],
                        borderColor: `${SEVERITY_COLORS_HEX[selected.severity]}66`,
                      }}
                    >
                      {selected.severity.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono font-bold text-foreground">
                      {selected.name}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[8px] font-mono text-muted-foreground">
                        IP
                      </p>
                      <p className="text-[10px] font-mono text-cyber-cyan">
                        {selected.attackerIp}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] font-mono text-muted-foreground">
                        CITY
                      </p>
                      <p className="text-[10px] font-mono text-orange-400">
                        {selected.city}, IN
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] font-mono text-muted-foreground">
                        TIME
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {formatTime(selected.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="space-y-3">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            {["critical", "high", "medium", "low"].map((s) => (
              <div key={s} className="bg-card border border-border rounded p-3">
                <p
                  className="text-xl font-mono font-bold"
                  style={{ color: SEVERITY_COLORS_HEX[s] }}
                >
                  {events.filter((e) => e.severity === s).length}
                </p>
                <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                  {s}
                </p>
              </div>
            ))}
          </div>

          {/* Recent feed */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-border flex items-center gap-2">
              <Wifi size={10} className="text-cyber-cyan" />
              <p className="text-[9px] font-mono uppercase tracking-widest text-cyber-cyan">
                RECENT ATTACKS
              </p>
            </div>
            <div className="divide-y divide-border">
              {recentEvents.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-[10px] font-mono text-muted-foreground">
                    NO EVENTS YET
                  </p>
                </div>
              ) : (
                recentEvents.map((e, i) => (
                  <div
                    key={e.id}
                    className={`px-3 py-2 flex gap-2 items-start ${i === 0 ? "bg-red-950/10" : ""}`}
                  >
                    <span
                      className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{
                        background: SEVERITY_COLORS_HEX[e.severity],
                        boxShadow: `0 0 4px ${SEVERITY_GLOW[e.severity]}`,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-mono text-foreground truncate">
                        {e.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <MapPin
                          size={8}
                          className="text-muted-foreground flex-shrink-0"
                        />
                        <p className="text-[9px] font-mono text-orange-400 truncate">
                          {e.city}
                        </p>
                        <p className="text-[9px] font-mono text-muted-foreground ml-auto flex-shrink-0">
                          {formatTime(e.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top cities */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-border flex items-center gap-2">
              <AlertTriangle size={10} className="text-yellow-400" />
              <p className="text-[9px] font-mono uppercase tracking-widest text-yellow-400">
                TOP ATTACK CITIES
              </p>
            </div>
            <div className="p-3 space-y-2">
              {(() => {
                const counts: Record<string, number> = {};
                for (const e of events)
                  counts[e.city] = (counts[e.city] ?? 0) + 1;
                const sorted = Object.entries(counts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5);
                const max = sorted[0]?.[1] ?? 1;
                return sorted.length === 0 ? (
                  <p className="text-[10px] font-mono text-muted-foreground text-center py-2">
                    NO DATA
                  </p>
                ) : (
                  sorted.map(([city, count]) => (
                    <div key={city}>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-[10px] font-mono text-foreground">
                          {city}
                        </span>
                        <span className="text-[10px] font-mono text-cyber-cyan">
                          {count}
                        </span>
                      </div>
                      <div className="h-1 bg-secondary rounded overflow-hidden">
                        <div
                          className="h-full bg-cyber-cyan rounded transition-all duration-500"
                          style={{ width: `${(count / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

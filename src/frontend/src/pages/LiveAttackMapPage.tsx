import { Html, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  AlertTriangle,
  Globe,
  MapPin,
  Radio,
  Shield,
  Wifi,
} from "lucide-react";
import { Suspense, useRef, useState } from "react";
import * as THREE from "three";
import type { AttackEvent, BlockedIp, IpStats } from "../types";

interface LiveAttackMapPageProps {
  events: AttackEvent[];
  blockedIps: BlockedIp[];
  onBlockIp: (ip: string, reason: string, blockedBy: string) => void;
  currentUser?: { name: string; email: string };
  ipAttackCounts?: Record<string, IpStats>;
}

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  Mumbai: { lat: 19.076, lon: 72.877 },
  Delhi: { lat: 28.613, lon: 77.209 },
  Bengaluru: { lat: 12.972, lon: 77.594 },
  Chennai: { lat: 13.083, lon: 80.27 },
  Hyderabad: { lat: 17.385, lon: 78.486 },
  Kolkata: { lat: 22.572, lon: 88.363 },
  Pune: { lat: 18.52, lon: 73.856 },
  Ahmedabad: { lat: 23.022, lon: 72.571 },
  Jaipur: { lat: 26.912, lon: 75.787 },
  Surat: { lat: 21.17, lon: 72.831 },
  Lucknow: { lat: 26.846, lon: 80.946 },
  Kanpur: { lat: 26.449, lon: 80.331 },
  Nagpur: { lat: 21.145, lon: 79.088 },
  Indore: { lat: 22.719, lon: 75.857 },
  Bhopal: { lat: 23.259, lon: 77.412 },
  Patna: { lat: 25.594, lon: 85.137 },
  Vadodara: { lat: 22.307, lon: 73.181 },
  Coimbatore: { lat: 11.016, lon: 76.955 },
  Visakhapatnam: { lat: 17.686, lon: 83.218 },
  Chandigarh: { lat: 30.733, lon: 76.779 },
  Kochi: { lat: 9.939, lon: 76.26 },
  Guwahati: { lat: 26.144, lon: 91.736 },
  Bhubaneswar: { lat: 20.296, lon: 85.824 },
  Ranchi: { lat: 23.344, lon: 85.309 },
  Amritsar: { lat: 31.634, lon: 74.872 },
  Agra: { lat: 27.176, lon: 78.008 },
  Varanasi: { lat: 25.317, lon: 83.013 },
  Meerut: { lat: 28.984, lon: 77.706 },
  Nashik: { lat: 20.011, lon: 73.79 },
  Thiruvananthapuram: { lat: 8.524, lon: 76.936 },
};

const INDIA_BORDER: [number, number][] = [
  [37.1, 75.0],
  [35.5, 77.5],
  [34.5, 78.5],
  [32.0, 79.5],
  [30.5, 80.3],
  [29.5, 81.0],
  [28.5, 81.5],
  [27.5, 84.0],
  [27.3, 87.0],
  [26.5, 88.0],
  [26.0, 89.5],
  [25.0, 90.5],
  [24.5, 91.5],
  [23.5, 92.5],
  [22.0, 93.5],
  [21.5, 92.0],
  [20.5, 92.5],
  [21.3, 91.5],
  [22.5, 91.0],
  [22.0, 89.0],
  [21.0, 87.0],
  [20.0, 86.0],
  [18.0, 84.0],
  [16.0, 82.0],
  [14.0, 80.0],
  [13.0, 80.3],
  [11.0, 79.8],
  [8.5, 77.5],
  [8.0, 77.5],
  [9.0, 76.5],
  [10.5, 76.2],
  [11.5, 75.0],
  [14.0, 74.0],
  [15.5, 73.5],
  [17.0, 73.0],
  [18.0, 72.8],
  [20.0, 72.5],
  [21.5, 72.5],
  [22.5, 68.5],
  [23.5, 68.0],
  [24.5, 68.5],
  [25.0, 70.0],
  [26.5, 70.5],
  [27.5, 70.0],
  [28.5, 70.5],
  [30.0, 71.0],
  [31.5, 74.0],
  [32.5, 74.5],
  [33.5, 75.0],
  [34.5, 76.0],
  [35.5, 76.5],
  [36.5, 75.5],
  [37.1, 75.0],
];

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// Convert lat/lon to 3D sphere coordinates
function latLonToVec3(
  lat: number,
  lon: number,
  radius: number,
): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return [x, y, z];
}

// India country boundary outline drawn as a LineLoop on the globe surface
function IndiaOutline() {
  const points = INDIA_BORDER.map(([lat, lon]) => {
    const [x, y, z] = latLonToVec3(lat, lon, 1.015);
    return new THREE.Vector3(x, y, z);
  });

  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    // @ts-ignore - Three.js primitive via R3F
    <line geometry={geometry}>
      <lineBasicMaterial
        attach="material"
        color="#00ffcc"
        transparent
        opacity={0.75}
      />
    </line>
  );
}

// "INDIA" country label centered at lat 22, lon 80
function IndiaLabel() {
  const [x, y, z] = latLonToVec3(22, 80, 1.04);
  return (
    <Html
      position={[x, y, z]}
      style={{ pointerEvents: "none" }}
      center
      zIndexRange={[0, 0]}
    >
      <div
        style={{
          color: "#00ffcc",
          fontFamily: "monospace",
          fontSize: "12px",
          fontWeight: "bold",
          letterSpacing: "4px",
          textShadow: "0 0 8px #00ffcc, 0 0 20px #00ffcc88, 0 0 40px #00ffcc44",
          whiteSpace: "nowrap",
          opacity: 0.95,
          userSelect: "none",
        }}
      >
        INDIA
      </div>
    </Html>
  );
}

// City name labels for all 30 cities in CITY_COORDS
function CityLabels() {
  return (
    <>
      {Object.entries(CITY_COORDS).map(([city, { lat, lon }]) => {
        const [x, y, z] = latLonToVec3(lat, lon, 1.045);
        return (
          <Html
            key={city}
            position={[x, y, z]}
            style={{ pointerEvents: "none" }}
            center
            zIndexRange={[0, 0]}
          >
            <div
              style={{
                color: "#aaffee",
                fontFamily: "monospace",
                fontSize: "7px",
                letterSpacing: "0.5px",
                textShadow: "0 0 4px #00ffcc99, 0 0 8px #00ffcc44",
                whiteSpace: "nowrap",
                opacity: 0.8,
                userSelect: "none",
                marginLeft: "6px",
              }}
            >
              {city}
            </div>
          </Html>
        );
      })}
    </>
  );
}

// Stars background
function Stars() {
  const ref = useRef<THREE.Points>(null);
  const positions = new Float32Array(3000);
  for (let i = 0; i < 3000; i++) {
    positions[i] = (Math.random() - 0.5) * 100;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.00005;
    }
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        color="#88ffdd"
        size={0.12}
        sizeAttenuation
        transparent
        opacity={0.6}
      />
    </points>
  );
}

// Atmosphere glow
function Atmosphere() {
  return (
    <mesh>
      <sphereGeometry args={[1.08, 64, 64]} />
      <meshBasicMaterial
        color="#00ffcc"
        transparent
        opacity={0.04}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

// Wireframe grid overlay
function GlobeGrid() {
  return (
    <mesh>
      <sphereGeometry args={[1.01, 24, 24]} />
      <meshBasicMaterial
        color="#00ffcc"
        wireframe
        transparent
        opacity={0.08}
        depthWrite={false}
      />
    </mesh>
  );
}

// Attack dot with pulse ring
function AttackDot({
  event,
  isRecent,
  onClick,
}: {
  event: AttackEvent;
  isRecent: boolean;
  onClick: () => void;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const coords = CITY_COORDS[event.city] ?? { lat: 20.5, lon: 79 };
  const [x, y, z] = latLonToVec3(coords.lat, coords.lon, 1.02);
  const color = SEVERITY_COLORS[event.severity] ?? "#888888";

  useFrame(({ clock }) => {
    if (ringRef.current && isRecent) {
      const t = (clock.getElapsedTime() * 1.5) % 1;
      ringRef.current.scale.setScalar(1 + t * 2.5);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - t) * 0.8;
    }
  });

  const dotSize =
    event.severity === "critical"
      ? 0.022
      : event.severity === "high"
        ? 0.018
        : 0.014;

  return (
    <group position={[x, y, z]}>
      {/* Core dot */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Three.js mesh is not a DOM element */}
      <mesh onClick={onClick}>
        <sphereGeometry args={[dotSize, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Glow halo */}
      <mesh>
        <sphereGeometry args={[dotSize * 2, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Pulse ring for recent events */}
      {isRecent && (
        <mesh ref={ringRef}>
          <ringGeometry args={[dotSize * 1.5, dotSize * 2.5, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

// Main globe mesh with India highlighted
function GlobeMesh() {
  const globeRef = useRef<THREE.Mesh>(null);

  // Create procedural texture with India highlighted
  const texture = (() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Deep space background
    ctx.fillStyle = "#010d1a";
    ctx.fillRect(0, 0, 512, 256);

    // Very subtle land mass hints
    ctx.fillStyle = "rgba(0, 40, 60, 0.5)";
    // Europe/Asia region
    ctx.fillRect(230, 50, 130, 90);
    // Africa
    ctx.fillRect(230, 110, 50, 80);
    // Americas
    ctx.fillRect(60, 40, 90, 120);
    // Australia
    ctx.fillRect(360, 120, 60, 50);

    // India highlighted region (lon 68-98, lat 8-37)
    // lon->x: (lon+180)/360*512, lat->y: (90-lat)/180*256
    // India x: ~353 to ~395, India y: ~75 to ~116
    ctx.fillStyle = "rgba(0, 80, 80, 0.45)";
    ctx.fillRect(353, 75, 42, 41);

    // Subtle India highlight border glow
    ctx.strokeStyle = "rgba(0, 255, 200, 0.15)";
    ctx.lineWidth = 1;
    ctx.strokeRect(353, 75, 42, 41);

    // Grid lines
    ctx.strokeStyle = "rgba(0,255,200,0.06)";
    ctx.lineWidth = 0.5;
    // Latitude lines
    for (let i = 0; i <= 8; i++) {
      const y = (i / 8) * 256;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
    // Longitude lines
    for (let i = 0; i <= 16; i++) {
      const x = (i / 16) * 512;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }

    return new THREE.CanvasTexture(canvas);
  })();

  useFrame((_state, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <mesh ref={globeRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshPhongMaterial
        map={texture ?? undefined}
        color="#012030"
        emissive="#001520"
        emissiveIntensity={0.3}
        shininess={20}
        specular={new THREE.Color("#00ffcc")}
      />
    </mesh>
  );
}

// Full globe scene
function GlobeScene({
  events,
  recentIds,
  onSelectEvent,
}: {
  events: AttackEvent[];
  recentIds: Set<string>;
  onSelectEvent: (e: AttackEvent) => void;
}) {
  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[5, 5, 5]} intensity={0.6} color="#ffffff" />
      <pointLight position={[-5, -3, -5]} intensity={0.2} color="#00ffcc" />

      <Stars />
      <GlobeMesh />
      <GlobeGrid />
      <Atmosphere />

      <IndiaOutline />
      <IndiaLabel />
      <CityLabels />

      {events.map((event) => (
        <AttackDot
          key={event.id}
          event={event}
          isRecent={recentIds.has(event.id)}
          onClick={() => onSelectEvent(event)}
        />
      ))}

      <OrbitControls
        enableZoom
        enablePan={false}
        minDistance={1.5}
        maxDistance={4}
        autoRotate={false}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
      />
    </>
  );
}

export default function LiveAttackMapPage({
  events,
  blockedIps,
  onBlockIp,
  currentUser,
  ipAttackCounts: _ipAttackCounts = {},
}: LiveAttackMapPageProps) {
  const [selectedEvent, setSelectedEvent] = useState<AttackEvent | null>(null);

  const recentEvents = [...events]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, 8);

  // Mark the most recent 5 attack dots as "recent" for pulsing
  const recentIds = new Set(recentEvents.slice(0, 5).map((e) => e.id));

  const isAlreadyBlocked = selectedEvent
    ? blockedIps.some((b) => b.ip === selectedEvent.attackerIp)
    : false;

  const handleBlockIp = () => {
    if (!selectedEvent?.attackerIp) return;
    onBlockIp(
      selectedEvent.attackerIp,
      `Attack detected: ${selectedEvent.name} from ${selectedEvent.city}`,
      currentUser?.email ?? "admin@combodefense.local",
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-4">
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
          Real-world 3D globe visualization of attack origins — Interactive
          rotating Earth
        </p>
      </div>

      <div className="flex gap-4 items-center mb-4">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        <span className="text-[10px] font-mono text-red-400 tracking-widest">
          LIVE — TRACKING {events.length} ATTACK ORIGIN
          {events.length !== 1 ? "S" : ""}
        </span>
        <div className="ml-auto flex gap-3">
          {(["critical", "high", "medium", "low"] as const).map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background: SEVERITY_COLORS[s],
                  boxShadow: `0 0 6px ${SEVERITY_COLORS[s]}99`,
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
        {/* 3D Globe */}
        <div
          className="xl:col-span-2 bg-card border border-border rounded-lg overflow-hidden relative"
          style={{ height: 480 }}
        >
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 bg-black/80 rounded px-2 py-1 pointer-events-none">
            <Radio size={10} className="text-cyber-cyan animate-pulse" />
            <span className="text-[9px] font-mono text-cyber-cyan">
              LIVE TRACKING
            </span>
          </div>
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 bg-black/80 rounded px-2 py-1 pointer-events-none">
            <span className="text-[9px] font-mono text-cyber-cyan/60">
              DRAG TO ROTATE • SCROLL TO ZOOM
            </span>
          </div>

          <Canvas
            camera={{ position: [0, 0, 2.8], fov: 45 }}
            style={{ background: "#000508" }}
            gl={{ antialias: true }}
          >
            <Suspense fallback={null}>
              <GlobeScene
                events={events}
                recentIds={recentIds}
                onSelectEvent={setSelectedEvent}
              />
            </Suspense>
          </Canvas>

          {/* Selected event detail overlay */}
          {selectedEvent && (
            <div className="absolute bottom-4 left-4 right-4 z-10 bg-black/90 border border-cyber-cyan/40 rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className="text-[9px] font-mono border rounded px-1.5 py-0.5"
                      style={{
                        color: SEVERITY_COLORS[selectedEvent.severity],
                        borderColor: `${SEVERITY_COLORS[selectedEvent.severity]}66`,
                      }}
                    >
                      {selectedEvent.severity.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono font-bold text-foreground">
                      {selectedEvent.name}
                    </span>
                    {isAlreadyBlocked && (
                      <span className="text-[9px] font-mono border border-green-500/50 text-green-400 rounded px-1.5 py-0.5">
                        ✓ IP BLOCKED
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-2">
                    <div>
                      <p className="text-[8px] font-mono text-muted-foreground">
                        IP
                      </p>
                      <p className="text-[10px] font-mono text-cyber-cyan">
                        {selectedEvent.attackerIp}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] font-mono text-muted-foreground">
                        CITY
                      </p>
                      <p className="text-[10px] font-mono text-orange-400">
                        {selectedEvent.city}, IN
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] font-mono text-muted-foreground">
                        TIME
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {formatTime(selectedEvent.timestamp)}
                      </p>
                    </div>
                  </div>
                  {!isAlreadyBlocked ? (
                    <button
                      type="button"
                      onClick={handleBlockIp}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-mono font-bold border border-red-500/60 text-red-400 hover:bg-red-500/10 transition-colors tracking-widest"
                    >
                      <Shield size={10} />
                      BLOCK IP
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-green-400">
                      <Shield size={10} />
                      IP ALREADY BLOCKED
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
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
            {(["critical", "high", "medium", "low"] as const).map((s) => (
              <div key={s} className="bg-card border border-border rounded p-3">
                <p
                  className="text-xl font-mono font-bold"
                  style={{ color: SEVERITY_COLORS[s] }}
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
                recentEvents.map((e, i) => {
                  const blocked = blockedIps.some((b) => b.ip === e.attackerIp);
                  return (
                    <button
                      type="button"
                      key={e.id}
                      className={`w-full px-3 py-2 flex gap-2 items-start text-left hover:bg-secondary/20 transition-colors ${
                        i === 0 ? "bg-red-950/10" : ""
                      }`}
                      onClick={() => setSelectedEvent(e)}
                    >
                      <span
                        className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: SEVERITY_COLORS[e.severity] }}
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
                          {blocked && (
                            <span className="text-[8px] font-mono text-green-400">
                              BLOCKED
                            </span>
                          )}
                          <p className="text-[9px] font-mono text-muted-foreground ml-auto flex-shrink-0">
                            {formatTime(e.timestamp)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
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

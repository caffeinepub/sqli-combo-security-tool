import { Slider } from "@/components/ui/slider";
import { Html, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import {
  Activity,
  AlertTriangle,
  Clock,
  Filter,
  Globe,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Shield,
  Wifi,
} from "lucide-react";
import type React from "react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { AttackEvent, BlockedIp, IpStats } from "../types";

// ── Types ──────────────────────────────────────────────────────────────────

interface LiveAttackMapPageProps {
  events: AttackEvent[];
  blockedIps: BlockedIp[];
  onBlockIp: (ip: string, reason: string, blockedBy: string) => void;
  currentUser?: { name: string; email: string };
  ipAttackCounts?: Record<string, IpStats>;
}

type ArcData = {
  id: string;
  origin: [number, number];
  target: [number, number];
  color: string;
  createdAt: number;
  duration: number;
};

// ── Constants ───────────────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

const DEFENSE_CENTER: [number, number] = [20.5937, 78.9629];

const COUNTRY_FLAGS: Record<string, string> = {
  USA: "🇺🇸",
  Russia: "🇷🇺",
  China: "🇨🇳",
  "N.Korea": "🇰🇵",
  Iran: "🇮🇷",
  UK: "🇬🇧",
  Germany: "🇩🇪",
  Netherlands: "🇳🇱",
  Ukraine: "🇺🇦",
  Brazil: "🇧🇷",
  Nigeria: "🇳🇬",
  Romania: "🇷🇴",
  Turkey: "🇹🇷",
  Japan: "🇯🇵",
  "S.Korea": "🇰🇷",
  Vietnam: "🇻🇳",
  Indonesia: "🇮🇩",
  Australia: "🇦🇺",
  Canada: "🇨🇦",
  India: "🇮🇳",
  Pakistan: "🇵🇰",
  Mexico: "🇲🇽",
  Argentina: "🇦🇷",
  "S.Africa": "🇿🇦",
  Egypt: "🇪🇬",
  France: "🇫🇷",
  Spain: "🇪🇸",
  Italy: "🇮🇹",
  Sweden: "🇸🇪",
  Israel: "🇮🇱",
  "Saudi Arabia": "🇸🇦",
};

const ATTACK_FILTER_OPTIONS = [
  "ALL",
  "SQL Injection",
  "Cross-Site Scripting (XSS)",
  "DDoS Attack",
  "CSRF Attack",
  "Command Injection",
  "Directory Traversal",
  "MITM",
  "DNS Spoofing",
  "Buffer Overflow",
  "Script Injection",
  "Credential Stuffing",
  "Brute Force Attack",
  "Privilege Escalation",
  "Session Hijacking",
];

// ── Helper Functions ─────────────────────────────────────────────────────────

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

function createArcPoints(
  originLat: number,
  originLon: number,
  targetLat: number,
  targetLon: number,
  numPoints = 60,
): THREE.Vector3[] {
  const start = new THREE.Vector3(...latLonToVec3(originLat, originLon, 1.02));
  const end = new THREE.Vector3(...latLonToVec3(targetLat, targetLon, 1.02));
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const lift = Math.max(0.3, start.distanceTo(end) * 0.4);
  mid.normalize().multiplyScalar(1.02 + lift);
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  return curve.getPoints(numPoints);
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatTimeShort(ts: string) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Three.js Scene Components ─────────────────────────────────────────────

function StarField() {
  const ref1 = useRef<THREE.Points>(null);
  const ref2 = useRef<THREE.Points>(null);

  const positions1 = useMemo(() => {
    const arr = new Float32Array(3000 * 3);
    for (let i = 0; i < 3000 * 3; i++) arr[i] = (Math.random() - 0.5) * 20;
    return arr;
  }, []);

  const positions2 = useMemo(() => {
    const arr = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500 * 3; i++) arr[i] = (Math.random() - 0.5) * 40;
    return arr;
  }, []);

  const geo1 = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions1, 3));
    return g;
  }, [positions1]);

  const geo2 = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions2, 3));
    return g;
  }, [positions2]);

  useFrame(() => {
    if (ref1.current) {
      ref1.current.rotation.y += 0.00003;
      ref1.current.rotation.x += 0.000008;
    }
    if (ref2.current) {
      ref2.current.rotation.y += 0.000015;
      ref2.current.rotation.x += 0.000005;
    }
  });

  return (
    <group>
      <points ref={ref1} geometry={geo1}>
        <pointsMaterial
          color="#cce8ff"
          size={0.03}
          sizeAttenuation
          transparent
          opacity={0.6}
        />
      </points>
      <points ref={ref2} geometry={geo2}>
        <pointsMaterial
          color="#aaccee"
          size={0.025}
          sizeAttenuation
          transparent
          opacity={0.35}
        />
      </points>
    </group>
  );
}

function GlobeFallback() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_state, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.05;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshPhongMaterial
        color="#012a45"
        emissive="#001018"
        emissiveIntensity={0.5}
        wireframe={false}
      />
    </mesh>
  );
}

function GlobeMesh({ isAutoRotating }: { isAutoRotating: boolean }) {
  const globeRef = useRef<THREE.Mesh>(null);

  // Load real Earth textures
  const colorMap = useLoader(
    THREE.TextureLoader,
    "/assets/generated/earth-color-map.dim_4096x2048.jpg",
  );
  const nightMap = useLoader(
    THREE.TextureLoader,
    "/assets/generated/earth-night-map.dim_2048x1024.jpg",
  );
  const bumpMap = useLoader(
    THREE.TextureLoader,
    "/assets/generated/earth-bump-map.dim_2048x1024.jpg",
  );
  const specularMap = useLoader(
    THREE.TextureLoader,
    "/assets/generated/earth-specular-map.dim_2048x1024.jpg",
  );

  useEffect(() => {
    if (globeRef.current) {
      const mat = globeRef.current.material as THREE.MeshPhongMaterial;
      mat.emissiveMap = nightMap as THREE.Texture;
      mat.needsUpdate = true;
    }
  }, [nightMap]);

  useFrame((_state, delta) => {
    if (globeRef.current && isAutoRotating) {
      globeRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <mesh ref={globeRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshPhongMaterial
        map={colorMap as THREE.Texture}
        bumpMap={bumpMap as THREE.Texture}
        bumpScale={0.05}
        specularMap={specularMap as THREE.Texture}
        specular={new THREE.Color("#888888")}
        shininess={25}
        emissive={new THREE.Color("#ffffff")}
        emissiveIntensity={0.15}
      />
    </mesh>
  );
}

function GlobeGrid() {
  const linesRef = useRef<THREE.Group>(null);
  const lines = useMemo(() => {
    const group: React.ReactElement[] = [];
    const r = 1.002;
    // Latitude lines every 30 degrees
    for (let lat = -60; lat <= 60; lat += 30) {
      const points: THREE.Vector3[] = [];
      for (let lon = 0; lon <= 360; lon += 4) {
        const [x, y, z] = latLonToVec3(lat, lon - 180, r);
        points.push(new THREE.Vector3(x, y, z));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      group.push(
        // @ts-ignore
        <line key={`lat-${lat}`} geometry={geo}>
          <lineBasicMaterial
            color="#00ffcc"
            transparent
            opacity={0.03}
            // @ts-ignore
            blending={THREE.AdditiveBlending}
          />
        </line>,
      );
    }
    // Longitude lines every 30 degrees
    for (let lon = 0; lon < 360; lon += 30) {
      const points: THREE.Vector3[] = [];
      for (let lat = -90; lat <= 90; lat += 3) {
        const [x, y, z] = latLonToVec3(lat, lon, r);
        points.push(new THREE.Vector3(x, y, z));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      group.push(
        // @ts-ignore
        <line key={`lon-${lon}`} geometry={geo}>
          <lineBasicMaterial
            color="#00ffcc"
            transparent
            opacity={0.03}
            // @ts-ignore
            blending={THREE.AdditiveBlending}
          />
        </line>,
      );
    }
    return group;
  }, []);

  return <group ref={linesRef}>{lines}</group>;
}

function Atmosphere() {
  return (
    <group>
      {/* Inner glow — thin bright blue ring */}
      <mesh>
        <sphereGeometry args={[1.015, 64, 64]} />
        <meshBasicMaterial
          color="#4fc3f7"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Mid atmosphere */}
      <mesh>
        <sphereGeometry args={[1.04, 64, 64]} />
        <meshBasicMaterial
          color="#1e88e5"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Outer halo */}
      <mesh>
        <sphereGeometry args={[1.08, 64, 64]} />
        <meshBasicMaterial
          color="#0d47a1"
          transparent
          opacity={0.025}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function AttackArc({
  arc,
  progress,
  fade,
}: {
  arc: ArcData;
  progress: number;
  fade: number;
}) {
  const points = useMemo(
    () =>
      createArcPoints(
        arc.origin[0],
        arc.origin[1],
        arc.target[0],
        arc.target[1],
      ),
    [arc],
  );

  const visibleCount = Math.floor(progress * points.length);
  const visiblePoints = points.slice(0, Math.max(2, visibleCount));
  const geometry = new THREE.BufferGeometry().setFromPoints(visiblePoints);
  const headPos =
    visiblePoints[visiblePoints.length - 1] ?? new THREE.Vector3();

  return (
    <group>
      {/* @ts-ignore */}
      <line geometry={geometry}>
        <lineBasicMaterial
          color={arc.color}
          transparent
          opacity={0.8 * fade}
          // @ts-ignore
          blending={THREE.AdditiveBlending}
        />
      </line>
      {progress > 0.02 && (
        <group position={[headPos.x, headPos.y, headPos.z]}>
          {/* Bright particle head */}
          <mesh>
            <sphereGeometry args={[0.012, 6, 6]} />
            <meshBasicMaterial
              color={arc.color}
              transparent
              opacity={fade}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          {/* Glow halo around head */}
          <mesh>
            <sphereGeometry args={[0.022, 6, 6]} />
            <meshBasicMaterial
              color={arc.color}
              transparent
              opacity={0.3 * fade}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

function AttackNode({
  event,
  isRecent,
  isSelected,
  onHover,
  onLeave,
  onClick,
}: {
  event: AttackEvent;
  isRecent: boolean;
  isSelected: boolean;
  onHover: (e: AttackEvent) => void;
  onLeave: () => void;
  onClick: (e: AttackEvent) => void;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const selectedRingRef = useRef<THREE.Mesh>(null);
  const selectedGlowRef = useRef<THREE.Mesh>(null);
  const lat = event.lat ?? 20.5;
  const lon = event.lon ?? 78.9;
  const [x, y, z] = latLonToVec3(lat, lon, 1.02);
  const color = SEVERITY_COLORS[event.severity] ?? "#888888";

  const dotSize =
    event.severity === "critical"
      ? 0.025
      : event.severity === "high"
        ? 0.02
        : event.severity === "medium"
          ? 0.015
          : 0.012;

  useFrame(({ clock }) => {
    if (ringRef.current && isRecent) {
      const t = (clock.getElapsedTime() * 1.5) % 1;
      ringRef.current.scale.setScalar(1 + t * 3);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - t) * 0.7;
    }
    if (selectedRingRef.current && isSelected) {
      const pulse = Math.sin(clock.getElapsedTime() * 2) * 0.25 + 1.25;
      selectedRingRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group position={[x, y, z]}>
      {/* Core dot */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Three.js mesh */}
      <mesh
        onPointerOver={() => onHover(event)}
        onPointerOut={onLeave}
        onClick={() => onClick(event)}
      >
        <sphereGeometry args={[dotSize, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Glow halo */}
      <mesh>
        <sphereGeometry args={[dotSize * 2.2, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.2}
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
      {/* Selected: pulsing highlight ring */}
      {isSelected && (
        <mesh ref={selectedRingRef}>
          <ringGeometry args={[dotSize * 3, dotSize * 4.5, 24]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
      {/* Selected: outer glow sphere */}
      {isSelected && (
        <mesh ref={selectedGlowRef}>
          <sphereGeometry args={[dotSize * 5, 8, 8]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.15}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

function AttackTooltip({ event }: { event: AttackEvent }) {
  const lat = event.lat ?? 20.5;
  const lon = event.lon ?? 78.9;
  const [x, y, z] = latLonToVec3(lat, lon, 1.08);
  const color = SEVERITY_COLORS[event.severity] ?? "#888";

  return (
    <Html
      position={[x, y, z]}
      style={{ pointerEvents: "none" }}
      zIndexRange={[100, 200]}
    >
      <div
        style={{
          background: "rgba(0,5,12,0.95)",
          border: `1px solid ${color}66`,
          borderRadius: "6px",
          padding: "8px 10px",
          minWidth: "160px",
          fontFamily: "monospace",
          boxShadow: `0 0 20px ${color}33`,
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            color,
            fontSize: "9px",
            fontWeight: "bold",
            letterSpacing: "2px",
            marginBottom: "6px",
          }}
        >
          {event.severity.toUpperCase()}
        </div>
        <div
          style={{
            color: "#e2e8f0",
            fontSize: "10px",
            fontWeight: "bold",
            marginBottom: "4px",
          }}
        >
          {event.name}
        </div>
        <div style={{ color: "#94a3b8", fontSize: "9px", marginBottom: "2px" }}>
          IP: <span style={{ color: "#00ffcc" }}>{event.attackerIp}</span>
        </div>
        <div style={{ color: "#94a3b8", fontSize: "9px", marginBottom: "2px" }}>
          {event.city}
          {event.country ? `, ${event.country}` : ""}
        </div>
        <div style={{ color: "#64748b", fontSize: "8px" }}>
          {formatTime(event.timestamp)}
        </div>
      </div>
    </Html>
  );
}

// Defense center marker (target)
function DefenseCenter() {
  const ref = useRef<THREE.Mesh>(null);
  const [x, y, z] = latLonToVec3(DEFENSE_CENTER[0], DEFENSE_CENTER[1], 1.022);

  useFrame(({ clock }) => {
    if (ref.current) {
      const t = (clock.getElapsedTime() * 0.8) % 1;
      ref.current.scale.setScalar(1 + t * 4);
      const mat = ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - t) * 0.4;
    }
  });

  return (
    <group position={[x, y, z]}>
      <mesh>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshBasicMaterial color="#00ffcc" />
      </mesh>
      <mesh ref={ref}>
        <ringGeometry args={[0.02, 0.032, 16]} />
        <meshBasicMaterial
          color="#00ffcc"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ── Camera Animator (smooth zoom to lat/lon with cinematic tilt + FOV) ────────

interface CameraAnimState {
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  midPos: THREE.Vector3; // arc midpoint for swooping path
  startFov: number;
  endFov: number;
  startTime: number;
  duration: number;
  isZoomIn: boolean;
}

function CameraAnimator({
  target,
  isZoomed: _isZoomed,
  onComplete,
  controlsRef,
}: {
  target: { lat: number; lon: number } | null;
  isZoomed: boolean;
  onComplete: () => void;
  controlsRef: React.MutableRefObject<any>;
}) {
  const { camera } = useThree();
  const animStateRef = useRef<CameraAnimState | null>(null);
  const prevTargetRef = useRef<{ lat: number; lon: number } | null>(null);
  const completedRef = useRef(false);

  // Easing: easeInOut cubic
  const easeInOut = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

  // Quadratic bezier interpolation for swooping arc path
  const bezierVec3 = (
    p0: THREE.Vector3,
    p1: THREE.Vector3,
    p2: THREE.Vector3,
    t: number,
  ): THREE.Vector3 => {
    const mt = 1 - t;
    return new THREE.Vector3(
      mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
      mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
      mt * mt * p0.z + 2 * mt * t * p1.z + t * t * p2.z,
    );
  };

  useEffect(() => {
    const targetKey = target ? `${target.lat},${target.lon}` : "null";
    const prevKey = prevTargetRef.current
      ? `${prevTargetRef.current.lat},${prevTargetRef.current.lon}`
      : "null";
    if (targetKey === prevKey) return;
    prevTargetRef.current = target;
    completedRef.current = false;

    const startPos = camera.position.clone();
    const cam = camera as THREE.PerspectiveCamera;
    const startFov = cam.fov;
    let endPos: THREE.Vector3;
    let endFov: number;
    let isZoomIn: boolean;

    if (target) {
      // Zoom in: position camera at the lat/lon point at distance 1.85
      // Add a slight upward tilt offset so the target sits slightly below
      // center — cinematic "looking down at location" framing
      const [ex, ey, ez] = latLonToVec3(target.lat, target.lon, 1.85);
      const baseEnd = new THREE.Vector3(ex, ey, ez);
      // Compute a "world up" perpendicular to push camera slightly upward
      // in the local frame of the target position
      const radialDir = baseEnd.clone().normalize();
      const worldUp = new THREE.Vector3(0, 1, 0);
      const tangentUp = worldUp
        .clone()
        .sub(radialDir.clone().multiplyScalar(radialDir.dot(worldUp)))
        .normalize();
      // Tilt offset: 0.12 units in the local-up direction
      endPos = baseEnd.clone().addScaledVector(tangentUp, 0.12);
      endFov = 32; // tighter FOV for cinematic depth
      isZoomIn = true;
    } else {
      // Reset to global view
      endPos = new THREE.Vector3(0, 0, 2.8);
      endFov = 45;
      isZoomIn = false;
    }

    // Build a mid-control-point for the bezier arc:
    // pull the midpoint slightly outward (away from globe center) so the
    // camera swoops outward before zooming in — adds depth/drama
    const midPos = startPos
      .clone()
      .add(endPos)
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(isZoomIn ? 3.2 : 2.8);

    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }

    animStateRef.current = {
      startPos,
      endPos,
      midPos,
      startFov,
      endFov,
      startTime: performance.now(),
      duration: 1800,
      isZoomIn,
    };
  }, [target, camera, controlsRef]);

  useFrame(() => {
    const anim = animStateRef.current;
    if (!anim || completedRef.current) return;

    const elapsed = performance.now() - anim.startTime;
    const rawT = Math.min(1, elapsed / anim.duration);
    const t = easeInOut(rawT);

    // Position: follow bezier arc for cinematic swoop
    const pos = bezierVec3(anim.startPos, anim.midPos, anim.endPos, t);
    camera.position.copy(pos);

    // Always look at globe center
    camera.lookAt(0, 0, 0);

    // FOV: interpolate for zoom-in depth effect
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = anim.startFov + (anim.endFov - anim.startFov) * t;
    cam.updateProjectionMatrix();

    if (rawT >= 1 && !completedRef.current) {
      completedRef.current = true;
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
        // Sync orbit controls target after animation
        if (controlsRef.current.update) controlsRef.current.update();
      }
      onComplete();
    }
  });

  return null;
}

// The main arc animation manager
function ArcsManager({
  arcs,
  onArcProgress,
}: {
  arcs: ArcData[];
  onArcProgress: (id: string, progress: number, fade: number) => void;
}) {
  useFrame(() => {
    const now = Date.now();
    for (const arc of arcs) {
      const elapsed = now - arc.createdAt;
      if (elapsed <= arc.duration) {
        const p = Math.min(1, elapsed / arc.duration);
        onArcProgress(arc.id, p, 1.0);
      } else {
        const fadeElapsed = elapsed - arc.duration;
        const fadeProgress = Math.min(1, fadeElapsed / 1500);
        onArcProgress(arc.id, 1.0, 1.0 - fadeProgress);
      }
    }
  });
  return null;
}

function GlobeScene({
  events,
  arcs,
  arcStates,
  onArcProgress,
  hoveredEvent,
  onHoverEvent,
  onLeaveEvent,
  onSelectEvent,
  isAutoRotating,
  selectedEventId,
  cameraTarget,
  onZoomComplete,
  controlsRef,
  isZoomed,
}: {
  events: AttackEvent[];
  arcs: ArcData[];
  arcStates: Map<string, { progress: number; fade: number }>;
  onArcProgress: (id: string, progress: number, fade: number) => void;
  hoveredEvent: AttackEvent | null;
  onHoverEvent: (e: AttackEvent) => void;
  onLeaveEvent: () => void;
  onSelectEvent: (e: AttackEvent) => void;
  isAutoRotating: boolean;
  selectedEventId: string | null;
  cameraTarget: { lat: number; lon: number } | null;
  onZoomComplete: () => void;
  controlsRef: React.MutableRefObject<any>;
  isZoomed: boolean;
}) {
  const recentIds = useMemo(
    () =>
      new Set(
        [...events]
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )
          .slice(0, 5)
          .map((e) => e.id),
      ),
    [events],
  );

  return (
    <>
      <ambientLight intensity={0.08} color="#1a2a4a" />
      <directionalLight position={[5, 3, 5]} intensity={1.2} color="#fff8e7" />
      <pointLight position={[-6, -2, -4]} intensity={0.08} color="#1a3a6a" />

      <StarField />
      <Suspense fallback={<GlobeFallback />}>
        <GlobeMesh isAutoRotating={isAutoRotating} />
      </Suspense>
      <GlobeGrid />
      <Atmosphere />
      <DefenseCenter />

      {/* Attack arcs */}
      {arcs.map((arc) => {
        const state = arcStates.get(arc.id) ?? { progress: 0, fade: 1 };
        return (
          <AttackArc
            key={arc.id}
            arc={arc}
            progress={state.progress}
            fade={state.fade}
          />
        );
      })}

      {/* Attack nodes */}
      {events.map((event) => (
        <AttackNode
          key={event.id}
          event={event}
          isRecent={recentIds.has(event.id)}
          isSelected={event.id === selectedEventId}
          onHover={onHoverEvent}
          onLeave={onLeaveEvent}
          onClick={onSelectEvent}
        />
      ))}

      {/* Hover tooltip */}
      {hoveredEvent && <AttackTooltip event={hoveredEvent} />}

      <ArcsManager arcs={arcs} onArcProgress={onArcProgress} />

      <CameraAnimator
        target={cameraTarget}
        isZoomed={isZoomed}
        onComplete={onZoomComplete}
        controlsRef={controlsRef}
      />

      <OrbitControls
        ref={controlsRef}
        enableZoom
        enablePan={false}
        minDistance={1.4}
        maxDistance={5}
        autoRotate={false}
        rotateSpeed={0.6}
        zoomSpeed={0.8}
      />
    </>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────

export default function LiveAttackMapPage({
  events,
  blockedIps,
  onBlockIp,
  currentUser,
  ipAttackCounts: _ipAttackCounts = {},
}: LiveAttackMapPageProps) {
  const [selectedEvent, setSelectedEvent] = useState<AttackEvent | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<AttackEvent | null>(null);
  const [arcs, setArcs] = useState<ArcData[]>([]);
  const [arcStates, setArcStates] = useState<
    Map<string, { progress: number; fade: number }>
  >(new Map());
  const [isPlaying, setIsPlaying] = useState(true);
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [timelineValue, setTimelineValue] = useState([100]);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const controlsRef = useRef<any>(null);

  const seenEventIds = useRef<Set<string>>(new Set());

  // Watch for new events and add arcs
  useEffect(() => {
    const newEvents = events.filter((e) => !seenEventIds.current.has(e.id));
    if (newEvents.length === 0) return;

    for (const e of newEvents) {
      seenEventIds.current.add(e.id);
    }

    if (!isPlaying) return;

    setArcs((prev) => {
      const newArcs: ArcData[] = newEvents.map((e) => ({
        id: `arc-${e.id}`,
        origin: [e.lat ?? 20.5, e.lon ?? 78.9] as [number, number],
        target: DEFENSE_CENTER,
        color: SEVERITY_COLORS[e.severity] ?? "#ef4444",
        createdAt: Date.now(),
        duration: 3000 + Math.random() * 1000,
      }));
      // Cap at 20 active arcs
      return [...prev, ...newArcs].slice(-20);
    });
  }, [events, isPlaying]);

  // Clean up expired arcs
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setArcs((prev) =>
        prev.filter((arc) => now - arc.createdAt < arc.duration + 2000),
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Replay mode auto-advance
  useEffect(() => {
    if (!isReplayMode || !isPlaying) return;
    const sorted = [...events].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    if (sorted.length === 0) return;
    const interval = setInterval(() => {
      setReplayIndex((prev) => {
        const next = prev + 1;
        if (next >= Math.min(sorted.length, 60)) {
          setIsReplayMode(false);
          return 0;
        }
        // Add arc for this replay event
        const e = sorted[next];
        if (e) {
          setArcs((prevArcs) => {
            const newArc: ArcData = {
              id: `replay-arc-${e.id}-${Date.now()}`,
              origin: [e.lat ?? 20.5, e.lon ?? 78.9] as [number, number],
              target: DEFENSE_CENTER,
              color: SEVERITY_COLORS[e.severity] ?? "#ef4444",
              createdAt: Date.now(),
              duration: 2500,
            };
            return [...prevArcs, newArc].slice(-20);
          });
        }
        return next;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [isReplayMode, isPlaying, events]);

  const handleArcProgress = (id: string, progress: number, fade: number) => {
    setArcStates((prev) => {
      const next = new Map(prev);
      next.set(id, { progress, fade });
      return next;
    });
  };

  // Filtered events for display
  const filteredEvents = useMemo(() => {
    let filtered = events;
    if (filterType !== "ALL") {
      filtered = filtered.filter(
        (e) =>
          e.name.toLowerCase().includes(filterType.toLowerCase()) ||
          e.attackType?.toLowerCase().includes(filterType.toLowerCase()),
      );
    }
    if (timelineValue[0] < 100) {
      const sorted = [...filtered].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
      const cutoff = Math.floor((timelineValue[0] / 100) * sorted.length);
      filtered = sorted.slice(0, Math.max(1, cutoff));
    }
    return filtered;
  }, [events, filterType, timelineValue]);

  const recentEvents = useMemo(
    () =>
      [...filteredEvents]
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        .slice(0, 20),
    [filteredEvents],
  );

  // Threat level computation
  const threatLevel = useMemo(() => {
    const recent10 = recentEvents.slice(0, 10);
    if (recent10.some((e) => e.severity === "critical")) return "CRITICAL";
    if (recent10.some((e) => e.severity === "high")) return "HIGH";
    if (recent10.some((e) => e.severity === "medium")) return "MEDIUM";
    return "LOW";
  }, [recentEvents]);

  const threatLevelColor = {
    CRITICAL: "#ef4444",
    HIGH: "#f97316",
    MEDIUM: "#eab308",
    LOW: "#22c55e",
  }[threatLevel];

  // Top attacking countries
  const topCountries = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of filteredEvents) {
      const c = e.country ?? "Unknown";
      counts[c] = (counts[c] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [filteredEvents]);

  // Most common attack type
  const mostCommonAttack = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of filteredEvents) {
      counts[e.name] = (counts[e.name] ?? 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0] ?? null;
  }, [filteredEvents]);

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

  const handleSelectEvent = (e: AttackEvent) => {
    setSelectedEvent(e);
    setIsAutoRotating(false);
    setCameraTarget({ lat: e.lat ?? 20.5, lon: e.lon ?? 78.9 });
    setIsZoomed(false);
  };

  const handleResetView = () => {
    setSelectedEvent(null);
    setCameraTarget(null);
    setIsZoomed(false);
    setIsAutoRotating(true);
  };

  const handleZoomComplete = () => {
    setIsZoomed(true);
  };

  const handleStartReplay = () => {
    setReplayIndex(0);
    setIsReplayMode(true);
    setIsPlaying(true);
    setArcs([]);
  };

  const sortedForReplay = useMemo(
    () =>
      [...events]
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        )
        .slice(0, 60),
    [events],
  );

  return (
    <div
      className="min-h-screen overflow-y-auto"
      style={{ background: "#000508", color: "#e2e8f0" }}
    >
      {/* ── Header ── */}
      <div
        style={{
          borderBottom: "1px solid rgba(0,255,204,0.15)",
          background: "rgba(0,8,18,0.95)",
          padding: "12px 20px",
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div
              style={{
                background: "rgba(0,255,204,0.08)",
                border: "1px solid rgba(0,255,204,0.25)",
                borderRadius: "8px",
                padding: "6px 10px",
              }}
            >
              <Globe size={18} style={{ color: "#00ffcc" }} />
            </div>
            <div>
              <h1
                style={{
                  fontFamily: "monospace",
                  fontSize: "16px",
                  fontWeight: "bold",
                  letterSpacing: "4px",
                  color: "#e2e8f0",
                  margin: 0,
                }}
              >
                GLOBAL CYBER ATTACK MAP
              </h1>
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: "9px",
                  color: "#475569",
                  letterSpacing: "2px",
                  margin: 0,
                }}
              >
                SOC THREAT INTELLIGENCE DASHBOARD — REAL-TIME VISUALIZATION
              </p>
            </div>
          </div>

          {/* Live indicator + severity legend */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ background: "#ef4444" }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ background: "#ef4444" }}
                />
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "10px",
                  color: "#ef4444",
                  letterSpacing: "2px",
                }}
              >
                LIVE
              </span>
            </div>
            <div className="flex items-center gap-3">
              {(["critical", "high", "medium", "low"] as const).map((s) => (
                <div key={s} className="flex items-center gap-1">
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: SEVERITY_COLORS[s],
                      boxShadow: `0 0 6px ${SEVERITY_COLORS[s]}`,
                      display: "inline-block",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "9px",
                      color: "#64748b",
                      textTransform: "uppercase",
                    }}
                  >
                    {s}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div
        className="flex gap-0"
        style={{ height: "calc(100vh - 120px)", minHeight: 540 }}
      >
        {/* Globe (left, 2/3) */}
        <div
          style={{
            flex: "0 0 66%",
            position: "relative",
            borderRight: "1px solid rgba(0,255,204,0.1)",
          }}
        >
          {/* Globe overlays */}
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              zIndex: 10,
              background: "rgba(0,5,12,0.85)",
              border: "1px solid rgba(0,255,204,0.2)",
              borderRadius: 6,
              padding: "4px 10px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              pointerEvents: "none",
            }}
          >
            <Radio
              size={9}
              style={{ color: "#00ffcc" }}
              className="animate-pulse"
            />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "9px",
                color: "#00ffcc",
                letterSpacing: "1.5px",
              }}
            >
              LIVE TRACKING · {filteredEvents.length} EVENTS
            </span>
          </div>

          {/* Active arcs badge */}
          {arcs.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                zIndex: 10,
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.4)",
                borderRadius: 6,
                padding: "4px 10px",
                pointerEvents: "none",
              }}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "9px",
                  color: "#ef4444",
                  letterSpacing: "1px",
                }}
              >
                {arcs.length} ACTIVE ARCS
              </span>
            </div>
          )}

          {/* Replay mode banner */}
          {isReplayMode && (
            <div
              style={{
                position: "absolute",
                bottom: 90,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 10,
                background: "rgba(234,179,8,0.15)",
                border: "1px solid rgba(234,179,8,0.5)",
                borderRadius: 8,
                padding: "6px 16px",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "9px",
                  color: "#eab308",
                  letterSpacing: "2px",
                }}
              >
                ⏪ REPLAY MODE — {replayIndex + 1} /{" "}
                {Math.min(sortedForReplay.length, 60)}
              </span>
            </div>
          )}

          <Canvas
            camera={{ position: [0, 0, 2.8], fov: 45 }}
            style={{ width: "100%", height: "100%", background: "#000508" }}
            gl={{ antialias: true }}
            onPointerDown={() => setIsAutoRotating(false)}
          >
            <Suspense fallback={null}>
              <GlobeScene
                events={filteredEvents}
                arcs={arcs}
                arcStates={arcStates}
                onArcProgress={handleArcProgress}
                hoveredEvent={hoveredEvent}
                onHoverEvent={setHoveredEvent}
                onLeaveEvent={() => setHoveredEvent(null)}
                onSelectEvent={handleSelectEvent}
                isAutoRotating={isAutoRotating}
                selectedEventId={selectedEvent?.id ?? null}
                cameraTarget={cameraTarget}
                onZoomComplete={handleZoomComplete}
                controlsRef={controlsRef}
                isZoomed={isZoomed}
              />
            </Suspense>
          </Canvas>

          {/* Controls hint */}
          <div
            style={{
              position: "absolute",
              bottom: 10,
              left: 10,
              zIndex: 10,
              display: "flex",
              gap: 6,
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "8px",
                color: "#334155",
                letterSpacing: "1px",
              }}
            >
              DRAG TO ROTATE · SCROLL TO ZOOM · CLICK NODE FOR DETAILS
            </span>
          </div>

          {/* ← BACK TO GLOBAL floating button */}
          {(isZoomed || selectedEvent !== null) && (
            <button
              type="button"
              onClick={handleResetView}
              style={{
                position: "absolute",
                top: 50,
                left: 16,
                zIndex: 20,
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 5,
                fontFamily: "monospace",
                fontSize: "9px",
                fontWeight: "bold",
                letterSpacing: "1.5px",
                border: "1px solid rgba(0,255,204,0.4)",
                color: "#00ffcc",
                background: "rgba(0,8,18,0.88)",
                cursor: "pointer",
                backdropFilter: "blur(8px)",
                boxShadow: "0 0 16px rgba(0,255,204,0.15)",
              }}
              data-ocid="map.secondary_button"
            >
              ← BACK TO GLOBAL
            </button>
          )}

          {/* Mini-map indicator (shown when event selected) */}
          {selectedEvent && (
            <div
              style={{
                position: "absolute",
                bottom: 70,
                right: 12,
                zIndex: 20,
                pointerEvents: "none",
              }}
            >
              <svg
                width={80}
                height={80}
                viewBox="0 0 80 80"
                role="img"
                aria-label="Zoomed region mini-map"
              >
                <circle
                  cx={40}
                  cy={40}
                  r={36}
                  fill="rgba(0,5,12,0.85)"
                  stroke="#00ffcc"
                  strokeWidth={1}
                  strokeOpacity={0.4}
                />
                <circle
                  cx={40}
                  cy={40}
                  r={28}
                  fill="none"
                  stroke="#00ffcc"
                  strokeWidth={0.5}
                  strokeOpacity={0.15}
                />
                {(() => {
                  const lat = ((selectedEvent.lat ?? 20.5) * Math.PI) / 180;
                  const lon =
                    (((selectedEvent.lon ?? 78.9) + 180) * Math.PI) / 180;
                  const R = 26;
                  const cx = 40;
                  const cy = 40;
                  const px = cx + R * Math.cos(lat) * Math.sin(lon);
                  const py = cy - R * Math.sin(lat);
                  const sc =
                    SEVERITY_COLORS[selectedEvent.severity] ?? "#00ffcc";
                  return (
                    <g>
                      <circle cx={px} cy={py} r={4} fill={sc} opacity={0.9} />
                      <circle cx={px} cy={py} r={7} fill={sc} opacity={0.25} />
                    </g>
                  );
                })()}
              </svg>
              <div
                style={{
                  textAlign: "center",
                  fontFamily: "monospace",
                  fontSize: "7px",
                  color: "#334155",
                  letterSpacing: "1px",
                  marginTop: 2,
                }}
              >
                ZOOMED REGION
              </div>
            </div>
          )}
        </div>

        {/* ── Side Panel (right, 1/3) ── */}
        <div
          style={{
            flex: "0 0 34%",
            display: "flex",
            flexDirection: "column",
            gap: 0,
            overflowY: "auto",
            background: "rgba(0,5,12,0.98)",
          }}
        >
          {/* Selected Event Details Panel (appears at top of sidebar when event is selected) */}
          {selectedEvent &&
            (() => {
              const sevColor =
                SEVERITY_COLORS[selectedEvent.severity] ?? "#00ffcc";
              return (
                <div
                  style={{
                    padding: "12px 14px",
                    borderBottom: `1px solid ${sevColor}44`,
                    background: `linear-gradient(135deg, ${sevColor}08 0%, rgba(0,5,12,0.98) 100%)`,
                    boxShadow: `0 2px 20px ${sevColor}12`,
                  }}
                  data-ocid="map.panel"
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        style={{
                          color: sevColor,
                          border: `1px solid ${sevColor}55`,
                          borderRadius: 3,
                          padding: "1px 6px",
                          fontFamily: "monospace",
                          fontSize: "8px",
                          fontWeight: "bold",
                          letterSpacing: "1.5px",
                          flexShrink: 0,
                        }}
                      >
                        {selectedEvent.severity.toUpperCase()}
                      </span>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "10px",
                          fontWeight: "bold",
                          color: "#e2e8f0",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {selectedEvent.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetView}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#64748b",
                        cursor: "pointer",
                        fontSize: 13,
                        flexShrink: 0,
                        lineHeight: 1,
                      }}
                      data-ocid="map.close_button"
                    >
                      ✕
                    </button>
                  </div>
                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-2">
                    <div>
                      <p
                        style={{
                          fontFamily: "monospace",
                          fontSize: "7px",
                          color: "#475569",
                          marginBottom: 1,
                          letterSpacing: "1px",
                        }}
                      >
                        IP ADDRESS
                      </p>
                      <p
                        style={{
                          fontFamily: "monospace",
                          fontSize: "10px",
                          color: "#00ffcc",
                          margin: 0,
                        }}
                      >
                        {selectedEvent.attackerIp}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          fontFamily: "monospace",
                          fontSize: "7px",
                          color: "#475569",
                          marginBottom: 1,
                          letterSpacing: "1px",
                        }}
                      >
                        LOCATION
                      </p>
                      <p
                        style={{
                          fontFamily: "monospace",
                          fontSize: "9px",
                          color: "#f97316",
                          margin: 0,
                        }}
                      >
                        {selectedEvent.city}
                        {selectedEvent.country
                          ? `, ${selectedEvent.country}`
                          : ""}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          fontFamily: "monospace",
                          fontSize: "7px",
                          color: "#475569",
                          marginBottom: 1,
                          letterSpacing: "1px",
                        }}
                      >
                        ATTACK TYPE
                      </p>
                      <p
                        style={{
                          fontFamily: "monospace",
                          fontSize: "9px",
                          color: "#e2e8f0",
                          margin: 0,
                        }}
                      >
                        {selectedEvent.attackType ?? selectedEvent.name}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          fontFamily: "monospace",
                          fontSize: "7px",
                          color: "#475569",
                          marginBottom: 1,
                          letterSpacing: "1px",
                        }}
                      >
                        TIMESTAMP
                      </p>
                      <p
                        style={{
                          fontFamily: "monospace",
                          fontSize: "9px",
                          color: "#94a3b8",
                          margin: 0,
                        }}
                      >
                        {formatTime(selectedEvent.timestamp)}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          fontFamily: "monospace",
                          fontSize: "7px",
                          color: "#475569",
                          marginBottom: 1,
                          letterSpacing: "1px",
                        }}
                      >
                        SEVERITY
                      </p>
                      <p
                        style={{
                          fontFamily: "monospace",
                          fontSize: "9px",
                          color: sevColor,
                          margin: 0,
                          fontWeight: "bold",
                        }}
                      >
                        {selectedEvent.severity.toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          fontFamily: "monospace",
                          fontSize: "7px",
                          color: "#475569",
                          marginBottom: 1,
                          letterSpacing: "1px",
                        }}
                      >
                        COORDINATES
                      </p>
                      <p
                        style={{
                          fontFamily: "monospace",
                          fontSize: "8px",
                          color: "#64748b",
                          margin: 0,
                        }}
                      >
                        {(selectedEvent.lat ?? 20.5).toFixed(2)}°N{" "}
                        {(selectedEvent.lon ?? 78.9).toFixed(2)}°E
                      </p>
                    </div>
                  </div>
                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    {!isAlreadyBlocked ? (
                      <button
                        type="button"
                        onClick={handleBlockIp}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "4px 10px",
                          borderRadius: 4,
                          fontFamily: "monospace",
                          fontSize: "8px",
                          fontWeight: "bold",
                          letterSpacing: "1.5px",
                          border: "1px solid rgba(239,68,68,0.5)",
                          color: "#ef4444",
                          background: "rgba(239,68,68,0.08)",
                          cursor: "pointer",
                        }}
                        data-ocid="map.delete_button"
                      >
                        <Shield size={9} />
                        BLOCK IP
                      </button>
                    ) : (
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "8px",
                          color: "#22c55e",
                        }}
                      >
                        ✓ IP BLOCKED
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleResetView}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "4px 10px",
                        borderRadius: 4,
                        fontFamily: "monospace",
                        fontSize: "8px",
                        letterSpacing: "1.5px",
                        border: "1px solid rgba(0,255,204,0.3)",
                        color: "#00ffcc",
                        background: "rgba(0,255,204,0.04)",
                        cursor: "pointer",
                      }}
                      data-ocid="map.secondary_button"
                    >
                      ← BACK TO GLOBAL
                    </button>
                  </div>
                </div>
              );
            })()}

          {/* Panel 1: Live Stats */}
          <div
            style={{
              padding: "12px 14px",
              borderBottom: "1px solid rgba(0,255,204,0.1)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Activity size={10} style={{ color: "#00ffcc" }} />
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "9px",
                  color: "#00ffcc",
                  letterSpacing: "2px",
                }}
              >
                LIVE STATS
              </span>
              <span className="relative flex h-1.5 w-1.5 ml-auto">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ background: "#ef4444" }}
                />
                <span
                  className="relative inline-flex rounded-full h-1.5 w-1.5"
                  style={{ background: "#ef4444" }}
                />
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div
                style={{
                  background: "rgba(0,255,204,0.04)",
                  border: "1px solid rgba(0,255,204,0.12)",
                  borderRadius: 6,
                  padding: "8px 10px",
                }}
              >
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "22px",
                    fontWeight: "bold",
                    color: "#00ffcc",
                    margin: 0,
                    lineHeight: 1,
                  }}
                >
                  {filteredEvents.length}
                </p>
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "8px",
                    color: "#475569",
                    letterSpacing: "1px",
                    margin: "4px 0 0",
                  }}
                >
                  TOTAL ATTACKS
                </p>
              </div>
              <div
                style={{
                  background: `${threatLevelColor}0d`,
                  border: `1px solid ${threatLevelColor}33`,
                  borderRadius: 6,
                  padding: "8px 10px",
                }}
              >
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: threatLevelColor,
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  {threatLevel}
                </p>
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "8px",
                    color: "#475569",
                    letterSpacing: "1px",
                    margin: "4px 0 0",
                  }}
                >
                  THREAT LEVEL
                </p>
              </div>
            </div>

            {/* Severity breakdown */}
            <div className="grid grid-cols-4 gap-1">
              {(["critical", "high", "medium", "low"] as const).map((s) => {
                const count = filteredEvents.filter(
                  (e) => e.severity === s,
                ).length;
                return (
                  <div key={s} className="text-center">
                    <p
                      style={{
                        fontFamily: "monospace",
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: SEVERITY_COLORS[s],
                        margin: 0,
                      }}
                    >
                      {count}
                    </p>
                    <p
                      style={{
                        fontFamily: "monospace",
                        fontSize: "7px",
                        color: "#334155",
                        textTransform: "uppercase",
                        margin: 0,
                      }}
                    >
                      {s}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Most common attack */}
            {mostCommonAttack && (
              <div
                style={{
                  marginTop: 8,
                  background: "rgba(249,115,22,0.06)",
                  border: "1px solid rgba(249,115,22,0.2)",
                  borderRadius: 5,
                  padding: "5px 8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "8px",
                    color: "#94a3b8",
                  }}
                >
                  TOP ATTACK TYPE
                </span>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "9px",
                    color: "#f97316",
                    fontWeight: "bold",
                  }}
                >
                  {mostCommonAttack[0]} ×{mostCommonAttack[1]}
                </span>
              </div>
            )}
          </div>

          {/* Panel 2: Top Attacking Countries */}
          <div
            style={{
              padding: "12px 14px",
              borderBottom: "1px solid rgba(0,255,204,0.1)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={10} style={{ color: "#22c55e" }} />
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "9px",
                  color: "#22c55e",
                  letterSpacing: "2px",
                  textShadow: "0 0 12px #22c55e55",
                }}
              >
                TOP ATTACKING COUNTRIES
              </span>
            </div>
            {topCountries.length === 0 ? (
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: "9px",
                  color: "#334155",
                  textAlign: "center",
                  padding: "8px 0",
                }}
              >
                NO DATA
              </p>
            ) : (
              <div className="space-y-2">
                {topCountries.map(([country, count], i) => {
                  const max = topCountries[0]?.[1] ?? 1;
                  const pct = (count / max) * 100;
                  const flag = COUNTRY_FLAGS[country] ?? "🌐";
                  return (
                    <div key={country} data-ocid={`map.item.${i + 1}`}>
                      <div className="flex justify-between mb-0.5">
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: "9px",
                            color: "#e2e8f0",
                          }}
                        >
                          {flag} {country}
                        </span>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: "9px",
                            color: "#22c55e",
                            fontWeight: "bold",
                          }}
                        >
                          {count}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 3,
                          background: "rgba(34,197,94,0.1)",
                          borderRadius: 2,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background:
                              "linear-gradient(90deg, #22c55e, #00ffcc)",
                            borderRadius: 2,
                            transition: "width 0.5s ease",
                            boxShadow: "0 0 8px #22c55e88",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Panel 3: Live Event Feed */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div
              style={{
                padding: "10px 14px 8px",
                borderBottom: "1px solid rgba(0,255,204,0.1)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Wifi size={9} style={{ color: "#00ffcc" }} />
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "9px",
                  color: "#00ffcc",
                  letterSpacing: "2px",
                }}
              >
                LIVE EVENT FEED
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "8px",
                  color: "#334155",
                  marginLeft: "auto",
                }}
              >
                NEWEST FIRST
              </span>
            </div>
            <div
              style={{
                overflowY: "auto",
                flex: 1,
                maxHeight: 320,
              }}
              data-ocid="map.list"
            >
              {recentEvents.length === 0 ? (
                <div
                  style={{ textAlign: "center", padding: "20px 0" }}
                  data-ocid="map.empty_state"
                >
                  <Globe
                    size={24}
                    style={{ color: "#1e3a4a", margin: "0 auto 8px" }}
                  />
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "9px",
                      color: "#1e3a4a",
                    }}
                  >
                    NO EVENTS DETECTED
                  </p>
                </div>
              ) : (
                recentEvents.map((e, i) => {
                  const blocked = blockedIps.some((b) => b.ip === e.attackerIp);
                  const color = SEVERITY_COLORS[e.severity] ?? "#888";
                  return (
                    <button
                      type="button"
                      key={e.id}
                      onClick={() => handleSelectEvent(e)}
                      style={{
                        width: "100%",
                        padding: "7px 14px",
                        display: "flex",
                        gap: 8,
                        alignItems: "flex-start",
                        textAlign: "left",
                        background: i === 0 ? `${color}08` : "transparent",
                        borderBottom: "1px solid rgba(0,255,204,0.06)",
                        cursor: "pointer",
                        border: "none",
                        borderBottomWidth: 1,
                        borderBottomStyle: "solid",
                        borderBottomColor: "rgba(0,255,204,0.06)",
                      }}
                      data-ocid={`map.item.${i + 1}`}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: color,
                          boxShadow: `0 0 6px ${color}`,
                          flexShrink: 0,
                          marginTop: 3,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex items-center justify-between gap-1">
                          <p
                            style={{
                              fontFamily: "monospace",
                              fontSize: "9px",
                              color: "#e2e8f0",
                              margin: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {e.name}
                          </p>
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: "7px",
                              color: "#334155",
                              flexShrink: 0,
                            }}
                          >
                            {formatTimeShort(e.timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: "8px",
                              color: "#f97316",
                            }}
                          >
                            {e.city}
                            {e.country ? `, ${e.country}` : ""}
                          </span>
                          {blocked && (
                            <span
                              style={{
                                fontFamily: "monospace",
                                fontSize: "7px",
                                color: "#22c55e",
                              }}
                            >
                              BLOCKED
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Controls Bar ── */}
      <div
        style={{
          borderTop: "1px solid rgba(0,255,204,0.12)",
          background: "rgba(0,5,12,0.98)",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter size={10} style={{ color: "#475569" }} />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              fontFamily: "monospace",
              fontSize: "9px",
              background: "rgba(0,255,204,0.04)",
              border: "1px solid rgba(0,255,204,0.2)",
              borderRadius: 4,
              color: "#00ffcc",
              padding: "3px 8px",
              cursor: "pointer",
              outline: "none",
            }}
            data-ocid="map.select"
          >
            {ATTACK_FILTER_OPTIONS.map((opt) => (
              <option key={opt} value={opt} style={{ background: "#000a14" }}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Timeline slider */}
        <div
          className="flex items-center gap-2"
          style={{ flex: 1, minWidth: 120 }}
        >
          <Clock size={10} style={{ color: "#475569" }} />
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "8px",
              color: "#475569",
              whiteSpace: "nowrap",
            }}
          >
            TIMELINE
          </span>
          <div style={{ flex: 1 }}>
            <Slider
              value={timelineValue}
              onValueChange={setTimelineValue}
              min={0}
              max={100}
              step={1}
              className="w-full"
              data-ocid="map.toggle"
            />
          </div>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "8px",
              color: timelineValue[0] === 100 ? "#00ffcc" : "#eab308",
              whiteSpace: "nowrap",
            }}
          >
            {timelineValue[0] === 100 ? "LIVE" : `${timelineValue[0]}%`}
          </span>
        </div>

        {/* Playback controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              borderRadius: 4,
              fontFamily: "monospace",
              fontSize: "8px",
              letterSpacing: "1px",
              border: "1px solid rgba(0,255,204,0.25)",
              color: "#00ffcc",
              background: isPlaying
                ? "rgba(0,255,204,0.06)"
                : "rgba(0,255,204,0.02)",
              cursor: "pointer",
            }}
            data-ocid="map.toggle"
          >
            {isPlaying ? <Pause size={9} /> : <Play size={9} />}
            {isPlaying ? "PAUSE" : "PLAY"}
          </button>

          <button
            type="button"
            onClick={() => {
              setTimelineValue([100]);
              setIsPlaying(true);
              setIsReplayMode(false);
            }}
            style={{
              padding: "4px 10px",
              borderRadius: 4,
              fontFamily: "monospace",
              fontSize: "8px",
              letterSpacing: "1px",
              border: "1px solid rgba(239,68,68,0.4)",
              color: "#ef4444",
              background: "rgba(239,68,68,0.06)",
              cursor: "pointer",
            }}
            data-ocid="map.primary_button"
          >
            LIVE
          </button>

          <button
            type="button"
            onClick={handleStartReplay}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              borderRadius: 4,
              fontFamily: "monospace",
              fontSize: "8px",
              letterSpacing: "1px",
              border: isReplayMode
                ? "1px solid rgba(234,179,8,0.6)"
                : "1px solid rgba(234,179,8,0.3)",
              color: "#eab308",
              background: isReplayMode
                ? "rgba(234,179,8,0.1)"
                : "rgba(234,179,8,0.04)",
              cursor: "pointer",
            }}
            data-ocid="map.secondary_button"
          >
            <RefreshCw size={9} />
            REPLAY
          </button>
        </div>

        {/* Heatmap toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHeatmap((p) => !p)}
            style={{
              padding: "4px 10px",
              borderRadius: 4,
              fontFamily: "monospace",
              fontSize: "8px",
              letterSpacing: "1px",
              border: showHeatmap
                ? "1px solid rgba(249,115,22,0.5)"
                : "1px solid rgba(249,115,22,0.2)",
              color: showHeatmap ? "#f97316" : "#475569",
              background: showHeatmap ? "rgba(249,115,22,0.08)" : "transparent",
              cursor: "pointer",
            }}
            data-ocid="map.toggle"
          >
            HEATMAP {showHeatmap ? "ON" : "OFF"}
          </button>

          <button
            type="button"
            onClick={() => setIsAutoRotating((p) => !p)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              borderRadius: 4,
              fontFamily: "monospace",
              fontSize: "8px",
              letterSpacing: "1px",
              border: isAutoRotating
                ? "1px solid rgba(0,255,204,0.4)"
                : "1px solid rgba(0,255,204,0.15)",
              color: isAutoRotating ? "#00ffcc" : "#475569",
              background: isAutoRotating
                ? "rgba(0,255,204,0.06)"
                : "transparent",
              cursor: "pointer",
            }}
            data-ocid="map.toggle"
          >
            <Globe size={9} />
            AUTO ROTATE
          </button>
        </div>
      </div>
    </div>
  );
}

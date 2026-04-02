import {
  AlertTriangle,
  Globe,
  MapPin,
  Radio,
  Shield,
  Wifi,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AttackEvent, BlockedIp } from "../types";

interface LiveAttackMapPageProps {
  events: AttackEvent[];
  blockedIps: BlockedIp[];
  onBlockIp: (ip: string, reason: string, blockedBy: string) => void;
  currentUser?: { name: string; email: string };
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

// Load leaflet CSS dynamically
function ensureLeafletCss() {
  if (document.getElementById("leaflet-css")) return;
  const link = document.createElement("link");
  link.id = "leaflet-css";
  link.rel = "stylesheet";
  link.href =
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
  document.head.appendChild(link);
}

// Load leaflet JS dynamically
function loadLeaflet(): Promise<typeof window.L> {
  return new Promise((resolve, reject) => {
    if (window.L) {
      resolve(window.L);
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

declare global {
  interface Window {
    L: any;
  }
}

export default function LiveAttackMapPage({
  events,
  blockedIps,
  onBlockIp,
  currentUser,
}: LiveAttackMapPageProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const [selectedEvent, setSelectedEvent] = useState<AttackEvent | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);

  // Load Leaflet from CDN
  useEffect(() => {
    ensureLeafletCss();
    loadLeaflet()
      .then(() => setLeafletReady(true))
      .catch(() => console.error("Failed to load Leaflet"));
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    if (!leafletReady || !mapRef.current || leafletMapRef.current) return;
    const L = window.L;

    const map = L.map(mapRef.current, {
      center: [20.5, 79],
      zoom: 5,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      },
    ).addTo(map);

    const attrEl = map
      .getContainer()
      .querySelector(".leaflet-control-attribution");
    if (attrEl) {
      attrEl.style.background = "rgba(0,0,0,0.7)";
      attrEl.style.color = "rgba(0,255,200,0.4)";
      attrEl.style.fontSize = "8px";
    }

    leafletMapRef.current = map;

    return () => {
      map.remove();
      leafletMapRef.current = null;
      markersRef.current.clear();
    };
  }, [leafletReady]);

  // Sync events to markers
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !leafletReady) return;
    const L = window.L;

    for (const event of events) {
      if (markersRef.current.has(event.id)) continue;

      const coords = CITY_COORDS[event.city] ?? { lat: 20.5, lon: 79 };
      const color = SEVERITY_COLORS[event.severity] ?? "#888";
      const isBlocked = blockedIps.some((b) => b.ip === event.attackerIp);

      const marker = L.circleMarker([coords.lat, coords.lon], {
        radius:
          event.severity === "critical"
            ? 10
            : event.severity === "high"
              ? 8
              : 6,
        fillColor: color,
        color: isBlocked ? "#22c55e" : color,
        weight: isBlocked ? 2 : 1.5,
        opacity: 0.9,
        fillOpacity: 0.7,
      });

      marker.bindPopup(
        `<div style="font-family:monospace;background:#0a0f0a;border:1px solid rgba(0,255,200,0.3);padding:12px;border-radius:6px;min-width:200px;">
          <div style="color:${color};font-size:10px;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">${event.severity} \u2014 ${event.attackType}</div>
          <div style="color:#e2e8f0;font-size:12px;font-weight:bold;margin-bottom:4px;">${event.name}</div>
          <div style="color:#94a3b8;font-size:10px;">\uD83D\uDCCD ${event.city}, India</div>
          <div style="color:#94a3b8;font-size:10px;">\uD83D\uDDA5 ${event.attackerIp}</div>
          <div style="color:#64748b;font-size:9px;margin-top:4px;">${formatTime(event.timestamp)}</div>
          ${isBlocked ? '<div style="color:#22c55e;font-size:9px;margin-top:4px;font-weight:bold;">\u2713 IP BLOCKED</div>' : ""}
        </div>`,
        { className: "leaflet-cyber-popup" },
      );

      marker.on("click", () => setSelectedEvent(event));
      marker.addTo(map);
      markersRef.current.set(event.id, marker);
    }
  }, [events, blockedIps, leafletReady]);

  const recentEvents = [...events]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, 8);

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
          Real-world geographic visualization of attack origins — OpenStreetMap
          via CartoDB Dark
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
        {/* Real World Map */}
        <div
          className="xl:col-span-2 bg-card border border-border rounded-lg overflow-hidden relative"
          style={{ height: 480 }}
        >
          <div className="absolute top-2 right-2 z-[1000] flex items-center gap-1.5 bg-black/80 rounded px-2 py-1 pointer-events-none">
            <Radio size={10} className="text-cyber-cyan animate-pulse" />
            <span className="text-[9px] font-mono text-cyber-cyan">
              LIVE TRACKING
            </span>
          </div>

          {/* Leaflet map container */}
          <div ref={mapRef} className="w-full h-full" />

          {!leafletReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <p className="font-mono text-xs text-cyber-cyan animate-pulse">
                LOADING MAP...
              </p>
            </div>
          )}

          {/* Selected event detail overlay */}
          {selectedEvent && (
            <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-black/90 border border-cyber-cyan/40 rounded-lg p-3">
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

      {/* Leaflet popup styles override */}
      <style>{`
        .leaflet-cyber-popup .leaflet-popup-content-wrapper {
          background: transparent;
          border: none;
          box-shadow: none;
          padding: 0;
        }
        .leaflet-cyber-popup .leaflet-popup-content {
          margin: 0;
        }
        .leaflet-cyber-popup .leaflet-popup-tip-container {
          display: none;
        }
        .leaflet-control-zoom a {
          background: rgba(0,0,0,0.8) !important;
          color: rgba(0,255,200,0.8) !important;
          border-color: rgba(0,255,200,0.2) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(0,30,20,0.9) !important;
          color: rgba(0,255,200,1) !important;
        }
      `}</style>
    </div>
  );
}

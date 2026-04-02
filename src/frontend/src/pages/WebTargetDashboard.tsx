import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { User } from "../types";

interface WebTargetDashboardProps {
  user: User;
  onLogout: () => void;
  onAttackTriggered: (websiteName: string) => void;
}

interface TargetWebsite {
  id: string;
  name: string;
  type: string;
  icon: string;
  description: string;
  color: string;
  glowColor: string;
}

const TARGET_WEBSITES: TargetWebsite[] = [
  {
    id: "securebank",
    name: "SecureBank Portal",
    type: "Banking",
    icon: "🏦",
    description:
      "Online banking portal with 200K+ registered customers. Handles wire transfers, account management, and loan applications.",
    color: "text-cyan-400",
    glowColor: "rgba(34,211,238,0.3)",
  },
  {
    id: "shopeasy",
    name: "ShopEasy",
    type: "E-Commerce",
    icon: "🛒",
    description:
      "High-traffic e-commerce marketplace with 500K+ user accounts. Stores payment card data and shipping addresses.",
    color: "text-orange-400",
    glowColor: "rgba(251,146,60,0.3)",
  },
  {
    id: "healthvault",
    name: "HealthVault",
    type: "Healthcare",
    icon: "🏥",
    description:
      "HIPAA-compliant healthcare portal for patient records, lab results, and prescription management.",
    color: "text-green-400",
    glowColor: "rgba(74,222,128,0.3)",
  },
  {
    id: "edulearn",
    name: "EduLearn",
    type: "Education",
    icon: "🎓",
    description:
      "E-learning platform with 150K+ student accounts. Stores academic credentials, grades, and personal data.",
    color: "text-purple-400",
    glowColor: "rgba(196,181,253,0.3)",
  },
];

// Generate 1000 deterministic credential pairs
function generateCredentials() {
  const firstNames = [
    "john",
    "jane",
    "alice",
    "bob",
    "charlie",
    "david",
    "emma",
    "frank",
    "grace",
    "henry",
    "irene",
    "james",
    "kate",
    "liam",
    "mary",
    "nick",
    "olivia",
    "peter",
    "quinn",
    "rachel",
    "sam",
    "tina",
    "uma",
    "victor",
    "wendy",
    "xander",
    "yvonne",
    "zack",
    "aaron",
    "bella",
  ];
  const lastNames = [
    "smith",
    "jones",
    "brown",
    "davis",
    "miller",
    "wilson",
    "moore",
    "taylor",
    "anderson",
    "thomas",
    "jackson",
    "white",
    "harris",
    "martin",
    "garcia",
    "martinez",
    "robinson",
    "clark",
    "rodriguez",
    "lewis",
  ];
  const passwords = [
    "Pass@1234",
    "Secure#99",
    "Admin!2024",
    "Login@456",
    "MyPass#01",
    "Test@5678",
    "Root!Pass",
    "User@2025",
    "Qwerty#12",
    "Secret@88",
    "Welcome!1",
    "Passw0rd!",
    "Cyber@2024",
    "P@ssword1",
    "Str0ng#Pass",
    "L0gin@789",
    "Access#01",
    "Key@2023!",
    "Auth@Pass1",
    "Guard@123",
  ];

  return Array.from({ length: 1000 }, (_, i) => {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
    const pw = passwords[i % passwords.length];
    const num = i + 1;
    return {
      id: num,
      username:
        i % 3 === 0
          ? `${fn}_${ln}_${num}`
          : i % 3 === 1
            ? `${fn}${num}`
            : `user_${num.toString().padStart(4, "0")}`,
      password: pw,
      status: "PENDING" as "PENDING" | "FAIL" | "SUCCESS",
    };
  });
}

const ALL_CREDENTIALS = generateCredentials();

type AttackPhase = "idle" | "running" | "complete";

interface CredentialEntry {
  id: number;
  username: string;
  password: string;
  status: "PENDING" | "FAIL" | "SUCCESS";
}

export default function WebTargetDashboard({
  user,
  onLogout,
  onAttackTriggered,
}: WebTargetDashboardProps) {
  const [activeTab, setActiveTab] = useState(TARGET_WEBSITES[0].id);
  const [attackPhases, setAttackPhases] = useState<Record<string, AttackPhase>>(
    Object.fromEntries(TARGET_WEBSITES.map((s) => [s.id, "idle"])),
  );
  const [progress, setProgress] = useState<Record<string, number>>(
    Object.fromEntries(TARGET_WEBSITES.map((s) => [s.id, 0])),
  );
  const [credentials, setCredentials] = useState<
    Record<string, CredentialEntry[]>
  >(
    Object.fromEntries(
      TARGET_WEBSITES.map((s) => [
        s.id,
        ALL_CREDENTIALS.map((c) => ({ ...c })),
      ]),
    ),
  );
  const [visibleRange, setVisibleRange] = useState<Record<string, number>>(
    Object.fromEntries(TARGET_WEBSITES.map((s) => [s.id, 0])),
  );

  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeWebsite = TARGET_WEBSITES.find((w) => w.id === activeTab)!;
  const phase = attackPhases[activeTab];
  const prog = progress[activeTab];
  const creds = credentials[activeTab];
  const visible = visibleRange[activeTab];

  // Success indices — deterministic: indices 150, 490, 820
  const SUCCESS_INDICES = [150, 490, 820];

  const launchAttack = () => {
    if (phase !== "idle") return;

    // Reset credentials for this tab
    setCredentials((prev) => ({
      ...prev,
      [activeTab]: ALL_CREDENTIALS.map((c) => ({ ...c })),
    }));
    setProgress((prev) => ({ ...prev, [activeTab]: 0 }));
    setVisibleRange((prev) => ({ ...prev, [activeTab]: 0 }));
    setAttackPhases((prev) => ({ ...prev, [activeTab]: "running" }));
  };

  // Attack simulation effect
  useEffect(() => {
    if (phase !== "running") return;

    let tick = 0;
    const totalTicks = 60; // ~3 seconds at 50ms
    const credsPerTick = Math.ceil(1000 / totalTicks);

    animRef.current = setInterval(() => {
      tick++;
      const processed = Math.min(tick * credsPerTick, 1000);

      setCredentials((prev) => {
        const updated = prev[activeTab].map((c, i) => {
          if (i >= processed) return c;
          const isSuccess = SUCCESS_INDICES.includes(i);
          return {
            ...c,
            status: (isSuccess ? "SUCCESS" : "FAIL") as
              | "SUCCESS"
              | "FAIL"
              | "PENDING",
          };
        });
        return { ...prev, [activeTab]: updated };
      });

      setVisibleRange((prev) => ({ ...prev, [activeTab]: processed }));
      setProgress((prev) => ({
        ...prev,
        [activeTab]: Math.round((processed / 1000) * 100),
      }));

      if (processed >= 1000) {
        clearInterval(animRef.current!);
        setAttackPhases((prev) => ({ ...prev, [activeTab]: "complete" }));
        onAttackTriggered(activeWebsite.name);
      }
    }, 50);

    return () => {
      if (animRef.current) clearInterval(animRef.current);
    };
  }, [phase, activeTab, activeWebsite.name, onAttackTriggered]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animRef.current) clearInterval(animRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  const resetAttack = () => {
    setAttackPhases((prev) => ({ ...prev, [activeTab]: "idle" }));
    setProgress((prev) => ({ ...prev, [activeTab]: 0 }));
    setVisibleRange((prev) => ({ ...prev, [activeTab]: 0 }));
    setCredentials((prev) => ({
      ...prev,
      [activeTab]: ALL_CREDENTIALS.map((c) => ({ ...c })),
    }));
  };

  // Visible credentials window (show 30 entries around current processing point)
  const displayStart = Math.max(0, visible - 20);
  const displayCreds = creds.slice(displayStart, displayStart + 30);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "#050a0f",
        backgroundImage:
          "radial-gradient(ellipse at 20% 20%, rgba(34,211,238,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(251,146,60,0.03) 0%, transparent 60%)",
      }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "rgba(34,211,238,0.15)" }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              background: "rgba(34,211,238,0.1)",
              border: "1px solid rgba(34,211,238,0.3)",
            }}
          >
            <span className="text-lg">🎯</span>
          </div>
          <div>
            <h1
              className="font-mono font-bold text-lg tracking-widest"
              style={{
                color: "#22d3ee",
                textShadow: "0 0 15px rgba(34,211,238,0.5)",
              }}
            >
              WEB TARGET TESTER
            </h1>
            <p
              className="font-mono text-xs tracking-wider"
              style={{ color: "rgba(34,211,238,0.5)" }}
            >
              Credential Stuffing Simulation Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p
              className="font-mono text-xs"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              LOGGED IN AS
            </p>
            <p
              className="font-mono text-xs font-bold"
              style={{ color: "rgba(34,211,238,0.8)" }}
            >
              {user.name}
            </p>
          </div>
          <button
            type="button"
            data-ocid="webtarget.logout.button"
            onClick={onLogout}
            className="px-4 py-2 rounded font-mono text-xs font-bold tracking-widest uppercase transition-colors"
            style={{
              border: "1px solid rgba(239,68,68,0.4)",
              color: "#f87171",
              background: "rgba(239,68,68,0.05)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(239,68,68,0.15)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(239,68,68,0.05)";
            }}
          >
            LOGOUT
          </button>
        </div>
      </header>

      {/* Tab nav */}
      <div
        className="flex items-center gap-0 px-6 border-b"
        style={{ borderColor: "rgba(34,211,238,0.1)" }}
      >
        {TARGET_WEBSITES.map((site) => {
          const isActive = activeTab === site.id;
          const sitePhase = attackPhases[site.id];
          return (
            <button
              key={site.id}
              type="button"
              data-ocid={`webtarget.${site.id}.tab`}
              onClick={() => setActiveTab(site.id)}
              className="flex items-center gap-2 px-5 py-3 font-mono text-xs font-bold tracking-widest uppercase transition-all relative"
              style={{
                color: isActive
                  ? site.color.replace("text-", "") === "cyan-400"
                    ? "#22d3ee"
                    : site.color.replace("text-", "") === "orange-400"
                      ? "#fb923c"
                      : site.color.replace("text-", "") === "green-400"
                        ? "#4ade80"
                        : "#c4b5fd"
                  : "rgba(255,255,255,0.4)",
                borderBottom: isActive
                  ? "2px solid currentColor"
                  : "2px solid transparent",
              }}
            >
              <span>{site.icon}</span>
              <span>{site.name}</span>
              {sitePhase === "running" && (
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: "#ef4444" }}
                />
              )}
              {sitePhase === "complete" && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: "#4ade80" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Main content */}
      <main className="flex-1 p-6 flex gap-6">
        {/* Left column: site info + attack controls */}
        <div className="w-72 flex flex-col gap-4 shrink-0">
          {/* Site info card */}
          <div
            className="rounded-lg p-5"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${activeWebsite.glowColor}`,
              boxShadow: `0 0 20px ${activeWebsite.glowColor}`,
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{activeWebsite.icon}</span>
              <div>
                <h2
                  className="font-mono font-bold text-sm tracking-wide"
                  style={{
                    color:
                      activeWebsite.id === "securebank"
                        ? "#22d3ee"
                        : activeWebsite.id === "shopeasy"
                          ? "#fb923c"
                          : activeWebsite.id === "healthvault"
                            ? "#4ade80"
                            : "#c4b5fd",
                  }}
                >
                  {activeWebsite.name}
                </h2>
                <p
                  className="font-mono text-xs"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  {activeWebsite.type}
                </p>
              </div>
            </div>
            <p
              className="font-mono text-xs leading-relaxed"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              {activeWebsite.description}
            </p>
          </div>

          {/* Attack stats */}
          <div
            className="rounded-lg p-4"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <p
              className="font-mono text-[10px] uppercase tracking-widest mb-3"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              TARGET STATISTICS
            </p>
            {[
              { label: "Total Credentials", value: "1,000" },
              { label: "Attack Vector", value: "Credential Stuffing" },
              { label: "Protocol", value: "HTTP/HTTPS POST" },
              { label: "Rate Limit Bypass", value: "Rotating Proxies" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex justify-between items-center py-1.5 border-b"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}
              >
                <span
                  className="font-mono text-xs"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  {stat.label}
                </span>
                <span
                  className="font-mono text-xs font-bold"
                  style={{ color: "rgba(34,211,238,0.8)" }}
                >
                  {stat.value}
                </span>
              </div>
            ))}
          </div>

          {/* Attack button */}
          <div className="flex flex-col gap-3">
            {phase === "idle" && (
              <motion.button
                type="button"
                data-ocid={`webtarget.${activeTab}.launch.button`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={launchAttack}
                className="w-full py-4 rounded-lg font-mono font-bold text-sm tracking-widest uppercase"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(251,146,60,0.2))",
                  border: "1px solid rgba(239,68,68,0.5)",
                  color: "#f87171",
                  boxShadow:
                    "0 0 20px rgba(239,68,68,0.2), inset 0 0 20px rgba(239,68,68,0.05)",
                }}
              >
                ⚡ LAUNCH CREDENTIAL STUFFING ATTACK
              </motion.button>
            )}

            {phase === "running" && (
              <div
                className="w-full py-4 rounded-lg font-mono font-bold text-sm tracking-widest uppercase text-center animate-pulse"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.4)",
                  color: "#f87171",
                }}
              >
                ⚡ ATTACK IN PROGRESS...
              </div>
            )}

            {phase === "complete" && (
              <>
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg p-4"
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.3)",
                    }}
                  >
                    <p
                      className="font-mono text-xs font-bold tracking-widest mb-2"
                      style={{
                        color: "#f87171",
                        textShadow: "0 0 10px rgba(239,68,68,0.5)",
                      }}
                    >
                      ✓ ATTACK COMPLETE
                    </p>
                    <p
                      className="font-mono text-xs mb-1"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      Target: {activeWebsite.name}
                    </p>
                    <p
                      className="font-mono text-xs"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      997 Failed &nbsp;|&nbsp;{" "}
                      <span style={{ color: "#4ade80" }}>3 Breached</span>
                      &nbsp;| Attack logged to admin console
                    </p>
                  </motion.div>
                </AnimatePresence>
                <button
                  type="button"
                  data-ocid={`webtarget.${activeTab}.reset.button`}
                  onClick={resetAttack}
                  className="w-full py-2.5 rounded font-mono text-xs tracking-widest uppercase transition-colors"
                  style={{
                    border: "1px solid rgba(34,211,238,0.3)",
                    color: "rgba(34,211,238,0.7)",
                    background: "transparent",
                  }}
                >
                  RESET SIMULATION
                </button>
              </>
            )}

            {/* Progress bar */}
            {phase === "running" && (
              <div>
                <div className="flex justify-between mb-1">
                  <span
                    className="font-mono text-[10px] uppercase tracking-widest"
                    style={{ color: "rgba(239,68,68,0.7)" }}
                  >
                    Progress
                  </span>
                  <span
                    className="font-mono text-[10px] font-bold"
                    style={{ color: "#f87171" }}
                  >
                    {prog}%
                  </span>
                </div>
                <Progress
                  value={prog}
                  className="h-2"
                  style={{
                    background: "rgba(239,68,68,0.1)",
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right column: credential table */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <p
                className="font-mono text-[10px] uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                CREDENTIAL DATABASE — {activeWebsite.name.toUpperCase()}
              </p>
              {phase === "running" && (
                <span
                  className="px-2 py-0.5 rounded font-mono text-[10px] font-bold tracking-widest animate-pulse"
                  style={{
                    background: "rgba(239,68,68,0.15)",
                    border: "1px solid rgba(239,68,68,0.4)",
                    color: "#f87171",
                  }}
                >
                  ⚡ ATTACK IN PROGRESS
                </span>
              )}
            </div>
            <p
              className="font-mono text-[10px]"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              {phase === "running"
                ? `Processing: ${visible} / 1000`
                : phase === "complete"
                  ? "1000 / 1000 processed"
                  : "1000 entries loaded"}
            </p>
          </div>

          <div
            className="flex-1 rounded-lg overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.01)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Table header */}
            <div
              className="grid grid-cols-12 px-4 py-2 border-b"
              style={{
                borderColor: "rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              {["#", "USERNAME", "PASSWORD", "STATUS"].map((h, i) => (
                <div
                  key={h}
                  className={`font-mono text-[10px] uppercase tracking-widest ${
                    i === 0
                      ? "col-span-1"
                      : i === 1
                        ? "col-span-4"
                        : i === 2
                          ? "col-span-4"
                          : "col-span-3"
                  }`}
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  {h}
                </div>
              ))}
            </div>

            {/* Scrollable rows */}
            <ScrollArea className="h-[calc(100vh-22rem)]">
              <div className="px-4 py-1">
                {(phase === "idle" || phase === "complete"
                  ? creds.slice(0, 50)
                  : displayCreds
                ).map((cred) => (
                  <div
                    key={cred.id}
                    data-ocid={`webtarget.credential.item.${cred.id}`}
                    className="grid grid-cols-12 py-1 border-b transition-colors"
                    style={{
                      borderColor: "rgba(255,255,255,0.03)",
                      background:
                        cred.status === "SUCCESS"
                          ? "rgba(74,222,128,0.05)"
                          : cred.status === "FAIL"
                            ? "transparent"
                            : "transparent",
                    }}
                  >
                    <div
                      className="col-span-1 font-mono text-xs"
                      style={{ color: "rgba(255,255,255,0.25)" }}
                    >
                      {cred.id}
                    </div>
                    <div
                      className="col-span-4 font-mono text-xs truncate"
                      style={{ color: "rgba(255,255,255,0.6)" }}
                    >
                      {cred.username}
                    </div>
                    <div
                      className="col-span-4 font-mono text-xs"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                    >
                      {cred.password}
                    </div>
                    <div className="col-span-3">
                      <span
                        className="font-mono text-[10px] font-bold tracking-widest"
                        style={{
                          color:
                            cred.status === "SUCCESS"
                              ? "#4ade80"
                              : cred.status === "FAIL"
                                ? "rgba(239,68,68,0.6)"
                                : "rgba(255,255,255,0.3)",
                          textShadow:
                            cred.status === "SUCCESS"
                              ? "0 0 8px rgba(74,222,128,0.5)"
                              : "none",
                        }}
                      >
                        {cred.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="text-center py-3 border-t"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}
      >
        <p
          className="font-mono text-[10px]"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "rgba(34,211,238,0.5)" }}
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}

import { Toaster } from "@/components/ui/sonner";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import AdminAnalystResolvedNotification from "./components/AdminAnalystResolvedNotification";
import AnalystDefendedNotification from "./components/AnalystDefendedNotification";
import AttackAlertPopup from "./components/AttackAlertPopup";
import Sidebar from "./components/Sidebar";
import {
  INITIAL_ACTIVITY,
  INITIAL_ALERTS,
  INITIAL_HONEYPOT_LOGS,
  INITIAL_PREVENTION_TASKS,
  generateAutoAttack,
  generateInitialThreatTrend,
  getScenarioMeta,
} from "./data";
import APISecurityPage from "./pages/APISecurityPage";
import ActivityPage from "./pages/ActivityPage";
import AttackChainPage from "./pages/AttackChainPage";
import AttackPage from "./pages/AttackPage";
import AttackTimelinePage from "./pages/AttackTimelinePage";
import CompliancePage from "./pages/CompliancePage";
import DashboardPage from "./pages/DashboardPage";
import DetectPage from "./pages/DetectPage";
import LiveAttackMapPage from "./pages/LiveAttackMapPage";
import LoginPage from "./pages/LoginPage";
import PreventPage from "./pages/PreventPage";
import RedBluePage from "./pages/RedBluePage";
import ReportsPage from "./pages/ReportsPage";
import SIEMPage from "./pages/SIEMPage";
import ScanPage from "./pages/ScanPage";
import SecurityLogoPage from "./pages/SecurityLogoPage";
import SqliGuardLogoPage from "./pages/SqliGuardLogoPage";
import ThreatIntelPage from "./pages/ThreatIntelPage";
import UsersPage from "./pages/UsersPage";
import WafPage from "./pages/WafPage";
import WebTargetDashboard from "./pages/WebTargetDashboard";
import ZeroTrustPage from "./pages/ZeroTrustPage";
import { INITIAL_THREAT_INTEL } from "./threatIntelData";
import type {
  ActivityEntry,
  Alert,
  AlertStatus,
  AttackEvent,
  AutoResponse,
  BlockedIp,
  HoneypotLog,
  IpStats,
  Page,
  PreventionTask,
  RetrainingCase,
  ScannerEvent,
  SiemEvent,
  SlaMetric,
  ThreatIntelEntry,
  ThreatPoint,
  User,
} from "./types";

export default function App() {
  const [page, setPage] = useState<Page>("login");
  const [user, setUser] = useState<User | null>(null);
  const [showSqliLogo, setShowSqliLogo] = useState(false);
  const [showSecurityLogo, setShowSecurityLogo] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [tasks, setTasks] = useState<PreventionTask[]>(
    INITIAL_PREVENTION_TASKS,
  );
  const [activity, setActivity] = useState<ActivityEntry[]>(INITIAL_ACTIVITY);
  const [threatTrend, setThreatTrend] = useState<ThreatPoint[]>(
    generateInitialThreatTrend,
  );
  const [attackPopup, setAttackPopup] = useState<{
    name: string;
    severity: string;
    signal: string;
    city?: string;
    attackerIp?: string;
    websiteName?: string;
  } | null>(null);
  const [analystNotification, setAnalystNotification] = useState<{
    name: string;
  } | null>(null);
  const [adminCrossRoleNotification, setAdminCrossRoleNotification] = useState<{
    name: string;
  } | null>(null);
  const [scannerEvents, setScannerEvents] = useState<ScannerEvent[]>([]);
  const [attackMode, setAttackMode] = useState<"auto" | "manual">("auto");
  const [attackEvents, setAttackEvents] = useState<AttackEvent[]>([]);
  const [blockedIps, setBlockedIps] = useState<BlockedIp[]>([]);

  // ── Existing AI/ML state ──
  const [retrainingQueue, setRetrainingQueue] = useState<RetrainingCase[]>([]);
  const [honeypotLogs, setHoneypotLogs] = useState<HoneypotLog[]>(
    INITIAL_HONEYPOT_LOGS,
  );
  const [ipAttackCounts, setIpAttackCounts] = useState<Record<string, IpStats>>(
    {},
  );
  const [modelVersion, setModelVersion] = useState("v1.0.0");
  const [isRetraining, setIsRetraining] = useState(false);

  // ── New SOC state ──
  const [siemEvents, setSiemEvents] = useState<SiemEvent[]>([]);
  const [threatIntelDb] = useState<ThreatIntelEntry[]>(INITIAL_THREAT_INTEL);
  const [autoResponses, setAutoResponses] = useState<AutoResponse[]>([]);
  const [slaMetrics, setSlaMetrics] = useState<SlaMetric[]>([]);
  const [redBlueMode, setRedBlueMode] = useState<"red" | "blue">("blue");
  const [redBlueScore, setRedBlueScore] = useState({ attacks: 0, defenses: 0 });

  const incrementIpCount = useCallback((ip: string) => {
    setIpAttackCounts((prev) => {
      const existing = prev[ip];
      const now = new Date().toISOString();
      const count = (existing?.count ?? 0) + 1;
      const riskScore = Math.min(
        100,
        count * 8 + (count >= 10 ? 20 : count >= 3 ? 10 : 0),
      );
      return {
        ...prev,
        [ip]: {
          count,
          firstSeen: existing?.firstSeen ?? now,
          lastSeen: now,
          riskScore,
        },
      };
    });
  }, []);

  const addAttackEvent = useCallback(
    (event: Omit<AttackEvent, "id" | "timestamp">) => {
      if (event.attackerIp) {
        incrementIpCount(event.attackerIp);
      }
      setAttackEvents((prev) => [
        ...prev,
        {
          ...event,
          id: `ae-${Date.now()}-${Math.random()}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    },
    [incrementIpCount],
  );

  const addActivity = useCallback((action: string, actor: string) => {
    setActivity((prev) => [
      ...prev,
      {
        id: `act${Date.now()}`,
        action,
        actor,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  const handleBlockIp = useCallback(
    (ip: string, reason: string, blockedBy: string) => {
      setBlockedIps((prev) => {
        if (prev.some((b) => b.ip === ip)) return prev;
        return [
          ...prev,
          {
            id: `blk-${Date.now()}`,
            ip,
            reason,
            blockedAt: new Date().toISOString(),
            blockedBy,
          },
        ];
      });
      addActivity(`IP BLOCKED: ${ip} — ${reason}`, blockedBy);
      toast.success(`IP ${ip} blocked successfully`, { duration: 3000 });
    },
    [addActivity],
  );

  const handleUnblockIp = useCallback(
    (id: string) => {
      setBlockedIps((prev) => {
        const entry = prev.find((b) => b.id === id);
        if (entry)
          addActivity(`IP UNBLOCKED: ${entry.ip}`, user?.email ?? "admin");
        return prev.filter((b) => b.id !== id);
      });
    },
    [addActivity, user],
  );

  // ── Mark False Positive / False Negative ──
  const handleMarkFalseLabel = useCallback(
    (alertId: string, label: "FP" | "FN") => {
      const alert = alerts.find((a) => a.id === alertId);
      if (!alert) return;
      const newCase: RetrainingCase = {
        id: `rt-${Date.now()}`,
        alertId,
        payload: alert.signal,
        label,
        timestamp: new Date(),
        attackType: alert.attackType ?? alert.scenarioName,
      };
      setRetrainingQueue((prev) => [...prev, newCase]);
      addActivity(
        `Alert ${alertId} marked as ${label === "FP" ? "FALSE POSITIVE" : "FALSE NEGATIVE"} for retraining`,
        user?.email ?? "system",
      );
      toast.success(`Marked as ${label} — added to retraining queue`, {
        duration: 3000,
      });
    },
    [alerts, user, addActivity],
  );

  // ── Retrain Model ──
  const handleRetrainModel = useCallback(() => {
    if (isRetraining) return;
    setIsRetraining(true);
    setTimeout(() => {
      setModelVersion((prev) => {
        const parts = prev.replace("v", "").split(".").map(Number);
        parts[2] = (parts[2] ?? 0) + 1;
        return `v${parts.join(".")}`;
      });
      setRetrainingQueue([]);
      setIsRetraining(false);
      addActivity(
        "AI model retrained with queued cases",
        user?.email ?? "system",
      );
      toast.success("Model retrained successfully!", { duration: 3000 });
    }, 3000);
  }, [isRetraining, user, addActivity]);

  // ── Deploy Honeypot ──
  const handleDeployHoneypot = useCallback(() => {
    const endpoints = ["/api/v1/login", "/api/v1/data", "/api/v1/admin"];
    const payloads = [
      "' UNION SELECT * FROM users--",
      "<img src=x onerror=alert(1)>",
      "../../../etc/shadow",
      "admin'; DROP TABLE users;--",
      "1 OR 1=1--",
    ];
    const ips = [
      `${Math.floor(Math.random() * 100 + 100)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    ];
    const newLog: HoneypotLog = {
      id: `h-${Date.now()}`,
      ip: ips[0],
      payload: payloads[Math.floor(Math.random() * payloads.length)],
      endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
      timestamp: new Date(),
      autoFlagged: Math.random() > 0.3,
    };
    setHoneypotLogs((prev) => [newLog, ...prev]);
    incrementIpCount(newLog.ip);
    addActivity(
      `Honeypot triggered by ${newLog.ip} on ${newLog.endpoint}`,
      "HONEYPOT",
    );
    toast.success(`Honeypot triggered: ${newLog.ip}`, { duration: 3000 });
  }, [incrementIpCount, addActivity]);

  // ── Forward to SIEM ──
  const handleForwardToSiem = useCallback(
    (alert: Alert) => {
      const ev: SiemEvent = {
        id: `siem-${Date.now()}`,
        alertId: alert.id,
        eventId: `EVT-${Math.floor(Math.random() * 90000 + 10000)}`,
        severity: alert.severity,
        status: "ingested",
        attackType: alert.attackType ?? alert.scenarioName,
        sourceIp: alert.hackerIp ?? "unknown",
        correlatedCount: Math.floor(Math.random() * 5 + 1),
        timestamp: new Date().toISOString(),
        pipeline: ["alert", "ingestion", "correlation", "incident"],
        currentStep: 0,
      };
      setSiemEvents((prev) => [ev, ...prev]);
      // advance pipeline automatically
      setTimeout(
        () =>
          setSiemEvents((prev) =>
            prev.map((e) =>
              e.id === ev.id
                ? { ...e, status: "correlated", currentStep: 2 }
                : e,
            ),
          ),
        2000,
      );
      setTimeout(
        () =>
          setSiemEvents((prev) =>
            prev.map((e) =>
              e.id === ev.id ? { ...e, status: "incident", currentStep: 3 } : e,
            ),
          ),
        4000,
      );
      addActivity(
        `Alert ${alert.id} forwarded to SIEM`,
        user?.email ?? "system",
      );
      toast.success(`Forwarded to SIEM: ${ev.eventId}`, { duration: 3000 });
    },
    [addActivity, user],
  );

  const handleLogin = useCallback(
    (email: string, password: string): boolean => {
      const normalEmail =
        email === "admin"
          ? "admin@combodefense.local"
          : email === "analyst"
            ? "analyst@combodefense.local"
            : email === "coadmin"
              ? "coadmin@combodefense.local"
              : email === "webuser"
                ? "webuser@combodefense.local"
                : email;

      if (
        normalEmail === "admin@combodefense.local" &&
        password === "admin123"
      ) {
        const u: User = {
          name: "Security Admin",
          email: normalEmail,
          role: "admin",
        };
        setUser(u);
        setShowSqliLogo(true);
        setScanning(false);
        addActivity("User logged in", normalEmail);
        return true;
      }
      if (
        normalEmail === "coadmin@combodefense.local" &&
        password === "coadmin123"
      ) {
        const u: User = {
          name: "Co-Admin Officer",
          email: normalEmail,
          role: "admin",
          displayRole: "CO-ADMIN",
        };
        setUser(u);
        setShowSqliLogo(true);
        setScanning(false);
        addActivity("User logged in", normalEmail);
        return true;
      }
      if (
        normalEmail === "analyst@combodefense.local" &&
        password === "analyst123"
      ) {
        const u: User = {
          name: "Security Analyst",
          email: normalEmail,
          role: "analyst",
        };
        setUser(u);
        setShowSqliLogo(true);
        setScanning(false);
        addActivity("User logged in", normalEmail);
        return true;
      }
      if (
        normalEmail === "webuser@combodefense.local" &&
        password === "webuser123"
      ) {
        const u: User = {
          name: "Web Target Tester",
          email: normalEmail,
          role: "webuser",
        };
        setUser(u);
        setShowSqliLogo(false);
        setScanning(false);
        setPage("web-targets");
        addActivity("Web Target User logged in", normalEmail);
        return true;
      }
      return false;
    },
    [addActivity],
  );

  const handleSqliLogoComplete = useCallback(() => {
    setShowSqliLogo(false);
    setShowSecurityLogo(true);
  }, []);

  const handleSecurityLogoComplete = useCallback(() => {
    setShowSecurityLogo(false);
    setScanning(true);
  }, []);

  const handleScanComplete = useCallback(() => {
    setScanning(false);
    setPage("dashboard");
  }, []);

  const handleLogout = useCallback(() => {
    if (user) addActivity("User signed out", user.email);
    setUser(null);
    setPage("login");
  }, [user, addActivity]);

  const handleWebAttackTriggered = useCallback(
    (websiteName: string) => {
      const attackerIp = `103.21.58.${Math.floor(Math.random() * 254 + 1)}`;
      setAttackPopup({
        name: `CREDENTIAL STUFFING — ${websiteName}`,
        severity: "critical",
        signal: `Mass credential stuffing attack detected on ${websiteName}. 3 accounts breached.`,
        city: "Mumbai",
        attackerIp,
        websiteName,
      });
      addAttackEvent({
        name: `Credential Stuffing — ${websiteName}`,
        severity: "critical",
        city: "Mumbai",
        attackerIp,
        attackType: "Credential Stuffing",
        source: "manual",
        websiteName,
        lat: 19.076,
        lon: 72.877,
        country: "India",
      });
      addActivity(
        `Web attack: Credential stuffing on ${websiteName}`,
        "webuser@combodefense.local",
      );
    },
    [addAttackEvent, addActivity],
  );

  const handleRunReplay = useCallback(
    (scenarioName: string, scenarioId: string) => {
      const meta = getScenarioMeta(scenarioName);
      const newAlert: Alert = {
        id: `alert-${Date.now()}`,
        scenarioName,
        severity: scenarioId === "sqli" ? "critical" : "high",
        status: "open",
        signal: "Input sanitizer bypass attempt detected",
        timestamp: new Date().toISOString(),
        hackerIp: meta.hackerIp,
        attackType: meta.attackType,
        reattackLoop: meta.reattackLoop,
      };
      setAlerts((prev) => [newAlert, ...prev]);
      setThreatTrend((prev) => {
        const now = new Date();
        return [
          ...prev.slice(1),
          {
            time: now.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            level: Math.min(100, (prev[prev.length - 1]?.level ?? 50) + 25),
          },
        ];
      });
      addActivity(`Replay executed: ${scenarioName}`, user?.email ?? "system");
      setScannerEvents((prev) => [
        ...prev,
        {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          message: `FLAGGED: ${scenarioName} replay triggered`,
          status: "FLAGGED",
        },
      ]);
      addAttackEvent({
        name: scenarioName,
        severity: scenarioId === "sqli" ? "critical" : "high",
        city: meta.hackerIp ? "Mumbai" : "Delhi",
        attackerIp: meta.hackerIp ?? "192.168.1.1",
        attackType: meta.attackType ?? scenarioName,
        source: "replay",
        lat: 20.5937,
        lon: 78.9629,
        country: "India",
      });
      if (user?.role === "admin") {
        setAttackPopup({
          name: scenarioName,
          severity: scenarioId === "sqli" ? "critical" : "high",
          signal: meta.attackType,
          city: meta.hackerIp ? "Mumbai" : "Delhi",
          attackerIp: meta.hackerIp,
        });
      }
      toast.error(`Attack replay: ${scenarioName}`, { duration: 3000 });

      // ── Auto-response ──
      const responseActions: Record<string, string> = {
        "SQL Injection": "Block IP",
        SQLi: "Block IP",
        "Brute Force": "Rate Limit",
        XSS: "Sanitize Input",
        "Cross-Site Scripting": "Sanitize Input",
        CSRF: "Invalidate Token",
        "Command Injection": "Block IP",
      };
      const actionEntry = Object.entries(responseActions).find(([k]) =>
        scenarioName.toLowerCase().includes(k.toLowerCase()),
      );
      if (actionEntry) {
        const ar: AutoResponse = {
          id: `ar-${Date.now()}`,
          timestamp: new Date().toISOString(),
          attackType: scenarioName,
          trigger: `${scenarioName} detected`,
          action: actionEntry[1],
          status: "triggered",
        };
        setAutoResponses((prev) => [ar, ...prev.slice(0, 19)]);
        setTimeout(
          () =>
            setAutoResponses((prev) =>
              prev.map((r) =>
                r.id === ar.id ? { ...r, status: "executed" } : r,
              ),
            ),
          1500,
        );
      }

      // ── SLA metric ──
      const sla: SlaMetric = {
        id: `sla-${Date.now()}`,
        attackId: `ae-${Date.now()}`,
        attackType: scenarioName,
        detectionTime: Math.floor(Math.random() * 800 + 200),
        responseTime: Math.floor(Math.random() * 2000 + 500),
        timestamp: new Date().toISOString(),
      };
      setSlaMetrics((prev) => [sla, ...prev.slice(0, 49)]);

      // ── Red/Blue score ──
      if (redBlueMode === "red") {
        setRedBlueScore((prev) => ({ ...prev, attacks: prev.attacks + 1 }));
      } else {
        setRedBlueScore((prev) => ({ ...prev, defenses: prev.defenses + 1 }));
      }
    },
    [user, addActivity, addAttackEvent, redBlueMode],
  );

  const handleUpdateAlertStatus = useCallback(
    (alertId: string, status: AlertStatus) => {
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status } : a)),
      );
      addActivity(
        `Alert ${alertId} status updated to ${status.toUpperCase()}`,
        user?.email ?? "system",
      );
      if (status === "resolved") {
        const alert = alerts.find((a) => a.id === alertId);
        if (alert) {
          if (user?.role === "analyst") {
            setAnalystNotification({ name: alert.scenarioName });
          } else if (user?.role === "admin") {
            setAdminCrossRoleNotification({ name: alert.scenarioName });
          }
        }
      }
    },
    [user, alerts, addActivity],
  );

  const handleToggleTask = useCallback(
    (taskId: string) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, completed: !t.completed } : t,
        ),
      );
      addActivity(
        `Prevention task toggled: ${taskId}`,
        user?.email ?? "system",
      );
    },
    [user, addActivity],
  );

  const handleTriggerManualAttack = useCallback(() => {
    const autoAttack = generateAutoAttack();
    setAttackPopup(autoAttack);
    addActivity(
      `Manual alert: ${autoAttack.name} from ${autoAttack.city}, ${autoAttack.country} (${autoAttack.attackerIp})`,
      "SYSTEM",
    );
    addAttackEvent({
      name: autoAttack.name,
      severity: autoAttack.severity,
      city: autoAttack.city,
      attackerIp: autoAttack.attackerIp,
      attackType: autoAttack.name,
      source: "manual",
      lat: autoAttack.lat,
      lon: autoAttack.lon,
      country: autoAttack.country,
    });
  }, [addActivity, addAttackEvent]);

  // ── Auto-attack timer (every 90 seconds) ── only fires in auto mode
  useEffect(() => {
    if (!user || page === "login" || attackMode !== "auto") return;
    // Don't fire auto-attacks for webuser
    if (user.role === "webuser") return;
    const interval = setInterval(() => {
      const autoAttack = generateAutoAttack();
      setAttackPopup(autoAttack);
      addActivity(
        `Auto-alert: ${autoAttack.name} from ${autoAttack.city}, ${autoAttack.country} (${autoAttack.attackerIp})`,
        "SYSTEM",
      );
      addAttackEvent({
        name: autoAttack.name,
        severity: autoAttack.severity,
        city: autoAttack.city,
        attackerIp: autoAttack.attackerIp,
        attackType: autoAttack.name,
        source: "auto",
        lat: autoAttack.lat,
        lon: autoAttack.lon,
        country: autoAttack.country,
      });
    }, 90000);
    return () => clearInterval(interval);
  }, [user, page, addActivity, addAttackEvent, attackMode]);

  const threatLevel = Math.min(
    100,
    alerts.filter(
      (a) =>
        ["open", "investigating"].includes(a.status) &&
        a.severity === "critical",
    ).length *
      25 +
      alerts.filter(
        (a) =>
          ["open", "investigating"].includes(a.status) && a.severity === "high",
      ).length *
        10 +
      alerts.filter(
        (a) =>
          ["open", "investigating"].includes(a.status) &&
          a.severity === "medium",
      ).length *
        5,
  );

  const preventionCoverage = Math.round(
    (tasks.filter((t) => t.completed).length / tasks.length) * 100,
  );

  const openAlerts = alerts.filter((a) => a.status === "open").length;
  const blockedAttempts = alerts.filter((a) => a.status === "resolved").length;
  const simulatedAttacks = alerts.length;

  if (showSqliLogo) {
    return (
      <>
        <SqliGuardLogoPage onComplete={handleSqliLogoComplete} />
        <Toaster theme="dark" />
      </>
    );
  }

  if (showSecurityLogo) {
    return (
      <>
        <SecurityLogoPage onComplete={handleSecurityLogoComplete} />
        <Toaster theme="dark" />
      </>
    );
  }

  if (scanning) {
    return (
      <>
        <ScanPage onScanComplete={handleScanComplete} />
        <Toaster theme="dark" />
      </>
    );
  }

  if (!user || page === "login") {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        <Toaster theme="dark" />
      </>
    );
  }

  // WebUser gets completely separate dashboard
  if (user.role === "webuser") {
    return (
      <>
        <WebTargetDashboard
          user={user}
          onLogout={handleLogout}
          onAttackTriggered={handleWebAttackTriggered}
        />
        <Toaster theme="dark" />
        <AttackAlertPopup
          attack={attackPopup}
          onDismiss={() => setAttackPopup(null)}
          blockedIps={blockedIps}
          onBlockIp={handleBlockIp}
          currentUserEmail={user.email}
        />
      </>
    );
  }

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return (
          <DashboardPage
            threatLevel={threatLevel}
            openAlerts={openAlerts}
            blockedAttempts={blockedAttempts}
            simulatedAttacks={simulatedAttacks}
            threatTrend={threatTrend}
            preventionCoverage={preventionCoverage}
            scannerEvents={scannerEvents}
            attackEvents={attackEvents}
            retrainingQueue={retrainingQueue}
            onRetrainModel={handleRetrainModel}
            modelVersion={modelVersion}
            ipAttackCounts={ipAttackCounts}
            isRetraining={isRetraining}
            autoResponses={autoResponses}
            slaMetrics={slaMetrics}
          />
        );
      case "users":
        return (
          <UsersPage
            currentUser={user}
            attackMode={attackMode}
            onSetAttackMode={setAttackMode}
            onTriggerManualAttack={handleTriggerManualAttack}
          />
        );
      case "attack":
        return <AttackPage onRunReplay={handleRunReplay} />;
      case "detect":
        return (
          <DetectPage
            alerts={alerts}
            onUpdateStatus={handleUpdateAlertStatus}
            blockedIps={blockedIps}
            onBlockIp={handleBlockIp}
            currentUserEmail={user.email}
            retrainingQueue={retrainingQueue}
            onMarkFalseLabel={handleMarkFalseLabel}
            ipAttackCounts={ipAttackCounts}
            modelVersion={modelVersion}
            onForwardToSiem={handleForwardToSiem}
            threatIntelDb={threatIntelDb}
          />
        );
      case "prevent":
        return (
          <PreventPage
            tasks={tasks}
            onToggle={handleToggleTask}
            preventionCoverage={preventionCoverage}
          />
        );
      case "reports":
        return (
          <ReportsPage
            threatLevel={threatLevel}
            preventionCoverage={preventionCoverage}
            alerts={alerts}
          />
        );
      case "waf":
        return (
          <WafPage
            blockedIps={blockedIps}
            onUnblockIp={handleUnblockIp}
            honeypotLogs={honeypotLogs}
            onDeployHoneypot={handleDeployHoneypot}
            ipAttackCounts={ipAttackCounts}
          />
        );
      case "activity":
        return <ActivityPage activity={activity} />;
      case "timeline":
        return <AttackTimelinePage events={attackEvents} />;
      case "map":
        return (
          <LiveAttackMapPage
            events={attackEvents}
            blockedIps={blockedIps}
            onBlockIp={handleBlockIp}
            currentUser={user}
            ipAttackCounts={ipAttackCounts}
          />
        );
      // ── SOC Module pages ──
      case "siem":
        return <SIEMPage siemEvents={siemEvents} />;
      case "threat-intel":
        return (
          <ThreatIntelPage
            threatIntelDb={threatIntelDb}
            attackEvents={attackEvents}
            ipAttackCounts={ipAttackCounts}
          />
        );
      case "attack-chain":
        return <AttackChainPage attackEvents={attackEvents} />;
      case "compliance":
        return <CompliancePage attackEvents={attackEvents} />;
      case "zero-trust":
        return <ZeroTrustPage />;
      case "api-security":
        return <APISecurityPage />;
      case "red-blue":
        return (
          <RedBluePage
            mode={redBlueMode}
            onSetMode={setRedBlueMode}
            score={redBlueScore}
            attackEvents={attackEvents}
            onRunAttack={handleTriggerManualAttack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        currentPage={page}
        onNavigate={setPage}
        user={user}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto">{renderPage()}</main>
      <Toaster theme="dark" />
      <AttackAlertPopup
        attack={attackPopup}
        onDismiss={() => setAttackPopup(null)}
        blockedIps={blockedIps}
        onBlockIp={handleBlockIp}
        currentUserEmail={user.email}
      />
      {user.role === "analyst" && (
        <AnalystDefendedNotification
          attack={analystNotification}
          onDismiss={() => setAnalystNotification(null)}
        />
      )}
      {user.role === "admin" && (
        <AdminAnalystResolvedNotification
          notification={adminCrossRoleNotification}
          onDismiss={() => setAdminCrossRoleNotification(null)}
        />
      )}
    </div>
  );
}

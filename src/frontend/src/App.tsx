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
  INITIAL_PREVENTION_TASKS,
  generateAutoAttack,
  generateInitialThreatTrend,
  getScenarioMeta,
} from "./data";
import ActivityPage from "./pages/ActivityPage";
import AttackPage from "./pages/AttackPage";
import DashboardPage from "./pages/DashboardPage";
import DetectPage from "./pages/DetectPage";
import LoginPage from "./pages/LoginPage";
import PreventPage from "./pages/PreventPage";
import ReportsPage from "./pages/ReportsPage";
import ScanPage from "./pages/ScanPage";
import SecurityLogoPage from "./pages/SecurityLogoPage";
import SqliGuardLogoPage from "./pages/SqliGuardLogoPage";
import UsersPage from "./pages/UsersPage";
import type {
  ActivityEntry,
  Alert,
  AlertStatus,
  Page,
  PreventionTask,
  ScannerEvent,
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
  } | null>(null);
  const [analystNotification, setAnalystNotification] = useState<{
    name: string;
  } | null>(null);
  const [adminCrossRoleNotification, setAdminCrossRoleNotification] = useState<{
    name: string;
  } | null>(null);
  const [scannerEvents, setScannerEvents] = useState<ScannerEvent[]>([]);
  const [attackMode, setAttackMode] = useState<"auto" | "manual">("auto");

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

  const handleLogin = useCallback(
    (email: string, password: string): boolean => {
      const normalEmail =
        email === "admin"
          ? "admin@combodefense.local"
          : email === "analyst"
            ? "analyst@combodefense.local"
            : email === "coadmin"
              ? "coadmin@combodefense.local"
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
      if (user?.role === "admin") {
        setAttackPopup({
          name: scenarioName,
          severity: scenarioId === "sqli" ? "critical" : "high",
          signal: meta.attackType,
        });
      }
      toast.error(`Attack replay: ${scenarioName}`, { duration: 3000 });
    },
    [user, addActivity],
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
      `Manual alert: ${autoAttack.name} from ${autoAttack.city}, India (${autoAttack.attackerIp})`,
      "SYSTEM",
    );
  }, [addActivity]);

  // ── Auto-attack timer (every 90 seconds) ── only fires in auto mode
  useEffect(() => {
    if (!user || page === "login" || attackMode !== "auto") return;
    const interval = setInterval(() => {
      const autoAttack = generateAutoAttack();
      setAttackPopup(autoAttack);
      addActivity(
        `Auto-alert: ${autoAttack.name} from ${autoAttack.city}, India (${autoAttack.attackerIp})`,
        "SYSTEM",
      );
    }, 90000);
    return () => clearInterval(interval);
  }, [user, page, addActivity, attackMode]);

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
      case "activity":
        return <ActivityPage activity={activity} />;
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

import { Toaster } from "@/components/ui/sonner";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import AttackAlertPopup from "./components/AttackAlertPopup";
import Sidebar from "./components/Sidebar";
import {
  INITIAL_ACTIVITY,
  INITIAL_ALERTS,
  INITIAL_PREVENTION_TASKS,
  generateInitialThreatTrend,
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
import type {
  ActivityEntry,
  Alert,
  AlertStatus,
  Page,
  PreventionTask,
  ThreatPoint,
  User,
} from "./types";

export default function App() {
  const [page, setPage] = useState<Page>("login");
  const [user, setUser] = useState<User | null>(null);
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
  } | null>(null);

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
      if (email === "admin@combodefense.local" && password === "admin123") {
        const u: User = { name: "Security Admin", email, role: "admin" };
        setUser(u);
        setShowSecurityLogo(true);
        setScanning(false);
        addActivity("User logged in", email);
        return true;
      }
      if (email === "analyst@combodefense.local" && password === "analyst123") {
        const u: User = { name: "Security Analyst", email, role: "analyst" };
        setUser(u);
        setShowSecurityLogo(true);
        setScanning(false);
        addActivity("User logged in", email);
        return true;
      }
      return false;
    },
    [addActivity],
  );

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
      const newAlert: Alert = {
        id: `alert-${Date.now()}`,
        scenarioName,
        severity: scenarioId === "sqli" ? "critical" : "high",
        status: "open",
        signal: "Input sanitizer bypass attempt detected",
        timestamp: new Date().toISOString(),
      };
      setAlerts((prev) => [newAlert, ...prev]);
      setThreatTrend((prev) => {
        const now = new Date();
        const level = Math.min(100, (prev[prev.length - 1]?.level ?? 40) + 15);
        return [
          ...prev.slice(-11),
          {
            time: now.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            level,
          },
        ];
      });
      addActivity(`Ran ${scenarioName} safe replay`, user?.email ?? "SYSTEM");
      toast.success(
        `${scenarioName}: Safe replay completed. Detection and prevention workflows were updated.`,
      );
      // Show attack popup
      setAttackPopup({
        name: scenarioName,
        severity: newAlert.severity,
        signal: newAlert.signal,
      });
    },
    [addActivity, user],
  );

  const handleUpdateAlertStatus = useCallback(
    (alertId: string, status: AlertStatus) => {
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status } : a)),
      );
      const alert = alerts.find((a) => a.id === alertId);
      if (alert)
        addActivity(
          `Alert for ${alert.scenarioName} status changed to ${status.toUpperCase()}`,
          user?.email ?? "SYSTEM",
        );
    },
    [alerts, addActivity, user],
  );

  const handleToggleTask = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t,
      ),
    );
  }, []);

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
    </div>
  );
}

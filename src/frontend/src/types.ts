export type Page =
  | "login"
  | "dashboard"
  | "attack"
  | "detect"
  | "prevent"
  | "reports"
  | "activity";

export type Role = "admin" | "analyst";

export interface User {
  name: string;
  email: string;
  role: Role;
}

export type Severity = "critical" | "high" | "medium" | "low";
export type AlertStatus = "open" | "investigating" | "resolved";

export interface Alert {
  id: string;
  scenarioName: string;
  severity: Severity;
  status: AlertStatus;
  signal: string;
  timestamp: string;
}

export interface PreventionTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface ActivityEntry {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
}

export interface ThreatPoint {
  time: string;
  level: number;
}

export interface AttackScenario {
  id: string;
  name: string;
  severity: Severity;
  description: string;
  steps: string[];
  prevention: string;
}

export interface ScannerEvent {
  id: number;
  timestamp: string;
  message: string;
  status: "FLAGGED";
}

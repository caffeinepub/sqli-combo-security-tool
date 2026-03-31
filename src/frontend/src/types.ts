export type Page =
  | "login"
  | "dashboard"
  | "attack"
  | "detect"
  | "prevent"
  | "reports"
  | "activity"
  | "users";

export type Role =
  | "admin"
  | "analyst"
  | "coadmin"
  | "viewer"
  | "monitor"
  | "auditor"
  | "responder";

export interface User {
  name: string;
  email: string;
  role: Role;
  displayRole?: string;
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
  hackerIp?: string;
  attackType?: string;
  reattackLoop?: string[];
  city?: string;
  triggeredBy?: string;
  resolvedBy?: string;
  mlThreatScore?: number;
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

export interface ExtendedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "online" | "offline";
  lastLogin: string;
  sessionIp: string;
  pagesVisited: string[];
  attacksTriggered: number;
  alertsResolved: number;
  activityLog: { timestamp: string; action: string }[];
}

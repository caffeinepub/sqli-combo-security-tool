export type Page =
  | "login"
  | "dashboard"
  | "attack"
  | "detect"
  | "prevent"
  | "reports"
  | "activity"
  | "users"
  | "timeline"
  | "map"
  | "waf"
  | "web-targets";

export type Role =
  | "admin"
  | "analyst"
  | "coadmin"
  | "viewer"
  | "monitor"
  | "auditor"
  | "responder"
  | "webuser";

export interface User {
  name: string;
  email: string;
  role: Role;
  displayRole?: string;
}

export type Severity = "critical" | "high" | "medium" | "low";
export type AlertStatus = "open" | "investigating" | "resolved";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

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
  obfuscatedPayload?: string;
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

export interface AttackEvent {
  id: string;
  timestamp: string;
  name: string;
  severity: string;
  city: string;
  attackerIp: string;
  attackType: string;
  source: "auto" | "manual" | "replay";
  websiteName?: string;
}

export interface BlockedIp {
  id: string;
  ip: string;
  reason: string;
  blockedAt: string;
  blockedBy: string;
}

export interface RetrainingCase {
  id: string;
  alertId: string;
  payload: string;
  label: "FP" | "FN";
  timestamp: Date;
  attackType: string;
}

export interface HoneypotLog {
  id: string;
  ip: string;
  payload: string;
  endpoint: string;
  timestamp: Date;
  autoFlagged: boolean;
}

export interface IpStats {
  count: number;
  firstSeen: string;
  lastSeen: string;
  riskScore: number;
}

export interface EnsembleScore {
  xgboost: number;
  svm: number;
  ensemble: number;
}

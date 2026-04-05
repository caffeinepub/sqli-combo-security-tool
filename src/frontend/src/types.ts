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
  | "web-targets"
  | "siem"
  | "threat-intel"
  | "attack-chain"
  | "compliance"
  | "zero-trust"
  | "api-security"
  | "red-blue";

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
  lat?: number;
  lon?: number;
  country?: string;
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

// ── SOC Module Types ─────────────────────────────────────────────────────────

export interface SiemEvent {
  id: string;
  alertId: string;
  eventId: string;
  severity: Severity;
  status: "ingested" | "correlated" | "incident" | "closed";
  attackType: string;
  sourceIp: string;
  correlatedCount: number;
  timestamp: string;
  pipeline: ("alert" | "ingestion" | "correlation" | "incident")[];
  currentStep: number;
}

export interface ThreatIntelEntry {
  id: string;
  ip?: string;
  domain?: string;
  reputation: "high" | "medium" | "low";
  category: string;
  country: string;
  lastSeen: string;
  attackCount: number;
  tags: string[];
}

export interface ZeroTrustRequest {
  id: string;
  timestamp: string;
  ip: string;
  path: string;
  method: string;
  result: "granted" | "denied";
  reason?: string;
  token?: string;
  riskScore: number;
}

export interface ApiAttackLog {
  id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  payload: string;
  attackType:
    | "json-injection"
    | "token-tampering"
    | "suspicious-payload"
    | "clean";
  mlScore: number;
  maliciousFields: string[];
  blocked: boolean;
}

export interface AutoResponse {
  id: string;
  timestamp: string;
  attackType: string;
  trigger: string;
  action: string;
  status: "triggered" | "executed" | "failed";
}

export interface SlaMetric {
  id: string;
  attackId: string;
  attackType: string;
  detectionTime: number;
  responseTime: number;
  timestamp: string;
}

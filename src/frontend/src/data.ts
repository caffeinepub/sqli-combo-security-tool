import type {
  ActivityEntry,
  Alert,
  AttackScenario,
  PreventionTask,
  ThreatPoint,
} from "./types";

export const ATTACK_SCENARIOS: AttackScenario[] = [
  {
    id: "sqli",
    name: "SQL Injection Replay",
    severity: "critical",
    description:
      "Simulates classic SQL payload attempts against login forms and query endpoints.",
    steps: [
      "Inject malformed SQL payload in form fields",
      "Observe WAF and query behavior",
      "Validate sanitization controls",
    ],
    prevention: "Apply parameterized queries and server-side allowlists.",
  },
  {
    id: "xss",
    name: "XSS Script Injection Replay",
    severity: "high",
    description: "Replays reflected/stored XSS payloads in user input fields.",
    steps: [
      "Post script-tag payload into comments",
      "Review rendered output and browser console",
      "Check CSP and encoding responses",
    ],
    prevention: "Encode output and enforce strict CSP.",
  },
  {
    id: "session",
    name: "Session Hijack Token Replay",
    severity: "high",
    description:
      "Simulates reuse of stale session tokens to test token invalidation controls.",
    steps: [
      "Replay expired/compromised token",
      "Attempt privileged route access",
      "Validate revocation and MFA challenge",
    ],
    prevention: "Rotate tokens frequently and enforce step-up authentication.",
  },
  {
    id: "ratelimit",
    name: "Rate-Limit Bypass Replay",
    severity: "high",
    description: "Tests burst request patterns against endpoint throttling.",
    steps: [
      "Generate high-frequency API requests",
      "Observe throttle counters",
      "Validate blocking and alerting",
    ],
    prevention: "Implement adaptive rate-limiting per endpoint.",
  },
];

export const INITIAL_ALERTS: Alert[] = [
  {
    id: "a1",
    scenarioName: "SQL Injection Replay",
    severity: "critical",
    status: "open",
    signal: "Malformed SQL payload detected in login endpoint",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "a2",
    scenarioName: "XSS Script Injection Replay",
    severity: "high",
    status: "investigating",
    signal: "Script tag injection in user comment field",
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "a3",
    scenarioName: "Session Hijack Token Replay",
    severity: "high",
    status: "open",
    signal: "Stale session token reuse attempt detected",
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: "a4",
    scenarioName: "Rate-Limit Bypass Replay",
    severity: "high",
    status: "resolved",
    signal: "Burst request pattern blocked by rate limiter",
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
];

export const INITIAL_PREVENTION_TASKS: PreventionTask[] = [
  {
    id: "t1",
    title: "Input Sanitization",
    description:
      "Apply server-side input validation and parameterized queries across all endpoints",
    completed: true,
  },
  {
    id: "t2",
    title: "WAF Rules Update",
    description:
      "Update Web Application Firewall rules to block latest OWASP Top 10 vectors",
    completed: false,
  },
  {
    id: "t3",
    title: "Rate Limiting",
    description:
      "Configure adaptive rate limiting on all public-facing API endpoints",
    completed: false,
  },
  {
    id: "t4",
    title: "Session Token Rotation",
    description:
      "Implement short-lived JWT tokens with automatic rotation and revocation",
    completed: false,
  },
];

export const INITIAL_ACTIVITY: ActivityEntry[] = [
  {
    id: "act1",
    action: "System initialized — Combo Defense Console activated",
    actor: "SYSTEM",
    timestamp: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
  {
    id: "act2",
    action: "Alert a1 created — SQL Injection Replay detected",
    actor: "SYSTEM",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "act3",
    action: "Alert a2 status changed to INVESTIGATING",
    actor: "analyst@combodefense.local",
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];

export function generateInitialThreatTrend(): ThreatPoint[] {
  const now = Date.now();
  return Array.from({ length: 12 }, (_, i) => ({
    time: new Date(now - (11 - i) * 300000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    level: Math.floor(10 + Math.random() * 60),
  }));
}

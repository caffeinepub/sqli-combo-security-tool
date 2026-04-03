import type {
  ActivityEntry,
  Alert,
  AttackScenario,
  ExtendedUser,
  HoneypotLog,
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
    obfuscatedPayload: "' OR 1%3D1 --",
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
    obfuscatedPayload: "<scr/**/ipt>alert(1)</scr/**/ipt>",
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
  {
    id: "csrf",
    name: "CSRF Token Bypass Replay",
    severity: "high",
    description:
      "Simulates cross-site request forgery attacks that trick authenticated users into submitting malicious requests.",
    steps: [
      "Craft forged POST request from attacker-controlled page",
      "Submit request using victim's active session cookies",
      "Validate CSRF token validation and SameSite cookie enforcement",
    ],
    prevention:
      "Implement CSRF tokens on all state-changing requests and use SameSite=Strict cookies.",
  },
  {
    id: "cmdinject",
    name: "Command Injection Replay",
    severity: "critical",
    description:
      "Replays OS command injection payloads targeting server-side input fields that invoke system commands.",
    steps: [
      "Inject shell metacharacters into vulnerable input fields",
      "Observe command execution and output leakage",
      "Validate input allowlisting and sandboxing controls",
    ],
    prevention:
      "Never pass user input to shell commands; use safe API calls with strict allowlists.",
  },
  {
    id: "dirtraversal",
    name: "Directory Traversal Replay",
    severity: "high",
    description:
      "Tests path traversal vectors to access files outside the web root using relative path sequences.",
    steps: [
      "Inject ../../../etc/passwd style payloads into file path parameters",
      "Observe file system access and error responses",
      "Validate path normalization and jail controls",
    ],
    prevention:
      "Canonicalize and validate all file paths; restrict access to a defined root directory.",
  },
  {
    id: "mitm",
    name: "Man-in-the-Middle Replay",
    severity: "critical",
    description:
      "Simulates network interception attacks where traffic between client and server is captured and manipulated.",
    steps: [
      "Intercept unencrypted HTTP traffic via ARP spoofing",
      "Inject malicious payloads into server responses",
      "Validate TLS enforcement and certificate pinning",
    ],
    prevention:
      "Enforce HTTPS with HSTS and certificate pinning; disable plain HTTP fallback.",
  },
  {
    id: "dnsspoofing",
    name: "DNS Spoofing Replay",
    severity: "high",
    description:
      "Replays DNS cache poisoning attacks to redirect users to attacker-controlled servers.",
    steps: [
      "Poison DNS cache with forged A records",
      "Redirect victim traffic to attacker-controlled IP",
      "Validate DNSSEC enforcement and resolver hardening",
    ],
    prevention:
      "Enable DNSSEC validation and use trusted DNS resolvers with response verification.",
  },
  {
    id: "bufferoverflow",
    name: "Buffer Overflow Replay",
    severity: "critical",
    description:
      "Simulates memory corruption attacks by sending oversized inputs to overflow stack or heap buffers.",
    steps: [
      "Send oversized payload to vulnerable input handler",
      "Observe crash, memory corruption, or arbitrary code execution",
      "Validate input length checks and stack canary protections",
    ],
    prevention:
      "Enforce strict input length limits and use memory-safe languages or compiler protections.",
  },
  {
    id: "scriptinject",
    name: "Script Injection Attack",
    severity: "high",
    description:
      "Exploits inline event handlers, javascript: URIs, and DOM-based script execution vectors that bypass tag-based filters.",
    steps: [
      "Inject javascript: URI into anchor href or src attributes",
      "Trigger execution via DOM event handlers (onmouseover, onerror)",
      "Observe CSP bypass and unauthorized script execution",
    ],
    prevention:
      "Enforce strict CSP, disallow javascript: URIs, and sanitize all DOM-inserted content.",
  },
  {
    id: "forcedlogin",
    name: "Forced Login (Credential Stuffing)",
    severity: "critical",
    description:
      "Uses breached credential databases and account enumeration to systematically compromise accounts with known username/password pairs.",
    steps: [
      "Load breached credential list (e.g. HaveIBeenPwned dumps)",
      "Enumerate valid accounts via login response timing/error differences",
      "Attempt credential stuffing across enumerated accounts",
    ],
    prevention:
      "Implement MFA, account lockout policies, and monitor for unusual login velocity from distinct IPs.",
  },
];

export interface PreventionGuide {
  id: string;
  title: string;
  attackVector: string;
  mitigation: string[];
  codeExample: string;
  owasp: string;
  nist: string;
  severity: "critical" | "high";
}

export const PREVENTION_GUIDES: PreventionGuide[] = [
  {
    id: "csrf",
    title: "CSRF Prevention",
    attackVector:
      "Cross-Site Request Forgery tricks an authenticated user's browser into sending unauthorized requests to a trusted site. The attacker exploits the browser's automatic cookie inclusion to perform state-changing actions without the user's knowledge.",
    mitigation: [
      "Generate a unique, unpredictable CSRF token per session and validate it on every state-changing request (POST, PUT, DELETE).",
      "Set cookies with SameSite=Strict or SameSite=Lax to prevent cross-origin cookie transmission.",
      "Verify the Origin and Referer request headers server-side to reject cross-domain requests.",
      "Use the Double Submit Cookie pattern as a defense-in-depth layer on APIs that cannot use sessions.",
    ],
    codeExample: `// Express.js — CSRF token middleware
import csrf from 'csurf';
import cookieParser from 'cookie-parser';

app.use(cookieParser());
app.use(csrf({ cookie: { sameSite: 'strict', httpOnly: true } }));

app.get('/form', (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});

// Set-Cookie: session=...; SameSite=Strict; Secure; HttpOnly`,
    owasp: "OWASP A01:2021 — Broken Access Control",
    nist: "NIST SP 800-53: AC-3, AC-17, SC-23",
    severity: "high",
  },
  {
    id: "cmdinject",
    title: "Command Injection Prevention",
    attackVector:
      "Command Injection occurs when attacker-controlled data is passed to a system shell or command interpreter without adequate sanitization. A single semicolon or pipe character can chain arbitrary OS commands, enabling full system compromise.",
    mitigation: [
      "Never concatenate user input into shell command strings — use language-native APIs (e.g., Python subprocess with list args, not shell=True).",
      "Define a strict allowlist of permitted characters or values; reject everything else at the input validation layer.",
      "Run application processes with least-privilege OS accounts that have no shell access.",
      "Enable AppArmor or seccomp profiles to restrict the syscalls the process can invoke.",
    ],
    codeExample: `# Python — safe subprocess (no shell)
import subprocess

# UNSAFE — never do this:
# os.system(f"ping {user_input}")

# SAFE — pass args as list, shell=False
allowed_hosts = re.compile(r'^[a-zA-Z0-9.-]{1,253}$')
if not allowed_hosts.match(host):
    raise ValueError("Invalid host")
result = subprocess.run(
    ["ping", "-c", "1", host],
    capture_output=True, text=True, shell=False
)`,
    owasp: "OWASP A03:2021 — Injection",
    nist: "NIST SP 800-53: SI-10, SI-15",
    severity: "critical",
  },
  {
    id: "dirtraversal",
    title: "Directory Traversal Prevention",
    attackVector:
      "Directory (Path) Traversal exploits insufficient path validation to access files and directories stored outside the intended web root. Sequences like ../../ allow attackers to read sensitive files such as /etc/passwd or application secrets.",
    mitigation: [
      "Canonicalize every file path using the language's built-in realpath/resolve function before any file operation.",
      "Verify that the resolved path starts with the intended base directory; reject any path that escapes the jail.",
      "Serve files through an abstraction layer (e.g., content-addressed storage) rather than exposing raw filesystem paths.",
      "Disable directory listings on the web server and configure the OS-level chroot where applicable.",
    ],
    codeExample: `// Node.js — safe file serving
import path from 'path';
import fs from 'fs';

const BASE_DIR = path.resolve('/var/www/files');

function serveFile(userInput: string): Buffer {
  const requested = path.resolve(BASE_DIR, userInput);

  // Reject if resolved path escapes base dir
  if (!requested.startsWith(BASE_DIR + path.sep)) {
    throw new Error('Access denied: path traversal detected');
  }

  return fs.readFileSync(requested);
}`,
    owasp: "OWASP A01:2021 — Broken Access Control",
    nist: "NIST SP 800-53: AC-3, AC-6",
    severity: "high",
  },
  {
    id: "mitm",
    title: "Man-in-the-Middle Prevention",
    attackVector:
      "Man-in-the-Middle attacks intercept communication between client and server, enabling eavesdropping, data manipulation, or session token theft. Unencrypted HTTP, weak TLS configurations, and missing certificate validation are primary entry points.",
    mitigation: [
      "Enforce TLS 1.2+ on all endpoints and disable SSLv3, TLS 1.0, and TLS 1.1 in server configuration.",
      "Deploy HTTP Strict Transport Security (HSTS) with a max-age of at least 1 year and includeSubDomains.",
      "Implement certificate pinning in mobile and thick clients to prevent rogue CA-signed certificates.",
      "Enable OCSP stapling and monitor certificate transparency logs for unauthorized issuance.",
    ],
    codeExample: `# Nginx — HSTS + strong TLS config
server {
  listen 443 ssl http2;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
  ssl_prefer_server_ciphers on;
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 10m;
  ssl_stapling on;
  ssl_stapling_verify on;

  # Strict-Transport-Security
  add_header Strict-Transport-Security
    "max-age=31536000; includeSubDomains; preload" always;
}`,
    owasp: "OWASP A02:2021 — Cryptographic Failures",
    nist: "NIST SP 800-53: SC-8, SC-23, SC-28",
    severity: "critical",
  },
  {
    id: "dnsspoofing",
    title: "DNS Spoofing Prevention",
    attackVector:
      "DNS Spoofing (Cache Poisoning) injects forged DNS records into resolver caches, redirecting victims to attacker-controlled servers. This enables phishing, credential harvest, and malware delivery without the target noticing any URL change.",
    mitigation: [
      "Enable DNSSEC (DNS Security Extensions) on all authoritative zones to cryptographically sign DNS records.",
      "Configure resolvers to validate DNSSEC signatures and reject unsigned or tampered responses.",
      "Use DNS over HTTPS (DoH) or DNS over TLS (DoT) to encrypt resolver traffic against on-path eavesdropping.",
      "Monitor DNS TTLs for unexpected shortening and alert on anomalous A record changes.",
    ],
    codeExample: `# BIND 9 — enable DNSSEC validation
# /etc/bind/named.conf.options

options {
  dnssec-enable yes;
  dnssec-validation auto;   # use built-in trust anchors
  dnssec-lookaside auto;

  # Use trusted forwarders with DoT support
  forwarders {
    1.1.1.1;   # Cloudflare
    8.8.8.8;   # Google
  };
  forward only;
};

# Sign zone with DNSSEC keys:
# dnssec-keygen -a ECDSAP256SHA256 -n ZONE example.com
# dnssec-signzone -A -3 $(head -c 1000 /dev/random | sha1sum | cut -b 1-16) example.com`,
    owasp: "OWASP A05:2021 — Security Misconfiguration",
    nist: "NIST SP 800-53: SC-20, SC-21",
    severity: "high",
  },
  {
    id: "bufferoverflow",
    title: "Buffer Overflow Prevention",
    attackVector:
      "Buffer Overflow attacks write data beyond the bounds of a fixed-size memory buffer, corrupting adjacent memory. This can overwrite return addresses, function pointers, or heap metadata — enabling arbitrary code execution and privilege escalation.",
    mitigation: [
      "Enforce strict input length limits at every entry point; reject or truncate inputs exceeding expected bounds before processing.",
      "Use memory-safe languages (Rust, Go) for new services; for C/C++, use safe string functions (strncpy, snprintf) and avoid gets/strcpy.",
      "Enable compiler mitigations: Stack Canaries (-fstack-protector-strong), ASLR, NX/DEP, and CFI (Control Flow Integrity).",
      "Apply fuzzing and static analysis (Valgrind, AddressSanitizer) as part of the CI/CD pipeline to detect overflows pre-production.",
    ],
    codeExample: `// C — safe input with strict length enforcement
#include <stdio.h>
#include <string.h>

#define MAX_INPUT 256

void process_input(const char *raw_input) {
  char safe_buf[MAX_INPUT];

  // strncpy + explicit null-terminate
  strncpy(safe_buf, raw_input, MAX_INPUT - 1);
  safe_buf[MAX_INPUT - 1] = '\0';

  // Reject suspiciously long inputs early
  if (strlen(raw_input) >= MAX_INPUT) {
    fprintf(stderr, "[BLOCKED] Input exceeds maximum length\n");
    return;
  }

  printf("Processing: %s\n", safe_buf);
}

// Compile with: gcc -fstack-protector-strong -D_FORTIFY_SOURCE=2 -O2`,
    owasp: "OWASP A06:2021 — Vulnerable and Outdated Components",
    nist: "NIST SP 800-53: SI-16, SA-11",
    severity: "critical",
  },
  {
    id: "scriptinject",
    title: "Script Injection Prevention",
    attackVector:
      "Script Injection attacks go beyond classic <script> tag injection to exploit DOM event handlers (onerror, onload, onmouseover), javascript: URIs in href/src attributes, and template literal injection. These vectors often bypass tag-based WAF rules and sanitizers that only strip <script> tags.",
    mitigation: [
      "Enforce a strict Content Security Policy (CSP) with script-src 'nonce-...' or 'sha256-...' to block inline script execution from injected content.",
      "Block javascript: URIs at the input validation layer and in link-building logic; never use user-supplied data as href/src without allowlist validation.",
      "Use a proven DOM sanitization library (DOMPurify) before inserting any user content into the DOM -- never use innerHTML with unsanitized input.",
      "Apply output encoding appropriate to the context (HTML entity encoding for HTML body, JavaScript encoding for JS strings, URL encoding for href attributes).",
    ],
    codeExample: `// DOMPurify — sanitize before DOM insertion
import DOMPurify from 'dompurify';

// Configure strict policy
const SAFE_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
  ALLOWED_ATTR: ['href', 'title'],
  FORBID_ATTR: ['style', 'onerror', 'onload'],
  FORBID_CONTENTS: ['script'],
};

// Block javascript: URIs
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.hasAttribute('href')) {
    const href = node.getAttribute('href') ?? '';
    if (/^javascript:/i.test(href)) {
      node.removeAttribute('href');
    }
  }
});

// Safe insertion
document.getElementById('content')!.innerHTML =
  DOMPurify.sanitize(userInput, SAFE_CONFIG);

// CSP header
// Content-Security-Policy: default-src 'self';
//   script-src 'self' 'nonce-{random}';
//   object-src 'none';`,
    owasp: "OWASP A03:2021 — Injection",
    nist: "NIST SP 800-53: SI-10, SI-15",
    severity: "high",
  },
  {
    id: "forcedlogin",
    title: "Forced Login / Credential Stuffing Prevention",
    attackVector:
      "Credential Stuffing attacks replay username/password pairs leaked in third-party data breaches against your login endpoints. Unlike brute-force attacks that guess passwords, stuffing uses real credentials, achieving high success rates (1-3%) with low request volumes. Account enumeration via login response differences allows attackers to identify valid accounts before stuffing.",
    mitigation: [
      "Enforce Multi-Factor Authentication (MFA/TOTP) for all accounts -- even correct credentials are useless without the second factor.",
      "Normalize all authentication error responses (timing, message, status code) to prevent account enumeration -- always return the same generic error.",
      "Implement device fingerprinting and behavioral velocity controls: flag logins from IPs attempting >10 unique accounts per hour.",
      "Integrate HaveIBeenPwned Passwords API (k-anonymity model) to block known-breached passwords at registration and password change.",
    ],
    codeExample: `// Express.js — credential stuffing defenses
import rateLimit from 'express-rate-limit';
import { pwnedPassword } from 'hibp';

// 1. Rate limit login by IP and username
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // max 10 attempts per IP
  keyGenerator: (req) => req.body.username + req.ip,
  message: 'Too many attempts, try again later',
});

// 2. Constant-time response to prevent timing enumeration
async function verifyLogin(username: string, password: string) {
  const user = await db.findUser(username);
  const hash = user?.passwordHash ?? DUMMY_HASH;
  // Always run bcrypt, even if user not found
  const valid = await bcrypt.compare(password, hash);
  if (!user || !valid) throw new Error('Invalid credentials');
  return user;
}

// 3. Block breached passwords on registration
async function checkBreached(password: string) {
  const count = await pwnedPassword(password);
  if (count > 0) throw new Error('Password found in breach database');
}`,
    owasp: "OWASP A07:2021 — Identification and Authentication Failures",
    nist: "NIST SP 800-53: AC-2, IA-5, IA-11",
    severity: "critical",
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
    hackerIp: "45.227.253.111",
    attackType: "SQL Injection (Classic UNION-based)",
    reattackLoop: [
      "T+0s  → Initial probe: ' OR 1=1 --",
      "T+12s → UNION SELECT enumeration attempt",
      "T+28s → Blind boolean inference: AND 1=2",
      "T+45s → Time-based SQLi: SLEEP(5)",
      "T+60s → Retry with obfuscated payload: %27 OR %271%27=%271",
    ],
  },
  {
    id: "a2",
    scenarioName: "XSS Script Injection Replay",
    severity: "high",
    status: "investigating",
    signal: "Script tag injection in user comment field",
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    hackerIp: "91.108.56.22",
    attackType: "Cross-Site Scripting (Reflected XSS)",
    reattackLoop: [
      "T+0s  → Payload: <script>alert(1)</script>",
      "T+18s → Encoded variant: <img src=x onerror=alert(1)>",
      "T+35s → DOM-based injection via URL fragment",
      "T+52s → SVG-based bypass: <svg/onload=alert(1)>",
      "T+70s → Polyglot payload to bypass filters",
    ],
  },
  {
    id: "a3",
    scenarioName: "Session Hijack Token Replay",
    severity: "high",
    status: "open",
    signal: "Stale session token reuse attempt detected",
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
    hackerIp: "185.220.101.47",
    attackType: "Session Hijacking (Token Replay)",
    reattackLoop: [
      "T+0s  → Stolen JWT replayed to /api/user/profile",
      "T+15s → Attempt to access /admin with same token",
      "T+30s → Token rotation bypass via parallel requests",
      "T+50s → Re-issue forged token with tampered claims",
      "T+65s → Second replay after short cooldown",
    ],
  },
  {
    id: "a4",
    scenarioName: "Rate-Limit Bypass Replay",
    severity: "high",
    status: "resolved",
    signal: "Burst request pattern blocked by rate limiter",
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    hackerIp: "198.54.117.200",
    attackType: "Rate-Limit Bypass (Distributed Burst)",
    reattackLoop: [
      "T+0s  → 500 requests/sec burst to /api/login",
      "T+5s  → IP rotation to bypass per-IP limits",
      "T+20s → Header spoofing: X-Forwarded-For manipulation",
      "T+38s → Slow-drip variant: 1 req/200ms across 50 IPs",
      "T+60s → Re-burst after rate window reset",
    ],
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

// Maps a scenario name to a fake hacker IP and reattack loop for dynamic alerts
const SCENARIO_META: Record<
  string,
  { hackerIp: string; attackType: string; reattackLoop: string[] }
> = {
  "SQL Injection Replay": {
    hackerIp: "45.227.253.111",
    attackType: "SQL Injection (Classic UNION-based)",
    reattackLoop: [
      "T+0s  → Initial probe: ' OR 1=1 --",
      "T+12s → UNION SELECT enumeration attempt",
      "T+28s → Blind boolean inference: AND 1=2",
      "T+45s → Time-based SQLi: SLEEP(5)",
      "T+60s → Retry with obfuscated payload",
    ],
  },
  "XSS Script Injection Replay": {
    hackerIp: "91.108.56.22",
    attackType: "Cross-Site Scripting (Reflected XSS)",
    reattackLoop: [
      "T+0s  → Payload: <script>alert(1)</script>",
      "T+18s → Encoded variant: <img src=x onerror=alert(1)>",
      "T+35s → DOM-based injection via URL fragment",
      "T+52s → SVG-based bypass: <svg/onload=alert(1)>",
      "T+70s → Polyglot payload to bypass filters",
    ],
  },
  "Session Hijack Token Replay": {
    hackerIp: "185.220.101.47",
    attackType: "Session Hijacking (Token Replay)",
    reattackLoop: [
      "T+0s  → Stolen JWT replayed to /api/user/profile",
      "T+15s → Attempt to access /admin with same token",
      "T+30s → Token rotation bypass via parallel requests",
      "T+50s → Re-issue forged token with tampered claims",
      "T+65s → Second replay after short cooldown",
    ],
  },
  "Rate-Limit Bypass Replay": {
    hackerIp: "198.54.117.200",
    attackType: "Rate-Limit Bypass (Distributed Burst)",
    reattackLoop: [
      "T+0s  → 500 requests/sec burst to /api/login",
      "T+5s  → IP rotation to bypass per-IP limits",
      "T+20s → Header spoofing: X-Forwarded-For manipulation",
      "T+38s → Slow-drip variant: 1 req/200ms across 50 IPs",
      "T+60s → Re-burst after rate window reset",
    ],
  },
  "CSRF Token Bypass Replay": {
    hackerIp: "103.24.77.182",
    attackType: "Cross-Site Request Forgery (Token Bypass)",
    reattackLoop: [
      "T+0s  → Forged POST to /api/transfer with stolen session",
      "T+10s → Retry with different referer header",
      "T+22s → CORS preflight bypass attempt",
      "T+38s → Double-submit cookie technique",
      "T+55s → Re-attempt with obfuscated form action",
    ],
  },
  "Command Injection Replay": {
    hackerIp: "77.88.55.66",
    attackType: "OS Command Injection (Shell Metachar)",
    reattackLoop: [
      "T+0s  → Payload: ; cat /etc/passwd",
      "T+8s  → Chained: && whoami && id",
      "T+20s → Backtick injection: `uname -a`",
      "T+35s → Encoded: %3B%20ls%20-la",
      "T+50s → Blind injection via time delay: sleep 5",
    ],
  },
  "Directory Traversal Replay": {
    hackerIp: "194.165.16.11",
    attackType: "Path Traversal (Relative Path Escape)",
    reattackLoop: [
      "T+0s  → Payload: ../../../../etc/passwd",
      "T+12s → URL-encoded: %2F%2E%2E%2F%2E%2E%2Fetc%2Fpasswd",
      "T+25s → Double-encoding: %252F%252E%252E%252F",
      "T+40s → Windows variant: ..\\..\\..\\windows\\win.ini",
      "T+58s → Null-byte termination: ../etc/passwd%00.jpg",
    ],
  },
  "Man-in-the-Middle Replay": {
    hackerIp: "5.188.206.14",
    attackType: "Man-in-the-Middle (ARP Spoof + SSL Strip)",
    reattackLoop: [
      "T+0s  → ARP spoofing broadcast initiated",
      "T+10s → HTTP traffic intercepted on port 80",
      "T+22s → SSL stripping: HTTPS downgraded to HTTP",
      "T+38s → Session cookies captured in plaintext",
      "T+55s → Replay captured token to /api/admin",
    ],
  },
  "DNS Spoofing Replay": {
    hackerIp: "45.142.212.100",
    attackType: "DNS Cache Poisoning (Forged A Record)",
    reattackLoop: [
      "T+0s  → Forged DNS response for target domain",
      "T+8s  → Cache poisoned at resolver level",
      "T+20s → Victim traffic redirected to 45.142.212.100",
      "T+35s → Phishing page served on attacker server",
      "T+52s → Credential harvest attempt detected",
    ],
  },
  "Buffer Overflow Replay": {
    hackerIp: "89.248.167.131",
    attackType: "Stack Buffer Overflow (RET overwrite)",
    reattackLoop: [
      "T+0s  → 1024-byte payload sent to vulnerable handler",
      "T+10s → Stack canary bypass via format string leak",
      "T+25s → Return address overwritten with shellcode addr",
      "T+40s → NOP sled + shellcode executed",
      "T+58s → Privilege escalation attempt post-exploitation",
    ],
  },
  "Script Injection Attack": {
    hackerIp: "62.233.57.12",
    attackType: "Script Injection (DOM-based Event Handler)",
    reattackLoop: [
      "T+0s  → javascript: URI injected in anchor tag",
      "T+10s → onerror handler triggered on image element",
      "T+22s → onmouseover payload delivered via SVG",
      "T+35s → CSP bypass attempted via base64 data URI",
      "T+50s → Script exfiltrates session cookie via fetch",
    ],
  },
  "Forced Login (Credential Stuffing)": {
    hackerIp: "185.156.73.44",
    attackType: "Credential Stuffing (Breached DB Replay)",
    reattackLoop: [
      "T+0s  → Loaded 50,000 breached credential pairs",
      "T+5s  → Account enumeration via response timing",
      "T+20s → 1st batch: 500 credential pairs attempted",
      "T+38s → 12 valid accounts identified via success response",
      "T+55s → Session tokens harvested for 12 compromised accounts",
    ],
  },
};

export function getScenarioMeta(scenarioName: string) {
  return (
    SCENARIO_META[scenarioName] ?? {
      hackerIp: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      attackType: scenarioName,
      reattackLoop: [
        "T+0s → Initial attack vector triggered",
        "T+30s → Retry with modified payload",
        "T+60s → Automated re-attempt detected",
      ],
    }
  );
}

// ── Extended users for Users page ──
export const EXTENDED_USERS: ExtendedUser[] = [
  {
    id: "admin",
    name: "Security Admin",
    email: "admin@combodefense.local",
    role: "admin",
    status: "online",
    lastLogin: "2 min ago",
    sessionIp: "192.168.1.10",
    pagesVisited: ["Dashboard", "Attack", "Detect", "Reports"],
    attacksTriggered: 5,
    alertsResolved: 3,
    activityLog: [
      { timestamp: "08:02:11", action: "Logged in successfully" },
      { timestamp: "08:03:45", action: "Viewed Dashboard metrics" },
      { timestamp: "08:10:22", action: "Ran SQL Injection replay" },
      { timestamp: "08:15:09", action: "Reviewed Attack Detection Report" },
      { timestamp: "08:20:33", action: "Resolved Session Hijack alert" },
    ],
  },
  {
    id: "coadmin",
    name: "Co-Admin Officer",
    email: "coadmin@combodefense.local",
    role: "coadmin",
    status: "online",
    lastLogin: "15 min ago",
    sessionIp: "192.168.1.11",
    pagesVisited: ["Dashboard", "Users", "Reports"],
    attacksTriggered: 2,
    alertsResolved: 4,
    activityLog: [
      { timestamp: "07:50:00", action: "Logged in successfully" },
      { timestamp: "07:55:18", action: "Reviewed Users page" },
      { timestamp: "08:01:44", action: "Ran XSS replay" },
      { timestamp: "08:12:30", action: "Resolved XSS alert #a2" },
    ],
  },
  {
    id: "analyst",
    name: "Security Analyst",
    email: "analyst@combodefense.local",
    role: "analyst",
    status: "online",
    lastLogin: "5 min ago",
    sessionIp: "192.168.1.22",
    pagesVisited: ["Detect", "Dashboard", "Prevent"],
    attacksTriggered: 1,
    alertsResolved: 7,
    activityLog: [
      { timestamp: "08:00:05", action: "Logged in successfully" },
      { timestamp: "08:01:12", action: "Opened Detect page" },
      { timestamp: "08:05:55", action: "Resolved XSS alert #a2" },
      { timestamp: "08:11:40", action: "Set alert #a3 to INVESTIGATING" },
      { timestamp: "08:18:22", action: "Reviewed Prevention checklist" },
    ],
  },
  {
    id: "user1",
    name: "Threat Analyst I",
    email: "user1@combodefense.local",
    role: "analyst",
    status: "offline",
    lastLogin: "2h ago",
    sessionIp: "192.168.1.30",
    pagesVisited: ["Detect", "Reports"],
    attacksTriggered: 0,
    alertsResolved: 2,
    activityLog: [
      { timestamp: "06:10:00", action: "Logged in successfully" },
      { timestamp: "06:25:44", action: "Reviewed open alerts" },
      { timestamp: "06:40:11", action: "Resolved Rate-Limit Bypass alert" },
    ],
  },
  {
    id: "user2",
    name: "System Viewer",
    email: "user2@combodefense.local",
    role: "viewer",
    status: "offline",
    lastLogin: "4h ago",
    sessionIp: "192.168.1.31",
    pagesVisited: ["Dashboard"],
    attacksTriggered: 0,
    alertsResolved: 0,
    activityLog: [
      { timestamp: "04:05:30", action: "Logged in successfully" },
      { timestamp: "04:12:00", action: "Viewed Dashboard summary" },
    ],
  },
  {
    id: "user3",
    name: "Network Monitor",
    email: "user3@combodefense.local",
    role: "monitor",
    status: "online",
    lastLogin: "30 min ago",
    sessionIp: "192.168.1.32",
    pagesVisited: ["Dashboard", "Reports"],
    attacksTriggered: 1,
    alertsResolved: 1,
    activityLog: [
      { timestamp: "07:35:00", action: "Logged in successfully" },
      { timestamp: "07:42:18", action: "Ran Rate-Limit Bypass replay" },
      { timestamp: "07:55:09", action: "Viewed threat trend report" },
    ],
  },
  {
    id: "user4",
    name: "Security Auditor",
    email: "user4@combodefense.local",
    role: "auditor",
    status: "offline",
    lastLogin: "1d ago",
    sessionIp: "192.168.1.33",
    pagesVisited: ["Reports", "Prevent"],
    attacksTriggered: 0,
    alertsResolved: 5,
    activityLog: [
      { timestamp: "Yesterday 09:00", action: "Logged in successfully" },
      { timestamp: "Yesterday 09:15", action: "Completed Prevention audit" },
      { timestamp: "Yesterday 10:02", action: "Resolved 5 historical alerts" },
    ],
  },
  {
    id: "user5",
    name: "Incident Responder",
    email: "user5@combodefense.local",
    role: "responder",
    status: "online",
    lastLogin: "10 min ago",
    sessionIp: "192.168.1.34",
    pagesVisited: ["Detect", "Attack", "Dashboard"],
    attacksTriggered: 3,
    alertsResolved: 6,
    activityLog: [
      { timestamp: "07:55:00", action: "Logged in successfully" },
      { timestamp: "07:58:44", action: "Ran Session Hijack replay" },
      { timestamp: "08:04:22", action: "Investigated Brute Force alert" },
      { timestamp: "08:14:55", action: "Resolved Privilege Escalation alert" },
    ],
  },
];

export const INDIAN_CITIES = [
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Chennai",
  "Hyderabad",
  "Kolkata",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Surat",
  "Nagpur",
  "Visakhapatnam",
  "Bhopal",
  "Patna",
  "Vadodara",
  "Ludhiana",
  "Agra",
  "Nashik",
  "Indore",
  "Coimbatore",
];

export const AUTO_ATTACK_TYPES = [
  "SQL Injection",
  "Cross-Site Scripting (XSS)",
  "Brute Force Attack",
  "Session Hijacking",
  "Privilege Escalation",
];

export function generateAutoAttack(): {
  name: string;
  severity: string;
  signal: string;
  city: string;
  attackerIp: string;
} {
  const city = INDIAN_CITIES[Math.floor(Math.random() * INDIAN_CITIES.length)];
  const attackType =
    AUTO_ATTACK_TYPES[Math.floor(Math.random() * AUTO_ATTACK_TYPES.length)];
  const ip = `${10 + Math.floor(Math.random() * 245)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  const severities = ["critical", "high", "medium"];
  const severity = severities[Math.floor(Math.random() * severities.length)];
  return {
    name: attackType,
    severity,
    signal: `${attackType} attempt detected from ${city}, India`,
    city,
    attackerIp: ip,
  };
}

// ── Honeypot System Initial Data ──
export const INITIAL_HONEYPOT_LOGS: HoneypotLog[] = [
  {
    id: "h1",
    ip: "103.45.67.89",
    payload: "' OR '1'='1",
    endpoint: "/api/v1/login",
    timestamp: new Date(Date.now() - 300000),
    autoFlagged: true,
  },
  {
    id: "h2",
    ip: "45.227.253.11",
    payload: '<script>document.location="http://evil.com"</script>',
    endpoint: "/api/v1/admin",
    timestamp: new Date(Date.now() - 600000),
    autoFlagged: true,
  },
  {
    id: "h3",
    ip: "192.168.1.105",
    payload: "../../../etc/passwd",
    endpoint: "/api/v1/data",
    timestamp: new Date(Date.now() - 900000),
    autoFlagged: false,
  },
  {
    id: "h4",
    ip: "77.88.99.10",
    payload: "admin' --",
    endpoint: "/api/v1/login",
    timestamp: new Date(Date.now() - 1200000),
    autoFlagged: true,
  },
  {
    id: "h5",
    ip: "210.16.75.33",
    payload: "UN/**/ION SEL/**/ECT * FROM users",
    endpoint: "/api/v1/data",
    timestamp: new Date(Date.now() - 1500000),
    autoFlagged: true,
  },
];

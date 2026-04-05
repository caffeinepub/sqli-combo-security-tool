# Combo Defense Console — SOC Platform Upgrade

## Current State

Fully functional cyberpunk cybersecurity simulation platform with:
- Pages: login, dashboard, attack, detect, prevent, reports, waf, users, timeline, map, activity, web-targets
- Sidebar navigation with 10 nav items (adminOnly for reports, waf)
- Page type union in types.ts
- App.tsx orchestrates all global state: alerts, attackEvents, blockedIps, ipAttackCounts, retrainingQueue, honeypotLogs, threatTrend, modelVersion
- DashboardPage (1707 lines): ML anomaly graph, threat trend, scanner, behavioral analysis, AI retraining center
- DetectPage (1125 lines): Alert list, XAI modal with TF-IDF/XGBoost/SVM scores, FP/FN marking
- WafPage (983 lines): Firewall rules, blocked IPs, honeypot panel, WAF simulation modal
- AttackPage (206 lines): 16+ attack scenarios with replay, ML prediction panels
- Sidebar.tsx: navItems array + adminOnly filter
- types.ts: Page union, all interfaces

## Requested Changes (Diff)

### Add
1. **SIEMPage** — new page (`siem`) with SIEM event queue, pipeline animation (Alert→Ingestion→Correlation→Incident), event table with ID/severity/status/correlated count; "Forward to SIEM" button on each alert in DetectPage
2. **ThreatIntelPage** — new page (`threat-intel`) with malicious IP/domain database, reputation scoring (High/Medium/Low), known attacker highlights; integrate IP reputation lookup into DetectPage alert modal and DashboardPage
3. **AttackChainPage** — new page (`attack-chain`) showing Recon→Injection→Exploitation→Data Access lifecycle; per-attack animated flow diagram; step-by-step replay with PREV/NEXT; synced with attackEvents
4. **AIAutoResponsePanel** — new section in DashboardPage showing auto-triggered actions per attack type (SQLi→Block IP, Brute Force→Rate Limit, XSS→Sanitize), decision flow animation, "Auto-response triggered" messages
5. **CompliancePage** — new page (`compliance`) mapping each attack type to OWASP Top 10 + NIST categories, risk explanation cards, color-coded severity
6. **SLAMetricsPanel** — new section in DashboardPage tracking detection time (ms) and response time (ms) per attack, average performance graphs
7. **MultiSystemMonitoring** — new section at top of DashboardPage: Web App / API / Database health cards showing Safe/Under Attack/Critical status, dynamically updated by active attack type
8. **ZeroTrustPage** — new page (`zero-trust`) with real-time request validation feed (Access Granted/Denied), session/token check results, reason for denial
9. **APISecurityPage** — new page (`api-security`) detecting JSON injection, token tampering, suspicious API payloads; API log with malicious field highlighting; ML score integration
10. **RedBluePage** — new page (`red-blue`) with global Red Team/Blue Team toggle, scoreboard (Attacks vs Defenses), animated attack-defense interaction timeline

### Modify
- **types.ts**: Add new Page values: `siem | threat-intel | attack-chain | compliance | zero-trust | api-security | red-blue`; add new interfaces: `SiemEvent`, `ThreatIntelEntry`, `ZeroTrustRequest`, `ApiAttackLog`, `AutoResponse`, `SlaMetric`
- **Sidebar.tsx**: Add 7 new nav items for new pages (adminOnly where appropriate); group under "SOC MODULES" section label
- **App.tsx**: Add state for siemEvents, threatIntelDb, autoResponses, slaMetrics, redBlueMode, redBlueScore; wire new handlers; pass to new pages; add new page cases in renderPage()
- **DetectPage**: Add "Forward to SIEM" button per alert; show IP reputation badge from threat intel db
- **DashboardPage**: Add MultiSystemMonitoring cards at top, AIAutoResponsePanel, SLAMetricsPanel as new sections (below existing panels)

### Remove
- Nothing — all existing features preserved

## Implementation Plan

1. **types.ts** — extend Page union + add 6 new interfaces (SiemEvent, ThreatIntelEntry, ZeroTrustRequest, ApiAttackLog, AutoResponse, SlaMetric)
2. **Sidebar.tsx** — add SOC MODULES section with 7 new nav items, adminOnly where relevant
3. **App.tsx** — add state hooks for new modules, add 7 new page cases in renderPage(), wire new prop flows
4. **DetectPage.tsx** — add "FORWARD TO SIEM" button and IP reputation badge inline (minimal surgical additions)
5. **DashboardPage.tsx** — add MultiSystemMonitoring cards block at top, AIAutoResponsePanel section, SLAMetricsPanel section (append below existing content)
6. **New pages** (7 files):
   - `SIEMPage.tsx` — SIEM pipeline + event queue
   - `ThreatIntelPage.tsx` — IP/domain reputation database
   - `AttackChainPage.tsx` — attack lifecycle flow diagram + replay
   - `CompliancePage.tsx` — OWASP/NIST mapping cards
   - `ZeroTrustPage.tsx` — request validation live feed
   - `APISecurityPage.tsx` — API attack log + ML integration
   - `RedBluePage.tsx` — Red/Blue team mode + scoreboard

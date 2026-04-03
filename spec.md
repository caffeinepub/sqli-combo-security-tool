# SQLi Combo Security Tool — AI Platform Upgrade

## Current State

The app is a fully-featured cyberpunk cybersecurity simulation dashboard with:
- 3 core modules: Attack, Detect, Prevent
- ML simulation: TF-IDF + XGBoost per-alert scoring on Detect page, Dashboard anomaly panel, Attack tab next-prediction
- IP blocking from popup/Detect modal/Live Map, managed in WAF tab
- 3D rotating globe (Three.js) with India boundary and city labels
- WAF tab with firewall rules, blocked requests, WAF attack simulation animation
- Reports tab (CSV + PDF download, date range filter)
- Auto-attack alerts every 90s, Manual mode control
- 8 demo accounts with role-based access
- webuser credential stuffing dashboard
- All pages: dashboard, attack, detect, prevent, reports, users, waf, timeline, map

## Requested Changes (Diff)

### Add

1. **Explainable AI (XAI) Panel** — new section in Detect alert modal
   - Show RAW INPUT → NORMALIZED INPUT → TOKENIZED pipeline stages
   - Color-highlight suspicious SQL keywords (UNION, SELECT, OR, DROP, INSERT, DELETE, EXEC, SCRIPT, etc.) in the query string
   - Token-level contribution bar showing each keyword's TF-IDF weight
   - XAI panel also on Dashboard as a dedicated "Feature Importance" section

2. **Ensemble ML Model (XGBoost + SVM)** — new panel on Detect page + Dashboard
   - Side-by-side: XGBoost score vs SVM score vs Ensemble final score
   - Simulated model comparison metrics table: Accuracy / Precision / Recall / F1 for each model
   - Voting badge showing which model "won" and why
   - Replace existing single XGBoost score display with ensemble output

3. **Auto-Retraining System** — new "AI RETRAINING" tab/panel (Dashboard or dedicated section)
   - Mark any alert as False Positive or False Negative (buttons in Detect modal)
   - Retraining queue: shows queued cases with payload snippet, label, timestamp
   - "RETRAIN MODEL" button triggers simulated retraining animation (progress bar, updating metrics)
   - Model version counter (v1.0.0 → v1.0.1 after retrain)

4. **Smart IP Blocking (Adaptive)** — replace permanent block logic in WAF + App.tsx
   - Track attack count per IP
   - 3 attacks → TEMP BLOCK (10-minute timer countdown shown in WAF)
   - 10 attacks → PERMANENT BLOCK
   - Block status badge: TEMP / PERM / WATCHING in WAF blocked IPs list
   - IP attack counter shown in popup and Detect modal

5. **Obfuscation Detection** — new preprocessing pipeline display
   - Normalize: URL decode (%27→', %20→space), strip inline comments (UN/**/ION → UNION), normalize case
   - Show preprocessing steps visually in XAI panel: before/after
   - Add obfuscated attack variants to attack scenarios (e.g., "' OR 1%3D1 --", "UN/**/ION SEL/**/ECT")

6. **Honeypot System** — new tab or panel (admin only)
   - Fake /login and /api/data endpoint simulation
   - When attacker triggers honeypot: logs IP, payload, timestamp, auto-marks as SUSPICIOUS
   - Honeypot activity feed in WAF tab or dedicated Honeypot panel
   - "Deploy Honeypot" toggle, configurable endpoint paths

7. **Live Attack Map Enhancement**
   - Add heatmap overlay toggle (brighter glow on cities with more attacks)
   - "Top Attacking Cities" sidebar panel on map page
   - Attack source → target connection lines (arcs from attacker city to "HQ" center)
   - Attack count bubble per city

8. **Dynamic Risk Scoring System**
   - Calculate composite risk score per IP and per session: frequency × severity × confidence
   - Show risk level badge: LOW / MEDIUM / HIGH / CRITICAL on each alert
   - Dashboard: overall Risk Score meter (0–100) with animated gauge
   - Per-IP risk score in WAF blocked list and Detect modal

9. **Next Attack Prediction (Enhanced)**
   - Already exists on Attack tab — enhance with historical frequency weighting
   - Add prediction to Dashboard sidebar panel with countdown "next predicted in X seconds"
   - Detect page: show recommended prevention action based on predicted next attack

10. **Report Generation (Enhanced)**
    - Already exists — add Dynamic Risk Score column to PDF/CSV
    - Add Executive Summary section to PDF with total risk level, top threat, recommended actions
    - Add "Ensemble Model Metrics" section in PDF

11. **Behavioral Analysis** — new panel on Dashboard
    - Per-IP request frequency tracker (simulated burst patterns)
    - Anomaly flag: IPs exceeding 5 requests/minute get BEHAVIORAL ANOMALY tag
    - Session pattern analysis: shows normal vs. anomalous session graphs
    - Separate from existing ML Anomaly Detection — focused on behavioral patterns

12. **UI Enhancements**
    - Add visual indicator bar at top of dashboard: SAFE / WARNING / CRITICAL state (green/yellow/red glow)
    - Add mini sparkline charts on stat cards
    - Improve color coding: critical = red glow, high = orange, medium = yellow, low = green throughout
    - Add animated scan line to Detect page header

### Modify

- `DetectPage.tsx`: Add XAI panel, Ensemble model panel, FP/FN marking buttons, Risk Score badge, Obfuscation pipeline display, Adaptive IP block counter to existing modal
- `DashboardPage.tsx`: Add Behavioral Analysis panel, Risk Score gauge, enhanced ML panel with ensemble + XAI feature importance, top prediction countdown
- `WafPage.tsx`: Add adaptive block logic (TEMP/PERM badges, countdown timers), Honeypot panel/tab, attack count per IP
- `LiveAttackMapPage.tsx`: Add heatmap overlay, connection arcs, top cities sidebar, attack count bubbles
- `ReportsPage.tsx`: Add risk score column, executive summary section to PDF
- `App.tsx`: Add ipAttackCounts state, retrainingQueue state, honeypotLogs state, adaptive block logic
- `types.ts`: Add RetrainingCase, HoneypotLog, IpStats, RiskLevel types
- `data.ts`: Add obfuscated attack variants, honeypot scenarios

### Remove

- Nothing removed. All existing features preserved.

## Implementation Plan

1. Update `types.ts` — add RetrainingCase, HoneypotLog, IpStats, RiskLevel, EnsembleScore types
2. Update `data.ts` — add obfuscated payloads to scenarios, honeypot data
3. Update `App.tsx` — add ipAttackCounts (Map<string,number>), retrainingQueue, honeypotLogs, adaptive block logic (3→temp, 10→perm), risk score calculation helper
4. Update `DetectPage.tsx` — XAI panel with keyword highlighting + obfuscation pipeline, Ensemble model panel, FP/FN marking, Risk Score badge, adaptive block status
5. Update `DashboardPage.tsx` — Risk Score gauge widget, Behavioral Analysis panel, enhanced ML section with ensemble + XAI feature importance chart, prediction countdown
6. Update `WafPage.tsx` — adaptive block badges (TEMP/PERM/WATCHING) with countdown, Honeypot panel with deploy toggle and activity log
7. Update `LiveAttackMapPage.tsx` — heatmap glow intensity by count, top cities sidebar, attack arcs, count bubbles on globe
8. Update `ReportsPage.tsx` — add risk score column, executive summary to PDF output
9. New component `EnsemblePanel.tsx` — reusable ensemble score + metrics display
10. New component `XAIPanel.tsx` — reusable explainability panel with keyword highlighting

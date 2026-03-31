# SQLi Combo Security Tool — Attack Activity Download Report

## Current State

The app already has a `ReportsPage.tsx` (linked to the `reports` nav tab) but it only shows a static security posture snapshot — threat level, prevention coverage, and open alerts. It has no download capability, no date filtering, and no per-attack activity table.

The `Alert` interface in `types.ts` is missing: `city`, `triggeredBy`, `resolvedBy`, `mlThreatScore`. These fields are needed for the activity report.

The `App.tsx` handles `handleRunReplay` (which generates alerts) and `handleUpdateAlertStatus` (which resolves alerts), but neither captures the user who triggered/resolved or the city.

The `Sidebar.tsx` shows all nav items to all users equally — no role gating on the Reports tab.

## Requested Changes (Diff)

### Add
- Extend `Alert` type with optional fields: `city?: string`, `triggeredBy?: string`, `resolvedBy?: string`, `mlThreatScore?: number`
- In `App.tsx` `handleRunReplay`: populate `city` (pick random Indian city for auto-attacks; leave blank for manual replays), `triggeredBy` (current user's email), `mlThreatScore` (random 50–99 for critical/high)
- In `App.tsx` `handleUpdateAlertStatus`: when status becomes `resolved`, update the alert's `resolvedBy` to current user's email
- Revamp `ReportsPage.tsx` into a full attack activity download report:
  - Header: "ATTACK ACTIVITY REPORT" with admin-only badge
  - Date range filter: Start Date + End Date inputs, plus an "APPLY FILTER" button
  - Summary stats row: Total Events, Open, Resolved, Critical Count
  - Activity table with columns: Timestamp, Attack Type, Attacker IP, City, Status, Triggered By, Resolved By, ML Threat Score
  - Status badge color-coded: OPEN (red), INVESTIGATING (yellow), RESOLVED (green)
  - ML score shown as a colored bar + percentage (red >70%, orange 40–70%, green <40%)
  - "DOWNLOAD CSV" button: generates and downloads a .csv file of filtered rows
  - "DOWNLOAD PDF" button: generates a formatted PDF using browser print/canvas (no external library needed — use window.print() with a print-only styled div, OR construct a text blob that looks like a report)
  - Empty state message when no records match the filter
- Sidebar: gate the Reports tab so it only shows to users with role `admin` (which includes co-admin since displayRole="CO-ADMIN" but role="admin")

### Modify
- `types.ts`: Add `city?`, `triggeredBy?`, `resolvedBy?`, `mlThreatScore?` to Alert interface
- `App.tsx`: Update `handleRunReplay` and `handleUpdateAlertStatus` as described
- `ReportsPage.tsx`: Full replacement with the new attack activity download report UI
- `Sidebar.tsx`: Filter navItems so `reports` tab only renders when `user.role === 'admin'`

### Remove
- The old static security posture summary content from `ReportsPage.tsx` (replace entirely — nothing from the old reports page needs to be kept)

## Implementation Plan

1. Update `src/frontend/src/types.ts` — extend Alert interface with city, triggeredBy, resolvedBy, mlThreatScore
2. Update `src/frontend/src/App.tsx` — populate new Alert fields in handleRunReplay, capture resolvedBy in handleUpdateAlertStatus
3. Replace `src/frontend/src/pages/ReportsPage.tsx` — new full attack activity download report with date filter, table, CSV download, PDF download
4. Update `src/frontend/src/components/Sidebar.tsx` — hide Reports nav item for non-admin users
5. Validate (lint, typecheck, build)

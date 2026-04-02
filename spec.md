# SQLi Combo Security Tool

## Current State
- Full cyberpunk cybersecurity training platform with Attack, Detect, Prevent, Dashboard, Users, Reports, Timeline, and Live Attack Map pages.
- Live Attack Map uses a hand-drawn SVG India outline with hardcoded paths — not a real geographic map.
- No WAF (Web Application Firewall) management page exists.
- No IP blocking functionality when attacks are detected.
- Attack popups and Detect modal show attacker IP but have no way to block it.

## Requested Changes (Diff)

### Add
- **Real World Map**: Replace the custom SVG India outline in LiveAttackMapPage with a Leaflet-based real-world tile map. Attack dots show as pulsing markers at accurate lat/lon coordinates for each Indian city. Clicking a marker shows a popup with attack details.
- **WAF (Secure Web Application Firewall) Tab**: New "WAF" tab in the Sidebar (admin/co-admin only). New `WafPage` showing: firewall status toggle (ON/OFF), active WAF rules list (SQLi, XSS, CSRF, RCE, etc.), blocked requests log, and blocked IP list. All simulated/demo data.
- **IP Blocking**: 
  - New `blockedIps` state array in App.tsx.
  - `handleBlockIp(ip)` function that adds an IP to the blocked list and logs the action.
  - "BLOCK IP" button on the AttackAlertPopup (when attackerIp is present).
  - "BLOCK IP" button in the DetectPage Threat Intelligence modal.
  - Blocked IPs are passed to WafPage to display in the blocked IP list.
  - Visual indicator in AttackAlertPopup/DetectModal if IP is already blocked.

### Modify
- `LiveAttackMapPage.tsx`: Replace SVG map with Leaflet real-world map using OpenStreetMap tiles. Keep the side panels (stats, recent attacks, top cities) unchanged.
- `App.tsx`: Add `blockedIps` state, `handleBlockIp` function, pass to AttackAlertPopup, DetectPage, and WafPage.
- `AttackAlertPopup.tsx`: Add "BLOCK IP" button when `attackerIp` is present. Show "ALREADY BLOCKED" if IP is in blockedIps.
- `DetectPage.tsx`: Add "BLOCK IP" button in the Threat Intelligence modal. Pass blockedIps and onBlockIp props.
- `Sidebar.tsx`: Add "WAF" nav item for admin/co-admin.
- `types.ts`: Add `"waf"` to the `Page` union type. Add `BlockedIp` interface.

### Remove
- Nothing. All existing features remain unchanged.

## Implementation Plan
1. Install `leaflet` and `react-leaflet` packages, add Leaflet CSS import.
2. Update `types.ts` — add `"waf"` page, `BlockedIp` interface.
3. Rewrite `LiveAttackMapPage.tsx` using `MapContainer`, `TileLayer`, `CircleMarker`, `Popup` from react-leaflet.
4. Create `WafPage.tsx` with firewall status, rules, blocked requests log, and blocked IPs panel.
5. Update `AttackAlertPopup.tsx` to accept `blockedIps` and `onBlockIp` props, show BLOCK IP button.
6. Update `DetectPage.tsx` to accept `blockedIps` and `onBlockIp` props, show BLOCK IP in modal.
7. Update `App.tsx` — add blockedIps state, handleBlockIp, wire WAF page, pass new props.
8. Update `Sidebar.tsx` — add WAF nav item for admin/co-admin role.

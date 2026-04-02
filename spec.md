# SQLi Combo Security Tool — WAF Attack Simulation Animation

## Current State

The WAF tab (`WafPage.tsx`) is a full-featured firewall management page with:
- Master ON/OFF firewall toggle
- 10 WAF rules with enable/disable toggles and hit counts
- Blocked requests log
- Blocked IP management panel
- Security posture summary stats (bottom)

No animation or simulation panel exists in the WAF tab yet.

## Requested Changes (Diff)

### Add
- A new **"VIEW ATTACK SIMULATION"** button at the top of the WafPage (prominent, cyberpunk-styled, glowing cyan/green)
- A new **`WafSimulationModal`** component (full-screen overlay/modal) that opens when the button is clicked
- The modal contains a **3-phase animated visual scene** that auto-loops through steps:
  - **Phase 1 — Direct Attack**: Attacker browser window fires animated attack packets (flying red/orange projectiles with labels like `SQL INJECTION`, `XSS`, `PAYLOAD`) toward the Main Site browser window. The main site shows stress/damage indicators.
  - **Phase 2 — WAF Intercepts**: A glowing WAF Shield appears between the attacker and the main site. Attack packets hit the shield and are deflected/blocked. The shield shows block animations. A new Clone Site browser window materializes (green, slightly transparent, labeled "HONEYPOT / CLONE SITE").
  - **Phase 3 — Bypass to Clone**: The WAF redirects the attacker silently toward the Clone site. Attack packets now fly toward the clone. The clone shows fake "success" indicators while the main site shows "PROTECTED / SECURE". Final banner: "ATTACKER TRAPPED IN CLONE — MAIN SITE SECURED".
- Each phase has:
  - A phase indicator bar (Phase 1 / 2 / 3 with progress dots)
  - Phase label and description text below the animation canvas
  - A "NEXT STEP" button to advance manually AND auto-advance every ~3.5 seconds when looping
  - The loop restarts from Phase 1 after Phase 3 completes
- Visual style: dark background with matrix green code rain in background, neon glowing elements (cyan, green, red, orange), cyberpunk browser window chrome, animated SVG/CSS packets
- A close button (X) in the top-right to dismiss the modal

### Modify
- `WafPage.tsx`: Add the "VIEW ATTACK SIMULATION" button near the top header section, and import/render the new modal with open/close state

### Remove
- Nothing removed

## Implementation Plan

1. Create `src/frontend/src/components/WafSimulationModal.tsx`:
   - Full-screen dark overlay modal with close button
   - Canvas area with three animated "browser window" boxes: Attacker (red), Main Site (blue/white), Clone Site (green)
   - Animated flying packets using CSS keyframe animations (translate + fade)
   - WAF Shield SVG element that appears in Phase 2+
   - Phase state machine: currentPhase (1|2|3), auto-advance timer, manual NEXT button
   - Matrix code rain as canvas background
   - Phase description text area with typewriter effect
   - Auto-loop: after Phase 3 → pause 1.5s → reset to Phase 1

2. Update `WafPage.tsx`:
   - Add `useState` for `showSimulation` boolean
   - Add "VIEW ATTACK SIMULATION" button at top of page (below the header/toggle bar)
   - Import and render `<WafSimulationModal>` with open/close handler

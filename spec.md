# SQLi Combo Security Tool — Zoom-to-Location Feature

## Current State
LiveAttackMapPage.tsx has a fully functional 3D globe (Three.js/R3F) with:
- OrbitControls for free rotate/zoom
- AttackNode components that accept an onClick handler which sets `selectedEvent` state
- A `selectedEvent` bottom overlay panel showing IP, location, type, time, severity, block button
- `isAutoRotating` state that disables auto-spin on pointerdown
- Camera starts at position [0, 0, 2.8]
- GlobeScene receives `onSelectEvent` callback

## Requested Changes (Diff)

### Add
- **Zoom camera animation**: When a node is clicked, smoothly animate the Three.js camera to orbit/zoom to that lat/lon at a closer distance (~1.8 units), rotating the globe so the point faces the camera center
- **easeInOut interpolation**: Use a lerp with easeInOut curve over ~1.5s using requestAnimationFrame (via useFrame)
- **Selected node highlight**: A persistent large pulsing ring/glow on the currently selected attack node (distinct from the "recent" pulse used on latest 5 events)
- **Details side panel**: Replace the current bottom overlay with a side panel (right column, above event feed) that shows full attack details when zoomed in — IP, city/country, attack type, timestamp, severity, block button, coordinates
- **Reset View button**: Prominent "← BACK TO GLOBAL" button in the globe area when zoomed, that animates camera back to default position [0, 0, 2.8]
- **Mini-map indicator**: Small overlay in bottom-right of globe showing a flat mini globe with a dot indicating the zoomed region
- **Multi-click support**: Clicking a different node while already zoomed smoothly transitions camera to the new target

### Modify
- `GlobeScene`: Accept `selectedEvent` prop and `cameraTarget` prop; pass selected event id down to AttackNode for highlight rendering
- `AttackNode`: Accept `isSelected` boolean prop; render a larger, persistent pulsing ring when selected
- Main page: Replace bottom overlay panel logic with side panel (inject into right sidebar column above event feed)
- `OrbitControls`: Disable when camera animation is active; re-enable after animation settles
- `isAutoRotating`: Force to false when a node is selected/zoomed

### Remove
- Bottom overlay `selectedEvent` panel (replaced by right-side details panel in the sidebar)

## Implementation Plan
1. Add `cameraTarget` state: `{ lat, lon, zoom: boolean } | null` to main page
2. Add `cameraAnimRef` ref tracking animation progress (start position, end position, t=0→1)
3. Create `CameraAnimator` component using `useFrame` that:
   - Reads current camera position and target
   - On each frame interpolates toward target using easeInOut
   - Converts lat/lon to a camera position vector (distance 1.9 from origin, pointing at that point)
   - Temporarily disables OrbitControls during animation (use ref to controls)
   - Fires `onAnimationComplete` callback when t >= 1
4. Modify `AttackNode` to accept and render `isSelected` highlight (bright ring + glow halo, not fading)
5. Replace bottom overlay with a collapsible details panel injected at top of the right sidebar
6. Add "← BACK TO GLOBAL" button overlay on globe canvas (bottom-left, above controls hint)
7. Add mini-map: small `<Canvas>` or SVG overlay (bottom-right of globe) showing a 2D projection circle with a dot at the zoomed lat/lon
8. All animations use requestAnimationFrame via R3F useFrame — no setInterval or setTimeout

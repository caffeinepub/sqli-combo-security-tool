# SQLi Combo Security Tool

## Current State
The Live Attack Map page (`src/frontend/src/pages/LiveAttackMapPage.tsx`) renders a 3D globe using Three.js/React Three Fiber. The globe is a procedural sphere with a canvas texture that has very vague landmass hints and grid lines. Attack events appear as glowing dots at accurate lat/lon positions for 30 Indian cities. There is no India country boundary, no country label, and no city name labels visible on the globe itself.

## Requested Changes (Diff)

### Add
- **India country boundary** drawn on the globe surface as a glowing green outline polygon (approximate SVG/GeoJSON-based boundary path projected onto the sphere). The boundary should be a visible outline that clearly delineates India on the globe.
- **"INDIA" country label** rendered at the center of India on the globe (approximately lat 20, lon 80) as a 3D text or HTML overlay positioned at the correct sphere position.
- **City name labels** for all 30 cities in `CITY_COORDS` rendered as small text labels next to each city dot — visible on the globe surface. Labels should only appear for cities that have attack events OR as a persistent layer showing all Indian city names.
- City labels should be compact (9-10px font mono, cyber-cyan color) and not overlap each other badly. They should appear as floating text near each city's lat/lon position on the globe.

### Modify
- `GlobeMesh` canvas texture: enhance the India region to be more visually distinct — a slightly brighter blue-green tinted landmass area in the South Asia region (roughly lon 68–98, lat 8–37).
- The globe's procedural texture should more clearly show India as a distinct territory.
- Attack dots should remain on top of/consistent with the new boundary and labels.

### Remove
- Nothing removed.

## Implementation Plan
1. Add an `IndiaOutline` Three.js component that draws India's approximate boundary as a `THREE.Line` or `THREE.LineLoop` on the globe surface using lat/lon projected to 3D. Use ~20-30 key border points approximating India's coastline and land border.
2. Add an `IndiaLabel` component using `<Html>` from `@react-three/drei` positioned at lat 20, lon 78 (center of India) showing "INDIA" in a glowing green cyberpunk font.
3. Add a `CityLabel` component using `<Html>` from `@react-three/drei` for each city in `CITY_COORDS`, rendering the city name as a small floating label positioned at that city's 3D sphere position. Show all 30 cities always (not just cities with events).
4. Update `GlobeMesh` canvas texture to paint a more visible India-region tinted area.
5. Integrate `IndiaOutline`, `IndiaLabel`, and city labels into `GlobeScene`.
6. Ensure labels/HTML overlays have `pointerEvents: none` to not interfere with OrbitControls interaction.

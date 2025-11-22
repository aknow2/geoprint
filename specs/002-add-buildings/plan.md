# Implementation Plan: Add Buildings

**Branch**: `002-add-buildings` | **Date**: 2025-11-21 | **Spec**: [specs/002-add-buildings/spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-add-buildings/spec.md`

## Summary

Fetch building vector tiles from MapTiler, parse the `building` layer, and generate 3D extruded meshes. Place these buildings on the existing terrain by looking up elevation data from the heightmap grid. Ensure buildings extend downwards ("basements") to intersect the terrain for watertight 3D printing. Update the STL exporter to include these buildings.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React 18, Three.js (r160+), MapTiler Cloud
**Storage**: In-memory (Three.js Scene)
**Testing**: Vitest (Unit tests for parsers)
**Target Platform**: Web (Modern Browsers)
**Project Type**: Single Page Application (Vite)
**Performance Goals**: Render ~1000 buildings @ 60fps.
**Constraints**: Client-side processing only.

## Constitution Check

*GATE: Passed.*
- **No Breaking Changes**: Adds to existing scene.
- **Performance**: Uses simple geometry and shared materials.
- **Maintainability**: Separates building logic into `geometryGenerator` and `tileService`.

## Project Structure

### Documentation (this feature)

```text
specs/002-add-buildings/
├── plan.md              # This file
├── research.md          # Research findings
├── data-model.md        # Data structures
└── spec.md              # Feature specification
```

### Source Code (repository root)

```text
src/
├── components/
│   └── Scene3D.tsx          # Update: Render buildings
├── services/
│   └── tileService.ts       # Update: Fetch building layer
├── utils/
│   ├── geometryGenerator.ts # Update: Generate building meshes
│   └── tileParser.ts        # Update: Parse building features
└── types/
    └── index.ts             # Update: Add Building types
```

**Structure Decision**: Extend existing `src/` structure.

## Implementation Steps

### Phase 1: Data Fetching & Parsing
1.  **Update `tileService.ts`**:
    -   Modify `fetchTiles` (or create `fetchBuildingTiles`) to request vector tiles (PBF) if not already handled, or ensure the existing fetcher includes the `building` layer.
    -   *Note*: MapTiler standard tiles usually include buildings.
2.  **Update `tileParser.ts`**:
    -   Add `parseBuildings(pbfData)` function.
    -   Extract features from `building` layer.
    -   Filter by bounds.
    -   Read properties: `render_height`, `render_min_height`.
    -   Convert geometry to local coordinates (relative to center).

### Phase 2: Geometry Generation
1.  **Update `geometryGenerator.ts`**:
    -   Add `createBuildingGeometries(buildings, terrainData)`.
    -   For each building:
        -   Create `THREE.Shape` from polygon coordinates.
        -   Calculate centroid.
        -   **Grid Lookup**: Find elevation at centroid using `terrainData`.
        -   **Extrude**: Use `THREE.ExtrudeGeometry` with `depth: height`.
        -   **Placement**: Set Z position (or Y) to `elevation - basementDepth`.
        -   **Basement**: Add extra depth to extrusion or shift down to ensure intersection.

### Phase 3: Scene Integration
1.  **Update `Scene3D.tsx`**:
    -   Call `createBuildingGeometries` after terrain is loaded.
    -   Add buildings to a `THREE.Group` named `buildingsGroup`.
    -   Add `buildingsGroup` to the main scene.
    -   Implement "Toggle Buildings" state/UI.

### Phase 4: Export & Polish
1.  **Update Export Logic**:
    -   Ensure `STLExporter` receives a group containing both `terrainMesh` and `buildingsGroup`.
2.  **UI**:
    -   Add a checkbox "Show Buildings" in the sidebar.

## Verification Plan

### Automated Tests
-   `tileParser.test.ts`: Verify parsing of mock PBF building data.
-   `geometryGenerator.test.ts`: Verify correct height and position calculation.

### Manual Verification
1.  **Visual Check**: Buildings appear on map.
2.  **Placement Check**: Buildings sit ON the terrain, not floating or buried too deep (except basements).
3.  **Export Check**: Download STL, open in Slicer (Cura/Prusa), verify it is a single solid object (or intersecting solids) and printable.

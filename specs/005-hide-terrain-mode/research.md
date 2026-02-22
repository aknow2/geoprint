# Research: Hide Terrain Mode

**Feature**: Hide Terrain Mode
**Status**: Complete

## Unknowns & Clarifications

### 1. Water Feature Positioning
- **Question**: How to position water features on a flat base?
- **Resolution**: Spec says "Flat at Z=0 (coplanar with the base surface)".
- **Implementation**: Water features will be generated at `Z = baseHeight`. To avoid Z-fighting in the 3D viewer, we might need a tiny offset (e.g., +0.01m) or rely on the renderer. For STL export, coplanar is fine (merged).

### 2. Road & GPX Positioning
- **Question**: How to ensure visibility?
- **Resolution**:
  - Roads: Slightly raised (+0.1mm ~ +0.1m in model units).
  - GPX: Slightly raised (+0.2mm ~ +0.2m in model units).
- **Implementation**:
  - Roads: `Z = baseHeight + 0.1`
  - GPX: `Z = baseHeight + 0.2`

## Technology Decisions

### 1. Geometry Generation
- **Decision**: Modify `generateTerrainGeometry` in `src/utils/geometryGenerator.ts`.
- **Rationale**: Reusing the existing function allows us to keep the grid structure (`userData.grid`) which is essential for placing buildings and roads. Creating a separate function would require duplicating the grid setup logic.
- **Approach**:
  - Add `hideTerrain` (boolean) to options.
  - If `true`, skip elevation interpolation and set all `elevations` to `baseHeight`.
  - Ensure `minElevation` is handled correctly (effectively 0 relative to base).

### 2. State Management
- **Decision**: Add `hideTerrain` state to `App.tsx`.
- **Rationale**: Simple boolean toggle.
- **Persistence**: Spec mentions "persist... during the session". React state does this automatically for the session.

## Alternatives Considered

### Separate "FlatGeometry" Generator
- **Pros**: Cleaner separation.
- **Cons**: Need to duplicate logic for generating the grid data structure used by feature placers.
- **Verdict**: Rejected. Modifying existing function is more maintainable.

### CSS/Shader Hiding
- **Pros**: Fast.
- **Cons**: Doesn't change the geometry for export. We need the STL to be flat.
- **Verdict**: Rejected. We need actual geometry changes.

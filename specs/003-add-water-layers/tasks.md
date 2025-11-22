# Tasks: Add Water Layers

**Feature**: Add Water Layers
**Status**: Pending
**Spec**: [specs/003-add-water-layers/spec.md](./spec.md)

## Phase 1: Setup
**Goal**: Prepare data structures.

- [x] T001 Define `WaterFeature` and `WaterFeatureType` interfaces in `src/types/index.ts`

## Phase 2: User Story 1 - View Water Features
**Goal**: Fetch, parse, and render water bodies (rivers, lakes) on the terrain.
**Priority**: P1

- [x] T002 [US1] Update `src/services/tileService.ts` to fetch `water` and `waterway` layers in `fetchVectorTiles`
- [x] T003 [US1] Update `src/utils/tileParser.ts` to implement `parseWaterFeatures` for both LineString (rivers) and Polygon (lakes)
- [x] T004 [US1] Update `src/utils/geometryGenerator.ts` to implement `createWaterGeometries` (TubeGeometry for lines, ExtrudeGeometry for polygons)
- [x] T005 [US1] Update `src/App.tsx` to fetch water tiles and parse water features into state
- [x] T006 [US1] Update `src/App.tsx` to generate water geometry using `createWaterGeometries`
- [x] T007 [US1] Update `src/components/Scene3D.tsx` to accept and render `waterGroup` prop

## Phase 3: User Story 2 - Toggle Water Visibility
**Goal**: Allow users to show/hide water features.
**Priority**: P2

- [x] T008 [US2] Add `showWater` state and checkbox UI in `src/App.tsx`
- [x] T009 [US2] Update `src/App.tsx` to conditionally pass `waterGroup` to `Scene3D` based on `showWater` state

## Phase 4: User Story 3 - Export Water to STL
**Goal**: Include water features in the downloaded STL file.
**Priority**: P2

- [x] T010 [US3] Update `handleDownload` in `src/App.tsx` to include `waterGroup` in the exported STL if visible

## Phase 5: Polish & Cross-Cutting Concerns
**Goal**: Ensure visual distinction and quality.

- [x] T011 Verify and tune water colors (Blue) and offsets (+0.2m) to distinguish from roads in `src/utils/geometryGenerator.ts` and `src/components/Scene3D.tsx`

## Dependencies

1.  **US1 (View)**: Depends on Phase 1 (Types).
2.  **US2 (Toggle)**: Depends on US1 (Rendering).
3.  **US3 (Export)**: Depends on US1 (Geometry generation).

## Parallel Execution Examples

- **US1**: `tileService.ts` (T002) and `geometryGenerator.ts` (T004) can be implemented in parallel once types (T001) are defined.
- **US1**: `tileParser.ts` (T003) depends on the data structure from `tileService.ts` but can be mocked.

## Implementation Strategy

1.  **Data First**: Ensure we can fetch and see the raw water data in the console.
2.  **Geometry Second**: Implement the mesh generation (start with simple lines for rivers).
3.  **Integration**: Connect it all in `App.tsx` and `Scene3D`.
4.  **Refinement**: Tune the visual properties (width, color, height) to ensure they look good against the terrain and roads.

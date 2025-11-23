# Tasks: Import GPX

**Feature**: Import GPX
**Status**: Pending
**Spec**: [specs/004-import-gpx/spec.md](./spec.md)

## Phase 1: Setup
**Goal**: Define data structures.

- [x] T001 Define `GpxTrack` and `GpxPoint` interfaces in `src/types/index.ts`

## Phase 2: User Story 1 - Visualize GPX on 2D Map
**Goal**: Upload and see the track on the map.
**Priority**: P1

- [x] T002 [US1] Create `src/utils/gpxParser.ts` to parse GPX files into `GpxTrack`
- [x] T002a [US1] Create unit tests for `src/utils/gpxParser.ts`
- [x] T003 [US1] Update `src/components/MapSelector.tsx` to add file upload UI
- [x] T004 [US1] Update `src/components/MapSelector.tsx` to render GPX track on map using Leaflet Polyline
- [x] T005 [US1] Update `src/components/MapSelector.tsx` to auto-center map on track load

## Phase 3: User Story 2 - Generate 3D Pipeline from GPX
**Goal**: Generate physical 3D model.
**Priority**: P1

- [x] T006 [US2] Update `src/App.tsx` to manage `gpxTrack` state and pass to `Scene3D` and generator
- [x] T007 [US2] Update `src/utils/geometryGenerator.ts` to implement `createGpxGeometries` (TubeGeometry)
- [x] T007a [US2] Create unit tests for `src/utils/geometryGenerator.ts` (clipping and coordinate conversion)
- [x] T008 [US2] Update `src/utils/geometryGenerator.ts` to implement Solid Wall support (Extrude/BufferGeometry)
- [x] T009 [US2] Update `src/App.tsx` to add "GPX Tube Radius" slider UI
- [x] T010 [US2] Update `src/components/Scene3D.tsx` to render `gpxGroup`
- [x] T011 [US2] Update `src/App.tsx` to include `gpxGroup` in STL export logic

## Dependencies

1.  **US2 (3D)**: Depends on US1 (Data loading).
2.  **T007/T008**: Depend on T001 (Types).

## Parallel Execution Examples

- **US1**: `gpxParser.ts` (T002) can be developed independently of the UI (T003).
- **US2**: `geometryGenerator.ts` (T007) can be developed using mock data while `App.tsx` (T006) is being updated.


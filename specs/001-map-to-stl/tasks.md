# Tasks: Generate 3D Terraced Terrain STL

**Feature**: Generate 3D Terraced Terrain STL
**Status**: Pending
**Spec**: [specs/001-map-to-stl/spec.md](./spec.md)

## Phase 1: Setup
**Goal**: Initialize project structure and install dependencies.

- [x] T001 Initialize Vite project with React and TypeScript in `.`
- [x] T002 Install dependencies (`three`, `maptiler-sdk`, `@mapbox/vector-tile`, `pbf`, `@tanstack/react-query`, `three-stdlib`)
- [x] T003 Install dev dependencies (`vitest`, `jsdom`, `@testing-library/react`, `@types/three`, `@types/mapbox__vector-tile`, `@types/pbf`)
- [x] T004 Configure Vitest in `vite.config.ts` and `vitest.setup.ts`
- [x] T005 Create project directory structure (`src/components`, `src/services`, `src/utils`, `src/hooks`, `src/types`)

## Phase 2: Foundational
**Goal**: Establish core application layout and configuration.

- [x] T006 Create `src/config.ts` for MapTiler API key management (reading from env and localStorage)
- [x] T007 Create `src/types/index.ts` for shared type definitions (BoundingBox, GeoJSON types)
- [x] T008 Create `src/App.tsx` with basic layout shell (Header, Main, Footer)
- [x] T009 Create `src/components/Scene3D.tsx` with basic Three.js Canvas setup
- [x] T009b Create `src/components/ApiKeyInput.tsx` modal to allow users to enter their own API key

## Phase 3: User Story 1 - Select Terrain Area
**Goal**: Enable user to select a rectangular area on the map.
**Priority**: P1

- [x] T010 [US1] Create `src/components/MapSelector.tsx` using `maptiler-sdk`
- [x] T011 [US1] Implement state management for selected area in `src/hooks/useSelection.ts`
- [x] T012 [US1] Implement rectangular selection interaction in `src/components/MapSelector.tsx`
- [x] T013 [US1] Display selected bounding box coordinates in `src/App.tsx`

## Phase 4: User Story 2 - Generate Terraced 3D Model
**Goal**: Fetch data and render 3D terraced mesh.
**Priority**: P1

- [x] T014 [US2] Create `src/services/tileService.ts` to fetch vector tiles from MapTiler
- [x] T015 [US2] Create `src/utils/tileParser.ts` to decode PBF and extract contour polygons
- [x] T016 [US2] Create `src/utils/geometryGenerator.ts` to convert polygons to Three.js ExtrudeGeometry
- [x] T017 [US2] Integrate generation logic into `src/components/Scene3D.tsx` to render mesh
- [x] T018 [US2] Add "Generate" button and loading state handling in `src/App.tsx`

## Phase 5: User Story 3 - Download STL File
**Goal**: Export the generated model as STL.
**Priority**: P1

- [x] T019 [US3] Create `src/utils/stlExporter.ts` using `three-stdlib` STLExporter
- [x] T020 [US3] Implement download handler in `src/App.tsx`
- [x] T021 [US3] Add "Download STL" button to UI in `src/App.tsx`

## Phase 6: Polish & Cross-Cutting Concerns
**Goal**: Finalize UX and handle edge cases.

- [x] T022 Add error handling for network failures and invalid selections in `src/App.tsx`
- [x] T023 Implement polygon count check/warning in `src/utils/geometryGenerator.ts`
- [x] T024 Optimize mobile responsiveness for map and canvas in `src/index.css`

## Dependencies

1. **US1 (Selection)**: Depends on Foundational (MapTiler setup).
2. **US2 (Generation)**: Depends on US1 (needs bounding box).
3. **US3 (Download)**: Depends on US2 (needs generated mesh).

## Parallel Execution Examples

- **US1**: `MapSelector.tsx` (T010) and `useSelection.ts` (T011) can be developed in parallel.
- **US2**: `tileService.ts` (T014) and `geometryGenerator.ts` (T016) can be developed independently if data structures are agreed upon.

## Implementation Strategy

1. **MVP Core**: Focus on getting a hardcoded tile to render in 3D first (US2 proof of concept) if unsure about data format, but strictly following stories: US1 -> US2 -> US3 is safest.
2. **Incremental Delivery**:
   - Deliver Map Selection (US1).
   - Deliver 3D Rendering (US2).
   - Deliver Export (US3).

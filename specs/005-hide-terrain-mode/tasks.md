# Tasks: Hide Terrain Mode

**Input**: Design documents from `/specs/005-hide-terrain-mode/`
**Prerequisites**: plan.md, spec.md

**Tests**: Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Update `generateTerrainGeometry` signature in `src/utils/geometryGenerator.ts` to accept `hideTerrain` option

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T002 [P] Update `generateTerrainGeometry` in `src/utils/geometryGenerator.ts` to store `hideTerrain` flag in `geometry.userData` for downstream consumers

---

## Phase 3: User Story 1 - Toggle Hide Terrain Mode (Priority: P1) 🎯 MVP

**Goal**: Allow users to switch between terrain and flat base mode.

**Independent Test**: Toggle "Hide Terrain" checkbox in UI and verify 3D scene updates to a flat plane.

### Implementation for User Story 1

- [x] T003 [US1] Update `App.tsx` to add `hideTerrain` state variable and `setHideTerrain`
- [x] T004 [US1] Update `App.tsx` to add "Hide Terrain" checkbox in the Terrain settings section
- [x] T005 [US1] Update `generateTerrainGeometry` in `src/utils/geometryGenerator.ts` to implement flat mesh generation logic when `hideTerrain` is true (set all elevations to `baseHeight`)
- [x] T006 [US1] Update `App.tsx` to pass `hideTerrain` state to `generateTerrainGeometry` call

**Checkpoint**: User can toggle flat mode. Terrain becomes flat.

---

## Phase 4: User Story 2 - Adjust Flat Base Thickness (Priority: P2)

**Goal**: Control base thickness and hide irrelevant controls in flat mode.

**Independent Test**: Enable "Hide Terrain", adjust "Base Height" slider, verify thickness changes. Verify other controls are hidden.

### Implementation for User Story 2

- [x] T007 [US2] Update `App.tsx` to conditionally render/disable "Vertical Scale", "Smoothing", and "Max Height" controls when `hideTerrain` is true

**Checkpoint**: UI adapts to flat mode.

---

## Phase 5: User Story 3 - Flat Positioning of Features (Priority: P2)

**Goal**: Ensure buildings, roads, and GPX tracks are correctly positioned on the flat base.

**Independent Test**: Enable "Hide Terrain", load buildings/roads/GPX, verify they sit correctly on the surface without Z-fighting.

### Implementation for User Story 3

- [x] T008 [US3] Update `createRoadGeometries` in `src/utils/geometryGenerator.ts` to check `userData.hideTerrain` and use +0.1 offset for roads
- [x] T009 [US3] Update `createGpxGeometries` in `src/utils/geometryGenerator.ts` to check `userData.hideTerrain` and use +0.2 offset for GPX tracks
- [x] T010 [US3] Update `createWaterGeometries` in `src/utils/geometryGenerator.ts` to check `userData.hideTerrain` and ensure water is flat at Z=baseHeight
- [x] T011 [US3] Update `createBuildingGeometries` in `src/utils/geometryGenerator.ts` to verify building placement logic works with flat terrain (should work automatically if grid is flat, but verify/adjust if needed)

**Checkpoint**: All features render correctly in flat mode.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T012 [P] Verify persistence of `hideTerrain` state (React state handles session, no extra work needed but verify)
- [x] T013 Run manual validation of all scenarios in `quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup.
- **User Story 1 (P1)**: Depends on Foundational.
- **User Story 2 (P2)**: Depends on US1 (needs state).
- **User Story 3 (P2)**: Depends on US1 (needs flat geometry).

### Parallel Opportunities

- T008, T009, T010 (Feature positioning) can be implemented in parallel once US1 is done.

---

## Implementation Strategy

### MVP First (User Story 1)

1. Implement T001-T006.
2. Validate flat terrain generation.

### Incremental Delivery

1. Add UI refinements (US2).
2. Fix feature offsets (US3).

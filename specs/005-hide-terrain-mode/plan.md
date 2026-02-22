# Implementation Plan: Hide Terrain Mode

**Branch**: `005-hide-terrain-mode` | **Date**: 2025-11-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-hide-terrain-mode/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement a "Hide Terrain" mode that replaces the 3D elevation model with a flat base mesh. This involves adding a toggle in the UI, updating the geometry generation logic to produce a flat mesh when enabled, and ensuring all overlay features (buildings, roads, GPX tracks) are correctly positioned on this flat surface.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18+
**Primary Dependencies**: Three.js (via `three` package), React
**Storage**: Client-side state (React `useState`)
**Testing**: Manual verification via 3D view
**Target Platform**: Web Browser (Chrome/Firefox/Safari)
**Project Type**: Single Page Application (Vite)
**Performance Goals**: Instant toggle (<1s), smooth rendering (60fps)
**Constraints**: Client-side only, no backend.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **MVP First**: Feature is a direct enhancement to the core printing workflow (flat prints are a common use case).
- [x] **Component-Based Architecture**: Logic will be encapsulated in `geometryGenerator.ts` and controlled via `App.tsx` state.
- [x] **Testability**: Geometry generation is a pure function (mostly) and can be tested.
- [x] **Client-Side Only**: No backend required.

## Project Structure

### Documentation (this feature)

```text
specs/005-hide-terrain-mode/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A)
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
src/
├── components/
│   └── Scene3D.tsx      # Visualization
├── utils/
│   └── geometryGenerator.ts # Core logic for terrain generation
├── App.tsx              # State management and UI
└── types/
    └── index.ts         # Type definitions
```

**Structure Decision**: Standard React/Vite structure.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

# Implementation Plan: Generate 3D Terraced Terrain STL

**Branch**: `001-map-to-stl` | **Date**: 2025-11-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-map-to-stl/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

The "Generate 3D Terraced Terrain STL" feature allows users to select a rectangular area on a map, fetch contour vector tiles from MapTiler, generate a 3D terraced mesh in the browser, and download it as an STL file. This is a frontend-only MVP using React, MapTiler SDK, and three.js.

## Technical Context

**Language/Version**: TypeScript 5.x (React 18)
**Primary Dependencies**: 
- React 18, ReactDOM 18
- three.js, @types/three
- maptiler-sdk
- @mapbox/vector-tile, pbf
- @tanstack/react-query
- three-stdlib (for STLExporter)
**Storage**: N/A (Client-side only)
**Testing**: Vitest (Unit), Playwright (E2E)
**Target Platform**: Modern Web Browsers (Desktop/Mobile)
**Project Type**: Web (Frontend Only)
**Performance Goals**: < 30s generation, < 1M polygons
**Constraints**: MapTiler Free Tier limits, Browser memory
**Scale/Scope**: Single Page Application (SPA)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Frontend Only**: Compliant. No backend services required.
- **MVP Scope**: Compliant. Focused on single core workflow.
- **Testability**: Compliant. Logic (parsing, generation) separated from UI.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/          # React UI components
├── hooks/               # Custom React hooks
├── services/            # API interaction (MapTiler)
├── utils/               # Helper functions (Geometry, Parsing)
├── types/               # TypeScript definitions
├── App.tsx              # Main application entry
└── main.tsx             # DOM rendering
```

**Structure Decision**: Selected Option 1 (Single Project) as this is a standalone frontend MVP built with Vite. The structure follows standard React patterns.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

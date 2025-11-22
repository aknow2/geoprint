# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature adds water layers (rivers, lakes, oceans) to the 3D terrain model. It involves fetching `water` and `waterway` layers from MapTiler, parsing them into `WaterFeature` entities, generating appropriate 3D geometries (polygons for lakes, tubes for rivers), and rendering them in the scene. Users can toggle visibility, and visible water features will be included in the STL export.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18+
**Primary Dependencies**: `three`, `@maptiler/sdk`, `@mapbox/vector-tile`, `pbf`
**Storage**: N/A (Client-side only)
**Testing**: Vitest
**Target Platform**: Web (Browser)
**Project Type**: Web application
**Performance Goals**: Render water features within 2 seconds.
**Constraints**: Client-side only.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **MVP First**: Enhances core value (map context) without excessive scope.
- **Component-Based**: Uses existing patterns.
- **Testability**: Parsing logic is testable.
- **Client-Side Only**: Adhered to.

## Project Structure

### Documentation (this feature)

```text
specs/003-add-water-layers/
├── plan.md              # This file
├── research.md          # MapTiler schema research
├── data-model.md        # WaterFeature entity and mapping
└── tasks.md             # Implementation tasks
```

### Source Code (repository root)

```text
src/
├── types/
│   └── index.ts         # Add WaterFeature type
├── services/
│   └── tileService.ts   # Fetch water/waterway layers
├── utils/
│   ├── tileParser.ts    # Parse water features
│   ├── geometryGenerator.ts # Generate water meshes
│   └── stlExporter.ts   # (No change needed if Group passed correctly, but verify)
├── components/
│   └── Scene3D.tsx      # Render water group
└── App.tsx              # State management and UI toggle
```

**Structure Decision**: Standard React/Vite structure.

## Complexity Tracking

N/A

## Phases

### Phase 0: Outline & Research

1.  **Research MapTiler Schema**: Identify layers and attributes for water. (Done - see `research.md`)
    -   `water` layer: Polygons (lakes, oceans).
    -   `waterway` layer: Lines (rivers, streams).

### Phase 1: Design & Contracts

1.  **Data Model**: Define `WaterFeature` interface. (Done - see `data-model.md`)
2.  **Contracts**: Internal TypeScript interfaces.

### Phase 2: Implementation

1.  **Types**: Update `src/types/index.ts` with `WaterFeature`.
2.  **Service**: Update `src/services/tileService.ts` to include `water` and `waterway` in `fetchVectorTiles` (or a new function).
3.  **Parser**: Update `src/utils/tileParser.ts` to extract water features.
4.  **Geometry**: Update `src/utils/geometryGenerator.ts` to implement `createWaterGeometries`.
    -   Handle Polygons (Extrude).
    -   Handle Lines (Tube).
5.  **Component**: Update `src/components/Scene3D.tsx` to accept and render `waterGroup`.
6.  **Integration**: Update `src/App.tsx` to:
    -   Fetch and parse water data.
    -   Generate water geometry.
    -   Add "Show Water" toggle.
    -   Pass water group to `Scene3D` and `exportToSTL`.


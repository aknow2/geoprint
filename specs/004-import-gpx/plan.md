# Implementation Plan - Import GPX

## User Story 1: Visualize GPX on 2D Map

- [ ] **Task 1.1**: Add GPX File Upload UI
    - **File**: `src/components/MapSelector.tsx` (or new component `GpxUploader.tsx`)
    - **Description**: Add a file input that accepts `.gpx` files.
- [ ] **Task 1.2**: Implement GPX Parsing Logic
    - **File**: `src/utils/gpxParser.ts` (New File)
    - **Description**: Create a utility to parse GPX XML and extract `[lat, lon, ele]` points. Handle multiple `<trkseg>`.
- [ ] **Task 1.3**: Render GPX Track on Map
    - **File**: `src/components/MapSelector.tsx`
    - **Description**: Use the parsed coordinates to draw a Polyline on the Leaflet map.
- [ ] **Task 1.4**: Auto-center Map
    - **File**: `src/components/MapSelector.tsx`
    - **Description**: Update map view state to center on the first point of the uploaded GPX track.

## User Story 2: Generate 3D Pipeline from GPX

- [ ] **Task 2.1**: Pass GPX Data to Scene
    - **File**: `src/App.tsx`
    - **Description**: Lift GPX state from `MapSelector` to `App` and pass it to `Scene3D` / `geometryGenerator`.
- [ ] **Task 2.2**: Implement 3D Tube Generation
    - **File**: `src/utils/geometryGenerator.ts`
    - **Description**: Implement `createGpxGeometries` function.
        - Convert lat/lon to project space (meters relative to center).
        - Handle elevation (GPX ele vs Terrain height + offset).
        - Generate `TubeGeometry`.
        - **Constraint**: Clip points outside bounds.
        - **Constraint**: Handle multiple segments.
- [ ] **Task 2.3**: Implement Solid Wall Support
    - **File**: `src/utils/geometryGenerator.ts`
    - **Description**: Generate a mesh (e.g., `ExtrudeGeometry` or custom `BufferGeometry`) that fills the space between the tube and the terrain surface (z=terrain_height).
- [ ] **Task 2.4**: Add Radius Slider
    - **File**: `src/App.tsx`
    - **Description**: Add a slider for "GPX Tube Radius" and pass the value to the generator.
- [ ] **Task 2.5**: Integrate into Scene
    - **File**: `src/components/Scene3D.tsx`
    - **Description**: Render the generated GPX group in the scene.

## Verification Plan

### Automated Tests
- Unit test for `gpxParser.ts` (mock XML input).
- Unit test for `geometryGenerator.ts` (verify coordinate conversion and clipping logic).

### Manual Verification
1. Upload `sample.gpx`.
2. Verify map centers on track.
3. Select area around track.
4. Click "Generate".
5. Verify 3D tube appears with wall support.
6. Adjust radius slider and verify update.

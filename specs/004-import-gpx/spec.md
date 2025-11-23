# Feature Specification: Import GPX

**Feature Branch**: `004-import-gpx`
**Created**: 2025-11-22
**Status**: Draft
**Input**: User description: "GPXファイルの読み込み対応したいです。1. GPXファイルを読み込んだら、GPXファイルの最初の位置に地図を移動する 2. GPSで表示されたルートを地図上に表示する 3. GPXを読み込んだ状態でSelect Area -> generate 3d modelをした場合、GP Sデータを３Dmodelに反映させる 4. GPS情報は浮き上がったパイプラインのように表示させる。地面からの高さも考慮すること"

## User Scenarios & Testing

### User Story 1 - Visualize GPX on 2D Map (Priority: P1)

The user wants to verify their GPX data on the map before generating a 3D model.

**Why this priority**: Essential for the user to confirm they have loaded the correct file and to locate the area of interest.

**Independent Test**: Can be tested by uploading a file and observing the map behavior without generating any 3D geometry.

**Acceptance Scenarios**:

1. **Given** the application is loaded, **When** the user uploads a valid GPX file, **Then** the map view centers on the starting point of the GPX track.
2. **Given** a GPX file is loaded, **When** the map updates, **Then** a polyline representing the GPS route is drawn on the 2D map.

---

### User Story 2 - Generate 3D Pipeline from GPX (Priority: P1)

The user wants to see their path as a physical object in the 3D model, likely for 3D printing or visualization.

**Why this priority**: This is the core value proposition of the feature request (3D visualization).

**Independent Test**: Can be tested by generating a model with a loaded GPX file and inspecting the 3D scene.

**Acceptance Scenarios**:

1. **Given** a GPX file is loaded and an area covering the track is selected, **When** the user clicks "Generate 3D Model", **Then** the 3D scene includes a tube/pipeline geometry following the GPS track.
2. **Given** the 3D pipeline is generated, **When** inspecting the model, **Then** the pipeline appears "floating" or raised above the terrain surface (considering ground height).

### Edge Cases

- **Invalid File**: What happens if the user uploads a non-GPX file or a malformed GPX? (Should show error message).
- **Track Outside Selection**: What happens if the GPX track is completely outside the selected map area? (Should probably ignore or warn, but for now, just not rendering it is acceptable).
- **No Elevation Data**: What happens if the GPX file has no elevation data? (Should fallback to terrain height + offset).

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide a UI mechanism to upload a `.gpx` file.
- **FR-002**: System MUST parse the uploaded GPX file to extract track points (latitude, longitude, elevation).
- **FR-003**: System MUST automatically pan/zoom the 2D map to the start of the track upon successful loading.
- **FR-004**: System MUST render the parsed GPX track as a visible line on the 2D map.
- **FR-005**: System MUST pass the parsed GPX data to the geometry generator when "Generate 3D Model" is triggered.
- **FR-006**: System MUST generate a 3D tube-like geometry for the GPX track.
    - *Constraint*: If the GPX file contains multiple track segments (`<trkseg>`), each segment MUST be rendered as a separate, disconnected tube. Do not interpolate lines between segments.
- **FR-007**: The 3D tube MUST be positioned according to the latitude/longitude of the track points relative to the terrain bounds.
    - *Constraint*: Points outside the selected bounding box MUST be clipped or excluded so the tube does not extend beyond the terrain mesh.
- FR-008: The 3D tube MUST be rendered using the GPX elevation data, but MUST enforce a minimum clearance (5.0m) above the terrain surface to prevent intersection.
    - *Constraint*: If GPX elevation is missing, fallback to Terrain Height + Fixed Offset.
- **FR-009**: System MUST provide a UI slider to adjust the radius (thickness) of the 3D tube (Range: 0.5m to 5.0m, Default: 1.0m).
- **FR-010**: The 3D tube geometry MUST update dynamically when the radius slider is changed.
- **FR-011**: System MUST generate a vertical "curtain" or wall geometry connecting the underside of the GPX tube to the terrain surface to ensure printability (Solid Wall support).

### Key Entities

- **GPX Track**: A collection of ordered waypoints/trackpoints, each containing latitude, longitude, and optional elevation.

## Success Criteria

### Measurable Outcomes

- **SC-001**: User can upload a standard GPX file and see the route on the 2D map within 2 seconds.
- **SC-002**: The map automatically moves to the correct location 100% of the time upon load.
- **SC-003**: The generated 3D model contains a continuous tube geometry representing the full length of the track within the selected bounds.
- **SC-004**: The 3D tube is visually distinct from the terrain (does not intersect/bury into the ground unexpectedly).

## Clarifications

### Session 2025-11-22
- Q: How should the 3D pipeline elevation be determined? → A: Hybrid - Use GPX elevation, but force a minimum height above terrain if it gets too close.
- Q: How should multiple track segments (e.g., pauses in recording) be handled? → A: Separate Tubes - Render each track segment as a distinct, disconnected tube geometry.
- Q: How should the tube thickness (radius) be handled? → A: User Configurable - Add a "GPX Tube Radius" slider to the UI (Range: 0.5m to 5.0m).
- Q: How should tracks extending beyond the selected area be handled? → A: Clip to Bounds - Cut the tube exactly at the edge of the selected terrain area.
- Q: How should the pipeline be supported for 3D printing? → A: Solid Wall - Fill the entire space between the tube and the ground with a thin wall.

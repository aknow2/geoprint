# Feature Specification: Generate 3D Terraced Terrain STL

**Feature Branch**: `001-map-to-stl`
**Created**: 2025-11-21
**Status**: Draft
**Input**: User description: "1. プロダクト概要: ユーザーが地図上で選択した範囲の等高線から段々地形の3Dモデルを生成しSTL形式でダウンロードできるWebツール。MVP。フロントエンドのみ。..."

## User Scenarios & Testing

### User Story 1 - Select Terrain Area (Priority: P1)

As a user, I want to select a specific rectangular area on a map so that I can define the boundaries for the 3D terrain model.

**Why this priority**: This is the first step in the workflow; without selection, no model can be generated.

**Independent Test**: Can be tested by verifying that a user can draw a rectangle on the map and the system captures the bounding box coordinates.

**Acceptance Scenarios**:

1. **Given** the map is loaded, **When** the user activates the selection tool and drags on the map, **Then** a visual rectangle is drawn and the coordinates are stored.
2. **Given** a selection exists, **When** the user adjusts the selection, **Then** the coordinates update accordingly.

---

### User Story 2 - Generate Terraced 3D Model (Priority: P1)

As a user, I want the system to generate a 3D terraced model from the selected area's contours so that I can preview the terrain art.

**Why this priority**: Core value proposition. Converts map data into the desired 3D form.

**Independent Test**: Can be tested by selecting an area and verifying that a 3D mesh is rendered in the preview area with stepped terrain.

**Acceptance Scenarios**:

1. **Given** a selected area, **When** the user clicks "Generate", **Then** the system fetches contour tiles and renders a 3D model.
2. **Given** the model is generated, **When** the user inspects it, **Then** the terrain appears as "terraced" (stepped) layers corresponding to contour lines.
3. **Given** a large selection, **When** generation occurs, **Then** the system respects the 1 million polygon limit (simplifying if necessary or warning).

---

### User Story 3 - Download STL File (Priority: P1)

As a user, I want to download the generated 3D model as an STL file so that I can 3D print it.

**Why this priority**: The final output of the product.

**Independent Test**: Can be tested by generating a model and verifying the downloaded file opens in a 3D viewer/slicer.

**Acceptance Scenarios**:

1. **Given** a generated 3D model, **When** the user clicks "Download STL", **Then** a `.stl` file is downloaded to the user's device.
2. **Given** the STL file, **When** opened in a slicer, **Then** the geometry matches the preview and is a valid solid mesh.

---

### Edge Cases

- **Network Failure**: What happens if MapTiler tiles cannot be fetched? (Show error message).
- **No Contours**: What happens if the selected area is flat (ocean/plain)? (Generate flat plate or warn).
- **Too Large Area**: What happens if the selection would result in >1M polygons? (Restrict selection size or simplify geometry).
- **Mobile Device**: How does the selection/preview work on touch screens? (Touch drag for selection, touch rotate for preview).

## Requirements

### Functional Requirements

- **FR-001**: System MUST display an interactive map using MapTiler data.
- **FR-002**: System MUST allow users to draw a rectangular bounding box on the map.
- **FR-003**: System MUST fetch contour vector tiles from MapTiler for the selected bounding box.
- **FR-004**: System MUST parse vector tiles to extract contour lines as polygons.
- **FR-005**: System MUST generate 3D geometry by extruding contour polygons to create a terraced effect.
- **FR-006**: System MUST render a live 3D preview of the generated model.
- **FR-007**: System MUST allow the user to download the 3D model in STL format.
- **FR-008**: System MUST ensure the generated STL contains fewer than 1,000,000 polygons.
- **FR-009**: System MUST operate entirely in the browser (no backend server).
- **FR-010**: System MUST be responsive and usable on mobile devices (though PC is recommended).
- **FR-011**: System MUST allow users to input their own MapTiler API Key via the UI, persisting it in local storage, or use a default key provided via environment variables.

### Key Entities

- **Map Selection**: Bounding box (North, South, East, West).
- **Contour Data**: Set of polygons with elevation values.
- **Terrain Mesh**: 3D geometry object (vertices, faces).
- **STL File**: Binary or ASCII representation of the mesh.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can generate and download a valid STL file for a standard selection (e.g., 1km x 1km) in under 30 seconds on a standard laptop.
- **SC-002**: Generated STL files strictly adhere to the 1 million polygon limit.
- **SC-003**: The application loads and functions on a mobile browser (Chrome/Safari on iOS/Android).
- **SC-004**: 100% of processing occurs client-side (verified by no custom API calls).

## Assumptions

- Users have a stable internet connection to fetch tiles.
- The MapTiler "Planet" contour tiles are sufficient for the desired terrain resolution.
- "Terraced" implies simple vertical extrusion of contour polygons without complex smoothing.
- Users are responsible for providing a valid MapTiler API key if the default quota is exceeded or not provided.

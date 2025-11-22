# Feature Specification: Add Water Layers

**Feature Branch**: `003-add-water-layers`
**Created**: 2025-11-22
**Status**: Draft
**Input**: User description: "川や水辺のレイヤーを追加したいです"

## User Scenarios & Testing

### User Story 1 - View Water Features (Priority: P1)

As a user, I want to see rivers, lakes, and oceans on the 3D terrain so that I can recognize the geography more accurately and distinguish them from roads.

**Why this priority**: Visualizing water is essential for geographical context.

**Independent Test**: Generate a model of an area with known water bodies (e.g., a coast or river) and verify they appear in the 3D scene.

**Acceptance Scenarios**:

1. **Given** a selected area with a river, **When** I generate the model, **Then** a blue line/tube representing the river appears on the terrain.
2. **Given** a selected area with a lake, **When** I generate the model, **Then** a blue polygon representing the lake appears.
3. **Given** an area with both rivers and roads, **When** I generate the model, **Then** I can clearly distinguish between them (e.g. by color).

---

### User Story 2 - Toggle Water Visibility (Priority: P2)

As a user, I want to toggle the visibility of water features so that I can choose whether to include them in my view or export.

**Why this priority**: Gives control over the complexity and appearance of the model.

**Independent Test**: Click the "Show Water" checkbox and verify water features appear/disappear.

**Acceptance Scenarios**:

1. **Given** water features are visible, **When** I uncheck "Show Water", **Then** the water features disappear from the scene.
2. **Given** water features are hidden, **When** I check "Show Water", **Then** the water features appear.

---

### User Story 3 - Export Water to STL (Priority: P2)

As a user, I want the water features to be included in the downloaded STL file so that my 3D print reflects the water bodies.

**Why this priority**: The end goal is 3D printing; visual-only features are less useful.

**Independent Test**: Download the STL with water enabled, open in a slicer/viewer, and verify water geometry is present.

**Acceptance Scenarios**:

1. **Given** "Show Water" is enabled, **When** I download the STL, **Then** the STL file contains the geometry for water features.
2. **Given** "Show Water" is disabled, **When** I download the STL, **Then** the STL file does NOT contain water geometry.

## Requirements

### Functional Requirements

- **FR-001**: System MUST fetch water layer data (rivers, streams, lakes, oceans) from the map provider.
- **FR-002**: System MUST parse water features into appropriate geometries (lines for rivers/streams, polygons for lakes/oceans).
- **FR-003**: System MUST generate 3D geometry for water features.
    - *Assumption*: Water features are generated as separate meshes placed slightly above the terrain surface (similar to roads) to ensure visibility and printability without complex boolean operations.
- **FR-004**: System MUST provide a "Show Water" toggle in the UI, enabled by default.
- **FR-005**: System MUST include visible water geometries in the STL export.
- **FR-006**: Water features MUST be colored blue in the 3D preview for easy identification.
- **FR-007**: Water features MUST be visually distinguishable from roads.
    - *Preview*: Different color (Blue vs Grey).
    - *Geometry*: Different default width or height offset (e.g. rivers slightly wider or lower/higher than roads).

### Key Entities

- **WaterFeature**: Represents a water body.
    - Type: 'LineString' (River/Stream) or 'Polygon' (Lake/Ocean)
    - Geometry: Coordinates
    - Class: river, lake, ocean, etc.

### Edge Cases

- **No Water**: If the selected area has no water features, the "Show Water" toggle should still be available (or disabled?) and generation should proceed without errors.
- **Large Water Bodies**: If an ocean covers the entire selection, the system should render a large flat plane (or handle it gracefully).
- **Data Failure**: If water tile data fails to load, the system should show an error or render the terrain without water, notifying the user.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Water features are generated and rendered within 2 seconds for a standard selection area.
- **SC-002**: 100% of visible water features in the viewport are included in the exported STL.
- **SC-003**: Users can toggle water visibility without regenerating the entire terrain (instant feedback).

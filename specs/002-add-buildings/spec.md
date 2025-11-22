# Feature Specification: Display 3D Buildings

**Feature Branch**: `002-add-buildings`
**Created**: 2025-11-21
**Status**: Draft
**Input**: User description: "地面の表示が出来たので、次は建物を表示して欲しいです" (Since the ground display is done, I want you to display the buildings next)

## User Scenarios & Testing

### User Story 1 - View 3D Buildings (Priority: P1)

As a user, I want to see 3D buildings displayed on the terrain map so that I can visualize the urban landscape.

**Why this priority**: This is the core request.

**Independent Test**: Select an area with known buildings (e.g., a city center) and verify that blocky structures appear on the 3D map.

**Acceptance Scenarios**:
1. **Given** a selected area containing buildings, **When** I click "Generate 3D Model", **Then** 3D building shapes are rendered on top of the terrain.
2. **Given** the buildings are rendered, **When** I inspect them, **Then** their heights roughly correspond to real-world heights (e.g., skyscrapers are taller than houses).
3. **Given** the buildings are rendered, **When** I look at the base, **Then** the buildings are positioned on the terrain surface, not floating above or buried completely (though partial embedding is acceptable for slopes).

---

### User Story 2 - Include Buildings in STL Export (Priority: P1)

As a user, I want the buildings to be included in the downloaded STL file so that I can 3D print the city model.

**Why this priority**: The application is "GeoPrint", implying printability is key.

**Independent Test**: Generate a model with buildings, download the STL, and open it in a slicer/viewer to confirm buildings are present and solid.

**Acceptance Scenarios**:
1. **Given** a generated model with buildings, **When** I click "Download STL", **Then** the resulting file contains both the terrain and the building geometries.
2. **Given** the STL file, **When** checked in a slicer, **Then** the buildings and terrain form a printable object (intersecting meshes are usually acceptable for slicers).

---

### User Story 3 - Toggle Buildings (Priority: P2)

As a user, I want to be able to turn building display on or off so that I can choose to print just the terrain or the full city.

**Why this priority**: Gives flexibility to the user.

**Independent Test**: Toggle a "Show Buildings" checkbox and verify buildings appear/disappear.

**Acceptance Scenarios**:
1. **Given** the generation settings, **When** I uncheck "Show Buildings" (or similar), **Then** only the terrain is generated.
2. **Given** the generation settings, **When** I check "Show Buildings", **Then** buildings are included in the generation.

### Edge Cases

- **Missing Height Data**: What happens if a building has no height info? (Default to 10m).
- **Buildings on Slopes**: How to place them? (Embed base at minimum terrain height of footprint).
- **Too Many Buildings**: Performance impact? (Limit max buildings or simplify geometry).

## Requirements

### Functional Requirements

- **FR-001**: System MUST fetch `building` layer data from MapTiler vector tiles for the selected area.
- **FR-002**: System MUST extract building footprints (polygons) and height information (`render_height`, `height`, or `levels`).
- **FR-003**: System MUST generate 3D extruded geometry for each building based on its footprint and height.
- **FR-004**: System MUST calculate the terrain elevation at each building's location and position the building geometry accordingly so it sits on the terrain.
- **FR-005**: System MUST default to a reasonable height (e.g., 10m) if height data is missing for a building.
- **FR-006**: System MUST include generated buildings in the 3D scene preview.
- **FR-007**: System MUST include generated buildings in the STL export.
- **FR-008**: System MUST provide a UI option to enable/disable building generation.

### Key Entities

- **Building Feature**: GeoJSON/Vector Tile feature with Polygon geometry and properties (height).
- **Building Mesh**: 3D Mesh object representing the building geometry.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Buildings are rendered for a standard city block selection within 5 seconds of the terrain generation.
- **SC-002**: Generated STL file size remains reasonable (e.g., under 50MB for a typical 1km^2 city block) and opens successfully in a standard slicer (e.g., Cura, PrusaSlicer).

## Assumptions

- MapTiler "Planet" tiles contain sufficient building data for the selected areas.
- Simple "block" (LOD1) representation is sufficient (no roof shapes, textures, or complex architectural details).
- Buildings on slopes can be handled by positioning the base at the minimum or center elevation of the footprint, allowing the building to intersect the terrain to avoid floating.
- The `STLExporter` can handle a scene/group containing multiple intersecting meshes (terrain + buildings).


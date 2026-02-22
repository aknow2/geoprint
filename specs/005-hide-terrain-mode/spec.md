# Feature Specification: Hide Terrain Mode

**Feature Branch**: `005-hide-terrain-mode`
**Created**: 2025-11-25
**Status**: Draft
**Input**: User description: "地形の非表示モードを追加したい。地形が非表示の場合は地面となる厚さのみが設定できるものとする。建物や道は地表の高さは０として表示される"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Toggle Hide Terrain Mode (Priority: P1)

As a user, I want to be able to hide the terrain elevation so that I can focus on the map layout or create a flat print.

**Why this priority**: This is the core functionality requested.

**Independent Test**: Can be tested by toggling the "Hide Terrain" checkbox and observing the 3D scene change from a terrain model to a flat base.

**Acceptance Scenarios**:

1. **Given** the application is loaded and a map area is selected, **When** I check the "Hide Terrain" option, **Then** the 3D terrain model should be replaced by a flat base surface.
2. **Given** "Hide Terrain" is enabled, **When** I uncheck the "Hide Terrain" option, **Then** the 3D terrain elevation model should reappear.

---

### User Story 2 - Adjust Flat Base Thickness (Priority: P2)

As a user, I want to adjust the thickness of the ground when terrain is hidden, so I can control the base height of my print.

**Why this priority**: Essential for printability and customization in flat mode.

**Independent Test**: Can be tested by enabling "Hide Terrain" and moving the "Base Height" slider.

**Acceptance Scenarios**:

1. **Given** "Hide Terrain" is enabled, **When** I adjust the "Base Height" slider, **Then** the thickness of the flat base in the 3D view should update accordingly.
2. **Given** "Hide Terrain" is enabled, **When** I look at the settings, **Then** controls for Vertical Scale, Smoothing, and Max Height should be disabled or hidden.

---

### User Story 3 - Flat Positioning of Features (Priority: P2)

As a user, I want buildings and roads to be placed flat on the ground when terrain is hidden, so they align correctly with the flat base.

**Why this priority**: Ensures the model looks correct and is printable in flat mode.

**Independent Test**: Can be tested by inspecting the visual alignment of buildings and roads on the flat base.

**Acceptance Scenarios**:

1. **Given** "Hide Terrain" is enabled, **When** I view the 3D scene, **Then** all buildings and roads should be positioned at height 0 relative to the top of the flat base (no floating or sinking).

### Edge Cases

- What happens when "Hide Terrain" is enabled while GPX tracks are loaded?
  - GPX tracks should be projected to the flat surface, slightly raised (e.g., +0.2mm) to ensure visibility.
- What happens to the "Water" layer?
  - Water should be rendered flat at Z=0 (coplanar with the base surface).

## Clarifications

### Session 2025-11-25
- Q: In "Hide Terrain" mode, how should Water features be represented? → A: Flat at Z=0 (same as base).
- Q: To ensure Roads are visible and printable on the flat base, how should they be positioned? → A: Slightly raised (e.g., +0.1mm) above the base.
- Q: Similar to Roads, how should GPX Tracks be positioned on the flat base? → A: Slightly raised (e.g., +0.2mm) above the base.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a "Hide Terrain" (or "Flat Mode") toggle in the UI.
- **FR-002**: When "Hide Terrain" is active, the system MUST render a flat rectangular base mesh instead of the elevation-based terrain mesh.
- **FR-003**: The flat base mesh MUST have a configurable height controlled by the "Base Height" setting.
- **FR-004**: When "Hide Terrain" is active, the system MUST disable or hide UI controls for "Vertical Scale", "Smoothing", and "Max Height".
- **FR-005**: When "Hide Terrain" is active, the system MUST position Buildings at Z=0 relative to the top surface. Roads MUST be positioned slightly raised (e.g., +0.1m model units, approx 0.1mm at 1:1000 scale) and GPX tracks slightly higher (e.g., +0.2m model units) to ensure visibility and printability.
- **FR-006**: The system MUST persist the "Hide Terrain" state during the session.

### Key Entities *(include if feature involves data)*

- **TerrainSettings**: Added `hideTerrain` (boolean) property.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User can switch between Terrain and Flat mode in under 1 second.
- **SC-002**: In Flat mode, the top surface of the base is perfectly planar (variance = 0).
- **SC-003**: In Flat mode, 100% of buildings and roads are anchored to the base surface (Z=0).

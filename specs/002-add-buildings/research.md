# Research Findings: Add Buildings Feature

## 1. MapTiler Building Data

*   **Layer Name**: `building`
    *   This layer contains all OSM Buildings.
*   **Key Properties**:
    *   `render_height`: An approximated height from levels and height of the building or building:part. This is the primary property to use for extrusion.
    *   `render_min_height`: An approximated height from minimum levels or minimum height of the bottom of the building. Useful for floating structures or bridges, but likely 0 for most buildings.
    *   `colour`: Building colour.
    *   `hide_3d`: Boolean. If true, the building should not be rendered in 3D (e.g., building outlines).
*   **Units**: Meters.
    *   MapTiler Planet schema specifies `ele` (elevation) in meters. `render_height` follows the same standard (OSM default).

## 2. Terrain-Building Intersection

*   **Placement Strategy**: Use **Grid Data Lookup**.
    *   Since we generate the terrain mesh from a heightmap (grid), we have the exact height value for any (x, y) coordinate in our data array.
    *   **Why**: This is significantly faster (O(1) lookup) compared to Raycasting (O(N) intersection test against terrain triangles) for every building.
*   **Implementation Detail**:
    *   When parsing a building polygon, calculate its centroid (or use the first vertex).
    *   Map the (lat, lon) or (x, y) of the building to the nearest grid cell in the terrain heightmap.
    *   Set the building's `position.y` (or `z` depending on up-axis) to that height.
    *   *Refinement*: To ensure the building is fully grounded, we might want to use the *minimum* height of the terrain under the building footprint, or extend the building geometry downwards slightly ("basement") to penetrate the terrain slope.

## 3. Three.js Merging for STL

*   **STLExporter Support**:
    *   Yes, `STLExporter` supports `THREE.Group`. You can pass the entire scene or a group containing both the terrain mesh and the building meshes to the `parse()` method.
    *   It will iterate through all children and generate a single STL file containing all triangles.
*   **Merging Geometry**:
    *   **Not strictly necessary for Slicers**: Modern slicers (Cura, PrusaSlicer, Bambu Studio) handle intersecting meshes within a single STL file correctly. They interpret the union of the volumes.
    *   **Best Practice**:
        *   Keep meshes separate in the Three.js scene for performance (frustum culling) and ease of management.
        *   Simply group them (`const exportGroup = new THREE.Group(); exportGroup.add(terrain); exportGroup.add(buildings);`) before passing to `STLExporter`.
        *   Ensure buildings extend *into* the terrain slightly to avoid floating geometry or zero-thickness gaps, which can confuse slicers.

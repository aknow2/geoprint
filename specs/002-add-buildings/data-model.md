# Data Model: Buildings

## Entities

### BuildingFeature
Represents a single building extracted from vector tiles.

| Field | Type | Description | Source |
|---|---|---|---|
| `id` | `string` | Unique identifier (if available) or generated index | Vector Tile Feature ID |
| `geometry` | `GeoJSON.Polygon` \| `GeoJSON.MultiPolygon` | The footprint of the building | Vector Tile Geometry |
| `height` | `number` | The height of the building in meters | `render_height` property |
| `minHeight` | `number` | The elevation of the building base relative to ground | `render_min_height` (default 0) |
| `center` | `[number, number]` | Centroid [lon, lat] for placement | Calculated |

### BuildingMesh
The Three.js representation.

| Field | Type | Description |
|---|---|---|
| `mesh` | `THREE.Mesh` | The 3D object |
| `userData` | `object` | Metadata (original feature props) |

## State Management

No complex state management is needed for this feature. Buildings are derived data from the map selection.

- **Input**: `MapSelection` (bounds)
- **Process**: Fetch Tiles -> Parse Buildings -> Generate Geometry -> Add to Scene
- **Output**: `THREE.Group` of buildings added to the main scene.

## Validation Rules

1.  **Height**: If `render_height` is missing or <= 0, default to 10 meters (approx 3 stories).
2.  **Geometry**: Must be a valid Polygon. Degenerate polygons (lines/points) are ignored.
3.  **Bounds**: Only buildings intersecting the selected bounds are rendered.

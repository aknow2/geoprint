# Data Model: Add Water Layers

## Entities

### WaterFeature

Represents a water body extracted from vector tiles.

| Field | Type | Description | Source |
|-------|------|-------------|--------|
| `id` | `string` | Unique identifier | Feature ID from tile |
| `type` | `'LineString' \| 'Polygon'` | Geometry type | Layer (`waterway` vs `water`) |
| `geometry` | `GeoJSON.Geometry` | Geometric data | Tile geometry |
| `class` | `string` | Classification (river, lake, etc.) | `class` property |
| `name` | `string` | Display name (optional) | `name` property |

## TypeScript Interfaces

```typescript
export type WaterFeatureType = 'LineString' | 'Polygon';

export interface WaterFeature {
  id: string;
  type: WaterFeatureType;
  geometry: GeoJSON.LineString | GeoJSON.Polygon | GeoJSON.MultiPolygon;
  class: string;
  name?: string;
  properties: {
    [key: string]: any;
  };
}
```

## Mapping Logic

### From `water` Layer (Polygons)
- **Source Layer**: `water`
- **Target Type**: `Polygon`
- **Classes**: `ocean`, `lake`, `river`, `pond`
- **Filtering**: Exclude `intermittent` if desired (or style differently).

### From `waterway` Layer (Lines)
- **Source Layer**: `waterway`
- **Target Type**: `LineString`
- **Classes**: `river`, `stream`, `canal`
- **Width Mapping**:
  - `river`: 10m
  - `canal`: 8m
  - `stream`: 3m
  - `drain`: 2m

## 3D Generation Strategy

### Polygons (Lakes, Oceans)
- **Method**: `ExtrudeGeometry` (similar to buildings but very thin/flat).
- **Elevation**: Slightly above terrain (e.g., +0.1m) or at a fixed "sea level" for oceans.
- **Material**: Blue, slightly transparent or shiny.

### Lines (Rivers, Streams)
- **Method**: `TubeGeometry` along the path.
- **Radius**: Based on `Width Mapping` / 2.
- **Elevation**: Sampled from terrain + offset.
- **Distinction from Roads**:
  - **Color**: Blue (vs Grey for roads).
  - **Offset**: Slightly lower than roads? Or same? (Roads are +0.5m). Let's set rivers to +0.2m to be "below" bridges if possible, or same level.
  - **Profile**: Roads use a square/diamond profile (4 segments). Rivers could use a round profile (8+ segments) or just rely on color.


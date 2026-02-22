# Data Model: Hide Terrain Mode

## Entities

### TerrainSettings

Settings used to generate the terrain geometry.

| Field | Type | Description |
|-------|------|-------------|
| `hideTerrain` | `boolean` | **New**. If true, generates a flat base instead of elevation model. |
| `baseHeight` | `number` | Thickness of the base (meters). |
| `verticalScale` | `number` | Vertical exaggeration factor (ignored if `hideTerrain` is true). |
| `smoothing` | `number` | Smoothing iterations (ignored if `hideTerrain` is true). |
| `maxHeight` | `number` | Maximum height clamp (ignored if `hideTerrain` is true). |

## Component State

### App.tsx

| State Variable | Type | Description |
|----------------|------|-------------|
| `hideTerrain` | `boolean` | Controls the visibility of terrain elevation. Default: `false`. |

# Quickstart: Hide Terrain Mode

## Overview

The "Hide Terrain" mode allows users to generate a flat base model, useful for printing city layouts without elevation data or for creating a simple base.

## Usage

1.  **Select Area**: Choose a map area as usual.
2.  **Toggle Mode**: In the "Terrain" settings panel, check the "Hide Terrain" box.
3.  **Adjust Base**: Use the "Base Height" slider to set the thickness of the flat plate.
4.  **Generate**: Click "Generate 3D Model". The terrain will be flat, with buildings and roads sitting on top.
5.  **Export**: Click "Download STL" to get the flat model.

## Development

### Enable Flat Mode

```typescript
// In App.tsx
const [hideTerrain, setHideTerrain] = useState(false);

// Pass to generator
const geometry = generateTerrainGeometry(segments, selection, 100, {
  // ...
  hideTerrain
});
```

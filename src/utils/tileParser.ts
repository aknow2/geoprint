import Pbf from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';
import type { TileData } from '../services/tileService';

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface ContourSegment {
  elevation: number;
  points: Point3D[];
}

export const parseTiles = (tiles: TileData[], center: {lat: number, lng: number}): ContourSegment[] => {
  const segments: ContourSegment[] = [];

  tiles.forEach(tile => {
    const pbf = new Pbf(tile.buffer);
    const vt = new VectorTile(pbf);
    const layer = vt.layers['contour'];
    if (!layer) return;

    // Tile bounds in lat/lng
    const n = Math.pow(2, tile.z);
    const tileLon = tile.x / n * 360 - 180;
    const tileLatRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * tile.y / n)));
    const tileLat = tileLatRad * 180 / Math.PI;
    
    // Next tile bounds for calculating scale
    const nextTileLon = (tile.x + 1) / n * 360 - 180;
    const nextTileLatRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * (tile.y + 1) / n)));
    const nextTileLat = nextTileLatRad * 180 / Math.PI;
    
    const tileWidthDeg = nextTileLon - tileLon;
    const tileHeightDeg = tileLat - nextTileLat; // tileLat is top (north), nextTileLat is bottom (south)

    for (let i = 0; i < layer.length; i++) {
      const feature = layer.feature(i);
      const elevation = feature.properties.ele || feature.properties.height;
      if (typeof elevation !== 'number') continue;

      const geometries = feature.loadGeometry();
      geometries.forEach(points => {
        const worldPoints = points.map(p => {
          // Convert tile coordinate (0-extent) to lat/lng
          // layer.extent is usually 4096
          const lng = tileLon + (p.x / layer.extent) * tileWidthDeg;
          const lat = tileLat - (p.y / layer.extent) * tileHeightDeg; // y goes down in tile coords

          // Convert to meters relative to center
          // Simple projection: Equirectangular approximation
          const x = (lng - center.lng) * 111320 * Math.cos(center.lat * Math.PI / 180);
          const y = (lat - center.lat) * 111320;
          
          return { x, y, z: elevation };
        });
        
        segments.push({ elevation, points: worldPoints });
      });
    }
  });

  return segments;
};

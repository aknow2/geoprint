import Pbf from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';
import type { TileData } from '../services/tileService';
import type { BuildingFeature } from '../types';

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

export const parseBuildings = (tiles: TileData[], center: {lat: number, lng: number}): BuildingFeature[] => {
  const buildings: BuildingFeature[] = [];

  tiles.forEach(tile => {
    const pbf = new Pbf(tile.buffer);
    const vt = new VectorTile(pbf);
    // debugger; // Removed debugger
    const layer = vt.layers['building'];
    if (!layer) {
      console.warn(`Tile ${tile.z}/${tile.x}/${tile.y} has no 'building' layer. Available layers:`, Object.keys(vt.layers));
      return;
    }

    for (let i = 0; i < layer.length; i++) {
      const feature = layer.feature(i);
      
      const props = feature.properties;
      if (props.hide_3d) continue;

      let height = props.render_height as number;
      if (!height) {
          if (props.height) height = props.height as number;
          else if (props.levels) height = (props.levels as number) * 3;
          else height = 10; // Default
      }

      const minHeight = (props.render_min_height as number) || (props.min_height as number) || 0;

      // Convert to GeoJSON
      const geojson = feature.toGeoJSON(tile.x, tile.y, tile.z);
      
      if (geojson.geometry.type !== 'Polygon' && geojson.geometry.type !== 'MultiPolygon') continue;

      const geometry = geojson.geometry;
      
      // Helper to project [lon, lat] -> [x, y] (meters relative to center)
      const project = (lon: number, lat: number) => {
          const x = (lon - center.lng) * 111320 * Math.cos(center.lat * Math.PI / 180);
          const y = (lat - center.lat) * 111320;
          return [x, y];
      };

      const projectRing = (ring: number[][]) => ring.map(coord => project(coord[0], coord[1]));
      
      // Project coordinates in place
      if (geometry.type === 'Polygon') {
          geometry.coordinates = geometry.coordinates.map(projectRing);
      } else if (geometry.type === 'MultiPolygon') {
          geometry.coordinates = geometry.coordinates.map((polygon: any) => polygon.map(projectRing));
      }

      // Calculate center (in projected coordinates)
      let centerX = 0, centerY = 0;
      if (geometry.type === 'Polygon') {
          const firstPoint = geometry.coordinates[0][0];
          centerX = firstPoint[0];
          centerY = firstPoint[1];
      } else if (geometry.type === 'MultiPolygon') {
          const firstPoint = geometry.coordinates[0][0][0];
          centerX = firstPoint[0];
          centerY = firstPoint[1];
      }

      buildings.push({
        id: (feature.id || `${tile.x}-${tile.y}-${i}`).toString(),
        geometry: geometry,
        height,
        minHeight,
        center: [centerX, centerY]
      });
    }
  });

  return buildings;
};

import type { BoundingBox } from '../types';
import { getMapTilerKey } from '../config';

// Helper to convert lat/lng to tile coordinates
const long2tile = (lon: number, zoom: number) => {
  return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
}

const lat2tile = (lat: number, zoom: number) => {
  return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));
}

export interface TileData {
  x: number;
  y: number;
  z: number;
  buffer: ArrayBuffer;
}

export const fetchContourTiles = async (bbox: BoundingBox, zoom: number = 14): Promise<TileData[]> => {
  const apiKey = getMapTilerKey();
  if (!apiKey) throw new Error("API Key missing");

  const minX = long2tile(bbox.west, zoom);
  const maxX = long2tile(bbox.east, zoom);
  const minY = lat2tile(bbox.north, zoom);
  const maxY = lat2tile(bbox.south, zoom);

  const tiles = [];
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      tiles.push({ x, y, z: zoom });
    }
  }

  const promises = tiles.map(async (tile) => {
    const url = `https://api.maptiler.com/tiles/contours/${tile.z}/${tile.x}/${tile.y}.pbf?key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
        console.error(`Failed to fetch tile ${tile.z}/${tile.x}/${tile.y}: ${response.statusText}`);
        // Return null or throw? Let's throw for now.
        throw new Error(`Failed to fetch tile ${tile.z}/${tile.x}/${tile.y}`);
    }
    const buffer = await response.arrayBuffer();
    return { ...tile, buffer };
  });

  return Promise.all(promises);
};

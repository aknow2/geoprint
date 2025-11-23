import { Mesh } from 'three';

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface BuildingFeature {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geometry: any; // GeoJSON.Polygon | GeoJSON.MultiPolygon
  height: number;
  minHeight: number;
  center: [number, number];
}

export interface RoadFeature {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geometry: any; // GeoJSON.LineString | GeoJSON.MultiLineString
  class: string;
  name?: string;
}

export type WaterFeatureType = 'LineString' | 'Polygon';

export interface WaterFeature {
  id: string;
  type: WaterFeatureType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geometry: any; // GeoJSON.LineString | GeoJSON.Polygon | GeoJSON.MultiPolygon
  class: string;
  name?: string;
  properties: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}

export interface BuildingMesh {
  mesh: Mesh;
  userData: {
    featureId: string;
    height: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}

export interface GpxPoint {
  lat: number;
  lon: number;
  ele?: number; // Elevation in meters
  time?: string; // ISO timestamp
}

export interface GpxTrack {
  name?: string;
  segments: GpxPoint[][]; // Array of segments, each segment is an array of points
}

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
  geometry: any; // GeoJSON.Polygon | GeoJSON.MultiPolygon
  height: number;
  minHeight: number;
  center: [number, number];
}

export interface BuildingMesh {
  mesh: Mesh;
  userData: {
    featureId: string;
    height: number;
    [key: string]: any;
  };
}

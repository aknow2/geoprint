import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createBuildingGeometries, createGpxGeometries } from './geometryGenerator';
import type { BuildingFeature, GpxTrack } from '../types';

describe('geometryGenerator', () => {
  it('should create building geometries with correct height and position', () => {
    // Mock Terrain Geometry with Grid Data
    const terrainGeometry = new THREE.BufferGeometry();
    const gridX = 2;
    const gridY = 2;
    const elevations = new Float32Array([0, 0, 10, 10]); // Slope: y=0 -> z=0, y=1 -> z=10
    
    terrainGeometry.userData = {
      grid: {
        elevations,
        minX: 0, maxX: 100,
        minY: 0, maxY: 100,
        gridX, gridY,
        minElevation: 0,
        verticalScale: 1
      }
    };

    // Mock Building Feature
    const building: BuildingFeature = {
      id: '1',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [[10, 10], [10, 20], [20, 20], [20, 10], [10, 10]]
        ]
      },
      height: 20,
      minHeight: 0,
      center: [15, 15] // Near (0,0) in grid terms
    };

    const group = createBuildingGeometries([building], terrainGeometry);
    
    expect(group.children.length).toBe(1);
    const mesh = group.children[0] as THREE.Mesh;
    
    // Check position Z
    // terrainHeight at (0,0) is 0.
    // basementDepth is 5.
    // position.z should be 0 - 5 = -5, but clamped to 0.2.
    expect(mesh.position.z).toBe(0.2);
    
    // Check geometry depth (height)
    // topZ = 0 + 20 = 20.
    // bottomZ = 0.2.
    // totalHeight = 19.8.
    mesh.geometry.computeBoundingBox();
    const bbox = mesh.geometry.boundingBox!;
    const height = bbox.max.z - bbox.min.z;
    expect(height).toBeCloseTo(19.8);
  });
});

describe('createGpxGeometries', () => {
    it('should create geometries for valid track', () => {
      // Mock terrain geometry
      const terrainGeo = new THREE.BufferGeometry();
      terrainGeo.userData = {
        grid: {
          elevations: new Float32Array([0, 0, 0, 0]),
          minX: -100, maxX: 100,
          minY: -100, maxY: 100,
          gridX: 2, gridY: 2,
          minElevation: 0,
          verticalScale: 1,
          baseHeight: 2,
          center: { lat: 0, lng: 0 }
        }
      };
  
      const track: GpxTrack = {
        segments: [[
          { lat: 0, lon: 0, ele: 10 },
          { lat: 0.0001, lon: 0.0001, ele: 10 }
        ]]
      };
  
      const group = createGpxGeometries(track, terrainGeo, { radius: 1, minClearance: 5 });
      
      expect(group.children.length).toBe(2); // Tube + Wall
      expect(group.children[0]).toBeInstanceOf(THREE.Mesh); // Tube
      expect(group.children[1]).toBeInstanceOf(THREE.Mesh); // Wall
    });
  
    it('should clip points outside bounds', () => {
      const terrainGeo = new THREE.BufferGeometry();
      terrainGeo.userData = {
        grid: {
          elevations: new Float32Array([0, 0, 0, 0]),
          minX: -10, maxX: 10,
          minY: -10, maxY: 10,
          gridX: 2, gridY: 2,
          minElevation: 0,
          verticalScale: 1,
          baseHeight: 2,
          center: { lat: 0, lng: 0 }
        }
      };
  
      const track: GpxTrack = {
        segments: [[
          { lat: 0, lon: 0, ele: 10 }, // Inside
          { lat: 10, lon: 10, ele: 10 } // Outside (approx 1113km away)
        ]]
      };
  
      const group = createGpxGeometries(track, terrainGeo);
      // Should be empty because filtered points < 2
      expect(group.children.length).toBe(0);
    });
  });

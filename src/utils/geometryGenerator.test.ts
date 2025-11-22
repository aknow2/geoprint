import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createBuildingGeometries } from './geometryGenerator';
import type { BuildingFeature } from '../types';

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
    // basementDepth is 10.
    // position.z should be 0 - 10 = -10.
    expect(mesh.position.z).toBe(-10);
    
    // Check geometry depth (height)
    // totalHeight = 20 + 10 = 30.
    mesh.geometry.computeBoundingBox();
    const bbox = mesh.geometry.boundingBox!;
    const height = bbox.max.z - bbox.min.z;
    expect(height).toBeCloseTo(30);
  });
});

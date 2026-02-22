import { describe, it, expect, vi } from 'vitest';
import { parseBuildings } from './tileParser';

// Mock @mapbox/vector-tile
vi.mock('@mapbox/vector-tile', () => {
  return {
    VectorTile: class {
      layers: {
        building: {
          length: number;
          feature: () => {
            id: number;
            properties: {
              render_height: number;
              render_min_height: number;
            };
            toGeoJSON: () => {
              geometry: {
                type: string;
                coordinates: number[][][];
              };
            };
          };
        };
      };
      constructor() {
        this.layers = {
          building: {
            length: 1,
            feature: () => ({
              id: 123,
              properties: {
                render_height: 20,
                render_min_height: 0
              },
              toGeoJSON: () => ({
                geometry: {
                  type: 'Polygon',
                  coordinates: [
                    [[0, 0], [0, 0.001], [0.001, 0.001], [0.001, 0], [0, 0]]
                  ]
                }
              })
            })
          }
        };
      }
    }
  };
});

// Mock Pbf
vi.mock('pbf', () => {
  return {
    default: vi.fn()
  };
});

describe('tileParser', () => {
  it('should parse buildings correctly', () => {
    const mockTiles = [{ x: 0, y: 0, z: 14, buffer: new ArrayBuffer(0) }];
    const center = { lat: 0, lng: 0 };
    
    const buildings = parseBuildings(mockTiles, center);
    
    expect(buildings).toHaveLength(1);
    expect(buildings[0].height).toBe(20);
    expect(buildings[0].geometry.type).toBe('Polygon');
    // Check if coordinates are projected (not 0,0 anymore)
    // 0,0 projected relative to 0,0 is 0,0.
    // 0.001 deg lat is approx 111.32m.
    expect(buildings[0].geometry.coordinates[0][0]).toEqual([0, 0]);
    // y is (lat - center.lat) * 111320
    // 0.001 * 111320 = 111.32
    expect(buildings[0].geometry.coordinates[0][1][1]).toBeCloseTo(111.32, 1);
  });
});

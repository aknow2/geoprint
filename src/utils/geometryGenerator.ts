import * as THREE from 'three';
import type { ContourSegment } from './tileParser';
import type { BoundingBox, BuildingFeature, RoadFeature } from '../types';

export const generateTerrainGeometry = (
  segments: ContourSegment[], 
  bbox: BoundingBox,
  resolution: number = 100, // Grid resolution
  options: {
    baseHeight?: number; // Base thickness in meters
    verticalScale?: number; // Exaggerate height
    maxHeight?: number; // Clamp max height relative to min
  } = {}
): THREE.BufferGeometry => {
  const {
    baseHeight = 2,
    verticalScale = 1.0,
    maxHeight = Infinity
  } = options;
  
  // Calculate bounds in meters (relative to center)
  const center = {
    lat: (bbox.north + bbox.south) / 2,
    lng: (bbox.east + bbox.west) / 2
  };
  
  const minX = (bbox.west - center.lng) * 111320 * Math.cos(center.lat * Math.PI / 180);
  const maxX = (bbox.east - center.lng) * 111320 * Math.cos(center.lat * Math.PI / 180);
  const minY = (bbox.south - center.lat) * 111320;
  const maxY = (bbox.north - center.lat) * 111320;
  
  const rangeX = maxX - minX;
  const rangeY = maxY - minY;
  
  // Grid parameters
  const gridX = resolution;
  const gridY = resolution;
  const widthSegments = gridX - 1;
  const heightSegments = gridY - 1;

  // Pre-process segments to simple line segments for faster distance check
  const lines: {p1: {x:number, y:number}, p2: {x:number, y:number}, ele: number}[] = [];
  segments.forEach(seg => {
    for (let i = 0; i < seg.points.length - 1; i++) {
      lines.push({
        p1: seg.points[i],
        p2: seg.points[i+1],
        ele: seg.elevation
      });
    }
  });

  // Optimization: If too many lines, maybe sample points?
  // Or just use points if lines are short.
  // Using points is faster to code and maybe fast enough if points are dense.
  // Let's stick to points for simplicity first.
  const points: {x:number, y:number, ele: number}[] = [];
  let minElevation = Infinity;

  segments.forEach(seg => {
      if (seg.elevation < minElevation) minElevation = seg.elevation;
      seg.points.forEach(p => {
          points.push({x: p.x, y: p.y, ele: seg.elevation});
      });
  });

  if (minElevation === Infinity) minElevation = 0;

  // Limit points to avoid freeze?
  // If > 10000 points, maybe subsample?
  const sampleRate = points.length > 10000 ? Math.ceil(points.length / 10000) : 1;
  const sampledPoints = points.filter((_, i) => i % sampleRate === 0);

  // Calculate elevations for the grid
  const elevations = new Float32Array(gridX * gridY);
  
  for (let iy = 0; iy < gridY; iy++) {
    const y = minY + (iy / heightSegments) * rangeY;
    for (let ix = 0; ix < gridX; ix++) {
      const x = minX + (ix / widthSegments) * rangeX;
      
      let minDistSq = Infinity;
      let rawElevation = minElevation;
      
      // Brute force nearest neighbor
      for (const p of sampledPoints) {
          const dx = x - p.x;
          const dy = y - p.y;
          const dSq = dx*dx + dy*dy;
          if (dSq < minDistSq) {
              minDistSq = dSq;
              rawElevation = p.ele;
          }
      }
      
      // Apply adjustments
      let adjustedElevation = rawElevation - minElevation;
      adjustedElevation *= verticalScale;
      if (adjustedElevation > maxHeight) {
          adjustedElevation = maxHeight;
      }
      adjustedElevation += baseHeight;
      
      elevations[iy * gridX + ix] = adjustedElevation;
    }
  }

  // Build Custom Geometry (Solid Block)
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];

  // 1. Generate Vertices
  // Top Surface
  for (let iy = 0; iy < gridY; iy++) {
    const y = minY + (iy / heightSegments) * rangeY;
    for (let ix = 0; ix < gridX; ix++) {
      const x = minX + (ix / widthSegments) * rangeX;
      const z = elevations[iy * gridX + ix];
      vertices.push(x, y, z);
    }
  }
  // Bottom Surface (Z=0)
  for (let iy = 0; iy < gridY; iy++) {
    const y = minY + (iy / heightSegments) * rangeY;
    for (let ix = 0; ix < gridX; ix++) {
      const x = minX + (ix / widthSegments) * rangeX;
      vertices.push(x, y, 0);
    }
  }

  const topOffset = 0;
  const bottomOffset = gridX * gridY;

  // 2. Generate Indices
  // Top Surface Faces (CCW)
  for (let iy = 0; iy < heightSegments; iy++) {
    for (let ix = 0; ix < widthSegments; ix++) {
      const a = topOffset + iy * gridX + ix;
      const b = topOffset + iy * gridX + (ix + 1);
      const c = topOffset + (iy + 1) * gridX + ix;
      const d = topOffset + (iy + 1) * gridX + (ix + 1);
      
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  // Bottom Surface Faces (CW for downward normal)
  for (let iy = 0; iy < heightSegments; iy++) {
    for (let ix = 0; ix < widthSegments; ix++) {
      const a = bottomOffset + iy * gridX + ix;
      const b = bottomOffset + iy * gridX + (ix + 1);
      const c = bottomOffset + (iy + 1) * gridX + ix;
      const d = bottomOffset + (iy + 1) * gridX + (ix + 1);
      
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  // Side Faces
  // South Side (iy = 0)
  for (let ix = 0; ix < widthSegments; ix++) {
    const topA = topOffset + 0 * gridX + ix;
    const topB = topOffset + 0 * gridX + (ix + 1);
    const botA = bottomOffset + 0 * gridX + ix;
    const botB = bottomOffset + 0 * gridX + (ix + 1);
    
    indices.push(topA, botA, botB);
    indices.push(topA, botB, topB);
  }

  // North Side (iy = heightSegments)
  for (let ix = 0; ix < widthSegments; ix++) {
    const topA = topOffset + (gridY - 1) * gridX + ix;
    const topB = topOffset + (gridY - 1) * gridX + (ix + 1);
    const botA = bottomOffset + (gridY - 1) * gridX + ix;
    const botB = bottomOffset + (gridY - 1) * gridX + (ix + 1);
    
    indices.push(topA, topB, botB);
    indices.push(topA, botB, botA);
  }

  // West Side (ix = 0)
  for (let iy = 0; iy < heightSegments; iy++) {
    const topA = topOffset + iy * gridX + 0;
    const topC = topOffset + (iy + 1) * gridX + 0;
    const botA = bottomOffset + iy * gridX + 0;
    const botC = bottomOffset + (iy + 1) * gridX + 0;
    
    indices.push(topA, topC, botC);
    indices.push(topA, botC, botA);
  }

  // East Side (ix = widthSegments)
  for (let iy = 0; iy < heightSegments; iy++) {
    const topA = topOffset + iy * gridX + (gridX - 1);
    const topC = topOffset + (iy + 1) * gridX + (gridX - 1);
    const botA = bottomOffset + iy * gridX + (gridX - 1);
    const botC = bottomOffset + (iy + 1) * gridX + (gridX - 1);
    
    indices.push(topA, botA, botC);
    indices.push(topA, botC, topC);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  geometry.userData = {
    grid: {
      elevations,
      minX, maxX, minY, maxY,
      gridX, gridY,
      minElevation,
      verticalScale
    }
  };

  return geometry;
};

export const createBuildingGeometries = (
  buildings: BuildingFeature[], 
  terrainGeometry: THREE.BufferGeometry,
  options: { verticalScale?: number } = {}
): THREE.Group => {
  const group = new THREE.Group();
  const gridData = terrainGeometry.userData.grid;
  
  if (!gridData) {
      console.warn("Terrain geometry missing grid data in userData");
      return group;
  }

  const { elevations, minX, maxX, minY, maxY, gridX, gridY, verticalScale: terrainVerticalScale } = gridData;
  const rangeX = maxX - minX;
  const rangeY = maxY - minY;

  // Use provided vertical scale or fallback to terrain's scale
  const buildingVerticalScale = options.verticalScale !== undefined ? options.verticalScale : terrainVerticalScale;

  console.log(`Generating geometry for ${buildings.length} buildings. Scale: ${buildingVerticalScale}`);
  let placedCount = 0;

  buildings.forEach(building => {
      const polygons = building.geometry.type === 'MultiPolygon' 
          ? building.geometry.coordinates 
          : [building.geometry.coordinates];

      polygons.forEach((polygonCoords: any) => {
          // 1. Create Shape
          const shape = new THREE.Shape();
          const outerRing = polygonCoords[0];
          
          if (!outerRing || outerRing.length < 3) return;

          shape.moveTo(outerRing[0][0], outerRing[0][1]);
          for (let i = 1; i < outerRing.length; i++) {
              shape.lineTo(outerRing[i][0], outerRing[i][1]);
          }

          // Handle holes (inner rings)
          if (polygonCoords.length > 1) {
              for (let i = 1; i < polygonCoords.length; i++) {
                  const holeCoords = polygonCoords[i];
                  const holePath = new THREE.Path();
                  holePath.moveTo(holeCoords[0][0], holeCoords[0][1]);
                  for (let j = 1; j < holeCoords.length; j++) {
                      holePath.lineTo(holeCoords[j][0], holeCoords[j][1]);
                  }
                  shape.holes.push(holePath);
              }
          }

          // 2. Check bounds and Calculate Center
          // Check if ANY point is outside the terrain bounds
          let cx = 0, cy = 0;
          let isFullyInside = true;

          for (const p of outerRing) {
              if (p[0] < minX || p[0] > maxX || p[1] < minY || p[1] > maxY) {
                  isFullyInside = false;
                  break;
              }
              cx += p[0];
              cy += p[1];
          }

          if (!isFullyInside) return;

          cx /= outerRing.length;
          cy /= outerRing.length;
          
          // 3. Grid Lookup for Elevation
          // Map to grid index
          const ix = Math.floor((cx - minX) / rangeX * (gridX - 1));
          const iy = Math.floor((cy - minY) / rangeY * (gridY - 1));
          
          let terrainHeight = 0;
          if (ix >= 0 && ix < gridX && iy >= 0 && iy < gridY) {
              // elevations array is row-major
              terrainHeight = elevations[iy * gridX + ix];
              placedCount++;
          } else {
              // Should be rare if points are inside, but safe to skip
              return;
          }

          // 4. Extrude
          // We want the top of the building to be at: 
          //    TopZ = terrainHeight + (minHeight + height) * buildingVerticalScale
          // We want the bottom of the building to be at:
          //    BottomZ = terrainHeight - FixedBasementDepth
          //    We use a fixed basement depth (e.g. 5m) so that scaling the building 
          //    only affects the height upwards, not the depth downwards.
          //    This makes the building appear "anchored" to the terrain.
          
          const BASEMENT_DEPTH = 5; // 5 meters fixed basement
          let bottomZ = terrainHeight - BASEMENT_DEPTH;
          
          // Clamp to a small positive value (e.g. 0.2m) to prevent Z-fighting with the bottom layer (Z=0)
          if (bottomZ < 0.2) bottomZ = 0.2;

          // Total extrusion depth = TopZ - BottomZ
          const topZ = terrainHeight + (building.minHeight + building.height) * buildingVerticalScale;
          const totalHeight = topZ - bottomZ;

          if (totalHeight <= 0) return;

          const extrudeSettings = {
              depth: totalHeight,
              bevelEnabled: false
          };
          
          const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
          
          const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xcccccc }));
          
          // 5. Placement
          // Mesh is created from Z=0 to Z=totalHeight.
          // We place it so Z=0 is at BottomZ.
          mesh.position.z = bottomZ;
          
          // Add metadata
          mesh.userData = {
              featureId: building.id,
              height: building.height
          };

          group.add(mesh);
      });
  });

  console.log(`Placed ${placedCount} / ${buildings.length} buildings on terrain.`);

  return group;
};

export const createRoadGeometries = (
  roads: RoadFeature[],
  terrainGeometry: THREE.BufferGeometry,
  options: { verticalScale?: number } = {}
): THREE.Group => {
  const group = new THREE.Group();
  const gridData = terrainGeometry.userData.grid;

  if (!gridData) {
      console.warn("Terrain geometry missing grid data in userData");
      return group;
  }

  const { elevations, minX, maxX, minY, maxY, gridX, gridY, verticalScale: terrainVerticalScale } = gridData;
  const rangeX = maxX - minX;
  const rangeY = maxY - minY;
  
  // Use provided vertical scale or fallback
  const roadVerticalScale = options.verticalScale !== undefined ? options.verticalScale : terrainVerticalScale;

  console.log(`Generating geometry for ${roads.length} roads.`);

  const getElevation = (x: number, y: number): number | null => {
      const ix = Math.floor((x - minX) / rangeX * (gridX - 1));
      const iy = Math.floor((y - minY) / rangeY * (gridY - 1));
      
      if (ix >= 0 && ix < gridX && iy >= 0 && iy < gridY) {
          return elevations[iy * gridX + ix];
      }
      return null;
  };

  const roadWidths: {[key: string]: number} = {
      'motorway': 4,
      'trunk': 3.5,
      'primary': 3,
      'secondary': 2.5,
      'tertiary': 2,
      'residential': 1.5,
      'service': 1,
      'footway': 0.5,
      'path': 0.5
  };

  roads.forEach(road => {
      const lines = road.geometry.type === 'MultiLineString' 
          ? road.geometry.coordinates 
          : [road.geometry.coordinates];

      const width = roadWidths[road.class] || 1;
      const radius = (width / 2) * 1.5; // Slightly wider for visibility

      lines.forEach((lineCoords: any) => {
          const points: THREE.Vector3[] = [];
          
          lineCoords.forEach((p: number[]) => {
              const x = p[0];
              const y = p[1];
              const ele = getElevation(x, y);
              
              if (ele !== null) {
                  // Lift road slightly above terrain
                  points.push(new THREE.Vector3(x, y, ele + 0.5));
              }
          });

          if (points.length < 2) return;

          const curve = new THREE.CatmullRomCurve3(points);
          // TubeGeometry(path, tubularSegments, radius, radialSegments, closed)
          // Optimize segments based on length?
          const segments = Math.max(points.length * 5, 64); 
          const geometry = new THREE.TubeGeometry(curve, segments, radius, 4, false); // 4 radial segments = square profile (diamond)
          
          const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x555555 }));
          group.add(mesh);
      });
  });

  return group;
};

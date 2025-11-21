import * as THREE from 'three';
import type { ContourSegment } from './tileParser';
import type { BoundingBox } from '../types';

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
  return geometry;
};

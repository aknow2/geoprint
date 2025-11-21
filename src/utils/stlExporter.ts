import * as THREE from 'three';
import { STLExporter } from 'three-stdlib';

export const exportToSTL = (geometry: THREE.BufferGeometry): Blob => {
  const exporter = new STLExporter();
  // Create a temporary mesh to export
  const mesh = new THREE.Mesh(geometry);
  
  // Ensure transforms are applied if needed?
  // The geometry is already in the correct shape.
  // But we might want to rotate it for printing (Z up is standard for some, Y up for others).
  // Our geometry has Z up (elevation).
  // STLExporter exports as is.
  
  const result = exporter.parse(mesh, { binary: true });
  // STLExporter returns DataView or string. With binary: true, it returns DataView.
  // Blob constructor expects BlobPart[] which includes ArrayBuffer, but DataView might have type mismatch issues in some TS versions.
  // We can extract the buffer from DataView.
  const buffer = result instanceof DataView ? result.buffer : result;
  // Cast to any to bypass SharedArrayBuffer vs ArrayBuffer strict check if needed, or just pass result directly if environment supports it.
  // But to be safe with TS:
  return new Blob([buffer as ArrayBuffer], { type: 'application/octet-stream' });
};

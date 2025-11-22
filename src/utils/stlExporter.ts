import * as THREE from 'three';
import { STLExporter } from 'three-stdlib';

export const exportToSTL = (object: THREE.Object3D | THREE.BufferGeometry): Blob => {
  const exporter = new STLExporter();
  let exportObject: THREE.Object3D;

  if (object instanceof THREE.BufferGeometry) {
      exportObject = new THREE.Mesh(object);
  } else {
      exportObject = object;
  }
  
  const result = exporter.parse(exportObject, { binary: true });
  // STLExporter returns DataView or string. With binary: true, it returns DataView.
  // Blob constructor expects BlobPart[] which includes ArrayBuffer, but DataView might have type mismatch issues in some TS versions.
  // We can extract the buffer from DataView.
  const buffer = result instanceof DataView ? result.buffer : result;
  // Cast to any to bypass SharedArrayBuffer vs ArrayBuffer strict check if needed, or just pass result directly if environment supports it.
  // But to be safe with TS:
  return new Blob([buffer as ArrayBuffer], { type: 'application/octet-stream' });
};

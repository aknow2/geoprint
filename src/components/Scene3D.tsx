import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';

interface Scene3DProps {
  terrainGeometry: THREE.BufferGeometry | null;
  buildingsGroup: THREE.Group | null;
}

const Scene3D: React.FC<Scene3DProps> = ({ terrainGeometry, buildingsGroup }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const buildingsRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe0e0e0);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      100000
    );
    camera.position.set(0, -100, 100);
    camera.up.set(0, 0, 1); // Z up
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(100, -100, 200);
    scene.add(dirLight);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    const mountNode = mountRef.current;

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountNode) {
        mountNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      // Dispose geometry/materials if needed
    };
  }, []);

  // Update Geometry
  useEffect(() => {
    if (!sceneRef.current || !terrainGeometry) return;

    // Remove old mesh
    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
      // meshRef.current.geometry.dispose(); // Managed by parent?
    }

    const material = new THREE.MeshStandardMaterial({ 
      color: 0x4caf50,
      flatShading: true,
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.2
    });
    
    const mesh = new THREE.Mesh(terrainGeometry, material);
    sceneRef.current.add(mesh);
    meshRef.current = mesh;

    // Center camera
    if (cameraRef.current && controlsRef.current) {
        terrainGeometry.computeBoundingSphere();
        const center = terrainGeometry.boundingSphere?.center;
        const radius = terrainGeometry.boundingSphere?.radius;
        if (center && radius) {
            controlsRef.current.target.copy(center);
            const dist = radius * 2.5;
            // Position camera south of the center, looking north
            cameraRef.current.position.set(center.x, center.y - dist, center.z + dist * 0.5);
            cameraRef.current.lookAt(center);
            controlsRef.current.update();
        }
    }

  }, [terrainGeometry]);

  // Update Buildings
  useEffect(() => {
    if (!sceneRef.current) return;

    // Remove old buildings
    if (buildingsRef.current) {
      sceneRef.current.remove(buildingsRef.current);
      // Dispose geometries/materials?
      // buildingsRef.current.traverse((child) => {
      //   if (child instanceof THREE.Mesh) {
      //     child.geometry.dispose();
      //     if (Array.isArray(child.material)) {
      //       child.material.forEach(m => m.dispose());
      //     } else {
      //       child.material.dispose();
      //     }
      //   }
      // });
    }

    if (buildingsGroup) {
      sceneRef.current.add(buildingsGroup);
      buildingsRef.current = buildingsGroup;
    } else {
      buildingsRef.current = null;
    }
  }, [buildingsGroup]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};

export default Scene3D;

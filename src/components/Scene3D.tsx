import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';

interface Scene3DProps {
  terrainGeometry: THREE.BufferGeometry | null;
  buildingsGroup: THREE.Group | null;
  roadsGroup?: THREE.Group | null;
  waterGroup?: THREE.Group | null;
  gpxGroup?: THREE.Group | null;
}

const Scene3D: React.FC<Scene3DProps> = ({ terrainGeometry, buildingsGroup, roadsGroup, waterGroup, gpxGroup }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const buildingsRef = useRef<THREE.Group | null>(null);
  const roadsRef = useRef<THREE.Group | null>(null);
  const waterRef = useRef<THREE.Group | null>(null);
  const gpxRef = useRef<THREE.Group | null>(null);
  const selectedObjectRef = useRef<{ mesh: THREE.Mesh, originalMaterial: THREE.Material | THREE.Material[] } | null>(null);

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

    // Interaction
    let downTime = 0;
    const downPos = new THREE.Vector2();

    const onPointerDown = (e: PointerEvent) => {
      downTime = performance.now();
      downPos.set(e.clientX, e.clientY);
    };

    const onPointerUp = (e: PointerEvent) => {
      const upTime = performance.now();
      const moveDist = downPos.distanceTo(new THREE.Vector2(e.clientX, e.clientY));
      
      if (moveDist < 5 && (upTime - downTime) < 300) {
        handleClick(e);
      }
    };

    const handleClick = (event: PointerEvent) => {
      if (!cameraRef.current || !sceneRef.current || !mountRef.current) return;

      const rect = mountRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      const interactableObjects: THREE.Object3D[] = [];
      if (buildingsRef.current) interactableObjects.push(buildingsRef.current);
      if (roadsRef.current) interactableObjects.push(roadsRef.current);
      if (waterRef.current) interactableObjects.push(waterRef.current);
      
      const intersects = raycaster.intersectObjects(interactableObjects, true);

      if (intersects.length > 0) {
        // Find the first mesh
        const hit = intersects.find(i => i.object instanceof THREE.Mesh);
        if (!hit) return;
        
        const mesh = hit.object as THREE.Mesh;

        if (selectedObjectRef.current?.mesh === mesh) {
            return; // Already selected
        }

        // Restore previous
        if (selectedObjectRef.current) {
            selectedObjectRef.current.mesh.material = selectedObjectRef.current.originalMaterial;
        }

        // Select new
        const originalMaterial = mesh.material;
        
        // Create highlight material
        let highlightMaterial;
        if (Array.isArray(originalMaterial)) {
             highlightMaterial = (originalMaterial[0] as THREE.MeshStandardMaterial).clone();
        } else {
             highlightMaterial = (originalMaterial as THREE.MeshStandardMaterial).clone();
        }
        highlightMaterial.color.setHex(0xff0000);
        
        mesh.material = highlightMaterial;
        
        selectedObjectRef.current = {
            mesh: mesh,
            originalMaterial: originalMaterial
        };
        
      } else {
        // Deselect
        if (selectedObjectRef.current) {
            selectedObjectRef.current.mesh.material = selectedObjectRef.current.originalMaterial;
            selectedObjectRef.current = null;
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedObjectRef.current) {
        const mesh = selectedObjectRef.current.mesh;
        if (mesh.parent) {
          mesh.parent.remove(mesh);
        }
        selectedObjectRef.current = null;
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', handleKeyDown);

    const mountNode = mountRef.current;

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
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

  // Update Roads
  useEffect(() => {
    if (!sceneRef.current) return;

    // Remove old roads
    if (roadsRef.current) {
      sceneRef.current.remove(roadsRef.current);
    }

    if (roadsGroup) {
      sceneRef.current.add(roadsGroup);
      roadsRef.current = roadsGroup;
    } else {
      roadsRef.current = null;
    }
  }, [roadsGroup]);

  // Update Water
  useEffect(() => {
    if (!sceneRef.current) return;

    // Remove old water
    if (waterRef.current) {
      sceneRef.current.remove(waterRef.current);
    }

    if (waterGroup) {
      sceneRef.current.add(waterGroup);
      waterRef.current = waterGroup;
    } else {
      waterRef.current = null;
    }
  }, [waterGroup]);

  // Update GPX
  useEffect(() => {
    if (!sceneRef.current) return;

    // Remove old GPX
    if (gpxRef.current) {
      sceneRef.current.remove(gpxRef.current);
    }

    if (gpxGroup) {
      sceneRef.current.add(gpxGroup);
      gpxRef.current = gpxGroup;
    } else {
      gpxRef.current = null;
    }
  }, [gpxGroup]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};

export default Scene3D;

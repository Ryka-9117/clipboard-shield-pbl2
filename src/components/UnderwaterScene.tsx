import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

interface UnderwaterSceneProps {
  isDarkMode: boolean;
  onSceneReady?: () => void;
}

// Pre-allocated vectors for zero-GC render loop
const _vec3 = new THREE.Vector3();
const _targetRotation = new THREE.Vector2(0, 0);
const _currentRotation = new THREE.Vector2(0, 0);

export const UnderwaterScene: React.FC<UnderwaterSceneProps> = ({ isDarkMode }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const isDarkRef = useRef<boolean>(isDarkMode);

  useEffect(() => {
    isDarkRef.current = isDarkMode;
  }, [isDarkMode]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();

    // Oceanic Fog matching palette
    const lightFogColor = new THREE.Color(0xd7f3f6); // Serene crystalline light aquamarine
    const darkFogColor = new THREE.Color(0x06141d);  // Abyssal deep trench
    scene.fog = new THREE.FogExp2(isDarkRef.current ? darkFogColor : lightFogColor, 0.04);
    scene.background = isDarkRef.current ? darkFogColor : lightFogColor;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 5.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isDarkRef.current ? 0.95 : 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Studio Environment for PBR Reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. Lighting Rig (Key, Fill, Rim, Aquatic Caustic Beams)
    const keyLight = new THREE.DirectionalLight(0xe0f7fa, 2.5);
    keyLight.position.set(3, 6, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x0f766e, 1.8);
    scene.add(hemiLight);

    const bottomGlowLight = new THREE.PointLight(0x14b8a6, 2.0, 10);
    bottomGlowLight.position.set(0, -2, 1);
    scene.add(bottomGlowLight);

    // 4. Procedural Hero Object: 7-Part Cryptographic Ocean Shield (THREE.Group)
    const shieldGroup = new THREE.Group();

    // Part 1: Outer Refractive Shield Shell (Curved extrusion / lens)
    const shieldShape = new THREE.Shape();
    shieldShape.moveTo(0, 1.3);
    shieldShape.bezierCurveTo(0.9, 1.3, 1.25, 0.9, 1.25, 0.2);
    shieldShape.bezierCurveTo(1.25, -0.6, 0.6, -1.2, 0, -1.5);
    shieldShape.bezierCurveTo(-0.6, -1.2, -1.25, -0.6, -1.25, 0.2);
    shieldShape.bezierCurveTo(-1.25, 0.9, -0.9, 1.3, 0, 1.3);

    const extrudeSettings = {
      depth: 0.18,
      bevelEnabled: true,
      bevelSegments: 8,
      steps: 2,
      bevelSize: 0.08,
      bevelThickness: 0.08,
    };

    const shieldGeom = new THREE.ExtrudeGeometry(shieldShape, extrudeSettings);
    shieldGeom.center();

    // Glass PBR Material with light transmission & sea-tinted attenuation
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x99f6e4,
      metalness: 0.05,
      roughness: 0.08,
      transmission: 0.88,
      ior: 1.48,
      thickness: 1.2,
      attenuationColor: new THREE.Color(0x0d9488),
      attenuationDistance: 1.8,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0.95,
    });
    const glassMesh = new THREE.Mesh(shieldGeom, glassMaterial);
    glassMesh.castShadow = true;
    glassMesh.receiveShadow = true;
    shieldGroup.add(glassMesh);

    // Part 2: Titanium Rim Bezel
    const rimShape = new THREE.Shape();
    rimShape.moveTo(0, 1.38);
    rimShape.bezierCurveTo(0.98, 1.38, 1.35, 0.95, 1.35, 0.2);
    rimShape.bezierCurveTo(1.35, -0.68, 0.65, -1.3, 0, -1.6);
    rimShape.bezierCurveTo(-0.65, -1.3, -1.35, -0.68, -1.35, 0.2);
    rimShape.bezierCurveTo(-1.35, 0.95, -0.98, 1.38, 0, 1.38);

    const rimHole = new THREE.Path();
    rimHole.moveTo(0, 1.28);
    rimHole.bezierCurveTo(0.88, 1.28, 1.22, 0.88, 1.22, 0.2);
    rimHole.bezierCurveTo(1.22, -0.58, 0.58, -1.18, 0, -1.48);
    rimHole.bezierCurveTo(-0.58, -1.18, -1.22, -0.58, -1.22, 0.2);
    rimHole.bezierCurveTo(-1.22, 0.88, -0.88, 1.28, 0, 1.28);
    rimShape.holes.push(rimHole);

    const rimGeom = new THREE.ExtrudeGeometry(rimShape, {
      depth: 0.22,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.04,
    });
    rimGeom.center();

    const titaniumMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.92,
      roughness: 0.22,
    });
    const rimMesh = new THREE.Mesh(rimGeom, titaniumMaterial);
    rimMesh.position.z = 0.02;
    rimMesh.castShadow = true;
    shieldGroup.add(rimMesh);

    // Part 3: Central Cryptographic Core (Glowing Lock / Shield emblem)
    const coreTorusGeom = new THREE.TorusGeometry(0.38, 0.05, 16, 64);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      metalness: 0.7,
      roughness: 0.15,
      emissive: new THREE.Color(0x0891b2),
      emissiveIntensity: 0.6,
    });
    const coreTorus = new THREE.Mesh(coreTorusGeom, coreMaterial);
    coreTorus.position.set(0, 0.1, 0.05);
    shieldGroup.add(coreTorus);

    // Part 4: Inner Cryptographic Lattice Security Nodes (InstancedMesh)
    const nodeCount = 12;
    const nodeGeom = new THREE.SphereGeometry(0.045, 16, 16);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0x5eead4,
      emissive: new THREE.Color(0x14b8a6),
      emissiveIntensity: 0.8,
      metalness: 0.3,
      roughness: 0.1,
    });
    const instancedNodes = new THREE.InstancedMesh(nodeGeom, nodeMat, nodeCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 0.52 + Math.sin(i * 2) * 0.08;
      dummy.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 1.1 + 0.05, 0.06);
      dummy.scale.setScalar(0.9 + (i % 3) * 0.2);
      dummy.updateMatrix();
      instancedNodes.setMatrixAt(i, dummy.matrix);
    }
    instancedNodes.computeBoundingSphere();
    shieldGroup.add(instancedNodes);

    // Part 5: Floating Oceanic Micro-Bubbles (InstancedMesh rising with buoyancy)
    const bubbleCount = 75;
    const bubbleGeom = new THREE.SphereGeometry(0.04, 12, 12);
    const bubbleMat = new THREE.MeshPhysicalMaterial({
      color: 0xd1fae5,
      roughness: 0.05,
      transmission: 0.96,
      ior: 1.1,
      transparent: true,
      opacity: 0.65,
    });
    const bubbleInstanced = new THREE.InstancedMesh(bubbleGeom, bubbleMat, bubbleCount);
    bubbleInstanced.frustumCulled = false;

    interface BubbleData {
      x: number;
      y: number;
      z: number;
      speed: number;
      swayFreq: number;
      swayOffset: number;
      scale: number;
    }
    const bubbles: BubbleData[] = [];
    for (let i = 0; i < bubbleCount; i++) {
      const b: BubbleData = {
        x: (Math.random() - 0.5) * 6,
        y: (Math.random() - 0.5) * 5,
        z: (Math.random() - 0.5) * 3,
        speed: 0.3 + Math.random() * 0.6,
        swayFreq: 1.5 + Math.random() * 2,
        swayOffset: Math.random() * Math.PI * 2,
        scale: 0.4 + Math.random() * 1.0,
      };
      bubbles.push(b);
    }
    scene.add(bubbleInstanced);

    // Part 6: Soft Underwater Contact Shadow Plane
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const shadowCtx = shadowCanvas.getContext('2d')!;
    const shadowGrad = shadowCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
    shadowGrad.addColorStop(0, 'rgba(13, 148, 136, 0.35)');
    shadowGrad.addColorStop(0.6, 'rgba(15, 118, 110, 0.12)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    shadowCtx.fillStyle = shadowGrad;
    shadowCtx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    shadowTex.colorSpace = THREE.SRGBColorSpace;
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(3.5, 3.5),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.5,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2.1;
    scene.add(shadowPlane);

    scene.add(shieldGroup);

    // 5. Pointer Interaction tracking
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      let clientY = 0;
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      const nx = (clientX / window.innerWidth) * 2 - 1;
      const ny = -(clientY / window.innerHeight) * 2 + 1;
      _targetRotation.x = ny * 0.25;
      _targetRotation.y = nx * 0.45;
    };

    window.addEventListener('pointermove', handlePointerMove);

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 6. Animation Loop (Zero-GC, dampening, gentle oceanic buoyancy)
    const clock = new THREE.Clock();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth pointer rotation dampening
      _currentRotation.x = THREE.MathUtils.damp(_currentRotation.x, _targetRotation.x, 3.5, delta);
      _currentRotation.y = THREE.MathUtils.damp(_currentRotation.y, _targetRotation.y, 3.5, delta);

      // Gentle Oceanic Buoyancy & Sway
      const buoyancy = Math.sin(elapsed * 1.2) * 0.08;
      const gentleRoll = Math.sin(elapsed * 0.8) * 0.04;
      shieldGroup.position.y = buoyancy;
      shieldGroup.rotation.x = _currentRotation.x + gentleRoll;
      shieldGroup.rotation.y = _currentRotation.y + Math.sin(elapsed * 0.5) * 0.06;
      shieldGroup.rotation.z = Math.cos(elapsed * 0.9) * 0.03;

      // Internal lattice slow orbit
      coreTorus.rotation.z = elapsed * 0.4;
      instancedNodes.rotation.z = -elapsed * 0.25;

      // Update bubbles
      for (let i = 0; i < bubbleCount; i++) {
        const b = bubbles[i];
        b.y += b.speed * delta;
        b.x += Math.sin(elapsed * b.swayFreq + b.swayOffset) * 0.004;
        if (b.y > 3) {
          b.y = -3;
          b.x = (Math.random() - 0.5) * 6;
        }

        dummy.position.set(b.x, b.y, b.z);
        dummy.scale.setScalar(b.scale);
        dummy.updateMatrix();
        bubbleInstanced.setMatrixAt(i, dummy.matrix);
      }
      bubbleInstanced.instanceMatrix.needsUpdate = true;

      // Theme color smooth transition
      const targetBg = isDarkRef.current ? darkFogColor : lightFogColor;
      if (scene.fog && 'color' in scene.fog) {
        scene.fog.color.lerp(targetBg, delta * 3);
      }
      if (scene.background instanceof THREE.Color) {
        scene.background.lerp(targetBg, delta * 3);
      }
      renderer.toneMappingExposure = THREE.MathUtils.damp(
        renderer.toneMappingExposure,
        isDarkRef.current ? 0.95 : 1.15,
        3.0,
        delta
      );

      renderer.render(scene, camera);
    };

    renderer.compile(scene, camera);
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);

      // Thorough WebGL disposal
      shieldGeom.dispose();
      glassMaterial.dispose();
      rimGeom.dispose();
      titaniumMaterial.dispose();
      coreTorusGeom.dispose();
      coreMaterial.dispose();
      nodeGeom.dispose();
      nodeMat.dispose();
      bubbleGeom.dispose();
      bubbleMat.dispose();
      shadowTex.dispose();
      shadowCanvas.remove();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden"
      aria-hidden="true"
    />
  );
};

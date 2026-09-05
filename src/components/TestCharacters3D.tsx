"use client";

import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
// @ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { AppHeader } from "@/components/AppHeader";

const CLASSES = [
  { id: "fighter", name: "Fighter", tags: ["Melee", "Armored"] },
  { id: "wizard", name: "Wizard", tags: ["Spellcaster", "Arcane"] },
  { id: "rogue", name: "Rogue", tags: ["Stealth", "Sneak Attack"] },
  { id: "barbarian", name: "Barbarian", tags: ["Rage", "Brute"] },
  { id: "cleric", name: "Cleric", tags: ["Divine", "Support"] },
  { id: "druid", name: "Druid", tags: ["Nature", "Shapeshifter"] },
];

const CARD_WIDTH = 160;
const CANVAS_HEIGHT = 180;
const PREVIEW_WIDTH = 320;
const PREVIEW_HEIGHT = 400;

function createFigure(classId: string): THREE.Group {
  const group = new THREE.Group();

  const m = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    pos: [number, number, number],
    rotZ = 0
  ) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.rotation.z = rotZ;
    return mesh;
  };

  let skinColor = 0,
    skinRoughness = 0.85;
  let torsoColor = 0,
    torsoRoughness = 0.9,
    torsoMetalness = 0;
  let legColor = 0,
    legRoughness = 0.9;
  let hasLegRobe = false;

  switch (classId) {
    case "fighter":
      skinColor = 0xe8c99a;
      skinRoughness = 0.8;
      torsoColor = 0x7a8a9a;
      torsoRoughness = 0.3;
      torsoMetalness = 0.8;
      legColor = 0x7a8a9a;
      legRoughness = 0.3;
      break;
    case "wizard":
      skinColor = 0xf0d9c0;
      skinRoughness = 0.85;
      torsoColor = 0x2c3e8c;
      torsoRoughness = 0.9;
      torsoMetalness = 0;
      legColor = 0x2c3e8c;
      legRoughness = 0.9;
      break;
    case "rogue":
      skinColor = 0xc8a882;
      skinRoughness = 0.85;
      torsoColor = 0x1b2a1b;
      torsoRoughness = 0.9;
      torsoMetalness = 0;
      legColor = 0x1b2a1b;
      legRoughness = 0.9;
      break;
    case "barbarian":
      skinColor = 0xd4956a;
      skinRoughness = 0.85;
      torsoColor = 0xd4956a;
      torsoRoughness = 0.85;
      torsoMetalness = 0;
      legColor = 0x4e342e;
      legRoughness = 0.9;
      break;
    case "cleric":
      skinColor = 0xf0d0b0;
      skinRoughness = 0.85;
      torsoColor = 0xe8e0d0;
      torsoRoughness = 0.9;
      torsoMetalness = 0;
      legColor = 0xe8e0d0;
      legRoughness = 0.9;
      hasLegRobe = true;
      break;
    case "druid":
      skinColor = 0xc4956a;
      skinRoughness = 0.85;
      torsoColor = 0x4a5240;
      torsoRoughness = 1.0;
      torsoMetalness = 0;
      legColor = 0x4a5240;
      legRoughness = 1.0;
      hasLegRobe = true;
      break;
  }

  const skinMat = new THREE.MeshStandardMaterial({
    color: skinColor,
    roughness: skinRoughness,
  });
  const torsoMat = new THREE.MeshStandardMaterial({
    color: torsoColor,
    roughness: torsoRoughness,
    metalness: torsoMetalness,
  });
  const legMat = new THREE.MeshStandardMaterial({
    color: legColor,
    roughness: legRoughness,
  });
  const forearmMat =
    classId === "barbarian" ? skinMat : torsoMat;
  const pelvisMat = legMat;

  group.add(
    m(new THREE.BoxGeometry(0.5, 0.5, 0.4), skinMat, [0, 1.5, 0])
  );
  group.add(
    m(new THREE.BoxGeometry(0.2, 0.15, 0.2), skinMat, [0, 1.22, 0])
  );
  group.add(
    m(new THREE.BoxGeometry(0.7, 0.6, 0.35), torsoMat, [0, 0.85, 0])
  );
  group.add(
    m(
      new THREE.BoxGeometry(0.2, 0.35, 0.2),
      torsoMat,
      [-0.47, 0.95, 0],
      0.15
    )
  );
  group.add(
    m(
      new THREE.BoxGeometry(0.2, 0.35, 0.2),
      torsoMat,
      [0.47, 0.95, 0],
      -0.15
    )
  );
  group.add(
    m(
      new THREE.BoxGeometry(0.17, 0.3, 0.17),
      forearmMat,
      [-0.5, 0.6, 0],
      0.1
    )
  );
  group.add(
    m(
      new THREE.BoxGeometry(0.17, 0.3, 0.17),
      forearmMat,
      [0.5, 0.6, 0],
      -0.1
    )
  );
  group.add(
    m(new THREE.BoxGeometry(0.6, 0.2, 0.32), pelvisMat, [0, 0.52, 0])
  );

  if (!hasLegRobe) {
    group.add(
      m(new THREE.BoxGeometry(0.25, 0.4, 0.25), legMat, [
        -0.18,
        0.24,
        0,
      ])
    );
    group.add(
      m(new THREE.BoxGeometry(0.25, 0.4, 0.25), legMat, [
        0.18,
        0.24,
        0,
      ])
    );
    group.add(
      m(new THREE.BoxGeometry(0.22, 0.38, 0.22), legMat, [
        -0.18,
        -0.12,
        0,
      ])
    );
    group.add(
      m(new THREE.BoxGeometry(0.22, 0.38, 0.22), legMat, [
        0.18,
        -0.12,
        0,
      ])
    );
    group.add(
      m(new THREE.BoxGeometry(0.22, 0.1, 0.32), legMat, [
        -0.18,
        -0.36,
        0.05,
      ])
    );
    group.add(
      m(new THREE.BoxGeometry(0.22, 0.1, 0.32), legMat, [
        0.18,
        -0.36,
        0.05,
      ])
    );
  } else {
    group.add(
      m(new THREE.BoxGeometry(0.65, 0.85, 0.35), legMat, [0, 0.0, 0])
    );
  }

  if (classId === "fighter") {
    const helmetMat = new THREE.MeshStandardMaterial({
      color: 0x6a7a8a,
      roughness: 0.2,
      metalness: 0.9,
    });
    const swordMat = new THREE.MeshStandardMaterial({
      color: 0xc0c0c0,
      roughness: 0.1,
      metalness: 1.0,
    });
    group.add(
      m(new THREE.BoxGeometry(0.54, 0.3, 0.44), helmetMat, [
        0,
        1.72,
        0,
      ])
    );
    group.add(
      m(new THREE.BoxGeometry(0.06, 0.8, 0.04), swordMat, [
        0.65,
        0.6,
        0,
      ])
    );
    group.add(
      m(new THREE.BoxGeometry(0.25, 0.05, 0.04), swordMat, [
        0.65,
        0.2,
        0,
      ])
    );
  } else if (classId === "wizard") {
    const hatMat = new THREE.MeshStandardMaterial({
      color: 0x1a2570,
      roughness: 0.9,
    });
    const staffMat = new THREE.MeshStandardMaterial({
      color: 0x6d4c41,
      roughness: 0.8,
    });
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0x64b5f6,
      roughness: 0.1,
      metalness: 0.3,
      emissive: 0x1565c0,
      emissiveIntensity: 0.4,
    });
    group.add(
      m(new THREE.ConeGeometry(0.28, 0.55, 4), hatMat, [0, 1.85, 0])
    );
    group.add(
      m(new THREE.CylinderGeometry(0.4, 0.42, 0.06, 8), hatMat, [
        0,
        1.62,
        0,
      ])
    );
    group.add(
      m(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6), staffMat, [
        -0.65,
        0.6,
        0,
      ])
    );
    group.add(
      m(new THREE.SphereGeometry(0.1, 8, 8), orbMat, [-0.65, 1.25, 0])
    );
  } else if (classId === "rogue") {
    const hoodMat = new THREE.MeshStandardMaterial({
      color: 0x152015,
      roughness: 0.9,
    });
    const daggerMat = new THREE.MeshStandardMaterial({
      color: 0xd0d0d0,
      roughness: 0.15,
      metalness: 0.9,
    });
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0x5d4037,
      roughness: 0.9,
    });
    group.add(
      m(new THREE.BoxGeometry(0.56, 0.3, 0.46), hoodMat, [
        0,
        1.62,
        -0.03,
      ])
    );
    group.add(
      m(new THREE.BoxGeometry(0.04, 0.45, 0.03), daggerMat, [
        0.6,
        0.75,
        0.1,
      ])
    );
    group.add(
      m(new THREE.BoxGeometry(0.06, 0.15, 0.06), handleMat, [
        0.6,
        0.52,
        0.1,
      ])
    );
  } else if (classId === "barbarian") {
    const furMat = new THREE.MeshStandardMaterial({
      color: 0x5d4037,
      roughness: 1.0,
    });
    const axeHandleMat = new THREE.MeshStandardMaterial({
      color: 0x795548,
      roughness: 0.8,
    });
    const axeHeadMat = new THREE.MeshStandardMaterial({
      color: 0x9e9e9e,
      roughness: 0.2,
      metalness: 0.8,
    });
    const helmetMat = new THREE.MeshStandardMaterial({
      color: 0x5d4037,
      roughness: 0.8,
    });
    const hornMat = new THREE.MeshStandardMaterial({
      color: 0xf5f5f5,
      roughness: 0.8,
    });
    group.add(
      m(new THREE.BoxGeometry(0.74, 0.15, 0.38), furMat, [0, 0.62, 0])
    );
    group.add(
      m(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6), axeHandleMat, [
        0.65,
        0.8,
        0,
      ])
    );
    group.add(
      m(new THREE.BoxGeometry(0.35, 0.3, 0.06), axeHeadMat, [
        0.65,
        1.25,
        0,
      ])
    );
    group.add(
      m(new THREE.BoxGeometry(0.54, 0.28, 0.44), helmetMat, [
        0,
        1.72,
        0,
      ])
    );
    group.add(
      m(
        new THREE.CylinderGeometry(0.04, 0.02, 0.3, 6),
        hornMat,
        [-0.3, 1.92, 0],
        0.4
      )
    );
    group.add(
      m(
        new THREE.CylinderGeometry(0.04, 0.02, 0.3, 6),
        hornMat,
        [0.3, 1.92, 0],
        -0.4
      )
    );
  } else if (classId === "cleric") {
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.2,
      metalness: 0.8,
    });
    const maceMat = new THREE.MeshStandardMaterial({
      color: 0x8d6e63,
      roughness: 0.8,
    });
    const maceHeadMat = new THREE.MeshStandardMaterial({
      color: 0x9e9e9e,
      roughness: 0.2,
      metalness: 0.8,
    });
    group.add(
      m(new THREE.BoxGeometry(0.72, 0.06, 0.37), goldMat, [0, 0.55, 0])
    );
    group.add(
      m(new THREE.BoxGeometry(0.18, 0.22, 0.04), goldMat, [0, 0.88, 0.2])
    );
    group.add(
      m(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 6), maceMat, [
        0.65,
        0.7,
        0,
      ])
    );
    group.add(
      m(new THREE.SphereGeometry(0.12, 8, 8), maceHeadMat, [
        0.65,
        1.1,
        0,
      ])
    );
  } else if (classId === "druid") {
    const cloakMat = new THREE.MeshStandardMaterial({
      color: 0x2e5c1e,
      roughness: 1.0,
    });
    const antlerMat = new THREE.MeshStandardMaterial({
      color: 0x8d6e63,
      roughness: 0.8,
    });
    const staffMat = new THREE.MeshStandardMaterial({
      color: 0x4e342e,
      roughness: 0.95,
    });
    const vineMat = new THREE.MeshStandardMaterial({
      color: 0x2e7d32,
      roughness: 1.0,
      transparent: true,
      opacity: 0.6,
    });
    group.add(
      m(new THREE.BoxGeometry(0.8, 0.7, 0.08), cloakMat, [
        0,
        0.85,
        -0.2,
      ])
    );
    group.add(
      m(
        new THREE.CylinderGeometry(0.04, 0.02, 0.4, 6),
        antlerMat,
        [-0.2, 1.75, 0],
        0.3
      )
    );
    group.add(
      m(
        new THREE.CylinderGeometry(0.04, 0.02, 0.4, 6),
        antlerMat,
        [0.2, 1.75, 0],
        -0.3
      )
    );
    group.add(
      m(new THREE.CylinderGeometry(0.04, 0.05, 1.1, 6), staffMat, [
        -0.62,
        0.65,
        0,
      ])
    );
    group.add(
      m(new THREE.CylinderGeometry(0.055, 0.055, 0.8, 6), vineMat, [
        -0.62,
        0.65,
        0,
      ])
    );
    group.add(
      m(
        new THREE.CylinderGeometry(0.03, 0.03, 0.25, 6),
        staffMat,
        [-0.62, 1.25, -0.1],
        0.2
      )
    );
    group.add(
      m(
        new THREE.CylinderGeometry(0.03, 0.03, 0.25, 6),
        staffMat,
        [-0.62, 1.25, 0.1],
        -0.2
      )
    );
  }

  return group;
}

function disposeGroup(group: THREE.Group) {
  group.traverse((child: THREE.Object3D) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];
      materials.forEach((mat: THREE.Material) => {
        if (mat instanceof THREE.Material) {
          mat.dispose();
        }
      });
    }
  });
}

function setupLighting(scene: THREE.Scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
  keyLight.position.set(2, 4, 3);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x4488ff, 0.4);
  fillLight.position.set(-2, 2, -1);
  scene.add(fillLight);

  const bounceLight = new THREE.PointLight(0xff6644, 0.3, 8);
  bounceLight.position.set(0, -1, 2);
  scene.add(bounceLight);
}

export default function TestCharacters3D() {
  const [selectedClass, setSelectedClass] = useState("fighter");
  const selectedClassRef = useRef(selectedClass);
  const cardCanvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    selectedClassRef.current = selectedClass;
  }, [selectedClass]);

  const cardScenesRef = useRef<
    Map<
      string,
      {
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        renderer: THREE.WebGLRenderer;
        figure: THREE.Group;
      }
    >
  >(new Map());

  const previewDataRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    figure: THREE.Group | null;
    orbitLight: THREE.PointLight;
  } | null>(null);

  const animFrameRef = useRef<number>(0);
  const clockRef = useRef(new THREE.Clock());

  useEffect(() => {
    const scenes = new Map();

    CLASSES.forEach((cls, index) => {
      const canvas = cardCanvasRefs.current[index];
      if (!canvas) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        45,
        CARD_WIDTH / CANVAS_HEIGHT,
        0.1,
        100
      );
      camera.position.set(0, 1.2, 3.5);
      camera.lookAt(0, 0.8, 0);

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
      });
      renderer.setSize(CARD_WIDTH, CANVAS_HEIGHT);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      setupLighting(scene);

      const figure = createFigure(cls.id);
      scene.add(figure);

      scenes.set(cls.id, { scene, camera, renderer, figure });
    });

    cardScenesRef.current = scenes;

    return () => {
      scenes.forEach((handle) => {
        disposeGroup(handle.figure);
        handle.renderer.dispose();
      });
    };
  }, []);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      PREVIEW_WIDTH / PREVIEW_HEIGHT,
      0.1,
      100
    );
    camera.position.set(0, 1.2, 3.5);
    camera.lookAt(0, 0.8, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(PREVIEW_WIDTH, PREVIEW_HEIGHT);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    setupLighting(scene);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.minPolarAngle = Math.PI / 4;
    controls.maxPolarAngle = Math.PI / 2;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.5;
    controls.target.set(0, 0.8, 0);
    controls.update();

    const platformGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.05, 32);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.6,
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.set(0, -0.4, 0);
    scene.add(platform);

    const orbitLight = new THREE.PointLight(0xffffff, 0.6, 0);
    scene.add(orbitLight);

    const figure = createFigure(selectedClassRef.current);
    figure.scale.setScalar(1.4);
    scene.add(figure);

    previewDataRef.current = {
      scene,
      camera,
      renderer,
      controls,
      figure,
      orbitLight,
    };

    return () => {
      disposeGroup(figure);
      renderer.dispose();
      controls.dispose();
      previewDataRef.current = null;
    };
  }, []);

  useEffect(() => {
    const data = previewDataRef.current;
    if (!data) return;

    if (data.figure) {
      disposeGroup(data.figure);
      data.scene.remove(data.figure);
    }

    const figure = createFigure(selectedClass);
    figure.scale.setScalar(1.4);
    data.scene.add(figure);
    data.figure = figure;
  }, [selectedClass]);

  useEffect(() => {
    const clock = clockRef.current;
    let running = true;

    function animate() {
      if (!running) return;
      animFrameRef.current = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      cardScenesRef.current.forEach((handle) => {
        handle.figure.position.y = Math.sin(elapsed * 0.8) * 0.04;
        handle.figure.rotation.y += 0.003;
        handle.renderer.render(handle.scene, handle.camera);
      });

      if (previewDataRef.current && previewDataRef.current.figure) {
        const p = previewDataRef.current;
        const figure = p.figure!;
        figure.position.y = Math.sin(elapsed * 0.8) * 0.04;
        figure.rotation.y += 0.003;

        p.controls.update();

        const angle = (elapsed / 6) * Math.PI * 2;
        p.orbitLight.position.x = Math.cos(angle) * 2;
        p.orbitLight.position.y = 1.5;
        p.orbitLight.position.z = Math.sin(angle) * 2;

        p.renderer.render(p.scene, p.camera);
      }
    }

    animate();

    return () => {
      running = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#111111]">
      <AppHeader title="Test 3D" subtitle="Character Figures" />

      <main className="mx-auto max-w-lg px-4 py-4 pb-32">
        <div className="flex gap-4 overflow-x-auto pb-4">
          {CLASSES.map((cls, index) => (
            <div
              key={cls.id}
              className={`w-[160px] h-[240px] shrink-0 rounded-[14px] bg-[#1a1a1a] flex flex-col overflow-hidden cursor-pointer transition-all ${
                selectedClass === cls.id ? "ring-2 ring-white" : ""
              }`}
              onClick={() => setSelectedClass(cls.id)}
            >
              <canvas
                ref={(el) => {
                  cardCanvasRefs.current[index] = el;
                }}
                width={CARD_WIDTH}
                height={CANVAS_HEIGHT}
                className="block w-full"
              />
              <div className="h-[60px] flex flex-col items-center justify-center p-2">
                <h3 className="text-white text-sm font-bold">
                  {cls.name}
                </h3>
                <div className="flex gap-1 mt-1">
                  {cls.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] text-gray-400 bg-white/10 rounded px-1.5 py-0.5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <div className="w-[320px] h-[400px] rounded-[14px] bg-[#1a1a1a] overflow-hidden">
            <canvas
              ref={previewCanvasRef}
              width={PREVIEW_WIDTH}
              height={PREVIEW_HEIGHT}
              className="block w-full"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

import * as THREE from "three";
import * as CANNON from "cannon-es";
import { dieShape, topValue, type DieShape, type ShapeKind } from "./shapes";

/**
 * The 3D dice tray: three.js draws the dice, cannon-es throws them.
 * Loaded only when the tray first opens, so the sheet stays light.
 */

const KINDS: ShapeKind[] = ["d4", "d6", "d8", "d10", "d12", "d20", "pct"];
/** Number size on a face, as a share of the face texture. */
const FONT: Record<ShapeKind, number> = { d4: 0.2, d6: 0.5, d8: 0.3, d10: 0.3, d12: 0.36, d20: 0.27, pct: 0.24 };
const TEX = 128;

interface Die {
  id: number;
  kind: ShapeKind;
  mesh: THREE.Mesh;
  edges: THREE.LineSegments;
  body: CANNON.Body;
  chip: HTMLDivElement;
  value: number | null;
  rolling: boolean;
  started: number;
  nudges: number;
}

interface Built {
  shape: DieShape;
  geometry: THREE.BufferGeometry;
  faceUV: [number, number][][];
}

function buildGeometry(shape: DieShape): Built {
  const pos: number[] = [], nor: number[] = [], uv: number[] = [];
  const faceUV: [number, number][][] = [];
  const geometry = new THREE.BufferGeometry();
  let start = 0;
  shape.faces.forEach((face, fi) => {
    const n = shape.normals[fi];
    const pts = face.map((i) => shape.verts[i]);
    const c = pts.reduce((s, p) => s.add(p), new THREE.Vector3()).multiplyScalar(1 / pts.length);
    const u = pts[0].clone().sub(c).normalize();
    const w = new THREE.Vector3().crossVectors(n, u);
    const proj = pts.map((p) => {
      const d = p.clone().sub(c);
      return [d.dot(u), d.dot(w)] as const;
    });
    const r = Math.max(...proj.map(([a, b]) => Math.hypot(a, b)));
    const uvs = proj.map(([a, b]) => [0.5 + (a / r) * 0.5, 0.5 + (b / r) * 0.5] as [number, number]);
    faceUV.push(uvs);
    for (let k = 1; k < face.length - 1; k++)
      for (const j of [0, k, k + 1]) {
        pos.push(pts[j].x, pts[j].y, pts[j].z);
        nor.push(n.x, n.y, n.z);
        uv.push(uvs[j][0], uvs[j][1]);
      }
    const count = (face.length - 2) * 3;
    geometry.addGroup(start, count, fi);
    start += count;
  });
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  return { shape, geometry, faceUV };
}

function faceTexture(b: Built, fi: number, fill: string, ink: string): THREE.CanvasTexture {
  const cv = document.createElement("canvas");
  cv.width = cv.height = TEX;
  const g = cv.getContext("2d")!;
  g.fillStyle = fill;
  g.fillRect(0, 0, TEX, TEX);
  g.fillStyle = ink;
  g.textAlign = "center";
  g.textBaseline = "middle";
  const size = FONT[b.shape.kind];
  g.font = `800 ${Math.round(TEX * size)}px Inter, system-ui, sans-serif`;
  const draw = (text: string, x: number, y: number, rot: number) => {
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.fillText(text, 0, 0);
    // Underline 6 and 9 so they can't be mixed up.
    if (text === "6" || text === "9") g.fillRect(-TEX * 0.08, TEX * size * 0.42, TEX * 0.16, TEX * 0.025);
    g.restore();
  };
  if (b.shape.cornerValues) {
    // d4: each corner's number sits near that corner, pointing at it.
    b.shape.faces[fi].forEach((vi, k) => {
      const dx = b.faceUV[fi][k][0] * TEX - TEX / 2, dy = (1 - b.faceUV[fi][k][1]) * TEX - TEX / 2;
      draw(String(b.shape.cornerValues![vi]), TEX / 2 + dx * 0.56, TEX / 2 + dy * 0.56, Math.atan2(dx, -dy));
    });
  } else {
    draw(b.shape.labels[fi], TEX / 2, TEX / 2, 0);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export class DiceEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  private world: CANNON.World;
  private walls: CANNON.Body[] = [];
  private diceMat = new CANNON.Material("dice");
  private built = {} as Record<ShapeKind, Built>;
  private materials = {} as Record<ShapeKind, THREE.Material[]>;
  private ink = "#111111";
  private dice = new Map<number, Die>();
  private nextId = 1;
  private bounds = { x: 6, z0: -4, z1: 4 };
  private raf = 0;
  private last = 0;
  private resizeObserver: ResizeObserver;

  constructor(private host: HTMLElement, private chips: HTMLElement, private onSettle: () => void) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    host.prepend(this.renderer.domElement);

    this.camera.position.set(0, 21, 6.5);
    this.camera.lookAt(0, 0, 0.6);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a8a, 2.2));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(-6, 18, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 50 });
    this.scene.add(sun);
    const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.14 }));
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    this.scene.add(floorMesh);

    this.world = new CANNON.World({ gravity: new CANNON.Vec3(0, -50, 0), allowSleep: true });
    (this.world.solver as CANNON.GSSolver).iterations = 16;
    const floorMat = new CANNON.Material("floor"), wallMat = new CANNON.Material("wall");
    this.world.addContactMaterial(new CANNON.ContactMaterial(floorMat, this.diceMat, { friction: 0.04, restitution: 0.45 }));
    this.world.addContactMaterial(new CANNON.ContactMaterial(wallMat, this.diceMat, { friction: 0, restitution: 0.75 }));
    this.world.addContactMaterial(new CANNON.ContactMaterial(this.diceMat, this.diceMat, { friction: 0.02, restitution: 0.5 }));
    const floor = new CANNON.Body({ mass: 0, material: floorMat, shape: new CANNON.Plane() });
    floor.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    this.world.addBody(floor);
    for (let i = 0; i < 4; i++) {
      const wall = new CANNON.Body({ mass: 0, material: wallMat, shape: new CANNON.Plane() });
      this.world.addBody(wall);
      this.walls.push(wall);
    }

    for (const k of KINDS) this.built[k] = buildGeometry(dieShape(k));
    this.setColors(getComputedStyle(host).getPropertyValue("--color-surface").trim() || "#ffffff", getComputedStyle(host).getPropertyValue("--color-text-primary").trim() || "#111111");

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  /** Stops drawing while the tray is closed. */
  setActive(on: boolean) {
    if (on && !this.raf) {
      this.last = performance.now();
      this.resize();
      this.raf = requestAnimationFrame(this.frame);
    } else if (!on && this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  /** Die colours follow the theme: face colour and number colour. */
  setColors(fill: string, ink: string) {
    this.ink = ink;
    for (const k of KINDS) {
      this.materials[k]?.forEach((m) => {
        (m as THREE.MeshLambertMaterial).map?.dispose();
        m.dispose();
      });
      this.materials[k] = this.built[k].shape.faces.map((_, fi) => new THREE.MeshLambertMaterial({ map: faceTexture(this.built[k], fi, fill, ink) }));
    }
    for (const d of this.dice.values()) {
      d.mesh.material = this.materials[d.kind];
      (d.edges.material as THREE.LineBasicMaterial).color.set(ink);
    }
  }

  private fitWalls() {
    const ray = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const at = (x: number, y: number) => {
      const hit = new THREE.Vector3();
      ray.setFromCamera(new THREE.Vector2(x, y), this.camera);
      ray.ray.intersectPlane(plane, hit);
      return hit;
    };
    const top = at(0, 0.9), bottom = at(0, -0.9), corner = at(0.9, -0.9);
    this.bounds = { x: Math.abs(corner.x) - 0.2, z0: top.z, z1: bottom.z };
    const Y = new CANNON.Vec3(0, 1, 0);
    const [l, r, back, front] = this.walls;
    l.position.set(-this.bounds.x, 0, 0);
    l.quaternion.setFromAxisAngle(Y, Math.PI / 2);
    r.position.set(this.bounds.x, 0, 0);
    r.quaternion.setFromAxisAngle(Y, -Math.PI / 2);
    back.position.set(0, 0, this.bounds.z0);
    back.quaternion.set(0, 0, 0, 1);
    front.position.set(0, 0, this.bounds.z1);
    front.quaternion.setFromAxisAngle(Y, Math.PI);
  }

  resize() {
    const w = this.host.clientWidth, h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 1 ? 46 : 36;
    this.camera.updateProjectionMatrix();
    this.fitWalls();
  }

  /** Puts a new die in the tray (not thrown yet). Returns its id. */
  add(kind: ShapeKind): number {
    const b = this.built[kind];
    const mesh = new THREE.Mesh(b.geometry, this.materials[kind]);
    mesh.castShadow = true;
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(b.geometry, 10), new THREE.LineBasicMaterial({ color: this.ink, transparent: true, opacity: 0.55 }));
    mesh.add(edges);
    mesh.visible = false;
    this.scene.add(mesh);
    const body = new CANNON.Body({
      mass: 1,
      material: this.diceMat,
      shape: new CANNON.ConvexPolyhedron({ vertices: b.shape.verts.map((p) => new CANNON.Vec3(p.x, p.y, p.z)), faces: b.shape.faces }),
      linearDamping: 0.25,
      angularDamping: 0.2,
      sleepSpeedLimit: 0.2,
      sleepTimeLimit: 0.25,
    });
    this.world.addBody(body);
    const chip = document.createElement("div");
    chip.className = "dice-chip";
    chip.style.opacity = "0";
    this.chips.appendChild(chip);
    const id = this.nextId++;
    const die: Die = { id, kind, mesh, edges, body, chip, value: null, rolling: false, started: 0, nudges: 0 };
    mesh.userData.dieId = id;
    this.dice.set(id, die);
    return id;
  }

  /** Throws these dice from the left side of the tray. */
  throw(ids: number[]) {
    const list = ids.map((id) => this.dice.get(id)).filter((d): d is Die => !!d);
    const n = list.length;
    const span = Math.max(1, this.bounds.z1 - this.bounds.z0 - 2);
    list.forEach((d, i) => {
      const b = d.body;
      b.position.set(-this.bounds.x + 1.2 + (i % 3) * 0.9, 2.5 + Math.floor(i / 3) * 1.4, this.bounds.z0 + 1 + ((i + 0.5) / n) * span + (Math.random() - 0.5) * 0.6);
      b.quaternion.setFromEuler(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28);
      b.velocity.set(7 + Math.random() * 7, -4 - Math.random() * 4, (Math.random() - 0.5) * 8);
      b.angularVelocity.set((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40);
      b.wakeUp();
      d.mesh.visible = true;
      d.value = null;
      d.rolling = true;
      d.started = performance.now();
      d.nudges = 0;
      d.chip.style.opacity = "0";
    });
  }

  /** The face value a die landed on, or null while it rolls. */
  valueOf(id: number): number | null {
    return this.dice.get(id)?.value ?? null;
  }

  /** Text and look of the small number shown over a die. */
  label(id: number, text: string, dropped = false) {
    const d = this.dice.get(id);
    if (!d) return;
    d.chip.textContent = text;
    d.chip.classList.toggle("dice-chip-dropped", dropped);
  }

  remove(ids: number[]) {
    for (const id of ids) {
      const d = this.dice.get(id);
      if (!d) continue;
      this.scene.remove(d.mesh);
      d.edges.geometry.dispose();
      (d.edges.material as THREE.Material).dispose();
      this.world.removeBody(d.body);
      d.chip.remove();
      this.dice.delete(id);
    }
  }

  /** The die under a tap, or null. */
  pick(clientX: number, clientY: number): number | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1), this.camera);
    const hit = ray.intersectObjects([...this.dice.values()].map((d) => d.mesh), false)[0];
    return hit ? (hit.object.userData.dieId as number) : null;
  }

  private read(d: Die): { flat: boolean; value: number } {
    const q = new THREE.Quaternion(d.body.quaternion.x, d.body.quaternion.y, d.body.quaternion.z, d.body.quaternion.w);
    const shape = this.built[d.kind].shape;
    const ys = shape.normals.map((n) => n.clone().applyQuaternion(q).y);
    const corners = shape.cornerValues ? shape.verts.map((p) => p.clone().applyQuaternion(q).y) : undefined;
    // Lying flat: one face points straight down.
    return { flat: Math.min(...ys) < -0.97, value: topValue(shape, ys, corners) };
  }

  private frame = (now: number) => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.world.step(1 / 60, dt, 4);
    let settled = false;
    for (const d of this.dice.values()) {
      d.mesh.position.set(d.body.position.x, d.body.position.y, d.body.position.z);
      d.mesh.quaternion.set(d.body.quaternion.x, d.body.quaternion.y, d.body.quaternion.z, d.body.quaternion.w);
      if (!d.rolling) continue;
      const still = d.body.sleepState === CANNON.Body.SLEEPING || (d.body.velocity.length() < 0.05 && d.body.angularVelocity.length() < 0.05);
      const late = now - d.started > 6000;
      if (!still && !late) continue;
      const r = this.read(d);
      if (!r.flat && !late && d.nudges < 3) {
        // Leaning on another die or a wall: a small push, like tapping the table.
        d.nudges++;
        d.body.wakeUp();
        d.body.velocity.set((Math.random() - 0.5) * 4, 5, (Math.random() - 0.5) * 4);
        d.body.angularVelocity.set((Math.random() - 0.5) * 12, 0, (Math.random() - 0.5) * 12);
        continue;
      }
      d.value = r.value;
      d.rolling = false;
      settled = true;
    }
    if (settled) this.onSettle();
    const p = new THREE.Vector3();
    const w = this.host.clientWidth, h = this.host.clientHeight;
    for (const d of this.dice.values()) {
      if (d.rolling || d.value === null) {
        d.chip.style.opacity = "0";
        continue;
      }
      p.copy(d.mesh.position);
      p.y += 1.3;
      p.z -= 1.0;
      p.project(this.camera);
      d.chip.style.left = `${((p.x + 1) / 2) * w}px`;
      d.chip.style.top = `${((1 - p.y) / 2) * h}px`;
      d.chip.style.opacity = "1";
    }
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.frame);
  };

  dispose() {
    this.setActive(false);
    this.resizeObserver.disconnect();
    this.remove([...this.dice.keys()]);
    for (const k of KINDS) {
      this.built[k].geometry.dispose();
      this.materials[k].forEach((m) => {
        (m as THREE.MeshLambertMaterial).map?.dispose();
        m.dispose();
      });
    }
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

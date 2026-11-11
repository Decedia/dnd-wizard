import { Vector3 } from "three";

/**
 * Shapes of the seven dice: corners, faces, and the number on each face.
 * "pct" is the tens die of a d100 (faces 00 to 90).
 */
export type ShapeKind = "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "pct";

export interface DieShape {
  kind: ShapeKind;
  verts: Vector3[];
  /** Corner indices of each face, counter-clockwise seen from outside. */
  faces: number[][];
  /** Outward unit normal of each face. */
  normals: Vector3[];
  /** Number each face counts as (d10 and pct: 0-9). Empty for the d4. */
  values: number[];
  /** Text printed on each face. */
  labels: string[];
  /** d4 only: the number at each corner; the corner pointing up is the roll. */
  cornerValues?: number[];
}

const PHI = (1 + Math.sqrt(5)) / 2;
const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
const centroid = (pts: Vector3[]) => pts.reduce((s, p) => s.add(p), new Vector3()).multiplyScalar(1 / pts.length);

/** Faces of a solid whose faces are all equilateral triangles (d4, d8, d20). */
function triangles(verts: Vector3[]): number[][] {
  let edge = Infinity;
  for (let i = 0; i < verts.length; i++) for (let j = i + 1; j < verts.length; j++) edge = Math.min(edge, verts[i].distanceTo(verts[j]));
  const adj = (i: number, j: number) => Math.abs(verts[i].distanceTo(verts[j]) - edge) < edge * 1e-3;
  const out: number[][] = [];
  for (let i = 0; i < verts.length; i++)
    for (let j = i + 1; j < verts.length; j++)
      for (let k = j + 1; k < verts.length; k++) if (adj(i, j) && adj(j, k) && adj(i, k)) out.push([i, j, k]);
  return out;
}

/** For each direction, the face made of the corners furthest along it, in order around it. */
function facesFromNormals(verts: Vector3[], normals: Vector3[]): number[][] {
  return normals.map((n0) => {
    const n = n0.clone().normalize();
    const far = Math.max(...verts.map((p) => p.dot(n)));
    const idx = verts.map((_, i) => i).filter((i) => verts[i].dot(n) > far - 1e-4);
    const c = centroid(idx.map((i) => verts[i].clone()));
    const u = verts[idx[0]].clone().sub(c).normalize();
    const w = new Vector3().crossVectors(n, u);
    const angle = (i: number) => {
      const p = verts[i].clone().sub(c);
      return Math.atan2(p.dot(w), p.dot(u));
    };
    return idx.sort((a, b) => angle(a) - angle(b));
  });
}

/** Counter-clockwise seen from outside, which the physics engine needs. */
function outward(verts: Vector3[], face: number[]): number[] {
  const [a, b, c] = face.map((i) => verts[i]);
  const n = new Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a));
  return n.dot(centroid(face.map((i) => verts[i].clone()))) < 0 ? face.slice().reverse() : face;
}

/** Numbers so opposite faces add up the way real dice do (d6: 7, d20: 21, d10: 9). */
function oppositeValues(normals: Vector3[], first: number, sum: number): number[] {
  const vals: (number | null)[] = normals.map(() => null);
  let next = first;
  normals.forEach((n, i) => {
    if (vals[i] !== null) return;
    vals[i] = next;
    const j = normals.findIndex((m, k) => k !== i && vals[k] === null && m.dot(n) < -0.99);
    if (j >= 0) vals[j] = sum - next;
    next++;
  });
  return vals as number[];
}

/** Size of each die (distance from centre to corner). */
export const DIE_SIZE: Record<ShapeKind, number> = { d4: 1.2, d6: 0.95, d8: 1.05, d10: 1.0, d12: 1.08, d20: 1.15, pct: 1.0 };

export function dieShape(kind: ShapeKind): DieShape {
  let verts: Vector3[];
  let faces: number[][];
  if (kind === "d4") {
    verts = [v(1, 1, 1), v(1, -1, -1), v(-1, 1, -1), v(-1, -1, 1)];
    faces = triangles(verts);
  } else if (kind === "d6") {
    verts = [];
    for (let i = 0; i < 8; i++) verts.push(v(i & 4 ? 1 : -1, i & 2 ? 1 : -1, i & 1 ? 1 : -1));
    faces = facesFromNormals(verts, [v(1, 0, 0), v(-1, 0, 0), v(0, 1, 0), v(0, -1, 0), v(0, 0, 1), v(0, 0, -1)]);
  } else if (kind === "d8") {
    verts = [v(1, 0, 0), v(-1, 0, 0), v(0, 1, 0), v(0, -1, 0), v(0, 0, 1), v(0, 0, -1)];
    faces = triangles(verts);
  } else if (kind === "d10" || kind === "pct") {
    // Pentagonal trapezohedron: two tips and a zig-zag ring of ten corners.
    // The tip height that keeps each kite-shaped face flat follows from the ring offset z.
    const z = 0.105, cos = Math.cos(Math.PI / 5), h = (z * (1 + cos)) / (1 - cos);
    verts = [v(0, h, 0), v(0, -h, 0)];
    for (let i = 0; i < 10; i++) verts.push(v(Math.cos((i * Math.PI) / 5), i % 2 ? -z : z, Math.sin((i * Math.PI) / 5)));
    faces = [];
    for (let k = 0; k < 5; k++) {
      faces.push([0, 2 + 2 * k, 3 + 2 * k, 2 + ((2 * k + 2) % 10)]);
      faces.push([1, 3 + 2 * k, 2 + ((2 * k + 2) % 10), 2 + ((2 * k + 3) % 10)]);
    }
  } else {
    const ico: Vector3[] = [];
    for (const a of [-1, 1]) for (const b of [-PHI, PHI]) ico.push(v(0, a, b), v(a, b, 0), v(b, 0, a));
    const tris = triangles(ico);
    if (kind === "d20") {
      verts = ico;
      faces = tris;
    } else {
      // The d12 is the icosahedron's dual: a corner at the middle of each triangle.
      verts = tris.map((t) => centroid(t.map((i) => ico[i].clone())));
      faces = facesFromNormals(verts, ico);
    }
  }
  faces = faces.map((f) => outward(verts, f));
  const r = Math.max(...verts.map((p) => p.length()));
  verts = verts.map((p) => p.clone().multiplyScalar(DIE_SIZE[kind] / r));
  const normals = faces.map((f) => {
    const [a, b, c] = f.map((i) => verts[i]);
    return new Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a)).normalize();
  });

  if (kind === "d4") return { kind, verts, faces, normals, values: [], labels: [], cornerValues: [1, 2, 3, 4] };
  const values =
    kind === "d6" ? oppositeValues(normals, 1, 7)
    : kind === "d8" ? oppositeValues(normals, 1, 9)
    : kind === "d12" ? oppositeValues(normals, 1, 13)
    : kind === "d20" ? oppositeValues(normals, 1, 21)
    : oppositeValues(normals, 0, 9);
  const labels = values.map((n) => (kind === "pct" ? (n === 0 ? "00" : String(n * 10)) : String(n)));
  return { kind, verts, faces, normals, values, labels };
}

/** The face a die shows on top, given each face normal's height after it lands. */
export function topValue(shape: DieShape, normalYs: number[], cornerYs?: number[]): number {
  if (shape.cornerValues && cornerYs) return shape.cornerValues[cornerYs.indexOf(Math.max(...cornerYs))];
  return shape.values[normalYs.indexOf(Math.max(...normalYs))];
}

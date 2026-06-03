import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const QUALITY = {
  low: { rings: 12, segments: 24, skirtLayers: 3 },
  medium: { rings: 20, segments: 36, skirtLayers: 5 },
  high: { rings: 32, segments: 48, skirtLayers: 8 },
};

/**
 * Procedural Vocaloid-style dress mesh (torus skirt + bodice + twin-tail ribbons)
 */
export async function meshGenerate({ root, out, quality = "medium" }) {
  const q = QUALITY[quality] || QUALITY.medium;
  const { vertices, normals, uvs, indices, bones } = buildVeilClothingMesh(q);
  const payload = {
    meta: {
      name: "veil_clothing_optimized",
      version: 1,
      quality,
      generator: "veil-lumen/mesh-generate",
      createdAt: new Date().toISOString(),
      character: "Veil Lumen",
      style: "vocaloid-stage-outfit",
    },
    material: {
      baseColor: [0, 0.898, 1, 1],
      accentColor: [0.878, 0.251, 0.984, 1],
      emissive: [0.05, 0.12, 0.25],
      roughness: 0.35,
      metalness: 0.15,
    },
    bones,
    vertices,
    normals,
    uvs,
    indices,
  };

  const outPath = resolve(root, out);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(payload));

  return {
    path: outPath,
    vertices: vertices.length / 3,
    triangles: indices.length / 3,
  };
}

function buildVeilClothingMesh({ rings, segments, skirtLayers }) {
  const vertices = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  let indexOffset = 0;

  const bones = [
    { name: "spine", parent: null },
    { name: "chest", parent: "spine" },
    { name: "skirt_root", parent: "spine" },
    { name: "tail_L", parent: "spine" },
    { name: "tail_R", parent: "spine" },
  ];

  function addVertex(x, y, z, nx, ny, nz, u, v) {
    vertices.push(x, y, z);
    normals.push(nx, ny, nz);
    uvs.push(u, v);
    return vertices.length / 3 - 1;
  }

  function addQuad(a, b, c, d) {
    indices.push(a, b, c, a, c, d);
  }

  // Bodice (truncated cone)
  for (let r = 0; r < rings; r++) {
    const t0 = r / rings;
    const t1 = (r + 1) / rings;
    const y0 = 1.1 + t0 * 0.35;
    const y1 = 1.1 + t1 * 0.35;
    const rad0 = 0.22 + (1 - t0) * 0.08;
    const rad1 = 0.22 + (1 - t1) * 0.08;
    const ring0 = [];
    const ring1 = [];
    for (let s = 0; s <= segments; s++) {
      const ang = (s / segments) * Math.PI * 2;
      const cx = Math.cos(ang);
      const cz = Math.sin(ang);
      const n0 = normalize([cx, 0.25, cz]);
      const n1 = normalize([cx, 0.25, cz]);
      ring0.push(addVertex(cx * rad0, y0, cz * rad0, ...n0, s / segments, t0));
      ring1.push(addVertex(cx * rad1, y1, cz * rad1, ...n1, s / segments, t1));
    }
    for (let s = 0; s < segments; s++) {
      addQuad(ring0[s], ring1[s], ring1[s + 1], ring0[s + 1]);
    }
  }

  // Layered skirt (Vocaloid-style flared)
  for (let layer = 0; layer < skirtLayers; layer++) {
    const layerT = layer / skirtLayers;
    const nextT = (layer + 1) / skirtLayers;
    const yTop = 1.1 - layerT * 0.15;
    const yBot = 1.1 - nextT * 0.95;
    const rTop = 0.28 + layerT * 0.12;
    const rBot = 0.55 + nextT * 0.35;
    const flare = 1 + Math.sin(layerT * Math.PI) * 0.08;

    for (let r = 0; r < rings; r++) {
      const rt0 = r / rings;
      const rt1 = (r + 1) / rings;
      const y0 = yTop + (yBot - yTop) * rt0;
      const y1 = yTop + (yBot - yTop) * rt1;
      const rad0 = (rTop + (rBot - rTop) * rt0) * flare;
      const rad1 = (rTop + (rBot - rTop) * rt1) * flare;
      const ring0 = [];
      const ring1 = [];
      for (let s = 0; s <= segments; s++) {
        const ang = (s / segments) * Math.PI * 2;
        const wave = 1 + Math.sin(ang * 3 + layer) * 0.04;
        const cx = Math.cos(ang);
        const cz = Math.sin(ang);
        const n0 = normalize([cx * 0.7, 0.5, cz * 0.7]);
        const n1 = normalize([cx * 0.7, 0.5, cz * 0.7]);
        ring0.push(addVertex(cx * rad0 * wave, y0, cz * rad0 * wave, ...n0, s / segments, layerT + rt0 * 0.1));
        ring1.push(addVertex(cx * rad1 * wave, y1, cz * rad1 * wave, ...n1, s / segments, layerT + rt1 * 0.1));
      }
      for (let s = 0; s < segments; s++) {
        addQuad(ring0[s], ring1[s], ring1[s + 1], ring0[s + 1]);
      }
    }
  }

  // Twin-tail ribbon strips (signature Vocaloid silhouette hint)
  for (const side of [-1, 1]) {
    const base = addVertex(side * 0.12, 1.35, -0.08, side, 0, -0.2, 0.5, 0.5);
    for (let i = 0; i < 8; i++) {
      const t = i / 8;
      const sway = Math.sin(t * Math.PI * 2) * 0.15 * side;
      const v0 = addVertex(side * (0.15 + t * 0.05) + sway, 1.25 - t * 0.4, -0.12 - t * 0.08, 0, 0, -1, t, 0);
      const v1 = addVertex(side * (0.22 + t * 0.05) + sway, 1.25 - t * 0.4, -0.05 - t * 0.08, 0, 0, -1, t, 1);
      if (i > 0) {
        const prev0 = v0 - 2;
        const prev1 = v1 - 2;
        addQuad(prev0, prev1, v1, v0);
      }
      if (i === 0) addQuad(base, v1, v0, base);
    }
  }

  return { vertices, normals, uvs, indices, bones };
}

function normalize([x, y, z]) {
  const len = Math.hypot(x, y, z) || 1;
  return [x / len, y / len, z / len];
}
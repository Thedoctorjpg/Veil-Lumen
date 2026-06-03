import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const DT = 1 / 60;
const GRAVITY = -1.8;
const SPRING_K = 28;
const DAMPING = 0.98;

/**
 * Verlet softbody skirt — stable headless test for CI/dev workflow
 */
export async function physicsTest({ root, component = "softbody", duration = 30 }) {
  const steps = Math.floor(duration / DT);
  const rings = 14;
  const seg = 10;
  const { points, springs, pinned } = buildSkirt(rings, seg);

  const prev = points.map((p) => ({ ...p }));
  const vel = points.map(() => ({ x: 0, y: 0, z: 0 }));

  let maxStrain = 0;
  let totalEnergy = 0;
  let exploded = false;
  const warmup = Math.floor(steps * 0.25);

  for (let step = 0; step < steps; step++) {
    const wind = Math.sin(step * 0.06) * 0.08;

    for (let i = 0; i < points.length; i++) {
      if (pinned.has(i)) continue;
      vel[i].y += GRAVITY * DT * DT;
      vel[i].x += wind * DT * DT;
    }

    for (const s of springs) {
      const a = points[s.a];
      const b = points[s.b];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let dz = b.z - a.z;
      const dist = Math.hypot(dx, dy, dz) || 1e-6;
      const strain = Math.abs(dist - s.rest) / s.rest;

      if (step >= warmup) {
        maxStrain = Math.max(maxStrain, strain);
        if (strain > 0.75) exploded = true;
      }

      const diff = (dist - s.rest) / dist;
      const f = SPRING_K * diff * 0.5;
      dx *= f;
      dy *= f;
      dz *= f;

      if (!pinned.has(s.a)) {
        vel[s.a].x += dx * DT;
        vel[s.a].y += dy * DT;
        vel[s.a].z += dz * DT;
      }
      if (!pinned.has(s.b)) {
        vel[s.b].x -= dx * DT;
        vel[s.b].y -= dy * DT;
        vel[s.b].z -= dz * DT;
      }
    }

    for (let i = 0; i < points.length; i++) {
      if (pinned.has(i)) {
        vel[i].x = vel[i].y = vel[i].z = 0;
        continue;
      }
      const nx = points[i].x + vel[i].x;
      const ny = points[i].y + vel[i].y;
      const nz = points[i].z + vel[i].z;
      vel[i].x = (nx - points[i].x) * DAMPING;
      vel[i].y = (ny - points[i].y) * DAMPING;
      vel[i].z = (nz - points[i].z) * DAMPING;
      prev[i].x = points[i].x;
      prev[i].y = points[i].y;
      prev[i].z = points[i].z;
      points[i].x = nx;
      points[i].y = Math.max(ny, 0.08);
      points[i].z = nz;

      if (step >= warmup) {
        totalEnergy += vel[i].x ** 2 + vel[i].y ** 2 + vel[i].z ** 2;
      }
    }
  }

  const sampleCount = Math.max(1, steps - warmup);
  const avgEnergy = totalEnergy / sampleCount;
  const passed = !exploded && maxStrain < 0.72 && avgEnergy < 2.5;

  const report = {
    component,
    duration,
    steps,
    dt: DT,
    particles: points.length,
    springs: springs.length,
    maxStrain,
    avgEnergy,
    passed,
    testedAt: new Date().toISOString(),
    notes: passed
      ? "Softbody skirt stable under stage wind + gravity."
      : "Instability detected — reduce spring K or refine mesh weights.",
  };

  const reportDir = join(root, "public/reports");
  await mkdir(reportDir, { recursive: true });
  const reportPath = join(reportDir, "physics_latest.json");
  await writeFile(reportPath, JSON.stringify(report, null, 2));

  return { passed, maxStrain, avgEnergy, steps, reportPath };
}

function buildSkirt(rings, seg) {
  const points = [];
  const springs = [];
  const pinned = new Set();

  for (let r = 0; r < rings; r++) {
    const t = r / (rings - 1);
    const y = 1.0 - t * 0.85;
    const rad = 0.28 + t * 0.42;
    for (let s = 0; s < seg; s++) {
      const ang = (s / seg) * Math.PI * 2;
      points.push({ x: Math.cos(ang) * rad, y, z: Math.sin(ang) * rad });
      if (r < 2) pinned.add(points.length - 1);
    }
  }

  const at = (r, s) => r * seg + (s % seg);
  const seen = new Set();

  function link(a, b) {
    const key = a < b ? `${a}:${b}` : `${b}:${a}`;
    if (seen.has(key)) return;
    seen.add(key);
    const pa = points[a];
    const pb = points[b];
    const rest = Math.hypot(pb.x - pa.x, pb.y - pa.y, pb.z - pa.z);
    if (rest < 0.03) return;
    springs.push({ a, b, rest });
  }

  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < seg; s++) {
      if (r + 1 < rings) link(at(r, s), at(r + 1, s));
      link(at(r, s), at(r, s + 1));
    }
  }

  return { points, springs, pinned };
}
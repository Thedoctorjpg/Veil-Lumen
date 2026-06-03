#!/usr/bin/env node
/**
 * Veil Lumen development CLI
 * Mirrors recommended workflow commands when global `grok` lacks them.
 */

import { spawn } from "node:child_process";
import { mkdir, readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { meshGenerate } from "./mesh-generate.mjs";
import { physicsTest } from "./physics-test.mjs";
import { voiceTest } from "./voice-test.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function parseArgs(argv) {
  const args = [...argv];
  const flags = {};
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(a);
    }
  }
  return { positional, flags };
}

function parseDuration(s) {
  if (!s) return 30;
  const m = String(s).match(/^(\d+(?:\.\d+)?)\s*(s|ms|m)?$/i);
  if (!m) return 30;
  const n = parseFloat(m[1]);
  const u = (m[2] || "s").toLowerCase();
  if (u === "ms") return n / 1000;
  if (u === "m") return n * 60;
  return n;
}

async function cmdStatus(project) {
  if (project && project !== "veil-lumen") {
    console.error(`Unknown project: ${project}`);
    process.exit(1);
  }

  const modelPath = join(ROOT, "public/models/veil_clothing_optimized.json");
  const physicsReport = join(ROOT, "public/reports/physics_latest.json");
  const lines = [
    "",
    "  Veil Lumen — Project Status",
    "  ───────────────────────────",
    `  Root:     ${ROOT}`,
    `  Version:  ${(await readPkg()).version}`,
    "",
  ];

  try {
    const s = await stat(modelPath);
    const mesh = JSON.parse(await readFile(modelPath, "utf8"));
    lines.push(
      `  Mesh:     ✓ ${modelPath}`,
      `            ${mesh.vertices?.length / 3 | 0} verts · ${mesh.indices?.length / 3 | 0} tris · quality=${mesh.meta?.quality ?? "?"}`,
      `            updated ${s.mtime.toISOString()}`,
    );
  } catch {
    lines.push("  Mesh:     ✗ not generated — run: ./grok run mesh-generate --out public/models/veil_clothing_optimized.json --quality high");
  }

  try {
    const s = await stat(physicsReport);
    const rep = JSON.parse(await readFile(physicsReport, "utf8"));
    lines.push(
      `  Physics:  ✓ ${rep.passed ? "PASSED" : "FAILED"} (${rep.component})`,
      `            max strain ${rep.maxStrain?.toFixed(4)} · ${rep.steps} steps`,
      `            updated ${s.mtime.toISOString()}`,
    );
  } catch {
    lines.push("  Physics:  ✗ no report — run: ./grok run physics-test --component softbody --duration 30s");
  }

  lines.push(
    "",
    "  Commands:",
    "    ./grok run mesh-generate --out public/models/veil_clothing_optimized.json --quality high",
    "    ./grok run physics-test --component softbody --duration 30s",
    "    ./grok run voice-test --duration 5s",
    "    ./grok dev veil-lumen",
    "",
    "  Veil is ready on your machine. 💙",
    "",
  );
  console.log(lines.join("\n"));
}

async function readPkg() {
  return JSON.parse(await readFile(join(ROOT, "package.json"), "utf8"));
}

async function cmdRun(sub, flags) {
  if (sub === "mesh-generate") {
    const out = flags.out || "public/models/veil_clothing_optimized.json";
    const quality = flags.quality || "medium";
    const result = await meshGenerate({ root: ROOT, out, quality });
    console.log(`✓ Mesh written: ${result.path}`);
    console.log(`  ${result.vertices} vertices · ${result.triangles} triangles · quality=${quality}`);
    return;
  }
  if (sub === "physics-test") {
    const component = flags.component || "softbody";
    const duration = parseDuration(flags.duration || "30s");
    const result = await physicsTest({ root: ROOT, component, duration });
    console.log(result.passed ? "✓ Physics test PASSED" : "✗ Physics test FAILED");
    console.log(`  Report: ${result.reportPath}`);
    console.log(`  max strain=${result.maxStrain.toFixed(4)} · avg energy=${result.avgEnergy.toFixed(2)}`);
    process.exit(result.passed ? 0 : 1);
  }
  if (sub === "voice-test") {
    const duration = parseDuration(flags.duration || "5s");
    const result = await voiceTest({ duration });
    console.log(`✓ Voice synthesis check OK (${result.notes} notes · ${duration}s window)`);
    return;
  }
  console.error(`Unknown run target: ${sub}`);
  process.exit(1);
}

function cmdDev(project, flags) {
  if (project && project !== "veil-lumen") {
    console.error(`Unknown project: ${project}`);
    process.exit(1);
  }
  const port = flags.port || process.env.PORT || "5173";
  const child = spawn("node", [join(__dirname, "dev-server.mjs"), "--port", port], {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, VEIL_LUMEN_ROOT: ROOT },
  });
  child.on("exit", (code) => process.exit(code ?? 0));
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const [cmd, sub, project] = positional;

  if (cmd === "status") {
    await cmdStatus(project || sub);
    return;
  }
  if (cmd === "run") {
    await cmdRun(sub, flags);
    return;
  }
  if (cmd === "dev") {
    cmdDev(project || sub, flags);
    return;
  }

  console.log(`Veil Lumen CLI

Usage:
  ./grok status veil-lumen
  ./grok run mesh-generate --out public/models/veil_clothing_optimized.json --quality high
  ./grok run physics-test --component softbody --duration 30s
  ./grok run voice-test --duration 5s
  ./grok dev veil-lumen [--port 5173]

Or: npm run status | mesh-generate | physics-test | dev
`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
#!/usr/bin/env node
/**
 * Copy healed Hermes SKILL.md files into Veil-Lumen/skills/
 * Source: TTMIK .devin/skills (run ttmik-heal-skills from parent repo first)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const veilRoot = path.resolve(__dirname, "..");
const parentRoot = path.resolve(veilRoot, "..");
const sourceDir = path.join(parentRoot, ".devin", "skills");
const targetDir = path.join(veilRoot, "skills");

if (!fs.existsSync(sourceDir)) {
  console.error(`Source not found: ${sourceDir}`);
  console.error("Run: node packages/ttmik-heal-skills/bin/cli.js --root <TTMIK>");
  process.exit(1);
}

let copied = 0;
for (const id of fs.readdirSync(sourceDir)) {
  const src = path.join(sourceDir, id, "SKILL.md");
  if (!fs.existsSync(src)) continue;
  const dest = path.join(targetDir, id, "SKILL.md");
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  copied++;
  console.log(`Synced: ${id}`);
}

console.log(`\nDone — ${copied} skills → ${targetDir}`);
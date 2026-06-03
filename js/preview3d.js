import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { getGlitchIntensity } from "./glitch-engine.js";
import {
  registerCharacterRig,
  tickCharacterRig,
  isTrackingActive,
} from "./character-rig.js";
import { publicUrl } from "./paths.js";

const MODEL_URL = publicUrl("/public/models/veil_clothing_optimized.json");

function buildHead(headGroup) {
  const skin = new THREE.MeshStandardMaterial({
    color: 0xf0d4c8,
    roughness: 0.55,
    metalness: 0.05,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x062a28,
    emissiveIntensity: 0.5,
    roughness: 0.4,
    metalness: 0.1,
  });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 32, 32), skin);
  headGroup.add(head);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.62),
    hairMat
  );
  hair.position.set(0, 0.06, -0.02);
  headGroup.add(hair);

  const bang = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.06), hairMat);
  bang.position.set(0, 0.1, 0.06);
  headGroup.add(bang);

  const eyes = [];
  const eyeMaterials = [];
  for (const side of [-1, 1]) {
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x111820,
      emissive: 0xe040fb,
      emissiveIntensity: 0.8,
    });
    eyeMaterials.push(eyeMat);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 12), eyeMat);
    eye.position.set(side * 0.035, 0.02, 0.085);
    headGroup.add(eye);
    eyes.push(eye);
  }

  const mouthPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(0.04, 0.012),
    new THREE.MeshStandardMaterial({ color: 0x8b5a52, roughness: 0.8 })
  );
  mouthPlane.position.set(0, -0.035, 0.092);
  mouthPlane.scale.y = 0.35;
  headGroup.add(mouthPlane);

  return { eyes, mouthPlane, hairMaterial: hairMat, eyeMaterials };
}

function buildStarfield() {
  const count = 420;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 4 + Math.random() * 8;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = 0.5 + r * Math.cos(phi) * 0.35;
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: 0xaaccff,
      size: 0.03,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    })
  );
  points.visible = false;
  return points;
}

async function init() {
  const container = document.getElementById("model-viewport");
  const loading = document.getElementById("model-loading");
  const metaEl = document.getElementById("model-meta");
  if (!container) return;

  let meshData;
  try {
    const res = await fetch(MODEL_URL);
    if (!res.ok) throw new Error("Mesh not found");
    meshData = await res.json();
    loading?.classList.add("hidden");
  } catch {
    if (loading) {
      loading.textContent =
        "Mesh not found — run: ./grok run mesh-generate --out public/models/veil_clothing_optimized.json --quality high";
    }
    return;
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c0a1a);
  scene.fog = new THREE.Fog(0x0c0a1a, 4, 12);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
  camera.position.set(1.8, 1.4, 2.2);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 0.85, 0);

  const hemi = new THREE.HemisphereLight(0x00e5ff, 0x1e1b4b, 0.9);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(2, 4, 3);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xe040fb, 0.6);
  rim.position.set(-2, 2, -2);
  scene.add(rim);

  const characterRoot = new THREE.Group();
  const bodyGroup = new THREE.Group();
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.36, 0.04);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(meshData.vertices, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(meshData.normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(meshData.uvs, 2));
  geometry.setIndex(meshData.indices);
  geometry.computeBoundingSphere();

  const mat = meshData.material || {};
  const base = mat.baseColor || [0, 0.898, 1, 1];
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(base[0], base[1], base[2]),
    emissive: new THREE.Color(0x0a2826),
    emissiveIntensity: 0.35,
    metalness: mat.metalness ?? 0.15,
    roughness: mat.roughness ?? 0.35,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  bodyGroup.add(mesh);
  const { eyes, mouthPlane, hairMaterial, eyeMaterials } = buildHead(headGroup);
  characterRoot.add(bodyGroup);
  characterRoot.add(headGroup);
  scene.add(characterRoot);

  registerCharacterRig({ headGroup, bodyGroup, eyes, mouthPlane, characterRoot });

  let grid = new THREE.GridHelper(4, 20, 0x00e5ff, 0x1a1730);
  scene.add(grid);

  const starfield = buildStarfield();
  scene.add(starfield);

  let baseEmissive = material.emissiveIntensity;

  if (metaEl && meshData.meta) {
    const verts = meshData.vertices.length / 3;
    const tris = meshData.indices.length / 3;
    metaEl.innerHTML = `
      <div><dt>Quality</dt><dd>${meshData.meta.quality}</dd></div>
      <div><dt>Vertices</dt><dd>${verts.toLocaleString()}</dd></div>
      <div><dt>Triangles</dt><dd>${tris.toLocaleString()}</dd></div>
      <div><dt>Face track</dt><dd>Webcam → head rig</dd></div>
      <div><dt>Generated</dt><dd>${new Date(meshData.meta.createdAt).toLocaleString()}</dd></div>
    `;
  }

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  resize();
  window.addEventListener("resize", resize);

  let spin = 0;

  function animate() {
    requestAnimationFrame(animate);
    const gl = getGlitchIntensity();
    const tracking = isTrackingActive();

    tickCharacterRig();

    if (!tracking) {
      spin += 0.004 + (gl > 0.3 ? (Math.random() - 0.5) * 0.008 * gl : 0);
      characterRoot.rotation.y = spin;
    } else {
      characterRoot.rotation.y *= 0.95;
    }

    if (gl > 0.2) {
      material.emissiveIntensity =
        baseEmissive + Math.sin(Date.now() * 0.02) * gl * 0.4;
      if (!tracking && Math.random() < gl * 0.04) {
        characterRoot.position.x = (Math.random() - 0.5) * gl * 0.08;
      } else if (!tracking) {
        characterRoot.position.x *= 0.9;
      }
    } else {
      material.emissiveIntensity = baseEmissive;
      if (!tracking) characterRoot.position.x *= 0.92;
    }

    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  const sceneApi = {
    scene,
    bodyMaterial: material,
    hairMaterial,
    eyeMaterials,
    hemiLight: hemi,
    keyLight: key,
    rimLight: rim,
    currentOutfit: "spectral",
    currentBackground: "cli-void",
    replaceGrid(colorA, colorB) {
      scene.remove(grid);
      grid.geometry?.dispose();
      if (Array.isArray(grid.material)) {
        for (const m of grid.material) m.dispose();
      } else {
        grid.material?.dispose();
      }
      grid = new THREE.GridHelper(4, 20, colorA, colorB);
      scene.add(grid);
    },
    setStarfield(on) {
      starfield.visible = on;
    },
    setBaseEmissive(v) {
      baseEmissive = v;
      material.emissiveIntensity = v;
    },
  };

  window.dispatchEvent(
    new CustomEvent("veil:character-ready", { detail: { api: sceneApi } })
  );
}

init();
// Caricamento e cache dei modelli 3D (glTF/GLB). Tutti gli asset sono CC0 (vedi assets/*/License.txt).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const loader = new GLTFLoader();
const cache = new Map();
export const BASE = new URL('../assets/', import.meta.url).href;

// Nell'anteprima pubblicata i modelli sono glTF in formato .json (vedi strumenti/prepara-anteprima.py).
const JSON_MODE = document.documentElement.dataset.modelli === 'json';
const url = path => BASE + (JSON_MODE ? path.replace(/\.(glb|gltf)$/, '.json') : path);
export function load(path) {
  if (!cache.has(path)) cache.set(path, loader.loadAsync(url(path)));
  return cache.get(path);
}
/** Copia indipendente di un modello statico, con ombre attive. */
export async function model(path, { scale = 1, shadow = true } = {}) {
  const g = await load(path);
  const o = g.scene.clone(true);
  o.scale.setScalar(scale);
  o.traverse(m => { if (m.isMesh) { m.castShadow = shadow; m.receiveShadow = true; } });
  return o;
}
/** Copia di un modello animato (scheletro clonato correttamente) più le sue clip. */
export async function animated(path) {
  const g = await load(path);
  const o = SkeletonUtils.clone(g.scene);
  o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; } });
  return { object: o, clips: g.animations };
}
const texCache = new Map();
export function texture(path) {
  if (!texCache.has(path)) texCache.set(path, new THREE.TextureLoader().loadAsync(BASE + path).then(t => { t.colorSpace = THREE.SRGBColorSpace; t.flipY = false; return t; }));
  return texCache.get(path);
}
export async function preload(paths, onProgress) {
  let done = 0;
  await Promise.all(paths.map(p => load(p).then(() => onProgress && onProgress(++done / paths.length))));
}

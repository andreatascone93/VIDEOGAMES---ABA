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
// La pagina pubblicata non permette di scaricare URI "data:": il buffer incorporato nel .json
// viene decodificato qui e il modello viene ricomposto in GLB in memoria.
async function caricaJson(path) {
  const u = url(path), cartella = u.slice(0, u.lastIndexOf('/') + 1);
  const r = await fetch(u); if (!r.ok) throw new Error(path + ': ' + r.status);
  const js = await r.json();
  let bin = new Uint8Array(0);
  const b0 = js.buffers && js.buffers[0];
  if (b0 && b0.uri && b0.uri.startsWith('data:')) {
    const s = atob(b0.uri.slice(b0.uri.indexOf(',') + 1)); bin = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) bin[i] = s.charCodeAt(i);
    delete b0.uri; b0.byteLength = bin.length;
  }
  const pad = (n) => (4 - (n % 4)) % 4;
  let jb = new TextEncoder().encode(JSON.stringify(js));
  const jl = jb.length + pad(jb.length), bl = bin.length + pad(bin.length);
  const tot = 12 + 8 + jl + (bl ? 8 + bl : 0), out = new Uint8Array(tot), dv = new DataView(out.buffer);
  dv.setUint32(0, 0x46546C67, true); dv.setUint32(4, 2, true); dv.setUint32(8, tot, true);
  dv.setUint32(12, jl, true); dv.setUint32(16, 0x4E4F534A, true); out.set(jb, 20); out.fill(0x20, 20 + jb.length, 20 + jl);
  if (bl) { const o = 20 + jl; dv.setUint32(o, bl, true); dv.setUint32(o + 4, 0x004E4942, true); out.set(bin, o + 8); }
  // le texture incorporate vanno caricate con <img> (blob: permesso) e non con fetch (vietato): si nasconde
  // createImageBitmap mentre GLTFLoader crea il parser, così usa TextureLoader
  return new Promise((ok, ko) => {
    const cib = self.createImageBitmap;
    try { self.createImageBitmap = undefined; loader.parse(out.buffer, cartella, ok, e => ko(new Error(path + ': ' + (e && e.message || e)))); }
    finally { self.createImageBitmap = cib; }
  });
}
export function load(path) {
  if (!cache.has(path)) cache.set(path, JSON_MODE ? caricaJson(path) : loader.loadAsync(url(path)));
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

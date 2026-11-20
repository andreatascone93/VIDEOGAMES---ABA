// Le persone di casa (mamma, papà, altri bambini) e i fumetti di chi parla.
// Sono lo stesso modello animato di Francesco con un'altra skin e un'altra statura.
import * as THREE from 'three';
import { Personaggio } from './personaggio.js';
import { $, speak, sleep, clamp } from './core.js';

// ogni persona di casa ha il suo aspetto (aspetto.js); skin e capelli restano solo per i personaggi senza aspetto
const ASPETTO_DI = { 'Mamma': 'mamma', 'Papà': 'papa', 'Leo': 'leo', 'Giulia': 'giulia' };
export async function creaPersona({ nome, skin, altezza, capelli = null, aspetto = ASPETTO_DI[nome] || null }) {
  const p = await Personaggio.crea({ altezza, skin, aspetto });
  p.nome = nome; p.altezza = altezza; p.root.visible = false;
  if (capelli && !p.viso) aggiungiCapelli(p, capelli);
  if (p.viso) p.espressione('sorriso', 0);
  return p;
}

// capelli lunghi: una calotta e una coda dietro la testa, agganciate all'osso della testa
function aggiungiCapelli(p, colore) {
  const k = p.altezza / 1.36, testa = p.ossa.Head; if (!testa) return;
  p.root.updateMatrixWorld(true);
  const c = testa.getWorldPosition(new THREE.Vector3());
  const m = new THREE.MeshStandardMaterial({ color: colore, roughness: .8 });
  const g = new THREE.Group(); g.position.copy(c); p.root.add(g);
  const dietro = new THREE.Mesh(new THREE.SphereGeometry(.2 * k, 20, 14), m); dietro.scale.set(1.08, 1.25, .62); dietro.position.set(0, .08 * k, -.13 * k); dietro.castShadow = true; g.add(dietro);
  const coda = new THREE.Mesh(new THREE.SphereGeometry(.09 * k, 14, 10), m); coda.scale.set(1, 1.7, .9); coda.position.set(0, -.08 * k, -.25 * k); coda.castShadow = true; g.add(coda);
  testa.attach(g);
}

/* ------------------------------------------------------------------ fumetti */
const attivi = new Map();   // personaggio → elemento
const v = new THREE.Vector3();
export function fumetto(p, testo) {
  togli(p);
  const el = document.createElement('div'); el.className = 'fumetto';
  const b = document.createElement('b'); b.textContent = (p.nome || '').toUpperCase(); el.appendChild(b); el.appendChild(document.createTextNode(testo));
  $('labels').appendChild(el); attivi.set(p, el); return el;
}
export function togli(p) { const el = attivi.get(p); if (el) { el.remove(); attivi.delete(p); if (p.parla) p.parla(false); } }
export function zittisci() { for (const p of [...attivi.keys()]) togli(p); }
// mostra il fumetto, lo legge a voce e aspetta il tempo di leggerlo
export async function parla(p, testo, { ms = 0, voce = true, resta = false } = {}) {
  const el = fumetto(p, testo); if (voce) speak(testo); if (p.parla) p.parla(true);
  await sleep(ms || clamp(1500 + testo.length * 58, 2300, 6500));
  if (!resta && attivi.get(p) === el) togli(p);
}
export function aggiornaFumetti(camera, W, H) {
  for (const [p, el] of attivi) {
    p.punto('Head', v); v.y += .36 * ((p.altezza || 1.36) / 1.36); v.project(camera);
    el.style.left = clamp((v.x + 1) / 2 * W, 150, W - 150) + 'px'; el.style.top = Math.max(70, (1 - v.y) / 2 * H) + 'px';
    el.style.visibility = p.root.visible ? '' : 'hidden';
  }
}

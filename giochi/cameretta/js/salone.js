// Il salone di casa: divano, tavolino, televisione, tavolo, il tappeto dei giochi con le costruzioni.
// Qui Francesco trova la mamma e altri bambini: è uno dei posti dove può andare a ritrovare la calma.
// Mobili KayKit e Kenney (CC0). Unità in metri. È la stanza accanto alla cameretta: si passa dalla porta camminando.
import * as THREE from 'three';
import { model } from './assets.js';
import { canvasTex, legno, parete, finestra, porta, pareteConPorta, STANZA } from './stanza.js';

export const SALONE = { x0: -3.4, x1: 3.4, z0: -2.4, z1: 2.4, h: 2.6 };
export const TORRE = { x: 1.7, z: .2 };
// il salone sta accanto alla cameretta, oltre la parete della porta: le sue coordinate sono locali al suo gruppo
export const SALONE_X = STANZA.x1 + .3 - SALONE.x0;

// porta un modello a una misura precisa e lo appoggia a terra con il centro sull'origine
function sistema(o, misura, asse = 'x') {
  const b = new THREE.Box3().setFromObject(o), s = b.getSize(new THREE.Vector3());
  o.scale.multiplyScalar(misura / s[asse]);
  const b2 = new THREE.Box3().setFromObject(o), c = b2.getCenter(new THREE.Vector3());
  o.position.x -= c.x; o.position.z -= c.z; o.position.y -= b2.min.y;
  const g = new THREE.Group(); g.add(o); return g;
}
const COLORI = ['#e8553c', '#3b8cf0', '#f5c534', '#3fcf7a', '#f08a3c', '#9b6be0'];
const facciaCubo = (colore, lettera) => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = colore; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 10; g.strokeRect(9, 9, w - 18, h - 18);
  g.fillStyle = 'rgba(255,255,255,.92)'; g.font = '900 78px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(lettera, w / 2, h / 2 + 5);
});
const cuboGeo = new THREE.BoxGeometry(.17, .17, .17);
let nCubi = 0;
export function nuovoCubo() {
  const i = nCubi++, m = new THREE.Mesh(cuboGeo, new THREE.MeshStandardMaterial({ map: facciaCubo(COLORI[i % COLORI.length], 'ABCDEFGHILMNOPRST'[i % 17]), roughness: .55 }));
  m.castShadow = m.receiveShadow = true; return m;
}

export async function costruisciSalone(scene) {
  const R = SALONE, g = new THREE.Group(); g.position.x = SALONE_X; scene.add(g);
  const mat = (o) => new THREE.MeshStandardMaterial({ roughness: .9, ...o });
  const box = (w, h, d, m, x, y, z, parent = g) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; parent.add(b); return b; };

  // pavimento e pareti
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(R.x1 - R.x0, R.z1 - R.z0), mat({ map: legno(['#b9895c', '#b07f52', '#c19265', '#a9774b', '#b58457', '#ad7c4f'], [4, 3]), roughness: .65 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
  const pm = mat({ map: parete('#f3ead9', '#ece1cc') }), pl = mat({ map: parete('#efe3d0', '#e7d9c2') });
  box(R.x1 - R.x0 + .3, R.h, .15, pm, 0, R.h / 2, R.z0 - .075);
  const muroPorta = pareteConPorta(g, pl, R.x0 - .075, R.z0, R.z1, R.h, .11, 1.09); pareteConPorta(g, pl, R.x1 + .075, R.z0, R.z1, R.h, -.99, -.01);
  // dietro la porta di destra c'è un pezzo di corridoio: da lì arriva il papà
  { const x0 = R.x1 + .15, cx = x0 + .55;
    box(1.1, .02, 1.6, mat({ color: 0xa57c52, roughness: .7 }), cx, -.01, -.5);
    box(.15, R.h, 1.9, pl, x0 + 1.175, R.h / 2, -.5); box(1.1, R.h, .15, pl, cx, R.h / 2, -1.375); box(1.1, R.h, .15, pl, cx, R.h / 2, .375); }
  const zoccolo = mat({ color: 0xffffff });
  box(R.x1 - R.x0, .1, .03, zoccolo, 0, .05, R.z0 + .015); box(.03, .1, .11 - R.z0, zoccolo, R.x0 + .015, .05, (R.z0 + .11) / 2); box(.03, .1, R.z1 - 1.09, zoccolo, R.x0 + .015, .05, (R.z1 + 1.09) / 2); box(.03, .1, -.99 - R.z0, zoccolo, R.x1 - .015, .05, (R.z0 - .99) / 2); box(.03, .1, R.z1 + .01, zoccolo, R.x1 - .015, .05, (R.z1 - .01) / 2);
  finestra(g, .3, 1.55, R.z0 + .01, mat);
  const portaCameretta = porta(g, R.x0, .15, mat, { lato: -1 });   // verso la cameretta di Francesco: da questo lato resta la cornice,
  portaCameretta.visible = false;                                  // l'anta è una sola ed è quella della cameretta
  const portaCorridoio = porta(g, R.x1, -.95, mat);                // verso il corridoio

  const caldo = new THREE.PointLight(0xffd9a8, 7, 6, 1.5); caldo.position.set(-2.2, 1.9, -1.2); g.add(caldo);

  const kay = async (file, x, y, z, ry = 0, s = .7) => { const o = await model('mobili/' + file + '.gltf', { scale: s }); o.position.set(x, y, z); o.rotation.y = ry; g.add(o); return o; };
  const ken = async (file, misura, asse, x, y, z, ry = 0) => { const o = sistema(await model('salone/' + file + '.glb'), misura, asse); o.position.set(x, y, z); o.rotation.y = ry; g.add(o); return o; };
  const refs = {};
  await Promise.all([
    kay('couch_pillows', -1.3, 0, -1.9, 0, .74).then(o => refs.divano = o),
    kay('rug_rectangle_A', -1.3, .004, -.75, 0, .8),
    kay('table_low', -1.3, 0, -.75, 0, .62).then(o => refs.tavolino = o),
    kay('mug_A', -1.05, .3, -.72, .6, .5).then(o => refs.tazza = o),
    kay('book_single', -1.6, .3, -.8, .4, .5),
    kay('pictureframe_medium', -1.75, 1.62, R.z0, 0, .7),
    kay('pictureframe_small_A', -.85, 1.72, R.z0, 0, .7),
    kay('rug_oval_B', TORRE.x, .004, TORRE.z, 0, .95),
    kay('table_medium', -1.25, 0, 1.6, 0, .72),
    kay('chair_A', -2.05, 0, 1.6, Math.PI / 2, .68), kay('chair_A', -.45, 0, 1.6, -Math.PI / 2, .68), kay('chair_B', -1.25, 0, .95, 0, .68),
    kay('cactus_small_A', -1.25, .56, 1.6, 0, .6),
    kay('lamp_standing', -2.9, 0, -2.0, 0, .66),
    kay('cabinet_medium_decorated', 2.95, 0, .3, -Math.PI / 2, .62),
    ken('cabinetTelevision', 1.6, 'x', TORRE.x, 0, -2.08).then(o => refs.mobileTv = o),
    ken('televisionModern', 1.15, 'x', TORRE.x, .5, -2.1).then(o => refs.tv = o),
    ken('bookcaseOpen', 1.75, 'y', 3.12, 0, 1.55, -Math.PI / 2),
    ken('pottedPlant', 1.05, 'y', 2.95, 0, -2.0),
    ken('radio', .34, 'x', -.55, .0, -2.2)
  ]);
  // la tv e la radio appoggiate sui loro mobili (misurati, mai a occhio)
  { const b = new THREE.Box3().setFromObject(refs.mobileTv); refs.tv.position.y = b.max.y; }
  { const b = new THREE.Box3().setFromObject(refs.tavolino); refs.pianoTavolino = b.max.y; refs.tazza.position.y = b.max.y; }
  // altezza vera della seduta del divano: un raggio dall'alto sul cuscino
  g.updateMatrixWorld(true);
  const colpo = new THREE.Raycaster(g.localToWorld(new THREE.Vector3(-.95, 3, -1.6)), new THREE.Vector3(0, -1, 0)).intersectObject(refs.divano, true)[0];
  const sedutaDivano = colpo ? colpo.point.y : .34;

  // le costruzioni: una base e qualche cubo sparso sul tappeto
  const torre = new THREE.Group(); torre.position.set(TORRE.x, 0, TORRE.z); g.add(torre);
  const sparsi = [];
  [[-.45, .42, .3], [.5, .38, 1.1], [.28, -.42, .7], [-.6, -.2, 2.0], [.62, -.1, .2]].forEach(([x, z, r]) => { const c = nuovoCubo(); c.position.set(TORRE.x + x, .09, TORRE.z + z); c.rotation.y = r; g.add(c); sparsi.push(c); });

  return { gruppo: g, pavimento: floor, portaCameretta, portaCorridoio, muroPorta, torre, sparsi, divano: refs.divano, tazza: refs.tazza, sedutaDivano, caldo };
}

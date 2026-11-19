// La cameretta: pareti, pavimento, luci e mobili KayKit (CC0). Unità in metri.
import * as THREE from 'three';
import { model } from './assets.js';

export const STANZA = { x0: -2.6, x1: 2.6, z0: -2.2, z1: 2.2, h: 2.6 };
const S = .6; // scala dei mobili KayKit (1 unità KayKit ≈ 0,6 m)

export function canvasTex(w, h, draw, repeat = [1, 1]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.anisotropy = 4; return t;
}
export const legno = (tones = ['#c8955f', '#c08a55', '#cf9d68', '#b98250', '#c48f5b', '#bd8752'], rip = [3, 3]) => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = tones[4]; g.fillRect(0, 0, w, h);
  const ph = h / 8, pw = w / 2;
  for (let r = 0; r < 8; r++) for (let k = -1; k < 3; k++) {
    const x = k * pw + (r % 2) * pw / 2, y = r * ph; g.fillStyle = tones[(r * 3 + k + 3) % tones.length]; g.fillRect(x, y, pw, ph);
    g.strokeStyle = 'rgba(80,45,20,.35)'; g.lineWidth = 2; g.strokeRect(x, y, pw, ph);
    g.strokeStyle = 'rgba(90,55,25,.12)'; for (let i = 0; i < 6; i++) { g.beginPath(); const yy = y + 6 + Math.random() * (ph - 12); g.moveTo(x, yy); g.bezierCurveTo(x + 80, yy + 4, x + 160, yy - 4, x + pw, yy + 2); g.stroke(); }
  }
}, rip);
// poster per le cornici
const poster = (tipo) => canvasTex(256, 320, (g, w, h) => {
  if (tipo === 'kart') {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1b2a52'); gr.addColorStop(1, '#e8553c'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(w * .7, h * .3, 46, 0, 7); g.fill();
    g.fillStyle = '#222'; g.beginPath(); g.moveTo(0, h * .78); g.lineTo(w, h * .62); g.lineTo(w, h); g.lineTo(0, h); g.fill();
    g.fillStyle = '#e8e8e8'; for (let i = 0; i < 6; i++) g.fillRect(i * 48, h * .79 - i * 7.5, 26, 5);
    g.fillStyle = '#fff'; g.font = '900 38px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText('GRAN PREMIO', w / 2, 56);
  } else {
    g.fillStyle = '#2c6e8f'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#7fd0e8'; g.fillRect(0, 0, w, h * .55);
    g.fillStyle = '#f2f2f2'; g.beginPath(); g.moveTo(20, h * .55); g.lineTo(110, h * .18); g.lineTo(200, h * .55); g.fill();
    g.fillStyle = '#3f8f5a'; g.beginPath(); g.moveTo(-20, h * .62); g.lineTo(90, h * .35); g.lineTo(150, h * .48); g.lineTo(200, h * .3); g.lineTo(290, h * .62); g.fill();
    g.fillStyle = '#245a74'; g.fillRect(0, h * .62, w, h);
  }
});
export const parete = (base, stripe) => canvasTex(256, 256, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); g.fillStyle = stripe; for (let x = 0; x < w; x += 64) g.fillRect(x, 0, 22, h); }, [6, 1]);
// finestra con il cielo (usata anche nel salone)
export function finestra(parent, x, y, z, mat) {
  const cielo = canvasTex(256, 256, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7cc3f2'); gr.addColorStop(1, '#d9f0ff'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,.9)'; [[60, 80, 30], [90, 75, 24], [180, 120, 28], [205, 115, 20]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }); c.fillStyle = '#7fc27a'; c.fillRect(0, h * .82, w, h); });
  const win = new THREE.Group(); win.position.set(x, y, z); parent.add(win);
  win.add(new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1), new THREE.MeshBasicMaterial({ map: cielo })));
  const telaio = mat({ color: 0xffffff });
  const b = (w, h, d, px, py, pz) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), telaio); m.position.set(px, py, pz); m.castShadow = true; win.add(m); };
  [[1.42, .08, 0, .54], [1.42, .08, 0, -.54], [.08, 1.1, -.69, 0], [.08, 1.1, .69, 0], [.05, 1, 0, 0]].forEach(([w, h, px, py]) => b(w, h, .08, px, py, .03));
  b(1.5, .06, .18, 0, -.58, .08);
  return win;
}
// porta con cardine: restituisce il perno da ruotare
// parete lungo z con il vano di una porta: tre pezzi, con la carta da parati che continua da un pezzo all'altro
export function pareteConPorta(parent, m, xc, z0, z1, h, p0, p1, hp = 2.1) {
  const D = z1 - z0, pezzi = [];
  const pezzo = (a, b, y0, y1) => {
    const geo = new THREE.BoxGeometry(.15, y1 - y0, b - a), uv = geo.attributes.uv;
    for (let i = 0; i < 8; i++) {   // facce +x (0-3) e -x (4-7): le coordinate della texture restano quelle della parete intera
      const px = i < 4, zu = px ? b - uv.getX(i) * (b - a) : a + uv.getX(i) * (b - a);
      uv.setXY(i, px ? (z1 - zu) / D : (zu - z0) / D, (y0 + uv.getY(i) * (y1 - y0)) / h);
    }
    const o = new THREE.Mesh(geo, m); o.position.set(xc, (y0 + y1) / 2, (a + b) / 2); o.castShadow = o.receiveShadow = true; parent.add(o); pezzi.push(o);
  };
  pezzo(z0, p0, 0, h); pezzo(p1, z1, 0, h); pezzo(p0, p1, hp, h);
  return pezzi;
}
export function porta(parent, x, z, mat, { lato = 1 } = {}) {
  const pivot = new THREE.Group(); pivot.position.set(x - .02 * lato, 0, z); parent.add(pivot);
  const box = (w, h, d, m, px, py, pz, p = pivot) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(px, py, pz); o.castShadow = o.receiveShadow = true; p.add(o); return o; };
  box(.06, 2.05, .9, mat({ color: 0xb98456, roughness: .6 }), -.03 * lato, 1.025, .45);
  box(.08, .7, .7, mat({ color: 0xa87346 }), -.03 * lato, 1.5, .45); box(.08, .7, .7, mat({ color: 0xa87346 }), -.03 * lato, .6, .45);
  box(.1, .05, .14, mat({ color: 0xf2c230, metalness: .6, roughness: .3 }), -.09 * lato, 1.0, .8);
  const cornice = mat({ color: 0xffffff });
  box(.05, 2.15, .08, cornice, x - .02 * lato, 1.075, z - .04, parent); box(.05, 2.15, .08, cornice, x - .02 * lato, 1.075, z + .94, parent); box(.05, .08, 1.06, cornice, x - .02 * lato, 2.12, z + .45, parent);
  return pivot;
}

export async function costruisciStanza(scene) {
  const R = STANZA, g = new THREE.Group(); scene.add(g);
  const mat = (o) => new THREE.MeshStandardMaterial({ roughness: .9, ...o });
  const box = (w, h, d, m, x, y, z, parent = g) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; parent.add(b); return b; };

  // pavimento e pareti
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(R.x1 - R.x0, R.z1 - R.z0), mat({ map: legno(), roughness: .7 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.name = 'pavimento'; g.add(floor);
  const pareteM = mat({ map: parete('#e9eef5', '#dfe7f0') }), pareteL = mat({ map: parete('#dbe9e1', '#d0e2d7') });
  box(R.x1 - R.x0 + .3, R.h, .15, pareteM, 0, R.h / 2, R.z0 - .075);
  box(.15, R.h, R.z1 - R.z0, pareteL, R.x0 - .075, R.h / 2, 0);
  const muroPorta = pareteConPorta(g, pareteL, R.x1 + .075, R.z0, R.z1, R.h, .11, 1.09);   // oltre questa parete c'è il salone
  box(.3, .02, .98, mat({ color: 0x9a6f48, roughness: .7 }), R.x1 + .15, -.01, .6);          // soglia
  const zoccolo = mat({ color: 0xffffff });
  box(R.x1 - R.x0, .1, .03, zoccolo, 0, .05, R.z0 + .015); box(.03, .1, R.z1 - R.z0, zoccolo, R.x0 + .015, .05, 0); box(.03, .1, .11 - R.z0, zoccolo, R.x1 - .015, .05, (R.z0 + .11) / 2); box(.03, .1, R.z1 - 1.09, zoccolo, R.x1 - .015, .05, (R.z1 + 1.09) / 2);

  finestra(g, -.55, 1.55, R.z0 + .01, mat);

  // luci
  scene.add(new THREE.HemisphereLight(0xfff6ea, 0x8a7560, 1.4));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(-1.5, 5, 3.5); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: .5, far: 15 }); sun.shadow.bias = -.0005; sun.shadow.normalBias = .02; scene.add(sun); scene.add(sun.target);
  const caldo = new THREE.PointLight(0xffc98a, 6, 5, 1.6); caldo.position.set(-2, 1.9, 1.4); g.add(caldo);

  const put = async (file, x, y, z, ry = 0, s = S) => { const o = await model('mobili/' + file + '.gltf', { scale: s }); o.position.set(x, y, z); o.rotation.y = ry; g.add(o); return o; };
  const refs = {};
  await Promise.all([
    put('bed_single_A', -2.08, 0, -1.28).then(o => refs.letto = o),
    put('cabinet_small_decorated', -1.22, 0, -1.86, 0, .5),
    put('desk', 1.55, 0, -1.78).then(o => refs.scrivania = o),
    put('lamp_desk', 2.05, .6, -1.95, -.4, .45),
    put('book_set', 1.0, .66, -1.95, .2, .45),
    put('chair_desk_A', 2.3, 0, -.95, -2.2),
    put('shelf_B_large_decorated', -.55, 2.05, R.z0),
    put('pictureframe_large_A', 1.55, 1.55, R.z0, 0, .55).then(o => refs.cornice = o),
    put('rug_rectangle_stripes_A', .25, 0, .15, 0, .62),
    put('lamp_standing', 2.3, 0, -2.0, 0, .55),
    put('armchair_pillows', -2.05, 0, 1.25, Math.PI / 2, .6).then(o => refs.poltrona = o),
    put('cup_pencils', 1.82, .6, -1.9, .3, .5),
    put('rug_oval_A', -1.85, .005, 1.3, 0, .5),
    put('cactus_medium_A', -2.3, 0, 2.0, 0, .5),
    put('lamp_table', -2.35, 0, .45, 0, .45),
  ]);
  // poster nella cornice grande e sopra il letto
  { const b = new THREE.Box3().setFromObject(refs.cornice), sz = b.getSize(new THREE.Vector3());
    const q = new THREE.Mesh(new THREE.PlaneGeometry(sz.x * .78, sz.y * .8), new THREE.MeshStandardMaterial({ map: poster('kart'), roughness: .6 }));
    q.position.set((b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2, b.max.z - .008); g.add(q); }
  { const q = new THREE.Mesh(new THREE.PlaneGeometry(.55, .68), new THREE.MeshStandardMaterial({ map: poster('monti'), roughness: .6 }));
    q.position.set(R.x0 + .022, 1.45, -1.25); q.rotation.y = Math.PI / 2; g.add(q);
    const bordo = new THREE.Mesh(new THREE.BoxGeometry(.03, .74, .61), mat({ color: 0x8a5a3b })); bordo.position.set(R.x0 + .002, 1.45, -1.25); g.add(bordo); }
  // il disegno di Francesco: un foglio sulla scrivania e uno spazio sul muro dove appenderlo
  const foglio = new THREE.Mesh(new THREE.PlaneGeometry(.3, .21), mat({ color: 0xfdfdf8, roughness: .95 }));
  foglio.rotation.x = -Math.PI / 2; foglio.rotation.z = -.12; foglio.position.set(1.42, .612, -1.56); foglio.visible = false; g.add(foglio);
  const disegnoMuro = new THREE.Group(); disegnoMuro.position.set(.63, 1.42, R.z0 + .012); disegnoMuro.visible = false; g.add(disegnoMuro);
  const carta = new THREE.Mesh(new THREE.PlaneGeometry(.56, .42), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .9 })); disegnoMuro.add(carta);
  [[-.24, .18], [.24, .18]].forEach(([x, y]) => { const n = new THREE.Mesh(new THREE.PlaneGeometry(.09, .035), new THREE.MeshStandardMaterial({ color: 0x8fc7ea, roughness: .6 })); n.position.set(x, y, .002); n.rotation.z = x < 0 ? .5 : -.5; disegnoMuro.add(n); });

  // porta verso il salone (cardine a sinistra, si apre verso la stanza)
  const portaPivot = porta(g, R.x1, .15, mat);

  // tablet sulla scrivania
  const tablet = new THREE.Group();
  box(.3, .015, .21, mat({ color: 0x1f2633, roughness: .4 }), 0, 0, 0, tablet);
  const schermo = new THREE.Mesh(new THREE.PlaneGeometry(.27, .18), new THREE.MeshStandardMaterial({ color: 0x0b1020, emissive: 0x3a7bd5, emissiveIntensity: .7 }));
  schermo.rotation.x = -Math.PI / 2; schermo.position.y = .009; tablet.add(schermo);
  tablet.position.set(1.4, .61, -1.62); tablet.rotation.y = .25; g.add(tablet);

  // premi sbloccabili: sacco da boxe e kart giocattolo
  const sacco = new THREE.Group(); sacco.position.set(1.95, 0, 1.7); g.add(sacco);
  const tappTex = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#2f6fb3'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { c.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.08)'; c.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
    c.strokeStyle = 'rgba(10,30,60,.5)'; c.lineWidth = 3; c.beginPath(); c.moveTo(w / 2, 0); c.lineTo(w / 2, h); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 7; c.strokeRect(10, 10, w - 20, h - 20); });
  box(1.0, .03, 1.0, mat({ map: tappTex, roughness: .92 }), 0, .015, 0, sacco);
  // struttura: base, montante, braccio e rinforzo in tubo d'acciaio
  const asta = mat({ color: 0x2c313c, metalness: .7, roughness: .35 });
  const tubo = (r, l, x, y, z, rz = 0) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 12), asta); m.position.set(x, y, z); m.rotation.z = rz; m.castShadow = true; sacco.add(m); return m; };
  box(.46, .04, .46, asta, .33, .05, -.3, sacco); tubo(.035, 1.92, .35, 1.0, -.3); tubo(.03, .56, .1, 1.92, -.3, Math.PI / 2); tubo(.02, .46, .2, 1.725, -.3, .71);
  const saccoPivot = new THREE.Group(); saccoPivot.position.set(-.1, 1.89, -.3); sacco.add(saccoPivot);
  // il sacco: pelle rossa con cuciture e fascia, cinghie, anello e catena
  const pelle = canvasTex(512, 384, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#b23030'); gr.addColorStop(.5, '#e24c46'); gr.addColorStop(1, '#b23030'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { c.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.08)'; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    c.fillStyle = '#f4efe6'; c.fillRect(0, h * .43, w, h * .14); c.fillStyle = '#20263a'; c.font = 'italic 900 40px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('FORZA', w * .25, h * .5 + 2); c.fillText('FORZA', w * .75, h * .5 + 2);
    c.strokeStyle = 'rgba(50,10,10,.55)'; c.setLineDash([10, 7]); c.lineWidth = 3; [.16, .41, .59, .84].forEach(y => { c.beginPath(); c.moveTo(0, h * y); c.lineTo(w, h * y); c.stroke(); }); });
  // la capsula distribuisce la texture per numero di punti e non per altezza: qui la si stende sull'altezza vera del sacco
  const geoSacco = new THREE.CapsuleGeometry(.19, .52, 8, 24); { const p = geoSacco.attributes.position, uv = geoSacco.attributes.uv; for (let i = 0; i < p.count; i++) uv.setY(i, (p.getY(i) + .45) / .9); }
  const corpo = new THREE.Mesh(geoSacco, mat({ map: pelle, roughness: .42 })); corpo.position.y = -.88; corpo.castShadow = true; saccoPivot.add(corpo);
  const cuoio = mat({ color: 0x1d2130, roughness: .6 });
  for (const [x, z] of [[.11, .11], [-.11, .11], [.11, -.11], [-.11, -.11]]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .3, 6), cuoio); c.position.set(x / 2, -.36, z / 2); c.rotation.set(-Math.atan2(z, .28), 0, Math.atan2(x, .28)); saccoPivot.add(c); }
  const anello = new THREE.Mesh(new THREE.TorusGeometry(.03, .008, 8, 16), asta); anello.position.y = -.21; saccoPivot.add(anello);
  const catena = new THREE.Mesh(new THREE.CylinderGeometry(.009, .009, .2, 6), asta); catena.position.y = -.1; saccoPivot.add(catena);
  // lampo del colpo e schiacciamento del sacco
  const stella = canvasTex(128, 128, (c, w) => { c.translate(w / 2, w / 2); const gr = c.createRadialGradient(0, 0, 0, 0, 0, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,226,140,.85)'); gr.addColorStop(1, 'rgba(255,190,70,0)'); c.fillStyle = gr;
    c.beginPath(); for (let i = 0; i < 18; i++) { const a = i / 18 * 6.283, r = i % 2 ? w * .17 : w * .5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.fill(); });
  const lampo = new THREE.Sprite(new THREE.SpriteMaterial({ map: stella, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending })); lampo.visible = false; saccoPivot.add(lampo);
  let tLampo = 0;
  const saccoColpo = (calcio, forte = 1) => { lampo.position.set(-.2, calcio ? -1.05 : -.8, .08); lampo.material.rotation = Math.random() * 6; lampo.scale.setScalar((.34 + Math.random() * .12) * forte); lampo.visible = true;
    corpo.scale.set(.88, 1.03, 1.1); clearTimeout(tLampo); tLampo = setTimeout(() => { lampo.visible = false; corpo.scale.set(1, 1, 1); }, 90); };
  const kartGioco = await model('kart/kart-oopi.glb', { scale: .55 }); kartGioco.position.set(.55, 0, 1.75); kartGioco.rotation.y = -.6; g.add(kartGioco);
  kartGioco.traverse(o => { if (/character/i.test(o.name)) o.visible = false; });
  sacco.visible = false; kartGioco.visible = false;

  return { gruppo: g, pavimento: floor, portaPivot, tablet, sacco, saccoPivot, saccoColpo, sole: sun, muroPorta, kartGioco, poltrona: refs.poltrona, letto: refs.letto, scrivania: refs.scrivania, foglio, disegnoMuro, carta, caldo };
}

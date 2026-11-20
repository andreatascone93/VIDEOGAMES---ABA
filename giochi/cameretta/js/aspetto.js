// Aspetto dei personaggi: corpi, vestiti, capelli e visi costruiti in codice sopra lo scheletro animato Kenney.
// Lo scheletro e le animazioni restano quelli di sempre (camminata, corsa, seduto, pugno…); la vecchia pelle a blocchi
// viene nascosta e al suo posto ogni osso porta forme morbide disegnate per quel personaggio.
// Ogni personaggio ha un suo carattere: proporzioni, colori, acconciatura, un modo di stare fermo e di guardarsi intorno.
// Il viso è in 3D: occhi con iride e palpebre che sbattono, sopracciglia mobili, bocca e guance disegnate su una
// "maschera" che segue la curva della testa. Espone la stessa interfaccia del vecchio Volto: set(umore, rossore).
import * as THREE from 'three';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (cur, want, dt, k = 10) => cur + (want - cur) * (1 - Math.exp(-dt * k));

/* ------------------------------------------------------------------ i personaggi
   Misure in "metri di bambino": pensate per un personaggio alto 1,36 e scalate con l'altezza vera.
   Gli adulti hanno la testa più piccola rispetto al corpo, i bambini più grande: è il primo segnale dell'età. */
export const ASPETTI = {
  // 9 anni, sveglio e pieno di energia: ciuffo ribelle, maglietta con il fulmine, scarpe da corsa rosse
  francesco: {
    pelle: 0xf1c29c, iride: 0x6b4423, capelli: 0x3b2618, ciglia: 0x2a1a12,
    testa: { rx: .15, ry: .156, rz: .142, dy: .06 }, occhio: .034, distOcchi: .37,
    busto: { fianchi: .118, vita: .112, petto: .128, spalle: .12, prof: .72 }, braccio: .043, gamba: .056,
    capelliStile: 'ciuffo', naso: 'piccolo',
    maglia: { colore: 0x1f9e93, maniche: 'corte', motivo: 'fulmine', accento: 0xffd23f },
    pantaloni: { colore: 0x2e3b5e, lunghi: true }, scarpe: { colore: 0xe4483c, suola: 0xf5f5f0 },
    polsino: 0xffd23f,
    carattere: { energia: 1, sguardo: 1.4, ammicca: 3.2, dondola: .045 }
  },
  // la mamma: calda e paziente, chignon ramato, cardigan senape, orecchini
  mamma: {
    pelle: 0xf3c7a6, iride: 0x3f6b4a, capelli: 0xb4472a, ciglia: 0x3a1c12,
    testa: { rx: .118, ry: .132, rz: .114, dy: .05 }, occhio: .025, distOcchi: .36,
    busto: { fianchi: .118, vita: .094, petto: .112, spalle: .108, prof: .7 }, braccio: .04, gamba: .05,
    capelliStile: 'chignon', naso: 'fine', orecchini: 0xf2c14e, labbra: '#c0505a',
    maglia: { colore: 0xd99a2b, maniche: 'lunghe', motivo: 'cardigan', accento: 0xf6efe2 },
    pantaloni: { colore: 0x3e5a4a, lunghi: true }, scarpe: { colore: 0x7a4a33, suola: 0x4a2c1e },
    carattere: { energia: .45, sguardo: .8, ammicca: 4, dondola: .02 }
  },
  // il papà: alto, occhiali e barba corta, camicia con le maniche arrotolate; serio ma gentile
  papa: {
    pelle: 0xe2ac86, iride: 0x4a3420, capelli: 0x2b2420, ciglia: 0x1f1714, tempie: 0x8a8580,
    testa: { rx: .114, ry: .128, rz: .112, dy: .05 }, occhio: .022, distOcchi: .35,
    busto: { fianchi: .118, vita: .118, petto: .134, spalle: .13, prof: .72 }, braccio: .045, gamba: .055,
    capelliStile: 'corti', naso: 'grande', occhiali: 0x2a2f3a, barba: true,
    maglia: { colore: 0x8db6db, maniche: 'arrotolate', motivo: 'camicia', accento: 0xeef4fa },
    pantaloni: { colore: 0x5b5f6a, lunghi: true, cintura: 0x3b2a20 }, scarpe: { colore: 0x5a3a26, suola: 0x2d1d14 },
    carattere: { energia: .3, sguardo: .7, ammicca: 4.5, dondola: .012 }
  },
  // Leo: piccolo e vivace, ricci biondi, maglietta a righe, pantaloncini
  leo: {
    pelle: 0xf6d1b3, iride: 0x3d6ea8, capelli: 0xe0b45a, ciglia: 0x6b4a22,
    testa: { rx: .156, ry: .16, rz: .148, dy: .062 }, occhio: .037, distOcchi: .38,
    busto: { fianchi: .118, vita: .12, petto: .124, spalle: .114, prof: .76 }, braccio: .042, gamba: .052,
    capelliStile: 'ricci', naso: 'tondo',
    maglia: { colore: 0x3fae5a, maniche: 'corte', motivo: 'righe', accento: 0xf2f0e6 },
    pantaloni: { colore: 0xd8473c, lunghi: false }, scarpe: { colore: 0x2f6fd6, suola: 0xf5f5f0 },
    calzini: 0xf4f4f4,
    carattere: { energia: 1.2, sguardo: 1.8, ammicca: 2.8, dondola: .05 }
  },
  // Giulia: codini con le mollette, lentiggini, vestitino viola e leggings
  giulia: {
    pelle: 0xd49b74, iride: 0x3a2516, capelli: 0x4a2a1a, ciglia: 0x22140c,
    testa: { rx: .152, ry: .156, rz: .144, dy: .06 }, occhio: .036, distOcchi: .37,
    busto: { fianchi: .11, vita: .1, petto: .112, spalle: .108, prof: .72 }, braccio: .038, gamba: .046,
    capelliStile: 'codini', naso: 'piccolo', lentiggini: true, mollette: 0xffcf3f,
    maglia: { colore: 0x8a5cc7, maniche: 'corte', motivo: 'vestito', accento: 0xf7d36b },
    pantaloni: { colore: 0x2c2a44, lunghi: true }, scarpe: { colore: 0xf2b71f, suola: 0xf5f5f0 },
    carattere: { energia: .8, sguardo: 1.2, ammicca: 3.5, dondola: .035 }
  }
};

/* ------------------------------------------------------------------ geometrie */
// tubo con estremità arrotondate e raggi diversi alle due estremità, lungo l'asse y da 0 a len
function tubo(r1, r2, len, seg = 14) {
  const p = [], n = 6;
  for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + i / n * Math.PI / 2; p.push(new THREE.Vector2(Math.max(1e-4, r1 * Math.cos(a)), r1 * Math.sin(a))); }
  for (let i = 0; i <= n; i++) { const a = i / n * Math.PI / 2; p.push(new THREE.Vector2(Math.max(1e-4, r2 * Math.cos(a)), len + r2 * Math.sin(a))); }
  return new THREE.LatheGeometry(p, seg);
}
// solido di rotazione da un profilo [y, r] dal basso verso l'alto; il davanti (+z) cade a metà della texture
function profilo(righe, { chiudi = true, seg = 28 } = {}) {
  const p = [];
  if (chiudi) p.push(new THREE.Vector2(1e-4, righe[0][0] - righe[0][1] * .18), new THREE.Vector2(righe[0][1] * .7, righe[0][0] - righe[0][1] * .12));
  for (const [y, r] of righe) p.push(new THREE.Vector2(r, y));
  const u = righe[righe.length - 1];
  if (chiudi) p.push(new THREE.Vector2(u[1] * .7, u[0] + u[1] * .12), new THREE.Vector2(1e-4, u[0] + u[1] * .18));
  return new THREE.LatheGeometry(p, seg, Math.PI, Math.PI * 2);
}
// righe uniformi interpolando pochi punti chiave [y, r]
function interpola(chiavi, n = 14) {
  const out = [], y0 = chiavi[0][0], y1 = chiavi[chiavi.length - 1][0];
  for (let i = 0; i <= n; i++) {
    const y = lerp(y0, y1, i / n); let k = 0; while (k < chiavi.length - 2 && y > chiavi[k + 1][0]) k++;
    const [ya, ra] = chiavi[k], [yb, rb] = chiavi[k + 1], t = THREE.MathUtils.clamp((y - ya) / (yb - ya || 1), 0, 1);
    out.push([y, lerp(ra, rb, t * t * (3 - 2 * t))]);
  }
  return out;
}
function tela(w, h, disegna) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); disegna(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const stoffa = (colore, o = {}) => new THREE.MeshStandardMaterial({ color: colore, roughness: .86, metalness: 0, ...o });
const hex = c => '#' + new THREE.Color(c).getHexString();

/* ------------------------------------------------------------------ costruzione */
export function vesti(pers, nome) {
  const A = ASPETTI[nome] || ASPETTI.francesco;
  const model = pers.model, root = pers.root;
  // posa di legame dello scheletro, personaggio fermo nell'origine e girato verso +z
  const skinned = []; model.traverse(o => { if (o.isSkinnedMesh) skinned.push(o); });
  skinned.forEach(s => { s.skeleton.pose(); s.visible = false; });
  root.updateMatrixWorld(true);
  const B = pers.ossa, wp = n => B[n].getWorldPosition(V()).sub(root.position);
  const k = pers.altezzaVera / 1.36, K = x => x * k;
  const parti = [];
  const metti = (osso, mesh) => { mesh.castShadow = true; root.add(mesh); mesh.updateMatrixWorld(true); B[osso].attach(mesh); parti.push(mesh); return mesh; };
  const segmento = (osso, a, b, r1, r2, mat) => {
    const d = b.clone().sub(a), m = new THREE.Mesh(tubo(r1, r2, d.length()), mat);
    m.position.copy(a); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); return metti(osso, m);
  };
  const sfera = (osso, pos, r, mat, sc = [1, 1, 1], seg = 18) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * .7)), mat); m.position.copy(pos); m.scale.set(...sc); return metti(osso, m); };

  const pelle = new THREE.MeshStandardMaterial({ color: A.pelle, roughness: .62, metalness: 0, emissive: new THREE.Color(A.pelle).multiplyScalar(.06) });
  const maglia = stoffa(A.maglia.colore), pant = stoffa(A.pantaloni.colore, { roughness: .9 });
  const scarpa = stoffa(A.scarpe.colore, { roughness: .55 }), suola = stoffa(A.scarpe.suola, { roughness: .7 });

  const hips = wp('Hips'), spine = wp('Spine'), neck = wp('Neck'), head = wp('Head');
  const cx = (wp('LeftUpLeg').x + wp('RightUpLeg').x) / 2, cz = hips.z;
  const b = A.busto;

  /* --- busto: bacino (pantaloni) e torace (maglia) */
  {
    const ul = wp('LeftUpLeg'), yB = ul.y + K(.005), yS = spine.y + K(.04), rf = Math.max(K(b.fianchi), Math.abs(ul.x - cx) + K(A.gamba) * .55);
    const g = profilo([[yB - K(.018) - hips.y, rf * .3], [yB - K(.008) - hips.y, rf * .7], [yB - hips.y, rf * .9], ...interpola([[ul.y - hips.y, rf], [yS - hips.y, K(b.vita)]], 5)], { chiudi: true });
    const m = new THREE.Mesh(g, pant); m.position.set(cx, hips.y, cz); m.scale.z = b.prof; metti('Hips', m);
    if (A.pantaloni.cintura) { const c = new THREE.Mesh(new THREE.TorusGeometry(K(b.vita) * 1.01, K(.009), 6, 28), stoffa(A.pantaloni.cintura, { roughness: .5 })); c.rotation.x = Math.PI / 2; c.position.set(cx, spine.y + K(.02), cz); c.scale.y = b.prof; metti('Hips', c); }
  }
  {
    const y0 = spine.y - K(.025), y1 = neck.y + K(.035), arm = wp('LeftArm'), ys = arm.y - K(.01);
    const rs = Math.max(K(b.spalle), Math.abs(arm.x - cx) - K(A.braccio) * .2);
    const chiavi = [[0, K(b.vita)], [(ys - y0) * .62, K(b.petto)], [ys - y0, rs], [(ys - y0) + (y1 - ys) * .55, rs * .78], [y1 - y0, K(.055)]];
    const map = magliaTex(A);
    const m = new THREE.Mesh(profilo(interpola(chiavi, 16)), stoffa(0xffffff, { map }));
    m.position.set(cx, y0, cz); m.scale.z = b.prof; metti('Chest', m);
    if (A.maglia.motivo === 'vestito') { // gonna che si allarga dai fianchi
      const gon = profilo([[-K(.2), K(.19)], [-K(.1), K(.16)], [0, K(b.vita * 1.05)]], { chiudi: false, seg: 30 });
      const gm = new THREE.Mesh(gon, stoffa(A.maglia.colore, { side: THREE.DoubleSide })); gm.position.set(cx, spine.y + K(.01), cz); gm.scale.z = .85; metti('Hips', gm);
      const orlo = new THREE.Mesh(new THREE.TorusGeometry(K(.19), K(.008), 6, 32), stoffa(A.maglia.accento)); orlo.rotation.x = Math.PI / 2; orlo.position.set(cx, spine.y + K(.01) - K(.2), cz); orlo.scale.y = .85; metti('Hips', orlo);
    }
  }
  /* --- collo */
  segmento('Neck', V(neck.x, neck.y - K(.03), neck.z), V(head.x, head.y + K(.02), head.z - K(.01)), K(.038), K(.036), pelle);

  /* --- braccia */
  for (const s of ['Left', 'Right']) {
    const sp = wp(s + 'Arm'), el = wp(s + 'ForeArm'), ha = wp(s + 'Hand');
    const ra = K(A.braccio), m = A.maglia.maniche;
    sfera(s + 'Arm', sp, ra * 1.08, maglia);
    if (m === 'lunghe') { segmento(s + 'Arm', sp, el, ra * 1.1, ra * .98, maglia); segmento(s + 'ForeArm', el, ha, ra * .98, ra * .86, maglia); }
    else {
      const mid = sp.clone().lerp(el, m === 'arrotolate' ? 1.0 : .62);
      segmento(s + 'Arm', sp, mid, ra * 1.18, ra * 1.08, maglia);
      segmento(s + 'Arm', mid.clone().lerp(sp, .05), el, ra * .88, ra * .82, m === 'arrotolate' ? maglia : pelle);
      segmento(s + 'ForeArm', el, ha, ra * .8, ra * .68, pelle);
      if (m === 'arrotolate') { const r = new THREE.Mesh(new THREE.TorusGeometry(ra * .92, ra * .28, 8, 18), maglia); r.position.copy(el.clone().lerp(ha, .12)); r.quaternion.setFromUnitVectors(V(0, 0, 1), ha.clone().sub(el).normalize()); metti(s + 'ForeArm', r); }
    }
    if (m === 'lunghe') { const p = new THREE.Mesh(new THREE.TorusGeometry(ra * .86, ra * .22, 8, 18), stoffa(A.maglia.accento)); p.position.copy(el.clone().lerp(ha, .9)); p.quaternion.setFromUnitVectors(V(0, 0, 1), ha.clone().sub(el).normalize()); metti(s + 'ForeArm', p); }
    if (A.polsino && s === 'Left') { const p = new THREE.Mesh(new THREE.TorusGeometry(ra * .72, ra * .3, 8, 18), stoffa(A.polsino)); p.position.copy(el.clone().lerp(ha, .82)); p.quaternion.setFromUnitVectors(V(0, 0, 1), ha.clone().sub(el).normalize()); metti(s + 'ForeArm', p); }
    // mano: palmo a manopola più pollice
    const i2 = wp(s + 'HandIndex2'), th = wp(s + 'HandThumb2');
    const dir = i2.clone().sub(ha), lm = dir.length();
    const mano = new THREE.Mesh(tubo(K(.03), K(.026), lm * .82, 12), pelle);
    mano.position.copy(ha.clone().addScaledVector(dir.normalize(), K(.005))); mano.quaternion.setFromUnitVectors(V(0, 1, 0), dir); mano.scale.set(1, 1, .62); metti(s + 'Hand', mano);
    segmento(s + 'Hand', ha.clone().lerp(th, .25), th, K(.013), K(.012), pelle);
  }

  /* --- gambe e scarpe */
  for (const s of ['Left', 'Right']) {
    const hp = wp(s + 'UpLeg'), kn = wp(s + 'Leg'), ft = wp(s + 'Foot'), to = wp(s + 'Toes');
    const rg = K(A.gamba), lunghi = A.pantaloni.lunghi;
    sfera(s + 'UpLeg', hp, rg * 1.02, pant);
    if (lunghi) { segmento(s + 'UpLeg', hp, kn, rg * 1.05, rg * .86, pant); segmento(s + 'Leg', kn, ft, rg * .84, rg * .7, pant); }
    else {
      const mid = hp.clone().lerp(kn, .55);
      segmento(s + 'UpLeg', hp, mid, rg * 1.08, rg * 1.02, pant);
      segmento(s + 'UpLeg', mid, kn, rg * .76, rg * .68, pelle);
      segmento(s + 'Leg', kn, ft, rg * .66, rg * .54, pelle);
      if (A.calzini) segmento(s + 'Leg', kn.clone().lerp(ft, .72), ft, rg * .6, rg * .58, stoffa(A.calzini));
    }
    // scarpa: tomaia arrotondata e suola chiara, dal tallone alla punta
    const f2 = V(ft.x, 0, ft.z), t2 = V(to.x, 0, to.z), avanti = t2.clone().sub(f2).normalize();
    const tallone = f2.clone().addScaledVector(avanti, -K(.045)), punta = t2.clone().addScaledVector(avanti, K(.045));
    const lungh = punta.distanceTo(tallone), centro = tallone.clone().lerp(punta, .5);
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), avanti);
    const tom = new THREE.Mesh(new THREE.SphereGeometry(.5, 20, 12), scarpa); tom.scale.set(K(.1), K(.085), lungh * 1.1); tom.position.copy(centro).setY(K(.038)); tom.quaternion.copy(q); metti(s + 'Foot', tom);
    const so = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 1, 20), suola); so.scale.set(K(.104), K(.026), lungh * 1.12); so.position.copy(centro).setY(K(.013)); so.quaternion.copy(q); metti(s + 'Foot', so);
    sfera(s + 'Foot', V(ft.x, K(.06), ft.z), rg * .78, A.pantaloni.lunghi ? pant : (A.calzini ? stoffa(A.calzini) : pelle));
  }

  /* --- testa e viso */
  const T = { rx: K(A.testa.rx), ry: K(A.testa.ry), rz: K(A.testa.rz) };
  const testa = new THREE.Group(); testa.position.set(head.x, head.y + K(A.testa.dy), head.z + K(.012));
  const pelleViso = pelle.clone();
  // cranio e viso in un solo pezzo: guance piene in basso, mascella che si stringe verso il mento
  const cranio = new THREE.Mesh(formaTesta(new THREE.SphereGeometry(1, 48, 32), T), pelleViso); cranio.castShadow = true; testa.add(cranio);
  const sup = (th, ph, out = 0) => V(T.rx * Math.sin(th) * Math.sin(ph), T.ry * Math.cos(th), T.rz * Math.sin(th) * Math.cos(ph)).multiplyScalar(1 + out);
  // orecchie
  for (const s of [-1, 1]) { const o = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), pelleViso); o.scale.set(T.rx * .16, T.ry * .27, T.rz * .2); o.position.copy(sup(.56 * Math.PI, s * Math.PI / 2, -.04)); o.rotation.y = s * .3; o.castShadow = true; testa.add(o);
    if (A.orecchini) { const e = new THREE.Mesh(new THREE.SphereGeometry(K(.011), 10, 8), new THREE.MeshStandardMaterial({ color: A.orecchini, metalness: .8, roughness: .25 })); e.position.copy(o.position).add(V(s * T.rx * .03, -T.ry * .3, 0)); testa.add(e); } }
  // naso
  { const n = { piccolo: [.13, .12, .14], fine: [.11, .14, .15], grande: [.15, .17, .2], tondo: [.15, .13, .14] }[A.naso] || [.13, .12, .14];
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), pelleViso); m.scale.set(T.rx * n[0], T.ry * n[1], T.rz * n[2]); m.position.copy(sup(.6 * Math.PI, 0, -.04)); m.castShadow = true; testa.add(m); }
  // maschera del viso: bocca, guance, lentiggini, barba; segue la curva del cranio
  const mascheraTela = document.createElement('canvas'); mascheraTela.width = mascheraTela.height = 256;
  const mascheraTex = new THREE.CanvasTexture(mascheraTela); mascheraTex.colorSpace = THREE.SRGBColorSpace; mascheraTex.anisotropy = 4;
  const PH = .72, TH0 = .5 * Math.PI, TH1 = .9 * Math.PI;
  const maschera = new THREE.Mesh(formaTesta(new THREE.SphereGeometry(1.004, 32, 24, Math.PI / 2 - PH, PH * 2, TH0, TH1 - TH0), T),
    new THREE.MeshStandardMaterial({ map: mascheraTex, transparent: true, roughness: .62, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  testa.add(maschera);

  // occhi
  const occhi = [], palpebre = [], sopracc = [];
  const re = K(A.occhio);
  const iride = tela(256, 128, (g, w, h) => {
    g.fillStyle = '#fbfbf8'; g.fillRect(0, 0, w, h);
    const x = w * .25, y = h * .5, r = h * .135;
    const gr = g.createRadialGradient(x, y, r * .2, x, y, r); gr.addColorStop(0, hex(new THREE.Color(A.iride).multiplyScalar(1.5))); gr.addColorStop(.75, hex(A.iride)); gr.addColorStop(1, hex(new THREE.Color(A.iride).multiplyScalar(.45)));
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r * 1.05, r, 0, 0, 7); g.fill();
    g.fillStyle = '#120c0a'; g.beginPath(); g.ellipse(x, y, r * .5, r * .48, 0, 0, 7); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x - r * .35, y - r * .38, r * .22, r * .2, 0, 0, 7); g.fill();
    g.globalAlpha = .7; g.beginPath(); g.ellipse(x + r * .3, y + r * .3, r * .09, r * .09, 0, 0, 7); g.fill(); g.globalAlpha = 1;
  });
  const bianco = new THREE.MeshStandardMaterial({ map: iride, roughness: .18, metalness: 0 });
  const nero = new THREE.MeshStandardMaterial({ color: A.ciglia, roughness: .6 });
  const capMat = stoffa(A.capelli, { roughness: .7 });
  for (const s of [-1, 1]) {
    const pos = sup(.53 * Math.PI, s * A.distOcchi, -.02).addScaledVector(V(0, 0, 1), -re * .22);
    const perno = new THREE.Group(); perno.position.copy(pos); perno.rotation.y = s * .1; testa.add(perno);
    const occhio = new THREE.Mesh(new THREE.SphereGeometry(re, 24, 16), bianco); occhio.scale.set(1, 1.08, 1); perno.add(occhio); occhi.push(occhio);
    const lid = (alto) => {
      const p = new THREE.Group(); perno.add(p);
      const m = new THREE.Mesh(new THREE.SphereGeometry(re * 1.12, 24, 10, 0, Math.PI * 2, alto ? 0 : Math.PI / 2, Math.PI / 2), pelleViso);
      m.material = pelleViso; m.scale.y = 1.08; const l = new THREE.Group(); l.add(m); p.add(l);
      if (alto) { const t = new THREE.Mesh(new THREE.TorusGeometry(re * 1.12, re * .14, 6, 20, Math.PI), nero); t.rotation.x = Math.PI / 2; l.add(t); }
      return { perno: p, lid: l };
    };
    palpebre.push({ su: lid(true), giu: lid(false), lato: s });
    // sopracciglio
    const br = new THREE.Mesh(new THREE.CapsuleGeometry(re * .2, re * 1.2, 4, 8), A.tempie ? nero : stoffa(A.capelli, { roughness: .8 }));
    br.rotation.z = Math.PI / 2; const bp = new THREE.Group(); bp.position.copy(sup(.415 * Math.PI, s * A.distOcchi * 1.02, .02)); bp.rotation.y = s * A.distOcchi * .9; bp.add(br); testa.add(bp);
    sopracc.push({ g: bp, base: bp.position.clone(), lato: s });
  }
  if (A.occhiali) {
    const mo = new THREE.MeshStandardMaterial({ color: A.occhiali, roughness: .35, metalness: .3 });
    const lente = new THREE.MeshStandardMaterial({ color: 0xdfefff, transparent: true, opacity: .14, roughness: .05, depthWrite: false });
    for (const s of [-1, 1]) {
      const p = sup(.53 * Math.PI, s * A.distOcchi, .1);
      const r = new THREE.Mesh(new THREE.TorusGeometry(re * 1.75, K(.0045), 8, 28), mo); r.position.copy(p); r.rotation.y = s * .18; r.scale.y = .8; testa.add(r);
      const l = new THREE.Mesh(new THREE.CircleGeometry(re * 1.75, 24), lente); l.position.copy(p); l.rotation.y = s * .18; l.scale.y = .8; testa.add(l);
      const a = new THREE.Mesh(new THREE.CylinderGeometry(K(.004), K(.004), T.rz * 1.05, 6), mo); a.rotation.x = Math.PI / 2; a.position.set(s * T.rx * .98, p.y, p.z - T.rz * .5); testa.add(a);
    }
    const ponte = new THREE.Mesh(new THREE.CylinderGeometry(K(.004), K(.004), T.rx * A.distOcchi * .55, 6), mo); ponte.rotation.z = Math.PI / 2; ponte.position.copy(sup(.5 * Math.PI, 0, .1)); testa.add(ponte);
  }
  capelli(A, testa, T, K, capMat, sup);
  const misure = { testaY: testa.position.y - head.y, testaZ: testa.position.z - head.z, rx: T.rx, ry: T.ry, rz: T.rz };
  root.add(testa); testa.updateMatrixWorld(true); B.Head.attach(testa);
  testa.traverse(o => { if (o.isMesh && !o.material.transparent) o.castShadow = true; });

  /* --- ombra morbida a terra */
  const ombra = new THREE.Mesh(new THREE.CircleGeometry(K(.3), 28), new THREE.MeshBasicMaterial({ map: ombraTex(), transparent: true, depthWrite: false, opacity: .55 }));
  ombra.rotation.x = -Math.PI / 2; ombra.position.y = .006; ombra.renderOrder = -1; root.add(ombra);

  const viso = new Viso({ A, testa, occhi, palpebre, sopracc, mascheraTela, mascheraTex, pelleViso, re, k });
  // riprende la posa animata
  skinned.forEach(s => s.visible = false);
  return { viso, ombra, testa, misure };
}

// deforma una sfera unitaria nella forma della testa (le stesse regole valgono per la maschera del viso)
function formaTesta(geo, T) {
  const p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); const r = v.length(), n = v.clone().divideScalar(r);
    const avanti = THREE.MathUtils.smoothstep(n.z, -.2, .6), giu = Math.max(0, -n.y);
    let f = 1 + .07 * avanti * Math.exp(-Math.pow((n.y + .42) / .3, 2));   // guance
    const sx = 1 - .16 * Math.pow(Math.max(0, giu - .25) / .75, 1.5);      // mascella più stretta verso il mento
    p.setXYZ(i, n.x * r * f * sx * T.rx, n.y * r * f * T.ry, n.z * r * f * T.rz);
  }
  geo.computeVertexNormals(); return geo;
}

let _ombra;
function ombraTex() {
  return _ombra || (_ombra = tela(128, 128, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 4, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(20,14,10,.75)'); gr.addColorStop(.55, 'rgba(20,14,10,.35)'); gr.addColorStop(1, 'rgba(20,14,10,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); }));
}

// la stoffa della maglia: colore, cuciture, motivo; il davanti è al centro della texture
function magliaTex(A) {
  const M = A.maglia;
  return tela(512, 256, (g, w, h) => {
    g.fillStyle = hex(M.colore); g.fillRect(0, 0, w, h);
    // trama leggera
    g.globalAlpha = .025; for (let y = 0; y < h; y += 3) { g.fillStyle = y % 6 ? '#000' : '#fff'; g.fillRect(0, y, w, 1); } g.globalAlpha = 1;
    const fx = w / 2;
    if (M.motivo === 'righe') { g.fillStyle = hex(M.accento); for (let y = 24; y < h - 30; y += 34) g.fillRect(0, h - y - 14, w, 14); }
    if (M.motivo === 'fulmine') {
      // fulmine stilizzato dentro un cerchio, sul petto
      const cy = h * .42; g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.arc(fx, cy, 34, 0, 7); g.fill();
      g.strokeStyle = hex(M.accento); g.lineWidth = 5; g.beginPath(); g.arc(fx, cy, 34, 0, 7); g.stroke();
      g.fillStyle = hex(M.accento); g.beginPath(); g.moveTo(fx + 6, cy - 26); g.lineTo(fx - 14, cy + 4); g.lineTo(fx - 1, cy + 4); g.lineTo(fx - 8, cy + 26); g.lineTo(fx + 15, cy - 6); g.lineTo(fx + 2, cy - 6); g.closePath(); g.fill();
      g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, h - 10, w, 10);
    }
    if (M.motivo === 'cardigan') {
      // canotta chiara sotto, bottoni lungo l'apertura
      g.fillStyle = hex(M.accento); g.beginPath(); g.moveTo(fx - 26, 0); g.lineTo(fx + 26, 0); g.lineTo(fx + 12, h); g.lineTo(fx - 12, h); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = 3; g.beginPath(); g.moveTo(fx - 12, 0); g.lineTo(fx - 26, h); g.moveTo(fx + 12, 0); g.lineTo(fx + 26, h); g.stroke();
      g.fillStyle = '#7a4f1e'; for (let y = 60; y < h - 20; y += 36) { g.beginPath(); g.arc(fx - 30, h - y, 4, 0, 7); g.fill(); }
      g.globalAlpha = .12; g.fillStyle = '#fff'; for (let x = 0; x < w; x += 8) g.fillRect(x, 0, 2, h); g.globalAlpha = 1;
    }
    if (M.motivo === 'camicia') {
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; for (let x = 0; x < w; x += 10) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
      g.strokeStyle = 'rgba(30,60,100,.3)'; g.lineWidth = 2; g.beginPath(); g.moveTo(fx, 0); g.lineTo(fx, h); g.stroke();
      g.fillStyle = hex(M.accento); for (let y = 30; y < h - 20; y += 40) { g.beginPath(); g.arc(fx + 5, h - y, 3.5, 0, 7); g.fill(); }
      // colletto
      g.fillStyle = hex(new THREE.Color(M.colore).multiplyScalar(1.12)); g.beginPath(); g.moveTo(fx - 40, 0); g.lineTo(fx, 22); g.lineTo(fx + 40, 0); g.closePath(); g.fill();
    }
    if (M.motivo === 'vestito') {
      g.fillStyle = hex(M.accento); for (let i = 0; i < 9; i++) { const x = fx - 44 + (i % 3) * 44 + (i / 3 | 0) * 10, y = h * .3 + (i / 3 | 0) * 40; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.ellipse(fx, 0, 46, 18, 0, 0, Math.PI); g.fill();
    }
  });
}

/* ------------------------------------------------------------------ capelli */
function capelli(A, testa, T, K, mat, sup) {
  const add = (geo, pos, sc, rot = [0, 0, 0], m = mat) => { const x = new THREE.Mesh(geo, m); x.position.copy(pos); x.scale.set(...sc); x.rotation.set(...rot); x.castShadow = true; testa.add(x); return x; };
  const S = (n = 1) => new THREE.SphereGeometry(1, 22 * n, 16 * n);
  // calotta: y e z con lo stesso raggio, così inclinandola non entra mai nel cranio
  const calotta = (cop = .58, sx = 1.07, sy = 1.08, sz = 1.08, incl = -.6) => {
    const g = new THREE.SphereGeometry(1, 36, 20, 0, Math.PI * 2, 0, cop * Math.PI), r = Math.max(T.ry, T.rz);
    return add(g, V(0, 0, 0), [T.rx * sx * 1.02, r * Math.max(sy, sz) * 1.02, r * Math.max(sy, sz) * 1.02], [incl, 0, 0]);
  };
  switch (A.capelliStile) {
    case 'ciuffo': {
      calotta(.6, 1.07, 1.08, 1.08, -.66);
      // nuca piena
      add(S(), V(0, -T.ry * .1, -T.rz * .38), [T.rx * .98, T.ry * .78, T.rz * .7]);
      // ciuffi spettinati che puntano in su e in avanti
      // ciocche morbide a goccia, un po' disordinate
      const goccia = new THREE.SphereGeometry(1, 14, 10); goccia.translate(0, .8, 0);
      const ciuffi = [[-.3, .82, .42, .9, .25], [0, .9, .48, .75, -.1], [.3, .84, .4, .85, -.35], [.55, .62, .3, .5, -.95], [-.6, .64, .25, .5, .9], [.02, .98, .05, .15, -.2], [-.28, .9, -.25, -.5, .35], [.3, .88, -.3, -.55, -.3], [.0, .8, -.55, -1.0, .1]];
      for (const [x, y, z, rx, rz] of ciuffi) add(goccia, V(T.rx * x, T.ry * y, T.rz * z), [T.rx * .17, T.ry * .2, T.rx * .13], [rx, 0, rz]);
      // ciocche sulla fronte che rompono la linea dei capelli
      for (let i = 0; i < 5; i++) { const ph = -.5 + i * .25, th = .3 * Math.PI + Math.abs(ph) * .1; add(goccia, sup(th, ph, -.02), [T.rx * .13, T.ry * .17, T.rx * .1], [2.3 + Math.random() * .3, ph * .9, ph * .6]); }
      // frangia che cade di lato sulla fronte
      add(S(), V(T.rx * .18, T.ry * .62, T.rz * .62), [T.rx * .62, T.ry * .2, T.rz * .3], [.35, 0, -.35]);
      // basette
      for (const s of [-1, 1]) add(S(), V(s * T.rx * .9, T.ry * .02, T.rz * .05), [T.rx * .14, T.ry * .3, T.rz * .3]);
      break;
    }
    case 'chignon': {
      calotta(.6, 1.06, 1.08, 1.1, -.62);
      add(S(), V(0, T.ry * .78, -T.rz * .65), [T.rx * .48, T.ry * .45, T.rz * .45]);           // chignon
      const el = new THREE.Mesh(new THREE.TorusGeometry(T.rx * .4, T.rx * .07, 8, 20), stoffa(0x2d6a8a)); el.position.set(0, T.ry * .66, -T.rz * .5); el.rotation.x = -.9; testa.add(el);
      add(S(), V(-T.rx * .35, T.ry * .66, T.rz * .5), [T.rx * .7, T.ry * .22, T.rz * .38], [.5, 0, .45]);   // frangia morbida
      for (const s of [-1, 1]) add(S(), V(s * T.rx * .9, -T.ry * .25, T.rz * .02), [T.rx * .16, T.ry * .55, T.rz * .32], [0, 0, s * -.1]); // ciocche ai lati
      add(S(), V(0, -T.ry * .05, -T.rz * .45), [T.rx * 1.0, T.ry * .85, T.rz * .62]);
      break;
    }
    case 'corti': {
      calotta(.56, 1.05, 1.05, 1.06, -.68);
      add(S(), V(0, -T.ry * .12, -T.rz * .4), [T.rx * .96, T.ry * .72, T.rz * .66]);
      const tempie = stoffa(A.tempie || A.capelli, { roughness: .8 });
      for (const s of [-1, 1]) add(S(), V(s * T.rx * .9, T.ry * .05, T.rz * .02), [T.rx * .14, T.ry * .32, T.rz * .4], [0, 0, 0], tempie);
      add(S(), V(T.rx * .1, T.ry * .78, T.rz * .4), [T.rx * .72, T.ry * .2, T.rz * .4], [.3, 0, -.15]);
      break;
    }
    case 'ricci': {
      calotta(.56, 1.03, 1.04, 1.05, -.62);
      const r = new THREE.SphereGeometry(1, 12, 9);
      for (let i = 0; i < 26; i++) {
        const th = .08 * Math.PI + (i % 5) * .11 * Math.PI, ph = i * 2.4;
        if (th > .45 * Math.PI && Math.cos(ph) > .2) continue; // niente ricci sugli occhi
        add(r, sup(th, ph, .04), [T.rx * .2, T.rx * .2, T.rx * .2]);
      }
      break;
    }
    case 'codini': {
      calotta(.6, 1.06, 1.08, 1.08, -.58);
      add(S(), V(0, -T.ry * .05, -T.rz * .42), [T.rx * .98, T.ry * .82, T.rz * .66]);
      add(S(), V(0, T.ry * .62, T.rz * .58), [T.rx * .82, T.ry * .2, T.rz * .3], [.4, 0, 0]);        // frangetta dritta
      const fiocco = stoffa(A.mollette || 0xffcf3f, { roughness: .5 });
      for (const s of [-1, 1]) {
        const base = V(s * T.rx * .95, T.ry * .25, -T.rz * .2);
        add(S(), base.clone().add(V(s * T.rx * .32, -T.ry * .35, -T.rz * .05)), [T.rx * .22, T.ry * .5, T.rz * .24], [0, 0, s * .45]);
        add(S(), base, [T.rx * .14, T.rx * .1, T.rx * .14], [0, 0, 0], fiocco);
      }
      break;
    }
  }
}

/* ------------------------------------------------------------------ il viso */
// espressioni: sopracciglia (alza, angolo verso il centro), palpebre (apertura, inclinazione, guancia che sale), bocca
const ESPR = {
  felice: { su: .02, ang: -.1, apre: .95, incl: 0, giu: .3, bocca: 'sorriso' },
  normale: { su: 0, ang: 0, apre: .88, incl: 0, giu: .05, bocca: 'neutra' },
  calmo: { su: .006, ang: -.12, apre: .66, incl: -.08, giu: .35, bocca: 'dolce' },
  seccato: { su: -.008, ang: .28, apre: .78, incl: .14, giu: .12, bocca: 'storta' },
  arrabbiato: { su: -.018, ang: .5, apre: .78, incl: .3, giu: .2, bocca: 'denti' },
  furioso: { su: -.024, ang: .62, apre: .85, incl: .38, giu: .2, bocca: 'urlo' },
  sorpreso: { su: .03, ang: -.15, apre: 1.1, incl: 0, giu: 0, bocca: 'o' },
  preoccupato: { su: .012, ang: -.4, apre: .9, incl: -.12, giu: .05, bocca: 'giu' },
  serio: { su: -.004, ang: .12, apre: .8, incl: .04, giu: .05, bocca: 'piatta' },
  sorriso: { su: .01, ang: -.05, apre: .95, incl: 0, giu: .22, bocca: 'dolce' }
};
export const UMORI = Object.keys(ESPR);

export class Viso {
  constructor(o) {
    Object.assign(this, o);
    this.umore = null; this.rossore = 0; this.rosso = 0;
    this.e = { ...ESPR.normale }; this.target = ESPR.normale;
    this.ammicca = 1 + Math.random() * 2; this.chiude = 0;
    this.sguardo = V(); this.sguardoT = V(); this.prossimoSguardo = .5;
    this.parlando = false; this.tParla = 0; this.fotogramma = 'chiusa';
    this.pelleBase = new THREE.Color(o.A.pelle); this.disegnata = '';
    this.set('felice', 0);
  }
  // stessa interfaccia del vecchio Volto: umore e rossore 0..1
  set(umore, rossore = this.rossore) {
    if (!ESPR[umore]) umore = 'normale';
    this.umore = umore; this.rossore = rossore; this.target = ESPR[umore];
    this.disegna();
  }
  parla(on) { this.parlando = !!on; if (!on) { this.fotogramma = 'chiusa'; this.disegna(); } }
  update(dt) {
    const t = this.target, e = this.e;
    for (const key of ['su', 'ang', 'apre', 'incl', 'giu']) e[key] = smooth(e[key], t[key], dt, 9);
    this.rosso = smooth(this.rosso, this.rossore, dt, 4);
    // sbattere le palpebre (più spesso quando è teso)
    this.ammicca -= dt * (1 + this.rossore * 1.5);
    if (this.ammicca <= 0) { this.chiude = .14; this.ammicca = (this.A.carattere?.ammicca || 3.5) * (.5 + Math.random()); }
    let blink = 0; if (this.chiude > 0) { this.chiude -= dt; blink = Math.sin(Math.max(0, this.chiude) / .14 * Math.PI); }
    // piccoli movimenti degli occhi: chi è più vivace si guarda intorno di più
    this.prossimoSguardo -= dt;
    if (this.prossimoSguardo <= 0) {
      const v = this.A.carattere?.sguardo || 1, furia = this.umore === 'furioso' || this.umore === 'arrabbiato';
      this.sguardoT.set((Math.random() - .5) * .1 * (furia ? .3 : 1), (Math.random() - .5) * .5 * v * (furia ? .3 : 1), 0);
      if (Math.random() < .35) this.sguardoT.set(0, 0, 0);
      this.prossimoSguardo = (.6 + Math.random() * 2.2) / v;
    }
    this.sguardo.lerp(this.sguardoT, 1 - Math.exp(-dt * 18));
    for (const o of this.occhi) { o.rotation.x = this.sguardo.x; o.rotation.y = this.sguardo.y; }
    // palpebre: apertura 1 = occhio aperto con la palpebra appena sopra l'iride
    const apre = Math.max(0, e.apre * (1 - blink));
    for (const p of this.palpebre) {
      p.su.lid.rotation.x = lerp(Math.PI / 2 + .12, -.85, Math.min(apre, 1.12));
      p.su.perno.rotation.z = p.lato * e.incl;
      p.giu.lid.rotation.x = lerp(1.1, -.05, e.giu) - blink * .3;
      p.giu.perno.rotation.z = -p.lato * e.incl * .3;
    }
    for (const s of this.sopracc) {
      s.g.position.copy(s.base); s.g.position.y += e.su * this.k + (this.parlando ? Math.sin(this.tParla * 7) * .002 * this.k : 0);
      s.g.rotation.z = s.lato * e.ang;
    }
    // la pelle del viso si scalda con la rabbia
    this.pelleViso.color.copy(this.pelleBase).lerp(new THREE.Color(0xff6a55), this.rosso * .32);
    // bocca che parla
    if (this.parlando) {
      this.tParla -= dt;
      if (this.tParla <= 0) { this.tParla = .08 + Math.random() * .09; const f = ['a', 'o', 'e', 'chiusa', 'a', 'e']; this.fotogramma = f[(Math.random() * f.length) | 0]; this.disegna(); }
    }
  }
  disegna() {
    const bocca = this.parlando && this.fotogramma !== 'chiusa' ? 'parla-' + this.fotogramma : this.target.bocca;
    const chiave = bocca + '|' + Math.round(this.rossore * 10);
    if (chiave === this.disegnata) return; this.disegnata = chiave;
    const g = this.mascheraTela.getContext('2d'), W = 256, A = this.A;
    g.clearRect(0, 0, W, W);
    // la maschera bassa copre da metà testa (alto) al mento (basso): bocca intorno al 58%, guance al 30%
    const cx = W / 2, by = W * .47, gy = W * .27;
    // guance: sempre un po' rosate, accese quando sale la rabbia
    const gu = .16 + this.rossore * .5;
    for (const s of [-1, 1]) { const x = cx + s * W * .3, gr = g.createRadialGradient(x, gy, 2, x, gy, W * .13); gr.addColorStop(0, `rgba(240,90,85,${gu})`); gr.addColorStop(1, 'rgba(240,90,85,0)'); g.fillStyle = gr; g.fillRect(x - W * .15, gy - W * .15, W * .3, W * .3); }
    if (A.lentiggini) { g.fillStyle = 'rgba(120,60,30,.45)'; for (let i = 0; i < 16; i++) { const s = i % 2 ? 1 : -1, a = i * 2.3; g.beginPath(); g.arc(cx + s * (W * .2 + Math.cos(a) * 18), gy - 10 + Math.sin(a) * 12, 2.2, 0, 7); g.fill(); } }
    if (A.barba) { // barba corta: ombra sul mento e sulle mascelle, con il buco per la bocca
      g.fillStyle = 'rgba(55,42,36,.55)'; g.beginPath(); g.ellipse(cx, by + 30, W * .4, W * .3, 0, 0, Math.PI); g.lineTo(cx - W * .4, by - 6); g.quadraticCurveTo(cx, by - 26, cx + W * .4, by - 6); g.fill();
      g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.ellipse(cx, by + 2, 30, 12, 0, 0, 7); g.fill(); g.globalCompositeOperation = 'source-over';
      g.fillStyle = 'rgba(55,42,36,.75)'; g.beginPath(); g.ellipse(cx, by - 14, 36, 9, 0, 0, 7); g.fill(); // baffi corti
    }
    g.save(); g.translate(cx, by); g.scale(1.55, 1.55); g.translate(-cx, -by);
    const ink = '#3a1a16', labbra = A.labbra || '#b8565a', bocc = '#5a1a20';
    g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = ink; g.lineWidth = 5;
    const curva = (w, dy, cur) => { g.beginPath(); g.moveTo(cx - w, by + dy); g.quadraticCurveTo(cx, by + dy + cur, cx + w, by + dy); g.stroke(); };
    const aperta = (w, h, denti = true, lingua = true, sorr = 8) => {
      g.fillStyle = bocc; g.beginPath(); g.moveTo(cx - w, by - sorr * .3); g.quadraticCurveTo(cx, by - 4, cx + w, by - sorr * .3); g.quadraticCurveTo(cx + w * .7, by + h, cx, by + h); g.quadraticCurveTo(cx - w * .7, by + h, cx - w, by - sorr * .3); g.fill();
      g.save(); g.clip();
      if (denti) { g.fillStyle = '#fbf8f2'; g.fillRect(cx - w, by - 12, w * 2, 10); }
      if (lingua) { g.fillStyle = '#e06470'; g.beginPath(); g.ellipse(cx, by + h, w * .6, h * .45, 0, 0, 7); g.fill(); }
      g.restore(); g.lineWidth = 4; g.strokeStyle = ink; g.stroke();
    };
    switch (bocca) {
      case 'sorriso': aperta(30, 24, true, true, 14); break;
      case 'dolce': curva(22, -2, 13); break;
      case 'neutra': curva(17, 0, 6); break;
      case 'piatta': curva(17, 2, 0); break;
      case 'giu': curva(17, 6, -9); break;
      case 'storta': g.beginPath(); g.moveTo(cx - 20, by + 4); g.quadraticCurveTo(cx - 6, by - 2, cx + 4, by + 2); g.quadraticCurveTo(cx + 12, by + 5, cx + 20, by - 3); g.stroke(); break;
      case 'denti': { // denti stretti, angoli in giù
        g.fillStyle = '#fbf8f2'; g.beginPath(); g.moveTo(cx - 26, by + 8); g.quadraticCurveTo(cx, by - 8, cx + 26, by + 8); g.lineTo(cx + 22, by + 18); g.quadraticCurveTo(cx, by + 8, cx - 22, by + 18); g.closePath(); g.fill(); g.lineWidth = 4; g.stroke();
        g.lineWidth = 2.5; g.beginPath(); g.moveTo(cx - 24, by + 11); g.quadraticCurveTo(cx, by + 1, cx + 24, by + 11); g.stroke();
        for (const dx of [-12, 0, 12]) { g.beginPath(); g.moveTo(cx + dx, by + (dx ? 4 : 1)); g.lineTo(cx + dx, by + (dx ? 15 : 12)); g.stroke(); }
        break; }
      case 'urlo': { g.fillStyle = bocc; g.beginPath(); g.ellipse(cx, by + 10, 26, 24, 0, 0, 7); g.fill(); g.save(); g.clip(); g.fillStyle = '#fbf8f2'; g.fillRect(cx - 26, by - 16, 52, 9); g.fillRect(cx - 26, by + 29, 52, 6); g.fillStyle = '#e06470'; g.beginPath(); g.ellipse(cx, by + 30, 15, 8, 0, 0, 7); g.fill(); g.restore(); g.lineWidth = 4; g.strokeStyle = ink; g.beginPath(); g.ellipse(cx, by + 10, 26, 24, 0, 0, 7); g.stroke(); break; }
      case 'o': g.fillStyle = bocc; g.beginPath(); g.ellipse(cx, by + 4, 10, 13, 0, 0, 7); g.fill(); g.lineWidth = 4; g.stroke(); break;
      case 'parla-a': aperta(20, 20, true, true, 4); break;
      case 'parla-o': g.fillStyle = bocc; g.beginPath(); g.ellipse(cx, by + 4, 12, 14, 0, 0, 7); g.fill(); g.lineWidth = 4; g.stroke(); break;
      case 'parla-e': aperta(22, 11, true, false, 2); break;
    }
    if (A.labbra && !bocca.startsWith('parla') && ['dolce', 'neutra', 'piatta', 'giu'].includes(bocca)) { g.strokeStyle = labbra; g.lineWidth = 3; g.globalAlpha = .7; curva(15, 5, 4); g.globalAlpha = 1; }
    g.restore(); this.mascheraTex.needsUpdate = true;
  }
}

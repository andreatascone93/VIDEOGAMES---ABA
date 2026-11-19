// Il Parco dei Tigli: un viale dritto diviso in quattro tappe da cancelli, aiuole e angoli del parco ai lati,
// la cupola di Ottavio in fondo. Coordinate: il viale va verso -z. Tappa k: inizio a z = -20k, cancello a z = -20k - 16.
// Tutto generato qui (shader, canvas, geometrie) più alberi, tende, lampioni e casse Kenney (CC0).
import * as THREE from 'three';
import { model } from './assets.js';

export const LARGO = 6;                                   // il viale va da x = -6 a x = 6
export const ZONE_Z = [0, -20, -40, -60];                      // inizio di ogni zona
export const CANCELLO_Z = ZONE_Z.map(z => z - 16);        // cancello di ogni zona
export const CUPOLA_Z = -90;                              // centro della cupola, in fondo al viale
export const PANNELLO = { x: 2.7, dz: .9 };               // pannello a destra del cancello, poco prima
export const PANCHINA = { x: -4.6, dz: 4.2 };

const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .8, ...o });
const box = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o; };

// un cartello di legno con una scritta (o un disegno) sul davanti
export function cartello(testo, { w = 1.6, h = .6, disegno = null, colore = '#2f6b3a' } = {}) {
  const g = new THREE.Group();
  const t = tex(512, Math.round(512 * h / w), (c, W, H) => {
    c.fillStyle = colore; c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 10; c.strokeRect(14, 14, W - 28, H - 28);
    if (disegno) disegno(c, W, H); else { c.fillStyle = '#fff'; c.font = '900 ' + Math.round(H * .42) + 'px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(testo, W / 2, H / 2 + 4); }
  });
  const legno = mat(0x7a5232);
  const tav = new THREE.Mesh(new THREE.BoxGeometry(w, h, .06), [legno, legno, legno, legno, new THREE.MeshStandardMaterial({ map: t, roughness: .7 }), legno]);
  tav.position.y = 1.15 + h / 2; tav.castShadow = true; g.add(tav);
  for (const s of [-1, 1]) g.add(box(.07, 1.2 + h * .6, .07, legno, s * (w / 2 - .1), (1.2 + h * .6) / 2, -.05));
  g.userData.tex = t; g.userData.tavola = tav;
  return g;
}

export async function costruisciParco(scene, renderer) {
  const vivi = [];
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  scene.fog = new THREE.Fog(0xcfe3f2, 40, 140);
  scene.background = new THREE.Color(0xcfe3f2);

  // cielo: azzurro dopo il temporale, qualche nuvola ancora scura
  const cielo = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { alto: { value: new THREE.Color(0x3d7fd6) }, basso: { value: new THREE.Color(0xd8ebf7) } },
    vertexShader: 'varying vec3 d; void main(){ d = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 alto, basso; varying vec3 d; void main(){ float h = normalize(d).y; gl_FragColor = vec4(mix(basso, alto, smoothstep(0.0, 0.5, h)), 1.0);
      #include <colorspace_fragment>
    }`
  }));
  cielo.renderOrder = -10; scene.add(cielo);
  const nuvTex = tex(256, 128, (g, w, h) => { for (let i = 0; i < 12; i++) { const x = w * (.15 + rnd() * .7), y = h * (.5 + (rnd() - .5) * .25), r = h * (.18 + rnd() * .25); const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); } });
  for (let i = 0; i < 14; i++) {
    const az = rnd() * Math.PI * 2, el = .12 + rnd() * .35, r = 260;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: nuvTex, color: i % 3 ? 0xffffff : 0xaab4c4, transparent: true, depthWrite: false, fog: false }));
    const L = 60 + rnd() * 70; s.scale.set(L, L * .5, 1); s.position.set(Math.sin(az) * Math.cos(el) * r, Math.sin(el) * r, Math.cos(az) * Math.cos(el) * r - 30); s.renderOrder = -9; scene.add(s);
  }

  // luci
  scene.add(new THREE.HemisphereLight(0xd6e6ff, 0x7d6a48, 1.3));
  const sole = new THREE.DirectionalLight(0xfff0d6, 2.8); sole.castShadow = true;
  sole.shadow.mapSize.set(2048, 2048); Object.assign(sole.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 70 });
  sole.shadow.normalBias = .04; sole.shadow.bias = -.0004; scene.add(sole, sole.target);
  // l'ombra segue il protagonista: la funzione la sposta dove serve
  const seguiOmbra = (x, z) => { sole.position.set(x + 12, 20, z + 9); sole.target.position.set(x, 0, z); };
  seguiOmbra(0, 0);

  // prato
  const prato = tex(512, 512, (g, w, h) => {
    g.fillStyle = '#7fb352'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 5000; i++) { const x = rnd() * w, y = rnd() * h, l = 3 + rnd() * 6, t = rnd(); g.strokeStyle = t < .45 ? 'rgba(50,100,36,.35)' : t < .85 ? 'rgba(170,210,100,.3)' : 'rgba(220,200,110,.3)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - .5) * 3, y - l); g.stroke(); }
    for (let i = 0; i < 40; i++) { g.fillStyle = rnd() < .5 ? 'rgba(255,255,255,.85)' : 'rgba(255,226,110,.9)'; g.beginPath(); g.arc(rnd() * w, rnd() * h, 1.6, 0, 7); g.fill(); }
  });
  prato.wrapS = prato.wrapT = THREE.RepeatWrapping; prato.repeat.set(62, 62);
  const suolo = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshStandardMaterial({ map: prato, roughness: 1 }));
  suolo.rotation.x = -Math.PI / 2; suolo.position.z = -45; suolo.receiveShadow = true; scene.add(suolo);

  // viale: lastre di pietra chiara con le pozzanghere del temporale
  const viaTex = tex(512, 512, (g, w, h) => {
    g.fillStyle = '#d9c9a6'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 64) for (let x = (y / 64) % 2 ? -32 : 0; x < w; x += 64) { g.fillStyle = `hsl(${38 + rnd() * 6},${22 + rnd() * 10}%,${70 + rnd() * 8}%)`; g.fillRect(x + 2, y + 2, 60, 60); }
    for (let i = 0; i < 1600; i++) { g.fillStyle = rnd() < .5 ? 'rgba(90,70,40,.12)' : 'rgba(255,255,255,.15)'; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
  });
  viaTex.wrapS = viaTex.wrapT = THREE.RepeatWrapping; viaTex.repeat.set(3, 24);
  const via = new THREE.Mesh(new THREE.PlaneGeometry(LARGO * 2 + 1, 96), new THREE.MeshStandardMaterial({ map: viaTex, roughness: .9 }));
  via.rotation.x = -Math.PI / 2; via.position.set(0, .01, -36); via.receiveShadow = true; scene.add(via);
  const acqua = new THREE.MeshStandardMaterial({ color: 0x8fb4d0, roughness: .05, metalness: .3, transparent: true, opacity: .75 });
  for (let i = 0; i < 9; i++) { const p = new THREE.Mesh(new THREE.CircleGeometry(.5 + rnd() * .8, 20), acqua); p.rotation.x = -Math.PI / 2; p.scale.set(1.5, 1, 1); p.position.set((rnd() - .5) * 9, .02, 4 - rnd() * 84); scene.add(p); }

  // staccionate lungo il viale: paletti e due traverse (instanced, pochi draw call)
  const legno = mat(0x8a5c34), ferro = mat(0x4b5563, { metalness: .5, roughness: .45 }), pietra = mat(0xb9b0a0);
  const pali = [], trav = [];
  for (const s of [-1, 1]) for (let z = 8; z > CUPOLA_Z + 12; z -= 2) { pali.push([s * (LARGO + .6), z]); trav.push([s * (LARGO + .6), z - 1]); }
  const palo = new THREE.InstancedMesh(new THREE.BoxGeometry(.14, 1.1, .14), legno, pali.length);
  const tr = new THREE.InstancedMesh(new THREE.BoxGeometry(.08, .1, 2), legno, trav.length * 2);
  const M = new THREE.Matrix4();
  pali.forEach(([x, z], i) => { M.makeTranslation(x, .55, z); palo.setMatrixAt(i, M); });
  trav.forEach(([x, z], i) => { M.makeTranslation(x, .45, z); tr.setMatrixAt(i * 2, M); M.makeTranslation(x, .85, z); tr.setMatrixAt(i * 2 + 1, M); });
  palo.castShadow = tr.castShadow = true; scene.add(palo, tr);

  /* ------------------------------------------------ cancelli */
  const cancelli = CANCELLO_Z.map((z, k) => {
    const g = new THREE.Group(); g.position.z = z; scene.add(g);
    for (const s of [-1, 1]) {
      g.add(box(.7, 3, .7, pietra, s * 2.1, 1.5, 0));
      g.add(box(.85, .25, .85, mat(0x8f8676), s * 2.1, 3.1, 0));
      // muro basso fino alla staccionata
      g.add(box(LARGO + .6 - 2.4, 2.2, .4, pietra, s * (2.45 + (LARGO + .6 - 2.4) / 2), 1.1, 0));
    }
    const arco = cartello(['IL ROSETO', 'LA FONTANA', 'IL CHIOSCO DELLA MUSICA', 'LA CUPOLA'][k], { w: 3.6, h: .55, colore: '#24513a' });
    arco.position.set(0, 1.55, .38); arco.children.slice(1).forEach(c => c.visible = false); g.add(arco);
    // anta a sbarre che scorre di lato
    const anta = new THREE.Group(); g.add(anta);
    for (let i = 0; i < 8; i++) anta.add(box(.07, 2.4, .07, ferro, -1.55 + i * .44, 1.25, 0));
    anta.add(box(3.4, .12, .1, ferro, 0, .25, 0), box(3.4, .12, .1, ferro, 0, 1.4, 0), box(3.4, .12, .1, ferro, 0, 2.4, 0));
    // luce rossa / verde sopra il pannello
    const spia = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 8), new THREE.MeshStandardMaterial({ color: 0xff3b3b, emissive: 0xff2020, emissiveIntensity: 1.6 }));
    // il pannello di controllo su un piedistallo
    const ped = new THREE.Group(); ped.position.set(PANNELLO.x, 0, PANNELLO.dz); g.add(ped);
    ped.add(box(.18, 1, .18, ferro, 0, .5, 0));
    const schermo = box(.75, .55, .14, mat(0x2b3442, { metalness: .4 }), 0, 1.22, 0); schermo.rotation.x = -.35; ped.add(schermo);
    const vetro = new THREE.Mesh(new THREE.PlaneGeometry(.62, .42), new THREE.MeshStandardMaterial({ color: 0x0d1830, emissive: 0x2a6cff, emissiveIntensity: .55 }));
    vetro.position.set(0, 1.245, .075); vetro.rotation.x = -.35; ped.add(vetro);
    spia.position.set(0, 1.62, -.05); ped.add(spia);
    // il cartello con l'indizio, accanto al pannello
    const ind = cartello('', { w: 1.1, h: .7, colore: '#f1e6c8' }); ind.position.set(PANNELLO.x + 1.35, 0, PANNELLO.dz - .2); ind.rotation.y = -.25; g.add(ind);
    // panchina: dove ci si siede per lasciar perdere
    const pan = new THREE.Group(); pan.position.set(PANCHINA.x, 0, PANCHINA.dz); pan.rotation.y = Math.PI / 2; g.add(pan);
    for (let i = 0; i < 3; i++) pan.add(box(1.6, .06, .14, legno, 0, .45, -.18 + i * .17));
    for (let i = 0; i < 2; i++) pan.add(box(1.6, .12, .05, legno, 0, .7 + i * .17, -.3));
    for (const s of [-1, 1]) pan.add(box(.08, .45, .5, ferro, s * .7, .22, -.05));
    return { g, anta, spia, vetro, indizio: ind, aperto: false,
      async apri(on = true) { const a0 = anta.position.x, a1 = on ? -3.2 : 0; this.aperto = on; spia.material.color.set(on ? 0x3bff7a : 0xff3b3b); spia.material.emissive.set(on ? 0x20ff60 : 0xff2020);
        const t0 = performance.now(); await new Promise(r => { const f = () => { const k = Math.min(1, (performance.now() - t0) / 1400); anta.position.x = a0 + (a1 - a0) * (1 - Math.pow(1 - k, 3)); k < 1 ? requestAnimationFrame(f) : r(); }; f(); }); }
    };
  });

  /* ------------------------------------------------ cartelli e aiuole ai lati */
  const luoghi = [['PARCO DEI TIGLI', 1, 3, '#24513a'], ['ROSETO', -1, -8, '#8a2d4a'], ['LAGHETTO', 1, -27, '#2c5d8a'], ['VIALE DEI TIGLI', -1, -30, '#24513a'], ['GIOSTRA', 1, -49, '#8a5a1d'], ['OSSERVATORIO', -1, -70, '#3a2d6b']];
  for (const [nome, s, z, col] of luoghi) { const c = cartello(nome, { w: 2.4, h: .55, colore: col }); c.position.set(s * (LARGO + 1.6), 0, z); c.rotation.y = -s * Math.PI / 2; scene.add(c); }
  // aiuole fiorite (instanced): tanti fiori, due draw call
  const steli = [], nF = 420; const fiore = new THREE.InstancedMesh(new THREE.SphereGeometry(.09, 6, 5), new THREE.MeshStandardMaterial({ roughness: .6 }), nF);
  const colF = [0xff5d73, 0xffc94a, 0xffffff, 0xb98bff, 0xff9a3d], C = new THREE.Color();
  for (let i = 0; i < nF; i++) { const s = rnd() < .5 ? -1 : 1, bx = s * (LARGO + 2.2 + rnd() * 4.5), bz = 6 - Math.floor(rnd() * 9) * 10 - rnd() * 4.5; M.makeTranslation(bx, .22 + rnd() * .12, bz); fiore.setMatrixAt(i, M); fiore.setColorAt(i, C.setHex(colF[Math.floor(rnd() * 5)])); }
  scene.add(fiore);
  // la fontana, accanto al secondo cancello
  const fon = new THREE.Group(); fon.position.set(-LARGO - 5, 0, CANCELLO_Z[1] + 5); scene.add(fon);
  const marmo = mat(0xd8d2c4, { roughness: .5 }), bronzo = mat(0x8a6a3a, { metalness: .6, roughness: .4 });
  const vasca = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, .6, 28), marmo); vasca.position.y = .3; vasca.castShadow = vasca.receiveShadow = true; fon.add(vasca);
  const specchio = new THREE.Mesh(new THREE.CircleGeometry(2.2, 28), acqua); specchio.rotation.x = -Math.PI / 2; specchio.position.y = .62; fon.add(specchio);
  const stelo = new THREE.Mesh(new THREE.CylinderGeometry(.18, .3, 1.8, 12), marmo); stelo.position.y = 1.2; stelo.castShadow = true; fon.add(stelo);
  const coppa = new THREE.Mesh(new THREE.CylinderGeometry(.9, .3, .3, 20), marmo); coppa.position.y = 2.2; coppa.castShadow = true; fon.add(coppa);
  // lo zampillo parte quando la fontana torna a funzionare
  const getto = new THREE.Mesh(new THREE.ConeGeometry(.5, 1.6, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0xbfe3ff, transparent: true, opacity: .55, roughness: .1, side: THREE.DoubleSide })); getto.position.y = 3.1; getto.rotation.x = Math.PI; getto.visible = false; fon.add(getto);
  vivi.push((dt, t) => { if (getto.visible) { getto.scale.y = 1 + Math.sin(t * 9) * .08; getto.scale.x = getto.scale.z = 1 + Math.sin(t * 7) * .05; } });
  // il chiosco della musica, accanto al terzo cancello
  const chi = new THREE.Group(); chi.position.set(LARGO + 5.5, 0, CANCELLO_Z[2] + 5); scene.add(chi);
  const bianco = mat(0xf4efe4), tetto = mat(0x3f7f6b, { roughness: .5 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, .5, 8), bianco); base.position.y = .25; base.castShadow = base.receiveShadow = true; chi.add(base);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + Math.PI / 8; const c = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 2.6, 8), bianco); c.position.set(Math.cos(a) * 2.35, 1.8, Math.sin(a) * 2.35); c.castShadow = true; chi.add(c); }
  const cono = new THREE.Mesh(new THREE.ConeGeometry(3.1, 1.5, 8), tetto); cono.position.y = 3.85; cono.rotation.y = Math.PI / 8; cono.castShadow = true; chi.add(cono);
  const pomo = new THREE.Mesh(new THREE.SphereGeometry(.18, 12, 8), bronzo); pomo.position.y = 4.7; chi.add(pomo);
  // la giostra ferma da anni
  const gio = new THREE.Group(); gio.position.set(LARGO + 6, 0, -52); scene.add(gio);
  const gb = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, .25, 24), mat(0xb5463c)); gb.position.y = .13; gb.receiveShadow = true; gio.add(gb);
  const gt = new THREE.Mesh(new THREE.ConeGeometry(3, 1.3, 12), mat(0xf2c14e)); gt.position.y = 3.4; gt.castShadow = true; gio.add(gt);
  const gp = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, 3, 10), bronzo); gp.position.y = 1.6; gio.add(gp);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const cv = box(.3, .5, .8, mat([0xffffff, 0x4dabff, 0xff5d73][i % 3]), Math.cos(a) * 1.9, .9, Math.sin(a) * 1.9); cv.rotation.y = -a; gio.add(cv); const as = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 2.6, 6), bronzo); as.position.set(Math.cos(a) * 1.9, 1.6, Math.sin(a) * 1.9); gio.add(as); }

  /* ------------------------------------------------ arredi Kenney: alberi, chioschi, lampioni, casse rovesciate */
  const lavori = [];
  const metti = (file, x, z, { s = 1, ry = 0 } = {}) => lavori.push(model('parco/' + file + '.glb', { scale: s }).then(m => { m.position.set(x, 0, z); m.rotation.y = ry; scene.add(m); return m; }));
  for (let i = 0; i < 70; i++) { const s = rnd() < .5 ? -1 : 1, x = s * (LARGO + 3 + rnd() * 26), z = 10 - rnd() * 104; if (Math.abs(x) < LARGO + 9) continue; metti(rnd() < .6 ? 'treeLarge' : 'treeSmall', x, z, { s: 3 + rnd() * 2.2, ry: rnd() * 6 }); }
  for (let k = 0; k < 4; k++) { metti('lightPostLarge', -LARGO - .2, ZONE_Z[k] - 8, { s: 3.4, ry: Math.PI / 2 }); metti('lightPostLarge', LARGO + .2, ZONE_Z[k] - 3, { s: 3.4, ry: -Math.PI / 2 }); }
  for (let z = 4; z > CUPOLA_Z + 14; z -= 7) for (const s of [-1, 1]) metti('treeLarge', s * (LARGO + 3.4), z + (s > 0 ? 3.5 : 0), { s: 2.7, ry: rnd() * 6 });
  metti('tent', -LARGO - 5, -14, { s: 3.2, ry: .3 }); metti('tent', LARGO + 3.6, -36, { s: 3.2, ry: -.2 });
  // il caos: casse cadute dai carrelli
  for (const [x, z, r] of [[3.8, -4, .4], [-3.2, -10, 1.2], [4.5, -24, 2], [-2.6, -31, .7], [3.4, -45, 1.6], [-4.4, -47, .2], [-3.8, -66, 1.1]]) metti(rnd() < .5 ? 'crate-medium' : 'crate-small', x, z, { s: 1.6, ry: r });
  // palloncini scappati dal chiosco
  const pall = []; const colori = [0xff4d6d, 0xffc94a, 0x4dabff, 0x6be08a, 0xb36bff];
  for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.28, 14, 10), new THREE.MeshStandardMaterial({ color: colori[i % 5], roughness: .3 })); m.scale.y = 1.2; m.position.set((rnd() - .5) * 18, 3 + rnd() * 9, 6 - rnd() * 80); scene.add(m); pall.push({ m, v: .3 + rnd() * .4, f: rnd() * 6 }); }
  vivi.push((dt, t) => pall.forEach(p => { p.m.position.y += p.v * dt; p.m.position.x += Math.sin(t * .7 + p.f) * dt * .3; if (p.m.position.y > 22) p.m.position.y = 2; }));

  /* ------------------------------------------------ la cupola di Ottavio, in fondo al viale */
  const cup = new THREE.Group(); cup.position.set(0, 0, CUPOLA_Z); scene.add(cup);
  const muro = mat(0xe6dfd0, { roughness: .7 }), rame = mat(0x4f9a86, { metalness: .5, roughness: .45 });
  const tamburo = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.3, 3.4, 32, 1, true, .22, Math.PI * 2 - .44), new THREE.MeshStandardMaterial({ color: 0xe6dfd0, roughness: .7, side: THREE.DoubleSide }));
  tamburo.position.y = 1.7; tamburo.rotation.y = -Math.PI / 2; tamburo.castShadow = tamburo.receiveShadow = true; cup.add(tamburo);
  const piazza = new THREE.Mesh(new THREE.CircleGeometry(9, 40), new THREE.MeshStandardMaterial({ map: viaTex, roughness: .9 })); piazza.rotation.x = -Math.PI / 2; piazza.position.y = .012; piazza.receiveShadow = true; cup.add(piazza);
  // la calotta è fatta di cinque spicchi: se ne aprono tanti quanti sono gli amici arrivati fin qui (più uno)
  const spicchi = [];
  for (let i = 0; i < 5; i++) { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.SphereGeometry(6.15, 12, 12, i / 5 * Math.PI * 2, Math.PI * 2 / 5 - .03, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x4f9a86, metalness: .5, roughness: .45, side: THREE.DoubleSide })); m.castShadow = true; g.add(m); g.position.y = 3.4; cup.add(g); spicchi.push(g); }
  cup.add(box(1.2, 3.3, .5, muro, -1.9, 1.65, 6.05), box(1.2, 3.3, .5, muro, 1.9, 1.65, 6.05), box(5, .5, .5, muro, 0, 3.2, 6.05));
  const porta = box(2.6, 2.95, .14, mat(0x6b4a2b), 0, 1.47, 6.05); cup.add(porta);
  const insegna = cartello('OSSERVATORIO LUMEN', { w: 4.2, h: .5, colore: '#3a2d6b' }); insegna.children.slice(1).forEach(c => c.visible = false); insegna.position.set(0, 2.2, 6.4); cup.add(insegna);
  // dentro: il telescopio di Ottavio
  const tel = new THREE.Group(); tel.position.set(0, 0, 0); cup.add(tel);
  tel.add(box(1.6, .5, 1.6, mat(0x5a4632), 0, .25, 0));
  const tubo = new THREE.Mesh(new THREE.CylinderGeometry(.42, .5, 4.4, 20), bronzo); tubo.position.set(0, 2.5, -.3); tubo.rotation.x = -.7; tubo.castShadow = true; tel.add(tubo);
  const lente = new THREE.Mesh(new THREE.CircleGeometry(.4, 20), new THREE.MeshStandardMaterial({ color: 0x9fd8ff, emissive: 0x4aa8ff, emissiveIntensity: .0 })); lente.position.set(0, 4.19, -1.72); lente.rotation.x = -.7 - Math.PI / 2; tel.add(lente);
  // le stelle che si accendono sopra la cupola alla fine
  const nS = 260, sp = new Float32Array(nS * 3); for (let i = 0; i < nS; i++) { const a = rnd() * 6.283, e = .25 + rnd() * 1.2, r = 60 + rnd() * 30; sp[i * 3] = Math.cos(a) * Math.cos(e) * r; sp[i * 3 + 1] = Math.sin(e) * r; sp[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r; }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const stelle = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xfff6d0, size: 1.1, transparent: true, opacity: 0, fog: false, depthWrite: false })); stelle.position.copy(cup.position); scene.add(stelle);
  const cupola = { porta, spicchi, lente, stelle,
    // apre la porta e n spicchi; il cielo si fa sera perché le stelle si vedano
    async apri(n, tween) {
      await tween(t => { porta.position.y = 1.47 + t * 3.2; }, 0, 1, 1800);
      await tween(t => { spicchi.forEach((g, i) => { if (i < n) { g.rotation.y = 0; g.position.y = 3.4 - t * 2.9; g.scale.setScalar(1 + t * .04); } }); }, 0, 1, 2600);
    },
    sera(t) { cielo.material.uniforms.alto.value.setHex(0x3d7fd6).lerp(new THREE.Color(0x0b1238), t); cielo.material.uniforms.basso.value.setHex(0xd8ebf7).lerp(new THREE.Color(0xe98a5a), t * .9); scene.fog.color.setHex(0xcfe3f2).lerp(new THREE.Color(0x5a4a6a), t); sole.intensity = 2.8 - t * 2; stelle.material.opacity = t; lente.material.emissiveIntensity = t * 2.2; },
    chiudi() { porta.position.y = 1.47; spicchi.forEach(g => { g.position.y = 3.4; g.scale.setScalar(1); }); this.sera(0); }
  };

  await Promise.all(lavori);
  return { cancelli, vivi, seguiOmbra, cupola, getto };
}

function reteTex() {
  return tex(256, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(70,80,90,.9)'; g.lineWidth = 1.5;
    for (let x = -h; x < w + h; x += 10) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + h, h); g.stroke(); g.beginPath(); g.moveTo(x + h, 0); g.lineTo(x, h); g.stroke(); }
    g.clearRect(w * .55, 0, w * .2, h);   // il varco
    g.fillStyle = 'rgba(60,60,60,1)'; g.fillRect(0, 0, w, 3); });
}

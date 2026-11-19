// Lo zoo dopo il blackout: un viale dritto diviso in tre zone da cancelli, recinti vuoti ai lati, il pullman in fondo.
// Coordinate: il viale va verso -z. Zona k: inizio a z = -20k, cancello a z = -20k - 16.
// Tutto generato qui (shader, canvas, geometrie) più alberi, tende, lampioni e casse Kenney (CC0).
import * as THREE from 'three';
import { model } from './assets.js';

export const LARGO = 6;                                   // il viale va da x = -6 a x = 6
export const ZONE_Z = [0, -20, -40];                      // inizio di ogni zona
export const CANCELLO_Z = ZONE_Z.map(z => z - 16);        // cancello di ogni zona
export const PULLMAN_Z = -66;
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

export async function costruisciZoo(scene, renderer) {
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
  prato.wrapS = prato.wrapT = THREE.RepeatWrapping; prato.repeat.set(50, 50);
  const suolo = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.MeshStandardMaterial({ map: prato, roughness: 1 }));
  suolo.rotation.x = -Math.PI / 2; suolo.position.z = -30; suolo.receiveShadow = true; scene.add(suolo);

  // viale: lastre di pietra chiara con le pozzanghere del temporale
  const viaTex = tex(512, 512, (g, w, h) => {
    g.fillStyle = '#d9c9a6'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 64) for (let x = (y / 64) % 2 ? -32 : 0; x < w; x += 64) { g.fillStyle = `hsl(${38 + rnd() * 6},${22 + rnd() * 10}%,${70 + rnd() * 8}%)`; g.fillRect(x + 2, y + 2, 60, 60); }
    for (let i = 0; i < 1600; i++) { g.fillStyle = rnd() < .5 ? 'rgba(90,70,40,.12)' : 'rgba(255,255,255,.15)'; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
  });
  viaTex.wrapS = viaTex.wrapT = THREE.RepeatWrapping; viaTex.repeat.set(3, 20);
  const via = new THREE.Mesh(new THREE.PlaneGeometry(LARGO * 2 + 1, 82), new THREE.MeshStandardMaterial({ map: viaTex, roughness: .9 }));
  via.rotation.x = -Math.PI / 2; via.position.set(0, .01, -29); via.receiveShadow = true; scene.add(via);
  const acqua = new THREE.MeshStandardMaterial({ color: 0x8fb4d0, roughness: .05, metalness: .3, transparent: true, opacity: .75 });
  for (let i = 0; i < 9; i++) { const p = new THREE.Mesh(new THREE.CircleGeometry(.5 + rnd() * .8, 20), acqua); p.rotation.x = -Math.PI / 2; p.scale.set(1.5, 1, 1); p.position.set((rnd() - .5) * 9, .02, 4 - rnd() * 66); scene.add(p); }

  // staccionate lungo il viale: paletti e due traverse (instanced, pochi draw call)
  const legno = mat(0x8a5c34), ferro = mat(0x4b5563, { metalness: .5, roughness: .45 }), pietra = mat(0xb9b0a0);
  const pali = [], trav = [];
  for (const s of [-1, 1]) for (let z = 8; z > PULLMAN_Z + 4; z -= 2) { pali.push([s * (LARGO + .6), z]); trav.push([s * (LARGO + .6), z - 1]); }
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
    const arco = cartello(['USCITA ZONA 1', 'USCITA ZONA 2', 'VERSO IL PULLMAN'][k], { w: 3.6, h: .55, colore: '#24513a' });
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

  /* ------------------------------------------------ recinti vuoti ai lati, con i cartelli */
  const recinti = [['LEONI', 1, 4, '#8a3b1d'], ['GIRAFFE', -1, -6, '#2f6b3a'], ['ZEBRE', 1, -27, '#2f6b3a'], ['ELEFANTI', -1, -29, '#2f6b3a'], ['FENICOTTERI', 1, -49, '#2f6b3a'], ['SCIMMIE', -1, -50, '#2f6b3a']];
  for (const [nome, s, z, col] of recinti) {
    const c = cartello(nome, { w: 2.2, h: .55, colore: col }); c.position.set(s * (LARGO + 1.6), 0, z); c.rotation.y = -s * Math.PI / 2; scene.add(c);
    // rete del recinto, con un varco: gli animali sono usciti
    const rete = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.2), new THREE.MeshStandardMaterial({ map: reteTex(), transparent: true, side: THREE.DoubleSide, alphaTest: .3 }));
    rete.position.set(s * (LARGO + 7), 1.1, z - 3); rete.rotation.y = Math.PI / 2; scene.add(rete);
  }

  /* ------------------------------------------------ arredi Kenney: alberi, chioschi, lampioni, casse rovesciate */
  const lavori = [];
  const metti = (file, x, z, { s = 1, ry = 0 } = {}) => lavori.push(model('zoo/' + file + '.glb', { scale: s }).then(m => { m.position.set(x, 0, z); m.rotation.y = ry; scene.add(m); return m; }));
  for (let i = 0; i < 46; i++) { const s = rnd() < .5 ? -1 : 1, x = s * (LARGO + 3 + rnd() * 22), z = 10 - rnd() * 82; if (Math.abs(x) < LARGO + 9 && recinti.some(r => Math.abs(r[2] - 3 - z) < 6 && Math.sign(x) === r[1])) continue; metti(rnd() < .6 ? 'treeLarge' : 'treeSmall', x, z, { s: 3 + rnd() * 2.2, ry: rnd() * 6 }); }
  for (let k = 0; k < 3; k++) { metti('lightPostLarge', -LARGO - .2, ZONE_Z[k] - 8, { s: 3.4, ry: Math.PI / 2 }); metti('lightPostLarge', LARGO + .2, ZONE_Z[k] - 3, { s: 3.4, ry: -Math.PI / 2 }); }
  metti('tent', -LARGO - 5, -14, { s: 3.2, ry: .3 }); metti('tent', LARGO + 3.6, -36, { s: 3.2, ry: -.2 });
  // il caos: casse cadute dai carrelli
  for (const [x, z, r] of [[3.8, -4, .4], [-3.2, -10, 1.2], [4.5, -24, 2], [-2.6, -31, .7], [3.4, -45, 1.6], [-4.4, -47, .2]]) metti(rnd() < .5 ? 'crate-medium' : 'crate-small', x, z, { s: 1.6, ry: r });
  // palloncini scappati dal chiosco
  const pall = []; const colori = [0xff4d6d, 0xffc94a, 0x4dabff, 0x6be08a, 0xb36bff];
  for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.28, 14, 10), new THREE.MeshStandardMaterial({ color: colori[i % 5], roughness: .3 })); m.scale.y = 1.2; m.position.set((rnd() - .5) * 18, 3 + rnd() * 9, 6 - rnd() * 60); scene.add(m); pall.push({ m, v: .3 + rnd() * .4, f: rnd() * 6 }); }
  vivi.push((dt, t) => pall.forEach(p => { p.m.position.y += p.v * dt; p.m.position.x += Math.sin(t * .7 + p.f) * dt * .3; if (p.m.position.y > 22) p.m.position.y = 2; }));

  /* ------------------------------------------------ il pullman in fondo */
  const pul = new THREE.Group(); pul.position.set(-1.5, 0, PULLMAN_Z); pul.rotation.y = Math.PI / 2; scene.add(pul);
  const giallo = mat(0xffc21a, { roughness: .5 }), vetri = mat(0x22364f, { roughness: .1, metalness: .4 }), gomma = mat(0x1d1d1d);
  pul.add(box(9, 2.4, 2.5, giallo, 0, 1.6, 0));
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) pul.add(box(1.1, .8, .04, vetri, -3.2 + i * 1.3, 2.15, s * 1.26));
  pul.add(box(.04, 1, 2.1, vetri, 4.51, 2.1, 0), box(9.02, .14, 2.52, mat(0x222222), 0, 1.15, 0));
  for (const x of [-3, 3]) for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .35, 18), gomma); r.rotation.x = Math.PI / 2; r.position.set(x, .5, s * 1.2); r.castShadow = true; pul.add(r); }
  const scritta = cartello('SCUOLA', { w: 2.4, h: .5, colore: '#1d3557' }); scritta.children.slice(1).forEach(c => c.visible = false); scritta.position.set(0, .2, 1.3); pul.add(scritta);

  await Promise.all(lavori);
  return { cancelli, vivi, seguiOmbra };
}

function reteTex() {
  return tex(256, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(70,80,90,.9)'; g.lineWidth = 1.5;
    for (let x = -h; x < w + h; x += 10) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + h, h); g.stroke(); g.beginPath(); g.moveTo(x + h, 0); g.lineTo(x, h); g.stroke(); }
    g.clearRect(w * .55, 0, w * .2, h);   // il varco
    g.fillStyle = 'rgba(60,60,60,1)'; g.fillRect(0, 0, w, 3); });
}

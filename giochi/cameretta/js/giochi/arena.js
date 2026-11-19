// L'arena di Blaster Arena: cielo al tramonto, colline, campo di tiro, tribune, tabellone, luci ed effetti.
// Tutto generato qui (shader, canvas, geometrie) più gli arredi Kenney Racing Kit (CC0).
// Un solo obiettivo: stessa ricchezza visiva di Kart Royale, con pochi draw call in più.
import * as THREE from 'three';

const rnd = (() => { let s = 11; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();   // sempre la stessa arena
const liscia = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };

export const SOLE = new THREE.Vector3(-.66, .17, -.73).normalize();       // dove si vede il sole: davanti, a sinistra
// altezza del terreno: piatto nel campo, colline tutto intorno
export function altezza(x, z) {
  const r = Math.hypot(x, z + 7), k = liscia(27, 75, r);
  const n = Math.sin(x * .071 + 1.3) * Math.cos(z * .063 + .4) * .6 + Math.sin(x * .13 + z * .11) * .3 + Math.sin(x * .031 - z * .027 + 2) * .9;
  return k * (4 + 8 * (n * .5 + .6));
}

export async function costruisciArena({ scene, camera, renderer, piazza, nome = 'Francesco' }) {
  const vivi = [];                                   // funzioni di animazione (dt, t)
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  camera.far = 420; camera.updateProjectionMatrix();
  scene.fog = new THREE.Fog(0xf3b889, 34, 150);
  scene.background = new THREE.Color(0xf3b889);

  /* ---------------------------------------------------------------- cielo, sole, nuvole */
  const cielo = new THREE.Mesh(new THREE.SphereGeometry(380, 32, 20), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { sole: { value: SOLE }, alto: { value: new THREE.Color(0x2a56b0) }, medio: { value: new THREE.Color(0xef8f95) }, basso: { value: new THREE.Color(0xffc670) }, luce: { value: new THREE.Color(0xffedbd) } },
    vertexShader: 'varying vec3 d; void main(){ d = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 sole, alto, medio, basso, luce; varying vec3 d;
      void main(){ vec3 n = normalize(d); float h = n.y;
        vec3 c = mix(basso, medio, smoothstep(0.0, 0.17, h)); c = mix(c, alto, smoothstep(0.07, 0.62, h));
        float s = max(dot(n, sole), 0.0);
        c += luce * (smoothstep(0.9994, 0.9998, s) * 2.0 + pow(s, 40.0) * 0.5 + pow(s, 5.0) * 0.25);
        c = mix(c, basso, smoothstep(0.0, -0.06, h));
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`
  }));
  cielo.renderOrder = -10; scene.add(cielo);

  const nuvolaTex = [0, 1, 2].map(() => tex(256, 128, (g, w, h) => {
    for (let i = 0; i < 11; i++) { const x = w * (.18 + rnd() * .64), y = h * (.5 + (rnd() - .5) * .22), r = h * (.2 + rnd() * .24);
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.55, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
    const om = g.createLinearGradient(0, h * .45, 0, h * .8); om.addColorStop(0, 'rgba(120,90,140,0)'); om.addColorStop(1, 'rgba(120,90,140,.38)'); g.globalCompositeOperation = 'source-atop'; g.fillStyle = om; g.fillRect(0, 0, w, h);
  }));
  const nuvole = [];
  const suCupola = (az, el, r) => new THREE.Vector3(Math.sin(az) * Math.cos(el) * r, Math.sin(el) * r, -Math.cos(az) * Math.cos(el) * r);
  const azSole = Math.atan2(SOLE.x, -SOLE.z);
  for (let i = 0; i < 16; i++) {
    const az = -2.2 + i * .29 + (rnd() - .5) * .2, el = .1 + rnd() * .42, vicino = Math.max(0, 1 - Math.abs(az - azSole) / 1.1);
    const col = new THREE.Color(0xd9cdee).lerp(new THREE.Color(0xffb38a), .25 + vicino * .6).lerp(new THREE.Color(0xfff0c8), vicino * vicino * .5);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: nuvolaTex[i % 3], color: col, transparent: true, depthWrite: false, fog: false, opacity: .9 }));
    const larg = 70 + rnd() * 80; s.scale.set(larg, larg * .5, 1); s.position.copy(suCupola(az, el, 330)); s.renderOrder = -9; scene.add(s); nuvole.push({ s, az, el, v: .0035 + rnd() * .004 });
  }
  vivi.push(dt => { for (const n of nuvole) { n.az += n.v * dt; if (n.az > 2.4) n.az = -2.4; n.s.position.copy(suCupola(n.az, n.el, 330)); } });

  /* ---------------------------------------------------------------- luci */
  scene.add(new THREE.HemisphereLight(0xc9d4ff, 0x9a7448, 1.25));
  const sun = new THREE.DirectionalLight(0xffc98f, 3.3); sun.position.set(-17, 11, 9); sun.target.position.set(0, 0, -8); scene.add(sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 20, bottom: -18, near: 1, far: 60 }); sun.shadow.normalBias = .04; sun.shadow.bias = -.0004; scene.add(sun);
  const riempi = new THREE.DirectionalLight(0x9fb6ff, .55); riempi.position.set(9, 6, -4); scene.add(riempi);

  /* ---------------------------------------------------------------- terreno e colline */
  const prato = tex(512, 512, (g, w, h) => {
    g.fillStyle = '#86b656'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 5200; i++) { const x = rnd() * w, y = rnd() * h, l = 3 + rnd() * 6, t = rnd();
      g.strokeStyle = t < .45 ? 'rgba(52,104,38,.34)' : t < .85 ? 'rgba(176,214,104,.3)' : 'rgba(226,206,116,.3)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - .5) * 3, y - l); g.stroke(); }
    for (let i = 0; i < 46; i++) { g.fillStyle = rnd() < .5 ? 'rgba(255,255,255,.85)' : 'rgba(255,226,110,.9)'; g.beginPath(); g.arc(rnd() * w, rnd() * h, 1.6, 0, 7); g.fill(); }
  });
  prato.wrapS = prato.wrapT = THREE.RepeatWrapping; prato.repeat.set(64, 64);
  const geo = new THREE.PlaneGeometry(300, 300, 64, 64); geo.rotateX(-Math.PI / 2);
  { const p = geo.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color(), a = new THREE.Color(0xffffff), b = new THREE.Color(0xd9c06a), d = new THREE.Color(0x86a86a);
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = altezza(x, z); p.setY(i, y);
      const n = Math.sin(x * .21 + 1) * Math.cos(z * .17) * .5 + .5;
      c.copy(a).lerp(b, liscia(1, 9, y) * .55 + n * .16).lerp(d, liscia(6, 14, y) * .5); col.set([c.r, c.g, c.b], i * 3); }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals(); }
  const terreno = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: prato, vertexColors: true, roughness: 1, flatShading: true }));
  terreno.receiveShadow = true; scene.add(terreno);

  // montagne lontane, nella foschia
  const mont = [new THREE.MeshBasicMaterial({ color: 0xc79aa6, fog: false }), new THREE.MeshBasicMaterial({ color: 0xdcae9f, fog: false })];
  for (let i = 0; i < 13; i++) { const az = -2.3 + i * .38 + (rnd() - .5) * .15, r = 150 + rnd() * 40, hh = 34 + rnd() * 46;
    const m = new THREE.Mesh(new THREE.ConeGeometry(34 + rnd() * 30, hh, 5 + (i % 3), 1), mont[i % 2]); m.position.set(Math.sin(az) * r, hh / 2 - 6, -Math.cos(az) * r); m.rotation.y = rnd() * 3; scene.add(m); }

  // il campo: terra battuta, archi di distanza, righe di gesso
  const SC = 34;   // pixel per metro del disegno
  const campoTex = tex(1024, 1024, (g, w, h) => {
    const X = x => w / 2 + x * SC, Z = z => h * .86 + z * SC;                        // z = 0 in basso, il campo sale verso -z
    g.shadowColor = 'rgba(190,150,96,.9)'; g.shadowBlur = 34; g.fillStyle = '#cfa56c';
    rr(g, X(-11.2), Z(-19.4), 22.4 * SC, 17.6 * SC, 80); g.fill(); g.shadowBlur = 0;
    for (let i = 0; i < 2600; i++) { const x = X(-11 + rnd() * 22), z = Z(-19.2 + rnd() * 17.2); g.fillStyle = rnd() < .5 ? 'rgba(120,84,48,.16)' : 'rgba(255,236,190,.2)'; g.fillRect(x, z, 2 + rnd() * 3, 2 + rnd() * 3); }
    for (let i = 0; i < 26; i++) { g.fillStyle = 'rgba(96,66,38,.09)'; g.beginPath(); g.ellipse(X(-10 + rnd() * 20), Z(-18.5 + rnd() * 16), 20 + rnd() * 50, 10 + rnd() * 22, rnd() * 3, 0, 7); g.fill(); }
    g.save(); rr(g, X(-10.8), Z(-19), 21.6 * SC, 16.8 * SC, 70); g.clip();
    g.strokeStyle = 'rgba(255,255,255,.82)'; g.lineWidth = 5; g.font = '900 30px system-ui, sans-serif'; g.fillStyle = 'rgba(255,255,255,.85)'; g.textAlign = 'center';
    [5, 10, 15].forEach(m => { g.beginPath(); g.arc(X(0), Z(-1.2), m * SC, Math.PI * 1.08, Math.PI * 1.92); g.stroke(); g.fillText(m + ' m', X(0), Z(-1.2 - m) - 12); });
    g.lineWidth = 3; g.setLineDash([16, 14]); [-.55, .55].forEach(a => { g.beginPath(); g.moveTo(X(Math.sin(a) * 2.5), Z(-1.2 - Math.cos(a) * 2.5)); g.lineTo(X(Math.sin(a) * 19), Z(-1.2 - Math.cos(a) * 19)); g.stroke(); });
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 6; g.setLineDash([]); rr(g, X(-10.8), Z(-19), 21.6 * SC, 16.8 * SC, 70); g.stroke();
  });
  const campo = new THREE.Mesh(new THREE.PlaneGeometry(1024 / SC, 1024 / SC), new THREE.MeshStandardMaterial({ map: campoTex, transparent: true, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  campo.rotation.x = -Math.PI / 2; campo.position.set(0, .012, -(1024 * .86 / SC) + 1024 / SC / 2); campo.receiveShadow = true; scene.add(campo);

  // pedana di tiro: gomma scura con bordo a strisce
  const pedTex = tex(512, 256, (g, w, h) => { g.fillStyle = '#2c3550'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) { g.fillStyle = rnd() < .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.12)'; g.fillRect(rnd() * w, rnd() * h, 3, 3); }
    g.save(); g.beginPath(); g.rect(0, 0, w, 26); g.clip(); for (let x = -40; x < w + 40; x += 44) { g.fillStyle = '#ffc94a'; g.beginPath(); g.moveTo(x, 26); g.lineTo(x + 22, 26); g.lineTo(x + 44, 0); g.lineTo(x + 22, 0); g.fill(); } g.restore();
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 4; g.strokeRect(8, 34, w - 16, h - 42); });
  const pedana = new THREE.Mesh(new THREE.BoxGeometry(8.6, .1, 3.7), [0, 1, 2, 3, 4, 5].map(i => new THREE.MeshStandardMaterial(i === 2 ? { map: pedTex, roughness: .85 } : { color: 0x222a40, roughness: .9 })));
  pedana.position.set(0, .05, .85); pedana.receiveShadow = true; pedana.castShadow = true; scene.add(pedana);

  /* ---------------------------------------------------------------- arredi */
  const lavori = [];
  const metti = (file, x, z, o = {}) => { const p = piazza('pista/' + file + '.glb', x, z, { ...o, y: altezza(x, z) - (o.giu || 0) }).then(m => {
      if (o.centra) { const c = new THREE.Box3().setFromObject(m).getCenter(new THREE.Vector3()); m.position.x += x - c.x; m.position.z += z - c.z; }   // alcuni modelli hanno l'origine in un angolo
      return m; });
    lavori.push(p); return p; };
  // alberi a gruppi, tutto intorno al campo e sulle colline
  for (let i = 0; i < 34; i++) { const az = -2.5 + i * .152 + (rnd() - .5) * .1, r = 21 + rnd() * 30, x = Math.sin(az) * r, z = -7 - Math.cos(az) * r;
    if (Math.abs(x) < 11 && z > -22) continue; const grande = rnd() < .55; metti(grande ? 'treeLarge' : 'treeSmall', x, z, { misura: grande ? 5 + rnd() * 3 : 3 + rnd() * 2, ry: rnd() * 6, giu: .25 }); }
  const tribune = [metti('grandStand', -16, -11, { misura: 9, ry: .95, centra: true }), metti('grandStand', 16, -11, { misura: 9, ry: -.95, centra: true })];
  metti('tent', -15.5, -2.5, { misura: 4.6, ry: .9 }); metti('tent', 15.5, -3, { misura: 4.6, ry: -.9 }); metti('tent', -19, -20, { misura: 4.6, ry: .4 });
  metti('flagCheckers', -4.7, -1.5, { misura: 2.7 }); metti('flagRed', 4.7, -1.5, { misura: 2.7 }); metti('flagGreen', -11.6, -19.8, { misura: 3.4 }); metti('flagGreen', 11.6, -19.8, { misura: 3.4 });
  for (let i = 0; i < 10; i++) { const x = -9.9 + i * 2.2; metti(i % 2 ? 'barrierWhite' : 'barrierRed', x, -20.2, { misura: 2.1 }); }
  for (let i = 0; i < 7; i++) for (const lato of [-1, 1]) metti((i + (lato > 0 ? 1 : 0)) % 2 ? 'barrierWhite' : 'barrierRed', lato * 11.9, -17.6 + i * 2.2, { misura: 2.1, ry: Math.PI / 2 });
  [[-6.3, -5.2], [6.3, -5.2], [-8.6, -9.4], [8.6, -9.4], [-3.2, -15.5], [3.2, -15.5]].forEach(([x, z]) => metti('pylon', x, z, { misura: .55 }));
  const pali = [[-12.6, -20.6], [12.6, -20.6], [-12.8, -3.4], [12.8, -3.4]].map(([x, z]) => metti('lightPostLarge', x, z, { misura: 7, ry: x < 0 ? 0 : Math.PI }));

  // striscione degli sponsor dietro le barriere (un solo oggetto)
  const sponsor = tex(2048, 128, (g, w, h) => {
    const nomi = [['BLASTER ARENA', '#ffc94a', '#1c2440'], ['FULMINE', '#ffffff', '#d8432f'], ['NOVA', '#101827', '#7fe0d4'], ['TURBO', '#ffffff', '#3a63d8'], ['ROCKET', '#1c2440', '#ffd45a'], ['MAX POWER', '#ffffff', '#8a48c8']];
    const lw = w / nomi.length; nomi.forEach(([n, fg, bg], i) => { g.fillStyle = bg; g.fillRect(i * lw, 0, lw, h); g.fillStyle = 'rgba(255,255,255,.14)'; g.beginPath(); g.moveTo(i * lw, 0); g.lineTo(i * lw + lw * .4, 0); g.lineTo(i * lw + lw * .2, h); g.lineTo(i * lw, h); g.fill();
      g.fillStyle = fg; g.font = 'italic 900 ' + (n.length > 9 ? 44 : 62) + 'px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(n, i * lw + lw / 2, h / 2 + 4); });
  });
  const striscione = new THREE.Mesh(new THREE.BoxGeometry(24, 1.25, .12), [0, 1, 2, 3, 4, 5].map(i => new THREE.MeshStandardMaterial(i === 4 ? { map: sponsor, roughness: .6 } : { color: 0x2a3148, roughness: .8 })));
  striscione.position.set(0, .95, -21.1); striscione.castShadow = striscione.receiveShadow = true; scene.add(striscione);

  // tabellone luminoso con il punteggio vero
  const tabC = document.createElement('canvas'); tabC.width = 768; tabC.height = 288; const tabG = tabC.getContext('2d');
  const tabT = new THREE.CanvasTexture(tabC); tabT.colorSpace = THREE.SRGBColorSpace; tabT.anisotropy = 4;
  function punteggio(io, lui) { const g = tabG, w = 768, h = 288; g.fillStyle = '#070b16'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,.035)'; for (let y = 0; y < h; y += 6) g.fillRect(0, y, w, 2);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffc94a'; g.font = 'italic 900 44px system-ui, sans-serif'; g.fillText('BLASTER ARENA', w / 2, 40);
    g.fillStyle = '#28324e'; g.fillRect(40, 74, w - 80, 4);
    g.font = '900 34px system-ui, sans-serif'; g.fillStyle = '#ffd874'; g.fillText(nome.toUpperCase().slice(0, 11), w * .25, 112); g.fillStyle = '#ff8f8f'; g.fillText('MAX', w * .75, 112);
    g.font = '900 132px system-ui, sans-serif'; g.fillStyle = '#ffd874'; g.fillText(io, w * .25, 204); g.fillStyle = '#ff8f8f'; g.fillText(lui, w * .75, 204);
    g.fillStyle = '#7f8db0'; g.font = '900 70px system-ui, sans-serif'; g.fillText(':', w / 2, 196); tabT.needsUpdate = true; }
  punteggio(0, 0);
  const tab = new THREE.Group(); tab.position.set(0, 0, -23.2); scene.add(tab);
  const scuro = new THREE.MeshStandardMaterial({ color: 0x232a40, roughness: .7, metalness: .2 });
  const schermo = new THREE.Mesh(new THREE.BoxGeometry(10.4, 3.9, .35), [0, 1, 2, 3, 4, 5].map(i => i === 4 ? new THREE.MeshStandardMaterial({ map: tabT, emissive: 0xffffff, emissiveMap: tabT, emissiveIntensity: .95, roughness: .5 }) : scuro));
  schermo.position.y = 6.3; schermo.castShadow = true; tab.add(schermo);
  for (const x of [-4, 4]) { const g = new THREE.Mesh(new THREE.BoxGeometry(.3, 4.6, .3), scuro); g.position.set(x, 2.3, 0); g.castShadow = true; tab.add(g); }
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(10.8, .22, .5), new THREE.MeshStandardMaterial({ color: 0xffc94a, emissive: 0xffa630, emissiveIntensity: .6 })); cornice.position.y = 8.36; tab.add(cornice);

  // bandierine tra i pali (un solo oggetto)
  { const pos = [], col = [], tinte = [0xff5a4a, 0xffc94a, 0x4ab0ff, 0x55d37f, 0xffffff, 0xc071f0].map(c => new THREE.Color(c));
    const fila = (a, b, n, cala) => { for (let i = 0; i < n; i++) { const t0 = (i + .12) / n, t1 = (i + .88) / n, P = t => new THREE.Vector3().lerpVectors(a, b, t).setY(a.y + (b.y - a.y) * t - Math.sin(t * Math.PI) * cala);
      const p0 = P(t0), p1 = P(t1), pm = P((t0 + t1) / 2); pm.y -= .55; pos.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z, pm.x, pm.y, pm.z); const c = tinte[i % tinte.length]; for (let k = 0; k < 3; k++) col.push(c.r, c.g, c.b); } };
    const A = new THREE.Vector3(-12.6, 6.2, -20.6), B = new THREE.Vector3(12.6, 6.2, -20.6), C = new THREE.Vector3(-12.8, 6.2, -3.4), D = new THREE.Vector3(12.8, 6.2, -3.4);
    fila(A, new THREE.Vector3(-4, 8.1, -23.2), 12, .7); fila(new THREE.Vector3(4, 8.1, -23.2), B, 12, .7); fila(C, A, 22, 1.5); fila(B, D, 22, 1.5);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })); scene.add(m); }

  // bagliori (finto bloom, costa quasi niente)
  const alone = tex(128, 128, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
  const bagliore = (colore, scala, opacita = 1) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: alone, color: colore, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: opacita })); s.scale.setScalar(scala); return s; };
  const lampade = [];

  // mongolfiere lontane
  const strisce = tex(256, 64, (g, w, h) => { ['#ff5a4a', '#ffd45a', '#4ab0ff', '#ffffff'].forEach((c, i, a) => { for (let k = 0; k < 2; k++) { g.fillStyle = c; g.fillRect((i + k * a.length) * w / (a.length * 2), 0, w / (a.length * 2) + 1, h); } }); });
  const palloni = [[-58, 30, -96], [44, 38, -118], [92, 26, -70]].map(([x, y, z], i) => { const g = new THREE.Group();
    const p = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 12), new THREE.MeshLambertMaterial({ map: strisce })); p.scale.y = 1.15; g.add(p);
    const c = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.3, 1.6), new THREE.MeshLambertMaterial({ color: 0x8a5a34 })); c.position.y = -9; g.add(c);
    g.position.set(x, y, z); g.scale.setScalar(1 - i * .12); scene.add(g); return { g, y, f: rnd() * 6 }; });
  vivi.push((dt, t) => { for (const p of palloni) { p.g.position.y = p.y + Math.sin(t * .35 + p.f) * 1.2; p.g.position.x += dt * .35; p.g.rotation.y += dt * .05; } });

  // pulviscolo dorato nell'aria
  { const n = 150, pos = new Float32Array(n * 3), fase = []; for (let i = 0; i < n; i++) { pos.set([-13 + rnd() * 26, .3 + rnd() * 5, -19 + rnd() * 21], i * 3); fase.push(rnd() * 6); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const p = new THREE.Points(g, new THREE.PointsMaterial({ map: alone, color: 0xffe2a0, size: .11, transparent: true, opacity: .6, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(p);
    vivi.push((dt, t) => { for (let i = 0; i < n; i++) { pos[i * 3] += Math.sin(t * .4 + fase[i]) * dt * .12; pos[i * 3 + 1] += Math.cos(t * .5 + fase[i] * 1.7) * dt * .08; } g.attributes.position.needsUpdate = true; }); }

  await Promise.all(lavori);
  let esulta = () => {};
  // pubblico sulle tribune: un raggio dall'alto trova i gradoni veri, così nessuno finisce dentro la struttura
  { const N = 170, teste = new THREE.InstancedMesh(new THREE.SphereGeometry(.2, 8, 6), new THREE.MeshLambertMaterial(), N), corpi = new THREE.InstancedMesh(new THREE.CapsuleGeometry(.17, .3, 2, 6), new THREE.MeshLambertMaterial(), N);
    const m = new THREE.Matrix4(), c = new THREE.Color(), pelle = [0xf2c9a0, 0xd9a273, 0x9a6a44, 0xf7d9bd], maglie = [0xff5a4a, 0xffd45a, 0x4ab0ff, 0x55d37f, 0xffffff, 0xc071f0, 0xff8a3c];
    const ray = new THREE.Raycaster(), giu = new THREE.Vector3(0, -1, 0), nrm = new THREE.Vector3(), posti = []; let k = 0;
    for (const t of await Promise.all(tribune)) { t.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(t);
      for (let x = b.min.x + .5; x < b.max.x - .4; x += .6) for (let z = b.min.z + .5; z < b.max.z - .4; z += .6) {
        if (k >= N || rnd() < .4) continue;
        ray.set(new THREE.Vector3(x + (rnd() - .5) * .2, b.max.y + 2, z + (rnd() - .5) * .2), giu); const h = ray.intersectObject(t, true)[0];
        if (!h || !h.face || h.point.y < .7 || h.point.y > b.max.y - .6 || nrm.copy(h.face.normal).transformDirection(h.object.matrixWorld).y < .7) continue;
        posti.push({ p: h.point.clone(), f: rnd() * 6, i: k++ }); } }
    const w = new THREE.Vector3(), q = new THREE.Quaternion(), uno = new THREE.Vector3(1, 1, 1);
    const sistema = (o, salto) => { w.copy(o.p); w.y += .3 + salto; m.compose(w, q, uno); corpi.setMatrixAt(o.i, m); w.y += .42; m.compose(w, q, uno); teste.setMatrixAt(o.i, m); };
    posti.forEach(o => { sistema(o, 0); teste.setColorAt(o.i, c.set(pelle[Math.floor(rnd() * pelle.length)])); corpi.setColorAt(o.i, c.set(maglie[Math.floor(rnd() * maglie.length)])); });
    teste.count = corpi.count = k; teste.frustumCulled = corpi.frustumCulled = false; if (k) scene.add(teste, corpi);
    let tifo = 0;
    vivi.push((dt, t) => { tifo = Math.max(0, tifo - dt); for (const o of posti) sistema(o, Math.max(0, Math.sin(t * (tifo > 0 ? 9 : 2.2) + o.f)) * (tifo > 0 ? .22 : .04)); teste.instanceMatrix.needsUpdate = corpi.instanceMatrix.needsUpdate = true; });
    esulta = () => { tifo = 1.2; }; }
  for (const p of await Promise.all(pali)) { const b = new THREE.Box3().setFromObject(p), s = bagliore(0xffe0a0, 3.4, .85); s.position.set((b.min.x + b.max.x) / 2, b.max.y - .35, (b.min.z + b.max.z) / 2); scene.add(s); lampade.push(s); }
  { const s = bagliore(0xffe8b0, 15, .22); s.position.set(0, 6.4, -22.6); scene.add(s); }
  vivi.push((dt, t) => { lampade.forEach((s, i) => { s.material.opacity = .78 + Math.sin(t * 7 + i * 2.1) * .05; }); });

  /* ---------------------------------------------------------------- effetti: coriandoli, anelli, lampo del blaster */
  const NP = 360, pp = new Float32Array(NP * 3).fill(-999), pc = new Float32Array(NP * 3), pv = new Float32Array(NP * 3), pl = new Float32Array(NP); let pn = 0;
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('color', new THREE.BufferAttribute(pc, 3));
  const punti = new THREE.Points(pg, new THREE.PointsMaterial({ size: .13, vertexColors: true, transparent: true, depthWrite: false })); punti.frustumCulled = false; scene.add(punti);
  const cc = new THREE.Color();
  function scoppio(pos, colori, n = 30) { for (let i = 0; i < n; i++) { const k = pn = (pn + 1) % NP, a = rnd() * 6.28, e = rnd() * 1.4 - .2, v = 2 + rnd() * 3.6;
      pp.set([pos.x, pos.y, pos.z], k * 3); pv.set([Math.cos(a) * Math.cos(e) * v, Math.sin(e) * v + 1.6, Math.sin(a) * Math.cos(e) * v], k * 3); pl[k] = .7 + rnd() * .5; cc.set(colori[i % colori.length]); pc.set([cc.r, cc.g, cc.b], k * 3); }
    pg.attributes.color.needsUpdate = true; }
  vivi.push(dt => { for (let k = 0; k < NP; k++) { if (pl[k] <= 0) continue; pl[k] -= dt; if (pl[k] <= 0) { pp[k * 3 + 1] = -999; continue; } pv[k * 3 + 1] -= 9 * dt; pp[k * 3] += pv[k * 3] * dt; pp[k * 3 + 1] = Math.max(.03, pp[k * 3 + 1] + pv[k * 3 + 1] * dt); pp[k * 3 + 2] += pv[k * 3 + 2] * dt; } pg.attributes.position.needsUpdate = true; });

  const anelloTex = tex(128, 128, (g, w) => { g.strokeStyle = '#fff'; g.lineWidth = 9; g.shadowColor = '#fff'; g.shadowBlur = 12; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 16, 0, 7); g.stroke(); });
  const anelli = [0, 1, 2, 3].map(() => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: anelloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); s.visible = false; scene.add(s); return { s, t: 1 }; }); let an = 0;
  function anello(pos, colore) { const a = anelli[an = (an + 1) % anelli.length]; a.s.position.copy(pos); a.s.material.color.set(colore); a.t = 0; a.s.visible = true; }
  vivi.push(dt => { for (const a of anelli) { if (!a.s.visible) continue; a.t += dt / .32; if (a.t >= 1) { a.s.visible = false; continue; } a.s.scale.setScalar(.4 + a.t * 2.4); a.s.material.opacity = 1 - a.t; } });

  const stella = tex(128, 128, (g, w) => { g.translate(w / 2, w / 2); const gr = g.createRadialGradient(0, 0, 0, 0, 0, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.3, 'rgba(255,230,150,.8)'); gr.addColorStop(1, 'rgba(255,200,80,0)'); g.fillStyle = gr;
    g.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, r = i % 2 ? w * .16 : w * .5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill(); });
  const lampoS = new THREE.Sprite(new THREE.SpriteMaterial({ map: stella, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false })); lampoS.visible = false; lampoS.position.set(.25, -.17, -.98); camera.add(lampoS); let lt = 0;
  function lampo() { lt = .07; lampoS.visible = true; lampoS.material.rotation = rnd() * 6; lampoS.scale.setScalar(.3 + rnd() * .14); }
  vivi.push(dt => { if (lt > 0) { lt -= dt; if (lt <= 0) lampoS.visible = false; } });

  // scia luminosa dietro ai dardi
  const sciaGeo = new THREE.CylinderGeometry(.004, .03, 1, 6, 1, true); sciaGeo.rotateX(-Math.PI / 2); sciaGeo.translate(0, 0, -.62);
  const sciaMat = { io: new THREE.MeshBasicMaterial({ color: 0xffd45a, transparent: true, opacity: .75, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), max: new THREE.MeshBasicMaterial({ color: 0xff6a5a, transparent: true, opacity: .75, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }) };
  const scia = chi => new THREE.Mesh(sciaGeo, sciaMat[chi === 'io' ? 'io' : 'max']);

  let tempo = 0;
  return { terreno, punteggio, scoppio, anello, lampo, scia, bagliore, esulta: () => esulta(),
    aggiorna(dt) { tempo += dt; for (const f of vivi) f(dt, tempo); } };
}

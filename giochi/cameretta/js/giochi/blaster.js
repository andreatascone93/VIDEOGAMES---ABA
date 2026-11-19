// Blaster Arena — sparatutto in prima persona, cartoon e non violento: si colpiscono bersagli con freccette di gommapiuma.
// Sfida a punti contro Max. La "regia" (esito: 'vinci' | 'perdi') regola solo quanto Max è rapido a rubare i bersagli.
import * as THREE from 'three';
import { model } from '../assets.js';
import { Personaggio } from '../personaggio.js';
import { tone, noise, sleep } from '../core.js';

const AREA = { x0: -3.5, x1: 3.5, z0: -.5, z1: 2.2 };   // dove può muoversi il giocatore
const OCCHI = 1.25;                                      // altezza degli occhi (un ragazzo di 9 anni)

function canvasTex(w, h, draw, rep = [1, 1]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 4; return t;
}
const normalizza = (o, misura, asse = 'max') => { const b = new THREE.Box3().setFromObject(o), s = b.getSize(new THREE.Vector3()); const m = asse === 'max' ? Math.max(s.x, s.y, s.z) : s[asse]; o.scale.multiplyScalar(misura / m); return o; };

export async function avviaBlaster(box, { esito = 'vinci', durata = 40, nome = 'Francesco' } = {}) {
  const perdi = esito === 'perdi';
  // ---------------------------------------------------------------- DOM
  box.innerHTML = `
  <canvas class="bl-c" style="position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none"></canvas>
  <div class="bl-hud" style="position:absolute;top:12px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:14px;background:rgba(10,14,26,.78);padding:8px 18px;border-radius:14px;font-weight:900;font-size:clamp(16px,2.2vw,24px);pointer-events:none;white-space:nowrap">
    <span style="color:#ffc94a">${nome.toUpperCase()}</span><span class="bl-p" style="font-size:1.3em;min-width:1.4em;text-align:center">0</span>
    <span style="opacity:.5">–</span>
    <span class="bl-m" style="font-size:1.3em;min-width:1.4em;text-align:center">0</span><span style="color:#ff7a7a">MAX</span>
  </div>
  <div style="position:absolute;top:62px;left:50%;transform:translateX(-50%);width:min(320px,40%);height:8px;border-radius:5px;background:rgba(255,255,255,.18);overflow:hidden;pointer-events:none"><div class="bl-t" style="height:100%;width:100%;background:#ffc94a"></div></div>
  <div class="bl-joy" style="position:absolute;left:28px;bottom:28px;width:130px;height:130px;border-radius:50%;background:rgba(255,255,255,.12);border:2px solid rgba(255,255,255,.35);pointer-events:none">
    <div class="bl-knob" style="position:absolute;left:40px;top:40px;width:50px;height:50px;border-radius:50%;background:rgba(255,255,255,.55)"></div></div>
  <div class="bl-msg" style="position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);font-size:clamp(28px,5vw,56px);font-weight:900;color:#fff;text-shadow:0 4px 0 rgba(0,0,0,.4);pointer-events:none;text-align:center"></div>
  <div class="bl-help" style="position:absolute;left:50%;bottom:22px;transform:translateX(-50%);background:rgba(10,14,26,.78);padding:8px 16px;border-radius:12px;font-weight:700;font-size:clamp(13px,1.7vw,17px);pointer-events:none;text-align:center">Tocca i bersagli per colpirli · trascina per guardarti intorno · joystick per muoverti</div>
  <div class="bl-fx" style="position:absolute;inset:0;pointer-events:none;overflow:hidden"></div>`;
  const $ = s => box.querySelector(s);
  const cv = $('.bl-c');

  // ---------------------------------------------------------------- scena
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.background = canvasTex(4, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5aa9ef'); gr.addColorStop(.55, '#a9d8ff'); gr.addColorStop(1, '#e8f6ff'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  scene.background.wrapS = scene.background.wrapT = THREE.ClampToEdgeWrapping; scene.background.repeat.set(1, 1);
  scene.fog = new THREE.Fog(0xcfe9ff, 30, 70);
  const camera = new THREE.PerspectiveCamera(62, 1, .05, 120);
  const resize = () => { const w = box.clientWidth || 800, h = box.clientHeight || 600; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  resize(); const ro = new ResizeObserver(resize); ro.observe(box);

  scene.add(new THREE.HemisphereLight(0xdff1ff, 0x6a8a4a, 1.6));
  const sun = new THREE.DirectionalLight(0xfff4e0, 2.4); sun.position.set(8, 14, 6); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 40 }); sun.shadow.normalBias = .03; scene.add(sun);

  // terreno: prato a strisce + pista centrale
  const prato = canvasTex(256, 256, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#7cc95a' : '#86d363'; g.fillRect(0, i * h / 8, w, h / 8); } for (let i = 0; i < 400; i++) { g.fillStyle = 'rgba(40,90,30,.12)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 5); } }, [10, 10]);
  const terreno = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshStandardMaterial({ map: prato, roughness: 1 }));
  terreno.rotation.x = -Math.PI / 2; terreno.receiveShadow = true; scene.add(terreno);
  const pedana = new THREE.Mesh(new THREE.BoxGeometry(8.4, .08, 3.6), new THREE.MeshStandardMaterial({ color: 0x3b4a66, roughness: .8 }));
  pedana.position.set(0, .04, .85); pedana.receiveShadow = true; scene.add(pedana);
  const riga = new THREE.Mesh(new THREE.BoxGeometry(8.4, .09, .12), new THREE.MeshStandardMaterial({ color: 0xffc94a })); riga.position.set(0, .045, -.95); scene.add(riga);

  // decorazioni (Kenney Racing/Blaster Kit, CC0)
  const piazza = async (file, x, z, { s = 1, ry = 0, y = 0, misura = null } = {}) => { const o = await model(file); if (misura) normalizza(o, misura); else o.scale.multiplyScalar(s); o.position.set(x, y, z); o.rotation.y = ry; scene.add(o); return o; };
  const cover = [];
  await Promise.all([
    ...[[-9, -18], [-3, -21], [5, -20], [11, -17], [-14, -10], [15, -9], [-16, -2], [17, -1], [-12, 6], [13, 6]].map(([x, z], i) => piazza('pista/' + (i % 2 ? 'treeLarge' : 'treeSmall') + '.glb', x, z, { misura: i % 2 ? 6 : 4, ry: i })),
    piazza('pista/grandStand.glb', -10.5, -12, { misura: 7, ry: .9 }),
    piazza('pista/billboard.glb', 6.5, -22, { misura: 7, ry: -.15 }),
    piazza('pista/tent.glb', 12, -12, { misura: 4.5, ry: -.8 }),
    piazza('pista/flagCheckers.glb', -4.6, -1.4, { misura: 2.6 }), piazza('pista/flagRed.glb', 4.4, -1.4, { misura: 2.6 }),
    ...[-6, -3, 0, 3, 6].map(x => piazza('pista/fenceStraight.glb', x - 1.5, -24, { misura: 3 })),
    ...[[-5.5, -7, 'crate-wide', 1.8], [-1.6, -9.5, 'crate-medium', 1.3], [2.8, -6.5, 'crate-small', 1.0], [5.6, -10, 'crate-wide', 1.8], [-3.6, -12.5, 'crate-medium', 1.3], [1.2, -13.5, 'crate-wide', 1.8], [7.2, -5, 'crate-small', 1.0], [-7.6, -11, 'crate-small', 1.0]]
      .map(([x, z, f, m]) => piazza('blaster/' + f + '.glb', x, z, { misura: m, ry: x * .3 }).then(o => cover.push(o)))
  ]);

  // ---------------------------------------------------------------- bersagli
  const tplGrande = normalizza(await model('blaster/target-large.glb'), 1);
  const asta = new THREE.MeshStandardMaterial({ color: 0x59606e, metalness: .4, roughness: .5 });
  const slots = [];
  for (const c of cover) { const b = new THREE.Box3().setFromObject(c); slots.push({ x: (b.min.x + b.max.x) / 2, y: b.max.y, z: (b.min.z + b.max.z) / 2 }); }
  for (const [x, z] of [[-6.5, -12], [0, -13], [6, -12.5], [-2.5, -5.5], [4.5, -7.5], [-8, -6], [8, -9.5]]) slots.push({ x, y: 0, z });
  const bersagli = [];
  function nuovoBersaglio() {
    const g = new THREE.Group(), cerniera = new THREE.Group(); g.add(cerniera);
    const t = tplGrande.clone(true); const dimensione = perdi ? 1.15 : 1.4; t.scale.multiplyScalar(dimensione); t.rotation.y = Math.PI / 2;
    const tb = new THREE.Box3().setFromObject(t); t.position.y = -tb.min.y + .45; cerniera.add(t);
    const palo = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .5, 8), asta); palo.position.y = .25; cerniera.add(palo);
    g.traverse(m => { if (m.isMesh) { m.castShadow = true; } });
    scene.add(g); return { g, cerniera, t, attivo: false, colpito: false, slot: null, nascita: 0, vita: 0, scorre: 0, x0: 0 };
  }
  for (let i = 0; i < 6; i++) { const b = nuovoBersaglio(); b.g.visible = false; bersagli.push(b); }

  // ---------------------------------------------------------------- giocatore e blaster in prima persona
  const io = { x: 0, z: 1.2, yaw: 0, pitch: -.04 };
  const arma = normalizza(await model('blaster/blaster-a.glb', { shadow: false }), .46);
  const armaG = new THREE.Group(); armaG.add(arma); camera.add(armaG); scene.add(camera);
  armaG.position.set(.24, -.25, -.55); arma.rotation.y = 0;
  const tplDardo = normalizza(await model('blaster/bullet-foam.glb', { shadow: false }), .16);

  // ---------------------------------------------------------------- Max, il rivale
  const max = await Personaggio.crea({ altezza: 1.4 });
  await max.setSkin('racerRedMale');
  max.root.position.set(2.5, .0, -2.3); max.root.rotation.y = Math.PI; scene.add(max.root);
  const armaMax = normalizza(await model('blaster/blaster-d.glb'), .5);
  { const mano = max.ossa.RightHand; mano.add(armaMax); armaMax.position.set(0, 0, 0); armaMax.rotation.set(0, 0, 0); armaMax.scale.setScalar(1);
    max.root.updateMatrixWorld(true); const sz = new THREE.Box3().setFromObject(armaMax).getSize(new THREE.Vector3()); armaMax.scale.setScalar(.42 / Math.max(sz.x, sz.y, sz.z)); }
  max.play('idle');

  // ---------------------------------------------------------------- stato di gioco
  let punti = 0, puntiMax = 0, tempo = durata, inCorso = false, fine = false;
  const dardi = [];
  const fx = $('.bl-fx');
  const v = new THREE.Vector3(), w = new THREE.Vector3();
  function popup(testo, pos, colore) {
    v.copy(pos).project(camera); if (v.z > 1) return;
    const el = document.createElement('div'); el.textContent = testo;
    el.style.cssText = `position:absolute;left:${(v.x + 1) / 2 * 100}%;top:${(1 - v.y) / 2 * 100}%;transform:translate(-50%,-50%);font-weight:900;font-size:30px;color:${colore};text-shadow:0 3px 0 rgba(0,0,0,.45)`;
    fx.appendChild(el); el.animate([{ transform: 'translate(-50%,-50%) scale(.6)', opacity: 1 }, { transform: 'translate(-50%,-160%) scale(1.15)', opacity: 0 }], { duration: 900, easing: 'ease-out' }); setTimeout(() => el.remove(), 900);
  }
  function aggiornaHud() { $('.bl-p').textContent = punti; $('.bl-m').textContent = puntiMax; }

  function spara(da, a, chi, bersaglio) {
    const d = tplDardo.clone(true); d.position.copy(da); d.lookAt(a); scene.add(d);
    const dist = da.distanceTo(a);
    dardi.push({ d, da: da.clone(), a: a.clone(), t: 0, durata: dist / (chi === 'io' ? 34 : 30), chi, bersaglio });
    if (chi === 'io') { tone(900, .05, 'square', .04); noise(.06, .12, 2500); } else tone(700, .04, 'square', .02);
  }
  function colpisci(b, chi) {
    if (!b.attivo || b.colpito) return false;
    b.colpito = true; b.giu = 0;
    if (chi === 'io') { punti++; tone(880, .08, 'triangle', .09); tone(1320, .12, 'triangle', .07, .07); popup('+1', b.t.getWorldPosition(w), '#ffc94a'); }
    else { puntiMax++; tone(330, .1, 'triangle', .06); popup('+1 MAX', b.t.getWorldPosition(w), '#ff7a7a'); }
    aggiornaHud(); return true;
  }

  // regia: Max decide se "vuole" un bersaglio
  function maxVuole() {
    if (perdi) { const vant = puntiMax - punti; return vant < 3 + (tempo < 8 ? 1 : 0); }
    return punti - puntiMax > 2;   // facile: Max segna solo quando il giocatore è ben avanti
  }
  let maxOcc = 0, maxObiettivo = null, maxTimer = 0;
  function aggiornaMax(dt) {
    maxOcc -= dt;
    if (maxObiettivo) {
      const b = maxObiettivo; b.g.getWorldPosition(v);
      const ang = Math.atan2(v.x - max.root.position.x, v.z - max.root.position.z);
      let diff = ang - max.root.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); max.root.rotation.y += diff * Math.min(1, dt * 10);
      maxTimer -= dt;
      if (maxTimer <= 0) {
        const colpo = b.attivo && !b.colpito && b.vuole;
        max.play('shoot', { once: true, speed: 1.6, fade: .1 }).then(() => max.play('idle', { fade: .2 }));
        max.punto('RightHand', w); w.y += .08;
        const mira = b.t.getWorldPosition(v).clone();
        if (!colpo) mira.add(new THREE.Vector3((Math.random() - .5) * 2.2, .9 + Math.random() * .6, 0));
        spara(w, mira, 'max', colpo ? b : null);
        maxObiettivo = null; maxOcc = perdi ? .45 : 1.1;
      }
      return;
    }
    if (maxOcc > 0) return;
    const liberi = bersagli.filter(b => b.attivo && !b.colpito && !b.preso);
    if (!liberi.length) return;
    const b = liberi[Math.floor(Math.random() * liberi.length)];
    b.vuole = maxVuole();
    // quando non "vuole" il punto, ogni tanto spara comunque e sbaglia (è più credibile)
    if (!b.vuole && Math.random() > (perdi ? .15 : .35)) { maxOcc = .8; return; }
    b.preso = true; maxObiettivo = b;
    maxTimer = b.vuole ? (perdi ? .22 + Math.random() * .2 : 1.0 + Math.random() * .8) : .7 + Math.random() * .6;
  }

  let prossimo = .6;
  function spawn(dt) {
    prossimo -= dt; if (prossimo > 0) return;
    prossimo = perdi ? .9 + Math.random() * .4 : 1.1 + Math.random() * .5;
    const libero = bersagli.find(b => !b.attivo);
    const usati = new Set(bersagli.filter(b => b.attivo).map(b => b.slot));
    const scelte = slots.filter(s => !usati.has(s));
    if (!libero || !scelte.length) return;
    const s = scelte[Math.floor(Math.random() * scelte.length)];
    Object.assign(libero, { attivo: true, colpito: false, preso: false, vuole: false, slot: s, nascita: 0, vita: perdi ? 2.6 : 3.4, giu: 0, scorre: s.y === 0 && Math.random() < .5 ? (Math.random() < .5 ? -1 : 1) : 0, x0: s.x });
    libero.g.position.set(s.x, s.y, s.z); libero.g.rotation.y = Math.atan2(io.x - s.x, io.z - s.z); libero.g.visible = true; libero.cerniera.rotation.x = -Math.PI / 2;
    tone(520, .06, 'triangle', .03);
  }
  function aggiornaBersagli(dt) {
    for (const b of bersagli) {
      if (!b.attivo) continue;
      b.nascita += dt;
      if (b.colpito) { b.giu += dt; b.cerniera.rotation.x = -Math.min(1, b.giu / .35) * Math.PI / 2; b.t.rotation.z += dt * 12; if (b.giu > .6) { b.attivo = false; b.g.visible = false; b.t.rotation.z = 0; } continue; }
      const su = Math.min(1, b.nascita / .25); b.cerniera.rotation.x = -(1 - su) * Math.PI / 2;
      if (b.scorre) b.g.position.x = b.x0 + Math.sin(b.nascita * 1.4) * 1.6 * b.scorre;
      if (b.nascita > b.vita) { b.giu += dt; b.cerniera.rotation.x = -Math.min(1, b.giu / .3) * Math.PI / 2; if (b.giu > .3) { b.attivo = false; b.g.visible = false; } }
    }
  }
  function aggiornaDardi(dt) {
    for (let i = dardi.length - 1; i >= 0; i--) {
      const d = dardi[i]; d.t += dt / d.durata;
      const k = Math.min(1, d.t); d.d.position.lerpVectors(d.da, d.a, k); d.d.position.y += Math.sin(k * Math.PI) * .15;
      if (k >= 1) {
        if (d.bersaglio) colpisci(d.bersaglio, d.chi);
        scene.remove(d.d); dardi.splice(i, 1);
      }
    }
  }

  // ---------------------------------------------------------------- input
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  const tocchi = new Map(); let joy = null; const keys = {};
  const joyEl = $('.bl-joy'), knob = $('.bl-knob');
  function sparaA(cx, cy) {
    const r = cv.getBoundingClientRect();
    ptr.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, camera);
    const vivi = bersagli.filter(b => b.attivo && !b.colpito);
    const hit = ray.intersectObjects(vivi.map(b => b.t), true)[0];
    const altri = ray.intersectObjects([terreno, ...cover], true)[0];
    const punto = hit ? hit.point : altri ? altri.point : ray.ray.at(30, new THREE.Vector3());
    let b = null; if (hit) b = vivi.find(x => { let o = hit.object; while (o) { if (o === x.t) return true; o = o.parent; } return false; });
    armaG.position.z = -.45; armaG.rotation.x = .18;
    const muso = new THREE.Vector3(.26, -.2, -.95); camera.localToWorld(muso);
    spara(muso, punto, 'io', b);
    // segno di mira
    const m = document.createElement('div'); m.style.cssText = `position:absolute;left:${cx - r.left}px;top:${cy - r.top}px;width:26px;height:26px;margin:-13px;border:3px solid ${b ? '#ffc94a' : 'rgba(255,255,255,.8)'};border-radius:50%`;
    fx.appendChild(m); m.animate([{ transform: 'scale(.4)', opacity: 1 }, { transform: 'scale(1.3)', opacity: 0 }], { duration: 350 }); setTimeout(() => m.remove(), 350);
  }
  cv.addEventListener('pointerdown', e => {
    e.preventDefault(); cv.setPointerCapture(e.pointerId);
    const r = cv.getBoundingClientRect(), lx = e.clientX - r.left, ly = e.clientY - r.top;
    if (e.pointerType !== 'mouse' && lx < r.width * .32 && ly > r.height * .45 && !joy) { joy = { id: e.pointerId, x: lx, y: ly, dx: 0, dy: 0 }; joyEl.style.left = (lx - 65) + 'px'; joyEl.style.top = (ly - 65) + 'px'; joyEl.style.bottom = 'auto'; return; }
    tocchi.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now(), mosso: 0 });
  });
  cv.addEventListener('pointermove', e => {
    if (joy && e.pointerId === joy.id) { const r = cv.getBoundingClientRect(); let dx = e.clientX - r.left - joy.x, dy = e.clientY - r.top - joy.y; const l = Math.hypot(dx, dy); if (l > 50) { dx *= 50 / l; dy *= 50 / l; } joy.dx = dx / 50; joy.dy = dy / 50; knob.style.transform = `translate(${dx}px,${dy}px)`; return; }
    const t = tocchi.get(e.pointerId); if (!t) return;
    const dx = e.clientX - t.x, dy = e.clientY - t.y; t.x = e.clientX; t.y = e.clientY; t.mosso += Math.abs(dx) + Math.abs(dy);
    if (t.mosso > 12) { io.yaw -= dx * .0045; io.pitch = THREE.MathUtils.clamp(io.pitch - dy * .003, -.35, .3); }
  });
  const su = e => {
    if (joy && e.pointerId === joy.id) { joy = null; knob.style.transform = ''; joyEl.style.left = '28px'; joyEl.style.top = ''; joyEl.style.bottom = '28px'; return; }
    const t = tocchi.get(e.pointerId); tocchi.delete(e.pointerId);
    if (t && inCorso && t.mosso <= 12 && performance.now() - t.t0 < 450) sparaA(t.x0, t.y0);
  };
  cv.addEventListener('pointerup', su); cv.addEventListener('pointercancel', su);
  const kd = e => { keys[e.key.toLowerCase()] = true; }, ku = e => { keys[e.key.toLowerCase()] = false; };
  addEventListener('keydown', kd); addEventListener('keyup', ku);

  // ---------------------------------------------------------------- ciclo
  let last = performance.now(), raf = 0, tLimite = 0;
  function aggiornaGiocatore(dt) {
    let mx = 0, mz = 0;
    if (joy) { mx += joy.dx; mz += joy.dy; }
    if (keys.a || keys.arrowleft) mx -= 1; if (keys.d || keys.arrowright) mx += 1; if (keys.w || keys.arrowup) mz -= 1; if (keys.s || keys.arrowdown) mz += 1;
    if (keys.q) io.yaw += dt * 1.6; if (keys.e) io.yaw -= dt * 1.6;
    const sp = 3.2 * dt, c = Math.cos(io.yaw), s = Math.sin(io.yaw);
    io.x = THREE.MathUtils.clamp(io.x + (mx * c + mz * s) * sp, AREA.x0, AREA.x1);
    io.z = THREE.MathUtils.clamp(io.z + (-mx * s + mz * c) * sp, AREA.z0, AREA.z1);
    if (Math.hypot(io.x - max.root.position.x, io.z - max.root.position.z) < .7) io.x = max.root.position.x - .7 * Math.sign(max.root.position.x - io.x || 1);
    io.yaw = THREE.MathUtils.clamp(io.yaw, -1.2, 1.2);
    const passo = (mx || mz) ? Math.sin(performance.now() / 110) * .025 : 0;
    camera.position.set(io.x, OCCHI + passo, io.z); camera.rotation.set(io.pitch, io.yaw, 0, 'YXZ');
    armaG.position.z += (-.55 - armaG.position.z) * Math.min(1, dt * 12); armaG.rotation.x += (0 - armaG.rotation.x) * Math.min(1, dt * 12);
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    aggiornaGiocatore(dt);
    max.update(dt);
    if (inCorso) {
      tempo -= dt; $('.bl-t').style.width = Math.max(0, tempo / durata * 100) + '%';
      spawn(dt); aggiornaMax(dt);
      if (tempo <= 0) termina();
    }
    aggiornaBersagli(dt); aggiornaDardi(dt);
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  let risolvi; const fineP = new Promise(r => risolvi = r);
  async function termina() {
    if (fine) return; inCorso = false; fine = true;
    await sleep(900); // aspetta gli ultimi dardi in volo
    $('.bl-msg').textContent = 'TEMPO!'; tone(440, .4, 'square', .06);
    await sleep(1100);
    risolvi({ punti, puntiMax });
  }
  (async () => {
    const msg = $('.bl-msg');
    for (const t of ['3', '2', '1']) { msg.textContent = t; tone(440, .12, 'triangle', .07); await sleep(700); }
    msg.textContent = 'VIA!'; tone(880, .25, 'triangle', .08); inCorso = true;
    await sleep(600); msg.textContent = '';
    setTimeout(() => { const h = $('.bl-help'); if (h) h.style.display = 'none'; }, 5000);
  })();

  return {
    fine: fineP,
    distruggi() {
      cancelAnimationFrame(raf); ro.disconnect(); removeEventListener('keydown', kd); removeEventListener('keyup', ku);
      renderer.dispose(); renderer.forceContextLoss && renderer.forceContextLoss(); box.innerHTML = '';
    },
    // per i test automatici
    _stato: () => ({ punti, puntiMax, tempo, attivi: bersagli.filter(b => b.attivo).length }),
    _sparaA: sparaA, _camera: camera, _bersagli: bersagli
  };
}

/* La cameretta di Francesco — gioco 3D per insegnare a fare una pausa quando arriva la rabbia.
   Contingenze (vedi docs/architettura.md e docs/principi.md):
   MO  sconfitte ripetute al tablet dopo alcune vittorie (partite vere, con esito programmato)
   SD  rabbia arancione, che sale DURANTE la partita: barra continua, segnali del corpo scritti, viso rosso e teso, battito
   R   posare il tablet (anche a metà partita) e scegliere un'altra attività: musica, disegno, parlare con la mamma,
       costruzioni con gli altri bambini
   R+  la calma torna poco a poco mentre fa l'attività → +XP, +Forza, giochi premio, e il tablet resta suo
   R-  porta sbattuta / tablet lanciato / urla / continuare fino a esplodere → arriva un genitore, niente XP, niente premi,
       il tablet viene tolto; si riparte il giorno dopo */
import * as THREE from 'three';
import { db, save, cfg, N, $, sleep, clamp, tone, noise, jingle, speak, caption, objective, overlay, tween, stepTweens, toast, heartbeat, audio, buio } from './core.js';
import { costruisciStanza, canvasTex } from './stanza.js';
import { costruisciSalone, TORRE } from './salone.js';
import { Personaggio } from './personaggio.js';
import { Volto } from './volto.js';
import { Tablet } from './tablet.js';
import { Rabbia } from './rabbia.js';
import { creaPersona, parla, togli, zittisci, aggiornaFumetti } from './persone.js';
import { creaAttivita } from './attivita.js';
import { initTerapista } from './terapista.js';
import { load } from './assets.js';

const DEBUG = new URLSearchParams(location.search).has('debug');

/* ------------------------------------------------------------------ scena */
const canvas = $('world');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, .05, 60);
let W = 1, H = 1;
function resize() { W = innerWidth; H = innerHeight; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

/* ------------------------------------------------------------------ caricamento */
const bar = $('bar').firstElementChild;
let room, sal, P, volto, mamma, papa, leo, giulia, ATT;
const tablet = new Tablet();
const tabMesh = new THREE.Group();   // il tablet nel mondo 3D
let tabSchermo, luceTablet, crepe;
const cuffie = new THREE.Group(), bicchiere = new THREE.Group();
const aura = new THREE.Mesh(new THREE.RingGeometry(.35, .6, 48), new THREE.MeshBasicMaterial({ color: 0xffc94a, transparent: true, opacity: 0, depthWrite: false }));
const alone = new THREE.Mesh(new THREE.CircleGeometry(.55, 40), new THREE.MeshBasicMaterial({ color: 0xff3b2f, transparent: true, opacity: 0, depthWrite: false }));
const freccia = new THREE.Mesh(new THREE.ConeGeometry(.12, .26, 20), new THREE.MeshStandardMaterial({ color: 0x3fcf7a, emissive: 0x3fcf7a, emissiveIntensity: .6 }));
const debug = {};

async function carica() {
  const passi = [
    () => load('personaggio/francesco.glb'),
    async () => { room = await costruisciStanza(scene); },
    async () => { sal = await costruisciSalone(scene); },
    async () => { P = await Personaggio.crea({ altezza: 1.36 }); P.altezza = 1.36; scene.add(P.root); volto = await Volto.crea(P, 'casualMaleA'); Rabbia.init(volto); },
    async () => {
      mamma = await creaPersona({ nome: 'Mamma', skin: 'casualFemaleB', altezza: 1.66, capelli: 0xe2502d });
      papa = await creaPersona({ nome: 'Papà', skin: 'businessMaleA', altezza: 1.78 });
      leo = await creaPersona({ nome: 'Leo', skin: 'farmerB', altezza: 1.2 });
      giulia = await creaPersona({ nome: 'Giulia', skin: 'farmerA', altezza: 1.14, capelli: 0xa5693f });
      [mamma, papa, leo, giulia].forEach(p => scene.add(p.root));
    }
  ];
  for (let i = 0; i < passi.length; i++) { await passi[i](); bar.style.width = ((i + 1) / passi.length * 100) + '%'; }
  // tablet 3D
  const m = (o) => new THREE.MeshStandardMaterial({ roughness: .4, ...o });
  const corpo = new THREE.Mesh(new THREE.BoxGeometry(.26, .012, .18), m({ color: 0x1d222c })); corpo.castShadow = true; tabMesh.add(corpo);
  tabSchermo = new THREE.Mesh(new THREE.PlaneGeometry(.235, .155), new THREE.MeshStandardMaterial({ color: 0x050810, emissive: 0x4a90ff, emissiveIntensity: .9, roughness: .2 }));
  tabSchermo.rotation.x = -Math.PI / 2; tabSchermo.position.y = .0065; tabMesh.add(tabSchermo);
  crepe = canvasTex(256, 170, (g, w, h) => {
    g.fillStyle = '#20262f'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(235,240,250,.9)'; g.lineWidth = 2;
    const c = [w * .62, h * .4];
    for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2 + i * .7, l = 60 + (i * 37) % 90; g.beginPath(); g.moveTo(...c); let x = c[0], y = c[1]; for (let k = 1; k <= 4; k++) { x = c[0] + Math.cos(a + (k % 2 ? .12 : -.1)) * l * k / 4; y = c[1] + Math.sin(a + (k % 2 ? .12 : -.1)) * l * k / 4; g.lineTo(x, y); } g.stroke(); }
    g.lineWidth = 1; [18, 34, 52].forEach(r => { g.beginPath(); g.arc(c[0], c[1], r, 0, 7); g.stroke(); });
  });
  luceTablet = new THREE.PointLight(0x7fb0ff, 0, 1.2, 2); luceTablet.position.y = .12; tabMesh.add(luceTablet);
  scene.add(tabMesh);
  room.tablet.visible = false; // sostituito dal tablet "vivo"
  aura.rotation.x = alone.rotation.x = -Math.PI / 2; aura.position.y = .02; alone.position.y = .015; P.root.add(aura); P.root.add(alone);
  freccia.rotation.x = Math.PI; freccia.visible = false; scene.add(freccia);
  // cuffie per la musica (agganciate alla testa) e bicchiere d'acqua (agganciato alla mano)
  { const nero = m({ color: 0x23272f }), rosso = m({ color: 0xe8453c });
    P.root.updateMatrixWorld(true); const t = P.punto('Head'); cuffie.position.set(t.x, t.y + .17, t.z);
    const arco = new THREE.Mesh(new THREE.TorusGeometry(.228, .019, 8, 28, Math.PI), nero); arco.scale.y = 1.12; arco.position.z = -.03; cuffie.add(arco);
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.075, .075, .05, 20), rosso); p.rotation.z = Math.PI / 2; p.position.set(s * .225, -.02, -.03); p.castShadow = true; cuffie.add(p); }
    scene.add(cuffie); P.ossa.Head.attach(cuffie); cuffie.visible = false;
    const b = new THREE.Mesh(new THREE.CylinderGeometry(.035, .028, .1, 16), new THREE.MeshStandardMaterial({ color: 0xcfe8ff, transparent: true, opacity: .75, roughness: .1 }));
    bicchiere.add(b); P.punto('RightHand', bicchiere.position); bicchiere.position.y += .04; scene.add(bicchiere); P.ossa.RightHand.attach(bicchiere); bicchiere.visible = false; }
  // posti a sedere del salone, misurati sul divano
  LS.divanoF.y = sal.sedutaDivano - .5; LS.divanoM.y = sal.sedutaDivano - .5 * mamma.altezza / 1.36;
  ATT = creaAttivita({ P, L, LS, room, sal, mamma, bimbi: [leo, giulia], cuffie, debug, vaiA, siedi, alzatiAnimato, camera_, fissa,
    breve: () => !!S && S.livello === 4, calma: k => { Rabbia.base = calmaDa + (10 - calmaDa) * clamp(k, 0, 1); }, bevi: on => { bicchiere.visible = on; sal.tazza.visible = !on; } });
}

/* ------------------------------------------------------------------ luoghi */
const L = {
  porta: { x: 2.15, z: .6, rot: Math.PI / 2 },
  portaFuori: { x: 2.95, z: .6 },
  scrivania: { x: 1.4, z: -.95, rot: Math.PI },
  letto: { x: -1.3, z: -1.45, rot: -Math.PI / 2 },
  poltrona: { x: -1.25, z: 1.25, rot: -Math.PI / 2 },
  portaUscita: { x: 1.85, z: 1.2, rot: 2.2 },
  sacco: { x: 1.32, z: .95, rot: Math.PI / 2 },
  kart: { x: .55, z: 1.1, rot: 0 },
  centro: { x: .2, z: .3, rot: 0 }
};
L.lettoSeduto = { x: -2.08, y: -.13, z: -1.9, rot: 0, da: L.letto };
L.poltronaSeduto = { x: -2.15, y: -.1, z: 1.25, rot: Math.PI / 2, da: L.poltrona };
const LS = {   // salone
  portaFuori: { x: -3.85, z: .6 },
  ingresso: { x: -2.7, z: .6, rot: -Math.PI / 2 },
  daMamma: { x: -.1, z: -1.2, rot: -2.3 },
  gioco: { x: TORRE.x, z: TORRE.z - 1.0, rot: 0 },
  leo: { x: TORRE.x - .78, y: -.335, z: TORRE.z + .12, rot: Math.PI / 2 },
  giulia: { x: TORRE.x + .78, y: -.32, z: TORRE.z + .12, rot: -Math.PI / 2 }
};
LS.divanoF = { x: -.85, y: 0, z: -2.0, rot: 0, da: LS.daMamma };
LS.divanoM = { x: -1.75, y: 0, z: -2.0, rot: .2 };
LS.terraF = { x: TORRE.x, y: -.38, z: TORRE.z - .82, rot: 0, da: LS.gioco };

const TAB_SCRIVANIA = { p: [1.4, .615, -1.62], r: [0, .25, 0] };
const TAB_LETTO = { p: [-1.95, .47, -.85], r: [0, -.4, 0] };
let tabStato = 'scrivania'; // scrivania | mano | letto | volo | terra | genitore | via
let portatore = null;
function posaTablet(dove) {
  tabStato = dove; const d = dove === 'letto' ? TAB_LETTO : TAB_SCRIVANIA;
  if (dove === 'scrivania' || dove === 'letto') { tabMesh.position.set(...d.p); tabMesh.rotation.set(...d.r); tabMesh.scale.setScalar(1); }
}
function schermoTablet(on, colore = 0x4a90ff) { tabSchermo.material.emissive.set(colore); tabSchermo.material.emissiveIntensity = on ? .9 : 0; }
function rompiTablet(rotto) { const m = tabSchermo.material; m.map = rotto ? crepe : null; m.color.set(rotto ? 0xffffff : 0x050810); if (rotto) m.emissiveIntensity = 0; m.needsUpdate = true; }

/* ------------------------------------------------------------------ stanze, ostacoli e camminata */
let luogo = 'cameretta', ospite = null;
const MAPPA = {
  cameretta: {
    lim: { x0: -2.35, x1: 2.35, z0: -1.2, z1: 1.95 },
    ost: () => {
      const o = [[-2.6, -2.2, -1.55, -.35], [-1.55, -2.2, -.9, -1.55], [.6, -2.2, 2.6, -1.3], [2.0, -1.25, 2.6, -.65], [-2.6, .65, -1.5, 1.85], [-2.6, .25, -2.1, .65], [-2.6, 1.8, -2.0, 2.2]];
      if (room.sacco.visible) o.push([2.1, .6, 2.6, 1.3]);
      if (room.kartGioco.visible) o.push([.2, 1.4, .95, 2.1]);
      return o;
    },
    via: [[.2, .3], [.6, .9], [-1, .1], [1.3, .55]], pavimento: () => room.pavimento
  },
  salone: {
    lim: { x0: -3.1, x1: 3.1, z0: -1.35, z1: 2.1 },
    ost: () => [[-2.25, -2.4, -.35, -1.45], [-1.9, -1.1, -.7, -.4], [.8, -2.4, 2.6, -1.7], [.75, -.2, 2.65, .75], [-2.4, .7, -.1, 2.1], [2.75, 1.2, 3.4, 2.4], [2.6, -.15, 3.4, .85], [2.6, -2.4, 3.4, -1.6]],
    via: [[-.15, .3], [.2, -.75], [-2.7, .4], [.4, 1.0], [2.9, -.9]], pavimento: () => sal.pavimento
  }
};
const sediPersona = (p, posto) => { p.stop(); p.play('sit', { fade: 0 }); p.root.position.set(posto.x, posto.y, posto.z); p.root.rotation.y = posto.rot; };
function mostraStanza(l) {
  luogo = l; room.gruppo.visible = l === 'cameretta'; sal.gruppo.visible = l === 'salone';
  mamma.root.visible = l === 'salone' || ospite === mamma; papa.root.visible = ospite === papa; leo.root.visible = giulia.root.visible = l === 'salone';
  tabMesh.visible = l === 'cameretta' && tabStato !== 'via';
  if (l === 'salone') { sediPersona(mamma, LS.divanoM); sediPersona(leo, LS.leo); sediPersona(giulia, LS.giulia); }
}
function dentro(x, z, m = .18) { return MAPPA[luogo].ost().find(([a, b, c, d]) => x > a - m && x < c + m && z > b - m && z < d + m); }
function bloccato(x0, z0, x1, z1) {
  for (let i = 1; i <= 20; i++) { const t = i / 20; if (dentro(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, .12)) return true; }
  return false;
}
async function cammina(x, z, { run = false, chi = P } = {}) {
  if (chi === P) alzati();
  const p = chi.root.position;
  if (bloccato(p.x, p.z, x, z)) {
    // passa per un punto libero intermedio
    const c0 = MAPPA[luogo].via[0], cand = [...MAPPA[luogo].via, [p.x, c0[1]], [x, c0[1]], [c0[0], z]];
    const via = cand.find(([vx, vz]) => !bloccato(p.x, p.z, vx, vz) && !bloccato(vx, vz, x, z)) || c0;
    await chi.walkTo(via[0], via[1], { run });
  }
  await chi.walkTo(x, z, { run });
}
async function vaiA(posto, opz = {}) {
  const chi = opz.chi || P, p = chi.root.position;
  if (Math.hypot(p.x - posto.x, p.z - posto.z) > .08 || (chi === P && seduto)) await cammina(posto.x, posto.z, opz);
  if (posto.rot != null) { chi.faceTo(posto.rot, 250); await sleep(260); }
}

let seduto = null;
async function siedi(posto, { tablet: conTablet = false } = {}) {
  seduto = posto;
  P.play(conTablet ? 'racingIdle' : 'sit', { fade: .45 });
  const r = P.root, x0 = r.position.x, y0 = r.position.y, z0 = r.position.z, a0 = r.rotation.y;
  let da = posto.rot - a0; da = Math.atan2(Math.sin(da), Math.cos(da));
  await tween(k => { r.position.set(x0 + (posto.x - x0) * k, y0 + (posto.y - y0) * k + Math.sin(k * Math.PI) * .12, z0 + (posto.z - z0) * k); r.rotation.y = a0 + da * k; }, 0, 1, 650);
}
function alzati() {
  if (!seduto) return;
  const da = seduto.da;
  seduto = null; P.root.position.set(da.x, 0, da.z); P.root.rotation.y = da.rot + Math.PI; P.play('idle', { fade: .3 });
}
async function alzatiAnimato() {
  if (!seduto) return;
  const da = seduto.da, r = P.root;
  const x0 = r.position.x, y0 = r.position.y, z0 = r.position.z;
  P.play('idle', { fade: .4 }); seduto = null;
  await tween(k => r.position.set(x0 + (da.x - x0) * k, y0 * (1 - k) + Math.sin(k * Math.PI) * .1, z0 + (da.z - z0) * k), 0, 1, 500);
}

/* ------------------------------------------------------------------ camera */
const cam = { pos: new THREE.Vector3(.3, 3.9, 5.6), look: new THREE.Vector3(0, .6, -.2), sx: .5, sy: .5 };
const camT = { pos: cam.pos.clone(), look: cam.look.clone(), sx: .5, sy: .5 };
const camFissa = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
let camMode = 'stanza', shake = 0, snapCam = false;
const testa = new THREE.Vector3();
function camera_(mode, subito = false) { camMode = mode; if (subito) snapCam = true; }
function fissa(pos, look, subito = false) { camFissa.pos.set(...pos); camFissa.look.set(...look); camera_('fissa', subito); }
function aggiornaCamera(dt) {
  const port = W / H < 1;
  if (camMode === 'stanza' || camMode === 'scelta' || camMode === 'salone') {
    const k = (port ? 1.55 : Math.max(1, 1.5 / (W / H))) * (camMode === 'scelta' ? 1.06 : camMode === 'salone' ? 1.24 : 1);
    const fx = camMode === 'scelta' ? 0 : clamp(P.root.position.x * .25, -.6, .6);
    camT.pos.set(fx + .2, 4.1 * k, 5.9 * k); camT.look.set(fx, .45, -.05); camT.sx = .5; camT.sy = .5;
  } else if (camMode === 'fissa') {
    const k = port ? 1.5 : 1;
    camT.pos.copy(camFissa.look).addScaledVector(v3.copy(camFissa.pos).sub(camFissa.look), k); camT.look.copy(camFissa.look); camT.sx = .5; camT.sy = .5;
  } else {
    P.punto('Head', testa);
    const a = P.root.rotation.y;
    const conf = {
      viso: { d: 1.6, h: .15, ang: .35, sx: .5, sy: .45, dy: -.08 },
      tablet: { d: 3.0, h: .6, ang: .6, sx: port ? .5 : .15, sy: port ? .2 : .56, dy: -.35 },
      pausa: { d: 2.9, h: .7, ang: .45, sx: port ? .5 : .32, sy: .5, dy: -.35 },
      sacco: { d: 3.4, h: .8, ang: -1.25, sx: .45, sy: .5, dy: -.45 }
    }[camMode];
    camT.look.set(testa.x, testa.y + conf.dy, testa.z);
    camT.pos.set(testa.x + Math.sin(a + conf.ang) * conf.d, testa.y + conf.h, testa.z + Math.cos(a + conf.ang) * conf.d);
    camT.sx = conf.sx; camT.sy = conf.sy;
  }
  const f = snapCam ? 1 : 1 - Math.exp(-dt * 3.2); snapCam = false;
  cam.pos.lerp(camT.pos, f); cam.look.lerp(camT.look, f); cam.sx += (camT.sx - cam.sx) * f; cam.sy += (camT.sy - cam.sy) * f;
  camera.position.copy(cam.pos);
  if (shake) { camera.position.x += (Math.random() - .5) * shake; camera.position.y += (Math.random() - .5) * shake; shake *= .88; if (shake < .005) shake = 0; }
  camera.lookAt(cam.look);
  camera.setViewOffset(W, H, W * (.5 - cam.sx), H * (.5 - cam.sy), W, H);
}

/* ------------------------------------------------------------------ punti del mondo ed etichette delle scelte
   Ogni scelta è un'etichetta appesa a un punto del mondo. Più scelte possono stare sullo stesso punto (riga 0, 1…). */
const PUNTI = {
  tablet: { obj: () => tabMesh, h: .3, rel: true, luogo: () => tabStato === 'letto' ? L.letto : L.scrivania },
  poltrona: { obj: () => room.poltrona, h: 1.05, luogo: () => L.poltrona },
  scrivania: { obj: () => room.scrivania, h: 1.3, off: [-.15, 0, .2], luogo: () => L.scrivania },
  porta: { obj: () => room.portaPivot, h: 2.25, off: [0, 0, .45], luogo: () => L.portaUscita },
  sacco: { obj: () => room.saccoPivot, h: 2.0, luogo: () => L.sacco },
  kart: { obj: () => room.kartGioco, h: .7, luogo: () => L.kart },
  io: { obj: () => P.root, h: 1.78, rel: true },
  mamma: { obj: () => mamma.root, h: 1.55, rel: true, luogo: () => LS.daMamma },
  bambini: { obj: () => sal.torre, h: 1.2, luogo: () => LS.gioco },
  portaSalone: { obj: () => sal.portaCameretta, h: 1.75, off: [.55, 0, .45], luogo: () => LS.ingresso }
};
let attivi = {}, busy = false, freeWalk = false, ultimoTocco = 0;
function setAttivi(map) {
  attivi = map; const box = $('labels');
  box.querySelectorAll('.lbl').forEach(e => e.remove());
  for (const [id, a] of Object.entries(map)) {
    a.punto = a.punto || id;
    const d = document.createElement('div'); d.className = 'lbl' + (a.hot ? ' hot' : '') + (a.riga ? ' su' : ''); d.id = 'lbl-' + id; d.textContent = a.testo; d.style.setProperty('--riga', a.riga || 0); d.style.display = 'block';
    d.addEventListener('pointerdown', e => { e.stopPropagation(); scegliOggetto(id); });
    box.appendChild(d); a.el = d;
  }
  freccia.visible = Object.values(attivi).some(a => a.freccia);
}
function evidenzia(id, hot, conFreccia = false) { const a = attivi[id]; if (!a) return; a.hot = hot; a.freccia = conFreccia; a.el.classList.toggle('hot', hot); freccia.visible = Object.values(attivi).some(x => x.freccia); }
async function scegliOggetto(id) {
  if (busy || !attivi[id]) return;
  const a = attivi[id]; busy = true; jingle.click(); audio(); ultimoTocco = Date.now();
  setAttivi({});
  const dove = a.luogo ? a.luogo() : (PUNTI[a.punto].luogo ? PUNTI[a.punto].luogo() : null);
  if (dove) await vaiA(dove);
  try { await a.azione(); } finally { busy = false; }
}

/* input: tocca il pavimento per camminare, tocca un oggetto per usarlo */
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
canvas.addEventListener('pointerdown', e => {
  audio();
  if (busy || !freeWalk) return;
  ptr.set(e.clientX / W * 2 - 1, -(e.clientY / H) * 2 + 1); ray.setFromCamera(ptr, camera);
  for (const [id, a] of Object.entries(attivi)) {
    if (Object.values(attivi).filter(x => x.punto === a.punto).length > 1) continue;   // più scelte sullo stesso oggetto: serve l'etichetta
    const o = PUNTI[a.punto].obj(); if (o && ray.intersectObject(o, true).length) { scegliOggetto(id); return; }
  }
  const hit = ray.intersectObject(MAPPA[luogo].pavimento())[0];
  if (hit) {
    const lim = MAPPA[luogo].lim; let x = clamp(hit.point.x, lim.x0, lim.x1), z = clamp(hit.point.z, lim.z0, lim.z1);
    if (dentro(x, z)) return;
    tone(380, .05, 'triangle', .04); cammina(x, z);
  }
});

/* ------------------------------------------------------------------ stato della sessione */
let S = null, forza = 1, inPartita = null, calmaDa = 70;
const setRabbia = (z, o) => Rabbia.set(z, o);
function aggiornaStats() { $('sXp').textContent = S.xp; $('sForza').textContent = forza; }
function record(tipo, extra = {}) { S.prove.push({ ora: new Date().toISOString(), tipo, ...extra }); }
const occasioni = () => S.prove.filter(t => t.tipo !== 'modello_osservato').length;

/* La rabbia cambia zona: è il gioco a raccontarlo, e la zona arancione apre l'occasione di scelta */
Rabbia.onZona = (z, prima) => {
  if (!S || !tablet.aperto || !S.ciclo || z <= prima) return;
  if (z === 2) caption(N() + ' stringe i denti e sbuffa. La rabbia sta salendo.', false);
  if (z === 3) inizioSD();
  if (z === 4) caption(N() + ' non ce la fa più!', false);
};

/* ------------------------------------------------------------------ ciclo di animazione */
const v3 = new THREE.Vector3(), v4 = new THREE.Vector3();
let last = performance.now(), tempo = 0, ultimoBattito = 0, frame = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(.05, (now - last) / 1000); last = now; tempo += dt; frame++;
  stepTweens(now);
  if (!P || !ATT) return;
  P.update(dt);
  for (const p of [mamma, papa, leo, giulia]) if (p.root.visible) p.update(dt);
  Rabbia.update(dt);
  const z = Rabbia.zona;
  // continuare a giocare oltre l'arancione porta al rosso: a quel punto Francesco esplode
  if (inPartita && inPartita.oltre && Rabbia.v >= 95 && tablet.inPartita) tablet.interrompi('esplosione');
  // tremore con la rabbia alta
  P.model.position.x = z >= 3 ? Math.sin(tempo * 47) * (z - 2) * .006 : 0;
  alone.material.opacity = z >= 3 ? .18 + Math.sin(tempo * 6) * .08 * (z - 2) : Math.max(0, alone.material.opacity - dt);
  if (S && z >= 3 && tempo - ultimoBattito > (z === 4 ? .55 : .8)) { ultimoBattito = tempo; heartbeat(); }
  // tablet in mano: segue le mani del personaggio (o la mano del genitore che lo porta via)
  if (tabStato === 'mano') {
    P.punto('LeftHand', v3); P.punto('RightHand', v4); v3.add(v4).multiplyScalar(.5);
    tabMesh.position.copy(v3); tabMesh.scale.setScalar(1.5); tabMesh.quaternion.setFromEuler(new THREE.Euler(-.95, P.root.rotation.y, 0, 'YXZ'));
    const fw = new THREE.Vector3(Math.sin(P.root.rotation.y), 0, Math.cos(P.root.rotation.y)); tabMesh.position.addScaledVector(fw, .02); tabMesh.position.y += .03;
    if (tablet.aperto) tabSchermo.material.emissiveIntensity = .7 + Math.sin(tempo * 9) * .15;
    luceTablet.intensity = tabSchermo.material.emissiveIntensity * .8;
  } else {
    if (luceTablet) luceTablet.intensity = 0;
    if (tabStato === 'genitore' && portatore) { portatore.punto('RightHand', v3); tabMesh.position.copy(v3); tabMesh.position.y -= .1; tabMesh.scale.setScalar(1.25); tabMesh.rotation.set(Math.PI / 2, portatore.root.rotation.y + Math.PI / 2, 0, 'YXZ'); }
  }
  // sacco da boxe
  if (room.saccoPivot.visible) { sacco.v += (-sacco.k * sacco.a - sacco.c * sacco.v) * dt; sacco.a += sacco.v * dt; room.saccoPivot.rotation.z = -sacco.a; room.saccoPivot.rotation.x = Math.sin(tempo * 1.3) * sacco.a * .15; }
  // freccia di aiuto
  if (freccia.visible) { const a = Object.values(attivi).find(k => k.freccia); if (a) { const I = PUNTI[a.punto]; I.obj().getWorldPosition(v3); freccia.position.set(v3.x, (I.rel ? v3.y : 0) + I.h + .45 + Math.sin(tempo * 5) * .08, v3.z + (I.off ? I.off[2] : 0)); freccia.rotation.y += dt * 2; } }
  aggiornaCamera(dt);
  // durante i giochi sul tablet la stanza si ridisegna meno spesso (risparmio della GPU del tablet)
  if (!tablet.aperto || frame % 3 === 0) renderer.render(scene, camera);
  // etichette e fumetti
  for (const a of Object.values(attivi)) {
    const I = PUNTI[a.punto]; I.obj().getWorldPosition(v3); if (I.off) v3.add(v4.set(...I.off)); v3.y = I.rel ? v3.y + I.h : I.h; v3.project(camera);
    a.el.style.left = ((v3.x + 1) / 2 * W) + 'px'; a.el.style.top = ((1 - v3.y) / 2 * H) + 'px';
  }
  aggiornaFumetti(camera, W, H);
}

/* ------------------------------------------------------------------ STORIA */
const NOME_GIOCO = { kart: 'Kart Royale', blaster: 'Blaster Arena' };

async function iniziaSessione() {
  S = { id: Date.now(), inizio: new Date().toISOString(), livello: Number(cfg().livello), aiuto: cfg().aiuto, prove: [], partite: [], giochi: [], xp: 0, cicli: 0, ritardo: null, prova: null, ciclo: null };
  forza = 1; P.root.scale.setScalar(1); P.nome = N();
  room.sacco.visible = !!cfg().saccoCalma; room.kartGioco.visible = false; room.portaPivot.rotation.y = 0;
  rompiTablet(false); posaTablet('scrivania'); schermoTablet(true); mostraStanza('cameretta');
  overlay('home', false);
  $('anger').style.display = 'block'; $('stats').style.display = 'flex'; aggiornaStats(); Rabbia.segnali = true; Rabbia.set(1, { subito: true });
  // Francesco entra dalla porta
  P.root.position.set(L.portaFuori.x, 0, L.portaFuori.z); P.root.rotation.y = -Math.PI / 2; camera_('stanza');
  busy = true;
  tone(300, .08, 'triangle', .05); await tween(v => room.portaPivot.rotation.y = v, 0, -1.3, 500);
  caption(N() + ' è appena tornato da scuola. È nella sua cameretta.');
  await P.walkTo(1.3, .55);
  tween(v => room.portaPivot.rotation.y = v, -1.3, 0, 600).then(() => tone(150, .12, 'square', .05));
  await sleep(1400);
  busy = false;
  caption('Tocca il pavimento per far camminare ' + N() + '. Poi tocca il tablet sulla scrivania.');
  objective('Prendi il tablet e gioca');
  freeWalk = true;
  setAttivi({ tablet: { testo: 'Prendi il tablet', hot: true, azione: prendiTablet } });
}

async function prendiTablet({ riprendi = false } = {}) {
  freeWalk = false; objective('');
  const daLetto = tabStato === 'letto';
  P.play('interactStanding', { once: true, speed: 1.5 });
  await sleep(450); tabStato = 'mano'; schermoTablet(true); tone(660, .08, 'triangle', .05);
  await sleep(450);
  if (!daLetto) await vaiA(L.letto); else { P.faceTo(L.letto.rot, 200); await sleep(200); }
  await siedi(L.lettoSeduto, { tablet: true });
  await giocaAlTablet(riprendi);
}

/* Le partite vere: prima facili (vince), poi la regia le rende difficili (perde).
   La rabbia si muove mentre gioca: sale un po' a ogni partita persa e reagisce a quello che succede nel gioco. */
function nuovoCiclo() {
  const lv4 = S.livello === 4;
  return { gioco: null, vittorie: S.cicli === 0 ? (lv4 ? 1 : Number(cfg().vittorie)) : 1, sconfitte: Math.max(1, Number(cfg().sconfitte) + (lv4 ? 1 : 0)), nV: 0, nP: 0, n: 0 };
}
async function giocaAlTablet(riprendi = false) {
  camera_('tablet'); tablet.apri();
  let C = S.ciclo;
  if (!riprendi || !C) {
    Rabbia.set(0);
    caption('Il tablet è acceso. Scegli a cosa gioca ' + N() + '.', false);
    C = S.ciclo = nuovoCiclo(); C.gioco = await tablet.scegliGioco();
    if (!S.giochi.includes(C.gioco)) S.giochi.push(C.gioco);
    caption(N() + ' gioca a ' + NOME_GIOCO[C.gioco] + '. Si diverte un sacco.', false);
  } else caption(Rabbia.zona >= 3 ? N() + ' riprende a giocare, ma è troppo arrabbiato per giocare bene.' : N() + ' riprende a giocare.', false);
  while (true) {
    const esito = C.nV < C.vittorie ? 'vinci' : 'perdi';
    const r = await partitaConRabbia(C, esito);
    if (r.interrotta === 'posa') return dopoPosa('durante');
    if (r.interrotta === 'esplosione') return esplosione();
    if (r.interrotta === 'modello') return modeling();
    if (r.interrotta) return;
    C.n++; S.partite.push({ ora: new Date().toISOString(), gioco: C.gioco, esito, risultato: r.punteggio });
    let b;
    if (r.vinto) {
      C.nV++; Rabbia.porta(8); chiudiProva();
      caption(['Che partita! ' + N() + ' è carichissimo.', 'Ancora una vittoria! ' + N() + ' si diverte un sacco.', 'Vince di nuovo!'][Math.min(C.nV - 1, 2)], false);
      b = await tablet.risultato({ vinto: true, titolo: r.titolo, desc: r.desc, bottoni: [{ id: 'ancora', testo: 'GIOCA ANCORA' }] });
    } else {
      C.nP++;
      const forte = Rabbia.zona >= 3;
      if (!forte) caption(N() + ' ha perso. Stringe i denti e sbuffa.', false);
      b = await tablet.risultato({ vinto: false, titolo: r.titolo, desc: r.desc + (forte ? ' Non è giusto!' : ''), kicker: C.nP > 1 ? 'HAI PERSO DI NUOVO' : 'HAI PERSO', bottoni: [{ id: 'ancora', testo: 'RIVINCITA' }] });
    }
    if (b === 'posa') return dopoPosa('dopo');
    if (b === 'modello') return modeling();
    if (S.prova) S.prova.rivincite++;
  }
}
async function partitaConRabbia(C, esito) {
  // chi continua a giocare quando è già in arancione va "oltre": la rabbia sale fino al rosso
  const n = C.sconfitte, k = C.nP, perdi = esito === 'perdi', oltre = perdi && (k >= n || Rabbia.base >= 60);
  const A = i => 18 + 56 * Math.min(i, n) / n;                 // dove arriva la rabbia dopo i sconfitte: l'ultima porta in arancione
  const da = !perdi ? 8 : Math.max(Rabbia.base, oltre ? 66 : A(k)), a = !perdi ? 8 : oltre ? 100 : Math.max(A(k + 1), da);
  Rabbia.tetto = !perdi ? 38 : oltre ? 100 : 79; Rabbia.base = da;
  inPartita = { esito, oltre, reale: false };
  const onEvento = e => {
    if (!inPartita) return;
    if (e.tipo === 'tempo') {
      if (e.stimato && inPartita.reale) return; if (!e.stimato) inPartita.reale = true;
      Rabbia.base = da + (a - da) * (oltre ? Math.min(1, e.progresso / .5) : e.progresso);
    } else if (e.tipo === 'punto') Rabbia.spinta(e.chi === 'io' ? (perdi ? -3 : -2) : (perdi ? 6 : 3));
    else if (e.tipo === 'posizione') Rabbia.spinta(e.posizione > e.prima ? (perdi ? 9 : 4) : -5);
  };
  const r = await tablet.partita(C.gioco, esito, { onEvento });
  Rabbia.tetto = 100; inPartita = null;
  if (!r.interrotta && perdi && !r.vinto) Rabbia.base = Math.max(Rabbia.base, a);
  return r;
}

/* La rabbia è entrata in zona arancione: da qui si misura quanto ci mette a posare il tablet */
function inizioSD() {
  if (S.prova && !S.prova.anticipata) return;
  S.prova = { t0: Date.now(), aiuto: null, rivincite: 0, posato: null, anticipata: false };
  caption(N() + ' sente la rabbia nel corpo: pugni stretti, faccia rossa e calda, cuore che batte forte.');
  clearTimeout(S.ritardo);
  if (S.livello === 1) S.ritardo = setTimeout(() => { if (S && S.prova && tablet.aperto) { if (tablet.inPartita) tablet.interrompi('modello'); else tablet.esciDalRisultato('modello'); } }, 4500);
  else if (S.livello === 2) S.ritardo = setTimeout(() => aiutoPosa(S.aiuto), 1800);
  else S.ritardo = setTimeout(() => aiutoPosa('parziale'), cfg().secondiAiutoRitardato * 1000);
}
function aiutoPosa(tipo) {
  if (!S || !S.prova || S.prova.posato || !tablet.aperto) return;
  S.prova.aiuto = S.prova.aiuto === 'completo' ? 'completo' : tipo;
  const b = $('posaBtn'); b.classList.add('hot'); b.classList.toggle('freccia', tipo === 'completo');
  if (tipo === 'completo') speak(N() + ' può posare il tablet e fare un\'altra cosa.');
}
function chiudiProva() { if (!S) return; clearTimeout(S.ritardo); S.prova = null; $('posaBtn').classList.remove('hot', 'freccia'); }

/* Posare il tablet: sempre possibile mentre si gioca, anche a metà partita */
$('posaBtn').onclick = () => {
  if (!S || !tablet.aperto || !S.ciclo) return;
  audio(); jingle.click();
  if (Rabbia.zona < 2 && !S.prova) { caption(N() + ' è tranquillo e si sta divertendo: continua a giocare.', false); return; }
  ultimoTocco = Date.now();
  if (tablet.inPartita) tablet.interrompi('posa'); else tablet.esciDalRisultato('posa');
};
async function dopoPosa(quando) {
  if (!S.prova) S.prova = { t0: Date.now(), aiuto: null, rivincite: 0, anticipata: true };
  const pr = S.prova; pr.posato = quando; pr.tPosa = ultimoTocco || Date.now(); pr.rabbiaPosa = Math.round(Rabbia.v); pr.partite = S.ciclo.n;
  clearTimeout(S.ritardo); $('posaBtn').classList.remove('hot', 'freccia');
  Rabbia.porta(Math.max(Rabbia.v, Rabbia.base));   // posare il tablet ferma la salita, ma la rabbia non scende da sola
  tablet.chiudi();
  await momentoScelta();
}

async function lasciaTablet() {
  await alzatiAnimato(); posaTablet('letto'); schermoTablet(false); camera_('stanza');
}

/* Il momento della scelta: il tablet è posato, la rabbia c'è ancora. Che cosa fa Francesco? */
async function momentoScelta() {
  busy = true; freeWalk = false;
  await lasciaTablet();
  await vaiA(L.centro);
  camera_('viso');
  caption(Rabbia.zona >= 3 ? N() + ' ha posato il tablet. È ancora arrabbiato: pugni stretti, faccia rossa, il cuore batte forte.' : N() + ' ha posato il tablet prima che la rabbia diventasse forte.');
  await sleep(3600);
  apriScelte();
}
function apriScelte() {
  camera_('scelta');
  caption('Cosa fa adesso ' + N() + '? Decidi tu: tocca una scelta.');
  objective('Cosa fa ' + N() + '?');
  busy = false; freeWalk = true;
  const m = {
    musica: { punto: 'poltrona', testo: 'Ascolta la musica', buona: true, azione: () => scelta('musica') },
    disegno: { punto: 'scrivania', testo: 'Disegna', buona: true, azione: () => scelta('disegno') },
    salone: { punto: 'porta', testo: 'Vai in salone', riga: 1, buona: true, luogo: () => L.porta, azione: vaiInSalone },
    porta: { punto: 'porta', testo: 'Sbatti la porta', azione: () => scelta('porta') },
    lancia: { punto: 'tablet', testo: 'Lancia il tablet', riga: 1, azione: () => scelta('tablet') },
    continua: { punto: 'tablet', testo: 'Continua a giocare', azione: continua },
    urla: { punto: 'io', testo: 'Urla', azione: () => scelta('urla') }
  };
  if (cfg().saccoCalma) m.sacco = { punto: 'sacco', testo: 'Sfogati al sacco', buona: true, azione: () => scelta('sacco') };
  setAttivi(m);
  aiutiScelta();
}
function aiutiScelta() {
  clearTimeout(S.ritardo);
  if (!S.prova) return;
  if (S.prova.aiuto) { aiutoScelta(S.prova.aiuto, false); return; }   // l'aiuto già dato resta visibile
  if (S.livello === 2) S.ritardo = setTimeout(() => aiutoScelta(S.aiuto, true), 1200);
  else if (S.livello >= 3) S.ritardo = setTimeout(() => aiutoScelta('parziale', true), cfg().secondiAiutoRitardato * 1000);
}
function aiutoScelta(tipo, voce) {
  if (!S || !S.prova || busy) return;
  S.prova.aiuto = S.prova.aiuto === 'completo' ? 'completo' : tipo;
  Object.entries(attivi).forEach(([id, a]) => { if (a.buona) evidenzia(id, true); });
  if (tipo === 'completo' && voce) speak(luogo === 'salone' ? N() + ' può parlare con la mamma o giocare con gli altri bambini.' : N() + ' può fare un\'altra cosa per calmarsi: ascoltare la musica, disegnare' + (cfg().saccoCalma ? ', sfogarsi al sacco' : '') + ' o andare in salone.');
}

/* La scelta è fatta: si registra l'occasione e arrivano le conseguenze */
async function scelta(id) {
  clearTimeout(S.ritardo); objective(''); freeWalk = false; busy = true;
  const pr = S.prova || {}; S.prova = null;
  const dati = { scelta: id, aiuto: pr.aiuto || 'nessuno', rabbia: pr.rabbiaPosa != null ? pr.rabbiaPosa : Math.round(Rabbia.v), partite: pr.partite != null ? pr.partite : (S.ciclo ? S.ciclo.n : 0), rivincite: pr.rivincite || 0, posato: pr.posato || '' };
  if (BUONE[id]) {
    record(pr.anticipata ? 'anticipata' : (dati.aiuto === 'nessuno' ? 'indipendente' : 'con_aiuto'), { ...dati, latenzaMs: pr.anticipata || !pr.t0 ? null : Math.max(0, pr.tPosa - pr.t0) });
    calmaDa = Math.max(Rabbia.v, Rabbia.base); Rabbia.porta(calmaDa);
    await BUONE[id]();
    await calmaRitrovata();
  } else {
    record('problema', { ...dati, latenzaMs: pr.t0 && !pr.anticipata ? Math.max(0, ultimoTocco - pr.t0) : null });
    await comportamentoProblema(id);
  }
}
const BUONE = { musica: () => ATT.musica(), disegno: () => ATT.disegno(), mamma: () => ATT.mamma(), costruzioni: () => ATT.costruzioni(), sacco: () => giocoSacco({ calma: true }) };

/* Livello 1: il giocatore guarda Francesco che posa il tablet da solo e va a fare un'altra cosa */
async function modeling() {
  chiudiProva(); tablet.chiudi();
  record('modello_osservato', { scelta: 'musica' });
  busy = true; freeWalk = false; setAttivi({});
  await lasciaTablet(); camera_('viso');
  caption('Guarda cosa fa ' + N() + '. Sente la rabbia nel corpo e pensa: "Poso il tablet e faccio un\'altra cosa".');
  await sleep(4600);
  camera_('stanza'); calmaDa = Math.max(Rabbia.v, Rabbia.base); Rabbia.porta(calmaDa);
  await ATT.musica();
  await calmaRitrovata();
}

/* Riprendere il tablet quando si è già arrabbiati: non è ancora un comportamento problema, ma la rabbia continua a salire */
async function continua() {
  clearTimeout(S.ritardo); objective(''); freeWalk = false; busy = true;
  if (S.prova) { S.prova.rivincite++; S.prova.posato = null; S.prova.aiuto = S.prova.aiuto || null; if (S.prova.anticipata && Rabbia.zona >= 3) { S.prova.anticipata = false; S.prova.t0 = Date.now(); } }
  await prendiTablet({ riprendi: true });
}

/* ------------------------------------------------------------------ salone */
async function cambiaStanza(dest) {
  busy = true; freeWalk = false; setAttivi({}); zittisci();
  if (dest === 'salone') {
    await vaiA(L.porta);
    tone(300, .08, 'triangle', .05); await tween(v => room.portaPivot.rotation.y = v, 0, -1.3, 420);
    P.walkTo(L.portaFuori.x, L.portaFuori.z); await sleep(350);
    await buio(true);
    P.stop(); room.portaPivot.rotation.y = 0; mostraStanza('salone');
    P.root.position.set(LS.portaFuori.x, 0, LS.portaFuori.z); P.root.rotation.y = Math.PI / 2; sal.portaCameretta.rotation.y = 1.3; camera_('salone', true);
    await buio(false);
    await P.walkTo(LS.ingresso.x + .25, LS.ingresso.z);
    tween(v => sal.portaCameretta.rotation.y = v, 1.3, 0, 500).then(() => tone(150, .1, 'square', .04));
  } else {
    await vaiA(LS.ingresso);
    tone(300, .08, 'triangle', .05); await tween(v => sal.portaCameretta.rotation.y = v, 0, 1.3, 420);
    P.walkTo(LS.portaFuori.x, LS.portaFuori.z); await sleep(350);
    await buio(true);
    P.stop(); sal.portaCameretta.rotation.y = 0; mostraStanza('cameretta');
    P.root.position.set(L.portaFuori.x, 0, L.portaFuori.z); P.root.rotation.y = -Math.PI / 2; room.portaPivot.rotation.y = -1.3; camera_('stanza', true);
    await buio(false);
    await P.walkTo(1.3, .55);
    tween(v => room.portaPivot.rotation.y = v, -1.3, 0, 500).then(() => tone(150, .1, 'square', .04));
  }
}
async function vaiInSalone() {
  clearTimeout(S.ritardo); objective('');
  await cambiaStanza('salone');
  caption('In salone ci sono la mamma, Leo e Giulia. Cosa fa ' + N() + '?');
  objective('Cosa fa ' + N() + '?');
  busy = false; freeWalk = true;
  setAttivi({
    mamma: { testo: 'Parla con la mamma', buona: true, azione: () => scelta('mamma') },
    costruzioni: { punto: 'bambini', testo: 'Gioca con Leo e Giulia', buona: true, azione: () => scelta('costruzioni') },
    torna: { punto: 'portaSalone', testo: 'Torna in cameretta', azione: async () => { clearTimeout(S.ritardo); await cambiaStanza('cameretta'); await vaiA(L.centro); apriScelte(); } }
  });
  aiutiScelta();
}

/* Conseguenza dell'attività: la calma è tornata → sollievo, forza, XP, giochi premio. Il tablet resta suo. */
async function calmaRitrovata() {
  setAttivi({}); objective(''); freeWalk = false; busy = true; zittisci();
  Rabbia.porta(10, { umore: 'calmo' });
  if (luogo === 'salone') { caption(N() + ' si sente meglio. Torna in cameretta.'); await sleep(1600); await cambiaStanza('cameretta'); await vaiA(L.centro); }
  else { camera_('stanza'); await sleep(1100); }
  Rabbia.set(0);
  S.xp += 100; forza++; aggiornaStats();
  [523, 659, 784, 1046].forEach((f, i) => tone(f, .22, 'triangle', .08, i * .12));
  toast('+100 XP · FORZA ' + forza, 2200);
  P.play('jump', { once: true, speed: 1.1 }).then(() => P.play('idle'));
  tween(v => { aura.material.opacity = v; aura.scale.setScalar(1 + v * 1.4); }, 0, .95, 600).then(() => tween(v => aura.material.opacity = v, .95, 0, 1300));
  P.root.scale.setScalar(1 + Math.min(forza - 1, 5) * .015);
  const nuovi = [room.sacco, room.kartGioco].filter(g => !g.visible);
  caption(N() + ' si sente meglio ed è più forte. ' + (nuovi.length ? 'Ha sbloccato dei giochi nella cameretta: scegline uno!' : 'Ora può scegliere un gioco.'));
  nuovi.forEach(g => { g.visible = true; const s = g.scale.x; tween(v => g.scale.setScalar(v), .01, s, 700); });
  await sleep(1200);
  busy = false; freeWalk = true;
  setAttivi({ sacco: { testo: 'Sacco da boxe', hot: true, azione: () => premio('sacco') }, kart: { testo: 'Gara di kart', hot: true, azione: () => premio('kart') } });
  objective('Scegli un gioco premio');
}

/* ------------------------------------------------------------------ comportamenti problema e conseguenze realistiche
   Niente spettacolo: un genitore arriva, parla con calma e poche parole, e il tablet viene tolto. */
async function esplosione() {
  const pr = S.prova || {}; chiudiProva();
  record('problema', { scelta: 'esplosione', aiuto: pr.aiuto || 'nessuno', rabbia: 100, partite: S.ciclo ? S.ciclo.n : 0, rivincite: pr.rivincite || 0, posato: '', latenzaMs: pr.t0 ? Date.now() - pr.t0 : null });
  tablet.chiudi();
  await comportamentoProblema('esplosione');
}
async function lanciaTablet() {
  P.faceTo(Math.PI / 2, 200); await sleep(220);
  P.play('interactStanding', { once: true, speed: 2 });
  await sleep(300);
  tabStato = 'volo'; const p0 = tabMesh.position.clone(), dir = new THREE.Vector3(Math.sin(P.root.rotation.y), 0, Math.cos(P.root.rotation.y));
  tone(120, .4, 'square', .1);
  await tween(k => { tabMesh.position.set(p0.x + dir.x * k * 1.6, p0.y + Math.sin(k * Math.PI) * .7 - k * (p0.y - .01), p0.z + dir.z * k * 1.6); tabMesh.rotation.set(k * 7, 0, k * 4); }, 0, 1, 650, t => t);
  tabMesh.rotation.set(0, 1.1, 0); tabMesh.scale.setScalar(1); tabStato = 'terra'; schermoTablet(false); rompiTablet(true);
  noise(.3, .3, 1800); shake = .12; $('flash').style.opacity = .6;
  P.play('idle');
}
async function comportamentoProblema(c) {
  setAttivi({}); busy = true; freeWalk = false; objective('');
  let chi, battute, dopo = 'Il giorno dopo';
  if (c === 'porta') {
    Rabbia.set(4); caption('');
    camera_('viso');
    await tween(v => room.portaPivot.rotation.y = v, 0, -1.25, 380);
    P.play('punch', { once: true, speed: 1.6 });
    await sleep(250);
    await tween(v => room.portaPivot.rotation.y = v, -1.25, 0, 150);
    noise(.4, .35, 600); tone(70, .35, 'square', .08); shake = .15; $('flash').style.opacity = .6;
    caption('BAM! ' + N() + ' ha sbattuto la porta.');
    P.play('idle'); await sleep(2200); $('flash').style.opacity = 0;
    camera_('stanza'); await vaiA(ATTESA);
    chi = papa; battute = [N() + ', le porte non si sbattono.', 'Per oggi il tablet lo tengo io.'];
  } else if (c === 'urla') {
    Rabbia.set(4); caption(''); camera_('viso');
    P.play('jump', { once: true, speed: 1.3 }).then(() => P.play('idle'));
    tone(620, .5, 'sawtooth', .07); tone(470, .7, 'sawtooth', .06, .2); shake = .1; $('flash').style.opacity = .5;
    await parla(P, 'AAAH! NON È GIUSTO!', { ms: 2400, voce: false });
    caption(N() + ' ha urlato fortissimo. In salone hanno sentito tutti.');
    await sleep(1800); $('flash').style.opacity = 0; camera_('stanza'); await vaiA(ATTESA);
    chi = mamma; battute = [N() + ', se urli non riesco a capirti.', 'Per oggi basta tablet. Quando sei calmo, vieni a dirmelo.'];
  } else {
    Rabbia.set(4); caption('');
    if (c === 'esplosione') { camera_('viso'); caption(N() + ' ha continuato a giocare e ha perso ancora. Non ce la fa più.'); await sleep(2200); await alzatiAnimato(); }
    else { P.play('interactStanding', { once: true, speed: 1.5 }); await sleep(450); tabStato = 'mano'; await sleep(350); camera_('viso'); }
    await lanciaTablet();
    caption('CRASH! ' + N() + ' ha lanciato il tablet. Lo schermo si è rotto.');
    await sleep(2600); $('flash').style.opacity = 0; camera_('stanza');
    chi = mamma; battute = ['Il tablet è caduto e lo schermo si è rotto.', 'Va fatto riparare. Per qualche giorno niente tablet.']; dopo = 'Qualche giorno dopo';
  }
  await visita(chi, battute);
  Rabbia.set(3);
  caption(N() + ' è ancora arrabbiato e non si sente meglio. Niente XP, niente giochi premio e niente tablet.');
  await sleep(5200);
  await saltoDiTempo(dopo);
  busy = false;
  prossimoCiclo(c === 'tablet' || c === 'esplosione' ? 'Il tablet è stato riparato. Riproviamo: quando vuoi, prendi il tablet sulla scrivania.' : 'Oggi ' + N() + ' può di nuovo usare il tablet. Riproviamo: è sulla scrivania.');
}
/* Un genitore entra in cameretta, dice due frasi con calma e porta via il tablet */
const ATTESA = { x: -.4, z: 1.0, rot: Math.PI / 2 };   // dove Francesco aspetta, fuori dal percorso del genitore
async function visita(g, battute) {
  caption(''); ospite = g; g.root.visible = true; g.stop(); g.root.position.set(L.portaFuori.x, 0, L.portaFuori.z); g.root.rotation.y = -Math.PI / 2; g.play('idle', { fade: 0 });
  tone(300, .08, 'triangle', .05); await tween(v => room.portaPivot.rotation.y = v, room.portaPivot.rotation.y, -1.3, 450);
  await g.walkTo(1.55, .6);
  // si avvicina a Francesco se è lontano
  const p = P.root.position, d = Math.hypot(p.x - 1.55, p.z - .6);
  if (d > 1.6) { const k = 1.25 / d, x = p.x + (1.55 - p.x) * k, z = p.z + (.6 - p.z) * k; if (!dentro(x, z, .12)) await cammina(x, z, { chi: g }); }
  const q = g.root.position;
  g.faceTo(Math.atan2(p.x - q.x, p.z - q.z), 250); P.faceTo(Math.atan2(q.x - p.x, q.z - p.z), 250); await sleep(350);
  for (const b of battute) await parla(g, b);
  // prende il tablet dov'è rimasto
  if (tabStato === 'terra') { await cammina(tabMesh.position.x, clamp(tabMesh.position.z + .5, -1.1, 1.8), { chi: g }); g.faceTo(Math.PI, 200); await sleep(220); g.play('interactGround', { once: true, speed: 1.4 }).then(() => g.play('idle')); }
  else { await cammina(-1.35, -.8, { chi: g }); g.faceTo(-Math.PI / 2, 200); await sleep(220); g.play('interactStanding', { once: true, speed: 1.4 }).then(() => g.play('idle')); }
  await sleep(600); tabStato = 'genitore'; portatore = g; schermoTablet(false); tone(500, .06, 'triangle', .04);
  await sleep(700);
  await cammina(1.55, .6, { chi: g }); await g.walkTo(L.portaFuori.x, L.portaFuori.z);
  g.root.visible = false; ospite = null; portatore = null; tabStato = 'via'; tabMesh.visible = false;
  await tween(v => room.portaPivot.rotation.y = v, -1.3, 0, 450); tone(150, .1, 'square', .04);
}
async function saltoDiTempo(testo) {
  await buio(true, testo); await sleep(1700);
  seduto = null; P.stop(); P.root.position.set(.3, 0, .2); P.root.rotation.y = .3; P.play('idle');
  rompiTablet(false); posaTablet('scrivania'); schermoTablet(true); tabMesh.visible = true;
  room.portaPivot.rotation.y = 0; $('flash').style.opacity = 0; Rabbia.set(1, { subito: true }); camera_('stanza', true);
  await buio(false);
}

/* ------------------------------------------------------------------ giochi premio: rinforzanti ma rilassanti, senza sconfitte */
async function premio(tipo) {
  objective(''); freeWalk = false; busy = true;
  const ultima = S.prove[S.prove.length - 1]; if (ultima) ultima.premio = tipo;
  if (tipo === 'sacco') await giocoSacco();
  else await giocoKart();
  busy = false;
  prossimoCiclo(N() + ' si è divertito. Quando vuoi, torna a giocare al tablet sul letto.');
}

const sacco = { a: 0, v: 0, k: 9, c: 1.4 };
async function giocoSacco({ calma = false } = {}) {
  await vaiA(L.sacco);
  camera_('sacco'); caption(calma ? N() + ' si sfoga al sacco: tocca PUGNO o CALCIO. Colpo dopo colpo la rabbia scende.' : 'Allenamento al sacco: tocca PUGNO o CALCIO. Più ' + N() + ' è forte, più il sacco vola!', false);
  $('saccoHud').classList.add('active');
  const T = calma ? Math.max(6, Math.round((Number(cfg().secondiAttivita) || 25) * (S.livello === 4 ? .7 : 1))) : Number(cfg().secondiPremio) || 30;
  let colpi = 0, t = T;
  $('sHits').textContent = 0; $('sTime').textContent = t; $('sPow').textContent = forza;
  let ultimo = 0;
  const colpo = async (anim) => {
    const ora = performance.now(); if (ora - ultimo < 320) return; ultimo = ora;
    P.play(anim, { once: true, speed: anim === 'punch' ? 1.7 : 1.4, fade: .08 });
    await sleep(anim === 'punch' ? 220 : 320);
    sacco.v += (anim === 'punch' ? .8 : 1.1) * (1 + forza * .15);
    colpi++; $('sHits').textContent = colpi;
    noise(.12, .4, 500); tone(110 + forza * 10, .12, 'sine', .25);
    if (!calma && colpi % 5 === 0) toast(colpi % 10 === 0 ? 'COMBO x' + colpi + '!' : 'POW!', 900);
    setTimeout(() => { if (performance.now() - ultimo > 600) P.play('idle', { fade: .2 }); }, 650);
  };
  $('bPugno').onpointerdown = e => { e.preventDefault(); colpo('punch'); };
  $('bCalcio').onpointerdown = e => { e.preventDefault(); colpo('kick'); };
  const keys = e => { if (e.key === 'j' || e.key === ' ') colpo('punch'); if (e.key === 'k') colpo('kick'); };
  addEventListener('keydown', keys);
  while (t > 0) { await sleep(1000); t--; $('sTime').textContent = t; if (calma) Rabbia.base = calmaDa + (10 - calmaDa) * clamp(Math.max(colpi / 14, 1 - t / T), 0, 1); }
  removeEventListener('keydown', keys);
  $('saccoHud').classList.remove('active');
  if (!calma) toast(colpi + ' COLPI!', 1800);
  caption(N() + ' ha messo a segno ' + colpi + ' colpi.' + (calma ? '' : ' Che allenamento!'), false);
  await sleep(1800); camera_('stanza');
}
async function giocoKart() {
  P.play('interactGround', { once: true, speed: 1.4 }).then(() => P.play('idle'));
  await sleep(700);
  tablet.apri({ schermoIntero: true });
  caption('');
  const r = await tablet.partita('kart', 'vinci');
  if (r.interrotta) return;
  S.partite.push({ ora: new Date().toISOString(), gioco: 'kart_premio', esito: 'vinci', risultato: r.punteggio });
  await tablet.risultato({ vinto: true, titolo: r.titolo, kicker: 'GARA PREMIO', desc: 'Con la calma si guida meglio.', bottoni: [{ id: 'ok', testo: 'CONTINUA' }] });
  tablet.chiudi();
}

function prossimoCiclo(msg) {
  S.cicli++; S.ciclo = null; S.prova = null;
  if (S.livello === 1 ? S.cicli >= 1 : occasioni() >= Number(cfg().prove)) { fineSessione(); return; }
  caption(msg); objective('Torna al tablet'); freeWalk = true; camera_('stanza');
  if (tabStato !== 'letto' && tabStato !== 'scrivania') posaTablet('letto');
  setAttivi({ tablet: { testo: 'Gioca al tablet', hot: true, azione: prendiTablet } });
}

function fineSessione() {
  clearTimeout(S.ritardo); setAttivi({}); freeWalk = false;
  db.sessions.push({ id: S.id, inizio: S.inizio, fine: new Date().toISOString(), livello: S.livello, aiuto: S.livello === 2 ? S.aiuto : '', gioco: S.giochi.join('+'), prove: S.prove, partite: S.partite }); save();
  caption(''); objective(''); Rabbia.segnali = false; $('signals').style.display = 'none';
  $('endLead').textContent = S.livello === 1 ? 'Hai visto come fa ' + N() + ' a calmarsi. La prossima volta decidi tu.' : N() + ' ha guadagnato ' + S.xp + ' XP e ora ha forza ' + forza + '.';
  overlay('end', true); speak('Missione completata.');
}
function home() {
  ['anger', 'stats', 'signals'].forEach(i => $(i).style.display = 'none'); caption(''); objective(''); setAttivi({}); zittisci();
  tablet.chiudi(); $('saccoHud').classList.remove('active'); $('torreHud').classList.remove('active'); $('dialogo').classList.remove('active'); overlay('breathOv', false); overlay('disegnoOv', false);
  $('posaBtn').classList.remove('hot', 'freccia'); $('fade').classList.remove('active'); $('flash').style.opacity = 0;
  $('homeTitle').textContent = 'La cameretta di ' + N();
  $('homeLead').textContent = 'Una storia da giocare. Quando arriva la rabbia, decidi tu che cosa fa ' + N() + '.';
  $('loadTitle').textContent = 'La cameretta di ' + N();
  S = null; inPartita = null; ospite = null; portatore = null; Rabbia.segnali = false; Rabbia.tetto = 100;
  seduto = null; P.stop(); P.root.position.set(.3, 0, .2); P.root.rotation.y = .3; P.play('idle'); cuffie.visible = false; bicchiere.visible = false;
  rompiTablet(false); posaTablet('scrivania'); schermoTablet(true); room.portaPivot.rotation.y = 0; mostraStanza('cameretta'); camera_('stanza');
  Rabbia.set(0, { subito: true });
  overlay('home', true);
}

/* ------------------------------------------------------------------ avvio */
$('startBtn').onclick = () => { audio(); jingle.click(); iniziaSessione(); };
$('endBtn').onclick = () => { overlay('end', false); home(); };
initTerapista({ onClose: () => { if (!S) home(); } });

requestAnimationFrame(loop);
carica().then(() => {
  overlay('loading', false); home();
  if (DEBUG) window.__app = { THREE, scene, camera, renderer, P, volto, room, sal, tablet, L, LS, tabMesh, Rabbia, ATT, debug, mamma, papa, leo, giulia, cuffie, setRabbia, siedi, alzati, cammina, vaiA, posaTablet, camera_, fissa, mostraStanza, cambiaStanza, visita, iniziaSessione, giocaAlTablet, momentoScelta, apriScelte, scelta, premio, prossimoCiclo, calmaRitrovata,
    get S() { return S; }, get attivi() { return attivi; }, get luogo() { return luogo; }, get busy() { return busy; }, get inPartita() { return inPartita; }, snap: () => snapCam = true, scegliOggetto, setTabStato: s => tabStato = s, sacco };
}).catch(e => { $('loadTitle').textContent = 'Errore di caricamento'; const d = document.createElement('p'); d.className = 'lead'; d.textContent = String(e && e.message || e); $('loading').appendChild(d); console.error(e); });

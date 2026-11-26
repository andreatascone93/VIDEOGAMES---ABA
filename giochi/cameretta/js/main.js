/* La cameretta di Francesco — gioco 3D per insegnare a fare una pausa quando arriva la rabbia.
   Contingenze (vedi docs/architettura.md e docs/principi.md):
   MO  sconfitte ripetute al tablet dopo alcune vittorie (partite vere, con esito programmato)
   SD  rabbia arancione, che sale DURANTE la partita: barra continua, segnali del corpo scritti, viso rosso e teso, battito
   R   posare il tablet (anche a metà partita) e scegliere un'altra attività: musica, disegno, parlare con la mamma,
       costruzioni con gli altri bambini
   R+  la calma torna poco a poco mentre fa l'attività → +XP, +Forza, giochi premio, e il tablet resta suo
   R-  porta sbattuta / tablet lanciato / urla / continuare fino a esplodere → arriva un genitore, niente XP, niente premi,
       il tablet viene tolto; si riparte il giorno dopo
   La casa è un solo spazio: cameretta e salone affiancati, uniti da una porta vera. Francesco può passare dall'una
   all'altro ogni volta che cammina, e i genitori arrivano dal salone camminando.
   L'episodio ha una narratrice (js/narrazione.js, testi in js/testi.js), una musica che segue la rabbia (js/musica.js)
   e un secondo filo: la scatola degli enigmi del nonno, dove si impara a chiedere aiuto invece di mollare (js/aiuto.js). */
import * as THREE from 'three';
import { db, save, cfg, N, $, sleep, clamp, tone, noise, jingle, speak, caption, detto, objective, overlay, tween, stepTweens, toast, heartbeat, audio, buio } from './core.js';
import { costruisciStanza, canvasTex, STANZA } from './stanza.js';
import { costruisciSalone, TORRE, SALONE, SALONE_X } from './salone.js';
import { Personaggio } from './personaggio.js';
import { Volto } from './volto.js';
import { Tablet } from './tablet.js';
import { Rabbia } from './rabbia.js';
import { creaPersona, togli, zittisci, aggiornaFumetti } from './persone.js';
import { creaAttivita } from './attivita.js';
import { creaAiuto } from './aiuto.js';
import { dici, zitto, caricaVoce, prepara } from './narrazione.js';
import { Musica } from './musica.js';
import { NARRA, SCRITTE, VOCI } from './testi.js';
import { SCATOLA } from './scatola.js';
import { initTerapista } from './terapista.js';
import { load } from './assets.js';
import { ambiente } from './grafica.js';

const DEBUG = new URLSearchParams(location.search).has('debug');
const INTRO = new URLSearchParams(location.search).get('intro') !== '0';   // ?intro=0 salta la presentazione (prove automatiche)

/* ------------------------------------------------------------------ scena */
const canvas = $('world');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
ambiente(renderer, scene);   // luce riflessa e taratura dei colori (grafica.js)
const camera = new THREE.PerspectiveCamera(40, 1, .05, 60);
let W = 1, H = 1;
function resize() { W = innerWidth; H = innerHeight; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

/* ------------------------------------------------------------------ caricamento */
const bar = $('bar').firstElementChild;
let room, sal, P, volto, mamma, papa, leo, giulia, ATT, AIUTO;
const tablet = new Tablet();
const tabMesh = new THREE.Group();   // il tablet nel mondo 3D
let tabSchermo, luceTablet, crepe;
const cuffie = new THREE.Group(), bicchiere = new THREE.Group();
const aura = new THREE.Mesh(new THREE.RingGeometry(.35, .6, 48), new THREE.MeshBasicMaterial({ color: 0xffc94a, transparent: true, opacity: 0, depthWrite: false }));
const alone = new THREE.Mesh(new THREE.CircleGeometry(.55, 40), new THREE.MeshBasicMaterial({ color: 0xff3b2f, transparent: true, opacity: 0, depthWrite: false }));
const freccia = new THREE.Mesh(new THREE.ConeGeometry(.12, .26, 20), new THREE.MeshStandardMaterial({ color: 0x3fcf7a, emissive: 0x3fcf7a, emissiveIntensity: .6 }));
const debug = {};
const ORIG = { cameretta: 0, salone: SALONE_X };   // dove comincia ogni stanza nel mondo: le coordinate di gioco sono locali alla stanza

async function carica() {
  const passi = [
    () => load('personaggio/francesco.glb'),
    async () => { room = await costruisciStanza(scene); },
    async () => { sal = await costruisciSalone(scene);
      // un solo sole per tutta la casa: la mappa delle ombre copre le due stanze affiancate
      const s = room.sole, cx = (STANZA.x0 + SALONE_X + SALONE.x1) / 2;
      s.position.x = cx - 1.5; s.target.position.x = cx; s.shadow.mapSize.set(4096, 2048);
      Object.assign(s.shadow.camera, { left: -6.9, right: 7.6, top: 5.4, bottom: -3.9 }); s.shadow.camera.updateProjectionMatrix(); },
    async () => { P = await Personaggio.crea({ altezza: 1.36 }); P.altezza = 1.36; scene.add(P.root); volto = await Volto.crea(P, 'casualMaleA'); Rabbia.init(volto); },
    async () => {
      mamma = await creaPersona({ nome: 'Mamma', skin: 'casualFemaleB', altezza: 1.66, capelli: 0xe2502d });
      papa = await creaPersona({ nome: 'Papà', skin: 'businessMaleA', altezza: 1.78 });
      leo = await creaPersona({ nome: 'Leo', skin: 'farmerB', altezza: 1.2 });
      giulia = await creaPersona({ nome: 'Giulia', skin: 'farmerA', altezza: 1.14, capelli: 0xa5693f });
      [mamma, papa, leo, giulia].forEach(p => metti(p, 'salone'));
      P.voce = 'f'; mamma.voce = 'mamma'; papa.voce = 'papa'; leo.voce = 'leo'; giulia.voce = 'giulia';   // ognuno parla con la sua voce
    },
    () => caricaVoce()
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
    // misure della testa disegnata (aspetto.js); senza, quelle del vecchio modello a blocchi
    const mt = P.misure || { testaY: .17, testaZ: 0, rx: .2, ry: .2, rz: .2 }, rc = mt.rx + .022;
    P.root.updateMatrixWorld(true); const t = P.punto('Head'); cuffie.position.set(t.x, t.y + mt.testaY, t.z + mt.testaZ);
    const arco = new THREE.Mesh(new THREE.TorusGeometry(rc, .016, 8, 28, Math.PI), nero); arco.scale.y = (mt.ry + .03) / rc; arco.position.z = -.01; cuffie.add(arco);
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .045, 20), rosso); p.rotation.z = Math.PI / 2; p.position.set(s * (mt.rx + .012), -mt.ry * .1, -.01); p.castShadow = true; cuffie.add(p); }
    scene.add(cuffie); P.ossa.Head.attach(cuffie); cuffie.visible = false;
    const b = new THREE.Mesh(new THREE.CylinderGeometry(.035, .028, .1, 16), new THREE.MeshStandardMaterial({ color: 0xcfe8ff, transparent: true, opacity: .75, roughness: .1 }));
    bicchiere.add(b); P.punto('RightHand', bicchiere.position); bicchiere.position.y += .04; scene.add(bicchiere); P.ossa.RightHand.attach(bicchiere); bicchiere.visible = false; }
  // posti a sedere del salone, misurati sul divano
  LS.divanoF.y = sal.sedutaDivano - .5; LS.divanoM.y = sal.sedutaDivano - .5 * mamma.altezza / 1.36;
  ATT = creaAttivita({ P, L, LS, room, sal, mamma, bimbi: [leo, giulia], cuffie, debug, vaiA, siedi, alzatiAnimato, camera_, fissa,
    breve: () => !!S && S.livello === 4, calma: k => { Rabbia.base = calmaDa + (10 - calmaDa) * clamp(k, 0, 1); }, bevi: on => { bicchiere.visible = on; sal.tazza.visible = !on; } });
  AIUTO = creaAiuto({ scene, P, mamma, papa, leo, giulia, L, LS, PUNTI, room, sal, debug, vaiA, cammina, attraversa, siedi, alzatiAnimato, camera_, fissa, arriva, rientra, esceDalloStudio, rientraNelloStudio, visita, saltoDiTempo,
    setAttivi, etichette, entrato, record, avanti: tempoLibero, luogo: () => luogo, S: () => S, giro: () => giro,
    fase: v => v === undefined ? fase : (fase = v), blocca: () => { busy = true; freeWalk = false; }, fermo: () => { busy = false; freeWalk = false; },
    punti: xp => { S.xp += xp; aggiornaStats(); }, scossa: v => { shake = Math.max(shake, v); $('flash').style.opacity = .5; setTimeout(() => { $('flash').style.opacity = 0; }, 450); } });
}

/* ------------------------------------------------------------------ luoghi */
const L = {
  scrivania: { x: 1.4, z: -.95, rot: Math.PI },
  letto: { x: -1.3, z: -1.45, rot: -Math.PI / 2 },
  poltrona: { x: -1.25, z: 1.25, rot: -Math.PI / 2 },
  portaUscita: { x: 1.7, z: .92, rot: 1.95 },
  sacco: { x: 1.32, z: 1.4, rot: Math.PI / 2 },
  kart: { x: .55, z: 1.1, rot: 0 },
  centro: { x: .2, z: .3, rot: 0 }
};
L.lettoSeduto = { x: -2.08, y: -.13, z: -1.9, rot: 0, da: L.letto };
L.poltronaSeduto = { x: -2.15, y: -.1, z: 1.25, rot: Math.PI / 2, da: L.poltrona };
const LS = {   // salone
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

/* ------------------------------------------------------------------ stanze, ostacoli e camminata
   La casa è fatta di stanze affiancate. Ogni personaggio è figlio del gruppo della stanza in cui si trova e usa le
   coordinate di quella stanza: luoghi, ostacoli e attività restano scritti "in locale" e non cambiano se la casa cresce. */
let luogo = 'cameretta';   // la stanza in cui si trova Francesco
let giro = 0;              // cambia a ogni riordino della casa: ferma i rientri dei genitori rimasti a metà
const metti = (chi, l) => { chi.stanza = l; (l === 'salone' ? sal.gruppo : scene).add(chi.root); };
const MAPPA = {
  cameretta: {
    lim: { x0: -2.35, x1: 2.35, z0: -1.2, z1: 1.95 },
    ost: () => {
      const o = [[-2.6, -2.2, -1.55, -.35], [-1.55, -2.2, -.9, -1.55], [.6, -2.2, 2.6, -1.3], [2.0, -1.25, 2.6, -.65], [-2.6, .65, -1.5, 1.85], [-2.6, .25, -2.1, .65], [-2.6, 1.8, -2.0, 2.2]];
      if (room.sacco.visible) o.push([1.68, 1.18, 2.6, 1.62]);
      if (room.kartGioco.visible) o.push([.2, 1.4, .95, 2.1]);
      const sc = AIUTO && AIUTO.ostacolo(); if (sc) o.push(sc);
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
/* Rimette la casa in ordine: Francesco nella stanza indicata, la mamma sul divano, i bambini sul tappeto, porte chiuse */
function mostraStanza(l) {
  giro++; luogo = l; metti(P, l); portatore = null;
  for (const p of [mamma, papa, leo, giulia]) metti(p, 'salone');
  sediPersona(mamma, LS.divanoM); sediPersona(leo, LS.leo); sediPersona(giulia, LS.giulia);
  mamma.root.visible = leo.root.visible = giulia.root.visible = true; papa.stop(); papa.root.visible = false;
  room.portaPivot.rotation.y = 0; sal.portaCorridoio.rotation.y = 0;
  tabMesh.visible = tabStato !== 'via';
}
function dentro(x, z, m = .18, l = luogo) { return MAPPA[l].ost().find(([a, b, c, d]) => x > a - m && x < c + m && z > b - m && z < d + m); }
function bloccato(x0, z0, x1, z1, l = luogo) {
  for (let i = 1; i <= 20; i++) { const t = i / 20; if (dentro(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, .12, l)) return true; }
  return false;
}
async function cammina(x, z, { run = false, chi = P } = {}) {
  if (chi === P) alzati();
  const l = chi === P ? luogo : chi.stanza, p = chi.root.position;
  if (bloccato(p.x, p.z, x, z, l)) {
    // passa per un punto libero intermedio
    const c0 = MAPPA[l].via[0], cand = [...MAPPA[l].via, [p.x, c0[1]], [x, c0[1]], [c0[0], z]];
    const via = cand.find(([vx, vz]) => !bloccato(p.x, p.z, vx, vz, l) && !bloccato(vx, vz, x, z, l)) || c0;
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
const camFissa = { pos: new THREE.Vector3(), look: new THREE.Vector3(), sx: .5, sy: .5, psy: null };
let camMode = 'stanza', shake = 0, snapCam = false;
const testa = new THREE.Vector3();
function camera_(mode, subito = false) { camMode = mode; if (subito) snapCam = true; }
// inquadratura fissa, in coordinate della stanza. sx, sy: dove cade sullo schermo il punto guardato (0–1); psy: lo stesso, con lo schermo in verticale
function fissa(pos, look, subito = false, { sx = .5, sy = .5, psy = null, l = luogo } = {}) { const ox = ORIG[l]; camFissa.pos.set(pos[0] + ox, pos[1], pos[2]); camFissa.look.set(look[0] + ox, look[1], look[2]); Object.assign(camFissa, { sx, sy, psy }); camera_('fissa', subito); }
function aggiornaCamera(dt) {
  const port = W / H < 1;
  if (camMode === 'stanza' || camMode === 'scelta') {
    // inquadra la stanza in cui si trova Francesco: quando passa la porta, la camera scorre da una stanza all'altra
    const inSal = luogo === 'salone', ox = ORIG[luogo];
    const k = (port ? 1.55 : Math.max(1, 1.5 / (W / H))) * (inSal ? 1.24 : camMode === 'scelta' ? 1.06 : 1);
    const px = P.root.position.x;
    let fx = camMode === 'scelta' && !inSal ? 0 : clamp(px * .25, -.6, .6);
    // vicino alla porta la camera si sposta verso l'altra stanza: si vede dove si sta andando
    if (camMode === 'stanza') fx += inSal ? -1.3 * clamp((-1.6 - px) / 1.2, 0, 1) : 1.3 * clamp((px - 1) / 1.2, 0, 1);
    camT.pos.set(ox + fx + .2, 4.1 * k, 5.9 * k); camT.look.set(ox + fx, .45, -.05); camT.sx = .5; camT.sy = .5;
  } else if (camMode === 'fissa') {
    const k = port ? 1.5 : 1;
    camT.pos.copy(camFissa.look).addScaledVector(v3.copy(camFissa.pos).sub(camFissa.look), k); camT.look.copy(camFissa.look); camT.sx = port ? .5 : camFissa.sx; camT.sy = port && camFissa.psy != null ? camFissa.psy : camFissa.sy;
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
  letto: { obj: () => room.letto, h: 1.05, luogo: () => L.letto },
  io: { obj: () => P.root, h: 1.78, rel: true },
  mamma: { obj: () => mamma.root, h: 1.55, rel: true, luogo: () => LS.daMamma },
  bambini: { obj: () => sal.torre, h: 1.2, luogo: () => LS.gioco },
  portaSalone: { obj: () => sal.portaCameretta, h: 1.75, off: [.55, 0, .45] }
};
let attivi = {}, busy = false, freeWalk = false, ultimoTocco = 0;
function setAttivi(map) {
  attivi = map; const box = $('labels');
  box.querySelectorAll('.lbl').forEach(e => e.remove());
  for (const [id, a] of Object.entries(map)) {
    a.punto = a.punto || id;
    const d = document.createElement('div'); d.className = 'lbl' + (a.hot ? ' hot' : '') + (a.riga ? ' su' : ''); d.id = 'lbl-' + id; d.textContent = a.testo; d.style.setProperty('--riga', a.riga || 0); d.style.display = 'block';
    d.addEventListener('pointerdown', e => { e.stopPropagation(); scegliOggetto(id); });
    box.appendChild(d); a.el = d; a.meta = d.offsetWidth / 2 + 8;   // metà larghezza: serve a tenere l'etichetta dentro lo schermo
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
  // il pavimento: quello della stanza in cui si trova, oppure quello dell'altra stanza (ci va passando dalla porta)
  let l = luogo, hit = ray.intersectObject(MAPPA[l].pavimento())[0];
  if (!hit) {
    l = luogo === 'cameretta' ? 'salone' : 'cameretta'; hit = ray.intersectObject(MAPPA[l].pavimento())[0];
    const muro = hit && ray.intersectObjects(MURI())[0];
    if (muro && muro.distance < hit.distance) return;   // quel punto è nascosto dalla parete: il tocco era sul muro
  }
  if (!hit) return;
  const lim = MAPPA[l].lim, x = clamp(hit.point.x - ORIG[l], lim.x0, lim.x1), z = clamp(hit.point.z, lim.z0, lim.z1);
  if (dentro(x, z, .18, l)) return;
  tone(380, .05, 'triangle', .04);
  if (l === luogo) cammina(x, z); else vaiNellAltraStanza(x, z);
});

/* ------------------------------------------------------------------ stato della sessione */
let S = null, forza = 1, inPartita = null, calmaDa = 70;
const setRabbia = (z, o) => Rabbia.set(z, o);
function aggiornaStats() { $('sXp').textContent = S.xp; $('sForza').textContent = forza; }
function record(tipo, extra = {}) { S.prove.push({ ora: new Date().toISOString(), tipo, ...extra }); }
const occasioni = () => S.prove.filter(t => !t.ambito && t.tipo !== 'modello_osservato').length;   // le occasioni del tablet (quelle della scatola hanno ambito 'aiuto')
// che cosa c'è nell'episodio, e che cosa resta da fare
const conTablet = () => cfg().percorso !== 'enigmi', conEnigmi = () => cfg().percorso !== 'tablet';
const tabletFinito = () => !conTablet() || (S.livello === 1 ? S.cicli >= 1 : occasioni() >= Number(cfg().prove));

/* La rabbia cambia zona: è il gioco a raccontarlo, e la zona arancione apre l'occasione di scelta */
Rabbia.onZona = (z, prima) => {
  if (!S || !tablet.aperto || !S.ciclo || z <= prima) return;
  if (z === 2) caption(SCRITTE.zona2(), false);
  if (z === 3) inizioSD();
  if (z === 4) caption(SCRITTE.zona4(), false);
};

/* ------------------------------------------------------------------ ciclo di animazione */
const v3 = new THREE.Vector3(), v4 = new THREE.Vector3();
let last = performance.now(), tempo = 0, ultimoBattito = 0, frame = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(.05, (now - last) / 1000); last = now; tempo += dt; frame++;
  stepTweens(now);
  if (!P || !AIUTO) return;
  P.update(dt);
  for (const p of [mamma, papa, leo, giulia]) if (p.root.visible) p.update(dt);
  AIUTO.update(dt);
  Rabbia.update(dt);
  Musica.rabbia(Rabbia.v); Musica.scena(tablet.aperto || cuffie.visible ? 0 : 1);   // la musica segue la rabbia; tace quando suona il tablet o la musica in cuffia
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
  // (restano dentro lo schermo e fuori dai riquadri in alto: la barra della rabbia con i segnali del corpo a sinistra, i punti a destra)
  const hudSx = $('anger').style.display === 'block' ? ($('signals').style.display === 'block' ? $('signals').offsetTop + $('signals').offsetHeight + 8 : 96) : 0;
  for (const a of Object.values(attivi)) {
    const I = PUNTI[a.punto]; I.obj().getWorldPosition(v3); if (I.off) v3.add(v4.set(...I.off)); v3.y = I.rel ? v3.y + I.h : I.h; v3.project(camera);
    const y = Math.max(52, (1 - v3.y) / 2 * H), su = y - 46 - (a.riga || 0) * 46;
    const x0 = su < hudSx ? Math.min(284 + a.meta, W / 2) : a.meta, x1 = su < 70 ? Math.max(W - 200 - a.meta, W / 2) : W - a.meta;
    a.el.style.left = clamp((v3.x + 1) / 2 * W, x0, x1) + 'px'; a.el.style.top = y + 'px';
  }
  aggiornaFumetti(camera, W, H);
}

/* ------------------------------------------------------------------ STORIA */
const NOME_GIOCO = { kart: 'Kart Royale', blaster: 'Blaster Arena' };

async function iniziaSessione() {
  S = { id: Date.now(), inizio: new Date().toISOString(), livello: Number(cfg().livello), aiuto: cfg().aiuto, prove: [], partite: [], giochi: [], xp: 0, cicli: 0, ritardo: null, prova: null, ciclo: null };
  forza = 1; P.root.scale.setScalar(1); P.nome = N();
  room.sacco.visible = !!cfg().saccoCalma; room.kartGioco.visible = false;
  rompiTablet(false); posaTablet('scrivania'); schermoTablet(true); mostraStanza('salone'); AIUTO.nuovaSessione();
  overlay('home', false); Musica.avvia();
  $('anger').style.display = 'block'; $('stats').style.display = 'flex'; aggiornaStats(); Rabbia.segnali = true; Rabbia.set(1, { subito: true });
  // Francesco è appena tornato da scuola: la narratrice lo presenta, poi lui attraversa il salone ed entra in cameretta
  P.stop(); P.root.position.set(-.6, 0, .2); P.root.rotation.y = -Math.PI / 2; P.play('idle'); camera_('stanza', true);
  busy = true; fase = null;
  const p = cfg().percorso in NARRA.libero() ? cfg().percorso : 'tutto', sid = S.id, viva = () => S && S.id === sid;
  // la presentazione si può saltare: il bottone ferma la voce e porta subito al gioco
  let saltata = !INTRO; const b = $('saltaBtn');
  const salto = new Promise(ok => { b.onclick = () => { saltata = true; zitto(); b.style.display = 'none'; ok(); }; });
  const dice = async (testo, ms) => { if (saltata || !viva()) return; caption(testo); await Promise.race([detto(ms), salto]); };
  if (!saltata) {
    b.style.display = 'block'; prepara([NARRA.intro1(), NARRA.intro2(), NARRA.intro3(), NARRA.intro4(), NARRA.intro5()[p], NARRA.scatolaIntro(), NARRA.libero()[p]]);
    await buio(true, SCRITTE.cartello()); await Promise.race([sleep(1900), salto]); await buio(false);
    fissa([-2.5, 1.45, 2.1], [-.6, 1.0, .2], true);                                await dice(NARRA.intro1(), 4600);
    if (!saltata) fissa([.2, 1.6, .5], [1.4, .7, -1.6], true, { l: 'cameretta' }); await dice(NARRA.intro2(), 5200);
    if (!saltata) camera_('viso', true);                                           await dice(NARRA.intro3(), 6200);
    if (!saltata) camera_('stanza');                                               await dice(NARRA.intro4(), 9500);
  }
  if (!viva()) return;
  camera_('stanza', saltata);
  if (!saltata) caption(NARRA.intro5()[p]); else caption('');
  const d5 = saltata ? null : Promise.race([detto(3200), salto]);
  await attraversa(P);
  await P.walkTo(.9, .45);
  await d5;
  if (conEnigmi() && viva()) {
    // la sorpresa: la scatola del nonno, con il suo biglietto
    await vaiA({ x: .15, z: .75, rot: Math.atan2(SCATOLA.x - .15, SCATOLA.z - .75) });
    if (!saltata) fissa([SCATOLA.x + 1.5, 1.3, SCATOLA.z + 2.1], [SCATOLA.x + .25, .25, SCATOLA.z - .1]);
    await dice(NARRA.scatolaIntro(), 9000);
  }
  if (!viva()) return;
  b.style.display = 'none'; camera_('stanza');
  await sleep(300);
  busy = false;
  testoFase = NARRA.libero()[p];
  caption(testoFase, INTRO);
  objective(obiettivoLibero());
  fase = 'inizio'; freeWalk = true; etichette();
}
const obiettivoLibero = () => !conEnigmi() || AIUTO.finita() ? (fase === 'prossimo' ? 'Torna al tablet' : 'Prendi il tablet e gioca') : tabletFinito() ? 'Apri la scatola del nonno' : 'Tablet o scatola: scegli tu';

async function prendiTablet({ riprendi = false } = {}) {
  freeWalk = false; fase = null; objective('');
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
    caption(SCRITTE.tabletAcceso(), false);
    C = S.ciclo = nuovoCiclo(); C.gioco = await tablet.scegliGioco();
    if (!S.giochi.includes(C.gioco)) S.giochi.push(C.gioco);
    caption(SCRITTE.gioca(NOME_GIOCO[C.gioco]), false);
  } else caption(SCRITTE.riprende(Rabbia.zona >= 3), false);
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
      caption(SCRITTE.vittoria(C.nV - 1), false);
      b = await tablet.risultato({ vinto: true, titolo: r.titolo, desc: r.desc, bottoni: [{ id: 'ancora', testo: 'GIOCA ANCORA' }] });
    } else {
      C.nP++;
      const forte = Rabbia.zona >= 3;
      if (!forte) caption(SCRITTE.sconfitta(), false);
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
  caption(NARRA.sd());
  clearTimeout(S.ritardo);
  if (S.livello === 1) S.ritardo = setTimeout(() => { if (S && S.prova && tablet.aperto) { if (tablet.inPartita) tablet.interrompi('modello'); else tablet.esciDalRisultato('modello'); } }, 4500);
  else if (S.livello === 2) S.ritardo = setTimeout(() => aiutoPosa(S.aiuto), 1800);
  else S.ritardo = setTimeout(() => aiutoPosa('parziale'), cfg().secondiAiutoRitardato * 1000);
}
function aiutoPosa(tipo) {
  if (!S || !S.prova || S.prova.posato || !tablet.aperto) return;
  S.prova.aiuto = S.prova.aiuto === 'completo' ? 'completo' : tipo;
  const b = $('posaBtn'); b.classList.add('hot'); b.classList.toggle('freccia', tipo === 'completo');
  if (tipo === 'completo') speak(NARRA.promptPosa(), { accoda: true });   // l'aiuto a voce aspetta che la narratrice abbia finito di descrivere i segnali del corpo
}
function chiudiProva() { if (!S) return; clearTimeout(S.ritardo); S.prova = null; $('posaBtn').classList.remove('hot', 'freccia'); }

/* Posare il tablet: sempre possibile mentre si gioca, anche a metà partita */
$('posaBtn').onclick = () => {
  if (!S || !tablet.aperto || !S.ciclo) return;
  audio(); jingle.click();
  if (Rabbia.zona < 2 && !S.prova) { caption(SCRITTE.tranquillo(), false); return; }
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
  caption(Rabbia.zona >= 3 ? NARRA.posatoArrabbiato() : NARRA.posatoPrima());
  await detto(3600);
  apriScelte();
}
function apriScelte() { fase = 'scelta'; entrato(); }
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
  if (tipo === 'completo' && voce) speak(NARRA.promptScelta()[luogo === 'salone' ? 'salone' : cfg().saccoCalma ? 'conSacco' : 'senzaSacco'], { accoda: true });
}

/* La scelta è fatta: si registra l'occasione e arrivano le conseguenze */
async function scelta(id) {
  clearTimeout(S.ritardo); objective(''); freeWalk = false; busy = true; fase = null;
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
const alPosto = async g => { if (g.rientro) { await g.rientro; g.rientro = null; } };   // chi stava tornando al suo posto dopo aver aiutato, prima ci arriva
const BUONE = { musica: () => ATT.musica(), disegno: () => ATT.disegno(), mamma: async () => { await alPosto(mamma); return ATT.mamma(); }, costruzioni: async () => { await alPosto(giulia); return ATT.costruzioni(); }, sacco: () => giocoSacco({ calma: true }) };

/* Livello 1: il giocatore guarda Francesco che posa il tablet da solo e va a fare un'altra cosa */
async function modeling() {
  chiudiProva(); tablet.chiudi();
  record('modello_osservato', { scelta: 'musica' });
  busy = true; freeWalk = false; fase = null; setAttivi({});
  await lasciaTablet(); camera_('viso');
  caption(NARRA.modello());
  await detto(4600);
  camera_('stanza'); calmaDa = Math.max(Rabbia.v, Rabbia.base); Rabbia.porta(calmaDa);
  await ATT.musica();
  await calmaRitrovata();
}

/* Riprendere il tablet quando si è già arrabbiati: non è ancora un comportamento problema, ma la rabbia continua a salire */
async function continua() {
  clearTimeout(S.ritardo); objective(''); freeWalk = false; busy = true; fase = null;
  if (S.prova) { S.prova.rivincite++; S.prova.posato = null; S.prova.aiuto = S.prova.aiuto || null; if (S.prova.anticipata && Rabbia.zona >= 3) { S.prova.anticipata = false; S.prova.t0 = Date.now(); } }
  await prendiTablet({ riprendi: true });
}

/* ------------------------------------------------------------------ la casa: da una stanza all'altra passando dalla porta
   La porta tra cameretta e salone è vera: si apre, il personaggio la attraversa camminando e sulla soglia cambia stanza
   (stesso punto del mondo, nuove coordinate locali). Vale per Francesco e per i genitori. */
const ZP = .66;   // dove si passa: tra l'anta aperta e lo stipite
const SOGLIA = {
  cameretta: { dentro: [1.65, ZP], fuori: [2.75, ZP] },
  salone: { dentro: [-2.8, .5], fuori: [2.75 - SALONE_X, ZP] }
};
const MURI = () => [...room.muroPorta, ...sal.muroPorta];
async function apriPorta() {
  const a = room.portaPivot.rotation.y; if (a < -1.25) return;
  tone(300, .08, 'triangle', .05); await tween(v => room.portaPivot.rotation.y = v, a, -1.3, 380);
}
function chiudiPorta() { const g = giro; tween(v => { if (g === giro) room.portaPivot.rotation.y = v; }, room.portaPivot.rotation.y, 0, 480).then(() => { if (g === giro) tone(150, .1, 'square', .04); }); }
async function attraversa(chi = P, { run = false, tieniAperta = false } = {}) {
  const da = chi === P ? luogo : chi.stanza, a = da === 'cameretta' ? 'salone' : 'cameretta';
  await cammina(...SOGLIA[da].dentro, { run, chi });
  await apriPorta();
  await chi.walkTo(...SOGLIA[da].fuori, { run });
  metti(chi, a); chi.root.position.set(SOGLIA[a].fuori[0], 0, SOGLIA[a].fuori[1]); if (chi === P) luogo = a;
  await chi.walkTo(...SOGLIA[a].dentro, { run });
  if (!tieniAperta) chiudiPorta();
}
/* Francesco va nell'altra stanza: lo decide il giocatore toccando la porta, l'etichetta o il pavimento di là */
async function vaiNellAltraStanza(x, z) {
  if (S) clearTimeout(S.ritardo);
  busy = true; freeWalk = false; setAttivi({}); zittisci();
  await attraversa(P);
  entrato();
  if (x != null) cammina(x, z);
}

/* Le scelte dipendono dal momento della storia (fase) e dalla stanza in cui si trova Francesco.
   La porta è sempre una scelta: la casa è sua e può girarla quando vuole. */
let fase = null, testoFase = '';   // inizio | scelta | premi | prossimo
function etichette() {
  const m = {}, sc = fase === 'scelta';
  if (luogo === 'cameretta') {
    if ((fase === 'inizio' || fase === 'prossimo') && !tabletFinito()) m.tablet = { testo: fase === 'inizio' ? 'Prendi il tablet' : 'Gioca al tablet', hot: true, azione: prendiTablet };
    // con una serratura in corso può alzarsi e andare al tablet: la serratura si considera lasciata
    if (fase === 'enigma' && !tabletFinito()) m.tablet = { testo: 'Gioca al tablet', azione: () => { AIUTO.lascia('va_al_tablet'); return prendiTablet(); } };
    // finito il tablet, se la scatola è ancora chiusa e ci ha già provato, si può chiudere l'episodio: la scatola aspetta domani
    if ((fase === 'inizio' || fase === 'prossimo') && tabletFinito() && !AIUTO.finita() && S.prove.some(t => t.ambito === 'aiuto')) m.basta = { punto: 'letto', testo: SCRITTE.basta(), azione: fineSessione };
    if (fase === 'premi') { m.sacco = { testo: 'Sacco da boxe', hot: true, azione: () => premio('sacco') }; m.kart = { testo: 'Gara di kart', hot: true, azione: () => premio('kart') }; }
    if (sc) {
      m.musica = { punto: 'poltrona', testo: 'Ascolta la musica', buona: true, azione: () => scelta('musica') };
      m.disegno = { punto: 'scrivania', testo: 'Disegna', buona: true, azione: () => scelta('disegno') };
      if (cfg().saccoCalma) m.sacco = { punto: 'sacco', testo: 'Sfogati al sacco', buona: true, azione: () => scelta('sacco') };
      m.porta = { punto: 'porta', testo: 'Sbatti la porta', azione: () => scelta('porta') };
      m.lancia = { punto: 'tablet', testo: 'Lancia il tablet', riga: 1, azione: () => scelta('tablet') };
      m.continua = { punto: 'tablet', testo: 'Continua a giocare', azione: continua };
      m.urla = { punto: 'io', testo: 'Urla', azione: () => scelta('urla') };
    }
    m.salone = { punto: 'porta', testo: 'Vai in salone', riga: sc ? 1 : 0, buona: sc, luogo: () => null, azione: () => vaiNellAltraStanza() };
  } else {
    if (sc) {
      m.mamma = { testo: 'Parla con la mamma', buona: true, azione: () => scelta('mamma') };
      m.costruzioni = { punto: 'bambini', testo: 'Gioca con Leo e Giulia', buona: true, azione: () => scelta('costruzioni') };
    } else m.mamma = { testo: 'Saluta la mamma', azione: salutaMamma };
    m.torna = { punto: 'portaSalone', testo: 'Torna in cameretta', luogo: () => null, azione: () => vaiNellAltraStanza() };
  }
  AIUTO.etichette(m, fase, luogo);   // la scatola del nonno e, con una serratura in corso, la persona a cui chiedere
  setAttivi(m);
}
/* Francesco è arrivato in una stanza, o la storia apre un momento di scelta: tornano il cammino libero e le scelte di quella stanza */
function entrato() {
  busy = false; freeWalk = true;
  const inSal = luogo === 'salone';
  if (fase === 'scelta') {
    camera_(inSal ? 'stanza' : 'scelta');
    caption(inSal ? NARRA.cosaFaSalone() : NARRA.cosaFa());
    objective(SCRITTE.obScelta());
    etichette(); aiutiScelta();
  } else {
    camera_('stanza');
    caption(inSal ? SCRITTE.salone() : fase === 'enigma' ? '' : testoFase, false);
    etichette();
  }
}
async function salutaMamma() {
  await alPosto(mamma);
  await dici(P, VOCI.f.ciaoMamma()); await dici(mamma, VOCI.mamma.ciao());
  entrato();
}

/* Conseguenza dell'attività: la calma è tornata → sollievo, forza, XP, giochi premio. Il tablet resta suo. */
async function calmaRitrovata() {
  setAttivi({}); objective(''); freeWalk = false; busy = true; fase = null; zittisci();
  Rabbia.porta(10, { umore: 'calmo' });
  if (luogo === 'salone') { caption(NARRA.meglioTorna()); await detto(1600); camera_('stanza'); await attraversa(P); await vaiA(L.centro); }
  else { camera_('stanza'); await sleep(1100); }
  Rabbia.set(0);
  S.xp += 100; forza++; aggiornaStats();
  [523, 659, 784, 1046].forEach((f, i) => tone(f, .22, 'triangle', .08, i * .12));
  toast('+100 XP · FORZA ' + forza, 2200);
  P.play('jump', { once: true, speed: 1.1 }).then(() => P.play('idle'));
  tween(v => { aura.material.opacity = v; aura.scale.setScalar(1 + v * 1.4); }, 0, .95, 600).then(() => tween(v => aura.material.opacity = v, .95, 0, 1300));
  P.root.scale.setScalar(1 + Math.min(forza - 1, 5) * .015);
  const nuovi = [room.sacco, room.kartGioco].filter(g => !g.visible);
  testoFase = NARRA.calma()[nuovi.length ? 'nuovi' : 'solito'];
  caption(testoFase);
  nuovi.forEach(g => { g.visible = true; const s = g.scale.x; tween(v => g.scale.setScalar(v), .01, s, 700); });
  await sleep(1200);
  busy = false; freeWalk = true; fase = 'premi'; etichette();
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
  setAttivi({}); busy = true; freeWalk = false; fase = null; objective('');
  let chi, battute, dopo = 'Il giorno dopo';
  if (c === 'porta') {
    Rabbia.set(4); caption('');
    fissa([-.8, 2.0, -.45], [2.2, .95, .75]);   // di tre quarti, da dentro la stanza: si vedono Francesco e la porta (un primo piano finirebbe oltre il muro)
    await tween(v => room.portaPivot.rotation.y = v, 0, -1.25, 380);
    P.play('punch', { once: true, speed: 1.6 });
    await sleep(250);
    await tween(v => room.portaPivot.rotation.y = v, -1.25, 0, 150);
    noise(.4, .35, 600); tone(70, .35, 'square', .08); shake = .15; $('flash').style.opacity = .6;
    caption(NARRA.bam());
    P.play('idle'); await detto(2200); $('flash').style.opacity = 0;
    camera_('stanza'); await vaiA(ATTESA);
    chi = papa; battute = VOCI.papa.porta();
  } else if (c === 'urla') {
    Rabbia.set(4); caption(''); camera_('viso');
    P.play('jump', { once: true, speed: 1.3 }).then(() => P.play('idle'));
    tone(620, .5, 'sawtooth', .07); tone(470, .7, 'sawtooth', .06, .2); shake = .1; $('flash').style.opacity = .5;
    await dici(P, 'AAAH! NON È GIUSTO!', { ms: 2400, voce: false });
    caption(NARRA.urlato());
    await detto(1800); $('flash').style.opacity = 0; camera_('stanza'); await vaiA(ATTESA);
    chi = mamma; battute = VOCI.mamma.urla();
  } else {
    Rabbia.set(4); caption('');
    if (c === 'esplosione') { camera_('viso'); caption(NARRA.esplode()); await detto(2200); await alzatiAnimato(); }
    else { P.play('interactStanding', { once: true, speed: 1.5 }); await sleep(450); tabStato = 'mano'; await sleep(350); camera_('viso'); }
    await lanciaTablet();
    caption(NARRA.crash());
    await detto(2600); $('flash').style.opacity = 0; camera_('stanza');
    chi = mamma; battute = VOCI.mamma.rotto(); dopo = 'Qualche giorno dopo';
  }
  await visita(chi, battute);
  Rabbia.set(3);
  caption(NARRA.dopoProblema());
  await detto(5200);
  await saltoDiTempo(dopo);
  busy = false;
  prossimoCiclo(NARRA.riprova()[c === 'tablet' || c === 'esplosione' ? 'riparato' : 'oggi']);
}
/* Un genitore arriva dal salone, entra in cameretta dalla porta, dice due frasi con calma e porta via il tablet.
   La casa reagisce davvero: la mamma si alza dal divano, il papà entra dal corridoio. */
const ATTESA = { x: -.4, z: 1.0, rot: Math.PI / 2 };   // dove Francesco aspetta, fuori dal percorso del genitore
const VIA_PAPA = [[2.6, -.38], [.3, -.6], [-.45, .15], [-2.3, .4]], CORRIDOIO = [4.0, -.38];
const VIA_GIULIA = [[2.45, -.5], [.3, -.6], [-.45, .15], [-2.3, .4]];
async function esceDalloStudio() {
  const g = papa; if (g.root.visible) return;
  g.stop(); g.root.position.set(CORRIDOIO[0], 0, CORRIDOIO[1]); g.root.rotation.y = -Math.PI / 2; g.play('idle', { fade: 0 }); g.root.visible = true;
  tone(300, .08, 'triangle', .05); await tween(v => sal.portaCorridoio.rotation.y = v, 0, -1.3, 380);
  await g.walkTo(...VIA_PAPA[0]);
  tween(v => sal.portaCorridoio.rotation.y = v, -1.3, 0, 480);
}
async function rientraNelloStudio() {
  const t = giro, ok = () => t === giro, g = papa;
  await tween(v => { if (ok()) sal.portaCorridoio.rotation.y = v; }, 0, -1.3, 380); if (!ok()) return;
  await g.walkTo(...CORRIDOIO); if (!ok()) return;
  g.root.visible = false; tween(v => { if (ok()) sal.portaCorridoio.rotation.y = v; }, -1.3, 0, 480);
}
/* Dal proprio posto fino alla porta della cameretta: il papà esce dallo studio, la mamma si alza dal divano, Giulia dal tappeto */
async function arriva(g) {
  await alPosto(g);
  if (g === papa) {
    await esceDalloStudio();
    for (const [x, z] of VIA_PAPA.slice(1)) await g.walkTo(x, z);
  } else if (g === giulia) {
    const r = g.root, y0 = r.position.y; g.play('idle', { fade: .35 });
    await tween(k => { r.position.y = y0 * (1 - k); }, 0, 1, 420);
    for (const [x, z] of VIA_GIULIA) await g.walkTo(x, z);
  } else {
    const r = g.root, p0 = r.position.clone(); g.play('idle', { fade: .35 });
    await tween(k => r.position.set(p0.x, p0.y * (1 - k), p0.z + (-1.28 - p0.z) * k), 0, 1, 450);
    await g.walkTo(-2.5, -1.28);
  }
}
/* Dopo la visita (o dopo aver aiutato) ognuno torna al suo posto, mentre la storia va avanti */
async function rientra(g) {
  const t = giro, ok = () => t === giro;
  if (g === papa) {
    for (const [x, z] of [...VIA_PAPA].reverse()) { await g.walkTo(x, z); if (!ok()) return; }
    await rientraNelloStudio(); if (!ok()) return;
  } else if (g === giulia) {
    for (const [x, z] of [...VIA_GIULIA].reverse()) { await g.walkTo(x, z); if (!ok()) return; }
    const r = g.root, p0 = r.position.clone(), d = LS.giulia; g.faceTo(d.rot, 200); g.play('sit', { fade: .4 });
    await tween(k => { if (ok()) r.position.set(p0.x + (d.x - p0.x) * k, d.y * k, p0.z + (d.z - p0.z) * k); }, 0, 1, 500);
  } else {
    await g.walkTo(-2.5, -1.28); if (!ok()) return;
    await g.walkTo(LS.divanoM.x, -1.28); if (!ok()) return;
    const r = g.root, p0 = r.position.clone(), d = LS.divanoM; g.faceTo(d.rot, 200); g.play('sit', { fade: .4 });
    await tween(k => { if (ok()) r.position.set(p0.x, d.y * k, p0.z + (d.z - p0.z) * k); }, 0, 1, 500);
  }
  if (ok() && tabStato === 'genitore') { portatore = null; tabStato = 'via'; tabMesh.visible = false; }
}
/* Un genitore viene in cameretta, dice due frasi con calma e porta via qualcosa: il tablet, oppure quello che decide `prendi` */
async function visita(g, battute, { prendi = null } = {}) {
  caption('');
  if (g.stanza !== 'cameretta') {
    // la camera si allarga sulla casa: si vede il genitore che arriva dal salone (più larga per il papà, che esce dallo studio)
    if (g === papa) fissa([4.5, 7.0, 9.6], [4.0, .4, -.3]); else fissa([3.7, 6.0, 8.2], [3.0, .5, -.3]);
    await arriva(g);
    camera_('stanza');
    await attraversa(g, { tieniAperta: true });
    await g.walkTo(1.55, .6);
  } else camera_('stanza');
  // si avvicina a Francesco se è lontano
  const p = P.root.position, o = g.root.position, d = Math.hypot(p.x - o.x, p.z - o.z);
  if (d > 1.6) { const k = 1.25 / d, x = p.x + (o.x - p.x) * k, z = p.z + (o.z - p.z) * k; if (!dentro(x, z, .12)) await cammina(x, z, { chi: g }); }
  const q = g.root.position;
  g.faceTo(Math.atan2(p.x - q.x, p.z - q.z), 250); P.faceTo(Math.atan2(q.x - p.x, q.z - p.z), 250); await sleep(350);
  for (const b of battute) await dici(g, b);
  if (prendi) await prendi(g);
  else {
    // prende il tablet dov'è rimasto
    if (tabStato === 'terra') { await cammina(tabMesh.position.x, clamp(tabMesh.position.z + .5, -1.1, 1.8), { chi: g }); g.faceTo(Math.PI, 200); await sleep(220); g.play('interactGround', { once: true, speed: 1.4 }).then(() => g.play('idle')); }
    else { await cammina(-1.35, -.8, { chi: g }); g.faceTo(-Math.PI / 2, 200); await sleep(220); g.play('interactStanding', { once: true, speed: 1.4 }).then(() => g.play('idle')); }
    await sleep(600); tabStato = 'genitore'; portatore = g; schermoTablet(false); tone(500, .06, 'triangle', .04);
    await sleep(700);
  }
  await cammina(1.55, .6, { chi: g });
  await attraversa(g);
  g.rientro = rientra(g);
}
async function saltoDiTempo(testo) {
  await buio(true, testo); await sleep(1700);
  seduto = null; P.stop(); P.root.position.set(.3, 0, .2); P.root.rotation.y = .3; P.play('idle');
  rompiTablet(false); posaTablet('scrivania'); schermoTablet(true); tabMesh.visible = true;
  mostraStanza('cameretta'); $('flash').style.opacity = 0; Rabbia.set(1, { subito: true }); camera_('stanza', true);
  await buio(false);
}

/* ------------------------------------------------------------------ giochi premio: rinforzanti ma rilassanti, senza sconfitte */
async function premio(tipo) {
  objective(''); freeWalk = false; busy = true; fase = null;
  const ultima = S.prove[S.prove.length - 1]; if (ultima) ultima.premio = tipo;
  if (tipo === 'sacco') await giocoSacco();
  else await giocoKart();
  busy = false;
  prossimoCiclo(NARRA.divertito()[conEnigmi() && !AIUTO.finita() ? 'scatola' : 'tablet']);
}

const sacco = { a: 0, v: 0, k: 9, c: 1.4 };
async function giocoSacco({ calma = false } = {}) {
  await vaiA(L.sacco);
  camera_('sacco'); caption(calma ? SCRITTE.saccoCalma() : SCRITTE.saccoPremio(), false);
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
    room.saccoColpo(anim !== 'punch', calma ? .8 : 1); shake = Math.max(shake, calma ? .025 : .05);
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
  caption(SCRITTE.colpi(colpi, calma), false);
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

/* Tra un momento e l'altro della storia Francesco è libero: gira per casa e sceglie lui se tornare al tablet o alla scatola.
   L'episodio finisce quando non resta più niente da fare: le occasioni al tablet sono state giocate e la scatola è aperta. */
function tempoLibero(testo, voce = true) {
  S.ciclo = null; S.prova = null; setAttivi({});
  if (tabletFinito() && AIUTO.finita()) { fineSessione(); return; }
  if (tabStato !== 'letto' && tabStato !== 'scrivania') posaTablet('letto');
  if (conTablet() && tabletFinito() && !S.bastaTablet) { S.bastaTablet = true; testo = NARRA.bastaTablet(); voce = true; }
  fase = 'prossimo'; testoFase = testo;
  caption(testo, voce); objective(obiettivoLibero()); camera_('stanza');
  busy = false; freeWalk = true; etichette();
}
function prossimoCiclo(testo) { S.cicli++; tempoLibero(testo); }

async function fineSessione() {
  clearTimeout(S.ritardo); setAttivi({}); freeWalk = false; busy = true; fase = null;
  const s = S, aiuti = s.prove.filter(t => t.ambito === 'aiuto');
  db.sessions.push({ id: s.id, inizio: s.inizio, fine: new Date().toISOString(), livello: s.livello, aiuto: s.livello === 2 ? s.aiuto : '', percorso: cfg().percorso, gioco: s.giochi.join('+'), prove: s.prove, partite: s.partite,
    serrature: s.scatola.serr, grazie: s.grazie || 0, scortesi: s.scortesi || 0 }); save();
  objective(''); Rabbia.segnali = false; $('signals').style.display = 'none'; camera_('stanza');
  // il saluto della narratrice: com'è andata con la rabbia, com'è andata con l'aiuto, e l'appuntamento con la prossima sfida
  const F = NARRA.fine(), frasi = [], bene = s.prove.some(t => !t.ambito && ['indipendente', 'con_aiuto', 'anticipata'].includes(t.tipo));
  if (conTablet()) frasi.push(s.livello === 1 ? F.modello : bene ? F.buona : F.difficile);
  if (conEnigmi()) frasi.push(!s.scatola.aperta ? F.scatolaAspetta : aiuti.some(t => ['indipendente', 'con_aiuto', 'anticipata', 'modello_osservato'].includes(t.tipo)) ? (conTablet() ? F.aiuto : F.aiutoSolo) : F.scatolaDaSolo);
  frasi.push(F.scuola);
  await sleep(600);
  for (const t of frasi) { if (S !== s) return; caption(t); await detto(4200); }
  if (S !== s) return;
  caption('');
  const chiusa = conEnigmi() && !s.scatola.aperta;   // la scatola è rimasta chiusa: la giornata finisce, la missione no
  $('endTitle').textContent = SCRITTE.fineTitolo(!chiusa);
  $('endLead').textContent = s.livello === 1 && !conEnigmi() ? SCRITTE.fineModello() : SCRITTE.fineXp(s.xp, forza) + (chiusa ? ' ' + SCRITTE.restano(s.scatola.serr) + '.' : '');
  overlay('end', true);
}
function home() {
  ['anger', 'stats', 'signals'].forEach(i => $(i).style.display = 'none'); caption(''); objective(''); setAttivi({}); zittisci(); zitto(); AIUTO.chiudi(); $('saltaBtn').style.display = 'none';
  tablet.chiudi(); $('saccoHud').classList.remove('active'); $('torreHud').classList.remove('active'); $('dialogo').classList.remove('active'); overlay('breathOv', false); overlay('disegnoOv', false);
  $('posaBtn').classList.remove('hot', 'freccia'); $('fade').classList.remove('active'); $('flash').style.opacity = 0;
  $('homeTitle').textContent = SCRITTE.homeTitolo(); $('homeKicker').textContent = SCRITTE.homeEpisodio(); $('endKicker').textContent = 'FINE DELL\'' + SCRITTE.homeEpisodio().split(' · ')[0];
  $('homeLead').textContent = SCRITTE.homeLead();
  $('loadTitle').textContent = SCRITTE.homeTitolo();
  S = null; fase = null; inPartita = null; portatore = null; Rabbia.segnali = false; Rabbia.tetto = 100;
  seduto = null; P.stop(); P.root.position.set(.3, 0, .2); P.root.rotation.y = .3; P.play('idle'); cuffie.visible = false; bicchiere.visible = false;
  rompiTablet(false); posaTablet('scrivania'); schermoTablet(true); mostraStanza('cameretta'); camera_('stanza', true);
  AIUTO.scatola.reset(0, conEnigmi());
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
  if (DEBUG) window.__app = { THREE, scene, camera, renderer, P, volto, room, sal, tablet, L, LS, tabMesh, Rabbia, ATT, debug, mamma, papa, leo, giulia, cuffie, setRabbia, siedi, alzati, cammina, vaiA, posaTablet, camera_, fissa, mostraStanza, attraversa, vaiNellAltraStanza, etichette, visita, arriva, rientra, ORIG, AIUTO, Musica, tempoLibero, iniziaSessione, giocaAlTablet, momentoScelta, apriScelte, scelta, premio, prossimoCiclo, calmaRitrovata,
    get S() { return S; }, get attivi() { return attivi; }, get luogo() { return luogo; }, get fase() { return fase; }, get busy() { return busy; }, get inPartita() { return inPartita; }, snap: () => snapCam = true, scegliOggetto, setTabStato: s => tabStato = s, sacco };
}).catch(e => { $('loadTitle').textContent = 'Errore di caricamento'; const d = document.createElement('p'); d.className = 'lead'; d.textContent = String(e && e.message || e); $('loading').appendChild(d); console.error(e); });

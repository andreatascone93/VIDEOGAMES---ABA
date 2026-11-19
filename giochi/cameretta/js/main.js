/* La cameretta di Francesco — gioco 3D per insegnare a fare una pausa quando arriva la rabbia.
   Contingenze (vedi docs/architettura.md e docs/principi.md):
   MO  sconfitte ripetute al tablet dopo alcune vittorie (partite vere, con esito programmato)
   SD  rabbia arancione: barra, segnali del corpo scritti, viso rosso e teso, battito del cuore
   R+  pausa nell'angolo calmo → calma, +XP, +Forza, accesso a giochi premio (sacco da boxe, gara di kart)
   R-  porta sbattuta / tablet lanciato → estinzione: niente XP, niente premi, si riprova */
import * as THREE from 'three';
import { db, save, cfg, N, $, sleep, clamp, tone, noise, jingle, speak, caption, objective, overlay, tween, stepTweens, toast, heartbeat, audio } from './core.js';
import { costruisciStanza, STANZA } from './stanza.js';
import { Personaggio } from './personaggio.js';
import { Volto } from './volto.js';
import { Tablet } from './tablet.js';
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
let room, P, volto;
const tablet = new Tablet();
const tabMesh = new THREE.Group();   // il tablet nel mondo 3D
let tabSchermo, luceTablet;
const aura = new THREE.Mesh(new THREE.RingGeometry(.35, .6, 48), new THREE.MeshBasicMaterial({ color: 0xffc94a, transparent: true, opacity: 0, depthWrite: false }));
const alone = new THREE.Mesh(new THREE.CircleGeometry(.55, 40), new THREE.MeshBasicMaterial({ color: 0xff3b2f, transparent: true, opacity: 0, depthWrite: false }));
const freccia = new THREE.Mesh(new THREE.ConeGeometry(.12, .26, 20), new THREE.MeshStandardMaterial({ color: 0x3fcf7a, emissive: 0x3fcf7a, emissiveIntensity: .6 }));

async function carica() {
  const passi = [
    () => load('personaggio/francesco.glb'),
    async () => { room = await costruisciStanza(scene); },
    async () => { P = await Personaggio.crea({ altezza: 1.36 }); scene.add(P.root); volto = await Volto.crea(P, 'casualMaleA'); }
  ];
  for (let i = 0; i < passi.length; i++) { await passi[i](); bar.style.width = ((i + 1) / passi.length * 100) + '%'; }
  // tablet 3D
  const m = (o) => new THREE.MeshStandardMaterial({ roughness: .4, ...o });
  const corpo = new THREE.Mesh(new THREE.BoxGeometry(.26, .012, .18), m({ color: 0x1d222c })); corpo.castShadow = true; tabMesh.add(corpo);
  tabSchermo = new THREE.Mesh(new THREE.PlaneGeometry(.235, .155), new THREE.MeshStandardMaterial({ color: 0x050810, emissive: 0x4a90ff, emissiveIntensity: .9, roughness: .2 }));
  tabSchermo.rotation.x = -Math.PI / 2; tabSchermo.position.y = .0065; tabMesh.add(tabSchermo);
  luceTablet = new THREE.PointLight(0x7fb0ff, 0, 1.2, 2); luceTablet.position.y = .12; tabMesh.add(luceTablet);
  scene.add(tabMesh);
  room.tablet.visible = false; // sostituito dal tablet "vivo"
  aura.rotation.x = alone.rotation.x = -Math.PI / 2; aura.position.y = .02; alone.position.y = .015; P.root.add(aura); P.root.add(alone);
  freccia.rotation.x = Math.PI; freccia.visible = false; scene.add(freccia);
}

/* ------------------------------------------------------------------ luoghi della stanza */
const L = {
  porta: { x: 2.2, z: .6, rot: -Math.PI / 2 },
  portaFuori: { x: 2.95, z: .6 },
  scrivania: { x: 1.4, z: -.95, rot: Math.PI },
  letto: { x: -1.3, z: -1.45, rot: -Math.PI / 2 },
  lettoSeduto: { x: -2.08, y: -.13, z: -1.9, rot: 0 },
  poltrona: { x: -1.25, z: 1.25, rot: -Math.PI / 2 },
  poltronaSeduto: { x: -2.15, y: -.1, z: 1.25, rot: Math.PI / 2 },
  portaUscita: { x: 1.85, z: 1.2, rot: 2.2 },
  sacco: { x: 1.32, z: .95, rot: Math.PI / 2 },
  kart: { x: .55, z: 1.1, rot: 0 },
  centro: { x: .2, z: .3 }
};
const TAB_SCRIVANIA = { p: [1.4, .615, -1.62], r: [0, .25, 0] };
const TAB_LETTO = { p: [-1.95, .47, -.85], r: [0, -.4, 0] };
let tabStato = 'scrivania'; // scrivania | mano | letto | volo | terra
function posaTablet(dove) {
  tabStato = dove; const d = dove === 'letto' ? TAB_LETTO : TAB_SCRIVANIA;
  if (dove === 'scrivania' || dove === 'letto') { tabMesh.position.set(...d.p); tabMesh.rotation.set(...d.r); tabMesh.scale.setScalar(1); }
}
function schermoTablet(on, colore = 0x4a90ff) { tabSchermo.material.emissive.set(colore); tabSchermo.material.emissiveIntensity = on ? .9 : 0; }

/* ------------------------------------------------------------------ ostacoli e camminata */
const OST = () => {
  const o = [[-2.6, -2.2, -1.55, -.35], [-1.55, -2.2, -.9, -1.55], [.6, -2.2, 2.6, -1.3], [2.0, -1.25, 2.6, -.65], [-2.6, .65, -1.5, 1.85], [-2.6, .25, -2.1, .65], [-2.6, 1.8, -2.0, 2.2]];
  if (room.sacco.visible) o.push([2.1, .6, 2.6, 1.3]);
  if (room.kartGioco.visible) o.push([.2, 1.4, .95, 2.1]);
  return o;
};
const LIM = { x0: -2.35, x1: 2.35, z0: -1.2, z1: 1.95 };
function dentro(x, z, m = .18) { return OST().find(([a, b, c, d]) => x > a - m && x < c + m && z > b - m && z < d + m); }
function bloccato(x0, z0, x1, z1) {
  for (let i = 1; i <= 20; i++) { const t = i / 20; if (dentro(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, .12)) return true; }
  return false;
}
async function cammina(x, z, { run = false } = {}) {
  alzati();
  const p = P.root.position;
  if (bloccato(p.x, p.z, x, z)) {
    // passa per un punto libero intermedio
    const cand = [[L.centro.x, L.centro.z], [p.x, L.centro.z], [x, L.centro.z], [L.centro.x, z], [.6, .9], [-1, .1]];
    const via = cand.find(([vx, vz]) => !bloccato(p.x, p.z, vx, vz) && !bloccato(vx, vz, x, z)) || [L.centro.x, L.centro.z];
    await P.walkTo(via[0], via[1], { run });
  }
  await P.walkTo(x, z, { run });
}
async function vaiA(luogo, opz) { await cammina(luogo.x, luogo.z, opz); if (luogo.rot != null) { P.faceTo(luogo.rot, 250); await sleep(260); } }

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
  const da = seduto === L.lettoSeduto ? L.letto : L.poltrona;
  seduto = null; P.root.position.set(da.x, 0, da.z); P.root.rotation.y = da.rot + Math.PI; P.play('idle', { fade: .3 });
}
async function alzatiAnimato() {
  if (!seduto) return;
  const da = seduto === L.lettoSeduto ? L.letto : L.poltrona, r = P.root;
  const x0 = r.position.x, y0 = r.position.y, z0 = r.position.z;
  P.play('idle', { fade: .4 }); seduto = null;
  await tween(k => r.position.set(x0 + (da.x - x0) * k, y0 * (1 - k) + Math.sin(k * Math.PI) * .1, z0 + (da.z - z0) * k), 0, 1, 500);
}

/* ------------------------------------------------------------------ camera */
const cam = { pos: new THREE.Vector3(.3, 3.9, 5.6), look: new THREE.Vector3(0, .6, -.2), sx: .5, sy: .5 };
const camT = { pos: cam.pos.clone(), look: cam.look.clone(), sx: .5, sy: .5 };
let camMode = 'stanza', shake = 0, snapCam = false;
const testa = new THREE.Vector3();
function camera_(mode, subito = false) { camMode = mode; if (subito) snapCam = true; }
function aggiornaCamera(dt) {
  const port = W / H < 1;
  if (camMode === 'stanza' || camMode === 'scelta') {
    const k = (port ? 1.55 : Math.max(1, 1.5 / (W / H))) * (camMode === 'scelta' ? 1.06 : 1);
    const fx = camMode === 'scelta' ? 0 : clamp(P.root.position.x * .25, -.6, .6);
    camT.pos.set(fx + .2, 4.1 * k, 5.9 * k); camT.look.set(fx, .45, -.05); camT.sx = .5; camT.sy = .5;
  } else {
    P.punto('Head', testa);
    const a = P.root.rotation.y;
    const conf = {
      viso: { d: 1.6, h: .15, ang: .35, sx: .5, sy: .45, dy: -.08 },
      tablet: { d: 3.0, h: .6, ang: .6, sx: port ? .5 : .15, sy: port ? .2 : .62, dy: -.35 },
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

/* ------------------------------------------------------------------ oggetti interattivi ed etichette */
const INTER = {
  tablet: { obj: () => tabMesh, h: .3, rel: true, luogo: () => tabStato === 'letto' ? L.letto : L.scrivania },
  calma: { obj: () => room.poltrona, h: 1.05, luogo: () => L.poltrona },
  porta: { obj: () => room.portaPivot, h: 2.25, off: [0, 0, .45], luogo: () => L.portaUscita },
  sacco: { obj: () => room.saccoPivot, h: 2.0, luogo: () => L.sacco },
  kart: { obj: () => room.kartGioco, h: .7, luogo: () => L.kart }
};
let attivi = {}, busy = false, freeWalk = false, ultimoTocco = 0;
Object.keys(INTER).forEach(id => {
  const d = document.createElement('div'); d.className = 'lbl'; d.id = 'lbl-' + id;
  d.addEventListener('pointerdown', e => { e.stopPropagation(); scegliOggetto(id); });
  $('labels').appendChild(d);
});
function setAttivi(map) {
  attivi = map;
  Object.keys(INTER).forEach(id => { const el = $('lbl-' + id), a = attivi[id]; el.style.display = a ? 'block' : 'none'; if (a) { el.textContent = a.testo; el.classList.toggle('hot', !!a.hot); } });
  freccia.visible = Object.values(attivi).some(a => a.freccia);
}
function evidenzia(id, hot, conFreccia) { if (!attivi[id]) return; attivi[id].hot = hot; attivi[id].freccia = conFreccia; $('lbl-' + id).classList.toggle('hot', hot); freccia.visible = !!conFreccia; }
async function scegliOggetto(id) {
  if (busy || !attivi[id]) return;
  const a = attivi[id]; busy = true; jingle.click(); audio(); ultimoTocco = Date.now();
  setAttivi({});
  if (!a.qui) await vaiA(INTER[id].luogo());
  try { await a.azione(); } finally { busy = false; }
}

/* input: tocca il pavimento per camminare, tocca un oggetto per usarlo */
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
canvas.addEventListener('pointerdown', e => {
  audio();
  if (busy || !freeWalk) return;
  ptr.set(e.clientX / W * 2 - 1, -(e.clientY / H) * 2 + 1); ray.setFromCamera(ptr, camera);
  for (const id of Object.keys(attivi)) { const o = INTER[id].obj(); if (o && ray.intersectObject(o, true).length) { scegliOggetto(id); return; } }
  const hit = ray.intersectObject(room.pavimento)[0];
  if (hit) {
    let x = clamp(hit.point.x, LIM.x0, LIM.x1), z = clamp(hit.point.z, LIM.z0, LIM.z1);
    if (dentro(x, z)) return;
    tone(380, .05, 'triangle', .04); cammina(x, z);
  }
});

/* ------------------------------------------------------------------ rabbia e stato emotivo */
const ZONE = [
  { nome: 'Felice', c: '#3fcf7a', umore: 'felice', rosso: 0 },
  { nome: 'Tranquillo', c: '#3fcf7a', umore: 'normale', rosso: 0 },
  { nome: 'Irritato', c: '#f5c534', umore: 'seccato', rosso: .25 },
  { nome: 'Arrabbiato', c: '#f5862a', umore: 'arrabbiato', rosso: .65 },
  { nome: 'Furioso', c: '#ef4545', umore: 'furioso', rosso: 1 }
];
const SEGNALI = { 2: ['Denti stretti', 'Sbuffa'], 3: ['Pugni stretti', 'Faccia rossa e calda', 'Cuore che batte forte'], 4: ['Urla', 'Vuole sbattere tutto'] };
let S = null, rabbia = 0;
function setRabbia(v, { umore } = {}) {
  rabbia = clamp(v, 0, 4); const z = ZONE[rabbia];
  document.querySelectorAll('#anger .seg').forEach((s, i) => { const on = i <= rabbia; s.classList.toggle('on', on); s.style.background = on ? z.c : ''; s.style.boxShadow = on && rabbia >= 3 ? '0 0 10px ' + z.c : ''; });
  $('angerState').textContent = z.nome; $('angerState').style.color = z.c; $('anger').classList.toggle('pulse', rabbia >= 3);
  volto.set(umore || z.umore, z.rosso);
  const sig = SEGNALI[rabbia], el = $('signals');
  if (sig && S) { el.innerHTML = '<div class="t">SEGNALI DEL CORPO DI ' + N().toUpperCase() + '</div>' + sig.map(x => '<div class="s"><i style="background:' + z.c + '"></i>' + x + '</div>').join(''); el.style.borderLeftColor = z.c; el.style.display = 'block'; }
  else el.style.display = 'none';
}
let forza = 1;
function aggiornaStats() { $('sXp').textContent = S.xp; $('sForza').textContent = forza; }
function record(tipo, extra = {}) { S.prove.push({ ora: new Date().toISOString(), tipo, ...extra }); }
const occasioni = () => S.prove.filter(t => t.tipo !== 'modello_osservato').length;

/* ------------------------------------------------------------------ ciclo di animazione */
const v3 = new THREE.Vector3(), v4 = new THREE.Vector3();
let last = performance.now(), tempo = 0, ultimoBattito = 0, frame = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(.05, (now - last) / 1000); last = now; tempo += dt; frame++;
  stepTweens(now);
  if (!P) return;
  P.update(dt);
  // tremore con la rabbia alta
  P.model.position.x = rabbia >= 3 && !busyTween ? Math.sin(tempo * 47) * (rabbia - 2) * .006 : 0;
  alone.material.opacity = rabbia >= 3 ? .18 + Math.sin(tempo * 6) * .08 * (rabbia - 2) : Math.max(0, alone.material.opacity - dt);
  if (S && rabbia >= 3 && tempo - ultimoBattito > (rabbia === 4 ? .55 : .8)) { ultimoBattito = tempo; heartbeat(); }
  // tablet in mano: segue le mani del personaggio
  if (tabStato === 'mano') {
    P.punto('LeftHand', v3); P.punto('RightHand', v4); v3.add(v4).multiplyScalar(.5);
    tabMesh.position.copy(v3); tabMesh.scale.setScalar(1.5); tabMesh.quaternion.setFromEuler(new THREE.Euler(-.95, P.root.rotation.y, 0, 'YXZ'));
    const fw = new THREE.Vector3(Math.sin(P.root.rotation.y), 0, Math.cos(P.root.rotation.y)); tabMesh.position.addScaledVector(fw, .02); tabMesh.position.y += .03;
    if (tablet.aperto) tabSchermo.material.emissiveIntensity = .7 + Math.sin(tempo * 9) * .15;
    luceTablet.intensity = tabSchermo.material.emissiveIntensity * .8;
  } else if (luceTablet) luceTablet.intensity = 0;
  // sacco da boxe
  if (room.saccoPivot.visible) { sacco.v += (-sacco.k * sacco.a - sacco.c * sacco.v) * dt; sacco.a += sacco.v * dt; room.saccoPivot.rotation.z = -sacco.a; room.saccoPivot.rotation.x = Math.sin(tempo * 1.3) * sacco.a * .15; }
  // freccia di aiuto
  if (freccia.visible) { const id = Object.keys(attivi).find(k => attivi[k].freccia); if (id) { INTER[id].obj().getWorldPosition(v3); freccia.position.set(v3.x, (INTER[id].rel ? v3.y : 0) + INTER[id].h + .45 + Math.sin(tempo * 5) * .08, v3.z + (INTER[id].off ? INTER[id].off[2] : 0)); freccia.rotation.y += dt * 2; } }
  aggiornaCamera(dt);
  // durante i giochi sul tablet la stanza si ridisegna meno spesso (risparmio della GPU del tablet)
  if (!tablet.aperto || frame % 3 === 0) renderer.render(scene, camera);
  // etichette
  for (const id of Object.keys(attivi)) {
    const I = INTER[id], o = I.obj(); o.getWorldPosition(v3); if (I.off) v3.add(v4.set(...I.off)); v3.y = I.rel ? v3.y + I.h : I.h; v3.project(camera);
    const el = $('lbl-' + id); el.style.left = ((v3.x + 1) / 2 * W) + 'px'; el.style.top = ((1 - v3.y) / 2 * H) + 'px';
  }
}
let busyTween = false;

/* ------------------------------------------------------------------ STORIA */
async function iniziaSessione() {
  S = { id: Date.now(), inizio: new Date().toISOString(), livello: Number(cfg().livello), aiuto: cfg().aiuto, prove: [], partite: [], giochi: [], xp: 0, cicli: 0, ritardo: null, prova: null };
  forza = 1; P.root.scale.setScalar(1);
  room.sacco.visible = room.kartGioco.visible = false; room.portaPivot.rotation.y = 0;
  posaTablet('scrivania'); schermoTablet(true);
  overlay('home', false);
  $('anger').style.display = 'block'; $('stats').style.display = 'flex'; aggiornaStats(); setRabbia(1);
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

async function prendiTablet() {
  freeWalk = false; objective('');
  const daLetto = tabStato === 'letto';
  P.play('interactStanding', { once: true, speed: 1.5 });
  await sleep(450); tabStato = 'mano'; tone(660, .08, 'triangle', .05);
  await sleep(450);
  if (!daLetto) await vaiA(L.letto); else { P.faceTo(L.letto.rot, 200); await sleep(200); }
  await siedi(L.lettoSeduto, { tablet: true });
  await giocaAlTablet();
}

/* Le partite vere: prima facili (vince), poi la regia le rende difficili (perde) */
async function giocaAlTablet() {
  camera_('tablet'); setRabbia(0);
  tablet.apri();
  caption('Il tablet è acceso. Scegli a cosa gioca ' + N() + '.', false);
  const gioco = await tablet.scegliGioco();
  if (!S.giochi.includes(gioco)) S.giochi.push(gioco);
  const nomeGioco = gioco === 'kart' ? 'Kart Royale' : 'Blaster Arena';
  const lv4 = S.livello === 4;
  const vittorie = S.cicli === 0 ? (lv4 ? 1 : Number(cfg().vittorie)) : 1;
  const sconfitte = Math.max(1, Number(cfg().sconfitte) + (lv4 ? 1 : 0));
  let nV = 0, nP = 0, n = 0;
  caption(N() + ' gioca a ' + nomeGioco + '. Si diverte un sacco.', false);
  while (true) {
    const esito = nV < vittorie ? 'vinci' : 'perdi';
    const r = await tablet.partita(gioco, esito);
    n++; S.partite.push({ ora: new Date().toISOString(), gioco, esito, risultato: r.punteggio });
    if (r.vinto) {
      nV++; setRabbia(0); caption(['Che partita! ' + N() + ' è carichissimo.', 'Ancora una vittoria! ' + N() + ' si diverte un sacco.', 'Vince di nuovo!'][Math.min(nV - 1, 2)], false);
      await tablet.risultato({ vinto: true, titolo: r.titolo, desc: r.desc, bottoni: [{ id: 'ancora', testo: 'GIOCA ANCORA' }] });
      continue;
    }
    nP++;
    if (nP >= sconfitte || n >= vittorie + sconfitte + 3) {
      setRabbia(3);
      caption('Ha perso ancora! ' + N() + ' sente la rabbia che sale forte.', false);
      await tablet.risultato({ vinto: false, titolo: r.titolo, desc: r.desc + ' Basta, non è giusto!', kicker: 'HAI PERSO DI NUOVO', attesa: 3200 });
      break;
    }
    setRabbia(2);
    caption(N() + ' ha perso. Stringe i denti e sbuffa.', false);
    const b = await tablet.risultato({ vinto: false, titolo: r.titolo, desc: r.desc, kicker: 'HAI PERSO',
      bottoni: [{ id: 'ancora', testo: 'RIVINCITA' }, { id: 'pausa', testo: 'POSA IL TABLET E FAI UNA PAUSA', cls: 'alt' }] });
    if (b === 'pausa') {
      tablet.chiudi(); record('anticipata', { scelta: 'pausa', rabbia, aiuto: 'nessuno', partite: n });
      await lasciaTablet(); await pausa(); return;
    }
  }
  tablet.chiudi();
  await momentoScelta(n);
}

async function lasciaTablet() {
  await alzatiAnimato(); posaTablet('letto'); schermoTablet(false); camera_('stanza');
}

/* Il momento della scelta: la rabbia è arancione e decide il giocatore */
async function momentoScelta(partite) {
  busy = true;
  await lasciaTablet();
  camera_('viso'); P.faceTo(Math.PI / 4, 400);
  caption(N() + ' è molto arrabbiato. Guarda i segnali: pugni stretti, faccia rossa, il cuore batte forte.');
  await sleep(4200);
  camera_('scelta');
  caption('Cosa fa adesso ' + N() + '? Decidi tu: tocca una scelta.');
  objective('Cosa fa ' + N() + '?');
  S.prova = { t0: Date.now(), aiuto: null, partite };
  busy = false; freeWalk = true;
  setAttivi({
    calma: { testo: 'Fai una pausa', azione: () => scelta('pausa') },
    porta: { testo: 'Sbatti la porta', azione: () => scelta('porta') },
    tablet: { testo: 'Continua a giocare', azione: () => scelta('tablet') }
  });
  if (S.livello === 1) { await modeling(); return; }
  if (S.livello === 2) aiuto(S.aiuto);
  if (S.livello >= 3) { clearTimeout(S.ritardo); S.ritardo = setTimeout(() => { if (S.prova && !busy) aiuto('parziale'); }, cfg().secondiAiutoRitardato * 1000); }
}
function aiuto(tipo) {
  if (!S.prova) return; S.prova.aiuto = S.prova.aiuto === 'completo' ? 'completo' : tipo;
  evidenzia('calma', true, tipo === 'completo');
  if (tipo === 'completo') speak(N() + ' può fare una pausa nell\'angolo calmo.');
}
async function modeling() {
  freeWalk = false; busy = true; setAttivi({});
  caption('Guarda cosa fa ' + N() + '. Sente la rabbia nel corpo e pensa: "Mi prendo una pausa".');
  await sleep(3800);
  record('modello_osservato'); S.prova = null;
  await vaiA(L.poltrona); busy = false;
  await pausa(true);
}
async function scelta(c) {
  clearTimeout(S.ritardo); objective(''); freeWalk = false;
  const lat = S.prova ? Math.max(0, (ultimoTocco || Date.now()) - S.prova.t0) : null, aiutoDato = S.prova && S.prova.aiuto || 'nessuno', partite = S.prova && S.prova.partite;
  S.prova = null;
  if (c === 'pausa') { record(aiutoDato === 'nessuno' ? 'indipendente' : 'con_aiuto', { scelta: 'pausa', latenzaMs: lat, aiuto: aiutoDato, rabbia, partite }); await pausa(); }
  else { record('problema', { scelta: c, latenzaMs: lat, aiuto: aiutoDato, rabbia, partite }); await comportamentoProblema(c); }
}

/* Conseguenza della pausa: calma, forza, XP e due giochi nuovi */
async function pausa(modeling = false) {
  setAttivi({}); objective(''); freeWalk = false; busy = true;
  if (P.root.position.distanceTo(v3.set(L.poltrona.x, 0, L.poltrona.z)) > .3) await vaiA(L.poltrona);
  await siedi(L.poltronaSeduto);
  camera_('pausa');
  caption(N() + ' si siede nell\'angolo calmo e respira piano.');
  await sleep(1400);
  overlay('breathOv', true);
  const n = S.livello === 4 ? Math.max(1, cfg().respiri - 1) : Number(cfg().respiri), b = $('breath'), tx = $('breathText'), cnt = $('breathCount');
  const r0 = rabbia;
  for (let i = 0; i < n; i++) {
    cnt.textContent = 'RESPIRO ' + (i + 1) + ' DI ' + n;
    tx.textContent = 'Inspira…'; b.style.transform = 'scale(1.55)'; tone(330, 2.6, 'sine', .035);
    tween(v => P.model.scale.y = P.model.scale.x * v, 1, 1.025, 2900);
    await sleep(3000);
    tx.textContent = 'Espira…'; b.style.transform = 'scale(1)'; tone(262, 2.6, 'sine', .03);
    tween(v => P.model.scale.y = P.model.scale.x * v, 1.025, 1, 2900);
    await sleep(3000);
    setRabbia(Math.max(1, Math.round(r0 - (r0 - 1) * (i + 1) / n)));
  }
  overlay('breathOv', false); tx.textContent = ''; cnt.textContent = '';
  setRabbia(1, { umore: 'calmo' }); await sleep(1200);
  await alzatiAnimato(); setRabbia(0);
  // rinforzo: XP, forza, sblocco
  S.xp += 100; forza++; aggiornaStats();
  [523, 659, 784, 1046].forEach((f, i) => tone(f, .22, 'triangle', .08, i * .12));
  toast('+100 XP · FORZA ' + forza, 2200);
  P.play('jump', { once: true, speed: 1.1 }).then(() => P.play('idle'));
  tween(v => { aura.material.opacity = v; aura.scale.setScalar(1 + v * 1.4); }, 0, .95, 600).then(() => tween(v => aura.material.opacity = v, .95, 0, 1300));
  P.root.scale.setScalar(1 + Math.min(forza - 1, 5) * .015);
  const primo = !room.sacco.visible;
  camera_('stanza');
  caption(N() + ' si sente meglio ed è più forte. ' + (primo ? 'Ha sbloccato due giochi nella cameretta: scegline uno!' : 'Ora può scegliere un gioco.'));
  if (primo) { room.sacco.visible = room.kartGioco.visible = true; [room.sacco, room.kartGioco].forEach(g => { const s = g.scale.x; tween(v => g.scale.setScalar(v), .01, s, 700); }); }
  await sleep(1200);
  busy = false; freeWalk = true;
  setAttivi({ sacco: { testo: 'Sacco da boxe', hot: true, azione: () => premio('sacco') }, kart: { testo: 'Gara di kart', hot: true, azione: () => premio('kart') } });
  objective('Scegli un gioco premio');
}

/* Conseguenza dei comportamenti problema: estinzione (nessun rinforzo), poi si riprova */
async function comportamentoProblema(c) {
  setAttivi({}); busy = true; freeWalk = false;
  if (c === 'porta') {
    setRabbia(4); caption('');
    camera_('viso');
    await tween(v => room.portaPivot.rotation.y = v, 0, -1.25, 380);
    P.play('punch', { once: true, speed: 1.6 });
    await sleep(250);
    await tween(v => room.portaPivot.rotation.y = v, -1.25, 0, 150);
    noise(.4, .35, 600); tone(70, .35, 'square', .08); shake = .15; $('flash').style.opacity = .6;
    caption('BAM! ' + N() + ' ha sbattuto la porta e ha urlato.');
  } else {
    if (tabStato === 'letto') { await vaiA(L.letto); P.play('interactStanding', { once: true, speed: 1.5 }); await sleep(450); }
    tabStato = 'mano'; schermoTablet(true);
    await siedi(L.lettoSeduto, { tablet: true });
    camera_('viso'); caption(N() + ' riprende il tablet e perde subito un\'altra partita.');
    await sleep(1800); schermoTablet(true, 0xff4040); jingle.lose();
    await sleep(1200);
    setRabbia(4);
    await alzatiAnimato();
    P.faceTo(Math.PI / 2, 200); await sleep(200);
    P.play('interactStanding', { once: true, speed: 2 });
    await sleep(300);
    tabStato = 'volo'; const p0 = tabMesh.position.clone(), dir = new THREE.Vector3(Math.sin(P.root.rotation.y), 0, Math.cos(P.root.rotation.y));
    tone(120, .4, 'square', .1);
    await tween(k => { tabMesh.position.set(p0.x + dir.x * k * 1.6, p0.y + Math.sin(k * Math.PI) * .7 - k * (p0.y - .01), p0.z + dir.z * k * 1.6); tabMesh.rotation.set(k * 7, 0, k * 4); }, 0, 1, 650, t => t);
    tabMesh.rotation.set(0, 1.1, 0); tabStato = 'terra'; schermoTablet(false);
    noise(.3, .3, 1800); shake = .12; $('flash').style.opacity = .6;
    caption('CRASH! ' + N() + ' ha lanciato il tablet. Il tablet si è spento.');
  }
  P.play('idle');
  await sleep(3600); $('flash').style.opacity = 0;
  camera_('stanza');
  setRabbia(3);
  caption(N() + ' è ancora arrabbiato e non si sente meglio. Niente XP e niente giochi premio questa volta.');
  await sleep(4600);
  if (c === 'tablet') { posaTablet('letto'); }
  setRabbia(1);
  busy = false;
  prossimoCiclo('Riproviamo. ' + N() + ' si è un po\' calmato. Quando vuoi, torna al tablet sul letto.');
}

/* Giochi premio: rinforzanti ma rilassanti, senza sconfitte */
async function premio(tipo) {
  objective(''); freeWalk = false; busy = true;
  const ultima = S.prove[S.prove.length - 1]; if (ultima) ultima.premio = tipo;
  if (tipo === 'sacco') await giocoSacco();
  else await giocoKart();
  busy = false;
  prossimoCiclo(N() + ' si è divertito. Quando vuoi, torna a giocare al tablet sul letto.');
}

const sacco = { a: 0, v: 0, k: 9, c: 1.4 };
async function giocoSacco() {
  camera_('sacco'); caption('Allenamento al sacco: tocca PUGNO o CALCIO. Più ' + N() + ' è forte, più il sacco vola!', false);
  $('saccoHud').classList.add('active');
  let colpi = 0, t = Number(cfg().secondiPremio) || 30, inCorso = false;
  $('sHits').textContent = 0; $('sTime').textContent = t; $('sPow').textContent = forza;
  let ultimo = 0;
  const colpo = async (anim) => {
    const ora = performance.now(); if (ora - ultimo < 320) return; ultimo = ora;
    P.play(anim, { once: true, speed: anim === 'punch' ? 1.7 : 1.4, fade: .08 });
    await sleep(anim === 'punch' ? 220 : 320);
    sacco.v += (anim === 'punch' ? .8 : 1.1) * (1 + forza * .15);
    colpi++; $('sHits').textContent = colpi;
    noise(.12, .4, 500); tone(110 + forza * 10, .12, 'sine', .25);
    if (colpi % 5 === 0) toast(colpi % 10 === 0 ? 'COMBO x' + colpi + '!' : 'POW!', 900);
    setTimeout(() => { if (performance.now() - ultimo > 600) P.play('idle', { fade: .2 }); }, 650);
  };
  $('bPugno').onpointerdown = e => { e.preventDefault(); colpo('punch'); };
  $('bCalcio').onpointerdown = e => { e.preventDefault(); colpo('kick'); };
  const keys = e => { if (e.key === 'j' || e.key === ' ') colpo('punch'); if (e.key === 'k') colpo('kick'); };
  addEventListener('keydown', keys);
  while (t > 0) { await sleep(1000); t--; $('sTime').textContent = t; }
  removeEventListener('keydown', keys);
  $('saccoHud').classList.remove('active');
  toast(colpi + ' COLPI!', 1800); caption(N() + ' ha messo a segno ' + colpi + ' colpi. Che allenamento!', false);
  await sleep(1800); camera_('stanza');
}
async function giocoKart() {
  P.play('interactGround', { once: true, speed: 1.4 }).then(() => P.play('idle'));
  await sleep(700);
  tablet.apri({ schermoIntero: true });
  caption('');
  const r = await tablet.partita('kart', 'vinci');
  S.partite.push({ ora: new Date().toISOString(), gioco: 'kart_premio', esito: 'vinci', risultato: r.punteggio });
  await tablet.risultato({ vinto: true, titolo: r.titolo, kicker: 'GARA PREMIO', desc: 'Con la calma si guida meglio.', bottoni: [{ id: 'ok', testo: 'CONTINUA' }] });
  tablet.chiudi();
}

function prossimoCiclo(msg) {
  S.cicli++;
  if (S.livello === 1 ? S.cicli >= 1 : occasioni() >= Number(cfg().prove)) { fineSessione(); return; }
  caption(msg); objective('Torna al tablet'); freeWalk = true;
  if (tabStato !== 'letto') posaTablet('letto');
  setAttivi({ tablet: { testo: 'Gioca al tablet', hot: true, azione: prendiTablet } });
}

function fineSessione() {
  clearTimeout(S.ritardo); setAttivi({}); freeWalk = false;
  db.sessions.push({ id: S.id, inizio: S.inizio, fine: new Date().toISOString(), livello: S.livello, aiuto: S.livello === 2 ? S.aiuto : '', gioco: S.giochi.join('+'), prove: S.prove, partite: S.partite }); save();
  caption(''); objective(''); $('signals').style.display = 'none';
  $('endLead').textContent = S.livello === 1 ? 'Hai visto come fa ' + N() + ' a calmarsi. La prossima volta decidi tu.' : N() + ' ha guadagnato ' + S.xp + ' XP e ora ha forza ' + forza + '.';
  overlay('end', true); speak('Missione completata.');
}
function home() {
  ['anger', 'stats', 'signals'].forEach(i => $(i).style.display = 'none'); caption(''); objective(''); setAttivi({});
  tablet.chiudi(); $('saccoHud').classList.remove('active'); overlay('breathOv', false);
  $('homeTitle').textContent = 'La cameretta di ' + N();
  $('homeLead').textContent = 'Una storia da giocare. Quando arriva la rabbia, decidi tu che cosa fa ' + N() + '.';
  $('loadTitle').textContent = 'La cameretta di ' + N();
  seduto = null; P.root.position.set(.3, 0, .2); P.root.rotation.y = .3; P.play('idle'); camera_('stanza');
  posaTablet('scrivania'); schermoTablet(true); room.portaPivot.rotation.y = 0;
  S = null; setRabbia(0);
  overlay('home', true);
}

/* ------------------------------------------------------------------ avvio */
$('startBtn').onclick = () => { audio(); jingle.click(); iniziaSessione(); };
$('endBtn').onclick = () => { overlay('end', false); home(); };
initTerapista({ onClose: () => { if (!S) home(); } });

requestAnimationFrame(loop);
carica().then(() => {
  overlay('loading', false); home();
  if (DEBUG) window.__app = { THREE, scene, camera, renderer, P, volto, room, tablet, L, tabMesh, setRabbia, siedi, alzati, cammina, vaiA, posaTablet, camera_, iniziaSessione, giocaAlTablet, momentoScelta, pausa, scelta, premio, prossimoCiclo, get S() { return S; }, get attivi() { return attivi; }, snap: () => snapCam = true, scegliOggetto, setTabStato: s => tabStato = s, sacco };
}).catch(e => { $('loadTitle').textContent = 'Errore di caricamento'; const d = document.createElement('p'); d.className = 'lead'; d.textContent = String(e && e.message || e); $('loading').appendChild(d); console.error(e); });

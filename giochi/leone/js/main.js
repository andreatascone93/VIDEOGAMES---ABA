/* Il leone e il caos — gioco 3D per un intervento ABA sulla richiesta di aiuto.

   Contingenza (A-B-C) di ogni enigma difficile:
   MO   enigma che da soli non si risolve (indizio coperto, pezzo avvitato) + il leone che si avvicina col passare del tempo
   SD   frustrazione in zona arancione (60 su 100) dopo almeno un tentativo sbagliato, con un aiutante in vista
   R+   chiedere aiuto a chi può darlo, in modo specifico ("mi aiuti? manca questo")  →  l'aiutante dà proprio quello che
        manca, il leone si ferma, il cancello si apre, +100 XP, l'aiutante entra nella squadra (rinforzo negativo e positivo,
        legati alla funzione: uscire dalla difficoltà)
   R-   lasciar perdere (sedersi sulla panchina), colpire il pannello, continuare a provare a caso finché il leone arriva
        →  il problema non sparisce: il leone prende lo zaino e la zona ricomincia; il pannello colpito si blocca; niente XP
   Forma della richiesta (modellamento del mand): specifica → aiuto subito; generica ("mi aiuti?") → l'aiutante chiede che
   cosa serve; pretesa ("fallo tu!") → l'aiutante aiuta ma chiede di dirlo in un altro modo, e il cancello lo apre Andrea.
   Enigmi facili: si risolvono da soli e si rinforza l'autonomia; chiedere aiuto lì non è necessario e l'aiutante incoraggia a provare. */
import * as THREE from 'three';
import { cfg, N, db, save, $, sleep, clamp, audio, tone, noise, jingle, caption, objective, toast, heartbeat, overlay, buio, tween, stepTweens } from './core.js';
import { preload } from './assets.js';
import { Personaggio } from './personaggio.js';
import { Volto } from './volto.js';
import { Frustrazione, VALORE } from './frustrazione.js';
import { creaPersona, parla, togli, zittisci, aggiornaFumetti } from './persone.js';
import { Leone } from './leone.js';
import { costruisciZoo, ZONE_Z, CANCELLO_Z, PULLMAN_Z, PANNELLO, PANCHINA, LARGO } from './zoo.js';
import { ENIGMI } from './enigmi.js';
import { initTerapista } from './terapista.js';

const DEBUG = new URLSearchParams(location.search).has('debug');
const canvas = $('world');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1, .1, 400);
let W = 1, H = 1;
function resize() { W = innerWidth; H = innerHeight; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

/* ------------------------------------------------------------------ personaggi */
const AIUTANTI = [
  { nome: 'Luca', chi: 'il tuo compagno di classe', skin: 'athleteMaleBlue', altezza: 1.4 },
  { nome: 'Bruno', chi: 'il custode dello zoo', skin: 'farmerB', altezza: 1.8 },
  { nome: 'Elena', chi: 'la maestra', skin: 'casualFemaleB', altezza: 1.68, capelli: 0x6b3a1f }
];
let zoo, P, volto, leone, zaino, freccia;
async function carica() {
  const passi = [
    async () => { zoo = await costruisciZoo(scene, renderer); },
    async () => { P = await Personaggio.crea({ altezza: 1.36 }); P.altezza = 1.36; P.nome = N(); scene.add(P.root); volto = await Volto.crea(P, 'casualMaleA'); Frustrazione.init(volto); },
    async () => { for (const a of AIUTANTI) { a.p = await creaPersona(a); a.p.root.visible = true; scene.add(a.p.root); } }
  ];
  await preload(['personaggio/francesco.glb'], k => $('bar').firstElementChild.style.width = (k * 30) + '%');
  let i = 0; for (const f of passi) { await f(); $('bar').firstElementChild.style.width = (30 + ++i / passi.length * 70) + '%'; }
  leone = new Leone(); scene.add(leone.root); leone.root.position.set(9, 0, 4);
  // zaino con il panino: sulla schiena di Andrea
  zaino = new THREE.Group();
  const z1 = new THREE.Mesh(new THREE.BoxGeometry(.32, .38, .16), new THREE.MeshStandardMaterial({ color: 0xe0483b, roughness: .7 })); z1.castShadow = true; zaino.add(z1);
  const z2 = new THREE.Mesh(new THREE.BoxGeometry(.26, .14, .06), new THREE.MeshStandardMaterial({ color: 0xb8372c })); z2.position.set(0, -.08, -.1); zaino.add(z2);
  mettiZaino();
  // freccia di aiuto (aiuto completo)
  freccia = new THREE.Mesh(new THREE.ConeGeometry(.22, .45, 4), new THREE.MeshStandardMaterial({ color: 0x3fcf7a, emissive: 0x1d7a45 }));
  freccia.rotation.x = Math.PI; freccia.visible = false; scene.add(freccia);
}
function mettiZaino() { P.root.add(zaino); zaino.position.set(0, .86, -.2); zaino.rotation.set(0, 0, 0); }

/* ------------------------------------------------------------------ stato */
let S = null, zona = 0, occ = null, enigma = null, xp = 0, squadra = [];
let liberi = false, occupato = false, pannelloAperto = false;
let richiestaInCorso = false, leoneAttivo = false, leonePausa = true, leoneT = 0, sdTimer = null, attesaFine = 0;
const T_LEONE = () => cfg().secondiLeone * (Number(cfg().livello) === 4 ? .8 : 1);
const difficile = k => k >= 3 - clamp(Number(cfg().difficili), 0, 3);
const aiutante = () => AIUTANTI[zona];
const CG = () => CANCELLO_Z[zona];

/* ------------------------------------------------------------------ etichette nel mondo
   Tutte uguali: il colore non suggerisce la risposta. "Parla con…" porta alle stesse frasi della richiesta dal pannello. */
let attivi = {};
const PUNTI = {
  pannello: { pos: () => new THREE.Vector3(PANNELLO.x, 1.95, CG() + PANNELLO.dz), luogo: () => [PANNELLO.x - .15, CG() + PANNELLO.dz + 1.05, Math.PI] },
  aiutante: { pos: () => aiutante().p.root.position.clone().setY(aiutante().altezza + .5), luogo: () => { const q = aiutante().p.root.position; return [q.x - 1.05, q.z + .4, Math.PI / 2]; } },
  panchina: { pos: () => new THREE.Vector3(PANCHINA.x, 1.3, CG() + PANCHINA.dz), luogo: () => [PANCHINA.x + .75, CG() + PANCHINA.dz, -Math.PI / 2] }
};
function etichette() {
  const m = {};
  if (liberi && !pannelloAperto) {
    m.pannello = { testo: 'Usa il pannello', azione: apriPannello };
    m.aiutante = { testo: 'Parla con ' + aiutante().nome, azione: () => chiediAiuto('vicino') };
    m.panchina = { testo: 'Siediti e lascia perdere', azione: molla };
  }
  setAttivi(m);
}
function setAttivi(map) {
  const box = $('labels'); box.querySelectorAll('.lbl').forEach(e => e.remove()); attivi = map;
  for (const [id, a] of Object.entries(map)) {
    const d = document.createElement('div'); d.className = 'lbl'; d.id = 'lbl-' + id; d.textContent = a.testo; d.style.display = 'block';
    d.addEventListener('pointerdown', e => { e.stopPropagation(); scegli(id); });
    box.appendChild(d); a.el = d; a.meta = d.offsetWidth / 2 + 8;
  }
  aggiornaAiuto();
}
async function scegli(id) {
  if (occupato || !attivi[id]) return;
  const a = attivi[id]; occupato = true; jingle.click(); audio(); setAttivi({});
  try { const [x, z, r] = PUNTI[id].luogo(); await cammina(x, z); P.faceTo(r); await a.azione(); }
  finally { occupato = false; if (liberi) etichette(); }
}
async function cammina(x, z) { const d = Math.hypot(P.root.position.x - x, P.root.position.z - z); if (d > .05) await P.walkTo(x, z, { run: d > 5 }); }

// tocco sul viale: Andrea ci va camminando, senza uscire dalla zona
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), piano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), v3 = new THREE.Vector3(), v4 = new THREE.Vector3();
canvas.addEventListener('pointerdown', e => {
  audio();
  if (!liberi || occupato || pannelloAperto) return;
  ptr.set(e.clientX / W * 2 - 1, -(e.clientY / H) * 2 + 1); ray.setFromCamera(ptr, camera);
  if (!ray.ray.intersectPlane(piano, v3)) return;
  P.walkTo(clamp(v3.x, -LARGO + .4, LARGO - .4), clamp(v3.z, CG() + 1.1, ZONE_Z[zona] + 2.5), { run: P.root.position.distanceTo(v3) > 5 });
});

/* ------------------------------------------------------------------ aiuti programmati (gerarchia e fading) */
let aiutoVisibile = null;      // null | 'parziale' | 'completo'
function aggiornaAiuto() {
  const on = !!aiutoVisibile, full = aiutoVisibile === 'completo';
  $('bAiuto').classList.toggle('hot', on); $('bAiuto').classList.toggle('freccia', full && pannelloAperto);
  if (attivi.aiutante) attivi.aiutante.el.classList.toggle('hot', on);
  freccia.visible = full && !pannelloAperto && !!attivi.aiutante;
}
function daiAiuto(tipo) {
  aiutoVisibile = tipo; occ.aiuto = occ.aiuto || tipo; aggiornaAiuto();
  if (tipo === 'completo') caption('Quando sei bloccato puoi chiedere aiuto. ' + aiutante().nome + ' è lì vicino.');
}
function inizioSD() {
  occ.sdT = performance.now(); occ.frustrazioneSD = Math.round(Frustrazione.v);
  const lv = Number(cfg().livello);
  if (lv === 1) { modeling(); return; }
  if (lv === 2) { daiAiuto(cfg().aiuto); return; }
  clearTimeout(sdTimer); sdTimer = setTimeout(() => { if (occ && !occ.chiesto && !occ.fine) daiAiuto('parziale'); }, cfg().secondiAiutoRitardato * 1000);
}

/* ------------------------------------------------------------------ sessione e zone */
function nuovaSessione() {
  S = { id: Date.now(), inizio: new Date().toISOString(), livello: Number(cfg().livello), aiuto: Number(cfg().livello) === 2 ? cfg().aiuto : '', difficili: Number(cfg().difficili), prove: [], richieste: [] };
  db.sessions.push(S); save();
}
function registra(r) { S.prove.push({ ora: new Date().toISOString(), ...r }); save(); }

async function iniziaGioco() {
  overlay('home', false); audio(); nuovaSessione(); xp = 0; squadra = []; $('sXp').textContent = 0; $('sSquadra').textContent = 0;
  $('stats').style.display = 'flex'; $('anger').style.display = 'block'; $('leoneHud').style.display = 'block';
  AIUTANTI.forEach((a, k) => { piazzaAiutante(k); });
  P.root.position.set(0, 0, 1.5); P.root.rotation.y = Math.PI; mettiZaino(); P.play('idle');
  leone.root.position.set(LARGO + 4, 0, 4); leone.root.rotation.y = -Math.PI / 2;
  Frustrazione.segnali = true; Frustrazione.porta(10, { subito: true });
  cam.modo = 'intro';
  caption('Gita allo zoo. Un temporale fa saltare la corrente e tutti i recinti si aprono.'); await sleep(3600);
  caption('Rocco, il leone, ha sentito l\'odore del panino nello zaino di ' + N() + '. E lo vuole!');
  await leone.vaiA(2.5, 6, 2.6); leone.guarda(0, 1.5); leone.ruggisci(); roar(); await sleep(2600);
  caption('Il pullman della scuola aspetta in fondo al viale. Per arrivarci bisogna aprire tre cancelli.'); await sleep(3400);
  caption('');
  iniziaZona(0);
}
function piazzaAiutante(k) {
  const a = AIUTANTI[k], p = a.p; p.stop(); p.root.visible = true; p.root.position.set(3.9, 0, CANCELLO_Z[k] + 6.8); p.root.rotation.y = -Math.PI / 2; p.play('interactStanding');
  a.inSquadra = false;
}

async function iniziaZona(k, riprova = false) {
  zona = k; liberi = false; aiutoVisibile = null; clearTimeout(sdTimer); $('pannello').classList.remove('rotto');
  if (riprova && !AIUTANTI[k].inSquadra) piazzaAiutante(k);
  if (riprova) {
    await buio(true, 'Riprova'); P.stop(); P.root.position.set(0, 0, ZONE_Z[k] - 1); P.root.rotation.y = Math.PI; mettiZaino(); P.play('idle');
    leone.root.position.set(0, 0, ZONE_Z[k] + (k ? 2.5 : 6)); cam.salta = true; Frustrazione.porta(14, { subito: true }); await buio(false);
  }
  // enigma del cancello, con l'indizio disegnato sul cartello accanto
  const dif = difficile(k);
  enigma = ENIGMI[k]({ difficile: dif, errore: erroreEnigma, risolto: enigmaRisolto });
  disegnaIndizio();
  occ = { zona: k + 1, difficile: dif, t0: performance.now(), errori: 0, peso: 0, colpi: 0, primaDiProvare: 0, chiesto: false, fine: false, aiuto: null, forma: null };
  leoneT = 0; leonePausa = false; leoneAttivo = true;
  if (k > 0 && !riprova) saltoDelLeone(k);
  objective('Apri il cancello della zona ' + (k + 1));
  liberi = true; etichette(); cam.modo = 'segui';
  if (k === 0 && !riprova) caption('Tocca il viale per camminare. Tocca il pannello del cancello per provare ad aprirlo.');
}
async function saltoDelLeone(k) {
  // Rocco resta dietro il cancello chiuso per qualche secondo, poi lo salta (goffo, ma ce la fa)
  leonePausa = true; leone.target = null; leone.onArrive = null; const z0 = CANCELLO_Z[k - 1];
  leone.root.position.set(.5, 0, z0 + 2.2); leone.guarda(0, z0 - 4);
  await sleep(3500); if (zona !== k) return;
  caption('Rocco salta il cancello!', false); tone(300, .3, 'triangle', .08);
  const x0 = leone.root.position.x;
  await tween(t => { leone.root.position.set(x0, Math.sin(t * Math.PI) * 3.4, z0 + 2.2 - t * 5); }, 0, 1, 1100);
  noise(.25, .25, 300); leone.root.position.y = 0; caption('');
  if (zona === k && !occ.fine && !occ.aiutato && !richiestaInCorso) leonePausa = false;
}

/* ------------------------------------------------------------------ il pannello */
function disegnaIndizio() {
  const t = zoo.cancelli[zona].indizio.userData.tex, c = t.image, g = c.getContext('2d');
  g.fillStyle = '#f1e6c8'; g.fillRect(0, 0, c.width, c.height); g.strokeStyle = '#7a5232'; g.lineWidth = 10; g.strokeRect(14, 14, c.width - 28, c.height - 28);
  enigma.disegnaIndizio(g, c.width, c.height); t.needsUpdate = true;
  const ov = $('pIndizio'), g2 = ov.getContext('2d'); g2.drawImage(c, 0, 0, ov.width, ov.height);
}
function apriPannello() {
  if (!enigma) return;
  pannelloAperto = true; P.faceTo(Math.PI);
  $('pTitolo').textContent = 'Cancello della zona ' + (zona + 1);
  const box = $('pEnigma'); box.innerHTML = ''; box.appendChild(enigma.el);
  $('bAiuto').textContent = 'Chiedi aiuto a ' + aiutante().nome;
  disegnaIndizio(); overlay('pannello', true); document.body.classList.add('inpannello'); etichette(); aggiornaAiuto();
}
function chiudiPannello() { pannelloAperto = false; overlay('pannello', false); document.body.classList.remove('inpannello'); aggiornaAiuto(); }
$('bAiuto').onclick = () => { if (occupato) return; jingle.click(); chiudiPannello(); chiediAiuto('pannello'); };
$('bMolla').onclick = () => { if (occupato) return; jingle.click(); chiudiPannello(); molla(); };
$('bColpisci').onclick = () => { if (occupato) return; colpisci(); };
$('bVia').onclick = () => { if (occupato) return; jingle.click(); chiudiPannello(); etichette(); };

function erroreEnigma(peso) {
  occ.errori++; occ.peso += peso;
  Frustrazione.spinta(occ.difficile ? 12 : 7);
}

/* ------------------------------------------------------------------ la richiesta di aiuto */
async function chiediAiuto(origine) {
  if (!occ || occ.fine) return;
  const A = aiutante(), lv = Number(cfg().livello); occupato = true; liberi = false; setAttivi({});
  leonePausa = true; richiestaInCorso = true; caption('');
  try {
    if (origine === 'pannello') {
      P.faceTo(Math.atan2(A.p.root.position.x - P.root.position.x, A.p.root.position.z - P.root.position.z));
      await parla(P, A.nome + '!', { ms: 900 });
      // livello 4: l'aiutante non può venire subito (tolleranza all'attesa dopo la richiesta)
      if (lv === 4 && occ.difficile) {
        await parla(A.p, 'Arrivo! Un attimo, finisco di chiudere questo recinto.', { ms: 2200 });
        const t0 = performance.now(), s = cfg().attesaAiuto; attesaFine = t0 + s * 1000;
        while (performance.now() < attesaFine) { $('attesa').textContent = A.nome + ' arriva tra ' + Math.ceil((attesaFine - performance.now()) / 1000) + '…'; $('attesa').style.display = 'block'; await sleep(200); }
        $('attesa').style.display = 'none'; occ.attesaS = s;
      }
      A.p.play('walk'); await A.p.walkTo(P.root.position.x - 1.1, P.root.position.z + .5);
      A.p.faceTo(Math.atan2(P.root.position.x - A.p.root.position.x, P.root.position.z - A.p.root.position.z));
    } else { A.p.faceTo(-Math.PI / 2 - .3); A.p.play('idle'); }
    await dialogoAiuto(origine);
  } finally {
    occupato = false; richiestaInCorso = false;
    if (!occ.fine) { if (!occ.aiutato) leonePausa = false; liberi = true; etichette(); }
  }
}
// le frasi: la stessa scelta sia chiamando dal pannello sia andando dall'aiutante
async function dialogoAiuto(origine) {
  const A = aiutante();
  const specifica = A.nome + ', mi aiuti? ' + enigma.bisogno, generica = 'Mi aiuti?', pretesa = 'Fallo tu, io non ci riesco!', niente = 'Niente, lascia stare.';
  let opz = [['s', specifica], ['g', generica], ['p', pretesa]].sort(() => Math.random() - .5);
  if (Number(cfg().livello) === 2 && aiutoVisibile === 'completo' && occ.sdT) opz = [['s', specifica], ...opz.filter(o => o[0] !== 's')];   // aiuto completo: la frase giusta per prima
  opz.push(['n', niente]);
  let scelta = await scegliFrase(opz), primaForma = { s: 'specifica', g: 'generica', p: 'pretesa', n: null }[scelta];
  if (scelta === 'n') { await parla(A.p, 'Va bene. Sono qui.', { ms: 1400 }); return; }
  // da qui è una richiesta di aiuto: si registra
  const ora = performance.now();
  S.richieste.push({ zona: zona + 1, difficile: occ.difficile, forma: primaForma, errori: occ.errori, origine });
  if (!occ.difficile) {
    await parla(P, scelta === 's' ? specifica : scelta === 'g' ? generica : pretesa, { ms: 1800 });
    await parla(A.p, 'Questo lo sai fare da solo: guarda bene il cartello. Ti guardo da qui.');
    occ.nonNecessario = (occ.nonNecessario || 0) + 1; return;
  }
  if (occ.errori === 0 && cfg().provaPrima) {
    await parla(P, scelta === 's' ? specifica : generica, { ms: 1800 });
    await parla(A.p, 'Prova prima una volta. Se non ci riesci, sono qui.'); occ.primaDiProvare++; return;
  }
  if (!occ.chiesto) {
    occ.chiesto = true; occ.forma = primaForma; occ.chiamata = origine; occ.frustrazione = Math.round(Frustrazione.v);
    occ.latenzaMs = occ.sdT ? Math.round(ora - occ.sdT) : null;
    occ.tipo = occ.errori === 0 ? 'prima_di_provare' : !occ.sdT ? 'anticipata' : occ.aiuto ? 'con_aiuto' : 'indipendente';
    clearTimeout(sdTimer); aiutoVisibile = null; aggiornaAiuto(); caption('');
  }
  // modellamento della forma: generica → che cosa ti serve? ; pretesa → dimmelo in un altro modo
  while (scelta !== 's') {
    await parla(P, scelta === 'g' ? generica : pretesa, { ms: 1600 });
    if (scelta === 'g') await parla(A.p, 'Certo! Che cosa ti serve?');
    else await parla(A.p, 'Ti aiuto volentieri, ma il cancello lo apri tu. Dimmi che cosa non va.');
    scelta = await scegliFrase([['s', specifica], scelta === 'g' ? ['p', pretesa] : ['g', generica]].sort(() => Math.random() - .5));
  }
  await parla(P, specifica);
  await aiutoDato(A);
}
function scegliFrase(opz) {
  return new Promise(ok => {
    const box = $('dialogo'); box.innerHTML = '<div class="t">COSA DICE ' + N().toUpperCase() + '?</div>';
    opz.forEach(([k, testo]) => { const b = document.createElement('button'); b.className = 'batt'; b.textContent = testo; b.dataset.k = k; b.onclick = () => { jingle.click(); box.classList.remove('active'); ok(k); }; box.appendChild(b); });
    box.classList.add('active');
  });
}
async function aiutoDato(A) {
  occ.aiutato = true; leonePausa = true;
  await parla(A.p, 'Certo, ci penso io a questo pezzo.', { ms: 1600 });
  // l'aiutante va al pannello e dà proprio quello che manca, poi lascia fare ad Andrea
  await A.p.walkTo(PANNELLO.x + 1.0, CG() + PANNELLO.dz + .9); A.p.faceTo(Math.PI); await A.p.play('interactStanding', { once: true });
  enigma.sblocca(); disegnaIndizio(); tone(880, .12, 'triangle', .08);
  await parla(A.p, enigma.rivela);
  A.p.play('idle');
  Frustrazione.porta(VALORE[1]); Frustrazione.tetto = 100;
  await cammina(...PUNTI.pannello.luogo().slice(0, 2)); P.faceTo(Math.PI);
  apriPannello();
}

/* ------------------------------------------------------------------ esiti */
async function enigmaRisolto() {
  if (occ.fine) return;
  occ.fine = true; leoneAttivo = false; liberi = false; chiudiPannello(); setAttivi({}); clearTimeout(sdTimer); aiutoVisibile = null; aggiornaAiuto();
  const A = aiutante(), k = zona, tempoS = Math.round((performance.now() - occ.t0) / 1000);
  if (occ.difficile) registra({ zona: k + 1, difficile: true, tipo: occ.tipo || (Number(cfg().livello) === 1 ? 'modello_osservato' : 'da_solo'), forma: occ.forma, aiuto: occ.aiuto, chiamata: occ.chiamata, latenzaMs: occ.latenzaMs ?? null, frustrazione: occ.frustrazione ?? occ.frustrazioneSD ?? null, errori: occ.errori, colpi: occ.colpi, primaDiProvare: occ.primaDiProvare, attesaS: occ.attesaS || 0, esito: 'aperto', tempoS });
  else registra({ zona: k + 1, difficile: false, tipo: 'da_solo', errori: occ.errori, colpi: occ.colpi, nonNecessario: occ.nonNecessario || 0, esito: 'aperto', tempoS });
  Frustrazione.porta(6);
  await zoo.cancelli[k].apri(true);
  const premio = occ.aiutato ? 100 : 60; xp += premio; $('sXp').textContent = xp; toast('+' + premio + ' XP'); jingle.win();
  if (occ.aiutato) {
    A.inSquadra = true; squadra.push(A); $('sSquadra').textContent = squadra.length;
    await parla(A.p, ['Ce l\'abbiamo fatta! Vengo con te.', 'Bel lavoro di squadra. Ti accompagno.', 'Perfetto. Andiamo al pullman insieme.'][k]);
  } else caption(N() + ' ha aperto il cancello da solo.');
  // si passa: la squadra segue, il cancello si richiude davanti al leone
  const fine = k === 2 ? PULLMAN_Z + 3.5 : ZONE_Z[k + 1] - 1;
  cam.modo = 'segui';
  await cammina(0, CANCELLO_Z[k] - 3);
  zoo.cancelli[k].apri(false);
  leone.vaiA(.4, CANCELLO_Z[k] + 1.6, 3.2).then(() => { leone.guarda(0, CANCELLO_Z[k] - 4); leone.ruggisci(); tone(140, .25, 'square', .06); });
  await cammina(0, fine); P.faceTo(Math.PI); caption('');
  if (k < 2) iniziaZona(k + 1); else finale();
}
async function molla() {
  if (!occ || occ.fine) return;
  occupato = true; liberi = false; setAttivi({});
  occ.mollato = true; P.stop(); P.root.position.set(PANCHINA.x + .05, 0, CG() + PANCHINA.dz); P.root.rotation.y = Math.PI / 2; P.play('sit');
  caption(N() + ' si siede sulla panchina e lascia perdere.');
  // lasciar perdere non fa sparire il problema: il leone arriva comunque
  leonePausa = false; leoneT = Math.max(leoneT, T_LEONE() - 3.5);
  occupato = false;
}
async function colpisci() {
  if (!occ || occ.fine || $('pannello').classList.contains('rotto')) return;
  occ.colpi++; S.colpi = (S.colpi || 0) + 1; save();
  chiudiPannello(); occupato = true; liberi = false; setAttivi({});
  P.faceTo(Math.PI); await P.play('kick', { once: true }); P.play('idle');
  noise(.35, .35, 2200); tone(90, .3, 'sawtooth', .08); scintille();
  Frustrazione.spinta(14); leoneT = Math.min(T_LEONE() - 1, leoneT + 6);
  caption('Il pannello fa scintille e si blocca per qualche secondo.');
  $('pannello').classList.add('rotto'); setTimeout(() => $('pannello').classList.remove('rotto'), 8000);
  occupato = false; liberi = true; etichette();
}
async function raggiunto() {
  if (occ.fine) return;
  occ.fine = true; leoneAttivo = false; liberi = false; clearTimeout(sdTimer); aiutoVisibile = null; chiudiPannello(); setAttivi({}); zittisci(); $('dialogo').classList.remove('active');
  registra({ zona: zona + 1, difficile: occ.difficile, tipo: occ.difficile ? (occ.chiesto ? occ.tipo : 'problema') : 'raggiunto', scelta: occ.mollato ? 'molla' : 'raggiunto', aiuto: occ.aiuto, latenzaMs: null, frustrazione: Math.round(Frustrazione.v), errori: occ.errori, colpi: occ.colpi, esito: occ.mollato ? 'molla' : 'raggiunto', tempoS: Math.round((performance.now() - occ.t0) / 1000) });
  P.stop(); cam.modo = 'segui';
  const p = P.root.position; await leone.vaiA(p.x + .2, p.z + 1.3, 4.5); leone.ruggisci(); roar();
  P.play('crouchIdle'); tone(200, .2, 'triangle', .08);
  // lo zaino passa al leone, che se ne va tutto contento
  leone.testa.add(zaino); zaino.position.set(0, -.3, .4); zaino.rotation.set(.3, 0, 0);
  caption('Rocco ha preso lo zaino con il panino! ' + N() + ' deve ricominciare questa zona.');
  await sleep(1500); await leone.vaiA(p.x + 3, p.z + 7, 3.4); await sleep(1800);
  P.play('idle');
  iniziaZona(zona, true);
}
async function modeling() {
  // livello 1: Andrea chiede aiuto da solo; il giocatore guarda come si fa
  occ.tipo = 'modello_osservato'; occ.chiesto = true; occ.aiuto = 'modello'; leonePausa = true; richiestaInCorso = true; liberi = false; chiudiPannello(); setAttivi({});
  caption('Guarda che cosa fa ' + N() + ' quando è bloccato.'); await sleep(2200);
  await parla(P, 'Da solo non ci riesco. Chiedo aiuto a ' + aiutante().nome + '.');
  const [x, z, r] = PUNTI.aiutante.luogo(); await cammina(x, z); P.faceTo(r);
  const A = aiutante(); A.p.faceTo(-Math.PI / 2 - .3); A.p.play('idle');
  await parla(P, A.nome + ', mi aiuti? ' + enigma.bisogno);
  occ.forma = 'specifica'; caption('');
  await aiutoDato(A); liberi = true; richiestaInCorso = false;
  caption('Ha chiesto aiuto dicendo esattamente che cosa gli serviva. Ora finisci tu.', true);
}
async function finale() {
  objective(''); cam.modo = 'finale'; Frustrazione.porta(6);
  const B = AIUTANTI[1];
  caption('Il pullman! La squadra è salva.'); jingle.win(); await sleep(2000);
  // Rocco segue Bruno con un panino tutto per lui e torna nel suo recinto
  if (!B.inSquadra) { B.p.root.position.set(-2, 0, PULLMAN_Z + 6); }
  leone.root.position.set(1.5, 0, CANCELLO_Z[2] - 3); leone.vaiA(1.2, PULLMAN_Z + 7, 2.2);
  await parla(B.p, 'Rocco! Il tuo pranzo è qui. Torniamo a casa, campione.'); leone.ruggisci(); await sleep(1500);
  const chieste = S.prove.filter(t => t.difficile && ['indipendente', 'anticipata', 'con_aiuto'].includes(t.tipo)).length;
  $('endLead').innerHTML = 'XP: <b>' + xp + '</b> · Squadra: <b>' + (squadra.map(a => a.nome).join(', ') || 'nessuno') + '</b><br>Volte in cui ' + N() + ' ha chiesto aiuto: <b>' + chieste + '</b>';
  S.fine = new Date().toISOString(); S.xp = xp; save();
  caption(''); overlay('end', true); $('stats').style.display = 'none'; $('leoneHud').style.display = 'none'; $('anger').style.display = 'none'; $('signals').style.display = 'none';
}

/* ------------------------------------------------------------------ effetti */
function roar() { const a = audio(); if (!a) return; tone(110, .5, 'sawtooth', .07); tone(95, .6, 'sawtooth', .06, .08); noise(.5, .12, 500); }
const sc = [];
function scintille() {
  const base = new THREE.Vector3(PANNELLO.x, 1.3, CG() + PANNELLO.dz + .1);
  for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.025, 4, 4), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffe066 : 0xffffff })); m.position.copy(base); scene.add(m); sc.push({ m, v: new THREE.Vector3((Math.random() - .5) * 3, Math.random() * 3, Math.random() * 2), t: .7 }); }
  $('flash').style.background = 'radial-gradient(circle, transparent 35%, rgba(255,220,90,.55))'; $('flash').style.opacity = 1; setTimeout(() => $('flash').style.opacity = 0, 160);
}

/* ------------------------------------------------------------------ camera */
const cam = { modo: 'intro', pos: new THREE.Vector3(0, 6, 12), look: new THREE.Vector3(0, 1, 0), sx: .5, salta: true };
function aggiornaCamera(dt) {
  const p = P.root.position, wp = new THREE.Vector3(), wl = new THREE.Vector3();
  if (cam.modo === 'intro') { wp.set(4.5, 4.2, 10); wl.set(1.5, 1, 2); }
  else if (cam.modo === 'finale') { wp.set(5.5, 4.2, PULLMAN_Z + 9); wl.set(-1, 1.2, PULLMAN_Z + 1.5); }
  else { wp.set(p.x * .45, 8.4, p.z + 8.2); wl.set(p.x * .7, .4, p.z - 1.2); }
  const k = cam.salta ? 1 : 1 - Math.exp(-dt * 3); cam.salta = false;
  cam.pos.lerp(wp, k); cam.look.lerp(wl, k);
  camera.position.copy(cam.pos); camera.lookAt(cam.look);
  const sx = pannelloAperto ? .27 : .5; cam.sx += (sx - cam.sx) * Math.min(1, dt * 5);
  camera.setViewOffset(W, H, W * (.5 - cam.sx), 0, W, H);
}

/* ------------------------------------------------------------------ ciclo */
const clock = new THREE.Clock(); let tempo = 0, ultimoBattito = 0;
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), .05); tempo += dt;
  stepTweens(performance.now());
  if (!P || !leone || !zoo) return;
  P.update(dt); leone.update(dt); AIUTANTI.forEach(a => a.p && a.p.update(dt));
  zoo.vivi.forEach(f => f(dt, tempo)); zoo.seguiOmbra(P.root.position.x, P.root.position.z - 3);
  // il leone: si avvicina con il passare del tempo, sempre alle spalle di Andrea
  if (leoneAttivo && occ && !occ.fine) {
    if (!leonePausa) leoneT += dt;
    const prog = clamp(leoneT / T_LEONE(), 0, 1), d = 1.2 + 3.4 * (1 - prog);
    if (!leonePausa && !leone.target) {
      const tx = P.root.position.x + (P.root.position.x > 0 ? -1 : 1) * (.4 + 2.6 * (1 - prog)) + Math.sin(tempo * .5) * .6, tz = Math.min(P.root.position.z + d, ZONE_Z[zona] + 4);
      const lp = leone.root.position, dx = tx - lp.x, dz = tz - lp.z, dist = Math.hypot(dx, dz);
      if (dist > .3) { const v = clamp(dist * 1.6, .8, 3.6), s = Math.min(dist, v * dt); lp.x += dx / dist * s; lp.z += dz / dist * s; leone.velocita = Math.max(leone.velocita, v * .8); }
      leone.guarda(P.root.position.x, P.root.position.z);
    }
    $('leoneFill').style.width = (prog * 100).toFixed(1) + '%';
    $('leoneHud').classList.toggle('vicino', prog > .75);
    if (prog > .75 && tempo - ultimoBattito > (prog > .9 ? .5 : .8)) { ultimoBattito = tempo; heartbeat(); }
    // la pressione del leone fa salire la frustrazione; gli errori la spingono di più negli enigmi difficili
    if (!occ.aiutato) {
      Frustrazione.base = clamp(12 + 26 * prog + occ.peso * (occ.difficile ? 15 : 6), 0, 76);   // da sola la situazione arriva all'arancione; il rosso solo con i picchi
      Frustrazione.tetto = occ.difficile ? 100 : 55;
    }
    if (occ.difficile && !occ.sdT && !occ.chiesto && occ.errori >= 1 && Frustrazione.zona >= 3) inizioSD();
    if (prog >= 1 && (!occupato || occ.mollato)) raggiunto();
  }
  Frustrazione.update(dt);
  // squadra: chi ha aiutato segue Andrea
  squadra.forEach((a, i) => { const q = a.p.root.position, tx = P.root.position.x + (i % 2 ? 1.1 : -1.1), tz = P.root.position.z + 1.3 + i * .7; const d = Math.hypot(tx - q.x, tz - q.z); if (d > 1.6 && !a.p.target && !a.p.occupato) a.p.walkTo(tx, tz, { run: d > 4 }); });
  // scintille
  for (let i = sc.length - 1; i >= 0; i--) { const s = sc[i]; s.t -= dt; s.v.y -= 9 * dt; s.m.position.addScaledVector(s.v, dt); if (s.t <= 0) { scene.remove(s.m); sc.splice(i, 1); } }
  // freccia sopra l'aiutante (aiuto completo)
  if (freccia.visible) { const q = aiutante().p.root.position; freccia.position.set(q.x, aiutante().altezza + 1.05 + Math.sin(tempo * 5) * .08, q.z); freccia.rotation.y += dt * 2; }
  aggiornaCamera(dt);
  renderer.render(scene, camera);
  for (const [id, a] of Object.entries(attivi)) {
    v3.copy(PUNTI[id].pos()).project(camera);
    a.el.style.left = clamp((v3.x + 1) / 2 * W, a.meta, W - a.meta) + 'px'; a.el.style.top = Math.max(118, (1 - v3.y) / 2 * H) + 'px';   // mai sotto l'obiettivo in alto
  }
  aggiornaFumetti(camera, W, H);
}

/* ------------------------------------------------------------------ avvio */
(async () => {
  loop();
  try { await carica(); } catch (e) { console.error(e); $('loadTitle').textContent = 'Errore di caricamento'; return; }
  overlay('loading', false); overlay('home', true);
  $('homeLead').textContent = 'Allo zoo è saltata la corrente e i recinti sono aperti. Rocco il leone vuole il panino di ' + N() + '. Apri i tre cancelli e arriva al pullman.';
  cam.modo = 'intro'; P.root.position.set(0, 0, 1.5); P.root.rotation.y = 0;
  AIUTANTI.forEach((a, k) => piazzaAiutante(k));
  $('startBtn').onclick = () => iniziaGioco();
  $('endBtn').onclick = () => { overlay('end', false); AIUTANTI.forEach((a, k) => piazzaAiutante(k)); zoo.cancelli.forEach(c => c.apri(false)); overlay('home', true); cam.modo = 'intro'; cam.salta = true; P.root.position.set(0, 0, 1.5); leone.root.position.set(LARGO + 4, 0, 4); };
  initTerapista({ onClose: () => {} });
  if (DEBUG) window.__app = { THREE, scene, camera, renderer, P, leone, AIUTANTI, zoo, Frustrazione, get occ() { return occ; }, get zona() { return zona; }, get S() { return S; }, get enigma() { return enigma; }, get leoneT() { return leoneT; }, set leoneT(v) { leoneT = v; }, get liberi() { return liberi; }, get occupato() { return occupato; }, iniziaGioco, iniziaZona, apriPannello, chiediAiuto, molla, colpisci, cfg };
})();

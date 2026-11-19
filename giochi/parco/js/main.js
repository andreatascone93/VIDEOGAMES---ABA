/* Il segreto del parco — puzzle game 3D per un intervento ABA sulla richiesta di aiuto e sulla cortesia.

   Trama: in fondo al Parco dei Tigli c'è una cupola chiusa da trent'anni. Il protagonista trova una chiave e un biglietto
   dell'inventore Ottavio Lumen: quattro cancelli, quattro custodi. Ogni cancello ha un enigma (simboli, tubi, memoria,
   mosaico). Il principio del gioco, mai detto ad alta voce: si arriva in fondo stando bene con sé stessi e con gli altri.

   Contingenze (A-B-C) di ogni enigma difficile:
   MO   enigma che da soli non si risolve: manca qualcosa che ha solo il custode (un indizio, un attrezzo, una melodia, una tessera)
   SD   frustrazione in zona arancione (60 su 100) dopo almeno un tentativo sbagliato, con il custode in vista
   R+   chiedere aiuto  →  il custode dà quello che manca, il cancello si apre, XP
   Forma della richiesta e conseguenze sociali (rinforzo differenziale della cortesia):
        gentile e precisa ("Scusa Bruno, mi daresti una mano? …")  → aiuto pieno (il pezzo che manca più un suggerimento), fiducia +1
        precisa ma brusca ("Bruno, mi serve…")                    → aiuto minimo (solo il pezzo che manca)
        scortese ("Muoviti, fallo tu!")                           → il custode si offende e se ne va; per riavere aiuto bisogna
                                                                     scusarsi, e quell'aiuto sarà minimo; fiducia -2
        grazie dopo l'aiuto: fiducia +1; "era ora": fiducia -1
        Chi si fida (fiducia ≥ 2) diventa amico e accompagna il protagonista: la cupola finale si apre di uno spicchio per ogni
        amico arrivato fin lì. Le scelte sociali decidono quanto tesoro si vede.
   Sé stessi: la frustrazione annebbia il pannello (con la testa calda si vede peggio) e incupisce la musica; "Fai un respiro"
        la fa scendere. Lasciar perdere fa tornare a casa: il cancello resta chiuso e si riparte il giorno dopo. Colpire il
        pannello lo blocca e fa perdere fiducia al custode che guarda.
   Enigmi facili: si risolvono da soli e si rinforza l'autonomia; lì il custode incoraggia a provare. */
import * as THREE from 'three';
import { cfg, N, db, save, $, sleep, clamp, audio, tone, noise, jingle, caption, objective, toast, heartbeat, overlay, buio, tween, stepTweens } from './core.js';
import { preload } from './assets.js';
import { Personaggio } from './personaggio.js';
import { Volto } from './volto.js';
import { Frustrazione, VALORE } from './frustrazione.js';
import { creaPersona, parla, zittisci, aggiornaFumetti } from './persone.js';
import { costruisciParco, ZONE_Z, CANCELLO_Z, CUPOLA_Z, PANNELLO, PANCHINA, LARGO } from './parco.js';
import { ENIGMI } from './enigmi.js';
import { Musica } from './musica.js';
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
const mischia = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);

/* ------------------------------------------------------------------ personaggi e storia */
const AIUTANTI = [
  { nome: 'Luca', skin: 'athleteMaleBlue', altezza: 1.4, tono: 1.35 },                      // un ragazzo che gioca sempre nel parco
  { nome: 'Bruno', skin: 'farmerB', altezza: 1.8, tono: .75 },                              // il giardiniere
  { nome: 'Elena', skin: 'casualFemaleB', altezza: 1.68, capelli: 0x6b3a1f, tono: 1.15 },   // la violinista del chiosco
  { nome: 'Pietro', skin: 'businessMaleA', altezza: 1.74, tono: .62 }                       // il vecchio amico di Ottavio
];
const TAPPE = [
  { nome: 'Il cancello del roseto', arrivo: 'Il primo cancello. Sul pannello ci sono i simboli di Ottavio, e accanto un cartello.', targa: '«Chi guarda bene, trova.»' },
  { nome: 'Il cancello della fontana', arrivo: 'La fontana è asciutta da anni. Questo cancello si apre solo se l\'acqua torna a scorrere.', targa: '«L\'acqua arriva lontano perché ogni tubo fa la sua parte.»' },
  { nome: 'Il cancello del chiosco', arrivo: 'Il chiosco della musica. Un vecchio carillon fa la guardia al terzo cancello.', targa: '«Una nota da sola è un rumore. Con le altre è una melodia.»' },
  { nome: 'Il cancello della cupola', arrivo: 'L\'ultimo cancello: un mosaico del cielo. Dietro, finalmente, la cupola.', targa: '«Il cielo intero non sta in una tessera sola.»' }
];
const VIENE = ['Vengo anch\'io! Voglio proprio vedere cosa c\'è là in fondo.', 'Sai che ti dico? Poso gli attrezzi e ti accompagno.', 'Aspetta, prendo il violino. Vengo con te.', 'Trent\'anni che aspetto questo giorno. Andiamo, ragazzo.'];
let parco, P, volto, freccia;
async function carica() {
  const passi = [
    async () => { parco = await costruisciParco(scene, renderer); },
    async () => { P = await Personaggio.crea({ altezza: 1.36 }); P.altezza = 1.36; P.nome = N(); P.tono = 1.3; scene.add(P.root); volto = await Volto.crea(P, 'casualMaleA'); Frustrazione.init(volto); },
    async () => { for (const a of AIUTANTI) { a.p = await creaPersona(a); a.p.tono = a.tono; a.p.root.visible = true; scene.add(a.p.root); } }
  ];
  await preload(['personaggio/francesco.glb'], k => $('bar').firstElementChild.style.width = (k * 30) + '%');
  let i = 0; for (const f of passi) { await f(); $('bar').firstElementChild.style.width = (30 + ++i / passi.length * 70) + '%'; }
  freccia = new THREE.Mesh(new THREE.ConeGeometry(.22, .45, 4), new THREE.MeshStandardMaterial({ color: 0x3fcf7a, emissive: 0x1d7a45 }));
  freccia.rotation.x = Math.PI; freccia.visible = false; scene.add(freccia);
}

/* ------------------------------------------------------------------ stato */
let S = null, zona = 0, occ = null, enigma = null, xp = 0, squadra = [];
let liberi = false, occupato = false, pannelloAperto = false, richiestaInCorso = false, sdTimer = null, tempoPannello = 0;
const difficile = k => k >= TAPPE.length - clamp(Number(cfg().difficili), 0, TAPPE.length);
const aiutante = () => AIUTANTI[zona];
const CG = () => CANCELLO_Z[zona];
const POSTO = k => [3.9, CANCELLO_Z[k] + 6.8];

/* ------------------------------------------------------------------ etichette nel mondo
   Tutte uguali: il colore non suggerisce la risposta. */
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
    m.panchina = { testo: 'Lascia perdere e torna a casa', azione: molla };
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

// tocco sul viale: il protagonista ci va camminando, senza uscire dalla tappa
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), piano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), v3 = new THREE.Vector3();
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
  if (tipo === 'completo') caption('Quando sei bloccato puoi chiedere una mano. ' + aiutante().nome + ' è lì vicino.');
}
function inizioSD() {
  occ.sdT = performance.now(); occ.frustrazioneSD = Math.round(Frustrazione.v);
  const lv = Number(cfg().livello);
  if (lv === 1) { modeling(); return; }
  if (lv === 2) { daiAiuto(cfg().aiuto); return; }
  clearTimeout(sdTimer); sdTimer = setTimeout(() => { if (occ && !occ.chiesto && !occ.fine) daiAiuto('parziale'); }, cfg().secondiAiutoRitardato * 1000);
}

/* ------------------------------------------------------------------ sessione e tappe */
function nuovaSessione() {
  S = { id: Date.now(), inizio: new Date().toISOString(), livello: Number(cfg().livello), aiuto: Number(cfg().livello) === 2 ? cfg().aiuto : '', difficili: Number(cfg().difficili), prove: [], richieste: [], scortesi: 0, scuse: 0, grazie: 0, respiri: 0, colpi: 0 };
  db.sessions.push(S); save();
}
function registra(r) { S.prove.push({ ora: new Date().toISOString(), ...r }); save(); }
function piazzaAiutante(k) {
  const a = AIUTANTI[k], p = a.p; p.stop(); p.root.visible = true; p.root.position.set(POSTO(k)[0], 0, POSTO(k)[1]); p.root.rotation.y = -Math.PI / 2; p.play('interactStanding');
  a.inSquadra = false; a.fiducia = 1; a.offeso = false;
}
async function tornaAlPosto(A, k) { await A.p.walkTo(...POSTO(k)); A.p.faceTo(-Math.PI / 2); A.p.play('interactStanding'); }

async function iniziaGioco() {
  overlay('home', false); audio(); nuovaSessione(); xp = 0; squadra = []; $('sXp').textContent = 0; $('sSquadra').textContent = 0;
  $('stats').style.display = 'flex'; $('anger').style.display = 'block';
  AIUTANTI.forEach((a, k) => piazzaAiutante(k)); parco.cancelli.forEach(c => { c.anta.position.x = 0; }); parco.cupola.chiudi(); parco.getto.visible = false;
  P.root.position.set(0, 0, 1.5); P.root.rotation.y = Math.PI; P.play('idle');
  Frustrazione.segnali = true; Frustrazione.porta(10, { subito: true });
  if (cfg().musica) Musica.avvia();
  cam.modo = 'intro'; cam.salta = true;
  caption('Parco dei Tigli. In fondo al viale c\'è una cupola chiusa da trent\'anni. Nessuno ricorda più che cosa ci sia dentro.'); await sleep(DEBUG ? 600 : 7200);
  caption('Stamattina, sotto una panchina, ' + N() + ' ha trovato una chiave d\'ottone. Legato alla chiave, un biglietto ingiallito.'); await sleep(DEBUG ? 600 : 7000);
  caption('«Quattro cancelli, quattro custodi. La cupola si apre a chi arriva in fondo. Firmato: Ottavio Lumen, inventore.»'); await sleep(DEBUG ? 600 : 7400);
  caption('');
  iniziaZona(0);
}

async function iniziaZona(k, riprova = false) {
  zona = k; liberi = false; aiutoVisibile = null; clearTimeout(sdTimer); $('pannello').classList.remove('rotto'); tempoPannello = 0;
  if (riprova) {
    await buio(true, 'Il giorno dopo'); P.stop(); P.root.position.set(0, 0, ZONE_Z[k] - 1); P.root.rotation.y = Math.PI; P.play('idle');
    if (!AIUTANTI[k].inSquadra) { const f = AIUTANTI[k].fiducia, o = AIUTANTI[k].offeso; piazzaAiutante(k); AIUTANTI[k].fiducia = f; AIUTANTI[k].offeso = o; }   // le persone si ricordano di ieri
    cam.salta = true; Frustrazione.porta(14, { subito: true }); await buio(false);
  }
  const dif = difficile(k);
  enigma = ENIGMI[k]({ difficile: dif, errore: erroreEnigma, risolto: enigmaRisolto });
  disegnaIndizio();
  occ = { zona: k + 1, difficile: dif, t0: performance.now(), errori: 0, peso: 0, colpi: 0, respiri: 0, scortesi: 0, primaDiProvare: 0, chiesto: false, fine: false, aiuto: null, forma: null };
  objective(TAPPE[k].nome);
  liberi = true; etichette(); cam.modo = 'segui';
  caption(riprova ? 'Il cancello è ancora chiuso, come ieri.' : TAPPE[k].arrivo + (k === 0 ? ' Tocca il viale per camminare.' : ''));
}

/* ------------------------------------------------------------------ il pannello */
function disegnaIndizio() {
  const t = parco.cancelli[zona].indizio.userData.tex, c = t.image, g = c.getContext('2d');
  g.fillStyle = '#f1e6c8'; g.fillRect(0, 0, c.width, c.height); g.strokeStyle = '#7a5232'; g.lineWidth = 10; g.strokeRect(14, 14, c.width - 28, c.height - 28);
  enigma.disegnaIndizio(g, c.width, c.height); t.needsUpdate = true;
  const ov = $('pIndizio'), g2 = ov.getContext('2d'); g2.drawImage(c, 0, 0, ov.width, ov.height);
}
function apriPannello() {
  if (!enigma) return;
  pannelloAperto = true; P.faceTo(Math.PI);
  $('pTitolo').textContent = TAPPE[zona].nome;
  const box = $('pEnigma'); box.innerHTML = ''; box.appendChild(enigma.el);
  $('bAiuto').textContent = 'Chiedi aiuto a ' + aiutante().nome;
  disegnaIndizio(); overlay('pannello', true); document.body.classList.add('inpannello'); etichette(); aggiornaAiuto();
}
function chiudiPannello() { pannelloAperto = false; overlay('pannello', false); document.body.classList.remove('inpannello'); aggiornaAiuto(); }
$('bAiuto').onclick = () => { if (occupato) return; jingle.click(); chiudiPannello(); chiediAiuto('pannello'); };
$('bRespira').onclick = () => { if (occupato) return; jingle.click(); respira(); };
$('bMolla').onclick = () => { if (occupato) return; jingle.click(); chiudiPannello(); molla(); };
$('bColpisci').onclick = () => { if (occupato) return; colpisci(); };
$('bVia').onclick = () => { if (occupato) return; jingle.click(); chiudiPannello(); etichette(); };

function erroreEnigma(peso) {
  occ.errori++; occ.peso += peso;
  Frustrazione.spinta(occ.difficile ? 12 : 7);
}

/* ------------------------------------------------------------------ stare bene con sé stessi: il respiro */
async function respira() {
  if (!occ || occ.fine) return;
  occupato = true; occ.respiri++; S.respiri++; save();
  const n = Math.max(1, Number(cfg().respiri)); overlay('breathOv', true);
  for (let i = 0; i < n; i++) {
    $('breathText').textContent = 'Inspira…'; $('breathCount').textContent = (i + 1) + ' / ' + n; $('breath').style.transform = 'scale(1.35)'; tone(196, 2.6, 'sine', .05); await sleep(2800);
    $('breathText').textContent = 'Espira…'; $('breath').style.transform = 'scale(.75)'; tone(147, 2.6, 'sine', .05); await sleep(2800);
    // ogni respiro toglie un po' di peso: la frustrazione scende passo dopo passo, non di colpo
    occ.peso = Math.max(0, occ.peso - 1); tempoPannello = Math.max(0, tempoPannello - 40); Frustrazione.spinta(-6);
  }
  overlay('breathOv', false); occupato = false;
}

/* ------------------------------------------------------------------ la richiesta di aiuto */
async function chiediAiuto(origine) {
  if (!occ || occ.fine) return;
  const A = aiutante(), lv = Number(cfg().livello); occupato = true; liberi = false; setAttivi({}); richiestaInCorso = true; caption('');
  try {
    if (origine === 'pannello') {
      P.faceTo(Math.atan2(A.p.root.position.x - P.root.position.x, A.p.root.position.z - P.root.position.z));
      await parla(P, A.nome + '!', { ms: 900 });
      if (A.offeso) { A.p.faceTo(Math.atan2(P.root.position.x - A.p.root.position.x, P.root.position.z - A.p.root.position.z)); await parla(A.p, 'Io da lì non mi muovo. Se hai qualcosa da dirmi, vieni tu.', { ms: 2600 }); return; }
      // livello 4: il custode non può venire subito (tolleranza all'attesa dopo la richiesta)
      if (lv === 4 && occ.difficile) {
        await parla(A.p, 'Arrivo! Un attimo, finisco qui.', { ms: 2000 });
        const s = cfg().attesaAiuto, fine = performance.now() + s * 1000;
        while (performance.now() < fine) { $('attesa').textContent = A.nome + ' arriva tra ' + Math.ceil((fine - performance.now()) / 1000) + '…'; $('attesa').style.display = 'block'; await sleep(200); }
        $('attesa').style.display = 'none'; occ.attesaS = s;
      }
      await A.p.walkTo(P.root.position.x - 1.1, P.root.position.z + .5);
      A.p.faceTo(Math.atan2(P.root.position.x - A.p.root.position.x, P.root.position.z - A.p.root.position.z));
    } else { A.p.faceTo(-Math.PI / 2 - .3); A.p.play('idle'); }
    await dialogoAiuto(origine);
  } finally {
    occupato = false; richiestaInCorso = false;
    if (!occ.fine) { liberi = true; etichette(); }
  }
}
// le frasi: la stessa scelta sia chiamando dal pannello sia andando dal custode
async function dialogoAiuto(origine) {
  const A = aiutante(), Hn = A.nome;
  const G = 'Scusa ' + Hn + ', mi daresti una mano? ' + enigma.bisogno, B = Hn + ', ' + enigma.brusca, V = 'Mi aiuti, per favore?', SG = 'Muoviti, fallo tu! Io non ci riesco.', NN = 'Niente, lascia stare.', SC = 'Scusa per prima, ' + Hn + '. Ti ho risposto male.';
  let riparata = false;
  // chi è stato trattato male non aiuta finché non riceve delle scuse
  if (A.offeso) {
    await parla(A.p, 'Ah, sei tu.', { ms: 1300 });
    const k = await scegliFrase([...mischia([['a', SC], ['s', SG]]), ['n', NN]]);
    if (k === 'n') { await parla(A.p, 'Come vuoi.', { ms: 1200 }); return; }
    if (k === 's') { await scortese(A, SG, origine); return; }
    await parla(P, SC); A.offeso = false; A.fiducia = Math.max(A.fiducia, 0); S.scuse++; occ.scuse = (occ.scuse || 0) + 1; save(); riparata = true;
    await parla(A.p, 'Scuse accettate. Dimmi pure.', { ms: 1900 });
  }
  let opz = mischia([['g', G], ['b', B], ['v', V], ['s', SG]]);
  if (Number(cfg().livello) === 2 && aiutoVisibile === 'completo' && occ.sdT) opz = [['g', G], ...opz.filter(o => o[0] !== 'g')];   // aiuto completo: la frase gentile per prima
  opz.push(['n', NN]);
  let scelta = await scegliFrase(opz);
  if (scelta === 'n') { await parla(A.p, 'Va bene. Sono qui.', { ms: 1400 }); return; }
  const forma = { g: 'gentile', b: 'brusca', v: 'gentile', s: 'scortese' }[scelta], ora = performance.now();
  S.richieste.push({ zona: zona + 1, difficile: occ.difficile, forma, errori: occ.errori, origine }); save();
  if (scelta === 's') {
    if (occ.difficile && !occ.chiesto && occ.errori > 0) segnaRichiesta(forma, origine, ora);
    await scortese(A, SG, origine); return;
  }
  if (!occ.difficile) {
    await parla(P, scelta === 'g' ? G : scelta === 'b' ? B : V, { ms: 2200 });
    await parla(A.p, 'Questo ce la fai da solo: guarda bene il cartello. Io resto qui a fare il tifo.');
    occ.nonNecessario = (occ.nonNecessario || 0) + 1; return;
  }
  if (occ.errori === 0 && cfg().provaPrima) {
    await parla(P, scelta === 'g' ? G : scelta === 'b' ? B : V, { ms: 2200 });
    await parla(A.p, 'Prova prima una volta. Se non ci riesci, sono qui.'); occ.primaDiProvare++; return;
  }
  if (!occ.chiesto) segnaRichiesta(forma, origine, ora);
  if (scelta === 'v') {
    await parla(P, V, { ms: 1700 }); await parla(A.p, 'Volentieri! Dimmi: che cosa ti serve?', { ms: 2300 });
    scelta = await scegliFrase(mischia([['g', G], ['b', B]]));
    if (scelta === 'b' && occ.forma === 'gentile') scelta = 'g2';   // ha già chiesto per favore: resta una richiesta gentile
  }
  await parla(P, scelta === 'b' || scelta === 'g2' ? B : G);
  const gentile = scelta !== 'b';
  if (gentile) A.fiducia++;
  await aiutoDato(A, gentile && !riparata);
}
function segnaRichiesta(forma, origine, ora) {
  occ.chiesto = true; occ.forma = forma; occ.chiamata = origine; occ.frustrazione = Math.round(Frustrazione.v);
  occ.latenzaMs = occ.sdT ? Math.round(ora - occ.sdT) : null;
  occ.tipo = occ.errori === 0 ? 'prima_di_provare' : !occ.sdT ? 'anticipata' : occ.aiuto ? 'con_aiuto' : 'indipendente';
  clearTimeout(sdTimer); aiutoVisibile = null; aggiornaAiuto(); caption('');
}
// una risposta sgarbata ha conseguenze: il custode si offende, se ne va, e la sua fiducia cala
async function scortese(A, frase, origine) {
  await parla(P, frase, { ms: 2000 });
  A.fiducia -= 2; A.offeso = true; occ.scortesi++; S.scortesi++; save();
  A.p.play('idle'); await parla(A.p, ['Ehi. Così non mi va proprio di aiutarti.', 'Con questo tono? No, grazie.', 'Non sono mica ai tuoi ordini.'][occ.scortesi % 3], { ms: 2600 });
  if (origine === 'pannello') tornaAlPosto(A, zona); else { A.p.faceTo(Math.PI / 2); A.p.play('interactStanding'); }
}
function scegliFrase(opz) {
  return new Promise(ok => {
    const box = $('dialogo'); box.innerHTML = '<div class="t">COSA DICE ' + N().toUpperCase() + '?</div>';
    opz.forEach(([k, testo]) => { const b = document.createElement('button'); b.className = 'batt'; b.textContent = testo; b.dataset.k = k; b.onclick = () => { jingle.click(); box.classList.remove('active'); ok(k); }; box.appendChild(b); });
    box.classList.add('active');
  });
}
// il custode dà quello che manca (aiuto minimo) o anche un suggerimento in più (aiuto pieno), poi lascia finire
async function aiutoDato(A, pieno, modello = false) {
  occ.aiutato = true; occ.grado = pieno ? 'pieno' : 'minimo';
  await parla(A.p, pieno ? 'Ma certo, volentieri!' : 'Va bene.', { ms: 1500 });
  await A.p.walkTo(PANNELLO.x + 1.0, CG() + PANNELLO.dz + .9); A.p.faceTo(Math.PI); await A.p.play('interactStanding', { once: true });
  enigma.sblocca(pieno); disegnaIndizio(); tone(880, .12, 'triangle', .08);
  await parla(A.p, pieno ? enigma.rivelaPieno : enigma.rivela);
  A.p.play('idle'); A.p.faceTo(Math.atan2(P.root.position.x - A.p.root.position.x, P.root.position.z - A.p.root.position.z));
  // e dopo l'aiuto: grazie, niente, o uno sgarbo
  const k = modello ? 't' : await scegliFrase(mischia([['t', 'Grazie, ' + A.nome + '!'], ['z', '(Torna al pannello senza dire niente)'], ['r', 'Era ora.']]));
  if (k === 't') { await parla(P, 'Grazie, ' + A.nome + '!', { ms: 1500 }); A.fiducia++; S.grazie++; occ.grazie = 'si'; await parla(A.p, 'Figurati. Se serve, sono qui.', { ms: 1900 }); }
  else if (k === 'r') { await parla(P, 'Era ora.', { ms: 1300 }); A.fiducia--; occ.grazie = 'sgarbo'; await parla(A.p, '…Prego, eh.', { ms: 1600 }); }
  else occ.grazie = 'no';
  save();
  occ.peso = Math.min(occ.peso, 1); tempoPannello = 0;
  await cammina(...PUNTI.pannello.luogo().slice(0, 2)); P.faceTo(Math.PI);
  apriPannello();
}

/* ------------------------------------------------------------------ esiti */
async function enigmaRisolto() {
  if (occ.fine) return;
  occ.fine = true; liberi = false; occupato = true; chiudiPannello(); setAttivi({}); clearTimeout(sdTimer); aiutoVisibile = null; aggiornaAiuto();
  const A = aiutante(), k = zona, tempoS = Math.round((performance.now() - occ.t0) / 1000);
  Frustrazione.porta(6);
  await parco.cancelli[k].apri(true);
  if (k === 1) { parco.getto.visible = true; noise(.6, .1, 3000); }
  const premio = (occ.aiutato ? 100 : 60) + (occ.forma === 'gentile' ? 20 : 0); xp += premio; $('sXp').textContent = xp; toast('+' + premio + ' XP'); jingle.win();
  // il custode commenta, e il modo in cui gli si risponde decide se viene anche lui
  let saluto = null;
  if (occ.aiutato) await parla(A.p, 'Ecco fatto, si è aperto!', { ms: 1700 });
  else if (!A.offeso) {
    A.p.play('idle'); A.p.faceTo(Math.atan2(P.root.position.x - A.p.root.position.x, P.root.position.z - A.p.root.position.z));
    await parla(A.p, 'Ehi, l\'hai aperto da solo! Niente male.', { ms: 2300 });
    saluto = Number(cfg().livello) === 1 ? 't' : await scegliFrase(mischia([['t', 'Grazie! Vieni con me a vedere cosa c\'è in fondo?'], ['z', '(Va avanti senza rispondere)'], ['r', 'Lo so, sono il più forte.']]));
    if (saluto === 't') { await parla(P, 'Grazie! Vieni con me a vedere cosa c\'è in fondo?'); A.fiducia++; S.grazie++; }
    else if (saluto === 'r') { await parla(P, 'Lo so, sono il più forte.', { ms: 1700 }); A.fiducia--; await parla(A.p, 'Ah. Va bene. Ciao, eh.', { ms: 1800 }); }
  }
  if (A.fiducia >= 2 && !A.offeso) { A.inSquadra = true; squadra.push(A); $('sSquadra').textContent = squadra.length; await parla(A.p, VIENE[k]); toast('Un amico in più'); }
  else if (occ.aiutato) await parla(A.p, 'Io resto qui. Buona fortuna.', { ms: 1800 });
  registra({ zona: k + 1, difficile: occ.difficile, tipo: occ.tipo || (occ.difficile && Number(cfg().livello) === 1 ? 'modello_osservato' : 'da_solo'), forma: occ.forma, grado: occ.grado || '', grazie: occ.grazie || (saluto === 't' ? 'si' : saluto === 'r' ? 'sgarbo' : saluto ? 'no' : ''), aiuto: occ.aiuto, chiamata: occ.chiamata, latenzaMs: occ.latenzaMs ?? null, frustrazione: occ.frustrazione ?? occ.frustrazioneSD ?? null, errori: occ.errori, colpi: occ.colpi, respiri: occ.respiri, scortesi: occ.scortesi, scuse: occ.scuse || 0, primaDiProvare: occ.primaDiProvare, nonNecessario: occ.nonNecessario || 0, attesaS: occ.attesaS || 0, fiducia: A.fiducia, amico: A.inSquadra ? 1 : 0, esito: 'aperto', tempoS });
  caption('Dietro il cancello, una targhetta d\'ottone: ' + TAPPE[k].targa);
  cam.modo = 'segui';
  await cammina(0, CANCELLO_Z[k] - 3);
  await cammina(0, k === TAPPE.length - 1 ? CUPOLA_Z + 9.5 : ZONE_Z[k + 1] - 1); P.faceTo(Math.PI);
  occupato = false;
  if (k < TAPPE.length - 1) iniziaZona(k + 1); else finale();
}
// lasciar perdere: si torna a casa, il cancello resta chiuso, il segreto pure
async function molla() {
  if (!occ || occ.fine) return;
  occ.fine = true; occupato = true; liberi = false; setAttivi({}); clearTimeout(sdTimer); aiutoVisibile = null; zittisci();
  registra({ zona: zona + 1, difficile: occ.difficile, tipo: occ.difficile ? (occ.chiesto ? occ.tipo : 'problema') : 'lasciato', scelta: 'molla', forma: occ.forma, aiuto: occ.aiuto, latenzaMs: occ.latenzaMs ?? null, frustrazione: Math.round(Frustrazione.v), errori: occ.errori, colpi: occ.colpi, respiri: occ.respiri, scortesi: occ.scortesi, esito: 'molla', tempoS: Math.round((performance.now() - occ.t0) / 1000) });
  await parla(P, 'Basta. Me ne torno a casa.', { ms: 1800 });
  caption(N() + ' se ne va. Il cancello resta chiuso, e la cupola tiene il suo segreto un giorno in più.');
  await P.walkTo(P.root.position.x, ZONE_Z[zona] + 2.5); await sleep(1800); caption('');
  occupato = false; iniziaZona(zona, true);
}
async function colpisci() {
  if (!occ || occ.fine || $('pannello').classList.contains('rotto')) return;
  occ.colpi++; S.colpi++; save();
  chiudiPannello(); occupato = true; liberi = false; setAttivi({});
  P.faceTo(Math.PI); await P.play('kick', { once: true }); P.play('idle');
  noise(.35, .35, 2200); tone(90, .3, 'sawtooth', .08); scintille();
  Frustrazione.spinta(14);
  caption('Il pannello fa scintille e si blocca per qualche secondo.');
  $('pannello').classList.add('rotto'); setTimeout(() => $('pannello').classList.remove('rotto'), 8000);
  // chi guarda ci resta male: è il parco di tutti
  const A = aiutante();
  if (!A.inSquadra) { A.fiducia--; A.p.play('idle'); A.p.faceTo(Math.atan2(P.root.position.x - A.p.root.position.x, P.root.position.z - A.p.root.position.z)); await parla(A.p, 'Ehi! Piano con quel pannello: è di tutti.', { ms: 2300 }); A.p.play('interactStanding'); }
  occupato = false; liberi = true; etichette();
}
async function modeling() {
  // livello 1: il protagonista chiede aiuto da solo, con gentilezza; il giocatore guarda come si fa
  occ.tipo = 'modello_osservato'; occ.chiesto = true; occ.aiuto = 'modello'; occ.forma = 'gentile'; liberi = false; occupato = true; richiestaInCorso = true; chiudiPannello(); setAttivi({});
  const A = aiutante();
  caption('Guarda che cosa fa ' + N() + ' quando è bloccato.'); await sleep(2600);
  await parla(P, 'Da solo qui non ne esco. Provo a chiedere a ' + A.nome + '.');
  const [x, z, r] = PUNTI.aiutante.luogo(); await cammina(x, z); P.faceTo(r); A.p.faceTo(-Math.PI / 2 - .3); A.p.play('idle');
  await parla(P, 'Scusa ' + A.nome + ', mi daresti una mano? ' + enigma.bisogno); caption('');
  A.fiducia++;
  await aiutoDato(A, true, true); liberi = true; occupato = false; richiestaInCorso = false;
  caption('Ha chiesto con gentilezza, ha detto di preciso che cosa gli serviva, e ha ringraziato. Ora finisci tu.');
}
async function finale() {
  objective(''); liberi = false; Frustrazione.porta(4);
  const n = squadra.length, spicchi = Math.min(5, n + 1);
  cam.modo = 'finale';
  caption('La cupola. La chiave d\'ottone gira nella serratura con un clac che aspettava da trent\'anni.'); await sleep(DEBUG ? 800 : 6500);
  squadra.forEach((a, i) => { a.p.walkTo(-3 + i * 2, CUPOLA_Z + 8.2); });
  caption(n ? 'Dentro ci sono cinque manovelle, una per ogni spicchio del tetto. ' + N() + (n === 1 ? ' e ' + squadra[0].nome : ' e i suoi ' + n + ' amici') + ' ne afferrano una a testa.' : 'Dentro ci sono cinque manovelle, una per ogni spicchio del tetto. ' + N() + ' è da solo: ne può girare una.');
  tween(t => parco.cupola.sera(t), 0, 1, 9000);
  await parco.cupola.apri(spicchi, tween); jingle.win();
  await sleep(DEBUG ? 500 : 3500);
  caption('Al centro, un telescopio enorme, e un ultimo biglietto: «Il tesoro non l\'ho nascosto: l\'ho diviso. A ognuno dei miei amici ne ho lasciato un pezzo. Se stai leggendo, li hai già incontrati.»'); await sleep(DEBUG ? 800 : 12500);
  const chieste = S.prove.filter(t => t.difficile && ['indipendente', 'anticipata', 'con_aiuto'].includes(t.tipo)).length;
  $('endTitle').textContent = spicchi === 5 ? 'Il cielo intero' : spicchi + ' spicchi di cielo su 5';
  $('endLead').innerHTML = (spicchi === 5 ? 'La cupola si è aperta tutta, e sopra il parco si sono accese le stelle di Ottavio.' : 'La cupola si è aperta solo in parte: gli altri spicchi si muovono soltanto con più mani alle manovelle. Domani i custodi saranno ancora lì.')
    + '<br>XP: <b>' + xp + '</b> · Amici arrivati fin qui: <b>' + (squadra.map(a => a.nome).join(', ') || 'nessuno') + '</b>';
  S.fine = new Date().toISOString(); S.xp = xp; S.amici = n; S.spicchi = spicchi; S.chieste = chieste; save();
  caption(''); overlay('end', true); $('stats').style.display = 'none'; $('anger').style.display = 'none'; $('signals').style.display = 'none';
}

/* ------------------------------------------------------------------ effetti */
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
  if (cam.modo === 'intro') { wp.set(3.5, 3.2, 9.5); wl.set(0, 2.2, -20); }
  else if (cam.modo === 'finale') { wp.set(9, 5.5, CUPOLA_Z + 21); wl.set(0, 4.6, CUPOLA_Z); }
  else { wp.set(p.x * .45, 8.4, p.z + 8.2); wl.set(p.x * .7, .4, p.z - 1.2); }
  const k = cam.salta ? 1 : 1 - Math.exp(-dt * (cam.modo === 'finale' ? 1.2 : 3)); cam.salta = false;
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
  if (!P || !parco || !freccia) return;
  P.update(dt); AIUTANTI.forEach(a => a.p && a.p.update(dt));
  parco.vivi.forEach(f => f(dt, tempo)); parco.seguiOmbra(P.root.position.x, P.root.position.z - 3);
  if (occ && !occ.fine) {
    // la frustrazione nasce dall'enigma: ogni tentativo andato male pesa, e restare bloccati davanti al pannello anche
    if (pannelloAperto && occ.difficile && !occ.aiutato && !occupato) tempoPannello += dt;
    Frustrazione.base = clamp(12 + occ.peso * (occ.difficile ? 15 : 6) + (occ.difficile ? Math.min(16, tempoPannello * .14) : 0), 0, 76);   // da sola la situazione arriva all'arancione; il rosso solo con i picchi
    Frustrazione.tetto = occ.difficile ? 100 : 55;
    if (occ.difficile && !occ.sdT && !occ.chiesto && occ.errori >= 1 && Frustrazione.zona >= 3 && !occupato) inizioSD();
    if (Frustrazione.zona >= 3 && tempo - ultimoBattito > (Frustrazione.zona === 4 ? .55 : .85)) { ultimoBattito = tempo; heartbeat(); }
  }
  Frustrazione.update(dt); Musica.frustrazione(Frustrazione.v);
  // con la testa calda si vede peggio: il pannello si annebbia finché la frustrazione non scende
  $('pEnigma').classList.toggle('nebbia', Frustrazione.zona >= 3);
  // gli amici seguono il protagonista
  if (cam.modo !== 'finale') squadra.forEach((a, i) => { const q = a.p.root.position, tx = P.root.position.x + (i % 2 ? 1.1 : -1.1) * (1 + (i >> 1) * .7), tz = P.root.position.z + 1.3 + i * .6; const d = Math.hypot(tx - q.x, tz - q.z); if (d > 1.6 && !a.p.target) a.p.walkTo(tx, tz, { run: d > 4 }); });
  for (let i = sc.length - 1; i >= 0; i--) { const s = sc[i]; s.t -= dt; s.v.y -= 9 * dt; s.m.position.addScaledVector(s.v, dt); if (s.t <= 0) { scene.remove(s.m); sc.splice(i, 1); } }
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
  $('homeLead').textContent = 'In fondo al Parco dei Tigli c\'è una cupola chiusa da trent\'anni. ' + N() + ' ha trovato la chiave. Quattro cancelli, quattro enigmi, quattro custodi.';
  cam.modo = 'intro'; P.root.position.set(0, 0, 1.5); P.root.rotation.y = 0;
  AIUTANTI.forEach((a, k) => piazzaAiutante(k));
  $('startBtn').onclick = () => iniziaGioco();
  $('endBtn').onclick = () => { overlay('end', false); Musica.ferma(); AIUTANTI.forEach((a, k) => piazzaAiutante(k)); parco.cancelli.forEach(c => c.apri(false)); parco.cupola.chiudi(); overlay('home', true); cam.modo = 'intro'; cam.salta = true; P.root.position.set(0, 0, 1.5); P.root.rotation.y = 0; };
  initTerapista({ onClose: () => {} });
  if (DEBUG) window.__app = { THREE, scene, camera, renderer, P, AIUTANTI, parco, Frustrazione, Musica, get occ() { return occ; }, get zona() { return zona; }, get S() { return S; }, get enigma() { return enigma; }, get liberi() { return liberi; }, get occupato() { return occupato; }, iniziaZona, apriPannello, chiediAiuto, molla, colpisci, cfg };
})();

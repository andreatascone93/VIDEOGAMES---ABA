// La scatola degli enigmi del nonno e la richiesta di aiuto (comunicazione funzionale: chiedere invece di mollare).
// Contingenze (vedi docs/principi.md):
//   MO  una serratura difficile: manca qualcosa che ha solo una persona di casa. Gli errori si accumulano, la rabbia sale
//   SD  Francesco è bloccato (almeno un tentativo andato male) e la rabbia è in arancione
//   R   andare dalla persona giusta e chiedere, con gentilezza e dicendo di preciso che cosa serve
//   R+  l'aiuto arriva davvero: pieno se la richiesta è gentile e precisa, il minimo se è brusca; la serratura la apre lui
//   alternative, con le loro conseguenze naturali: lasciar perdere (il regalo resta chiuso), sbattere la scatola (si blocca),
//   esplodere (la mamma la mette via fino a domani), rispondere male (niente aiuto finché non chiede con calma)
// Il gioco non dice mai "chiedi aiuto": lo fa solo l'aiuto programmato del livello (modello, subito, in ritardo).
// Il modulo riceve dal gioco un contesto `c` (personaggi, casa, camminate, camera) e non sa niente della storia del tablet.
import { $, cfg, sleep, clamp, tone, jingle, speak, caption, detto, objective, overlay, toast } from './core.js';
import { Rabbia } from './rabbia.js';
import { ENIGMI } from './enigmi.js';
import { creaScatola, SCATOLA } from './scatola.js';
import { dici, zitto } from './narrazione.js';
import { TORRE } from './salone.js';
import { NARRA, SCRITTE, VOCI, AIUTANTI, ENIGMI_TESTI, RICHIESTA, risposta } from './testi.js';

export function creaAiuto(c) {
  const { P, L, LS, PUNTI } = c;
  const scatola = creaScatola(); c.scene.add(scatola.gruppo);
  // dove sta Francesco: in piedi davanti alla scatola, seduto per terra a risolvere, dalle persone a cui chiedere
  L.scatola = { x: SCATOLA.x, z: SCATOLA.z - .64, rot: 0 };
  L.scatolaSeduto = { x: SCATOLA.x, y: -.38, z: SCATOLA.z - .52, rot: 0, da: L.scatola };
  LS.studio = { x: 1.5, z: -.78, rot: Math.PI / 2 };   // a un passo dalla porta: quando il papà esce, i due non si pestano i piedi
  LS.daGiulia = { x: TORRE.x, z: TORRE.z - 1.0, rot: .6 };
  const ACCANTO = { x: SCATOLA.x + .73, z: SCATOLA.z - .35 };   // dove si mette chi aiuta, accanto alla scatola
  PUNTI.scatola = { obj: () => scatola.gruppo, h: .78, luogo: () => L.scatola };
  PUNTI.giulia = { obj: () => c.giulia.root, h: 1.2, rel: true, luogo: () => LS.daGiulia };
  PUNTI.studio = { obj: () => c.sal.portaCorridoio, h: 1.75, off: [-.45, 0, .45], luogo: () => LS.studio };
  const AIUT = {
    mamma: { ...AIUTANTI.mamma, chiave: 'mamma', p: c.mamma, punto: 'mamma', etichetta: 'mamma', posto: LS.daMamma, camera: () => c.fissa([-.6, 1.75, 1.7], [-1.25, .9, -1.9]) },
    papa: { ...AIUTANTI.papa, chiave: 'papa', p: c.papa, punto: 'studio', etichetta: 'studio', posto: LS.studio, camera: () => c.fissa([1.0, 2.2, 3.0], [2.1, 1.05, -.6]) },
    giulia: { ...AIUTANTI.giulia, chiave: 'giulia', p: c.giulia, punto: 'giulia', etichetta: 'giulia', posto: LS.daGiulia, camera: () => c.fissa([TORRE.x + .15, 1.7, TORRE.z + 3.5], [TORRE.x, .7, TORRE.z]) }
  };

  let occ = null, enigma = null, presente = null;        // l'occasione in corso, il suo enigma, chi sta aiutando accanto alla scatola
  let pannelloAperto = false, occupato = false, aiutoVisibile = null, sdTimer = null, tempoPannello = 0;
  const S = () => c.S();
  const conEnigmi = () => cfg().percorso !== 'tablet';
  const difficile = k => k >= 4 - clamp(Math.round(Number(cfg().difficili)) || 0, 0, 4);   // le ultime N serrature
  const aiutante = () => AIUT[ENIGMI_TESTI[occ ? occ.k : S().scatola.serr].aiutante];
  const mischia = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const verso = (chi, x, z, ms = 220) => chi.faceTo(Math.atan2(x - chi.root.position.x, z - chi.root.position.z), ms);
  const guardatevi = A => { const a = A.p.root.position, b = P.root.position; if (A.chiave === 'papa') verso(A.p, b.x, b.z); verso(P, a.x, a.z); };
  const inquadra = () => c.fissa([SCATOLA.x - 1.55, 1.6, SCATOLA.z + 2.7], [SCATOLA.x + .15, .48, SCATOLA.z - .3], false, { sx: .2, sy: .5, psy: .2 });

  /* ---------------------------------------------------------------- sessione */
  function nuovaSessione() {
    chiudi(); S().scatola = { serr: 0, aperta: false, vista: false }; S().grazie = 0; S().scortesi = 0;
    scatola.reset(0, conEnigmi());
  }
  // chiude tutto senza registrare niente (ritorno al menu, nuova sessione)
  function chiudi() {
    clearTimeout(sdTimer); occ = null; enigma = null; presente = null; occupato = false; aiutoVisibile = null;
    Rabbia.tetto = 100;
    chiudiPannello(); overlay('lettera', false); $('attesa').style.display = 'none'; $('pannello').classList.remove('rotto'); $('bAiuto').classList.remove('hot', 'freccia'); $('bAiuto').disabled = false;
  }
  const finita = () => !conEnigmi() || !!(S() && S().scatola && S().scatola.aperta);
  const ostacolo = () => scatola.gruppo.visible ? [SCATOLA.x - SCATOLA.larga / 2 - .06, SCATOLA.z - SCATOLA.fonda / 2 - .06, SCATOLA.x + SCATOLA.larga / 2 + .06, SCATOLA.z + SCATOLA.fonda / 2 + .06] : null;

  /* ---------------------------------------------------------------- le scelte nel mondo */
  function etichette(m, fase, luogo) {
    const s = S(); if (!s || !s.scatola || finita()) return;
    const libera = fase === 'inizio' || fase === 'prossimo';
    if (luogo === 'cameretta' && scatola.gruppo.visible && (libera || fase === 'enigma'))
      m.scatola = { testo: occ ? 'Torna alla serratura' : s.scatola.serr ? 'Apri la prossima serratura' : 'Apri la scatola del nonno', hot: libera, azione: apri };
    if (fase !== 'enigma' || !occ || occ.fine || occ.aiutato) return;   // chi ha già aiutato è accanto alla scatola
    // con una serratura in corso si può andare a parlare con chi ha quello che manca
    const A = aiutante(), on = !!aiutoVisibile, full = aiutoVisibile === 'completo';
    if (luogo === 'salone') m[A.etichetta] = { punto: A.punto, testo: A.parla, hot: on, freccia: full, azione: () => chiedi('persona') };
    else if (m.salone && on) { m.salone.hot = true; m.salone.freccia = full; }
  }

  /* ---------------------------------------------------------------- aprire la scatola: il pannello dell'enigma */
  function nuova() {
    const k = S().scatola.serr, dif = difficile(k);
    enigma = ENIGMI[k]({ difficile: dif, errore: erroreEnigma, risolto: enigmaRisolto });
    occ = { k, difficile: dif, t0: performance.now(), errori: 0, peso: 0, colpi: 0, furia: 0, respiri: 0, scortesi: 0, primaDiProvare: 0, nonNecessario: 0, chiesto: false, fine: false, aiuto: null, forma: null };
    tempoPannello = 0; aiutoVisibile = null; presente = null; clearTimeout(sdTimer); $('pannello').classList.remove('rotto');
    c.debug.enigma = enigma; c.debug.occ = occ;
  }
  function disegnaIndizio() {
    const cv = $('pIndizio'), g = cv.getContext('2d'), W = cv.width, H = cv.height;
    g.fillStyle = '#f4e8c6'; g.fillRect(0, 0, W, H); g.strokeStyle = '#8a6a3c'; g.lineWidth = 8; g.strokeRect(10, 10, W - 20, H - 20);
    g.textBaseline = 'alphabetic'; enigma.disegnaIndizio(g, W, H);
  }
  function apriPannello() {
    if (!enigma) return;
    pannelloAperto = true; $('pTitolo').textContent = SCRITTE.serratura(occ.k).toUpperCase();
    const box = $('pEnigma'); box.innerHTML = ''; box.appendChild(enigma.el);
    $('bAiuto').textContent = occ.aiutato ? 'Aiuto ricevuto' : 'Chiedi aiuto ' + aiutante().a; $('bAiuto').disabled = !!occ.aiutato;   // l'aiuto per questa serratura si chiede una volta
    disegnaIndizio(); overlay('pannello', true); document.body.classList.add('inpannello'); c.setAttivi({}); c.fermo(); objective(''); aggiornaAiuto(); adatta();
  }
  // su uno schermo piccolo l'enigma si rimpicciolisce quanto basta per stare tutto nel suo riquadro
  function adatta() {
    const box = $('pEnigma'), e = box.firstElementChild; if (!e || !pannelloAperto) return;
    e.style.transform = '';
    const cs = getComputedStyle(box), w = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), a = box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    let largo = 1; for (const f of e.children) largo = Math.max(largo, f.offsetWidth);
    const k = Math.min(1, w / largo, a / Math.max(1, e.offsetHeight));
    if (k < .995 && k > 0) e.style.transform = 'scale(' + k.toFixed(3) + ')';
  }
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(adatta).observe($('pEnigma')); else addEventListener('resize', adatta);
  function chiudiPannello() { pannelloAperto = false; overlay('pannello', false); document.body.classList.remove('inpannello'); }
  async function apri() {
    if (c.fase() !== 'enigma') c.fase('enigma');
    caption('');
    if (!occ) nuova();
    await c.siedi(L.scatolaSeduto); inquadra();
    if (!S().scatola.vista) { S().scatola.vista = true; caption(NARRA.scatolaPrima()); }
    apriPannello();
  }
  $('bAiuto').onclick = () => { if (occupato || !occ || occ.aiutato) return; jingle.click(); chiedi('pannello'); };
  $('bRespira').onclick = () => { if (occupato || !occ) return; jingle.click(); respira(); };
  $('bMolla').onclick = () => { if (occupato || !occ) return; jingle.click(); molla(); };
  $('bColpisci').onclick = () => { if (occupato || !occ) return; colpisci(); };
  $('bVia').onclick = async () => { if (occupato || !occ) return; jingle.click(); occupato = true; chiudiPannello(); await c.alzatiAnimato(); occupato = false; c.entrato(); };

  function erroreEnigma(peso) { if (!occ) return; occ.errori++; occ.peso += peso; Rabbia.spinta(occ.difficile ? 12 : 7); }

  // a ogni fotogramma: la rabbia segue la situazione (errori accumulati, tempo passato bloccato), e apre l'occasione
  function update(dt) {
    if (!occ || occ.fine) return;
    if (pannelloAperto && occ.difficile && !occ.aiutato && !occupato) tempoPannello += dt;
    // da sola la situazione (errori, tempo passato bloccato) arriva all'arancione e lì si ferma. Al rosso si arriva solo
    // sbattendo la scatola: ogni colpo aggiunge furia; il primo è un avvertimento, dal secondo in poi si può esplodere
    Rabbia.base = clamp(clamp(12 + occ.peso * (occ.difficile ? 15 : 6) + (occ.difficile ? Math.min(16, tempoPannello * .14) : 0), 0, 76) + occ.furia, 0, 100);
    Rabbia.tetto = occ.colpi >= 2 ? 100 : occ.colpi ? 92 : 79;
    if (occupato) return;
    if (occ.difficile && !occ.sdT && !occ.chiesto && occ.errori >= 1 && Rabbia.zona >= 3) inizioSD();
    if (Rabbia.v >= 95 && occ.colpi >= 2) rovescia();
  }

  /* ---------------------------------------------------------------- aiuti programmati (gerarchia e sfumatura) */
  function aggiornaAiuto() {
    const on = !!aiutoVisibile, full = aiutoVisibile === 'completo';
    $('bAiuto').classList.toggle('hot', on); $('bAiuto').classList.toggle('freccia', full && pannelloAperto);
    if (!pannelloAperto && !occupato && c.fase() === 'enigma' && occ && !occ.fine) c.etichette();
  }
  function daiAiuto(tipo) {
    if (!occ || occ.chiesto || occ.fine) return;
    aiutoVisibile = tipo; occ.aiuto = occ.aiuto === 'completo' ? 'completo' : tipo; aggiornaAiuto();
    if (tipo === 'completo') speak(NARRA.promptAiuto()[aiutante().chiave], { accoda: true });
  }
  function inizioSD() {
    occ.sdT = performance.now(); occ.rabbiaSD = Math.round(Rabbia.v);
    const lv = S().livello;
    caption(NARRA.sdAiuto());
    clearTimeout(sdTimer);
    if (lv === 1) { modeling(); return; }
    if (lv === 2) sdTimer = setTimeout(() => daiAiuto(S() ? S().aiuto : 'completo'), 1800);
    else sdTimer = setTimeout(() => daiAiuto('parziale'), cfg().secondiAiutoRitardato * 1000);
  }

  /* ---------------------------------------------------------------- stare bene con sé stessi: il respiro */
  async function respira() {
    occupato = true; occ.respiri++; chiudiPannello(); c.camera_('pausa');
    const n = Math.max(1, Number(cfg().respiri)), b = $('breath'), tx = $('breathText'), cnt = $('breathCount');
    overlay('breathOv', true);
    for (let i = 0; i < n; i++) {
      cnt.textContent = 'RESPIRO ' + (i + 1) + ' DI ' + n;
      tx.textContent = 'Inspira…'; b.style.transform = 'scale(1.55)'; tone(196, 2.6, 'sine', .05); await sleep(3000);
      tx.textContent = 'Espira…'; b.style.transform = 'scale(1)'; tone(147, 2.6, 'sine', .05); await sleep(3000);
      if (!occ) break;
      // ogni respiro toglie un po' di peso: la rabbia scende passo dopo passo, non di colpo
      occ.peso = Math.max(0, occ.peso - 1); occ.furia = Math.max(0, occ.furia - 8); tempoPannello = Math.max(0, tempoPannello - 40); Rabbia.spinta(-6);
    }
    overlay('breathOv', false); tx.textContent = ''; cnt.textContent = '';
    occupato = false; if (occ && !occ.fine) { inquadra(); apriPannello(); }
  }

  /* ---------------------------------------------------------------- la richiesta di aiuto */
  // Francesco va dalla persona: attraversa la casa fino a lei
  async function raggiungi(A) {
    if (c.luogo() !== 'salone') await c.attraversa(P);
    await c.vaiA(A.posto);
  }
  // la chiama (dal papà si bussa: è nel suo studio) e lei si volta
  async function presentati(A) {
    A.camera();
    if (A.chiave === 'papa') { tone(240, .06, 'square', .08); tone(240, .06, 'square', .08, .22); await sleep(500); }
    await dici(P, RICHIESTA.chiama(A.chiave), { ms: 900 });
    if (A.chiave === 'papa') await c.esceDalloStudio();
    guardatevi(A);
    await dici(A.p, risposta(A.chiave, 'eccomi'));
  }
  function scegliFrase(opz) {
    return new Promise(ok => {
      const box = $('dialogo'); box.innerHTML = '';
      const t = document.createElement('div'); t.className = 't'; t.textContent = SCRITTE.cosaDice().toUpperCase(); box.appendChild(t);
      opz.forEach(([k, testo]) => { const b = document.createElement('button'); b.className = 'batt'; b.dataset.k = k; b.textContent = k === 'z' ? testo : '«' + testo + '»'; b.onclick = () => { jingle.click(); box.classList.remove('active'); ok(k); }; box.appendChild(b); });
      box.classList.add('active');
    });
  }
  async function chiedi(origine) {
    if (!occ || occ.fine || occupato || occ.aiutato) return;
    const A = aiutante(); occupato = true; c.blocca(); c.setAttivi({}); caption(''); objective('');
    if (occ.tChiedi == null) occ.tChiedi = performance.now();
    let esito = null;
    try {
      if (A.p.rientro) await A.p.rientro;   // sta ancora tornando al suo posto dopo l'aiuto di prima
      if (origine === 'pannello') { chiudiPannello(); await c.alzatiAnimato(); c.camera_('stanza'); await raggiungi(A); }
      await presentati(A);
      esito = await dialogo(A, origine);
    } finally { occupato = false; }
    if (esito === 'aiuto' || !occ || occ.fine) return;
    if (A.chiave === 'papa') A.p.rientro = c.rientraNelloStudio();
    c.entrato();
  }
  // le frasi tra cui scegliere: la stessa scelta sia partendo dalla scatola sia andando dalla persona
  async function dialogo(A, origine) {
    const a = A.chiave, k = occ.k, G = RICHIESTA.gentile(k), B = RICHIESTA.brusca(k), V = RICHIESTA.vaga(), SG = RICHIESTA.scortese(), NN = RICHIESTA.niente();
    let opz = mischia([['g', G], ['b', B], ['v', V], ['s', SG]]);
    if (S().livello === 2 && aiutoVisibile === 'completo' && occ.sdT) opz = [['g', G], ...opz.filter(o => o[0] !== 'g')];   // aiuto completo: la frase gentile per prima
    opz.push(['n', NN]);
    let scelta = await scegliFrase(opz);
    if (scelta === 'n') { await dici(P, NN); await dici(A.p, risposta(a, 'niente')); return 'niente'; }
    const forma = { g: 'gentile', b: 'brusca', v: 'gentile', s: 'scortese' }[scelta];
    if (scelta === 's') {
      // una risposta sgarbata conta come richiesta (c'è stata), ma non porta aiuto
      if (occ.difficile && !occ.chiesto && occ.errori > 0) segnaRichiesta(forma, origine);
      await dici(P, SG); occ.scortesi++; S().scortesi++;
      await dici(A.p, risposta(a, 'scortese')); return 'scortese';
    }
    const detta = scelta === 'g' ? G : scelta === 'b' ? B : V;
    if (!occ.difficile) { await dici(P, detta); await dici(A.p, risposta(a, 'daSolo')); occ.nonNecessario++; return 'daSolo'; }
    if (occ.errori === 0 && cfg().provaPrima) { await dici(P, detta); await dici(A.p, risposta(a, 'provaPrima')); occ.primaDiProvare++; return 'provaPrima'; }
    if (!occ.chiesto) segnaRichiesta(forma, origine);
    if (scelta === 'v') {
      // ha chiesto per favore, ma non ha detto che cosa gli serve: la persona glielo domanda
      await dici(P, V); await dici(A.p, risposta(a, 'cheServe'));
      scelta = await scegliFrase(mischia([['g', G], ['b', B]]));
      if (scelta === 'b' && occ.forma === 'gentile') scelta = 'g2';   // la gentilezza l'ha già messa prima
    }
    await dici(P, scelta === 'b' || scelta === 'g2' ? B : G);
    await aiutoDato(A, scelta !== 'b');
    return 'aiuto';
  }
  function segnaRichiesta(forma, origine) {
    occ.chiesto = true; occ.forma = forma; occ.chiamata = origine; occ.rabbia = Math.round(Rabbia.v);
    occ.latenzaMs = occ.sdT ? Math.max(0, Math.round(occ.tChiedi - occ.sdT)) : null;
    occ.tipo = !occ.sdT ? 'anticipata' : occ.aiuto ? 'con_aiuto' : 'indipendente';
    clearTimeout(sdTimer); aiutoVisibile = null; aggiornaAiuto();
  }
  // chi aiuta viene fino alla scatola insieme a Francesco: lui davanti, lei (o lui) dietro
  async function accompagna(A) {
    const segue = (async () => {
      await sleep(A.chiave === 'mamma' ? 2300 : 300);
      await c.arriva(A.p); await c.attraversa(A.p);
      await c.cammina(ACCANTO.x, ACCANTO.z, { chi: A.p }); verso(A.p, SCATOLA.x, SCATOLA.z);
    })();
    c.camera_('stanza');
    if (c.luogo() !== 'cameretta') await c.attraversa(P, { tieniAperta: true });
    await c.vaiA(L.scatola); await segue;
  }
  // la persona dà quello che manca (aiuto minimo) o anche un suggerimento in più (aiuto pieno), poi lascia finire a lui
  async function aiutoDato(A, pieno, modello = false) {
    const a = A.chiave, e = ENIGMI_TESTI[occ.k];
    occ.aiutato = true; occ.grado = pieno ? 'pieno' : 'minimo';
    if (S().livello === 4 && !modello) {
      // livello 4: l'aiuto non arriva subito (tolleranza all'attesa dopo aver chiesto)
      await dici(A.p, risposta(a, 'attesa'));
      const s = Math.max(1, Number(cfg().attesaAiuto) || 6), fine = performance.now() + s * 1000, el = $('attesa');
      while (performance.now() < fine) { el.textContent = SCRITTE.arriva(A.Nome, Math.ceil((fine - performance.now()) / 1000)); el.style.display = 'block'; await sleep(200); }
      el.style.display = 'none'; occ.attesaS = s;
    } else await dici(A.p, risposta(a, pieno ? 'certo' : 'vaBene'));
    if (a === 'giulia') dici(c.leo, VOCI.leo.tengo(), { ms: 1800 });
    await accompagna(A);
    A.p.play('interactStanding', { once: true, speed: 1.3 }).then(() => A.p.play('idle'));
    await sleep(520); enigma.sblocca(pieno); tone(880, .12, 'triangle', .08); c.fissa([SCATOLA.x - .3, 1.75, SCATOLA.z + 3.0], [SCATOLA.x + .3, .7, SCATOLA.z - .3]);
    await dici(A.p, pieno ? e.rivelaPieno : e.rivela);
    // e dopo l'aiuto: grazie, niente, o uno sgarbo
    const k = modello ? 't' : await scegliFrase(mischia([['t', RICHIESTA.grazie(a)], ['z', SCRITTE.zitto()], ['r', RICHIESTA.eraOra()]]));
    guardatevi(A);
    if (k === 't') { await dici(P, RICHIESTA.grazie(a)); S().grazie++; occ.grazie = 'si'; await dici(A.p, risposta(a, 'prego')); }
    else if (k === 'r') { await dici(P, RICHIESTA.eraOra()); occ.grazie = 'sgarbo'; await dici(A.p, risposta(a, 'pregoSgarbo')); }
    else occ.grazie = 'no';
    occ.peso = Math.min(occ.peso, 1); occ.furia = 0; tempoPannello = 0; presente = A;
    verso(A.p, SCATOLA.x, SCATOLA.z); P.faceTo(0, 200); await sleep(220);
    await c.siedi(L.scatolaSeduto); inquadra(); apriPannello();
  }
  // chi ha aiutato torna al suo posto mentre la storia va avanti
  async function torna(A) {
    const p = A.p, g = c.giro();
    await c.cammina(1.55, .6, { chi: p }); if (g !== c.giro()) return;
    await c.attraversa(p); if (g !== c.giro()) return;
    await c.rientra(p);
  }

  /* ---------------------------------------------------------------- esiti */
  function registra(tipo, extra = {}) {
    c.record(tipo, { ambito: 'aiuto', enigma: occ.k + 1, difficile: occ.difficile, forma: occ.forma || '', grado: occ.grado || '', grazie: occ.grazie || '', aiuto: occ.aiuto || 'nessuno', chiamata: occ.chiamata || '',
      latenzaMs: occ.latenzaMs ?? null, rabbia: occ.rabbia ?? occ.rabbiaSD ?? Math.round(Rabbia.v), errori: occ.errori, colpi: occ.colpi, respiri: occ.respiri, scortesi: occ.scortesi,
      primaDiProvare: occ.primaDiProvare, nonNecessario: occ.nonNecessario, attesaS: occ.attesaS || 0, tempoS: Math.round((performance.now() - occ.t0) / 1000), ...extra });
  }
  const chiusura = () => { occ.fine = true; occupato = true; Rabbia.tetto = 100; c.blocca(); clearTimeout(sdTimer); aiutoVisibile = null; $('bAiuto').classList.remove('hot', 'freccia'); chiudiPannello(); c.setAttivi({}); objective(''); };
  async function enigmaRisolto() {
    if (!occ || occ.fine) return;
    chiusura();
    const s = S(), k = occ.k, A = presente;
    Rabbia.porta(6);
    c.fissa([SCATOLA.x - .5, 1.5, SCATOLA.z + 2.3], [SCATOLA.x + .1, .4, SCATOLA.z - .2]);
    await scatola.serratura(k);
    const premio = (occ.aiutato ? 100 : 60) + (occ.forma === 'gentile' ? 20 : 0); c.punti(premio); toast('+' + premio + ' XP', 1800); jingle.win();
    registra(occ.tipo || 'da_solo', { esito: 'aperta' });
    s.scatola.serr = k + 1;
    if (A) { await dici(A.p, risposta(A.chiave, 'fatta')); A.p.rientro = torna(A); }
    caption(NARRA.serraturaAperta()[k]); await detto(2600);
    occ = null; enigma = null; presente = null;
    if (k === 3) { await finale(); return; }
    await c.alzatiAnimato(); occupato = false;
    c.avanti(SCRITTE.restano(k + 1), false);
  }
  // l'ultima serratura: il coperchio si alza, dentro c'è la lettera del nonno e un regalo vero (non punti: una cosa da fare insieme)
  async function finale() {
    const s = S();
    c.fissa([SCATOLA.x - .25, 1.35, SCATOLA.z + 1.9], [SCATOLA.x, .3, SCATOLA.z]);
    await scatola.apri();
    caption(NARRA.coperchio()); await detto(3000);
    caption(''); $('letteraTesto').textContent = NARRA.lettera().replace(/^«|»$/g, ''); overlay('lettera', true);
    speak(NARRA.lettera());
    await new Promise(ok => { $('letteraOk').onclick = () => { jingle.click(); ok(); }; });
    zitto(); overlay('lettera', false);
    s.scatola.aperta = true; c.punti(200); toast('+200 XP · 2 BIGLIETTI PER LA PISTA DEI KART', 2800); jingle.win();
    await c.alzatiAnimato(); P.play('jump', { once: true, speed: 1.1 }).then(() => P.play('idle'));
    await sleep(1500); occupato = false;
    c.avanti(NARRA.dopoScatola());
  }
  // lasciar perdere: la serratura resta chiusa, e il regalo del nonno pure
  async function molla() {
    if (!occ || occ.fine) return;
    chiusura();
    registra(occ.difficile ? (occ.chiesto ? occ.tipo : 'rinuncia') : 'lasciato', { scelta: 'molla', esito: 'lasciata' });
    await c.alzatiAnimato(); c.camera_('stanza');
    await dici(P, RICHIESTA.basta());
    if (presente) presente.p.rientro = torna(presente);
    Rabbia.porta(30);
    const testo = NARRA.molla(); caption(testo); await detto(3200);
    occ = null; enigma = null; presente = null; occupato = false;
    c.avanti(testo, false);
  }
  // si alza e va a fare altro con una serratura in corso (prende il tablet): vale come lasciar perdere, senza scena
  function lascia(scelta) {
    if (!occ || occ.fine) return;
    clearTimeout(sdTimer); aiutoVisibile = null; Rabbia.tetto = 100; $('bAiuto').classList.remove('hot', 'freccia');
    registra(occ.difficile ? (occ.chiesto ? occ.tipo : 'rinuncia') : 'lasciato', { scelta, esito: 'lasciata' });
    if (presente) presente.p.rientro = torna(presente);
    occ = null; enigma = null; presente = null;
  }
  // sbattere la scatola: non apre niente, la blocca per qualche secondo e fa salire la rabbia
  function colpisci() {
    if ($('pannello').classList.contains('rotto')) return;
    occ.colpi++; occ.furia += 16; c.scossa(.12); Rabbia.spinta(14); scatola.scuoti();
    caption(NARRA.sbatte());
    $('pannello').classList.add('rotto'); setTimeout(() => $('pannello').classList.remove('rotto'), 8000);
  }
  // la rabbia è arrivata al rosso: Francesco rovescia la scatola. Arriva la mamma e la mette via fino a domani
  async function rovescia() {
    if (!occ || occ.fine) return;
    chiusura();
    registra('problema', { scelta: 'scatola', esito: 'rovesciata' });
    const altro = presente && presente.chiave !== 'mamma' ? presente : null;
    await c.alzatiAnimato(); c.camera_('stanza');
    P.faceTo(0, 150); P.play('kick', { once: true, speed: 1.5 }).then(() => P.play('idle')); await sleep(280);
    Rabbia.set(4); c.scossa(.15); await scatola.rovescia();
    caption(NARRA.rovescia()); await detto(2800);
    if (altro) { altro.p.rientro = torna(altro); await sleep(2500); }
    await c.vaiA({ x: .25, z: .35, rot: -2.2 });
    await c.visita(c.mamma, VOCI.mamma.scatola(), { prendi: async g => {
      await c.cammina(SCATOLA.x + .55, SCATOLA.z - .55, { chi: g }); verso(g, SCATOLA.x - .3, SCATOLA.z); await sleep(240);
      g.play('interactGround', { once: true, speed: 1.3 }).then(() => g.play('idle')); await sleep(750);
      scatola.gruppo.visible = false; tone(420, .07, 'triangle', .05); await sleep(500);
    } });
    Rabbia.set(3);
    caption(NARRA.dopoRovescia()); await detto(4400);
    await c.saltoDiTempo('Il giorno dopo');
    scatola.reset(S().scatola.serr, true);
    occ = null; enigma = null; presente = null; occupato = false;
    c.avanti(NARRA.scatolaTornata());
  }

  /* ---------------------------------------------------------------- livello 1: il modello */
  // Francesco chiede aiuto da solo, con gentilezza e dicendo che cosa gli serve; il giocatore guarda come si fa, poi finisce l'enigma
  async function modeling() {
    const A = aiutante(), a = A.chiave;
    occ.tipo = 'modello_osservato'; occ.chiesto = true; occ.aiuto = 'modello'; occ.forma = 'gentile'; occ.chiamata = 'modello';
    occupato = true; c.blocca(); chiudiPannello(); c.setAttivi({});
    try {
      await detto(2600);
      caption(NARRA.modelloAiuto()); await detto(2200);
      await c.alzatiAnimato(); c.camera_('stanza'); caption('');
      await dici(P, RICHIESTA.provo(a));
      if (A.p.rientro) await A.p.rientro;
      await raggiungi(A); await presentati(A);
      await dici(P, RICHIESTA.gentile(occ.k));
      await aiutoDato(A, true, true);
    } finally { occupato = false; }
    caption(NARRA.modelloAiutoDopo());
  }

  return { scatola, etichette, update, nuovaSessione, chiudi, finita, ostacolo, apri, chiedi, lascia,
    get occ() { return occ; }, get enigma() { return enigma; }, get occupato() { return occupato; }, get pannelloAperto() { return pannelloAperto; }, get presente() { return presente && presente.chiave; } };
}

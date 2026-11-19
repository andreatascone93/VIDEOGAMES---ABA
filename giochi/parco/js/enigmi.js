// Gli enigmi dei quattro cancelli: codice di simboli, tubi, memoria (carillon), mosaico (visuospaziale).
// Ognuno esiste in due versioni:
// - facile: si risolve da soli (prima il successo, poi la difficoltà);
// - difficile: manca qualcosa che ha solo il custode di quel cancello (un indizio, un attrezzo, una melodia, una tessera).
//   Da soli non si risolve: è l'occasione per chiedere aiuto. Il gioco non dice mai "chiedi aiuto": lo dice solo l'aiuto programmato.
// Ogni enigma restituisce { el, sblocca(pieno), disegnaIndizio(ctx, W, H), bisogno, brusca, rivela, rivelaPieno, tentativi }.
// sblocca(false) dà solo quello che manca; sblocca(true) aggiunge un suggerimento in più (l'aiuto che si riceve chiedendo con gentilezza).
// errore(peso, msg) a ogni tentativo sbagliato, risolto() alla fine. L'enigma non sa niente di ABA.
import { tone, jingle } from './core.js';

const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

/* ------------------------------------------------------------------ 1. codice di simboli */
const SIMBOLI = [
  { id: 'stella', c: '#ffc94a' }, { id: 'cerchio', c: '#4dabff' }, { id: 'triangolo', c: '#ff5d73' },
  { id: 'quadrato', c: '#6be08a' }, { id: 'rombo', c: '#b98bff' }, { id: 'croce', c: '#ff9a3d' }
];
function disegnaSimbolo(g, id, x, y, r, c) {
  g.fillStyle = c; g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = r * .1; g.beginPath();
  if (id === 'cerchio') g.arc(x, y, r, 0, 7);
  else if (id === 'quadrato') g.rect(x - r * .85, y - r * .85, r * 1.7, r * 1.7);
  else if (id === 'triangolo') { g.moveTo(x, y - r); g.lineTo(x + r, y + r * .8); g.lineTo(x - r, y + r * .8); g.closePath(); }
  else if (id === 'rombo') { g.moveTo(x, y - r); g.lineTo(x + r * .8, y); g.lineTo(x, y + r); g.lineTo(x - r * .8, y); g.closePath(); }
  else if (id === 'croce') { const a = r * .35; g.moveTo(x - a, y - r); g.lineTo(x + a, y - r); g.lineTo(x + a, y - a); g.lineTo(x + r, y - a); g.lineTo(x + r, y + a); g.lineTo(x + a, y + a); g.lineTo(x + a, y + r); g.lineTo(x - a, y + r); g.lineTo(x - a, y + a); g.lineTo(x - r, y + a); g.lineTo(x - r, y - a); g.lineTo(x - a, y - a); g.closePath(); }
  else { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); }
  g.fill(); g.stroke();
}
const iconaSimbolo = (s, px = 56) => { const c = document.createElement('canvas'); c.width = c.height = px * 2; disegnaSimbolo(c.getContext('2d'), s.id, px, px, px * .7, s.c); c.style.width = c.style.height = px + 'px'; return c; };
// macchia di fango / foglie che copre una parte dell'indizio
function fango(g, x, y, r) {
  g.fillStyle = '#5b4126';
  for (let i = 0; i < 14; i++) { const a = i / 14 * 7, q = r * (.7 + (i * 37 % 10) / 30); g.beginPath(); g.arc(x + Math.cos(a) * q * .5, y + Math.sin(a) * q * .5, q * .55, 0, 7); g.fill(); }
  g.fillStyle = 'rgba(40,28,16,.5)'; g.beginPath(); g.arc(x - r * .2, y - r * .1, r * .3, 0, 7); g.fill();
}

function codiceSimboli({ difficile, errore, risolto }) {
  const codice = [0, 3, 1, 4].map(i => SIMBOLI[i]);
  let coperti = difficile ? 2 : 0, inserito = [], bloccatoFino = 0, tentativi = 0;
  const el = h('div', 'enigma');
  el.appendChild(h('div', 'en-tit', 'Inserisci il codice del cartello'));
  const riga = h('div', 'en-codice'); el.appendChild(riga);
  const msg = h('div', 'en-msg', ''); el.appendChild(msg);
  const tasti = h('div', 'en-tasti'); el.appendChild(tasti);
  const disegnaRiga = () => { riga.innerHTML = ''; for (let i = 0; i < 4; i++) { const s = h('div', 'en-slot' + (inserito[i] ? ' on' : '')); if (inserito[i]) s.appendChild(iconaSimbolo(inserito[i], 42)); riga.appendChild(s); } };
  SIMBOLI.forEach(s => { const b = h('button', 'en-tasto'); b.appendChild(iconaSimbolo(s, 52)); b.onclick = () => premi(s); tasti.appendChild(b); });
  function premi(s) {
    if (performance.now() < bloccatoFino) { tone(160, .2, 'square', .05); return; }
    tone(500 + inserito.length * 90, .07, 'triangle', .07); inserito.push(s); disegnaRiga();
    if (inserito.length < 4) return;
    tentativi++;
    if (inserito.every((x, i) => x === codice[i])) { msg.textContent = 'Codice giusto!'; msg.className = 'en-msg ok'; jingle.win(); setTimeout(risolto, 700); return; }
    tone(180, .3, 'sawtooth', .06);
    const blocca = tentativi % 3 === 0;
    msg.className = 'en-msg ko'; msg.textContent = blocca ? 'Codice sbagliato tre volte: pannello bloccato per 8 secondi.' : 'Codice sbagliato.';
    if (blocca) { bloccatoFino = performance.now() + 8000; setTimeout(() => { if (msg.className === 'en-msg ko') msg.textContent = ''; }, 8000); }
    setTimeout(() => { inserito = []; disegnaRiga(); }, 600);
    errore(blocca ? 2 : 1, msg.textContent);
  }
  disegnaRiga();
  return {
    el, get tentativi() { return tentativi; },
    bisogno: 'Due simboli del cartello sono coperti dal fango e non li vedo.', brusca: 'dimmi i due simboli coperti dal fango.',
    disegnaIndizio(g, W, H) {
      g.fillStyle = '#1d2b3a'; g.font = '900 ' + H * .13 + 'px system-ui'; g.textAlign = 'center'; g.fillText('CODICE DEL ROSETO', W / 2, H * .25);
      codice.forEach((s, i) => disegnaSimbolo(g, s.id, W * (.2 + i * .2), H * .6, H * .15, s.c));
      for (let i = 0; i < coperti; i++) fango(g, W * (.6 + i * .2), H * .6, H * .2);
    },
    sblocca(pieno) { coperti = 0; if (pieno) { inserito = codice.slice(0, 2); disegnaRiga(); } },
    rivela: 'Dopo la stella e il quadrato ci sono il cerchio blu e il rombo viola.',
    rivelaPieno: 'Li ho visti stamattina, prima della pioggia: dopo la stella e il quadrato ci sono il cerchio blu e il rombo viola. Guarda, i primi due te li ho già messi io.'
  };
}

/* ------------------------------------------------------------------ 2. circuito da ricollegare */
// direzioni: 1 = nord, 2 = est, 4 = sud, 8 = ovest; una rotazione oraria sposta ogni apertura alla successiva
const ruota = (m, r) => { for (let i = 0; i < r; i++) m = ((m << 1) | (m >> 3)) & 15; return m; };
const DRITTO = 1 | 4, CURVA = 1 | 2;
const PERCORSO = { '1,0': 8 | 2, '1,1': 8 | 1, '0,1': 4 | 2, '0,2': 8 | 4, '1,2': 1 | 4, '2,2': 1 | 2 };   // entrata a ovest di (1,0), uscita a est di (2,2)
function circuito({ difficile, errore, risolto }) {
  const celle = [];
  let vite = difficile ? '0,2' : null, tentativi = 0, fatto = false, tocchiInutili = 0, ultimaVite = -1e9, guida = false;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const k = r + ',' + c, req = PERCORSO[k];
    const tipo = req ? ((req === 5 || req === 10) ? DRITTO : CURVA) : ((r + c) % 2 ? DRITTO : CURVA);
    let rot = (r * 3 + c * 2 + 1) % 4;
    if (req && ruota(tipo, rot) === req) rot = (rot + 1) % 4;   // nessun pezzo del percorso parte già giusto
    celle.push({ r, c, k, tipo, rot });
  }
  const el = h('div', 'enigma');
  el.appendChild(h('div', 'en-tit', 'Riporta l\'acqua alla fontana: tocca un tubo per girarlo'));
  const griglia = h('div', 'en-griglia'); el.appendChild(griglia);
  const msg = h('div', 'en-msg', ''); el.appendChild(msg);
  const svgPezzo = (m, acceso, bullone, traccia) => {
    const col = acceso ? '#4dc3ff' : '#7d8aa0', seg = { 1: 'M50 50 L50 0', 2: 'M50 50 L100 50', 4: 'M50 50 L50 100', 8: 'M50 50 L0 50' };
    let s = '<svg viewBox="0 0 100 100"><rect x="2" y="2" width="96" height="96" rx="12" fill="#1a2433" stroke="' + (traccia ? '#ffc94a' : '#33445c') + '" stroke-width="' + (traccia ? 6 : 3) + '"/>';
    if (acceso) for (const b of [1, 2, 4, 8]) if (m & b) s += '<path d="' + seg[b] + '" stroke="#4dc3ff" stroke-opacity=".25" stroke-width="30" stroke-linecap="round"/>';
    for (const b of [1, 2, 4, 8]) if (m & b) s += '<path d="' + seg[b] + '" stroke="' + col + '" stroke-width="16" stroke-linecap="round"' + '' + '/>';
    s += '<circle cx="50" cy="50" r="11" fill="' + col + '"/>';
    if (bullone) s += '<circle cx="80" cy="20" r="11" fill="#c9ced6" stroke="#5a6270" stroke-width="3"/><path d="M73 20 L87 20 M80 13 L80 27" stroke="#5a6270" stroke-width="4"/>';
    return s + '</svg>';
  };
  function accesi() {
    const on = new Set(); let r = 1, c = 0, da = 8;
    for (let n = 0; n < 12; n++) {
      const cel = celle.find(x => x.r === r && x.c === c); if (!cel) break;
      const m = ruota(cel.tipo, cel.rot); if (!(m & da)) break;
      on.add(cel.k); const out = m & ~da; if (!out || (out & (out - 1))) break;
      if (r === 2 && c === 2 && out === 2) return { on, ok: true };
      if (out === 1) r--; else if (out === 4) r++; else if (out === 2) c++; else c--;
      da = { 1: 4, 4: 1, 2: 8, 8: 2 }[out];
    }
    return { on, ok: false };
  }
  function disegna() {
    const { on, ok } = accesi(); griglia.innerHTML = '';
    griglia.appendChild(h('div', 'en-capo in', '💧'));
    celle.forEach(cel => { const b = h('button', 'en-pezzo', svgPezzo(ruota(cel.tipo, cel.rot), on.has(cel.k), vite === cel.k, guida && !!PERCORSO[cel.k])); b.style.gridRow = cel.r + 1; b.style.gridColumn = cel.c + 2; b.onclick = () => gira(cel, b); griglia.appendChild(b); });
    const fine = h('div', 'en-capo out' + (ok ? ' on' : ''), '⛲'); griglia.appendChild(fine);
    return ok;
  }
  function gira(cel, b) {
    if (fatto) return;
    if (vite === cel.k) {
      b.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 260 });
      tone(150, .2, 'square', .05);
      msg.className = 'en-msg ko'; msg.textContent = 'Questo tubo è bloccato dalla ruggine: a mano non gira.';
      // tanti tocchi di fila sul pezzo bloccato valgono come un solo tentativo
      const ora = performance.now(); if (ora - ultimaVite > 2500) { tentativi++; errore(1, msg.textContent); } ultimaVite = ora; return;
    }
    cel.rot = (cel.rot + 1) % 4; tone(700, .04, 'triangle', .05);
    if (disegna()) { fatto = true; msg.className = 'en-msg ok'; msg.textContent = 'L\'acqua scorre!'; jingle.win(); setTimeout(risolto, 800); return; }
    // girare a caso tanti pezzi senza arrivare a niente: conta come un tentativo andato male ogni 8 giri
    if (++tocchiInutili % 8 === 0) { tentativi++; errore(1, ''); }
  }
  disegna();
  return {
    el, get tentativi() { return tentativi; },
    bisogno: 'Un tubo è bloccato dalla ruggine e mi servirebbe una chiave inglese.', brusca: 'mi serve una chiave inglese.',
    disegnaIndizio(g, W, H) {
      g.fillStyle = '#1d2b3a'; g.font = '900 ' + H * .12 + 'px system-ui'; g.textAlign = 'center';
      g.fillText('VALVOLE DELLA FONTANA', W / 2, H * .24); g.font = '700 ' + H * .085 + 'px system-ui';
      g.fillText('Porta l\'acqua dalla goccia', W / 2, H * .46); g.fillText('alla fontana.', W / 2, H * .6);
      g.fillStyle = '#b3261e'; g.fillText('Tubi arrugginiti: chiedere al giardiniere', W / 2, H * .8);
    },
    sblocca(pieno) { vite = null; guida = !!pieno; disegna(); msg.className = 'en-msg'; msg.textContent = 'Il tubo è sbloccato: ora gira.'; },
    // solo per i test automatici: mette i tubi del percorso nella posizione giusta, tranne l'ultimo
    perTest() { celle.forEach(c => { const req = PERCORSO[c.k]; if (req && c.k !== '2,2') while (ruota(c.tipo, c.rot) !== req) c.rot = (c.rot + 1) % 4; }); disegna(); },
    rivela: 'Ecco, sbloccato. Il resto è tuo.',
    rivelaPieno: 'Questa chiave inglese era di Ottavio, sai? Ecco, sbloccato. E ti segno in giallo i tubi dove deve passare l\'acqua: girarli tocca a te.'
  };
}

/* ------------------------------------------------------------------ 3. il carillon (memoria) */
const CAMPANE = [{ c: '#ff5d73', f: 523 }, { c: '#ffc94a', f: 659 }, { c: '#6be08a', f: 784 }, { c: '#4dabff', f: 988 }];
function carillon({ difficile, errore, risolto }) {
  const seq = difficile ? [0, 2, 1, 3, 2, 0, 3] : [0, 2, 1, 3];
  let passo = 0, tentativi = 0, suona = false, lento = !difficile, scritta = false, ascolti = 0, fatto = false, ultimoNo = -1e9;
  const el = h('div', 'enigma');
  el.appendChild(h('div', 'en-tit', 'Ascolta la melodia e ripetila sulle campane'));
  const riga = h('div', 'en-note'); el.appendChild(riga);
  const camp = h('div', 'en-campane'); el.appendChild(camp);
  const msg = h('div', 'en-msg', ''); el.appendChild(msg);
  const ascolta = h('button', 'en-apri', 'ASCOLTA'); el.appendChild(ascolta);
  const bott = CAMPANE.map((c, i) => { const b = h('button', 'en-campana'); b.style.setProperty('--c', c.c); b.onclick = () => premi(i); camp.appendChild(b); return b; });
  const lampo = (i, ms) => { tone(CAMPANE[i].f, ms / 1000 + .25, 'sine', .14); tone(CAMPANE[i].f * 2, ms / 1000, 'triangle', .04); bott[i].classList.add('on'); setTimeout(() => bott[i].classList.remove('on'), ms * .8); };
  const disegnaNote = () => { riga.innerHTML = ''; seq.forEach((n, i) => { const d = h('i', i < passo ? 'ok' : ''); if (scritta || i < passo) d.style.background = CAMPANE[n].c; riga.appendChild(d); }); };
  async function esegui() {
    if (suona || fatto) return;
    // nella versione difficile il vecchio carillon suona una volta sola, e in fretta
    if (difficile && !lento && ascolti >= 1) { const ora = performance.now(); tone(150, .2, 'square', .05); msg.className = 'en-msg ko'; msg.textContent = 'La molla del carillon è scarica: non suona più.'; if (ora - ultimoNo > 2500) { tentativi++; errore(1, msg.textContent); } ultimoNo = ora; return; }
    suona = true; ascolti++; passo = 0; disegnaNote(); msg.className = 'en-msg'; msg.textContent = 'Ascolta…';
    const ms = lento ? 620 : 230;
    for (const n of seq) { lampo(n, ms); await new Promise(r => setTimeout(r, ms + 60)); }
    suona = false; msg.textContent = 'Ora tocca a te.';
  }
  ascolta.onclick = esegui;
  function premi(i) {
    if (suona || fatto) return;
    lampo(i, 260);
    if (i === seq[passo]) { passo++; disegnaNote(); if (passo === seq.length) { fatto = true; msg.className = 'en-msg ok'; msg.textContent = 'È la melodia giusta!'; jingle.win(); setTimeout(risolto, 800); } return; }
    tentativi++; passo = 0; disegnaNote(); tone(180, .3, 'sawtooth', .06);
    msg.className = 'en-msg ko'; msg.textContent = 'Nota sbagliata: si ricomincia dalla prima.'; errore(1, msg.textContent);
  }
  disegnaNote();
  return {
    el, get tentativi() { return tentativi; },
    bisogno: 'Il carillon ha suonato la melodia una volta sola, troppo in fretta. Me la faresti risentire?', brusca: 'rifammi sentire la melodia.',
    disegnaIndizio(g, W, H) {
      g.fillStyle = '#1d2b3a'; g.font = '900 ' + H * .12 + 'px system-ui'; g.textAlign = 'center'; g.fillText('IL CARILLON DI OTTAVIO', W / 2, H * .24);
      g.font = '700 ' + H * .085 + 'px system-ui'; g.fillText(seq.length + ' note. Chi le ripete,', W / 2, H * .46); g.fillText('passa.', W / 2, H * .6);
      if (scritta) seq.forEach((n, i) => { g.fillStyle = CAMPANE[n].c; g.beginPath(); g.arc(W * (.5 + (i - (seq.length - 1) / 2) * .11), H * .8, H * .055, 0, 7); g.fill(); });
      else if (difficile) { g.fillStyle = '#b3261e'; g.fillText('Molla vecchia: suona una volta sola', W / 2, H * .8); }
    },
    sblocca(pieno) { lento = true; scritta = !!pieno; ascolti = 0; disegnaNote(); msg.className = 'en-msg'; msg.textContent = 'Premi ASCOLTA: ora la melodia va piano.'; },
    perTest() { return seq.slice(); },
    rivela: 'La conosco. Te la suono piano, quante volte vuoi.',
    rivelaPieno: 'Certo che la conosco: Ottavio la fischiettava sempre. Te la suono piano, quante volte vuoi, e ti scrivo anche i colori delle note sul cartello.'
  };
}

/* ------------------------------------------------------------------ 4. il mosaico (visuospaziale) */
// una mappa del cielo divisa in nove tessere girate a caso: toccandole ruotano. Risolto quando sono tutte dritte.
function mosaico({ difficile, errore, risolto }) {
  const LATO = 300, img = document.createElement('canvas'); img.width = img.height = LATO;
  { const g = img.getContext('2d'), gr = g.createLinearGradient(0, 0, LATO, LATO); gr.addColorStop(0, '#16224f'); gr.addColorStop(1, '#3a2d6b'); g.fillStyle = gr; g.fillRect(0, 0, LATO, LATO);
    g.strokeStyle = '#ffc94a'; g.lineWidth = 7; g.strokeRect(6, 6, LATO - 12, LATO - 12);
    const st = [[60, 70], [120, 40], [175, 85], [240, 60], [215, 150], [150, 170], [80, 190], [110, 250], [200, 245], [255, 215]];
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 3; g.beginPath(); st.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
    st.forEach(([x, y], i) => { g.fillStyle = i % 3 ? '#fff6d0' : '#ffc94a'; g.beginPath(); g.arc(x, y, i % 3 ? 7 : 11, 0, 7); g.fill(); });
    g.fillStyle = '#ff9a3d'; g.beginPath(); g.arc(40, 255, 20, 0, 7); g.fill(); g.fillStyle = '#3a2d6b'; g.beginPath(); g.arc(49, 248, 17, 0, 7); g.fill();   // la luna in basso a sinistra
  }
  const tess = []; for (let i = 0; i < 9; i++) tess.push({ i, rot: [1, 3, 2, 1, 2, 3, 1, 2, 3][i] });
  let manca = difficile ? 4 : -1, modello = !difficile, tentativi = 0, giri = 0, fatto = false, ultimoNo = -1e9;
  const el = h('div', 'enigma');
  el.appendChild(h('div', 'en-tit', 'Ricomponi la mappa del cielo: tocca una tessera per girarla'));
  const gr = h('div', 'en-mosaico'); el.appendChild(gr);
  const msg = h('div', 'en-msg', ''); el.appendChild(msg);
  function disegna() {
    gr.innerHTML = '';
    tess.forEach(t => {
      const b = h('button', 'en-tessera'); if (t.i === manca) { b.classList.add('vuota'); b.textContent = '?'; }
      else { const c = document.createElement('canvas'); c.width = c.height = 100; const g = c.getContext('2d'); g.translate(50, 50); g.rotate(t.rot * Math.PI / 2); g.drawImage(img, (t.i % 3) * 100, Math.floor(t.i / 3) * 100, 100, 100, -50, -50, 100, 100); b.appendChild(c); }
      b.onclick = () => gira(t, b); gr.appendChild(b);
    });
  }
  function gira(t, b) {
    if (fatto) return;
    if (t.i === manca) { const ora = performance.now(); tone(150, .2, 'square', .05); msg.className = 'en-msg ko'; msg.textContent = 'Qui manca una tessera: senza, la mappa non si chiude.'; if (ora - ultimoNo > 2500) { tentativi++; errore(1, msg.textContent); } ultimoNo = ora; return; }
    t.rot = (t.rot + 1) % 4; tone(640, .04, 'triangle', .05); disegna();
    if (manca < 0 && tess.every(x => x.rot === 0)) { fatto = true; msg.className = 'en-msg ok'; msg.textContent = 'La mappa è completa!'; jingle.win(); setTimeout(risolto, 800); return; }
    // senza il modello davanti si gira a tentoni: ogni dieci giri a vuoto pesa come un tentativo andato male
    if (++giri % 10 === 0) { tentativi++; errore(1, ''); }
  }
  disegna();
  return {
    el, get tentativi() { return tentativi; },
    bisogno: 'Al mosaico manca la tessera centrale. Per caso sai dov\'è?', brusca: 'dammi la tessera che manca.',
    disegnaIndizio(g, W, H) {
      g.fillStyle = '#1d2b3a'; g.font = '900 ' + H * .11 + 'px system-ui'; g.textAlign = 'center'; g.fillText('LA MAPPA DEL CIELO', W / 2, H * .2);
      if (modello) g.drawImage(img, W / 2 - H * .34, H * .26, H * .68, H * .68);
      else { g.font = '700 ' + H * .085 + 'px system-ui'; g.fillText('Il disegno del cartello', W / 2, H * .48); g.fillText('è sbiadito dal sole.', W / 2, H * .62); g.fillStyle = '#b3261e'; g.fillText('Tessere: 8 su 9', W / 2, H * .82); }
    },
    sblocca(pieno) { manca = -1; if (pieno) { modello = true; tess[4].rot = 0; } disegna(); msg.className = 'en-msg'; msg.textContent = pieno ? 'La tessera è al suo posto, e sul cartello c\'è il disegno intero.' : 'La tessera c\'è: ora va girata come le altre.'; },
    perTest() { tess.forEach((t, i) => { if (i) t.rot = 0; else t.rot = 3; }); disegna(); },
    rivela: 'Ce l\'ho io. Tieni.',
    rivelaPieno: 'La tengo in tasca da trent\'anni: me la affidò Ottavio. Te la metto già dritta, e ti ridisegno sul cartello la mappa intera, come me la ricordo.'
  };
}

export const ENIGMI = [codiceSimboli, circuito, carillon, mosaico];

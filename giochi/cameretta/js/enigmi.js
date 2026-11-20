// Gli enigmi delle quattro serrature della scatola del nonno: codice di simboli, circuito, carillon (memoria), mosaico (visuospaziale).
// Ognuno esiste in due versioni:
// - facile: si risolve da soli (prima il successo, poi la difficoltà);
// - difficile: manca qualcosa che ha solo una persona di casa (un indizio, un attrezzo, una melodia, una tessera).
//   Da soli non si risolve: è l'occasione per chiedere aiuto. Il gioco non dice mai "chiedi aiuto": lo dice solo l'aiuto programmato.
// Ogni enigma restituisce { el, sblocca(pieno), disegnaIndizio(ctx, W, H), tentativi }.
// sblocca(false) dà solo quello che manca; sblocca(true) aggiunge un suggerimento in più (l'aiuto che si riceve chiedendo con gentilezza).
// errore(peso, msg) a ogni tentativo sbagliato, risolto() alla fine. L'enigma non sa niente di ABA, né di chi aiuta:
// le parole della richiesta e delle risposte stanno in js/testi.js (ENIGMI_TESTI).
import { tone, jingle } from './core.js';

const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };   // rettangolo arrotondato (roundRect manca sui tablet meno recenti)
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
// macchia di caffè che copre una parte dell'indizio
function macchia(g, x, y, r) {
  g.fillStyle = '#6b4a2b';
  for (let i = 0; i < 14; i++) { const a = i / 14 * 7, q = r * (.7 + (i * 37 % 10) / 30); g.beginPath(); g.arc(x + Math.cos(a) * q * .5, y + Math.sin(a) * q * .5, q * .55, 0, 7); g.fill(); }
  g.fillStyle = 'rgba(60,38,18,.45)'; g.beginPath(); g.arc(x - r * .2, y - r * .1, r * .3, 0, 7); g.fill();
  g.strokeStyle = 'rgba(70,45,22,.5)'; g.lineWidth = r * .08; g.beginPath(); g.arc(x + r * .1, y + r * .05, r * .82, .4, 4.6); g.stroke();   // l'alone della tazzina
}

function codiceSimboli({ difficile, errore, risolto }) {
  const codice = [0, 3, 1, 4].map(i => SIMBOLI[i]);
  let coperti = difficile ? 2 : 0, inserito = [], bloccatoFino = 0, tentativi = 0;
  const el = h('div', 'enigma');
  el.appendChild(h('div', 'en-tit', 'Componi il codice scritto sul biglietto'));
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
    msg.className = 'en-msg ko'; msg.textContent = blocca ? 'Codice sbagliato tre volte: la serratura si blocca per 8 secondi.' : 'Codice sbagliato.';
    if (blocca) { bloccatoFino = performance.now() + 8000; setTimeout(() => { if (msg.className === 'en-msg ko') msg.textContent = ''; }, 8000); }
    setTimeout(() => { inserito = []; disegnaRiga(); }, 600);
    errore(blocca ? 2 : 1, msg.textContent);
  }
  disegnaRiga();
  return {
    el, get tentativi() { return tentativi; },
    disegnaIndizio(g, W, H) {
      g.fillStyle = '#2a2118'; g.font = '900 ' + H * .12 + 'px system-ui'; g.textAlign = 'center'; g.fillText('IL CODICE', W / 2, H * .25);
      codice.forEach((s, i) => disegnaSimbolo(g, s.id, W * (.2 + i * .2), H * .6, H * .15, s.c));
      for (let i = 0; i < coperti; i++) macchia(g, W * (.6 + i * .2), H * .6, H * .2);
    },
    sblocca(pieno) { coperti = 0; if (pieno) { inserito = codice.slice(0, 2); disegnaRiga(); } },
    perTest() { return codice.map(s => SIMBOLI.indexOf(s)); }
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
  el.appendChild(h('div', 'en-tit', 'Accendi la lampadina: tocca un pezzo per girarlo'));
  const griglia = h('div', 'en-griglia'); el.appendChild(griglia);
  const msg = h('div', 'en-msg', ''); el.appendChild(msg);
  const svgPezzo = (m, acceso, bullone, traccia) => {
    const col = acceso ? '#ffd45a' : '#7d8aa0', seg = { 1: 'M50 50 L50 0', 2: 'M50 50 L100 50', 4: 'M50 50 L50 100', 8: 'M50 50 L0 50' };
    let s = '<svg viewBox="0 0 100 100"><rect x="2" y="2" width="96" height="96" rx="12" fill="#1a2433" stroke="' + (traccia ? '#ffc94a' : '#33445c') + '" stroke-width="' + (traccia ? 6 : 3) + '"/>';
    if (acceso) for (const b of [1, 2, 4, 8]) if (m & b) s += '<path d="' + seg[b] + '" stroke="#ffd45a" stroke-opacity=".25" stroke-width="30" stroke-linecap="round"/>';
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
    griglia.appendChild(h('div', 'en-capo in', '🔋'));
    celle.forEach(cel => { const b = h('button', 'en-pezzo', svgPezzo(ruota(cel.tipo, cel.rot), on.has(cel.k), vite === cel.k, guida && !!PERCORSO[cel.k])); b.style.gridRow = cel.r + 1; b.style.gridColumn = cel.c + 2; b.onclick = () => gira(cel, b); griglia.appendChild(b); });
    const fine = h('div', 'en-capo out' + (ok ? ' on' : ''), '💡'); griglia.appendChild(fine);
    return ok;
  }
  function gira(cel, b) {
    if (fatto) return;
    if (vite === cel.k) {
      b.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 260 });
      tone(150, .2, 'square', .05);
      msg.className = 'en-msg ko'; msg.textContent = 'Questo pezzo è fermato da una vite: a mano non gira.';
      // tanti tocchi di fila sul pezzo bloccato valgono come un solo tentativo
      const ora = performance.now(); if (ora - ultimaVite > 2500) { tentativi++; errore(1, msg.textContent); } ultimaVite = ora; return;
    }
    cel.rot = (cel.rot + 1) % 4; tone(700, .04, 'triangle', .05);
    if (disegna()) { fatto = true; msg.className = 'en-msg ok'; msg.textContent = 'La lampadina si accende!'; jingle.win(); setTimeout(risolto, 800); return; }
    // girare a caso tanti pezzi senza arrivare a niente: conta come un tentativo andato male ogni 8 giri
    if (++tocchiInutili % 8 === 0) { tentativi++; errore(1, ''); }
  }
  disegna();
  return {
    el, get tentativi() { return tentativi; },
    disegnaIndizio(g, W, H) {
      g.fillStyle = '#2a2118'; g.font = '900 ' + H * .12 + 'px system-ui'; g.textAlign = 'center';
      g.fillText('IL CIRCUITO', W / 2, H * .24); g.font = '700 ' + H * .085 + 'px system-ui';
      g.fillText('Porta la corrente dalla pila', W / 2, H * .46); g.fillText('alla lampadina.', W / 2, H * .6);
      if (vite) { g.fillStyle = '#b3261e'; g.fillText('Un pezzo è avvitato', W / 2, H * .8); }
    },
    sblocca(pieno) { vite = null; guida = !!pieno; disegna(); msg.className = 'en-msg'; msg.textContent = 'La vite è tolta: ora il pezzo gira.'; },
    // solo per i test automatici: mette i pezzi del percorso nella posizione giusta, tranne l'ultimo
    perTest() { celle.forEach(c => { const req = PERCORSO[c.k]; if (req && c.k !== '2,2') while (ruota(c.tipo, c.rot) !== req) c.rot = (c.rot + 1) % 4; }); disegna(); }
  };
}

/* ------------------------------------------------------------------ 3. il carillon (memoria) */
const CAMPANE = [{ c: '#ff5d73', f: 523 }, { c: '#ffc94a', f: 659 }, { c: '#6be08a', f: 784 }, { c: '#4dabff', f: 988 }];
function carillon({ difficile, errore, risolto }) {
  const seq = difficile ? [0, 2, 1, 3, 2, 0, 3] : [0, 2, 1, 3];
  let passo = 0, tentativi = 0, suona = false, lento = !difficile, scritta = false, ascolti = 0, fatto = false, ultimoNo = -1e9;
  const el = h('div', 'enigma');
  el.appendChild(h('div', 'en-tit', 'Ascolta la melodia e ripetila sulle campanelle'));
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
    disegnaIndizio(g, W, H) {
      g.fillStyle = '#2a2118'; g.font = '900 ' + H * .12 + 'px system-ui'; g.textAlign = 'center'; g.fillText('IL CARILLON', W / 2, H * .24);
      g.font = '700 ' + H * .085 + 'px system-ui'; g.fillText(seq.length + ' note. Chi le ripete', W / 2, H * .46); g.fillText('nello stesso ordine, apre.', W / 2, H * .6);
      if (scritta) seq.forEach((n, i) => { g.fillStyle = CAMPANE[n].c; g.beginPath(); g.arc(W * (.5 + (i - (seq.length - 1) / 2) * .11), H * .8, H * .055, 0, 7); g.fill(); });
      else if (difficile) { g.fillStyle = '#b3261e'; g.fillText('Suona una volta sola!', W / 2, H * .8); }
    },
    sblocca(pieno) { lento = true; scritta = !!pieno; ascolti = 0; disegnaNote(); msg.className = 'en-msg'; msg.textContent = 'Premi ASCOLTA: ora la melodia va piano.'; },
    perTest() { return seq.slice(); }
  };
}

/* ------------------------------------------------------------------ 4. il mosaico (visuospaziale) */
// il disegno del nonno (la pista dei kart) diviso in nove tessere girate a caso: toccandole ruotano. Risolto quando sono tutte dritte.
function mosaico({ difficile, errore, risolto }) {
  const LATO = 300, img = document.createElement('canvas'); img.width = img.height = LATO;
  { const g = img.getContext('2d'), gr = g.createLinearGradient(0, 0, LATO, LATO); gr.addColorStop(0, '#49a85a'); gr.addColorStop(1, '#2e7d43'); g.fillStyle = gr; g.fillRect(0, 0, LATO, LATO);
    // la pista: un anello grigio con la linea tratteggiata
    g.strokeStyle = '#4a5160'; g.lineWidth = 44; g.beginPath(); g.ellipse(150, 152, 104, 86, 0, 0, 7); g.stroke();
    g.strokeStyle = '#f2f4f8'; g.lineWidth = 3; g.setLineDash([12, 10]); g.beginPath(); g.ellipse(150, 152, 104, 86, 0, 0, 7); g.stroke(); g.setLineDash([]);
    // il traguardo a scacchi, a destra
    for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#fff' : '#12161f'; g.fillRect(234 + i * 7.4, 146 + j * 7, 7.4, 7); }
    // un kart rosso in alto a sinistra e uno blu in basso
    const kart = (x, y, a, c) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = '#12161f'; [[-12, -10], [10, -10], [-12, 8], [10, 8]].forEach(([u, v]) => g.fillRect(u, v, 6, 5)); g.fillStyle = c; rr(g, -13, -7, 28, 14, 5); g.fill(); g.fillStyle = '#ffe9c7'; g.beginPath(); g.arc(-2, 0, 4.5, 0, 7); g.fill(); g.restore(); };
    kart(78, 88, -.6, '#e8453c'); kart(168, 238, .12, '#3b8cf0');
    // agli angoli: un albero, il sole, uno stagno, la tribuna
    g.fillStyle = '#1f5f33'; g.beginPath(); g.arc(34, 34, 19, 0, 7); g.fill(); g.fillStyle = '#7a5232'; g.fillRect(30, 44, 8, 14);
    g.fillStyle = '#ffd45a'; g.beginPath(); g.arc(262, 36, 16, 0, 7); g.fill(); g.strokeStyle = '#ffd45a'; g.lineWidth = 3; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.beginPath(); g.moveTo(262 + Math.cos(a) * 21, 36 + Math.sin(a) * 21); g.lineTo(262 + Math.cos(a) * 28, 36 + Math.sin(a) * 28); g.stroke(); }
    g.fillStyle = '#6cc6f5'; g.beginPath(); g.ellipse(38, 266, 22, 13, 0, 0, 7); g.fill();
    for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#f5f7fb' : '#e8453c'; g.fillRect(244, 252 + i * 8, 44, 8); }
    // al centro: il cartello con il numero 7 (è la tessera che decide, e non è uguale da nessun lato)
    g.fillStyle = '#fff6d0'; g.strokeStyle = '#b9831a'; g.lineWidth = 5; rr(g, 118, 116, 64, 66, 10); g.fill(); g.stroke();
    g.fillStyle = '#e8453c'; g.font = '900 54px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('7', 150, 152);
    g.strokeStyle = '#ffc94a'; g.lineWidth = 7; g.strokeRect(5, 5, LATO - 10, LATO - 10);
  }
  const tess = []; for (let i = 0; i < 9; i++) tess.push({ i, rot: [1, 3, 2, 1, 2, 3, 1, 2, 3][i] });
  let manca = difficile ? 4 : -1, modello = !difficile, tentativi = 0, giri = 0, fatto = false, ultimoNo = -1e9;
  const el = h('div', 'enigma');
  el.appendChild(h('div', 'en-tit', 'Ricomponi il disegno del nonno: tocca una tessera per girarla'));
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
    if (t.i === manca) { const ora = performance.now(); tone(150, .2, 'square', .05); msg.className = 'en-msg ko'; msg.textContent = 'Qui manca una tessera: senza, il disegno non si chiude.'; if (ora - ultimoNo > 2500) { tentativi++; errore(1, msg.textContent); } ultimoNo = ora; return; }
    t.rot = (t.rot + 1) % 4; tone(640, .04, 'triangle', .05); disegna();
    if (manca < 0 && tess.every(x => x.rot === 0)) { fatto = true; msg.className = 'en-msg ok'; msg.textContent = 'Il disegno è completo!'; jingle.win(); setTimeout(risolto, 800); return; }
    // senza il modello davanti si gira a tentoni: ogni dieci giri a vuoto pesa come un tentativo andato male
    if (++giri % 10 === 0) { tentativi++; errore(1, ''); }
  }
  disegna();
  return {
    el, get tentativi() { return tentativi; },
    disegnaIndizio(g, W, H) {
      g.fillStyle = '#2a2118'; g.font = '900 ' + H * .11 + 'px system-ui'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText('IL MOSAICO', W / 2, H * .2);
      if (modello) g.drawImage(img, W / 2 - H * .34, H * .26, H * .68, H * .68);
      else { g.font = '700 ' + H * .085 + 'px system-ui'; g.fillText('Il disegno sul biglietto', W / 2, H * .48); g.fillText('è sbiadito.', W / 2, H * .62); g.fillStyle = '#b3261e'; g.fillText('Tessere: 8 su 9', W / 2, H * .82); }
    },
    sblocca(pieno) { manca = -1; if (pieno) { modello = true; tess[4].rot = 0; } disegna(); msg.className = 'en-msg'; msg.textContent = pieno ? 'La tessera è al suo posto, e sul biglietto c\'è il disegno intero.' : 'La tessera c\'è: ora va girata come le altre.'; },
    perTest() { tess.forEach((t, i) => { if (i) t.rot = 0; else t.rot = 3; }); disegna(); }
  };
}

export const ENIGMI = [codiceSimboli, circuito, carillon, mosaico];

// I tre enigmi dei cancelli. Ognuno esiste in due versioni:
// - facile: si risolve da soli (prima il successo, poi la difficoltà);
// - difficile: manca qualcosa che ha solo l'aiutante (un indizio coperto, un attrezzo). Da soli non si risolve:
//   è l'occasione per chiedere aiuto. Il gioco non dice mai "chiedi aiuto": lo dice solo l'aiuto programmato.
// Ogni enigma restituisce { el, sblocca(), disegnaIndizio(ctx, W, H), bisogno, tentativi } e chiama
// errore(peso, msg) a ogni tentativo sbagliato e risolto() quando è finito. Il gioco non sa niente di ABA.
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
    bisogno: 'Due simboli del cartello sono coperti dal fango e non li vedo.',
    disegnaIndizio(g, W, H) {
      g.fillStyle = '#1d2b3a'; g.font = '900 ' + H * .13 + 'px system-ui'; g.textAlign = 'center'; g.fillText('CODICE DEL CANCELLO', W / 2, H * .25);
      codice.forEach((s, i) => disegnaSimbolo(g, s.id, W * (.2 + i * .2), H * .6, H * .15, s.c));
      for (let i = 0; i < coperti; i++) fango(g, W * (.6 + i * .2), H * .6, H * .2);
    },
    sblocca() { coperti = 0; },
    rivela: 'Li ho visti stamattina: dopo la stella e il quadrato ci sono il cerchio blu e il rombo viola.'
  };
}

/* ------------------------------------------------------------------ 2. circuito da ricollegare */
// direzioni: 1 = nord, 2 = est, 4 = sud, 8 = ovest; una rotazione oraria sposta ogni apertura alla successiva
const ruota = (m, r) => { for (let i = 0; i < r; i++) m = ((m << 1) | (m >> 3)) & 15; return m; };
const DRITTO = 1 | 4, CURVA = 1 | 2;
const PERCORSO = { '1,0': 8 | 2, '1,1': 8 | 1, '0,1': 4 | 2, '0,2': 8 | 4, '1,2': 1 | 4, '2,2': 1 | 2 };   // entrata a ovest di (1,0), uscita a est di (2,2)
function circuito({ difficile, errore, risolto }) {
  const celle = [];
  let vite = difficile ? '0,2' : null, tentativi = 0, fatto = false, tocchiInutili = 0, ultimaVite = -1e9;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const k = r + ',' + c, req = PERCORSO[k];
    const tipo = req ? ((req === 5 || req === 10) ? DRITTO : CURVA) : ((r + c) % 2 ? DRITTO : CURVA);
    let rot = (r * 3 + c * 2 + 1) % 4;
    if (req && ruota(tipo, rot) === req) rot = (rot + 1) % 4;   // nessun pezzo del percorso parte già giusto
    celle.push({ r, c, k, tipo, rot });
  }
  const el = h('div', 'enigma');
  el.appendChild(h('div', 'en-tit', 'Ricollega i cavi: tocca un pezzo per girarlo'));
  const griglia = h('div', 'en-griglia'); el.appendChild(griglia);
  const msg = h('div', 'en-msg', ''); el.appendChild(msg);
  const svgPezzo = (m, acceso, bullone) => {
    const col = acceso ? '#4dff9a' : '#7d8aa0', seg = { 1: 'M50 50 L50 0', 2: 'M50 50 L100 50', 4: 'M50 50 L50 100', 8: 'M50 50 L0 50' };
    let s = '<svg viewBox="0 0 100 100"><rect x="2" y="2" width="96" height="96" rx="12" fill="#1a2433" stroke="#33445c" stroke-width="3"/>';
    if (acceso) for (const b of [1, 2, 4, 8]) if (m & b) s += '<path d="' + seg[b] + '" stroke="#4dff9a" stroke-opacity=".25" stroke-width="30" stroke-linecap="round"/>';
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
    griglia.appendChild(h('div', 'en-capo in', '⚡'));
    celle.forEach(cel => { const b = h('button', 'en-pezzo', svgPezzo(ruota(cel.tipo, cel.rot), on.has(cel.k), vite === cel.k)); b.style.gridRow = cel.r + 1; b.style.gridColumn = cel.c + 2; b.onclick = () => gira(cel, b); griglia.appendChild(b); });
    const fine = h('div', 'en-capo out' + (ok ? ' on' : ''), '🔒'); griglia.appendChild(fine);
    return ok;
  }
  function gira(cel, b) {
    if (fatto) return;
    if (vite === cel.k) {
      b.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 260 });
      tone(150, .2, 'square', .05);
      msg.className = 'en-msg ko'; msg.textContent = 'Questo pezzo è fissato con una vite: non gira.';
      // tanti tocchi di fila sul pezzo bloccato valgono come un solo tentativo
      const ora = performance.now(); if (ora - ultimaVite > 2500) { tentativi++; errore(1, msg.textContent); } ultimaVite = ora; return;
    }
    cel.rot = (cel.rot + 1) % 4; tone(700, .04, 'triangle', .05);
    if (disegna()) { fatto = true; msg.className = 'en-msg ok'; msg.textContent = 'Corrente collegata!'; jingle.win(); setTimeout(risolto, 800); return; }
    // girare a caso tanti pezzi senza arrivare a niente: conta come un tentativo andato male ogni 8 giri
    if (++tocchiInutili % 8 === 0) { tentativi++; errore(1, ''); }
  }
  disegna();
  return {
    el, get tentativi() { return tentativi; },
    bisogno: 'Un pezzo è fissato con una vite e mi serve un cacciavite.',
    disegnaIndizio(g, W, H) {
      g.fillStyle = '#1d2b3a'; g.font = '900 ' + H * .12 + 'px system-ui'; g.textAlign = 'center';
      g.fillText('CENTRALINA', W / 2, H * .24); g.font = '700 ' + H * .085 + 'px system-ui';
      g.fillText('Collega i cavi dal fulmine', W / 2, H * .46); g.fillText('al lucchetto per aprire.', W / 2, H * .6);
      g.fillStyle = '#b3261e'; g.fillText('Pezzi con vite: solo personale', W / 2, H * .8);
    },
    sblocca() { vite = null; disegna(); msg.className = 'en-msg'; msg.textContent = 'La vite è tolta: ora il pezzo gira.'; },
    // solo per i test automatici: mette i pezzi del percorso nella posizione giusta, tranne l'ultimo
    perTest() { celle.forEach(c => { const req = PERCORSO[c.k]; if (req && c.k !== '2,2') while (ruota(c.tipo, c.rot) !== req) c.rot = (c.rot + 1) % 4; }); disegna(); },
    rivela: 'Ecco fatto, ho tolto la vite con il cacciavite. Ora il pezzo gira: il resto lo fai tu.'
  };
}

/* ------------------------------------------------------------------ 3. lucchetto a combinazione */
function lucchetto({ difficile, errore, risolto }) {
  const codice = [4, 1, 8]; let coperti = difficile ? 2 : 0, ruote = [0, 0, 0], tentativi = 0, bloccatoFino = 0;
  const el = h('div', 'enigma');
  el.appendChild(h('div', 'en-tit', 'Gira le rotelle e apri il lucchetto'));
  const box = h('div', 'en-ruote'); el.appendChild(box);
  const msg = h('div', 'en-msg', ''); el.appendChild(msg);
  const apri = h('button', 'en-apri', 'APRI'); el.appendChild(apri);
  const disegna = () => { box.innerHTML = ''; ruote.forEach((v, i) => { const w = h('div', 'en-ruota'); const su = h('button', '', '▲'), giu = h('button', '', '▼'); su.onclick = () => { ruote[i] = (v + 1) % 10; tone(800, .03, 'triangle', .05); disegna(); }; giu.onclick = () => { ruote[i] = (v + 9) % 10; tone(760, .03, 'triangle', .05); disegna(); }; w.append(su, h('div', 'n', v), giu); box.appendChild(w); }); };
  apri.onclick = () => {
    if (performance.now() < bloccatoFino) { tone(160, .2, 'square', .05); return; }
    tentativi++;
    if (ruote.every((v, i) => v === codice[i])) { msg.className = 'en-msg ok'; msg.textContent = 'Clic! Il lucchetto è aperto.'; jingle.win(); setTimeout(risolto, 700); return; }
    tone(180, .3, 'sawtooth', .06);
    const blocca = tentativi % 3 === 0;
    msg.className = 'en-msg ko'; msg.textContent = blocca ? 'Tre tentativi sbagliati: il lucchetto si blocca per 10 secondi.' : 'Non si apre.';
    if (blocca) bloccatoFino = performance.now() + 10000;
    errore(blocca ? 2 : 1, msg.textContent);
  };
  disegna();
  return {
    el, get tentativi() { return tentativi; },
    bisogno: 'Il cartello del codice è sporco di fango e non leggo gli ultimi due numeri.',
    disegnaIndizio(g, W, H) {
      g.fillStyle = '#1d2b3a'; g.font = '900 ' + H * .13 + 'px system-ui'; g.textAlign = 'center'; g.fillText('CODICE LUCCHETTO', W / 2, H * .25);
      g.font = '900 ' + H * .34 + 'px system-ui'; codice.forEach((n, i) => g.fillText(n, W * (.3 + i * .2), H * .72));
      for (let i = 0; i < coperti; i++) fango(g, W * (.7 - i * .2), H * .6, H * .2);
    },
    sblocca() { coperti = 0; },
    rivela: 'Ho la foto del cartello sul telefono, guarda: il codice è 4, 1, 8.'
  };
}

export const ENIGMI = [codiceSimboli, circuito, lucchetto];

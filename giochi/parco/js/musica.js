// Musica di sottofondo, suonata dal browser nota per nota (nessun file audio): una marcetta orchestrale da parco,
// allegra e ben cadenzata, e la sua versione in minore, lenta e cupa. Le due versioni suonano sulla stessa griglia
// e si mescolano in base alla frustrazione: più sale, più si spegne l'allegra e cresce la cupa, e il tempo rallenta.
// Così la musica dice come sta il protagonista prima ancora della barra.
import { audio, cfg, clamp, ascoltaVoce } from './core.js';

const hz = m => 440 * Math.pow(2, (m - 69) / 12);
// otto battute, otto crome per battuta (0 = pausa). Numeri MIDI.
const MELODIA = [
  [76, 0, 79, 0, 84, 0, 79, 76], [74, 76, 77, 74, 76, 0, 72, 0], [81, 0, 84, 0, 81, 0, 77, 81], [79, 0, 83, 0, 86, 0, 83, 79],
  [76, 0, 79, 0, 84, 0, 79, 76], [81, 79, 76, 72, 76, 0, 81, 0], [77, 81, 84, 81, 79, 83, 86, 83], [84, 0, 79, 0, 72, 0, 0, 0]
];
const ACCORDI = [[48, 52, 55], [48, 52, 55], [53, 57, 60], [55, 59, 62], [48, 52, 55], [57, 60, 64], [53, 57, 60], [48, 52, 55]];        // do, do, fa, sol, do, la-, fa(-sol), do
const ACCORDI_CUPI = [[48, 51, 55], [48, 51, 55], [53, 56, 60], [55, 59, 62], [48, 51, 55], [56, 60, 63], [53, 56, 60], [48, 51, 55]];   // do-, do-, fa-, sol, do-, lab, fa-, do-
const CANTO_CUPO = [[60, 63], [62, 60], [65, 68], [67, 62], [60, 63], [56, 60], [65, 67], [60, 0]];                                      // due note lunghe per battuta

let ctx = null, master = null, busA = null, busC = null, timer = null, prossimo = 0, passo = 0, umore = 0, meta = 0, attiva = false, voce = false;

function env(g, t, a, d, vol) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
function nota(tipo, f, t, dur, vol, bus, { filtro = 0, stona = 0, vibrato = 0 } = {}) {
  const o = ctx.createOscillator(), g = ctx.createGain(); o.type = tipo; o.frequency.setValueAtTime(f, t); o.detune.value = stona;
  let fine = g;
  if (filtro) { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = filtro; g.connect(lp); fine = lp; }
  if (vibrato) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 5.2; lg.gain.value = vibrato; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + .3); }
  o.connect(g); fine.connect(bus); o.start(t); o.stop(t + dur + .3); return g;
}
// pizzicato d'archi: attacco secco, coda corta
const pizz = (m, t, vol, bus) => { env(nota('triangle', hz(m), t, .3, vol, bus, { filtro: 2200 }), t, .004, .26, vol); env(nota('sawtooth', hz(m), t, .2, vol, bus, { filtro: 1200 }), t, .004, .12, vol * .35); };
// flauto: attacco morbido, un filo di vibrato
const flauto = (m, t, dur, vol, bus) => { const g = nota('sine', hz(m), t, dur, vol, bus, { vibrato: 3 }); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + .03); g.gain.setValueAtTime(vol, t + dur * .7); g.gain.linearRampToValueAtTime(0.0001, t + dur);
  const g2 = nota('triangle', hz(m) * 2, t, dur, vol, bus); g2.gain.setValueAtTime(0.0001, t); g2.gain.linearRampToValueAtTime(vol * .12, t + .03); g2.gain.linearRampToValueAtTime(0.0001, t + dur); };
// glockenspiel: una campanella sopra il flauto
const glock = (m, t, vol, bus) => { env(nota('sine', hz(m), t, .5, vol, bus), t, .002, .5, vol); env(nota('sine', hz(m) * 2.76, t, .2, vol, bus), t, .002, .15, vol * .3); };
// archi tenuti: due seghe appena scordate, filtrate
const archi = (m, t, dur, vol, bus, filtro = 700) => { for (const s of [-7, 7]) { const g = nota('sawtooth', hz(m), t, dur, vol, bus, { filtro, stona: s }); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(.5, dur * .35)); g.gain.setValueAtTime(vol, t + dur * .75); g.gain.linearRampToValueAtTime(0.0001, t + dur + .25); } };
// timpano: colpo grave che scende
const timpano = (m, t, vol, bus) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(hz(m) * 1.5, t); o.frequency.exponentialRampToValueAtTime(hz(m), t + .08); env(g, t, .005, .7, vol); o.connect(g); g.connect(bus); o.start(t); o.stop(t + .9); };
// tamburello: un soffio di rumore sul levare
let rumore = null;
const tamb = (t, vol, bus) => { if (!rumore) { rumore = ctx.createBuffer(1, ctx.sampleRate * .08, ctx.sampleRate); const d = rumore.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); }
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'highpass'; f.frequency.value = 5000; g.gain.value = vol; s.buffer = rumore; s.connect(f); f.connect(g); g.connect(bus); s.start(t); };

function suonaPasso(n, t, croma) {
  const b = Math.floor(n / 8) % 8, s = n % 8, giro = Math.floor(n / 64) % 2;
  // --- versione allegra: basso pizzicato sui tempi forti, accordo sul levare ("um-pa"), flauto, campanelle
  if (umore < .97) {
    const acc = (b === 6 && s >= 4) ? ACCORDI[3] : ACCORDI[b];
    if (s === 0) pizz(acc[0] - 12, t, .2, busA);
    if (s === 4) pizz(acc[2] - 12, t, .16, busA);
    if (s === 2 || s === 6) { acc.forEach(m => pizz(m + 12, t, .07, busA)); tamb(t, .035, busA); }
    const m = MELODIA[b][s];
    if (m) { flauto(m, t, croma * (MELODIA[b][(s + 1) % 8] ? .95 : 1.8), .11, busA); if (giro && (s === 0 || s === 4)) glock(m + 12, t, .05, busA); }
    if (s === 0 && b % 2 === 0) archi(acc[1] + 12, t, croma * 15, .018, busA, 1400);
  }
  // --- versione cupa: archi bassi tenuti, un canto lento e grave, timpano lontano
  if (umore > .03) {
    const acc = (b === 6 && s >= 4) ? ACCORDI_CUPI[3] : ACCORDI_CUPI[b];
    if (s === 0) { archi(acc[0] - 12, t, croma * 7.5, .085, busC, 420); archi(acc[2] - 12, t, croma * 7.5, .05, busC, 420); archi(acc[1], t, croma * 7.5, .035, busC, 520); timpano(acc[0] - 24, t, .2, busC); }
    if (s === 0 || s === 4) { const m = CANTO_CUPO[b][s / 4]; if (m) { const g = nota('triangle', hz(m - 12), t, croma * 3.8, .12, busC, { filtro: 900, vibrato: 2 }); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.12, t + .12); g.gain.linearRampToValueAtTime(0.0001, t + croma * 3.8); } }
    if (s === 6 && b % 2) timpano(acc[0] - 24, t, .09, busC);
  }
}
function giro() {
  if (!attiva || !ctx) return;
  umore += (meta - umore) * .12;
  const t = ctx.currentTime;
  busA.gain.setTargetAtTime(Math.cos(umore * Math.PI / 2), t, .3); busC.gain.setTargetAtTime(Math.sin(umore * Math.PI / 2), t, .3);
  master.gain.setTargetAtTime((cfg().musica ? .55 : 0) * (voce ? .45 : 1), t, .15);
  while (prossimo < t + .3) { const croma = 60 / 112 / 2 * (1 + .3 * umore); suonaPasso(passo++, prossimo, croma); prossimo += croma; }
}
export const Musica = {
  avvia() {
    ctx = audio(); if (!ctx || attiva) return;
    if (!master) { master = ctx.createGain(); master.gain.value = 0; busA = ctx.createGain(); busC = ctx.createGain(); busC.gain.value = 0;
      const comp = ctx.createDynamicsCompressor(); busA.connect(master); busC.connect(master); master.connect(comp); comp.connect(ctx.destination); ascoltaVoce(on => { voce = on; }); }
    attiva = true; passo = 0; prossimo = ctx.currentTime + .15; timer = setInterval(giro, 70); giro();
  },
  ferma() { attiva = false; clearInterval(timer); if (master) master.gain.setTargetAtTime(0, ctx.currentTime, .4); },
  // frustrazione 0–100: fino al giallo la musica resta allegra, dall'arancione in su è quasi tutta cupa
  frustrazione(v) { meta = clamp((v - 38) / 34, 0, 1); },
  get umore() { return umore; }, get attiva() { return attiva; }
};

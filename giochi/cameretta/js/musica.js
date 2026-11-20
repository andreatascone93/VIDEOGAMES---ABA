// Musica di sottofondo, suonata dal browser nota per nota (nessun file audio).
// Due versioni dello stesso tema sulla stessa griglia: quella di casa, calma e calda (piano elettrico, carillon, un velo
// d'archi), e quella tesa, in minore, con archi bassi e un ostinato che incalza. Si mescolano in base alla rabbia: più
// sale, più la prima si spegne e cresce la seconda, e il tempo stringe. Così la musica dice come sta il protagonista
// prima ancora della barra. Si abbassa da sola quando qualcuno parla, e tace durante i giochi sul tablet.
import { audio, cfg, clamp } from './core.js';
import { ascoltaVoce } from './narrazione.js';

const hz = m => 440 * Math.pow(2, (m - 69) / 12);
// otto battute, otto crome per battuta (0 = pausa). Numeri MIDI, fa maggiore.
const MELODIA = [
  [72, 0, 77, 0, 81, 0, 79, 77], [74, 0, 77, 0, 74, 0, 72, 0], [70, 0, 74, 0, 77, 0, 74, 70], [72, 0, 76, 0, 79, 0, 0, 0],
  [81, 0, 79, 77, 72, 0, 77, 0], [76, 0, 72, 0, 69, 0, 72, 76], [77, 0, 74, 0, 76, 0, 79, 0], [77, 0, 0, 72, 77, 0, 0, 0]
];
const ACCORDI = [[53, 57, 60], [50, 53, 57], [46, 50, 53], [48, 52, 55], [53, 57, 60], [45, 48, 52], [46, 50, 53], [53, 57, 60]];        // fa, re-, sib, do, fa, la-, sib(-do), fa
const ACCORDI_TESI = [[53, 56, 60], [49, 53, 56], [46, 49, 53], [48, 52, 55], [53, 56, 60], [44, 48, 51], [46, 49, 53], [53, 56, 60]];   // fa-, reb, sib-, do, fa-, lab, sib-, fa-
const CANTO_TESO = [[65, 68], [68, 65], [70, 73], [72, 67], [65, 68], [72, 68], [70, 72], [65, 0]];                                      // due note lunghe per battuta

let ctx = null, master = null, busA = null, busT = null, timer = null, prossimo = 0, passo = 0, umore = 0, meta = 0, attiva = false, voce = false, scena = 1;

function nota(tipo, f, t, dur, bus, { filtro = 0, stona = 0, vibrato = 0 } = {}) {
  const o = ctx.createOscillator(), g = ctx.createGain(); o.type = tipo; o.frequency.setValueAtTime(f, t); o.detune.value = stona; g.gain.value = 0;
  let fine = g;
  if (filtro) { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = filtro; g.connect(lp); fine = lp; }
  if (vibrato) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 5; lg.gain.value = vibrato; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + .4); }
  o.connect(g); fine.connect(bus); o.start(t); o.stop(t + dur + .4); return g;
}
const colpo = (g, t, a, d, vol) => { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
const tenuta = (g, t, dur, vol, a = .3) => { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(a, dur * .4)); g.gain.setValueAtTime(vol, t + dur * .75); g.gain.linearRampToValueAtTime(0.0001, t + dur + .3); };
// piano elettrico: attacco morbido, coda lunga
const piano = (m, t, vol, bus, coda = 1.3) => { colpo(nota('sine', hz(m), t, coda, bus), t, .008, coda, vol); colpo(nota('triangle', hz(m), t, coda * .5, bus, { filtro: 1500 }), t, .008, coda * .45, vol * .35); colpo(nota('sine', hz(m) * 2, t, .4, bus), t, .005, .35, vol * .12); };
// carillon: una campanella chiara
const carillon = (m, t, vol, bus) => { colpo(nota('sine', hz(m), t, .9, bus), t, .003, .9, vol); colpo(nota('sine', hz(m) * 3.01, t, .25, bus), t, .003, .22, vol * .18); };
// voce del tema: un flauto dolce
const flauto = (m, t, dur, vol, bus) => { tenuta(nota('sine', hz(m), t, dur, bus, { vibrato: 2.5 }), t, dur, vol, .05); tenuta(nota('triangle', hz(m) * 2, t, dur, bus), t, dur, vol * .1, .05); };
// archi: due onde appena scordate, filtrate
const archi = (m, t, dur, vol, bus, filtro = 700) => { for (const s of [-7, 7]) tenuta(nota('sawtooth', hz(m), t, dur, bus, { filtro, stona: s }), t, dur, vol, .5); };
const pizz = (m, t, vol, bus) => { colpo(nota('triangle', hz(m), t, .3, bus, { filtro: 1600 }), t, .004, .22, vol); colpo(nota('sawtooth', hz(m), t, .2, bus, { filtro: 900 }), t, .004, .1, vol * .3); };

function suonaPasso(n, t, croma) {
  const b = Math.floor(n / 8) % 8, s = n % 8, giro = Math.floor(n / 64) % 2;
  // --- casa: accordo spezzato al piano elettrico, basso lungo, tema al flauto (al secondo giro entra dopo, col carillon)
  if (umore < .97) {
    const acc = (b === 6 && s >= 4) ? ACCORDI[3] : ACCORDI[b];
    if (s === 0 || s === 4) tenuta(nota('sine', hz(acc[0] < 50 ? acc[0] : acc[0] - 12), t, croma * 3.6, busA), t, croma * 3.6, s ? .09 : .13, .04);   // il basso non scende sotto quello che un tablet riesce a far sentire
    const arp = [acc[0], acc[2], acc[1] + 12, acc[2], acc[0] + 12, acc[2], acc[1] + 12, acc[2]][s];
    piano(arp, t, s % 2 ? .035 : .055, busA);
    if (s === 0) archi(acc[1] + 12, t, croma * 7.6, .012, busA, 1200);
    const m = MELODIA[b][s];
    if (m && (!giro || b >= 4)) flauto(m, t, croma * (MELODIA[b][(s + 1) % 8] ? .95 : 1.9), .07, busA);
    if (m && giro && (s === 0 || s === 4)) carillon(m + 12, t, .035, busA);
  }
  // --- tensione: archi bassi tenuti, ostinato che incalza, un canto lento e scuro
  if (umore > .03) {
    const acc = (b === 6 && s >= 4) ? ACCORDI_TESI[3] : ACCORDI_TESI[b];
    if (s === 0) { archi(acc[0] - 12, t, croma * 7.6, .08, busT, 420); archi(acc[2] - 12, t, croma * 7.6, .045, busT, 420); archi(acc[1], t, croma * 7.6, .03, busT, 560); }
    pizz(s % 4 === 3 ? acc[2] - 12 : acc[0] - 12, t, s % 2 ? .05 : .09, busT);
    if (s === 0 || s === 4) { const m = CANTO_TESO[b][s / 4]; if (m) tenuta(nota('triangle', hz(m - 12), t, croma * 3.7, busT, { filtro: 900, vibrato: 2 }), t, croma * 3.7, .1, .12); }
  }
}
function giro() {
  if (!attiva || !ctx) return;
  umore += (meta - umore) * .12;
  const t = ctx.currentTime;
  busA.gain.setTargetAtTime(Math.cos(umore * Math.PI / 2), t, .3); busT.gain.setTargetAtTime(Math.sin(umore * Math.PI / 2), t, .3);
  master.gain.setTargetAtTime((cfg().musica ? .5 : 0) * scena * (voce ? .38 : 1), t, voce ? .12 : .5);
  if (prossimo < t - .25) prossimo = t + .05;   // la scheda era in pausa: si riparte da adesso, senza recuperare le note perse
  while (prossimo < t + .3) { const croma = 60 / 84 / 2 * (1 - .14 * umore); suonaPasso(passo++, prossimo, croma); prossimo += croma; }
}
export const Musica = {
  avvia() {
    ctx = audio(); if (!ctx || attiva) return;
    if (!master) { master = ctx.createGain(); master.gain.value = 0; busA = ctx.createGain(); busT = ctx.createGain(); busT.gain.value = 0;
      const comp = ctx.createDynamicsCompressor(); busA.connect(master); busT.connect(master); master.connect(comp); comp.connect(ctx.destination); ascoltaVoce(on => { voce = on; }); }
    attiva = true; passo = 0; prossimo = ctx.currentTime + .15; timer = setInterval(giro, 70); giro();
  },
  ferma() { attiva = false; clearInterval(timer); if (master) master.gain.setTargetAtTime(0, ctx.currentTime, .4); },
  // rabbia 0–100: fino al giallo la musica resta quella di casa, dall'arancione in su è quasi tutta tesa
  rabbia(v) { meta = clamp((v - 38) / 34, 0, 1); },
  // quanto si sente in questo momento della storia: 1 normale, 0 muta (giochi sul tablet, musica in cuffia)
  scena(k) { scena = clamp(k, 0, 1); },
  get umore() { return umore; }, get attiva() { return attiva; }, get volume() { return master ? master.gain.value : 0; }
};

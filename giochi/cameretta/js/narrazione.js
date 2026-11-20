// La voce dell'episodio.
// Ogni frase della narratrice e dei personaggi ha una registrazione in assets/voce (voce naturale, preparata con
// strumenti/genera-voce.py). Il nome del file è l'impronta di (chi parla + testo): se il testo cambia o il nome del
// protagonista è diverso da quello registrato, quella frase non ha registrazione e la legge la voce del dispositivo.
// Le registrazioni si scaricano quando servono e si tengono compresse: in memoria ne resta decodificata una alla volta.
import { cfg, audio, sleep, clamp, usaVoce } from './core.js';
import { chiaveVoce } from './testi.js';
import { fumetto, togli } from './persone.js';

const BASE = 'assets/voce/';
const VOLUME = { n: 1, mamma: .95, papa: .95, giulia: .9, leo: .9, f: .9 };
let indice = null, caricamento = null;
const compressi = new Map();   // id → Promise<ArrayBuffer>
const pacchi = new Map();      // numero → Promise<{ id: base64 }>  (solo nell'anteprima pubblicata, che non accetta file audio)
let gen = 0, fineAttuale = Promise.resolve(), fermaAttuale = null, parlanti = 0;
const ascoltatori = [];

/* chi vuole sapere quando qualcuno parla (la musica si abbassa) */
export function ascoltaVoce(f) { ascoltatori.push(f); }
function segnala(d) { parlanti = Math.max(0, parlanti + d); ascoltatori.forEach(f => { try { f(parlanti > 0); } catch (e) {} }); }

export function caricaVoce() {
  caricamento = caricamento || fetch(BASE + 'indice.json').then(r => r.ok ? r.json() : null).then(j => { indice = j; }).catch(() => { indice = null; });
  return caricamento;
}
// con che voci si gioca: 'tutte' | 'narratrice' | 'no'
const parla = chi => { const m = cfg().voce; return m !== 'no' && m !== false && (chi === 'n' || m !== 'narratrice'); };
export const durata = (chi, testo) => (indice && indice.frasi[chiaveVoce(chi, testo)]) || 0;

function dati(id) {
  if (!compressi.has(id)) {
    let p;
    if (indice.formato === 'pacchi') {
      const k = indice.pacco[id];
      if (!pacchi.has(k)) pacchi.set(k, fetch(BASE + 'pacco-' + k + '.json').then(r => r.json()));
      p = pacchi.get(k).then(o => { const bin = atob(o[id]), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; });
    } else p = fetch(BASE + id + '.mp3').then(r => { if (!r.ok) throw new Error('voce ' + id); return r.arrayBuffer(); });
    compressi.set(id, p); p.catch(() => compressi.delete(id));
  }
  return compressi.get(id);
}
// scarica in anticipo le frasi che stanno per servire: così partono senza attesa
export async function prepara(frasi, chi = 'n') {
  await caricaVoce(); if (!indice || !parla(chi)) return;
  for (const t of [].concat(frasi)) { const id = chiaveVoce(chi, t); if (indice.frasi[id]) dati(id).catch(() => {}); }
}
const decodifica = buf => new Promise((ok, no) => { const a = audio(); try { const p = a.decodeAudioData(buf.slice(0), ok, no); if (p && p.catch) p.catch(no); } catch (e) { no(e); } });

async function registrata(id, chi, g) {
  const buf = await decodifica(await dati(id));
  if (g !== gen) return;
  await new Promise(ok => {
    const a = audio(), s = a.createBufferSource(), v = a.createGain(); v.gain.value = VOLUME[chi] || 1;
    s.buffer = buf; s.connect(v); v.connect(a.destination);
    let chiuso = false, t;
    const fine = () => { if (chiuso) return; chiuso = true; clearTimeout(t); if (fermaAttuale === ferma) fermaAttuale = null; segnala(-1); ok(); };
    const ferma = () => { try { s.stop(); } catch (e) {} fine(); };
    s.onended = fine; fermaAttuale = ferma; segnala(1); s.start();
    t = setTimeout(fine, buf.duration * 1000 + 500);
  });
  if (g === gen) await sleep(220);   // un respiro dopo la frase
}

/* la voce del dispositivo, come riserva: si sceglie la voce italiana migliore installata, si parla un po' più piano,
   un periodo alla volta, e ogni personaggio ha la sua altezza */
let voceIt = null;
function scegliVoce() {
  try {
    const vv = speechSynthesis.getVoices().filter(v => /^it/i.test(v.lang)); if (!vv.length) return;
    const punti = v => (/natural|neural|premium|enhanced|migliorata|siri/i.test(v.name) ? 6 : 0) + (/online/i.test(v.name) ? 2 : 0) + (/google/i.test(v.name) ? 3 : 0) + (/federica|alice|elsa|isabella/i.test(v.name) ? 1 : 0) + (/it-IT/i.test(v.lang) ? 1 : 0) - (/compact|espeak/i.test(v.name) ? 4 : 0);
    voceIt = vv.sort((a, b) => punti(b) - punti(a))[0];
  } catch (e) {}
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) { scegliVoce(); try { speechSynthesis.addEventListener('voiceschanged', scegliVoce); } catch (e) {} }
const ALTEZZA = { n: 1, mamma: 1.05, papa: .8, giulia: 1.45, leo: 1.35, f: 1.25 };
function dispositivo(t, chi, g) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return Promise.resolve();
  return new Promise(ok => {
    let chiuso = false, timer;
    const fine = () => { if (chiuso) return; chiuso = true; clearTimeout(timer); if (fermaAttuale === ferma) fermaAttuale = null; segnala(-1); ok(); };
    const ferma = () => { try { speechSynthesis.cancel(); } catch (e) {} fine(); };
    try {
      speechSynthesis.cancel();
      const pezzi = String(t).replace(/[«»()]/g, '').match(/[^.!?…]+[.!?…]*/g) || [t];
      pezzi.forEach((p, i) => { const u = new SpeechSynthesisUtterance(p.trim()); if (voceIt) u.voice = voceIt; u.lang = 'it-IT'; u.rate = .94; u.pitch = ALTEZZA[chi] || 1;
        if (i === pezzi.length - 1) u.onend = u.onerror = fine; speechSynthesis.speak(u); });
      fermaAttuale = ferma; segnala(1);
      timer = setTimeout(fine, clamp(String(t).length * 95, 1500, 30000));   // alcuni browser non avvisano quando la frase finisce
    } catch (e) { segnala(1); fine(); }
  });
}

async function dire(t, chi, g) {
  await caricaVoce();
  if (g !== gen) return;
  const id = chiaveVoce(chi, t);
  if (indice && indice.frasi[id] && audio()) { try { await registrata(id, chi, g); return; } catch (e) { if (g !== gen) return; } }
  await dispositivo(t, chi, g);
}
// dice una frase. `chi`: n (narratrice) o un personaggio. Di norma una frase nuova interrompe quella in corso;
// con `accoda` aspetta che la precedente sia finita (gli aiuti che arrivano mentre la narratrice sta parlando).
function parlaOra(t, { chi = 'n', accoda = false } = {}) {
  if (!t || !parla(chi)) return Promise.resolve();
  if (accoda) { const g = gen, prima = fineAttuale; fineAttuale = prima.then(() => g === gen ? dire(t, chi, g) : null); }
  else { const g = ++gen; if (fermaAttuale) fermaAttuale(); fineAttuale = dire(t, chi, g); }
  return fineAttuale;
}
export function zitto() { gen++; if (fermaAttuale) fermaAttuale(); fineAttuale = Promise.resolve(); }
usaVoce(parlaOra);

/* un personaggio parla: fumetto, voce (la sua), bocca che si muove; aspetta il tempo di ascoltare o di leggere */
export async function dici(p, testo, { ms = 0, voce = true, resta = false } = {}) {
  const el = fumetto(p, testo), chi = p.voce || 'n', conVoce = voce && parla(chi);
  const fine = conVoce ? parlaOra(testo, { chi }) : null;
  if (p.parla) try { p.parla(true); } catch (e) {}
  const leggere = clamp(1500 + testo.length * 58, 2300, 6500);
  if (conVoce) await Promise.race([Promise.all([fine, sleep(ms ? Math.min(ms, 900) : 900)]), sleep(20000)]);
  else await sleep(ms || leggere);
  if (p.parla) try { p.parla(false); } catch (e) {}
  if (!resta && el.isConnected) togli(p);
}

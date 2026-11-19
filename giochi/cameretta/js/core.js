// Configurazione, dati di sessione, audio e piccole utility condivise.
export const DEFAULT_CFG = {
  nome: 'Francesco', livello: 2, aiuto: 'completo', prove: 3,
  vittorie: 2,            // partite al tablet vinte (facili) prima delle sconfitte
  sconfitte: 2,           // sconfitte consecutive che portano la rabbia in zona arancione
  respiri: 3,             // respiri a tempo di musica nell'attività "ascolta la musica"
  secondiAttivita: 25,    // durata minima delle altre attività che calmano (disegno)
  saccoCalma: false,      // il sacco da boxe è anche una scelta per calmarsi (di base è solo un gioco premio)
  secondiPremio: 30, secondiBlaster: 40, secondiAiutoRitardato: 10,
  criterio: 80, sessioniCriterio: 3, voce: true, pin: '1234'
};
const STORE = 'giochiAba.cameretta.v2';
export const db = (() => {
  try { const d = JSON.parse(localStorage.getItem(STORE)); if (d && d.cfg) { d.cfg = { ...DEFAULT_CFG, ...d.cfg }; return d; } } catch (e) {}
  return { cfg: { ...DEFAULT_CFG }, sessions: [] };
})();
export function save() { try { localStorage.setItem(STORE, JSON.stringify(db)); } catch (e) {} }
export const cfg = () => db.cfg;
export const N = () => cfg().nome;

export const $ = id => document.getElementById(id);
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

let ctx;
export function audio() { try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); } catch (e) {} return ctx; }
export function tone(freq, dur = .15, type = 'sine', vol = .1, delay = 0) {
  const a = audio(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + delay;
  o.type = type; o.frequency.setValueAtTime(freq, t); g.gain.setValueAtTime(vol, t);
  o.connect(g); g.connect(a.destination); o.start(t); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.stop(t + dur + .02);
}
export function noise(dur = .3, vol = .2, freq = 800) {
  const a = audio(); if (!a) return;
  const b = a.createBuffer(1, a.sampleRate * dur, a.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); f.type = 'lowpass'; f.frequency.value = freq; g.gain.value = vol;
  s.buffer = b; s.connect(f); f.connect(g); g.connect(a.destination); s.start();
}
export const jingle = { win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, .22, 'triangle', .09, i * .12)), lose: () => [392, 330, 262].forEach((f, i) => tone(f, .3, 'sawtooth', .05, i * .18)), click: () => tone(620, .05, 'triangle', .06) };

export function speak(t) {
  if (!cfg().voce || !('speechSynthesis' in window)) return;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'it-IT'; u.rate = 1; speechSynthesis.speak(u); } catch (e) {}
}
export function caption(t, voice = true) { const c = $('caption'); c.textContent = t || ''; c.style.display = t ? 'block' : 'none'; if (t && voice) speak(t); }
export function objective(t) { const o = $('objective'); o.textContent = t || ''; o.style.display = t ? 'block' : 'none'; }
export function toast(t, ms = 1600) { const el = $('toast'); el.textContent = t; el.getAnimations().forEach(a => a.cancel()); el.animate([{ opacity: 0, transform: 'translate(-50%,-30%) scale(.7)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: .15 }, { opacity: 1, transform: 'translate(-50%,-55%) scale(1)', offset: .8 }, { opacity: 0, transform: 'translate(-50%,-70%) scale(1)' }], { duration: ms, easing: 'ease-out' }); }
export function heartbeat() { tone(62, .16, 'sine', .35); tone(55, .2, 'sine', .3, .2); }
export function overlay(id, on) { $(id).classList.toggle('active', on); }
// dissolvenza a nero, con un testo facoltativo al centro (cambio di stanza, salto di tempo)
export async function buio(on, testo = '') { const f = $('fade'); f.firstElementChild.textContent = testo; f.classList.toggle('active', on); await sleep(on ? 520 : 420); }

// tween semplice guidato dal ciclo di animazione principale
const tweens = [];
export function tween(fn, a, b, ms, ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2) { return new Promise(res => tweens.push({ fn, a, b, ms, t0: performance.now(), res, ease })); }
export function stepTweens(now) { for (let i = tweens.length - 1; i >= 0; i--) { const w = tweens[i], k = Math.min(1, (now - w.t0) / w.ms); w.fn(w.a + (w.b - w.a) * w.ease(k)); if (k >= 1) { tweens.splice(i, 1); w.res(); } } }

// La frustrazione di Andrea: un valore continuo da 0 a 100 che si muove in tempo reale (stesso motore della rabbia
// della cameretta). Cinque zone da 20 punti. La zona arancione (60–80) davanti a un enigma bloccato è lo stimolo
// discriminativo: è il momento di chiedere aiuto.
// valore mostrato = base (dove porta la situazione) + picco (l'effetto breve di un singolo evento, che poi svanisce).
import { $, clamp, N } from './core.js';

export const ZONE = [
  { nome: 'Tranquillo', c: '#3fcf7a', umore: 'felice' },
  { nome: 'Concentrato', c: '#3fcf7a', umore: 'normale' },
  { nome: 'Agitato', c: '#f5c534', umore: 'seccato' },
  { nome: 'Frustrato', c: '#f5862a', umore: 'arrabbiato' },
  { nome: 'Al limite', c: '#ef4545', umore: 'furioso' }
];
export const SEGNALI = { 2: ['Sbuffa', 'Respiro veloce'], 3: ['Pensa: «È impossibile!»', 'Mani che sudano', 'Voglia di mollare tutto'], 4: ['Vuole colpire il pannello', 'Vuole scappare via'] };
export const VALORE = [8, 28, 50, 70, 92];          // valore tipico di ogni zona
const ISTERESI = 3;                                 // per scendere di zona bisogna calare un po' sotto la soglia

export const Frustrazione = {
  v: 8, base: 8, picco: 0, tetto: 100, zona: 0, volto: null, umore: null, segnali: false, onZona: null,
  init(volto) { this.volto = volto; this.disegna(true); },
  // porta la rabbia al valore tipico di una zona (0–4)
  set(zona, { umore = null, subito = false } = {}) { this.porta(VALORE[clamp(zona, 0, 4)], { umore, subito }); },
  // porta la rabbia a un valore preciso (0–100)
  porta(v, { umore = null, subito = false } = {}) {
    this.base = clamp(v, 0, 100); this.picco = 0; this.umore = umore;
    if (subito) this.v = this.base;
    this.disegna(true);
  },
  // un evento breve: positivo fa salire, negativo fa scendere
  spinta(d) { this.picco = clamp(this.picco + d, -18, 24); },
  update(dt) {
    this.picco *= Math.exp(-dt / 3.5);
    const t = clamp(this.base + this.picco, 0, this.tetto);
    this.v += (t - this.v) * (1 - Math.exp(-dt * 2.6));
    this.disegna(false);
  },
  disegna(forza) {
    let z = this.zona;
    while (z < 4 && this.v >= (z + 1) * 20) z++;
    while (z > 0 && this.v < z * 20 - ISTERESI) z--;
    const cambiata = z !== this.zona, prima = this.zona; this.zona = z;
    const Z = ZONE[z], fill = $('angerFill');
    if (fill) { fill.style.width = this.v.toFixed(1) + '%'; fill.style.background = Z.c; }
    if (cambiata || forza) {
      $('angerState').textContent = Z.nome; $('angerState').style.color = Z.c;
      $('anger').classList.toggle('pulse', z >= 3);
      const sig = SEGNALI[z], el = $('signals');
      if (sig && this.segnali) { el.innerHTML = '<div class="t">SEGNALI DEL CORPO DI ' + N().toUpperCase() + '</div>' + sig.map(x => '<div class="s"><i style="background:' + Z.c + '"></i>' + x + '</div>').join(''); el.style.borderLeftColor = Z.c; el.style.display = 'block'; }
      else el.style.display = 'none';
    }
    if (this.volto) this.volto.set(this.umore || Z.umore, Math.round(clamp((this.v - 40) / 45, 0, 1) * 10) / 10);
    if (cambiata && this.onZona) this.onZona(z, prima);
  }
};

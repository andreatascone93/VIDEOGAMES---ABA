// Il tablet di Francesco: menu dei giochi, partite vere con esito programmato ("regia"), schermata del risultato.
// I giochi sono reali e giocabili; la regia decide solo quanto sono forti gli avversari.
// Durante la partita il gioco racconta cosa succede (onEvento): serve a muovere la rabbia in tempo reale.
import { $, cfg, N, jingle } from './core.js';

const KART_URL = 'kart-royale/index.html';

export class Tablet {
  constructor() {
    this.ov = $('tabletOv'); this.screen = $('screen');
    this.kartMsg = null; this._stop = null; this._annulla = null; this._n = 0;
    addEventListener('message', e => { const d = e.data; if (d && d.sorgente === 'kart-royale' && this.kartMsg) this.kartMsg(d); });
  }
  apri({ schermoIntero = false } = {}) {
    this.ov.classList.toggle('full', schermoIntero);
    this.ov.style.cssText = schermoIntero ? 'left:0;right:0;top:0;bottom:0;width:auto;border-radius:0;padding:0' : '';
    this.ov.classList.add('active'); document.body.classList.toggle('intablet', !schermoIntero);
    document.querySelectorAll('.kname').forEach(e => e.textContent = N());
    const d = new Date(); $('tOra').textContent = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  }
  chiudi() {
    this.interrompi('chiuso'); this.pulisci(); this.mostra(null);
    this.ov.classList.remove('active'); document.body.classList.remove('intablet');
  }
  get aperto() { return this.ov.classList.contains('active'); }
  mostra(id) { ['tMenu', 'tLoad', 'tResult'].forEach(s => $(s).classList.toggle('active', s === id)); }
  pulisci() {
    if (this._annulla) { this._annulla(); this._annulla = null; }
    this.kartMsg = null;
    this.screen.querySelectorAll('iframe').forEach(f => f.remove());
    if (this.blaster) { this.blaster.distruggi(); this.blaster = null; }
    $('blasterBox').classList.remove('active');
  }

  scegliGioco() {
    this.pulisci(); this.mostra('tMenu');
    return new Promise(ok => {
      const fine = g => { jingle.click(); $('cardKart').onclick = $('cardBlaster').onclick = null; ok(g); };
      $('cardKart').onclick = () => fine('kart');
      $('cardBlaster').onclick = () => fine('blaster');
    });
  }

  /* Gioca una partita. esito programmato: 'vinci' | 'perdi'.
     onEvento riceve: { tipo: 'via' } · { tipo: 'tempo', progresso 0..1 } · { tipo: 'punto', chi: 'io' | 'rivale' }
                      · { tipo: 'posizione', posizione, prima }   (solo corsa)
     Se la partita viene interrotta (interrompi) il risultato è { interrotta: motivo }. */
  async partita(gioco, esito, { onEvento = () => {} } = {}) {
    this.pulisci();
    const n = ++this._n;
    const stop = new Promise(ok => this._stop = m => ok({ interrotta: m || 'posa' }));
    const r = await Promise.race([gioco === 'kart' ? this.kart(esito, onEvento) : this.blasterPartita(esito, onEvento, n), stop]);
    this._stop = null;
    if (r.interrotta) { this._n++; this.pulisci(); }
    return r;
  }
  interrompi(motivo) { if (this._stop) this._stop(motivo); }
  get inPartita() { return !!this._stop; }

  kart(esito, onEvento) {
    this.mostra('tLoad'); $('tLoad').textContent = 'Kart Royale · caricamento…';
    const f = document.createElement('iframe');
    f.src = KART_URL + '?aba=1&giri=1&esito=' + esito;
    f.allow = 'autoplay; fullscreen; gamepad';
    this.screen.prepend(f);
    return new Promise(ok => {
      let finito = false, partito = false, pos = 0, t0 = 0, tic = 0;
      const via = () => { if (partito) return; partito = true; t0 = performance.now(); this.mostra(null); f.focus(); onEvento({ tipo: 'via' });
        // se il gioco non manda lo stato, l'avanzamento si stima dal tempo (un giro dura circa un minuto)
        tic = setInterval(() => onEvento({ tipo: 'tempo', progresso: Math.min(1, (performance.now() - t0) / 62000), stimato: true }), 500); };
      const chiudi = (posizione) => { if (finito) return; finito = true; this._annulla = null; clearTimeout(scadenza); clearInterval(tic); this.kartMsg = null;
        const vinto = posizione === 1;
        ok({ vinto, punteggio: posizione + '° posto', titolo: posizione + '° POSTO', desc: vinto ? 'Hai tagliato il traguardo per primo!' : 'Un avversario ti ha superato prima del traguardo.' }); };
      const scadenza = setTimeout(() => chiudi(esito === 'vinci' ? 1 : 2), 240000);
      this._annulla = () => { finito = true; clearTimeout(scadenza); clearInterval(tic); };
      this.kartMsg = d => {
        if (d.tipo === 'pronto') { via(); t0 = performance.now(); }   // la stima parte da quando il gioco è davvero pronto
        if (d.tipo === 'stato') {
          via();
          if (d.progresso != null) onEvento({ tipo: 'tempo', progresso: Number(d.progresso) });
          const p = Number(d.posizione) || 0;
          if (p && pos && p !== pos) onEvento({ tipo: 'posizione', posizione: p, prima: pos });
          if (p) pos = p;
        }
        if (d.tipo === 'fine') setTimeout(() => chiudi(Number(d.posizione) || 2), 1800);
      };
      // riserva: se il gioco non manda messaggi, la partita si considera partita dopo un po'
      f.addEventListener('load', () => setTimeout(() => { if (!finito) via(); }, 20000));
    });
  }

  async blasterPartita(esito, onEvento, n) {
    this.mostra('tLoad'); $('tLoad').textContent = 'Blaster Arena · caricamento…';
    const { avviaBlaster } = await import('./giochi/blaster.js');
    const box = $('blasterBox'); box.classList.add('active');
    const b = await avviaBlaster(box, { esito, durata: Number(cfg().secondiBlaster) || 40, nome: N(), onEvento });
    if (n !== this._n) { b.distruggi(); return { interrotta: 'chiuso' }; }   // interrotta mentre caricava
    this.blaster = b;
    this.mostra(null);
    const r = await b.fine;
    const vinto = r.punti >= r.puntiMax;
    return { vinto, punteggio: r.punti + '–' + r.puntiMax,
      titolo: (r.punti > r.puntiMax ? 'VITTORIA ' : r.punti === r.puntiMax ? 'PAREGGIO ' : 'SCONFITTA ') + r.punti + '–' + r.puntiMax,
      desc: vinto ? 'Hai colpito più bersagli di Max!' : 'Max ha colpito più bersagli di te.' };
  }

  // schermata del risultato sopra il gioco; restituisce l'id del pulsante scelto (o null se senza pulsanti)
  risultato({ vinto, titolo, desc, kicker = 'RISULTATO', bottoni = [], attesa = 0 }) {
    this.mostra('tResult');
    $('rKicker').textContent = kicker;
    const v = $('rValue'); v.textContent = titolo; v.className = 'rv ' + (vinto ? 'win' : 'lose');
    $('rDesc').textContent = desc || '';
    (vinto ? jingle.win : jingle.lose)();
    const box = $('rBtns'); box.innerHTML = '';
    return new Promise(ok => {
      this._esci = ok;
      if (!bottoni.length) { setTimeout(() => ok(null), attesa || 2500); return; }
      box.style.visibility = 'hidden';
      setTimeout(() => box.style.visibility = '', 700); // evita tocchi accidentali
      for (const b of bottoni) {
        const el = document.createElement('button'); el.className = 'big ' + (b.cls || ''); el.textContent = b.testo; el.id = 'rb-' + b.id;
        el.onclick = () => { jingle.click(); ok(b.id); };
        box.appendChild(el);
      }
    });
  }
  // chiude da fuori la schermata del risultato (es. pulsante "Posa il tablet" nella colonna a sinistra)
  esciDalRisultato(id) { if (this._esci) { const f = this._esci; this._esci = null; f(id); } }
}

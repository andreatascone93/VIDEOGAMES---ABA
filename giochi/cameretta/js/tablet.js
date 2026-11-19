// Il tablet di Francesco: menu dei giochi, partite vere con esito programmato ("regia"), schermata del risultato.
// I giochi sono reali e giocabili; la regia decide solo quanto sono forti gli avversari.
import { $, sleep, cfg, N, jingle } from './core.js';

const KART_URL = 'kart-royale/index.html';

export class Tablet {
  constructor() {
    this.ov = $('tabletOv'); this.screen = $('screen');
    this.kartMsg = null;
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
    this.pulisci(); this.mostra(null);
    this.ov.classList.remove('active'); document.body.classList.remove('intablet');
  }
  get aperto() { return this.ov.classList.contains('active'); }
  mostra(id) { ['tMenu', 'tLoad', 'tResult'].forEach(s => $(s).classList.toggle('active', s === id)); }
  pulisci() {
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

  // gioca una partita; esito programmato: 'vinci' | 'perdi'
  async partita(gioco, esito, opzioni = {}) {
    this.pulisci();
    return gioco === 'kart' ? this.kart(esito, opzioni) : this.blasterPartita(esito, opzioni);
  }

  kart(esito) {
    this.mostra('tLoad'); $('tLoad').textContent = 'Kart Royale · caricamento…';
    const f = document.createElement('iframe');
    f.src = KART_URL + '?aba=1&giri=1&esito=' + esito;
    f.allow = 'autoplay; fullscreen; gamepad';
    this.screen.prepend(f);
    return new Promise(ok => {
      let finito = false;
      const chiudi = (posizione) => { if (finito) return; finito = true; clearTimeout(scadenza); this.kartMsg = null;
        const vinto = posizione === 1;
        ok({ vinto, punteggio: posizione + '° posto', titolo: posizione + '° POSTO', desc: vinto ? 'Hai tagliato il traguardo per primo!' : 'Un avversario ti ha superato prima del traguardo.' }); };
      const scadenza = setTimeout(() => chiudi(esito === 'vinci' ? 1 : 2), 240000);
      this.kartMsg = d => {
        if (d.tipo === 'pronto') { this.mostra(null); f.focus(); }
        if (d.tipo === 'fine') setTimeout(() => chiudi(Number(d.posizione) || 2), 1800);
      };
      f.addEventListener('load', () => setTimeout(() => { if (!finito && $('tLoad').classList.contains('active')) { this.mostra(null); f.focus(); } }, 6000));
    });
  }

  async blasterPartita(esito) {
    this.mostra('tLoad'); $('tLoad').textContent = 'Blaster Arena · caricamento…';
    const { avviaBlaster } = await import('./giochi/blaster.js');
    const box = $('blasterBox'); box.classList.add('active');
    this.blaster = await avviaBlaster(box, { esito, durata: Number(cfg().secondiBlaster) || 40, nome: N() });
    this.mostra(null);
    const r = await this.blaster.fine;
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
}

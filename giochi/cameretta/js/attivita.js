// Le attività con cui Francesco ritrova la calma dopo aver posato il tablet.
// La calma non arriva da sola: scende poco a poco mentre fa qualcos'altro, in cameretta o in salone.
//   musica       cuffie e respiro a tempo, in poltrona
//   disegno      un foglio vero su cui disegnare, alla scrivania; il disegno finisce appeso al muro
//   mamma        andare a dirlo alla mamma, con parole sue (comunicazione funzionale)
//   costruzioni  una torre di cubi insieme agli altri bambini, a turno
// Ogni attività riceve un contesto `c` dal gioco e chiama c.calma(k) con k da 0 a 1 man mano che procede.
import * as THREE from 'three';
import { $, cfg, N, sleep, clamp, tone, noise, jingle, caption, overlay, tween, toast, speak } from './core.js';
import { parla, togli } from './persone.js';
import { TORRE, nuovoCubo } from './salone.js';

export function creaAttivita(c) {
  const { P, L, LS } = c;

  /* ---------------------------------------------------------------- musica */
  function suona() {
    const note = [262, 330, 392, 523, 392, 330, 294, 349, 440, 587, 440, 349, 262, 330, 392, 523, 494, 392, 349, 294, 247, 294, 349, 392];
    let i = 0;
    const t = setInterval(() => { tone(note[i % note.length], 1.1, 'triangle', .045); if (i % 6 === 0) tone([131, 147, 131, 98][(i / 6) % 4 | 0], 5.5, 'sine', .06); i++; }, 500);
    return () => clearInterval(t);
  }
  async function musica() {
    await c.vaiA(L.poltrona);
    await c.siedi(L.poltronaSeduto);
    c.cuffie.visible = true; tone(740, .07, 'triangle', .05);
    c.camera_('pausa');
    caption(N() + ' mette le cuffie e ascolta la sua musica preferita. Respira a tempo.');
    await sleep(1800);
    overlay('breathOv', true);
    const n = Math.max(1, Number(cfg().respiri) - (c.breve() ? 1 : 0)), b = $('breath'), tx = $('breathText'), cnt = $('breathCount');
    const ferma = suona();
    for (let i = 0; i < n; i++) {
      cnt.textContent = 'RESPIRO ' + (i + 1) + ' DI ' + n;
      tx.textContent = 'Inspira…'; b.style.transform = 'scale(1.55)';
      tween(v => P.model.scale.y = P.model.scale.x * v, 1, 1.025, 2900);
      await sleep(3000); c.calma((i + .5) / n);
      tx.textContent = 'Espira…'; b.style.transform = 'scale(1)';
      tween(v => P.model.scale.y = P.model.scale.x * v, 1.025, 1, 2900);
      await sleep(3000); c.calma((i + 1) / n);
    }
    ferma(); overlay('breathOv', false); tx.textContent = ''; cnt.textContent = '';
    c.cuffie.visible = false;
    await c.alzatiAnimato();
  }

  /* ---------------------------------------------------------------- disegno */
  const COLORI = ['#1b2538', '#e8453c', '#3b8cf0', '#3fbf6a', '#f5b82e', '#9b6be0'];
  async function disegno() {
    await c.vaiA(L.scrivania);
    c.room.foglio.visible = true;
    P.play('interactStanding', { speed: .45 });
    c.fissa([-.3, 2.1, 1.5], [1.25, .85, -1.5]);
    caption(N() + ' prende un foglio e le matite. Disegna quello che vuoi: mentre disegni la rabbia scende.');
    await sleep(1500);
    const cv = $('disCanvas'), g = cv.getContext('2d');
    g.fillStyle = '#fdfdf8'; g.fillRect(0, 0, cv.width, cv.height); g.lineCap = g.lineJoin = 'round'; g.lineWidth = 9;
    let colore = COLORI[0], giu = false, ultimo = 0, px = 0, py = 0;
    const box = $('disColori'); box.innerHTML = '';
    COLORI.forEach((col, i) => { const bt = document.createElement('button'); bt.style.background = col; bt.id = 'col-' + i; if (!i) bt.className = 'on'; bt.onclick = () => { colore = col; box.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === bt)); jingle.click(); }; box.appendChild(bt); });
    const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * cv.width, (e.clientY - r.top) / r.height * cv.height]; };
    cv.onpointerdown = e => { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (err) {} giu = true; [px, py] = pos(e); g.fillStyle = colore; g.beginPath(); g.arc(px, py, 4.5, 0, 7); g.fill(); ultimo = performance.now(); };
    cv.onpointermove = e => { if (!giu) return; const [x, y] = pos(e); g.strokeStyle = colore; g.beginPath(); g.moveTo(px, py); g.lineTo(x, y); g.stroke(); px = x; py = y; ultimo = performance.now(); };
    cv.onpointerup = cv.onpointercancel = () => { giu = false; };
    const fine = $('disFine'), barra = $('disBar'); fine.classList.remove('pronto'); barra.style.width = '0';
    overlay('disegnoOv', true);
    const T = Math.max(6, Number(cfg().secondiAttivita) || 25) * (c.breve() ? .7 : 1);
    let k = 0, pronto = false, chiudi;
    const finito = new Promise(ok => chiudi = ok);
    fine.onclick = () => { jingle.click(); chiudi(); };
    const tic = setInterval(() => {
      const disegna = performance.now() - ultimo < 900;
      k = Math.min(1, k + .2 / T * (disegna ? 1.5 : .55)); c.calma(k); barra.style.width = (k * 100) + '%';
      if (k >= 1 && !pronto) { pronto = true; fine.classList.add('pronto'); tone(660, .15, 'triangle', .06); caption(N() + ' è più calmo. Può finire il disegno quando vuole.', false); setTimeout(chiudi, 25000); }
    }, 200);
    await finito; clearInterval(tic);
    cv.onpointerdown = cv.onpointermove = cv.onpointerup = cv.onpointercancel = null;
    // il disegno finisce appeso al muro della cameretta
    const copia = document.createElement('canvas'); copia.width = cv.width; copia.height = cv.height; copia.getContext('2d').drawImage(cv, 0, 0);
    const t = new THREE.CanvasTexture(copia); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    const m = c.room.carta.material; if (m.map) m.map.dispose(); m.map = t; m.needsUpdate = true;
    overlay('disegnoOv', false); c.room.foglio.visible = false; c.room.disegnoMuro.visible = true;
    P.play('idle'); c.camera_('stanza');
    caption(N() + ' appende il disegno al muro.');
    await sleep(2200);
  }

  /* ---------------------------------------------------------------- parlare con la mamma */
  function battute(titolo, opzioni) {
    const box = $('dialogo'); box.innerHTML = '';
    const t = document.createElement('div'); t.className = 't'; t.textContent = titolo.toUpperCase(); box.appendChild(t);
    return new Promise(ok => {
      opzioni.forEach((testo, i) => { const b = document.createElement('button'); b.className = 'batt'; b.id = 'batt-' + i; b.textContent = '«' + testo + '»'; b.onclick = () => { jingle.click(); box.classList.remove('active'); ok(i); }; box.appendChild(b); });
      box.classList.add('active');
    });
  }
  async function mamma() {
    const M = c.mamma, cosaDice = 'Cosa dice ' + N() + '?';
    await c.vaiA(LS.daMamma);
    c.fissa([-.6, 1.75, 1.7], [-1.25, .9, -1.9]);
    caption('');
    const D1 = ['Ho perso tante volte e sono arrabbiato.', 'Ho bisogno di una pausa. Posso stare un po\' qui con te?'];
    const a = await battute(cosaDice, D1);
    await parla(P, D1[a]);
    await parla(M, a === 0 ? 'Capisco. Perdere tante volte di fila fa arrabbiare. Vieni, siediti qui.' : 'Certo. Vieni, siediti qui vicino a me.');
    await c.siedi(LS.divanoF); c.calma(c.breve() ? .5 : .35);
    if (!c.breve()) {
      await parla(M, 'Vuoi un bicchiere d\'acqua o preferisci raccontarmi com\'è andata?');
      const D2 = ['Un po\' d\'acqua, grazie.', 'Ti racconto la partita.'];
      const b = await battute(cosaDice, D2);
      await parla(P, D2[b]);
      if (b === 0) { caption(N() + ' beve piano. Il cuore rallenta.'); c.bevi(true); await sleep(3200); c.bevi(false); }
      else { caption(N() + ' racconta la partita alla mamma. Parlarne lo fa sentire più leggero.'); await sleep(2600); await parla(M, 'Eri a un passo dal vincere. Ci sta che ti sei arrabbiato.'); }
      c.calma(.7); caption('');
    }
    await parla(M, 'Come ti senti adesso?');
    const D3 = ['Meglio.', 'Ancora un po\' arrabbiato, ma sta passando.'];
    const d = await battute(cosaDice, D3);
    await parla(P, D3[d]);
    c.calma(1);
    await parla(M, d === 0 ? 'Si vede. Quando vuoi, torna pure a giocare.' : 'Va bene così. Resta qui finché ti va.');
    await c.alzatiAnimato();
  }

  /* ---------------------------------------------------------------- costruzioni con gli altri bambini */
  const LATO = .17;
  async function costruzioni() {
    const [leo, giulia] = c.bimbi, T = c.sal.torre, stanza = c.sal.gruppo;
    while (T.children.length) T.remove(T.children[0]);
    await c.vaiA(LS.gioco);
    await c.siedi(LS.terraF);
    c.fissa([TORRE.x + .15, 1.7, TORRE.z + 3.5], [TORRE.x, .7, TORRE.z]);
    caption('');
    await parla(leo, 'Ciao ' + N() + '! Ci aiuti a fare la torre?');
    caption('Tocca METTI IL PEZZO quando il cubo è sopra la torre. Si gioca a turno.', false);
    const tot = c.breve() ? 6 : 10, miei = tot / 2;
    $('tTot').textContent = tot; $('tPezzi').textContent = 0; $('torreHud').classList.add('active');
    let pezzi = 0, messi = 0, xTop = 0, occupato = false, t0 = performance.now(), raf = 0, cubo = null, fine;
    const finito = new Promise(ok => fine = ok);
    const nuovo = () => { cubo = nuovoCubo(); stanza.add(cubo); t0 = performance.now(); };
    const giro = () => { raf = requestAnimationFrame(giro); if (cubo && !occupato) { const t = (performance.now() - t0) / 1000; cubo.position.set(TORRE.x + Math.sin(t * 1.9) * .55, pezzi * LATO + .55, TORRE.z); cubo.rotation.y = t * .6; } };
    const scarto = () => cubo ? cubo.position.x - (TORRE.x + xTop) : 9;
    c.debug.torre = scarto;
    const appoggia = (m, x) => { stanza.remove(m); T.add(m); m.position.set(x, pezzi * LATO + LATO / 2, 0); m.rotation.y = (Math.random() - .5) * .25; pezzi++; $('tPezzi').textContent = pezzi; tone(300 + pezzi * 40, .12, 'triangle', .1); noise(.06, .2, 900); };
    const commenti = ['Bel pezzo!', 'Sta venendo alta!', 'Piano… perfetto.', 'Ancora uno!'];
    async function metti() {
      if (occupato || !cubo) return; occupato = true;
      const m = cubo, dx = scarto(), x0 = m.position.x, y0 = m.position.y; cubo = null;
      if (Math.abs(dx) <= .13) {
        const x = clamp(xTop + dx * .5, -.06, .06), yT = pezzi * LATO + LATO / 2;
        await tween(k => m.position.set(x0 + (TORRE.x + x - x0) * k, y0 + (yT - y0) * k * k, TORRE.z), 0, 1, 260, t => t);
        xTop = x; appoggia(m, x); messi++; c.calma(messi / miei);
        if (pezzi >= tot) { fine(); return; }
        // tocca a uno degli altri bambini: il suo cubo arriva dal suo lato
        const chi = messi % 2 ? leo : giulia, lato = chi === leo ? -1 : 1, suo = nuovoCubo(); stanza.add(suo);
        if (messi % 2) parla(chi, commenti[(messi >> 1) % commenti.length], { ms: 1500, voce: false });
        const yS = pezzi * LATO + LATO / 2, xS = clamp(xTop + (Math.random() - .5) * .05, -.06, .06);
        await tween(k => suo.position.set(TORRE.x + lato * .6 * (1 - k) + xS * k, .25 + (yS - .25) * k + Math.sin(k * Math.PI) * .35, TORRE.z + .12 * (1 - k)), 0, 1, 650);
        xTop = xS; appoggia(suo, xS);
        if (pezzi >= tot) { fine(); return; }
      } else {
        // fuori dalla torre: il cubo cade sul tappeto, nessun problema, si riprova
        const xF = TORRE.x + xTop + Math.sign(dx) * (.3 + Math.random() * .25), zF = TORRE.z + .25 + Math.random() * .2;
        await tween(k => m.position.set(x0 + (xF - x0) * k, y0 + (LATO / 2 - y0) * k * k, TORRE.z + (zF - TORRE.z) * k), 0, 1, 380, t => t);
        tone(180, .1, 'sine', .08); c.sal.sparsi.push(m);
        if (Math.random() < .5) parla(giulia, 'Quasi! Riprova.', { ms: 1300, voce: false });
      }
      nuovo(); occupato = false;
    }
    $('bMetti').onpointerdown = e => { e.preventDefault(); metti(); };
    const tasto = e => { if (e.key === ' ' || e.key === 'Enter') metti(); };
    addEventListener('keydown', tasto);
    nuovo(); raf = requestAnimationFrame(giro);
    await finito;
    cancelAnimationFrame(raf); removeEventListener('keydown', tasto); $('bMetti').onpointerdown = null; c.debug.torre = null;
    $('torreHud').classList.remove('active'); caption('');
    jingle.win(); toast('TORRE FINITA!', 1800);
    togli(leo); togli(giulia);
    await parla(giulia, 'Finita! È altissima.');
    await parla(leo, 'Dopo ne facciamo una ancora più alta?');
    await c.alzatiAnimato();
  }

  return { musica, disegno, mamma, costruzioni };
}

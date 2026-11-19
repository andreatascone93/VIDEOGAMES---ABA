// Area terapista de Il segreto del parco: impostazioni, grafico dell'andamento, tabella delle sessioni, esportazione dati.
// Modulo riutilizzabile: cambia solo FIELDS e le colonne di summary/csv per un altro gioco.
import { db, save, cfg, DEFAULT_CFG, $ } from './core.js';

const FIELDS = [
  ['nome', 'Nome del protagonista', 'text'],
  ['livello', 'Livello', 'select', [[1, '1 · Guardo (modeling: chiede aiuto da solo, con gentilezza)'], [2, '2 · Aiuto (aiuto programmato all\'arancione)'], [3, '3 · Decido io (aiuto ritardato)'], [4, '4 · Aspetto (il custode arriva dopo qualche secondo)']]],
  ['aiuto', 'Tipo di aiuto al livello 2', 'select', [['completo', 'Completo: pulsante e custode lampeggianti, freccia, voce, frase gentile per prima'], ['parziale', 'Parziale: solo lampeggio']]],
  ['difficili', 'Enigmi che non si risolvono da soli (0–4, dagli ultimi)', 'number'],
  ['secondiAiutoRitardato', 'Secondi prima dell\'aiuto ritardato (liv. 3–4)', 'number'],
  ['attesaAiuto', 'Secondi di attesa del custode (liv. 4)', 'number'],
  ['provaPrima', 'Il custode chiede di provare almeno una volta prima', 'select', [['false', 'No'], ['true', 'Sì']]],
  ['respiri', 'Respiri della pausa "Fai un respiro"', 'number'],
  ['musica', 'Musica di sottofondo', 'select', [['true', 'Sì'], ['false', 'No']]],
  ['criterio', 'Criterio di padronanza (%)', 'number'],
  ['sessioniCriterio', 'Sessioni consecutive per il criterio', 'number'],
  ['voce', 'Voce narrante', 'select', [['true', 'Sì'], ['false', 'No']]],
  ['pin', 'PIN terapista', 'text']
];

export function initTerapista({ onClose }) {
  $('gear').onclick = () => { $('pinInput').value = ''; $('pinMsg').textContent = cfg().pin === '1234' ? 'PIN iniziale: 1234 (cambialo nelle impostazioni)' : ''; $('pinModal').classList.add('active'); $('pinInput').focus(); };
  $('pinCancel').onclick = () => $('pinModal').classList.remove('active');
  $('pinOk').onclick = () => { if ($('pinInput').value === cfg().pin) { $('pinModal').classList.remove('active'); apri(); } else $('pinMsg').textContent = 'PIN errato'; };
  $('pinInput').onkeydown = e => { if (e.key === 'Enter') $('pinOk').onclick(); };
  $('closeTher').onclick = () => { $('therapist').classList.remove('active'); $('gear').style.display = ''; onClose && onClose(); };
  $('saveCfg').onclick = () => {
    document.querySelectorAll('#form [data-k]').forEach(el => { const k = el.dataset.k; let v = el.value; if (typeof DEFAULT_CFG[k] === 'boolean') v = v === 'true'; else if (typeof DEFAULT_CFG[k] === 'number') v = Number(v); db.cfg[k] = v; });
    save(); renderData(); $('savedNote').textContent = 'Salvato.'; setTimeout(() => $('savedNote').textContent = '', 2000);
  };
  $('exportCsv').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv()], { type: 'text/csv' })); a.download = 'parco-dati.csv'; a.click(); };
  $('copyCsv').onclick = async () => { try { await navigator.clipboard.writeText(csv()); $('copyNote').textContent = 'Dati copiati: incollali in un foglio di calcolo.'; } catch (e) { $('copyNote').textContent = 'Copia non consentita qui.'; } };
  $('clearData').onclick = () => $('confirmModal').classList.add('active');
  $('confirmNo').onclick = () => $('confirmModal').classList.remove('active');
  $('confirmYes').onclick = () => { db.sessions = []; save(); $('confirmModal').classList.remove('active'); renderData(); };
}

function apri() {
  $('therapist').classList.add('active'); $('gear').style.display = 'none';
  $('form').innerHTML = FIELDS.map(([k, label, type, opts]) => {
    const v = cfg()[k];
    const input = type === 'select' ? '<select data-k="' + k + '">' + opts.map(([ov, ol]) => '<option value="' + ov + '"' + (String(ov) === String(v) ? ' selected' : '') + '>' + ol + '</option>').join('') + '</select>'
      : '<input data-k="' + k + '" type="' + type + '" value="' + v + '"' + (type === 'number' ? ' step="any"' : '') + '>';
    return '<label>' + label + input + '</label>';
  }).join('');
  renderData();
}

const OCC = ['indipendente', 'anticipata', 'con_aiuto', 'problema'];
export function summary(s) {
  const occ = s.prove.filter(t => t.difficile && OCC.includes(t.tipo));
  const ind = occ.filter(t => t.tipo === 'indipendente' || t.tipo === 'anticipata').length, aid = occ.filter(t => t.tipo === 'con_aiuto').length;
  const ant = occ.filter(t => t.tipo === 'anticipata').length, molla = s.prove.filter(t => t.esito === 'molla').length;
  const rich = s.richieste || [], gentili = rich.filter(r => r.forma === 'gentile').length, brusche = rich.filter(r => r.forma === 'brusca').length, nonNec = rich.filter(r => !r.difficile).length;
  const lats = occ.filter(t => t.latenzaMs != null).map(t => t.latenzaMs);
  const facili = s.prove.filter(t => !t.difficile && t.tipo === 'da_solo').length;
  return { occ: occ.length, ind, aid, ant, molla, colpi: s.colpi || 0, gentili, brusche, scortesi: s.scortesi || 0, scuse: s.scuse || 0, grazie: s.grazie || 0, respiri: s.respiri || 0, amici: s.amici, facili, nonNec, richieste: rich.length,
    lat: lats.length ? (lats.reduce((a, b) => a + b, 0) / lats.length / 1000).toFixed(1) : '', pct: occ.length ? Math.round(ind / occ.length * 100) : null };
}

function renderData() {
  const ss = db.sessions;
  const rows = ss.slice().reverse().map(s => {
    const m = summary(s), d = new Date(s.inizio);
    return '<tr><td>' + d.toLocaleDateString('it-IT') + ' ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) + '</td><td>' + s.livello + (s.aiuto ? ' (' + s.aiuto + ')' : '') + '</td><td>' + m.occ + '</td><td>' + m.ind + (m.ant ? ' (' + m.ant + ' in anticipo)' : '') + '</td><td>' + m.aid + '</td><td>' + m.gentili + ' / ' + m.brusche + ' / ' + m.scortesi + '</td><td>' + m.grazie + ' / ' + m.scuse + '</td><td>' + (m.amici == null ? '–' : m.amici + ' su 4') + '</td><td>' + m.respiri + '</td><td>' + m.molla + ' / ' + m.colpi + '</td><td>' + m.facili + (m.nonNec ? ' (' + m.nonNec + ' aiuti non necessari)' : '') + '</td><td>' + (m.pct == null ? '–' : m.pct + '%') + '</td><td>' + (m.lat ? m.lat + ' s' : '–') + '</td></tr>';
  }).join('');
  $('sessTable').innerHTML = ss.length ? '<table><tr><th>Data</th><th>Livello</th><th>Occasioni</th><th>Aiuto chiesto da solo</th><th>Con aiuto</th><th>Richieste gentili / brusche / scortesi</th><th>Grazie / scuse</th><th>Amici a fine partita</th><th>Respiri</th><th>Lascia perdere / pannello colpito</th><th>Enigmi facili risolti da solo</th><th>% da solo</th><th>Latenza media</th></tr>' + rows + '</table>' : '<p class="note">Nessuna sessione registrata.</p>';
  const c = cfg(), lv = Number(c.livello), lastS = ss.filter(s => s.livello === lv && lv > 1).slice(-c.sessioniCriterio);
  let adv;
  if (lv === 1) adv = 'Livello 1: dopo 1–2 visioni del modello, passa al livello 2 con aiuto completo.';
  else if (lastS.length >= c.sessioniCriterio && lastS.every(s => (summary(s).pct || 0) >= c.criterio)) adv = 'Criterio raggiunto al livello ' + lv + (lv === 2 && c.aiuto === 'completo' ? ': passa all\'aiuto parziale.' : (lv < 4 ? ': puoi passare al livello ' + (lv + 1) + '.' : ': programma la generalizzazione con compiti veri a scuola e a casa (aiutanti diversi, stessa forma di richiesta).'));
  else adv = 'Criterio non ancora raggiunto al livello attuale (' + c.criterio + '% per ' + c.sessioniCriterio + ' sessioni consecutive).';
  $('advice').innerHTML = '<div class="advice">' + adv + '</div>';
  drawChart(ss.filter(s => s.livello > 1));
}

function drawChart(ss) {
  const W = 760, H = 220, L = 44, R = 16, T = 14, B = 30, x = i => L + (ss.length <= 1 ? (W - L - R) / 2 : i * (W - L - R) / (ss.length - 1)), y = v => T + (1 - v / 100) * (H - T - B);
  let g = '';
  [0, 50, 100].forEach(v => g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="#e3e9f0"/><text x="' + (L - 6) + '" y="' + (y(v) + 4) + '" font-size="12" text-anchor="end" fill="#5b6b82">' + v + '%</text>');
  g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(cfg().criterio) + '" y2="' + y(cfg().criterio) + '" stroke="#4caf6e" stroke-dasharray="6 5"/>';
  const pts = ss.map((s, i) => ({ i, v: summary(s).pct, lv: s.livello })).filter(p => p.v != null);
  for (let k = 1; k < pts.length; k++) if (pts[k].lv === pts[k - 1].lv) g += '<line x1="' + x(pts[k - 1].i) + '" y1="' + y(pts[k - 1].v) + '" x2="' + x(pts[k].i) + '" y2="' + y(pts[k].v) + '" stroke="#3b82c4" stroke-width="2"/>';
  for (let k = 1; k < ss.length; k++) if (ss[k].livello !== ss[k - 1].livello) { const xm = (x(k) + x(k - 1)) / 2; g += '<line x1="' + xm + '" x2="' + xm + '" y1="' + T + '" y2="' + (H - B) + '" stroke="#8a97a8"/><text x="' + (xm + 4) + '" y="' + (T + 10) + '" font-size="12" fill="#5b6b82">liv. ' + ss[k].livello + '</text>'; }
  pts.forEach(p => g += '<circle cx="' + x(p.i) + '" cy="' + y(p.v) + '" r="5" fill="#3b82c4"/>');
  ss.forEach((s, i) => g += '<text x="' + x(i) + '" y="' + (H - 10) + '" font-size="12" text-anchor="middle" fill="#5b6b82">' + (i + 1) + '</text>');
  if (!ss.length) g += '<text x="380" y="110" text-anchor="middle" fill="#5b6b82" font-size="14">Ancora nessun dato dei livelli 2–4</text>';
  $('chart').innerHTML = g;
}

function csv() {
  const k = ['zona', 'difficile', 'tipo', 'forma', 'grado', 'grazie', 'scelta', 'aiuto', 'chiamata', 'latenzaMs', 'frustrazione', 'errori', 'colpi', 'respiri', 'scortesi', 'scuse', 'primaDiProvare', 'attesaS', 'nonNecessario', 'fiducia', 'amico', 'esito', 'tempoS'];
  const lines = [['sessione', 'inizio', 'livello', 'aiuto_livello2', 'enigmi_difficili', 'ora', ...k].join(';')];
  db.sessions.forEach(s => s.prove.forEach(t => lines.push([s.id, s.inizio, s.livello, s.aiuto, s.difficili, t.ora, ...k.map(x => t[x] == null ? '' : x === 'latenzaMs' ? (t[x] / 1000).toFixed(1) : t[x])].join(';'))));
  lines.push(''); lines.push(['sessione', 'zona', 'enigma_difficile', 'forma_richiesta', 'errori_prima', 'da_dove'].join(';'));
  db.sessions.forEach(s => (s.richieste || []).forEach(r => lines.push([s.id, r.zona, r.difficile, r.forma, r.errori, r.origine].join(';'))));
  return lines.join('\n');
}

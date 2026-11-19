// Area terapista: impostazioni, grafico dell'andamento, tabella delle sessioni, esportazione dati.
// Modulo riutilizzabile: cambia solo FIELDS e le colonne di summary/csv per un altro gioco.
import { db, save, cfg, DEFAULT_CFG, $ } from './core.js';

const FIELDS = [
  ['nome', 'Nome del personaggio', 'text'],
  ['livello', 'Livello', 'select', [[1, '1 · Guardo (modeling)'], [2, '2 · Aiuto (con aiuto)'], [3, '3 · Decido io (senza aiuto)'], [4, '4 · Sono forte (tolleranza)']]],
  ['aiuto', 'Tipo di aiuto al livello 2', 'select', [['completo', 'Completo: etichetta lampeggiante, freccia e voce'], ['parziale', 'Parziale: solo etichetta lampeggiante']]],
  ['prove', 'Occasioni di scelta per sessione', 'number'],
  ['vittorie', 'Partite vinte al tablet prima delle sconfitte (1° giro)', 'number'],
  ['sconfitte', 'Sconfitte che portano la rabbia in arancione (sale durante le partite)', 'number'],
  ['respiri', 'Respiri a tempo di musica (attività "ascolta la musica")', 'number'],
  ['secondiAttivita', 'Secondi dell\'attività "disegna"', 'number'],
  ['saccoCalma', 'Sacco da boxe anche come scelta per calmarsi', 'select', [['false', 'No: solo gioco premio (consigliato)'], ['true', 'Sì']]],
  ['secondiPremio', 'Secondi del gioco premio (sacco)', 'number'],
  ['secondiBlaster', 'Secondi di una partita a Blaster Arena', 'number'],
  ['secondiAiutoRitardato', 'Secondi prima dell\'aiuto ritardato (liv. 3–4)', 'number'],
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
  $('exportCsv').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv()], { type: 'text/csv' })); a.download = 'cameretta-dati.csv'; a.click(); };
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

// nomi leggibili delle scelte registrate (attività che calmano e comportamenti problema)
export const NOMI = { musica: 'musica', disegno: 'disegno', mamma: 'parla con la mamma', costruzioni: 'costruzioni con i bambini', sacco: 'sacco da boxe', pausa: 'pausa',
  porta: 'porta sbattuta', tablet: 'tablet lanciato', urla: 'urla', esplosione: 'continua fino a esplodere' };
const conta = lista => { const m = {}; lista.forEach(t => { const k = NOMI[t.scelta] || t.scelta || '?'; m[k] = (m[k] || 0) + 1; }); return Object.entries(m).map(([k, n]) => k + (n > 1 ? ' ×' + n : '')).join(', '); };

export function summary(s) {
  const occ = s.prove.filter(t => ['indipendente', 'con_aiuto', 'problema', 'anticipata'].includes(t.tipo));
  const ind = s.prove.filter(t => t.tipo === 'indipendente' || t.tipo === 'anticipata').length, aid = s.prove.filter(t => t.tipo === 'con_aiuto').length;
  const ant = s.prove.filter(t => t.tipo === 'anticipata').length, durante = s.prove.filter(t => t.posato === 'durante' && t.tipo !== 'problema').length;
  const lats = s.prove.filter(t => t.latenzaMs != null && t.tipo !== 'problema').map(t => t.latenzaMs);
  const partite = s.partite || [];
  return { occ: occ.length, ind, aid, ant, durante, attivita: conta(occ.filter(t => t.tipo !== 'problema')), problemi: conta(occ.filter(t => t.tipo === 'problema')),
    lat: lats.length ? (lats.reduce((a, b) => a + b, 0) / lats.length / 1000).toFixed(1) : '', pct: occ.length ? Math.round(ind / occ.length * 100) : null,
    partite: partite.length, perse: partite.filter(p => p.esito === 'perdi').length };
}

function renderData() {
  const ss = db.sessions;
  const rows = ss.slice().reverse().map(s => {
    const m = summary(s), d = new Date(s.inizio);
    return '<tr><td>' + d.toLocaleDateString('it-IT') + ' ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) + '</td><td>' + s.livello + (s.aiuto ? ' (' + s.aiuto + ')' : '') + '</td><td>' + (s.gioco || '–') + '</td><td>' + m.partite + ' (' + m.perse + ' perse)</td><td>' + m.occ + '</td><td>' + m.ind + (m.ant ? ' (' + m.ant + ' in anticipo)' : '') + '</td><td>' + m.aid + '</td><td>' + m.durante + '</td><td>' + (m.attivita || '–') + '</td><td>' + (m.problemi || '–') + '</td><td>' + (m.pct == null ? '–' : m.pct + '%') + '</td><td>' + (m.lat ? m.lat + ' s' : '–') + '</td></tr>';
  }).join('');
  $('sessTable').innerHTML = ss.length ? '<table><tr><th>Data</th><th>Livello</th><th>Gioco al tablet</th><th>Partite</th><th>Occasioni</th><th>Tablet posato da solo</th><th>Con aiuto</th><th>Posato a metà partita</th><th>Attività scelte</th><th>Comportamenti problema</th><th>% da solo</th><th>Latenza media</th></tr>' + rows + '</table>' : '<p class="note">Nessuna sessione registrata.</p>';
  const c = cfg(), lv = Number(c.livello), lastS = ss.filter(s => s.livello === lv && lv > 1).slice(-c.sessioniCriterio);
  let adv;
  if (lv === 1) adv = 'Livello 1: dopo 1–2 visioni del modello, passa al livello 2 con aiuto completo.';
  else if (lastS.length >= c.sessioniCriterio && lastS.every(s => (summary(s).pct || 0) >= c.criterio)) adv = 'Criterio raggiunto al livello ' + lv + (lv === 2 && c.aiuto === 'completo' ? ': passa all\'aiuto parziale.' : (lv < 4 ? ': puoi passare al livello ' + (lv + 1) + '.' : ': programma la generalizzazione nel gioco reale.'));
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
  const lines = [['sessione', 'inizio', 'livello', 'aiuto_livello2', 'gioco_tablet', 'ora', 'tipo', 'scelta', 'aiuto_dato', 'latenza_s', 'rabbia_0_100', 'tablet_posato', 'rivincite_dopo_arancione', 'partite_prima', 'premio'].join(';')];
  db.sessions.forEach(s => s.prove.forEach(t => lines.push([s.id, s.inizio, s.livello, s.aiuto, s.gioco || '', t.ora, t.tipo, t.scelta || '', t.aiuto || '', t.latenzaMs != null ? (t.latenzaMs / 1000).toFixed(1) : '', t.rabbia ?? '', t.posato || '', t.rivincite ?? '', t.partite ?? '', t.premio || ''].join(';'))));
  lines.push('');
  lines.push(['sessione', 'ora', 'gioco', 'esito_programmato', 'risultato'].join(';'));
  db.sessions.forEach(s => (s.partite || []).forEach(p => lines.push([s.id, p.ora, p.gioco, p.esito, p.risultato].join(';'))));
  return lines.join('\n');
}

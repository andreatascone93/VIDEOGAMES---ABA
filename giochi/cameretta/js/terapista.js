// Area terapista: impostazioni, grafico dell'andamento, tabella delle sessioni, esportazione dati.
// Modulo riutilizzabile: cambia solo FIELDS e le colonne di summary/csv per un altro gioco.
import { db, save, cfg, DEFAULT_CFG, $ } from './core.js';

const FIELDS = [
  ['nome', 'Nome del personaggio (la voce registrata dice «Francesco»: con un altro nome, le frasi che lo contengono le legge la voce del dispositivo)', 'text'],
  ['percorso', 'Che cosa c\'è nell\'episodio', 'select', [['tutto', 'Tablet e scatola degli enigmi'], ['tablet', 'Solo il tablet (fare una pausa quando arriva la rabbia)'], ['enigmi', 'Solo la scatola degli enigmi (chiedere aiuto)']]],
  ['livello', 'Livello', 'select', [[1, '1 · Guardo (modeling)'], [2, '2 · Aiuto (con aiuto)'], [3, '3 · Decido io (senza aiuto)'], [4, '4 · Sono forte (tolleranza)']]],
  ['aiuto', 'Tipo di aiuto al livello 2', 'select', [['completo', 'Completo: etichetta lampeggiante, freccia e voce'], ['parziale', 'Parziale: solo etichetta lampeggiante']]],
  ['prove', 'Tablet: occasioni di scelta per sessione', 'number'],
  ['vittorie', 'Partite vinte al tablet prima delle sconfitte (1° giro)', 'number'],
  ['sconfitte', 'Sconfitte che portano la rabbia in arancione (sale durante le partite)', 'number'],
  ['respiri', 'Respiri a tempo di musica (attività "ascolta la musica")', 'number'],
  ['secondiAttivita', 'Secondi dell\'attività "disegna"', 'number'],
  ['saccoCalma', 'Sacco da boxe anche come scelta per calmarsi', 'select', [['true', 'Sì'], ['false', 'No: solo gioco premio']]],
  ['secondiPremio', 'Secondi del gioco premio (sacco)', 'number'],
  ['secondiBlaster', 'Secondi di una partita a Blaster Arena', 'number'],
  ['secondiAiutoRitardato', 'Secondi prima dell\'aiuto ritardato (liv. 3–4)', 'number'],
  ['difficili', 'Scatola: serrature che non si aprono da soli (le ultime; 0–4)', 'number'],
  ['provaPrima', 'Scatola: chi chiede aiuto senza aver provato viene invitato a provare', 'select', [['true', 'Sì'], ['false', 'No']]],
  ['attesaAiuto', 'Scatola, livello 4: secondi di attesa dopo aver chiesto aiuto', 'number'],
  ['criterio', 'Criterio di padronanza (%)', 'number'],
  ['sessioniCriterio', 'Sessioni consecutive per il criterio', 'number'],
  ['voce', 'Voci', 'select', [['tutte', 'Narratrice e personaggi'], ['narratrice', 'Solo la narratrice'], ['no', 'Nessuna voce']]],
  ['musica', 'Musica di sottofondo', 'select', [['true', 'Sì'], ['false', 'No']]],
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

// il riepilogo del tablet (fare una pausa): le prove senza `ambito`
export function summary(s) {
  const prove = s.prove.filter(t => !t.ambito);
  const occ = prove.filter(t => ['indipendente', 'con_aiuto', 'problema', 'anticipata'].includes(t.tipo));
  const ind = prove.filter(t => t.tipo === 'indipendente' || t.tipo === 'anticipata').length, aid = prove.filter(t => t.tipo === 'con_aiuto').length;
  const ant = prove.filter(t => t.tipo === 'anticipata').length, durante = prove.filter(t => t.posato === 'durante' && t.tipo !== 'problema').length;
  const lats = prove.filter(t => t.latenzaMs != null && t.tipo !== 'problema').map(t => t.latenzaMs);
  const partite = s.partite || [];
  return { occ: occ.length, ind, aid, ant, durante, attivita: conta(occ.filter(t => t.tipo !== 'problema')), problemi: conta(occ.filter(t => t.tipo === 'problema')),
    lat: lats.length ? (lats.reduce((a, b) => a + b, 0) / lats.length / 1000).toFixed(1) : '', pct: occ.length ? Math.round(ind / occ.length * 100) : null,
    partite: partite.length, perse: partite.filter(p => p.esito === 'perdi').length };
}

// il riepilogo della scatola (chiedere aiuto): le occasioni sono le serrature difficili, cioè quelle che da soli non si aprono
export function summaryAiuto(s) {
  const prove = s.prove.filter(t => t.ambito === 'aiuto'), dif = prove.filter(t => t.difficile);
  const occ = dif.filter(t => ['indipendente', 'con_aiuto', 'anticipata', 'rinuncia', 'problema'].includes(t.tipo));
  const ind = occ.filter(t => t.tipo === 'indipendente' || t.tipo === 'anticipata').length, aid = occ.filter(t => t.tipo === 'con_aiuto').length;
  const chieste = occ.filter(t => ['indipendente', 'con_aiuto', 'anticipata'].includes(t.tipo));
  const lats = chieste.filter(t => t.latenzaMs != null).map(t => t.latenzaMs);
  return { serrature: prove.filter(t => t.esito === 'aperta').length, occ: occ.length, ind, aid, modello: dif.filter(t => t.tipo === 'modello_osservato').length,
    gentili: chieste.filter(t => t.forma === 'gentile').length, brusche: chieste.filter(t => t.forma === 'brusca').length, scortesi: prove.reduce((n, t) => n + (t.scortesi || 0), 0),
    grazie: prove.filter(t => t.grazie === 'si').length, rinunce: prove.filter(t => t.tipo === 'rinuncia' || t.tipo === 'lasciato').length, problemi: prove.filter(t => t.tipo === 'problema').length,
    lat: lats.length ? (lats.reduce((a, b) => a + b, 0) / lats.length / 1000).toFixed(1) : '', pct: occ.length ? Math.round(ind / occ.length * 100) : null };
}
// la percentuale che conta per il criterio: quella del comportamento su cui si sta lavorando
const pctCriterio = s => cfg().percorso === 'enigmi' ? summaryAiuto(s).pct : summary(s).pct;

function renderData() {
  const ss = db.sessions;
  const rows = ss.slice().reverse().map(s => {
    const m = summary(s), d = new Date(s.inizio);
    return '<tr><td>' + d.toLocaleDateString('it-IT') + ' ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) + '</td><td>' + s.livello + (s.aiuto ? ' (' + s.aiuto + ')' : '') + '</td><td>' + (s.gioco || '–') + '</td><td>' + m.partite + ' (' + m.perse + ' perse)</td><td>' + m.occ + '</td><td>' + m.ind + (m.ant ? ' (' + m.ant + ' in anticipo)' : '') + '</td><td>' + m.aid + '</td><td>' + m.durante + '</td><td>' + (m.attivita || '–') + '</td><td>' + (m.problemi || '–') + '</td><td>' + (m.pct == null ? '–' : m.pct + '%') + '</td><td>' + (m.lat ? m.lat + ' s' : '–') + '</td></tr>';
  }).join('');
  $('sessTable').innerHTML = ss.length ? '<h3>Tablet: fare una pausa quando arriva la rabbia</h3><table><tr><th>Data</th><th>Livello</th><th>Gioco al tablet</th><th>Partite</th><th>Occasioni</th><th>Tablet posato da solo</th><th>Con aiuto</th><th>Posato a metà partita</th><th>Attività scelte</th><th>Comportamenti problema</th><th>% da solo</th><th>Latenza media</th></tr>' + rows + '</table>' + tabellaAiuto(ss) : '<p class="note">Nessuna sessione registrata.</p>';
  const c = cfg(), lv = Number(c.livello), lastS = ss.filter(s => s.livello === lv && lv > 1).slice(-c.sessioniCriterio);
  let adv;
  if (lv === 1) adv = 'Livello 1: dopo 1–2 visioni del modello, passa al livello 2 con aiuto completo.';
  else if (lastS.length >= c.sessioniCriterio && lastS.every(s => (pctCriterio(s) || 0) >= c.criterio)) adv = 'Criterio raggiunto al livello ' + lv + (lv === 2 && c.aiuto === 'completo' ? ': passa all\'aiuto parziale.' : (lv < 4 ? ': puoi passare al livello ' + (lv + 1) + '.' : ': programma la generalizzazione nel gioco reale.'));
  else adv = 'Criterio non ancora raggiunto al livello attuale (' + c.criterio + '% per ' + c.sessioniCriterio + ' sessioni consecutive).';
  $('advice').innerHTML = '<div class="advice">' + adv + '</div>';
  drawChart(ss.filter(s => s.livello > 1));
}

function tabellaAiuto(ss) {
  const rows = ss.slice().reverse().filter(s => s.prove.some(t => t.ambito === 'aiuto')).map(s => {
    const m = summaryAiuto(s), d = new Date(s.inizio);
    return '<tr><td>' + d.toLocaleDateString('it-IT') + ' ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) + '</td><td>' + s.livello + (s.aiuto ? ' (' + s.aiuto + ')' : '') + '</td><td>' + m.serrature + ' su 4</td><td>' + m.occ + (m.modello ? ' (+' + m.modello + ' viste)' : '') + '</td><td>' + m.ind + '</td><td>' + m.aid + '</td><td>' + m.gentili + ' / ' + m.brusche + ' / ' + m.scortesi + '</td><td>' + m.grazie + '</td><td>' + m.rinunce + '</td><td>' + m.problemi + '</td><td>' + (m.pct == null ? '–' : m.pct + '%') + '</td><td>' + (m.lat ? m.lat + ' s' : '–') + '</td></tr>';
  }).join('');
  return rows ? '<h3>Scatola degli enigmi: chiedere aiuto</h3><table><tr><th>Data</th><th>Livello</th><th>Serrature aperte</th><th>Occasioni (serrature difficili)</th><th>Aiuto chiesto da solo</th><th>Con aiuto</th><th>Richieste gentili / brusche / sgarbate</th><th>Grazie</th><th>Rinunce</th><th>Scatola rovesciata</th><th>% da solo</th><th>Latenza media</th></tr>' + rows + '</table>' : '';
}

function drawChart(ss) {
  const W = 760, H = 220, L = 44, R = 16, T = 14, B = 30, x = i => L + (ss.length <= 1 ? (W - L - R) / 2 : i * (W - L - R) / (ss.length - 1)), y = v => T + (1 - v / 100) * (H - T - B);
  let g = '';
  [0, 50, 100].forEach(v => g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="#e3e9f0"/><text x="' + (L - 6) + '" y="' + (y(v) + 4) + '" font-size="12" text-anchor="end" fill="#5b6b82">' + v + '%</text>');
  g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(cfg().criterio) + '" y2="' + y(cfg().criterio) + '" stroke="#4caf6e" stroke-dasharray="6 5"/>';
  // due linee: la pausa al tablet (blu) e la richiesta di aiuto alla scatola (arancione)
  for (const [f, col] of [[s => summary(s).pct, '#3b82c4'], [s => summaryAiuto(s).pct, '#e8863a']]) {
    const pts = ss.map((s, i) => ({ i, v: f(s), lv: s.livello })).filter(p => p.v != null);
    for (let k = 1; k < pts.length; k++) if (pts[k].lv === pts[k - 1].lv) g += '<line x1="' + x(pts[k - 1].i) + '" y1="' + y(pts[k - 1].v) + '" x2="' + x(pts[k].i) + '" y2="' + y(pts[k].v) + '" stroke="' + col + '" stroke-width="2"/>';
    pts.forEach(p => g += '<circle cx="' + x(p.i) + '" cy="' + y(p.v) + '" r="5" fill="' + col + '"/>');
  }
  for (let k = 1; k < ss.length; k++) if (ss[k].livello !== ss[k - 1].livello) { const xm = (x(k) + x(k - 1)) / 2; g += '<line x1="' + xm + '" x2="' + xm + '" y1="' + T + '" y2="' + (H - B) + '" stroke="#8a97a8"/><text x="' + (xm + 4) + '" y="' + (T + 10) + '" font-size="12" fill="#5b6b82">liv. ' + ss[k].livello + '</text>'; }
  ss.forEach((s, i) => g += '<text x="' + x(i) + '" y="' + (H - 10) + '" font-size="12" text-anchor="middle" fill="#5b6b82">' + (i + 1) + '</text>');
  if (!ss.length) g += '<text x="380" y="110" text-anchor="middle" fill="#5b6b82" font-size="14">Ancora nessun dato dei livelli 2–4</text>';
  $('chart').innerHTML = g;
}

function csv() {
  const lines = [['sessione', 'inizio', 'livello', 'aiuto_livello2', 'gioco_tablet', 'ora', 'ambito', 'tipo', 'scelta', 'aiuto_dato', 'latenza_s', 'rabbia_0_100', 'tablet_posato', 'rivincite_dopo_arancione', 'partite_prima', 'premio',
    'serratura', 'difficile', 'forma_richiesta', 'grado_aiuto', 'grazie', 'errori', 'respiri', 'colpi_scatola', 'risposte_sgarbate', 'chiesto_prima_di_provare', 'attesa_s', 'esito', 'tempo_s'].join(';')];
  const v = x => x ?? '';
  db.sessions.forEach(s => s.prove.forEach(t => lines.push([s.id, s.inizio, s.livello, s.aiuto, s.gioco || '', t.ora, t.ambito || 'pausa', t.tipo, t.scelta || '', t.aiuto || '', t.latenzaMs != null ? (t.latenzaMs / 1000).toFixed(1) : '', v(t.rabbia), t.posato || '', v(t.rivincite), v(t.partite), t.premio || '',
    v(t.enigma), t.ambito ? (t.difficile ? 'si' : 'no') : '', t.forma || '', t.grado || '', t.grazie || '', v(t.errori), v(t.respiri), v(t.colpi), v(t.scortesi), v(t.primaDiProvare), v(t.attesaS), t.esito || '', v(t.tempoS)].join(';'))));
  lines.push('');
  lines.push(['sessione', 'ora', 'gioco', 'esito_programmato', 'risultato'].join(';'));
  db.sessions.forEach(s => (s.partite || []).forEach(p => lines.push([s.id, p.ora, p.gioco, p.esito, p.risultato].join(';'))));
  return lines.join('\n');
}

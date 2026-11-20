// Elenca tutte le frasi da registrare (narratrice e personaggi) leggendo js/testi.js.
// Uso: node strumenti/frasi.mjs [nome del protagonista] > frasi.json
import { db } from '../js/core.js';
if (process.argv[2]) db.cfg.nome = process.argv[2];
const { tutteLeFrasi } = await import('../js/testi.js');
process.stdout.write(JSON.stringify({ nome: db.cfg.nome, frasi: tutteLeFrasi() }, null, 1));

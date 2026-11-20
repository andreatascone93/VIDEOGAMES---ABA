// Tutti i testi dell'episodio in un posto solo: la voce narrante, le scritte a schermo e le battute dei personaggi.
// Il file non tocca la pagina: si può leggere anche fuori dal browser (strumenti/frasi.mjs elenca le frasi da registrare).
//   NARRA    quello che dice la narratrice (ogni frase ha la sua registrazione in assets/voce)
//   SCRITTE  quello che si legge soltanto (istruzioni brevi, testi con numeri, titoli)
//   VOCI     le battute dei personaggi, ognuno con la sua voce
// Ogni voce di NARRA e VOCI è una funzione senza argomenti che restituisce una frase, un elenco o un insieme di varianti:
// così lo strumento di registrazione le trova tutte da solo.
import { N } from './core.js';

const n = () => N();

export const EPISODIO = { numero: 1, titolo: 'Un pomeriggio a casa' };
export const NONNO = 'Nonno Piero';

/* ------------------------------------------------------------------ la narratrice */
export const NARRA = {
  // presentazione: chi è Francesco, che cosa gli piace, che cosa gli pesa, che cosa vuole
  intro1: () => `Questo è ${n()}. Ha nove anni, e davanti a una sfida non si tira mai indietro.`,
  intro2: () => `Gli piacciono le gare sul tablet, i giochi difficili, le partite che si vincono all'ultimo secondo.`,
  intro3: () => `C'è una cosa, però, che gli pesa. Quando perde, la rabbia arriva in fretta. E qualche volta è più forte di lui.`,
  intro4: () => `Quest'anno ${n()} si è dato un obiettivo: giornate più serene, a casa e a scuola. Vuole imparare a riconoscere i suoi momenti difficili, e a decidere lui che cosa farne.`,
  intro5: () => ({
    tutto: `Oggi è appena tornato da scuola. In cameretta lo aspettano il tablet e una sorpresa.`,
    tablet: `Oggi è appena tornato da scuola, e ha una gran voglia di giocare.`,
    enigmi: `Oggi è appena tornato da scuola. In cameretta lo aspetta una sorpresa.`
  }),
  scatolaIntro: () => `Sul pavimento c'è una scatola di legno che ieri non c'era. Accanto, un biglietto: «Per ${n()}. Quattro serrature, quattro enigmi. Quello che c'è dentro è tuo. ${NONNO}.»`,
  libero: () => ({
    tutto: `Tocca il pavimento per far camminare ${n()}: la casa è tutta sua. Quando vuoi, tocca il tablet sulla scrivania, oppure la scatola del nonno.`,
    tablet: `Tocca il pavimento per far camminare ${n()}: la casa è tutta sua. Quando vuoi, tocca il tablet sulla scrivania.`,
    enigmi: `Tocca il pavimento per far camminare ${n()}: la casa è tutta sua. Quando vuoi, tocca la scatola del nonno.`
  }),

  // il tablet e la rabbia
  sd: () => `${n()} sente la rabbia nel corpo: i pugni si stringono, la faccia diventa rossa e calda, il cuore batte forte.`,
  promptPosa: () => `${n()} può posare il tablet e fare un'altra cosa.`,
  posatoArrabbiato: () => `${n()} ha posato il tablet. La rabbia c'è ancora: pugni stretti, faccia rossa, cuore che corre.`,
  posatoPrima: () => `${n()} ha posato il tablet prima che la rabbia diventasse forte.`,
  cosaFa: () => `E adesso? Decidi tu che cosa fa ${n()}: tocca una scelta.`,
  cosaFaSalone: () => `In salone ci sono la mamma, Leo e Giulia. Che cosa fa ${n()}?`,
  promptScelta: () => ({
    salone: `${n()} può parlare con la mamma, oppure giocare con Leo e Giulia.`,
    conSacco: `${n()} può fare un'altra cosa per calmarsi: ascoltare la musica, disegnare, sfogarsi al sacco o andare in salone.`,
    senzaSacco: `${n()} può fare un'altra cosa per calmarsi: ascoltare la musica, disegnare o andare in salone.`
  }),
  modello: () => `Guarda che cosa fa ${n()}. Sente la rabbia nel corpo e pensa: «Poso il tablet e faccio un'altra cosa».`,

  // le attività che calmano
  musica: () => `${n()} mette le cuffie e ascolta la sua musica preferita. Respira a tempo.`,
  disegno: () => `${n()} prende un foglio e le matite. Disegna quello che vuoi: mentre disegni, la rabbia scende.`,
  disegnoAppeso: () => `${n()} appende il disegno al muro.`,
  beve: () => `${n()} beve piano. Il cuore rallenta.`,
  racconta: () => `${n()} racconta la partita alla mamma. Parlarne lo fa sentire più leggero.`,
  meglioTorna: () => `${n()} si sente meglio. Torna in cameretta.`,
  calma: () => ({
    nuovi: `${n()} si sente meglio, ed è più forte di prima. In cameretta si sono sbloccati dei giochi: scegline uno!`,
    solito: `${n()} si sente meglio, ed è più forte di prima. Ora può scegliere un gioco.`
  }),

  // i comportamenti problema e le loro conseguenze
  bam: () => `Bam! ${n()} ha sbattuto la porta.`,
  urlato: () => `${n()} ha urlato fortissimo. In salone hanno sentito tutti.`,
  esplode: () => `${n()} ha continuato a giocare, e ha perso ancora. Non ce la fa più.`,
  crash: () => `Crash! ${n()} ha lanciato il tablet. Lo schermo si è rotto.`,
  dopoProblema: () => `${n()} è ancora arrabbiato, e non si sente meglio. Niente punti, niente giochi premio e, per oggi, niente tablet.`,
  riprova: () => ({
    riparato: `Il tablet è stato riparato. Si riprova: quando vuoi, prendilo dalla scrivania.`,
    oggi: `Oggi ${n()} può usare di nuovo il tablet. Si riprova: è sulla scrivania.`
  }),
  divertito: () => ({
    tablet: `${n()} si è divertito. Quando vuoi, torna a giocare al tablet: è sul letto.`,
    scatola: `${n()} si è divertito. Il tablet è sul letto, e la scatola del nonno è ancora lì.`
  }),
  bastaTablet: () => `Per oggi ${n()} ha giocato abbastanza al tablet. Resta la scatola del nonno.`,

  // la scatola degli enigmi e la richiesta di aiuto
  scatolaPrima: () => `La scatola ha quattro serrature, e ognuna si apre risolvendo un enigma. L'indizio è sul biglietto del nonno: guardalo bene.`,
  sdAiuto: () => `${n()} ha provato e riprovato. Qui manca qualcosa, e la rabbia comincia a salire.`,
  promptAiuto: () => ({
    mamma: `Quando ci si blocca, si può chiedere una mano. La mamma è in salone.`,
    papa: `Quando ci si blocca, si può chiedere una mano. Il papà è nel suo studio, in fondo al salone.`,
    giulia: `Quando ci si blocca, si può chiedere una mano. Giulia è in salone.`
  }),
  modelloAiuto: () => `Guarda che cosa fa ${n()} quando è bloccato.`,
  modelloAiutoDopo: () => `Ha chiesto con gentilezza, ha detto di preciso che cosa gli serviva, e ha ringraziato. Adesso finisci tu.`,
  serraturaAperta: () => [
    `Clac. La prima serratura è aperta. Ne restano tre.`,
    `Clac. Anche la seconda è aperta. Ne restano due.`,
    `Clac. La terza serratura è aperta. Ne manca una sola.`,
    `Clac. Anche l'ultima serratura si apre.`
  ],
  molla: () => `${n()} lascia perdere. La serratura resta chiusa, e il regalo del nonno resta dentro.`,
  sbatte: () => `${n()} sbatte la scatola. Dentro si è incastrato qualcosa: per qualche secondo le serrature non si muovono.`,
  rovescia: () => `${n()} non ce la fa più. Rovescia la scatola, e i pezzi rotolano sul pavimento.`,
  dopoRovescia: () => `${n()} è ancora arrabbiato, e la scatola non c'è più. Il regalo del nonno dovrà aspettare.`,
  scatolaTornata: () => `La scatola del nonno è di nuovo al suo posto. Si riprova, con calma.`,
  coperchio: () => `Il coperchio si alza. Dentro ci sono una lettera, e due biglietti colorati.`,
  lettera: () => `«Caro ${n()}, se stai leggendo sei arrivato in fondo. Scommetto che in qualche punto ti sei bloccato. Capita anche a me, sai? Io, quando mi blocco, chiedo. Non è arrendersi: è il modo più furbo di andare avanti. I biglietti sono per la pista dei kart: sabato ti ci porta papà. ${NONNO}.»`,
  dopoScatola: () => `${n()} ha aperto la scatola del nonno. Il tablet è sempre lì, se ha voglia di giocare.`,

  // il saluto di fine episodio: una frase per com'è andata con la rabbia, una per l'aiuto, e l'appuntamento a scuola
  fine: () => ({
    buona: `Oggi ${n()} ha scoperto una cosa: quando la rabbia arriva, può fermarsi e scegliere. E dopo si sta meglio davvero.`,
    difficile: `Oggi per ${n()} è stata una giornata difficile. Capita. Domani avrà un'altra occasione per fermarsi in tempo.`,
    modello: `Hai visto che cosa fa ${n()} quando sente arrivare la rabbia. La prossima volta decidi tu.`,
    aiuto: `E ha scoperto anche questo: chiedere una mano, con le parole giuste, non è arrendersi.`,
    aiutoSolo: `Oggi ${n()} ha scoperto una cosa: chiedere una mano, con le parole giuste, non è arrendersi.`,
    scatolaDaSolo: `E la scatola del nonno, ${n()} l'ha aperta tutta da solo.`,
    scatolaAspetta: `La scatola del nonno è ancora chiusa. Sarà lì anche domani, ad aspettarlo.`,
    scuola: `Per oggi la storia di ${n()} si ferma qui. La prossima sfida lo aspetta a scuola.`
  })
};

/* ------------------------------------------------------------------ le scritte (non vengono lette a voce) */
export const SCRITTE = {
  homeTitolo: () => `La cameretta di ${n()}`,
  homeEpisodio: () => `EPISODIO ${EPISODIO.numero} · ${EPISODIO.titolo.toUpperCase()}`,
  homeLead: () => `${n()} ama le sfide, ma la rabbia qualche volta arriva troppo in fretta. Accompagnalo nel suo pomeriggio: quando serve, decidi tu che cosa fa.`,
  cartello: () => `Episodio ${EPISODIO.numero} · ${EPISODIO.titolo}`,
  tabletAcceso: () => `Il tablet è acceso. Scegli a cosa gioca ${n()}.`,
  gioca: gioco => `${n()} gioca a ${gioco}. Si diverte un sacco.`,
  riprende: forte => forte ? `${n()} riprende a giocare, ma è troppo arrabbiato per giocare bene.` : `${n()} riprende a giocare.`,
  vittoria: i => [`Che partita! ${n()} è carichissimo.`, `Ancora una vittoria! ${n()} si diverte un sacco.`, `Vince di nuovo!`][Math.min(i, 2)],
  sconfitta: () => `${n()} ha perso. Stringe i denti e sbuffa.`,
  zona2: () => `${n()} stringe i denti e sbuffa. La rabbia sta salendo.`,
  zona4: () => `${n()} non ce la fa più!`,
  tranquillo: () => `${n()} è tranquillo e si sta divertendo: continua a giocare.`,
  salone: () => `In salone ci sono la mamma, Leo e Giulia.`,
  obScelta: () => `Che cosa fa ${n()}?`,
  disegnoPronto: () => `${n()} è più calmo. Può finire il disegno quando vuole.`,
  torre: () => `Tocca METTI IL PEZZO quando il cubo è sopra la torre. Si gioca a turno.`,
  saccoCalma: () => `${n()} si sfoga al sacco: tocca PUGNO o CALCIO. Colpo dopo colpo, la rabbia scende.`,
  saccoPremio: () => `Allenamento al sacco: tocca PUGNO o CALCIO. Più ${n()} è forte, più il sacco vola!`,
  colpi: (c, calma) => `${n()} ha messo a segno ${c} colpi.` + (calma ? '' : ' Che allenamento!'),
  cosaDice: () => `Che cosa dice ${n()}?`,
  fineXp: (xp, forza) => `${n()} ha guadagnato ${xp} XP e ora ha forza ${forza}.`,
  fineTitolo: completa => completa ? 'Missione completata' : 'Per oggi basta così',
  fineModello: () => `Hai visto come fa ${n()} a calmarsi. La prossima volta decidi tu.`,
  serratura: k => ['Prima serratura · Il codice', 'Seconda serratura · Il circuito', 'Terza serratura · Il carillon', 'Quarta serratura · Il mosaico'][k],
  restano: k => k >= 4 ? 'La scatola è aperta' : `Scatola del nonno: ${k === 1 ? '1 serratura aperta' : k + ' serrature aperte'} su 4`,
  arriva: (chi, s) => `${chi} arriva tra ${s}…`,
  basta: () => `Basta per oggi`,
  zitto: () => `(Torna alla scatola senza dire niente)`
};

/* ------------------------------------------------------------------ chi aiuta, e per quale serratura */
export const AIUTANTI = {
  mamma: { voce: 'mamma', nome: 'la mamma', a: 'alla mamma', Nome: 'Mamma', scusa: 'Scusa mamma', grazie: 'Grazie, mamma!', parla: 'Parla con la mamma' },
  papa: { voce: 'papa', nome: 'papà', a: 'a papà', Nome: 'Papà', scusa: 'Scusa papà', grazie: 'Grazie, papà!', parla: 'Bussa allo studio di papà' },
  giulia: { voce: 'giulia', nome: 'Giulia', a: 'a Giulia', Nome: 'Giulia', scusa: 'Scusa Giulia', grazie: 'Grazie, Giulia!', parla: 'Parla con Giulia' }
};
// per ogni serratura: chi ha quello che manca, che cosa serve di preciso (la richiesta completa), la versione brusca,
// e che cosa risponde chi aiuta: il minimo indispensabile, oppure un aiuto pieno (per chi chiede con gentilezza)
export const ENIGMI_TESTI = [
  { aiutante: 'mamma',
    bisogno: `Sul biglietto del nonno due simboli sono coperti da una macchia, e non li vedo.`, brusca: `dimmi i due simboli sotto la macchia.`,
    rivela: `Dopo la stella e il quadrato ci sono il cerchio blu e il rombo viola.`,
    rivelaPieno: `Quel biglietto l'ho visto ieri, prima che il nonno ci rovesciasse sopra il caffè. Dopo la stella e il quadrato ci sono il cerchio blu e il rombo viola. I primi due te li ho già messi io.` },
  { aiutante: 'papa',
    bisogno: `Un pezzo del circuito è fermato da una vite, e mi servirebbe un cacciavite piccolo.`, brusca: `mi serve un cacciavite.`,
    rivela: `Ecco, vite tolta. Il resto è tuo.`,
    rivelaPieno: `Un cacciavite piccolo? Hai bussato alla porta giusta. Ecco, vite tolta. E ti segno in giallo i pezzi dove deve passare la corrente: girarli tocca a te.` },
  { aiutante: 'mamma',
    bisogno: `Il carillon ha suonato la melodia una volta sola, troppo in fretta. Me la faresti risentire?`, brusca: `rifammi sentire la melodia.`,
    rivela: `La conosco. Te la suono piano, quante volte vuoi.`,
    rivelaPieno: `Certo che la conosco: il nonno la fischiettava sempre, quando ero piccola. Te la suono piano, quante volte vuoi, e ti scrivo anche i colori delle note sul biglietto.` },
  { aiutante: 'giulia',
    bisogno: `Al mosaico manca la tessera centrale. Per caso l'hai vista?`, brusca: `dammi la tessera che manca.`,
    rivela: `Ce l'ho io. Tieni.`,
    rivelaPieno: `Quella col numero sette? Era finita tra i nostri cubi! Te la metto già dritta. E il nonno ha lasciato a me il disegno intero: te lo attacco sul biglietto.` }
];
// le frasi tra cui sceglie il giocatore quando Francesco chiede (k = serratura)
export const RICHIESTA = {
  gentile: k => { const e = ENIGMI_TESTI[k]; return `${AIUTANTI[e.aiutante].scusa}, mi daresti una mano? ${e.bisogno}`; },
  brusca: k => { const e = ENIGMI_TESTI[k]; return `${AIUTANTI[e.aiutante].Nome}, ${e.brusca}`; },
  vaga: () => `Mi aiuti, per favore?`,
  scortese: () => `Muoviti, fallo tu! Io non ci riesco.`,
  niente: () => `Niente, lascia stare.`,
  grazie: a => AIUTANTI[a].grazie,
  eraOra: () => `Finalmente. Era ora.`,
  chiama: a => `${AIUTANTI[a].Nome}! Hai un momento?`,
  provo: a => `Da solo qui non ne esco. Provo a chiedere ${AIUTANTI[a].a}.`,
  basta: () => `Basta. Lascio perdere.`
};

/* ------------------------------------------------------------------ le battute dei personaggi */
// le risposte di chi aiuta: stesse situazioni, tre caratteri diversi
const RISPOSTE = {
  mamma: {
    eccomi: `Dimmi, tesoro.`, cheServe: `Volentieri! Dimmi: che cosa ti serve?`, certo: `Ma certo, volentieri!`, vaBene: `Va bene.`,
    scortese: () => `Così no, ${n()}. Quando me lo chiedi con calma, ti aiuto volentieri.`, niente: `Va bene. Io sono qui.`,
    provaPrima: `Prova prima una volta. Se non ci riesci, sono qui.`, daSolo: `Questa la apri da solo: guarda bene il biglietto del nonno. Io faccio il tifo da qui.`,
    attesa: `Arrivo! Un attimo, finisco qui.`, prego: `Figurati. Se serve, sono qui.`, pregoSgarbo: `Prego lo stesso.`, fatta: `Ecco fatto! L'hai aperta tu.`
  },
  papa: {
    eccomi: `Dimmi, campione.`, cheServe: `Volentieri. Che cosa ti serve, di preciso?`, certo: `Certo. Andiamo a vedere.`, vaBene: `Va bene.`,
    scortese: `Con questo tono, no. Riprova con calma, e ci sono.`, niente: `Come vuoi. Io sono qui.`,
    provaPrima: `Prima provaci tu. Se non va, torna da me.`, daSolo: `Questa la sai aprire: guarda bene il biglietto. Io faccio il tifo.`,
    attesa: `Arrivo. Dammi un momento, finisco una cosa.`, prego: `Di niente. Quando vuoi.`, pregoSgarbo: `Prego, comunque.`, fatta: `Visto? L'hai aperta tu.`
  },
  giulia: {
    eccomi: `Dimmi! Che cosa c'è?`, cheServe: `Sì! Che cosa ti serve?`, certo: `Sì, vengo subito!`, vaBene: `Va bene.`,
    scortese: `Ehi! Così non ti aiuto mica.`, niente: `Ok. Noi siamo qui.`,
    provaPrima: `Ma ci hai già provato? Prova, poi vengo.`, daSolo: `Ma quella è facile! Guarda bene il biglietto.`,
    attesa: `Arrivo! Metto solo questo cubo.`, prego: `Prego! È stato divertente.`, pregoSgarbo: `Prego lo stesso!`, fatta: `Sììì! Si è aperta!`
  }
};
export const risposta = (a, k) => { const r = RISPOSTE[a][k]; return typeof r === 'function' ? r() : r; };

export const VOCI = {
  // Francesco: quasi tutto quello che dice lo sceglie il giocatore
  f: {
    ciaoMamma: () => `Ciao mamma!`,
    mamma1: () => [`Ho perso tante volte e sono arrabbiato.`, `Ho bisogno di una pausa. Posso stare un po' qui con te?`],
    mamma2: () => [`Un po' d'acqua, grazie.`, `Ti racconto la partita.`],
    mamma3: () => [`Adesso va meglio.`, `Ancora un po' arrabbiato, ma sta passando.`],
    richieste: () => [0, 1, 2, 3].flatMap(k => [RICHIESTA.gentile(k), RICHIESTA.brusca(k)]),
    richiesteComuni: () => [RICHIESTA.vaga(), RICHIESTA.scortese(), RICHIESTA.niente(), RICHIESTA.eraOra(), RICHIESTA.basta()],
    perAiutante: () => Object.keys(AIUTANTI).flatMap(a => [RICHIESTA.grazie(a), RICHIESTA.chiama(a), RICHIESTA.provo(a)])
  },
  mamma: {
    ciao: () => `Ciao tesoro!`,
    capisco: () => [`Capisco. Perdere tante volte di fila fa arrabbiare. Vieni, siediti qui.`, `Certo. Vieni, siediti qui vicino a me.`],
    acquaO: () => `Vuoi un bicchiere d'acqua, o preferisci raccontarmi com'è andata?`,
    aUnPasso: () => `Eri a un passo dal vincere. Ci sta che ti sei arrabbiato.`,
    comeTiSenti: () => `Come ti senti adesso?`,
    dopo: () => [`Si vede. Quando vuoi, torna pure a giocare.`, `Va bene così. Resta qui finché ti va.`],
    urla: () => [`${n()}, se urli non riesco a capirti.`, `Per oggi basta tablet. Quando sei calmo, vieni a dirmelo.`],
    rotto: () => [`Il tablet è caduto, e lo schermo si è rotto.`, `Va fatto riparare. Per qualche giorno, niente tablet.`],
    scatola: () => [`${n()}, la scatola del nonno non si tratta così.`, `La metto via io. Ci riprovi domani, con calma.`],
    aiuto: () => Object.keys(RISPOSTE.mamma).map(k => risposta('mamma', k)),
    enigmi: () => ENIGMI_TESTI.filter(e => e.aiutante === 'mamma').flatMap(e => [e.rivela, e.rivelaPieno])
  },
  papa: {
    porta: () => [`${n()}, le porte non si sbattono.`, `Per oggi il tablet lo tengo io.`],
    aiuto: () => Object.keys(RISPOSTE.papa).map(k => risposta('papa', k)),
    enigmi: () => ENIGMI_TESTI.filter(e => e.aiutante === 'papa').flatMap(e => [e.rivela, e.rivelaPieno])
  },
  leo: {
    torre: () => `Ciao ${n()}! Ci aiuti a fare la torre?`,
    ancora: () => `Dopo ne facciamo una ancora più alta?`,
    tengo: () => `Vai, Giulia! La torre la tengo io.`
  },
  giulia: {
    finita: () => `Finita! È altissima.`,
    aiuto: () => Object.keys(RISPOSTE.giulia).map(k => risposta('giulia', k)),
    enigmi: () => ENIGMI_TESTI.filter(e => e.aiutante === 'giulia').flatMap(e => [e.rivela, e.rivelaPieno])
  }
};
// commenti brevi durante la torre: restano scritti nel fumetto, senza voce
export const COMMENTI_TORRE = ['Bel pezzo!', 'Sta venendo alta!', 'Piano… perfetto.', 'Ancora uno!'];

/* ------------------------------------------------------------------ dal testo alla registrazione */
// ogni registrazione ha per nome un'impronta di (voce + testo): se il testo cambia, la vecchia registrazione non viene più usata
export function chiaveVoce(chi, testo) {
  const s = chi + '|' + String(testo).replace(/\s+/g, ' ').trim();
  let a = 0xdeadbeef, b = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); a = Math.imul(a ^ c, 2654435761); b = Math.imul(b ^ c, 1597334677); }
  a = Math.imul(a ^ (a >>> 16), 2246822507) ^ Math.imul(b ^ (b >>> 13), 3266489909);
  b = Math.imul(b ^ (b >>> 16), 2246822507) ^ Math.imul(a ^ (a >>> 13), 3266489909);
  return (b >>> 0).toString(16).padStart(8, '0') + (a >>> 0).toString(16).padStart(8, '0');
}
const piatte = v => typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(piatte) : Object.values(v).flatMap(piatte);
// l'elenco completo delle frasi da registrare: [{ id, chi, testo }]
export function tutteLeFrasi() {
  const out = [], visti = new Set();
  const metti = (chi, testo) => { const id = chiaveVoce(chi, testo); if (!visti.has(id)) { visti.add(id); out.push({ id, chi, testo }); } };
  for (const f of Object.values(NARRA)) piatte(f()).forEach(t => metti('n', t));
  for (const [chi, frasi] of Object.entries(VOCI)) for (const f of Object.values(frasi)) piatte(f()).forEach(t => metti(chi, t));
  return out;
}

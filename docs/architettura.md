# Architettura dei giochi

Il documento completo, con fondamenti in letteratura e diagramma, è qui: [Architettura dei giochi ABA](https://claude.ai/artifact/DFyQXm5hZ9JznUXASCKgqc). Questa è la sintesi tecnica.

## Moduli

- **Configurazione**: l'oggetto `GAME.contingenze` e i livelli in cima a ogni gioco, più le impostazioni modificabili dall'area terapista.
- **Motore di gioco**: applica le regole a ogni tentativo (stato interno, segnale, risposta, conseguenza).
- **Stati interni**: il termometro della rabbia (0–4); la zona arancione (3) è lo stimolo discriminativo.
- **Aiuti e fading**: completo (lampeggio, mano, voce), parziale (lampeggio), aiuto ritardato dopo N secondi.
- **Rinforzo**: calma, energia del personaggio, stelle, accesso a un gioco bonus a scelta.
- **Registro dati**: `localStorage`, una voce per ogni occasione.
- **Area terapista**: impostazioni, grafico per sessione, consiglio sul criterio di padronanza, esportazione CSV.

## Il gioco della pausa

| Livello | Nome | Procedura |
| --- | --- | --- |
| 1 | Guardo Leo | Video modeling: Leo perde, si arrabbia, fa la pausa, si calma, diventa più forte, sblocca un gioco |
| 2 | Aiuto Leo | Quando il termometro diventa arancione arriva l'aiuto (completo o parziale) |
| 3 | Decido io | Nessun aiuto; aiuto parziale ritardato se non risponde entro N secondi |
| 4 | Sono forte | Più sconfitte, pause più brevi (tolleranza alla frustrazione) |

Tipi di occasione registrati: `indipendente`, `con_aiuto`, `anticipata` (pausa in zona gialla, contata come indipendente), `problema` (esplosione in zona rossa, estinzione), `fuori_contesto` (pausa con termometro verde, non rinforzata).

Personalizzazione per il primo caso: personaggio umano (Leo, nome modificabile), riquadro "Segnali della rabbia" scritto in zona gialla, arancione e rossa per rimarcare il riconoscimento, giochi bonus di corsa (raccogliere stelle cambiando corsia) e di karate (colpire bersagli), senza sconfitte né pressione di tempo.

## La cameretta di Francesco (3D)

**Episodio 1 · Un pomeriggio a casa.** Francesco ha nove anni, ama le sfide e i giochi al tablet, e si arrabbia un po' troppo spesso. Il suo obiettivo, che attraversa gli episodi, è passare giornate più serene a casa e a scuola imparando a gestire i suoi momenti. Una narratrice lo presenta all'inizio, accompagna i momenti importanti e chiude l'episodio. Nell'episodio ci sono due fili: la pausa quando arriva la rabbia (tablet) e la richiesta di aiuto (la scatola degli enigmi di nonno Piero). Il terapista può tenerne uno solo con l'impostazione `percorso`.

Gioco 3D in Three.js (moduli ES, nessuna compilazione). Francesco, personaggio animato Kenney, si muove liberamente nella sua casa: la cameretta e il salone sono affiancati e uniti da una porta vera, arredati con mobili KayKit e Kenney. Si tocca il pavimento per camminare (anche quello dell'altra stanza: Francesco ci va passando dalla porta), si tocca un oggetto o la sua etichetta per interagire. In casa ci sono anche la mamma, il papà e due bambini (Leo e Giulia).

### Contingenze

| Voce | Nel gioco |
| --- | --- |
| MO | sconfitte ripetute al tablet dopo alcune vittorie: partite vere, con esito programmato |
| SD | rabbia in zona arancione (60–80 su 100), raggiunta **durante** la partita: barra, segnali del corpo scritti, viso, battito |
| Risposta target | posare il tablet (anche a metà partita) e scegliere un'altra attività |
| Rinforzo | la calma torna poco a poco mentre fa l'attività; poi +100 XP, Forza +1, giochi premio; il tablet resta suo |
| Risposte problema | sbattere la porta, lanciare il tablet, urlare, continuare a giocare fino a esplodere |
| Conseguenze | arriva un genitore, due frasi calme, il tablet viene tolto; niente XP né premi; si riparte "il giorno dopo" |

### Contingenze della richiesta di aiuto (la scatola del nonno)

| Voce | Nel gioco |
| --- | --- |
| MO | una serratura a cui manca qualcosa che ha solo una persona di casa: due simboli coperti da una macchia (mamma), una vite da togliere (papà), una melodia suonata una volta sola e troppo in fretta (mamma), la tessera centrale del mosaico (Giulia) |
| SD | Francesco è bloccato (almeno un tentativo andato male) e la rabbia è in arancione |
| Risposta target | andare dalla persona giusta e chiedere, con gentilezza e dicendo di preciso che cosa serve; poi ringraziare |
| Rinforzo | l'aiuto arriva: pieno (quello che manca più un suggerimento) se la richiesta è gentile e precisa, il minimo se è brusca. La serratura la apre lui. XP: 60 da solo, 100 con aiuto chiesto, +20 se chiesto con gentilezza |
| Alternative | lasciar perdere; sbattere la scatola; rispondere male; chiedere senza aver provato; chiedere quando non serve |
| Conseguenze | il regalo resta chiuso; la scatola si blocca 8 secondi e la rabbia sale, e continuando Francesco la rovescia: la mamma la mette via fino al giorno dopo; niente aiuto finché non chiede con calma; "prova prima una volta"; "questa la apri da solo" |

Le serrature sono quattro, a difficoltà crescente: codice di simboli, circuito da ricollegare, carillon da ripetere, mosaico da ricomporre. Le ultime N (`difficili`, di base 2) non si aprono senza aiuto. Livelli: 1 modello (Francesco va a chiedere da solo, con le parole giuste, e il giocatore finisce l'enigma), 2 aiuto subito (il pulsante "Chiedi aiuto" pulsa; con l'aiuto completo anche freccia, voce e la frase gentile per prima), 3 aiuto in ritardo, 4 attesa dopo aver chiesto (`attesaAiuto` secondi). Aperta la quarta serratura il coperchio si alza: dentro c'è la lettera del nonno e due biglietti per la pista dei kart.

L'episodio finisce quando le occasioni al tablet sono esaurite e la scatola è aperta. Se la scatola resta chiusa, dopo averci provato almeno una volta compare sul letto la scelta "Basta per oggi": la narratrice chiude dicendo che la scatola aspetta domani. Con una serratura in corso Francesco può alzarsi e andare al tablet: la serratura si registra come lasciata.

Dati di ogni serratura: tipo (`indipendente`, `con_aiuto`, `anticipata`, `modello_osservato`, `da_solo`, `rinuncia`, `lasciato`, `problema`), forma della richiesta (gentile, brusca, scortese), grado dell'aiuto ricevuto, se ha ringraziato, latenza dall'SD alla richiesta, da dove ha chiesto (dalla scatola o andando dalla persona), errori, colpi alla scatola, respiri, risposte sgarbate, richieste prima di provare e non necessarie, secondi di attesa, tempo, esito.

### Storia

1. Francesco è appena tornato da scuola: attraversa il salone ed entra in cameretta dalla porta. Il giocatore lo porta al tablet sulla scrivania; Francesco lo prende e si siede sul letto. In ogni momento in cui cammina può andare in salone e tornare (porta, etichetta o tocco sul pavimento di là); in salone può salutare la mamma.
2. Sul tablet il giocatore sceglie un gioco vero: **Kart Royale** (corsa, un giro contro sette piloti) o **Blaster Arena** (sparatutto cartoon in prima persona, sfida a punti contro Max). La regia è nascosta: le prime partite si vincono (impostazione `vittorie`), poi l'avversario diventa più forte e si perde (`sconfitte`).
3. **La rabbia si muove in tempo reale.** È un valore continuo da 0 a 100 con cinque zone. Durante ogni partita persa sale di un tratto (l'ultima sconfitta programmata la porta in arancione a metà partita) e reagisce agli eventi del gioco: un punto del rivale o un sorpasso subìto la fanno salire di colpo, un punto proprio la fa scendere un po'.
4. Accanto al tablet c'è sempre il pulsante **Posa il tablet**: è un'azione di Francesco, fuori dallo schermo del gioco. In zona gialla vale come pausa `anticipata`; in arancione è la risposta target. Da tranquillo non fa nulla. La schermata del risultato offre solo "Rivincita": continuare oltre l'arancione porta la rabbia al rosso e Francesco esplode (lancia il tablet).
5. Posato il tablet, la rabbia resta dov'è e il giocatore sceglie nel mondo: **ascoltare la musica** (cuffie e respiro a tempo, in poltrona), **disegnare** (un foglio vero; il disegno finisce appeso al muro), **sfogarsi al sacco da boxe** (pugni e calci, senza combo né punteggi: la rabbia scende colpo dopo colpo), **andare in salone** e lì **parlare con la mamma** (il giocatore sceglie le parole di Francesco) o **giocare con Leo e Giulia** (torre di cubi a turno); oppure sbattere la porta, lanciare il tablet, urlare, riprendere a giocare. Il terapista può togliere il sacco dalle scelte con l'impostazione `saccoCalma` (resta come gioco premio).
6. Durante l'attività la rabbia scende passo dopo passo. A calma ritrovata: +100 XP, Forza +1 e due giochi premio in cameretta, **sacco da boxe** e **gara di kart** vinta.
7. Comportamento problema: arriva un genitore dal salone (il papà entra dal corridoio dopo la porta sbattuta, la mamma si alza dal divano dopo le urla o il tablet lanciato), attraversa la porta camminando, parla con calma e porta via il tablet. Francesco resta arrabbiato, senza XP e senza premi. Una dissolvenza ("Il giorno dopo", "Qualche giorno dopo" se il tablet è rotto) riporta all'inizio del giro.

Livelli: 1 modeling (quando arriva l'arancione Francesco posa il tablet da solo e va ad ascoltare la musica), 2 aiuto completo (il pulsante e le scelte adatte pulsano, freccia, voce) o parziale (solo pulsazione), 3 senza aiuto con aiuto ritardato, 4 una sola vittoria, una sconfitta in più, attività più brevi.

Dati: ogni occasione registra tipo (`indipendente`, `con_aiuto`, `anticipata`, `problema`, `modello_osservato`), scelta (attività o comportamento problema), latenza dall'arancione al tablet posato, aiuto dato, rabbia da 0 a 100, se il tablet è stato posato durante o dopo la partita, quante rivincite ha chiesto dopo l'arancione, partite giocate prima, premio scelto. Ogni partita al tablet registra gioco, esito programmato e risultato. Esportazione CSV o "Copia dati".

### File

| File | Ruolo |
| --- | --- |
| `index.html` | interfaccia (HUD, tablet, attività, area terapista) e import map |
| `js/main.js` | storia, contingenze, camera, casa (stanze, porta, passaggi), scelte per momento e stanza, conseguenze |
| `js/rabbia.js` | la rabbia continua: base, picchi, zone, HUD, viso |
| `js/attivita.js` | le attività che calmano: musica, disegno, mamma, costruzioni |
| `js/persone.js` | mamma, papà, altri bambini e fumetti |
| `js/salone.js` | il salone accanto alla cameretta, il corridoio da cui arriva il papà, i cubi delle costruzioni |
| `js/stanza.js` | cameretta, luci, mobili, premi; funzioni comuni per pareti, porte, finestre |
| `js/core.js` | configurazione, salvataggio, audio, didascalie, tween, dissolvenze |
| `js/assets.js` | caricamento dei modelli glTF |
| `js/personaggio.js` | personaggio animato e pose |
| `js/volto.js` | espressioni del viso e rossore |
| `js/tablet.js` | menu dei giochi, partite con regia ed eventi, risultati |
| `js/giochi/blaster.js` | Blaster Arena: regole, avversario, interfaccia |
| `js/giochi/arena.js` | lo scenario di Blaster Arena: cielo, colline, campo, tribune con pubblico, tabellone, effetti dei colpi |
| `js/testi.js` | tutti i testi: narratrice, battute, frasi tra cui scegliere, scritte; elenco delle frasi da registrare |
| `js/narrazione.js` | la voce: registrazioni di `assets/voce`, riserva sulla voce del dispositivo, fumetti parlati |
| `js/musica.js` | musica di sottofondo suonata dal browser, che segue la rabbia |
| `js/aiuto.js` | la richiesta di aiuto: occasioni, aiuti programmati, dialoghi, esiti, dati |
| `js/enigmi.js` | i quattro enigmi della scatola, in versione facile e difficile |
| `js/scatola.js` | la scatola del nonno in 3D: serrature, coperchio, biglietto |
| `assets/voce/` | le frasi registrate (MP3) e il loro indice |
| `js/terapista.js` | area terapista |
| `kart-royale/` | Kart Royale compilato con la modalità ABA |
| `strumenti/` | convertitore del personaggio, visualizzatore di modelli, preparazione dell'anteprima, registrazione della voce (`genera-voce.py`, `frasi.mjs`) |

I principi riutilizzabili sono in [principi.md](principi.md).

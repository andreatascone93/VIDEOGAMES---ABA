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
| `js/terapista.js` | area terapista |
| `kart-royale/` | Kart Royale compilato con la modalità ABA |
| `strumenti/` | convertitore del personaggio, visualizzatore di modelli, preparazione dell'anteprima |

## Il segreto del parco (3D)

Puzzle game 3D in Three.js nella cartella `giochi/parco`, con le sue copie dei moduli riutilizzabili. In fondo al Parco dei Tigli c'è una cupola chiusa da trent'anni. Il protagonista (Andrea, nome modificabile) trova una chiave d'ottone e un biglietto dell'inventore Ottavio Lumen: quattro cancelli, quattro custodi. Ogni cancello ha un enigma sul pannello e un custode vicino: Luca (un ragazzo del parco), Bruno (il giardiniere), Elena (la violinista del chiosco), Pietro (il vecchio amico di Ottavio). Il principio del gioco, mai detto: si arriva in fondo stando bene con sé stessi e con gli altri.

| Tappa | Enigma | Abilità | Cosa manca nella versione difficile |
| --- | --- | --- | --- |
| Roseto | codice di quattro simboli | attenzione | due simboli coperti dal fango |
| Fontana | tubi da girare | logica | un tubo arrugginito: serve la chiave inglese |
| Chiosco | carillon da ripetere | memoria | suona una volta sola e in fretta: serve chi conosce la melodia |
| Cupola | mosaico del cielo | visuospaziale | la tessera centrale e il disegno di riferimento |

### Contingenze

| Voce | Nel gioco |
| --- | --- |
| MO | enigma che da soli non si risolve: manca qualcosa che ha solo il custode |
| SD | frustrazione in zona arancione (60 su 100) dopo almeno un tentativo sbagliato, con il custode in vista |
| Risposta target | chiedere aiuto, dal pannello ("Chiedi aiuto a…") o andando dal custode ("Parla con…") |
| Forma gentile e precisa | aiuto pieno (pezzo mancante più suggerimento), fiducia +1, +20 XP |
| Forma brusca | aiuto minimo (solo il pezzo mancante) |
| Forma scortese | il custode si offende e se ne va; servono le scuse, e l'aiuto sarà minimo; fiducia −2 |
| Dopo l'aiuto | "Grazie": fiducia +1. "Era ora": fiducia −1 |
| Fiducia ≥ 2 | il custode diventa amico e accompagna il protagonista |
| Finale | la cupola si apre di uno spicchio per ogni persona presente (da 1 a 5): il tesoro si vede tutto solo con quattro amici |
| Risposte problema | lasciar perdere (si torna a casa, si riparte "il giorno dopo"), colpire il pannello (si blocca, il custode perde fiducia) |
| Autoregolazione | sopra l'arancione il pannello si annebbia e la musica si incupisce; "Fai un respiro" abbassa la frustrazione |

Livelli: 1 modeling (il protagonista chiede con gentilezza e ringrazia da solo), 2 aiuto completo (pulsante e custode lampeggiano, freccia, voce, frase gentile per prima) o parziale, 3 aiuto ritardato, 4 il custode arriva dopo qualche secondo (tolleranza all'attesa).

Dati per ogni enigma: tipo (`indipendente`, `anticipata`, `con_aiuto`, `prima_di_provare`, `problema`, `modello_osservato`, `da_solo`), forma della prima richiesta (`gentile`, `brusca`, `scortese`), grado di aiuto ricevuto, grazie, scuse, risposte scortesi, respiri, colpi, latenza dall'arancione, frustrazione, errori, attesa, fiducia finale del custode, se è diventato amico, esito, tempo. Per sessione: amici e spicchi aperti. Più l'elenco di tutte le richieste, anche quelle sugli enigmi facili.

### File

| File | Ruolo |
| --- | --- |
| `index.html` | interfaccia (HUD, pannello del cancello, frasi, respiro, area terapista) |
| `js/main.js` | storia, contingenze, custodi e fiducia, aiuti programmati, esiti, finale, camera |
| `js/enigmi.js` | i quattro enigmi, facili e difficili, con aiuto minimo o pieno |
| `js/parco.js` | viale, cancelli, pannelli, cartelli, fontana, chiosco, giostra, cupola |
| `js/musica.js` | musica generata dal browser, allegra o cupa secondo la frustrazione |
| `js/frustrazione.js` | la frustrazione continua (stesso motore della rabbia) |
| `js/core.js`, `assets.js`, `personaggio.js`, `volto.js`, `persone.js`, `terapista.js` | moduli comuni copiati dalla cameretta (in `core.js` la scelta della voce) |

I principi riutilizzabili sono in [principi.md](principi.md).

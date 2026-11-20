# Principi per costruire giochi ABA come "La cameretta di Francesco"

Questo documento raccoglie i principi emersi costruendo il primo gioco. Serve a progettare i prossimi giochi senza ripartire da zero. Va aggiornato ogni volta che il codice insegna qualcosa di nuovo.

Ogni principio ha tre parti: la regola, perché vale, e dove si vede nel codice del primo gioco.

---

## 1. Principi clinici (ABA)

### 1.1 Scrivere la contingenza prima del gioco
Ogni gioco parte da una tabella A-B-C esplicita: operazione motivazionale (MO), stimolo discriminativo (SD), risposta target, risposte problema, conseguenze di ciascuna. Ogni elemento del gioco deve corrispondere a una di queste voci. Un elemento che non ne serve nessuna va tolto.
*Dove:* intestazione di `giochi/cameretta/js/main.js`, `docs/architettura.md`.

### 1.2 L'antecedente deve essere vissuto, non solo raccontato
La frustrazione nasce da partite vere al tablet: il giocatore gioca davvero, prima vince, poi perde. Così la pausa viene provata nella stessa situazione in cui serve nella vita reale, con un po' della stessa emozione. La "regia" delle partite resta invisibile.
*Dove:* `js/tablet.js`, `kart-royale/` (modalità ABA), `js/giochi/blaster.js` (funzione `maxVuole`).

### 1.3 Prima il successo, poi la difficoltà
Le prime partite si vincono facilmente: il gioco diventa desiderabile e la perdita successiva pesa davvero (momento comportamentale e valore del rinforzatore). Il numero di vittorie e sconfitte è un parametro del terapista, non una costante.
*Dove:* impostazioni `vittorie` e `sconfitte`; dal secondo giro una sola vittoria.

### 1.4 Lo stato interno si vede, e si muove mentre succedono le cose
La rabbia non cambia a scatti tra una partita e l'altra: sale e scende durante la partita, nel momento in cui il rivale segna, sorpassa o il tempo sta per finire. È così che la rabbia arriva nella vita reale, ed è lì che il bambino deve imparare a notarla. Resta visibile in più modi insieme: barra continua con cinque zone e il nome dello stato, segnali del corpo scritti ("denti stretti", "pugni stretti", "cuore che batte forte"), espressione del viso, rossore, tremore e battito del cuore udibile. Un bambino che legge e riconosce già la rabbia ha bisogno che il gioco la sottolinei, non che la spieghi.
*Dove:* `js/rabbia.js`, `partitaConRabbia` in `main.js`, `js/volto.js`.

### 1.5 L'SD è una soglia precisa, la risposta è disponibile sempre
L'SD è l'ingresso in zona arancione (rabbia a 60 su 100). Il pulsante "Posa il tablet" però è presente per tutta la partita, non compare solo al momento giusto: se comparisse da solo farebbe già da suggerimento. Posare in zona gialla si registra come `anticipata` e si rinforza come una risposta indipendente, perché insegna ad agire all'inizio della catena e non al picco. Posare quando si è tranquilli non conta: la partita continua.
*Dove:* `#posaBtn` in `index.html`, `inizioSD` e `dopoPosa` in `main.js`.

### 1.6 La risposta target è una catena: smettere, poi fare altro
Posare il tablet è solo il primo anello. La calma non arriva stando fermi in un angolo: arriva facendo un'altra cosa, per il tempo che serve. Il gioco quindi chiede due risposte in sequenza (posare, scegliere un'attività) e la rabbia scende soltanto mentre l'attività procede. Le scelte restano azioni nel mondo: il giocatore porta il personaggio alla poltrona, alla scrivania, in salone.
*Dove:* `apriScelte`, `scelta` in `main.js`; `c.calma(k)` in `js/attivita.js`.

### 1.7 Più alternative adeguate, di tipo diverso
Una sola risposta corretta non generalizza. Le alternative coprono funzioni diverse: da solo (musica con le cuffie, disegno), movimento fisico (sacco da boxe), comunicazione funzionale (dire alla mamma che si è arrabbiati, invece di urlarlo), gioco sociale (costruzioni a turno con altri bambini). Ogni occasione registra quale è stata scelta, così il terapista vede le preferenze e può lavorare su quelle evitate.
*Dove:* `js/attivita.js` (`musica`, `disegno`, `mamma`, `costruzioni`), `giocoSacco` in `main.js`, colonna "Attività scelte" in `js/terapista.js`.

### 1.8 Rinforzo immediato, multiplo e legato alla funzione
Dopo l'attività arrivano subito: sollievo (la rabbia è scesa passo dopo passo, il viso è disteso), potere (XP, Forza, il personaggio cresce) e accesso ad attività ugualmente desiderabili (sacco da boxe, gara di kart vinta). Il tablet resta suo. I rinforzatori competono con la funzione del comportamento problema: movimento fisico (sacco) e voglia di vincere (gara).
*Dove:* `calmaRitrovata`, `premio` in `main.js`.

### 1.9 Lo sfogo fisico è una delle strade per calmarsi, con regole chiare
Il sacco da boxe è tra le scelte dopo aver posato il tablet, oltre che un gioco premio. Dà alla spinta a colpire e a lanciare un bersaglio adatto: stessa energia, oggetto giusto, nessun danno. Per un ragazzo che ha bisogno di muoversi è un'alternativa facile da preferire alla porta e al tablet. Perché resti un modo di calmarsi e non di caricarsi, nella versione "calma" non ci sono combo né scritte di potenza, la durata è breve e la barra della rabbia scende colpo dopo colpo. Punto da tenere d'occhio con il supervisore: la ricerca sulla catarsi (per esempio Bushman 2002) segnala che colpire da arrabbiati può mantenere la rabbia. I dati mostrano quante volte viene scelto il sacco rispetto alle altre attività, e l'impostazione `saccoCalma` permette di toglierlo dalle scelte lasciandolo come premio.
*Dove:* `saccoCalma` in `core.js` e `terapista.js`, `apriScelte` e `giocoSacco({ calma })` in `main.js`.

### 1.10 Conseguenze realistiche per i comportamenti problema, senza spettacolo
Le conseguenze sono quelle di casa: arriva un genitore, dice due frasi brevi con voce calma, porta via il tablet. Porta sbattuta o urla: tablet tolto per il resto della giornata. Tablet lanciato: schermo rotto, niente tablet per qualche giorno. Continuare a giocare da arrabbiati porta a perdere ancora e a esplodere. In nessun caso arrivano XP, premi o sollievo: il personaggio resta arrabbiato. L'attenzione del genitore è breve e neutra, per non diventare essa stessa un rinforzo, e gli effetti restano più brevi e meno "divertenti" di quelli delle scelte adeguate.
*Dove:* `comportamentoProblema`, `visita`, `esplosione`, `saltoDiTempo` in `main.js`.

### 1.11 Gerarchia di aiuti e fading
Livello 1 modeling (il personaggio fa tutto da solo e il giocatore osserva), livello 2 aiuto completo (elemento che pulsa, freccia, voce) o parziale (solo l'elemento che pulsa), livello 3 nessun aiuto con aiuto ritardato dopo N secondi, livello 4 tolleranza (più sconfitte, attività più breve). L'aiuto vale per entrambi gli anelli della catena: posare il tablet e scegliere l'attività. Il gioco suggerisce quando cambiare livello in base al criterio di padronanza.
*Dove:* `inizioSD`, `aiutoPosa`, `aiutiScelta`, `modeling` in `main.js`.

### 1.12 Ogni occasione è un dato
Si registra: tipo (`indipendente`, `con_aiuto`, `anticipata`, `problema`, `modello_osservato`), latenza dall'ingresso in zona arancione al tablet posato, aiuto dato, valore della rabbia (0–100), se il tablet è stato posato a metà partita o dopo, rivincite giocate dopo l'arancione, attività scelta, premio scelto. Ogni partita registra esito programmato e risultato reale. Criterio standard: 80% di risposte indipendenti per 3 sessioni consecutive.
*Dove:* `record` in `main.js`, `js/terapista.js`.

### 1.13 Contesto simile alla vita reale, per generalizzare
Cameretta, tablet, porta, salone, mamma, papà, altri bambini: gli stessi stimoli e le stesse persone della situazione reale. Dopo la padronanza nel gioco va programmata la generalizzazione nel gioco reale al tablet (stessa barra della rabbia, stesse attività alternative disponibili in casa).

### 1.14 Etica e privacy
Impostazioni protette da PIN; dati solo sul dispositivo; nessun nome reale del bambino; uso dentro un programma supervisionato, con consenso dei genitori e assenso del bambino. Le sconfitte programmate sono un'esposizione voluta: le decide il terapista. I genitori nel gioco fanno da modello anche per i genitori veri: poche parole, tono calmo, conseguenza coerente.

### 1.15 Chiedere aiuto è una seconda abilità, con la sua contingenza
Accanto alla pausa c'è un secondo filo: chiedere una mano invece di mollare o di prendersela con le cose. La contingenza è scritta come l'altra. MO: un compito a cui manca qualcosa che ha soltanto una persona di casa (un indizio coperto da una macchia, un cacciavite, una melodia da risentire, una tessera). SD: il protagonista è bloccato, cioè ha già provato almeno una volta senza riuscire, e la rabbia è in arancione. Risposta target: andare dalla persona giusta e chiedere, con gentilezza e dicendo di preciso che cosa serve. Rinforzo: l'aiuto arriva davvero, e la serratura la apre comunque lui: chi aiuta dà quello che manca, non la soluzione. Le alternative hanno conseguenze naturali: lasciar perdere (il regalo resta chiuso), sbattere la scatola (si blocca per qualche secondo e la rabbia sale), esplodere (la mamma la mette via fino a domani), rispondere male (niente aiuto finché non chiede con calma).
Il gioco non dice mai "chiedi aiuto": lo fa solo l'aiuto programmato del livello. Il pulsante per chiedere è sempre presente, come quello per posare il tablet.
*Dove:* `js/aiuto.js` (intestazione, `inizioSD`, `chiedi`, `dialogo`, `aiutoDato`, `molla`, `colpisci`, `rovescia`).

### 1.16 La qualità della richiesta decide la qualità dell'aiuto
Non basta chiedere: conta come. Il giocatore sceglie le parole del protagonista tra quattro forme. Gentile e precisa: aiuto pieno (quello che manca, più un suggerimento). Brusca ma precisa: il minimo indispensabile. Gentile ma vaga ("Mi aiuti, per favore?"): la persona domanda che cosa serve, e la richiesta va completata. Sgarbata: nessun aiuto, e la persona dice con calma come chiederlo. Dopo l'aiuto c'è una seconda scelta: ringraziare, non dire niente, o uno sgarbo. Così il rinforzo differenziale lavora su tre risposte distinte (chiedere, chiedere bene, ringraziare) e ognuna finisce nei dati.
Le frasi tra cui scegliere compaiono in ordine casuale e hanno tutte lo stesso aspetto; solo l'aiuto completo del livello 2 mette per prima quella gentile.
*Dove:* `dialogo`, `segnaRichiesta`, `aiutoDato` in `js/aiuto.js`; `RICHIESTA`, `RISPOSTE` in `js/testi.js`.

### 1.17 Insegnare anche quando non chiedere
Un'abilità di richiesta insegnata male diventa dipendenza dall'aiuto. Per questo la difficoltà cresce e non tutte le serrature hanno bisogno di qualcuno: le prime si aprono da soli, e chi chiede lo stesso si sente rispondere "questa la apri da solo" (richiesta non necessaria, registrata). Sulle serrature difficili, chi chiede prima di aver provato viene invitato a provare una volta (impostazione `provaPrima`). Il numero di serrature che richiedono aiuto è un parametro del terapista (`difficili`, da 0 a 4): si parte con poche occasioni e si aumenta. Al livello 4 l'aiuto non arriva subito: chi ha chiesto deve aspettare qualche secondo (tolleranza all'attesa, `attesaAiuto`).
La rabbia qui segue la situazione: sale con gli errori e con il tempo passato bloccati, ma da sola si ferma all'arancione. Al rosso si arriva soltanto sbattendo la scatola: il primo colpo è un avvertimento, dal secondo si può esplodere.
*Dove:* `difficile`, `update`, `dialogo` in `js/aiuto.js`; campi `difficili`, `provaPrima`, `attesaAiuto` in `js/terapista.js`.

### 1.18 Due fili nello stesso episodio, dati separati
Pausa e richiesta di aiuto convivono nello stesso pomeriggio, ma sono due programmi diversi: ogni occasione porta l'ambito (`aiuto` per la scatola, nessuno per il tablet), il grafico ha due linee, e il terapista può tenere un solo filo per volta (impostazione `percorso`). Mescolare le percentuali nasconderebbe proprio la cosa che serve vedere.
*Dove:* `registra` in `js/aiuto.js`; `summary`, `summaryAiuto`, `tabellaAiuto` in `js/terapista.js`.

---

## 2. Principi di game design

### 2.1 Adatto all'età, non infantile
Per un ragazzo di 9 anni: aspetto da videogioco vero (3D, movimento libero, HUD con XP e Forza), niente "Bravissimo!" o stelline. La lode è nelle conseguenze naturali, non nelle parole.

### 2.2 Storia guidata con movimento libero
Il giocatore cammina dove vuole, ma la storia avanza solo con le interazioni chiave. Un obiettivo è sempre scritto in alto, e la didascalia (letta anche a voce) dice cosa succede.
La casa è un solo spazio: da una stanza all'altra si passa camminando, dalla porta, in ogni momento in cui il personaggio è libero. Niente dissolvenze e niente teletrasporti: la continuità del luogo è parte del realismo. La porta è sempre una scelta, e si può anche toccare il pavimento dell'altra stanza. Le scelte offerte dipendono da due cose insieme, il momento della storia e la stanza in cui si trova il personaggio; quando la storia chiede una decisione (rabbia alta, tablet posato) le alternative restano le stesse in ogni stanza, così girare per casa non diventa un modo per evitare la scelta.
*Dove:* `fase`, `etichette`, `entrato`, `vaiNellAltraStanza` in `main.js`.

### 2.3 La regia deve essere credibile
L'avversario resta vicino: perde di poco nelle partite facili e vince di poco in quelle difficili. Ogni tanto sbaglia un colpo anche quando "vuole" vincere. Mai sconfitte umilianti. Nel kart il rivale arriva primo con pochi metri di vantaggio; nel blaster Max chiude con 2–4 punti di margine.

### 2.4 Il mondo reagisce
Le azioni hanno effetti che restano e che coinvolgono altre persone: la porta sbattuta fa arrivare il papà, il tablet lanciato ha lo schermo crepato, il disegno finito resta appeso al muro, la mamma risponde in modo diverso a quello che le si dice. Un mondo che reagisce rende credibili le conseguenze, e le conseguenze credibili sono quelle che si ritrovano a casa.
Chi reagisce arriva da dove si trovava: la mamma si alza dal divano del salone, il papà entra dal corridoio, tutti e due attraversano la porta camminando, e dopo tornano al loro posto. Mentre arrivano, l'inquadratura si allarga sulla casa: il giocatore vede che il rumore si è sentito anche di là.
*Dove:* `visita`, `arriva`, `rientra`, `rompiTablet`, `room.carta` (disegno al muro), `battute` in `attivita.js`.

### 2.5 Le attività alternative sono piccoli giochi veri
Disegnare, costruire una torre a turno, parlare scegliendo le frasi: ogni alternativa si gioca davvero e dura abbastanza da assorbire. Un'animazione da guardare non compete con il tablet; un'attività in cui si fa qualcosa sì. La barra della rabbia scende più in fretta quando il giocatore partecipa (per esempio mentre disegna) che quando aspetta.
*Dove:* `js/attivita.js`.

### 2.6 I giochi premio sono rinforzanti ma rilassanti
Nessuna condizione di sconfitta, tempo breve (30 s), potenza che cresce con la Forza accumulata: la storia di rinforzo si vede.

### 2.7 Dare scelta
Il giocatore sceglie il gioco al tablet (corsa o sparatutto), l'attività per ritrovare la calma e il gioco premio. La scelta è essa stessa rinforzante e aumenta la motivazione.

### 2.8 Sessioni brevi
Due o tre occasioni per sessione, 3–5 minuti ciascuna. Le partite durano circa 40–60 secondi (un giro di pista, una sfida a tempo), le attività circa 25 secondi (regolabili). Una sessione deve sempre poter finire: se un compito resta aperto (la scatola ancora chiusa), dopo almeno un tentativo il giocatore trova nel mondo la scelta "Basta per oggi", e la narratrice chiude senza rimproveri: la scatola aspetta domani. Nessun vicolo cieco, nemmeno per chi rinuncia. Quando c'è la scatola, anche la schermata finale dice il vero: "Missione completata" compare solo a scatola aperta; altrimenti il titolo è "Per oggi basta così", con il conto delle serrature aperte.
*Dove:* `tempoLibero`, etichetta `basta` in `etichette`, `fineSessione` in `main.js`.

### 2.9 Accessibilità
Narrazione vocale (italiano), didascalie grandi, fumetti con il nome di chi parla, pulsanti grandi per il tocco, layout pensato per tablet in orizzontale, comandi da tastiera per il computer.

### 2.10 Requisiti per integrare un gioco esterno
Licenza compatibile (MIT o CC0), funziona offline, ha comandi touch, permette di controllare l'esito (agganci all'intelligenza artificiale degli avversari), può segnalare alla pagina che lo contiene inizio, fine e andamento della partita.

### 2.12 Personaggi con un carattere riconoscibile
Ogni persona della storia si riconosce a colpo d'occhio e "si comporta" come è fatta: proporzioni (i bambini hanno la testa più grande, gli adulti più piccola), acconciatura, vestiti, colori, e un modo suo di stare fermo (chi è vivace dondola e si guarda intorno di più, chi è calmo meno). Lo stile resta cartoon ma verosimile: niente mascotte, persone credibili di casa. Il viso è la parte più importante per l'ABA: le emozioni devono leggersi bene anche da lontano (sopracciglia, palpebre, bocca, rossore) e anche il corpo le mostra (spalle che salgono, testa bassa, respiro corto), così lo stato interno è uno stimolo visibile e coerente con la barra e con i segnali scritti.
*Dove:* `js/aspetto.js` (`ASPETTI`, `Viso`), `js/personaggio.js` (`carattereVivo`).

### 2.11 Tutti i giochi interni allo stesso livello grafico
Un gioco dentro il gioco vale quanto il più curato tra quelli accanto: se uno sembra un videogioco vero e l'altro una prova tecnica, il secondo smette di essere rinforzante e la regia non è più credibile. Prima di aggiungere un gioco interno lo si confronta, schermata accanto a schermata, con il migliore già presente. Lista di controllo: un cielo e un orizzonte (mai uno sfondo a tinta unita); un terreno con texture e variazioni di colore; una luce con una direzione, calda da una parte e fredda dall'altra, con ombre; vita nella scena (pubblico, bandiere, palloncini, polvere); un effetto per ogni evento importante (scoppio, anello, lampo, tabellone che si aggiorna); un'interfaccia da trasmissione sportiva, con nomi, punteggio e tempo. Vale anche per gli oggetti della stanza che fanno da gioco, come il sacco da boxe: materiali veri, struttura credibile, un effetto a ogni colpo.
*Dove:* `js/giochi/arena.js`, `js/giochi/blaster.js`, il sacco in `stanza.js` (`saccoColpo`).

### 2.12 Un episodio con una narratrice
Il gioco si apre come un episodio: un cartello con il titolo, poi una voce che presenta il protagonista con quattro frasi brevi. Chi è, che cosa ama, che cosa gli pesa, che cosa vuole ottenere. Senza questo, la rabbia è solo una barra; con questo è la difficoltà di qualcuno a cui ci si è affezionati. La narratrice poi accompagna i momenti importanti e chiude l'episodio raccontando com'è andata e anticipando il prossimo.
Tre regole di scrittura. La narratrice descrive fatti e stati ("la rabbia comincia a salire"), non dà ordini: dire che cosa fare spetta solo all'aiuto del livello. Non giudica il protagonista quando sbaglia: racconta la conseguenza. Parla poco: una frase per momento, e la presentazione si può saltare.
*Dove:* `NARRA` in `js/testi.js`; `iniziaSessione`, `fineSessione` in `main.js`.

### 2.13 Personaggi con un carattere
Il protagonista ha un desiderio (le sfide), un difetto (si arrabbia in fretta) e un obiettivo che dura più episodi (giornate più serene, a casa e a scuola). Le altre persone reagiscono alle stesse situazioni ognuna a modo suo: la mamma calda e paziente, il papà asciutto e pratico, la sorellina diretta. Stesse contingenze, voci diverse: il giocatore impara che la richiesta fatta bene funziona con persone diverse, e la casa sembra abitata.
*Dove:* `RISPOSTE` in `js/testi.js` (stesse chiavi per tre persone).

### 2.14 La musica dice come sta il protagonista
La musica di sottofondo ha due versioni dello stesso tema, una calma e una tesa, che si mescolano in base alla rabbia: lo stato si sente prima ancora di guardare la barra. Si abbassa quando qualcuno parla e tace quando sullo schermo c'è un gioco con i suoi suoni. Deve restare sotto la voce, sempre.
*Dove:* `js/musica.js`.

### 2.15 Enigmi a difficoltà crescente, con un indizio fisico
Quattro enigmi di tipo diverso (codice di simboli, circuito, melodia da ripetere, mosaico), in ordine di difficoltà. L'indizio sta su un oggetto del mondo, il biglietto del nonno, e l'aiuto di una persona lo cambia in modo visibile: la macchia sparisce, sul biglietto compaiono le note. Il premio finale non sono punti: è una lettera e una cosa da fare insieme.
*Dove:* `js/enigmi.js`, `js/scatola.js`, `finale` in `js/aiuto.js`.

---

## 3. Principi tecnici

### 3.1 Un gioco, una cartella statica
Pagina web senza passaggi di compilazione per il gioco principale: `index.html` con import map e moduli in `js/`. Three.js è incluso nella cartella (`vendor/three`, r160). I moduli ES non si caricano da `file://`: va servito via http (link pubblicato, GitHub Pages o `python3 -m http.server`).

### 3.2 Moduli riutilizzabili
| Modulo | Cosa fa | Riusabile così com'è? |
| --- | --- | --- |
| `core.js` | configurazione, salvataggio, audio, didascalie, tween, dissolvenza a nero | sì |
| `assets.js` | caricamento e cache dei glTF, cloni con scheletro | sì |
| `personaggio.js` | personaggio animato: camminata, animazioni con dissolvenza, pose composte | sì |
| `aspetto.js` | aspetto dei personaggi costruito in codice sullo scheletro Kenney: corpo, vestiti, capelli, viso 3D con espressioni (`set(umore, rossore)`, `parla(on)`) | sì: un personaggio nuovo è una voce in `ASPETTI` |
| `grafica.js` | luce riflessa d'ambiente (PMREM da una stanza finta) e taratura delle luci | sì |
| `volto.js` | espressioni del viso dipinte sulla texture | solo per i vecchi personaggi Kenney con skin |
| `rabbia.js` | stato emotivo continuo 0–100 con zone, picchi e soglie | sì, per ogni emozione a livelli |
| `persone.js` | altre persone (stesso scheletro, altra skin e statura) e fumetti | sì |
| `terapista.js` | impostazioni, grafico, tabella, esportazione | sì, cambiando i campi |
| `tablet.js` | dispositivo nel gioco con partite vere, regia ed eventi in tempo reale | sì, per scenari con schermi |
| `attivita.js` | attività alternative (musica, disegno, dialogo, costruzioni) | in parte: lo schema `calma(k)` sì |
| `giochi/arena.js` | scenario all'aperto per i giochi interni: cielo, terreno, luci, pubblico, tabellone, effetti | sì, cambiando colori e oggetti |
| `testi.js` | tutto quello che il gioco dice o scrive, e l'elenco delle frasi da registrare | lo schema sì, i testi no |
| `narrazione.js` | voce registrata con riserva sulla voce del dispositivo, fumetti parlati, coda delle frasi | sì |
| `musica.js` | musica procedurale a due strati che segue uno stato da 0 a 1 | sì |
| `enigmi.js` | quattro enigmi autonomi con versione facile e difficile | sì |
| `aiuto.js`, `scatola.js` | la richiesta di aiuto e l'oggetto che la motiva | lo schema sì (occasione, richiesta, aiuto graduato) |
| `stanza.js`, `salone.js`, `main.js` | scene e storia di questo scenario | no, sono specifici (riusabili `pareteConPorta`, `porta`, `finestra`) |

### 3.3 Pipeline del personaggio
Kenney Animated Characters (CC0): modello FBX più animazioni FBX separate, convertiti nel browser in un solo GLB con GLTFExporter (`strumenti/converti-personaggio.html`). Di ogni FBX si prende la clip più lunga, escludendo "Targeting Pose". Le skin sono PNG scambiabili al volo.

### 3.4 Pose composte
Si possono creare pose nuove unendo tracce di clip diverse: "seduto rilassato" = gambe da `racingIdle` più braccia da `idle`. Nella posa di guida il punto di seduta è circa 0,5 m sopra la radice (per un personaggio alto 1,36 m): l'altezza del personaggio seduto si calcola da lì, in proporzione alla statura.

### 3.5 Espressioni sulla texture
Si copia l'atlante della skin in un canvas, si coprono i tratti originali con il colore della pelle, si applica il rossore con `multiply` e si disegnano i tratti nuovi. Si ridisegna solo quando cambia l'umore o l'intensità (arrotondata a decimi). Le coordinate del viso sono nel modulo.

### 3.5b Personaggi disegnati in codice sullo stesso scheletro
Lo scheletro e le animazioni Kenney restano (camminata, corsa, seduto, pugno, calcio…), la pelle a blocchi si nasconde e ogni osso riceve forme morbide (tubi arrotondati, solidi di rotazione per il busto, sfere deformate per la testa) agganciate con `attach` nella posa di legame. Vantaggi: nessun file nuovo da caricare, animazioni condivise da tutti, proporzioni e vestiti diversi per ogni personaggio, e un viso vero in 3D: occhi con iride dipinta che si muovono, palpebre che sbattono e si inclinano, sopracciglia mobili, bocca e guance disegnate su una "maschera" che ha la stessa forma della testa (`formaTesta`). Lo strato di carattere (respiro, dondolio, spalle tese, testa che accompagna le parole) si somma all'animazione dopo il mixer e si toglie prima del fotogramma successivo, così non si accumula. Attenzione ai segni: con il personaggio girato verso +z, il suo lato sinistro è +x; per abbassare l'angolo interno di sopracciglio e palpebra la rotazione z è `lato × angolo`.

### 3.6 Arredi e misure
Mobili KayKit (CC0) in scala 0,6–0,75 e Kenney Furniture Kit (CC0) portati a una misura precisa con `Box3`. Niente a occhio: `Box3` per appoggiare gli oggetti e definire gli ostacoli, un raggio dall'alto (`Raycaster`) per l'altezza vera di una seduta, perché il riquadro di un divano comprende schienale e braccioli.
*Dove:* `sistema` e `sedutaDivano` in `js/salone.js`.

### 3.7 Motore dell'emozione: base, picco, zone
Il valore mostrato insegue `base + picco`. La base è l'andamento lento deciso dalla regia (sale con l'avanzare di una partita che si perderà); il picco è la reazione a un evento (punto del rivale, sorpasso) e si spegne in pochi secondi. Le zone sono cinque fasce da 20 punti con isteresi, così la barra non rimbalza sul confine; un aggancio `onZona` avvisa la storia quando si cambia zona; un `tetto` impedisce di superare una soglia quando la storia non lo prevede (per esempio in una partita che si vincerà).
*Dove:* `js/rabbia.js`.

### 3.8 Protocollo degli eventi di gioco
Ogni gioco del tablet racconta cosa succede con `onEvento`: `via`, `tempo` (avanzamento 0–1), `punto` (chi ha segnato), `posizione` (sorpassi, solo corsa). La storia traduce gli eventi in rabbia; il gioco non sa niente di ABA. La partita si può interrompere da fuori (`interrompi`), e il risultato dice perché: tablet posato, esplosione, dimostrazione.
*Dove:* `partita` in `js/tablet.js`, `partitaConRabbia` in `main.js`.

### 3.9 Giochi esterni dentro il gioco
Kart Royale (MIT) è compilato con Vite (`base: './'`) e modificato con parametri `?aba=1&esito=vinci|perdi&giri=N`. L'elastico degli avversari è in `AI.ts`. Il gioco comunica con `postMessage({ sorgente: 'kart-royale', tipo: 'pronto' | 'stato' | 'fine', posizione, progresso })`: `stato` parte ogni mezzo secondo durante la gara. Se i messaggi di stato non arrivano, l'avanzamento si stima dal tempo trascorso, così la rabbia si muove comunque. Le modifiche stanno in `kart-royale/modifiche-aba.patch` e `aba.ts.txt`, da riapplicare se il progetto originale si aggiorna.

### 3.10 Una casa continua: stanze affiancate, coordinate locali
Le stanze sono gruppi messi uno accanto all'altro nel mondo e sempre visibili. Ogni stanza ha la sua mappa (limiti, ostacoli, punti di passaggio, pavimento per il tocco) scritta nelle coordinate della stanza, come se fosse l'unica. Ogni personaggio è figlio del gruppo della stanza in cui si trova: luoghi, ostacoli, attività e pose non sanno dove la stanza è appoggiata nel mondo, e aggiungere una stanza non costringe a riscriverli. Sulla soglia il personaggio cambia genitore nello stesso punto del mondo e riceve le nuove coordinate locali; solo la camera, le inquadrature fisse e i tocchi sul pavimento sommano l'origine della stanza.
Le pareti in comune hanno un vano vero (tre pezzi: prima, dopo, architrave) con le coordinate della texture calcolate sulla parete intera, così la carta da parati non si interrompe. L'anta è una sola per porta. Il percorso sulla soglia passa tra l'anta aperta e lo stipite, e il punto in cui il personaggio aspetta che la porta si apra sta fuori dal raggio dell'anta. Un solo sole illumina tutta la casa, con una mappa delle ombre che copre le stanze affiancate; le luci puntiformi senza ombre passano i muri, quindi vanno tenute deboli e lontane dalle pareti in comune.
Una funzione rimette la casa in ordine (tutti al loro posto, porte chiuse) e incrementa un contatore: le animazioni non attese, come il genitore che torna al divano, lo controllano e si fermano se nel frattempo la casa è stata riordinata.
*Dove:* `ORIG`, `metti`, `MAPPA`, `SOGLIA`, `attraversa`, `mostraStanza`, `giro` in `main.js`; `pareteConPorta` in `stanza.js`; `SALONE_X` in `salone.js`.

### 3.11 Etichette nel mondo
Le scelte sono etichette ancorate a punti della scena. Lo stesso punto può portarne più di una (sul tablet: "Continua a giocare" e "Lancia il tablet"): si impilano in righe. Le etichette si creano quando servono e si tolgono subito dopo la scelta. Adeguate e problema hanno lo stesso aspetto: il colore non deve suggerire la risposta. Le etichette sono funzione del momento della storia e della stanza: una sola funzione le ricostruisce ogni volta che il personaggio entra in una stanza o la storia cambia momento, invece di tante liste scritte a mano nei vari punti della storia.
*Dove:* `PUNTI`, `setAttivi`, `etichette` in `main.js`.

### 3.12 Altre persone
Mamma, papà e bambini sono lo stesso modello animato con un'altra skin e un'altra statura; i capelli sono forme semplici agganciate all'osso della testa. Chi parla ha un fumetto con il nome, che segue la testa. Chi aspetta un genitore si mette fuori dal suo percorso, altrimenti i personaggi si attraversano.
*Dove:* `js/persone.js`, `ATTESA` e `visita` in `main.js`.

### 3.13 Prestazioni su tablet
Mentre gira un gioco del tablet, la casa si ridisegna un fotogramma su tre. Pixel ratio massimo 1,75. Una sola mappa delle ombre 4096×2048 per tutta la casa, 2048 nell'arena. Il secondo contesto WebGL si distrugge all'uscita. La grafica ricca si ottiene senza post-produzione: bagliori fatti con sprite additivi al posto del bloom, pubblico in un'unica `InstancedMesh`, particelle prese da una riserva già allocata, nebbia e cielo in uno shader semplice. Si misura sempre con `renderer.info`: la casa intera sta sotto le 100 chiamate di disegno, l'arena poco sopra.

### 3.14 Inquadrature
`camera.setViewOffset` sposta il personaggio nella striscia libera accanto al tablet senza cambiare prospettiva. Ogni momento della storia ha la sua inquadratura: stanza (inquadra la stanza in cui si trova il personaggio, scorre da una all'altra quando passa la porta e, vicino alla porta, si sposta verso la stanza accanto per mostrare dove si sta andando), scelta (fissa, tutte le opzioni in vista), viso, tablet, pausa, sacco, più inquadrature fisse per le attività e una larga sulla casa quando arriva un genitore.

### 3.15 Test automatici
Playwright con swiftshader. Gli elementi che pulsano non sono mai "stabili": si usa `dispatchEvent('pointerdown')`. Si aspetta la schermata attiva, non l'esistenza di un pulsante: i pulsanti della schermata precedente restano nella pagina. In modalità `?debug` la camera si può fissare all'istante e `window.__app` espone lo stato. Per i passaggi di stanza si aspetta `luogo` (dove si trova il protagonista) e la proprietà `stanza` degli altri personaggi. Il kart si sostituisce con una pagina finta che manda gli stessi messaggi (`route` più `postMessage`), perché il rendering software è troppo lento per guidare davvero; la regia del kart si verifica facendo avanzare la simulazione con `race.update(ctx, 1/60)`. Per le prove `?intro=0` salta la presentazione; gli enigmi espongono `perTest()` (la soluzione) e le frasi tra cui scegliere hanno un attributo `data-k` con il loro tipo, così la prova non dipende dall'ordine casuale. Un'azione che apre un dialogo non va attesa dalla prova: la sua promessa si chiude solo a dialogo finito. Più browser senza scheda grafica in parallelo vanno tre volte più piano: una prova per volta.

### 3.16 Pubblicazione
L'anteprima su claude.ai accetta solo alcuni tipi di file (html, js, css, json, png, jpg, txt): niente `.glb`, `.gltf` o `.bin`. `strumenti/prepara-anteprima.py` crea una copia con i modelli convertiti in glTF `.json` con i dati incorporati; `assets.js` li carica se `index.html` ha `data-modelli="json"`. Lo stesso vale per l'audio: le registrazioni della voce vengono raccolte in pochi pacchi `.json` (base64), nell'ordine della storia, e `narrazione.js` li scarica quando servono. L'anteprima blocca anche i download: per i dati serve il pulsante "Copia dati". Il salvataggio locale vale solo per quel dispositivo e quel browser.

### 3.17 Licenze e crediti
Grafica: Kenney (Animated Characters, Furniture Kit) e KayKit (CC0). Kart Royale: MIT. Three.js: MIT. I file di licenza restano accanto agli asset. Voce: registrata con Kokoro-82M (Apache-2.0), in locale; nel gioco finiscono solo i file audio prodotti.

### 3.18 Uno scenario condiviso per i giochi interni
Cielo, terreno, luci, pubblico ed effetti stanno in un modulo a parte che restituisce poche funzioni (`punteggio`, `scoppio`, `anello`, `lampo`, `scia`, `esulta`, `aggiorna`): il gioco pensa alle regole, lo scenario alla resa. Un nuovo gioco interno riusa lo stesso scenario cambiando colori e oggetti. Tre lezioni dai modelli scaricati: il perno può stare in un angolo, quindi prima di ruotare un modello lo si ricentra sulla sua scatola; i posti del pubblico si trovano con raggi lanciati dall'alto sulla geometria vera, non indovinando le file dalle misure; le forme di rivoluzione (la capsula del sacco) distribuiscono la texture per numero di punti e non per altezza, quindi la coordinata verticale va ricalcolata dalla posizione.
*Dove:* `js/giochi/arena.js` (`costruisciArena`, `metti` con `centra`), `geoSacco` in `stanza.js`.

### 3.19 Tutti i testi in un solo modulo
Quello che il gioco dice (narratrice, battute, frasi tra cui scegliere) e scrive (cartelli, obiettivi) sta in un modulo senza dipendenze dalla pagina. Tre vantaggi: il clinico può rileggere e correggere i testi senza toccare la logica; uno script può elencare tutte le frasi da registrare; un altro episodio riusa lo schema cambiando le parole. Le frasi sono funzioni, perché contengono il nome del protagonista.
*Dove:* `js/testi.js` (`NARRA`, `SCRITTE`, `VOCI`, `RICHIESTA`, `tutteLeFrasi`), `strumenti/frasi.mjs`.

### 3.20 Voce naturale registrata in anticipo, con una riserva
Le frasi sono poche e note in anticipo: conviene registrarle una volta con una sintesi vocale di qualità che gira in locale, invece di affidarsi alla voce del dispositivo, che cambia da un tablet all'altro. Ogni frase diventa un file il cui nome è l'impronta di (chi parla + testo): se un testo cambia, quella frase resta senza registrazione e la legge la voce del dispositivo finché non si rilancia lo script, che registra solo le frasi nuove e toglie quelle non più usate.
Lezioni. Le voci dei bambini si ottengono mescolando le voci disponibili e alzando l'altezza: si sintetizza più lento e si riproduce più veloce, senza artefatti. Le frasi brevissime (una o due parole) vengono male: meglio scriverle di almeno tre o quattro parole. I puntini in testa a una frase diventano un suono. Una trascrizione automatica delle registrazioni, confrontata con il testo, trova gli errori di pronuncia senza bisogno di ascoltare tutto; l'orecchio di una persona resta comunque l'ultimo controllo. Il nome del protagonista si può cambiare: le frasi che lo contengono vanno registrate di nuovo con quel nome, oppure le legge la voce del dispositivo.
*Dove:* `strumenti/genera-voce.py`, `js/narrazione.js`, `assets/voce/`.

### 3.21 Chi parla, uno alla volta
Una frase nuova interrompe quella in corso, tranne quando è messa in coda (gli aiuti che arrivano mentre la narratrice sta parlando). La storia aspetta la fine della frase con un tempo minimo e uno massimo, così funziona uguale con la voce accesa, spenta, o lenta a caricarsi. Le frasi che stanno per servire si scaricano prima. I personaggi parlano con fumetto e voce insieme, e la bocca si muove.
*Dove:* `speak`, `detto` in `js/core.js`; `parlaOra`, `dici`, `prepara` in `js/narrazione.js`.

### 3.22 Musica procedurale a due strati
Nessun file audio: le note si programmano con poco anticipo sull'orologio dell'audio, su una griglia comune ai due strati. Lo stato (0 calmo, 1 teso) regola il volume dei due strati con una dissolvenza a potenza costante e stringe un po' il tempo. Il basso non scende sotto quello che l'altoparlante di un tablet riesce a far sentire. Se la scheda va in pausa, si riparte da adesso senza recuperare le note perse.
*Dove:* `js/musica.js` (`suonaPasso`, `giro`).

### 3.23 Enigmi che non sanno niente di ABA
Ogni enigma è una funzione che riceve `{ difficile, errore, risolto }` e restituisce il suo pezzo di interfaccia, `sblocca(pieno)` e `disegnaIndizio`. Segnala gli errori con un peso e non sa chi aiuta, né perché: la contingenza sta tutta nel modulo dell'aiuto, che traduce errori e tempo in rabbia e decide quando l'occasione è aperta. È lo stesso patto dei giochi del tablet (3.8). Nella versione difficile manca sempre una cosa precisa che una persona può dare, e i tentativi a vuoto ripetuti contano come un solo errore. Gli enigmi hanno misure pensate per un tablet; su uno schermo più piccolo è il pannello a rimpicciolirli quanto basta perché restino interi nel riquadro, così nessun enigma deve conoscere lo schermo.
*Dove:* `js/enigmi.js`, `erroreEnigma`, `update` e `adatta` in `js/aiuto.js`.

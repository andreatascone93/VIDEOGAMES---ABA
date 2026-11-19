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

### 1.4 Rendere osservabile lo stato interno, con più segnali ridondanti
La rabbia si vede in cinque modi contemporanei: barra a 5 livelli con il nome dello stato, segnali del corpo scritti ("denti stretti", "pugni stretti", "cuore che batte forte"), espressione del viso, rossore, tremore e battito del cuore udibile. Un bambino che legge e riconosce già la rabbia ha bisogno che il gioco la sottolinei, non che la spieghi.
*Dove:* `setRabbia` in `main.js`, `js/volto.js`.

### 1.5 L'SD è un livello preciso, ma si rinforza anche prima
La scelta viene proposta in zona arancione (SD). Una pausa scelta prima, in zona gialla, si registra come `anticipata` e si rinforza come indipendente: insegna ad agire all'inizio della catena, non solo al picco.
*Dove:* pulsante "Posa il tablet e fai una pausa" nel risultato della prima sconfitta.

### 1.6 Le scelte sono azioni nel mondo, non risposte a un quiz
Il giocatore porta il personaggio verso l'angolo calmo, la porta o il tablet. La risposta target è un comportamento motorio nel contesto simulato, più vicino a quello reale di un pulsante "A, B o C".

### 1.7 Rinforzo immediato, multiplo e legato alla funzione
Dopo la pausa arrivano subito: sollievo (la rabbia scende respiro dopo respiro, il viso si distende), potere (XP, Forza, il personaggio cresce, il sacco vola più lontano) e accesso ad attività ugualmente desiderabili (sacco da boxe, gara di kart vinta). I rinforzatori competono con la funzione del comportamento problema: sfogo fisico (sacco) e voglia di vincere (gara).

### 1.8 Estinzione per le scelte problema, senza spettacolo
Porta sbattuta e tablet lanciato non danno XP, premi o giochi: il personaggio resta arrabbiato e il tablet si spegne (conseguenza naturale), poi si riprova. Gli effetti di queste scelte devono restare più brevi e meno "divertenti" di quelli della scelta target, altrimenti diventano rinforzo sensoriale.

### 1.9 Gerarchia di aiuti e fading
Livello 1 modeling (il personaggio sceglie da solo), livello 2 aiuto completo (etichetta che pulsa, freccia, voce) o parziale (solo etichetta), livello 3 nessun aiuto con aiuto ritardato dopo N secondi, livello 4 tolleranza (più sconfitte, pausa più breve). Il gioco suggerisce quando cambiare livello in base al criterio di padronanza.

### 1.10 Ogni occasione è un dato
Si registra: tipo (`indipendente`, `con_aiuto`, `anticipata`, `problema`, `modello_osservato`), latenza, aiuto dato, livello di rabbia, partite giocate prima, premio scelto. Ogni partita al tablet registra esito programmato e risultato reale. Criterio standard: 80% di pause indipendenti per 3 sessioni consecutive.
*Dove:* `record` in `main.js`, `js/terapista.js`.

### 1.11 Contesto simile alla vita reale, per generalizzare
Cameretta, tablet, porta: gli stessi stimoli della situazione reale. Dopo la padronanza nel gioco va programmata la generalizzazione nel gioco reale al tablet (stessa barra della rabbia, stesso angolo calmo).

### 1.12 Etica e privacy
Impostazioni protette da PIN; dati solo sul dispositivo; nessun nome reale del bambino; uso dentro un programma supervisionato, con consenso dei genitori e assenso del bambino. Le sconfitte programmate sono un'esposizione voluta: le decide il terapista.

---

## 2. Principi di game design

### 2.1 Adatto all'età, non infantile
Per un ragazzo di 9 anni: aspetto da videogioco vero (3D, movimento libero, HUD con XP e Forza), niente "Bravissimo!" o stelline. La lode è nelle conseguenze naturali, non nelle parole.

### 2.2 Storia guidata con movimento libero
Il giocatore cammina dove vuole, ma la storia avanza solo con le interazioni chiave. Un obiettivo è sempre scritto in alto, e la didascalia (letta anche a voce) dice cosa succede.

### 2.3 La regia deve essere credibile
L'avversario resta vicino: perde di poco nelle partite facili e vince di poco in quelle difficili. Ogni tanto sbaglia un colpo anche quando "vuole" vincere. Mai sconfitte umilianti. Nel kart il rivale arriva primo con pochi metri di vantaggio; nel blaster Max chiude con 2–4 punti di margine.

### 2.4 I giochi premio sono rinforzanti ma rilassanti
Nessuna condizione di sconfitta, tempo breve (30 s), potenza che cresce con la Forza accumulata: la storia di rinforzo si vede.

### 2.5 Dare scelta
Il giocatore sceglie il gioco al tablet (corsa o sparatutto) e il gioco premio. La scelta è essa stessa rinforzante e aumenta la motivazione.

### 2.6 Sessioni brevi
Due o tre occasioni per sessione, 3–4 minuti ciascuna. Le partite durano circa 40–60 secondi (un giro di pista, una sfida a tempo).

### 2.7 Accessibilità
Narrazione vocale (italiano), didascalie grandi, pulsanti grandi per il tocco, layout pensato per tablet in orizzontale, comandi da tastiera per il computer.

### 2.8 Requisiti per integrare un gioco esterno
Licenza compatibile (MIT o CC0), funziona offline, ha comandi touch, permette di controllare l'esito (agganci all'intelligenza artificiale degli avversari), può segnalare inizio e fine alla pagina che lo contiene.

---

## 3. Principi tecnici

### 3.1 Un gioco, una cartella statica
Pagina web senza passaggi di compilazione per il gioco principale: `index.html` con import map e moduli in `js/`. Three.js è incluso nella cartella (`vendor/three`, r160). I moduli ES non si caricano da `file://`: va servito via http (link pubblicato, GitHub Pages o `python3 -m http.server`).

### 3.2 Moduli riutilizzabili
| Modulo | Cosa fa | Riusabile così com'è? |
| --- | --- | --- |
| `core.js` | configurazione, salvataggio, audio, didascalie, tween | sì |
| `assets.js` | caricamento e cache dei glTF, cloni con scheletro | sì |
| `personaggio.js` | personaggio animato: camminata, animazioni con dissolvenza, pose composte | sì |
| `volto.js` | espressioni del viso dipinte sulla texture | sì, per i personaggi Kenney |
| `terapista.js` | impostazioni, grafico, tabella, esportazione | sì, cambiando i campi |
| `tablet.js` | dispositivo nel gioco con partite vere e regia | sì, per scenari con schermi |
| `stanza.js`, `main.js` | scena e storia di questo scenario | no, sono specifici |

### 3.3 Pipeline del personaggio
Kenney Animated Characters (CC0): modello FBX più animazioni FBX separate, convertiti nel browser in un solo GLB con GLTFExporter (`strumenti/converti-personaggio.html`). Di ogni FBX si prende la clip più lunga, escludendo "Targeting Pose". Le skin sono PNG scambiabili al volo.

### 3.4 Pose composte
Si possono creare pose nuove unendo tracce di clip diverse: "seduto rilassato" = gambe da `racingIdle` più braccia da `idle`. Nella posa di guida il punto di seduta è circa 0,5 m sopra la radice: l'altezza del personaggio seduto si calcola da lì.

### 3.5 Espressioni sulla texture
Si copia l'atlante della skin in un canvas, si coprono i tratti originali con il colore della pelle, si applica il rossore con `multiply` e si disegnano i tratti nuovi. Si ridisegna solo quando cambia l'umore. Le coordinate del viso sono nel modulo.

### 3.6 Arredi e misure
Mobili KayKit (CC0) in scala 0,6. Si misurano con `Box3` (mai a occhio) per appoggiare oggetti, calcolare le sedute e definire gli ostacoli della camminata.

### 3.7 Giochi esterni dentro il gioco
Kart Royale (MIT) è compilato con Vite (`base: './'`) e modificato con parametri `?aba=1&esito=vinci|perdi&giri=N`. L'elastico degli avversari è in `AI.ts`. Il gioco comunica con `postMessage({ sorgente: 'kart-royale', tipo: 'pronto' | 'fine', posizione })`. Le modifiche stanno in `kart-royale/modifiche-aba.patch` e `aba.ts.txt`, da riapplicare se il progetto originale si aggiorna.

### 3.8 Prestazioni su tablet
Mentre gira un gioco del tablet, la stanza si ridisegna un fotogramma su tre. Pixel ratio massimo 1,75. Ombre 2048 nella stanza e 1024 nell'arena. Il secondo contesto WebGL si distrugge all'uscita.

### 3.9 Inquadrature
`camera.setViewOffset` sposta il personaggio nella striscia libera accanto al tablet senza cambiare prospettiva. Ogni momento della storia ha la sua inquadratura: stanza, scelta (fissa, tutte le opzioni in vista), viso, tablet, pausa, sacco.

### 3.10 Test automatici
Playwright con swiftshader. Gli elementi che pulsano non sono mai "stabili": si usa `dispatchEvent('pointerdown')`. In modalità `?debug` la camera si può fissare all'istante. La fine delle gare di kart si simula con `postMessage`. La regia del kart si verifica facendo avanzare la simulazione con `race.update(ctx, 1/60)`, perché il rendering software è troppo lento.

### 3.11 Pubblicazione
L'anteprima pubblicata blocca i download: per i dati serve il pulsante "Copia dati". Il salvataggio locale vale solo per quel dispositivo e quel browser.

### 3.12 Licenze e crediti
Grafica: Kenney e KayKit (CC0). Kart Royale: MIT. Three.js: MIT. I file di licenza restano accanto agli asset.

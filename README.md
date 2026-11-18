# Videogiochi ABA

Piccoli videogiochi da usare dentro un intervento di analisi del comportamento applicata (ABA), sotto la supervisione di un terapista. In ogni gioco un personaggio si trova in un contesto simulato, emette un comportamento desiderabile e incontra contingenze di rinforzo chiare e immediate.

## Giochi

| Gioco | Comportamento target | Stato |
| --- | --- | --- |
| [La cameretta di Francesco](giochi/cameretta/index.html) | Scegliere la pausa quando sale la rabbia durante il gioco al tablet (autoregolazione) | Prototipo 3D |
| [Il gioco della pausa](giochi/pausa/index.html) | Prima bozza 2D | Archiviata (troppo infantile per l'età target) |

## Come provarlo

Apri `giochi/cameretta/index.html` in un browser (meglio su tablet, in orizzontale). Il gioco usa Three.js (incluso nella cartella, licenza MIT), funziona senza connessione e salva i dati solo sul dispositivo.

L'area terapista si apre con l'ingranaggio in alto a destra. Il PIN iniziale è `1234`: cambialo subito.

## Architettura

Ogni gioco dichiara le sue contingenze nel modello A-B-C (operazione motivazionale, stimolo discriminativo, risposta target, risposta problema, conseguenze, livello di aiuto, criterio di padronanza). Un motore comune le applica, registra i dati di ogni occasione e li mostra al terapista. Dettagli in [docs/architettura.md](docs/architettura.md).

## Avvertenze

Questi giochi sono strumenti di supporto, non trattamenti autonomi. Vanno usati dentro un programma progettato e supervisionato da un analista del comportamento, con consenso dei genitori e assenso del bambino.

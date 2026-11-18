# Videogiochi ABA

Piccoli videogiochi da usare dentro un intervento di analisi del comportamento applicata (ABA), sotto la supervisione di un terapista. In ogni gioco un personaggio si trova in un contesto simulato, emette un comportamento desiderabile e incontra contingenze di rinforzo chiare e immediate.

## Giochi

| Gioco | Comportamento target | Stato |
| --- | --- | --- |
| [Pico e la pausa](giochi/pausa/index.html) | Prendersi una pausa quando sale la rabbia (autoregolazione) | Prototipo |

## Come provarlo

Apri `giochi/pausa/index.html` in un browser (meglio su tablet, in orizzontale). Funziona senza connessione e salva i dati solo sul dispositivo.

L'area terapista si apre con l'ingranaggio in alto a destra. Il PIN iniziale è `1234`: cambialo subito.

## Architettura

Ogni gioco dichiara le sue contingenze nel modello A-B-C (operazione motivazionale, stimolo discriminativo, risposta target, risposta problema, conseguenze, livello di aiuto, criterio di padronanza). Un motore comune le applica, registra i dati di ogni occasione e li mostra al terapista. Dettagli in [docs/architettura.md](docs/architettura.md).

## Avvertenze

Questi giochi sono strumenti di supporto, non trattamenti autonomi. Vanno usati dentro un programma progettato e supervisionato da un analista del comportamento, con consenso dei genitori e assenso del bambino.

# Videogiochi ABA

Piccoli videogiochi da usare dentro un intervento di analisi del comportamento applicata (ABA), sotto la supervisione di un terapista. In ogni gioco un personaggio si trova in un contesto simulato, emette un comportamento desiderabile e incontra contingenze di rinforzo chiare e immediate.

## Giochi

| Gioco | Comportamento target | Stato |
| --- | --- | --- |
| [La cameretta di Francesco](giochi/cameretta/index.html) | Posare il tablet quando sale la rabbia e ritrovare la calma con un'altra attività (autoregolazione) | Prototipo 3D giocabile: casa da girare liberamente (cameretta e salone uniti da una porta vera), partite vere al tablet con la rabbia in tempo reale, attività che calmano (musica, disegno, sacco da boxe, mamma, costruzioni), genitori, giochi premio |
| [Il gioco della pausa](giochi/pausa/index.html) | Prima bozza 2D | Archiviata (troppo infantile per l'età target) |

## Come provarlo

Il gioco va aperto da un indirizzo web, non con doppio clic sul file (i moduli JavaScript non si caricano da `file://`). Tre modi:

- il link pubblicato dell'anteprima;
- GitHub Pages su questo repository (Impostazioni → Pages → ramo `main`), poi `.../giochi/cameretta/`;
- in locale: `cd giochi/cameretta && python3 -m http.server 8000`, poi apri `http://localhost:8000`.

Meglio su tablet, in orizzontale. Tutto il necessario è nella cartella (Three.js, modelli, Kart Royale): una volta caricato non serve connessione. I dati restano solo sul dispositivo.

L'area terapista si apre con l'ingranaggio in alto a destra. Il PIN iniziale è `1234`: cambialo subito.

## Architettura

Ogni gioco dichiara le sue contingenze nel modello A-B-C (operazione motivazionale, stimolo discriminativo, risposta target, risposta problema, conseguenze, livello di aiuto, criterio di padronanza). Un motore comune le applica, registra i dati di ogni occasione e li mostra al terapista. Dettagli in [docs/architettura.md](docs/architettura.md).

## Principi per i prossimi giochi

[docs/principi.md](docs/principi.md) raccoglie le regole cliniche, di game design e tecniche emerse dal primo gioco. Si aggiorna man mano che il codice cresce.

## Crediti e licenze

- Personaggi, kart, blaster, decorazioni: [Kenney](https://kenney.nl) (CC0).
- Mobili: [KayKit Furniture Bits](https://kaylousberg.itch.io) (CC0) e Kenney Furniture Kit (CC0), tramite [series-ai/jam-ready-assets](https://github.com/series-ai/jam-ready-assets).
- [Kart Royale](https://github.com/ryancampbell/kart-royale) di Ryan Campbell (MIT), modificato per la modalità ABA: vedi `giochi/cameretta/kart-royale/LICENSE` e `modifiche-aba.patch`.
- [Three.js](https://threejs.org) r160 (MIT).

## Avvertenze

Questi giochi sono strumenti di supporto, non trattamenti autonomi. Vanno usati dentro un programma progettato e supervisionato da un analista del comportamento, con consenso dei genitori e assenso del bambino.

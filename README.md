# Videogiochi ABA

Piccoli videogiochi da usare dentro un intervento di analisi del comportamento applicata (ABA), sotto la supervisione di un terapista. In ogni gioco un personaggio si trova in un contesto simulato, emette un comportamento desiderabile e incontra contingenze di rinforzo chiare e immediate.

## Giochi

| Gioco | Comportamento target | Stato |
| --- | --- | --- |
| [La cameretta di Francesco](giochi/cameretta/index.html) · Episodio 1, "Un pomeriggio a casa" | Posare il tablet quando sale la rabbia e ritrovare la calma con un'altra attività (autoregolazione); chiedere aiuto con gentilezza e precisione quando si è bloccati (comunicazione funzionale) | Prototipo 3D giocabile: episodio con narratrice (voce registrata) e musica che segue la rabbia, casa da girare liberamente (cameretta e salone uniti da una porta vera), partite vere al tablet con la rabbia in tempo reale, attività che calmano (musica, disegno, sacco da boxe, mamma, costruzioni), la scatola degli enigmi del nonno con quattro serrature a difficoltà crescente e le richieste di aiuto a mamma, papà e Giulia, genitori, giochi premio |
| [Il gioco della pausa](giochi/pausa/index.html) | Prima bozza 2D | Archiviata (troppo infantile per l'età target) |

## Come provarlo

Il gioco va aperto da un indirizzo web, non con doppio clic sul file (i moduli JavaScript non si caricano da `file://`). Tre modi:

- il link pubblicato dell'anteprima;
- GitHub Pages su questo repository (Impostazioni → Pages → ramo `main`), poi `.../giochi/cameretta/`;
- in locale: `cd giochi/cameretta && python3 -m http.server 8000`, poi apri `http://localhost:8000`.

Meglio su tablet, in orizzontale. Tutto il necessario è nella cartella (Three.js, modelli, Kart Royale): una volta caricato non serve connessione. I dati restano solo sul dispositivo.

L'area terapista si apre con l'ingranaggio in alto a destra. Il PIN iniziale è `1234`: cambialo subito.

### La voce

La narratrice e i personaggi parlano con frasi registrate in anticipo (`giochi/cameretta/assets/voce`), prodotte in locale con una sintesi vocale. Se cambi un testo in `js/testi.js`, quella frase resta senza registrazione e la legge la voce del dispositivo finché non rilanci:

```
pip install kokoro-onnx soundfile numpy
python3 giochi/cameretta/strumenti/genera-voce.py --modelli <cartella con kokoro-v1.0.onnx e voices-v1.0.bin>
```

Lo script registra solo le frasi nuove e toglie quelle non più usate. Servono anche `node` e `ffmpeg`. Le voci dei personaggi si regolano nella tabella `VOCI` in cima allo script. Nell'area terapista si può scegliere tra tutte le voci, solo la narratrice, o nessuna, e spegnere la musica.

## Architettura

Ogni gioco dichiara le sue contingenze nel modello A-B-C (operazione motivazionale, stimolo discriminativo, risposta target, risposta problema, conseguenze, livello di aiuto, criterio di padronanza). Un motore comune le applica, registra i dati di ogni occasione e li mostra al terapista. Dettagli in [docs/architettura.md](docs/architettura.md).

## Principi per i prossimi giochi

[docs/principi.md](docs/principi.md) raccoglie le regole cliniche, di game design e tecniche emerse dal primo gioco. Si aggiorna man mano che il codice cresce.

## Crediti e licenze

- Personaggi, kart, blaster, decorazioni: [Kenney](https://kenney.nl) (CC0).
- Mobili: [KayKit Furniture Bits](https://kaylousberg.itch.io) (CC0) e Kenney Furniture Kit (CC0), tramite [series-ai/jam-ready-assets](https://github.com/series-ai/jam-ready-assets).
- [Kart Royale](https://github.com/ryancampbell/kart-royale) di Ryan Campbell (MIT), modificato per la modalità ABA: vedi `giochi/cameretta/kart-royale/LICENSE` e `modifiche-aba.patch`.
- [Three.js](https://threejs.org) r160 (MIT).
- Voce: registrata con [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) (Apache-2.0) tramite [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx) (MIT). Nel repository ci sono solo i file audio prodotti, non il modello.
- Musica: scritta per il gioco e suonata dal browser nota per nota, senza file audio.

## Avvertenze

Questi giochi sono strumenti di supporto, non trattamenti autonomi. Vanno usati dentro un programma progettato e supervisionato da un analista del comportamento, con consenso dei genitori e assenso del bambino.

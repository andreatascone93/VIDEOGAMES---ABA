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

Gioco 3D in Three.js. Francesco si muove nella sua cameretta (tocca il pavimento per camminare, tocca un oggetto per interagire). Storia guidata:

1. Francesco torna da scuola; il giocatore lo porta al tablet sulla scrivania.
2. Francesco gioca a un gioco di kart sul tablet: prima vince (MO), poi perde e la barra della rabbia sale; i segnali del corpo compaiono scritti.
3. In zona arancione (SD) il giocatore decide cosa fa Francesco: angolo calmo (pausa, risposta target), porta (sbatterla) o tablet (continuare fino a lanciarlo).
4. Pausa: respirazione guidata, rabbia a zero, +100 XP, Forza +1 (Francesco cresce, mantello da Forza 3), sblocco di karate e pista di macchinine, gioco a scelta.
5. Porta o tablet: Francesco resta arrabbiato, niente XP né sblocchi (estinzione), poi si riprova.

Una pausa scelta già in zona gialla è registrata come `anticipata` e rinforzata. Livelli: 1 modeling (Francesco sceglie da solo la pausa), 2 aiuto completo o parziale, 3 senza aiuto con aiuto ritardato, 4 meno vittorie iniziali e pausa più breve.

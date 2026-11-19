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

Gioco 3D in Three.js (moduli ES, nessuna compilazione). Francesco, personaggio animato Kenney, si muove in una cameretta arredata con mobili KayKit: tocca il pavimento per camminare, tocca un oggetto o la sua etichetta per interagire. Storia guidata:

1. Francesco entra dalla porta, il giocatore lo porta al tablet sulla scrivania; Francesco lo prende e si siede sul letto.
2. Sul tablet il giocatore sceglie un gioco vero: **Kart Royale** (corsa, un giro contro sette piloti) o **Blaster Arena** (sparatutto cartoon in prima persona, freccette di gommapiuma su bersagli, sfida a punti contro Max). La regia è nascosta: le prime partite si vincono (impostazione `vittorie`), poi l'avversario diventa più forte e si perde (`sconfitte`). Ogni sconfitta alza la rabbia (gialla, poi arancione) e cambia il viso di Francesco.
3. In zona gialla il risultato offre "Posa il tablet e fai una pausa" (pausa `anticipata`). In zona arancione (SD) il tablet si chiude, l'inquadratura mostra il viso e i segnali del corpo, poi il giocatore sceglie nel mondo: angolo calmo (pausa), porta (sbatterla) o tablet (continuare a giocare).
4. Pausa: Francesco si siede in poltrona, respirazione guidata, la rabbia scende respiro dopo respiro; poi +100 XP, Forza +1 e due giochi premio nella stanza: **sacco da boxe** (pugni e calci, la potenza cresce con la Forza) e **gara di kart** vinta.
5. Porta o tablet: estinzione. Francesco resta arrabbiato, il tablet lanciato si spegne, niente XP né premi; poi si riprova.

Livelli: 1 modeling (Francesco sceglie da solo la pausa), 2 aiuto completo (etichetta che pulsa, freccia, voce) o parziale, 3 senza aiuto con aiuto ritardato, 4 una sola vittoria, una sconfitta in più, un respiro in meno.

Dati: ogni occasione di scelta (tipo, latenza, aiuto, rabbia, partite giocate prima, premio scelto) e ogni partita al tablet (gioco, esito programmato, risultato). Esportazione CSV o "Copia dati".

### File

| File | Ruolo |
| --- | --- |
| `index.html` | interfaccia (HUD, tablet, area terapista) e import map |
| `js/main.js` | storia, contingenze, camera, interazioni |
| `js/core.js` | configurazione, salvataggio, audio, didascalie, tween |
| `js/assets.js` | caricamento dei modelli glTF |
| `js/personaggio.js` | personaggio animato e pose |
| `js/volto.js` | espressioni del viso e rossore |
| `js/stanza.js` | cameretta, luci, mobili, premi |
| `js/tablet.js` | menu dei giochi, partite con regia, risultati |
| `js/giochi/blaster.js` | Blaster Arena |
| `js/terapista.js` | area terapista |
| `kart-royale/` | Kart Royale compilato con la modalità ABA |
| `strumenti/` | convertitore del personaggio e visualizzatore di modelli |

I principi riutilizzabili sono in [principi.md](principi.md).

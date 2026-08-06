# R-ESC-PELNY-EKRAN-Q1 — Escape zamyka panel przed pełnym ekranem

**Status:** 🟢 WDROŻONE (kod) · **A** (2026-08-06)  
**Cytat Macieja:** „R-ESC-PELNY-EKRAN-Q1 a"

## Decyzja

**A** — wspólny stos Escape (jak drzewko technologii): Escape najpierw zamyka wierzchni panel/zakładkę; pełny ekran zostaje.

## Wdrożenie

Moduł: `gra/src/ui/escapeOverlayStack.ts`

| API | Opis |
|-----|------|
| `pushOverlay(id, onClose)` | Nakładka na wierzch stosu |
| `popOverlay(id?)` | Zdejmij po id lub wierzchnią |
| `top()` | Wierzchni wpis |
| `lockEscapeWhileStacked()` | Keyboard Lock Escape gdy stos ≠ ∅ |

Gdy stos niepusty: `navigator.keyboard.lock(['Escape'])` (jak tech tree, R-TECH-ESC-FS). Globalny listener (capture) woła `onClose` wierzchniej nakładki.

### Panele wpięte (mapa)

| id | Plik |
|----|------|
| `tech-tree` | `gra/src/ui/techTreeView.ts` |
| `city-panel` | `gra/src/ui/cityUxFrame.ts` |
| `wiki-hub` | `gra/src/ui/wikiHubHud.ts` (Civpedia) |
| `diplo-list` | `gra/src/ui/diploListHud.ts` |
| `diplo-audience` | `gra/src/ui/diplomacyAudience.ts` |
| `build-mode` | `gra/src/main.ts` |
| `science-picker` | `gra/src/ui/sciencePicker.ts` |
| `army-list` | `gra/src/ui/armyListHud.ts` |
| `save-load-dialog` | `gra/src/ui/saveLoadDialog.ts` |
| `science-hub` | `gra/src/ui/scienceHubHud.ts` |
| `city-list` | `gra/src/ui/cityListHud.ts` |
| `pre-battle` | `gra/src/ui/preBattle.ts` |
| `siege-map` | `gra/src/ui/siegeMapPanel.ts` |
| `post-battle-summary` | `gra/src/ui/postBattleSummary.ts` |

| `army-merge` | `gra/src/ui/armyMergePanel.ts` |
| `army-merge-pick` | `gra/src/ui/armyMergePickPanel.ts` |
| `army-split` | `gra/src/ui/armySplitPanel.ts` |
| `army-stack-prompt` | `gra/src/ui/armyStackPrompt.ts` |

`main.ts` — Escape lokalny pomija panele ze stosu (`defaultPrevented`); menu pauzy bez zmian.

## Test

`node gra/tools/escape-overlay-stack-test.cjs` — push/pop + `_dispatchEscapeForTest` bez DOM.

## Stan przed

- Drzewko technologii: lokalny Keyboard Lock + Escape (`R-TECH-ESC-FS`).
- Pozostałe panele: w pełnym ekranie pierwszy Escape wychodził z FS przeglądarki.

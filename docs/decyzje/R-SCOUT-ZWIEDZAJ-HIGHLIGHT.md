# R-SCOUT-ZWIEDZAJ-HIGHLIGHT — Zwiedzaj pokazuje stan WŁ jak Czuwaj/Fortyfikuj

**Status:** WDROŻONE (kod) — czeka deploy  
**Data:** 2026-08-04  
**Powiązane:** [`R-UNIT-MODE-TOGGLE-UI.md`](R-UNIT-MODE-TOGGLE-UI.md) · [`R-SCOUT-EXIT-AUTO.md`](R-SCOUT-EXIT-AUTO.md)

## Problem

Maciej: fortyfikacja i uśpienie (Czuwaj) zaznaczają się złotą ramką WŁ; **Zwiedzaj nie** — a miało działać tak samo (`R-UNIT-MODE-TOGGLE-UI`).

Przyczyna: `R-SCOUT-EXIT-AUTO` wywoływało `clearScoutAutoExplore` przy **zaznaczeniu** zwiadowcy. Po włączeniu Zwiedzaj jednostka jest odznaczana (jak Czuwaj); ponowne kliknięcie żeby zobaczyć panel **kasowało** `autoExplore`, więc `active: exploring` nigdy nie było `true` w pasku akcji.

## Rozwiązanie

| Akcja | Zachowanie |
|-------|------------|
| Zaznaczenie zwiadowcy z `autoExplore` | **NIE** czyści — widać złoty przycisk „Wyłącz zwiedzanie” |
| Toggle przycisku Zwiedzaj | WŁ / WYŁ jak dotychczas |
| `planMarchTo` / `beginMoveSelectedUnitTo` | `clearScoutAutoExplore` — ręczny rozkaz wychodzi z auto |

## Pliki

- `gra/src/main.ts` — `selectPlayerUnit` bez clear; clear w marszu i ruchu ręcznym
- korekta docs: `R-SCOUT-EXIT-AUTO.md`, `P-SCOUT-EXPLORE.md`

# P-SCOUT-EXPLORE — przycisk Zwiedzaj (zwiadowca)

**Status:** WDROŻONE (kod)  
**Data decyzji:** 2026-08-03

## Decyzje Macieja

| ID | Odpowiedź | Treść |
|----|-----------|-------|
| **P-SCOUT-EXPLORE-Q1** | **A** | Przycisk „Zwiedzaj" / „Wyłącz zwiedzanie" na zwiadowcy; domyślnie **WYŁĄCZONE** (`autoExplore` false/undefined). |
| **P-SCOUT-EXPLORE-Q2** | **A [ZAŁOŻENIE]** | Po włączeniu od razu zużywa pozostały ruch w tej turze + na koniec kolejnych tur kontynuuje, dopóki flaga ON. |

## Implementacja

- Pole `autoExplore?: boolean` na `RuntimeUnit` (`gra/src/units/setup.ts`)
- `runScoutsAutoExplore` — tylko `autoExplore === true`, pomija `sentry === true`
- `pickScoutExploreTarget` — priorytet 1: widoczna chatka (`wioska.istnieje`, `wlasciciel === null`); priorytet 2: scoring mgły
- HUD: akcja `scout-explore` w `buildArmyStackHudStateInner` / `handleSelectedUnitHudAction`
- Testy: `gra/tools/scout-auto-explore-test.cjs`

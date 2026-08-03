# P-SCOUT-EXPLORE — przycisk Zwiedzaj (zwiadowca)

**Status:** ZDEPLOYOWANE `5f529a24` (FALA 203)  
**Data decyzji:** 2026-08-03

## Decyzje Macieja

| ID | Odpowiedź | Treść |
|----|-----------|-------|
| **P-SCOUT-EXPLORE-Q1** | **A** | Przycisk „Zwiedzaj" / „Wyłącz zwiedzanie" na zwiadowcy; domyślnie **WYŁĄCZONE** (`autoExplore` false/undefined). |
| **P-SCOUT-EXPLORE-Q2** | **B** | Przycisk „Zwiedzaj" ustawia tylko flagę `autoExplore`; ruch na koniec tury (`runScoutsAutoExplore`), **bez** natychmiastowego ruchu po włączeniu. |

## Implementacja

- Pole `autoExplore?: boolean` na `RuntimeUnit` (`gra/src/units/setup.ts`)
- `runScoutsAutoExplore` — tylko `autoExplore === true`, pomija `sentry === true`
- `pickScoutExploreTarget` — priorytet 1: widoczna chatka (`wioska.istnieje`, `wlasciciel === null`); priorytet 2: scoring mgły
- HUD: akcja `scout-explore` w `buildArmyStackHudStateInner` / `handleSelectedUnitHudAction`
- Testy: `gra/tools/scout-auto-explore-test.cjs`

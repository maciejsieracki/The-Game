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

## UX 2026-08-04 (doprecyzowanie P-SCOUT-EXPLORE-Q2=B)

Włączenie **Zwiedzaj**: kasuje zaplanowany marsz i ścieżkę, odznacza jednostkę i przechodzi do następnej w cyklu Spacji (jak **Czuwaj**); zwiadowca z `autoExplore` **nie wraca** w cykl Spacji. Punkty ruchu (`ruchLeft`) **nie** są zerowane — ruch nadal tylko na koniec tury (`runScoutsAutoExplore`). Wyłączenie zwiedzania: tylko flaga + hint, bez wymuszonego select.

## UX 2026-08-04 — wyjście z auto (R-SCOUT-EXIT-AUTO)

Maciej: klik na zwiadowcę w trybie zwiedzania lub rozkaz marszu na heks **automatycznie wyłącza** `autoExplore` — bez ręcznego „Wyłącz zwiedzanie".

| Akcja | Zachowanie |
|-------|------------|
| **Klik / zaznaczenie** zwiadowcy z `autoExplore === true` | `clearScoutAutoExplore` → zaznaczenie do ruchu ręcznego; hint: „Wyłączono zwiedzanie — ruch ręczny” |
| **`planMarchTo`** na zaznaczonym zwiadowcy z auto | najpierw `clearScoutAutoExplore`, potem marsz jak dotąd |
| Przycisk HUD **Zwiedzaj** / **Wyłącz zwiedzanie** | bez zmian — nadal włącza (clear path, deselect, next unit) lub wyłącza flagę |

Helper: `clearScoutAutoExplore(u)` w `gra/src/game/scout-auto-explore.ts`. `runScoutsAutoExplore` bez zmian logiki priorytetów — jednostka z `autoExplore === false` nie trafia do puli.

# AutoBot dispatch — kontynuacja na bazie bieżącego main

TEMAT: `R-ARMY-COMMANDER-UNIT-MARKERS-20261028`
RUNDA OPERATORA: 3/5 — continuation po Final Control R2
DATA: 2026-10-28
BAZA: `origin/main` = `85f8c5f0e0aa6ff46aa8b85a03d0bc0c71d86268`
WORKTREE: `/tmp/the-game-commander-markers-20261028`
BRANCH: `codex/R-ARMY-COMMANDER-UNIT-MARKERS-20261028-integration`

## Cel i zatwierdzone zachowania

Przenieść z archiwalnego kandydata wyłącznie zatwierdzony zakres: odrębna gwiazda Wodza/Generała niezależna od gwiazdek XP; gwiazda na reprezentancie stosu także wtedy, gdy dowódca jest innym członkiem; usunięcie gwiazdy po utracie dowódcy; emblemat cywilizacji o boku 4× większym. Test musi uruchamiać produkcyjne funkcje agregacji i odznaki.

## Recon main

Na bazie `85f8c5f0e0aa6ff46aa8b85a03d0bc0c71d86268` selektor Wodza Kamienia `stoneGeneralUnitId(hasWheel)` już jest obecny w `gra/src/game/generals.ts` i używany w `gra/src/main.ts`. Nie portować tego hunku. Bieżący main nie zawiera `gra/tools/commander-star-emblem-test.cjs`, agregowanej flagi dowódcy, renderowania odznaki ani rozmiaru emblematu 4×.

## Allowlista

- `gra/src/game/armyMerge.ts`
- `gra/src/render/unitStatPlate.ts`
- `gra/src/render/unitVeteranBadges.ts`
- `gra/src/render/units.ts`
- `gra/tools/commander-star-emblem-test.cjs`
- raporty tej rundy w katalogu runu

`gra/src/game/generals.ts` i `gra/src/main.ts` tylko odczyt do potwierdzenia, bez zmian. Zakaz hunks rekrutacji, battle, AI, pozostałych `main.ts`, git add/commit/push/checkout/reset/stash, integracji i deployu.

## Źródło portu

Źródło zatwierdzonych hunks: `/workspace/all-topics-candidate`, archiwalny run R2 z Evaluator PASS i Final Control PASS dla zachowania/testu. Wcześniejszy brak widoku Chromium jest znanym ograniczeniem do uzupełnienia w tej rundzie, o ile środowisko pozwoli.

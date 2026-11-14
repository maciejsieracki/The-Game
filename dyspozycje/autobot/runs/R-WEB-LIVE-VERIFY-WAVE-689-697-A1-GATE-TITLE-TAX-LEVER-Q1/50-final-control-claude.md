STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-WAVE-689-697-A1-GATE-TITLE-TAX-LEVER-Q1
GOAL: rozstrzygnąć (a) artefakt haka vs (b) realny defekt dla title przycisku „Zakończ turę” w blokadzie; dźwignia podatku realną akcją UI (2 ziarna); bez zmian gra/src.
ZMIANY/COMMIT: kandydat 29cf4490f (potomek bazy 735fde524 — `git merge-base --is-ancestor` = tak). Diff vs baza: wyłącznie gra/tools/live-verify-wave-689-697-a1-title-tax.cjs + runs/<ID>/** (18 plików, 0 zmian w gra/src i gra/data). Allowlista zgodna. Ten raport: 50-final-control-claude.md (osobny commit, tylko ten plik).
TESTY (surowe):
- git diff --check 735fde524 29cf4490f: brak wyjścia (czysto).
- node --check narzędzia a1-title-tax.cjs: SYNTAX_OK. `grantPlayerGold` występuje 1x, wyłącznie w komentarzu (zero wywołań).
- tsc --noEmit / testy / 5 bramek: NIE_URUCHOMIONO — kandydat nie zmienia gra/src ani gra/data (tylko .cjs + docs), więc wynik identyczny z bazą; w worktree brak gra/node_modules. To nie jest regresja.
- Dowód z JSON r1 (seed 11 i 13): title_noBlock = "" (canEnd true); po realnej akcji UI (suwak/chip) title = "Nie można zakończyć tury: Skarbiec (złoto): po turze zabraknie 2. Pomogą: podatek złota: +5 złota/turę; …", klasa is-disabled, canEnd false; po dźwigni podatku canEnd true, title "", klik daje tura+1 (lever_click_turn). HUD „Skarbiec 10 +4 / −8”.
- Weryfikacja statyczna defektu (samodzielnie, gra/src/main.ts na origin/main e7e744a): disbandPlayerUnit (main.ts:7674–7735) nie zawiera wywołania markCityStateDirty/empireEconDirty między units.splice a refreshD1bHud(); jedyne wywołania to disbandSelectedOrPickedUnits (26524/26536) — też bez dirty. Tooltip czyta nnsGateForPlayer (39442) → refreshLiveEmpireRates, który wraca wcześnie przy !empireEconDirty (22714), więc prognoza (a z nią tooltip i bramka) po realnym „Rozwiąż” może być nieświeża. Hook disbandPlayerUnits (31555) ma dirty — stąd w v4 działał.
ROZSTRZYGNIĘCIE ZARZUTÓW:
1. Zarzut 1 (artefakt haka — brak dowodu): ODDAL. Obrona zmieniła werdykt na (b) i wskazała plik:linia; potwierdzam statycznie. Realny klik „Rozwiąż” w UI: NIE_ZMIERZONO (brak hooka selekcji jednostki w __nnsMeasureDebug). Dispatch zakazuje naprawy w tym temacie (zakaz zmian gra/src) i wymaga opisu poprawki — jest. Naprawa = osobny temat R-WEB-* (UWAGI). Rekrutacja przez panel nie jest defektem (woła dirty + updateHud).
2. Zarzut 2 (brak zrzutu tooltipa): ODDAL. Kryterium dopuszcza getAttribute('title'); natywny title nie renderuje się w headless.
3. Zarzut 3 (seed 12, słaba niezależność ziaren, +5 vs +4): ODDAL. Wymóg 2 ziaren spełniony (11, 13); +4 to netto przy wybranym splicie, +5 w tooltipie to podgląd alternatywnego podziału — nie defekt. Crash seed 12: NIE_ZMIERZONO (brak środowiska do diagnozy).
Brak pozycji NAPRAW, więc nie FAIL.
BLOKADY: realny klik „Rozwiąż” (NIE_ZMIERZONO, brak hooka); widoczność tooltipa na zrzucie; przyczyna crashu seed 12.
RUNDY: Operator 1/5, Obrona 1/1, Final Control 1.
UWAGI-DLA-ORKIESTRATORA:
- Zarejestruj temat naprawczy R-WEB-DISBAND-UNIT-MARK-DIRTY-Q1: w disbandPlayerUnit (gra/src/main.ts ~7733, przed refreshD1bHud()) dodać markCityStateDirty(); test regresji: po disbandPlayerUnit(id) przy deficycie nnsEndTurnTooltipText()/canEnd odzwierciedla nową prognozę. Sprawdzić inne miejsca zmiany `units` poza hookami.
- Opcjonalnie dodać hook selekcji jednostki do __nnsMeasureDebug, by zmierzyć realny klik „Rozwiąż”.
NASTĘPNY KROK: integracja 29cf4490f (+ commit tego raportu) jako dokumentacja/narzędzie; bez deployu (brak zmian gry).
DEPLOY/PUSH: NIE WYKONANO

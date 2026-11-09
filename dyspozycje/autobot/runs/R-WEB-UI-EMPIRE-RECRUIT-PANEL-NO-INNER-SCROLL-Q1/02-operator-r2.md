# R-WEB-UI-EMPIRE-RECRUIT-PANEL-NO-INNER-SCROLL-Q1 — Operator, runda 2/5 (obrona)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-EMPIRE-RECRUIT-PANEL-NO-INNER-SCROLL-Q1
GOAL: Lista jednostek do zrekrutowania w panelu rekrutacji (sekcje miast „Rzym”, „kolejka: N”, „Rekruci: dostępne …”) bez wewnętrznego suwaka; przewija się cały panel, „Rekrutuj wszystkie” widoczne, liczniki bez regresji.
BAZA: 31f517e01 (Operator r1, na ab1188446 = origin/main)

## Odpowiedzi na zarzuty

1. KRYTYCZNY, zły panel — PRZYJMUJĘ. Lista „Rekruci: dostępne …” z sekcjami miast to `renderPurchasableUnits` w `gra/src/ui/cityPanel.ts`, montowane przez `mountCityRecruitmentCardsForArmy` (cityPanel.ts ~8402–8410), wywoływane z panelu imperium. Poprawka: `renderPurchasableUnits` dostaje opcję `noInnerScroll`; w ścieżce `mountCityRecruitmentCardsForArmy` lista to `div.unit-recruit-list-full` bez `max-height` i bez `overflow-y`, zamiast `createScrollList` z `visibleRows: LIST_SCROLL_VISIBLE_CATALOG`. Panel pojedynczego miasta (bez `noInnerScroll`) nie zmieniony. Commit: patrz sekcja ZMIANY.
2. Operator błędnie rozstrzygnął pytanie z dispatchu — PRZYJMUJĘ. Lista miasta jest tą samą listą (ten sam `renderPurchasableUnits`), więc ujednolicona w `cityPanel.ts` (allowlista ją przewiduje).
3. Test nie obejmował ścieżki miasta — PRZYJMUJĘ. Dodano `gra/tools/empire-army-city-recruit-no-inner-scroll-test.cjs` (Chromium, prawdziwy `cityPanel.ts` przez esbuild, ścieżka `mountCityRecruitmentCardsForArmy`, 900 px i 360 px). Dowód: PASS 16/0; mutant `CITY_RECRUIT_UI_MUTANT=inner-scroll` (przywraca `visibleRows`) → FAIL 8/8 (overflow-y `auto`, max-height 244.4px, scrollH 302 vs clientH 244).
   Zakres testu jest zawężony jawnie: panel pojedynczego miasta NIE jest tu testowany (usunięto nieprawdziwą deklarację z nagłówka testu).
4. Duplikat „Rekrutuj wszystkie” w `empireRecruitPanel.ts` — ODRZUCAM w części dotyczącej duplikatu. Dowód: `git show 31f517e01:gra/src/ui/empireRecruitPanel.ts` i `git show ab1188446:...` — w main były już DWA przyciski `erp-go-all` (góra po opisie `erp-sub` i dół po `erp-list`). Po r1 jest ich nadal dwa (jeden w `.erp-stick`, jeden pod listą). Liczba nie wzrosła. Dispatch wymaga „przyciski Rekrutuj wszystkie (góra/dół) nadal widoczne (opcjonalnie sticky)”, więc dwa przyciski są zgodne ze specyfikacją.
   Zmiany w `empireRecruitPanel.ts` (usunięcie `overflow-y:auto` z `.erp-list`, przewijanie tylko korzenia panelu, sticky `.erp-stick`) ZOSTAJĄ: plik jest na allowliście dispatchu, a `.erp-list` w tym panelu był dokładnie wewnętrznym suwakiem, o który chodzi w zgłoszeniu („Rekrutacja — cała cywilizacja”). Uzasadnienie zachowania: wymóg „bez wewnętrznego suwaka” dotyczy obu list rekrutacji w panelach armii/imperium.
5. Brak uruchomionych testów (NIE_ZMIERZONO w r1) — PRZYJMUJĘ. W r2 testy uruchomione (patrz TESTY). Brakujące `gra/node_modules` uzupełniono symlinkiem na `/tmp/claude-0/nm/node_modules` (symlink nie jest w commicie).

## ZMIANY/COMMIT
- `gra/src/ui/cityPanel.ts`: opcja `noInnerScroll` w `renderPurchasableUnits`; `mountCityRecruitmentCardsForArmy` przekazuje `noInnerScroll: true` zamiast `visibleRows`. Komentarz z ID tematu.
- `gra/tools/empire-army-city-recruit-no-inner-scroll-test.cjs`: nowy test (patrz zarzut 3).
- `dyspozycje/autobot/runs/R-WEB-UI-EMPIRE-RECRUIT-PANEL-NO-INNER-SCROLL-Q1/02-operator-r2.md`: ten raport.
- `gra/src/ui/empireRecruitPanel.ts`: bez zmian w r2 (zachowany stan z 31f517e01).
- Commit: SHA w sekcji COMMIT poniżej (wypełnione po `git commit`).

## TESTY (r2, worktree wf_add5f35e-01c-3, Chromium /opt/pw-browsers/chromium, node_modules = symlink)
- empire-army-city-recruit-no-inner-scroll-test: 16 PASS / 0 FAIL (900 px i 360 px; 9 pozycji w liście, scrollH 301 == clientH 301).
- mutant inner-scroll (empire-army-city-recruit-no-inner-scroll-test): 8 PASS / 8 FAIL (oczekiwane FAIL).
- empire-recruit-panel-no-inner-scroll-test: 17 passed / 0 failed.
- empire-recruit-panel-real-render-test: 26 passed / 0 failed.
- empire-recruit-all-test: 31 passed / 0 failed (wymaga PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium; domyślna ścieżka /usr/bin/chromium nie istnieje).
- empire-recruit-plan-test: 17 passed / 0 failed.
- empire-mass-recruitment-test: 30 passed / 0 failed.
- army-panel-recruit-remove-test: 21 passed / 0 failed.
- empire-recruit-live-test: NIE_ZMIERZONO (wymaga pełnego `vite build` gry; poza zakresem tej rundy).
- Zrzut ekranu: NIE_ZMIERZONO.
- `git diff --check`: sprawdzone przed commitem (patrz COMMIT).

## BLOKADY
Brak blokad kodu. Poza zakresem: `empire-recruit-live-test` i zrzut ekranu (NIE_ZMIERZONO).

## RUNDY
2/5

## NASTĘPNY KROK
Evaluator (Sonnet) na commicie z sekcji COMMIT, potem Final Control po PASS.

DEPLOY/PUSH: NIE WYKONANO

# R-WEB-POLISH-UI-ROUTES-AUDIT-Q2 — Operator LunaHigh, faza 2

STATUS: PASS-WITH-NOTES — cztery potwierdzone usterki poprawione w allowlistowanych rendererach; oczekuje na niezależną ewaluację.
DOMAIN: INFORMATIONAL
TEMAT: R-WEB-POLISH-UI-ROUTES-AUDIT-Q2
GOAL: Poprawić wyłącznie cztery potwierdzone teksty gracza: odmianę obrońców, opis kwoty utrzymania budynków, odmianę tur oraz liczebnika w tooltipie rekrutacji.
BAZA: `origin/main` / `HEAD` = `2b0f49da4c6101a86652e7919f12cd4454d18fdb`.
ZMIANY/COMMIT: zgodne z allowlistą w `00-dispatch.md`: `gra/src/battle/siegeHud1E.ts`, `gra/src/ui/empireDetailPanel.ts`, `gra/src/ui/diplomacyDealDisplay.ts`, `gra/src/ui/unitRecruitCard.ts`, `gra/src/ui/formatPl.ts`, `gra/tools/ui-language-count-renderer-test.cjs` oraz raport. Bez commita.
TESTY: `node tools/ui-language-count-renderer-test.cjs` — **39 PASS / 0 FAIL**. Rzeczywiste funkcje rendererów są bundlowane przez esbuild i sprawdzane w DOM JSDOM; przypadki 1, 2, 5, 11, 12, 13, 14, 21, 22, widok umowy bezterminowej oraz zachowanie kwot są objęte asercjami. `npm run typecheck` — **PASS** (`tsc --noEmit`, exit 0). `git diff --check` — **PASS**.
BLOKADY: Brak dla implementacji i weryfikacji językowej. Nie wykonywano pomiarów layoutu w przeglądarce; zmiany dotyczą wyłącznie treści tekstowej i odmiany.
RUNDY: 2/5
NASTĘPNY KROK: Niezależny evaluator sprawdza zakres, semantykę i wyniki testu; nie integrować ani nie publikować przed jego werdyktem.
DEPLOY/PUSH: NIE WYKONANO

## Zmiany

- W HUD-zie oblężenia użyłem poprawnych form „1 oddział”, „2 oddziały”, „5 oddziałów”, z regułą 12–14 i końcówkami 21/22.
- Podsumowanie kosztów skarbca teraz opisuje składnik jako `utrzymanie budynków: N ¤`. Zachowałem źródłową kwotę oraz sumę utrzymania budynków i jednostek.
- ETA badań, ETA produkcji armii, pozostały czas umów handlowych i podgląd oferty wymiany używają poprawnej odmiany „tura/tury/tur”. W panelu imperium wykorzystałem istniejący lokalny helper; widok dyplomacji ma równoważną regułę lokalną. Bezterminowy podgląd nadal pokazuje cykliczną wymianę bez dopisywania `null` ani wymyślonego terminu.
- Tooltip rekrutacji korzysta z istniejącego `formatJednostkiCount`, którego wspólna forma została poprawiona dla wyjątków 12–14. Liczba, koszt i zachowanie akcji pozostały takie same.

## Kontrola zakresu

Zmiany produkcyjne ograniczają się do czterech rendererów i współdzielonej odmiany jednostek w `formatPl.ts`, zgodnie z dopisaną allowlistą. Nie zmieniałem mechaniki ani wartości gry. Nie dotykałem plików Tech Cards, które są równolegle modyfikowane przez inny temat, i nie wykonałem commita, pushu ani deployu. Tymczasowe wejście i bundle testu zostały usunięte po wykonaniu.

# R-WEB-BORDER-RELATIONS-ERA-PENALTY-Q1 — raport operatora

STATUS: PASS
DOMAIN: GAME
OWNER: 2026-11-10

## Wdrożenie kandydata

- Istniejąca ciągła kara za wspólną granicę używa stawki zależnej od wyższej z epok obu właścicieli: Kamień–Kamień −2, Kamień–Brąz i Brąz–Brąz −3, a pary z Żelazem −4 Zaufania na turę.
- Stawki są parametrami w `diplomacy.json` i `DIPLOMACY_PARAMS`. Resolver bierze skuteczne parametry oraz aktualne epoki właścicieli.
- Wspólny kontekst pary przekazuje tę samą wartość do ticka, podglądu zmiany na turę i rozbicia czynników. Osobny kontekst gracz–AI również przekazuje stawkę. AI–AI korzysta ze wspólnego kontekstu pary.
- Zachowano istniejący warunek aktywacji: obie strony mają ponad dwa miasta i dzielą granicę lądową. Zaufanie relacji pozostaje naliczane jeden raz na tick.
- Decyzja o wyższej epoce i minimalna allowlista są zapisane w `00-owner-answer.md` i `01-diagnosis-allowlist.md` przed wdrożeniem kodu.

## Weryfikacja

- `cd gra && node tools/diplomacy-border-era-penalty-test.cjs` — PASS, 39/39. Sprawdza wszystkie pary epok, kolejność właścicieli w ticku i UI, wartości mieszane, pojedyncze naliczenie ticka, brak kary bez flagi granicy, połączenie kontekstów tick/preview/rozbicie oraz odtworzenie epoki AI po save/load.
- `cd gra && npm run typecheck` — PASS (`tsc --noEmit`, exit 0).
- `git diff --check` — PASS.

## Granice

Test wywołuje rzeczywisty resolver, `computeTickZaufanieDelta`, `tickDiplomacy` i `buildRelationBreakdown`; weryfikację połączenia tych funkcji z głównym kodem wykonuje przez asercje źródłowe. Nie uruchamiałem przeglądarki. Brak zmian w niepowiązanych czynnikach dyplomacji i schemacie save.

Kandydat zapisany na własnej gałęzi. Bez push, integracji i wdrożenia.

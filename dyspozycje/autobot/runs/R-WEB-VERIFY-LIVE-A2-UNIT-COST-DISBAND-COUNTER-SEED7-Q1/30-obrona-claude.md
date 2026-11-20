# Obrona Operatora (runda 2): R-WEB-VERIFY-LIVE-A2-UNIT-COST-DISBAND-COUNTER-SEED7-Q1

STATUS: PASS-WITH-NOTES (obrona; bez integracji i deployu)
DOMAIN: GAME (POMIAR; kod gry bez zmian, zmieniony tylko test haka i dokument)
TEMAT: R-WEB-VERIFY-LIVE-A2-UNIT-COST-DISBAND-COUNTER-SEED7-Q1
GOAL: odpowiedź na 5 zarzutów Evaluatora: domknąć pokrycie testu przyczyn unitFlow i opisać w dokumencie to, czego nie zmierzono.
BAZA: bb20f13b8 (kandydat rundy 1); commit obrony poniżej.

## Odpowiedzi na zarzuty

1. PRZYJMUJĘ (częściowo). Dodano asercję 1c: realne rozwiązanie jednostki AI (owner 28, `__ledgerRealPathDebug.disband` -> `disbandAiSupportUnit`) daje `zniknietePrzyczyny={"rozwiazanie-ai":1}`, bez zdarzeń bez przyczyny. Na starcie każda jednostka AI jest obrońcą miasta, więc kandydat pojawia się po turach (`aiDisbandAfterTurns`, tur=2). Glod-armii, glod-oblezenie, deficyt-zlota, eliminacja-wlasciciela NIE są przypięte: brak haka ustawiającego stan. Zapisane w nagłówku testu i w doc §8.2.
2. PRZYJMUJĘ (częściowo). Mutacja wartości: zepsuty tag `rozwiazanie-ai` (w kopii bundla, `rozwiazanie-aX`) daje `rozwiazanie-ai=undefined`, czyli asercja mutacji wartości jest CZERWONA (test wykrywa). Tagi glod/deficyt/eliminacja nadal bez mutacji wartości (patrz 1).
3. PRZYJMUJĘ. Doc §8.2 i §8.3: „rekrutacja” oznaczona jako wnioskowanie ze zmiany stanu i noweId, nie jako pomiar; osobny licznik rekrutacji NIE ZMIERZONO.
4. PRZYJMUJĘ. Doc §8 (zakres podgrupy): wspólni właściciele 14–15 z ok. 41 AI; wnioski dotyczą tej podgrupy.
5. PRZYJMUJĘ. Doc §8: seed 4242 t90 Niski 499 (nowy bieg) vs 465 (VERIFYLIVEA); NIE ZWERYFIKOWANO niezależnie, każdy bieg 90 tur wykonany raz.

## Zmiany w tej rundzie (commit: patrz sekcja SHA)

- `gra/tools/ai-economy-measure-hook-test.cjs`:
  - nowe funkcje `advanceOneTurn`, `aiDisbandAfterTurns` (probka rozwiązania AI po turach; odmowa nie zmienia stanu);
  - asercja 1c `unitFlow: rozwiazanie jednostki AI ... rozwiazanie-ai` (po pętli tur, sekcja 4);
  - mutacja wartości `mutacja realna rozwiazanie-ai (wartosc przyczyny w bundle)`;
  - flaga `--mutant-only 1` (wydzielona funkcja `mutantChecks`), bo pełny bieg z mutantem przekracza 590 s w jednym Bash;
  - nagłówek: lista przypiętych i NIE przypiętych przyczyn.
- `dyspozycje/analizy/POMIAR-KOSZTY-JEDNOSTEK-AI-2026-11-20.md` §8: zakres podgrupy, seed 4242 niezweryfikowany, tagi nieprzypięte z plik:linia, wnioskowanie vs pomiar, lista NIE ZMIERZONO.
- Kod gry (`gra/src/main.ts`) NIE zmieniony względem bb20f13b8.

## Testy i bramki (surowe wyniki, ta runda)

- `tsc --noEmit` (gra/): exit 0.
- bundle: `vite build --outDir <scratchpad>/dist-a2r2` (poza repo), built w 15 s.
- `logic-test.cjs`: LOGIC OK (213/213).
- `tech-tree-test.cjs`: 20 pass, 0 fail.
- `research-test.cjs`: 33/33, ALL GREEN.
- `unit-replace-test.cjs`: 21/21.
- `army-hunger-combat-test.cjs`: 13 pass, 0 fail.
- `combat-test.cjs`: 6/6.
- `ai-economy-measure-hook-test.cjs --dist <dist-a2r2>` (log `scratchpad/hook-r2c.log`): 30/30 zielone w części głównej, w tym `unitFlow: rozwiazanie jednostki AI (owner 28) ... rozwiazanie-ai` `{"rozwiazanie-ai":1}`, tur=2.
- `ai-economy-measure-hook-test.cjs --dist ... --mutant-dist <dist-a2r2-mutant> --mutant-only 1` (log `hook-r2d.log`): `mutacja realna rozwiazanie-ai ... CZERWONA` ZIELONE (rozwiazanie-ai=undefined, mutant wykryty). Pozostałe 3 linie „mutacja realna” CZERWONE, bo mutant to zmiana tagu, a te asercje są kształtu (oczekiwany wynik); PODSUMOWANIE 10/13. Pełny bieg z mutant-dist przekroczył 590 s (przerwany, log `hook-r2b.log`, `hook-r2c.log`), stąd flaga `--mutant-only`.

## Uwagi dla orkiestratora

- Dodano flagę `--mutant-only 1` do testu haka (zmiana narzędzia, nie gry). Pełny bieg testu z `--mutant-dist` nie mieści się w jednym Bash 590 s; zalecane dwa wywołania.
- Build bez `prebuild` (wiki) — zgodnie z dispatchem: `node ./node_modules/vite/bin/vite.js build --outDir <poza repo>`. node_modules podlinkowane z /home/user/meas/gra/node_modules (ignorowane przez gra/.gitignore).
- Dysk po buildzie ok. 4,6 GB wolne (`df -h /` przed zadaniem: 4,6G).

NASTĘPNY KROK: Final Control (Evaluator ponownie na tej samej gałęzi); integracja wyłącznie przez orkiestratora.
RUNDY: 2/5 (obrona po werdykcie PASS-WITH-NOTES rundy 1 z zarzutami Evaluatora).
BLOKADY: brak blokad formalnych. NIE PRZYPIĘTE tagi: glod-armii, glod-oblezenie, deficyt-zlota, eliminacja-wlasciciela (brak haka ustawiającego stan). NIE ZMIERZONO: powód mniejszej liczby nowych id; udział walki w zniknięciach bez przyczyny; niezależne powtórzenia biegów 90 tur.
DEPLOY-PUSH: NIE WYKONANO

# Evaluator report — R-AI-GENERAL-WAR-5TURN-ATTACK-Q1 — runda 5

STATUS: PASS
DOMAIN: GAME
TEMAT: R-AI-GENERAL-WAR-5TURN-ATTACK-Q1
GOAL: Pięć pełnych tur EOT zbiórki bez ataku, następnie w szóstej pełnej turze EOT wspólny rozkaz i rzeczywisty ruch wszystkich kwalifikujących się jednostek składu do najbliższego osiągalnego lądem celu; lifecycle, save/load i granice morskie.
ZMIANY/COMMIT: Evaluator nie zmieniał produktu ani testów; brak commita. Zapisano wyłącznie ten raport.
TESTY: `node tools/ai-general-war-campaign-live-test.cjs` 24/24 PASS; `node tools/ai-general-war-campaign-test.cjs` 31/31 PASS; `node tools/army-consolidation-e2e-test.cjs` 6/6 PASS; `node tools/ai-ofensywa-wojna-epoki-test.cjs` 7/7 PASS; `npx tsc --noEmit --pretty false` exit 0; `git diff --check` exit 0.
BLOKADY: brak zarzutów Evaluatora dla dispatchu r5.
RUNDY: 5/5.
NASTĘPNY KROK: Final Control, następnie właściwy dalszy obieg. PASS Evaluatora nie jest Final Control ani gotowością wdrożeniową.
DEPLOY/PUSH: NIE WYKONANO.

## Tożsamość snapshotu

- Worktree: `/tmp/the-game-ai-five-turn-20261028`
- Branch: `codex/R-AI-GENERAL-WAR-5TURN-ATTACK-Q1-r4`
- Baza i HEAD: `85f8c5f0e0aa6ff46aa8b85a03d0bc0c71d86268`
- SHA-256 `git diff --binary` przed testami: `4580f5205bf1862efdfd734e1702f46438aca602d9c53d8ecaea8f51838f2fb6`
- SHA-256 `git diff --binary` po testach, przed zapisaniem tego raportu: ten sam.
- SHA-256 `git status --porcelain=v1` przed i po testach, przed zapisaniem raportu: `ae742c48fa11f3a3f8cfda67cc7266973c7f1d48cd498f709ce46ba150dca710`, bez zmian.
- Git diff obejmował sześć plików z allowlisty r4; zmiany od kandydata ocenionego w r4 ograniczają się do dwóch plików live harnessu dozwolonych w dispatchu r5. HEAD pozostał bazą; brak nowych plików testowych/produktowych po uruchomieniu testów.
- Hashes źródeł po testach: `ai.ts` `6329b51aa7caa5fae584c28e301bb71d1c0da8965817f6465adde45b7153c220`; `ai-general-war-campaign.ts` `a136283e3cd758eccba2d3ff89b8c67daa70bc344722b14970aad9abb995ecec`; `main.ts` `e14df45f263cdb62bc60fb9729f4d40a79c5458fe133c07dcf3ef7e8b8f1250c`. Live test `627226c31c0e7470770021058b864e515a49ef1c1719daab532e6d993ba1bf1e`; Vite fixture `1f16591c2b8948ca9dfe932150d62704e1b0d53f1c546c9ad93dc2c8861e0b27); focused test `2eaeb8a02caab3fd6f1c77e19101befe766a7d8f95b31c53e3ae2c69c45663a1`.
- Vite 5.4.21 live build: 916 modułów, exit 0, bundle 74,278.83 kB. Chromium page errors: 0. Pełny run live zakończył się w 43 s, przed pięciominutowym budżetem r5.

## Weryfikacja live EOT

Niezależnie uruchomiłem live Chromium. Trace live wypisał granice przed i po każdym rzeczywistym wywołaniu `triggerPlayerEndTurn()`:

| Pełny EOT | Zmiana tury | Wynik po zakończeniu executora | Ataki |
|---|---:|---|---:|
| Muster 1/5, rekrutacja i spawn Generała | 1 → 2 | gathering 1/5; 3 Warriors i fizyczny General zebrani | 0 |
| Muster 2/5 | 2 → 3 | gathering 2/5; komplet pozostaje zebrany | 0 |
| Muster 3/5 | 3 → 4 | gathering 3/5; komplet pozostaje zebrany | 0 |
| Muster 4/5 | 4 → 5 | gathering 4/5; komplet pozostaje zebrany | 0 |
| Muster 5/5 | 5 → 6 | attacking 5/5; komplet pozostaje zebrany | 0 |
| Atak 6/6 | 6 → 7 | wspólny cel, 4/4 move zaakceptowane i 4/4 pozycje zmienione | rozkazy ruchu |

Harness w `gra/tools/ai-general-war-campaign-live-test.cjs` nie używa już planner hooka. Helper `finishFullEndTurn` (linie 31–51) odczytuje `currentTurn` oraz długość historii komend przed EOT, wywołuje produkcyjny `runRealEndTurn()`, a następnie czeka na `currentTurn > beforeTurn && !endTurnInProgress()` przed odczytem stanu i śladu komend. Trace pokazał dla sześciu wywołań kolejno world turn 1→2, 2→3, 3→4, 4→5, 5→6 i 6→7, zgodnie z kryterium dispatchu r5.

W piątym muster EOT komenda kampanii pozostaje bez ataku mimo przejścia stanu na `attacking`; szósty EOT zawiera komendy ruchu dla wszystkich trzech testowych jednostek i fizycznego Generała, każda na to samo `targetCityId`. Executor zgłosił `moved: true` dla 4/4, a snapshot pozycji po zakończeniu EOT potwierdził 4/4 ruchy (3/3 Warriors + 1/1 fizyczny General). Brak członków składu pominiętych w tym fixture; nie zgłoszono held/noPath.

## Pozostałe acceptance i scope

- Na wskazanej bazie moduł kampanii był już w kodzie (potwierdzone istnienie pliku także w drzewie bazowym). Bieżący plik kontroli kandydata release `dyspozycje/autobot/runs/FINAL-CONTROL-READY-SUBSET-20261028/01-final-control.md` wymienia AI five-turn march wśród wyłączeń, więc obecność w źródle nie oznacza włączenia do tego release subsetu. Po poprawce r5 potwierdzono działanie produkcyjnego end-turn executora, nie samego planisty.
- Focused campaign test: **31/31**, w tym najbliższy noPath cel odrzucony na rzecz dalszego osiągalnego lądem, jeden connected-component BFS, stabilny cel, stos 4/4 na jeden cel, śmierć przywódcy/reset, niewykorzystywanie nieprzypisanego Generała, nowy rekrutowany Generał, rozejm usuwający kampanię i jej rozkazy, poprawne roundtrip save/load, owner 0 jako cel i odrzucenie złego rekordu.
- Live browser potwierdza roundtrip attack-stage save metadata. Śmierć/rozejm są pokryte focused testami helpera kampanii, nie pełnym browserowym cyklem EOT. To nadal daje automatyczną asercję dla tych przejść; nie rozszerzam claimu live poza obserwowane komendy, ruch i roundtrip zapisu.
- Test-only dane są jawnie syntetyczne: mała mapa `Malenki`, seed 981042, jeden przeciwnik, zero city states; fixture ustawia teren mapy jako ląd i tworzy trzy Warriors. Fizyczny Generał pochodzi z produkcyjnej kolejki i spawnu. Test reachability bliższego noPath celu wykorzystuje osobny syntetyczny helper-fixture z barierą morza.
- Morski transport, zejście z morza i priorytet ataku po odblokowaniu technologii pozostają osobnym, nieukończonym tematem i nie są częścią tego PASS.

## Ścisły werdykt

Nie znalazłem podstaw do zarzutu SCOPE, regresji, braku testu acceptance ani niepoprawnego wyniku TypeScript. Testy tematu i kontroli są zielone; poprawka r5 usuwa jedyny zarzut r4, wykonując pięć pełnych tur EOT przed atakiem i szósty rzeczywisty EOT dla całego stosu. Brak zarzutów do przekazania Operatorowi; dalsza ocena należy do Final Control. Nie wykonałem git add/commit/push/checkout/reset/stash, integracji ani deployu.

# Evaluator report — R-AI-GENERAL-WAR-5TURN-ATTACK-Q1 — runda 4

STATUS: FAIL
DOMAIN: GAME
TEMAT: R-AI-GENERAL-WAR-5TURN-ATTACK-Q1
GOAL: Po pięciu pełnych turach zbiórki AI ma rozpocząć kampanię ataku jednym prawdziwym end-turn executorem na najbliższą stolicę osiągalną lądem, z ruchem całego kwalifikującego się stosu i fizycznego Generała; sprawdzić również lifecycle oraz save.
ZMIANY/COMMIT: brak zmian produktu; brak commita. Zapisano wyłącznie ten raport.
TESTY: campaign 31/31 PASS; Chromium live 19/19 PASS; army-consolidation E2E 6/6 PASS; ai-ofensywa-wojna-epoki 7/7 PASS; `npx tsc --noEmit --pretty false` exit 0; `git diff --check` exit 0.
BLOKADY: jeden twardy zarzut STRICT poniżej.
RUNDY: 4/5.
NASTĘPNY KROK: Operator powinien dodać live scenariusz pięciu pełnych owner EOT i szóstego EOT z atakiem, po czym ponownie skierować tę kartę do Evaluatora.
DEPLOY/PUSH: NIE WYKONANO.

## Tożsamość ocenionego snapshotu

- Worktree: `/tmp/the-game-ai-five-turn-20261028`
- Branch: `codex/R-AI-GENERAL-WAR-5TURN-ATTACK-Q1-r4`
- HEAD/baza: `85f8c5f0e0aa6ff46aa8b85a03d0bc0c71d86268`
- SHA-256 `git diff --binary` przed testami: `f43f58c5b42e60e9154d96d5b1faa302d8affb93e49c79df487d4086a091c915`
- SHA-256 `git diff --binary` po testach, przed zapisaniem tego raportu: ten sam.
- SHA-256 `git status --porcelain=v1` przed i po testach, przed zapisaniem tego raportu: `ae742c48fa11f3a3f8cfda67cc7266973c7f1d48cd498f709ce46ba150dca710`, bez zmian.
- Diff zawierał dokładnie 6 plików produktu/testów, wszystkie w allowliście z dispatchu. `git diff --check` czysty.
- Hashes źródeł/testów po testach były zgodne z identyfikatorami zapisanymi przez Operatora: `ai.ts` `6329b51aa7caa5fae584c28e301bb71d1c0da8965817f6465adde45b7153c220`; `ai-general-war-campaign.ts` `a136283e3cd758eccba2d3ff89b8c67daa70bc344722b14970aad9abb995ecec`; `main.ts` `e14df45f263cdb62bc60fb9729f4d40a79c5458fe133c07dcf3ef7e8b8f1250c`; testy kampanii: `2eaeb8a02caab3fd6f1c77e19101befe766a7d8f95b31c53e3ae2c69c45663a1`, `b74d11f473cef430195e7f38fadbe4153c6b01cbba7758029e40987b5331743a`, `73953485d4fddc693542c4ba971c7be554c3aa35fc45ba342b564eb83814217b`.
- Live build: Vite 5.4.21, 916 modułów, exit 0, bundle 74,281.13 kB; Chromium page errors: 0.

## Niezależnie potwierdzone

Focused campaign test: **31 passed / 0 failed**. Zawiera granicę tur 1–5 bez rozkazów ataku, start ataku po pięciu kompletnych wywołaniach planisty, stos 4/4 z jednym celem, nearest reachable target przy bliższym noPath, reset po śmierci lidera, zakończenie po pokoju oraz zapis/odczyt kampanii.

Live Chromium: **19 passed / 0 failed**. Test rzeczywiście uruchomił produkcyjny zakup i spawn fizycznego Generała. Po skonfigurowaniu stanu ataku wykonał rzeczywisty przyciskowy przepływ EOT `triggerPlayerEndTurn()`; poczekał jednocześnie na wzrost numeru tury i `endTurnInProgress === false`, następnie sprawdził, że wszystkie **3/3** współlokowane jednostki opuściły pole startowe i że fizyczny Generał również się ruszył. Potwierdza to rzeczywiste wykonanie rozkazów ruchu i snapshot pozycji po zakończeniu EOT.

Pozostałe niezależne bramki: army consolidation **6/6**, AI wojna epokowa **7/7**, TypeScript exit 0, diff-check czysty. Nie znalazłem plików poza allowlistą ani zmian w źródłach po rozpoczęciu ewaluacji.

## Zarzut

1. **FAIL — STRICT #1 i #4: brak dowodu wymaganych pięciu pełnych EOT przed pierwszym atakiem.** W `gra/tools/ai-general-war-campaign-live-test.cjs:63-81` pięć kroków zbiórki i „szósty” krok ataku wykonuje `runCampaignPlannerTurn`. Probe w `gra/tools/ai-general-war-campaign-live.vite.config.ts:217-240` bezpośrednio wywołuje `prepareAiGeneralWarCampaign` i `decideAITurn`, ręcznie zapisuje stan kampanii oraz zwiększa `turn`; nie uruchamia produkcyjnego end-turn executora. Dopiero po uprzednim ustawieniu `stage === 'attacking'` live harness wykonuje jeden prawdziwy EOT (`ai-general-war-campaign-live-test.cjs:88-92`). Zatem 19/19 nie dowodzi krytycznego acceptance r4 „pięć pełnych tur zbiórki w rzeczywistym przepływie EOT, bez ataku, a atak po kolejnej pełnej turze”; test dotyczy pięciu wywołań planisty, nie pięciu pełnych tur gry. Zgodnie z STRICT luka w asercji automatyzowalnego acceptance to FAIL, a nie NOTES. Naprawa wymaga w live teście odpalić pięć pełnych tur AI przez rzeczywisty przepływ end-turn, sprawdzać brak ataku po każdej, następnie uruchomić kolejną pełną turę i sprawdzić rozkazy ataku oraz pozycje po zakończeniu EOT.

## Granice dowodu / zakres

- Browser fixture syntetycznie zamienia mapę na przejezdny ląd w `ai-general-war-campaign-live.vite.config.ts`; jest to jawnie konfiguracja testowa. Wynik nie potwierdza zachowania na mapach z naturalnie wygenerowanymi barierami.
- Nearest reachable land / bliższy noPath cel potwierdzony celowanym helper testem na syntetycznym teście z barierą morza i przez focused test kampanii; live browser nie rozgrywa konkurencyjnych stolic.
- Śmierć Generała, rozejm i save/load przeszły jako focused testy/helper roundtrip. Nie były odgrywane w Chromium przez pełny cykl EOT.
- Brak dowodu albo implementacji transportu morskiego i zejścia z morza. Pozostaje poza zakresem tej rundy zgodnie z decyzją właściciela.

## Werdykt procesu

FAIL ogranicza się do dowodu krytycznej granicy pięciu pełnych EOT przed atakiem. Nie stwierdzono awarii uruchomionych testów, błędów TypeScript, niedozwolonych plików ani zmiany snapshotu w czasie testów. Nie poprawiałem produktu, nie integrowałem, nie commitowałem i nie deployowałem.

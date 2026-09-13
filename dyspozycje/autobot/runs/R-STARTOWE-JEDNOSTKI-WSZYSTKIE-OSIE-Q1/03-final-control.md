# 03-final-control — R-STARTOWE-JEDNOSTKI-WSZYSTKIE-OSIE-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-STARTOWE-JEDNOSTKI-WSZYSTKIE-OSIE-Q1
PROCESS_PHASE: final-control
KANBAN_CARD: t_aebaafea
SOURCE_IMPLEMENTATION_CARD: t_af4dfeb8
RUNDY: 1/5 (runda produktowa; bieżący Final Control Kanban run_id=25)
GOAL: Niezależnie potwierdzić zgodność czterech osi startowych jednostek z właściwym Excelem, rozdzielenie wiring/guardów, rzeczywiste scenariusze pierwszego miasta, regresję oraz gotowość do integracji bez publikacji.

## ROUTING RECEIPT

- requested.model: `gpt-5.6-luna`
- requested.provider: `openai-codex`
- requested.effort: `max`
- requested.service_tier: `priority` (Fast)
- actual.model: `gpt-5.6-luna`
- actual.provider: `openai-codex`
- actual.effort: `max`
- actual.service_tier: `priority` (Fast)
- Actual runtime readback: command line parent process zawiera `-m gpt-5.6-luna --provider openai-codex --reasoning max --service-tier priority`; odczyt wykonany przez `ps` podczas tego Final Control.

## GIT, WEJŚCIE I ZAKRES

- HEAD: `ffefe905910437c5b7c8364bd6adcb3c3a0ee16e`
- Base / merge-base z `origin/main`: `ff9ce26a663c53c9f711e50536eb10f59dc4b70b`
- Branch: `hermes/R-GRACZ-STARTOWE-JEDNOSTKI-TRUDNOSC-Q1`
- Worktree: `/home/ubuntu/projects/The-Game-worktrees/R-GRACZ-STARTOWE-JEDNOSTKI-TRUDNOSC-Q1`
- Właściwy Excel: `/home/ubuntu/.hermes/attachments/The-Game-startowe-jednostki-do-korekty.xlsx`
- SHA-256 właściwego Excela: `e04a427c5f761b19471b11855a236f280949b9b3be04682c09fcec2f03739cce`
- Excel został odczytany niezależnie z XML obu arkuszy; nie użyto wcześniejszego pliku Excela.
- Implementacja była oceniana na faktycznym HEAD; Final Control nie zmienił żadnego pliku produktu. Raport i evidence są nowymi artefaktami wyłącznie w allowlistowanym katalogu runu.
- `gra/src/main.ts` nie ma diffu. Numstat sześciu plików produktu/testów względem base: `38` dodanych / `20` usuniętych.
- Aktualny zakres Git po zapisaniu raportu pozostaje allowlist-only: sześć plików produktu/testów oraz artefakty `dyspozycje/autobot/runs/R-STARTOWE-JEDNOSTKI-WSZYSTKIE-OSIE-Q1/**`.

## KONTRAKT Z WŁAŚCIWEGO EXCELA

1. Gracz, główna trudność gry: `easy=2`, `normal=1`, `hard=0`.
2. Główna cywilizacja AI: dodatkowe jednostki `easy=0`, `normal=1`, `hard=2`; na hard dodatkowe miasto `1`, a brak legalnego miejsca zachowuje istniejący fallback jednostkowy.
3. Obce państwo-miasto, główna trudność gry: `easy=2`, `normal=1`, `hard=0`.
4. Państwo-miasto typu gracza, osobny suwak trudności państw-miast: `easy=0`, `normal=1`, `hard=2`; główna trudność gry nie może zmieniać tej osi.

## NIEZALEŻNY READBACK KODU

- `gra/src/game/ai-difficulty-bonus.ts:139-156`: `cityStateStartUnitCount` daje `0/1/2`, `playerStartUnitCount` daje `2/1/0`, a `foreignCityStateStartUnitCount` daje `2/1/0` w kolejności easy/normal/hard.
- `gra/src/game/ai.ts:554-565`: `loadDifficultyParams` czyta parametry poziomów; fallback `startoweJednostki` wynosi `0/1/2`, a `startoweMiasta` `0/0/1`.
- `gra/data/ai-params.json:12-20`, `:40-60`, `:76-100`: dane JSON potwierdzają poziomy `0/1/2` jednostek AI oraz hard `1` miasta.
- `gra/src/main.ts:7591-7594`: `aiDiffLevelForOwner` używa `_menuCityStateDifficulty` dla kopii typu państwa-miasta i `_menuDifficulty` dla zwykłego AI.
- `gra/src/main.ts:8947-8952`: rywale tego samego typu co gracz dostają jednostki przez `cityStateStartUnitCount(_menuCityStateDifficulty)`.
- `gra/src/main.ts:9000-9004`: gracz dostaje `playerStartUnitCount(_menuDifficulty)` przez wspólny spawner.
- `gra/src/main.ts:9077-9087`: obce państwa-miasta są rozpoznane w gałęzi `isCS` i dostają `foreignCityStateStartUnitCount(_menuDifficulty)`.
- `gra/src/main.ts:9012-9047`: major AI ma osobną funkcję, guard ownera, plan `startoweJednostki/startoweMiasta` i fallback miasta do jednostek; ścieżka państw-miast nie jest w niej wywoływana.
- `gra/src/main.ts:13166-13186`: guard pierwszego miasta jest per owner/fotel; tylko pierwsze miasto dostaje armię gracza, a następne oraz inne ścieżki nie dostają jej ponownie. Hot-seat drugi fotel ma własny owner.
- `gra/src/main.ts:35678-35698`: główna trudność i osobny override trudności państw-miast są rozstrzygane oddzielnie; live test przekazuje jawny override PM i zmienia główną trudność.

## BRAMKI WYKONANE NA AKTUALNYM HEAD

Wszystkie komendy uruchomiono niezależnie z katalogu `gra/`, poza kontrolą Git/Excela.

- Syntax: `node --check` dla `ai-difficulty-bonus-test.cjs`, `city-state-start-units-test.cjs`, `city-state-start-units-live-test.cjs` i `starting-army-first-city-live-test.cjs` — exit `0`.
- TypeScript: `node_modules/.bin/tsc --noEmit` — exit `0`.
- `node tools/ai-difficulty-bonus-test.cjs` — `90 passed, 0 failed`.
- `node tools/city-state-start-units-test.cjs` — `16 PASS, 0 FAIL`.
- `node tools/ai-balans-step5-test.cjs` — `18 passed, 0 failed`.
- `node tools/city-state-cluster-diff-test.cjs` — `31 passed, 0 failed`.
- `node tools/miasta-zbyt-blisko-test.cjs` — `20` map; `23281` par planu i `25463` par symulacji realnej kolejności; `0` naruszeń.
- `CS_CHROME_PATH=/home/ubuntu/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome node tools/city-state-start-units-live-test.cjs` — `25 pass, 0 fail`; trzy pełne generacje Chromium, główna trudność `hard/normal/easy`, stałe PM `normal`, zero console/page errors. Stolica gracza `0/1/2`, obce PM `0/1/2`, PM typu gracza `1/1/1`.
- `STARTING_ARMY_CHROME_PATH=/home/ubuntu/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome node tools/starting-army-first-city-live-test.cjs` — `13 pass, 0 fail`; dwa fotele, pierwszy founding każdego, drugi founding bez ponownego grantu, zero JS errors.
- Browser readback: `/home/ubuntu/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`, `Google Chrome for Testing 151.0.7922.34`.

## ANTY-SAMOOSZUKANIE I BASELINE

- Mutant w tymczasowej kopii `gra/src`/`gra/data` przywracający stare mapowanie gracza `easy=1`, `normal=2`, `hard=3` został uruchomiony z `AI_SRC_DIR` — `87 passed, 3 failed`, exit `1`; trzy asercje gracza zabiły mutanta (`mutant_killed=YES`). Worktree produktu pozostał bez zmian.
- Szeroki `node tools/ai-test.cjs`: aktualny checkout dał exit `1`, `291 passed, 4 failed`; porażki to dokładnie T2S-b (dwie asercje), T2S-b2 i T10b — handel/dyplomacja.
- Ten sam test z czystego `git archive HEAD` z dowiązanym `node_modules` dał exit `1` i bajtowo identyczny output; oba SHA-256 outputu: `845cb9535eb8ae0ea245a54624732f1ba0bbc0cfac0adf848746329e69566086`. To reprodukowalny, niezwiązany baseline, nie regresja startowych jednostek.

## WERDYKT FINAL CONTROL

- Wszystkie cztery osie, ich miejsca wywołania, guard pierwszego miasta, testy logiczne, typecheck, syntax, map spacing, live runtime i mutant są potwierdzone niezależnym odczytem/wykonaniem.
- Implementacja spełnia kontrakt właściwego Excela. Nie znaleziono cross-talku: zmiana głównej trudności zmienia gracza i obce PM, przy stałym override PM utrzymuje PM typu gracza; źródło ma osobne helpery i call-site’y.
- `PASS-WITH-NOTES` wynika wyłącznie z istniejącego baseline `ai-test.cjs 291/4`, odtworzonego identycznie na czystym HEAD. Nie jest to blocker tego tematu.
- GOTOWOŚĆ DO INTEGRACJI: TAK — orkiestrator może integrować wyłącznie allowlistę, bez rozszerzania zakresu.
- READY_FOR_DEPLOY: NIE — Final Control nie integruje, nie wystawia READY_FOR_DEPLOY, nie pushuje i nie deployuje.

ZMIANY/COMMIT: reviewed commit `ffefe905910437c5b7c8364bd6adcb3c3a0ee16e`; brak zmian implementacji przez Final Control; dodane tylko raporty tego etapu w katalogu runu.
TESTY: pełna macierz powyżej; wszystkie bramki tematyczne PASS, baseline szeroki jawnie `291/4` na aktualnym i czystym HEAD.
BLOKADY: brak blokady merytorycznej; jedna jawna nota o niezwiązanym baseline handlu/dyplomacji.
NASTĘPNY KROK: integracja orkiestratora allowlist-only, następnie osobna bramka READY_FOR_DEPLOY i deploy/push.
DEPLOY/PUSH: NIE WYKONANO

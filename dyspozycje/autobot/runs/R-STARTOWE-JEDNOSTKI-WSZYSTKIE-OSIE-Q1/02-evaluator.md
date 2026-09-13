# 02 — EVALUATOR

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
ROLE: Evaluator
PROCESS_PHASE: evaluator
RUN_ID: 10
TEMAT: R-STARTOWE-JEDNOSTKI-WSZYSTKIE-OSIE-Q1
KANBAN_CARD: t_af4dfeb8
RUNDY: 1/5
ATTEMPT: 1
GOAL: Niezależnie potwierdzić zgodność czterech osi startowych jednostek z właściwym Excelem, rozdzielenie wiring/guardów oraz dowody runtime.

## Werdykt

REVIEW_OUTCOME: APPROVED

Przegląd przeprowadzono na faktycznym worktree i aktualnym diffie, bez edycji plików implementacji. Zmiana jest minimalna: wartości gracza i hard AI zostały skorygowane, istniejące rozdzielenie ownera/fotela, głównego AI, obcego państwa-miasta i PM typu gracza pozostaje nienaruszone.

## Readback źródła i zakresu

- Właściwy Excel: `/home/ubuntu/.hermes/attachments/The-Game-startowe-jednostki-do-korekty.xlsx`.
- SHA-256: `e04a427c5f761b19471b11855a236f280949b9b3be04682c09fcec2f03739cce`.
- HEAD: `8e5e81255449bc98c9674c6a6e5505d408b343fc`.
- Base: `ff9ce26a663c53c9f711e50536eb10f59dc4b70b`.
- Branch: `hermes/R-GRACZ-STARTOWE-JEDNOSTKI-TRUDNOSC-Q1`.
- Worktree: `/home/ubuntu/projects/The-Game-worktrees/R-GRACZ-STARTOWE-JEDNOSTKI-TRUDNOSC-Q1`.
- Faktyczny diff obejmuje sześć plików allowlisty produktu/testów; `gra/src/main.ts` nie ma diffu. Artefakty tego runu pozostają pod dozwolonym `dyspozycje/autobot/runs/.../**`.
- `git diff --check`: PASS.
- Nie wykonano commit, push, PR, merge, deploy ani `READY_FOR_DEPLOY`.

## Kryteria binarne

1. Gracz: `playerStartUnitCount` w `gra/src/game/ai-difficulty-bonus.ts:145-150` daje dokładnie `easy=2`, `normal=1`, `hard=0`.
2. Główne AI: `gra/data/ai-params.json:92-100` i fallback `gra/src/game/ai.ts:554-560` dają `easy=0`, `normal=1`, `hard=2`; `startoweMiasta` hard nadal wynosi `1`. Test blokady legalnego heksu potwierdza `2 + 1` jednostki zastępczej.
3. Obce PM: istniejąca ścieżka `foreignCityStateStartUnitCount(_menuDifficulty)` pozostaje `easy=2`, `normal=1`, `hard=0`.
4. PM typu gracza: istniejąca ścieżka `cityStateStartUnitCount(_menuCityStateDifficulty)` pozostaje `easy=0`, `normal=1`, `hard=2`; live test utrzymuje PM slider na `normal` przy trzech różnych głównych trudnościach i za każdym razem otrzymuje `1`.
5. Pierwsze miasto: readback `main.ts` potwierdza guard per owner/fotel przed grantem; live hot-seat potwierdza pierwszy founding obu foteli, brak ponownego bonusu na drugim mieście i odrębny bonus drugiego fotela.
6. Testy obejmują wszystkie cztery tabele, call-site'y i cross-talk; mutacja starego gracza `1/2/3` nie przechodzi.
7. Runtime/live wykonuje rzeczywiste bundlowanie, generację świata i founding; nie ogranicza się do samego helpera.
8. Typecheck, składnia, testy obszaru i regresja map przechodzą. Cztery porażki szerokiego `ai-test.cjs` są odseparowanym baseline'em.
9. Zakres i zakazy są zachowane; brak zmian poza allowlistą produktu/testów i run artifacts.

## Dowody wykonania

- `node --check tools/ai-difficulty-bonus-test.cjs && node --check tools/city-state-start-units-test.cjs && node --check tools/city-state-start-units-live-test.cjs && node --check tools/starting-army-first-city-live-test.cjs`: exit `0`.
- `node tools/ai-difficulty-bonus-test.cjs`: `90 passed, 0 failed`.
- `node tools/city-state-start-units-test.cjs`: `16 PASS, 0 FAIL`.
- `node tools/ai-balans-step5-test.cjs`: `18 passed, 0 failed`.
- `node tools/city-state-cluster-diff-test.cjs`: `31 passed, 0 failed`.
- `node tools/miasta-zbyt-blisko-test.cjs`: `20` map; `23281` par planu i `25463` par symulacji realnej kolejności; `0` naruszeń.
- `node_modules/.bin/tsc --noEmit`: exit `0`.
- `CS_CHROME_PATH=/home/ubuntu/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome node tools/city-state-start-units-live-test.cjs`: `25 pass, 0 fail`; hard/normal/easy przy stałym PM `normal`; player `0/1/2`, foreign PM `0/1/2`, PM typu gracza `1/1/1`, zero błędów konsoli/JS.
- `STARTING_ARMY_CHROME_PATH=/home/ubuntu/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome node tools/starting-army-first-city-live-test.cjs`: `13 pass, 0 fail`; dwa fotele, pierwszy founding każdego, jeden unit na fotel przy normal, drugi founding bez ponownego grantu, zero błędów JS.
- Mutant w tymczasowej kopii `src/` + `data/` przywracający graczowi `1/2/3`: `87 passed, 3 failed`, exit `1`; mutant killed. Worktree nie został zmieniony przez mutację.
- `node tools/ai-test.cjs`: `291 passed, 4 failed`; identyczny output i hash wyniku na aktualnym worktree oraz czystym archiwum HEAD. Są to istniejące T2S-b/T2S-b2/T10b (handel/dyplomacja), poza zakresem tej zmiany.

## Następny etap

BLOKADY: brak merytorycznej blokady; pozostaje jawna uwaga o niezwiązanym baseline `ai-test.cjs`.
DEPLOY/PUSH: NIE WYKONANO
NASTĘPNY KROK: Final Control / integracja zgodnie z procesem; bez samodzielnego pushu, merge ani deployu.

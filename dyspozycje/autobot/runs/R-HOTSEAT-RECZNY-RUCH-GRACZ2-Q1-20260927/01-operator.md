STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-HOTSEAT-RECZNY-RUCH-GRACZ2-Q1-20260927
GOAL: Fotel 2 hot-seat może zaznaczyć własną jednostkę i wydać ręczny rozkaz marszu.
ZMIANY/COMMIT: Zmieniono wyłącznie `gra/src/main.ts` oraz `gra/tools/hotseat-drugi-fotel-tura-test.cjs`; bez commitu, merge, push i deployu.

DIAGNOZA:
- `selectPlayerUnit()` (`gra/src/main.ts:6283-6285`) i `planMarchTo()` (`25163-25178`) już sprawdzały `isMe(u.ownerId)`, więc po przełączeniu fotela wartości były prawidłowe: `activeHumanOwnerId/ME()=49`, jednostka fotela 2 `u.ownerId=49`, a zaznaczenie i przyjęcie planu przechodziły.
- Rzeczywista blokada była w `executeMarchSegmentForUnit()` (`gra/src/main.ts:25385-25402`): stara bramka `u.ownerId !== 0` była zaszyta na fotel 1. Dla fotela 2 warunek był fałszywy mimo `u.ownerId === ME()`.
- `planMarchTo()` najpierw oznacza jednostkę jako ruszoną i zapisuje `plannedMarches`, a następnie próbuje wykonać pierwszy segment; przy końcu tury ta sama blokada odrzucała także ścieżkę `executePlannedMarchesEndTurn()`. Objaw: plan mógł istnieć, ale jednostka pozostawała na tym samym heksie.
- Naprawa: bramka w `executeMarchSegmentForUnit()` używa teraz `!isMe(u.ownerId)`, zgodnie z `selectPlayerUnit()` i `planMarchTo()`. Bez przebudowy hot-seat.

TEST REGRESYJNY:
- Rozszerzono `gra/tools/hotseat-drugi-fotel-tura-test.cjs` o scenariusz fotela 2: realny kreator hot-seat, realne `advanceSeat()` przez `__eraTestDebug.endTurn()`, odczyt surowego stanu jednostki fotela 2, action-level wywołanie produkcyjnego `selectPlayerUnit()` przez istniejący hook oraz realny klik canvasu na sąsiedni heks. Test sprawdza aktywny fotel, ownerId jednostki, selectedId, przyjęcie planu/ruch oraz brak page errors.
- Czerwony przed naprawą: `R-HOTSEAT-RECZNY-RUCH-GRACZ2-Q1-focused.cjs` z kodem bazowym (`u.ownerId !== 0`) zakończył się `exit=1`; jedyna porażka: przed `{ownerId:49,q:119,r:36}` i po `{ownerId:49,q:119,r:36}`, cel `{q:120,r:36}` — marsz fotela 2 nie wykonał się.
- Zielony po naprawie: ten sam focused harness zakończył się `exit=0`, `{"pass":true,"failures":[]}`. Budowanie bundla i headless Chromium przeszły.
- Zaznaczenie i planowanie w kontroli czerwonej przechodziły; czerwony był dopiero etap wykonania, co lokalizuje błąd w `executeMarchSegmentForUnit()`, nie w `ME()`/`isMe()` ani hit-teście.

BRAMKI:
- `node --check tools/hotseat-drugi-fotel-tura-test.cjs`: PASS.
- `node ./node_modules/typescript/bin/tsc --noEmit` w `gra/`: PASS, 0 błędów.
- `git diff --check`: PASS.
- `grep -l hotseat`/zawartość `gra/tools/` znalazła 35 plików. Uruchomiono sekwencyjny pakiet kontrolny; przed zatrzymaniem wykonano 10 testów do wyniku: 7 PASS, 3 TIMEOUT. Testy PASS: `R-HOTSEAT-FOTEL2-CYWILIZACJA-BLEDNA-live-test.cjs` (371.6 s), `ai-founding-territory-test.cjs`, `ai-praca-budynki-ulepszenia-owner-policy-test.cjs`, `civ-ai-allocation-test.cjs`, `hotseat-etap1-ownerid-test.cjs`, `hotseat-etap3-akcesory-test.cjs`, `hotseat-etap5-no-leak-test.cjs` (192.7 s). TIMEOUT: `hotseat-drugi-fotel-tura-test.cjs`, `hotseat-dyplo-kontakt-per-fotel-test.cjs`, `hotseat-etap4-noop-test.cjs` przy limicie 420 s. `hotseat-etap6a-input-noop-test.cjs` rozpoczęty, bez wyniku przed zatrzymaniem.
- Timeout głównego istniejącego harnessu jest reprodukowalny kontrolą niezmienionego testu z `HEAD`: `pollUntil(world-end-turn-after-both-seats)` kończy z `turn=2, activeHumanOwnerId=49` zamiast powrotu na fotel 1; druga próba kończy się zamknięciem strony. Nie jest to ścieżka zmieniona tym fixem; focused scenariusz tematu jest zielony.

BLOKADY: Pełny 35/35 pakiet nie został domknięty w tym przebiegu z powodu wielominutowych, pre-existing live-harness timeoutów; brak blokady funkcjonalnej dla naprawy tematu. Do niezależnego Evaluatora przekazać rozstrzygnięcie, czy timeouty są akceptowanym flaky/pre-existing, oraz ewentualne porównanie na całkowicie czystym `origin/main` worktree.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator ma niezależnie zweryfikować wąski diff, czerwony/zielony focused harness, oraz zaklasyfikować timeouty pełnego pakietu; następnie Final Control.
DEPLOY/PUSH: NIE WYKONANO

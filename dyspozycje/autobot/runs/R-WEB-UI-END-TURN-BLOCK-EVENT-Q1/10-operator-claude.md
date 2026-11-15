# R-WEB-UI-END-TURN-BLOCK-EVENT-Q1 — raport Operatora (runda 2/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-END-TURN-BLOCK-EVENT-Q1
GOAL: gdy bramka NNS blokuje „Zakończ turę”, w panelu wydarzeń (zakładka Ważne) pojawia się JEDNA karta „Nie można zakończyć tury” z pełnym komunikatem bramki i przyciskami akcji: „Zwiększ podatek do X%” (propozycja bramki, przez istniejącą zmianę podziału), „Zmienię sam” (panel skarbca), dla żywności „Otwórz racje”; karta znika po ustąpieniu blokady.
BAZA: origin/main `ff090714d` (wg DODATKU 3, NIE `beba87249`). Kod r1 przeniesiony ręcznie (cherry-pick `054735318`/`b4959db39` bez commita, potem przebudowa pod propozycjaPodatku).
ZMIANY/COMMIT: kod + test + zrzut w commicie tej rundy (SHA = czubek gałęzi po commicie, podany w polu sha wyniku). Pliki:
- `gra/src/ui/sidePanelEventFilter.ts`: `endTurnBlockEventOf` z polami `zasob`, `propozycjaPunkty`, `podatekTeraz`; przyciski `buttons` (stałe `END_TURN_BLOCK_ACT_*`).
- `gra/src/ui/sidePanelHud.ts`: typ `SidePanelEventButton`, pole `buttons`, konfiguracja `onEventButton`, renderer `.sp-act-row`/`.sp-act-btn`, listener (stopPropagation, klik karty bez zmian), CSS.
- `gra/src/ui/hud.ts`: przekazanie `onEventButton` do sidePanelHud.
- `gra/src/main.ts` (tylko ścieżka blokady): import, deklaracja `nnsEndTurnBlockAttemptTurn` przed collect (bez TDZ), `nnsEndTurnBlockEvent`, `noteEndTurnBlockedByNns`, `handleEndTurnBlockButton` (propozycja → `ownerDefaultPodzialHandlu` + `normalizePodzialHandlu`, to samo pole co `setTaxSplit`), wiring w `hintEndTurnBlocked` i `onEventButton`. Logika bramki NIETKNIĘTA (`no-negative-stocks.ts` nie zmieniany).
- `gra/tools/end-turn-block-event-test.cjs`: rozszerzony (sekcje l, m; 34/0).
- `gra/tools/end-turn-block-event-live-test.cjs`: NOWY, test żywej gry (Chromium).
- `dyspozycje/autobot/runs/R-WEB-UI-END-TURN-BLOCK-EVENT-Q1/evidence/`: zrzut `blokada-wydarzenie-wazne.png` i wynik `end-turn-block-event-live.json`.

TESTY (surowe wyjścia, katalog `gra/`):
- `npx tsc --noEmit`: exit 0, brak komunikatów.
- `node tools/end-turn-block-event-test.cjs`: `passed=34 failed=0`, exit 0.
- Mutacja jednostkowa (warunek `zasob === 'skarbiec'` → `'MUTANT'` w sidePanelEventFilter.ts): `passed=31 failed=3`, exit 1 (czerwono). Przywrócone.
- `node tools/end-turn-block-event-live-test.cjs --dist <scratch>/dist-blk --out <scratch>/live-out` (build `vite build --outDir <scratch>/dist-blk`, poza repo): `passed=14 failed=0 pageerrors=0`, exit 0.
  - Kolejność: blokada (canEnd=false, propozycja krokowa +60 pkt) → brak karty przed próbą → dwie próby zakończenia (tura nie zmienia się) → dokładnie 1 karta, przyciski „Zwiększ podatek do 90%” (tax-raise) i „Zmienię sam” (open-tax), pełny komunikat → klik „Zwiększ…” → podział Pieniądz 30→90, canEnd=true → karta znika → tura kończy się (+1) → kontrola bez blokady: brak karty.
- Mutacja żywa (handler `tax-raise` zablokowany, `if (act !== 'MUTANT-NEVER') return;`): `passed=9 failed=5`, exit 1 (czerwono: podatek, canEnd, zniknięcie karty, zakończenie tury, kontrola). Przywrócone.
- Test czerwony na bazie `ff090714d`: NIE_ZMIERZONO (nie uruchomiono testu na czystym checkout bazy; brak eksportu `endTurnBlockEventOf` w bazie wymusza błąd bundlowania, ale nie sprawdzono tego uruchomieniem).
- Bramki referencyjne (surowe wyniki):
  - `logic-test.cjs`: `LOGIC OK (213/213)`, exit 0
  - `tech-tree-test.cjs`: `tech-tree-test: 20 pass, 0 fail`, exit 0
  - `research-test.cjs`: `PASSED: 33 / FAILED: 0 / TOTAL: 33`, exit 0
  - `unit-replace-test.cjs`: `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0
  - `combat-test.cjs`: `COMBAT TEST: 6/6 pass`, exit 0
  - `end-turn-gate-projection-only-test.cjs`: `49 passed, 0 failed`, exit 0 (bez regresji)
- `git diff --check`: czysty (brak wyjścia).
- Zrzut Chromium: `dyspozycje/autobot/runs/R-WEB-UI-END-TURN-BLOCK-EVENT-Q1/evidence/blokada-wydarzenie-wazne.png` — zakładka „Ważne 1”, karta „Nie można zakończyć tury” z przyciskiem „Zwiększ podatek do 90%”. Uwaga: w kadrze przycisk „Zmienię sam” jest pod kadrem karty / pod dymkiem tooltipa; obecność potwierdzona w DOM (test), wizualnie NIE_ZMIERZONO w pełnym kadrze.
- Pageerrors w teście żywym: 0.

BLOKADY:
- Test czerwony na bazie: NIE_ZMIERZONO (patrz wyżej).
- Wizualne ułożenie drugiego przycisku („Zmienię sam”) w wąskiej karcie: NIE_ZMIERZONO w pełnym kadrze, do obejrzenia przez orkiestratora/Evaluatora.
- Akcja „Otwórz racje” (żywność) i „Zmienię sam” (otwarcie panelu) potwierdzone TYLKO kodem i testem statycznym (m), NIE kliknięciem w grze; scenariusz żywności nie był w teście żywym.
- Przypadek „maksimum nie wystarcza” (bez propozycji): potwierdzony testem jednostkowym (l) (tylko „Zmienię sam”), NIE w grze.
- Wydajność (wyjście z prób do bramki tylko przy próbie): NIE_ZMIERZONO (brak pomiaru czasu).

ZAŁOŻENIA (luki w dispatchu, rozstrzygnięte założeniem):
1. Wydarzenie jest NIEBLOKUJĄCE (`blocking` nie ustawione, `kind: 'info'`, `important: true`) — jak w r1. Nie liczy się do licznika „wymaga decyzji” i nie zmienia logiki modali. Pytanie o podatek realizuje przycisk, nie blokujący modal.
2. Akcja „Zwiększ podatek do X%”: X = bieżący procent Pieniądza + `punktyProcentowe` z `propozycjaPodatku` bramki; ubytek idzie z Nauki (zgodnie z komunikatem bramki „kosztem Nauki”). Zapis przez `normalizePodzialHandlu` (ta sama funkcja co `setTaxSplit`).
3. Przycisk „Otwórz racje” otwiera sekcję `zywnosc` panelu imperium (istniejący mechanizm `openEmpireDetailFromHud`); nie dodano nowego panelu racji.
4. Dla blokady żywności (spichlerz) nie ma automatu ani akcji podatku — wydarzenie pokazuje dźwignie w tekście i przycisk „Otwórz racje”.

UWAGI-DLA-ORKIESTRATORA:
- Obserwacja z żywego testu: w pełnym kadrze karta wydarzenia jest wysoka i przycisk „Zmienię sam” może wypaść poza widoczny obszar panelu — warto to zobaczyć w Evaluatorze.
- Baza r1 (`beba87249`/`151491cc2`) NIE jest integrowana; ta runda zastępuje ją na `ff090714d`.
- Nie zakładano żadnej sesji (spawn_task / create_session / create_trigger / send_later nie użyto); nie wykonano push na main, deploy ani integracji.
- `node_modules` w `gra/` zainstalowane przez `npm ci --ignore-scripts` w worktree (ignorowane przez git); build testowy w `<scratch>/dist-blk` i `<scratch>/dist-mut` poza repo.

RUNDY: 2/5 (runda 1: FC FAIL, zarzuty DODATEK 1 i test na realnym stanie; runda 2: ten raport)
NASTĘPNY KROK: Evaluator (SONNET) weryfikuje commit tej rundy: testy 34/0 i 14/0, mutacje czerwone, zrzut w `evidence/`, układ przycisków w karcie; potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

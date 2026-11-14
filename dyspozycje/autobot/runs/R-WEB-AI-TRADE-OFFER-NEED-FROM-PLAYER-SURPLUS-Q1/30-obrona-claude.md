# R-WEB-AI-TRADE-OFFER-NEED-FROM-PLAYER-SURPLUS-Q1 — obrona Operatora (runda 2, odpowiedź na zarzuty Evaluatora r1)

STATUS: BLOCK (techniczny: harness pomiaru `measure-ai-trade-offer-frequency*.cjs` zawiesza się w turze 10 na bazie f1886bacf i na kandydacie a6798ba19 — zarzuty 1, 2, 6 niezmierzone; decyzja orkiestratora wymagana, patrz UWAGI)
DOMAIN: GAME
TEMAT: R-WEB-AI-TRADE-OFFER-NEED-FROM-PLAYER-SURPLUS-Q1
GOAL: ilość odbioru AI od gracza wynika z nadwyżki gracza, nie ze sztywnego kroku 10; uczciwość wyceny, cooldown 15 i limit 1 oferty bez zmian.
BAZA: a6798ba19ebf8f2a0bdb826241240839b7167489 (kandydat, detached HEAD w worktree). Diff kodu nie zmieniony w tej rundzie.
ZMIANY-COMMIT: brak zmian kodu gry i testów w tej rundzie. Commit obejmuje wyłącznie ten plik raportu (`git add <ścieżka>`). SHA: patrz pole `sha` w StructuredOutput.

## Odpowiedzi na zarzuty Evaluatora

1. **Pomiar (a) — PRZYJMUJĘ zarzut, NIE ZMIERZONO.** Narzędzie `gra/tools/measure-ai-trade-offer-frequency-matrix.cjs` (MEAS_ARM=prepared, 150 tur, 3 ziarna x 3 relacje) uruchomione na kandydacie (`MATRIX_DIR=/tmp/claude-0/meas/matrix-cand`). Wszystkie komórki (1111/20, 1111/80, 1111/140, 2222/20) zakończyły się `stoppedBy: "blad: page.waitForFunction: Timeout 90000ms exceeded"` przy `turnsRun: 10`, `offers: 0`. Te wyniki NIE są danymi pomiarowymi i nie służą do porównania. Dowód odtwarzalności: probe natural (ziarno 1111, rel 80, 12 tur) na kandydacie i na bazie f1886bacf daje ten sam wynik (`turnsRun: 10`, `blad: ... Timeout 90000ms`) — problem leży w harnessie/grze w turze 10, nie w zmianie. Przyczyny nie diagnozowałem (poza zakresem tej rundy). Tabela przed/po: NIE ZMIERZONO.
2. **Zrzut Chromium (d) — PRZYJMUJĘ zarzut, NIE ZMIERZONO.** Okno oferty AI→gracz wymaga przejścia do tury, w której pojawia się oferta; harness zawiesza się w turze 10 (pkt 1), więc okna nie udało się wyrenderować. Chromium jest dostępny (`/usr/bin/chromium`, playwright działa: smoke 3 tury OK).
3. **Słaby test behawioralny — CZĘŚCIOWO PRZYJMUJĘ, bez zmian w kodzie.**
   - Przyjmuję: A3 (nadwyżka 100, wynik 10) nie rozróżnia starego i nowego zachowania, bo stary sufit też dawał 10 (`max(krok, ceil(-netRate))` = 10 przy netRate -10). Wynik 10 jest jednak poprawny: `floor(100/10 tur) = 10`.
   - Rozróżniają: A1 (nadwyżka 1000 → 100, stary kod 10) i A2 (400 → 40, stary 10) oraz A4. Mutacja potwierdzona przez Evaluatora: baza f1886bacf + test kandydata → `5 passed, 3 failed` (A1, A2, A4).
   - Odrzucam wymóg „realnych bramek wyceny” w teście jednostkowym: test z założenia stubuje `resolvePayloadPn`/`fairnessGate`/`evaluateExactPayload` (nagłówek pliku: „Bramki wyceny w tym tescie przepuszczaja”, sekcja D sprawdza bramkę). Realna wycena `resolveProposalPn`/`evaluateProposal` w main.ts jest niezmierzona — NIE ZMIERZONO.
4. **Wydajność pętli giveQty x receiveQty — PRZYJMUJĘ jako ryzyko, NIE ZMIERZONO w grze.** Liczby z Evaluatora (300 / 8 820 / 979 020 wywołań z atrapą) są zgodne z analizą kodu: pętla kończy się na pierwszym wykonalnym wyniku, więc koszt rośnie tylko gdy żadna para nie przechodzi bramek. Koszt realnego `resolveProposalPn` na turę NIE ZMIERZONO (pomiar w grze zablokowany jak w pkt 1). **Nie dodaję limitu pętli:** każdy próg byłby nowym progiem liczbowym, a dispatch wymaga użycia istniejących pojęć albo DECISION_REQUIRED. Patrz UWAGI.
5. **Balans: AI może poprosić o całą nadwyżkę gracza — ODRZUCAM jako defekt kodu, zostawiam jako decyzję.** Usunięcie `needMax` jest literalnym wykonaniem GOAL („ilość… na podstawie NADWYŻKI GRACZA… a nie ze sztywnego kroku”). Warunek wejścia pozostaje: AI musi mieć deficyt (`aiDeficits`), para musi przejść `fairnessGate` i `evaluateExactPayload`, a limit 1 oferty i cooldown 15 działają bez zmian (`main.ts`, nietknięte w kandydacie). Czy odbiór ma być dodatkowo ograniczony potrzebą AI — to decyzja produktowa (DECISION_REQUIRED), nie błąd.
6. **Scenariusz właściciela „jedno miasto, 20 obywateli, epoka kamienia i brązu” — NIE ZMIERZONO.** Wymaga żywej gry; harness zawiesza się w turze 10 (pkt 1), a narzędzie pomiarowe nie ma scenariusza jednego miasta z 20 obywatelami. Nie wykonano.
7. **Scalenie z aktualnym main — PRZYJMUJĘ, sprawdzone.** `git merge-tree --write-tree origin/main a6798ba19` → exit 0 (scalenie bez konfliktów z 159d443b4). Zmiana dotyka tylko `gra/src/game/ai-trade-proposal.ts`, którego main nie zmienił od f1886bacf (`git diff --stat f1886bacf origin/main -- gra/src/game/ai-trade-proposal.ts` nie pokazało zmian). Uwaga: `gra/src/main.ts` zmieniony na main w 103 liniach (poza zakresem tego tematu).
8. **Wyniki 5 bramek referencyjnych — PRZYJMUJĘ, uzupełnione.** Uruchomione na kandydacie (`cd gra && node tools/<test>.cjs`), surowe wyjścia:
   - `logic-test.cjs`: exit 0, ostatnia linia `PASS  [213] cityfix: pop1 territory radius is 5 (B min start)`.
   - `tech-tree-test.cjs`: exit 0, `tech-tree-test: 20 pass, 0 fail`.
   - `research-test.cjs`: exit 0, `ALL GREEN`.
   - `unit-replace-test.cjs`: exit 0, ostatnia linia `[OK] cross-type melee matrix passes for all 15 civilizations; no ranged/mount/siege/civilian/naval leak` (liczby PASS/FAIL nie wypisuje w ostatniej linii; exit 0 = zielone).
   - `combat-test.cjs`: exit 0, `All sanity checks passed.`

## TESTY (surowe, uruchomione w tej rundzie na a6798ba19)
- `npx tsc --noEmit` (gra/): exit 0.
- `node tools/ai-trade-need-from-surplus-test.cjs`: `8 passed, 0 failed`.
- `node tools/ai-trade-proposal-to-player-test.cjs`: `25 assertions passed`, exit 0.
- `node tools/ai-trade-proposal-branch-test.cjs`: `10 passed, 0 failed`, exit 0.
- `node tools/ai-trade-oneshot-overpay-limit-test.cjs`: exit 1, `FAIL: main.ts enqueue filter calls aiOneshotHandelOverpaysPlayer(...)` — znany dług bazowy #379 (Evaluator potwierdził identyczny FAIL na f1886bacf). NIE regresja tematu.
- 5 bramek referencyjnych: zielone (pkt 8).
- `git diff --check`: czysty.
- Pomiar częstości ofert: NIE ZMIERZONO (pkt 1). Chromium: NIE ZMIERZONO (pkt 2).

## BLOKADY
- Harness pomiarowy (`measure-ai-trade-offer-frequency.cjs`, `page.waitForFunction`) zawiesza się w turze 10 na bazie f1886bacf i na kandydacie — blokuje kryteria (a), (d), scenariusz właściciela. Naprawa harnessu jest poza zakresem tego tematu; wymaga osobnego tematu.
- Zależności: `gra/node_modules` zainstalowane przez `npm ci` w worktree (wymagane do testów). Bundle pomiarowe w `/tmp/claude-0/meas/` (poza repo).

## RUNDY
Obrona: runda 2 (odpowiedź na zarzuty Evaluatora r1). Limit 5 nie przekroczony.

## NASTĘPNY KROK
Decyzja orkiestratora:
1. Czy wysłać osobny temat naprawy harnessu pomiarowego (zawieszenie w turze 10, także na bazie) — bez tego kryteria (a), (d) i scenariusz właściciela nie mogą być spełnione.
2. Czy zaakceptować zmianę bez limitu pętli (pkt 4) czy wymagać zmierzonego kosztu tury przed PASS.
3. Czy odbiór AI ma pozostać nieograniczony potrzebą AI (obecny kod, zgodny z GOAL) czy ograniczony zapotrzebowaniem (pkt 5) — decyzja produktowa.
Po rozstrzygnięciu: Evaluator r2 na tym samym ID.

## UWAGI-DLA-ORKIESTRATORA
- Scenariusz właściciela („jedno miasto, 20 obywateli, kamień i brąz”) wymaga żywej gry w Chromium; obecny harness go nie obsłuży (pkt 6). Jeśli ma być sprawdzony w tym temacie, potrzebny osobny dispatch z innym narzędziem.
- Dług #379 (`ai-trade-oneshot-overpay-limit-test`) pozostaje czerwony na bazie i kandydacie — nie ruszany (zgodnie z dispatchem).
- Pliki `/tmp/claude-0/meas/*` są bundlami i logami pomiarowymi poza repo; do sprzątania po decyzji.

DEPLOY/PUSH: NIE WYKONANO

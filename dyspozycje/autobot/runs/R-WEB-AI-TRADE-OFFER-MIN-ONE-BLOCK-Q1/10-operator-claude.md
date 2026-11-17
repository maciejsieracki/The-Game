# R-WEB-AI-TRADE-OFFER-MIN-ONE-BLOCK-Q1 — raport Operatora (runda 1/5)

STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-AI-TRADE-OFFER-MIN-ONE-BLOCK-Q1
GOAL: oferta AI przy małej potrzebie = dokładnie jeden blok epoki umowy (Kamień 10 / Brąz 50 / Żelazo 100 szt.), a nie 3 bloki; limit 3× potrzeby działa powyżej jednego bloku; bez regresji QTY-CAP, bramki uczciwości, stałego sufitu pętli i braku oferty przy nadwyżce < 1 blok.

## Baza kodu (rozbieżność w dispatchu)

Dispatch podawał BAZĘ = 63a26921c jako „origin/main”. Git pokazuje inaczej: `origin/main` = 79abbf0bf (FALA 742, zawiera commit QTY-CAP c754ccaf4). Commit 63a26921c to gałąź dispatchu (`Dispatch: AI-TRADE-OFFER-MIN-ONE-BLOCK-Q1 i TEST-DEBT-BASE-RED-MAIN-Q2`) i NIE zawiera kodu z 3× capem (`git merge-base --is-ancestor c754ccaf4 63a26921c` = nie). Na 63a26921c tematu nie dało się wykonać. Operator pracował więc na `origin/main` 79abbf0bf (zgodnie z treścią DODATKU: „BAZA = aktualny origin/main ... NIE jest bazą kodu gałąź claude/..."). Wynik: commit oparty na 79abbf0bf. Orkiestrator powinien wyrównać BAZA/KANDYDAT w rejestrze.

## Przyczyna (zmierzona w kodzie)

`gra/src/game/ai-trade-proposal.ts`, funkcja `selectAiTradeBarter`:
- przed zmianą: `aiNeedPerTurn = max(receiveStep, ceil(-netRate))` — podłoga do bloku wbudowana w potrzebę, następnie `needCapMax = normalize(3 × aiNeedPerTurn)`. Przy potrzebie 5 w Brązie: 3 × 50 = 150 (3 bloki) — dokładnie błąd z dispatchu.

## Zmiana

- `rawAiNeedPerTurn = max(0, ceil(-netRate))` (surowa potrzeba, bez podłogi).
- `needCapMax = max(receiveStep, normalize(mnożnik × rawAiNeedPerTurn))`.
  - Potrzeba mała (3× < blok): oferta = 1 blok.
  - Potrzeba duża: bez zmian (cap = 3× potrzeba w pełnych blokach).
  - Potrzeba 0: 1 blok (nie 0).
- Dalej bez zmian: `feasibleReceiveMax = min(receiveMax, needCapMax)` — gdy nadwyżka gracza < 1 blok, `receiveMax` = 0 i brak oferty; bramka uczciwości (`fairnessGate`) i `evaluateExactPayload` nadal decydują; sufit `boundedQtyCandidates` nietknięty.

## Pliki (allowlista)

- `gra/src/game/ai-trade-proposal.ts` (zmiana logiki, 10 linii netto).
- `gra/tools/ai-trade-offer-min-one-block-test.cjs` (NOWY test, 12 asercji).
- `gra/src/data/wikiBundle.json` (regeneracja `node tools/bundle-wiki-for-game.cjs`, zmiana jednej linii z nowym zdaniem).
- `docs/encyklopedia/pojecia/handel-surowcami-dyplomacja.md`, `docs/PORADNIK-GRACZA/12-dyplomacja.md` (jedno zdanie w każdym).
- `gra/src/main.ts`: NIE zmieniany (wywołanie nie wymagało zmiany). `diplomacy-ai-offer-balance.ts`: NIE zmieniany.

## Kryteria binarne (dispatch)

- (a) potrzeba 5/turę, nadwyżka 300: Kamień → 10, Brąz → 50, Żelazo → 100. PASS (A1 10, A2 50, A3 100; krok potwierdzony A0).
- (b) potrzeba 200/turę w Brązie → 600 (cap 3×, bez regresji). PASS (B1 = 600). Dodatkowo potrzeba 60 → 150 (C1).
- (c) nadwyżka gracza < 1 blok → brak oferty. PASS (D1 30<50 → null; D2 9<10 → null).
- (d) mutacja (powrót do podłogi 3 bloków) czerwieni. PASS: mutant (`needMultiplier * Math.max(receiveStep, rawAiNeedPerTurn)`) → `8 passed, 4 failed`, exit 1. Mutacja na kopii pliku w scratchpadzie, plik przywrócony z kopii (potwierdzone: 12/12 po przywróceniu, `rawAiNeedPerTurn` obecne).
- (e) testy istniejące: wszystkie zielone (patrz TESTY).
- tsc: 0 błędów.
- `git diff --check`: czysto.

## TESTY (surowe wyniki)

Nowy test `node tools/ai-trade-offer-min-one-block-test.cjs`: `ai-trade-offer-min-one-block-test: 12 passed, 0 failed`.

Istniejące (z `gra/`):
- ai-trade-qty-cap-test: 18 passed, 0 failed
- ai-trade-need-from-surplus-test: 12 passed, 0 failed
- ai-trade-oneshot-overpay-limit-test: 10 assertions passed
- ai-trade-proposal-to-player-test: 25 assertions passed
- ai-trade-proposal-branch-test: 10 passed, 0 failed
- diplomacy-trade-era-table-test: 185 pass, 0 fail
- diplomacy-trade-era-ai-test: 14 pass, 0 fail
- diplomacy-trade-era-deal-test: 14 pass, 0 fail
- diplomacy-trade-era-explicit-test: 51 pass / 0 fail
- diplomacy-ai-offer-balance-test: 29 passed, 0 failed
- diplomacy-value-catalog-test: 82 pass, 0 fail
- diplomacy-acceptance-points-test: 304 pass, 0 fail

Bramki referencyjne (po `npm ci` w worktree, 71 pakietów):
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: ALL GREEN
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: All sanity checks passed.

tsc: `npx tsc --noEmit` exit 0, 0 linii wyjścia.

## Rust (dług, nie ruszany)

`rust-port/` poza zakresem. NIE ZMIERZONO, czy port Rust ma tę samą podłogę 3×bloki; do sprawdzenia przy REPIN (dług: ten sam wzorzec co pn_per_szt→pn_per_blok z #416).

## BLOKADY

Brak. Rozbieżność bazy opisana wyżej (nie blokuje; zastosowano origin/main).

## RUNDY

1/5 (wynik: PASS, bez rund obrony).

## UWAGI-DLA-ORKIESTRATORA

1. BAZA/KANDYDAT w dispatchu: 63a26921c nie jest origin/main; poprawna baza 79abbf0bf. Gałąź dispatchu nie zawiera kodu QTY-CAP.
2. Dispatch-plik `00-dispatch.md` istnieje tylko na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, nie na origin/main (wymóg odczytu z origin/main nie został spełniony; odczytano DODATEK z tej gałęzi).
3. Wnioski z zakresu poza tematem: brak.
4. Zakaz nowych sesji przestrzegany (nie wywoływano spawn_task/create_session/create_trigger/send_later).

## NASTĘPNY KROK

Evaluator (SONNET): weryfikacja kryteriów (a)–(e), mutacji (d) i diffu względem 79abbf0bf.

DEPLOY/PUSH: NIE WYKONANO

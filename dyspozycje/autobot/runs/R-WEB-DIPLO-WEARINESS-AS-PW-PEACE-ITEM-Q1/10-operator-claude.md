# R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1 — raport Operatora, runda 2/5

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1
GOAL: zmęczenie wojną jako pozycja PW przy pokoju (Z = round(C·x²)) po stronie niebędącej proponującym; tabela = decyzja AI; rabat 60% usunięty; bezwarunkowy pokój wynika z tej samej funkcji.
ZMIANY/COMMIT: baza = 12baa4d15 (kod r1; drzewo `gra/` identyczne z 572be1b, różni się tylko raportem FC r1), + merge `origin/main` (c9c161ec3) → merge commit 95f3823f9; wikiBundle regenerowany narzędziem (konflikt rozwiązany regeneracją, diff 1 linia). Commit tej rundy: SHA w polu `sha` raportu StructuredOutput (commit po merge).
Allowlista: `gra/src/game/{war-weariness,diplomacy-proposals,ai}.ts`, `gra/src/main.ts` (przekazanie `wearinessInfo`, typ), `gra/src/ui/{diplomacyAcceptanceBalance,diplomacyAudience}.ts`, `gra/tools/diplo-weariness-*` (nowe i zmienione), `gra/tools/pw-weary-table-browser-*` (nowe), `dyspozycje/.../evidence/` i ten raport. Nie tknięto `gra/data/` poza tym, co było w r1; `WERSJE.md`, manifest, rust-port — nietknięte.

## Co zrobiono w tej rundzie

1. **Jedna prawda (ai.ts ↔ tabela PW).** Nowa funkcja `wearinessPeaceX(L)` = clamp((L−progChetnosci)/(progKoncaZmeczenia−progChetnosci), 0, 1); `wearinessPeaceItemPw` liczy `round(C·x²)` z niej. Gałąź pokoju bezwarunkowego w `ai.ts` używa `wearinessPeaceX(wearyLevel) >= 1` (dawniej `wearinessUnconditionalEndDue`). `wearinessUnconditionalEndDue` zostaje dla ticku AI↔AI.
2. **Test behawioralny (nie tautologia)** — `gra/tools/diplo-weariness-pw-behavior-test.cjs`: wywołuje prawdziwe `decideAIDiplomacy` (ai.ts) i `evaluateProposal` (diplomacy-proposals.ts) dla tur 10–20 × mnożniki ceny 0,7 / 1,0 / 1,5 (mnożnik civMult zaciskany w `WAR_PEACE_PARAMS.cenaPokoju`). Asercje: (b) AI proponuje pokój bezwarunkowy ⇔ bilans tabeli ≥ 0; (b2) bilans rośnie z turą przed progiem (Z rośnie, C stałe); (b3) silniejsza AI podaje wymaganą cenę C w odrzuceniu. Wynik: **84 PASS / 0 FAIL**.
   - Mutacja `basePn = cenaPokojuPn` (wyłączenie Z) w `diplomacy-proposals.ts`: **54 PASS / 30 FAIL** (czerwone); mutacja przywrócona, zielone 84/0.
3. **Test UI wiersza Z** — `gra/tools/diplo-weariness-pw-row-ui-test.cjs`: `wearinessPwRowHtml` (brak wiersza przy Z=0/undefined; etykieta „Zmęczenie wojną +N PW"; tooltip z turami wojny, utraconymi miastami, procentem zmęczenia) i przeniesienie wiersza do kolumny „Oni oddają" w `renderPnBalancePanelHtml`. **7 PASS / 0 FAIL.**
4. **Tooltip** — `WearinessRowInfo` {turnsAtWar, lostCities, level} przechodzi z `evaluateProposal` (`wearinessInfo`) → `previewNegotiationEntry` (main.ts) → `responderPreview` → wiersz. Wiersz zostaje przy zablokowanym wierszu (r1 zarzut 6).
5. **Silniejsza AI (decyzja ABC wariant A, DO POTWIERDZENIA):** reguła siły bez zmian (miasto ≥ pełna cena C). Komunikat w odrzuceniu: „Silniejsza AI wymaga miasta o wartości ≥ C PW (zmęczenie nie obniża tej ceny)"; wiersz Z nie jest pokazywany w tym przypadku (brak Z w wyniku). Widoczność komunikatu w stole — potwierdzona w Chromium (patrz niżej).
6. **Rabat 60%** — nadal usunięty (grep: brak `wearinessPeacePriceFactor` i `rabatCenyPokojuMax` w src/data poza opisem `_pozycjaPW`).

## Zrzuty (kryterium e) — Chromium, częściowo

`gra/tools/pw-weary-table-browser-test.cjs` (Vite + Playwright, Chromium `/usr/bin/chromium`): prawdziwe `evaluateProposal` → prawdziwe `renderPnBalancePanelHtml` w przeglądarce. Pliki:
- `dyspozycje/autobot/runs/R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1/evidence/stol-wczesna.png` (tura 11, L=0,55): „Zmęczenie wojną +17 PW", tooltip: tury wojny 11 · utracone miasta 0 · zmęczenie 55%.
- `.../evidence/stol-pozna.png` (tura 15, L=0,75): „Zmęczenie wojną +427 PW", tooltip: tury wojny 15 · utracone miasta 0 · zmęczenie 75%.
- `.../evidence/stol-silna.png` (tura 15, AI silniejsza): brak wiersza Z; komunikat „…Silniejsza AI wymaga miasta o wartości ≥ 615 PW (zmęczenie nie obniża tej ceny)…" widoczny.
- Wynik runnera: **BROWSER PASS** (wiersz Z rośnie z turą; komunikat silnej AI w DOM; brak błędów strony).

**NIE ZMIERZONO w pełnej grze:** nie uruchomiono builda gry z hookami `?civTest=1` ani realnego stołu negocjacji w sesji gry; stany „wczesny/późny" to tury 11/15 w module testowym, a dane panelu składa minimalny obiekt wokół prawdziwego wyniku silnika. Zrzuty NIE mają stylów gry (brak CSS panelu w entry), stąd surowy wygląd i pozycja „Bilans (netto) undefined" — artefakt harnessu (brakujące pola obiektu panelu), NIE błąd gry; nie zweryfikowano wizualnie wyglądu w grze.

## Zarzut 3 r1 (kierunek AI → gracz) — NIE ZROBIONE

Wiersz Z po stronie gracza przy pokoju **proponowanym przez AI** nie został zaimplementowany (gałąź AI-proponent w `evaluateProposal` nie liczy C ani Z). Gałąź bezwarunkowa AI (`ai.ts`) nadal daje ofertę bez tabeli dla kierunku AI→gracz. Wymaga osobnego kroku (ustalenie, jaka C ma być użyta dla oferty AI, bo oferta AI ma cenę 0).

## Odkrycie ważne dla orkiestratora (liczba C zależy od tury)

Cena pokoju C = 500 × civMult **przed** `turyBezOgraniczenAi` i `min(1, civMult)` po nim (`diplomacy-war-peace-profile.ts` ~l.441). Dla profilu użytego w teście: **C = 615 przed progiem, 500 po nim** (w turze 20 odczyt „wymagane 500"). Stąd tabela z dispatchu (C=500, tury 10–16: 0/14/56/125/222/347/500) jest prawdziwa tylko dla C=500; rzeczywiste Z w turze 11 to 17, w turze 15 to 427. Decyzja, czy C ma być stała, należy do właściciela (nie zmieniono).

## TESTY (surowe wyniki tej rundy)

- `tsc --noEmit` (gra/): exit 0.
- `git diff --check`: czysto.
- Bramki referencyjne (§6 R-PROC-AUTOBOT):
  - Logika `logic-test.cjs`: LOGIC OK (213/213).
  - Drzewo technologii `tech-tree-test.cjs`: 20 pass, 0 fail.
  - Badania `research-test.cjs`: ALL GREEN.
  - Wymiana jednostek `unit-replace-test.cjs`: WSZYSTKIE TESTY ZIELONE (21/21).
  - Walka `combat-test.cjs`: All sanity checks passed.
  - Czerwone-na-bazie: NIE ZBADANO osobno (pomiar bazy 12baa4d15 nie wykonany w tej rundzie).
- Testy weariness/peace: `diplo-weariness-as-pw-peace-item-test` 76/0; `diplo-weariness-pw-behavior-test` 84/0 (nowy); `diplo-weariness-pw-row-ui-test` 7/0 (nowy); `ai-war-weariness-peace-test` 101/0; `diplo-weariness-unconditional-end-test` 22/0 (zaktualizowane asercje wiązania na `wearinessPeaceX`; mutant U6 nadal wykrywany); `diplo-peace-balance-accept-test` 32/0; `diplo-war-peace-sim-test` 25/0; `diplo-peace-weaker-seeks-city-only-test` 35/0; `diplomacy-proposal-test` 200/200; `diplo-war-peace-gate-test` 24/0; `diplo-war-peace-main-guard-test` 35/0; `diplomacy-ai-balance-test` 36/36; `diplo-peace-stance-wiring-test` 10/0; `diplo-weariness-city-only-test` 30/0; `diplo-weariness-20-turns-test` 30/0; `diplo-weariness-display-test` 52/0.
- Chromium: `pw-weary-table-browser-test.cjs` BROWSER PASS (patrz wyżej).
- NIE ZMIERZONO: pełny zestaw `tools/diplo-*.cjs`; `ai-trade-oneshot-overpay-limit-test` jest czerwony z góry (dług #379, nie ruszany).

## BLOKADY

- Zarzut 3 r1 (AI→gracz, Z w kolumnie gracza) — NIE ZROBIONE (patrz wyżej).
- Pełna gra w Chromium z `?civTest=1` (dwa momenty wojny na żywym stole) — NIE ZROBIONE; zastąpione harnessem komponentowym na prawdziwym silniku.
- Rozstrzygnięcie ABC silniejszej AI (wariant A zastosowany; wariant B = przyjąć R = C − Z i zmienić testy C1/C2/S3b/S3c) — DO POTWIERDZENIA przez właściciela.
- Stała/zmienna C w turze (615 → 500) — do decyzji właściciela (patrz odkrycie).
- Dług Rust: REPIN po wdrożeniu (usunięty rabat 60%, nowa pozycja PW w tabeli).

## RUNDY

2/5 (runda Operatora po odrzuceniu FC r1). Wynik: pkt 1 (Chromium) — CZĘŚCIOWO (komponent, nie gra); pkt 2 (test behawioralny) — ZROBIONE, mutacja czerwona; pkt 3 (ai.ts jedna prawda + kierunek AI→gracz) — CZĘŚCIOWO (ai.ts tak, kierunek nie); pkt 4 (UI/tooltip/test UI) — ZROBIONE; pkt 5 (bramki) — ZROBIONE; pkt 6 (tabela cen tur 10–20) — ZROBIONE w tym raporcie (C 615→500, Z jak wyżej).

NASTĘPNY KROK: Evaluator/FC — zweryfikować commit, decyzja właściciela (wariant silnej AI, C w turze), osobny temat na kierunek AI→gracz (Z po stronie gracza przy ofercie AI), potem zrzut w grze z hookami civTest.
UWAGI-DLA-ORKIESTRATORA: `gra/node_modules` zainstalowane przez `npm ci` (nieśledzone); pliki `.npmci.log`, `.tsc.log` w korzeniu worktree — nieśledzone, nie commitowane.
DEPLOY/PUSH: NIE WYKONANO

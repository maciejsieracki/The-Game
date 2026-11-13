STATUS: INTEGRATION_PENDING (runda 3/5, CZĘŚCIOWO: tylko N2 i pole N1/N6; reszta niedomknięta — NIE PASS)
DOMAIN: GAME (WEB)
TEMAT: R-WEB-TRUCE-Q1
GOAL: rozejm jako propozycja stołu (5/10/15 tur), baza PW 200 (ZAŁOŻENIE), wspólne bramki z pokojem, wygaśnięcie bez kary, złamanie w oknie, AI, UI, zapis/odczyt.
ZMIANY-COMMIT: baza 55c8cd2c6 (web-wip/TRUCE-r2) -> commit r3 (SHA w sekcji niżej, po commicie). Zmienione: gra/src/game/diplomacy-war-gates.ts (`PEACE_CURRENCY_ACTION_IDS` += 'rozejm', komentarz), gra/tools/diplomacy-war-gates-test.cjs (+3 linie: rozejm walutowy = pokój, rozejm+praca), gra/src/game/diplomacy-pn-engine.ts (pole `DiploPairMeta.truceUntilTurn?` opcjonalne, bez wywołań), ten raport. Brak zmian w gra-robocza, WERSJE.md, rust-port, src-tauri, Cargo.toml, diploListHud.ts.
TESTY:
- `npx tsc --noEmit` (gra): exit 0.
- `node tools/diplomacy-war-gates-test.cjs`: 22 pass / 0 fail (r2 było 19; nowe linie N2 przechodzą).
- `node tools/diplo-truce-r1-test.cjs`: 29 pass / 0 fail (bez zmian).
- `node tools/diplomacy-test.cjs`: 148 passed / 0 failed.
- `node tools/diplomacy-peace-lock-test.cjs`: 9 pass / 0 fail.
- `git diff --check`: czysty.
- Mutacja N2 (usunięcie 'rozejm' z zestawu): NIE_ZMIERZONO osobnym skryptem; test pokrywa to liniami `rozejm+złoto` i `rozejm+praca` (oczekiwane fail przy mutacji, nie uruchomiono).
- Zrzut Chromium: NIE_ZROBIONO (brak UI rozejmu).
BLOKADY (niezrobione z GOAL r3 — do r4):
1. N1 main.ts: akceptacja rozejmu -> `truceUntilTurn` z długością 5/10/15; tik `truceExpiryAction` (wygaśnięcie bez kary/flagi); `isTruceBreach` (kara jak za pakt); integracja z `peaceLock`/`transferCityByTreaty`. NIE ZROBIONE (main.ts 42423 linii; grep truce w main.ts = 0).
2. N1/N3 `diplomacy.ts` zdarzenie 'rozejm' i `diplomacy-proposals.ts` (`ProposalActionId`) — NIE ZROBIONE; rozejm nadal NIE jest w `ProposalActionId`, więc nie da się go zawrzeć z UI/AI.
3. N2 test: P8 (rozejm z 400 żywności) nadal przechodzi przez PW, nie przez walutę; zmiana P8 na złoto NIE ZROBIONA.
4. N3 przegląd miejsc 'pokoj' (`diplomacy-proposals.ts` ~1954-1972, :2600 `SWEETENER_COUNTER_ELIGIBLE`, `diplomacyAcceptanceBalance.ts`, `diplomacy-ai-offer-balance.ts`, `diplomacyDealDisplay.ts`) — NIE_ZBADANE w tej rundzie.
5. N4 `ai.ts` (rozejm gdy słabsze i wojna < 20 tur, pokój po 20; progi N-1/N/N+1) — NIE ZROBIONE.
6. N5 UI (przełącznik pokój/rozejm + 5/10/15 w modalu, hak `__truceTestDebug`, zrzut Chromium pełnego cyklu) — NIE ZROBIONE. `gra/node_modules` zainstalowane przez `npm ci` i do usunięcia po etapie.
7. N6 save/load stanu rozejmu i reset nowej gry — NIE ZROBIONE.
8. N7 mutacje gałęzi cyklu życia w main.ts/AI — NIE ZROBIONE (helpery w peace-lock mają mutanty M4/M5 z r2).
ZAŁOŻENIA (luki bez pytania): (a) pole `truceUntilTurn` jest nazwane zgodnie z GOAL i nie koliduje z `peaceUntilTurn`; (b) `PEACE_CURRENCY_ACTION_IDS` z 'rozejm' jest jedyną zmianą bramki walutowej, bo konsumenci (`diplomacy-proposals.ts:1078,2100`, `diplomacyTradeBasket.ts:1296`) czytają tylko `isCurrencyProposalForbiddenDuringWar`.
ANTY-HALUCYNACJA: kod r3 zweryfikowany wyłącznie testami wymienionymi wyżej; wszystkie punkty BLOKAD są NIE ZROBIONE, nie „do weryfikacji”.
RUNDY: 3/5 (r2 FAIL; r3 domyka tylko N2 i pole N1; FC r3 powinien zamknąć częściowo, r4/r5 na pozostałe punkty)
NASTĘPNY KROK: runda 4 Operatora: N1 (main.ts + ProposalActionId 'rozejm' + DiploPairMeta.truceUntilTurn), N4 (ai.ts), N5 (UI + Chromium), N6 (save/load), N3 (przegląd 'pokoj'), mutacje N7; następnie Evaluator/FC.
DEPLOY/PUSH: NIE WYKONANO

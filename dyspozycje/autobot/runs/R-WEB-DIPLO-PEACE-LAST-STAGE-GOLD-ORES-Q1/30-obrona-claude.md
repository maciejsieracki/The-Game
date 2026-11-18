# R-WEB-DIPLO-PEACE-LAST-STAGE-GOLD-ORES-Q1 — obrona Operatora (runda 2/5, odpowiedź na raport Evaluatora bb67e6a45)

STATUS: BLOCK (częściowe: zarzuty 5-8 przyjęte i naprawione; zarzuty 1-3 przyjęte, okablowanie NIE wykonane)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-PEACE-LAST-STAGE-GOLD-ORES-Q1
GOAL: GOAL 1 (funkcja czysta + kolejność w danych) spełniony; GOAL 2, 3, 5 NIE spełnione; GOAL 4 bez zmian (nie dotykano).
ZMIANY-COMMIT: 73625f084 (baza b232d4f9f): gra/data/war-weariness-params.json (progWymuszonyPokoj 1.0 przywrócone), gra/src/game/peace-tail-payment.ts (+peaceTailPnPerUnit: cena za blok / krok z diplomacy-value-catalog), gra/tools/diplo-peace-last-stage-payment-test.cjs (bez zapisu/unlink, +T11, +T12). Raport: ten plik (commit osobny).

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ — NIE WYKONANO. settlePeaceDue nadal nie jest wywoływana przez ai.ts, war-weariness.ts, diplomacy-proposals.ts ani main.ts. Zachowanie gry bez zmian.
2. PRZYJMUJĘ — NIE WYKONANO. Brak wiersza/tooltipa w diplomacyAcceptanceBalance.ts (bez wartości z realnej płatności nie ma czego pokazać).
3. PRZYJMUJĘ — NIE WYKONANO. rozejm-pokoj.md i wikiBundle.json nie opisują reguły, bo gra jeszcze jej nie stosuje; opis przed wdrożeniem byłby nieprawdziwy.
4. PRZYJMUJĘ — CZĘŚCIOWO. Wycena z katalogu: peaceTailPnPerUnit (cena za blok / krok, ta sama tabela co handel). Zapasy płatnika (Spichlerz/Skarbiec w main.ts) NIE podłączone.
5. PRZYJMUJĘ — WYKONANO. progWymuszonyPokoj przywrócone do literału 1.0; diff JSON względem origin/main = tylko blok ogonPokoju.
6. PRZYJMUJĘ — WYKONANO. T11: każdy klucz ogona ma cenę > 0 w katalogu (zloto, braz, zelazo, ruda, ruda_cyny, ruda_zelaza).
7. PRZYJMUJĘ — WYKONANO. Test ładuje moduły z pamięci (esbuild stdin, resolveDir = src/game); brak zapisu plików, brak unlink, brak cleanup.
8. PRZYJMUJĘ — WYKONANO. T12: P = wearinessPeaceCashPn(0,5), D = peaceAiAiPaymentPn(P, 100, 100) = 0, settlePeaceDue(duePn=D) pełne pokrycie, pusty ogon.

ZMIERZONO (surowe wyjście, worktree 73625f084, npm ci --ignore-scripts w gra/):
- tsc --noEmit: exit 0
- diplo-peace-last-stage-payment-test: LIVE 12/12 zielone; M1 wykryty (1 czerwony), M2 wykryty (1), M3 wykryty (2); OK, exit 0
- diplo-peace-pw-power-ratio 48/0; price-wiring 14/0; price-decay 13/0; balance-accept 32/0; winner-proposal-table 77/0; sensible-deals 63/0; weariness-city-only 26/0; war-peace-sim 25/0; wiki-weariness-rate-consistency 18 OK/0 FAIL
- NIE ZMIERZONO w tej rundzie: logic-test, tech-tree, research, unit-replace, combat (nie uruchomiono). Chromium/UI: NIE ZMIERZONO.

BLOKADY (do decyzji właściciela, ABC):
A. Zakaz zł/surowców w ofercie pokoju (R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1, diplomacy-proposals.ts „nonCitySweetener”): czy wycofujemy go dla ogona pokoju (miasta → złoto → metale), a rozejm zostaje bez złota?
B. Gracz jako strona płacąca: czy ogon ma być liczony także wtedy, gdy silniejsza AI odrzuca ofertę (r5Gate stronger wymaga miasta o pełnej cenie)?
C. Zapasy płatnika: które zasoby liczą się jako dostępne (Spichlerz/Skarbiec) i czy AI płaci z tych samych zapasów?
D. Czy ogon wchodzi także do AI↔AI (runAiAiPeaceTick, d.pay), czy tylko do ofert gracz↔AI?

NASTĘPNY KROK: runda 3, okablowanie: (a) ai.ts aiPeaceCityDuePn + komenda oferuj_miasto_za_pokoj z ogonem; (b) diplomacy-proposals.ts: zamiana nonCitySweetener dla pokoju po decyzji A; (c) main.ts: zapasy płatnika; (d) tooltip w diplomacyAcceptanceBalance.ts; (e) rozejm-pokoj.md + wikiBundle generatorem; testy integracyjne AI i gracza.
UWAGI-DLA-ORKIESTRATORA: wspólna funkcja settlePeaceDue nadal nie ma wywołania (zarzut 1), więc ogon nie zmienia gry. Worktree zostawiono: /home/user/The-Game/.claude/worktrees/wf_cefc1bb9-415-3 (gra/node_modules z npm ci --ignore-scripts; do sprzątnięcia po integracji). Test nie tworzy plików tymczasowych.
RUNDY: 2/5
DEPLOY/PUSH: NIE WYKONANO

# Obrona Operatora — R-WEB-HARNESS-NNS-GATE-ENDTURN-Q1 (runda 2, Operator HAIKU 5.5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (harness testów; zero zmian gra/src, gra/data)
TEMAT: R-WEB-HARNESS-NNS-GATE-ENDTURN-Q1
GOAL: harness live przechodzi bramkę „Zakończ turę” (NNS) bez zmiany reguły gry; runner dymny 3 ziarna × 60 tur.
BAZA: b24fcc7a08612a5b50cfa673a08ffe641f51b1d1 (kandydat, origin/main)

## Odpowiedzi na zarzuty Evaluatora (c87eea91)

1. Zarzut: `live-nns-gate-smoke-test.cjs` zwraca exit 0 dla PAUSED (ryzyko fałszywego PASS). **PRZYJMUJĘ.**
   Poprawka: kody wyjścia rozdzielone — PASS = 0, PAUSED = 3 (niepełny bieg, do wznowienia przez slot), INFRA = 2, FAIL = 1.
   Dowód: `gra/tools/live-nns-gate-smoke-test.cjs` ostatnia linia `process.exit(...)`; `node --check` = OK.

2. Zarzut: 3 ziarna × 60 tur nie zostały odtworzone przez Evaluatora. **PRZYJMUJĘ jako uwagę, bez nowego dowodu.**
   Ten Operator nie uruchamiał ponownie pełnego biegu (60 tur × 3 ziarna przekracza limit 590 s na jedno wywołanie Bash, a bieg wymaga wznowień przez slot). Liczby 60/60 z raportu Operatora (10-operator-claude.md) są deklaracją, nie dowodem tej rundy. Zmiana kodu tej rundy dotyczy tylko kodu wyjścia (pkt 1), który nie zmienia logiki biegu.

3. Zarzut: pkt 4 dispatchu (podpięcie `war-duration-measure.cjs`) pominięty. **ODRZUCAM z dowodem (uzasadnione odstępstwo).**
   Dispatch wymagał podpięcia tylko, gdy to „jedna linia wywołania”. Runner ma własne obejście bramki i pętlę endTurn przez `__aiTradeWiringTestDebug`:
   `gra/tools/war-duration-measure.cjs` ok. linii 165–178: `nnsGateBlocked()` → `grantPlayerGold(300)` / `grantPlayerFood(300)` → `dbg.endTurn()`.
   Podpięcie helpera wymagałoby przepisania pętli, czego dispatch zakazuje.

4. Nota: test włącza hooki wyłączające koniec gry (tylko `?civTest=1`, `suppressVictoryForTest` / `disableVictoryCheckForTest` w `gra/src/main.ts`). **PRZYJMUJĘ jako notę, bez zmiany kodu.** Reguła bramki NNS nietknięta; hooki są test-only i działają już przed tą rundą.

## ZMIANY-COMMIT
- `gra/tools/live-nns-gate-smoke-test.cjs` — 3 wiersze dodane, 1 usunięta (kody wyjścia).
- `dyspozycje/autobot/runs/R-WEB-HARNESS-NNS-GATE-ENDTURN-Q1/30-obrona-claude.md` — ten raport.

## TESTY
- `node --check gra/tools/live-nns-gate-smoke-test.cjs` → OK.
- `git diff --check` → czysto.
- Bramki ogólne (tsc, logic 213, tech-tree 20, research 33, combat 6, ai-test 297/0) — NIE_ZMIERZONO w tej rundzie: zmiana dotyczy wyłącznie pliku narzędziowego poza `gra/src`, nie wchodzi do bundla gry.
- Pełny bieg 3 × 60 tur — NIE_ZMIERZONO w tej rundzie (patrz zarzut 2).

## BLOKADY
Brak.

## RUNDY
2/5 (runda 1: Operator; runda 2: obrona).

## NASTĘPNY KROK
Evaluator: sprawdzić kod wyjścia 3 dla PAUSED oraz zgodność z dispatchem; opcjonalnie pełny bieg 3 × 60 tur przez wznowienia slotu (NIE_ZMIERZONO przez Operatora).

## DEPLOY/PUSH: NIE WYKONANO

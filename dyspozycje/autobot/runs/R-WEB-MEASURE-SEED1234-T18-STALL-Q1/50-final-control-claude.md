# R-WEB-MEASURE-SEED1234-T18-STALL-Q1 — raport Final Control

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (narzędzie pomiarowe; gra/src bez zmian)
TEMAT: R-WEB-MEASURE-SEED1234-T18-STALL-Q1
GOAL: ustalić przyczynę zatrzymania cannot-end seed 1234 t18, naprawić runner (tools only), potwierdzić bieg >=40 tur.

ZMIANY/COMMIT: kandydat 2db3055f8; `git merge-base --is-ancestor 5b9959d86 2db3055f8` = TAK. `git diff --stat` = 7 plików (+683/-2):
gra/tools/diplomacy-harder-measure-run.cjs, gra/tools/measure-stall-diag.cjs (nowy), oraz pliki dowodowe w katalogu runu
(10-operator, seed1234-harder0.jsonl/summary.json, stall-1234.json/png). Wszystko w allowliście; zero zmian w gra/src, gra-robocza, gra-kanon, WERSJE.md, rust-port.

ZARZUTY EVALUATORA: [] | obrona: brak. Brak zarzutów do oceny.

WERYFIKACJA DIAGNOZY: stall-1234.json: stallTurn 18, tableLen 1, endScreen [], konsola kończy się
`[EndTurn] blocked: oferta handlowa AI czeka na decyzję gracza` — spójne z przyczyną (bramka hasBlockingAiTradeOfferForPlayer, nie błąd gry, nie NNS).
Hook `__aiTradeWiringTestDebug` istnieje w main.ts:32330 (reject używany przez poprawkę). summary: endTurn 40, stop null, 39 wierszy JSONL, aiOffersRejected 1 (zgodne z JSONL: 38x0, 1x1).

TESTY (własne, surowe wyjście, worktree na 2db3055f8):
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0
- unit-replace-test: 21/21
- combat-test: 6/6
- ai-economy-measure-hook-test: 23/23 zielone
- diplomacy-harder-measure-hook-test: 15 zielonych, 0 czerwonych
Własnego biegu 40 tur nie powtarzałem (NIE ZMIERZONO przeze mnie; opieram się na artefaktach w repo, spójnych wewnętrznie).

BLOKADY: brak.

UWAGI (ODDAJ, nie FAIL):
1. Raport Operatora przywołuje `run-40t-seed1234-harder0.log`, którego nie ma w commicie (dowodem jest jsonl+summary).
2. Poprawka zweryfikowana tylko na seed 1234 / harder 0; ziarna 4242 i 7 oraz wariant harder 1 NIE ZMIERZONE po poprawce.
3. Poprawka tylko w diplomacy-harder-measure-run.cjs; ai-economy-measure-run.cjs i inne runnery (też mogą stać na tej ofercie) nie zmienione — poza zakresem diagnozy, ale seed 1234 w pomiarach ekonomii/wojen nadal może się zatrzymać.
4. Założenie „pasywny gracz odrzuca ofertę" — decyzja ABC właściciela (wpływ na porównywalność ON/OFF).
UWAGI-DLA-ORKIESTRATORA: rozważ przeniesienie rejectAwaitingAiOffers do wspólnej bazy runnerów (nowy temat R-WEB-MEASURE-*).

RUNDY: 1/5 Operator; Final Control PASS-WITH-NOTES.
NASTĘPNY KROK: integracja orkiestratora (merge 2db3055f8 do main, bramki), ABC o odrzucaniu/akceptowaniu ofert.
DEPLOY/PUSH: NIE WYKONANO

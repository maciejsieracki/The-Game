# R-WEB-MEASURE-SEED1234-T18-STALL-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (diagnoza runnera; błąd gry NIE stwierdzony — zachowanie zgodne z regułą gry)
TEMAT: R-WEB-MEASURE-SEED1234-T18-STALL-Q1
GOAL: odtworzyć zatrzymanie cannot-end seed 1234 w turze 18, ustalić przyczynę, naprawić runner (tools only) i potwierdzić bieg ≥40 tur.

## Przyczyna (zmierzona)
Zatrzymanie NIE jest błędem gry i NIE jest bramką NNS. Przyczyna: wisząca oferta handlowa AI->gracz
(`negotiationTable`: id `negot-umowa_handlowa-0-34-t18-1`, proposer 34, responder 0, actionId `umowa_handlowa`),
która blokuje „Zakończ turę" przy włączonej opcji „Wymagaj rozpatrzenia ofert handlowych"
(`hasBlockingAiTradeOfferForPlayer`; konsola: `[EndTurn] blocked: oferta handlowa AI czeka na decyzję gracza`).
Runner nie podejmuje decyzji gracza wobec ofert, więc stał.

Stan w chwili zatrzymania (przed poprawką): canEnd=false; battleState: wszystko false; nnsGateBlocked=false;
isEndTurnInProgress=false; endScreen=[] (brak ekranu zwycięstwa/porażki); 1 miasto gracza.
Nakładki: `civ-wiki-hub` (pusta) i `civ-welcome-screen-root` (ekran „ODKRYŁEŚ NOWĄ CYWILIZACJĘ"). Ekran powitalny NIE figuruje
w `canPlayerInitiateEndTurn`, więc nie jest przyczyną.

Dowody w tym katalogu: `stall-1234.json` (stan, nakładki, konsola), `stall-1234.png` (zrzut ekranu w chwili zatrzymania).

## Zmiany (tylko allowlista)
- `gra/tools/diplomacy-harder-measure-run.cjs`: `rejectAwaitingAiOffers()` — przed sprawdzeniem canEnd odrzuca oferty AI->gracz
  (`__aiTradeWiringTestDebug.reject(id)`), z drugą próbą po odrzuceniu; pole `aiOffersRejected` w wierszu JSONL i w summary.
  Założenie pasywnego gracza: odrzucenie. Wpisy z proposer=0 są nietknięte; gracz = owner 0 (zgodnie z tym ziarnem).
- `gra/tools/measure-stall-diag.cjs` (nowy): diagnostyka zatrzymania (zrzut, nakładki, stan, ostrzeżenia EndTurn z konsoli).
- Bez zmian w `gra/src/**`.

## TESTY
- Odtworzenie PRZED poprawką: seed 1234, harder 0 → `stop: cannot-end, tura: 18` (17 wierszy). Dwa z czterech startów Chromium
  padły na SEGV przy starcie (infra; ponowienie z nowym profilem działa). Przyczyna SEGV: NIE_ZMIERZONO.
- Po poprawce: seed 1234, harder 0, `--turns 40` → `endTurn: 40, stop: null, rows: 39, aiOffersRejected: 1`
  (surowe wyjście: `run-40t-seed1234-harder0.log`; wiersze: `seed1234-harder0.jsonl`; summary: `seed1234-harder0.summary.json`).
- Bramki: tsc --noEmit exit 0; logic-test LOGIC OK (213/213); tech-tree 20 pass / 0 fail; research PASSED 33 / FAILED 0;
  unit-replace 21 [OK] / 0 FAIL; combat 6/6; ai-economy-measure-hook-test 23 ZIELONE / 0 CZERWONE;
  diplomacy-harder-measure-hook-test 15 zielonych / 0 czerwonych.
- Bundle: `vite build --outDir <poza repo>` OK.

## BLOKADY
- Brak. Nie zmierzono wpływu odrzucenia oferty na wynik ekonomii/dyplomacji (oba ramiona ON/OFF dostają tę samą regułę).

## RUNDY
1/5. Ostatni werdykt: brak (Operator).

## NASTĘPNY KROK
Evaluator: weryfikacja diagnozy (dowody w tym katalogu) i poprawki runnera.
Decyzja właściciela (ABC, nie wybieram sam): czy pasywny gracz w pomiarach ma ODRZUCAĆ oferty (obecne założenie),
czy ACCEPTOWAĆ — wpływa to na porównywalność serii ON/OFF.

UWAGI-DLA-ORKIESTRATORA: w tym ziarnie oferta pojawiła się raz w 40 turach. Warto sprawdzić (poza zakresem tego tematu, nie zakładam),
czy przy włączonej opcji „Wymagaj rozpatrzenia ofert handlowych" oferty AI->gracz nie zawieszają biegów ON w innych ziarnach.

DEPLOY/PUSH: NIE WYKONANO

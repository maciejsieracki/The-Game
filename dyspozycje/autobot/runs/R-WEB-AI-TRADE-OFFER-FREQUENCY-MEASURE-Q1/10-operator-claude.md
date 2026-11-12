# R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1 — raport Operatora (runda 3/5, Sonnet)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar; hooki testowe wylacznie za ?civTest=1; zero zmian regul handlu, bramek i balansu)
TEMAT: R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1
GOAL: zmierzyc, jak czesto AI sklada graczowi oferte handlowa w pelnej grze (>=3 ziarna x >=150 tur x >=3 relacje, tryb przyspieszony), bez narzucania progu.
BAZA: 486c4ef2d (detached). Commit z kodem/raportem = pole `sha` wyniku Workflow.

## WYNIK (jedno zdanie)
W grze naturalnej (gracz pasywny, 1 miasto) AI NIE zlozylo ani jednej oferty HANDLOWEJ (cyklicznej ani jednorazowej) w 6 ziarnach x 3 relacjach (18 przebiegow, 3 ziarna po 150 tur); jedyne oferty AI->gracz to DYPLOMATYCZNE (rozejm, trybut_oferta, ~1,3-2,0 na 100 tur). W ramieniu „prepared” (kontakt + technologia Wymiany, tylko ziarno 1111) AI zlozyla 1-2 cykliczne oferty handlowe na ~150 tur (0,67-1,34 / 100 tur), kazda z aktywnym „Przyjmij”.

## ZMIANY (allowlista DODATKU r2/r3)
- gra/src/game/civ-test-hooks.ts: `civTestRuntime = { skipRender }` (domyslnie false) — tryb przyspieszony; ustawiany tylko z haka z ?civTest=1.
- gra/src/main.ts (tylko w bloku `?civTest=1` + 1 linia petli renderu):
  - `renderer.render` pomijany gdy `civTestRuntime.skipRender` (flaga nieosiagalna bez haka);
  - nowe haki `__aiTradeWiringTestDebug`: `setFastMode(on)`, `isFastMode()`, `battleState()` (preBattleOpen/pendingAuto/sceneOpen/summaryOpen/resolving), `flushBattles()` (ten sam flush co watchdog, tylko gdy nic nie blokuje), `closeBattleSummary()`; w `state()` pole `playerCities`.
  - (z r2, bez zmian) `civTestSeedOverride`, `setRelationTotal`, `entries`, `relTotalAi`.
- gra/tools/measure-ai-trade-offer-frequency.cjs: tryb przyspieszony (MEAS_FAST, domyslnie 1); rozstrzyganie okna bitwy; wznawianie przez trwaly profil Chromium (MEAS_PROFILE) + quickSave/loadSlot; klasyfikacja ofert wg actionId; `playerCities`; MEAS_LOGRE (diagnostyka konsoli).
- gra/tools/measure-ai-trade-offer-frequency-matrix.cjs (NOWY): wznawialny runner macierzy ziarno x relacja, stan w plikach komorek, tabela zbiorcza summary.md/json.
- evidence/: matrix-natural-r3/, matrix-prepared-seed1111-r3/, mutation-gate-r3/.
- Nie zmieniono: reguly gry, JSON balansu, WERSJE.md, rust-port.

## NAPRAWY z FC FAIL r2
1. Tryb przyspieszony: ~7 s/ture -> ~1,6 s/ture (10 tur: secs=16 z ~70 s startu; pomiar w warunkach obciazonej maszyny, load avg ~16, wiec dalsze tury 2-4 s). Bez flagi hak nieobecny (MEAS_GATE: `{"seedSeen":271828,"hookPresent":false,"pass":true}`, evidence/mutation-gate-r3/gate-noflag-r4.json).
2. Okno preBattleOpen: przyczyna r2 = bitwa odlozona w kolejce (`pendingAuto`), ktorej `clearBattles` nie widzial (szukal tylko `.pb-overlay`). Teraz petla do 12 iteracji: klik „Auto” w `.pb-overlay` -> `closeBattleSummary` -> `flushBattles` -> czekaj; w przebiegach `battleActs` np. {auto:22, summary:22, flush:3}; zero zawieszen na preBattleOpen.
3. Runner wznawialny: przy limicie czasu (MEAS_MAX_SEC, w matrixie 400 s) quickSave do slotu `meas-cell` w trwalym profilu + stan czastkowy (liczniki, `seen`, offerLog, perTurn) w pliku komorki; kolejne wywolanie robi loadSlot i kontynuuje (`resumeLog`: turnAtSave == turnAfterLoad w kazdym wznowieniu). Dowod zgodnosci wznowienia: ziarno 1111 (2 wznowienia) daje te same oferty (tury 11 i 17, rozejm) co przebieg bez wznowienia (smoke 20 tur) i co 4444 bez wznowien. Blad po wznowieniu nie nadpisuje punktu kontrolnego (plik .err).
4. Testy: patrz nizej (bramka bez flagi, mutacje setRelationTotal/entries, powtarzalnosc).
5. Surowe wyniki: evidence/ (kazda komorka osobny JSON z perTurn i offerLog). UWAGA: w surowych JSON macierzy naturalnej pola `offers`/`offersOneShot` z runnera r3a licza WSZYSTKIE wpisy jednorazowe (takze rozejm/trybut); klasyfikacja handel vs dyplomacja jest w summary.md/json (liczona z offerLog.actionId, handel = handel/umowa_handlowa/umowa_szlakow wg SENSIBLE_TRADE_ACTION_IDS). Runner po zmianie liczy handel osobno (`offersOneShotAll`, `otherActions`).

## TABELA ZBIORCZA — ramie naturalne (matrix-natural-r3/summary.md)
Relacja = total 0-200 (20 niska, 80 srednia, 140 wysoka), przypinana przed kazdym endTurn; po endTurn relacja wraca do ~29 (dryf mierzony, `relDrift=true`, `relPinnedBeforeEnd=true`).

| ziarno | relacje | tury | oferty handlowe (cykl./jednor.) | oferty dyplomatyczne | /100 tur (dypl.) | Przyjmij aktywne | pary |
|---|---|---|---|---|---|---|---|
| 1111 | 20/80/140 | 150 | 0/0 | rozejm x2 (t11,t17) | 1,33 | 0 | - |
| 2222 | 20/80/140 | 101 (miasto gracza utracone w t102) | 0/0 | rozejm x2 | 1,98 | 0 | - |
| 3333 | 20/80/140 | 102 (utracone t103) | 0/0 | rozejm x2 | 1,96 | 0 | - |
| 4444 | 20/80/140 | 150 | 0/0 | rozejm x2 | 1,33 | 0 | - |
| 5555 | 20/80/140 | 99 (utracone t100) | 0/0 | trybut_oferta x2 | 2,02 | 0 | - |
| 6666 | 20/80/140 | 150 | 0/0 | trybut_oferta x1, rozejm x2 | 2,00 | 0 | - |

Wyniki sa identyczne dla trzech relacji w obrebie ziarna (relacja 20/80/140 nie zmienila liczby ofert w tym ramieniu).

## RAMIE „prepared” (evidence/matrix-prepared-seed1111-r3/) — gorna granica, NIE pomiar naturalny
Tylko ziarno 1111 (reszta NIE_ZMIERZONO: maszyna obciazona, ~25 tur na wywolanie po wznowieniu); prepare(): kontakt + technologia Wymiany + wyciszenie innych klas ofert.
- relacja 20: 149 tur, 2 oferty cykliczne (sol->glina, drewno->glina), 2 z aktywnym „Przyjmij” (1,34/100 tur) — NIEDOKONCZONE o 1 ture (limit czasu).
- relacja 80: 150 tur, 1 oferta (drewno->glina), 1 aktywne (0,67/100 tur) — OK.
- relacja 140: 149 tur, 1 oferta (sol->glina), 1 aktywne (0,67/100 tur) — NIEDOKONCZONE o 1 ture.

## OBSERWACJE / OGRANICZENIA (jawnie)
- Gracz jest pasywny (1 miasto, bez wojska/technologii handlu). W ziarnach 2222, 3333, 5555 AI zdobywa/usuwa jedyne miasto gracza w turach ~100-103 (nie zbadano mechanizmu; w logu tylko `tier=unrest` Testpolis i `warsztat_oblezniczy` AI w t96), runner konczy wtedy przebieg (`stoppedBy = "gracz bez miast"`) — te ziarna maja 99-102 tury, nie 150. Spelnione >=3 ziarna x 150 tur: 1111, 4444, 6666.
- Zero ofert handlowych w ramieniu naturalnym oznacza: przy tym profilu gracza (brak kontaktu/technologii handlu jak w grze naturalnej do ~t150) warunki wiringu nie zachodza; nie dowodzi, ze gracz aktywny zobaczylby 0. NIE_ZMIERZONO dla gracza aktywnego.
- „Jednorazowe oferty” z r2 to w rzeczywistosci oferty dyplomatyczne (rozejm/trybut), nie handel — korekta wniosku r2.
- Dryf relacji: po kazdym endTurn relacja ~29 (przypinanie przed endTurn); interpretacja „relacja 20/80/140” = wartosc widziana przez AI w turze AI.
- Powtarzalnosc: ten sam przebieg (ziarno 2222, relacja 20) wykonany dwukrotnie (przebieg macierzy i przebieg diagnostyczny): perTurn (tura, pending, deals, table, relTotalAi, cities) identyczny na 101 turach, offerLog identyczny, autoBattles 1=1. Ponadto 3 relacje x ten sam seed daja ten sam przebieg ofert; smoke r3 repeat-A/B identyczny.
- Pary surowcow w ramieniu naturalnym: brak (0 ofert); w „prepared”: sol->glina, drewno->glina.

## TESTY (surowe)
- `npx tsc --noEmit -p .` (gra/): TSC=0.
- Bramki (EXIT=0 kazda): logic-test `LOGIC OK (213/213)`; tech-tree-test `20 pass, 0 fail`; research-test `PASSED: 33 / FAILED: 0 ... ALL GREEN`; unit-replace-test `WSZYSTKIE TESTY ZIELONE (21/21)`; combat-test `COMBAT TEST: 6/6 pass`.
- Bez `npm run build/dev`; bundle vite (`vite build`) do katalogu poza repo.
- Bramka bez flagi (MEAS_GATE=1, civSeed=999): pass:true (hook nieobecny, ziarno 271828) — evidence/mutation-gate-r3/gate-noflag-r4.json; wcześniejszy mutant `civTestSeedOverride` bez isCivTestEnabled wykryty w r2 (gate-MUTANT-seedgate-removed-r3.json).
- Mutacje (jeden mutant: setRelationTotal = no-op + entries = []; 20 tur, ziarno 1111, relacja 40): oryginal `relTotalAfter=40, offers=2, relBeforeEnd=[40,40,40]`; mutant `relTotalAfter=30, offers=0, relBeforeEnd=[30,29,9]` — oba wykryte (evidence/mutation-gate-r3/mut.json vs orig.json). Mutant zbudowany do katalogu poza repo, zrodlo przywrocone (grep MUTANT = 0).
- Przebiegi macierzy: 18 komorek natural (6 ziaren x 3 relacje), 3 komorki prepared; wszystkie pliki w evidence/.

## BLOKADY
Brak blokujacych. Ograniczenia jak wyzej (gracz pasywny; prepared tylko 1 ziarno; 2 komorki prepared o 1 ture krotsze niz 150).

## WNIOSEK O CZESTOSCI (bez progu narzuconego; liczby do decyzji wlasciciela)
- Naturalna gra, gracz pasywny: 0 ofert handlowych AI->gracz w ~2000 tur-przebiegow laczonych (18 komorek); oferty dyplomatyczne 1,3-2,0/100 tur.
- Warunki spelnione (prepared, 1 ziarno): 0,67-1,34 cyklicznych ofert handlowych/100 tur, kazda z aktywnym „Przyjmij”, 1-2 pary na 150 tur.
- Decyzja ABC (zostawic / tolerancja par) wymaga ewentualnie osobnego pomiaru z aktywnym graczem (poza zakresem tego tematu).

## RUNDY
3/5 (Operator Sonnet po 2 nieudanych rundach Haiku; uzasadnienie w DODATKU r3). Obrona, Evaluator i Final Control poza tym etapem.

NASTEPNY KROK: Obrona Operatora (Haiku) -> Evaluator -> Final Control.
DEPLOY/PUSH: NIE WYKONANO

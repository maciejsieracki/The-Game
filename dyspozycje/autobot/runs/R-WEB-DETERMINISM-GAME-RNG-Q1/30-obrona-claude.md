# R-WEB-DETERMINISM-GAME-RNG-Q1 — Obrona Operatora (runda 1/5, HAIKU)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DETERMINISM-GAME-RNG-Q1
GOAL: to samo ziarno gry daje ten sam przebieg (stan co turę) w trybie ?civTest=1 i w grze z ziarna nowej gry; zamiana nieseedowanych `Math.random` w pętli tury na generatory z ziarnem; test zakazu `Math.random` w gra/src/game/**; pomiar powtarzalności.
BAZA: kandydat 54559dedc861303a3088fad90b98bbe03201a9a7 (baza ed95085a2). Obrona startuje od 54559dedc.
ZMIANY-COMMIT: b6894754c (obrona, zarzut 3: game-rng.ts reużywa mulberry32 z map/gen-helpers.ts). Jedyny nowy commit tej obrony; raport w commicie tym (SHA końcowy w sekcji DEPLOY/PUSH / odpowiedzi orkiestratora).

## Odpowiedzi na zarzuty Evaluatora (20-evaluator-claude.md, 26e8ab651)

### Zarzut 1 — dowód mutacyjny na poziomie przebiegów tylko dla wioski
Odpowiedź: PRZYJMUJĘ (zakres dowodu), BEZ nowego pomiaru.
- Evaluator wykonał mutację C (cofnięcie losowań wioski) i wynik: pomiar rozjeżdża się (6 przebiegów = 3 różne skróty: cc7ffd39b215 x2, 1ac1b43d1499 x3, 8da3e7f6d584 x1). Przyjmuję ten dowód jako rzeczywisty: losowania wioski (main.ts ~32514 `villageGoldAmount`, ~32550 `pickVillageReward`) są przyczyną rozbieżności w scenariuszu R-WEB-DETERMINISM-SAME-SEED (ziarno 2222, rel 20, 30 tur, tryb przyspieszony).
- Przyjmuję zarzut, że mutacje pojedynczych miejsc cs-war (main.ts ~41203), scout (main.ts ~44469), cs-accept (main.ts ~42362/~42385) i 8 miejsc ID nie mają dowodu przebiegowego. Dla nich tabela §1 w 10-operator-claude.md opisuje stan przed/po na poziomie źródła, a NIE dowiedziony wpływ na pomiar. Korekta do 10-operator §1: „przyczyna w pomiarze” dowiedziona tylko dla wioski; pozostałe — „źródło niedeterministyczne, wpływ w pomiarze NIE_ZMIERZONO”.
- Nie wykonano teraz mutacji pojedynczych (cs-war, scout, cs-accept, ID): NIE_ZMIERZONO. Powód: w worktree brak gra/node_modules (zainstalowany tylko symlink do node_modules z sąsiedniego worktree, do testów statycznych), dysk 2,0 GB wolnego przy starcie obrony, a pomiar wymaga Chromium i ~5 minut na przebieg. Minimalny zbiór konieczny dla scenariusza 30-turowego = losowania wioski (wniosek Evaluatora, przyjęty).

### Zarzut 2 — skrót stanu bez jednostek, skarbca i zasobów
Odpowiedź: ODRZUCAM obowiązkowość rozszerzenia skrótu w tej rundzie; zostawiam jako ograniczenie jawne.
- Cytat DODATKU (00-dispatch-DODATEK-claude.md, Wymagane pkt 5): „Powtórz pomiar ... Jeśli rozbieżność zostanie, wskaż pierwszą turę i pole (dodaj skrót stanu: liczba jednostek, skarbiec, zasoby, relacje, tabela ofert)”.
- Warunek („jeśli rozbieżność zostanie”) NIE został spełniony: po naprawie 0 rozbieżności (fast 2222: 6/6; normal 2222: 3/3; fast 1717: 3/3; patrz §2 w 10-operator-claude.md i evidence/*.json). Rozszerzenie skrótu było więc warunkowe, nie obowiązkowe.
- Zastrzeżenie uczciwości: identyczność jest udowodniona tylko dla pól perTurn (cities, pending, deals, table, rejCd, relTotalAi, relAtDecision), NIE dla liczby jednostek, skarbca i zasobów. Zapis w raporcie i w UWAGI-DLA-ORKIESTRATORA. Rozszerzenie runnera (tools/measure-*.cjs) = osobny temat, nie wykonany tutaj.

### Zarzut 3 — duplikacja mulberry32 (game-rng.ts vs istniejący generator)
Odpowiedź: PRZYJMUJĘ — poprawka wykonana, commit b6894754c.
- Przed: game-rng.ts zawierał kopię mulberry32; istniejący generator jest w gra/src/map/gen-helpers.ts:57 (eksport `mulberry32`). Dispatch wymagał użycia istniejącego generatora.
- Po: gra/src/game/game-rng.ts importuje `mulberry32` z '../map/gen-helpers' i re-eksportuje go (`export { mulberry32 }`). Usunięto kopię.
- Dowód równoważności (skrypt w scratchpadzie, transpilacja TS przez esbuild/typescript z node_modules): dla 10 ziaren (0, 1, 2, 2222, 1717, 0x5eed0001, -1, 0xffffffff, 123456789, 4294967302) × 20000 próbek = 200000 par, różnic 0. Wyjścia są identyczne, więc pomiar 54559dedc pozostaje ważny dla strumieni RNG.
- Dowód bramek po poprawce (surowe wyjścia, worktree b6894754c, gra/):
  - `./node_modules/.bin/tsc --noEmit` → exit 0 (TSC_EXIT=0)
  - `node tools/determinism-same-seed-test.cjs` → PASS C1 main.ts (trafien=2, oczekiwane 2), WYNIK: PASS, exit 0
  - `node tools/logic-test.cjs` → LOGIC OK (213/213), exit 0
  - `node tools/tech-tree-test.cjs` → 20 pass, 0 fail, exit 0
  - `node tools/research-test.cjs` → PASSED: 33 / FAILED: 0 / TOTAL: 33, exit 0
  - `node tools/unit-replace-test.cjs` → WSZYSTKIE TESTY ZIELONE (21/21), exit 0
  - `node tools/combat-test.cjs` → COMBAT TEST: 6/6 pass, exit 0
- Nie ruszano pozostałych kopii mulberry32 (culture-religion.ts, civ-roster.ts, villageRewards.ts już używa game-rng, itd.) — poza zakresem tematu; zgłoszone w UWAGI-DLA-ORKIESTRATORA.

### Zarzut 4 — pełny determinizm walk automatycznych nieosiągnięty; wyjątki testu
Odpowiedź: PRZYJMUJĘ jako ograniczenie celu, NIE naprawiam w tym temacie.
- Potwierdzam cytatem z testu (gra/tools/determinism-same-seed-test.cjs, linia 66–67): `auto-battle-power.ts|const rng = input.rng ?? Math.random;` z uzasadnieniem „wołane z main.ts (6 miejsc) i battle/mapFieldBattle.ts:476 BEZ rng. Wpływ na stan: TAK … NIE naprawione w tym temacie (poza allowlistą)”.
- Dlatego cel „ten sam przebieg” NIE jest osiągnięty dla walk automatycznych. Nie wolno tego twierdzić w komunikacji. Wniosek: osobny temat (patrz UWAGI).
- combat.ts:890 i siege.ts:659 (wyjątki z „NIE_ZMIERZONO” w teście): wpływ na stan możliwy, niezbadany. Bez zmian w tym temacie.
- Wyjątki w teście są kluczowane treścią linii (nie numerem), co przyjmuję jako poprawne (zarzut Evaluatora uznany za uwagę, nie błąd).

## Lista Math.random w gra/src/game/** (plik:linia, wpływ na stan) — stan po obronie
Źródło: wyjście `node tools/determinism-same-seed-test.cjs` (sekcja B), uruchomione po poprawce b6894754c:
- city-founding.ts:63 (domyślny parametr rand) — wpływ TAK tylko gdy wołający nie podaje rand; ai.ts:3215 podaje.
- city-founding.ts:90 (opts?.rand ?? Math.random) — jw.
- city-state-difficulty.ts:120 i :146 (domyślny rng) — main.ts podaje gameStreamRng.
- scout-auto-explore.ts:211 i :263 (domyślny rng) — main.ts podaje rng.
- ai-cs-absorption.ts:285 (domyślny rng rollAiCsAccept) — main.ts podaje gameStreamRng(cs-accept).
- combat.ts:890 (opts.rng ?? Math.random) — wpływ możliwy; NIE_ZMIERZONO wołających.
- siege.ts:659 (opts.rng ?? Math.random) — wpływ możliwy; NIE_ZMIERZONO wołających.
- auto-battle-power.ts:156 (input.rng ?? Math.random) — WPŁYW NA STAN TAK; poza zakresem (patrz zarzut 4).
- main.ts: po zmianach 2 wystąpienia (SEED startowe, newSeed przy nowej grze) — dozwolone (test C1).

## Pomiar
Obrona NIE powtórzyła pomiaru przebiegów (NIE_ZMIERZONO w tej rundzie: brak Chromium/node_modules w worktree, dysk 2,0 GB). Dowody pomiarowe pozostają z kandydata 54559dedc (sekcja §2 w 10-operator-claude.md, evidence/*.json): fast 2222 6/6 identyczne (skrót 8da3e7f6d584), normal 2222 3/3, fast 1717 3/3 (skrót ce32c5a5bd03). Zmiana b6894754c nie zmienia wyjść mulberry32 (200000 próbek, 0 różnic), więc wniosek o identyczności przenosi się na b6894754c przez równoważność strumieni — jest to WNIOSEK, nie nowy pomiar.

## UWAGI-DLA-ORKIESTRATORA
1. Temat osobny (wysoki priorytet dla celu „pełny determinizm”): R-WEB-DETERMINISM-AUTO-BATTLE-RNG-Q1 — auto-battle-power.ts:156 (resolveAutoBattleByPower, wołane z main.ts 6× bez rng i z battle/mapFieldBattle.ts:476) oraz combat.ts:890 / siege.ts:659. Wymaga pomiaru wpływu na stan.
2. Osobny mały temat: rozszerzenie skrótu stanu w tools/measure-ai-trade-offer-frequency.cjs o liczbę jednostek, skarbiec, zasoby (wymóg z audytu, zarzut 2).
3. Ryzyko niezmierzone (z 20-evaluator UWAGI): `_detIdSeq` (main.ts:2008) startuje od 0 po przeładowaniu strony i nie jest zapisywany w zapisie gry; ID mid-turn (`detIdSuffix`) mogą się zderzyć z ID jednostek wczytanych z zapisu w tej samej turze, jeśli salt i pozycja są takie same. Naprawa wymagałaby zapisu licznika w formacie zapisu — dispatch zakazuje zmiany formatu bez migracji. Osobny temat z testem wczytania zapisu.
4. Wielu kopii mulberry32 w repo (culture-religion.ts, civ-roster.ts, i inne) — kandydat na osobny drobny temat porządkowy.
5. Nie utworzono żadnych sesji ani zadań (zakaz z dispatchu). Nie integrowano, nie deployowano, nie pushowano.

RUNDY: 1/5 (obrona r1; brak FAIL przed obroną)
NASTĘPNY KROK: Evaluator (SONNET) weryfikuje obronę na commicie b6894754c (zarzut 3 zamknięty dowodem równoważności; zarzuty 1, 2, 4 odrzucone/przyjęte jako ograniczenia z jawnym NIE_ZMIERZONO), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

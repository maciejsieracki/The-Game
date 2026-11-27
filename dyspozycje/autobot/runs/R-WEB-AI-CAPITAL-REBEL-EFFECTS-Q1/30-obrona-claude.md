STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-CAPITAL-REBEL-EFFECTS-Q1 (tag CAPREBEL)
GOAL: skutki buntu stolicy AI przy ≥ 2 miastach — nowa stolica, Pałac/budynki, Mennica, efekty stolicy, zwycięstwo/eliminacja, dyplomacja, crash, round-trip; tabela skutek | z kodu | zmierzone żywo | ocena (obrona rundy 1 wg FC c26d0bf58)
ZMIANY/COMMIT: baza 2c4404b5d (kandydat). Zmiany: gra/src/main.ts (+4 linie: read-only pola `treasuryOf`, `explicitCapitalOf` w `__capRebelReadTestDebug`); gra/tools/caprebel-capital-live.cjs (zwycięstwo WŁĄCZONE, `wzrostSurowcowZEpoka: true`, odczyt `gameOver` z `__defeatTestDebug.isGameOver`, odczyt skarbca i jawnej stolicy, flaga `--control 1`); dyspozycje/analizy/AI-BUNT-STOLICY-SKUTKI-2026-11-27.md (przepisany); dane/capital-s4242-5t-buntu-max.txt, dane/capital-s4242-5t-kontrola-max.txt (nowe). SHA: patrz commit obrony (czubek).
TESTY:
- Odpowiedzi na zarzuty:
  1. (Mennica/Pałac, b) PRZYJMUJĘ w części „brak próby”: wykonano 2 biegi live po 5 tur (bunt i kontrola) z zapisem stanu Mennicy co turę — `mennicaAnyCities` = [] w każdym wierszu, `buildingsOf` = [] w każdym wierszu. Budowa Mennicy wymaga hooka ZAPISU (nie ma go w allowliście), więc NIE ZMIERZONO pozostaje z powodem; propozycja osobnego tematu w UWAGACH.
  2. (Efekty stolicy / skarbiec, c) PRZYJMUJĘ: runner odczytuje skarbiec (`treasuryOf`) i jawną stolicę. Dane: bunt t1..t6 = 0,16,17,18,19,22; kontrola = 0,9,5,88,63,72. Trajektorie rozchodzą się od tury 2, więc efekt stolicy NIE jest wyodrębniony (NIE ZMIERZONO z uzasadnieniem). Korupcja nie odczytana (brak hooka).
  3. (Zwycięstwo, d) PRZYJMUJĘ i NAPRAWIONO: wygrana włączona (usunięte `disableVictoryCheckForTest` i `suppressVictoryForTest`); `gameOver` odczytywane z `__defeatTestDebug.isGameOver` (main.ts ~31697) = false we wszystkich wierszach obu biegów (zamiast null); `ownerEliminated` = false.
  4. (−99, f) PRZYJMUJĘ: −99 to `REBEL_FACTION_OWNER_ID` (society-breakdown.ts ~232), nie wartość relacji. `getDiploRelation` (main.ts ~11206) ma wyjątek tylko dla `isBarbarian` (barbarians.ts ~54: `ownerId === BARBARIAN_OWNER_ID`); dla −99 zwraca relację domyślną neutralną. „neutralni” jest zgodne z kodem, a nie anomalią. Wojny AI↔frakcja NIE ZMIERZONO.
  5. (zapis, g) PRZYJMUJĘ: doc był błędny. `capitalCityIdByOwner` JEST serializowane (main.ts ~42791) i odczytywane (~52692–52694). Bunt (`transferCityToRebelFactionWithLedger`, ~41815–41821) zmienia tylko `ownerId` i nie czyści mapy. Odczyt `explicitCapitalOf` = null we wszystkich wierszach, więc w tym scenariuszu wpis jawny nie istnieje. Round-trip NIE ZMIERZONO (brak biegu z zapisem).
  6. (bunt vs podbój) PRZYJMUJĘ: dodano analizę z kodu. Podbój: `maybeRelocateThreatenedAiCapital` (~40332, zapis jawny ~40370) i `runCapitalCapturePlunder` (zapis/kasowanie ~40788–40790). Bunt nie woła żadnej z nich. Skutek: nowa stolica = najstarsze pozostałe miasto bez wyboru; ryzyko odbicia miasta z przywróceniem starej stolicy (jawny wpis) opisane, NIE ZMIERZONO. Ocena: PODEJRZANE, z pytaniem DECISION_REQUIRED (A/B/C) w dokumencie.
  7. (poziom maksymalny) PRZYJMUJĘ i NAPRAWIONO: `wzrostSurowcowZEpoka: true` (ON) w MAX_PARAMS; `__settingsLive.getSettings()` zwraca `wzrostSurowcowZEpoka: true`, `kosztJednostekPace: wysoki`, `difficulty: hard`, `kulturaReligiaLevel(AI): trudny`, `diplomacyWarLevel: trudna`. Uzasadnienie „maksimum” dla dwustanowej flagi (ON = wyższa produkcja) jest w dokumencie.
  8. (procedura: ai-test/combat/unit-replace) PRZYJMUJĘ i WYKONANO (wyniki z surowego wyjścia, exit 0):
     - `node tools/ai-test.cjs`: `ai-test: 297 passed, 0 failed`
     - `node tools/combat-test.cjs`: `COMBAT TEST: 6/6 pass`
     - `node tools/unit-replace-test.cjs`: `[unit-replace-test] WSZYSTKIE TESTY ZIELONE (21/21)`
- Bramki po zmianie main.ts (wszystkie uruchomione w tej rundzie):
  - `npx tsc --noEmit` (gra/): exit 0
  - `node tools/ai-city-rebellion-gate-test.cjs`: `WYNIK: PASS=37 FAIL=0`
  - `node tools/ai-city-rebellion-news-test.cjs`: `WYNIK: PASS 24/0`
  - `node tools/logic-test.cjs`: `LOGIC OK (213/213)`
- Żywy bieg buntu: `node tools/caprebel-capital-live.cjs --dist /tmp/caprebel-dist-r1 --turns 5 --seed 4242` (bundle `vite build --outDir /tmp/caprebel-dist-r1`, bez `npm run build`): verdict NOWA-STOLICA-PO-BUNTCIE, owner 13, city16 → city17 od t2, `errors` = [], gameOver false wszędzie, ownerEliminated false.
- Żywy bieg kontrolny: `... --turns 5 --seed 4242 --control 1`: verdict KONTROLA-BEZ-BUNTU, `errors` = [], gameOver false.
- Dane surowe: `dyspozycje/autobot/runs/R-WEB-AI-CAPITAL-REBEL-EFFECTS-Q1/dane/capital-s4242-5t-buntu-max.txt`, `.../capital-s4242-5t-kontrola-max.txt`.
- Nie uruchamiałem ponownie biegu 3-turowego z rundy 1 (dane zostawione w `capital-s4242-3t.txt`, wygrana wyłączona).
BLOKADY:
- Mennica (b): NIE ZMIERZONO — brak hooka zapisu (budowa) poza allowlistą rundy; wymaga zgody orkiestratora na osobny hak civTest.
- Efekt stolicy na skarbiec i korupcję (c): NIE ZMIERZONO jako wyodrębniony efekt — 1 ziarno, trajektorie rozchodzą się; wymaga wielu ziaren lub hooka korupcji.
- Zapis/wczytanie po buncie (g): NIE ZMIERZONO (brak biegu z zapisem).
- Ścieżka podboju i odbicia miasta (ryzyko starego wpisu): NIE ZMIERZONO.
- Wojny AI↔frakcja: NIE ZMIERZONO.
- Pytanie gry (DECISION_REQUIRED, bez blokowania zamknięcia pomiaru): wariant A/B/C polityki nowej stolicy po buncie (opis w dokumencie, sekcja „Pytanie do właściciela”).
RUNDY: 2/5 (runda 1: FC c26d0bf58 FAIL-by-objections; runda 2: ta obrona)
NASTĘPNY KROK: FC (Sonnet) sprawdza zmiany: main.ts read-only (+4 linie), runner, doc, dane. Decyzja gry (A/B/C) — pytanie do właściciela wg ZASAD ABC, nie blokuje.
UWAGI-DLA-ORKIESTRATORA:
- Proponowany osobny temat (decyzja orkiestratora, nie zakładałem sam): hak ZAPISU w bloku `?civTest=1` do postawienia Mennicy w stolicy (i ewentualnie wymuszenia korupcji) → odblokuje (b) i (c). Zakres: tylko blok testowy, nie logika gry.
- Znalezisko poza zakresem: `disableVictoryCheckForTest` i `suppressVictoryForTest` nadal istnieją w innych runnerach; nie ruszałem.
- Znalezisko poza zakresem: runner rundy 1 zostawia wynik `gameOver: null`; w tej rundzie naprawione w CAPREBEL runnerze.
- Dispatch rundy 2 zakładał „Dysk ≥ 6 GB”; przed startem było 16 GB wolnych.
DEPLOY/PUSH: NIE WYKONANO

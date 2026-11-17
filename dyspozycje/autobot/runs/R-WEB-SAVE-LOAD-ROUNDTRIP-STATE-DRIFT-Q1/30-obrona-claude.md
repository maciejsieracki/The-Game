STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SAVE-LOAD-ROUNDTRIP-STATE-DRIFT-Q1
GOAL: zapis -> wczytanie (nowa sesja) -> t+1..t+10 daje ten sam skrot stanu co przebieg ciagly (>=2 ziarna); klasyfikacja round-tripu; test regresji + mutacja; bramki. Obrona odpowiada na zarzuty Evaluatora z 74bd3f9c6 (kandydat dba2720ba).
BAZA: cb29ce7af57fbeb667b144ff7bbf4f3c1ccae2a7 (origin/main). KANDYDAT (startowy): dba2720ba4a68b6ca7cea4e218f735d8821f8cf2. Zmiany tej rundy: patrz ZMIANY/COMMIT.
ZMIANY/COMMIT: commit obrony (SHA w polu sha StructuredOutput) zawiera:
  - gra/tools/save-load-roundtrip-state-drift-test.cjs (poprawki zarzutow 1 i 2, patrz nizej)
  - dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-ROUNDTRIP-STATE-DRIFT-Q1/30-obrona-claude.md (ten raport)
  Brak zmian w gra/src (main.ts bez zmian wzgledem dba2720ba), w runnerze, w ai.ts, battleScene.ts, gra/data, WERSJE.md.

== ODPOWIEDZI NA ZARZUTY EVALUATORA ==

Zarzut 1 [NISKI] -- regex warstwy statycznej pasuje do prefiksu klucza.
  DECYZJA: PRZYJMUJE. Poprawka: w regexach odczytu (restoreRules) dodano negatywny lookahead `(?![\w])` po nazwie klucza
  (nnsAiOverrides, orderMultByCity, orderGrowthMultByCity, orderValueByCity), wiec `saved.meta?.orderMultByCityX` nie pasuje.
  DOWOD (zmierzony w tej rundzie):
    - `node tools/save-load-roundtrip-state-drift-test.cjs --static-only 1` na zmienionym tescie i niezmienionym main.ts:
      10/10 OK, "SAVE-LOAD ROUNDTRIP OK", exit 0.
    - Mutacja na KOPII main.ts (poza repo, $SCR/mut/main.ts): sed `saved\.meta?\.orderMultByCity\b` -> `...orderMultByCityX`
      (grep potwierdza 1 zmiane). Wynik: "FAIL  odczyt orderMultByCity", "SAVE-LOAD ROUNDTRIP FAIL (1)", exit 1.
  Warstwa dynamiczna nie byla ponownie uruchamiana po tej poprawce (zmieniony jest tylko regex statyczny).

Zarzut 2 [NISKI] -- domyslne --turns 9 porownuje 3 tury, kryterium to t+1..t+10.
  DECYZJA: PRZYJMUJE. Poprawka: domyslna wartosc `--turns` zmieniona z 9 na 16 (przy --save-at 6 daje 10 porownan),
  zaktualizowano tez opis uzycia w naglowku testu. Test sam weryfikuje `compared === TURNS - SAVE_AT`.
  DOWOD: kod zmieniony w tym commicie (diff: 6 linii). Ostatni pomiar 10/10 przy --turns 16 (seed 4242 i 777) pochodzi
  od Evaluatora i Operatora na tym samym main.ts i tym samym runnerze (be62cbd4c/dba2720ba -- roznica tylko w tescie).
  NIE ZMIERZONO: ponowne uruchomienie domyslnej dynamiki po zmianie domyslnej (koszt ~5 min/ziarno z buildem vite;
  roznica jest czysto parametryczna, `--turns 16` jawnie podane daje ten sam przebieg).

Zarzut 3 [NISKI / DO ABC, jawne] -- hash runnera pomija budowaPriorytetTypow i resourceLedgerHistory.
  DECYZJA: ODRZUCAM jako zarzut blokujacy (zachowanie zgodne z dispatchem); PRZYJMUJE jako uwage do ABC.
  DOWOD: DODATEK 2 dispatchu (00-dispatch-DODATEK-claude.md, sekcja DECYZJE) wprost nakazuje: "budowaPriorytetTypow po
  wczytaniu -- NIE ZMIENIAJ zachowania ... w tescie regresji traktuj to pole jako znana roznice „DO ABC” (jawna whitelista
  z komentarzem), nie ukrywaj" oraz dla resourceLedgerHistory: "opisz w raporcie jako zgloszenie (#432), poprawka tylko
  jesli trywialna i bez ryzyka". Lista jest jawna: EXPECTED_HASH_IGNORED w tescie (linie 46-53) i hashIgnored w summary
  runnera, obie z tym samym wpisem `budowaPriorytetTypow(DO ABC)` i `resourceLedgerHistory(#432)`. Nic nie znika po cichu;
  test czerwienieje, gdy lista sie zmieni. Ograniczenie pozostaje (test nie wykryje przyszlego rozjazdu w tych dwoch polach)
  i jest jawnie opisane tutaj.

Zarzut 4 [INFORMACYJNY] -- zgodnosc wsteczna starego zapisu tylko analiza kodu.
  DECYZJA: PRZYJMUJE jako NIE ZMIERZONO (informacyjne, bez zmiany kodu).
  DOWOD: odczyty chronione Array.isArray (static check: "stary zapis bez pol" OK w tym commicie), load-game-regression
  34/0 (Evaluator). Dedykowany pomiar wczytania zapisu sprzed zmiany w przegladarce NIE WYKONANO w tej rundzie.

Zarzut 5 [INFORMACYJNY, proceduralny] -- 00-dispatch.md nie istnieje na origin/main.
  DECYZJA: ODRZUCAM jako defekt kodu (zarzut proceduralny; nie dotyczy kodu gry).
  DOWOD: dispatch tematu zyje na galezi dispatchow (origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0), w pliku
  00-dispatch-DODATEK-claude.md -- tak wskazuje tresc zadania ("Przeczytaj OBOWIAZKOWO ... git show
  origin/claude/...:.../00-dispatch-DODATEK-claude.md"). Brak 00-dispatch.md na main nie zmienia tresci wymagan.
  Odnotowane do decyzji orkiestratora (proces, nie kod).

== BRAMKI (surowe wyniki, na commicie obrony po zmianach) ==
  npm ci w gra/: exit 0 (added 71 packages).
  tsc --noEmit (gra/): exit 0.
  logic-test: "LOGIC OK (213/213)", exit 0.
  tech-tree-test: "tech-tree-test: 20 pass, 0 fail", exit 0.
  research-test: "PASSED: 33 / FAILED: 0 / TOTAL: 33", "ALL GREEN", exit 0.
  unit-replace-test: "[unit-replace-test] WSZYSTKIE TESTY ZIELONE (21/21)", exit 0.
  combat-test: "COMBAT TEST: 6/6 pass", exit 0.
  git diff --check: exit 0 (czysto).
  save-load-roundtrip-state-drift-test --static-only 1: 10/10 OK, exit 0 (po poprawce).
  Mutacja statyczna odczytu orderMultByCity (kopia, klucz X): FAIL, exit 1 (po poprawce).

== TEST TEMATU / POMIARY ==
  Warstwa dynamiczna (seed 4242/777, 10/10) -- zmierzona przez Evaluatora i Operatora na tym samym main.ts (dba2720ba);
  w tej rundzie NIE powtarzana (zmiana tylko w tescie statycznym i domyslnym --turns).
  okolica-load-reconcile-test 21/23 FAIL: dlug bazowy (identyczny wynik na cb29ce7af), nie regresja tej zmiany (wg Evaluatora).
  map-snapshot-load-test: NIE ZMIERZONO (timeout 100 s u Operatora i Evaluatora).

== BLOKADY ==
  brak blokujacych. Otwarte (bez zmiany tej rundy): #432 resourceLedgerHistory 5->0; DO ABC budowaPriorytetTypow;
  #433 playerEverOwnedCityByOwner; NIE ZMIERZONO: dedykowany pomiar starego zapisu w przegladarce, map-snapshot-load-test,
  dlugi horyzont (tury 40-50, wojny) pod katem citizenUpkeepByOwner / cityOrderState (uwaga Evaluatora 2).

== UWAGI-DLA-ORKIESTRATORA ==
  - Zgloszenie #432 pozostaje otwarte; nie naprawiane (zgodnie z DODATKIEM 2).
  - Dlugi pomiar `--resume-test --save-at 40 --turns 50` nie byl wykonany w tej rundzie.

RUNDY: 4/5 (obrona po zarzutach Evaluatora r3; kolejny etap: Final Control).
NASTEPNY KROK: Final Control (SONNET) na SHA obrony; werdykt koncowy nalezy do FC. Po FC integracja przez orkiestratora.
DEPLOY/PUSH: NIE WYKONANO

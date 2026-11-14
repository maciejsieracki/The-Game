STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DETERMINISM-DIGEST-NORMALIZE-STACKGROUP-Q1
GOAL: digest `__detHarness.digest` (hak testowy pod ?civTest=1) normalizuje stackGroupId (Date.now) do kanonicznych indeksow g0, g1, ...; dwa przebiegi tego samego ziarna maja identyczne digesty bez zamrazania zegara.
BAZA: origin/main 0ff8dfd41 (worktree detached od 0ff8dfd41). Dispatch odczytany z brancha claude/sprawdzenie-funkcjonalnosci-ek4ra0 (00-dispatch.md i 00-dispatch-DODATEK-claude.md); origin/main nie zawiera katalogu runs tego tematu.

ZMIANY/COMMIT:
- gra/src/game/det-digest-normalize.ts (nowy): czysta funkcja normalizeDetDigestStackGroups(units, cities). Numeracja w kolejnosci pierwszego wystapienia na stabilnie posortowanej liscie jednostek (po id), potem miasta (siegeArmyGroupId). Kolejnosc tablicy na wyjsciu zachowana. Wejscie nietkniete.
- gra/src/main.ts: import + zmiana tylko w bloku __detHarness.digest (full i noPP liczone z norm.units / norm.cities). full(), snapshotJson i reszta haka bez zmian.
- gra/tools/determinism-digest-stackgroup-test.cjs (nowy): test jednostkowy w Node (esbuild bundle w pamieci), 4 przypadki (a)-(d).
- dyspozycje/autobot/runs/R-WEB-DETERMINISM-DIGEST-NORMALIZE-STACKGROUP-Q1/10-operator-claude.md (ten raport).
- Nie zmieniano armyMerge.ts, formatu zapisu, gra/data, WERSJE.md. Logika gry nietknieta.
- Odstepstwo od dispatchu (rozszerzenie): stackGroupId w siegeArmyGroupId miasta tez normalizowany. Bez tego digest dawalby falszywy rozjazd przy oblezeniu.

TESTY:
- npx tsc --noEmit: exit 0 (bez bledow).
- logic-test: "LOGIC OK (213/213)" exit 0
- tech-tree-test: "tech-tree-test: 20 pass, 0 fail" exit 0
- research-test: "PASSED: 33 / FAILED: 0 / TOTAL: 33" exit 0
- unit-replace-test: "WSZYSTKIE TESTY ZIELONE (21/21)" exit 0
- combat-test: "COMBAT TEST: 6/6 pass" exit 0
- determinism-digest-stackgroup-test: "ZIELONY (4/4)" exit 0 (a: identyczny znormalizowany digest mimo innego Date.now, przeslanka: surowe JSON-y sie roznia; b: inna struktura grup -> inny digest; c: relacja rownosci i miasto dzieli indeks z armia; d: wejscie nietkniete, kolejnosc i pola zachowane).
- Dowod mutacyjny: normalizacja cofnieta do tozsamosci (kopia w scratchpad, MODULE_SRC) -> "CZERWONY (2 FAIL)", FAIL (a) i (c), exit 1.
- Przebieg live Chromium (tools/determinism-war-t19-diag-dump.cjs, ?civTest=1, FAST_MODE domyslny, bez FIXED_NOW): wojna AI->gracz przez ownerDeclareWarOn, 22 tury, seed 271828, dwa przebiegi na tym samym buildzie vite (build poza repo):
  - run A: 22 tury, stoppedBy=koniec zakresu, pageErrors=0
  - run B: 22 tury, stoppedBy=koniec zakresu, pageErrors=0
  - porownanie digestow per tura: 22/22 identyczne, 0 roznic.
  - przyklad digestow (FNV:dlugosc): tura 1 ab8c8a82:142, tura 2 af45f93d:141, tura 3 203e15ad:142.
- git diff --check: czysty.

NIE_ZMIERZONO:
- Kontrola przed poprawka (live, bez normalizacji) nie byla powtarzana w tym temacie. Rozjazd z Date.now jest udokumentowany w R-WEB-DETERMINISM-WAR-T19-DIVERGENCE-DIAG-Q1 (FC 0d25163c7), nie jest pomiarem tej rundy.
- Seed 314159 (opcjonalny w dispatchu): nie wykonano w tej rundzie (zakres czasu).

BLOKADY: brak.

RUNDY: 1/5. Werdykt operatora: PASS-WITH-NOTES, przekazanie do Evaluatora.

UWAGI-DLA-ORKIESTRATORA:
- Digest nie jest juz wrazliwy na kolejnosc jednostek po ID (sortowanie sluzy tylko numeracji); kolejnosc tablicy na wyjsciu zachowana, wiec rozjazd kolejnosci dalej jest widoczny.
- Hak digestu zmienia wartosci fnv pod ?civTest=1; ewentualne zapisane wartosci fnv sprzed zmiany nie sa porownywalne.
- Poza zakresem (nietkniete): deterministycznosc freshStackGroupId (decyzja wlasciciela); walki reczne bez rng (battleScene.ts, manualBattle.ts).
- Operator nie wykonywal ponownego merge ani push; katalog node_modules w gra/ zainstalowany przez npm ci (do sprzatania przez orkiestratora po zakonczeniu tematu).

NASTEPNY KROK: Evaluator (SONNET), potem Obrona (HAIKU), Final Control (SONNET), integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO

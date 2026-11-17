STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dane jednostek + czytelnicy w kodzie + testy)
TEMAT: R-WEB-DATA-UNITS-HEALTH-SINGLE-FIELD-Q1
GOAL: jedno pole zdrowia definicji jednostki = `health` (decyzja właściciela A, 2026-11-17); pole `Health` usunięte z units.json i z czytelników w gra/src i gra/tools. Obrona r2 po ewaluacji (zarzuty 1–4).
ZMIANY/COMMIT: 3311264ad070159a176059b00d7d33cf2b1eb722 (kod + dane + testy, 20 plików, jawna allowlista `git add <ścieżki>`). Ten raport: osobny commit (tylko plik raportu). Baza: 1418f02cb (= 3b1b123f2 + raport audytu r1). Nic nie pushowane, nie zintegrowane.

  Zmienione pliki:
  - gra/data/units.json: usunięte 75 linii `"Health": ...` (pure deletions, `git diff --stat` = 75 deletions). Pozostało `health` (75 wpisów, każdy > 0).
  - gra/src/game/ai.ts:3456-3459 `_unitMaxHealth`: `def?.Health` -> `def?.health`, komentarz zaktualizowany.
  - gra/src/battle/battleScene.ts:4308 (HP wieżyczki oblężniczej): `shooterRow['Health'] ?? shooterRow['health']` -> `shooterRow['health']`; komentarze 1121/1123.
  - gra/src/game/combat.ts:203, gra/src/battle/testBattle.ts:312-314, gra/src/main.ts:35775, gra/src/oblezenie/main.ts:38: usunięte fallbacki na `Health`.
  - gra/src/game/siegeDefenders.ts:189: usunięty klucz 'Health' z MELEE_SCALED_KEYS (bez efektu: klucz nieobecny w danych; 'health' nadal skalowany).
  - gra/src/data/loader.ts: typ UnitDef: `Health` usunięte, `health: number | null` dodane (tsc wymagał).
  - gra/src/ui/unitEngineStats.ts:7: komentarz.
  - gra/tools/: archers-health-dist-data-test.cjs (asercje na `health`, sprawdzenie braku `Health`, mutacja health=40), unit-info-card-contract-test.cjs (klucz 'health'), rydwan-konnica-x2-test.cjs (Health wycofane: sprawdzenie nieobecności), combat-test.cjs / hit-mode-test.cjs / legion-vs-falanga-compare.cjs / true-stats-legion-falanga.cjs / tw-rome-test-legion-falanga.cjs / tw-vs-stary-legion-falanga.cjs (odczyt raw['health']).
  - NOWY gra/tools/units-health-single-field-test.cjs: test-strażnik (bez zależności).

  Pozostawione ZAMIERZONE (nie są polem definicji jednostki z units.json):
  - gra/src/game/ai.ts:3573 `Health: hp` — nazwa klucza parametru estimateUnitCombatStrength (HP runtime), nie odczyt definicji.
  - gra/src/game/siege.ts (SiegeUnit.Health, STONE_WARRIOR.Health = 17, makeMilitia), siegeAi.ts (unit.Health), siegeDefenders.ts:153 (m.Health), main.ts:19252-19254 — HP runtime oblężenia; STONE_WARRIOR to stała w kodzie, nie czyta units.json.
  - gra/src/ui/entityCards/unitAdapter.ts:118-126 — regexy zamieniające etykietę tekstu „Health” w opisach (tekst, nie pole).
  - komentarze w gra/src/render/jednostki-*.ts, kamien-inka-opus5.ts (historyczne opisy „Health 40” itp.).
  - gra/src/data/wikiBundle.json (tracked: gra/src/data/wikiBundle.json): generator tools/bundle-wiki-for-game.cjs uruchomiony -> `git status` bez zmian (wynik identyczny, brak klucza Health w bundlu).

TESTY:
  ZMIERZONO (surowe wyniki, worktree po commicie 3311264ad):
  - `npx tsc --noEmit` (gra/): exit 0 (przed poprawką typu loader.ts: exit 2, 1 błąd TS2339 — naprawione).
  - Pięć referencyjnych: logic-test LOGIC OK (213/213) exit 0; tech-tree-test 20 pass / 0 fail; research-test PASSED 33/0; unit-replace-test WSZYSTKIE TESTY ZIELONE (21/21); combat-test "All sanity checks passed" exit 0.
  - units-health-single-field-test: [a-c] 75 jednostek, 0 błędów; [d] trafienia odczytu Health z definicji w src: 0; [e] mutacja (Health dodany / health=40 u łuczniczki) wykryta -> WYNIK ZIELONO exit 0. Mutacja jest w tym samym pliku (kopia danych), nie na pliku źródłowym.
  - archers-health-dist-data-test: 10 pass / 0 fail. unit-info-card-contract-test: 23 pass / 0 fail. tech-unlock-units-test: 119 pass / 0 fail (identycznie jak base).
  - city-militia-no-defenders-test, siege-ai-test, load-game-regression-test, ai-era-unit-promotion-test, militia-garrison-contract-test, siege-last-stand-sortie-test, hit-mode-test, unit-card-stats-engine-canon-test, unit-top3-player-language-test: exit 0.
  - Porównanie z base (git archive 1418f02cb, te same pliki testów): unit-stock-cost-test 56 pass/2 fail = base; unit-epoch-cost-test 56/1 = base; unit-replace-full-cost-test 39/1 = base; siege-tower-breach-everywhere-test timeout 124 = base; siege-panel-machines-block-fit-test Node-error = base; rydwan-konnica-x2-test: po zmianie pola Health nie ma już błędów Health; pozostałe 2 niezgodności (Rydwan (woły).Surowiec/„Utrzymanie surowiec” = „Drewno” zamiast „Brąz”) są IDENTYCZNE na base 1418f02cb = pre-existing, nie dotknięte tą zmianą.
  - Pre-existing na base (nie naprawiane): ai-army-replacement-sim, ai-war-city-garrison-measure, battle-manual-melee-browser-test, zelazo-celtowie-miecznik-rydwan-real-render-test (timeout 124 na base i na nowym); memory-static-unit-merge-* (exit 2/1 na base); legion-vs-falanga-compare i tw-vs-stary-legion-falanga (błąd Node na base i na nowym).
  NIE ZMIERZONO:
  - Pomiar przed/po wyników bitew, oblężeń i mocy armii (symulacja ≥3×150 tur) — poza zakresem tej rundy (DODATEK pkt 4 wymaga podania skutku, nie pomiaru liczb). Do osobnej rundy.
  - Chromium / żywa gra (karty jednostek, baner wieżyczki).
  - Pełny zbiór ~312 testów powiązanych z units.json (uruchomiono ok. 60 + bramki wymienione wyżej).

BLOKADY:
  - Brak. Zmiana zachowania (AI, wieżyczki) jest świadoma i zatwierdzona przez właściciela wariantem A (DODATEK 2026-11-17); skutek opisany niżej.
  - OSTRZEŻENIE: gra/tools/roster6-units-patch.cjs ZAPISUJE gra/data/units.json (wpisy z polem Health, fieldPower, duplikaty). W trakcie testów wsadowych jeden z testów (nie ustalono których: wykryty przez skan skrótu pliku) wywołał ten skrypt i nadpisał units.json (77 wpisów). Przywrócono z git i ponownie usunięto Health (75 wpisów). Nie uruchamiać roster6-*-patch.cjs bez świadomej decyzji (cofnie zmianę). Wsadowe uruchamianie tools/*.cjs z filtra „unit/army” nie jest bezpieczne dla units.json.
  - Dane wpisane tymczasowo przez roster6 NIE są w commicie (`git status` czysty dla gra/data poza zmianą 75 linii).

RUNDY: 2/5 (runda 1 = DECISION_REQUIRED, 1418f02cb). Ostatni werdykt Evaluatora: FAIL-zalecenie (zarzuty 1–4).

ODPOWIEDZI NA ZARZUTY EVALUATORA (bcdd8cc0f):
  1. Wariant A nie wdrożony — PRZYJMUJĘ. Wdrożono: units.json, czytelnicy, typ, testy (commit 3311264ad). Kryteria DODATKU 1–3 spełnione w zakresie gra/src i gra/data (wyjątki wyżej).
  2. Brak testu-strażnika i mutacji; żadna bramka nie uruchomiona — PRZYJMUJĘ. Dodano gra/tools/units-health-single-field-test.cjs (mutacja wykryta); uruchomiono tsc i 5 bramek referencyjnych (wyniki wyżej).
  3. Audyt niekompletny — PRZYJMUJĘ CZĘŚCIOWO:
     (a) gra/tools: poprawiono 8 plików czytających units.json (raw['Health'] / Health w asercjach). ODRZUCAM konieczność zmiany fixture'ów: wiele plików tools/*.cjs (grep: literał Health w ok. 60 plikach, liczba dokładna NIE ZMIERZONO) ma WŁASNE syntetyczne obiekty `{Jednostka:'Wojownik', Health: 30}` i nie czyta units.json; ich wynik nie zmienia się, bo `_unitMaxHealth` ma fallback 30 (= ta sama wartość). Lista do osobnego sprzątania: do wykonania przez osobny temat.
     (b) ai.ts:3573 i ai.ts:5086: 3573 = nazwa klucza parametru (HP runtime) — bez zmiany nazwy; 5086 (partitionWarArmies) korzysta z _unitMaxHealth -> po zmianie health. HIPOTEZA EVALUATORA POTWIERDZONA KODEM: gra/src/main.ts:35782-35787 `effectiveRuntimeUnitMaxHp` = unitHealth(def) = health, więc u.hp jest na skali bojowej (health). Przed zmianą pełnozdrowy Wojownik dawał frakcję 22/60 ≈ 0,37 (przeliczenie: 22 = health, 60 = Health). Po zmianie 22/22 = 1,0. LICZBOWO NIE ZMIERZONO w grze.
     (c) siegeDefenders.ts:153/189 — usunięty klucz 189. :153 to HP runtime milicji, bez zmiany. Stała milicji siege.ts:517 (STONE_WARRIOR.Health = 17) NIE czyta units.json — jest stałą w kodzie; pozostawiona, udokumentowana jako klasa B poza zakresem pola definicji.
     (d) zapisy: gra/src/game/save.ts ma 0 odwołań do `Health` (grep). Pola definicji nie są zapisywane, więc migracja zapisów nie jest potrzebna. Runtime HP (SiegeUnit.Health) bez zmian w formacie zapisu.
     (e) wiki: generator odtwarza tracked bundle bez różnic.
  4. Brak porównania przed/po wyników walki/oblężenia/mocy armii — ODRZUCAM w tej rundzie z powodem: DODATEK 2026-11-17 pkt 4 wymaga JAWNEGO podania skutku balansowego („Raport MUSI jawnie podać skutek balansowy ... bez zmiany liczb”), nie symulacji. Symulacja ≥3×150 tur (ocena AI, bitwy) jest pomiarem do osobnej rundy i nie została wykonana (NIE ZMIERZONO). Kryterium dispatchu (c) „wyniki bez zmian” jest sprzeczne z wariantem A dla dwóch miejsc (AI i wieża) — zmiana jest zamierzona i opisana.

SKUTEK BALANSOWY (dla właściciela; bez zmiany liczb poza samym polem):
  - AI (ai.ts `_unitMaxHealth`, używane w aiUnitCombatStrength i partitionWarArmies): maxHp jednostki przechodzi z `Health` na `health` dla 44 z 75 jednostek (przykłady: Wojownik 60 -> 22; Włócznik 160 -> 32; Rydwan (woły) 400 -> 96; Taran 2800 -> 700; Wieża oblężnicza 3600 -> 900; Łucznik 20 -> 20 bez zmiany). Efekt: frakcja HP w ocenie siły armii i podziale armii wojennych przestaje być zaniżona ok. 2–5× dla jednostek z rozjazdem; oceny siły AI zmieniają się jakościowo (wyższa waga pełnozdrowych jednostek względem uszkodzonych). Wielkość: NIE ZMIERZONO.
  - Bitwa, wieżyczka oblężnicza (battleScene `_fireSiegeTowers`): HP strzelca wieży = `health` zamiast `Health ?? health` (Health miał pierwszeństwo). Dla strzelców z rozjazdem HP wieży zwykle spada (np. Procarz 20 -> 16). Wpływ na wynik strzału: NIE ZMIERZONO.
  - Walka (combat.ts, testBattle, main.ts), karty jednostek (unitEngineStats/unitAdapter): bez zmiany liczb — już czytały `health`. Karty pokazują health-pochodne wartości zgodnie z walką (bez zmiany tekstu).
  - Zapisy: brak wpływu na definicje (0 odwołań w save.ts).

ZMIANY/PLIKI SPOZA ALLOWLISTY: brak. Node_modules utworzony w gra/ (npm ci --ignore-scripts) — do usunięcia przez orkiestratora przy sprzątaniu (zakaz rm w tym temacie, nie usuwano). Pliki w /tmp/claude-0-* — do sprzątania przez orkiestratora.

NASTĘPNY KROK:
  1. Orkiestrator: decyzja, czy sprawdzić liczbowo skutek AI/wieży (symulacja ≥3×150 tur, osobna runda, z ziarnem testowym) przed integracją.
  2. Fałszywy-odczyt w narzędziach: osobny temat sprzątania fixture'ów `Health:` w ok. 60 plikach tools/*.cjs (bez wpływu na grę) i wyłączenie roster6-*-patch.cjs / apply-matrix-v2-stats.cjs z możliwości przypadkowego uruchomienia.
  3. Rust (rust-port/): dług REPIN danych jednostek — pole Health nie istnieje już w danych weba; NIE ZMIERZONO w rust-port (poza allowlistą).
  4. Sprawdzenie w grze (Chromium): karta jednostki i baner wieży po zmianie health.

DEPLOY/PUSH: NIE WYKONANO (commit lokalny 3311264ad + commit raportu w gałęzi worktree; brak push na main, brak integracji).

UWAGI-DLA-ORKIESTRATORA:
  - Commit 3311264ad zawiera kod; raport w osobnym commicie. Tamże wywołany zostaje Co-Authored-By: Claude Haiku 5.5.
  - Dispatch pkt „Zakaz rm/rmdir/unlink” zachowany — nic nie usuwano.
  - Wykryto poza zakresem (do decyzji): gra/tools/roster6-units-patch.cjs i gra/tools/roster6-batch3-patch.cjs są skryptami zapisującymi dane; mogą cofnąć tę zmianę po ponownym uruchomieniu.
  - Pre-existing failing tests na base (tabela wyżej) — nie są częścią tego tematu.

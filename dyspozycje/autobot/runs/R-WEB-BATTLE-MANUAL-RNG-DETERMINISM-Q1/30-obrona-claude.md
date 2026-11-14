STATUS: PASS-WITH-NOTES (obrona r1: zarzut 1 naprawiony, zarzut 2 przyjety w czesci, zarzut 3 NIE_ZMIERZONO z analiza ryzyka; werdykt koncowy nalezy do Final Control)
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-MANUAL-RNG-DETERMINISM-Q1
GOAL: walka reczna i scenowa + bitwa polowa z mapy wolaja resolveCombat / rzut trafienia ze strumienia gry (gameStreamRng z ziarna, ten sam mechanizm co AUTO), bez Math.random; dwa przebiegi z tym samym ziarnem i decyzjami graczy maja dac ten sam wynik.
BAZA: eb68e66d8 (kandydat Evaluatora) -> poprawka 75a914d9a515602b2db66ca1be31c5eb8acfcfb2 (worktree wf_f2b24931-3fd-3, galaz worktree-wf_f2b24931-3fd-3). Raport: 29936f365 (Evaluator) jest rodzicem eb68e66.

ZMIANY-COMMIT:
- 75a914d9a: gra/src/main.ts (1 wiersz wrappera, linia 38062) + gra/tools/manual-battle-rng-determinism-test.cjs (+9 linii asercji).
- Wrapper: createBattleScene: (opts) => new BattleScene({ combatRng: battleCombatRng(), ...opts }). Opts wywolujacego maja pierwszenstwo; mapFieldBattle.ts nie zmieniany (poza allowlista, nie ma w nim Math.random).
- Test: dodane asercje: mapFieldBattle bez Math.random; wrapper createBattleScene podpina battleCombatRng(); stary zapis bez battleCombatSeq* -> domyslnie -1/0 (defensywny odczyt w restoreGameFromSave).

LISTA Math.random / resolveCombat bez rng (stan po eb68e66 + poprawce), plik:linia:
- gra/src/battle/battleScene.ts:2305 domyslna wartosc pola _combatRng = Math.random (fallback, gdy brak opts.combatRng; wszystkie wywolania w main.ts podaja strumien).
- gra/src/battle/battleScene.ts:20733 domyslny parametr combatRng = Math.random w computeInstantResult (przekazywany z this._combatRng).
- gra/src/battle/manualBattle.ts:470 domyslna wartosc pola combatRng = Math.random (klasa ManualBattle nie jest instancjonowana w gra/src, patrz ODP-4).
- gra/src/oblezenie/main.ts:46 new BattleScene bez combatRng -> Math.random (OSOBNY entry point, poza allowlista; patrz ODP-5).
- Pozostale Math.random w battleScene.ts (ok. 11344-11556, 4863-5050) to audio i dekoracje wizualne, nie wplywaja na wynik walki.
- gra/src/battle/mapFieldBattle.ts: brak Math.random i brak resolveCombat (sprawdzone grepem; po poprawce wrapper w main.ts podpina strumien).

ODPOWIEDZI NA ZARZUTY EVALUATORA:
1. (ISTOTNY, sciezka mapFieldBattle) -- PRZYJMUJE. Poprawka: wrapper createBattleScene w main.ts (75a914d9a). Dowod: grep 'createBattleScene: (opts' gra/src/main.ts -> linia 38062 z combatRng: battleCombatRng(). Mutacja: wrapper przywrocony do new BattleScene(opts) -> test FAILED 1 (exit 1), linia "FAIL main: wrapper createBattleScene podpina combatRng z fabryki gry".
2. (ISTOTNY, test tylko statyczny) -- CZESCIOWO PRZYJMUJE, CZESCIOWO NIE_ZMIERZONO.
   - Przyjete: dopisane asercje na wiazanie wrapper/mapFieldBattle/zapis (nie tylko regexy na zrodle wywolan).
   - Nie zrobione: test behawioralny (dwa przebiegi tej samej walki = identyczny wynik). Powod techniczny, zmierzony w zrodle: BattleScene w konstruktorze tworzy THREE.WebGLRenderer (gra/src/battle/battleScene.ts:3443), a jsdom nie ma WebGL; ManualBattle wymaga DOM/THREE. Nie probowalem stubowac WebGL (koszt, ryzyko falszywego zielonego). Czysty resolveCombat z seeded rng nie testuje wiazania, wiec nie dawalby dowodu i nie jest czerwony na bazie.
   - Dowod mutacyjny (3 wersje, wszystkie czerwone): (a) baza fab9a9b75 zrodla -> FAILED (12 FAIL + linia FAILED), exit 1; (b) wrapper bez combatRng -> FAILED 1, exit 1; (c) z poprzedniego raportu: _singleBlow z Math.random -> FAILED 1, exit 1 (Evaluator).
3. (NOTE, weryfikacja live, niezaleznosc od klatek) -- NIE_ZMIERZONO. Live nie wykonano (brak uruchomionej przegladarki w tej rundzie). Analiza zrodla (nie pomiar) wskazuje RYZYKO, ktore dotyczy samej tezy "ten sam wynik":
   - Rzut trafienia _singleBlow jest wywolywany z timerow wirtualnego czasu: gra/src/battle/battleScene.ts:9409 (_schedule po RANGED_FLY_MS, pocisk) oraz petle melee przy 9304/9321.
   - Wirtualny czas vNow jest przesuwany z czasu sciennego klatek: _advanceVClock (battleScene.ts:9680, vNow += scaledWallDelta(dw)), a _schedule (9775) liczy due = _now() + ms, czyli due zalezy od momentu zaplanowania w klatce.
   - _drainTimers (9796) wykonuje najwczesniejszy due; przy dwoch lancuchach zdarzen (np. dwie jednostki, pocisk vs melee) kolejnosc wywolan _singleBlow -- a wiec kolejnosc losowan ze wspolnego strumienia -- moze zalezec od dt klatek. Wtedy ten sam seed i te same decyzje daja inna sekwencje rzutow.
   - Wniosek: poprawka zapewnia, ze zrodlem jest strumien gry (spelnia dosłownie kryterium "zamiast Math.random"), ale NIE gwarantuje determinizmu przebiegu w trybie live, dopoki losowanie jest sekwencyjne, a kolejnosc timerow zalezy od klatek. Potrzebna decyzja projektowa (np. rzut kluczowany stalym id zdarzenia: ziarno + tura + id atakujacego/obroncy + licznik ciosu zamiast jednego wspolnego strumienia) -- to wykracza poza allowlist i poza ten temat; zglaszam jako ABC/nowy temat do orkiestratora.
4. (DROBNY, ManualBattle bez instancji) -- PRZYJMUJE jako informacje. Dowod: grep 'new ManualBattle' w gra/src -> brak (tylko README-manualBattle.md). Zmiana w manualBattle.ts zostaje, bo dispatch wymienia ten plik w allowliscie; nie ma efektu w grze do czasu podpiecia klasy.
5. (DROBNY, oblezenie/main.ts:46) -- ODRZUCAM w tym temacie. Dowod: gra/src/oblezenie/main.ts:46 'const scene = new BattleScene({' bez combatRng; plik poza allowlista (dispatch: battleScene.ts, manualBattle.ts, main.ts). Zgloszone w UWAGI-DLA-ORKIESTRATORA jako osobny temat.
6. (DROBNY, brak testu migracji zapisu) -- PRZYJMUJE. Dodana asercja statyczna na domyslne -1/0 przy odczycie (gra/src/main.ts restoreGameFromSave, sekcja battleCombatSeq). Nie ma testu runtime zapisu (ten sam powod co w ODP-2).
7. (DROBNY, drift bazy) -- PRZYJMUJE jako note. Dowod: git diff --stat fab9a9b75 501f78c08 -- gra -> pusty (miedzy baza a origin/main nie ma zmian w gra/; roznica to dokumentacja). Przy integracji nadal sprawdzic ancestry i diff.

TESTY (surowe wyniki z tego worktree, po poprawce 75a914d9a):
- node gra/tools/manual-battle-rng-determinism-test.cjs -> 14 PASS, "OK manual-battle-rng-determinism", exit 0.
- Ten sam test na zrodlach bazy fab9a9b75 (MANUAL_RNG_ROOT) -> FAIL, exit 1 (12 linii FAIL + FAILED).
- Mutacja wrappera (new BattleScene(opts)) -> FAILED 1, exit 1.
- logic-test: LOGIC OK (213/213), exit 0.
- tech-tree-test: 20 pass, 0 fail, exit 0.
- research-test: PASSED 33 / FAILED 0 / TOTAL 33, exit 0.
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21), exit 0.
- combat-test: COMBAT TEST 6/6 pass, exit 0 (esbuild z tymczasowego linku node_modules, link usuniety).
- tsc --noEmit: NIE_ZMIERZONO jako zielony. Worktree nie ma gra/node_modules; globalny tsc (/opt/node22/bin/tsc) odrzuca tsconfig (TS5101 baseUrl). Z --ignoreDeprecations 6.0 wynik 176 bledow, wszystkie w plikach bez zwiazku z tematem (brak typow 'three', import.meta.glob, filePlayer). Zadna linia z combatRng/rng/createBattleScene nie ma bledu (grep). Pelne tsc zielone nie zostalo odtworzone w tym srodowisku.
- git diff --check: czysty (exit 0).

BLOKADY:
- Weryfikacja live (punkt 4 dispatchu) NIE_ZMIERZONO (patrz ODP-3).
- Test behawioralny walki nie zrobiony z powodu WebGL w jsdom (ODP-2).
- tsc zielony NIE_ZMIERZONO w tym srodowisku (ODP-tsc powyzej).
- Determinizm przebiegu live: ryzyko z ODP-3, wymaga decyzji projektowej.

RUNDY: 1/5 (obrona r1 po FAIL Evaluatora).

NASTEPNY KROK: Final Control: ocenic PASS-WITH-NOTES (zarzut 1 zamkniety; zarzut 2 i 3 z jawnym NIE_ZMIERZONO). Orkiestrator decyduje o ABC dla ryzyka kolejnosci rzutow w trybie live.

DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- gra/src/oblezenie/main.ts:46 tworzy BattleScene bez combatRng (Math.random) -- osobny temat (entry oblezenie).
- Ryzyko determinizmu live (ODP-3): kolejnosc rzutow zalezy od timerow wirtualnego czasu zasilanego klatkami. Proponowany ABC: (A) rzut kluczowany stalym id zdarzenia, (B) zostawic strumien sekwencyjny i zaakceptowac niedeterminizm live, (C) pomiar live w przegladarce przed decyzja.
- origin/main (501f78c08) rozni sie od fab9a9b75 tylko dokumentacja; integracja powinna sprawdzic merge-base i diff.
- Plik 00-dispatch.md nie istnieje w origin/main (git show zwrocil fatal). Tresc tematu, GOAL i allowlista zostaly odczytane z tresci zlecenia orkiestratora (w tym cytowanego dispatchu); nie zweryfikowano osobno pliku DODATEK na galezi claude/sprawdzenie-funkcjonalnosci-ek4ra0.

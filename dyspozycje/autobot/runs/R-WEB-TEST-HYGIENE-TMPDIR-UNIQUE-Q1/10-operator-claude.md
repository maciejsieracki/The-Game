# R-WEB-TEST-HYGIENE-TMPDIR-UNIQUE-Q1 — raport Operatora (runda 1/5)

STATUS: BLOCK
DOMAIN: INFRA (testy)
TEMAT: R-WEB-TEST-HYGIENE-TMPDIR-UNIQUE-Q1
GOAL: usunąć stałe nazwy plików tymczasowych pod os.tmpdir() w gra/tools (171 trafień w 98 plikach), tak aby bramka tools/bramki-tmpdir-unikalnosc-test.cjs była zielona (0 trafień), bez osłabiania asercji i bez zmian w gra/src i gra/data.

ZMIANY/COMMIT:
- Baza: origin/main 180d518b193deca83a7a6e6dab3eba9b7aa83ebe (checkout --detach).
- Nowy helper gra/tools/_tmp-unique.cjs: eksportuje TMPDIR_RUN_ID (pid + losowy ciąg); ustawia go w process.env, jeśli brak, więc dzieci (child_process) dziedziczą tę samą wartość.
- 97 zmodyfikowanych plików gra/tools/*.cjs (lista: git diff --name-only w worktree). Zmiany wyłącznie w nazwach plików tymczasowych: sufiks `-${TMPDIR_RUN_ID}` przed rozszerzeniem (np. `diag.png`), literały `'/tmp/...'` zamienione na `${os.tmpdir()}/...-${TMPDIR_RUN_ID}`, plus linia importu helpera. Żadnej asercji nie usunięto ani nie osłabiono.
- Korekty ręczne (po automacie): 3 szablony z `${MUTANT ? ...}` (battle-banner-retreat-overlap, battle-player-always-blue, battle-save-disabled); war-era-counter-live-test (require('os').tmpdir() inline); 13 plików, które miały `os.tmpdir()` bez powiązania `os` (użyto `require('os').tmpdir()`); import usunięto z bitwa-obroncy-mur-kolumny-test.cjs (lokalna deklaracja TMPDIR_RUN_ID już istniała).
- Commit: jeden commit (odstępstwo od paczek po ~15 plików, z powodu czasu; wszystkie zmiany mechaniczne i sprawdzone tym samym zestawem kontroli). Tylko ścieżki jawnie dodane, bez `git add -A`. _tmp-unique.cjs dodany przez `git add -f`, bo .gitignore:78 (`gra/tools/_tmp-*`) go ignoruje (patrz UWAGI).
- Raport: dyspozycje/autobot/runs/R-WEB-TEST-HYGIENE-TMPDIR-UNIQUE-Q1/10-operator-claude.md.

TESTY (liczby z surowego wyjścia):
- Bramka tmpdir (przed): FAIL, 171 trafień (R1 38, R3 117, R5 16), PASS=2 FAIL=1.
- Bramka tmpdir (po): FAIL, 1 trafienie: [R3] tools/bramki... -> bitwa-obroncy-mur-kolumny-test.cjs:82 `fs.rmSync(path.join(os.tmpdir(), ent))`. Cel: sprzątanie osieroconych katalogów o nazwie `civ-bitwa-obroncy-mur-<pid>-<6 znaków>` po martwym pid. Nie jest to cel zapisu kolidującego z innym przebiegiem. Bramka zwalnia wyłącznie, gdy znacznik unikalności stoi w treści argumentu, a tu jest `ent`. Nie dopisywałem wyjątku ani nie zmieniałem bramki.
- node --check: 97/97 zmodyfikowanych plików bez błędu składni (skrypt sprawdzający: 0 problemów, w tym brak importu `os` = 0).
- Spójność deklaracji TMPDIR_RUN_ID: każdy plik, który używa zmiennej, ją deklaruje (lokalnie lub przez import) = 0 problemów.
- Test pary producent–konsument (dowód na poziomie helpera, NIE pełny test pary): proces-rodzic i dziecko zwracają tę samą nazwę (SAME_CHILD=true); osobny proces bez dziedziczenia env dostaje inną nazwę (SEPARATE_PROCESS_DIFFERS=true). Pełnego biegu ai-economy-measure-run (producent) z ai-economy-measure-hook-test (konsument) NIE uruchomiono.
- Testy solo nie-live (19 kandydatów; wg grep bez chromium/puppeteer/playwright/chrome):
  - city-siege-wall-rules-test: exit 0, 50 OK, 0 FAIL
  - cluster-start-recovery2-test: exit 0, 29 passed, 0 failed
  - fortifications-queue-cleanup-test: exit 0, 10 OK, 0 FAIL
  - fortifications-superseded-build-test: exit 0, 38 pass, 0 fail
  - fortifications-upgrade-chain-ai-test: exit 0, 13 OK, 0 FAIL
  - palisade-battle-wall-rules-test: exit 0, 55 OK, 0 FAIL
  - procarz-piercing-shot-test: exit 0, ALL PASS
  - ranged-damage-mult-test: exit 0, WSZYSTKIE PASS
  - cluster-plan-name-test: exit 1, 2 passed, 4 failed. IDENTYCZNIE na bazie 180d518b1 (przed zmianą też 2 passed, 4 failed), więc czerwone PRZED tym tematem; nie jest skutkiem zmian.
  - NIE ZMIERZONO (przerwane: przekroczenie 120 s w narzędziu, bez wyniku): resource-ledger-realpath-mutation-test, save-load-roundtrip-state-drift-test, ai-ai-alliance-limit-audit, ai-army-replacement-sim, ai-economy-measure-upkeep-onoff, barb-warrior-audit-sim, diplo-peace-price-table-a, diplo-weariness-city-table-measure, econ-rebalance-model, weary40-sim-measure.
- Testy live (Chromium), 78 plików: NIE URUCHOMIONO żadnego. Próba hotseat-etap4-noop-test przerwana po 120 s (NIE ZMIERZONO). Zakres pokryty tylko node --check. Lista live do ręcznego biegu: wszystkie modyfikowane pliki z dopasowaniem chromium/puppeteer/playwright/chrome (w tym battle-*, hotseat-*, diplo*, perf-*, ai-*, *-real-render-*).
- Zależności: `npm ci --ignore-scripts` w gra/ (potrzebne do esbuild dla cluster-plan-name-test); bez npm run build/dev. gra/node_modules usunięto po pracy.
- tsc --noEmit (gra/): exit 2, 10 błędów, wszystkie w src/main.ts (linie 41382-41383 i dalsze). Nie dotknąłem gra/src; diff obejmuje wyłącznie gra/tools i dyspozycje. Nie zmierzono na bazie osobno.
- Nieuruchomione bramki z dispatchu: logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297/0. NIE URUCHOMIONO (zmiany nie dotykają gra/src; oraz czas).

BLOKADY:
1. Bramka tmpdir nie jest zielona: 1 trafienie w bitwa-obroncy-mur-kolumny-test.cjs:82 (sprzątanie po martwym pid). Wymaga decyzji: (a) przepisanie wzorca tak, by znacznik był w treści argumentu, albo (b) zgoda na wyjątek dla tego wzorca w bramce (decyzja Final Control / właściciela bramki). Bez tego kryterium binarne nie jest spełnione.
2. tsc: 10 błędów w src/main.ts (poza zakresem tego tematu; wymaga osobnego tematu).
3. Live (78 plików) i część nie-live NIE ZMIERZONO.
4. cluster-plan-name-test czerwony już na bazie (2/4).

RUNDY: 1/5. Ostatni werdykt: brak (Operator). Decyzja wymagana: punkt BLOKADY 1.

NASTĘPNY KROK: orkiestrator decyduje o wzorcu bitwa-obroncy (przepisanie vs wyjątek w bramce), potem Evaluator na tej samej gałęzi, z dokończeniem testów live partiami.

UWAGI-DLA-ORKIESTRATORA:
- Zmiana zachowania dla ręcznych uruchomień par: ai-economy-measure-hook-test / ai-economy-measure-run / endturn-t57-repro / diplomacy-harder-measure-run itd. Domyślna nazwa ma teraz sufiks TMPDIR_RUN_ID. Konsument uruchomiony osobno od producenta musi dostać tę samą wartość przez env (TMPDIR_RUN_ID=...) albo argument --dist/--profile, jak dotąd. Upkeep-onoff wywołuje run.cjs z argumentem --dist, więc pozostaje spójny.
- .gitignore:78 (`gra/tools/_tmp-*`) ignoruje przyszłe pliki helperów o takim prefiksie. Zmiana .gitignore jest poza allowlistą tego tematu; decyzja orkiestratora.
- Nie uruchamiałem żadnego procesu w tle z mojej strony poza przerwanymi testami (zatrzymane przez TaskStop); nie zostawiłem procesów Chrome z tego worktree (sprawdzono: 0 procesów z wf_c20f7c10).
- Brak tworzenia sesji, zadań ani harmonogramów; nie wywoływałem spawn_task/create_session/create_trigger/send_later.

DEPLOY/PUSH: NIE WYKONANO

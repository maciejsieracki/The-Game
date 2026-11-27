STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CAPITAL-RECAPTURE-Q1 (CAPRECAP), runda 2/5, Operator HAIKU 5.5
GOAL: odtworzyć błąd odzyskania zbuntowanej stolicy i naprawić go minimalnie; zmierzyć przed/po na żywo (S1, S3, S4).
ZMIANY-COMMIT: baza a562809ff (origin/main, FC r1 BLOCK). Zmieniono:
  - gra/src/game/capital-capture.ts: nowa funkcja effectiveCapitalBeforeCapture(captured, oldOwner, citiesNow, explicitCapitalId)
  - gra/src/main.ts: runCapitalCapturePlunder liczy designatedCapitalId przez tę funkcję (zamiast surowej mapy capitalCityIdByOwner); import dodany
  - gra/tools/capital-recapture-stale-designation-test.cjs: testuje moduł (nie replikę), kotwica main.ts na nowe wywołanie, wiersz MUTACJA (surowy wpis), S1-GRACZ/S4 oczekiwane = eliminacja (ostatnie miasto)
  - gra/tools/capital-recapture-live.cjs (nowy): pomiar live PRZED/PO
  - dyspozycje/analizy/STOLICA-ODBICIE-PO-BUNCIE-2026-11-27.md: sekcja 0 STAN WIĄZĄCY (poprawka, tabela PRZED/PO, luki)
  - dyspozycje/autobot/runs/R-WEB-CAPITAL-RECAPTURE-Q1/10-operator-claude.md (ten plik)
  Zero zmian gra/data, balansu, formuł, WERSJE.md, manifestu. Zapis wstecznie zgodny (brak nowych pól zapisu).
  Mutacja czerwona: przywrócenie surowego wpisu w main.ts -> kotwica FAIL, rc=1 (sprawdzone i przywrócone).
TESTY:
  Pomiar live (Chromium, maksimum: Trudny, koszt jednostek Wysoki, kultura Trudny, dyplomacja Trudna, wzrost ON, zwycięstwo ON; ziarna 4242, 7, 11; 3 AI na ziarno z 4 miastami):
    PRZED (dist bez poprawki): S1 FAIL, S3 FAIL, S4 FAIL na 3/3 ziarnach (9/9 prób): jawny wpis zostaje na zbuntowanym/zdobytym starym mieście, brak sukcesji.
    PO (dist z poprawką): S1 PASS, S3 PASS, S4 PASS na 3/3 ziarnach (9/9 prób): sukcesja zapisana (wpis = nowa stolica = efektywna stolica).
    Tabela w sekcji 0 analizy. Liczby z surowego wyjścia CAPRECAP (pliki logów w scratchpad, nie w repo).
  Narzędzie capital-recapture-stale-designation-test.cjs: PASS=12 FAIL=0 NIE-ZMIERZONO=1 (S5), rc=0.
  Bramki (surowe wyjście):
    tsc rc=0
    logic PASS=213 FAIL=0
    tech-tree "20 pass, 0 fail"
    research "PASSED: 33 / FAILED: 0"
    unit-replace (6 plików) rc=0 każdy
    combat rc=0
    ai-test "297 passed, 0 failed"
    capital-capture-test "OK (107/107)"
    society-breakdown "56 OK, 0 FAIL"
    ai-city-rebellion-gate "PASS=37 FAIL=0"
    ai-city-order-need-wiring "267 passed, 0 failed"
    ai-city-rebellion-news rc=0
  Build: vite build do katalogów w scratchpad (dist-pre z bazy, dist-po z poprawką); nie użyto npm run build/dev. gra/node_modules: npm ci w worktree.
BLOKADY: brak blokad operatora. Luki (NIE ZMIERZONO, jawnie):
  - kwota skarbca/puli przejęta w live: harness zwraca treasuryOf=0; pokryte modułem (capital-capture-test 107/107)
  - S2 (odzyskanie stolicy przez pierwotnego właściciela): zachowanie niezmienione, nie mierzone w r2
  - S5 (round-trip zapisu): nie mierzone w r2
  - podbój armią (zamiast haku siegeSurrender) i aneksja państwa-miasta: nie mierzone live
RUNDY: 2/5 (r1: FC BLOCK; r2 = ten raport). Ostatni werdykt FC r1: BLOCK (live niezmierzone, błąd odtworzony na module).
KONSEKWENCJA DLA FC/ORKIESTRATORA: przejęcie OSTATNIEGO miasta cywilizacji, które było faktyczną stolicą (także przy nieaktualnym wpisie), daje teraz eliminację (Zdarzenie 2). Przed poprawką zwracało null i cywilizacja bez miast zostawała w grze. To zmiana zachowania w grze, nie tylko zapisu: FC ma to ocenić.
UWAGI-DLA-ORKIESTRATORA:
  - Nie czyszczę wpisu przy buncie (zalecenie opcjonalne z dispatchu): po poprawce nieaktualny wpis jest nieszkodliwy, bo resolver go ignoruje.
  - Zalecany osobny temat (nie ten): dlaczego w live harness nie ma kwot skarbca (treasuryOf=0) — dla pomiaru plunderu w grze.
NASTĘPNY KROK: Final Control r2 (sprawdzić: merge-base, git diff --stat, kotwice, tabela PRZED/PO, decyzja o eliminacji ostatniego miasta). Po FC PASS: wdrożenie jako FALA 931 (numer ustali orkiestrator).
DEPLOY/PUSH: NIE WYKONANO

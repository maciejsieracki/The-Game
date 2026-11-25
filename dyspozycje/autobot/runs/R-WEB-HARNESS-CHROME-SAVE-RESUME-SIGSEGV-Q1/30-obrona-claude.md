STATUS: PASS-WITH-NOTES
DOMAIN: INFRA (harness testów live)
TEMAT: R-WEB-HARNESS-CHROME-SAVE-RESUME-SIGSEGV-Q1
GOAL: Obrona rundy 1 (FC: FAIL, zarzuty 1-6). Dodać test w repo dla ścieżki retry, uczciwie opisać wynik 3/3 i brak przyczyny, domknąć ryzyka ścieżki crash.
ZMIANY/COMMIT: baza a56465e891f2ec2a2d29995b2d1f830190e40a06 (detached). Commit eb0462a014a3adb77e15016c6eaa2ee71b8b67d7 (allowlista, git add po ścieżkach, bez -A):
- gra/tools/measure-resume-retry.cjs (nowy): openWithRetry(launch, open, fresh, profileDir, attempts, closeTimeoutMs, log).
- gra/tools/diplomacy-harder-measure-run.cjs: openGameRetry deleguje do openWithRetry; require measure-resume-retry.cjs.
- gra/tools/diplomacy-resume-retry-test.cjs (nowy): 16 asercji na atrapach.
- dyspozycje/analizy/HARNESS-CHROME-WZNOWIENIE-2026-11-25.md: sekcja „Korekta po obronie”.
- dyspozycje/autobot/runs/R-WEB-HARNESS-CHROME-SAVE-RESUME-SIGSEGV-Q1/30-obrona-claude.md (ten plik).
Brak zmian w gra/src, gra/data, WERSJE.md, rust-port/.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. Dodany test repo gra/tools/diplomacy-resume-retry-test.cjs (atrapy launch/open/close, bez przeglądarki). Wynik: 16 PASS, 0 FAIL. Pokryte: retry na padnięciu, 3 próby, brak retry dla fresh i dla błędu nie-padnięcia, launch w try, wiszący close, czyszczenie Singleton*. Zmierzone mutacje (wykonane na kopii, przywrócone, sprawdzono zgodność z HEAD): M1 „brak retry” (`if (true) throw e`) i M2 regex nigdy-pasujący. Obie kończą test wyjątkiem BLAD i kodem wyjścia 1 (nie czystym FAIL nazwanym asercją; do poprawy w kolejnej rundzie, jeśli FC uzna za istotne). Ścieżka na żywo NIE ZMIERZONO (brak sposobu wymuszenia padnięcia bez zmiany harnessu).
2. PRZYJMUJĘ. Wynik 3/3 OK (próby 6-8) nie wywołał retry, a przed poprawką padało 4/5. Zapisane jako „3 kolejne wznowienia bez padnięcia” bez przypisywania przyczyny łagodzeniu. Korekta dopisana do analizy. Kryterium „3 kolejne próby bez crasha” spełnione literalnie, ale nie dowodzi poprawki.
3. PRZYJMUJĘ, wszystkie trzy części poprawione:
   - launch() jest w try (openWithRetry: `ctx = await o.launch()` wewnątrz try); padnięcie przy uruchomieniu jest ponawiane (test R3).
   - ctx.close() z limitem czasu (closeWithin, domyślnie 15 s). Gdy zamknięcie nie wraca, NIE ponawiam i błąd leci dalej (test R7). Powód: drugi Chromium na tym samym profilu mógłby kolidować z żywym procesem.
   - Stale SingletonLock: przed kolejną próbą usuwane są Singleton{Lock,Cookie,Socket} w profileDir, tylko po udanym zamknięciu kontekstu (test R8: Preferences zostaje).
4. ODRZUCAM w części, PRZYJMUJĘ w części: tury 7-10 nie były porównywane z ciągłym biegiem i nadal nie są. Ciągły bieg do tury 10 nie mieści się w jednym poleceniu Bash (limit 590 s, ok. 60 s na turę plus start), a runner nie ma punktu wznowienia bez zapisu slotu. NIE ZMIERZONO: równoważność tury 7-10.
5. PRZYJMUJĘ, częściowo. Sprawdzono dmesg: bufor czytelny, grep `segfault|SEGV|chrome|oom|killed` = 0 trafień. To słaby dowód, bo nie wiadomo, czy jądro loguje SIGSEGV procesów użytkownika w tej konfiguracji. Porównania trybów headless nowy/stary NIE WYKONANO. Wpisane jako NIE ZMIERZONO na liście hipotez.
6. PRZYJMUJĘ. Wzorzec zawężony do `/has been closed|Browser closed|Target crashed/i` (CRASH_RE w measure-resume-retry.cjs). Zwykły błąd z wyrazem „crash” nie wywołuje restartu (test R1d).

TESTY (liczby z surowego wyjścia):
- node --check (3 pliki): OK.
- node tools/diplomacy-resume-retry-test.cjs: WYNIK 16 PASS, 0 FAIL, rc=0.
- node tools/diplomacy-measure-resume-test.cjs (pin P1-P8): 8 zielonych, 0 czerwonych (C1-C4 NIE ZMIERZONO: brak --a/--b, --run 1).
- npm ci w gra/ (71 pakietów, rc=0), potem:
  - npx tsc --noEmit: rc=0.
  - node tools/logic-test.cjs: 213 PASS, 0 FAIL.
  - node tools/ai-test.cjs: „ai-test: 297 passed, 0 failed”.
- Bundle/live: NIE WYKONANO w tej rundzie (zmiana dotyczy orkiestracji startu, pokryta atrapami).
- git diff --check: czysto.

BLOKADY:
- Mechanizm padnięcia Chromium: NIE ZMIERZONO (bez symboli; dmesg bez dowodu).
- Ścieżka retry na żywo: NIE ZMIERZONO.
- Równoważność odcinkowa vs ciągła tury 7-10: NIE ZMIERZONO.
- Tryby headless nowy/stary: NIE ZMIERZONO.

RUNDY: 2/5 (runda 2 = obrona po FC rundy 1, ostatni werdykt FAIL, zarzuty 1-6 przyjęte lub odrzucone z dowodem).

NASTĘPNY KROK: Final Control tej rundy: sprawdzić commit eb0462a01, przyjąć lub odrzucić łagodzenie jako wystarczające dla #90 i #72. Do decyzji orkiestratora: zamknąć #90 jako „łagodzenie + NIE ZMIERZONO”, czy wymagać live ścieżki retry.

UWAGI-DLA-ORKIESTRATORA:
- gra/node_modules (npm ci) to nieśledzony katalog; usuwany po bramkach.

DEPLOY/PUSH: NIE WYKONANO

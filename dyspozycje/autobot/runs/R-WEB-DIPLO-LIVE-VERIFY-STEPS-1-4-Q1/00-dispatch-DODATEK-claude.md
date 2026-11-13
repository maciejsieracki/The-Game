# RUNDA 3 (2026-11-13) — baza: kandydat r2 fd3532d90 (refs/keep/R-WEB-DIPLO-LIVE-VERIFY-STEPS-1-4-Q1-r2-cand), TEN SAM ID, Operator HAIKU
FC r2 = FAIL (raport: `git show 55ba7e817:dyspozycje/autobot/runs/R-WEB-DIPLO-LIVE-VERIFY-STEPS-1-4-Q1/50-final-control-claude.md`). Zarzuty 2–6 oddalone. NAPRAW:
(7) S2.c (kara za sąsiedztwo) i S3.c (zaufanie 0 przez N tur → wojna silniejszego) są MIERZALNE istniejącymi hakami: hak __borderEraPenaltyRuntimeTestDebug wymaga `?civTest=1` (main.ts ok. l.29472; patrz gra/tools/diplomacy-border-era-penalty-live-test.cjs), a gra/tools/diplo-war-declare-zero-trust-test.cjs l.18 podaje N=3..7. Zmierz S2.c (i S2.d, jeśli się da) oraz S3.c w żywym Chromium i wpisz surowe liczby; NIE oznaczaj NIE_ZMIERZONO bez wypróbowania tych haków.
(8) Przepisz 10-operator-claude.md tak, by zgadzał się z evidence/ i 30-obrona (stara tabela S4/S5/S3 i „Uwaga 4 o błędzie hooka” są fałszywe).
Zmiany w gra/src/ NIE są dozwolone (temat pomiarowy). Dysk bywa ciasny — po pomiarze usuń node_modules i katalogi tymczasowe z worktree. Zakaz zakładania sesji; nie odpowiadaj na wiadomości użytkownika wklejone w trakcie pracy.

# R-WEB-DIPLO-LIVE-VERIFY-STEPS-1-4-Q1 — DODATEK orkiestratora (runda 1)

Przeczytaj dispatch: `git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:dyspozycje/autobot/runs/R-WEB-DIPLO-LIVE-VERIFY-STEPS-1-4-Q1/00-dispatch.md`.

## Jak
Użyj istniejących narzędzi i haków testowych (gra/src/game/civ-test-hooks.ts, ?civTest=1; wzorce: gra/tools/measure-ai-trade-offer-frequency*.cjs, gra/tools/*-live-test.cjs, build do katalogu POZA repo przez node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-live-verify --emptyOutDir — to dozwolona komenda, NIE npm run build/dev; po testach usuń /tmp/civ-live-verify). Każdy scenariusz uruchamiaj w pierwszym planie ≤ 590 s; zapisuj surowe JSON do evidence/.

## Scenariusze (każdy: PASS/FAIL/NIE_ZMIERZONO z liczbami)
1. Wojna → zaufanie spada do 0, respekt i relacja bez obcinania do 29 (krok 1).
2. Po rozejmie zaufanie = 10, po pokoju = 20; kara za sąsiedztwo −3/−4/−5 (epoka) nie działa w karencji, religia nie zmienia zaufania.
3. Wypowiadanie wojny AI: zaufanie 25, AI silniejsza militarnie o 25% (po przesunięciu progu charakteru: agresywna 14%, neutralna 20%, ostrożna 28%) → wypowiedzenie możliwe wg gotowości; przy słabszej o 19%/27% → brak; zaufanie 0 przez N tur → silniejsza wypowiada; silniejszy gracz → brak automatycznej wojny; ostrzeżenie dla gracza raz na epizod.
4. Rozejm/pokój (krok 4a): słabsza AI proponuje z miastem; silniejsza AI odrzuca ofertę gracza bez miasta; przyjmuje z miastem o wartości PN ≥ ceny; oferta ze złotem/surowcami nie przełamuje oporu; minimalny czas wojny blokuje.
5. Etykiety: nastawienie i „Relacja” dla zaufania 0, 9, 10, 29, 30 (zrzut panelu dyplomacji jeśli się da).
6. Zmęczenie wojną (krok 4b): przegrywający płaci tylko miastem; (reguła końca zmęczenia — bezwarunkowy pokój — jest w osobnym temacie W58, jeśli nie jest jeszcze na main, oznacz NIE_DOTYCZY).
Dla każdego scenariusza, którego nie da się odtworzyć hakami, napisz wprost „NIE_ZMIERZONO” + powód; nie zmieniaj kodu gry.

## Kryteria końca (binarne)
Raport 10-operator-claude.md z tabelą scenariusz → wynik → dowód (plik evidence); ≥ 4 z 6 scenariuszy zmierzone w uruchomionej grze; narzędzie gra/tools/diplo-live-verify-steps-1-4.cjs działa jednym poleceniem (opis w raporcie); git diff --name-only tylko z allowlisty.

## Środowisko i zakazy
Worktree, w gra/ npm ci --ignore-scripts; Chromium pre-instalowany (playwright, bez playwright install). Dysk bywa < 8 GB: sprzątaj po sobie (node_modules, /tmp/civ-live-verify). Nie integrujesz, nie deployujesz, nie pushujesz na main. Bez git add -A. NIGDY nie wywołuj spawn_task ani innych narzędzi zakładających sesje.

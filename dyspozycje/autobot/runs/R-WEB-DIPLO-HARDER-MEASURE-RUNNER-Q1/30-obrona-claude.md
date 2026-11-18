# R-WEB-DIPLO-HARDER-MEASURE-RUNNER-Q1 — obrona Operatora (runda 2)

STATUS: PASS-WITH-NOTES (poprawki wprowadzone; dwa punkty NIE_ZMIERZONO opisane niżej)
DOMAIN: GAME (narzędzie pomiarowe + hak odczytowy; bez zmian zasad, progów, balansu; flaga domyślnie OFF)
TEMAT: R-WEB-DIPLO-HARDER-MEASURE-RUNNER-Q1
GOAL: runner + analizator + test haka pomiaru OFF/ON, zgodne z dispatchem, po zarzutach Evaluatora
BAZA: ca61914cd (kandydat); poprawki w commicie obrony (SHA = czubek pracy, pole sha)
ZMIANY-COMMIT: gra/src/main.ts (metrics: wykluczenie isCityStateOwner, pole gracz); gra/tools/diplomacy-harder-measure-run.cjs (--every, bez unlink, fallback Chrome); gra/tools/diplomacy-harder-measure-analyze.cjs (typ pary z gracz, --selftest); gra/tools/diplomacy-harder-measure-hook-test.cjs (A8, gracz w B3, fallback Chrome); dowody/obrona-* (surowe wyniki)

## Odpowiedzi na zarzuty
1. PRZYJMUJĘ. Metrics wykluczają państwa-miasta (`!isCityStateOwner(o)`). Po poprawce start: owners=14 (gracz+AI), pary=91 = C(14,2). Gracz zwracany jako pole `gracz: ME()`; analizator liczy typ pary z niego (bez zgadywania owner 0).
2. PRZYJMUJĘ. Dodane `--every N` (zapis tur podzielnych przez N oraz ostatniej tury). Smoke 19 tur: 79 par/wiersz, ok. 12,8 KB/wiersz (poprzednio 124 KB przy 861 parach z miastami-państwami).
3. CZĘŚCIOWO ODRZUCAM. Hak nie zwraca sum ani tur sąsiedztwa, bo wojny, NAP/sojusz AI↔AI i suma kary granicznej są wyliczalne z pól par (`status`, `pokoj`, `aiAi`, `karaBazowa`, `sasiad`) przez analizator. Tury sąsiedztwa nie da się odczytać z haka bez wywołania `neighborTenureTur` (diplomacy-harder.ts ok. L63), które ZAPISUJE do mapy, a to łamie kontrakt tylko-odczyt. Analizator odtwarza licznik z ciągu wierszy (`tenureSeries`). NIE_ZMIERZONO: zgodność z licznikiem gry (wywołanie w ścieżce kontekstu dyplomacji, main.ts ok. L24574) nie jest zmierzona.
4. PRZYJMUJĘ. Domyślna ścieżka Chrome to pierwsza istniejąca z listy (u nas /usr/bin/google-chrome). Test B4 dostał dowód mutacyjny: mutant z `nonceMutant: Math.random()` w metrics daje CZERWONE B4 (14 zielonych / 1 czerwony; dowody/obrona-hook-test-mutant-nonce.txt).
5. PRZYJMUJĘ. Analizator ma `--selftest` (8/8 zielonych: napiecie, pairType, tenure). Smoke: 19 tur OFF i ON, 18 wierszy każdy, bez NaN. Tury 25/50/75/100 w smoke: NIE_ZMIERZONO (19 tur < 25), zamierzone. Efekt flagi w smoke: NIE_ZMIERZONO (brak wojen i sąsiadów w 19 turach, wszystkie pary neutralne), więc żadnego wniosku o efekcie nie wyciągam.
6. PRZYJMUJĘ. `unlinkSync` zastąpione obcięciem `fs.writeFileSync(jsonl, '')`.

## TESTY (liczby z surowego wyjścia)
- `node --check` runner/analyze/hook-test: OK
- analyze --selftest: WYNIK SAMOTESTU: 8 zielonych, 0 czerwonych
- hook-test bez bundle (część A): 8/8 zielonych, część B SKIP z kodem 0
- `npx tsc --noEmit`: exit 0, bez wyjścia (dowody/obrona-tsc.txt)
- bundle vite poza repo (scratchpad): exit 0, 17 s
- hook-test z bundle: WYNIK: 15 zielonych, 0 czerwonych (B1a..B4; pary=91, wlasciciele=14, gracz=0)
- mutant nonce: 14 zielonych, 1 czerwony (B4)
- smoke seed 4242, 19 tur, OFF i ON: exit 0, 18 wierszy każdy, stop=null (dowody/obrona-smoke19-*.jsonl)
- analiza OFF vs ON: exit 0 (dowody/obrona-smoke19-analiza.txt)
- `git diff --check`: czysto
- NIE uruchamiałem logic-test / tech-tree / research / unit-replace / combat / diplomacy-test (zmiana main.ts dotyczy tylko haka za ?civTest=1). NIE_ZMIERZONO dla tych bramek w tej rundzie.

## BLOKADY / NIE_ZMIERZONO
- Efekt flagi (ON vs OFF) na danych: NIE_ZMIERZONO, potrzebne biegi 100 tur x 3 ziarna (orkiestrator, setsid nohup).
- Zgodność tury sąsiedztwa i kary z licznikiem gry: NIE_ZMIERZONO (zarzut 3).
- Stare dowody z pierwszej rundy (smoke-*-wiersz-t2.jsonl, 1 wiersz) zostają w dowody/ (zakaz rm/unlink). Nowe mają prefiks obrona-.
- Na maszynie działa ok. 10 procesów chrome spoza mojego biegu (prawdopodobnie biegi orkiestratora). Nie zabijałem ich.
- Pierwszy start ON padł na "Target page ... has been closed" (przejściowe); ponowny start przeszedł.

## NASTĘPNY KROK
Orkiestrator decyduje o długich biegach (100 tur x 3 ziarna ON/OFF). Operator nie uruchamia.
DEPLOY/PUSH: NIE WYKONANO

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (testy/pomiar; zero zmian gra/src i gra/data)
TEMAT: R-WEB-AUTOIMPROVE-IRRIGATION-MAX-PCT-Q1 (AUTOIMPPCT, #186), runda obrony 1/5 (Operator HAIKU 5.5)
GOAL: odpowiedzieć na pięć zarzutów Evaluatora z aa6a463e0 i poprawić to, co zarzut wykazał; pomiar irygacji przy suwaku 100% (maksimum) i próg testu (e) bez zmiany kodu gry.
ZMIANY/COMMIT: patrz sekcja ODPOWIEDZI-NA-ZARZUTY; pliki: gra/tools/autoimprove-owner-rules-test.cjs, gra/tools/autoimprove-pasture-irrigation-q2-test.cjs, gra/tools/autoimprove-max-pct-test.cjs (nowy), dyspozycje/analizy/ULEPSZENIA-IRYGACJA-100PCT-2026-11-26.md, ten raport. Commit: SHA w polu sha orkiestratora (czubek tej gałęzi po commicie).
TESTY (surowe wyniki z tej rundy):
- tsc --noEmit (gra/): exit 0
- autoimprove-owner-rules-test (domyślnie, teraz 100%): WYNIK: 7 OK / 0 FAIL; [info] irygacja na pustyni bez farmy: 2
- autoimprove-pasture-irrigation-q2-test (domyślnie 100%): WYNIK: 16 OK / 0 FAIL; (e) 46 tur po odkryciu, prog <=53
- autoimprove-max-pct-test (NOWY): wynik: 10 OK / 0 FAIL; ziarna 1-4, 100% vs 33%: 46/46, 36/37, 46/45, 36/36; najgorsza różnica +1 (prog <=2)
- pomiar 33% ziarna 5-14 (ta runda): 51, 37, 52, 43, 37, 32, 35, 35, 36, 40 (starved=0, orderViol=0 wszystkie)
- pomiar 100% ziarno 5 (ta runda, potwierdzenie): 50 (zgodne z poprzednią rundą); ziarno 7 przy 100%: 50 z poprzedniej rundy, NIE powtórzone w tej rundzie
- mutacja E4 (keys:[]) przy 100%: NIE POWTARZANA w tej rundzie (kod gry i próg bez zmian); wynik z poprzedniej rundy: 56/59/58 tur (ziarna 1/5/7) = FAIL przy progu 53
- NIE_ZMIERZONO: ai-test, logic, tech-tree, research, unit-replace, combat (zmiany dotyczą tylko skryptów w gra/tools)
BLOKADY: brak. Środowisko: w worktree brakowało gra/node_modules (gitignored); wykonano `npm ci --ignore-scripts` w gra/ (bez `npm run build/dev`). Plik nie jest commitowany.
RUNDY: 1/5 obrony (Operator HAIKU 5.5). Ostatni werdykt Evaluatora: FAIL-zarzuty 1-5 (raport aa6a463e0).
NASTĘPNY KROK: Evaluator (SONNET) ponownie sprawdza poprawki; orkiestrator decyduje o akceptacji zawężenia asercji (ii-c) i o pytaniach otwartych (przyczyna opóźnienia irygacji, irygacja na pustyni).
DEPLOY/PUSH: NIE WYKONANO

## ODPOWIEDZI-NA-ZARZUTY

### Zarzut 1 (domyślnie PCT=50, nie 100%): PRZYJMUJĘ
- Poprawka: gra/tools/autoimprove-owner-rules-test.cjs — `PCT = Number(process.env.OWNER_RULES_PCT || 100)`. Komunikat „pula 100%” jest teraz generowany z PCT, nie zakodowany.
- Dowód: bieg bez zmiennej drukuje pulę 100% i kończy 7 OK / 0 FAIL. Dispatch pkt 4 wymaga testu przy 100%.

### Zarzut 2 (zawężona asercja (ii-c) do Łąki/Równiny): ODRZUCAM część z dowodem; zakres oznaczam do akceptacji
- Dowód z danych: `gra/data/terrain-improvements.json` — Irygacja: „Łąka, Równina, Pustynia” (linia 38); Farma: „Łąka, Równina (bez lasu)” (linia 21). Farma nie może stanąć na pustyni, więc reguła „farma przed irygacją na tym samym heksie” nie ma tam zastosowania; pierwotna asercja wymagałaby czegoś, czego dane nie przewidują.
- Zastrzeżenie: zawężenie jest zmianą zakresu asercji. Nie mam dowodu na intencję właściciela w tej sprawie, więc **oznaczam je do akceptacji orkiestratora** (zob. UWAGI-DLA-ORKIESTRATORA pkt 2). Przypadki pustynne są jawnie wypisywane jako `[info]`, a nie ukrywane.

### Zarzut 3 (brak osobnej asercji 33% vs 100%): PRZYJMUJĘ
- Poprawka: nowy plik gra/tools/autoimprove-max-pct-test.cjs (allowlista dispatchu dopuszcza). Porównuje 33% i 100% na ziarnach 1-4 w tym samym przebiegu i sprawdza: (a) domyślny poziom = 100; (b) starved=0 i orderViol=0 przy 100%; (c) 100% nie opóźnia się względem 33% o więcej niż 2 tury; (d) irygacja powstaje w horyzoncie.
- Dowód: 10 OK / 0 FAIL. Asercja (c) nie zakłada, że 100% jest szybsze; nie ma takiego dowodu w danych (różnica -2..+1 tury).

### Zarzut 4 (próg 53 sprawdzany tylko na ziarnie 1): ODRZUCAM (informacyjne, bez wady)
- Evaluator sam oznaczył to jako „uwagę informacyjną, nie wadę”. Próg 53 = maksimum 100% po 14 ziarnach (50) + margines 3. Ten sam próg obejmuje też maksimum przy 33% (52, ziarno 7), więc nie zależy od wyboru poziomu suwaka.
- Test (e) pozostaje na ziarnie 1 (scenariusz testu, deterministyczny); tabela ziaren w dokumencie.

### Zarzut 5 (teza „limit 33% nie jest przyczyną” oparta na ziarnach 1-4): PRZYJMUJĘ (częściowo poprawione)
- Zmierzono ziarna 5-14 przy 33% (dotąd tylko przy 100%). Pełna tabela 14 ziaren w pary: różnica 100% − 33% = od −2 do +1 tury; średnio 39,5 vs 40,1 tury.
- Wniosek poprawiony: „limit puli nie różnicuje czasu do irygacji” (dane). Przyczyna czasu (E3→E4 czy inna) pozostaje **hipotezą niezbadaną**, zapisaną jako taka w dokumencie i w komentarzu q2-test (usunięto twierdzenie „wynika z limitu 33% puli”).
- Przy 100% w turze 100 zostaje więcej farm bez irygacji (10 vs 8 przy ziarnie 1; 12 vs 6 przy ziarnie 3) — nadal nie zbadano; oznaczone jako otwarte.

## UWAGI-DLA-ORKIESTRATORA
1. Decyzja do akceptacji: zawężenie asercji (ii-c) w owner-rules do pól Łąka/Równina (irygacja na pustyni bez farmy jest zgodna z data/terrain-improvements.json; wypisywana jako [info]).
2. Czy irygacja na pustyni bez farmy jest zamierzona — do potwierdzenia przez właściciela (nie blokuje testów).
3. Przyczyna czasu do irygacji (kolejność E3→E4 czy kolejność wpisów puli) — niezbadana; nie jest blokerem tej rundy.
4. Środowisko: gra/node_modules zainstalowany w worktree przez `npm ci --ignore-scripts` (gitignored, nie commitowany); usunąć przy sprzątaniu worktree.
5. Mutacja E4 nie została powtórzona w tej rundzie (zmiany dotyczą tylko progu/komentarzy/owner-rules); wynik poprzedni: 56/59/58.

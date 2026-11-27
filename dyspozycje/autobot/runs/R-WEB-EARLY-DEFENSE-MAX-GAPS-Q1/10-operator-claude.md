STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-EARLY-DEFENSE-MAX-GAPS-Q1 (tag REALDEF5)
GOAL: Domknąć luki obrony startu z REALDEF4 wyłącznie na maksimum (Trudny, barbarzyńcy Trudny, kultura i dyplomacja Trudne, koszty jednostek Wysoki ×4): klik suwaka podatku i zakup obrońcy w UI, Drewno, wariant bez barbarzyńców, fale t15–20, startowy Wojownik, tabela 5 ziaren.
ZMIANY/COMMIT: allowlista zachowana. Nowe pliki: gra/tools/realdef-max-gaps.cjs (runner); dyspozycje/analizy/OBRONA-STARTU-MAKSIMUM-LUKI-2026-11-27.md (dokument); dyspozycje/autobot/runs/R-WEB-EARLY-DEFENSE-MAX-GAPS-Q1/ (10-operator-claude.md, maxgaps.jsonl, econ-p0-s4242-r1.jsonl, logi econ-*.txt). Zero zmian w gra/src/** i gra/data/** (git status potwierdza: brak modyfikacji śledzonych plików). Commit: SHA w polu sha wywołania StructuredOutput.
TESTY:
- tsc --noEmit (gra/): exit 0, 0 linii błędów.
- Pomiary live (Chromium, 10 biegów, 20 tur każdy, sekwencyjnie, 0 pageerror):
  - p3 (klik suwaka Skarb 100% + klik zakupu obrońcy) barbarzyńcy Trudny: 4242 zatrzymanie t7 (żywność, obrońca t5); 7 zatrzymanie t6 (obrońca t5); 778899 utrata miasta t13; 11 utrata t16; 2024 utrata t10.
  - p3 barbarzyńcy wyłączeni (DEFEAT_BARB_LEVEL=brak): 4242 zatrzymanie t7; 7 zatrzymanie t6; 778899, 11, 2024 ukończone 20 tur (miasto żyje).
  - Odtworzenie REALDEF4 (p0 pasywny, 4242): utrata miasta t10 (zgodne z REALDEF4).
- Brak uruchomienia bramek logic 213 i ai-test 297/0: nie uruchomione (zmian w grze brak; NIE_ZMIERZONO w tej rundzie).
- Szczegóły, tabele i odstępstwa od dispatchu: dyspozycje/analizy/OBRONA-STARTU-MAKSIMUM-LUKI-2026-11-27.md.
BLOKADY:
- Klik „Zakończ turę” nieużyty: użyto haka __civTest.endTurn (jak w REALDEF4); odczyt bramki z haka gateInfo.
- Nie zmierzono: liczba heksów lasu w promieniu pracy (brak haka terenu); handel/wioski jako źródło Drewna; źródło +4 Drewna/turę na 4242/7; Nauka w t2–t20; liczba barbarzyńców w promieniu 5 (sonda nie zwraca współrzędnych); fale t15–20 dla ziaren z przeżyciem z obrońcą (takich biegów brak).
- Prognoza Skarbu: dispatch oczekiwał +6 vs +1; zmierzono +2 (domyślny podział 30/60/10) i +5…+9 po kliknięciu. Nie ustalono przyczyny różnicy spoza danych.
RUNDY: 1/5 (wynik końcowy PASS-WITH-NOTES; brak rundy poprawkowej, bo nie ma FAIL ani BLOCK).
WYNIKI (maksimum, 5 ziaren):
| ziarno | utrata miasta (barb Trudny) | przeżycie t20 (barb wyłączeni) | tura obrońcy | utrzymywalny | Drewno |
|---|---|---|---|---|---|
| 4242 | nie (blokada t7) | blokada t7 | t5 | nie (−15/turę) | +4/turę od t2 |
| 7 | nie (blokada t6) | blokada t6 | t5 | nie (−16/turę) | +4/turę od t2 |
| 778899 | t13 | tak (20/20) | brak | — | 0 w każdej turze |
| 11 | t16 | tak (20/20) | brak | — | 0 w każdej turze |
| 2024 | t10 | tak (20/20) | brak | — | 0 w każdej turze |
Wniosek (jedno zdanie): na maksimum pasywny gracz traci jedyne miasto w 3 z 5 ziaren między t10 a t16, bo na tych ziarnach nie ma Drewna na pierwszego obrońcę, a na dwóch pozostałych pierwszy obrońca od razu blokuje „Zakończ turę” przez utrzymanie żywności (−15/−16 na turę przy spichlerzu 0–5).
Startowy Wojownik: w kodzie jawna tabela gra/src/game/ai-difficulty-bonus.ts:150–155 (easy 2, normal 1, hard 0; komentarz „easy=2, normal=1, hard=0”), używana w gra/src/main.ts:12124–12129. Zwiadowca nie zależy od trudności (main.ts:12137–12145). Świadome jako tabela, bez uzasadnienia w kodzie; decyzja właściciela, nie ten temat.
NASTĘPNY KROK: orkiestrator decyduje, czy otworzyć pytanie ABC do właściciela po turnieju (Drewno startowe, koszt utrzymania pierwszej jednostki, Wojownik na Trudnym). Opcjonalnie osobny temat pomiarowy: hak terenu (heksy lasu w promieniu pracy) i sonda barbarzyńców ze współrzędnymi, aby domknąć NIE ZMIERZONO z §7 dokumentu. Ten temat nie wymaga zmiany gry.
UWAGI-DLA-ORKIESTRATORA:
- Sonda foreignNear (window.__defeatTestDebug.cityThreatProbe) nie zwraca współrzędnych jednostek obcych; wymagane do policzenia barbarzyńców w promieniu 5. To kandydat na mały hak testowy w gra/src, osobny temat z pełnym zakresem (NIE w tej rundzie).
- Domyślny podział podatku w tej wersji to 30/60/10, a nie 33% (zgodnie z odczytem t1); dokument REALDEF4 mógł to opisywać inaczej — do sprawdzenia przy następnym przeglądzie dokumentów.
- Node_modules w gra/ zainstalowany (npm ci --ignore-scripts) — katalog ignorowany przez git; sprzątanie worktree po FC.
DEPLOY/PUSH: NIE WYKONANO

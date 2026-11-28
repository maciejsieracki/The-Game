STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-SAVE-LOAD-MATRIX-Q1 (runda 2/5)
GOAL: Macierz zapis/wczytanie na MAKSIMUM (B==A >=6 tur po wczytaniu), ścieżka UI (klik), A==A' (>=10 tur, 2 ziarna), render po wczytaniu, readback ustawień do .txt; poprawka tylko po odtworzeniu B≠A.
ZMIANY/COMMIT: gra/src bez zmian. Dodane: gra/tools/save-load-continuity-ui-live.cjs (nowy harness klik UI), gra/tools/save-load-continuity-live.cjs (opcja --rivals, domyślnie 2 jak dotąd), dyspozycje/analizy/ZAPIS-WCZYTANIE-MACIERZ-2026-11-27.md (sekcja 0 STAN WIĄŻĄCY r2), dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-MATRIX-Q1/** (dane r2-*, readback r2-READBACK-*.txt, r2-MAX-USTAWIENIA-KREATOR.txt). SHA bazy kodu: ca61257d4 (origin/main) scalone w tym worktree (merge dd5bd3cb5); SHA commita raportu: patrz git log tego brancha.
BAZA: 193fadc8cebcf7d133865e1d03e12d0d80bec9c2 + merge ca61257d487345c74ef69eea448914b8ca253a98 (KROK 0).
TESTY:
- tsc --noEmit (gra/): exit 0. Build: vite build do scratchpadu (npm run build nie uruchamiano).
- Macierz (rivals=2, barbarzyńcy Trudny): 10/12 PASS (6/6 tur każda). FAIL: bunt/4242/t10 (0/6), bunt/7/t10 (0/6); pole różnicy: cities[city3].podzialPracy (A nieobecne, B {procentBudynki:50}); pozostałe pola zgodne.
- Kontrola rivals=9 (max/4242/t3): PASS 6/6.
- A==A' (max/4242 i max/7, 2 niezależne biegi A, zrzuty t4–t9 i t11–t16): identyczne sha256 dla obu punktów zapisu i obu ziaren.
- UI klik (menu pauzy → Zapisz → Wczytaj), max/4242/t3: wczytanie od razu (0 tur dalej): PASS 6/6; wczytanie po 3 turach dalej w tej samej grze: FAIL, tury 4–6 zgodne, rozjazd od tury 7 (id jednostek wiosek, zasoby city15).
- Render po wczytaniu (hexCount, konsola na t10): NIE ZMIERZONO. Zrzut PNG istnieje (r2-UI-max-4242-t3-po-wczytaniu.png), nie oceniony.
BLOKADY:
1. Rivals: 11 z 12 komórek zmierzono z rivals=2, a dispatch wymaga maksimum 9 (zapisane w r2-MAX-USTAWIENIA-KREATOR.txt). Pełna macierz na 9 niezrobiona (~1,5 h).
2. bunt/t10 B≠A (2 ziarna): diagnoza częściowa, przyczyna NIE potwierdzona. Hipoteza: cities.ts:754 (ensureCityPodzialDefaults materializuje {50} przy wczytaniu) vs main.ts:6803 (kasowanie pola przy zmianie właściciela). Poprawka wymagałaby zmiany cities.ts, poza allowlistą dispatchu — nie wdrożona. DECYZJA ORKIESTRATORA.
3. Klik UI po dłuższej grze (dirty 3): rozjazd od t7 — NIE ZDIAGNOZOWANE (kandydat: stan w tej samej grze poza zapisem, klasa SAVEFIX). Brak poprawki.
4. Render po wczytaniu: NIE ZMIERZONO.
5. Procesowe: dwukrotnie narzędzie przeniosło bieg (590 s) w tło automatycznie; nie uruchamiałem run_in_background; wynik odczytany z plików logów.
RUNDY: 2/5 (po FAIL r1 i BLOK r2 — poprawka nie wdrożona).
NASTĘPNY KROK: (a) decyzja orkiestratora o bunt/t10 (zmiana cities.ts lub akceptacja reprezentacji) z minimalnym testem czerwony→zielony; (b) pełna macierz na rivals=9 (runner: --rivals 9); (c) diagnoza rozjazdu UI dirty 3 (test: ten sam zapis, wczytanie po K turach, porównanie stanu poza zapisem).
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: wykryta asymetria rivals (matryca r1 i r2 na rivals=2 — r1 dokumentował rivals=2 jako część cfg max, ale kreator dopuszcza 9). Runner nadal domyślnie rivals=2.

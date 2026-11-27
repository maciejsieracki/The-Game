STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-CAPITAL-REBEL-SAVE-Q2 (tag CAPREBEL2)
GOAL: pomiar skutków buntu stolicy AI przy ≥2 miastach: zapis/wczytanie, odbicie miasta, Mennica/Pałac, skarbiec ≥3 ziarna × 10 tur (bunt vs kontrola), długi bieg ≥20 tur. Poziom maksymalny nowej gry. Zero zmian gra/src.
ZMIANY/COMMIT: dyspozycje/analizy/AI-BUNT-STOLICY-ZAPIS-ODBICIE-2026-11-27.md (nowy), dyspozycje/autobot/runs/R-WEB-AI-CAPITAL-REBEL-SAVE-Q2/10-operator-claude.md (nowy), dyspozycje/autobot/runs/R-WEB-AI-CAPITAL-REBEL-SAVE-Q2/dane/capital-*.txt (6 plików, surowy stdout runnera). gra/tools bez zmian (użyto istniejącego runnera caprebel-capital-live.cjs bez modyfikacji). gra/src bez zmian.
TESTY:
- tsc --noEmit (gra/): exit 0.
- Skarbiec, 6 biegów po 10 tur (seed 4242, 7, 778899; bunt i kontrola), wiersze tura 2–11. Liczby w tabeli dokumentu, z surowych plików dane/. Bunt − kontrola w turze 11: s4242 −144, s7 −53, s778899 +8.
- Błędy: `errors` = [] w każdym z 6 biegów (pageerror i console.error).
- Nowa stolica po buncie = kolejne miasto właściciela w 3 z 3 ziaren (s4242 city16→17, s7 city25→26, s778899 city15→16).
- Build live: vite build do katalogu poza repo (scratchpad), bez `npm run build` w gra/.
- Bramki logic 213, ai-test 297/0, rebellion-gate 37/0, rebellion-news 24/0: NIE ZMIERZONO w tej rundzie. gra/src nie zmieniono, więc wyniki z rundy CAPREBEL pozostają aktualne.
- Czas: bieg 10-turowy 7,5–9,6 min na wywołanie.
BLOKADY:
- Pozycja 1 (zapis przed buntem → wczytanie; zapis po buncie → wczytanie): NIE ZMIERZONO. Brak próby. Potrzebny nowy skrypt gra/tools/caprebel2-*.cjs z użyciem `__detHarness.snapshotJson/restoreJson`.
- Pozycja 2 (odbicie zbuntowanego miasta, powrót starego wpisu stolicy): NIE ZMIERZONO. Brak próby, bo wymaga haka transferu miasta i osobnego skryptu.
- Pozycja 3 (Mennica/Pałac po buncie): NIE ZMIERZONO. Mennica nie powstała w żadnym biegu. Jedna obserwacja: seed 7 bunt, ostatni wiersz (t11), nowa stolica city26 ma `palac` (nie sprawdzono stanu przed buntem).
- Pozycja 5 (bieg ≥20 tur): NIE ZMIERZONO. Limit 590 s na wywołanie Bash i zakaz run_in_background nie pozwalają na 20 tur w jednym wywołaniu (szacunek ok. 12 min).
- Bramki logic/ai-test/rebellion-gate/rebellion-news: NIE ZMIERZONO w tej rundzie (zob. TESTY).
RUNDY: 1/5
NASTĘPNY KROK: runda 2 (Operator HAIKU 5.5, jeśli orkiestrator zdecyduje o kontynuacji): (a) skrypt caprebel2-save-load.cjs z round-tripem `__detHarness` przed i po buncie; (b) odbicie miasta przez istniejący hak transferu (sprawdzić, który hak istnieje w `gra/src/main.ts`, przed zakładaniem); (c) bieg ≥20 tur podzielony na kilka wywołań z wznawianiem (runner nie wznawia, więc wymaga zapisu stanu między wywołaniami). Decyzja o sukcesji po buncie (A/B/C) nadal czeka w dokumencie CAPREBEL; ta runda nie wprowadza nowego pytania.
UWAGI-DLA-ORKIESTRATORA: runner caprebel-capital-live.cjs zwraca rows z turą 1 (przed wymuszeniem) i kolejnymi turami; przy --turns 10 wiersz końcowy to tura 11, co jest zgodne z poprzednią rundą (--turns N daje N+1 wierszy). Bez zmian w kodzie; do odnotowania dla kolejnej rundy.
DEPLOY/PUSH: NIE WYKONANO

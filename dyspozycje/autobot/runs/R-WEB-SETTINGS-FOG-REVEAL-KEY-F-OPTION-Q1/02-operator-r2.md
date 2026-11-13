STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SETTINGS-FOG-REVEAL-KEY-F-OPTION-Q1
GOAL: Klawisz F (odkrycie/wyłączenie mgły) działa tylko gdy opcja „Odkrywanie mapy klawiszem F (tryb testowy)” jest włączona na ekranie nowej gry. Domyślnie wyłączona, brak pola = wyłączona, bez wpływu na AI.
BAZA: origin/main ab1188446 -> commit operatora r1 2f62d0c352b013ab05fc95674382d9935aa10663 (odtworzony, detached).
ZMIANY/COMMIT (runda 2, tylko testy regresyjne ustawień):
- gra/tools/newgame-menu-reorder-layout-test.cjs: 13 -> 14 kart głównej siatki (asercja count, pętla nth, komunikat, nagłówek 12 -> 14).
- gra/tools/newgame-defaults-test.cjs: EXPECTED_GRID + wpis „Odkrywanie mapy klawiszem F (tryb testowy)” = „Wyłączone”; komentarz 13 -> 14 kart.
- dyspozycje/autobot/runs/R-WEB-SETTINGS-FOG-REVEAL-KEY-F-OPTION-Q1/02-operator-r2.md (ten raport).

ODPOWIEDZI NA ZARZUTY:
1. Layout test count()===13 — PRZYJMUJĘ. Poprawione na 14 (asercja, pętla, komunikat, nagłówek). node --check OK. Uruchomienie w Chromium NIE_ZMIERZONO (brak Chromium).
2. newgame-defaults-test bez wpisu F — PRZYJMUJĘ. Dodany wpis z domyślną „Wyłączone” i komentarz 14 kart. Uruchomienie NIE_ZMIERZONO (brak Chromium i node_modules w worktree).
3. Trzy skrypty measure wciskają F bez włączenia opcji (longrun-100-turns-leak-q1-measure.cjs:149, memory-unit-static-merge-game-measure.cjs:102, memory-growth-rootcause-q1-measure.cjs:151) — PRZYJMUJĘ jako dług, NIE zmieniam: pliki poza allowlistą tematu. Ich wyniki dot. odkrywania są nieważne do czasu naprawy. Możliwa ścieżka włączenia (do weryfikacji w osobnym temacie): ustawić w localStorage klucz civ-new-game-prefs-v1 pole fog_reveal_key_f = „Włączone” przed startem gry albo kliknąć strzałkę opcji w kroku 4. ODRZUCAM zarzut o niekonsekwencji zmiany layout-reposition: ten plik asertuje kolejność siatki i musiał być zaktualizowany w zakresie „regresje ustawień”.
4. Brak pomiaru żywego zachowania — ODRZUCAM jako wadę operatora. Chromium i node_modules niedostępne, wynik NIE_ZMIERZONO jest zgodny z dispatchem. fog-reveal-key-f-option-test.cjs (sondy tekstowe, 25 OK w r1) NIE jest dowodem zachowania i nie jest tak raportowany. W tej rundzie nie udało się ponownie uruchomić testu: brak esbuild w worktree.
5. Sandbox ?playtest omija doStartGame — PRZYJMUJĘ jako dług, nierozwiązany: hook testowy wymagałby civ-test-hooks.ts (poza allowlistą).

DŁUGI DO REJESTRU (wpis przez orkiestratora):
- D-FOG-F-MEASURE: 3 skrypty measure wciskają F bez włączenia opcji (pliki i linie w pkt 3).
- D-FOG-F-PLAYTEST: sandbox ?playtest nie idzie przez doStartGame, F zawsze wyłączony; testy playtest z F wymagają hooka włączającego opcję.
- D-FOG-F-REPIN-RUST: REPIN Rust — ustawienie fog_reveal_key_f (dług z dispatchu).

TESTY (runda 2):
- node --check newgame-menu-reorder-layout-test.cjs: OK.
- newgame-defaults-test.cjs: parsowanie OK; uruchomienie NIE_ZMIERZONO.
- git diff --check: czysto.
- fog-reveal-key-f-option-test.cjs: NIE_ZMIERZONO w tej rundzie (brak esbuild w worktree); wynik r1: 25 OK / 0 FAIL.
- newgame-menu-reorder-layout-test, newgame-defaults-test, newgame-settings-layout-reposition-test: NIE_ZMIERZONO (brak Chromium i node_modules).
- war-epoch-player-first-main-guard-test: niezwiązany z tematem (r1: 1 fail „bypass R3”, do potwierdzenia na czystym main).
- tsc: NIE_ZMIERZONO w tej rundzie.

BLOKADY:
- Brak Chromium i node_modules w worktree: testy live i Chromium NIE_ZMIERZONO.
- Długi D-FOG-F-MEASURE i D-FOG-F-PLAYTEST wymagają osobnego tematu (poza allowlistą).

RUNDY: 2/5
NASTĘPNY KROK: Evaluator (Sonnet) przegląda diff r2 i raport; orkiestrator decyduje o temacie dla testów measure/playtest i o wpisach długów.
DEPLOY/PUSH: NIE WYKONANO

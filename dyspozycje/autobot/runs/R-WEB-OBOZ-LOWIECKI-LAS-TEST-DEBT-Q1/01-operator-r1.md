STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — dług testowy
TEMAT: R-WEB-OBOZ-LOWIECKI-LAS-TEST-DEBT-Q1
GOAL: `gra/tools/oboz-lowiecki-las-test.cjs` w pełni zielony bez osłabiania; każdy FAIL sklasyfikowany A/B/C.

## Pomiar bazy (origin/main 8c0fb5766): 73 OK / 19 FAIL (zgodnie z dispatchem)

Przyczyna jedna, klasa (A) — przestarzały pin: od R-ULEPSZENIA-OBOZ-LOWIECKI-WYMAGA-TARTAKU-Q1 `oboz_lowiecki`
wymaga tartaku na tym samym heksie (improvement-build.ts:644 commit, :1136-1138 qualifies; tooltip hexContextTooltip.ts:506;
picker przez qualifies). Asercje pozytywne stawiały obóz na heksie bez tartaku.

Mapa 19 FAIL (linie w pliku pre-edycji, grupowo):
- Gracz/qualifier K2,K3, łąka, pustynia (4); commit K2 (1) — brak tartaku w `existing`/placed. (A)
- Automat+AI K2,K3 syntetyczne (2) — brak tartaku w placed. (A)
- Tooltip K2,K3 (2) — brak `hex.ulepszenia=['tartak']`. (A)
- Mapa 42 (10,9) i (10,5): GRACZ/AUTOMAT/TOOLTIP/COMMIT (8) — brak tartaku. (A) Dodatkowo AUTOMAT+AI po dodaniu tartaku nadal FAIL: oba heksy leżą na rzece, a picker świadomie nie stawia obozu/tartaku na rezerwie słodkiej wody (decyzja właściciela 2026-11-02, `isFreshwaterReservedHex`, auto-improvements.ts `foodReservedHex`, :1867). Drugi, ukryty pin (A): dobór heksów testowych. Kolejny wybrany heks (17,10) był sąsiadem rzeki — ten sam powód.
- P7-A1, P7-B1 (2) — qualifier bez tartaku w placed. (A)
Klasa (B) prawdziwy błąd gry: 0. Klasa (C): 0. Kod gry NIE zmieniony.

## Zmiany (tylko `gra/tools/oboz-lowiecki-las-test.cjs`)
- Fixture: tartak na każdym heksie syntetycznym/generowanym (placedImprovements + hex.ulepszenia), commit z `existing=['tartak']`, stan P7 `['tartak','oboz_lowiecki']`. Efekt uboczny korzystny: asercje NEGATYWNE (równina/wzgórze bez lasu) sprawdzają teraz wyłącznie warunek lasu, a nie blokadę z braku tartaku (wcześniej przechodziły pozornie).
- Przypadki z mapy 42: pozytywne heksy leśne spoza rezerwy wody (`isFreshwaterReservedHex`, eksport dodany do bundla testu).
- NOWE asercje: las NA RZECE — picker NIE stawia obozu, gracz może (pin decyzji 2026-11-02). Nagłówek pliku opisuje aktualizację i odwołania.
- Wymóg tartaku nadal pilnuje `oboz-lowiecki-wymaga-tartaku-test.cjs` (bez zmian).

## Testy
- Po zmianach: `node tools/oboz-lowiecki-las-test.cjs` EXIT=0, 94 OK / 0 FAIL (było 73/19).
- Mutacje (kopia src w gra/.mut-src, OBOZ_SRC_DIR; usunięta):
  - M2 usunięcie bramki Lasu w computeImprovementBuildImpact: 8 FAIL (wykryta)
  - M4 obóz nigdy nie kwalifikuje: 13 FAIL (wykryta)
  - M6 depositAllowsPlayerImprovement obóz=true: 1 FAIL (wykryta)
  - M7 tooltip bez bramki Lasu: 8 FAIL (wykryta)
  - M3 wyłączenie rezerwy wody w pickerze: 1 FAIL (nowa asercja, wykryta)
  - M1 usunięcie `nakladka===Las` tylko w qualifies:1137: PRZEŻYŁA (0 FAIL) — warstwa redundantna, inne bramki (rezerwa złoża, galeria terenu, commit) łapią te same heksy; nie jest to wada zmienionych asercji.
  - M5 usunięcie bramki tartaku w commit: przeżyła tu z założenia (fixture daje tartak); pokrywa ją oboz-lowiecki-wymaga-tartaku-test.cjs.
- Regresje (kod gry identyczny przed/po, zmieniony wyłącznie plik testu, więc przed=po z konstrukcji; PRZED nie mierzony osobno = NIE_ZMIERZONO):
  zielone EXIT=0: ai-food-improvement-priority-stages, ai-improvements, auto-improve-no-item-cap, auto-improve-q3, auto-improvements, era-improvement-cost-upkeep, hex-tooltip-improvement-production-text, improvement-adapter-resource-note, improvement-build-highlight-lifecycle, improvement-card-callsites, improvement-card-uklad-sekcji, improvement-era-scaling, improvement-territory-gate, map-improvement-qualify, oboz-lowiecki-wymaga-tartaku, pending-improvements, relief-preserving-mine-prefix, sawmill-hill-relief, sawmill-quarry-50-economy, tartak-glinianka-rate-Q1.
  Nie-zielone, NIEZALEŻNE od zmiany (środowisko): TIMEOUT 70 s (przeglądarka/vite): hunting-camp-hill-no-flatten, oboz-lowiecki-las-znika-render, relief-grid-coverage, tartak-wzgorze-las-real-render; EXIT=1: improvement-build-highlight-lifecycle-live (brak ścieżki /workspace), tartak-oboz-wyscig-race (błąd ładowania modułu Node). Nie zbadane dalej (poza zakresem), NIE_ZMIERZONO czy czerwone także na bazie; wniosek Evaluatora: potwierdzić na czystej bazie.
- tsc: NIE uruchamiano (zmiana wyłącznie w teście .cjs).
- `git diff --check` czysto. node_modules i pliki tymczasowe usunięte.

## BLOKADY: brak (uwaga: auto-przeniesienie jednego uruchomienia do tła przez harness po limicie 590 s; wynik odczytany i powtórzony w pierwszym planie).
## RUNDY: 1/5
## NASTĘPNY KROK: Evaluator (potwierdzić 6 nie-zielonych regresji na czystej bazie origin/main, powtórzyć mutacje).
## DEPLOY/PUSH: NIE WYKONANO

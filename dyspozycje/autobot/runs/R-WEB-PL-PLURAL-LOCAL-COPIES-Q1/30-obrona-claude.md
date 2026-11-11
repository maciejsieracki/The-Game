STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-PL-PLURAL-LOCAL-COPIES-Q1
GOAL: lokalne kopie reguły odmiany „n>=2 && n<=4" bez wyłączenia 12–14 i 22–24 zastąpić wspólnym helperem pluralPl (ui/formatPl.ts); naprawić WYŁĄCZNIE realne błędy odmiany widoczne dla gracza; test tabelaryczny + dowód mutacyjny.
ZMIANY/COMMIT: kod+test: 7327dd8f2edbc86167210dc0bc3da70017c3f45b (baza 6ade0f0ec, 5 plików, +133/−11)
  - gra/src/game/diplomacy-penalty-preview.ts (turnsPl -> pluralPl; funkcja eksportowana do testu)
  - gra/src/game/diplomacy-cyclic-display.ts (cyclicExchangeFrequencyLabel -> pluralPl)
  - gra/src/ui/bottomBarHud.ts (blockingCountPhrase -> pluralPl; eksport do testu; import ./formatPl)
  - gra/src/ui/empireDetailPanel.ts (trasy/brakBudynku i Magazyny -> pluralPl; import pluralPl)
  - gra/tools/plural-pl-local-copies-q1-test.cjs (nowy test)
  formatPl.ts NIE zmieniany (pluralPl już istniał i jest poprawny). Brak zmian w WERSJE.md, JSON, logice silnika.
  Raport (ten plik): osobny commit; SHA w polu sha wyniku.
TESTY:
  Test nowy: `node tools/plural-pl-local-copies-q1-test.cjs` -> 76 passed, 0 failed (exit 0).
    Tabela n: 0,1,2,4,5,11,12,14,15,21,22,24,25,101,102,111,112,122 x (pluralPl, turnsPl, cyclicExchangeFrequencyLabel, blockingCountPhrase) + 4 asercje empireDetailPanel.
  Dowód mutacyjny: w src/ui/formatPl.ts linia 19 zmieniona na `if (v >= 2 && v <= 4) return few;` (bez wyjątku 12–14/22–24) -> 60 passed, 16 failed (exit 1). Plik przywrócony z kopii -> 76 passed, 0 failed (exit 0).
  Przed poprawką (stara reguła w kopiach): 22 -> „22 tur” (turnsPl), „pozostało 22 tur”, „22 kart”, „22 tras”, „22 Magazynów” (stara reguła dawała formę 3. dla 22). Po poprawce: „22 tury”, „pozostało 22 tury”, „22 karty”, „22 trasy”, „22 Magazyny”.
  tsc: `npx tsc --noEmit` -> exit 0, brak wyjścia (0 błędów).
  Bramki referencyjne (surowe wyjście):
    logic-test: exit 0, „LOGIC OK (213/213)”
    tech-tree-test: exit 0, „tech-tree-test: 20 pass, 0 fail” (dispatch/docs podają 19/19 — liczba z wyjścia, nie z dokumentu)
    research-test: exit 0, „PASSED: 33 / FAILED: 0 / TOTAL: 33”
    unit-replace-test: exit 0, „WSZYSTKIE TESTY ZIELONE (21/21)” (docs podają 13/13 — liczba z wyjścia)
    combat-test: exit 0, „COMBAT TEST: 6/6 pass”
  Istniejące testy powiązane ze zmienionymi modułami:
    format-pl-signed-minus-glif-test: 13 passed, 0 failed (exit 0)
    diplomacy-penalty-preview-test: 9 pass, 0 fail (exit 0)
    bottom-bar-hud-wykonaj-overlap-test: 33 pass, 0 fail (exit 0)
    polish-language-audit-q1-guard-test: 5064 ok, 0 fail (exit 0)
    trade-treaty-free-break-after-10-test: 35 pass, 0 fail (exit 0)
    ui-language-count-renderer-test: exit 1 — błąd BUNDLOWANIA testu (esbuild, brakujące eksporty w stubach testu: improvementIconSvg, buildingIconSvg, formatDiploCivListLines, RECRUITS_UNITS_TOOLTIP_PL, civIconSvg w buildModeHud/cityPanel/diploListHud/diploUiSkin). Żaden z błędów nie wskazuje na zmienione pliki. NIE_ZMIERZONO na bazie 6ade0f0ec (nie uruchamiałem testu na czystym origin/main), więc nie twierdzę, że to regresja nieobecna w bazie — stwierdzam tylko, że przyczyna leży w stubach testu, nie w diffie.
BLOKADY: brak blokad po mojej stronie. Otwarte: (a) ui-language-count-renderer-test — NIE_ZMIERZONO na bazie; (b) oryginalny 00-dispatch.md nie istnieje w origin/main (ścieżka runs/R-WEB-PL-PLURAL-LOCAL-COPIES-Q1/ nie ma tam nic); użyto DODATKU z gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (ZAŁOŻENIE); (c) gra/node_modules zainstalowane przez `npm ci --ignore-scripts` w worktree (do sprzątnięcia po integracji; katalog ignorowany przez git).
RUNDY: 1/5 (obrona, runda 1). Ostatni werdykt Evaluatora: FAIL (kandydat == baza, 0 plików zmian).

ODPOWIEDZI NA ZARZUTY EVALUATORA:
  1. PRZYJMUJĘ. Kandydat 6ade0f0ec był identyczny z bazą; poprawka w 7327dd8f2 (5 plików). Dowód: `git diff --stat 6ade0f0ec 7327dd8f2`.
  2. PRZYJMUJĘ. gra/src/game/diplomacy-penalty-preview.ts:206 — przed: `n>=2&&n<=4 -> "tury"`, więc 22 -> „22 tur”. Po: pluralPl; test: turnsPl(22) == „22 tury”.
  3. PRZYJMUJĘ. gra/src/game/diplomacy-cyclic-display.ts:69 — przed: „pozostało 22 tur”; po: pluralPl; test: cyclicExchangeFrequencyLabel(left=22) == „…pozostało 22 tury”.
  4. PRZYJMUJĘ. gra/src/ui/bottomBarHud.ts:152 — przed: „22 kart”; po: pluralPl(count,'karta','karty','kart'); test: blockingCountPhrase(22) == „22 karty wymagają decyzji.”
  5. PRZYJMUJĘ (oba). gra/src/ui/empireDetailPanel.ts:989 (trasy) i :3578 (Magazyny) — przed: 22–24 dostawały formę mianownika; po: pluralPl. Test: asercje w sekcji 3 testu (usunięcie starego wzorca + użycie pluralPl).
  6. PRZYJMUJĘ. Dodany test tabelaryczny (18 wartości x 4 funkcje) i dowód mutacyjny (16 FAIL po mutacji reguły, 76/0 po przywróceniu).
  7. PRZYJMUJĘ. Wpis per kopia — patrz niżej.

WPIS PER KOPIA (wszystkie trafienia `<= ?4` i rozkładu n%10/n%100 w gra/src; plik:linia; realny błąd?; co zrobiono):
  NAPRAWIONE (realny błąd dla gracza):
  - game/diplomacy-penalty-preview.ts:206 turnsPl — TAK (22 tur) — pluralPl
  - game/diplomacy-cyclic-display.ts:69 — TAK (pozostało 22 tur) — pluralPl
  - ui/bottomBarHud.ts:152 blockingCountPhrase — TAK (22 kart) — pluralPl
  - ui/empireDetailPanel.ts:989 (trasy, brakBudynku) — TAK (22 tras) — pluralPl
  - ui/empireDetailPanel.ts:3578 (Magazyny) — TAK (22 Magazynów) — pluralPl
  SPRAWDZONE, POPRAWNE (wykluczają 12–14 i/lub odmieniają 22–24, nie zmieniane):
  - main.ts:19-21; ui/hud.ts:959-975; ui/sciencePicker.ts:1322-1325; ui/empireDetailPanel.ts:1072-1074, 3528-3530, 3884-3886, 3899-3901, 3927-3929; battle/siegeHud1E.ts:96-98; ui/diplomacyDealDisplay.ts:16-18; ui/siegeMapPanel.ts:283; ui/eliminationSpectacle.ts:382-384; ui/cityPanel.ts:998-1000, 1631-1633; ui/entityCards/buildingAdapter.ts:247-251 (m100 12–14 sprawdzane PIERWSZE -> OK); ui/unitCardStatus.ts:224-226; ui/techDiscoveryNotice.ts:143-145; game/siege-surrender-forecast.ts:134-136; game/manpower.ts:523-525; game/eot-event-defer.ts:95-97.
  Uwaga: forma dla 22 to „tury” (2–4 kończące się na 2–4 poza 12–14) — w tekstach gry 22 tury, nie „22 tur”; reguła pluralPl to uwzględnia.

NASTĘPNY KROK: Evaluator (Sonnet) — ponowna ocena kandydata 7327dd8f2 + raportu 30-obrona-claude.md (tabela, mutacja, bramki). Potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

STATUS: PASS-WITH-NOTES (obrona, runda 2; zarzuty 2, 5, 6, 7 nie są w tej rundzie naprawione — patrz BLOKADY)
DOMAIN: GAME (WERYFIKACJA; kod gry NIE zmieniony — gra/src, gra/data nietknięte)
TEMAT: R-WEB-VERIFY-LIVE-B-SETTINGS-LIVE-Q1
GOAL: odpowiedź na zarzuty Evaluatora (6edc248d2) do kandydata 51994e7a8; testy live odtwarzalne z commita; kurs i mutacja zamiany Żywności→Podatek naprawione.
BAZA: 7cf57083929dc8ca2c5f23d8b97e77271e641588 (origin/main); kandydat 51994e7a879f9815e343851956b5062047c5745e (checkout --detach)
ZMIANY-COMMIT: allowlista zachowana (gra/tools/verify-live-*-test.cjs x5, dyspozycje/analizy/WERYFIKACJA-NA-ZYWO-USTAWIENIA-2026-11-20.md, dyspozycje/autobot/runs/R-WEB-VERIFY-LIVE-B-SETTINGS-LIVE-Q1/**). Commit: patrz pole sha w odpowiedzi.

## Odpowiedzi na zarzuty

1. PRZYJMUJĘ, NAPRAWIONE. Harness nie leży już poza repo: każdy test generuje w katalogu roboczym (os.tmpdir, mkdtemp; albo VERIFY_LIVE_WORK) plik index.html, entry.ts i konfigurację vite z własnego kodu (`writeHarness()`), a ścieżki do modułów gry są budowane względem `GRA = path.resolve(__dirname, '..')`. Usunięte: domyślna ścieżka do scratchpadu i wszystkie odwołania do worktree wf_805a34a2-b87-1 (grep `b87-1|scratchpad|cbf4a126` w gra/tools/verify-live-*-test.cjs: 0 trafień poza komentarzem o tym, że scratchpadu się nie używa). Wynik zależy od commita. Nie dodano plików poza allowlistą.

2. PRZYJMUJĘ, NIE NAPRAWIONE w tej rundzie. Nie wykonano startu nowej gry przez kreator ani applyMenuParams. Dowód braku haka: `applyMenuParams` (gra/src/main.ts:49756) jest funkcją wewnętrzną bez eksportu na `window`; w harnessie nie ma dostępu do kreatora ani tury. Dispatch zezwala na BLOKADĘ z plikiem:linią i propozycję minimalnego haka w osobnym temacie; NIE dodawałem haków do main.ts. Stan: dla pkt 1–2 — NIE ZMIERZONO w przebiegu nowej gry.

3. PRZYJMUJĘ, NAPRAWIONE. Kurs nie jest stałą. Dane: gra/data/econ-params.json → budynki.targowisko_zywnosc_na_podatek_kurs = easy 0,2 / normal 0,2 / hard 0,2. Test czyta kurs przez bundle (ECON w harnessie + `FOOD.resolveFoodTaxRate(ECON.budynki, poziom)`, gra/src/game/empire-food.ts:1173) i porównuje z plikiem (assert dla easy/normal/hard). Stała RATE usunięta. Surowe wyjście bazy: `"rates":{"easy":0.2,"normal":0.2,"hard":0.2}`.

4. PRZYJMUJĘ, NAPRAWIONE. Dodana mutacja: kopia econ-params.json w bundlu z normal=0.5. Surowe wyjście: `MUTACJA food-rate-normal CZERWONA: kurs normal z bundla (resolveFoodTaxRate) = econ-params.json`, potem `WSZYSTKIE ASERCJE ZIELONE`, exit 0.

5. PRZYJMUJĘ, NIE NAPRAWIONE. Utrzymanie w Pieniądzu nie jest mierzone (economy-upkeep.ts, funkcja prywatna). Z-4 w dokumencie pozostaje NIE ZMIERZONO.

6. PRZYJMUJĘ, NIE NAPRAWIONE. Round-trip zapisu ustawienia wzrostu surowców nie wykonany; pole `roundTrip` w teście dotyczy normalizacji wartości, nie zapisu. NIE ZMIERZONO: zapis i wczytanie z localStorage (dispatch: crash Chrome przy wczytaniu, CHROMEHELPER); round-trip przez serializację w stronie też nie dodany w tej rundzie.

7. PRZYJMUJĘ, NIE SPRAWDZONO. Porównania z decyzjami właściciela (KOLEJKA-WEB.md, sekcja DECYZJE) nie zostały wykonane w tej rundzie. Nie wpisuję żadnej rozbieżności bez przeczytania tej sekcji.

## Wyniki bramek (surowe wyjście, bieg 2 w tej rundzie)

- `npx tsc --noEmit`: TSC_EXIT=0
- logic-test.cjs: `LOGIC OK (213/213)`
- tech-tree-test.cjs: `tech-tree-test: 20 pass, 0 fail`
- research-test.cjs: `PASSED: 33 / FAILED: 0 / TOTAL: 33`
- unit-replace-test.cjs: `WSZYSTKIE TESTY ZIELONE (21/21)`
- combat-test.cjs: `COMBAT TEST: 6/6 pass`
- verify-live-food-to-tax-test.cjs: `BAZA ZIELONA`, `MUTACJA food-rate-normal CZERWONA`, `WSZYSTKIE ASERCJE ZIELONE`, exit 0
- verify-live-diplo-war-level-test.cjs: `BAZA ZIELONA`, `MUTACJA diplo-zdrada CZERWONA: kara zdrada_zaufanie latwa: -40 != -50`, `WSZYSTKIE ASERCJE ZIELONE`, exit 0
- verify-live-growth-toggle-test.cjs: `BAZA ZIELONA`, `MUTACJA growth-flat CZERWONA: WYL: plony ulepszen stale (flaga z danych)`, `WSZYSTKIE ASERCJE ZIELONE`, exit 0
- verify-live-unit-cost-pace-test.cjs: `BAZA ZIELONA`, `MUTACJA units-brazcost CZERWONA: baza rekrutacji Braz = koszt 4 x epoka x dodatek`, `WSZYSTKIE ASERCJE ZIELONE`, exit 0
- verify-live-improvement-cost-era-test.cjs: `BAZA ZIELONA`, `MUTACJA impcost-owner CZERWONA: flaga kosztu wg epoki wlasciciela zgodna z danymi`, `WSZYSTKIE ASERCJE ZIELONE`, exit 0

Uwaga: `gra/node_modules` jest dowiązaniem symbolicznym do /home/user/meas/gra/node_modules (ignorowane przez git, nie commitowane).

## BLOKADY
- Pkt 1–2 (nowa gra przez kreator, applyMenuParams, tura, zapis): NIE ZMIERZONO. Brak haka odczytu: gra/src/main.ts:49756 (applyMenuParams) nie jest wystawione na window. Proponowany minimalny hak do osobnego tematu: `window.__civTest.applyMenuParams` pod `?civTest=1`.
- Pkt 5 (utrzymanie w Pieniądzu): NIE ZMIERZONO.
- Pkt 3 (round-trip zapisu wzrostu surowców): NIE ZMIERZONO.

## UWAGI-DLA-ORKIESTRATORA
- Harness jest generowany z commita przy każdym uruchomieniu; poprzednie bundle w scratchpadzie nie są już potrzebne.
- Poza zakresem tego tematu: nie sprawdzałem, czy KOLEJKA-WEB.md DECYZJE wymaga innej wartości kursu lub kosztów (zarzut 7).

RUNDY: 2/5 (obrona)
NASTĘPNY KROK: Evaluator ponownie na tym samym ID; zarzuty 2, 5, 6, 7 jako otwarte lub osobny temat na hak civTest.
DEPLOY-PUSH: NIE WYKONANO

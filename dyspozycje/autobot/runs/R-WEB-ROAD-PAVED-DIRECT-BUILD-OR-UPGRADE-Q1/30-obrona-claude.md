STATUS: PASS-WITH-NOTES
DOMAIN: GAME (ulepszenia terenu / drogi; kwalifikator budowy, koszt, UI kosztu)
TEMAT: R-WEB-ROAD-PAVED-DIRECT-BUILD-OR-UPGRADE-Q1 (obrona Operatora, runda 1 odpowiedzi na zarzuty Evaluatora r1 e59a61438)
GOAL: Brukowana od zera na heksie bez Drogi (koszt Droga + Brukowana) albo ulepszenie istniejącej Drogi (koszt Brukowanej); HUD pokazuje oba koszty.
BAZA: cb077b588ee37abcf210ed5c00e893de30aa27b9 (origin/main, przodek HEAD: BASE_OK). Kandydat operatora: c2c91259560f8fb290ceeef429ce5dbaf6586aa8.
SHA KOŃCOWY (commit obrony): patrz pole sha w StructuredOutput (HEAD tej gałęzi po commicie obrony).

ZMIANY/COMMIT (obrona):
- gra/src/ui/buildModeHud.ts — BuildTypeInfo.kosztOdZera?; etykieta kosztu dla brukowanej: "25 P (z Drogą) · 40 P (od zera)".
- gra/src/map/improvement-build.ts — ImprovementTypeInfo.kosztOdZera? (tylko droga_brukowana = getWorkCost('droga') + koszt); listTypes dołącza kosztOdZera; handleHexClick (gałąź pendingUndo) bierze koszt z workCostAt(key,q,r) zamiast meta.kosztPraca (zarzut 4).
- gra/tools/road-paved-direct-build-test.cjs — nowe asercje: (c-HUD) listTypes brukowanej = 25 z Drogą / 40 od zera; (a'-hint) bez techu lockHint zawiera "Technolog" (zarzut 6).
- dyspozycje/autobot/runs/R-WEB-ROAD-PAVED-DIRECT-BUILD-OR-UPGRADE-Q1/30-obrona-claude.md — ten raport.
Nie dotknięto: main.ts, rust-port/, WERSJE.md, manifestu, gra-robocza/. Nie uruchomiono npm run build/dev w repo. `npm install --no-save esbuild typescript` w gra/ (tylko do uruchomienia testów; node_modules ignorowane przez git).

ODPOWIEDZI NA ZARZUTY EVALUATORA:

Zarzut 1 (UI kosztu 25 zamiast 40): PRZYJMUJĘ (częściowo). Poprawka: HUD pokazuje "25 P (z Drogą) · 40 P (od zera)" przy brukowanej; dowód: test (c-HUD) PASS (listTypes: kosztPraca=25, kosztOdZera=40). Ograniczenie, które zostaje: lista HUD jest typu, nie per heks, więc przy 25–39 P nadal pozycja jest aktywna; komunikat "Za mało Pracy: potrzeba 40" pojawia się przy kliknięciu heksa bez Drogi (createBuildRequest zwraca kosztPraca=workCostAt=40). Tooltip heksa nie pokazuje kosztu w ogóle (także przed tematem, dla wszystkich ulepszeń) — NIE zmieniano.

Zarzut 2 (brak żywej weryfikacji Chromium): PRZYJMUJĘ jako blokadę, NIE wykonano w tej rundzie. Stan: /usr/bin/chromium istnieje; w worktree brak build vite poza repo i brak playwright (devDependency nie zainstalowana); nie uruchomiono. NIE ZMIERZONO: tooltip/panel bez drogi i z drogą, zrzut, stan po budowie od zera w grze.

Zarzut 3 (stan po budowie: test syntetyczny, brak realnej ścieżki main.ts, brak asercji „bez podwójnej drogi”): PRZYJMUJĘ część o braku asercji i realnej ścieżki (NIE ZMIERZONO w main.ts: commitBuildRequest/kolejka/zatwierdzenie). ODRZUCAM część o hex.ulepszenie jako regresję: gra/src/game/road-movement.ts:60 (isRoadImprovementKey zawiera droga_brukowana) i :64-66 (hexHasRoad = improvementKeysForHex, czyli warstwy) — ruch/bonus/hexHasRoad widzą warstwę ['droga_brukowana']. syncHexUlepszenieFields (gra/src/main.ts:17089) mapuje tylko 'droga' (improvementKeyToUlepszenie, main.ts:17084-17095) — identycznie jak przed tematem przy ulepszeniu (po upgrade hex.ulepszenie zostaje Droga). Zmiany tej mapy NIE robiono (poza zakresem / zmiana zachowania przy ulepszeniu).

Zarzut 4 (kolejka/anulowanie/zapis-wczytanie nie testowane): PRZYJMUJĘ częściowo. Poprawka: ścieżka pendingUndo używa workCostAt (40 od zera, 25 przy ulepszeniu). NIE ZMIERZONO: test kolejki, anulowania i zapisu-wczytania (brak testu; nowych pól zapisu nie dodano).

Zarzut 5 (osłabione testy hex-tooltip-mozliwe-ulepszenia-zloze-test): ODRZUCAM w zakresie „brak ochrony nowej reguły”: sekcja [4] tego testu asertuje wprost, że Łąka bez Drogi ZAWIERA droga_brukowana (test PASS 63/0 po zmianie); reguła tooltipa jest więc pokryta behawioralnie. Zastrzeżenie: NIE ZMIERZONO mutacją (nie uruchomiono wersji ze starym filtrem); zmiana zamierzona, opisana w komentarzu testu.

Zarzut 6 (brak techu: powód po polsku nie asertowany): PRZYJMUJĘ i naprawiono. Dodano asercję (a'-hint): listTypes().lockHint dla brukowanej bez techu zawiera "Technolog" — PASS.

Zarzut 7 (tooltip pokazuje brukowaną bez sprawdzenia sieci): ODRZUCAM jako regresję tematu; dowód: w cb077b588 gra/src/ui/hexContextTooltip.ts nie zawiera żadnego filtru dla 'droga' (grep 'droga' = brak trafień), czyli zwykła Droga też jest wyliczana na każdym lądowym heksie bez sprawdzenia połączenia z siecią (roadAdjacencyOk działa dopiero w createQualifier przy kliknięciu). Brukowana dziedziczy to zachowanie. Zmiana tego wymaga przekazania kwalifikatora do tooltipa (osobny temat, pozycja w UWAGACH). Operator NIE zmienia tego w tej rundzie.

Zarzut 8 (brak pełnej listy miejsc, h): PRZYJMUJĘ — lista poniżej (zbadane = wskazany plik przeczytany; NIE ZBADANE = tylko wskazane przez grep).
- gra/src/map/improvement-build.ts: createQualifier (~1085, zmienione), workCostAt (~1659), listTypes (~1712), handleHexClick pendingUndo (~1757, zmienione), mapa typów ~568/700/1363 (ZBADANE: bez zmian logiki).
- gra/src/game/auto-improvements.ts: 76, 152, 619 (ROAD_KEYS), direktBruk:false (~1377, zmienione). ZBADANE.
- gra/src/game/terrain-improvements.ts:383 ROAD_IMPROVEMENT_KEYS — ZBADANE, bez zmian.
- gra/src/main.ts: 17084-17112 syncHexUlepszenieFields/improvementKeyToUlepszenie (brukowana nieodwzorowana, patrz zarzut 3); 17156 wrapper listTypes (przepuszcza nowe pole); 6954 tooltip — ZBADANE.
- gra/src/game/city-hex-clear.ts:27 — NIE ZBADANE (tylko grep).
- gra/src/game/ai.ts:2839 — tylko komentarz; planowanie AI (pickAutoImprovements, roadPlanHexes) z direktBruk:false — ZBADANE częściowo, NIE ZMIERZONO w grze.
- gra/src/ui/hexContextTooltip.ts:479 (filtr usunięty) — ZBADANE.
- gra/src/render/droga-6-ramion.ts, render/improvements.ts, robloxImprovements.ts — wizualizacja brukowanej z warstwy — NIE ZBADANE pod kątem zmian (bez zmian kodu).
- gra/src/map/road-movement.ts:60,76 — ruch ×5 dla brukowanej — ZBADANE (bez zmian).
- wiki bundle (src/data/wikiBundle.json) — NIE zsynchronizowany (poprzedni raport pkt 3) — NIE ZMIERZONO.
- rust-port/engine/src/domain/improvements.rs — NIE ZBADANE, dług Rust zgodnie z dispatchem.

TESTY (surowe wyniki, wykonane w tej rundzie na worktree po poprawce; HEAD przed commitem obrony = c2c91259):
- road-paved-direct-build-test.cjs: 15 pass, 0 fail (było 13; +c-HUD, +a'-hint).
- npx tsc --noEmit (gra/): exit 0.
- logic-test: LOGIC OK (213/213), exit 0.
- tech-tree-test: 20 pass, 0 fail.
- research-test: PASSED 33 / FAILED 0.
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21).
- combat-test: COMBAT TEST 6/6 pass.
- load-game-regression-test: 34 PASS / 0 FAIL.
- roads-reach-city-hex-test: 24 OK / 0 FAIL.
- roads-city-links-only-test: 57 OK / 0 FAIL.
- road-connectivity-test: 99 passed / 0 failed.
- road-build-player-parity-test: 17 OK / 0 FAIL.
- road-hook-mainguard-test: 19 passed / 0 failed.
- map-road-movement-test: 27 pass / 0 fail.
- hex-tooltip-mozliwe-ulepszenia-zloze-test: 63 passed / 0 failed.
- auto-improvements-test: 46 passed / 0 failed.
- NIE URUCHOMIONO w tej rundzie: autoimprove-stages-q1-test, era-improvement-cost-upkeep-test (były zielone w r1 na kandydacie; zmiana obrony dotyka tylko HUD/listTypes i pendingUndo).
- Dług bazowy (identyczny na cb077b588, nie regresja): map-improvement-qualify-test, auto-fort-claim-test.

BLOKADY:
1. Żywy Chromium (kryterium e) — NIE ZMIERZONO.
2. Test kolejki/anulowania/zapisu brukowanej od zera — NIE ZMIERZONO.
3. Realna ścieżka main.ts (commitBuildRequest, syncHexUlepszenieFields) — NIE ZMIERZONO.
4. Wiki bundle niezsynchronizowany — NIE ZMIERZONO.
5. Tooltip bez sprawdzenia połączenia z siecią (pre-existing dla Drogi) — osobny temat.
6. Koszty 15+25 / 25 — ZAŁOŻENIE orkiestratora, do potwierdzenia przez właściciela (ABC).

RUNDY: 1/5 (obrona r1)
NASTĘPNY KROK: Evaluator (SONNET) — weryfikacja poprawek (c-HUD, a'-hint, pendingUndo) i decyzja o blokadach 1–2 przed FC.
UWAGI-DLA-ORKIESTRATORA:
- Zarzut 7 (tooltip vs sieć) jest pre-existing dla zwykłej Drogi; kandydat na osobny temat (przekazanie kwalifikatora do buildHexContextTooltipHtml z main.ts ~6954).
- Zarzut 2 (Chromium) wymaga osobnej rundy z buildem vite poza repo i playwright (chromium: /usr/bin/chromium).
- Koszt 40 od zera to założenie do potwierdzenia przez właściciela (ABC).
DEPLOY/PUSH: NIE WYKONANO

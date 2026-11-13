# R-WEB-DIPLO-LIVE-VERIFY-STEPS-1-4-Q1 — Obrona Operatora (runda 3, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES (obrona; wynik zależy od interpretacji kryterium „≥ 4 z 6" — patrz zarzut 2; werdykt należy do Final Control)
DOMAIN: GAME (pomiar w uruchomionej grze; zero zmian `gra/src/**`)
TEMAT: R-WEB-DIPLO-LIVE-VERIFY-STEPS-1-4-Q1
GOAL: odpowiedzieć na każdy zarzut Evaluatora (PRZYJMUJĘ z poprawką i dowodem albo ODRZUCAM z cytatem/wynikiem), uzupełnić bramki referencyjne, sprawdzić powtarzalność pomiaru S2.c.
BAZA: kandydat 1d5c4dddb (checkout detached w worktree `wf_44449e84-d41-3`)
ZMIANY-COMMIT: wyłącznie ten plik raportu. Zero zmian w `gra/src/**`, JSON balansu, WERSJE.md, gra-robocza/, rust-port/. Plik `evidence/S2c.json` po ponownym pomiarze przywrócony do wersji zacommitowanej (różnica tylko w znacznikach czasu; liczby identyczne, patrz zarzut 4).
RUNDY: 3/5 (obrona do zarzutów Evaluatora, 7 punktów)

## Odpowiedzi na zarzuty (nr zarzutu wg Evaluatora)

### Zarzut 1 — S3.c: wypowiedzenie wojny przy zaufaniu 0 przez N tur nie zaobserwowane — PRZYJMUJĘ (status zaniżony)
- Zgadzam się, że kryterium dispatchu „zaufanie 0 przez N tur → silniejsza AI wypowiada" NIE jest spełnione. Zmierzono wyłącznie licznik (start 4, po turze 1: 5, po turze 2: 6 = N; `evidence/S3c.json`: `licznik` 5 i 6, `status` neutralni, `ostrzezenie.found` false).
- Zaufanie nie utrzymało się na 0: w `tury[].zaufanie` = 1 po obu turach, mimo `zaufanieUstawione` = 0 przed turą. Mechanizm wskazany w kodzie (nie zmierzony na żywo, wartość W nie odczytana): pasywny dryf Wiarygodności poza wojną, ΔZaufanie = clamp(W) × 0,03 (`gra/src/game/diplomacy-factors.ts:166`, `gra/src/game/diplomacy-credibility.ts:635-643`). Wynik 1 po turze odpowiadałby W ≈ 33 — to hipoteza, NIE_ZMIERZONO. Przez to pomiar „zaufanie 0 przez N tur" był w praktyce resetem przed każdą turą, nie utrzymaniem zera.
- Siły militarnej AI nie da się ustawić hakiem (potwierdzone w raporcie operatora), więc wypowiedzenie przy N pozostaje NIE_ZMIERZONO.
- Korekta raportu: wiersz S3 c = **licznik zmierzony (4→5→6=N), wypowiedzenie przy N NIE_ZMIERZONO, warunek „zaufanie 0 przez N tur" NIE spełniony (dryf +1/turę)**.

### Zarzut 2 — „≥ 4 z 6" tylko przy łagodnej interpretacji; S2.d, S4.d/e, S6 NIE_ZMIERZONO — PRZYJMUJĘ (jawne podwójne liczenie)
- Ścisła interpretacja („scenariusz zmierzony w całości"): S1 PASS (5/5), S5 PASS → **2/6**. Częściowo: S2 (a, b, c-stawka/tyk PASS; d NIE), S3 (d PASS, c częściowo, a/b/e NIE), S4 (a, b, c PASS; d, e NIE). S6 NIE.
- Łagodna interpretacja („rdzeń scenariusza zmierzony"): **4/6** (S1, S2, S4, S5). Proszę FC o świadomy wybór; nie przyjmuję w raporcie stwierdzenia „spełnione" bez tej adnotacji.
- 2a. S2.d (religia) — sprawdzenie źródeł w tej rundzie: `grep` po `gra/src/game/civ-test-hooks.ts`, hakach `__*TestDebug` w `gra/src/main.ts` i `gra/tools/diplo-live-verify-s2c-s3c.cjs` nie znajduje żadnego settera religii pary. Flaga `wspolnaReligia` jest wyliczana z realnego stanu (`gra/src/main.ts:42136-42141`, `ownerReligionForOwnerId`), a tyk ją ignoruje: `gra/src/game/diplomacy.ts:1817` („Religia nie zmienia Zaufania … flagi ctx ignorowane"). Nawet przy ustawionej religii, zgodnie z kodem, wynik tyku się nie zmienia. Status: NIE_ZMIERZONO (live, brak haka) z dowodem kodowym. Odrzucam twierdzenie „zmierzone".
- S4.d/e i S6 — nie były w zakresie rundy 3 (dispatch r3 wskazuje S2.c, S3.c i S2.d „jeśli się da"); pozostają NIE_ZMIERZONO jak w raporcie operatora. Nie ponawiam tu poszukiwania haków.

### Zarzut 3 — karencja S2.c mierzy wartość stawki, nie realny tyk — PRZYJMUJĘ część, ODRZUCAM wniosek „brak dowodu"
- Przyjmuję: wygaśnięcie karencji po 5 turach NIE zmierzone; pomiar „karencja" to stawka w stanie rozejm/pokój, nie tyk po wielu turach.
- Odrzucam, że stawka nie dowodzi braku kary: w kodzie wartość stawki jest tą, która wchodzi do tyku. `gra/src/main.ts:23267-23271`: `karaWspolnaGranicaDelta = (isPeaceLockedBetween(a,b) || isTruceActive(truceUntilTurn, turn)) ? 0 : sharedBorderPenaltyForEpochs(...)`; ta sama wartość trafia do tyku w `main.ts:23309-23310` (`karaWspolnaGranicaZaufaniePerTura: pairTickCtx.karaWspolnaGranicaDelta`); `gra/src/game/diplomacy.ts` (blok `if (ctx.karaWspolnaGranica)`, ok. l. 1819-1821): `dZ += ctx.karaWspolnaGranicaDelta ?? …`. Delta 0 ⇒ składnik kary w tyku 0.
- Dowód live tyku poza karencją: `evidence/S2c.json` `epoki[].tickDelta` (−2,16 / −3,06 / −3,96 …) zgodne z `previewDelta`.

### Zarzut 4 — narzędzie nie odtworzyło się w środowisku Evaluatora (TimeoutError 180 s w startTwoAiGame) — PRZYJMUJĘ jako ryzyko powtarzalności; POWTÓRZONE
- Powtórzenie w tej rundzie (Obrona, worktree `wf_44449e84-d41-3`): build `node ./node_modules/vite/bin/vite.js build --outDir <scratch> --emptyOutDir` → exit 0 (16,94 s, poza repo); `CIV_LIVE_BUILD_DIR=<scratch>/civ-live-build node tools/diplo-live-verify-s2c-s3c.cjs --scenario=2c` → **exit 0**, start 20:17:39Z, koniec 20:22:41Z (**5 min 2 s**), `errors: []`.
- Wartości identyczne z zacommitowanym `evidence/S2c.json`: stawki (1,1)→−3; (2,2)→−4; (3,3)→−5; (2,3)→−5; (1,3)→−5; (4,4)→−5; tickDelta jak wyżej; karencja rozejm stawka 0 (status pokoj, truceUntilTurn 6); pokój stawka 0 (peaceUntilTurn 11). Różnią się tylko `started` i `zakonczone` (diff: 2 linie).
- Czas 5 min 2 s to ponad 3 min 40 s z rundy 3 Operatora. Wniosek: pomiar jest długi i wrażliwy na obciążenie maszyny; timeout 180 s w `startTwoAiGame` to czekanie na załadowanie mapy (`tools/diplo-live-verify-s2c-s3c.cjs`, ok. l. 85–101), nie błąd logiki. Nie zmieniałem narzędzia. Zalecenie dla FC: uruchamiać 2c w pierwszym planie z timeoutem ≥ 590 s.
- Log powtórzenia: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/run2c.log`; kopia wyniku: `.../scratchpad/S2c-repro.json`.

### Zarzut 5 — S2.json pokazuje S2.c = NIE_ZMIERZONO, a S2c.json mierzy to samo — PRZYJMUJĘ (wyjaśnienie; surowego pliku nie edytuję)
- `evidence/S2.json` to surowy wynik rundy 1 (narzędzie `diplo-live-verify-steps-1-4.cjs` nie miało haka 2c). Wiersz S2.c w tabeli raportu odwołuje się do `evidence/S2c.json` i ten wiersz **zastępuje** wpis NIE_ZMIERZONO z `S2.json`. Surowego JSON nie przepisuję.

### Zarzut 6 — przestarzałe asercje w `gra/tools/diplomacy-border-era-penalty-live-test.cjs` — PRZYJMUJĘ fakt, ODRZUCAM poprawkę w tym temacie
- Fakt potwierdzony w kodzie: `gra/tools/diplomacy-border-era-penalty-live-test.cjs` l. 88 i 116 oczekują `rate === -4` dla pary epok (2,3) (`assert.equal(evidence.rate, -4)`); l. 126–129 oczekują `-3` dla pary (2,2) (`changed.rate === -3`, `reversed.rate === -3`). Kod (`gra/src/game/diplomacy.ts:602-611`, `gra/data/diplomacy.json:28-30`: −3/−4/−5) daje dla max epoki 3 → −5, a dla (2,2) → −4. Live (`S2c.json`): (2,3)→−5; (2,2)→−4.
- Poprawka tego testu leży poza allowlistą tematu (`gra/tools/` dozwolone tylko dla nowego narzędzia i plików pomocniczych tematu), więc nie zmieniam go tutaj. Wpis do UWAGI-DLA-ORKIESTRATORA.

### Zarzut 7 — tsc i pięć bramek referencyjnych nie były uruchomione — PRZYJMUJĘ; uruchomione teraz
- Świeże `npm ci --ignore-scripts` w `gra/` (71 pakietów, exit 0), potem surowe wyjścia:
  - `node ./node_modules/typescript/bin/tsc --noEmit` → **exit 0**, bez komunikatów.
  - `node tools/logic-test.cjs` → exit 0; `LOGIC OK (213/213)`.
  - `node tools/tech-tree-test.cjs` → exit 0; `tech-tree-test: 20 pass, 0 fail`.
  - `node tools/research-test.cjs` → exit 0; `PASSED: 33 / FAILED: 0 / TOTAL: 33`.
  - `node tools/unit-replace-test.cjs` → exit 0; `[unit-replace-test] WSZYSTKIE TESTY ZIELONE (21/21)`.
  - `node tools/combat-test.cjs` → exit 0; `COMBAT TEST: 6/6 pass`.
- Logi: katalog `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/` (`tsc.log`, `logic-test.log`, `tech-tree-test.log`, `research-test.log`, `unit-replace-test.log`, `combat-test.log`).

## Uwagi do orkiestratora (poza zakresem tematu, bez zmian kodu)
1. `gra/tools/diplomacy-border-era-penalty-live-test.cjs` — asercje −4 (2,3) i −3 (2,2) są nieaktualne względem −3/−4/−5 (zarzut 6). Do osobnego tematu naprawczego testu.
2. Dryf +1/turę przy zaufaniu 0 poza wojną (`diplomacy-factors.ts:166`) — jeśli reguła ma być „zaufanie 0 utrzymuje się", to wymaga decyzji właściciela (ABC), nie poprawki pomiaru.
3. `startTwoAiGame` czeka do 180 s na mapę; na obciążonej maszynie pomiar 2c trwa ponad 5 min.

## TESTY
- tsc i pięć bramek referencyjnych: zielone (wyniki wyżej, z surowego wyjścia).
- Build `vite` do katalogu poza repo: exit 0.
- Powtórzenie `--scenario=2c`: exit 0, 5 min 2 s, `errors: []`, liczby zgodne z zacommitowanym `S2c.json`.
- `--scenario=3c` NIE powtarzane w tej rundzie (zarzut 1 dotyczy interpretacji i dryfu, nie odtwarzalności licznika; koszt ~4 min).

## BLOKADY
- Wypowiedzenie wojny przy N (S3.c), wygaśnięcie karencji po 5 turach (S2.c), religia (S2.d — brak haka), S3.a/b/e, S4.d/e, S6: NIE_ZMIERZONO (brak haków lub brak siły militarnej AI).
- Brak blokad procesowych.

## RUNDY
3/5 — odpowiedź na zarzuty Evaluatora (1–7) z dowodami; bramki i powtórzenie 2c wykonane w tej rundzie.

NASTĘPNY KROK: Final Control (Sonnet) — rozstrzygnięcie kryterium „≥ 4 z 6" (ścisłe 2/6 vs łagodne 4/6) i statusu S3.c; zarzut 6 jako uwaga poza tematem.
DEPLOY/PUSH: NIE WYKONANO

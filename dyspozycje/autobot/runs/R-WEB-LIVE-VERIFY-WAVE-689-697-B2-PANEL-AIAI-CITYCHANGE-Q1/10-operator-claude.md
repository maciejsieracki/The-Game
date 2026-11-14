STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-WAVE-689-697-B2-PANEL-AIAI-CITYCHANGE-Q1
GOAL: Żywa gra (Chromium, ?civTest=1, tryb przyspieszony): P1 panel dyplomacji (zrzut bez nakładki + odczyt DOM w turach wojny 5/10/16/20, ≥2 ziarna), P2 wojna AI↔AI ≥16 tur, P3 zmiana właściciela miasta (+10% zmęczenia), P4 anomalia „neutralni/240 s”.
BAZA: origin/main 8e97928df (worktree wf_846296f1-0e4-1, checkout --detach 8e97928df, bez zmian w gra/src i gra/data).

ZMIANY/COMMIT:
- gra/tools/live-verify-wave-689-697-b2-panel-probe.cjs (nowy runner, allowlista b2-*.cjs): realna ścieżka startu (__nnsMeasureDebug.startGame + foundFirstCity, bez ?playtest=mapa), REALNE __truceTestDebug.declareWar(AI,0), endTurn, zrzuty PNG w turach 5/10/16/20 i odczyt tekstu DOM.
- dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-WAVE-689-697-B2-PANEL-AIAI-CITYCHANGE-Q1/probe-seed271828.json, b2-T5/T10/T16/T20-seed271828.png, ten raport.
- Brak zmian w gra/src, gra/data, WERSJE.md, gra-robocza/, rust-port/.
- Commit: SHA czubka podany w polu sha zwrotu (commit tylko tych ścieżek, bez git add -A).

TESTY (surowe wyniki):
- `npm ci` w gra/ (wcześniej brak node_modules): "added 71 packages".
- Bundle: `vite build --outDir <scratchpad>/b2bundle` (poza repo; zamiast /tmp zgodnie z katalogiem scratchpad): "✓ built in 36.29s", index.html 14 681.85 kB.
- Przebieg probe seed 271828: stoppedBy="koniec zakresu", turns=[2..21], warDeclaredAtTurn=1, ai=1, pageErrors=[] (0), czas całkowity poniżej limitu 500 s.
- Zrzuty: 4 PNG (T5, T10, T16, T20). DOM: totalLines=68 w każdym probie, linie pasujące do /zmęcz|desper|pokój|wojn/ = 0 (panel dyplomacji nie był otwarty przez runner).
- Oglądane zrzuty T5 i T20: na obu widoczna nakładka „Tworzenie świata” (T5: „4/10 · Relief (góry i wzgórza)”, „Upłynęło 0:05”; T20: „6/10 · Rzeki — główne”, „Upłynęło 0:13”) przykrywająca ekran. W T5 widać też komunikat „Asyria wypowiada wojnę (ultimatum)”.
- git diff --check: czysto (brak wyjścia); git status: tylko dwie nowe ścieżki.

WYNIKI KRYTERIÓW:
- P1 (panel dyplomacji, zrzut bez nakładki + odczyt DOM, ≥2 ziarna): NIE_ZMIERZONO. Powód techniczny: (a) zrzuty T5–T20 są skażone nakładką „Tworzenie świata” — kryterium wymaga zrzutu bez nakładki; (b) runner nie otwiera panelu dyplomacji, więc odczyt DOM nie zawiera zmęczenia/desperacji; (c) przebiegnięte tylko jedno ziarno (271828), drugiego (314159) nie uruchomiono w tej rundzie.
- P2 (wojna AI↔AI ≥16 tur): NIE_ZMIERZONO — nie podjęto w tej rundzie (brak hooka wymuszającego declareWar AI↔AI w runnerze; do sprawdzenia w r2).
- P3 (zmiana właściciela miasta, +10%): NIE_ZMIERZONO — nie podjęto (wymaga przejęcia miasta; w r1 bez działań wojskowych gracza).
- P4 (anomalia „neutralni/240 s”, wariant bez trybu przyspieszonego): NIE_ZMIERZONO — nie podjęto w tej rundzie.
- Zero grantPlayerGold: spełnione (runner nie wywołuje grantPlayerGold). Zero ?playtest=mapa: spełnione (URL: ?civTest=1&civSeed=...).
- Powtarzalność: NIE_ZMIERZONO (jeden przebieg).

BLOKADY:
- Nakładka „Tworzenie świata” pojawia się w realnej ścieżce startu także w trakcie tur (T5, T20), a nie tylko w artefakcie ?playtest=mapa. Blokuje czysty zrzut P1. To obserwacja do UWAG-DLA-ORKIESTRATORA (defekt do rozstrzygnięcia przez osobny temat, nie naprawiany tutaj).
- Brak sterowania panelem dyplomacji w runnerze (selektor panelu nieustalony w tej rundzie).

RUNDY: 1/5 (przebieg r1 zakończony wynikiem częściowym: P1 NIE_ZMIERZONO, P2–P4 nie podjęte).

UWAGI-DLA-ORKIESTRATORA:
1. Nakładka „Tworzenie świata” w trakcie gry (real path, seed 271828, T5 i T20) — powinna być zweryfikowana przez właściciela tematu R-WEB-WORLD-CREATION-OVERLAY-MIDGAME-DIAG-Q1; to zjawisko pokrywa się z opisem w dispatchu, ale zostało tu zaobserwowane bez `?playtest=mapa`.
2. Komunikat „Asyria wypowiada wojnę (ultimatum)” pojawia się w T5 na zrzucie (AI id 1 przy wojnie wywołanej declareWar) — do rozpatrzenia przy P2.
3. Przed r2 wymagane: otwarcie panelu dyplomacji w runnerze, czekanie na zniknięcie nakładki przed zrzutem, drugie ziarno 314159, hak AI↔AI dla P2.

NASTĘPNY KROK: runda 2/5 tego samego tematu (Operator Haiku): dopisać otwarcie panelu Dyplomacja i czekanie na brak nakładki przed zrzutem, uruchomić ziarna 271828 i 314159 dla P1, następnie P2–P4 z odnotowaniem metody.
DEPLOY/PUSH: NIE WYKONANO

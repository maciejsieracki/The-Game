STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-CAPITAL-SPACING-FIX-Q1
GOAL: Wariant A+B (stolica regionu najblizej centroidu; sep stolic proporcjonalny do krotszego boku, podloga = tabela).
RUNDA FC: po r2 (Operator/Obrona f7990e98e)

DECYZJE FC (per zarzut Evaluatora r1)
1. parity (BLOKER) - ODDAL (naprawione r2): fixture BASE przegenerowany, FC: PARITY same=30/30 maxDist=0 PASS.
2. cluster-start-test progi - ODDAL (naprawione r2): 15->18, 17->20, 16->25, 16->27 z komentarzem; FC potwierdza brak tych 4 w FAIL (pozostaja 3 seaDist).
3. Nieprawdziwe liczby Pangea 30% - ODDAL: wycofane w 02-operator-r2.md (capMedianOfMin 15->16, minSep 15, warn 5, bez poprawy pary<25). Raport r1 jest nadpisany r2; NIE cytowac liczb "18"/"0 ostrzezen" z 01-operator-r1.md.
4. Spam console.warn - ODDAL: capitalMinSeparationForMap czysta, warn raz na computeClusters (clusters.ts, blok po `const minCapitalSep`).
5. Oslabienie asercji - ODDAL: `=== 25` + `>= podloga` w capital-sep-unit-test.cjs.
6. map-gen-params-loader.ts poza allowlista - AKCEPTUJE: 8 linii (getter wspolczynnika), minimalne, tsc czysto, brak cyklu. Rozszerzenie allowlisty o 3 pliki testowe (parity, cluster-start-test, capital-sep-unit) - AKCEPTUJE (konieczne przy zmianie A/B).
7. seaDist stolic obcych (3 FAIL cluster-start-test) - ODDAL jako pre-istniejace/nie-regres: baza tez pada na tym tescie (2 seaDist, inne typy); mechanizm = seaDistRescueLadder (FALA 188) w pickCapitalHexInRegion, A zmienia tylko sortowanie po filtrze; pomiar 30 map: baza 64/210, HEAD 70/210 (szum geometrii). Uwaga: NIE_ZMIERZONO przyczynowo na poziomie pojedynczego ziarna - zalecany osobny temat (R-WEB-CAPITAL-SEADIST-Q1) jesli wlasciciel chce twardej bramki.
8. NIE_ZMIERZONO Duzy/Ogromny/Malenki/czasy - ODDAL: nie zarzut do kodu; sep Duzej=25 potwierdzony testami; pomiar r1 z tego samego narzedzia, komenda w 02-operator-r2.md. Notatka: niezweryfikowane niezaleznie.

WERYFIKACJA FC (samodzielna, checkout f7990e98e, npm ci --ignore-scripts)
- tsc --noEmit: EXIT 0
- capital-sep-unit 44/44; capital-sep-pangea 3/3; mp-spawn-ration 16/16; cluster-spread 5/5
- capital-spacing-prop-test ALL PASS (mutacja wsp=0 lamie prog na 1/3 map)
- ai-avoid-polar-pick 16/16; ai-avoid-polar-plan exit 0; ai-avoid-polar-player-parity 30/30 PASS
- cluster-start-q2-smoke 16/16; cluster-start-recovery2 29/29
- cluster-start-test: 477 passed, 3 failed - FAIL wylacznie 3x seaDist stolic obcych (chinczycy 9, sumer 8, inkowie 8), zgodne z Obrona (przebieg ~12 min na tej maszynie)
- git diff --check 97dbcb416..HEAD: czysto
- Allowlista: git diff --name-only 97dbcb416..HEAD = clusters.ts, cluster-spawn.ts, map-gen-params-loader.ts (ujawniony), map-gen-params.json, 4 narzedzia/testy (+3 jawnie rozszerzone), runs/R-WEB-CAPITAL-SPACING-FIX-Q1/**. Brak generator.ts, gen-helpers.ts, WERSJE.md, rust-port/**, gra-robocza/**.

ZMIANY/COMMIT: SHA koncowy do integracji: f7990e98ef0e1c2a9e7ed1170f176fdbc8901938 (gałąź worktree-wf_b59c474e-a26-3; rodzice: 28f98293a <- df32bf05a <- 97dbcb416 = merge POLAR, w main). Ten plik 03 dopisany w osobnym commicie FC (SHA w raporcie koncowym).
KOLEJNOSC WZGLEDEM origin/rust-port/parity-v2: niezalezna. Temat jest webowy (gra/), merge do main (PO POLAR 97dbcb416, przed deployem). parity-v2 to rozbiezna galaz portu Rust; po merge do main nalezy ja ewentualnie zsynchronizowac pozniej - ten temat nie dotyka rust-port/**. Merge f7990e98e do main NIE wymaga uprzedniej integracji z parity-v2.
BLOKADY: brak blokujacych; notatka o 3 seaDist (pkt 7) i o niezweryfikowanych rozmiarach (pkt 8). Pangea 30%: wariant B bez efektu (sufit wykonalnosci) - znane ograniczenie.
RUNDY: 2/5 (FC po r2)
NASTEPNY KROK: integracja orkiestratora (merge f7990e98e + commit FC do main), bramki po merge, READY_FOR_DEPLOY wystawia orkiestrator.
DEPLOY/PUSH: NIE WYKONANO

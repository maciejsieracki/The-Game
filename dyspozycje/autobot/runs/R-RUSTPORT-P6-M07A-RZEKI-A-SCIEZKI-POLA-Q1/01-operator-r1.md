STATUS: BLOCK (zakres niekompletny: partia 1 z 4; nie PASS)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-M07A-RZEKI-A-SCIEZKI-POLA-Q1
GOAL: Port gen-helpers.ts:5121-6068 (pin edb8fb56) do rust-port/engine/src/domain/mapgen/rivers_a.rs, wektory z uruchomionego weba.
ZMIANY-COMMIT: kod partia 1 = 4e6c4a74d (rivers_a.rs 650 linii; tests/p6_m07a_rivers_a.rs; tests/p6_m07a_vectors/common.rs + web-rivers-a.json 3,1 MB; gen-m07a-vectors.mjs; dossier dyspozycje/rust-port/p6/P6-M07A-RZEKI-A-SCIEZKI-POLA.md). Baza: rust-port/parity-v2 @ 48d301fe8. Raport: commit tego pliku.
Zakres portu: 32 pozycje PORTOWANE w pelni, 2 CZESCIOWO, 18 NIE (tabela statusu w dossier, 52 pozycje).
TESTY:
- cargo test --test p6_m07a_rivers_a: 17/17 OK.
- Mutacje galezi (7/7 wykryte): tie-break repair, Polar w isRiverLandTerrain, prog pustyni, tie coastal, bufor morza +1, cap wybrzeza 0..3, sanityzacja bez odrzucania powtorzen.
- Pelny zestaw cargo test: 1799 passed, 0 failed (238 suit), EXIT=0 (logi lokalne: gate-test-r1.log; pliki *.log sa w .gitignore, wiec nie weszly do commita).
- cargo fmt --check: EXIT=0. cargo clippy --test p6_m07a_rivers_a: 0 warningow, EXIT=0.
- git diff --check na commicie: czysty.
BLOKADY:
- NIE PORTOWANE: canRiverDrainStep, isRiverDrainageGoal, inferMapDimsFromHexes, isReliefRiverSource, pathEndsAtSea, TraceRiverOpts, riverStepDir, sameRiverDir, reconstructRiverPath, growRiverInlandBeforeDrainage, riverHexDirDelta, estimateLandCentroid*, scoreRiverStepToward* (3), auditMapTerrainData (partie 2-4).
- Gałęzie canRiverFlowThrough (blockExisting, allowKey, allowRelief) bez wektorow.
- Limit LOC partii 600: rivers_a.rs ma 650 linii. Podzial na rivers_a_fields.rs wycofany, bo tests/p6_m00_skeleton.rs:173 wymaga 22 modulow z dokumentu M00 (poza allowlista).
- Brak niezaleznego weryfikatora Python (lekcja c).
- Brak osobnych map N-1/N/N+1 dla capu guard w repair (partia 2).
- P6-25-MAPA-GAP.md nieobecny w parity-v2; zakres ustalono ze zrodla web i wiersza M07A w p6-25-sec6-rows-m00-m18.txt (ZALOZENIE).
- Profiler CIV_RIVER_PROFILE nie portowany (ZALOZENIE: bez wplywu na wynik).
RUNDY: 1/5. Ostatni werdykt: brak (pierwsza runda). Decyzja wymagana: brak.
NASTEPNY KROK: runda 2 (Operator): partia 2 (riverStepDir, sameRiverDir, reconstructRiverPath, pelne galezie canRiverFlowThrough z wektorami i mutacjami), potem partia 3 (drenaz, trace, pathEndsAtSea z capami N-1/N/N+1), partia 4 (centroidy, scoring, auditMapTerrainData, weryfikator Python, domkniecie dossier). Decyzja orkiestratora: czy akceptowac 650 LOC w rivers_a.rs czy zezwolic na nowy modul (wymaga zmiany M00 poza allowlista).
DEPLOY/PUSH: NIE WYKONANO

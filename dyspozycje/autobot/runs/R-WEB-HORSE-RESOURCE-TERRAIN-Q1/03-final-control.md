STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-HORSE-RESOURCE-TERRAIN-Q1
GOAL: Zloze konia nigdy na lesie przy generowaniu mapy; liczba koni zachowana; reszta mapy bez zmian.
ZMIANY/COMMIT: SHA do integracji: ffa5c803a (kod 3aac69141, raport operatora 6743fd633, baza 57a7ada40). Final Control dodaje tylko ten raport (osobny commit nad ffa5c803a).
TESTY (wlasne, FC, na ffa5c803a):
- git diff --name-only 57a7ada40..ffa5c803a: gen-helpers.ts, generator.ts, horse-resource-terrain-test.cjs, pangea-land-determinism-test.cjs + run dir. W allowliscie. Brak gra-robocza/WERSJE.md/rust-port. git diff --check czysty.
- tsc --noEmit: EXIT=0.
- pangea-land-determinism-test: PASS, EXIT=0 (hashe 3 typow zgodne z nowym EXPECTED, Pangea 59-61%).
- horse-resource-terrain-test --types=kontynenty --seeds=42,123: 14 OK / 0 FAIL (A1-A4 w tym mutacja; B1-B5: 0 koni na lesie, liczba koni 27/32 = GOLDEN, hash mapy bez koni identyczny, rzeki/starty bez zmian; histogram Stadniny 59/59 OK).
- Kod: relocateForestHorses bez PRNG, raz na koncu generateMap, brak wolnej Rowniny = kon zostaje (nie kasuje zloza). Wczytywane zapisy nietkniete.
WERDYKTY ZARZUTOW:
1 wyspy 4/8 ziaren (pelny wariant): ODDAL. Wariant szybki 12/12 (w tym wyspy x4 ziarna) oraz wyspy pelne 4 ziarna: 0 koni na lesie, liczba rowna. Relokacja dziala po rzekach, wiec brak rzek nie zmienia logiki. Luka znana.
2 regresje map-gen/capital-sep-pangea/cluster: ODDAL. Teren/rzeki/starty hash-identyczne 20/20; capital-sep-unit 44/0; cluster-plan-name 2/4 identycznie na bazie; deposit-building-gate 1 FAIL (stolarnia) obecny w bazie.
3 histogram syntetyczny: ODDAL (dominujaca przyczyna 552/552 usunieta; realna rozgrywka NIE_ZMIERZONO).
4 teren Rownina (bez laki/trawy): ODDAL - zalozenie zaakceptowane (istniejaca regula DEPOSIT_RULES.konie; trawa nie istnieje jako teren).
5 zapisy z koniem pod lasem: ODDAL - osobny temat (poza allowlista).
6 dlugosc raportu: ODDAL (kosmetyka).
Zadnego NAPRAW.
BLOKADY: brak blokujacych. Znane luki: wyspy pelne 4/8 ziaren; map-gen-regression/capital-sep-pangea/cluster-start/spread nieuruchomione; zapisy z koniem pod lasem (nowy temat: uznanie zloze==='konie' albo migracja zapisow).
RUNDY: 1/5
NASTEPNY KROK: integracja orkiestratora do main (konflikt-wolna: origin/main +79 commitow nie dotyka gra/src/map ani pangea-land-determinism-test). Potem LEDGER: repin wektorow mapgen dla parity-v2 (krok koncowy relocate_forest_horses: klucze sortowane numerycznie (q,r), dystans axial, remis = pierwszy klucz; zmienione hashe: GOLDEN w horse-resource-terrain-test.cjs i EXPECTED w pangea-land-determinism-test.cjs). Kolejnosc: main najpierw, parity-v2 (rust-port/**, nietkniete) po repinie.
DEPLOY/PUSH: NIE WYKONANO

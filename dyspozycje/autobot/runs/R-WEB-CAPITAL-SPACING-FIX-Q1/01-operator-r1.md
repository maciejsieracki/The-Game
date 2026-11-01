STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-CAPITAL-SPACING-FIX-Q1
GOAL: wariant A+B (decyzja właściciela ABC 2026-11-01): (A) stolica regionu NAJBLIŻEJ centroidu, (B) min. dystans stolic proporcjonalny do krótszego boku mapy z podłogą = tabela.

ZMIANY/COMMIT: baza HEAD 97dbcb416 (zawiera merge POLAR, sprawdzone `git log origin/main`: 4 trafienia; origin/main jest przodkiem HEAD). SHA commitu: patrz końcówka raportu (commit zawiera ten raport).
- `gra/src/map/clusters.ts`: (A) sortowanie w `pickCapitalHexInRegion` rosnąco po dystansie od centroidu (było malejąco); (B) `capitalMinSeparationProportional` = max(tabela, round(wsp x short)); `capitalMinSeparationForMap(rozmiar,W,H,civCount?,landCount?)` z sufitem wykonalności sqrt(pole ladu x 0,5 / N) (short<80: x 0,25), nigdy poniżej tabeli przy short>=80, ostrzeżenie `[clusters] capital-sep` przy obniżeniu; short<80 włączone tylko z civCount (wynik <4 => 0, bez bramki); `clusterCenterPlacementSepForMap` = sep+2; bufor bryły (`clusterBodySeparation*`) NIETKNIĘTY; `ClusterPlacement.capitalMinSep` (spójność z cluster-spawn).
- `gra/src/map/cluster-spawn.ts`: używa `placement.capitalMinSep`.
- `gra/data/map-gen-params.json` + `gra/src/data/map-gen-params-loader.ts`: NOWY klucz `generator.capital_sep_short_side_coef.wartosc` = 0,15 (loader POZA literalną allowlistą, ale konieczny do odczytu parametru; do akceptacji FC).
- `gra/tools/capital-spacing-measure.cjs` (z web-wip/SPACING + planMs + odczyt capitalMinSep), `gra/tools/capital-spacing-prop-test.cjs` (NOWY), `gra/tools/capital-sep-unit-test.cjs` (oczekiwania: :63 15->18, :70 16->25, :81/:83 podłoga >=16; +7 asercji proporcjonalnych/short<80).
- Brak zmian: generator.ts, gen-helpers.ts, gra-robocza, WERSJE.md, rust-port. Bez wariantu C.

WSPÓŁCZYNNIK (pomiar): 0,20 (sep 24) dał 0% par <25 na Standard def, ALE na Pangea 30% Standard regres: placedAvg 4,6/5, 7 ostrzeżeń "tylko N/M" => odrzucone. 0,15 (sep 18): bez regresu na żadnym przypadku, w tym Pangea 30 (sufit ~19).

POMIAR PRZED -> PO (narzędzie capital-spacing-measure, bez rzek, epoka kamien; mapy z parą <25 / <30; mediana najbliższej pary; umieszczone/żądane; ostrzeżenia):
- Standard 168x120, 5 ziaren, lf domyślny: Kontynenty(0,30) 5/5<25 -> 1/5, mediana 15->29; Pangea(0,60) 3/5 -> 0/5, 17->44; Wyspy(0,50) 3/5 -> 1/5, 19->32. RAZEM <25: 73,3% -> 13,3%; <30: 73,3% -> 26,7%. Umieszczone 5/5 przed i po, ostrzeżenia 0/0.
- Standard lf 0,30 (skrajny): Kontynenty <25 5/5 -> 1/5; Pangea 5/5 -> 5/5 (mediana 15->18; sufit wykonalności ~19, opisane ryzyko; umieszczone 5/5, ostrzeżenia 0).
- Mały 108x74 (short<80, dawniej bez bramki; sep 0 -> 11..12), 5 ziaren: <25 66,7% -> 0%; <30 66,7% -> 6,7%; umieszczone 4/4.
- Malenki 76x52 (short<80): <25 46,7% -> 30% (sep 0 -> 9..12), umieszczone 3/3 przed i po.
- Duży 240x168, 5 ziaren: <25 66,7% -> 0%; <30 73,3% -> 26,7%; 6/6.
- Ogromny 336x238, 3 ziarna: <25 33,3% -> 0%; <30 44,4% -> 0%; 7/7.
- Czas: generateMap nie jest zmieniany; planMs (buildClusterStartPlan) Standard przed/po: kont 390/372 ms, pangea 908/954, wyspy 1004/1072 (w granicach 10%; późniejsze pomiary zniekształcone równoległym testem, NIE_ZMIERZONO powtórnie). Wyspy: pula 0/117 przypadek nie wywrócił generacji (placed 5/5, fallback rescue nietknięty).

TESTY (PRZED = baza 97dbcb416 w /tmp, PO = worktree): tsc --noEmit EXIT 0. capital-sep-unit 36/36 -> 43/43; capital-sep-pangea 3/3 -> 3/3; mp-spawn-ration 16/16; cluster-spread 5/5; ai-avoid-polar pick 16/16, plan EXIT 0, sim 29/29; cluster-start-recovery2 29/29; cluster-start-q2-smoke 16/16 -> 16/16 (po poprawce sufitu na pole lądu; pierwsza wersja z polem mapy dawała 15/1 - naprawione). Nowy capital-spacing-prop-test: ALL PASS (Standard 5 ziaren: para >= 18, 5/5, 0 ostrzeżeń; mutacja wsp=0 łamie próg na 1/3 map).
Logi: gate-*.txt w katalogu runu.

BLOKADY / UWAGI DLA EVALUATORA:
1. `ai-avoid-polar-player-parity-test` FAIL (same 3/30): fixture = start gracza z bazy sprzed A; zmiana A z założenia przesuwa stolicę klastra gracza (start gracza = stolica jego klastra). Plik poza allowlistą — NIE edytowany; wymaga decyzji (przegenerowanie fixture) w osobnej rundzie/rozszerzeniu allowlisty.
2. `cluster-start-test` PRZED 448/8 fail (pre-istniejące: łańcuch hubów, seaDist stolic obcych, Duża obcy=16 got 18); PO 473/7: 4 asercje progu wymagają aktualizacji oczekiwań (15->18, 17->20, 16->25, 16->27) — plik poza allowlistą, nie edytowany; 3 niepowodzenia seaDist pre-istniejące (inne ziarna/typy).
3. Loader params poza literalną allowlistą (patrz wyżej).
4. Podglądu w przeglądarce nie dotyczy (temat generacji, bez UI). Node_modules i katalogi tymczasowe poza repo usunięte.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1 (decyzje do 1-3).
DEPLOY/PUSH: NIE WYKONANO

COMMIT: df32bf05a86fcb3c0db4b1f954698e77722d3cfc (gałąź worktree-wf_b59c474e-a26-1, bez push)

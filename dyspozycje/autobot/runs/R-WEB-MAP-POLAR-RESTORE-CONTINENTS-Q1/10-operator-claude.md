# R-WEB-MAP-POLAR-RESTORE-CONTINENTS-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-MAP-POLAR-RESTORE-CONTINENTS-Q1 (decyzja właściciela A1, zgoda 2026-11-25)
GOAL: przywrócić pas polarny (TerenBazowy.Polarny) dla map „kontynenty” bez cofania semantyki suwaka lądu (land% = suchy ląd), bez zmiany asercji climate-band-test, bez zmiany „ziemi”.
BAZA: aa96cfc618de124e48b74408870115854293e6c5 (origin/main, FALA 890). SHA z kodem: patrz sekcja ZMIANY-COMMIT.

## ZMIANY-COMMIT
Allowlista (tylko te pliki):
- gra/src/map/gen-helpers.ts — ochrona pasu polarnego w erozji lądu (kolejność kandydatów), flaga `protectPolarBand` w `applyLandFractionByScore` / `enforceTargetDryLandFraction`, `rebalanceLandFractionWithMargins` i `applyLandFractionByContinent` (ta ostatnia zawsze, bo używana tylko dla kontynentów/wysp).
- gra/src/map/generator.ts — przekazanie `typ !== 'pangea'` do `enforceTargetDryLandFraction` oraz `purgeOpenOceanLandSpecks` po tym kroku (nie dla pangei).
- gra/tools/map-polar-continents-test.cjs (nowy) — dowód: seedy 1/7/42/4242 kontynenty > 0 i ≤ sufit; malenki > 0; ziemia = 0.
- dyspozycje/autobot/runs/R-WEB-MAP-POLAR-RESTORE-CONTINENTS-Q1/10-operator-claude.md (ten plik).
Nie zmieniono: climate-band-test.cjs (asercja bez zmian), żadnego istniejącego testu, żadnego hasha/pinu (RE-PIN: brak).
Zachowano: `isDryLandTerrain` i semantykę licznika lądu (trzy hunki z 40a29e4c6 NIE cofnięte).

Mechanizm (zmierzony, nie założony): po konwersji klimatu pas polarny dostaje Polarny z istniejącego lądu w wierszach 6–11 / 108–113. Erozja lądu (sortowanie „najpierw krawędź mapy”) zjadała ten ląd przed konwersją. Poprawka: kandydaci z grywalnego pasa polarnego (bez bufora oceanu N/S) idą na koniec kolejki erozji. Oraz: samotne heksy lądu powstałe po konwersji są usuwane przez istniejące `purgeOpenOceanLandSpecks` (tylko kontynenty/wyspy).

Odrzucone warianty (zmierzone): (a) całkowite wykluczenie pasa z erozji → 3–4 nowe wyspy-szumy (stranded-land-test czerwony); (b) wykluczenie tylko gęstego lądu (≥3 sąsiadów) → 1 speck na seedach 7/12345; (c) cofnięcie trzech hunków z 40a29e4c6 → przywraca polar, ale cofa semantykę suwaka (poza zakresem A1).

## TESTY (surowe wyniki z tego worktree, po ostatniej zmianie kodu)
- `tsc --noEmit`: exit 0.
- logic-test: exit 0; linii `PASS` = 213, `FAIL` = 0.
- tech-tree-test: exit 0; `tech-tree-test: 20 pass, 0 fail`.
- research-test: exit 0; `PASSED: 33 / FAILED: 0 / TOTAL: 33`.
- unit-replace-test: exit 0; 21 linii `[OK]`, brak FAIL.
- combat-test: exit 0; `COMBAT TEST: 6/6 pass`, `All sanity checks passed.`
- climate-band-test: exit 0; `climate-band-test: PASS` (asercja `polar > 0` bez zmian).
- map-polar-continents-test (nowy): exit 0; `PASS`. Pomiar (kontynenty, standardowy, 168×120, medium):
  - seed 1: polar=387; seed 7: polar=402; seed 42: polar=404; seed 4242: polar=371; sufit=1008 (połowa grywalnych heksów pasa polarnego, 2016 heksów).
  - malenki seed 42: polar=57; ziemia seed 42: polar=0 (bez zmian).
- Mutacja (ochrona pasa wyłączona, `polarBandLastForErosion` → zwrot bez zmian): `map-polar-continents-test: FAIL (5)` — polar=0 dla wszystkich pięciu przypadków kontynentów. (Wcześniejsza wersja poprawki też dała czerwień przy mutacji.)
- determinism-same-seed-test: exit 0; `WYNIK: PASS`.
- stranded-land-test: exit 1, `16 pass, 2 fail`. Dwie porażki to `Standard Ziemia` seed 7 i 42 (specks=5) — IDENTYCZNIE jak na bazie aa96cfc (tam 15 pass / 3 fail: dodatkowo `Mały wyspy` seed 42 specks=1, które teraz przechodzi). Brak nowych porażek względem bazy.
- map-coast-buffer-test: NIE ZAMKNIĘTE w czasie (limit 500–580 s). Na bazie i na wcześniejszej wersji poprawki zestaw linii FAIL był identyczny (23 linie, głównie „ląd w buforze brzegu” dla kontynenty/pangea/wyspy i „morze w środku lądu” dla ziemi — błędy obecne na bazie). Wersja końcowa: NIE ZMIERZONO.
- Pangea: NIE ZMIERZONO na wersji końcowej. Ścieżka pangei nie zmieniona z konstrukcji (flagi `protectPolarBand`/`typ !== 'pangea'` = false). Na bazie pangea seed 42 = 146 Polarny, seed 1 = 182 (zmierzone, bez zmian po pierwszej wersji poprawki).
- land-sea-ratio-test: NIE ZMIERZONO (przekroczenie 580 s bez wyniku).
- relief-grid-coverage-test, pangea-land-determinism/fraction/shape, followups-land-ai, relief-preserving-mine-prefix, sawmill-hill-relief, map-gen-regression, map-continents-rivers, map-quality-forest-parity, mapgen-rivers-fill-centroid-cache, ai-avoid-polar-*: NIE ZMIERZONO (nie zdążono w limicie czasu sesji operatora).
- Land% (suwak) na wersji końcowej: NIE ZMIERZONO bezpośrednio. Na wersji wcześniejszej `dryLand` (suchy ląd kontynentów) = 6048 = cel, jak na bazie.
- Re-pin hashów: brak (nic nie zmieniono w pinach).

## POMIAR BAZY (aa96cfc, przed poprawką)
kontynenty standardowy seed 1/7/42/4242: polar = 0/0/0/0; malenki 42: 0; ziemia 42: 0; pangea 42: 146; pangea 1: 182.

## BLOKADY
- Nie zamknięto pełnego zestawu testów map/generatora (lista NIE ZMIERZONO wyżej). Kryterium „testy suwaka lądu zielone” NIE jest w pełni dowiedzione.
- map-coast-buffer-test i stranded-land-test mają porażki obecne już na bazie (border/speck na ziemi); nie naprawiano ich (poza zakresem).
- Poprawka zmienia kształt map kontynentów i wysp (inne pozycje lądu w pasie polarnym i wokół); wpływ na rozgrywkę NIE ZMIERZONO.

## UWAGI-DLA-ORKIESTRATORA
- Worktree wf_cf09d21a-ede-1: Bash `timeout` ≥ 590 s powoduje automatyczne przejście w tło; nie uruchamiano nic w tle celowo.
- Plik `gra/tools/.climate-band-*` nie powstał w commicie (generowany tylko w tmp przez test nowy; climate-band-test zapisuje swoje wpisy do `tools/`, ale są gitignorowane).
- Przy wyspach (`wyspy`) poprawka również działa (erozja + purge); nie pomierzono ich wpływu na liczbę Polarny.

NASTĘPNY KROK: Evaluator (Sonnet) — przejrzeć diff (gen-helpers.ts, generator.ts), zweryfikować pełny zestaw testów map (lista NIE ZMIERZONO) przed Final Control.
DEPLOY/PUSH: NIE WYKONANO
RUNDY: 1/5

STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K01-Q1
GOAL: Port kawałka K01 (Fundament, 139 jednostek, 1 360 LOC pinu `edb8fb56`) do `src-tauri/frontend-v2/src/ui/cityPanel/` wg P5-8 §4/§4a/§5/§9.
ZMIANY/COMMIT: brak zmian kodu portu. Zacommitowany wyłącznie inwentarz wejściowy w `dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K01-Q1/` (SHA: w logu commitu, patrz NASTĘPNY KROK). Baza: `origin/rust-port/parity-v2` (2c2f58f8), detached.
TESTY: `npm run check` na bazie: self-test 33/15 OK, trafień 0 (146 plików), verify-pin-copies 435 plików, niezgodnych 0. Harness K01, mutacje K01 i `npm run typecheck` NIE_ZMIERZONO (kodu K01 nie ma).
BLOKADY:
1. Zakres jednej rundy: K01 wymaga przepisania 139 jednostek, nie kopii. Blok pinu zawiera 52 symbole importowane z `game/*`, `data/*`, `map/*`, `render/*` (lista: `r1-logi/inwentarz-importow.txt`). Wg P5.13 każda reguła musi zniknąć z UI, a nie zostać przeniesiona.
2. Trzy jednostki-reguły K01 (P5-8 §5): `daninaLabelForCity`, `clampedGrowthBreakdown`, `resGlobalLocal`. Wymagają pól DTO, których kształt nie został jeszcze odczytany z `src/viewmodel/types.ts` (1 652 linie) ani z `controller/mock.ts`.
3. Brak harnessu DOM dla K01. Wzorzec: `tools/dom-harness/run-cityux.mjs` (P5.7 r3), wymaga aliasu pinu w `build.mjs`.
4. Symbole w K01 bez mapowania na DTO: `signedPl`, `attachInteractiveDetail`, `brandIconSvg`, `buildingIconSvg`, `unitIconSvg`, `mapResourceIconSvg`, `scienceOwlIconHtml`, `resourceTextClass`, `UI_PARAMS`, `unitInfographicSvg`, `unitInfographicMedallionHtml`. Część z nich żyje już w `frontend-v2/src/ui/`, ale ich zgodność nie była sprawdzana.
5. Wniosek: nie było możliwe bezpieczne wykonanie portu K01 w jednej rundzie bez kodu, który nie kompiluje się albo łamie regułę P5.13.

ZAŁOŻENIA (rozstrzygnięte bez pytań, ABC nie zadawano):
- Z1: K01 = dokładnie jednostki z `pomiar-r2.json` `unit_block == 1` (139, suma 1 360 LOC), zachowana kolejność linii pinu. Potwierdzone: `chunk_edges["1"]` puste, K01 nie zależy od K02–K09.
- Z2: Nagłówek/importy (linie 1–284) nie są portowane (P5.8-Z4).
- Z3: Trzy reguły z §5 są przepisywane na pola DTO. Pola nie są zmierzone (NIE_ZMIERZONO).

PLAN r2 (Operator-impl): (a) odczyt `viewmodel/types.ts` dla `CityPanelDto`, `EmpireHudDto`, `CityGrowthDto` i mapowanie 52 symboli; (b) kopia 139 jednostek do `src/ui/cityPanel/k01-fundament.ts` z importami tylko z `viewmodel/`, `controller/`, `ui/` (nie z `game/*`); (c) harness `tools/dom-harness/run-k01.mjs` (pin przez alias); (d) mutacje pól DTO; (e) wpis w `PORTING-QUEUE.md`; (f) raport `P5-8-K01.md`.

NASTĘPNY KROK: Operator r2 wg planu powyżej. Brak zmian w `gra/**`, rust-port i `WERSJE.md`.
RUNDY: 1/5 (ostatni werdykt: brak; decyzja wymagana: NIE)
DEPLOY/PUSH: NIE WYKONANO

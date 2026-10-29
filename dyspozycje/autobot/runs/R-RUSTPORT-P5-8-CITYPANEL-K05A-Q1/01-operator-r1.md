STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K05A-Q1
GOAL: Port części bez DOM z K05 (45 jednostek, 1 500 LOC, pin `edb8fb56`) do `src-tauri/frontend-v2/src/ui/cityPanel/k05a-*.ts`, z harnessem vs pin i mutacjami. Cel tematu NIE osiągnięty w rundzie 1: przeniesiono 5/45 jednostek (38/1 500 LOC), zakres niedomknięty.
ZMIANY/COMMIT: commit `a4bb9f72` (kod, harness, selekcja); dopisek `PORTING-QUEUE.md` i raport w tym samym kolejnym commicie. Allowlista: `src/ui/cityPanel/k05a-fundament.ts` (nowy), `tools/dom-harness/{select-k05a,run-k05a-units,mutate-k05a-units}.mjs` (nowe), `tools/dom-harness/k01a-select-lib.mjs` (+parametr `block`, domyślnie bez zmiany zachowania), `dyspozycje/rust-port/p5/P5-8-K05A.md` (nowy), `dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K05A-Q1/**`. Brak zmian w `gra/**`, `package.json`, `viewmodel/`, `controller/`, `WERSJE.md`.
TESTY:
- `node tools/dom-harness/select-k05a.mjs --pin-dir <PIN>`: blok 5 = 45 jednostek / 1 500 LOC; wybrane 5 / 38 LOC; odroczone 40 / 1 462 LOC (DOM 19, T 18, R 2, P 1).
- `node tools/dom-harness/run-k05a-units.mjs --pin-dir <PIN>`: porównań 197, różnic 0, EXIT 0.
- `node tools/dom-harness/mutate-k05a-units.mjs --pin-dir <PIN>`: 13/13 zabitych, EXIT 0.
- `npm ci` (51 pakietów, lock bez zmian), `npm run check` EXIT 0 (self-test 33/15, 174 pliki, 0 trafień; verify-pin-copies 435 plików, 0 niezgodności), `npm run typecheck` EXIT 0.
- Pin: `git archive edb8fb56 gra/src gra/data` rozpakowany w katalogu scratchpad poza repo (przez `git --work-tree` + `checkout`, indeks przywrócony `git reset`).
BLOKADY: brak technicznych. Zakres: 40 jednostek odroczonych. T (18) wymaga dopisków DTO (`BuildOptionDto`, `RecruitOptionDto`, pola `missing`/`affordable`/`eta`) w `viewmodel/types.ts` i wartości z logiki (ZAŁOŻENIE K05A-Z1); DOM (19) należy do K05B; R (2) `TerenBazowy` z `types/hex.ts`; P (1) `isCapital` z bloku 3.
RUNDY: 1/5 (po limicie: nie). Zużycie: 1.
NASTĘPNY KROK: runda 2 tego samego ID: (a) dopiski DTO K05A-Z1 w `viewmodel/types.ts` i porty jednostek T (`recruitManpowerCost`, `maxAffordableRecruitQuantity`, `productionCtxForCity`, `buildingRequirementChips`, `missingTechSteps`, `okolicaPreviewRadius` z lokalną kopią `OkolicaTryb`); (b) R/P po dopiskach; (c) DOM zostaje do K05B. Harness i mutacje rozszerzyć o nowe jednostki.
DEPLOY/PUSH: NIE WYKONANO

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K04B-Q1
GOAL: Batch 3 K04 (karty szczegółów `gra/src/ui/cityPanel.ts`, pin edb8fb56): 8 jednostek — `appendCityResourceStockStrip`, `appendRecruitMilitaryResourceStrip`, `addItem`, `appendBuildActionButtons`, `bindBuildQueueDragReorder`, `renderSurowce`, `cityPracaSplit`, `readPodzialPracy`. Wynik: K04 19 z 32.

ZMIANY-COMMIT:
- `6c2c994a` feat(p5-8-k04b): kod 8 jednostek w `src-tauri/frontend-v2/src/ui/cityPanel/k04b-{podzial,stock,queue,surowce}.ts`; dopiski DTO w `src/viewmodel/types.ts` (`CityPanelInputsDto.podzialPracaSplit`, `unitResourceUpkeepById`).
- `ab973357` test(p5-8-k04b): `tools/dom-harness/run-k04b-units.mjs`, `tools/dom-harness/mutate-k04b-units.mjs`, `dyspozycje/rust-port/p5/P5-8-K04B.md` (NOWY), wpis w `PORTING-QUEUE.md`.
- Baza: `origin/rust-port/parity-v2` = `9d7a55d5`. Pin: `git archive edb8fb56` do katalogu poza repo.
- Allowlista zachowana; zero zmian w `gra/**`, `WERSJE.md`, rust-port.

TESTY:
- `npm ci`: exit 0. `npm run typecheck`: exit 0.
- `npm run check`: exit 0 (self-test 33/15; no-logic-imports trafień 0; verify-pin-copies niezgodnych 0 z 435).
- `run-k04b-units.mjs --pin-dir <PIN>`: PRZYPADKI=97 OK=97 ROZNICA=0.
- `mutate-k04b-units.mjs --pin-dir <PIN>`: MUTACJI=36 WYKRYTYCH=36 PRZEZYTYCH=0.
- Regresja: `run-k04-units.mjs` 22 przyp. (OK 21, ROZNICA 0, ROZNICA_ZALOZONA 1 = K04-Z2); `run-k04-units-b2.mjs` 17/17.

BLOKADY: brak.

NIE_ZMIERZONO (uczciwie):
- K04B-Z1: wartości podziału Pracy z silnika (`podzialPracaSplit`, `pracaBudynkiPct`) vs `splitPraca` Rust.
- K04B-Z2: `ProductionItemDto.stockCost` i `unitResourceUpkeepById` vs `unitStockCost`/`unitResourceUpkeep` Rust; pinowy `if (!udef) continue` pominięty.
- K04B-Z5: `stockMissing` (DTO) vs `missingStockFor(pool, cost)` Rust — zgodność tylko w fixture.
- Efekty `enqueue_build` / `reorder_build` po stronie Rust: NIE TESTOWANE (kontroler i Rust poza zakresem tematu).

ZAŁOŻENIA: K04B-Z1..Z7 w `P5-8-K04B.md` (rozstrzygnięte w dokumencie, bez pytań ABC).

RUNDY: 1/5 (Operator-impl r1; bez pomiarów długich, pomiary krótkie w pierwszym planie).

NASTĘPNY KROK: Evaluator r1 (ten sam ID) → Final Control r1 → integracja orkiestratora. Batch 4 (13 jednostek) poza tym tematem.

DEPLOY/PUSH: NIE WYKONANO

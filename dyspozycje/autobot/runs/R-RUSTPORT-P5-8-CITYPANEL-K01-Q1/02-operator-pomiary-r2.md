STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K01-Q1
GOAL: Port K01 (Fundament, 139 jednostek, 1 360 LOC pinu `edb8fb56`) do `src-tauri/frontend-v2/src/ui/cityPanel/`. Ta runda (Operator-pomiary) nie ma kodu do zmierzenia: kawałek K01 nie został zaimplementowany.
ZMIANY/COMMIT: brak zmian w kodzie. Dodany wyłącznie raport `02-operator-pomiary-r2.md` i logi `r2-logi/`. Baza: `1014a156` (detached, bez push). Zero zmian w `gra/**`, `PORTING-QUEUE.md`, `tools/`, `WERSJE.md`.
TESTY:
- Niezależna weryfikacja pinu: `git archive edb8fb56 gra/src/ui/cityPanel.ts` (11 986 linii) identyczne bajtowo z kopią roboczą operatora.
- Ponowne liczenie: `pomiar-r2.json` `unit_block==1` = 139 jednostek, suma 1 360 LOC, pierwsza linia 285, ostatnia 7390 (`r2-logi/b1-units-recheck.json`). Zgodne z r1.
- `npm run check` (cwd `src-tauri/frontend-v2`): EXIT=0; self-test 33 OK / 15 neg, błędów 0; trafień 0 (146 plików); verify-pin-copies 435 plików, niezgodnych 0. Log: `r2-logi/npm-run-check.log`.
- `npm run typecheck` (`tsc --noEmit`): EXIT=0 (po `npm ci --ignore-scripts`). Log: `r2-logi/npm-run-typecheck.log`. Dane z r1 to NIE_ZMIERZONO; teraz zmierzone.
- `cargo fmt --check` (cwd `src-tauri`): EXIT=0. Log: `r2-logi/cargo-fmt-check.log`.
- `cargo clippy` / `cargo test`: NIE_ZMIERZONO. Powód: commit nie zmienia kodu Rust, a K01 jest w TypeScript.
- Harness K01 i mutacje DTO: NIE_ZMIERZONO. Powód: brak kodu K01 (`src/ui/cityPanel/` nie istnieje).
BLOKADY:
1. Brak implementacji. Blok 139 jednostek wymaga przepisania 52 symboli z `game/*`, `data/*`, `map/*`, `render/*` (`r1-logi/inwentarz-importow.txt`). Ta runda nie ma Operatora-impl.
2. Luka DTO, zmierzona w tej rundzie: `viewmodel/types.ts:259` `CityGrowthDto` ma pola `pctPerTurn`, `fed`, `breakdown`, `wzrostUlamkowy`, `turnsToNextCitizen`, `maxSafeRation`. `types.ts:356` `CityPanelDto.growth` istnieje. Brak zweryfikowanego mapowania pól na `clampedGrowthBreakdown` (pin:1434) i `GrowthPercentBreakdown`.
3. `types.ts` zawiera `export type RebelStateDto = NieZmierzonoDto;` (linia 268). Pole buntu jest placeholderem, więc reguły buntu nie mogą być przeniesione do DTO bez decyzji o kształcie.
4. Pin `daninaLabelForCity` (pin:1335) jest stubem: ignoruje argument `_city` i zwraca `daninaLabel()`. Port powinien odtworzyć to zachowanie, a nie zakładać pola miasta.
5. Brak harnessu DOM dla K01 (wzorzec: `tools/dom-harness/run-cityux.mjs`).
6. Symbole bez zweryfikowanego mapowania: `signedPl`, `attachInteractiveDetail`, `brandIconSvg`, `buildingIconSvg`, `unitIconSvg`, `mapResourceIconSvg`, `scienceOwlIconHtml`, `resourceTextClass`, `UI_PARAMS`, `unitInfographicSvg`, `unitInfographicMedallionHtml`.
ZAŁOŻENIA (bez pytań ABC):
- Z4: Podtrzymane Z1–Z3 z r1 (K01 = `unit_block==1`, nagłówek nieportowany, reguły §5 na pola DTO z NIE_ZMIERZONO).
- Z5: Stub `daninaLabelForCity` portowany 1:1 jako zachowanie pinu, bez nowego pola DTO.
RUNDY: 2/5 (ostatni werdykt: BLOCK, zakres; decyzja wymagana: NIE)
NASTĘPNY KROK: Operator-impl r3: odczyt `viewmodel/types.ts` i `controller/mock.ts` dla mapowania 52 symboli; kopia 139 jednostek do `src/ui/cityPanel/k01-fundament.ts` z importami tylko z `viewmodel/`, `controller/`, `ui/`; harness `tools/dom-harness/run-k01.mjs`; mutacje DTO; wpis w `PORTING-QUEUE.md`; `dyspozycje/rust-port/p5/P5-8-K01.md`.
DEPLOY/PUSH: NIE WYKONANO

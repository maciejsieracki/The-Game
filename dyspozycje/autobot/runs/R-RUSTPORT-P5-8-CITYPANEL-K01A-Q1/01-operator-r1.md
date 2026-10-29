STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K01A-Q1
GOAL: Port jednostek K01 (Fundament) pinu `gra/src/ui/cityPanel.ts` (edb8fb56) bez DOM do `src-tauri/frontend-v2/src/ui/cityPanel/k01a-*.ts`, bez importow logiki gry.
ZMIANY/COMMIT: commit kodu `6e94dd57` (baza `origin/rust-port/parity-v2` 2c2f58f8, detached). Zmienione: `src/ui/cityPanel/k01a-fundament.ts` (nowy, 74 jednostki / 521 LOC), `PORTING-QUEUE.md` (dopisek), `dyspozycje/rust-port/p5/P5-8-K01A.md` (nowy), `dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K01A-Q1/r1-logi/` (lista odroczonych, lista przeniesionych). Zero zmian w `gra/**`, `WERSJE.md`, `tools/`. Commit raportu: patrz NASTĘPNY KROK.
ZAKRES: 139 jednostek bloku K01 (pomiar-r2) -> 128 bez DOM (1 253 LOC) -> minus `cpInlineIcons` (zależy od DOM `CP_INLINE_EMOJI_BRAND`) = 127. Przeniesione 74 (521 LOC): zależności tylko od ui/ (przepisane na `../…`) albo od innych przeniesionych. Odroczone 54 (732 LOC) z powodu importów `game/`/`data/`/`map/`/`render/` lub odwołań do nich (fixpoint) — pełna lista z powodami: `r1-logi/odroczone.txt`.
TESTY:
- `npm run typecheck` (tsc --noEmit): EXIT=0 (po trimie EOF ponownie EXIT=0).
- `npm run check`: self-test 33/15 OK; bramka logiki: 147 plików, trafień 0; verify-pin-copies: 435 plików, niezgodnych 0. EXIT=0.
- `git diff --cached --check`: czysto.
- Harness DOM K01A: NIE_ZMIERZONO (nie zrobiony w r1; dispatch: impl pierwszy, pomiary w kolejnej rundzie).
- Mutacje pól DTO: NIE_ZMIERZONO (brak DTO w K01A — zero importów logiki).
- Równość wartości z pinem dla wejść zakresu: NIE_ZMIERZONO.
BLOKADY: brak technicznej blokady. Ograniczenie: 54 jednostki odroczone (wymagają pól DTO/zapytań kontrolera: `CityView`, `CityProductionDto`, `EmpireFoodDto`, `GrowthBreakdownDto`, funkcje `population-growth-v85`, `building-upgrades`, `unit-building-bonuses`, `economy-upkeep`).
ZAŁOŻENIA (rozstrzygnięte w dokumencie, nie BLOCK):
- K01A-Z1: zakres = regex DOM z analizy; możliwe fałszywe "bez DOM" do przeglądu w r2.
- K01A-Z2: odroczone zamiast kopiowania reguł (P5.13); DTO/zapytania w r2 albo K01B.
- K01A-Z3: nagłówek pinu (1–284) nieportowany; `export` dodany na 70 deklaracjach (4 były już eksportowane w pinie).
RUNDY: 1/5 (ostatni werdykt: brak; decyzja wymagana: NIE)
NASTĘPNY KROK: Operator-pomiary r2 (wg P5-8-K01A.md): harness `run-k01a.mjs` na wzorcu `run-cityux.mjs`, porównanie z pinem dla 74 jednostek, mutacje; następnie DTO dla 54 odroczonych (lub K01B). Bramka: Evaluator -> Final Control -> integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO

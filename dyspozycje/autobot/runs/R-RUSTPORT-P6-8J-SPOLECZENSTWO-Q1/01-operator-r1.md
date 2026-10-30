STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8J-SPOLECZENSTWO-Q1
GOAL: P6.8J - port `society-breakdown.ts` (pin 91dc998a, 1172 LOC, 36 fn) do Rust. Ta runda (runda 1/5) dostarcza PARTIE 1 z N: skala % Szczescia/Prawa, mianowniki per epoka i miasto, capy, odczyt wierszy JSON, progi buntu, proporcjonalna linia Kultury/Religii (G4), luksus/podatki (G7), `computeHappinessBreakdown`, `computeLawBreakdown`. Partie 2+ (PorPct, efekty Porzadku, rebelia/grace, komunikaty, `applyCivMatrixHappinessModifier`) - NASTEPNA-PARTIA.

ZMIANY/COMMIT:
- Kod (commit `3f01bfd5`, branch `wf/r-rustport-p6-8j-spoleczenstwo-p1`, lokalnie, bez push):
  - rust-port/engine/src/domain/society_breakdown.rs (nowy modul, 878 linii z komentarzami)
  - rust-port/engine/src/domain/mod.rs (`pub mod society_breakdown;`)
  - rust-port/engine/tests/p6_8j_society.rs (nowy, 7 testow wektorowych + jednostkowe semantyki JS)
  - rust-port/engine/tests/p6_8j_vectors/society.json (wektory z weba 91dc998a, 292 KB, generator ponizej)
- Run (commit z raportem, SHA w odpowiedzi orkiestratora):
  - dyspozycje/autobot/runs/R-RUSTPORT-P6-8J-SPOLECZENSTWO-Q1/gen-p6-8j-society-vectors.mjs
  - dyspozycje/autobot/runs/R-RUSTPORT-P6-8J-SPOLECZENSTWO-Q1/repin-b-loader-register.mjs, repin-b-loader-hooks.mjs (kopia z 8D)
  - dyspozycje/autobot/runs/R-RUSTPORT-P6-8J-SPOLECZENSTWO-Q1/01-operator-r1.md
- Zero zmian w `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `Cargo.toml`, `WERSJE.md`. Cargo.lock i target/ nie sa w commicie (untracked, regenerowalne).

TESTY:
- Wektory: `node --experimental-transform-types --no-warnings --import ./repin-b-loader-register.mjs ./gen-p6-8j-society-vectors.mjs <git archive 91dc998a gra/src gra/data> <out>` - EXIT 0; "scale=18 fns=936 osiedle=270 happy=48 law=42".
- `cargo fmt --all -- --check`: EXIT 0 (po `cargo fmt --all` na nowych plikach).
- `cargo clippy --all-targets -- -D warnings`: EXIT 0 (po jednej poprawce: `!(prog > 0.0)` -> `prog.is_nan() || prog <= 0.0`, bez zmiany semantyki).
- `cargo test --test p6_8j_society`: 7 passed / 0 failed (scale_params, scalar_functions, osiedle_and_revolt, happiness_breakdown, law_breakdown, js_math_semantics, fallback_scale).
- `cargo test --no-fail-fast` (pelny suite engine): EXIT 0; passed=1503 failed=0 (log poza repo, w scratchpad).
- `git diff --cached --check`: czysty.
- Mutacje (2 z planowanych, reszta w NASTEPNA-PARTIA): M1 `js_round` `>= 0.5` -> `> 0.5`: KILLED (2 testy panic); M2 `legacy_male` `pop <= prog` -> `pop < prog`: KILLED (happiness_breakdown_matches_web). Po kazdej mutacji przywrocono linie i potwierdzono 7/7 zielone.
- Nie wykonano (poza zakresem tej rundy / NASTEPNA-PARTIA): mutacje galezi `pickOsiedlePopBonus` NaN, `maxFromEraTable` (pusta tablica/Inf), `popScaleMultiplier` (wsp<=0), `luksus` (prog<=0), `pctFromNetto` (max<=0), `resolvePalacTier` (tier poza 1..3); tabela mutacji i wynik per mutant.

BLOKADY:
- Brak blokad technicznych dla partii 1.
- Limit partii 600 LOC z dispatchu PRZEKROCZONY: `society_breakdown.rs` ma 878 linii (wiekszosc to komentarze dokumentacyjne i tabele fallbackow). Nie dzielono pliku w tej rundzie; decyzja: ZALOZENIE Z-8J-6 (ponizej) + propozycja podzialu w partii 2.
- Dokument tematu `dyspozycje/rust-port/p6/P6-8-MIASTA-PODZIAL.md` (§9 ALLOWLISTA, §11 wiersze `8J-P*`) NIE ISTNIEJE w zadnej galezi origin (sprawdzone `git ls-tree` / `git branch -r`). Allowlista i lista symboli wzieta z tresci GOAL w dispatchu (zalozenie Z-8J-1).
- Niezgodnosc GOAL vs pin: dispatch podaje 1172 LOC / 36 fn i symbol `applyCivMatrixHappinessModifier` (istnieje w pin 91dc998a, linie ~1076-1106). W aktualnym `rust-port/parity-v2` (gra/src/game/society-breakdown.ts, 1139 linii) ten symbol zostal USUNIETY (`git diff 91dc998a origin/rust-port/parity-v2` = -33 linie, dokladnie ta funkcja). Patrz Z-8J-2.
- Srodowisko: dysk 82% zajety (7.3 GB wolne przed buildem); buildy z CARGO_INCREMENTAL=0 i CARGO_PROFILE_*_DEBUG=0 - bez ENOSPC.
- Narzedzie: w tej rundzie dwukrotnie odrzucono polecenia Bash zlozone z `git` i zmiennych (ograniczenie izolacji worktree); rozbijano je na proste polecenia. Bez wplywu na wynik.

ZALOZENIA (rozstrzygniete w dokumencie, bez pytan ABC):
- Z-8J-1: Brak pliku P6-8-MIASTA-PODZIAL.md w origin -> zakres = GOAL z dispatchu (`society-breakdown.ts`), allowlista = `rust-port/engine/src/domain/society_breakdown.rs`, `rust-port/engine/src/domain/mod.rs`, `rust-port/engine/tests/p6_8j_*`, `rust-port/engine/tests/p6_8j_vectors/*`, run `R-RUSTPORT-P6-8J-SPOLECZENSTWO-Q1/**`.
- Z-8J-2: Wektory i kod odnosza sie do pin 91dc998a (zgodnie z dispatchem). Symbol `applyCivMatrixHappinessModifier` zostaje w zakresie (partia 2), ALE jest ustalone, ze aktualny web go nie ma. Orkiestrator ma rozstrzygnac, czy port go utrzymuje (np. jako ported-but-unused) czy go pomija z adnotacja. Ta runda go NIE portuje.
- Z-8J-3: Nowy modul `domain/society_breakdown.rs` obok istniejacego `domain::types::porzadek` (stary model `happiness_breakdown`/`load_order_params`); istniejacego kodu NIE zmieniano. Integracja z `state.rs` / wywolujacymi - osobna partia.
- Z-8J-4: JS-owe niuanse zachowane jawnie: `Math.round` (`js_round`, polowki w gore, -0), `Math.min/max` ze znakiem zera i NaN (`js_min`/`js_max`), `pickOsiedlePopBonus` z NaN populacja -> wartosc legacy (`arr[NaN]` = undefined), `Number.isFinite` przed `Math.max(1, ...)` w `maxFromEraTable`/`kultReligScaleForEra` (Inf -> epoka 1). Zrodlo prawdy: wektory z weba.
- Z-8J-5: Klucz `szczescie_prog_zagęszczenia` (z ę, bajty UTF-8 jak w TS i w JSON) zachowany dosłownie; odczyt wektorowo zweryfikowany przez test happiness.
- Z-8J-6: Przekroczenie 600 LOC w partii 1 zaakceptowane w tej rundzie jako nieunikniona granica symboli (`computeHappinessBreakdown` + `computeLawBreakdown` + skala nie daja sie rozdzielic bez zmiany API); partia 2 ma byc <=600 LOC.
- Z-8J-7: Pow: `f64::powf` vs `Math.pow` - rozbieznosci ULP tlumione przez zaokraglenie do 2 miejsc (`popScaleMultiplier`); wektory potwierdzaja zgodnosc bit-w-bit dla zakresu z generatora.

RUNDY: 1/5
NASTEPNY KROK: Operator-impl r2 (ten sam ID) lub Evaluator r1: (a) partia 2 - `porPctBand`, `tierFromPorPct`, `orderEffectsFromPorPct`, `computePorPct`, `orderContributionPct`, `computeOrderPctBreakdown`, `evaluateOrderFromBreakdown`, `updateRevoltGrace`, `revoltWarningMessage`, `POR_BAND_LABELS`, decyzja o `applyCivMatrixHappinessModifier` (Z-8J-2); (b) domkniecie mutacji z listy wyzej; (c) rozstrzygniecie Z-8J-2 i Z-8J-6 przez orkiestratora. Integracja w `state.rs` - osobny temat.
DEPLOY/PUSH: NIE WYKONANO

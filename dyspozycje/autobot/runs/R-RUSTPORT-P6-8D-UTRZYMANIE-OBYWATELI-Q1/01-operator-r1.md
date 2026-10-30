STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8D-UTRZYMANIE-OBYWATELI-Q1
GOAL: P6.8D (podział `dyspozycje/rust-port/p6/P6-8-MIASTA-PODZIAL.md` §9/§11, partie 8D-P1 i 8D-P2) - port `citizen-resource-upkeep.ts`, `gold-deficit.ts`, `mennica-zloto-grace.ts`, `wealth.ts` (w tym `wealthParamsWithCapModifier`, `wealthParamsWithMultiplierModifier`) do Rust. Pin webu 91dc998a. Ten run wykonuje TYLKO pierwszą partię: `citizen-resource-upkeep.ts` (8D-P1, część). Reszta zakresu NIE jest wykonana (patrz BLOKADY).
ZMIANY/COMMIT:
- Baza: `origin/rust-port/parity-v2` = `4c005237` (detach w worktree).
- Commit kodu: `a1924555` (feat(rust-port): P6.8D-P1 citizen-resource-upkeep).
- Allowlista (wykonana część): `rust-port/engine/src/domain/resource_production.rs` (rozszerzone o 8D-P1; plik był na allowliście 8D); `rust-port/engine/tests/p6_8d_citizen_upkeep.rs` (NOWY); `rust-port/engine/tests/p6_8d_vectors/citizen_upkeep.json` (NOWY, 1,2 MB, generator z weba); run `dyspozycje/autobot/runs/R-RUSTPORT-P6-8D-UTRZYMANIE-OBYWATELI-Q1/**` (generator `gen-p6-8d-vectors.mjs`, loader `repin-b-loader-{register,hooks}.mjs`, skrypt mutacji `mut-citizen-upkeep.sh`, ten raport).
- Zero zmian w `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `Cargo.toml`, `WERSJE.md`. Push: NIE. `Cargo.lock` wygenerowany przez cargo, celowo NIE commitowany (untracked).
- Funkcje portu (`src/domain/resource_production.rs`): `CITIZEN_UPKEEP_RATE_PER_CITIZEN` (1.0), `citizen_required_resources_for_era`, `resolve_citizen_resource_coverage`, `compute_citizen_resource_drain`, `citizen_upkeep_display_lines`, typy `CitizenUpkeepCoverage`, `CitizenResourceDrainResult`, `CitizenUpkeepDisplayLine`. Kary czytane z `CitizenResourceUpkeep.kara` (data-driven, ta sama wartość co web: +2/-2/-1).
- Symbole §11 `citizen-resource-upkeep.ts` (`8D-P1`): CitizenUpkeepEraRow, CitizenUpkeepKaraShape/TableShape (typy wewnętrzne webu, w Rust odpowiada `CitizenResourceUpkeep*` z data/economy_society.rs), stałe kar, RATE, citizenRequiredResourcesForEra, resolveCitizenResourceCoverage, computeCitizenResourceDrain, citizenUpkeepDisplayLines = PORTOWANE. Typy/interfejsy webu (CitizenUpkeepCoverage, CitizenResourceDrainResult, CitizenUpkeepDisplayLine) = PORTOWANE jako struktury Rust.
- Symbole `gold-deficit.ts`, `mennica-zloto-grace.ts`, `wealth.ts` = NASTĘPNA-PARTIA (nie wykonane w tym runie).
- Założenie (rozstrzygnięte zamiast pytania): Rust przyjmuje magazyn jako `BTreeMap<String, f64>` i `None` dla `null`; wartości nie-liczbowe z webu (`typeof !== 'number'`) są równoważne brakowi klucza (oba dają 0) - wektory generowane wyłącznie z liczbowymi wartościami i brakującymi kluczami.
- Założenie: znany rozjazd panel-vs-silnik (`citizenUpkeepDisplayLines` floor per miasto vs `computeCitizenResourceDrain` floor na sumie) zachowany ŚWIADOMIE, zgodnie z JSDoc webu (decyzja produktowa, nie techniczna).
- Założenie: `citizenRequiredResourcesForEra` przy zduplikowanych numerach epok wybiera ostatni maksymalny (Rust `max_by_key`); web wybiera pierwszy po stabilnym sortowaniu. Dane mają unikalne epoki, więc równoważne dla obecnych danych.

TESTY:
- Wektory: `cargo test --test p6_8d_citizen_upkeep` = 10/10 OK (era 14, coverage 140, drain 1820, display 520 przypadków; stałe z `constants`). Generator: `node --experimental-transform-types --no-warnings --import ./...repin-b-loader-register.mjs ./...gen-p6-8d-vectors.mjs <web-root> <out>` (Node v22.22.0, bez builda gra/). Wynik: `eras=14 coverage=140 drain=1820 display=520`, exit 0.
- Testy właściwości (poza wektorami): fallback epok, floor i nieujemność drenażu, kara binarna, populacja niefinite/niedodatnia = zero zapotrzebowania, `-0` dla brakującego przy qty=0, pula jednego właściciela dla wielu miast.
- Pełna suite: `cargo test --no-fail-fast` = 1398 passed, 0 failed (EXIT 0).
- `cargo fmt --all -- --check` = EXIT 0 (po rustfmt na 2 zmienionych plikach).
- `cargo clippy --all-targets -- -D warnings` = EXIT 0.
- `git diff --check` = czysty.
- Mutacje (skrypt `mut-citizen-upkeep.sh`): KILLED: `drained>=need`->`>`; gate `>0`->`>=0`; `-qty`->`qty` (znak brakujących); `drained>0`->`>=0`. SURVIVED (dowód równoważności, nie luka testów):
  - `floor`->`round` przy `need`: pop jest już `floor`-owana, a stawka = 1.0, więc iloczyn jest liczbą całkowitą i floor == round. Równoważny mutant.
  - usunięcie `max(1.0)` w `era`: `era` jest `floor`-owana; dla era < 1 `wanted` ∈ {≤0}, nie ma dopasowania ani epoki ≤ wanted, więc wynik = pierwsza epoka = epoka 1 = to samo co dla 1. Równoważne przy tabeli zaczynającej się od epoki 1 (dane `citizen-resource-upkeep.json`).
  - usunięcie guardu `population > 0` w drenażu: dla pop ≤ 0 `need` ≤ 0, `drained = min(need, have) = need` (have ≥ 0), więc `drained >= need` zawsze prawda (available), a `drained > 0` fałsz (brak odjęcia) - identyczny wynik jak guard zerujący. Dla niefinite guard `is_finite` zeruje wejście w obu wariantach. Równoważne.
- Zgodność z webem: 10 testów, 0 rozbieżności przy 1820+140+520+14 przypadkach.
- NIE_ZMIERZONO: baseline `cargo test --no-fail-fast` PRZED zmianą nie był mierzony osobno (zmiana dodaje tylko nowe pliki testowe i nowe funkcje). Wynik po zmianie: 1398 passed, 0 failed.

BLOKADY:
- Niewykonane w tym runie: `gold-deficit.ts` (250 LOC, 13 fn, 8D-P1), `mennica-zloto-grace.ts` (108 LOC, 7 fn, 8D-P2), `wealth.ts` (271 LOC, 10 fn, 8D-P2; w tym 2 nowe funkcje behawioralne `wealthParamsWithCapModifier`, `wealthParamsWithMultiplierModifier` z modyfikatorem `mul_proc`), `applyGoldDeficitHpLoss` (8D-P2). Wektory dla tych plików nie istnieją.
- Brak integracji ze state.rs (fragmenty wealth `:1661`, `:1759`) - poza tym runem.
- Cargo.lock untracked (generowany lokalnie); nie commitowany.

RUNDY: 1/5
NASTĘPNY KROK: Runda 2 (ten sam ID, Operator-impl): dokończyć 8D-P1 (gold-deficit.ts: rdzeń `buildGoldDeficitParams`, `advanceGoldDeficit`, stan/countdown, `applyGoldDeficitStatMultToCombatUnit`) z generatorem wektorów `gen-p6-8d-gold-deficit-vectors.mjs` wg wzorca tego runu, potem 8D-P2 (`mennica-zloto-grace.ts`, `wealth.ts` z `wealthParamsWith*`, `applyGoldDeficitHpLoss`). Commit po każdej partii. Potem Evaluator, Final Control.
DEPLOY/PUSH: NIE WYKONANO

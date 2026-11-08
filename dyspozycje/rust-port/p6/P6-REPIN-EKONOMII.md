# P6-REPIN-EKONOMII — jedna wersja reguł ekonomii (R-RUSTPORT-REPIN-EKONOMII-JEDNA-WERSJA-Q1)

Status: runda 1/5, Operator (Haiku 5.5). Część (A) POMIAR — wykonana. Części (B), (C), (D) — NIE rozpoczęte w tej rundzie.
Baza: `origin/rust-port/parity-v2` = `707b50c41bc916c31a75da402dc1d1a1c54ec9a3`.
Pin weba: `origin/main` (`git show origin/main:gra/src/...`), HEAD origin/main w chwili pomiaru: `9733ea8b0`.

## 1. Funkcje dublowane (stare vs nowe) — tabela symboli

Są TRZY rodziny reguł skalowania produkcji surowców w Rust, nie dwie. Dispatch wymieniał dwie
(`*_all_producers` vs stare); trzecia (`domain/resource_production.rs`, typy u32/u8) jest żywa tylko pośrednio.

| # | Plik | Symbol | Typ wejścia (era) | Zbiór skalowany | Wołający w `src/` | Wołający w `tests/` |
|---|------|--------|-------------------|-----------------|-------------------|---------------------|
| R1 | `domain/improvements.rs:955` | `resource_production_amount_for_era` | `f64`, `Option<f64>` | `produkcja_epoka.ulepszenia_skalowane` = `[tartak, kamieniolom]` (MIGAWKA starego weba) | `improvements.rs:1025` (przez `territory_resource_yield_for_improvement`) | `p6_23_improvements.rs:317`, `p6_repin_autoimpr_terrain.rs:226` (jako "legacy") |
| R2 | `domain/improvements.rs:1012` | `territory_resource_yield_for_improvement` | `f64`, `Option<f64>` | j.w. (przez R1) | **`turn_economy_territory.rs:226` (PRODUKCJA)** | `p6_23_improvements.rs:332,469`, `p6_adv_q2a_pipeline.rs:416` |
| A1 | `domain/improvements.rs:981` | `resource_production_amount_for_era_all_producers` | `f64`, `Option<f64>` | `terytorium.ulepszenia` (web `origin/main`: KAŻDY surowiec terytorium, hunki 93-97) | `improvements.rs:1048` | `p6_repin_autoimpr_terrain.rs:218` |
| A2 | `domain/improvements.rs:1035` | `territory_resource_yield_for_improvement_all_producers` | `f64`, `Option<f64>` | j.w. (przez A1) | **brak w `src/`** | `p6_repin_autoimpr_terrain.rs:205` |
| T1 | `domain/resource_production.rs:100` | `resource_production_amount_for_era` | `u32`, `u8` | własna lista (nie porównano w tej rundzie) | `resource_production.rs:137` | `tests/resource_production.rs:111-119` |
| T2 | `domain/resource_production.rs:147` | `territory_resource_yield_for_improvement` | `u8` | j.w. | brak w `src/` | `tests/resource_production.rs:95` |
| T3 | `domain/resource_production.rs:120,142,152,158` | `resolve_resource_production`, `resource_yield_for_improvement`, `resource_production_for`, `stack_resource_production` | `u8` | j.w. | `resource_production.rs:165` (wewn.); `order_effects_lane.rs:52` (import — do sprawdzenia w (B), który symbol) | `tests/parity_suite.rs`, `benches/engine_modules.rs` |

Żywe i NIE do usunięcia w tym temacie: `resource_production::citizen_consumption_era_multiplier`
(`:284`, używane przez `turn_economy_resources.rs:33`, `city_growth.rs:1205`; test `p6_repin_ekon_f_m_era.rs`),
`citizen_upkeep_rate_for_era`, `citizen_required_resources_for_era`, `compute_citizen_resource_drain`.

### Wniosek kluczowy (błąd parytetu, nie tylko dług)

`turn_economy_territory.rs:226` (produkcja tury) woła R2, czyli **stary zbiór** (tylko tartak/kamieniolom).
Web `origin/main` (`gra/src/game/terrain-improvements.ts:281-319`, `resourceProductionAmountForEra` +
`territoryResourceYieldForImprovement`) skaluje **cały** `TERRITORY_YIELD_IMPROVEMENTS` (glinianka, kopalnie,
warzelnia soli, stadnina, kopalnia zlota, ...) ×1,5/epokę (R-WEB-IMPROVEMENT-ERA-SCALING-Q1, 2026-11-03).
Czyli Rust produkcja terytorium dla epok 2-3 ma **zaniżone** wielkości dla wszystkich ulepszeń poza tartakiem
i kamieniołomem. Poprawną funkcją jest A2 (już istnieje, zgodna z webem: normalizacja epoki 1/2/3, `js_round`,
mnożnik `1.5` z `ulepszenia-reguly.json`), ale nikt jej nie woła poza testem.

Zgodność A1 z webem (sprawdzone ręcznie, bez uruchamiania): web `normalizeProductionEra` → 2|3 albo 1;
Rust: `era` całkowite, `> epoka_min` i `<= epoka_max` (=3) albo `epoka_min` (=1) — równoważne dla 1/2/3 i dla
wartości spoza zakresu (4,5 → 1 w obu). Mnożnik: web `Math.pow(1.5, e-1)` z `Math.round`; Rust `powf(1.5, e-1)` z `js_round`
— równoważne. ZAŁOŻENIE do weryfikacji wektorami z weba (część B).

## 2. Różnice względem weba (hunki) — stan pomiaru

- `resourceProductionAmountForEra` (web) vs R1: zbiór (`TERRITORY_YIELD_IMPROVEMENTS` vs `[tartak,kamieniolom]`) — RÓŻNICA ISTOTNA (patrz wyżej).
- `territoryResourceYieldForImprovement` (web) vs R2: web zwraca `null` dla spoza zbioru; R2 zwraca `None` dla klucza spoza `terytorium.ulepszenia` (ta sama semantyka, ale zbiór JSON różni się od zbioru legacy). NIE_ZMIERZONO hunk po hunku (wymaga porównania `terytorium.ulepszenia` z `TERRITORY_YIELD_IMPROVEMENTS`, ~9 kluczy: tartak, kamieniolom, glinianka, kopalnia_miedzi, kopalnia_zelaza, kopalnia_cyny, warzelnia_soli, stadnina, kopalnia_zlota).
- Web `territoryYieldAmountForKey` (fallback 10) vs Rust `territory_yield_amount_for_key` (fallback `terytorium.domyslna_ilosc`): NIE_ZMIERZONO wartości fallbacku w JSON (web komentarz: 10; Rust: sprawdzić `domyslna_ilosc`).
- Rodzina T (`resource_production.rs`, u32): NIE_ZMIERZONO względem weba (web nie ma funkcji o tej sygnaturze; to stara warstwa Rust, do ustalenia w (D)).

## 3. Wektory do regeneracji z uruchomionego weba (część B)

Kandydaci (pliki zależne od R1/R2 wg `git grep`): `tests/p6_23_vectors/`, `tests/p6_adv_q2a_vectors/`, wektory potoków
`p6_adv_*` i `p6_empirefood_e2e` (wg komentarza w `improvements.rs:977-980`, zwłaszcza potok `turn_economy_territory`).
Procedura (do wykonania w (B)): `git archive origin/main gra/src gra/data | tar -x -C <katalog POZA repo>`, Node 22,
generator wektorów uruchomiony na webie. NIE_ZMIERZONO w tej rundzie — brak uruchomienia Node i brak testu bazowego cargo.

## 4. Konflikty z allowlistą (wymagają decyzji orkiestratora lub założenia)

Allowlista dispatchu NIE obejmuje:
- `rust-port/engine/src/domain/improvements.rs` (R1, R2, A1, A2 — tu są duplikaty do usunięcia w (D)),
- `rust-port/engine/src/domain/resource_production.rs` (rodzina T),
- `rust-port/engine/src/domain/order_effects_lane.rs`, `city_growth.rs` (importy/wołający rodziny T / citizen).

Dlatego w (D) usunięcie R1/R2 (lub A1/A2 po przepięciu) wymaga rozszerzenia allowlisty o `improvements.rs`
albo pozostawienia funkcji jako `pub` z adnotacją. ZAŁOŻENIE (Operator): przepięcie wołającego (`turn_economy_territory.rs`,
w allowliście) na A2 jest w zakresie; usuwanie definicji w `improvements.rs` — dopiero po zgodzie na rozszerzenie allowlisty.

## 5. Część (C) — epoka w `economy_yield.rs` (stan pomiaru)

`economy_yield.rs` NIE zawiera żadnego pojęcia epoki (grep `epoka|era|mnoznik` bez trafień poza komentarzami).
Web: mnożnik zużycia obywateli `m(e) = 1 + 0,5·(floor(e)−1)` jest już zaportowany jako
`resource_production::citizen_consumption_era_multiplier` (`p6_repin_ekon_f_m_era.rs`, pin web `16c0509f6`).
Cegielnia/odlewnie/magazyn wg LEDGER EKONOMIA-F: do zweryfikowania w (C) (web `converters.ts`: Cegielnia 50/t +50% bazy/epokę
właściciela; Odlewnie 50/t). Pliki Rust `converters*.rs` mieszczą się w allowliście (wzorzec `converters*.rs`).

## 6. Baseline bramek

NIE_ZMIERZONO. Nie uruchomiono `cargo fmt/clippy/test` na starcie (dysk: 4,4 GB wolnego przy starcie, próg 1,5 GB —
nie przekroczony, ale bez baseline'u testów). Liczba `#[ignore]` w bazie: NIE_ZMIERZONO.

## 7. Plan kolejnych partii (proponowany, ≤600 LOC każda)

1. (B1) Przepiąć `turn_economy_territory.rs:226` z R2 na A2 (1 linia + import). Skutek: zmiana produkcji epok 2-3 dla
   ulepszeń spoza tartaku/kamieniołomu — ZMIANA ZACHOWANIA, więc wymaga regeneracji wektorów z weba (krok B2) w tej samej partii albo osobnej z flagą.
2. (B2) Regeneracja wektorów z weba (sekcja 3), aktualizacja testów `p6_23_*`, `p6_adv_q2a_*`, `p6_repin_autoimpr_terrain.rs` (nowe testy `p6_repin_ekonomii_*`).
3. (C) Sprawdzenie epoki w `converters*.rs` / `economy_yield.rs` względem LEDGER EKONOMIA-F; ewentualna poprawka 1:1.
4. (D) Usunięcie martwych duplikatów — po rozszerzeniu allowlisty o `improvements.rs` i `resource_production.rs` (decyzja orkiestratora). 0 nowych `#[ignore]`.

Zmiany zachowania (B1) traktować jako odstępstwo od „1:1 z webem" tylko jeśli web jest inny — tu web jest źródłem prawdy (A2 = web), więc B1 jest korektą do weba, a nie odstępstwem.

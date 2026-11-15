# 03 — Final Control r1: R-RUSTPORT-P4-1D-Q1-STACK-REPIN

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1D-Q1-STACK-REPIN
GOAL: reprezentant stosu (`pickStackLeader`, cywil nie reprezentuje stosu z jednostką bojową) i `StackVitals.has_commander` zgodne z pinem `07d2fbd72`, wektory @07, stare wektory `edb8fb56` bez zmian dla przypadków niezmienionych.
ZMIANY/COMMIT: kod Operatora 04b773b37, raport Operatora b6645c63d, Evaluator e3b5219b1; ten raport = commit FC na gałęzi `fc/R-RUSTPORT-P4-1D-Q1-STACK-REPIN-r1` (lokalnie, bez push).
TESTY: wyniki niżej.
BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: integracja orkiestratora na `rust-port/parity-v2` (merge bez konfliktów, sprawdzony niżej).
DEPLOY/PUSH: NIE WYKONANO.

## Baza i ancestry

- Baza Operatora: `origin/rust-port/parity-v2` = `c3e3617b2` przy starcie. `git merge-base --is-ancestor c3e3617b2 b6645c63d` = OK.
- Łańcuch: c3e3617b2 → 04b773b37 (kod) → b6645c63d (raport Op) → e3b5219b1 (Evaluator, wyłącznie `02-evaluator.md`) → commit FC.
- Parity przesunęło się na `2f9a12786`. Zmiany c3e3617b2..2f9a12786 dotyczą wyłącznie P4-1B (road_mask, river_trim, `domain/mod.rs`, mapgen) i ich runów. Część wspólna z tym tematem jest pusta. `git merge-tree --write-tree origin/rust-port/parity-v2 e3b5219b1` = `66dc2007e`, bez konfliktów.
- Na drzewie po scaleniu nie ma innych literałów `StosJednostka {` ani `StackVitals {` w `rust-port/` (`git grep`). Zostaje tylko konstruktor `StosJednostka::new` i budowa w `stack_vitals`.

## Bramki odtworzone przez FC na scaleniu parity 2f9a12786 + e3b5219b1

Commit tymczasowy, lokalny, bez push. CARGO_TARGET_DIR był poza repo i został usunięty.

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test` (pełny: lib + wszystkie testy integracyjne) | EXIT 0; 480 zestawów, 3496 passed, 0 failed, 1 ignored |
| w tym `--lib` | 119 passed (118 u Operatora + 1 test z P4-1B na parity) |
| w tym `--test p6_5a_display` | 13 passed, 0 ignored |

Jedyny `ignored` to `e2e::dump_tick1_econ_for_web_generator`. Test istniał wcześniej i nie ma go w diffie tematu. Pełny `cargo test`, który Evaluator oznaczył jako NIE_ZMIERZONO, jest teraz ZMIERZONY.

## Zgodność z pinem (sprawdzone przez FC)

- `stack-leader.ts:28-41` @07: pula = jednostki bojowe, gdy jest choć jedna; w przeciwnym razie cały stos. W `reduce`: przy `a !== b` wygrywa `a > b`, przy remisie mniejsze id. Implementacja w Rust robi to samo: filtr `!has_combat || is_combat(u)`, a dalsza pętla jest niezmieniona.
- `isCivilianUnit` (`units/setup.ts:203-206` @07): kategoria z `CIVILIAN_CATEGORIES` albo typeId z `CIVILIAN_TYPE_IDS`. W Rust `manpower::is_civilian_unit(category, type_id)` robi to samo (tabela `cywilne`). Test `civilian_table_matches_pin_is_civilian_unit` sprawdza to na sondach z pinu.
- `armyMerge.ts:1153` @07: `hasCommander: stack.some(unit => unit.isGeneral === true)`. W Rust: `stack.iter().any(|u| is_true(u.borrow().is_general))`, gdzie `is_true` = `== Some(true)`.
- Allowlista: diff c3e3617b2..e3b5219b1 obejmuje wyłącznie `recruitment.rs` (wszystkie zmiany w `pub mod army_merge`, linie 304–1402), `tests/p6_5a_display.rs`, `tests/p6_5a_vectors/{common.rs,gen.mjs,vectors.json}` oraz `dyspozycje/autobot/runs/R-RUSTPORT-P4-1D-Q1-STACK-REPIN/**`. Brak `Cargo.lock`. `git diff --check` czysty. Brak `#[ignore]`.

## Zarzuty Evaluatora: orzeczenia

1. **(minor) Brak sumy kontrolnej found+missing+skip==total w `unit_at_representative_matches_web`: ODDAL.** `check_at` przy każdym niepominiętym indeksie albo zwiększa `found`/`missing`, albo panikuje (`other => panic!`). Suma byłaby więc tautologią względem pętli. Przypadek pominięty (1) jest w pełni sprawdzany wynikiem @07 w `unit_at_representative_matches_web_07_repin_and_new_cases`, który wywołuje `check_at(repin, &[])` bez pominięć. Brak asercji nie osłabia testu.
2. **(minor) `repinChanged` pochodzi z generatora i Rust go nie przelicza: ODDAL.** Lista tylko wyłącza indeksy ze starego testu (oczekiwania `edb8fb56`). Wszystkie 118/148/110/110 starych wejść są sprawdzane z `skip=[]` względem wyniku @07 w testach `*_07_repin_*`. Test `vectors_07_meta_and_pin_guards` wymusza, żeby `repin` miał wejścia identyczne ze starymi przypadkami. Błędny `repinChanged` nie może więc ukryć rozbieżności z pinem; mógłby najwyżej zmniejszyć pokrycie wobec starego pinu, który przestał obowiązywać. FC niezależnie przeliczył (Python, `display.json` vs `vectors.json.repin`) zbiór indeksów ze zmienionym `out`: pick 34, display 19, unitAt 1, vitals 0. Zbiór jest identyczny z `repinChanged`. Proponowaną asercję w Rust warto dodać przy okazji, ale nie blokuje tematu.
3. **(info) Testy dopisane do `p6_5a_display.rs` zamiast nowego pliku: ODDAL.** Allowlista nie dopuszcza nowego pliku testów. Bramka „nowy test wektorów” jest spełniona przez 6 nowych testów na `vectors.json`.
4. **(info) Przesunięcie bazy c3e3617b2 → 2f9a12786; bramki na nowej bazie NIE_ZMIERZONO: ODDAL.** FC zmierzył: merge-tree bez konfliktów, a fmt, clippy i pełny `cargo test` na scaleniu dały EXIT 0 (tabela wyżej).
5. **(info) `StosJednostka::new` ustawia `category=""`, więc cywil jest rozpoznawany tylko po `type_id` do czasu P4-1D-Q4: ODDAL.** Takie zachowanie wynika z `isCivilianUnit` w webie (fallback po typeId). Funkcje wyświetlania stosu nie mają jeszcze produkcyjnego wołającego. Zależność od P4-1D-Q4 UNIT-VIEW (`P4-1D-UNIT-ROZPOZNANIE.md` §3) jest jawnie zapisana w raporcie Operatora. Uwaga dla Q4: producent `StosJednostka` z `PlayableUnit` musi przepisywać `category` i `is_general`.

Obrona (r1) zakończyła się blokadą INFRA bez commitu i bez zmian w kodzie. Nie ma więc nic nowego do weryfikacji. Jej akceptacje zarzutów 1–2 nie są wiążące, bo oba zarzuty zostały ODDALONE na dowodzie wyżej.

## Werdykt

Brak NAPRAW. Wszystkie zarzuty ODDALONE. Uwagi nieblokujące: (a) opcjonalna asercja `repin.out == display.out` poza `repinChanged` w Rust; (b) P4-1D-Q4 musi wypełniać `category` i `is_general` w producencie stosu.

**PASS-WITH-NOTES.**

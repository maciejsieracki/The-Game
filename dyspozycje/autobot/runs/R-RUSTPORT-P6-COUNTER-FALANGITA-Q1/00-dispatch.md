# DISPATCH R-RUSTPORT-P6-COUNTER-FALANGITA-Q1 (runda 1)

TEMAT: COUNTER-FALANGITA: mnożnik kontratak falangita → włócznik w Rust zgodny z pinem (odstępstwo od webu, bez pytania)
DOMENA: GAME (poprawka danych zgodna z pinem). BAZA: `d30e3ea24` (czubek `origin/rust-port/parity-v2`). Worktree na `wip/R-RUSTPORT-P6-COUNTER-FALANGITA-Q1`. Przed startem: `git checkout --detach d30e3ea24`.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/game/combat.ts` (lookup counters: ok. :553-580, wiersz `Falangite|Spearman|+30%` w counters.json pina). Pin: `git show 07d2fbd72:gra/data/counters.json` (lub odpowiednik wskazany w combat.ts).
Źródło rozpoznania: `dyspozycje/rust-port/p6/R-RUSTPORT-P6-COMBAT-WEJSCIA-ROZPOZNANIE-R2-Q1-ROZPOZNANIE.md` (R1, para falangita→włócznik: pin 1.30, Rust 1.00; 63 pozostałe pary zgodne).

## GOAL
Ustawić mnożnik falangita→włócznik w `rust-port/engine/data/derived/counter-multipliers.json` na wartość z pina (1.30 = +30%) i potwierdzić, że cała macierz 64 par jest zgodna z pinem. Poprawić komentarz `rust-port/engine/src/domain/combat.rs:185-187` (twierdzi, że macierz odzwierciedla każdy kontratak — po poprawce będzie prawdziwy). Parytet z webem: NIE zmieniać nic poza tą parą i komentarzem.

## ALLOWLISTA
- `rust-port/engine/data/derived/counter-multipliers.json` (zmiana jednej wartości)
- `rust-port/engine/src/domain/combat.rs` (WYŁĄCZNIE komentarz w liniach ok. 185-187; zero zmian kodu)
- `rust-port/engine/tests/p6_counter_falangita*.rs` (NOWE)
- `rust-port/engine/tests/p6_counter_falangita_gen.mjs` (NOWY, generator wykonujący lookup z pina na wszystkich 64 parach)
- `rust-port/engine/tests/p6_counter_falangita_vectors/**` (NOWE, wygenerowane generatorem)
- `dyspozycje/autobot/runs/<ID>/**`
ZAKAZ: `gra/**`, `Cargo.toml`, `Cargo.lock`, push do rust-port/parity-v2, zmiany innych par, osłabianie asercji, `#[ignore]`.

## KRYTERIA KOŃCA
1) Test porównuje Rust z wektorami z pina (generator wykonuje tekst pina; SHA fragmentu pina w teście) dla WSZYSTKICH 64 par; po poprawce 0 rozbieżności.
2) Test negatywny: przed poprawką test daje FAIL dla pary falangita→włócznik (pokaż to w raporcie).
3) `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --lib`, nowe testy — zielone z kodami wyjścia.
4) Pełny `cargo test --no-fail-fast` przed FC: 0 failed.

## RAPORT
`01-operator-r1.md`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY (kody wyjścia)/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
Operator: Haiku. Commit BEZ linii `Co-Authored-By` z nazwą modelu (CLAUDE.md), z `Claude-Session`. RUNDY: 1/5.

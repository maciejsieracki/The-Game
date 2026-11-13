# DISPATCH R-RUSTPORT-P6-COMBAT-RESOLVE-PETLA-Q1 (runda 1) — zadanie #136

TEMAT: port fazy zwarcia (melee) `resolveCombat` z pinu do `rust-port/engine/src/domain/combat.rs`, sprawdzany wektorami z `R-RUSTPORT-P6-COMBAT-MELEE-VEKTORY-Q1`.
DOMENA: GAME. BAZA: `fc74b6d1a` (FC melee, łańcuch z `cfa1edd31` potwierdzony). Worktree na `wip/R-RUSTPORT-P6-COMBAT-RESOLVE-PETLA-Q1`. NIE zaczynaj od `cfa1edd31`.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/game/combat.ts` — `export function resolveCombat` (linia ~842), cała faza zwarcia.
Wektory: `rust-port/engine/tests/p6_combat_melee_vectors/vectors.json` (500 przypadków, 1880 kroków), test `rust-port/engine/tests/p6_combat_melee.rs`.
Decyzja właściciela: DYSTANS jak na pinie (zwarcie po ostrzale). Wejścia przed fazą (#135) zostają wstrzykiwane tak jak w wektorach (__modsAtk/__modsDef) — poza zakresem tego tematu.

## KROK 0 (obowiązkowy)
Potwierdź bazę = `fc74b6d1a`. Odtwórz `p6_combat_melee` i wypisz liczbę przypadków, które PRZECHODZĄ przed zmianą (oczekiwane: test strukturalny przechodzi, porównania z portem jeszcze nie ma).

## GOAL
(a) Funkcja zwarcia w `combat.rs` zwracająca te same wyniki co `expected` we wszystkich 500 przypadkach / 1880 krokach (porównanie po dekodowaniu; NaN, ±Inf, -0 rozpoznawane jak w kodowaniu wektorów).
(b) Test `p6_combat_melee` rozszerzony o porównanie z portem (bez osłabiania asercji strukturalnych).
(c) Mutacja: zmiana jednego warunku w porcie daje FAIL (sprawdzone, potem przywrócone).

## ALLOWLISTA
- `rust-port/engine/src/domain/combat.rs` (tylko funkcja zwarcia i komentarz ~1058 o niewportowanej fazie)
- `rust-port/engine/tests/p6_combat_melee.rs` (dodanie porównania; nie zmieniać istniejących asercji)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-COMBAT-RESOLVE-PETLA-Q1/01-operator-r1.md`
ZAKAZ: `gra/`, `Cargo.toml`, `Cargo.lock` (nie commitować), zmiana wektorów.

## KRYTERIA KOŃCA
1. Wszystkie 500 przypadków zgodne z `expected`; liczniki w raporcie.
2. Mutacja daje FAIL.
3. Bramki EXIT 0: `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; `p6_combat_melee`; pełny `cargo test --no-fail-fast` z liczbami (puść w tle, czytaj wynik z pliku). `CARGO_TARGET_DIR` poza repo, usuń po bramkach.
4. Brak `#[ignore]`, brak osłabionych asercji.

## NIE ROBIĆ
Zmiany innych funkcji, wejść (#135), integracji, push do parity, dotykania `gra/`.

## UZASADNIENIE MODELU
Operator = SONNET: port funkcji zwarcia (duża, wieloetapowa) z porównaniem na 1880 krokach — zadanie trudne. Obrona HAIKU.

## RAPORT
`01-operator-r1.md`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
Commit BEZ linii `Co-Authored-By` z nazwą modelu. `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`. RUNDY: 1/5.

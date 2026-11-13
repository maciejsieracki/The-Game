# DISPATCH R-RUSTPORT-P6-COMBAT-MELEE-VEKTORY-Q1 (runda 1) — zadanie #134

TEMAT: wektory z pinu dla fazy zwarcia (melee) `resolveCombat`. Tylko wektory i strażnik; port w #136.
DOMENA: GAME. Baza: `cfa1edd31` (czubek `origin/rust-port/parity-v2`). Worktree na `wip/R-RUSTPORT-P6-COMBAT-MELEE-VEKTORY-Q1`.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/game/combat.ts` — `export function resolveCombat` (linia ~842), cała faza zwarcia. Decyzja właściciela: DYSTANS jak na pinie (zamknięte).
Port nieobecny: `rust-port/engine/src/domain/combat.rs` (komentarz ~1058: „Faza zwarcia nie jest portowana”).

## KROK 0 (obowiązkowy)
Potwierdź baza = `cfa1edd31`. Potwierdź, że `combat.ts` w pinie zawiera fazę zwarcia (wypisz linie). Jeśli nie — BLOCK z dowodem.

## GOAL
(a) Generator `.mjs` wykonujący tekst pinu w node (wzorem `tests/p6_combat_harness_gen.mjs`), produkujący `vectors.json` fazy zwarcia; (b) strażnik SHA-256 wyciętego tekstu pinu; (c) liczniki niepustości > 0 (liczba przypadków, liczba kroków zwarcia).

## ALLOWLISTA
- `rust-port/engine/tests/p6_combat_melee_gen.mjs` (NOWY)
- `rust-port/engine/tests/p6_combat_melee_vectors/vectors.json` (NOWY)
- `rust-port/engine/tests/p6_combat_melee.rs` (NOWY; TYLKO test strukturalny: wczytuje wektory, sprawdza SHA i liczniki; BEZ porównania z portem)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-COMBAT-MELEE-VEKTORY-Q1/01-operator-r1.md`
ZAKAZ: `src/**`, `gra/`, `Cargo.toml`, `Cargo.lock` (nie commitować), `combat.rs`.

## KRYTERIA KOŃCA
1. Generator odtwarza `vectors.json` bajt-w-bajt (esbuild w scratchpadzie, nie w repo).
2. Liczniki niepustości > 0 (przypadki, kroki zwarcia).
3. Test strukturalny zielony, BEZ `#[ignore]`, bez porównania z portem.
4. Bramki EXIT 0: `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; nowy test; pełny `cargo test --no-fail-fast` z liczbami. `CARGO_TARGET_DIR` poza repo, usuń po bramkach.

## NIE ROBIĆ
Port fazy zwarcia do Rust (#136). Porównanie z portem. Integracja, push do parity.

## RAPORT
`01-operator-r1.md`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
Commit BEZ linii `Co-Authored-By` z nazwą modelu (CLAUDE.md). `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`. RUNDY: 1/5.

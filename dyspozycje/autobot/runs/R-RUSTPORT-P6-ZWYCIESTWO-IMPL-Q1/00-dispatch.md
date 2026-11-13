# DISPATCH R-RUSTPORT-P6-ZWYCIESTWO-IMPL-Q1 (runda 1)

TEMAT: ZWYCIESTWO-IMPL (P6.19-A): warunki zwycięstwa i porażki gracza 0 — port silnika 1:1 wg pina
DOMENA: GAME (implementacja). BAZA: `5e8b116e8` (czubek `origin/rust-port/parity-v2`). Worktree na `wip/R-RUSTPORT-P6-ZWYCIESTWO-IMPL-Q1`. Przed startem: `git checkout --detach 5e8b116e8`.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/<ścieżka>` — `victory.ts` (checkVictory ~:240-254, checkDefeat ~:136), `main.ts:43466-43483` (wywołanie tylko dla gracza 0), `main.ts:34022` i `:43472` (przegrana), `main.ts:43478` (odczyt rakieta).
Źródło rozpoznania: `dyspozycje/rust-port/p6/R-RUSTPORT-P6-ZWYCIESTWO-ROZPOZNANIE-Q1-ROZPOZNANIE.md` (wersja po obronie, sekcje E1–E17).

## GOAL
Dodać do silnika Rust moduł ewaluacji zwycięstwa/porażki (`checkVictory`, `checkDefeat`, helper `isEliminated`) i flagę końca gry w stanie gry — 1:1 wg pina, wyłącznie gracz 0 (AI nie wygrywa). Parytet decyzji (zatwierdzonych przez orkiestratora, bez pytania do właściciela):
- Nauka przy `NAUKA_WYMAGA_RAKIETY=true`: port 1:1 — zwycięstwo naukowe nieosiągalne, jak w pinie (rakieta nigdy nie ustawiana na true).
- `graczKiedysMialMiasto`: flaga w zapisie (nie heurystyka z miast); heurystyka `main.ts:46368-46370` zostaje tylko jako ścieżka zgodności dla starych zapisów.
- Hooki testowe pinu: NIE portować.
- UI ekranu zwycięstwa: POZA zakresem.
Wpięcie końca gry w pętlę tury (odrzucanie komend po końcu gry, E15: `main.ts:37997, 38043, 43827`) — jeśli mieści się w allowliście, wpiąć; inaczej zostawić jako NIE_ZMIERZONO w raporcie.

## ALLOWLISTA
- `rust-port/engine/src/domain/victory*.rs` (NOWY moduł; nazwa dowolna w tym wzorcu)
- `rust-port/engine/src/domain/mod.rs` (wyłącznie deklaracja modułu)
- `rust-port/engine/src/domain/player.rs` / `state.rs` — wyłącznie pole flagi końca gry i zapis flagi `graczKiedysMialMiasto`, bez zmiany istniejących zachowań
- `rust-port/engine/tests/p6_victory_*.rs` (NOWE) oraz `rust-port/engine/tests/p6_victory_gen.mjs` (NOWY, wykonuje tekst pina) i `rust-port/engine/tests/p6_victory_vectors/**` (NOWE)
- `dyspozycje/autobot/runs/<ID>/**`
ZAKAZ: `gra/**`, `Cargo.toml`, `Cargo.lock`, push do rust-port/parity-v2, osłabianie asercji, `#[ignore]`, UI, zmiany zachowania poza zakresem P6.19.

## KRYTERIA KOŃCA
1) Wektory z pina generowane generatorem `.mjs` (wykonanie pina), z SHA fragmentu pina w teście; przypadki: zwycięstwo dominacji (`potegi.length>0`, `victory.ts:240`), przycięcie `Math.max(0,...)` w `powerShare` (`:143`), `isEliminated` (`:136`), fallbacki `epokaKoncowa`/`naukaUkonczona` (`:252-253`), nauka nieosiągalna przy rakiecie false, przegrana po eliminacji.
2) `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --lib`, nowe testy — zielone z kodami wyjścia.
3) Pełny `cargo test --no-fail-fast` przed FC: 0 failed.
4) Każda zmiana oczekiwań istniejących testów opisana z uzasadnieniem.

## RAPORT
`01-operator-r1.md`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY (kody wyjścia)/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
Operator: Haiku. Commit BEZ linii `Co-Authored-By` z nazwą modelu (CLAUDE.md), z `Claude-Session`. RUNDY: 1/5.

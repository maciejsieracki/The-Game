# 01 — Operator r1 — R-RUSTPORT-P4-1D-UNIT-ROZP-Q1

STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1D-UNIT-ROZP-Q1
GOAL: rozpoznanie producentów `UnitViewDto` i `StackViewDto` (#213): jak web wylicza wyświetlanie stosu, jakie pola jednostki są potrzebne rendererowi, co Rust ma, czego brakuje; propozycja podziału na wdrożenia (bez wdrażania).
BAZA: `origin/rust-port/parity-v2` = `83f5fd6548c1d2e3d84795ea15fa9bb1ff044e01` (stan w chwili startu); gałąź robocza `wip/R-RUSTPORT-P4-1D-UNIT-ROZP-Q1` od tej bazy. Pin `07d2fbd72` (tylko odczyt przez `git show`).
ZMIANY/COMMIT: `dyspozycje/rust-port/p4/P4-1D-UNIT-ROZPOZNANIE.md` (NOWY), ten raport. Zero zmian kodu. SHA: w wiadomości commitu i w StructuredOutput (commit zawiera ten plik, więc SHA nie może być wpisany w niego samego).
TESTY: nie uruchamiano `cargo` — dispatch to rozpoznanie tylko do odczytu, bez zmian kodu. `git diff --check` na zmienionych plikach: czysto.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1.
DEPLOY/PUSH: NIE WYKONANO

## Kryteria końca (dispatch)

1. Tabela funkcja pinu → wejścia → wyjście → Rust | BRAK | ROZBIEŻNE — dokument §1 (23 wiersze).
2. Lista pól `UnitViewDto`/`StackViewDto` z wejściami z modelu i stanem w Rust — §2.1, §2.2.
3. Propozycja podziału: P4-1D-Q1 STACK-REPIN, Q2 UNIT-STATE, Q3 STACK-DEPS, Q4 UNIT-VIEW (nazwy, allowlisty, wektory) — §3.
4. NIE_ZMIERZONO — §4.

## Kluczowe ustalenia (skrót)

- Port `army_merge` (`recruitment.rs:304+`) jest z pinu `edb8fb56`; na `07d2fbd72` zmieniły się dwie rzeczy wyświetlania: `pickStackRepresentative` → `pickStackLeader` (cywile nie są reprezentantem obok bojowych; `stack-leader.ts:28-41`) — Rust ROZBIEŻNE (`recruitment.rs:691-713`); `StackVitals.hasCommander` (`armyMerge.ts:1153`) — Rust BRAK (`recruitment.rs:727-738`).
- `PlayableUnit` (`playable.rs:385-393`) nie ma `typeId`/`category`/`hp`/`inGarnizon`/`embarked`/`isGeneral`/`stackGroupId`/`pancerzBonusProc`; część jest w `PlayableReplaceUnit` (`playable.rs:399-423`), `isGeneral` tylko w zapisie (`types.rs:421`).
- `compute_stack_display` nie ma wołającego produkcyjnego; brak produkcyjnych `sumRosterFieldM`, `veteranLevel`, `combatPowerFullDisplayDefFor`, `unitAttackScore`.
- Stan `deferredPlayerUnitRevealIds` (→ `dimmed`), `movingStackIds`, `forceVisibleUnitId` oraz runtime głodu/deficytu Złota nie są w `PlayableState`.

## Rozbieżność z dispatchem

Dispatch kazał grepować `gra/src/render` i `main.ts` po `stackDisplay|computeStackDisplay|stack`; właściwa logika jest w `gra/src/game/armyMerge.ts` i `gra/src/game/stack-leader.ts` (render tylko konsumuje). Kontrakt `P4-1-RENDER-DTO-CONTRACT.md` nie istnieje na bazie parity — czytany z `origin/claude/rust-sivvrn` (tylko odczyt).

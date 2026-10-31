# P6.8I - auto-ulepszenia (port `gra/src/game/auto-improvements.ts` + `relief-preserving-improvements.ts`)

Temat: R-RUSTPORT-P6-8I-AUTO-ULEPSZENIA-Q1. Pin referencyjny wektorow: `91dc998a`.
Dokument statusu symboli (per partia). Stan na runde 1 (Operator).

## Uwaga o pinie (ROZBIEZNOSC do decyzji Evaluatora)

`gra/src/game/relief-preserving-improvements.ts` w galezi bazowej (HEAD, z merge 8H) NIE ma klucza
`tartak` w `PRESERVES_HILL_RELIEF_EXPLICIT_KEYS` (wersja z commita 85932371c). Pin `91dc998a`
(commit b3cc4c5d4 "fix: preserve sawmill hill relief") ma `tartak`. Pin NIE jest przodkiem HEAD.
Port i wektory w tej partii idą za PINEM (zgodnie z dispatchem). Wersja z HEAD rozni sie
dokladnie jednym kluczem (`tartak`). Do rozstrzygniecia przed zamknieciem tematu.

## Tabela symboli

| Symbol TS | Plik TS | Status | Rust | Dowod |
|---|---|---|---|---|
| `preservesHillReliefKey` | relief-preserving-improvements.ts | PORTED+TESTED | `domain/auto_improvements/relief_preserving.rs::preserves_hill_relief_key` | `tests/p6_8i_relief.rs` 8/8; mutacje 8/8 KILLED (`mutacje/relief-wynik.txt`) |
| `preservesHillRelief` | relief-preserving-improvements.ts | PORTED+TESTED | `domain/auto_improvements/relief_preserving.rs::preserves_hill_relief` | jw. |
| `PRESERVES_HILL_RELIEF_EXPLICIT_KEYS` (stała wewn.) | relief-preserving-improvements.ts | PORTED | tablica w `relief_preserving.rs` (pin: 5 kluczy) | jw. |
| `AI_IMPROVEMENT_PRIORITY` | auto-improvements.ts | NIE_PORTOWANE (NASTEPNA-PARTIA 8I-P1) | - | - |
| `ULEPSZENIA_FOCUS_ZYWNOSC` | auto-improvements.ts | NIE_PORTOWANE (8I-P1) | - | - |
| `ULEPSZENIA_ZYWNOSCIOWE` | auto-improvements.ts | NIE_PORTOWANE (8I-P1) | - | - |
| `ZERO_YIELD_IMPROVEMENTS` | auto-improvements.ts | NIE_PORTOWANE (8I-P1) | - | - |
| `JEDEN_NA_ILU_OBYWATELI` | auto-improvements.ts | NIE_PORTOWANE (8I-P1) | - | - |
| `WYRAB_MIN_FOREST_IN_RADIUS` | auto-improvements.ts | NIE_PORTOWANE (8I-P1) | - | - |
| `AUTO_ULEPSZENIA_PRACA_RESERVE` | auto-improvements.ts | NIE_PORTOWANE (8I-P1) | - | - |
| `hasNonFoodResourceDeficit` | auto-improvements.ts | NIE_PORTOWANE (8I-P1) | - | - |
| `freshSurplusReport` | auto-improvements.ts | NIE_PORTOWANE (8I-P1) | - | - |
| `prioritiesForUlepszeniaFocus` | auto-improvements.ts | NIE_PORTOWANE (8I-P1) | - | - |
| `pickAutoImprovements` | auto-improvements.ts (633 LOC, 8I-P2) | NIE_PORTOWANE (NASTEPNA-PARTIA 8I-P2) | - | - |

Zaleznosci web do odtworzenia w 8I-P2 (nieistniejace jeszcze w Rust lub do weryfikacji grep):
`buildImprovementQualifier` (map/improvement-build.ts), `hexKeysWithinRadius` (okolica - reuse
`okolica`/`hex_disk_offsets`), `cityTerritoryRadius` (map/territory.ts), `getImprovementMeta` /
`isImprovementTechUnlocked` (improvement-tech), `isImprovementAllowedForCiv` (terrain-improvements),
`hexHasDepositReserve` / `depositAllowsPlayerImprovement`. Istniejace w Rust: `improvements.rs`
(`improvement_allowed_civs`, `is_improvement_allowed_for_civ`, `qualifies`), `improvement_build.rs`,
`okolica.rs`. Brakujace: ZAŁOŻENIE do wstrzyknięcia parametrem (opisać w raporcie partii 8I-P2).

Liczby z dispatchu (8I-P1 17 sym./418 LOC, 8I-P2 1 sym./633 LOC, 8I-P3 5 sym./43 LOC) są
zapisem z `P6-8-MIASTA-PODZIAL.md` §11; tabela powyżej to rzeczywisty stan zmierzony w tej partii.

## Weryfikacja niezależna (runda 1, Verifier, worktree na 5a46096d1 + poprawki fmt)

- Wektory: ponowna generacja `gen-p6-8i-relief-vectors.mjs` z pinu `91dc998a` daje plik identyczny
  z commitowanym (`git status`/diff czysty). 34 klucze, 16 list warstw.
- `cargo fmt --check`: poprawka formatowania w 3 plikach (relief_preserving.rs, tests/p6_8i_relief.rs,
  domain/mod.rs: kolejność alfabetyczna `pub mod auto_improvements`). Log: `logs/gate-p6-8i-fmt.txt` EXIT=0.
- `cargo clippy --all-targets -- -D warnings`: EXIT=0 (`logs/gate-p6-8i-clippy.txt`).
- `cargo test --test p6_8i_relief`: 8 passed, EXIT=0 (`logs/gate-p6-8i-relief-test-verify.txt`).
- `cargo test` (pełny engine): 1948 passed, 0 failed, EXIT=0 (`logs/gate-p6-8i-cargo-test-full.txt`);
  baza 1940 + 8 nowych testów reliefu.
- Mutacje ponownie w tym worktree: 8/8 KILLED, RESTORED OK (`mutacje/relief-wynik-verify.txt`).
  Pokrycie gałęzi: `return true` (M6), `||` legacy (M1, M7), `starts_with` (M2), `!is_empty` (M4),
  `all` (M3, M8), wpis tartak (M5).
- Rozbieżność pinu potwierdzona: `HEAD:gra/src/game/relief-preserving-improvements.ts` nie zawiera
  `tartak`; `91dc998a` zawiera; `91dc998a` nie jest przodkiem HEAD. ZAŁOŻENIE: port idzie za pinem,
  decyzja o `tartak` należy do Evaluatora/właściciela przed zamknięciem tematu.
- Zakres: tylko relief (C5). `pickAutoImprovements` (8I-P2) i stałe 8I-P1 nadal NIE_PORTOWANE.
  Temat NIE jest zamknięty.
- `Cargo.lock` pozostaje untracked, celowo nie dodawany.

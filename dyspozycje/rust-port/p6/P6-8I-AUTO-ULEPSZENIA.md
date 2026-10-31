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

# DISPATCH R-RUSTPORT-P4-1H-COMMANDS-ROZP-Q1 — ROZPOZNANIE, TYLKO ODCZYT (P4-1H / #217)

DOMENA: GAME, komendy mapy (planowane marsze, podgląd ścieżki, ruch wieloheksowy). MODEL: OPUS. ZERO zmian kodu.
BAZA: `origin/rust-port/parity-v2` w chwili startu (zapisz SHA). Worktree detached. Pin: `07d2fbd72` (tylko odczyt).
Zależność: P4-1J `general_target_id` (#221) — zintegrowane lub w integracji; uwzględnij to w raporcie.
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## ZAKRES
Przygotowanie komend: `cancel_planned_march`, `preview_path`, `move_unit` wieloheksowy (#217). Dla każdej: funkcja pinu (plik:linia), warunki (mgła, zajętość, generał, zasięg), efekt na stan, odpowiednik w Rust (`pathfinding.rs`, `playable.rs`, `planned_march`) i luki. Wskaż wejścia z DTO.

## PIN / RUST (tylko odczyt)
Pin: `grep -rn "cancelPlannedMarch\|previewPath\|moveUnit\|planned-march" gra/src`. Rust: `git grep -n "cancel_planned_march\|preview_path\|move_unit" rust-port/`.

## KRYTERIA KOŃCA
1. Tabela: komenda → funkcja pinu (plik:linia) → warunki → efekt → odpowiednik Rust (plik:linia) | BRAK | ROZBIEŻNE.
2. Lista wejść z DTO i z modelu.
3. Propozycja podziału na wdrożenia z allowlistą i wektorami. NIE wdrażaj.
4. Niepewne: NIE_ZMIERZONO.

## ALLOWLISTA
- `dyspozycje/rust-port/p4/P4-1H-COMMANDS-ROZPOZNANIE.md` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1H-COMMANDS-ROZP-Q1/**`

Commit jawnym `git add`. NIE `git add -A`. Bez push do parity.

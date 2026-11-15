# 01 — Operator r1 — R-RUSTPORT-P4-1H-COMMANDS-ROZP-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1H-COMMANDS-ROZP-Q1 (#217, rozpoznanie, tylko odczyt)
GOAL: przygotować wdrożenie komend mapy `cancel_planned_march`, `preview_path`, `move_unit` wieloheksowy — funkcje pinu, warunki, efekty, odpowiedniki Rust, luki, wejścia DTO, podział na wdrożenia.
ZMIANY/COMMIT:
- baza: `origin/rust-port/parity-v2` = `2f9a12786` (gałąź robocza `op/P4-1H-COMMANDS-ROZP-Q1`, worktree `wf_44cd2d61-4e4-1`); pin `07d2fbd72` tylko odczyt.
- `dyspozycje/rust-port/p4/P4-1H-COMMANDS-ROZPOZNANIE.md` (NOWY) — commit `3a40894d8527a5e1705d1e3abdf0aea395b546a0`.
- ten raport — commit podany w odpowiedzi Operatora (następny commit na tej gałęzi).
- zero zmian kodu, `gra/` nietknięte, bez `Cargo.lock`, bez push.
TESTY: nie uruchamiano (temat tylko odczytu, bez `cargo`). Dowody = polecenia `git show`/`git grep`/`git diff --stat` w §6 dokumentu.
BLOKADY: brak dla rozpoznania. Dla wdrożeń: (1) port `ruch_jednostek` jest z pinu `edb8fb56` (dryf do `07d2fbd72`: przejście przez własne jednostki, blokada oblężenia, `trimPathToStackRoom`, funkcje powiadomień o przerwaniu marszu); (2) `PlayableState` nie ma modelu ruchu weba (ruch f64, stos, koszty terenu) ani adaptera do `ruch_jednostek`; (3) #221 `general_target_id` niezintegrowany na bazie (konflikt pliku `playable.rs`, nie semantyczny dla cancel).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1. Kluczowe do weryfikacji: (a) `beginMoveSelectedUnitTo` (`main.ts:32037`) bez wołającego na pinie — klik idzie przez `planMarchTo`, więc kontrakt P4-1 §5.1 i P2-5 U2 wskazują złą funkcję; (b) `path_route` w view-model gubi `turnStops`; (c) podział Q2–Q6 (§4).
DEPLOY/PUSH: NIE WYKONANO

## Kryteria końca (dispatch)
1. Tabela komenda → pin → warunki → efekt → Rust | BRAK | ROZBIEŻNE: §1.1–§1.3 dokumentu.
2. Wejścia z DTO i modelu: §2.
3. Podział na wdrożenia z allowlistą i wektorami: §4 (Q2 CANCEL, Q3 RJ-REPIN, Q4 MOVE-MODEL, Q5 PREVIEW, Q6 MOVE). Niewdrożone.
4. NIE_ZMIERZONO: §5 (7 pozycji).

## Uwaga o zależności P4-1J `general_target_id` (#221)
Na bazie `2f9a12786` `PlayablePlannedMarch` (`playable.rs:556-565`) nie ma pola; `clearPlannedMarch` go nie czyta, więc cancel nie zależy semantycznie. Q2 startować po integracji #221 albo z rebase.

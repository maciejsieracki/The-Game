# R-RUSTPORT-P4-371-T5C-PIN-PARITY — Obrona Operatora r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-371-T5C-PIN-PARITY
GOAL: wyrównać do pinu 07d2fbd72 rozbieżności U-OP-1..4 warstwy zaznaczenia/zasięgu klienta i renderera (D-371-5c)
ZMIANY/COMMIT: baza obrony 7dd4b28b4 (raport Evaluatora; kod e8834aa34 na 48035d3a7 = origin/rust-port/parity-v2);
      kod obrony 25ee81295 (rust-port/client/src/lib.rs, rust-port/client/tests/engine_bridge_renderer.rs);
      ten raport w osobnym commicie. Allowlista zachowana; renderer/, engine/, view-model/, src-tauri/, gra/,
      Cargo.toml, renderer/Cargo.lock nietknięte. git diff --check czysty.
TESTY: klient: fmt EXIT 0; clippy --locked --all-targets -D warnings EXIT 0; test --locked --all-targets EXIT 0
      (engine_bridge_renderer 18 passed / 0 failed, było 17). Mutanty: E1, E2, E13b, E13c — wszystkie zabite.
      Renderer: bramek NIE powtórzono (kod renderera bez zmian od e8834aa34, ostatni EXIT 0 u Evaluatora;
      wolne 3,9–4,7 GB < 12 GB, równolegle trwa cargo test engine tematu T6) — patrz §Środowisko.
BLOKADY: brak merytorycznych; środowisko: brak 12 GB wolnego dla bramki renderera
RUNDY: 1/5 (obrona po Evaluatorze r1)
NASTĘPNY KROK: Final Control (bramka renderera do odtworzenia przy >= 12 GB)
DEPLOY/PUSH: NIE WYKONANO
```

## Odpowiedzi na zarzuty

### Z-EV-1 (blokujący, mutanty E1/E2) — PRZYJMUJĘ

Zarzut trafny: `t5c_u_op_3_…` startuje z `open_panel()` + klucz, więc `found_city_mode` i `wonder_active` są
już `false` przed `exit_build_mode`.

Poprawka (commit `25ee81295`): nowy test e2e klient↔silnik
`t5c_exit_build_mode_from_found_city_and_wonder_zeroes_the_modes` (`client/tests/engine_bridge_renderer.rs`).
Dla dwóch wariantów: (a) `onSelectFoundCity` (`main.ts:26758-26762`), (b) `onSelectWonder` (`:26766-26793`):
panel otwarty → `select_unit(Some(WARRIOR))` → `set_build_mode` z włączonym trybem (zaznaczenie zostaje, U-OP-2)
→ `exit_build_mode()` (`exitBuildMode` `:16526-16541`). Po wyjściu sprawdza:
- `found_city_mode == false` (E1) i `wonder_active == false` (E2), `frame_ui == selected(WARRIOR)`;
- dokładnie jedno `GetRenderFrame` (zmiana `RenderUiParams`, D-371-4);
- pisarz `Cleared` (`refreshBuildHighlight` poza trybem budowy = `clearHighlight()`, `:16369-16372`);
- ramka aktywnego fotela: pusty `build_highlight.hexes`, `selection` bez zmian;
- brak krążków (`highlight_hexes == None`), pierścień zostaje, renderer odzwierciedla DTO.

Dowód (mutanty, skrypt `scratchpad/t5crender/ob/mut.py`, plik przywracany po każdym, `git status` czysty):

| ID | Mutant | Wynik | Zabójca |
|---|---|---|---|
| E1 | `exit_build_mode` nie zeruje `found_city_mode` | ZABITY (EXIT 101) | `t5c_exit_build_mode_from_found_city_and_wonder_zeroes_the_modes` |
| E2 | `exit_build_mode` nie zeruje `wonder_active` | ZABITY (EXIT 101) | jw. |

### U-EV-2 (uwaga) — PRZYJMUJĘ (decyzja D-T5C-7)

Pin: `onOpenBuild` przy otwartym panelu (`:26702-26706`) woła `clearPlayerUnitSelection()` (→ `clearHighlight()`),
a potem `exitBuildMode()` → `refreshBuildHighlight()` → poza trybem budowy `clearHighlight()` (`:16369-16372`).
Ostatni zapis warstwy to więc `clearHighlight()`, nie `refreshBuildHighlight` w trybie budowy.

Poprawka (commit `25ee81295`, `client/src/lib.rs` `set_build_mode`): zamknięcie panelu
(`build_mode_open: true → false`) ustawia pisarza `HighlightPriority::Cleared`, tak jak `exit_build_mode`;
otwarcie panelu i przełączniki found city/cud zostają `Build` (D-371-5b). Widoczny wynik bez zmian (bez zaznaczenia,
poza trybem budowy: brak krążków), ale stan pisarza jest teraz zgodny z ostatnim wywołaniem pinu.

Zmiana asercji T5b (`t5b_web_scenario_build_mode_reselect_end_to_end`, krok 5): `highlight_last_writer == Build`
→ `== Cleared`, uzasadnienie pinem w komentarzu (`:26702-26706`, `:16369-16372`); dopisana asercja
`highlight_hexes == None`. To wzmocnienie, nie osłabienie: oba kierunki mutanta są wykrywane.

| ID | Mutant | Wynik | Zabójcy |
|---|---|---|---|
| E13b | zamknięcie panelu → pisarz `Build` (stan sprzed poprawki) | ZABITY | `t5b_web_scenario_…` |
| E13c | każda zmiana trybu → pisarz `Cleared` | ZABITY | `t5b_web_scenario_…`, `t5c_mode_switch_keeps_selection_and_flag_key_change_keeps_it` |

### U-EV-3 (uwaga) — PRZYJMUJĘ (bez zmian w kodzie)

Długi DŁUG-T5C-CLEARED-PERSIST i DŁUG-T5C-REFRESH-SITES zostają. Pisarz `Cleared` celowo przetrwa `StateChanged`
(`StateChanged` nie jest wywołaniem `refreshBuildHighlight` w pinie). Powłoka T3 (TAURI-GLUE) ma wołać
`set_highlight_last_writer(Build)` tam, gdzie pin woła `refreshBuildHighlight()`. Wpis do kontraktu T3 i do
`REJESTR-RUST.md` należy do orkiestratora (rejestr poza allowlistą).

### Środowisko (uwaga Evaluatora) — PRZYJMUJĘ ODSTĘPSTWO JAKO FAKT, BEZ POWTÓRZENIA BRAMKI RENDERERA

- Wolne miejsce w czasie obrony: 4,7 → 3,9 GB (minimum) → 4,4 GB po usunięciu targetu. Równolegle trwa
  `cargo test --all-targets` engine tematu T6 (`wf_aa003b5d-05f-4`, target `scratchpad/adapter/t2`), którego nie
  ruszam.
- Obrona zmieniła wyłącznie `client/`. Renderer jest bez zmian od `e8834aa34`, a jego bramki dały EXIT 0
  u Evaluatora. Kompilacja klienta buduje też `civ-renderer` jako zależność (clippy `-D warnings` i testy klienta
  przeszły). Własnych bramek renderera NIE powtórzono, bo przy < 12 GB dispatch tego zabrania.
  Status: NIE_ZMIERZONO w tej rundzie. Do odtworzenia przez Final Control przy >= 12 GB.
- Pełnego testu engine nie uruchomiono, bo dispatch go nie wymaga, a `engine/` jest bez zmian.
- Target obrony (`scratchpad/t5crender/ob/target`) usunięty po bramkach i mutantach.

## Decyzje techniczne

- **D-T5C-7:** zamknięcie panelu przez `set_build_mode` (`onOpenBuild` przy otwartym panelu) ustawia pisarza
  `Cleared`, bo ostatnie wywołanie w pinie to `clearHighlight()` (`:26702-26706` → `exitBuildMode` →
  `:16369-16372`). Otwarcie panelu i przełączniki found city/cud ustawiają `Build` (D-371-5b).

## Długi

- DŁUG-T1-LOCK (bez zmian).
- DŁUG-T5C-CLEARED-PERSIST, DŁUG-T5C-REFRESH-SITES: przenieść do kontraktu T3 (orkiestrator).
- Bramka renderera tej rundy: NIE_ZMIERZONO (dysk < 12 GB); kod renderera bez zmian od EXIT 0 Evaluatora.
- Wpis D-T5C-1..7 do `REJESTR-RUST.md`: orkiestrator.

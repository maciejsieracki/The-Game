# R-RUSTPORT-P4-1I5B-BATTLE-ACTIONS-SIEGE — 02a Obrona Operatora (r1)

STATUS: PASS-WITH-NOTES (obrona; wszystkie 4 zarzuty PRZYJĘTE z poprawką/testem, nota przyjęta jako jawny wpis równoważności)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1I5B-BATTLE-ACTIONS-SIEGE
GOAL: odpowiedź na zarzuty Evaluatora r1 (`02-evaluator.md`, commit `06b03d752`)
BAZA: `06b03d752` (gałąź Evaluatora `rust-port-wip/i5b-eval-r1`, potomek kodu Operatora `0c57ebe7c`/`b59cbf5d3`, baza dispatchu `24c8f3b75`)
GAŁĄŹ OBRONY: `rust-port-wip/i5b-obrona-r1` (lokalna, bez push)
ZMIANY/COMMIT: `89e0c5503` (kod + testy), raport w commicie końcowym (SHA w §4)

Pin: `07d2fbd72:gra/src/battle/battleScene.ts` — `_breachWallTile` `:7697-7741` (pętla obrońców `:7698-7741`, filtr
`if (u.dead || u.fadingOut || u.routed) continue` `:7699`, `u.onWallWalkway && u.r === wallRow && u.q === wallCol` `:7700`),
`_startRout` `:9799-9802` (`ru.routed = true`; w całym pliku brak przypisania `routed = false`, `grep "routed = "` → jedno trafienie `:9802`).

## 1. Odpowiedzi na zarzuty

### Z-1 (mutant E12, `breach_fades.retain` w `wall_retreat`) — PRZYJMUJĘ
Zarzut zasadny: komentarz testu `breach_mark_is_limited_to_the_tile_and_its_t0` obiecywał `LeaveField`, którego test nie
zawierał. Poprawka:
- nowy test `leave_field_clears_the_breach_mark_within_the_same_t0` (`renderer/tests/battle_playback_siege.rs`):
  `WallBreach{67}` → `LeaveField(def4, (wc,67)→(wc,67))` → `Kill(def4)`, wszystko w `t0 = 10` ⇒ `HpBar{def4, 0}` i `removed`;
- komentarz starego testu przepisany zgodnie z tym, co faktycznie sprawdza (granica `t0` i pola), z odsyłaczem do nowego testu.
Dowód zabicia: §3, E12.

### Z-2 (mutanty E1 i E2, warunki `on_wall_walkway` i `col == wall_col`) — PRZYJMUJĘ
Dodane testy na wspólnym helperze `breach_then_kill` (`WallBreach{67}` + `Kill(def4)` w tym samym `t0`):
- `breach_mark_control_unit_on_crown_gets_no_hp_bar` — kontrola: niezmieniona scena ⇒ brak `HpBar` (znacznik działa);
- `breach_mark_needs_the_wall_walk` — `def4` na polu `(wall_col, 67)`, `on_wall_walkway = false` ⇒ `HpBar{def4, 0}` (E1);
- `breach_mark_needs_the_wall_column` — `def4` z `on_wall_walkway = true`, wiersz 67, kolumna `wall_col + 1` ⇒ `HpBar{def4, 0}` (E2).
Stan dla E2 (na koronie poza kolumną muru) ustawiany jest bezpośrednio w scenie; pin sprawdza `u.q === wallCol` jawnie (`:7700`),
więc test przypina warunek pinu niezależnie od tego, czy dzisiejsze akcje mogą taki stan wytworzyć.
Dowód zabicia: §3, E1 i E2.

### Z-3 (mutant V1, `action_finite(morale)` w `Shaken`) — PRZYJMUJĘ
`view-model/tests/battle_actions_siege.rs`, `walidacja_obrazen_i_hp`: pętla `Shaken` rozszerzona o `f64::INFINITY` i
`f64::NEG_INFINITY` (oba ⇒ błąd `a.action.morale`). `+Infinity` przechodzi `>= 0`, więc odrzuca go wyłącznie `action_finite`.
Dowód: mutant V1 (linia `action_finite(f("action.morale"), *morale)?;` zakomentowana) ⇒
`walidacja_obrazen_i_hp` panic `morale inf`, `test result: FAILED. 5 passed; 1 failed`; plik przywrócony (`git checkout`).

### Z-4 (filtr wyłomu bez `routed`, odstępstwo od `:7699`) — PRZYJMUJĘ (poprawka kodu, D-I5B-16)
Poprawka w `renderer/src/battle/playback.rs`:
- nowe pole `BattlePlayback::routed: HashSet<UnitId>` — `ru.routed` pinu; w pinie jest jednokierunkowe (`_startRout` `:9802`,
  brak resetu), więc zbiór tylko rośnie;
- źródła: akcja `Rout { id }` (`_startRout`) oraz klatka `BattleFrameUnitDto::routed == true` (`apply_frame`, a więc także
  `apply_snapshot`) — klatka pokrywa jednostki rozbite przed startem odtwarzania;
- filtr znacznika przy `WallBreach`: `removed` (= `dead`/`fadingOut` po `kill_unit`/`_removeUnitFromScene`) **lub** `routed`
  ⇒ `continue`, jak `:7699`; dalej `on_wall_walkway && col == wall_col && row == row` jak `:7700`.
Testy: `breach_mark_skips_a_unit_routed_by_action` (`Rout(def4)` w `t0 = 5`, potem `WallBreach` + `Kill(def4)` w `t0 = 10` ⇒
`HpBar{def4, 0}`) oraz `breach_mark_skips_a_unit_routed_in_a_frame` (to samo z `routed = true` z klatki `vNow = 5`).

**D-I5B-16** (decyzja techniczna): playback śledzi `routed` (akcja `Rout` + klatki) wyłącznie na potrzeby filtra
`_breachWallTile` `:7699`; nie zmienia sceny ani `SceneCall`. Brak zmian w DTO i w silniku.

### Nota (E8, E19, V2 równoważne; E20 ślad diagnostyczny) — PRZYJMUJĘ, jawny wpis
| ID | Mutant | Klasyfikacja | Uzasadnienie |
|---|---|---|---|
| E8 | usunięcie `rams.retain(...)` | RÓWNOWAŻNY | jak w ocenie Evaluatora: taran zakończony jest i tak pomijany przy krokowaniu; brak obserwowalnej różnicy sceny/wywołań |
| E19 | `moved` liczone tylko z kolumny, gdy `wall_col < BF_COLS-1` | RÓWNOWAŻNY | przy `wall_col < BF_COLS-1` silnik daje `to != from` wyłącznie przez zmianę kolumny (`retreatCol = wallCol+1`, pętla `dc >= 1` `:7718-7719`), więc porównanie samej kolumny = porównanie pola |
| V2 | indeks `toRow` w walidacji | RÓWNOWAŻNY | jak w ocenie Evaluatora (ten sam zakres `BF_ROWS` sprawdzany dla obu pól) |
| E20 | `SceneCall::WallBreach.rubble` na sztywno `7` | PRZEŻYWA, AKCEPTOWANY | pole jest wyłącznie śladem diagnostycznym; równość gruzu sprawdzana jest przez równość całej sceny P == Q i wektory webu w `boulder_and_breaches_equal_pin_calls_and_web_vectors` |

## 2. Zmienione pliki (allowlista)
- `rust-port/renderer/src/battle/playback.rs` — pole `routed`, `Rout`/`apply_frame` je wypełniają, filtr `WallBreach` (D-I5B-16);
- `rust-port/renderer/tests/battle_playback_siege.rs` — 6 nowych testów + poprawiony komentarz;
- `rust-port/view-model/tests/battle_actions_siege.rs` — `±Infinity` dla `Shaken.morale`;
- ten raport.
Silnik (`engine/`) i `view-model/src` bez zmian.

## 3. Bramki i mutanty

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie
(`i5b/obrona-vm`, `i5b/obrona-ren`, oba usunięte po bramkach), skrypty `i5b/obrona-ren.sh`, `i5b/obrona-mut.py`.

| Crate | Bramka | Wynik |
|---|---|---|
| view-model | `cargo fmt --check` | EXIT 0 |
| view-model | `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| view-model | `cargo test --all-targets` | EXIT 0 (wszystkie binarki `ok`, 0 failed) |
| renderer (bez `gpu`) | `cargo fmt --check` | EXIT 0 |
| renderer (bez `gpu`) | `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| renderer (bez `gpu`) | `cargo test --all-targets` | EXIT 0 — **742 passed, 0 failed, 0 ignored**, 83 binarki (Evaluator r1: 736; +6 nowych testów) |
| renderer | `--test battle_playback_siege` | 16 passed (10 starych + 6 nowych) |
| engine | — | NIE URUCHAMIANO: `engine/` i `view-model/src` bez zmian względem `06b03d752`, na którym Evaluator ma EXIT 0 (fmt, clippy, lista dispatchu, pełny `cargo test` 4127/0/1) |

`renderer/Cargo.lock` zmieniony lokalnie przez build (DŁUG-T1-LOCK) — cofnięty `git checkout` przed commitem.

**Dysk (uczciwie):** na starcie bramki renderera było **8,3–8,4 GB** wolnego (próg dispatchu: 12 GB); obcy proces
`cargo test --release --test p6_k5loop_wiring_a_pin` (cel `scratchpad/wiringa`, 4,2 GB) trwał, nie było innego buildu
renderera. Po ~10 min czekania bez zmiany uruchomiłem bramkę renderera bez `gpu` ze strażnikiem (przerwanie przy < 4 GB
wolnego); faktyczny rozmiar celu renderera: 566 MB, minimum wolnego w trakcie 7,9 GB, strażnik nie zadziałał. Odstępstwo od
progu 12 GB jest jawne; po sprzątaniu: 13 GB wolnego.

Mutanty obrony (`i5b/obrona-mut.py`, każdy → `cargo test --test battle_playback_siege` → przywrócenie pliku):

| ID | Mutant (`renderer/src/battle/playback.rs`) | Wynik | Zabijające testy |
|---|---|---|---|
| E12 | usunięty `self.breach_fades.retain(\|(f, _)\| *f != id)` w `wall_retreat` | ZABITY | `leave_field_clears_the_breach_mark_within_the_same_t0` |
| E1 | filtr wyłomu bez `!u.on_wall_walkway` | ZABITY | `breach_mark_needs_the_wall_walk` |
| E2 | filtr wyłomu bez `u.col != wall_col` | ZABITY | `breach_mark_needs_the_wall_column` |
| R1 | filtr wyłomu bez `!self.routed.contains(&id)` | ZABITY | `breach_mark_skips_a_unit_routed_by_action`, `..._in_a_frame` |
| R2 | `Rout` nie zapisuje `routed` | ZABITY | `breach_mark_skips_a_unit_routed_by_action` |
| R3 | `apply_frame` nie zapisuje `routed` | ZABITY | `breach_mark_skips_a_unit_routed_in_a_frame` |
| V1 | (`view-model/src/battle.rs`) `Shaken` bez `action_finite(morale)` | ZABITY | `walidacja_obrazen_i_hp` (panic `morale inf`) |

Bilans mutantów tematu po obronie: 43 z raportu Operatora + V1/E1/E2/E12 z Evaluatora (teraz zabite) + R1–R3 (nowe, zabite);
równoważne jawnie: E8, E19, V2; E20 przeżywa jako ślad diagnostyczny (§1, nota).

## 4. Commit
- `89e0c5503` — kod i testy (filtr `routed` D-I5B-16, testy Z-1/Z-2/Z-3/Z-4);
- commit raportu: patrz `git log` gałęzi `rust-port-wip/i5b-obrona-r1` (następnik `89e0c5503`).

Zakazy: brak `git add -A`, brak `#[ignore]`, brak `_ =>` w nowym kodzie, brak zmian poza allowlistą, brak push.

## Długi
- Brak nowych. Ślad `SceneCall::WallBreach.rubble` pozostaje diagnostyczny (E20) — bez zmian.

RUNDY: obrona r1/5
NASTĘPNY KROK: Final Control (`03-final-control.md`) na gałęzi `rust-port-wip/i5b-obrona-r1`.
DEPLOY/PUSH: NIE WYKONANO

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1I4-BATTLE-CONSUMER
GOAL: konsument BattleActionDto / BattleFrameDto w rendererze bitwy 3D (rust-port/renderer/src/battle/playback.rs): wywołania sceny w kolejności akcji, paski HP/morale/amunicji, bez zmian DTO ani producentów.
ZMIANY/COMMIT: oceniany stan = 7d02b0235 (raport obrony) / kod cb1f45508 (obrona r1). Łańcuch: 7d02b0235 → cb1f45508 → e33dd639d → 2fd81ed76 → 84bfcfe84 → baza 0deb9a075 (FC P4-1I3). `git merge-base --is-ancestor 0deb9a075 7d02b0235` = TAK. Diff względem bazy (6 plików, +2030): playback.rs (NOWY), mod.rs (+1 linia `pub mod playback;`), tests/battle_playback.rs (NOWY), 01-operator-r1.md, 02-evaluator.md, 02a-obrona.md. Wszystko w allowliście. Fikstury, gra/, engine, view-model i Cargo.lock bez zmian. Ten raport: commit na 7d02b0235 (SHA w wyniku FC).
TESTY (odtworzone samodzielnie przez FC na 7d02b0235, rust-port/renderer, CARGO_TARGET_DIR w scratchpadzie, usunięty po bramkach):
- `cargo fmt --check`: EXIT 0
- `cargo clippy --all-targets -- -D warnings`: EXIT 0
- `cargo test --all-targets --no-fail-fast`: EXIT 0; 68 zestawów, 559 passed, 0 failed, 0 ignored
- battle_playback: 9/9 (w tym nowe testy obrony `fast_forward_gap_is_closed_by_snapshot`, `error_does_not_stall_animations`)
- `#[ignore]` w nowych plikach: 0
- Mutacja kontrolna FC (c): pasek HP ustawiany z ramki w `apply_frame` → FAIL 3/9 (killing_counter_calls_follow_pin_order, fast_forward_gap_is_closed_by_snapshot, frame_bars_and_snapshot). Kod przywrócony, `git status` czysty.
- Dysk przed bramkami: 12 GB wolnego; po usunięciu targetu 2,1 GB (spadek przez inne sesje, nie przez ten temat).
BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: integracja orkiestratora + wpisy w REJESTR-RUST (poniżej).
DEPLOY/PUSH: NIE WYKONANO.

## Orzeczenia

| # | Zarzut Evaluatora | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| 0 | Bramki i allowlista | ODDAL | Potwierdzenie, nie zarzut. FC powtórzył bramki na stanie po obronie: EXIT 0, 559/0/0. |
| 1 | FF: brak Damage, stare HP | ODDAL | Obrona dopisała kontrakt sterownika P5 w doc `BattlePlayback` (po FF wywołać `apply_snapshot`) i test, który pokazuje zły pasek bez snapshotu. Zmiana DTO (flaga FF) jest zakazana dispatchem. Wpis do REJESTR-RUST należy do orkiestratora. |
| 2 | Brak produkcyjnego wołającego | ODDAL | Renderer nie zależy od civ-engine. Test integracyjny wymaga Cargo.toml lub innego crate'u, a to jest poza allowlistą. Strumień z prawdziwego silnika: NIE_ZMIERZONO. Wpis do rejestru jako zależność od sterownika P5. |
| 3 | Wyrocznia P == Q częściowo z Rust | ODDAL (uwaga) | Fikstura dynamics.json nie ma pasków po ciosie, bo generator stubuje `_singleBlow`. Same funkcje pasków i `kill_unit` mają wyrocznię webową w battle3d_units / battle3d_dynamics. Playback dokłada tylko kolejność i argumenty, a to sprawdzają test P == Q i mutacje. Punkt WEKTORY jest spełniony w zakresie, na jaki pozwalają istniejące fikstury. Rozszerzenie generatora wykracza poza allowlistę. |
| 4 | TowerShot bez rodzaju pocisku | ODDAL | FC sprawdził pin `battleScene.ts:4208-4219`: `shooterRow = this.towerShooterRow` jest jeden dla całej salwy i bitwy. `'wieza:'+row` to tylko id strzelca. Jedna wartość `PlaybackOpts::tower_projectile` na bitwę odpowiada więc pinowi. |
| 5 | Kill → HP 0; dead/removed ramki ignorowane | ODDAL | W I3 każda śmierć pochodzi z ciosu, więc zachowanie jest poprawne. Doc `apply_frame` jawnie odsyła śmierci bez ciosu do I5 (#249/#280). |
| 6 | play_until bez kroku animacji przy błędzie | ODDAL (naprawione przez obronę) | `play_until` krokuje teraz animacje mimo błędu. Pilnuje tego test `error_does_not_stall_animations`. |

Nie ma żadnego orzeczenia NAPRAW, więc wynik to PASS-WITH-NOTES.

## Uwagi do rejestru (dla orkiestratora)
- Kontrakt sterownika P5: po każdym fast-forward, przed kolejnym `Damage`, wywołać `BattlePlayback::apply_snapshot` (pin :8991-8992, :9940-9943).
- `BattlePlayback` nie ma produkcyjnego wołającego. Potrzebny jest sterownik P5 albo test integracyjny workspace (engine → renderer). Strumień z silnika: NIE_ZMIERZONO.
- I5 (#249/#280): akcje ruchu, strzału jednostki, tarana, katapulty i wyłomu (MoveAnim, launch_projectile z `_doRangedAttack`, RamAnim, Boulder, breach_*) nie są konsumowane, bo DTO nie ma tych wariantów. Śmierć bez ciosu wymaga rewizji `Kill` i `apply_frame`.
- Wyrocznia pasków po ciosie z fikstury: wymaga generatora bez stubu `_singleBlow` (osobny temat).

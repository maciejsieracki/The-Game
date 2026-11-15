STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q3
GOAL: MOD-14 cz. 3 (jednostki i nakładki bitwy 3D), port 1:1 do `rust-port/renderer/src/battle/`. Wywołanie 15.11 (DODATEK r2). Evaluator ocenia raporty Operatora `01-operator-impl.md` (BLOCK, `5c767337d`) i `01b-operator-pomiary.md` (`015defe7f`).
ZMIANY/COMMIT: oceniany `015defe7f` (rodzic `5c767337d`, a jego rodzic `95930b446` = `origin/rust-port/parity-v2`). Ten raport to jedyny plik Evaluatora, dodany jawnym `git add`, bez push.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## Werdykt w skrócie

Operator nie zmienił kodu, wektorów ani dokumentu P4-36. Sprawdziłem, że BLOCK ma podstawy: część 3 jest już na `parity-v2` z FC PASS. Bramki i manifest odtworzyłem sam, a wyniki zgadzają się z raportem. Mutacje odtworzyłem częściowo: 7/7 zabitych. Wektory `units.json` odtworzyłem z generatora. Uwagi są drobne (zarzuty 2–6). Temat nie dostarcza nowego GOAL, więc o zamknięciu decyduje orkiestrator (zarzut 1).

## Weryfikacja (wykonana przez Evaluatora, worktree `wf_102d919b-3d8-3`, HEAD `015defe7f`)

Środowisko: cargo 1.97.0 (jedyny toolchain), `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_102d919b-3d8-3-eval` (usunięty po bramkach).

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT=0 |
| `cargo clippy --locked --all-targets -- -D warnings` | EXIT=0 |
| `cargo clippy --locked --all-targets --features gpu -- -D warnings` | EXIT=0 |
| `cargo test --locked --all-targets` | EXIT=0; 62 przebiegi, 466 passed / 0 failed / 0 ignored |
| battle3d_* | dynamics 5, field 5, picking 8, siege_wall 3, units 9 = 30/30 |
| `python3 -I tests/fixtures/battle3d/mutate_units.py` (pełny przebieg, 43 mutanty) | CZĘŚCIOWO: 7/7 KILLED (HPBAR_W, HPBAR_Y, WALL_WALK_Y, dirYaw fallback, sideColor own, frame width pad, frame y). Przebieg (~1,3 min na mutanta) przerwał limit czasu etapu przy mutancie 8. Ostatni mutant został w `units.rs`; przywróciłem plik przez `git restore` (`git status` czysty). Pozostałe 36: NIE_ZMIERZONO przez Evaluatora; Operator podaje 43/43 (`dowody/mutate-units-15-11.txt`). |
| `sha256sum -c MANIFEST.sha256` | 25/25 OK, EXIT=0 (26 plików w katalogu = 25 + sam MANIFEST) |
| `git diff --check origin/rust-port/parity-v2 015defe7f` | czysto, EXIT=0 |

Allowlista: `git diff --name-only origin/rust-port/parity-v2 015defe7f` zwraca 4 pliki, wszystkie w `dyspozycje/autobot/runs/R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q3/`. Zero zmian w `gra/**`, `rust-port/engine/**`, `src-tauri/**`, `Cargo.*` i w kodzie renderera.

`#[ignore]`: grep w `src/battle/` i `tests/battle3d_*.rs` daje 0 trafień. Asercje: diff nie zmienia testów, więc nie mogły zostać osłabione. `battle3d_units.rs` porównuje przez `to_bits`, a `src/lib.rs:24` ma `#![forbid(unsafe_code)]`.

Twierdzenia o bazie sprawdzone na `origin/rust-port/parity-v2`:
- `git log -- src/battle/units.rs` zawiera `e8458ac81` (impl r1), `a0f334be7` (pomiary r1), `c88f96c2c`/`026d5b45d`/`8db7a9d04` (REPIN-3D A1/A2/A4);
- `runs/…-Q3/03-final-control.md` na bazie: `STATUS: PASS`, RUNDY 1/5;
- `P4-36-MOD14-BATTLE-3D.md` ma sekcje części 3 (§19–§28), 4 (§29–§38) i 5 (§39–§50).

Wektory (generator + SHA-256): odtworzyłem je niezależnie w `mktemp`-podobnym katalogu poza repo. Komendy: `npm install three@0.169.0 esbuild@0.24.0`, `git archive 86d510c66 gra/src gra/data`, `build_units.mjs`, `gen_units.mjs` (wydruk `ctor=11 units=1230 bars=10 arrows=12 preview=11 ghosts=16`). Wynik różni się od pliku w repo tylko polem nagłówka `"node"` (`v22.23.4` zamiast `v22.22.0`). Po podmianie tego pola SHA-256 = `4242bc10c46a4d6a042c59867af24c07c4f16c26b3ddbdcf562f0c1c7af15e54`, czyli tyle, ile w MANIFEST. Katalog scratch usunięty.

## Zarzuty (ponumerowane)

1. **[PROCES, do orkiestratora, nie wina Operatora] Dispatch nie ma nowego GOAL.** Treść r1 (2026-10-29) opisuje pracę zrobioną i zintegrowaną (`bb74ff9db` FC PASS jest przodkiem `parity-v2`). DODATEK r2 zmienia tylko modele i bazę. BLOCK Operatora jest uzasadniony i udokumentowany. Ponowny port z pinu `edb8fb56` cofnąłby REPIN-3D A4. Do zrobienia przez orkiestratora: zamknąć temat w rejestrze albo wydać nowy dispatch z GOAL, którego baza jeszcze nie spełnia. Commitów `5c767337d`/`015defe7f` nie trzeba integrować: to tylko raporty. Ich włączenie jest opcjonalne, jako ślad.
2. **[ROZBIEŻNOŚĆ GOAL a stan bazy, informacyjnie] Wektory części 3 nie pochodzą już z pinu `edb8fb56`.** `units.json` zregenerowano na `86d510c66` (REPIN-3D A4; README fixtur, sekcja „REPIN-3D A4”). Dispatch nadal żąda „bit w bit z webem (pin `edb8fb56`)”. Na bazie dosłowne kryterium nie jest spełnione, ale to świadoma, zintegrowana decyzja REPIN, a nie defekt tego wywołania. Nowy dispatch powinien wskazać pin `86d510c66`, jeśli temat ma wrócić.
3. **[POMIAR, drobny] Rozmiar katalogu fixtur nie odtwarza się.** Operator podał 11 983 553 B. Evaluator zmierzył 11 975 966 B, i to dwiema metodami (`find -printf %s` z sumą oraz `du -sb --apparent-size`). Różnica wynosi 7 587 B. Prawdopodobnie Operator policzył też plik tymczasowy, ale tego NIE_ZMIERZONO. Limit ≤ 12 MB jest spełniony w obu pomiarach. Największy plik ma 7 228 812 B, zgodnie z raportem.
4. **[RAPORT, drobny] Dryf `battleScene.ts` zapisany myląco jako „+1517”.** `git diff --stat 86d510c66 origin/main -- gra/src/battle/battleScene.ts` daje +1290/−227, czyli 1517 zmienionych linii, a nie 1517 dodanych. Pozostałe liczby dryfu zgadzają się: 38 plików +4709/−687 oraz 23 pliki +3065/−433.
5. **[ODTWARZALNOŚĆ, informacyjnie] Odtwarzalność bajt w bajt zależy od wersji node.** `units.json` zapisuje `process.version`, więc na node innym niż v22.22.0 SHA się różni, choć dane są identyczne. Na v22.23.4 bundle `gen_units.mjs` ma też inny SHA (`62ece649…`) niż w README (`2a35e6f4…`), a przyczyny NIE_ZMIERZONO. Na JSON danych to nie wpływa. README warto uzupełnić o normalizację pola `node`, ale to poza allowlistą tego wywołania.
6. **[FORMAT, drobny] Raport pomiarów ma podwójny STATUS** („PASS-WITH-NOTES (pomiary) / … BLOCK”). Kontrakt raportu wymaga jednej wartości. Właściwy stan tematu to BLOCK (zakres już wykonany), a pomiary są dowodem pomocniczym.

NIE_ZMIERZONO (także przez Evaluatora): 36 z 43 mutantów (przerwane limitem czasu), MSRV 1.87.0 (brak toolchainu), `cargo test --features gpu`, ocena wzrokowa (brak GPU), odtworzenie pliku pinu `edb8fb56` (`6fb3b65a…`; obecnie nieużywany), wpływ dryfu weba po `86d510c66` na wektory części 3.

TESTY: jak w tabeli wyżej.
BLOKADY: zarzut 1 wymaga decyzji orkiestratora. Brak blokad technicznych.
NASTĘPNY KROK: Obrona lub Final Control według procesu, potem decyzja orkiestratora: zamknięcie tematu albo nowy GOAL.

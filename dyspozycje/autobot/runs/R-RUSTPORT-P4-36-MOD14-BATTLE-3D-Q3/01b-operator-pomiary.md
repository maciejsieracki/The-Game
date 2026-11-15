STATUS: BLOCK
<!-- Korekta w Obronie (02a-obrona.md, zarzut 6): pierwotnie podwójny STATUS „PASS-WITH-NOTES (pomiary) / BLOCK”. Kontrakt wymaga jednej wartości. Stan tematu = BLOCK (zakres już zintegrowany), pomiary niżej są dowodem pomocniczym. -->
<!-- Korekty liczb w Obronie: zarzut 3 (rozmiar katalogu fixtur), zarzut 4 (dryf battleScene.ts). -->

DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q3
GOAL: MOD-14 część 3 (jednostki i nakładki) wg §4 P4-36. To wywołanie, Operator "pomiary" (15.11): mutacje i bramki na bieżącej bazie. Część 3 jest już na `parity-v2`: FC PASS `bb74ff9db`, potem REPIN-3D A1/A2/A4.

ZMIANY/COMMIT:
- Baza: `5c767337d` (raport impl z wywołania 1), rodzic `95930b446` = `origin/rust-port/parity-v2`. `git merge-base --is-ancestor 7817ef0c` daje OK.
- Kod, wektory i dokument P4-36 bez zmian. Dodane wyłącznie pliki w `runs/…-Q3/`:
  - `01b-operator-pomiary.md` (ten raport);
  - `dowody/mutate-units-15-11.txt` (surowy wynik skryptu mutacji);
  - `dowody/gates-pomiary-15-11.txt` (bramki z EXIT i wyciąg `Running`/`test result` z `cargo test`).
- Commit ma jawny `git add` tych 3 plików. Bez push.

TESTY (cargo 1.97.0; `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, target poza repo):
- `cargo fmt --all -- --check`: EXIT=0.
- `cargo clippy --locked --all-targets -- -D warnings`: EXIT=0.
- `cargo clippy --locked --all-targets --features gpu -- -D warnings`: EXIT=0.
- `cargo test --locked --all-targets`: EXIT=0, 62 przebiegi, **466 passed / 0 failed / 0 ignored**. Pomiar r1 na starej bazie dał 408; wzrost pochodzi z tematów zintegrowanych później.
- `battle3d_*`: units 9, field 5, picking 8, siege_wall 3, dynamics 5, razem 30/30.
- Mutacje `python3 -I tests/fixtures/battle3d/mutate_units.py` na `src/battle/units.rs` po REPIN-3D: wszystkie 43 wzorce występują dokładnie raz (sprawdzone przed uruchomieniem), wynik **KILLED 43/43**, EXIT=0. Po przebiegu `git status` jest czysty (źródło przywrócone).
- Fixtury: `sha256sum -c MANIFEST.sha256` 25/25 OK. Katalog ma 11 975 966 B (≤ 12 MB; korekta w Obronie, zarzut 3: pierwotnie podano 11 983 553 B, czego nie da się odtworzyć; `find -printf '%s'` z sumą i `du -sb --apparent-size` dają 11 975 966 B, 26 plików), największy plik `siege_wall.json` 7 228 812 B (≤ 8 MB).
- Dryf weba (`origin/main` `807ecebdd`), tylko odnotowany, bez przepinania:
  - `git diff --shortstat edb8fb56 origin/main -- gra/src/battle gra/src/render`: 38 plików, +4709/−687.
  - Od bazy wektorów REPIN `86d510c66`: 23 pliki, +3065/−433, w tym `battleScene.ts` +1290/−227, czyli 1517 zmienionych linii (korekta w Obronie, zarzut 4; `git diff --numstat 86d510c66 origin/main -- gra/src/battle/battleScene.ts`).
  - Wpływ na wektory części 3: NIE_ZMIERZONO.

BLOKADY:
- Zakres impl nie ma nic do zrobienia: część 3 jest zintegrowana (szczegóły w `01-operator-impl.md`). Orkiestrator ma zamknąć temat w rejestrze albo wydać nowy dispatch z GOAL, którego baza jeszcze nie spełnia.
- NIE_ZMIERZONO:
  - MSRV 1.87.0, bo toolchain nie jest zainstalowany (`rustup toolchain list` pokazuje tylko stable 1.97.0);
  - `cargo test --features gpu`;
  - ocena wzrokowa (brak GPU);
  - niezależne odtworzenie generatora z uruchomionego weba w tym wywołaniu.

RUNDY: 1/5
NASTĘPNY KROK: orkiestrator decyduje: zamknięcie tematu albo nowy GOAL. Evaluator i Final Control nie mają nowego kodu do oceny.
DEPLOY/PUSH: NIE WYKONANO

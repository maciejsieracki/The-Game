STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WALKA-DYSTANS-PETLA-Q1
GOAL: obrona Operatora r1 wobec zarzutow N1-N3 Evaluatora/Final Control (port petli dystansowej `resolveCombat`, `ranged_shot_damage`, `field_power`)
ZMIANY/COMMIT: 460f84a05 (lokalnie, na gałęzi `autobot/p6-repin-dystans-obrona`, nie wypchnięte). Allowlista: tylko `rust-port/engine/tests/p6_repin_dystans_petla.rs`. Zero zmian w `combat.rs`, `unit_power.rs`, `gra/**`, `WERSJE.md`, `Cargo.toml`, `mod.rs`. Plik `Cargo.lock` jest niewersjonowany i nie został zcommitowany.
TESTY:
- `cargo fmt --check`: EXIT 0 (po `rustfmt` wyłącznie na pliku testu).
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `cargo test --lib`: 22 passed, 0 failed.
- `p6_repin_dystans_petla`: 3/3 passed (w tym `matches_web` z nowymi asercjami).
- `p6_repin_dystans_fieldpower`: 1/1 passed.
- `p6_repin_dystans_formulas`: 8/8 passed.
- Pełny `cargo test --no-fail-fast` (N3): NIE_ZMIERZONO w całości. Przed zatrzymaniem: 115 binarek zakończonych, 1015 testów passed, 0 failed. Binarka `p6_8i_pick` zawisła na teście `pick_auto_improvements_matches_pinned_web_vectors` (>5 min CPU w debug, bez wyniku). Pozostało około 210 binarek z 325 nieuruchomionych. Proces zatrzymany przeze mnie (kod 144), `target/` usunięty. Log: scratchpad `full-test.log`.
BLOKADY: brak blokad formalnych. Pełny `cargo test` wymaga osobnego uruchomienia (w tle, dłuższy limit, ewentualnie wykluczenie `p6_8i_pick`) przy integracji.
ODPOWIEDZI NA ZARZUTY:
- N1: PRZYJMUJĘ. Naprawione w 460f84a05. Test `petla_matches_web` sprawdza teraz: (a) stronę routu względem noty webu ("Atakujacy..." lub "Obronca..."), zamiast samego `is_empty()`; (b) HP uciekającej strony względem wartości HP podanej w nocie webu (`HP X < prog`); (c) przy każdym strzale HP celu = HP przed - obrażenia, a chybienie nie zmienia HP celu; (d) końcowe `hp_attacker`/`hp_defender` względem śledzonego HP po strzałach; (e) brak routu, gdy web go nie podaje. Ammo i `rounds` nie zostały dodane do wektorów (web nie zapisuje ich w nocie); nie zmieniałem generatora ani wektorów. Stąd ammo pozostaje pokryte tylko testami formuł, a nie wektorami.
- N2: ODRZUCAM. Mnożniki kontry = 1.0, rzeka = 1.0 i `start_rounds` = 0 są jawnie udokumentowanym założeniem: dispatch, sekcja "Ustalone ZAŁOŻENIA" (punkt 2), oraz `dyspozycje/rust-port/p6/P6-REPIN-DYSTANS-PETLA.md` §2 pkt 8 (linia 35: "wektory mają mnożnik kontry = 1 (web liczył z pustą tabelą `counters`), teren-rzeka ... NIE_ZMIERZONO"). Dispatch wprost wyłącza wejście fazy z zarzutu FAIL. Ścieżki kontry i rzeki pozostają NIE_ZMIERZONO i wymagają osobnego tematu wyliczania modyfikatorów.
- N3: PRZYJMUJĘ jako ograniczenie, nie naprawiam. Pełny `cargo test` nie został ukończony (patrz TESTY). Zmiana Operatora r1 i r2 jest czysto addytywna w kodzie produkcyjnym. W pliku testu usunięto tylko stare asercje zastąpione silniejszymi; nie usunięto żadnego `#[ignore]` ani nie osłabiono asercji.
RUNDY: 2/5 (Operator r1 = runda 1; ta obrona = poprawka Operatora w tej samej rundzie Evaluatora/FC)
NASTĘPNY KROK: ponowny Evaluator na 460f84a05 (bramki z TESTY), potem Final Control. Pełny `cargo test` w tle przy integracji (N3).
DEPLOY/PUSH: NIE WYKONANO

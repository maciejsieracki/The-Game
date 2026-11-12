STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-INTEG-B14A-Q1
GOAL: batch 14a (L3-DEFS + L3-KOSZT + POWER-ULEPSZENIA + R7-AUDYT) scalony na db1e75378, bramki zielone.
ZMIANY/COMMIT: oceniany SHA 513e1a56c (obrona r1). Ancestry: 05aaf3922, 0fe9b3222, f47aa359c, de92c63fd, db1e75378 sa przodkami 513e1a56c (TAK x5). Zmienione pliki wyłącznie w allowliście (rust-port/engine/src/domain/{brake_power_*, mod, playable, turn_war_inputs, unit_replace_*}.rs, testy p6_power_*/p6_unit_replace_*/p6_wire_war_inputs + wektory, dyspozycje/**). Brak zmian w gra/, WERSJE.md, Cargo.*, engine/data. Brak push.
TESTY (zweryfikowane samodzielnie na 513e1a56c, detached): cargo fmt --check EXIT 0; cargo clippy --all-targets -- -D warnings EXIT 0; pełny cargo test --no-fail-fast FULL_EXIT=0, passed=3022 failed=0 ignored=1; lib 64 passed. Zgodne z raportem Operatora.
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (READY_FOR_DEPLOY wystawia orkiestrator); długi poniżej do rejestru.
DEPLOY/PUSH: NIE WYKONANO

## Zarzuty

1. Doc check_terytorium: ODDAL (naprawione w obronie; diff 513e1a56c potwierdza +1 linia doc w p6_power_sources.rs).
2. ulepszenia=ExplicitZero w power_raw_for_owner bez wpisu w rejestrze: ODDAL (zgodne z dispatchem; wpis DLUG-POWER-ULEPSZENIA-WIRING w 02a-obrona.md; strażnik p6_wire_war_inputs.rs:268). Orkiestrator przenosi do rejestru.
3. Zmiana API replace_unit (3 arg) / replace_unit_with_defs (4 arg) i HP bez battlesSurvived/parametryBonusProc: ODDAL (opisane w 02a i w doc PLAYABLE_UNIT_PROGRESS; dług DLUG-UNIT-REPLACE-PROGRESS). Obrona zmieniła wyłącznie komentarze (diff d337d9238..513e1a56c: 3 pliki, bez zmian wykonawczych).
4. Wynik bramek: potwierdzone, bez zarzutu. Zmiany asercji ograniczone do ulepszeń (3->2 w EXPLICIT_ZERO_REASONS, keys [bitwy, zdobycze]) - przeglądnięte, nie osłabiają testów.

Brak NAPRAW => PASS-WITH-NOTES.

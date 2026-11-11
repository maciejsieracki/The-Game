STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-ZAPIS-LOADER-MIGRATE-Q1
GOAL: produkcyjny loader zapisu zawsze wola migrate_on_load (wariant A)
ZMIANY/COMMIT: kod+obrona 1e44075e3 (potomek f207ea6b1; `git merge-base --is-ancestor f207ea6b1 1e44075e3` = OK). Diff: mod.rs (+6: 3x pub mod + 3x cfg(not(test))), replay.rs (+5, komentarz + allow clippy), zapis_loader.rs (nowy), tests/p6_zapis_loader_migrate.rs (nowy), raporty. Allowlista zgodna, brak gra/, Cargo.*, WERSJE.md. git diff --check OK, brak #[ignore].
TESTY (odtworzone samodzielnie, CARGO_INCREMENTAL=0, DEBUG=0): cargo check --lib EXIT=0; fmt --check EXIT=0; clippy --all-targets -D warnings EXIT=0; test --lib 28 passed EXIT=0; test p6_zapis_loader_migrate (4) + p6_zapis_migracje_snapshot_load (10) passed EXIT=0. Kryterium 1: jedyne trafienia from_str::<SaveSnapshot> w src to komentarze.
ROZSTRZYGNIECIE ZARZUTOW:
1. replay.rs snapshot bez migracji - ODDAL (dlug oznaczony komentarzem; kryterium 1 dispatchu spelnione literalnie) + DO DECYZJI CZLOWIEKA (dlug vs migracja po zaladowaniu replayu; wymaga zrodla epoki).
2. publiczny impl Deserialize - ODDAL (wymagany przez derive ReplayStep i test; ukrycie poza allowlista).
3. era_for_owner / LoadMigrationReport - ODDAL jako uzasadnione odchylenie; zrodlo epoki w produkcji = DO DECYZJI CZLOWIEKA.
4. cfg(not(test)) x3 - ODDAL (obrona zmierzyla: bez nich lib-test EXIT=101, 9 bledow); dlug podwojnych importow wczesniejszy.
5. allow(should_implement_trait) - ODDAL (publiczne API, minimalna zmiana).
6. slaba asercja - ODDAL (usunieta w obronie; kontrola raw_loaded kompensuje).
Zero NAPRAW.
BLOKADY: brak
RUNDY: 2/5
NASTEPNY KROK: integracja orkiestratora po decyzjach czlowieka (pkt 1, 3)
DEPLOY/PUSH: NIE WYKONANO

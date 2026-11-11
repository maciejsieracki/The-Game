# DISPATCH — R-RUSTPORT-DLUG-CFGTEST-Q1 (zadanie 12: cfg(not(test)) na 3 modułach zapisu; runda 1/5, Operator)
Baza: origin/rust-port/parity-v2 = ca33abdd6.
Źródło: raport FC R-RUSTPORT-ZAPIS-LOADER-MIGRATE-Q1 r2 (dług nr 3).
GOAL: znaleźć 3 moduły z cfg(not(test)) w zapisie (git grep -n 'cfg(not(test))' -- rust-port/engine/src), ocenić każdy: czy atrybut jest potrzebny; jeśli nie — usunąć i sprawdzić kompilację; jeśli tak — udokumentować dlaczego w komentarzu (jedna linia).
Kryteria: 1) brak cfg(not(test)) bez uzasadnienia; 2) bramki zielone; 3) brak zmian poza allowlistą.
Allowlista: 3 pliki z cfg(not(test)) w rust-port/engine/src/domain/ (wymień w raporcie); dyspozycje/autobot/runs/R-RUSTPORT-DLUG-CFGTEST-Q1/**. ZAKAZ: gra/**, origin/main, WERSJE.md, Cargo.toml, Cargo.lock (nie commitować).
Bramki: cargo fmt --check; cargo clippy --all-targets -- -D warnings; cargo test --lib (EXIT zapisany).
Zmienne: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0; CARGO_TARGET_DIR poza repo (usuń po bramkach). Raport 01-operator-r1.md.

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-POWER-SOURCES-Q1
GOAL: zsynchronizowac COMPONENT_SOURCES z faktycznymi producentami + poprawic komentarze
ZMIANY/COMMIT: kod 09ac15293 (operator 57ed78744 + obrona r1). Ancestry: origin/rust-port/parity-v2 (ceb688b0d) jest przodkiem 09ac15293; 57ed78744 jest przodkiem 09ac15293. Zmienione: brake_power_producers.rs, brake_power_army.rs (komentarz), tests/p6_power_sources.rs (nowy), tests/p6_power_producers.rs, tests/p6_power_nozeros.rs, run dir. Brak gra/, WERSJE.md, Cargo.*.
TESTY (samodzielnie, FC): fmt --check OK; clippy --all-targets -D warnings OK; cargo test --lib 48 passed; p6_power_sources 4, rest 9, nozeros 9, army 7, producers 9 passed; git diff --check OK.
BLOKADY: brak
RUNDY: FC po 2/5
NASTEPNY KROK: integracja orkiestratora
DEPLOY/PUSH: NIE WYKONANO

## Orzeczenia
1. Poza allowlista (producers.rs, nozeros.rs): ODDAL. Zmiana wymuszona (stare asercje 8 NoProducer staly sie falszywe); oczekiwania podazaja za tabela, nie oslabione (coverage 4->9). Orkiestrator przyjmuje jawnie przy integracji.
2. nozeros hardcode/nazwa: ODDAL (naprawione w obronie; lista wyprowadzona z tabeli).
3. Slabe testy producentow: ODDAL (ludki/rekruci/kultura na pelnych wektorach; miasta bez klucza w vectors.json, trywialne, uzasadnione).
4. NoProducer plik:linia i zgodnosc z REST table: ODDAL (testy dodane, zielone).
5. Brak grepu na producenta: ODDAL (dispatch dopuszcza jawna liste). Ryzyko placed_improvements_for_owner odnotowane.
6. armia/terytorium RustProducer vs apply_produced: ODDAL (udokumentowane, numery linii dodane).
Zero NAPRAW.

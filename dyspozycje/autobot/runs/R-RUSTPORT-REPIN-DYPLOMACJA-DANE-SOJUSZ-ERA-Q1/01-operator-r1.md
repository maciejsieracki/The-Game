STATUS: PASS-WITH-NOTES
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-REPIN-DYPLOMACJA-DANE-SOJUSZ-ERA-Q1
GOAL: Zsynchronizować z webem dwa dryfy danych z REPIN-DELTA-6: sojusz 130/90 (prog_relacja, progSojuszRelacja, progSojuszZaufanie, progUmowaMinRelacja) i opóźnienie wojny epoki 40 tur (bronze/iron; stone też 40 w JSON weba). Wypisać dryf w P6-REPIN-DYPLOMACJA-DANE.md.
ZMIANY-COMMIT: commit dc4ba1dbd (gałąź detached na 5261decd7, PUSH NIE). Pliki: rust-port/engine/data/diplomacy-acceptance-points.json, rust-port/engine/data/diplomacy.json (POZA allowlistą, ZAŁOŻENIE), rust-port/engine/src/domain/diplomacy.rs, diplomacy_multiwar_gate.rs, war_era_pool.rs (komentarz), war_forced_stone.rs (POZA allowlistą, ZAŁOŻENIE: stone 25 -> 40), testy i wektory p6_* (allowlista: testy asertujące stare wartości), nowy tests/p6_repin_dyplomacja_dane_sojusz_era.rs, dyspozycje/rust-port/p6/P6-REPIN-DYPLOMACJA-DANE.md. Commit raportu: osobny (SHA w git log, po dc4ba1dbd).
TESTY:
- cargo fmt --check: OK (exit 0)
- cargo clippy --all-targets -- -D warnings: exit 0, bez ostrzeżeń
- cargo test --lib: 22 passed, 0 failed
- binarki dotknięte zmianą (diplomacy, data_civilizations, p6_dyplo_*, p6_dyplomacja_*, p6_forced_war_g1/g2/g3/g3b, p6_repin_ai_war_vectors, p6_repin_dyplomacja_dane_sojusz_era, p6_repin_wojna_*, p6_zapis_erawar_*, p6_ai_peace_city_offer, p6_m02_generator, map_generator i inne): 0 FAILED w ostatnim przebiegu
- NIE_ZMIERZONO: pełny cargo test wszystkich binarek (uruchomiono podzbiór dyplomacji/wojny/danych)
- Wektory web: g2 regenerowany Node 22 (306 przyp., różnica 0, ZMIERZONO). g3b: generator z repo nie działa na obecnym webie (brak literału w forced-war-stone.ts); użyto łatanej kopii w scratchpadzie (stone=40 z war-rules-params.json). ai_war: generator poza repo, out przeliczony funkcją 1:1 z war-rules-multiwar.ts (walidacja 560/560 przy progu 20; zmiana 24 wierszy przy 40) — NIE_ZMIERZONO w Node.
- Usunięto: target/ i Cargo.lock tej rundy (sprzątanie po bramce).
BLOKADY:
- Pliki poza allowlistą (diplomacy.json, war_forced_stone.rs, wektory g1/g3b/eraign) — opisane jako ZAŁOŻENIA w raporcie P6.
- Skrypt gen_cases_g3b.mjs w repo nie działa na obecnym webie (literał stone przeniesiony do JSON) — NIE naprawiany (poza allowlistą).
- Luki zmierzone, nienaprawione (poza tematem): brak progNapBezterminowyRelacja w Rust; brak traktatu „rozejm” w diplomacy-acceptance-points.json; przewagaMilitarna.prog, pokojAiAi, bez_wylomu, unitsPerSiegeEngine, rangeDamageTw, utrzymanie surowcowe (patrz P6-REPIN-DELTA-6 §1).
RUNDY: 1/5
NASTĘPNY KROK: FC (Final Control, Sonnet) na commicie dc4ba1dbd; oceniać zgodność z allowlistą i wyjątki ZAŁOŻEŃ (diplomacy.json, war_forced_stone.rs).
DEPLOY/PUSH: NIE WYKONANO

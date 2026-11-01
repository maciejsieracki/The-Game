STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-TERYTORIUM-FORTY-Q1
GOAL: REPIN delty weba `dc8a3adc` -> `4bbef081d` (forty/terytorium); `p6_8i_pick` w trybie ostrym, 0 odchylen.

ZMIANY/COMMIT: SHA w sekcji "Commit" na koncu (commit zawierajacy ten raport). Zakres:
- `domain/territory.rs`: `TerritoryOrder`, `TerritoryNode.order`, `territory_owner_at` (miasto przed fortem, wczesniejszy fort wygrywa, remis turn->seq).
- NOWY `domain/fort_territory.rs`: `OrderedFortNode`, `next_fort_seq`, `backfill_fort_order`, `fort_territory_nodes`, `is_hex_in_foreign_fort_territory`, `apply_fort_capture_by_occupation` (sama logika).
- `data/terrain-improvements.json` = `4bbef081d` bajt w bajt (promienie fort 5 / posterunek 3).
- `tests/p6_8i_pick.rs`: usunieta tolerancja dryfu. NOWE: `tests/p6_repin_teren_domain.rs`, `tests/p6_repin_teren_vectors/teren.json` (2,0 MB).
- Dokument: `dyspozycje/rust-port/p6/P6-REPIN-TERYTORIUM-FORTY.md` (tabela zmiana -> plik:linia weba -> Rust -> test -> status).

TESTY:
- `p6_8i_pick`: 5/5, 2227 scenariuszy (107 z fortNodes), 0 odchylen (`gate-8i-teren.txt`).
- Nowe `p6_repin_teren_domain` 6/6: 20 759 zapytan owner, 6000 foreign, 300 nodes, 300 seq, 900 capture (149 zdarzen); brzegi N-1/N/N+1 dla promieni 3/5.
- Weryfikator Python `-I` (`verify-teren.py`): 0 rozbieznosci. Generator odtwarzalny (ten sam sha256 przy 2 uruchomieniach).
- Mutacje: 32, zabite 31, 1 rownowazny (T6, dowod plik:linia w P6-REPIN-TERYTORIUM-FORTY.md §3). Logi `mut-*.log`.
- Regres terytorium PRZED/PO (37 binariow): 336/0 -> 336/0 (`gate-pre-teren.txt`, `gate-post-teren.txt`).
- Pelny test w 8 shardach `-j 2` (265 binariow + lib): 2019 ok / 0 fail, EXIT=0 (`gate-test-shard0..7.txt`). fmt EXIT=0, clippy `--all-targets -D warnings` EXIT=0, `git diff --check` EXIT=0.

BLOKADY: brak. ZALOZENIA (pliki/decyzje poza allowlista, szczegoly w dokumencie §4):
- A: `FortNode` w `terrain.rs` bez zmian; porzadek budowy w `OrderedFortNode` (unika zmiany konstruktorow poza allowlista).
- B: 19 testow (6 binariow) ze starymi wektorami pinu `edb8fb56` (promienie 10/5) zaczelo swiecic po przepieciu danych; wektory zregenerowane z URUCHOMIONEGO weba `4bbef081d` tymi samymi generatorami/ziarnami, wejscia identyczne, zmienione tylko wyjscia (`dowod-regen-wektorow.txt`): `p6_m14_vectors/{territory,work,wonder,range}.json`, `p6_23_vectors/fort.json`, `p6_m16_vectors/qualifier.json` (7,7 MB jak przed zmiana; generator z poprawionym oknem linii: `gen-m16-vectors-4bbef.mjs`).
- C: `domain/mod.rs` +1 linia `pub mod fort_territory;`.
- D: tresc decyzji wlasciciela #15-#19 nie czytana osobno; port odtwarza kod weba `4bbef081d`.
- E: `order.turn/seq`, `builtAtTurn` jako i64 (web: number; NaN poza zakresem).
- `improvements.rs`, `gra/**`, `auto_improvements*`, `mapgen/**`, `Cargo.toml`, `WERSJE.md` bez zmian. `improvement-build.ts` w delcie: tylko komentarze (kod bez zmian; dowod: qualifier z 4bbef zgodny z Rust).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (niezalezne odtworzenie bramek, weryfikatora i wybranych mutacji; ocena ZALOZEN B i C), potem Obrona, Final Control.
DEPLOY/PUSH: NIE WYKONANO

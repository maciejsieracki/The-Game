STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8C-PRODUKCJA-KOLEJKA-Q1
GOAL: P6.8C -- port do Rust symboli kolejki produkcji `production.ts` 1253-1976 (pin web 91dc998a): frontItem, etaTurns, buildingWorkPerTurn, unitRecruitmentCapacityPerTurn, enqueue, forfeitedProgressForIndex, bank*/withdraw*, sanitizeBuildQueue, dropFrontItem (reuse), dequeue, filterQueue, promoteToFront, insertAtFront, advanceProduction. Wektory z uruchomionego TS, testy progow NaN/brakujacych kluczy, mutacje galezi sterujacych, dokument tematu z tabela symboli. Baza: origin/rust-port/parity-v2 @ 28f16d9da.

ZMIANY/COMMIT:
- Commit kodu: b48434a5a (branch `work/p68c-r1`, lokalnie, NIE pushowany). SHA commita raportu podany w odpowiedzi orkiestratorowi.
- Kod (nowy modul): `rust-port/engine/src/domain/production_queue.rs` (469 linii, 15 symboli + typy wynikow).
- Kod (drobne): `rust-port/engine/src/domain/mod.rs` (+1: `pub mod production_queue;`), `rust-port/engine/src/domain/production_units.rs` (`drop_front_item` -> `pub(crate)`, +5/-1; reuse, bez duplikatu).
- Wektory: `rust-port/engine/tests/p6_8c_vectors/p8c.json` (2880 przypadkow, 1,26 MB, pin 91dc998a).
- Testy: `rust-port/engine/tests/p6_8c_vectors.rs` (13 testow: 3 grupy wektorowe + 10 jawnych progowych/NaN/brak kluczy).
- Generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-8C-PRODUKCJA-KOLEJKA-Q1/gen-p6-8c-vectors.mjs` (loader TS z runu 8B, zero stubow).
- Mutacje: `.../mut-p6-8c.sh`; logi `.../dowody/mut-p6-8c-a.log`, `.../dowody/mut-p6-8c-b.log`.
- Dokument tematu: `dyspozycje/rust-port/p6/P6-8C-PRODUKCJA-KOLEJKA.md` (tabela symboli z liniami web pinu i Rust, zalozenia, bramki).
- Nie zmieniano: `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `Cargo.toml`, `WERSJE.md`.
- Nie dodano do commita: `rust-port/engine/Cargo.lock` (wygenerowany lokalnie przez cargo, usuniety po testach).

MAPA SYMBOLI (web pin -> Rust, `production_queue.rs`): frontItem 1253 -> front_item :28; etaTurns 1268 -> eta_turns :33; buildingWorkPerTurn 1274 -> building_work_per_turn :43; unitRecruitmentCapacityPerTurn 1282 -> unit_recruitment_capacity_per_turn :63; enqueue 1318 -> enqueue :152; forfeitedProgressForIndex 1366 -> forfeited_progress_for_index :91; bankRemovedBuildingProgress 1397 -> bank_removed_building_progress :110; withdrawBankedBuildingProgress 1420 -> withdraw_banked_building_progress :134; sanitizeBuildQueue 1440 -> sanitize_build_queue :206; dropFrontItem 1508 -> drop_front_item (`production_units.rs`); dequeue 1564 -> dequeue :251; filterQueue 1647 -> filter_queue :288; promoteToFront 1745 -> promote_to_front :330; insertAtFront 1826 -> insert_at_front :356; advanceProduction 1899 -> advance_production :394 (z `buildingSpeedBonus`).

TESTY (wszystkie EXIT=0 chyba ze zaznaczono):
- `cargo fmt --all -- --check`: EXIT=0.
- `cargo clippy --all-targets -- -D warnings`: EXIT=0 (po poprawce 2 wystapien `neg_cmp_op_on_partial_ord`: `!(x > 0)` -> `x.is_nan() || x <= 0`, ta sama semantyka).
- `cargo test --test p6_8c_vectors`: 13 passed, 0 failed.
- `cargo test --no-fail-fast` (caly silnik): 1770 passed, 0 failed (baza 1757 + 13 nowych).
- `git diff --check` (staged): czysto.
- Wektory: generator na pinie 91dc998a, EXIT=0, total 2880: frontItem 10, etaTurns 336, buildingWorkPerTurn 90, unitRecruitmentCapacityPerTurn 90, enqueue 400, forfeitedProgressForIndex 100, bankRemovedBuildingProgress 400, withdrawBankedBuildingProgress 24, sanitizeBuildQueue 10, dequeue 400, filterQueue 70, promoteToFront 100, insertAtFront 400, advanceProduction 450.
- Porownanie: bity (`to_bits`) dla liczb, NaN == NaN, struktura bez kolejnosci kluczy; -0 rozroznione jak Object.is.
- MUTACJE: 12/12 WYKRYTE (test FAIL po kazdej): M01 indeks 0 w queue_slot; M02 forfeited <=0; M03 withdraw >0; M04 eta min 1; M05 prog advance `<`; M06 promote slot >=1; M07 enqueue banked >0; M08 sanitize front legacy; M09 bonus nie-skonczony; M10 galaz pustej kolejki enqueue; M11 insert postep>0; M12 pauza advance. Plik przywrocony bit-w-bit (cmp).
- Pomiary dlugie: nie wykonywane (zgodnie z dispatchem); dysk: web-kopie w scratchpad usuniete, `rust-port/engine/target` usuniete.

BLOKADY / OTWARTE PUNKTY (ZALOZENIA, bez pytan do wlasciciela):
1. ROZBIEZNOSC PIN vs HEAD (do decyzji orkiestratora / Evaluatora). Dispatch pisze, ze pin wektorow 91dc998a jest bez zmian dla tych plikow. Stwierdzono: `gra/src/game/production.ts` na `origin/rust-port/parity-v2` (2378 linii) NIE zawiera `buildingWorkPerTurn`, `unitRecruitmentCapacityPerTurn` ani `buildingSpeedBonus` (0 trafien grep); pin 91dc998a (2541 linii) je zawiera, a `advanceProduction` ma tam trzeci parametr. ZALOZENIE: port i wektory sa wg PINU 91dc998a (zgodnie z dispatchem: "wektory z URUCHOMIONEGO weba 91dc998a"). Jesli normatywny jest HEAD, te 3 symbole/parametr trzeba zrewidowac.
2. Brak wywolan Rust (call sites) dla nowego modulu; port jest bibliotecznie gotowy, bez podpiecia w silniku (zgodne z zakresem tematu).
3. Zalozenie o `city`: Rust przyjmuje tylko mape `postepBudynkowUsuniete` (nie cale `City`). Zalozenie 2-5 w dokumencie tematu.
4. Mutacje pokrywaja 12 galezi sterujacych (wybrane w 12 z 15 funkcji); pozostale galezie sa pokryte wektorami, nie osobna mutacja. Obrona moze dolozyc.
5. Klucz `__proto__` w `bankRemovedBuildingProgress`: web nie zapisuje; Rust pomija zapis (zalozenie 4 w dokumencie).

RUNDY: 1/5
NASTEPNY KROK: Evaluator (niezalezna regeneracja wektorow z pinu 91dc998a, przeglad zalozen 1-5, rozstrzygniecie pkt 1 BLOKAD) -> Final Control -> integracja orkiestratora. Zadnej integracji ani deployu w tej rundzie.
DEPLOY/PUSH: NIE WYKONANO

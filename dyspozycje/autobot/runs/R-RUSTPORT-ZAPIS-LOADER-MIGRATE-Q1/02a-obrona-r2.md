STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-ZAPIS-LOADER-MIGRATE-Q1 (r2, obrona Operatora)
GOAL: Odpowiedz na 6 zarzutow Evaluatora r2 (PRZYJMUJE z poprawka + dowodem albo ODRZUCAM z dowodem).
ZMIANY/COMMIT: baza kod 75c390866 (raport 3b95a4b00). Commit poprawek: SHA podany w odpowiedzi orkiestratora (galaz wip/R-RUSTPORT-ZAPIS-LOADER-MIGRATE-Q1-obrona-r2, bez push). Allowlista: rust-port/engine/src/domain/replay.rs (komentarz doc przy polu snapshot), rust-port/engine/tests/p6_zapis_loader_migrate.rs (usuniety slaby assert + import). Brak zmian w logice, mod.rs, save_load.rs. Cargo.lock nie commitowany.
TESTY: fmt --check EXIT=0; clippy --all-targets -- -D warnings EXIT=0; test --lib EXIT=0 (28 passed, 0 ignored); test --test p6_zapis_loader_migrate --test p6_zapis_migracje_snapshot_load EXIT=0 (4 + 10 passed, 0 ignored). Target dir usuniety.
BLOKADY: decyzje orkiestratora (patrz punkt 1 i 3).
RUNDY: 2/5
NASTĘPNY KROK: Evaluator r3 (weryfikacja obrony) albo decyzja orkiestratora o dlugu replay/era.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

1. (istotny) replay.rs: ReplayStep<I> derive Deserialize z Option<SaveSnapshot>. -> PRZYJMUJE (fakt), czesciowa poprawka.
   Dowod: replay.rs:36 pole `snapshot: Option<SaveSnapshot>` w derive Deserialize; ReplayLog::deserialize (replay.rs ~152) deserializuje kroki przez ReplayWire, wiec snapshot z replayu trafia do SaveSnapshot::deserialize bez migrate_on_load. Poza testami tests/replay.rs nie ma produkcyjnego wolajacego ReplayLog (git grep ReplayLog). Poprawka: komentarz doc przy polu snapshot oznacza to jako otwarty dlug. Nie naprawiam kodu: migracja po wczytaniu replayu wymaga zrodla epoki wlasciciela, a tego nie ma w replayu (ta sama decyzja co w punkcie 3). Decyzja orkiestratora: dlug albo migracja po zaladowaniu replayu z era_for_owner.

2. (istotny) Publiczny impl Deserialize for SaveSnapshot -> ODRZUCAM jako wymog zmiany.
   Dowod: `impl Deserialize for SaveSnapshot` jest wymagany przez derive Deserialize w ReplayStep (replay.rs:30) i przez kontrole raw_loaded w tescie (p6_zapis_loader_migrate.rs). Usuniecie/ukrycie impl wymaga zmian w save_load.rs i replay.rs poza zakresem "tylko konieczne do kompilacji" z dispatchu i zmienia API publiczne. Egzekwowanie na poziomie typu nie jest mozliwe bez tej zmiany; egzekwowanie jest konwencja udokumentowana w komentarzu przy impl oraz testem behawioralnym loadera. Kryterium 1 jest spelnione w zakresie `src/` (grep: jedyne `from_str::<SaveSnapshot>` to komentarz doc w save_load.rs:640), ale nie jest wymuszone typem; to zapisuje raport jako NOTE.

3. (sredni) Sygnatura load_save_snapshot z era_for_owner -> PRZYJMUJE jako odchylenie, bez zmiany kodu.
   Dowod: save_load.rs:575 `migrate_on_load(&mut self, era_for_owner: impl Fn(PlayerId) -> f64)` - migracja wymaga epoki wlasciciela. Stala (np. 1.0) cicho degradowalaby wodzow, wiec nie wpisuje wartosci zastepczej. Typ raportu to LoadMigrationReport (save_migrations), nie MigrationReport - tak jest w kodzie (save_load.rs:31). Zrodlo epoki w produkcji jest NIEROZSTRZYGNIETE - DECISION_REQUIRED dla orkiestratora.

4. (sredni) #[cfg(not(test))] na 3 modulach w mod.rs -> ODRZUCAM jako naprawialne w allowlist; PRZYJMUJE fakt odchylenia od "3 linie pub mod".
   Dowod (wykonany eksperyment): usuniecie 3 linii #[cfg(not(test))] i `cargo test --lib --no-run` -> EXIT=101, 9 bledow: 3x E0432 unresolved import `civ_engine`, 1x E0432 unresolved import `crate::events`, 5x E0433 cannot find module or crate `civ_engine` (save_load.rs:35-50 gałąź #[cfg(test)] uzywa `civ_engine::`). Podwojne importy cfg(test)/cfg(not(test)) w save_load.rs sa dlugiem wczesniejszym (plik zawarty w testach integracyjnych przez #[path]), nie wprowadzonym w r2. Usuniecie dlugu wymaga przepisania importow w save_load.rs i replay.rs poza allowlista. Eksperyment przywrocony (git checkout), drzewo czyste.

5. (drobny) #[allow(clippy::should_implement_trait)] na ReplayPlayback::next -> ODRZUCAM (zmiana nazwy nie jest dozwolona).
   Dowod: `next` jest publicznym API uzywanym w tests/replay.rs (linie 145, 153, 167, 200, 215, 233) i w domenie (replay.rs:434 `self.next().map(ReplayStep::input)`). Zmiana nazwy lub przeniesienie na Iterator zlamalaby te testy (poza allowlista) i API. Modul replay.rs nie byl wczesniej kompilowany w crate (brak `pub mod replay` w mod.rs), wiec clippy -D warnings nigdy go nie sprawdzal; allow jest najmniejsza zmiana, ktora przechodzi bramke. Komentarz nad allow wyjasnia powod.

6. (drobny) Slaba asercja raw.to_string().contains("is_general") -> PRZYJMUJE, poprawka.
   Poprawka: usunieta asercja contains oraz import serde_json::Value (nieuzywany). Kontrola raw_loaded (`generals(&raw_loaded) == [10,11,12,20]` po surowym from_str) pokazuje, ze flagi wodzow sa w zapisie przed migracja i nie sa zdegradowane przez surowa deserializacje. Asercje po migracji (demoted [12], generals [10,11,20], len 4) bez zmian; nic nie oslabione.

## Podsumowanie dla orkiestratora
- Do decyzji: (a) zrodlo epoki wlasciciela w produkcji (punkt 3); (b) dlug replay/ReplayLog snapshot bez migracji (punkt 1); (c) dlug cfg/import w save_load.rs i replay.rs (punkt 4).
- Kod operatora r2 (75c390866) pozostaje bez zmian poza dwoma poprawkami z punktu 1 (komentarz) i 6.

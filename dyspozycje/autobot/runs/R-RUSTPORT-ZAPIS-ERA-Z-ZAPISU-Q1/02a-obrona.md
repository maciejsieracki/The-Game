STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-ZAPIS-ERA-Z-ZAPISU-Q1 (poz. 6, epoka gracza z danych zapisu)
GOAL: Obrona Operatora r1 wobec zarzutów Evaluatora. Odpowiedź na każdy zarzut: PRZYJMUJĘ (poprawka + dowód + commit) albo ODRZUCAM (dowód).
ZMIANY/COMMIT: kod obrony 62bd6b651 (baza: f558c4467, kod r1; baza tematu fdd24d04a). Gałąź lokalna R-RUSTPORT-ZAPIS-ERA-Z-ZAPISU-Q1-wip/obrona-r1. Nie wypchnięto. Allowlista: save_load.rs, p6_zapis_era_zapisu.rs, p6_zapis_migracje_snapshot_load.rs (zmiana nazwy metody testowej, dotknięty test zapisu). Cargo.lock nie commitowany.
TESTY: (wszystko z rust-port/engine, CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo)
  - cargo fmt --check: EXIT 0 (po cargo fmt, który poprawił formatowanie moich zmian)
  - cargo clippy --all-targets -- -D warnings: EXIT 0
  - cargo test --lib: 28 passed, EXIT 0
  - cargo test --test p6_zapis_era_zapisu --test p6_zapis_loader_migrate --test p6_zapis_migracje_snapshot_load: 8 + 4 + 10 passed, EXIT 0 (era_zapisu liczy teraz 8 testów, w tym nowy human_era_survives_reload_through_gracze_roundtrip)
  - NIE_ZMIERZONO: negatywna kontrola nowego testu (czy padnie przed poprawką). Nie uruchamiano.
BLOKADY: brak nowych. Pozostają jawnie: fallback człowieka bez epoki = newGameParams.epochId (odchylenie od weba, udokumentowane); komentarze poza allowlistą (patrz zarzut 4); legacy `gracz` nieobsługiwany (zarzut 5).
RUNDY: 1/5 (obrona w rundzie 1)
NASTĘPNY KROK: Evaluator r2 na 62bd6b651, potem Final Control. Orkiestrator decyduje o integracji.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

1. Epoka ludzi tracona przy zapisie i ponownym odczycie. PRZYJMUJĘ. Poprawka w 62bd6b651: pole `gracze: Option<Value>` (rename "gracze", pomijane gdy None) w SaveSnapshot; konstruktor `new` ustawia None; deserializacja przekazuje surowe `wire.gracze` przez `with_gracze`. Derived Serialize przepisuje `gracze` bez zmian, więc epoka człowieka przeżywa zapis i odczyt. `owner_eras` nadal `serde(skip)` (wyprowadzane przy odczycie). Test: `human_era_survives_reload_through_gracze_roundtrip` (era 3 z `gracze`, ponowny zapis zawiera `gracze`, drugi odczyt daje epokę 3 i brak zmian w migracji). Epoka AI przeżywała już wcześniej przez meta.extra (test epoch_survives_reload_through_meta_roundtrip).

2. Fallback dla człowieka bez wpisu w `gracze` odbiega od weba. ODRZUCAM (bez zmiany kodu). Zarzut sam stwierdza, że odchylenie jest opisane, a kryterium dispatchu wymaga "udokumentowanego domyślnego wyniku + wpisu w raporcie", nie zgodności z webem w tym przypadku. Dowód: komentarz ODCHYLENIE przy `SaveMeta::start_era_fallback` (save_load.rs) oraz blokada w 01-operator-r1.md.

3. `migrate_on_load_with_era_override` jest pub bez cfg(test). PRZYJMUJĘ. Zmieniono nazwę na `migrate_on_load_with_era_override_for_test` (62bd6b651), nazwa wskazuje test. Nie użyto `#[cfg(test)]`, bo testy w tests/ są osobnymi crate'ami i nie widziałyby metody. Produkcyjna ścieżka: `migrate_on_load()` i `load_save_snapshot(text)` bez parametru epoki (kryterium 1 spełnione).

4. Komentarze w replay.rs:37-38 i save_migrations.rs:13 mogą być nieaktualne. PRZYJMUJĘ jako stwierdzenie, NIE poprawiono (poza allowlistą, zgodnie z dispatchem). Stan faktyczny: replay.rs:37-38 mówi o "otwartym długu" wymagającym decyzji o źródle epoki, a źródło już istnieje (dane zapisu). save_migrations.rs:13 mówi "Epoka wlasciciela jest dostarczana przez wywolujacego", co jest nieaktualne. Rekomendacja: osobny drobny temat dokumentacyjny albo wpis w rejestrze.

5. Pojedynczy legacy `gracz` nieobsługiwany. ODRZUCAM (poza zakresem). Web V3 zapisuje `gracze` (gra/src/game/save.ts:371, `gracze: Array<[number, GraczSaveV3]>`). Pole `gracz` (save.ts:367, 390) to starszy format, "tylko gracz 0", a w nagłówku zapisu (save.ts:57) jest opisane jako OPTIONAL i zostawiane undefined. Dispatch wymaga obsługi `gracze`, nie `gracz`.

6. Odtworzone bramki. PRZYJMUJĘ jako potwierdzenie. Wyniki powyżej, na 62bd6b651. Brak `#[ignore]`, brak osłabionych asercji. Zmiana formatu w test file jest wyłącznie formatowaniem z cargo fmt.

## Sprzątanie
- CARGO_TARGET_DIR usunięty po bramkach (w scratchpad), Cargo.lock nie commitowany.
- Gałąź lokalna wip zapisana, bez push.

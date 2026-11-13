# 02a-obrona — R-RUSTPORT-P6-SAVE-LOAD-MIGRACJE-ROZPOZNANIE-Q1 (runda 2, obrona Operatora)

STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS (rozpoznanie, bez kodu)
TEMAT: R-RUSTPORT-P6-SAVE-LOAD-MIGRACJE-ROZPOZNANIE-Q1
GOAL: Odpowiedź na 9 zarzutów Evaluatora r1; poprawka dokumentu rozpoznania tam, gdzie zarzut był trafny.
BAZA: `e94867080` (detach w worktree, wg dispatchu rundy 2). Dokument poprawiony: `dyspozycje/rust-port/p6/R-RUSTPORT-P6-SAVE-LOAD-MIGRACJE-ROZPOZNANIE-Q1-ROZPOZNANIE.md`.
ZMIANY/COMMIT: tylko dokumenty (allowlista); SHA commitu podany w raporcie końcowym orkiestratora (patrz sekcja „SHA”).
TESTY: NIE DOTYCZY (brak kodu; cargo nie uruchamiano). Sprawdzono: `git grep` / `git show 07d2fbd72:...` na pinie, linie podane przy każdym dowodzie.
RUNDY: 2/5

## Odpowiedzi na zarzuty

1. **PRZYJMUJĘ.** Trafne: `rust-port/engine/src/domain/improvement_build.rs:305` (`is_legacy_farm_on_forest_layer`) i `:313` (`strip_legacy_farm_on_forest`) istnieją, z testem `rust-port/engine/tests/p6_m16_rules.rs:55,63`. Brakuje wpięcia w `migrate_loaded_state`. Zakres T5 zredukowany do wpięcia; status w §2/§3 zmieniony na CZĘŚCIOWO. Poprawka w dokumencie (§3, §5 pkt 6, §6 T5).

2. **PRZYJMUJĘ.** `rust-port/engine/src/domain/map_snapshot.rs:318` (`serialize_map_for_save`) i `:613` (`is_valid_map_snapshot`) potwierdzone. Status `mapSnapshot` zmieniony na CZĘŚCIOWO (port domeny JEST, brak pola w kopercie `SnapshotWire`). Poprawka §2a.

3. **PRZYJMUJĘ (sformułowanie).** Twierdzenie „0 odczytów w Rust” było za mocne. Potwierdzone: `domain/eliminacja.rs:4-26` (jawne wejście `wyeliminowani`), `domain/brake_inputs.rs:178`, `domain/war_turn_forced.rs:81`. Prawdziwe pozostaje tylko to, że w modułach zapisu `save_load.rs`/`save_migrations.rs` klucz `eliminatedOwners` jest passthrough (0 trafień). Poprawka §2b.

4. **PRZYJMUJĘ.** Liczba była błędna. `git grep` w `rust-port` daje 5 trafień `rally_points`/`rallyPoints` w `domain/pathfinding.rs` (linie 1573, 1574, 1605, 1681, 1682), plus testy `tests/p6_4_rally.rs`. Poprawka §2a (status CZĘŚCIOWO).

5. **PRZYJMUJĘ (częściowo).** Kryterium 1 nie jest spełnione w całości: §2b opisuje klucze `meta` zbiorczo, bez linii per klucz, a pełna tabela per-klucz nie była zrobiona w tej rundzie. Dodana nota w §8 i zaznaczona jako NIE_ZMIERZONO do rundy wykonawczej. Liczba 93 (grep `^\s+ident:` w `main.ts:37253-37440`) jest tylko przybliżeniem i NIE jest liczbą kluczy meta (zawiera klucze zagnieżdżone). Nie podaję jej jako wyniku.

6. **PRZYJMUJĘ (korekta ścieżki), ODRZUCAM (wynik).** Ścieżka w dokumencie była błędna: pin nie ma `gra/src/battleScene.ts`. Poprawna: `gra/src/battle/battleScene.ts:721` (`const MAX_PER_SIDE = 500`) i `:723` (`export const BATTLE_MAX_PER_SIDE = MAX_PER_SIDE`). Wartość 500 zgodna z Rust `ARMY_STACK_LIMIT = 500` (`save_migrations.rs:221`). Status tej pozycji: zmierzone, TAK. `main.ts:4358-4359` to funkcja `armyStackLimit()`, nie stała — dopisane. NIE_ZMIERZONO usunięte dla wartości limitu.

7. **PRZYJMUJĘ.** Dokument podawał NIE_ZMIERZONO dla wszystkich tematów bez cytowania szacunku planu. Dodany szacunek planu: `dyspozycje/rust-port/PLAN-PORT-RUST-TAURI-20261020.md` §0c poz. 8 (wiersz 108) podaje „2–3” rundy dla CAŁEJ pozycji (T1–T6 i `forcedWarWavesByPairKey`). Zaznaczone wyraźnie jako szacunek planu, nie pomiar Operatora. Per-temat nadal NIE_ZMIERZONO.

8. **PRZYJMUJĘ.** Rekomendacja D1=C była opinią bez wyceny. Oznaczona jako opinia Operatora; koszty A/B/C NIE_ZMIERZONO; jedyne liczby osadzone to 11 wierszy BRAK w §2a (w tym `explored`/`gracz` odrzucane celowo). T4 nie wyceniony. Decyzja należy do właściciela.

9. **PRZYJMUJĘ.** Komentarze Rust cytują `main.ts:46701` (autoBuild) i `:46706` (playerEpochWarEnabled). Pin `07d2fbd72` ma te odczyty pod `main.ts:47163` i `:47190` (zweryfikowane `git show`). Dryf opisany w §8 dokumentu. Same komentarze w kodzie NIE poprawiane (`save_load.rs:303,309`, `tests/p6_zapis_migracje_meta_flags.rs:2-3`, `tests/p6_zapis_migracje_snapshot_flags.rs:3`) — poza allowlistą tej rundy; do osobnego tematu.

## Stan po obronie (co zmieniło się w dokumencie)

- Pozycje ze statusem zmienionym na CZĘŚCIOWO: `mapSnapshot`, `rallyPoints`, `eliminatedOwners` (i wiersz migracji farm-na-lesie).
- Zakres T5 zredukowany (wpięcie zamiast portu).
- Limit stosu 500: zmierzony, zgodny z pinem.
- Dodane: nota o kryterium 1, nota o dryfie numeracji, szacunek planu dla rund.

## Nadal otwarte (nie zamknięte w tej rundzie)

- Pełna tabela kluczy `meta` per klucz (kryterium 1) — NIE_ZMIERZONO.
- Decyzje D1, D2, D3 — wymagają właściciela (ABC), bez zmian.
- Komentarze dryfu w kodzie Rust — poza allowlistą.

## BLOKADY

Brak blokad technicznych. Decyzje D1–D3 nadal wymagają właściciela (jak w r1).

## NASTĘPNY KROK

Evaluator r2: weryfikacja poprawek w dokumencie rozpoznania i powyższych odpowiedzi. Orkiestrator: pytania ABC D1–D3 do właściciela.

## DEPLOY/PUSH

NIE WYKONANO (Operator nie pushuje; push tylko po autoryzacji orkiestratora).

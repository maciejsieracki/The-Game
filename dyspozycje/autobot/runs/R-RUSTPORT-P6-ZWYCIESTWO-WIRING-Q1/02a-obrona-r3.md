# 02a-obrona — R-RUSTPORT-P6-ZWYCIESTWO-WIRING-Q1, runda r3 (obrona Operatora na zarzuty Evaluatora r3)

STATUS: DEFENSE (bez zmian kodu w tej rundzie)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZWYCIESTWO-WIRING-Q1 (P6.19-C)
BAZA OBRONY: `948d7364a` (kod r3). Worktree odłączony na `948d7364a`, bez nowych zmian w kodzie.
Zakres: odpowiedź na 6 zarzutów z 02-evaluator-r3.md (cda17a25c). Dowody: `git show 948d7364a:<ścieżka>`, pin `git show 07d2fbd72:gra/src/main.ts`.
Ograniczenie: dysk wolny 913 MB (bramka ≥ 8 GB), więc `cargo` NIE był uruchamiany w tej obronie. Wszystkie twierdzenia poniżej są z odczytu kodu i pina, nie z testu. Oznaczono to tam, gdzie ma znaczenie.

## Zarzut 1 (BLOKUJĄCY, kryterium 4): PRZYJMUJĘ

Fakt: `p6_stan_ulepszenia::new_fields_roundtrip_and_default_is_omitted` (tests/p6_stan_ulepszenia.rs:270) pada, a na bazie `0ca58770e` przechodził. Regresja pochodzi z r2 (`gracz_kiedys_mial_miasto` z `#[serde(skip)]`, playable.rs ok. 525), nie z r3.

Mechanizm: `base_state()` buduje stan przez `PlayableGame::new`, które ustawia flagę `true` (miasto gracza, playable.rs:768). Po `serde_json` roundtripie `#[serde(skip)]` daje `false`, a derive `PartialEq` na `PlayableState` widzi różnicę. Test wymaga równości po roundtripie.

Dlaczego nie da się tego zamknąć w r3 bez decyzji:
- Test leży poza allowlistą r3, a `save_load.rs` jest zakazany. Poprawki w teście nie wolno (to osłabienie asercji).
- Pin nie zapisuje flagi i odtwarza ją przy wczytaniu ze miast (main.ts:46368-46370). Asercja testu zakłada więc zachowanie, które pin ma, a Rust nie ma, bo brakuje ścieżki odtwarzania.

Warianty (dla orkiestratora):
- (a) Ręczne `PartialEq` ignorujące flagę. NIE rekomenduję: ukrywa semantykę pola w równości.
- (b) `#[serde(default)]` bez `skip`. NIE rekomenduję: flaga trafiłaby do JSON, czego pin nie robi, i może zmienić golden `p6_unit_replace_l3_state`.
- (c) Osobny temat: produkcyjne wczytanie `PlayableState` odtwarza flagę ze miast, plus zmiana allowlisty w tym teście. Zgodne z pinem, ale poza zakresem r3 (decyzja B).
- (d) NOWY, w allowliście r3: w `playable.rs` przez `#[serde(from = "...")]` z lustrzanym DTO. Przy deserializacji flaga = `flaga zapisana || istnieje miasto HUMAN_PLAYER_ID`, co odpowiada pinowi main.ts:46368-46370. Test przechodzi bez zmiany testu i bez zmiany JSON. Koszt: ok. 60 linii lustrzanego DTO w `playable.rs`, ryzyko rozjazdu DTO z struktura. Rekomenduję (d), a jeśli orkiestrator odrzuci, to (c).

Status: NIE naprawiono w r3. Wariant (d) wymaga kompilacji i pełnego `cargo test`, a dysk na to nie pozwala. Wymaga decyzji orkiestratora i gate dyskowego.

## Zarzut 2 (uwaga): PRZYJMUJĘ jako konsekwencję zarzutu 1

`odtworz_flage_zwyciestwa_ze_miast` jest `#[cfg(test)]` (playable.rs:567) z komentarzem o braku produkcyjnej ścieżki wczytania. To wynik decyzji r3 pkt 6 z dispatchu (albo usunąć, albo oznaczyć `cfg(test)`), więc zgodne z dispatchem. Problem wczytania to zarzut 1.

## Zarzut 3 (uwaga): PRZYJMUJĘ część, ODRZUCAM implikację

Dowody z pina (`grep -n gameOver` w `gra/src/main.ts` na `07d2fbd72`):
- Bramki odrzucające koniec tury: 37997 (`if (gameOver) console.warn('[EndTurn] blocked: gameOver')`) i 38043 (`showHintMessage('Gra zakonczona...')`). Rust odrzuca `advance_turn` (playable.rs:1105-1108, `GameAlreadyOver`), co jest zgodne z pinem.
- Pin 43827 NIE jest bramką odrzucania komendy. To warunek sprzątania kolejki bitew (`healStuckDeferredPreBattleQueueOnEndTurnAttempt`) w obsłudze próby zakończenia tury. Dispatch błędnie wymienia go wśród bramek odrzucania. Dlatego nie trzeba go odwzorowywać w `move_unit`, `select_unit` ani `replace_unit`.
- W pinie nie ma żadnej bramki `gameOver` w obsłudze ruchu, wyboru ani zamiany jednostki. Rust też ich nie odrzuca, więc zachowanie jest zgodne z pinem.
- Zarzut "pin 43827 nie został zweryfikowany" jest rozwiązany tym odczytem: to nie bramka odrzucania.

## Zarzut 4 (uwaga, możliwa rozbieżność): PRZYJMUJĘ jako ryzyko, NIE_ZMIERZONO

Pin (main.ts:43448-43460): `allOwners = {0} ∪ {u.ownerId >= 0 : units} ∪ {c.ownerId >= 0 : cities}`, a `potegiWszystkich` to moc tych właścicieli.

Rust (turn_war_inputs.rs:805-826, `all_owner_ids`): `state.players` ∪ właściciele miast. Mocy nie ma dla właściciela bez miast i bez jednostek, który jest w `players`. Dla takiego właściciela Rust może dać niezerową moc (składniki tech/religia/magazyny), której pin nie dodaje. Wtedy suma w `potegiWszystkich` i udział `powerShare` się rozjeżdżają.

Zakres: rozbieżność dotyczy tylko właściciela z `players` bez jednostek i miast. Eliminowani właściciele są czyszczeni (`power_clear_eliminated_owner`, playable.rs:598, temat #114), co ogranicza ryzyko. Nie zmierzono tego na żadnym scenariuszu, bo nie uruchomiono testu.

Propozycja poprawki (nie wykonana, bo bez bramki kompilacji): w `victory_power_inputs` (playable.rs:1276-1305) zawęzić zbiór do `{0} ∪ właściciele jednostek ∪ właściciele miast` przed budową `powers`. To mała zmiana w allowliście r3. Należy ją zrobić razem z gate'em dyskowym.

## Zarzut 5 (uwaga): ODRZUCAM, równoważne

`PlayableGame::new` (playable.rs:748-768) buduje `cities` jako stały literał z dwoma miastami właściciela `HUMAN_PLAYER_ID` (linie 750 i 759). Flaga startowa `cities.iter().any(owner == HUMAN)` jest więc zawsze `true`, czyli odpowiada pinowi, który dodaje `HUMAN_OWNER_PRIMARY` (main.ts:45646, scenariusz playtest). Nie ma ścieżki konstruktora bez miasta gracza, więc rozjazdu nie ma w obecnym kodzie.

## Zarzut 6 (uwaga): PRZYJMUJĘ jako lukę testową

Prawda: test błędu sprawdzenia zwycięstwa dowodzi tylko jednej przyczyny (nieznana epoka). Zachowanie "log i kontynuacja tury" (playable.rs:1146, `eprintln`, bez cofania stanu) jest zgodne z pinem (try/catch, console.error). Brakuje testu dla drugiej przyczyny błędu z `victory_power_inputs` (np. błąd mocy właściciela). Dodanie testu wymaga edycji `p6_victory_wiring.rs` (w allowliście) i kompilacji, więc nie wykonano w tej obronie.

## Podsumowanie

- PRZYJMUJĘ: zarzut 1 (blokujący, wymaga decyzji A/B/C/D), 2 (konsekwencja 1), 4 (ryzyko, NIE_ZMIERZONO, propozycja zawężenia zbioru), 6 (luka testowa).
- PRZYJMUJĘ część / ODRZUCAM implikację: zarzut 3 (43827 nie jest bramką odrzucania; move/select/replace zgodne z pinem).
- ODRZUCAM: zarzut 5 (flaga startowa zawsze `true`, konstruktor ma stały literał z miastem gracza).
- Kod r3 (`948d7364a`) nie został zmieniony w tej obronie. Kryterium 4 pozostaje NIESPEŁNIONE do decyzji orkiestratora o wariancie naprawy zarzutu 1.
- Zielone bramki r3 (fmt, clippy, lib 114, victory_wiring 10) są z raportu Operatora r3 i nie zostały powtórzone w tej obronie (brak dysku).

## Rekomendowana decyzja orkiestratora

1. Zarzut 1: wariant (d), a przy odrzuceniu (c). Wdrożenie w osobnej rundzie r4 po zwolnieniu dysku do ≥ 8 GB, z pełnym `cargo test --no-fail-fast`.
2. Zarzut 4: dodać zawężenie zbioru `potegiWszystkich` do właścicieli z jednostką lub miastem w tej samej rundzie r4, z wektorem dla właściciela bez miast i jednostek.
3. Zarzut 6: test drugiej przyczyny błędu w tej samej rundzie r4.

## Dla orkiestratora: co wymaga decyzji i co zrobić

- Dispatch r3 pkt 3 i pin 43827 wymieniają tę bramkę jako odrzucanie komend. Poprawić wpis w dispatchu (to nie bramka odrzucania).
- Commit obrony nie zawiera zmian w kodzie ani w `Cargo.lock`.

NASTĘPNY KROK: decyzja orkiestratora (wariant zarzutu 1 i zakres r4); dysk ≥ 8 GB przed każdym cargo.
DEPLOY/PUSH: NIE WYKONANO (push zakazany dispatchem; brak push).

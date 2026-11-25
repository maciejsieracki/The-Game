# R-RUSTPORT-P4-SAVE-LOAD-BRIDGE-Q1: Obrona Operatora r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-SAVE-LOAD-BRIDGE-Q1 (zadanie #375)
GOAL: komendy mostu `SaveGame`/`LoadGame`, produkcyjny wołający zapisu i odtworzenia `PlayableGame` (U1), `active_seat` (U5), E2E bajt w bajt.
ZMIANY/COMMIT: gałąź lokalna `rust-port-wip/save-load-bridge-q1-obrona`, baza = raport Evaluatora `f2136ff8d` (nad kodem Operatora `318f77c0b`, ten nad `ee1ceda3e`). Commit testów i komentarza: `d53a6a2ba`; commit z tym raportem: SHA w wyniku Workflow.
TESTY: sekcja Bramki.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Final Control (`03-final-control.md`).
DEPLOY/PUSH: NIE WYKONANO.

## Odpowiedzi na zarzuty

| # | Zarzut | Odpowiedź | Dowód |
|---|---|---|---|
| Z1 | Werdykt PASS-WITH-NOTES, raport `02-evaluator.md` (`f2136ff8d`) | PRZYJMUJĘ | Obrona zbudowana na `f2136ff8d`, raport Evaluatora jest w historii tej gałęzi. |
| Z2 | Bramki Evaluatora EXIT 0, allowlista, brak `#[ignore]` | PRZYJMUJĘ (bez zmian) | Powtórzone po zmianach obrony, sekcja Bramki. |
| Z3 | Żywa sesja kontra wczytana: bajt w bajt | PRZYJMUJĘ (bez zmian) | Wynik pozytywny Evaluatora, nic do poprawy. |
| N1 | Luki testów: E05, E06, E08, E09 przeżyły | **PRZYJMUJĘ: 6 nowych testów** (`d53a6a2ba`) | Mutanty powtórzone tym samym skryptem: E05, E06, E06b (`marchStopDetail`), E08, E09 **ZABITE** (tabela niżej). |
| N1a | Pozostałe mutanty (E01/E07, E02, E03, E16) równoważne lub redundantne | PRZYJMUJĘ ocenę | Para E01+E07 jest chroniona łącznie (M20 i asercje dziennika). E02 i E03 dotyczą pól `serde(skip)`. E16: `rng` snapshotu jest tylko dokumentacyjny (D-SLB-3). |
| N2 | DL-SLB-3 opisany nieściśle | **PRZYJMUJĘ: dług zawężony + test** | `siegeTurnByCity` jest w `SIEGE_RAW_META_KEYS` (`war_turn_state.rs:84-85`), czyli surowo w `war.opaque`, a `war` idzie przez `state.war` snapshotu. Test `surowy_licznik_tur_oblezenia_w_war_opaque_przezywa_zapis` pokazuje, że klucz przeżywa zapis i nie trafia do ciała. Zostaje tylko: brak typowanego pola i brak producenta. `next_siege_turn` (`siege_turn.rs:56`) nie ma wołającego produkcyjnego (grep: wołania tylko w dokumentacji `siege_surrender.rs:154`). Nowy opis: DL-SLB-3 niżej. |
| N3 | `activeHumanOwnerId: 0` daje `PlayerId(0)`, nieistniejący fotel | **PRZYJMUJĘ jako opis długu (bez zmiany kodu)** | Format Rust zawsze zapisuje id ≥ 1 (`save_snapshot`: `self.fog.active_seat.get()`, fotel główny = `HUMAN_PLAYER_ID` = 1, `playable.rs:44`). Wartość 0 może przyjść tylko z zapisu webowego albo ręcznie zmienionego. W webie 0 = `HUMAN_OWNER_PRIMARY` (`player.rs:16`, `human-owners.ts:21`). Mapowanie samego 0 → 1 byłoby częściowe: w webie fotele ludzkie to np. `[0, 2, 3]`, więc pełne mapowanie id webowych na id sesji Rust należy do wczytywania zapisów webowych (DL-SLB-4). Dopisane do DL-SLB-4. |
| N4 | Komentarz „ścisły” przy ciele `playable`, brak `deny_unknown_fields` | **PRZYJMUJĘ: komentarz doprecyzowany + test** (`d53a6a2ba`) | Decyzja techniczna D-SLB-9: bez `deny_unknown_fields`, tak samo jak cały `SnapshotWire` (zgodność w przód). `deny_unknown_fields` na `PlayableState` objąłby też DTO mostu, czyli inny kontrakt, więc tego nie robię. Komentarz w `save_load.rs` (pole `SnapshotWire::playable`) mówi teraz: forma znanych pól ścisła, nieznane klucze ignorowane. Test `cialo_sesji_ignoruje_nieznane_klucze_a_zla_forma_znanego_pola_to_blad`. |
| N5 | `player_start_hex_by_owner` przeliczany ze stolicy fotela 1; po utracie stolicy brak zapasowego odsłonięcia | **PRZYJMUJĘ jako dług DL-SLB-7** (NIE_ZMIERZONO) | Pin też nie zapisuje `playerStartHex`: zostaje wartość z pamięci modułu, a po przeładowaniu strony jest liczona od nowa. Parytet po świeżym starcie nie jest rozstrzygnięty. Nie wymyślam reguły. Opis i zakres w tabeli długów. |
| N6 | Zapis wymaga niezmienników `GameStateDto` (populacja ≥ 1); głód niesprawdzony | **PRZYJMUJĘ jako dług obserwacyjny DL-SLB-8**, ryzyko dziś zmierzone grepem | Jedyne produkcyjne zapisy `PlayableCity.population`: `city_capture_apply.rs:1614` (`pop_after`, komentarz `:1556`: wynik ≥ 1), `:1906`/`:1931` (`Math.max(1, …)`) oraz `siege_transfer.rs:363`/`:447` (`surrender_population_after` = `max(1, …)`). `city_growth` działa na własnym stanie i nie pisze do `PlayableCity` (grep `\.population\s*=` w `src/domain`). Głód nie obniża więc dziś populacji sesji. Gdy wzrost lub głód zostanie wpięty, naruszenie da jawny błąd `Projection`, a nie cichą utratę danych. |
| S | Sprzątanie Evaluatora | PRZYJMUJĘ (bez zmian) | Moje targety usunięte po bramkach, sekcja Sprzątanie. |

## Nowe testy (`engine/tests/p4_save_load_bridge.rs`, 25 → 31)

1. `zapis_w_srodku_tury_po_ruchu_nie_niesie_pol_ruchu_ani_powiadomien_w_ciele` (E05, E06): `SelectUnit` i `MoveUnit` w środku tury. Warunek wstępny: `is_moved_by_player_this_turn`. Do tego `marchStopNotified`/`Detail`, zapis i sprawdzenie, że klucze `movedByPlayerThisTurn`/`marchStopNotified`/`marchStopDetail` nie występują w `playable.state`, a po wczytaniu są puste.
2. `wczytanie_czysci_pola_ruchu_wpisane_recznie_do_ciala`: strona wczytania (pin `:46273`, `:46280`). Pola wpisane ręcznie do ciała zapisu są czyszczone przez `restore_playable_planned_marches` (`save_load.rs:1213-1218`).
3. `plany_marszu_filtrowane_po_fotelu_glownym_gdy_aktywny_fotel_jest_inny` (E08): aktywny fotel 2. Plan jednostki fotela 1 przeżywa, plan jednostki fotela 2 jest odfiltrowany (pin `plannedMarchesFromSave(…, 0)`, `:46283`).
4. `miasto_wlasciciela_spoza_graczy_bez_jednostek_nie_blokuje_zapisu` (E09): miasto właściciela 88 bez jednostek. Cywilizacja 88 jest w rzucie, miasta przeżywają zapis.
5. `surowy_licznik_tur_oblezenia_w_war_opaque_przezywa_zapis` (N2).
6. `cialo_sesji_ignoruje_nieznane_klucze_a_zla_forma_znanego_pola_to_blad` (N4): nieznane klucze nie zmieniają stanu wczytanego. `turn: "zla forma"` daje błąd `load_game:`.

## Mutanty obrony (skrypt: podmiana w `playable.rs`, test `p4_save_load_bridge`, przywrócenie oryginału; po skrypcie `git diff` pliku jest pusty)

| # | Mutant | Wynik |
|---|---|---|
| E05 | `body.moved_by_player_this_turn.clear()` usunięte | ZABITY |
| E06 | `body.march_stop_notified.clear()` usunięte | ZABITY |
| E06b | `body.march_stop_detail.clear()` usunięte | ZABITY |
| E08 | plany filtrowane po aktywnym fotelu (`active_human_owner_id`) zamiast `HUMAN_PLAYER_ID` | ZABITY |
| E09 | `owners.extend(cities…owner_id)` usunięte z rzutu | ZABITY |

Razem z wcześniejszymi wynikami: mutanty Operatora 20/20 i Evaluatora 6 zabitych. Teraz wszystkie 4 prawdziwe luki są zamknięte. Zostają tylko równoważne lub redundantne (E01/E07, E02, E03, E16) i jeden nieważny (E13).

## Decyzje techniczne (do `REJESTR-RUST.md`, wpisuje orkiestrator)

- **D-SLB-9:** ciało `playable` jest ścisłe co do formy znanych pól, a nieznane klucze ignoruje (jak `SnapshotWire`). Nie ma `deny_unknown_fields`, bo `PlayableState` jest też DTO mostu.

## Zamknięte / zostaje długiem (aktualizacja tabeli z `01-operator-r1.md`)

| Pozycja | Stan |
|---|---|
| U1, U5, flaga miast | ZAMKNIĘTE (bez zmian) |
| Luki testów E05/E06/E08/E09 | ZAMKNIĘTE (obrona) |
| **DL-SLB-1:** zapis w trakcie bitwy oblężniczej | DŁUG (bez zmian) |
| **DL-SLB-2:** dziennik zdarzeń poza zapisem | zgodne z pinem |
| **DL-SLB-3 (zawężony):** `meta.siegeTurnByCity`. Nośnik zapisu działa (`war.opaque`, test). Brakuje typowanego pola w `PlayableState` i producenta: `next_siege_turn` (`siege_turn.rs:56`) nie ma wołającego produkcyjnego. Dług należy do tematu ticku oblężenia, nie do zapisu. | DŁUG |
| **DL-SLB-4 (uzupełniony):** wczytywanie zapisów webowych, w tym mapowanie id foteli web → sesja Rust. `activeHumanOwnerId: 0` (web `HUMAN_OWNER_PRIMARY`) daje dziś `PlayerId(0)`, nieistniejący fotel sesji. Format Rust nigdy nie zapisuje 0. | DŁUG |
| **DL-SLB-5:** przełączanie fotela w grze (hot-seat) | DŁUG (bez zmian) |
| **DL-SLB-6:** `last_siege_tick` poza zapisem | odnotowane |
| **DL-SLB-7 (nowy, N5):** `player_start_hex_by_owner` nie jest zapisywany i jest przeliczany ze stolicy fotela 1. Po utracie stolicy przed zapisem wczytana gra traci zapasowe odsłonięcie startu (`state.rs:1395`) i `start_reveal_keys_for_river_fog`. Pin też tego nie zapisuje, a parytet po świeżym starcie strony jest NIE_ZMIERZONY. | DŁUG (zbadać w pinie: skąd `playerStartHex` po przeładowaniu) |
| **DL-SLB-8 (nowy, N6):** zapis wymaga niezmienników `GameStateDto` (populacja ≥ 1, niepuste nazwy). Dziś wszyscy produkcyjni pisarze populacji trzymają ≥ 1 (grep wyżej). Przy wpinaniu wzrostu i głodu miast do `PlayableCity` trzeba dodać test zapisu miasta po głodzie. | DŁUG obserwacyjny |
| Klient i Tauri bez wołania `SaveGame`/`LoadGame` | DŁUG (temat klienta) |

## Bramki (po zmianach obrony; `CARGO_TARGET_DIR` w scratchpadzie, `CARGO_INCREMENTAL=0`, bez debug info)

Mierzone na `d53a6a2ba`:

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` (engine) | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` (engine) | EXIT 0 |
| pełny `cargo test --all-targets --no-fail-fast` (w tle, setsid nohup) | **EXIT 0**: 556 bloków, 4307 passed, 0 failed, 1 ignored. U Evaluatora było 4301 passed; doszło 6 nowych testów. `#[ignore]` istniał przed tematem. |
| `p4_save_load_bridge` | 31/31 |

Klient i renderer: nieruszane, bramek nie uruchamiałem (zgodnie z dispatchem).

## Allowlista

Zmienione pliki: `engine/tests/p4_save_load_bridge.rs` (testy), `engine/src/domain/save_load.rs` (tylko komentarz) i ten raport. Nie ruszałem: `gra/`, `src-tauri`, `client`, `renderer`, `view-model`, `Cargo.lock`. Nie dodałem `#[ignore]`. Commity nie mają nazwy modelu.

## Sprzątanie

Target obrony (`scratchpad/slb-obrona-target`) usunięty po bramkach. Skrypt mutantów przywrócił `playable.rs`: `git diff` pliku jest pusty. Wolne po sprzątaniu: 8,6 GB (`df -h /`). Mniej niż u Evaluatora, bo równolegle pracują inne tematy.

# R-RUSTPORT-P4-SAVE-LOAD-BRIDGE-Q1: Evaluator r1 (adwersarialny)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-SAVE-LOAD-BRIDGE-Q1 (zadanie #375)
GOAL: komendy mostu `SaveGame`/`LoadGame`, produkcyjny wołający zapisu i odtworzenia `PlayableGame` (U1), `active_seat` (U5), E2E bajt w bajt.
ZMIANY/COMMIT: oceniany kod `318f77c0b` (gałąź `rust-port-wip/save-load-bridge-q1`). Baza `ee1ceda3e` jest przodkiem (`merge-base --is-ancestor` = tak). Evaluator nie zmienia kodu, dodaje tylko ten raport.
TESTY: sekcja Bramki.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Obrona (`02a-obrona.md`), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO.

## Bramki odtworzone przez Evaluatora (na `318f77c0b`)

Warunki: `CARGO_TARGET_DIR` poza repo (w scratchpadzie, po bramkach usunięty), `CARGO_INCREMENTAL=0`, bez debug info.

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` (engine) | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` (engine) | EXIT 0 |
| pełny `cargo test --all-targets --no-fail-fast` (w tle, setsid nohup) | **EXIT 0**: 556 bloków, 4301 passed, 0 failed, 1 ignored (ten `#[ignore]` istniał przed tematem) |
| `p4_save_load_bridge` | 25/25 |
| `bridge_contract` | zielony |
| `git diff --check ee1ceda3e..318f77c0b` | czysto |

Uzupełnienie raportu Operatora: Operator nie powtórzył pełnego przebiegu po ostatniej zmianie testu (NIE_ZMIERZONO). Evaluator go wykonał i przebieg jest zielony.

Klient: `client/src` i `client/tests` nie mają wyczerpującego `match` na `EngineCommand` ani literału `BridgeResponse`. `src-tauri` woła tylko `EngineBridge::handle`. Nowe warianty i pole `save_game` nie psują więc buildu klienta ani Tauri. Bramek klienta i renderera nie uruchamiałem, zgodnie z dispatchem.

## Allowlista i zakazy

- Zmienione pliki: `engine/src/bridge.rs`, `engine/src/domain/save_load.rs`, `engine/src/domain/playable.rs`, `engine/tests/bridge_contract.rs`, nowy `engine/tests/p4_save_load_bridge.rs` i `01-operator-r1.md`. Wszystkie są w allowliście.
- Nie ruszono: `gra/`, `src-tauri`, `client`, `renderer`, `view-model`, `Cargo.lock`, `mod.rs`.
- Sekcja „Pliki spoza allowlisty”: pusta. D-SLB-7 uzasadnia, dlaczego `mod.rs` zostaje bez zmian.
- Brak nowych `#[ignore]`, brak osłabionych asercji (`bridge_contract` tylko rozszerzony do 18 wariantów), brak nazw modeli w commitach (jest tylko `Claude-Session:`).
- `playable.rs`: dispatch dopuszcza tam „tylko pola/restore”. Doszedł blok `save_snapshot`/`from_save_snapshot`/projekcja, czyli ścieżka zapisu i odtworzenia stanu. Mieści się w intencji GOAL (punkt 1 i U1), więc nie ma zarzutu.

## Weryfikacja pinu `07d2fbd72` (git show `gra/src/main.ts`)

- `buildSaveGameSnapshot` (`:37171`) zapisuje: `seed` (`:37236`), `units`/`cities`, `exploredByHuman`, `humanOwnerIds`, `activeHumanOwnerId` (`:37242`), `autoMarch`/`plannedMarches`, a w `meta` `placedWorldWonders` i `siegeTurnByCity` (`Array.from(siegeTurnByCity.entries())`, ok. `:37291`). Zgadza się z raportem Operatora.
- `restoreGameFromSave`: `plannedMarchesFromSave(…, units, 0)` (`:46283`) filtruje plany po właścicielu 0, czyli fotelu głównym, a nie po aktywnym fotelu. Rust woła `restore_planned_marches(&mut state, HUMAN_PLAYER_ID)`, więc jest zgodność.
- `playerEverOwnedCityByOwner` jest odbudowywany z miast dla `saved.humanOwnerIds` (`:46368-46370`). Rust robi to w `odtworz_flage_zwyciestwa_ze_miast`: fotel główny i pozostali ludzcy gracze. Zgodne.
- `humanSeats.activeHumanOwnerId = saved.activeHumanOwnerId` (`:46379-46382`) i odtworzenie mgły (`:46385-46411`) mają odpowiedniki w Rust.

## Testy adwersarialne Evaluatora

Pisałem je w tymczasowym pliku `tests/zz_eval_slb.rs`, który usunąłem po pomiarze. Nie jest w commicie.

1. **Żywa sesja bez przeładowania i sesja wczytana.** Test Operatora `kolejne_komendy_…` przed porównaniem przeładowuje też sesję źródłową, więc nie sprawdza ciągłości żywej gry. Dlatego dodałem dwa scenariusze:
   - oblężenie (`siege_state(11)`: wojna, `oblegane`, machiny): 1 tura, potem zapis, potem 4 × (`AdvanceTurn`, `GetRenderLayers`, `GetRenderFrame`);
   - gra startowa: zaznaczenie, marsz wieloturowy i warstwy, potem zapis, potem 5 × `AdvanceTurn`.

   Porównywałem odpowiedzi (z pominięciem pól, których pin nie zapisuje: zaznaczenia, `marchStop*`, `movedByPlayerThisTurn`, `captureEvents`) oraz tekst `SaveGame` po każdej turze. **Oba scenariusze są zgodne bajt w bajt (PASS).**
2. `LoadGame` z `"{}"` i z tekstem, który nie jest JSON: błąd z prefiksem `load_game:`, sesja nietknięta (PASS).
3. Brak `siegeBattlesStarted` w ciele: wczytanie przyjmuje 0 (PASS).
4. **`activeHumanOwnerId: 0`** (w webie to fotel główny): Rust ustawia `active_seat = PlayerId(0)`, czyli fotel, który nie istnieje. Zapytania i tura nie padają. Uwaga N3.
5. Nieznany klucz w `playable.state` jest przyjmowany. Opis „odczyt ścisły” w `save_load.rs` jest więc nadmiarowy: zła forma znanych pól daje błąd, nieznane klucze są ignorowane. Uwaga N4.

## Mutanty Evaluatora (16, każdy osobno: `p4_save_load_bridge` + `bridge_contract` + testy z punktu wyżej)

| # | Mutant | Wynik | Ocena |
|---|---|---|---|
| E01 | `from_save_snapshot` nie czyści `capture_events` | przeżył | redundancja: zapis już je czyści (E07). Para E01+E07 jest chroniona tylko łącznie |
| E02 | brak `koniec_gry = None` | przeżył | **równoważny**: pole ma `#[serde(skip)]` |
| E03 | brak resetu `gracz_kiedys_mial_miasto`/`player_ever_owned_city` | przeżył | **równoważny**: pola nie są serializowane |
| E04 | `march_attack_targets` zostają w ciele | zabity | |
| E05 | `moved_by_player_this_turn` zostaje w ciele | **przeżył** | **luka testu**: scenariusze zapisują po `AdvanceTurn`, kiedy zbiór jest już pusty. Pin czyści go przy wczytaniu (`:46280`) |
| E06 | `march_stop_notified` zostaje w ciele | **przeżył** | **luka testu** jak w E05 (pin `:46273`) |
| E07 | `capture_events` zostają w ciele | przeżył | redundancja z E01 |
| E08 | plany marszu filtrowane po aktywnym fotelu zamiast po fotelu 1 | **przeżył** | **luka testu**: kod zgadza się z pinem (`…, 0)`), ale żaden test nie łączy fotela ≠ 1 z planami |
| E09 | właściciel miasta spoza graczy nie trafia do cywilizacji rzutu | **przeżył** | **luka testu**: M19 Operatora pokrywa tylko właściciela jednostki. Bez tej linii zapis miasta należącego do właściciela spoza `players` i bez jednostek padłby na `UnknownCityOwner` |
| E10 | flaga miast nie odbudowana | zabity | |
| E11 | mgła nie odtworzona | zabity | |
| E12 | fotel 2 odrzucany | zabity | |
| E13 | `SaveGame` emituje zdarzenie | błąd kompilacji (mutant nieważny; M13 i asercja `events.is_empty()` w `save()` pokrywają to zachowanie) | |
| E14 | zły zapis podmienia grę na nową | zabity | |
| E15 | wojna brana z ciała zamiast z `state.war` | zabity | |
| E16 | `rng` snapshotu = `from_seed(0)` | przeżył | **równoważny** wg D-SLB-3: pole tylko dokumentacyjne, nic go nie czyta |

Podsumowanie: 6 zabitych, 1 nieważny, 5 równoważnych lub redundantnych (E01, E02, E03, E07, E16) i **4 prawdziwe luki testów (E05, E06, E08, E09)**. Kod w tych gałęziach jest poprawny i zgodny z pinem. Brakuje tylko testów, które by go pilnowały. Licząc mutanty Operatora (20/20) z moimi, kryterium „mutanty ≥ 12” jest spełnione.

## Uwagi (do Obrony lub kolejnej rundy; żadna nie blokuje)

- **N1 (testy, do uzupełnienia):** dodać testy zabijające E05/E06 (zapis w środku tury po `MoveUnit`, sprawdzenie, że `movedByPlayerThisTurn` i `marchStopNotified` nie trafiają do ciała zapisu), E08 (fotel 2 i plan jednostki fotela 1: plan przeżywa) oraz E09 (miasto właściciela spoza `players` i bez jednostek: zapis działa).
- **N2 (DL-SLB-3 nieścisły):** pin zapisuje `meta.siegeTurnByCity` (`buildSaveGameSnapshot`, ok. `main.ts:37291`) i odczytuje go w `:47266`. W Rust klucz `siegeTurnByCity` należy do zarządzanych kluczy `war` (`war_turn_state.rs:85`, surowe `war.opaque`, zob. `city_capture_apply.rs:1698`), a `war` przechodzi przez `state.war` snapshotu. Dług można zawęzić do „brak typowanego pola i testu”. NIE_ZMIERZONO, czy któryś producent dziś wpisuje ten klucz.
- **N3 (D-SLB-5):** `activeHumanOwnerId: 0` daje `PlayerId(0)`, nieistniejący fotel. Format Rust zawsze zapisuje id ≥ 1, więc w praktyce dotyczy to tylko zapisów webowych (DL-SLB-4). Warto to opisać przy DL-SLB-4 (mapowanie 0 na 1).
- **N4:** komentarz „scisle: zla forma = blad” przy `playable` odnosi się do typów pól. Nieznane klucze są ignorowane, bo nie ma `deny_unknown_fields`. Doprecyzować komentarz albo dodać atrybut (decyzja techniczna).
- **N5 (D-SLB-6, ryzyko):** `player_start_hex_by_owner` jest przy wczytaniu przeliczany ze stolicy fotela 1. Jeśli przed zapisem stolica przeszła w inne ręce (`is_capital` zdejmowany w `city_capture_apply.rs:770`), wpis znika i `compute_player_visibility` traci zapasowe odsłonięcie startu (`state.rs:1395`) oraz `start_reveal_keys_for_river_fog`. Pin też nie zapisuje `playerStartHex` (zostaje wartość z pamięci modułu), więc parytet jest niejasny. NIE_ZMIERZONO. Do tabeli długów.
- **N6:** zapis wymaga niezmienników `GameStateDto` (populacja ≥ 1, niepuste nazwy). Stan, który je łamie, daje jawny błąd `Projection`, a nie cichą utratę danych. Dziś ścieżki zdobycia trzymają populację ≥ 1. Głodu (`city_growth`) nie sprawdzałem: NIE_ZMIERZONO.

## Zgodność z decyzjami dispatchu

- `CONTRACT_VERSION` bez zmian (1). Zmiana addytywna z uzasadnieniem (pole siostrzane jak D-WIRB-5).
- Jedyną ścieżką wczytania jest `zapis_loader::load_save_snapshot`, z migracjami w środku. `moved_units` są przenoszone do ciała. Degradacja wodzów nic nie robi, bo `PlayableUnit` nie ma wodzów.
- U1 i U5 zamknięte. Zapis w trakcie bitwy daje jawny błąd (DL-SLB-1). Tabela „zamknięte / dług” jest obecna. Poprawki opisu długów: N2 i N5.

## Sprzątanie

Usunąłem plik tymczasowy `tests/zz_eval_slb.rs` i target Evaluatora. Drzewo robocze jest czyste poza tym raportem. Wolne miejsce po sprzątaniu: 12 GB.

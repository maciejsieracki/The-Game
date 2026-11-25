# R-RUSTPORT-P4-SAVE-LOAD-BRIDGE-Q1: Final Control r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-SAVE-LOAD-BRIDGE-Q1 (zadanie #375)
GOAL: komendy mostu `SaveGame`/`LoadGame`, produkcyjny wołający zapisu i odtworzenia `PlayableGame` (U1), `active_seat` (U5), E2E bajt w bajt.
ZMIANY/COMMIT: oceniany kod `02b2b0704` (gałąź `rust-port-wip/save-load-bridge-q1-obrona`; łańcuch `ee1ceda3e` → `24e512c71` → `4328d87f2` → `e060b081c` → `318f77c0b` (Operator) → `f2136ff8d` (Evaluator) → `d53a6a2ba` → `02b2b0704` (Obrona)). Baza `ee1ceda3e` = `origin/rust-port/parity-v2` z dispatchu jest przodkiem (merge-base = `ee1ceda3ebed21f90ec207f9e541e792738f7abc`). FC nie zmienia kodu; dodaje tylko ten raport (gałąź `fc/SAVE-LOAD-Q1-r1`).
TESTY: sekcja Bramki (odtworzone samodzielnie przez FC).
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (FF `parity-v2`), bramki klienta i renderera przy integracji (nie uruchamiane przez FC, zgodnie z dispatchem).
DEPLOY/PUSH: NIE WYKONANO.

## Bramki odtworzone przez FC (na `02b2b0704`)

Warunki: `CARGO_TARGET_DIR` w scratchpadzie (poza repo, usunięty po bramkach), `CARGO_INCREMENTAL=0`, `CARGO_PROFILE_DEV_DEBUG=0`, `CARGO_PROFILE_TEST_DEBUG=0`, przebieg w tle (`setsid nohup`, `EXIT` w logu).

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` (engine) | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` (engine) | EXIT 0 |
| pełny `cargo test --all-targets --no-fail-fast` (engine) | **EXIT 0**: 556 bloków `test result`, 4307 passed, 0 failed, 1 ignored (ten `#[ignore]` istniał przed tematem) |
| `p4_save_load_bridge` | 31/31 |
| `git diff --check ee1ceda3e 02b2b0704` | czysto |
| klient / renderer | NIE URUCHAMIANE (dispatch: wykonuje orkiestrator przy integracji; wolne miejsce w trakcie bramki spadło do 2,3 GB przez równoległe tematy) |

Liczba 4307 = wynik Obrony (4301 u Evaluatora + 6 nowych testów).

## Allowlista i zakazy (sprawdzone samodzielnie)

`git diff --stat ee1ceda3e 02b2b0704`: `engine/src/bridge.rs` (+107/−0), `engine/src/domain/playable.rs` (+245/−4), `engine/src/domain/save_load.rs` (+75/−1), `engine/tests/bridge_contract.rs` (+9/−1), nowy `engine/tests/p4_save_load_bridge.rs` (+1151/−0), raporty `01`, `02`, `02a`. Wszystko w allowliście. Nie ruszono: `gra/`, `src-tauri`, `client`, `renderer`, `view-model`, `Cargo.lock`, `domain/mod.rs`.

- Brak nowego `#[ignore]` (grep w nowych/zmienionych testach: 0).
- `bridge_contract.rs` tylko rozszerzony (16 → 18 wariantów), żadna asercja nie osłabiona.
- Commity tematu bez nazw modeli i bez `Co-Authored-By` (grep po treści commitów `ee1ceda3e..02b2b0704`: 0 trafień).
- `CONTRACT_VERSION` = 1 bez zmian; zmiana addytywna (pole siostrzane `saveGame` jak D-WIRB-5). Grep `BridgeResponse {` poza `engine/`: 0 trafień, więc literały struktury w kliencie/Tauri nie pękną; klient nie ma wyczerpującego `match` na `EngineCommand`.

## Weryfikacja zakresu wobec dispatchu i pinu `07d2fbd72`

- Pin `restoreGameFromSave` (`main.ts:46272-46287`): `plannedMarches/marchStopNotified/marchStopDetail/marchAttackTargets/movedByPlayerThisTurn.clear()`, potem `plannedMarchesFromSave(…, units, 0)` — filtr po fotelu głównym. Rust: ciało zapisu bez tych pól, `restore_planned_marches(&mut state, HUMAN_PLAYER_ID)`. Zgodne.
- Pin `:46368-46370`: `playerEverOwnedCityByOwner` z miast dla `humanOwnerIds`; `:46379-46382` `humanSeats.activeHumanOwnerId = saved.activeHumanOwnerId`; mgła `:46385-46411`. Rust: `odtworz_flage_zwyciestwa_ze_miast` (zdjęty `#[cfg(test)]`, teraz produkcyjny wołający), `fog.active_seat` z `activeHumanOwnerId`, `restore_explored_by_human`. Zgodne.
- Jedyna ścieżka produkcyjna wczytania: `PlayableGame::load_json` → `zapis_loader::load_save_snapshot` (migracje w środku) → `from_save_snapshot`. Zgodne z punktem 1 GOAL.
- Kryteria końca: `SaveGame`/`LoadGame` w moście z E2E (round-trip bajt w bajt, ponowny zapis = punkt stały, kolejne komendy bajt w bajt w dwóch wczytanych sesjach i w sesji źródłowej, fotel 2, mgła, plany marszu, `citySiege`, cuda) — spełnione. U1 i U5 zamknięte. Mutanty ≥ 12 — spełnione (Operator 20/20, Evaluator 6 zabitych + luki domknięte przez Obronę 5/5, FC 2/2 niżej). Tabela „zamknięte / dług” jest (02a).

## Mutanty FC (każdy osobno, `cargo test --test p4_save_load_bridge`, plik przywrócony `git checkout`, drzewo czyste)

| # | Mutant | Wynik |
|---|---|---|
| FC1 | `save_snapshot`: usunięte `body.siege_machines_ready.clear()` (machiny zostają w ciele zamiast tylko w `citySiege`) | ZABITY (`oblezenia_i_cuda_przezywaja_zapis_w_kluczach_weba`, l. 584) |
| FC2 | para E01+E07 łącznie: `capture_events` nie czyszczone ani przy zapisie, ani przy wczytaniu | ZABITY (`pola_zdobycia_i_kapitulacji_przezywaja_zapis_a_dziennik_nie`, l. 652) — potwierdza tezę Obrony N1a, że para jest chroniona łącznie |

## Orzeczenia (każdy zarzut)

| # | Zarzut (źródło) | Orzeczenie | Uzasadnienie / dowód |
|---|---|---|---|
| Z-OP | Operator nie powtórzył pełnego testu po ostatniej zmianie (NIE_ZMIERZONO) | ODDAL | Evaluator (4301) i FC (4307, EXIT 0) zmierzyli pełny przebieg. |
| N1 | Luki testów E05/E06/E08/E09 (Evaluator) | ODDAL (zamknięte) | Obrona `d53a6a2ba`: 6 testów; mutanty E05/E06/E06b/E08/E09 zabite; FC: testy zielone w pełnym przebiegu (31/31). |
| N1a | E01/E07, E02, E03, E16 przeżyły | ODDAL | E02/E03: pola `serde(skip)`/nieserializowane — równoważne. E16: `rng` snapshotu bez czytelnika (D-SLB-3) — równoważny. E01+E07: FC2 pokazuje, że para łącznie jest zabijana. |
| N2 | DL-SLB-3 opisany nieściśle (`siegeTurnByCity`) | ODDAL (poprawione) | Klucz idzie surowo przez `war.opaque` → `state.war`; test `surowy_licznik_tur_oblezenia_w_war_opaque_przezywa_zapis`. Dług zawężony do typowanego pola/producenta (temat ticku oblężenia). |
| N3 | `activeHumanOwnerId: 0` → `PlayerId(0)` | ODDAL (dług DL-SLB-4) | Format Rust zawsze zapisuje id ≥ 1; 0 przychodzi tylko z zapisu webowego. Pin też nie waliduje fotela (`save.ts:728`). Mapowanie id foteli web → Rust należy do wczytywania zapisów webowych (DL-SLB-4). Bez wpływu na grę dzisiaj (brak ścieżki ładowania zapisów webowych). |
| N4 | „Ścisły” odczyt ciała vs brak `deny_unknown_fields` | ODDAL (poprawione) | Komentarz doprecyzowany; test `cialo_sesji_ignoruje_nieznane_klucze_a_zla_forma_znanego_pola_to_blad`; D-SLB-9 (decyzja techniczna, spójna z `SnapshotWire`). |
| N5 | `player_start_hex_by_owner` przeliczany ze stolicy | ODDAL (dług DL-SLB-7) | Pin też nie zapisuje `playerStartHex`; parytet po przeładowaniu strony nierozstrzygnięty (NIE_ZMIERZONO). Do zbadania w pinie w osobnym temacie; nie blokuje zakresu dispatchu. |
| N6 | Zapis wymaga niezmienników `GameStateDto` | ODDAL (dług obserwacyjny DL-SLB-8) | Grep Obrony: wszyscy produkcyjni pisarze `PlayableCity.population` trzymają ≥ 1; naruszenie da jawny błąd `Projection`, nie cichą utratę. |
| DL-SLB-1 | Zapis w trakcie bitwy oblężniczej | ODDAL (dług zgodny z dispatchem) | Dispatch wprost wyłącza ten zakres; Rust zwraca jawny błąd `SiegeBattleInProgress` (test). |
| FC-O1 | Efekty wczytania pinu poza ścieżką Rust (`ensureCitySaveDefaults`, reset `okolicaTryb` miast AI `:46325`, `maMur` z `cityBuilt`, `healInconsistentUnits`, `reconcileAllWorkedTiles`) | ODDAL (uwaga do DL-SLB-4) | Dotyczą sanityzacji starych zapisów webowych i pól, których `PlayableState` nie modeluje albo które Rust zapisuje wprost w ciele `playable`. Zapis Rust → odczyt Rust jest punktem stałym (test bajt w bajt), więc nie ma czego sanityzować. Przy temacie wczytywania zapisów webowych (DL-SLB-4) te kroki trzeba przenieść. |
| FC-O2 | Most klienta (`client/tests` włącza `bridge.rs` przez `#[path]`) nie był budowany w tej rundzie | ODDAL (NIE_ZMIERZONO, bramka integracji) | Dispatch przypisuje bramki klienta/renderera orkiestratorowi. Zmiany w `bridge.rs` są addytywne; nowe funkcje używają `PlayableGame::save_json/load_json`, które istnieją w budowie nie-testowej silnika (z niej korzysta klient). Ryzyko niskie, ale do zmierzenia przy FF. |

Brak zarzutów NAPRAW. Brak pozycji DO DECYZJI CZŁOWIEKA (żadne odstępstwo gameplay od webu; wszystkie decyzje techniczne D-SLB-1…9 mieszczą się w kompetencji orkiestratora).

## Długi (do `REJESTR-RUST.md`, wpisuje orkiestrator)

| ID | Opis | Stan |
|---|---|---|
| DL-SLB-1 | zapis w trakcie bitwy oblężniczej (`ActiveSiegeBattle`/`SiegeLoop`/`ProdBody`) | DŁUG (osobny temat) |
| DL-SLB-2 | dziennik zdarzeń poza zapisem | zgodne z pinem |
| DL-SLB-3 | `siegeTurnByCity`: brak typowanego pola i producenta (nośnik działa) | DŁUG (temat ticku oblężenia) |
| DL-SLB-4 | wczytywanie zapisów webowych: mapowanie id foteli (0 → fotel główny), sanityzacja z FC-O1 | DŁUG |
| DL-SLB-5 | przełączanie fotela w grze (hot-seat) | DŁUG |
| DL-SLB-6 | `last_siege_tick` poza zapisem | odnotowane |
| DL-SLB-7 | `player_start_hex_by_owner` po utracie stolicy | DŁUG (zbadać pin) |
| DL-SLB-8 | niezmienniki `GameStateDto` przy wpięciu głodu | DŁUG obserwacyjny |
| — | klient/Tauri bez wołania `SaveGame`/`LoadGame` (UI slotów) | DŁUG (temat klienta) |

Decyzje techniczne do rejestru: D-SLB-1…D-SLB-8 (`01-operator-r1.md`), D-SLB-9 (`02a-obrona.md`).

## Sprzątanie

Target FC (`scratchpad/slb-fc-target`, 4,3 GB) usunięty po bramkach i mutantach; `playable.rs` przywrócony (`git status` czysty przed zapisem raportu). Wolne po sprzątaniu: 8,1 GB (`df -h /`).

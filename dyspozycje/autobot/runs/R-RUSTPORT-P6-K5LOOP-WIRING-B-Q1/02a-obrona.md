# R-RUSTPORT-P6-K5LOOP-WIRING-B-Q1: Obrona Operatora r1

```text
STATUS: PASS-WITH-NOTES (Z1, Z2, Z3, Z6, U1, U2 przyjęte z poprawką; Z4 i Z5 przyjęte, z odrzuceniem E17 i E09 jako równoważnych; U3 NIE_ZMIERZONO)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-WIRING-B-Q1 (#369 część B)
GOAL: sesja bitwy oblężniczej z mostu, wynik zastosowany do PlayableState jak finishSiegeStormBattle bez gałęzi
      zdobycia (hak T8), długi D-ADP-11 i D-ADP-L-BARB
BAZA: kod Operatora 4fb0fe07c (nad parity-v2 2e5bf370a); gałąź obrony obrona/k5loop-wiring-b-q1
      (worktree wf_177db0a5-845-3)
ZMIANY/COMMIT: f5ec7c725, 29396c7d4 (kod i testy), commit raportu = SHA w odpowiedzi Obrony
TESTY: §3 (bramki tematu i dispatchu zielone; mutanty 27/30 zabitych, 3 jawnie równoważne; pełny cargo test NIE_ZMIERZONO, dysk)
BLOKADY: brak blokujących; U3 NIE_ZMIERZONO (dysk 4,3 GB < 12 GB na bramkę renderera/klienta)
RUNDY: 1/5 (obrona r1)
NASTĘPNY KROK: Final Control (albo Operator r2, jeśli FC uzna któryś zarzut za otwarty)
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Odpowiedzi na zarzuty

### Z1 (blokujący): strumień mostu niezgodny z konsumentem `playback.rs`. **PRZYJMUJĘ**

Poprawka (D-WIRB-6 zastąpione nową wersją, `siege_battle_apply.rs` nagłówek i `payload`): `ActiveSiegeBattle.pending`
przechowuje akcje wyemitowane przez scenę z `t0 > vNow` ramki odpowiedzi. Odpowiedź oddaje tylko akcje z
`t0 <= frame.vNow`, posortowane stabilnie po `t0` (wcześniej wstrzymane idą przed nowymi). Reszta czeka na kolejną
odpowiedź. Akcje z `t0` za ostatnią ramką (koniec bitwy przed końcem animacji marszu) wychodzą w odpowiedzi
`FinishSiegeBattle`, która nie ma ramki. Niezmienniki w każdej odpowiedzi: akcje niemalejące, ramka nie wcześniejsza
niż oddane akcje, pierwsza akcja nie wcześniejsza niż ramka poprzedniej odpowiedzi. To jest dokładnie `check_order`
konsumenta (`renderer/src/battle/playback.rs:584-625`). Konsumenta nie zmieniono.

Dowód (test w `p6_k5loop_wiring_b.rs`):
* `PlaybackOrder` odwzorowuje `push_actions` (wszystko albo nic) + `push_frame` z `last_queued` żyjącym przez całą bitwę
  (wzorzec: test Evaluatora `eval_playback_kontrakt_*`);
* `run_realtime` sprawdza każdą odpowiedź (start, kroki, Finish) dla kroków 16 ms oraz [7.5, 40.25, 1000, 3, 250] ms:
  **0 naruszeń** (Evaluator zmierzył wcześniej 4421);
* `strumien_przyjmuje_konsument_playback`: ścieżka start → 16 ms → Skip → Finish ma 0 naruszeń, a ramka startu nie
  oddaje już akcji `t0 = 930` przy `vNow = 0`. Żadna akcja nie ginie: suma akcji mostu przy 16 ms jest równa sumie akcji
  sesji wywołanej bezpośrednio (start + `step(16)` do końca);
* mutanty O01 (oddawanie akcji z przyszłym `t0` od razu) i O02 (Finish gubi wstrzymane): §2.

Decyzja techniczna dla rejestru: **D-WIRB-6 v2**, wstrzymanie po stronie silnika (opis wyżej). Długu D-WIRB-6-CHUNK z
raportu r1 już nie ma.

### Z2 (blokujący, parytet): brak bramek wejścia szturmu. **PRZYJMUJĘ**

Poprawka (**D-WIRB-7**, `prepare_storm_with_eras`), kolejno wg pinu:
1. `not_enemy` (`map-attack-city.ts:119-121`): miasto gracza → `NotEnemyCity`.
2. `siege_panel` (`:127-139`): miasto `oblegane` z jednostką obcą w odległości 1. Kotwicą jest pierwsza taka jednostka
   w kolejności stanu (`units.find`), inna → `NotSiegeAnchor { besieger_id }`. Na tej ścieżce pin nie filtruje cywila ani
   `ruchLeft`.
3. `launchSiegeStormFromMap` (`main.ts:36800-36806`): oblegający ≠ gracz → `NotHumanBesieger`.
4. W pozostałych przypadkach ścieżka `attack_choice` (`adjacentPlayerAttackers` `:66-80` + `canInitiateSiege`
   `mapSiegeDetect.ts:74-81`): odległość 1 (`NotAdjacent`), `ruchLeft > 0` i nie cywil (`hint_civilian` `:141-146`,
   `AnchorCannotAttack`), mur (już wcześniej: `CityWithoutWall` adaptera).
5. Wojna: `withPlayerWarConsent` (`main.ts:13266-13281`) + `siegeAllowedBetween` (`diplomacy-siege-war-gate.ts:72-79`,
   `areEnemyOwners` `main.ts:13129-13133`). Bez wojny web pokazuje okno wypowiedzenia wojny. Most nie wypowiada wojny
   w tej komendzie (wypowiedzenie = osobna komenda #305), więc zwraca `NotAtWar`. Tak samo dla miasta bez obrońców,
   czyli most nie zgłasza już haka T8 dla miasta w pokoju.

Mgła (`hint_city_not_visible`) jest poza zakresem: sąsiedni heks jest w zasięgu widzenia kotwicy.

Dowód: `bramki_wejscia_szturmu_wg_pinu` (pokój → `NotAtWar`, także bez obrońców; odległość 3 → `NotAdjacent`, czyli
pomiar Evaluatora; miasto gracza → `NotEnemyCity`; cywil i jednostka bez ruchu na `attack_choice` odrzucone; brak
ruchu na `siege_panel` przyjęty; przez most błąd bez zmiany stanu) oraz `bramki_startu_wg_launch_siege_storm`
(`NotSiegeAnchor` dla 8001 i 7002, `NotHumanBesieger` dla pierwszego oblegającego AI). Mutanty O04–O09: §2.

### Z3 (blokujący): pamięć podręczna `LIVE_SESSION` przy klonie. **PRZYJMUJĘ**

Poprawka: `Clone for ActiveSiegeBattle` jest ręczny i nadaje klonowi nowy `live_key` (`next_live_key()`).
`PartialEq` pomija `live_key`, bo to klucz pamięci podręcznej, nie stan bitwy. Dokumentacja D-WIRB-1 opisuje teraz,
że klucz trafienia to `(live_key, ops.len())` z unikalnym kluczem dla każdego klonu.

Dowód: `klony_gry_nie_dziela_sesji_z_pamieci_podrecznej` (scenariusz Evaluatora `eval_klony_pamiec_podreczna`: A 500 ms,
B 3000 ms, A 16 ms) daje odpowiedź A równą odpowiedzi referencji odtworzonej bez pamięci podręcznej. Wcześniej było
`vNow 2992` zamiast `496`. E14 (bez klucza bitwy) i O03 (klon dzieli klucz) są zabite (§2).

### Z4: producent wejścia sesji (D-WIRB-4) bez testu. **PRZYJMUJĘ** (E07, E08, E15, E18 zabite; E17 jawnie równoważny)

Test `producent_wejscia_sesji_wg_pinu`:
* E07: `difficultyCombatMultForOwner` (`main.ts:9523-9527`) = `1 + bonusWalka` poziomu (Łatwy −0,05, Trudny +0,05 z
  `ai-params.json`) dla AI, 1 dla gracza;
* E08: las = nakładka na równinie (`worldTerrainFromHex`, `:1934-1943`): `("rownina", las=true, rzeka=false)`;
* E18: `defCiv = ikonaIdToBronzeCiv(civ właściciela miasta)` (`:36861-36863`, `:36989`): `rzymianie → rzym`,
  `chinczycy → chiny`;
* E15: `PlayableState` nie niesie epoki per właściciel. `owner_era_facts` daje każdemu epokę startu, więc E15/E17
  były nierozróżnialne w każdym stanie. Dodałem `prepare_storm_with_eras` (jawne fakty `empireEpochForOwner`).
  `prepare_storm` woła go z `owner_era_facts(state)`, więc produkcja się nie zmienia. Test wstrzykuje epoki (gracz 1,
  miasto 101 → 3, sojusznik 102 → 4) i sprawdza `owner_era = 3` (milicja = epoka właściciela miasta,
  `main.ts:34768-34771`).
* **E17: ODRZUCAM jako zabijalny, mutant jest RÓWNOWAŻNY w każdym stanie osiągalnym z `PlayableState`.** Dowód:
  `defenderEra = empireEpochForOwner(defRosterRef[0].ownerId)` (`:36999`), a `collectSiegeDefRoster` układa rosterem
  najpierw jednostki właściciela miasta (`main.ts:34811-34814`, Rust `owner_first`). Roster bez jednostki właściciela
  miasta (sam sojusznik) wymaga `hasCityDefenders`. Ta funkcja liczy wyłącznie jednostki właściciela miasta
  (`defenderUnitsNearCity(city, units)` bez `allowedOwnerIds`, `siegeDefenders.ts:96-126`), milicję właściciela
  (`ownerId = city.ownerId`) albo `city.garnizon > 0`. `PlayableState` nie ma licznika `garnizon` (adapter T6: `garnizon:
  None`). Zatem `defRosterRef[0].ownerId == city.ownerId` zawsze, a mutant (`defender_era = owner_era`) daje ten sam
  wynik. Pomiar w teście: miasto z samym sojusznikiem zwraca `NoDefendersCaptureRequested`, nie bitwę. Rozróżnienie
  stanie się możliwe, gdy stan dostanie `city.garnizon` (dług **D-WIRB-4-GARNIZON**).

### Z5: luki wektorów i E2E zastosowania wyniku. **PRZYJMUJĘ** (E02, E03, E05, E06, E11 zabite; E09 jawnie równoważny)

* Generator (`p6_k5loop_wiring_b_gen.mjs`, nadal wykonuje tekst pinu, strażnik SHA bez zmian `cf81ec14…73505`)
  dostał 2 scenariusze:
  * `remis_oblegane_miasto_obok` (E05): drugie miasto oblegane na (4,5), heksie, ku któremu obrońcy odchodzą przy remisie.
    Pin kieruje 8003 na (3,4) zamiast (3,5) (`retreatHexPassable` z `besiegedCityAtHex`);
  * `obronca_kotwica_cywil` (E06): kotwicą jest osadnik (ścieżka `siege_panel` bez filtra cywila).
    `spendAttackMpOnLive` zdejmuje mu punkt ruchu (`ruchLeft 1 → 0`).
* Zaznaczenie (E02/E11): wektory niosą `selectedId` przed wynikiem (7005) i po wyniku wg kleju
  `if (mapWinner === 'obronca') selectedId = null` (`main.ts:34713`, przepisany 1:1 z cytatem). Test pinu porównuje
  `selected_unit_id` oraz flagi `PlayableUnit::selected` (lustro). `wektory_pokrywaja_galezie` wymaga obu przypadków.
* Wektory: 9 scenariuszy, `vectors.json` MD5 `aaeeffb5a711820b2d2b21c6c4d9bb4b` (wcześniej `4a73ff61…`, 7 scenariuszy).
* E03: E2E `druga_bitwa_w_grze_ma_numer_2` (dwa miasta, pierwsza bitwa Skip+Finish, druga bitwa ma `battle_index = 2`).
* **E09: ODRZUCAM jako zabijalny, mutant jest RÓWNOWAŻNY w szturmie.** Dowód: lider z `pickLiveDefLead`
  (`post-battle-map.ts:321-328`) wpływa tylko na kolejność w `placeFanOutGroup` (`:281-319`):
  `order = [lead, ...reszta w kolejności rosteru]`. W szturmie heks bitwy = heks miasta (`battleQ/R = city.q/r`,
  `cityOnBattleHex` ustawione), a `stayOnCityCenter = true` pomija każdą jednostkę stojącą w centrum miasta. Oryginał
  wybiera lidera z heksu bitwy, który i tak jest pominięty, więc ruchy wykonują jednostki spoza centrum w kolejności
  rosteru. Mutant (`!=`) wybiera pierwszą jednostkę spoza centrum w kolejności rosteru, czyli tę samą, która w oryginale
  rusza się pierwsza. Gdy na heksie bitwy nie ma obrońcy, oba warianty dają `defAlive[0]`. Sekwencja ruchów jest więc
  identyczna; kierunek `dir` nie zależy od lidera. Jedyna pochodna różnica to licznik `defLossesThisTurn`, którego nie ma
  w stanie (poza zakresem, §5 r1).

### Z6: brak wyjścia z bitwy. **PRZYJMUJĘ**

Decyzja **D-WIRB-8**: `FinishSiegeBattle` zawsze jest wyjściem. Są trzy przypadki:
* wynik zastosowany;
* `NotFinished`: bitwa trwa, dostępne `Skip`;
* każdy inny błąd (`outcome.unported`, `LoopUnsupported`, błąd zastosowania): bitwa jest zamykana bez zmiany stanu,
  zwracany jest `SiegeBattleError::Aborted { city_id, reason }`.

Web tej ścieżki nie ma, bo scena zawsze kończy się wynikiem. Port nie zgaduje wyniku. Komendy mapy wracają.

Test `playable.rs::siege_battle_exit_tests::finish_z_bledem_zamyka_bitwe_bez_zmiany_stanu` sprawdza:
* `NotFinished` nie zamyka bitwy;
* błąd zastosowania daje `Aborted`, bitwa jest zamknięta, a stan pozostaje bajt w bajt taki jak przed Finish;
* `AdvanceTurn` nie zwraca już `SiegeBattleInProgress`;
* kolejne `Finish` zwraca `NoActiveBattle`.

Mutant O10: §2.

### U1: `AddPlayer` i `SelectUnit` w trakcie bitwy. **PRZYJMUJĘ**

Obie komendy mają bramkę `ensure_no_siege_battle` (D-WIRB-2: scena zasłania mapę). Wszystkie komendy zmieniające stan
są w trakcie bitwy zablokowane, więc wynik stosuje się do stanu równego migawce startu. Test:
`komendy_poza_faza_to_jawne_bledy_bez_zmiany_stanu` (dwie nowe komendy na liście). Mutanty O11 i O12: §2.

### U2: kontrakt `CityCaptureRequested` dla T8. **PRZYJMUJĘ** (dokumentacja)

Doc `CityCaptureRequested` wymaga od T8:
1. `isCityCaptureBlockedByDefenders` (`main.ts:34650-34653`) po wipe/retreat;
2. `applyCityCaptureToMap`;
3. powtórzenie `validateActiveSieges` na stanie po zdobyciu, bo część B liczy je przed wejściem na heks.

### U3: kompilacja `client/tests/engine_bridge_renderer.rs` (`#[path] bridge.rs`). **NIE_ZMIERZONO**

W tej rundzie `bridge.rs` się nie zmienił. Klient ciągnie renderer (wgpu), a dysk ma 4,3 GB, mniej niż 12 GB wymagane
na bramkę renderera. Pośredni dowód: 10 testów silnika dołącza ten sam `bridge.rs` przez `#[path]`, w tym te, które nie
używają `SiegeBattlePayload`/`WallMs` (np. `bridge_add_player.rs`), i `clippy --all-targets -D warnings` przechodzi.
Klient nie buduje `BridgeResponse` literałem, a `BridgeResult` ma bez zmian. Bramkę klienta trzeba wykonać przy
integracji.

Commit raportu Operatora 4fb0fe07c nie jest wypchnięty. Push nie należy do Operatora/Obrony, tylko do orkiestratora.

## 2. Mutanty (skrypt `02a-obrona-mutanty.py`)

Werdykt dają testy `p6_k5loop_wiring_b_pin`, `p6_k5loop_wiring_b`, `bridge_contract`; dla mutantów `playable.rs`
dodatkowo testy biblioteki z filtrem `siege_battle`. Wzorce E01–E18 są z `02-evaluator-mutanty.py`; E13 dostosowany do
nowego `finish_siege_battle`.

Wynik: **27/30 zabitych, 3 przeżyły i każdy jest jawnie równoważny** (dowody niżej). Log przebiegu:
`/tmp/.../scratchpad/wirb_obrona/mut.log`, każdy wiersz przepisany w tabeli. Po przebiegu `git status` był czysty.

| ID | Mutacja | Wynik (test zabijający) |
|---|---|---|
| E01 | weteran dla rezerwy zwycięzcy | ZABITY (`wektory_pinu_zastosowania_wyniku_bajt_w_bajt`) |
| E02 | wygrana obrońcy nie czyści `selected_unit_id` | ZABITY (wektory pinu, `selectedId`) |
| E03 | numer bitwy stały 1 | ZABITY (`druga_bitwa_w_grze_ma_numer_2`) |
| E04 | remis: atakujący odchodzą od siebie | ZABITY (wektory) |
| E05 | oblegane miasto przejezdne przy odwrocie | ZABITY (wektory, `remis_oblegane_miasto_obok`) |
| E06 | cywilna kotwica nie traci ruchu | ZABITY (wektory, `obronca_kotwica_cywil`) |
| E07 | trudność AI ignorowana | ZABITY (`producent_wejscia_sesji_wg_pinu`) |
| E08 | las nie jest nakładką | ZABITY (`producent_wejscia_sesji_wg_pinu`) |
| E09 | lider obrońców nie z heksu bitwy | PRZEŻYŁ, **RÓWNOWAŻNY** (dowód: Z5) |
| E10 | `MoveUnit` w trakcie bitwy | ZABITY (`komendy_poza_faza_…`) |
| E11 | flaga `selected` zostaje po wygranej obrońcy | ZABITY (wektory) |
| E12 | HP ocalałych nie zapisane | ZABITY (`most_start_krok_pomin_koniec_stosuje_wynik`) |
| E13 | bitwa nie zamknięta po wyniku (wzorzec dostosowany do nowego `finish_siege_battle`) | ZABITY (3 testy) |
| E14 | pamięć podręczna bez klucza bitwy | ZABITY (`klony_gry_nie_dziela_sesji_z_pamieci_podrecznej`) |
| E15 | epoka milicji = epoka atakującego | ZABITY (`producent_wejscia_sesji_wg_pinu`, fakty wstrzyknięte) |
| E16 | brak `validateActiveSieges` | ZABITY (wektory) |
| E17 | `defenderEra` = epoka miasta | PRZEŻYŁ, **RÓWNOWAŻNY** w stanach `PlayableState` (dowód: Z4; dług D-WIRB-4-GARNIZON) |
| E18 | `defCiv` stałe | ZABITY (`producent_wejscia_sesji_wg_pinu`) |
| O01 | akcje z przyszłym `t0` oddawane od razu (bez wstrzymania) | ZABITY (`czas_rzeczywisty_…`, `strumien_przyjmuje_konsument_playback`) |
| O02 | `Finish` gubi wstrzymane akcje | PRZEŻYŁ, **RÓWNOWAŻNY w zmierzonych przebiegach** (niżej) |
| O03 | klon dzieli klucz pamięci podręcznej | ZABITY (`klony_gry_…`) |
| O04 | szturm bez wojny | ZABITY (`bramki_wejscia_szturmu_wg_pinu`) |
| O05 | szturm z daleka | ZABITY (`bramki_wejscia_…`) |
| O06 | szturm własnego miasta | ZABITY (`bramki_wejscia_…`) |
| O07 | panel oblężenia z dowolną kotwicą | ZABITY (`bramki_startu_wg_launch_siege_storm`) |
| O08 | cywil atakuje (`attack_choice`) | ZABITY (`bramki_wejscia_…`) |
| O09 | jednostka bez ruchu atakuje (`attack_choice`) | ZABITY (`bramki_wejscia_…`) |
| O10 | błąd wyniku nie zamyka bitwy (Z6) | ZABITY (`siege_battle_exit_tests::finish_z_bledem_…`) |
| O11 | `SelectUnit` w trakcie bitwy | ZABITY (`komendy_poza_faza_…`) |
| O12 | `AddPlayer` w trakcie bitwy | ZABITY (`komendy_poza_faza_…`) |

**O02 jest równoważny w zmierzonych przebiegach.** Pomiar jednorazowym testem scratch (dopisany tymczasowo do
`p6_k5loop_wiring_b.rs`, potem usunięty, poza drzewem): 12 ziaren × {kroki 16 ms do końca, Skip} = 24 bitwy. W każdej
odpowiedź `FinishSiegeBattle` niosła 0 akcji. Bitwa kończy się więc dopiero po czasie wirtualnym ostatniej
zaplanowanej akcji, a `pending` jest przy końcu puste. Opróżnianie `pending` w `Finish` jest gałęzią obronną: gwarantuje
przyjęcie strumienia przez konsumenta, gdyby koniec bitwy kiedyś wypadł przed `t0` marszu. Brak utraty akcji niezależnie
od tej gałęzi potwierdza test `strumien_przyjmuje_konsument_playback` (suma akcji mostu = suma akcji sesji bezpośredniej).

## 3. Bramki

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie
(`wirb_obrona/tgt`, usunięty po bramkach).

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --lib` + `--test` `bridge_add_player`, `bridge_contract`, `p6_battle_setup`, `p6_battle_setup_units`, `p6_k5loop_adapter`, `p6_k5loop_siege_atk_a`, `p6_k5loop_siege_atk_b`, `p6_k5loop_siege_def`, `p6_k5loop_tags_rest`, `p6_k5loop_wiring_a`, `p6_k5loop_wiring_a_pin`, `p6_k5loop_wiring_b`, `p6_k5loop_wiring_b_pin` (`--no-fail-fast`) | EXIT 0: lib 144, 1, 10, 15, 7, 27, 8, 10, 10, 5, 22, 3, **15**, **2** passed; 0 failed |
| generator `node tests/p6_k5loop_wiring_b_gen.mjs` | EXIT 0, `pinSha256 cf81ec14…73505` (strażnik bez zmian), `vectors.json` MD5 `aaeeffb5a711820b2d2b21c6c4d9bb4b` (9 scenariuszy) |
| `git diff --check 2e5bf370a HEAD` | czysto |
| `#[ignore]` w diffie / `Co-Authored-By` w commitach | 0 / 0 |
| allowlista (`git diff --name-only 2e5bf370a HEAD`) | `bridge.rs`, `domain/{mod,playable,siege_battle_apply,siege_battle_session}.rs`, `tests/bridge_contract.rs`, `tests/p6_k5loop_wiring_b{,_pin}.rs`, `_gen.mjs`, `_vectors/vectors.json`, pliki runu; poza allowlistą: brak |
| pełny `cargo test --all-targets --no-fail-fast` | **NIE_ZMIERZONO w tej rundzie**: dysk 2,8–4,3 GB, a Evaluator potrzebował partii przy 5–9 GB. Obrona zmienia tylko `siege_battle_apply.rs`, `playable.rs` (bramki `add_player`/`select_unit` aktywne wyłącznie przy trwającej bitwie, `finish_siege_battle`) i testy tematu. Zielone są wszystkie testy wskazane w dispatchu oraz cała biblioteka. Pełny przebieg: FC albo integracja. |
| bramka klienta/renderera (U3) | NIE_ZMIERZONO (dysk < 12 GB) |

## 4. Długi (zmiany względem r1)

| ID | Status |
|---|---|
| D-WIRB-6-CHUNK | ZAMKNIĘTY (D-WIRB-6 v2: wstrzymanie akcji, test konsumenta) |
| D-WIRB-4-GARNIZON | NOWY: E17 rozróżnialny dopiero ze stanem `city.garnizon` |
| D-WIRB-4-ERA | NOWY: `PlayableState` bez epoki per właściciel; producent ma wejście z faktami (`prepare_storm_with_eras`) |
| U3 | NIE_ZMIERZONO: bramka klienta przy integracji (dysk) |
| pozostałe z r1 (D-WIRB-1-PERF, SERDE-U64-KEYS, RNG-LICZNIK, POZA ZAKRESEM, T8, B-WIRA-PIN-2) | bez zmian |

Decyzje do `REJESTR-RUST.md` (wpisuje orkiestrator): D-WIRB-6 v2, D-WIRB-7, D-WIRB-8 oraz rozszerzenie D-WIRB-2 (U1).

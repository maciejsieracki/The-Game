# R-RUSTPORT-P6-K5LOOP-ADAPTER-Q1 — Evaluator r1 (adwersarialny)

```text
STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-ADAPTER-Q1 (T6)
GOAL: adapter PlayableState -> rostery, szablony, SetupUnit, wejscia ProdBody/ActivateScene/SiegeEnv rowne pinowi 07d2fbd72
ZMIANY/COMMIT: oceniany 9a39bc09f (galaz rust-port-wip/k5loop-adapter-q1-op-r1d; zawiera merge parity-v2 1e20c2da9 —
               parity-v2 nadal = 1e20c2da9). Evaluator: tylko ten raport (bez zmian kodu).
TESTY: fmt 0; clippy --all-targets -D warnings 0; p6_k5loop_adapter 25/25; 6 testow bramki 54/54 (EXIT 0);
       generator pinu bajt w bajt; pelny cargo test --all-targets EXIT 0 (4101 ok, 0 failed, 1 ignored); mutanty Evaluatora 8/20 ZABITE, 12 PRZEZYLO
BLOKADY: brak blokad infrastruktury; FAIL merytoryczny = luki testow (§4)
RUNDY: 1/5
NASTEPNY KROK: Operator r2 (ta sama ID) — testy/wektory zabijajace E01–E05, E07, E17, E19 (+ uzasadnienie E09, E15, E18, E20)
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Zakres i baza

- Oceniany commit `9a39bc09f` (Operator r1d). `git merge-base --is-ancestor 1e20c2da9 HEAD` = tak; `origin/rust-port/parity-v2`
  = `1e20c2da976c` (bez ruchu od startu r1b).
- Allowlista: `git diff --stat 1e20c2da9..HEAD` = 11 plikow: 4 nowe `siege_battle_adapter*.rs`, 4 linie `pub mod` w
  `domain/mod.rs`, `tests/p6_k5loop_adapter.rs`, generator, 2 pliki wektorow, raport + skrypt mutantow w katalogu runu.
  Brak plikow spoza allowlisty; brak zmian w `siege_tactics_loop.rs`, `siege_tactics_atk*`, `battle_setup*`, `bridge.rs`,
  `renderer/`, `view-model/`, `Cargo.*`, `gra/**`, `REJESTR-RUST.md`. Brak zmian widocznosci w istniejacych plikach.
- `#[ignore]` / `should_panic`: brak w nowym tescie. Porownania bit w bit (`same(a,b)` = `==` lub oba NaN); jedyna
  tolerancja `1e-15` w `kara_morale_sufit` (wartosc 0,5 — dopuszczalne).

## 2. Bramki odtworzone (CARGO_INCREMENTAL=0, DEBUG=0, CARGO_TARGET_DIR=scratchpad/adapter/t2)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 (1 min 27 s) |
| `cargo test --test p6_k5loop_adapter` | 25 passed, 0 failed (0,12 s) |
| `--test p6_battle_setup_units --test p6_battle_setup --test bridge_contract --test p6_k5loop_siege_atk_a --test p6_k5loop_siege_def --test p6_k5doc_t8` | 7 / 15 / 9 / 7 / 10 / 6 ok, EXIT 0 |
| `node tests/p6_k5loop_adapter_gen.mjs` (Node 22.23.4) | `pinSha256 0a95f5bc…731f51`, pokrycie jak w raporcie; `git status` czysty = bajt w bajt |
| pelny `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`) | **EXIT 0**, 02:23:25Z–02:37:57Z, 541 binarek, 4101 passed, 0 failed, 1 ignored (istniejacy, poza tematem) |

Po bramkach usunieto binarki testowe z `adapter/t2/debug/deps` (dysk spadl do 1,2 GB); zostaly rlib/rmeta (927 MB).

Dysk przy starcie: 3,8 GB wolnego (< 8 GB z dispatchu; R-DYSK-2) — uzyto cache `adapter/t2` (dodatek r1d), bez buildu
renderera; w trakcie 1,2–6,1 GB.

## 3. Weryfikacja wobec pinu (tekst `git show 07d2fbd72`)

Potwierdzone czytaniem pinu i porownaniem z portem:
- `appendReadyMachinesToRoster` (`main.ts:18336`), `collectSiegeAtkRoster`/`collectSiegeDefRoster` (`:34758`, `:34802`,
  wlasciciel miasta pierwszy), `cityHasDefenders` bez `allowedOwnerIds` w `defenderUnitsNearCity` (`:34795`),
  `hasCityDefenders`/`collectCityDefRoster`/`buildMilitiaSquad`/`buildMilitiaDef` (`siegeDefenders.ts`), `makeMilitia`
  (`siege.ts:535`), `MAX_PER_SIDE = 500` (`battleScene.ts:721`).
- Spawn: atakujacy w oblezeniu przez domkniecie `place` (`battleScene.ts:5440-5485`, wolane z galezi `siegeMode`
  `:5536-5543`) — `isRanged`, `movementPoints` bez civ; obroncy `_placeSiegeDefenders` (`:4442`, morale x1,5 `:4527`),
  korona (`:4695-4730`: katapulta `max(range, 6)`, `ranged = true`, `_applyTerrainRange`). Port zgodny.
- `_applyTerrainRange` (`:7490-7502`), `_isWallCrownShooter` (`:7467`), `_siegeMachineRange` (`:7530`), `clampEra`
  (`:922`; `floor(x+0.5)` po `clamp(1,3)` rownowazne `Math.round`). Zgodne.
- `maMur`: lista `mury/mury_kamienne/fort/palisada` (`main.ts:46333`) zgodna z `buildings.json` (`odblokowuje: maMur` dla
  palisada, mury_kamienne, mury; fort wymaga mury). Zgodne.
- D-T8-N1: `doctrine_auto_for` -> `is_unit_doctrine_auto` (pusty `groupId` falsy). Zgodne.
- Generator wykonuje tekst pinu (`transpileModule` modulow + wycinki `main.ts`/`battleScene.ts` z wartownikami linii).
  Uwaga: `pinSha256` jest tylko zapisywany do `vectors.json`, ani generator, ani test Rust nie porownuja go z oczekiwana
  stala (ochrona realnie = niezmiennosc commitu pinu); uklad pol spawnu przepisany wyrazeniami pinu (jawnie opisane).

Rozbieznosci kodu wobec pinu: nie znaleziono w sciezkach pokrytych wektorami.

## 4. Mutanty Evaluatora (adwersarialne, skrypt `02-evaluator-mutanty.py` w tym katalogu, werdykt = `cargo test --test p6_k5loop_adapter`)

Mutanty Operatora (M01–M31) nie byly powtarzane w calosci; Evaluator celowal w galezie, ktorych M01–M31 nie dotykaja.

| ID | Mutacja | Wynik | Ocena |
|---|---|---|---|
| E01 | `siege_inputs_from_playable`: wojna mapowana z `RelationStatus::Alliance` zamiast `War` | **PRZEZYL** | luka: relacje ze stanu nietestowane (test stanu sprawdza tylko sciezke „bez wojny”) — strony bitwy zle przy realnej wojnie |
| E02 | `WALL_BUILDINGS` bez `mury_kamienne` | **PRZEZYL** | luka: tylko palisada testowana (M31) |
| E03 | `ru.hp = None` (HP ze stanu pominiete) | **PRZEZYL** | luka: mapowanie HP/postepu ze `economy.units` nietestowane |
| E04 | `battles_survived = None` | **PRZEZYL** | jw. (weteran ze stanu) |
| E05 | `hasCityDefenders`: `garnizon > 0` -> `>= 0` | **PRZEZYL** | luka: brak wektora „tylko sojusznik obroncy przy miescie, bez wlasnych jednostek i bez Milicji” (pin: `NoDefenders` = zdobycie bez bitwy; mutant: bitwa) ani `garnizon > 0` |
| E06 | cywile atakujacego wlaczani | ZABITY | — |
| E07 | `collectAtkRosterNearCity` bez przestawienia kotwica/wlasni/sojusznicy | **PRZEZYL** | luka: s3 nie ma wlasnej jednostki po sojuszniku w kolejnosci `units` — kolejnosc rostera szturmu (cap 500, identyfikacja) nieweryfikowana |
| E08 | `militiaEraKey` `>= 3` -> `> 3` | ZABITY | — |
| E09 | `buildMilitiaDef` bez `min(base, …)` | PRZEZYL | prawdopodobnie rownowazny na danych pinu (podloga `flee+margin` <= base); wymaga jawnego uzasadnienia albo testu syntetycznego |
| E10 | general atakujacego nie blokuje | ZABITY | — |
| E11 | `dry_col` -1 -> 0 | ZABITY | — |
| E12 | `install_body_inputs` bez `tower_range` | ZABITY | — |
| E13 | bez wiezyczek `towerRange` 2 -> 0 | ZABITY | — |
| E14 | `InvalidGate` bez kontroli kolumny bramy | ZABITY | — |
| E15 | Z4 bez kontroli NaN `range_base` | PRZEZYL | brak testu NaN dla niezmiennika (D-ADP-10 deklaruje NaN = blad) |
| E16 | `clamp_era` 3 -> 4 | ZABITY | — |
| E17 | gotowe machiny z `city.owner_id` zamiast `anchor.owner_id` | **PRZEZYL** | luka: `ownerId` jednostek rosteru nie jest porownywany z pinem (machiny szturmu przypisane obroncy przechodza) |
| E18 | odnowa Milicji `> 0` -> `> 1` | PRZEZYL | brak wektora granicznego `militiaRegenAtTurn = turn + 1` |
| E19 | `install_body_inputs` bez `ranged_base` | **PRZEZYL** | asercja `body.ranged_base == u.ranged_base` jest pusta: `ProdBody::new` juz ma te same wartosci — test powinien startowac od ciala z wartosciami-wartownikami |
| E20 | `num_of`: napis = 0 (ciche zero) | PRZEZYL | rownowazny na danych pinu (brak napisow w kluczach skalowanych); do uzasadnienia |

Wynik: **8/20 zabitych, 12 przezylo**, z czego co najmniej 8 (E01–E05, E07, E17, E19) to nierownowazne luki w elementach
GOAL (wejscie z `PlayableState`, rostery, wejscia `ProdBody`). Kryterium dispatchu „mutanty wszystkie zabite albo jawnie
uzasadnione jako rownowazne” nie jest spelnione dla galezi adaptera jako calosci (raport Operatora 31/31 dotyczy tylko
wybranego zestawu).

## 5. Zarzuty (do Operatora r2)

1. **Z1 (PlayableState nietestowany, E01–E04).** `siege_inputs_from_playable` ma tylko test „bez wojny”: dodac stan z
   relacja `War` i `Alliance` (asercja `relations.wars/alliances` i stron `attacker_owners/defender_owners`), z
   `mury_kamienne` i `mury`, oraz z wpisem `economy.units` (hp, battlesSurvived, parametryBonusProc) i asercja pol
   `RosterUnit`. Kryterium „>= 6 stanow gry” jest dzis spelnione przez wejscia rosterow skladane w tescie, nie przez
   `PlayableState` -> adapter.
2. **Z2 (E05).** Wektor pinu: miasto z obronca wylacznie sojuszniczym w promieniu 1 (bez Garnizonu) -> pin `NoDefenders`;
   oraz `garnizon > 0` (jesli nieosiagalne ze stanu — test jednostkowy na `RosterCity`).
3. **Z3 (E07).** Wektor pinu z kolejnoscia `units`: sojusznik, kotwica, wlasna jednostka — sprawdza przestawienie
   `collectAtkRosterNearCity` (`battleRoster.ts:108-133`).
4. **Z4 (E17).** Porownywac `ownerId` kazdej jednostki rosteru (w tym `siege-mach-*`) z pinem (generator ma je w `atk`/`def`
   wyjsciu — dopisac pole) albo asercje na `owner_id` machin = wlasciciel kotwicy.
5. **Z5 (E19).** `wejscia_ciala_do_prodbody`: przed `install_body_inputs` ustawic pola ciala (`ranged_base`, `range_base`,
   `ammo_left`, `morale_max`, …) na wartosci-wartowniki, zeby asercje byly czule.
6. **Z6 (E09, E15, E18, E20).** Test albo pisemne uzasadnienie rownowaznosci (z danymi pinu) w raporcie.
7. **N1 (uwaga, nie blokuje).** `pinSha256` nieporownywany ze stala; rozwazyc asercje w tescie Rust.
8. **N2 (uwaga).** `areEnemyOwners` w pinie traktuje barbarzyncow zawsze jako wrogow (`main.ts:13131`); mapowanie stanu
   tego nie robi — opisac w dlugach (czy barbarzyncy wystepuja w `PlayableState.units`) albo obsluzyc.
9. **N3 (uwaga).** Sojusz w pinie = umowa sojusznicza (`hasAllianceDealBetween`, `main.ts:22649`), w porcie =
   `RelationStatus::Alliance`; w Rust status jest synchronizowany z umow (`turn_war_dipl_steps.rs:284-296`), ale tylko w
   krokach tury — dopisac jako decyzje D-ADP-* (zrodlo prawdy) i dlug T7.

## 6. Co jest dobrze

Kod adaptera zgodny z tekstem pinu w sciezkach wektorow (11 scenariuszy, 4011 par `log10`), brak cichych zer w
sciezkach z danych (bledy typowane), D-T8-N1, D-B11, `InvalidGate`, korona 6 / x2 ceil, kara morale — zweryfikowane i
zabijane mutantami. Bramki zielone. Poprawki r2 dotycza wylacznie testow/wektorow (bez zmian logiki), wiec runda
powinna byc krotka.

## 7. Sprzatanie

Evaluator nie commitowal kodu. Cache `scratchpad/adapter/t2` pozostawiony dla FC/r2 (decyzja orkiestratora o usunieciu);
skrypty i logi Evaluatora: `scratchpad/adapter/ev/` (`emut.py`, `emut.log`, `gates.log`, `full.log`).

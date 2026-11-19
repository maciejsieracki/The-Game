# R-RUSTPORT-P6-K5LOOP-ADAPTER-Q1 — Obrona Operatora (r1d, odpowiedz na Evaluator r1 `08e1af9fe`)

```text
STATUS: PASS (obrona: 6 zarzutow PRZYJETYCH z poprawka, N1 PRZYJETY, N2 i N3 PRZYJETE jako decyzja/dlug)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-ADAPTER-Q1 (T6)
GOAL: adapter PlayableState -> rostery, szablony, SetupUnit, wejscia ProdBody/ActivateScene/SiegeEnv rowne pinowi 07d2fbd72
ZMIANY/COMMIT: baza 08e1af9fe (raport Evaluatora; kod 9a39bc09f). Zmiany WYLACZNIE w testach/generatorze/wektorach
               (allowlista): tests/p6_k5loop_adapter.rs, tests/p6_k5loop_adapter_gen.mjs,
               tests/p6_k5loop_adapter_vectors/vectors.json + ten raport. Kod produkcyjny adaptera bez zmian.
               Commity: 1d9e4f527 (testy+wektory), __SHA_RAPORT__ (raport). Galaz obrona/k5loop-adapter-q1-r1d (bez push).
TESTY: __TESTY__
BLOKADY: brak
RUNDY: 1/5 (obrona po Evaluatorze r1)
NASTEPNY KROK: Final Control (ta sama ID)
DEPLOY/PUSH: NIE WYKONANO
```

## Odpowiedzi na zarzuty

### Z1 (E01–E04) — PRZYJMUJE
Nowy test `stan_gry_wojna_sojusz_mury_postep` buduje `PlayableState` (start gry + 4 dodatkowych graczy) z relacjami
`War` (miasto–wrog, miasto–sojusznik wroga, wrog–sojusznik obroncy), `Alliance` (wrog–sojusznik wroga,
miasto–sojusznik obroncy), `Peace` (miasto–neutralny), jednostkami w promieniu 1 i wpisem `economy.units[903]`
(`hp 7`, `battlesSurvived 2`, `parametryBonusProc 15`). Asercje:
- `maMur` dla kazdego z `mury_kamienne`, `mury`, `fort`, `palisada` = true; `garnizon` = false (+ `garrison_completed`);
- `relations.wars` i `relations.alliances` rowne dokladnym zbiorom par;
- pola `RosterUnit` ze stanu: (`owner_id`, `hp`, `battles_survived`, `parametry_bonus_proc`) dla jednostki z wpisem i bez;
- `collect_siege_rosters` na wyniku: `attacker_owners = {wrog, sojusznik wroga}`, `defender_owners = {miasto,
  sojusznik obroncy}`, `atk = [901, 902]`, `def = [903, 904]` (wlasciciel miasta pierwszy, neutralny poza bitwa),
  `def[0].hp = 7` (HP ze stanu doszlo do rosteru).
Dowod: E01, E02, E03, E04 — ZABITE (tabela nizej).

### Z2 (E05) — PRZYJMUJE
Generator (tekst pinu) dostal dwa scenariusze:
- `s13-tylko-sojusznik-obroncy`: przy miescie tylko sojusznik obroncy (wlasciciel 3, sojusz z 1, wojna z 0), bez
  Garnizonu i licznika -> pin `NoDefenders` (`hasCityDefenders` liczy tylko wlasciciela miasta, `main.ts:34795`) mimo
  niepustego `collectSiegeDefRoster`;
- `s14-licznik-garnizonu-sojusznik`: to samo z `city.garnizon = 2` -> pin: bitwa, `def = [o2]` (wlasciciel 3).
Dowod: E05 ZABITY (s13: mutant daje bitwe zamiast `NoDefenders`).

### Z3 (E07) — PRZYJMUJE
`s12-kolejnosc-sojusznik-kotwica-wlasny`: `units` = sojusznik (z2), kotwica (z1), wlasna (z3); pin daje
`atkIds = [z1, z3, z2]` (`battleRoster.ts:108-133`). Mutant bez przestawienia daje `[z1, z2, z3]`.
Dowod: E07 ZABITY.

### Z4 (E17) — PRZYJMUJE
Generator zapisuje `atkOwners`/`defOwners` (= `u.ownerId` z rosterow pinu, w tym `siege-mach-*` i Milicja); test
`adapter_zgodny_z_tekstem_pinu` porownuje `owner_id` kazdej jednostki obu rosterow we wszystkich 15 scenariuszach.
Dowod: E17 ZABITY (s2/s10: machiny z wlascicielem miasta != pin).

### Z5 (E19) — PRZYJMUJE
`wejscia_ciala_do_prodbody`: przed `install_body_inputs` wszystkie instalowane pola ciala ustawiane na wartownikow
rozne od wejsc (`ranged_base = !u.ranged_base`, `range_base/ammo_left/morale_max = -99`, `names = "WARTOWNIK"`,
`siege_stats/siege_machine_range = None`, `is_army_commander`/`anti_cav_spear` zanegowane, `shooting_disabled`
odwrocone, `siege_gate_col/row = -99`, `siege_wall_tiles_init = 999999`, `tower_range = -99`, `tower_shooter_nazwa`).
Istniejace asercje sa teraz czule na pominiecie kazdego przypisania.
Dowod: E19 ZABITY.

### Z6 (E09, E15, E18, E20) — PRZYJMUJE (testy zamiast uzasadnien)
- E09/E20: generator wykonuje `buildMilitiaDef` pinu (`siegeDefenders.ts:220-256`) na 4 wierszach syntetycznych x
  2 rodzaje (`militiaDefCases`): podloga `flee + 3` powyzej bazy (Syn1: baza 4, ucieczka 3 -> pin 4, mutant 6; Syn4:
  ucieczka napisem -> 0), napisy w kluczach skalowanych (`Atak: '5'`, `meleeAttack: '7'` — pin zostawia napis,
  mutant wpisuje 0), `Morale bazowe` jako napis, zero i wartosc ujemna, `fieldPower` usuwany. Test
  `definicja_milicji_wiersze_syntetyczne_jak_pin` porownuje caly wiersz.
- E15: `niezmienniki_wejsc_ciala` — `range_base = NaN` dla lucznika korony i katapulty korony -> `InvariantViolated`.
- E18: `s15-odnowa-za-jedna-ture` (`militiaRegenAtTurn = turn + 1 = 13`): pin bez Milicji, obronca realny.
Dowod: E09, E15, E18, E20 ZABITE.

### N1 — PRZYJMUJE
Generator: stala `EXPECTED_PIN_SHA` i `throw` przy innym skrocie wycinkow/modulow pinu. Test Rust: `PIN_SHA256` i
`assert_eq!(d["pinSha256"], PIN_SHA256)`. Skrot bez zmian (`0a95f5bc…731f51`) — wycinki pinu nie byly ruszane.

### N2 — PRZYJMUJE jako dlug (z dowodem nieosiagalnosci w obecnym stanie)
Pin `areEnemyOwners` (`main.ts:13129-13133`): barbarzyncy (`BARBARIAN_OWNER_ID = -1`) wrogami wszystkich.
`PlayableState.units[*].owner_id` i `players[*].id` to `PlayerId` (u64, `owner_i64` z `p.get()`), wiec wlasciciel
ujemny (barbarzyncy -1, rebelianci -99) nie moze wystapic w danych, ktore mapuje `siege_inputs_from_playable` —
regula nie ma dzis wejscia. Dlug **D-ADP-L-BARB** (T7/#369): gdy barbarzyncy/rebelianci wejda do stanu
grywalnego (osobny magazyn w `state.rs`/`barbarians.rs`), adapter ma dodac ich do jednostek i traktowac
`is_barbarian(a) || is_barbarian(b)` jako wojne (`OwnerRelations::are_enemies`), z wektorem pinu. Nie wymyslam
mapowania przed istnieniem danych.

### N3 — PRZYJMUJE jako decyzja techniczna i dlug
**D-ADP-11 (zrodlo prawdy sojuszu):** pin pyta `hasAllianceDealBetween` (`main.ts:22648-22651`: aktywna umowa
`sojusz_pelny`/`sojusz_defensywny`/`SojuszWojskowy`). Port czyta `RelationStatus::Alliance`, ktory jest
synchronizowany z umow w krokach tury (`turn_war_dipl_steps.rs:280-297`: umowa sojusznicza -> `Alliance`, NAP ->
`Peace`, wojna nienadpisywana). Adapter pozostaje czystym mapowaniem statusu (bez wlasnej logiki umow).
Dlug **T7-SOJUSZ-UMOWA** (#369): przy wpieciu w most (T7) wywolac szturm po synchronizacji statusu z umow albo
czytac umowy wprost (`state.deals` + `kind.is_alliance()`); test: umowa zawarta w tej samej turze przed szturmem.

## Mutanty Evaluatora po obronie (skrypt `02-evaluator-mutanty.py`, sciezka worktree zmieniona; werdykt = `cargo test --test p6_k5loop_adapter`)

| ID | Mutacja | r1 Evaluator | Po obronie | Test zabijajacy |
|---|---|---|---|---|
| E01 | wojna z `Alliance` | PRZEZYL | ZABITY | `stan_gry_wojna_sojusz_mury_postep` |
| E02 | `maMur` bez `mury_kamienne` | PRZEZYL | ZABITY | `stan_gry_wojna_sojusz_mury_postep` |
| E03 | `hp = None` | PRZEZYL | ZABITY | `stan_gry_wojna_sojusz_mury_postep` |
| E04 | `battles_survived = None` | PRZEZYL | ZABITY | `stan_gry_wojna_sojusz_mury_postep` |
| E05 | `garnizon > 0` -> `>= 0` | PRZEZYL | ZABITY | `adapter_zgodny_z_tekstem_pinu` (s13) |
| E06 | cywile atakujacego | ZABITY | ZABITY | `adapter_zgodny_z_tekstem_pinu`, `roster_atakujacego_bez_listy_wlascicieli` |
| E07 | bez przestawienia rosteru szturmu | PRZEZYL | ZABITY | `adapter_zgodny_z_tekstem_pinu` (s12) |
| E08 | `militiaEraKey >= 3` -> `> 3` | ZABITY | ZABITY | `adapter_zgodny_z_tekstem_pinu` |
| E09 | `buildMilitiaDef` bez `min(base)` | PRZEZYL | ZABITY | `definicja_milicji_wiersze_syntetyczne_jak_pin` |
| E10 | general atakujacego nie blokuje | ZABITY | ZABITY | `adapter_zgodny_z_tekstem_pinu` |
| E11 | `dry_col` -1 -> 0 | ZABITY | ZABITY | `niezmienniki_wejsc_ciala` |
| E12 | bez `tower_range` | ZABITY | ZABITY | `wejscia_ciala_do_prodbody` |
| E13 | `towerRange` 2 -> 0 | ZABITY | ZABITY | `bez_obwarowania_brak_wiezyczek` |
| E14 | `InvalidGate` bez kolumny | ZABITY | ZABITY | `brama_bez_hp_to_jawny_blad` |
| E15 | Z4 bez NaN | PRZEZYL | ZABITY | `niezmienniki_wejsc_ciala` |
| E16 | `clamp_era` 3 -> 4 | ZABITY | ZABITY | `clamp_era_jak_pin` |
| E17 | machiny z `city.owner_id` | PRZEZYL | ZABITY | `adapter_zgodny_z_tekstem_pinu` (`atkOwners`) |
| E18 | odnowa Milicji `> 0` -> `> 1` | PRZEZYL | ZABITY | `adapter_zgodny_z_tekstem_pinu` (s15) |
| E19 | bez `ranged_base` | PRZEZYL | ZABITY | `wejscia_ciala_do_prodbody` (wartownicy) |
| E20 | `num_of`: napis = 0 | PRZEZYL | ZABITY | `definicja_milicji_wiersze_syntetyczne_jak_pin` |

Wynik: **20/20 ZABITYCH** (`SUMMARY killed=20 total=20 survived=[]`; log `scratchpad/adapter/emut_obrona.log`, ~47 s/mutant).
Kod produkcyjny nie byl zmieniany, wiec mutanty Operatora M01–M31 (31/31 zabite w r1d) zachowuja waznosc — dopisane
zostaly wylacznie asercje.

## Bramki

__BRAMKI__

## Dlugi (uzupelnienie)
- D-ADP-L-BARB (N2), T7-SOJUSZ-UMOWA (N3) — jak wyzej; pozostale dlugi bez zmian wobec `01-operator-r1.md`.

# R-RUSTPORT-P6-BATTLE-SETUP-UNITS-Q1 — Final Control, runda 1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-BATTLE-SETUP-UNITS-Q1
GOAL: port rozstawienia jednostek (_placeUnits / _placeSiegeDefenders / _repositionSiegeAttackers + initialBattleSlots)
      wg pinu 07d2fbd72, pozycje bajt w bajt z wykonaniem tekstu pinu
ZMIANY/COMMIT: oceniany stan c87774ad3 (kod e3ec2d944 = kod Operatora 3beb05068 + poprawki Obrony r1; galaz
      rust-port-wip/bsetupunits-ob1; baza dispatchu 789d49bd8). FC nie zmienia kodu; ten raport = jedyny nowy plik
      (galaz rust-port-wip/bsetupunits-fc1, bez push).
TESTY: fmt EXIT 0; clippy --all-targets -D warnings EXIT 0; p6_battle_setup + p6_battle_setup_units + bridge_contract
      = 15 + 7 + 9 passed EXIT 0; generator odtworzony (MD5 identyczne); pelny cargo test --all-targets --no-fail-fast
      partiami: 538 binarek, 4051 passed, 0 failed, 1 ignored (istniejacy); 16 mutantow FC: 15 zabitych, 1 rownowazny
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (merge-tree z aktualnym parity-v2 25ce36748 czysty) + pelna bramka po merge'u
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Baza, pochodzenie, allowlista, zakazy (sprawdzone samodzielnie)

* `git merge-base --is-ancestor 789d49bd8 c87774ad3` = prawda; baza = SHA z dispatchu. Lancuch:
  `3beb05068` (Operator kod) → `253a5565c` (raport) → `8ada97582` (Evaluator FAIL) → `e3ec2d944` (Obrona kod) →
  `c87774ad3` (raport Obrony).
* `git diff --stat 789d49bd8 c87774ad3`: `battle_setup_units.rs`, `battle_setup_units_formation.rs`, 2 linie `pub mod`
  w `domain/mod.rs`, `tests/p6_battle_setup_units.rs`, `p6_battle_setup_units_gen.mjs`,
  `p6_battle_setup_units_vectors/{vectors,renderer_parity}.json`, raporty runu (01/02/02a). Wszystko w allowliscie.
  T5a `battle_setup*.rs`, `siege_tactics_loop.rs`, `renderer/`, `view-model/`, `bridge.rs`, `Cargo.*`, `gra/**`,
  `REJESTR-RUST.md` nietkniete.
* Brak `#[ignore]` w nowych plikach. Trailery wszystkich 5 commitow: wylacznie `Claude-Session:` (bez Co-Authored-By
  z nazwa modelu). Brak push/deploy.
* `git merge-tree --write-tree origin/rust-port/parity-v2 c87774ad3` (parity-v2 = `25ce36748`, T2a): bez konfliktow.

## 2. Bramki odtworzone przez FC

Worktree `wf_61a2a56a-82f-4`, sparse `rust-port dyspozycje src-tauri`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0
CARGO_PROFILE_TEST_DEBUG=0`, target w scratchpadzie `bsetupunits/fc/target`.

| Bramka | EXIT | Wynik |
|---|---|---|
| `cargo fmt --check` | 0 | — |
| `cargo clippy --all-targets -- -D warnings` | 0 | — |
| `cargo test --test p6_battle_setup --test p6_battle_setup_units --test bridge_contract` | 0 | 15 + 7 + 9 passed (units 2,1 s; straznik 90 s nie zadzialal) |
| `node rust-port/engine/tests/p6_battle_setup_units_gen.mjs` | 0 | straznik SHA pinu przechodzi; 186 przypadkow, 22 pola; MD5 `vectors.json` `1ca6b28a…`, `renderer_parity.json` `ab288df6…` = raport Obrony; `git status` czysty |
| pelny `cargo test --all-targets --no-fail-fast` (`setsid nohup`, `--lib --benches` + 14 partii po 40 `--test`, binarki usuwane po partii) | 0 po korekcie | 538 binarek: 4051 passed, 0 failed, 1 ignored (istniejacy `p6_order_lane::e2e::dump_tick1_econ_for_web_generator`) |

Uwaga do pelnego testu: pierwszy przebieg FC mial sparse zawezony do katalogu tego runu i 6 testow
(`p6_m00_skeleton` x5, `p6_m16_doc` x1) padlo na braku plikow `dyspozycje/autobot/runs/R-RUSTPORT-P6-M00…` w checkoutcie
(artefakt FC, nie tematu). Po poszerzeniu sparse do `dyspozycje` (jak w dispatchu) oba binarki: 5 + 1 passed, EXIT 0.
Suma = 4045 + 6 = 4051, identycznie jak u Evaluatora i Obrony.

## 3. Zgodnosc z pinem (czytane `git show 07d2fbd72:gra/src/battle/battleScene.ts`)

Porownane linia po linii przez FC: `_repositionSiegeAttackers` (`:4427-4434`, puste cialo — w Rust `const fn` no-op,
wolany), `_placeSiegeDefenders` (`:4442-4744`: podzial wall/melee/archer/defCata/rest, `DEFENSE_HALF_SPAN = 12`,
`CATA_HALF_SPAN = 4`, pomijanie rzedow bramy `gate-1..gate`, `Math.round(ci*(len-1)/(n-1))` / `Math.floor((len-1)/2)`,
`getRowForUnit` z `step = (len-1)/max(1, n-1)`, kolejnosc korony melee → lucznicy → katapulty, reszta
`rearCol = min(BF_COLS-1, wallCol+2+floor(off/span))`, `rearRow = rLo + off % max(1, span)`, `placeOne` z `+dr` przed
`-dr` i petla `dc < 5` po `rLo..rHi`), `_placeUnits.place` (`:5288-5380`: `tileScore` z premiami jazdy 6/3/-4 i piechoty
40/20/-15, pasma skrzydel z `Infinity`, pasmo deploy gracza `±8`, odciecie `140 - 3|dr| <= best`, kandydaci `[fwd]` dla
jazdy) oraz `initialBattleSlots` (`formationRules.ts`, wiersze calkowite — `midRow` calkowite, `floor`/`ceil`).
Nie znalazlem rozbieznosci. Rozbieznosc dzielenia przy `rHi < rLo` jest poza geometria pinu i opisana w
doc-komentarzu `place_siege_defenders` (N3).

## 4. Kryteria konca dispatchu

| Kryterium | Stan | Dowod |
|---|---|---|
| >= 8 scenariuszy siegeMode, liczności 0/1/ponad limit/NaN/Inf, jazda/lucznicy/machiny, mur/palisada/cytadela, wieze | spelnione | asercja `siege_named >= 8` w `rozstawienie_identyczne_z_pinem`; S8 `nan-liczebnosc-mur`, S9 `inf-liczebnosc-mur` (NaN/Inf wchodza do siatki T5a, nie do `_placeUnits`, ktore bierze tablice — argument Operatora §2 sprawdzony); liczniki `przypadki_ponad_limit >= 3`, `przypadki_pusta_strona >= 4`, `korona_katapulta >= 10` |
| >= 100 losowych wywolan bajt w bajt, kolejnosc jak pin | spelnione | asercja `random >= 100`; porownanie pelnych `PlacedUnit` i wpisow `occByKey` w kolejnosci `Map` |
| test z konsumentem renderera tylko przez fiksture JSON | spelnione | `fikstura_renderera_max_per_side` czyta wylacznie `renderer_parity.json` (po N1 Evaluatora); 120 vs 500 = dlug D-T5b-4 (DTO-BRIDGE) |
| mutanty >= 12, zabite albo jawnie rownowazne | spelnione | Operator 28 (26 + 2 rown.), Evaluator 31 (+ 4 przezyle zabite w Obronie), FC 16 (§5) |
| straznik czasu 90 s, dokladne nazwy licznikow | spelnione | `TIME_GUARD_SECS = 90` + `with_timeout`; 29 nazwanych licznikow z progami w `pokrycie_galezi_rozstawienia` |
| RNG | spelnione | pin nie uzywa RNG w rozstawieniu; generator podmienia `Math.random` na wyjatek (0 wywolan, D-BS-3) |

## 5. Mutanty Final Control (wlasne, inne niz M01-M28 / E01-E33; kopia `rust-port` w scratchpadzie, `cargo test --test p6_battle_setup_units`)

| ID | Mutant | Wynik |
|---|---|---|
| F01 | premia jazdy Plains `+6` → `+7` | ZABITY |
| F02 | kara piechoty Forest `-15` → `-14` | ZABITY |
| F03 | petla `extra` `0..10` → `0..9` | ZABITY |
| F04 | pasmo deploy gracza `ir - 8` → `ir - 7` | ZABITY |
| F05 | gorne skrzydlo `ir - 6` → `ir - 5` | ZABITY |
| F06 | dolne skrzydlo `bodyMax + 5` → `+ 4` | ZABITY |
| F07 | jedna katapulta obroncy: `floor((len-1)/2)` → `ceil` | PRZEZYL — rownowazny (ponizej) |
| F08 | pomijanie bramy `r <= gateHi` → `r < gateHi` | ZABITY |
| F09 | `rearCol = wallCol + 2` → `+ 1` | ZABITY |
| F10 | `placeOne` `dc < 5` → `dc < 4` | ZABITY |
| F11 | premia jazdy Ford `+3` → `+2` | ZABITY |
| F12 | `step` korony: `max(1, n-1)` → `max(1, n)` | ZABITY |
| F13 | `per > wingRankWidth` → `>=` | ZABITY |
| F14 | `rankSize = min(per, len - rank*per)` → `per` | ZABITY |
| F15 | premia piechoty Ford `+20` → `+19` | ZABITY |
| F16 | `centerLo = max(rLo, mid - 12)` → `mid - 11` | ZABITY |

F07 rownowaznosc: jedyna osiagalna geometria muru (`rLo 0`, `rHi 155`, `gate 77`) daje `centerLo..centerHi = 65..89`,
`cataLo..cataHi = 73..81`, po usunieciu rzedow bramy 76-77 pula katapult ma zawsze 7 rzedow (niepusta, wiec fallback na
`wallRows` nieosiagalny); `(7-1)/2 = 3` jest calkowite, `floor == ceil`. Wynik identyczny dla kazdego wejscia z pinu.

## 6. Orzeczenia

| # | Zarzut / uwaga (zrodlo) | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| Z1 | E16 przezyl (Evaluator) | ODDAL | zabity wektorami `R2-E16-*` (Obrona); licznik `pasmo_granica_wierszy_gry = 10` z progiem; FC potwierdza testami |
| Z2 | E12 przezyl | ODDAL | zabity polem `synt-pas-skrzydlo-dol` + `R2-E12-*`; prog `PROG_DOLNE_SKRZYDLO` |
| Z3 | E32 przezyl | ODDAL | zabity `R2-E32-*`; prog `PROG_DOWODCY_NAJSZERSI` |
| Z4 | E27 przezyl (javelin/archer/slinger) | ODDAL | zabite `R2-E27-*`; trzy liczniki `rola_z_kategorii_*` z progiem 20 |
| Z5 | argumenty E03/E10/E30 | ODDAL | argumenty Obrony §3 sprawdzone przez FC na kodzie i pinie — poprawne dla geometrii pinu |
| N1 | test czyta `renderer/` | ODDAL | naprawione w Obronie; test czyta tylko fiksture JSON |
| N2 | `ranged` jako gotowa flaga, `attackRange` nieportowany | ODDAL | jawny dlug D-T5b-1 (T6), zgodny z dispatchem (producent DTO/adapter = T6) |
| N3 | `place_siege_defenders` publiczne, `rHi < rLo` | ODDAL | poza pinem; doc-komentarz + `debug_assert!` |
| N4 | komentarz generatora przed S18 | ODDAL | poprawiony w Obronie |
| F07 | mutant FC przezyl | ODDAL | rownowazny (§5) |
| FC-N1 | testy `p6_m00_skeleton`/`p6_m16_doc` wymagaja `dyspozycje/` w checkoutcie | ODDAL (uwaga procesowa) | istniejace testy spoza tematu; dispatch i tak nakazuje sparse z `dyspozycje`; nie dotyczy kodu tematu |

Brak orzeczen NAPRAW i DO DECYZJI CZLOWIEKA.

## 7. Dlugi (do rejestru, przez orkiestratora)

D-T5b-1..7 z `01-operator-r1.md` §7 aktualne: T6 producent `SetupUnit`/`BattleSetupDto` i `attackRange`; T6/#369 pola
runtime (morale ×1,5, zasieg katapulty na koronie, `_applyTerrainRange`); #369 wpiecie pozycji i `FieldMoveTerrain` w
`ProdBody`; DTO-BRIDGE `MAX_PER_SIDE` 120 (renderer) vs 500 (pin); `DLUG-FORMATION-RULES-WINGRANK` (duplikat
`formation_rules.rs` bez `wingRank`); `_placeUnitsOneSide` (deploy UI); snapshoty replay. Dodatkowo z Obrony: wolajacy
`place_siege_defenders` (T6) przekazuje wylacznie mur z `setup_battle_field`.

## 8. Dysk i sprzatanie

Wolne na starcie 14 GB, minimum w trakcie 11 GB. Target FC (`bsetupunits/fc/target`), kopia mutacyjna
(`bsetupunits/fc/mut`, `bsetupunits/fc/mut-target`) usuniete po bramkach.

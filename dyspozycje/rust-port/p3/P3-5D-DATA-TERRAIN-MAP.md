# P3-5D — Dane terenu i mapy: JSON -> struktury Rust (R-RUSTPORT-P3-5D-DATA-TERRAIN-MAP-Q1)

STATUS: Operator, runda 1/5 — wykonane, czeka na Evaluatora.
DOMAIN: GAME
BAZA: `origin/rust-port/parity-v2` @ `9e33fc779c81e7ccf3a824eab0ec11f7cd1d82a9` (worktree na tej bazie)
PIN DANYCH: `gra/data/*.json` odczytane na `edb8fb56`. Dla czterech plikow blob w bazie `9e33fc77` jest identyczny
(`git diff --stat edb8fb56 9e33fc77 -- gra/data` pokazuje zmiany tylko w `civ-matrix.json`, `civs.json`, `units.json`).

## 1. Zakres i allowlista

| Sciezka | Status | Uwagi |
|---|---|---|
| `rust-port/engine/data/terrain-improvements.json` | NOWY (kopia 1:1) | blob `cd54b28b3d35fa6e7adb8e4be2d2fee913a2055b` = `edb8fb56:gra/data/terrain-improvements.json` |
| `rust-port/engine/data/terrain-movement.json` | NOWY (kopia 1:1) | blob `021d28d9a6c1374ae9717a38e39bdd664cda6f7a` = pin |
| `rust-port/engine/data/terrain-yields.json` | NOWY (kopia 1:1) | blob `f366fc21676b6781adbc52ad60079c7729046b98` = pin |
| `rust-port/engine/data/map-gen-params.json` | NOWY (kopia 1:1) | blob `125e23f8286db47ae325a3d4fec1ce8318f300ff` = pin |
| `rust-port/engine/src/data/terrain_map.rs` | NOWY | struktury `#[derive(Deserialize)]` + `include_str!` + funkcje `parse_*` |
| `rust-port/engine/tests/data_terrain_map.rs` | NOWY | 4 testy (po jednym na plik) z `#[path = "../src/data/terrain_map.rs"]` |
| `dyspozycje/rust-port/p3/P3-5D-DATA-TERRAIN-MAP.md` | NOWY | ten dokument |
| `dyspozycje/autobot/runs/R-RUSTPORT-P3-5D-DATA-TERRAIN-MAP-Q1/` | NOWY | raport Operatora + pelny log cargo test |

Nietkniete (zgodnie z dispatchem): `rust-port/engine/src/lib.rs`, `src/domain/mod.rs`, `src/domain/map_generator.rs`,
`Cargo.toml`, wszystkie istniejace pliki `.rs`, `gra/**`, `earth-mask-source.png`, `WERSJE.md`.
`Cargo.lock` wygenerowany przez build zostal usuniety (nieblokowany w repo, poza allowlista).

Modul `terrain_map.rs` NIE jest podpiety do `lib.rs` (zakaz w dispatchu). Test laduje go przez `#[path]`;
`serde` (feature `derive`) i `serde_json` (dev-dep) sa dostepne dla testow integracyjnych bez zmiany `Cargo.toml`.
`include_str!` w module uzywa sciezki `../../data/<plik>.json` (wzgledem `src/data/`).

## 2. Projekt struktur (1:1 z ksztaltem JSON)

Kazda struktura ma `#[serde(deny_unknown_fields)]`: test wykrywa kazdy klucz JSON, ktorego struktura nie odwzorowuje,
oraz brak wymaganego pola. Klucze niebedace poprawnymi identyfikatorami Rust (`Żywność`, `Kamień`, `decyzje_MIASTO`,
`klucze_surowcow_ASCII`, `super`, `upgradeFrom`, `surowiecOdblokowany`, `forestExtra`) sa mapowane przez `#[serde(rename)]`.
Nazwy pol pozostaja zgodne z JSON (np. `surowiec_ilosc_tura`, `praca_per_tura`, `_meta`, `_opis`).

- `terrain-improvements.json`: `TerrainImprovementsFile` z 23 polami rekordow (`farma` ... `posterunek`) + `_meta` + `_miasto_zasieg_ref`.
  Rekord `Improvement` ma pola wspolne (`nazwa`, `epoka`, `bonus`, `teren`, `warunek`, `koszt_praca: f64`, `odblokowuje`, `historia`)
  i opcjonalne (`surowiec_ilosc_tura`, `typ`, `wycinka`, `cywilizacje`, `bonus_ruch`, `upgradeFrom`, `zasieg_*`, ...).
  `ImprovementBonus` ma opcjonalne `zywnosc|praca|handel|pieniadz|kamien|glina` (bo `fort` i `posterunek` maja `{}`).
- `terrain-movement.json`: `TerrainMovementFile { costs: MovementCosts { Laka, Rownina, ... }, forestExtra }`.
- `terrain-yields.json`: `TerrainYieldsFile { terrain_types: Vec<TerrainTypeYield>, terrain_modifiers: Vec<TerrainModifierYield> }`
  (`Uwagi: Option<String>` — `null` dla Pustyni).
- `map-gen-params.json`: `MapGenParamsFile` z zagniezdzonymi `Gestosc`, `MapaSkala`, `Generator`, `DepositRules`,
  `MetalDepositMinEra`; generyczne `Tier3<T>` (low/medium/high) i `SizeTier<T>` (mala..super).

## 3. Rozstrzygniecie pytania tartak / kamieniolom (P1-16D-OPISY-EKONOMIA5X)

Pytanie: czy `tartak` i `kamieniolom` produkuja 50 czy 200 surowca/ture.

FAKTYCZNA wartosc w `gra/data/terrain-improvements.json` (pole `surowiec_ilosc_tura`, odczyt testem):

- `tartak.surowiec_ilosc_tura = 200` (test: `Some(200)`)
- `kamieniolom.surowiec_ilosc_tura = 200` (test: `Some(200)`)

Rozjazd z proza, NIE skorygowany (zakaz zmiany danych):

- `_meta.pole_surowiec_ilosc_tura` deklaruje „Tartak->drewno 50 (bylo 10)”, „Kamieniolom->kamien 50”, po skali ×5 z 2026-08-13.
- `tartak.surowiecOdblokowany_uwaga` konczy sie „×5 → 50/turę (było 10/turę)”.
- `kamieniolom.surowiecOdblokowany_uwaga` mowi „produkcja terytorialna bazowo 200/turę, skalowana +50% za epokę”
  (zgodne z liczba 200 w polu, ale z osobna, nieopisana w polu regula +50%).

Wniosek: pole liczbowe w pliku ma wartosc 200 dla obu rekordow; prozy `_meta` i `uwagi` mowia 50 dla tartaku
(i dla kamieniolomu w `_meta`). Ktory z tych zapisow jest zamierzony, rozstrzyga wlasciciel danych (Maciej), nie Operator.
Kopia 1:1 zachowuje 200. Rozjazd jest potwierdzony testem, nie domyslem.

Dodatkowo (P2-9): w `wyrab.wycinka` pole nazywa sie `praca_per_tura = 50`, a wg `uwagi` i `warunek` to jednorazowe +50 DREWNA
(`tury = 1`). Nazwa mylaca, zachowana 1:1 i odnotowana; nie zmieniana.

## 4. Spot-checki (z pliku, nie z pamieci)

| Plik | Pole | Wartosc odczytana |
|---|---|---|
| terrain-improvements | `tartak.surowiec_ilosc_tura` | 200 |
| terrain-improvements | `kamieniolom.surowiec_ilosc_tura` | 200 |
| terrain-improvements | `tartak.bonus.praca` / `kamieniolom.bonus.praca` | 3 / 1 |
| terrain-improvements | `wyrab.wycinka.praca_per_tura` | 50 |
| terrain-movement | `costs.pustynia` / `costs.gory` / `forestExtra` | 2 / 99 / 1 |
| terrain-yields | `terrain_types[0].Teren` / `Suma` | Łąka / 8 |
| terrain-yields | `terrain_modifiers[0].Modyfikator` / `Glina` / `Suma` | Rzeka / 5 / 13 |
| map-gen-params | `gestosc.surowce_mult.medium` | 1.0 |
| map-gen-params | `generator.rozmiar_dims.standardowy` | [168, 120] |
| map-gen-params | `deposit_rules.cyna.rarity` / `metal_deposit_min_era.cyna` | 0.06 / 2 |

## 5. Surowe logi cargo test

Srodowisko: `rustc 1.97.0`, `cargo 1.97.0` (`/root/.cargo/bin`). Dysk `/` byl zapelniony (43 MB wolne przy pierwszym buildzie),
dlatego build szedl z `CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 CARGO_INCREMENTAL=0` i poza worktree
(`CARGO_TARGET_DIR` w scratchpadzie). Nie zmienia to semantyki testow, tylko rozmiar artefaktow debug.

### 5.1 Test celowany (`cargo test --test data_terrain_map -- --nocapture`), exit 0

```text
(poczatek logu pominiety: kompilacja zaleznosci serde/serde_json/syn, bez ostrzezen)
   Compiling serde_derive v1.0.229
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_23193283-2cc-1/rust-port/engine)
    Finished `test` profile [unoptimized] target(s) in 11.79s
     Running tests/data_terrain_map.rs (.../scratchpad/p3-5d/target/debug/deps/data_terrain_map-11866f385f7047e3)

running 4 tests
SPOT movement.costs.pustynia=2 movement.costs.gory=99 forestExtra=1
SPOT map-gen.gestosc.surowce_mult.medium=1 generator.rozmiar_dims.standardowy=[168, 120] deposit_rules.cyna.rarity=0.06 metal_deposit_min_era.cyna=2
test terrain_movement_parses_and_spot_checks ... ok
SPOT yields.terrain_types[0]=Łąka suma=8 | modifiers[0]=Rzeka glina=5 suma=13
test map_gen_params_parses_and_spot_checks ... ok
test terrain_yields_parses_and_spot_checks ... ok
SPOT tartak.surowiec_ilosc_tura=Some(200) kamieniolom.surowiec_ilosc_tura=Some(200) tartak.bonus.praca=Some(3) kamieniolom.bonus.praca=Some(1)
test terrain_improvements_parses_and_spot_checks ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

### 5.2 Pelny `cargo test` w `rust-port/engine/` (wszystkie cele), exit 0

Pelny log: `dyspozycje/autobot/runs/R-RUSTPORT-P3-5D-DATA-TERRAIN-MAP-Q1/cargo-test-full.log`.
Wyniki `test result` (28 wierszy, wszystkie `ok`, 0 failed): suma testow = **228** = 224 (baza P3-1-2) + 4 nowe.
Brak ostrzezen kompilacji w logu. Jedyny wiersz `0 passed` to doctest/lib bez testow.

```text
EXIT=0
```

## 6. Ograniczenia i uwagi

- Modul nie jest w `lib.rs`: dane sa parsowane i testowane, ale nie sa jeszcze czescia API crate'a. Podpiecie = osobny temat konsolidacyjny.
- Plik `earth-mask-source.png` nie zostal ruszony (P3.8, poza zakresem).
- Generator swiata (`map-gen-params.json` jako dane wejsciowe) NIE jest naprawiany — poza zakresem (P2-4).
- Brak `Cargo.lock` w repo: build rozwiazuje zaleznosci online; nie commitowano.
- PUSH: NIE WYKONANO. Zero zmian w `gra/**`.

DEPLOY/PUSH: NIE WYKONANO

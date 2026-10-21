# P3-5B — Dane jednostek i walki 1:1 (R-RUSTPORT-P3-5B-DATA-UNITS-COMBAT-Q1)

STATUS: wynik Operatora, runda 1/5.
BAZA: `origin/rust-port/parity-v2` @ `e72c74f7` (HEAD zdalny w chwili pracy; dispatch podawał `9e33fc77`, który jest starszy, więc użyto najnowszego HEAD zgodnie z zleceniem orkiestratora).
PIN DANYCH: `gra/data/*.json` czytane na `edb8fb56`, zgodnie z dispatchem. Na HEAD zdalnym `units.json` i `civs.json` różnią się od pinu, więc kopie w tym temacie pochodzą wyłącznie z `edb8fb56`.
GŁÓWNE NIE-DOTYKANE: `rust-port/engine/src/lib.rs`, `src/domain/mod.rs`, `src/domain/recruitment.rs`, `Cargo.toml`, wszystkie istniejące `.rs`, `gra/**`.

## 1. Zakres (allowlista z dispatchu)

| Ścieżka | Status | Opis |
|---|---|---|
| `rust-port/engine/data/units.json` | NOWY | kopia 1:1 z `edb8fb56:gra/data/units.json` |
| `rust-port/engine/data/combat-params.json` | NOWY | kopia 1:1 |
| `rust-port/engine/data/terrain-combat.json` | NOWY | kopia 1:1 |
| `rust-port/engine/data/counters.json` | NOWY | kopia 1:1 |
| `rust-port/engine/data/auto-battle-params.json` | NOWY | kopia 1:1 |
| `rust-port/engine/data/power-params.json` | NOWY | kopia 1:1 |
| `rust-port/engine/src/data/units_combat.rs` | NOWY | struktury `#[derive(Deserialize)]` + `include_str!` + funkcje `parse_*` |
| `rust-port/engine/tests/data_units_combat.rs` | NOWY | 6 testów, ładowanie przez `#[path]` |
| `dyspozycje/rust-port/p3/P3-5B-DATA-UNITS-COMBAT.md` | NOWY | ten dokument |
| `dyspozycje/autobot/runs/R-RUSTPORT-P3-5B-DATA-UNITS-COMBAT-Q1/01-operator.md` | NOWY | raport etapu |

Istniejące pliki `.rs`, `Cargo.toml`, `lib.rs`, `domain/*` pozostały nietknięte. `Cargo.lock` powstał lokalnie przy buildzie (plik nie jest w repo i nie jest w allowliście), więc nie został dodany do commita.

## 2. Weryfikacja kopii 1:1

Skróty SHA-256 kopii w worktree zgadzają się z `dyspozycje/rust-port/manifest-gra-edb8fb56.sha256.tsv` dla wszystkich sześciu plików:

```text
d2f9916011c2adc151dd1df818631b4426d3df1ae9b5ca2d7c3c8f99c9a625fe  units.json            (manifest: zgodny)
5495e41eac2189045e7115e862d41a87a5190846bad90532ba81b3c1613d08c1  combat-params.json    (manifest: zgodny)
b5f0f9c5c25a65273bc674d1ae1121ab09d93141085eb0c1a9b1bc911798f9bf  terrain-combat.json   (manifest: zgodny)
e15e1d8b0e72018851fd981cb7d7c0f140e20b8b78914f788610ef4e672060e8  counters.json         (manifest: zgodny)
feedc4799f6add78106de7699434b030f2314946dbbbb67d59c357ba9f2c5eb5  auto-battle-params.json (manifest: zgodny)
158f920c2ea39afb52834ee33768d063d2f46c9829110e1f429c96cab1e7af1c  power-params.json     (manifest: zgodny)
```

## 3. Kształt danych (odczytany z faktycznej zawartości, nie z pamięci)

- `units.json`: tablica 75 rekordów, 61 unikalnych kluczy. Klucze nie są jednolite: `piercing`, `armor`, `chargeBonus` mają 50 rekordów, `wallAttack` i `siegePower` po 4. Pola `Ruch w bitwie (heksy)`, `Zasięg ataku (hex)`, `Ilość pocisków`, `Kara obrony z flanki (%)` i `Kara obrony z tyłu (%)` mieszają liczby z `"—"`, więc mają typ `IntOrText` (untagged). `Kultura`, `Surowiec`, `Uwagi`, `Utrzymanie surowiec` mogą być `null`, więc są `Option<String>`. `fieldPower` bywa `17.5`, więc jest `f64`. Każdy rekord ma `Top3` z 3 obiektami `{tytul, tekst}`.
- `combat-params.json`: 12 sekcji, zagnieżdżone obiekty z kluczami `_opis` i polem `oblężenie` (z `ę`).
- `terrain-combat.json`: tablica 7 rekordów, klucze tekstowe (w tym `Δ Zasięg (dystansowi)`).
- `counters.json`: tablica 17 reguł, 5 pól tekstowych.
- `auto-battle-params.json`: `_maciej_kroki` to lista 3 stringów, `straty` ma klucze `L_MAX` i `L_MIN` (w strukturze mapowane przez `rename`).
- `power-params.json`: 8 sekcji najwyższego poziomu. `mnoznikEpoki` ma klucze `"1".."10"` (mapowane na `ep1..ep10`). `opcje.*.wartosc` mieszają bool i string (`BoolOrText`).

Każda struktura ma `deny_unknown_fields`. Brakujący lub nieodwzorowany klucz powoduje błąd parsowania, więc test wykrywa rozjazd.

## 4. Liczby kontrolne liczone niezależnie

Test liczy rekordy z surowego `serde_json::Value` i porównuje z długością wektora po deserializacji. Nie przepisuje liczb z P2.9.

- `units`: 75 rekordów (raw = typed), 75 unikalnych nazw. Epoki: Kamień 10, Brąz 40, Żelazo 25.
- `counters`: 17 reguł (raw = typed).
- `terrain-combat`: 7 rekordów (raw = typed).

## 5. Spot-checki (wartości z plików na pinie)

| Plik | Pole | Wartość |
|---|---|---|
| units | Wojownik `Pieniądz (koszt)` / `Surowiec (ilość)` / `Surowiec` | 5 / 13 / Drewno |
| units | Wojownik `Atak` / `fieldPower` / `health` | 6 / 27 / 22 |
| units | Taran `siegePower` / `wallAttack` | 85 / 14 |
| combat-params | `macierz_v2.hit_base` / `counter_multiplier` | 35 / 1.5 |
| combat-params | `oblężenie.hill_defense_mult` / `mountain_defense_mult` | 1.5 / 1.75 |
| terrain-combat | Góry `Bonus Obrona` | +75% |
| counters | reguła [0] | Spearman → Mount, +50%, Atak, potwierdzone |
| auto-battle-params | `straty.L_MAX` / `kalibracja` | 0.42 / v2b-2026-06-30 |
| power-params | `skladniki.jednostka_wojskowa.pkt` / `kalibracja.powerOczekiwany` | 2.5 / 4655 |

Uwaga: wartość Wojownika `Pieniądz (koszt)` = 5 zgadza się z pinem `edb8fb56`. Rozjazd z `recruitment.rs` (Rust gold_cost = 10) jest znany z P2-9, nie został naprawiony i nie jest częścią tego tematu.

## 6. Surowe logi `cargo test`

Komenda, toolchain: `rustc 1.97.0`, `cargo 1.97.0`. Target poza repo (scratchpad), zwykły `cargo test` w `rust-port/engine/`, bez `--offline`.

### 6a. Test celowany (`cargo test --test data_units_combat -- --nocapture`), exit 0

```text
    Updating crates.io index
     Locking 17 packages to latest compatible versions
   Compiling proc-macro2 v1.0.107
   Compiling unicode-ident v1.0.27
   Compiling quote v1.0.47
   Compiling serde_core v1.0.229
   Compiling zmij v1.0.23
   Compiling once_cell v1.21.4
   Compiling serde v1.0.229
   Compiling tracing-core v0.1.36
   Compiling pin-project-lite v0.2.17
   Compiling serde_json v1.0.154
   Compiling memchr v2.8.3
   Compiling itoa v1.0.18
   Compiling syn v3.0.9
   Compiling syn v2.0.119
   Compiling serde_derive v1.0.229
   Compiling tracing-attributes v0.1.31
   Compiling tracing v0.1.44
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_9c66e929-2a9-1/rust-port/engine)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 15.17s
     Running tests/data_units_combat.rs

running 6 tests
SPOT auto-battle kalibracja=v2b-2026-06-30 L_MAX=0.42 p_atk=1.2 kroki=3
test auto_battle_params_parses_and_spot_checks ... ok
SPOT combat macierz_v2.hit_base=35 counter_multiplier=1.5 oblezenie.hill_defense_mult=1.5
SPOT counters rules=17 [0]=Spearman->Mount +50% Atak potwierdzone
SPOT power jednostka_wojskowa.pkt=2.5 powerOczekiwany=4655 tech_zbadane.pkt=80 mnoznik.ep10=1
test combat_params_parses_and_spot_checks ... ok
test counters_parses_and_spot_checks ... ok
test power_params_parses_and_spot_checks ... ok
SPOT terrain-combat rows=7 gory.bonus_obrona=+75% gory.kawaleria=NIEDOSTĘPNE dla kawalerii/rydwanów
test terrain_combat_parses_and_spot_checks ... ok
SPOT units count=75 epoki Kamien=10 Braz=40 Zelazo=25
SPOT units[0]=Wojownik koszt=5 surowiec=Some("Drewno") ilosc=13 atak=6 fieldPower=27 health=22
SPOT Taran siege_power=Some(85) wall_attack=Some(14)
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s
EXIT=0
```

### 6b. Pełny `cargo test` (regresja), exit 0

```text
$ cargo test    (rust-port/engine/, exit 0)
warnings: 0
test result: ok. 6 passed   (unittests src/lib.rs)
test result: ok. 11 passed  (tests/ai_turn.rs)
test result: ok. 10 passed  (tests/barbarians.rs)
test result: ok. 1 passed   (tests/bridge_add_player.rs)
test result: ok. 10 passed  (tests/building_costs.rs)
test result: ok. 10 passed  (tests/city_growth.rs)
test result: ok. 7 passed   (tests/combat.rs)
test result: ok. 4 passed   (tests/data_terrain_map.rs)
test result: ok. 6 passed   (tests/data_units_combat.rs)        <- NOWY
test result: ok. 31 passed  (tests/diplomacy.rs)
test result: ok. 8 passed   (tests/events.rs)
test result: ok. 10 passed  (tests/hex_terrain.rs)
test result: ok. 13 passed  (tests/improvements.rs)
test result: ok. 6 passed   (tests/map_generator.rs)
test result: ok. 11 passed  (tests/parity_suite.rs)
test result: ok. 8 passed   (tests/pathfinding.rs)
test result: ok. 7 passed   (tests/playable_slice.rs)
test result: ok. 7 passed   (tests/recruitment.rs)
test result: ok. 6 passed   (tests/replay.rs)
test result: ok. 5 passed   (tests/resource_production.rs)
test result: ok. 4 passed   (tests/rng.rs)
test result: ok. 6 passed   (tests/save_load.rs)
test result: ok. 2 passed   (tests/smoke.rs)
test result: ok. 10 passed  (tests/state_dto.rs)
test result: ok. 5 passed   (tests/steam_adapter.rs)
test result: ok. 9 passed   (tests/terrain_movement_fix.rs)
test result: ok. 12 passed  (tests/trade.rs)
test result: ok. 7 passed   (tests/turn_economy.rs)
test result: ok. 5 passed   (tests/unit_epoch.rs)
test result: ok. 0 passed   (doc-tests)
SUMA: 237 passed, 0 failed
```

## 7. Blokady i uwagi

- Brak blokad na wykonaniu zadania.
- Dispatch podawał bazę `9e33fc77`; użyto HEAD zdalnego `e72c74f7`, bo orkiestrator zlecił najnowszy HEAD. Gałąź operatora: `op-R-RUSTPORT-P3-5B-DATA-UNITS-COMBAT-Q1`.
- Źródłowe pliki P2-9 i P3-1-2 istnieją w głównym checkoutcie, ale nie są śledzone na `parity-v2`. Użyto ich jako kontekstu tylko do odczytu.
- `Cargo.toml` nie zmieniano. `serde_json` jest dev-dependency, a parsery są ładowane wyłącznie przez `#[path]` w teście, tak jak w P3-5D.
- Rozjazd `units.json` ↔ `recruitment.rs` (P2-9) pozostaje nierozwiązany, zgodnie z zakazem w dispatchu.

## 8. Dodatkowe ryzyka do konsolidacji (poza tym tematem)

- `units.json` na HEAD zdalnym różni się od pinu `edb8fb56` (wartości jednostek w `civs.json` i `units.json` zmieniły się). Konsolidacja musi wskazać, który pin obowiązuje.
- Struktury mają `IntOrText` i `Option` tam, gdzie dane są niejednorodne. Późniejsze użycie w domenie powinno je zawęzić, a nie zmieniać kopie JSON.

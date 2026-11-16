# R-RUSTPORT-P4-1F3-SIEGE-WONDER-VIEW — Final Control (runda 1)

```text
STATUS: FAIL (INFRA: bramki niedokończone; merytorycznie zero NAPRAW)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1F3-SIEGE-WONDER-VIEW
GOAL: oblegane, siegeMachines.ready, placedWorldWonders w PlayableState z zapisem/odczytem + producenci sieges[]/wonders[] 1:1 z pinem 07d2fbd72
ZMIANY/COMMIT: oceniany kod Obrony 92dce8414 (nad Operatorem 81bb88670, baza 585bb48e0); FC dodaje tylko ten raport
TESTY: fmt --check EXIT 0; clippy --all-targets -D warnings i pełny cargo test --all-targets: NIE_ZMIERZONO (w trakcie kompilacji w chwili wymuszonego zamknięcia etapu)
BLOKADY: brak wyniku clippy i pełnego testu w tej rundzie FC
RUNDY: 1/5
NASTĘPNY KROK: powtórzyć FC (tylko bramki clippy + pełny test na 92dce8414); przy EXIT 0 => PASS-WITH-NOTES. Bez nowej rundy Operatora.
DEPLOY/PUSH: NIE WYKONANO
```

## Dlaczego FAIL

Etap FC został zamknięty, zanim skończyły się bramki: `cargo clippy --all-targets -- -D warnings` i
`cargo test --all-targets --no-fail-fast`. Uruchomiono je w tle (`setsid nohup`, `CARGO_TARGET_DIR` w scratchpadzie,
CARGO_INCREMENTAL=0, DEBUG=0, 14 GB wolnego). Kryterium końca 2 wymaga EXIT 0 obu bramek. Bez wyniku nie
wystawiam PASS. To FAIL infrastrukturalny, nie merytoryczny: w przeglądzie kodu nie znalazłem nic do naprawy.

## Sprawdzenia FC

- Allowlista (`git diff --name-only 585bb48e0 92dce8414`): `playable.rs`, `save_load.rs`, `overlays_view.rs` (NOWY),
  `mod.rs` (1 linia `pub mod overlays_view;`), `tests/view_overlays_siege_wonder{,_save}.rs` (NOWE), raporty runu.
  `view-model/`, `renderer/`, `gra/`, `Cargo.lock` bez zmian. OK.
- Brak `#[ignore]` i `should_panic`; `#[allow(dead_code)]` tylko przy modułach `#[path]` w teście zapisu. OK.
- `git diff --check 585bb48e0 92dce8414` czysto.
- Pin `07d2fbd72` sprawdzony samodzielnie: `main.ts:4199-4210` (wonderIsRuin/placedWonderSnapshot),
  `:17492-17530` (refreshSiegeMarkers, globalne `allMachinesByCamp`/`allCampOwners`), `:37450`, `:46459-46461`,
  `render/siegeCampSync.ts` (cały), `game/diplomacy-siege-war-gate.ts:72-79`. Port jest zgodny:
  `enemy_units_adjacent_to_city` = filtr `siegeAllowedBetween` + `hexDistance==1` w kolejności `units`;
  `camp_owner_at_hex` = `units.find(... ownerId !== cityOwnerId)`; `global_camp_owners` = `Map.set` (ostatni wygrywa,
  pozycja pierwszego wstawienia); `global_machines_by_camp` = konkatenacja `[...prev, ...kinds]`.
- Test obrony `global_camp_maps_last_city_wins_and_machines_concatenate` przeliczony ręcznie: per miasto 10→3, 20→1;
  globalnie 1; maszyny `[taran, wieza]`. Rozróżnia mutacje „pierwszy wygrywa” i „podmiana listy”.

## Werdykty zarzutów

| # | Zarzut | Werdykt FC | Uzasadnienie |
|---|---|---|---|
| E1 | globalne mapy obozów (main.ts:17509-17517) | ODDAL | Naprawione w Obronie (`global_camp_owners`, `global_machines_by_camp` + test). Zależność: adapter P4-1G Q5 (#236/#269) MUSI użyć tych funkcji — orkiestrator wpisuje do rejestru. |
| E2 | brak produkcyjnego pisarza nowych pól | ODDAL | Poza ZAKRESEM/allowlistą dispatchu (stan + zapis + producenci). Dług D-1F3-1..3 do rejestru (W8 → stan, budowa/przejęcie cudu → stan, ścieżka zapisu gry). |
| E3 | podwójne źródło `CityViewCityFacts.besieged` | ODDAL | `city_view.rs` poza allowlistą. Dług D-1F3-4. |
| E4 | `citySiege` tylko w Rust | ODDAL | Decyzja techniczna (zasada 9), opisana. Dług D-1F3-5 dla P6.20-P6.22 (import/eksport w kształcie weba). |
| E5 | pusty `placedWorldWonders` niezapisywany | ODDAL | Odczyt weba `:46459-46461` traktuje brak jako `[]`; wymóg golden bez zmian. |
| O1-O5 | odpowiedzi Obrony (D-1F3-1..5) | ODDAL | Spójne z powyższym; nie wymagają zmiany kodu w tym temacie. |

Zero NAPRAW, zero DO DECYZJI CZŁOWIEKA.

## Uwagi dla integracji (nie są defektem 1F3 względem bazy)

1. `git merge-tree origin/rust-port/parity-v2 (9f7c55499) 92dce8414`: **CONFLICT (add/add) w
   `rust-port/engine/src/domain/overlays_view.rs`** (F6 dodał ten sam plik). `mod.rs` łączy się automatycznie.
   Integracja wymaga rundy Operatora (orkiestrator nie rozwiązuje konfliktów ręcznie).
2. `restore_playable_siege_wonders` przy zduplikowanym `cityId` w `citySiege`: późniejszy wpis bez maszyn usuwa maszyny
   wcześniejszego, a `oblegane` sumuje się. Zapis Rust nie tworzy duplikatów; drobny dług odczytu.
3. `owner_era_facts` daje AI zawsze epokę startu (istniejące ograniczenie, jak w `city_view`), więc w produkcji ruiny cudów
   AI nie pojawią się do czasu śledzenia epok per właściciel.

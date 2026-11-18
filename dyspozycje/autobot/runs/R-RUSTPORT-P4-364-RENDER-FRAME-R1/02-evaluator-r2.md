# R-RUSTPORT-P4-364-RENDER-FRAME-R1: Evaluator (adwersarialny), runda 2

STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-364-RENDER-FRAME-R1
GOAL: domknięcie luk ramki renderera z `RENDER_FRAME_GAPS` (DODATEK r2) wg kodu webu (pin `07d2fbd72`): `overlays.buildHighlight.hexes`, `stacks.vitalsByRepId`, `units[].hp`/`hpMax` (`hpMaxEffective`); luki 4 i 5 jawne (#310).
ZMIANY/COMMIT: oceniany commit Operatora r2 `d82635c1d` (gałąź `rust-port-wip/364-render-frame-r2`), rodzic `5b04fa61e`; `git merge-base --is-ancestor ff037335d d82635c1d` = TAK (baza r2 zgodna z linią „BAZA r2”). Evaluator nie zmienia kodu. Dopisane tylko pliki w katalogu runs: ten raport, `gate-*-eval-r2.log`, `gate-full-test-eval-r2.summary.log`, `mutate-eval-r2.py`, `mutate-eval-r2.log`.
TESTY: odtworzone na `d82635c1d` (env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie, usunięty po bramkach): fmt EXIT 0, clippy `-D warnings` EXIT 0, `--test p4_364_render_frame` 27/27 EXIT 0, pełny engine `--all-targets --no-fail-fast` EXIT 0 (527 bloków, 3955 passed, 0 failed, 1 ignored sprzed tematu). Dysk przed pełną bramką: 8481 MiB. Mutacje Evaluatora: 2/11 zabite, 9/11 przeżyły (`mutate-eval-r2.log`).
BLOKADY: brak blokad infrastrukturalnych. Zarzuty merytoryczne niżej.
RUNDY: 2/5
NASTĘPNY KROK: Obrona Operatora r2 (zarzuty Z1–Z3), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

## 1. Bramki (odtworzone samodzielnie)

| Bramka | Wynik | Log |
|---|---|---|
| `cargo fmt --check` | EXIT 0 | `gate-fmt-eval-r2.log` |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 | `gate-clippy-eval-r2.log` |
| `cargo test --test p4_364_render_frame` | 27 passed, EXIT 0 | `gate-test-eval-r2.log` |
| `cargo test --all-targets --no-fail-fast` (engine, w tle `setsid nohup`) | EXIT 0; 3955 / 0 / 1 ignored | `gate-full-test-eval-r2.summary.log` |

Operator uruchomił pełną bramkę przed ostatnią zmianą komentarza `//!`. Tutaj pełna bramka przeszła na końcowym commicie `d82635c1d`, więc ta uwaga z raportu Operatora jest zamknięta.

## 2. Allowlista, `#[ignore]` i osłabione asercje

- Diff `ff037335d..d82635c1d`: `rust-port/engine/src/domain/render_frame.rs`, `rust-port/engine/tests/p4_364_render_frame.rs` i katalog runs. Wszystko jest w allowliście r2. Sekcja „Pliki spoza allowlisty” brzmi „Brak” i to się zgadza. Producenci (`overlays_view`, `recruitment`, `city_view`, `map_view`), `playable.rs`, `bridge.rs`, view-model i renderer są bez zmian. `Cargo.lock` nie jest zmieniony (`git status` czysty).
- `#[ignore]` w pliku testów: 0.
- Zmienione asercje r1 (3 miejsca):
  - `hpMax` `None` → `Some(22)` oraz `Some(20)` → `Some(22)`: zgodne z `syncRuntimeUnitHpState`, który nadpisuje `u.hpMax` przy każdym `syncUnitsRender` (`main.ts:33109-33118`, `:14444`). To nie jest osłabienie.
  - Lista `h_jawne_luki_ramki`: usunięte są pozycje domknięte w r2. Doszła asercja, że każda luka ma powód `#310`. Nie jest osłabiona.
- Ciche zera: `starvingRepIds`, `goldDeficitRepIds` i `workerFields` = `[]` są jawne w `RENDER_FRAME_GAPS` z numerem długu #310/#304, zgodnie z poleceniem dyspozycji. Sprawdziłem w pinie (`main.ts:14513-14546`), że flagi wymagają `isArmyHungry`/`isGoldDeficit`, czyli wyniku tiku ekonomii, którego stan nie ma. Luka jest więc uzasadniona. `unwrap_or_default()` na `vitals_by_rep_id` (`render_frame.rs:801`) jest bezpieczne, bo przy `Some(deps)` producent zawsze zwraca `Some` (test `vitals.len() == visibleIds.len()`). `unwrap_or(0)` dotyczy tylko testu (pola opcjonalne `units.json`, jak w webie `normFieldVal(…, 0)`).

## 3. Zgodność z D-364-R3 i z pinem

- D-R3-1/D-R3-2/D-R3-5/D-R3-6: bez zmian względem r1 (zaakceptowanych przez FC r1). `CONTRACT_VERSION` nietknięty.
- D-R3-3 (Q6-2): zachowane. Test `r2_build_highlight_found_city_wg_can_found_city` sprawdza, że przy aktywnym trybie selekcja i `reachable` są puste. Mutacja r1 „c” na kodzie r2 ginie (`mutate-r1-na-r2.log`).
- D-R3-4: każde nowe pole ma źródło w pinie. Zweryfikowałem linie:
  - `refreshBuildHighlight` `main.ts:16351-16396`;
  - `canFoundPlayerCityAt` `:12923-12943`;
  - `foundingTerritoryOpts` `:12906-12920`;
  - `refreshBuildApi` `:16290-16337` (literał `0`, `player.civType`/`era`/`zbadane`, owinięcie `isImprovementAllowedForCiv`);
  - `syncUnitsRender` `:14436-14508`;
  - `combatPowerFullDisplayDefFor` `:33936`;
  - `combatPowerScaledDefFor` `:9543`;
  - `veteranScaledDefFor` `:33063`;
  - `difficultyCombatMultForOwner` `:9523`;
  - `aiDiffLevelForOwner` `:9517`;
  - `applyVeteranFracToCombatUnit` (`veteran.ts:362-385`);
  - `applyDifficultyCombatToUnitDef` (`ai-difficulty-bonus.ts:41-60`);
  - `veteranLevelFromBattles` (`veteran.ts:106-110`).

  Formuły Rust odpowiadają tym fragmentom, z wyjątkiem zarzutu Z1.

## 4. Zarzuty

### Z1 (BLOKUJĄCY, parytet 1:1): epoka w `canFoundPlayerCityAt` liczona dla fotela zamiast `player.era`

Pin w `main.ts:12924` ma `const playerEra = player.era ?? 1;`, a dalej `ownerEra: playerEra`. `player` to jeden obiekt `createPlayerState()` (`main.ts:13713`). Jego `era` ustawia wyłącznie `reconcilePlayerEraFromResearch()` z `player.zbadane` i `civTypeForOwner(0)` (`main.ts:2522-2532`), czyli to zawsze epoka fotela głównego. Wolno zmieniać `ME()` na fotel (`ownerId: ME()`, `foundingTerritoryOpts(ME())`), ale `ownerEra` pozostaje epoką fotela głównego.

Rust w `FoundCityCtx::new` (`render_frame.rs:1224`) ma `era: owner_era(state, me)?`, gdzie `me` = fotel zapytania. W hotseacie (fotel 2 w innej epoce niż fotel główny) limit miast `cityLimitBase` per epoka liczy się wtedy z innej epoki niż w webie, więc podświetlenie założenia miasta może się różnić. To przeczy deklaracji D-OP-5 („odwzorowane 1:1, łącznie z asymetrią webu w hotseacie”). Asymetrię odwzorowano dla `buildApi`, a dla założenia miasta nie.

Wymagane: `era: owner_era(state, HUMAN_OWNER_ID)?` z komentarzem pinu (`main.ts:12924`, `:2522-2532`) i test na fotelu 2 z inną epoką niż fotel główny przy limicie miast na granicy.

### Z2 (BLOKUJĄCY razem z Z1, pokrycie testami gałęzi portowanych w r2): 9/11 mutantów Evaluatora przeżywa

Dyspozycja r2 wymaga dla każdej luki „wektor/odwołanie do linii pinu i test”. Testy pokrywają ścieżki główne, ale nie gałęzie, które Operator sam wpisał w adaptery (`mutate-eval-r2.py` → `mutate-eval-r2.log`):

| Mutant | Gałąź pinu | Wynik |
|---|---|---|
| EV1 założenie miasta liczone dla fotela głównego zamiast `seat` | `canFoundCity(…{ownerId: ME()})`, `foundingTerritoryOpts(ME())` `main.ts:12928-12933` | PRZEŻYŁ (brak testu foundCity dla fotela ≠ główny; to samo miejsce co Z1) |
| EV2 bez wykluczenia obcego fortu (`!isHexInForeignFortTerritory`) | `main.ts:12917-12918` | PRZEŻYŁ |
| EV3 bez `cityLimitBase` | `main.ts:12933`, `cities.ts:1163` | PRZEŻYŁ |
| EV4 Zwiadowca/Osadnik liczony do `fieldPowerM` | `BATTLE_EXCLUDED_TYPES` `auto-battle-power.ts:37-43` | PRZEŻYŁ |
| EV5 `Łatwy` → poziom 2 | `aiDiffLevelForOwner` `main.ts:9517-9520` | PRZEŻYŁ |
| EV6 `hp` bez dolnej granicy 0 | `Math.max(0, …)` `main.ts:33115` | PRZEŻYŁ |
| EV7 próg poziomu weterana 3 → 2 | `veteranLevelFromBattles` `veteran.ts:106-110` | PRZEŻYŁ |
| EV8 cud dla fotela głównego zamiast `seat` | `qualifyingWonderHexesForPlayer` | ZABITY |
| EV9 bonus trudności także dla człowieka | `qualifiesForMajorAiDifficultyBonus` | ZABITY |
| EV10 `horseStockAvailable` zawsze 0 | `citySurowceSumForOwner(0).kon` `main.ts:16315` | PRZEŻYŁ |
| EV11 `ownUnitHexKeys` puste | `ownUnitHexKeysForOwner(0)` `main.ts:16319` | PRZEŻYŁ |

Wymagane minimum: testy, które zabiją EV1–EV7. EV10 i EV11 dotyczą bramek budowy Stadniny i fortu poza terytorium. Test albo jawne uzasadnienie w raporcie Obrony. Wektory mają mieć odwołanie do linii pinu, nie tylko wywołanie tej samej funkcji Rust, którą adapter woła.

### Z3 (UWAGA, nie blokuje): wyrocznie testów częściowo z tych samych funkcji Rust

Testy foundCity, cudu i ulepszeń wyliczają oczekiwanie przez `city_territory_radius`, `axial_distance` i `field_power` z crate'u. Same reguły (dystans ≥ 4, `0 < d ≤ promień`, sortowanie, filtr wody) są zapisane w teście jawnie i sprawdzone z pinem, więc to akceptowalne. Przy poprawkach Z2 lepsze są stałe liczone ręcznie (np. promień terytorium stolicy pop 1 jako liczba z odwołaniem do `territory.ts`).

### Inne uwagi (bez zarzutu)

- D-OP-6 (`hp` undefined → `hpMaxEffective` w DTO bez `undefined`): zgodne z `stackHpPool` i z `syncRuntimeUnitHpState`. Akceptuję.
- D-OP-7: web `ownerId > 0` = właściciel ≠ fotel główny, więc w hotseacie drugi człowiek dostaje bonus trudności AI w webie i tak samo w Rust. To litera pinu. Akceptuję.
- Nieznana etykieta trudności daje w Rust błąd `UnknownDifficulty`, a web daje fallback `?? 'normal'` (`main.ts:44379`). Stan Rust zawsze ma etykietę z menu, więc to decyzja „jawny błąd zamiast cichej wartości” zgodna z dyspozycją. Do wpisu w rejestrze przez orkiestratora jako decyzja techniczna.
- `armorBadgeLevel` jako wartość domyślna i zawężenie `RENDER_FRAME_STATE_DEFAULTS`: zgodne z D-OP-8.

## 5. Tabela pól ramki: weryfikacja Evaluatora (zmiany r2)

| Pole | Źródło (Rust) | Web (pin) | Ocena Evaluatora |
|---|---|---|---|
| `overlays.buildHighlight.hexes` foundCity | `FoundCityCtx::check` → `build_highlight` | `main.ts:16352-16361`, `:12906-12943` | logika OK poza `ownerEra` (Z1); gałęzie fort/limit bez testu (Z2) |
| `overlays.buildHighlight.hexes` wonder | `qualifying_wonder_hexes` | `main.ts:5189-5214` | OK, test z wektorem, mutacja EV8 zabita |
| `overlays.buildHighlight.hexes` improvement | `improvement_build_state` + `improvement_qualifying_hexes` | `main.ts:16290-16337`, `:16369-16395` | OK (literał `0` = `HUMAN_OWNER_ID`); `kon`/`ownUnitHexKeys` bez testu (Z2) |
| `stacks.vitalsByRepId` | `stack_view` → `compute_stack_display(.., Some(deps))` | `main.ts:14476-14508` | OK; wykluczenia typów i `Łatwy` bez testu (Z2) |
| `units[].hp` | `synced_hp` | `main.ts:33109-33118` | OK; dolna granica 0 bez testu (Z2) |
| `units[].hpMax` | `hp_max_effective` | `main.ts:33099-33106` | OK, test z wektorem 24.2 / 28.6 |
| `units[].softBadgeLevel` | `soft_path_badge_level(Some(progress))` | `unit-building-bonuses.ts` | OK |
| `stacks.starvingRepIds` / `goldDeficitRepIds` | `[]` | `main.ts:14513-14546` | jawna luka #310/#304, uzasadniona |
| `overlays.workerFields` | `[]` | `main.ts:15432-15448` | jawna luka #310, uzasadniona |

## 6. Werdykt

FAIL: Z1 (realna rozbieżność z pinem w ścieżce hotseat, sprzeczna z własną decyzją D-OP-5) oraz Z2 (gałęzie portowane w r2 bez testów, 9/11 mutantów przeżywa). Bramki są zielone, allowlista czysta, ciche zera nie występują, luki 4 i 5 są jawnie uzasadnione. Poprawka jest wąska: jedna linia kodu plus testy w `p4_364_render_frame.rs`.

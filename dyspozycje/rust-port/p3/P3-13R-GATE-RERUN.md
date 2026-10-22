# P3.13R — Ponowna bramka Final Control danych i assetów przed P4–P6

STATUS: FAIL (werdykt bramki P3; klauzula 1 „dane ładowane ze źródła (nie hard-coded)” NADAL NIE SPEŁNIONA w runtime; klauzula 2 FAIL po korekcie r2 — patrz §9)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-13R-GATE-RERUN-Q1
RUNDA: 1/5 (Operator, Haiku 5.5 medium; pomiar tylko odczytowy, zero zmian kodu)
BAZA: `origin/rust-port/parity-v2` = `2a45e340` (HEAD worktree detached; `git rev-parse --short HEAD` = `2a45e340`; ancestor 2a45e340 potwierdzony)
PIN danych: `edb8fb56` (`gra/data/*`)
DOKUMENTY WEJŚCIOWE: gałąź `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (`git show`), P3-13 (§5–§8), P3-17, P3-18, P3-19 (pliki), P3-20, P3-21, P3-22 (pliki), LEDGER.md, GOAL-RUST-PORT-20261020.md
DEPLOY/PUSH: NIE WYKONANO
ZASADA: każde twierdzenie ma komendę albo plik:linia i wynik. Logi surowe: `dyspozycje/autobot/runs/R-RUSTPORT-P3-13R-GATE-RERUN-Q1/*.log` (dołączone w całości w załącznikach A–J poniżej).
ZAŁOŻENIE (luka w dispatchu): wiadomości właściciela z czatu głównego w kontekście zignorowane zgodnie z dispatchem; pytania ABC nie zadawano.

---

## 0. Podsumowanie

- Bramki surowe na `2a45e340`: **wszystkie EXIT=0** (engine fmt/clippy/test; renderer fmt/clippy z i bez `gpu`/test z i bez `gpu`; spike-gpu-embed test; frontend-v2 npm ci/tsc/check).
- Klauzula 2 (assety i pin danych): **FAIL** (korekta r2, §9) — hashe `gra/data` 26/29 = pin `edb8fb56`; 3 NIEZGODNE: `civs.json`, `units.json`, `civ-matrix.json` (`hashcheck-r2.log`). Manifest 428/428 i `assets_manifest` 13/13 — PASS.
- Klauzula 1 (dane ze źródła, nie hard-coded): **FAIL (nadal)**. Postęp względem P3-13 jest realny: ręczna tabela rekrutacji usunięta (P3.17), tabele mnożnikowe przeniesione do `data/derived/*.json` (P3.19, P3.22), OWNER/CAMP typowane (P3.20), CITY typowany (P3.21). Ale: (a) runtime domeny czyta bezpośrednio z `gra/data` tylko 2 z 29 plików (`ai-params.json`, `units.json`); pozostałe 27 plików jest parsowane wyłącznie w testach; (b) w `domain/**` pozostają literały-tabele i mnożniki (§3, lista z plik:linia).
- Werdykt: **FAIL** (ta sama wartość co P3-13 r2, z innym uzasadnieniem: teraz nie brak loadera, lecz pozostałe literały i niepodpięte pliki). Warunki zamknięcia w §6.
- Rekomendacja dla P6: gameplay core (P6) **czeka**. P4 renderer i P5 UI mogą trwać (nie konsumują tabel gameplay; patrz §6).

---

## 1. Surowe bramki (własny przebieg, `2a45e340`)

Komendy uruchomione z katalogu worktree; `CARGO_TARGET_DIR` osobny per crate w `scratchpad/tgt-*` (do usunięcia po pracy), `CARGO_INCREMENTAL=0`. Cargo.lock wygenerowany lokalnie w `rust-port/engine` (NIE commitowany; patrz §8).

| Projekt | Komenda | Wynik | EXIT | Log |
|---|---|---|---|---|
| engine | `cargo fmt --all -- --check` | czysto | 0 | engine-fmt.log |
| engine | `cargo clippy --all-targets -- -D warnings` | 0 ostrzeżeń | 0 | engine-clippy.log |
| engine | `cargo test --no-fail-fast` | 40 sekcji `test result`, **373 passed, 0 failed** (w tym `assets_manifest` 13/13, `data_loader`/`derived_values`/`data_compliance` ok) | 0 | engine-test.log |
| renderer | `cargo fmt --all -- --check` | czysto | 0 | renderer-fmt.log |
| renderer | `cargo clippy --all-targets -- -D warnings` (bez gpu) | 0 ostrzeżeń | 0 | renderer-clippy-nogpu.log |
| renderer | `cargo clippy --all-targets --features gpu -- -D warnings` | 0 ostrzeżeń | 0 | renderer-clippy-gpu.log |
| renderer | `cargo test --no-fail-fast` (bez gpu) | 21 sekcji, **121 passed, 0 failed** | 0 | renderer-test-nogpu.log |
| renderer | `cargo test --no-fail-fast --features gpu` | 21 sekcji, **122 passed, 0 failed**; test GPU probe **SKIPPED: no GPU adapter** (brak adaptera w kontenerze — NIE_ZMIERZONO na sprzęcie z GPU) | 0 | renderer-test-gpu.log |
| spike-gpu-embed | `cargo test --no-default-features --no-fail-fast` | 3 sekcje, **39 passed, 0 failed** | 0 | spike-test.log |
| frontend-v2 | `npm ci` | zainstalowane (komunikat `npm audit` = informacja, nie bramka) | 0 | frontend-npm-ci.log |
| frontend-v2 | `npx tsc --noEmit` | czysto | 0 | frontend-tsc.log |
| frontend-v2 | `npm run check` | self-test 33 poz./15 neg./1 linia; check-no-logic-imports: 43 plików, **0 trafień**; verify-pin-copies: pin=edb8fb56, **39 plików, 0 niezgodnych** | 0 | frontend-check.log |

Sumy: engine 373 + renderer 121 (bez gpu) / 122 (z gpu) + spike 39 — wszystkie 0 failed.

---

## 2. Klauzula 1 — ponowny pomiar punktów z P3-13 §6

Legenda: ZAMKNIĘTY (dowód: SHA integracji + komenda) / OPEN (uzasadnienie + właściciel) / NIE_ZMIERZONO.

| # | Punkt z P3-13 §6 | Status r1 | Dowód (SHA / komenda / plik:linia) | Uwagi |
|---|---|---|---|---|
| 1 | Loader nie podpięty; domena nie czyta `gra/data` | **OPEN (częściowo)** | Domena bezpośrednio: `parse_ai_params` (`src/domain/ai_turn.rs:18,25`), `parse_units` (`src/domain/recruitment.rs:8,227`; `src/domain/diplomacy.rs:5,1863`). Pozostałe 27 plików: 0 wywołań `parse_*` poza `src/data/**` i `tests/**` (zob. §2.1). Pośrednio: `data/derived/*.json` (17 plików, bootstrap z weba, NIE są w pinie `gra/data`) przez `src/data/derived.rs` (`include_str!`). | Klauzula literalna nieosiągnięta. Właściciel: decyzja czy `derived/` jest źródłem prawdy (P3-19 Q1/Q3 = tak) i czy 27 plików ma być podpiętych do runtime. |
| 2 | `recruitment.rs:204` ręczna tabela; 0/75 zgodnych z `units.json` | **ZAMKNIĘTY (literał usunięty); zgodność 4 pól z `units.json`: NIE_ZMIERZONO** | `canonical_recruitment_costs()` = `src/domain/recruitment.rs:217-250`: `parse_units()` + `parse_unit_stock_costs()` + `parse_unit_gold_costs()`; brak literałów kosztów. SHA: `d3a73641` (P3.17), `665895d1`/`e3dcf5be` (P3.19 złoto/surowiec). Test: `derived_values` ok (engine-test.log). | Wartości kosztów pochodzą teraz z `derived/unit-*-costs.json` (bootstrap z `units.json` + reguł epoki/`kon` weba), a nie z pól `units.json`. Różnice względem surowych pól `units.json` są ZAMIERZONE decyzją właściciela (mnożniki → liczby). Ponowne 4-polowe porównanie z `units.json` NIE_ZMIERZONO w tym przebiegu. |
| 3 | P3.10 fixtures seedów/map/scenariuszy | **OPEN** | `find rust-port -iname '*fixture*'` → tylko `rust-port/renderer/tests/fixtures/**` (geometria P4, nie P3.10). `ls dyspozycje/rust-port/p3 \| grep P3-10` → 0. LEDGER: „zablokowane — brak nagrań z web”. | Blokada zewnętrzna (nagrania weba, P2.10 D-FIX). Decyzja właściciela: czekać czy odłożyć testy zgodności. |
| 4 | OWNER: 76 deklaracji `u64`/`i64`; brak `OwnerRef` | **ZAMKNIĘTY** (z notą) | `grep -rnE 'owner_id\s*:\s*(Option<)?(u64\|i64)\|player_id\s*:\s*(Option<)?u64' rust-port/engine/src` → **0** (było 76). `pub enum OwnerRef { Player(PlayerId), Barbarian, Rebel }` `src/domain/ids.rs:58`. SHA: `be9ae0b3`, `12c5291b` (P3.20). | Nota: `LEGACY_BARBARIAN_OWNER_ID`/`LEGACY_REBEL_OWNER_ID` (`ids.rs:42-45`) są `i64` jako kodek legacy — świadome. |
| 5 | CAMP: brak `CampId` | **CZĘŚCIOWO** (typ `CampId` istnieje; API domeny nadal `u64`: `barbarians.rs:140,166,204,224,249`) | `id_type!(CampId)` `src/domain/ids.rs:39`; `BarbCamp.id: CampId` `barbarians.rs:157`; `BarbUnit.camp_id: Option<CampId>` `barbarians.rs:192`. SHA `be9ae0b3`, `12c5291b`. | Nota: builder `with_camp(camp_id: u64)` `barbarians.rs:224` przyjmuje surowe `u64` (wejście, konwertowane). |
| 6 | `gen.py` nieobecny w repo | **OPEN (bez zmian)** | `grep -rln 'gen\.py' rust-port/engine` → `rust-port/engine/src/data/civilizations.rs` (nagłówek; skrypt nieobecny). | Nie blokuje; proweniencja. |
| 7 | `src-tauri` bez GTK | **NIE_ZMIERZONO** | Nie uruchamiano w tym temacie (poza zakresem dispatchu). | Wg LEDGER: blokada środowiskowa. |
| 8 | `tracing` nie podpięty do `bridge.rs`/`src-tauri` | **OPEN (bez zmian, stwierdzone)** | `grep -rn tracing src-tauri/src rust-port/engine/src/bridge.rs` → 0 trafień. | Dług, nie blokuje. |
| 9 | Round-trip N1/N2 (7/29 plików) | **NIE_ZMIERZONO** | Liczniki 1190/120 nie przeliczane. Test `roundtrip_covers_all_29_data_files` w engine-test.log (ok). | Akceptowalne z notą. |
| 10 | 3 pliki MP3 w `_wykluczone/` w manifeście | **OPEN — decyzja właściciela** | `rust-port/assets/MANIFEST.tsv` zawiera 3 wpisy `_wykluczone/`; brak dowodu decyzji (P1.11 §2). | Nie blokuje P4. |
| 11 | `Cargo.lock` nieśledzony | **OPEN (bez zmian)** | `git status --short` → `?? rust-port/engine/Cargo.lock` (wygenerowany przez cargo w tym przebiegu). | NIE commitowany. |
| 12 | `deny_unknown_fields` w 6 plikach `src/data/` | **OPEN (zmierzone: 7)** | `grep -rln deny_unknown_fields rust-port/engine/src` → **7** plików (było 6). | Dług, nie blokuje. |

### 2.1 Ścieżka danych — kto czyta `gra/data` (zmierzone, `src/` poza `src/data/`)

| Plik `gra/data` (29) | Konsument w `src/domain/**` | Uwaga |
|---|---|---|
| `ai-params.json` | TAK — `parse_ai_params` (`ai_turn.rs:18,25`) | ZAMKNIĘTY dla `ai_turn` |
| `units.json` | TAK — `parse_units` (`recruitment.rs:227`, `diplomacy.rs:1863`) | ZAMKNIĘTY dla rekrutacji i katalogu PN |
| `buildings.json` | NIE bezpośrednio (`parse_buildings`: 0) — pośrednio przez `derived/building-*-costs.json` | OPEN |
| `civs.json`, `civ-ai.json`, `civ-matrix.json`, `civ-params.json`, `city-names-pools.json`, `e-start-params.json` | NIE (0 odwołań) | OPEN |
| `combat-params.json`, `counters.json`, `terrain-combat.json`, `auto-battle-params.json`, `power-params.json` | NIE (0) — `combat.rs` ich nie czyta; tabele w `combat.rs` (§3) | OPEN |
| `diplomacy.json`, `diplomacy-acceptance-points.json` | NIE (0) — `diplomacy_multiplier_*` z `derived/diplomacy-multipliers.json` | OPEN |
| `econ-params.json`, `society-params.json`, `citizen-resource-upkeep.json`, `epoka-ludnosc-manpower.json`, `resources.json`, `miasto-params.json`, `tech.json`, `wonders.json`, `ui-params.json` | NIE (0) | OPEN |
| `terrain-improvements.json`, `terrain-movement.json`, `terrain-yields.json`, `map-gen-params.json` | NIE (0) | OPEN |

Podsumowanie: **2 z 29** bezpośrednio w runtime; **27 z 29** tylko w `tests/**` lub wcale. Część ich wartości wbudowano literałami w kod (zob. §3), część ma odpowiedniki w `derived/`.

---

## 3. Ponowny audyt tabel i literałów mnożnikowych w `src/domain/**` (plik:linia, stan `2a45e340`)

Metoda: `grep` po `const/static` i po literałach zmiennoprzecinkowych poza komentarzami; `#[cfg(test)]` nie dotyczy `domain/**` poza `map_generator.rs` (od linii 1343). Lista nie jest twierdzeniem o kompletności co do każdej liczby całkowitej; jest kompletna dla tabel i mnożników.

| # | Plik:linia | Co | Ocena |
|---|---|---|---|
| L1 | `src/domain/combat.rs:199-216` | `counter_multiplier` — tabela par `(atak, obrona) => 1.50/1.25/1.15` (fallback po `bonuses_vs_type`, linia 196) | LITERAŁ-TABELA (counters.json nie czytany) |
| L2 | `src/domain/combat.rs:229-240` | `terrain_defense_multiplier`: Równina 1.0, Las 1.0 (bez dystansu), Rzeka 1.0 — literały; Las(dystans)/Wzgórza/Góry z `combat_ai_multiplier_value` (`derived`) | CZĘŚCIOWO (Las naprawiony w P3-22 r5, `6d77d02e`) |
| L3 | `src/domain/combat.rs:253-264` | mnożniki struktur: `wall`/`citadel`/`outpost` — gałęzie literałowe 0.0 i ścieżka `pct` | CZĘŚCIOWO |
| L4 | `src/domain/combat.rs:467-476` | udział strat `0.50`, `0.25`, `0.15`, clamp `0.10..0.25` | LITERAŁ (brak wpisu w `combat-params.json` użytym) |
| L5 | `src/domain/combat.rs` (cały moduł) | moduł NIE jest wywoływany z produkcji: jedyni wywołujący `counter_multiplier` / `terrain_defense_multiplier` to `combat.rs` i `tests/combat.rs` (`grep` po `src/` i `tests/`). | MARTWY dla runtime (decyzja właściciela — dispatch §6 pkt 6) |
| L6 | `src/domain/city_growth.rs:14-31` | `DEFAULT_POPULATION_CAP=5`, `DEFAULT_GRANARY_POPULATION_CAP=8`, `DEFAULT_AQUEDUCT_POPULATION_CAP=12`, `DEFAULT_GROWTH_THRESHOLD_BASE=20.0`, `…_PER_POPULATION=16.0`, `DEFAULT_HEALTH_GROWTH_MODIFIER=0.05`, `DEFAULT_GRANARY_FOOD_RETENTION=0.5`, `…_TIER_TWO_…=0.7`, `DEFAULT_MINIMUM_POPULATION=1` | LITERAŁY (`econ-params.json` nie czytany; P3-18 pozycja 9 — zgodne, ale nie podpięte) |
| L7 | `src/domain/diplomacy.rs:328-424` | `DiplomacyParams::default()` — ok. 40 literałów (`start_trust 20.0`, `start_respect 30.0`, `common_enemy_trust 5.0`, `betrayal_trust -50.0`, `ultimatum_military_ratio 1.3`, `annexation_gold_base 150.0`, `alliance_strength_ease_max 0.25`, …) | LITERAŁY (`diplomacy.json` nie czytany bezpośrednio) |
| L8 | `src/domain/diplomacy.rs:643-661` | literalne delty zaufania/szacunku per zdarzenie (`CommonReligion` 1.0, `TributeRefused` −10.0, `TributeOfferAccepted` 5.0, `VoluntaryTreatyBreak` −15.0, …) | LITERAŁY |
| L9 | `src/domain/diplomacy.rs:889-901`, `1025-1062`, `1156` | tabele per cywilizacja (`Chinese => 66.0`, `Greeks => 0.40`, `Zulus => 0.90`, `Incas => 0.15`, …) | LITERAŁY-TABELE (`civs.json`/`civ-ai.json` nie czytane) |
| L10 | `src/domain/diplomacy.rs:1767-1841` | `ValueCatalog::default()` — ceny surowców (`glina 2.0`, `ruda_cyny 10.0`, `zloto 50.0`), technologie (`Murarstwo 56.0`, … `Filozofia 600.0`, `Obróbka żelaza 740.0`), dostęp (`lama 20.0`, `konie 100.0`) | LITERAŁY-TABELE (P3-18 poz. 10–11; `tech.json`/`econ-params.json` nie czytane) |
| L11 | `src/domain/diplomacy.rs:1873-1884` | `STEP_TEN_RESOURCES` — lista kroku handlu 10 | LITERAŁ-LISTA (brak klucza w `resources.json`) |
| L12 | `src/domain/diplomacy.rs:1160-1170`, `1126`, `1090` | `0.60`, `0.40`, `0.05`, `trust/100*0.60`, `alliance_stronger_other_bonus` | LITERAŁY-MNOŻNIKI |
| L13 | `src/domain/trade.rs:1398`, `1426`, `1462-1470` | reguła `pre_scale/5` + próg `>=3` (`1426`); `(base * (1.0 + bonus)).floor()` (`1465,1470`) | LITERAŁY-REGUŁY (wartości `derived/trade-multipliers.json` tylko dla stałych H-*) |
| L14 | `src/domain/trade.rs:1479-1481`, `1557-1559` | `TRADE_ROUTE_BUILDING_BONUS_RATE`, `PORT_SEA_TRADE_BONUS_PIENIADZ` — z `derived` | ZAMKNIĘTY (P3-22) |
| L15 | `src/domain/trade.rs:313-317`, `1586-1587` | `TRADE_BUILDING_IDS`, `PORT_BUILDING_IDS`, `TRADE_ROUTE_RESOURCE_KEYS`, `TRADE_ROUTE_STOCK_FLOW_KEYS` — identyfikatory (zgodne z `buildings.json`/`resources.json`) | DOPUSZCZALNE (klucze, nie wartości) |
| L16 | `src/domain/improvements.rs:339-…` | `production_for()` — 21 gałęzi z literalnymi bonusami i ilościami (zgodne z JSON 20/20, P3-18 poz. 14) | LITERAŁY-TABELA |
| L17 | `src/domain/resource_production.rs:140-…` | `resource_yield_for_improvement()` — ilości bazowe i skalowanie epok `200/300/450` (zgodne z JSON 9/9, P3-18 poz. 7) | LITERAŁY-TABELA |
| L18 | `src/domain/map_generator.rs:495-502` | `default_land_fraction`: 0.30 / 0.60 / 0.50 / 0.21 (zgodne z web, brak klucza w `map-gen-params.json`) | LITERAŁY |
| L19 | `src/domain/map_generator.rs:14-17`, `843` (`EARTH_MASK_RLE`), `957-958` | stałe PRNG/szumu (`TERRAIN_GLOBAL_MIX_AMP 0.12`, `…CELL_JITTER_AMP 0.65`), maska lądów RLE jako literał | LITERAŁY (algorytm + maska; maska = `gra/data/earth-mask-source.png` poza 29 JSON) |
| L20 | `src/domain/barbarians.rs:288` | `retreat_health_fraction: 0.30` (domyślny); `barbarians.rs:321-327` — `barbarian_units_per_camp_for_difficulty` (1/2/3) | LITERAŁY (P3-18 poz. 18: brak kluczy per poziom) |
| L21 | `src/domain/ai_turn.rs:1123` | `health < 0.30` | LITERAŁ |
| L22 | `src/domain/playable.rs:13-20` | `CAPITAL_ID`, `START_X=2`, `START_Y=1`, `MOVE_TARGET_X=3` — stan startowy skryptu | LITERAŁY-SCENARIUSZ (zależne od P3.10) |
| L23 | `src/domain/types.rs`, `events.rs:18-39`, `rng.rs:5-7`, `save_load.rs:34-37`, `replay.rs:24`, `playable.rs:13` | wersje formatów, kolejność faz tury, stałe LCG | DOPUSZCZALNE (nie są danymi gry) |
| L24 | `src/domain/recruitment.rs:217-250` | `canonical_recruitment_costs()` — tylko OnceLock + `parse_*` | ZAMKNIĘTY (P3.17/P3.19) |
| L25 | `src/domain/building_costs.rs:113-136` | `canonical_building_costs()` — z `derived/building-work-costs.json`, `building-stock-costs.json` | ZAMKNIĘTY (P3.19) |
| L26 | `src/domain/ai_turn.rs:357-361` | `action_priority()` — tabela priorytetów akcji per typ jednostki (0–4) | LITERAŁ-TABELA (dodane r2, zarzut 5a) |
| L27 | `src/domain/ai_turn.rs:745-750` | `archetype_mods_for_civ()` — tabela modyfikatorów archetypu per cywilizacja (`rzymianie`, `chinczycy`, `zulusi`, `inkowie`, …) | LITERAŁ-TABELA (dodane r2, zarzut 5b) |
| L28 | `src/domain/ai_turn.rs:943-968` | wagi produkcji AI: `100 + mods*20` (943-945), progi `200/250/270/280/300` i gałęzie `early_phase` | LITERAŁY-MNOŻNIKI (dodane r2, zarzut 5c) |
| L29 | `src/domain/map_generator.rs:781-821` | współczynniki szumu `0.45` / `0.62`, przesunięcia `200.0` / `350.0`, `lane_fade` dzielnik `0.062` (811) | LITERAŁY (dodane r2, zarzut 5d) |
| L30 | `src/domain/resource_production.rs:121-130` | tabela ilości bazowych: tartak 200, kamieniolom 200, glinianka 50, kopalnie miedzi/żelaza/cyny 20, warzelnia soli 50, stadnina 25, kopalnia złota 1 | LITERAŁ-TABELA (dodane r2, zarzut 5e) |
| L31 | `src/domain/barbarians.rs:140,166,204,224,249` | API domeny z surowym `u64` (`BarbCamp::new(id: u64)`, `with_camp(camp_id: u64)`, `Command` `unit_id: u64`) | ZGŁOSZONE (zarzut 8; patrz §2 pkt 5) |

Mnożniki „ręczne” z decyzji właściciela (P3.19-Q1/Q3: „mnożniki → konkretne liczby”): zrealizowane dla rekrutacji i budynków (L24, L25) oraz handlu/dyplomacji/walki po P3-22 (L14, częściowo L2). **Nie zrealizowane**: L1, L4, L6, L7–L13, L16–L18, L20–L22 (tabele i mnożniki w kodzie).

---

## 4. Klauzula 2 — assety i pin danych (FAIL po korekcie r2)

- [WYCOFANE — błąd r1: mierzono kopie `rust-port/engine/data/*.json`, nie `gra/data`; poprawny pomiar w `hashcheck-r2.log`, patrz §9] Hashe 29/29 `rust-port/engine/data/*.json` (`git hash-object`) = `gra/data/*` w pinie `edb8fb56` (`git ls-tree -r edb8fb56 -- gra/data`): **MATCH=29 MISMATCH=0** (log: `hashcheck.log` w załączniku K). Katalog `data/derived/` (17 plików) NIE istnieje w pinie — jest to świadome, udokumentowane w `derived/README.md` jako bootstrap z reguł weba.
- Manifest: `rust-port/assets/MANIFEST.tsv` 428 wierszy danych; `cargo test --test assets_manifest` → **13 passed, 0 failed** (engine-test.log, sekcja `Running tests/assets_manifest.rs`).
- Frontend pin: `npm run check` → `verify-pin-copies: pin=edb8fb56 plików=39 niezgodnych=0` (frontend-check.log).
- Wniosek r2: klauzula 2 **FAIL** (`gra/data@2a45e340` vs `gra/data@edb8fb56`: 26/29 MATCH, 3 MISMATCH; `rust-port/engine/data` = pin 29/29). Manifest i testy assetów: PASS.

---

## 5. Tabela statusu P3 (temat → SHA integracji na `parity-v2` → dowód → status r1)

SHA zweryfikowane jako commity w historii `origin/rust-port/parity-v2` (`git rev-list 2a45e340` + dopasowanie). **Korekta r2:** 35 z 35 SHA z tabeli jest przodkami `2a45e340` z wyjątkiem `ef046757` (patrz wiersz P3.13). Dla wierszy opartych na LEDGER zmierzono tylko przynależność do historii; zachowanie z LEDGER oznaczono jako NIE_ZMIERZONO. Pozycje bez commitu oznaczono.

| Temat | SHA (parity-v2) | Dowód | Status r1 |
|---|---|---|---|
| P3.1–P3.2 toolchain | baza (`9e33fc77`, LEDGER) | engine-test.log: build/test ok | PASS (LEDGER) |
| P3.3 logging | LEDGER | `tracing` 0 odwołań w `src-tauri/src` i `bridge.rs` | PASS-WITH-NOTES |
| P3.4 ID/wersjonowanie | LEDGER | `version.rs` | PASS-WITH-NOTES |
| P3.4b newtypy PlayerId/UnitId | `914eec6b` (LEDGER) | — | PASS-WITH-NOTES |
| P3.4c newtypy CityId/UnitId | `275297a2`, `0a04fc7c` (przodkowie parity-v2) | P3-13 §4 | PASS (u64 pozostałe) |
| P3.5A–E dane (29 plików) | `df8d8592`, `401a625f` (LEDGER), `9f9ffee7` (P3-9) | §4 r2: `hashcheck-r2.log` 26/29 | FAIL dla 3 plików gra/data (civs, units, civ-matrix); runtime — patrz P3.9 |
| P3.6–P3.7 | jw. | jw. | PASS |
| P3.8 assety 428/428 | `1d53dcdb` (`git log`) | §4, 13/13 | PASS |
| P3.8b walidacja manifestu | `667f1743` (LEDGER) | `assets_manifest` 13/13 | PASS |
| P3.9 loader podpięty do runtime | `9f9ffee7` (wire moduł) | §2 pkt 1, §2.1: 2/29 w runtime | **OPEN (częściowo)** — klauzula 1 niespełniona |
| P3.10 fixtures | BRAK (brak commitów; brak `P3-10*`) | §2 pkt 3 | **NIE ZAMKNIĘTE** (blokada: nagrania weba) |
| P3.11 testy zgodności civ | `e67444a9`, `a9441bd9` | engine-test.log `data_compliance` ok | PASS-WITH-NOTES |
| P3.12 testy brakujących danych | `7f155227`, `ae9b85ea` | `data_loader` 14 ok | PASS-WITH-NOTES |
| P3.13 (pierwsza bramka) | `ef046757` (LEDGER; obiekt istnieje w repo, **NIE jest przodkiem parity-v2** ani `f1a1740c`) | `P3-13-GATE-FINAL-CONTROL.md` | FAIL (klauzula 1) — nadal aktualne |
| P3.14 fmt/clippy hygiene | `77946fef`, `aa7b225b` | fmt/clippy EXIT=0 | PASS |
| P3.15 round-trip 29/29 | `34d74f97`, `f7aa0997` | `roundtrip_covers_all_29_data_files` ok | PASS-WITH-NOTES (N1/N2) |
| P3.16 bramki CI | `318fa367`, `8a000974`, `17454b33` | fmt/clippy/test EXIT=0 | PASS |
| P3.17 runtime wiring (recruitment) | `d3a73641` | §2 pkt 2; `recruitment.rs:217-250` | PASS (LEDGER) — literał usunięty |
| P3.18 tabele hard-coded (r2) | `f2652a0b`, `7aab83f5` | §3 L6–L23 | PASS-WITH-NOTES (wiele literałów zostało — §3) |
| P3.19 spłaszczenie mnożników (etap 1, r3) | `665895d1`, `e3dcf5be`, `86311e3b` | `derived/*.json` (17); §2 pkt 2 | PASS-WITH-NOTES (etap 1; reszta z zakresu P3.19 niezrealizowana, §3) |
| P3.20 OwnerRef/CampId | `be9ae0b3`, `12c5291b` | §2 pkt 4–5; OWNER u64 = 0 | PASS (z notą legacy) |
| P3.21 CityId | `08f40ff6`, `2a45e340` | `grep CityId` w `ai_turn.rs`, `barbarians.rs`, `trade.rs`, `types.rs`, `playable.rs` | PASS |
| P3.22 flatten etap 2 (r5) | `1937d3de`, `ba82e1ae`, `bdcc8f9b`, `bb1cc713`, `6d77d02e` | §3 L2, L14; `combat_ai_multiplier_value` | PASS-WITH-NOTES (limit 5 rund wykorzystany) |
| P3.23 | BRAK (brak commitów, brak dokumentu, brak wpisu LEDGER) | `git log` `P3-23` → 0 | **NIE_ZMIERZONO / brak tematu** |
| P3.13R (ten temat) | — | niniejszy dokument | **FAIL** (klauzula 1) |

---

## 6. Werdykt i rekomendacja dla P6

**WERDYKT: FAIL** (literalne brzmienie bramki PLAN §4: „dane ładowane ze źródła (nie hard-coded)”).

Uzasadnienie:
- Klauzula 1 nie jest spełniona: 27 z 29 plików `gra/data` nie jest czytanych przez runtime domeny (§2.1); w `domain/**` pozostają tabele i mnożniki (§3: L1, L4, L6, L7–L13, L16–L18, L20–L22).
- Postęp: rekrutacja i budynki czytane z `derived/`; OWNER/CAMP/CITY typowane; zerowe `owner_id: u64` w domenie; engine 373 testów (w tym manifest 13/13), renderer 121/122, spike 39 — wszystkie zielone, 0 failed.
- Klauzula 2: FAIL (§4; korekta r2, §9).

**Warunki do zamknięcia (kolejna bramka P3.13R-2 po nich):**
1. Decyzja właściciela: czy `data/derived/*.json` jest źródłem prawdy gry (zgodnie z P3-19 Q1/Q3), a `gra/data` tylko bootstrapem — jeśli tak, dopisać to do PLAN §4 jako zmianę klauzuli 1; jeśli nie, podpiąć 27 plików do runtime.
2. Usunąć literały-tabele z `domain/**`: L1 (`counter_multiplier`), L4 (`combat.rs:467-476`), L6 (`city_growth.rs:14-31`), L7–L10 (`diplomacy.rs` default/tabele/ValueCatalog), L16–L17 (`improvements.rs`, `resource_production.rs`), L18 (`map_generator.rs:495`), L20–L21 (`barbarians.rs:288`, `ai_turn.rs:1123`).
3. Decyzja o `combat.rs` (L5): moduł martwy dla runtime — podpiąć do bridge/walki albo usunąć z dziedziny P6 (patrz §7).
4. P3.10 fixtures albo jawna decyzja właściciela o odłożeniu testów zgodności.
5. P3.23: brak tematu — doprecyzować zakres albo wykreślić z planu.
6. Klauzula 2: zsynchronizować `gra/data/{civs,units,civ-matrix}.json` z pinem `edb8fb56` albo jawnie zmienić pin (decyzja właściciela, §7 pkt 8); potem ponowny hashcheck 29/29.

**Rekomendacja dla P6:**
- **Czeka (nie startować)**: P6 gameplay core, rekrutacja i walka w runtime, dyplomacja/handel (zależne od L7–L13), miasta (L6), AI (L20–L21), testy zgodności (P3.10).
- **Może trwać równolegle**: P4 renderer (geometria, kamera, jsmath, modele — `renderer/**` nie konsumuje tabel gameplay; zielone w §1), P5 UI shell i viewmodel (`frontend-v2`, `npm run check` zielony), dokumenty P3 dotyczące danych bez zmian kodu.
- Nie blokuje: MP3 (decyzja właściciela), N1/N2, `tracing`, `src-tauri` GTK (osobny temat środowiskowy).

---

## 7. Do decyzji właściciela

1. **Źródło prawdy tabel**: `gra/data` (pin) czy `rust-port/engine/data/derived/*.json` (edytowalne liczby, P3-19 Q1/Q3). Zmienia interpretację klauzuli 1.
2. **27 niepodpiętych plików `gra/data`** (§2.1): podpiąć do runtime teraz (P3.9 do końca) czy odłożyć do P6.
3. **Martwy `combat.rs`** (L5): moduł walki bez wywołań z produkcji. Podpiąć do `bridge`/P6 czy usunąć.
4. **3 pliki MP3 w `_wykluczone/`** (manifest 428 zawiera je): wchodzą czy nie.
5. **P3.10 fixtures**: czekać na nagrania weba czy odłożyć testy zgodności do P6.
6. **Pozostałe decyzje z P3-18 §5** (nadal aktualne): Las (L2, już wiązany do `LAS_DEFENSE_MULT_VS_DYSTANS_FLANKA`), Peace ×1 (P3-22 r4, `bb1cc713`), klucze Easy/Hard barbarzyńców (L20), `default_land_fraction` (L18), `STEP_TEN_RESOURCES` (L11).
7. **Wartości w `derived/` vs surowe `units.json`**: akceptacja, że koszty rekrutacji nie są już 1:1 z polami `units.json` (punkt 2 §2).
8. **Źródło `gra/data` na `parity-v2`** (§9 pkt 3): 3 pliki (`civs`, `units`, `civ-matrix`) są starsze niż pin `edb8fb56`, a kopie w `rust-port/engine/data` są z pinu. Synchronizować `gra/data` z pinem czy zmienić pin?

---

## 8. Allowlista, zmiany i sprzątanie

- Zmiany w repo: tylko ten dokument `dyspozycje/rust-port/p3/P3-13R-GATE-RERUN.md` (NOWY) oraz logi `dyspozycje/autobot/runs/R-RUSTPORT-P3-13R-GATE-RERUN-Q1/*.log`. **Zero zmian w `rust-port/**`, `gra/**`, `src-tauri/**`** (potwierdzić `git status`).
- Nieśledzony `rust-port/engine/Cargo.lock` (wygenerowany przez cargo) NIE jest dodawany do commita.
- `src-tauri/frontend-v2/node_modules` — usunięte po pracy; `scratchpad/tgt-*` (CARGO_TARGET_DIR) — usunięte po pracy.
- Commit: w worktree, jawne `git add` (tylko pliki z allowlisty), bez push.
- `DEPLOY/PUSH: NIE WYKONANO`.

---

## 9. Korekta r2 — odpowiedzi na zarzuty Final Control (r1)

Stan odtworzony z commita Operatora `b1e8011e` (detached). `rust-port/engine` identyczny z `2a45e340` (`git diff --quiet 2a45e340 b1e8011e -- rust-port/engine` = 0), więc surowe bramki cargo z załączników A–J nie były przedmiotem zarzutów i NIE uruchamiano ich ponownie (zero zmian w kodzie). Pomiar gra/data wykonano ponownie (`hashcheck-r2.log`). Wycofany: `hashcheck.log` (r1).

| # | Zarzut | Decyzja | Dowód |
|---|---|---|---|
| 1 | hashcheck mierzył kopie `rust-port/engine/data`, nie `gra/data` | **PRZYJĘTE** | `git ls-tree 2a45e340 -- gra/data` vs `edb8fb56`: `civs.json` 2a9c25da ≠ 86fd1394; `units.json` e5b72f6e ≠ 7bf7dd06; `civ-matrix.json` 22053933 ≠ fc94205d. `hashcheck-r2.log` (`git show <rev>:<ścieżka> \| git hash-object --stdin`): **MATCH=26 MISMATCH=3**. Kopie `rust-port/engine/data` = pin 29/29. |
| 2 | klauzula 2 oznaczona PASS | **PRZYJĘTE** | Klauzula 2 = **FAIL** (3 hashe). Manifest 428/428 i `assets_manifest` 13/13 pozostają PASS. |
| 3 | przyczyna niezbadana | **PRZYJĘTE (zbadane)** | `edb8fb56` NIE jest przodkiem `2a45e340`; merge-base `f4c89d00` (2026-09-18). `git rev-list --count 2a45e340..edb8fb56 -- gra/data` = **6** (pin ma commity, których parity-v2 nie ma: m.in. `161ab227` units, `7da24cdb` civ-matrix, `c1e4a27d`); odwrotnie `edb8fb56..2a45e340 -- gra/data` = **0**. Kopie `rust-port/engine/data` zsynchronizowano z pinem w `401a625f` (P3-5B). **Wniosek:** `gra/data` na parity-v2 jest nieaktualny względem pinu w 3 plikach; kopie silnika są z pinu. Naprawa (synchronizacja `gra/data` albo zmiana pinu) = osobny temat, decyzja właściciela (§7 pkt 8). Ten temat nie zmienia kodu. |
| 4 | dryf gałęzi `f1a1740c` | **PRZYJĘTE** | `origin/rust-port/parity-v2` = `f1a1740c` = **3 commity** nad `2a45e340` (`git rev-list --count 2a45e340..f1a1740c` = 3; `2a45e340` jest przodkiem). Zmiany tylko w `rust-port/renderer/**` (23 pliki, +5938): `git diff --stat 2a45e340 f1a1740c -- gra rust-port/engine src-tauri frontend-v2` = pusty. Werdykt dotyczy `2a45e340` (zgodnie z dispatchem); wynik renderera NIE obejmuje 3 nowych commitów — do ponownego biegu w P4. |
| 5 | audyt §3 niekompletny | **PRZYJĘTE** | Dopisano L26–L31 (zmierzone): `ai_turn.rs:357-361`, `745-750`, `943-968`; `map_generator.rs:781-821`; `resource_production.rs:121-130`; `barbarians.rs` API `u64`. Lista „nie zrealizowane” w §3 rozszerzona o L26–L30. |
| 6 | cytat L20 | **PRZYJĘTE** | `barbarian_units_per_camp_for_difficulty` = `barbarians.rs:321-327` (poprawiono w §3 L20). |
| 7 | recruitment oznaczony „ZAMKNIĘTY” bez 4-polowego porównania | **PRZYJĘTE** | Status: „literał usunięty; zgodność 4 pól z `units.json`: NIE_ZMIERZONO” (§2 pkt 2). |
| 8 | CAMP „z notą” mimo `u64` w API | **PRZYJĘTE** | `barbarians.rs:140,166,204,224,249` (`u64`). `grep -rnE '\b(u64\|i64)\b' rust-port/engine/src/domain` = **150** trafień. Status §2 pkt 5 → **CZĘŚCIOWO**. OWNER: `grep -rnE 'owner_id\s*:\s*(Option<)?(u64\|i64)\|player_id\s*:\s*(Option<)?u64' rust-port/engine/src` = **0** (zamknięty). |
| 9 | §5 oparte na LEDGER bez pomiaru | **PRZYJĘTE częściowo** | Zmierzono przynależność: `git rev-list --abbrev-commit 2a45e340` dopasowuje **35/35** SHA z §5 (poza `ef046757`). Zachowanie wierszy LEDGER (np. P3.3, P3.4, P3.13 pierwsza bramka) NIE_ZMIERZONO w tym temacie. |
| 10 | `ef046757` w §5 | **PRZYJĘTE** | Obiekt istnieje w repo; `git merge-base --is-ancestor ef046757 2a45e340` i `… f1a1740c` ≠ 0. Wiersz oznaczony. |
| 11 | potwierdzone: klauzula 1 OPEN, `combat.rs` martwy, `Commit b1e8011e` w allowliście | **bez zmian** | Zgodnie z r1. |

**Werdykt po korekcie r2: FAIL** (bez zmian wartości). Klauzula 1: OPEN (2/29 w runtime; literały w `domain/**`, L1–L31). Klauzula 2: **FAIL** (3/29 `gra/data` ≠ pin). Warunki zamknięcia: §6 pkt 1–6.

**Stan rund:** RUNDA 2/5 (odpowiedź Operatora na zarzuty r1; ta sama tematyka i ID).

**DEPLOY/PUSH: NIE WYKONANO.**

## Załączniki — surowe pełne wyjścia (zawartość logów z `runs/R-RUSTPORT-P3-13R-GATE-RERUN-Q1/`)

### A. engine — cargo fmt --all -- --check
```text
$ cargo fmt --all -- --check
EXIT=0
```

### B. engine — cargo clippy --all-targets -- -D warnings
```text
$ cargo clippy --all-targets -- -D warnings
    Updating crates.io index
     Locking 17 packages to latest compatible versions
   Compiling proc-macro2 v1.0.107
   Compiling quote v1.0.47
   Compiling unicode-ident v1.0.27
   Compiling serde_core v1.0.229
   Compiling zmij v1.0.23
   Compiling serde v1.0.229
   Compiling serde_json v1.0.154
    Checking once_cell v1.21.4
    Checking tracing-core v0.1.36
    Checking pin-project-lite v0.2.17
    Checking itoa v1.0.18
    Checking memchr v2.8.3
   Compiling syn v3.0.9
   Compiling syn v2.0.119
   Compiling serde_derive v1.0.229
   Compiling tracing-attributes v0.1.31
    Checking tracing v0.1.44
    Checking civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_66f475c2-396-1/rust-port/engine)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 34.70s
EXIT=0
```

### C. engine — cargo test --no-fail-fast
```text
$ cargo test --no-fail-fast
   Compiling serde_core v1.0.229
   Compiling once_cell v1.21.4
   Compiling zmij v1.0.23
   Compiling memchr v2.8.3
   Compiling tracing-core v0.1.36
   Compiling pin-project-lite v0.2.17
   Compiling itoa v1.0.18
   Compiling tracing v0.1.44
   Compiling serde_json v1.0.154
   Compiling serde v1.0.229
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_66f475c2-396-1/rust-port/engine)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 38.86s
     Running unittests src/lib.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/civ_engine-534d0fbe62d81309)

running 6 tests
test domain::map_generator::tests::axial_distance_and_neighbours_match_hex_contract ... ok
test domain::map_generator::tests::canonical_climate_band_vectors_match_typescript ... ok
test domain::map_generator::tests::mulberry32_matches_typescript_first_values ... ok
test domain::map_generator::tests::canonical_mask_vectors_match_typescript ... ok
test domain::map_generator::tests::terrain_bias_and_classification_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::value_noise_and_fbm_match_typescript_golden_vectors ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/ai_turn.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/ai_turn-5996b168185bf541)

running 13 tests
test command_wire_shape_is_stable_for_engine_integration ... ok
test civilian_units_do_not_receive_combat_orders ... ok
test ai_turn_default_city_parameters_match_ai_params_json ... ok
test ai_turn_input_serde_round_trip_uses_json_map_entries ... ok
test hex_city_score_enemy_penalty_follows_threat_range_option ... ok
test nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target ... ok
test planner_uses_deterministic_pathfinding_and_never_walks_through_mountains ... ok
test planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking ... ok
test planner_returns_production_then_actions_and_always_ends_the_turn ... ok
test ranged_units_hold_back_when_an_enemy_city_is_close ... ok
test production_matches_spec_priority_and_skips_already_built_buildings ... ok
test settler_founds_only_on_a_qualifying_village_and_respects_city_spacing ... ok
test wounded_units_retreat_before_attacking ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_manifest.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/assets_manifest-15ace12bc1887d43)

running 13 tests
test counts_per_extension_match_p1_11 ... ok
test manifest_dest_paths_are_unique ... ok
test byte_sums_per_category_match_p1_11 ... ok
test manifest_has_header_and_428_data_rows ... ok
test negative_parser_rejects_bad_header_and_columns ... ok
test negative_validator_rejects_missing_file ... ok
test negative_validator_rejects_duplicate_dest ... ok
test negative_validator_rejects_wrong_size ... ok
test negative_validator_rejects_wrong_sha ... ok
test sha1_matches_known_vectors ... ok
test no_files_outside_manifest_in_assets_dir ... ok
test every_manifest_entry_exists_with_declared_size ... ok
test every_entry_blob_sha1_matches_manifest_column ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.01s

     Running tests/barbarians.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/barbarians-a5e14b9c4c48801b)

running 10 tests
test barbarian_city_garrison_spawns_units_without_a_building_queue ... ok
test camp_destruction_removes_only_the_entered_camp ... ok
test camp_spawning_is_deterministic_and_honours_city_and_camp_spacing ... ok
test camp_spawning_rejects_owned_and_permanently_cleared_hexes ... ok
test empty_city_capture_is_hard_only_and_defenders_block_barbarians ... ok
test camp_tick_decrements_cooldown_and_respects_owned_unit_cap ... ok
test naval_camps_are_purged_without_spawning_sea_peoples ... ok
test rally_moves_multiple_units_toward_their_shared_camp ... ok
test state_round_trip_preserves_camp_identity_and_visit_memory ... ok
test movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/bridge_add_player.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/bridge_add_player-b44cc64b72465353)

running 1 test
test bridge::add_player_atomicity_tests::add_player_leaves_mock_state_untouched_when_the_game_rejects_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/building_costs.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/building_costs-10012e32693dbe76)

running 10 tests
test effective_work_cost_is_raw_work_web_one_to_one ... ok
test expenditure_requires_both_work_and_all_resources ... ok
test empty_resource_cost_is_affordable_without_a_stock_map ... ok
test failed_spend_does_not_mutate_the_input_stock ... ok
test resource_cost_is_independent_and_missing_resources_are_reported ... ok
test mutable_spend_is_atomic_and_preserves_unrelated_resources ... ok
test serde_round_trip_keeps_the_split_cost_contract ... ok
test successful_spend_deducts_effective_work_and_raw_stock_atomically ... ok
test work_cost_is_linear_and_levels_are_one_based ... ok
test canonical_catalog_contains_all_buildings_and_preserves_split_values ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_growth.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/city_growth-05d7c932e40c39aa)

running 10 tests
test a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn ... ok
test fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed ... ok
test deficit_reduces_population_to_one_without_health_boosting_negative_food ... ok
test fractional_growth_accumulates_and_freezes_at_the_population_cap ... ok
test granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention ... ok
test growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs ... ok
test hunger_penalty_is_separate_and_never_drops_below_one ... ok
test population_at_cap_is_frozen_but_surplus_food_is_not_spent ... ok
test population_cap_uses_the_three_canonical_building_steps ... ok
test positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_id.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/city_id-896e6a3bad264f21)

running 6 tests
test barbarian_city_garrison_json_keeps_numeric_city_id ... ok
test barbarian_cleared_cities_round_trip_as_numbers ... ok
test city_id_conversions_round_trip ... ok
test city_id_map_keys_stay_numeric_in_json ... ok
test city_id_ordering_matches_raw_value ... ok
test city_id_serializes_as_bare_number ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/combat-08d43b63cfbe765a)

running 7 tests
test empty_defender_side_gives_non_empty_attacker_the_win ... ok
test canonical_counter_table_matches_confirmed_attack_rows ... ok
test resolver_is_order_independent_and_preserves_ids ... ok
test losses_are_smaller_for_the_winner_in_a_decisive_matchup ... ok
test effective_strength_applies_counters_terrain_and_siege_structures ... ok
test empty_attacker_side_gives_non_empty_defender_the_win ... ok
test resolver_returns_deterministic_winner_and_per_unit_losses ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat_ai_multipliers.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/combat_ai_multipliers-c21c0d8a2b437070)

running 5 tests
test city_structure_bonuses_are_positive_and_mur_is_the_largest_single_bonus ... ok
test accessors_return_the_table_value_not_a_constant ... ok
test table_has_each_row_once_with_known_class_and_status ... ok
test las_row_is_class_a_and_marked_read_by_domain ... ok
test veteran_levels_are_complete_and_non_decreasing ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_buildings_tech.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/data_buildings_tech-eac4da05df1eb17f)

running 3 tests
test tech_json_parses ... ok
test wonders_json_parses ... ok
test buildings_json_parses ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_civilizations.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/data_civilizations-ba1bb20bf96ba8a5)

running 7 tests
test civ_ai_json_parses_and_spot_checks ... ok
test city_names_pools_json_parses_and_spot_checks ... ok
test civ_params_json_parses_and_spot_checks ... ok
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
test diplomacy_json_parses_and_spot_checks ... ok
test civ_matrix_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_compliance.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/data_compliance-e79e9f82ae549bf2)

running 40 tests
test civs_count_and_ids_match_web_pin ... ok
test civ_auxiliary_files_civ_ids_match_web_pin ... ok
test collection_counts_match_web_pin ... ok
test all_29_data_files_parse_with_rust_modules ... ok
test collection_id_sets_match_web_pin ... ok
test roundtrip_covers_all_29_data_files ... ok
test roundtrip_pins_cover_all_29_files_exactly ... ok
test rt_auto_battle_params ... ok
test rt_ai_params ... ok
test rt_citizen_resource_upkeep ... ok
test rt_civ_ai ... ok
test embedded_raw_counts_match_web_pin ... ok
test rt_city_names_pools ... ok
test rt_civ_params ... ok
test rt_combat_params ... ok
test rt_counters ... ok
test rt_buildings ... ok
test rt_diplomacy ... ok
test rt_diplomacy_acceptance_points ... ok
test rt_civs ... ok
test rt_e_start_params ... ok
test rt_econ_params ... ok
test rt_epoka_ludnosc_manpower ... ok
test rt_map_gen_params ... ok
test rt_resources ... ok
test rt_miasto_params ... ok
test rt_power_params ... ok
test rt_terrain_combat ... ok
test rt_society_params ... ok
test rt_tech ... ok
test rt_terrain_movement ... ok
test rt_terrain_yields ... ok
test rt_ui_params ... ok
test rt_civ_matrix ... ok
test rt_terrain_improvements ... ok
test rt_wonders ... ok
test web_pin_constants_are_internally_consistent ... ok
test terrain_improvements_parses_strict_with_farma_and_posterunek ... ok
test wonders_state_keys_match_web_pin ... ok
test rt_units ... ok

test result: ok. 40 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.06s

     Running tests/data_economy_society.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/data_economy_society-1144b51dc72182b6)

running 9 tests
test parse_citizen_resource_upkeep_parses_and_spot_checks ... ok
test parse_e_start_params_parses_and_spot_checks ... ok
test parse_miasto_params_parses_and_spot_checks ... ok
test parse_ai_params_parses_and_spot_checks ... ok
test parse_epoka_ludnosc_manpower_parses_and_spot_checks ... ok
test parse_econ_params_parses_and_spot_checks ... ok
test parse_resources_parses_and_spot_checks ... ok
test parse_ui_params_parses_and_spot_checks ... ok
test parse_society_params_parses_and_spot_checks ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_loader.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/data_loader-dedaef4756ca03d6)

running 14 tests
test data_files_list_matches_directory_contents ... ok
test neg_empty_file_is_empty ... ok
test neg_missing_directory_is_directory_missing ... ok
test neg_missing_required_field_is_shape_mismatch_naming_field ... ok
test loads_all_29_files_from_data_dir ... ok
test neg_non_utf8_file_is_not_utf8 ... ok
test neg_missing_file_is_file_missing ... ok
test neg_path_that_is_a_file_is_directory_missing ... ok
test neg_syntax_error_is_invalid_json_on_second_line ... ok
test neg_truncated_json_is_invalid_json_with_position ... ok
test neg_whitespace_only_file_is_empty ... ok
test neg_unreadable_file_is_io ... ok
test neg_number_where_object_expected_is_shape_mismatch_with_position ... ok
test neg_every_listed_file_is_required_by_load_all ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.38s

     Running tests/data_terrain_map.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/data_terrain_map-2cfa81b7363a7766)

running 4 tests
test terrain_movement_parses_and_spot_checks ... ok
test terrain_yields_parses_and_spot_checks ... ok
test map_gen_params_parses_and_spot_checks ... ok
test terrain_improvements_parses_and_spot_checks ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_units_combat.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/data_units_combat-317f0d4a1a57866b)

running 6 tests
test auto_battle_params_parses_and_spot_checks ... ok
test combat_params_parses_and_spot_checks ... ok
test power_params_parses_and_spot_checks ... ok
test counters_parses_and_spot_checks ... ok
test terrain_combat_parses_and_spot_checks ... ok
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/derived_values.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/derived_values-9e0de78b6d1575dc)

running 25 tests
test basket_and_treaty_duration_read_diplomacy_table ... ok
test building_table_has_exactly_the_42_canonical_ids_once_each ... ok
test building_table_key_shape_is_known_resources_and_mirrors_the_base_keys ... ok
test difficulty_is_one_type_across_domain_modules ... ok
test building_table_palac_has_no_stock_cost_and_others_do ... ok
test diplomacy_multipliers_cover_each_constant_once_with_web_values ... ok
test domain_building_costs_read_the_building_table_values_without_recomputing_them ... ok
test building_gold_upkeep_has_one_row_per_building_level ... ok
test gold_table_has_exactly_the_75_units_once_each_and_known_eras ... ok
test improvement_and_wonder_tables_cover_every_entry_once ... ok
test racje_cover_every_half_step_from_zero_to_six_once ... ok
test research_costs_cover_each_tech_tempo_and_axis_once ... ok
test storage_caps_cover_each_era_and_difficulty_once ... ok
test trade_multipliers_cover_each_constant_once_with_values ... ok
test building_work_states_cover_each_building_level_and_axis_combination_exactly_once ... ok
test domain_recruitment_reads_the_gold_table_without_recomputation ... ok
test domain_recruitment_reads_the_unit_table_values_without_recomputing_them ... ok
test unit_table_epoch_field_matches_units_json ... ok
test unit_food_has_twelve_states_per_unit_and_integer_hundredths ... ok
test unit_gold_states_cover_each_unit_and_axis_combination_exactly_once ... ok
test unit_table_has_one_row_per_units_json_record_and_no_extra_rows ... ok
test work_table_has_exactly_the_42_buildings_once_each_and_positive_values ... ok
test work_table_is_read_by_the_domain_without_recomputation ... ok
test unit_table_keeps_the_units_json_base_as_provenance ... ok
test unit_table_key_shape_and_positive_integer_values ... ok

test result: ok. 25 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/diplomacy.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/diplomacy-f26ca20556fdc538)

running 32 tests
test alliance_uses_configured_hegemon_threshold ... ok
test canonical_value_catalog_prices_non_quantity_basket_items ... ok
test annexation_requires_vassal_economy_orientation ... ok
test alliance_sweetener_ease_is_measured_in_points ... ok
test cyclic_resource_offer_normalizes_units_and_preserves_direction ... ok
test diplomacy_state_serializes_non_empty_pair_map ... ok
test initial_relation_treats_same_minor_type_like_same_type ... ok
test pair_state_canonicalizes_reversed_owner_ids_and_expires_deals ... ok
test peace_price_is_independent_of_treaty_duration ... ok
test production_diplomacy_api_is_public ... ok
test proposal_builds_treaties_with_canonical_pair_and_duration ... ok
test proposal_conditions_cover_war_peace_duplicate_and_trade_fairness ... ok
test quantity_catalog_multiplies_boolean_and_deposit_items ... ok
test relation_is_clamped_and_events_are_immutable ... ok
test proposal_rejects_withdrawn_access_and_invalid_tech_exchange ... ok
test quantity_resource_valuation_uses_blocks_and_floors_requested_units ... ok
test tech_and_boolean_resource_transfers_are_immutable_and_idempotent ... ok
test technology_transfer_obeys_epoch_and_tier_gates ... ok
test serialized_proposal_round_trips_canonical_wire_names ... ok
test tick_stacks_trade_and_peace_tier_but_positive_growth_stops_in_war ... ok
test trade_event_has_no_flat_trust_bonus_and_fairness_keeps_high_relation_discount ... ok
test trade_basket_valuation_multiplies_per_turn_currency_only ... ok
test trade_basket_valuation_uses_player_side_and_difficulty_multipliers ... ok
test trade_quantity_mode_builds_cyclic_exchange_deal ... ok
test transferred_unit_rejects_unknown_type_and_missing_capital_without_mutation ... ok
test transfer_is_atomic_when_recipient_is_missing_and_deterministic_when_split ... ok
test transferred_unit_spawns_at_near_hex_or_recipient_capital ... ok
test treaty_basket_cannot_bypass_fairness_on_nap ... ok
test tribute_offer_zero_gold_once_keeps_recurring_deal ... ok
test trust_events_match_the_canonical_one_shot_deltas ... ok
test war_currency_gate_allows_only_peace_settlements ... ok
test diplomacy_unit_prices_match_units_json_for_every_row ... ok

test result: ok. 32 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/events.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/events-2c95c98fba4386f0)

running 8 tests
test imported_queue_below_the_sequence_ceiling_still_accepts_enqueue ... ok
test deserializing_a_queue_restores_order_and_rejects_duplicate_ids ... ok
test canonical_turn_phases_are_explicit_and_stable ... ok
test queue_orders_turn_then_phase_then_insertion_sequence ... ok
test phase_drain_is_scoped_and_preserves_the_remaining_order ... ok
test built_in_events_map_to_their_responsible_phases ... ok
test imported_queue_with_max_sequence_is_rejected_before_enqueue_can_panic ... ok
test queue_round_trip_preserves_order_and_allocates_a_fresh_sequence ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/hex_terrain.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/hex_terrain-17f3f2e9996fbacd)

running 10 tests
test distance_is_symmetric_and_uses_axial_cube_geometry ... ok
test coordinates_round_trip_through_the_canonical_map_key ... ok
test axial_coordinates_keep_the_cube_invariant ... ok
test coordinates_and_terrain_are_json_round_trip_safe ... ok
test root_reexports_are_the_same_production_api_types ... ok
test terrain_aliases_describe_the_same_source_values ... ok
test every_coordinate_has_six_unique_reversible_neighbors ... ok
test tile_qualification_is_a_pure_terrain_projection ... ok
test terrain_movement_costs_are_explicit ... ok
test terrain_qualification_matches_the_world_map_rules ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/improvements-2db277c8f154a09e)

running 13 tests
test legacy_improvement_keys_and_bonus_fields_preserve_data_contract ... ok
test food_layers_allow_farm_with_irrigation_or_trzoda_but_not_without_farm ... ok
test food_layers_can_coexist_with_non_food_layers ... ok
test livestock_requires_matching_first_deposit_or_explicit_unlock ... ok
test non_food_upgrade_dependencies_are_preserved ... ok
test production_is_pure_and_non_producers_have_zero_logistics ... ok
test production_returns_field_bonuses_and_logistics_rates ... ok
test solo_food_improvements_and_duplicates_are_rejected ... ok
test terrain_and_deposit_gates_are_checked_before_building ... ok
test trzoda_is_not_qualifying_on_forest_but_is_on_open_flat_land ... ok
test terraces_are_hills_only_and_salt_works_reaches_shallow_water ... ok
test forest_rules_distinguish_dependent_and_compatible_improvements ... ok
test tile_and_production_are_json_round_trip_safe ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/map_generator.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/map_generator-db277ade9f4c4158)

running 6 tests
test invalid_dimensions_are_rejected_before_allocation ... ok
test map_golden_vector_matches_typescript_core_contract ... ok
test map_dimensions_and_seed_are_stable ... ok
test world_types_and_default_seed_match_typescript_contract ... ok
test river_markers_are_land_and_reach_water ... ok
test repeated_generation_is_byte_for_byte_deterministic ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/owner_ref.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/owner_ref-a8f54f3d06facc8b)

running 10 tests
test camp_id_is_a_transparent_newtype ... ok
test owner_and_camp_fields_are_plain_numbers_in_struct_json ... ok
test owner_ref_hash_agrees_with_equality ... ok
test owner_ref_accessors_and_player_conversion ... ok
test owner_ref_ordering_matches_the_legacy_i64_order ... ok
test owner_ref_legacy_conversions_match_the_sentinels ... ok
test owner_ref_refuses_player_ids_that_do_not_fit_the_legacy_number ... ok
test owner_ref_serializes_every_variant_as_the_legacy_number ... ok
test player_keyed_maps_keep_numeric_string_keys ... ok
test owner_ref_rejects_unknown_negative_numbers ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/parity_suite.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/parity_suite-2b2cc7249c21cb62)

running 11 tests
test city_growth_vector_preserves_health_threshold_and_population_cap ... ok
test hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs ... ok
test improvements_and_resource_production_vectors_match_catalogue_rules ... ok
test lcg_golden_vector_matches_the_typescript_stream ... ok
test map_generator_coordinate_vector_is_distinct_and_serializable ... ok
test canonical_state_dto_vector_round_trips_through_json ... ok
test public_engine_wire_aliases_are_stable ... ok
test turn_economy_vector_credits_before_spending_and_resets_work ... ok
test trade_route_vector_uses_stable_hex_path_and_wire_identity ... ok
test map_generator_golden_vector_matches_the_public_wire_contract ... ok
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/pathfinding.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/pathfinding-34bef5e38d700926)

running 8 tests
test occupied_intermediate_tiles_block_but_occupied_destination_is_final_step ... ok
test movement_cost_applies_terrain_overlay_river_and_road_rules ... ok
test impassable_destination_is_allowed_as_the_final_step ... ok
test terrain_qualification_keeps_workability_separate_from_movement ... ok
test reachable_respects_fixed_point_budget_and_excludes_origin ... ok
test unreachable_and_missing_fields_are_rejected ... ok
test dijkstra_chooses_the_same_least_cost_path_every_time ... ok
test reachable_applies_min_move_to_expensive_direct_neighbours ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/playable_slice.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/playable_slice-194ba5d83a273536)

running 7 tests
test advance_turn_drains_the_canonical_phase_queue_and_refreshes_state ... ok
test movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations ... ok
test frontend_non_default_payload_reaches_the_rust_start_dto ... ok
test create_session_is_deterministic_and_contains_playable_entities ... ok
test select_and_move_unit_updates_only_the_selected_unit_position ... ok
test selected_start_values_change_the_scenario_without_claiming_unsupported_effects ... ok
test start_params_round_trip_with_frontend_camel_case_names ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/recruitment.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/recruitment-11d3dd91ada574b6)

running 8 tests
test empty_purchase_cost_is_affordable_and_keeps_stock_unchanged ... ok
test failed_recruitment_is_atomic_and_reports_the_missing_resource ... ok
test canonical_unit_record_keeps_purchase_and_upkeep_separate ... ok
test successful_recruitment_spends_purchase_stock_but_not_future_upkeep ... ok
test recruitment_affordability_checks_only_the_one_time_purchase_stock ... ok
test upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units ... ok
test canonical_catalog_contains_all_unit_rows_and_round_trips ... ok
test canonical_catalog_matches_units_json_for_all_75_rows ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/replay.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/replay-8015bba42843fb1e)

running 6 tests
test playback_cursor_observes_peek_remaining_and_reset ... ok
test replay_playback_preserves_order_rng_checkpoints_and_snapshots ... ok
test recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic ... ok
test replay_log_round_trips_some_snapshot_with_all_snapshot_data ... ok
test replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps ... ok
test replay_validation_rejects_invalid_checkpoint_snapshots ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/resource_production.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/resource_production-df78b54d426ec5ae)

running 5 tests
test era_scaling_rounds_like_the_typescript_resolver_and_saturates ... ok
test lumber_mill_and_quarry_follow_the_200_300_450_era_vector ... ok
test multiple_layers_stack_additively_per_resource ... ok
test invalid_or_missing_era_is_safe_and_other_improvements_stay_flat ... ok
test resolver_rejects_non_producers_and_accepts_legacy_aliases ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/rng.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/rng-21730c75b639a538)

running 4 tests
test copied_state_and_forks_reproduce_independent_streams ... ok
test ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end ... ok
test seeded_stream_matches_the_typescript_lcg_and_repeats ... ok
test serialized_state_round_trip_resumes_the_exact_stream ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/save_load.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/save_load-be7ee1c15db6ad78)

running 6 tests
test explicit_v1_constructor_uses_the_same_migration_contract ... ok
test current_snapshot_round_trips_with_state_queue_rng_and_version ... ok
test invalid_state_is_rejected_during_snapshot_deserialization ... ok
test future_and_incomplete_versions_are_rejected_without_silent_defaults ... ok
test snapshot_parts_can_be_moved_into_a_runtime_restore ... ok
test version_one_snapshot_migrates_by_adding_an_empty_queue ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/smoke.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/smoke-b4eb83668bde7d9f)

running 2 tests
test engine_state_can_be_created_advanced_and_round_tripped ... ok
test one_based_turn_invariant_is_enforced_on_construction_and_deserialization ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/state_dto.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/state_dto-c04d7d23c1e80ec3)

running 10 tests
test city_rejects_empty_names_and_zero_population ... ok
test invalid_entity_reference_is_rejected_by_state_constructor ... ok
test civilization_rejects_empty_names_and_duplicate_entity_references ... ok
test canonical_state_round_trips_through_serde ... ok
test invalid_one_based_turn_is_rejected_during_state_deserialization ... ok
test state_rejects_duplicate_civilization_city_and_unit_ids ... ok
test state_rejects_city_and_unit_positions_outside_the_map ... ok
test state_rejects_unknown_unit_reference ... ok
test state_rejects_unknown_and_mismatched_entity_owners ... ok
test map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/steam_adapter.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/steam_adapter-2091d45b06597c49)

running 5 tests
test missing_cloud_save_key_is_reported_without_fabricating_data ... ok
test production_adapter_is_explicitly_disconnected_and_side_effect_free ... ok
test in_memory_adapter_unlocks_achievements_and_reports_overlay_status ... ok
test in_memory_adapter_round_trips_cloud_save_bytes_exactly ... ok
test unavailable_mock_rejects_every_steam_operation ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/terrain_movement_fix.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/terrain_movement_fix-38aaee5f1e2c06b0)

running 9 tests
test barbarian_camps_spawn_on_passable_land_next_to_tundra ... ok
test ai_turn_desert_movement_cost_matches_web_and_pathfinder ... ok
test ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains ... ok
test barbarian_camps_never_spawn_on_tundra ... ok
test barbarians_treat_tundra_as_impassable_land ... ok
test land_route_bfs_is_blocked_by_tundra_field ... ok
test owners_land_border_ignores_tundra_neighbour ... ok
test land_route_bfs_crosses_desert_field ... ok
test trade_routes_do_not_cross_tundra ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/trade.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/trade-84045a31742e30fa)

running 12 tests
test grants_are_symmetric_and_disappear_with_inactive_routes ... ok
test connection_result_and_tile_helpers_are_small_and_stable ... ok
test income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule ... ok
test diagonal_path_uses_the_canonical_hex_neighbor_order ... ok
test diff_and_serialization_preserve_route_contract ... ok
test land_border_is_required_only_when_territory_data_is_supplied ... ok
test map_and_resource_dtos_use_json_safe_camel_case_contracts ... ok
test land_and_sea_connection_follow_physical_terrain_without_distance_cap ... ok
test resource_flow_moves_only_surplus_and_uses_deterministic_ledger ... ok
test refresh_requires_treaty_and_war_free_route_but_allows_internal_trade ... ok
test route_identity_construction_and_building_limits_are_deterministic ... ok
test route_income_building_and_sea_bonuses_are_aggregated_per_city ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/turn_economy.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/turn_economy-04c0931c73cef09f)

running 7 tests
test resource_costs_are_paid_independently_and_never_underflow ... ok
test flow_helpers_are_deterministic_and_saturating ... ok
test invalid_and_overflow_turn_boundaries_are_rejected_without_mutation ... ok
test settlement_and_balances_round_trip_through_serde ... ok
test pure_preview_does_not_mutate_input_balances ... ok
test settlement_credits_income_before_paying_expenses ... ok
test unused_work_is_reset_but_persistent_balances_carry_forward ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_epoch.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-engine/debug/deps/unit_epoch-94f71196dafa30d0)

running 5 tests
test current_and_previous_epochs_are_available ... ok
test scout_is_available_in_every_epoch ... ok
test epoch_labels_round_trip_and_reject_unknown_values ... ok
test non_scout_from_current_epoch_is_available_but_future_unit_is_not ... ok
test units_older_than_the_previous_epoch_are_rejected ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests civ_engine

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```

### D. renderer — cargo fmt --all -- --check
```text
$ cargo fmt --all -- --check
EXIT=0
```

### E. renderer — cargo clippy -D warnings (bez gpu)
```text
$ cargo clippy --all-targets -- -D warnings (default features)
    Checking pollster v0.4.0
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_66f475c2-396-1/rust-port/renderer)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 4.12s
EXIT=0
```

### F. renderer — cargo clippy -D warnings (--features gpu)
```text
$ cargo clippy --all-targets --features gpu -- -D warnings
   Compiling proc-macro2 v1.0.107
   Compiling quote v1.0.47
   Compiling unicode-ident v1.0.27
    Checking cfg-if v1.0.5
   Compiling cfg_aliases v0.2.2
    Checking foldhash v0.2.0
    Checking equivalent v1.0.3
   Compiling thiserror v2.0.21
   Compiling autocfg v1.5.1
   Compiling libm v0.2.16
    Checking hashbrown v0.17.1
   Compiling num-traits v0.2.19
   Compiling syn v3.0.9
   Compiling syn v2.0.119
    Checking libloading v0.8.9
   Compiling libc v0.2.191
   Compiling zerocopy v0.8.63
    Checking log v0.4.34
    Checking indexmap v2.14.2
    Checking rustc-hash v1.1.0
    Checking bitflags v2.13.2
   Compiling naga v30.0.1
    Checking bit-vec v0.9.1
   Compiling parking_lot_core v0.9.12
   Compiling pkg-config v0.3.34
   Compiling ash v0.38.0+1.3.281
    Checking unicode-width v0.2.2
    Checking once_cell v1.21.4
   Compiling thiserror-impl v2.0.21
   Compiling bytemuck_derive v1.12.1
    Checking codespan-reporting v0.13.1
   Compiling wayland-sys v0.31.11
    Checking bit-set v0.10.0
    Checking spirv v0.4.0+sdk-1.4.341.0
    Checking naga-types v30.0.1
    Checking bytemuck v1.25.2
    Checking static_assertions v1.1.0
    Checking allocator-api2 v0.2.21
   Compiling zerocopy-derive v0.8.63
    Checking scopeguard v1.2.0
   Compiling khronos-egl v6.0.0
    Checking arrayvec v0.7.8
    Checking raw-window-handle v0.6.2
    Checking smallvec v1.16.3
    Checking wgpu-types v30.0.1
    Checking hashbrown v0.16.1
    Checking lock_api v0.4.14
    Checking dlib v0.5.3
   Compiling wgpu-hal v30.0.1
    Checking presser v0.3.1
    Checking parking_lot v0.12.5
    Checking ordered-float v5.4.0
    Checking profiling v1.0.18
    Checking renderdoc-sys v1.1.0
    Checking glow v0.17.0
   Compiling wgpu-core v30.0.1
   Compiling litrs v1.0.1
   Compiling document-features v0.2.12
   Compiling wgpu v30.0.1
    Checking half v2.7.1
    Checking gpu-allocator v0.28.0
    Checking wgpu-naga-bridge v30.0.1
    Checking wgpu-core-deps-windows-linux-android v30.0.1
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_66f475c2-396-1/rust-port/renderer)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 31.94s
EXIT=0
```

### G. renderer — cargo test (bez gpu)
```text
$ cargo test --no-fail-fast (default features)
   Compiling pollster v0.4.0
   Compiling civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_66f475c2-396-1/rust-port/renderer)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 14.71s
     Running unittests src/lib.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/civ_renderer-e1c00315246754e6)

running 7 tests
test jsmath::words::tests::words_round_trip ... ok
test jsmath::words::tests::scalbn_is_exact_power_of_two_scaling ... ok
test core::jsnum::tests::to_uint32_matches_ecmascript ... ok
test core::jsnum::tests::to_fixed3_matches_node ... ok
test models::wonders::builders::tests::grey_matches_hand_computation ... ok
test models::wonders::builders::tests::registry_covers_the_19_ids_and_defaults_the_rest ... ok
test models::wonders::renderer::tests::default_owner_color_follows_js_remainder ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_nturns.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/assets_nturns-8f54d61b245277a0)

running 6 tests
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM1 small 40x25] turn 50 violations: live buffer: baseline=164 current=590 allowed=164; live bind_group: baseline=27 current=98 allowed=27; live bytes: baseline=4953088 current=6179968 allowed=4953088
[LeakM1 small 40x25] turn 200 violations: live buffer: baseline=164 current=2414 allowed=164; live bind_group: baseline=27 current=402 allowed=27; live bytes: baseline=4953088 current=11433088 allowed=4953088
[new game] after dropping game 1: live=0 live_bytes=0 fake_gpu_live=0
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM2 small 40x25] turn= 10 buffer=36 texture=67 pipeline=3 bind_group=9 live_bytes=5543168 subscriptions=1 created=187 destroyed=72
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
test leak_m3_also_retains_battle_scene_resources ... ok
[LeakM2 small 40x25] turn= 50 buffer=36 texture=306 pipeline=3 bind_group=9 live_bytes=9458944 subscriptions=1 created=712 destroyed=358
[LeakM2 small 40x25] turn=200 buffer=36 texture=1206 pipeline=3 bind_group=9 live_bytes=24204544 subscriptions=1 created=2760 destroyed=1506
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed small 40x25] budget OK at turns [50, 200]
[Fixed large 96x60] turn= 10 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=637 destroyed=434
test new_game_frees_everything_and_restarts_identically ... ok
[LeakM2 small 40x25] turn 50 violations: live texture: baseline=67 current=306 allowed=67; live bytes: baseline=5543168 current=9458944 allowed=5543168
[LeakM2 small 40x25] turn 200 violations: live texture: baseline=67 current=1206 allowed=67; live bytes: baseline=5543168 current=24204544 allowed=5543168
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed large 96x60] turn= 50 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=2337 destroyed=2134
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
[LeakM3 small 40x25] turn 50 violations: live buffer: baseline=68 current=196 allowed=68; live texture: baseline=9 current=17 allowed=9; live bind_group: baseline=11 current=19 allowed=11; live bytes: baseline=6722816 current=15373568 allowed=6722816; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 small 40x25] turn 200 violations: live buffer: baseline=68 current=676 allowed=68; live texture: baseline=9 current=47 allowed=9; live bind_group: baseline=11 current=49 allowed=11; live bytes: baseline=6722816 current=47813888 allowed=6722816; subscriptions: baseline=5 current=81 allowed=5
[LeakM1 large 96x60] turn= 10 buffer=714 texture=25 pipeline=3 bind_group=106 live_bytes=7547008 subscriptions=1 created=1126 destroyed=278
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM1 large 96x60] turn= 50 buffer=2502 texture=25 pipeline=3 bind_group=404 live_bytes=12696448 subscriptions=1 created=4324 destroyed=1390
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
test simulation_is_deterministic ... ok
[LeakM1 large 96x60] turn=200 buffer=9552 texture=25 pipeline=3 bind_group=1579 live_bytes=33000448 subscriptions=1 created=16718 destroyed=5559
[Fixed large 96x60] turn=200 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=8826 destroyed=8623
[Fixed large 96x60] budget OK at turns [50, 200]
test fixed_registry_stays_within_budget_after_10_50_200_turns ... ok
[LeakM1 large 96x60] turn 50 violations: live buffer: baseline=714 current=2502 allowed=714; live bind_group: baseline=106 current=404 allowed=106; live bytes: baseline=7547008 current=12696448 allowed=7547008
[LeakM1 large 96x60] turn 200 violations: live buffer: baseline=714 current=9552 allowed=714; live bind_group: baseline=106 current=1579 allowed=106; live bytes: baseline=7547008 current=33000448 allowed=7547008
[LeakM2 large 96x60] turn= 10 buffer=148 texture=265 pipeline=3 bind_group=27 live_bytes=9737216 subscriptions=1 created=637 destroyed=194
[LeakM2 large 96x60] turn= 50 buffer=148 texture=1224 pipeline=3 bind_group=27 live_bytes=25449472 subscriptions=1 created=2336 destroyed=934
[rebuild 1000 cycles] start: turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55 destroyed=0
[rebuild 1000 cycles] end:   turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55055 destroyed=55000
test rebuild_in_place_1000_cycles_returns_to_initial_state ... ok
[LeakM2 large 96x60] turn=200 buffer=148 texture=4815 pipeline=3 bind_group=27 live_bytes=84284416 subscriptions=1 created=8817 destroyed=3824
[LeakM2 large 96x60] turn 50 violations: live texture: baseline=265 current=1224 allowed=265; live bytes: baseline=9737216 current=25449472 allowed=9737216
[LeakM2 large 96x60] turn 200 violations: live texture: baseline=265 current=4815 allowed=265; live bytes: baseline=9737216 current=84284416 allowed=9737216
[LeakM3 large 96x60] turn= 10 buffer=180 texture=27 pipeline=3 bind_group=29 live_bytes=7967744 subscriptions=5 created=637 destroyed=398
[LeakM3 large 96x60] turn= 50 buffer=308 texture=35 pipeline=3 bind_group=37 live_bytes=16618496 subscriptions=21 created=2337 destroyed=1954
[LeakM3 large 96x60] turn=200 buffer=788 texture=65 pipeline=3 bind_group=67 live_bytes=49058816 subscriptions=81 created=8826 destroyed=7903
[LeakM3 large 96x60] turn 50 violations: live buffer: baseline=180 current=308 allowed=180; live texture: baseline=27 current=35 allowed=27; live bind_group: baseline=29 current=37 allowed=29; live bytes: baseline=7967744 current=16618496 allowed=7967744; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 large 96x60] turn 200 violations: live buffer: baseline=180 current=788 allowed=180; live texture: baseline=27 current=65 allowed=27; live bind_group: baseline=29 current=67 allowed=29; live bytes: baseline=7967744 current=49058816 allowed=7967744; subscriptions: baseline=5 current=81 allowed=5
test each_leak_pattern_breaks_the_budget ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.10s

     Running tests/assets_registry.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/assets_registry-69841652a4de3f64)

running 14 tests
test cache_end_of_turn_trims_only_unreferenced_entries ... ok
test budget_thresholds_are_configurable ... ok
test handle_from_another_registry_is_rejected ... ok
test live_report_lists_labels ... ok
test cache_lru_by_entries_and_bytes ... ok
test drop_and_clone_inside_with_are_deferred_not_panicking ... ok
test registry_replace_creates_new_before_freeing_old ... ok
test scope_releases_everything_it_created_on_drop ... ok
test stale_handle_is_an_error_not_a_panic ... ok
test subscription_dropped_inside_callback_is_removed_after_emit ... ok
test subscriptions_unregister_on_drop ... ok
test owned_guards_count_references ... ok
test owned_replace_creates_new_before_freeing_old_and_keeps_shared_old ... ok
test reference_counting_frees_on_last_release ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/camera_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/camera_web_parity-b37e1c23746006cd)

running 5 tests
test frame_at_60_fps_is_exactly_one_web_frame ... ok
test drag_and_wheel_do_not_depend_on_dt ... ok
test pan_scales_with_dt_and_long_frames_are_capped ... ok
test fixture_covers_every_branch ... ok
test camera_controller_matches_web_100_percent ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s

     Running tests/core_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/core_web_parity-2900a14aa436a050)

running 8 tests
test hex_shape_matches_web ... ok
test bronze_city_types_match_web ... ok
test merge_decor_matches_web ... ok
test vitals_match_web ... ok
test zoom_lod_matches_web ... ok
test fog_dim_matches_web ... ok
test map_style_matches_web ... ok
test hexutil_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/cpu_sanity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/cpu_sanity-3fd48f6fa6791f24)

running 1 test
test gpu_feature_readback_matches_build_configuration ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/decor_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/decor_web_parity-5222ad194ec91469)

running 8 tests
test decor_reuses_core_instead_of_copies ... ok
test decor_uses_jsmath_not_platform_libm ... ok
test hex_hash_functions_match_web ... ok
test river_lod_matches_web ... ok
test coast_builders_are_bit_identical_to_web ... ok
test shared_geometries_are_bit_identical_to_web ... ok
test relief_surface_height_matches_web ... ok
test builders_are_bit_identical_to_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.80s

     Running tests/geom_three_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/geom_three_parity-3d1c4e34042c8932)

running 17 tests
test index_buffer_covers_non_indexed_meshes ... ok
test parity_circle ... ok
test parity_cone ... ok
test parity_curve ... ok
test parity_box ... ok
test merge_rejects_mixed_indexing ... ok
test parity_extrude ... ok
test parity_plane ... ok
test parity_ring ... ok
test parity_cylinder ... ok
test parity_shape ... ok
test parity_ops ... ok
test parity_polyhedron ... ok
test trs_matches_manual_composition ... ok
test parity_torus ... ok
test parity_tube ... ok
test parity_sphere ... ok

test result: ok. 17 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/gpu_probe.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/gpu_probe-ee6ac917c1be8ff5)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/improvements_web_parity-3db3df4b3938dfb5)

running 3 tests
test data_tables_match_web ... ok
test prototype_keys_documented_deviation ... ok
test models_are_bit_identical_to_web ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.80s

     Running tests/jsmath_v8_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/jsmath_v8_parity-8879fe5756263fa9)

running 13 tests
test compatibility_paths_are_the_same_functions ... ok
test atan2_matches_v8 ... ok
test acos_matches_v8 ... ok
test atan_matches_v8 ... ok
test exp_matches_v8 ... ok
test hypot_three_arguments_matches_v8 ... ok
test hypot_matches_v8 ... ok
test cos_matches_v8 ... ok
test log_matches_v8 ... ok
test sin_matches_v8 ... ok
test whole_domain_without_platform_fallback ... ok
test pow_matches_v8 ... ok
test tan_matches_v8 ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.08s

     Running tests/jsmath_wiring.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/jsmath_wiring-cd677df7f219b1b7)

running 6 tests
test pick_hex_prism_vertices_use_v8_trig ... ok
test geom_rotation_and_euler_use_v8_trig ... ok
test terrain_rotation_uses_v8_trig ... ok
test pick_quat_from_euler_xyz_uses_v8_trig ... ok
test scanner_catches_known_bypass_forms ... ok
test no_platform_transcendentals_anywhere_in_src ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.23s

     Running tests/pick_golden.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/pick_golden-4daeac79d56d39a7)

running 7 tests
test js_round_matches_math_round ... ok
test client_rect_to_ndc_matches_web ... ok
test prism_geometry_is_bitwise_three_cylinder ... ok
test terrain_scene_instances_are_bitwise_web ... ok
test world_to_axial_both_variants_match_web ... ok
test camera_matrices_and_rays_are_bitwise_three ... ok
test golden_picks_match_web_100_percent ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.88s

     Running tests/terrain_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/terrain_web_parity-a99a8a09152669ee)

running 5 tests
test js_pow_special_cases_follow_v8 ... ok
test fog_hides_unknown_and_dims_explored ... ok
test color_math_matches_three ... ok
test terrain_fog_matches_web ... ok
test terrain_build_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.40s

     Running tests/unit_core_json.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/unit_core_json-32ffccaa4cf3d5cf)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_core_model_rule.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/unit_core_model_rule-538a4ffa59989ab0)

running 7 tests
test pending_registry_is_explicit ... ok
test table_equals_the_legacy_pl_route_and_names_never_matter ... ok
test unknown_type_falls_back_to_category_with_a_warning ... ok
test legacy_en_path_reproduces_exactly_the_three_web_divergences ... ok
test rule_table_covers_exactly_the_77_unit_types ... ok
test norm_name_and_culture_match_the_web ... ok
test web_signature_classes_equal_rust_model_id_classes ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.58s

     Running tests/unit_core_trig.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/unit_core_trig-c84f9190ebf2fab7)

running 2 tests
test quat_from_euler_honours_every_order ... ok
test js_trig_matches_v8_bit_for_bit_and_libm_does_not ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/unit_core_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/unit_core_web_parity-ffed60bf227df2ba)

running 3 tests
test signature_is_sensitive_to_owner_colour_and_pose ... ok
test part_catalogues_match_the_web_singletons ... ok
test every_web_case_is_reproduced_bit_for_bit ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.62s

     Running tests/units_kamien_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/units_kamien_web_parity-b570c69c51476604)

running 5 tests
test asin_matches_v8 ... ok
test routing_no_longer_returns_not_yet_ported_for_the_stone_package ... ok
test the_ten_records_cover_every_mod05_builder_and_counts_match_the_web ... ok
test unit_core_record_signatures_of_the_stone_records_match ... ok
test every_web_case_is_reproduced_bit_for_bit ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.69s

     Running tests/wonders_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/wonders_web_parity-f4030617be94de7f)

running 4 tests
test renderer_scenario_is_bit_identical_to_web ... ok
test js_trig_is_bit_identical_to_v8 ... ok
test registry_matches_web_ids ... ok
test models_are_bit_identical_to_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.20s

   Doc-tests civ_renderer

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```

### H. renderer — cargo test --features gpu
```text
$ cargo test --no-fail-fast --features gpu
   Compiling unicode-ident v1.0.27
   Compiling cfg-if v1.0.5
   Compiling foldhash v0.2.0
   Compiling equivalent v1.0.3
   Compiling libm v0.2.16
   Compiling libloading v0.8.9
   Compiling proc-macro2 v1.0.107
   Compiling hashbrown v0.17.1
   Compiling log v0.4.34
   Compiling quote v1.0.47
   Compiling bitflags v2.13.2
   Compiling syn v3.0.9
   Compiling syn v2.0.119
   Compiling indexmap v2.14.2
   Compiling num-traits v0.2.19
   Compiling rustc-hash v1.1.0
   Compiling libc v0.2.191
   Compiling unicode-width v0.2.2
   Compiling bit-vec v0.9.1
   Compiling once_cell v1.21.4
   Compiling bit-set v0.10.0
   Compiling codespan-reporting v0.13.1
   Compiling spirv v0.4.0+sdk-1.4.341.0
   Compiling thiserror-impl v2.0.21
   Compiling bytemuck_derive v1.12.1
   Compiling static_assertions v1.1.0
   Compiling raw-window-handle v0.6.2
   Compiling scopeguard v1.2.0
   Compiling allocator-api2 v0.2.21
   Compiling thiserror v2.0.21
   Compiling naga-types v30.0.1
   Compiling arrayvec v0.7.8
   Compiling smallvec v1.16.3
   Compiling zerocopy-derive v0.8.63
   Compiling bytemuck v1.25.2
   Compiling hashbrown v0.16.1
   Compiling parking_lot_core v0.9.12
   Compiling wgpu-types v30.0.1
   Compiling lock_api v0.4.14
   Compiling ash v0.38.0+1.3.281
   Compiling dlib v0.5.3
   Compiling presser v0.3.1
   Compiling wayland-sys v0.31.11
   Compiling zerocopy v0.8.63
   Compiling khronos-egl v6.0.0
   Compiling parking_lot v0.12.5
   Compiling ordered-float v5.4.0
   Compiling renderdoc-sys v1.1.0
   Compiling profiling v1.0.18
   Compiling glow v0.17.0
   Compiling half v2.7.1
   Compiling naga v30.0.1
   Compiling gpu-allocator v0.28.0
   Compiling wgpu-naga-bridge v30.0.1
   Compiling wgpu-hal v30.0.1
   Compiling wgpu-core-deps-windows-linux-android v30.0.1
   Compiling wgpu-core v30.0.1
   Compiling wgpu v30.0.1
   Compiling civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_66f475c2-396-1/rust-port/renderer)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 1m 40s
     Running unittests src/lib.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/civ_renderer-b3998333abd235ce)

running 7 tests
test core::jsnum::tests::to_fixed3_matches_node ... ok
test jsmath::words::tests::scalbn_is_exact_power_of_two_scaling ... ok
test jsmath::words::tests::words_round_trip ... ok
test models::wonders::builders::tests::grey_matches_hand_computation ... ok
test models::wonders::renderer::tests::default_owner_color_follows_js_remainder ... ok
test core::jsnum::tests::to_uint32_matches_ecmascript ... ok
test models::wonders::builders::tests::registry_covers_the_19_ids_and_defaults_the_rest ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_nturns.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/assets_nturns-d9e037752f1b3708)

running 6 tests
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[new game] after dropping game 1: live=0 live_bytes=0 fake_gpu_live=0
test new_game_frees_everything_and_restarts_identically ... ok
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed small 40x25] budget OK at turns [50, 200]
[Fixed large 96x60] turn= 10 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=637 destroyed=434
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM1 small 40x25] turn 50 violations: live buffer: baseline=164 current=590 allowed=164; live bind_group: baseline=27 current=98 allowed=27; live bytes: baseline=4953088 current=6179968 allowed=4953088
[LeakM1 small 40x25] turn 200 violations: live buffer: baseline=164 current=2414 allowed=164; live bind_group: baseline=27 current=402 allowed=27; live bytes: baseline=4953088 current=11433088 allowed=4953088
[LeakM2 small 40x25] turn= 10 buffer=36 texture=67 pipeline=3 bind_group=9 live_bytes=5543168 subscriptions=1 created=187 destroyed=72
[LeakM2 small 40x25] turn= 50 buffer=36 texture=306 pipeline=3 bind_group=9 live_bytes=9458944 subscriptions=1 created=712 destroyed=358
[Fixed large 96x60] turn= 50 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=2337 destroyed=2134
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[LeakM2 small 40x25] turn=200 buffer=36 texture=1206 pipeline=3 bind_group=9 live_bytes=24204544 subscriptions=1 created=2760 destroyed=1506
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
[LeakM2 small 40x25] turn 50 violations: live texture: baseline=67 current=306 allowed=67; live bytes: baseline=5543168 current=9458944 allowed=5543168
[LeakM2 small 40x25] turn 200 violations: live texture: baseline=67 current=1206 allowed=67; live bytes: baseline=5543168 current=24204544 allowed=5543168
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
[LeakM3 small 40x25] turn 50 violations: live buffer: baseline=68 current=196 allowed=68; live texture: baseline=9 current=17 allowed=9; live bind_group: baseline=11 current=19 allowed=11; live bytes: baseline=6722816 current=15373568 allowed=6722816; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 small 40x25] turn 200 violations: live buffer: baseline=68 current=676 allowed=68; live texture: baseline=9 current=47 allowed=9; live bind_group: baseline=11 current=49 allowed=11; live bytes: baseline=6722816 current=47813888 allowed=6722816; subscriptions: baseline=5 current=81 allowed=5
[LeakM1 large 96x60] turn= 10 buffer=714 texture=25 pipeline=3 bind_group=106 live_bytes=7547008 subscriptions=1 created=1126 destroyed=278
[LeakM1 large 96x60] turn= 50 buffer=2502 texture=25 pipeline=3 bind_group=404 live_bytes=12696448 subscriptions=1 created=4324 destroyed=1390
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
test leak_m3_also_retains_battle_scene_resources ... ok
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[Fixed large 96x60] turn=200 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=8826 destroyed=8623
[Fixed large 96x60] budget OK at turns [50, 200]
[LeakM1 large 96x60] turn=200 buffer=9552 texture=25 pipeline=3 bind_group=1579 live_bytes=33000448 subscriptions=1 created=16718 destroyed=5559
[LeakM1 large 96x60] turn 50 violations: live buffer: baseline=714 current=2502 allowed=714; live bind_group: baseline=106 current=404 allowed=106; live bytes: baseline=7547008 current=12696448 allowed=7547008
[LeakM1 large 96x60] turn 200 violations: live buffer: baseline=714 current=9552 allowed=714; live bind_group: baseline=106 current=1579 allowed=106; live bytes: baseline=7547008 current=33000448 allowed=7547008
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM2 large 96x60] turn= 10 buffer=148 texture=265 pipeline=3 bind_group=27 live_bytes=9737216 subscriptions=1 created=637 destroyed=194
[LeakM2 large 96x60] turn= 50 buffer=148 texture=1224 pipeline=3 bind_group=27 live_bytes=25449472 subscriptions=1 created=2336 destroyed=934
test fixed_registry_stays_within_budget_after_10_50_200_turns ... ok
[LeakM2 large 96x60] turn=200 buffer=148 texture=4815 pipeline=3 bind_group=27 live_bytes=84284416 subscriptions=1 created=8817 destroyed=3824
[LeakM2 large 96x60] turn 50 violations: live texture: baseline=265 current=1224 allowed=265; live bytes: baseline=9737216 current=25449472 allowed=9737216
[LeakM2 large 96x60] turn 200 violations: live texture: baseline=265 current=4815 allowed=265; live bytes: baseline=9737216 current=84284416 allowed=9737216
[LeakM3 large 96x60] turn= 10 buffer=180 texture=27 pipeline=3 bind_group=29 live_bytes=7967744 subscriptions=5 created=637 destroyed=398
[LeakM3 large 96x60] turn= 50 buffer=308 texture=35 pipeline=3 bind_group=37 live_bytes=16618496 subscriptions=21 created=2337 destroyed=1954
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM3 large 96x60] turn=200 buffer=788 texture=65 pipeline=3 bind_group=67 live_bytes=49058816 subscriptions=81 created=8826 destroyed=7903
[LeakM3 large 96x60] turn 50 violations: live buffer: baseline=180 current=308 allowed=180; live texture: baseline=27 current=35 allowed=27; live bind_group: baseline=29 current=37 allowed=29; live bytes: baseline=7967744 current=16618496 allowed=7967744; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 large 96x60] turn 200 violations: live buffer: baseline=180 current=788 allowed=180; live texture: baseline=27 current=65 allowed=27; live bind_group: baseline=29 current=67 allowed=29; live bytes: baseline=7967744 current=49058816 allowed=7967744; subscriptions: baseline=5 current=81 allowed=5
test each_leak_pattern_breaks_the_budget ... ok
[rebuild 1000 cycles] start: turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55 destroyed=0
[rebuild 1000 cycles] end:   turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55055 destroyed=55000
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
test rebuild_in_place_1000_cycles_returns_to_initial_state ... ok
test simulation_is_deterministic ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.10s

     Running tests/assets_registry.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/assets_registry-a416553290e0cd95)

running 14 tests
test budget_thresholds_are_configurable ... ok
test cache_end_of_turn_trims_only_unreferenced_entries ... ok
test live_report_lists_labels ... ok
test owned_guards_count_references ... ok
test owned_replace_creates_new_before_freeing_old_and_keeps_shared_old ... ok
test reference_counting_frees_on_last_release ... ok
test registry_replace_creates_new_before_freeing_old ... ok
test scope_releases_everything_it_created_on_drop ... ok
test stale_handle_is_an_error_not_a_panic ... ok
test subscription_dropped_inside_callback_is_removed_after_emit ... ok
test subscriptions_unregister_on_drop ... ok
test cache_lru_by_entries_and_bytes ... ok
test handle_from_another_registry_is_rejected ... ok
test drop_and_clone_inside_with_are_deferred_not_panicking ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/camera_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/camera_web_parity-d08dbfd7f0b3ee72)

running 5 tests
test drag_and_wheel_do_not_depend_on_dt ... ok
test pan_scales_with_dt_and_long_frames_are_capped ... ok
test frame_at_60_fps_is_exactly_one_web_frame ... ok
test camera_controller_matches_web_100_percent ... ok
test fixture_covers_every_branch ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s

     Running tests/core_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/core_web_parity-4e180bd58f66e73b)

running 8 tests
test hex_shape_matches_web ... ok
test fog_dim_matches_web ... ok
test bronze_city_types_match_web ... ok
test merge_decor_matches_web ... ok
test map_style_matches_web ... ok
test zoom_lod_matches_web ... ok
test vitals_match_web ... ok
test hexutil_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/cpu_sanity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/cpu_sanity-91efd921c878b79c)

running 1 test
test gpu_feature_readback_matches_build_configuration ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/decor_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/decor_web_parity-5dd07ca76dec5b41)

running 8 tests
test decor_reuses_core_instead_of_copies ... ok
test decor_uses_jsmath_not_platform_libm ... ok
test coast_builders_are_bit_identical_to_web ... ok
test river_lod_matches_web ... ok
test hex_hash_functions_match_web ... ok
test shared_geometries_are_bit_identical_to_web ... ok
test relief_surface_height_matches_web ... ok
test builders_are_bit_identical_to_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.58s

     Running tests/geom_three_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/geom_three_parity-c689bfc6376c602b)

running 17 tests
test index_buffer_covers_non_indexed_meshes ... ok
test parity_circle ... ok
test merge_rejects_mixed_indexing ... ok
test parity_cone ... ok
test parity_box ... ok
test parity_curve ... ok
test parity_extrude ... ok
test parity_ops ... ok
test parity_plane ... ok
test parity_ring ... ok
test parity_shape ... ok
test parity_cylinder ... ok
test parity_torus ... ok
test trs_matches_manual_composition ... ok
test parity_polyhedron ... ok
test parity_tube ... ok
test parity_sphere ... ok

test result: ok. 17 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/gpu_probe.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/gpu_probe-7cb40783bcfd7ab3)

running 1 test
SKIPPED: no GPU adapter (request_adapter error: No suitable graphics adapter found; noop support not compiled in, vulkan drivers/libraries could not be loaded, metal support not compiled in, dx12 support not compiled in, gl drivers/libraries could not be loaded, webgpu support not compiled in)
test gpu_probe_adapter_or_explicit_skip ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/improvements_web_parity-c051e92678c6765d)

running 3 tests
test prototype_keys_documented_deviation ... ok
test data_tables_match_web ... ok
test models_are_bit_identical_to_web ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.73s

     Running tests/jsmath_v8_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/jsmath_v8_parity-4c0558752e4154c4)

running 13 tests
test compatibility_paths_are_the_same_functions ... ok
test acos_matches_v8 ... ok
test atan_matches_v8 ... ok
test exp_matches_v8 ... ok
test hypot_three_arguments_matches_v8 ... ok
test atan2_matches_v8 ... ok
test log_matches_v8 ... ok
test hypot_matches_v8 ... ok
test cos_matches_v8 ... ok
test pow_matches_v8 ... ok
test whole_domain_without_platform_fallback ... ok
test sin_matches_v8 ... ok
test tan_matches_v8 ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s

     Running tests/jsmath_wiring.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/jsmath_wiring-6e724227b7ea19f1)

running 6 tests
test pick_hex_prism_vertices_use_v8_trig ... ok
test scanner_catches_known_bypass_forms ... ok
test geom_rotation_and_euler_use_v8_trig ... ok
test terrain_rotation_uses_v8_trig ... ok
test pick_quat_from_euler_xyz_uses_v8_trig ... ok
test no_platform_transcendentals_anywhere_in_src ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.22s

     Running tests/pick_golden.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/pick_golden-5eb64213209d143b)

running 7 tests
test client_rect_to_ndc_matches_web ... ok
test prism_geometry_is_bitwise_three_cylinder ... ok
test js_round_matches_math_round ... ok
test world_to_axial_both_variants_match_web ... ok
test terrain_scene_instances_are_bitwise_web ... ok
test camera_matrices_and_rays_are_bitwise_three ... ok
test golden_picks_match_web_100_percent ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.59s

     Running tests/terrain_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/terrain_web_parity-dc03cce5311feb07)

running 5 tests
test js_pow_special_cases_follow_v8 ... ok
test fog_hides_unknown_and_dims_explored ... ok
test color_math_matches_three ... ok
test terrain_build_matches_web ... ok
test terrain_fog_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.21s

     Running tests/unit_core_json.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/unit_core_json-cdcaa6e6ef180a75)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_core_model_rule.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/unit_core_model_rule-d0f50c4e8426502a)

running 7 tests
test pending_registry_is_explicit ... ok
test table_equals_the_legacy_pl_route_and_names_never_matter ... ok
test unknown_type_falls_back_to_category_with_a_warning ... ok
test legacy_en_path_reproduces_exactly_the_three_web_divergences ... ok
test rule_table_covers_exactly_the_77_unit_types ... ok
test norm_name_and_culture_match_the_web ... ok
test web_signature_classes_equal_rust_model_id_classes ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.35s

     Running tests/unit_core_trig.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/unit_core_trig-b408479bf34fa05d)

running 2 tests
test quat_from_euler_honours_every_order ... ok
test js_trig_matches_v8_bit_for_bit_and_libm_does_not ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/unit_core_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/unit_core_web_parity-af773ae6513ae356)

running 3 tests
test signature_is_sensitive_to_owner_colour_and_pose ... ok
test part_catalogues_match_the_web_singletons ... ok
test every_web_case_is_reproduced_bit_for_bit ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.41s

     Running tests/units_kamien_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/units_kamien_web_parity-3c8ca7f2e71eff80)

running 5 tests
test asin_matches_v8 ... ok
test routing_no_longer_returns_not_yet_ported_for_the_stone_package ... ok
test the_ten_records_cover_every_mod05_builder_and_counts_match_the_web ... ok
test unit_core_record_signatures_of_the_stone_records_match ... ok
test every_web_case_is_reproduced_bit_for_bit ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.45s

     Running tests/wonders_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-renderer/debug/deps/wonders_web_parity-2c6be647b37fb41e)

running 4 tests
test js_trig_is_bit_identical_to_v8 ... ok
test renderer_scenario_is_bit_identical_to_web ... ok
test registry_matches_web_ids ... ok
test models_are_bit_identical_to_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.23s

   Doc-tests civ_renderer

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```

### I. spike-gpu-embed — cargo test --no-default-features
```text
$ cargo test --no-default-features --no-fail-fast
   Compiling proc-macro2 v1.0.107
   Compiling quote v1.0.47
   Compiling unicode-ident v1.0.26
   Compiling serde_core v1.0.229
   Compiling zmij v1.0.23
   Compiling serde_json v1.0.151
   Compiling serde v1.0.229
   Compiling memchr v2.8.3
   Compiling spike-gpu-embed v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_66f475c2-396-1/rust-port/spike-gpu-embed)
   Compiling itoa v1.0.18
   Compiling syn v3.0.6
   Compiling serde_derive v1.0.229
    Finished `test` profile [unoptimized + debuginfo] target(s) in 7.36s
     Running unittests src/lib.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-spike/debug/deps/spike_gpu_embed-95d9d134eb721a52)

running 39 tests
test clock::tests::rejects_invalid_samples ... ok
test log::tests::clock_is_monotonic ... ok
test clock::tests::negative_offset_is_fine ... ok
test log::tests::format_is_stable ... ok
[     0.177 ms] test line (stderr only)
test log::tests::line_without_file_does_not_panic ... ok
test clock::tests::picks_min_rtt_sample ... ok
test memory::tests::descendants_found_recursively_and_cycle_safe ... ok
test memory::tests::children_summarized ... ok
test memory::tests::proc_stat_parsed_with_awkward_comm ... ok
test memory::tests::old_sample_json_without_webview_still_parses ... ok
test memory::tests::ps_and_powershell_parsed ... ok
test memory::tests::vmrss_parsed ... ok
test memory::tests::reads_own_memory_on_linux ... ok
test protocol::tests::native_event_roundtrip ... ok
test protocol::tests::r2w_result_from_js_json ... ok
test protocol::tests::ui_rects_flattened ... ok
test regions::tests::bad_scale_or_nan_rects ... ok
test regions::tests::clipped_to_window_and_empty_dropped ... ok
test regions::tests::fractional_scale_rounds_outward ... ok
test regions::tests::over_ui_half_open ... ok
test regions::tests::physical_point_normalisation ... ok
test regions::tests::scale_1_is_identity_for_integers ... ok
test report::tests::focus_rule ... ok
test report::tests::fullscreen_rule ... ok
test report::tests::input_split_rule ... ok
test report::tests::ipc_rule ... ok
test clock::tests::one_way_latencies ... ok
test report::tests::memory_rule ... ok
test protocol::tests::timed_input_from_js_json ... ok
test report::tests::memory_webview_line ... ok
test report::tests::render_rule ... ok
test memory::tests::reads_child_memory_on_linux ... ok
test report::tests::set_and_summary ... ok
test stats::tests::nearest_rank_on_1_to_100 ... ok
test stats::tests::nearest_rank_small_sets ... ok
test report::tests::new_report_is_all_nie_zmierzono ... ok
test stats::tests::stats_1000_samples_like_the_spike ... ok
test stats::tests::stats_reject_non_finite_and_empty ... ok
test stats::tests::stats_unsorted_input_and_mean ... ok

test result: ok. 39 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running unittests src/main.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-spike/debug/deps/spike_gpu_embed-a1a46c35cb57cd4d)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests spike_gpu_embed

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```

### J. frontend-v2 — npm ci
```text
$ npm ci

added 13 packages, and audited 14 packages in 915ms

3 packages are looking for funding
  run `npm fund` for details

2 vulnerabilities (1 moderate, 1 high)

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
EXIT=0
```

### J2. frontend-v2 — npx tsc --noEmit
```text
$ npx tsc --noEmit
EXIT=0
```

### J3. frontend-v2 — npm run check
```text
$ npm run check

> civ-frontend-v2@0.0.0 check
> node tools/check-no-logic-imports.mjs --self-test && node tools/check-no-logic-imports.mjs src index.html vite.config.ts && node tools/verify-pin-copies.mjs

self-test: 33 pozytywnych, 15 negatywnych, 1 test numeru linii, błędów: 0
check-no-logic-imports: cele=src,index.html,vite.config.ts plików=43 plików_z_trafieniami=0 trafień=0
verify-pin-copies: pin=edb8fb56 plików=39 niezgodnych=0
EXIT=0
```

### K. hashe 29 plików gra/data vs pin edb8fb56
```text
pin-ls-exit=0
ai-params.json worktree=9965e8c35871b7d5423a750e810ce1e7def91e7a pin=9965e8c35871b7d5423a750e810ce1e7def91e7a MATCH
auto-battle-params.json worktree=38d3eca009d875ee06a33c9ac49fd193ecdf7372 pin=38d3eca009d875ee06a33c9ac49fd193ecdf7372 MATCH
buildings.json worktree=a4bc388f205f96f4f82e80809e44d90b8dd91549 pin=a4bc388f205f96f4f82e80809e44d90b8dd91549 MATCH
citizen-resource-upkeep.json worktree=c54964d824d9c328a4d3e1081a47502ad223b59d pin=c54964d824d9c328a4d3e1081a47502ad223b59d MATCH
city-names-pools.json worktree=7ce011d1e6d34bdff73fd36fa475f52bd2a7fdc7 pin=7ce011d1e6d34bdff73fd36fa475f52bd2a7fdc7 MATCH
civ-ai.json worktree=2e9cff80b39fdd38ce4e95ca4f64c5660e0e5adf pin=2e9cff80b39fdd38ce4e95ca4f64c5660e0e5adf MATCH
civ-matrix.json worktree=fc94205d99bb39339dbc2cd59072b00479f9defc pin=fc94205d99bb39339dbc2cd59072b00479f9defc MATCH
civ-params.json worktree=0ac5838b56e71a77191e4c44b2ff1c9eeedcd493 pin=0ac5838b56e71a77191e4c44b2ff1c9eeedcd493 MATCH
civs.json worktree=86fd13944ef63c6e22d390517d67a36dbf07c0ae pin=86fd13944ef63c6e22d390517d67a36dbf07c0ae MATCH
combat-params.json worktree=ceeddbcda947ec4d00151ca487a62af30c0fe2f2 pin=ceeddbcda947ec4d00151ca487a62af30c0fe2f2 MATCH
counters.json worktree=be87c2195833a7c36d65f1f86b69ec95820fe9c7 pin=be87c2195833a7c36d65f1f86b69ec95820fe9c7 MATCH
diplomacy-acceptance-points.json worktree=19a43485fac5a64661a3b5d3645631c6fd0d588b pin=19a43485fac5a64661a3b5d3645631c6fd0d588b MATCH
diplomacy.json worktree=056c0ef91a5ae3a9a6c49d3027301b716a1540b4 pin=056c0ef91a5ae3a9a6c49d3027301b716a1540b4 MATCH
e-start-params.json worktree=2186f87f102275eb2b72c2f95d6c413018fec6a7 pin=2186f87f102275eb2b72c2f95d6c413018fec6a7 MATCH
econ-params.json worktree=edc05299b9054db080be4694171f948f6c0f9243 pin=edc05299b9054db080be4694171f948f6c0f9243 MATCH
epoka-ludnosc-manpower.json worktree=2911354ee7bff5377cb9080631dcd60c83d66c7e pin=2911354ee7bff5377cb9080631dcd60c83d66c7e MATCH
map-gen-params.json worktree=125e23f8286db47ae325a3d4fec1ce8318f300ff pin=125e23f8286db47ae325a3d4fec1ce8318f300ff MATCH
miasto-params.json worktree=f6fe8e012f8ed167ed3f25b7f7f408a2fc2e3d6f pin=f6fe8e012f8ed167ed3f25b7f7f408a2fc2e3d6f MATCH
power-params.json worktree=b8aab3ec9a2ff3930114eb72542ae2be0c85e2b6 pin=b8aab3ec9a2ff3930114eb72542ae2be0c85e2b6 MATCH
resources.json worktree=7f2f9cd7fb15be8aeac101079c8958b59ba4548c pin=7f2f9cd7fb15be8aeac101079c8958b59ba4548c MATCH
society-params.json worktree=d51e7377e9d310b02f287dcbe8740e815944d003 pin=d51e7377e9d310b02f287dcbe8740e815944d003 MATCH
tech.json worktree=5d97927fd437e318c3bfea6e7c5b435863081a44 pin=5d97927fd437e318c3bfea6e7c5b435863081a44 MATCH
terrain-combat.json worktree=b00b5f63a521a352eb4ba459dd718fdc9da1a1ce pin=b00b5f63a521a352eb4ba459dd718fdc9da1a1ce MATCH
terrain-improvements.json worktree=cd54b28b3d35fa6e7adb8e4be2d2fee913a2055b pin=cd54b28b3d35fa6e7adb8e4be2d2fee913a2055b MATCH
terrain-movement.json worktree=021d28d9a6c1374ae9717a38e39bdd664cda6f7a pin=021d28d9a6c1374ae9717a38e39bdd664cda6f7a MATCH
terrain-yields.json worktree=f366fc21676b6781adbc52ad60079c7729046b98 pin=f366fc21676b6781adbc52ad60079c7729046b98 MATCH
ui-params.json worktree=f2b17280b9d0faf1982ff3e85f618d8452459513 pin=f2b17280b9d0faf1982ff3e85f618d8452459513 MATCH
units.json worktree=7bf7dd06d0e340bfd287a89948dd53ec4b8121fe pin=7bf7dd06d0e340bfd287a89948dd53ec4b8121fe MATCH
wonders.json worktree=fe3023465fd731d0c16029656d5d8984cc157fd4 pin=fe3023465fd731d0c16029656d5d8984cc157fd4 MATCH
MATCH=29 MISMATCH=0
files-in-data-dir: 29
pin-json-count: 29
```

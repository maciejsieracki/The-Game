# P6-REPIN-EKONOMII — jedna wersja reguł ekonomii (R-RUSTPORT-REPIN-EKONOMII-JEDNA-WERSJA-Q1)

Status: runda 1/5, Operator (Haiku 5.5). Część (A) POMIAR — wykonana. Części (B), (C), (D) — NIE rozpoczęte w tej rundzie.
Baza: `origin/rust-port/parity-v2` = `707b50c41bc916c31a75da402dc1d1a1c54ec9a3`.
Pin weba: `origin/main` (`git show origin/main:gra/src/...`), HEAD origin/main w chwili pomiaru: `9733ea8b0`.

## 1. Funkcje dublowane (stare vs nowe) — tabela symboli

Są TRZY rodziny reguł skalowania produkcji surowców w Rust, nie dwie. Dispatch wymieniał dwie
(`*_all_producers` vs stare); trzecia (`domain/resource_production.rs`, typy u32/u8) jest żywa tylko pośrednio.

| # | Plik | Symbol | Typ wejścia (era) | Zbiór skalowany | Wołający w `src/` | Wołający w `tests/` |
|---|------|--------|-------------------|-----------------|-------------------|---------------------|
| R1 | `domain/improvements.rs:955` | `resource_production_amount_for_era` | `f64`, `Option<f64>` | `produkcja_epoka.ulepszenia_skalowane` = `[tartak, kamieniolom]` (MIGAWKA starego weba) | `improvements.rs:1025` (przez `territory_resource_yield_for_improvement`) | `p6_23_improvements.rs:317`, `p6_repin_autoimpr_terrain.rs:226` (jako "legacy") |
| R2 | `domain/improvements.rs:1012` | `territory_resource_yield_for_improvement` | `f64`, `Option<f64>` | j.w. (przez R1) | **`turn_economy_territory.rs:226` (PRODUKCJA)** | `p6_23_improvements.rs:332,469`, `p6_adv_q2a_pipeline.rs:416` |
| A1 | `domain/improvements.rs:981` | `resource_production_amount_for_era_all_producers` | `f64`, `Option<f64>` | `terytorium.ulepszenia` (web `origin/main`: KAŻDY surowiec terytorium, hunki 93-97) | `improvements.rs:1048` | `p6_repin_autoimpr_terrain.rs:218` |
| A2 | `domain/improvements.rs:1035` | `territory_resource_yield_for_improvement_all_producers` | `f64`, `Option<f64>` | j.w. (przez A1) | **brak w `src/`** | `p6_repin_autoimpr_terrain.rs:205` |
| T1 | `domain/resource_production.rs:100` | `resource_production_amount_for_era` | `u32`, `u8` | własna lista (nie porównano w tej rundzie) | `resource_production.rs:137` | `tests/resource_production.rs:111-119` |
| T2 | `domain/resource_production.rs:147` | `territory_resource_yield_for_improvement` | `u8` | j.w. | brak w `src/` | `tests/resource_production.rs:95` |
| T3 | `domain/resource_production.rs:120,142,152,158` | `resolve_resource_production`, `resource_yield_for_improvement`, `resource_production_for`, `stack_resource_production` | `u8` | j.w. | `resource_production.rs:165` (wewn.); `order_effects_lane.rs:52` (import — do sprawdzenia w (B), który symbol) | `tests/parity_suite.rs`, `benches/engine_modules.rs` |

Żywe i NIE do usunięcia w tym temacie: `resource_production::citizen_consumption_era_multiplier`
(`:284`, używane przez `turn_economy_resources.rs:33`, `city_growth.rs:1205`; test `p6_repin_ekon_f_m_era.rs`),
`citizen_upkeep_rate_for_era`, `citizen_required_resources_for_era`, `compute_citizen_resource_drain`.

### Wniosek kluczowy (błąd parytetu, nie tylko dług)

`turn_economy_territory.rs:226` (produkcja tury) woła R2, czyli **stary zbiór** (tylko tartak/kamieniolom).
Web `origin/main` (`gra/src/game/terrain-improvements.ts:281-319`, `resourceProductionAmountForEra` +
`territoryResourceYieldForImprovement`) skaluje **cały** `TERRITORY_YIELD_IMPROVEMENTS` (glinianka, kopalnie,
warzelnia soli, stadnina, kopalnia zlota, ...) ×1,5/epokę (R-WEB-IMPROVEMENT-ERA-SCALING-Q1, 2026-11-03).
Czyli Rust produkcja terytorium dla epok 2-3 ma **zaniżone** wielkości dla wszystkich ulepszeń poza tartakiem
i kamieniołomem. Poprawną funkcją jest A2 (już istnieje, zgodna z webem: normalizacja epoki 1/2/3, `js_round`,
mnożnik `1.5` z `ulepszenia-reguly.json`), ale nikt jej nie woła poza testem.

Zgodność A1 z webem (sprawdzone ręcznie, bez uruchamiania): web `normalizeProductionEra` → 2|3 albo 1;
Rust: `era` całkowite, `> epoka_min` i `<= epoka_max` (=3) albo `epoka_min` (=1) — równoważne dla 1/2/3 i dla
wartości spoza zakresu (4,5 → 1 w obu). Mnożnik: web `Math.pow(1.5, e-1)` z `Math.round`; Rust `powf(1.5, e-1)` z `js_round`
— równoważne. ZAŁOŻENIE do weryfikacji wektorami z weba (część B).

## 2. Różnice względem weba (hunki) — stan pomiaru

- `resourceProductionAmountForEra` (web) vs R1: zbiór (`TERRITORY_YIELD_IMPROVEMENTS` vs `[tartak,kamieniolom]`) — RÓŻNICA ISTOTNA (patrz wyżej).
- `territoryResourceYieldForImprovement` (web) vs R2: web zwraca `null` dla spoza zbioru; R2 zwraca `None` dla klucza spoza `terytorium.ulepszenia` (ta sama semantyka, ale zbiór JSON różni się od zbioru legacy). NIE_ZMIERZONO hunk po hunku (wymaga porównania `terytorium.ulepszenia` z `TERRITORY_YIELD_IMPROVEMENTS`, ~9 kluczy: tartak, kamieniolom, glinianka, kopalnia_miedzi, kopalnia_zelaza, kopalnia_cyny, warzelnia_soli, stadnina, kopalnia_zlota).
- Web `territoryYieldAmountForKey` (fallback 10) vs Rust `territory_yield_amount_for_key` (fallback `terytorium.domyslna_ilosc`): NIE_ZMIERZONO wartości fallbacku w JSON (web komentarz: 10; Rust: sprawdzić `domyslna_ilosc`).
- Rodzina T (`resource_production.rs`, u32): NIE_ZMIERZONO względem weba (web nie ma funkcji o tej sygnaturze; to stara warstwa Rust, do ustalenia w (D)).

## 3. Wektory do regeneracji z uruchomionego weba (część B)

Kandydaci (pliki zależne od R1/R2 wg `git grep`): `tests/p6_23_vectors/`, `tests/p6_adv_q2a_vectors/`, wektory potoków
`p6_adv_*` i `p6_empirefood_e2e` (wg komentarza w `improvements.rs:977-980`, zwłaszcza potok `turn_economy_territory`).
Procedura (do wykonania w (B)): `git archive origin/main gra/src gra/data | tar -x -C <katalog POZA repo>`, Node 22,
generator wektorów uruchomiony na webie. NIE_ZMIERZONO w tej rundzie — brak uruchomienia Node i brak testu bazowego cargo.

## 4. Konflikty z allowlistą (wymagają decyzji orkiestratora lub założenia)

Allowlista dispatchu NIE obejmuje:
- `rust-port/engine/src/domain/improvements.rs` (R1, R2, A1, A2 — tu są duplikaty do usunięcia w (D)),
- `rust-port/engine/src/domain/resource_production.rs` (rodzina T),
- `rust-port/engine/src/domain/order_effects_lane.rs`, `city_growth.rs` (importy/wołający rodziny T / citizen).

Dlatego w (D) usunięcie R1/R2 (lub A1/A2 po przepięciu) wymaga rozszerzenia allowlisty o `improvements.rs`
albo pozostawienia funkcji jako `pub` z adnotacją. ZAŁOŻENIE (Operator): przepięcie wołającego (`turn_economy_territory.rs`,
w allowliście) na A2 jest w zakresie; usuwanie definicji w `improvements.rs` — dopiero po zgodzie na rozszerzenie allowlisty.

## 5. Część (C) — epoka w `economy_yield.rs` (stan pomiaru)

`economy_yield.rs` NIE zawiera żadnego pojęcia epoki (grep `epoka|era|mnoznik` bez trafień poza komentarzami).
Web: mnożnik zużycia obywateli `m(e) = 1 + 0,5·(floor(e)−1)` jest już zaportowany jako
`resource_production::citizen_consumption_era_multiplier` (`p6_repin_ekon_f_m_era.rs`, pin web `16c0509f6`).
Cegielnia/odlewnie/magazyn wg LEDGER EKONOMIA-F: do zweryfikowania w (C) (web `converters.ts`: Cegielnia 50/t +50% bazy/epokę
właściciela; Odlewnie 50/t). Pliki Rust `converters*.rs` mieszczą się w allowliście (wzorzec `converters*.rs`).

## 6. Baseline bramek

NIE_ZMIERZONO. Nie uruchomiono `cargo fmt/clippy/test` na starcie (dysk: 4,4 GB wolnego przy starcie, próg 1,5 GB —
nie przekroczony, ale bez baseline'u testów). Liczba `#[ignore]` w bazie: NIE_ZMIERZONO.

## 7. Plan kolejnych partii (proponowany, ≤600 LOC każda)

1. (B1) Przepiąć `turn_economy_territory.rs:226` z R2 na A2 (1 linia + import). Skutek: zmiana produkcji epok 2-3 dla
   ulepszeń spoza tartaku/kamieniołomu — ZMIANA ZACHOWANIA, więc wymaga regeneracji wektorów z weba (krok B2) w tej samej partii albo osobnej z flagą.
2. (B2) Regeneracja wektorów z weba (sekcja 3), aktualizacja testów `p6_23_*`, `p6_adv_q2a_*`, `p6_repin_autoimpr_terrain.rs` (nowe testy `p6_repin_ekonomii_*`).
3. (C) Sprawdzenie epoki w `converters*.rs` / `economy_yield.rs` względem LEDGER EKONOMIA-F; ewentualna poprawka 1:1.
4. (D) Usunięcie martwych duplikatów — po rozszerzeniu allowlisty o `improvements.rs` i `resource_production.rs` (decyzja orkiestratora). 0 nowych `#[ignore]`.

Zmiany zachowania (B1) traktować jako odstępstwo od „1:1 z webem" tylko jeśli web jest inny — tu web jest źródłem prawdy (A2 = web), więc B1 jest korektą do weba, a nie odstępstwem.

## 8. Runda 4 (Operator r4, baza 0b37cf183, kod = 9612c0b8e) — pomiary i odpowiedzi na zarzuty FC r3

### 8.1 Web origin/main 247f1ef2a — wartości wykonane (nie z czytania kodu)
Źródło: `runs/R-RUSTPORT-REPIN-EKONOMII-JEDNA-WERSJA-Q1/tools/probe-web-yield-r4.mjs` (esbuild z `gra/src/game/terrain-improvements.ts`), log `logs/probe-web-yield-r4.log`.
`territoryResourceYieldForImprovement` dla era = 1 / 2 / 3 (era 4 i brak = epoka 1):
- tartak, kamieniołom, glinianka, warzelnia_soli (base 50): 50 / 75 / 113.
- kopalnia_miedzi, _zelaza, _cyny (base 20): 20 / 30 / 45.
- stadnina (base 25): 25 / 38 / 56. kopalnia_zlota (base 1): 1 / 2 / 2.
- farma: null. `TERRITORY_YIELD_DEFAULT_AMOUNT` = 10.
- `glinianka` era 2 = **75** (B1 w Rust daje 75 — zgodne). Stary wektor pinowany (pin 331ef699b) ma 50.

Rust `resource_production_amount_for_era_all_producers` (improvements.rs:981) to ta sama formuła: `js_round(base × mnoznik^(era−epoka_min))`, mnożnik 1,5, epoka_min 1, epoka_max 3 (`data/derived/ulepszenia-reguly.json`), zbiór = `terytorium.ulepszenia` (9 kluczy). Wartości z tabeli wyliczone formułą, NIE uruchomione w Rust.

### 8.2 Regeneracja wektorów (B2) — wynik: NIE domknięte, przyczyny zmierzone
| Próba | Pin web | Zmiana generatora | Wynik testu `p6_empirefood_e2e` (B1) |
|---|---|---|---|
| a | 247f1ef2a (origin/main) | 1 linia: `computeSeaTradeBonusIncomeByCity(..., builtByCity)` (trade-routes.ts:1757) | 264/347 scenariuszy różni się od starego pliku; FAIL `ef-1 city23 pieniadz rust=18.0 web=17.0` |
| b | 8769854ff (R-WEB-IMPROVEMENT-ERA-SCALING-Q1) | jak a, pin zmieniony | 320/347 różni się; FAIL `ef-0 popCap city3 rust=21.0 web=13.0`; **ta sama czerwień przy pre-B1 (707b50c41 turn_economy_territory.rs)** → NIE wina B1 |
| c | 331ef699b (pin pliku) + JEDNA zmiana web: ERA_SCALED = 9 kluczy (hybryda) | patch w generatorze | FAIL `ef-1 city16 popCap rust=14.0 web=10.0` |
| d (kontrola) | 331ef699b bez zmian | brak | generator NIE odtwarza pinowanego pliku: 113/347 scenariuszy różni się (głównie `food.popCap`) |

Wnioski (dowody z tabeli):
1. Czerwień empirefood po B1 względem STAREGO pliku jest realna, ale źródło to dług wektorów; po podmianie na web-wykonany origin/main wyskakuje rozbieżność pieniądza i popCap, których Rust nie ma. Te obszary (handel morski wymagający Portu 31acc1fff, popCap 339ae6f45/df197a377) NIE są w temacie i NIE są w allowliście.
2. Generator w obecnej postaci nie jest powtarzalny na swoim pinie (próba d). Zanim wektory zostaną przyjęte, pipeline wymaga naprawy (dług D-R4-3).
3. Nie przyjęto żadnego nowego pliku wektorów do repo. `rust-port/engine/tests/p6_empirefood_vectors/empirefood.json` przywrócony do 0b37cf183 (git diff pusty).

### 8.3 Pin i „1:1 z origin/main" — ZAŁOŻENIA (zamiast pytania)
- Z-R4-1: reguła surowców terytorium (9 kluczy, ×1,5/epokę, round) = 1:1 z origin/main, dowód 8.1 (wykonany web). Zakres 1:1 CAŁEGO weba: NIE w tym temacie.
- Z-R4-2: rozbieżności popCap, pieniądza (handel morski), żywności między Rust a origin/main to dług poza tematem: D-R4-1 (lista: 38 commitów web dotykających trade-routes/turn-economy/terrain-improvements/wonders/economy od 331ef699b; w tym 31acc1fff, b1639645b, 339ae6f45, df197a377, 525dca82e, 9629cf9fe, 43c524b55). Do założenia jako osobne tematy po tym temacie.
- Z-R4-3: generator `gen-p6-empirefood` wymaga naprawy powtarzalności (D-R4-3) przed kolejną regeneracją.

### 8.4 Epoka w `economy_yield.rs` (C) — stan pomiaru, NIE wykonane w r4
- Web: `economy.ts:468` `applyImprovementBonuses(out, impKeys, tile.wlascicielEra)`; pole ustawiane w `turn-economy.ts:602` i `okolica.ts:476` (`wlascicielEra: ownerEra`).
- Rust: `economy_yield.rs:867` `apply_improvement_bonuses(&mut out, &keys)` — bez epoki (era = None = epoka 1). `apply_improvement_bonuses_era` (improvements.rs:912) już istnieje.
- Zakres zmiany: pole `wlasciciel_era: Option<f64>` w `WorkedTileImpInput` (economy_yield.rs:~790) + 17 literałów w 5 plikach (turn_economy_loop.rs:586 — `owner_era_for(input, owner_id)` dostępne; turn_economy_territory.rs:149; economy_city_vectors_r3/r4.rs; p6_repin_d2_imp.rs).
- Powód odłożenia: zmienia wynik produkcyjny dla epok 2–3 (plony ulepszeń i surowce), więc unieważnia obecne wektory p6_* (to samo co B2). Robione razem z B2 w r5, nie osobno.

### 8.5 Duplikaty (D) — mapa wywołań i blokada allowlisty
Trzy rodziny (git grep, baza 0b37cf183):
- R1 `resource_production.rs` (u32): `resource_production_amount_for_era`, `territory_resource_yield_for_improvement`, `resolve_resource_production`. Stałe bazy (tartak 200, glina 50, rudy 20…), skalowanie tylko tartak/kamieniołom (3/2, 9/4). Wołający: `tests/resource_production.rs` (17 wystąpień), wewnętrznie `resource_production.rs` (11).
- R2 `improvements.rs` `resource_production_amount_for_era` + `territory_resource_yield_for_improvement` (migawka: skalowanie wg `ulepszenia_skalowane` = tartak/kamieniołom). Wołający: `tests/p6_23_improvements.rs` (5), `tests/p6_repin_autoimpr_terrain.rs` (5), `tests/p6_adv_q2a_pipeline.rs` (2), `tests/parity_suite.rs` (2), `benches/engine_modules.rs` (2). W src: brak poza samym modułem.
- R3 `improvements.rs` `*_all_producers` (9 kluczy): jedyny wołający w src to `turn_economy_territory.rs:226` (produkcja po B1).
- Blokada: `tests/resource_production.rs`, `tests/parity_suite.rs`, `benches/engine_modules.rs` są POZA allowlistą (dozwolone tylko `p6_*`). Usunięcie R1/R2 wymaga ich edycji → decyzja orkiestratora o rozszerzeniu allowlisty (propozycja: dopisać te 3 pliki do r5). Bez tego D nie jest wykonalne.

### 8.6 Bramki (świeże, 0b37cf183, kod niezmieniony)
- `cargo fmt --check`: exit 0.
- `cargo clippy --all-targets -- -D warnings`: exit 0 (log `logs/clippy-r4.log`).
- Pięć binarek B1 (uruchomione ponownie): `p6_adv_q2a_pipeline` 2 FAIL (`advance_with_map_matches_running_web`, `direct_calls_with_fort_and_outpost_nodes_match_web`), `p6_adv_q4_pipeline` 1 FAIL (`city_loop_matches_running_web`), `p6_adv_q4_preview` 1 FAIL (`preview_pipeline_matches_running_web`), `p6_adv_q6_wire` 1 FAIL (`game_economy_wiring_matches_running_web`), `p6_empirefood_e2e` 1 FAIL (`ef-3 city01 surowce po.glina: rust=75.0 web=50.0`). Razem 6 FAIL — zgodnie z r3.
- Pełny `cargo test` per binarka (300): NIE_ZMIERZONO w r4 (czas + dysk 2,8 GB). `p6_8i_pick` (>400 s): NIE_ZMIERZONO, nie zdiagnozowane.
- Baseline pre-B1 (707b50c41) dla całej sumy: NIE_ZMIERZONO. Atrybucja r3 (5 binarek przechodzi pre-B1 ze STARYMI wektorami) — cytowana z r3, nie powtórzona.

### 8.7 Stan na koniec r4
- Kod Rust: bez zmian względem 9612c0b8e (B1). Wektory: bez zmian.
- Dokumentacja i narzędzia: ten rozdział, `runs/.../tools/`, `runs/.../logs/`.
- Następna runda (5/5, OSTATNIA): (a) decyzja orkiestratora: allowlista + 3 pliki wołające R1/R2; (b) naprawa powtarzalności generatora (D-R4-3); (c) B2 razem z C (`wlasciciel_era`) w jednym temacie; (d) D dopiero po zielonych bramkach. Jeśli r5 nie zamknie B2, temat kończy się LIMIT-5-EXCEEDED z listą D-R4-1..3 jako długi do osobnych tematów.

## 9. Runda 5 (Operator r5, Sonnet 5.5; baza b84d952d4) — B2 + C + D domkniete

### 9.1 Przyczyna "niepowtarzalnego generatora" (r4) i pin wektorow
Pin `331ef699b` w wektorach to SYNTETYCZNY commit "hybrid origin/main minus out-of-scope files" (tworzony przez
`R-RUSTPORT-REPIN-EKONOMIA-F-FALA500-Q1/mk-hybrid-web-ref.sh`: origin/main z `terrain-improvements.ts`, `trade-routes.ts`,
`buildings.json` cofnietymi do 4bbef081d), a regeneracja szla przez `regen-vectors-ekonf.sh` z DWOMA lataniami generatora
(`computeSeaTradeBonusIncomeByCity` bez 2. argumentu przy cofnietym trade-routes; 5. argument `builtIds.includes('spichlerz_ii')`
w `resolvePopulationCapMatrixDelta`). Generatory r4 nie mialy drugiego latania, stad "popCap ef-0 city3 rust=21 web=13".
Dowod: kontrola `PINREF=331ef699b regen.sh q2a` odtwarza `q2a.json` BAJT-W-BAJT (cmp IDENTICAL).

### 9.2 B2 — regeneracja z uruchomionego weba (ZALOZENIE Z-R5-1)
`hybrid2` = `331ef699b` + JEDEN plik `gra/src/game/terrain-improvements.ts` z origin/main 247f1ef2a (commit lokalny `f873221ee`,
drzewo `1ec5ddd3b60807e9b8f43d2100d4265aaeb22759`; odtworzenie: `tools/mk-hybrid2-r5.sh`; hash commita zalezy od czasu, drzewo nie).
Czyli JEDYNA zmiana wzgledem poprzednio przyjetych wektorow to regula ulepszen z origin/main (skalowanie surowcow 9 kluczy x1,5/epoke +
plony Zyw/Pra/Han/Pieniadz +1/epoke przez `wlascicielEra`). `trade-routes.ts`/`buildings.json` zostaja na 4bbef081d (dlug D-R4-1: handel morski
wymagajacy Portu, popCap — osobne tematy; pieniadz ef-1 city23 18 vs 17 z r4 jest TYM dlugiem, nie tematem repinu ekonomii).
Regenerowane (`tools/regen-vectors-hybrid2-r5.sh`): q2a, q4, q4b (+q4c), q5, q6, empirefood. Unit tables q5 bez zmian.
`p6_23_vectors/improvements.json`: przeliczone z weba WYLACZNIE pola `out` dwoch sekcji (`resourceProductionAmountForEra` 72/1320,
`territoryResourceYieldForImprovement` 28/1372 zmienionych) — `tools/regen-p623-era-sections-r5.mjs`.

### 9.3 C — epoka wlasciciela (1:1 z `economy.ts:468` / `turn-economy.ts:589-707`)
`WorkedTileImpInput::wlasciciel_era: Option<f64>`; `tile_yield_full` -> `apply_improvement_bonuses_era`. Przekazanie epoki:
`turn_economy_loop` (`owner_era_for`), `compute_worked_magazyn_yields_by_city(.., resolve_owner_era: Option<&dyn Fn(i64)->f64>)`
(ranking pol `resolve_worked_tiles` + plony; preview i advance podaja resolver, klasa `direct` testu q2a = None jak `computeWorkedMagazynYieldsByCity(cities,map,nodes)` w generatorze),
`hex_tile_yield(.., owner_era)`. Test: `tests/p6_repin_ekonomii_era.rs` — 1760 kafelkow z weba (teren x nakladka x rzeka x 11 zestawow
ulepszen x 8 epok, bit-w-bit) + N-1/N/N+1 (epoka 1/2/3; 0, 1.5, 2.5, 4, -1, NaN = baza).

### 9.4 D — jedna wersja
`improvements.rs`: usunieta migawka R2 (`resource_production_amount_for_era`/`territory_resource_yield_for_improvement` skalujace tylko tartak/kamieniolom);
dawne `*_all_producers` nosza teraz kanoniczne nazwy (sufiks usuniety). Wolajacy: `turn_economy_territory.rs`, testy `p6_repin_autoimpr_terrain.rs`
(porownanie z "legacy" usuniete), `p6_23_improvements.rs` i `p6_adv_q2a_pipeline.rs` (te same nazwy, nowa semantyka + wektory z weba).
DLUG D-R5-1 (nie usunieto): rodzina `resource_production.rs` (u32/u8, `resolve_resource_production`, `stack_resource_production`) to stara migawka
poza produkcja tury; zywi ja tylko `tests/resource_production.rs`, `tests/parity_suite.rs`, `benches/engine_modules.rs` (poza allowlista, asercje np. glina 50 w epoce 3).
Oznaczone w naglowku modulu. Zywe w tym module: `citizen_*`, `compute_citizen_resource_drain`.

### 9.5 Bramki (świeże, kod = ostatni commit r5)
fmt --check OK; clippy --all-targets -D warnings OK; lib 22 passed; doc 0; cargo test per binarka: 298 binarek (po 30 w shardach) 2226 passed, 0 failed,
1 ignored (istniejacy `p6_order_lane.rs:1530`, nie nowy); `p6_8i_pick` osobno: 5 passed w 366 s (dev). Baseline pre-B1 pelnej sumy: NIE_ZMIERZONO
(wynik r3: 5 binarek zielonych pre-B1 ze starymi wektorami). 0 nowych `#[ignore]`.

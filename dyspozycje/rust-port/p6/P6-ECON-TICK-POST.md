# P6-ECON-TICK-POST: etapy kroku ekonomii tury PO bankowaniu (web `4bbef081d` -> Rust)

Temat: `R-RUSTPORT-P6-ECON-TICK-POST-Q1`. Baza: `rust-port/parity-v2` `c8782b58d`. Dług źródłowy: `-Q7` pkt 5 z `P6-ADVANCE-CITY-ECONOMY-Q6.md` sek. 8.
Pin weba: `gra/src/main.ts` @ `4bbef081d` (numery linii poniżej = ten plik). Moduł Rust: `domain/turn_economy_post.rs` (NOWY).

## 1. Wynik (skrót)

* Zaportowane 1:1 z wektorami z URUCHOMIONEGO weba (347 scenariuszy, porównanie bitowe): deficyt Złota (`:35250-35354`), wzrost po centrali
  z `growthMultMap` i `manpowerMaxMultByOwnerId` (`:36009-36092`; zamyka dług ORDER-LANE `-Q2`, `:36071`), upkeep Pracy (`:36093-36118`).
* WYKRYTY DRYF: port `apply_post_central_population_growth` (P6.7A, pin `edb8fb56`) nie znał `orderGrowthMultByCity` (`population-growth-v85.ts:288-295`,
  `:537-543`) ani `manpowerMaxMultByOwnerId` z fallbackiem na macierz (`:588-590`, `manpower.ts:447-462`). Dodane addytywnie
  (`apply_post_central_population_growth_ext`); stara funkcja deleguje z `Default` = zachowanie bez zmian (`p6_7a_post_central` zielony).
* KOREKTA DISPATCHU: `buildPowerSnapshotsForTurn` + `refreshObjectivePowerCache` wykonują się PRZED bankowaniem (`:34577-34578`, zaraz po `advanceCityEconomy`),
  nie po. Research gracza i AI jest w bloku bankowania (`:35151`, `:35166`), nie osobnym etapem po nim.
* `settle_turn`/`resolve_turn`: brak odpowiednika w webie, KONFLIKT semantyki (sek. 4). Rozstrzygnięcie: nie podpinać.

## 2. ETAP 1: inwentarz kroków po `advanceCityEconomy` do końca kroku ekonomii (`:34577` .. `:36418`)

Legenda: ZAP = zaportowane tu; IST = istniało na `c8782b58d`; DŁUG = nie zaportowane (powód w sek. 5); UI = efekt wyłącznie interfejsu/log (poza silnikiem).

| # | Web (plik:linia) | Krok | Rust | Status |
|---|---|---|---|---|
| 1 | `main.ts:34577` | `powerSnapshotsForTurn = buildPowerSnapshotsForTurn(econ)` (PRZED bankowaniem) | `git grep -i "power_snapshot\|objective_power\|pobor_totals"` = 0 | DŁUG `-POWER` |
| 2 | `:34578` | `refreshObjectivePowerCache()` | brak (jw.) | DŁUG `-POWER` |
| 3 | `:34579-34585` | `lastCityKulturaTick`, `aiWonderPracaTickByCity` (mapy z ticków; cache HUD/AI) | pola w `CityLoopTick` (`kultura`, `do_budynkow`) | IST (dane), cache UI |
| 4 | `:34581-34585` | `finalizeMennicaZlotoGraceAfterTick` | `turn_economy_wire.rs` | IST |
| 5 | `:34594-34850` | blok EmpireFood / auto-racje / atrycja | `turn_economy_empirefood.rs` | IST (`-EMPIREFOOD-Q1`) |
| 6 | `:34986-35004` | N3 atrycja garnizonu miast oblężonych | `siege_turn_garrison_attrition` | IST |
| 7 | `:35029` | `resolveSiegeSurrender(oblCity.id)` (zmiana `ownerId` miasta, `:15874`) | brak | DŁUG `-Q8` |
| 8 | `:35057-35064` | bankowanie czł.: `skarbiec += pieniadz`, `nauka += nauka` | `OwnerBank::apply_treasury/apply_science` | IST |
| 9 | `:35067-35079` | odjęcie utrzymania od skarbca (deficyt flagowany, skarbiec NIE podłogowany) | `OwnerBank.upkeep_applied` | IST |
| 10 | `:35081-35099` | odjęcie utrzymania surowcowego od zapasów miast | `deduct_building_stock_cost_across_cities` w `turn_economy_wire.rs` | IST |
| 11 | `:35103-35104`, `:35106-35112` | `buildingResourceUpkeepByOwner`, `_lastBogactwo*` (cache HUD) | `resource_upkeep_*_by_owner` w `EconomyTickResult` | IST (dane), HUD = UI |
| 12 | `:35115-35139` | bankowanie AI: skarbiec, utrzymanie, zapasy | `bank_one(.., false, ..)` | IST |
| 13 | `:35140-35146` | pula Nauki AI `+ nauka + difficultyScienceBonusForOwner(oid)` (`:8495`) | `OwnerBank::apply_science(.., ai_bonus)`; sama `difficultyScienceBonusForOwner` brak | IST (arytmetyka) / DŁUG `-AIDIFF` (funkcja bonusu) |
| 14 | `:35150-35156` + `:31493` | `runAiResearchForOwner` (`chooseAIResearch`, `researchStep`, `syncOwnerEraFromResearch`) | `research_step` IST (`player.rs:583`); `choose_ai_research`/sync epoki = 0 trafień | DŁUG `-AIRESEARCH` |
| 15 | `:35166` | `researchStep(player, ...)` badania gracza po bankowaniu | `PlayerRules::research_step` (`player.rs:583`, wektory `p6_1b`) | IST |
| 16 | `:35169-35240` | `reconcilePlayerEraFromResearch`, toasty, karty `tech-done-*`, `setEra`, `showTechTreeView` | brak (epoka gracza z badań) | DŁUG `-ERASYNC`; reszta UI |
| 17 | `:35250-35354` | deficyt Złota: `advanceGoldDeficit`, `applyGoldDeficitHpLoss`, sprzątanie, komunikaty | `run_gold_deficit_step` | **ZAP** |
| 18 | `:35358-35789` | pętla Porządku (kultura, religia, presja, szczęście, drenaż obywateli, bunt) -> `orderMultMap`, `growthMultMap` | `order_effects_lane.rs::compute_order_lane` | IST (`-ORDER-LANE-Q1`) |
| 19 | `:35764-35787` | `cityOrderState.set` (`szczescie = round(sz.netto*10)/10`, `citizenUpkeep`) | `OrderLaneCityReport` bez tych pól | **ZAP** (pola dodane, Z-POST-4; NIE_ZMIERZONO vs web) |
| 20 | `:35791-35873` | AUTO-MANAGE (decyzje auto-zarządcy) | `git grep auto_manage` = tylko komentarze | DŁUG `-AUTOMANAGE` |
| 21 | `:35874-36008` | PRODUKCJA (kolejka budynków, nadwyżka, rekrutacja) | składniki: `production_queue.rs`, `production_units.rs`, `recruitment.rs`; pętla wiążąca brak | DŁUG `-PRODUCTION-LANE` |
| 22 | `:36013-36058` | wejścia wzrostu: `happinessByCityId`, `citizenGrowthPctByCityId`, `spichlerzByCity`, `excludeHexKeysByCity`, `manpowerMaxMultByOwnerId` | `growth_inputs_from_order_lane`, `PostGrowthInput`, `okolica/sasiedztwo.rs:13 compute_lost_to_nearer_sibling_by_city` IST | **ZAP** |
| 23 | `:36060-36081` | `applyPostCentralPopulationGrowth(... orderGrowthMultByCity: growthMultMap ...)` | `run_post_central_growth` + `apply_post_central_population_growth_ext` | **ZAP** |
| 24 | `:36082-36091` | `applyLiveSafeRationForCity` po wzroście (zbiorcze) | `PostGrowthOutcome::changed_city_ids` (wejście); funkcja `:19683` brak | DŁUG `-LIVERATION` |
| 25 | `:36097-36118` | upkeep Pracy ulepszeń (`playerPracaPool`, `aiPracaPoolByOwner`, `_lastPraca*`) | `apply_praca_upkeep_post` | **ZAP** |
| 26 | `:36120-36142` | CUDA-MAPA `advanceOwnerWonderMapBuilds` (`:4623`) | brak | DŁUG `-WONDERMAP` |
| 27 | `:36177-36398` | auto-ulepszenia terenu (koperta AI, picker) | `domain/auto_improvements*` (poza allowlistą; równoległy `REPIN-DELTA-4`) | DŁUG (poza zakresem) |
| 28 | `:36418`, `:36437-36440` | `catch (errMiasto)`, wsad renderu miast AI | -- | UI |

Podsumowanie: 28 pozycji = ZAP 5 (17, 19, 22, 23, 25), IST 12, UI/cache 3 (11, 16 częściowo, 28), DŁUG 9 (1-2 razem, 7, 13 funkcja, 14, 16, 20, 21, 24, 26, 27).
Wszystkie pozycje DŁUG mają dowód plik:linia (kolumny Web/Rust) i nazwę tematu w sek. 5.

## 3. Zaportowane: kontrakt i kolejność

* `run_gold_deficit_step(cities, states, runtime, units, siege_cities, besieger_by_city, input)`: `gdOwnerIds = [0, AI wg kolejności miast, klucze stanów]` bez `-1`
  (stany tworzone dla nie-barbarzyńców), `ownerTreasury` czytane PO bankowaniu, atrycja HP tylko dla właścicieli z `turyPo >= karencja`, sprzątanie oblężeń i
  garnizonów tym samym kodem co głód wojska (`cleanup_after_starvation_destroy`, web `:35311-35340` jest identyczną kopią `:34796-34830`).
* `run_post_central_growth(...)`: buduje `spichlerzByCity` z ticku, wołanie `apply_post_central_population_growth_ext` z `order_growth_mult_by_city = growthMultMap`,
  `manpower_max_mult_by_owner_id`, fallbackiem macierzowym (`pin_matrix`) i zapisem wyników do ticku pętli (`ludnosc_po`, `wzrost`, `ubytek`, `wzrost_procent`,
  `wzrost_ulamkowy_po`, `magazyn_po_turze`, `growth`, `starved`), miast, `hungerLossUlamkowy` i `extras[..].manpower`.
* `apply_praca_upkeep_post`: pula gracza tylko dla `oid == 0` (`Math.max(0, pula - upkeep)` gdy `upkeep > 0`); KAŻDY inny owner (także drugi fotel człowieka) idzie do
  `aiPracaPoolByOwner` (`:36108-36113`, odtworzone dosłownie, patrz Z-POST-5); `_lastPracaRate -= upkeep` także gdy `upkeep <= 0`.

## 4. ROZSTRZYGNIĘCIE `settle_turn` / `resolve_turn` (`turn_economy.rs`)

Dowód braku odpowiednika: `git grep -n -i "settleTurn\|resolveTurn\|settle_turn\|resolve_turn" 4bbef081d -- gra/src gra/tools` = 0 trafień. Wywołujący w Rust: tylko
`tests/turn_economy.rs`, `tests/parity_suite.rs:258`, re-eksport `lib.rs:46` (brak w `domain/turn_economy_*`). Funkcja web robiąca analogiczną robotę pod inną nazwą:
`advanceCityEconomy` + bankowanie `main.ts:35057-35246` + upkeep Pracy `:36097`. Konflikt semantyczny z tym kodem:

1. skarbiec: Rust `spend_flow` obcina do 0 (`turn_economy.rs:250-264` `settle_turn`, `:319` `spend_flow`, `:379` `debit`, `unpaid`), web NIE podłogowuje (`main.ts:35046-35056`, `:35137-35139`) a deficyt Złota czyta `skarbiec < 0`
   (`gold-deficit.ts:114-115`);
2. Praca: Rust `reset_turn_pools` zeruje Pracę co turę (`turn_economy.rs:12-16`, `:286`), web akumuluje (`playerPracaPool` ze zmniejszeniem tylko o upkeep/cuda; komentarz
   `main.ts:36172-36176`: "Niewykorzystana reszta ZOSTAJE w puli i narasta");
3. typ: `u64` per zasób (brak ułamków i wartości ujemnych), web `f64`.

Wniosek: `settle_turn` NIE jest portem żadnej funkcji weba i jego podpięcie złamałoby parytet. PROPOZYCJA (do decyzji właściciela, nie wykonana): pozostaje osobnym modułem
(bez wywołującego w pętli), a jego usunięcie/przemianowanie na legacy to osobny temat za zgodą właściciela (dotyka `lib.rs:46` i 2 testów). Wiązanie `-Q6` zostaje przy `OwnerBank`.

## 5. Dług po tym temacie (z dowodem)

| Temat | Co | Dowód |
|---|---|---|
| `-POWER` | `buildPowerSnapshotsForTurn` (`main.ts:5465`), `refreshObjectivePowerCache` (`:2636`), moduły `power*.ts` | `git ls-tree 4bbef081d gra/src` -> `power.ts`, `power-objective.ts`, `power-ranking.ts`; w Rust 0 trafień |
| `-AIRESEARCH` | `runAiResearchForOwner` (`:31493`), `chooseAIResearch`, `syncOwnerEraFromResearch` | `git grep choose_ai_research` = 0 |
| `-ERASYNC` | `reconcilePlayerEraFromResearch` (`:11141`, `:35169`) | 0 trafień w Rust |
| `-AIDIFF` | `difficultyScienceBonusForOwner` (`:8495`) | 0 trafień (bonus jest wejściem `OwnerBank::apply_science`) |
| `-AUTOMANAGE` | `:35791-35873` | 0 trafień |
| `-PRODUCTION-LANE` | `:35874-36008` | brak pętli wiążącej (składniki istnieją) |
| `-LIVERATION` | `applyLiveSafeRationForCity` (`:19683`) | 0 trafień |
| `-WONDERMAP` | `advanceOwnerWonderMapBuilds` (`:4623`, `:36121`) | 0 trafień |
| `-Q8` | `resolveSiegeSurrender` (`:15874`, wołane `:35029`): zmiana `ownerId` miasta | brak |
| `-ORDER-LANE-Q2` | wektory web dla `OrderLaneCityReport.szczescie` / `citizen_growth_pct_delta` (pola dodane tu, bez wektorów w `order_lane.json`) | `grep szczescie tests/p6_order_lane_vectors/order_lane.json` = 0 |
| (poza zakresem) | auto-ulepszenia `:36177-36398`; podpięcie `run_post_*` do `ai_turn`/pętli tury (brak wołającego, jak `run_economy_tick_for_game`) | allowlista |

## 6. Dowody i testy

* Generator `runs/R-RUSTPORT-P6-ECON-TICK-POST-Q1/gen-p6-econ-post-vectors.mjs`: czyste `git archive 4bbef081d`, esbuild w `/dev/shm` (zero buildu w `gra/`),
  PRAWDZIWE `advanceCityEconomy`, `advanceEmpireFood`, auto-racje, `advanceGoldDeficit`, `applyGoldDeficitHpLoss`, `buildGoldDeficitParams`,
  `applyPostCentralPopulationGrowth`, `civManpowerMatrixMults`; sklejka `main.ts` (`:35255-35354`, `:36010-36081`, `:36097-36116`) przepisana. Te same
  scenariusze/seed co `EMPIREFOOD-Q1` (347), stan graniczny = stan PO bloku EmpireFood i bankowaniu. Fixture: `tests/p6_econ_post_vectors/post_0.json` (4,5 MB < 6 MB).
* Test `tests/p6_econ_post_e2e.rs`: porównanie BITOWE wszystkich pól wyjścia (ticki deficytu, stany, jednostki, oblężenia, besieger, `ended`, `garnSynced`, populacja,
  `wzrostUlamkowy`, `turyBezDoplaty`, `hungerLossUlamkowy`, MP, pola ticku, `growth`/`starved`, wiersze EmpireFood z `breakdown`, kolejność i argumenty `rebalance`,
  pule Pracy, `_lastPracaRate`); progi pokrycia w teście. `tests/p6_econ_post_unit.rs`: 5 testów (3 czyste funkcje + OBRONA R1: zapis `hp`/`hpMax` przy `None`, kolejność właścicieli Z-POST-3).
* Niezależny weryfikator `verify-p6-econ-post.py` (`python3 -I`, bez Rust/weba): 25 097 sprawdzeń, 0 rozbieżności; kontrola negatywna `--neg` wykrywa manipulację (`verify-output.txt`).
* Mutacje `mutate-econ-post.py` (`mutacje-wynik.txt`): 57 mutantów; po OBRONIE R1 51 zabitych (P11 zabity testem `gold_deficit_step_writes_back_hp_and_hp_max_when_unset`, sprawdzone ręcznie: `left: (Some(30.0), None)`), 6 przeżyło, wszystkie 6 równoważne z dowodem; brutto 51/57 = 89,5% (nadal poniżej 90%, równoważniki wg kryterium dispatchu), bez równoważnych 51/51.
  * P02 (barbarzyńca w liście AI): odfiltrowany później `.filter(o != -1)` (zabijany przez P06) i pomijany przez `states.entry` (P05).
  * P05: `-1` trafia do `gd_owner_ids` tylko przez `states.keys()` (stan już istnieje, `or_insert_with` bez efektu) albo listę AI (wykluczona).
  * P11 (ZABITY w OBRONIE R1, już nie ekwiwalent): wcześniejszy dowód przez `syncAllRuntimeUnitHpState` (`main.ts:29894-29906`) był tylko warunkowy; `AttritionUnit.hp_max` to `Option<f64>`, a web (`gold-deficit.ts:239-240`) ustawia `u.hpMax`/`u.hp` gdy brak. Pokryte testem z `hp`/`hp_max` = `None`.
  * P14: `GoldDeficitRuntime::advance` sam robi `or_insert_with(fresh)` (`turn_economy.rs:553`), wstępne zasianie jest redundantne.
  * P20, P21: wzrost czyta tylko `maSpichlerzPop`/`maSpichlerzIIPop` (`building-resource-gate.ts:477-481`), nie `ceramikaActive`/`solActive`.
  * G04: gałąź `adjusted === total` zwraca strukturę o identycznych wartościach jak `{...base, total: adjusted}`.

## 7. Zmiany w istniejących plikach (jawne pozycje z diffem)

* `domain/city_growth.rs` (allowlista: addytywnie): `apply_post_central_population_growth` deleguje do nowej `apply_post_central_population_growth_ext(.., &PostCentralGrowthExt::default(), ..)`;
  nowe: `PostCentralGrowthExt`, `growth_percent_with_order_multiplier`; `compute_growth_percent_v85` -> `base_breakdown` + mnożnik; `max_mult` z mapy/macierzy gdy `Ext` podany. Zachowanie bez `Ext` bez zmian.
* `domain/turn_economy_loop.rs`, `domain/turn_economy_tick.rs`: tylko `#[derive(Default)]` na `CityLoopTick` / `EconomyTickResult` (fixture testowe).
* `domain/mod.rs`: `pub mod turn_economy_post;` (+1 linia).
* `domain/order_effects_lane.rs` (POZA allowlistą, Z-POST-4): `OrderLaneCityReport` + pola `szczescie`, `citizen_growth_pct_delta` (tylko zapis odczytowy, brak zmiany obliczeń; struktura nie jest konstruowana poza modułem).

## 8. Założenia (do akceptacji właściciela)

* Z-POST-1: wektory startują ze stanu granicznego po `advanceCityEconomy` + EmpireFood + bankowaniu (łańcuch do tego miejsca jest porównany bitowo w `p6_empirefood_e2e.rs`); nie powtarzamy go w jednym teście.
* Z-POST-2: między deficytem Złota a wzrostem web wykonuje pętlę per miasto (kultura/porządek/produkcja, `:35358-36008`), która zmienia stan miast; wzrost testowany na wejściu losowanym
  (`happiness`, `citizen`, `growthMult`, `manpowerMax`), nie na wyjściu tej pętli (dług `-PRODUCTION-LANE`, `-AUTOMANAGE`).
* Z-POST-3 (odstępstwo od 1:1, jawne): web `new Set([0, ...gdAiOwnerIds, ...goldDeficitStates.keys()])` zachowuje kolejność wstawiania `Map` (klucze 5,3 => `[0,5,3]`); Rust `BTreeMap` iteruje rosnąco (`[0,3,5]`, komentarz w `run_gold_deficit_step`). Wpływa wyłącznie na kolejność `owner_ids`, `per_owner`, `destroyed_ids` (właściciele niezależni: filtr po `ownerId`, brak współdzielonego stanu), nie na stany ani jednostki. e2e porównuje listy jako zbiory; test `gold_deficit_step_owner_order_is_ascending_z_post_3` przypina kolejność Rust.
* Z-POST-8: nowe pola `szczescie` / `citizen_growth_pct_delta` (Z-POST-4) nie mają wektora z weba (`citizenUpkeep?.growthPctDelta ?? 0`, `main.ts:36020-36024`, w tym przypadek `citizenUpkeep` undefined) -- NIE_ZMIERZONO; wzór `szczescie` sprawdzony odczytem kodu (`:35765`). Dług: wektory ORDER-LANE z tymi polami.
* Z-POST-9: baza regresu 2087/0 przyjęta z dispatchu (`c8782b58d`), PRZED nie zmierzono ponownie; rachunek: po OBRONIE R1 pełny zestaw = 2087 + 4 (1 e2e + 3 unit) + 2 (unit OBRONY) = 2093.
* Z-POST-4: patrz sek. 7 (`order_effects_lane.rs` poza allowlistą, pola nie zmierzone vs web).
* Z-POST-5: upkeep Pracy drugiego fotela człowieka trafia do `aiPracaPoolByOwner` (web `:36108-36113`, `oid === 0` jest jedyny wyjątek) -- odtworzone 1:1, prawdopodobna luka weba (hot-seat), nie poprawiana.
* Z-POST-6: `rebalanceWorkersAfterPopulationChange` w wektorach z pustą mapą i `territoryNodes = []` (jak P6.7A); porównujemy kolejność i argumenty wywołań, nie zmiany `okolicaReczne`.
* Z-POST-7: parametry deficytu budowane z wierszy `ekonomia_miasta.zloto_deficyt_*` (w tym brzegowych: `NaN`/napis/brak/`karencja 0`/`hp_frac > 1`), `build_gold_deficit_params` porównane z `buildGoldDeficitParams`.

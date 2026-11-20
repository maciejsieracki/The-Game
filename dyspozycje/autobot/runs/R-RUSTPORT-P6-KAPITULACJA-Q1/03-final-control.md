# R-RUSTPORT-P6-KAPITULACJA-Q1 — Final Control, runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-KAPITULACJA-Q1 (kapitulacja głodowa oblężenia, W3/W4/W5, w produkcyjnym ticku `advance_turn`)
GOAL: kapitulacja głodowa w `PlayableGame::advance_turn` (faza `SIEGE_TICK_PHASE` = Economy), zgodna 1:1 z pinem `07d2fbd72`
(N3 `main.ts:38808-38878`, `handleSiegeCapitulationPhase` `:17646`, `resolveSiegeSurrender` `:17662-17878`, `endMapSiege`).
OCENIANY KOD: `oper/kapitulacja-q1-obrona` = `40afa847a` (kod `003b295b0..43cfc469e` + raporty). Baza = merge-base z
`origin/rust-port/parity-v2` = `e1f61c503c7c48d9cb9183d462a2b698ee490ab4` (to SHA podaje dispatch). `parity-v2` poszło od tego czasu do przodu
(`3e5db0673`, merge FRAME-QUANT), więc integracja musi zrobić merge-tree i bramkę na wyniku.
ZMIANY/COMMIT: tylko ten raport (gałąź FC `fc/kapitulacja-q1`, worktree `wf_619caad9-bd7-4`). Kodu nie zmieniałem.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## 1. Bramki odtworzone samodzielnie

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (`…/scratchpad/kapq1fc/target`,
poza repo). Wszystko szło w tle przez `setsid nohup`, a target usunąłem po bramkach (po sprzątaniu wolne miejsce na dysku = 11 GB).

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` (engine) | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test p6_kapitulacja --test p6_zdobycie_miasta_a --test p6_zdobycie_miasta_b --test bridge_contract` | EXIT 0 (10 + 15 + 6 + 16 passed, 0 failed) |
| Pełny `cargo test --all-targets --no-fail-fast` | **EXIT 0**: 554 binarki, **4230 passed, 0 failed, 1 ignored** (`ignored` było już przed tym tematem, nie doszedł żaden nowy `#[ignore]`) — wynik zgodny z raportem obrony |
| Generator `node rust-port/engine/tests/p6_kapitulacja_gen.mjs` (node 22.23.4) | SHA-256 tekstu pinu `17b8f1fb…78a9` = oczekiwany; MD5 `vectors.json` `63c07bee154e716b0c7d8a44b062c8eb` = zawartość commitu (odtworzone bajt w bajt), 24 scenariusze; `git status` po uruchomieniu czysty |

`git diff e1f61c503..40afa847a | grep '^-.*assert'`: pusto (żadna asercja nie została osłabiona).

## 2. Allowlista

Diff `e1f61c503..40afa847a` obejmuje: `city_capture_apply.rs`, `playable.rs`, `siege_surrender.rs`, `tests/p6_kapitulacja.rs`,
`tests/p6_kapitulacja_gen.mjs`, `tests/p6_kapitulacja_vectors/vectors.json` oraz `runs/…/01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`.
Wszystkie te pliki są w allowliście. Nietknięte zostały: `siege_tactics_loop.rs`, `siege_battle_session.rs`, `p6_k5loop_wiring_a*`, `bridge.rs`, `save_load.rs`,
`siege_transfer.rs`, `siege_capital_plunder.rs`, `client`, `renderer`, `src-tauri` i `gra/`. W `playable.rs` doszły dwa pola stanu (`siege_city`,
`oblega_city_by_unit`, oba z `skip_serializing_if` pustych), hak w `advance_turn` i getter. To mieści się w granicy „tylko konieczne”.

## 3. Weryfikacja zgodności z pinem (czytane: `git show 07d2fbd72:gra/src/main.ts` `:38800-38880`)

- Blok N3 pinu siedzi w `try { for (const tick of econ.perCity) … } catch (errSiege) { console.error(…) }`. Rust:
  `run_siege_turn` przy błędzie wychodzi z pętli miast (`break`), a `advance_turn` loguje błąd i tura trwa dalej. To odpowiada semantyce pinu.
  Jest jedno świadome odstępstwo techniczne: kapitulacja jednego miasta liczy się na kopii stanu, więc przy błędzie nie zostają połowiczne mutacje
  (D-KAP-3 r2). Atrycja i start głodu miast przetworzonych wcześniej zostają, tak jak w pinie.
- Kolejność kroków N3 jest zachowana: `siegeDefenderUnits` (właściciel, heks, niecywil, odrzucone `hp<=0`), `siegeStarvationState`, potem gałęzie
  `recordStart` lub atrycja z ponowną oceną, następnie `setLegacyPending` → `handleSiegeCapitulationPhase`, w przeciwnym razie `surrenderNow` → `resolveSiegeSurrender`.
- `resolveSiegeSurrender` (`apply_siege_capitulation`) porównałem z dziennikiem wywołań generatora wykonującego tekst pinu
  (`steps` == `log`, test `advance_turn_runs_capitulation_end_to_end` i wszystkie 24 scenariusze).

## 4. Moje mutanty (kontrolne, `p6_kapitulacja` + `p6_zdobycie_miasta_b`, źródła przywrócone, `git status` czysty)

| ID | Mutacja | Wynik |
|---|---|---|
| FC2 | kapitulacja na stanie, bez kopii (brak cofnięcia przy błędzie) | ZABITY (`capitulation_error_rolls_back_city_effects`) |
| FC4 | `record_start` ignorowany (start głodu nie zapisywany) | ZABITY (wektory, determinizm) |
| FC5 | brak `Math.max(1, population)` po stracie ludności | ZABITY (wektory, determinizm) |
| FC1, FC3 | (wzorzec występuje 2× — także w ścieżce szturmu; nie mutowano) | nie dotyczy |

Te wyniki są spójne z tabelą obrony (14/14 zabitych) i z mutantami Evaluatora, które były zabite już w r1.

## 5. Orzeczenia na zarzuty

| Zarzut | Orzeczenie | Uzasadnienie (dowód) |
|---|---|---|
| Z1 E2E: kolejka produkcji, łup stolicy i eliminacja, `recordWarCityLossForPair`, karta zdarzenia | **ODDAL** (naprawione) | Generator wykonuje teraz te kroki z tekstu pinu (`runCapitalCapturePlunder`, `sanitizeProductionQueue`, `recordWarCityLossForPair`, `buildCityCaptureReportRows`, `recordCityCaptureEvent`, `recordCivElimEvent`). `assert_capture_steps` porównuje stolice, skarbce, Pracę, technologie, wojny, metę par, zdobycze mocy, kolejki i `capture_events`. Nowe scenariusze to `stolica_przejecie`, `stolica_gdzie_indziej`, `kolejka_nowa_stolica_gracza` i `eliminacja`. Wektory odtworzyłem bajt w bajt. Mutanty E01/E02/E03/F04/F06/E09 są zabite według obrony; nie podważam tego, bo wektory zawierają te pola. |
| Z2 warunek heksu przy usuwaniu obrońców | **ODDAL** (naprawione) | Scenariusz `obroncy_poza_heksem` i test `capitulation_keeps_old_owner_units_outside_city_hex`. F05 zabity. |
| Z3 filtr właściciela w `siegeDefenderUnits` | **ODDAL** (naprawione) | Scenariusz `obcy_wojskowy_na_heksie` i test `foreign_military_unit_on_city_hex_is_not_garrison`. E17 zabity. |
| Z4a faza Economy (E10) | **ODDAL** | Faza jest nazwaną stałą `SIEGE_TICK_PHASE` przypiętą testem `siege_tick_phase_is_economy_after_diplomacy`. Mutacja samego warunku `if` na `Diplomacy` jest dziś behawioralnie równoważna: między `Diplomacy` a `Economy` nie dzieje się nic, co zmienia stan, bo tick ekonomii nie jest jeszcze wpięty. Zostaje dług, który przypnie EKONOMIA-TURA (#352). |
| Z4b ścieżka `Err` i semantyka błędu ≠ pin | **ODDAL** (naprawione) | Teraz obowiązuje semantyka pinu (log, tura trwa, pętla miast przerwana). Przypinają ją testy `capitulation_error_does_not_block_advance_turn`, `capitulation_error_stops_city_loop_like_pin` i `capitulation_error_rolls_back_city_effects` (mój FC2). E08 uznaję za równoważny: zdobywca pochodzi z `PlayerId` (`u64` → `i64 ≥ 0`), a barbarzyńca to `-1`, więc ta gałąź jest martwa w typach. F07 jest nieaktualny, bo kod cofania został usunięty. Odstępstwo „kapitulacja atomowa zamiast połowicznych mutacji” jest techniczne, więc decyzję wpisuje orkiestrator do rejestru (KAP-EV-2). Nie zmienia gameplayu dla poprawnych danych. |
| Z5 zegar głodu bez ticka ekonomii | **ODDAL** (dług z warunkiem) | Dziś nieosiągalne w grze, bo nic nie ustawia `oblegane`/`magazyn_zywnosci` w produkcji. Warunek KAP-EV-1 musi wejść do `REJESTR-RUST.md`: **nie wpinać startu oblężenia na mapie ani Load z `oblegane`/`citySiege` przed EKONOMIA-TURA (#352) albo przed zegarem WIRE 4**. |
| Z6 AI↔AI szturm vs kapitulacja | **ODDAL** (dług) | Rozbieżność jest jawna (`not_applied`) i dotyczy licznika `regularWarCapturedByPairKey`, czyli osobnego tematu (KAP-DL-1, KAP-EV-3). |
| Z7 trudność, E14, E19, doc-komentarz | **ODDAL** | Nieznana trudność daje teraz błąd (test `unknown_difficulty_is_reported_not_defaulted`), a doc-komentarz `siege_battle()` wrócił na miejsce. E14/E19 są nieblokujące; tak ocenił też Evaluator. |
| FC-N1 (moje) nieaktualny doc `# Errors` w `apply_siege_capitulation`: „Wołający (tick) cofa całą turę oblężenia” | **ODDAL** (drobiazg, dług dokumentacyjny) | Faktycznie cofana jest tylko kapitulacja danego miasta, a tura trwa (D-KAP-3 r2). Komentarz nie wpływa na zachowanie. Poprawić przy najbliższym dotknięciu pliku. |
| FC-N2 (moje) E2E przez `advance_turn` pokrywa tylko scenariusz `legacy_gracz`; 23 pozostałe idą przez `run_siege_turn` | **ODDAL** | `advance_turn` woła dokładnie `run_siege_turn(&mut self.state)` bez innych przekształceń. Test E2E sprawdza, że to wywołanie jest wpięte (log kroków, migawki, `capture_events`), a wektory pokrywają logikę. |
| FC-N3 (moje) klej generatora (`eliminateOwner` w zakresie stanu, akcesory zasobów) przepisany z cytatem linii, a nie wycięty | **ODDAL** | Zakres jest jawnie opisany w nagłówku generatora z numerami linii (`:34864-34990`, `:35348`). To domknięcia `main.ts`, których nie da się załadować bez całej gry. Rdzeń kroków wykonuje tekst pinu. `lostPower` scenariusza `eliminacja` pochodzi z Rust (producenci POWER-* mają własne wektory). To słabsza gwarancja tylko dla wiersza „Moc” karty eliminacji. |

Żaden zarzut nie dostał orzeczenia NAPRAW. Do decyzji człowieka (gameplay) nie trafia nic: nie stwierdziłem gameplayu spoza webu.

## 6. Tabela W3–W5 (FC)

| # | Element | Ocena |
|---|---|---|
| W3 | flaga oczekiwania → przejęcie w następnym ticku, start głodu, atrycja, kapitulacja < 50%, filtr obrońców | ZASTOSOWANO, przypięte wektorami i testami |
| W4 | `besiegerOwnerForCity`, `areEnemyOwners` (pokój = koniec oblężenia), brak oblegającego, brak miasta | ZASTOSOWANO, przypięte |
| W4 | strata ludności, prawo, właściciel, cuda/kronika, kolejka, `recordWarCityLossForPair`, `Math.max(1)`, usunięcie obrońców (heks), wejście armii, łup stolicy/eliminacja, karta zdarzenia, `endMapSiege` | ZASTOSOWANO, przypięte |
| W4 | `applyLiveSafeRationForCity` | jawnie `not_applied` (brak pola w stanie) |
| W5 | `capturedFromOwnerId`, `playerEverOwnedCityByOwner`, zdobycze mocy | ZASTOSOWANO, przypięte |
| poza | W6–W8, W11, W12/W13, spektakl, SAVE-LOAD | poza zakresem (dispatch) |

## 7. Długi (do `REJESTR-RUST.md` przez orkiestratora)

KAP-DL-1…9 (Operator/obrona), KAP-EV-1 (warunek wpięcia startu oblężenia lub Load przed #352), KAP-EV-2 (D-KAP-3 r2: kapitulacja atomowa),
KAP-EV-3 (AI↔AI), E10 po EKONOMIA-TURA, FC-N1 (doc `# Errors`), KAP-DL-9 (klucz `utraty` "1" vs "0" dla ofiary-gracza; to kod B, sprawdzić w temacie licznika wojny).

## 8. Następny krok

Integracja przez orkiestratora: `40afa847a` (+ ten raport) na aktualny `origin/rust-port/parity-v2` (`3e5db0673`). Najpierw merge-tree; konflikt możliwy
w `playable.rs` (`advance_turn`). Potem pełna bramka na wyniku merge'a i wpisy do rejestru (sekcja 7).

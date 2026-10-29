# P6-REPIN-WOJNA-NOWE-B - port nowych modulow wojny/armii z weba (pin 91dc998a), czesc B

**Temat:** `R-RUSTPORT-REPIN-WOJNA-NOWE-B-Q1` · **Runda:** 1/5 · **Rola:** Operator-impl
**Pin webu:** `91dc998a5f1b51ad29e0f4785edfd45655445c53` · **Pin dotychczasowy:** `edb8fb56` (manifesty bez zmiany pinu).
**Baza:** `rust-port/parity-v2` @ `ec981e3a` (czesc A zintegrowana). Silnik przed zmiana: 1284/0.
**Zakres:** `gra/src/game/army-consolidation.ts` (+177) i `gra/src/game/ai-general-war-campaign.ts` (+164) z `git diff edb8fb56 91dc998a`
(oba pliki sa NOWE w webie, wiec kazda funkcja jest zmiana behawioralna). Zmian niebehawioralnych (komentarze) nie portujemy;
naglowki komentarzy sa tylko cytatami.

## Pliki

- `rust-port/engine/src/domain/army_consolidation.rs` (NOWY)
- `rust-port/engine/src/domain/ai_general_war_campaign.rs` (NOWY)
- `rust-port/engine/src/domain/mod.rs` (dopisek `pub mod`)
- `rust-port/engine/data/derived/army-consolidation-params.json` (NOWY; kopia `gra/data/army-consolidation-params.json`, sha256 `7f7fae14...fe61902`)
- `rust-port/engine/tests/p6_repin_wojna_b_army_consolidation.rs`, `rust-port/engine/tests/p6_repin_wojna_b_ai_general.rs` (NOWE)
- `rust-port/engine/tests/p6_repin_wojna_b_vectors/army-consolidation.json` (1,57 MB), `.../ai-general-war-campaign.json` (2,62 MB)
- Generator i logi: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WOJNA-NOWE-B-Q1/` (`gen-repin-wojna-b-web-vectors.mjs`, `hooks.mjs`, `register.mjs`, `mutate-b.py`, `mut-b-*.log`, `test-b.log`, `clippy-b-final.log`, `fmt-b.log`).

## Wektory z uruchomionego weba

Generator `gen-repin-wojna-b-web-vectors.mjs` importuje kod TS z `git archive 91dc998a gra/src gra/data` (katalog poza repo)
przez loader `hooks.mjs` (rozwiazuje importy bez rozszerzenia, transpiluje .ts przez `typescript`, dopisuje
`with { type: 'json' }` do importu JSON; logika modulow bez zmian). Uruchomienie:
`node --import <SCRATCH>/register.mjs gen-repin-wojna-b-web-vectors.mjs <WEB_ROOT> rust-port/engine/tests/p6_repin_wojna_b_vectors`.
Hashe zrodel (sha256) sa w polu `sourceSha256` plikow wektorow. `terrainMoveCost` jest wywolywane przez generator na
obiektach `{ terenBazowy }` (bez rzeki, lasu i drog); w Rust jest to wejscie (`hex_costs`).

## Tabela zmian: web -> Rust -> test -> status

| # | Zmiana (web) | plik:linia weba | plik:linia Rust | Test / wektor | Status |
|---|---|---|---|---|---|
| 1 | Flaga `ARMY_CONSOLIDATION_ENABLED = true` | army-consolidation.ts:24 | army_consolidation.rs:26 | `constants_and_flag_match_web` (enabledDefault) | PORTOWANE |
| 2 | `isArmyConsolidationEnabled` z override (globalny stan) | army-consolidation.ts:26-35 | army_consolidation.rs:68 (override jako argument) | `constants_and_flag_match_web` (3 przypadki) | PORTOWANE (ZALOZENIE: brak stanu globalnego) |
| 3 | Parametry z JSON (`wartosc`) | army-consolidation.ts:38-40 | army_consolidation.rs:53, :58, :63 + data/derived JSON | `constants_and_flag_match_web` | PORTOWANE |
| 4 | `pickRallyCity` | army-consolidation.ts:74 | army_consolidation.rs:122 | `pick_rally_city_matches_web` (600) | PORTOWANE |
| 5 | `buildRallyCandidates` (promien, remis po id) | army-consolidation.ts:89 | army_consolidation.rs:136 | `build_rally_candidates_matches_web` (600) | PORTOWANE |
| 6 | `assignRallyTargets` (zajetosc, fallback) | army-consolidation.ts:111 | army_consolidation.rs:165 | `assign_rally_targets_matches_web` (700) | PORTOWANE |
| 7 | `warArmyCount` | army-consolidation.ts:147 | army_consolidation.rs:203 | `war_army_count_matches_web` (300) | PORTOWANE |
| 8 | `splitIntoWarArmies` (LPT, remisy po indeksie) | army-consolidation.ts:156 | army_consolidation.rs:213 | `split_into_war_armies_matches_web` (700) | PORTOWANE |
| 9 | Porownanie id jak `<` w JS | army-consolidation.ts:98, :123, :166 | army_consolidation.rs:108 (`cmp_js_str`, kody UTF-16) | wektory 5, 6, 8 | PORTOWANE |
| 10 | Typy `AiGeneralWarCampaign*`, `AiWarLandReachability` | ai-general-war-campaign.ts:5-24 | ai_general_war_campaign.rs:33-70 | wszystkie testy kampanii | PORTOWANE |
| 11 | `AI_GENERAL_WAR_GATHER_TURNS = 5` | ai-general-war-campaign.ts:17 | ai_general_war_campaign.rs:26 | `gather_turns_constant_matches_web` | PORTOWANE |
| 12 | `findAiWarLandReachability` (BFS, start, blokady) | ai-general-war-campaign.ts:26-52 | ai_general_war_campaign.rs:92 | `reachability_matches_web` (400); mutacje G10, G18 | PORTOWANE (ZALOZENIE: `GameMap.hexes`+`terrainMoveCost` -> `hex_costs`) |
| 13 | `aiWarTargetHasReachableLandNeighbor` | ai-general-war-campaign.ts:54-60 | ai_general_war_campaign.rs:131 | `reachability_matches_web` (sasiedzi); mutacja G11 | PORTOWANE |
| 14 | `chooseAiGeneralWarTarget` | ai-general-war-campaign.ts:62-72 | ai_general_war_campaign.rs:140 | `choose_target_matches_web` (700); mutacje G08, G09 | PORTOWANE |
| 15 | `reconcileAiGeneralWarCampaign` (nowa kampania, swiezy general, restart po smierci) | ai-general-war-campaign.ts:74-110 | ai_general_war_campaign.rs:190 | `reconcile_matches_web` (1500); mutacje G01-G05, G17 | PORTOWANE |
| 16 | `recordAiGeneralGatherTurn` (raz na ture, prog 5) | ai-general-war-campaign.ts:112-126 | ai_general_war_campaign.rs:253 | `record_gather_turn_matches_web` (400); mutacje G06, G07 | PORTOWANE |
| 17 | `aiGeneralCampaignToSave` (pusty generalUnitId pomijany) | ai-general-war-campaign.ts:128-137 | ai_general_war_campaign.rs:277 | `save_matches_web` (300); mutacja G15 | PORTOWANE |
| 18 | `restoreAiGeneralCampaigns` (walidacja, Map.set, safe-int) | ai-general-war-campaign.ts:139-164 | ai_general_war_campaign.rs:293, :301, :344 | `restore_matches_web` (500 + 2 krawedzie); mutacje G12-G14, G16 | PORTOWANE |
| 19 | Komentarze / nazwy w naglowkach | army-consolidation.ts:1-18 | - | - | NIE-DOTYCZY (dokumentacja) |
| 20 | `ruchLeft` w `ConsolidationUnit` | army-consolidation.ts:46 | army_consolidation.rs:74 (pole) | wektor assign (pole wejsciowe) | PORTOWANE (nieuzywane w logice, jak w webie) |

## Zalozenia (adaptacja typow)

- Flaga webu to zmienna modulu; w Rust override jest argumentem `Option<bool>` (brak stanu globalnego).
- Heks = `(i64, i64)` zamiast klucza napisowego `"q,r"`; obecnosc klucza w `GameMap.hexes` i wynik
  `terrainMoveCost` przechodza jako mapa `hex_costs` (`f64::INFINITY` = nieprzejezdny). `terrainMoveCost` nie jest tu portowane.
- `RuntimeUnit` ograniczony do `GeneralRef { id, is_general }`.
- `restoreAiGeneralCampaigns` przyjmuje `serde_json::Value`; zwraca `Vec` z semantyka `Map.set` (nadpisanie zachowuje pozycje).
- Porownanie napisow w sortowaniu: kody UTF-16 (jak `<` w JS). Wartosci `distance` i `strength` zakladane skonczone
  (NaN w webie nie jest odtwarzany; NIE_ZMIERZONO dla NaN).
- `armyCount` w `splitIntoWarArmies` to `i64` (wartosci <= 1 daja jedna armie, jak `Math.max(1, ...)`).

## Testy i bramki

- Testy wektorowe: `p6_repin_wojna_b_army_consolidation` (6 testow), `p6_repin_wojna_b_ai_general` (7 testow); asercje nie zostaly oslabione (liczby przypadkow sprawdzane `>=`).
- Mutacje, runda operatora (28 zmian w ciele logiki, po jednej naraz, skrypt `mutate-b.py`): **28 KILLED, 0 SURVIVED**. Logi: `mut-b-G01..G18`, `mut-b-A01..A10`.
- Mutacje, runda weryfikatora (`verify-mut-b-*.log`): dodatkowo 11 mutacji galezi bez pokrycia w rundzie operatora
  (E01-E07: sticky-cel, pusta lista osiagalnych, ignorowanie `sameTarget`, guard `gathering`, domyslny stage przy restore,
  utrata `lastGatherTurn`, ignorowanie `isGeneral` w rekrutacji; A11-A14: filtr stolicy, tie-break po id w przydziale,
  klamp `min(len)` w podziale, filtr pustych armii). Wynik: **10 KILLED, 1 SURVIVED (A13)**.
  A13 (`min(units.len())` w `split_into_war_armies`) jest mutantem rownowaznym: puste grupy sa filtrowane na koncu, a
  niepuste grupy zawsze tworza prefiks `0..m-1` (wybor = najnizszy indeks o minimalnej sumie; pierwsza pusta grupa ma
  sume 0), wiec wynik dla `k > len` jest identyczny jak dla `k = len`. ZALOZENIE: dowod z kodu, nie test.
- Weryfikacja niezalezna (runda 2): wektory JSON wygenerowane ponownie z kodu weba 91dc998a (`gen-repin-wojna-b-web-vectors.mjs`,
  Node 22.22.0, `/tmp`-scratch poza repo) sa **bajtowo identyczne** z plikami w repo (`cmp`, EXIT=0). Hashe zrodel
  (`sourceSha256`) zgodne z `git show 91dc998a:<sciezka> | sha256sum`. Parametry JSON identyczne z `gra/data`.
- `cargo fmt --all -- --check`: OK (`fmt-b.log`, weryfikator `verify-fmt.log`, EXIT=0).
- `cargo clippy --all-targets -- -D warnings`: OK (`clippy-b-final.log`, weryfikator `verify-clippy.log`, EXIT=0).
- `cargo test --no-fail-fast` (`test-b.log`, weryfikator `verify-test.log`): **1297 passed, 0 failed**, EXIT=0 (baseline 1284 + 13 nowych).
- `git diff --check`: czysty.
- Uwaga o narzedziu: `mutate-b.py` w rundzie operatora mial sztywne sciezki do innego worktree (`wf_921c9171-66d-1`);
  zmieniono na sciezki wzgledem lokalizacji skryptu. Mutacje operatora nie zostaly ponowione przez weryfikatora pod ta sama nazwa
  logow; weryfikator zreprodukowal 28/28 KILLED w swoim worktree (`verify-mut-b-G*/A*`).

## Nastepne partie (osobne ID)

- `ai-move-range.ts` (osobny temat)
- `diplomacy-tick-war-brake.ts` (osobny temat)
- WOJNA-ZMIANY (`forced-war-*`, `armyMerge.ts`, `planned-march.ts`)
- Przesuniecie pinu w manifestach: osobny temat po krokach 1-5 wg REPIN-DELTA §6 (NIE w tym temacie).

# P6-REPIN-AI-PRIORYTETY-CEL (R-RUSTPORT-REPIN-AI-PRIORYTETY-CEL-Q1, runda 2)

Pomiar: web `origin/main` (pin 14f2af1b0, FALA 551/553/558/559) vs Rust `rust-port/parity-v2`
(baza d6414fcf1; runda 1 = c8d2be640; runda 2 = commity z sekcji Bramki). Zakres: trzy zmiany AI wojny z webu.
Źródła web: `gra/src/game/ai-war-home-defense.ts`, `ai-war-target-select.ts`, `war-rules-multiwar.ts`,
`cities.ts`, `warAllInCapital.ts`.

## Tabela: web -> Rust (stan po rundzie 2)

| Element webu | Web (plik:linia) | Rust | Status |
|---|---|---|---|
| (a) FALA 551 `planHomeWar` (obrona domu P1/P2, histereza, stałe `HOME_WAR_*`) | ai-war-home-defense.ts:254, :40-63 | `domain/war_home_defense.rs` (4A: stałe, typy, pamięć, klastry, `decide_mode`) + `domain/war_home_defense_plan.rs` (4B: `plan_home_war`, P2 S1/S3, P1 odbicie) | PORTOWANE 1:1; zgodne z webem na 160 scenariuszach / 975 krokach (`tests/p6_repin_ai_home.rs`). NIEPODPIĘTE do tury AI (brak wołającego w `src`) |
| (a) pamięć histerezy `memoryByOwner` / `resetHomeWarMemory` | ai-war-home-defense.ts:158-173 | `HomeWarMemoryStore` (jawny obiekt zamiast globalnej mapy) | PORTOWANE; zmiana formy (ZAŁOŻENIE, patrz Odstępstwa 6) |
| (a) `cityFounderId` | cities.ts:1120 | `domain/war_city_founder.rs` `city_founder_id` | PORTOWANE (wektory ręczne, Odstępstwa 5) |
| (a) `isCityLostOf` | cities.ts:1132 | `domain/war_city_founder.rs` `is_city_lost_of` | PORTOWANE (wektory ręczne + pośrednio przez wektory planera) |
| (a) pole `foundedBy` w modelu miasta | cities.ts | `City::founded_by: Option<i64>` (state.rs), addytywnie | DODANE. Round-trip zapisu NIE zmierzony (Odstępstwa 3) |
| (b) FALA 553 `isNearestCityWarPair` / `buildWarCityTargets` | ai-war-target-select.ts:39, :49 | `domain/war_target_select.rs` | PORTOWANE; wektory z weba (`tests/p6_repin_ai_war_vectors.rs`) |
| (b) remis odległości `tieBeforeTarget` | warAllInCapital.ts:411-420 | `war_target_select.rs` `nearest_war_city_target` oraz `war_all_in_capital_plan.rs` `nearest_target_def` (używany przez planer) | PORTOWANE; planer przyjmuje `defenders` przez `plan_war_all_in_capital_with_defenders` (test `p6_repin_ai_nearest_plan.rs`) |
| (b) pole `defenders` w `WarCapitalTarget` | warAllInCapital.ts:61 | NIE DODANE (dotknęłoby testy spoza allowlisty); `defenders` idzie osobną mapą `city_id -> defenders` | ZAŁOŻENIE (Odstępstwa 1) |
| (c) FALA 558 `isPlayerEligibleForEraWarPool` / `isPlayerEraWarSlotFree` | war-rules-multiwar.ts:295, :314 | `domain/war_era_pool.rs` | PORTOWANE jako funkcje czyste. KONSUMENT W RUST NIE ISTNIEJE (Odstępstwa 2) |
| `forcedEraTagEpoch` / `forcedEraTagForEpoch` / `eraWarCounterEpoch` | war-rules-multiwar.ts:255, :263, :272 | `war_era_pool.rs` | PORTOWANE; wektory z weba |
| `canCivJoinEraForcedWar`, `eraWarCountFor`, `evaluateEraForcedWarGate`, `isWarTreatyBlocked` | war-rules-multiwar.ts | `diplomacy_multiwar*.rs` | JEST, bez zmian |

## Wektory (wszystkie z URUCHOMIONEGO weba, Node 22.22 `stripTypeScriptTypes`, jedyny patch opisany niżej)

- `tests/p6_repin_ai_war_vectors.json` (runda 1) -- tury wojny: pula, slot, tagi epok, cele (4 scenariusze).
- `tests/p6_repin_ai_home_vectors.json` + `tests/p6_repin_ai_home_gen.mjs` (runda 2) -- `planHomeWar`:
  160 scenariuszy, 975 kroków tur (PRNG seed 551, pamięć histerezy przez całą sekwencję tur),
  pokrycie: 1144 rozkazów-klastrów `attack`, 454 `hold`, 8 `released`, 124 odbicia `go`, 4 `wait`, 847 tur bez odbicia,
  588 klastrów `small`. Patch generatora: import `cityFounderId`/`isCityLostOf` zastąpiony KOPIĄ dwóch funkcji
  z `cities.ts:1120-1140` (cały `cities.ts` nie ładuje się w Node). Pokrycie `wait` jest słabe (4) -- do wzmocnienia.
- `tests/p6_repin_ai_founded_by.rs` -- 3 testy, wektory RĘCZNE (definicja webu, bez uruchamiania `cities.ts`).

## Odstępstwa i założenia (do akceptacji przez orkiestratora)

1. `WarCapitalTarget` nie dostał pola `defenders` (dotknęłoby 5 plików testów spoza allowlisty). Liczba obrońców
   idzie mapą `city_id -> defenders` obok listy celów. Planer `plan_war_all_in_capital` (publiczna sygnatura bez zmian)
   deleguje do `plan_war_all_in_capital_with_defenders`; pusta mapa = dokładnie stare zachowanie (`cmp_target`).
2. (c) `isPlayerEligibleForEraWarPool` / `isPlayerEraWarSlotFree` nie mają konsumenta w Rust (`grep` po `src`:
   tylko `war_era_pool.rs`). Web wywołuje je w `main.ts:39016` i `:39091` (warstwa UI/tury gracza, nieportowana).
   Podpięcie wymaga portu tej ścieżki -- poza zakresem tego tematu. Progi 20/20 i limit 1 są STAŁYMI Rust,
   nie parametrem `WarRulesParams` (decyzja progów należy do właściciela).
3. `foundedBy` jest tylko w modelu `City`. `City` nie ma `serde`, a w `src` nie ma czytnika zapisu miast, który
   czytałby `foundedBy` lub `foundedByOwner`. Round-trip zapisu web -> Rust NIE zmierzony (NIE_ZMIERZONO).
4. Literał `City` w `tests/p6_6b_vectors/common.rs` (`city_from`) ma jedną dodaną linię `founded_by:`.
   Bez niej testy p6_6b nie kompilują się. Plik jest poza allowlistą -- odstępstwo wymaga zgody.
5. `cityFounderId`/`isCityLostOf` (Rust) mają wektory ręczne. Wektory planera używają kopii tych funkcji z web.
6. `HomeWarMemoryStore` zamiast globalnej mapy webu (przekazywany przez wołającego). Stateless = `current_turn = None`.
   Siła jednostki (`strengthOf`) i `isFieldUnit` są precomputed w `HomeWarUnit`. Odległość = `hex_distance` (axial, max z 3 osi)
   -- zakładam tę samą definicję co web (nie zweryfikowano w `game/hex*.ts`).
7. `HOME_WAR_DEFENSE_ENABLED` jest stałą `true`; przełącznik `setHomeWarDefenseOverride` (tylko testy weba) nie jest portowany.

## Bramki (runda 2)

- `rustfmt --edition 2021 --check` na zmienionych plikach `.rs`: zielone (rc=0).
- `cargo clippy --all-targets -- -D warnings`: zielone (rc=0, `CARGO_INCREMENTAL=0`, bez debug info).
- `cargo test` podzbiór (11 binarek, 0 failed): `p6_6b_cities_ensure` 3, `p6_6b_cities_found` 5,
  `p6_repin_ai_founded_by` 3, `p6_repin_ai_home` 2, `p6_repin_ai_nearest_plan` 2, `p6_repin_ai_war_vectors` 4,
  `p6_repin_wojna_2_battle_mode` 3, `p6_repin_wojna_c_move_range` 12, `p6_repin_wojna_d_engage` 12,
  `p6_repin_wojna_d_nav` 23, `p6_repin_wojna_d_vectors` 1.
- PEŁNY przebieg 309 binarek: NIE_ZMIERZONO w tej rundzie (czas i dysk).

## Następne kroki (NIE zrobione)

- Podpięcie `plan_home_war` do tury AI (wołający w `ai_turn.rs` / planer wojny) -- osobna partia.
- Konsument puli wojen epoki gracza (`isPlayerEligibleForEraWarPool`) -- wymaga portu `main.ts:39016/39091`.
- Czytnik zapisu miasta dla `foundedBy`/`foundedByOwner` (wspólny z P6-ZAPIS).
- Decyzja właściciela: progi puli (20/20) i limit 1 jako parametr `WarRulesParams`.
- REPIN ai-params 10/3/0 i pozostałe długi webowe nie objęte tematem.

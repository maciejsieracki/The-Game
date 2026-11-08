# P6-AI-PEACE-CITY-OFFER — port AI oferującej miasto za pokój (R-RUSTPORT-P6-AI-PEACE-CITY-OFFER-Q1)

Status: runda 1, Operator (Haiku 5.5). Baza: `origin/rust-port/parity-v2` d3e4d4df2.
Web (pomiar): `origin/main` (gra/src, gra/data wyeksportowane przez `git archive` do katalogu poza repo), Node v22.22.0.

## 1. Pomiar: zakres web → Rust

| Web (`gra/src/game/ai.ts`) | Rola | Rust (`rust-port/engine/src/domain/ai_peace_city_offer.rs`) | Stan |
|---|---|---|---|
| `AI_MIASTO_PRZEKAZ_RW_BAZA` 0.15 (:6234) | próg rw bazowy | `AI_MIASTO_PRZEKAZ_RW_BAZA` | 1:1 |
| `AI_MIASTO_PRZEKAZ_MIN_MIAST` 3 (:6236) | min. miast AI | `AI_MIASTO_PRZEKAZ_MIN_MIAST` | 1:1 |
| `AI_MIASTO_ZADANIE_RW` 0.7 (:6238) | próg rw żądania | `AI_MIASTO_ZADANIE_RW` | 1:1 |
| `AI_MIASTO_ZADANIE_TURY_WOJNY` 20 (:6240) | tury wojny żądania | `AI_MIASTO_ZADANIE_TURY_WOJNY` | 1:1 |
| `AI_MIASTO_CENA_POKOJU_PN` 500 (:6245) | cena pokoju PW | `AI_MIASTO_CENA_POKOJU_PN` | 1:1 |
| `MIASTO_WAGA_ODDAJACEGO` 1.5, `…_EKSPANSYWNOSC_KROK` 0.1, `…_BAZA` 3 (diplomacy-value-catalog.ts:786–789) | waga oddawanego miasta | `MIASTO_WAGA_ODDAJACEGO`, `MIASTO_AI_EKSPANSYWNOSC_KROK`, `MIASTO_AI_EKSPANSYWNOSC_BAZA` | 1:1 |
| `diplomacyMiastoWagaBilansu` (diplomacy-value-catalog.ts:875) | waga bilansu | `diplomacy_miasto_waga_bilansu` | 1:1 (brak wcześniej w Ruście) |
| `aiMiastoPrzekazRwProg` (:6248) | próg rw oddania | `ai_miasto_przekaz_rw_prog` | 1:1 |
| `aiMiastoWagaOddawanego` (:6255) | waga + round 0.001 | `ai_miasto_waga_oddawanego` (+ `js_round`) | 1:1 |
| `aiPickMiastoDoOddania` (:6264) | wybór miasta AI | `pick_miasto_do_oddania` | 1:1 |
| `aiPickMiastoDoZadania` (:6286) | wybór miasta gracza | `pick_miasto_do_zadania` | 1:1 |
| blok N1a `oferuj_miasto_za_pokoj` (:6724–6769) | przegrywający oddaje miasto | `decide_city_offer` (gałąź N1a) | 1:1 |
| blok N1b `zada_miasto_za_pokoj` (:6771–6794) | zwycięzca żąda miasta | `decide_city_offer` (gałąź N1b) | 1:1 |
| `warWearinessLevel`, `loserDespair`, `despairStage`, `offerMultiplier`, `isWarWeary` (war-weariness.ts) | zmęczenie i desperacja | już w `diplomacy_multiwar.rs` (użyte bez zmian) | 1:1 |
| `isFeelingStronger` (diplomacy-war-peace-profile.ts:323) | bramka „czuje się silniejsze" | `is_feeling_stronger` (już w Ruście) | 1:1 |
| `resolveWarPeaceProfile(myTyp)` → `minTurWojny` | bramka czasu wojny | `resolve_war_peace_profile(...).min_tur_wojny` | 1:1 |
| `czlowiek.rwProgBonusMax` 0.25, `czlowiek.minMiastAi` 2 (war-weariness-params.json) | eskalacja wobec gracza | `CZLOWIEK_RW_PROG_BONUS_MAX`, `CZLOWIEK_MIN_MIAST_AI` (literały) | 1:1 (literały, nie w `WarWearinessParams`) |
| `cooldown` `miasto_za_pokoj` (diplomacy-rejection-cooldown.ts:20) | klucz cooldownu odrzuconych ofert | `CITY_FOR_PEACE_COOLDOWN_KEY` (już w `diplomacy_rejection_cooldown.rs`) | bez zmian |

Poza zakresem (NIE portowane): reszta `decideAIDiplomacy` (priorytety 1–6, wymuszone wojny, pętla relacji). Rust nie ma
dekodera całej decyzji AI; `decide_city_offer` przyjmuje pola relacji i zwraca `None`, gdy web przechodzi do priorytetu 1.
Podpięcie do tury: NIE (zgodnie z dispatchem).

## 2. Wektory (oracle = uruchomiony web)

Generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-AI-PEACE-CITY-OFFER-Q1/gen-city-offer.ts` (esbuild bundle + Node 22,
`--external:three` bo moduł renderu importuje three.js, którego nie ma w ścieżce oracle). Wynik:
`rust-port/engine/tests/p6_ai_peace_city_offer_data/vectors.json` (1,09 MB).

| Zbiór | Liczba | Co pokrywa |
|---|---|---|
| `rwProg` | 11 | agresywność undefined, 0…10, 2.5 |
| `waga` | 11 | ekspansywność undefined, 0…10, 2.5 |
| `pickOddania` | 300 | ekspansywność {undef,0,3,5,10} × cena {domyślna,400,625,750,1250} × minMiast {undef,2,3} × długość listy 1–4; granice `cityPn` = ⌈cena/waga⌉ −2/−1/0/+1 (N−1/N/N+1), zakazane |
| `pickZadania` | 6 | granica 499/500/501, zakazane, pusta lista |
| `decide` | 2600 | blok N1a/N1b przez `decideAIDiplomacy` (jedna relacja, stan wojny, partnerId '0'); rw z siatki 0…1 (w tym 0.15±0.01, 0.7), tury wojny 0…201 (granice 7/8/19/20/21/199/200/201), straty 0–4, zdobyte 0–2, `turnsSinceCityChange` 0…130, agresywność, ekspansywność, miasta AI i gracza 0–4, flagi minor |

Wynik oracle (`decide`): oferuj 235, zada 307, brak komendy bloku (priorytet 1–6 lub pusto) 2058. Błędy wykonania: 0.

## 3. Wynik zgodności

- `tests/p6_ai_peace_city_offer.rs`: 5/5 pass (w tym: liczniki przypadków oferuj ≥100, zada ≥100, brak ≥100, aby test nie był pusty).
- Porównanie: `rwProg` i `waga` dokładnie (`==`), wybór miasta po `cityId`, bloki po rodzaju, `cityId`, `cityPn`, `cityWeight`, pełnym tekście `powod`.
- Ekstra: `js_to_fixed2` = `{:.2}` w Ruście; JS `toFixed` różni się tylko przy remisie dokładnym (np. 0.125). Wektory nie zawierają takiego rw (siatka bez wartości 1/8·k nieparzystego), więc to nie zmienia wyniku testu.

## 4. Odstępstwa od weba (ZAŁOŻENIA do akceptacji)

Brak odstępstw w logice. Założenia techniczne:
1. Parametry `czlowiek` (0.25, 2) są literałami w Ruście, jak reszta parametrów wojny zmęczenia (nie ma loadera JSON w tym module).
2. `decide_city_offer` zwraca `Option` dla jednej relacji; kolejność priorytetów i `continue` web odtwarza wywołujący (poza zakresem).
3. `js_round` = `Math.round` dla wartości dodatnich (`floor` + porównanie reszty), `js_to_fixed2` = `{:.2}`.

## 5. Bramki

- `cargo fmt` (rustfmt --check) na nowych plikach: OK.
- `cargo clippy --all-targets -- -D warnings` (cały pakiet civ-engine, wszystkie 318 targetów): OK, 0 ostrzeżeń.
- `cargo test --lib`: 22 passed, 0 failed.
- `cargo test` (binarki diplomacy/AI, 13 targetów: ai_turn, combat_ai_multipliers, diplomacy, p6_dyplo_multiwar2_peace_ai, p6_dyplo_multiwar2_peace_helpers, p6_dyplo_multiwar_peace, p6_repin_ai_founded_by, p6_repin_ai_home, p6_repin_ai_nearest_plan, p6_repin_ai_war_vectors, p6_repin_ai_zakup_rezerwa, p6_repin_wojna_b_ai_general, p6_ai_peace_city_offer): 0 failed, 0 nowych `#[ignore]`.
- NIE_ZMIERZONO: pełny `cargo test` dla wszystkich 318 binarek (linkowanie każdej w debug przekroczyłoby wolne miejsce na dysku ~6 GB przy limicie 1,5 GB); wszystkie binarki są typowo sprawdzane przez clippy `--all-targets`, a zmiana dodaje wyłącznie nowy moduł i jedną linię w `domain/mod.rs`.

## 6. Granice

Zmieniono wyłącznie: `rust-port/engine/src/domain/ai_peace_city_offer.rs` (nowy), `rust-port/engine/src/domain/mod.rs` (+1 linia `pub mod`),
`rust-port/engine/tests/p6_ai_peace_city_offer.rs` (nowy), `rust-port/engine/tests/p6_ai_peace_city_offer_data/vectors.json` (nowy),
`dyspozycje/rust-port/p6/P6-AI-PEACE-CITY-OFFER.md` (nowy), `dyspozycje/autobot/runs/R-RUSTPORT-P6-AI-PEACE-CITY-OFFER-Q1/**`.
Nie zmieniano: `gra/**`, `WERSJE.md`, `Cargo.toml`, renderer, `src-tauri`. Wyjątków poza allowlistą: brak.

## 7. Następny krok

Evaluator (Sonnet 5.5) i Final Control (Sonnet 5.5) na gałęzi wykonawczej; podpięcie komend N1a/N1b do tury i reszta `decideAIDiplomacy` jako osobny temat.

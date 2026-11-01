# P6-REPIN-TERYTORIUM-FORTY — REPIN delty weba `dc8a3adc` → `4bbef081d`, krok 3 (forty/terytorium)

**Temat:** R-RUSTPORT-REPIN-TERYTORIUM-FORTY-Q1 · **Runda:** 1/5 (Operator) · **Pin weba:** `4bbef081d` · **Baza Rust:** `fd8585daf` (`origin/rust-port/parity-v2`)
**Decyzje właściciela:** `dyspozycje/DECYZJE-WLASCICIELA-20261031-AUTOULEPSZENIA-FORTY.md` #15–#19 (treść wg dispatchu; nieczytana osobno, ZAŁOŻENIE: tabela niżej odpowiada kodowi weba, który jest źródłem prawdy portu).

## 1. Hunki behawioralne delty (pliki dispatchu)

Komenda: `git diff dc8a3adc 4bbef081d -- gra/src/map/territory.ts gra/src/game/fort-territory.ts gra/data/terrain-improvements.json gra/src/map/improvement-build.ts` → 218 dodań / 45 usunięć. Klasyfikacja hunków wg `hunki-r2.tsv` (REPIN-DELTA-3).

| # | Zmiana (web `4bbef081d`) | Plik:linia weba | Rust (po porcie) | Test | Status |
|---|---|---|---|---|---|
| 1 | Promień fortu 10→5, posterunku 5→3 | `territory.ts:74-77` (`FORT_TERRITORY_RADIUS`, `OUTPOST_TERRITORY_RADIUS`), `:90-91` | dane `terrain-improvements.json:278,402` (`zasieg_terytorium`) czytane przez `terrain.rs:279-285` (kod bez zmian) | `p6_repin_teren_domain::radii_and_boundaries_match_web` (brzegi N-1/N/N+1, 12 węzłów × 18 hexów), `p6_8i_pick` | PORTOWANY |
| 2 | `territoryOwnerAt`: miasta mają pierwszeństwo przed fortami/posterunkami (heks w promieniu któregokolwiek miasta rozstrzygają wyłącznie miasta) | `territory.ts:123-160` (`bestCityOwner`, `:153-160`) | `territory.rs:235-274` (`best_city_owner.or(best_fort_owner)`) | `territory_owner_at_matches_web` (20 759 zapytań, 1488 scenariuszy) | PORTOWANY |
| 3 | `TerritoryNode.order {turn, seq}`; spór fortów różnych cywilizacji wygrywa wcześniejszy (`turn`, remis → `seq`); brak `order` → najbliższy | `territory.ts:38-47`, `:137-148` | `territory.rs:161-194` (`TerritoryOrder`, `with_order`), `:252-269` | j.w. + remisy zaprojektowane (6×6×2×4 kombinacji `order` + odwrócona kolejność węzłów) | PORTOWANY |
| 4 | `FortNode.builtAtTurn/seq`, `nextFortSeq`, `backfillFortOrder` | `fort-territory.ts:58-90` | `fort_territory.rs:20-62` (`OrderedFortNode`, `next_fort_seq`, `backfill_fort_order`) | `next_seq_and_backfill_match_web` (300 przypadków) | PORTOWANY (ZAŁOŻENIE A: `FortNode` z `terrain.rs` bez zmian; porządek w nowym `OrderedFortNode`, by nie ruszać konstruktorów poza allowlistą) |
| 5 | `fortTerritoryNodes` (twarde terytorium z fortów; `contestedUseless` pomijane; `order` gdy jest `seq`, `turn = builtAtTurn ?? 0`) | `fort-territory.ts:103-121` | `fort_territory.rs:70-88` | `fort_territory_nodes_match_web` (300) | PORTOWANY |
| 6 | `isHexInForeignFortTerritory` | `fort-territory.ts:123-141` | `fort_territory.rs:91-108` | `foreign_fort_territory_matches_web` (6000 zapytań, 1950 prawdziwych) | PORTOWANY |
| 7 | `applyFortCaptureByOccupation` (+ `FortCaptureUnit`, `FortCaptureEvent`) | `fort-territory.ts:296-349` | `fort_territory.rs:112-186` | `capture_by_occupation_matches_web` (900 przypadków, 149 zdarzeń, w tym patologiczne `isEnemy(x,x)`) | PORTOWANY (tylko logika; wiązanie z pętlą gry poza zakresem) |
| 8 | Opisy/`warunek`/`uwagi`/`decyzje_EKONOMIA` fortu i posterunku, trzody (bydło/owce/lama), `surowiec_ilosc_tura` | `terrain-improvements.json` (14 hunków, `hunki-r2.tsv`) | `rust-port/engine/data/terrain-improvements.json` = bajt w bajt `git show 4bbef081d:gra/data/terrain-improvements.json` | `data_terrain_map`, `p6_repin_ekonomia_e_terrain_rates`, pełny `cargo test` | PORTOWANY (dane) |
| 9 | `improvement-build.ts` 428-465: tylko komentarze (kod bez zmian; `bydlo`/`owce` nadal w `FOREST_BLOCKED_IMPROVEMENT_KEYS`) | `improvement-build.ts:428-465` | brak zmiany kodu; dowód: `qualifier.json` zregenerowany z `4bbef081d` zgodny z Rust (`p6_m16_qualifier` 4/4) | `p6_m16_qualifier`, `p6_m16_divergence` | BEZ-ZMIANY-KODU |
| 10 | Współistnienie warstw fort + kopalnia | `improvement-build.ts` (bez zmiany kodu w delcie) | — | qualifier j.w. | BEZ-ZMIANY-KODU |
| 11 | `territory.ts:5`, `fort-territory.ts:8-18`, `main.ts:11506` | komentarze | — | — | KOMENTARZ |

## 2. Tryb ostry `p6_8i_pick`

`tests/p6_8i_pick.rs`: usunięta tolerancja dryfu (`drift`, `repinned`, limit `<= 40`); test twardo asercjuje promienie 5/3 i wymaga zgodności WSZYSTKICH 2227 scenariuszy (107 z `fortNodes`): `p6_8i_pick` 5/5 ok, 0 odchyleń (log `gate-8i-teren.txt`).

## 3. Wektory i dowody

- Generator: `gen-repin-teren-vectors.mjs` (esbuild 0.28.2 w `/dev/shm`, źródła z `git archive 4bbef081d gra/src gra/data`; zero buildu w `gra/`). Odtwarzalność: dwa uruchomienia → identyczny sha256 `c9cdb157…1aa086`. Fixture `tests/p6_repin_teren_vectors/teren.json` = 2,0 MB (≤ 6 MB).
- Niezależny weryfikator: `verify-teren.py` (`python3 -I`): 20 759 zapytań owner, 6000 foreign, 154 → po dodaniu `selfEnemy` 149 zdarzeń zdobycia, 0 rozbieżności.
- Mutacje (logi `mut-*.log`): 32 mutanty (10 T territory, 20 F fort_territory, 2 D dane). 31 ZABITE, 1 RÓWNOWAŻNY (T6, niżej). Mutant F12 początkowo przeżył (gałąź „właściciel ma jednostkę” maskowana późniejszym sprawdzeniem „obca jednostka obok” przy `isEnemy(x,x)=false`) → dodano do generatora wariant `selfEnemy` i mutant zabity.
- **T6 (równoważny):** `(Some(_), Some(o), Some(b))` → `(_, Some(o), Some(b))` (`territory.rs:254`). `best_fort_order` jest przypisywane wyłącznie razem z `best_fort_owner = Some(..)` (`territory.rs:266-267`), więc `best_fort_order == Some` ⇒ `best_fort_owner == Some`; wzorzec `_` nie rozszerza zbioru dopasowań.

## 4. Regres istniejących testów terytorium (PRZED vs PO)

37 binariów (`grep -il "territory|fort" tests/*.rs`), logi `gate-pre-teren.txt` / `gate-post-teren.txt`: PRZED 336 ok / 0 fail; PO 336 ok / 0 fail.
**Uwaga (ZAŁOŻENIE B, pliki poza allowlistą):** po przepięciu danych 19 testów (6 binariów) z wektorami starego pinu (`edb8fb56`, promienie 10/5) świeciło na czerwono — to skutek decyzji właściciela, nie błąd portu. Zregenerowano wektory z URUCHOMIONEGO weba `4bbef081d` tymi samymi generatorami i ziarnami (wejścia identyczne, zmienione wyłącznie wyjścia: dowód `dowod-regen-wektorow.txt`, `inputs identical: True`):
- `tests/p6_m14_vectors/{territory,work,wonder,range}.json` (generator `R-RUSTPORT-P6-M14-…/gen-m14-vectors.mjs`),
- `tests/p6_23_vectors/fort.json` (generator `R-RUSTPORT-P6-23-…/gen-p623-vectors.mjs`; `meta.pin_web` w generatorze jest stałą `edb8fb56` → ręcznie `4bbef081d` w pliku),
- `tests/p6_m16_vectors/qualifier.json` (generator M16; skopiowany z poprawką okna linii `getForestBuildBlockReason` → `gen-m16-vectors-4bbef.mjs`, bo numery linii przesunęły się po zmianie komentarzy; plik 7,7 MB jak przed zmianą, istniejący fixture),
- `src/domain/mod.rs`: jedna linia `pub mod fort_territory;` (ZAŁOŻENIE C).
Niezmienione (identyczne bajtowo): `p6_m16_vectors/{rules,gallery}.json`, `p6_23_vectors/{hexmove,order}.json`. `p6_23_vectors/improvements.json` różni się od świeżej generacji (poprawka EKONOMIA-E), nie ruszany, testy zielone.

## 5. Bramki (jedna linia `EXIT=` w każdym logu)

`gate-fmt.txt` EXIT=0; `gate-clippy.txt` (`--all-targets -D warnings`) EXIT=0; `gate-test-shard0..7.txt` (265 binariów + lib, `-j 2`): 292+282+252+226+257+234+253+223 = 2019 ok / 0 fail, EXIT=0 każdy; `git diff --check` czysty.

## 6. Granice

Zero zmian w `gra/**`, `domain/auto_improvements*`, `domain/mapgen/**`, `Cargo.toml`, `renderer/**`, `src-tauri/**`, `WERSJE.md`. `improvements.rs` nie ruszany (potrzeby: brak). `Cargo.lock` wygenerowany lokalnie, niezacommitowany.

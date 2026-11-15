# 03 — Final Control r1: R-RUSTPORT-P4-1G-Q2-ADAPTER-TERRAIN

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME (renderer / adapter DTO terenu)
TEMAT: R-RUSTPORT-P4-1G-Q2-ADAPTER-TERRAIN
GOAL: MapViewDto + HexDynDto + cities/wonders + FogSets → TerrainInput, MapHex, OverlayMap, OkolicaMap, TileYield, setFog terenu (1:1 wg pinu 07d2fbd72)
ZMIANY/COMMIT: kod = 157e79c15 (Obrona, rodzic 3463c909a Operatora, baza 601ff304c); FC = commit tego raportu na wip/R-RUSTPORT-P4-1G-Q2-ADAPTER-TERRAIN-fc-r1 (dodatkowo 02-evaluator.md przeniesiony z b1b92e595, który leżał poza łańcuchem Obrony)
TESTY: fmt EXIT 0; clippy --all-targets -D warnings EXIT 0; test --all-targets --no-fail-fast EXIT 0 (65 zestawów, 520 passed, 0 failed, 0 ignored); view_adapter_terrain 18 passed
BLOKADY: brak (luki L1/L2/L5 i decor_hidden jako NIE_ZMIERZONO — patrz niżej)
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora na rust-port/parity-v2 (FF z 601ff304c możliwy) + wpisy rejestrów z sekcji „Do orkiestratora”
DEPLOY/PUSH: NIE WYKONANO
```

## Baza i ancestry (zmierzone)

- `origin/rust-port/parity-v2` = `601ff304c` = baza z dispatchu.
- `git merge-base --is-ancestor 601ff304c 157e79c15` → tak; `3463c909a` (Operator) → przodek `157e79c15` → tak.
- Commit FC: rodzic `157e79c15`; FF z `601ff304c` możliwy (liniowy łańcuch 3463c909a → 157e79c15 → FC).

## Allowlista (zmierzone `git diff --stat 601ff304c 157e79c15`)

Tylko: `rust-port/renderer/src/view/terrain.rs` (nowy), `rust-port/renderer/src/view.rs` (+`pub mod terrain;` i `pub use terrain::{…}` — nic więcej), `rust-port/renderer/tests/view_adapter_terrain.rs` (nowy), `dyspozycje/autobot/runs/R-RUSTPORT-P4-1G-Q2-ADAPTER-TERRAIN/**`. Brak zmian w `view-model`, `Cargo.toml`, `Cargo.lock`, `gra/`. Brak `#[ignore]`.

## Bramki (FC, samodzielnie; `rust-port/renderer`, CARGO_TARGET_DIR w scratchpad, usunięty)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` | EXIT 0; 65 linii `test result: ok`; suma 520 passed / 0 failed / 0 ignored |
| `view_adapter_terrain` | 18 passed |

## Mutacje (FC, niezależnie, na 157e79c15; plik przywrócony `cmp` bajt w bajt)

| Mutacja | Wynik |
|---|---|
| pominięcie cudów w `solid_hidden_hexes` | FAILED (4 testy) |
| `terraces` zawsze false w `map_hexes` | FAILED (3 testy) |
| `seed: map.seed as i32` w `terrain_data`/`terrain_scene_options` | FAILED (1 test) |
| `covering_improvement` zawsze puste | FAILED (1 test) |

## Orzeczenia

| # | Zarzut | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| 1 | Brak wołającego w `src/`, brak zapisanej zależności | ODDAL | Docelowy konsument (integrator sceny R1/R2, §4) zapisany w doc modułu `terrain.rs` (sekcja „Consumers”). Wpis do REJESTR-RUST / NIEPODPIETE-MODULY jest poza allowlistą — przekazany orkiestratorowi. |
| 2 | Luka `solid_hidden` dla ukryć zdarzeniowych (wycinka lasu, `syncImprovementDecorForHex`) | ODDAL | Decyzja Operatora zgodna z pinem (końcowy stan `nakladka` nie rozstrzyga ukrycia) i z dispatchem §5 (zakaz zmian `view-model`). Skutek po integracji zapisany w doc modułu. Naprawa = osobny temat (pole `decor_hidden` w `HexDynDto`), wpis luki obok L5 — do orkiestratora. Decyzja techniczna, nie gameplay (pin rozstrzyga zachowanie). |
| 3 | Fixture ręczny | ODDAL | Wymagany przez dispatch, źródła plik:linia podane; wektory seed sprawdzone przez Evaluatora w Node. |
| 4 | Luki pokrycia (rzeki `kind=None`/puste, duplikaty coord) | ODDAL | Dodano `rivers_kind_none_and_empty_hexes` i `duplicate_coords_are_rejected_by_validate_map`; warunek wstępny `validate_map` zapisany w doc. Poprawka fixtury (`river_render_paths`) dotyczy tylko zgodności z `validate_map`, adapter tego pola nie czyta. |
| 5 | L1/L2/L5 NIE_ZMIERZONO, `fogOn=false && revealAllLand=true` niewyrażalne | ODDAL | Brak zarzutu wobec Operatora; zależność od tematu #254 (L1/L2 w kontrakcie DTO). |
| FC-1 | Obrona podała „563 passed, 68 linii test result: ok” | ODDAL (korekta raportu) | Pomiar FC: 65 zestawów, 520 passed (= 518 Operatora/Evaluatora + 2 nowe testy). Liczba Obrony była błędna; kodu nie dotyczy, wynik bramek zielony. Wiążąca jest liczba z tego raportu. |

Brak NAPRAW, brak DO DECYZJI CZŁOWIEKA.

## NIE_ZMIERZONO (przeniesione, bez wymyślania wartości)

- L5 `wonderBuildSites` (`main.ts:5264`) — nie ukrywa brył.
- L1 `revealAllLand`, L2 `riverRevealKeys` — `land_reveal` jawny parametr bez domyślnej wartości; przypadek `fogOn=false && revealAllLand=true` (`main.ts:13485`) niewyrażalny.
- Ukrycia zdarzeniowe dekoru (`main.ts:16801/17014/42967`, `:16877-16946`) — proponowane `decor_hidden` w `HexDynDto`.

## Do orkiestratora

1. Wpis w `NIEPODPIETE-MODULY` / `REJESTR-RUST`: `view::terrain::*` bez wołającego w `src/`; konsument = integrator sceny R1/R2 (P4-1G §4), nie W8.
2. Nowy temat + luka obok L5: `HexDynDto.decor_hidden` liczone przez producenta (wycinka lasu, `syncImprovementDecorForHex`).
3. Gotowe sformułowania wpisów: `02a-obrona.md` §„Do orkiestratora”.

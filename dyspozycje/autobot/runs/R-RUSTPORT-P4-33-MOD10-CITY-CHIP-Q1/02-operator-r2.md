STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-33-MOD10-CITY-CHIP-Q1
GOAL: MOD-10 w `rust-port/renderer` (baza 95b91471): port 1:1 na `Canvas2dLite` `cityMapStatChip.ts`, `cityOkolicaOverlay.ts`, `workerFieldOverlay.ts` (pin edb8fb56); tekstury RGBA + metadane, sprite'y jako dane, wejścia DTO, okolica przez MOD-13, klucze przez `raster::atlas`, bez GPU; weryfikacja vs Chromium 141, determinizm, mutacje, fixtury z sha256.

ROLA: Operator (obrona, runda 2) po FAIL Evaluatora r1. Stan odtworzony z commita r1 `1bbd7bd6` (rodzic 95b91471).

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. Pomiar potwierdził: progi globalne przepuszczały C07/C19/C21. Poprawka: (a) w każdym porównaniu z Chromium lokalne miary `win6` (najgorsze okno 6×6 px) i `px>64`, limity per grupa z pomiaru bazy (plakietki 20 / etykiety 15 / ikony 10; `px>64` ≤ 12) — C07 84,6, C19 82,4, C21 16,03 (cienki margines, jawnie w §6.3); (b) ślad rysowania porównywany z Chromium dokładnie. Dowód: `dowody/08-mutations-r2.log` — 28/28 zabitych, 28/28 testem innym niż złoty hash; C07/C19/C21 zabijają `chip|okolica_textures_match_chromium` i `draw_traces_match_chromium`. Dokument §6.3, §6.4, §9.2.
2. PRZYJMUJĘ. Testy strukturalne niezależne od złotego hasha: `draw_traces_match_chromium` (133 malowania, 2 396 porównań, 474 `fillText` — tekst, surowy font, align/baseline, pozycja bitowo — 0 różnic), limity lokalne + `local_limits_are_tight` (limit ≤ maks. bazy + 6, miara widzi 1 piksel).
3. PRZYJMUJĘ. `hover_row_text_matches_chromium`: napisy wiersza hover z Chromium (12, w tym 4 przycięte z „…”) = napisy Rust, 0 różnic; zabija C06, C07, C10.

ZMIANY/COMMIT: patrz SHA w odpowiedzi orkiestratorowi (commit r2 na `1bbd7bd6`). Pliki: `src/cities/overlay/trace.rs` (nowy), `src/cities/overlay/{mod,stat_chip,okolica,worker_field}.rs` (wywołania fillStyle/shadow*/clearRect/fillText przez `trace`), `tests/cityoverlay_web_parity.rs`, `tests/fixtures/cityoverlay/{gen.ts,gen.mjs,city.json,MANIFEST.sha256,README.md}` (ref/ i input/ bez zmian, złote hashe bez zmian), `dyspozycje/rust-port/p4/P4-33-MOD10-CITY-CHIP.md`, `dowody/{01-gates-r2.log,06-generator-repro-r2.log,07-cityoverlay-tests-nocapture-r2.log,08-mutations.py,08-mutations-r2.log}`. Cargo.toml/lock bez zmian, zero `unsafe`, nowych zależności brak.

TESTY: fmt / clippy / clippy gpu EXIT=0; test stable 348 passed, test 1.87.0 348 passed (EXIT=0); generator 2× — MANIFEST identyczny (868b068e…a084b); mutacje 28/28.

BLOKADY: brak. Ocena wzrokowa na GPU — NIE_ZMIERZONO (§11). Ślad nie obejmuje ścieżek/obrysów/drawImage (Z-33-12).

RUNDY: 2/5

NASTĘPNY KROK: Evaluator (runda 2), potem Final Control.

DEPLOY/PUSH: NIE WYKONANO

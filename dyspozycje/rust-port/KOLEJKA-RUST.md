# KOLEJKA-RUST — kolejka tematów 3D (migawka 2026-11-27 ~17:20 UTC; WSTRZYMANE na czas odnowienia limitu)

Baza kodu: `origin/rust-port/parity-v2` = `617185ba8` (po #416). Stan szczegółowy i instrukcja wznowienia: `REJESTR-RUST.md`, wpis „WSTRZYMANIE 2026-11-27 ~17:10".
Zasady: 3D po jednym temacie naraz; każdy temat implementacyjny w dwóch częściach (A, potem B); Operator i Obrona = ten sam model (Sonnet 5.5 dla programowania wokół 3D, Opus 5.5 tylko dla renderera/grafiki); Evaluator i Final Control = Sonnet 5.5; dispatch wypchnięty przed Workflow; dysk: engine ≥ 8 GB, renderer ≥ 12 GB; commity bez linii z modelem.
Heartbeaty `trig_01VcFhTMSsCgeFNvhwxnkZjm` i `trig_01DiSPBEtwmKWjgEKvcGWm7W` WYŁĄCZONE — włączyć przy wznowieniu.

## W toku (wstrzymane)
| # | temat | stan |
|---|---|---|
| 417 (A, r2) | K5EXEC-H4 tryb ręczny gracza w ciele bitwy: stan trybu, wykonanie rozkazów hold/none/move/attack/attackMove | FC PASS-WITH-NOTES `28f3680c9` (`origin/rust-port-wip/417a-r2-fc`); NIEZINTEGROWANE — powtórzyć pełny test na drzewie FC, FF `parity-v2`, wpis Przebieg |

## Kolejka (kolejność wykonania)
| # | temat | model | uwagi |
|---|---|---|---|
| 417 r3 | oblężenie ręczne ciała (ram_tower :8022, tower_climb :8056, infantry_to_tower :8087, `_siegeSafeApproach` :8107 z fx z portów) + kolejka `_executeUnitsImmediate` :18578-18614 na wektorach + zarzuty 1–2 FC r2 | Sonnet | baza = parity-v2 po FF #417A r2 |
| 422 (417B) | wektory bitew z rozkazem gracza, wołający produkcyjny, blokada generała, SiegeLoop E2E z trybem ręcznym, ścieżka atomowa | Sonnet | po r3 |
| 418 | rozpoznanie I5b: co zostało z BATTLE-ACTIONS-SIEGE po I5a (tylko odczyt) | Sonnet | |
| 419 | audyt tagów `unported` osiągalnych w produkcji (krok-naprzod-brak-terenu, cios/strzal-bez-szablonu, ucieczka-routed, odwrot/marsz-brak-terenu) | Sonnet | po 418 |
| 420 | SHOT-LAND-AT-RENDER: `hit_at`/`land_at` z chwili klatki (renderer) A/B | Operator+Obrona OPUS | renderer ≥ 12 GB, `--locked` |
| 423 | #369 K5LOOP-WIRING A/B: ProdBody + SiegeLoop jako produkcyjna pętla (najpierw rozpoznanie stanu) | Sonnet | |
| 424 | #370 I5 BATTLE-ACTIONS-SIEGE A/B (producent DTO); konsument w rendererze osobno | Sonnet / Opus | po 418 i 423 |
| 421 | porządek listy zadań (kandydaci do zamknięcia: #218/#365, #107/#121–#125/#128/#162, #338–#347/#268, #353/#369/#113, #397, #329, #371) | Sonnet | na końcu |

## Zablokowane
- #410 TAURI-GLUE: brak crate'ów `tauri-*` offline.
- #253/#335/#359 FOG-VIEW: pytanie ABC do właściciela o mgłę fotela (opis, plusy/minusy, rekomendacja — zasada 10).

## Zrobione w sesji 2026-11-26/27 (parity-v2)
#404 K5EXEC-T3 `bb92c80fa`; #414 FQ-SPEED-MIDCHANGE-VEC-2 `1dedba56c`; #415 K5EXEC-T4 `53e4188f2`; #416 K5EXEC-H3 `617185ba8`.

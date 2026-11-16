STATUS: PASS-WITH-NOTES
DOMAIN: GAME (odczyt)
TEMAT: R-RUSTPORT-P6-K5-AUTO-EXEC-ROZP-Q1 (runda 1, Final Control)
GOAL: Rozpoznanie `_executeUnitsImmediate` (pin 07d2fbd72) przed portem K5-AUTO-EXEC: mapa zależności, klasyfikacja, podział na tematy.
ZMIANY/COMMIT: tylko `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5-AUTO-EXEC-ROZP-Q1/` (01, 02a, 03). `git diff --stat 474487792..9ab595837` = 2 pliki (01, 02a). Kod, rust-port/, gra/ nietknięte.
TESTY: NIE DOTYCZY (odczyt). Zweryfikowane samodzielnie: pin (eksport battleScene.ts) i grep w rust-port/engine/src.
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja dokumentacyjna orkiestratora; dispatch T1 wg kolejności z 02a §3 (z notami niżej).
DEPLOY/PUSH: NIE WYKONANO

Baza: 474487792 jest przodkiem 9ab595837 (merge-base --is-ancestor = OK). Łańcuch: 474487792 -> f373952ff (Operator) -> 9ab595837 (Obrona).
Dokument rozstrzygający: 02a-obrona.md §2-§3 ma pierwszeństwo przed 01 (01 nie został przepisany).

## Werdykty per zarzut
| # | Zarzut | Decyzja | Dowód FC |
|---|---|---|---|
| 1 | `_compactAttackAllowsStep` | ODDAL | `formation_rules.rs:423 pub fn compact_line_allows_advance` istnieje; 02a §2.1 koryguje na PARTIAL i nakazuje reużycie |
| 2 | `_adjacentEnemy`/priorytety | ODDAL | pin 17481, 17512, 17545 istnieją; `inputs_pos.rs:205 relative_hit` istnieje; zależności zmapowane w 02a §2.2, pola modelu jawnie NIE_ZMIERZONO |
| 3 | pole `acted` | ODDAL | `unit.rs:53`, `turnseq.rs:268/306/352` potwierdzone; pin 18608 bezwarunkowe `u.acted = true`, `turnseq.rs:350-352` warunkowe (`!idle_player_unit`); różnica opisana |
| 4 | `runNext` vs `begin_turn` | ODDAL | `activate.rs:117 perform_player_order(&mut self) -> bool` bez jednostki/done; `loop.rs:773` atrapa; wniosek o braku wejścia silnika poprawny |
| 5 | `busy` | ODDAL | `autobatch.rs:768` = `halt_auto_battle_turn`, `turnseq.rs:346` = gałąź suspended; 02a uczciwie oznacza ścieżkę normalną NIE_ZMIERZONO |
| 6 | grep per wiersz | ODDAL | liczniki z 02a §2.6 odtworzone 1:1; `blockade/attack_move` = 1 trafienie (`pathfinding.rs:1172`, komentarz) |
| 7 | drzewo `_performPlayerOrder` | ODDAL | gałęzie hold/none/move/attackMove/attack zgodne z pinem 18282-18396; odwrócenie zależności (move -> attack) zaakceptowane |
| 8 | allowlisty | ODDAL | `domain/mod.rs` linie 60/107/127/131 potwierdzone; konwencja `p6_*.rs` + `_gen.mjs` + `_vectors/` potwierdzona (`p6_combat_melee*`, `p4_1j_general_target_vectors/`) |

Liczba NAPRAW: 0. Temat to rekonesans bez kodu; wszystkie zarzuty poprawione merytorycznie w 02a z dowodami.

## Noty (nie blokują; uwzględnić w dispatchu T1)
1. `_isUnitDoctrineAuto`: 02a mówi BRAK, ale `siege_tactics_activate.rs:81-83` ma wejścia `doctrine_auto`/`doctrine_manual` (flagi). Poprawna klasyfikacja: PARTIAL (wejście jest, wyliczenie flagi BRAK).
2. `busy` w Rust: grep pokazuje wyłącznie `busy = false` (turnseq:346, autobatch:768) i inicjalizacje, nigdy `busy = true`. Pin ustawia `true` w 8715/9097/9180 i zdejmuje w 8755/8771/9118/9166-7/9228/9234-5. Operator T1 musi zmierzyć, kto ustawia `busy` w silniku, zanim zbuduje bramkę.
3. 02a §3: T5 (ATTACK-ORDER) zależy też od T2 (gałąź `attack` używa `_shouldAvoidAutoBacktrack`, `_compactAttackAllowsStep`, `_destAllowedByBlockade`); tabela pomija T2 przy T5.
4. NIE_ZMIERZONO pozostają (jawnie wskazane): pola jednostki (`mounted`, `anti_cav_spear`, `use_unit_priorities`, `unit_target_priorities`), sposób generowania wektorów z prywatnej metody pinu, zgodność `renderer/src/battle/orders.rs` z pinem 07d2fbd72 (nagłówek cytuje edb8fb56).
5. Evaluator r2 po obronie nie był uruchamiany; FC zweryfikował poprawki samodzielnie (tabela wyżej).

## Decyzje człowieka
Brak (rozpoznanie nie rozstrzyga gameplay).

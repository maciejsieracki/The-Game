# R-RUSTPORT-P6-BATTLE-SETUP-Q1 — Evaluator (adwersarialny), runda 1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-BATTLE-SETUP-Q1
GOAL: T5a — teren + mur pola bitwy w silniku wg pinu 07d2fbd72
ZMIANY/COMMIT: oceniany kod 4ae3c51c4 (+ raport 12d87282e) na gałęzi rust-port-wip/battle-setup-q1-r1; baza d21caf8f2 (ancestor potwierdzony)
TESTY: fmt 0, clippy -D warnings 0, p6_battle_setup 14/14 (EXIT 0), generator odtworzony (MD5 identyczne); pełny engine i mutanty Evaluatora: W TOKU w chwili zapisu (NIE_ZMIERZONO)
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Obrona -> Final Control (FC musi odtworzyć pełny cargo test --all-targets i odczytać wynik mutantów E1–E24)
DEPLOY/PUSH: NIE WYKONANO
```

## Bramki odtworzone (CARGO_TARGET_DIR w scratchpadzie, CARGO_INCREMENTAL=0, debug=0)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test p6_battle_setup` | 14 passed, 0 failed, 0 ignored, EXIT 0 |
| `node tests/p6_battle_setup_gen.mjs` | SHA pinu zgodne; vectors.json `2be023c8…`, renderer_parity.json `d5d76ef6…` — bajt w bajt jak w commicie |
| pełny `cargo test --all-targets --no-fail-fast` (setsid nohup) | uruchomiony; wynik NIE_ZMIERZONO w chwili zapisu (log `scratchpad/bsetup-eval/full.log`, linia FULL_EXIT). Operator raportuje EXIT 0, 4002/0/0 |

## Allowlista i zakazy

Diff d21caf8f2..12d87282e: wyłącznie pliki z allowlisty (`battle_setup*.rs`, `mod.rs` = 3× `pub mod`, `tests/p6_battle_setup*.rs`, generator, wektory, raport). Brak zmian w `renderer/`, `siege_tactics_loop.rs`, `Cargo.*`, `gra/**`, istniejących testach. Brak `#[ignore]`. Trailery bez Co-Authored-By z nazwą modelu.

## Zgodność z pinem (sprawdzone ręcznie, `git show 07d2fbd72`)

* `battleClearSideCap`, `deployClearRanksFor`, `battleSafeCols`, `_carveBattleBox` (1–3), `_fencePlayableZone`, `_carveWallTiles`, `towerMaterialFor`/`towerRows`, `cityFortificationKind`, `MOVE_COST`/`COMBAT_NAME`/`at`/`passable`/`combatTerrainName`, `presetForWorldTerrain` — port 1:1.
* Generator wykonuje TEKST pinu (całe `battle-terrain.ts`, `city-towers.ts`, `city-fortification.ts`; wycinki `battleScene.ts`/`combat.ts` ze strażnikiem SHA-256 i `expectLine`), atrapy tylko 3D/DOM. D-BS-3: `Math.random` zablokowany wyjątkiem w czasie scenariuszy — 0 wywołań; potwierdzam, że wycinki ustawienia pola nie wołają `Math.random` (wywołania w `battleScene.ts` są w walce/dźwięku, poza T5a).
* Mutant równoważny (straż łączności): potwierdzam rozumowanie — po kroku 1 (każdy kafel pasm nadpisany Plains/Ford) i kroku 2 (River→Ford w 31..36) rząd `PLAY_MID_ROW` od (31,77) do (36,77) nie zawiera `River`, więc DFS zawsze dochodzi; gałąź „punch fords” martwa w pinie. Przyjęte.
* Pokrycie dispatchu: 21 scenariuszy (≥ 6), każdy teren mapy presetów + nieznany, mur/palisada/cytadela/brak, NaN/Inf ze strażnikiem czasu, fikstura renderera przez JSON (test czyta tylko tekst `field.rs`, bez zależności od crate).

## Mutanty Evaluatora (E1–E24, `scratchpad/bsetup-eval/scripts/emut.py`, kopia crate poza worktree)

Zestaw: Ford pod pasmem presetu, zakres korytarza (kolumny/rzędy), granica strefy gry, brama w `wallTileHp`, materiał palisady, limit pętli pasm (k<31), `fract` w `at_f`, `n>0` mnożnika kawalerii, kropka bez cyfry w regexie, filtr `hi>=lo`, definicja `presetActive`, odstęp wież na sztywno, `﻿` w trim, fence→Ford, kolumna muru +1, kolejność fence/carve, sideCap bez obrońcy, +3→+2 w głębokości presetu, „Gory” bez isMountain, koszt brodu, przejezdna brama, „niedostępne”, `gate_row`+1. Wyniki: W TOKU w chwili zapisu (log `scratchpad/bsetup-eval/emut.log`) — NIE_ZMIERZONO. Mutanty Operatora (22/22 zabite + 1 równoważny) przyjęte na podstawie raportu i przeglądu testów.

## Uwagi (nieblokujące)

1. Pełna bramka i mutanty Evaluatora nie zakończyły się przed zapisem raportu — FC MUSI je odtworzyć przed integracją.
2. `rownosc_z_rendererem_przez_fiksture` czyta `../renderer/src/battle/field.rs` w czasie testu (FNV wycinków): to sprzężenie z tekstem renderera (nie z crate) — zmiana `field.rs` wymusi regenerację fikstury. Zgodne z dispatchem, ale do odnotowania.
3. `js_sin` dla `|x| > 2^19·π/2` wraca do `f64::sin` (glibc); nieosiągalne przy `BF_ROWS=156`, osiągalne tylko przez publiczne `generate_battle_terrain` z ogromnym `rows`.
4. `SiegeFieldInput::tower_spacing: Option<i64>` nie odwzorowuje niecałkowitych/NaN wartości z danych (pin `Math.floor(spacing ?? 4)`); dane pinu = 4, bez wpływu.
5. Uwagi operatora §6 (brak klucza `wieze_strzeleckie_odstep_kafli` w danych silnika, `MAX_PER_SIDE=120` w rendererze, `FieldMoveTerrain` niepodpięty) — potwierdzone, poza zakresem T5a.

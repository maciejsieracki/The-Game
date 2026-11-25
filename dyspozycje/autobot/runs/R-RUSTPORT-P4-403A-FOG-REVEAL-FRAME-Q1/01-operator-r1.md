# R-RUSTPORT-P4-403A-FOG-REVEAL-FRAME-Q1 — Operator r1

STATUS: PASS-WITH-NOTES (kod + testy celowane + 9/9 mutantów zabitych; pełne bramki engine/renderer/client w toku w chwili commitu — patrz TESTY)
DOMAIN: GAME (port Rust, renderer/DTO)
TEMAT: R-RUSTPORT-P4-403A-FOG-REVEAL-FRAME-Q1 (#408, część A tematu #403)
GOAL: `FogRevealDto` aktywnego fotela jedzie z silnika przez `GetRenderFrame` do `FrameInputs`; `land_reveal` i `river_reveal_keys` pochodzą z DTO; `FogReveal::from_dto` ma produkcyjnego wołającego.
BAZA: `origin/rust-port/parity-v2` = `d831a69a820f0ea4dd094178ae51d09aebc39686`; gałąź `rust-port-wip/R-RUSTPORT-P4-403A-FOG-REVEAL-FRAME-Q1`.

## Web najpierw (pin `07d2fbd72`)
- `main.ts:13475-13513` `refreshFog`: gałąź `useFogRender = fogOn || revealAllLand` woła `setFog(vis, exploredForRender, { landReveal: revealAllLand, riverRevealKeys: startRevealKeysForRiverFog() })` (`:13490-13494`); bez mgły `setFog(ALL_KEYS, ALL_KEYS)` BEZ opcji (`:13505-13506`).
- `:13074-13080` `startRevealKeysForRiverFog`: `undefined`, gdy `!isAwaitingFirstPlayerCity() || meStartHex === null`, inaczej `computeVisibleAt(start, startRevealRadius)`.
- Jedno przejście = mgła + opcje → w Rust jedna ramka niesie oba (D-403A-1).

## ZMIANY/COMMIT
- `rust-port/view-model/src/root.rs`: `RenderLayersDto.reveal: Option<FogRevealDto>` z `#[serde(default, skip_serializing_if = "Option::is_none")]`. `RenderViewDto` bez zmian: `split` daje `None`, `join` odrzuca pole (pełny snapshot = kształt startu/wczytania; opcje jadą z każdą ramką) — decyzja techniczna Operatora, bez zmian w testach view-model.
- `rust-port/engine/src/domain/render_frame.rs`: `build_render_frame` ustawia `reveal = fog_active.then(|| layers.fog.reveal)` — `Some` w gałęzi mgły, `None` bez mgły (D-403A-2). Producent `FogRevealDto` (`dto_bridge.rs::build_fog_layers`) bez zmian.
- `rust-port/renderer/src/view/frame.rs`: `FrameInputs::from_dto_with_priority` woła `FogReveal::from_dto(map, &fog, reveal | NO_SET_FOG_OPTIONS)` (produkcyjny wołający, kryterium 1). Nowe pola `FrameInputs.river_reveal_keys: Option<HashSet<String>>` i `river_fog_active: bool` (= `FogReveal::river_fog_active`); `land_reveal` z DTO. Nowy wariant `FrameError::Reveal(FogRevealError)` (błąd typowany, nie ciche pominięcie). `fog.rs` bez zmian logiki (bez zmian w ogóle).
- Testy: `engine/tests/p4_364_render_frame.rs` (+5 `r403a_*`), `renderer/tests/view_frame.rs` (+4, fikstura `reveal: None`, asercje w `frame_inputs_hold_every_adapter_input`), `client/tests/engine_bridge_renderer.rs` (+4, moduł `fog_reveal_frame`, E2E silnik→most→klient→`FrameInputs`/`MapScene`).
- Poza allowlistą: brak. `src-tauri/frontend-v2/.../types.ts` nie zawiera typu ramki — bez zmian. `renderer/Cargo.lock` (DŁUG-T1-LOCK) cofnięty przed commitem.
- Commity: WIP `20310bee2`, finalny — SHA w wiadomości zwrotnej Operatora / `git log` gałęzi.

## Kryteria końca
1. `FogReveal::from_dto` — produkcyjny wołający w `FrameInputs::from_dto*`: TAK.
2. E2E: przed pierwszym miastem `river_reveal_keys` = `computeVisibleAt(start, radius)` (promienie 2/3/8, niezależne wyliczenie w teście); po mieście / samym wpisie `playerEverOwnedCity` / bez heksu startu / scenariusz startowy → `None`; `fog_on=false` → `reveal=None`, `land_reveal=false`, `river_fog_active=false`: TAK (engine + client).
3. Mutanty (skrypt `scratchpad/mutants.py`, każdy z kompilacją i uruchomieniem testów): 9/9 ZABITE
   - M1 ramka odrzuca `reveal` (engine 4 FAIL, client 3 FAIL)
   - M2 stałe `land_reveal=false` (renderer FAIL)
   - M3 stałe `river_reveal_keys=None` (renderer + client FAIL)
   - M4 zamiana None/Some (negacja `fog_active`) (engine + client FAIL)
   - M5 pominięcie `fog_on` (zawsze `Some`) (engine 2, client 1 FAIL)
   - M6 zła kolejność miasto/start (`!is_awaiting` → `is_awaiting` w `dto_bridge`) (engine FAIL)
   - M7 zła granica promienia (`radius - 1`) (engine FAIL)
   - M8 renderer ignoruje `reveal` ramki (renderer 4, client 2 FAIL)
   - M9 stałe `river_fog_active=false` (renderer FAIL)
4. JSON ramki z `reveal=None` bez klucza `reveal` (14 dawnych kluczy, test `r403a_json_ramki_addytywny`); odczyt bez klucza → `None`; most `CONTRACT_VERSION` = 1 (view-model `CONTRACT_VERSION` = 2 — bez zmian; dispatch pisał „1” o stałej mostu). Fikstury bez zmian. Uwaga: ramki z aktywną mgłą mają teraz dodatkowy klucz `reveal` (addytywnie, zgodnie z D-403A-1).
5. Bramki — patrz niżej.

## TESTY
- Celowane (zielone): engine `p4_364_render_frame r403a` 5/5; renderer `view_frame` 28/28; client `engine_bridge_renderer fog_reveal` 4/4.
- Pełne bramki (skrypt `scratchpad/gates.sh`, log `scratchpad/gates/summary.txt`, jeden build renderera naraz, dysk 13 GB wolne): fmt view-model/engine/renderer/client EXIT=0; view-model clippy EXIT=0, test EXIT=0 (119 passed, 0 failed). engine clippy, renderer clippy+test, client clippy+test, pełny engine test — **NIE_ZMIERZONO w chwili commitu** (bramka w toku, w tle). Evaluator musi je potwierdzić (EXIT 0) przed werdyktem.

## Długi i zapisy
- RIVER-SCENE: `MapScene` nie rysuje wstęg rzek; `river_reveal_keys`/`river_fog_active` w `FrameInputs` to wyłącznie dane dla przyszłego odbiorcy (`decor::river_lod::merged_river_visible_in_fog`) — osobny temat renderera.
- „Wpięte ≠ widoczne”: brak GPU-EMBED i kleju Tauri (#410); po 403A nic nie jest widoczne na ekranie, zmienił się stan CPU wejść renderera.
- Obserwacja: w obecnej sesji Rust scenariusz startowy zawsze ma stolicę, a heks startu pochodzi tylko ze stolicy (`PlayableFogSession::for_new_game`), więc gałąź „przed pierwszym miastem” jest dziś osiągalna tylko z ręcznie złożonego stanu (testy). Produkcyjnie `river_reveal_keys` = `None` do czasu startu bez miasta (osadnik) — do oceny przez orkiestratora (parytet startu, poza 403A).
- Dev-UI F/M poza zakresem (D-403A-4).

BLOKADY: brak (pełne bramki w toku, nie blokada).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator — potwierdzić pełne bramki engine/renderer/client (EXIT 0) i ocenić D-Operator (`RenderViewDto` bez `reveal`, `FrameError::Reveal`).
DEPLOY/PUSH: NIE WYKONANO

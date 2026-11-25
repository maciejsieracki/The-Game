# R-RUSTPORT-P4-403A-FOG-REVEAL-FRAME-Q1 — Obrona Operatora (po Evaluatorze r1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (port Rust, renderer/DTO)
TEMAT: R-RUSTPORT-P4-403A-FOG-REVEAL-FRAME-Q1 (#408, część A tematu #403)
GOAL: `FogRevealDto` aktywnego fotela jedzie z silnika przez `GetRenderFrame` do `FrameInputs`; `land_reveal` i `river_reveal_keys` pochodzą z DTO; `FogReveal::from_dto` ma produkcyjnego wołającego.
BAZA OBRONY: `015d34c63` (raport Evaluatora na kodzie Operatora `15a27fb7a`; baza tematu `d831a69a8` = `origin/rust-port/parity-v2` z dispatchu). Gałąź lokalna `obrona/403A`.
ZMIANY/COMMIT: tylko testy, w allowliście: `rust-port/engine/tests/p4_364_render_frame.rs`, `rust-port/client/tests/engine_bridge_renderer.rs`, plus ten raport. Kod produkcyjny bez zmian. SHA w wiadomości zwrotnej i w `git log obrona/403A`.

## Odpowiedzi na zarzuty

### Z1 — U1: brak testu `revealAllLand = true` na drodze silnik → ramka → `FrameInputs` (EV1, EV2 przeżywały) — PRZYJMUJĘ
Pin `07d2fbd72`, `main.ts:13485`: `useFogRender = fogOn || revealAllLand`; `:13490-13494`: `landReveal: revealAllLand`.
Dodane testy:
- engine `r403a_reveal_all_land_przy_mgle_i_bez_mgly`: `reveal_all_land = true` przy `fog_on = true` i `fog_on = false`. Asercje: `fog_active = true` i `reveal == Some { reveal_all_land: true, river_reveal_keys: Some(computeVisibleAt(start, 3)) }`.
- client (`fog_reveal_frame`): `reveal_all_land_with_fog_on_reaches_the_frame_inputs` i `reveal_all_land_without_fog_on_still_reaches_the_frame_inputs`. Asercje: ramka ma `reveal_all_land = true`, `FrameInputs.land_reveal = true`, `river_fog_active = false`, a przy mgle także klucze kręgu startu. Test pochodzi ze wzoru sondy Evaluatora `ev403a_probe`, ale używa wspólnego helpera modułu.

Dowód, że mutanty giną (każdy uruchomiony osobno i od razu cofnięty przez `git checkout`):
| Mutant | Zmiana | engine `r403a` | client `fog_reveal_frame` |
|---|---|---|---|
| EV1 | `render_frame.rs:942` `layers.fog.fog_active.then` → `fog_on.then` | FAIL (`r403a_reveal_all_land_przy_mgle_i_bez_mgly`) | FAIL (`…without_fog_on…`) |
| EV2 | `dto_bridge.rs:377` `reveal_all_land: session.reveal_all_land` → `false` | FAIL (ten sam test) | FAIL (oba testy `reveal_all_land_*`) |

### Z2 — U2: `deny_unknown_fields` i klucz `reveal` w każdej ramce z mgłą; typ TS (#411) musi dostać `reveal?` — PRZYJMUJĘ jako informację, bez zmiany kodu
Zgodnie z D-403A-1 zmiana jest addytywna. Bajt w bajt zachowane są tylko ramki z `reveal = None` (kryterium 4, test `r403a_json_ramki_addytywny`). Ramka z aktywną mgłą ma klucz `reveal`. Starszy konsument z `deny_unknown_fields` odrzuciłby taką ramkę. W repo jedynym konsumentem jest `civ-view-model` z tym samym typem, a test klienta E2E przechodzi. Dług do tematu #411 (TS-TYPES): w typie ramki dodać `reveal?: FogRevealDto` (`revealAllLand: boolean`, `riverRevealKeys?: HexCoord[]`). `frontend-v2/src/viewmodel/types.ts` nie ma dziś typu ramki, więc 403A go nie dotyka.

### Z3 — U3: produkcyjnie start ma zawsze stolicę, więc `river_reveal_keys` jest zawsze `None` — PRZYJMUJĘ jako informację (dług poza 403A)
Potwierdzam to, co napisałem w raporcie 01. `PlayableFogSession::for_new_game` bierze heks startu ze stolicy, a scenariusz startowy ma stolicę. Gałąź „przed pierwszym miastem” da się dziś osiągnąć tylko ze stanu złożonego ręcznie. Dług parytetu: START-OSADNIK (start bez miasta z osadnikiem, jak web), do rozpisania przez orkiestratora. Droga danych jest wpięta i przetestowana, więc po tym temacie zadziała bez zmian w 403A.

### Z4 — U4: `the_reveal_follows_every_refresh` nie zmienia stanu; komentarz „Niezalezny od producenta” jest nieścisły — PRZYJMUJĘ
- Test klienta przepisany. Ten sam `RenderClient` dostaje kolejne stany silnika: podmiana gry w adapterze przez `source_mut().bridge.adapter_mut()`, po której idzie `on_state_changed()`. Sekwencja: oczekiwanie na miasto → `Some(krąg)`, potem `record_ever_owned_city` → `None`, potem znowu oczekiwanie → `Some(krąg)`. Teraz klucze muszą podążać za stanem. Klient, który zatrzymałby pierwszą ramkę, nie przejdzie tego testu.
- Komentarz `visible_at` w `p4_364_render_frame.rs` poprawiony. Teraz mówi, że to ta sama funkcja `compute_visible_at`, której używa producent, że jej zgodność z pinem trzymają wektory w `p6_4_core.rs` i że test sprawdza drogę i bramkowanie, a nie sam algorytm kręgu. Ten sam skrót w raporcie 01 („niezależne wyliczenie w teście”) prostuję tutaj: wyliczenie nie jest niezależne od algorytmu, tylko od drogi producenta (`build_fog_layers` → ramka).

### Z5 — raport 01 ma pełne bramki jako NIE_ZMIERZONO — PRZYJMUJĘ
Uzupełnienie poniżej (sekcja TESTY). Pomiar Evaluatora na `15a27fb7a` i mój pomiar na commicie obrony.

### Z6 — wyniki pozostałych mutantów (EV3–EV10, M1–M9), allowlista i zgodność z pinem — bez zarzutu, nie wymaga odpowiedzi
EV6 i EV9 to mutanty równoważne. Przyjmuję ocenę Evaluatora.

### Z7 — odstępstwo procesowe Evaluatora (renderer przy 10,7 GB) — nie dotyczy Obrony
Odnotowuję. W obronie nie zmieniałem kodu renderera, a bramka klienta (kompiluje renderer) szła przy 12 GB wolnego i bez równoległych buildów renderera.

## TESTY
Pomiar Evaluatora na `15a27fb7a` (z 02-evaluator.md): fmt ×4 EXIT 0; clippy `-D warnings`: view-model, engine, renderer (gpu OFF) i client EXIT 0; view-model 119/0; renderer 757/0; client 45/0; pełny engine 4343 passed / 0 failed / 1 ignored (ignorowany test jest starszy niż ten temat).

Pomiar Obrony (commit obrony; zmiany tylko w testach engine i client; env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie, usunięty po bramkach):
- engine: `cargo fmt --check` EXIT 0; `cargo clippy --all-targets -- -D warnings` EXIT 0; `cargo test --test p4_364_render_frame r403a` 6/6; pełny `cargo test --all-targets --no-fail-fast`: WYNIK_ENGINE.
- client: `cargo fmt --check` EXIT 0; `cargo test --test engine_bridge_renderer fog_reveal_frame` 6/6; clippy i pełny test: WYNIK_CLIENT.
- view-model i renderer: kod bez zmian względem `15a27fb7a`, więc obowiązuje pomiar Evaluatora (renderer kompiluje się też w bramce klienta).
- Mutanty EV1 i EV2: zabite (tabela w Z1).
- `git diff --check` czysty, brak `#[ignore]`, brak osłabionych asercji, `renderer/Cargo.lock` poza commitem.

## Długi i zapisy (bez zmian względem 01, uzupełnione)
- RIVER-SCENE: `MapScene` nie rysuje wstęg rzek. `FrameInputs.river_reveal_keys` i `river_fog_active` to na razie wyłącznie dane.
- „Wpięte ≠ widoczne”: brak GPU-EMBED i kleju Tauri (#410). Na ekranie nic się nie zmienia.
- START-OSADNIK (Z3) i typ TS `reveal?` (Z2, #411).

BLOKADY: brak
RUNDY: 1/5 (obrona rundy 1)
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO

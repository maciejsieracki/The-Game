# R-RUSTPORT-P4-403A-FOG-REVEAL-FRAME-Q1 — odsłanianie mgły (FogRevealDto) w ramce silnika → renderer (zadanie #408, część A tematu #403)

STATUS: dispatch orkiestratora. Opus, wszystkie etapy Opus (3D/grafika Rust). Podstawa: `dyspozycje/rust-port/P4-403-DTO-BRIDGE-WIRE-ROZPOZNANIE.md` (rozpoznanie tylko do odczytu, 2026-11-25) i wpis „Rozpoznanie … #403" w `REJESTR-RUST.md`.
BAZA: `origin/rust-port/parity-v2` = `d831a69a820f0ea4dd094178ae51d09aebc39686` w dniu dispatchu (wpisz faktyczny SHA: `git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`).

## GOAL
NAJPIERW web (pin `07d2fbd72`, `gra/src/main.ts` ok. `:12801-12803`, `:13074-13080`, `:13475-13513` — `refreshFog`/`setFog` z opcjami `landReveal` i `riverRevealKeys`; czytaj przez `git show 07d2fbd72:gra/src/main.ts`): w webie jedno przejście `refreshFog` ustawia mgłę i opcje odsłonięcia. W Rust silnik już liczy `FogRevealDto` aktywnego fotela (`engine/src/domain/dto_bridge.rs` ok. `:8`, `:112`, `:163-190`), ale rozpoznanie wskazuje, że ramka `GetRenderFrame` (`engine/src/domain/render_frame.rs` ok. `:925-940`, `:1011`) go **nie przenosi**, a renderer ma `land_reveal: false` na sztywno (`renderer/src/view/frame.rs:372`, `FrameInputs`), przez co `FogReveal::from_dto` (`renderer/src/view/fog.rs:186`) i `merged_river_visible_in_fog` (`renderer/src/decor/river_lod.rs:316`) nie mają produkcyjnego wołającego. Numery linii z rozpoznania zweryfikuj w kodzie (nie wszystkie zmierzone).
Zadanie: przenieś `FogRevealDto` z silnika przez ramkę do `FrameInputs` tak, aby `land_reveal` i `river_reveal_keys` pochodziły z DTO (nie ze stałych), a `FogReveal::from_dto` miało produkcyjnego wołającego.

## DECYZJE TECHNICZNE (orkiestrator, wiążące; wpisane do REJESTR-RUST.md)
- D-403A-1: odsłanianie jedzie jako **pole opcjonalne `RenderLayersDto`** (jedno zapytanie na odświeżenie jak w pinie), addytywne: `#[serde(default, skip_serializing_if = "Option::is_none")]`, `CONTRACT_VERSION` zostaje 1 (precedens D-WIRB-5 / SAVE-LOAD). Nie dodawaj osobnego wołania `GetRenderLayers` po stronie klienta.
- D-403A-2: `fog_on = false` ⇒ brak odsłonięcia (`None`/`false`, pin `:13506`); po założeniu miasta albo bez stolicy `river_reveal_keys = None`; przed pierwszym miastem = `computeVisibleAt(start, radius)` (pin `:13074-13080`).
- D-403A-3: rysowanie wstęg rzek NIE wchodzi (`MapScene` ich nie ma) — odbiorca rzek to wyłącznie dane `FrameInputs.river_reveal_keys` i `river_fog_active`. Osobny temat RIVER-SCENE zapisz w raporcie jako dług.
- D-403A-4: przełączniki dev-UI F/M (`fogOn`, `revealAllLand`) poza zakresem (sesja ma je na stałe).

## ALLOWLISTA
`rust-port/view-model/src/root.rs` (i `map.rs` tylko jeśli konieczne), `rust-port/engine/src/domain/render_frame.rs`, `rust-port/engine/src/domain/dto_bridge.rs` (minimalnie, jeśli trzeba udostępnić dane), `rust-port/renderer/src/view/frame.rs`, `rust-port/renderer/src/view/fog.rs` (bez zmian logiki), testy: `rust-port/engine/tests/p4_364_render_frame.rs` (albo odpowiednik; sprawdź nazwę), `rust-port/client/tests/engine_bridge_renderer.rs`, testy renderera dla `frame.rs`, fikstury/typy TS `src-tauri/frontend-v2/src/viewmodel/types.ts` tylko jeśli dotknięte, raporty `dyspozycje/autobot/runs/R-RUSTPORT-P4-403A-FOG-REVEAL-FRAME-Q1/`. Zmiana innego pliku: uzasadnij w raporcie (jak w MARCH-RESZTA; Evaluator ocenia).

## KRYTERIA KOŃCA
1. `FogReveal::from_dto` ma produkcyjnego wołającego (`FrameInputs::from_dto*` bierze `land_reveal`/`river_reveal_keys` z ramki).
2. Test E2E (silnik→ramka→`FrameInputs`): sesja przed pierwszym miastem ⇒ `river_reveal_keys` = `computeVisibleAt(start, radius)`; po założeniu miasta lub bez stolicy ⇒ `None`; `fog_on = false` ⇒ `None`/`false`.
3. Mutanty (≥ 6, zabite lub jawnie równoważne): odrzucenie `reveal` w ramce, stałe `false`, zamiana `None`/`Some`, pominięcie `fog_on`, zła kolejność miasto/start, zła granica promienia.
4. JSON ramki z `reveal = None` bajt w bajt jak przed zmianą (fikstury bez zmian); `CONTRACT_VERSION` = 1.
5. Bramki zielone, w tym przerobione istniejące testy; raport zawiera dług RIVER-SCENE i zapis „wpięte ≠ widoczne" (GPU-EMBED poza zakresem).

## BRAMKI (EXIT 0)
engine: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, pełny `cargo test --all-targets --no-fail-fast`. view-model: fmt, clippy, test. renderer (gpu OFF): fmt, clippy, test — **bramka renderera wymaga ≥ 12 GB wolnego i jednego builda renderera naraz**. client: fmt, clippy, test (kompiluje renderer). Zmiana kontraktu ramki ⇒ trzy crate'y (engine, client, renderer). Własny `CARGO_TARGET_DIR` w scratchpadzie tematu, usuń po bramce; env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`. Build renderera przepisuje `renderer/Cargo.lock` (dług T1-LOCK) — cofnij przed commitem (`git checkout -- rust-port/renderer/Cargo.lock`).

## ZAKAZY
Brak push na `parity-v2`/deploy/integracji, brak `git add -A`, brak `#[ignore]`, brak osłabiania asercji, brak zmian w `gra/`, brak linii z nazwą modelu w commitach (dozwolona `Claude-Session:`). Commituj WIP wcześnie (backup orkiestratora robi push gałęzi `rust-port-wip/*`). Raporty: `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`, `03-final-control.md` w katalogu runu; kontrakt raportu z CLAUDE.md (STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH).

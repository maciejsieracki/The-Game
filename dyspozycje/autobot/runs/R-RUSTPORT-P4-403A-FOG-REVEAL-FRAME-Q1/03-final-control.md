# R-RUSTPORT-P4-403A-FOG-REVEAL-FRAME-Q1 — Final Control

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (port Rust, ramka silnika → renderer)
TEMAT: R-RUSTPORT-P4-403A-FOG-REVEAL-FRAME-Q1 (#408, część A tematu #403)
GOAL: `FogRevealDto` aktywnego fotela jedzie z silnika przez `GetRenderFrame` do `FrameInputs`. `land_reveal` i `river_reveal_keys` pochodzą z DTO, a `FogReveal::from_dto` ma produkcyjnego wołającego.
ZMIANY/COMMIT: oceniany stan `d8f0e478c` (gałąź `obrona/403A`). Łańcuch: `20310bee2` (WIP Operatora), `15a27fb7a` (Operator r1), `015d34c63` (Evaluator), `cc68f7681` i `d8f0e478c` (Obrona). Baza `d831a69a820f0ea4dd094178ae51d09aebc39686` = `origin/rust-port/parity-v2` (sprawdzone `rev-parse`; `merge-base --is-ancestor`: TAK). FC nie zmienia kodu; jedyny plik commitu FC to ten raport.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## 1. Allowlista i dyscyplina (sprawdzone przez FC: `git diff --stat d831a69a8 d8f0e478c`)

| Plik | Allowlista |
|---|---|
| `view-model/src/root.rs` | tak |
| `engine/src/domain/render_frame.rs` | tak |
| `renderer/src/view/frame.rs` | tak |
| `engine/tests/p4_364_render_frame.rs` | tak |
| `client/tests/engine_bridge_renderer.rs` | tak |
| `renderer/tests/view_frame.rs` | tak („testy renderera dla `frame.rs`”) |
| `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md` | tak |

- `dto_bridge.rs`, `fog.rs`, `map.rs`, `types.ts`, fikstury i `gra/` bez zmian. `renderer/Cargo.lock` poza commitem.
- `git diff --check`: czysto. `#[ignore]` w kodzie: 0 (dwa trafienia grep są w tekście raportów). Usunięte linie `assert`: 0.
- Wiadomości commitów: brak nazw modeli i brak `Co-Authored-By`.

## 2. Web najpierw (FC czytał `git show 07d2fbd72:gra/src/main.ts`)

- `:13485` `useFogRender = fogOn || revealAllLand`. `:13489-13494` gałąź mgły woła `setFog(vis, explored, { landReveal: revealAllLand, riverRevealKeys: startRevealKeysForRiverFog() })`. `:13505-13506` gałąź bez mgły woła `setFog(ALL_KEYS, ALL_KEYS)` bez opcji.
- `:13074-13080` `startRevealKeysForRiverFog`: `undefined`, gdy `!isAwaitingFirstPlayerCity() || meStartHex === null`, w przeciwnym razie `computeVisibleAt(start, startRevealRadius)`.
- Kod Rust odpowiada temu 1:1. `render_frame.rs:942` daje `reveal = layers.fog.fog_active.then(|| layers.fog.reveal.clone())`, a `fog_active` to `useFogRender`. `frame.rs` czyta `None` jako `NO_SET_FOG_OPTIONS` (`landReveal=false`, `riverRevealKeys=null`, jak `scene.ts:3531-3532`). Dalej idzie przez `FogReveal::from_dto`, który ma teraz produkcyjnego wołającego: `FrameInputs::from_dto_with_priority`, wołane z `client/src/lib.rs`.

## 3. Bramki odtworzone przez FC

Kod `d8f0e478c`. Własny `CARGO_TARGET_DIR` w scratchpadzie FC (usunięty po bramkach). Env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`. Bramki szły sekwencyjnie, bez równoległych buildów. Renderer z gpu OFF, start bramki renderera przy 12 GB wolnego.

| Bramka | EXIT | Wynik |
|---|---|---|
| `cargo fmt --check`: view-model, engine, renderer, client | 0/0/0/0 | |
| view-model clippy `--all-targets -D warnings` | 0 | |
| view-model test `--all-targets` | 0 | 119 passed, 0 failed |
| renderer clippy `--all-targets -D warnings` | 0 | |
| renderer test `--all-targets --no-fail-fast` | 0 | 757 passed, 0 failed |
| client clippy `--all-targets -D warnings` | 0 | |
| client test `--all-targets --no-fail-fast` | 0 | 47 passed, 0 failed |
| engine clippy `--all-targets -D warnings` | 0 | |
| engine PEŁNY `cargo test --all-targets --no-fail-fast` (w tle, 21:45 → 22:09) | 0 | 4344 passed, 0 failed, 1 ignored (ignorowany test jest starszy niż ten temat) |

Liczby zgadzają się z deklaracjami Obrony (engine 4344, client 47) i Evaluatora (renderer 757, view-model 119).

Niezależne mutanty FC, każdy cofnięty przez `git checkout`:
- `render_frame.rs`: `reveal = None` na sztywno (ramka gubi `reveal`) → engine `r403a` 6/6 FAIL. ZABITY.
- `frame.rs`: `land_reveal: false` na sztywno → renderer `reveal_land_comes_from_the_frame_and_reaches_the_scene` FAIL. ZABITY.

## 4. Kryteria końca

1. `FogReveal::from_dto` ma produkcyjnego wołającego (`FrameInputs::from_dto_with_priority`): **TAK**.
2. E2E silnik→ramka→`FrameInputs`: przed pierwszym miastem klucze = `computeVisibleAt` (promienie 2/3/8). Po mieście, przy samym wpisie ever-owned, bez startu i w scenariuszu startowym wynik to `None`. Przy `fog_on=false` jest `None`/`false`. Do tego dochodzi `revealAllLand` w obu stanach mgły (Obrona Z1). **TAK**.
3. Mutanty: M1–M9 (Operator) plus EV1–EV10 (Evaluator). EV1 i EV2 zabite po Obronie. EV6 i EV9 są jawnie równoważne. Do tego 2 mutanty FC. **TAK**.
4. `reveal=None` daje te same 14 kluczy JSON co przed zmianą, a pole jest pomijane przez `skip_serializing_if`, więc pozostałe bajty się nie zmieniają. Fikstury są bez zmian, `CONTRACT_VERSION` mostu = 1. **TAK**.
5. Bramki zielone (sekcja 3). Raport zawiera dług RIVER-SCENE i zapis „wpięte ≠ widoczne” (GPU-EMBED i #410 poza zakresem). **TAK**.

## 5. Orzeczenia zarzutów

| Zarzut | Orzeczenie | Uzasadnienie |
|---|---|---|
| U1 (Evaluator): brak testu `revealAllLand=true`, EV1/EV2 przeżywały | ODDAL (usunięty w Obronie) | Obrona dodała testy w engine i client. FC potwierdził, że przechodzą w pełnych bramkach. Obrona zgłosiła EV1/EV2 jako zabite. |
| U2: ramki z mgłą niosą nowy klucz `reveal`, a `deny_unknown_fields` u starego konsumenta | ODDAL (zgodne z D-403A-1) | Zmiana addytywna jest decyzją orkiestratora. Bajt w bajt obowiązuje tylko dla `None` (kryterium 4). Dług: typ TS `reveal?` w #411. |
| U3: produkcyjnie start zawsze ma stolicę, więc `river_reveal_keys` jest zawsze `None` | ODDAL dla 403A (dług poza zakresem) | Droga danych jest wpięta i przetestowana na stanie złożonym. Start bez miasta (osadnik) to osobny temat parytetu startu (START-OSADNIK), do rejestru przez orkiestratora. |
| U4: test odświeżania bez zmiany stanu, nieścisły komentarz | ODDAL (usunięty w Obronie) | Test przepisany: sekwencja oczekiwanie → miasto → oczekiwanie na tym samym kliencie. Komentarz poprawiony. |
| U5: `RenderViewDto::split/join` bez `reveal`, nowy `FrameError::Reveal` | ODDAL | `RenderViewDto` nie zasila `FrameInputs` w produkcji. Błąd jest typowany, nie ma cichego pominięcia. |
| Raport 01 z bramkami NIE_ZMIERZONO | ODDAL | Bramki zmierzyli niezależnie Evaluator, Obrona i FC (EXIT 0). |
| Odstępstwo procesowe Evaluatora (renderer przy 10,7 GB) | ODDAL (procesowe, nie dotyczy kodu) | FC uruchomił bramkę renderera przy 12 GB, bez równoległych buildów. |
| Obserwacja FC: D-403A-2 mówi „`fog_on=false` ⇒ brak odsłonięcia”, a kod bramkuje `fog_active = fogOn \|\| revealAllLand` | ODDAL | Tak jest w pinie (`:13485`), a zasada 9/11 to parytet z webem. Przy produkcyjnym `revealAllLand=false` (D-403A-4) wynik jest identyczny z D-403A-2. |
| Obserwacja FC: `riverRevealKeys` serializowane jako `null` (pin: `undefined`) | ODDAL | To istniejący typ `FogRevealDto` z view-model, poza zmianą 403A. Odbiorca czyta `null` i brak pola tak samo (`?? null`). |

NAPRAW: brak. DO DECYZJI CZŁOWIEKA: brak.

## 6. Długi do rejestru (orkiestrator)

- RIVER-SCENE: `MapScene` nie rysuje wstęg rzek. `FrameInputs.river_reveal_keys` i `river_fog_active` to na razie tylko dane.
- „Wpięte ≠ widoczne”: brak GPU-EMBED i kleju Tauri (#410). Na ekranie nic się nie zmienia.
- START-OSADNIK: start bez miasta jak w webie. Bez tego gałąź „przed pierwszym miastem” jest produkcyjnie nieosiągalna.
- #411 TS-TYPES: `reveal?: FogRevealDto` w typie ramki frontend-v2.

TESTY: sekcja 3.
BLOKADY: brak.
NASTĘPNY KROK: integracja orkiestratora `d8f0e478c` (plus ten raport) na `rust-port/parity-v2`. Przed FF sprawdzić `merge-base --is-ancestor` i `diff --stat` względem bazy, potem dopisać długi z sekcji 6 do `REJESTR-RUST.md`.

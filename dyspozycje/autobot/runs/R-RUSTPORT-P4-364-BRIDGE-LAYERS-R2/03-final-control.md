# R-RUSTPORT-P4-364-BRIDGE-LAYERS-R2: Final Control r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-364-BRIDGE-LAYERS-R2
GOAL: addytywna komenda mostu JSON `GetRenderLayers` (D-364-2), która woła producentów DTO-BRIDGE (`build_view_layers` = `build_fog_layers` + `build_territory_layers`) na stanie sesji. Bez `StateChanged`, `CONTRACT_VERSION` = 1, eksploracja kumulowana w sesji poza `EngineState`.
OCENIANY KOD: `aeccfefef` (Obrona r1: kod `648ea087c` + SHA w raporcie `201e70d15` + test U6). Gałąź `obrona-p4-364-bridge-layers-r2`. Raport Evaluatora: `fa97473fd` (gałąź `worktree-wf_e9b865d9-5db-2`, tylko plik raportu).
BAZA: `origin/rust-port/parity-v2` = `1508eda34d0262ac5a3f75b3bc419f2fa8211988`. Sprawdziłem przed oceną: parity się nie przesunęło. `git merge-base --is-ancestor 1508eda34 aeccfefef` = prawda. Zgodne z linią BAZA w dispatchu.

## ZMIANY/COMMIT

Ten etap dodaje tylko ten raport (commit na `fc-p4-364-bridge-layers-r2`, rodzic `aeccfefef`). Mutacje robiłem na kopii roboczej i za każdym razem cofałem je przez `git checkout -- src`. Na końcu `git status` był czysty.

## Allowlista (sprawdzona samodzielnie)

Wynik `git diff --stat 1508eda34 aeccfefef`:

| Plik | Zmiana | Ocena |
|---|---|---|
| `rust-port/engine/src/bridge.rs` | +62/- | allowlista |
| `rust-port/engine/src/domain/dto_bridge.rs` | +91/- | allowlista |
| `rust-port/engine/src/domain/playable.rs` | +142/-33 | allowlista. Zmiany: `PlayableFogSession`, prywatne pole `fog`, inicjalizacja w `new`/`from_state`, akcesory `fog_session`/`fog_session_parts`, mechaniczne `fog: game.fog.clone()` w literale testu. Wartość -33 to przeniesienie literału `PlayableState` do zmiennej, pola się nie zmieniły. |
| `rust-port/engine/tests/p4_364_bridge_layers.rs` | nowy, 481 linii | allowlista |
| `01-operator-r1.md`, `02a-obrona.md` | raporty | katalog runu |

- Plików spoza allowlisty nie ma. Renderer, view-model i `Cargo.lock` są nietknięte.
- `git diff --check`: czysto.
- Usuniętych asercji ani `#[ignore]` brak.
- Commity nie mają linii `Co-Authored-By` z nazwą modelu (#289).
- Root `tests/bridge_contract.rs`: potwierdziłem, że żaden manifest go nie kompiluje. Nie ma root `Cargo.toml`, a `src-tauri/Cargo.toml` nie ma `[[test]]` ani odwołania do tego pliku.

## Zgodność z D-364-2 i pinem `07d2fbd72` (sprawdzone na pinie)

- `fogOn = true`, `revealAllLand = false` (`main.ts:12801-12803`), `seedStartingFog` → `explored.clear()` (`:12868-12873`). Rust `for_new_game` ma to samo.
- `diffMap` (`main.ts:44370-44381`): Łatwy/Normalny/Trudny/easy/normal/hard oraz `?? 'normal'`. W Rust ten sam podział: wszystko spoza easy/hard daje Normal.
- `refreshFog` (`main.ts:13475-13513`) wywołuje `addExplored(exploredByHuman.get(ME())!, vis)`. Rust `session_render_layers` kumuluje eksplorację w `PlayableFogSession`. `EngineState` się nie zmienia (test c porównuje JSON stanu).
- Kontrakt: `EngineCommand::GetRenderLayers { seat: Option<u64> }` i `BridgeResult::RenderLayers { layers }`. Pola w camelCase: `fog`, `fogActive`, `reveal`, `territory`. `kind: "render_layers"`. `CONTRACT_VERSION` = 1. Dyspozytor obsługuje zapytanie przed `execute` i zwraca `events: Vec::new()`.
- `MockEngineAdapter` używa domyślnej implementacji, która odrzuca zapytanie (`engine_rejected`).

## TESTY (odtworzone samodzielnie na `aeccfefef`)

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (poza repo), `--offline`, pełny checkout (nie sparse). Przed pełną bramką wolne było 13 GB.

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` (engine) | EXIT 0 |
| `cargo clippy --offline --all-targets -- -D warnings` (engine) | EXIT 0 |
| `cargo test --offline --test p4_364_bridge_layers` | 13 passed / 0 failed (z pełnego przebiegu i przebiegów kontrolnych) |
| `cargo test --offline --all-targets --no-fail-fast` (w tle, `setsid nohup`, `EXIT=` w logu) | **EXIT=0**: 526 linii `test result`, łącznie **3928 passed, 0 failed, 1 ignored**, 0 linii `FAILED`. Liczba 3928 = 3927 (pomiar Evaluatora) + 1 nowy test z Obrony. |
| `src-tauri` `cargo check` | NIE_ZMIERZONO: offline brak crate `tauri` w indeksie (tak samo u Operatora i Evaluatora). `src-tauri/src/lib.rs` nie robi `match` na zmienionych enumach. |

### Mutacje (odtworzone samodzielnie)

| Mutacja | Zmiana | Wynik |
|---|---|---|
| (a) komenda ignoruje `seat` | `handle`: `render_layers(None)` | FAIL: 2 testy (`fotel_2_daje_inna_mgle_niz_domyslny`, `nieznany_fotel_jest_odrzucony_bez_zmiany_stanu`) |
| (b) komenda emituje `StateChanged` | `handle`: `events: vec![StateChanged{..}]` | FAIL: 4 testy |
| (c) zapytanie nie kumuluje eksploracji | `dto_bridge`: brak zapisu `fog.explored_by_human = explored` | FAIL: 3 testy (`zapytanie_kumuluje_eksploracje_w_sesji`, `fotel_2_...`, `execute_get_render_layers_bezposrednio_...`) |
| (d) `CONTRACT_VERSION = 2` | `bridge.rs:14` | FAIL: 3 testy |

Każda z czterech mutacji wymaganych w kryteriach końca daje FAIL. Po bramkach usunąłem `CARGO_TARGET_DIR`. Po sprzątnięciu wolne jest 13 GB.

## ORZECZENIA (każdy zarzut i uwaga)

| # | Zarzut / uwaga (Evaluator r1, Obrona) | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| E-1 / U1 | `from_state` zeruje mgłę sesji, a web zapisuje i wczytuje `exploredByHuman` (`main.ts:37229-37239`, `:46394`) | **ODDAL** (dług do rejestru) | D-364-2 wprost zakazuje wpisywania `ExploredByHuman` do `EngineState`, zapisu i snapshotu. Trwałość mgły to temat zapisu i wczytania (P6.20–P6.22). Orkiestrator wpisuje dług `DŁUG-364-FOG-SAVE` do `REJESTR-RUST.md`. |
| E-2 / U2 | Heks startu = stolica zamiast `startPlacements.playerStart` | **ODDAL** (dług do rejestru) | W pionowym wycinku stolica istnieje od tury 1, więc przy nowej grze wynik jest ten sam. Rozjazd pojawi się dopiero z fazą „czeka na pierwsze miasto”. Wpis do rejestru jako D-364-R2-3. |
| E-3 / U3 | `seat: Some(id)` przyjmuje fotel AI, a web `ME()` jest zawsze ludzki | **ODDAL** (dług do rejestru) | Most nie ma jeszcze hot-seatu, a test (b) z dispatchu wymaga drugiego fotela. Zaostrzenie do `is_human` należy do tematu hot-seat. Wpis jako D-364-R2-4. |
| E-4 / U4 | Root `tests/bridge_contract.rs` ma niewyczerpujący `match` | **ODDAL** (osobny temat porządkowy) | Potwierdziłem, że plik nie jest kompilowany. Dispatch pozwala zmieniać pliki spoza allowlisty tylko wtedy, gdy wymaga tego kompilacja, a tu nie wymaga. |
| E-5 / U5b | `#[allow(clippy::large_enum_variant)]` na `BridgeResult` | **ODDAL** | Opakowanie `State` w `Box` zmieniłoby wzorzec u konsumentów, więc zmiana nie byłaby addytywna. Uzasadnienie jest w komentarzu. Clippy przechodzi. |
| E-6 / U5/U6 | Ścieżka `CivEngineAdapter::execute(GetRenderLayers)` nie ma testu | **ODDAL** (usunięte w Obronie) | Obrona dodała test `execute_get_render_layers_bezposrednio_kumuluje_i_zwraca_niezmieniony_stan`. Mutacja (c) potwierdza, że ten test wykrywa brak kumulacji. |
| E-7 | `src-tauri` `cargo check` NIE_ZMIERZONO | **ODDAL** | Ograniczenie środowiska offline, nie kodu. `lib.rs` nie robi `match` na `EngineCommand`/`BridgeResult`. Do pomiaru przy integracji, gdy będzie dostęp do sieci. |
| Obrona: pełny test NIE_ZMIERZONO po dodaniu testu | | **ODDAL** (zmierzone przez FC) | Pełny przebieg FC na `aeccfefef`: EXIT=0, 3928/0/1. |

NAPRAW: 0. DO DECYZJI CZŁOWIEKA: 0. Wszystkie zarzuty zostały oddalone. Uwagi to długi, które orkiestrator wpisuje do rejestru.

## Uwagi FC (drobne, bez blokady)

- `session_render_layers` dla odrzuconego zapytania (`UnknownSeat`) wraca przed `mem::take`, więc stan sesji się nie zmienia (test to sprawdza). Gdy błąd zgłosi `build_view_layers`, eksploracja jest odkładana z powrotem, a wpis fotela może dostać pusty zbiór. To zachowanie neutralne, zgodne z `switchActiveHuman` KROK 0.

## Do rejestru orkiestratora (`REJESTR-RUST.md`)

D-364-R2-1…6 z raportu Operatora oraz długi: DŁUG-364-FOG-SAVE (E-1), D-364-R2-3 heks startu (E-2), D-364-R2-4 walidacja fotela (E-3), PORZĄDEK-BRIDGE-CONTRACT-ROOT (E-4), pomiar `src-tauri cargo check` z dostępem do sieci (E-7).

## BLOKADY

Brak.

## RUNDY

1/5

## NASTĘPNY KROK

Integracja orkiestratora: merge `aeccfefef` (z tym raportem FC) na `rust-port/parity-v2`, potem wpisy w rejestrze.

## DEPLOY/PUSH

NIE WYKONANO.

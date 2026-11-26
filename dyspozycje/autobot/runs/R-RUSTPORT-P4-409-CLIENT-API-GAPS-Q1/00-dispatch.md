# R-RUSTPORT-P4-409-CLIENT-API-GAPS-Q1 — luki API klienta: publiczne wycofanie z bitwy oblężniczej i odświeżenie po wczytaniu gry (zadanie #409, część B tematu #403)

STATUS: dispatch orkiestratora. Opus, wszystkie etapy Opus (3D/grafika Rust). Podstawa: `dyspozycje/rust-port/P4-403-DTO-BRIDGE-WIRE-ROZPOZNANIE.md` §2 temat 403-B i wpis „FQ-SPEED-BRIDGE … ZINTEGROWANE" w `REJESTR-RUST.md` (długi U5/U6).
BAZA: `origin/rust-port/parity-v2` = `de4eabfe6e1cf7764b21d5ba9e4e2759ddea8ff2` w dniu dispatchu (wpisz faktyczny SHA: `git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`). #407 jest już zintegrowany (zmieniał ten sam `client/src/lib.rs`), więc brak kolizji.

## GOAL
NAJPIERW web (pin `07d2fbd72`, czytaj przez `git show 07d2fbd72:gra/src/...`): (a) przycisk „Wycofaj się z bitwy" (`battleScene.ts` ok. `:3359`, `dispose()` + `onCancel` → `setMood('mapa')`, `main.ts` ok. `:37023`) widoczny przez całą bitwę — w Rust most ma `AbortSiegeBattle` (D-1I6D-3), a klient ma tylko prywatne `abort_started_battle` (`client/src/lib.rs` ok. `:1463`); (b) wczytanie gry (`restoreGameFromSave`, `main.ts` ok. `:46225`, końcówka `:46135-46160`: `syncUnitsRender`, `cityRenderer.sync`, `refreshFog`, `updateHud`, … ) przebudowuje całą scenę mapy — w Rust `EngineCommand::LoadGame { save }` emituje `StateChanged`, ale klient po `LoadGame` nie odświeża mapy (`GetRenderMap`) i ramki; testy klienta nie mają scenariusza zapis → odczyt. Numery linii zweryfikuj w kodzie.
Zadanie: (1) publiczne `abort_siege_battle` w kliencie (przez `AbortSiegeBattle`; wyjście z UI bitwy jak w `Aborted`: stan gry bez zmian, bez `StateChanged`, błędy `noActiveBattle`/`abortNotAllowed` jawne); (2) po udanym `LoadGame` klient odświeża dane sesji jak po `CreateSession` (`GetRenderMap` raz + `GetRenderFrame`; reguła D-371-4) — decyzja techniczna: osobna metoda `load_game(save)` / `on_game_loaded` w kliencie, a odrzucone zapisanie/wczytanie nie zmienia bieżącej sesji klienta; (3) testy E2E silnik→most→klient: zapis → wczytanie (mapa i ramka odpowiadają wczytanemu stanowi, licznik wywołań `GetRenderMap`=1 na wczytanie), wycofanie z bitwy (przed końcem walki, po `Finish` ⇒ `abortNotAllowed`, bez bitwy ⇒ `noActiveBattle`), wczytanie zapisu odrzuconego (stara sesja nietknięta).

## DECYZJE TECHNICZNE (orkiestrator, wiążące; wpisane do REJESTR-RUST.md)
- D-409-1: zmiany tylko w `client` (API i testy); silnik/most bez zmian, chyba że test ujawni lukę (wtedy minimalna poprawka z uzasadnieniem w raporcie).
- D-409-2: `load_game` nie przyjmuje zapisu w trakcie bitwy oblężniczej (silnik odrzuca zapis w trakcie bitwy, DL-SLB-1; wczytanie w trakcie bitwy: zachowanie wg pinu — jeśli pin nie rozstrzyga, klient najpierw zamyka bitwę lokalnie i wpisuje decyzję do raportu).
- D-409-3: bez zmian gameplay; nie dotykaj kontraktu mostu (`CONTRACT_VERSION` = 1).
- D-409-4: nie wchodzą: sterownik zegara bitwy i klej Tauri (#410), typy TS (#411), U5 (resynchronizacja po błędzie prędkości — #410).

## ALLOWLISTA
`rust-port/client/src/lib.rs`, `rust-port/client/tests/engine_bridge_renderer.rs`, `rust-port/client/tests/siege_battle_client.rs`, ewentualnie nowy plik testów klienta (np. `rust-port/client/tests/save_load_client.rs`), raporty w katalogu runu. Zmiana innego pliku: uzasadnij w raporcie (Evaluator ocenia).

## KRYTERIA KOŃCA
1. Publiczne `abort_siege_battle` i `load_game` (nazwy do uzgodnienia z istniejącym stylem API) z dokumentacją i testami.
2. Testy E2E z licznikami wywołań źródła (`GetRenderMap`/`GetRenderFrame`/`AbortSiegeBattle`/`LoadGame`) — w tym negatywne: brak bitwy, po `Finish`, zapis odrzucony, ramka po wczytaniu = ramka stanu wczytanego (nie poprzedniego).
3. Mutanty (≥ 6, zabite lub jawnie równoważne): brak odświeżenia mapy po wczytaniu, brak ramki, zła kolejność (ramka przed mapą), wczytanie przy błędzie zmienia sesję, abort bez zamknięcia UI bitwy, abort po końcu bitwy akceptowany, itp.
4. Bez regresji istniejących testów klienta (51) i renderera/silnika.

## BRAMKI (EXIT 0)
client: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, pełny `cargo test --all-targets --no-fail-fast` (klient kompiluje renderer i silnik przez `#[path]`). Jeśli dotkniesz silnika/renderera: ich bramki też (zmiana kontraktu ⇒ trzy crate'y). Wymagane ≥ 8 GB wolnego, jeden build na raz. Własny `CARGO_TARGET_DIR` w scratchpadzie tematu, usuń po bramce; env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`. Build renderera przepisuje `renderer/Cargo.lock` (T1-LOCK) — cofnij przed commitem. Nie zostawiaj procesów cargo w tle po zakończeniu rundy (osierocone testy blokowały dysk w poprzednich tematach).

## ZAKAZY
Brak push na `parity-v2`/deploy/integracji, brak `git add -A`, brak `#[ignore]`, brak osłabiania asercji, brak zmian w `gra/`, brak linii z nazwą modelu w commitach (dozwolona `Claude-Session:`). Commituj WIP wcześnie. Raporty: `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`, `03-final-control.md` w katalogu runu; kontrakt raportu z CLAUDE.md (STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH).

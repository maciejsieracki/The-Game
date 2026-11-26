# R-RUSTPORT-P4-411-TS-TYPES-Q1 — typy TS komend i odpowiedzi renderowania/bitwy w frontend-v2 (zadanie #411, część D #403; BEZ cargo)

STATUS: dispatch orkiestratora. Opus, wszystkie etapy Opus (3D/grafika). Podstawa: `dyspozycje/rust-port/P4-403-DTO-BRIDGE-WIRE-ROZPOZNANIE.md` §2 temat 403-D oraz wpisy „FOG-REVEAL-FRAME", „FQ-SPEED-BRIDGE", „CLIENT-API-GAPS … ZINTEGROWANE" w `REJESTR-RUST.md`.
BAZA: `origin/rust-port/parity-v2` = `3f98dd284229f975e373b9c3be7a0d28232089d3` w dniu dispatchu (wpisz faktyczny SHA: `git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`).

## GOAL
Frontend `src-tauri/frontend-v2` działa dziś na atrapie MOCK (`src/controller/transport.ts`) i jego typy komend (`src/controller/commands.ts`, ok. `:32-37`) nie obejmują komend mostu dodanych w silniku: `GetRenderMap`, `GetRenderFrame { seat, ui }`, komend bitwy oblężniczej (`StartSiegeStorm`, `StepSiegeBattle { wallMs }`, `SkipSiegeBattle`, `FinishSiegeBattle`, `AbortSiegeBattle`, `SetSiegeBattleSpeed { idx, clamp }`), `SaveGame`, `LoadGame { save }`, ani odpowiedzi (`siegeBattle`, `speedIdx`/`speedMul`, `saveGame`, `RenderLayersDto.reveal?`). Zadanie: dodaj TYPY TS (i wyłącznie typy + ewentualnie cienkie funkcje budujące komendy) odzwierciedlające kontrakt mostu `rust-port/engine/src/bridge.rs` (`EngineCommand`, odpowiedzi `BridgeResult`/`siegeBattle`) oraz view-model `rust-port/view-model/src` (`RenderLayersDto` z opcjonalnym `reveal?: FogRevealDto`, `FogRevealDto`): nazwy pól jak w JSON (serde `camelCase`), wymagane vs opcjonalne zgodnie z `skip_serializing_if`.

## DECYZJE TECHNICZNE (orkiestrator, wiążące; wpisane do REJESTR-RUST.md)
- D-411-1: tylko typy i budowniczowie komend — bez logiki gry, bez wołania Tauri, bez zmiany frontu serwowanego przez okno (`frontendDist` zostaje; przełączenie to #410).
- D-411-2: pole `idx` komendy `SetSiegeBattleSpeed` to liczba CAŁKOWITA (`i64` w Rust odrzuca `3.0`) — typ/budowniczy wymusza `Math.trunc`/walidację całkowitości; `CONTRACT_VERSION` = 1.
- D-411-3: `RenderLayersDto.reveal` opcjonalne (`undefined` gdy brak odsłonięcia — `deny_unknown_fields` w Rust: nie wysyłaj nieznanych pól).
- D-411-4: weryfikacja bez cargo: `tsc --noEmit` (typecheck) i, jeśli istnieją, testy jednostkowe frontendu; jeśli `npm ci` wymaga sieci/miejsca poza budżetem (≥ 4 GB wolnego i ok. 1 GB na `node_modules`) — zapisz to w raporcie i zweryfikuj typy odpowiednio dostępnym `tsc`; usuń `node_modules` po bramce.

## ALLOWLISTA
`src-tauri/frontend-v2/src/controller/commands.ts`, `src-tauri/frontend-v2/src/viewmodel/types.ts` (lub odpowiednik typów ramki/mapy — sprawdź nazwę), ewentualnie nowy plik typów w `src-tauri/frontend-v2/src/controller/` (np. `bridgeTypes.ts`) i jego test typów, raporty w katalogu runu. NIE zmieniaj `src-tauri/src`, `src-tauri/frontend` (stary), `rust-port/*`, `gra/`.

## KRYTERIA KOŃCA
1. Typy komend i odpowiedzi pokrywają wszystkie warianty `EngineCommand` oraz pola odpowiedzi `siegeBattle`/`saveGame`/`speedIdx`/`speedMul`/`reveal`; tabela „wariant Rust → typ TS" w raporcie (odczytana z kodu, bez zgadywania).
2. Test zgodności typów z JSON silnika: przykładowe odpowiedzi/komendy zserializowane przez silnik (weź z istniejących testów Rust albo wygeneruj `cargo`-wolnie z fikstur w repo) przechodzą przez typy (np. `satisfies`/przypisania w teście typów); mutanty typów (usunięcie wymaganego pola, zmiana opcjonalności) wywalają `tsc`.
3. `tsc --noEmit` bez błędów na całym `frontend-v2`; brak zmian zachowania runtime (atrapa MOCK działa jak przed).
4. Raport zawiera: pokrycie wariantów, decyzję o `idx`, stan weryfikacji (czy `npm ci` się powiodło), i zapis, że przełączenie okna na `frontend-v2` i klej Tauri to #410.

## BRAMKI
Brak cargo. `npm ci` + `tsc --noEmit` (+ testy frontendu, jeśli są) w `src-tauri/frontend-v2`; wymagane ≥ 4 GB wolnego przed `npm ci` (dysk współdzielony z równoległym buildem Rust — jeśli < 4 GB, wstrzymaj i zapisz BLOCK INFRA); po bramce usuń `node_modules`.

## ZAKAZY
Brak push na `parity-v2`/deploy/integracji, brak `git add -A` (uwaga na `node_modules` i `package-lock.json` — nie commituj zmian lock bez powodu), brak `#[ignore]`/`@ts-ignore` jako obejścia błędów typów, brak osłabiania asercji, brak zmian w `gra/`, brak linii z nazwą modelu w commitach (dozwolona `Claude-Session:`). Raporty: `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`, `03-final-control.md` w katalogu runu; kontrakt raportu z CLAUDE.md.

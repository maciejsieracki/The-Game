# 02a-obrona: R-RUSTPORT-P6-K5-WYLOM-WIEZE-Q1 (#98 K5-LOOP-WYLOM, zakres 1-3)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5-WYLOM-WIEZE-Q1
GOAL: odpowiedź Operatora (Obrona r1, Haiku 5.5) na 7 zarzutów Evaluatora r1 (`02-evaluator.md`, commit 1fd555853): każdy zarzut ma werdykt PRZYJMUJĘ albo ODRZUCAM z dowodem z pinu `07d2fbd72` lub z bazy `d5a52a980`.
BAZA: `d5a52a980`; oceniany kod Operatora `1849d5eea`; worktree odtworzony na `1fd555853` (commit Evaluatora), poprawki ponad nim.
ZMIANY/COMMIT: (1) commit kodu Obrony `426a95e40` (zob. sekcja COMMITY); (2) ten plik, commit po `426a95e40` (SHA w odpowiedzi orkiestratora). Brak push, brak integracji.
DEPLOY/PUSH: NIE WYKONANO.

## ZARZUTY I ODPOWIEDZI

### Zarzut 1 [ŚREDNI]: predykat "zburzona <=> brak klucza" a replay — PRZYJMUJĘ

Dowód z pinu `07d2fbd72` (potwierdzony na świeżo przez `git show`):
- `_resetSiegeForReplay` (`battleScene.ts:10518-10531`): `wallEverBreached = false` (`:10522`), `wallTileHp.clear()` (`:10524`), `wallTileHp.set(r, WALL_TILE_HP)` dla rzędów poza bramą (`:10529`). Brak jakiegokolwiek zapisu do `siegeTowers`.
- Zapisy `destroyed` w pinie: tylko `:4189` (init w `_placeSiegeTowers`), `:4197` (`_destroyTowerAtRow`); odczyty `:4195, :4215, :4224/:4227, :7933`.
- `siegeTowers` jest przebudowywane tylko w `_placeSiegeTowers` (`:4158-4159`), wołanym tylko z `_placeSiegeWall` (`:4136`), a `_placeSiegeWall` tylko z `:3480` (start bitwy). `_replayBattle` (`:10572-10600`) woła `_placeUnits` (`:10589`), nie `_placeSiegeWall`, więc przy replayu `destroyed` zostaje `true`, a kafle wracają.

Wniosek: zarzut jest trafny. Uzasadnienie Operatora z `01-operator-impl.md` (decyzja 1) było błędne w punkcie "kafel nie wraca": pin sam przywraca kafle w `:10529`. Poprawki:
- Komentarz `breach_wall_tile` (`rust-port/engine/src/domain/siege_tactics_breach.rs`, doc comment) przepisany: predykat obowiązuje "w jednej bitwie (bez replayu)", zdanie "kafel nie wraca" usunięte, wyjątek replay opisany z numerami linii.
- Wpis NIE_ZMIERZONO/BRAK-1 poniżej.
- Kod produkcyjny nie zmieniony: replay nie jest portowany (`siege_tactics_breach.rs:25`), więc brak regresji dziś.

### Zarzut 2 [NISKI-ŚREDNI]: odstępstwo od dispatchu (`destroyed` nie jest polem) — ODRZUCAM żądanie zmiany, PRZYJMUJĘ odstępstwo jako jawne

Odstępstwo jest prawdziwe i zostaje jawnie opisane (decyzja 1 w `01-operator-impl.md`, ten plik). Dowód, dlaczego pole nie wchodzi:
- Literały `WallState { .. }` bez `..` poza allowlistą: `rust-port/engine/tests/p6_siege_tactics_breach.rs` (`:64`, `:393`, `:411`, `:429`, `:448`, `:477`, `:493`; część literałów z `..s`).
- Literały `SiegeEnv { .. }` poza allowlistą: `tests/p6_siege_tactics_loop.rs:148`, `tests/p6_siege_tactics_loop_resume.rs:149`, `tests/p6_tower_target_wiring.rs:228`, `tests/p6_wieze_2b1.rs:77`, `tests/p6_wieze_2b2.rs:106`.
Dodanie pola łamie kompilację tych plików, a dispatch zakazuje zmian poza allowlistą (FAIL). Równoważność predykatu w jednej bitwie jest sprawdzana w teście (`breach_wall_tile_usuwa_kafel_i_zburza_wieze_w_tym_samym_wywolaniu` i snapshot `destroyed` liczony dwiema drogami w `run_rust`), a mutacja usunięcia `wall_tile_hp.remove` daje FAIL (sekcja TESTY). Decyzja o równoważnym kryterium zostaje dla FC.

### Zarzut 3 [NISKI]: `sync_wall_state` jako nowa publiczna funkcja w `siege_tactics_loop.rs` — PRZYJMUJĘ

Poprawka: funkcja usunięta z kodu produkcyjnego, wraz z importem `WallState` w `siege_tactics_loop.rs`. Most przeniesiony do funkcji testowej `sync_loop_from_wall` w `rust-port/engine/tests/p6_siege_wylom_tower.rs` (pola `SiegeEnv` są `pub`, więc test ustawia `wall_tile_rows` i `wall_ever_breached` bezpośrednio). Efekt:
- `siege_tactics_loop.rs`: zmiany tylko w komentarzach `plan_tower_shots` i `tower_shoot` (allowlista: planowanie i `tower_shoot`), bez nowego API.
- `siege_tactics_breach.rs`: zmiana tylko w komentarzu `breach_wall_tile`.
- Brak nowego produkcyjnego API bez wołającego (wiring należy do #113, który zaprojektuje własny most).

### Zarzut 4 [NISKI]: generator `.mjs` i `vectors.json` poza literalną allowlistą — ODRZUCAM wycofanie, PRZYJMUJĘ zgłoszenie do FC

Dowód precedensu w bazie `d5a52a980` (`git ls-tree`): `rust-port/engine/tests/p6_tower_target_wiring_gen.mjs` i `rust-port/engine/tests/p6_tower_target_wiring_vectors/vectors.json` istnieją w tej samej roli (generator wektorów z pinu obok testu `p6_tower_target_wiring.rs`). Kryterium 2 dispatchu wymaga "wektorów pinu, nie ręcznych liczb": bez generatora i pliku wektorów test byłby ręczny. Nazwy `p6_siege_wylom_gen.mjs` i `p6_siege_wylom_vectors/` należą do wzorca `p6_siege_wylom_*`. Rekomendacja Operatora: zatwierdzić jako pliki pomocnicze testu z adnotacją w FC.

### Zarzut 5 [NISKI]: `sync` przypisuje `wall_ever_breached` 1:1 (może obniżyć flagę) i nadpisuje `wall_tile_rows` — PRZYJMUJĘ (usunięte przez poprawkę zarzutu 3)

Most nie istnieje już w kodzie produkcyjnym, więc obniżenie flagi starszym stanem nie może wejść do produkcji. Wybrano przypisanie 1:1 (nie `|=`), bo test porównuje z czystą funkcją `breach_wall_tile`, a semantyka `|=` ukryłaby różnice. Ograniczenie zostaje zapisane: w pinie `wallEverBreached` jest monotoniczna poza replayem (`:10522`), więc wiring #113 nie może przekazywać starszego stanu; wpis BRAK-2 poniżej. Dokumentacja funkcji testowej `sync_loop_from_wall` zawiera tę uwagę.

### Zarzut 6 [NISKI, pokrycie]: brakujące wektory — ODRZUCAM w tym temacie, zapisuję jako BRAK-3

Dispatch zawęża temat: "ZAKRES (tylko to)" (pkt 1-3) i kryteria 1-5, które są spełnione. Evaluator sam stwierdza, że żaden z braków nie jest w zakresie 1-3. Dopisanie scenariuszy (a), (b), (c) wymaga rozszerzenia generatora, regeneracji wektorów i nowych testów, czyli poszerzenia tematu bez decyzji orkiestratora. Braki zapisane jako BRAK-3 do osobnego tematu. Wektor (f) (trafienie w locie po wyłomie) był już w NIE_ZMIERZONO z `01-operator-impl.md`.

### Zarzut 7 [INFORMACYJNY]: sufit tur wyłączony w teście — PRZYJMUJĘ (bez zmian)

Już w NIE_ZMIERZONO z `01-operator-impl.md` (decyzja 5, `no_breach_cap: 1_000_000`). Bez zmian.

## KOREKTA REJESTRU NIE_ZMIERZONO/BRAK (uzupełnia `01-operator-impl.md`)

- NIE_ZMIERZONO/BRAK-1 (replay, zarzut 1): `_resetSiegeForReplay` (`battleScene.ts:10518-10531`) przywraca kafle (`:10529`), `_replayBattle` nie przebudowuje `siegeTowers`, więc wieża zburzona przed replayem zostaje zburzona (`destroyed` = true). Rust bez jawnego stanu `destroyed` tego nie odtworzy. Replay nieportowany. Przy portowaniu replayu wymagany jawny stan `destroyed` albo odtworzenie reguły pinu.
- NIE_ZMIERZONO/BRAK-2 (wiring #113, zarzut 5): most `WallState` -> `SiegeEnv` (`wall_tile_rows`, `wall_ever_breached`) nie istnieje w produkcji. Przy wiringu wołający musi przekazywać najnowszy stan, a `wall_ever_breached` nie może być obniżane (pin `:10522` jest jedynym miejscem, gdzie flaga wraca do `false`, poza replayem jest monotoniczna).
- NIE_ZMIERZONO/BRAK-3 (pokrycie, zarzut 6): brak wektorów dla (a) wyłomu na wierszu bez wieży, (b) zburzenia wszystkich wież (pusta salwa), (c) dwóch wyłomów po sobie, (e) ścieżki `_attackWallTile` (`battleScene.ts:7555-7565`, poza zakresem, wiring #113/#98 finał), (f) trafienia w locie po wyłomie (już w NIE_ZMIERZONO z 01).
- Korekta decyzji 1 i 2 z `01-operator-impl.md`: decyzja 1 w punkcie "kafel nie wraca" jest błędna (zob. zarzut 1); decyzja 2 (`sync_wall_state` w `siege_tactics_loop.rs`) jest zastąpiona przez funkcję testową (zarzut 3).

## TESTY (env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo w scratchpad)

- `cargo fmt --check` (rust-port/engine): EXIT 0.
- `cargo clippy --all-targets -- -D warnings` (rust-port/engine): EXIT 0.
- `cargo test --test p6_siege_wylom_tower`: 6 passed, 0 failed, 0 ignored (po przeniesieniu mostu do testu).
- `cargo test --all-targets` (pełny): EXIT 0; suma 3421 passed, 0 failed, 1 ignored (pre-istniejacy e2e::dump_tick1_econ_for_web_generator, nie z tego tematu), 473 binarek
- Mutacja M1 (usunięcie `n.wall_tile_hp.remove(&wall_row);` w `breach_wall_tile`): FAIL w 3 testach z 6 (breach_wall_tile_usuwa_kafel_i_zburza_wieze_w_tym_samym_wywolaniu, wylom_po_zaplanowaniu_salwy_wieza_nie_strzela_przed_strzalem, wylom_przed_kolejna_salwa_pomija_zniszczona_wieze); plik przywrócony z kopii, `cmp` identyczny.
- `#[ignore]` w nowych plikach: 0; asercje nie osłabione.

## COMMITY

- `426a95e40`: poprawki kodu i testu (breach.rs komentarz, loop.rs bez mostu, p6_siege_wylom_tower.rs funkcja `sync_loop_from_wall`). Allowlista: `siege_tactics_loop.rs` (komentarze), `siege_tactics_breach.rs` (komentarz), `tests/p6_siege_wylom_tower.rs`. Bez `Cargo.lock`.
- `(commit tego pliku)` (commit tego pliku, podany w odpowiedzi orkiestratora): ten plik (`dyspozycje/autobot/runs/R-RUSTPORT-P6-K5-WYLOM-WIEZE-Q1/02a-obrona.md`).

## DECYZJA DLA FC (do oceny, nie rozstrzygane tutaj)

1. Zarzut 2: odstępstwo od `destroyed` jako pola (wyprowadzany predykat). Operator rekomenduje zatwierdzenie z NIE_ZMIERZONO/BRAK-1.
2. Zarzut 4: generator `.mjs` i `vectors.json` jako pliki pomocnicze testu. Operator rekomenduje zatwierdzenie z adnotacją (precedens `p6_tower_target_wiring_gen.mjs`).

## RUNDY

Obrona Operatora r1 (po Evaluatorze r1; licznik rund tematu w dispatchu nie jest tu rozstrzygany).

## NASTĘPNY KROK

Final Control (SONNET 5.5): zweryfikować `426a95e40` i `(commit tego pliku)` (allowlista, bramki), decyzje 1-2 powyżej i BRAK-1..3. Operator sugeruje, że Evaluator r2 nie jest konieczny: zarzuty 1, 3 i 5 zostały usunięte kodem albo komentarzem, a zarzuty 2, 4, 6 i 7 są ocenami do decyzji FC. Ostateczna ocena należy do orkiestratora.

## DEPLOY/PUSH

NIE WYKONANO. Commity lokalne na gałęzi worktree (detached, bazowana na `1fd555853`), bez push na `rust-port/parity-v2`, bez integracji.

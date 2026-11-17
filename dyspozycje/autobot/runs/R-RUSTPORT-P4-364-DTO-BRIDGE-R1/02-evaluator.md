# 02-evaluator — R-RUSTPORT-P4-364-DTO-BRIDGE-R1 (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-364-DTO-BRIDGE-R1
GOAL: warstwa engine `domain::dto_bridge`: z PlayableState i wejść fotela liczy FogViewDto/fog_active, FogRevealDto i TerritoryRangesDto aktywnego fotela ME(), z wektorami pinu 07d2fbd72 i testem równoważności portów.
ZMIANY/COMMIT: oceniany kod 13ed6c880 (raport operatora 7ceb27096), baza e2a2c4e2f (ancestor potwierdzony `git merge-base --is-ancestor`). Ten raport: jedyny plik zmieniony przez Evaluatora.

## Allowlista
`git diff --stat e2a2c4e2f..7ceb27096` daje 6 plików: dto_bridge.rs (nowy), domain/mod.rs (+1 linia), tests/p4_364_dto_bridge.rs, p4_364_dto_bridge_gen.mjs, p4_364_dto_bridge_vectors/vectors.json, 01-operator-r1.md. Wszystkie są w allowliście. Brak zmian w bridge.rs, EngineCommand/BridgeResult, view-model, rendererze, gra/. Cargo.lock nie jest commitowany.

## Bramki odtworzone niezależnie
Środowisko: CARGO_INCREMENTAL=0, CARGO_PROFILE_DEV_DEBUG=0, CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR w scratchpadzie (usunięty po bramkach). Katalog: rust-port/engine.
- `cargo fmt --check`: EXIT 0.
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `cargo test --test p4_364_dto_bridge`: EXIT 0, 5/5 ok.
- `cargo test --lib`: EXIT 0, 131/131 ok.
- `cargo test --all-targets --no-fail-fast`: EXIT 0. 525 binarek z „test result: ok”, łącznie 4038 testów, 0 FAILED. Operator nie zmierzył tej bramki, teraz jest zmierzona.
- `node rust-port/engine/tests/p4_364_dto_bridge_gen.mjs --check` (Node v22.23.4): EXIT 0, „OK: 11 przypadkow zgodnych”.
- `#[ignore]` w nowym teście: brak (grep).

## Mutacje odtworzone przez Evaluatora (każda cofnięta, cmp z oryginałem OK)
- (c) `reveal_all_land: inputs.reveal_all_land` → `false`: FAIL (asercja landReveal, :463).
- (b') `start_reveal_keys_for_river_fog`: `me = PlayerId::new(0)` zamiast `inputs.active_seat`: FAIL (riverRevealKeys, :472).
- (f, własna) pominięty warunek `isAwaitingFirstPlayerCity` w kluczach rzek: FAIL (:472).
- (g, własna) filtr terytorium zawsze `fog_on: true`: FAIL (2 testy: wektory pinu :483 i F2 przez PlayableState :661).
Mutacji (a) operatora nie powtarzałem. Opis operatora (PlayableState nie ma krawędzi rzek, więc wynik Some([])) jest wiarygodny, bo klucze są porównywane z listą z pinu.

## Weryfikacja zgodności z pinem (git show 07d2fbd72:gra/src/main.ts)
- `refreshFog` :13475-13513: `useFogRender = fogOn || revealAllLand`. Przy włączonym renderze mgły: `setFog(vis, explored, {landReveal: revealAllLand, riverRevealKeys: startRevealKeysForRiverFog()})`, w przeciwnym razie `setFog(ALL_KEYS, ALL_KEYS)` bez opcji. Gałęzie w build_fog_layers są zgodne.
- `startRevealKeysForRiverFog` :13074-13080: `undefined`, gdy `!awaiting || start == null`, w przeciwnym razie `computeVisibleAt(start, startRevealRadius)`. Kolejność warunków w Rust jest inna, ale wynik ten sam.
- Filtr terytorium :15596-15601: `isMe`, potem `!fogOn`, potem `vis ∪ explored`. D-BR-2 (fog_on zamiast fog_active) jest poprawne. Potwierdzają to wektor `mgla_wylaczona_reveal` (fogOn=false, revealAllLand=true) i moja mutacja (g).
- `buildAllTerritoryNodes` :5667-5678: najpierw miasta, potem `fortTerritoryNodes`. engine_territory_nodes używa portu `fort_territory_nodes`, bez kopiowania logiki.
- Generator uruchamia kod pinu (git archive, wycinki main.ts ze strażnikiem SHA-256, moduły w całości). Wektory nie są ręczne.

## Zarzuty (ponumerowane; żaden nie blokuje)
1. **Brak wołającego produkcyjnego.** `build_view_layers`, `build_fog_layers` i `build_territory_layers` są wołane wyłącznie z testu (grep `dto_bridge` w rust-port: mod.rs i pliki testów). Dispatch wprost wyłącza zmianę kontraktu mostu z r1 (D-364-2: r2 po zgodzie). Zależność jest więc jawna, ale orkiestrator NIE może wpisać tematu jako „wpięte w produkcję”. W rejestrze: ZINTEGROWANE-API, wołający = r2 (#308/#364 r2).
2. **Kolejność właścicieli a `collect_territory_hex_keys_by_owner` sprawdzona tylko częściowo.** Dispatch (krok 5) wymagał, by kolejność właścicieli była równa kolejności z `collect_territory_hex_keys_by_owner`. Engine zwraca BTreeMap, więc test porównuje zbiory (właściciele i heksy), a kolejność wstawiania pokrywają tylko wektory pinu. To uczciwie opisane ograniczenie portu engine, nie warstwy. Wymaganie dispatchu jest spełnione tylko co do zbiorów.
3. **Odstępstwa od sygnatur z dispatchu (D-BR-1/2/3).** Nowy parametr `player_ever_owned_city_by_owner`. `build_territory_layers(state, seat, fog_on, visible, explored)` zamiast `(…, explored_for_render, fog_active)`. Wszystkie trzy są uzasadnione pinem (D-BR-2 potwierdzony mutacją). Wymagają wpisu w REJESTR-RUST jako decyzje techniczne.
4. **Rozbieżność z istniejącym wektorem L1/L2 (D-BR-5).** `fog_off_no_reveal_awaiting` w `renderer/tests/reveal_l12_vectors` podaje riverRevealKeys przy wyłączonej mgle, a pin (:13506) wywołuje setFog bez opcji. Warstwa trzyma się pinu (None). Adapter renderera ignoruje klucze przy fog_on=false, więc nie widać tego wizualnie, ale wektor L1/L2 opisuje stan, którego pin nie tworzy. Proponuję osobny temat poprawki dokumentacji/wektora L1/L2.
5. **Znaleziona poza allowlistą wada `overlays_view::awaiting_first_city`.** Używa flagi bool `gracz_kiedys_mial_miasto`, więc działa poprawnie tylko dla fotela 0 (hotseat, fotel ≠ 0). Operator słusznie tego nie zmieniał. Potrzebny jest osobny temat, bo to ten sam problem co #253 (mgła fotela ME()).
6. **`DtoBridgeError::MissingStartHex` to martwy wariant (D-BR-4).** Wymagał go dispatch, ale pin zwraca `undefined`, więc producent go nie zwraca. Do decyzji w r2: usunąć albo zostawić jako zarezerwowany.
7. **Luki pokrycia wektorów.** (a) Brak barbarzyńców (-1) i rebeliantów (-99) w ścieżce PlayableState: 3 scenariusze F2 pominięte, bo PlayableState ich nie przechowuje (ograniczenie stanu, nie warstwy). (b) Brak przypadku fogOn=false + revealAllLand=true + awaiting z kluczami rzek. Ta gałąź liczy klucze (fog_active=true), a pokrywa ją tylko `me1_reveal_awaiting` z fogOn=true. Jest niska szansa, że to ukryje błąd, bo warunek zależy wyłącznie od fog_active. Warto dodać przypadek w r2.

TESTY: jak wyżej; wszystkie bramki dispatchu EXIT 0, w tym pełny `cargo test --all-targets --no-fail-fast`.
BLOKADY: brak blokujących. Zarzuty 1–7 to notatki dla orkiestratora i r2.
RUNDY: 1/5
NASTĘPNY KROK: Obrona/Final Control r1. Przy integracji wpisać D-BR-1..5 i D-364-1..3 do REJESTR-RUST oraz otworzyć tematy: wołający (r2), wektor L1/L2 (zarzut 4), overlays_view awaiting dla fotela ≠ 0 (zarzut 5).
DEPLOY/PUSH: NIE WYKONANO

# R-RUSTPORT-P4-1-L12-REVEAL-R1 — 02a Obrona Operatora (r1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1-L12-REVEAL-R1
GOAL: revealAllLand i riverRevealKeys w DTO mapy (FogRevealDto) z adapterem renderera i wektorami pinu 07d2fbd72.
ZMIANY/COMMIT: gałąź `obrona-l12` na operatorze `52571418e` (kod `06f3b6ce1`); poprawki obrony w commicie podanym w raporcie końcowym.
  - `rust-port/renderer/src/view/fog.rs`: tylko doc-komentarz `FogReveal` (zarzut 5).
  - `rust-port/renderer/tests/reveal_l12_gen.mjs`: rozwiązywanie ścieżki TypeScript (zarzut 7).
  - ten plik.
  Bez `Cargo.lock`. Wektory `vectors.json` się nie zmieniły (`--check` OK).
TESTY (renderer, CARGO_TARGET_DIR w scratchpadzie, usunięty po bramkach):
  - `cargo fmt --check` EXIT 0
  - `cargo clippy --all-targets -- -D warnings` EXIT 0
  - `cargo test --test reveal_l12` EXIT 0 (7/7)
  - `cargo test --all-targets --no-fail-fast` EXIT 0 (80 zestawów, 687 passed, 0 failed)
  - `node rust-port/renderer/tests/reveal_l12_gen.mjs --check`: z `TYPESCRIPT_JS` i bez tej zmiennej EXIT 0 (28 scenariuszy)
  - `git diff --check` czysty
  - view-model: bez zmian w tej rundzie (bramki z r1 i Evaluatora są nadal aktualne)
BLOKADY: zarzuty 1–4 należą do orkiestratora (wołający produkcyjny, wpis w rejestrze, korekta dispatchu). Allowlista tego tematu ich nie obejmuje.
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### 1. Brak wołającego produkcyjnego i producenta w engine — ODRZUCAM (jako wadę tej rundy)
Fakt jest prawdziwy i był jawnie zgłoszony w `01-operator-r1.md` jako BLOKADA 1–2. Producent leży w `engine/src/domain/state.rs` (`reveal_all_land` + `startRevealKeysForRiverFog` → `compute_visible_at` przy `isAwaitingFirstPlayerCity`, pin `main.ts:13074-13080`). Wpięcie wymaga zmian w `view-model/src/root.rs` (`RenderLayersDto`), w fiksturach i w `lib.rs`. Wszystkie te miejsca są poza allowlistą dispatchu („map.rs (pola), adapter w renderer/src/view/, test, generator, runs”). Ich zmiana byłaby naruszeniem allowlisty, czyli natychmiastowym FAIL. Nadanie ID należy do orkiestratora. Proponuję **R-RUSTPORT-P4-1-L12-REVEAL-WIRE** jako podtemat #364 DTO-BRIDGE. Zakres:
(a) producent w engine z wektorami `startRevealKeysForRiverFog`;
(b) pole `fog_reveal` w `RenderLayersDto` i fikstury;
(c) wołanie `FogReveal::from_dto` w ścieżce produkcyjnej renderera.

### 2. Osobny typ FogRevealDto zamiast pól w DTO mapy — ODRZUCAM (zmiana kodu), PRZYJMUJĘ potrzebę wpisu w rejestrze
Decyzja Z-L12-1 jest techniczna i uzasadniona. `MapViewDto` jest statyczny wg D-DTO-3, a dodanie pól do `FogViewDto` złamałoby 9 literałów poza allowlistą. Typ nadal leży w `view-model/src/map.rs`, zgodnie z allowlistą. `REJESTR-RUST.md` jest poza allowlistą Operatora, a wpisy robi orkiestrator (zasada 8 orkiestratora). Proponowany wpis:
> Z-L12-1 (R-RUSTPORT-P4-1-L12-REVEAL-R1): `revealAllLand`/`riverRevealKeys` niesie osobny `FogRevealDto { reveal_all_land, river_reveal_keys: Option<Vec<HexCoord>> }` w `view-model/src/map.rs`, a nie pola `MapViewDto` (statyczny, D-DTO-3) ani `FogViewDto`. `None` = `null` z pinu; `Some(vec![])` jest odrębne (truthy pusty Set). Wpięcie w `RenderLayersDto` w ramach L12-REVEAL-WIRE (#364).

### 3. Pkt 2 dispatchu (rzeka_krawedzie) sprzeczny z pinem — ODRZUCAM (brak wady po stronie Operatora)
Evaluator potwierdza, że implementacja zgadza się z pinem: `riverRevealKeys = startRevealKeysForRiverFog()` (`main.ts:13074-13080`), a `scene.ts:1263-1264` to JSDoc dla logiki gry. Korekta dispatchu i wpis w rejestrze należą do orkiestratora. Proponowany wpis:
> L12: źródło `riverRevealKeys` = `startRevealKeysForRiverFog()` (pin `main.ts:13074-13080`), nie `rzeka_krawedzie` (pin `scene.ts:1263-1264` = dane logiki gry). Dispatch pkt 2 skorygowany wg zasady 11 (web najpierw).

### 4. Mutacja (c) sprawdzana tylko jako odrzut przez adapter — ODRZUCAM (jako wadę tej rundy)
Bez producenta w Rust (zarzut 1, poza allowlistą) jedynym miejscem, które może wykryć „kopię explored zamiast widoku”, jest adapter. Test dowodzi, że adapter odrzuca taki DTO (`RevealNotApplied`) we wszystkich scenariuszach `revealAllLand=true` z nieodkrytym lądem. Gdy producent powstanie w L12-REVEAL-WIRE, ta sama mutacja powinna być sprawdzana na nim wektorami `fogCodes`. Dopisuję to do proponowanego zakresu (a).

### 5. Doc-komentarz „whatever the DTO carries” — PRZYJMUJĘ
Komentarz mówi teraz, że przy wyłączonej mgle (`setFog(ALL_KEYS, ALL_KEYS)` bez opcji, `main.ts:13506`) `landReveal`/`lastRiverRevealKeys` są zawsze `false`/`None`, klucze z DTO są ignorowane, a `reveal_all_land` przy wyłączonej mgle jest odrzucane. Kod się nie zmienił. Dowód: fmt, clippy i testy powyżej.

### 6. vectors.json i terrain.rs w allowliście — ODRZUCAM (brak wady; Evaluator też to uznaje)
`reveal_l12_vectors/vectors.json` jest wyjściem generatora `.mjs` z allowlisty (`--check` daje bajt w bajt ten sam wynik). Zmiany w `terrain.rs` dotyczą tylko komentarzy i leżą w „adapterze w renderer/src/view/”.

### 7. Domyślna ścieżka TypeScript /opt/node22 — PRZYJMUJĘ
Generator rozwiązuje teraz TypeScript w kolejności: `TYPESCRIPT_JS`, potem `require.resolve('typescript')` względem pliku generatora, potem pakiet globalny (`npm root -g`/typescript/lib/typescript.js). Na tej maszynie `--check` daje EXIT 0 z `TYPESCRIPT_JS` i bez niej. Wektory się nie zmieniły.

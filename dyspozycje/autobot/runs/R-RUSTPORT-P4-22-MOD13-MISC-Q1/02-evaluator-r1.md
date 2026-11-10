STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-22-MOD13-MISC-Q1
GOAL: MOD-13 misc (wioska-oboz, siegeCampModels, siegeMarker, siegeCampSync CPU, rangeOverlay + map/territory-border, tradeRoutesOverlay, robloxCity tylko addRobloxSkyDecor) w Rust 1:1 z webem `edb8fb56`, nakladki jako bufory CPU.
ZMIANY/COMMIT: ocenia commit Operatora `03c8e0ee` (rodzic `e1d69078`). Ewaluator dodaje tylko ten plik.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## Co sprawdzono (realnie, komendy uruchomione w worktree Ewaluatora)

1. **Allowlista.** `git show --stat 03c8e0ee`: 21 plikow. Wszystkie leza w allowliscie: `src/models/misc/**`, `src/models.rs` (+1 linia `pub mod misc;`), `tests/misc_web_parity.rs`, `tests/fixtures/misc/**`, `P4-22-MOD13-MISC.md`, `runs/<ID>/**`. Bez zmian: `gra/**`, `src-tauri/**`, `engine/**`, `src/{geom,pick,assets,camera,terrain}/**`, `unit_core/**`, `lib.rs`, `Cargo.*`. Wynik `git diff --check e1d69078 03c8e0ee`: czysto.
2. **Regeneracja wektorow z uruchomionego weba.** Kroki: `git archive edb8fb56 gra/src gra/data` do scratch, `three@0.169.0` i `esbuild@0.24.0` z npm, node v22.22.0, `node build.mjs`, a potem dwa razy `node gen.mjs`. Wynik: `misc models=34 sync=8 markerSteps=4 range=252 loops=18 territory=7 trade=3`. SHA-256 jest identyczne w obu przebiegach i z plikami w repo:
   - `cf17ac9d…de8e0` models,
   - `d590e026…75a9` overlays,
   - `06383e4d…be81` siege.

   `gen.ts` importuje web bez zmian z `../websrc/gra/src/...`. Shim reliefu podmienia tylko `reliefSurfaceSampler`, wylacznie dla importera `render/rangeOverlay.ts`. Scratch usuniety.
3. **Pokrycie wariantow.** Pokryte sa:
   - wioska;
   - oboz: domyslny i 4 kolory, w tym maska `0xff00ff00`;
   - zolnierze: 0, 1, 4 i 5;
   - taran i wieza;
   - oboz oblezniczy ×18: 9 kierunkow, listy machin `undefined`/`[]`/mieszane, 4 kolory. Oba `SiegeMachineKind` (`taran`, `wieza`) wystepuja;
   - `SiegeMarkerRenderer`: 4 kroki `sync`/`pulse`;
   - `siegeCampSync` ×8, w tym przypadki brzegowe `parseInt`;
   - niebo ×4 (lite/pelne, span);
   - range: 18 zbiorow heksow (promienie 0..4) × 6 stylow. Style to culture, religion i mine (hug), a takze band, band+hug i bez `yOffset`. Jest 3 mapy, razem 252 przypadki;
   - pętle granic ×18 i granice terytorium ×7;
   - trasy handlowe: 3 listy, 8 tras. Pokrywaja minimum 0,18, czyli ten sam heks i sasiada, zakres posredni, sufit 1,6, lad i morze oraz heks spoza mapy;
   - Bezier w f64 ×24.

   Style `CITY_*_OVERLAY_STYLE` z `cityOkolicaOverlay.ts:19-45` nie maja osobnych wektorow. Ida ta sama sciezka co culture (`borderBandWidth` 0/brak, inny `yOffset`), wiec sa pokryte parametrycznie. Plik `wioska-oboz.ts` nie ma poziomow ani stylow (`buildWioska()` bez argumentow, `:153`).
4. **Zgodnosc bitowa.** `tests/misc_web_parity.rs` porownuje przez `to_bits`. Nie ma epsilonow ani `#[ignore]`, a liczba przypadkow jest asercjowana (np. `range cases == 252`). Przypadki z „real relief” maja asercje, ze mapa nie zawiera `Wzgorza`/`Gory`.
5. **Reuzycie core.** Niebo uzywa `rnd` z `core::bronze::rnd`. `BronzeCiv` nie jest importowany przez zadny plik MOD-13 weba (grep: tylko `bronzeCity*`, `stoneCity*`, `cities.ts`, `settlementModel.ts`), wiec nie dotyczy. Uzyte sa tez `core::map_style::terrain_surface_top_y`/`GAME_MAP_RENDER_STYLE`, `pick::hex::{axial_to_world,HEX_R}` i `pick::three::{js_min,js_max}`.
6. **Brak czwartego typu drzewa.** `MiscModel` opakowuje `unit_core::model::UnitModel` (`model.rs:234-236`) i dodaje dane rownolegle (`NodeInfo`, `MiscMaterial`). `OverlayGroup` to plaska lista buforow CPU, zgodnie z wymaganiem dispatchu. Nie jest drzewem modelu.
7. **jsmath.** `src/models/misc/` nie zawiera systemowych `sin`/`cos`/`atan2`/`hypot`/`powf`/`mul_add`. Jedyne `.sqrt()` (`range.rs:548`) jest poprawnie zaokraglone IEEE, tak samo jak `Math.sqrt`. Test `jsmath_wiring` przechodzi (6/6).
8. **Mutacje.** Uruchomilem `mut.py` Operatora oraz 5 wlasnych mutacji (ARC_HEIGHT_MIN, HUG_RELIEF_SUBDIVISIONS, CAMP_SCALE, krok `mx`, SPRITE_LIFT). Wynik: **18/21 wykrytych**. Przezyly te same 3 co u Operatora: cache reliefu, `cross <`→`>` oraz `0.06*k/2`. Uzasadnienia rownowaznosci sa poprawne. Dla `k∈{0,1,2}` dzielenie przez 2 jest dokladne. Stopien wierzcholka obwodu w siatce heksow jest ≤2.
9. **Bramki w czystym `CARGO_TARGET_DIR`** (scratch Ewaluatora, nowy):
   - `cargo fmt --all -- --check`: EXIT=0;
   - `cargo clippy --locked --all-targets -- -D warnings`: EXIT=0;
   - to samo z `--features gpu`: EXIT=0;
   - `cargo test --locked --all-targets`: EXIT=0. `misc_web_parity` 9/9, lib 8/8, reszta zielona.
10. **Probna integracja z aktualnym `origin/rust-port/parity-v2` `6d77d02e`.** Byl to lokalny merge detached, porzucony i niepushowany. Konflikt w `models.rs` rozwiazal sie automatycznie (`units_kamien` + `misc`). `Prim` dostal wariant `Kamien`, a misc nie dopasowuje `Prim` wyczerpujaco. Wyniki po merge'u: fmt EXIT=0, clippy EXIT=0, test EXIT=0 (`misc_web_parity` 9/9).

## Zarzuty (niespelnienia blokujace)

Brak, po realnym sprawdzeniu punktow 1–10.

## Uwagi (nieblokujace, dla Final Control / orkiestratora)

1. **Plachta kopalni na `Wzgorza`/`Gory` w grze nie jest jeszcze 1:1.** `MINE_ELIGIBLE_STYLE` dziala w grze wylacznie na tych terenach (`rangeOverlay.ts:455-470`). Zgodnosc z webem wymaga prawdziwego `ReliefSource`, czyli portu `teren-gory-wzgorza.ts`. Ten port nalezy do MOD-03 / P4.17 decor (`P4-4-MODEL-CATALOG.md:552`), a nie do osobnego nowego tematu, jak proponuje Operator. Wymagany krok integracyjny: podpiecie samplera P4.17 pod `range::ReliefSource` i wektor z `relief=real` na mapie z `Wzgorza`/`Gory`. Algorytm drapowania jest zweryfikowany bitowo na polu analitycznym.
2. **Czesciowa duplikacja.** `overlay::js_to_fixed(x, digits)` pokrywa sie z `core::jsnum::js_to_fixed3`. Uogolnienie jest potrzebne, bo web uzywa `toFixed(5)`/`toFixed(4)`. Docelowo nalezy je przeniesc do `core/jsnum.rs` (poza allowlista tego tematu).
3. **Incydent wspoldzielonego scratch.** Operator zglosil, ze `git archive edb8fb56` nadpisal `web/gra` innego agenta. Wedlug Operatora byly to pliki z tego samego pinu. Ewaluator nie moze tego zweryfikowac, bo katalog nie istnieje. Orkiestrator powinien potwierdzic pin wektorow rownoleglego tematu, ktory korzystal z tego `web/`.
4. `ZAŁOŻENIE Z1` (linia modulu w `models.rs`, nie w `lib.rs`) jest poprawne. `lib.rs` ma juz `pub mod models;`.
5. NIE_ZMIERZONO, zgodnie z dispatchem: ocena wzrokowa i GPU oraz rasteryzacja sprite'a ⚔ (D-MOD-6).

NASTEPNY KROK: Final Control (Opus 5.5 medium). Potem integracja orkiestratora: rebase/merge na `origin/rust-port/parity-v2` (jedna linia `models.rs`). Uwaga 1 trafia jako zaleznosc do P4.17.

# 01 — Operator, runda 1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-27-SCENE-UNIFY-Q1
GOAL: Jeden typ drzewa sceny w rust-port/renderer (src/scene/: Scene = arena Node z transformacją, Geo jako dane CPU, Material jako dane, name, cienie, renderOrder, userData) i migracja decor, wonders, unit_core, units_kamien/braz/zelazo, improvements, cities, misc bez zmiany wyników (fixtury bitowo bez zmian); likwidacja Prim::Kamien/Braz/Zelazo, tabeli drawables, wrapperów MiscModel/ImprovementModel; widok eksportu GPU (CPU).
ZMIANY/COMMIT: src/scene/** (nowy, 8 plików), src/lib.rs (+1 linia), src/core/scene.rs (re-eksport + alias SceneNode), src/core/{fog_dim,merge_decor}.rs (Z2: wymuszeni konsumenci core::scene), src/decor/**, src/models/** (9 modułów), tests/*_web_parity.rs (10 plików, wyłącznie dopasowania typów; asercji 712 -> 714), fixtures bez zmian. Commity w worktree (bez push): 6a97696b (etap 1: typ+decor+wonders), 348893d0 (etap 2: jednostki), 4b5f9ea7 (etap 3: improvements/misc/cities), + commit etapu 4 (testy scene, dokument, run). Dokument: dyspozycje/rust-port/p4/P4-27-SCENE-UNIFY.md.
TESTY: fmt EXIT=0; clippy EXIT=0; clippy --features gpu EXIT=0; cargo test --locked --all-targets EXIT=0 (25 celów, 164 passed, 0 failed); git diff --exit-code 9ec9c9d8 -- tests/fixtures EXIT=0; mutacje 22/22 wykrytych, każda przez test parytetu z webem (logi/mutate.txt). Logi: logi/.
BLOKADY: brak. Uwagi: Z2 (zmiany core/fog_dim.rs i core/merge_decor.rs poza dosłowną listą allowlisty — wymuszone przez zmianę core::scene); Z8 (CityGeo/CityMaterial/Drawable i in. zostały jako widoki konstrukcji/odczytu, nie magazyn); stare nazwy typów jako aliasy Scene; NIE_ZMIERZONO: wygląd na GPU (lista §7 dokumentu).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (ocena Z1-Z14, w szczególności Z2 i Z8; powtórzenie bramek i mutacji).
DEPLOY/PUSH: NIE WYKONANO
```

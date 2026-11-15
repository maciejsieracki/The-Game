STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-DTO-DECYZJE-4-10-Q1
GOAL: zapisać decyzje D-DTO-4 i D-DTO-10 kontraktu DTO renderera zgodnie z webem (pin 07d2fbd72), z dowodami plik:linia i wpływem na typy w rust-port/view-model.
ZMIANY/COMMIT: gałąź robocza `worktree-wf_0cf44ff7-e59-1`, baza `f7baa3848` (= origin/rust-port/parity-v2). Pliki: `dyspozycje/rust-port/p4/D-DTO-4-D-DTO-10-DECYZJE.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P4-DTO-DECYZJE-4-10-Q1/00-dispatch.md` (kopia dispatchu z claude/rust-sivvrn), ten raport. SHA podany w odpowiedzi Operatora (commit zawiera ten plik, więc SHA nie może być w jego treści).
TESTY: dokument, bez cargo. `git diff --check` czysty; `git diff --name-only f7baa3848..HEAD` = wyłącznie allowlista (2 ścieżki pod runs/ + dokument). Zero zmian w gra/**, rust-port/**, REJESTR-RUST.md.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator.
DEPLOY/PUSH: NIE WYKONANO

## Wynik

- **D-DTO-4 = A** (silnik liczy `roadMask`, trasy rzek do renderu, `terraces`, `coveringImprovement` i obozy oblężnicze). Podstawa w webie: reguły leżą w `game/terrain-improvements.ts:358`, `:388`, `map/road-network.ts:75`, `map/gen-helpers.ts:5411`, `:5445`, `:8194` oraz w integratorze `main.ts:15836`, `:17083`, `:17492-17511`, a nie w `render/`.
- **D-DTO-10 = A** (`0`/`1`/`2` = pozycje w enumie `Widocznosc`, `types/hex.ts:60-64`). Web rozstrzyga semantykę trzech stanów i pierwszeństwo widoczny > odkryty (`render/scene.ts:3580`, `:3557-3559`); kodowanie bajtów jest techniczne. Stan kodu w `view-model/src/map.rs:159-212` już jest zgodny.
- Pytania ABC: brak (obie decyzje techniczne, zgodne z webem).

## Ustalenia dodatkowe (do tematów producentów, poza tym zakresem)

1. `computeRoadMask` i `trimMediumRenderPathAtMain`/`trimMediumTailAlongMain`: BRAK w silniku (P4-1B).
2. `river_render_paths` potrzebuje niezmiennika „równoległe do `rivers`” (renderer potrzebuje `kind` i surowej ścieżki, `scene.ts:1311-1333`). `validate.rs` dziś go nie sprawdza.
3. Obozy oblężnicze: web wymaga `siegeAllowedBetween` (`main.ts:17503-17504`), czyli reguła jest węższa niż „obca jednostka” z kontraktu §2.1 #13. Duplikaty heksów są per jednostka. Czy rozdział maszyn od nich zależy: NIE_ZMIERZONO (P4-1F).
4. `FogViewDto` nie ma opcji webu `landReveal` i `riverRevealKeys` (`scene.ts:3526-3531`, `main.ts:13490-13494`). To luka kontraktu §3.3 do P4-1C.
5. Wpis decyzji w `REJESTR-RUST.md` należy do orkiestratora (poza allowlistą).

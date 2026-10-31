STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-M07A-RZEKI-A-SCIEZKI-POLA-Q1
GOAL: M07A rzeki A, sciezki i pola (web gen-helpers.ts 5121-6068, pin edb8fb56) -> rivers_a (Rust), caly zakres 52/52.
ZMIANY/COMMIT: oceniono 232d8945b, 4b0cb659f, 0647499ad (baza 1e4e975e3 / 52994ab70). FC dopisal tylko: poprawka nieaktualnej liczby mutantow w naglowku dossier (85/70 -> 89/74) + ten raport (SHA w raporcie koncowym).
TESTY (zmierzone przez FC na 0647499ad, target /dev/shm, CARGO_INCREMENTAL=0):
- cargo test pelny: 1827 passed / 0 failed, EXIT=0 (zgodne z gate-test-full-r5.txt)
- p6_m07a_grow 8/8, p6_m07a_walk 15/15, p6_m07a_cap 1/1
- clippy --all-targets -D warnings: EXIT=0; fmt --check: EXIT=0
- git diff --check 52994ab70..0647499ad: czysty
- verify_m07a_p3.py (walk+grow): fails=0 (drainStep 504, drainGoal 360, pathSea 288, scoreSquare 504, scoreLandCenter 288, audit 36, grow 1296, collect 496, nearest 268, window 2240, bigCap 24 ...)
- wlasne mutanty FC w grow.rs (5): `nd > cur_d + 1`->+2, `.min(3)`->`.min(4)`, `step_signed.abs() > 1`->`> 2`, `od < cur_od`->`<=`, `sum.abs() <= MAX`->`<` : wszystkie ZABITE przez p6_m07a_grow
- pliki wektorow: cap 0,75 MB, grow 1,17 MB, walk 0,57 MB, web-rivers-a 3,76 MB (<6 MB)
- allowlista: wszystkie zmienione pliki w rivers_a*, rivers_a/, tests/p6_m07a_*, dossier, katalog runu. Brak zmian w mod.rs, relief, landsea, coast, bridge, Cargo.toml, gra/, renderer, src-tauri.

ROZSTRZYGNIECIE ZARZUTOW (FC r3 -> r5):
- Z1 zakres: ODDAL. Dossier §2: 52/52 PORTOWANE; grow.rs (TraceRiverOpts, growRiverInlandBeforeDrainage, indeks, nearest, collect, okno skretu) i profile.rs istnieja i sa testowane wektorami z weba. Profiler: modul portowany, hooki w ciele generatora poza zakresem 5121-6068 (ZALOZENIE).
- Z2 mutacje: ODDAL. 89 mutantow, 74 zabite, 15 ekwiwalentnych z dowodami (§4.4); dowody G11-G13, G37 (martwa galaz miekka, zweryfikowane z TS pinu :5946-5951) sprawdzone. Uwaga: W40 to ekwiwalent praktyczny, nie formalny (jawnie zaznaczone). Niezmutowane konstrukcje wymienione w §3(d).
- Z3 weryfikator Python: ODDAL. verify_m07a_p3.py pokrywa drainStep/drainGoal/pathSea/scoreSquare/audit i partie 3. purge*/render*/coastalRender (partia 1, zaakceptowana w FC r1 z ODDANYMI Z2-Z8) pokrywaja wektory web + testy Rust + mutacje M1-M10; luka jawnie w dossier §5.3/§6a, bez wplywu na poprawnosc.
- Z4 cap 6000: ODDAL. Mapa 100x80 (8000 heksow): cap 5999/6000/6001 daja rozne centroidy (bigCap 24 w weryfikatorze Python, zgodne z webem; test big_map_cap_6000...; asercja stalej).
- Z5 logi bramek: ODDAL. gate-*-r5.txt w repo (z EXIT=), a FC odtworzyl wyniki niezaleznie.
- Z6 spojnosc: ODDAL (numeracja rund = ZALOZENIE, rozbieznosc zgloszona; allowlista `rivers_a/` zgodna z dispatchem r2 "nowe moduly w podkatalogu rivers_a/"; zmiana rivers_a.rs to wylacznie `pub mod`/`pub use` + `pub(crate)` dla dwoch const fn, bez zmiany logiki - zweryfikowane diffem 52994ab70..0647499ad). Jedyna realna niespojnosc (naglowek dossier 85/70 vs 89/74) NAPRAWIONA przez FC (docs-only) w tym samym SHA co raport.

LICZBA NAPRAW (kod): 0. Liczba DO DECYZJI CZLOWIEKA: 0.
BLOKADY: brak blokujacych. Otwarte ograniczenia nieblokujace: weryfikator Python bez purge*/render*; wariant earlyExitBelow indeksu nieportowany (poza zakresem, uzywany w isPathTooCloseToRiverHexes :9066); hooki profilera w ciele generatora poza zakresem (kandydat do M07B/M08); Cargo.lock nie commitowany.
RUNDY: 5 (etykieta dossier; dispatch 2/5 = numer dispatchu)
NASTEPNY KROK: integracja orkiestratora. Kolejnosc wzgledem origin/rust-port/parity-v2: zrobic rebase/merge SHA koncowego na aktualny origin/rust-port/parity-v2 (wskazuje 72491e44 przy FC; Operator bazowal na 48d301fe8/1dd3c12c6), ponowic `cargo test` + clippy + fmt po integracji; zmiany rozlaczne (nowe pliki rivers_a/, tests/p6_m07a_*, dossier) + 2 linie `pub mod`/`pub use` i `pub(crate)` w rivers_a.rs; mozliwy konflikt tylko w rivers_a.rs, jesli parity-v2 go zmienilo.
DEPLOY/PUSH: NIE WYKONANO

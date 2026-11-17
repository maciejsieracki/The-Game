STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P6-DOC-323-RZEKA-KRAWEDZIE
GOAL: Poprawić w dokumencie P4-1G-ADAPTER-ROZPOZNANIE dwa wiersze opisujące, czy pin czyta rzeka_krawedzie w renderze (#323).
ZMIANY/COMMIT: dyspozycje/rust-port/p4/P4-1G-ADAPTER-ROZPOZNANIE.md (wiersz §3 nr 60 — kolumna pinu; wiersz §4 R3, linia 172); raport run dir. Baza: origin/rust-port/parity-v2 = 625624d97.
  UWAGA: plik nie istnieje w bazie 625624d97. Został pobrany z origin/claude/rust-sivvrn (wersja źródłowa dispatchu, bez zmian poza dwoma wierszami) i dodany jako nowy plik. Commit SHA (operator, r1): 048ea8092d69c7afa7d16ce74829baecd2abb5aa (krótki 048ea8092); commit obrony z uzupełnieniem tego pola jest opisany w 02a-obrona.md.
TESTY: git diff --check (plik w indeksie) — patrz wynik w sesji; brak cargo/npm (docs-only).
DOWODY PINU (07d2fbd72):
  - gra/src/battle/battleScene.ts: git grep / grep 'rzeka_krawedzie|river_render_paths|krawedzie|river_render' — 0 trafień (battleScene nie jest plikiem renderu mapy).
  - gra/src/render/scene.ts (plik renderu mapy, to tu leżą wiersze doc): jedyne wystąpienie „krawedzie" w kodzie/komentarzu to komentarz 1264.
    sed -n '800p;1263,1264p;1317,1318p;2860p;2873p':
      800: /** Wstęgi wzdłuż riverPaths — ujście przez Wybrzeże do Morza (tylko krawędzie hex). */
      1263: /** Jedna ciągła wstęga na trasę riverPaths — rogi i środki krawędzi (NIE przez środek heksa).
      1264:  * hex.rzeka.krawedzie zostaje dla logiki gry; render idzie po pełnej ścieżce.
      1317:      ? mediumRiverRenderPath(map.hexes, pathForRender)
      1318:      : landRiverRenderPath(map.hexes, pathForRender);
      2860:  // Rzeki -- wczytywane z map.riverPaths (dane generatora mapy)
      2873:  const pathsAll = map.riverPaths ?? [];
  - Wniosek: pin renderu NIE czyta hex.rzeka.krawedzie; wstęgi biegną po riverPaths. Zarzut dokumentu jest uzasadniony w części dotyczącej pinu.
  - Wiersz 61 (rivers[] / RiverPathDto → map.riverPaths, scene.ts:2873) był poprawny — NIE zmieniony. Błąd był w wierszu 60 (kolumna pinu: „hex.rzeka.krawedzie w budowie wstęg (scene.ts:800, :2860-2873)”).
ZMIENIONE WIERSZE:
  - wiersz §3 nr 60 (kolumna pin) — PRZED: | `hex.rzeka.krawedzie` w budowie wstęg (`scene.ts:800`, `:2860-2873`) | BRAK |
    PO: | pin NIE czyta `rzeka.krawedzie` w renderze: `render/scene.ts:1263-1264` (komentarz: „hex.rzeka.krawedzie zostaje dla logiki gry; render idzie po pełnej ścieżce”); wstęgi budowane z `map.riverPaths` (`scene.ts:800`, `:2873`) | BRAK |
  - wiersz §4 R3 (linia 172) — PRZED: | `river_render_paths`, `rzeka_krawedzie` |
    PO: | `river_render_paths` (wejście z `rivers[]`/`RiverPathDto`); `rzeka_krawedzie` NIE jest wejściem renderera: pin nie czyta go w renderze (`scene.ts:1263-1264`) |
BLOKADY: brak. Uwaga procesowa: plik docelowy nieobecny w bazie (patrz ZMIANY).
RUNDY: 1/5
NASTĘPNY KROK: FC (Sonnet) — weryfikacja wierszy 60 i R3 względem sed powyżej, potem integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO

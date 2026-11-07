STATUS: PASS
DOMAIN: GAME (WEB) — pamięć i wydajność renderu jednostek
TEMAT: R-WEB-MEMORY-UNIT-STATIC-MERGE-Q1
GOAL: produkcyjne scalenie statycznych części żetonów jednostek (wariant B, decyzja właściciela 2026-11-07) z zachowaniem pickingu, zaznaczenia, animacji, deferred dim, mgły, kolorów właściciela, SmallPartLod i pul materiałów/geometrii FALA 526/530; różnica obrazu ≤ ~120 px z 1,6 mln.

## ZMIANY-COMMIT
Baza: origin/main `6a673c838b306dbad47dd33d58f5f5a72882a71c`.
- `1f3d84c59b7aff772ea520cd6b518150b63e82f8` — kod + testy: nowy `gra/src/render/unitStaticMerge.ts`; `units.ts` (`_registerToken` scala po puli materiałów, przed pulą geometrii; przełącznik `UnitRenderer.staticMerge` tylko dla testów A/B); `smallPartLod.ts` (LOD na scalonym meshu); testy `memory-unit-static-merge-{test,heap,game-measure}.cjs`.
- `ca97010226af3779ebd4797b824db09a2bf0282a` — żeton tworzony w oknie przyciemnienia zostaje niescalony (półprzezroczyste części sortują się jak dotąd), po zdjęciu przyciemnienia scalany W MIEJSCU (ten sam obiekt, bez przebudowy/migotania).
- commit raportu (ten plik + bramki + `pomiar-gra/` + `zrzuty/` + `gra/tools/memory-unit-static-merge-game-frame.cjs`) — SHA w odpowiedzi Operatora do orkiestratora (`git log -1` gałęzi `autobot/R-WEB-MEMORY-UNIT-STATIC-MERGE-Q1-op-r1`).
Poza allowlistą: zero (`main.ts`, `gra/data`, `scene.ts`, pule, `battle/`, `vite.config.ts`, `WERSJE.md`, `rust-port/` nietknięte).

Mechanizm: żadna część figurki na mapie nie jest animowana — ruch/atak/stanie przesuwają tylko korzeń żetonu. Statyczne części o wspólnym (pulowanym) materiale i zgodnym stanie rysowania → jeden mesh na materiał (wierzchołki w układzie korzenia). Nie scalamy: przezroczystych, z dziećmi, multi-material, Instanced/Skinned, niewidocznych, z `userData` (znaczniki), tabliczki/odznak/pierścieni, `onBeforeRender`, nietypowe warstwy, lustro (det<0), morph/interleaved/drawRange. SmallPartLod: części w scalonej geometrii ułożone malejąco wg średnicy (ta sama liczba co dla osobnego meshu) → LOD rysuje prefiks (`drawRange` na czas rysowania tego meshu, przywracany po; picking widzi całość) — **zestaw chowanych części identyczny z bazą**, bez dodatkowych draw calli.

## TESTY (logi `gate-*.txt`, każdy z `EXIT=`)
Pomiar w grze (build produkcyjny poza repo, seed 4242, 3+3 przebiegi naprzemiennie, `gate-memory-unit-static-merge-game-measure.txt`, surowe `pomiar-gra/`):
| | pre (mediana) | post (mediana) |
|---|---|---|
| t.1 MB po GC | 89.37 | 85.90 (−3.5) |
| t.50 MB po GC | 171.66 | **143.86 (−27.8, −16%)** |
| t.50 meshe żetonów | 35 903 | 9 644 (−73%) |
| t.50 draw calls (scena) | 1 192 | 863 |
| t.50 renderLoop ms/klatkę | 29.19 | 20.38 |
| t.50 syncUnitsRender (przejście tury) | 186.6 | 108.0 |
Rozrzuty stron rozłączne (t.50 pre min 168.2 > post max 144.2). pageerror 0.

Stanowisko 475 żetonów (`heap`): sterta 67.0→29.3 MB (−37.7), meshe/żeton 67.1→19.3. Stanowisko 170 żetonów (`memory-unit-static-merge-test` 9/0): meshe 11 701→3 315, draw calls 12 636→4 250; obraz A/B stanie/marsz/atak **6/1/2 px** z 1,6 mln (zbliżenie 0/0/0), przyciemnienie 6 px, LOD@40 4 px; picking 170/170 identyczny (stanie, marsz, LOD); przyciemnienie: tylko dotknięty żeton, po zdjęciu ten sam obiekt, scalony w miejscu, meshe == baza; LOD: części chowane B == A dla 6 odległości; przebudowa/usunięcie: pule puste.
Pełna klatka gry (`game-frame`): K1 313 px różnicy, 0 px > 8/255 (max różnica kanału 2); K2 0 px.
Zrzuty PNG w `zrzuty/` — przejrzane: brak artefaktów, kolory właściciela, tabliczki, pierścienie poprawne.

Pozostałe bramki: tsc EXIT=0; logic 213/213; small-part-lod 24/0; unit-renderer-overlay-sync 17/0; capture-render-sync 23/0; city-badge-zoom-lod 67/0; unit-deferred-reveal-dim-real-render 19/0 (kolor wraca, pierścień 0.42); river-fog-visibility 31/0; memory-static geometry-pool 18/0, material-pool-pixel 7/0, model-pool-pixel 6/0, memory-growth-visual-parity 4/0; render-unit-sharpness-guard PASS.
Pełny zestaw `*render*` (84): 79 runnerem + 5 osobno — PASS 55, nie-PASS równe bazie 23, niestabilne też na bazie 1, **regresje 0** (`gate-render-all.txt`).
ai-test: 274/20 — **identyczny zbiór 20 FAIL jak na bazie** (diff pusty). ai-city-render-batch-test: FAIL jak na bazie (czyta tylko `main.ts`, niezmieniony).
Mutacje (`gate-mutations.txt`): 5/5 wykryte (M1-heap: wyłączenie scalenia → heap-test EXIT=1; M1–M4: scalenie/LOD/przyciemnienie/picking).

## BLOKADY
Brak.
Uwagi: (1) czas jednorazowego `sync` przy budowie 475 żetonów od zera rośnie 675→858 ms (koszt scalania przy rejestracji; w grze przejście tury jest SZYBSZE, 186.6→108 ms, bo mniej obiektów); (2) renderLoop mierzony na swiftshader (~1,5 kl/s) — wartości względne; (3) liczba jednostek w t.50 różni się między przebiegami (385–424), MB/jednostkę pre 0.417 / post 0.358; (4) pierwsza próba pre3 przerwana po T10 końcem poprzedniej sesji — usunięta, powtórzona w całości.
ZAŁOŻENIE: zamiast osobnego modułu konfiguracyjnego przełącznik `UnitRenderer.staticMerge` (domyślnie `true`) służy wyłącznie A/B w testach.

## RUNDY
1/5

## NASTĘPNY KROK
Evaluator (Opus 5.5 medium) → Obrona → Final Control. Integracja: możliwy konflikt z równoległym R-WEB-PERF-ENDTURN-RENDER-HUD-Q1 w `units.ts` (rozwiązuje orkiestrator).

DEPLOY-PUSH: NIE WYKONANO

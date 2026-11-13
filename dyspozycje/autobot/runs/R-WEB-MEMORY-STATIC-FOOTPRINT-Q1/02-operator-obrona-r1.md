STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — pamięć: bundle ASCII + wspólne geometrie modeli
TEMAT: R-WEB-MEMORY-STATIC-FOOTPRINT-Q1
GOAL: zmierzone zmniejszenie pamięci po GC (t.1/50/100, seed 4242, mgła OFF) bez zmiany obrazu, reguł i determinizmu AI; docelowo ≥ 100 MB mniej w t.100 względem `ea9c14daf`.

ZMIANY-COMMIT: obrona na bazie commita Operatora `c30fc6894182fdb6c7d640f7fc867777de5e369c` (merge-base `origin/main` 55e098dc5). SHA commita obrony — w raporcie zwrotnym (commit zawiera ten plik).
- `gra/src/render/geometryContentPool.ts`: pula przestaje być globalna dla modułu — klasa `GeometryContentPool` (Mapa + WeakMap jako pola instancji).
- `gra/src/render/units.ts`, `cities.ts`: pole `private readonly geoPool = new GeometryContentPool()` w każdym rendererze; wywołania `this.geoPool.poolOwned/release` (te same 3 miejsca co w r1).
- `gra/tools/memory-static-geometry-pool-test.cjs`: + P5 (zakres puli, GC porzuconego renderera); `memory-static-model-pool-pixel-test.cjs`: nowe API; `memory-static-ascii-bundle-test.cjs`: poprawiony opis S1 + S1b; nowe `memory-static-unit-merge-upper-bound.cjs` (pomiar Z2).
- `main.ts` NIETKNIĘTY.

ODPOWIEDZI NA ZARZUTY
- Z1 (cel 100 MB) — ODRZUCAM jako wadę, przyjmuję jako notę. Cel „docelowo”, raport r1 jawnie go nie deklaruje jako spełniony. Po normalizacji (Z4) szacunek ≈ −91 MB w t.100; brakujące ~9 MB leży w dźwigniach poza zakresem r1: (B) ≤ 40,7 MB (Z2, osobny temat), wspólne materiały −10…−16 MB (decyzja właściciela: 51 px), base64 ~62 MB (poza allowlistą).
- Z2 (kandydat B bez pomiaru) — PRZYJMUJĘ pomiar, wdrożenie odkładam z dowodem. Pomiar V8 (`gate-z2-unit-merge-upper-bound.txt`): 475 żetonów = 66,7 MiB sterty; 63,5 Object3D, 61,6 mesha i 13,9 materiału na żeton; 1 Mesh = 1 889 B; górna granica scalenia wszystkich meshy o tym samym materiale = **40,7 MiB** (zgodne z szacunkiem dyspozycji 35–45). Korekta uzasadnienia r1: w `units.ts` NIE ma pętli animacji części (grep: brak `requestAnimationFrame`/mixer) — „animacje” to był błędny argument. Realne przeszkody: (1) `SmallPartLod` (FALA 525, temat równoległy) chowa POJEDYNCZE drobne mesze — scalenie musi łączyć tylko w obrębie kubełka rozmiaru, inaczej zmienia obraz przy oddaleniu; (2) scalenie zmienia kolejność sortowania (z-fighting współpłaszczyznowych ścian — ten sam mechanizm, który dał 51 px przy materiałach), więc „piksel w piksel” wymaga prototypu i testu X1; (3) przyciemnianie/przebarwienia per materiał. To przebudowa builderów jednostek nachodząca na plik tematu PERF-LAG-HUD-Q2 — rekomenduję osobny temat z tą liczbą jako celem.
- Z3 (pomiar na ea9c14daf+zmiany) — PRZYJMUJĘ. Zmierzyłem HEAD obrony (produkcyjny build, ten sam harness, 10 tur, `raw-obrona-r1-head-10t-seed4242.jsonl`): t1 214,2 / t5 222,0 / t10 225,3 MB (MB = 10^6; harness zapisuje MiB 204,3/211,7/214,9), trajektoria 48/60/68 jedn., 42 miasta — identyczna z Evaluatorem. t10 = 225,3 jak u Evaluatora (225,3), t5 w 0,3 MB. Różnica t1 (220,2 vs 214,2) to rozrzut próbki t.1 (pomiar tuż po `world-ready`, przed ustabilizowaniem sterty), nie kod: HEAD obrony ma tę samą wartość t1 co pomiar r1 (204,1 vs 204,3 MiB). Wniosek: Δ stała ≈ −71,5 MB (t5/t10), zmiana Z6 nie zmniejszyła zysku.
- Z4 (brak normalizacji na jednostkę) — PRZYJMUJĘ. Koszt żetonu PO z pomiaru Z2: 66,66 MiB / 475 = 0,140 MiB. Nadwyżka PO w t.100: 113 żetonów × 0,140 = 15,9 MiB = 16,6 MB → Δ znormalizowana ≈ −74,9 − 16,6 ≈ **−91,5 MB** (SZACUNEK, tylko sterta renderu żetonów; stan gry jednostek i GPU pominięte — dolna granica korekty). Powtarzalność PRZED-vs-PRZED na 100 turach: nadal NIE_ZMIERZONO (67 min/przebieg).
- Z5 (S1 „każdy <script>”) — PRZYJMUJĘ. Opis S1 poprawiony (dotyczy tylko bundla); dodane S1b: raport skryptów poza bundlem + granica < 8 192 znaków. Wynik: 1 skrypt, 1 240 znaków, 2 znaki spoza ASCII (BOOT ERROR CATCHER z `index.html`, ~2,5 KB) — pomijalne, świadomie poza wtyczką. Bramka static 18/0 (`gate-memory-static-ascii-bundle-test-r2-static.txt`).
- Z6 (globalna pula przypina geometrie przy podmianie rendererów) — PRZYJMUJĘ, naprawione bez dotykania `main.ts`. Potwierdziłem: `main.ts` (42551, 42676, 43032, 43281, 43505) tworzy nowe `UnitRenderer/CityRenderer` bez `dispose()` starych, a `disposeScene` ich nie zwalnia. Kontrpróba na starej puli (`gate-z6-old-pool-gc-counterprobe.txt`): po zgubieniu modeli i GC geometria i jej tablica CPU ŻYJĄ (`stats {shared:3, refs:50}`). Po poprawce pula należy do instancji renderera — porzucony renderer zabiera pulę ze sobą (jak przed zmianą). Test P5: osobne pule nie współdzielą, brak Map na poziomie modułu, oba renderery mają własne pole, porzucona pula + geometria + tablica CPU zebrane przez GC → OK. Koszt: brak współdzielenia jednostki↔miasta (inne geometrie; pomiar t10 bez zmiany).

TESTY (obrona, logi `*-r2.txt`, każdy z `EXIT=`):
- tsc EXIT 0; logic 213/213.
- memory-static-geometry-pool 18/0 (było 14; +P5); model-pool-pixel (Chromium) 6/0: 0 px / 1,6 mln, picking identyczny, kontrola 51 px; ascii-bundle static 18/0 (HTML +0,47%).
- memory-growth-visual-parity 55e098dc5 vs HEAD obrony: 4/0, 0 px w obu kadrach.
- unit-renderer-overlay-sync 17/0; city-badge-zoom-lod 67/0.
- Pomiar pamięci 10 tur (Z3) jw.
- Nie powtarzane (zmiana ogranicza się do zakresu puli w renderze, logika nietknięta): ai-test, war-allin, mgla, unit-replace, 100 tur.

BLOKADY: brak. Buildy vite wyłącznie poza repo (`/tmp/civ-mem2-obrona-*`, usunięte); `node_modules` usunięte po pracy.
RUNDY: 1/5 (obrona rundy 1)
NASTĘPNY KROK: Final Control; orkiestrator: ABC do właściciela o wspólnych materiałach (51 px), osobny temat na kandydata (B) z celem ≤ 40,7 MiB.
DEPLOY-PUSH: NIE WYKONANO

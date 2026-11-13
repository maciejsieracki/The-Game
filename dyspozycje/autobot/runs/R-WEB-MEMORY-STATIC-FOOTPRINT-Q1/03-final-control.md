STATUS: PASS
DOMAIN: GAME (WEB) — pamięć: stała podstawa (bundle ASCII) i modele jednostek/miast
TEMAT: R-WEB-MEMORY-STATIC-FOOTPRINT-Q1
GOAL: zmierzone zmniejszenie pamięci po GC (t.1/t.50/t.100, seed 4242, mgła OFF) bez zmiany wyglądu (piksel w piksel), reguł gry i determinizmu AI; docelowo ≥ 100 MB mniej w t.100 względem `ea9c14daf`.

ZMIANY-COMMIT:
- Oceniany HEAD: obrona `53d399b06d6a542aced4453798dd944a5f38fbbc` na Operatorze `c30fc6894182fdb6c7d640f7fc867777de5e369c`;
  łańcuch od `origin/main` 55e098dc5: ed30cfeb1, 5e3c0a8da, c3f414a18, f73e17c2d, c30fc6894, 53d399b06 (+ commit z tym plikiem).
- merge-base z `origin/main` = 55e098dc5 = aktualny `origin/main` (fast-forward możliwy, bez konfliktów).
- Allowlista: `git diff --name-only 55e098dc5 53d399b06` = `gra/vite.config.ts`, `gra/src/render/{units.ts,cities.ts,geometryContentPool.ts}`,
  nowe `gra/tools/memory-static-*.cjs`, `dyspozycje/autobot/runs/R-WEB-MEMORY-STATIC-FOOTPRINT-Q1/**`. `main.ts`, `gra/data/**`,
  `gra-robocza/**`, `WERSJE.md`, `rust-port/**`, `src-tauri/**`, `battle/**` nietknięte. `git diff --check 55e098dc5 53d399b06`: czysto.
- Przegląd kodu obrony (Z6): pula jako klasa `GeometryContentPool`, pole `geoPool` per instancja `UnitRenderer`/`CityRenderer`; wszystkie ścieżki
  zwalniania (podmiana żetonu/modelu, usunięcie, `dispose()`) idą przez `_disposeToken`/`_disposeModel` → `geoPool.release`. Brak bezpośredniego
  `g.dispose()` na geometrii z puli w tych rendererach. Logika puli bez zmian względem r1 (tylko zakres).

TESTY (powtórzone przez Final Control na 53d399b06):
- tsc (po `npm ci --ignore-scripts`): EXIT 0.
- logic-test: LOGIC OK 213/213, EXIT 0.
- memory-static-geometry-pool-test: 18 OK / 0 FAIL (w tym P5: osobne pule, brak Map na poziomie modułu, porzucony renderer → pula, geometria i tablica CPU zebrane przez GC).
- memory-static-model-pool-pixel-test (Chromium): 6 OK / 0 FAIL — 0 różnych pikseli z 1,6 mln, 194 modele, picking identyczny, kontrola wspólnych materiałów nadal łapie 51 px.
- unit-renderer-overlay-sync: 17/0. city-badge-zoom-lod: 67/0.
- vite build HEAD poza repo (`/tmp/civ-mem2-fc-head`, usunięty): index.html 70 642 686 B (+0,47% vs baza), bundle 70 640 884 znaków, 0 spoza ASCII;
  jedyny inny `<script>` 1240 znaków, 2 spoza ASCII (zgodne z S1b).
- Niepowtórzone (logi obrony/Operatora z `EXIT=`, uzasadnienie: zmiana obrony ogranicza tylko zakres puli w rendererach): visual-parity r2 4/0,
  ascii-bundle static r2 18/0, ai-test 274/20, war-allin, mgla 39/3, unit-replace 3/15, 100 tur.

ORZECZENIA:
- Z1 (cel 100 MB niespełniony): ODDAL. Cel „docelowo”, wynik −74,9 MB t.100 / −71,5 MB t.1 raportowany uczciwie; kryteria binarne spełnione.
- Z2 (kandydat B bez pomiaru): ODDAL. Obrona zmierzyła górną granicę 40,7 MiB (V8, 475 żetonów, `gate-z2-unit-merge-upper-bound.txt`) i wskazała
  realne bariery piksel-w-piksel (SmallPartLod, kolejność rysowania, tinty per materiał). Wdrożenie = osobny temat.
- Z3 (100 tur nie na HEAD po rebase): ODDAL. Pomiar 10 tur na HEAD obrony zgodny z pomiarem Evaluatora (t.10 225,3 = 225,3 MB, ta sama trajektoria 48/60/68 jedn., 42 miasta).
- Z4 (brak normalizacji per jednostkę): ODDAL. Normalizacja dodana jako szacunek (~−91,5 MB t.100), powtarzalność PRZED/PRZED jawnie NIE ZMIERZONO; błąd zachowawczy.
- Z5 (opis S1): ODDAL — poprawione (opis S1 + nowa kontrola S1b); zweryfikowane własnym buildem.
- Z6 (globalna pula przypina geometrie po podmianie rendererów): ODDAL — naprawione w 53d399b06; kontrpróbka na starej puli potwierdza zarzut, P5 potwierdza naprawę (uruchomione przez FC).
- Brak zarzutów NAPRAW. DO DECYZJI CZŁOWIEKA (poza tym tematem, nie blokuje): wspólne materiały (~−10…16 MB kosztem 51 px różnicy kolejności rysowania) — pytanie ABC orkiestratora.

INTEGRACJA:
- SHA końcowy do integracji: HEAD tego commita FC (na 53d399b06); kod = 53d399b06.
- Kolejność: na `origin/main` (55e098dc5) jako fast-forward; niezależnie od `origin/rust-port/parity-v2` (b520768b0) — parity-v2 od merge-base
  f4c89d008 nie dotyka `gra/vite.config.ts`, `gra/src/render/{units,cities,geometryContentPool}.ts`, `gra/tools/memory-static-*` ani tego runu.
  Najpierw main; ewentualny późniejszy merge main→parity-v2 / REPIN Rust bez konfliktu w tych plikach.
- Rekomendacja: osobny temat dla kandydata (B) z celem ≤ 40,7 MiB; pomiar powtarzalności 100 tur w tym samym buildzie.

BLOKADY: brak. Sprzątanie: build `/tmp/civ-mem2-fc-head` usunięty, `gra/node_modules` usunięty po pracy.
RUNDY: 1/5 (Final Control po obronie r1)
NASTĘPNY KROK: integracja orkiestratora na `origin/main` → READY_FOR_DEPLOY (wystawia orkiestrator).
DEPLOY-PUSH: NIE WYKONANO

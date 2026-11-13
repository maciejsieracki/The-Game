STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — pamięć stała: bundle i modele jednostek/miast
TEMAT: R-WEB-MEMORY-STATIC-FOOTPRINT-Q1
GOAL: zmierzone zmniejszenie pamięci po GC (t.1/t.50/t.100, seed 4242, mgła OFF) bez zmiany wyglądu (piksel w piksel),
reguł gry i determinizmu AI; docelowo ≥ 100 MB mniej w t.100 względem `ea9c14daf`.

ZMIANY-COMMIT (baza `origin/main` 55e098dc5 po rebase, scalenie z PERF-LATE-GAME-LAG-HUD-Q2 bez konfliktów):
- `ed30cfeb101ad1f29b66f60dce6f279196222a3d` — `gra/vite.config.ts`: wtyczka `ascii-only-js` (`generateBundle`, po
  minifikacji, przed `viteSingleFile`) zamienia każdy znak spoza ASCII w gotowym JS na `\uXXXX` (eksport
  `escapeNonAsciiForJs`; ucieczka tożsamościowa `\ł` traci `\`). `gra/src/render/geometryContentPool.ts` (nowy):
  geometria modelu → jedna wspólna instancja o bitowo identycznej treści, licznik odwołań; wpięte w
  `UnitRenderer._registerToken/_disposeToken` i `CityRenderer._registerModel/_disposeModel`/podmianę modelu
  (`units.ts`, `cities.ts`: po kilka linii). Nowe testy `gra/tools/memory-static-*.cjs`.
- `5e3c0a8da611f43783d73255db0b242e5aceb693` — wycofanie wspólnych materiałów (patrz odrzucone), test pikseli modeli,
  DOM/Cywilopedia.
- `c3f414a1878ab446085836e3dbab44facc58c186` — pomiary, atrybucja, logi bramek. Raport: commit następny.
- Bez zmian: `main.ts`, `gra/data/**`, `gra-robocza/**`, `WERSJE.md`, `rust-port/**`, `src-tauri/**`, `battle/**`.

POMIAR (build produkcyjny, harness `memory-growth-rootcause-q1-measure.cjs`, MB po GC; szczegóły `memory-attribution.md`):
| tura | PRZED `ea9c14daf` | PO | Δ |
|---|---|---|---|
| 1 | 285,5 | 214,0 | −71,5 |
| 50 | 375,1 | 300,0 | −75,1 |
| 100 | 428,9 | 354,0 | −74,9 |
| MB/turę t.1→100 / t.50→100 | 1,45 / 1,08 | 1,41 / 1,08 | |

- Źródło skryptu (`ExternalStringData`): 147,9 → 78,1 MB (−69,8, stale od t.1).
- Geometrie: unikalne geometrie miast 9 359 → 191 (bufory 8,12 → 0,17 MB), `renderer.info.memory.geometries`
  2 573 → 943; w stanie porównywalnym t.30–t.40 zysk 6–12 MB, rośnie z liczbą miast.
- **Cel ≥ 100 MB w t.100 NIE osiągnięty** (−74,9 MB surowo). PO w t.100 ma 475 jednostek wobec 362 (+31%):
  trajektoria identyczna do t.~35, potem się rozjeżdża (jak w FALI 524; logika niezmieniona — hashe identyczne).
  Powtarzalności PRZED-vs-PRZED na 100 turach NIE_ZMIERZONO.

KANDYDACI:
- A bundle ASCII — WDROŻONE: −69,8 MB; `index.html` 70 298 849 → 70 631 678 B (+0,47%, limit 5%).
- B/C wspólne geometrie jednostek i miast — WDROŻONE: obraz 0 różnych pikseli (model i gra).
- Wspólne materiały (pula po stanie + kopia przy zapisie dla przyciemnienia) — ODRZUCONE mimo ~10 MB (wariant
  zmierzony: t.100 −91,5 MB): **51 px z 1,6 mln różni się**, bo three.js sortuje nieprzezroczyste obiekty po
  `material.id` → inny wynik z-fightingu ścian współpłaszczyznowych. Wymóg „piksel w piksel” — decyzja dla orkiestratora/
  właściciela, czy taka różnica jest dopuszczalna.
- Scalanie statycznych części modeli (Object3D) — nie robione (animacje/picking na dzieciach).
- Literały base64 audio/obrazów (62 MB) trzymane drugi raz jako stringi — do −62 MB, poza allowlistą.

TESTY (logi `gate-*.txt`, każdy z `EXIT=`):
- `memory-static-ascii-bundle-test --chromium` 25/0: skrypt PO 0 znaków spoza ASCII; esbuild(PRZED)+ucieczki ==
  esbuild(PO) bajt w bajt (jedyne różnice: literały regex); 12 przypadków brzegowych (regex `u`/bez, klasa,
  `\ł`, spoza BMP, identyfikator, U+2028); DOM menu i `?playtest=mapa` (textContent bez skryptów, innerText,
  title/aria) identyczny; Cywilopedia: 22 pozycje, 322 773 znaków identyczne.
- `memory-static-model-pool-pixel-test` 6/0: 194 modele (wszystkie kategorie + 75 nazw z units.json, miasta
  kamień/brąz/Rzym), klatka przed == po: 0/1 600 000 px; kontrola czułości (wspólne materiały) 51 px; picking ten sam.
- `memory-static-geometry-pool-test` 14/0: 35 520 meshy treść bitowo ta sama, 6 954 → 1 705 geometrii, brak
  przedwczesnego `dispose`, po zwolnieniu pula pusta.
- `memory-growth-visual-parity-test`: `ea9c14daf`-prod vs PO 0 px (V1/V2 any=0); rebased `55e098dc5` vs HEAD 0 px.
- `memory-growth-improvement-cpu-release-test` 20/0, `memory-growth-merge-index-test` 24/0,
  `unit-deferred-reveal-dim-real-render-test` 19/0, `capture-render-sync-test` 23/0,
  `unit-renderer-overlay-sync-test` 17/0, `city-badge-zoom-lod-test` 67/0, `camera-zoom-block-test` 4/0,
  `river-fog-visibility-test` 31/0.
- tsc EXIT=0 (po rebase); logic 213/213; ai-test 274/20 (te same 20 FAIL co w bazie, md5 linii FAIL równe);
  `war-allin-capital-quick` hashe identyczne z bazą; tech-tree 19/0, research 33/0, combat 6/6.
- Pre-istniejące czerwone (niezależne od tematu): mgla-sciezka-inwariant 39/3, unit-replace 3/15 NIEUDANE (jak w
  FALI 524), `ai-city-render-batch-test` — asercja na tekście `main.ts`, którego temat nie zmienia (diff pusty).

BLOKADY: brak. Uwagi: (1) pierwszy przebieg PRZED padł w t.41 (przeglądarka zamknięta z zewnątrz przy load 6–9) —
powtórzony, dane zachowane; (2) `gra/node_modules` tylko jako dowiązanie do `npm ci --ignore-scripts` w kopii
`/tmp/civ-mem2-base` na czas bramek, usunięte; buildy vite wyłącznie poza repo, katalogi `/tmp/civ-mem2-*` usunięte.
ZAŁOŻENIE: pomiar na buildzie produkcyjnym (zminifikowanym), nie `--minify false` jak w FALI 524 — liczy się bundle
wydania; obie strony porównania tym samym trybem.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus 5.5, medium) — w tym ocena, czy wspólne materiały (−10 MB, 51 px z-fightingu) wracają
jako decyzja właściciela.
DEPLOY-PUSH: NIE WYKONANO

# REPIN-DELTA-5B — pomiar dryfu 76 plików webu poza zakresem REPIN-DELTA-5

**Temat:** `R-RUSTPORT-REPIN-DELTA-5B-Q1` · **Runda:** 1/5 · **Rola:** Operator · **Domena:** PROCESS (dokumentacja, zero zmian w kodzie gry)

## 1. Baza, metoda, klasyfikacja

| Element | Wartość |
|---|---|
| Pin logiki (początek dryfu) | `4bbef081d` (z REPIN-DELTA-5 §1) |
| Baza web (koniec pomiaru) | `1da227738` = `origin/main` w chwili startu. Dispatch: „origin/main (1da227738 lub nowszy)” — spełnione. Późniejszy `origin/main` = `a61337844` zmienia wyłącznie `CLAUDE.md` (0 plików `gra/`), więc pomiar nie wymaga przeliczenia |
| Zakres 76 plików | `git diff --name-only 4bbef081d origin/main -- gra/src gra/data` minus `gra/src/game/**` i `gra/data/**` = wszystko pod `gra/src/` poza `gra/src/game/` (76) |
| Jednostka „hunk” | blok `@@` z `git diff -U0 4bbef081d origin/main -- <plik>` |
| Asercja (kryterium końca) | dla każdego z 76 plików suma linii `+`/`−` z hunków == `git diff --numstat` — **ZGODNE (76/76)**; 13 plików `.mp3` to binarne (`-	-` w numstat), 0 hunków, pomijane w sumach |
| Suma zakresu 76 | 1085 hunków · +8193 / −1434 (= `git diff --shortstat` dla `gra/src gra/data` minus 91 plików `gra/src/game`+`gra/data`: 16674/2338 − 8481/904) |
| Skrypt | `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DELTA-5B-Q1/repin-delta-5b.py` (generuje ten plik; asercja w kodzie) |

**Klasy (ZAŁOŻENIE-H — klasyfikacja HEURYSTYCZNA, nie ręczne czytanie każdego hunka):**
- **PERF-bez-wpływu** — każda zmieniona linia to komentarz, pusta linia albo `import` (ZAŁOŻENIE-1 z REPIN-5).
- **DANE** — plik `.json` (zmiana wartości/kształtu danych).
- **UI** — pliki `gra/src/ui/`, `gra/src/render/`, `gra/src/audio/`; w `minimap.ts` gdy ≥50% zmienionych linii zawiera słowa UI/DOM (`document.`, `innerHTML`, `hud`, `panel`, `tooltip`, `render`, `minimap`, …). Dla `main.ts` działają DWIE reguły, które dają różne wyniki (jawnie, bez ukrywania): (a) wiersz §3 — ta sama reguła ≥50% słów UI per hunk (`classify_file_hunk`): UI 31; (b) §4 — per obszar słów kluczowych (`classify_main_hunk`): UI tylko w obszarze `UI-HUD-PANELE-USTAWIENIA` i tylko gdy ≥50% słów UI: UI 8. Hunki UI w innych obszarach (np. SIEGE, BITWA, ARMIA) są w §4 liczone jako LOGIKA — to zaniża UI w §4.
- **LOGIKA** — wszystko inne (`battle/`, `map/`, `units/`, `data/*.ts`, `types/`, reszta `main.ts`).
- **Ograniczenie:** heurystyka może pomylić UI z LOGIKA w `main.ts` (plik to jeden `boot()` na ~45 tys. linii). Niepewne przypadki NIE są rozstrzygane — patrz §5. Wartości hunków i +/− są zmierzone, klasy są oszacowane.

**Przypisanie tematu i modułu (ZAŁOŻENIE-T):** regułą katalogową/nazwową wg `PLAN-PORT-RUST-TAURI-20261020.md` §0c (tematy #2–#8) oraz etykiet NOWY-1…7 z REPIN-DELTA-5 §7. Nazwy modułów Rust (`*.rs`) są **docelowe** — NIE sprawdzono ich istnienia w `rust-port/engine/src/domain/` (NIE_ZMIERZONO).

## 2. Podsumowanie klas (76 plików; main.ts w klasach per plik)

| Klasa | Hunki | Udział |
|---|---:|---:|
| LOGIKA | 581 | 53.5% |
| UI | 409 | 37.7% |
| DANE | 2 | 0.2% |
| PERF | 93 | 8.6% |
| BIN | 0 | 0.0% |
| **Razem** | **1085** | 100% |

Dla porównania: REPIN-DELTA-5 (91 plików `gra/src/game`+`gra/data`, baza 59868d84f) = 626 hunków. Hunki `main.ts` w tabeli per plik: 483 (LOGIKA 421, UI 31, PERF 31); podział per obszar — §4.

## 3. Tabela plików (wiersz dla każdego z 76)

Kolumny: hunki (`-U0`) · `+/−` (= `numstat`, asercja OK) · L/D/U/P/B = LOGIKA/DANE/UI/PERF/BIN (heurystyka) · temat docelowy · moduł Rust docelowy.

| # | Plik (web, `gra/src/…`) | Hunki | +/− | L/D/U/P/B | Temat | Moduł Rust docelowy |
|---:|---|---:|---|---|---|---|
| 1 | `audio/civMusic.ts` | 1 | +48/−0 ✓ | 0/0/1/0/0 | P7 AUDIO (poza §0c) | — (audio, P7) |
| 2 | `audio/filePlayer.ts` | 12 | +73/−12 ✓ | 0/0/10/2/0 | P7 AUDIO (poza §0c) | — (audio, P7) |
| 3 | `audio/utwory/dyplomacja/_civ/chinczycy/chinczycy_negocjacje.mp3` | 0 | +0/−0 ✓ | 0/0/0/0/0 | P7 AUDIO (asset binarny) | — (asset, poza silnikiem) |
| 4 | `audio/utwory/dyplomacja/_civ/chinczycy/chinczycy_przywitanie.mp3` | 0 | +0/−0 ✓ | 0/0/0/0/0 | P7 AUDIO (asset binarny) | — (asset, poza silnikiem) |
| 5 | `audio/utwory/dyplomacja/_civ/egipt/egipt_negocjacje.mp3` | 0 | +0/−0 ✓ | 0/0/0/0/0 | P7 AUDIO (asset binarny) | — (asset, poza silnikiem) |
| 6 | `audio/utwory/dyplomacja/_civ/egipt/egipt_przywitanie.mp3` | 0 | +0/−0 ✓ | 0/0/0/0/0 | P7 AUDIO (asset binarny) | — (asset, poza silnikiem) |
| 7 | `audio/utwory/dyplomacja/_civ/grecy/grecy_negocjacje.mp3` | 0 | +0/−0 ✓ | 0/0/0/0/0 | P7 AUDIO (asset binarny) | — (asset, poza silnikiem) |
| 8 | `audio/utwory/dyplomacja/_civ/grecy/grecy_przywitanie.mp3` | 0 | +0/−0 ✓ | 0/0/0/0/0 | P7 AUDIO (asset binarny) | — (asset, poza silnikiem) |
| 9 | `audio/utwory/dyplomacja/_civ/inkowie/inkowie_negocjacje_1.mp3` | 0 | +0/−0 ✓ | 0/0/0/0/0 | P7 AUDIO (asset binarny) | — (asset, poza silnikiem) |
| 10 | `audio/utwory/dyplomacja/_civ/inkowie/inkowie_negocjacje_2.mp3` | 0 | +0/−0 ✓ | 0/0/0/0/0 | P7 AUDIO (asset binarny) | — (asset, poza silnikiem) |
| 11 | `audio/utwory/dyplomacja/_civ/rzymianie/rzymianie_negocjacje.mp3` | 0 | +0/−0 ✓ | 0/0/0/0/0 | P7 AUDIO (asset binarny) | — (asset, poza silnikiem) |
| 12 | `audio/utwory/dyplomacja/_civ/rzymianie/rzymianie_przywitanie.mp3` | 0 | +0/−0 ✓ | 0/0/0/0/0 | P7 AUDIO (asset binarny) | — (asset, poza silnikiem) |
| 13 | `audio/utwory/dyplomacja/_civ/sumer/sumer_przywitanie.mp3` | 0 | +0/−0 ✓ | 0/0/0/0/0 | P7 AUDIO (asset binarny) | — (asset, poza silnikiem) |
| 14 | `audio/utwory/dyplomacja/_civ/zulusi/zulusi_negocjacje.mp3` | 0 | +0/−0 ✓ | 0/0/0/0/0 | P7 AUDIO (asset binarny) | — (asset, poza silnikiem) |
| 15 | `audio/utwory/dyplomacja/_civ/zulusi/zulusi_przywitanie.mp3` | 0 | +0/−0 ✓ | 0/0/0/0/0 | P7 AUDIO (asset binarny) | — (asset, poza silnikiem) |
| 16 | `battle/battleScene.ts` | 66 | +647/−94 ✓ | 59/0/0/7/0 | #7 OBLEZENIE-ZDOBYCZE | combat.rs (docelowy) |
| 17 | `battle/mapFieldBattle.ts` | 7 | +16/−1 ✓ | 6/0/0/1/0 | #7 OBLEZENIE-ZDOBYCZE | combat.rs (docelowy) |
| 18 | `battle/siegeWall.ts` | 4 | +213/−0 ✓ | 4/0/0/0/0 | #7 OBLEZENIE-ZDOBYCZE | siege_wall (docelowy, nowy modul) |
| 19 | `battle/testBattle.ts` | 2 | +22/−1 ✓ | 2/0/0/0/0 | — (harness testowy) | — |
| 20 | `data/map-gen-params-loader.ts` | 1 | +8/−0 ✓ | 1/0/0/0/0 | NOWY-6 NAZWY-STOLICE / mapgen | map_generator.rs (loader parametrow, docelowy) |
| 21 | `data/wikiBundle.json` | 1 | +1/−1 ✓ | 0/1/0/0/0 | — (wiki/pomoc, poza silnikiem) | — |
| 22 | `main.ts` | 483 | +2841/−463 ✓ | 421/0/31/31/0 (reguła ogólna §1; podział per obszar §4 — rozbieżność jawna, patrz uwaga pod §4) | rozbity na obszary: sekcja 3 | rozbity: sekcja 3 |
| 23 | `map/cluster-spawn.ts` | 5 | +9/−8 ✓ | 5/0/0/0/0 | P6.M mapgen (poza §0c) | map_generator.rs / clusters (docelowy) |
| 24 | `map/clusters.ts` | 48 | +160/−37 ✓ | 46/0/0/2/0 | P6.M mapgen (poza §0c) | map_generator.rs / clusters (docelowy) |
| 25 | `map/freshwater.ts` | 1 | +172/−0 ✓ | 1/0/0/0/0 | P6.M mapgen / woda (poza §0c) | freshwater.rs (docelowy) |
| 26 | `map/gen-helpers.ts` | 3 | +203/−1 ✓ | 2/0/0/1/0 | P6.M mapgen (poza §0c) | map_generator.rs / clusters (docelowy) |
| 27 | `map/generator.ts` | 4 | +8/−0 ✓ | 4/0/0/0/0 | P6.M mapgen (poza §0c) | map_generator.rs / clusters (docelowy) |
| 28 | `map/improvement-build.ts` | 11 | +134/−30 ✓ | 9/0/0/2/0 | #3 AUTOIMPROVE | auto_improvements.rs / improvements.rs (docelowy) |
| 29 | `map/map-attack-city.ts` | 5 | +26/−1 ✓ | 4/0/0/1/0 | #7 OBLEZENIE-ZDOBYCZE | combat.rs (docelowy) |
| 30 | `map/minimap.ts` | 2 | +3/−10 ✓ | 1/0/0/1/0 | P7 UI (minimapa) | — (UI, P7) |
| 31 | `map/newGameMapDefaults.ts` | 2 | +5/−5 ✓ | 1/0/0/1/0 | NOWY-6 NAZWY-STOLICE / mapgen | map_generator.rs (docelowy) |
| 32 | `map/range-hexes.ts` | 4 | +33/−7 ✓ | 3/0/0/1/0 | P6.M mapgen (poza §0c) | map_generator.rs / clusters (docelowy) |
| 33 | `map/terrain-names.ts` | 1 | +57/−0 ✓ | 1/0/0/0/0 | P6.M mapgen (poza §0c) | map_generator.rs / clusters (docelowy) |
| 34 | `map/territory-work.ts` | 2 | +13/−6 ✓ | 1/0/0/1/0 | #3 AUTOIMPROVE | auto_improvements.rs / improvements.rs (docelowy) |
| 35 | `map/territory.ts` | 1 | +129/−0 ✓ | 1/0/0/0/0 | P6.M mapgen (poza §0c) | map_generator.rs / clusters (docelowy) |
| 36 | `render/cities.ts` | 10 | +30/−8 ✓ | 0/0/8/2/0 | P7 RENDER (REPIN-RENDER-4, nowy) | — (renderer P7) |
| 37 | `render/geometryContentPool.ts` | 1 | +184/−0 ✓ | 0/0/1/0/0 | P7 RENDER (REPIN-RENDER-4, nowy) | — (renderer P7) |
| 38 | `render/improvements.ts` | 2 | +7/−1 ✓ | 0/0/2/0/0 | P7 RENDER (REPIN-RENDER-4, nowy) | — (renderer P7) |
| 39 | `render/mapRenderStyle.ts` | 1 | +5/−1 ✓ | 0/0/1/0/0 | P7 RENDER (REPIN-RENDER-4, nowy) | — (renderer P7) |
| 40 | `render/materialContentPool.ts` | 1 | +212/−0 ✓ | 0/0/1/0/0 | P7 RENDER (REPIN-RENDER-4, nowy) | — (renderer P7) |
| 41 | `render/mergeDecor.ts` | 3 | +105/−2 ✓ | 0/0/3/0/0 | P7 RENDER (REPIN-RENDER-4, nowy) | — (renderer P7) |
| 42 | `render/resources.ts` | 1 | +11/−0 ✓ | 0/0/1/0/0 | P7 RENDER (REPIN-RENDER-4, nowy) | — (renderer P7) |
| 43 | `render/scene.ts` | 2 | +4/−0 ✓ | 0/0/1/1/0 | P7 RENDER (REPIN-RENDER-4, nowy) | — (renderer P7) |
| 44 | `render/smallPartLod.ts` | 1 | +137/−0 ✓ | 0/0/1/0/0 | P7 RENDER (REPIN-RENDER-4, nowy) | — (renderer P7) |
| 45 | `render/styleResources.ts` | 3 | +11/−1 ✓ | 0/0/1/2/0 | P7 RENDER (REPIN-RENDER-4, nowy) | — (renderer P7) |
| 46 | `render/unitStaticMerge.ts` | 1 | +322/−0 ✓ | 0/0/1/0/0 | P7 RENDER (REPIN-RENDER-4, nowy) | — (renderer P7) |
| 47 | `render/units.ts` | 18 | +96/−15 ✓ | 0/0/16/2/0 | P7 RENDER (REPIN-RENDER-4, nowy) | — (renderer P7) |
| 48 | `types/resources.ts` | 1 | +4/−1 ✓ | 0/0/0/1/0 | #2 EKONOMIA-F | resource typy (docelowy: resource_production.rs) |
| 49 | `ui/armyMergePanel.ts` | 31 | +135/−107 ✓ | 0/0/28/3/0 | #6 AI-ARMIA (panel armii, UI) | — (UI; P7 kontroler v2) |
| 50 | `ui/armyMergePickPanel.ts` | 5 | +7/−4 ✓ | 0/0/4/1/0 | #6 AI-ARMIA (panel armii, UI) | — (UI; P7 kontroler v2) |
| 51 | `ui/armySplitPanel.ts` | 20 | +191/−86 ✓ | 0/0/17/3/0 | #6 AI-ARMIA (panel armii, UI) | — (UI; P7 kontroler v2) |
| 52 | `ui/armyStackHud.ts` | 3 | +5/−1 ✓ | 0/0/2/1/0 | #6 AI-ARMIA (panel armii, UI) | — (UI; P7 kontroler v2) |
| 53 | `ui/armyStackLabel.ts` | 1 | +35/−0 ✓ | 0/0/1/0/0 | #6 AI-ARMIA (panel armii, UI) | — (UI; P7 kontroler v2) |
| 54 | `ui/buildModeHud.ts` | 16 | +38/−78 ✓ | 0/0/15/1/0 | P7 UI (HUD/panele, REPIN-UI-4) | — (UI; P7 kontroler v2) |
| 55 | `ui/cityPanel.ts` | 76 | +223/−74 ✓ | 0/0/69/7/0 | #2 EKONOMIA-F (UI panel) | — (UI; P7 kontroler v2) |
| 56 | `ui/diplomacyTradeBasket.ts` | 2 | +3/−12 ✓ | 0/0/1/1/0 | #4 DYPLOMACJA-MULTIWAR (UI koszyk) | — (UI; P7 kontroler v2) |
| 57 | `ui/empireDetailPanel.ts` | 31 | +95/−29 ✓ | 0/0/28/3/0 | #2 EKONOMIA-F (UI panel) | — (UI; P7 kontroler v2) |
| 58 | `ui/empireDetailTypes.ts` | 3 | +4/−4 ✓ | 0/0/2/1/0 | #2 EKONOMIA-F (UI panel) | — (UI; P7 kontroler v2) |
| 59 | `ui/empireRecruitPanel.ts` | 1 | +192/−0 ✓ | 0/0/1/0/0 | #6 AI-ARMIA (panel armii, UI) | — (UI; P7 kontroler v2) |
| 60 | `ui/formatCompactNumber.ts` | 1 | +77/−0 ✓ | 0/0/1/0/0 | P7 UI (HUD/panele, REPIN-UI-4) | — (UI; P7 kontroler v2) |
| 61 | `ui/gamePauseMenu.ts` | 4 | +20/−0 ✓ | 0/0/4/0/0 | P7 UI (HUD/panele, REPIN-UI-4) | — (UI; P7 kontroler v2) |
| 62 | `ui/hexContextTooltip.ts` | 40 | +125/−123 ✓ | 0/0/37/3/0 | P7 UI (HUD/panele, REPIN-UI-4) | — (UI; P7 kontroler v2) |
| 63 | `ui/hud.ts` | 65 | +457/−86 ✓ | 0/0/62/3/0 | P7 UI (HUD/panele, REPIN-UI-4) | — (UI; P7 kontroler v2) |
| 64 | `ui/hudChip6c.ts` | 8 | +48/−2 ✓ | 0/0/7/1/0 | P7 UI (HUD/panele, REPIN-UI-4) | — (UI; P7 kontroler v2) |
| 65 | `ui/icons/brand/building-icon-map.json` | 1 | +1/−0 ✓ | 0/1/0/0/0 | P7 UI (HUD/panele, REPIN-UI-4) | — (UI; P7 kontroler v2) |
| 66 | `ui/icons/brand/buildings/bld-emporion.svg` | 1 | +1/−0 ✓ | 0/0/1/0/0 | P7 UI (HUD/panele, REPIN-UI-4) | — (UI; P7 kontroler v2) |
| 67 | `ui/minimapHud.ts` | 14 | +114/−36 ✓ | 0/0/13/1/0 | P7 UI (HUD/panele, REPIN-UI-4) | — (UI; P7 kontroler v2) |
| 68 | `ui/newGameFlow.ts` | 6 | +12/−2 ✓ | 0/0/6/0/0 | P7 UI (HUD/panele, REPIN-UI-4) | — (UI; P7 kontroler v2) |
| 69 | `ui/sidePanelEventFilter.ts` | 6 | +41/−15 ✓ | 0/0/3/3/0 | NOWY-5 ZDARZENIA-TURA (UI) | — (UI; P7 kontroler v2) |
| 70 | `ui/sidePanelEventTabs.ts` | 1 | +98/−0 ✓ | 0/0/1/0/0 | NOWY-5 ZDARZENIA-TURA (UI) | — (UI; P7 kontroler v2) |
| 71 | `ui/sidePanelHud.ts` | 15 | +84/−31 ✓ | 0/0/15/0/0 | P7 UI (HUD/panele, REPIN-UI-4) | — (UI; P7 kontroler v2) |
| 72 | `ui/sidePanelLayout.ts` | 1 | +7/−2 ✓ | 0/0/1/0/0 | P7 UI (HUD/panele, REPIN-UI-4) | — (UI; P7 kontroler v2) |
| 73 | `ui/siegeMapPanel.ts` | 4 | +36/−5 ✓ | 0/0/4/0/0 | #7 OBLEZENIE-ZDOBYCZE (UI) | — (UI; P7 kontroler v2) |
| 74 | `ui/unitRecruitCard.ts` | 7 | +19/−6 ✓ | 0/0/6/1/0 | #6 AI-ARMIA (panel armii, UI) | — (UI; P7 kontroler v2) |
| 75 | `ui/worldOverlayLayer.ts` | 1 | +8/−0 ✓ | 0/0/1/0/0 | P7 UI (HUD/panele, REPIN-UI-4) | — (UI; P7 kontroler v2) |
| 76 | `units/setup.ts` | 10 | +168/−25 ✓ | 9/0/0/1/0 | #6 AI-ARMIA (start jednostek, zwiadowca/stos) | unit setup (docelowy: units/setup.rs) |

## 4. `main.ts` — obszary funkcjonalne (483 hunki, +2841/−463)

Plik `main.ts` na `origin/main` ma ~45 500 linii; prawie cały kod to jedna funkcja `async function boot()` (kontekst każdego hunka = `boot`), więc podział idzie po **słowach kluczowych w zmienionych liniach** (reguła pierwszej zgodnej kategorii, ZAŁOŻENIE-K). Suma obszarów = 483 hunki (asercja OK). Klasy per obszar liczone tą samą heurystyką.

| Obszar | Temat / moduł docelowy | Hunki | +/− | L/U/P | Pierwsza linia (web) |
|---|---|---:|---|---|---:|
| EKONOMIA-HANDEL | #2 EKONOMIA-F / NOWY-3 | 47 | +124/−58 | 41/0/6 | 59 |
| SIEGE-OBLEZENIE | #7 OBLEZENIE-ZDOBYCZE | 63 | +872/−33 | 60/0/3 | 157 |
| INNE-NIESKLASYFIKOWANE | nowy temat (NIE_ZMIERZONO) | 73 | +108/−47 | 68/0/5 | 168 |
| MIASTA-ZDOBYCZE | #7 OBLEZENIE-ZDOBYCZE | 35 | +139/−12 | 35/0/0 | 213 |
| MAPA-TEREN-START | P6.M mapgen (poza §0c) | 36 | +140/−31 | 34/0/2 | 281 |
| ARMIA-AI | #6 AI-ARMIA | 59 | +243/−36 | 52/0/7 | 284 |
| NAZWY-MIASTA | NOWY-6 NAZWY-STOLICE | 7 | +11/−10 | 6/0/1 | 369 |
| AUTO-ULEPSZENIA-BUDOWA | #3 AUTOIMPROVE | 36 | +248/−104 | 35/0/1 | 626 |
| EPOKI-TECH-DANE | NOWY-2 ULEPSZENIA-EPOKA (epoki/tech) | 21 | +43/−18 | 20/0/1 | 880 |
| BITWA | #7 OBLEZENIE-ZDOBYCZE | 38 | +524/−23 | 38/0/0 | 884 |
| ZDARZENIA | NOWY-5 ZDARZENIA-TURA | 12 | +54/−3 | 12/0/0 | 1107 |
| DYPLOMACJA-WOJNA | #4 DYPLOMACJA-MULTIWAR / #5 | 37 | +278/−70 | 33/0/4 | 1265 |
| UI-HUD-PANELE-USTAWIENIA | P7 UI (REPIN-UI-4) | 17 | +55/−12 | 8/8/1 | 2838 |
| ZAPIS-MIGRACJE | #8 ZAPIS-MIGRACJE | 2 | +2/−6 | 2/0/0 | 42895 |

Suma kolumn L/U/P tej tabeli: 444/8/31 (= 483 hunków). Wiersz `main.ts` w §3 ma 421/31/31 (reguła ogólna §1). Rozbieżność UI (31 vs 8) wynika z dwóch reguł opisanych w §1; prawdziwa liczba UI w `main.ts` leży między nimi i NIE jest ustalona (NIE_ZMIERZONO).

Uwaga: obszar `INNE-NIESKLASYFIKOWANE` = hunki bez trafienia słów kluczowych — wymagają ręcznego przeglądu przy portowaniu (NIE_ZMIERZONO co do treści).

## 5. Luki, założenia i NIE_ZMIERZONO

- **NIE_ZMIERZONO — ręczna klasyfikacja hunków:** 1085 hunków (w tym 483 w `main.ts`) nie zostało przeczytanych jeden po drugim; klasy są heurystyką (§1). Do potwierdzenia przy portowaniu każdego tematu.
- **NIE_ZMIERZONO — istnienie modułów Rust:** nazwy `*.rs` w kolumnie „Moduł” są docelowe; nie sprawdzono `rust-port/engine/src/domain/` (`parity-v2` nie był otwierany w tym temacie).
- **NIE_ZMIERZONO — zachowanie:** nie uruchomiono webu, testów ani harnessów (zakaz builda). Żadne twierdzenie o zachowaniu nie pochodzi z wykonania.
- **Ruchomy cel (dryf po pomiarze REPIN-DELTA-5):** REPIN-5 mierzył do `59868d84f`; baza tego pomiaru to `1da227738`. Pliki zmienione w tym przedziale (`gra/src` + `gra/data`):
  - `gra/src/game/ai.ts` (+30/−2) — w zakresie 91 REPIN-5 — REPIN-5 jej nie widział, dryf do dopisania w tematach #2/#3/#6
  - `gra/src/game/turn-economy.ts` (+29/−12) — w zakresie 91 REPIN-5 — REPIN-5 jej nie widział, dryf do dopisania w tematach #2/#3/#6
  - `gra/src/main.ts` (+27/−16) — w zakresie 76 (już w §3/§4)
- **Pliki binarne:** 13 × `.mp3` w `gra/src/audio/utwory/dyplomacja/_civ/*` (`-	-` w numstat) — asset dla P7, bez logiki.
- **Wiki:** `gra/src/data/wikiBundle.json` (1 hunk, DANE) — dane pomocy/wiki, poza silnikiem.

## 6. Wnioski (ZAŁOŻENIA do potwierdzenia przez orkiestratora)

1. Zakres 76 plików to **1085 hunków, +8193/−1434** — większy niż zakres 91 plików `gra/src/game`+`gra/data` (8481/904). Nie porównywano z `parity-v2` ani z pinami UI/RENDER (NIE_ZMIERZONO).
2. Najwięcej logiki w `main.ts` (obszary §4) — głównie oblężenie/bitwa (#7), auto-ulepszenia (#3), armia (#6), dyplomacja/wojna (#4/#5). Hunki `main.ts` wywołują funkcje z `gra/src/game/` zmierzone w REPIN-5 — **nie sumować** obu zakresów bez deduplikacji po funkcji (NIE_ZMIERZONO, czy się pokrywają).
3. `gra/src/battle/*`, `gra/src/map/*`, `gra/src/units/setup.ts` to logika poza `gra/src/game/` (wcześniej nieopisana): kandydaci na nowe tematy NOWY-8 (mapgen/klastry, P6.M) i rozszerzenie #7 (bitwa/`siegeWall`).
4. Dane (`DANE`) poza `gra/data/` są jednym plikiem `.json` (wiki) i jednym `.ts` loaderem parametrów mapy — brak zmian kształtu, który łamałby loader P3.
5. Propozycja: po tym pomiarze orkiestrator decyduje, czy `main.ts` rozbić na 4–6 tematów (zamiast jednego „REPIN-MAIN”) — dispatch tego nie rozstrzyga.

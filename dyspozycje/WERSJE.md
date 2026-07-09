# WERSJE — jedyny rejestr wersji bundli (prowadzi: publikujący, czyli INTEGRATOR)

ZASADA: md5/stempel wpisuje się TYLKO tutaj, zaraz po publishu. Inne pliki linkują,
nigdy nie kopiują (stary system miał 4 sprzeczne „aktualne" md5 — nigdy więcej).
Format: data · md5 (pełne) · stempel z menu · co weszło (1 linia) · status.

## ROBOCZA (gra-robocza\Gra-ROBOCZA.html — wskazywana przez START.html)
- 2026-07-09 · **bc8b8e38b5c9737e16c53d24ea1d39a2** · stempel: ROBOCZA · bc8b8e38 · **NAPRAWA REGRESJI FOG (dekor mgły diff-based) + całość: FPS + DEKOR + ZASADY-ZWIERZĄT E1–E5** · **PROMOWANA DO KANONU** (gra-kanon bc8b8e38, KANON 39aa2a2c, FINALNA 5ccffe76) ·
  Regresja z DEKOR: `applyTerrainFog` skanował ~80–150k instancji dekoru per setFog → **fog 1,9 → 139,9 ms** (F9 Macieja). Fix: dekor dzieli stan mgły z bazą terenu (`dekorRefByHex`, diff w `setFog` — tylko zmienione heksy, ten sam `sig`); `applyZoomLodDecor` zostawia tylko `dekorGroup.visible`. Oczekiwane fog ~2 ms. tsc=0 · smoke OK · vite-direct · verify OK · **AKTUALNA = KANON** (autonomicznie, Maciej nieobecny — do testu wzrokowego po powrocie; git origin/main zabezpieczony). Log: `dyspozycje/OPTYMALIZACJE-FPS-LOG.md`.
- 2026-07-09 · **f69d1b0bc13c97c83df019e8ceba6ee4** · stempel: ROBOCZA · f69d1b0b · **FPS domknięty + DEKOR + ZASADY-ZWIERZĄT E1–E5** · ZASTĄPIONA (→ bc8b8e38: naprawa regresji fog dekoru; f69d1b0b miało fog 139,9 ms) ·
  Baza = kanon a1dce24d + prace sesji 2026-07-09. DEKOR wprowadził regresję fog (skan dekoru) — naprawione w bc8b8e38. hash mapy nietknięty (55aaa07c). tsc=0 · smoke OK · verify OK.
- 2026-07-09 · **5ff6abe0a97cf8be96cc26ec40944496** · stempel: ROBOCZA · 5ff6abe0 · **EKSPERYMENT B (pomiar): przełącznik `?nobottom=0` — heks bez/z dolnej pokrywy** · ZASTĄPIONA (→ f69d1b0b: B keep + FPS domknięty + DEKOR + ZASADY) ·
  Baza = kanon 2b6c23dd (GRAFIKA-3D + FPS 1+3) + `scene.ts` flaga `B_NO_BOTTOM`: domyślnie B WŁĄCZONE (jak kanon, ~25% mniej tri bazowych), a `?nobottom=0` w URL → pełny pryzm heksa (z dolną pokrywą) do porównania. Maciej mierzy F9 `tri` z-B (domyślnie) vs bez-B (`?nobottom=0`) na nowej bazie → werdykt keep/rewert B. tsc=0 · vite-direct · 9 plików + hub · verify OK · **AKTUALNA (pomiar F9 B)**. Źródło toggle niezacommitowane (czeka na werdykt).
- 2026-07-09 · **97d1b9cb2edfeb4a21205ffd12baae7f** · stempel: ROBOCZA · 97d1b9cb · **FPS lewar 1+3: scalanie dekoracji per-heks → 1 mesh + zamrożone macierze** · ZASTĄPIONA (→ promowana do KANON 2b6c23dd; robocza → 5ff6abe0 eksperyment B) ·
  Atak na anomalię z F9 `mesh 1,3 mln` (CPU: traversal/culling/macierze per obiekt). `render/mergeDecor.ts` `collapseToMergedMesh` scala grupę dekoracji (zwierzęta ~125 boxów/heks, budynki, złoża, wybrzeże/plaże/wydmy/oazy) w JEDEN mesh z vertex colors (fog-dimming zachowany przez własny materiał, jak w terenie). Wpięte: resourceOverlays, improvementMeshes (main.ts), styledOverlays (scene.ts). `matrixAutoUpdate=false` na statycznych (lewar 3). Fail-safe (błąd merge → grupa bez zmian). Oczekiwane: mesh 1,3 mln → ~dziesiątki tys.
  tsc=0 · merge unit-test 12/12 · map-gen determinizm IDENTYCZNY. UWAGA: smoke daje false-negative na instancingu terenu (stage-2) w jsdom — walidacja przez F9 Macieja. **BRAK: lewar 5** (chunking bazowego terenu = `tri 6,7 mln` GPU) — świadomie wstrzymany do potwierdzenia CPU-fixu na F9 (rdzeń renderu+fog, nie do wdrożenia na ślepo). vite-direct · 9 plików + hub · verify OK · **AKTUALNA (test F9 Macieja)**.
- 2026-07-09 · **ab5b8527a5a0912aeca7129948c402e7** · stempel: ROBOCZA · ab5b8527 · **GRAFIKA-3D KOMPLET: partie 1-3B + TEREN oba etapy (podmiana + 10 InstancedMesh) + stadnina quality** · ZASTĄPIONA (→ 97d1b9cb = +FPS lewar 1+3) ·
  Całość 64b633b1 + **TEREN stage 2**: góry/wzgórza (styl roblox) jako **10 InstancedMesh** (5+5 wariantów, wspólny TEREN_MATERIAL) zamiast per-heks styledOverlays — batching FPS. Pełna maszyneria FoW (matrix-hide nieodkryte/miasto + instanceColor-dim explored ×0.175), hide-on-hex, LOD, dispose. **Stadnina wg jakości**: WYSOKA=2 konie, NISKA/NORMALNA=1. FORT 1/3. Wysokości logiczne + hashe mapy nietknięte.
  tsc=0 · smoke OK · **map-gen determinizm IDENTYCZNY** · vite-direct (bez prebuildu) · 9 plików + hub na `ab5b8527` · verify OK · publikował CODE-INTEGRATOR · **AKTUALNA (wielki test Macieja z F9 — rano)**.
- 2026-07-09 · **64b633b1accdb80fd7948f1fd740ed59** · stempel: ROBOCZA · 64b633b1 · **GRAFIKA-3D partie 1-3B + TEREN stage 1** · ZASTĄPIONA (→ ab5b8527 = +TEREN stage 2 InstancedMesh + stadnina quality) ·
  Zawiera całość 27cb7771 (koń+lanca, pastwisko, budynki, osady, woda/wojsko/drogi, złoża) + **partia TEREN stage 1**: 5+5 wariantów sylwetek gór/wzgórz (`teren-gory-wzgorza.ts`, zmergowana geometria+vertex colors), `buildStyleMountainPeak`/`HillBump` roblox → nowy model = **1 mesh/heks zamiast 12-14** (spadek draw calls terenu). tsc=0 · smoke OK · **map-gen determinizm IDENTYCZNY** · verify OK · publikował CODE-INTEGRATOR · **AKTUALNA (test Macieja)**. BRAK: TEREN stage 2 (scene.ts 10 InstancedMesh = pełny batching FPS) — follow-up.
- 2026-07-09 · **27cb77715abf5ba302f5b737edd0cae6** · stempel: ROBOCZA · 27cb7771 · **GRAFIKA-3D partie 1+2+3A+3B (ROBLOX): koń+lanca, pastwisko, budynki, osady, woda/wojsko/drogi, złoża** · ZASTĄPIONA (→ 64b633b1 = +TEREN stage 1) ·
  P1 nowy koń (moduł kon-nowy-model, konnica/rydwan/onager + fix lancy) + pastwisko (krowa/owca/lama) + złoża bydła/owiec/koni. P2 farma/kopalnia/kamieniołom/tartak. P3A wyrąb/obóz/glinianka/warzelnia/łodzie/stadnina (własny model + konie). P3B irygacja/pole/fort(1/3)/posterunek/drogi/złoża mineralne. Bazuje na perf 00a372f4.
  tsc=0 · smoke OK · map-gen determinizm IDENTYCZNY (render-only, gen nietknięty) · vite-direct · 9 plików + hub na `27cb7771` · verify OK · publikował CODE-INTEGRATOR · **AKTUALNA (test Macieja)**. BRAK: partia TEREN (góry/wzgórza + instancing FPS) — follow-up.
- 2026-07-09 · **00a372f495e8f55ee9edaa4bf9a7914f** · stempel: ROBOCZA · 00a372f4 · **WYDAJNOŚĆ B + D4–D13 (zakładanie miasta 30 s→1,67 s, wejście do miasta 60 s→1,4 s) — diagnostyka zdjęta** ·
  lokalne enumeracje zamiast pełnomapowych skanów `Object.keys(map.hexes)`: D5/D6/D9 (wejście), **D13** `getQualifyingHexes` w `map/improvement-build.ts` = kandydaci [terytorium+ring ∪ drogi ∪ placed ∪ pendingUndo] zamiast 19×320k; D7 player-only, D10 event-trigger (dirty-flag), D11 gate minimapy, D12 dedup refreshFog/sync; B = geometria heksa bez dolnej pokrywy (~25% mniej tri). Czerwony box + timery serii D usunięte.
  tsc=0 · smoke OK · owner-economy 9/9 · wire-ekonomia 37/37 · qualify 44/44 · owner-epoch 7/7 · D13 równoważność candidate==full-scan (19/19 typów) · vite-direct (bez export-data.py) · 9 plików + hub na `00a372f4` · verify OK · publikował CODE-INTEGRATOR · **AKTUALNA** (→ promowana do KANON bbcacc13).
- 2026-07-08 21:27 · **dfa3f2e2f747059884aa6d2918250253** · stempel: 2026-07-08 21:27 · e6ba6cd5 · **B (test wydajności): heks bez dolnej pokrywy — ~25% mniej trójkątów bazowych** ·
  `hexPrismNoBottomGeo` w `render/scene.ts` (usunięta niewidoczna dolna pokrywa, boki+góra zostają → pixel-identycznie). tsc=0 · vite-direct
  (bez export-data.py) · 9 plików + hub na md5 `dfa3f2e2` · verify OK. NIEZACOMMITOWANE (build testowy do pomiaru F9: tri przed↔po; kanon 51c2eb24
  bezpieczny na GitHub 32dca78 = fallback). Po pomiarze: commit jeśli OK / rewert jeśli nie · publikował CODE-INTEGRATOR · **ZASTĄPIONA** (→ 00a372f4 = B + D4–D13 zacommitowane; kanon bbcacc13).
- 2026-07-08 19:50 · **51c2eb248aedac4f97a78854ad9b7422** · stempel: 2026-07-08 19:50 · 7fe722e3 · **WYDAJNOŚĆ D1+D3 na KANONIE `gra/src` + fix drzewka technologii przywrócony na live** · ZASTĄPIONA (→ dfa3f2e2 test B; ta wersja = KANON 8adcd682) ·
  Zbudowane z committed `gra/src` @ **865c94e** (wypchnięty na origin/main) — koniec ery deploy-only D1/D3, live=commit. vite-direct
  (bez `npm run build`/`export-data.py` → **balans zachowany**: Falanga=45). WSZYSTKIE 9 plików + hub na tym samym md5 `51c2eb24`
  (spójność). tsc=0 · bundle-gate HOST-verified: **drzew 88 / Nauka 129** (stary live c293647 miał 87/128 = **regres drzewka
  NAPRAWIONY**), viewBox 343, counterTyp 7 · FRESH≥LIVE i ==HEAD · publikował CODE-INTEGRATOR · **AKTUALNA (klucz=stempel)**.
- 2026-07-08 11:40 · stempel: 2026-07-08 11:40 · c293647ccedf · **WYDAJNOŚĆ D1+D3** (kolejka D1→D3→D2, osobno) ·
  D3 = usunięty zbędny `refreshFog()` z `applyCityPanelWorldView` (main.ts) — otwarcie panelu miasta nie zmienia wejść
  mgły (setFog no-op); widoczność miast ustawia `cityRenderer.sync()`; poprawność mgły zapewniają realne zdarzenia.
  `refreshFog();` 27→26 (usunięta dokładnie 1). + D1. Z HEAD bc51a01 (sejwy+HEAD zachowane). tsc=0 · vite OK · pending=0 ·
  10 plików · hub · HOST-verify · publikował INTEGRATOR · ZASTĄPIONA (→ 51c2eb24…, stempel 7fe722e3 · 2026-07-08 19:50 — właściwy build z committed `gra/src` @ 865c94e). D2 następne (osobno, +`?culling=0`).
- 2026-07-08 11:20 · stempel: 2026-07-08 11:20 · 6102654b5d60 · **WYDAJNOŚĆ D1** (kolejka Mastera D1→D3→D2, osobno) · ZASTĄPIONA (→ c293647ccedf) ·
  D1 = lokalna enumeracja heksów (helper `hexKeysWithinRadius`) zamiast pełnomapowych skanów `Object.keys(map.hexes)`
  przy otwarciu miasta — `okolicaTiles`/`hexesInCitySight`/`collectRangeKeys` (320k→~700, ~450×). Zbudowane z HEAD
  **bc51a01** (zawiera moduł sejwów Cursora + plony z Excela + panel B14 + drzewko tech — nic nie nadpisane; D1 dotyka
  tylko okolica.ts/resource-access.ts/cityOkolicaOverlay.ts). tsc=0 · vite OK · pending=0 · 10 plików · hub · HOST-verify ·
  publikował INTEGRATOR · AKTUALNA (klucz=stempel). Uwaga: podniosło live z 3b089468→bc51a01. D3, D2 następne (osobno).
- 2026-07-06 20:41 · stempel build 371151b5544247c1e66f93597770c2f8 · ROBOCZA · 371151b5 · 20:41 · ZASTĄPIONA (→ 6102654b5d60; między nimi buildy Cursora be32d0a8/58e76604/6e3027fe/3b089468 — wciągnięte przez bc51a01) ·
  SAVE/LOAD UX: dialog zapisu (nazwa sejwu) + dialog wczytywania (lista slotów, usuwanie);
  wczytanie z menu regeneruje mapę z seeda zapisu (fix „randomowa gra"); z-index dialog nad menu;
  Kontynuuj → wybór sejwu. tsc=0 · smoke OK · publish Cursor (wyjątek Macieja, bez Integratora)
- 2026-07-06 18:35 · <plik-md5 dryfuje> · stempel: 2026-07-06 18:35 · e4d99a49b659 ·
  FIX duplikatu „SUROWCE W ZASIĘGU" w panelu miasta (usunięte wywołanie `appendW4TabFooter` @6489 w
  `ui/cityPanel.ts`). + całość d744 (balans, countery, rzeki, KONTRAKT #8, UX, roster, obwódki, duże bitwy).
  tsc=0/vite OK · pending=0 · 9/9 · hub · HOST-verify. Build z klonu; do repo po pushu · AKTUALNA (klucz=stempel)
- 2026-07-06 18:10 · <plik-md5 dryfuje> · stempel: 2026-07-06 18:10 · d744cd7956fb · ZASTĄPIONA (→ e4d99a49b659) ·
  COUNTERY po polu `Typ` (counterMultiplier czyta `counterTyp` z def['Typ']) — włócznicy o opisowych
  nazwach dostają +50% vs konnica; `game/combat.ts` + `battle/battleScene.ts`. + całość 7fb9f6d3e8fb
  (balans HP×2/dyst×0.5, rzeki, KONTRAKT #8, UX, roster, obwódki, duże bitwy). tsc=0/vite OK · pending=0 ·
  9/9 · hub · HOST-verify. Build z klonu; do repo po pushu Macieja · publikował INTEGRATOR · AKTUALNA (klucz=stempel)
- 2026-07-06 17:55 · <plik-md5 dryfuje> · stempel: 2026-07-06 17:55 · 7fb9f6d3e8fb · ZASTĄPIONA (→ d744cd7956fb) ·
  BALANS-WALKI (wartości Macieja z uploadu Jednostki-PL0.xlsx): HP×2 + dystans×0.5 dla
  jedn. z polami EN; Falanga=40; 26 jedn. PL0 uzupełnione pola EN + Typ; 3 przemianowania
  (Legionarius→Legion Rzymski itd.); wszystkie 75 z Typ. + całość a9fffc3e (rzeki, KONTRAKT #8,
  UX, roster, obwódki, duże bitwy). tsc=0/vite OK · pending=0 · 9/9 · hub. Build z klonu na
  „wpinaj" Macieja; publikował INTEGRATOR
- 2026-07-06 16:52 · a9fffc3eeeb9 · stempel: 2026-07-06 16:52 · d3a3edb52848 · ZASTĄPIONA (→ 7fb9f6d3e8fb)
  BUILD ZBIORCZY z GitHub HEAD b1b9fed (pierwszy build po migracji na GitHub): rzeki
  „wodospad" (render-only, hash bezpieczny) + KONTRAKT #8 ikony jednostek (⚔️→SVG w
  stosie armii / panelu [H] / scal-rozdziel) + grafiki UX [16:20] (ikony surowców mapy
  + teren) + podmiany UX [16:40] (7× emoji→SVG) + całość d4d667d8 (siatka rostera 6 kol,
  obwódki właściciela, tonięcie, zaznaczenie, duże bitwy, port UX). tsc=0 · HOST-verified
  (stempel + owner-ring + resources-map + menu-save) · pending=0 · 9 plików spójne
  (wewn. stempel d3a3edb52848) · hub odświeżony · publikował INTEGRATOR · AKTUALNA
  (czeka na playtest Macieja). UWAGA: klucz wersji = WEWN. STEMPEL (md5 pliku dryfuje na OneDrive).
- 2026-07-06 13:47 · a76514621f02 · stempel: 2026-07-06 13:47 · bdc95d91be71 · ZASTĄPIONA (→ a9fffc3eeeb9)
  #4 ROSTER bitwy: słupek → SIATKA 6 kolumn (wg kanonu C09 v4 + DESIGN-SPEC v4;
  gridTemplateColumns repeat(6,minmax(0,1fr)) + gap 4 na roster-group-cards). Reszta
  jak 7ffa2859 (port UX + rzeki + obwódki + tonięcie + zaznaczenie + duże bitwy).
  tsc=0 · roster-group-cards HOST-verified · pending=0 · 9 plików · hub odświeżony ·
  publikował INTEGRATOR · AKTUALNA (czeka na playtest Macieja — OBIEG §9)
- 2026-07-06 12:46 · 7ffa28596769 · stempel: 2026-07-06 12:46 · c169df028365 · ZASTĄPIONA (→ a76514621f02)
  PORT UX wpięty (rebuild łączony): buildModeHud emoji→SVG (panel Ulepszeń) +
  brandAssets.improvementIconSvg + improvement-icon-map.json + cityPanel nowsza
  (karty budynków Poziom B + rekrutacja + ramka zakładek W4) + nowe unitRecruitCard.ts
  i unitInfographic.ts. Zawiera też całość d4d667d8 (rzeki+C3+B0.6+zoomLOD+obwódki+
  tonięcie+zaznaczenie+duże bitwy). tsc=0 · markery imp-farm/unitRecruit/owner-ring
  HOST-verified · pending=0 · hub+manifest odświeżone · 9 plików na tym md5 ·
  publikował INTEGRATOR · AKTUALNA (czeka na playtest Macieja — OBIEG §9)
- 2026-07-06 11:34 · d4d667d80ebb · stempel: 2026-07-06 11:34 · e47323c170ab · ZASTĄPIONA (→ 7ffa28596769)
  GŁÓWNA GRA odświeżona do najnowszego bundla (był desync — wisiała na 26730a2a).
  Zawiera: 26730a2a (rzeki+C3+B0.6+zoomLOD+UX) + obwódki właściciela jednostek
  (own=niebieski/wróg=czerwony) + zaznaczenie w kolorze właściciela + fix tonięcia
  na wzgórzach/górach + duże bitwy (arena, deploy:true). tsc=0 · marker civ-owner-ring
  HOST-verified · pending=0 · WSZYSTKIE playtesty na tym samym md5 (spójność) ·
  POLE-BITWY skasowany (niepodpięty do głównej gry) · publikował INTEGRATOR · AKTUALNA
- 2026-07-06 09:12 · 26730a2ab4ec9e11425a8a090d4b1caf · stempel: 2026-07-06 09:12 ·
  3b15f0bab7f6 · ZBIORCZY: rzeki (bezUjscia=0/sieroc=0) + C3 porcjowana scena +
  **B0.6 frustumCulled=false ×12 (zalany ląd)** + zoom LOD A1+A4 + B1-B2 (sanitizeCoast
  BFS + early-exit) + panel „Moc imperium v3" (UX) · tsc=0 · weryfikacja PASS ·
  hash ziemia/42=4284176530 (determinizm) · stempel HOST-side POTWIERDZONY · publikował
  INTEGRATOR (bash-first /tmp/build, srcKopiaMaster=lustro) · ZASTĄPIONA (→ d4d667d80ebb)
- 2026-07-06 01:01 · bc04038ffd30db33d9ed5e1a81c83ee4 · stempel: 2026-07-06 01:01 ·
  fc15d6ca71c4 · RZEKI KOMPLET (każda główna z ujściem, zero sierocych delt,
  pruneOrphanRiverPaths) + całość batchy z wczoraj; UWAGA: UI w wersji sprzed
  batcha T4b-T5 (odtworzenie UI od zera = następny build) · publikował MASTER
  awaryjnie (decyzja Macieja); stempel zweryfikowany HOST-side · ZASTĄPIONA (→ 26730a2ab4ec)
- 2026-07-06 ~03:40 · f199c4c808e6… · stempel: BŁĄD (PENDING — deploy niestemplowanej
  kopii) · rzeki domknięte (bezUjscia=0, sieroc=0) + całość z 22:37 · DO POPRAWKI
  (integrator przestemplowuje — patrz kanał [03:50])
- 2026-07-05 ~22:37 · b04524f11a87ebb65df3871332f301d7 · 2026-07-05 · d3b1aee7f5af ·
  overlay+worker, B0.9, panel wydajności, A5, H1, rzeki I1/I2 · ZASTĄPIONA
- 2026-07-05 17:37 · 23d76157a8e3610b9eaae454bb97bdb5 · (bez stempla w menu) ·
  ostatni publish Cursora sprzed przejęcia · ZASTĄPIONA

## PLAYTESTY-BITWY (osobne pliki testowe w gra-robocza\ — nie główna gra)
- 2026-07-06 10:53 · 486a65094ddb · stempel: 2026-07-06 10:53 · 4771ec9ba9f0 ·
  DWIE DUŻE BITWY jako ARENA taktyczna: `Gra-ROBOCZA-PLAYTEST-BITWA-DUZA.html` (pole) +
  `Gra-ROBOCZA-PLAYTEST-OBLEZENIE-DUZE.html` (mur). Na boot odpalają PROSTO `BattleScene`
  (armia vs armia), z pominięciem mapy świata. Skład/strona: 10 Hastati/Falanga + 10 Łucznik
  + 8 Konnica (konnica na skrzydłach). Oblężenie: defCiv=grecja + machiny u atakującego
  (ensureSiegeMachines). Presety `bitwa_duza_pole`/`oblezenie_duze` + `launchBigPresetBattle`.
  tsc=0 · markery arena HOST-verified · pending=0 · źródło w srcKopiaMaster · AKTUALNA
- 2026-07-06 10:32 · e893f8bfd47c · stempel: 773234ea3a68 · WERSJA MAPOWA (28 jedn./stronę
  rozstawione na MAPIE ŚWIATA) — ZŁY POZIOM, Maciej chciał areny · ZASTĄPIONA (→ 486a65094ddb)

## KANON (gra-kanon\)
- 2026-07-09 · **a1dce24d80b1ed64e906b9715d11def6** · stempel KANON: **a1dce24d** · źródło robocza md5 **7dd9bb7a46dd** · promocja PO stabilizacji FPS (Maciej „push do kanonu"). Zawartość = całość 2b6c23dd (GRAFIKA-3D KOMPLET + FPS lewar 1+3, F9 **52 FPS**, mesh 1,3mln→39k) + **B sfinalizowane** (heks bez dolnej pokrywy zostaje; toggle ?nobottom=0) + **naprawa smoke** (async-poll, koniec false-negative na instancingu) + **optymalizacja minimapy** (cache getMinimapData + pomijanie mgły w renderze; hitch ~795ms przy zakładaniu miasta). publikował CODE-INTEGRATOR (publish-kanon-snapshot.ps1) · **AKTUALNA**
- 2026-07-09 · **2b6c23dd4e15d5caf4941107d2c03a8d** · stempel KANON: **2b6c23dd** · źródło robocza md5 **97d1b9cb2edf** · promocja PO GRAFICE-3D + FPS (decyzja Macieja [12:55]; F9: FPS 25 · draw 835). Zawartość = całość bbcacc13 (B + D4–D13) + GRAFIKA-3D KOMPLET + FPS lewar 1+3. publikował CODE-INTEGRATOR · **ZASTĄPIONA** (→ a1dce24d, 2026-07-09)
- 2026-07-09 · **bbcacc138dde46ec0b0f136e3097c283** · stempel KANON: **bbcacc13** · źródło robocza md5 **00a372f495e8** · promocja PO pracy nad wydajnością (Maciej: „kanon plus git działaj start"). Zawartość = B (geometria heksa) + D4–D13 (zakładanie 30 s→1,67 s, wejście 60 s→1,4 s), diagnostyka zdjęta; **poprawność ekonomii zachowana** (lokalne enumeracje == pełne skany, D13 równoważność 19/19). Bazuje na 51c2eb24 (D1/D3 + drzewko + balans). publikował CODE-INTEGRATOR (publish-kanon-snapshot.ps1) · **ZASTĄPIONA** (→ 2b6c23dd, 2026-07-09)
- 2026-07-08 21:02 · **f2dcbbb8d9e7707d779d310ecff9a643** · stempel KANON: **8adcd682** · źródło robocza md5 **51c2eb248aed** · promocja z roboczej PRZED pracą nad wydajnością (Maciej: „wypchnij obecną wersję do kanonu"). Zawartość = live D1/D3 (miasto szybko + mgła) + fix drzewka NA GÓRZE + balans/countery/plony/rzeki/ikony; źródło `865c94e` na origin. **Bez** eksperymentu B (geometria heksa). publikował CODE-INTEGRATOR (publish-kanon-snapshot.ps1) · **ZASTĄPIONA** (→ bbcacc13, 2026-07-09)
- 2026-07-06 20:17 · **7856d3451a0cb3963bd3c50c032f5ad5** · stempel wewn.: **d744cd7956fb**
  (2026-07-06 18:10) · promocja Cursor Grupa G z roboczej (Maciej: playtest OK + GitHub
  bad0c7f). Zawartość: rzeki wodospad, KONTRAKT #8 ikony, UX emoji→SVG, siatka rostera
  6 kol., obwódki właściciela, duże bitwy arena, port UX W4, balans HP×2/dyst×0.5,
  countery po polu `Typ`, C3/B0.6/Test wydajności/A5/H1. gra/src zsynchronizowane ze
  srcKopiaMaster. tsc=0 · smoke OK · publikował Cursor (publish-kanon-snapshot.ps1) · **ZASTĄPIONA** (→ 51c2eb24 / kanon 8adcd682, 2026-07-08 21:02)
- 2026-07-06 ~03:55 · skopiowany przez Cursora bundle f199c4c8 (ze stemplem PENDING) ·
  **ZASTĄPIONA** (→ 7856d345)

## FINALNA (root)
- 2026-07-09 · **fae546caae8d3220f18611418ca2efc0** · stempel FINALNA · zsynchronizowana z kanonem a1dce24d (źródło robocza 7dd9bb7a; GRAFIKA-3D + FPS 1+3 + minimapa; Gra-FINALNA.html) · **AKTUALNA**
- 2026-07-09 · **3a8dd4bb5c5e8691f37d5fd3d92a9ffa** · stempel FINALNA · zsynchronizowana z kanonem 2b6c23dd (źródło robocza 97d1b9cb; Gra-FINALNA.html) · **ZASTĄPIONA** (→ fae546ca, 2026-07-09)
- 2026-07-09 · **676809f2bdf06d7c5a55bfb45ad1469e** · stempel FINALNA · zsynchronizowana z kanonem bbcacc13 (źródło robocza 00a372f4; Gra-FINALNA.html) · **ZASTĄPIONA** (→ 3a8dd4bb, 2026-07-09)
- 2026-07-08 21:02 · **605761807eb0b79f43c047c4e70916f7** · stempel FINALNA · zsynchronizowana z kanonem 51c2eb24 (Gra-FINALNA.html) · **ZASTĄPIONA** (→ 676809f2, 2026-07-09)
- 2026-07-06 20:17 · **7856d3451a0cb3963bd3c50c032f5ad5** · zsynchronizowana z kanonem
  (Gra-FINALNA.html) · **ZASTĄPIONA** (→ 60576180)

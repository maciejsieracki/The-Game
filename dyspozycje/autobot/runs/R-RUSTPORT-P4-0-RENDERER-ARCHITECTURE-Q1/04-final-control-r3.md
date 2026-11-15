STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-0-RENDERER-ARCHITECTURE-Q1
GOAL: Final Control r3 dla dokumentu `dyspozycje/rust-port/p4/P4-0-RENDERER-ARCHITECTURE.md` po Evaluatorze r3 (16 zarzutów) i Obronie r3. Dla każdego zarzutu orzeczenie NAPRAW / ODDAL / DO DECYZJI CZŁOWIEKA, oparte na dowodzie.
ZMIANY/COMMIT: oceniany stan to `p4-0-obrona-r3` @ `80a261998` (baza `origin/claude/rust-sivvrn` @ `ad14b7fbd`; zawiera `d69411602` = cherry-pick raportu Evaluatora `509ee851e`). FC dodaje wyłącznie ten plik, na lokalnej gałęzi `p4-0-fc-r3`. Bez push.
TESTY: zero buildu, zero `npm`, zero `cargo`. Pin odczytany przez `git archive edb8fb56 gra/src` do scratchpada poza repo, potem `grep -n`/`sed -n`/`wc -l`. Stan decyzji sprawdzony przez `git show ad14b7fbd:dyspozycje/rust-port/LEDGER.md`, Tauri i renderer Rust przez `git show`/`git ls-tree origin/rust-port/parity-v2` @ `95930b446`. `git diff --check ad14b7fbd p4-0-obrona-r3` jest pusty. `git diff --name-only ad14b7fbd p4-0-obrona-r3` zwraca 3 pliki, wszystkie z allowlisty (dokument P4-0, `02-evaluator-r3.md`, `03-obrona-r3.md`).
BLOKADY: brak dla dokumentu. Uwaga procesowa P-1 niżej dotyczy orkiestratora.
RUNDY: 3/5
NASTĘPNY KROK: orkiestrator integruje `p4-0-fc-r3` (lub `80a261998` + ten raport) na `claude/rust-sivvrn`. Nowy wiersz LEDGER dla r3 z korektą wiersza `:111` (P-1). Opcjonalna kosmetyka U-1.
DEPLOY/PUSH: NIE WYKONANO

## Orzeczenia (16 zarzutów)

Każde orzeczenie sprawdziłem na pinie lub w Git. W kolumnie „Dowód FC” jest to, co sam odczytałem.

| # | Zarzut | Orzeczenie | Dowód FC (stan po Obronie r3) |
|---|---|---|---|
| 1 | Stan D-REND nieaktualny, brak SUPERSEDED | **ODDAL** (naprawione) | Nowa §S, l.12-29, z tabelą D-REND-1..8. Odwołania LEDGER zgodne z `ad14b7fbd`. `:112` to D-REND-1 (Three.js w webview), `:113` to D-REND-2/3/8, `:117` to zmiana na wgpu i picking w Rust z unieważnieniem P4.1/P4.2, `:123` to D-RR-1/2/4/8 i domyślne D-RR-3/5, `:127` to P4-4, `:134` to UI-Q1=A. `ls-tree parity-v2 rust-port/renderer/src` odpowiada liście w l.27. W `p4/` są 36 pliki, a dokumentów P4-1 i P4-2 brak, co zgadza się z ich unieważnieniem. §4-§6 oznaczone jako historyczne. |
| 2 | 88 w render/ + 8 poza | **ODDAL** (naprawione) | Wyniki: `ls render \| wc -l` = 88, `grep -l "from 'three" render/*.ts` = 80, `grep -rlE "from ['\"]three" .` = 88, a poza `render/` jest 8 plików. Zgadza się z l.71 i l.105. |
| 3 | `scene.ts:1279` i brak GameMap | **ODDAL** (naprawione) | `:1579` to `export async function buildScene(`, `:1592` zawiera `map.hexes`, `:1266` to `renderLandRiversFromPaths(`, `:1279` to `onSlice?`. Plików importujących `types/map` jest 13. |
| 4 | Fałszywy wniosek o `categoryOf` | **ODDAL** (naprawione) | `units.ts:36` zawiera `import type { RuntimeUnit }`. Pole `setup.ts:45` to `category: string`. W `render/*.ts` `categoryOf` występuje tylko w komentarzach. `hexDistance` jest w `cityOkolicaOverlay.ts:16`, `isWaterTerrain` w `countSceneOverlayCandidates.ts:9`, `FOG_EXPLORED_BRIGHTNESS` w `fogDim.ts:7` i `scene.ts:75`. Tabela symboli (l.197-213) zgadza się z `grep -B8` dla 17 plików. |
| 5 | Zła ścieżka Tauri, P1-17B:12 | **ODDAL** (naprawione) | `index.html:244` zawiera `<div id="game-map" … role="grid" …>`. W `main.js` są `:15` (`#game-map`) i `:712` (`function renderGameState`). Istnieje `src-tauri/frontend-v2/tools/check-no-logic-imports.mjs`. P1-17B:12 brzmi „Mapa to siatka DOM (`#game-map`, `role="grid"`)”. |
| 6 | Assety 2D i tekstury nieścisłe | **ODDAL** (naprawione) | `loadImageInto` woła 3 pliki. `unitOwnerEmblem.ts:315-321` to `new Image()`, `:386-388` to portret, `:368/:378/:407` to `svgToDataUri`. `cityMapStatChip.ts:286` to `loadImageInto(src…)`, `:338` to setter portretu, `:624-626` to kolejka portretów. Dalej `unitUpgradeBadges.ts:336`, `ui/leaderPortraits.ts:172` (`import.meta.glob(…portrety/*.jpg)`) i `:195`, `main.ts:8527`, `:8532`. |
| 7 | Brak pickingu jednostek | **ODDAL** (naprawione) | `main.ts:1894-1901` to `pickMapTarget`: najpierw `pickUnitIdAt` (`:1895`), potem `pickHexAt` (`:1885-1891`) z `unitRenderer.topYAt`. Metoda `units.ts:5867` to `pickUnitIdAt(`, `:5900` to `pickVeteranBadgeUnitIdAt(`, `main.ts:26235` to wywołanie. Obrona słusznie poprawiła linie Evaluatora. |
| 8 | Brak WebGL a FATAL | **ODDAL** (naprawione) | `main.ts:1661` to `async function boot()`, `:1662` to `try {`, `:1883` to `buildScene(map, canvas, …)`, `:39341` to `} catch (err) {`, `:39342` to `showErr('FATAL: ' …)`. |
| 9 | Sprzężenie render → input/picker | **ODDAL** (naprawione) | `cities.ts:44` i `units.ts:28` importują `clientRectToNdc`, `scene.ts:123` importuje `refreshInstancedPickBounds`. `picker.ts:20-21` importuje tylko `three` i `type RuntimeUnit`. |
| 10 | Mgła terenu | **ODDAL** (naprawione) | `scene.ts:1851` zawiera komentarz „Fog: matrix-hide (nieodkryte/miasto) + instanceColor-dim (explored)”. `:3281` to `const applyTerrainFog = (`, wywołania są w `:3372`, `:3374` i `:3389`. `fogDim.ts:38-41` operuje na `m.color`. |
| 11 | „~30 modeli” z nazw, brak wonderRenderer | **ODDAL** (naprawione) | Liczba „~30” usunięta (l.69, l.238, l.274). Metryka 62 ma zastrzeżenie, że nie jest liczbą modeli. Wiersz „Cuda na mapie” jest w l.64, a `wonderRenderer.ts:5` zawiera `import type { GameMap }`. |
| 12 | PLAN :192 a :284 | **ODDAL** (naprawione) | `grep -n P5.13` na `ad14b7fbd` daje `284:`. §1 pkt 4 jest w `:117`. Legenda (l.8) wiąże numery linii z `ad14b7fbd`. Pozostałość w l.122 opisuje U-1. |
| 13 | Zbędne NIE_ZMIERZONO | **ODDAL** (naprawione) | Prawy klik `main.ts:26209-26221` wywołuje tylko `exitBuildMode`, `dismissPlayerUnitSelectionIfAny` i `hideHexContextPanel`. W §7 pkt 12 i §6 D-REND-5 opisano `entityCards/renderer.ts:1138-1150`. |
| 14 | Drobne linie (5) | **ODDAL** (naprawione) | `scene.ts:277` to `interface RiverGeoBucket`, `perfTestPanel.ts:176` to `det.webgl2`, `:177` to etykieta, `:185` to „gra działa na WebGL 2”. `riverLod.ts:30` i `scene.ts:32` to importy `mergeGeometries`. `scene.ts:3237` to `applyZoomGpuSettings`, `:3248` to `applyZoomLodDecor`. `main.ts:36177` to klawisz `'b'`. P2-5 ma wiersz B11 z „klawiszem B”. |
| 15 | 801 LOC dokładne, brak bronze/stone | **ODDAL** (naprawione) | Z `wc -l`: 294+484+12+11 = 801, a z bronzeCityRoblox 437 i stoneCityRoblox 471 razem 1 709. Liczby są zgodne z l.88-89. |
| 16 | Proces: LEDGER:111 a DODATEK r3 | **ODDAL wobec dokumentu.** Korekta rejestru należy do orkiestratora (P-1) | `git cat-file -t f24c91e0` i `25a49386` kończą się `fatal: Not a valid object name`. Commity `cc694ac2e`, `fdad7bfc0` i `9b461eece` istnieją. Na `ad14b7fbd` katalog runu zawiera tylko `00-dispatch.md`, `01-operator.md` i `02-operator-obrona.md`. Wiersz `LEDGER.md:111` twierdzi więc, że był „Evaluator FAIL (11) → Final Control PASS-WITH-NOTES”, ale w repo nie ma żadnego artefaktu Evaluatora r1 ani FC r1, a podane SHA są nierozwiązywalne. To wada rejestru, nie dokumentu. Dokument podaje te fakty uczciwie w l.5. |

**Wynik: 0 × NAPRAW, 16 × ODDAL** (15 naprawionych w dokumencie, 1 procesowy). Werdykt dokumentu: **PASS-WITH-NOTES**.

## Uwagi FC (nie blokują)

- **U-1 (kosmetyka dowodu).** Linia l.122 (§1.5) nadal mówi „Przeczytano `P1-10-VIEWPORTS.md` (`git show f24c91e0:…`)”. Ten SHA nie istnieje, co przyznaje nagłówek dokumentu w l.5. Treść jest prawdziwa. Na `ad14b7fbd` P1-10 ma 13 `@media` w 11 plikach (`:7`, `:84`) i `min(24vw,340px)` (`:39`, `:83`), a na pinie `scene.ts:3112`/`:3117`/`:1615-1616` są poprawne. Przy integracji lub w następnej edycji należy zamienić `f24c91e0` na `ad14b7fbd`. Nie zmienia to żadnego twierdzenia.
- **U-2 (interpretacja).** Mapowanie D-REND-5 na D-RR-5 i D-REND-6 na D-RR-6 w §S to wniosek z treści. `LEDGER.md:123` nie łączy ich jawnie, inaczej niż D-RR-8, które wprost przywołuje D-REND-7. Wartości D-RR-3/5/6 są „domyślne orkiestratora, do rewizji”, a dokument zaznacza to słowem „Domyślne”. Treść jest poprawna, ale relację warto opisać jako „odpowiednik”.
- **U-3 (cytat).** `scene.ts:1624` w kodzie brzmi `?? new THREE.WebGLRenderer({ canvas, antialias: preset.antialias, … })`. Renderer może więc być przekazany z zewnątrz, a dokument skraca cytat. Nie zmienia to wniosku o FATAL.

## P-1 (do orkiestratora, poza allowlistą tematu)

Wiersz `dyspozycje/rust-port/LEDGER.md:111` zawiera nierozwiązywalne SHA (`f24c91e0`, `25a49386`) i deklaruje Evaluatora oraz FC r1, po których w repo nie ma śladu. Rekomendacja: w nowym wierszu LEDGER dla r3 zapisać, że r1 i r2 to `cc694ac2e` i `fdad7bfc0`, że artefakty Evaluatora r1 i FC r1 nie istnieją, oraz że pełny obieg Evaluator → Obrona → FC odbył się dopiero w r3 (`509ee851e`/`d69411602` → `80a261998` → ten raport). To korekta rejestru, nie decyzja produktowa, więc właściciel nie musi niczego wybierać.

Dodatkowo commity r3 mają trailer `Co-Authored-By` z nazwą modelu, wymagany przez atrybucję harnessu. Treść commitów nie zawiera nazwy modelu, a ostatnia linia to `Claude-Session`, czyli wymóg DODATKU r3 jest spełniony.

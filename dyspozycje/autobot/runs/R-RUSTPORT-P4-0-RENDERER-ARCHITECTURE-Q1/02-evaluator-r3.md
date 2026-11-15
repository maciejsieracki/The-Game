STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-0-RENDERER-ARCHITECTURE-Q1
GOAL: Ocena adwersarialna dokumentu `dyspozycje/rust-port/p4/P4-0-RENDERER-ARCHITECTURE.md` (stan na `origin/claude/rust-sivvrn` = `662e96087`): każde twierdzenie sprawdzone pod kątem dowodu plik:linia.
ZMIANY/COMMIT: tylko ten plik (`02-evaluator-r3.md`) w katalogu runu; commit lokalny, bez push. Zero zmian w `gra/**`, `rust-port/**` i w samym dokumencie P4-0.
TESTY: odczyt wyłącznie przez `git show`, `git grep`, `git ls-tree` oraz `git archive edb8fb56 gra/src | tar -x` do scratchpadu poza repo, potem `grep`/`sed`. Zero npm, zero cargo, zero buildu. `git diff --check` dokumentu: 0 linii z końcowymi spacjami.
BLOKADY: brak technicznych. Zarzut 1 (stan decyzji) wymaga decyzji orkiestratora, w jakiej formie zamknąć dokument.
RUNDY: 3/5 (Evaluator r3 według DODATKU r3 w dispatchu)
NASTĘPNY KROK: Operator (ten sam ID) poprawia zarzuty 1–9; zarzuty 10–16 to poprawki drobne. Potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

---

## A. Co zweryfikowano jako ZGODNE (dowód odtworzony w tej sesji)

| Twierdzenie dokumentu | Wynik |
|---|---|
| `three ^0.169.0` (`gra/package.json:14`), lock `1586-1588` → 0.169.0 | zgodne |
| `render/**` = 88 plików, 59 319 linii | `git ls-tree … | wc -l` → 88; `git grep -c ''` suma → 59 319 |
| Największe pliki: units 6 779, scene 3 760, mapRenderStyle 1 996, jednostki-z3 1 994 | zgodne |
| 80 z 88 plików `render/**` importuje three; lista 8 bez importu | zgodne (`git grep -L`) |
| 8 plików z three poza `render/**`, LOC (19 493 / 1 433 / 1 047 / 278 / 39 350 / 677 / 155 / 289), suma bez main.ts 23 372 | zgodne |
| `scene.ts:1624` WebGLRenderer, `:1626`, `:3078` PerspectiveCamera, `:3112`/`:3117` resize/fullscreen, `:1615-1616`, `:367`, `:32`, `:73`, `:89`, `:3071` | zgodne |
| `camera.ts:25` DRAG_THRESHOLD_PX=6, `:62`, `:66`, `:123`, `:218-219`, `:247`; WASD (`camera.ts:278`) | zgodne |
| `hexutil.ts:24/:32/:53`, brak importu three; `hexShape.ts` pointy-top XZ | zgodne |
| `fogDim.ts:16/:29/:38-41` | zgodne |
| `units.ts:6038-6041` `sync(...)`, `setup.ts:40` `RuntimeUnit` z polami id/ownerId/typeId/category/q/r/ruch/battlesSurvived | zgodne |
| `cities.ts:277-300` CityRenderOptions (getEra/getCiv/getLevel/getWalls) | zgodne |
| 6 miejsc `CanvasTexture`; brak GLTFLoader/OBJLoader/FBXLoader/TextureLoader/DRACOLoader w `gra/src` | zgodne |
| `minecraftScene.ts` i `robloxScene.ts`: 0 importerów w `gra/**`; żywe moduły roblox* z importerami | zgodne |
| 17 plików `render/**` z importem `../game|map|units`; liczniki per moduł | zgodne |
| battleScene `:104/:117/:3304/:3336/:8579`, manualBattle `:35/:36/:452/:567/:584`, siegeWall `:17`, picker `:29/:49/:175/:192/:196/:234`, perfTestPanel `:185/:299-301`, unitMiniPreview `:5/:32/:55/:91`, wonderpreview `:9/:10/:60` | zgodne |
| main.ts `:60/:150/:151/:155/:465/:1885/:26036/:26209/:26337/:36177-36205` | zgodne |
| P2-5: wiersze U1 (`:159`), U2 (`:160`), B11 (`:104`), W10 (`:183`); P2-8 `:59` i §5 `onTileClick`; P2-2 `:16`; PLAN §1 pkt 4 | zgodne |
| P1-11: SVG 307, JPG 45, PNG 2, MP3 62, 0 modeli 3D; P1-10: 13 `@media` w 11 plikach; `ui/**` 117 plików `.ts` | zgodne |
| D-REND-5: `unitInfoCard.ts:74/:362/:397-398`, `tokens.css:40`, `entityCards/renderer.ts:1138` | linie zgodne (treść :1138 zob. zarzut 13) |

## B. Zarzuty

**1. (KRYTYCZNY, stan faktyczny) Dokument przedstawia D-REND-1..8 jako otwarte i rekomenduje C, choć decyzje zapadły, a potem zostały zmienione.**
- `LEDGER.md:112` (na `origin/claude/rust-sivvrn`): D-REND-1 = Three.js w webview (ROZSTRZYGNIĘTE 2026-10-21).
- `LEDGER.md:113`: D-REND-2 = A, D-REND-3 = A, D-REND-8 = B.
- `LEDGER.md:117`: ZMIANA DECYZJI. D-REND-1 = renderer w Rust (wgpu), D-REND-3 = picking w Rust, D-REND-2 przestaje obowiązywać dla renderera, P4.1/P4.2 unieważnione.
- Stan Git potwierdza B: `origin/rust-port/parity-v2:rust-port/renderer/src/` (camera.rs, gpu.rs, pick/, models/, battle/ …) oraz `rust-port/spike-gpu-embed`. Na `rust-sivvrn` istnieją `p4/P4-3-RUST-RENDERER-ARCH.md`, `P4-6-RENDERER-CRATE-SCAFFOLD.md` … `P4-36-MOD14-BATTLE-3D.md`.
- Dokument nadal pisze: „Rekomendacja: C”, „Przed P4.6: zamknąć D-REND-1..3 i D-REND-8” (§4 l.201–203, §5 l.209, §6). Czytelnik dokumentu dostaje fałszywy obraz stanu.
- Wymagane: nagłówek statusu „SUPERSEDED / stan decyzji” z odwołaniem do `LEDGER.md:112,113,117`. Przy każdym D-REND-n trzeba dopisać rozstrzygnięcie i rewizję. Treść historyczną można zostawić jako zapis z 2026-10-21.

**2. Sprzeczność liczb Three.js w §1.4.** Linia 77: „→ 88 w `render/` + 8 poza nim”. Linia 49 i §8 mówią 80 w `render/`. Wynik `git grep -l -E "from ['\"]three" edb8fb56 -- gra/src` → **88 łącznie = 80 w `render/` + 8 poza**. Zdanie z l.77 jest błędne.

**3. Błędny dowód `scene.ts:1279` dla `buildScene`** (§3.1 l.120). Linia 1279 to parametr `onSlice` funkcji rzecznej (eksport `renderLandRiversFromPaths`, ok. `:1266`), nie `buildScene`. `buildScene` zaczyna się w `scene.ts:1579`. Wejście mapy to `GameMap`: `map.hexes` jest w `scene.ts:1592`, a `render/**` importuje `../types/map` w 13 plikach. Tabela §3.1 tego wejścia nie wymienia.

**4. Fałszywy wniosek §3.3 (l.167): „kopia `render/**` przeniesie … `units/setup.categoryOf`”.** Żaden plik `render/**` nie importuje `categoryOf`. `units.ts:36` importuje tylko `import type { RuntimeUnit }`, a `category` jest gotowym polem `RuntimeUnit` (`setup.ts:45`). Z `units/setup` render importuje wyłącznie `hexDistance` (`cityOkolicaOverlay.ts:16`) i `isWaterTerrain` (`countSceneOverlayCandidates.ts:9`). To samo dotyczy `game/visibility`: importowana jest tylko stała `FOG_EXPLORED_BRIGHTNESS` (`fogDim.ts:7`, `scene.ts:75`), więc nazywanie tego „logiką domenową” jest przesadą.

**5. §3.4 i §7 pkt 6: „P1-17B:12 NIE zweryfikowane”, „`main.js` nie zlokalizowano”. To nieprawda: grep szukał w złej ścieżce (`HEAD:rust-port/`).** Frontend Tauri leży w `src-tauri/`, nie w `rust-port/`:
- `origin/rust-port/parity-v2:src-tauri/frontend/index.html:244` → `<div id="game-map" class="game-map" role="grid" …>`;
- `src-tauri/frontend/main.js:15` (`#game-map`), `:712` `function renderGameState`.
Twierdzenie P1-17B:12 jest więc **prawdziwe**. Dokument pomija też `src-tauri/frontend-v2/` (kopia paneli `gra/src/ui/**`, decyzja UI-Q1=A, bramka `tools/check-no-logic-imports.mjs`). To bezpośredni precedens dla D-REND-2 i opcji A.

**6. §0 l.22 („płaskie assety 2D … nie są mapą”) i §1.3 l.71 („tekstury nie są plikami”) są nieścisłe.** Renderer mapy rysuje rastrowe pliki do tekstur `CanvasTexture`:
- `unitOwnerEmblem.ts:386-388`: `assets.leaderPortraitUrl(civ, era)` → `loadImageInto(portrait)`, czyli portret JPG z P1.11 na emblemacie jednostki;
- `unitOwnerEmblem.ts:368/378/407`, `cityMapStatChip.ts:286`, `unitUpgradeBadges.ts:336`: SVG przez `svgToDataUri`.
„Źródło `url` NIE_ZMIERZONO” (§1.3 l.72, §7 pkt 3) da się zmierzyć: to data URI z SVG oraz URL portretu wstrzykiwany z `main.ts`. Do tego `loadImageInto` wołają 3 pliki `render/**`, a nie „jedyny” jeden. Konsekwencja dla P4.11: portrety i SVG są wejściem renderera mapy, nie tylko UI.

**7. Picking (§1.1 l.45, §3.2, D-REND-3) pomija picking jednostek.** `main.ts:1892-1898` `pickMapTarget`: najpierw `unitRenderer.pickUnitIdAt` (`units.ts:5867`, raycast w modele jednostek), dopiero potem `pickHexAt`. Do tego `pickVeteranBadgeUnitIdAt` (`main.ts:~26233`). D-REND-3 opisuje tylko raycast terenu, więc „identyczne wyniki kliknięć” nie są zapewnione samym `picker.ts`.

**8. Brak WebGL (§1.1 l.33, §4 l.193–194, D-REND-5, §7 pkt 11): stwierdzenie „bez try/catch” jest niepełne.** `buildScene` (`main.ts:1883`) wykonuje się wewnątrz `boot()`. Ta funkcja ma `try` w `main.ts:1662` i `catch (err)` w `main.ts:39341` → `showErr('FATAL: …')`. Wyjątek z `new THREE.WebGLRenderer` kończy się więc ekranem FATAL, a nie niezłapanym wyjątkiem. Brak trybu zastępczego mapy pozostaje prawdą. Opis ścieżki jest błędny, a NIE_ZMIERZONO w §7 pkt 11 da się zastąpić odczytem kodu.

**9. Ukryte sprzężenie `render/** → input/picker`, pominięte w §3.3 i w opcji A („kopia `render/**` 1:1”).** Dowody: `cities.ts:44` i `units.ts:28` importują `clientRectToNdc`, `scene.ts:123` importuje `refreshInstancedPickBounds` z `../input/picker`. `picker.ts` sam nie importuje `render/**` (importy: `picker.ts:20` three, `:21` typ `RuntimeUnit` z `../units/setup`), więc to zależność jednokierunkowa, nie cykl. Kopia samego `render/**` bez `input/picker.ts` się nie zbuduje. Ma to też wpływ na D-REND-3.

**10. Mgła (§1.1 l.38): „Mgła = zmiana kolorów materiałów, nie osobna warstwa” jest niepełne.** Dla terenu `scene.ts:1851` daje „matrix-hide (nieodkryte/miasto) + instanceColor-dim (explored)”, a `applyTerrainFog` jest zdefiniowane w `scene.ts:3281` (wywołanie w `:3389`). `material.color` (`fogDim.ts:41`) dotyczy obiektów (`applyFogDimToObject3D`), nie instancji terenu.

**11. „ok. 30 plików modeli” (§1.1 l.47, §4 l.185, D-REND-4) to wniosek z samych nazw.** Dispatch tego zakazuje („Zakaz wniosków z samych nazw plików”), a dokument sam pisze w tym samym akapicie „NIE_ZMIERZONO (nie wnioskuję z nazw)”. Liczbę trzeba usunąć albo zmierzyć (np. pliki eksportujące `build*` zwracające `THREE.Group`). Pokrewny brak: `wonderRenderer.ts` (cuda na mapie) nie występuje w tabeli §1.1.

**12. Nieaktualne odwołanie do PLAN.** `PLAN-PORT-RUST-TAURI-20261020.md:192` (P5.13) było poprawne na `de46210b`. Na bazie oceny (`rust-sivvrn`) P5.13 jest w `:284`. Odwołania do dokumentów rust-port muszą podawać commit, z którego pochodzi numer linii.

**13. Zbędne NIE_ZMIERZONO (rzeczy mierzalne odczytem):**
- `entityCards/renderer.ts:1138` (§7 pkt 12) to komentarz i reguła CSS formatowania tekstu fallbacku (`:1138-1150`), bez osobnej ścieżki renderu;
- prawy klik (§3.2 l.136): `main.ts:26209-26221` robi tylko `exitBuildMode`, `dismissPlayerUnitSelectionIfAny` i `hideHexContextPanel`, czyli warstwę UI bez komendy domenowej. To wspiera tezę „render nie emituje komend”.

**14. Drobne niezgodności linii i opisów:**
- `RiverGeoBucket` jest w `scene.ts:277`, nie `~287`;
- sonda `det.webgl2` jest w `perfTestPanel.ts:176` (`:177` to etykieta);
- „drugi plik” z `mergeGeometries` to `riverLod.ts` i trzeba go nazwać;
- `applyZoomLodDecor`/`applyZoomGpuSettings` mają definicje w `scene.ts:3248/:3237` (`:3518-3519` to wywołania);
- wiersz B11 to **klawisz** B na najechanym heksie (`main.ts:36177` `e.key === 'b'`), a nie „klik”.

**15. Pomiar 801 linii (§1.2 l.65) opisany jako „przybliżenie” jest dokładny** dla `roblox*`/`minecraft*` (`wc -l` → 801). Nie obejmuje jednak `bronzeCityRoblox.ts` i `stoneCityRoblox.ts`, które §1.2 wymienia wśród żywych plików „Roblox”. Trzeba doprecyzować zakres wzorca.

**16. (PROCES, do orkiestratora, nie do Operatora)** DODATEK r3 dispatchu mówi „brak Evaluatora i Final Control”. Tymczasem `LEDGER.md:111` zapisuje: „Operator (`f24c91e0`) → Evaluator FAIL (11 zarzutów) → Obrona (`25a49386`) → Final Control | PASS-WITH-NOTES — ZINTEGROWANE”. W katalogu runu nie ma plików Evaluatora r1 ani FC. Albo wpis w LEDGER jest nieprawdziwy, albo brakuje artefaktów runu. Trzeba to wyjaśnić przed Final Control r3.

## C. Werdykt

FAIL. Liczby rdzeniowe (88/59 319/80/8/23 372/17/117, P1-11, P2-5) są odtwarzalne. Dokument zawiera jednak twierdzenia fałszywe lub sprzeczne z Gitem: zarzuty 2, 3, 4 i 5. Ma też pominięcia istotne dla decyzji: zarzuty 6, 7 i 9. Przede wszystkim (zarzut 1) prezentuje jako otwarte decyzje, które właściciel rozstrzygnął i zrewidował (`LEDGER.md:112,113,117`), a ich realizacja trwa w `rust-port/renderer`.

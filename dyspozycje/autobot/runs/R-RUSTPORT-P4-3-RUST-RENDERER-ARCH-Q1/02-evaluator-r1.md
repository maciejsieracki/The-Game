STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-3-RUST-RENDERER-ARCH-Q1
GOAL: Dokument architektury renderera mapy i modeli 3D w Rust (silnik, osadzenie w Tauri, picking z kodu weba, potok modeli, testy 1:1, statyczny audyt pamięci, D-RR-n, tematy-kandydaci).
ZMIANY-COMMIT: ocena commita Operatora `bc17ea76` (baza `dc4cfdb4`); ten plik jest jedyną zmianą Evaluatora (allowlista `runs/**`). Bez push.
TESTY: temat projektowy, bez buildu i bez uruchamiania. Sprawdzono 30 twierdzeń:
- web przez `git archive edb8fb56 gra/src` i `grep`/`sed`;
- Rust przez `git show origin/rust-port/parity-v2` (`f7aa0997`);
- Tauri i wry w źródłach z `~/.cargo/registry/src`;
- `cargo info wgpu@30.0.1` oraz `cargo info bevy@0.20.0`;
- `node -e` dla `Math.round`.

Zgodne z kodem:
- `worldToAxial` w `picker.ts:49-81` i w `hexutil.ts:53-71`, w tym różnica przy remisie `dr==ds`;
- `clientRectToNdc`;
- kamera: 52°, `yaw` 0, `fov` 50, `near` 0,5, `minDist` 8/3, `maxDist`, pan 0,002·d, `speed` = k·d/30;
- baza kamery i promień: wyprowadzone poprawnie;
- picking terenu: `1.008R`, `coastalDrop` 0,045, `terrainPickMeshes`, `ZERO_MATRIX` mgły, priorytet jednostek;
- liczniki: 2080 / 116 / 214 / 45 / 16 / 1494 / 70 / 6 `WebGLRenderer` / 19 493 LOC;
- audyt pamięci: M1 (`visualKey`/`_disposeModel`), M2 (klucz i czyszczenie tylko innego LOD), M3 (brak `removeEventListener`), M6 (24/32);
- Tauri: `src-tauri` (Cargo, `lib.rs`, `main.js:668`, `tauri.conf.json`) oraz API Tauri i wry (`add_child`/`builder` za `unstable`, `transparent` z `macos-private-api`, `build_as_child` tylko X11, `with_transparent` Win7).

`git diff --check` na commicie jest czysty, a zakres to 2 pliki z allowlisty.
BLOKADY: brak blokad technicznych.

ZARZUTY:
1. **[FAKT, D-RR-1] MSRV Bevy jest błędne.** Dokument (§1.2, D-RR-1) podaje 1.96.0. `cargo info bevy@0.20.0` zwraca `rust-version: 1.97.1`. Lokalny toolchain to `rustc 1.97.0`, więc Bevy 0.20.0 nie zbuduje się na obecnym toolchainie. Tego faktu brakuje w ocenie.
2. **[FAKT] Wiersz „Cache offline … 0 trafień” (§1.1) jest nieaktualny i niejawnie zmieniony przez samą sesję.** W `~/.cargo/registry/cache/*/` są `wgpu-30.0.1.crate`, `bevy-0.20.0.crate` i `bevy-0.20.0-rc.2.crate` ze znacznikiem 2026-10-21 19:01–19:06, czyli pobrane przez `cargo info` Operatora. Trzeba to ujawnić. Wniosek „zależności nie są offline” nadal jest prawdziwy, bo brak `wgpu-core`, `naga` i innych.
3. **[FAKT, picking] Zła wysokość wierzchu `PlytkieMorze`.** §3.5 pkt 3 i §3.7 pkt 7 podają wierzch 0,22. W stylu roblox każda woda ma środek w `seaSurfaceY − h/2` (`scene.ts:2257-2261`, `seaSurfaceY = 0,18` z `scene.ts:2089`), więc wierzch rysowanego pryzmu to 0,18. To przeczy też §3.5 pkt 2. Skutek pominięty w §3.6 i D-RR-3: ścieżka awaryjna `topYAt` → `terrainTopY` → `TERRAIN_SURFACE_Y[PlytkieMorze] = 0,22` (`units.ts:214-217`, `mapRenderStyle.ts`) różni się od trafionej geometrii o 0,04. To drugi rozjazd tego typu, obok `coastalDrop`.
4. **[FAKT, picking] Recepta na `Math.round` jest błędna.** §3.4 twierdzi, że `Math.round(x) = floor(x+0,5)`, i każe portowi użyć `(x+0.5).floor()`. Kontrprzykład: `node -e` daje `Math.round(0.49999999999999994) = 0`, a `Math.floor(0.49999999999999994+0.5) = 1`. Potrzebna jest poprawna implementacja semantyki ECMAScript, np. `let r = x.round(); if r - x == 0.5 { r - 1.0 } else { r }`, plus test jednostkowy tego przypadku. Zakres problemu jest też przesadzony: dotyczy tylko dokładnych połówek, a nie „klików poza krawędzią” jako klasy.
5. **[NIEKOMPLETNE wyprowadzenie] Brak jednej gałęzi w „kolejności decyzji” `pixelToHex` (§3.5 pkt 4).** Pominięto `picker.ts:221-223`: trafienie bez rozwiązanej instancji (resolver zwraca `null` albo obiekt nie jest `InstancedMesh`) z `n.y > 0,5` od razu zwraca `worldToAxial(point)`. Pominięto też, że boczne trafienie bez klucza nie trafia do `sideResolvedFallback`. Port P1 musi odtworzyć pełną kolejność.
6. **[NIESPÓJNOŚĆ zakresu] ACES nie dotyczy stylu gry.** `scene.ts:1638-1641` włącza ACES i ekspozycję 1,05 tylko dla stylu `civ`, a w grze obowiązuje `roblox`, czyli brak tone mappingu. Mimo to §1.2 (ryzyko 1:1), §4.2 (wiersz `material`) i RR-T5 wymagają ACES. Wymóg 1:1 dla `roblox` to „bez tone mappingu”. ACES wchodzi tylko przy D-RR-8 obejmującym `civ`.
7. **[POMINIĘTY dowód] Zgodność `raw-window-handle` oznaczono NIE_ZMIERZONO (§2.2, §9 pkt 3), choć da się ją sprawdzić statycznie.** `wgpu-30.0.1/Cargo.toml` (crate w cache): `[dependencies.raw-window-handle] version = "0.6.2"`. Lockfile Tauri ma 0.6.2, więc wersje są zgodne. Wymaga poprawy.
8. **[LUKA architektury i wyceny] Brak właściciela pętli klatek, animacji i wejścia ciągłego.** Web napędza co klatkę:
   - animację ruchu jednostek po punktach drogi (`main.ts:25490-25499`, `isAnimating`);
   - `CameraController.update()` (WASD i edge-pan, `camera.ts` `update()`, klawisze trzymane w JS).

   Dokument nie mówi, kto w opcji (a) prowadzi pętlę renderu (tao/Rust czy JS). Nie mówi też, jak przekazywać `mousemove`, `wheel` i klawisze przez IPC, ani jakie jest ryzyko opóźnienia przy panowaniu i hoverze. Dalej, picking hover (§3.1 pkt 7: gwiazdki weterana, pigułki miast) i model widoku/DTO renderera (§4.3, mapowanie `PositionDto` ↔ `q,r`) nie mają tematu RR-Tn ani miejsca w kolejności. Potrzebny jest temat lub temat-y kandydujące (wejście/pętla/animacje, DTO widoku) i aktualizacja kolejności.
9. **[WYCENA] Liczba „~83 tys. LOC” (§0 pkt 6, §8) to dolna granica, a dokument tego nie mówi.** Nie obejmuje udziału 3D w `main.ts` (39 350 LOC, P4-0 §4: NIE_ZMIERZONO; m.in. animacje, nakładki surowców `main.ts:2826-2852`, hover). Trzeba to zapisać jawnie.
10. **[FAKT, drobny] M3 podaje 3 miejsca `new BattleScene(`** (`main.ts:27514`, `:28160`, `:29884`). W rzeczywistości jest 5: dochodzą `:30250` i `:30384`.
11. **[SFORMUŁOWANIE] „Dowiedzione wycieki” (§0 pkt 5) to dowód ścieżki kodu, nie retencji GPU.** Retencja buforów GPU bez `dispose()` opiera się na komentarzu projektu (`mergeDecor.ts:146-150`) i na wewnętrznym działaniu Three r169, którego źródła nie ma (§9 pkt 7). Trzeba to rozróżnić. Wyjątek: M2 jest dowiedzione na poziomie JS (`Map` trzyma `CanvasTexture`).

Ocena pozostałych kryteriów:
- opcje osadzenia: uczciwe, bez zmyślonych możliwości, a (c) oceniona jako „renderer w webview”;
- D-RR-1..9: jawne;
- pytanie 7: oparte na policzonych dowodach;
- wycena jako tygodnie lub miesiące: zasadna (z korektą z pkt 9).

RUNDY: 1/5
NASTĘPNY KROK: powrót do Operatora (Opus 5.5 medium) z tym samym ID. Poprawić zarzuty 1–11, potem znowu Evaluator.
DEPLOY/PUSH: NIE WYKONANO

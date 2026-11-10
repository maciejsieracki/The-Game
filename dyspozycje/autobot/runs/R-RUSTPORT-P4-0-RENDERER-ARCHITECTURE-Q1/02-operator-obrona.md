STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-0-RENDERER-ARCHITECTURE-Q1
GOAL: Odpowiedź na zarzuty 1–11 Evaluatora (runda 1/5) — każdy PRZYJĘTY (poprawka + dowód) albo ODRZUCONY (dowód). Dokument P4-0 przepisany w tym samym ID.
ZMIANY/COMMIT: baza `f24c91e0` (commit Operatora rundy 1); nowy commit Operatora rundy 2 (SHA w raporcie orkiestratora). Allowlista: `dyspozycje/rust-port/p4/P4-0-RENDERER-ARCHITECTURE.md` (zmieniony), `dyspozycje/autobot/runs/R-RUSTPORT-P4-0-RENDERER-ARCHITECTURE-Q1/02-operator-obrona.md` (nowy). Zero zmian w `gra/**`, `rust-port/**`. Push: NIE.
TESTY: odczyt wyłącznie `git show`/`git grep`/`git ls-tree` na `edb8fb56` (oraz `f24c91e0` dla dokumentów rust-port). Build ani dev web nie uruchamiano. `git diff --check` — wynik w sekcji poniżej.

## Odpowiedzi na zarzuty

1. PRZYJĘTY. `render/**` importujących `three`: 80 z 88 (`git grep -l "from 'three" edb8fb56 -- gra/src/render` → 80). Osiem bez importu: countSceneOverlayCandidates, hexutil, minecraftScene, perfDebugOverlay, robloxScene, siegeCampSync, unitVitalsPalette, zoomLod. Doc §0, §1.1, §8 poprawione.
2. PRZYJĘTY. Dodano tabelę §1.4: 8 plików three poza `render/` (battleScene 19 493 LOC, manualBattle, siegeWall, picker, main.ts, perfTestPanel, unitMiniPreview, wonderpreview) z dowodami linii. Opcja A i koszt przepisane (§4). Dodano D-REND-8 (zakres 3D poza render/).
3. PRZYJĘTY. `git grep -n -E "from ['\"]\.\./(game|map|units)/" edb8fb56 -- gra/src/render` → 17 plików (tabela §3.3). `game/production` = 2 pliki. Błąd przeniesiony poprawnie do §3.3, §4, D-REND-2.
4. PRZYJĘTY. D-REND-7 przepisany: zakres tylko `minecraftScene.ts` (0 importerów) i `robloxScene.ts` (tylko re-eksport, 0 importerów). Żywe moduły wymienione z dowodami (§1.2): robloxCity ← scene.ts:73,3071; robloxImprovements ← improvements.ts:9, scene.ts:89; bronzeCityRoblox, stoneCityRoblox ← settlementModel.ts:7,9; styleResources ← main.ts:649. Sprzeczność z §1.2 usunięta.
5. PRZYJĘTY. Przeczytano `dyspozycje/rust-port/p1/P1-10-VIEWPORTS.md` (`git show f24c91e0:…`). Wykorzystano w §1.5 (brak stałego rozmiaru okna, canvas wypełnia viewport, resize/fullscreen `scene.ts:3112/3117`, 13 `@media`) i w D-REND-6.
6. PRZYJĘTY (z doprecyzowaniem). Mapa: brak fallbacku — `scene.ts:1624` w zakresie `1599–1626` bez try/catch. Miniatura jednostki: fallback tekstowy — `ui/unitMiniPreview.ts:55,91`, `ui/unitInfoCard.ts:74` („Render 3D niedostępny w tym środowisku”), `unitInfoCard.ts:362,397-398`, `tokens.css:40`. Dodatkowo `ui/entityCards/renderer.ts:1138` („FALLBACK bez WebGL”) — treść NIE_ZMIERZONO. D-REND-5 przepisany.
7. PRZYJĘTY. `git ls-tree -r --name-only edb8fb56 -- gra/src/ui | grep -c '\.ts$'` → 117. Liczba 105 usunięta z §4 i z P1.1 nie jest cytowana.
8. PRZYJĘTY (częściowo domknięte). Dodano §3.2 porównanie emitowanych zdarzeń z kontraktem P2-5: klik→select (U1, P2-8 §5 onTileClick), klik→move (U2, main.ts:26036), klik→found city (B11, main.ts:36177–36205), klik w bitwie (W10). Prawy klik: brak wiersza w P2-5 — NIE_ZMIERZONO. Pełne mapowanie 174 callbacków main.ts poza zakresem tematu (P2-5 §2.13 już je mapuje).
9. PRZYJĘTY. Usunięto nieudowodnione twierdzenie „brak odpowiednika CanvasTexture/Sprite/InstancedMesh/fogDim w Rust” — zastąpiono NIE_ZMIERZONO (§4, §7 pkt 10). Koszt A uzasadniony rozmiarem plików (88 + 8 plików, ~83 000 LOC w sumie zakresu B) i listą importów logiki; koszt B: „wyższy niż A” z rozmiarem; czas: NIE_ZMIERZONO (§7 pkt 9).
10. PRZYJĘTY. Tabela §4 rzędu „WebGL” rozdzielona: założenie webu z dowodem `perfTestPanel.ts:177,185`; wsparcie WebView2/WebKit oznaczone NIE_ZMIERZONO, spójnie z §7 pkt 5.
11. PRZYJĘTY. Błędne odwołanie P2.7 usunięte. Zasada „zero lokalnej symulacji w JS” = `PLAN-PORT-RUST-TAURI-20261020.md` §4 P5.13 (`:192`); zakaz drugiej uproszczonej gry = §1 pkt 4. Poprawione w §3.4.

## Dowody pomocnicze

- Stan gra/ między `edb8fb56` a `f24c91e0` nie jest identyczny (`git diff --stat edb8fb56 f24c91e0 -- gra rust-port`: 138 plików). Dlatego wszystkie odczyty kodu są na `edb8fb56`, nie w working tree.
- Liczba linii wejściowych: `git grep -c '' edb8fb56 -- <8 plików three>` → suma bez main.ts 23 372.

## Otwarte (nie zmieniam po cichu)

- D-REND-1..8 pozostają decyzjami właściciela. Rekomendacja C nie jest rozstrzygnięciem.
- Twierdzenie P1-17B:12 (mapa jako siatka DOM w Tauri) nadal NIE zweryfikowane.

BLOKADY: brak blokad wykonania; NIE_ZMIERZONO wymienione w §7 dokumentu (13 pozycji).
RUNDY: 2/5
NASTĘPNY KROK: Evaluator (Haiku 5.5) ponownie na nowym SHA; następnie Final Control (Sonnet 5.5). Orkiestrator wpisuje SHA nowego commita do LEDGER.
DEPLOY/PUSH: NIE WYKONANO

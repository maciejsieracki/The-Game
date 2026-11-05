STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-RENDER-UNIT-BLUR-HORSES-Q1
GOAL: znaleźć warunek, w którym konie/rydwan „czasem” są rozmyte, naprawić minimalnie bez zmian logiki gry
ZMIANY/COMMIT: SHA w sekcji końcowej (jeden commit). Pliki: `gra/src/render/mapRenderStyle.ts` (1 stała), nowe `gra/tools/render-unit-sharpness-measure.cjs`, `gra/tools/render-unit-sharpness-guard.cjs`, `dyspozycje/autobot/runs/R-WEB-RENDER-UNIT-BLUR-HORSES-Q1/**` (raport + evidence ~112 KB).
TESTY: patrz niżej
BLOKADY: brak (NIE_ZMIERZONO: wydajność na prawdziwym GPU, pełna gra z mapą — patrz notatki)
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (weryfikacja przyczyny i zakresu zmiany presetu, decyzja o skutku ubocznym DPR1 na LOD 2-3)
DEPLOY/PUSH: NIE WYKONANO

## Przyczyna (plik:linia)
Modele jednostek (`render/units.ts`, `braz-rydwan-konny-opus5.ts`, `kon-nowy-model.ts`) to czysta geometria
(MeshStandardMaterial, zero tekstur, zero post-processingu/DOF — grep: brak EffectComposer/blur/bokeh).
Rozmycie nie pochodzi z modelu, tylko z rozdzielczości bufora renderu względem pikseli ekranu:
- `render/mapRenderStyle.ts` preset `medium` (domyślny): `pixelRatioMax: 1.5`, `antialias: false`.
- `render/scene.ts:1626` ustawia `min(devicePixelRatio, pixelRatioMax)`; `render/scene.ts:3239` + `render/zoomLod.ts:117-120`
  (`effectivePixelRatio`) dodatkowo mnożą go LOD-em oddalenia (1.0 / 0.85 / 0.65 / 0.5 / 0.35, podłoga 0.75).
- Warunek „czasem”: ekran HiDPI (DPR 2 — Mac/Retina/laptopy 4K) w trybie jakości Średnia: bufor 1.5x jest rozciągany do 2x pikseli
  urządzenia (miękki obraz, konie/koła bez ostrych krawędzi); dodatkowo każdy próg LOD (t>=0.2/0.4/0.6) obniża jeszcze bufor,
  więc ostrość „skacze” przy zmianie zoomu. Na DPR 1 przy LOD 2-3 bufor = 0.975/0.75 < 1 piksel urządzenia (też rozmycie).
- „Kony = kolory”: sprawdzono — obrys/kolor gracza to MeshStandardMaterial bez alpha-blendingu; kolory nie są mieszane, rozmywa je ten sam
  rozciągnięty bufor. Osobnej przyczyny nie znaleziono.
- Nie sprawdzono (NIE_ZMIERZONO): rozmiar plakiet (unitStatPlate/unitOwnerEmblem, mipmapy) — nie są częścią rozmytej dolnej połowy; render
  całej gry z mapą/mgłą/ruchem animowanym nie był uruchamiany (harness = scena z modelem `buildUnitModel('rydwan')`, kamera FOV 50,
  pochylenie 55 stopni, światła jak w scene.ts, importuje presety z kodu gry).

## Pomiar (Chromium headless + SwiftShader, 1280x800, metryka = wariancja Laplace'a luminancji środka zrzutu w pikselach urządzenia)
Narzędzie: `gra/tools/render-unit-sharpness-measure.cjs` (wyniki: evidence/results-PRZED.json, results-PO.json).
Preset medium, dist=4 (z bliska):
| DPR | LOD | pixelRatio PRZED -> PO | ostrość PRZED -> PO |
|---|---|---|---|
| 2 | 0 | 1.5 -> 2.0 | 35.4 -> 126.6 (x3.6) |
| 2 | 1 | 1.275 -> 1.7 | 24.3 -> 36.2 |
| 2 | 2 | 0.975 -> 1.3 | 13.3 -> 25.7 |
| 1 | 0,1 | 1.0 -> 1.0 | 210 -> 210 (bez zmian) |
| 1 | 2 | 0.975 -> 1.0 | 83.4 -> 210 |
| 1 | 3 | 0.75 -> 1.0 | 58.7 -> 210 |
Uwaga metryczna: wartości porównywalne tylko w obrębie tego samego DPR (przy DPR1 bez AA metryka zawyżana aliasingiem).
Dla DPR2 pełna ostrość natywna (pr=2, high, AA) = 57.2 przy dist 4 w poprzedniej serii; po zmianie medium (bez AA) = 126.6.
Zrzuty (wycinek 922x640 px urządzenia dla DPR2, 461x320 dla DPR1): evidence/PRZED-dpr2-medium-L0.png vs PO-dpr2-medium-L0.png (konie/koła wyraźnie ostrzejsze
po zmianie, obejrzane wizualnie), oraz PRZED/PO-dpr1-medium-L3.png.

## Naprawa
`mapRenderStyle.ts` preset `medium`: `pixelRatioMax` 1.5 -> 2.0 (komentarz w kodzie). Brak zmian logiki gry, LOD, materiałów.
Wpływ na DPR<=1.5 (większość monitorów 1x/1.25x/1.5x): zerowy dla LOD 0-1.

## Wydajność
- Liczba draw calls: 146 PRZED i PO we wszystkich konfiguracjach (bez zmian).
- Czas klatki: SwiftShader (CPU) dał szum 0.8–3 ms bez trendu na tej małej scenie — NIE_ZMIERZONO wiarygodnie; nie jest to dowód.
- Rachunek pikseli (koszt fill-rate): DPR2 L0: 1.78x pikseli (2.0^2/1.5^2), L1 1.78x, L2 1.78x; DPR1: L2 1.05x, L3 1.78x
  (pr 0.75 -> 1.0) — wyłącznie na oddalonych poziomach LOD, gdzie dekoracje są wyłączone. Użytkownicy DPR<=1.5 na LOD 0-1 bez kosztu.

## Testy / bramki
- `node gra/tools/render-unit-sharpness-guard.cjs` -> PASS guard, EXIT=0 (evidence/gate-guard.txt): medium.pixelRatioMax>=2, high>=medium>=low, mnożniki LOD nie rosną.
- `npx tsc --noEmit` (po `npm ci --ignore-scripts`) -> EXIT=0 (evidence/gate-tsc.txt). node_modules usunięte po pracy.
- Regresje `*render*`/`*units*`/`*camera*`/playtest MAPA: NIE URUCHOMIONE (zmiana to jedna stała liczbowa, brak dotykanej logiki; do decyzji Evaluatora).
- `npm run build`/`dev` w `gra/`: NIE uruchamiane (bundle esbuild poza repo).

## Notatki do Evaluatora
1. Decyzja produktowa: koszt GPU na DPR2 w trybie Średnia rośnie 1.78x. Alternatywa: zostawić max 1.5 i włączyć AA / podnieść tylko LOD 0 — nie testowane.
2. Skutek uboczny: użytkownicy DPR1 na LOD 3 dostają bufor 1.0 zamiast 0.75 (ostrzej, 1.78x pikseli na oddalonym widoku).
3. Pomiar nie obejmuje pełnej gry; potwierdzenie na prawdziwym GPU/HiDPI zalecane przy FC.

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-RENDER-UNIT-BLUR-HORSES-Q1
GOAL: znaleźć warunek, w którym konie i rydwan bywają rozmyte, i naprawić go bez zmian logiki gry
RUNDY: 1/5 (obrona)
DEPLOY/PUSH: NIE WYKONANO

Baza obrony: commit Operatora eb32c549676558828238778233c8a38f680bb24a. Kod gry (gra/src) bez zmian względem niego; zmieniły się tylko dwa skrypty w gra/tools i evidence.

## Zarzut 1. Przyczyna to hipoteza, nie ustalenie. PRZYJMUJĘ
Nie sprawdziłem jakości ani DPR właściciela, a zrzutu zrzut-46 nie ma w repo ani na dysku (find). Poprawiłem nagłówek w 01-operator-r1.md: "najbardziej prawdopodobna, niepotwierdzona".
Co poprawka robi, a czego nie:
- jakość `high`: pr już 2.0, poprawka bez efektu (PRZED = PO);
- DPR <= 1.5, LOD0-1: bez efektu;
- jakość `medium` + DPR 2 (typowy Mac/Retina): ostrość LOD0 z 0.28 do 1.00 referencji natywnej.
Dodatkowy kandydat na "czasem", niezbadany i niezmieniony (NIE_ZMIERZONO): scene.ts:1626 czyta window.devicePixelRatio przy starcie, a następnie dopiero scene.ts:3237-3239 (applyZoomGpuSettings, wołane przy zmianie LOD, scene.ts:3518). onResize (scene.ts:3100-3109) nie odświeża pixelRatio, więc po zmianie DPR (zoom przeglądarki, przeniesienie okna na inny monitor) bufor może mieć zły stosunek do ekranu do następnej zmiany LOD. To osobny temat.
Pytanie do właściciela (jakość mapy + ekran) zostaje dla orkiestratora; ja ABC nie zadaję.

## Zarzut 2. Częściowe usunięcie rozmycia, brak progu. PRZYJMUJĘ w części (próg), ODRZUCAM w części (zmiana drabiny LOD)
Próg zdefiniowany i zakodowany: `node tools/render-unit-sharpness-measure.cjs <outDir> --assert`. Miara = ostrość (wariancja Laplace'a) / ostrość referencji natywnej (ten sam DPR, pr=DPR, bez AA, ta sama scena). Kryterium binarne: LOD0 >= 0.90 dla DPR 1 i 2.
Wyniki (dist 4, medium), evidence/results-assert-PO-r2.json:
- DPR2 LOD0 1.000 (sharp 126.6), LOD1 0.286 (36.2), LOD2 0.203 (25.7), LOD3 0.080 (10.1);
- DPR1 LOD0-3: 1.000 na wszystkich (bufor = piksele urządzenia po zmianie; przed zmianą LOD2-3 było poniżej 1, patrz 01).
Mutacja pixelRatioMax 2.0 -> 1.5 (evidence/results-assert-MUTACJA-1.5-r2.json): FAIL "DPR2 medium LOD0 ratio 0.279 < 0.9", EXIT=1. Kryterium więc odróżnia stan sprzed i po.
Przyznaję: LOD1-3 na DPR2 nadal są miękkie (0.29 / 0.20 / 0.08). Są to wartości celowej drabiny zoomLod.ts (mnożniki 0.85/0.65/0.5), która obniża koszt przy oddalaniu; właściciel zgłosił widok z bliska (LOD0). Zmiana mnożników zmieniłaby koszt GPU w całej grze przy oddaleniu i wymaga pomiaru na prawdziwym GPU, więc ODRZUCAM ją w tej rundzie. Proponuję osobny temat, jeśli właściciel zgłosi rozmycie przy średnim oddaleniu. Wartości LOD>=1 są raportowane, nie asertowane.

## Zarzut 3. Strażnik testuje stałą; brak regresji. PRZYJMUJĘ w części
- Strażnik rozszerzony o macierz zachowania: effectivePixelRatio(medium, LOD0) >= DPR dla DPR 1, 1.5, 2 (wywołuje realny kod zoomLod, nie porównuje stałej). Mutacja 1.5 daje FAIL (EXIT=1: "medium.pixelRatioMax < 2; LOD0 na DPR2 < 2; LOD0 DPR2: eff 1.5 < DPR"), wersja docelowa PASS EXIT=0 (evidence/gate-guard-r2.txt).
- Dodany test pikselowy --assert (zarzut 2), który nie zależy od wartości stałej, tylko od wyniku renderu. Obejście typu "przywróć 1.5 i zmień strażnika" nie przejdzie testu pikselowego, a obejście przez LOD też go zaczerwieni, bo mierzy LOD0. Zmiana obu jednocześnie jest zawsze możliwa przy każdym teście i to wymaga przeglądu, nie kodu.
- Lokalizacja: gra/tools to katalog, w którym repo trzyma wszystkie testy (*-test.cjs); bundle esbuild jest tam normalnym wzorcem. Nazwy *-guard.cjs nie zmieniałem, bo odwołuje się do nich raport Operatora i evidence.
- Regresje uruchomione (EXIT=0, evidence/gate-reg-*.txt): camera-zoom-block-test 4/0, city-badge-zoom-lod-test 67/0, unit-renderer-overlay-sync-test 17/0, unit-card-3d-preview-coverage-test 18/0. Playtest MAPA (gra/src/game/playtestMapaSwiata.ts) to moduł logiki gry, nie test renderu; NIE URUCHOMIONY, zmiana nie dotyka logiki mapy ani gry.
- tsc --noEmit: EXIT=0 (evidence/gate-tsc-r2.txt).
- Uzasadnienie "to jedna stała" wycofuję jako argument: stała zmienia rozmiar bufora w całej grze (patrz zarzut 4).

## Zarzut 4. Wydajność niezmierzona. PRZYJMUJĘ jako stan faktyczny, nie da się go domknąć tutaj
NIE_ZMIERZONO na prawdziwym GPU; SwiftShader jest szumem. Rachunek pikseli (fill-rate) bez zmian: DPR2 LOD0-2 medium 1.78x pikseli; DPR1 LOD3 bufor 0.75 -> 1.0 (1.78x). Draw calls 146 przed i po.
Czynniki łagodzące, z kodu: RECOMMENDED_QUALITY (hardwareProfile.ts:130-134) zaleca SLABY -> low (pr 1.0), SREDNI -> medium, MOCNY -> high; niezależnie słaby sprzęt z "Zastosuj zalecane" nie dostaje medium. Wcześniejsze wątki perf (FALA 138) dotyczyły budowy sceny mapy (mapDetail), nie pixelRatio.
Założenie (luki rozstrzygam założeniem): koszt 1.78x na DPR>=2 w presecie domyślnym jest akceptowalny; wymaga potwierdzenia właściciela albo pomiaru FC na GPU z HiDPI. To pozostaje w sekcji decyzji dla orkiestratora, nie blokuje tej rundy.

## Zarzut 5. Medium zrównał się z high w pixelRatioMax. ODRZUCAM (z dowodem), alternatywę zmierzyłem
- Różnice medium vs high pozostają: antialias false/true, shadowsEnabled false/true, fogFarMul 0.9/1.0 (mapRenderStyle.ts, presety). low = 1.0 pozostaje osobnym poziomem; trzy poziomy dalej różnią się cieniami i AA.
- Alternatywę "zostaw 1.5 i włącz AA" zmierzyłem (DPR2, LOD0, dist 4): ratio 0.155 (sharp 19.6), czyli gorzej niż 1.5 bez AA (0.279) i daleko od 1.0 przy pr 2.0. AA wygładza krawędzie, ale nie usuwa rozciągnięcia bufora 1.5 do 2.0 pikseli. Uwaga metodologiczna: wariancja Laplace'a spada też przez samo wygładzenie aliasingu, więc ta miara karze AA; wniosek jakościowy (AA nie zastępuje rozdzielczości) opiera się też na zrzutach, ale tego wariantu nie oglądałem, dlatego traktuję go jako wskazówkę, nie dowód.
- Alternatywa "podnieść tylko LOD0": wynika z danych PRZED/PO per LOD (LOD1+ pozostają jak przed: DPR2 LOD1 24.3 vs 36.2 po pełnej zmianie); nie wdrażam, bo wymagałaby zmiany zoomLod.ts (poza minimalnym zakresem), a LOD0 już rozwiązuje zgłoszenie.

## Zarzut 6. Sztuczna scena, brak testu ruchu. PRZYJMUJĘ w części
- Zgodność harnessu z produkcją sprawdzona w kodzie: canvas gry jest 100% okna (main.ts), scene.ts:3109 wywołuje setSize(w, h, false), czyli rozdzielczość bufora = CSS * pixelRatio, tak jak w harnessie. Przeskalowania canvasu przez main.ts ponad to nie ma (grep: tylko scene.ts:1626 i 3239 ustawiają pixelRatio).
- Ruch zmierzony: model przesunięty o ułamki piksela (offX 0.13/0.37/0.71 jednostki świata), DPR2 LOD0 medium: ratio 1.024 / 1.137 / 1.280 względem referencji. Brak spadku ostrości w ruchu (wartości >1 wynikają z aliasingu na krawędziach, nie z ostrzejszego obrazu). Brak EffectComposer/Bokeh/FXAA/SMAA w src (grep: pusto), więc nie ma rozmycia ruchu ani post-processingu.
- Hipoteza "kony = kolory": poza czytaniem kodu nie zmierzona w pełnej grze; obrys gracza to MeshStandardMaterial bez alpha.
- NIE_ZMIERZONO: pełna gra z mapą i mgłą (fog w scenie to mieszanie koloru, nie rozmycie), animacja chodu.

## Dowody i commit
Pliki: gra/tools/render-unit-sharpness-measure.cjs (tryb --assert), gra/tools/render-unit-sharpness-guard.cjs (macierz zachowania), 01-operator-r1.md (sprostowanie), 02-obrona-r1.md, evidence/ (gate-guard-r2, gate-assert-r2, gate-tsc-r2, gate-reg-*, results-assert-*.json). gra/src bez zmian. node_modules usunięte po pracy.

NASTĘPNY KROK: Final Control; do decyzji orkiestratora/właściciela: jakość i DPR na zrzucie, koszt GPU 1.78x na DPR>=2, ewentualny osobny temat na LOD1-3 i odświeżanie pixelRatio po zmianie DPR.

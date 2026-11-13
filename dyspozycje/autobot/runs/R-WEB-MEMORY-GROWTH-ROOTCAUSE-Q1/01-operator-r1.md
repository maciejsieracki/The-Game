STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — pamięć
TEMAT: R-WEB-MEMORY-GROWTH-ROOTCAUSE-Q1
GOAL: ustalić, co zajmuje pamięć w długiej grze i co ją zwiększa; zwolnić to, co niepotrzebne, bez zmiany reguł gry i AI; pokazać efekt pomiarem w t.50, t.60 i t.100

## Dlaczego pamięć rosła (szczegóły i tabele: `memory-attribution.md`)
Pomiar: seed 4242, 100 tur, dwie migawki sterty z drzewem dominatorów, przegląd sceny Three.js, profil próbkujący.
- **Przyczyna wzrostu: bufory geometrii scalonych meshy ulepszeń.** W t.60→t.100 sterta urosła o 81,6 MB, z czego
  **86% (69,8 MB) to `JSArrayBufferData`**. Scena pokazuje dokładnie to samo: meshe ulepszeń mają 155 MB w t.100,
  ~57 KB na heks. `collapseToMergedMesh` zapisywał każdy trójkąt osobno, bez indeksów, z 24 B na wierzchołek, a kopia
  CPU zostawała w pamięci przy GPU. To pamięć zajęta niepotrzebnie, nie wyciek: każdy mesh należy do istniejącego ulepszenia.
- Po t.60 obiekty V8 stoją w miejscu (214 → 225 MB). Modele jednostek (~55 MB, ~89 Object3D na jednostkę) i miast
  (~27 MB) rosną tylko razem z liczbą jednostek i miast. Logika i AI zajmują ok. 31 MB, a zapis gry to 1,3 MB JSON.
- **Duża baza 312 MB** to głównie źródło skryptu trzymane jako string UTF-16: 158 MB stale. Bundle ma ~75 mln znaków
  i zawiera polskie litery, więc Blink nie może go przechować w 1 bajcie na znak. Dochodzi do tego 68 MB stringów
  bundla, 34 MB nakładek złóż i 25 MB kodu.
- Bez wzrostu: DOM (~1 300 węzłów), listenery (CDP 259→320), tekstury (31), programy shaderów (36–38), canvasy (2),
  mapy rendererów. Nie znalazłem kolekcji, która rośnie bez ograniczenia.

## Co zmieniłem (allowlista: `gra/src/render/mergeDecor.ts`, `gra/src/main.ts`, nowe narzędzia `gra/tools/memory-growth-*.cjs`)
1. `mergeDecor.ts` `indexIdenticalVertices`: wierzchołki identyczne bit w bit (pozycja i kolor) są teraz współdzielone
   przez indeksy. Trójkąty i ich kolejność się nie zmieniają, a `flatShading` liczy normalne z pozycji, więc obraz
   jest ten sam. Dotyczy wszystkich scalonych dekoracji.
2. `releaseMergedDecorCpuArraysAfterUpload`, tylko dla meshy ulepszeń (`main.ts`, spawnImprovementMesh): kopia CPU
   jest zwalniana po wysłaniu do GPU, a sfera otaczająca liczona wcześniej. Na `webglcontextrestored` meshe ulepszeń
   są przebudowywane (`rebuildImprovementMeshesAfterContextRestore`). Hak testowy w `__fortTerritoryTestDebug`:
   `improvementMeshInfo`, `nearLandHexWithoutImprovement`, `glLoseContext` (tylko odczyt i symulacja utraty kontekstu).

## Wynik (ten sam seed, PRZED = 318c6ecdb, PO = ta zmiana; load average 4–9 na 4 rdzeniach, zapisany w `raw-*.jsonl`)
| | t.1 | t.50 | t.60 | t.100 | MB/turę t.60→100 | t.50→100 |
|---|---|---|---|---|---|---|
| PRZED | 322 | 447 | 491 | 573 | 2,05 | 2,52 |
| PO | 297 | 391 | 416 | **444** | **0,70 (2,9× mniej)** | 1,06 (2,4×) |

Geometria ulepszeń w t.100: 155 → 42 MB. Złoża: 21,8 → 7,3 MB. `JSArrayBufferData` w migawce: 190,8 → 63,3 MB.
Reszta wzrostu to nowe ulepszenia (~16 KB na heks) i nowe miasta, czyli stan gry.

## TESTY (logi `gate-*.txt` z `EXIT=`, na drzewie po rebase na `origin/main` 2c4ac1a58)
- tsc 5.9.3: 0 błędów. logic 213/213, tech-tree 19/19, research 33/33, combat OK.
- Wyniki identyczne jak w bazie (błędy istniały już wcześniej): unit-power 4/2, unit-replace 3 FAIL (Evocati),
  mgła-inwariant 39/3 (przesunięte tylko numery linii), ai-test 274/20 z identycznym zestawem FAIL.
- Determinizm: hashe `war-allin-capital-quick` (8 scenariuszy, 30 tur) są identyczne z bazą
  (sha listy hashy a25bef07777f366c, `gate-base-*`).
- NOWE: `memory-growth-merge-index-test` 24/0. 13 realnych modeli ulepszeń daje trójkąty identyczne bit w bit ze starym
  algorytmem, przy 30,5% dawnej liczby bajtów. Sprawdzone też ścieżka Uint32, brak duplikatów i zwolnienie tablic.
- NOWE, w przeglądarce: `memory-growth-improvement-cpu-release-test` 11/0 (zwolnienie tablic po renderze, utrata
  i odzyskanie kontekstu WebGL, zero błędów) oraz `memory-growth-visual-parity-test` 4/0. Zrzuty z buildów produkcyjnych
  origin/main i tej zmiany są **identyczne piksel w piksel** (0 z 315 000 różnych), na kadrze startowym i po postawieniu posterunku.
- Pomiar 100 tur wykonałem na buildzie sprzed rebase (baza 318c6ecdb). Rebase zmienił tylko kod PLACED (cache ulepszeń
  właściciela) i nie dotknął mergeDecor. NIE_ZMIERZONO ponownie 100 tur po rebase.

## Kandydaci NIEnaprawieni
- **Bundle tylko w ASCII: −71 MB stale, ZMIERZONE.** Build produkcyjny w t.1 zajmuje 286 MB, a ze skryptem tylko
  w ASCII 215 MB, bez błędów. Wymaga `esbuild.charset:'ascii'` w `vite.config.ts` oraz ucieczek `\uXXXX` w literałach
  regex z polskimi literami. To poza allowlistą i wymaga decyzji orkiestratora.
- Scalenie modeli jednostek: ~35–45 MB. Scalenie statycznych modeli miast: ~15–20 MB. Wspólny materiał scalonych meshy:
  ~1–2 MB. Pamięci podręczne `hexesInCitySight`: ≤5 MB (próbkowanie, niska pewność).

## ZAŁOŻENIA
- Zwolnienie tablic ulepszeń działa tylko na meshach, które trafiły do kadru, bo three.js wysyła do GPU tylko widoczne
  obiekty. Główny zysk daje indeksowanie, niezależne od kamery.
- Drugi niezależny seed: NIE_ZMIERZONO. Zamiast niego jest ten sam seed z zapisanym obciążeniem maszyny, co dyspozycja dopuszcza.

ZMIANY/COMMIT: da7e9a63aaafe10f7b569061233c3fd1756f991e (kod, narzędzia, dane; rebase na origin/main 2c4ac1a58); raport w kolejnym commicie
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus 5.5)
DEPLOY/PUSH: NIE WYKONANO

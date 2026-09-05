# 01 — Operator, runda 1

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: P-KOPALNIA-PODSWIETLENIE-KOSMETYKA-Q1
MODEL+EFFORT: Opus 5, effort high
GOAL: zamknąć N3/N5/N6 i rozstrzygnąć N2 pomiarem, nie opinią.

## Ustalenie nadrzędne — wszystkie cztery uwagi są już w `main`

Guard §2b: `ee1f6756`, drzewo czyste. Weryfikacja „już wdrożone" komendą z C-056:
`git merge-base --is-ancestor ac09c091 HEAD` → **YES**. Commit `ac09c091`
(2026-08-18, „fix: domknij poprawki overlayu kopalni") dotyka dokładnie trzech
plików allowlisty i zamyka N2, N3, N5 i N6. Uwagi Evaluatora opisują stan
`b0f9bcb9` (2026-08-17) i ich numery linii nie wskazują dziś tych konstrukcji.

| Uwaga | Stan na `ee1f6756` | Dowód |
|---|---|---|
| N3 | `clearMineEligibleOverlay()` = pierwsza linia `applySceneResult()` (`main.ts:33332-33333`) | mutacja (usunięcie linii) → bramka **75/1** |
| N5 | tautologia zastąpiona regexem importu (`…test.cjs:288`); linia 277 to dziś asercja `renderOrder === 3` | patrz niżej |
| N6 | komentarz mówi „w większości zasłonięty… jedynie wąski pierścień" (`rangeOverlay.ts:461-464`) | przeliczenie własne, niżej |
| N2 | `MINE_ELIGIBLE_STYLE.hugTerrainRelief = true`; w **ścieżce warstwy kopalni** (`rangeOverlay.ts`) **nie ma już** `depthTest:false` [ERRATA R1-Z3] | pomiar w Chromium, niżej |

**Nie wprowadziłem żadnej zmiany w `gra/`** — naprawianie naprawionego byłoby
zmyśleniem pracy. Dostarczyłem natomiast dowód, którego brakowało.

## N2 — pomiar w żywym Chromium (§9 poz. 6b)

Harness: `dowody/n2-depthtest-chromium.cjs`. Realny WebGL, produkcyjna geometria
(`goraGeometria`/`wzgorzeGeometria`, `wariantDlaHeksa`, `rotacjaDlaHeksa`,
`terrainSurfaceTopY`, `buildRangeOverlayGroup`), jedna scena i jedna kamera dla obu
wariantów. PRZED = rekonstrukcja historycznego `applyAlwaysOnTop` (płaski krążek +
`depthTest=false` + renderOrder 8/9). Pomiar różnicowy piksel-po-pikselu, maski
regionów z osobnego przebiegu ID — bez heurystyk kolorystycznych.

| Wariant | warstwa maluje | na modelu jednostki | na górze-przesłonie (niepodświetlonej) |
|---|---|---|---|
| PRZED (`depthTest:false`) | 37 096 px | **1 084 / 5 158 (21,0 %)** | **5 617 / 34 892 (16,1 %)** |
| PO (`hugTerrainRelief`, HEAD) | 44 291 px | **0 (0,0 %)** | **0 (0,0 %)** |

**Werdykt: wariant celowany istnieje i już działa.** Artefakt N2 odtworzony w PRZED
i zniknął w PO przy widoczności **119 %** poprzedniej — płachta oblekająca pokrywa
całą powierzchnię bryły, a nie sam krążek, więc jest lepiej widoczna, nie gorzej.
Zrzuty: `dowody/n2-przed-depthtest-false.png`, `dowody/n2-po-hugterrainrelief.png`,
`dowody/n2-scena-bez-warstwy.png` [ERRATA R1-Z1].

## N5 — dowód nietautologiczności

Mutacja: usunięcie **wyłącznie specyfikatora importu** `MINE_ELIGIBLE_STYLE`
(identyfikator zostaje w pliku 2×). Stara asercja `/…,?\n/ || /…/` → **ZIELONA
(nie wykrywa)**; asercja z HEAD → **CZERWONA**, bramka 75/1. Liczba asercji nie
spadła: 76 (przed `ac09c091` było 66).

## N6 — przeliczenie własne, z rozbieżnością

Tint 0,97·HEX_R (`HUG_RELIEF_RADIUS_FRAC` = promień płaskiego krążka), `yOffset`
0,06. Zmierzyłem realny promień przesłaniania raycastem po `powierzchniaReliefuY`
dla 5 wariantów × 720 kierunków, na wysokości krążka: **wzgórze 0,777–0,915·R,
góra 0,714–0,818·R** → widoczny pierścień **11,0–45,7 % pola krążka**.
Kierunek komentarza z HEAD jest poprawny co do tego, że krążek nigdy nie znikał
w całości — ale sformułowanie „jedynie wąski pierścień" przeszacowuje zasłonięcie
dla Góry (do 45,9 % pola krążka). [ERRATA R1-Z2 — poprawione w rundzie 1, obrona]

**Rozbieżność (tryb trzeci): bracket 0,87–0,92·R z dispatchu to wartości stałych
`GORA_FOOTPRINT_R`/`WZGORZE_FOOTPRINT_R`, a nie efektywny promień przesłaniania.**
Realny bracket to 0,71–0,92·R, więc pierścień jest szerszy, niż sugeruje dispatch.
Dodatkowo `WZGORZE_FOOTPRINT_R = 0,92` opisana jako „maks. promień podstawy" jest
zaniżona: sylwetka wariantu 1 sięga u podstawy 0,963·R. To nota, nie defekt —
`teren-gory-wzgorza.ts` jest poza allowlistą, nic tam nie ruszałem.

## ZMIANY/COMMIT

Bez zmian w `gra/`. Dodane wyłącznie artefakty runu:
`dyspozycje/autobot/runs/P-KOPALNIA-PODSWIETLENIE-KOSMETYKA-Q1/dowody/`
(harness + 3 zrzuty) oraz ten raport. Commit po jawnych ścieżkach.

## TESTY

- `kopalnia-podswietlenie-heksow-test.cjs` — **76/0** (mutacje N3 i N5 → 75/1, obie cofnięte KOPIĄ pliku, `git diff --quiet` czysty)
- `node ./node_modules/typescript/bin/tsc --noEmit` — **0 błędów**, kompilator 5.9.3 (C-029: `gra/node_modules` obecne)
- logic **213/213**, tech-tree **19/19**, research **33/33**, unit-replace **13/13**, combat **6/6**
- N2 w Chromium — patrz tabela wyżej

## BLOKADY

Konflikt dispatch↔kod (C-054): dispatch opisuje cztery otwarte defekty, których
w `main` nie ma. Kryteria 1–3 są spełnione przez `ac09c091`, kryterium 4 przez ten
run, kryteria 5–7 zmierzone. Decyzja orkiestratora: zamknąć temat jako
zrealizowany-przed-dispatchem (dowód N2 dopięty tu), czy oczekuje czegoś ponadto.

## RUNDY

1/5.

## NASTĘPNY KROK

Evaluator — niezależna weryfikacja tezy „wszystkie cztery uwagi już w `main`"
(`git merge-base --is-ancestor ac09c091 HEAD`) oraz powtórzenie pomiaru N2.

DEPLOY/PUSH: NIE WYKONANO


---

## ERRATA (dopisana w rundzie 1, faza obrony — nie zmienia werdyktu)

Trzy zarzuty Evaluatora (`02-evaluator-runda1.md`) przyjęte; szczegóły i dowody
w `03-obrona-runda1.md`. Tekst powyżej poprawiony wyłącznie w miejscach oznaczonych
`[ERRATA …]`, reszta zostaje jako zapis historyczny.

- **R1-Z1** — `dowody/n2-scena-bez-warstwy.png` trzymał przebieg MASEK ID, nie scenę
  referencyjną: dla wariantu `'brak'` (`overlay === null`) harness nie renderował ponownie
  po przywróceniu materiałów. Naprawione w `dowody/n2-depthtest-chromium.cjs`
  (render bezwarunkowy), zrzut przegenerowany. Dwa nośne zrzuty PRZED/PO są
  bit-identyczne po naprawie — defekt nie dotykał pomiaru.
- **R1-Z2** — komentarz N6 w `rangeOverlay.ts` mówił „jedynie wąski pierścień"; zmierzony
  pierścień to 11,1–45,9 % pola krążka (Góra 28,8–45,9 %). Komentarz przepisany na liczby.
- **R1-Z3** — zdanie „w `gra/src/render/` nie ma już `depthTest:false`" było FAŁSZYWE:
  jest **13** przypisań w **8** plikach (units ×4, siegeMarker ×3, cities, unitOwnerEmblem,
  cityMapStatChip, workerFieldOverlay, cityOkolicaOverlay, unitStatPlate). Prawdziwe
  i wystarczające dla N2 jest zdanie węższe: nie ma go w ścieżce warstwy kopalni
  (`rangeOverlay.ts` — tam `depthTest` zostaje domyślne `true`, `rangeOverlay.ts:422`).
  Wszystkie 13 wystąpień to warstwy HUD/sprite'y poza tematem i poza allowlistą.

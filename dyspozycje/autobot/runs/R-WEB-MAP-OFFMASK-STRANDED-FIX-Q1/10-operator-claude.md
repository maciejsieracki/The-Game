# R-WEB-MAP-OFFMASK-STRANDED-FIX-Q1 — raport Operatora (runda 1/5, HAIKU 5.5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (generator map)
TEMAT: R-WEB-MAP-OFFMASK-STRANDED-FIX-Q1 (MAPFIX, P3+P4; kandydaci z dyspozycji #131/#135)
GOAL: (P3) Ziemia: po generowaniu 0 heksów lądu poza maską szablonu; (P4) wszystkie typy: po generowaniu 0 samotnych suchych heksów bez sąsiada-lądu na otwartym oceanie. Bez zmiany udziału lądu poza usuniętymi heksami; RIVERS3B / RIVERS (`refillMainRiverCoastMouth`, ujścia) nie ruszane.

## ZMIANY / COMMIT
Baza: 1bb77a7a0 (origin/main). Commit z kodem: SHA w polu `sha` wyniku (ten sam commit zawiera raport).

- `gra/src/map/generator.ts`: nowy przebieg **3e-final** po ostatnim `ensureRiverOutlets` (przed fairplay-final): dla `ziemia` `enforceEarthTemplateOnHexes`, dla wszystkich typów `purgeOpenOceanLandSpecks`. Usuwa 72 łąki poza maską (Ziemia 777/42) i samotne lądy (wyspy 108×74 s42: 1 heks).
- `gra/src/map/earth-land-mask.ts`: `earthTemplateLandAt` wyklucza **izolowany heks szablonu** (lądowy, bez lądowego sąsiada w szablonie). Surowe próbkowanie przeniesione do `earthTemplateRawLandAt`. Powód: patrz „Przyczyna”.
- `gra/tools/map-offmask-stranded-fix-test.cjs` (nowy): P3 Ziemia 777 i 42 = 0 poza maską; P4 wyspy 108×74 s42 = 0 samotnych lądów.
- `docs/obieg/MAPA-KANON-GENERATOR.md`: jedno zdanie o gwarancjach (sekcja Ziemia).
- `dyspozycje/autobot/runs/R-WEB-MAP-OFFMASK-STRANDED-FIX-Q1/measure.cjs` (pomiar PRZED/PO) i ten raport.

## PRZYCZYNA (dowód, nie założenie)
Ślad etapów (instrumentowana kopia w scratchpad, nie w repo): po terenie off-mask = 0; skok do 72 na `removeInlandWaterPools` (przebieg 1a, wywołane przez `finalizeCoastAndInlandWater`, ziemia): `findInlandWaterHexes` uznaje za „odcięte” morze poza maską, którego nie da się połączyć z oceanem brzegowym, i zamienia je w łąkę. Kolejne przebiegi (`enforceEarthTemplateOnHexes`) zerują licznik, ale końcowy `finalizeCoastAndInlandWater` (po `ensureRiverOutlets`, przed fairplay) znów wprowadza 72 łąki. Postwarunek P4: 5 samotnych lądów na Ziemi (777/42) to **izolowane piksele szablonu maski** (`40,54 41,55 44,56 117,61 141,64` — policzone skryptem na `earthTemplateLandAt`); są w masce, więc ich zamiana na morze łamałaby test „0 morza w masce” (`earth-template-test` duzy). Stąd zmiana reguły maski zamiast samego przycięcia.

## POMIAR PRZED/PO (te same ziarna; pojedyncze przebiegi, czasy z zegara — szum)
Liczby: land = heksy nie-morze; masses = spójne masy lądu; rzeki = heksy z `rzeka.obecna`; off-mask = ląd poza maską (Ziemia); specks = `countOpenOceanLandSpecks`.

| Mapa | PRZED land / masses / rzeki / off-mask / specks | PO land / masses / rzeki / off-mask / specks | Uwagi |
|---|---|---|---|
| ziemia 168×120 s777 | 3155 / 22 / 1197 / 72 / 5 | 3078 / 17 / 1196 / 0 / 0 | land −77 = −72 off-mask −5 izolowanych pikseli (= 5 specks); masses −5 (5 pojedynczych heksów); rzeki −1 |
| ziemia 168×120 s42 | 3155 / 22 / 1233 / 72 / 5 | 3078 / 17 / 1228 / 0 / 0 | jak wyżej; rzeki −5 |
| ziemia 168×120 s7 | NIE ZMIERZONO | 3078 / 17 / 1194 / 0 / 0 | tylko PO |
| wyspy 108×74 s42 | 3996 / 58 / 3536 / 0 / 1 | 3995 / 57 / 3536 / 0 / 0 | land −1 (1 speck); rzeki bez zmian |
| kontynenty 168×120 s42 | 6047 / 22 / 5007 / 0 / 0 | 6047 / 22 / 5007 / 0 / 0 | bez zmian |
| pangea 168×120 s7 | 11968 / 1 / 3231 / 0 / 0 | 11968 / 1 / 3231 / 0 / 0 | bez zmian |
| kontynenty s7 / s99 / s12345 | NIE ZMIERZONO | 0 specks (6048 / 29 / 5498; 6047 / 29 / 5497; 6048 / 22 / 5282) | tylko PO |
| pangea s42 / s11 | NIE ZMIERZONO | 0 specks (11925 / 1; 11962 / 1) | tylko PO |

Ocena: zmiana lądu ogranicza się do heksów usuniętych (Ziemia: 72 + 5 izolowanych; wyspy: 1 speck). Rzeki: różnice liczbowe (Ziemia −1/−5, wyspy 0) są zgodne z liczbą usuniętych heksów z rzeką, ale NIE ZMIERZONO per-heks, że każda różnica leży dokładnie na usuniętym heksie. Czas generowania: bez istotnej zmiany (Ziemia ~40 s, wyspy ~70 s, kontynenty ~115 s, pangea ~25–37 s; pojedyncze pomiary).

## TESTY / BRAMKI
- `tsc`: NIE ZMIERZONO (nie uruchomiono `npm run typecheck` w tym przebiegu).
- Nowy test `gra/tools/map-offmask-stranded-fix-test.cjs`: **3 pass / 0 fail** (ziemia 777 found 0; ziemia 42 found 0; wyspy 108×74 s42 found 0).
- Mutacja czerwona: wyłączenie bloku 3e-final (`if (false)` + wyłączony `purgeOpenOceanLandSpecks`) → **0 pass / 3 fail**. Przywrócono (cmp OK).
- `gra/tools/earth-template-test.cjs`: **9 pass / 1 fail**. Fail: `Antarktyda w szablonie nad buforem południowym (found 0 heksów przy r=85)` — **STARY-PIN**, pochodzi sprzed zmiany (C-MAP-Q3c usunął Antarktydę z maski); NIE zmieniano asercji (zakaz osłabiania). Zostaje do decyzji ANTARDOC (#145). Asercja `ziemia duzy: 0 morza w masce` przechodzi po poprawce maski (przy samym przycięciu bez poprawki maski dawała found 5 — stąd zmiana `earthTemplateLandAt`).
- `gra/tools/stranded-land-test.cjs`: **NIE uruchomiono w całości** (czas > 10 min w jednym wywołaniu). Ręcznie zmierzono wszystkie 9 przypadków z tego testu, dla których specks = 0 PO: kontynenty 42/7/99/12345, pangea 42/11, wyspy 42, ziemia 7/42. Część „pustynia w oceanie” (`countPustyniaInOcean`) NIE ZMIERZONO.
- Piny zależne od geometrii (`map-gen-regression`, `world-density-test`, `determinism-save-load`, `river-*`, `deposit-coast`, `relief-grid`, `fair-play`, `climate-band`): **NIE ZMIERZONO**. Zmiana geometrii Ziemi (−77 lądu) i wysp (−1) może przesunąć piny liczbowe; przepięcie pinów wymaga osobnego biegu i nie zostało wykonane.

## BLOKADY
- Brak. Pinów nie przepinano (żaden pin nie został zmierzony jako zmieniony wyłącznie przez usunięte heksy).
- NIE ZMIERZONO: pełny pomiar pinów wymienionych wyżej (czas / limit jednego wywołania).

## RUNDY
1/5. Werdykt: Operator — PASS-WITH-NOTES (dla Evaluatora i Final Control).

## UWAGI-DLA-ORKIESTRATORA
1. **Zmiana reguły maski Ziemi (earth-land-mask.ts):** 5 izolowanych pikseli szablonu przestaje być lądem. Efekt dla gracza: 5 pojedynczych heksów lądu znika z mapy Ziemi (tej samej klasy co P4). Nie jest to decyzja wyglądu (nie zmienia konturu kontynentów); jeśli właściciel uważa to za decyzję — zgłaszam jako informację, nie DECISION_REQUIRED.
2. **Antarktyda (STARY-PIN)** w `earth-template-test` — pre-existing, poza zakresem tematu; kandydat na ANTARDOC (#145).
3. **Ziemia „duzy” (4242)** — asercje mask-morze przechodzą po poprawce; pełny bieg testu wymagał 6,5 min (wykonany, wynik jak wyżej).
4. Kolejność przebiegu: nowy blok stoi po drugim `ensureRiverOutlets`. Jeśli FC zażąda, by rzeki były przeliczone po usunięciu heksów — to świadomie NIE zrobione (ujścia nietknięte); do sprawdzenia w pinach rzek.
5. Repro-artefakty (`repro/.bundle-*`, `.entry-*`) usunięte z worktree; nie są częścią commita.

## NASTĘPNY KROK
Evaluator: odtworzyć `map-offmask-stranded-fix-test.cjs` (3/0) i mutację (0/3), zweryfikować tabelę PRZED/PO (measure.cjs, GRA_DIR → baza 1bb77a7a0). Final Control: pełne piny geometrii (map-gen-regression, world-density, river-*, determinism) przed przepinaniem.

DEPLOY/PUSH: NIE WYKONANO

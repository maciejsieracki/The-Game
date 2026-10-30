# REPIN-DELTA-2 — pomiar delty weba po pinie `edb8fb56` / `91dc998a` do `dc8a3adc`

**Temat:** `R-RUSTPORT-REPIN-DELTA-2-Q1` (faza U0 planu `dyspozycje/rust-port/PLAN-AKTUALIZACJI-PORTU-DO-WEBA-20261030.md`).
**Typ:** dokumentacja, pomiar. Zero zmian kodu (`rust-port/**`, `src-tauri/**`, `gra/**` nietknięte).
**Pin odczytu:** `origin/main` = **`dc8a3adc989bc82aab2cde6bb747c883f949fc1a`** (`docs(autobot): close manual battle validation`), pobrany `git fetch origin main` w chwili pomiaru.
**Źródło narzędzi pomiarowych:** `origin/rust-port/parity-v2` = `db102531c8d54b0621713c1a58bd4d03adf7029f` (`src-tauri/frontend-v2/tools/`: `measure-k08d/k08e/k09a-drift.mjs`, `verify-pin-copies.mjs`, `pin-manifest.json`; wektory `rust-port/engine/tests/*_vectors/`).
**Archiwum weba:** `git archive dc8a3adc gra` oraz `git archive edb8fb56 gra/src gra/data`, rozpakowane poza repo (scratchpad sesji).
**Skrypty pomocnicze** (nie są kodem produktu): `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DELTA-2-Q1/tools/`.

## 0. Liczby bazowe (każda z komendy)

| Miara | Wynik | Komenda |
|---|---|---|
| Commity `edb8fb56..origin/main` | 186 | `git rev-list --count edb8fb56..origin/main` |
| Commity `91dc998a..origin/main` (etap 2) | 99 | `git rev-list --count 91dc998a..origin/main` |
| Commity `edb8fb56..91dc998a` (etap 1) | 87 | `git rev-list --count edb8fb56..91dc998a` |
| Pliki `gra/src`+`gra/data` zmienione `edb8fb56→origin/main` | 101 (27 nowych, 74 zmienione) | `git diff --name-only edb8fb56 origin/main -- gra/src gra/data` |
| Pliki etapu 2 (`91dc998a→origin/main`) | **23**, +1733 / −358 | `git diff --numstat 91dc998a origin/main -- gra/src gra/data` |
| Nowe pliki od `91dc998a` (podzbiór etapu 2) | 3 (`battle-mode.ts`, `generalQuickFollow.ts`, `buildHighlight.ts`) | `git diff --diff-filter=A --name-only 91dc998a origin/main -- gra/src gra/data` |
| Hunki etapu 2 | 251 w 23 plikach | `git diff -U0 91dc998a origin/main -- gra/src gra/data` + `tools/hunks.mjs` |
| Pliki `TODO`/`CZĘŚĆ` w planie (etap 1 do domknięcia) | 50 | kolumna `Stan` tabeli planu + `tools/join.mjs` |

**Klasyfikacja hunków (metoda):** heurystyka po treści zmienionych linii (`tools/hunks.mjs`): `pusty` (wszystkie zmienione linie puste lub białe znaki; wystąpił tylko w etapie 1, `order.ts`, hunk 161-181), `komentarz` (wszystkie niepuste linie zaczynają się od `//`, `/*`, `*`), `import`, `typ` (`type`/`interface` lub same deklaracje pól typu), `nazwa/tekst` (różnica wyłącznie w literałach stringów), `behawioralna` (reszta, także hunki mieszane kod+komentarz). Klasa `behawioralna` jest więc **górnym szacunkiem** i wymaga ręcznego przeglądu w U1/U2 przed portem. Wynik dla etapu 2: behawioralna 225, nazwa/tekst 13, import 6, komentarz 4, typ 3 (razem 251).

## 1. Wyniki pomiarów

### 1.1 Dryf bloków `cityPanel.ts` (K01–K09) względem `dc8a3adc`

Komendy z katalogu `src-tauri/frontend-v2/` (narzędzia z `db102531`); `--pin-dir` = `edb8fb56`, bieżący = `dc8a3adc`.

| Blok | Komenda | Wynik |
|---|---|---|
| **K09A** (9 jednostek) | `node tools/dom-harness/measure-k09a-drift.mjs --pin-dir <pin-edb> --head-pin-dir <main>` → EXIT 0 | **9/9 SAME, dryf 0.** Przesunięcie linii +192 (np. `switchCity` 10209→10401). Hunki kopii: 42 (informacyjnie). |
| **K08D** (11 jednostek) | `node tools/dom-harness/measure-k08d-drift.mjs --pin-dir <pin-edb> --cur-dir <main>` → EXIT 1 | **2/11 ZMIENIONE:** `buildHandelDetailCard` (161 → 155 linii), `buildWealthDetailCard` (121 → 122 linii). 9/11 IDENTYCZNA. |
| **K08E** (12 jednostek) | `node tools/dom-harness/measure-k08e-drift.mjs --pin-dir <pin-edb> --head-pin-dir <main>` → EXIT 0 | Kopie rozjechane **0/12** (`kopia_diff=0`). Pin vs main: **11 SAME, 1 DRIFT(1):** `buildTopBarRekruciDetailCard` (5652–5682 → 5713–5743). |
| K01–K07, K08A–C | brak `measure-k0*-drift` na `parity-v2` (są tylko `mutate-*`/`run-*`) | **NIE_ZMIERZONO** tymi narzędziami; pomiar na poziomie funkcji (1.2) obejmuje wszystkie bloki. |

Korekta do planu: sekcja 2 pkt 3 planu mówi o dryfie „0 zmian” dla K08A–K09A. Dla K08D jest to już nieaktualne (2 jednostki zmienione).

### 1.2 Dryf na poziomie funkcji `cityPanel.ts` (przypisanie do bloków: heurystyka po nazwie, ZAŁOŻENIE)

Komenda: `node tools/cp-funcs.mjs` (ciała funkcji po nazwie, pin `edb8fb56` vs `dc8a3adc`, porównanie po `trimEnd`).

Wynik: **funkcje w pinie 300, identyczne 278, zmienione 22, usunięte 0, nowe w `dc8a3adc` 6.**

| Funkcja (zmieniona) | Zakres pin → main | Blok (wg narzędzi dom-harness) |
|---|---|---|
| `queueItemCumulativeEta` | 889–910 → 931–959 | brak w narzędziach (K01/K02?; do ręcznego przypisania) |
| `computeView` | 1137–1302 → 1186–1346 | K03 (`run-k03-units`); nie jest jednostką K09A |
| `computeOrderStateLocal` | 3114–3259 → 3158–3313 | K08D (`k08d-subs`), K03 |
| `buildWealthDetailCard` | 4824–4944 → 4878–4999 | **K08D — zmieniona (potwierdzone)**; K04C |
| `buildPracaDetailCard` | 4946–5018 → 5001–5073 | K08C |
| `appendPodzialPracyInfo` | 5028–5098 → 5083–5159 | K08C, K06B |
| `buildTopBarRekruciDetailCard` | 5652–5682 → 5713–5743 | **K08E — DRIFT(1) (potwierdzone)** |
| `buildBuildingInfocard` | 7013–7134 → 7074–7195 | K05B |
| `buildBuildingDetailCardViaEntityCard` | 7537–7556 → 7598–7619 | K05B |
| `_legacyBuildBuildingDetailCard` | 7573–7697 → 7636–7760 | K05B |
| `buildBuildingBuildTabDetailCard` | 7704–7804 → 7767–7869 | K05B |
| `recruitManpowerCost` | 8050–8054 → 8115–8120 | K05A, K05B |
| `unitStockCostChipsHtml` | 8112–8124 → 8178–8192 | K05A |
| `appendUnitRecruitCompactRow` | 8137–8181 → 8220–8269 | K08B, K06B, K08C |
| `appendRecruitmentQueue` | 8210–8297 → 8361–8453 | K06B |
| `appendBuildQueueSection` | 8300–8427 → 8456–8587 | K06B |
| `renderProd` | 8429–8535 → 8589–8698 | K07B (K09A-tool tylko wymienia; nie jest jednostką K09A) |
| `formatBuildingCatalogLockHint` | 8542–8576 → 8705–8742 | K05A |
| `renderBuildList` | 8734–8859 → 8902–9041 | K06B |
| `buildRecruitTabDetailCard` | 8861–8889 → 9043–9073 | K08B, K05B, K08C |
| `renderPurchasableUnits` | 8891–8977 → 9075–9169 | K08B, K08C |
| `buildHandelDetailCard` | 10845–11005 → 11037–11191 | **K08D — zmieniona (potwierdzone)** |

Nowe funkcje w `dc8a3adc` (brak w pinie): helpery `buildingWorkPerTurnForCity` (629), `unitRecruitmentCapacityForCity` (638), `rushCostModifierForCity` (647); eksporty `recruitPanelPurchasableUnits` (8211), `mountGeneralRecruitmentCardForArmy` (8272), `mountCityRecruitmentCardsForArmy` (8324). Właściciel: ZAŁOŻENIE — REPIN-UI-2 / K09C–K09D (podpięcie produkcyjne); narzędzia ich nie mierzą.

Wniosek: poza K08D (2) i K08E (1) żadna jednostka objęta istniejącymi narzędziami K08/K09A nie dryfuje. **22 funkcje są jednak zmienione**, a bloki K01–K07 i K08A–C nie mają narzędzia pomiarowego — przed re-kopią trzeba je zmierzyć (luka, §9).

### 1.3 Kopie bajtowe frontend-v2 (manifest `tools/pin-manifest.json`, pin `edb8fb56`)

- `node tools/verify-pin-copies.mjs` (drzewo `parity-v2`) → `plików=435 niezgodnych=0`, EXIT 0.
- Porównanie każdej kopii z **`origin/main`** (sha pliku `gra/...` w `dc8a3adc` vs `sha256` z manifestu): `identyczne=433 rozjechane=2 brak_zrodla=0` (`tools/copies-drift.mjs`).
- **Rozjechane kopie (wymagają re-kopii na pin docelowy):**
  - `src/ui/armyMergePanel.ts` ← `gra/src/ui/armyMergePanel.ts` (etap 2, +73/−3)
  - `src/ui/unitActionBarHtml.ts` ← `gra/src/ui/unitActionBarHtml.ts` (etap 2, +11/−2)

`cityPanel.ts` nie jest kopią pliku w manifeście (kopie są blokami); jego dryf mierzą wyłącznie 1.1–1.2.

### 1.4 Wektory i `meta.pin` do regeneracji (grep literału na `parity-v2`)

- `meta.pin`: **nie znaleziono** żadnego pliku `meta.pin` w `rust-port/` (`git ls-tree -r --name-only origin/rust-port/parity-v2 -- rust-port | grep meta.pin` puste). ZAŁOŻENIE: pin jest literałem w plikach wektorów i generatorach.
- Pliki `rust-port/engine/tests/*_vectors/*` z literałem pinu: **89** (`git grep -l … -- 'rust-port/engine/tests/*_vectors/*'`): z `edb8fb56` — **66**, z `91dc998a` — **23** (lista w §5).
- Generatory `dyspozycje/autobot/runs/*/gen*` z literałem `edb8fb56`: **69** (archiwum runów, w większości historyczne); z `91dc998a`: 10 plików `.mjs` (+1 log).

### 1.5 Hunki etapu 2 — skrót

Pełna lista hunków behawioralnych (plik:linia w `origin/main`, format `start-koniec(-usunięte/+dodane)`) w §2. Najwięcej zmian: `battleScene.ts` (+443/−58, 50 hunków), `main.ts` (+207/−64, 50), `newGameFlow.ts` (+92/−142, 33), `warAllInCapital.ts` (+206/−14, 15), `diplomacyTradeBasket.ts` (+92/−15, 23).

## 2. Hunki etapu 2 (23 pliki, `91dc998a → dc8a3adc`)

Każdy plik ma temat docelowy (kolumna „temat”). Zakres linii w `origin/main`.

- `gra/src/battle/battleScene.ts` — temat: REPIN-3D (na koniec, Opus); hunki beh. (plik:linia weba w origin/main, nowe): 1915-1916(-0/+2), 1965(-1/+1), 2223-2224(-0/+2), 5024(-0/+1), 5049-5054(-2/+6), 5672(-0/+1), 5680-5682(-0/+3), 5684(-0/+1), 5695-5701(-0/+7), 6525-6531(-1/+7), 6592-6625(-0/+34), 7410(-8/+1), 7631-7635(-4/+5), 7639-7645(-1/+7), 7649-7650(-2/+2), 7654-7677(-0/+24), 7717-7726(-3/+10), 7736-7740(-1/+5), 7752(-0/+1), 7754(-0/+1), 7989-7993(-1/+5), 7995-7997(-0/+3), 8000(-1/+1), 8017(-0/+1), 8031(-1/+1), 9207(-1/+1), 9213-9216(-4/+4), 10778(-1/+1), 10780(-1/+1), 16345(-0/+1), 16364-16369(-2/+6), 16558(-0/+1), 16606(-1/+0), 16608-16615(-0/+8), 17168-17177(-0/+10), 17189-17225(-0/+37), 17264-17268(-1/+5), 17514-17518(-2/+5), 17520(-1/+1), 17523-17535(-2/+13), 17544(-0/+1), 17546(-0/+1), 17552-17594(-0/+43), 17603(-2/+1), 17607-17622(-13/+16), 17629-17728(-0/+100), 17834-17865(-0/+32), 17970-17971(-1/+2), 18132(-0/+1), 18234-18253(-0/+20)
- `gra/src/battle/formationRules.ts` — temat: WOJNA-2 (refresh formation_rules.rs); hunki beh. (plik:linia weba w origin/main, nowe): 48-55(-1/+8), 60-68(-1/+9), 70-81(-6/+12), 83-87(-5/+5), 91-102(-8/+12), 104-111(-0/+8), 155-156(-2/+2), 158(-1/+1)
- `gra/src/game/ai.ts` — temat: P6.11–12 AI (REPIN-AI-2); hunki beh. (plik:linia weba w origin/main, nowe): 2676-2677(-0/+2), 3962-3963(-1/+2), 3972-3975(-1/+4), 3996(-0/+1), 3998(-1/+1), 4010-4037(-0/+28), 4039-4041(-0/+3), 4044-4048(-4/+5), 4051-4055(-0/+5), 4070-4071(-1/+2), 4331-4332(-1/+2)
- `gra/src/game/auto-improvements.ts` — temat: P6.8I + REPIN-AUTOIMPR; hunki beh. (plik:linia weba w origin/main, nowe): 387-390(-0/+4), 423-442(-0/+20), 444-525(-0/+82), 549(-0/+1), 680-685(-1/+6), 997-998(-1/+2), 1015(-1/+1), 1088-1091(-1/+4)
- `gra/src/game/battle-mode.ts` — temat: WOJNA-2; hunki beh. (plik:linia weba w origin/main, nowe): 1-14(-0/+14)
- `gra/src/game/diplomacy-proposals.ts` — temat: P6.14 DYPLO; hunki beh. (plik:linia weba w origin/main, nowe): 147-148(-0/+2), 429-448(-0/+20), 1449(-1/+1), 1461(-1/+1), 1469-1471(-1/+3), 2138(-1/+1), 2150(-1/+1), 2156-2162(-1/+7)
- `gra/src/game/generalQuickFollow.ts` — temat: WOJNA-2; hunki beh. (plik:linia weba w origin/main, nowe): 1-161(-0/+161)
- `gra/src/game/generals.ts` — temat: WOJNA-2; hunki beh. (plik:linia weba w origin/main, nowe): 54-103(-0/+50)
- `gra/src/game/save.ts` — temat: REPIN-ZAPIS (P6.20–22); hunki beh. (plik:linia weba w origin/main, nowe): 428-430(-0/+3), 730-731(-0/+2)
- `gra/src/game/warAllInCapital.ts` — temat: WOJNA-NOWE-D (ZAŁOŻENIE §6 pkt 6; w tabeli planu P6.11–12 AI / REPIN-AI-2); hunki beh. (plik:linia weba w origin/main, nowe): 61-64(-0/+4), 74-199(-0/+126), 210-211(-0/+2), 223-227(-0/+5), 284(-1/+1), 288-289(-2/+2), 341-342(-0/+2), 456(-1/+1), 470(-1/+1), 511(-1/+1), 513(-1/+1), 535-586(-0/+52), 846-850(-3/+5)
- `gra/src/main.ts` — temat: REPIN-MAIN (rozdzielić) + REPIN-3D; hunki beh. (plik:linia weba w origin/main, nowe): 763-767(-0/+5), 1276-1277(-1/+2), 1316(-0/+1), 1820-1821(-0/+2), 2019-2020(-0/+2), 4055(-0/+1), 6958-6977(-1/+20), 7022(-0/+1), 13068-13076(-1/+9), 13082-13084(-5/+3), 13098(-1/+1), 13108-13113(-1/+6), 13581-13584(-1/+4), 13841-13845(-1/+5), 14293-14297(-1/+5), 14311-14314(-1/+4), 18656(-0/+1), 18676(-0/+1), 18687(-0/+1), 22237(-0/+1), 22839-22844(-0/+6), 22847(-1/+1), 23000-23010(-0/+11), 23037-23058(-0/+22), 24242-24243(-0/+2), 27115-27134(-26/+20), 27139-27148(-15/+10), 27384(-0/+1), 27393-27396(-0/+4), 28848-28852(-1/+5), 29051-29061(-0/+11), 29234(-1/+1), 29286-29290(-1/+5), 29911(-1/+1), 30001(-0/+1), 32130(-1/+1), 32185-32189(-1/+5), 32368(-0/+1), 32378(-0/+1), 34868(-0/+1), 35161-35166(-0/+6), 38740-38744(-0/+5), 39529(-0/+1), 40818-40821(-0/+4), 40850(-0/+1)
- `gra/src/render/buildHighlight.ts` — temat: REPIN-3D (na koniec, Opus); hunki beh. (plik:linia weba w origin/main, nowe): 1-28(-0/+28)
- `gra/src/render/rangeOverlay.ts` — temat: REPIN-3D (na koniec, Opus); hunki beh. (plik:linia weba w origin/main, nowe): 477(-1/+1)
- `gra/src/render/units.ts` — temat: REPIN-3D (na koniec, Opus); hunki beh. (plik:linia weba w origin/main, nowe): 34-36(-0/+3), 410(-1/+1), 6444(-1/+1), 6453(-1/+1)
- `gra/src/ui/armyMergePanel.ts` — temat: REPIN-UI-2 + pomiar dryfu kopii K01–K09; hunki beh. (plik:linia weba w origin/main, nowe): 35(-0/+1), 66(-0/+1), 68-81(-1/+14), 151-152(-0/+2), 212-213(-1/+2), 228-230(-0/+3), 238-287(-1/+50)
- `gra/src/ui/armyStackHud.ts` — temat: REPIN-UI-2 + pomiar dryfu kopii K01–K09; hunki beh. (plik:linia weba w origin/main, nowe): 29-30(-0/+2), 39-54(-0/+16), 135-139(-0/+5), 146-149(-0/+4), 306-312(-1/+7), 314-316(-1/+3)
- `gra/src/ui/diplomacyNegotiationModal.ts` — temat: REPIN-UI-2 + pomiar dryfu kopii K01–K09; hunki beh. (plik:linia weba w origin/main, nowe): 23-24(-0/+2)
- `gra/src/ui/diplomacyTradeBasket.ts` — temat: REPIN-UI-2 + pomiar dryfu kopii K01–K09; hunki beh. (plik:linia weba w origin/main, nowe): 165(-0/+1), 178-182(-2/+5), 348-349(-0/+2), 1297-1299(-2/+3), 1325-1327(-2/+3), 1332-1339(-1/+8), 1341(-1/+1), 1349-1351(-1/+3), 1357-1368(-0/+12), 1400-1401(-0/+2), 1409(-1/+1), 2275-2278(-0/+4), 2299-2300(-0/+2), 2369-2370(-0/+2), 2412-2413(-1/+2), 2431(-1/+1), 2444-2455(-0/+12), 2577-2578(-1/+2), 2626-2633(-0/+8), 2637-2641(-0/+5), 2647-2651(-1/+5), 2837-2843(-0/+7)
- `gra/src/ui/empireDetailPanel.ts` — temat: REPIN-UI-2 + pomiar dryfu kopii K01–K09; hunki beh. (plik:linia weba w origin/main, nowe): 75-76(-0/+2), 2765-2767(-0/+3), 2811-2814(-0/+4)
- `gra/src/ui/newGameFlow.ts` — temat: REPIN-UI-2 + pomiar dryfu kopii K01–K09; hunki beh. (plik:linia weba w origin/main, nowe): 793(-1/+1), 817(-2/+0), 978(-8/+0), 1528-1539(-0/+12), 1557(-1/+0), 1559(-20/+1), 1601-1628(-1/+28), 1651(-1/+1), 1739-1746(-0/+8), 1870-1872(-1/+3), 1992-1993(-5/+2), 1996(-1/+0), 2033(-13/+0), 2046(-60/+0), 2086-2088(-2/+3), 2359(-4/+0), 2360(-1/+0), 2363(-4/+0), 2369-2385(-0/+17), 2428(-1/+1), 2432(-1/+0)
- `gra/src/ui/preBattle.ts` — temat: REPIN-UI-2 + pomiar dryfu kopii K01–K09; hunki beh. (plik:linia weba w origin/main, nowe): 155-156(-0/+2), 254-260(-0/+7), 640(-2/+1), 852-854(-2/+3), 906(-1/+1), 935(-1/+0)
- `gra/src/ui/unitActionBarHtml.ts` — temat: REPIN-UI-2 + pomiar dryfu kopii K01–K09; hunki beh. (plik:linia weba w origin/main, nowe): 33-34(-1/+2), 37(-1/+0), 39(-0/+1), 135-142(-0/+8)
- `gra/src/units/setup.ts` — temat: EKONOMIA-E (units/setup); hunki beh. (plik:linia weba w origin/main, nowe): 86-87(-0/+2)

## 3. Hunki etapu 1 dla plików `TODO`/`CZĘŚĆ` (50 plików, pełna delta `edb8fb56 → dc8a3adc`)

Dla plików do domknięcia w etapie 1 lista obejmuje całą deltę od pinu `edb8fb56` (etap 1 + etap 2), bo port tych plików jeszcze nie startował. Format jak w §2.

- `gra/src/main.ts` — TODO (podział: logika walki/UX vs 3D); temat: REPIN-MAIN (rozdzielić) + REPIN-3D; hunki beh. (edb→main): 262-267(-0/+6), 399(-0/+1), 578(-1/+1), 763-767(-0/+5), 857-862(-0/+6), 893-903(-0/+11), 907(-0/+1), 911-913(-1/+3), 970(-1/+1), 990(-1/+1), 992(-0/+1), 1115(-8/+0), 1132(-0/+1), 1228-1229(-0/+2), 1241-1244(-0/+4), 1276-1291(-0/+16), 1316(-0/+1), 1446-1447(-0/+2), 1449-1461(-0/+13), 1484(-0/+1), 1820-1821(-0/+2), 2019-2020(-0/+2), 2094-2095(-0/+2), 2126-2131(-0/+6), 2281(-0/+1), 2501(-1/+1), 2556(-1/+1), 3339(-0/+1), 3341-3355(-1/+15), 3356(-1/+0), 3358(-2/+1), 3904-3910(-0/+7), 4014(-1/+1), 4054-4055(-0/+2), 4091(-0/+1), 4095-4113(-0/+19), 4136(-1/+1), 4179(-1/+1), 4182(-1/+1), 4213-4217(-1/+5), 4297-4298(-2/+2), 4301(-1/+1), 4308(-1/+1), 4335(-1/+1), 4980-4985(-1/+6), 6374(-1/+0), 6545(-1/+1), 6634(-0/+1), 6660(-1/+1), 6663(-1/+1), 6666(-1/+1), 6668(-1/+1), 6670-6676(-9/+7), 6678(-1/+1), 6680(-5/+1), 6687-6694(-0/+8), 6697-7023(-3/+327), 7065(-0/+1), 7087-7091(-0/+5), 7299(-1/+1), 7303-7318(-0/+16), 8695-8714(-3/+20), 8717-8722(-1/+6), 8725-8726(-4/+2), 8730-8742(-1/+13), 8834-8839(-0/+6), 8932(-1/+1), 8960-8975(-0/+16), 9314(-1/+1), 9334-9343(-0/+10), 9424(-1/+1), 9488(-1/+1), 9586(-3/+0), 9587(-4/+0), 9658-9659(-0/+2), 9680-9694(-0/+15), 10128-10354(-0/+227), 10357-10361(-1/+5), 10402-10410(-0/+9), 10428-10437(-0/+10), 10453(-0/+1), 11109-11110(-0/+2), 11797(-1/+1), 12000(-3/+0), 12208-12209(-0/+2), 12324-12325(-0/+2), 12327-12331(-0/+5), 12342-12348(-3/+7), 12395-12398(-1/+4), 12410-12411(-0/+2), 13068-13076(-1/+9), 13082-13085(-1/+4), 13098(-0/+1), 13108-13113(-1/+6), 13581-13584(-1/+4), 13608-13617(-0/+10), 13621-13623(-3/+3), 13732-13737(-0/+6), 13740(-10/+0), 13747(-8/+1), 13841-13845(-1/+5), 14293-14297(-1/+5), 14311-14314(-1/+4), 14850(-0/+1), 14875-14878(-1/+4), 14885-14888(-1/+4), 15219-15221(-0/+3), 15243(-1/+1), 15522-15528(-0/+7), 16109(-0/+1), 16181(-1/+1), 16188(-1/+1), 16254(-1/+1), 16261(-1/+1), 16387-16397(-0/+11), 16407-16414(-1/+8), 16788-16791(-0/+4), 17070(-6/+0), 17126(-1/+1), 17159(-1/+1), 17341(-1/+1), 17343(-1/+1), 17366(-1/+1), 17370(-1/+1), 17486-17488(-1/+3), 17495-17497(-1/+3), 17757-17759(-0/+3), 17772(-1/+1), 17777-17781(-1/+5), 17783-17792(-0/+10), 17872-17884(-0/+13), 17895-17899(-0/+5), 18073-18092(-0/+20), 18656(-0/+1), 18676(-0/+1), 18687(-0/+1), 19451-19479(-0/+29), 19493(-22/+1), 19504-19505(-0/+2), 19753-19762(-1/+10), 19849-19850(-2/+2), 19965-19968(-0/+4), 19981-19985(-3/+5), 20006(-1/+1), 20221-20223(-1/+3), 20227-20231(-0/+5), 20240-20241(-2/+2), 20247-20249(-1/+3), 20265-20268(-3/+4), 20271(-1/+1), 20289(-1/+1), 20474-20487(-0/+14), 20507-20543(-0/+37), 20555-20556(-0/+2), 20570-20593(-0/+24), 20602(-0/+1), 20611(-0/+1), 20614-20648(-0/+35), 20680-20687(-8/+8), 20695(-0/+1), 20778(-0/+1), 20796(-1/+1), 20983(-1/+1), 20991-20992(-0/+2), 21028-21046(-0/+19), 21049-21050(-1/+2), 21052-21055(-7/+4), 21173-21175(-0/+3), 21362-21366(-1/+5), 21368-21370(-0/+3), 21421-21427(-0/+7), 21442-21449(-0/+8), 21452(-0/+1), 21582-21583(-0/+2), 21588-21599(-4/+12), 21603-21613(-0/+11), 21880-21881(-1/+2), 21933-21934(-1/+2), 22237(-0/+1), 22704(-1/+0), 22839-22844(-0/+6), 22847(-1/+1), 22882(-17/+0), 23000-23010(-0/+11), 23033(-17/+1), 23037-23058(-0/+22), 23251-23259(-1/+9), 23261(-5/+1), 23265(-1/+1), 23303(-6/+1), 23379-23386(-1/+8), 23687(-8/+1), 24237-24243(-1/+7), 24275-24299(-0/+25), 24746-24810(-0/+65), 24951-24952(-0/+2), 25510-25528(-0/+19), 25702-25792(-0/+91), 26203-26498(-0/+296), 26592-26609(-0/+18), 26623-26627(-1/+5), 26666-26678(-4/+13), 26682-26685(-12/+4), 26687-26691(-0/+5), 26762-26771(-1/+10), 26774-26776(-1/+3), 26832(-3/+0), 27109-27134(-47/+26), 27137-27149(-10/+13), 27150(-4/+0), 27286(-0/+1), 27302(-0/+1), 27384(-0/+1), 27393-27396(-0/+4), 28073(-4/+0), 28085(-6/+0), 28847-28852(-1/+6), 29051-29061(-0/+11), 29128-29133(-1/+6), 29234(-1/+1), 29236(-0/+1), 29286-29290(-1/+5), 29745-29750(-1/+6), 29814-29834(-0/+21), 29855-29856(-2/+2), 29911(-1/+1), 29913(-0/+1), 30000-30001(-0/+2), 30052-30054(-0/+3), 30068(-0/+1), 30199-30200(-0/+2), 30206(-0/+1), 30241-30248(-1/+8), 30401(-1/+0), 30444-30505(-0/+62), 31272-31288(-0/+17), 31609-31611(-0/+3), 31622-31625(-1/+4), 31635-31648(-5/+14), 31675-31684(-0/+10), 31867-31868(-0/+2), 31944(-0/+1), 32047-32052(-1/+6), 32130(-1/+1), 32132(-0/+1), 32185-32189(-1/+5), 32368(-1/+1), 32378(-0/+1), 32402(-0/+1), 32439-32442(-0/+4), 32445-32450(-0/+6), 32510-32513(-0/+4), 32527(-0/+1), 32531(-0/+1), 32593-32596(-1/+4), 32653-32663(-0/+11), 32691-32698(-2/+8), 32753(-1/+1), 32787-32790(-0/+4), 32817-32818(-0/+2), 32826(-1/+1), 32829(-1/+0), 32834(-1/+1), 32863-32920(-0/+58), 32989-32995(-4/+7), 32997(-1/+1), 33002(-1/+1), 33007(-1/+1), 33015-33059(-0/+45), 33108-33113(-0/+6), 33134-33138(-0/+5), 33185-33189(-0/+5), 33192-33204(-0/+13), 33286(-1/+1), 33394-33395(-2/+2), 33397-33398(-0/+2), 33409-33424(-0/+16), 33467-33468(-0/+2), 33470(-0/+1), 34109(-1/+1), 34341-34346(-1/+6), 34370-34377(-1/+8), 34499(-1/+1), 34540-34548(-0/+9), 34566-34573(-1/+8), 34804-34808(-1/+5), 34840-34844(-0/+5), 34846-34847(-1/+2), 34867-34868(-0/+2), 34950-34953(-0/+4), 34965-34966(-0/+2), 35161-35166(-0/+6), 35313-35326(-0/+14), 35339-35341(-1/+3), 35402-35403(-0/+2), 35571-35579(-0/+9), 35604-35636(-0/+33), 35644(-0/+1), 35662-35669(-0/+8), 35671-35672(-2/+2), 35676(-1/+1), 35678-35685(-1/+8), 35688(-0/+1), 35823-35824(-2/+2), 35826(-1/+1), 35865(-0/+1), 35867(-0/+1), 35885-35895(-0/+11), 35994-36011(-0/+18), 36016-36027(-1/+12), 36031(-1/+1), 36037(-0/+1), 36039-36040(-2/+2), 36047-36048(-2/+2), 36054-36060(-1/+7), 36139-36159(-0/+21), 36193-36195(-2/+3), 36197(-1/+1), 36254(-1/+1), 36290(-1/+1), 36673-36699(-0/+27), 36734-36747(-0/+14), 36792(-0/+1), 36878-36902(-1/+25), 37210-37215(-0/+6), 37230(-0/+1), 37236-37240(-0/+5), 37252-37256(-0/+5), 37335(-1/+1), 37365(-1/+1), 37371-37373(-0/+3), 37454(-0/+1), 37586(-0/+1), 37752-37755(-0/+4), 37941-37942(-0/+2), 37975-37978(-0/+4), 37999-38001(-0/+3), 38013-38017(-0/+5), 38027-38028(-0/+2), 38227(-1/+1), 38266(-0/+1), 38387(-0/+1), 38391-38404(-0/+14), 38424-38428(-1/+5), 38457-38470(-0/+14), 38740-38744(-0/+5), 39070(-1/+0), 39072(-1/+0), 39076(-2/+1), 39079(-1/+0), 39149-39153(-1/+5), 39184-39196(-4/+13), 39200-39203(-11/+4), 39205-39208(-0/+4), 39270-39279(-1/+10), 39518-39521(-0/+4), 39529(-0/+1), 39658(-2/+0), 39729(-0/+1), 39739(-0/+1), 39744(-0/+1), 40789-40814(-0/+26), 40818-40821(-0/+4), 40850(-0/+1), 40854(-5/+0), 40961(-0/+1), 41169-41176(-0/+8), 41232-41239(-1/+8), 41242(-0/+1), 41245-41247(-0/+3), 41524-41527(-0/+4), 41631-41634(-0/+4), 41646-41655(-0/+10)
- `gra/src/game/warAllInCapital.ts` — TODO (brak odpowiednika w Rust); temat: WOJNA-NOWE-D (ZAŁOŻENIE §6 pkt 6; w tabeli planu P6.11–12 AI / REPIN-AI-2); hunki beh. (edb→main): 1-859(-0/+859)
- `gra/src/game/ai.ts` — TODO (brak odpowiednika w Rust); temat: P6.11–12 AI (REPIN-AI-2); hunki beh. (edb→main): 20-33(-0/+14), 86(-1/+1), 108-109(-0/+2), 182-186(-31/+5), 192-194(-16/+3), 466-490(-0/+25), 623-624(-5/+2), 685(-1/+0), 758(-4/+0), 891(-0/+1), 894-896(-0/+3), 899(-1/+1), 1277(-2/+0), 1346(-25/+0), 1640(-1/+1), 1659-1661(-3/+3), 1678-1681(-4/+4), 1994(-1/+0), 2118-2141(-0/+24), 2676-2677(-0/+2), 3036(-0/+1), 3049-3057(-5/+9), 3160-3161(-6/+2), 3169(-1/+1), 3229(-1/+1), 3267-3271(-0/+5), 3371-3376(-1/+6), 3413-3418(-1/+6), 3449(-0/+1), 3452-3453(-1/+2), 3469(-1/+1), 3540(-1/+1), 3542-3543(-1/+2), 3550-3615(-0/+66), 3933-3939(-0/+7), 3944-4098(-0/+155), 4291-4374(-0/+84), 4380(-1/+0), 4397(-1/+1), 4434-4437(-0/+4), 5385-5386(-0/+2), 5723-5725(-0/+3), 5744-5747(-3/+4)
- `gra/src/game/economy.ts` — TODO; temat: REPIN-EKONOMIA-D + P6.8F; hunki beh. (edb→main): 162(-1/+0), 237(-1/+0), 656(-8/+0), 674-675(-14/+2), 706-707(-2/+2), 709-710(-38/+2), 727(-1/+1), 755(-1/+1), 759(-2/+1), 783(-1/+1), 785(-13/+1), 871(-0/+1), 875-877(-1/+3), 884-891(-0/+8), 898-907(-11/+10), 908(-1/+0), 910-919(-18/+10), 931-943(-11/+13), 947(-1/+1), 963-966(-1/+4), 977-988(-12/+12), 1003-1006(-1/+4), 1017-1019(-1/+3)
- `gra/src/game/production.ts` — CZĘŚĆ@91dc (B2: 3,7,8–14); temat: P6.8A/B/C; hunki beh. (edb→main): 129-130(-0/+2), 207-226(-0/+20), 420(-0/+1), 448-449(-0/+2), 488-503(-0/+16), 562-563(-1/+2), 583(-0/+1), 587-588(-1/+2), 608-625(-1/+18), 628(-0/+1), 630-631(-2/+2), 633-637(-4/+5), 640-656(-1/+17), 671-692(-0/+22), 735-761(-0/+27), 936(-1/+1), 983-985(-1/+3), 1027(-1/+1), 1031-1035(-10/+5), 1049(-1/+1), 1063-1077(-11/+15), 1089(-0/+1), 1150(-1/+1), 1160(-1/+1), 1166(-1/+1), 1176-1183(-4/+8), 1197(-0/+1), 1215(-1/+1), 1273-1288(-0/+16), 1902(-0/+1), 1911(-1/+1), 1923(-1/+1), 1926-1928(-0/+3), 1985-1986(-2/+2), 2056-2057(-0/+2), 2060(-1/+1), 2075(-1/+1), 2077(-0/+1), 2137(-1/+1), 2140-2142(-1/+3), 2302(-0/+1)
- `gra/src/game/turn-economy.ts` — CZĘŚĆ@91dc (B1,B3 helpery); temat: P6.8F + REPIN-D (tick); hunki beh. (edb→main): 55(-1/+0), 140-141(-0/+2), 160(-5/+1), 175(-1/+1), 185-200(-0/+16), 227-230(-42/+4), 249(-25/+0), 309(-1/+0), 1051-1052(-0/+2), 1595(-0/+1), 1603(-0/+1), 1637(-0/+1), 1855-1858(-0/+4), 1969(-1/+0), 1977(-10/+0), 2010(-1/+0), 2014(-3/+1), 2031(-1/+1), 2036-2037(-0/+2), 2045(-1/+1), 2050-2054(-2/+5), 2081(-0/+1), 2083(-1/+1), 2136(-0/+1), 2138-2139(-4/+2), 2278-2281(-0/+4), 2535(-1/+0), 2543(-10/+0), 2576(-1/+0), 2580-2581(-4/+2), 2598(-1/+1), 2606-2607(-0/+2), 2615(-1/+1), 2626-2630(-6/+5), 2643-2644(-5/+2), 2669(-0/+1), 2671-2672(-3/+2), 2741(-1/+1), 2755(-2/+1), 2760(-0/+1), 2762(-1/+1), 2885-2893(-0/+9)
- `gra/src/game/war-rules-multiwar.ts` — TODO (brak odpowiednika w Rust); temat: P6.11–12 AI (REPIN-AI-2); hunki beh. (edb→main): 1-249(-0/+249)
- `gra/src/game/diplomacy-sensible-deals.ts` — TODO; temat: P6.14 DYPLO; hunki beh. (edb→main): 1-170(-0/+170)
- `gra/src/game/generalQuickFollow.ts` — TODO (nowe/zmienione po pinie 91dc); temat: WOJNA-2; hunki beh. (edb→main): 1-161(-0/+161)
- `gra/src/game/auto-improvements.ts` — TODO (+123 po pinie; priorytet jedzenia); temat: P6.8I + REPIN-AUTOIMPR; hunki beh. (edb→main): 387-390(-0/+4), 423-442(-0/+20), 444-525(-0/+82), 549(-0/+1), 680-685(-1/+6), 997-998(-1/+2), 1015(-1/+1), 1088-1091(-1/+4)
- `gra/src/game/manpower.ts` — CZĘŚĆ@91dc; temat: EKONOMIA-C6/B4; hunki beh. (edb→main): 289(-0/+1), 309-312(-1/+4), 313(-1/+0), 337-338(-2/+2), 342-347(-0/+6), 402-414(-4/+13), 416(-1/+1), 418(-10/+1), 423(-1/+1), 425(-10/+1), 430-456(-2/+27), 458-460(-2/+3), 465(-1/+1), 548(-0/+1), 551(-1/+1), 615(-0/+1), 621(-1/+1), 643(-0/+1), 645(-1/+1), 733(-0/+1), 735(-1/+1), 749(-0/+1), 752(-1/+1), 804(-0/+1), 806(-1/+1), 845(-0/+1), 847(-1/+1), 882(-0/+1), 884(-1/+1)
- `gra/src/game/save-presence.ts` — TODO; temat: REPIN-ZAPIS (P6.20–22); hunki beh. (edb→main): 1-118(-0/+118)
- `gra/src/game/forced-war-common.ts` — TODO (brak odpowiednika w Rust); temat: P6.11–12 AI (REPIN-AI-2); hunki beh. (edb→main): 142-174(-0/+33), 202-218(-0/+17), 239-240(-0/+2), 280(-1/+1), 284-315(-0/+32), 317-319(-1/+3), 322-328(-0/+7), 480(-1/+1)
- `gra/src/game/generals.ts` — TODO (nowe/zmienione po pinie 91dc); temat: WOJNA-2; hunki beh. (edb→main): 1-103(-0/+103)
- `gra/src/game/work-tax.ts` — TODO; temat: REPIN-EKONOMIA-D + P6.8F; hunki beh. (edb→main): 1-77(-0/+77)
- `gra/src/game/culture-religion.ts` — TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust); temat: REPIN-AI / DYPLO / EKONOMIA-E; hunki beh. (edb→main): 123(-2/+0), 339-345(-0/+7), 502-514(-0/+13), 1306-1313(-3/+8)
- `gra/src/game/fsa-autosave.ts` — TODO; temat: REPIN-ZAPIS (P6.20–22); hunki beh. (edb→main): 254(-1/+1), 449-497(-0/+49), 566-570(-0/+5)
- `gra/src/game/trade-routes.ts` — TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust); temat: REPIN-AI / DYPLO / EKONOMIA-E; hunki beh. (edb→main): 1622-1628(-1/+7), 1632-1635(-2/+4), 1639-1656(-6/+18), 1658-1667(-1/+10)
- `gra/src/game/barbarians.ts` — TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust); temat: REPIN-AI / DYPLO / EKONOMIA-E; hunki beh. (edb→main): 759(-1/+1), 1759(-0/+1), 1807-1845(-1/+39), 1880-1881(-0/+2)
- `gra/src/game/diplomacy-proposals.ts` — TODO; temat: P6.14 DYPLO; hunki beh. (edb→main): 147-148(-0/+2), 429-448(-0/+20), 1449(-1/+1), 1461(-1/+1), 1469-1471(-1/+3), 1837(-0/+1), 2138(-1/+1), 2150(-1/+1), 2156-2162(-1/+7), 2293-2294(-0/+2)
- `gra/src/game/population-growth-v85.ts` — CZĘŚĆ@91dc; temat: EKONOMIA-C6/B4; hunki beh. (edb→main): 46-51(-0/+6), 216(-0/+1), 218-219(-1/+2), 287-295(-0/+9), 445-448(-0/+4), 494(-1/+1), 524(-1/+1), 537-544(-0/+8), 587-590(-2/+4)
- `gra/src/game/cluster-start.ts` — TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust); temat: REPIN-AI / DYPLO / EKONOMIA-E; hunki beh. (edb→main): 59-64(-0/+6), 380-405(-0/+26), 420(-0/+1)
- `gra/src/game/society-breakdown.ts` — TODO; temat: P6.8J; hunki beh. (edb→main): 1076-1108(-0/+33)
- `gra/src/game/ai-city-capture-executor.ts` — TODO (brak odpowiednika w Rust); temat: P6.11–12 AI (REPIN-AI-2); hunki beh. (edb→main): 54-55(-0/+2), 64-70(-0/+7), 96(-0/+1), 117-122(-1/+6), 126-136(-0/+11)
- `gra/src/game/diplomacy-layers.ts` — TODO; temat: P6.14 DYPLO; hunki beh. (edb→main): 59-88(-0/+30)
- `gra/src/game/dirtyRenderSync.ts` — TODO; temat: REPIN-ZAPIS (P6.20–22); hunki beh. (edb→main): 1-31(-0/+31)
- `gra/src/game/retained-side-panel-events.ts` — TODO; temat: REPIN-ZAPIS (P6.20–22); hunki beh. (edb→main): 1-26(-0/+26)
- `gra/src/game/diplomacy-ai-offer-balance.ts` — TODO; temat: P6.14 DYPLO; hunki beh. (edb→main): 95-117(-0/+23), 291(-1/+1)
- `gra/src/game/order.ts` — TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust); temat: REPIN-AI / DYPLO / EKONOMIA-E; hunki beh. (edb→main): 161-181(-0/+21)
- `gra/src/game/planned-march.ts` — TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust); temat: REPIN-AI / DYPLO / EKONOMIA-E; hunki beh. (edb→main): 19-20(-0/+2), 452-455(-1/+4), 460-462(-0/+3), 481-486(-3/+6)
- `gra/data/war-allin-params.json` — TODO (dane nowych modułów); temat: P6.11–12 AI / WOJNA-2; hunki beh. (edb→main): 1-17(-0/+17)
- `gra/src/game/forced-war-iron.ts` — TODO (brak odpowiednika w Rust); temat: P6.11–12 AI (REPIN-AI-2); hunki beh. (edb→main): 89-90(-0/+2), 230-238(-0/+9)
- `gra/src/game/battle-mode.ts` — TODO (nowe/zmienione po pinie 91dc); temat: WOJNA-2; hunki beh. (edb→main): 1-14(-0/+14)
- `gra/src/game/diplomacy-resource-trade-pick.ts` — TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust); temat: REPIN-AI / DYPLO / EKONOMIA-E; hunki beh. (edb→main): 81-86(-0/+6), 106(-0/+1), 134(-1/+1), 139-140(-1/+2)
- `gra/src/game/save.ts` — TODO; temat: REPIN-ZAPIS (P6.20–22); hunki beh. (edb→main): 421-429(-1/+9), 730-731(-0/+2)
- `gra/src/game/relief-preserving-improvements.ts` — TODO; temat: P6.8I / EKONOMIA-E; hunki beh. (edb→main): 23-24(-2/+2)
- `gra/data/war-rules-params.json` — TODO (dane nowych modułów); temat: P6.11–12 AI / WOJNA-2; hunki beh. (edb→main): 1-9(-0/+9)
- `gra/src/game/playerState.ts` — TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust); temat: REPIN-AI / DYPLO / EKONOMIA-E; hunki beh. (edb→main): 133(-5/+0), 154(-1/+0)
- `gra/src/audio/filePlayer.ts` — TODO (audio); temat: REPIN-ZAPIS-AUDIO; hunki beh. (edb→main): 114(-1/+1), 446(-1/+1), 455(-1/+1), 468(-0/+1)
- `gra/src/data/loader.ts` — TODO (dane); temat: REPIN-DANE-2; hunki beh. (edb→main): 215-218(-2/+4)
- `gra/src/game/combat.ts` — TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust); temat: REPIN-AI / DYPLO / EKONOMIA-E; hunki beh. (edb→main): 920-921(-1/+2), 933-934(-1/+2)
- `gra/src/game/diplomacy-sensible-deals.config.json` — TODO; temat: P6.14 DYPLO; hunki beh. (edb→main): 1-6(-0/+6)
- `gra/src/audio/muzyka-antyczna.ts` — TODO (audio); temat: REPIN-ZAPIS-AUDIO; hunki beh. (edb→main): 1771-1772(-2/+2)
- `gra/src/game/embarkation.ts` — TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust); temat: REPIN-AI / DYPLO / EKONOMIA-E; hunki beh. (edb→main): 60(-1/+1)
- `gra/src/units/setup.ts` — CZĘŚĆ; temat: EKONOMIA-E (units/setup); hunki beh. (edb→main): 44-45(-0/+2), 86-87(-0/+2)
- `gra/src/game/armyMerge.ts` — TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust); temat: REPIN-AI / DYPLO / EKONOMIA-E; hunki beh. (edb→main): 923-924(-0/+2), 952(-0/+1)
- `gra/src/data/wikiBundle.json` — TODO (dane); temat: REPIN-DANE-2; hunki beh. (edb→main): brak
- `gra/src/game/diplomacy-peace-lock.ts` — TODO; temat: P6.14 DYPLO; hunki beh. (edb→main): brak
- `gra/src/game/forced-war-bronze.ts` — TODO (brak odpowiednika w Rust); temat: P6.11–12 AI (REPIN-AI-2); hunki beh. (edb→main): 93(-1/+1)
- `gra/src/game/forced-war-stone.ts` — TODO (brak odpowiednika w Rust); temat: P6.11–12 AI (REPIN-AI-2); hunki beh. (edb→main): 29(-1/+1)

## 4. Tabela 101 plików — temat docelowy

Kolumna „Temat docelowy” pochodzi z planu. Wartość `ZAMKNIĘTY (bez tematu)` oznacza plik `DONE@91dc998a` niezmieniony w etapie 2 (17 wierszy, każdy ze Stanem `DONE@91dc…`): nie ma otwartego tematu, właścicielem jest zamknięty temat etapu 1 (ZAMKNIĘTY, bez akcji). Wartość `—` w innych kolumnach oznacza brak danych w danym polu. Każdy z 101 plików ma wpis (zero braków). Kolumna „Hunki” podaje liczbę hunków `edb8fb56→dc8a3adc` (klasa) oraz hunki etapu 2.

| # | Plik (web, origin/main) | +/− od edb8fb56 | Po 91dc998a (etap 2) | Stan w planie | Temat docelowy (plan) | Nowy | Hunki edb→main (klasa) | Hunki etap 2 (klasa) |
|---|---|---|---|---|---|---|---|---|
| 1 | `gra/src/main.ts` | +2999/−479 | TAK | TODO (podział: logika walki/UX vs 3D) | REPIN-MAIN (rozdzielić) + REPIN-3D | — | 403 (import:12 behawioralna:373 komentarz:17 typ:1) | 50 (import:4 behawioralna:45 typ:1) |
| 2 | `gra/src/game/warAllInCapital.ts` | +859/−0 | TAK | TODO (brak odpowiednika w Rust) | WOJNA-NOWE-D (ZAŁOŻENIE §6 pkt 6; plan: P6.11–12 AI / REPIN-AI-2) | TAK | 1 (behawioralna:1) | 15 (import:1 behawioralna:13 komentarz:1) |
| 3 | `gra/src/battle/battleScene.ts` | +610/−192 | TAK | ODŁOŻONE 3D | REPIN-3D (na koniec, Opus) | — | 84 (behawioralna:80 import:1 typ:1 komentarz:2) | 50 (behawioralna:50) |
| 4 | `gra/data/civs.json` | +180/−489 | — | DONE@91dc (DANE) | ZAMKNIĘTY (bez tematu) | — | 60 (behawioralna:60) | — |
| 5 | `gra/src/game/ai.ts` | +468/−130 | TAK | TODO (brak odpowiednika w Rust) | P6.11–12 AI (REPIN-AI-2) | — | 53 (behawioralna:43 import:3 komentarz:7) | 14 (typ:1 behawioralna:11 komentarz:2) |
| 6 | `gra/src/ui/cityPanel.ts` | +259/−73 | — | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 | — | 67 (behawioralna:59 import:1 komentarz:2 nazwa/tekst:5) | — |
| 7 | `gra/src/game/economy.ts` | +116/−213 | — | TODO | REPIN-EKONOMIA-D + P6.8F | — | 41 (import:1 komentarz:16 behawioralna:23 nazwa/tekst:1) | — |
| 8 | `gra/src/game/production.ts` | +216/−55 | — | CZĘŚĆ@91dc (B2: 3,7,8–14) | P6.8A/B/C | — | 44 (import:1 behawioralna:41 komentarz:2) | — |
| 9 | `gra/src/game/turn-economy.ts` | +95/−164 | — | CZĘŚĆ@91dc (B1,B3 helpery) | P6.8F + REPIN-D (tick) | — | 51 (behawioralna:42 import:1 typ:1 nazwa/tekst:1 komentarz:6) | — |
| 10 | `gra/src/ui/empireDetailPanel.ts` | +94/−165 | TAK | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 | — | 25 (import:1 komentarz:3 behawioralna:19 nazwa/tekst:2) | 3 (behawioralna:3) |
| 11 | `gra/src/game/war-rules-multiwar.ts` | +249/−0 | — | TODO (brak odpowiednika w Rust) | P6.11–12 AI (REPIN-AI-2) | TAK | 1 (behawioralna:1) | — |
| 12 | `gra/src/ui/newGameFlow.ts` | +158/−68 | TAK | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 | — | 39 (typ:1 behawioralna:29 nazwa/tekst:7 komentarz:2) | 33 (behawioralna:21 nazwa/tekst:11 komentarz:1) |
| 13 | `gra/src/game/diplomacy-tick-war-brake.ts` | +216/−0 | — | DONE@91dc | ZAMKNIĘTY (bez tematu) | TAK | 1 (behawioralna:1) | — |
| 14 | `gra/src/game/civ-bonuses.ts` | +106/−98 | — | DONE@91dc | ZAMKNIĘTY (bez tematu) | — | 25 (import:1 typ:1 behawioralna:23) | — |
| 15 | `gra/src/game/army-consolidation.ts` | +177/−0 | — | DONE@91dc | ZAMKNIĘTY (bez tematu) | TAK | 1 (behawioralna:1) | — |
| 16 | `gra/src/game/diplomacy-sensible-deals.ts` | +170/−0 | — | TODO | P6.14 DYPLO | TAK | 1 (behawioralna:1) | — |
| 17 | `gra/src/game/ai-general-war-campaign.ts` | +164/−0 | — | DONE@91dc | ZAMKNIĘTY (bez tematu) | TAK | 1 (behawioralna:1) | — |
| 18 | `gra/src/ui/unitRecruitCard.ts` | +124/−38 | — | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 | — | 24 (komentarz:4 behawioralna:18 typ:1 nazwa/tekst:1) | — |
| 19 | `gra/src/game/generalQuickFollow.ts` | +161/−0 | TAK | TODO (nowe/zmienione po pinie 91dc) | WOJNA-2 | TAK | 1 (behawioralna:1) | 1 (behawioralna:1) |
| 20 | `gra/src/battle/formationRules.ts` | +160/−0 | TAK | DONE@91dc, +85 po pinie | WOJNA-2 (refresh formation_rules.rs) | TAK | 1 (behawioralna:1) | 9 (behawioralna:8 typ:1) |
| 21 | `gra/src/game/civ-matrix-semantic.ts` | +91/−43 | — | DONE@91dc | ZAMKNIĘTY (bez tematu) | — | 11 (behawioralna:11) | — |
| 22 | `gra/src/game/auto-improvements.ts` | +123/−5 | TAK | TODO (+123 po pinie; priorytet jedzenia) | P6.8I + REPIN-AUTOIMPR | — | 9 (nazwa/tekst:1 behawioralna:8) | 8 (behawioralna:8) |
| 23 | `gra/src/game/manpower.ts` | +80/−48 | — | CZĘŚĆ@91dc | EKONOMIA-C6/B4 | — | 32 (import:1 behawioralna:29 komentarz:2) | — |
| 24 | `gra/src/ui/armyMergePanel.ts` | +99/−20 | TAK | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 | — | 16 (import:1 behawioralna:15) | 7 (behawioralna:7) |
| 25 | `gra/src/game/save-presence.ts` | +118/−0 | — | TODO | REPIN-ZAPIS (P6.20–22) | TAK | 1 (behawioralna:1) | — |
| 26 | `gra/src/render/units.ts` | +72/−46 | TAK | ODŁOŻONE 3D | REPIN-3D (na koniec, Opus) | — | 18 (behawioralna:15 import:1 komentarz:2) | 4 (behawioralna:4) |
| 27 | `gra/src/game/forced-war-common.ts` | +99/−15 | — | TODO (brak odpowiednika w Rust) | P6.11–12 AI (REPIN-AI-2) | — | 9 (komentarz:1 behawioralna:8) | — |
| 28 | `gra/src/game/ai-move-range.ts` | +112/−0 | — | DONE@91dc | ZAMKNIĘTY (bez tematu) | TAK | 1 (behawioralna:1) | — |
| 29 | `gra/src/ui/diplomacyTradeBasket.ts` | +92/−15 | TAK | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 | — | 23 (behawioralna:22 nazwa/tekst:1) | 23 (behawioralna:22 nazwa/tekst:1) |
| 30 | `gra/src/game/generals.ts` | +103/−0 | TAK | TODO (nowe/zmienione po pinie 91dc) | WOJNA-2 | TAK | 1 (behawioralna:1) | 1 (behawioralna:1) |
| 31 | `gra/src/game/work-tax.ts` | +77/−0 | — | TODO | REPIN-EKONOMIA-D + P6.8F | TAK | 1 (behawioralna:1) | — |
| 32 | `gra/src/render/cities.ts` | +70/−4 | — | ODŁOŻONE 3D | REPIN-3D (na koniec, Opus) | — | 8 (behawioralna:8) | — |
| 33 | `gra/src/render/transientObjectResources.ts` | +68/−0 | — | ODŁOŻONE 3D | REPIN-3D (na koniec, Opus) | TAK | 1 (behawioralna:1) | — |
| 34 | `gra/src/game/civ-ai-data.ts` | +32/−34 | — | DONE@91dc | ZAMKNIĘTY (bez tematu) | — | 17 (import:1 komentarz:3 behawioralna:13) | — |
| 35 | `gra/src/game/culture-religion.ts` | +43/−21 | — | TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust) | REPIN-AI / DYPLO / EKONOMIA-E | — | 13 (komentarz:7 import:1 typ:1 behawioralna:4) | — |
| 36 | `gra/src/game/ai-era-unit-promotion.ts` | +63/−0 | — | DONE@91dc | ZAMKNIĘTY (bez tematu) | TAK | 1 (behawioralna:1) | — |
| 37 | `gra/src/game/army-leadership.ts` | +63/−0 | — | DONE@91dc | ZAMKNIĘTY (bez tematu) | TAK | 1 (behawioralna:1) | — |
| 38 | `gra/src/render/memDebug.ts` | +59/−0 | — | ODŁOŻONE 3D | REPIN-3D (na koniec, Opus) | TAK | 1 (behawioralna:1) | — |
| 39 | `gra/src/game/fsa-autosave.ts` | +55/−1 | — | TODO | REPIN-ZAPIS (P6.20–22) | — | 3 (behawioralna:3) | — |
| 40 | `gra/src/game/trade-routes.ts` | +42/−13 | — | TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust) | REPIN-AI / DYPLO / EKONOMIA-E | — | 5 (komentarz:1 behawioralna:4) | — |
| 41 | `gra/src/game/barbarians.ts` | +49/−3 | — | TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust) | REPIN-AI / DYPLO / EKONOMIA-E | — | 6 (import:1 komentarz:1 behawioralna:4) | — |
| 42 | `gra/src/ui/armyStackHud.ts` | +43/−8 | TAK | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 | — | 10 (behawioralna:6 komentarz:2 nazwa/tekst:2) | 6 (behawioralna:6) |
| 43 | `gra/src/game/diplomacy-proposals.ts` | +41/−8 | TAK | TODO | P6.14 DYPLO | — | 12 (behawioralna:10 nazwa/tekst:2) | 8 (behawioralna:8) |
| 44 | `gra/src/ui/preBattle.ts` | +38/−7 | TAK | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 | — | 13 (import:1 behawioralna:11 komentarz:1) | 7 (behawioralna:6 nazwa/tekst:1) |
| 45 | `gra/src/ui/diploListHud.ts` | +44/−0 | — | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 | — | 6 (behawioralna:6) | — |
| 46 | `gra/src/game/population-growth-v85.ts` | +37/−6 | — | CZĘŚĆ@91dc | EKONOMIA-C6/B4 | — | 10 (import:1 behawioralna:9) | — |
| 47 | `gra/src/map/gen-helpers.ts` | +24/−16 | — | DONE@91dc (FIFO bez portu) | ZAMKNIĘTY (bez tematu) | — | 8 (behawioralna:8) | — |
| 48 | `gra/src/game/cluster-start.ts` | +35/−1 | — | TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust) | REPIN-AI / DYPLO / EKONOMIA-E | — | 5 (import:2 behawioralna:3) | — |
| 49 | `gra/src/render/unitVeteranBadges.ts` | +36/−0 | — | ODŁOŻONE 3D | REPIN-3D (na koniec, Opus) | — | 2 (behawioralna:2) | — |
| 50 | `gra/src/game/society-breakdown.ts` | +33/−0 | — | TODO | P6.8J | — | 1 (behawioralna:1) | — |
| 51 | `gra/src/game/ai-city-capture-executor.ts` | +31/−1 | — | TODO (brak odpowiednika w Rust) | P6.11–12 AI (REPIN-AI-2) | — | 8 (import:1 typ:1 behawioralna:5 komentarz:1) | — |
| 52 | `gra/src/game/diplomacy-layers.ts` | +32/−0 | — | TODO | P6.14 DYPLO | — | 2 (import:1 behawioralna:1) | — |
| 53 | `gra/src/game/dirtyRenderSync.ts` | +31/−0 | — | TODO | REPIN-ZAPIS (P6.20–22) | TAK | 1 (behawioralna:1) | — |
| 54 | `gra/src/render/buildHighlight.ts` | +28/−0 | TAK | ODŁOŻONE 3D | REPIN-3D (na koniec, Opus) | TAK | 1 (behawioralna:1) | 1 (behawioralna:1) |
| 55 | `gra/data/ui-params.json` | +26/−0 | — | DONE@91dc (DANE) | ZAMKNIĘTY (bez tematu) | — | 1 (behawioralna:1) | — |
| 56 | `gra/src/game/retained-side-panel-events.ts` | +26/−0 | — | TODO | REPIN-ZAPIS (P6.20–22) | TAK | 1 (behawioralna:1) | — |
| 57 | `gra/src/game/diplomacy-ai-offer-balance.ts` | +24/−1 | — | TODO | P6.14 DYPLO | — | 2 (behawioralna:2) | — |
| 58 | `gra/src/game/order.ts` | +23/−2 | — | TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust) | REPIN-AI / DYPLO / EKONOMIA-E | — | 3 (komentarz:1 pusty:1 behawioralna:1) | — |
| 59 | `gra/data/econ-params.json` | +12/−12 | — | DONE@91dc (DANE) | ZAMKNIĘTY (bez tematu) | — | 7 (nazwa/tekst:4 behawioralna:3) | — |
| 60 | `gra/data/diplomacy-tick-params.json` | +22/−0 | — | DONE@91dc (DANE) | ZAMKNIĘTY (bez tematu) | TAK | 1 (behawioralna:1) | — |
| 61 | `gra/src/game/terrain-improvements.ts` | +15/−7 | — | DONE@91dc | ZAMKNIĘTY (bez tematu) | — | 4 (komentarz:2 behawioralna:2) | — |
| 62 | `gra/src/ui/diplomacyAudience.ts` | +4/−17 | — | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 | — | 10 (import:1 behawioralna:9) | — |
| 63 | `gra/src/game/wealth.ts` | +20/−0 | — | DONE@91dc (8D) | P6.8D r3 (mutacje graniczne) | — | 1 (behawioralna:1) | — |
| 64 | `gra/src/ui/unitReplacePicker.ts` | +18/−2 | — | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 | — | 3 (behawioralna:3) | — |
| 65 | `gra/src/game/planned-march.ts` | +15/−4 | — | TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust) | REPIN-AI / DYPLO / EKONOMIA-E | — | 4 (behawioralna:4) | — |
| 66 | `gra/data/army-consolidation-params.json` | +17/−0 | — | DONE@91dc (DANE) | ZAMKNIĘTY (bez tematu) | TAK | 1 (behawioralna:1) | — |
| 67 | `gra/data/war-allin-params.json` | +17/−0 | — | TODO (dane nowych modułów) | P6.11–12 AI / WOJNA-2 | TAK | 1 (behawioralna:1) | — |
| 68 | `gra/src/game/forced-war-iron.ts` | +15/−2 | — | TODO (brak odpowiednika w Rust) | P6.11–12 AI (REPIN-AI-2) | — | 3 (komentarz:1 behawioralna:2) | — |
| 69 | `gra/src/ui/aiOwnerProgressFrame.ts` | +16/−0 | — | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 | TAK | 1 (behawioralna:1) | — |
| 70 | `gra/src/game/battle-mode.ts` | +14/−0 | TAK | TODO (nowe/zmienione po pinie 91dc) | WOJNA-2 | TAK | 1 (behawioralna:1) | 1 (behawioralna:1) |
| 71 | `gra/src/ui/unitActionBarHtml.ts` | +11/−2 | TAK | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 | — | 4 (behawioralna:4) | 4 (behawioralna:4) |
| 72 | `gra/src/game/diplomacy-resource-trade-pick.ts` | +10/−2 | — | TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust) | REPIN-AI / DYPLO / EKONOMIA-E | — | 4 (behawioralna:4) | — |
| 73 | `gra/src/game/save.ts` | +11/−1 | TAK | TODO | REPIN-ZAPIS (P6.20–22) | — | 2 (behawioralna:2) | 2 (behawioralna:2) |
| 74 | `gra/src/game/relief-preserving-improvements.ts` | +5/−6 | — | TODO | P6.8I / EKONOMIA-E | — | 2 (komentarz:1 behawioralna:1) | — |
| 75 | `gra/src/render/unitStatPlate.ts` | +5/−5 | — | ODŁOŻONE 3D | REPIN-3D (na koniec, Opus) | — | 3 (komentarz:1 behawioralna:1 nazwa/tekst:1) | — |
| 76 | `gra/src/ui/hud.ts` | +8/−2 | — | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 | — | 4 (import:1 behawioralna:1 nazwa/tekst:2) | — |
| 77 | `gra/data/war-rules-params.json` | +9/−0 | — | TODO (dane nowych modułów) | P6.11–12 AI / WOJNA-2 | TAK | 1 (behawioralna:1) | — |
| 78 | `gra/data/units.json` | +4/−4 | — | DONE@91dc (DANE) | ZAMKNIĘTY (bez tematu) | — | 4 (nazwa/tekst:4) | — |
| 79 | `gra/src/game/playerState.ts` | +1/−7 | — | TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust) | REPIN-AI / DYPLO / EKONOMIA-E | — | 3 (import:1 behawioralna:2) | — |
| 80 | `gra/src/ui/entityCards/improvementAdapter.ts` | +7/−1 | — | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 | — | 2 (import:1 behawioralna:1) | — |
| 81 | `gra/src/audio/filePlayer.ts` | +4/−3 | — | TODO (audio) | REPIN-ZAPIS-AUDIO | — | 4 (behawioralna:4) | — |
| 82 | `gra/src/render/kopalnia-cyny-opus5.ts` | +4/−3 | — | ODŁOŻONE 3D | REPIN-3D (na koniec, Opus) | — | 4 (import:1 behawioralna:3) | — |
| 83 | `gra/src/render/kopalnia-zlota-opus5.ts` | +4/−3 | — | ODŁOŻONE 3D | REPIN-3D (na koniec, Opus) | — | 4 (import:1 behawioralna:3) | — |
| 84 | `gra/src/data/loader.ts` | +4/−2 | — | TODO (dane) | REPIN-DANE-2 | — | 1 (behawioralna:1) | — |
| 85 | `gra/src/game/combat.ts` | +4/−2 | — | TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust) | REPIN-AI / DYPLO / EKONOMIA-E | — | 2 (behawioralna:2) | — |
| 86 | `gra/src/game/diplomacy-sensible-deals.config.json` | +6/−0 | — | TODO | P6.14 DYPLO | TAK | 1 (behawioralna:1) | — |
| 87 | `gra/src/ui/entityCards/buildingAdapter.ts` | +3/−3 | — | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 | — | 3 (komentarz:1 behawioralna:2) | — |
| 88 | `gra/src/ui/recruitHudLabel.ts` | +5/−0 | — | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 | TAK | 1 (behawioralna:1) | — |
| 89 | `gra/src/audio/muzyka-antyczna.ts` | +2/−2 | — | TODO (audio) | REPIN-ZAPIS-AUDIO | — | 1 (behawioralna:1) | — |
| 90 | `gra/src/game/embarkation.ts` | +2/−2 | — | TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust) | REPIN-AI / DYPLO / EKONOMIA-E | — | 2 (import:1 behawioralna:1) | — |
| 91 | `gra/src/render/braz-rydwan-woly-opus5.ts` | +2/−2 | — | ODŁOŻONE 3D | REPIN-3D (na koniec, Opus) | — | 1 (komentarz:1) | — |
| 92 | `gra/src/units/setup.ts` | +4/−0 | TAK | CZĘŚĆ | EKONOMIA-E (units/setup) | — | 2 (behawioralna:2) | 1 (behawioralna:1) |
| 93 | `gra/src/game/armyMerge.ts` | +3/−0 | — | TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust) | REPIN-AI / DYPLO / EKONOMIA-E | — | 2 (behawioralna:2) | — |
| 94 | `gra/src/render/bronzeCityRoblox.ts` | +2/−1 | — | ODŁOŻONE 3D | REPIN-3D (na koniec, Opus) | — | 2 (import:1 behawioralna:1) | — |
| 95 | `gra/src/render/rangeOverlay.ts` | +2/−1 | TAK | ODŁOŻONE 3D | REPIN-3D (na koniec, Opus) | — | 2 (import:1 behawioralna:1) | 2 (import:1 behawioralna:1) |
| 96 | `gra/src/render/stoneCityRoblox.ts` | +2/−1 | — | ODŁOŻONE 3D | REPIN-3D (na koniec, Opus) | — | 2 (import:1 behawioralna:1) | — |
| 97 | `gra/src/data/wikiBundle.json` | +1/−1 | — | TODO (dane) | REPIN-DANE-2 | — | 1 (nazwa/tekst:1) | — |
| 98 | `gra/src/game/diplomacy-peace-lock.ts` | +1/−1 | — | TODO | P6.14 DYPLO | — | 1 (komentarz:1) | — |
| 99 | `gra/src/game/forced-war-bronze.ts` | +1/−1 | — | TODO (brak odpowiednika w Rust) | P6.11–12 AI (REPIN-AI-2) | — | 1 (behawioralna:1) | — |
| 100 | `gra/src/game/forced-war-stone.ts` | +1/−1 | — | TODO (brak odpowiednika w Rust) | P6.11–12 AI (REPIN-AI-2) | — | 1 (behawioralna:1) | — |
| 101 | `gra/src/ui/diplomacyNegotiationModal.ts` | +2/−0 | TAK | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 | — | 1 (behawioralna:1) | 1 (behawioralna:1) |

## 5. Wektory i generatory do regeneracji po ruchu pinu (U4)

Źródło: `origin/rust-port/parity-v2` (`db102531`). Razem **89 plików wektorów** z literałem pinu, bo każdy pin-move zmienia `pin` w generatorze i w JSON.

**Grupa A — literał `91dc998a` (23 pliki), do regeneracji w pierwszej kolejności:**
- `p6_23_vectors/improvements.json`
- `p6_5b_vectors/`: `buildings.json`, `format.json`, `manpower.json`, `replenish.json`
- `p6_8d_vectors/citizen_upkeep.json`
- `p6_repin_b_vectors/`: `ration_era.json`, `recompute_era.json`
- `p6_repin_b2_vectors/`: `building_work_cost.json`, `civ_cost_markers.json`, `unit_money_cost.json`, `unit_newest.json`
- `p6_repin_b3_vectors/`: `route_cash.json`, `route_cash_mod.json`, `wealth_owner.json`, `wealth_owner_mod.json`
- `p6_repin_wojna_a_vectors/`: `ai-era-unit-promotion.json`, `army-leadership.json`, **`formation-rules.json`** (zmiana treści, nie tylko pinu: `formationRules.ts` etap 2, +59/−26)
- `p6_repin_wojna_b_vectors/`: `ai-general-war-campaign.json`, `army-consolidation.json`
- `p6_repin_wojna_c_vectors/`: `ai-move-range.json`, `diplomacy-tick-war-brake.json`

**Grupa B — literał `edb8fb56` (66 plików):** `p6_1*_vectors/` (`web-vectors.json`, `first-player-city.json`, `braz.json`, `cluster-start.json`, `llama.json`, `maps.json`), `p6_23_vectors/` (`fort`, `hexmove`, `order`, `common.rs`), `p6_4_vectors/` (6 plików + `common.rs`), `p6_5a_vectors/` (4 + `common.rs`), `p6_5b_vectors/` (`common.rs`), `p6_6a/6b_vectors/` (`common.rs`), `p6_7a/7b_vectors/` (`common.rs`), `p6_m01/m03/m04/m05a/m05b/m06a2/m06a3/m06a4/m06a5/m06a6/m06a9/m09/m10/m11/m12/m16/m17_vectors/` (`web-vectors.json` i pliki tematyczne; `p6_m10/m11/m12` mają po 2 trafienia). Pełna lista: `git grep -l edb8fb56 origin/rust-port/parity-v2 -- 'rust-port/engine/tests/*_vectors/*'`.

Testy `*.rs` w `rust-port/engine/tests/` również zawierają literał (np. `p6_repin_wojna_a_formation.rs`, `p6_repin_b3_route.rs`); po ruchu pinu trzeba je zaktualizować razem z wektorami (U4).

**Wektory, których treść zmienia się przez etap 2 (poza samym pinem):** `formation-rules.json` (WOJNA-2). Pozostałe wektory mają zmianę pinu; ich treść zależy od modułów z tabeli etapu 1 do domknięcia.

**`meta.pin`:** nie istnieje w drzewie `parity-v2` (nie ma pliku). Przed U4 trzeba ustalić, skąd pochodzi pin w wektorach (ZAŁOŻENIE: literał w generatorach i JSON; `tools/pin-manifest.json` dla kopii).

**Generatory (archiwum):** `dyspozycje/autobot/runs/*/gen*` z literałem `91dc998a` (10 `.mjs`): `R-RUSTPORT-P6-1D…/gen-p61d-web-vectors.mjs`, `R-RUSTPORT-P6-8D…/gen-p6-8d-vectors.mjs`, `R-RUSTPORT-REPIN-EKONOMIA-B…/gen-repin-b-ration-era.mjs`, `…-B…/gen-repin-b-recompute-era.mjs`, `…-B2…/gen-repin-b2-vectors.mjs`, `…-B3…/gen-civ-matrix-mod.mjs`, `…-B3…/gen-repin-b3-vectors.mjs`, `…-WOJNA-NOWE-A/B/C…/gen-repin-wojna-{a,b,c}-web-vectors.mjs`. Generatory z `edb8fb56` (69) to archiwum runów; aktywne są tylko te, których wyniki leżą w `rust-port/engine/tests`.

## 6. Pin docelowy i korekta kolejności U1–U5

**Pin docelowy: `dc8a3adc989bc82aab2cde6bb747c883f949fc1a`** (`origin/main` w chwili pomiaru). Przed U4 powtórzyć pomiar: `git fetch origin main`, `git rev-list --count dc8a3adc..origin/main`; jeśli `main` się przesunął, U4 bierze wtedy nowszy hash, a dane z tego dokumentu trzeba przeliczyć.

**Korekty tematów (wynik pomiaru):**

1. **`formationRules.ts` (etap 2, +59/−26, 9 hunków)** — wektor `formation-rules.json` wymaga zmiany treści. Temat WOJNA-2 przechodzi na początek U1 (przed resztą WOJNY).
2. **Grupa WOJNA-2 — nowe pliki i hunki etapu 2:** `generals.ts` (nowy blok 54–103, +50), `generalQuickFollow.ts` (nowy, 161 linii), `battle-mode.ts` (nowy, 14 linii). Wszystkie w U1.
3. **`auto-improvements.ts` (etap 2, +120/−4):** nowy blok 423–525 (priorytet jedzenia) — w tematach REPIN-AUTOIMPR / P6.8I (U1), nie tylko P6.8I.
4. **`ai.ts` (etap 2, +63/−11):** REPIN-AI w U1 (wcześniej tylko U1 bez hunków).
5. **`diplomacy-proposals.ts` (etap 2, +36/−6):** REPIN-DYPLO w U1; hunki 429–448 (nowa logika, +20).
6. **`warAllInCapital.ts` — konflikt tematu:** tabela planu: „P6.11–12 AI (REPIN-AI-2)”, U1 planu: „WOJNA-NOWE-D”. **Przyjęte ZAŁOŻENIE: WOJNA-NOWE-D** (moduł wojenny; 13 hunków behawioralnych, +206 linii etapu 2).
7. **`main.ts` (etap 2, +207/−64, 50 hunków):** temat planu „REPIN-MAIN (rozdzielić)” nie ma fazy w U1–U5. ZAŁOŻENIE: dodać REPIN-MAIN-LOGIC do U1/U3 (hunki logiki, UX, kreator nowej gry) i REPIN-3D do U5 (hunki graficzne); podział wymaga ręcznego przeglądu, bo klasyfikacja heurystyczna daje 45 behawioralnych.
8. **`battleScene.ts` (etap 2, +443/−58, 50 hunków):** tylko U5 (REPIN-3D), zgodnie z planem.
9. **Kopie frontend-v2:** `armyMergePanel.ts` i `unitActionBarHtml.ts` rozjechane z `dc8a3adc` — re-kopia w U3.
10. **Bloki K-series:** K08D (`buildHandelDetailCard`, `buildWealthDetailCard`) i K08E (`buildTopBarRekruciDetailCard`) do re-kopii przed K09C/K09D. K09A bez dryfu. K01–K07, K08A–C — pomiar do wykonania (§9).
11. Plan (sekcja 2 pkt 3): stwierdzenie o braku dryfu K08A–K09A jest nieaktualne dla K08D/K08E.

**Kolejność U1–U5 po korekcie:**

- **U0 — ten temat (zrobiony):** pomiar, zero kodu.
- **U1 — domknięcie etapu 1 + nowe hunki etapu 2 w tym samym temacie (pin docelowy `dc8a3adc`):**
  - WOJNA-2 (formationRules refresh, generals, generalQuickFollow, battle-mode), potem WOJNA-NOWE-D (w tym warAllInCapital);
  - REPIN-AI (ai.ts, ai-city-capture-executor, forced-war-*, war-rules-multiwar, war-allin-params, war-rules-params);
  - REPIN-DYPLO (diplomacy-*, culture-religion, trade-routes, barbarians, cluster-start, planned-march, order, embarkation, armyMerge — odświeżenie istniejących modułów);
  - REPIN-EKONOMIA-D/E i P6.8A–J (economy, work-tax, production, turn-economy, auto-improvements, society-breakdown, relief-preserving-improvements, manpower, population-growth-v85, units/setup);
  - REPIN-ZAPIS (save, save-presence, fsa-autosave, dirtyRenderSync, retained-side-panel-events) i REPIN-ZAPIS-AUDIO (filePlayer, muzyka-antyczna);
  - REPIN-DANE-2 (loader.ts, wikiBundle.json) oraz REPIN-MAIN-LOGIC (§6 pkt 7).
- **U2 — delta etapu 2 dla tematów zamkniętych** (WOJNA-A/B/C, EKONOMIA-A/B/C): tylko hunki z tej tabeli, bez ponownego portu całości.
- **U3 — UI (REPIN-UI-2):** 11 plików UI etapu 2 + 2 rozjechane kopie + K08D/K08E re-kopia; najpierw pomiar K01–K07 i K08A–C (luka §9); potem K09C/K09D.
- **U4 — ruch pinu jednym ruchem:** `tools/pin-manifest.json` (435 wpisów: sha z `dc8a3adc`, zamiast `edb8fb56`); `verify-pin-copies`; generatory (literały) i 89 plików wektorów z §5 (najpierw grupa A); testy `*.rs` z literałem; weryfikatory Python (plan podaje, że mają starą formułę — NIE zweryfikowano w tym temacie); pełne bramki.
- **U5 — 3D (na koniec):** REPIN-3D (`battleScene.ts` +443/−58, `render/*` w tym `buildHighlight`, `memDebug`, `transientObjectResources`, `units`, `rangeOverlay`, `cities`, `unitStatPlate`, `kopalnia-*-opus5`, `braz-rydwan-woly-opus5`, `bronzeCityRoblox`, `stoneCityRoblox`, `unitVeteranBadges`, `rangeOverlay`), część graficzna `main.ts`, moduły renderera P4.36, RR-T1.

## 7. Nowe pliki weba bez odpowiednika (27) i ich temat

Nowe względem pinu `edb8fb56` (`git diff --diff-filter=A --name-only edb8fb56 origin/main -- gra/src gra/data`). Stan wg planu; „bez odpowiednika” = brak modułu/kopii na pinie `edb8fb56`.

| # | Plik (web) | Stan (plan) | Temat docelowy |
|---|---|---|---|
| 1 | `gra/data/army-consolidation-params.json` | DONE@91dc (DANE) | zamknięty |
| 2 | `gra/data/diplomacy-tick-params.json` | DONE@91dc (DANE) | zamknięty |
| 3 | `gra/data/war-allin-params.json` | TODO (dane) | WOJNA-NOWE-D / REPIN-AI |
| 4 | `gra/data/war-rules-params.json` | TODO (dane) | REPIN-AI / WOJNA-2 |
| 5 | `gra/src/battle/formationRules.ts` | DONE@91dc, +59/−26 etapu 2 | WOJNA-2 (refresh `formation_rules.rs`, wektor `formation-rules.json`) |
| 6 | `gra/src/game/ai-era-unit-promotion.ts` | DONE@91dc | zamknięty |
| 7 | `gra/src/game/ai-general-war-campaign.ts` | DONE@91dc | zamknięty |
| 8 | `gra/src/game/ai-move-range.ts` | DONE@91dc | zamknięty |
| 9 | `gra/src/game/army-consolidation.ts` | DONE@91dc | zamknięty |
| 10 | `gra/src/game/army-leadership.ts` | DONE@91dc | zamknięty |
| 11 | `gra/src/game/battle-mode.ts` | nowy w etapie 2 (14 linii) | WOJNA-2 |
| 12 | `gra/src/game/diplomacy-sensible-deals.config.json` | TODO | REPIN-DYPLO (P6.14) |
| 13 | `gra/src/game/diplomacy-sensible-deals.ts` | TODO | REPIN-DYPLO (P6.14) |
| 14 | `gra/src/game/diplomacy-tick-war-brake.ts` | DONE@91dc | zamknięty |
| 15 | `gra/src/game/dirtyRenderSync.ts` | TODO | REPIN-ZAPIS (P6.20–22) |
| 16 | `gra/src/game/generalQuickFollow.ts` | nowy w etapie 2 (161 linii) | WOJNA-2 |
| 17 | `gra/src/game/generals.ts` | TODO, +50 etapu 2 | WOJNA-2 |
| 18 | `gra/src/game/retained-side-panel-events.ts` | TODO | REPIN-ZAPIS (P6.20–22) |
| 19 | `gra/src/game/save-presence.ts` | TODO | REPIN-ZAPIS (P6.20–22) |
| 20 | `gra/src/game/war-rules-multiwar.ts` | TODO | REPIN-AI (P6.11–12) / WOJNA-NOWE-D |
| 21 | `gra/src/game/warAllInCapital.ts` | TODO, +206/−14 etapu 2 | WOJNA-NOWE-D (zob. §6 pkt 6) |
| 22 | `gra/src/game/work-tax.ts` | TODO | REPIN-EKONOMIA-D + P6.8F |
| 23 | `gra/src/render/buildHighlight.ts` | nowy w etapie 2 (28 linii) | REPIN-3D (U5) |
| 24 | `gra/src/render/memDebug.ts` | ODŁOŻONE 3D | REPIN-3D (U5) |
| 25 | `gra/src/render/transientObjectResources.ts` | ODŁOŻONE 3D | REPIN-3D (U5) |
| 26 | `gra/src/ui/aiOwnerProgressFrame.ts` | UI | REPIN-UI-2 (U3) |
| 27 | `gra/src/ui/recruitHudLabel.ts` | UI | REPIN-UI-2 (U3) |

## 8. Komendy weryfikacyjne (każda liczba z komendy)

```
git fetch origin main                                  # origin/main = dc8a3adc
git rev-list --count edb8fb56..origin/main             # 186
git rev-list --count 91dc998a..origin/main             # 99
git rev-list --count edb8fb56..91dc998a                # 87
git diff --name-only edb8fb56 origin/main -- gra/src gra/data        # 101 plików
git diff --diff-filter=A --name-only edb8fb56 origin/main -- gra/src gra/data   # 27
git diff --numstat 91dc998a origin/main -- gra/src gra/data         # 23 pliki, +1733/-358
git diff -U0 91dc998a origin/main -- gra/src gra/data > s2.diff     # 251 hunków (tools/hunks.mjs)
git archive dc8a3adc gra | tar -x -C <webarch>                      # origin/main
git archive edb8fb56 gra/src gra/data | tar -x -C <pin-edb>         # pin
# parity-v2 (src-tauri/frontend-v2):
node tools/dom-harness/measure-k09a-drift.mjs --pin-dir <pin-edb> --head-pin-dir <webarch>   # EXIT 0, 9/9 SAME
node tools/dom-harness/measure-k08d-drift.mjs --pin-dir <pin-edb> --cur-dir <webarch>        # EXIT 1, 2/11 zmienione
node tools/dom-harness/measure-k08e-drift.mjs --pin-dir <pin-edb> --head-pin-dir <webarch>   # EXIT 0, 11 SAME + 1 DRIFT(1)
node tools/verify-pin-copies.mjs                       # plików=435 niezgodnych=0, EXIT 0
node tools/copies-drift.mjs                            # identyczne=433 rozjechane=2
node tools/cp-funcs.mjs                                # funkcje 300, identyczne 278, zmienione 22, nowe 6
git grep -l edb8fb56 origin/rust-port/parity-v2 -- 'rust-port/engine/tests/*_vectors/*'   # 66 plików
git grep -l 91dc998a origin/rust-port/parity-v2 -- 'rust-port/engine/tests/*_vectors/*'   # 23 plików
git ls-tree -r --name-only origin/rust-port/parity-v2 -- rust-port | grep meta.pin          # pusto
```

## 9. Założenia, luki i ryzyka

- **L1 — klasyfikacja hunków heurystyczna** (§0). `behawioralna` to górny szacunek; ręczny przegląd w U1/U2.
- **L2 — brak narzędzia pomiarowego dla K01–K07 i K08A–C** (`measure-k0*-drift` jest tylko dla K08D, K08E, K09A). Luka. Zastępczy pomiar: §1.2 (funkcje). Przed U3 trzeba dopisać narzędzie lub ręcznie zmierzyć te bloki.
- **L3 — `meta.pin` nie istnieje** w `parity-v2`. Przyjęte ZAŁOŻENIE: pin w literałach wektorów i generatorów.
- **L4 — weryfikatory Python** (p6_23, m16, p6_4 — wg planu ze starą formułą) nie były objęte tym pomiarem.
- **L5 — tematy spoza faz U1–U5** w tabeli planu (`REPIN-MAIN`, `REPIN-AUTOIMPR`, `REPIN-DANE-2`, `REPIN-ZAPIS-AUDIO`, `P6.8F`/`P6.8J`) — przypisane do U1 (ZAŁOŻENIE); ich ID wymagają zatwierdzenia orkiestratora.
- **L6 — moduły Rust:** `rust-port/engine/src/domain/` na `origin/main` ma 18 modułów (bez `formation_rules.rs`, `ai.rs`, itp.). Na `parity-v2` istnieje m.in. `formation_rules.rs` (wynik grep z §1.4). Przypisania modułów w tym dokumencie są nazwami docelowymi z planu, nie stanem gałęzi.
- **L7 — 22 zmienione funkcje `cityPanel.ts`** i 6 nowych funkcji (§1.2): przypisanie do bloków heurystyczne (po nazwie w narzędziach), nie po treści.
- **L8 — stan wykonania:** żadna zmiana kodu, żaden push, żaden deploy; wyniki dotyczą `dc8a3adc` i mogą się zestarzeć, jeśli `main` się przesunie.

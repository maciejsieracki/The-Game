# Rebalans ekonomii wg epok — propozycja (R-WEB-ECONOMY-ERA-REBALANCE-PROPOSAL-Q1, runda 2 po obronie)

Status: PROPOZYCJA do decyzji właściciela. Zero zmian w `gra/src/**` i `gra/data/**`.
Baza kodu: origin/main, kandydat `8d2cb32b6`. Dane pomiaru: `/tmp/econ-final/seed{4242,7}.jsonl` (150 tur, owner 0).
Model: `gra/tools/econ-rebalance-model.cjs` (statyczny, bez sprzężenia zwrotnego). Pełny wynik: `dyspozycje/autobot/runs/R-WEB-ECONOMY-ERA-REBALANCE-PROPOSAL-Q1/model-out.txt` (400 wierszy, 0 NaN).

Legenda: **NIE_ZMIERZONO** = pomiar tego nie podaje; wartość przyjęta jako założenie (podane wprost). **NIE_MODELOWANE** = zmiana opisana, ale model jej nie liczy.

---

## 0. Najważniejsze ustalenia

1. **Przychody z ulepszeń rosną z epoką na DWÓCH zasadach.** Surowce: mnożnik ×1,5 za epokę (`resourceProductionAmountForEra`, składa się). Żywność/Praca/Handel: +1 za epokę (addytywnie, `improvementYieldForEra`). Tartak: 50 → 75 (Brąz) → 113 (Żelazo). Farma: 3 → 4 → 5. Surowiec rośnie względnie najszybciej (+50%/epokę), żywność/praca wolniej (+33%, potem +25%).
2. **Jednostki zjadają żywność mocniej, niż sugeruje tabela `units.json`.** Kolumna `żywność/turę` wynosi 1 dla wszystkich 48 jednostek (Kamień 11, Brąz 37, Żelazo 27 — z wyjątkiem 1 jednostki z 0). Skala epoki *jednostki* (`scaleCostByEpoch`: Kamień ×1, Brąz ×2, Żelazo ×4) i stała `R_STAWKI_FALA1_FALA2_MULT` = 4 dają **4 / 8 / 16 żywności na jednostkę na turę** (marsz, własne terytorium). Obóz ×0,5, poza terytorium ×2. Mnożnik epoki *właściciela* na zużycie wojska **nie istnieje** w kodzie — wojsko skaluje się tylko epoką jednostki. Miks jednostek w pomiarze: NIE_ZMIERZONO, więc model liczy dwa warianty: same jednostki Kamienia (4/jedn.) i same Brązu (8/jedn.).
3. **Żywność obywateli: m(e) = 1 + 0,5·(e−1)** (1 / 1,5 / 2 / 2,5 / 3 dla epok 1–5). Przy poziomie racji 1 (2 żywn./os.) = 2 / 3 / 4 na obywatela na turę (epoka 2 zmierzona: m = 1,5 → 3/os.).
4. **Drewno nie przestaje rosnąć przy żadnym wariancie.** Seed 7 (PRZED): +725/turę w t150; najmocniejszy wariant (MOCNY): +463. Potrzebne osobne ujście Drewna (pytanie ABC 1). Brutto Drewna zawiera lasy (15 Drewna/hex, nie ulepszenie), więc wrażliwość Drewna na mnożnik ulepszeń jest **górną granicą**.
5. **Praca nie znika jako problem, ale zapas nadal rośnie bez ujścia.** Seed 4242 t150: Praca 20 454, +254/turę; w każdym wariancie utrzymuje się ok. 240–254/turę. Zmiany proponowane w tej rundzie **nie zmieniają tempa wzrostu Pracy w Brązie** (bonus Pracy bez obcięcia). Brak ujścia Pracy to osobna decyzja właściciela (pytanie ABC 8), a nie efekt tych zmian.
6. **Żywność jest już dziś ujemna w seedzie 7** (PRZED: −8/turę w t150, spichlerz 992 → ok. 124 tury). W seedzie 4242 PRZED jest dodatnia (+24), a spichlerz ma cap 1000 do t90, 3000 w t120, 5000 w t150 (stan 2851). **Wariant REKOMENDOWANY zjada żywność w obu seedach** (patrz §D). Bez równoległej zmiany produkcji żywności nie jest do wdrożenia — to jest ustalenie, nie drobiazg.
7. **P0 rozstrzygnięte:** wartość utrzymania Pracy = 1 (`econ-params.json`), mnożnik epoki (×1/×2/×4) siedzi **tylko w kodzie** (`terrainImprovementEraMultiplier`). Zakres: wszystkie ulepszenia liczone przez `computePracaUpkeepByOwner` (`terrain-improvements.ts` l.991–1019, z `RESOURCE_UPKEEP_IMPROVEMENT_KEYS`; pełnej listy kluczy NIE_ZMIERZONO w tej rundzie). Rekomendacja: zostawić wartość i zakres, opisać mnożnik w `econ-params`.
8. **Pomiar jest cały w epoce 2 (Brąz).** Wszystko o Żelazie i epokach 4–5 to **projekcja statyczna lub wnioski z kodu**, nie pomiar. **Uwaga z kodu (nowe):** `normalizeProductionEra` (`terrain-improvements.ts` l.331–333) zwraca 1, 2 albo 3 — a `improvementYieldForEra` (l.197) zwraca wartość bazową dla epok innych niż 2 i 3. W epoce 4 i 5 więc surowce i bonusy ulepszeń **wracają do wartości bazowych**, podczas gdy utrzymanie Pracy (`terrainImprovementEraMultiplier`: 8 i 16) i racje rosną. To jest rozbieżność do decyzji właściciela, czy epoki 4–5 są osiągalne (`epoka-ludnosc-manpower.json` mówi o „Epoka 4+ — osobny unlock”).

---

## A. Przychody z ulepszeń per epoka (kod + dane)

Źródła: `gra/data/terrain-improvements.json` (bazy), `gra/src/game/terrain-improvements.ts`:
- `TERRAIN_IMPROVEMENT_ERA_MULTIPLIERS` l.128–132 (upkeep: 1 / 2 / 4, poza tym ×2 za epokę),
- `terrainImprovementEraMultiplier` l.134–142,
- `improvementYieldForEra` l.191–200 (addytywnie `base + (era−1)` dla epok 2 i 3, inaczej `base`),
- `normalizeProductionEra` l.331–333 i `resourceProductionAmountForEra` l.335–342 (`round(base × 1,5^(era−1))` dla epok 2 i 3, inaczej `base`).

**Tabela 1 — przychód z ulepszenia per tura, epoki 1–5** (epoki 4–5 = wynik kodu, NIE pomiar):

| Ulepszenie | Baza (e1) | e2 Brąz | e3 Żelazo | e4 (kod) | e5 (kod) | Zasada |
|---|---|---|---|---|---|---|
| Farma (żywność/praca/handel) | 3 | 4 | 5 | **3** | **3** | +1 do ep. 3; kod wraca do bazy w ep. 4–5 |
| Irygacja (żywność) | 5 | 6 | 7 | 5 | 5 | j.w. |
| Bydło (żywność) | 2 | 3 | 4 | 2 | 2 | j.w. |
| Tarasy (żywność) | 3 | 4 | 5 | 3 | 3 | j.w. |
| Łodzie rybackie | 6 | 7 | 8 | 6 | 6 | j.w. |
| Tartak → Drewno | 50 | **75** | **113** | **50** | **50** | ×1,5/epokę do ep. 3; kod: ep. 4–5 = baza |
| Kamieniołom → Kamień | 50 | 75 | 113 | 50 | 50 | j.w. |
| Glinianka → Glina (od ep. 2) | — | 75 | 113 | 50 | 50 | j.w. |
| Kopalnia rudy | 20 | 30 | 45 | 20 | 20 | j.w. (baza 20 × 1,5^(e−1), zaokr.) |
| Warzelnia → Sól (od ep. 2) | — | 75 | 113 | 50 | 50 | j.w. |
| Stadnina → Koń (od ep. 2) | — | 38 | 56 | 25 | 25 | j.w. |
| Kopalnia złota → Złoto | 1 | 2 | 2 | 1 | 1 | baza 1 × 1,5^(e−1), zaokr. (round(1,5) = 2, round(2,25) = 2) |
| **Utrzymanie Pracy / ulepszenie** (`terrainImprovementEraMultiplier` × econ-params 1) | 1 | **2** | **4** | **8** | **16** | ×2 za epokę, także w epoce 4–5 |

Wartości epok 4–5 w kolumnach „kod” wynikają z normalizacji do epok 1–3 (§0 pkt 8); nie są zmierzone.

**Wkład ulepszeń w brutto (pomiar, owner 0, t150):**

| Seed | Drewno brutto | Glina brutto | Kamień brutto | Ceramika brutto | Brutto surowcowe łącznie | Liczba ulepszeń: UPK | Liczba ulepszeń: BRU |
|---|---|---|---|---|---|---|---|
| 4242 (10 miast) | 260 | 406 | 2 | 150 | 818 | 5 (pracaUpkeep 10 / 2) | 10,9 (818 / 75) |
| 7 (2 miasta) | 760 | 14 | 304 | 100 (+ Cegła 450, nie liczona) | 1178 | 18 (pracaUpkeep 36 / 2) | 15,7 (1178 / 75) |

Dwa estymatory liczby ulepszeń (NIE_ZMIERZONO, zakres, nie granica): **UPK** = `hud.pracaUpkeep / 2` — w t30–t60 jest zerem, bo `pracaUpkeep` pojawia się dopiero w t90; **BRU** = brutto surowcowe / 75 — zawyża, bo brutto zawiera lasy (15 Drewna/hex), Ceramikę z przetwórstwa i nie wyklucza ulepszeń innych niż surowcowe. Model liczy oba (§D).

**Które mnożniki dają „stałość”?** Addytywne +1/epokę dla żywności/pracy/handlu rośnie względnie wolno (farma +33% z Brązu, +67% z Żelaza). Mnożnik ×1,5 dla surowców rośnie szybko (Drewno +50%, potem +50%) i jest sprzeczny z intencją „stałości”. Intencja właściciela pasuje do żywności/pracy, nie do surowców. Kod poza epoką 3 nie rośnie wcale (§0 pkt 8), co jest odrębnym problemem do decyzji.

---

## B. Koszty

**(1) Utrzymanie ulepszeń (Praca):** `computePracaUpkeepByOwner` (`turn-economy.ts` l.991–1019): `round(econ-params 1 × terrainImprovementEraMultiplier(epoka ulepszenia))` za każde płatne ulepszenie = **1 / 2 / 4 Pracy na ulepszenie** w epokach 1 / 2 / 3, potem 8 / 16 (kod). Pomiar: seed 7 `pracaUpkeep` = 36 (ok. 18 ulepszeń × 2); seed 4242 = 10 (ok. 5 × 2). Utrzymanie Pieniądzem/Surowcami budynków: `utrzymanieBudynkowSurowce` = {} w pomiarze (NIE_ZMIERZONO, czy w innym biegu jest niezerowe).

**(2) Utrzymanie jednostek:**
- Surowiec: `units.json` „Utrzymanie surowiec (ilość)" — Wojownik Drewno 3 itd. (bez skali epoki w danych; `scaleCostByEpoch` w kodzie). Pomiar: `utrzymanieJednostekSurowce.drewno` = 165 przy 55 jednostkach (seed 4242 t90) ⇒ ok. 3 Drewna/jednostkę — zgodne z danymi.
- Pieniądz: pomiar ok. 4 na jednostkę (`utrzymanieJednostekPieniadz` 220/55).
- **Żywność: TAK, zużywają.** Źródło: `unitFoodPerTurn` (`economy-upkeep.ts` l.1153–1174), `buildUnitFoodTable` (l.1178+, skala `scaleCostByEpoch` wg epoki *jednostki*), `R_STAWKI_FALA1_FALA2_MULT = 4` (`r-stawki-strojenie.ts` l.12). Przy 1 żywności/turę bazy: Kamień ×1 → 4, Brąz ×2 → 8, Żelazo ×4 → 16 żywności na jednostkę na turę (marsz, własne terytorium).

**(3) Żywność obywateli** (`population-growth-v85.ts` `computeCityRationCost`, `citizen-consumption-era.ts` l.19–25): `racje/os. = poziom × 2 × m(e)`. Poziom racji w pomiarze **NIE_ZMIERZONO** (przyjęto poziom 1). Pomiar (owner 0, Brąz, m = 1,5): seed 4242 t150: 50 os. × 3 = **150/turę** (zgodne z pomiarem); seed 7 t150: 2 × 3 = **6/turę** (zgodne).

**Zużycie żywności przez wojsko — korekta (obrona pkt 8):** 55 jednostek (t90, seed 4242) × 8 = **440/turę** dla miksu z samych jednostek Brązu (marsz), **220** dla miksu Kamienia (4/jedn.). Poprzednie zdanie „spichRate +6 jest niezgodne z 440” **nie jest porównywalne**: spichlerz był na capie 1000 w t90, a produkcji żywności nie ma w pomiarze osobno, więc zużycie wojska jest NIE_ZMIERZONO. Wartości żywności netto w modelu są pochodną tego założenia.

**Stan spichlerza (obrona pkt 7 — dane):**

| Seed | Tura | spichlerzMax | spichlerzStan | spichlerzRate |
|---|---|---|---|---|
| 4242 | t30 | 1000 | 232,5 | −4 |
| 4242 | t60 | 1000 | 408,5 | +14 |
| 4242 | t90 | 1000 | 1000 (cap) | +6 |
| 4242 | t120 | 3000 | 1995,5 | +10 |
| 4242 | t150 | 5000 | 2851,2 | +24 |
| 7 | t150 | 1000 | 992 | −8 |

Poprzednie zdanie „cap 1000 w t90, spichRate ~0” było błędne co do tempa (+6 w t90) i pomijało wzrost capu do 3000 i 5000.

---

## C. Propozycja konkretna (liczby, pliki, fazowanie)

Zasada fazowania: **Brąz (epoka 2)** = zmiany wchodzące teraz; **Żelazo (epoka 3)** = zamrożenie (wartości na poziomie Brązu) albo dalszy, jawnie opisany krok. Bonusy są **całkowite na ulepszenie** (`base + bm`): nie ma zaokrągleń ani `Math.floor` (poprawka do poprzedniej wersji — patrz §F pkt 1).

### (i) Przychody z ulepszeń — stałość

| Pozycja | Plik / funkcja | Obecnie | Ostrożny | Średni | Mocny | REKOMENDOWANY |
|---|---|---|---|---|---|---|
| Surowce: mnożnik za epokę | `terrain-improvements.ts` `resourceProductionAmountForEra` (`1.5`) | ×1,5/ep. | ×1,25/ep., bez zamrożenia (Tartak: 63 / 79) | ×1,25 w Brązie, Żelazo zamrożone (63 / 63) | ×1,0 (stałe 50) | ×1,25 w Brązie (63), **Żelazo zamrożone (63)** |
| Bonus żywność/praca/handel | `improvementYieldForEra` | `base + (e−1)` | bez zmian (`base + (e−1)`) | Brąz +1, Żelazo zamrożone +1 | 0 (Farma Brąz 3 — obcięcie −25%) | Brąz +1 (farma 4, bez zmian), **Żelazo zamrożone +1 (farma 4, nie 5)** |
| Normalizacja epok 4–5 | `normalizeProductionEra`, `improvementYieldForEra` | baza w ep. 4–5 | do ustalenia (kod) | do ustalenia | do ustalenia | **zamrożenie na wartości ep. 3** (poprawka kodu, NIE_MODELOWANE) |

**REKOMENDACJA (i):** wariant REKOMENDOWANY. Brąz: surowce ×1,25 (Tartak 50 → 63), bonusy bez zmian (farma nadal 4). Żelazo: surowce i bonusy zamrożone na poziomie Brązu (Tartak 63, farma 4) — w odniesieniu do dzisiejszej trajektorii Żelazo to obcięcie (Tartak 113 → 63, farma 5 → 4).

### (ii) Droższe jednostki — utrzymanie surowcem (modelowane) i rekrutacja (NIE_MODELOWANE)

Modelowane: mnożnik **Drewna utrzymania jednostek** (`kU(e)`, Drewno = 165/t przy 55 jednostkach).

| Wariant | Brąz | Żelazo | Uwagi |
|---|---|---|---|
| Ostrożny | ×1,10 | ×1,10 | mała zmiana, prosta do cofnięcia |
| Średni | ×1,25 | ×1,25 zamrożone | |
| Mocny | ×1,50 | ×1,50 | |
| **REKOMENDOWANY** | **×1,25** | **×1,25 zamrożone** | j.w. |

NIE_MODELOWANE: koszt **rekrutacji** (jednorazowy) i utrzymanie innymi surowcami (Brąz, Cegła, Żelazo — np. Włócznik Brąz 5 wg `units.json`). Pliki do ustalenia w kolejnym temacie; `economy-upkeep.ts` zawiera utrzymanie (`scaleCostByEpoch(upkeep, epoch)`, l.1121), nie zlokalizowano kosztu rekrutacji w tej rundzie. Propozycja: nie zmieniać rekrutacji bez osobnego pomiaru (pytanie ABC 2).

### (iii) Żywność obywateli — współczynnik racji

Plik: `citizen-consumption-era.ts` `CITIZEN_CONSUMPTION_ERA_STEP` (0,5) i `citizenConsumptionEraMultiplier` (l.22–25).

| Wariant | step | m (e2 / e3 / e4 / e5) | Racje obywateli, 50 os., t150, e2 | e3 |
|---|---|---|---|---|
| Dziś | 0,5 | 1,5 / 2,0 / 2,5 / 3,0 | 150 | 200 |
| Ostrożny / REKOMENDOWANY | 0,6 | 1,6 / 2,2 / 2,8 / 3,4 | 160 | 220 |
| Średni | 0,75 | 1,75 / 2,5 / 3,25 / 4,0 | 175 | 250 |
| Mocny | 1,0 | 2,0 / 3,0 / 4,0 / 5,0 | 200 | 300 |

**REKOMENDACJA (iii): 0,6 (ostrożny, także rekomendowany).** Brąz wchodzi (1,6), Żelazo dalej rośnie (2,2) — zgodnie z intencją właściciela o wyższym zużyciu żywności przez obywateli. Zmiana wymaga od razu decyzji o produkcji żywności (§0 pkt 6).

### (iv) Żywność wojska — nowy mnożnik właściciela

Plik: `economy-upkeep.ts` `unitFoodPerTurn` (nowe `uF(e)`), wywoływane z `militaryFoodConsumptionWithSpichlerz`. Model: zużycie = jednostki × (4 lub 8 wg miksu) × uF(e).

| Wariant | uF Brąz | uF Żelazo | Przykład t150 (seed 4242, miks Brązu: 8/jedn., 23 jedn.) |
|---|---|---|---|
| Dziś | 1,00 | 1,00 | 184 |
| Ostrożny | 1,25 | 1,50 | 230 → 276 (Żelazo) |
| Średni | 1,50 | 2,00 | 276 → 368 |
| Mocny | 2,00 | 3,00 | 368 → 552 |
| **REKOMENDOWANY** | **1,25** | **1,25 zamrożone** | 230 (Brąz i Żelazo) |

**REKOMENDACJA (iv): ×1,25 w Brązie, zamrożone w Żelazie** (`uF = 1 + 0,25·min(e−1, 1)`). Żelazo podwaja bazę jednostki (×4 vs ×2), więc dalszy mnożnik właściciela jest zbędny (§D).

### (v) Utrzymanie budynków/ulepszeń (Praca)

Mnożnik utrzymania Pracy (`terrainImprovementEraMultiplier` × econ-params 1 za ulepszenie): dziś 2 w Brązie, 4 w Żelazie (8 / 16 w ep. 4–5 wg kodu).

| Wariant | Brąz | Żelazo | Efekt modelu (Praca netto, seed 7 t150, UPK) |
|---|---|---|---|
| Ostrożny | 2 | 4 (bez zmian) | −15 (bez zmian) |
| Średni | 3 | 6 | −33 (Brąz) / −87 (Żelazo) |
| Mocny | 4 | 8 | −60 (Brąz) / −132 (Żelazo) |
| **REKOMENDOWANY** | **2 (bez zmian)** | **4 (bez zmian)** | −15 / −51 (Żelazo — wynik z rosnącej liczby ulepszeń) |

**REKOMENDACJA (v): bez zmian** (Praca nie jest wąskim gardłem w seedzie 4242; w seedzie 7 Praca jest już ujemna i pogarszanie jej wymaga decyzji o ujściu Pracy). NIE_ZMIERZONO: wpływ na gracza przy większej liczbie ulepszeń.

### (vi) Ujście Pracy (cuda) — poza tą rundą

Model nie wymaga ujścia do stabilności żywności ani Drewna. Zapas Pracy 20 454 nadal rośnie o ok. 250/turę w każdym wariancie — to jest problem właściciela, nie wynik tej propozycji. Decyzja: pytanie ABC 8.

### Rozstrzygnięcie P0

Kod vs econ-params: **wartość zgodna (1)**. Mnożnik epoki (×1/×2/×4, dalej ×2) siedzi tylko w kodzie (`terrainImprovementEraMultiplier`, `terrain-improvements.ts` l.134–142; tabela l.128–132). Zakres: wszystkie ulepszenia zliczane przez `computePracaUpkeepByOwner` (l.991–1019), a nie tylko surowcowe — nazwa klucza jest węższa. Rekomendacja: zostawić wartość i zakres, opisać mnożnik w `econ-params` (`_meta`) — **bez zmiany zachowania**.

### Propozycja zbiorcza — REKOMENDOWANY

- **Brąz (e2):** surowce ×1,25 (Tartak 63), bonusy bez zmian (farma 4), racje 0,6 (m = 1,6), wojsko uF 1,25, Drewno utrzymania jednostek ×1,25, utrzymanie Pracy bez zmian (2).
- **Żelazo (e3):** surowce zamrożone (63), bonusy zamrożone (farma 4), uF zamrożone (1,25), Drewno jednostek zamrożone (×1,25), racje dalej +0,6 (m = 2,2), utrzymanie Pracy bez zmian (4).
- **Warunek wdrożenia (NIE_MODELOWANE):** równoległa decyzja o produkcji żywności (§D — w tym wariancie żywność netto jest ujemna w obu seedach).

---

## D. PRZED / PO na przykładzie pomiaru (model statyczny)

Uruchomienie: `node gra/tools/econ-rebalance-model.cjs /tmp/econ-final` (pełny wynik: `dyspozycje/autobot/runs/R-WEB-ECONOMY-ERA-REBALANCE-PROPOSAL-Q1/model-out.txt`). Wartości za turę. **F** = żywność netto; **D** = Drewno netto; **P** = Praca netto; **R** = racje; **W** = żywność wojska. Wiersze tabel to estymator UPK; wiersze z estymatorem BRU są w `model-out.txt` (różnice Praca/żywność w Brązie są zerowe lub < 3%, w Żelazie do ok. 5%). Miks jednostek: **Kamień 4/jedn.** / **Brąz 8/jedn.** — pierwsza wartość jest wariantem Kamienia, druga Brązu.

**Seed 4242 (10 miast, 50 obywateli, 23 jednostki w t150), epoka 2 (Brąz, pomiar):**

| Tura | Wariant | D | P | F (Kamień / Brąz) | R | W (Kamień / Brąz) |
|---|---|---|---|---|---|---|
| t60 | PRZED | 0 | 79 | +14 / +14 | 42 | 20 / 40 |
| t60 | REKOMENDOWANY | −8,7 | 79 | +6,2 / +1,2 | 44,8 | 25 / 50 |
| t90 | PRZED | +10 | 221 | +6 / +6 | 147 | 220 / 440 |
| t90 | REKOMENDOWANY | −72 | 221 | −59 / −114 | 157 | 275 / 550 |
| t150 | PRZED | +150 | 254 | +24 / +24 | 150 | 92 / 184 |
| t150 | SREDNI | +90 | 249 | −47 (Kamień) | 175 | 138 |
| t150 | REKOMENDOWANY | +90 | 254 | **−9 / −32** | 160 | 115 / 230 |
| t150 | MOCNY | +30 | 241,5 | −120,5 / −212,5 | 200 | 184 / 368 |

**Seed 4242, projekcja Żelazo (e3):**

| Tura | Wariant | D | P | F (Kamień / Brąz) | R |
|---|---|---|---|---|---|
| t150 | PRZED | +280 | 237,6 (UPK 246,5) | −23,5 | 200 |
| t150 | REKOMENDOWANY | +90 | 232 (UPK 244) | **−69 / −92** | 220 |

**Seed 7 (2 miasta, 2 obywateli, 6 jednostek w t150), epoka 2 (Brąz, pomiar):**

| Tura | Wariant | D | P | F (Kamień / Brąz) | R | W (Kamień / Brąz) |
|---|---|---|---|---|---|---|
| t60 | PRZED | −2 | 5 | −4 / −4 | 3 | 8 / 16 |
| t60 | REKOMENDOWANY | −4,3 | 5 | −6,2 / −8,2 | 3,2 | 10 / 20 |
| t150 | PRZED | +725 | −15 | −8 / −8 | 6 | 24 / 48 |
| t150 | REKOMENDOWANY | +594 | −15 | −14,4 / −20,4 | 6,4 | 30 / 60 |
| t150 | MOCNY | +463 | −60 | −43 / −67 | 8 | 48 / 96 |

**Seed 7, projekcja Żelazo (e3), t150:** PRZED: D +1105, P −42, F −1 · REKOMENDOWANY: D +594, P −51, F −16,8 / −22,8.

Liczby pochodzą z modelu, nie z pomiaru (NIE_ZMIERZONO: liczba ulepszeń, miks jednostek, poziom racji, udział obozowania).

### Wnioski z modelu

- **Drewno (seed 7) nadal rośnie** we wszystkich wariantach: +463 do +725/turę w Brązie (PRZED +725, REKOMENDOWANY +594). W Żelazie projekcja PRZED +1105, REKOMENDOWANY +594. Potrzebne ujście Drewna (pytanie ABC 1).
- **Praca (seed 4242) nie rośnie szybciej** niż dziś w Brązie (254 w PRZED i REKOMENDOWANY). Zapas Pracy rośnie bez ujścia w każdym wariancie — to odrębna decyzja (pytanie ABC 8).
- **Żywność:** PRZED jest dodatnia w seedzie 4242 (+24) i ujemna w seedzie 7 (−8, już dziś). REKOMENDOWANY daje −9 do −32 (seed 4242) i −14 do −20 (seed 7) w t150. Przy spichlerzu 2851 (seed 4242, cap 5000) wyczerpanie zajmuje ok. 89–317 tur; przy 992 (seed 7) ok. 49–69 tur (PRZED ok. 124). Wariant MOCNY (−120 do −212 w seedzie 4242) wyczerpuje spichlerz w ok. 13–24 tur — odpada.
- **Tempo rozwoju w t30–t60 (Brąz vs Żelazo):** model nie zmienia stanu wzrostu (brak sprzężenia zwrotnego). Czy gracz „zdycha” w t30–t60: **NIE_ZMIERZONO** — model nie przewiduje spadku populacji.

### Ograniczenia modelu statycznego

- Brak sprzężenia zwrotnego: mniej żywności → mniej wzrostu populacji → inne racje i saldo. Model liczy saldo przy stałej populacji.
- Liczba ulepszeń: dwa estymatory (UPK, BRU) jako zakres; UPK = 0 przed t90 (`pracaUpkeep` pojawia się później).
- Miks jednostek: NIE_ZMIERZONO; model daje dwa warianty (4 i 8 żywności/jedn.). Epoka 3 jednostek (16/jedn.) nie jest liczona, bo projekcja zakłada brak nowych jednostek.
- Produkcja żywności nie jest modelowana osobno — `prodFood` jest odtworzona z pomiaru przy założonym zużyciu wojska, więc zmiana miksu przesuwa wynik wojska, a nie produkcji.
- Bonus `bm` jest dodawany zarówno do żywności, jak i do Pracy dla tej samej liczby ulepszeń (`UDZIAL_ZYWN` = 0,5 NIE_ZMIERZONO) — możliwe podwójne liczenie.
- Lasy w Drewnie (15/hex) nie są wydzielone: wrażliwość Drewna na mnożnik ulepszeń jest górną granicą.
- Cap spichlerza nie jest modelowany (w seedzie 4242 cap rośnie 1000 → 3000 → 5000, a stan w t90 jest na capie).
- Epoka 3 i wyżej: wyłącznie projekcja; epoki 4–5: wynik kodu, nie pomiar (§0 pkt 8).

### KOLEJNY KROK — bieg weryfikacyjny w żywej grze

Wariant REKOMENDOWANY za flagą danych (np. `econ-params.json` → `era_rebalance.enabled`, domyślnie false), runner econ z FALI 846/855, seed 4242 i 7, 150 tur, OFF vs ON, z odczytem `hud.surowceTyp`, `spichlerzStan/Max`, `pracaUpkeep`, `utrzymanieJednostekSurowce`, a także miksu jednostek (zmierzy NIE_ZMIERZONO z §B). Bez budowy bundla w repo (`node ./node_modules/vite/bin/vite.js build --outDir <POZA repo>`). Dopiero po tym biegu — decyzja ABC o włączeniu i o produkcji żywności.

---

## E. Pytania ABC do właściciela (rekomendacja pierwsza)

1. **Ujście Drewna (seed 7: +594 do +725/turę).** A) koszt utrzymania/budowy w Drewnie — zbadać najpierw w biegu weryfikacyjnym (rekomendacja); B) cap magazynu Drewna; C) nic — akceptuję nadwyżkę.
2. **Tempo ulepszeń surowcowych.** A) REKOMENDOWANY: ×1,25 w Brązie, zamrożone w Żelazie (Tartak 63); B) OSTROŻNY: ×1,25 bez zamrożenia; C) MOCNY: ×1,0 (stałe 50, ryzyko głodu).
3. **Żywność wojska.** A) uF ×1,25 w Brązie, zamrożone (rekomendacja); B) ×1,5 w Brązie; C) bez zmiany.
4. **Racje obywateli.** A) step 0,6 (rekomendacja: m = 1,6 w Brązie, 2,2 w Żelazie); B) 0,75; C) 1,0.
5. **P0 — upkeep Pracy ulepszeń żywnościowych.** A) zostawić wartość i zakres, opisać w `econ-params` (rekomendacja); B) zwolnić ulepszenia żywnościowe z utrzymania Pracy.
6. **Zaokrąglenie bonusów.** Rekomendacja: brak zaokrągleń — bonus całkowity na ulepszenie (`base + min(e−1, 1)`), bez zmiany w Brązie. Alternatywy (`Math.floor`, zaokrąglenie w górę) obcinają farmę w Brązie i są odrzucone.
7. **Bieg weryfikacyjny w żywej grze przed decyzją.** A) TAK, flaga OFF (rekomendacja); B) nie, wdrożyć od razu.
8. **Ujście Pracy (cuda).** Zapas 20 454 rośnie o ok. 250/turę w każdym wariancie. A) zostawić bez ujścia do osobnej decyzji (rekomendacja tej rundy: nie blokuje propozycji); B) cap zapasu Pracy; C) ujście cudami.
9. **Produkcja żywności (warunek REKOMENDOWANEGO).** Wariant REKOMENDOWANY daje żywność ujemną w obu seedach (§D). A) równoległy temat produkcji żywności przed wdrożeniem (rekomendacja); B) akceptuję wyczerpanie spichlerza w ok. 30–90 tur; C) zmniejszyć zmianę racji (step 0,5 — dziś).
10. **Epoki 4–5 w kodzie.** Surowce i bonusy ulepszeń wracają do bazy w epoce 4–5, a utrzymanie Pracy rośnie. A) poprawka kodu: zamrożenie na wartości epoki 3 (rekomendacja, do osobnego tematu); B) potwierdzić, że epoki 4–5 nie są osiągalne; C) zostawić.

---

## F. Odpowiedź na zarzuty recenzji (runda 2)

Zarzuty i ich rozstrzygnięcie są w `dyspozycje/autobot/runs/R-WEB-ECONOMY-ERA-REBALANCE-PROPOSAL-Q1/30-obrona-claude.md`. Kluczowe zmiany w tej wersji: bonus całkowity bez `floor` (Brąz bez obcięcia), racje w Żelazie 2,2 zamiast „zamrożenia”, miks jednostek 4/8 zamiast jednej bazy, dwa estymatory liczby ulepszeń, korekta spichlerza i tabela epok 1–5 z uwagą o kodzie.

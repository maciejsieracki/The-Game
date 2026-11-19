# Rebalans ekonomii wg epok — propozycja (R-WEB-ECONOMY-ERA-REBALANCE-PROPOSAL-Q1)

Status: PROPOZYCJA do decyzji właściciela. Zero zmian w `gra/src/**` i `gra/data/**`.
Baza kodu: origin/main, kandydat `8d2cb32b6`. Dane pomiaru: `/tmp/econ-final/seed{4242,7}.jsonl` (150 tur, owner 0).
Model: `gra/tools/econ-rebalance-model.cjs` (statyczny, bez sprzężenia zwrotnego).

Legenda: **NIE_ZMIERZONO** = pomiar tego nie podaje; wartość przyjęta jako założenie (podane wprost).

---

## 0. Najważniejsze ustalenia

1. **Przychody z ulepszeń rosną z epoką na DWÓCH różnych zasadach.** Surowce: ×1,5 za epokę (mnożnik, składa się). Żywność/Praca/Handel/Pieniądz: +1 za epokę (addytywnie). Tartak: 50 → 75 (Brąz) → 113 (Żelazo). Farma: 3 → 4 → 5. Relatywnie najmocniej rośnie surowiec.
2. **Jednostki zjadają żywność mocniej, niż sugeruje tabela `units.json`.** Baza `żywność/turę` = 1, ale skala epoki *jednostki* (Kamień ×1, Brąz ×2, Żelazo ×4) i stała R_STAWKI ×4 dają: **4 / 8 / 16 żywności na jednostkę na turę** (marsz, własne terytorium). Obóz ×0,5, poza terytorium ×2. Mnożnik epoki *właściciela* na zużycie wojska **nie istnieje** — wojsko skaluje się tylko epoką jednostki.
3. **Żywność obywateli: m(e) = 1 + 0,5·(e−1)** (1 / 1,5 / 2). Przy poziomie racji 1 (2 żywn./os.) = 2 / 3 / 4 na obywatela na turę.
4. **Drewno nie przestaje rosnąć przy samych zmianach przychodów.** Seed 7: +725/turę netto w t150 (brutto 760). Nawet wariant MOCNY daje +463/turę. Potrzebny jest osobny ujście Drewna (patrz pytanie ABC 1). Uwaga: brutto Drewna zawiera lasy (nakładka Las = 15 Drewna/hex, NIE ulepszenie), więc wrażliwość Drewna na mnożnik ulepszeń jest **górną granicą** (NIE_ZMIERZONO udział lasów).
5. **P0 rozstrzygnięte:** utrzymanie Pracy ulepszeń = wartość z `econ-params.json` (1) × mnożnik epoki **z kodu** (×1 / ×2 / ×4), liczone dla **wszystkich** ulepszeń poza wycinką — także żywnościowych (farma, irygacja, bydło, owce, lama, tarasy, łodzie), drogi, posterunek i fort. Nazwa klucza („surowcowe") jest węższa niż zakres. Rekomendacja: wartość bez zmian, zakres zostawić jak jest, ale opisać w JSON (pytanie ABC 5).
6. **Pomiar jest cały w epoce 2 (Brąz).** Wszystko, co dotyczy Żelaza, to **projekcja statyczna**, nie pomiar.

---

## A. Przychody z ulepszeń per epoka (kod + dane)

Źródła: `gra/data/terrain-improvements.json` (bazy), `gra/src/game/terrain-improvements.ts`:
`improvementYieldForEra` (addytywnie `base + (era−1)` dla zywnosc/praca/handel/pieniadz), `resourceProductionAmountForEra` (`round(base × 1,5^(era−1))`, linia ~335–342), `TERRITORY_YIELD_IMPROVEMENTS` (9 typów surowcowych).

| Ulepszenie | Baza (epoka 1) | Epoka 2 (Brąz) | Epoka 3 (Żelazo) | Zasada |
|---|---|---|---|---|
| Farma | żyw 3 / prac 3 / handel 3 | 4 / 4 / 4 | 5 / 5 / 5 | +1 addytywnie |
| Irygacja | żyw 5 / prac 2 / handel 2 | 6 / 3 / 3 | 7 / 4 / 4 | +1 addytywnie |
| Bydło | żyw 2 / prac 4 / handel 3 | 3 / 5 / 4 | 4 / 6 / 5 | +1 addytywnie |
| Owce / Lama | żyw 1 / prac 2–3 / handel 2–3 | +1 każde | +2 każde | +1 addytywnie |
| Tarasy (epoka 2) | żyw 3 / prac 2 / handel 2 | 4 / 3 / 3 | 5 / 4 / 4 | +1 addytywnie |
| Łodzie rybackie | żyw 6 / prac 6 / handel 6 | 7 / 7 / 7 | 8 / 8 / 8 | +1 addytywnie |
| Tartak → **Drewno** | prac 3 / handel 3 | **50 → 75** | **113** | ×1,5 / epokę |
| Kamieniołom → **Kamień** | prac 1 / handel 2 | **50 → 75** | **113** | ×1,5 / epokę |
| Glinianka → **Glina** (ep. 2) | prac 1 / handel 2 | **75** | **113** | ×1,5 / epokę |
| Kopalnia miedzi / żelaza / cyny → **Ruda** | prac 2 / handel 5 | 30 | 45 | ×1,5 / epokę |
| Warzelnia soli → **Sól** (ep. 2) | żyw 1 / prac 1 / handel 3 | 75 | 113 | ×1,5 / epokę |
| Stadnina → **Koń** (ep. 2) | prac 2 / handel 2 | 38 | 56 | ×1,5 / epokę |
| Kopalnia złota → **Złoto** | prac 2 / handel 10 | 2 | 2 | ×1,5 (zaokrąglenie) |

Uwagi: (a) `surowiecOdblokowany`/`epoka` w JSON to epoka odblokowania; skala używa **aktualnej epoki właściciela**. (b) Bonusy zapisane w JSON jako liczby całkowite, skala addytywna daje wartości całkowite, więc nie ma zaokrągleń (w propozycji B wymaga to decyzji — niżej).

**Wkład ulepszeń w brutto (pomiar, owner 0, t150):**

| Seed | Drewno brutto | Glina brutto | Kamień brutto | Ceramika brutto | Liczba ulepszeń (szac., dolna gr.) |
|---|---|---|---|---|---|
| 4242 (10 miast) | 260 | 406 | 2 | 150 | ~11 (= brutto surowcowe / 75) |
| 7 (2 miasta) | 760 | 14 | 304 | 100 (+ Cegła 450) | ~16 |

NIE_ZMIERZONO: liczba i rodzaj ulepszeń per tura (pomiar nie zapisuje mapy; `state.json` jest pusty). Udział wzrostu z epoki vs z liczby ulepszeń — **NIE_ZMIERZONO**, bo epoka pozostała 2 przez cały bieg.

**Które mnożniki dają „stałość"?** Addytywne +1/epokę dla żywności/pracy/handlu rośnie względnie wolno (farma +33% z Brązu, +67% z Żelaza) — to jest blisko intencji właściciela. **Mnożnik ×1,5 dla surowców rośnie szybko** (Drewno +50%, potem +50%) i to on jest sprzeczny z intencją „stałości". Wniosek: intencja właściciela pasuje do żywności/pracy, nie do surowców.

---

## B. Koszty

**(1) Utrzymanie budynków/ulepszeń (Praca):** `computePracaUpkeepByOwner` (turn-economy.ts ~l.991–1019): `round(1 × mnożnik)` za każde ulepszenie = **1 / 2 / 4 Pracy na ulepszenie** (Kamień / Brąz / Żelazo). Pomiar: seed 7 `pracaUpkeep` = 36 (2 miasta, ~18 ulepszeń × 2); seed 4242 = 10 (10 miast, ~5 ulepszeń × 2). Utrzymanie w Pieniądzu/Surowcach budynków: `utrzymanieBudynkowSurowce` = {} w pomiarze (nie jest zużywane).

**(2) Utrzymanie jednostek:**
- Surowiec: `units.json` „Utrzymanie surowiec (ilość)" — Wojownik Drewno 3, Procarz Drewno 5, Włócznik Brąz 5 (bez skali epoki). Pomiar: `utrzymanieJednostekSurowce.drewno` = 165 przy 55 jednostkach (seed 4242 t90) ⇒ ~3 Drewna/jednostkę. Potwierdzone.
- Pieniądz: pomiar 4 na jednostkę (`utrzymanieJednostekPieniadz` 220/55).
- **Żywność: TAK, zużywają.** Patrz §0 pkt 2. Źródło: `unitFoodPerTurn` (`economy-upkeep.ts` ~l.1153), `buildUnitFoodTable` (skala `scaleCostByEpoch` wg epoki jednostki), `R_STAWKI_FALA1_FALA2_MULT = 4` (`r-stawki-strojenie.ts`), `main.ts` ~l.2107.

**(3) Żywność obywateli** (`population-growth-v85.ts` `computeCityRationCost`, `citizen-consumption-era.ts`): `racje/os. = poziom × 2 × m(e)`. Poziom racji w pomiarze **NIE_ZMIERZONO** (przyjęto poziom 1).
Pomiar (owner 0, Brąz, m=1,5): seed 4242 t150: 50 os. × 3 = **150/turę**; seed 7 t150: 2 × 3 = **6/turę**.

**Zużycie żywności przez wojsko (pomiar vs model):** seed 4242 t90, 55 jednostek ⇒ przy typie Brąz (baza 2 × ×4) ⇒ **440/turę** (marsz) lub 220 (obóz). Spichlerz osiągnął cap 1000 już w t90, więc realne zużycie jest **niższe lub produkcja wyższa** — udział obozowania **NIE_ZMIERZONO**.

---

## C. Propozycja konkretna (liczby, pliki, fazowanie)

Zasada fazowania: **Brąz (epoka 2)** = zmiany wchodzące teraz; **Żelazo (epoka 3)** = zamrożenie wzrostu (wartości na poziomie Brązu) albo dalsze, mniejsze kroki.

### (i) Przychody z ulepszeń — stałość

| Pozycja | Plik / funkcja | Obecnie | Ostrożny | Średni | Mocny |
|---|---|---|---|---|---|
| Surowce: mnożnik za epokę | `terrain-improvements.ts` `resourceProductionAmountForEra` (`1.5`) | ×1,5 | ×1,25 (Brąz 63, Żelazo 78) | ×1,25 w Brązie, **zamrożone w Żelazie** (Żelazo = 63) | ×1,0 (stałe 50) |
| Żywność/praca/handel: dodatek za epokę | `improvementYieldForEra` (`base + (era−1)`) | +1 / epokę | +0,5 / epokę | +0,5 w Brązie, **zamrożone w Żelazie** | 0 |

**REKOMENDACJA (i):** wariant **Średni** — Brąz wchodzi teraz (surowce ×1,25, bonusy +0,5), Żelazo nie rośnie ponad poziom Brązu. Przy bonusach całkowitych: `Math.floor(base + 0,5·(e−1))` — w Brązie farma i tak zostaje 3 (bez zmiany), w Żelazie 4 zamiast 5. **Ta zmiana w Brązie jest wizualnie prawie niewidoczna dla bonusów**, głównym efektem jest surowiec (75 → 63).

### (ii) Droższe jednostki (Drewno / Cegła / Brąz / Żelazo)
Mnożnik kosztu surowcowego jednostki per epoka właściciela: `units.json` + `scaleCostByEpoch`. Propozycja: **Drewno jednostki ×1,25 (średni), ×1,5 (mocny)**, bez zmian w Kamieniu. Plik: `economy-upkeep.ts` (skala utrzymania surowcem).

### (iii) Żywność obywateli — zmiana współczynnika 0,5
Plik: `citizen-consumption-era.ts` `CITIZEN_CONSUMPTION_ERA_STEP` (0,5).
- Ostrożny: 0,6 → m = 1 / **1,6** / **2,2**
- Średni: 0,75 → m = 1 / **1,75** / **2,5**
- Mocny: 1,0 → m = 1 / **2** / **3**

**REKOMENDACJA (iii): 0,6** (ostrożny) — mała zmiana, prosta do cofnięcia.

### (iv) Żywność wojska — nowy mnożnik właściciela
Plik: `economy-upkeep.ts` `unitFoodPerTurn` (nowe `uF(e)`), wywoływane z `militaryFoodConsumptionWithSpichlerz`.
- Ostrożny: uF = 1 + 0,25·(e−1): Brąz ×1,25, Żelazo ×1,5
- Średni: uF = 1 + 0,5·(e−1): Brąz ×1,5, Żelazo ×2
- Mocny: uF = 1 + 1,0·(e−1): Brąz ×2, Żelazo ×3

**REKOMENDACJA (iv): ×1,25 w Brązie, zamrożone na tym poziomie w Żelazie** (tj. `uF = 1 + 0,25·min(e−1, 1)`). Żelazo i tak podwaja bazę jednostki (×4 vs ×2 w Brązie), więc dalszy wzrost jest zbędny i nie do udźwignięcia — patrz §D.

### (v) Utrzymanie budynków (Praca)
Bez zmiany wartości (patrz P0). Mnożnik epoki ×1/×2/×4 zostaje. **Nie proponuję zmiany w tej rundzie** — model nie pokazuje presji Pracy (różnice <5%).

### (vi) Ujście Pracy (cuda) — NIE jest potrzebne w tej rundzie
Praca netto w modelu: 250–260/turę (seed 4242) we wszystkich wariantach. Praca nie jest wąskim gardłem; zostaje do rozstrzygnięcia tylko, czy zapas Pracy ma mieć cap (decyzja ABC, nie model).

### Rozstrzygnięcie P0
Kod vs econ-params: **wartość zgodna (1)**; mnożnik epoki (×1/×2/×4) siedzi **tylko w kodzie** (`terrainImprovementEraMultiplier`, `terrain-improvements.ts` l.128–142); zakres obejmuje **wszystkie** ulepszenia poza wycinką. Rekomendacja: zostawić wartość, przenieść mnożniki epoki do `econ-params.json` albo opisać w `_meta` — **bez zmiany zachowania**.

### Propozycja zbiorcza — REKOMENDOWANY (liczby z modelu)
Brąz: surowce ×1,25, bonus +0,5 (floor), racje step 0,6, uF 1,25, Drewno jednostek bez zmian. Żelazo: wszystko zamrożone na poziomie Brązu.

---

## D. PRZED / PO na przykładzie pomiaru (model statyczny)

Uruchomienie: `node gra/tools/econ-rebalance-model.cjs /tmp/econ-final` (pełna tabela: t30/60/90/120/150, Brąz i Żelazo-projekcja, wszystkie warianty). Wartości za turę.

**Seed 4242 (10 miast, 50 obywateli, 23 jednostki w t150)**

| Tura / epoka | Wariant | Drewno netto | Praca netto | Żywność netto | Racje | Wojsko |
|---|---|---|---|---|---|---|
| t60 Brąz | PRZED | 0 | 79 | +14 | 42 | 40 |
| t60 Brąz | REKOMENDOWANY | −5 | 78 | +0,5 | 45 | 50 |
| t60 Żelazo (proj.) | PRZED | +15 | 80 | +1 | 56 | 40 |
| t60 Żelazo (proj.) | REKOMENDOWANY | −5 | 78 | −16 | 62 | 50 |
| t150 Brąz | PRZED | +150 | 254 | +24 | 150 | 184 |
| t150 Brąz | REKOMENDOWANY | +107 | 251 | −35 | 160 | 230 |
| t150 Żelazo (proj.) | PRZED | +280 | 260 | −21 | 200 | 184 |
| t150 Żelazo (proj.) | REKOMENDOWANY | +107 | 251 | −95 | 220 | 230 |
| t150 Brąz | MOCNY | +30 | 249 | −216 | 200 | 368 |

**Seed 7 (2 miasta, 2 obywateli, 6 jednostek w t150)**

| Tura / epoka | Wariant | Drewno netto | Praca netto | Żywność netto | Racje | Wojsko |
|---|---|---|---|---|---|---|
| t60 Brąz | PRZED | −2 | 5 | −4 | 3 | 16 |
| t60 Brąz | REKOMENDOWANY | −3 | 5 | −8 | 3 | 20 |
| t150 Brąz | PRZED | +725 | −15 | −8 | 6 | 48 |
| t150 Brąz | REKOMENDOWANY | +598 | −19 | −24 | 6 | 60 |
| t150 Żelazo (proj.) | PRZED | +1105 | −7 | −2 | 8 | 48 |
| t150 Żelazo (proj.) | REKOMENDOWANY | +598 | −19 | −27 | 9 | 60 |
| t150 Brąz | MOCNY | +463 | −23 | −66 | 8 | 96 |

**Wnioski z modelu:**
- **Drewno (seed 7) nadal rośnie** we wszystkich wariantach (+463 do +725/turę). Zmiany przychodów go nie zatrzymują — potrzebne ujście (pytanie ABC 1). Praca w seed 7 jest ujemna (dodatnie utrzymanie ulepszeń), więc nie rośnie.
- **Praca (seed 4242) nie rośnie „w nieskończoność" z powodu tych zmian** — jest stabilna ~250/turę w każdym wariancie; decyzja o capie zapasu Pracy jest osobna.
- **Żywność jest dodatnia tylko w PRZED** (seed 4242 t150: +24; seed 7: −8 — ujemna już dziś, stan spichlerza 992 wystarcza na ok. 120 tur). **REKOMENDOWANY daje −35 (seed 4242) i −24 (seed 7)**: spichlerz 2851 / 992 wystarcza na ok. 80 / 40 tur — to wymaga osobnej decyzji o produkcji żywności (NIE_ZMIERZONO, jaki wariant produkcji). W MOCNYM (−216 w seed 4242) spichlerz wyczerpuje się w ok. 13 tur — **wariant mocny odpada**.
- **Tempo rozwoju w t30–t60 (Brąz vs Żelazo):** model nie zmienia w tym oknie stanu wzrostu (brak sprzężenia zwrotnego). W Żelazie projekcja PRZED daje wzrost surowców ×1,5 (Drewno seed 7: +725 → +1105), wariant zamrożony utrzymuje poziom Brązu. Czy gracz „zdycha" w t30–t60: **NIE_ZMIERZONO** — model nie przewiduje spadku populacji.

### Ograniczenia modelu statycznego
- Brak sprzężenia zwrotnego: mniej żywności → mniej wzrostu populacji → mniej racji → inne saldo. Model liczy saldo przy stałej populacji.
- Liczba ulepszeń i ich mix: NIE_ZMIERZONO (N_imp = brutto/75, dolna granica dla surowców; udział żywności = założenie 0,5).
- Udział obozowania jednostek (×0,5) i poziom racji: NIE_ZMIERZONO (przyjęto marsz i poziom 1 — gorna granica zużycia).
- Lasy w Drewnie (15/hex) nie są wydzielone: wrażliwość Drewna na mnożnik ulepszeń jest górną granicą.
- Epoka 3: wyłącznie projekcja, pomiar w epoce 2.

### KOLEJNY KROK — bieg weryfikacyjny w żywej grze
Wariant REKOMENDOWANY za flagą danych (np. `econ-params.json` → `era_rebalance.enabled`, domyślnie false), runner econ z FALI 846/855, seed 4242 i 7, 150 tur, OFF vs ON, z odczytem `hud.surowceTyp`, `spichlerz`, `praca`, `utrzymanieJednostekSurowce`. Bez budowy bundla w repo (`node ./node_modules/vite/bin/vite.js build --outDir <POZA repo>`). Dopiero po tym biegu — decyzja ABC o włączeniu.

---

## E. Pytania ABC do właściciela (rekomendacja pierwsza)

1. **Ujście Drewna (seed 7: +725/turę).** A) wprowadzić koszt budowy/utrzymania w Drewnie (rekomendacja: zbadać najpierw w biegu weryfikacyjnym); B) cap magazynu Drewna; C) nic — akceptuję nadwyżkę.
2. **Tempo ulepszeń surowcowych.** A) REKOMENDOWANY: ×1,25 w Brązie, zamrożone w Żelazie; B) OSTROŻNY: ×1,25 bez zamrożenia; C) MOCNY: ×1,0 (stałe 50, ryzyko głodu).
3. **Żywność wojska.** A) uF ×1,25 w Brązie, zamrożone (rekomendacja); B) ×1,5 w Brązie; C) bez zmiany.
4. **Racje obywateli.** A) step 0,6 (rekomendacja: m = 1 / 1,6 / 2,2); B) 0,75; C) 1,0.
5. **P0 — upkeep Pracy ulepszeń żywnościowych.** A) zostawić wartość i zakres, opisać w `econ-params` (rekomendacja); B) zwolnić ulepszenia żywnościowe z utrzymania Pracy.
6. **Zaokrąglenie bonusów (+0,5/epokę).** A) `Math.floor` (rekomendacja: w Brązie bez zmiany bonusów); B) zaokrąglenie w górę; C) wartości ułamkowe (wymaga zmian w UI).
7. **Bieg weryfikacyjny w żywej grze przed decyzją.** A) TAK, flaga OFF (rekomendacja); B) nie, wdrożyć od razu.

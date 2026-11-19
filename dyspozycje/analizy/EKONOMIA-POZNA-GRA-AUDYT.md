# Audyt: wzrost produkcji i zasobów w późnej grze (R-WEB-ECONOMY-LATE-GAME-RESOURCE-GROWTH-AUDIT-Q1)

Status: runda 2/5, Operator (HAIKU 5.5), obrona po FAIL Evaluatora (`e2ae332014b4096f6ab64fd100b805d5bd50ad5f`). Tylko analiza; bez zmian w `gra/src/**`, `gra/data/**`, balansie.
Baza: origin/main `0c3fa0747abc9b9776c082259c2c4378dd2fd6a0`.
Dowody (wyniki skryptów, nie z pamięci): `runs/R-WEB-ECONOMY-LATE-GAME-RESOURCE-GROWTH-AUDIT-Q1/evidence/analiza-jsonl.txt` (`gra/tools/econ-growth-analyze.cjs`) i `.../model-produkcji.txt` (`gra/tools/econ-growth-model.cjs`).

## 0. Odpowiedź na pytanie właściciela (krótko)

- **Produkcja** (cegła, żelazo, ceramika) rośnie w epoce **liniowo**, m(e) = 1+0,5(e−1), i w liczbie miast. Dla imperium z pomiaru AI żelazo rośnie e1→e4 ×9,5 = ×3,8 (miasta; udział w skali ln 59%) × ×2,5 (epoka; 41%). Patrz §2.
- **Jedyny czynnik wykładniczy** to **sufit zapasów**: cap surowców państwa i cap żywności Spichlerza mają mnożnik **2^(e−1)**, czyli ×2 co epokę (`economy-upkeep.ts:391-394,457`; `empire-food.ts:190-193`). Cap nie jest sinkiem; tylko podnosi górną granicę magazynu. Sufit żelaza: 50 000 w epoce 1, 400 000 w epoce 4 (przy 0 Magazynach). Patrz §3.
- **Główna luka:** model per typowe miasto daje dla imperium N=16,3 (e4) ~11,7 tys. surowców na turę (cegła + żelazo + ceramika), a zrzut HUD właściciela pokazuje „Surowce +153,1k/turę brutto”. Różnica ~10× jest **NIEWYJAŚNIONA**, a gracz **NIE ZMIERZONO**. Bez wyjaśnienia nie wolno wybierać wariantu balansu.

## 1. Krzywe wzrostu (AI: średnia / mediana / max na właściciela z miastem)

Źródło: `evidence/analiza-jsonl.txt` (analizator po poprawce oznacza tury poza zakresem pliku jako NIEZMIERZONO). Dane kończą się na t76 (seed4242, war-out seed7) i t80 (seed777). **Tury 100/125/150: NIEZMIERZONO**. Poprzednia wersja powtarzała t76/t80 w tych wierszach; to było mylące i zostało usunięte.

| Tura | n (AI) | Skarbiec mean / med / max (seed4242) | Skarbiec mean / med / max (seed777) | Spichlerz mean / max (seed4242) | Utrzymanie budynków Pieniądz mean (seed4242) | Utrzymanie jednostek Pieniądz mean (seed4242) | Miasta mean |
|---|---|---|---|---|---|---|---|
| 10 | 41 | 48,8 / 8 / 254 | 51,7 / 22 / 323 | 4,4 / 15 | 0,2 | 4,2 | 1,0 |
| 25 | 15 | 157,4 / 53 / 622 | 120,9 / 45 / 986 | 9,9 / 44 | 20,4 | 12,0 | 4,3 |
| 50 | 15 | 1 437 / 392 / 4 962 | 1 647 / 1 382 / 5 714 | 3 994 / 14 130 | 370 | 112 | 11,9 |
| 75 | 14 (seed777: 15) | 9 006 / 8 707 / 22 453 | 9 038 / 6 768 / 25 435 | 45 061 / 85 000 | 1 482 | 560 | 16,3 |
| 100 / 125 / 150 | NIEZMIERZONO | NIEZMIERZONO | NIEZMIERZONO | NIEZMIERZONO | NIEZMIERZONO | NIEZMIERZONO | NIEZMIERZONO |

Tempo wzrostu (średnia skarbca, seed4242): t25→t50 ×9,1; t50→t75 ×6,3. Mediana (seed777) t50→t75 ×4,9.
Dwa okna po 25 turach dają k ≈ 3,2 i ≈ 4,5 (wykładnik potęgowy). Wykładnik rośnie, czyli wzrost przyspiesza. Z dwóch punktów nie wnioskuję o kształcie krzywej. Wcześniejsze zdanie „wielomianowy, nie wykładniczy” było za mocne i jest wycofane. Dane t100+ są potrzebne do rozstrzygnięcia.

Spichlerz (żywność): max 85 000 (seed4242, t75) i 95 000 (seed777, t80). Są zgodne z capem żywności z §3. Nie wiem, ile Spichlerzy mają ci właściciele, więc to zgodność z formułą, nie dowód.

Zapasy surowców per typ (żelazo, brąz, cegła, drewno, kamień, ceramika) oraz przychód na turę (Skarb, Praca, Nauka PN): **NIEZMIERZONO** w jsonl. Wymagają rozszerzenia haka pomiarowego (osobny temat).

Utrzymanie (AI, t75, seed4242): budynki Pieniądz średnio 1 482 (max 4 586); jednostki Pieniądz średnio 560 (max 1 392); surowce: budynki średnio 854, jednostki 346. Przychodu AI na turę nie mam, więc nie podaję ułamka przychodu.

**Gracz: NIE ZMIERZONO.** Harness mierzy tylko AI (`gra/tools/ai-economy-measure-README.md`).

## 2. Dekompozycja źródeł (plik:linia)

| Czynnik | Źródło | Sposób łączenia |
|---|---|---|
| Mnożnik epoki m(e) = 1+0,5(e−1) (×1/1,5/2/2,5/3) | `citizen-consumption-era.ts:19,24`; `converters.ts` `converterThroughputForEra` (Odlewnie żelaza) | **liniowo** w epoce |
| Odlewnia żelaza: baza 50 × m(e) | `converters.ts` `converterThroughputForEra` | liniowo |
| Cegielnia: cykle 50/75/100 wg epoki | `econ-params.json` `budynek_cegielnia_*`; `throughputEraParamKeys` | tabela (cykle nie są mnożnikiem) |
| Cegielnia: mnożnik wyjścia 1+0,5(e−1) | `converters.ts:171-194` (`CONVERTER_OUTPUT_ERA_PCT_BY_RECIPE`, `converterOutputMultiplierForEra`) | **mnoży** cykle × wyjście; liniowo w e |
| Garncarnia 30/50/70/90/110 cykli | `econ-params.json` `budynek_garncarnia_*` | tabela, +20 na epokę |
| Huta brązu 50 (e2), 75 (e3+) | `econ-params.json` `budynek_huta_braz_*` | tabela |
| Stolarnia / Warsztat +10% za sztukę (civ-wide) | `econ-params.json` (drewno, kamień) | **addytywnie** między budynkami |
| Magazyn +20% bazy na cap państwa | `economy-upkeep.ts:457` | **addytywnie** między Magazynami |
| Mnożnik capu 2^(e−1) | `economy-upkeep.ts:391-394` (`magazynEraMultiplier`) | **składany** (×2 na epokę), tylko w sufit |
| Liczba miast | pomiar AI: 4,3 (t25) → 11,9 (t50) → 16,3 (t75) | **mnożąco** (każde miasto produkuje) |
| Wariant składany produkcji (compound) | `converters.ts:127-136` (komentarz; odrzucony) | nieużyty |

Model (`gra/tools/econ-growth-model.cjs`). Założenie: 1 Cegielnia + 1 Garncarnia + 1 Odlewnia żelaza na miasto. Liczby wyprowadzone z kodu, nie z pomiaru budynków.

| Epoka | m(e) | Cegła/t na miasto | Żelazo/t na miasto | Ceramika/t na miasto |
|---|---|---|---|---|
| 1 | 1 | 100 | 50 | 30 |
| 3 | 2 | 400 | 100 | 70 |
| 5 | 3 | 600 | 150 | 110 |

Imperium (N=16,3, e4): żelazo 2 037,5/t; cegła 8 150/t. Od (N=4,3; e1) do (N=16,3; e4) żelazo rośnie ×9,5 = ×3,8 (miasta) × ×2,5 (epoka). W skali ln: miasta 59%, epoka 41%. Cegła ×5 w epoce (cykle × wyjście).

Wniosek: produkcja to iloczyn czynników liniowych (miasta × epoka) z bonusami addytywnymi. Składany wykładniczo jest tylko sufit (§3).

## 3. Sinki i ograniczniki

**Sufit (cap) surowców państwa, per typ:** `cap = magazyn_baza_surowce × (1 + 0,2 × Magazyny) × 2^(e−1)`, e = epoka właściciela.
- Dowód: `economy-upkeep.ts:391-394` (`magazynEraMultiplier(e) = 2^(e−1)`), `economy-upkeep.ts:457` (`ownerResourceCapacityPerType`), `econ-params.json` `magazyn_baza_surowce` (opis: epoka2 = 100 000, epoka3 = 200 000, zgodne z kodem).

| Epoka | mnożnik 2^(e−1) | cap, 0 Magazynów | cap, 5 Magazynów |
|---|---|---|---|
| 1 | 1 | 50 000 | 100 000 |
| 2 | 2 | 100 000 | 200 000 |
| 3 | 4 | 200 000 | 400 000 |
| 4 | 8 | 400 000 | 800 000 |
| 5 | 16 | 800 000 | 1 600 000 |

Poprzednie stwierdzenie „mnożnik epoki NIEZMIERZONY” było błędem: mnożnik jest w kodzie (`economy-upkeep.ts:391-394`). Cap jest jedynym czynnikiem wykładniczym po stronie zapasów. Rośnie ×2 co epokę właściciela (parytet AI).

Czy gracz lub AI dobija do capu: **NIEZMIERZONO** (brak zapasów surowców w jsonl). Model: żelazo imperium N=16,3, e4, to 2 037,5/t, a cap 0 Magazynów = 400 000, czyli ~196 tur produkcji bez zużycia. Cap może być dobijany dopiero przy dużym zużyciu lub przy wielu Magazynach. To wymaga pomiaru.

**Sufit żywności (Spichlerz):** `cap = centralCapBaza (1000, płaska) + Σ(Spichlerz I × 1000 + Spichlerz II × 1500) × 2^(e−1)`.
- Dowód: `empire-food.ts:190-193` (`computeCentralFoodCap`), `empire-food.ts:124-126` (`centralCapBaza` z `magazyn_centralny_baza_zywnosc` = 1000), `building-resource-gate.ts:551-552` (`SPICHLERZ_EMPIRE_CAP_I/II_FULL`).
- Max 85 000 (seed4242, t75) i 95 000 (seed777, t80) są zgodne z tą formułą. Przykład: e4, 6×I + 3×II daje 1000 + 10 500×8 = 85 000. To zgodność z formułą, nie pomiar liczby Spichlerzy.

**Utrzymanie budynków:** stała na budynek, z mnożnikiem wg epoki WEJŚCIA budynku (×1 kamień, ×2 brąz, ×4 żelazo i wyżej): `building-stock-cost.ts:34-40` (`epochCostMultiplier`), `economy-upkeep.ts:1121` (`scaleCostByEpoch`). Utrzymanie nie rośnie w czasie gry ani z liczbą miast. Zdanie „utrzymanie nie skaluje się z zasobami” jest prawdziwe tylko w tym sensie (stała na budynek). Wcześniej podane bez dowodu zdanie w tej formie jest wycofane.

**Utrzymanie jednostek i obywateli:** racje żywności ×m(e) (`citizen-consumption-era.ts`); utrzymanie surowcami w `citizen-resource-upkeep.json` i `ai-upkeep-params.json`. Nie przeglądałem tych plików liczbowo.

**Czego brakuje w późnej grze:**
- Sinka rosnącego z liczbą miast (koszt administracji imperium): nie znaleziono w `economy-upkeep.ts` ani w `econ-params.json`.
- Wzrostu cen zakupu z epoką lub liczbą miast: grep `inflac` w `gra/src` nie trafia w ceny budowy (trafia w dyplomację i handel). To wymaga osobnego przeglądu.

## 4. Propozycje (nie wdrożone)

Skarbiec t100/t150 jest **NIEZMIERZONY** we wszystkich wariantach (brak przychodu na turę w danych), więc nie podaję liczb skarbca. Liczby poniżej są z modelu i z kodu.

| Wariant | Parametry do zmiany | Wpływ liczbowy (model / kod) | Ryzyko balansu | Ryzyko zapisów | Tematy |
|---|---|---|---|---|---|
| **A. Spłaszczenie mnożników epok** | `CONVERTER_OUTPUT_ERA_PCT_BY_RECIPE.cegielnia` 0,50 → 0,25; `citizen-consumption-era` STEP 0,5 → 0,25 (najpierw rozdzielić klucze, bo STEP steruje też racjami żywności) | Żelazo e4 na miasto: m(4)=2,5 → 1,75, czyli 125 → 87,5/t (−30%). Cegła e4: 500 → 350/t (−30%) | Racje obywateli też spadają | niski (same wartości) | 1 |
| **B. Utrzymanie rosnące z liczbą miast** | `ai-upkeep-params.json` lub nowy mnożnik per miasto | Utrzymanie budynków AI t75 = 1 482/t (~91/miasto). Wzrost zależy od X, którego nie ma | Wpływ na armie AI (utrzymanie jednostek 560/t) | średni | 1–2 |
| **C. Niższa baza capu państwa** | `magazyn_baza_surowce` 50 000 → 20 000 (mnożnik 2^(e−1) zostaje) | Cap e4, 0 Magazynów: 400 000 → 160 000 (−60%). Cap e1: 50 000 → 20 000 | Może psuć budowę Magazynów i zapisy z przekroczonym capem | średni | 1 |
| **D. Nowy sink: administracja imperium** | nowy parametr w `econ-params.json`: Pieniądz/t = k × (miasta−1) × m(e), domyślnie k=0 | Przy N=16,3, e4: k × 15,3 × 2,5 = k × 38,25 Pieniądza/t. k=1 → 38/t (~2,6% utrzymania budynków AI t75); k=5 → 191/t (~13%); k=10 → 383/t (~26%). k do ustalenia | Nowa mechanika (UI) | niski (domyślnie 0) | 2 |
| **E. Bez zmian** | — | Wzrost tłumaczy liczba miast i epoka (§2). Cap rośnie ×2/epokę, ale nie potwierdzono, że go dobijamy | brak | brak | 0 |

Rekomendacja Operatora (decyzja właściciela, nie moja): najpierw wyjaśnić różnicę ~10× (model vs HUD) i rozszerzyć pomiar o przychód i zapasy surowców oraz o gracza. Dopiero potem A/B/C/D.

## 5. Pytania ABC do właściciela (decyzje liczbowe należą do Ciebie)

1. **Spłaszczenie epok (wariant A)?** A) tak: cegielnia 0,50 → 0,25 i m(e) 0,5 → 0,25 (−30% w epoce 4, także racje); B) tylko cegła (0,50 → 0,25); C) nie zmieniać. Rekomendacja: **A**, ale dopiero po pomiarze przychodu.
2. **Cap surowców (wariant C)?** A) obniżyć bazę 50 000 → 20 000 (e4: 400 000 → 160 000); B) zostawić mnożnik 2^(e−1) i dodać sink (D); C) zostawić. Rekomendacja: **B**, bo nie wiadomo, czy cap jest dobijany.
3. **Sink administracji imperium (wariant D)?** A) tak, nowy parametr k z domyślnym 0, wartość k po pomiarze; B) nie. Rekomendacja: **A**.
4. **Utrzymanie rosnące z miastami (wariant B)?** A) tak, +X% za miasto po 5; B) tylko po epoce; C) nie. Rekomendacja: **B**, po kalibracji.
5. **Pomiar gracza i przychodu przed balansem?** A) rozszerzyć harness o przychód na turę, Pracę, Naukę i zapasy surowców (osobny temat, bez zmian gry); B) bez pomiaru. Rekomendacja: **A**.

## 6. Ograniczenia tej analizy

- Liczby AI, nie gracza. Tury 100–150 nieobecne w danych (NIEZMIERZONO).
- Model zakłada 1 budynek każdego typu na miasto. Liczby budynków nie są zmierzone.
- Mapa tura→epoka nie jest w jsonl. Dekompozycja łączy N z t25 (e1) z N z t75 (e4), więc to przybliżenie, nie pomiar.
- Różnica model vs HUD gracza (~10×) jest NIEWYJAŚNIONA. Możliwe przyczyny do sprawdzenia: liczba budynków, Stolarnie/Warsztaty, handel, definicja „Surowce” w HUD.
- Cap żywności: zgodność z formułą, bez liczby Spichlerzy.

## 7. Wyjaśnienie HUD „Surowce +X / +Y” (R-WEB-ECONOMY-MEASURE-EXTEND-INCOME-STOCKS-Q1, baza 198e63685)

Źródło z kodu (odczyt, bez zmian gry):
- Suma chipu „Surowce” = `surowceBrutto` / `surowceNetto` w `gra/src/main.ts` (buildHudStateRaw, ok. l. 23862–23872), po wierszach `shortageRows` = `buildEmpireResourceRows(0)` z filtrem `cap != null && !placeholder` (gracz: `storedResourceRows`). Czyli suma po WSZYSTKICH magazynowanych surowcach imperium (13 typów: drewno, kamień, glina, ruda, cegła, brąz, żelazo, stal, ceramika, sól, koń, złoto itd.), a NIE po trzech (cegła, żelazo, ceramika) jak model `econ-growth-model.cjs`. Żywność jest osobnym chipem „Spichlerz”.
- Brutto na surowiec = `resourceGrossNetPerTurn` (`gra/src/game/resource-gross-net.ts`): produkcja + przychód z umów; netto = `ratePerTurn` − zużycie (obywatele + budynki + wojsko). Jednostka: sztuki na turę (zaokrąglone), nie PN.
- Skarbiec, Praca, Nauka, Handel, Spichlerz: pola `buildHudStateRaw` (`zlotoRate`, `pracaRate`, `naukaRate`, `handelIncome`, `zywnoscRate`, `zywnoscWplywMiast`); tylko gracz (singleton `player`).

Wyjaśnienie ~10×: strukturalne (HUD sumuje wszystkie magazynowane surowce, model trzy). Liczbowe potwierdzenie na pełnym biegu NIE ZMIERZONE w tej rundzie. Próbka t10 (seed 4242, 1 tura po starcie, katalog poza repo): suma HUD brutto wszystkich właścicieli = 991; suma trzech surowców modelu (cegła, żelazo, ceramika) = 0 (brak produkcji tych surowców w t10) — to nie jest jeszcze test proporcji.

## Bazowe liczby do pomysłów właściciela (inwentaryzacja danych; bez propozycji liczb)

Cuda (`gra/data/wonders.json`, pole `cuda`, 19 pozycji; koszt = `kosztBudowy`, jednostka kosztu NIE POTWIERDZONA w tej rundzie):
- Epoka 1 (Kamień): 2 cuda (piramidy 160 — wyłączny Egipt; wyrocznia 180 — wyścig, 15 cywilizacji).
- Epoka 2 (Brąz): 8 cudów, koszt 150–260.
- Epoka 3 (Żelazo): 9 cudów, koszt 140–320.
- Epoka 4+: 5 cudów „parkowanych” (`parkowane_epoka4plus`), poza listą aktywną.
- Unikatowość: 15 cudów wyłącznych (po 1 cywilizacji; Chińczycy mają 2), 3 cuda wyścigowe (wyrocznia, hamonga, brama_narodow) dostępne dla wszystkich 15 cywilizacji; max 1 cudu każdego typu na świecie.
- Porównanie koszt cudu z Pracą na turę (t75/t100/t150): NIE ZMIERZONE (brak biegów do t150 w tej rundzie). Próbka t10: średnia Praca/turę AI z miastem = 0,00 (41 AI).

Jednostki wojskowe (koszty i utrzymanie per typ), utrzymanie budynków per typ, udział wydatków Pracy (kolejki): NIE WYKONANO w tej rundzie (brak odczytu danych i biegu).

## 9. Pomiar gracza autopilot (2×150 tur) i propozycje

Ten punkt dotyczy wyłącznie gracza (owner 0, autopilot AI z FALI 855; odrzucanie ofert i akceptacja wymuszonego pokoju włączone). Zmiany gry: ŻADNE. Tabele co 10 tur: `dyspozycje/autobot/runs/R-WEB-ECONOMY-MEASURE-ANALYSIS-Q1/dowody/tabele-gracz-2x150.md`. Surowe dane: `/tmp/econ-final/` (seed 4242 i seed 7, wiersz co turę, pole `hud`).

Korekta po obronie (runda 2, odpowiedź na zarzuty Evaluatora): (a) cegła 450/t NIE jest anomalią: to wartość nominalna z HUD, a realny przyrost stanu wynosi ok. +21/t (9.3); (b) atrybucja upkeepu Pracy do konkretnych ulepszeń jest NIE ZMIERZONA (9.4); (c) cap Spichlerza wiąże od t95, a brak dowodu przepadania nadwyżki (9.5); (d) dodano klasyfikację tempa Spichlerza i Skarbca (9.2); (e) dodano wrażliwość propozycji 1 na 4242 (9.6, 9.7).

### 9.1 Ograniczenia
- Autopilot ≠ człowiek. Autopilot kończy z 6 budynkami (4242) i 6–9 (7); owner HUD „+153,1k” jest ~190× większy od 818 brutto autopilota. Nie da się z tego pomiaru wyjaśnić wartości właściciela.
- n = 2 ziarna. Wnioski są kierunkowe, nie statystyczne.
- Źródła rozbicia (territory vs. konwerter) NIE są rozdzielone w jsonl; rozbicie per surowiec jest z `hud.surowceTyp`.
- `surowceBrutto` z HUD dla przetwórstwa (cegła, ceramika, brąz) to wartość NOMINALNA (cykle × wyjście), nie realizowana. Porównanie z przyrostem stanu (Δstanu) w 9.3.

### 9.2 Tempo wzrostu (gracz)
| Wskaźnik | 4242 | 7 |
|---|---|---|
| Surowce brutto HUD (t50 / t100 / t150) | 381 / 794 / 818 | 14 / 1778 / 1878 |
| Miasta / pop (t150) | 10 / 50 | 2 / 2 (pop 1–2 od t2 do t150) |
| Praca stan (t100 / t150) | 8460 / 20454 | 0 (od t90) |
| Praca +/turę | 221 → 254, liniowo po t90 (pop stały 49–50) | +5 (t20–70) → −31 (t80–100) → −15 |
| Spichlerz stan (t50 / t100 / t150) i max | 301 / 1439 / 2851; max 3000 (t100–120), 5000 (t130–150) | 614 / 1000 / 992; max 1000 od t95 |
| Skarbiec stan (t50 / t100 / t150) i +/t | 527 / 123 / 567; +30 w t150 | 160 / 39 / 121; −62 w t150 |

Tempo wzrostu (klasyfikacja z tabel co 10 tur w dowodach):
- Surowce brutto 4242: rosną do t100, potem płasko (811–818 od t120), bo miasta i pop przestały rosnąć od t90. Nie wykładniczo.
- Praca 4242: liniowo (przyrost +221 → +254/t, stały pop). Praca 7: spada do 0 po t90.
- Spichlerz 4242: liniowo, ok. +28/t średnio t100–150 (przyrost chwilowy 10–40/t, bez przyspieszania). Spichlerz 7: osiąga cap 1000 w t95 i pozostaje na nim do t150 (saldo 0…−8/t).
- Skarbiec 4242: NIE rośnie monotonicznie (1268 w t70, 123 w t100 po wydatkach wojskowych, 567 w t150). Skarbiec 7: płasko/ujemnie (−62/t). Skarbiec nie jest tempem wzrostu, tylko wyrównywaniem wydatków.

### 9.3 Rozbicie „Surowce” (wg `hud.surowceTyp`, t150)
- Seed 4242 (brutto 818 nominalnie): Glina 406 (50%), Drewno 260 (32%), Ceramika 150 (18%). Zapasy: Glina 22 347 (Δ ok. +175/t, netto HUD +333/t), Ceramika 3 094 (Δ ok. +61/t, netto HUD +77/t), Drewno 0 (stan spada do 0 i jest ograniczony zerem, więc Δ nie nadaje się do porównania), Brąz 240.
- Seed 7 (brutto 1878 nominalnie): Drewno 760 (40%), Cegła 450 (24%, NOMINALNE), Kamień 304 (16%), Ruda miedzi 120, Brąz 100, Ceramika 100, Ruda żelaza 30, Glina 14. Zapasy po t150: Drewno 52 256 (Δ ok. +721/t, netto HUD +728/t), Kamień 20 836 (Δ ok. +290/t, netto +289/t), Ruda miedzi 8 880 (+120/t), Cegła 1 308 (Δ ok. +21/t, netto HUD +450/t).
- **Cegła (zarzuty 1 i 2 Evaluatora, przyjęte): 450/t jest wartością nominalną, nie anomalią.** Dowód z kodu: cykle Cegielni w epoce 2 = 75/t (`budynek_cegielnia_epoka2_przepustowosc`, econ-params.json:376); wyjście na cykl = `outputAmount` 2 × mnożnik epoki 1,5 (`converterOutputMultiplierForEra`, `CONVERTER_OUTPUT_ERA_PCT_BY_RECIPE` cegielnia 0,5, converters.ts:88-90, komentarz „225 cegieł (era 2)”). Nominalnie: 75 × 2 × 1,5 = 225 na Cegielnię, ×2 = 450. Dowód z danych: Cegła stan t100 258 → t110 468 → t150 1308 (Δ +21/t; t97–99 też +21/t). Realny przyrost jest ok. 21/t, a nie 450/t. Hipoteza zgodna z danymi (NIE ZMIERZONO w kodzie): glina brutto 14/t (stan Gliny 0 od t98) wystarcza na 7 cykli, 7 × 3 = 21 cegieł/t. Wniosek: cegła NIE jest nadmiarem; wnioski z poprzedniej wersji 9.5 i 9.7 o cegle są wycofane.
- **Dlaczego dwa ziarna różnią się 2,3× przy 5× mniej miast:** w 7 nie ma budynku produkującego Drewno ani Kamień (budynkiPerTyp: palac, mury_kamienne, garncarnia, cegielnia, odlewnia_brazu). Drewno 760/t przy 82 heksach terytorium (≈9/heks) i 4242 Drewno 260/t przy 323 heksach (≈0,8/heks) wskazuje, że wydajność idzie z ulepszeń na heksach (SUROW-TERYT-01), a nie z liczby miast. Liczba ulepszeń: pracaUpkeep = 36 (7) vs 10 (4242); koszt z `computePracaUpkeepByOwner` = 1 × mnożnik epoki ulepszenia (×1/×2/×4). Wartość upkeep daje górną granicę liczby ulepszeń. Stąd ok. 5–36 ulepszeń. Bezpośredniego liczenia ulepszeń NIE ZMIERZONO.
- **Rozjazd HUD netto vs Δstanu w 4242 (NIE ZMIERZONO w kodzie):** Glina HUD netto +326/t, Δstanu +175/t, różnica ≈151/t. Zgodne z hipotezą, że netto HUD nie odejmuje wejść konwerterów: 3 Garncarnie × 50 cykli × 1 glina = 150/t. Ceramika netto 77 vs Δ 61. Hipoteza wymaga potwierdzenia w kodzie przed użyciem liczb netto do propozycji.
- Kontrola zgodności z `econ-params.json`: Ceramika 150 (3 garncarnie × 50/t, epoka 2) = dokładnie przepustowość; Ceramika 100 (2×50) = OK; Brąz 100 (2 odlewnie × 50) = OK.

### 9.4 Praca: dlaczego liniowo w 4242 i 0 w 7
- Brutto Praca (= rate + upkeep): 4242 ≈ 264/t (pop 49–50); 7 ≈ 5–21/t (pop 2). Praca zależy od populacji, nie od terytorium.
- Wydatki Pracy w kodzie: `computePracaUpkeepByOwner` (turn-economy.ts:944–975) i `RESOURCE_UPKEEP_IMPROVEMENT_KEYS` (terrain-improvements.ts:608) = WSZYSTKIE trwałe ulepszenia poza `wycinka`. Nie ma innych odpływów Pracy w jsonl; w 4242 pula nie jest wydawana (autopilot postawił 6 budynków; DLACZEGO nie wydaje — NIE ZMIERZONO), więc narasta liniowo.
- Seed 7: upkeep 36 > brutto ~5–21 → saldo ujemne, pula obcięta do 0 (main.ts:44633 `Math.max(0, playerPracaPool − playerUpkeep)`).
- **Atrybucja upkeepu 36 do kategorii ulepszeń: NIE ZMIERZONO.** Jsonl nie ma listy ulepszeń gracza. W t150 seed 7: `forty` = 0, `posterunki` = 0 (owners[0]). Skok pracaUpkeep 0→36 w t80 zbiega się z drugim miastem (1→2) i skokiem Drewna 5→760 (t70→t80), co wskazuje na nowe ulepszenia, ale nie na konkretną kategorię. Poprzednia wersja (żywność i infrastruktura) była przypuszczeniem i jest wycofana.
- **SPRZECZNOŚĆ KOD vs DOKUMENTACJA (potwierdzona; do decyzji właściciela, NIE naprawiam):** `econ-params.json:304` (`ulepszenie_surowcowe_upkeep_praca`) deklaruje jako ZWOLNIONE ulepszenia żywnościowe (farma/irygacja/tarasy/bydlo/owce/lama/oboz_lowiecki/lodzie_rybackie) i infrastrukturę (droga/droga_brukowana/fort/posterunek/wyrab). Kod (`RESOURCE_UPKEEP_IMPROVEMENT_KEYS`) pobiera upkeep ze wszystkich ulepszeń poza `wycinka`. Czy zwolnienia mają obowiązywać, to decyzja właściciela.

### 9.5 Kryterium nadmiaru (policzone z danych)
- Praca 4242: pula 20 454 = ~80 tur brutto (254/t); brak wydatku ≥50 tur (pula rośnie monotonicznie t100–t150, 8 460 → 20 454). **Spełnia kryterium „brak wydatku ≥50 tur”.**
- Spichlerz (żywność) 4242: 2 851 przy max 5 000 (57%), +24/t w t150. Nie spełnia kryterium „brak ujścia”: ujście jest, a zapas nie dobija capu.
- Spichlerz 7: cap 1000 osiągnięty w t95 (rate +1), od t98 do t150 rate 0…−8/t, stan 984–1000. **Brak dowodu przepadania nadwyżki:** rate 0 przy capie oznacza zbilansowanie (wpływ 16 = zużycie 16), a jsonl nie ma pola „przepadło”. Przepadanie NIE ZMIERZONO. Propozycja 5 (poprzednia wersja) nie ma tego dowodu i jest wstrzymana.
- Skarbiec 4242: 567 przy +30/t (~19 tur); w 7 ujemny. Skarbiec NIE jest nadmiarem.
- Surowce (magazyny, cap 100 000 na typ), seed 7 z Δstanu: Drewno (+721/t) osiągnie cap za ~66 tur od t150; Kamień (+290/t) za ~275 tur; Ruda miedzi (+120/t) za ~760 tur; Cegła (+21/t) za ~4 700 tur, więc NIE jest nadmiarem. Seed 4242: Glina (Δ +175/t) za ok. 440 tur. **Realny nadmiar w 7: Drewno i Kamień.**

### 9.6 Kto zjada surowce (dla propozycji)
- Utrzymanie jednostek w surowcach (`utrzymanieJednostekSurowce`), 4242: Drewno 114/t przy brutto Drewna 245 (t100, 47%), 66/t przy brutto Drewna 260 (t150, 25%); Brąz 10/t (t120–150). Seed 7 t100: Drewno 12/t (1,6% brutto drewna). W 4242 udział jednostek w Drewnie był w t100 bardzo wysoki (47%), więc wrażliwość propozycji 1 jest tam duża.
- Utrzymanie budynków w surowcach (`utrzymanieBudynkowSurowce`): 7 t100 Drewno 10/t, Kamień 8/t (≈2,6% brutto kamienia). 4242 t150 Drewno 5/t.
- Utrzymanie w Pieniądzu (Skarbiec): 4242 t150 garnizon 96 + jednostki 104 + budynki 14 = 214 Pieniądza/t wobec +30 netto → wojsko JUŻ dominuje w wydatkach Skarbca.

### 9.7 Propozycje (do ABC właściciela; rekomendacja pierwsza; wszystkie bez zmian w kodzie)
Kolejność: **P0 — rozstrzygnąć rozjazd kod vs `econ-params` (ulepszenia żywnościowe i infrastruktura płacą Pracę w kodzie).** To nie jest balans, ale zmienia bazę każdej propozycji Pracy. Pliki: `gra/src/game/terrain-improvements.ts:608`, `gra/src/game/turn-economy.ts:944–975`, `gra/data/econ-params.json:304`.

**P0b — korekta raportowania HUD (nie decyzja balansowa).** HUD `surowceBrutto`/`surowceNetto` dla przetwórstwa jest nominalny i prawdopodobnie nie odejmuje wejść konwerterów (hipoteza z 9.3). Przed każdą propozycją dotyczącą cegły lub ceramiki trzeba mierzyć Δstanu. Naprawa to osobny temat R-WEB-* (bez pytania ABC), po potwierdzeniu w kodzie.

Dla pomysłów właściciela (estymacja z danych, NIE ZMIERZONO na biegu z wdrożoną zmianą; mnożniki ×3 i ×10 są arbitralne, a estymacja opiera się na jednym punkcie czasowym na ziarno):
1. **Droższe jednostki wojskowe (koszt w surowcach, np. Drewno).** Plus: adresuje nadmiar Drewna w 4242 i wojsko wprost. Wrażliwość: w 7 (największy nadmiar) utrzymanie jednostek to 1,6% brutto drewna; ×3 daje ~+24/t, czyli ~3% nadwyżki Drewna. W 4242 ×3 oznacza przy t150 ok. 198/t jednostkowego Drewna wobec brutto 260 (ok. 76%), a przy t100 (114/t × 3 = 342 wobec brutto 245) przekracza produkcję: efekt jest duży i wymaga osobnego pomiaru przed decyzją. Pliki: `gra/data/units.json` (koszty), `gra/src/game/economy-upkeep.ts`.
2. **Droższy upkeep budynków (`utrzymanie_surowce_wspolczynnik`, dziś 1 szt./1 Pieniądz).** Plus: działa na budynki wszystkich miast. Minus: w 7 budynki zjadają ~2,6% kamienia; ×10 daje ~+72/t dodatkowego ujścia kamienia (≈24% brutto kamienia 304/t), ale Drewno pozostaje w nadmiarze. Pliki: `gra/data/econ-params.json` (`utrzymanie_surowce_wspolczynnik`, `utrzymanie_budynek`).
3. **Droższe cuda, nie w każdej epoce.** Inwentarz: 19 cudów, koszt 140–320 (suma 4 425), każdy max 1 na świecie. Plus: w 4242 pula Pracy 20 454 jest ~4,6× większa niż suma kosztów WSZYSTKICH cudów — obecny cennik nie ujmuje Pracy nawet przy pełnym zbudowaniu. Minus: jednostka kosztu (Praca/Skarbiec/surowce) NIE POTWIERDZONA w tej rundzie; bez tego estymacja wpływu jest NIE ZMIERZONA. Pliki: `gra/data/wonders.json` (`kosztBudowy`), `gra/src/game/wonders-data.ts`.
4. **Ujście Pracy (cuda/projekty) — praktycznie tożsame z pkt 3.** Dodatkowo: pula Pracy rośnie 254/t bez kresu; czy istnieje cap puli: NIE ZMIERZONE.
5. **Nadmiar żywności (Spichlerz) — WSTRZYMANE.** W danych seed 7 cap wiąże od t95, ale saldo jest ≤0, więc przepadanie nadwyżki NIE jest udowodnione. Najpierw zmierzyć przepadanie (pole w jsonl), dopiero potem ewentualnie podnieść zużycie żywności lub przeliczyć cap.
6. **Cegła 450/t: NIE jest propozycją.** Realny przyrost ok. +21/t, cegła nie jest nadmiarem (9.3).

Rekomendacja Operatora (propozycja, nie decyzja): najpierw P0 (decyzja właściciela o upkeepie Pracy), potem P0b (naprawa raportowania HUD jako R-WEB po potwierdzeniu w kodzie), potem pomiar n≥3 ziaren z rozbiciem ulepszeń i Δstanu, dopiero potem wybór spośród 1–3. Pozycje 1–2 nie zamykają nadmiaru w 7 (wpływ ~3% Drewna do ~24% Kamienia, przy założonych mnożnikach). Pozycja 1 w 4242 ma wpływ duży i nie została oszacowana rzetelnie.

### 9.8 Czego brakuje do wyjaśnienia „+153,1k”
- Zapis gry gracza-człowieka (save JSON z `surowceTyp` i `pracaUpkeep`), ALBO HUD z gry człowieka w tej samej turze, z rozbiciem per surowiec.
- Liczba budynków i ulepszeń gracza-człowieka (autopilot ma 6–9 budynków; człowiek buduje dziesiątki).
- Potwierdzenie, czy HUD sumuje po wszystkich magazynach (cap 100 000/typ) — obecny kod tak wskazuje (`buildEmpireResourceRows`, main.ts:3995), ale liczbowo NIE ZMIERZONO. Dodatkowo: HUD brutto dla przetwórstwa jest nominalny (9.3), więc część „+153,1k” może być nominalna, nie realna — NIE ZMIERZONO.

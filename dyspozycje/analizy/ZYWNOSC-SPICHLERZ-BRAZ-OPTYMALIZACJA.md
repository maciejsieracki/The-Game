# Żywność i Spichlerz Centralny w Brązie — analiza i propozycja optymalizacji

Temat: R-WEB-ECONOMY-FOOD-GRANARY-BRONZE-OPTIMIZATION-PROPOSAL-Q1, runda 1/5, obrona (Operator, HAIKU 5.5).
Baza kodu: origin/main = ea8f70197. Kandydat obrony: 5c1ef2e8e. Zero zmian w `gra/src` i `gra/data`.
Model: `gra/tools/food-granary-model.cjs` (uruchomienie: `node gra/tools/food-granary-model.cjs`).
Pomiar: `/tmp/rebal-keep/rebal{0,1}-seed{4242,7}.jsonl` (rebal0 = flaga OFF, rebal1 = flaga ON; 149 linii każdy, tury 2–150).

Oznaczenia: **ZMIERZONO** = wynik z kodu, danych lub uruchomienia modelu; **NIE_ZMIERZONO** = brak dowodu, podano założenie.

## A. Model żywności w kodzie

| Element | Gdzie | Co liczy |
|---|---|---|
| Cap centralny | `gra/src/game/empire-food.ts` `computeCentralFoodCap` (~l.171-193) | `centralCapBaza` 1000 (`econ-params` `magazyn_centralny_baza_zywnosc`) + Σ Spichlerz I 1000 / II 1500 × `magazynEraMultiplier(e)` (= 2^(e−1)) |
| Stałe Spichlerza | `gra/src/game/building-resource-gate.ts` l.551-552 | `SPICHLERZ_EMPIRE_CAP_I = 1000`, `SPICHLERZ_EMPIRE_CAP_II_FULL = 1500` |
| Magazyn → żywność | `econ-params` `magazyn_centralny_bonus_zywnosc_na_budynek` = 0 | Magazyn nie zwiększa capu żywności |
| Zapas po turze | `empire-food.ts` ~l.280-290 | `central −= armia`; `if (central > maxCap) central = maxCap` — **nadwyżka ponad cap przepada bez rozliczenia** |
| Wyżywienie ludności | `population-growth-v85.ts` `computeCityRationCost` (~l.229), `rationFoodCostPerPop` (l.208) | pop × poziom racji × 2 (R_STAWKI_KOSZT_MULT) × m(e) |
| Mnożnik racji | `econ-era-rebalance.ts` `rebalancedCitizenConsumptionMult` | flaga ON: 2^(e−1) (Brąz ×2); OFF: 1+0,5(e−1) (Brąz ×1,5) |
| Żywność wojska | `economy-upkeep.ts` `unitFoodPerTurn` (~l.1160-1198); `econ-era-rebalance.ts` `rebalancedUnitFoodBase` | `units.json` „żywność/turę” (=1 dla wszystkich 75 jednostek) × mnożnik terytorium (własny ×1, poza ×2) × obóz (×0,5 wg `econ-params` `zywnosc_jednostka_oboz`) × 3^(e−1) (flaga ON) × R_STAWKI_FALA1_FALA2_MULT (×4). Brąz, własny teren, w marszu: 12 na jednostkę; w obozie: 6 |
| Produkcja (Uprawa i hodowla) | `econ-era-rebalance.ts:40` `przychodyUlepszenStałeEpoka1` = true | ulepszenia żywnościowe bez wzrostu co epokę (patrz §A2) |
| Flaga rebalansu | `gra/data/econ-era-rebalance-params.json` `eraRebalansAktywny` = **true** (od FALI 871, 2026-11-19) | |

Status ZMIERZONO: formuły odczytane z kodu. Wiersz „Żywność wojska” poprawiony w tej rundzie (wcześniej pominięto mnożnik obozu i terytorium).

### A2. Ulepszenia żywnościowe (ZMIERZONO z `gra/data/terrain-improvements.json`)

| Ulepszenie | Epoka wprowadzenia | Żywność (bonus) | Teren |
|---|---|---|---|
| Farma | 1 | 3 | Łąka, Równina (bez lasu) |
| Trzoda (bydło) | 1 | 2 | Łąka, Równina |
| Owce | 1 | 1 | Wzgórza |
| Lama | 1 | 1 | Wzgórza, Góry |
| Obóz łowiecki | 1 | 1 | Las |
| Łodzie rybackie | 1 | 6 | Wybrzeże, Morze |
| Irygacja | 2 | 5 | Łąka, Równina, Pustynia |
| Tarasy uprawne | 2 | 3 | Wzgórza |
| Warzelnia soli | 2 | 1 | Wybrzeże, złoże soli |

NIE_ZMIERZONO: czy przy `przychodyUlepszenStałeEpoka1` ulepszenia z epoki 2 (Irygacja, Tarasy) dostają mnożnik epoki; nie odczytano tego w kodzie. Tabela wartości bazowych nie jest dowodem wartości w Brązie.

## B. Odtworzenie liczb ze zrzutu (Brąz, zapas 29 086 / 54 000)

| Pozycja | Zrzut | Odtworzenie | Status |
|---|---|---|---|
| Cap 54 000 | 54 000 | 1000 + 2×(1000·I + 1500·II); np. 10 I + 11 II | ZMIERZONO (formuła); liczba budynków NIE_ZMIERZONO |
| Uprawa i hodowla | +3363 | suma ulepszeń | NIE_ZMIERZONO (brak listy budynków; 3363 nie odtworzono) |
| Wyżywienie | −1046 | pop × racja × 4 (flaga ON) lub × 3 (OFF) | NIE_ZMIERZONO (brak populacji i poziomów) |
| Wojsko | −312 | zależy od składu: 12/t marsz, 6/t obóz (własny teren, Brąz, flaga ON) | NIE_ZMIERZONO (skład). Patrz §B2 |
| Nadwyżka | +2317 | 3363 − 1046 | ZMIERZONO (arytmetyka) |
| Przyrost zapasów | +2005 | 2317 − 312 | ZMIERZONO |
| „Spichlerz stolicy” | +29 399 | ≈ zapas przed armią (29 086 + 312) | ZMIERZONO (zgodność); pole w panelu: `empireDetailPanel.ts:3300` `t.spichlerzStolicy` |
| Tury do capu | ~12 | (54 000 − 29 086)/2005 = 12,4; model: 13 | ZMIERZONO |
| Pasek „+2267 → +1954” | +2267 / +1954 | **Patrz §B1** | ZMIERZONO (kod paska), wynik: NIE_ZGODNE z hipotezą flagi OFF |

### B1. Pasek „+2267 → +1954” (poprawka po obronie)

Pasek to `grossNetNumbersSub(zywnoscWplywMiast, zywnoscRate)` (`gra/src/ui/empireDetailPanel.ts:1677-1690` i wywołanie `:3267`). Brutto = nadwyżka miast → centrala, **przed** armią; netto = po deficytach miast i po armii.

- Różnica 2267 − 1954 = 313 ≈ wojsko 312 → zgodne z odjęciem armii.
- Hipoteza z obrony poprzedniej („flaga OFF”) była błędna: 3363 − 0,75·1046 = 2578,5 jest brutto przed armią, a nie 2267. Wyrażenie 3363 − 784,5 − 312 mieszało odjęcie armii do brutto. **Odrzucam hipotezę flagi OFF jako wyjaśnienia paska.**
- Brutto 2267 oznacza wyżywienie miast ok. 3363 − 2267 = **1096**, a podsumowanie pokazuje 1046. Różnica 50 jest NIE_ZMIERZONO (możliwe: pomoc miastom w mieście lub zaokrąglenie per miasto). Flaga ON/OFF nie wyjaśnia tej różnicy.

### B2. Wojsko: 312 żywności vs 376 ¤ (poprawka)

Poprzednie „26 jednostek” zakładało, że każda jednostka je 12/t. Jest to nieprawdziwe: obóz je 0,5 bazy. Przy mieszance *a* jednostek w marszu (12) i *b* w obozie (6): 12a + 6b = 312, czyli 2a + b = 52. Gold 376 ¤ przy ≤12 ¤ na jednostkę wymaga a + b ≥ 32. Oba warunki są spełnialne (np. a = 20, b = 12). Skład NIE_ZMIERZONO, więc sprzeczność nie jest rozstrzygnięta, ale nie wynika już z błędu rachunku.

### B3. Pomiar w grze (seed 4242 i 7, 150 tur, flaga OFF/ON)

Dane z `/tmp/rebal-keep/*.jsonl`, pola `owners[0].hud` (ZMIERZONO, jednorazowy odczyt). Wszystkie biegi: epoka gracza 2 w tt60–120. Gracz ma 1–10 miast; zrzut ma 20 miast, więc **zrzut NIE jest odtworzony przez te biegi** (stan inny: cap 1000–3000 zamiast 54 000).

| Bieg | Tura | Spichlerz stan / max | Wpływ (`spichlerzWplyw`) | Netto `spichlerzRate` | Miasta | Pop. | AI śr. spichlerz |
|---|---|---|---|---|---|---|---|
| s4242 OFF | 60 | 408,5 / 1000 | 44 | +14 | 10 | 14 | 12 904 |
| s4242 OFF | 90 | 1000 / 1000 | 370 | +6 | 10 | 49 | 74 113 |
| s4242 OFF | 120 | 1995,5 / 3000 | 243 | +10 | 10 | 49 | 80 692 |
| s4242 ON | 60 | 394 / 1000 | 13 | +9 | 7 | 7 | 2 354 |
| s4242 ON | 90 | 852 / 1000 | 101 | +21 | 10 | 25 | 28 530 |
| s4242 ON | 120 | 1000 / 1000 | 151 | +7 | 10 | 25 | 46 342 |
| s7 OFF | 60 / 90 / 120 | 578 / 941 / 996 (max 1000) | 8 / 13 / 16 | −4 / +1 / −4 | 1–2 | 1–2 | 15 358 / 64 644 / 71 925 |
| s7 ON | 60 / 90 / 120 | 204 / 520 / 920 (max 1000) | 8 / 8 / 8 | −4 / 0 / 0 | 1 | 1 | 3 028 / 25 455 / 44 788 |

Wnioski ZMIERZONO:
- Flaga ON **obniża zapas AI** ok. 60% przy t90 (74 113 → 28 530 dla s4242). Pierwszy wynik pomiaru łącznego, nie był wcześniej w dokumencie.
- Gracz na ON dobija do capu w t120 (s4242), ale z wpływem 151/t, nie 2005/t.
- Anomalia do wyjaśnienia (NIE_ZMIERZONO przyczyny): `spichlerzMax` 3000 przy OFF t120, a 1000 przy ON t120 dla tego samego miasta — przy ON mnożnik epoki powinien być większy. Może to inny moment przejścia epoki lub inne pole. Zgłaszam orkiestratorowi.
- Pola produkcji i wyżywienia osobno NIE są w jsonl. Dlatego podział „produkcja vs zużycie” w pomiarze NIE_ZMIERZONO.

## C. Propozycje (warianty, bez edycji kodu)

Parametry są propozycjami do wyboru, nie wartościami przyjętymi. Żaden z poniższych kluczy nie istnieje w kodzie (NOWY):

| Wariant | Zmiana | Nowy klucz (proponowany) | Skutek (model, 60 tur, ON) |
|---|---|---|---|
| V0 obecnie | — | — | cap po 13 turach; przepadek ~95 000 żywności w 60 turach |
| V1 ostrożny | produkcja ulepszeń żywnościowych −10% (Brąz) | `econ-era-rebalance-params.json` → `przychodyUlepszenMnoznikBrąz` = 0,9 (NOWY) | netto 1669/t; cap po 15 turach; przepadek ~75 000 |
| V2 średni | produkcja −20% + psucie 2%/t zapasu powyżej 50% capu | jw. 0,8 + `econ-params` → `magazyn_psucie_prog`, `magazyn_psucie_stopa` (NOWE) | netto 1332/t; **cap po 25 turach** (skutek z produkcji −20%; sam wariant psucia daje cap po 15 turach, patrz kontrast); przepadek ~28 000 |
| V3 mocny | produkcja −30% + konwersja 0,2 ¤ za żywność nad 70% capu | jw. 0,7 + `magazyn_konwersja_na_zloto`, `magazyn_konwersja_prog` (NOWE) | netto 996/t; zapas 38 796 po 60 t; ~10 000 ¤ z konwersji |
| Kontrast | psucie 2%/t nad 50% bez zmiany produkcji | jw. | cap po 15 turach; przepadek ~67 000 |

Poprawka (zarzut 7): wcześniej V2 przypisywano psuciu skutek z cięcia produkcji. Psucie samo nie spowalnia dojścia do capu; skutek „cap po 25 turach” w V2 pochodzi z produkcji −20%.

Ograniczenie: psucie nie zatrzymuje wzrostu przy capie (stacjonarny zapas > cap). Działa tylko przez zmianę produkcji lub ujście z dochodem.

Ujścia (propozycja, NIE_ZMIERZONO w kodzie):
- **Pomoc miastom** (`empire-food.ts:71`, „dopłaty z magazynu do miast na minusie”) to ujście na deficyt, a nie eksport. Brak mechanizmu eksportu do państw-miast i sojuszników (NIE_ZMIERZONO, nie szukano w diplomacji).
- Konwersja w Pieniądz: brak takiego mechanizmu w `empire-food.ts`/`econ-era-rebalance.ts` (sprawdzone grepem: brak „psuc/spoil/decay/konwersj” w tych plikach poza konwerterami budynków).

## D. UI

- `empireDetailPanel.ts:3296-3300`: wiersze „Nadwyżka” i „Spichlerz stolicy” nie tłumaczą, co dzieje się z nadwyżką przy capie. Tylko podpowiedź w `cityPanel.ts:5742`: „Nadwyżka trafia do magazynu centralnego”.
- Propozycja: dopisać przy wierszu „Nadwyżka” informację „przy pełnym magazynie nadwyżka przepada” (ZMIERZONO: obecnie ten tekst nie występuje).

## E. Fazowanie Brąz → Żelazo

- Żelazo: żywność wojska ×3 (36/jedn. w marszu) już rośnie z rebalansem. Nie dublować mnożnika w produkcji.
- Produkcja stała z epoką 1 przy flagi ON: nadwyżka w Żelazie będzie większa przy wyżywieniu ×4. Ocena po pomiarze, nie z góry.

## F. Pytania ABC dla właściciela

1. **Która flaga obowiązuje w zrzucie?** Pasek nie odpowiada hipotezie OFF (§B1), a podsumowanie odpowiada ON. **Rekomendacja: A (ON), ale dopiero po odtworzeniu zrzutu na tej flagi.** Alternatywy: B) OFF; C) nie wiem, mierzymy oba.
2. **Czy nadwyżka ponad cap ma przepadać?** A) tak, bez zmian; B) psucie 2%/t nad 50% capu (kontrast: cap nadal po 15 turach); C) konwersja w Pieniądz nad 70% capu (V3). **Rekomendacja: C, razem z A na Brązie**, bo nie zmienia produkcji ulepszeń. Wymaga nowego klucza.
3. **Czy redukować produkcję ulepszeń w Brązie?** A) nie; B) −10% (V1); C) −20% (V2). **Rekomendacja: B, po pomiarze 60 tur.**
4. **Pomoc miastom jako ujście?** A) nie; B) tak, przy nadwyżce ponad 70% capu. Wymaga nowego mechanizmu, nie tylko progu.

## Ograniczenia

- Pomiar w grze w tej rundzie: tylko odczyt istniejących jsonl (ZMIERZONO). Bundle i przeglądarka nie uruchamiane.
- Model statyczny: bez populacji, bez wzrostu miast i bez reakcji AI.
- Anomalia `spichlerzMax` (§B3) nieprzeanalizowana.

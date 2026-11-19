# Skarbiec w Brązie — lekka korekta kosztów jednostek (PLOC Brązu)

Temat: R-WEB-ECONOMY-FOOD-GRANARY-BRONZE-OPTIMIZATION-PROPOSAL-Q1, część F (runda 1/5, Operator HAIKU 5.5).
Baza kodu: origin/main = ea8f70197. Zero zmian w `gra/src` i `gra/data`.
Model: `gra/tools/treasury-unit-cost-model.cjs` (uruchomienie: `node gra/tools/treasury-unit-cost-model.cjs`).

Założenie: „PLOC-em Brązu” odczytano jako „pułapem Brązu”, czyli zaawansowany stan Brązu. NIE_ZMIERZONO, czy właściciel miał na myśli inny stan.

## F1. Model pieniądza w kodzie

| Element | Gdzie | Co liczy |
|---|---|---|
| Utrzymanie jednostki | `gra/src/game/economy-upkeep.ts` `unitUpkeep` (~l.1064-1081) | stawka z `units.json` „Utrzymanie (Pieniądz/turę)” × `R_STAWKI_FALA1_FALA2_MULT` (= 4, `r-stawki-strojenie.ts`). Kolejność: typeId → kategoria → `utrzymanie_jednostka_standard` |
| Brak skali epoki na utrzymaniu | `unitUpkeep` | **stawka nie zależy od epoki** (Brąz i Żelazo ×4 jak Kamień) |
| Suma jednostek | `economy-upkeep.ts` `totalUnitUpkeep` (~l.1082); `upkeepBalance` (~l.1281) | Σ po wszystkich jednostkach właściciela |
| Garnizon | `gra/src/main.ts` `garrisonUpkeepForCity` (~l.9423) → pole `utrzymanieGarnizonuPieniadz` (~l.34138) | podzbiór utrzymania jednostek (jednostki na heksie miasta) |
| Koszt rekrutacji | `gra/src/game/production.ts` ~l.409 `scaleCostByEpoch(unitCostFromDef(u), u.Epoka)` | Kamień ×1, Brąz ×2, Żelazo ×4 (`building-stock-cost.ts` `epochCostMultiplier`) |
| Koszt budowy budynków | `building-stock-cost.ts` `buildingEraCostMultiplier` | Brąz ×2, Żelazo ×4 (dotyczy budowy, nie utrzymania) |
| Deficyt złota | `gra/src/game/gold-deficit.ts`, `economy-upkeep.ts` `upkeepBalance` | `deficyt = saldo < 0` |

Status ZMIERZONO: formuły odczytane z kodu. NIE_ZMIERZONO: czy koszt rekrutacji przechodzi jeszcze przez mnożnik R_STAWKI (nie znaleziono w `unitCostFromDef`).

## F2. Liczby ze zrzutu „Skarbiec imperium” (Brąz, 20 miast, skarbiec 7096)

| Pozycja | Wartość | Uwaga |
|---|---|---|
| Wpływy brutto | +1550/t | podatek + budynki +1034 + handel szlaków +516 |
| Utrzymanie budynków | −786/t | ¤ |
| Utrzymanie jednostek | −376/t | część to garnizony |
| Suma kosztów | −1162/t | |
| Netto wg sumy | **+388/t** | |
| Netto wg panelu | +345/t | **różnica 43/t NIE_ZMIERZONO** (Administrator −2, zaokrąglenia lub pozycja nieujęta w zrzucie) |
| Utrzymanie surowców budynków | −542 / −182 / −41 / −22 | z magazynu państwa, nie ze złota — poza tą analizą |

Udział kosztów jednostek: 376/1162 = **32%** kosztów; 376/1550 = **24%** wpływów; 376/786 = 48% kosztów budynków.

## F2b. Ile jednostek daje 376 ¤/t

Stawki po ×4 (wg `units.json`):

| Epoka | Jednostek (w pliku) | Śr. utrzymanie/t | Śr. rekrutacja (¤) | Utrzymanie 0 (np. gwardie) |
|---|---|---|---|---|
| Kamień | 11 | 4,73 | 7,0 | 1 |
| Brąz | 37 | 7,46 | 19,6 | 5 |
| Żelazo | 27 | 7,70 | 39,8 | 3 |

- Typy Brąz: Włócznik/Miecznik/Wojownik z toporem `2 → 8 ¤`; Rydwan/Galera `3 → 12 ¤`; Łucznik `2 → 8 ¤`.
- Zakres liczby jednostek: 376/12 = 31 do 376/4 = 94; przy średniej Brąz 8,63 ¤ ok. 44. **Skład armii NIE_ZMIERZONO** (brak rozkładu typów w zrzucie).
- Krzyżowa kontrola z wojskiem żywnościowym (F/A): −312 żywności = 26 jedn. Brąz (×12) lub 78 jedn. Kamień (×4). Oba obrazy są zgodne z zakresem 31–94 tylko częściowo; mieszanka jest NIE_ZMIERZONO.

**Wniosek ZMIERZONO:** utrzymanie jednostek jest płaskie między epokami, a koszt rekrutacji rośnie ×2/×4. Koszt jednostki w czasie rośnie głównie przy zakupie, nie przy utrzymaniu. Gdyby utrzymanie też skalowało ×2 (jak budowa), netto spadłoby do −31/t (model).

## F3. Warianty (mnożnik utrzymania pieniężnego jednostek; górna granica: cała pula 376 traktowana jak Brąz)

| Wariant | Mnożnik | Koszt jednostek | Δ/t | Netto (z 345) |
|---|---|---|---|---|
| V0 obecnie | 1,00 | 376 | 0 | 345 |
| V1 ostrożny | +10% (×1,10) | 414 | −38 | 307 |
| V2 średni | +20% (×1,20) | 451 | −75 | 270 |
| V3 mocny | +30% (×1,30) | 489 | −113 | 232 |
| Kontrast: jak budynki | ×2 | 752 | −376 | **−31** |

Próg zerowania netta: mnożnik 1,92 (+92%). Przy kontraście (×2) skarbiec ubywa 31/t, czyli wyczerpanie po ok. 229 turach. Wariant ×2 jest zbyt mocny jako „lekki”.

Warianty alternatywne (propozycje, bez wyboru):
- **Stopnie według typu:** Włócznik/Miecznik/Łucznik +10%, Rydwan/Galera/Konnica +20% (te typy płacą obecnie 12 ¤/t zamiast 8).
- **Mnożnik zależny od liczby jednostek ponad pułap miast** (np. jednostki ponad 2 na miasto +25%): chroni małą armię, dociska nadmiar.
- **Fazowanie:** Brąz — V1/V2; Żelazo — osobny przegląd, bo żywność wojska już rośnie ×3/epokę (nie dublować).

## F4. Ograniczenia

- **Brak sprzężenia zwrotnego:** AI/gracz przy droższym utrzymaniu zmniejsza armię, więc realny koszt spadnie poniżej modelu. Wynik to górna granica dla kosztu.
- **Brak sufitu skarbca** w modelu (NIE_ZMIERZONO, czy istnieje).
- Model nie uwzględnia Administratora (−2/t) ani zmian podatku.
- Pomiar w grze nie wykonany w tej rundzie (NIE_ZMIERZONO).

## F5. Pytania ABC dla właściciela

1. **Wielkość korekty utrzymania jednostek w Brązie:** A) +10% (V1, netto ~307); B) +20% (V2, netto ~270) — **rekomendacja: A, potem obserwacja 60 tur**, bo „lekka” korekta; C) +30% (V3, netto ~232).
2. **Sposób:** A) mnożnik dla wszystkich jednostek Brąz+; B) stopnie według typu (ciężka piechota/rydwany drożej) — rekomendacja: A dla prostoty; C) mnożnik zależny od liczby jednostek ponad pułap miast.
3. **Koszt rekrutacji:** A) bez zmian; B) +10% w Brązie. Nie zmienia netta na utrzymaniu, wpływa na tempo wzrostu armii — **rekomendacja: A**.
4. **Zakres:** A) tylko Brąz; B) Brąz i Żelazo (Żelazo wymaga osobnej analizy, bo ma ×3 żywności).

## Skutki w jednym zdaniu

Lekka korekta +10% utrzymania jednostek obniża netto skarbca z 345 do ok. 307/t (−38/t) i nie zmienia relacji wpływów do kosztów w sposób niebezpieczny; kontrast ×2 odwraca netto w deficyt (−31/t).

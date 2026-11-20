# Skarbiec w Brązie — lekka korekta kosztów jednostek (PLOC Brązu)

> **NIEAKTUALNE (2026-11-20):** wzory utrzymania jednostek i żywności opisane tutaj są sprzed FAL 875–887 (skala epoki na utrzymaniu, tempo „Koszty jednostek”, żywność ×4 na epokę, dodatkowy mnożnik rekrutacji). Aktualny stan: `dyspozycje/analizy/KOSZTY-JEDNOSTEK-STAN-2026-11-20.md`. Dokument zostawiony bez przepisywania.

Temat: R-WEB-ECONOMY-FOOD-GRANARY-BRONZE-OPTIMIZATION-PROPOSAL-Q1, część F (runda 1/5, obrona, Operator HAIKU 5.5).
Baza kodu: origin/main = ea8f70197. Kandydat obrony: 5c1ef2e8e. Zero zmian w `gra/src` i `gra/data`.
Model: `gra/tools/treasury-unit-cost-model.cjs` (uruchomienie: `node gra/tools/treasury-unit-cost-model.cjs`).

Założenie: „PLOC-em Brązu” odczytano jako „pułapem Brązu”, czyli zaawansowany stan Brązu. NIE_ZMIERZONO, czy właściciel miał na myśli inny stan.

Oznaczenia: **ZMIERZONO** = kod, dane, uruchomienie modelu lub pomiar; **NIE_ZMIERZONO** = brak dowodu, podano założenie.

## F1. Model pieniądza w kodzie

| Element | Gdzie | Co liczy |
|---|---|---|
| Stawka jednostki | `gra/src/game/economy-upkeep.ts:1064-1082` `unitUpkeep` | `units.json` „Utrzymanie (Pieniądz/turę)” (po typeId, potem po kategorii `DEFAULT_UNIT_UPKEEP_BY_CATEGORY`, potem `utrzymanie_jednostka_standard` z `econ-params`, odczyt `economy-upkeep.ts:611`) × `R_STAWKI_FALA1_FALA2_MULT` (= `R_STAWKI_KOSZT_MULT` 2 × `R_STAWKI_FALA2_MULT` 2 = **4**; `gra/src/game/r-stawki-strojenie.ts:6-12`) |
| Skala epoki na utrzymaniu | `unitUpkeep` (l.1064-1082) | **brak** — funkcja nie czyta epoki (ZMIERZONO) |
| Suma jednostek | `economy-upkeep.ts` `totalUnitUpkeep` (~l.1083); `upkeepBalance` (l.1281-1296) | Σ po jednostkach właściciela |
| Saldo | `upkeepBalance` (l.1281-1296) | `saldo = income − (utrzymanieBudynki + utrzymanieJednostki)`; `deficyt = saldo < 0`. **Administratora nie ma w tej funkcji** (ZMIERZONO); jeśli wchodzi, to przez `income` |
| Garnizon | `gra/src/main.ts` `garrisonUpkeepForCity` (~l.9423) → `utrzymanieGarnizonuPieniadz` (~l.34138) | podzbiór utrzymania jednostek (NIE_ZMIERZONO w tej rundzie: czy mnożnik garnizonu istnieje) |
| Koszt rekrutacji | `gra/src/game/production.ts:409` i `:2605` `scaleCostByEpoch(unitCostFromDef(u), u.Epoka)` | Kamień ×1, Brąz ×2, Żelazo ×4 (ZMIERZONO: wywołanie; wartości mnożników wg poprzedniej rundy) |
| Koszt budowy | `building-stock-cost.ts` `buildingEraCostMultiplier` | Brąz ×2, Żelazo ×4; dotyczy budowy, nie utrzymania |
| Dowódca i prawo/ustrój jako mnożniki utrzymania | NIE_ZMIERZONO | nie sprawdzono w tej rundzie; w modelu pominięte |

Wniosek ZMIERZONO: utrzymanie pieniężne jednostek **nie skaluje się z epoką**, a koszt rekrutacji już tak. Pierwotny opis „stawka nie zależy od epoki” jest potwierdzony dla `unitUpkeep`.

## F2. Liczby ze zrzutu „Skarbiec imperium” (Brąz, 20 miast, skarbiec 7096)

| Pozycja | Wartość | Uwaga |
|---|---|---|
| Wpływy brutto | +1550/t | podatek + budynki +1034 + handel szlaków +516 |
| Utrzymanie budynków | −786/t | ¤ |
| Utrzymanie jednostek | −376/t | w tym garnizony |
| Suma kosztów | −1162/t | |
| Netto wg sumy | **+388/t** | |
| Netto wg panelu | +345/t | model używa 345 jako bazy, bo to saldo widoczne dla właściciela |
| Różnica 43/t | | Administrator −2 wyjaśnia 2 z 43. Pozostałe 41 NIE_ZMIERZONO (nie ma składnika Administratora w `upkeepBalance`; brak sufitu i pozycji „inne” w zrzucie) |
| Utrzymanie surowców budynków | −542 / −182 / −41 / −22 | z magazynu państwa, nie ze złota; poza tą analizą |

Udział kosztów jednostek: 376/1162 = **32%** kosztów; 376/1550 = **24%** wpływów; 376/786 = 48% kosztów budynków.

## F2b. Ile jednostek daje 376 ¤/t

Stawki po ×4 (wg `units.json`, zgodnie z `unitUpkeep`):

| Epoka | Jednostek (w pliku) | Śr. utrzymanie/t (po ×4) | Śr. rekrutacja (¤) |
|---|---|---|---|
| Kamień | 11 | 4,73 | 7,0 |
| Brąz | 37 | 7,46 | 19,6 |
| Żelazo | 27 | 7,70 | 39,8 |

- Brąz: Włócznik/Miecznik/Wojownik z toporem 2 → 8 ¤; Rydwan/Galera 3 → 12 ¤; Łucznik 2 → 8 ¤ (ZMIERZONO z `units.json` × 4).
- Zakres liczby jednostek przy 376 ¤: 376/12 = 31,3 do 376/4 = 94; przy średniej Brąz 8,63 ¤ ok. 44. **Skład NIE_ZMIERZONO.**
- Pomiar w biegach (B3): w seedach średnie utrzymanie wynosi dokładnie **4,0/jedn.** w 3 z 4 punktów (OFF t90, ON t90, ON t120); OFF t120 = 4,35. Sugeruje jednostki kategorii niskiej (Kamień ×4), NIE_ZMIERZONO typ.
- Krzyżowa kontrola z żywnością: patrz `ZYWNOSC-SPICHLERZ-BRAZ-OPTYMALIZACJA.md` §B2. Mieszanka marsz/obóz jest spójna z 312 żywności i 376 ¤; wniosek o „26 jednostkach” wycofany.

**Wniosek ZMIERZONO:** utrzymanie jednostek jest płaskie między epokami, a koszt rekrutacji rośnie ×2/×4. Gdyby utrzymanie też skalowało ×2 (jak budowa), netto spadłoby do −31/t (model).

## F3. Warianty (mnożnik utrzymania pieniężnego jednostek; górna granica: cała pula 376)

| Wariant | Mnożnik | Koszt jednostek | Δ/t | Netto (z 345) |
|---|---|---|---|---|
| V0 obecnie | 1,00 | 376 | 0 | 345 |
| V1 ostrożny | +10% | 414 | −38 | 307 |
| V2 średni | +20% | 451 | −75 | 270 |
| V3 mocny | +30% | 489 | −113 | 232 |
| Kontrast: jak budynki | ×2 | 752 | −376 | **−31** |

Próg zerowania netta: mnożnik 1,92 (+92%).

### Gdzie wpisać każdy wariant (propozycja, NIE edytowano)

| Wariant | Istniejący parametr | Co trzeba dopisać |
|---|---|---|
| Mnożnik ogólny Brąz | `R_STAWKI_FALA2_MULT` i `R_STAWKI_KOSZT_MULT` (`r-stawki-strojenie.ts:6-12`) są wspólne dla wszystkich epok | NOWY klucz, np. `econ-era-rebalance-params.json` → `utrzymanieJednostekMnoznikBrąz` = 1,1 (wymaga zmiany w `unitUpkeep`, bo obecnie nie zna epoki) |
| Stopnie według typu | `units.json` „Utrzymanie (Pieniądz/turę)” już ma wartości per typ | Nowe wartości w `units.json` (np. +10% Włócznik/Miecznik/Łucznik). Uwaga: klucze „Spearman/Swordsman/Mount/Offensive” z `units.json` to pola „Bonus vs”, a nie stopnie |
| Mnożnik od liczby jednostek | NIE istnieje w kodzie | NOWY wzór w `totalUnitUpkeep`; efekt liczbowy wymaga liczby jednostek na miasto (NIE_ZMIERZONO w zrzucie) |

## F3b. Koszt rekrutacji (nie zmienia netta na utrzymaniu)

Koszt rekrutacji: `production.ts:409` i `:2605` (`scaleCostByEpoch`). Zmiana +10% w Brązie tylko zmienia tempo wzrostu armii, nie saldo utrzymania.

## F4. Skarbiec w pomiarze gry (seed 4242 i 7; ZMIERZONO z `/tmp/rebal-keep/*.jsonl`)

Pola: `owners[0].utrzymanieJednostekPieniadz`, `jednostkiWojskowe`, `hud.skarbiecRate` (netto na turę, jak w panelu).

| Bieg | Tura | Utrzymanie jedn. | Jedn. | Śr./jedn. | Netto skarbca (rate) | +10% | +20% | +30% |
|---|---|---|---|---|---|---|---|---|
| s4242 OFF | 90 | 220 | 55 | 4,0 | −111 | −133 | −155 | −177 |
| s4242 OFF | 120 | 148 | 34 | 4,35 | −30 | −45 | −60 | −74 |
| s4242 ON | 90 | 76 | 19 | 4,0 | −7 | −15 | −22 | −30 |
| s4242 ON | 120 | 92 | 23 | 4,0 | −23 | −32 | −41 | −51 |
| s7 ON | 120 | 8 | 2 | 4,0 | −11 | −12 | −13 | −13 |

Wiersze „+10/+20/+30%” to statyczne przeliczenie: Δ = 0,1/0,2/0,3 × utrzymanie jednostek, bez sprzężenia zwrotnego. ZMIERZONO: kolumny wejściowe. Wynik to górna granica kosztu.

Wniosek ZMIERZONO: w biegach netto skarbca jest **ujemny** (−7 do −111/t) przy flagach ON i OFF, czyli warianty mogą pogłębić deficyt. Zrzut „Skarbiec imperium” (+345/t) pochodzi z 20 miast, których seed nie odtwarza (biegi mają 1–10 miast).

## F4b. Ograniczenia

- **Brak sprzężenia zwrotnego:** AI i gracz przy droższym utrzymaniu zmniejszą armię, więc realny koszt będzie niższy. Wynik to górna granica.
- **Brak sufitu skarbca** w modelu (NIE_ZMIERZONO, czy istnieje).
- Model nie uwzględnia Administratora (−2/t) ani zmian podatku.
- Pomiar w grze w tej rundzie: tylko odczyt istniejących jsonl. Brak uruchomienia bundle'a.

## F5. Pytania ABC dla właściciela

1. **Wielkość korekty utrzymania jednostek w Brązie:** A) +10% (V1, netto ~307); B) +20% (V2, netto ~270); C) +30% (V3, netto ~232). **Rekomendacja: A, potem obserwacja 60 tur**, bo korekta ma być lekka. W biegach netto jest już ujemne, więc wymaga to decyzji po pomiarze ON/OFF z tym wariantem.
2. **Sposób:** A) mnożnik dla wszystkich jednostek Brąz+ (wymaga nowego klucza i zmiany `unitUpkeep`); B) stopnie według typu (zmiana wartości w `units.json`); C) mnożnik od liczby jednostek (wymaga nowego wzoru). **Rekomendacja: B**, bo nie wymaga nowego wzoru. Wartości z `units.json` są już per typ.
3. **Koszt rekrutacji:** A) bez zmian; B) +10% w Brązie. Nie zmienia netta na utrzymaniu. **Rekomendacja: A.**
4. **Zakres:** A) tylko Brąz; B) Brąz i Żelazo (Żelazo wymaga osobnej analizy, bo ma ×3 żywności). **Rekomendacja: A.**

## Skutki w jednym zdaniu

Lekka korekta +10% utrzymania jednostek obniża netto skarbca z 345 do ok. 307/t (−38/t) według zrzutu, ale w pomiarze biegów saldo jest już ujemne, więc korekta wymaga pomiaru przed decyzją. Kontrast ×2 odwraca netto w deficyt (−31/t).

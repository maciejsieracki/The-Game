# P1-16F — CivPedia „Pojęcia / Miasto / Nauka / Ekonomia": audyt liczb wobec kodu

**Temat:** R-RUSTPORT-P1-16F-CIVPEDIA-POJECIA-Q1
**Runda:** 1/5 (Operator, Haiku 5.5 medium)
**Pin:** web `maciejsieracki/The-Game` main = `edb8fb56`
**Data:** 2026-10-21
**Źródło wiki:** `gra/src/data/wikiBundle.json` na pinie (`version` rev-civpedia-2026-08-05, `generated` 2026-09-05), wpisy `encyklopedia` o `category` i `folder` = `pojecia`.
**Źródło kodu i danych:** `gra/src/game/*.ts` oraz `gra/data/*.json` na pinie `edb8fb56` (odczyt przez `git show`, bez checkoutu).

## 0. Zakres i metoda

Grupa 10 haseł = dokładnie wpisy kategorii „Pojęcia" (5), „Miasto i społeczeństwo" (3), „Nauka i epoki" (1) i „Ekonomia imperium" (1):

| # | ID wiki | Tytuł |
|---|---------|-------|
| 1 | `pojecia/bogactwo` | Bogactwo |
| 2 | `pojecia/bunt` | Bunt |
| 3 | `pojecia/porzadek` | Porządek |
| 4 | `pojecia/spichlerz` | Spichlerz — zapasy i wzrost |
| 5 | `pojecia/suwak-handlu` | Suwak handlu |
| 6 | `pojecia/suwak-pracy` | Suwak pracy |
| 7 | `pojecia/suwak-zywnosci` | Suwak żywności |
| 8 | `pojecia/szczescie` | Szczęście |
| 9 | `pojecia/drzewko-technologii` | Drzewko technologii |
| 10 | `pojecia/szlaki-handlowe` | Szlaki handlowe |

Każde twierdzenie liczbowe z pól `wikiS`, `wikiM`, `full` i `historia` zestawiono z wartością w kodzie lub w JSON na pinie. Statusy:

- **ZGODNE**: liczba lub formuła z hasła = wartość w kodzie/danych na pinie (lub poprawna arytmetyka przykładu).
- **ROZJAZD**: liczba, formuła, zakres lub nazwa z hasła ≠ pin. Dowód podano przy wierszu.
- **NIEZWERYFIKOWANE**: twierdzenie nie zostało domknięte w tej rundzie. Lista jest w §11.

**Uwagi wstępne.**

1. Hasła Szczęście, Suwak handlu, Bogactwo, Porządek (progi), Spichlerz (pojemność) i Suwak żywności opisują model sprzed przebudowy wykonanej w `R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1` (decyzje G1–G15, 2026-09-05), `R-PRAWO-PRZEBUDOWA-SKALI-Q1` (D1–D7), `R-HANDEL-LIMIT-TRAS-PELNY-Q1` (2026-09-04), decyzji C-HANDEL-UMOWA=B (2026-07-23) i PYTANIE-85 (pojemność magazynu). Pin ma nowe wartości w JSON i w kodzie. Liczby w tych hasłach są w większości nieaktualne.
2. Zamożność nie ma osobnego hasła w grupie. Pojęcie pokrywają Bogactwo (poziom W) i Suwak handlu (udział Zamożności).
3. Garnizon (budynek) leży poza grupą. Sprawdzono go krzyżowo, bo dispatch o to prosi. `budynki/garnizon` podaje koszt 60 pracy + 60 drewna, utrzymanie 4 ¤/t. Pin (`gra/data/buildings.json`, id `garnizon`): `kosztBudowy` 30, `utrzymanie` 2. Rozjazd potwierdzony. Prawo z Garnizonu 25/35/47 per epoka zgadza się z `prawo_garnizon_budynek_epoka`.
4. Pole `historia` jest puste (`''`) we wszystkich 10 hasłach (sprawdzono w `gra/src/data/wikiBundle.json` na pinie, `git show edb8fb56:...`). Zakres `historia` = 0 twierdzeń, zamknięty; nie ma tu liczb do weryfikacji.

**Rewizja 2 (2026-10-21, obrona Operatora po zarzutach Evaluatora).** Zmiany: §8 Świątynia (ZGODNE → ROZJAZD); §10 Umowa (wartości −10/−15 ZGODNE, nazwa ROZJAZD, relacja −15 NIEZWERYFIKOWANE); dopisano wiersze dla liczb z haseł Bogactwo, Bunt, Porządek, Suwak handlu, Szczęście, które wcześniej nie miały wiersza. Łącznie 151 twierdzeń: ZGODNE 73, ROZJAZD 56, NIEZWERYFIKOWANE 22.

---

## 1. Bogactwo (`pojecia/bogactwo`)

| Twierdzenie (wiki) | Pin (kod / dane) | Status |
|---|---|---|
| Próg awansu ≈ 4,5 × (L+1) × epoka | `wealth.ts`: `progNaPoziom: 4.5`, `wealthProg` = 4,5·(poziom+1)·epoka | ZGODNE |
| Cap poziomu ≈ 10 × epoka | `wealth.ts`: `wealthCap` = epoka × `capNaEpoke` (10) | ZGODNE |
| „Szczęście: co 5 luksusu w puli = +1 pkt (normal)"; pula 10 → +2 | `wealth.ts` nagłówek G6 i `wealthZadowolenie`: `floor(poziom × 10 / cap_epoki)`, max +10 w każdej epoce. Klucz `szczescie_luksus_na_mieszkanca` (= 5) nie jest czytany przez `gra/src`. | ROZJAZD |
| „Mnożnik wpływający na szczęście i dochody luksusowe" | `wealth.ts`: `mnoznikNaPoziom` 0,15, mnożnik `1 + (W−1)·0,15` działa tylko na strumień podatku (skarbiec). Wpływu na szczęście brak. | ROZJAZD |
| Miasto 40% Zamożności z 10 Daniny → 4 luksus/t | Arytmetyka poprawna. Wartość 40% jest przykładowa. | ZGODNE |
| Trade-off 40% → 20%: +2 złota/t, −2 luksus/t | Arytmetyka poprawna | ZGODNE |
| Domyślny udział 20% (`suwak_handel_luksus_domyslnie`) | `econ-params.json`: 20 we wszystkich trudnościach; `cities.ts` `DEFAULT_PODZIAL_HANDLU.procentLuksus` = 20 | ZGODNE |
| Immunitet (hard), „D18" | `wealth.ts` ma `immunitetTur`, nie zweryfikowano wartości per trudność | NIEZWERYFIKOWANE |
| Tabela „Bogactwo vs złoto" (źródła, rola) | Jakościowo, bez liczb | NIEZWERYFIKOWANE |
| Przykład „próg 1→2 = 4,5×2×1 = 9 jedn., przy 4/t → ~3 tury (9÷4)" | `wealth.ts` wealthProg(poziom 1, epoka 1) = 4,5·2·1 = 9 (wiersz 1 powyżej); 9÷4 = 2,25 → 3 tury zaokr. w górę | ZGODNE |

---

## 2. Bunt (`pojecia/bunt`)

Progi i mnożniki wg `society-params.json` (`porzadek_*`, normal) i `order.ts` (`orderEffects`, tier `unrest`).

| Twierdzenie (wiki) | Pin (kod / dane) | Status |
|---|---|---|
| Niepokój 30–49%: praca ×0,85 | `porzadek_kara_produkcja_t1` normal −0,15 → ×0,85 | ZGODNE |
| Niepokój: złoto (Pieniądz) ×0,85 | `porzadek_kara_pieniadz_t1` normal −0,15 | ZGODNE |
| Niepokój: nauka ×0,85 | `porzadek_kara_nauka_t1` normal −0,10 → ×0,90 | ROZJAZD |
| Niepokój: kultura ×0,85 | `porzadek_kara_kultura_t1` normal −0,10 → ×0,90 | ROZJAZD |
| Niepokój: wzrost ludności ×0,75 | `porzadek_kara_wzrost_t1` normal −0,25 → ×0,75 | ZGODNE |
| Bunt przy 10–29% | `porzadek_prog_bunt_skrajny_pct` normal = **12**. `porPctBand`: „bunt" dla 12–29. | ROZJAZD |
| Migracja ~5% ludności/turę przy 10–29% | `porzadek_ryzyko_buntu_t1` normal = **0,03** (3%/t, migracja ±1 pop). Opis JSON sam mówi „~5% normal" — wewnętrzna sprzeczność danych. | ROZJAZD |
| Bunt skrajny: porządek <10% przez 2 tury → rebelia AI | Próg 12 (normal). `porzadek_grace_tur_bunt` normal = **3** (nie 2). | ROZJAZD |
| Przykład: pop 6, porządek 35%, praca 20→17, złoto 8→6,8, wzrost 4→3 | Arytmetyka i mnożniki zgodne | ZGODNE |
| Przykład: 10 tur → ~30 pracy, ~12 ¤, ~10 żywności | Arytmetyka poprawna | ZGODNE |
| Przykład: porządek 7% → „bunt skrajny", 2 tury grace z alertem | 7 < 12 (`porzadek_prog_bunt_skrajny_pct` normal) → skrajny zgodnie z progiem pinu; grace = `porzadek_grace_tur_bunt` normal **3**, nie 2 | ROZJAZD |
| „Naprawa w 3 turach": kary znikają od razu (bez opóźnienia) | Nie zweryfikowano w tej rundzie (brak sprawdzenia natychmiastowości zdjęcia kar w `order.ts`) | NIEZWERYFIKOWANE |
| Naprawa: suwak 50% Zamożności = „+4 pkt Szczęścia (normal)" | `luksusHappinessBonus(50, normal)` = −10 + 20·(50/90) ≈ **+1,1** (`szczescie_podatki_min` −10, `_max` +10, `_prog_pct` 90) | ROZJAZD |
| Naprawa: 2 jednostki (+prawo) → porządek 72% | Wymaga pełnego przeliczenia PrawPct/PorPct | NIEZWERYFIKOWANE |
| Dźwignie: teatr, łaźnia, świątynia → szczęście | `buildings.json`: `dajeSzczescie: true` dla `teatr`, `laznia_publiczna`, `swiatynia`. Uwaga: `teatr` ma `suppressed: true` (merge do Akademii) — wiki wskazuje budynek nieaktywny jako osobny. | ZGODNE |
| Dźwignie: wojsko w mieście → prawo | `prawo_garnizon_per_jednostka` normal 20, `prawo_garnizon_cap_jednostek` 5 | ZGODNE |

---

## 3. Porządek (`pojecia/porzadek`)

| Twierdzenie (wiki) | Pin (kod / dane) | Status |
|---|---|---|
| Porządek % ≈ 0,5 × Szczęście + 0,5 × Prawo (normal) | `porzadek_waga_szczescie` 0,5, `porzadek_waga_prawo` 0,5; `computePorPct` | ZGODNE |
| ≥90% = Ład | `porPctBand` / `tierFromPorPct`: `p >= 90` → `lad` / `order` | ZGODNE |
| 70–89% = Spokój | `porPctBand`: `p >= 70` → `spokoj` | ZGODNE |
| 50–69% = Napięcie | `porPctBand`: `p >= 50` → `napiecie` | ZGODNE |
| 30–49% = Niepokój | `porPctBand`: `p >= 30` → `niepokoj` | ZGODNE |
| 10–29% = Bunt | `porPctBand`: próg 12 (normal), nie 10 | ROZJAZD |
| 0–9% = Bunt skrajny, grace 2 tury | Próg 12, grace 3 (normal) | ROZJAZD |
| Ład: „bonus pracy i Daniny ×1,10" | Praca ×1,10: ZGODNE (`porzadek_bonus_produkcja_t2` 0,10). Drugi mnożnik trafia w `tradeMult` (Handel ×1,10, `bonusHandelT2`), nie w Daniny/Pieniądz (`pieniadzMult` = 1 dla `order`). | ROZJAZD |
| Napięcie: praca ×0,95 | `porzadek` `napiecie`: `productionMult: 0.95` | ZGODNE |
| Niepokój: „plony ×~0,85, wzrost ×0,75, chip buntu" | Mnożnik na `productionMult` (praca i produkcja ogólnie). Nauka/kultura ×0,90 (patrz §2). Wzrost ×0,75 ZGODNE. | ROZJAZD |
| Prawo podnoszą: wojsko, sąd, pretorium, niski bunt | `prawo_sad` 19, `prawo_pretorium` 38 (normal) — ZGODNE. „Niski bunt" jako źródło Prawa nie zweryfikowano. | NIEZWERYFIKOWANE |
| Przykład: 0,5×56 + 0,5×70 = 63 → Napięcie | Arytmetyka i tier poprawne | ZGODNE |
| Przykład: 20 pracy ×0,95 = 19 | Arytmetyka poprawna | ZGODNE |
| Przykład: 10 tur przy Napięciu → −10 pracy (−1/t) | 20 × (1 − 0,95) = 1/t × 10 tur = 10 | ZGODNE |
| Przykład: 0,5×70 + 0,5×70 = 70 → Spokój | Poprawne | ZGODNE |
| Przykład: 0,5×20 + 0,5×90 = 55 → Napięcie | Poprawne | ZGODNE |

---

## 4. Spichlerz — zapasy i wzrost (`pojecia/spichlerz`)

| Twierdzenie (wiki) | Pin (kod / dane) | Status |
|---|---|---|
| Koszt budowy 20 pracy | `buildings.json` `spichlerz`: `kosztBudowy` 20 | ZGODNE |
| +2 żywności/t (poziom 1) | `buildings.json` `spichlerz`: `baza.zywnosc` 2 | ZGODNE |
| Po awansie zostaje 50% bufora (normal) | `econ-params` `spichlerz_zachowanie_po_wzroscie` normal 0,5; `economy.ts` (Spichlerz ×0,5) | ZGODNE |
| Bez Spichlerza bufor zeruje się po +1 mieszkańcu | `economy.ts` (doc B5-SPICH): bez Spichlerza bufor → 0 | ZGODNE |
| Próg wzrostu 20 + N×16 (normal) | `economy.ts:1217`: `baseThreshold = 20 + ludnosc × progWzrostuWspolczynnik` (16) | ZGODNE |
| Pojemność 100 × N Spichlerzy (normal) | Klucz `spichlerz_pojemnosc_zapasow_panstwa` = 100 jest **martwy** (brak odwołania w `gra/src`). Kod: `empire-food.ts` `computeCentralFoodCap` = `magazyn_centralny_baza_zywnosc` (1000) + 100 × Magazyn + Σ Spichlerz I 1000 / Spichlerz II 1500, każde × `magazynEraMultiplier` (×2 za epokę właściciela). | ROZJAZD |
| Drugi Spichlerz: limit 200 (100 × 2) | Kod: 1000 za Spichlerz I, 1500 za II, plus baza 1000 | ROZJAZD |
| Wojsko przy zapasach <0: −8% max HP/t (głód) | `empire-food.ts`: `glod_wojska_hp_frac` 0,08; karencja 3 tury; stat ×0,75 (nieopisane w wiki) | ZGODNE |
| Bez Spichlerza udział wojska „przepada co turę" | `centralCapBaza` = 1000 bez względu na Spichlerz (`computeCentralFoodCap`), czyli pula państwa się nie zeruje. Klucz `armia_odklad_bez_spichlerza` (0,5) nie jest czytany w `gra/src`. | ROZJAZD |
| Rekrutacja nigdy nie blokowana brakiem zapasów | Nie zweryfikowano | NIEZWERYFIKOWANE |
| Przykład: pop 3, próg 68, bufor 66/68 | Próg 20 + 3×16 = 68 poprawny | ZGODNE |
| Przykład: 12 żywn./t → 8,4 rozwój / 3,6 wojsko (70/30) | Arytmetyka poprawna. Domyślny podział 70/30 — patrz §7. | ZGODNE |
| Przykład: awans 68 → 34 (ze Spichlerzem), 68 → 0 (bez) | Zgodne z 50% i 0% | ZGODNE |
| Przykład: zapasy 45/100 → 48,6/100 | Mianownik 100 nieaktualny (cap ≥1000) | ROZJAZD |
| Drugi Spichlerz: +15/t, pełny magazyn w ~10 tur | Przy capie 1500 i +15/t wypełnienie zajmuje ~100 tur | ROZJAZD |
| Koszt 20 pracy, +2 żywn. poz.1, ~2 tury przy 10 pracy/t | Arytmetyka poprawna (20 / 10) | ZGODNE |
| SP1–SP6 (2026-07-01), SP3 „wystarczy 1 Spichlerz w imperium" | Warunek „≥1 Spichlerz" liczony per miasto (`maSpichlerz`). Ustalenie SP3 nie zweryfikowano wprost. | NIEZWERYFIKOWANE |

---

## 5. Suwak handlu (`pojecia/suwak-handlu`)

| Twierdzenie (wiki) | Pin (kod / dane) | Status |
|---|---|---|
| Domyślnie 60% skarbiec · 20% nauka · 20% zamożność | `cities.ts` `DEFAULT_PODZIAL_HANDLU` = 60/20/20 (nauka 20, pieniądz 60, luksus 20). `econ-params` `suwak_handel_*_domyslnie` = 60/20/20 | ZGODNE |
| Ten sam domyślny podział na wszystkich trudnościach | `econ-params`: identyczny w easy / normal / hard | ZGODNE |
| Tabela „Szczęście od udziału Zamożności" (10 przedziałów, łatwy/normal/trudny, normal −1…+8) | Pin: skala LINIOWA (G7). `luksusHappinessBonus` = min + (max − min)·min(1, udział/prog). Parametry: `szczescie_podatki_min` −10, `_max` +10, `_prog_pct` 90, takie same dla wszystkich trudności. 45% = 0. | ROZJAZD |
| Przy 20% zamożności: +1 pkt (normal) | −10 + 20·(20/90) ≈ **−5,6** | ROZJAZD |
| 0–9%: normal −1 (wiki) | −10 + 20·(0/90) = **−10** (wiki −1) | ROZJAZD |
| 40% zamożności: normal +3 (wiki) | ≈ **−1,1** | ROZJAZD |
| 50% zamożności: normal +4 (wiki) | ≈ **+1,1** | ROZJAZD |
| Łatwy i trudny mają inne wartości (wiki) | Kod: te same parametry na wszystkich trudnościach | ROZJAZD |
| Mennica ×2,0 / ×1,5 / ×1,0 | `econ-params` `globalne.mennica_mnoznik_po_walucie` = 2 / 1,5 / 1 | ZGODNE |
| Mennica w stolicy, wymaga Targowiska i dostępu do złota | `buildings.json` `mennica`: „Tylko w stolicy… dostęp do Złota… Targowisko w stolicy" | ZGODNE |
| Waluta + Mennica (bramka AND), nazwa Danina → Podatek | `econ-params` opis `mennica_mnoznik_po_walucie`: bramka AND | ZGODNE |
| Korupcja: sufit 38 / 50 / 62% | `econ-params` `korupcja_cap` = 38 / 50 / 62 | ZGODNE |
| Sąd, Pretorium, Pałac: −30 pp każdy | `economy.ts` `KORUPCJA_REDUKCJA_NA_BUDYNEK` = 0,30, sufit 0,60 | ZGODNE |
| Praca nigdy nie objęta korupcją | Nie zweryfikowano | NIEZWERYFIKOWANE |
| Przykład 10 Daniny/t: 60/20/20 → 6/2/2; bonus +1 (20–29%) | Podział poprawny, bonus z tabeli nieaktualnej | ROZJAZD |
| Przykład 30/20/50 → +4 (50–59%) | Kod: ≈ +1,1 | ROZJAZD |
| Scenariusz 25% → 40/20/40 = +2 pkt więcej | Kod: 25% ≈ −4,4 → 40% ≈ −1,1 (≈ +3,3 pkt; wiki podaje +2 względem +1 → +3) | ROZJAZD |
| Koszt 6 → 4 skarbca/t = −20 ¤ w 10 turach | Arytmetyka poprawna | ZGODNE |
| Pieniądz z Targowiska dzieli się suwakiem | `targowisko_praca_na_pieniadz_mnoznik` istnieje; podział nie zweryfikowany | NIEZWERYFIKOWANE |
| Przykład „miasto stołeczne 20/20/60" (skarbiec/nauka/zamożność): suma podziału | 20 + 20 + 60 = 100; trzy kategorie jak w wierszu 1 tej sekcji | ZGODNE |
| Przykład „stołeczne 20/20/60 → dużo szczęścia" | Pin: udział Zamożności 60% → `luksusHappinessBonus` = −10 + 20·min(1; 60/90) = **+3,3** pkt. Wiki nie podaje liczby („dużo") | NIEZWERYFIKOWANE |
| Przykład „miasto graniczne 80/10/10 → więcej złota, ryzyko buntu" | Suma 100 ZGODNE. Pin: 10% Zamożności → −10 + 20·(10/90) = **−7,8** pkt. Związek z buntem nie zweryfikowany | NIEZWERYFIKOWANE |

---

## 6. Suwak pracy (`pojecia/suwak-pracy`)

| Twierdzenie (wiki) | Pin (kod / dane) | Status |
|---|---|---|
| Domyślnie 70% budynki · 30% teren | `cities.ts` `DEFAULT_PODZIAL_PRACY.procentBudynki` = 70; pula imperium = 100 − 70 = 30 | ZGODNE |
| Praca na teren → pula imperium (tryb Budowa) | `cities.ts`: `procentPuliImperium` = 100 − `procentBudynki` | ZGODNE |
| Spichlerz kosztuje 20 pracy | `buildings.json` `spichlerz` `kosztBudowy` 20 | ZGODNE |
| Mury kosztują 35 | `buildings.json` `mury` `kosztBudowy` 35 | ZGODNE |
| Farma kosztuje 20 pracy | `terrain-improvements.json` `farma` `koszt_praca` 20 | ZGODNE |
| Tartak kosztuje 25 pracy | Nie zweryfikowano | NIEZWERYFIKOWANE |
| Przykład 14 pracy: 70/30 → 9,8 ≈ 10 / 4,2 | Arytmetyka poprawna | ZGODNE |
| Przykład 50/50 → 7 / 7; 90/10 → 12,6 / 1,4 | Arytmetyka poprawna | ZGODNE |
| Spichlerz przy 70/30 → 2 tury (10 + 10) | Arytmetyka poprawna | ZGODNE |
| 3 farmy po 20 (60) przy 7/t → ~9 tur | 60 / 7 ≈ 8,6 | ZGODNE |
| „Błąd: 90/10 + brak ulepszeń → głód" | Jakościowo, nie zweryfikowano | NIEZWERYFIKOWANE |

---

## 7. Suwak żywności (`pojecia/suwak-zywnosci`)

| Twierdzenie (wiki) | Pin (kod / dane) | Status |
|---|---|---|
| Domyślnie 70% rozwój miast / 30% wojsko (SP5) | Pin: domyślny suwak to **Wyżywienie** `poziomRacji` = 4 w skali 0–6 (`population-growth-v85.ts` `DEFAULT_POZIOM_RACJI`, `WYZYWIENIE_MAX` 6). Legacy `DEFAULT_PROCENT_ROZWOJ_WYZYWIENIE` = round(4/6·100) = **67**. Komentarz `DEFAULT_PROCENT_ROZWOJ` mówi 100. Brak 70/30 jako wartości domyślnej. | ROZJAZD |
| Próg wzrostu 20 + N×16 (normal) | `economy.ts:1217` | ZGODNE |
| Rozwój zapełnia bufor | `economy.ts` doc: bufor kumuluje się z `zywnoscNetto` | ZGODNE |
| Wojsko karmi magazyn państwa (Spichlerz) lub przepada | Pula państwa ma bazę 1000 bez Spichlerza (§4). Mechanizm „przepada" nie potwierdzony. | ROZJAZD |
| Nie blokuje rekrutacji | Nie zweryfikowano | NIEZWERYFIKOWANE |
| Przykład pop 2: próg 52; 70/30 → 7 / 3; 90/10 → 9 / 1; 50/50 → 5 / 5 | Arytmetyka poprawna (przy założeniu 10 żywn./t) | ZGODNE |
| 52 ÷ 7 ≈ 8 tur do pełnego bufora | Poprawne | ZGODNE |
| Wojsko 3/t × 10 tur = 30 w zapasach | Arytmetyka poprawna | ZGODNE |
| Armia 5 jedn. × 1 żywn./t → zapas na 6 tur | 30 / 5 = 6 poprawne, ale koszt 1 żywn./t jednostki nie zweryfikowany | NIEZWERYFIKOWANE |
| Awans 2 → 3: bufor 52 → 26 (ze Spichlerzem) lub 0 | 50% i 0% zgodne | ZGODNE |

---

## 8. Szczęście (`pojecia/szczescie`)

| Twierdzenie (wiki) | Pin (kod / dane) | Status |
|---|---|---|
| Maksimum epoki: Kamień 12 · Brąz 18 · Żelazo 24 | `szczescie_max_epoka` normal = **30 / 50 / 70**. Dodatkowo `szMaxForCity` = base × (1 + 0,04)^max(0, pop − 2) (`szczescie_max_pop_wspolczynnik`). | ROZJAZD |
| Szczęście % = 100 × netto / SzMax | `society-breakdown.ts` `pctFromNetto` | ZGODNE |
| Cap 120% | `szczescie_pct_cap` normal 120 | ZGODNE |
| Netto nie mniej niż 0 | `clampPct` nie zweryfikowano | NIEZWERYFIKOWANE |
| Świątynia +1 | `swiatynia` `dajeSzczescie: true` → ryczałt **+1** (`BUILDING_HAPPINESS_BASE_PER_BUILDING` = 1, `economy.ts`) **plus** `baza.zadowolenie` = 2 z `buildings.json` → razem ≈ **+3** na poziomie 1 (wg docstringu `economy.ts` ~l. 527–530; przelicznik poziomu nie zweryfikowany wprost). Wiki podaje +1 | ROZJAZD |
| Teatr / amfiteatr +1 | `teatr` `dajeSzczescie: true`, ale `suppressed: true` (merge do Akademii). Amfiteatr nie występuje w `buildings.json` jako osobny wpis. | ROZJAZD |
| Luksus (co 5 jedn. w puli) +1 | Nie zaimplementowane. Pin: Wealth wg G6 (§1). | ROZJAZD |
| Zamożność w Daninie: tabela 10 przedziałów (−1…+8 normal) | Skala liniowa −10…+10 (§5) | ROZJAZD |
| Własna religia ≥50% = +2 | `culture-religion.ts` / `society-breakdown.ts` `proporcjonalneSzczescie`: 2·x·udział − x, x = 10 / 16 / 23 per epoka. Przy 50% wynik 0; przy 100% +x. | ROZJAZD |
| Własna kultura ≥80% = +1 | Ta sama formuła proporcjonalna | ROZJAZD |
| Osiedle pop 1→4: +3 / +2 / +1 / 0 | `szczescie_bonus_osiedle_pop` normal **[15, 12, 8, 5]**, pop ≥ 5 = 0 | ROZJAZD |
| Wojna −3 | `szczescie_kara_wojna` = **−5** (G9) | ROZJAZD |
| Zagęszczenie (pop − 4) × −1 | Usunięte (G12). Próg `szczescie_prog_zagęszczenia` = 5 (normal) to już tylko fallback. | ROZJAZD |
| Obca kultura dominuje −1 / obca religia −2 | Usunięte jako osobne minusy (G5), zastąpione przez skalę ±x | ROZJAZD |
| Wysokie podatki (0–19% ujemne na normal) | Kara jest liniowa od −10 przy 0% (§5) | ROZJAZD |
| Przykład: Brąz, pop 5, netto = 1 + 3 − 3 − 1 = 0 → 0% | Kod: SzMax = 50 × 1,04³ ≈ 56,2; wszystkie składniki (zagęszczenie, Osiedle, podatki, wojna) inne | ROZJAZD |
| Przykład: pop 3, Osiedle +2, świątynia +1 → netto +3 → 17% | Osiedle w kodzie = 8 (pop 3), SzMax w kodzie = 50 × 1,04 ≈ 52 | ROZJAZD |
| Strategia: „przed pop 5 → Akwedukt, inaczej zagęszczenie −1" | Zagęszczenie usunięte (G12) | ROZJAZD |
| Scenariusz „zamożność 50% → netto +1 → 100×1/18 ≈ 6%" (SzMax 18) | Pin: SzMax Brąz normal (pop ≤ 2) = **50** (`szczescie_max_epoka`), nie 18. Udział 50% = +1,1 pkt (§5). 1/50 = **2%** | ROZJAZD |
| Scenariusz „Teatr +1 → netto +2 → ≈11%" | Teatr `suppressed: true` (wiersz §8 „Teatr / amfiteatr"). Przy SzMax 50: 2/50 = **4%**, nie 11% | ROZJAZD |
| Scenariusz „zakończ wojnę (+3 netto) → netto +5 → ≈28%" | Pin: kara wojny = **−5** (`szczescie_kara_wojna`, G9), nie −3. Przy SzMax 50: 5/50 = **10%**, nie 28% | ROZJAZD |
| „Cel ≥50% (netto ≥9 pkt)" | Pin: 50% z SzMax 50 = netto ≥ **25** pkt (Brąz, pop ≤ 2) | ROZJAZD |

---

## 9. Drzewko technologii (`pojecia/drzewko-technologii`)

| Twierdzenie (wiki) | Pin (kod / dane) | Status |
|---|---|---|
| 32 technologie | `tech.json` `technologie`: 32 wiersze | ZGODNE |
| 3 epoki: Kamień / Brąz / Żelazo | `tech.json`: Kamień 12, Brąz 12, Żelazo 8 | ZGODNE |
| Poziomy: Kamień 1–3, Brąz 4–6, Żelazo 7–9 | `tech.json`: Kamień (1, 2, 3), Brąz (4, 5, 6), Żelazo (7, 8, 9) | ZGODNE |
| Model liniowy | `tech.json` `drzewko_model` = „liniowe" | ZGODNE |
| Brązownictwo: Kamień, Poziom 3 (kapston) | `Brązownictwo`: Kamień, Poziom 3 | ZGODNE |
| Hutnictwo żelaza: Brąz, Poziom 6 (kapston) | `Hutnictwo żelaza`: Brąz, Poziom 6 | ZGODNE |
| Łucznictwo: Kamień, Poziom 2, koszt bazowy 14 PN | `Łucznictwo`: Kamień, **Poziom 3**, koszt **56 PN** | ROZJAZD |
| Łucznictwo wymaga Łowiectwa (Kamień, Poziom 1) | `Łowiectwo`: Kamień, Poziom 1, koszt 5. Prereq `Łucznictwo` = Łowiectwo. | ZGODNE |
| Przy tempie Standardowym Łucznictwo = 28 PN | 56 × 2 = **112 PN** | ROZJAZD |
| Tempo: Szybka ×1, Standardowa ×2, Długa ×4 | `tech.json` `tempo_gry`: 1 / 2 / 4; `tech-tempo.ts` | ZGODNE |
| Przykład 12 PN → 12 / 24 / 48 | Arytmetyka poprawna (koszt hipotetyczny) | ZGODNE |
| Zasada 1 (bramka epoki) i Zasada 2 (bramka Poziomów) w `research.ts` | Logika, nie liczba. `research.ts` nie czytany w tej rundzie. | NIEZWERYFIKOWANE |
| Zasada 3: `awansDoEpoki` na kapstonie epoki | Kapstony to Brązownictwo (Kamień, P3) i Hutnictwo żelaza (Brąz, P6). Pole `awansDoEpoki` nie zweryfikowano. | NIEZWERYFIKOWANE |
| Ekran bez linii zależności (2026-07-23) | UI, poza zakresem liczbowym | NIEZWERYFIKOWANE |

---

## 10. Szlaki handlowe (`pojecia/szlaki-handlowe`)

| Twierdzenie (wiki) | Pin (kod / dane) | Status |
|---|---|---|
| Trasa wymaga pokoju; wojna zrywa trasę | `trade-routes.ts` (nagłówek E3/E6): trasa ZEWNĘTRZNA wymaga pokoju **oraz** aktywnej Umowy Szlaków (`RodzajTraktatu.UmowaSzlakow`, C-HANDEL-UMOWA=B). Wojna zrywa trasę. | ZGODNE |
| Uwaga redakcyjna wiki: „trasa wymaga tylko pokoju; Umowa Handlowa to osobny budulec zaufania" | Odwrotnie: pin wymaga traktatu dla trasy zewnętrznej (C-HANDEL-UMOWA=B). Uwaga wiki jest nieaktualna. | ROZJAZD |
| Limit tras = liczba zbudowanych budynków handlowych (0 budynków = 0 tras) | `trade-routes.ts`: istnienie trasy limitowane przez `tradeRouteExistenceLimitForCity` = **1 slot bazowy + 1 za budynek** (R-HANDEL-LIMIT-TRAS-PELNY-Q1, 2026-09-04). `tradeRouteLimitForCity` (budynki) gatinguje tylko bonus 5%. | ROZJAZD |
| Trasy wyłącznie zewnętrzne (własne ↔ własne nigdy) | `trade-routes.ts`: trasy WEWNĄTRZ jednego właściciela są dozwolone (miasto ↔ miasto, bez traktatu) | ROZJAZD |
| Trasy morskie wymagają Portu po obu stronach | `trade-routes.ts` doc: morskie = Port po obu stronach + BFS po wodzie | ZGODNE |
| +5% Handlu za każdą trasę (kumulatywnie), obu stronom | `TRADE_ROUTE_BUILDING_BONUS_RATE` = 0,05 per trasa, tylko gdy `budynekOdblokowany` (pokrycie budynkowe). Wiki nie podaje tego warunku. | ZGODNE (z zastrzeżeniem) |
| Dochód z dystansu (`tradeRouteDistanceIncome`, `econ-params.json`) | Nie zweryfikowano wartości | NIEZWERYFIKOWANE |
| Dostęp do brązu / żelaza / konia przez trasę (E3b) | Nie zweryfikowano w tej rundzie | NIEZWERYFIKOWANE |
| Umowa Handlowa: zerwanie kosztuje **−10** zaufania (umowa handlowa) vs **−15** (inny traktat) | `diplomacy-penalty-preview.ts:168`: `pushLine(lines,'zaufanie', isTrade ? -10 : -15, …)`. `isHandelTreatyKind` (l. 65–68) obejmuje `RodzajTraktatu.UmowaSzlakow`. Wiki (`wikiM`) podaje te same −10 / −15. (Poprzednia wersja audytu błędnie twierdziła, że liczb brak.) | ZGODNE |
| Nazwa „Umowa Handlowa" (wiki) vs kod „Umowa Szlaków" | Kod: `RodzajTraktatu.UmowaSzlakow` (`diplomacy-display.ts:356`, `diplomacy-treaties.ts:216`). Wiki używa nazwy „Umowa Handlowa", kod „Umowa Szlaków". Rozbieżność nazwy, nie wartości | ROZJAZD |
| Zerwanie umowy szlaków: −15 **Relacja** (opis w `diplomacy.json` akcja 5) | Opis tekstowy w `diplomacy.json`: „Zerwanie: −15 Relacja, −10 Zaufanie". Kara Relacji w kodzie nie zweryfikowana w tej rundzie | NIEZWERYFIKOWANE |
| Przykład: limit 1 trasa (1 Targowisko po każdej stronie) | Wg kodu slotów = 1 + 1 = 2 po każdej stronie | ROZJAZD |
| Kiedyś 5% Handlu i dystans 6 heksów → trasa aktywna | Warunki traktatu i slotów inne niż w wiki | ROZJAZD |

---

## 11. Lista niedokończonych (jawna)

Tych twierdzeń nie domknięto w rundzie 1. Wymagają dalszej pracy w kolejnej rundzie lub decyzji właściciela.

1. Bogactwo: immunitet hard (D18); tabela źródeł „Bogactwo vs złoto".
2. Bunt: „2 jednostki → porządek 72%" (przeliczenie PrawPct).
3. Porządek: „niski bunt" jako źródło Prawa.
4. Spichlerz: rekrutacja nie blokowana; SP3 „wystarczy 1 Spichlerz w imperium" (ustalenie decyzyjne).
5. Suwak handlu: praca nie objęta korupcją; Targowisko i dzielenie Pieniądza.
6. Suwak pracy: tartak 25 pracy; „błąd 90/10" (jakościowo).
7. Suwak żywności: „nie blokuje rekrutacji"; koszt żywności jednostki (1 żywn./t).
8. Szczęście: netto ≥ 0 (clamp). (Ryczałt budynku +1 zweryfikowany; Świątynia — ROZJAZD, patrz §8.)
9. Drzewko: bramki Zasady 1–2 w `research.ts`; pole `awansDoEpoki`; ekran UI.
10. Szlaki: dystans (`tradeRouteDistanceIncome`); dostęp do surowców przez trasę (E3b); kara Relacji −15 umowy szlaków (`diplomacy.json` akcja 5). (Zaufanie −10 / −15 zweryfikowane — ZGODNE, §10.)
11. Bunt: „Naprawa w 3 turach — kary znikają od razu" (natychmiastowość w `order.ts`).
12. Suwak handlu: „dużo szczęścia" (stołeczne 20/20/60) i „ryzyko buntu" (graniczne 80/10/10) — sformułowania jakościowe bez liczby w wiki.

---

## 12. Wnioski dla Evaluatora

- Najliczniejsze rozjazdy wiążą się z przebudową Szczęścia (G1–G15, 2026-09-05). Pięć haseł ma tabele lub progi z wartościami sprzed przebudowy: Szczęście, Suwak handlu, Bogactwo, Porządek i Bunt (progi 10/12, grace 2/3, zagęszczenie, wojna −3/−5, Osiedle). Najpoważniejsze to tabela Zamożności w Suwaku handlu i Szczęściu (wiki +1 przy 20%, kod ≈ −5,6) oraz SzMax (wiki 12/18/24, kod 30/50/70 z wzrostem per pop).
- Spichlerz: pojemność 100 × N opiera się na martwym kluczu JSON. Kod używa 1000 / 1500 per Spichlerz oraz bazy 1000.
- Drzewko: rozjazd w danych Łucznictwa (Poziom 3, 56 PN, nie Poziom 2, 14 PN).
- Szlaki: wiki opisuje trasę jako wymagającą pokoju, a limit slotów jako równy liczbie budynków. Kod wymaga Umowy Szlaków i ma slot bazowy +1.
- Wewnętrzna sprzeczność danych: `porzadek_ryzyko_buntu_t1` = 0,03 przy opisie „~5%" (Bunt, migracja).
- Dispatch: Zamożność ma wykład wyłącznie w Bogactwie i Suwaku handlu, a Garnizon jest poza grupą (rozjazd kosztu potwierdzony).

# P1.16F — CivPedia „Cywilizacje" (9 haseł) wobec `gra/data/civ-matrix.json`

**Temat:** `R-RUSTPORT-P1-16F-CIVPEDIA-CYWILIZACJE-Q1`
**Runda:** 1/5 (Operator, Haiku 5.5 medium)
**Pin:** web `edb8fb56` (wszystkie odczyty przez `git show edb8fb56:…`, nie z working tree)
**Zakres:** 9 haseł kategorii `Cywilizacje` (Celtowie, Chińczycy, Egipt, Germanie, Grecy, Inkowie, Rzymianie, Sumerowie, Zulusi). Pomijam „Strategia dla gracza" (zamknięte w P1.16d-BOILERPLATE §4, 9/9 identyczna).
**Źródło tekstu:** `gra/src/data/wikiBundle.json` (pin), `encyklopedia[]`, `category == "Cywilizacje"`, pola `wikiM` oraz `full` (sekcja „Wzory": mnożnik handlu/waluty; `full` zawiera też dodatkowe linie, które sprawdzono).
**Źródło wartości:** `gra/data/civ-matrix.json` (pin), `cywilizacje[].params` (wartość jawna lub `defaults`).

---

## 1. Metoda i definicje

**Kierunek i formuła.** `civ-matrix.json` `_meta`: `formula_mul_proc = "wynik = baza * (1 + wartosc)"`. Dla `mul_proc` wartość dodatnia zwiększa wynik, ujemna zmniejsza. Dla parametrów kosztu (zbiór `HARMFUL` w `gra/src/game/civ-matrix-semantic.ts`, ok. l. 206–215: `walka_koszt_rekrutacji_proc`, `eko_korupcja_proc`, `prod_koszt_budynku_proc`, `prod_koszt_jednostki_proc`, `prod_rush_koszt_proc`, `lud_spadek_proc`, `mp_koszt_jednostki_proc`) wartość dodatnia oznacza **wyższy koszt** (szkodliwe dla gracza). Kierunek bonusu nie jest brany z nazwy pola, tylko z formuły i zbioru HARMFUL.

**Mnożnik waluty** `meta_mnoznik_waluta` ma formułę `mul_abs` (wynik = baza × wartość); domyślnie 2 (`defaults`).

**Status zgodności wobec CivPedii:**
- `ZGODNE` — pole istnieje, wartość i kierunek jak w CivPedii.
- `NIEZGODNE-WARTOŚĆ` — pole istnieje, wartość liczbowa inna.
- `NIEZGODNE-KIERUNEK` — pole istnieje, znak przeciwny (koszt zamiast redukcji itd.).
- `NIEZGODNE` (bez pola) — CivPedia podaje liczbę, dane mają 0/default.
- `BRAK-POLA` — CivPedia podaje efekt, którego nie ma w `civ-matrix.json` jako osobnego pola.
- `CZĘŚCIOWO` — wartość się zgadza, ale warunek lub zakres z CivPedii nie jest zakodowany w danych, albo pole istnieje, lecz runtime go nie stosuje.

**Status konsumenta (runtime, edb8fb56):**
- `REAL` — wpięte w runtime (klasyfikator `civ-matrix-semantic.ts` = `REAL_GAMEPLAY`/`PROVEN_CONSUMERS`, potwierdzone w `civ-bonuses.ts` `MATRIX_COMBAT_SPECS`).
- `BLOCKED` — wyłączone z runtime: `civ-bonuses.ts` ok. l. 288–291, zbiór `excludedG1` = `walka_atak_lukownicy, walka_atak_piechota, walka_dystans_lukownicy, walka_hp_piechota, walka_hp_rydwany, walka_obrona_piechota, walka_pancerz_piechota` jest pomijany w pętli `MATRIX_COMBAT_SPECS`. Potwierdzone kodem (nie tylko klasyfikatorem).
- `UNWIRED` — brak literalnego konsumenta w `gra/src` (`git grep` na edb8fb56: 0 trafień dla kluczy `eko_*`, `prod_koszt_budynku_proc`, `prod_koszt_jednostki_proc`, `prod_szybkosc_budynku_proc`, `eko_kultura_proc`).
- `DEAD` — klasyfikator `DEAD_UNWIRED_COMBAT` (wszystkie 15 cywilizacji równe defaultowi).
- `LIVE-ROZBIEŻNOŚĆ` — kod stosuje pole, a klasyfikator etykietuje je inaczej (patrz §4).

---

## 2. Tabela bonusów liczbowych (wszystkie pozycje z CivPedii)

Legenda kolumn: **Pole/wartość** = klucz `civ-matrix.json` i wartość dla danej cywilizacji. **Runtime** = status konsumenta.

### 2.1 Celtowie

| ID | Bonus wg CivPedii (cytat skrócony) | Pole / wartość w danych | Status zgodności | Runtime | Uwagi |
|---|---|---|---|---|---|
| C-1 | „Brawura szarży: +25% ataku piechoty przy pierwszym uderzeniu" | `walka_atak_piechota_runda_szarzy` = +0.25 (mul_proc) | ZGODNE | REAL | Mapowanie „pierwsze uderzenie" = runda szarży (`isChargeRound`), do potwierdzenia (§4 pkt 1). |
| C-2 | „Długi miecz galijski: +15% Uderzenia" | `walka_uderzenie_piechota` = +0.40 | NIEZGODNE-WARTOŚĆ (15% vs 40%) | REAL | Runtime stosuje +40%. |
| C-3 | Mnożnik handlu/waluty „1.9" (`full`, Wzory) | `meta_mnoznik_waluta` = 1.9 | ZGODNE | REAL | |
| C-4 | Profil AI: agresja „6/9" | `ai_agresywnosc` = 6 | ZGODNE | REAL | |

Bez liczby (pominięte): „Miecznik galijski… słabszy w przeciągłej obronie", „Słabsza strona: słabsza dyscyplina/obrona".

### 2.2 Chińczycy

| ID | Bonus wg CivPedii | Pole / wartość | Status zgodności | Runtime | Uwagi |
|---|---|---|---|---|---|
| Ch-1 | „Kusznik: +20% ataku i zasięgu łuczników/kuszników" | `walka_dystans_lukownicy` = +0.20 | CZĘŚCIOWO (wartość ZGODNA; „zasięg" BRAK-POLA — `walka_zasieg_proc` globalnie 0, DEAD) | BLOCKED | W grze efekt NIE działa (`excludedG1`). Wiki oznacza Kusznika jako NIEAKTUALNE (bonus dalej dotyczy Łucznika). |
| Ch-2 | „Konnica stepowa: +15% uderzenia kawalerii przy szarży" | `walka_uderzenie_kawaleria` = +0.15 | ZGODNE | REAL | |
| Ch-3 | Mnożnik „2.4" (`full`) | `meta_mnoznik_waluta` = 2.4 | ZGODNE | REAL | |
| Ch-4 | Profil AI: agresja „2/9" | `ai_agresywnosc` = 2 | ZGODNE | REAL | |

### 2.3 Egipt

| ID | Bonus wg CivPedii | Pole / wartość | Status zgodności | Runtime | Uwagi |
|---|---|---|---|---|---|
| E-1 | „Łucznicy na rydwanach: +20% ataku dystansowego" | `walka_dystans_lukownicy` = +0.20 | CZĘŚCIOWO (wartość ZGODNA) | BLOCKED | Efekt nie działa w grze (`excludedG1`). |
| E-2a | „Szybkie rydwany: +15% prędkości" | `walka_ruch_rydwany` = +0.15 | ZGODNE (dane) | LIVE-ROZBIEŻNOŚĆ (kod: `civMovementMultiplier`, cel rydwany) | Klasyfikator: UNWIRED. Kod: stosowane. |
| E-2b | (nie wymienione w CivPedii osobno) | `walka_ruch_bitwa_proc` = +0.15, cel `rydwany` dla `civKey === 'egipt'` | NIEZGODNE-WARTOŚĆ (w runtime) | LIVE-ROZBIEŻNOŚĆ | `civMovementMultiplier` (`civ-bonuses.ts` ok. l. 297–330) sumuje oba pola dla rydwanów: 0.15 + 0.15 = +0.30. Runtime `Math.round(base × (1 + 0.30))` (`battleScene.ts` ok. l. 7183), czyli +30% prędkości rydwanów wobec +15% w CivPedii. |
| E-3 | „…i zasięgu ataku rydwanów bojowych" +15% | `walka_dystans_rydwany` = +0.15 | ZGODNE | REAL | Zasięg: `civAttackRangeMultiplier` (`battleScene.ts` ok. l. 7186–7190). |
| E-4 | Mnożnik „2.1" (`full`) | `meta_mnoznik_waluta` = 2.1 | ZGODNE | REAL | |
| E-5 | Profil AI: agresja „4/9" | `ai_agresywnosc` = 4 | ZGODNE | REAL | |

Bez liczby (pominięte): Medżaj (Gwardia Faraona), „rydwany z dużym zapasem strzał".

### 2.4 Germanie

| ID | Bonus wg CivPedii | Pole / wartość | Status zgodności | Runtime | Uwagi |
|---|---|---|---|---|---|
| G-1 | „Zasadzka leśna: +25% ataku przy walce w lesie" | `walka_atak_piechota_teren_las` = +0.25 | ZGODNE | REAL | Warunek lasu egzekwowany przez `terrainIsForestOrJungle`. |
| G-2 | „…lub przy pierwszym ciosie z zasadzki" (+25%) | brak osobnego pola zasadzki; jedyne pole pierwszego uderzenia to `walka_atak_piechota_runda_szarzy` = +0.40 | BRAK-POLA (a jeśli mapować na runda_szarzy: NIEZGODNE-WARTOŚĆ 25% vs 40%) | REAL (pole runda_szarzy) | Do rozstrzygnięcia przez Evaluatora (§4 pkt 1). |
| G-3 | „Furia bojowa: +15% ataku na starciu" | `walka_atak_piechota_runda_szarzy` = +0.40 | NIEZGODNE-WARTOŚĆ (15% vs 40%) | REAL | Mapowanie „na starciu" = runda szarży: do potwierdzenia (§4 pkt 1). |
| G-4 | Mnożnik „1.7" (`full`) | `meta_mnoznik_waluta` = 1.7 | ZGODNE | REAL | |
| G-5 | Profil AI: agresja „6/9" | `ai_agresywnosc` = 6 | ZGODNE | REAL | |

Bez liczby (pominięte): „framea", „słabsze oblężnictwo".

### 2.5 Grecy

| ID | Bonus wg CivPedii | Pole / wartość | Status zgodności | Runtime | Uwagi |
|---|---|---|---|---|---|
| Gr-1 | „Falanga: +20% obrony piechoty przy ataku frontalnym" | `walka_obrona_piechota` = +0.20 | CZĘŚCIOWO (wartość ZGODNA; warunek „przy ataku frontalnym" nie jest zakodowany — pole bezwarunkowe) | BLOCKED | Efekt nie działa w grze (`excludedG1`). |
| Gr-2 | „Morskie szlaki handlowe: +15% złota z portów" | `eko_pieniadz_port_proc` = +0.15 | CZĘŚCIOWO (wartość ZGODNA) | UNWIRED | Brak konsumenta w `gra/src` na pinie. |
| Gr-3 | „…i dróg morskich" +15% złota | najbliżej `eko_handel_brutto_proc` = +0.15; dodatkowo `eko_pieniadz_proc` = +0.15 (ogólne złoto, nieopisane w CivPedii) | CZĘŚCIOWO (zakres niejasny; `eko_pieniadz_proc` wykracza poza tekst) | UNWIRED | Do potwierdzenia (§4 pkt 5). |
| Gr-4 | „Mniejsze państwa-miasta: wolniejsza odnowa poboru (−15% regen/turę)" | `mp_regen_proc` = −0.15 (mul_proc: baza × 0.85) | CZĘŚCIOWO (wartość i kierunek ZGODNE; warunek „mniejsze państwa-miasta" nie jest zakodowany) | REAL | „vs standard 10%" — baza 10% w kodzie NIE sprawdzona w tej rundzie (§4 pkt 4). |
| Gr-5 | Mnożnik „2.3" (`full`) | `meta_mnoznik_waluta` = 2.3 | ZGODNE | REAL | |
| Gr-6 | Profil AI: agresja „4/9" | `ai_agresywnosc` = 4 | ZGODNE | REAL | |

Bez liczby (pominięte): „odpiera szarżę kawalerii", „wolniejszy ruch" (brak pola ruchu Greków; wartości 0 w danych — do odnotowania, nie liczbowe).

### 2.6 Inkowie

| ID | Bonus wg CivPedii | Pole / wartość | Status zgodności | Runtime | Uwagi |
|---|---|---|---|---|---|
| I-1 | „Kalendarz słoneczny: +15% produkcji punktów nauki" | `eko_nauka_proc` = +0.15 | CZĘŚCIOWO (wartość ZGODNA) | UNWIRED | Brak konsumenta w `gra/src` na pinie. |
| I-2 | „Teren górski: +20% walki w lesie i dżungli" | `walka_atak_piechota_teren_las` = +0.20 | ZGODNE (zakres: wiki „walki", pole „atak") | REAL | Nazwa „Teren górski" niespójna z treścią (las/dżungla) — uwaga redakcyjna. |
| I-3 | Mnożnik „1.9" (`full`) | `meta_mnoznik_waluta` = 1.9 | ZGODNE | REAL | |
| I-4 | Profil AI: agresja „4/9" | `ai_agresywnosc` = 4 | ZGODNE | REAL | |

Bez liczby (pominięte): „Chaska", „Królewska Gwardia". Uwaga: wiki „Słabsza strona: brak konnicy i rydwanów" nie podaje liczby, a dane mają −0.15 dla `walka_atak_kawaleria` i `walka_atak_rydwany` (§3).

### 2.7 Rzymianie

| ID | Bonus wg CivPedii | Pole / wartość | Status zgodności | Runtime | Uwagi |
|---|---|---|---|---|---|
| R-1 | „Legion: +15% ataku piechoty szturmowej" | `walka_atak_piechota` = +0.15 | CZĘŚCIOWO (wartość ZGODNA) | BLOCKED | Efekt nie działa (`excludedG1`). |
| R-2 | „Legion: +15% pancerza piechoty" | `walka_pancerz_piechota` = +0.15 | CZĘŚCIOWO (wartość ZGODNA) | BLOCKED | Efekt nie działa (`excludedG1`). Potwierdza B-row z Poradnika-B (ZGODNE w danych). |
| R-3 | „Inżynieria rzymska: −20% kosztu Produkcji budowli" | `prod_koszt_budynku_proc` = +0.20 (`mul_proc`, HARMFUL) | NIEZGODNE-KIERUNEK (koszt ×1.20) | UNWIRED | Zgodne z ustaleniem Poradnika-B (B3). |
| R-4 | „…szybsza budowa dróg/budynków" | brak pola (`prod_szybkosc_budynku_proc` = default 0) | BRAK-POLA | UNWIRED | |
| R-5 | „Dyscyplina legionów: +35% regen/turę" | `mp_regen_proc` = +0.35 | ZGODNE | REAL | „vs standard 10%" — baza nie sprawdzona (§4 pkt 4). |
| R-6 | Mnożnik „2.0" (`full`) | brak wpisu → default `meta_mnoznik_waluta` = 2 | ZGODNE | REAL | |
| R-7 | Profil AI: agresja „8/9" | `ai_agresywnosc` = 8 | ZGODNE | REAL | |

Bez liczby (pominięte): „dyscyplina bojowa +morale", „Słabsza strona: wyższe utrzymanie armii" (brak pola; do odnotowania).

### 2.8 Sumerowie

| ID | Bonus wg CivPedii | Pole / wartość | Status zgodności | Runtime | Uwagi |
|---|---|---|---|---|---|
| S-1 | „Ciężka piechota: +20% obrony" | `walka_obrona_piechota` = +0.20 | CZĘŚCIOWO (wartość ZGODNA) | BLOCKED | Efekt nie działa (`excludedG1`). |
| S-2 | „Ciężka piechota: +20% HP" | `walka_hp_piechota` = +0.20 | CZĘŚCIOWO (wartość ZGODNA) | BLOCKED | Efekt nie działa (`excludedG1`). |
| S-3 | „Ciężkie rydwany bojowe: +15% HP" | `walka_hp_rydwany` = +0.15 | CZĘŚCIOWO (wartość ZGODNA) | BLOCKED | Efekt nie działa (`excludedG1`). |
| S-4 | „Ciężkie rydwany bojowe: +15% obrony rydwanów" | `walka_obrona_rydwany` = 0 (default) | NIEZGODNE (bez pola: dane 0) | DEAD | Klasyfikator `DEAD_UNWIRED_COMBAT`. |
| S-5 | Mnożnik „2.2" (`full`) | `meta_mnoznik_waluta` = 2.2 | ZGODNE | REAL | |
| S-6 | Profil AI: agresja „3/9" | `ai_agresywnosc` = 3 | ZGODNE | REAL | |

Bez liczby (pominięte): „Gwardia Królewska: +obrona miasta" (`obl_obrona_miasta_proc` = 0, DEAD), „silni łucznicy pieszni", „wolniejsza lekka kawaleria" (brak pola).

### 2.9 Zulusi

| ID | Bonus wg CivPedii | Pole / wartość | Status zgodności | Runtime | Uwagi |
|---|---|---|---|---|---|
| Z-1 | „Ruch i morale: +20% prędkości piechoty" | `walka_ruch_bitwa_proc` = +0.20 (cel `piechota` w kodzie) | ZGODNE (wartość) | LIVE-ROZBIEŻNOŚĆ (kod: `civMovementMultiplier`, cel piechota; klasyfikator: BLOCKED) | Morale przy ataku w grupie — bez pola (pominięte). |
| Z-2a | „Tania rekrutacja: koszt rekrutacji Impi −10%" | `walka_koszt_rekrutacji_proc` = +0.10 (HARMFUL) | NIEZGODNE-KIERUNEK (koszt ×1.10) | BLOCKED (klasyfikator); w kodzie wpis `civ-bonuses.ts` ok. l. 306–307, „effective path" nie konsumuje — do potwierdzenia | |
| Z-2b | (to samo bonus „Tania rekrutacja") | `prod_koszt_jednostki_proc` = +0.10 (HARMFUL) | NIEZGODNE-KIERUNEK (koszt ×1.10) | UNWIRED | |
| Z-3 | Mnożnik „1.8" (`full`) | `meta_mnoznik_waluta` = 1.8 | ZGODNE | REAL | |
| Z-4 | Profil AI: agresja „9/9" | `ai_agresywnosc` = 9 | ZGODNE | REAL | |

Bez liczby (pominięte): „+morale przy ataku w grupie" (formacja buffalo), „słaby dystans" — uwaga: dane mają `walka_dystans_lukownicy` = −0.10 (zgodne z kierunkiem „słaby dystans", ale wiki nie podaje liczby; pole BLOCKED).

---

## 3. Wartości w danych, których CivPedia nie opisuje liczbowo (informacyjnie, poza kryterium)

Nie są bonusami podanymi w CivPedii, więc nie mają statusu zgodności; wypisane dla kompletności.
- **Celtowie:** `eko_praca_proc` −0.02; wartości AI/dyplomacji poza `ai_agresywnosc` (`ai_priorytet_militarny` 8, `ai_priorytet_nauka` 4, `ai_profil_obronna` 1 itd.).
- **Chińczycy:** `eko_praca_proc` +0.03; `lud_wzrost_proc` +0.05; `lud_limit_populacji` +2; `walka_obrona_piechota` −0.05 (BLOCKED; wiki: „słabsza piechota szturmowa wręcz" bez liczby).
- **Egipt:** `eko_praca_proc` +0.01; `lud_wzrost_proc` +0.05; `lud_limit_populacji` +2.
- **Germanie:** `eko_praca_proc` −0.02; `lud_wzrost_proc` −0.05.
- **Grecy:** `lud_limit_populacji` +1; `walka_atak_morska` +0.5; `walka_obrona_morska` +0.5; `walka_atak_piechota_teren_plytkie_morze` +0.5 i `walka_obrona_piechota_teren_plytkie_morze` +0.5 (REAL); `walka_ruch_piechota_teren_plytkie_morze` +0.5 (klasyfikator: UNWIRED, ale `civMovementMultiplier` ma je w liście `ids` z bramką `shallowSea` — LIVE-ROZBIEŻNOŚĆ, do potwierdzenia, §4 pkt 2).
- **Inkowie:** `eko_praca_proc` −0.03; `lud_limit_populacji` +1; `walka_atak_kawaleria` −0.15 i `walka_atak_rydwany` −0.15 (REAL; wiki: „brak konnicy i rydwanów", bez liczby).
- **Rzymianie:** `lud_limit_populacji` +2.
- **Sumerowie:** `eko_praca_proc` +0.01; `lud_limit_populacji` +1.
- **Zulusi:** `eko_praca_proc` −0.03; `lud_wzrost_proc` −0.05; `lud_limit_populacji` −1.

---

## 4. Ustalenia i pozycje do potwierdzenia przez Evaluatora

1. **Mapowanie „pierwsze uderzenie / na starciu" → `walka_atak_piechota_runda_szarzy`** (C-1, G-2, G-3). Przyjęte: runda szarży (`isChargeRound`) = pierwsze uderzenie/starcie. Dla Germanów (G-3) rozstrzyga status NIEZGODNE-WARTOŚĆ (40% vs 15%) — jeśli mapowanie błędne, G-3 przechodzi w BRAK-POLA, a runda_szarzy 0.40 nie ma wiki-odpowiednika.
2. **Rozbieżność klasyfikatora z kodem:** `walka_ruch_bitwa_proc` i `walka_ruch_rydwany` są w `civ-matrix-semantic.ts` jako BLOCKED / UNWIRED, ale są konsumowane przez `civMovementMultiplier` (`civ-bonuses.ts` ok. l. 297–330; wywołanie `battleScene.ts` ok. l. 7183). To samo dotyczy `walka_ruch_piechota_teren_plytkie_morze` (Grecy). Ten dokument przyjmuje kod jako stan faktyczny (LIVE). Osobno: `walka_koszt_rekrutacji_proc` (Zulusi, Z-2a) jest BLOCKED w klasyfikatorze, ale `civ-bonuses.ts` ok. l. 306–307 tworzy wpis, a `production.ts` ok. l. 572 ma gałąź dla tego `matrixParamId` — status „efekt w grze" wymaga potwierdzenia.
3. **Egipt — podwójne liczenie ruchu rydwanów (E-2a + E-2b):** 0.15 + 0.15 = +0.30 w `matchingMatrixSum` przy celu `rydwany`, wobec +15% w CivPedii. Do potwierdzenia testem lub odczytem `matchingMatrixSum`/`unitMatchesCel`.
4. **Bazy „vs standard 10%"** (Grecy Gr-4, Rzymianie R-5): nie sprawdzono w tej rundzie, skąd bierze się baza 10% regeneracji.
5. **Pola ekonomiczne bez konsumenta:** `eko_pieniadz_port_proc`, `eko_pieniadz_proc`, `eko_handel_brutto_proc`, `eko_nauka_proc`, `prod_koszt_budynku_proc`, `prod_koszt_jednostki_proc`, `prod_szybkosc_budynku_proc` — 0 trafień literalnych w `gra/src` na edb8fb56 (grep). Brak konsumenta nie wyklucza dynamicznego odczytu po nazwie kolumny; do sprawdzenia przy P6 (ekonomia).
6. **Warunki nieodwzorowane w danych:** „przy ataku frontalnym" (Gr-1), „mniejsze państwa-miasta" (Gr-4), „przy pierwszym ciosie z zasadzki" (G-2), „zasięg" łuczników (Ch-1/E-1). Dane są bezwarunkowe lub brak pola.
7. **Mnożniki waluty (`full`, „Wzory")** zgodne z danymi we wszystkich 9 (Rzymianie = default 2).
8. **Profil AI (agresja)** zgodny we wszystkich 9 hasłach.

---

## 5. Podsumowanie liczbowe

- Pozycje liczbowe w CivPedii (w tym mnożniki i profil AI, bez „Strategii"): **47** statusów w 9 cywilizacjach.
- **Zgodne w runtime (REAL, wartość i kierunek jak w CivPedii, bez zastrzeżeń):** C-1, Ch-2, E-3, G-1, I-2, R-5, Z-1 (LIVE), oraz wszystkie mnożniki waluty i profile AI (C-3/C-4, Ch-3/Ch-4, E-4/E-5, G-4/G-5, Gr-5/Gr-6, I-3/I-4, R-6/R-7, S-5/S-6, Z-3/Z-4).
- **Realne rozbieżności wartości w runtime:** C-2 (Celtowie Uderzenie +40% vs +15%, REAL), G-3 (Germanie Furia +40% vs +15%, REAL; mapowanie do potwierdzenia), E-2b (Egipt ruch rydwanów +30% vs +15%, LIVE).
- **Rozbieżności kierunku (koszt zamiast redukcji):** R-3 (Rzymianie budowa −20% → ×1.20, UNWIRED), Z-2a/Z-2b (Zulusi rekrutacja −10% → ×1.10, BLOCKED wg klasyfikatora / UNWIRED).
- **Brak pola / brak wartości:** G-2 (zasadzka), S-4 (obrona rydwanów = 0), R-4 (szybsza budowa dróg), Ch-1/E-1 („zasięg" łuczników).
- **Zgodne dane, ale efekt NIE działa w grze (BLOCKED, potwierdzone `excludedG1`):** Ch-1, E-1, Gr-1, R-1, R-2, S-1, S-2, S-3.
- **Zgodne dane, brak konsumenta w `gra/src` (UNWIRED):** Gr-2, Gr-3, I-1.

Pozycje **niedokończone** (wymagają potwierdzenia Evaluatora, nie zgadywania): §4 pkt 1–6. Kryterium binarne: każda pozycja z §2 ma status z dowodem (pole, wartość, kierunek, konsument); pozycje „do potwierdzenia" są jawnie wymienione w §4.

---

## 6. Pominięte (poza zakresem tematu)

- „Strategia dla gracza" — 9/9 identyczna, zamknięte w `P1-16D-OPISY-BOILERPLATE.md` §4.
- Hasła „Cywilizacje i dyplomacja" i „Dyplomacja" (kategorie odrębne).
- Efekty nieliczbowe (jednostki unikalne, religie, władcy, epoki startowe, „przykładowe miasta").

---

**Dowody źródłowe (pin edb8fb56):** `gra/src/data/wikiBundle.json` (encyklopedia, `cywilizacje/*`, pola `wikiM`/`full`); `gra/data/civ-matrix.json` (`cywilizacje[]`, `defaults`, `paramDefs`, `_meta`); `gra/src/game/civ-matrix-semantic.ts` (HARMFUL ok. l. 206–215; zbiory REAL/BLOCKED/DEAD/UNWIRED); `gra/src/game/civ-bonuses.ts` (`excludedG1` ok. l. 288–291; `civMovementMultiplier` ok. l. 297–330; `matchingMatrixSum`); `gra/src/battle/battleScene.ts` (ok. l. 7183, 7186–7190).

---

## 7. Runda 2 (Operator, Haiku 5.5 medium): odpowiedź na zarzuty Evaluatora

**Metoda korekty.** Wszystkie odczyty na pinie `edb8fb56`. Kluczowe ustalenie: `civBonusyForOwnerId` (`gra/src/main.ts` ok. l. 8208–8214) zwraca `[...legacy, ...civMatrixBonusyForCivKey(civKey)]`. Legacy = `gra/data/civs.json` `bonusy[]` (`civBonusyForCivKey`, `economy.ts` ok. l. 844). `bonusApplies` (`civ-bonuses.ts` ok. l. 141–175) przepuszcza tylko `realizuje === 'walka'`; wpisy `walka_wygaszone` są pomijane. `excludedG1` (ok. l. 288–291) wyklucza WYŁĄCZNIE wpisy macierzowe, nie legacy. Stąd poprzedni status BLOCKED dla pozycji z `excludedG1` był błędny, gdy ta sama statystyka ma wpis legacy `walka`.

### 7.1 Odpowiedzi na zarzuty

| Nr | Odpowiedź | Dowód (pin edb8fb56) |
|---|---|---|
| 1 | PRZYJMUJE | `applyWalkBonus` (ok. l. 181–215) stosuje legacy `walka`: wpis „…ataku…” → `m.atk`; „…pancerza…” → `m.pancerz`; `bonus_obrona` → `m.obrona` (+`m.health` przy „hp”), tylko strona obrony (ok. l. 146). Korekty: R-1 (atk +0.15) i R-2 (pancerz +0.15) → ZGODNE/REAL; E-1 → ZGODNE (atk) REAL; Ch-1 → CZĘŚCIOWO (atk REAL, zasięg BRAK: `civAttackRangeMultiplier` czyta tylko `walka_zasieg_proc` i `walka_dystans_rydwany`); S-1, S-2 → ZGODNE/REAL (obrona, strona obrońcy); S-3 → ZGODNE/REAL (gałąź „hp i obron”, ok. l. 213–216); Gr-1 → ZGODNE wartość, CZĘŚCIOWO warunek („przy ataku frontalnym” nie zakodowane), REAL (obrona, strona obrońcy). Zulusi `walka_dystans_lukownicy` −0.10 i Chińczycy `walka_obrona_piechota` −0.05 pozostają bez efektu (BLOCKED, brak legacy). |
| 2 | PRZYJMUJE | Wpisy `walka_wygaszone` (civs.json): Celtowie 0.25 i 0.15; Germanie 0.25 i 0.15; Egipt rydwany 0.15; Chiny kawaleria 0.15; Inkowie teren 0.20; Zulusi ruch 0.20 i koszt 0.10. Pominięte przez `bonusApplies` l. 146. Konsekwencje: C-2, G-3, E-2, Z-1 rozstrzygane wyłącznie przez macierz (patrz 7.2). S-4 i S-3 NIE są DEAD: wpis legacy „Ciężkie rydwany… +15% HP i obrony rydwanów” (`realizuje: walka`) przechodzi do gałęzi `opis.includes('hp') && opis.includes('obron')` → `m.health` i `m.obrona` +0.15 (oba strony; brak guardu dla `bonus_walka`). Matrix `walka_obrona_rydwany` = 0 (brak pola). |
| 3 | PRZYJMUJE | `unitMoneyCost` (production.ts ok. l. 535–546) wywołuje `civRecruitmentDiscount(civBonusy)` (ok. l. 565–575): zwraca `wartosc` > 0 dla `realizuje === 'ekonomia'` i `matrixParamId === 'walka_koszt_rekrutacji_proc'`; koszt = `floor(koszt × (1 − 0.10))`. Wpis: `civ-bonuses.ts` ok. l. 306–307. Wywołania z `civBonusy`: production.ts l. 392, 954, 1057, 2136. Efekt: Z-2a = ZGODNE w skutku (−10%). Konflikt konwencji: `HARMFUL` (civ-matrix-semantic.ts l. 207) traktuje dodatnią wartość jako koszt; konsument czyta ją jako ulgę. Komentarz „effective matrix-options production path does not consume its ID” (semantic ok. l. 225–229) jest nieaktualny. Z-2b (`prod_koszt_jednostki_proc` +0.10) nie ma konsumenta (grep: tylko semantic l. 210) → duplikat wiersza, scalony z Z-2a. |
| 4 | PRZYJMUJE | `buildingWorkCost` (production.ts ok. l. 516–521) → `buildingCostAfterCivDiscount` → `civBuildingCostDiscount` (civ-bonuses.ts ok. l. 349–360): wpis legacy Rzymianie `koszt_redukcja`, cel `budynki`, 0.20, `realizuje: miasto` → disc 0.20. R-3 = ZGODNE w skutku (−20%). Pole `prod_koszt_budynku_proc` +0.20 (HARMFUL, l. 209) nie ma konsumenta. |
| 5 | PRZYJMUJE | `git grep mp_regen_proc` na pinie: tylko `civ-matrix-semantic.ts` l. 112 (tekst metadanych) i l. 153 (zbiór). Brak konsumenta w kodzie. Realna ścieżka: legacy `bonus_pobor_regen` 1.0 (Rzymianie, `realizuje: ekonomia`) → `civManpowerRegenMult` (manpower.ts ok. l. 396–410) → ×2. R-5 = NIEZGODNE-WARTOŚĆ (runtime +100% vs CivPedia +35%). Klasyfikator REAL_GAMEPLAY dla `mp_regen_proc` opiera się na nieistniejącym konsumencie. |
| 6 | PRZYJMUJE | Baza w kodzie: `DEFAULT_REGEN.regenProcMaxPerTurn = 2` (manpower.ts ok. l. 63–66); `gra/data/miasto-params.json` `manpower_regen_proc_max_tura` = 2; civs.json Rzymianie „4% max/turę vs standard 2%”. CivPedia (`wikiBundle.json` `full`): Grecy „vs standard 10%”, Rzymianie „vs standard 10%”. NIEZGODNE-TEKST (baza 10% vs 2%). |
| 7 | PRZYJMUJE | Gr-4 konsument = legacy `bonus_pobor_regen` −0.15 (`civManpowerRegenMult`: 1 + (−0.15) = ×0.85). Matrix `mp_regen_proc` −0.15 bez konsumenta. Status: ZGODNE wartość względna (×0.85), REAL przez legacy; warunek „państwa-miasta” nie zakodowany; baza 10% → pkt 6. |
| 8 | PRZYJMUJE | `civEconomyYieldMultipliers` (economy.ts ok. l. 863–876): `realizuje === 'ekonomia'`; `bonus_zloto` cel `handel` → `handel += v`; `bonus_nauka` (dowolny cel) → `nauka += v`. Wywołania: turn-economy.ts ok. l. 2036 i 2612; cityPanel.ts ok. l. 1192. Gr-2 (legacy `bonus_zloto` handel 0.15): REAL; zakres CZĘŚCIOWO (CivPedia „z portów i dróg morskich”, runtime: cały handel). Gr-3 scalony z Gr-2 (ten sam wpis legacy). I-1 (legacy `bonus_nauka` wszystko 0.15): ZGODNE, REAL (zakres „astronomia i agronomia” nie jest zawężony w kodzie). Pola `eko_*` w macierzy bez konsumenta są poprawnie UNWIRED, ale efekt żyje w legacy. |
| 9 | PRZYJMUJE (z wymiarem warunku) | Macierz `walka_atak_piechota_runda_szarzy` = 0.40 (Germanie). `bonusApplies` ok. l. 161: `_runda_szarzy` wymaga `isChargeRound`. Legacy „Furia +15% na starciu” wygaszone. Status G-3: NIEZGODNE — wartość 40% vs 15%, ORAZ warunek: runtime tylko w rundzie szarży, CivPedia „na starciu”. Mapowanie „na starciu” = runda szarży nadal wymaga potwierdzenia (§4 pkt 1). |
| 10 | PRZYJMUJE | Scalone w jeden wiersz E-2. `civMatrixBonusyForCivKey` ok. l. 297–304 dodaje `walka_ruch_bitwa_proc` (cel rydwany tylko dla `egipt`) i `walka_ruch_rydwany` (cel rydwany). `matchingMatrixSum` (ok. l. 318–330) sumuje obie: 0.15 + 0.15 = 0.30 → `civMovementMultiplier` → `battleScene.ts` ok. l. 7183. Klasyfikator: `walka_ruch_bitwa_proc` w `BLOCKED_COMBAT_MULTIPLIER` (semantic l. 228); `walka_ruch_rydwany` nie występuje w żadnym zbiorze (grep) → etykieta „UNWIRED” była fallthroughem, nie weryfikacją. Status: NIEZGODNE-WARTOŚĆ (+30% vs +15%). |
| 11 | PRZYJMUJE | `prod_koszt_budynku_proc` i `prod_koszt_jednostki_proc` występują w zbiorze HARMFUL (semantic l. 209–210). Poprawne sformułowanie: 0 konsumentów poza klasyfikatorem. |
| 12 | PRZYJMUJE | Podsumowanie przeliczone w §7.3. Pozycja Z-1 jest LIVE-ROZBIEŻNOŚCIĄ (nie „REAL bez zastrzeżeń”, bo klasyfikator = BLOCKED). |
| 13 | PRZYJMUJE | Wersja 1 nie spełniała kryterium binarnego. Wersja 2 (§7.2) podaje status z dowodem dla każdej pozycji; niedokończone pozycje wymienione w §7.4. |

### 7.2 Korekty statusów (zastępują §2 dla wymienionych ID)

| ID | Nowy status | Runtime (ścieżka) |
|---|---|---|
| C-2 | NIEZGODNE-WARTOŚĆ (40% vs 15%) | REAL, macierz `walka_uderzenie_piechota` 0.40; legacy 15% wygaszone |
| Ch-1 | CZĘŚCIOWO (atk ZGODNE; zasięg BRAK) | REAL, legacy atk 0.20 (gałąź „ataku”) |
| Ch-2 | CZĘŚCIOWO (wartość ZGODNA; warunek „przy szarży” nie zakodowany) | REAL, macierz `walka_uderzenie_kawaleria` 0.15 bezwarunkowo |
| E-1 | ZGODNE (atk) | REAL, legacy atk 0.20 |
| E-2 (scalone E-2a+E-2b) | NIEZGODNE-WARTOŚĆ (+30% vs +15%) | LIVE-ROZBIEŻNOŚĆ (sum macierzy, `civMovementMultiplier`) |
| G-2 | BRAK | legacy „zasadzka” wygaszona; brak efektu |
| G-3 | NIEZGODNE (40% vs 15%; warunek: tylko runda szarży) | REAL, macierz runda_szarzy; legacy wygaszone |
| Gr-1 | CZĘŚCIOWO (wartość ZGODNA; warunek nie zakodowany) | REAL, legacy `bonus_obrona` piechota 0.20, strona obrony |
| Gr-2 (scalone Gr-2+Gr-3) | CZĘŚCIOWO (zakres: cały handel vs porty i drogi morskie) | REAL, legacy `bonus_zloto` handel 0.15 |
| Gr-4 | ZGODNE wartość (×0.85); NIEZGODNE-TEKST baza 10% vs 2% | REAL, legacy `bonus_pobor_regen` −0.15 |
| I-1 | ZGODNE | REAL, legacy `bonus_nauka` wszystko 0.15 |
| R-1 | ZGODNE | REAL, legacy atk 0.15 |
| R-2 | ZGODNE | REAL, legacy pancerz 0.15 |
| R-3 | ZGODNE w skutku (−20%); pole macierzy `prod_koszt_budynku_proc` martwe | REAL, legacy `koszt_redukcja` miasto 0.20 |
| R-5 | NIEZGODNE-WARTOŚĆ (+100% vs +35%); NIEZGODNE-TEKST baza | REAL, legacy `bonus_pobor_regen` 1.0 → ×2 |
| S-1, S-2 | ZGODNE (obrona i HP, strona obrony) | REAL, legacy `bonus_obrona` piechota 0.20 |
| S-3 | ZGODNE (HP) | REAL, legacy `bonus_walka` rydwany 0.15, gałąź „hp i obron” |
| S-4 | ZGODNE (obrona); zakres stron do potwierdzenia | REAL, ta sama pozycja legacy, `m.obrona` +0.15 |
| Z-1 | ZGODNE wartość; LIVE-ROZBIEŻNOŚĆ z klasyfikatorem | REAL, macierz `walka_ruch_bitwa_proc` 0.20, cel piechota |
| Z-2 (scalone Z-2a+Z-2b) | ZGODNE w skutku (−10% kosztu rekrutacji); konflikt konwencji znaku | REAL, `civRecruitmentDiscount` |
| Z-5 (NOWA) | Dane bez pozycji CivPedii: macierz `walka_uderzenie_piechota` +0.15 (cel piechota) | REAL (civCombatStatMultipliers, nie wygaszone); brak w tekście Zulusów |

Pozycje pozostające BLOCKED bez efektu: Ch `walka_obrona_piechota` −0.05 (brak tekstu liczbowego), Z `walka_dystans_lukownicy` −0.10 („słaby dystans”, bez liczby).

### 7.3 Podsumowanie po korekcie

- Pozycje liczbowe (bez „Strategii”): 45 wierszy (47 − scalenia E-2b, Gr-3, Z-2b + nowe Z-5).
- Zgodne (wartość i kierunek, REAL): C-1, Ch-2 (wartość), E-1, E-3, G-1, I-1, I-2, R-1, R-2, R-3 (w skutku), S-1, S-2, S-3, S-4, Z-1, Z-2 (w skutku), wszystkie mnożniki i profile AI.
- Zgodne wartość, niezgodny warunek/zakres: Ch-2 (warunek), Gr-1 (warunek), Gr-2 (zakres), Gr-4 i R-5 (baza).
- Realne rozbieżności wartości: C-2 (40 vs 15), G-3 (40 vs 15 + warunek), E-2 (30 vs 15), R-5 (100 vs 35).
- Brak pola / efektu: G-2, R-4, Ch-1 zasięg, E-1 zasięg (brak w tekście liczbowym dla E-1), Z dystans −0.10, Ch obrona −0.05.

### 7.4 Pozycje otwarte (jawna lista)

1. Mapowanie „pierwsze uderzenie / na starciu” → runda szarży (C-1, G-3): hipoteza, nie zweryfikowana w grze.
2. Konwencja znaku `walka_koszt_rekrutacji_proc` (HARMFUL vs konsument jako ulga): zachowanie runtime udokumentowane, konwencja wymaga decyzji.
3. Zakres stron S-4 (legacy `bonus_walka`, brak guardu strony): efekt na stronie atakującego do potwierdzenia.
4. Brak testu runtime: wszystkie statusy wynikają z odczytu kodu, nie z uruchomienia gry.
5. Sumowanie E-2 (+30%) potwierdzone odczytem `matchingMatrixSum`, nie testem.

# Propozycja jednostek — Inkowie (Cywilizacja 5)

**Autor:** Units Lead (Inca)
**Data:** 2026-06-20
**Status:** PROPOZYCJA — nie edytować Jednostki.xlsx bez zatwierdzenia

---

## Kontekst

Zastąpiliśmy 5. cywilizację: **Majowie → Inkowie** (Andy, lamy).

Lama (tragarz) pozostaje jako jednostka wsparcia — była już zdefiniowana dla Majów, teraz przechodzi do Inków z aktualizacją kolumny Kultura.

**Tożsamość militarna Inków:**
- **Brak:** koni, rydwanów, konnicy (ani na wolach, ani konnej)
- **Siła:** piechota + dystans (zwłaszcza procarze)
- **Styl:** masowe armie piechoty z poważnym komponentem miotającym

---

## Zasada: kolumna "Ilość pocisków" (nowa)

Jednostki dystansowe mają **ograniczony zapas amunicji** — kolumnę `Ilość pocisków` należy dodać do Jednostki.xlsx (między `Zasięg ataku (hex)` a `Uwagi` lub jako ostatnią kolumnę przed Uwagami).

| Typ jednostki | Ilość pocisków |
|---|---|
| Jednostka wręcz (melee) | 0 (pole puste / kreska) |
| Łucznik, oszczepnik, procarz | 5–10 |
| Jednostka specjalna dystansowa (sygnaturowa) | 12 (lub wyróżnik +2 vs standard) |

> **Reguła gry:** gdy jednostka dystansowa wyczerpie pociski, może atakować tylko wręcz z Atakiem obniżonym do 1 (lub nie może atakować — do decyzji projektanta). Uzupełnienie pocisków wymaga postoju w mieście lub przy obozie.

---

## Porównanie z istniejącymi jednostkami Brązu (benchmark)

Poniższa tabela służy jako punkt odniesienia dla proponowanych statystyk.

| Jednostka | Epoka | Koszt | Sur | Il | Utrz | Atk | Ud | Ob | Rch | HP | Mor | Wid | ADys | Zas |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Wojownik | Kamień | 10 | — | 0 | 1 | 3 | 2 | 3 | 2 | 30 | 3 | 1 | 0 | — |
| Łucznik | Kamień | 6 | drewno | 4 | 1 | 2 | 1 | 3 | 2 | 10 | 2 | 1 | 3 | 2 |
| Włócznik | Brąz | 16 | braz | 4 | 2 | 2 | 3 | 3 | 2 | 80 | 4 | 1 | 0 | — |
| Falanga | Brąz | 18 | braz | 5 | 2 | 2 | 3 | 4 | 1 | 70 | 5 | 2 | 0 | — |
| Wojownik z brązu z mieczem | Brąz | 16 | braz | 5 | 2 | 3 | 3 | 2 | 2 | 50 | 4 | 1 | 0 | — |
| Legionista | Brąz | 18 | braz | 5 | 2 | 3 | 4 | 2 | 2 | 60 | 6 | 2 | 0 | — |
| Konnica | Brąz | 22 | Koń | 3 | 3 | 3 | 3 | 2 | 4 | 80 | 4 | 2 | 0 | — |
| Wojownik z macuahuitl (Jaguar) | Brąz | 22 | braz | 4 | 2 | 4 | 4 | 2 | 3 | 40 | **7** | 2 | 0 | — |
| Impi | Brąz | 20 | braz | 4 | 2 | 2 | 3 | 3 | 4 | 70 | 6 | 2 | 0 | — |
| Oszczepnik Zulu (Izijula) | Brąz | 18 | braz | 3 | 1 | 2 | 1 | 2 | 2 | 20 | 3 | 2 | **5** | 2 |
| Kusznik | (późniejszy) | 20 | drewno | 5 | 2 | 4 | 2 | 2 | 2 | 20 | 3 | 3 | **5** | 3 |

**Obserwacje z benchmarku:**
- Piechota wręcz (Brąz): Atak 2–4, Health 40–80, Morale 4–7
- Jednostki dystansowe: Atak wręcz bardzo niski (1–2), Health 10–20, Atak dystansowy 3–5
- Koszt jednostek specjalnych: 18–28 Pieniądz
- Surowiec piechoty brązowej: braz × 3–5
- Najwyższe Morale w grze: Jaguar = 7 (benchmark dla jednostki specjalnej)

---

## Propozycje jednostek Inków

### Legenda kolumn

`Atk` = Atak (wręcz) | `Ud` = Uderzenie | `Ob` = Obrona | `Rch` = Ruch | `HP` = Health | `Mor` = Morale | `Wid` = Widok pola | `ADys` = Atak dystansowy | `Zas` = Zasięg (hex) | `Poc` = Ilość pocisków (NOWA KOLUMNA)

---

### 1. Procarz (Huaracoc) — JEDNOSTKA SYGNATUROWA Inków

**Rola/typ:** Dystansowa, lekka piechota miotająca  
**Epoka:** Brąz  
**Kultura:** Inkowie  
**Tech wymagana:** Brązownictwo

Historyczny rdzeń armii Inków. Proca inkaańska (huaraca) miotała kamienie 50–100 g, skutecznie penetrując hełmy i łamiąc kości. Kamienie często zapalano. Używano zarówno kamieni rzecznych, jak i glinianych pocisków. Huaracoc walczyli w zwartych szyках — słabsi wręcz, ale w przewadze liczebnej niszczący na dystans.

| Stat | Wartość | Uzasadnienie |
|---|---|---|
| Koszt (Pieniądz) | 16 | Jak Włócznik — podstawowa jednostka armii |
| Surowiec | kamień | Proca wymaga kamieni, nie brązu |
| Surowiec (ilość) | 2 | Niskie wymaganie (kamienie powszechne) |
| Utrzymanie | 1 | Najtańszy w utrzymaniu |
| Żywność/turę | 1 | Standard |
| Atak (wręcz) | 1 | Bardzo słaby wręcz — to jest jednostka dystansowa |
| Uderzenie | 1 | Brak uderzenia — nie szarżuje |
| Obrona | 2 | Lekki strój, bez zbroi — ale ruchliwy |
| Ruch | 3 | Szybszy niż piechota ciężka |
| Health | 25 | Lekka piechota; powinien być chroniony |
| Morale | 4 | Bojowy duch Inków, ale nie elita |
| Widok pola | 2 | Standard |
| Atak dystansowy | **6** | Główna siła — wyższy niż Oszczepnik Zulu (5), niższy niż Kusznik spec. |
| Zasięg ataku (hex) | **3** | Jak Kusznik — proca ma długi zasięg |
| **Ilość pocisków** | **10** | Nosi zapas kamieni; jako jednostka sygnaturowa +2 vs standard |

**Uwagi (kolumna T):** `jednostka SYGNATUROWA Inków; proca (huaraca) — daleki zasięg, tani w utrzymaniu; słaby wręcz; kamienne pociski (kamień ×2); brak koni/rydwanów u Inków`

---

### 2. Oszczepnik (Estólica)

**Rola/typ:** Dystansowa, lekka piechota miotająca  
**Epoka:** Brąz  
**Kultura:** Inkowie  
**Tech wymagana:** Brązownictwo

Używał miotacza (estólica/atlatl) do rzucania ciężkich włóczni z dużą siłą. Zasięg krótszy niż proca, ale pociski cięższe i penetrujące. Zwykle ustawiany przed piechotą ciężką, by osłabić szarżę wroga.

| Stat | Wartość | Uzasadnienie |
|---|---|---|
| Koszt (Pieniądz) | 14 | Taniej niż Procarz (gorszy zasięg i pociski) |
| Surowiec | braz | Groty włóczni z brązu/miedzi |
| Surowiec (ilość) | 2 | Mniej niż włócznik (tylko groty) |
| Utrzymanie | 1 | Lekki |
| Żywność/turę | 1 | Standard |
| Atak (wręcz) | 2 | Może się bronić włócznią wręcz (lepsza niż Procarz) |
| Uderzenie | 1 | Brak szarży |
| Obrona | 2 | Lekka piechota |
| Ruch | 2 | Standardowy ruch piechoty |
| Health | 30 | Nieco twardszy niż Procarz |
| Morale | 3 | Żołnierz liniowy |
| Widok pola | 2 | Standard |
| Atak dystansowy | 4 | Silniejszy impakt niż Łucznik (3), słabszy niż Procarz |
| Zasięg ataku (hex) | 2 | Krótszy zasięg niż proca |
| **Ilość pocisków** | 6 | Włócznie ciężkie — nosi mniej |

**Uwagi:** `oszczepnik z miotaczem (estólica/atlatl); krótki zasięg, ciężki pocisk; może atakować wręcz słabo; Inkowie`

---

### 3. Łucznik (posiłkowy)

**Rola/typ:** Dystansowa, lekka piechota łucznicza  
**Epoka:** Brąz  
**Kultura:** Inkowie  
**Tech wymagana:** Łucznictwo

Posiłkowe oddziały z podbitych plemion dżungli amazońskiej (np. Antis). Inkowie nie byli ludem łuczniczym — łuk był orężem zdobiętym, nie bojowym. Łucznicy byli mniej liczni i mniej skuteczni niż procarze.

| Stat | Wartość | Uzasadnienie |
|---|---|---|
| Koszt (Pieniądz) | 6 | Identyczny jak standardowy Łucznik z Epoki Kamienia |
| Surowiec | drewno | Łuk z drewna |
| Surowiec (ilość) | 4 | Jak standardowy Łucznik |
| Utrzymanie | 1 | Tani |
| Żywność/turę | 1 | Standard |
| Atak (wręcz) | 2 | Jak standardowy Łucznik |
| Uderzenie | 1 | Brak szarży |
| Obrona | 3 | Jak standardowy Łucznik |
| Ruch | 2 | Standard |
| Health | 10 | Jak standardowy Łucznik |
| Morale | 2 | Posiłkowy, nie rdzenni Inkowie |
| Widok pola | 1 | Standard |
| Atak dystansowy | 3 | Jak standardowy Łucznik |
| Zasięg ataku (hex) | 2 | Jak standardowy Łucznik |
| **Ilość pocisków** | 8 | Kołczan standardowy |

> **Uwaga projektanta:** Ten łucznik jest _identyczny_ ze standardowym Łucznikiem Epoki Kamienia z wyjątkiem Kultury = Inkowie. Można go pominąć w arkuszu jeśli Inkowie mają dostęp do standardowego Łucznika. Wart dodania tylko jeśli chcemy zaznaczyć, że Inkowie go używają rzadko i z niskim Morale.

**Uwagi:** `posiłkowy łucznik z plemion dżungli; identyczny ze standardowym Łucznikiem; Inkowie używają go marginalnie — główna siła dystansowa to Procarz`

---

### 4. Wojownik z maczugą (Chaska / Champi)

**Rola/typ:** Piechota uderzeniowa, wręcz  
**Epoka:** Brąz  
**Kultura:** Inkowie  
**Tech wymagana:** Brązownictwo

Gwiaździsta maczuga (champi) z główką z kamienia lub brązu/miedzi — broń ikoniczna dla Andów. Niszczyła hełmy, łamała kości. Wojownicy z maczugą walczyli w pierwszym szeregu i słynęli z agresji. Bardzo wysokie morale — walczyć dla Sapa Inca było honorem.

| Stat | Wartość | Uzasadnienie |
|---|---|---|
| Koszt (Pieniądz) | 16 | Jak Włócznik — podstawowa piechota |
| Surowiec | braz | Głowica maczugi z brązu/miedzi |
| Surowiec (ilość) | 3 | Mniej niż Włócznik (krótka broń) |
| Utrzymanie | 2 | Standard piechoty brązowej |
| Żywność/turę | 1 | Standard |
| Atak (wręcz) | **4** | Wysoki — maczuga jest potężną bronią przeciw opancerzonym |
| Uderzenie | 3 | Może szarżować; Uderzenie = impet pierwszego ataku |
| Obrona | 2 | Lekka zbroja — oddaje się bardziej w atak niż obronę |
| Ruch | 2 | Piechota standardowa |
| Health | 50 | Solidna jednostka liniowa |
| Morale | **6** | Bardzo wysokie — walczy dla chwały Sapa Inca; nie ucieka łatwo |
| Widok pola | 1 | Standard |
| Atak dystansowy | 0 | Tylko wręcz |
| Zasięg ataku (hex) | — | N/D |
| **Ilość pocisków** | 0 | Jednostka wręcz |

**Uwagi:** `piechota uderzeniowa z maczugą (champi/chambi); łamie hełmy i kości; wysokie morale; Inkowie; brak zasięgu`

---

### 5. Wojownik z toporem (Tumi)

**Rola/typ:** Piechota szturmowa, wręcz  
**Epoka:** Brąz  
**Kultura:** Inkowie  
**Tech wymagana:** Brązownictwo

Topór z brązu (tumi) — oręż zarówno ceremonialny, jak i bojowy. Skuteczny przeciwko lekko opancerzonym, ale wolniejszy w zamachu niż maczuga.

| Stat | Wartość | Uzasadnienie |
|---|---|---|
| Koszt (Pieniądz) | 14 | Tańszy niż maczuga (słabszy) |
| Surowiec | braz | Topór z brązu |
| Surowiec (ilość) | 3 | Standard |
| Utrzymanie | 1 | Tani w utrzymaniu |
| Żywność/turę | 1 | Standard |
| Atak (wręcz) | 3 | Dobry, nie świetny — topór to broń jednostronna |
| Uderzenie | 2 | Nieduże uderzenie — topór mniej skuteczny w szarży |
| Obrona | 2 | Lekka obrona |
| Ruch | 2 | Standard |
| Health | 40 | Lżejszy od włócznika |
| Morale | 4 | Normalny wojownik inkaański |
| Widok pola | 1 | Standard |
| Atak dystansowy | 0 | Tylko wręcz |
| Zasięg ataku (hex) | — | N/D |
| **Ilość pocisków** | 0 | Jednostka wręcz |

**Uwagi:** `wojownik z toporem brązowym (tumi); dobry atak, słabe uderzenie; Inkowie; brak zasięgu`

---

### 6. Włócznik (Pikaman)

**Rola/typ:** Piechota liniowa, anty-szarżowa  
**Epoka:** Brąz  
**Kultura:** Inkowie  
**Tech wymagana:** Brązownictwo

Inkowie używali bardzo długich włóczni (do 6 m) w formacji szerokich linii. Pierwsze i drugie szeregi — idealne do odpierania szarży. Bardzo podobni do standardowego Włócznika, ale z wyraźną tożsamością inkaańską.

> **Uwaga projektanta:** Inkowie mogą używać standardowego Włócznika z Jednostki.xlsx bez osobnej jednostki. Poniższe staty = standardowy Włócznik Brąz. Warto dodać jako osobną pozycję tylko jeśli Inkowie mają bonus (+1 Ob vs szarże) lub unikalny surowiec (drewno zamiast brązu na trzonek).

| Stat | Wartość | Uzasadnienie |
|---|---|---|
| Koszt (Pieniądz) | 16 | = standardowy Włócznik |
| Surowiec | braz | Groty z brązu |
| Surowiec (ilość) | 4 | = standardowy Włócznik |
| Utrzymanie | 2 | Standard |
| Żywność/turę | 1 | Standard |
| Atak (wręcz) | 2 | Długa włócznia nie jest dobra w chaosie walki |
| Uderzenie | 3 | Solidne uderzenie z włóczni (jak standardowy) |
| Obrona | **4** | Anty-szarżowy; porównywalny do Falangi |
| Ruch | 2 | Piechota ciężka |
| Health | 80 | Jak standardowy Włócznik |
| Morale | 4 | Standard |
| Widok pola | 1 | Standard |
| Atak dystansowy | 0 | Tylko wręcz |
| Zasięg ataku (hex) | — | N/D |
| **Ilość pocisków** | 0 | Jednostka wręcz |

**Uwagi:** `długa włócznia inkaańska (do 6 m); formacja anty-szarżowa; bardzo podobny do standardowego Włócznika; Inkowie`

---

### 7. Królewska Gwardia Przyboczna (Sapa Inca Guard) — JEDNOSTKA SPECJALNA / ELITARNA

**Rola/typ:** Elitarna piechota uderzeniowa, wręcz  
**Epoka:** Brąz  
**Kultura:** Inkowie  
**Tech wymagana:** Brązownictwo

Gwardia Sapa Inki rekrutowana wyłącznie ze szlachty (orejones — "wielkie uszy" od złotych ozdobnych kolczyków). Uzbrojeni w najlepszy brąz, chronieni przez masywne tarcze i pancerze z watowanej bawełny. Nigdy się nie cofają. Morale absolutnie najwyższe w armii — śmierć dla Sapa Inca jest honorem. Porównywalny do Legioniisty (Rzym) pod względem roli jako elity piechotar, ale z wyższym Morale i słabszym wyposażeniem technicznym.

| Stat | Wartość | Uzasadnienie |
|---|---|---|
| Koszt (Pieniądz) | **24** | Droższy — elita; między Konnicą (22) a Rydwanem (30) |
| Surowiec | braz | Broń i zbroja z brązu |
| Surowiec (ilość) | **6** | Więcej niż standardowa piechota — pełne wyposażenie |
| Utrzymanie | **3** | Gwardia jest kosztowna w utrzymaniu |
| Żywność/turę | 1 | Standard |
| Atak (wręcz) | **5** | Najwyższy Atak wśród piechoty inkaańskiej; maczuga + topór |
| Uderzenie | **4** | Potężne uderzenie — szarżuje z pełną siłą |
| Obrona | **3** | Dobra obrona (bawełniany pancerz + tarcza), ale nie tank |
| Ruch | 2 | Ciężka piechota |
| Health | **70** | Bardzo wytrzymała |
| Morale | **7** | NAJWYŻSZE MORALE = 7 (jak Jaguar Majów); "nigdy się nie cofa" |
| Widok pola | 2 | Lepsza świadomość pola |
| Atak dystansowy | 0 | Wyłącznie wręcz |
| Zasięg ataku (hex) | — | N/D |
| **Ilość pocisków** | 0 | Jednostka wręcz |

**Uwagi:** `jednostka SPECJALNA Inków; elitarna gwardia ze szlachty (orejones); najwyższe Morale w armii inkaańskiej; nigdy się nie cofa; wymaga brązu ×6; Inkowie: brak koni/rydwanów`

---

## Lama (tragarz) — aktualizacja z Majów → Inkowie

Jednostka już istnieje w Jednostki.xlsx jako przypisana do Majów. Przy zmianie cywilizacji 5. na Inków — **należy tylko zaktualizować kolumnę Kultura** z "Majowie" na "Inkowie". Staty pozostają bez zmian:

| Stat | Wartość obecna |
|---|---|
| Koszt | 10 |
| Surowiec | lama |
| Surowiec (ilość) | 1 |
| Atak | 0 |
| Health | 20 |
| Morale | 1 |
| Uwagi | jednostka wsparcia; zwiększa prędkość zaopatrzenia armii |

> Zmiana w arkuszu: komórka `C19` (lub odpowiednia) z "Majowie" → "Inkowie".

---

## Tabela zbiorcza — wszystkie jednostki Inków

| # | Jednostka | Epoka | Kultura | Tech | Koszt | Sur | Il | Utrz | Atk | Ud | Ob | Rch | HP | Mor | Wid | ADys | Zas | Poc | Typ | Uwaga |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **Procarz (Huaracoc)** | Brąz | Inkowie | Brązownictwo | 16 | kamień | 2 | 1 | 1 | 1 | 2 | 3 | 25 | 4 | 2 | **6** | **3** | **10** | Dystans | SYGNATUROWA |
| 2 | Oszczepnik (Estólica) | Brąz | Inkowie | Brązownictwo | 14 | braz | 2 | 1 | 2 | 1 | 2 | 2 | 30 | 3 | 2 | 4 | 2 | 6 | Dystans | |
| 3 | Łucznik (posiłkowy) | Brąz | Inkowie | Łucznictwo | 6 | drewno | 4 | 1 | 2 | 1 | 3 | 2 | 10 | 2 | 1 | 3 | 2 | 8 | Dystans | opcjonalny |
| 4 | Wojownik z maczugą | Brąz | Inkowie | Brązownictwo | 16 | braz | 3 | 2 | 4 | 3 | 2 | 2 | 50 | **6** | 1 | 0 | — | 0 | Wręcz | |
| 5 | Wojownik z toporem | Brąz | Inkowie | Brązownictwo | 14 | braz | 3 | 1 | 3 | 2 | 2 | 2 | 40 | 4 | 1 | 0 | — | 0 | Wręcz | |
| 6 | Włócznik | Brąz | Inkowie | Brązownictwo | 16 | braz | 4 | 2 | 2 | 3 | 4 | 2 | 80 | 4 | 1 | 0 | — | 0 | Wręcz | anty-szarża |
| 7 | **Królewska Gwardia** | Brąz | Inkowie | Brązownictwo | **24** | braz | **6** | **3** | **5** | **4** | 3 | 2 | **70** | **7** | 2 | 0 | — | 0 | Wręcz | SPECJALNA |
| 8 | Lama (tragarz) | Brąz | **Inkowie** | — | 10 | lama | 1 | 1 | 0 | 0 | 1 | 2 | 20 | 1 | 1 | 0 | — | 0 | Wsparcie | aktualizacja |

---

## Rekomendacja: jednostka specjalna / sygnaturowa

### Jednostka SYGNATUROWA: Procarz (Huaracoc)

Procarz jest **sygnaturą cywilizacyjną Inków** — tą jednostką, która odróżnia ich na polu bitwy. Uzasadnienie:

1. **Historyczna trafność:** Proca (huaraca) była najważniejszą i najbardziej charakterystyczną bronią armii inkaańskiej. Każdy Inka uczył się jej od dziecka. Dzięki niej Inkowie dominowali na obszarze, gdzie konie i rydwany nie istniały.
2. **Niszowe wypełnienie:** Inkowie nie mają konnicy ani rydwanów — muszą rekompensować to zasięgiem. Procarz z Zasięgiem 3 i Atakiem dyst 6 daje im tę przewagę.
3. **Tanio w surowcach:** kamień (nie braz) × 2 — bardzo łatwy w masowej produkcji, co odzwierciedla inkaańską taktykę masowych formacji.
4. **Mechanika pocisków:** 10 pocisków (najwyżej ze wszystkich dystansowych poza przyszłymi tech) — podkreśla wyspecjalizowanie.

**Stat wyróżniający:** Atak dystansowy 6 + Zasięg 3 hex + Ilość pocisków 10 = najlepsza jednostka dystansowa Epoki Brązu, ale tylko dystansowa (Atak wręcz = 1).

### Jednostka SPECJALNA (elitarna): Królewska Gwardia Przyboczna

Królewska Gwardia jest **jednostką elitarną** (jak Jaguar u Majów, Legionista u Rzymian, Impi u Zulusów). Uzasadnienie:

1. **Morale 7** — najwyższe w grze (ex aequo z Jaguar Majów); symbolizuje fanatyczne oddanie Sapa Ince.
2. **Atak 5** — najwyższy wśród piechoty wręcz Brązu.
3. **Koszt 24** — droga, ale nie przełamująca równowagi (Rydwan = 30, Jeździec chiński = 28).
4. **Bez zasięgu** — czysty kontrabalans Procarza; razem tworzą tandem Inkowie: masa Procarzy z osłoną Gwardii.

### Główna rekomendacja (jedna jednostka)

> **Procarz (Huaracoc)** jako sygnatura Inków — najsilniejszy wyróżnik cywilizacyjny, mechanicznie unikatowy (wysoki zasięg + niski wymagania surowcowe + mechanika pocisków), historycznie trafny.

Królewska Gwardia to jednostka **specjalna elitarna** (drugi priorytet), nie sygnaturowa.

---

## Uwagi do implementacji w Jednostki.xlsx

1. **Nowa kolumna "Ilość pocisków"** — dodać między kolumną S (`Zasięg ataku (hex)`) a T (`Uwagi`). Dla jednostek wręcz: wartość 0 lub kreska (—). Ta kolumna nie istnieje jeszcze w pliku.

2. **Surowiec "kamień"** — Procarz wymaga surowca `kamień`, który może nie istnieć w Surowce.xlsx. Sprawdzić i dodać jeśli potrzeba (kamień jest już używany jako epoka "Kamień" ale może nie jako surowiec).

3. **Lama (tragarz)** — zmienić Kulturę z "Majowie" na "Inkowie" w komórce C19 (lub odpowiedniej po dodaniu nowych wierszy).

4. **Inkowie nie mają:** Konnica, Rydwan (woły), Rydwan konny — to ograniczenie cywilizacyjne, nie jednostki do dodania.

5. **Kolejność wierszy:** Proponuję wstawić wszystkie jednostki Inków po wierszu Oszczepnik Zulu (Izijula), przed wierszem pustym (wiersz 20 = "Rydwan konny - epoka Żelaza").

---

*Propozycja do zatwierdzenia przed edycją Jednostki.xlsx.*

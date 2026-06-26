# EKONOMIA — Analiza surowców i budynków (wczesne epoki)

## MODEL DOSTĘPU v0.1 (ZATWIERDZONY 2026-06-25)

> **Ten rozdział zastępuje wcześniejsze rekomendacje ilościowe** z sekcji E (Część E poniżej).
> Wcześniejsze rekomendacje E1–E8 dotyczące konwerterów, magazynowania ilościowego, materiałowych kosztów budynków itp.
> pozostają jako **kontekst v0.2** — są oznaczone w Części E.

### 1. Zasada podstawowa: surowiec = DOSTĘP (boolean)

W v0.1 **nie liczymy sztuk ani nie magazynujemy surowców przetworzonych**.
Cywilizacja albo MA dostęp do surowca, albo nie — i to wystarczy do bramkowania bonusów budynków.

| Co odpada w v0.1 | Co zostaje w v0.1 |
|---|---|
| Konwertery ilościowe (Tartak/Mielerz/Cegielnia/Huta/Garncarnia jako ilościowe) | Spichlerz (magazyn ŻYWNOŚCI — żywność dalej ilościowa, wzrost populacji) |
| Magazyn surowców per-typ (`resourceStorageCapacityPerType` / `applyResourceIntake`) | Złoża na heksach mapy (terytorium → dostęp do surowca) |
| Ilości/przeroby w Excelu (aktywne dane → parking) | Budynki-przetwórnie z PŁASKIM bonusem (+Produkcja/+Pieniądz) |
| converters.ts (logika 1:1 + przepustowość) — **PARKOWANE, NIE kasować** | Bramkowanie bonusu budynku wg pola `wymaganySurowiec` |

### 2. Terytorium cywilizacji

```
Terytorium_cywilizacji = suma zasięgów wszystkich jej MIAST + FORTÓW + STRAŻNIC
```

- Budowa kolejnych miast / fortów / strażnic rozszerza terytorium.
- Ulepszenia terenu (kopalnia, farma, pastwisko itp.) można stawiać **TYLKO w terytorium cywilizacji**.
- Złoża surowców są przypisane do heksów na mapie globalnej.

### 3. Dostęp do surowca (per cywilizacja)

```
dostęp(surowiec, cyw) = TRUE  gdy:
    (1) złoże surowca leży w terytorium cyw  ORAZ
    (2) odpowiednie ulepszenie terenu (kopalnia/farma/pastwisko) jest postawione na tym złożu
```

Wynik: cywilizacja posiada zbiór `dostępneSurowce: Set<string>` — klucze ASCII surowców.

### 4. Użyteczność surowca — budynek-przetwórnia

```
bonus_aktywny(budynek, miasto) = TRUE  gdy:
    (1) budynek wybudowany w mieście  ORAZ
    (2) budynek.wymaganySurowiec ∈ dostępneSurowce(cyw)   [lub brak wymogu → zawsze aktywny]
```

Bonus budynku to **płaska wartość** (+Produkcja lub +Pieniądz), kumulująca się w mieście
(zgodnie z `economy.ts`: budynki = płaska baza Pracy/Pieniądza, master §8e).

**Przykłady bramkowania:**

| Budynek | wymaganySurowiec | Efekt aktywny gdy |
|---|---|---|
| Kuźnia | `ruda` | cyw ma dostęp do Rudy |
| Stolarnia | `drewno` | cyw ma dostęp do Drewna (las w zasięgu + brak blokady) |
| Warsztat kamieniarski | `kamien` | cyw ma dostęp do Kamienia |
| Targowisko | *(brak)* | zawsze aktywny |
| Spichlerz | *(brak)* | zawsze aktywny (magazyn żywności) |

> **Uwaga dot. Kuźni:** wymaganie zmienione z „miedź lub cyna" → `ruda` (niespójność w buildings.json rozwiązana modelem dostępu).

### 5. Co jest PARKOWANE do v0.2 (NIE kasować — kod + dane Excel zostają)

| Co parkujemy | Gdzie leży | Dlaczego parkujemy |
|---|---|---|
| `converters.ts` (logika 1:1 + przepustowość) | `gra/src/game/converters.ts` | Ilościowe konwersje nie wchodzą w v0.1 |
| `resourceStorageCapacityPerType` / `applyResourceIntake` | `economy-upkeep.ts` | Magazyn surowców per-typ = v0.2 |
| Ilości/przeroby surowców w Excelu | `EKONOMIA-panel-parametrow.xlsx` | Dane pomocnicze na przyszłość |
| Tartak/Mielerz/Cegielnia/Huta/Garncarnia jako konwertery ilościowe | `buildings.json` (do dodania jako budynki z płaskim bonusem) | W v0.1 stają się budynkami z bonusem bez przeliczania ilości |

**AKTYWNE w v0.1:** Spichlerz (magazyn ŻYWNOŚCI) — żywność dalej ilościowa, mechanika wzrostu populacji bez zmian.

### 6. Zakres epok v0.1

**Kamień + Brąz + ŻELAZO** (3 epoki — decyzja Maciej 2026-06-25).
- Epoka Żelazo: brak jeszcze budynków → do zaprojektowania w lane MIASTO + DANE.
- Dane units.json dla Żelaza = placeholdery (nie aktywować bez doprojektowania ekonomii Żelaza).

### 7. Jak model upraszcza 5 luk (z Części A–C poniżej)

| Luka (stara analiza) | Rozwiązanie w v0.1 |
|---|---|
| Brak konwerterów w buildings.json | Budynki-przetwórnie dostają płaski bonus (+Praca/+Pieniądz), nie są już konwerterami ilościowymi |
| Kuźnia wymaga Miedź/Cyna (nie ma w resources.json) | Wymaganie zamienione na `wymaganySurowiec: "ruda"` |
| Ceramika/Cegła — martwe (brak konsumpcji ilościowej) | Garncarnia i Cegielnia → budynki z płaskim bonusem (np. +zadowolenie/+produkcja) bez konsumpcji ilościowej |
| Kopalnia/Młyn/Mennica/Akwedukt — brak w buildings.json | Dodać do `buildings.json` jako budynki z płaskim bonusem i opcjonalnym `wymaganySurowiec` (zadanie: lane MIASTO + DANE) |
| Brak `improvements.json` (ulepszenia terenu) | Nowy plik `improvements.json` — zadanie lane DANE; ulepszenia warunkują dostęp do surowca |

### 8. Handel surowcami między cywilizacjami (szkic v0.2+)

Handel = wymiana **dostępu** (nie ilości). Umowa dyplomatyczna może dać cywilizacji
tymczasowy dostęp do surowca sojusznika (rozszerzenie zbioru `dostępneSurowce`).
Szczegóły: lane DYPLOMACJA, poza zakresem v0.1.

---

<!-- ================================================================== -->
<!-- PONIŻEJ: oryginalna analiza z 2026-06-25 — zachowana jako KONTEKST -->
<!-- Rekomendacje E1–E8 dotyczą modelu ILOŚCIOWEGO (v0.2).              -->
<!-- W v0.1 obowiązuje MODEL DOSTĘPU powyżej.                           -->
<!-- ================================================================== -->


**Autor:** Sonnet-subagent sesji Civ-EKONOMIA  
**Data:** 2026-06-25  
**Zakres:** Epoka Kamień (1) + Brąz (2); informacyjnie Żelazo (3).  
**Źródła:** `gra/data/resources.json`, `buildings.json`, `units.json`, `tech.json`, `econ-params.json`, `Spec-ekonomia.md`, `PROJEKT-GRY-master.md`, `gra/src/game/converters.ts`, `economy-upkeep.ts`.

---

## Część A — Budynki per epoka

### A1. Epoka Kamień (epokaWejscia = 1) — 8 budynków w buildings.json

| ID | Nazwa | Kategoria | Rola ekonomiczna | Wymaga (tech) | Co daje (baza) | Wymaganie terenu |
|---|---|---|---|---|---|---|
| stolarnia | Stolarnia | Produkcja | Główne źródło Pracy (drewno → Praca) | Obróbka drewna | +5 Praca | las w zasięgu |
| kamieniarski | Warsztat kamieniarski | Produkcja | Źródło Pracy ze złóż kamienia | Murarstwo | +4 Praca | kamień w zasięgu |
| targowisko | Targowisko (Rynek) | Pieniądz | Główne źródło Pieniądza + mnożnik handlu | Wymiana | +3 Pieniądz, +10% handel | brak |
| spichlerz | Spichlerz | Żywność | Magazyn żywności + bonus +2 żywn./turę | Garncarstwo | +2 Żywność | brak |
| swiatynia | Świątynia | Kultura | Kultura + zadowolenie (stabilność) | Mistycyzm | +2 Kultura, +2 Zadow. | brak |
| studnia | Studnia / Łaźnie | Zdrowie | Zdrowie (proxy przez Zadowolenie) | Gospodarka wodna | +1 Zadow. | brak |
| stela | Stela / Pomnik | Kultura | Minimalny bonus kultury, bez utrzymania | Murarstwo | +1 Kultura | brak |
| palac | Pałac | Kultura/Admin | Główne źródło kultury, mnożnik 5% | (brak tech) | +3 Kultura, +1 Zadow. | brak |

**Epoka Kamień — LUKI:**

1. **Brak konwerterów w buildings.json** — Spec i converters.ts definiują 5 konwerterów (Tartak, Mielerz, Cegielnia, Huta, Garncarnia), ale ŻADEN z nich nie jest w `buildings.json`. To krytyczna niespójność: kod w converters.ts jest gotowy, dane JSON nie.
2. **Brak Kopalni** — tech.json odblokowuje Kopalnię przez Murarstwo, Spec ją wymienia, ale brak jej w buildings.json.
3. **Brak Pastwiska** (modyfikacja terenu) — odblokowane przez „Oswojenie zwierząt" wg tech.json; nie jest w buildings.json (poprawne: to ulepszenie terenu, nie budynek miejski — ale brak definicji gdziekolwiek w data/).
4. **Brak Młyna** — econ-params.json zawiera `budynek_mlyn_mnoznik_pracy` i `budynek_mlyn_bonus_pracy` (kluczowy mnożnik Pracy), Spec-ekonomia.md opisuje go szczegółowo, ale budynek nie istnieje w buildings.json.
5. **Brak Mennicy** — econ-params.json ma `budynek_mennica_mnoznik`, Spec ją wymienia jako konwerter Handel→Pieniądz, ale brak jej w buildings.json.
6. **Brak budynku Nauka w epoce 1** — Biblioteka jest w epoce 2 (Brąz). W epoce Kamień nie ma żadnego budynku generującego Naukę. Postęp technologiczny w Kamieniu oparty wyłącznie na suwaku Handel→Nauka.

---

### A2. Epoka Brąz (epokaWejscia = 2) — 7 budynków w buildings.json

| ID | Nazwa | Kategoria | Rola ekonomiczna | Wymaga (tech) | Co daje (baza) | Wymaganie terenu |
|---|---|---|---|---|---|---|
| kuznia | Kuźnia | Produkcja+Wojsko | Praca + 5% mnożnik siły jednostek | Brązownictwo | +6 Praca, +1 Pieniądz, +5% sił. | miedź lub cyna w zasięgu |
| port | Port handlowy | Pieniądz | Duży bonus Pieniądza dla miast morskich | Żegluga | +5 Pieniądz, +1 Praca | wybrzeże/rzeka |
| karawanseraj | Karawanseraj | Pieniądz | Handel lądowy + mnożnik | Handel | +6 Pieniądz, +8% szlaki | brak |
| biblioteka | Biblioteka | Nauka | Pierwsze źródło Nauki jako budynek | Pismo | +3 Nauka, +1 Kultura | brak |
| mury | Mury | Obrona | Obrona miasta | Budownictwo | +5 Obrona | brak |
| koszary | Koszary | Wojsko | +5% sił/exp jednostek + Praca | Wojskowość | +2 Praca, +5% mnożnik | brak |
| magazyn | Magazyn | Produkcja+Pieniądz | Zwiększa pojemność magazynu surowców + mały Pieniądz/Praca | Handel | +1 Praca, +1 Pieniądz | brak |

**Epoka Brąz — LUKI:**

1. **Wymaganie Kuźni niespójne** — buildings.json: „miedź lub cyna w zasięgu". Ale resources.json nie definiuje Miedzi ani Cyny jako surowców. Istniejące surowce metaliczne to wyłącznie „Ruda" i „Brąz". Wymaganie Kuźni jest martwe/niespójne.
2. **Brak Akweduktu** — Spec wymienia Akwedukt (econ-params: `akwedukt_prog_ludnosci`), blokuje wzrost powyżej 4–8 ludności. Nie ma go w buildings.json. Kluczowy dla późnej gry epoki Brązu.
3. **Brak Stajni** — resources.json wspomina „Stajnia (później)" jako źródło Koni, ale budynek nie istnieje w buildings.json.
4. **Brak budynku Pastwisko/Pasterstwo** — budynki hodowli (Pastwisko = ulepszenie terenu; potrzebna definicja mechaniki w data/).

**ROZBIEŻNOŚĆ EPOK:** Master mówi „v0.1 = Kamień + Brąz" (2 epoki), tech.json ma wpisy dla Epoki Żelazo (3. epoka, np. Kusznik). Dane units.json i buildings.json potwierdzają istnienie Żelaza. Epoka Żelaza jest zatem w danych ale prawdopodobnie nie w pełni zaimplementowana. Analiza na życzenie rozszerza zakres o Żelazo, ale zakres v0.1 to Kamień+Brąz.

---

## Część B — Surowce — pełna tabela

| Surowiec | Typ | Źródło / Jak produkowany | Gdzie zużywany | Magazynowanie |
|---|---|---|---|---|
| Żywność | surowy | pola (wg terenu) | populacja (1/os/turę), jednostki wojskowe (1/j/turę) | Spichlerz (cap: 20×5=100 z normal+Spichlerz) |
| Drewno | surowy | Las (nakładka terenu) | Łucznik (×4), Kusznik (×4-5), Galera (×4 Deski wymagane), wejście Tartaku i Mielerza | Magazyn |
| Kamień | surowy | Wzgórza/Góry + Kopalnia | budulec (koszty budynków — w Spec; liczby tylko w Budynki.xlsx) | Magazyn |
| Glina | surowy | złoże Gliny | wejście Cegielni (+ paliwo → Cegła) i Garncarni (+ paliwo → Ceramika) | Magazyn |
| Ruda | surowy | złoże Rudy + Kopalnia | wejście Huty (+ paliwo → Brąz) | Magazyn |
| Bydło/Wół | hodowla | złoże + Pastwisko (zarodek wymagany) | Rydwan na wołach (×1), +Praca miasta gdy przypisane | brak definicji w magazynowaniu |
| Owce | hodowla | złoże + Pastwisko | +2 żywności gdy przypisane — BRAK jednostki/budynku wymagającego Owiec bezpośrednio | brak definicji |
| Lama | hodowla | złoże + Pastwisko (tylko Inkowie/Ameryka Pd.) | transport surowców (mechanika TBD) — BRAK konkretnego zużycia w units.json | brak definicji |
| Koń | hodowla | złoże Konie / Stajnia | Konnica (×1), Jeździec chiński (×1), Rydwan konny (×1), Rydwan egipski/sumeryjski/mykeński/Shang/celtycki (×1) | brak definicji |
| Deski | przetworzony | Tartak (1 drewno → 1 deska) | Galera (×4), budulec budynków (Spec) | Magazyn |
| Paliwo (węgiel drzewny) | przetworzony | Mielerz (1 drewno → 1 paliwo) | Cegielnia (wejście), Garncarnia (wejście), Huta (wejście) | Magazyn |
| Cegła | przetworzony | Cegielnia (glina+paliwo → cegła) | budulec budynków (Spec) — brak bezpośredniego zużycia w units.json | Magazyn |
| Ceramika | przetworzony/luksus | Garncarnia (glina+paliwo → ceramika) | +zadowolenie, +Zdrowie — BRAK przypisania do konkretnego budynku/jednostki w JSON | Magazyn |
| Brąz | przetworzony | Huta (ruda+paliwo → brąz) | Włócznik (×4), Wojownik z tarczą (×5), Falanga (×5), Legionista (×5), Impi (×4), Wojownik z toporem (×4), Królewska Gwardia (×3), Wojownik khopesh (×5), Włócznik sumeryjski (×5), Wojownik mykeński (×5), Wojownik Sherden (×5), Halabardnik Shang (×5), Wojownik celtycki/germański | Magazyn |

### B1. Surowce zdefiniowane ale NIGDZIE nie zużywane (martwe lub niekompletne)

- **Ceramika** — produkowana przez Garncarnię, ale brak budynku/jednostki, która by jej wymagała w buildings.json lub units.json. W resources.json „+zadowolenie, +Zdrowie" ale mechanika niepodłączona.
- **Cegła** — wymieniana jako budulec w Spec i master, ale brak kolumny materiałów w buildings.json (budynki mają tylko `kosztBudowy` w Pracy, bez surowców materialnych). Cegła faktycznie nigdzie nie jest zużywana w danych JSON.
- **Kamień** — j.w. Produkowany przez Kopalnię (nie ma w buildings.json), wymieniony jako budulec, ale brak mechaniki konsumpcji w JSON.
- **Lama** — zdefiniowana w resources.json ale żadna jednostka w units.json jej nie wymaga, żaden budynek jej nie zużywa. „Transport surowców" = mechanika TBD.
- **Owce** — zdefiniowane, efekt +2 żywności poprzez Pastwisko, ale brak bezpośredniego odniesienia w units.json ani buildings.json. Mechanika Pastwiska nie ma pliku danych.

### B2. Wymagania surowcowe odwołujące się do nieistniejącego surowca

- **Kuźnia** (buildings.json): wymaga „miedź lub cyna w zasięgu" — ani Miedź, ani Cyna nie istnieją w resources.json. **Krytyczna niespójność.**
- **Rydwan (woły)** (units.json): wymaga surowca `wol` (klucz lowercase) — resources.json ma „Bydło (krowa/wół)" (pełna nazwa z polskim tytułem). Klucze nie pasują. converters.ts ostrzega w komentarzu o problemie mapowania kluczy ASCII.
- **Konnica, Rydwan konny, etc.** (units.json): wymaga surowca `Koń` (z wielką literą) — resources.json ma „Koń" (pasuje nazewniczo, ale klucz nie jest zdefiniowany jako ASCII ID).

---

## Część C — Mechanizmy produkcji i magazynowania

### C1. Łańcuch produkcji surowców

```
POLE (teren) → surowiec surowy → KONWERTER → surowiec przetworzony → ZUŻYCIE
                                                                     (budynki/jednostki)

Las          → Drewno  → Tartak  → Deski     → Galera (×4), budulec
                       → Mielerz → Paliwo    → Cegielnia, Garncarnia, Huta
złoże Gliny  → Glina   → Cegielnia(+paliwo) → Cegła     → budulec [mechanika TBD]
                       → Garncarnia(+paliwo) → Ceramika  → zadowolenie [mechanika TBD]
złoże Rudy   → Ruda    → Huta(+paliwo)      → Brąz      → jednostki bronzowe (×3-5)
             (+ Kopalnia)
złoże Konie  → Koń                          → jednostki konne (×1)
złoże Bydło  → Wół                          → Rydwan wół (×1), +Praca miasta
złoże Owce   → Owce                         → +żywność przez Pastwisko
```

### C2. Co już zaimplementowane (converters.ts + economy-upkeep.ts)

**converters.ts (kompletny, gotowy moduł):**
- Receptury dla 5 konwerterów: Tartak, Mielerz, Cegielnia, Huta, Garncarnia
- Parametry przepustowości czytane z econ-params.json (budynki.budynek_*_przepustowosc)
- Logika: min(przepustowość, limit_wejścia, wolne_miejsce_wyjścia) → brak marnowania
- Kolejność ma znaczenie: Mielerz przed Hutą/Cegielnią (paliwo produkowane najpierw)
- **Problem kluczy ASCII**: moduł używa kluczy `drewno/deski/paliwo/glina/cegla/ruda/braz/ceramika` — resources.json ma polskie nazwy bez ID ASCII. Integrator musi mapować, ale mapowanie nigdzie nie jest zdefiniowane.

**economy-upkeep.ts (kompletny):**
- `foodStorageCapacity(maSpichlerz, params)` — pojemność: 20 (bez) lub 100 (ze Spichlerzem, normal)
- `resourceStorageCapacityPerType(maMagazyn, params)` — 10 (bez) lub 50 (z Magazynem, normal)
- `clampStore(amount, capacity)` — overflow przepada (zgodnie ze Spec)
- Czyta z econ-params.json: `magazyn_baza_zywnosc/surowce`, `magazyn_mnoznik_spichlerz`
- `applyResourceIntake` — zasila magazyn z pól
- `onCityConquered` — zeruje magazyn surowców, 50% żywności (Spec s.7.3)

### C3. Czego brakuje

1. **Konwertery w buildings.json** — converters.ts nie może wiedzieć, czy budynek jest wybudowany, bo Tartak/Mielerz/Cegielnia/Huta/Garncarnia nie istnieją w buildings.json. Brak integracji.
2. **Mapowanie kluczy surowców** — żaden plik nie definiuje mapowania nazwa_PL → klucz_ASCII (np. „Brąz" → `braz`). Handoff między converters.ts a resztą systemu jest zadeklarowany ale niezrealizowany.
3. **Kopalnia jako budynek w buildings.json** — bez Kopalni nie można wydobywać Kamienia ani Rudy z wzgórz/gór (warunek technologiczny jest w tech.json, ale brak implementacji budynku).
4. **Pastwisko jako ulepszenie terenu** — brak pliku danych definiującego ulepszenia terenu (Farma, Irygacja, Droga, Kopalnia, Pastwisko). econ-params.json ma parametry (`ulepszenie_pastwisko_bydlo_produkcja`, `ulepszenie_kopalnia_kamien` etc.) ale nie ma pliku struktury ulepszeń.
5. **Materiałowe koszty budynków** — buildings.json ma `kosztBudowy` tylko w Pracy (liczba), bez rozbicia na surowce materialne (Drewno/Kamień/Deski/Cegła). Spec i Master mówią o kosztach materialnych (E1: drewno, kamień, deski, cegła; E2: +brąz). Dane są tylko w Budynki.xlsx, nie w buildings.json.
6. **Stajnia** — resources.json wymienia „Stajnię (później)" jako źródło Koni, ale budynek nie istnieje.
7. **Akwedukt** — econ-params ma parametr blokady wzrostu (próg 4–8 ludności bez Akweduktu), ale Akweduktu nie ma w buildings.json.

---

## Część D — Handel między nacjami (niedobory, nadmiary, motywacja)

### D1. Analiza dostępu do surowców per typ cywilizacji

Gra ma 9 typów cywilizacji (Grecy, Rzym, Chiny, Inkowie, Zulusi, Egipt, Sumerowie + 2 planowane). Mapa jest losowana, ale złoża surowców są przypisane do typów terenu. Tworzy to naturalne niedobory:

| Surowiec | Kto może mieć | Kto nie ma |
|---|---|---|
| Koń | cywilizacje Eurazji/Afryki | **Inkowie** (Ameryka — konie wyginęły 10 000 p.n.e.), **Majowie** (historyczna nieścisłość; w grze Inkowie) |
| Bydło/Wół | większość | **Inkowie** (Ameryka Środkowa — brak w Nowym Świecie przed kontaktem) |
| Lama | tylko **Inkowie** | wszyscy inni |
| Ruda (do Brązu) | kto ma góry/wzgórza | cywilizacje na nizinach (bez gór) |
| Drewno | kto ma Las | cywilizacje stepowe/pustynne (Egipt, Sumerowie) |
| Glina | złoże Gliny | brak dostępu → brak Ceramiki i Cegły |

### D2. Niedobory strategiczne

- **Bez Brązu** → nie można rekrutować żadnej jednostki bronzowej (stanowią 80%+ armii epoki Brązu). Cywilizacja bez Rudy lub Paliwa (bez Drewna→Mielerz→Paliwo) nie może produkować Brązu.
- **Bez Koni** → Inkowie nie mają Konnicy, Rydwanów konnych. Substytutem jest Lama (tylko transport) i Rydwan na wołach (jeśli mają Bydło). Mechanicznie silna asymetria → motywacja handlu lub podboju.
- **Bez Drewna** → brak Desek, brak Galery, brak Łucznika (×4 drewna). Egipt/Sumerowie historcznie importowali drewno z Libanu.

### D3. Zarys mechaniki handlu (styk z lane DYPLOMACJA)

Handel surowcami między nacjami wymaga:
1. **Oferta/Popyt** — miasto/gracz zgłasza zapotrzebowanie lub nadmiar surowca
2. **Transfer** — tyle jednostek surowca z magazynu A do magazynu B (szlak handlowy; droga/port)
3. **Cena** — w Pieniądzu lub Handlu (bezpośrednia wymiana surowiec:surowiec)
4. **Dyplomacja** — warunek: pokój lub sojusz (nie możesz handlować z wrogiem)

**Rekomendacja v0.1:** Handel surowcami wprowadzić jako opcję prostą (jednokierunkowy transfer za Pieniądz, bez negocjacji cenowej) — szczegóły: **lane DYPLOMACJA**. W v0.1 wystarczy model dostępu (czy cywilizacja MA surowiec z własnego terytorium).

---

## Część E — Rekomendacje i pytania do Maciej *(KONTEKST — model ilościowy v0.2; w v0.1 obowiązuje MODEL DOSTĘPU na górze)*

### E1. Ile epok w v0.1?

**Rozbieżność:** Master mówi „v0.1 = Kamień + Brąz". Zadanie analizy pyta o Żelazo jako 3. epokę. Dane (units.json) zawierają jednostki Żelaza (Kusznik, Wojownik celtycki, Gaesatae, Wojownik germański, Berserker).

**Rekomendacja A:** Potwierdzić, że v0.1 = Kamień + Brąz. Dane Żelaza to placeholdery na przyszłość — nie aktywować przed pełnym wdrożeniem ekonomii Brązu.  
**Alternatywa B:** Rozszerzyć zakres v0.1 do Kamień+Brąz+Żelazo (wymaga doprojektowania ekonomii Żelaza — stal, węgiel kamienny, nowe budynki).

---

### E2. Konwertery — kiedy dodać do buildings.json?

**Problem:** converters.ts jest zaimplementowany i gotowy, ale Tartak/Mielerz/Cegielnia/Huta/Garncarnia nie istnieją w buildings.json. Bez tego ekonomia materiałów jest martwą logiką.

**Rekomendacja A:** Priorytet: dodać 5 wpisów konwerterów do buildings.json (epoka 1: Tartak, Mielerz, Cegielnia, Garncarnia; epoka 2: Huta) z kosztami i wymaganiami technologii. Jednocześnie zdefiniować ASCII ID w resources.json i mapowanie.  
**Alternatywa B:** Odłożyć konwertery do v0.2 (wdrożyć ekonomię bez materiałów: tylko Praca/Pieniądz/Handel). Zagrożenie: część kodu będzie martwym stub-em.

---

### E3. Klucze surowców — ASCII vs polskie nazwy

**Problem:** converters.ts używa kluczy ASCII (`drewno`, `braz`, `glina` etc.). resources.json ma polskie nazwy pełne bez pola `id`. units.json używa mieszanki (`braz`, `wol`, `Koń`, `Deski`). Brak spójnego schematu.

**Rekomendacja A:** Dodać pole `"id"` (ASCII lowercase, bez polskich znaków) do każdego surowca w resources.json. Zstandaryzować klucze w units.json. Napisać jednostkowy test mapowania.  
**Alternatywa B:** Tworzyć mapowanie na poziomie integracji (plik config lub hardcode w silniku). Ryzyko: dryft między plikami.

---

### E4. Wymaganie Kuźni — Miedź/Cyna

**Problem:** buildings.json: Kuźnia wymaga „miedź lub cyna w zasięgu" — tych surowców nie ma w resources.json.

**Rekomendacja A:** Zmienić wymaganie Kuźni na „ruda w zasięgu" (spójne z istniejącą ekonomią) i usunąć wzmiankę o Miedzi/Cynie z buildings.json.  
**Alternatywa B:** Dodać Miedź i Cynę jako nowe surowce (wymaga aktualizacji resources.json, tech.json, Spec, rozbudowania łańcucha Ruda→Miedź→Cyna→Brąz).

---

### E5. Materiałowe koszty budynków — v0.1 czy v0.2?

**Problem:** Spec i Master opisują koszty materialne budynków (Drewno, Kamień, Deski, Cegła na wzniesienie). buildings.json ma tylko `kosztBudowy` w Pracy. Brakuje kolumny materiałów.

**Rekomendacja A:** Wprowadzić w v0.1 uproszczony model materialny: każdy budynek wymaga określonej ilości surowców do budowy (dodać pole `kosztMaterialy: {drewno: N, kamien: M}` do buildings.json). Dane do pobrania z Budynki.xlsx.  
**Alternatywa B:** Odłożyć koszty materiałów do v0.2, w v0.1 budynki kosztują tylko Pracę.

---

### E6. Pastwisko i ulepszenia terenu — gdzie dane?

**Problem:** Pastwisko (+ Farma, Irygacja, Droga, Kopalnia) są wymieniane jako ulepszenia terenu budowane Robotnikiem. econ-params.json ma parametry (bonusy), ale brak pliku struktury ulepszeń (np. `improvements.json`).

**Rekomendacja A:** Stworzyć `gra/data/improvements.json` z definicją ulepszeń terenu (id, koszt Pracy, efekty, wymagana tech) — lane DANE.  
**Alternatywa B:** Hardcode ulepszeń w silniku MAPA/SILNIK.

---

### E7. Ceramika i Cegła — martwe w v0.1?

**Problem:** Ceramika (+zadowolenie, +Zdrowie) i Cegła (budulec) są produkowane przez Garncarnię i Cegielnię, ale:
- Ceramika: brak budynku/mechaniki w JSON, która by ją konsumowała.
- Cegła: brak kolumny kosztów materialnych w buildings.json.

**Rekomendacja A:** W v0.1 Ceramika automatycznie daje bonus zadowolenia miastu (1 szt. ceramika w magazynie = +1 zadowolenie) — prosta mechanika, niska złożoność. Cegła zużywana przez koszty materialne budynków (po E5A). Powiązać z `luksus_przelicznik_zadowolenie` w econ-params.  
**Alternatywa B:** Zawiesić Garncarię jako budynek „kosmetyczny" do v0.2.

---

### E8. Handel surowcami między cywilizacjami — kiedy?

**Rekomendacja A:** Mechanika wymiany surowców (transfer z magazynu do magazynu przez szlak) = **lane DYPLOMACJA**, nie v0.1. W v0.1 wystarczy model dostępu binarny (ma/nie ma).  
**Alternatywa B:** Prosta wymiana 1:1 w v0.1 (Inkowie dają Lamę, Europa daje Konia) jako proof-of-concept. Nakład: ~1 sprint.

---

## Podsumowanie cross-lane

| Temat | Lane |
|---|---|
| Parametry ekonomiczne, progi, mnożniki | EKONOMIA |
| Konwertery (converters.ts, economy-upkeep.ts) | EKONOMIA |
| Definicje budynków w buildings.json | MIASTO |
| Definicje surowców w resources.json, klucze ASCII | DANE |
| Ulepszenia terenu (improvements.json) | DANE / MAPA |
| Handel surowcami między graczami | DYPLOMACJA |
| Wymagania technologiczne budynków/konwerterów | DANE (tech.json) |
| Pastwisko jako modyfikacja terenu | MAPA |

---

*Koniec dokumentu. Wygenerowany przez Sonnet-subagent sesji Civ-EKONOMIA, 2026-06-25.*

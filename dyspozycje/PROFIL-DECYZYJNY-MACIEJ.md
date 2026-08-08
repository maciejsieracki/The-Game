# PROFIL DECYZYJNY — Maciej (rekomendacje AI vs decyzje właściciela)

> **DRAFT — nie przeszedł jeszcze przez Evaluatora, traktować jako materiał wejściowy, nie kanon.**
> Sporządzone 2026-08-08 na zlecenie: przeanalizować dotychczasowe pytania ABC (rekomendacja AI vs
> litera wybrana przez Maciej), wyciągnąć wzorzec myślenia. Metoda: czytanie źródłowe (`docs/decyzje/*.md`
> w pierwszej kolejności, potem `dyspozycje/REJESTR-PROSB-I-ZADAN.md`, `dyspozycje/PYTANIA-OTWARTE.md`,
> `dyspozycje/_handoff/KANAL-PRACA.md`), cytaty dosłowne tam, gdzie są zacytowane w dokumencie źródłowym.
> Żadna litera/wniosek nie jest zgadywany — pary bez jednoznacznie zapisanej rekomendacji AI **zostały
> pominięte**, nie domniemane.

---

## 1. Tabela par (rekomendacja AI vs decyzja Macieja)

Legenda: **Zgodne** — T (rekomendacja AI = wybrana litera), N (Maciej wybrał inaczej).

| # | ID | Data | Plik źródłowy | Rekomendacja AI | Decyzja Macieja | Zgodne |
|---|----|------|----------------|------------------|-------------------|--------|
| 1 | C-WIAR-D4 | 2026-07-27 | `docs/decyzje/C-WIAR-D4.md` | A | A | T |
| 2 | C-WIAR-N1-UX | 2026-07-27 | `docs/decyzje/C-WIAR-N1-UX.md` | A | A | T |
| 3 | C-TEREN-IMPL-1 | 2026-07-27 | `docs/decyzje/C-TEREN-IMPL-1.md` | C | A | **N** |
| 4 | C-TEREN-IMPL-2 | 2026-07-27 | `docs/decyzje/C-TEREN-IMPL-2.md` | A | C | **N** |
| 5 | C-TEREN-IMPL-3 | 2026-07-27 | `docs/decyzje/C-TEREN-IMPL-3.md` | B | B | T |
| 6 | P-AI-006 | 2026-07-27 | `docs/decyzje/P-AI-006.md` (rec. w `ABC-KOLEJKA-OTWARTE-2026-07-27.md`) | B | C | **N** |
| 7 | P-AI-007 | 2026-07-27 | `docs/decyzje/P-AI-007.md` | A | A | T |
| 8 | P-AI-008 | 2026-08-05 | `docs/decyzje/P-AI-008.md` | C | **własna, poza A/B/C** | **N** |
| 9 | R-MAPGEN-KOLEJNOSC-Q1 | 2026-07-27 | `ABC-KOLEJKA-OTWARTE-2026-07-27.md` | A | B | **N** |
| 10 | R-MAPGEN-KOLEJNOSC-Q2 | 2026-07-27 | `docs/decyzje/R-MAPGEN-KOLEJNOSC-Q2.md` | A | C | **N** |
| 11 | R-MAPGEN-KOLEJNOSC-Q3 | 2026-07-27 | `docs/decyzje/R-MAPGEN-KOLEJNOSC-Q3.md` | A | A | T |
| 12 | R-BITWA-POWTORKA-I | 2026-07-27 | `docs/decyzje/R-BITWA-POWTORKA-I.md` | A | B | **N** |
| 13 | C-MPDIFF-Q1 | 2026-08-05 | `docs/decyzje/C-MPDIFF-Q1.md` | C | A | **N** |
| 14 | D-CUD2 | 2026-06-26 | `docs/decyzje/D-CUD2-pytanie-KANON.md` | A | C | **N** |
| 15 | B2-D18-0 | 2026-07-02 | `docs/decyzje/B2-D18-ABC-MACIEJ.md` | A | A | T |
| 16 | B2-D18-1 | 2026-07-02 | jw. | B | A | **N** |
| 17 | B2-D18-2 | 2026-07-02 | jw. | A | A | T |
| 18 | B2-D18-3 | 2026-07-02 | jw. | A | B | **N** |
| 19 | B2-D18-4 | 2026-07-02 | jw. | B | A+C (kombinacja) | **N** |
| 20 | B2-D18-5 | 2026-07-02 | jw. | C | A | **N** |
| 21 | B2-D18-6 | 2026-07-02 | jw. | warunkowa (B/A) | A | *niejednoznaczne* |
| 22 | SP1 | 2026-07-01 | `docs/decyzje/B5-spichlerz-FORMULARZ-SP1-SP6.md` | A | A | T |
| 23 | SP2 | 2026-07-01 | jw. | A | A | T |
| 24 | SP3 | 2026-07-01 | jw. | A | A | T |
| 25 | SP4 | 2026-07-01 | jw. | B | C | **N** |
| 26 | SP5 | 2026-07-01 | jw. | A | A | T |
| 27 | SP6 | 2026-07-01 | jw. | A | C | **N** |
| 28 | A-R7 (łodzie rybackie) | 2026-06-26/30 | `docs/decyzje/MACIEJ-ABC-PACZKA-2026-06-30.md` | B | B | T |
| 29 | B1-tech-Q3 (posterunek) | 2026-06-26/29 | jw. | C | C | T |
| 30 | INK-Q1 (Inkowie/Brąz) | 2026-06-26/29 | jw. | A | B | **N** |
| 31 | MAP-SPAWN-Q2 | 2026-08-01 | `docs/decyzje/MAP-SPAWN-Q2.md` | B | B | T |
| 32 | R-AI-TRUDNOSC P2-Q1 | 2026-08-05 | `docs/decyzje/R-AI-TRUDNOSC-P2-ABC.md` | C | A | **N** |
| 33 | R-AI-TRUDNOSC P2-Q2 | 2026-08-05 | jw. | B | A | **N** |
| 34 | R-AUTO-RACJE-RAISE Q2 | 2026-08-05 | `docs/decyzje/R-AUTO-RACJE-RAISE.md` | A | A | T |
| 35 | R-AUTO-RACJE-RAISE Q3 | 2026-08-05 | jw. | A | A | T |
| 36 | R-AUTO-RACJE-RAISE Q4 | 2026-08-05 | jw. | A | A | T |
| 37 | R-AUTO-RACJE-RAISE Q5 | 2026-08-05 | jw. | A | A | T |
| 38 | R-BUDYNKI-NIEAKTYWNE Q1 | 2026-08-04 | `docs/decyzje/R-BUDYNKI-NIEAKTYWNE-pytanie.md` | A | A | T |
| 39 | R-BUDYNKI-NIEAKTYWNE Q2 | 2026-08-04 | jw. | A | A+C (dopisek) | *częściowo N* |
| 40 | R-BUDYNKI-NIEAKTYWNE Q3 | 2026-08-04 | jw. | A | A | T |
| 41 | R-EOT-EVENT-DEFER-Q1 | 2026-08-04 | `docs/decyzje/R-EOT-EVENT-DEFER.md` | A | A | T |
| 42 | R-OBRONA-MIASTA-MP-Q1 | 2026-08-06 | `docs/decyzje/R-OBRONA-MIASTA-MP.md` | A | A | T |
| 43 | R-PILL-TARCZA-BEZ-MURU-Q1 | 2026-08-04 | `docs/decyzje/R-PILL-TARCZA-BEZ-MURU.md` | A | A | T |
| 44 | R-SCOUT-ZWIEDZAJ-PODSWIETLENIE-Q1 | 2026-08-04 | `docs/decyzje/R-SCOUT-ZWIEDZAJ-PODSWIETLENIE.md` | A | A | T |
| 45 | D3-W6 (żywność w koszyku) | 2026-06-30 | `docs/decyzje/D3-wymiana-OTWARTE-AB.md` | B | A | **N** |
| 46 | D3-W7 (punkty nauki) | 2026-06-30 | jw. | B | B | T |
| 47 | D3-W8 (kultura w wymianie) | 2026-06-30 | jw. | B | B | T |
| 48 | D3-W9 (sprzedaż miasta) | 2026-06-30 | jw. | A | A | T |
| 49 | AI-BALANS-STEP6-Q1 | 2026-08-06 | `docs/decyzje/ABC-PACZKA-2026-08-06-KOLEJKA.md` §1 | A | A | T |
| 50 | R-KAMIEN-RELIEF-FOLLOWUP-Q1 | 2026-08-06 | jw. §2 | A | A | T |
| 51 | MAP-UX-CLUSTER-LABEL-Q1 | 2026-08-06 | jw. §3 / `docs/decyzje/MAP-UX-CLUSTER-LABEL-Q1.md` | B | B+C (kombinacja) | **N** |
| 52 | R-WIARYGODNOSC-S9-Q1 | 2026-08-06 | jw. §4 / `docs/decyzje/R-WIARYGODNOSC-S9-Q1.md` | B | A | **N** |
| 53 | R-DESIGN-PANEL-MIASTA-V2-Q1 | 2026-08-06 | jw. §5 / `docs/decyzje/R-DESIGN-PANEL-MIASTA-V2-Q1.md` | B | C | **N** |
| 54 | P-MAPGEN-PANGEA-OBRYS Pytanie 1 | 2026-08-07 | `docs/decyzje/P-MAPGEN-PANGEA-OBRYS.md` (rekomendacje w `REJESTR-PROSB-I-ZADAN.md:800`) | A | A | T |
| 55 | P-MAPGEN-PANGEA-OBRYS Pytanie 2 | 2026-08-07 | jw. | B | B | T |
| 56 | P-MAPGEN-PANGEA-OBRYS Pytanie 3 | 2026-08-07 | jw. | A | B | **N** |
| 57 | R-MENNICA-BRAZ-ZLOTO-ASYMETRIA-Q1 (b) | 2026-08-07 | `docs/decyzje/R-MENNICA-BRAZ-ZLOTO-ASYMETRIA-Q1.md` | Opcja (ii) usunąć martwy kod | Opcja (i) zmigrować test | **N** |
| 58 | P-AI-MOC-GAP | 2026-08-08 | `dyspozycje/REJESTR-PROSB-I-ZADAN.md:1023-1027` | A (zmierzyć najpierw) | B (kodować teraz) | **N** |
| 59 | BUG-BRAMKA-DREWNO-BRAK (próg startowy) | 2026-08-08 | `dyspozycje/REJESTR-PROSB-I-ZADAN.md:1012-1016` | C (dodać próg/zapas) | A (bez progu, świadome ryzyko) | **N** |
| 60 | Stopka „Surowce w zasięgu” | (audyt UI) | `dyspozycje/PYTANIA-OTWARTE.md:895-897` | C | C (WDROŻONE) | T |

**Pominięte świadomie** (brak jednoznacznej pary, więc nie liczone w statystyce): D3-T1..T4 (rekomendacje są, ale w tym dokumencie nie zapisano odpowiedzi literą), E2-gestosc-swiata Q1–Q4 (pola „Decyzja Macieja: ___” puste — status „PRZYJĘTE” to delegacja ogólna, nie wybór litery), D3-W1–W5, W10, W11 (rekomendacja jest, ale tabela odpowiedzi w tym pliku ma puste pole dla tych ID), P-MAPGEN-PANGEA-OBRYS Pytanie 4 (rekomendacja B zapisana, ale decyzja jeszcze nie padła — „blokuje wdrożenie"), ABC-PACZKA-2026-08-06-DOPREC (cały plik, status 🟡 OTWARTE w chwili czytania — 6 rekomendacji bez zapisanej odpowiedzi), R-WIARYGODNOSC-S9-TABELA-LICZB (39 „POTWIERDZENIE” + 7 „KOREKTA” to nie format A/B/C, opisane osobno w sekcji 3 niżej), D-cyw-REJESTR-PARAMETROW-GLOBAL Q-REG-1..3 (brak zapisanej odpowiedzi).

---

## 2. Statystyka

- **Par z jednoznaczną rekomendacją AI I zapisaną decyzją Macieja: 60** (wiersze tabeli powyżej; #21 i #39 liczone jako niejednoznaczne/częściowe, wyszczególnione osobno).
- **Zgodne (T):** 33 z 60 (bez #21, #39) → **≈ 55%** wprost zgodnych.
- **Niezgodne (N):** 25 z 60 → **≈ 42%**.
- **Niejednoznaczne/częściowe** (#21 B2-D18-6, #39 R-BUDYNKI-NIEAKTYWNE Q2): 2 — rekomendacja miała warunkowość albo decyzja dodała niewielki dopisek do rekomendowanej litery, nie da się jednoznacznie sklasyfikować jako T lub N.
- **Plików przeczytanych w całości lub dużej części** przy tej analizie: **43** z `docs/decyzje/`, plus fragmenty `dyspozycje/REJESTR-PROSB-I-ZADAN.md` (1034 linii), `dyspozycje/PYTANIA-OTWARTE.md` (2137 linii) i `dyspozycje/_handoff/KANAL-PRACA.md` (6248 linii) przeszukane przez `grep` po słowie „rekomend” + odczyt kontekstu trafień.

**Uwaga o reprezentatywności:** w repo jest **369 plików** w `docs/decyzje/`, z czego tylko **42** zawierają dosłowne słowo „Rekomendacja” (sprawdzone `grep -l`). Reszta plików w tym katalogu to albo kanon bez procesu ABC (np. audyty, specyfikacje), albo decyzje zapisane bez wyraźnie wypisanej rekomendacji AI (np. „Decyzja Maciej: X” bez wcześniejszych opcji A/B/C w tym samym pliku — wtedy nie da się ustalić, czy i co było rekomendowane). Ta tabela nie jest więc pełnym spisem wszystkich decyzji Macieja — jest pełnym spisem **możliwych do zweryfikowania par** (rekomendacja + decyzja jawnie w tekście).

---

## 3. WZORZEC DECYZYJNY (synteza)

### 3.1 Odrzuca „poczekajmy / zmierzmy najpierw” na rzecz decyzji teraz — 4/4 trafień

Kiedy jedna z opcji ABC to „zbierz dane / poczekaj na playtest / status quo”, a inna to „działaj teraz mimo niepewności”, Maciej **konsekwentnie** wybiera działanie:

- **P-AI-MOC-GAP** (`REJESTR-PROSB-I-ZADAN.md:1023-1027`): rekomendacja A = „najpierw zmierzyć obecny gap” (świeży playtest), Maciej wybrał **B** — „Kodować naprawę... TERAZ, bez uprzedniego świeżego playtestu (**odrzucona rekomendacja A**)”. Cytat uzasadnienia: *„pusta kolejka + nieotwarta produkcja + namnażające się surowce... to kluczowy problem, który trzeba rozwiązać wprost”*.
- **R-WIARYGODNOSC-S9-Q1**: rekomendacja B = „odłożyć do post-playtest” (zgodnie z zaleceniem własnego audytu z 2026-08-05), Maciej wybrał **A** — pełna paczka strojenia liczb teraz, cytat: *„Pełna paczka strojenia liczb §9 teraz (JSON + testy)”*.
- **R-AI-TRUDNOSC P2-Q2**: rekomendacja B = „najpierw ograć FALA 230, P2-Q2 dopiero po playteście Trudnego”, Maciej wybrał **A** — od razu skrócić early game na Trudnym.
- **R-DESIGN-PANEL-MIASTA-V2-Q1**: rekomendacja B = bierne „status quo wystarczy, polish opcjonalny później”, Maciej wybrał **C** — aktywnie zlecić Designowi priorytet teraz (`„Pilne zlecenie Design klatek v2; kod nie zamrożony"`).

Wniosek: Maciej systemowo nie lubi „poczekajmy, zobaczymy” jako uzasadnienia samego w sobie — nawet gdy to AI radzi ostrożność, on wybiera ruch do przodu, jeśli problem jest już zdiagnozowany.

### 3.2 Przy wyborze między częściowym/ucinanym zakresem a pełnym/systematycznym — wybiera pełny, nawet kosztem większego diffu

- **B2-D18-5** (wagi Porządku Sz/Prawo per trudność): rekomendacja C = asymetria tylko na hard, Maciej wybrał **A** — pełna tabela 55/45 · 50/50 · 45/55 na wszystkich trzech poziomach.
- **B2-D18-4** (bonus stolicy easy): rekomendacja B = „nic dodatkowego, wystarczy reszta pakietu”, Maciej wybrał **A+C** — połączył obie aktywne opcje (+1 Szczęście **i** +1 Prawo), więcej niż była która pojedyncza opcja.
- **R-WIARYGODNOSC-S9-Q1**: rekomendacja C (tabela w paczce KOLEJKA) = „minimalny zestaw 5–7 krytycznych parametrów, reszta bez pytania” — odrzucona na rzecz pełnej paczki wszystkich 47 parametrów (patrz `R-WIARYGODNOSC-S9-TABELA-LICZB.md` — Maciej dał „OK” dla **wszystkich 39** wartości „POTWIERDZENIE” + 7 korekt jednym ruchem, nie punktowo).
- **P-AI-006**: rekomendacja B = same dane w JSON (tabela per nacja), Maciej wybrał **C** — dane **plus** rozszerzenie mechaniki w `ai.ts` (rezerwa Pracy, bypass klastra, częstotliwość celu Mocy, kara poza klastrem) — czyli pełny zakres zamiast samego wpisu liczb.
- **MAP-UX-CLUSTER-LABEL-Q1**: rekomendacja B = tylko zmiana etykiety tekstowej, Maciej wybrał **B+C** — etykieta **i** marker wizualny (korona/obwódka) połączone.

Ten wzorzec (**wybiera A+C zamiast A, B+C zamiast B**) pojawił się co najmniej 4 razy niezależnie — to nie jest przypadek pojedynczego tematu, tylko powtarzalny odruch: gdy AI proponuje wybór jednej z opcji, Maciej czasem odpowiada kombinacją, jeśli obie części mają sens produktowy.

### 3.3 Kategoria „balans/trudność AI” to miejsce największej rozbieżności z rekomendacją

Na 6 par z obszaru balansu AI/trudności (P-AI-006, P-AI-008, R-AI-TRUDNOSC P2-Q1, P2-Q2, P-AI-MOC-GAP, AI-BALANS-STEP6-Q1) — **5 z 6 to niezgodność** (jedyna zgodność to STEP6-Q1). W trzech z tych przypadków (P2-Q1, P2-Q2, P-AI-006) Maciej wybrał bardziej zdecydowaną/inwazyjną interwencję niż AI rekomendowało, a w jednym (**P-AI-008**) odrzucił **wszystkie trzy** zaproponowane opcje i podał własne, niestandardowe rozwiązanie: *„zamiast murów prowadźmy produkcję jednostek i większe skupienie na rozwoju... Chmury — wywalmy, nie są istotne”* — dosłowny cytat spoza liter A/B/C. To sugeruje, że przy balansie AI Maciej ma silne własne intuicje z bezpośredniego grania i rzadziej powierza tę kategorię czystej rekomendacji agenta niż np. czyste bugfixy UI (sekcja 3.4).

### 3.4 Czyste naprawy UI/UX z jednoznaczną diagnozą — bardzo wysoka zgodność

W parach dotyczących wąsko zdiagnozowanych usterek interfejsu z jedną „oczywistą” rekomendacją (R-PILL-TARCZA-BEZ-MURU, R-SCOUT-ZWIEDZAJ-PODSWIETLENIE, R-EOT-EVENT-DEFER, R-OBRONA-MIASTA-MP, R-BUDYNKI-NIEAKTYWNE Q1/Q3, R-AUTO-RACJE-RAISE Q2–Q5) — **10 na 10 par to pełna zgodność**. W jednym z tych wątków wprost napisano: *„Maciej «działaj z wszystkimi» (= rekomendacje)”* (`R-AUTO-RACJE-RAISE.md`) — czyli świadome zaufanie do całego pakietu rekomendacji naraz, bez różnicowania litera po literze. Kontrast z sekcją 3.3 sugeruje: **im bardziej temat jest „silnikowy/techniczny z jasną diagnozą”, tym wyższa zgodność; im bardziej „projektowy/balansowy” (ile, kiedy, jak agresywnie), tym więcej własnego osądu Macieja.**

### 3.5 Hipoteza „zawsze wybiera tańszą/bezpieczniejszą opcję” — NIE POTWIERDZONA, dane są mieszane

Sprawdzono wprost i **odrzucono** jako ogólną regułę: są przypadki wyboru droższej/bardziej ryzykownej opcji nad tańszą rekomendacją (C-TEREN-IMPL-2: A→C, refaktor zamiast sync dokumentacji; R-MAPGEN-KOLEJNOSC-Q1: A→B, dodatkowe czyszczenie kodu zamiast „zamknij bez zmian”; INK-Q1: A→B, honorowanie historii kosztem wyjątku w danych), ale też odwrotne przypadki wyboru tańszej/prostszej opcji nad bogatszą rekomendacją (SP4: B→C, tylko HUD zamiast panel+HUD; C-MPDIFF-Q1: C→A, zostawić bez zmian zamiast poprawić widoczność suwaka; C-TEREN-IMPL-1: C→A, jeden deploy bez checklisty zamiast kompromisu z checklistą; R-AI-TRUDNOSC P2-Q1: C→A, zero zmian zamiast dopięcia konwerterów). **Nie ma jednokierunkowej preferencji koszt/ryzyko** — decyzja zależy od tematu, nie od uniwersalnej reguły „mniej pracy = lepiej” ani „więcej = lepiej”.

---

## 4. DO WERYFIKACJI (sygnał słaby lub niejednoznaczny)

- **Hipoteza „preferuje dosłowne brzmienie własnych wcześniejszych słów”** — nie udało się jej ani potwierdzić, ani obalić na tym materiale: jedyny mocny przykład to `R-ABC-PELNA-LISTA.md` („nie rób zasady, że tylko 3 pytania... zapisz do zasad” — to jest reguła procesowa, nie para rekomendacja/decyzja z listy). Wymaga osobnego przeglądu cytatów Macieja vs decyzje, którego ta sesja nie wykonała wyczerpująco.
- **Hipoteza „przywraca stan zgodny z wcześniejszą decyzją” zamiast akceptować to, co przypadkiem powstało** — częściowe wsparcie w `BUG-TRAKTAT-KOSZYK-REGRESJA` (`REJESTR-PROSB-I-ZADAN.md:996-1000`, przywrócenie stanu sprzed commitu regresji do wcześniejszej decyzji `HANDEL-SPLIT-Q1=B`), ale to nie jest para rekomendacja-AI/decyzja (nie znaleziono w tym wpisie jawnej „Rekomendacja: X” do porównania) — nie liczone do tabeli w sekcji 1, tylko odnotowane jako poszlaka.
- **B2-D18-6** (bonus osady): rekomendacja AI była warunkowa („B jeśli T1 nadal czerwony po playtescie; inaczej A”), decyzja Macieja = A — może to być zgodność (bo warunek „inaczej A” się ziścił) albo nie, w zależności od nieznanego nam wyniku playtestu w tamtej chwili. Sklasyfikowane jako niejednoznaczne, nie wliczone do statystyki T/N.
- **R-BUDYNKI-NIEAKTYWNE Q2**: formalnie zapisane jako „Q2=A+C” w nagłówku pliku, ale sekcja Q2 w treści ma tylko rekomendację A bez opisanej opcji C w tym konkretnym pytaniu (C była osobną literą w Q1). Możliwe pomieszanie numeracji w źródle — potraktowane jako częściowa zgodność, wymaga weryfikacji przy źródle, nie tej sesji.
- **R-WIARYGODNOSC-S9-TABELA-LICZB**: 40/47 „POTWIERDZENIE” zaakceptowanych jednym ruchem to bardzo wysoka zgodność (~85%), ale to nie jest klasyczny format ABC (nie ma osobnych liter per parametr, tylko blokowe „OK” + 7 nazwanych korekt) — nie wliczone do głównej statystyki z sekcji 2, ale jest silną poszlaką, że **przy pracy czysto audytowej/weryfikacyjnej (nie projektowej) zgodność jest znacznie wyższa niż przy świeżych decyzjach ABC typu „co zrobić”.** Warto to zbadać osobno na większej próbie audytów, jeśli przyszła sesja będzie miała czas.
- **Skala próby per kategoria jest mała** (np. tylko 6 par „balans AI”, tylko 4 pary „act now vs wait”) — wnioski w sekcji 3.1 i 3.3 są spójne wewnętrznie, ale to wciąż pojedyncyfrowe liczności; jedna kolejna kontrprzykładowa decyzja Macieja mogłaby znacząco zmienić odsetek.
- Duża część repo (327 z 369 plików w `docs/decyzje/`) nie została przeanalizowana pod kątem par rekomendacja/decyzja, bo nie zawiera słowa „Rekomendacja” — możliwe, że część z nich ma rekomendację sformułowaną innymi słowami (np. „Sugerowane: X” albo „Agent proponuje: X”), których to przeszukanie nie złapało. Przyszła sesja może rozszerzyć grep o synonimy.

---

## 5. Pliki źródłowe wykorzystane

`docs/decyzje/`: ABC-FORMAT-KANON-MACIEJ.md · ABC-ZAPIS-PLIKOWY.md · ABC-KOLEJKA-OTWARTE-2026-07-27.md · C-WIAR-D4.md · C-WIAR-N1-UX.md · C-TEREN-IMPL-1.md · C-TEREN-IMPL-2.md · C-TEREN-IMPL-3.md · R-MAPGEN-KOLEJNOSC-Q2.md · R-MAPGEN-KOLEJNOSC-Q3.md · R-BITWA-POWTORKA-I.md · P-AI-006.md · P-AI-007.md · P-AI-008.md · B-popcap-akwedukt-audit.md · B2-D18-ABC-MACIEJ.md · B2-szczescie-progi-efektow.md · B5-spichlerz-FORMULARZ-SP1-SP6.md · C-MPDIFF-Q1.md · D-CUD2-pytanie-KANON.md · D-cyw-REJESTR-PARAMETROW-GLOBAL.md · D3-moc-respekt-tuning-scenariusze.md · D3-wymiana-OTWARTE-AB.md · DYSPOZYCJA-STALA.md · E2-gestosc-swiata-MAPA-ODPOWIEDZ-ABC.md · MAP-SPAWN-Q2.md · ODLOZONE-UPGRADE-BUDYNKOW-2026-07-04.md · P-MAPGEN-PANGEA-OBRYS.md · R-ABC-PELNA-LISTA.md · MACIEJ-ABC-PACZKA-2026-06-30.md · R-AI-TRUDNOSC-P2-ABC.md · R-AUTO-RACJE-RAISE.md · R-AUTOBOT-EVALUATOR-WARSTWY-MODELI.md · R-BUDYNKI-NIEAKTYWNE-pytanie.md · R-EOT-EVENT-DEFER.md · R-MENNICA-BRAZ-ZLOTO-ASYMETRIA-Q1.md · R-OBRONA-MIASTA-MP.md · R-PILL-TARCZA-BEZ-MURU.md · R-SCOUT-ZWIEDZAJ-PODSWIETLENIE.md · R-WIARYGODNOSC-DZWIGNIE-2-4-PRZEGLAD.md · R-WIARYGODNOSC-S9-TABELA-LICZB.md · SPICH-AUTO-Q1.md · ABC-PACZKA-2026-08-06-DOPREC.md · ABC-PACZKA-2026-08-06-KOLEJKA.md · R-WIARYGODNOSC-S9-Q1.md · MAP-UX-CLUSTER-LABEL-Q1.md · R-DESIGN-PANEL-MIASTA-V2-Q1.md

`dyspozycje/`: REJESTR-PROSB-I-ZADAN.md (pełny grep „rekomend” + odczyt trafień) · PYTANIA-OTWARTE.md (pełny grep „rekomend” + odczyt trafień) · `_handoff/KANAL-PRACA.md` (pełny grep „rekomend”, trafienia przejrzane, żadne nie dało nowej pełnej pary z wystarczającym kontekstem do wpisania do tabeli).

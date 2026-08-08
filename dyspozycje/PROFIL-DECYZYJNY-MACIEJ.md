# PROFIL DECYZYJNY — Maciej (rekomendacje AI vs decyzje właściciela)

> **DRAFT — werdykt Evaluatora (Opus 5, 2026-08-08, runda 3): PASS-WITH-NOTES. Materiał wejściowy, NIE kanon.**
> *(Historia werdyktów: runda 1 FAIL → runda 2 FAIL → runda 3 PASS-WITH-NOTES. „PASS" dotyczy **rzetelności
> rachunku i weryfikowalności par przy źródle**, nie zdjęcia statusu DRAFT — status zmienia wyłącznie
> właściciel. Poprawki Evaluatora rundy 3 naniesione bezpośrednio: etykieta ID w wierszu #85, obalone
> zdanie „litery się różnią" o D3-UX w §2 i §4.)*
>
> ⛔ **ZAKAZ UŻYCIA TEGO PROFILU JAKO SUBSTYTUTU PYTANIA.** Ten dokument służy WYŁĄCZNIE do lepszego
> **formułowania** pytań ABC (jak opisać opcje, czego nie pomijać, jakie ryzyko wyprzedzić). **Nigdy**
> nie wolno na jego podstawie wybrać litery za właściciela, założyć „Maciej i tak wybrałby X", pominąć
> pytania ani zawęzić opcji A/B/C. Obowiązuje `CLAUDE.md` §7 i §6 sekcji „JAK PRACOWAĆ": **przy
> niejednoznaczności pytasz właściciela, nie zgadujesz** — profil statystyczny nie jest zgodą.
>
> **Wyjątek usankcjonowany (`R-PROFIL-TURNIEJ-PUNKTACJA-Q1`, Maciej 2026-08-08):** w turnieju ABC
> (`docs/decyzje/R-PROC-AUTOBOT-ABC-TURNIEJ.md`) wolno używać tego profilu do (a) uzasadnienia „typu"
> każdego Proponenta i (b) głównego kryterium punktacji Sędziego. Warunki, które to odróżniają od
> zakazanego użycia powyżej: **zawsze jawne** (adnotacja „wg profilu: X" trafia do właściciela wprost,
> nigdy nie jest ukryta) i **zawsze obok pełnego A/B/C z Za/Przeciw** — właściciel dostaje dodatkową
> informację, nie zawężoną albo zdecydowaną za niego opcję. Wybór litery pozostaje w 100% jego.
>
> **Korekty Evaluatora naniesione bezpośrednio w tekście** (szczegóły w raporcie): wiersz #8 (P-AI-008),
> statystyka w §2, akapit „Pominięte świadomie", „Uwaga o reprezentatywności", punktor
> R-WIARYGODNOSC-S9-Q1 w §3.2, zdanie o P-AI-008 w §3.3.
>
> **DOKOŃCZONE przez Operatora (2026-08-08, druga runda)** — pozycje z werdyktu FAIL, które Evaluator
> zostawił do przeróbki: (a) dopisano **21 par** pominiętych bez uzasadnienia (wiersze #61–#81) z 7 plików
> źródłowych, w tym wszystkie 4 wskazane wprost przez Evaluatora oraz pełny przegląd pozostałych 12 z 16
> plików złapanych przez `grep -li rekomendacj` poza wariantem dosłownym; (b) ujednolicono traktowanie
> rekomendacji **warunkowych** jedną regułą i przeliczono cały zbiór — wiersze #18, #21, #30 zmieniły
> klasyfikację; (c) statystyka w §2 przeliczona na jednym mianowniku (49 T / 30 N / 1 niejednoznaczny /
> 1 wykluczony z 81 par w tabeli); (d) wiersz #60 sprawdzony przy źródle i **wykluczony** ze statystyki
> (brak zapisanej litery od Macieja); (e) język §3 złagodzony tam, gdzie dowodów jest mało (§3.1, §3.2,
> §3.4). Ta runda **nie jest** zdjęciem statusu DRAFT — profil nadal wymaga przeglądu właściciela przed
> jakimkolwiek wykorzystaniem poza kalibracją pytań ABC, **poza jednym usankcjonowanym wyjątkiem
> dopisanym później tego samego dnia** — patrz banner na górze tego dokumentu, akapit „Wyjątek
> usankcjonowany (`R-PROFIL-TURNIEJ-PUNKTACJA-Q1`)".
>
> **DOKOŃCZONE przez Operatora (2026-08-08, trzecia runda)** — 4 punkty precyzyjnie wskazane w zleceniu
> tej rundy: (1) dopisano **3 pary** z `PACZKA-2-EKO-TECH-ABC-2026-07-04.md` (ABC-10/11/14, wszystkie T) —
> „brakujący dwunasty" plik z drugiej korekty Evaluatora, domyka przegląd wszystkich 59 plików
> `docs/decyzje/` zawierających „rekomendacj*"; (2) dopisano **1 parę** z `R-AI-MIASTA-BUDOWY-Q1.md`
> (rec. A → dec. A = T) — poprzednie uzasadnienie pominięcia było błędne (plik ma tabelę opcji A/B
> i zapisaną decyzję); (3) sprawdzono §3.2: fałszywe zdanie „nowe pary nie dodają czystych przykładów
> wzorca" usunięte, dopisano D3-v1.1-T2 (#78) jako 4. czysty przykład, D3-v1.1-T4 (#80) przypisano do
> §3.1 jako 5. przykład (nie liczony podwójnie); (4) ustalono jawną regułę dla **rekomendacji zbiorczych**
> („działaj"/„zajmij się" bez różnicowania per pytanie = z definicji T, adnotacja „T (zbiorcza)") i
> zastosowano ją do #34–#37, #81, #82–#84 — statystyka §2 pokazuje teraz **dwa odsetki**: łączny (53/83 ≈
> 63,9%) i niezależnych ocen per pytanie (45/75 = 60,0%). Mianownik po tej rundzie: **53 T / 30 N /
> 1 niejednoznaczny / 1 wykluczony z 85 par w tabeli**. Ta runda **nie jest** zdjęciem statusu DRAFT —
> zmiana statusu jest decyzją właściciela, nie Operatora.
>
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
| 8 | P-AI-008 | 2026-07-27 | `ABC-KOLEJKA-OTWARTE-2026-07-27.md` §5 (rec.) · `ABC-KOLEJKA…:16` + `docs/obieg/REJESTR-DECYZJI.md:65` + `MAPA-PYTAN-OPEN.md:17` (decyzja) | C | C | T ⟵ **KOREKTA EVALUATORA** |
| 9 | R-MAPGEN-KOLEJNOSC-Q1 | 2026-07-27 | `ABC-KOLEJKA-OTWARTE-2026-07-27.md` | A | B | **N** |
| 10 | R-MAPGEN-KOLEJNOSC-Q2 | 2026-07-27 | `docs/decyzje/R-MAPGEN-KOLEJNOSC-Q2.md` | A | C | **N** |
| 11 | R-MAPGEN-KOLEJNOSC-Q3 | 2026-07-27 | `docs/decyzje/R-MAPGEN-KOLEJNOSC-Q3.md` | A | A | T |
| 12 | R-BITWA-POWTORKA-I | 2026-07-27 | `docs/decyzje/R-BITWA-POWTORKA-I.md` | A | B | **N** |
| 13 | C-MPDIFF-Q1 | 2026-08-05 | `docs/decyzje/C-MPDIFF-Q1.md` | C | A | **N** |
| 14 | D-CUD2 | 2026-06-26 | `docs/decyzje/D-CUD2-pytanie-KANON.md` | A | C | **N** |
| 15 | B2-D18-0 | 2026-07-02 | `docs/decyzje/B2-D18-ABC-MACIEJ.md` | A | A | T |
| 16 | B2-D18-1 | 2026-07-02 | jw. | B | A | **N** |
| 17 | B2-D18-2 | 2026-07-02 | jw. | A | A | T |
| 18 | B2-D18-3 | 2026-07-02 | jw. | A…; **B** jeśli chcesz maks. przyjazny start *(warunkowa)* | B | **T*** |
| 19 | B2-D18-4 | 2026-07-02 | jw. | B | A+C (kombinacja) | **N** |
| 20 | B2-D18-5 | 2026-07-02 | jw. | C | A | **N** |
| 21 | B2-D18-6 | 2026-07-02 | jw. | warunkowa (**B** jeśli T1 nadal czerwony po playteście; **inaczej A**) | A | **T*** |
| 22 | SP1 | 2026-07-01 | `docs/decyzje/B5-spichlerz-FORMULARZ-SP1-SP6.md` | A | A | T |
| 23 | SP2 | 2026-07-01 | jw. | A | A | T |
| 24 | SP3 | 2026-07-01 | jw. | A | A | T |
| 25 | SP4 | 2026-07-01 | jw. | B | C | **N** |
| 26 | SP5 | 2026-07-01 | jw. | A | A | T |
| 27 | SP6 | 2026-07-01 | jw. | A | C | **N** |
| 28 | A-R7 (łodzie rybackie) | 2026-06-26/30 | `docs/decyzje/MACIEJ-ABC-PACZKA-2026-06-30.md` | B | B | T |
| 29 | B1-tech-Q3 (posterunek) | 2026-06-26/29 | jw. | C | C | T |
| 30 | INK-Q1 (Inkowie/Brąz) | 2026-06-26/29 | jw. | A na v1.0; **B** jeśli historia w kreatorze ważniejsza *(warunkowa)* | B | **T*** |
| 31 | MAP-SPAWN-Q2 | 2026-08-01 | `docs/decyzje/MAP-SPAWN-Q2.md` | B | B | T |
| 32 | R-AI-TRUDNOSC P2-Q1 | 2026-08-05 | `docs/decyzje/R-AI-TRUDNOSC-P2-ABC.md` | C | A | **N** |
| 33 | R-AI-TRUDNOSC P2-Q2 | 2026-08-05 | jw. | B | A | **N** |
| 34 | R-AUTO-RACJE-RAISE Q2 | 2026-08-05 | `docs/decyzje/R-AUTO-RACJE-RAISE.md` | A | A | T (zbiorcza) |
| 35 | R-AUTO-RACJE-RAISE Q3 | 2026-08-05 | jw. | A | A | T (zbiorcza) |
| 36 | R-AUTO-RACJE-RAISE Q4 | 2026-08-05 | jw. | A | A | T (zbiorcza) |
| 37 | R-AUTO-RACJE-RAISE Q5 | 2026-08-05 | jw. | A | A | T (zbiorcza) |
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
| 60 | Stopka „Surowce w zasięgu” | (audyt UI) | `dyspozycje/PYTANIA-OTWARTE.md:895-897` | C | *(brak zapisanej litery Macieja — źródło ma tylko „Rekomendacja C … STATUS: ✅ WDROŻONE (C)", bez cytatu decyzji)* | **wykluczone** |
| 61 | D3-UX-1 | 2026-06-26 | `docs/decyzje/D3-UX-relacja-parametry-ABC.md` | B | B | T |
| 62 | D3-UX-2 | 2026-06-26 | jw. | B | B | T |
| 63 | D3-UX-3 | 2026-06-26 | jw. | B | B | T |
| 64 | D3-UX-4 | 2026-06-26 | jw. | B | B | T |
| 65 | D3-W1 | 2026-06-30 | `docs/decyzje/D3-wymiana-OTWARTE-ABC.md` | A | A | T |
| 66 | D3-W2 | 2026-06-30 | jw. | A | C | **N** |
| 67 | D3-W3 | 2026-06-30 | jw. | A | B | **N** |
| 68 | D3-W4 | 2026-06-30 | jw. | A | A | T |
| 69 | D3-W5 | 2026-06-30 | jw. | A | A | T |
| 70 | D3-W6b | 2026-06-30 | jw. | B (1 PN=3 żywności, „już w JSON") | C (1 PN=4 żyw.) → dalsza korekta tego samego dnia do **1 PN=1 żywność**, poza opcjami A/B/C | **N** |
| 71 | D3-W10 | 2026-06-30 | jw. | A | A+ (dopisek: traci ważność w wojnie, odnawiane po pokoju) | **T*** |
| 72 | D3-W11 | 2026-06-30 | jw. | A | A | T |
| 73 | D3-Q2 (lista dyplomacji) | 2026-06-27 | `docs/decyzje/D3-audiencja-dyplomacja.md` | C (Hybryda, „rekomendacja CYW") | A | **N** |
| 74 | R-BUDOWA-ZROWNOWAZONE-TRYB-Q1 | 2026-08-04 | `docs/decyzje/R-BUDOWA-ZROWNOWAZONE-TRYB.md` | A | A | T |
| 75 | B1-Q1 (bramka ulepszeń) | 2026-06-28/29 | `docs/decyzje/B1-tech-ABC-OTWARTE.md` (rek.) + `docs/decyzje/B1-tech-MACIEJ-2026-06-29.md` (dec.) | A | B | **N** |
| 76 | B1-Q2 (Rolnictwo/Łowiectwo) | 2026-06-28/29 | jw. | A | A | T |
| 77 | D3-v1.1-T1 (trybut co turę) | 2026-06-30 | `docs/decyzje/D3-v1.1-TIER23-paczka.md` (rek.) + `docs/decyzje/D3-v1.1-MACIEJ-2026-06-30.md` (dec.) | A | A | T |
| 78 | D3-v1.1-T2 (sojusz) | 2026-06-30 | jw. | A (tylko Defensywny) | „dwa sojusze" (Defensywny + Pełny) — **poza A/B/C, wprost „nie A/B/C z paczki"** | **N** |
| 79 | D3-v1.1-T3 (handel) | 2026-06-30 | jw. | A | A | T |
| 80 | D3-v1.1-T4 (kolejność wdrożenia) | 2026-06-30 | jw. | A (fazowo) | B (wszystko naraz) | **N** |
| 81 | R-HANDEL-AI-FALA-Q1 | 2026-08-03 | `docs/decyzje/R-HANDEL-AI-FALA.md` | B | B | T (zbiorcza) |
| 82 | ABC-10 | 2026-07-04 | `docs/decyzje/PACZKA-2-EKO-TECH-ABC-2026-07-04.md` | A | A | T (zbiorcza) |
| 83 | ABC-11 | 2026-07-04 | jw. | A | A | T (zbiorcza) |
| 84 | ABC-14 | 2026-07-04 | jw. | A | A | T (zbiorcza) |
| 85 | R-AI-MIASTA-BUDOWY-**FIX**-Q1 | 2026-08-05 | `docs/decyzje/R-AI-MIASTA-BUDOWY-Q1.md` (rek. §„Rekomendowana jedna dźwignia" :69-71 + ECHO :84) | A | A | T |

**\* T warunkowa** — wiersze #18, #21, #30, #71: reguła przyjęta w tej sesji (patrz §2) — litera Macieja pokrywa się
z jedną z gałęzi warunkowej rekomendacji (albo, dla #71, jest tą samą literą z dopiskiem operacyjnym, nie inną
literą) → liczone jako T, nie jako niejednoznaczne/N.

> **KOREKTA EVALUATORA do wiersza #8:** pierwotny draft wpisywał tu „rekomendacja C → decyzja własna
> poza A/B/C → N". To był błąd **zlania dwóch różnych zdarzeń**. Pytanie ABC P-AI-008 (rekomendacja **C**)
> zostało rozstrzygnięte **2026-07-27 literą C** — zapis w trzech niezależnych rejestrach
> (`ABC-KOLEJKA-OTWARTE-2026-07-27.md:16`, `docs/obieg/REJESTR-DECYZJI.md:65`, `MAPA-PYTAN-OPEN.md:17`;
> wszystkie: **C**, WDROŻONA FALA 36 `a74c3797`). Cytat „zamiast murów prowadźmy produkcję jednostek…"
> pochodzi z **2026-08-05** (FALA 226) i jest **osobną, późniejszą korektą po playteście**, dla której
> w repo **nie ma zapisanej rekomendacji AI** — a więc nie jest parą i nie może być liczona jako N.

**Historia korekty (ślad audytowy):** pierwotny draft twierdził, że D3-W1–W5/W10/W11 i D3-UX-1..4 „nie mają
zapisanej odpowiedzi" — Evaluator to obalił (odpowiedzi są, w `D3-wymiana-OTWARTE-ABC.md` i
`D3-UX-relacja-parametry-ABC.md`) i zlecił ich dopisanie. **Operator dopisał wszystkie 12 par** — patrz
wiersze **#61–#72** w §1. Nie są już „pominięte".

**Pominięte świadomie w tej wersji** (brak jednoznacznej pary rekomendacja/decyzja Macieja, więc nie
liczone w statystyce §2):

- ~~**D3-T1..T4** — rekomendacje są, ale w tym dokumencie nie zapisano odpowiedzi literą.~~
  ⟵ **KOREKTA EVALUATORA (2026-08-08, runda 2): punktor NIEAKTUALNY.** Chodzi o rekomendacje D3-T1..T4
  w `MACIEJ-ABC-PACZKA-2026-06-30.md` (odpowiedź w tym pliku obejmuje tylko `B1-tech-Q3 · A-R7 · INK-Q1`).
  Ale **te same cztery pytania** stoją w `D3-v1.1-TIER23-paczka.md` z **identycznymi** rekomendacjami
  (T1=A, T2=A, T3=A, T4=A), a odpowiedzi Macieja są w bliźniaczym `D3-v1.1-MACIEJ-2026-06-30.md`
  (`T1A · T2 dwa sojusze · T3A · T4B`). **Pary zostały dopisane w tej rundzie jako wiersze #77–#80** —
  nie są już pominięte. Punktor zostaje przekreślony dla śladu audytowego.
- **E2-gestosc-swiata Q1–Q4** — pola „Decyzja Macieja: ___” puste; status „PRZYJĘTE” to delegacja ogólna, nie wybór litery.
- **P-MAPGEN-PANGEA-OBRYS Pytanie 4** — rekomendacja B zapisana, ale decyzja jeszcze nie padła („blokuje wdrożenie").
- **ABC-PACZKA-2026-08-06-DOPREC** (cały plik) — status 🟡 OTWARTE w chwili czytania, 6 rekomendacji bez zapisanej odpowiedzi.
- **R-WIARYGODNOSC-S9-TABELA-LICZB** — 39 „POTWIERDZENIE" + 7 „KOREKTA" to nie format A/B/C; opisane osobno w §3.
- **D-cyw-REJESTR-PARAMETROW-GLOBAL Q-REG-1..3** — brak zapisanej odpowiedzi.
- **D3-Q3, D3-Q4** (`D3-audiencja-dyplomacja.md`) — w całym pliku tylko D3-Q2 ma etykietę „rekomendacja"
  (zweryfikowane: `grep -n rekomendacj` zwraca jedno trafienie, linia 120); Q3 i Q4 pokazują opcje A/B/C
  bez żadnej oznaczonej jako rekomendowana → brak pary do wpisania bez zgadywania.
- **Wiersz #60 „Stopka Surowce w zasięgu"** — przeniesiony tutaj z §1: źródło (`PYTANIA-OTWARTE.md:895-897`)
  ma tylko „Rekomendacja C … STATUS: ✅ WDROŻONE (C)", bez cytatu decyzji Macieja — wygląda na
  autonomiczne wdrożenie własnej rekomendacji przez sesję, nie na parę rekomendacja-AI/decyzja-Macieja.
  Zostaje w tabeli §1 dla śladu audytowego, oznaczony „wykluczone", nie liczony do T/N.

**7 z 16 plików** znalezionych przez `grep -li rekomendacj` (poza wariantem dosłownym „Rekomendacja"),
sprawdzonych w tej sesji i **nieprzynoszących pełnej pary** — uzasadnienie per plik:

| Plik | Dlaczego brak pary |
|---|---|
| `D-START-miasta-kopie-typu.md` | Sekcja „Następne ABC" ma etykietę „Propozycja Master", nie „rekomendacja"; jawnie: „Maciej nie musi odpowiadać teraz" — brak decyzji. |
| `R-AI-TRUDNOSC-AUDYT.md` | Kolumna „ABC?" oznacza **plan**, które punkty *będą* wymagały pytania ABC — nie zapis samych opcji ani liter wybranych przez Macieja w tym dokumencie; decyzje „ECHO P0/P1/P2" to akceptacja całych pakietów tekstem, nie wybór litery z tabeli. |
| `R-DYST-DREWNO-TABELE-PROPOZYCJA.md` | Status: „📝 PROPOZYCJA — czeka akceptacji Macieja / doprecyzowania liczb" — otwarte, brak decyzji. |
| `R-KOLEJKA-OTWARTA-ABC.md` | Pierwotne `Q1=C` zostało „SUPERSEDED" przez wieloczęściowe ECHO „1+2+3" (nie pojedyncza litera odpowiadająca A/B/C) — nie mapuje się jednoznacznie na jedną z opcji bez interpretacji. |
| `R-NASTEPNY-KROK-PELNA-LISTA.md` | Reguła procesowa (limit pytań), nie decyzja produktowa ABC. |
| `R-WIARYGODNOSC-AUDIT-OPEN-VS-DEPLOYED-2026-08-05.md` | Audyt stanu wdrożenia — zero otwartych ABC w tym dokumencie (wprost: „Otwarte ABC: — brak"). |
| `R-WIARYGODNOSC-ETAP0.md` | Decyzja „WIAR-START=A" zapisana, ale w tym pliku nie ma tabeli opcji z oznaczoną rekomendacją do porównania. |

> ⛔ **KOREKTA (runda 3, punkt 2 zlecenia):** `R-AI-MIASTA-BUDOWY-Q1.md` **usunięty z tej tabeli** — poprzednie
> uzasadnienie pominięcia było błędne. Zweryfikowano samodzielnie: plik ma sekcję „Rekomendowana jedna
> dźwignia" z dwiema opcjami — **Opcja A (rekomendowana)** (linia 69) i **Opcja B (alternatywa)** (linia 71)
> — a decyzja stoi w tym samym pliku: **ECHO `R-AI-MIASTA-BUDOWY-FIX-Q1=A`** (linia 84). Pełna para
> rec. A → dec. A = **T**, dopisana do §1 jako wiersz **#85**.
>
> ⛔ **KOREKTA EVALUATORA (runda 3): ID w wierszu #85 doprecyzowane na `R-AI-MIASTA-BUDOWY-FIX-Q1`.**
> Operator wpisał pierwotnie `R-AI-MIASTA-BUDOWY-Q1`, ale to **dwa różne rozstrzygnięcia w jednym pliku**:
> (a) `R-AI-MIASTA-BUDOWY-Q1 = A` (linia 10, „najpierw audyt") — w tym pliku **nie ma** oznaczonej
> rekomendacji dla tego pytania, więc **nie jest parą**; (b) `R-AI-MIASTA-BUDOWY-FIX-Q1 = A` (linia 84) —
> **to** jest para, bo rekomendacja („Opcja A (rekomendowana)", linia 69) dotyczy właśnie fazy fix.
> Klasyfikacja **T** i statystyka **bez zmian** — poprawiona wyłącznie etykieta ID, żeby wiersz nie sugerował
> pary tam, gdzie jej nie ma. Osobny plik `R-AI-MIASTA-BUDOWY-FIX-Q1.md` **nie** wnosi drugiej pary
> (powiela to samo ECHO) — sprawdzone, brak ryzyka podwójnego liczenia.

---

## 2. Statystyka

**Reguła dla rekomendacji WARUNKOWYCH** (przyjęta w tej sesji, punkt 2 zlecenia — stosowana konsekwentnie
do wszystkich par o formie „X jeśli warunek; inaczej/albo Y" w §1): jeśli litera wybrana przez Macieja
pokrywa się z **którąkolwiek gałęzią** warunkowej rekomendacji, liczone jako **T** (adnotacja „T warunkowa"
w tabeli, oznaczenie **\***); jeśli decyzja jest spoza wszystkich wymienionych gałęzi, liczone jako **N**.
Kombinacje liter (np. „A+C") to **osobne** zjawisko (patrz §3.2) — reguła warunkowych nie ma do nich
zastosowania, chyba że decyzja to pojedyncza litera z gałęzi bez dodatku.

Zastosowanie reguły — cały zbiór §1 przejrzany pod kątem formy „X jeśli…; Y jeśli…/inaczej…":

| # | ID | Forma | Zmiana |
|---|----|-------|--------|
| #15 | B2-D18-0 | „A jeśli playtest przeszedł; inaczej C" | bez zmian — A było już w gałęzi, zostaje **T** |
| #18 | B2-D18-3 | „A…; B jeśli maks. przyjazny start" | **N → T** (B jest gałęzią) |
| #19 | B2-D18-4 | „B najpierw…; → C" + decyzja **A+C** (kombinacja) | bez zmian — decyzja to kombinacja liter, nie czysta gałąź; zostaje **N** (patrz §3.2) |
| #20 | B2-D18-5 | „C jeśli D18-0=A/B; B jeśli priorytet prostota" | sprawdzone — decyzja **A** nie jest żadną z gałęzi (C, B) → zostaje **N** |
| #21 | B2-D18-6 | „B jeśli T1 czerwony; inaczej A" | **niejednoznaczne → T** (A jest gałęzią „inaczej") |
| #22 | SP1 | „A lub B jeśli liczby kłamią" | bez zmian — A w gałęzi, zostaje **T** |
| #25 | SP4 | „B jeśli brakowało 📦; inaczej A" | sprawdzone — decyzja **C** nie jest żadną z gałęzi (B, A) → zostaje **N** |
| #26 | SP5 | „A, chyba że… → B" | bez zmian — A w gałęzi, zostaje **T** |
| #30 | INK-Q1 | „A na v1.0; B jeśli historia ważniejsza" | **N → T** (B jest gałęzią) |

**Wynik reklasyfikacji:** 3 pary zmieniły klasyfikację na T (#18, #21, #30); 2 sprawdzone i potwierdzone jako
N (#20, #25); 3 potwierdzone bez zmian jako T (#15, #22, #26); #19 zostaje N z uzasadnieniem osobnym
(kombinacja, nie warunkowość).

**Wiersz #60** (Stopka „Surowce w zasięgu") sprawdzony przy źródle (`PYTANIA-OTWARTE.md:895-897`, punkt 4
zlecenia rundy 2): brak zapisanej litery od Macieja — tylko „Rekomendacja C … WDROŻONE (C)". **Wykluczony ze
statystyki T/N**, przeniesiony do „Pominięte świadomie" w §1. **Ponownie sprawdzony w rundzie 3** (punkt 4
zlecenia rundy 3, reguła zbiorczej akceptacji) — wynik ten sam: reguła zbiorczej akceptacji **nie ma
zastosowania**, bo nie ma żadnej zapisanej wypowiedzi Macieja do sklasyfikowania (nie tylko brak litery
per pytanie, brak czegokolwiek). Wyklucza status bez zmian.

**Nowe pary (punkt 1 zlecenia rundy 2 + punkty 1–2 zlecenia rundy 3):** **25 par** dopisane do §1 jako wiersze
#61–#85, z 9 plików/tematów źródłowych: `D3-UX-relacja-parametry-ABC.md` (4), `D3-wymiana-OTWARTE-ABC.md`
(8), `D3-audiencja-dyplomacja.md` (1 — tylko D3-Q2 ma w tym pliku etykietę „rekomendacja"),
`R-BUDOWA-ZROWNOWAZONE-TRYB.md` (1) — te cztery pliki wskazane wprost w zleceniu rundy 2 — plus z
samodzielnego przeglądu pozostałych 12 z 16 plików złapanych przez `grep -li rekomendacj` poza wariantem
dosłownym „Rekomendacja": `B1-tech-ABC-OTWARTE.md` + `B1-tech-MACIEJ-2026-06-29.md` (2),
`D3-v1.1-TIER23-paczka.md` + `D3-v1.1-MACIEJ-2026-06-30.md` (4), `R-HANDEL-AI-FALA.md` (1),
`PACZKA-2-EKO-TECH-ABC-2026-07-04.md` (3, dopisane **w tej rundzie** — punkt 1 zlecenia, plik był
„brakującym dwunastym" z §2 poniżej), `R-AI-MIASTA-BUDOWY-Q1.md` (1, dopisane **w tej rundzie** — punkt 2
zlecenia, poprzednie uzasadnienie pominięcia było błędne — patrz tabela §1). Pozostałe 7 z tych 12 plików
sprawdzone i **nie dały pełnej pary** — uzasadnienie per plik w tabeli §1 „Pominięte świadomie".

**Reguła dla REKOMENDACJI ZBIORCZYCH / aktów zbiorczej akceptacji** (przyjęta w tej sesji, punkt 4 zlecenia
rundy 3 — stosowana konsekwentnie do wszystkich par w §1): Evaluator znalazł niespójność w traktowaniu
odpowiedzi, w których Maciej zatwierdza **kilka rekomendacji naraz jednym słowem/zdaniem, bez wypisania
osobnej litery per pytanie** (np. „działaj", „zajmij się tematem") — #34–#37 były liczone jako 4 osobne pary,
#81 jako 1 para, #60 wykluczony, a `PACZKA-2-EKO-TECH-ABC-2026-07-04.md` („działaj" wobec paczki A/A/A) był
całkiem pominięty (patrz punkt 1 wyżej).

**Ustalona reguła:** akt zbiorczej akceptacji (jedno słowo/zdanie zatwierdzające WSZYSTKIE wymienione
rekomendacje naraz, **bez różnicowania per pytanie** — Maciej nie podaje osobnej litery dla każdego ID,
tylko akceptuje „to co zarekomendowane") liczy się jako **tyle par T, ile pytań obejmuje**, ale z jawną
adnotacją w tabeli §1 **„T (zbiorcza)"** — bo taka para **z definicji nie może wyjść jako N** (Maciej nie
wybierał między opcjami, tylko przyjął gotowy pakiet), więc duża liczba takich par **zawyża** odsetek
zgodności bez odzwierciedlania niezależnej oceny per pytanie. Dla odróżnienia: odpowiedzi typu „T1A T2B
T3A T4B" albo „BBBB" (Maciej **wypisuje osobną literę** dla każdego ID, nawet jeśli akurat pokrywają się z
rekomendacją) **nie są** zbiorczą akceptacją w tym sensie — to differencjowana, per-pytaniowa ocena, tylko
dostarczona w jednej wiadomości/pliku (np. `D3-UX-relacja-parametry-ABC.md` „BBBB", `D3-wymiana-OTWARTE-ABC.md`
„Pakiet Macieja") — takie pary zostają zwykłymi T/N bez adnotacji.

**Zastosowanie reguły w całym dokumencie:**

| # / zakres | Plik | Fraza Macieja | Ile pytań obejmuje | Klasyfikacja |
|---|---|---|---:|---|
| #34–#37 | `R-AUTO-RACJE-RAISE.md` | „działaj z wszystkimi" (Q2, 2026-08-05) — Q3–Q5 ten sam dzień/akt | 4 (Q2,Q3,Q4,Q5) | **T (zbiorcza)** ×4 |
| #81 | `R-HANDEL-AI-FALA.md` | „zajmij się" tematem + rek. B z paczki Integrator | 1 (tylko Q1 w tym pliku) | **T (zbiorcza)** — ale przy 1 pytaniu zbiorczość **nie zawyża** statystyki (nie ma czego różnicować); adnotacja zachowana dla spójności terminologii, nie z powodu ryzyka inflacji |
| #82–#84 | `PACZKA-2-EKO-TECH-ABC-2026-07-04.md` | „działaj" (2026-07-04) — „wdrożenie rekomendacji A/A/A z paczki 2/3" | 3 (ABC-10, ABC-11, ABC-14) | **T (zbiorcza)** ×3 |
| #60 | `PYTANIA-OTWARTE.md:895-897` | brak zapisanej frazy Macieja w ogóle (tylko „WDROŻONE (C)") | — | reguła **nie ma zastosowania** — sprawdzone ponownie, to nie jest przypadek zbiorczej akceptacji (nie ma żadnej wypowiedzi Macieja do sklasyfikowania), tylko brak jakiejkolwiek zapisanej decyzji → zostaje **wykluczony**, jak dotąd |

Zastosowanie tej reguły **nie zmienia** klasyfikacji T/N żadnej pary (wszystkie 8 były już T przed
adnotacją) — zmienia tylko **przejrzystość** statystyki: patrz rozbicie T/N niezależne vs zbiorcze w tabeli
niżej.

### Wynik po przeliczeniu (mianownik: pary klasyfikowalne T+N)

| Kategoria | Liczba | Odsetek |
|---|---:|---:|
| **T (zgodne)** | **53** | 53/83 ≈ **63,9 %** klasyfikowalnych |
| **N (niezgodne)** | **30** | 30/83 ≈ **36,1 %** klasyfikowalnych |
| **Niejednoznaczne** (nie liczone do odsetka) | 1 — #39 R-BUDYNKI-NIEAKTYWNE Q2 (dopisek do rekomendowanej litery, nierozstrzygalne bez źródła) | — |
| **Wykluczone** (nie jest parą — brak zapisanej decyzji Macieja) | 1 — #60 Stopka „Surowce w zasięgu" | — |
| **Razem wierszy w tabeli §1** | **85** | 83 klasyfikowalne + 1 niejednoznaczny + 1 wykluczony |

**Rozbicie T/N wg pochodzenia decyzji (punkt 4 zlecenia rundy 3 — patrz reguła „REKOMENDACJE ZBIORCZE"
wyżej):** z 83 par klasyfikowalnych, **8 par pochodzi z aktu zbiorczej akceptacji** (#34–#37, #81, #82–#84)
i wszystkie 8 są T (z definicji reguły — zbiorcza akceptacja nie może wyjść jako N). Pozostałe **75 par to
niezależne oceny per pytanie** (osobna litera A/B/C wybrana przez Macieja dla tego konkretnego pytania),
z czego **45 T / 30 N**.

| Podzbiór | T | N | Razem | Odsetek zgodności |
|---|---:|---:|---:|---:|
| **Wszystkie klasyfikowalne pary** | 53 | 30 | 83 | 53/83 ≈ **63,9 %** |
| — z tego: **niezależne oceny per pytanie** | 45 | 30 | 75 | 45/75 = **60,0 %** |
| — z tego: **akty zbiorczej akceptacji** | 8 | 0 | 8 | 8/8 = 100 % *(nieinformacyjne — z definicji nie może wyjść N)* |

**Który odsetek jest wiarygodniejszy jako miara „zgadywalności" rekomendacji AI:** odsetek **niezależnych
ocen (60,0 %)** — bo tylko tam Maciej naprawdę porównywał opcje A/B/C i wybierał jedną z nich per pytanie.
Łączny odsetek 63,9 % jest **zawyżony** względem tej miary o ok. 4 punkty procentowe, bo 8 z 83 par (9,6 %)
to z definicji-T akty zbiorcze, nie niezależne oceny.

**Przeliczenie ręczne kontrolne:** bezpośrednie zliczenie wiersz-po-wierszu oryginalnych 60 par (przed
punktami 1–2 tej rundy, z korektą wiersza #8 już naniesioną) dało **33 T / 25 N / 2 niejednoznaczne**, nie
„34 T / 24 N" jak podawał poprzedni zapis w tym dokumencie — różnica o 1 wygląda na błąd rachunkowy
poprzedniej sesji, skorygowany tu przeliczeniem ręcznym. Od tej bazy: +3 T z reklasyfikacji warunkowych
(#18, #21, #30), −1 z niejednoznacznych (#21 przeniesiony do T), −1 wykluczony (#60, był T) → **35 T / 23 N /
1 niejednoznaczny / 1 wykluczony z oryginalnych 60**; plus **21 nowych par z rundy 2 (14 T / 7 N)** →
**49 T / 30 N** (stan po rundzie 2); plus **4 nowe pary z rundy 3** (PACZKA-2: ABC-10/11/14, wszystkie T;
R-AI-MIASTA-BUDOWY-Q1, T) → **53 T / 30 N** łącznie, jak w tabeli powyżej.

Wiele „par" w tabeli §1 pochodzi z **jednej wiadomości/pliku odpowiadającej na kilka ID naraz** — D3-UX
„BBBB" (4 ID, jedna linia), D3-W „Pakiet Macieja" (8 ID, jedna linia), B1-tech „Q1B, FOUND A+B, Q2A" (kilka
ID naraz). ⛔ **Doprecyzowanie (runda 3, punkt 4 zlecenia):** to **nie to samo zjawisko** co „REKOMENDACJE
ZBIORCZE" opisane wyżej. W D3-UX i D3-W Maciej **wypisał osobną literę dla każdego ID** —
`D3-UX-relacja-parametry-ABC.md:5` („**D3-UX-1=B · D3-UX-2=B · D3-UX-3=B · D3-UX-4=B**") i
`D3-wymiana-OTWARTE-ABC.md:116` („`D3-W1=A, D3-W2=C, D3-W3=B, D3-W4=A, D3-W5=A, D3-W6b=C, D3-W10=A+,
D3-W11=A`") — to są **niezależne oceny per pytanie**, tylko dostarczone w jednej wiadomości.
⚠️ **Kryterium jest „osobna litera per ID", NIE „litery się różnią"** — w D3-W litery faktycznie się różnią,
ale w D3-UX są **wszystkie takie same (BBBB)**, a mimo to para pozostaje niezależną oceną, bo Maciej
przypisał literę do każdego ID z osobna, zamiast napisać „działaj". Taka forma **nie** ryzykuje sztucznego
zawyżenia odsetka T, bo N-y wciąż **mogły** wyjść — i w D3-W wyszły (D3-W2, D3-W3, D3-W6b to N); to, że w
D3-UX nie wyszły, jest wynikiem, a nie właściwością formy odpowiedzi. Ryzyko zawyżenia dotyczy **wyłącznie** aktów bez wypisanej litery per pytanie
(„działaj", „zajmij się") — te są policzone osobno w tabeli „Rozbicie T/N wg pochodzenia decyzji" wyżej
(8 par, wszystkie T). Liczba wierszy w tabeli §1 **nadal nie jest** liczbą w pełni niezależnych aktów
decyzyjnych Macieja w innym, słabszym sensie — kilka ID rozstrzygniętych w jednej sesji/pliku to wciąż
jedna „okazja do namysłu", nawet gdy litery się różnią — ale to osobna, słabsza zastrzeżenie niż ryzyko
zawyżenia z rekomendacji zbiorczych, i dokument już rozdziela oba zjawiska (patrz też §3.4 dla
R-AUTO-RACJE-RAISE jako przykładu policzonego jako 1 niezależny akt mimo 4 wierszy w tabeli).

**Uwaga o reprezentatywności:** w repo jest **368** plików `.md` w `docs/decyzje/`, z czego **43** zawierają
dosłowne „Rekomendacja", a **59** — dowolną formę „rekomendacj*" (`grep -li`). Ta sesja domknęła
przegląd **wszystkich 59** — sprawdzone zostały pozostałe **16** plików spoza wariantu dosłownego
(`comm -23 <(grep -li rekomendacj docs/decyzje/*.md) <(grep -l Rekomendacja docs/decyzje/*.md)`): 4 wskazane
wprost w zleceniu rundy 2 dały **14 par** (4+8+1+1), pozostałe 12 sprawdzone samodzielnie dały jeszcze
**11 par** z 5 plików/tematów (B1-tech 2, D3-v1.1 4, R-HANDEL 1, PACZKA-2-EKO-TECH 3, R-AI-MIASTA-BUDOWY-Q1
1), a **7 plików** nie dały pełnej pary (uzasadnienie w §1) — 14+11 = **25 nowych par**.
⛔ **KOREKTA EVALUATORA (2026-08-08, runda 2):** poprzednia treść podawała tu „13 par (4+8+1)" i „8 par",
co nie zgadzało się z rozpisem w akapicie „Nowe pary" wyżej (tam poprawnie 4+8+1+1 oraz 2+4+1). Suma 21
była przypadkowo zgodna mimo dwóch błędnych składników.
⛔ **DRUGA KOREKTA EVALUATORA — rachunek 3+8 = 11, a nie 12:** z 12 plików „pozostałych" wymieniono 3 jako
dające pary i 8 jako niedające — **brakuje dwunastego**. Jest nim `PACZKA-2-EKO-TECH-ABC-2026-07-04.md`,
**nieujęty nigdzie w tym dokumencie**. Zdanie „wszystkie 59 plików są dziś przejrzane" było więc
**nieprawdziwe**; do domknięcia przeglądu brakuje tego pliku (oraz weryfikacji `R-AI-MIASTA-BUDOWY-Q1.md`
— patrz uwaga w tabeli „8 plików" w §1).
⛔ **TRZECIA KOREKTA (runda 3, punkty 1–2 zlecenia) — luka zamknięta.** `PACZKA-2-EKO-TECH-ABC-2026-07-04.md`
zweryfikowany samodzielnie: potwierdzenie Macieja „działaj" (2026-07-04) = wdrożenie rekomendacji A/A/A dla
ABC-10/ABC-11/ABC-14, wszystkie trzy pary zgodne (T) — dopisane do §1 jako wiersze #82–#84. Uzasadnienie
pominięcia `R-AI-MIASTA-BUDOWY-Q1.md` (jedyny pozostały punkt z drugiej korekty) sprawdzone i obalone —
plik ma pełną parę rec. A → dec. A (T), dopisaną jako wiersz #85 (szczegóły w tabeli „7 z 16 plików" w §1).
Zdanie „wszystkie 59 plików są dziś przejrzane" jest więc **teraz prawdziwe** — z 12 plików „pozostałych"
5 dało pary (11 par łącznie), 7 nie dało pełnej pary, 5+7=12, rachunek się zgadza. Reszta katalogu
(368−59=**309** plików) NIE była przeszukiwana pod kątem synonimów rekomendacji („Sugerowane:", „Agent
proponuje:" itp.) — możliwe, że dalsze pary tam czekają, ale nie zostało to zbadane. Poza `docs/decyzje/`
tabela też nie obejmuje wyczerpująco `dyspozycje/REJESTR-PROSB-I-ZADAN.md`, `dyspozycje/PYTANIA-OTWARTE.md`
ani `dyspozycje/_handoff/KANAL-PRACA.md` poza wcześniej wykonanym grepem „rekomend" — te pliki mogą kryć
dalsze pary spoza `docs/decyzje/`. Próbka pozostaje **wygodnościowa** względem całego repo, ale jest dziś
**kompletna względem frazy „rekomendacj*" w `docs/decyzje/`** — mocniejsze zdanie niż w poprzedniej wersji
tego dokumentu, wciąż nie „pełny spis wszystkich decyzji Macieja".

**Plików przeczytanych w całości lub dużej części** przy tej analizie (trzy rundy): **61** z
`docs/decyzje/` (60 z rund 1–2 + `PACZKA-2-EKO-TECH-ABC-2026-07-04.md` doczytany w rundzie 3), plus
fragmenty `dyspozycje/REJESTR-PROSB-I-ZADAN.md` (1034 linii), `dyspozycje/PYTANIA-OTWARTE.md` (2137 linii)
i `dyspozycje/_handoff/KANAL-PRACA.md` (6248 linii) przeszukane przez `grep` po słowie „rekomend" + odczyt
kontekstu trafień.

---

## 3. WZORZEC DECYZYJNY (synteza)

### 3.1 Odrzuca „poczekajmy / zmierzmy najpierw” na rzecz decyzji teraz — 5/5 trafień w małej próbie

Kiedy jedna z opcji ABC to „zbierz dane / poczekaj na playtest / status quo / rób fazowo”, a inna to „działaj teraz mimo niepewności / wszystko naraz”, w **dostępnej próbie (n=5)** Maciej za każdym razem wybiera działanie:

- **P-AI-MOC-GAP** (`REJESTR-PROSB-I-ZADAN.md:1023-1027`): rekomendacja A = „najpierw zmierzyć obecny gap” (świeży playtest), Maciej wybrał **B** — „Kodować naprawę... TERAZ, bez uprzedniego świeżego playtestu (**odrzucona rekomendacja A**)”. Cytat uzasadnienia: *„pusta kolejka + nieotwarta produkcja + namnażające się surowce... to kluczowy problem, który trzeba rozwiązać wprost”*.
- **R-WIARYGODNOSC-S9-Q1**: rekomendacja B = „odłożyć do post-playtest” (zgodnie z zaleceniem własnego audytu z 2026-08-05), Maciej wybrał **A** — pełna paczka strojenia liczb teraz, cytat: *„Pełna paczka strojenia liczb §9 teraz (JSON + testy)”*.
- **R-AI-TRUDNOSC P2-Q2**: rekomendacja B = „najpierw ograć FALA 230, P2-Q2 dopiero po playteście Trudnego”, Maciej wybrał **A** — od razu skrócić early game na Trudnym.
- **R-DESIGN-PANEL-MIASTA-V2-Q1**: rekomendacja B = bierne „status quo wystarczy, polish opcjonalny później”, Maciej wybrał **C** — aktywnie zlecić Designowi priorytet teraz (`„Pilne zlecenie Design klatek v2; kod nie zamrożony"`).
- **D3-v1.1-T4** (kolejność wdrożenia, #80, dopisane w rundzie 3 — punkt 3 zlecenia): rekomendacja A = fazowo („Faza 1: NAP + trybut + handel pełny → Faza 2: sojusz + namów → Faza 3: granice, tech, ultimatum, wasal”, `D3-v1.1-TIER23-paczka.md`), Maciej wybrał **B** — wszystko naraz, cytat: *„Wszystko naraz (1 sprint v1.1): NAP, trybut, handel, oba sojusze, namów, granice, tech, ultimatum, wasal — zależności lane przez handoffy równoległe”* (`D3-v1.1-MACIEJ-2026-06-30.md`). Ta para pasuje formalnie też do wzorca §3.2 („pełny zakres”), ale jest liczona **tylko tutaj** — chodzi o „teraz/naraz vs pośrednio/fazowo”, nie o cięcie zakresu (docelowy zakres jest identyczny w obu opcjach, różni się tylko kolejność/tempo) — patrz uzasadnienie w §3.2.

Wniosek (n=5, nie potwierdzone na szerszym zbiorze): w tej próbce Maciej nie zaakceptował „poczekajmy,
zobaczymy” jako samodzielnego uzasadnienia — nawet gdy AI radziło ostrożność, wybrał ruch do przodu, gdy
problem był już zdiagnozowany. Przy pięciu przypadkach to obserwacja kierunkowa, nie potwierdzona reguła;
jeden kolejny kontrprzykład zmieniłby odsetek z 5/5 (100%) na 5/6 (≈83%), spadek o ok. 17 punktów
procentowych.

### 3.2 Przy wyborze między częściowym/ucinanym zakresem a pełnym/systematycznym — wybiera pełny, nawet kosztem większego diffu

- **B2-D18-5** (wagi Porządku Sz/Prawo per trudność): rekomendacja C = asymetria tylko na hard, Maciej wybrał **A** — pełna tabela 55/45 · 50/50 · 45/55 na wszystkich trzech poziomach.
- **B2-D18-4** (bonus stolicy easy): rekomendacja B = „nic dodatkowego, wystarczy reszta pakietu”, Maciej wybrał **A+C** — połączył obie aktywne opcje (+1 Szczęście **i** +1 Prawo), więcej niż była która pojedyncza opcja.
- ⛔ **KOREKTA EVALUATORA — ten punktor był podwójnie błędny i został wycofany jako dowód.** ~~R-WIARYGODNOSC-S9-Q1: rekomendacja C…~~ Rekomendacja w `ABC-PACZKA-2026-08-06-KOLEJKA.md` §[4/5] brzmi **B** („odłożyć do post-playtest"), **nie C**; opcja C to „**2–3 liczby krytyczne**", nie „5–7 parametrów". Dodatkowo **ta sama para jest już użyta jako dowód w §3.1** — liczenie jej drugi raz w §3.2 zawyża wsparcie dla wzorca. Po odjęciu tego punktora i po uwzględnieniu, że w **B2-D18-4** litera C była wprost częścią rekomendacji („B najpierw…; jeśli easy nadal alarmuje → **C**"), zostają **3 czyste wystąpienia**, nie „co najmniej 4”. Oryginalny tekst dla śladu (patrz `R-WIARYGODNOSC-S9-TABELA-LICZB.md` — Maciej dał „OK” dla **wszystkich 39** wartości „POTWIERDZENIE” + 7 korekt jednym ruchem, nie punktowo).
- **P-AI-006**: rekomendacja B = same dane w JSON (tabela per nacja), Maciej wybrał **C** — dane **plus** rozszerzenie mechaniki w `ai.ts` (rezerwa Pracy, bypass klastra, częstotliwość celu Mocy, kara poza klastrem) — czyli pełny zakres zamiast samego wpisu liczb.
- **MAP-UX-CLUSTER-LABEL-Q1**: rekomendacja B = tylko zmiana etykiety tekstowej, Maciej wybrał **B+C** — etykieta **i** marker wizualny (korona/obwódka) połączone.
- **D3-v1.1-T2** (sojusz wojskowy, #78, dopisane w rundzie 3 — punkt 3 zlecenia): rekomendacja A = tylko sojusz **Defensywny** (`D3-v1.1-TIER23-paczka.md`), Maciej wybrał **oba typy** sojuszu — Defensywny **i** Pełny — cytat: *„Trzeba wprowadzić dwa sojusze: 1. Sojusz defensywny… 2. Sojusz pełny… Brak wejścia do wojny w pierwszym i drugim przypadku kończy (zrywa) sojusz”* (`D3-v1.1-MACIEJ-2026-06-30.md`) — pełny zakres (oba typy sojuszu, poza samym A/B/C z paczki) zamiast ucinanego (jeden typ).

Ten wzorzec (**wybór pełnego/kombinowanego zakresu zamiast pojedynczej rekomendowanej opcji**) pojawił się
**4 razy** w dostępnej próbie — po korekcie Evaluatora, która zdjęła jeden punktor jako podwójne liczenie tej
samej pary co w §3.1, i po dopisaniu nowego czystego przykładu w tej rundzie (D3-v1.1-T2, #78). Przy n=4
określenie „to nie jest przypadek” byłoby wciąż za mocne; ostrożniejsze sformułowanie: w tej próbce Maciej
**co najmniej 4 razy** wybrał szerszy zakres niż rekomendowany, gdy dodatkowa część miała samodzielny sens
produktowy.

⛔ **KOREKTA (runda 3, punkt 3 zlecenia): poprzednie zdanie „nowe pary dopisane w tej rundzie nie dodają
czystych przykładów tego wzorca” było nieprawdziwe.** D3-v1.1-T2 (#78, wyżej) jest czystym, nowym
przykładem. D3-W10 (#71) nadal **nie** pasuje: to pojedyncza litera A z dopiskiem operacyjnym (warunek
wygaśnięcia w czasie wojny), nie kombinacja dwóch różnych liter, więc policzona osobno w §2, nie tu.
D3-v1.1-T4 (#80, kolejność wdrożenia) **pasuje formalnie też** do tego wzorca (fazowo → wszystko naraz to
też „więcej naraz niż rekomendowane”), ale został przypisany do **§3.1** („teraz/naraz vs pośrednio/fazowo”)
i **nie jest tu liczony drugi raz** — chodzi o oś czasu/tempa wdrożenia, nie o cięty vs pełny zakres
produktu (zakres docelowy jest ten sam w obu opcjach T4).

### 3.3 Kategoria „balans/trudność AI” to miejsce największej rozbieżności z rekomendacją

Na 6 par z obszaru balansu AI/trudności (P-AI-006, P-AI-008, R-AI-TRUDNOSC P2-Q1, P2-Q2, P-AI-MOC-GAP, AI-BALANS-STEP6-Q1) — ~~**5 z 6 to niezgodność** (jedyna zgodność to STEP6-Q1)~~ ⛔ **KOREKTA EVALUATORA: 4 z 6, bo P-AI-008 = zgodność (C→C, patrz korekta wiersza #8)**; zgodne są STEP6-Q1 **i P-AI-008**. W trzech z tych przypadków (P2-Q1, P2-Q2, P-AI-006) Maciej wybrał bardziej zdecydowaną/inwazyjną interwencję niż AI rekomendowało. ⛔ **Zdanie draftu, że przy P-AI-008 „odrzucił wszystkie trzy opcje i podał własne rozwiązanie", jest nieprawdziwe jako opis tej pary** — wybrał rekomendowane **C**, a cytat *„zamiast murów prowadźmy produkcję jednostek… Chmury — wywalmy"* pochodzi z **osobnej korekty po playteście z 2026-08-05 (FALA 226)**, do której nie ma zapisanej rekomendacji AI. Ostrożniejszy (i nadal broniący się) wniosek: przy balansie AI Maciej **wraca do własnych decyzji po playteście** częściej niż w innych obszarach. Dalej: to sugeruje, że przy balansie AI Maciej ma silne własne intuicje z bezpośredniego grania i rzadziej powierza tę kategorię czystej rekomendacji agenta niż np. czyste bugfixy UI (sekcja 3.4).

### 3.4 Czyste naprawy UI/UX z jednoznaczną diagnozą — bardzo wysoka zgodność formalna, próba mniejsza niż wygląda

W parach dotyczących wąsko zdiagnozowanych usterek interfejsu z jedną „oczywistą” rekomendacją
(R-PILL-TARCZA-BEZ-MURU, R-SCOUT-ZWIEDZAJ-PODSWIETLENIE, R-EOT-EVENT-DEFER, R-OBRONA-MIASTA-MP,
R-BUDYNKI-NIEAKTYWNE Q1/Q3, R-AUTO-RACJE-RAISE Q2–Q5) — **10 na 10 par to pełna zgodność formalna**, ale to
**nie 10 niezależnych decyzji**: R-AUTO-RACJE-RAISE Q2–Q5 (4 pary) pochodzą z **jednego** aktu decyzyjnego
Macieja — cytat źródłowy: *„Maciej «działaj z wszystkimi» (= rekomendacje)”* (`R-AUTO-RACJE-RAISE.md`) —
czyli **jedna** zgoda na cały pakiet czterech rekomendacji naraz, nie cztery osobne oceny litera-po-literze.
Licząc **niezależne akty decyzyjne**, a nie pary w tabeli: **7 niezależnych aktów** (R-PILL,
R-SCOUT, R-EOT, R-OBRONA, R-BUDYNKI Q1, R-BUDYNKI Q3, pakiet R-AUTO-RACJE jako jeden akt) — nadal wszystkie
zgodne, ale próbka jest **mniejsza niż sugerowałoby „10 na 10”**. Kontrast z sekcją 3.3 pozostaje w mocy
kierunkowo: **im bardziej temat jest „silnikowy/techniczny z jasną diagnozą”, tym wyższa zgodność; im
bardziej „projektowy/balansowy” (ile, kiedy, jak agresywnie), tym więcej własnego osądu Macieja** — przy
n=7 niezależnych aktów to nadal obserwacja kierunkowa, nie potwierdzona statystycznie reguła.

### 3.5 Hipoteza „zawsze wybiera tańszą/bezpieczniejszą opcję” — NIE POTWIERDZONA, dane są mieszane

Sprawdzono wprost i **odrzucono** jako ogólną regułę: są przypadki wyboru droższej/bardziej ryzykownej opcji nad tańszą rekomendacją (C-TEREN-IMPL-2: A→C, refaktor zamiast sync dokumentacji; R-MAPGEN-KOLEJNOSC-Q1: A→B, dodatkowe czyszczenie kodu zamiast „zamknij bez zmian”; INK-Q1: A→B, honorowanie historii kosztem wyjątku w danych), ale też odwrotne przypadki wyboru tańszej/prostszej opcji nad bogatszą rekomendacją (SP4: B→C, tylko HUD zamiast panel+HUD; C-MPDIFF-Q1: C→A, zostawić bez zmian zamiast poprawić widoczność suwaka; C-TEREN-IMPL-1: C→A, jeden deploy bez checklisty zamiast kompromisu z checklistą; R-AI-TRUDNOSC P2-Q1: C→A, zero zmian zamiast dopięcia konwerterów). **Nie ma jednokierunkowej preferencji koszt/ryzyko** — decyzja zależy od tematu, nie od uniwersalnej reguły „mniej pracy = lepiej” ani „więcej = lepiej”.

---

## 4. DO WERYFIKACJI (sygnał słaby lub niejednoznaczny)

- ✅ **ROZWIĄZANE (Operator, ta runda) — traktowanie rekomendacji WARUNKOWYCH.** Evaluator zauważył, że
  draft odstawiał #21 (B2-D18-6) jako „niejednoznaczne" (rekomendacja „B jeśli…; inaczej A"), a jednocześnie
  co najmniej 7 innych par o tej samej formie liczył płasko jako T/N — w tym dwie (B2-D18-3, INK-Q1), gdzie
  wybrana litera była wprost gałęzią rekomendacji, a mimo to policzone jako N. **Przyjęta reguła i pełne
  przeliczenie w §2** (sekcja „Reguła dla rekomendacji WARUNKOWYCH") — zmiana klasyfikacji: #18 N→T, #21
  niejednoznaczne→T, #30 N→T; #20 i #25 sprawdzone i potwierdzone jako N (wybrana litera poza gałęziami);
  #19 zostaje N z osobnym uzasadnieniem (kombinacja liter, nie czysta gałąź). Statystyka w §2 i wnioski
  §3.2/§3.5 odzwierciedlają już tę korektę.

- **Hipoteza „preferuje dosłowne brzmienie własnych wcześniejszych słów”** — nie udało się jej ani potwierdzić, ani obalić na tym materiale: jedyny mocny przykład to `R-ABC-PELNA-LISTA.md` („nie rób zasady, że tylko 3 pytania... zapisz do zasad” — to jest reguła procesowa, nie para rekomendacja/decyzja z listy). Wymaga osobnego przeglądu cytatów Macieja vs decyzje, którego ta sesja nie wykonała wyczerpująco.
- **Hipoteza „przywraca stan zgodny z wcześniejszą decyzją” zamiast akceptować to, co przypadkiem powstało** — częściowe wsparcie w `BUG-TRAKTAT-KOSZYK-REGRESJA` (`REJESTR-PROSB-I-ZADAN.md:996-1000`, przywrócenie stanu sprzed commitu regresji do wcześniejszej decyzji `HANDEL-SPLIT-Q1=B`), ale to nie jest para rekomendacja-AI/decyzja (nie znaleziono w tym wpisie jawnej „Rekomendacja: X” do porównania) — nie liczone do tabeli w sekcji 1, tylko odnotowane jako poszlaka.
- ~~**B2-D18-6** (bonus osady): rekomendacja AI była warunkowa („B jeśli T1 nadal czerwony po playtescie; inaczej A”), decyzja Macieja = A — może to być zgodność (bo warunek „inaczej A” się ziścił) albo nie, w zależności od nieznanego nam wyniku playtestu w tamtej chwili. Sklasyfikowane jako niejednoznaczne, nie wliczone do statystyki T/N.~~
  **Rozwiązane w §2:** wg przyjętej reguły dla warunkowych, „A" jest jedną z gałęzi rekomendacji („inaczej A")
  niezależnie od nieznanego wyniku playtestu — liczone jako **T** (wiersz #21 w §1). Nie jest już niejednoznaczne.
- **R-BUDYNKI-NIEAKTYWNE Q2** ⟵ **KOREKTA EVALUATORA (2026-08-08, runda 2):** poprzednia treść tego
  punktora („sekcja Q2 ma tylko rekomendację A **bez opisanej opcji C** w tym konkretnym pytaniu; możliwe
  pomieszanie numeracji w źródle") jest **nieprawdziwa** — sprawdzone przy źródle
  (`docs/decyzje/R-BUDYNKI-NIEAKTYWNE-pytanie.md:65-72`): Q2 **ma** własną opcję **C** („Spichlerz + każdy
  budynek, który ma dziś runtime gate w kodzie"), a rekomendacja brzmi wprost **„Rekomendacja: A (przy C
  wynik praktycznie ten sam dziś)"**. Nie ma pomieszania numeracji. Decyzja Macieja = **A+C**.
  **Klasyfikacja „niejednoznaczne" opiera się więc wyłącznie na regule kombinacji z §2** (decyzja to zlepek
  dwóch liter, nie pojedyncza gałąź), a **nie** na braku opcji C. Otwarte pytanie do rozstrzygnięcia w
  przyszłej rundzie: skoro rekomendacja jawnie wskazuje **obie** litery (A jako główna, C jako równoważna),
  para może być pełnym **T** — to zmieniłoby mianownik statystyki §2 z 83 na 84 *(liczba zaktualizowana
  w rundzie 3 zgodnie z nowym mianownikiem po punktach 1–2 zlecenia; sam wniosek o R-BUDYNKI-NIEAKTYWNE Q2
  pozostaje otwarty, nie rozstrzygnięty w tej rundzie — poza zakresem 4 punktów zlecenia)*.
- **R-WIARYGODNOSC-S9-TABELA-LICZB**: 40/47 „POTWIERDZENIE” zaakceptowanych jednym ruchem to bardzo wysoka zgodność (~85%), ale to nie jest klasyczny format ABC (nie ma osobnych liter per parametr, tylko blokowe „OK” + 7 nazwanych korekt) — nie wliczone do głównej statystyki z sekcji 2, ale jest silną poszlaką, że **przy pracy czysto audytowej/weryfikacyjnej (nie projektowej) zgodność jest znacznie wyższa niż przy świeżych decyzjach ABC typu „co zrobić”.** Warto to zbadać osobno na większej próbie audytów, jeśli przyszła sesja będzie miała czas.
- **Skala próby per kategoria jest mała** (np. tylko 6 par „balans AI”, tylko 5 par „act now/naraz vs wait/fazowo” po dopisaniu D3-v1.1-T4 w rundzie 3) — wnioski w sekcji 3.1 i 3.3 są spójne wewnętrznie, ale to wciąż pojedyncyfrowe liczności; jedna kolejna kontrprzykładowa decyzja Macieja mogłaby znacząco zmienić odsetek.
- **Aktualizacja (runda 2):** wszystkie **59** plików `docs/decyzje/` zawierających dowolną formę
  „rekomendacj*" są dziś przejrzane (patrz §2) — ⛔ **to zdanie okazało się przedwczesne**, patrz „DRUGA
  KOREKTA" w §2 (brakujący `PACZKA-2-EKO-TECH-ABC-2026-07-04.md`); **domknięte dopiero w rundzie 3**
  („TRZECIA KOREKTA" w §2). Pozostaje nieprzejrzana reszta katalogu — **309** plików (368−59) — pod kątem
  synonimów rekomendacji ("Sugerowane: X", "Agent proponuje: X" itp.), których grep po „rekomendacj*" nie
  złapie. Przyszła sesja może rozszerzyć grep o synonimy, jeśli będzie taka potrzeba.
- ✅ **ROZWIĄZANE (Operator, runda 3) — reguła dla REKOMENDACJI ZBIORCZYCH.** Poprzednia treść tego punktora
  konflowała dwa różne zjawiska: (a) kilka ID rozstrzygniętych w jednej wiadomości/pliku, ale z **osobną
  literą wypisaną per pytanie** (D3-UX „BBBB", D3-W „Pakiet Macieja") — to niezależne oceny, nie zawyżają
  statystyki; (b) **jedno słowo/zdanie zatwierdzające wszystko naraz bez wypisania litery per pytanie**
  („działaj", „zajmij się") — to **z definicji T**, może zawyżać odsetek. §2 ma teraz jawną regułę
  („REKOMENDACJE ZBIORCZE") i rozbicie **niezależne (75 par, 45T/30N, 60,0%) vs zbiorcze (8 par, 8T, z
  definicji 100%)** — patrz §2. D3-UX i D3-W (litera wypisana per pytanie) **nie** wchodzą do kategorii
  „zbiorcze" mimo wielu ID w jednym pliku — sprawdzone źródłowo w tej rundzie: `D3-UX…:5` = „D3-UX-1=B ·
  D3-UX-2=B · D3-UX-3=B · D3-UX-4=B", `D3-wymiana-OTWARTE-ABC.md:116` = „D3-W1=A, D3-W2=C, D3-W3=B…".
  ⛔ **KOREKTA EVALUATORA (runda 3):** poprzednie brzmienie uzasadniało to zdaniem „litery się różnią
  między pytaniami" — **nieprawdziwym dla D3-UX**, gdzie wszystkie cztery litery to **B (BBBB)**.
  Kryterium rozstrzygającym jest **osobna litera przypisana do każdego ID**, nie ich zróżnicowanie. Jeśli przyszła sesja chce liczyć **niezależne akty decyzyjne** zamiast par (np. traktować
  D3-W jako 1 akt zamiast 8, mimo różnych liter), to inna, węższa miara niż „niezależna ocena per pytanie”
  używana tu — nieprzeliczona w tym dokumencie poza R-AUTO-RACJE-RAISE (§3.4, na żądanie zlecenia rundy 2).

---

## 5. Pliki źródłowe wykorzystane

`docs/decyzje/`: ABC-FORMAT-KANON-MACIEJ.md · ABC-ZAPIS-PLIKOWY.md · ABC-KOLEJKA-OTWARTE-2026-07-27.md · C-WIAR-D4.md · C-WIAR-N1-UX.md · C-TEREN-IMPL-1.md · C-TEREN-IMPL-2.md · C-TEREN-IMPL-3.md · R-MAPGEN-KOLEJNOSC-Q2.md · R-MAPGEN-KOLEJNOSC-Q3.md · R-BITWA-POWTORKA-I.md · P-AI-006.md · P-AI-007.md · P-AI-008.md · B-popcap-akwedukt-audit.md · B2-D18-ABC-MACIEJ.md · B2-szczescie-progi-efektow.md · B5-spichlerz-FORMULARZ-SP1-SP6.md · C-MPDIFF-Q1.md · D-CUD2-pytanie-KANON.md · D-cyw-REJESTR-PARAMETROW-GLOBAL.md · D3-moc-respekt-tuning-scenariusze.md · D3-wymiana-OTWARTE-AB.md · DYSPOZYCJA-STALA.md · E2-gestosc-swiata-MAPA-ODPOWIEDZ-ABC.md · MAP-SPAWN-Q2.md · ODLOZONE-UPGRADE-BUDYNKOW-2026-07-04.md · P-MAPGEN-PANGEA-OBRYS.md · R-ABC-PELNA-LISTA.md · MACIEJ-ABC-PACZKA-2026-06-30.md · R-AI-TRUDNOSC-P2-ABC.md · R-AUTO-RACJE-RAISE.md · R-AUTOBOT-EVALUATOR-WARSTWY-MODELI.md · R-BUDYNKI-NIEAKTYWNE-pytanie.md · R-EOT-EVENT-DEFER.md · R-MENNICA-BRAZ-ZLOTO-ASYMETRIA-Q1.md · R-OBRONA-MIASTA-MP.md · R-PILL-TARCZA-BEZ-MURU.md · R-SCOUT-ZWIEDZAJ-PODSWIETLENIE.md · R-WIARYGODNOSC-DZWIGNIE-2-4-PRZEGLAD.md · R-WIARYGODNOSC-S9-TABELA-LICZB.md · SPICH-AUTO-Q1.md · ABC-PACZKA-2026-08-06-DOPREC.md · ABC-PACZKA-2026-08-06-KOLEJKA.md · R-WIARYGODNOSC-S9-Q1.md · MAP-UX-CLUSTER-LABEL-Q1.md · R-DESIGN-PANEL-MIASTA-V2-Q1.md

**Dopisane w rundzie 2** (punkt 1 zlecenia — 4 pliki wskazane wprost + 16 z szerszego grepu `rekomendacj*`):
D3-UX-relacja-parametry-ABC.md · D3-wymiana-OTWARTE-ABC.md · D3-audiencja-dyplomacja.md ·
R-BUDOWA-ZROWNOWAZONE-TRYB.md · B1-tech-ABC-OTWARTE.md · B1-tech-MACIEJ-2026-06-29.md ·
D3-v1.1-TIER23-paczka.md · D3-v1.1-MACIEJ-2026-06-30.md · R-HANDEL-AI-FALA.md ·
D-START-miasta-kopie-typu.md · R-AI-MIASTA-BUDOWY-Q1.md · R-AI-TRUDNOSC-AUDYT.md ·
R-DYST-DREWNO-TABELE-PROPOZYCJA.md · R-KOLEJKA-OTWARTA-ABC.md · R-NASTEPNY-KROK-PELNA-LISTA.md ·
R-WIARYGODNOSC-AUDIT-OPEN-VS-DEPLOYED-2026-08-05.md · R-WIARYGODNOSC-ETAP0.md.

**Dopisane w rundzie 3** (punkt 1 zlecenia — plik „brakującego dwunastego" domykający przegląd 12
plików „pozostałych"; punkt 2 zlecenia — `R-AI-MIASTA-BUDOWY-Q1.md` był już na liście wyżej, ale w tej
rundzie zweryfikowany jako dający pełną parę, nie plik bez pary):
**PACZKA-2-EKO-TECH-ABC-2026-07-04.md**.

`dyspozycje/`: REJESTR-PROSB-I-ZADAN.md (pełny grep „rekomend” + odczyt trafień) · PYTANIA-OTWARTE.md (pełny grep „rekomend” + odczyt trafień, w tej rundzie doczytano też linie 870-914 dla wiersza #60) · `_handoff/KANAL-PRACA.md` (pełny grep „rekomend”, trafienia przejrzane, żadne nie dało nowej pełnej pary z wystarczającym kontekstem do wpisania do tabeli).

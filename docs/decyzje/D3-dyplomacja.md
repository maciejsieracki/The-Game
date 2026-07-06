# Gr-D3 — Dyplomacja

**Ekran:** panel Dyplomacja (+ opcjonalnie HUD)  
**Status:** **ZAMKNIĘTE** (D3-Q1…Q4 audiencja) · implementacja **GOTOWA DO STARTU**  
**Korekta Macieja 2026-06-27:** lista = tylko spotkane nacje + „Porozmawiaj"; akcje na **ekranie audiencji** (TW/Civ).  
**Spec:** `docs/decyzje/D3-audiencja-dyplomacja.md`  
**Mapowanie:** T1–T4 (2026-06-25: T1=A, T2=A, T3=A, T4=B)

## Decyzje Macieja

| # | Pytanie | Decyzja | Data |
|---|---------|---------|------|
| 4 | Panel v1.0 | **B** — pełny panel z akcjami gracza (wojna, pokój, handel/sojusz) | 2026-06-26 |
| **D3-Q1** | Potwierdzenie wojny (na audiencji) | **A** — modal Tak/Anuluj | 2026-06-27 |
| **D3-Q2** | Kiedy nacja na liście | **A** — odkryty heks miasta/jednostki w mgle | 2026-06-27 |
| **D3-Q3** | Jeden wpis na liście | **A** — jedno miasto / owner (Ostia, Kapua…) | 2026-06-27 |
| **D3-Q4** | Audiencja — akcje v1.0 | **C** (główni, 12 akcji) + **A** (poboczni, 5 podstawowych) | 2026-06-27 |
| **D3-REL-150** | Próg Relacji na umowy pozytywne (sojusz w wersji 1) | **Relacja > 150** (minimum 151); premia siły wojskowej partnera **nie obniża** tego progu | 2026-06-30 |
| **D3-NAP-110** | Próg paktu o nieagresji | **Relacja ≥ 110**; bez osobnych progów Zaufania / Respektu | 2026-06-30 |
| **D3-LUKSUS-USUN** | Brak surowca „luksus” | Usunięto złoże luksus, plantację, technologię Matematyka→Plantacja | 2026-06-30 |
| **D3-HANDEL-ZLOZE** | Cennik dostępu do złoża | glina/sól 50 · konie/węgiel 100 · miedź 120 · żelazo 150 punktów wartości; kurs Relacja÷100; **bez bydła/owiec** (to ulepszenia terenu) | 2026-06-30 |
| **D3-HANDEL-100** | Próg handlu | **Relacja ≥ 100**; kurs Relacja÷100; dostęp do złoża = **jedno pole mapy** | 2026-06-30 |
| **D3-WARTOSC-PN** | Wspólna waluta wymiany | **Punkty wartości (PN)** — każda pozycia ma cenę; technologia = Koszt nauki; handel = suma PN po obu stronach; dar = jedna strona | 2026-06-30 |
| **D3-KATALOG-PN** | Cennik pozycji w handlu | jednostka = koszt ¤; dostęp surowca = min ulepszenia; **bez** ulepszeń terenu i budynków | 2026-06-30 |
| **D3-KAT-NO-IMP** | Ulepszenie terenu | **Nie** handlujemy | 2026-06-30 |
| **D3-KAT-NO-BLD** | Budynek w mieście | **Nie** handlujemy | 2026-06-30 |
| **D3-KAT-NO-HEX** | Sprzedaż hexów / terytorium | **Nie v1.0** — zbyt skomplikowane (wybór hexów); jak W9 | 2026-06-30 |
| **D3-PN-REL-ZASADA** | Jak wartość wpływa na relacje | Dar głównie **w handlu** (nadmiar); czysty dar rzadszy; jeden kurs PN→Zaufanie | 2026-06-30 |
| **D3-PN-ZAUFANIE** | Kurs i limit | **100 PN = +1 Zaufanie**; **max +5 Zaufania na turę** z handlu + darów łącznie (parametry w JSON) | 2026-06-30 |
| **D3-W6** | Żywność w handlu/darze v1.0 | **Tak** — **1 PN = 1 żywność** (korekta 2026-06-30; było 4) | 2026-06-30 |
| **D3-W7** | Punkty nauki (nie cała tech) | **Nie v1.0** — odłożone | 2026-06-30 |
| **D3-W8** | Kultura w koszyku | **Nie v1.0** — odłożone | 2026-06-30 |
| **D3-W9** | Sprzedaż miasta/terytorium | **Nie v1.0** — odłożone | 2026-06-30 |
| **D3-W1** | Bonus +2 przy zawarciu handlu | **A** — tylko nadmiar PN | 2026-06-30 |
| **D3-W2** | Dobra wola po nadmiarze | **C** — +1/turę × 3 tury gdy nadmiar ≥ 100 PN | 2026-06-30 |
| **D3-W3** | Próg czystego daru | **B** — Relacja ≥ 30 | 2026-06-30 |
| **D3-W4** | Tolerancja fair deal | **A** — ścisłe sumy PN | 2026-06-30 |
| **D3-W5** | Próg wymiany tech | **A** — Relacja ≥ 100 | 2026-06-30 |
| **D3-W6b** | Kurs żywności | **1 PN = 1 żywność** *(korekta Maciej; pierwotnie C = 4)* | 2026-06-30 |
| **D3-W10** | Dostęp do złoża | **A+** — trwały; **w wojnie traci ważność**; po pokoju renegocjacja | 2026-06-30 |
| **D3-W11** | Przetworzone dobra | **A** — nie v1.0 | 2026-06-30 |
| **D3-PROG-G1** | Granice / przemarsz (akcja 4) | **A** — Relacja ≥ **100** (jak handel) | 2026-06-30 |
| **D3-PROG-G2** | Wchłonięcie | **B** — osobna **akcja 13**; Respekt ≥ **90** | 2026-06-30 |
| **D3-PROG-G3** | UI czystego daru | **B** — osobna karta **„Prezent"** w audiencji (Rel ≥ 30) | 2026-06-30 |
| **D3-PROG-G4** | Progi nacji pobocznych | **B** — handel Rel ≥ **30**; pozostałe **−20 pkt** vs główni | 2026-06-30 |
| **D3-BORD** | Kara nieautoryzowany przemarsz | **−5 Zaufanie/turę** (koniec tury na cudzym terytorium bez traktatu); bez osobnej Relacji | 2026-06-30 |
| **D3-TRYB** | Trybut (8) | **Respekt > 70** + min **10 ¤/turę** (żądanie, spokój); **oferta w wojnie = jednorazowe ¤** | 2026-06-30 |
| **D3-ULT** | Ultimatum (9) | **M ≥ 1,3×** + reparacje **≥ 20 ¤**; v1.0 tylko ¤ (reszta warunków później) | 2026-06-30 |

Szczegóły trybut/ultimatum: [`D3-trybut-ultimatum-ABC.md`](D3-trybut-ultimatum-ABC.md) · przemarsz: [`D3-przemarsz-kara-ABC.md`](D3-przemarsz-kara-ABC.md)

---

## D3-PN-REL-ZASADA — wartość wymiany a poprawa relacji (Maciej 2026-06-30)

### Zasada (zatwierdzona)

1. **Prezent jako osobna akcja** — możliwy, ale **rzadki**. Na co dzień relacje buduje się **handlem** (nadmiar w koszyku).
2. **Nadmiar w handlu** podnosi **Zaufanie** u partnera (a więc Relację ogólną).
3. **Czysty dar** — cała oddana wartość liczy się jak nadmiar (**ten sam kurs**).
4. **Respekt** od tego się **nie zmienia**.
5. **Nie da się „kupić” relacji za kasę** — wysoki kurs (100 PN za +1 Zaufania) + limit na turę (D3-PN-ZAUFANIE).

### Nadmiar

```
minimalna suma fair = (suma po stronie partnera) × (100 ÷ Relacja)
nadmiar = max(0,  suma oddaję − minimalna suma fair )
```

**Przykład (Relacja 100):** oddajesz 250 PN, dostajesz 100 PN → nadmiar **150 PN** → surowo **+1 Zaufania**.

**Czysty dar 250 PN:** nadmiar **250 PN** → surowo **+2 Zaufania**.

---

## D3-PN-ZAUFANIE — przelicznik i limit (Maciej 2026-06-30) ✅

### Kurs (zatwierdzony)

```
surowa zmiana Zaufania = floor(nadmiar punktów wartości ÷ 100)
```

| Nadmiar (PN) | Surowe Zaufanie |
|--------------|-----------------|
| 99 | 0 |
| 100 | +1 |
| 199 | +1 |
| 200 | +2 |
| 500 | +5 |

Parametr: `pn_relacja.pn_na_zaufanie` = **100** — strojenie w panelu / JSON bez zmiany kodu.

### Limit na turę (zatwierdzony)

**Handel + dary łącznie** → max **+5 Zaufania na turę** z mechanizmu nadmiaru / wartości daru.

Przykład w jednej turze:
- Handel, nadmiar 400 PN → surowo +4 → dostajesz **+4**
- Dar 200 PN → surowo +2 → zostaje **+1** (limit 5)
- Kolejny dar w tej turze → **+0** do następnej tury

Parametr: `pn_relacja.max_zaufanie_na_ture` = **5**. Silnik trzyma licznik per para cywilizacji.

Kod: `diplomacyPnToZaufanieDelta`, `diplomacyClampTrustGainNaTure`, `diplomacyTradeTrustFromDeal`.

### Co jeszcze przy wymianie (poza nadmiarem)

| Element | Status |
|---------|--------|
| Bonus +2 Zaufania przy **zawarciu** umowy handlowej (osobno od nadmiaru) | do potwierdzenia |
| „Dobra wola” +1 Zaufania/turę przez 5 tur po wymianie z nadmiarem | do potwierdzenia |
| Aktywny handel +1 Zaufania/turę przez czas trwania umowy | już w szablonie danych |

### Scenariusz dla gracza

> Hojny handel daje max +5 Zaufania w tej turze. Resztę relacji buduję przez **kolejne tury** — nie jednym przelewem całego skarbca.

---

## Słownik (żeby wszyscy mówili tym samym językiem)

| Skrót w dokumencie | Pełna nazwa | Co to znaczy w grze |
|--------------------|-------------|---------------------|
| **PN** | punkty wartości | Wspólna „waluta porównawcza” dla wymiany. Każda rzecz w koszyku ma liczbę PN — dzięki temu widać, czy deal jest fair (uczciwy). |
| **Relacja** | Relacja ogólna (0–200) | **Zaufanie** + **Respekt, jaki masz u partnera**. Im wyższa, tym łatwiej negocjować korzystne warunki. |
| **Zaufanie** | Zaufanie (0–100) | Miękka relacja: paki, handel, dary, dotrzymywanie słowa. Dary podnoszą głównie Zaufanie. |
| **Respekt** | Respekt (0–100) | Twarda siła: armia, miasta, wygrane bitwy. Respekt rośnie od mocy, nie od prezentów. |
| **NAP** | pakt o nieagresji | Umowa polityczna „nie bijemy się przez X tur” — **nie** kupuje się za punkty wartości, tylko za poziom Relacji. |
| **hex** | pole mapy | Jedno pole na mapie heksagonalnej. Dostęp do złoża = prawo korzystania z **jednego** takiego pola. |
| **boolean** | tak/nie (dostęp) | Albo masz prawo korzystać z surowca w imperium, albo nie — **bez** liczenia worków w magazynie. |
| **fair deal** | uczciwa wymiana | Suma tego, co oddajesz (w PN), jest w tolerancji równa temu, co dostajesz — po uwzględnieniu kursu Relacji. |

---

### D3-WARTOSC-PN — wspólny cennik wymiany (Maciej 2026-06-30)

#### Po co w ogóle punkty wartości?

W grze typu Civilization negocjacje wyglądają jak **dwa koszyki**: po lewej „co oddaję”, po prawej „co chcę dostać”. Żeby komputer (i gracz) wiedział, czy propozycja ma sens, **każda pozycja w koszyku musi mieć liczbę punktów wartości (PN)**.

Bez tego nie da się sensownie odpowiedzieć na pytania:
- Czy 100 Pieniędzy za technologię Żelazo to dobra oferta?
- Czy dar 50 Pieniędzy powinien dać tyle samo Zaufania co dar jednej jednostki?
- Czy wymiana dostępu do gliny za dostęp do żelaza jest równoważna?

**Zasada:** handel, dar, przekupstwo i reparacje w pokoju liczą wartość **tym samym katalogiem PN**. Różni się tylko to, czy druga strona musi coś oddać w zamian.

#### Trzy rodzaje wymiany (nie mylić ze sobą)

**1. Handel (kupno / sprzedaż)** — **dwie strony**, obie coś dają. **Główna ścieżka** poprawy relacji.

- Wymaga **Relacji co najmniej 100**.
- Liczysz sumę punktów wartości po lewej i po prawej.
- Przy Relacji 100 uczciwy deal = **sumy mniej więcej równe** (tolerancja około ±20%).
- Przy **wyższej** Relacji płacisz **mniej** za to samo (kurs: Relacja ÷ 100).
- **Nadmiar** ponad uczciwą wymianę → **Zaufanie** (ten sam kurs co przy czystym darze — sekcja D3-PN-REL-ZASADA).

**2. Prezent (dar)** — **jedna strona**, tylko ty coś oddajesz. **Rzadsza ścieżka** — na co dzień relacje buduje się **nadmiarem w handlu** (patrz D3-PN-REL-ZASADA).

- Partner **nie musi** nic dać w zamian.
- **Cała** wartość w punktach wartości traktowana jak **nadmiar** (ten sam przelicznik na Zaufanie co w handlu).
- **Reparacje w traktacie pokojowym** — na razie jak dar.

**3. Umowy polityczne** — **nie koszyk PN**.

- Pakt o nieagresji, sojusz, otwarte granice, trybut, ultimatum, wasalizacja — to **progi Relacji, Zaufania lub Respektu**, plus czasem przymus (kto jest silniejszy).
- Łapówka przy namówieniu do wojny **ma** wartość w PN (bo to Pieniądze), ale sama decyzja „wypowiedz wojnę X” to akcja polityczna, nie towar ze sklepu.

#### Skąd biorą się liczby PN?

| Typ pozycji | Skąd bierzemy PN | Przykład |
|-------------|------------------|----------|
| Pieniądze (¤) | 1 PN = 1 ¤ | 100 ¤ = 100 PN |
| Żywność (spichlerz) | 1 PN = **1 żywność** | 100 żywności = 100 PN |
| Praca | 1 PN = 1 punkt Pracy | 80 Pracy = 80 PN |
| Dostęp do złoża (jedno pole mapy) | stały cennik w `diplomacy.json` | glina 50, żelazo 150 PN |
| Technologia | pole „Koszt nauki” w `tech.json` × tempo gry | Obróbka drewna = 12 PN (tempo standardowe) |
| ~~Ulepszenie terenu~~ | **Nie handlujemy** (farma, tartak…) | — |
| Jednostka wojskowa | pole „Pieniądz (koszt)” w `units.json` | Wojownik = 10 PN |
| ~~Budynek w mieście~~ | **Nie handlujemy** | — |
| Dostęp do surowca (tak/nie) | **najniższy** `koszt_praca` ulepszenia, które odblokowuje ten surowiec | drewno → tartak = 25 PN *(cennik ref.)* |

**Ważne rozróżnienie — złoże na mapie vs hodowla:**

- **Glina, sól, konie, węgiel, miedź, żelazo** na **polu złoża** — handlujesz **dostępem do jednego pola** (cennik 50–150 PN). To nie to samo co „mam glinę w imperium”.
- **Bydło, owce, lama** — **nie** hex złoża; w koszyku tylko **dostęp boolean** do surowca (cena = min koszt ulepszenia odblokowującego), **nie** gotowe ulepszenie na mapie.

Kod liczący PN: `gra/src/game/diplomacy-value-catalog.ts`. Reguły w JSON: `gra/data/diplomacy.json` → `wartosc_katalog`.

---

## 1. Handel — kupno i sprzedaż (dwie strony, Relacja ≥ 100)

Na ekranie audiencji (wzorzec Civilization) widzisz **dwie kolumny**. Dodajesz pozycje z listy poniżej; gra sumuje PN i ocenia, czy partner zaakceptuje ofertę.

### 1a. Pozycje z **zamkniętym** cennikiem (wiemy dokładnie ile PN)

| Co można wymieniać | Ile to PN | Uwagi |
|--------------------|-----------|--------|
| **Pieniądze (¤)** | 1 PN = 1 ¤ | Podstawowa waluta |
| **Praca** | 1 PN = 1 Praca | Druga waluta operacyjna |
| **Żywność** (ze spichlerza miasta) | 1 PN = **1 żywność** | D3-W6/W6b — katalog PN ✅; UI koszyka — do wpięcia |
| **Dostęp do złoża** — jedno pole mapy | glina, sól: **50** · konie, węgiel: **100** · miedź: **120** · żelazo: **150** | Partner oddaje prawo do jednego pola ze złem |
| **Technologia** (przekazanie odkrycia) | **Koszt nauki** z pliku technologii | Można wymieniać tech za tech (po PN) albo sprzedać za Pieniądze / Pracę — wtedy cena zależy od Relacji |

### 1b. Pozycje z **zamkniętym** cennikiem (decyzja D3-KATALOG-PN, 2026-06-30)

| Co można wymieniać | Ile to PN | Skąd liczba |
|--------------------|-----------|-------------|
| **Jednostka wojskowa** (np. Wojownik, Konnica) | jak koszt produkcji | Pole „Pieniądz (koszt)” w definicji jednostki |
| **Dostęp do surowca** w modelu tak/nie (bez worków) | = najtańsze ulepszenie odblokowujące *(cennik ref.)* | Np. drewno → tartak (25 PN); bydło → pastwisko (20 PN) |

**Wykluczone z koszyka:** ulepszenie terenu (D3-KAT-NO-IMP) · budynek miasta (D3-KAT-NO-BLD) · **hex terytorium / miasto** (D3-KAT-NO-HEX, W9).

### 1c. Czego **nie ma** w handlu (umowy — osobna ścieżka)

Te rzeczy negocjujesz jako **umowy polityczne**, nie jako pozycje w koszyku PN:

| Akcja | Dlaczego poza handlem |
|-------|------------------------|
| Pakt o nieagresji | Wymaga Relacji ≥ 110 (plus negocjacja czasu trwania) |
| Sojusz wojskowy | Wymaga Relacji > 150 (minimum 151) |
| Otwarte granice, prawo przemarszu | Progi Zaufania / Relacji + czasem opłata, ale to **umowa**, nie sklep |
| Trybut co turę, ultimatum, wasalizacja | **Przymus** — decyduje siła (Respekt), nie koszyk towarów |
| Namówienie do wojny | Osobna akcja; łapówka ma PN, ale „wypowiedz wojnę” to decyzja AI |
| Wypowiedzenie wojny / zawarcie pokoju | Zmiana stanu dyplomatycznego, nie towar |

### 1d. Czego **nie ma** w grze lub w wersji 0.1

| Pozycja | Powód |
|---------|--------|
| Luksus, plantacja | Usunięte z gry (decyzja D3-LUKSUS-USUN) |
| Bydło / owce / lama jako **złoże na polu mapy** | Hodowla — tylko **dostęp boolean** do surowca, nie ulepszenie na heksie |
| **Gotowe ulepszenie terenu** (farma, tartak…) | **Nie handlujemy** (D3-KAT-NO-IMP) |
| **Budynek w mieście** (stolarnia, koszary…) | **Nie handlujemy** (D3-KAT-NO-BLD) |
| **Hex terytorium / miasto** (sprzedaż landu) | **Nie v1.0** — wymaga wyboru hexów; zbyt skomplikowane (D3-KAT-NO-HEX = W9) |
| Worki surowców (50 drewna, 10 rudy…) | W wersji 0.1 surowce są **dostępem tak/nie**, bez magazynu ilości |
| Przetworzone (cegła, stal, ceramika…) | Brak handlu workami — ewentualnie przyszła wersja 2 |

### Przykład handlu (Relacja 100 — kurs 1:1)

```
[ CO ODDAJĘ ]                    [ CO DOSTAJĘ ]
  100 ¤           → 100 PN         technologia Żelazo  → 120 PN
  pole z gliną    →  50 PN         80 Pracy            →  80 PN
  ─────────────────────────────────────────────────────
  SUMA            → 150 PN         SUMA                → 200 PN
```

Przy Relacji 100 partner widzi nierównowagę (150 vs 200) — odrzuci lub poprosi o dopłatę. Przy Relacji **120** kurs faworyzuje ciebie: to, co dajesz, „waży” więcej w oczach partnera (150 × 120/100 = 180 w stosunku do jego 200) — negocjacja bliżej akceptacji.

---

## 2. Prezent — dar i przekupstwo (jedna strona)

**Ten sam katalog punktów wartości** co w handlu, ale **tylko ty coś oddajesz**. Partner nie musi nic włożyć do koszyka.

### 2a. Co można dać na prezent (wartość znana)

| Prezent | Wartość w PN |
|---------|--------------|
| Pieniądze (¤) | 1 PN = 1 ¤ |
| Praca | 1 PN = 1 Praca |
| Dostęp do złoża (jedno pole) | jak cennik złóż (50–150) |
| Technologia | Koszt nauki |
| Łapówka przy namówieniu do wojny | kwota w ¤ (= ta sama liczba PN) |

### 2b. Co można dać na prezent (decyzja D3-KATALOG-PN)

Jednostka · dostęp do surowca (tak/nie) — **identyczne PN** jak w handlu. **Bez** ulepszeń terenu i budynków.

**Reparacje w pokoju** — na razie liczone jak zwykły dar (jednostronna wartość w PN). Osobna mechanika „kary wojennej” — później.

### 2c. Jak handel i prezent wpływają na relacje

| Element | Status |
|---------|--------|
| **Zasada:** dar głównie w handlu (nadmiar), czysty dar rzadki | **Zatwierdzone** (D3-PN-REL-ZASADA) |
| **Kurs:** 100 punktów wartości = +1 Zaufanie | **Zatwierdzone** (D3-PN-ZAUFANIE) |
| **Limit:** max +5 Zaufania na turę (handel + dary łącznie) | **Zatwierdzone** (D3-PN-ZAUFANIE) |

Relacja rośnie **tylko przez Zaufanie** (Respekt bez zmiany od nadmiaru lub daru).

---

## 3. Nie wybrane — czeka na Twoją decyzję

**Pełne pytania A/B (rozszerzone):** [`D3-wymiana-OTWARTE-AB.md`](D3-wymiana-OTWARTE-AB.md) — 11 pytań D3-W1…W11.

### 3a. Czy w ogóle w handlu lub na prezencie?

| Temat | Pytanie do Ciebie |
|-------|-------------------|
| **Żywność** ze spichlerza | **Tak v1.0** — **1 PN = 1 żywność** ✅ |
| **Pula nauki** (punkty badań, nie cała technologia) | **Nie v1.0** (D3-W7) |
| **Kultura** | **Nie v1.0** (D3-W8) |
| **Miasto lub sprzedaż terytorium** | **Nie v1.0** (D3-W9) |
| **Przetworzone dobra** (cegła, stal…) | Raczej wersja 2 (brak worków) |
| **Wynajem złoża lub miasta na N tur** | Dziś: dostęp **trwały** (tak/nie). Czy chcesz okresowy najem? |
| **Próg Relacji na wymianę technologii** | Propozycja: Relacja ≥ 120 — **nie potwierdzone** (handel ogólnie = 100) |

### 3b. Cennik punktów wartości — **zamknięte** (D3-KATALOG-PN)

| Pozycja | Twoja decyzja |
|---------|---------------|
| Ulepszenie terenu | **Nie v1.0 — nie handlujemy** (D3-KAT-NO-IMP) |
| Jednostka | PN = koszt produkcji w Pieniądzu — **zatwierdzone** |
| Budynek | **Nie handlujemy** (D3-KAT-NO-BLD) |
| Dostęp do surowca (tak/nie) | PN = najtańsze ulepszenie odblokowujące — **zatwierdzone** |

### 3c. Mechanika — w trakcie pracy technicznej

| Temat | Stan |
|-------|------|
| Wzór: nadmiar / dar → Zaufanie | **Zamknięte:** 100 PN = +1 Zauf.; max +5/turę (D3-PN-ZAUFANIE) |
| Tolerancja „uczciwej wymiany” (±20% w starym kodzie vs czyste sumy PN) | Do uzgodnienia z nowym modelem |
| Interfejs audiencji — dwa koszyki jak w Civilization | Projekt OK; implementacja w lane UI — do zrobienia |
| Plik reguł + kod katalogu PN | **Gotowe** (`wartosc_katalog` + `diplomacy-value-catalog.ts`) |

---

### Drabinka progów Relacji (co odblokowuje się kiedy)

**Główni rywale** — stan 2026-06-30 (G1–G4 + wcześniejsze D3):

```
Prezent (karta osobna)     →  Relacja ≥ 30   ✅ (G3-B, W3)
Handel + granice/przemarsz →  Relacja ≥ 100  ✅ (HANDEL-100, G1-A)
Wymiana technologii        →  Relacja ≥ 100  ✅ (W5-A)
Pakt o nieagresji (NAP)    →  Relacja ≥ 110  ✅ (NAP-110)
Sojusz (defensywny / pełny)→  Relacja > 150  ✅ (min 151, REL-150)
Wasalizacja                →  Respekt ≥ 70
Wchłonięcie (akcja 13)     →  Respekt ≥ 90   ✅ (G2-B)
```

**Nacje poboczne (G4-B):** handel od Rel ≥ **30**; pozostałe progi **−20** względem głównych (np. NAP 90, sojusz 131). Szczegóły: [`D3-prog-ABC-2026-06-30.md`](D3-prog-ABC-2026-06-30.md).

Wyjątki bez progu Relacji (przymus): trybut, ultimatum, namów, pokój, wojna, kontakt.

---

### Podsumowanie trzech list (stan 2026-06-30)

| Lista | Co wchodzi | Co wykluczone | Co jeszcze otwarte |
|-------|------------|---------------|---------------------|
| **Handel** | **6 typów** towarów (¤, Praca, żywność, złoże hex, tech, jednostka + dostęp surowca) | Ulepszenia, budynki, hex terytorium, luksus, przetworzone | — |
| **Prezent** | Ten sam katalog + reparacje = dar | To samo co wykluczenia handlu | Wzór PN → Zaufanie; próg Relacji na dar |

#### Model interfejsu handlu (docelowy)

```
[ CO ODDAJĘ ]                         [ CO DOSTAJĘ ]
  100 Pieniądze (¤)  → 100 PN           technologia Żelazo  → 120 PN
  pole z gliną       →  50 PN           80 Pracy            →  80 PN
  ───────────────────────────────────────────────────────────
  SUMA               → 150 PN           SUMA                → 200 PN

Przy Relacji 120 partner liczy: czy moja oferta (150 PN × 120/100) wystarczy na jego 200 PN?
```

### D3-HANDEL-100 — próg i kurs handlu (Maciej 2026-06-30)

| Element | Wartość |
|---------|---------|
| Minimalna Relacja | **100** (parametr `progHandelRelacja` w pliku dyplomacji) |
| Kurs Pieniądze ↔ Praca | to, co otrzymujesz = to, co płacisz × (Relacja ÷ 100); przy Relacji 100 stosunek 1:1 |
| Złoża mineralne | ten sam próg Relacji + cennik złóż; **jedna transakcja = jedno pole mapy ze złem** |
| Kod | `diplomacy-currency-trade.ts`, `diplomacy-deposit-trade.ts` |

### D3-HANDEL-ZLOZE — cennik dostępu do złóż (Maciej 2026-06-30)

Handel dyplomatyczny dotyczy **prawa do jednego pola ze złem** (tak/nie), a nie worków surowca w magazynie.

**Bydło, owce, lama** — to ulepszenia hodowli na mapie; **nie** wchodzą w ten cennik (są w katalogu ulepszeń terenu).

Ceny bazowe (w punktach wartości / Pieniądzach przy Relacji 100): `gra/data/diplomacy.json` → sekcja `handel_zloze`. Kod: `diplomacy-deposit-trade.ts`.

### D3-LUKSUS-USUN

Usunięto z gry: złoże mapy „luksus”, ulepszenie **Plantacja**, odblokowanie w technologii Matematyka. *(Suwak „Społeczeństwo / Wealth” w ekonomii to osobny mechanizm — nie surowiec na mapie.)*

### D3-REL-150 — próg umów pozytywnych (Maciej 2026-06-30)

**Relacja ogólna = Zaufanie + Respekt, jaki masz u partnera** (zakres 0–200).

Dobrowolne umowy pozytywne (np. sojusz) wymagają **Relacji większej niż 150** (w kodzie: minimum 151). Kolejne typy umów — ten sam schemat: najpierw Relacja, potem warunki dodatkowe.

Wyjątki (przymus, nie dobra wola): trybut, ultimatum, namówienie do wojny.

**Kod:** `diplomacy.ts`, `diplomacy-proposals.ts`, `diplomacy.json`, testy `diplomacy-test.cjs`, `diplomacy-proposal-test.cjs`.

### D3-Q1 — potwierdzenie wojny (Maciej, 2026-06-27)

Klik **„Wypowiedz wojnę"** → modal z pytaniem i przyciskami **Tak / Anuluj**. Dopiero **Tak** zmienia stan relacji.

## Po decyzji (Work)

- UI: lista minimalna (`diplomacyPanel.ts`) + **audiencja** (`diplomacyAudience.ts`).
- SILNIK: kontakt formalny, etykiety miast, callbacki audiencji.
- Banery wojny na HUD → **Grupa A** (A1-Q5).

## → SILNIK / UI

**GOTOWE DO STARTU** — `docs/decyzje/D3-audiencja-dyplomacja.md` + handoffy UI/SILNIK D3Q2.

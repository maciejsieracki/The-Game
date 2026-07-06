# Część VI — Miasto: ludność i stabilność

> **Poradnik gracza (Pełny)** · zakładka **Miasto** w panelu miasta  
> Powiązane hasła Wiki: `docs/encyklopedia/pojecia/` · spis: `docs/PORADNIK-GRACZA-SPIS-TRESCI.md` §32–41

Zakładka **Miasto** to centrum zarządzania ludnością, zdrowiem, nastrojami i stabilnością. Tu ustawiasz podziały handlu, pracy i żywności, obserwujesz zamożność warstwy społecznej oraz kulturę i religię **tego** miasta. Nie szukaj tu listy budynków ani kolejki produkcji — to zakładki **Produkcja** i **Okolica** (Część VII).

---

## 32. Panel miasta — zakładka Miasto

### 32.1. Co widzisz po otwarciu miasta

Po kliknięciu miasta na mapie otwiera się panel z czterema zakładkami u góry: **Plony · Produkcja · Miasto · Okolica**. W **Miasto** widzisz:

- **Nagłówek** — nazwa, liczba mieszkańców, wielkość miasta (poziom).
- **Lewa kolumna** — ludność i bufor wzrostu, zdrowie, szczęście, porządek (z rozpiskami plusów i minusów).
- **Prawa kolumna** — suwaki podziału (handel, praca, żywność), sekcja zamożności (bogactwa), kultura i religia, przełącznik auto-zarządcy.

Każda liczba ma rozpiskę: wiesz **dlaczego** wyszło akurat tyle, a nie tylko wynik końcowy. Przy ikonie `(?)` obok sekcji znajdziesz skrót Wiki — pełniejsze wyjaśnienia w encyklopedii (`docs/encyklopedia/pojecia/`).

**Wskazówka:** Otwieraj **Miasto** regularnie w miastach granicznych i tuż po podboju — tam najszybciej spadają nastroje i prawo.

### 32.2. Trzy grupy mieszkańców (zadowoleni · kontentni · niezadowoleni)

Pod sekcją szczęścia widzisz trzy ikony z liczbami: uśmiechnięci, neutralni, niezadowoleni. To **obrazek** procentu szczęścia — gra **nie** liczy osobno „głów” zadowolonych ludzi. Jedna liczba procentowa przekłada się na podział wizualny:

| Szczęście miasta | Co sugerują ikony |
|------------------|-------------------|
| Wysokie (ok. 80% i więcej) | Dominują zadowoleni |
| Średnie (ok. 60–79%) | Mieszanka, przewaga neutralnych |
| Niskie (ok. 40–59%) | Coraz więcej niezadowolonych |
| Bardzo niskie (poniżej ok. 40%) | Prawie sami niezadowoleni |

**Nie traktuj trzech koszyków jako suwaka do ręcznego ustawiania** — zmieniasz szczęście przez podatki, budynki, wojsko, kulturę i stabilność, a ikony same się przeliczają.

### 32.3. Gdzie szukać alertów

Gdy miasto jest niespokojne, gra sygnalizuje to na kilka sposobów:

1. **Chip buntu** w panelu wydarzeń (dolny pasek mapy) — krótki komunikat z nazwą miasta.
2. **Ikona ognia** na heksie miasta na mapie — widoczna do końca tury.
3. **Czerwone lub pomarańczowe komunikaty** w sekcji porządku w panelu miasta.
4. **Alert krytyczny** na mapie strategicznej — po dłuższym, skrajnym niepokoju (patrz §36.5–36.6).

**Wskazówka:** Chip w dolnym pasku to pierwszy sygnał — nie czekaj na ogień na mapie. Wejdź w **Miasto** i sprawdź rozpiskę minusów przy szczęściu i prawie.

### 32.4. Czego nie ma w zakładce Miasto (wersja 1.0)

- **Specjaliści** — mechanika usunięta w v1.0; nie szukaj sekcji specjalistów.
- **Globalne szczęście imperium** — każde miasto ma **własny** procent; na górnym pasku zasobów mapy nie ma jednej liczby szczęścia dla całego państwa.


### Przykład liczbowy

Stolica **pop 2**, szczęście **85%**, porządek **78%** — brak kar.
Po wypowiedzeniu wojny: szczęście **−3** → **82%**, porządek spada do **71%** (nadal spokój).
Chip buntu pojawia się dopiero gdy porządek **<50%** przez kilka tur.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 33. Ludność i wzrost

### 33.1. Aktualna populacja i limit

W sekcji mieszkańców widzisz:

- **Aktualną liczbę** ludzi w mieście.
- **Limit wzrostu** — bez **Akweduktu** normalnie maksymalnie **6** mieszkańców; Akwedukt podnosi ten próg (szczegóły budynku — Część VII).
- **Wpływ trudności** — na wyższej trudności próg zapełnienia bufora rośnie szybciej z każdym mieszkańcem; na łatwej — wolniej.

Im więcej ludzi, tym trudniej utrzymać zdrowie i szczęście (kara za **zagęszczenie** — §35.3). Planuj Akwedukt i budynki zdrowotne zanim miasto „pęknie” demograficznie.

### 33.2. Bufor wzrostu — kiedy przybywa kolejny mieszkaniec

Wzrost nie jest automatyczny co turę. Miasto zbiera **bufor wzrostu** — żywność składana na próg kolejnego mieszkańca:

- **Pasek postępu** w panelu pokazuje, ile zebrano i jaki jest **próg** następnego awansu.
- **Próg** rośnie z populacją: im więcej masz ludzi, tym więcej żywności potrzeba na kolejnego (wzór w apendyksie C.1 poradnika).
- **Skąd wpływa żywność:** z pól okolicy **oraz** z części suwaka **Rozwój miast** (§38.3) — to on decyduje, jaki udział netto żywności miasta idzie w bufor, a jaki na wojsko państwa.
- Gdy **bufor ≥ próg** i nie ma blokady (brak Akweduktu przy limicie, obleżenie itd.) → **+1 mieszkaniec**.

**Wskazówka:** Patrz na zakładkę **Plony** — jeśli miasto produkuje mało żywności, bufor stoi w miejscu mimo „wolnego” suwaka.

### 33.3. Po awansie ludności — bufor i Spichlerz

Gdy bufor się zapełni i przybędzie mieszkaniec, część zebranego bufora jest **zużyta**. Reszta zależy od tego, czy masz **Spichlerz** w imperium:

| Sytuacja | Co dzieje się z buforem po +1 mieszkańcu |
|----------|------------------------------------------|
| **Bez Spichlerza** | Bufor **spada do zera** — kolejny próg zaczynasz od początku |
| **Ze Spichlerzem** (≥1 w państwie) | Zostaje **50%** bufora — szybszy kolejny wzrost |

**Przykład:** Zebrano 18 na przejście z 1→2 mieszkańców. Po awansie **bez** Spichlerza bufor = 0 (do 2→3 trzeba znów pełne 26). **Ze** Spichlerzem bufor = 9 (50% z 18) — do progu 26 brakuje 17, nie 26.

Szczegóły Spichlerza: §39 · Wiki: [`spichlerz.md`](../encyklopedia/pojecia/spichlerz.md).

### 33.4. Bonus Osiedle (małe miasto)

Miasta z **1–4** mieszkańcami korzystają z bonusu **Osiedle** — efekt „małej osady”:

- **Szczęście** — dodatkowy plus malejący wraz z populacją (największy przy 1 mieszkańcu).
- **Zdrowie** — podobny, łagodniejszy bonus.
- **Prawo** — niewielki bonus stabilności administracyjnej.

Bonus **znika**, gdy miasto urośnie powyżej progu małego miasta (zwykle po piątym mieszkańcu). Wtedy pojawia się kara **zagęszczenia** — planuj infrastrukturę wcześniej.

**Wskazówka:** Pierwsze miasto na łatwej trudności dostaje też krótki bonus startowy stolicy — wykorzystaj go na szybką świątynię lub teatr, zanim populacja urośnie.

### 33.5. Migracja przy buncie

Przy **niskim porządku** (§36) część ludzi może **odejść** do innego twojego miasta:

- Szacunkowo **ok. 5% szansy na turę** przy stanie buntu (na trudnej — wyższe ryzyko).
- Inne miasto może **przyjąć** +1 mieszkańca.
- **Nie tracisz miasta** — ale tracisz ludzi i tempo produkcji.

**Wskazówka:** Po podboju trzymaj garnizon i obniż podatki, zanim migracja wyczyści populację nowego miasta.


### Przykład liczbowy

Miasto ma **3** mieszkańców (N=3). Próg kolejnego awansu: Próg(N) = 10 + N × 8 → **10 + 3×8 = 34** 🍞 w buforze.
Produkcja netto **12** 🍞/t, suwak rozwój miast **70%** → **+8,4** 🍞/t do bufora (zaokr. **+8**).
Bez Spichlerza po awansie bufor **→ 0**; ze Spichlerzem zostaje **50%** z zebranego (np. z 34 → **17** 🍞).

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

### 33.6. Pełny scenariusz bufora (próg 34)

Miasto ma **3** mieszkańców — kolejny awans wymaga **Próg(3) = 10 + 3×8 = 34** 🍞 w buforze.

| Tura | Produkcja netto | Suwak 70% rozwój | Bufor przed | Bufor po | Zdarzenie |
|------|-----------------|------------------|-------------|----------|-----------|
| 1 | 12 🍞 | +8 | 0 | 8 | — |
| 2 | 12 🍞 | +8 | 8 | 16 | — |
| 3 | 12 🍞 | +8 | 16 | 24 | — |
| 4 | 12 🍞 | +8 | 24 | 32 | — |
| 5 | 12 🍞 | +8 | 32 | **40** | **+1 mieszkaniec** (bufor ≥34) |

**Bez Spichlerza:** po awansie bufor **→ 0**; następny próg dla N=4: **10+4×8 = 42** 🍞 od zera.

**Ze Spichlerzem:** z **40** zostaje **50% = 20** 🍞 — do progu **42** brakuje **22**, nie **42**.


---

## 34. Zdrowie

### 34.1. Co to jest zdrowie miasta

**Zdrowie** to osobna liczba punktów w lewej kolumnie — nie myl z szczęściem. Sekcja pokazuje sumę i rozpiskę **+ / −**:

**Typowe plusy:**

- **Rzeka** przy mieście — świeża woda.
- **Studnia, Akwedukt** — infrastruktura wodna (Akwedukt też odblokowuje wzrost powyżej 6 osób).
- **Targowisko** — dostęp do świeżej żywności.
- **Ceramika / garncarnia** — higiena przechowywania.
- **Bonus Osiedle** — małe miasto (§33.4).
- Budynki z kategorii zdrowia (np. lazaret — według dostępnych technologii).

**Typowe minusy:**

- **Zagęszczenie** — za dużo ludzi względem progu (podobna logika jak przy szczęściu, osobny próg).
- **Bagno lub dżungla** w okolicy — choroby, wilgoć.
- **Zanieczyszczenie** — późne epoki, gdy działają budynki przemysłowe.
- **Brak wody** — brak rzeki, studni i akweduktu naraz.

### 34.2. Wpływ zdrowia na miasto

- **Wzrost ludności** — słabe zdrowie spowalnia lub **zatrzymuje** wzrost (stagnacja przy bardzo niskim zdrowiu; skrajnie — utrata ludzi co kilka tur).
- **Szczęście** — pośrednio: chore, przepełnione miasto łatwiej wpada w kary zagęszczenia.

**Co robić graczowi:**

1. Wcześnie postaw **studnię** lub planuj miasto nad rzeką.
2. **Akwedukt** przed szóstym mieszkańcem, jeśli chcesz dalszy wzrost.
3. Nie ignoruj bagien w promieniu — czasem lepiej przesunąć osadę lub ulepszyć pola zamiast „dusić” populację.
4. Przy wojnie zdrowie też spada — stabilizuj porządek, żeby nie nakładały się kary.


### Przykład liczbowy

Miasto **pop 5**, rzeka **+2**, studnia **+2**, bonus osiedle **+1** → baza **+5**.
Kara zagęszczenia: próg **4**, powyżej **−1** pkt × (5−4) = **−1** → **Zdrowie = 4**.
Modyfikator wzrostu: **1 + 4×0,05 = ×1,20** (normal) — bufor rośnie o **20%** szybciej.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 35. Szczęście (zadowolenie)

### 35.1. Procent szczęścia — jak czytać liczbę

Główna liczba u góry sekcji to **procent szczęścia** (0–120%, cap „super-zadowolenia”). Gra **nie** liczy osobno zadowolonych głów — najpierw sumuje plusy i minusy, porównuje z **maksimum możliwym w tej epoce miasta**, i pokazuje wynik jako procent.

- **Epoka Kamień** — niższe maksimum możliwych punktów niż w epoce Brązu czy Żelaza.
- **Powyżej 100%** — możliwe przy wielu bonusach; daje efekt euforii w powiązaniu z wysokim porządkiem.

Pełna mechanika: [`szczescie.md`](../encyklopedia/pojecia/szczescie.md).

### 35.2. Rozpiska czynników — co podnosi szczęście (+)

| Czynnik | Jak działa (normal) |
|---------|---------------------|
| **Świątynia** | +1 punkt, jeśli budynek stoi w mieście |
| **Amfiteatr / teatr / rozrywka** | +1 punkt (teatr daje więcej — według danych budynku) |
| **Zamożność / luksus na mieszkańca** | +1 punkt na co **5 jednostek** luksusu w puli miasta |
| **Niskie podatki** (duży udział zamożności w handlu) | **+1 do +5 pkt** przy udziale zamożności ≥30/40/50/60/70% — patrz [`suwak-handlu.md`](../encyklopedia/pojecia/suwak-handlu.md) |
| **Ustrój polityczny** | +1 pkt, gdy mechanika ustroju aktywna (w v1.0 często 0) |
| **Nasza religia dominuje** | +2 pkt przy ≥50% wyznawców twojej wiary |
| **Nasza kultura dominuje** | +1 pkt przy ≥80% własnej kultury w mieście |
| **Bonus małego miasta (Osiedle)** | +1 do +3 pkt malejąco przy populacji 1–4 |
| **Inne budynki** | Suma bonusów z kolumny „zadowolenie” w danych budynków (np. łaźnia, ogrody) |

**Wskazówka:** Najtańszy szybki boost — przesuń suwak handlu na **zamożność** (§38.1). Najtrwalszy — świątynia + teatr + utrzymywana własna kultura.

### 35.3. Rozpiska czynników — co obniża szczęście (−)

| Czynnik | Jak działa (normal) |
|---------|---------------------|
| **Zagęszczenie** | −1 pkt × (ludność − próg); próg zwykle **4** — piąty mieszkaniec zaczyna karę |
| **Wojna** | −3 pkt, gdy państwo jest w stanie wojny (zmęczenie wojenne) |
| **Obca kultura dominuje** | −1 pkt przy **<50%** własnej kultury |
| **Obra religia dominuje** | −2 pkt |
| **Wysokie podatki** | −1 pkt × poziom powyżej bazy — gdy mało zamożności w suwaku handlu (dużo złota/nauki, mało luksusu) |

**Wskazówka:** Po podboju licz się z **obcą kulturą i religią** naraz — to −3 pkt łącznie, zanim w ogóle pomyślisz o podatkach.

### 35.4. Gdzie widać szczęście

- **Tylko** w panelu miasta, zakładka **Miasto**.
- **Nie** na górnym paseku zasobów mapy — tam jest m.in. złoto i suma kultury imperium, ale nie szczęście per miasto.
- Tooltip `(?)` przy sekcji → Wiki‑S.

### 35.5. Progi szczęścia a efekty

Sam procent szczęścia **nie kończy** gry — bezpośrednie kary ekonomiczne wynikają z **porządku** (§36), który łączy szczęście z prawem. Niemniej niskie szczęście **ciągnie porządek w dół**:

| Szczęście (orientacyjnie) | Co to znaczy dla gracza |
|---------------------------|-------------------------|
| **100–120%** | Euforia — bonusy produkcji i handlu przy **wysokim porządku** |
| **80–99%** | Spokój — normalna gra, brak kar |
| **60–79%** | Lekki niepokój — wolniejsza praca (−5%) przy niskim porządku |
| **40–59%** | Niepokój — wyraźne kary ekonomiczne, wolniejszy wzrost |
| **20–39%** | Bunt — kary + ryzyko migracji |
| **0–19%** | Skrajny bunt — alert krytyczny, rebelia AI po 2 turach bez poprawy (§36.6) |

**Nie myl:** wysokie szczęście przy **zerowym prawie** (brak wojska w wielkim mieście) nadal może dać niski porządek.


### Przykład liczbowy

Świątynia **+1**, teatr **+1**, zamożność w handlu **40%** → bonus niskich podatków **+2**.
Wojna **−3**, zagęszczenie (pop 6, próg 4) **−2** → netto **−1** pkt bazowych.
Przy maksimum epoki **10** pkt → **Szczęście ≈ 90%** (euforia dopiero z dodatkowymi bonusami).

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Ignorowanie **wojny −3** przy planowaniu podboju seryjnego.
- **Samo** obniżanie podatków bez wojska w mieście **pop ≥6**.
- Mylenie **szczęścia** z **porządkiem** — to dwie liczby.

---

## 36. Porządek, prawo i bunt

### 36.1. Porządek — osobna liczba obok szczęścia

**Porządek** to procent w lewej kolumnie, **pod** szczęściem. Składa się z dwóch składników:

```
Porządek ≈ waga × Szczęście% + waga × Prawo%
```

Domyślnie wagi są **po równo (50/50)**; na łatwej grze szczęście waży nieco więcej, na trudnej — prawo.

**Prawo** ma własną rozpiskę plusów i minusów:

| Plusy prawa | Minusy prawa |
|-------------|--------------|
| **Ratusz** (+3 pkt) | Brak garnizonu przy dużej populacji (≥6) |
| **Pretorium** (+2) | Obce wojsko tuż po podboju (krótkotrwałe) |
| **Sąd** (+2) | |
| **Garnizon** — **+20 pkt na jednostkę**, max 5 jednostek → prawo 100% | |
| Bonus Osiedle (małe miasto) | |

Wiki: [`porzadek.md`](../encyklopedia/pojecia/porzadek.md) · [`bunt.md`](../encyklopedia/pojecia/bunt.md).

**Wskazówka:** Wojsko w mieście **nie** daje wielkiego bonusu do szczęścia — podnosi **prawo**. To narzędzie na bunt, nie na „ludzie kochają żołnierzy”.

### 36.2. Progi niepokoju (niski porządek)

Efekty gameplay zależą od **procentu porządku**, nie od osobnych liczników ludzi:

| Porządek | Stan | Efekty (orientacyjnie) |
|----------|------|------------------------|
| **≥90%** | Ład | Bonus pracy i handlu (+10%) |
| **70–89%** | Spokój | Brak kar |
| **50–69%** | Napięcie | Praca −5% |
| **30–49%** | Niepokój | Praca, złoto, nauka, kultura ~−15%; wzrost −25%; możliwy chip buntu |
| **10–29%** | Bunt | Kary jak wyżej + **migracja ~5%/turę** |
| **0–9%** | Bunt skrajny | Maksymalne kary + migracja ~8%/turę + **grace 2 tury** → rebelia AI |

Przy **poprawie** porządku kary **zdejmują się od razu** — nie musisz czekać dodatkowej tury.

### 36.3. Bunt — czego nie robisz

**W wersji 1.0 nie tracisz miasta przez zwykły bunt.** Miasto zostaje twoje — cierpią produkcja, ludność i tempo wzrostu. Dopiero **skrajny** bunt długo utrzymywany może prowadzić do rebelii AI (§36.6) — i nawet wtedy miasto da się **odbijać** wojskiem.

### 36.4. Bunt — kary ekonomiczne

W stanie niepokoju miasto produkuje mniej:

- **Praca** — mniej postępu budowy i ulepszeń pól.
- **Złoto, nauka, kultura** — obniżone mnożniki z tego miasta.
- **Wzrost ludności** — wolniejszy bufor.
- **Migracja** — utrata mieszkańców (§33.5).

Kary trwają, dopóki **porządek** nie wróci powyżej progu niepokoju. Jedna tura z wysokim porządkiem kończy karę — nie ma „pamięci buntu” przez pięć tur.

### 36.5. Ostrzeżenia dla gracza

1. Chip **buntu** w dolnym pasku wydarzeń.
2. **Ikona ognia** na heksie miasta.
3. Komunikat w sekcji porządku (pomarańczowy / czerwony).
4. **Alert krytyczny** na mapie strategicznej — gdy porządek w strefie **0–9%** przez **2 tury** bez poprawy (grace). Gra ostrzega, zanim wydarzy się rebelia AI.

**Wskazówka:** Grace **resetuje się**, gdy porządek wróci choćby do ok. 10% — masz czas na reakcję po pierwszym alertcie.

### 36.6. Rebelia AI (skrajny bunt)

Gdy porządek utrzymuje się **poniżej ok. 10%** przez **2 tury** z rzędu (po okresie ostrzeżenia):

- Miasto może stać się **rebelią AI** — szary kolor, wroga administracja produkcji i obrony.
- **Możesz odbić** miasto własnym wojskiem — to nie jest automatyczna utrata na zawsze.

**Dźwignie stabilizacji (działają od razu):**

| Chcesz podnieść… | Zrób… |
|------------------|-------|
| **Szczęście** | Więcej **zamożności** w suwaku handlu; teatr; wojna kończy się; własna kultura/religia |
| **Prawo** | **Wojsko w mieście** (do 5 jednostek); ratusz; pretorium |
| **Oba naraz** | Obniż podatki **i** zostaw garnizon — klasyczna para po podboju |

### 36.7. Porządek a przycisk Wykonaj

Aktywny **bunt** może **blokować zakończenie tury** — gra wymusi wejście w panel miasta z problemem. Użyj **Wykonaj**, przejdź do miasta z alertem, popraw suwaki lub postaw garnizon, potem dokończ turę.


### Przykład liczbowy

Szczęście **70%**, garnizon **2** jednostki → Prawo **40** pkt (**+20** × 2, max 5 jedn.).
Porządek ≈ 0,5 × Szczęście% + 0,5 × Prawo% → **0,5×70 + 0,5×40 = 55%** porządku → stan **Niepokój** (praca **×0,85**).
Jedna jednostka więcej (+20 prawa) → **65%** → wychodzisz z kar produkcji.

### Strategia gracza

Łącz **niskie podatki** (więcej zamożności) z **garnizonem 2–3** w dużych miastach po podboju.
Reaguj na chip buntu w **tej samej turze** — grace to tylko **2** tury.

### Typowe błędy

- Ignorowanie **wojny −3** przy planowaniu podboju seryjnego.
- **Samo** obniżanie podatków bez wojska w mieście **pop ≥6**.
- Mylenie **szczęścia** z **porządkiem** — to dwie liczby.

---

## 37. Bogactwo (luksus państwa)

### 37.1. Bogactwo ≠ złoto

To najczęstsze nieporozumienie w pierwszych grach:

| Na ekranie | Co to jest |
|------------|------------|
| **Złoto** (górny pasek mapy) | Skarbiec imperium — gotówka na wojsko, zakupy, utrzymanie |
| **Bogactwo (poziom W)** | Zamożność **warstwy społecznej** miasta — luksus odkładany w pulę, poziomy, mnożnik dochodu |

Złoto wydajesz **od razu**. Bogactwo rośnie **wolniej**, ale daje **mnożnik** na strumień podatkowy do skarbca i wpływa na szczęście.

Wiki: [`bogactwo.md`](../encyklopedia/pojecia/bogactwo.md).

### 37.2. Panel bogactwa w mieście

W prawej kolumnie sekcja zamożności pokazuje:

- **Poziom W** (np. W3) — im wyżej, tym silniejszy mnożnik podatku **z tego miasta**.
- **Pulę luksusu** — ile „zostawiłeś ludziom” z handlu (suwak zamożności).
- **Próg następnego poziomu** — ile jeszcze trzeba uzbierać w puli.
- **Mnożnik do skarbca** — np. ×1,30 przy W3 (orientacyjnie; zależy od epoki i trudności).
- **Wpływ na szczęście** — luksus na mieszkańca i progi niskich podatków (§35.2).

**Trade-off:** wysokie W = wyższy dochód **później**, ale **krótkoterminowo** mniej złota i nauki w skarbcu, bo oddajesz je społeczeństwu.

### 37.3. Suwak społeczeństwa / luksus (powiązanie z §38.1)

Suwak **Handel** → udział **zamożności** karmi pulę W. Więcej zamożności:

- **Podnosi** bogactwo i często szczęście (niskie podatki).
- **Obniża** bieżący wpływ złota i nauki z tego miasta.

Mniej zamożności (domyślnie ok. 10%):

- **Więcej** złota i nauki teraz.
- **Ryzyko** kar wysokich podatków i niższego szczęścia.

### 37.4. Trudność a bogactwo

- **Łatwa** — dłuższy **immunitet** przed spadkiem poziomu W po założeniu miasta; łagodniejsze utrzymanie puli.
- **Trudna** — szybsze wymagania utrzymania, możliwa kara za „biedę” (W=0); wyższe progi buntu u AI przeciwnika.

### 37.5. Bogactwo na pasku zasobów mapy

Górny pasek pokazuje **skrót imperium**: suma poziomów / przyrost bogactwa — to agregat miast, nie zastępuje panelu per miasto. Szczegóły zawsze w **Miasto** danego miasta.


### Przykład liczbowy

Epoka **3**, cap W = **30**. Suwak zamożności **30%** z handlu **10**/turę → **3** luksusu/t do puli W.
Próg W2→W3: **4,5 × 3 × 3 = 40,5** → po **14 turach** awans (przy stałym strumieniu).
Mnożnik podatku W3: **1 + (3−1)×0,15 = ×1,30** na strumień złota z miasta.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 38. Suwaki podziału — handel, praca, żywność

### 38.1. Suwak Handel (podatki / handel netto)

Trzy kierunki — **suma zawsze 100%**, kroki co 10%:

| Kierunek | Domyślnie | Rola |
|----------|-----------|------|
| **Złoto (skarbiec)** | **70%** | Gotówka imperium z handlu miasta |
| **Nauka** | **20%** | Punkty badań z tego miasta |
| **Zamożność (bogactwo)** | **10%** | Pula luksusu → poziom W → mnożnik i szczęście |

**Wpływ na szczęście:** duży udział zamożności = bonus niskich podatków (§35.2); mały = kara wysokich podatków.

**Ustawienie osobno dla każdego miasta** — stolica może płacić więcej zamożności, kolonia więcej złota.

Wiki: [`suwak-handlu.md`](../encyklopedia/pojecia/suwak-handlu.md).

**Wskazówka:** Miasto naukowe: 50–60% nauki tylko jeśli utrzymujesz szczęście innymi bonusami. Inaczej wpadniesz w niepokój.

### 38.2. Suwak Praca (podział pracy miasta)

| Kierunek | Domyślnie | Rola |
|----------|-----------|------|
| **Budynki w mieście** | **70%** | Postęp w kolejce produkcji (świątynia, koszary, Spichlerz…) |
| **Ulepszenia pól w okolicy** | **30%** | Postęp ulepszeń pól (farma, kopalnia…) |

**Kiedy więcej na teren:** brakuje żywności lub surowców z pól; szybkie ulepszenie kluczowego heksu.

**Kiedy więcej na budynki:** budujesz Spichlerz, mury, teatr; miasto ma dobre pola, brakuje infrastruktury.

Wiki: [`suwak-pracy.md`](../encyklopedia/pojecia/suwak-pracy.md).

### 38.3. Suwak Żywność (podział żywności imperium z miasta)

Globalny dla państwa (jeden suwak, dotyczy wszystkich miast):

| Kierunek | Domyślnie | Rola |
|----------|-----------|------|
| **Rozwój miast** | **70%** | Żywność netto miasta → **bufor wzrostu** |
| **Zapas wojska** | **30%** | Żywność → **wojsko państwa** |

**Bez Spichlerza:** część wojskowa karmi armię **tylko w tej turze** — nadwyżka **przepada**. Po awansie ludności bufor też zeruje się (§33.3).

**Ze Spichlerzem:** nadwyżka wojskowa **gromadzi się** w zapasach państwa na górnym pasku mapy (format np. 142/200 — limit §39). Bufor po wzroście zostaje w 50%.

Wiki: [`suwak-zywnosci.md`](../encyklopedia/pojecia/suwak-zywnosci.md).

**Wskazówka:** Przed masową rekrutacją przesuń na chwilę na **wojsko** (50–60%), ale pamiętaj o wzroście miast.

### 38.4. Auto-zarządca (ikona koła zębatego)

Przełącznik **per miasto** — włącz/wyłącz obok suwaków.

**Co robi (v1.0):**

- Przypisuje **najlepsze pola** w okolicy do pracy (wg plonów).
- Dzieli **pracę** między budynki a teren (domyślne proporcje).
- Sugeruje **kolejny budynek** wg priorytetu: żywność → produkcja → nauka → pieniądz → wojsko → obrona → kultura → zdrowie.

**Czego nie robi:** nie zmienia automatycznie suwaków handlu przy buncie (v1.0); **nie** buduje cudów; **nie** rekrutuje jednostek za złoto.

Domyślne wartości nowego miasta: handel 70/20/10, praca 70/30, żywność imperium 70/30.

### 38.5. Strategie gracza — przykłady

| Typ miasta | Handel | Praca | Żywność | Inne |
|------------|--------|-------|---------|------|
| **Graniczne** | 60/20/20 (więcej zamożności) | 60/40 (mury, koszary) | 60/40 (wojsko) | Garnizon 2–3 jednostki |
| **Naukowe** | 50/40/10 | 80/20 (kampus) | 70/30 | Teatr na szczęście |
| **Rolnicze** | 70/20/10 | 40/60 (ulepszenia pól) | 80/20 (wzrost) | Spichlerz priorytet |
| **Po podboju** | 50/20/30 | 70/30 | 70/30 | Wojsko + niskie podatki 2–5 tur |


### Przykład liczbowy

Handel netto miasta **20**/turę, ustawienie **70% złoto · 20% nauka · 10% zamożność**:
**14** ¤ · **4** badań · **2** luksusu (zamożność).
Praca miasta **30**/turę, **70% budynki · 30% teren** → **21** na budynki · **9** na farmę.
Żywność netto **15**/turę, **70% rozwój miast · 30% wojsko** → **10,5** bufor · **4,5** wojsko (ze Spichlerzem kumuluje zapas).

### Strategia gracza

Postaw **pierwszy Spichlerz** przed masową rekrutacją — jeden budynek w imperium włącza **50%** bufora i magazyn **100** 🍞.

### Typowe błędy

- Rekrutacja **10** jednostek **bez** Spichlerza i bez zapasu — głód **−8%** HP/t.
- Myślenie, że Spichlerz musi być **w tym samym** mieście co armia (efekt **globalny**).

### 38.6. Trzy suwaki — tabele obliczeń (normal)

**Handel netto = 24/t** (przykład miasta handlowego):

| Złoto 70% | Nauka 20% | Zamożność 10% |
|-----------|-----------|---------------|
| **16,8 → 16** ¤ | **4,8 → 4** badań | **2,4 → 2** luksusu |

Przesunięcie na **50/30/20** przy tym samym handlu **24**: **12** ¤ · **7** badań · **5** luksusu (+bonus szczęścia od **≥30%** zamożności).

**Praca netto = 20/t**:

| Budynki 70% | Teren 30% |
|-------------|-----------|
| **14** pracy/t (kolejka Spichlerz **20** → **2** tury) | **6** pracy/t (farma **20** → **4** tury) |

**Żywność netto = 18/t** (suwak globalny imperium):

| Rozwój miast 70% | Wojsko 30% |
|------------------|------------|
| **12,6 → 12** 🍞 bufor | **5,4 → 5** 🍞 wojsko |

Ze **Spichlerzem:** **5** 🍞/t ląduje w zapasach państwa (limit **100** × liczba Spichlerzy). Bez — **5** 🍞 znika co turę.


---

## 39. Spichlerz — wpływ na miasto

### 39.1. Czym jest Spichlerz (z perspektywy miasta)

**Spichlerz** to budynek w **kolejce produkcji** (zakładka Produkcja). W grze zawsze nazywa się **Spichlerz** — nie „magazyn żywności”.

Pełny opis budynku: [`docs/encyklopedia/budynki/spichlerz.md`](../encyklopedia/budynki/spichlerz.md)  
Mechanika społeczna: [`spichlerz.md`](../encyklopedia/pojecia/spichlerz.md).

### 39.2. Gra bez Spichlerza w imperium

- Bufor wzrostu **zeruje się** po każdym +1 mieszkańcu.
- Nadwyżka żywności na wojsko z suwaka **przepada co turę** — nie ma zapasów państwa.
- **Rekrutacja wojska nigdy nie jest blokowana** brakiem Spichlerza.

### 39.3. Gra ze Spichlerzem (≥1 w imperium)

Wystarczy **jeden Spichlerz gdziekolwiek** w państwie — efekt dotyczy **całego imperium**:

1. **Po awansie ludności** zostaje **50%** bufora wzrostu.
2. **Nadwyżka wojskowa** gromadzi się w **zapasach państwa** na górnym pasku mapy.
3. **Limit zapasów:** **100 żywności × liczba Spichlerzy** (2 Spichlerze → max 200). Nadwyżka **przepada**.
4. **Wyświetlanie zapasów:** tylko na **pasku mapy** (np. 142/200), nie w panelu miasta (decyzja SP4).

### 39.4. Kiedy budować Spichlerz — decyzja gracza

| Strategia | Kiedy | Efekt |
|-----------|-------|-------|
| **Wcześnie** (2.–3. duże miasto) | Planujesz armię i szybki wzrost | Stabilny bufor, zapas na wojny |
| **Późno** | Agresywna ekspansja, mało budynków | Szybszy start, ryzyko głodu wojska i zerowania bufora |
| **Stolica first** | Jedno silne centrum | SP3=A — wystarczy jeden Spichlerz w imperium |

### 39.5. Spichlerz a suwak żywności (§38.3)

Ten sam suwak 70/30 — **inny skutek** z/bez Spichlerza:

**Przykład:** Miasto produkuje **20 żywności/turę**, suwak 70/30.

| | Bez Spichlerza | Ze Spichlerzem |
|---|----------------|----------------|
| Do bufora | +14/t | +14/t |
| Na wojsko | +6/t (zjedzone w turze) | +6/t → **dodane do zapasów** (do limitu) |
| Po +1 mieszkańcu | Bufor → 0 | Bufor → 50% zebranego |


### Przykład liczbowy

**1** Spichlerz → limit zapasów państwa **100** 🍞 (normal). Wojsko **8** jednostek × **1** 🍞 = **8**/turę.
Nadwyżka suwaka **+6**/turę przez **10** tur → magazyn **60/100**.
Po awansie ludności bufor **34** 🍞 → ze Spichlerzem zostaje **50%** = **17** 🍞 (próg następny nadal **34** przy N=3).

### Strategia gracza

Postaw **pierwszy Spichlerz** przed masową rekrutacją — jeden budynek w imperium włącza **50%** bufora i magazyn **100** 🍞.

### Typowe błędy

- Rekrutacja **10** jednostek **bez** Spichlerza i bez zapasu — głód **−8%** HP/t.
- Myślenie, że Spichlerz musi być **w tym samym** mieście co armia (efekt **globalny**).

### 39.6. Scenariusz SP — pełna ścieżka (decyzja B5)

**Start:** imperium **bez** Spichlerza, miasto **pop 2**, bufor **0**, próg **10+2×8 = 26**.

1. **Tury 1–3:** +**9** 🍞/t do bufora (70% z 13 netto) → bufor **27** → awans **pop 3**, bufor **→ 0**.
2. **Tury 4–7:** znowu zbierasz do **34** (próg N=3) — **4** tury po **8** 🍞.
3. **Budowa Spichlerza** w turze 8 (koszt **20** pracy ≈ **3** tury produkcji).
4. **Tura 12:** awans **pop 4** przy zebranych **36** 🍞 — **ze Spichlerzem** bufor = **18** 🍞 (50%).
5. **Suwak wojska 40%** + **2** Spichlerze → limit zapasów **200** 🍞; armia **10** 🍞/t; nadwyżka **+6**/t → pełny magazyn za **~25** tur.

**SP1–SP6 w skrócie:** jeden Spichlerz w imperium wystarczy; termin UI zawsze **Spichlerz**; rekrutacja **nigdy** nie blokowana brakiem magazynu.


---

## 40. Kultura i religia w mieście

### 40.1. Sekcja kultury w panelu

W prawej kolumnie blok **kultura i religia** pokazuje:

- **Sumę kultury** miasta (punkty).
- **Przyrost + na turę** — z budynków, cudów, bonusów cywilizacji.
- **Progi granic kultury** — presja na sąsiednie heksy (im więcej kultury, tym szybciej „barwy” twojego państwa na mapie).

### 40.2. Dominacja kultury w mieście

- **Procent własnej kultury** vs obcej.
- **≥80% własnej** — bonus +1 do szczęścia (§35.2).
- **<50% własnej** (obca dominuje) — kara −1 do szczęścia.

**Wskazówka:** Po podboju buduj **monument, amfiteatr, świątynię** — kultura i religia wspierają szczęście równolegle.

### 40.3. Religia w tym samym bloku

- **Dominująca religia** i procent wyznawców.
- **Twoja religia ≥50%** — bonus +2 szczęścia.
- **Obca religia dominuje** — kara −2 szczęścia.

Świątynie **szerzą** wiarę — stawiaj je w nowych miastach, zanim obca religia z cementuje się przez kilka tur.

### 40.4. Relacja z warstwą na mapie

- **Minimapa i nakładki** — zasięg kultury i religii **całego imperium** (Część II §10, Część XV §86).
- **Panel miasta** — zawsze **to konkretne miasto**; sąsiad może mieć 90% twojej kultury, a podbite miasto 30%.

### 40.5. Kultura na pasku zasobów mapy

Górny pasek: **suma kultury imperium + przyrost/turę** — to agregat wszystkich miast. Nie ma osobnego zasobu „Idei” — tylko **kultura**.


### Przykład liczbowy

Podbite miasto: **30%** twojej kultury, obca religia dominuje **−2** szczęścia, obca kultura **−1**.
Świątynia **+2** kultury/t + bonus własnej religii **+2** szczęścia po przekroczeniu **50%** wyznawców.
Po **8 turach** konwersji **+1%/t** (baza) → **38%** kultury — kara spada, ale wciąż **−1**.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 41. Auto-zarządca miasta

### 41.1. Co robi auto-zarządca

Działa **osobno dla każdego miasta** (ikona koła zębatego w panelu):

1. **Okolica** — wybiera najlepsze heksy do pracy (populacja = liczba pól).
2. **Praca** — dzieli między budynki a ulepszenia terenu (jak suwak §38.2).
3. **Produkcja** — proponuje kolejny budynek wg listy priorytetów (żywność > produkcja > nauka > …).

Suwaki **handlu** i **żywności imperium** auto-zarządca w v1.0 **nie rusza** automatycznie przy buncie — to ty decydujesz ręcznie w kryzysie.

### 41.2. Kiedy włączyć

- **Wiele miast** — oszczędność mikro-zarządzania co turę.
- **Miasta w głębi państwa** bez specjalnej roli.
- **Wczesna gra** — nauka mechaniki okolicy i kolejki bez perfekcjonizmu.

### 41.3. Kiedy wyłączyć i sterować ręcznie

- **Stolica / miasto naukowe** — precyzyjny podział handlu i pracy.
- **Tuż przed buntem** — ręcznie obniż podatki (więcej zamożności) i postaw garnizon.
- **Okolica z rzadkimi zasobami** — ręcznie przypisz heks ze złotem / żelazem.
- **Przed masową rekrutacją** — chwilowo więcej żywności na wojsko (§38.3).
- **Budowa cudu** — auto-zarządca nie priorytetyzuje cudów; wyłącz i ustaw kolejkę sam.

### 41.4. Auto-zarządca a bunt i szczęście

W v1.0 auto-zarządca **nie reaguje** sam na niski porządek — nie obniży podatków ani nie wezwie wojska. Przy chipie buntu **wyłącz** go w tym mieście i przejmij suwaki ręcznie (§36.6).

### 41.5. Wiki — hasła powiązane

| Hasło | Ścieżka |
|-------|---------|
| Szczęście | `docs/encyklopedia/pojecia/szczescie.md` |
| Porządek | `docs/encyklopedia/pojecia/porzadek.md` |
| Bunt | `docs/encyklopedia/pojecia/bunt.md` |
| Bogactwo | `docs/encyklopedia/pojecia/bogactwo.md` |
| Suwak handlu | `docs/encyklopedia/pojecia/suwak-handlu.md` |
| Suwak pracy | `docs/encyklopedia/pojecia/suwak-pracy.md` |
| Suwak żywności | `docs/encyklopedia/pojecia/suwak-zywnosci.md` |
| Spichlerz | `docs/encyklopedia/pojecia/spichlerz.md` |


### Przykład liczbowy

Miasto **4** pola w okolicy: auto przypisuje heksy **8+6+5+4** 🍞 → łącznie **23** 🍞 brutto.
Praca **70/30** → **16** na kolejkę świątyni (koszt **25**) = **~2 tury** do ukończenia przy samym auto.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## Podsumowanie — pięć zasad stabilnego miasta

1. **Czytaj rozpiski**, nie tylko procenty — minus „wojna” lub „obca religia” mówi co naprawić.
2. **Porządek = szczęście + prawo** — same niskie podatki nie wystarczą bez garnizonu w dużym mieście.
3. **Spichlerz** to inwestycja imperium — jeden budynek zmienia bufor **i** zapasy wojska.
4. **Suwaki per miasto** — stolica inaczej niż kolonia; kopiuj ustawienia tylko świadomie.
5. **Alert buntu** — reaguj w tej samej turze: zamożność ↑, wojsko w mieście, ewentualnie wyłącz auto-zarządcę.


### Przykład liczbowy

Scenariusz na **Normalnym**: przyrost **+10**/turę z działalności opisanej w tej sekcji.
Po **5** turach akumulacja **50** jednostek zasobu — wystarcza na **1** kluczową decyzję (budowa, tech lub armia).
Wzory referencyjne: Próg(N) = 10 + N × 8; Porządek ≈ 0,5 × Szczęście% + 0,5 × Prawo%; suwaki 70% złoto · 20% nauka · 10% zamożność.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

*Ostatnia aktualizacja poradnika: 2026-07-03 · rev E — pogłębienie + przykłady liczbowe · Decyzje: B2 (szczęście, porządek), B4 (bogactwo), B5 (Spichlerz SP1–SP6), D-START-OSIEDLE*

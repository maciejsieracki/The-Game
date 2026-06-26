# „The Game" — Dyplomacja: szablon systemu (wersja robocza)

> **Zakres:** projekt systemu dyplomatycznego dla ~50 cywilizacji na mapie.
> **5 Głównych typów** (Grecy, Rzymianie, Chińczycy, Inkowie, Zulusi) = pełna dyplomacja.
> **Cywilizacje poboczne** (reszta ~45) = uproszczony zestaw akcji.
> Powiązanie z ekonomią: Pieniądz (×10 Pracy po Walucie) jest głównym środkiem płatniczym w dyplomacji.

---

## 0. Dziennik zmian

- **2026-06-20** — Zmiana nazwy cywilizacji: **Majowie → Inkowie** we wszystkich miejscach dokumentu (nagłówek, §4 tabela charakterystyk, §3.3 modyfikatory relacji).

---

## SPIS TREŚCI

1. Typy rozmów i akcji dyplomatycznych
2. Tabela dostępności akcji (Główni rywale vs. Poboczne)
3. Parametry relacji między cywilizacjami
4. Charakterystyki archetypu a dyplomacja
5. Uproszczona dyplomacja cywilizacji pobocznych

---

## 1. Typy rozmów i akcji dyplomatycznych

Każda akcja = inicjowana przez gracza (lub AI) w oknie dyplomatycznym. Cywilizacje poboczne mają dostęp tylko do oznaczonego podzbioru (patrz §2 i §5).

---

### 1.1 Nawiązanie kontaktu

| Pole | Opis |
|---|---|
| **Opis** | Pierwszy kontakt — otwiera okno dyplomatyczne z daną cywilizacją. Bez tego żadne dalsze akcje nie są możliwe. |
| **Warunek dostępności** | Jednostka gracza znalazła się na polu sąsiednim do jednostki lub miasta obcej cywilizacji (automatyczne) ALBO gracz kliknął „Wyślij posłańca" (koszt, patrz niżej). |
| **Efekt** | Odblokowanie wszystkich dostępnych akcji z tą cywilizacją; możliwe pierwsze wrażenie (+/− Relacja ogólna zależnie od siły militarnej i archetypu). |
| **Koszt** | Bezpłatny przy przypadkowym spotkaniu. Wyslanie posłańca: 5 Pieniędzy (lub 50 Pracy przed Walutą). |

---

### 1.2 Pakt o nieagresji (NAP)

| Pole | Opis |
|---|---|
| **Opis** | Obie strony zobowiązują się nie atakować siebie przez określoną liczbę tur. |
| **Warunek dostępności** | Kontakt nawiązany; Relacja ogólna ≥ −30. |
| **Efekt** | Flaga „NAP aktywny" na N tur (N = 10–20 tur, negocjowalne). Złamanie: −30 Relacja ogólna, −20 Zaufanie, kara reputacyjna u wszystkich znających obie strony. |
| **Koszt** | Brak bezpośredniego kosztu; wartość polityczna. |

---

### 1.3 Sojusz wojskowy

| Pole | Opis |
|---|---|
| **Opis** | Formalne przymierze militarne: atak na jedną stronę = atak na obie. |
| **Warunek dostępności** | Kontakt nawiązany; Zaufanie ≥ 40; Relacja ogólna ≥ 20; brak aktywnej wojny między stronami. |
| **Efekt** | Obie strony wchodzą do wojen partnera automatycznie (lub z opcją odmowy z karą −15 Zaufanie). Czas: bezterminowy do wypowiedzenia. Wypowiedzenie: −25 Relacja ogólna, −20 Zaufanie. |
| **Koszt** | Negocjacja może wymagać opłaty lub wymiany technologii jako „gwarantu". |

---

### 1.4 Otwarte granice / prawo przemarszu

| Pole | Opis |
|---|---|
| **Opis** | Zezwolenie na swobodny ruch jednostek cywilnych lub wojskowych przez terytorium drugiej strony. |
| **Warunek dostępności** | Kontakt nawiązany; Relacja ogólna ≥ −10. Wersja wojskowa wymaga Relacji ≥ 30. |
| **Efekt** | Jednostki mogą przemieszczać się przez obce terytorium bez kary. Czas: N tur (5–15) lub bezterminowo za opłatą co turę. Nieautoryzowany przemarsz: −15 Relacja ogólna / tura. |
| **Koszt** | Cywilne: 10–30 Pieniędzy (jednorazowo lub per tura). Wojskowe: 20–60 Pieniędzy + ew. wzajemność. |

---

### 1.5 Umowa handlowa (wymiana surowców / Pracy / Pieniądza)

| Pole | Opis |
|---|---|
| **Opis** | Regularny lub jednorazowy transfer surowców, Pracy lub Pieniędzy między cywilizacjami. Forma: wymiana X za Y co turę przez N tur, lub jednorazowa transakcja. |
| **Warunek dostępności** | Kontakt nawiązany; Relacja ogólna ≥ −20. Handel Pieniądzem wymaga Waluty u obu stron. |
| **Efekt** | Transfer zasobów zgodnie z umową. Aktywny handel: +2 Relacja ogólna / tura, +1 Zaufanie / tura. Zerwanie umowy: −15 Relacja ogólna, −10 Zaufanie. |
| **Koszt** | Określony w treści umowy (np. 10 Pieniędzy/tura za dostęp do rudy). |

---

### 1.6 Wymiana lub sprzedaż technologii

| Pole | Opis |
|---|---|
| **Opis** | Przekazanie własnego wynalazku drugiej stronie (sprzedaż lub wymiana za inną technologię / surowce / Pieniądze). |
| **Warunek dostępności** | Kontakt nawiązany; obie strony mają co najmniej 1 unikalną technologię; Zaufanie ≥ 20 (dla wymiany) lub Relacja ogólna ≥ 0 (dla sprzedaży). |
| **Efekt** | Kupujący natychmiast zyskuje technologię. Sprzedający traci przewagę, ale zysk finansowy lub reputacyjny. Wymiana bezpłatna = +5 Zaufanie. |
| **Koszt** | Sprzedaż: 50–300 Pieniędzy (zależnie od epoki i wartości technologii). Wymiana: inna technologia o zbliżonej wartości. |

---

### 1.7 Wspólny wróg / namowa do wojny

| Pole | Opis |
|---|---|
| **Opis** | Prośba do innej cywilizacji, by wypowiedziała wojnę wskazanemu wrogowi gracza (lub sojusznikowi przeciwnika). |
| **Warunek dostępności** | Kontakt nawiązany; wskazana cywilizacja docelowa jest znana obu stronom; Relacja ogólna ≥ 10 (lub wyższe łapówki kompensują deficyt). |
| **Efekt** | Jeśli akceptacja: wskazana cywilizacja wypowiada wojnę celowi; gracz zyskuje +10 Respekt, +5 Relacja ogólna z namówionym. Jeśli odmowa: bez skutku. Skuteczność AI zależy od Respektu/Strachu wobec celu i Relacji z gracze. |
| **Koszt** | 30–150 Pieniędzy (łapówka) lub zobowiązanie do własnego ataku / oddanie surowców. |

---

### 1.8 Żądanie / oferta trybutu

| Pole | Opis |
|---|---|
| **Opis** | Strona silniejsza żąda regularnych płatności (Pieniędzy / surowców) od słabszej. Można też odwrócić — zaoferować trybut, by uniknąć konfliktu. |
| **Warunek dostępności** | Kontakt nawiązany. Żądanie: Respekt/Strach gracza wobec adresata jest wyraźnie wyższy (różnica ≥ 20). Oferta: bezwarunkowo (gracz płaci). |
| **Efekt** | Akceptacja żądania: regularne płatności, +10 Respekt żądającego, −15 Relacja ogólna ze strony płacącego. Odmowa żądania: −10 Relacja ogólna, możliwy casus belli. Oferta akceptowana: płacący unika ataku, +5 Relacja ogólna. |
| **Koszt** | Żądanie: ≥ 10 Pieniędzy/tura lub surowce (negocjowalne). Oferta: dobrowolna kwota. |

---

### 1.9 Ultimatum / groźba

| Pole | Opis |
|---|---|
| **Opis** | Żądanie natychmiastowego spełnienia warunku (np. wycofanie wojsk, oddanie miasta, zaprzestanie ekspansji) pod groźbą wypowiedzenia wojny. |
| **Warunek dostępności** | Kontakt nawiązany; aktywny konflikt lub naruszenie granicy; Respekt/Strach gracza ≥ 50 (albo gracz jest gotowy na wojnę). |
| **Efekt** | Spełnienie ultimatum: warunek zrealizowany, −5 Relacja ogólna (utrata twarzy przez adresata). Odmowa: casus belli → gracz może wypowiedzieć wojnę bez kary reputacyjnej. Bezpodstawne ultimatum (niski Respekt): −20 Relacja ogólna, −10 Zaufanie, śmiech AI. |
| **Koszt** | Brak kosztu bezpośredniego, wysoki koszt reputacyjny przy nieuzasadnionym użyciu. |

---

### 1.10 Propozycja pokoju / zawieszenia broni

| Pole | Opis |
|---|---|
| **Opis** | Zakończenie aktywnej wojny pokojem lub tymczasowym rozejmem. Może zawierać warunki: oddanie miast, reparacje, przywrócenie granic. |
| **Warunek dostępności** | Aktywna wojna między stronami. |
| **Efekt** | Akceptacja: koniec walk na warunkach umowy. Pokój: +5 Relacja ogólna po czasie (rany goją się wolno). Rozejm: na N tur (5–15), po których można wznowić wojnę bez kary. Odrzucenie: brak skutku. |
| **Koszt** | Reparacje wojenne mogą być częścią umowy: 50–500 Pieniędzy lub cesja terytoriów. |

---

### 1.11 Wypowiedzenie wojny

| Pole | Opis |
|---|---|
| **Opis** | Formalna deklaracja stanu wojennego. Może być z casus belli (po ultimatum, złamaniu paktu, ataku) lub bez (agresja niesprowokowana). |
| **Warunek dostępności** | Kontakt nawiązany lub jednostki w zasięgu (można wypowiedzieć wojnę bez kontaktu = pełna agresja). |
| **Efekt** | Stan wojny: jednostki mogą atakować siebie nawzajem. Z casus belli: −10 Relacja ogólna u wszystkich; bez c.b.: −25 Relacja ogólna u wszystkich, −20 Zaufanie globalnie, flaga „agresor". |
| **Koszt** | Brak kosztu walutowego; koszt reputacyjny zależny od kontekstu. |

---

### 1.12 Wasalizacja / wchłonięcie

| Pole | Opis |
|---|---|
| **Opis** | Słabsza cywilizacja (AI lub poboczna) staje się wasalem: zachowuje terytorium, płaci trybut, jest chroniona przez suzerena. Wchłonięcie = całkowite przyłączenie miast do cywilizacji gracza. |
| **Warunek dostępności** | Wasalizacja: cel ma ≤ 30% punktów siły gracza LUB Respekt/Strach ≥ 70 LUB cel przegrywa wojnę. Wchłonięcie: cel ma tylko 1 miasto lub Respekt/Strach ≥ 90. |
| **Efekt** | Wasal: płaci X% dochodów/tur jako trybut; gracz chroni, ma prawo przemarszu; wasal nie może wchodzić w sojusze bez zgody. Wchłonięcie: miasta przechodzą do gracza, ludność niezadowolona przez N tur. |
| **Koszt** | Wasalizacja dobrowolna (wymagana oferta): 100–300 Pieniędzy gwarancji + zobowiązanie ochrony. Wchłonięcie: −30 Relacja ogólna u wszystkich sąsiadów, wzrost niezadowolenia w przejętych miastach. |

---

## 2. Tabela dostępności akcji

### Legenda
- **TAK** — pełna akcja dostępna
- **UPR** — uproszczona wersja (ograniczone warunki / bez negocjacji)
- **NIE** — niedostępne

| Akcja dyplomatyczna | Główni rywale (5 typów) | Cywilizacje poboczne |
|---|---|---|
| 1. Nawiązanie kontaktu | TAK | TAK |
| 2. Pakt o nieagresji | TAK | UPR (automatyczny, stały czas 10 tur) |
| 3. Sojusz wojskowy | TAK | NIE |
| 4. Otwarte granice / prawo przemarszu | TAK | UPR (tylko cywilne, bez negocjacji ceny) |
| 5. Umowa handlowa (surowce/Praca/Pieniądz) | TAK | UPR (jednorazowa transakcja, bez umów wieloturowych) |
| 6. Wymiana / sprzedaż technologii | TAK | NIE |
| 7. Wspólny wróg / namowa do wojny | TAK | NIE |
| 8. Żądanie / oferta trybutu | TAK | TAK |
| 9. Ultimatum / groźba | TAK | UPR (tylko oferta poddania się, bez negocjacji warunków) |
| 10. Propozycja pokoju / zawieszenia broni | TAK | TAK |
| 11. Wypowiedzenie wojny | TAK | TAK |
| 12. Wasalizacja / wchłonięcie | TAK | TAK |

### Uzasadnienie uproszczenia dla pobocznych

Cywilizacje poboczne (~45 z ~50 na mapie) to małe frakcje bez rozbudowanego AI i bez własnych długoterminowych celów strategicznych. Pełna dyplomacja z nimi:
- **Generowałaby nadmierny szum decyzyjny** — gracz miałby kilkadziesiąt aktywnych umów do zarządzania.
- **Nie ma sensu fabularnego** — małe plemiona nie zawierają sojuszy wojskowych ani nie wymieniają się technologiami.
- **Upraszcza implementację** — poboczne mają jeden parametr relacji (zamiast zestawu Zaufanie/Respekt/Strach) i reagują tylko na siłę i Pieniądze.

Poboczne są głównie **źródłem surowców, trybutu i terytoriów do wchłonięcia** — nie partnerami politycznymi.

---

## 3. Parametry relacji między cywilizacjami

### 3.1 Parametry główne (dla Głównych rywali)

| Parametr | Zakres | Opis |
|---|---|---|
| **Relacja ogólna** | 0 … 200 | **Suma Zaufania i Respektu** (Relacja = Zaufanie + Respekt). Wyznacza dźwignię negocjacyjną: duża moc + małe zaufanie → można wymusić ustępstwa (strach); duże zaufanie + mała moc → trudniej przeforsować twarde żądania. Poniżej 30: dyplomacja niemal niemożliwa; powyżej 120: sojusze osiągalne. |
| **Respekt / Strach** | 0 … 100 | **Czysta moc (hard power).** Zależy WYŁĄCZNIE od siły i wielkości armii, **liczby wygranych bitew**, i **punktów mocy cywilizacji (Power)** — zagregowanej siły (wojsko + miasta + gospodarka + epoka). Liczony WZGLĘDEM partnera (Twoja moc vs jego). Wysoki Respekt → AI chętniej przyjmuje żądania / daje trybut. Niski → AI ignoruje ultimata, prowokuje. |
| **Zaufanie** | 0 … 100 | **Relacja miękka / goodwill.** Zmienia się od działań (pakty, pomoc, handel, podarunki). Każde działanie ma znak +/− (czy jest na plus czy minus dla danej cywilizacji). Część zmian jednorazowa (za czynność), część systematyczna co turę (gdy stan trwa — utrzymywany pakt/handel). Darmowe podarunki i pozytywne działania podnoszą zaufanie z czasem. |

### 3.1.1 Dźwignia negocjacyjna

Relacja ogólna (Zaufanie + Respekt) określa siłę przetargową przy każdej akcji dyplomatycznej:

- **Dominuje Respekt (mała Relacja, ale wysoki Respekt):** można **wymusić** ustępstwa ze strachu — trybut, ultimatum, wasalizacja. AI ustępuje, ale nie ufa i może próbować zmiany układu sił.
- **Dominuje Zaufanie (mały Respekt, ale wysokie Zaufanie):** partnerstwo i dobra wola ułatwiają handel, sojusze, wymianę technologii. Trudno jednak wyegzekwować twarde żądania bez siły militarnej.
- **Oba wysokie:** pełna dźwignia — zarówno przyjaźń, jak i groźba są wiarygodne.
- **Oba niskie:** dyplomacja nieskuteczna; jedynym wyjściem jest brutalna siła lub długotrwała odbudowa relacji.

### 3.2 Parametry uproszczone (dla cywilizacji pobocznych)

| Parametr | Zakres | Opis |
|---|---|---|
| **Relacja ogólna** | 0 … 200 | Jedyny aktywny parametr — suma wszystkich interakcji (uproszczona). |
| **Respekt / Strach** | 0 … 100 | Odzwierciedla wyłącznie siłę militarną gracza wobec pobocznej. |

*(Poboczne nie mają oddzielnego Zaufania — każde złamanie umowy wpada bezpośrednio na Relację ogólną.)*

---

### 3.3 Modyfikatory parametrów relacji

Poniższe zdarzenia modyfikują **Zaufanie** (Z) lub **Respekt** (R) — a przez to automatycznie Relację ogólną (= Z + R). Każde działanie ma **znak +/−** i typ: **jednorazowo** (za zdarzenie) lub **co turę** (gdy stan trwa). Wartości są przykładowymi punktami startowymi — do kalibracji w testach.

| Zdarzenie / Działanie | Parametr | Zmiana | Znak | Typ | Uwagi |
|---|---|---|---|---|---|
| **Wspólna religia** | Zaufanie | +0.5 / tura (max +15) | + | co turę | Pasywny bonus gdy obie cywilizacje wyznają tę samą religię |
| **Odmienna religia** | Zaufanie | −0.5 / tura (max −10) | − | co turę | Pasywne tarcia w epoce religijnego fundamentalizmu |
| **Wspólny wróg (aktywna kooperacja)** | Zaufanie | +1 / tura | + | co turę | Przez cały czas trwania współpracy przeciw wspólnemu wrogowi |
| **Wspólny wróg — nawiązanie** | Zaufanie | +5 jednorazowo | + | jednorazowo | Bonus przy ustanowieniu wspólnego wroga |
| **Bliskość granic (ekspansja w kierunku gracza)** | Zaufanie | −2 / tura (max −20) | − | co turę | Gracz/AI zakłada miasto lub przesuwa wojska przy granicy |
| **Złamanie paktu / umowy przez gracza** | Zaufanie | −40 jednorazowo | − | jednorazowo | Informacja rozchodzi się do sąsiadów (−5 Relacja u każdego) |
| **Złamanie paktu / umowy przez AI** | Zaufanie | −20 jednorazowo | − | jednorazowo | Gracz traci Zaufanie do tej cywilizacji |
| **Aktywna umowa handlowa** | Zaufanie | +1 / tura | + | co turę | Trwa przez czas umowy; znika po jej wygaśnięciu |
| **Aktywna umowa handlowa** | Zaufanie | +2 jednorazowo | + | jednorazowo | Bonus przy zawarciu umowy |
| **Dotrzymany pakt (NAP lub sojusz trwa)** | Zaufanie | +1 / tura | + | co turę | Pasywny bonus za każdą turę aktywnego paktu |
| **Pomoc w wojnie sojusznikowi** | Zaufanie | +10 jednorazowo | + | jednorazowo | Bonus po zakończeniu wspólnej kampanii |
| **Rywalizacja tego samego typu (na starcie)** | Zaufanie | −20 startowy | − | jednorazowo | Grecy vs. Grecy, Inkowie vs. Inkowie — wbudowana wrogość "o przodownictwo" |
| **Duża różnica kulturowa (różny typ)** | Zaufanie | −5 startowy | − | jednorazowo | Bazowe tarcia między innymi archetypalnie cywilizacjami |
| **Urazy historyczne** | Zaufanie | −10 … −40 trwałe | − | co turę | Maleje powoli co 20 tur; nagromadzone zdarzenia (ataki, aneksje) |
| **Szpiegostwo wykryte przez przeciwnika** | Zaufanie | −15 jednorazowo | − | jednorazowo | Gdy szpieg gracza zostaje schwytany (epoka późna) |
| **Podarunek surowca / Pieniądza (gratis)** | Zaufanie | +6 jednorazowo | + | jednorazowo | Darmowy podarunek bez wymiany; zależy od wartości daru |
| **Podarunek surowca / Pieniądza (gratis)** | Zaufanie | +1 / tura przez kilka tur | + | co turę | Efekt dobrej woli utrzymuje się kilka tur po podarunku |
| **Znacząca przewaga militarna gracza** | Respekt | +15 jednorazowo | + | jednorazowo | Skok przy przekroczeniu progu siły (2× lub 5× wartość AI) |
| **Gracz słabszy militarnie od partnera** | Respekt | −10 jednorazowo | − | jednorazowo | Respekt spada; AI staje się asertywniejsze |
| **Wygrana bitwa** | Respekt | +5 jednorazowo | + | jednorazowo | Każda wygrana bitwa zwiększa punkty mocy bojowej |
| **Zdrada / atak z zaskoczenia (na gracza)** | Zaufanie | −50 jednorazowo | − | jednorazowo | Flaga 'agresor'; kara reputacyjna globalna |

---

## 4. Charakterystyki cywilizacji a dyplomacja

> **Rama do dopracowania per typ.** Poniżej: ogólne tendencje wpływające na AI każdego archetypu. Szczegółowe wartości parametrów startowych i progi decyzyjne zostaną ustalone w osobnym dokumencie per typ.

| Typ cywilizacji | Tendencja do wojny | Tendencja do handlu | Tendencja do lojalności | Charakterystyczny styl dyplomatyczny |
|---|---|---|---|---|
| **Grecy** | Średnia | Wysoka | Średnia | Preferują przymierza oparte na wspólnych interesach; skłonni do negocjacji, ale szybko przejdą na wrogie nastawienie gdy gracz zyska przewagę kulturową; cenią Zaufanie ponad Strach |
| **Rzymianie** | Wysoka | Średnia | Niska (warunkowo) | Agresywna ekspansja; chętnie oferują pokój z pozycji siły; lojalni wobec wasali, ale bezwzględni wobec rywali; wysoki próg Respektu potrzebny by zignorować ich ultimata |
| **Chińczycy** | Niska | Wysoka | Wysoka | Priorytet: handel i technologia; unikają wojen przy dobrej Relacji; oferują wymianę technologii jako pierwsi; długa pamięć urazów historycznych (trwałe korekty) |
| **Inkowie** | Średnia | Niska | Wysoka | Izolacjonizm: niechętni otwarciu granic i umowom handlowym; wierni sojuszom gdy już je zawrą; wysoki priorytet dla wspólnej religii; ofensywni gdy ich terytorium jest zagrożone |
| **Zulusi** | Bardzo wysoka | Niska | Średnia | Dyplomacja jako chwilowe zawieszenie broni; preferują siłę nad umowami; Respekt/Strach jest dominującym czynnikiem decyzyjnym; trybut akceptują i żądają chętnie; długie sojusze rzadkie |

> **Rywalizacja wewnątrztypowa** (start gry): każda cywilizacja własnego typu traktuje gracza jako głównego rywala (startowa korekta −20 Relacji ogólnej). Cel gracza w fazie wczesnej = wyeliminowanie lub zdominowanie wszystkich cywilizacji swojego archetypu przed otwarciem globalnej rywalizacji.

---

## 5. Uproszczona dyplomacja cywilizacji pobocznych

### 5.1 Czym różni się dyplomacja pobocznych

| Cecha | Główni rywale | Cywilizacje poboczne |
|---|---|---|
| Dostępnych akcji | 12 (pełny zestaw) | 7 (ograniczony zestaw: 1, 2-UPR, 4-UPR, 5-UPR, 8, 10, 11, 12) |
| Parametry relacji | Relacja ogólna + Zaufanie + Respekt/Strach | Relacja ogólna + Respekt/Strach |
| Negocjacje | Wielokadencyjne, z kontrpropozycjami | Tak/Nie bez kontrpropozycji |
| Umowy długoterminowe | TAK (wieloturowe) | NIE (jednorazowe transakcje lub stały trybut) |
| Sojusze wojskowe | TAK | NIE |
| Wymiana technologii | TAK | NIE |
| Reakcja na Strach | Złożona (progi, archetyp) | Prosta: Strach > 60 → akceptacja prawie wszystkiego |
| Inicjowanie akcji przez AI | TAK (AI aktywna) | RZADKO (reagują głównie na gracza) |

### 5.2 Logika decyzyjna pobocznych (prosta reguła)

```
JEŚLI Respekt/Strach gracza > 60:
  → Akceptują trybut, NAP, wchłonięcie
  → Odrzucają wojnę chyba że pchnięte przez Głównego rywala
JEŚLI Relacja ogólna > 30:
  → Akceptują prosty handel (jednorazowy)
  → Otwierają granice (cywilne)
JEŚLI Relacja ogólna < −40 LUB gracz atakuje:
  → Mogą zadeklarować wojnę
  → Mogą poprosić o pokój (Relacja ogólna < −60 + Strach > 50)
```

### 5.3 Rola pobocznych w rozgrywce

Cywilizacje poboczne pełnią trzy funkcje strategiczne:
1. **Bufor terytorialny** — ich ziemie rozdzielają głównych rywali; wchłonięcie ich przyspiesza ekspansję.
2. **Źródło trybutu** — Pieniądz/surowce bez zaangażowania militarnego (jeśli Strach wysoki).
3. **Pionki w wojnach** — Główni rywale mogą namówić poboczne do ataku na gracza; gracz może kupić ich neutralność.

---

*Dyplomacja-szablon.md — wersja robocza, do integracji z systemem AI i UI. Szczegóły per-typ (startowe wartości parametrów, drzewka decyzyjne AI) → osobne pliki per cywilizacja.*

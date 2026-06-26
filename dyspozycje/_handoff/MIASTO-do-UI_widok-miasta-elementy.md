# PACZKA: MIASTO -> UI : elementy widoku miasta (makieta Widok-miasta.html) — co wplatać w v0.1
Data: 2026-06-25. Odpowiedz na zapytanie UI (punkty 1-9). Status zweryfikowany w kodzie (order.ts, culture-religion.ts).

Legenda: JEST = mechanika gotowa, hak istnieje | PLANOWANE = projekt jest, kodu jeszcze nie ma | NIE v0.1 = poza zakresem.

## 1. Nastroje mieszkancow — CZESCIOWO (wplataj getOrderState)
- evaluateOrder({szczescie, prawo}) -> { order, tier:'unrest'|'neutral'|'order', effects:{productionMult, growthMult, tradeMult, revoltRisk} }.
- To netto szczescie + prog (T1/T2), NIE rozklad 3-koszykowy. Twoj getOrderState wystarcza.
- Rozklad Zadowoleni/Kontentni/Niezadowoleni = KOSMETYKA, nie v0.1. Na zyczenie dorobie czysty helper
  happinessBreakdown(population, szczescie) -> {zadowoleni, kontentni, niezadowoleni} (tylko wizualny podzial).
- DECYZJA: wplataj getOrderState; pasek 3-koszykowy opcjonalny (powiedz = dorobie helper).

## 2. Specjalisci (Uczony/Poborca/Artysta) — NIE v0.1
- Brak mechaniki przydzialu ludnosci do nauki/pieniadza/kultury. DECYZJA: odpada w v0.1 (placeholder lub usun).

## 3. Zdrowie miasta — NIE v0.1
- Niemodelowane (Akwedukt/Rzeka/Bagno/Zanieczyszczenia). Brak haka. DECYZJA: odpada/placeholder.

## 4. Podzial outputu / Handlu — KOREKTA 2026-06-25 (po handoffie CYWILIZACJE)
- ZMIANA wzgledem poprzedniej wersji: PER-MIASTO suwak podzialu outputu (produkcja / Pieniadz / Nauka / rozwoj)
  = MECHANIKA MIASTO (nie EKONOMIA). MIASTO wystawi helper podzialu (rozszerzenie splitPraca na 4 strumienie) -- czekaj na API.
- EKONOMIA = AGREGACJA GLOBALNA (sumuje Nauke/Pieniadz/Prace z miast do puli na mapie) + wzor tempa nauki + konwersja Handel->Nauka.
- tradeMult (mnoznik z Porzadku) nadal z MIASTO (order.ts).
- MAGAZYN NAUKI gracza (pula + zakup tech) = architektura W TOKU (research.ts vs playerState) -- API podam po decyzji Maciej/master.
- DECYZJA: suwak podzialu outputu wplataj jako MIASTO-owy (API nadchodzi); magazyn nauki = placeholder do czasu API.

## 5. Magazyny surowcow — DOSTEP (boolean), NIE ilosc
- v0.1: surowiec = DOSTEP (mam/nie mam). Pokazuj liste dostepu, nie slupki stanu/pojemnosci.
- Magazyny ilosciowe = nie v0.1 (pola w Excelu zostaja na przyszlosc). DECYZJA: render = dostep.

## 6. Kultura i Religia — KULTURA JEST, RELIGIA etap 2
- kulturaSkumulowana (suma/miasto), accumulateCulture(city, perTurn, params) (przyrost/ture),
- cityBorderRadius(kultura) -> 0|1|2|3 (pierscienie granicy z kultury),
- cultureThresholds() -> [prog1, prog2, prog3] (pasek postepu do nastepnej granicy),
- religia: dominantReligion(...), civReligion(...), religionHappiness(...) — gotowe, ale WPIECIE = etap 2.
- DECYZJA: kultura (suma + prog + zrodla) teraz; religia placeholder do etapu 2.

## 7. Zasieg granic z kultury — TAK, pokazuj
- Dane: cityBorderRadius(kultura) (0-3) + cultureThresholds() na pasek.
- UWAGA dwa rozne zasiegi:
  (i) OKOLICA ROBOCZA rosnie z POPULACJA: okolica.cityRangeForPopulation(pop) = r5/10/15.
  (ii) GRANICA KULTUROWA = cityBorderRadius(kultura) = +0..3 pierscienie.
- DECYZJA projektowa MIASTO: terytorium = cityRangeForPopulation(pop) + cityBorderRadius(kultura) (addytywnie).
  Flagowane MAPIE (egzekucja granic).

## 8. Wioski (V) -> miasto — PLANOWANE (jedyny otwarty feature mojego lane)
- Mam canFoundCity / foundCityAt; samej KONWERSJI wioski jeszcze nie ma (czekam na "go" Mastera).
- Wyswietlanie wiosek = dane MAPA. Akcja "Przeksztalc w miasto" -> callback do MIASTO (foundCityAt), gdy dorobie.
- DECYZJA: placeholder "planowane"; przycisk wola callback MIASTO.

## 9. Naglowek
- Zmien nazwe -> czysto UI/stan (city.nazwa), MIASTO nie bramkuje. UI realizuje sam.
- Zarzadca automatyczny -> auto-przydzial mieszkancow JEST (okolica.assignWorkedTiles); auto-kolejka produkcji = nie v0.1.
  DECYZJA: podlacz auto-przydzial; auto-build placeholder.
- Widok artystyczny -> czysto render UI, nie MIASTO. UI realizuje sam.

## PODSUMOWANIE
- WPLATAJ TERAZ: 1 (getOrderState), 6 (kultura), 7 (granica kulturowa), 9 (rename + auto-przydzial pol).
- PLACEHOLDER / ODPADA v0.1: 2, 3, 5-ilosc (pokaz dostep), 9-autobuild.
- CROSS-LANE: 4 -> EKONOMIA; wioski-dane -> MAPA.
- NA ZYCZENIE dorobie: happinessBreakdown (pkt 1), konwersja wioska->miasto (pkt 8, po go Mastera).

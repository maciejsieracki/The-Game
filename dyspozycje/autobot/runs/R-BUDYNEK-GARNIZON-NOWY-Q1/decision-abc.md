# decision-abc.md — R-BUDYNEK-GARNIZON-NOWY-Q1

STATUS TEGO PLIKU: **ROZSTRZYGNIĘTE** — wszystkie trzy pytania zamknięte decyzją właściciela
(ECHO), zapisaną w `00-dispatch.md` §„RATYFIKACJA ORKIESTRATORA — runda 2" (2026-09-05).
Plik nie jest otwartym pytaniem ABC i nie blokuje tematu.

**NOTA O DACIE POWSTANIA (C-058 — nie udaję, że plik istniał wcześniej):** zapisany
**retroaktywnie 2026-09-06 w rundzie 3**, na polecenie ratyfikacji rundy 3 (poz. R3-C, po
werdykcie `NAPRAW` #5 Final Control). Runda 1 zgłosiła `DECISION_REQUIRED` **bez** tego pliku,
wbrew C-054 — treść poniżej jest odtworzona z `01-operator-runda1.md` §„DECISION_REQUIRED —
pliki spoza allowlisty" oraz z ratyfikacji rundy 2, nie zmyślona. Wpis do
`dyspozycje/REJESTR-PROSB-I-ZADAN.md` i ustawienie ledgera należy do orkiestratora, nie do
Operatora (tak stanowi R3-C).

## Charakter konfliktu

Wszystkie trzy pytania są tej samej klasy: **GOAL dispatchu żądał budynku „kompletnego, na równi
z każdym innym budynkiem w grze", a recon G1 wykazał, że kompletność wymaga plików spoza
allowlisty rundy 1.** Dispatch przewidział dokładnie tę sytuację („Jeśli recon wykaże, że
kompletny budynek wymaga pliku spoza allowlisty — NIE wchodź w niego. Zgłoś to jako
`DECISION_REQUIRED`"). Operator nie wszedł w żaden z tych plików i nie kodował dalej.

Ścieżka C-054: pytanie 1 i 3 to konflikty **czysto inżynierskie** (dług testowy, brak hasła
dokumentacji) — lekka ścieżka. Pytanie 2 (liczby balansu) dotyczyło **gameplayu** i poszło
do właściciela jako decyzja balansowa, nie jako wybór techniczny.

---

## Pytanie 1 — `gra/tools/grupy-budynkow-test.cjs` (dług licznikowy)

**Co mówi dispatch:** allowlista rundy 1 nie zawiera tej bramki; zabroniona jest cicha edycja
plików spoza niej.
**Co mówi kod:** bramka ma zaszyte z 2026-07-27 liczniki `buildings.length === 40`
i `'Prawo i administracja': 8`.
**Co mówią testy:** bramka była **czerwona już przed pracą Operatora** (41 budynków vs 40);
rekord `garnizon` dokłada czwarty fail tej samej klasy (grupa 8→9). Zmierzone: 80/3 → 79/4.

**ODPOWIEDŹ WŁAŚCICIELA/ORKIESTRATORA (R2-B):** allowlista **rozszerzona** o ten plik.
Polecenie: poprawić OBA liczniki na stan faktyczny (42 i 9) **oraz naprawić pre-istniejący fail
spoza tematu**, dołożyć komentarz wymuszający bump przy każdym nowym budynku.
**Wykonane w rundzie 2:** 79/4 → **84/0**, plus nowa asercja spójności `suma expectedCounts === TOTAL`.

## Pytanie 2 — liczby balansu Garnizonu (koszt, utrzymanie, surowce)

**Co mówi dispatch:** G3 wprost zabrania podania liczb jako faktu („Tryb trzeci — ciche wymyślanie
liczb balansu"); liczby mają być PROPOZYCJĄ do zatwierdzenia.
**Co mówi kod:** rekord budynku bez tych pól nie przechodzi asercji kompletności (`[A2]`).
**Co mówią testy:** bramka rundy 1 celowo **nie zamrażała** wartości (asercje na typ i na regułę
surowcową epoki Kamienia, nie na `30`/`2`), żeby decyzja właściciela nie wymagała poprawki testu.

Propozycja Operatora, wyprowadzona z pomiaru sąsiadów: `kosztBudowy 30`, `przyrostKosztu 6`,
`utrzymanie 2`, `przyrostUtrzymania 1`, `koszt_surowce: drewno 30`, `maksPoziom 1`.

**ODPOWIEDŹ WŁAŚCICIELA (ECHO, R2-A):** wariant Operatora **ZATWIERDZONY BEZ ZMIAN** —
**30 / 6 / 2 / 1 / drewno 30**, `maksPoziom 1`, `epokaWejscia 1`, `lokalizacja: region`,
`techUnlock "-"`, `dajeSzczescie: false`. Uzasadnienie przyjęte za Operatorem: droższy od Domu
Starszyzny (kwatery i posterunek, nie izba obrad), tańszy od każdego urzędu epoki 2 (ma być
realnie osiągalny w pierwszych turach), utrzymanie jak Dwór Zarządcy (strażnicy biorą żołd).
**Od tej chwili to są liczby właściciela — obowiązuje zakaz ich strojenia, a bramka ma je zamrozić.**
**Wykonane w rundzie 2:** 7 asercji `[R2-A]` na dokładne wartości; runda 3 tych liczb nie rusza
(kryterium 8: `git diff` wobec rundy 2 nie dotyka `gra/data/buildings.json`).

## Pytanie 3a — `gra/src/game/ai.ts` (parytet gracz/AI)

**Co mówi dispatch:** plik spoza allowlisty rundy 1; Operator zaproponował odłożenie do osobnego
tematu (razem z tematem Prawa — bez wartości Prawa AI nie ma czego wyceniać).
**Co mówi kod:** AI wybiera budynki z ręcznie wpisanej listy (`infraOrder`, ~1471), nie
z `availableProduction` — każdy nowy budynek jest dla tej listy niewidoczny.
**Co mówią testy:** `ai-buduje-budynki-test` jest zielona (42/0) i tej luki **nie widzi** — sprawdza,
czy miasta AI mają w ogóle jakiś budynek, nie czy AI umie postawić KAŻDY budynek.

**ODPOWIEDŹ WŁAŚCICIELA (ECHO, R2-D):** **„Dopisać Garnizon do listy AI od razu."**
Allowlista rozszerzona o `ai.ts` w zakresie **dokładnie jednej linii**. Właściciel wie, że to
łatka, a nie naprawa przyczyny.
**Wykonane w rundzie 2:** +1 linia, 0 usunięć, zero innych zmian w pliku; asercja `[AI3]` w bramce.
**Korekta rundy 3 (R3-D):** Final Control udowodnił, że `infraOrder` leży w gałęzi
`if (opts.defensiveCopy)` (`ai.ts:1455`), czyli dotyczy **państw-miast**, a nie cywilizacji AI.
Łatka **zostaje** (daje efekt dla państw-miast, nic nie psuje), ale etykieta asercji, która
sugerowała pokrycie dużego AI, została przepisana na prawdę. Duże AI naprawia osobny temat
`R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1` (ECHO: przepiąć AI na `availableProduction()`).

## Pytanie 3b — hasło CivPedii (`docs/encyklopedia/budynki/garnizon.md` + `wikiBundle.json`)

**Co mówi dispatch:** oba pliki poza allowlistą rundy 1; Operator oznaczył pozycję jako
„opcjonalne" (17 z 42 budynków nie ma hasła, w tym wszystkie trzy wzorce).
**Co mówi kod:** przycisk „Więcej informacji (Civpedia)" jest na karcie **zawsze**; bez hasła
klik jest no-opem.
**Co mówią testy:** `civpedia-gra-id-mostek-test.cjs` przy uruchomieniu **nadpisuje** śledzony
`gra/src/data/wikiBundle.json` (stempel `generated`) — ostrzeżenie przekazane wprost.

**ODPOWIEDŹ WŁAŚCICIELA/ORKIESTRATORA (R2-C):** allowlista **rozszerzona** — hasło ma powstać.
„Fakt, że 17 z 42 budynków ma tę samą lukę, jest argumentem za jej niepowiększaniem, nie
za dołączeniem do niej."
**Wykonane w rundzie 2:** hasło + regeneracja bundla (168 → 169 wpisów, dokładnie jeden dodany,
zero zmienionych, zero usuniętych). Luka spadła z 17/42 na 16/42.
**Rozstrzygnięcie rundy 3:** kryterium „działający klik" **ZDJĘTE z tego tematu** — przycisk jest
martwy dla wszystkich 42 budynków (`renderer.ts:378-382` vs listener `:434`), więc defekt dotyczy
całej rodziny kart i idzie osobnym tematem (decyzja właściciela w ABC). W zamian bramka tematu
dostała asercje `[R3-E1..E3]` na obecność i niepustość hasła w `wikiBundle.json`.

---

## Co pozostaje otwarte

Nic, co blokuje ten temat na poziomie decyzji ABC. Dwie **blokady przyjęte i niedomknięte**
(nie pytania ABC — ostrzeżenia wejściowe) żyją dalej w polu BLOKADY każdego raportu tego tematu,
aż zostaną zamknięte: (a) twarda zależność kolejności deployu wobec
`R-PRAWO-PRZEBUDOWA-SKALI-Q1`, (b) kolizja nazewnicza `prawo_garnizon*` /
`society-breakdown.ts:638-647`. Szczegóły w `05-operator-runda3.md` §BLOKADY.

---

## Pytanie 4 — kolejność wydania Garnizonu wobec tematu Prawa (dopisane przez Final Control, runda 3, 2026-09-06)

**STATUS: OTWARTE — jedyna niezamknięta pozycja tematu.**

**Skąd się bierze:** blokada zgłoszona w rundzie 1, przyjęta, przenoszona przez rundy 2 i 3,
nigdy nierozstrzygnięta. Ratyfikacja rundy 3 rozstrzygnęła trzy inne pozycje „DO DECYZJI
CZŁOWIEKA" poprzedniego Final Control (martwy klik CivPedii, zasięg łatki AI, model roli),
tej **nie**.

**Co mówi kod:** `garnizon.baza` i `garnizon.przyrost` są w całości zerowe — cały efekt
budynku to wartość Prawa, którą wprowadza dopiero `R-PRAWO-PRZEBUDOWA-SKALI-Q1`
(`society-params.json`, `society-breakdown.ts`, `main.ts`, `cityPanel.ts` — wszystkie poza
allowlistą tego tematu). Sekcja „Efekty" na karcie jest pusta.

**Co to znaczy dla gracza, jeśli Garnizon wyjdzie pierwszy:** 60 pkt Pracy + 60 Drewna
jednorazowo, potem 4 Pieniądza i −5 Drewna na turę — bez żadnej korzyści. Czysty koszt.

**Pytanie:** Garnizon wchodzi do `main`/na ROBOCZĄ **przed** tematem Prawa (świadomie, jako
budynek jeszcze bez efektu), czy czeka i jest wydany **razem z nim**?

Poza tą jedną pozycją temat jest zamknięty: bramki zielone, diff w allowliście, liczby
właściciela zamrożone asercjami, `tsc --noEmit` zielony. Werdykt i dowody:
`08-final-control-runda3.md`.

## RATYFIKACJA ORKIESTRATORA (2026-09-06, odpowiedź na W-FC4)

**Decyzja: Garnizon wchodzi do `main` TERAZ, ale ROBOCZA (wydanie graczowi) czeka i wychodzi
RAZEM z Prawem.** `main` jest wewnętrznym drzewem integracji, nie tym, co widzi gracz —
scalenie tam nie jest „wydaniem". Kolejność wykonawcza: (1) Garnizon → `main` (ten commit),
(2) `R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1` → `main` (blokuje Prawo, patrz jego własny
dispatch), (3) `R-PRAWO-PRZEBUDOWA-SKALI-Q1` → `main`, (4) dopiero wtedy build+deploy ROBOCZA
obejmujący wszystkie trzy naraz. **Wiążący zakaz dla orkiestratora: żaden deploy ROBOCZA
między krokiem (1) a (3) nie może nastąpić** — inaczej gracz zobaczy Garnizon jako czysty
koszt, dokładnie ryzyko opisane wyżej.

Integracja do `main` wykonana zgodnie z warunkami z `08-final-control-runda3.md`:
wpis do `REJESTR-PROSB-I-ZADAN.md` (§16b pkt 6), rejestracja `prereq-budynkow-test`/
`upgrade-budynki-test` jako osobny temat INFRA (W-FC3), zapisanie trzech niespójności R2-E
jako obserwacje. Zero `NAPRAW` w agregacie Final Control — temat integrowany bez zmian kodu.

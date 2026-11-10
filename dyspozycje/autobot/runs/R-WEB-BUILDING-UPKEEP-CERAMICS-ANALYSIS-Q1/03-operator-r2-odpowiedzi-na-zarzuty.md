STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BUILDING-UPKEEP-CERAMICS-ANALYSIS-Q1
GOAL: Audyt read-only: czy ceramika może być kosztem UTRZYMANIA budynków. Zero zmian kodu gry. Runda 2: odpowiedź na zarzuty z FAIL rundy 1 (Evaluator/Final Control).
ZMIANY/COMMIT: tylko dyspozycje/autobot/runs/R-WEB-BUILDING-UPKEEP-CERAMICS-ANALYSIS-Q1/03-operator-r2-odpowiedzi-na-zarzuty.md (nowy plik; 01-operator-r1.md i 02-kandydaci-utrzymanie-ceramika.csv bez zmian). Baza: SHA 54a7c6d6f (runda 1). Commit rundy 2: SHA w sekcji ZARZUTY/COMMIT poniżej. Push NIE wykonany.
TESTY: NIE_ZMIERZONO - brak symulacji salda ceramiki w czasie (bez zmian wobec rundy 1). Weryfikacja wyłącznie odczytem: `git show 5d7ff15e6:<plik>` (baza z zarzutu) oraz `git show 54a7c6d6f:<plik>` (raport r1). `git diff --check` czysty. Gra nie dotknięta.
BLOKADY: brak. Pytania ABC nie zadaję (zgodnie z dispatchem: zadaje orkiestrator).
RUNDY: 2/5 (poprzedni werdykt: FAIL, 4 zarzuty; wszystkie 4 PRZYJĘTE, zob. niżej)
NASTĘPNY KROK: Evaluator rundy 2 + Final Control; po PASS - ABC właściciela (pytanie A/B/C z 01-operator-r1.md, poprawione wg niniejszego raportu).
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Zarzut 1 (błąd faktyczny: prereq Garncarstwa) - PRZYJMUJĘ
Weryfikacja w bazie 5d7ff15e6, gra/data/tech.json, wpis Garncarstwo (epoka Kamień, poziom 2, koszt nauki 40):
- "Wymaga (prereq)": "—" (brak prereq w bazie).
- "Odblokowuje budynek": "Spichlerz; Garncarnia; Cegielnia".
- Prereq "Rolnictwo + Łowiectwo + Obróbka drewna + Oswojenie zwierząt" pochodzi z niewdrożonego tematu R-WEB-TECH-POTTERY-FIFTH (#180 w kolejce, dispatch zapisany, nie w bazie). Błędnie przypisałem go do stanu bazowego.

Korekta: wniosek o "zakleszczeniu wczesnej gry" z rundy 1 dotyczy WYŁĄCZNIE stanu po wdrożeniu POTTERY-FIFTH. Ryzyko przeliczone osobno:
- Stan BAZOWY (5d7ff15e6): Garncarstwo jest wczesne (Kamień, 40 PN). Garncarnia kosztuje tylko drewno:30 (buildings.json), nie wymaga ceramiki, więc NIE ma twardego zakleszczenia (ceramika nie jest potrzebna do zbudowania producenta). Ryzyko to deficyt przed zbudowaniem Garncarni, nie blokada. Uzasadnienie bramki epokowej (wariant B/C) w tym stanie jest słabsze i opiera się na ryzyku deficytu, nie na zakleszczeniu.
- Stan PO POTTERY-FIFTH: Garncarstwo wymaga Rolnictwa + Łowiectwa + Obróbki drewna + Oswojenia. Wtedy budynki z utrzymaniem ceramiką przed dostępem do Garncarstwa miałyby deficyt bez producenta. To jest wariant, dla którego bramka epokowa ma sens.
Właściciel dostaje więc dwa stany do rozstrzygnięcia jako część pytania A (patrz sekcja „Propozycje ABC” poniżej).

### Zarzut 2 (Spichlerz i zakleszczenie) - PRZYJMUJĘ
- Spichlerz jest odblokowywany przez Garncarstwo (ten sam tech co Garncarnia), więc nie może być dostępny bez Garncarstwa, a Garncarnia (drewno:30) jest dostępna od razu po nim. Zarzut o zakleszczeniu Spichlerza w tabeli kandydatów był pusty; usuwam go z ryzyk.
- Zakleszczenie wymaga sprawdzenia wymagań technologii odblokowujących budynki:
  - Studnia: odblokowana przez „Gospodarka wodna” (tech.json), prereq: Rolnictwo. Nie zależy od Garncarstwa.
  - Targowisko (Rynek): odblokowane przez „Wymiana” (tech.json), prereq: Garncarstwo + Rolnictwo + Oswojenie zwierząt (stan bazowy). Zależy od Garncarstwa, więc producent jest osiągalny, ale późniejszy niż sam budynek.
- Wniosek: w stanie bazowym zakleszczenie nie występuje dla żadnego z 8 kandydatów. Ryzyko ograniczone do deficytu i kolejności. W stanie po POTTERY-FIFTH Studnia i Targowisko nadal nie zależą od Garncarstwa wprost (Studnia), a Targowisko zależy od niego pośrednio przez Wymianę.
- Dla CSV: uwagi „wczesny budynek - ryzyko zakleszczenia” przy Studni i Targowisku należy czytać jako „ryzyko deficytu przed producentem”. Plik CSV nie został zmieniony w tej rundzie.

### Zarzut 3 (mechanizm dodania ceramiki) - PRZYJMUJĘ
Weryfikacja: gra/src/game/economy-upkeep.ts (baza 5d7ff15e6), `buildingResourceUpkeep` (linie ~681-700) i stała `BUILDING_RESOURCE_UPKEEP_UNITS_PER_TYPE = 5` (linia 674): każdy TYP surowca obecny w `koszt_surowce` daje płaskie 5 szt./turę, niezależnie od ilości w kosztach budowy.
Konsekwencje dla wariantów (korekta rundy 1):
- Wariant „dodaj ceramikę do koszt_surowce” (jak dziś dla drewna/kamienia/cegły): daje 5 szt./t na KAŻDY budynek. Dla 8 budynków z tabeli: 8 x 5 = 40 szt./t, NIE 12 szt./t. To czynnik ok. 3,3 względem wartości w CSV. Ten wariant dodatkowo wprowadza ceramikę do KOSZTU BUDOWY, co sprzeciwia się GOAL właściciela („do budowy używamy cegły, nie ceramiki”). Odrzucam go jako wariant bez wartości.
- Wariant „proporcjonalny do Pieniądza” (wartości z kolumny `kandydat_wariant_B_ceramika_base` w CSV) wymaga NOWEGO pola (np. `utrzymanie_surowce: {"ceramika": N}`) i zmiany logiki `buildingResourceUpkeep`, nie samego JSON. Wartości 12 szt./t i 8 szt./t są więc propozycją dla nowego mechanizmu, nie tym, co silnik zastosuje dziś.
- Spichlerz (gra/src/game/building-resource-gate.ts:383): drenaż 25 ceramiki jest BRAMKOWANY: odejmowany tylko gdy zapas ceramiki imperium >= 25; przy niższym zapasie nie ma drenażu wcale (nie drenuje częściowo). Rundą 1 pisałem „stały drenaż 25/t”; poprawiam: „25/t, całość albo nic”.

Wpis AI (zarzut 3, druga część) - PRZYJMUJĘ: `CONVERTER_FOR_RESOURCE` (gra/src/game/ai.ts, baza, linia ~2040) wybiera konsumenta przez `buildingStockCost(...)`, czyli KOSZT BUDOWY. Utrzymanie ceramiką nie uruchomi więc tego wpisu. Dla wariantu z utrzymaniem potrzebna jest osobna logika (np. konsument = budynek z `utrzymanie_surowce`), a nie tylko dopisanie pary ['ceramika','garncarnia']. Tabela z linii ~2407 (`ceramika: ['garncarnia']`) jest osobnym mechanizmem; nie rozstrzygałem tu, który jest aktywny.

### Zarzut 4 (pomiar vs arytmetyka; dryf „39 budynków”) - PRZYJMUJĘ
- Wniosek „saldo strukturalnie ujemne” i „minimum dwóch Garncarni przy populacji 100” to HIPOTEZA wynikająca z arytmetyki stałych: obywatele 1,0/os./t (citizen-resource-upkeep.json, epoki Brąz i Żelazo, `CITIZEN_UPKEEP_RATE_PER_CITIZEN = 1.0`) vs produkcja Garncarni 50/55/60 szt./t. NIE_ZMIERZONO w grze ani w symulacji.
- Nie zmierzono również liczby Garncarni na miasto ani zasilania glina+drewno (Garncarnia zużywa drewno:30 jako koszt budowy; wejście produkcji Glina+Drewno nie było sprawdzone w tej rundzie jako ograniczenie przepustowości).
- Dryf dokumentacji „39 budynków” - POTWIERDZONY (wcześniej niezweryfikowany): gra/data/econ-params.json, pole opisu przy `budynek_spichlerz_zuzywa_ceramika` (linia ~409) mówi „Dziś wszystkie 39 budynków mają własną wartość”; buildings.json w bazie ma 42 wpisy (`grep -c` = 42). Dryf do osobnego tematu dokumentacyjnego, nie blokuje audytu.

## Zweryfikowane w rundzie 2 (odczyt, baza 5d7ff15e6 i raport 54a7c6d6f)
- tech.json: Garncarstwo prereq "—", Odblokowuje budynek "Spichlerz; Garncarnia; Cegielnia".
- tech.json: Gospodarka wodna prereq "Rolnictwo" (odblokowuje Studnię); Wymiana prereq "Garncarstwo + Rolnictwo + Oswojenie zwierząt" (odblokowuje Targowisko).
- buildings.json: 42 wpisy; Spichlerz, Studnia, Targowisko epokaWejscia 1.
- economy-upkeep.ts:674-700: płaskie 5/typ.
- building-resource-gate.ts:329, 383: stała 25, bramka `>= 25`.
- ai.ts ~2040: CONVERTER_FOR_RESOURCE bez ceramiki; ai.ts:2407 `ceramika: ['garncarnia']`.
- econ-params.json ~409: „39 budynków” (drift).

## Propozycje i pytania ABC (poprawione)
Pytanie A (cel): czy ceramika ma wejść do utrzymania budynków?
- A (rekomendacja operatora, bez zmian): NIE wprowadzać utrzymania ceramiką w tej fazie. Najpierw osobny audyt salda ceramiki na obywatela (1,0/os. vs 50–60/t Garncarni), NIE_ZMIERZONO. Decyzja stawki obywateli należy do właściciela.
- B: nowe pole `utrzymanie_surowce` + proporcjonalna logika dla 8 budynków (suma 12/t), od epoki Brązu, z nową logiką AI (konsument = utrzymanie, nie koszt budowy). Wymaga zmiany kodu (nie JSON). Ryzyko deficytu przed Garncarnią; w stanie po POTTERY-FIFTH bramka epokowa obowiązkowa.
- C: jak B, ale 4 budynki (Spichlerz II, Akwedukt, Łaźnia, Port; 8/t), bez Spichlerza I i wczesnych budynków. Najmniejszy efekt, najmniejsze ryzyko.
Rekomendacja: A; przy B lub C - najpierw rozstrzygnąć, który stan kolejki (bazowy czy po POTTERY-FIFTH) ma być punktem odniesienia.
Pytanie B (po A/B/C): Spichlerz (I/II) przy bramkowanym drenażu 25/t (całość albo nic) bez dodatkowego utrzymania (rekomendacja).

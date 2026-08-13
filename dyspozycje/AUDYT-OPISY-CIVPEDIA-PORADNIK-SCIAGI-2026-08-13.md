# AUDYT: Poradnik gracza, Civpedia, panele „ściąga" (cityPanel.ts)

**Data:** 2026-08-13
**Zakres:** pełny przegląd treściowy `gra/src/data/wikiBundle.json` (pole `poradnik`, 22 rozdziały; pole `encyklopedia`, wszystkie kategorie) oraz paneli „szczegóły"/„ściąga" w `gra/src/ui/cityPanel.ts`, skrzyżowany z żywym kodem i danymi (`gra/data/*.json`, `gra/src/game/*.ts`).
**Metoda:** 15 raportów wsadowych (8× Poradnik, 6× Civpedia, 1× Ściągi UI), każdy z pełnym odczytem treści + weryfikacją liczb wobec silnika/danych + `git log`/`git blame` dla ustalenia świeżości rozjazdu.
**Etap:** WYŁĄCZNIE raport i rekomendacje — **żadna zmiana w kodzie/danych gry nie została wykonana**.

---

## 1. Podsumowanie wykonawcze

| Metryka | Wartość |
|---|---|
| Łączna liczba zgłoszonych problemów (wiersze w tabeli §2) | **~118** |
| — Priorytet WYSOKI (nieaktualne liczby/wzory/mechaniki) | **68** |
| — Priorytet ŚREDNI (jasność/potrzebność) | **38** |
| — Priorytet NISKI (styl/drobne) | **12** |
| Pozycje odłożone do „zsynchronizować po ×5" (§3) | **17** |
| Kategorie/rozdziały bez zastrzeżeń merytorycznych (§4) | **14** |

**Dominująca kategoria:** zdecydowanie **AKTUALNOŚĆ** (rozjazd liczb/mechanik między treścią a żywym kodem) — ok. 75% wszystkich problemów. Drugi co do wielkości wzorzec to **systemowy boilerplate** w Poradniku: niemal każda sekcja każdego z 22 rozdziałów kończy się identycznym, wielokrotnie powielonym blokiem „Przykład liczbowy / Strategia gracza / Typowe błędy", często **tematycznie niezwiązanym** z sekcją, którą kończy, a w kilku miejscach (rozdz. 28, 45, 57, 91) zawiera **fabrykowane liczby** przypisane konkretnemu obiektowi gry (np. cudowi lub jednostce), którego w ogóle nie dotyczą. Traktuję to jako pojedyncze, zbiorcze wiersze per rozdział (nie mnożę przez liczbę wystąpień), stąd tabela nie eksploduje do setek pozycji.

**Najpilniejsze fakty do poprawy (niezależnie od trwającej zmiany ekonomii ×5):**
1. **Poradnik rozdz. 06** opisuje mechanikę wzrostu ludności/suwaka „Żywność 70/30" i „bufor do progu", która **nie istnieje w silniku od 2026-07-30** (zastąpiona modelem „Wyżywienie") — to martwa treść wprowadzająca gracza w błąd co do najważniejszego systemu gry.
2. **Civpedia „Spichlerz"** opisuje identycznie martwy/nieaktualny mechanizm (pojemność, brak Spichlerza II, brak drenażu Ceramiki/Soli, brak cap-u ludności 5/8/12).
3. **Poradnik rozdz. 01** twierdzi, że epoka Żelaza jest niedostępna w kreatorze — jest dostępna od miesiąca.
4. **Civpedia „Handel surowcami"** i **Poradnik rozdz. 08/12** opisują mechanikę „pakietów po 10 sztuk", usuniętą decyzją `R-DYP-PAKIET-USUN` (2026-08-08).
5. **Civpedia „Budynki"**: >50% haseł podaje błędny maksymalny poziom rozbudowy (generyczne „10 poziomów" vs realne 1–3), a wszystkie hasła z kosztem surowcowym są zaniżone dokładnie ×5 względem dzisiejszego (`e401c1c2`) przeskalowania.
6. **Poradnik rozdz. 09 §54.6** i **11 §67.1**: sekcje, które explicite obiecują „pełny wzór"/aktualny mechanizm, pomijają realny czwarty mnożnik kosztu badań (FALA2) i realny mechanizm obrony murów (+200% procentowe zamiast opisanego „5+3/poziom" flat).

---

## 2. Tabela wszystkich problemów (posortowana malejąco wg priorytetu)

### Priorytet WYSOKI — nieaktualne liczby/wzory/mechaniki

| Lokalizacja | Typ | Opis | Rekomendacja |
|---|---|---|---|
| Poradnik rozdz. 06 §33.2–33.3, §33.6, §38.3, §39 | aktualność (krytyczne) | Cała opisana mechanika „bufora wzrostu do progu Próg(N)=20+N×16" i „suwaka Żywność 70/30" jest martwym kodem (`populationGrowth()` nigdzie niewywoływane) — żywy system to „Wyżywienie 0–6" (`computeGrowthPercentV85`, decyzja PYTANIE-85, 2026-07-30) | Przepisać od zera §33.2–33.3, §33.6, §38.3, §39 pod model Wyżywienie |
| Civpedia `pojecia/spichlerz` | aktualność (krytyczne) | Pojemność „100×N Spichlerzy" to martwy parametr; realnie baza 1000 + 100/Magazyn ×2 za epokę >1; brak wzmianki o Spichlerzu II, drenażu Ceramiki/Soli (dziś 25/turę, podniesione z 5 tego samego dnia) i twardym cap-ie ludności 5/8/12 | Przepisać całe hasło z `building-resource-gate.ts`, `empire-food.ts`, `economy.ts` |
| Poradnik rozdz. 01 §2.2, §6.1 | aktualność (krytyczne) | Epoka Żelaza oznaczona „niedostępna/wkrótce" — realnie w pełni wybieralna od 2026-07-09 (`newGameFlow.ts` `avail:true`) | Przepisać obie tabele, opisać co Żelazo daje |
| Civpedia `pojecia/handel-surowcami-dyplomacja` | aktualność (krytyczne) | Cała treść oparta o mechanikę „pakietów po 10 szt.", usuniętą `R-DYP-PAKIET-USUN` (2026-08-08); ceny 3 z 6 pozycji błędne, brak 8 realnych surowców w cenniku | Pełne przepisanie z `econ-params.json → handel_surowce` (13 pozycji, bez pakietów) |
| Poradnik rozdz. 08 §53.5, rozdz. 12 §78.2 | aktualność (poważne) | Mechanika „pakiety po 10" nieaktualna (jw.), ceny 4/6 pozycji błędne, brak 8 surowców w cenniku | Przepisać zgodnie z `econ-params.json` |
| Poradnik rozdz. 08 §53.2 | aktualność (poważne) | Tabela kosztów surowcowych budynków podaje ceramikę/cegłę tam, gdzie realnie jest drewno+kamień; sprzeczna wewnętrznie z rozdz. 07 §45.5 tego samego poradnika | Przepisać całą tabelę z `buildings.json` (dwie kolumny surowców) |
| Civpedia „Budynki" (11/25 haseł: akademia, akademia_wojskowa, baszta, fort, koszary, kuznia, kuznia_zelaza, mury, pretorium, targowisko, warsztat_oblezniczy) | aktualność (systemowe) | Koszt surowców zaniżony dokładnie ×5 względem `buildings.json` po commicie `e401c1c2` (2026-08-12, R-EKONOMIA-SUROWCE-SKALA-5X-Q1) | Regenerować liczby surowców dla całej kategorii |
| Civpedia „Budynki" (13/25 haseł: biblioteka, laznia_publiczna, magazyn, palac, port, sad, spichlerz, stela, stolarnia, studnia, swiatynia, teatr, kamieniarski) | aktualność (systemowe) | Generyczne „maksymalnie 10 poziomów" niezgodne z realnym `maksPoziom` (1–3) | Poprawić per hasło zgodnie z `buildings.json.maksPoziom` |
| Civpedia `budynki/palac` | aktualność | „Poziom 1: +3 kultury, +1 szczęście, +5% mnożnika Daniny" — realnie kultura=5, zadowolenie=2, `mnoznik` jawnie wyzerowany jako martwy (`019f6a24`) | Poprawić 3 liczby, usunąć opis mnożnika |
| Civpedia `budynki/biblioteka`, `budynki/swiatynia` | aktualność | Podają koszt w nieistniejącym surowcu „ceramika" (5/6 szt.) — realnie drewno+kamień | Poprawić na aktualne surowce z `buildings.json` |
| Civpedia `budynki/spichlerz` | aktualność | Myli poziom 1/2 (Spichlerz II to osobny wpis, nie „poziom 2"); twierdzi że poz.1 jest bez kosztu surowcowego — realnie kosztuje 40 drewna | Rozdzielić opis Spichlerz / Spichlerz II, poprawić koszt |
| Civpedia `budynki/laznia_publiczna` | aktualność | Koszt „10× cegła" pomija drewno i nie zgadza się nawet ze skalą ×5 (realnie 40 drewna + 60 cegły) | Poprawić oba składniki |
| Poradnik rozdz. 45 §„Świątynia" | aktualność (wysoki priorytet) | Epoka Kamień/tech Mistycyzm — realnie epoka Brąz/tech Religia + wymagany prerekwizyt „Kamienne kręgi" (nieopisany budynek) | Przepisać sekcję, dodać wpis dla Kamiennych kręgów |
| Poradnik rozdz. 45 §„Pałac" | aktualność (wysoki priorytet) | Opisuje poziomowanie, które nie istnieje (`maksPoziom:1`, pole `przyrost` martwe) — realny awans to osobne budynki Pałac II/III | Usunąć fałszywy opis, opisać łańcuch Pałac→II→III |
| Poradnik rozdz. 45 (Port handlowy, Spichlerz, Teatr, Sąd, Łaźnia publiczna) | aktualność | Ten sam wzorzec fałszywego poziomowania (maksPoziom=1) | Usunąć frazę o kolejnym poziomie / dopisać „maks. 1 poziom" |
| Poradnik rozdz. 45 (tabela „Koszt materiałowy — 9 budynków") | aktualność | Nieaktualna wobec ×5 (Mury, Cytadela, Akademia dokładnie 5× za mało) | Przeliczyć po ustabilizowaniu ×5 (patrz też §3) |
| Poradnik rozdz. 45 (Świątynia/Biblioteka w tej samej tabeli) | aktualność | Koszt w „ceramice" — żaden z tych budynków nie ma dziś ceramiki w koszcie budowy | Usunąć te wiersze z tabeli |
| Poradnik rozdz. 28 „Bydło" | aktualność | Nazwa przestarzała — w danych i UI to „Trzoda" od 2026-07-09 | Zamienić wszystkie wystąpienia „Bydło"→„Trzoda" |
| Poradnik rozdz. 28 „Kopalnia" | aktualność | Opisuje generyczną „Kopalnię" nieistniejącą jako opcja budowy (rozdzielona na 3 kopalnie: miedzi/żelaza/złota, `R-KOPALNIA-UNIWERSALNA-Q1=B`); brak 5 realnych ulepszeń (Stadnina, 3× Kopalnia, Droga brukowana) | Usunąć/rozbić wpis, dopisać 5 brakujących |
| Poradnik rozdz. 28 (każdy wiersz bonusu) | aktualność (systemowe) | Cała tabela pomija realny bonus Handlu obecny w danych dla niemal każdego ulepszenia | Przepisać tabelę z kolumną Handel |
| Poradnik rozdz. 28 „Wyrąb" | aktualność | „+20 Pracy/turę × 3 tury (=60)" — realnie 5 Pracy kosztu + 5 Drewna/turę × 1 turę; kompletnie inny, przestarzały opis | Przepisać cały wiersz/sekcję |
| Civpedia `ulepszenia/kopalnia` | aktualność | Ten sam problem co w Poradniku rozdz. 28 — klucz nie istnieje jako opcja budowy, brak 5 haseł (stadnina, 3× kopalnia, droga_brukowana) | Usunąć/rozbić, dopisać brakujące hasła |
| Civpedia `ulepszenia/lama` | aktualność | Teren „Łąka/Równina/Wzgórza" — realnie „Wzgórza/Góry", wykluczenie odwrotne niż w danych | Poprawić teren i warunek |
| Civpedia `ulepszenia/tarasy` | aktualność | „Tech: -" — realnie wymaga Rolnictwo | Dopisać wymóg technologii |
| Civpedia `ulepszenia/wyrab` | aktualność | Trzy wzajemnie sprzeczne liczby kosztu w jednym haśle (placeholder „?", „60", „20 jednorazowo") — realnie 5 Pracy | Pełne przepisanie hasła |
| Civpedia `pojecia/zalozanie-miasta` (sekcja AI) | aktualność | Próg populacji źródła foundingu „pop≥5" — realnie `AI_FOUNDING_SOURCE_MIN_POP=3` (podniesione z 2, 2026-08-08); „do 2 foundingów/turę" mylone jako norma, realnie rzadki tryb surge (norma =1) | Poprawić próg i doprecyzować że 2/turę to wyjątek |
| Civpedia `ulepszenia/fort`, `ulepszenia/posterunek` | jasność (fabrykacja) | Fikcyjny „Przykład liczbowy" sugerujący bonus żywności — oba mają `bonus:{}` w danych (brak plonu, tylko efekty specjalne) | Usunąć/zastąpić realnym opisem efektu specjalnego |
| Poradnik rozdz. 04 §22 | aktualność | Przykład Włócznika: „Moc w polu: 8" — realnie `fieldPower=44`; koszt „20 pracy" — realnie 16 Pieniądza (i to inny zasób niż podany) | Przeliczyć przykład na realne dane z `units.json` |
| Poradnik rozdz. 05 §28 | aktualność | Bonus Farmy „+2 żywność" — realnie +3 (wartość niezmieniona od pierwszego commitu, nie efekt ×5) | Poprawić na +3 |
| Poradnik rozdz. 06 §33.1, §34.2 | aktualność | Limit ludności bez Akweduktu „6" — realnie 5 (normal); pominięty pośredni stopień: sam Spichlerz podnosi limit do 8 | Poprawić „6"→„5", dopisać stopień pośredni |
| Poradnik rozdz. 06 §35.3 (+8 powtórzeń w dalszej treści) | aktualność | Tabela „co obniża szczęście" ma pomylone kolumny trudności (wojna −3 zamiast −2, obca religia −2 zamiast −4, zagęszczenie próg 4/−1 zamiast 5/−0,75 na normal) — błąd powielony ~8× w rozdziale | Przepisać tabelę i wszystkie powielone przykłady |
| Poradnik rozdz. 06 §35.5, §36.6 | aktualność | Próg Bunt/Bunt skrajny „poniżej ~10%" — realnie 12% (normal) | Poprawić próg |
| Poradnik rozdz. 07 §44.1 | aktualność | „Domyślnie 3 heksy" promienia okolicy — realnie baza 5, rosnąca z populacją do 15 | Przepisać na realną wartość i mechanizm wzrostu |
| Poradnik rozdz. 07 §47.2 | aktualność | Ostrzeżenie że Triari/Wojownik germański mają „realny koszt złota" (18/16¤) — realnie 0¤ od 2026-07-23 (decyzja: super-jednostki darmowe pieniężnie) | Usunąć/przepisać ostrzeżenie |
| Civpedia `cywilizacje/celtowie` | aktualność | Jednostka specjalna „Miecznik galijski" — realnie „Soldurii" (zmiana 2026-07-04, dzień po dacie generacji hasła) | Podmienić jednostkę i opisy bonusów |
| Civpedia `cywilizacje/rzymianie` | aktualność | Brak bonusu „2× pula Manpower"; regen poboru „+35%" — realnie ×2 (4% vs standard 2%) | Dopisać brakujący bonus, poprawić liczby regen |
| Civpedia `pojecia/wiarygodnosc` | aktualność | Bramka NAP „Min. W=−40" — realnie próg 0 (zmiana 2026-08-07, `2e672190`) | Poprawić próg na 0 |
| Poradnik rozdz. 12 §77.1 | aktualność | Próg Handlu „Relacja≥40" — realnie `progHandelRelacja=0` w silniku (dodatkowo sprzeczny hardcoded fallback UI=100 — osobny bug do zgłoszenia) | Zweryfikować i ujednolicić 3 rozbieżne wartości |
| Poradnik rozdz. 12 §77.1 | aktualność | NAP „Relacja≥50 oraz Zaufanie≥40" — pole `progNapZaufanie` nie istnieje w kodzie, bramkowane wyłącznie Relacją≥50 | Usunąć warunek Zaufania lub zamienić na poprawne odniesienie do bramki Wiarygodności |
| Poradnik rozdz. 09 §54.6 (i odsyłacz w rozdz. 08 §51.2) | aktualność (poważne) | Sekcja obiecuje „pełny wzór" kosztu badań, pomija 4. mnożnik ×2 dla epoki Brąz/Żelazo (FALA2) — realny koszt dla 2/3 epok to ×4, nie ×2 względem tempa | Dopisać czwarty czynnik i drugi przykład dla Brązu/Żelaza |
| Poradnik rozdz. 10 §65.2a | aktualność (wysoka pewność) | System doświadczenia: 3 poziomy liczone od „przeżytych bitew" — realnie 4 progi liczone WYŁĄCZNIE od wygranych (`VETERAN_BONUS_FRAC`), sufit przy 3 wygranych nie 2 | Przepisać tabelę na 4 progi, poprawić terminologię |
| Poradnik rozdz. 11 §67.1 | aktualność (wysoka pewność) | Mur „5+3/poziom" flat bonus Obrony — mechanika „poziomu muru" nie istnieje; realnie Mury=+200% (binarne), Cytadela/Baszta +100% każda | Przepisać na mechanizm procentowy |
| Poradnik rozdz. 13 §84.2 | aktualność (wysoka pewność) | Rzymianie „+35% odnowy poboru" — realnie ×2 (+100%), potwierdzone komentarzem w `manpower.ts` | Zmienić na „×2 (+100%)" |
| Poradnik rozdz. 13 §84.2 | aktualność (do zbadania, potencjalnie fabrykacja) | Kary bojowe Chińczyków/Zulusów istnieją tylko w `civ-matrix.json`, plik nie jest podłączony do walki (`civ-bonuses.ts` czyta z `civs.json → bonusy[]`, gdzie tych kar nie ma) — mechanika prawdopodobnie nie działa w grze | Zweryfikować z autorem danych; jeśli nieaktywna — usunąć lub oznaczyć „zaplanowane" |
| Poradnik rozdz. 57 (katalog jednostek) | aktualność (krytyczne, 47/47 wartości) | „Moc w polu" w prozie każdej z 47 sekcji błędna (np. Taran 177,5 vs realnie 352,5) — sprzeczne z tabelą zbiorczą w tym samym dokumencie | Usunąć z prozy, odsyłać wyłącznie do tabeli zbiorczej |
| Poradnik rozdz. 57 (6 jednostek Żelaza) | aktualność | Falanga, Hastati, Gaesatae, Rydwan celtycki, Wojownik germański, Berserker germański — proza mówi „tech Brązownictwo", realnie Hutnictwo żelaza/Obróbka żelaza (sprzeczne z tabelą zbiorczą tego samego dokumentu) | Poprawić technologię z `units.json` |
| Poradnik rozdz. 57 (wstęp + tabela) | aktualność | Fałszywe ostrzeżenie o koszcie złota Triari/Wojownika germańskiego (18/16¤) — realnie 0¤; dokument zaprzecza sam sobie (sekcja prozy Triari poprawnie mówi 0) | Poprawić koszt w tabeli/wstępie na 0¤ |
| Poradnik rozdz. 57 §Bonus vs Mount | aktualność | Tabela niekompletna i źle zliczona („12 jednostek" + 13 wierszy w tabeli) — realnie 15 jednostek, brak Hieros Lochos i Wojownika germańskiego | Dopisać 2 wiersze, poprawić liczbę na 15 |
| Civpedia „Jednostki" (Wojownik germański) | aktualność | Koszt „16¤" — realnie 0¤, jest super-jednostką (limit 1, respawn w stolicy), status nigdzie nie opisany | Poprawić koszt, dodać akapit o statusie super-jednostki |
| Civpedia „Jednostki" (Falanga, Wojownik mykeński, Wojownik germański) | aktualność | Brak wzmianki o +50% bonusie vs kawaleria mimo obecności pola w danych (bug generatora — nie czyta `Bonus vs Mount %`) | Dopisać brakujące linijki, poprawić generator |
| Civpedia „Jednostki" (Zwiadowca) | aktualność | Utrzymanie „1¤/t i 1 żywność/t" — realnie 0/0 | Poprawić na 0/0 |
| Civpedia „Jednostki" (7/8 super-jednostek) | aktualność (bug kodu) | `tools/generate-encyklopedia.cjs:97-100` używa `u['Pieniądz (koszt)'] || 10` — dla kosztu/utrzymania=0 generuje fałszywe „10¤"/„20¤" w „Przykładzie liczbowym", sprzeczne z Wiki-S/M na tej samej stronie | Zamienić `||` na `??` w generatorze, przeregenerować strony |
| Civpedia „Cuda świata" (wszystkie 19 haseł) | aktualność (najpoważniejszy problem kategorii) | „×3 plony w mieście wzniesienia" — realnie bonus `miasto` to flat +/turę do KAŻDEGO miasta imperium, bez potrojenia w mieście-nosicielu (`wonders-data.ts:190-197`) | Usunąć frazę ze wszystkich 19 kart, zastąpić poprawnym opisem mechanizmu |
| Poradnik rozdz. 91 (wszystkie 19 podrozdziałów, 7 cudów) | aktualność | Błędna epoka/technologia dla 7 cudów (Wiszące ogrody, Petra, Kolos Rodyjski, Posąg Peruna, Roquepertuse, Osada Aschaffenburg, Yerkapı) — Posąg Peruna najpoważniejszy (Kamień w wiki vs realnie Żelazo) | Przepisać tabelę zbiorczą i 7 podrozdziałów z `wonders.json` |
| Poradnik rozdz. 91 (13/19 cudów) | aktualność | Niekompletny opis bonusów cywilizacyjnych (brakuje 1–2 pozycji per cud, w tym karę Dur-Sharrukin −2 Zaufanie) | Regeneracja z `bonusy.specjalne[].opis` |
| Poradnik rozdz. 91 (cała treść „Danina") | aktualność | Termin „Danina" nieaktualny (UI pokazuje „Podatek" od 2026-07-27); bonus ruiny po absolut opisany błędnie jako „+10 Daniny" — realnie +10 Handlu; pominięte, że utrzymanie maleje o połowę (nie znika) | Zmienić terminologię i poprawić fakt o ruinie |
| Civpedia `pojecia/szczescie` | aktualność | Stałe SzMax „12/18/24" — realnie `SZMAX_DEFAULTS={14,20,28}`; błąd propaguje się do przykładu liczbowego w polu `full` | Poprawić stałe i przeliczyć przykłady |
| Civpedia `pojecia/bunt`, `pojecia/porzadek` | aktualność | Kara niepokoju uśredniona „×0,85" dla 4 zasobów — realnie praca/złoto ×0,85, nauka/kultura ×0,90; próg buntu skrajnego „10%"/„2 tury grace" to wartości dla `hard`, nie `normal` (realnie 12%/3 tury) | Rozbić karę na 2 linie, poprawić próg/grace na wartości normal |
| Civpedia `pojecia/drzewko-technologii` | aktualność | Przykład „Łucznictwo, Poziom 2, koszt bazowy 14 PN" — realnie Poziom 3, koszt bazowy 28 (realny koszt przy tempie Standard = 56, nie 28) | Poprawić poziom, koszt bazowy i wynik |
| Civpedia `pojecia/suwak-zywnosci` | aktualność | Domyślnie „70% rozwój / 30% wojsko" — realnie 100/0 (wszystkie trudności, `Maciej 2026-07-03`) | Poprawić domyślną wartość, przeformułować przykład jako ręczne ustawienie gracza |
| cityPanel.ts — panel „Okolica — ściąga" | aktualność | Przykładowe wagi profilu Żywność „3/0.5/0.5" — realnie `{10,0,0}` po commicie `1258ba28` | Podmienić literał na dynamiczny odczyt z `wagiForFocus()` |
| cityPanel.ts — panel „Porządek — szczegóły" | aktualność | Granica Bunt/Bunt skrajny na sztywno „10%"/„2 tury grace" — realnie zależne od trudności (normal: 12%/3 tury) | Pobierać próg/grace z `society-params.json` wg aktualnej trudności |
| cityPanel.ts — panel „Porządek — szczegóły" (garnizon) | aktualność | „Prawo do 100% przy 5+ jednostkach" — na `hard` cap wynosi 4, nie 5 | Pobierać cap z parametrów trudności |

### Priorytet ŚREDNI — jasność / potrzebność

| Lokalizacja | Typ | Opis | Rekomendacja |
|---|---|---|---|
| Poradnik rozdz. 00–03 (wszystkie) | przejrzystość/potrzebność | Boilerplate „Przykład liczbowy/Strategia gracza/Typowe błędy" powielony 7–8×/rozdział (23–39% objętości pliku), często tematycznie niezwiązany, czasem z faktami z zupełnie innego tematu (dyplomacja, korupcja Rzymian pod sekcją o mgle wojny) | Usunąć mechanizm generowania; jeśli boks ma zostać, pisać unikalnie per sekcja |
| Poradnik rozdz. 04–06 | przejrzystość/potrzebność | Ten sam wzorzec boilerplate (23–30% objętości każdego rozdziału) | jw. |
| Poradnik rozdz. 07–09 | przejrzystość/potrzebność | Ten sam wzorzec (19% objętości rozdz. 07) | jw. |
| Poradnik rozdz. 10–13 | przejrzystość/potrzebność | Ten sam wzorzec + żargon deweloperski wyciekający do gracza („coef v2b", „M_pole", „diplomacyFairGivePn", metakomentarze o wersjach dokumentu) | Usunąć boilerplate, przenieść historię zmian do stopki rewizji |
| Poradnik rozdz. 14–17 | przejrzystość/potrzebność | Boilerplate 22–30% objętości; w rozdz. 17 boks jest samosprzeczny z własną treścią rozdziału (skrót Spacja=Wykonaj) | Usunąć boilerplate, naprawić sprzeczność |
| Poradnik rozdz. 45 | przejrzystość/potrzebność | Boilerplate powtórzony 24× | Skrócić do jednego wyjaśnienia na start rozdziału |
| Poradnik rozdz. 00 §0.5–0.6 | potrzebność | Opis architektury dokumentacji zespołu (Apendyks A/B/C) w rozdziale „jak grać" | Skrócić do 2–3 zdań lub przenieść poza rdzeń rozdziału |
| Poradnik rozdz. 00 §0.3, rozdz. 01 §2.3 | aktualność | „9 typów cywilizacji" — realnie 15, dostępność zależna od epoki startowej (8 w Kamieniu, 14 w Brązie) | Przepisać zgodnie z realną listą 15 cywilizacji, wg epoki startowej |
| Poradnik rozdz. 02 §8.1 | jasność (sprzeczność wewnętrzna) | Zasięg wzroku jednostki „3 heksy" w tekście vs „2" w boksie przykładu; brak w kodzie osobnego parametru „zasięg wzroku jednostki" (tylko `citySightRadius` miasta) | Zweryfikować z devem czy mechanika istnieje; ujednolicić lub przepisać |
| Poradnik rozdz. 02 (nagłówki sekcji) | jasność | Żargon deweloperski w nagłówkach widocznych dla gracza („decyzja E3", „FALA 208") | Usunąć z treści widocznej, zostawić w stopce rewizji |
| Poradnik rozdz. 04 §22.1 | aktualność (drobne) | „Widok domyślnie 3" — najczęstsza realna wartość to 2 (31/75 jednostek) | Zmienić na „zwykle 2–3" |
| Poradnik rozdz. 06 §35.2 | aktualność (drobne) | Bonus Osiedle „+1 do +3" — realnie +1 do +4 (pop 1–4) | Poprawić zakres |
| Poradnik rozdz. 06 §36.5–36.6 | aktualność | „Grace 2 tury" (3×) — realnie 3 tury na normal (2 to wartość hard) | Poprawić na 3 |
| Poradnik rozdz. 08 §50.3 | aktualność | Brak wzmianki o 3-turowej karencji przed startem atrycji z głodu | Doprecyzować „po 3 turach z rzędu na minusie" |
| Poradnik rozdz. 08 (cały rozdział) | aktualność (brak treści) | Brak sekcji o karze za ujemny Skarbiec (analogiczna atrycja jak głód, `R-DEFICYT-ZLOTA-KARA-Q1=A`, 2026-08-06, po ostatniej rewizji rozdziału) | Dopisać podsekcję w §49 |
| Poradnik rozdz. 13 §84.2 | jasność | Celtowie/Germanie: przedsumowane bonusy (np. „+40%") mieszają dwie różne statystyki/warunki bez rozbicia | Rozpisać oba bonusy osobno (nazwa+warunek+statystyka) |
| Poradnik rozdz. 13 §82.4 | aktualność (do weryfikacji) | „Poziomy murów 1–10" — nie znaleziono odpowiadającej mechaniki w kodzie (mur binarny: `wallLevel: maMur?1:0`) | Zweryfikować z autorem czy to relikt czy koncepcja wizualna |
| Poradnik rozdz. 14 §87.3, §89.3 | aktualność | Bonus nauki AI na Trudnym „0" — realnie +2/turę (`ai-params.json`) | Zaktualizować obie wzmianki |
| Poradnik rozdz. 14 §88.4 | przejrzystość | Punkt 4. listy strategii oderwany fizycznie od macierzystej listy przez 2 podsekcje | Przenieść punkt z powrotem pod §88.4 |
| Poradnik rozdz. 14 §87.3 | jasność | Niewyjaśniony żargon „countery" | Dodać odnośnik/zamienić na „system przewag jednostek" |
| Poradnik rozdz. 15 §95.1 | jasność | Notka „(kanon: mnożnik ×3 vs bazowy JSON)" miesza informację dla gracza z historią wewnętrzną repo | Usunąć nawias deweloperski |
| Poradnik rozdz. 17 §100–102 | aktualność | Boks „Skrót Spacja=Wykonaj" sprzeczny z własną treścią rozdziału (§101.3: „nie ma jednego skrótu") | Usunąć/poprawić |
| Poradnik rozdz. 17 §102 | potrzebność (miękka) | Sekcja czysto deweloperska („Dla twórców: panele balansu") w rozdziale „Zaawansowane" dla gracza | Rozważyć wydzielenie do `dyspozycje/`/`docs/` |
| Poradnik rozdz. 28 (nagłówek) | potrzebność | „17 ulepszeń" — realnie 20 aktywnych | Poprawić liczbę, dopisać 5 brakujących wpisów |
| Poradnik rozdz. 28 „Bydło/Trzoda", „Glinianka" | aktualność | Bydło +3 praca vs real +4; Glinianka pomija bonus +2 glina | Zweryfikować i poprawić każdy wiersz liczbowo |
| Poradnik rozdz. 28, 45, 57, 91 | przejrzystość/potrzebność | Boilerplate „Przykład liczbowy" powtórzony 17×/24×/50×/19× z arbitralnym, niewyjaśnionym założeniem „7 pracy/t (70%)" | Wytnij/skróć do jednego wyjaśnienia na start rozdziału |
| Poradnik rozdz. 45 (Pretorium, Łaźnia, Akademia) | przejrzystość | Tabela pokazuje tylko komponent cegły, pomija towarzyszący koszt drewna (40) | Dopisać brakujący komponent |
| Poradnik rozdz. 45 (nagłówek) | potrzebność | „27 z 37" budynków — realnie 24 z 41 | Poprawić liczby |
| Civpedia „Budynki" — poziom `full` | potrzebność | `full` nie jest niezależnym trzecim poziomem głębi, tylko wikiS+wikiM wklejone 1:1 + jedna tabela | Nazwać to wprost jako „M + dodatek", nie osobną głębię |
| Civpedia „Jednostki" (wikiM/full, 49 haseł) | potrzebność | Sekcja „Countery i taktyka" identyczny szablon niezależnie od realnych statystyk jednostki; generator nie czyta pola `Uwagi`, które ma gotowy, zróżnicowany materiał | Wykorzystać pole `Uwagi` w generatorze zamiast szablonu |
| Civpedia „Jednostki" (super-jednostki) | jasność | Brak wyjaśnienia, że koszt 0¤ oznacza limit 1 sztuki + respawn w stolicy (poza Hieros Lochos) | Dodać wyjaśnienie przy każdej super-jednostce |
| Civpedia „Cuda świata" (13/19 haseł) | potrzebność | wikiM/full nie ujawniają konkretnych bonusów — „(patrz JSON)" zamiast gotowych opisów z `bonusy.*.opis` | Wygenerować realną listę bonusów z pól `opis` |
| Civpedia „Cuda świata" (wszystkie 19) | jasność | Brak wymaganego terenu/technologii w sekcji „Budowa" (generyczny tekst) | Dodać linię z realnym `wymagaTerenu`/`techUnlock` |
| Civpedia `cuda/*` | aktualność (drobniejszy) | Porównanie „zwykły Teatr 55 pracy" — Teatr `suppressed`, wchłonięty przez Akademię | Zastąpić aktualnym punktem odniesienia (Akademia) |
| Civpedia „Ulepszenia terenu" (oboz_lowiecki, warzelnia_soli) | aktualność | „+1 złoto/t" — w danych to `bonus.pieniadz`, czyli Pieniądz, nie Złoto (dwa różne zasoby) | Poprawić etykietę na Pieniądz |
| Civpedia `ulepszenia/warzelnia_soli` | jasność/aktualność | Opis terenu/warunku niejasny (podwójna negacja), niezgodny z realnym „wybrzeże ALBO złoże soli" | Przepisać zgodnie z JSON |
| Civpedia `ulepszenia/droga` | jasność | Wewnętrzna sprzeczność liczb w tym samym haśle („+1 handel/t" vs „+2/t czysty zysk") | Ujednolicić |
| Civpedia `ulepszenia/bydlo` | aktualność (drobne) | Przykład „+3 praca/t" — realnie +4 | Poprawić |
| Civpedia „Ulepszenia terenu" — nazwa „Bydło" | jasność | Niespójność z nazwą „Trzoda" widoczną w UI od 2026-07-09 | Zmienić tytuł hasła |
| Civpedia „Ulepszenia terenu" — poziom `full` (16/17 haseł) | potrzebność | `full` to powtórzenie `wikiM` + jedna doklejona (często błędna) sekcja przykładu | Pogłębić realną treścią per ulepszenie (wzorzec: `zalozanie-miasta`) |
| Civpedia `cywilizacje/grecy` | aktualność/jasność | „+15% złota z portów" — realnie „+15% Daniny" (dwa różne pojęcia ekonomiczne, zmiana `e2a054c4`, 2026-07-25) | Poprawić terminologię |
| Civpedia „Cywilizacje" (wszystkie 9 haseł, sekcja „Strategia dla gracza") | potrzebność | Identyczny boilerplate niezależnie od profilu cywilizacji (agresja 9/9 vs 3/9 dostają tę samą radę) | Zróżnicować per cywilizację lub usunąć sekcję |
| Civpedia `pojecia/wladcy` | drobne (aktualność) | Nazwa pliku w przykładzie „portrait-grecja-zelazo.jpg" — realnie „portrait-grecy-zelazo.jpg" | Poprawić nazwę pliku w przykładzie |
| Civpedia `pojecia/szczescie` | jasność | Pole `full` uszkodzone: zaczyna się od tabeli metadanych bez wiersza nagłówka, duplikuje treść wikiS/wikiM; kategoria w tabeli „Miasto i społeczeństwo" vs realna „Pojęcia" | Usunąć zaległy blok i duplikat, poprawić kategorię |
| Civpedia `pojecia/suwak-pracy` | potrzebność (niska waga) | Najsłabsze zróżnicowanie warstw S/M w próbce (M dodaje tylko 2 zdania) | Dopisać realną nową treść do M |
| cityPanel.ts — panel „Kultura i Religia — szczegóły" | jasność | Nagłówek sztywno „Religia — parametry (normal)" mimo że liczby są poprawnie ładowane dla aktualnej trudności | Interpolować `diff` do nagłówka |
| cityPanel.ts — panel „Podział {Danina} — szczegóły" | jasność | Nota końcowa odwołuje się do usuniętej skali „batony 1/2/3" zamiast aktualnego suwaka Wyżywienie 0–6 | Zamienić na „suwak Wyżywienie 0–6" |
| cityPanel.ts (wzorzec systemowy) | aktualność | Kilka paneli zaszywa na sztywno wartość z poziomu trudności `normal` (progi %, tury, cap jednostek) zamiast czytać z tych samych `*Params`, które karta już ładuje | Przegląd całego pliku pod kątem literałów procentowych/turowych |

### Priorytet NISKI — styl / drobne

| Lokalizacja | Typ | Opis | Rekomendacja |
|---|---|---|---|
| Poradnik rozdz. 07 §47.2c | potrzebność | Wzmianka o nieistniejącej jednostce „robotnik" | Usunąć |
| Poradnik rozdz. 07 §47.4 | aktualność (niski priorytet) | Nie uwzględnia wariantu „Taran okuty" (Brąz) | Doprecyzować przy najbliższej edycji |
| Poradnik rozdz. 10 §61.1 | aktualność (drobna) | Brak roli „Morska" w tabeli ról (6 realnych wartości, tabela ma 5) | Dodać wiersz lub doprecyzować pominięcie |
| Poradnik rozdz. 10 §61.1 | aktualność (drobna) | „73, nie 50" jednostek — realnie 75 | Zaktualizować liczbę lub odsyłać do katalogu |
| Poradnik rozdz. 16 (tabela porównania ścieżek) | przejrzystość | Brak numeracji „§" łamiący konwencję reszty rozdziału | Kosmetyczne, niepilne |
| Poradnik rozdz. 17 §102.4 | jasność | Literówka „Enciklopedia"→„Encyklopedia" | Poprawić |
| Poradnik rozdz. 28, 45 | jasność | „Wojskowosc" bez polskiego znaku (dane: „Wojskowość") | Poprawić przy okazji przeglądu nazw technologii |
| Civpedia `ulepszenia/fort` | jasność | Literówka „Wojskowosc" | Poprawić |
| Civpedia „Cuda świata" | potrzebność/aktualność | „np. 2–5¤/t" i „50 tur do absolutu" to fałszywie precyzyjne placeholdery (realny zakres utrzymania 1–3, czas do absolutu zależny od epoki) | Policzyć realne wartości lub oznaczyć jako ilustrację generyczną |
| Civpedia `pojecia/cuda-swiata` | jasność | Pole `full` ma inny format niż karty pojedynczych cudów (brak tabelki nagłówkowej/Wiki-S) | Ujednolicić format |
| Civpedia „Cywilizacje" | jasność | Nagłówek „Trzy linie bonusów (macierz)" mimo 4–5 bonusów w niektórych hasłach; słowo „macierz" to żargon | Zmienić na „Bonusy cywilizacji" |
| Civpedia, Poradnik (całość) | jasność | Mieszanie treści dla gracza z odniesieniami deweloperskimi (nazwy plików `.ts`, kluczy JSON) w kilku miejscach (`wladcy`, `handel-surowcami-dyplomacja`) | Niski priorytet, spójne z ogólnym stylem hybrydowym encyklopedii |

---

## 3. Do zsynchronizowania po zmianie ekonomii ×5 (`R-EKONOMIA-SUROWCE-SKALA-5X-Q1`)

Poniższe miejsca są dziś (częściowo) zgodne ze stanem danych sprzed pełnego wdrożenia zmiany lub jawnie oznaczone przez recenzentów jako czekające na ustabilizowanie się skalowania — **nie poprawiać punktowo teraz**, żeby nie przepisywać tych samych liczb dwukrotnie. Zebrane w jednym miejscu, żeby nie trzeba było szukać ich drugi raz:

1. **Poradnik rozdz. 02 §11.3** i **rozdz. 03 §21.5b** — baza magazynu surowców (500 → realnie 10 000 + mnożnik epoki, mechanizm epokowy pominięty).
2. **Poradnik rozdz. 04** — przykład Włócznika: koszt rekrutacji i utrzymanie jednostek.
3. **Poradnik rozdz. 05** — koszty w Pracy ulepszeń terenu (Farma 20, Droga 15, Kamieniołom 22 itd.), bonusy plonów, koszt założenia miasta.
4. **Poradnik rozdz. 06** — przykłady z konkretnymi kwotami Daniny/Pracy/Żywności netto (§38.6), próg wzrostu `Próg(N)=20+N×16` (jeśli dotknięty), cap ludności 5/8/12 (jeśli dotknięty).
5. **Poradnik rozdz. 07 §47.2a** — „Surowiec (ilość)" rekrutacji jednostek — wartość już raz przeskalowana (2→10/15), `R-EKONOMIA-SUROWCE-SKALA-5X-Q1` explicite obejmuje też koszt surowcowy rekrutacji.
6. **Poradnik rozdz. 08 §53.1/53.2/53.6** — stawki produkcji terytorialnej, cap magazynu.
7. **Poradnik rozdz. 08** — mechanizm zużycia surowców przez obywateli (`computeCitizenResourceDrain`, decyzje 2026-08-10/11/12, wciąż w ruchu) — odłożone świadomie, brak opisu w ogóle.
8. **Poradnik rozdz. 08 §53.5** i **rozdz. 12 §78.2** — wielkość „pakietu" i cennik surowców w PN (nawet jeśli cena/szt. formalnie się nie zmieni, relatywna wielkość pakietu wobec 5× większych zapasów prawdopodobnie wymusi przeskalowanie).
9. **Poradnik rozdz. 15** — czy `wonders.json` (bonusy cudów) wchodzi w zakres zmiany ×5 — do potwierdzenia przez osobę wprowadzającą zmianę.
10. **Poradnik rozdz. 28** — koszty w Pracy ulepszeń terenu i bonusy plonów, potraktować razem z pkt. 3.
11. **Poradnik rozdz. 45** — tabela „Koszt materiałowy — 9 budynków" (Mury, Cytadela, Akademia i in. już dziś dokładnie ×5 za mało po commicie `e401c1c2`).
12. **Poradnik rozdz. 57 §47.2a** (duplikat pkt. 5 w warstwie katalogu jednostek) — kolumna „Koszt ¤" w tabeli zbiorczej warto zweryfikować ponownie po ustabilizowaniu.
13. **Civpedia „Budynki"** (11 haseł: akademia, akademia_wojskowa, baszta, fort, koszary, kuznia, kuznia_zelaza, mury, pretorium, targowisko, warsztat_oblezniczy) — koszt surowców już dziś zaniżony ×5 (commit `e401c1c2` z 2026-08-12 już wdrożony do danych, ale nie do wiki) — priorytet WYSOKI **teraz**, nie po dalszych falach; ponownie zweryfikować, jeśli nastąpi kolejna korekta w tej samej sesji.
14. **Civpedia „Ulepszenia terenu"** — pole `surowiec_ilosc_tura` (dziś 50/turę po zmianie z 2026-08-13) w ogóle nieopisane w hasłach ulepszeń surowcowych (glinianka, kamieniołom, tartak, warzelnia_soli, kopalnie, stadnina) — dodać po ustabilizowaniu wartości.
15. **Civpedia `pojecia/handel-surowcami-dyplomacja`** — cennik surowców w PN, jeśli zmiana ×5 obejmie też ceny handlowe (do potwierdzenia).
16. **Civpedia „Cuda świata"** — kolumna „Bonus miasta" (płaskie liczby +3/+6 itd.) — do ponownej weryfikacji, jeśli skalowanie ×5 obejmie też `wonders.json`.
17. **cityPanel.ts** — żaden z paneli „ściąga" NIE jest dotknięty zmianą ×5 (Zamożność/Podział pracy/Podział handlu operują na Złocie/Pieniądzu, jawnie wyłączonych z tej zmiany) — odnotowane tu wyłącznie dla kompletności, **brak działania wymaganego**.

---

## 4. Panele/hasła bez zastrzeżeń (przegląd był kompletny, nie selektywny)

Poniższe fragmenty zostały tak samo dokładnie zweryfikowane wobec żywego kodu/danych jak reszta zakresu i **nie wykazały rozjazdów**:

1. **Poradnik rozdz. 01** — menu, zapisy, kreator (kroki 2.4–2.6), trudność §5, checklist końcowy; koszt założenia miasta (20 Pracy + 1 ludność, min. 4 heksy) zgodny z `city-founding.ts`.
2. **Poradnik rozdz. 02** — ilustracje typów terenu, mgły wojny, terytorium, warstw kultury/religii, złóż, wyglądu miast, ruchu (§7, 9, 10, 12, 13); poprawnie oznaczone „czego nie ma w v1.0".
3. **Poradnik rozdz. 03** — §14.2 podatki (60/20/20) zgodne z `DEFAULT_PODZIAL_HANDLU`; ogólna struktura §14.1–14.8, §21.1–21.5a najlepiej ustrukturyzowana z całego poradnika.
4. **Poradnik rozdz. 05** — Droga (15 pracy, +1 Handel), Posterunek (+50% obrona, +5 heksów), Fort (+100%/+10 heksów), koszt założenia miasta — wszystkie zgodne z `terrain-improvements.json`/`city-founding.ts`.
5. **Poradnik rozdz. 06** — §35.2a tabela Szczęście-od-Zamożności (10×3 przedziały), §36.2 sześciostopniowa drabinka Ład/Spokój/…/Bunt skrajny, §38.1–38.2 podział Daniny/Pracy, §36.1 garnizon +20 prawa/max 5, §37 Bogactwo≠Złoto.
6. **Poradnik rozdz. 07** — §45.6 bonusy kuźni/koszar/murów (+200/+100/+100%), §47.2b Manpower (epoka1=1000, regen 2%/turę).
7. **Poradnik rozdz. 08** — §49.3a Korupcja, §49.3b Mennica, §53.3 Szlaki handlowe, podział 60/20/20 — wszystkie zgodne z `econ-params.json`/`trade-routes.ts`.
8. **Poradnik rozdz. 09** — §54.1–54.5 (hub, bramki AND, stany węzłów), §55 bramka epok, §56 mapa zależności, tempo gry ×1/×2/×4.
9. **Poradnik rozdz. 10** — §61.2 (12 jednostek +50% vs Mount), §63.1–63.2 (bród, wzgórze/góra) — dokładnie zgodne z `combat-params.json`.
10. **Poradnik rozdz. 11** — milicja 20%/50% siły, mechanika „tylko katapulta burzy mur" — zgodne z `combat-params.json`.
11. **Poradnik rozdz. 12** — §74.1 model 3-osiowy (Wiarygodność/Zaufanie/Szacunek/Relacja), §77.1 progi Otwarte granice/Sojusz, §77.2 Trybut/Ultimatum/Wchłonięcie (wszystkie w Złocie, jawnie wyłączonym z ×5).
12. **Poradnik rozdz. 13** — profile agresji AI (§87.2), reguły kolonizacji AI (min. dystans 4, min. pop 5 dla AI — inny parametr niż pop≥3 dla foundingu z miasta-źródła), tabela „Szybki wybór".
13. **Poradnik rozdz. 16** — cała mechanika zwycięstwa/porażki (dominacja >50% Power, zwycięstwo naukowe, warunki porażki).
14. **Poradnik rozdz. 57** — tabela „Nowe jednostki (2026-07-21+)" w 100% zgodna z `units.json` (24 wiersze × 4 pola).
15. **Poradnik rozdz. 91** — koszty budowy wszystkich 19 cudów, typ dostępu E/R, lista cudów wyścigowych, mechanika wygaśnięcia/absolutu.
16. **Civpedia „Budynki"** — Mury, Koszary, Targowisko, Kuźnia brązu, Port handlowy (poza materiałowym kosztem opisanym osobno wyżej).
17. **Civpedia „Jednostki"** — 46/49 haseł (koszt, populacja, utrzymanie, siła w polu, zasięg, bonusy vs włócznik); hasło „Bród" i „Manpower — pula rekrutów" wzorowo aktualne.
18. **Civpedia „Cuda świata"** — koszty budowy wszystkich 19 cudów, typ dostępu E/R, mechanika absolutu/wygaśnięcia — zgodne co do grosza.
19. **Civpedia „Ulepszenia terenu"** — pozostałe pola poza opisanymi wyżej problemami.
20. **Civpedia „Cywilizacje"** — Inkowie, Zulusi, Egipt, Sumerowie, Germanie (wszystkie liczby bonusów, jednostki specjalne, profile agresji AI, mnożniki handlu/waluty); Chińczycy — jedyne hasło z problemem samo-oznaczonym inline z datą (dobry wzorzec).
21. **Civpedia „Dyplomacja"** — progi Otwarte granice/Sojusz/Trybut/Ultimatum/Wchłonięcie.
22. **Civpedia „Pojęcia"** — `bogactwo` (próg awansu, cap, luksus), `suwak-handlu` (podział 60/20/20, tabela 10 przedziałów zamożności, mnożniki Mennicy, kary za zerwanie umowy), `szlaki-handlowe`, formuła Porządku (poza progiem trudności opisanym wyżej).
23. **cityPanel.ts** — panele „Zamożność — ściąga" (poza brakiem wzmianki o 5-turowym immunitecie — drobna luka kompletności, nie błąd), „Podział pracy — ściąga", „Surowce — szczegóły", „Wyżywienie i wzrost", „Żywność — co to znaczy", „Wzrost ludności — szczegóły" (odporne na dryf z definicji, korzystają wyłącznie z żywych wartości silnika).

---

**Pliki źródłowe do przyszłej edycji:** `gra/src/data/wikiBundle.json` (pola `poradnik` i `encyklopedia`), `tools/generate-encyklopedia.cjs` (bug `||` vs `??`, brak odczytu pól `Uwagi`/`Bonus vs Mount %`), `gra/src/ui/cityPanel.ts` (literały trudności `normal`).
**Dane referencyjne:** `gra/data/{buildings,units,civs,civ-matrix,terrain-improvements,wonders,econ-params,society-params,diplomacy,miasto-params,epoka-ludnosc-manpower,combat-params,tech,ai-params}.json`.

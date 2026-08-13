# Audyt treści opisowych: CivPedia, Poradnik, panele „ściąga"/„szczegóły" w UI

**Data:** 2026-08-13
**Etap:** 1 — WYŁĄCZNIE research i rekomendacje. **Zero zmian w kodzie/danych gry zostało wykonanych.**
**Metoda:** workflow 17 agentów (Sonnet 5): 1× discovery paneli UI, 8× recenzja Poradnika (batch po 1-4 rozdziały), 6× recenzja CivPedii (batch po 1-4 kategorie), 1× recenzja paneli „ściąga" w kodzie UI, 1× synteza. Każdy agent czytał treść w całości i krzyżował liczby z żywym kodem/danymi (`gra/data/*.json`, `gra/src/game/*.ts`), część z `git log`/`git blame` dla ustalenia świeżości rozjazdu.
**Źródła:** `gra/src/data/wikiBundle.json` (pola `poradnik` — 22 rozdziały, `encyklopedia` — 136 haseł), `gra/src/ui/cityPanel.ts` + `gra/src/ui/empireDetailPanel.ts` (panele ściąga wbudowane w UI).

---

## 1. Streszczenie na start

Audyt objął **wszystkie 22 rozdziały Poradnika** (pełny odczyt treści każdego), **wszystkich 136 haseł CivPedii** (tytuły i liczby dla 100%, głęboka lektura pełnej treści dla większości kategorii w całości — wyjątek opisany w §7), oraz **27 paneli „ściąga"/„szczegóły" wbudowanych w kod UI**, z czego **10 zostało recenzowanych z pełnym werdyktem**, a pozostałe 17 tylko skatalogowane (lokalizacja + temat, bez oceny jasności/aktualności).

Stan nie jest „dobra treść z punktowymi problemami" — to **systemowe zaniedbanie dokumentacyjne**, z dwoma niezależnymi mechanizmami błędu, które dominują nad pojedynczymi literówkami:

1. **Rozjazd AKTUALNOŚCI** (treść opisuje mechanikę/liczby, które silnik już zmienił) — zdecydowanie dominujący typ problemu, ok. 3/4 wszystkich znalezisk. Największe: martwa mechanika wzrostu ludności/suwaka żywności opisana w Poradniku rozdz. 06 i w CivPedii „Spichlerz" (usunięta z silnika **2026-07-30**, poradnik nadal ją opisuje jako żywą); usunięta mechanika „pakietów handlowych po 10 szt." (decyzja `R-DYP-PAKIET-USUN`, 2026-08-08) wciąż obecna w 3 miejscach; epoka Żelaza błędnie oznaczona jako niedostępna w kreatorze (dostępna od miesiąca); świeży rebalans ekonomii ×5 z **dzisiejszego dnia** (`e401c1c2`) już nie zgadza się z 11 hasłami CivPedii „Budynki" (koszty zaniżone dokładnie ×5).
2. **Systemowy boilerplate** — w Poradniku niemal każda sekcja każdego z 22 rozdziałów kończy się identycznym, wielokrotnie skopiowanym blokiem „Przykład liczbowy / Strategia gracza / Typowe błędy", często tematycznie **niezwiązanym** z sekcją (np. porada o dyplomacji pod sekcją o mapie świata, opis korupcji Rzymian pod sekcją o łączeniu armii) — 19–39% objętości plików rozdziałów. Analogiczny mechanizm istnieje w CivPedii (Cuda świata, katalog jednostek Poradnika) i generuje w kilku miejscach **fabrykowane liczby przypisane konkretnemu obiektowi gry**, którego w ogóle nie dotyczą (np. Piramidy „kosztują 20 pracy" w boilerplate, realnie 160).

**Najpilniejsze fakty do poprawy** (niezależnie od trwającej równolegle zmiany ekonomii ×5, `R-EKONOMIA-SUROWCE-SKALA-5X-Q1`):
- Poradnik rozdz. 06 i CivPedia „Spichlerz" opisują martwy mechanizm wzrostu ludności — najważniejszy system gry, opisany błędnie.
- Poradnik rozdz. 57 (katalog jednostek): **47 z 47** wartości „Moc w polu" w prozie są błędne, sprzeczne z tabelą zbiorczą w tym samym dokumencie.
- CivPedia „Cuda świata": błędny mechanizm bonusu („×3 w mieście wzniesienia") powtórzony identycznie we wszystkich 19 kartach, sprzeczny z własnym hasłem zbiorczym.
- CivPedia „Budynki": 11/25 haseł ma koszt surowców zaniżony dokładnie ×5 po dzisiejszym commicie, 13/25 podaje błędny maksymalny poziom rozbudowy.

To dokument roboczy do decyzji o priorytetach Etapu 2 — żadna z poniższych rekomendacji nie została jeszcze wdrożona (§7).

---

## 2. Znaleziska systemowe

### 2a. Boilerplate w Poradniku — mechanizm i skala

Każda sekcja (`##`/`###`) każdego z 22 rozdziałów kończy się trójką podsekcji `### Przykład liczbowy` / `### Strategia gracza` / `### Typowe błędy`. To nie są warianty tekstu dostosowane do treści — to jeden z ok. 4 gotowych szablonów wklejany **słowo w słowo**, niezależnie od tematu sekcji. Zmierzone programowo przez agentów:

| Rozdział | Wystąpień bloku | Unikalnych wariantów | % objętości pliku |
|---|---|---|---|
| 00-jak-czytac | 7× | 2 | 38,9% |
| 01-pierwsze-kroki | 7× | 3 | 28,7% |
| 02-mapa-swiata | 8× | 6 | 26,2% |
| 03-pasek-zasobow | 8× | 6 | 23,4% |
| 04-jednostki-mapa | 7/8 sekcji | — | — |
| 07-miasto-budowa-rekrutacja | 8/8 sekcji | — | ~19% |
| 14-ai-zagrozenia | 5× | — | 22,6% |
| 15-kultura-religia-cuda | 6× | — | 30,5% |
| 16-zwyciestwo | 4× | — | 29,5% |
| 17-zaawansowane | 3× | — | 27,2% |
| 28-katalog-ulepszen | 17× | — | znaczna część pliku |
| 45-katalog-budynkow | 24× | — | znaczna część pliku |
| 57-katalog-jednostek | 47× (jedna z 47 sekcji jednostek) | — | ~200 z ~750 linii |
| 91-katalog-cudow-antyk | 19× | — | — |

Konkretne dowody bezsensowności zebrane przez agentów:
- W `02-mapa-swiata` po sekcji o typach terenu stoi boks o relacjach dyplomatycznych; po sekcji o mgle wojny — boks o bonusie korupcyjnym Rzymian; po sekcji o terytorium — boks o walce z barbarzyńcami.
- W `10-walka` akapit o **oblężeniu** („zapas żywności oblężenia 24…") pojawia się 5× w rozdziale o walce polowej.
- W `11-oblezanie` sekcja o checklist obrony przy szturmie kończy się boksem o dyplomacji („Relacja +15… Prezent +8 PN…").
- W `13-cywilizacje` boks „Rzymianie: bonus −5% kary korupcji" powtórzony 4×, mimo że w danych źródłowych (`civs.json`) **Rzymianie nie mają żadnego bonusu do korupcji** — to fikcyjna liczba.
- W `17-zaawansowane` boks „Skrót Spacja=Wykonaj" jest **samosprzeczny z własną treścią rozdziału** (§101.3 wprost mówi „nie ma jednego skrótu").
- W `91-katalog-cudow-antyk` boks „Koszt 20 pracy… Bonus +2 żywność… Utrzymanie 1¤/t" powtórzony 19× — **Piramidy realnie kosztują 160 pracy**, Terakotowa armia 320 pracy i ma utrzymanie 3¤ (nie 1), a kilka cudów (Terakotowa armia, Koloseum, Dur-Sharrukin) **w ogóle nie ma bonusu żywności**, mimo że boks twierdzi inaczej dla każdego z nich.
- W `57-katalog-jednostek` boks mówi o „budynkach" i koszcie w „pracy" — mimo że rozdział dotyczy jednostek, rekrutowanych za złoto+Manpower, nie pracę.

**Co znaczyłoby to naprawić:** usunięcie mechanizmu generowania tych bloków (wygląda na artefakt automatycznego wypełniania z globalnej puli przykładów, prawdopodobnie `gen-poradnik-batch.py`/`gen-poradnik-batch.py`-podobne narzędzie wsadowe). Jeśli „Przykład liczbowy" ma zostać jako format, każdy musi być napisany osobno, tematycznie dopasowany, z realnymi liczbami z danej sekcji — nie kopiowany. To operacja czysto redakcyjna (bez ryzyka merytorycznego), obejmująca **dziesiątki wystąpień w kilkunastu rozdziałach jednocześnie**.

### 2b. Analogiczny wzorzec w CivPedii

- **„Cuda świata"** (19 haseł): identyczny błędny opis mechanizmu bonusu miasta („×3 plony w mieście wzniesienia") we wszystkich 19 kartach — sprzeczny z żywym kodem (`wonders-data.ts:190-197`: bonus trafia flat do **każdego** miasta imperium, bez potrojenia) i sprzeczny z własnym hasłem zbiorczym `pojecia/cuda-swiata`, które ma to opisane poprawnie.
- **„Jednostki"** (49 haseł): sekcja „Countery i taktyka" w wikiM/full to identyczny szablon niezależnie od realnych statystyk — elitarny miecznik z pilum (Hastati, moc w polu 57,5) i podstawowy topornik bez dystansu (32,5) dostają dosłownie ten sam akapit taktyki, mimo że generator ma dostęp do pola `Uwagi` w `units.json` z gotowym, zróżnicowanym materiałem, którego nigdy nie czyta.
- **„Cywilizacje"** (9 haseł): sekcja „Strategia dla gracza" identyczna słowo w słowo we wszystkich 9 hasłach, niezależnie od profilu agresji cywilizacji (Zulusi 9/9 vs Sumerowie 3/9 dostają tę samą radę).

### 2c. Rozjazd po zmianie ekonomii ×5 (`R-EKONOMIA-SUROWCE-SKALA-5X-Q1`, commit `e401c1c2`, dzisiejszy)

Commit z **dzisiaj** przeskalował `koszt_surowce` w `buildings.json` (drewno/kamień/cegła) ×5 dla wszystkich budynków. Wiki nie zostało zaktualizowane — potwierdzono **11 haseł CivPedii „Budynki"** z kosztem zaniżonym dokładnie ×5 (np. akademia: wiki 8×drewno/14×cegła vs realne 40×/70×). Agenci sygnalizują, że ten sam commit dotknął też `units.json` i `terrain-improvements.json` — ale **nikt nie zweryfikował wprost**, czy analogiczny rozjazd ×5 dotyka też CivPedii „Jednostki"/„Ulepszenia terenu" (agent ency_0 to tylko rekomenduje jako kolejny krok, nie wykonuje). Otwarta luka w pokryciu audytu — patrz §7.

### 2d. Bug w generatorze CivPedii — fabrykowane liczby dla jednostek o koszcie 0

`tools/generate-encyklopedia.cjs:97-100`:
```js
const gold = u['Pieniądz (koszt)'] || 10;
const utrzG = u['Utrzymanie (Pieniądz/turę)'] || 1;
```
W JS `0 || 10` daje `10` — dla każdej jednostki z realnym kosztem/utrzymaniem = 0 (super-jednostki) sekcja „Przykład liczbowy" pokazuje fałszywe „Rekrutacja: 10¤"/„Złoto: 20¤", sprzeczne z sekcją Wiki-S/M na **tej samej stronie**, która poprawnie mówi „0¤". Dotyczy **7 z 8** super-jednostek (Hieros Lochos, Triari, Hu Ben Wei, uThulwana, Królewska Gwardia, Medżaj, Gwardia Królewska Sumeru). To błąd kodu generatora, nie tylko danych — odtworzy się przy każdej przyszłej regeneracji, dopóki `||` nie zostanie zamienione na `??`.

### 2e. cityPanel.ts — literały poziomu trudności „normal" zaszyte na sztywno

4 z 5 problemów znalezionych w panelach „ściąga" (§3) mają wspólną przyczynę: panel czyta poprawnie dane dla aktualnej trudności gracza, ale **tekst opisowy obok liczb** zaszywa na sztywno wartość progu/tury/capu z poziomu `normal`, mimo że dane w `society-params.json` różnią się per trudność. Efekt: gracz na `easy`/`hard` widzi poprawną liczbę w tabeli, ale błędny opis słowny obok niej.

---

## 3. Panele „ściąga"/„szczegóły" w kodzie UI (27 znalezionych)

Wszystkie w `gra/src/ui/cityPanel.ts`, poza jednym w `gra/src/ui/empireDetailPanel.ts`. **10 z 27 zostało recenzowanych z pełnym werdyktem** (kolumna Werdykt); pozostałe 17 są tylko skatalogowane lokalizacyjnie — patrz zastrzeżenie w §7.

### Recenzowane z werdyktem

| Panel | Lokalizacja | Werdykt |
|---|---|---|
| „Zamożność — ściąga" | `buildWealthDetailCard` @4479 (nagł. 4507) | **Poprawny.** Wzory 1:1 z `wealth.ts`. Drobna luka: nie wspomina o 5-turowym immunitecie od spadku W po założeniu miasta. |
| „Podział pracy — ściąga" | `buildPracaDetailCard` @4601 | **Poprawny.** `splitPraca()` i warunek konwersji doPuli→pieniądz opisane zgodnie z kodem. |
| „Okolica — ściąga" | `buildOkolicaDetailCard` @8592 | **Nieaktualny.** Przykładowe wagi profilu „Żywność" (3/0,5/0,5) — realnie `{10,0,0}` od commitu `1258ba28`. |
| „Porządek — szczegóły" | `buildPorzadekDetailCard` @3118 | **Nieaktualny (2 przypadki).** Próg Bunt/Bunt skrajny „10%" i „2 tury grace" — to wartości hard, na normal realnie 12%/3 tury. Cap garnizonu „5+ jednostek" — na hard realnie 4. |
| „Kultura i Religia — szczegóły" | `buildKulturaDetailCard` @3513 | **Częściowo nieaktualny (jasność).** Nagłówek sztywno „Religia — parametry (normal)" mimo że liczby ładują się poprawnie dla aktualnej trudności — myląca etykieta. |
| „Podział {danina} — szczegóły" | `buildHandelDetailCard` @9745 | **Częściowo nieaktualny.** Nota końcowa odwołuje się do usuniętej skali „batony 1/2/3" zamiast aktualnego suwaka Wyżywienie 0–6. |
| „Surowce — szczegóły" | `buildSurowceDetailCard` @3395 | **Poprawny.** Czysto opisowy, bez liczb podatnych na dryf. |
| „Wyżywienie i wzrost — szczegóły" | `buildRacjeWzrostDetailCard` @5086 | **Poprawny.** Korzysta wyłącznie z żywych wartości silnika, odporny na dryf z definicji. |
| „Żywność — co to znaczy" | `buildTopBarZywnoscDetailCard` @5194 | **Poprawny**, tak jak wyżej. |
| „Wzrost ludności — szczegóły" | `buildGrowthProgressTooltipCard` @1501 | **Poprawny**, tak jak wyżej. |

### Skatalogowane, BEZ recenzji jasności/aktualności (do dispatchu w Etapie 2)

| Panel | Lokalizacja | Temat |
|---|---|---|
| „Zdrowie — szczegóły" | `buildZdrowieDetailCard` @3259 | Bonusy/kary zdrowotne i wpływ na wzrost % |
| „Religia — szczegóły (wariant fallback)" | inline @3789–3805 | Uboższy wariant karty Religii bez CityView |
| „Zamożność — szczegóły (wariant kompaktowy)" | `buildWealthCompactTooltipCard` @3974 | Skrócony tooltip Zamożności |
| ⚔ „Rekruci (pobór wojskowy)" | `buildTopBarRekruciDetailCard` @5264 | Chip Manpower górnego paska |
| 👥 „Ludność — co to znaczy" | `buildTopBarLudnoscDetailCard` @5296 | Chip Ludność |
| 🔨 „Praca — co to znaczy" | `buildTopBarPracaDetailCard` @5382 | Chip Praca |
| 💰 „Pieniądz — co to znaczy" | `buildTopBarZlotoDetailCard` @5433 | Chip Skarbiec/Pieniądz |
| „Nauka — co to znaczy" | `buildTopBarNaukaDetailCard` @5513 | Chip Nauka |
| 🎭 „Kultura — co to znaczy" | `buildTopBarKulturaDetailCard` @5558 | Chip Kultura (skrócona wersja) |
| 🛕 „Religia — co to znaczy" | `buildTopBarReligiaDetailCard` @5601 | Chip Religia (główny wariant) |
| „Rekrutacja — szczegóły" | `buildRecruitTabDetailCard` @7961 | Zakładka rekrutacji jednostek |
| „Skład bonusów — {budynek}" | `buildUpgradeBonusDetailCard` @8070 | Łańcuch upgrade budynku |
| „Garnizon — szczegóły" | `buildGarnizonDetailCard` @8479 | Wpływ garnizonu na Prawo/Porządek/obronę |
| „[Budynek] — karta charakterystyki" | `buildBuildingDetailCard` @6813 + `buildBuildingBuildTabDetailCard` @6952 | Info-card pojedynczego budynku (inna kategoria niż ściąga mechaniki) |
| „Budynki w mieście (N)" | `buildOwnedBuildingsDetailCard` @7054 | Lista posiadanych budynków |
| „[Jednostka] — karta jednostki" | `buildUnitDetailCard` @7086 | Info-card pojedynczej jednostki |
| „Zobacz szczegóły zużycia" | `resUsageDetailsHtml` @998-1035, `empireDetailPanel.ts` | Rozbicie zużycia surowca (Budynki/Obywatele/Wojsko) |

### Duplikaty/nakładające się warianty — do decyzji właściciela

- **Zamożność ma dwa warianty:** „Zamożność — szczegóły (wariant kompaktowy)" (`buildWealthCompactTooltipCard` @3974, ~45 linii) vs pełna „Zamożność — ściąga" (`buildWealthDetailCard` @4507, ~122 linii). Nie jest jasne z samego kodu, czy to celowe rozróżnienie kontekstowe (tooltip vs pełny panel) czy duplikacja treści do konsolidacji — **nie recenzowane pod kątem pokrywania się treści**.
- **Religia ma cztery punkty styku:** pełny panel łączony „Kultura i Religia — szczegóły" (@3513, ~150 linii, najdłuższy nowo znaleziony panel), uboższy „wariant fallback" inline (@3789–3805, ~15 linii, używany bez CityView), chip górnego paska 🛕 „Religia — co to znaczy" (@5601, ~46 linii, „główny panel Religii" wg agenta rozpoznawczego) oraz chip 🎭 „Kultura — co to znaczy" (@5558, skrócona wersja obok pełnej karty). Cztery miejsca opisujące pokrewne mechaniki tym samym graczowi — kandydat do przeglądu pod kątem spójności/konsolidacji, ale **żaden z wariantów poza głównym (Kultura i Religia) nie został zrecenzowany pod kątem treści**.

---

## 4. Rozdziały Poradnika (22/22 — pełne pokrycie)

| # | Rozdział | Werdykt | Najważniejsze ustalenie |
|---|---|---|---|
| 00 | jak-czytac | Wymaga poprawek | „9 typów cywilizacji" — realnie 15 (`civs.json`, zmiana z 2026-07-09, poradnik rev. G z 2026-08-04 — rozjazd trwa mimo nowszej rewizji). §0.5–0.6 to opis architektury dokumentacji zespołu, nie treść dla gracza. |
| 01 | pierwsze-kroki | Wymaga poprawek (wysoki priorytet) | „Epoka Żelaza — Wkrótce, niedostępna" — realnie w pełni wybieralna od 2026-07-09 (`newGameFlow.ts`: `avail:true`). Sama lista 9 cywilizacji też nieaktualna. Reszta (menu, zapisy, kreator, trudność) zgodna z kodem. |
| 02 | mapa-swiata | Dobry, punktowe problemy | Sprzeczność wewnętrzna: „zasięg wzroku 3 heksy" w tekście vs „2" w boksie przykładu; brak w kodzie osobnego parametru „zasięg wzroku jednostki" — możliwe, że cała mechanika opisana w §8.1 nie istnieje. Baza magazynu „500" — do ×5. Żargon deweloperski w nagłówkach („decyzja E3", „FALA 208"). |
| 03 | pasek-zasobow | Dobry, najlepiej ustrukturyzowany | Suwak żywności „domyślnie 30% wojsko/70% rozwój" — realnie **100/0** (`DEFAULT_PROCENT_ROZWOJ=100`, od 2026-07-03, sprzeczne z jednoznacznym komentarzem w kodzie — do potwierdzenia z właścicielem). Podatki 60/20/20 zgodne. Baza magazynu „500" — do ×5 (razem z rozdz. 02). |
| 04 | jednostki-mapa | Dobry merytorycznie | Przykład Włócznika: „Moc w polu 8" — realnie `fieldPower=44` (5× różnica); koszt „20 pracy" — realnie 16 Pieniądza, inny zasób. „Widok domyślnie 3" — najczęstsza realna wartość to 2. |
| 05 | budowa-mapa | Bardzo dobry | Jedyny błąd: Farma „+2 żywność" — realnie +3 (błąd od pierwszego commitu, nie efekt ×5). Droga, Posterunek, Fort, koszt założenia miasta — wszystko zgodne co do liczby. |
| 06 | miasto-spoleczenstwo | **KRYTYCZNY** | Cała opisana mechanika „bufora wzrostu do progu" i „suwaka Żywność 70/30" (§33.2-3, §33.6, §38.3, cała §39 o Spichlerzu) to **martwy kod** — `populationGrowth()` nigdzie niewywoływana; żywy system to model „Wyżywienie 0–6" (`computeGrowthPercentV85`, od 2026-07-30). Tabela §35.3 „co obniża szczęście" ma pomylone kolumny trudności (wartości hard podane jako normal), błąd powielony ~8× w rozdziale. Limit ludności bez Akweduktu „6" — realnie 5, brak wzmianki o stopniu pośrednim (Spichlerz→8). Reszta (grid Szczęście-Zamożność, drabinka Porządku, podziały Daniny/Pracy, garnizon) dokładnie zgodna. |
| 07 | miasto-budowa-rekrutacja | Wymaga poprawek | Promień okolicy „domyślnie 3 heksy" — realnie baza 5, rosnąca z populacją do 15. Ostrzeżenie o koszcie złota Triari/Wojownika germańskiego nieaktualne (realnie 0¤ od 2026-07-23). Wzmianka o nieistniejącej jednostce „robotnik". Bonusy kuźni/koszar/murów, Manpower — zgodne. |
| 08 | ekonomia-imperium | **Wymaga przepisania** | Tabela kosztów surowcowych budynków podaje „ceramikę"/„cegłę" tam, gdzie realnie jest drewno+kamień — **sprzeczna wewnętrznie z rozdz. 07 §45.5** tego samego poradnika. Mechanika „pakietów po 10 szt." usunięta (`R-DYP-PAKIET-USUN`, 2026-08-08), cennik nieaktualny, brakuje 8 realnych surowców handlowych. Brak całej sekcji o karze za ujemny Skarbiec (analogiczna do głodu, decyzja z 2026-08-06). Korupcja/Mennica/Szlaki handlowe — zgodne. |
| 09 | nauka-epoki | Dobry, jeden poważny brak | Sekcja obiecuje „pełny wzór" kosztu badań, ale pomija czwarty mnożnik ×2 dla epoki Brąz/Żelazo (`FALA2`, 2026-08-04) — realny koszt dla 2/3 wdrożonych epok to ×4, nie ×2. Reszta (hub, bramki, tempo gry) zgodna. |
| 10 | walka | Wymaga poprawek | System doświadczenia: poradnik opisuje 3 poziomy liczone od „przeżytych bitew" — realnie 4 progi liczone WYŁĄCZNIE od wygranych. Tabela ról pomija „Morska" (6. realna wartość). „73, nie 50" jednostek — realnie 75. Bród, wzgórze/góra, bonus vs Mount — zgodne. Żargon dev w nagłówkach („coef v2b", „M_pole"). |
| 11 | oblezanie | Merytorycznie najsolidniejszy, 1 poważny błąd | „Poziom muru daje stały bonus 5+3/poziom" — mechanika „poziomu muru" **nie istnieje**; realnie Mury = +200% (binarne), Cytadela/Baszta +100% każda, procentowo. Milicja, „tylko katapulta burzy mur" — zgodne. |
| 12 | dyplomacja | Wymaga poprawek | Próg Handlu „Relacja≥40" — w kodzie silnika to 0, a w hardkodzie UI to 100 — **trzy rozbieżne wartości** w trzech miejscach. Warunek NAP „oraz Zaufanie≥40" — takie pole w ogóle nie istnieje w kodzie (pomylone z inną bramką). Otwarte granice/Sojusz/Trybut/Ultimatum — zgodne co do grosza. |
| 13 | cywilizacje | Wymaga poprawek | Rzymianie „+35% odnowy poboru" — realnie ×2 (+100%). Kary bojowe Chińczyków/Zulusów istnieją tylko w pliku niepodłączonym do walki (`civ-matrix.json`) — prawdopodobnie **nie działają w grze**, mimo że poradnik przedstawia je jako aktywne. Celtowie/Germanie: dwa różne bonusy przedsumowane pod jedną etykietą. „Poziomy murów 1–10" — brak odpowiadającej mechaniki w kodzie, prawdopodobny relikt. Reszta (Grecy, Inkowie, Egipt, Sumerowie) zgodna. |
| 14 | ai-zagrozenia | Dobry, drobne braki | Bonus nauki AI na Trudnym „0" — realnie +2/turę. Osierocony punkt 4. listy strategii (fizycznie odklejony przez 2 podsekcje). Niewyjaśniony żargon „countery". Profile agresji AI, reguły kolonizacji — zgodne. |
| 15 | kultura-religia-cuda | Dobry | Jedna myląca notka deweloperska („kanon: mnożnik ×3 vs bazowy JSON") mieszająca informację dla gracza z historią repo. Absolut, utrzymanie po wygaśnięciu, turystyka — zgodne. |
| 16 | zwyciestwo | Solidny, brak zastrzeżeń merytorycznych | Próg dominacji, zwycięstwo naukowe (oba warunki), warunki porażki — wszystko zgodne z `victory.ts`. Jedyna uwaga: brak numeracji w jednej tabeli (kosmetyka). |
| 17 | zaawansowane | Wymaga poprawek | Boks „Skrót Spacja=Wykonaj" **sprzeczny z własną treścią rozdziału** (§101.3 mówi że jednego skrótu nie ma). Literówka „Enciklopedia". Sekcja §102 czysto deweloperska w rozdziale dla gracza (miękka rekomendacja przeniesienia). Save/load, skróty klawiszowe — bez zastrzeżeń. |
| 28 | katalog-ulepszen | **Wymaga przepisania** | Nazwa „Bydło" przestarzała (w grze „Trzoda" od 2026-07-09). Wiersz „Kopalnia" opisuje mechanikę usuniętą (`R-KOPALNIA-UNIWERSALNA-Q1=B`, 2026-07-30) — zastąpioną 3 osobnymi kopalniami, żadna nieopisana. Brakuje 5 realnych ulepszeń. Systemowo pominięty bonus Handlu w każdym wierszu. Fabrykowana linia „Utrzymanie 1¤/t" powtórzona w ~17 miejscach — taki koszt w silniku nie istnieje. Sekcja „Wyrąb" opisuje kompletnie inną, przestarzałą mechanikę. |
| 45 | katalog-budynkow | **Wymaga przepisania** | Świątynia: zła epoka/technologia (Kamień/Mistycyzm zamiast Brąz/Religia), brak wymaganego prerekwizytu. Pałac: opisuje poziomowanie, które nie istnieje (`maksPoziom:1`, pole `przyrost` martwe) — realny awans to osobne budynki Pałac II/III. Ten sam wzorzec fałszywego poziomowania w 5 kolejnych budynkach. Tabela kosztów materiałowych ×5 za mało (dzisiejszy rebalans) + błędne surowce (ceramika zamiast drewna/kamienia). Licznik „27 z 37" nieaktualny (realnie 24 z 41). |
| 57 | katalog-jednostek | **KRYTYCZNY** | **47 z 47** wartości „Moc w polu" w prozie błędne, sprzeczne z tabelą zbiorczą w tym samym dokumencie (np. Taran 177,5 vs realnie 352,5). 6 jednostek Żelaza: proza mówi „Brązownictwo", realnie Hutnictwo/Obróbka żelaza. Fałszywe ostrzeżenie o koszcie złota Triari/Wojownika germańskiego (realnie 0¤). Tabela „Bonus vs Mount" niekompletna (12 zamiast 15). Brak 2 jednostek w rozdziale. Sekcja o epoce Średniowiecze opisuje usuniętą przed miesiącem zawartość. Tabela zbiorcza i „Nowe jednostki" — w 100% zgodne z danymi. |
| 91 | katalog-cudow-antyk | **Wymaga przepisania** | 7 cudów ma błędną epokę/technologię (Posąg Peruna: Kamień w wiki vs realnie Żelazo — najpoważniejszy przypadek). 13/19 cudów ma niekompletny opis bonusów cywilizacyjnych. Boks „Przykład liczbowy" powtórzony 19× z fabrykowanymi liczbami (koszt/bonus/utrzymanie nie mające związku z realnym cudem). Termin „Danina" nieaktualny (UI: „Podatek" od 2026-07-27) + błędny fakt o bonusie ruiny (+10 Handlu, nie Daniny). Koszty budowy, typ dostępu E/R, mechanika absolutu — zgodne co do grosza. |

---

## 5. CivPedia — 136 haseł w 6 grup kategorii

| Kategoria (liczba haseł) | Werdykt | Najważniejsze ustalenie |
|---|---|---|
| **Budynki** (25) | **Wymaga przepisania (systemowe)** | 11/25 haseł ma koszt surowców zaniżony dokładnie ×5 po dzisiejszym commicie `e401c1c2` (np. akademia: wiki 8×drewno/14×cegła vs realne 40×/70×). 13/25 (52%) podaje generyczne „maksymalnie 10 poziomów" — realny `maksPoziom` to 1–3. Pałac: 3 błędne liczby na 3 (kultura/zadowolenie/mnożnik — mnożnik jawnie wyzerowany w silniku jako martwy). Biblioteka/Świątynia: koszt w nieistniejącym surowcu „ceramika". Spichlerz: myli poziom 1/2 z osobnym budynkiem Spichlerz II. Zgodne: Mury, Koszary, Targowisko, Kuźnia brązu, Port handlowy (poza kosztem materiałowym). |
| **Jednostki + Jednostki i walka + Wojsko i miasto** (51: 49+1+1) | **Wymaga poprawek punktowych** | Wojownik germański: zły koszt (16¤ vs realne 0¤) i brak wzmianki o statusie super-jednostki. 3 jednostki (Falanga, Wojownik mykeński, Wojownik germański) mają w danych bonus +50% vs kawaleria, nieopisany w wiki (bug generatora nie czyta tego pola). Zwiadowca: błędne utrzymanie (1¤/1 żywność vs realne 0/0). Bug generatora fabrykuje liczby dla 7/8 super-jednostek (§2d). Sekcja „Countery i taktyka" — identyczny szablon niezależnie od statystyk (§2b). Bród i Manpower — wzorcowe, w pełni aktualne. 46/49 jednostek zgodnych liczbowo. |
| **Cuda świata + Kultura i cuda** (20: 19+1) | **Wymaga przepisania (systemowe)** | Błędny mechanizm bonusu „×3 plony w mieście wzniesienia" powtórzony identycznie we wszystkich 19 kartach, sprzeczny z żywym kodem i z własnym hasłem zbiorczym. wikiM/full nigdy nie mówią konkretnie, co dany cud daje — delegują do „(patrz JSON)", mimo że pola `opis` w danych mają gotowy, czytelny tekst. Brak wymaganego terenu/technologii w sekcji „Budowa" we wszystkich 19 kartach. Punkt odniesienia „zwykły Teatr 55 pracy" nieaktualny (Teatr `suppressed`, wchłonięty przez Akademię). Koszty budowy, typ dostępu E/R, mechanika absolutu/wygaśnięcia — zgodne co do grosza we wszystkich 19. |
| **Ulepszenia terenu + Mapa i ekspansja** (18: 17+1) | **Wymaga przepisania** | Hasło „Kopalnia" opisuje ulepszenie usunięte z gry (rozdzielone na 3 kopalnie), brakuje 5 realnych haseł (Stadnina, 3× Kopalnia, Droga brukowana). Lama: błędny teren (sugeruje płaski teren, w grze zablokowane). Tarasy: brak wymogu technologii. Wyrąb: trzy wzajemnie sprzeczne liczby kosztu w jednym haśle. Sekcja AI (`zalozanie-miasta`): błędny próg populacji (5 vs realne 3) i mylenie normy z wyjątkiem (2 foundingi/turę to rzadki surge, nie standard). Brak pola `surowiec_ilosc_tura` (dziś 50/turę) we wszystkich hasłach surowcowych. Fort/Posterunek: fikcyjny przykład bonusu żywności mimo `bonus:{}` w danych. |
| **Cywilizacje + Cywilizacje i dyplomacja + Dyplomacja** (12: 9+1+2) | **Wymaga poprawek punktowych** | „Handel surowcami — dyplomacja": cała treść oparta o usuniętą mechanikę pakietów, 3/6 cen błędnych, brak 8 realnych surowców. „Wiarygodność": błędny próg NAP (−40 zamiast realnego 0, zmiana z 2026-08-07). Celtowie: zła jednostka specjalna („Miecznik galijski" zamiast „Soldurii", zmiana sprzed dnia wygenerowania hasła). Rzymianie: brak bonusu „2× pula Manpower", błędne liczby regen poboru. Grecy: myli „złoto" z „Daniną" (dwa różne zasoby). Inkowie/Zulusi/Egipt/Sumerowie/Germanie — w pełni zgodne, w tym profile agresji AI i mnożniki handlu dla wszystkich 9. Sekcja „Strategia dla gracza" identyczna w 9/9 hasłach niezależnie od profilu cywilizacji (§2b). |
| **Pojęcia + Miasto i społeczeństwo + Nauka i epoki + Ekonomia imperium** (10: 5+3+1+1) | **Wymaga przepisania (częściowo)** | „Spichlerz": najbardziej przestarzałe hasło w całej próbce — pojemność zapasów, mechanika drenażu (dziś podniesiona z 5 na 25/turę), Spichlerz II, twardy cap ludności 5/8/12 — wszystko nieopisane lub błędne, część zmian weszła dosłownie dzisiaj. „Szczęście": błędne stałe SzMax (12/18/24 vs realne 14/20/28), pole `full` uszkodzone (zdublowana treść, zła kategoria w metadanych). „Bunt"/„Porządek": uśredniona kara niepokoju (powinny być 2 różne wartości), progi buntu podane dla trudności hard zamiast normal. „Drzewko technologii": błędny poziom i koszt bazowy przykładu (Łucznictwo). „Suwak żywności": błędny domyślny podział (70/30 vs realne 100/0). Zgodne: Bogactwo, Suwak handlu (najlepiej udokumentowane hasło w próbce), Szlaki handlowe, formuła Porządku. |

---

## 6. Rekomendacje priorytetowe

### (a) Szybkie poprawki (pojedyncze liczby/fakty, niskie ryzyko, do wykonania niezależnie od reszty)

1. CivPedia „Budynki" — 11 haseł z kosztem zaniżonym ×5 po dzisiejszym commicie — **poprawić od razu, nie czekać**, bo to już dziś nieaktualne, nie „do zsynchronizowania po ×5" (zmiana już weszła do danych).
2. Poprawić bug generatora `tools/generate-encyklopedia.cjs:97-100` (`||`→`??`) — jedna linia kodu naprawia fałszywe liczby na 7 stronach super-jednostek jednym ruchem.
3. Poradnik rozdz. 01/00 — poprawić dostępność epoki Żelaza i listę 15 cywilizacji (obie sprawy dotyczą pierwszego kontaktu nowego gracza z kreatorem).
4. Poradnik rozdz. 06/CivPedia „Szczęście" — poprawić stałe SzMax (12/18/24→14/20/28) i tabelę „co obniża szczęście" (kolumny trudności były pomylone).
5. Poradnik rozdz. 11 i 13 — mur „5+3/poziom"→+200% procentowe; Rzymianie regen poboru +35%→×2.
6. CivPedia „Wiarygodność" — próg NAP −40→0. CivPedia „Celtowie" — jednostka specjalna Miecznik galijski→Soldurii.
7. Poprawić literówki: „Enciklopedia"→„Encyklopedia", „Wojskowosc"→„Wojskowość" (kilka miejsc).
8. cityPanel.ts — poprawić 3 literały: wagi profilu Okolica, nota „batony 1/2/3"→„Wyżywienie 0–6", nagłówek Religii z „(normal)" na dynamiczny.

### (b) Większe prace redakcyjne (przepisanie/regeneracja, wyższe ryzyko pomyłki, warto zlecić partiami)

1. **Usunięcie mechanizmu boilerplate** w całym Poradniku (22 rozdziały) i w CivPedii „Cuda świata"/„Jednostki" — największy zysk czytelności, zero ryzyka merytorycznego, ale duży wolumen (setki wystąpień łącznie).
2. **Przepisanie Poradnika rozdz. 06** (mechanika wzrostu ludności/Spichlerza) i **CivPedii „Spichlerz"** od zera pod aktualny model „Wyżywienie" — wymaga wiedzy merytorycznej właściciela o docelowym UI, to nie jest prosta korekta liczby.
3. **Regeneracja CivPedii „Cuda świata"** (19 kart) — poprawny mechanizm bonusu, uzupełnienie realnych opisów z pól `opis` w JSON (dane już istnieją, brakuje tylko podłączenia), dodanie wymogu terenu/technologii.
4. **Przepisanie Poradnika rozdz. 08** (tabela kosztów budynków — dziś sprzeczna z rozdz. 07 tego samego dokumentu) i **rozdz. 91** (7 cudów ze złą epoką/technologią, 13/19 niekompletnych bonusów).
5. **Przepisanie Poradnika rozdz. 28** (Kopalnia/Bydło/systemowy brak kolumny Handel) i **rozdz. 45** (Świątynia/Pałac fałszywe poziomowanie, 5 budynków tym samym wzorcem błędu).
6. **Przepisanie Poradnika rozdz. 57** — usunięcie 47 błędnych wartości „Moc w polu" z prozy (odsyłać tylko do tabeli zbiorczej), poprawa technologii dla 6 jednostek Żelaza.
7. **CivPedia „Ulepszenia terenu"** — usunięcie/rozbicie martwego hasła „Kopalnia", dopisanie 5 brakujących ulepszeń, przepisanie „Wyrąb" od zera.
8. **CivPedia „Handel surowcami — dyplomacja"** — pełne przepisanie pod aktualny cennik bez mechaniki pakietów (13 pozycji zamiast 6).

### (c) Pytania wymagające decyzji właściciela (przed jakimkolwiek Etapem 2)

1. **Czy „Zamożność — szczegóły (kompaktowa)" i „Zamożność — ściąga (pełna)" mają zostać jako dwa celowo różne warianty (tooltip vs pełny panel), czy to duplikacja do konsolidacji?** Nie recenzowano treści pod kątem pokrywania się — patrz §3.
2. **Czy cztery punkty styku Religii/Kultury w UI (pełny panel łączony, wariant fallback, dwa chipy górnego paska) mają zostać osobno, czy warto skonsolidować?** Tak samo nieobjęte recenzją treściową poza głównym panelem.
3. **Poradnik rozdz. 03 §21.4 — suwak żywności 30/70 w poradniku vs 100/0 w kodzie (od 2026-07-03).** Rozjazd sprzeczny z jednoznacznym komentarzem w kodzie („Start gry: 100% wzrost, 0% armia") — czy to poradnik ma rację i kod się zmienił bez aktualizacji dokumentacji, czy poradnik jest po prostu nieaktualny? Wymaga potwierdzenia przed edycją.
4. **Poradnik rozdz. 13 — kary bojowe Chińczyków/Zulusów istnieją tylko w pliku (`civ-matrix.json`) niepodłączonym do walki.** Czy mechanika jest zaplanowana, ale nie wdrożona (wtedy oznaczyć w wiki jako „zaplanowane"), czy to relikt do usunięcia z danych i z wiki jednocześnie?
5. **Czy zmiana ekonomii ×5 (`R-EKONOMIA-SUROWCE-SKALA-5X-Q1`) obejmuje też `wonders.json` (bonusy cudów)?** Od tego zależy, czy CivPedia/Poradnik rozdz. 91 (kolumna „Bonus miasta") wymaga korekty teraz, czy dopiero po rozszerzeniu zakresu zmiany.
6. **17 pozycji odłożonych świadomie „do zsynchronizowania po ×5"** (pełna lista w oryginalnych raportach agentów — koszty ulepszeń terenu, przykłady z konkretnymi kwotami w rozdz. 04/06/08/57, cennik PN w rozdz. 08/12) — potwierdzić z właścicielem, że rzeczywiście lepiej poczekać na ustabilizowanie zmiany niż poprawiać teraz i przepisywać dwa razy.

---

## 7. Co NIE zostało jeszcze zrobione

To jest **wyłącznie Etap 1** — badanie i rekomendacje. **Żadna z powyższych poprawek nie została wdrożona**: żaden plik w `gra/src/data/wikiBundle.json`, `gra/src/ui/cityPanel.ts` ani `tools/generate-encyklopedia.cjs` nie został zmieniony w ramach tego workflow. Wszystko czeka na decyzję właściciela o priorytetach i zakresie Etapu 2 (kolejność, czy iść partiami wg §6a/6b, kto ma wykonać poprawki).

**Zastrzeżenia co do kompletności samego audytu** (żeby nie przedstawiać próbki jako pełnego pokrycia):

- **Poradnik: pełne pokrycie.** Wszystkie 22 rozdziały (00, 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 28, 45, 57, 91) zostały przeczytane w całości przez agentów, nie próbkowane.
- **CivPedia: pełne pokrycie liczbowe, nierówna głębia prozy.** Wszystkie 136 haseł zostały uwzględnione. Dla kategorii Budynki (25), Cuda świata+Kultura (20), Ulepszenia terenu+Mapa (18), Cywilizacje+Dyplomacja (12), Pojęcia+Miasto+Nauka+Ekonomia (10) — łącznie **85 haseł** — agenci deklarują dogłębną lekturę pełnej treści (wikiS/wikiM/full) **100% haseł w każdej z tych kategorii**. Dla kategorii **Jednostki + Jednostki i walka + Wojsko i miasto (51 haseł)** — wszystkie tytuły przejrzano, **wszystkie liczby zweryfikowano programowo** krzyżowo z `units.json`, ale **dogłębna lektura prozy** objęła tylko ok. 15–17 z 51 haseł (wszystkie 8 super-jednostek, jednostki dystansowe, kilka rydwanów/oblężniczych, plus Bród i Manpower) — pozostałe ~34 hasła jednostek mają zweryfikowane liczby, ale nie zweryfikowaną jakościowo prozę/taktykę pod kątem jasności i potrzebności poza stwierdzeniem, że szablon „Countery i taktyka" jest identyczny wszędzie (§2b, §5).
- **Panele UI: 27 znalezionych, 10 zrecenzowanych.** Recenzja dogłębna objęła panele „ściąga" najbliższe znanym wcześniej trzem (Zamożność, Podział pracy, Okolica) plus kilka największych paneli tooltipów HUD. **17 paneli — w tym wszystkie chipy górnego paska poza Żywnością/Religią/Kulturą, karta Rekrutacji, Skład bonusów budynku, Garnizon, oba warianty info-card budynku/jednostki, lista posiadanych budynków, panel zużycia surowców w `empireDetailPanel.ts` — nie zostały poddane ocenie jasności/aktualności/potrzebności**, tylko skatalogowane lokalizacyjnie (§3, druga tabela). To jest jawnie otwarty temat, nie ukryta luka — wymaga osobnego dispatchu w Etapie 2, jeśli właściciel chce pełne pokrycie 27/27.
- **Rozjazd ×5 poza Budynkami nie zweryfikowany wprost.** Agent CivPedii „Budynki" zasugerował sprawdzenie, czy ten sam commit `e401c1c2` (dziś) zepsuł też CivPedię „Jednostki" i „Ulepszenia terenu" analogicznie do Budynków — **nikt tego nie sprawdził w ramach tego workflow**, mimo że oba te pliki danych (`units.json`, `terrain-improvements.json`) były częścią tego samego commitu wg opisu decyzji.
- **Panele UI — duplikaty (Zamożność, Religia) zidentyfikowane strukturalnie, nie ocenione merytorycznie** — patrz pytania (c)1–(c)2 w §6.


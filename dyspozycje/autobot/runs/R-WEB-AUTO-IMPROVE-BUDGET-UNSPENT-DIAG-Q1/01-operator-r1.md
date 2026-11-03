STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — DIAGNOZA, zero zmian `gra/src`
TEMAT: R-WEB-AUTO-IMPROVE-BUDGET-UNSPENT-DIAG-Q1
GOAL: ustalic na dowodach, czy istnieje ogranicznik liczby ulepszen na miasto/inny parametr, przez ktory automat nie wydaje budzetu Pracy i zostawia pola bez ulepszen.
ZMIANY/COMMIT: nowe pliki: `gra/tools/auto-improve-unspent-diag.cjs`, `dyspozycje/autobot/runs/R-WEB-AUTO-IMPROVE-BUDGET-UNSPENT-DIAG-Q1/**` (ten raport, `tabela-przyczyn.md`, `evidence/`). Baza `23dd158e9`. SHA: patrz koniec.
RUNDY: 1/5

## ODPOWIEDZ: czy istnieje ogranicznik liczby ulepszen na miasto? `maxItemsPerCity`: NIE (jest bez limitu); ISTNIEJA dwa limity typowe dla profili Surowce/Infrastruktura
- Limity na miasto, ktore istnieja w kodzie (R2 zarzut 1): (a) `defenseCap = max(1, ceil(pop/10))` na KLUCZ i miasto dla `posterunek`/`fort` (`auto-improvements.ts:1538`, `:1553`; stala `JEDEN_NA_ILU_OBYWATELI` `:196`), aktywny gdy `demandActive` = false, czyli w profilach Surowce i Infrastruktura (`:1507-1509`); (b) `lesneMin = ceil(pop/10)` tartakow i obozow jako warunek wyrebu POZA rzeka (`:1720`, `:1748-1760`, odrzucenie `:1857`) plus prog lasu `WYRAB_MIN_FOREST_IN_RADIUS = 3` (`:199`, `:1858`) - tez tylko gdy `!demandActive`. NIE dotycza Zywnosc/Zrownowazone (`demandActive`), wiec wniosek glowny sie nie zmienia.
- `maxItemsPerCity` domyslnie `Infinity` (`auto-improvements.ts:1094`, uzycie `:1542/:1555/:1990`); zaden wolajacy go nie podaje (gracz `main.ts:36303`, AI `ai.ts:2705`; grep `maxItemsPerCity *:` poza plikiem pickera = 0). Na zywo: `maxItemsPerCity: null` w kazdym wywolaniu gracza i AI. `FOOD_STAGE_MAX_ITEMS_PER_CITY = Infinity` (`:516`).
- `terrain-improvements.json`: zadnego pola `max*/limit*/na_miasto` (grep). Brak limitu tur/heksow na ture.
- Pula „100%” = `pula - 30` (rezerwa `AUTO_ULEPSZENIA_PRACA_RESERVE`, `:202`; na zywo `pct:100, reserve:30`); picker w ogole nie rusza przy puli <= 30 (`main.ts:36294`, `:1130`). Domyslny % to 33 (`cities.ts:229`).

## PRZYCZYNA GLOWNA (zmierzona): filtr „Tylko pola z obywatelami” — DOMYSLNIE WLACZONY
`DEFAULT_ULEPSZENIA_ONLY_WORKED = true` (`cities.ts:217`; decyzja wlasciciela „ZASADA 2”). Kandydaci = heksy pracowane (liczba obywateli) + zloza (`auto-improvements.ts:1425-1448`). Pole z obywatelem to ~pop z ~200-350 heksow terytorium.
Pomiar na zywo (tabela: `tabela-przyczyn.md`):
- Filtr ON (S1, S3, S9, S5): **89,9-91,9% heksow w moim terytorium odrzuca filtr obywateli**; ulepszone tylko 4-9%. Brak tech: 4,1% (S5, tylko techy naturalne); teren bez zastosowania: 0-1,2% (gory).
- S9b (miasto pop 12, pula 3000 jako fixture): po wydaniu ~2300 w 3 turach pula **rosnie 724 → 1289 w 19 turach** (netto +20..+92/ture), 321 z 357 heksow zablokowanych. To jest MECHANIZM POTWIERDZONY NA FIXTURE (pula 3000 i pop 12 wstrzykniete); NIE jest to odtworzenie czestosci u gracza - naturalna rozgrywka S5 ma pule 0->50 i nie pokazuje duzego budzetu; czestosc u gracza: NIE_ZMIERZONO. Pop 12->9 i 1->3 miasta w S9b: harness zaklada miasta w t4 i t8 (`foundAt`), zalozenie miasta zabiera pop miastu-matce (`cities.pop`: 12 -> 11,1 w t5 -> 9,2,1 w t9); dokladny rachunek 12->9 (2 zalozenia vs -3 pop; reszta np. migracja/glod) NIE_ZMIERZONO; wzrost puli obejmuje wiec przychod nowych miast, a nie tylko miasta pierwotnego.
- Filtr OFF (S2, S4, S12): automat wydaje wszystko (S12: 5692 z 6000, 85 ulepszonych heksow w 13 turach), pula spada do 0. S4b: po wyczerpaniu puli upkeep Pracy 32-37/ture trzyma ja przy 0 przez 19 tur, 180 z 199 heksow zostaje kandydatami. Poluzowanie filtra zamienia wiec „nadmiar puli” w „pula 0 + stale utrzymanie” — to decyzja produktowa.
- Sygnal dla gracza istnieje tylko jako 4-sekundowy toast (`main.ts:36461`), gdy brak kandydatow i brak niedoboru.

## PRZYCZYNY DODATKOWE (zmierzone / z kodu)
1. **Jeden etap na ture**: `auto-improvements.ts:883` (`break` po pierwszym etapie z pickami). S12 (pula 6000, OFF): 13 tur kolejno farma→wycinka→farma→trzoda→…→irygacja; kazde wywolanie = 1 etap. Pula nie jest ograniczeniem, tempo tak.
2. **Profil zdefiniowany waskoo**: Zywnosc/Rown. bez niedoboru = tylko zywnosc (`:88-107`, `:1341-1349`); trzoda tylko przy rzece (`:1791`); bez „Wolno wycinac las” 34,9% moich heksow nie ma zastosowania (las, S11).
3. **Niedobor zjada pule**: w Rown. niedobor jest aktywny stale (zob. R-WEB-LIVE-MEASURE-CLEARING-DEFICIT-Q1); S4: 786 Pracy w turze 1 na warzelnie x10/tartak x4/kamieniolom/kopalnie.
4. Surowce/Infra OFF: 31 / 98 heksow bez zastosowania (morze), pula <= rezerwa 30 po 2-3 turach (S6: 800>53>33>13>5>0; S7: 800>129>40>23>3>0). Heksy „kandydat czeka” (140 / 102) NIE sa rozbite histogramem odrzuceni pickera (`verdict(...)` `:1857-1858`) - NIE_ZMIERZONO (brak harnessu na zywo w tej rundzie). Ograniczenie gornie z kodu i dowodow: po wyczerpaniu puli pierwsza bramka to pula (S6/S7 pula <= 30 od t3), wiec `defenseCap`/`lesneMin` nie sa rozroznialne; `defenseCap` moze zablokowac najwyzej `ceil(pop/10)` heksow na klucz i miasto (S7: pop 5-6 -> 1 posterunek + 1 fort, `hasKeyCounts.posterunek = 1`, wiec posterunek jest na pulapie), czyli <= 2 z 102 heksow; Surowce nie ma kluczy obronnych (`defKeys: []`), a `lesneMin` dotyczy tylko wycinki poza rzeka (w S6 `wyrab` = 0 w histogramie).
5b. Pulap % per miasto (R2 zarzut 4): `getPracaBudgetPercent` (`main.ts:36341`, `auto-improvements.ts:1378-1397`) daje `effectiveCityCap = min(cityBudgetCap, imperiumBudgetCap)` - override miasta MOZE tylko zacisnac pulap ponizej polityki imperium, nigdy go nie podnosi. Domyslnie 33% (`cities.ts:229`), w pomiarach `override:false` (`effectivePolicy0`), S1-S12 na 100% poza S5 (33%). Zacisniety override u gracza: NIE_ZMIERZONO; to kandydat na ogranicznik tylko dla gracza, ktory go sam ustawil.
5. AI: `maxItemsPerCity` bez limitu (foodCities `:867` filtruje po `maxItems`, ktore dla AI = Infinity), 100% puli (`pool=cap`), pula 10-80 - w pomiarze wydaje przychod, nie gromadzi (30 tur). Filtr obywateli dla AI jest na sztywno `getOnlyWorked: () => true` (`ai.ts:2711`), wiec ten sam mechanizm filtra dotyczy AI; przyczyny odrzucen heksow AI: NIE_ZMIERZONO.

## PARAMETRY DO ZMIANY / REKOMENDACJA (osobny temat; DECYZJA_WYMAGANA — ABC zadaje orkiestrator)
Pytanie produktowe: co ma robic automat, gdy nie ma kandydatow „przy obywatelach”, a pula rosnie?
- A) zostawic (stan dzis) + wyrazniejszy sygnal niz toast;
- B) **rekomendowane** (gracz: `getOnlyWorked` z polityki w `main.ts`; dla AI wymagaloby osobnej zmiany `ai.ts:2711` - poza zakresem tej rekomendacji, AI nie gromadzi puli): gdy `surplusReport.surplus` (brak kandydatow przy obywatelach i brak niedoboru) automat dopuszcza heksy bez obywatela w terytorium (zmiana: `auto-improvements.ts:1425-1448` + warunek w `main.ts:36303-36332`, `getOnlyWorked`), z pulapem np. wydatku do `pula - N x upkeep`;
- C) domyslne `false` (`cities.ts:217`) — cofa decyzje wlasciciela, wyczerpuje pule (S4b).
Niezalezny, opcjonalny temat: kaskada etapow w jednym wywolaniu (`auto-improvements.ts:883`: zamiast `break` kontynuowac po zarejestrowaniu pickow, z zachowaniem kolejnosci E1-E6).

TESTY: pomiar zywy 12 scenariuszy x 14-30 tur, 0 bledow strony (`errors: []`); kod gry bez zmian (brak bramek `gra/src` do uruchomienia; `node --check` harnessu OK). Fixture: techy, polityka, pop 1. miasta, pula. Hak tylko w kopii `main.ts`/`ai.ts` w scratch.
BLOKADY: brak. NIE_ZMIERZONO: drugi seed/swiat; AI per-heks; wplyw tech przy duzej puli i OFF; histogram odrzuceni pickera dla S6/S7; czestosc objawu u gracza w naturalnej grze; override % miasta.
POSPRZATANE: `gra/node_modules`, `/dev/shm/aiu-*`.
NASTĘPNY KROK: Evaluator (ten sam ID), potem Final Control; ABC dla wlasciciela (A/B/C).
DEPLOY/PUSH: NIE WYKONANO

COMMIT: 87b41b1deb2b333b74033b84f69591866069634e (harness + raport + dowody); ten wpis SHA dodany kolejnym commitem dokumentacyjnym. Brak push.

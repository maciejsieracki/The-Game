TEMAT: R-DYPLO-NAP-KARA-GRANICA-REDEFINICJA-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: gra/src/main.ts (4 miejsca obliczania), gra/src/game/diplomacy.ts,
gra/src/game/diplomacy-factors.ts, gra/src/game/diplomacy-proposals.ts (WYŁĄCZNIE
zmiana nazwy pola/stałej, ZERO zmian progów/formuł)
MODEL+EFFORT: claude-sonnet-5, effort high

WYZWALACZ (zgłoszenie właściciela, 2026-09-03)
"A poza tym, o co chodzi z tą ekspansją przy granicach? Przecież wiadomo, że z cywilizacją,
z którą graniczymy, się stykamy, nawet jeśli nie budujemy tam miast. Więc pytanie: co
rozumiesz przez ekspansję? Czy chodzi o to, że cywilizacja, z którą graniczymy, zawsze jest
trudniej utrzymać relacje, więc powinno to nazywać się karą za wspólną granicę albo karą za
to, że jesteśmy sąsiadami?" Po przedstawieniu diagnozy właściciel wybrał (ABC): "Przedefiniuj
na realne sąsiedztwo terytorialne".

RECON (wykonane przez orkiestratora — nie powtarzaj, zweryfikuj i buduj na tym)
Pole `ekspansjaPrzyGranicy` istnieje w CZTERECH niezależnych miejscach `gra/src/main.ts`,
wszystkie z IDENTYCZNĄ formułą — czysty licznik miast, ZERO związku z faktyczną granicą:
- `main.ts:16887` — `cities.filter(c=>c.ownerId===a).length>2 && cities.filter(c=>c.ownerId===b).length>2`
- `main.ts:16923` — identyczna formuła (drugi kontekst budowy `DiplomacyContinuousInput`/podobny)
- `main.ts:18153` — `cities.filter(c=>c.ownerId===responderId).length>2 && cities.filter(c=>c.ownerId===proposerId).length>2`
- `main.ts:29364` — `cities.filter(c=>c.ownerId===ownerId).length>2 && cities.filter(c=>c.ownerId===0).length>2`
Konsumenci pola (NIE zmieniać ich logiki, tylko wejście które dostają):
- `diplomacy.ts:1643,1698` — `computeTickZaufanieDelta`: `if (ctx.ekspansjaPrzyGranicy) dZ += p.ekspansjaGranica_zaufanie_perTura` (ujemny tick zaufania per turę, dopóki flaga aktywna).
- `diplomacy-factors.ts:108,183` — rozbicie czynników relacji (UI/diagnostyka), dolicza wkład tej flagi do wyświetlanego rozkładu.
- `diplomacy-proposals.ts:182,455-461,1035` — `NAP_EKSPANSJA_RELACJA_NARZUT` (=20, alias `SWEETENER_EASE_MAX_POINTS`) dolicza się do progu Relacji NAP WYŁĄCZNIE gdy `ctx.ekspansjaPrzyGranicy` — to jest mechanizm z poprzedniego zgłoszenia (`R-DYPLO-WARUNEK-NIESPELNIONY-CZERWONY-TOOLTIP-Q1`), próg 110+20=130.

Prymityw do reużycia, już zintegrowany do main (`R-HANDEL-SZLAKI-WYMOG-GRANICY-LADOWEJ-Q1`,
commit `d1a3c99d`): `ownersHaveSharedLandBorder(ownerA, ownerB, territoryNodes, map)`
(`gra/src/game/trade-routes.ts:246-272`, EXPORTED, czysta funkcja — sprawdza faktyczne
sąsiedztwo terytorialne wyłącznie po lądzie, symetryczne). Istnieje też prywatna,
memoizowana wersja `landBorderShared` (trade-routes.ts:294-310, NIE eksportowana, kluczowana
per-para-właścicieli) — Operator ocenia czy eksportować ją, zduplikować wzorzec lokalnie w
main.ts, czy wołać `ownersHaveSharedLandBorder` bezpośrednio bez cache (częstotliwość wywołań
tu jest dużo niższa niż w trasach handlowych — per-parę-cywilizacji przy budowie kontekstu
dyplomacji, nie per-para-miast w BFS).
`buildAllTerritoryNodes()` (main.ts:4254) jest lokalną domknięciową funkcją wewnątrz
`async function boot()` — dostępna leksykalnie we WSZYSTKICH 4 miejscach powyżej (wszystkie
są wewnątrz tego samego `boot()`), zero dodatkowej plumbingu parametrów potrzebne.
`map: GameMap` — sprawdź w każdym z 4 miejsc czy zmienna o tej nazwie/kształcie jest w
zasięgu (analogicznie do wywołań w R-HANDEL-SZLAKI-WYMOG-GRANICY-LADOWEJ-Q1, main.ts, które
już przekazują `map` w tych samych okolicach kodu).

GOAL
1. Zastąp WSZYSTKIE 4 formuły `ekspansjaPrzyGranicy` (main.ts:16887,16923,18153,29364)
   wywołaniem opartym o `ownersHaveSharedLandBorder(ownerX, ownerY, buildAllTerritoryNodes(),
   map)` — realne sąsiedztwo terytorialne zamiast licznika miast. Rozważ współdzielony,
   per-turę cache (analogiczny do wzorca `landBorderShared` z trade-routes.ts), jeśli te 4
   miejsca wywoływane są często w jednej turze (Operator ocenia faktyczną częstotliwość przed
   decyzją o cache — nie zakładaj, zmierz albo policz z kodu wywołującego).
2. Zmień nazwę pola i wszystkich odwołań na uczciwą, opisową: `karaWspolnaGranica` (pole w
   `DiplomacyContinuousInput`/`AIDiplomacyInput`/analogicznych typach w `diplomacy.ts`,
   `diplomacy-factors.ts`, `diplomacy-proposals.ts` — Operator ustala dokładne nazwy typów po
   przeczytaniu). Zmień etykietę widoczną graczowi (jeśli istnieje — grep "ekspansja przy
   granicy"/"Ekspansja przy granicy" w plikach UI, np. `diplomacy-factors.ts` lub panel
   dyplomacji) na coś w rodzaju "Kara za wspólną granicę" / "Sąsiedztwo terytorialne" —
   Operator dobiera dokładne brzmienie, spójne z resztą UI dyplomacji.
3. `NAP_EKSPANSJA_RELACJA_NARZUT` (diplomacy-proposals.ts:461) — WYŁĄCZNIE rozważ zmianę
   nazwy stałej na spójną z nowym polem (np. `NAP_GRANICA_RELACJA_NARZUT`), WARTOŚĆ (20)
   ZOSTAJE DOKŁADNIE TAKA SAMA — to nie jest temat o zmianie progu NAP.
4. Zero zmian w wartościach/formułach downstream (`ekspansjaGranica_zaufanie_perTura` w
   `diplomacy.ts`, `NAP_EKSPANSJA_RELACJA_NARZUT`=20 w `diplomacy-proposals.ts`) — WYŁĄCZNIE
   zmienia się co WŁĄCZA te formuły (realna granica zamiast licznika miast) i jak się to
   pole/etykieta nazywa, nie jak bardzo wpływa gdy aktywne.

KRYTERIA KOŃCA (binarne)
1. Test jednostkowy: dwie cywilizacje >2 miasta KAŻDA, terytoria SIĘ NIE STYKAJĄ (odległe) →
   nowe pole = `false` — DOKŁADNIE odwrotność dzisiejszego zachowania (dziś: `true` bo tylko
   liczy miasta). To jest scenariusz z pytania właściciela ("z cywilizacją, z którą nie
   graniczymy, nie powinno być tej kary").
2. Test jednostkowy: dwie cywilizacje >2 miasta KAŻDA, terytoria SIĘ STYKAJĄ (sąsiadujące
   hexy lądowe, wzorem testów z `R-HANDEL-SZLAKI-WYMOG-GRANICY-LADOWEJ-Q1`) → nowe pole =
   `true`.
3. Test jednostkowy: dwie cywilizacje stykające się terytoriami, ale JEDNA ma ≤2 miasta →
   zbadaj i udokumentuj: czy próg ">2 miasta" ma zostać zachowany JAKO DODATKOWY warunek
   (kara wymaga zarówno granicy JAK I odpowiedniej wielkości obu stron) czy całkowicie
   zastąpiony samą granicą — NIE zakładaj, zapytaj się printem/gitlogiem czy istnieje
   uzasadnienie projektowe dla progu ">2 miasta" osobno od granicy; jeśli brak takiego
   uzasadnienia w kodzie/dokumentacji, zachowaj kryterium ">2 miasta" jako dodatkowy warunek
   (najbezpieczniejsza, najmniej zaskakująca zmiana — usuwamy TYLKO fałszywe rozumienie
   "ekspansja"="granica", nie usuwamy całego pierwotnego warunku wielkości bez wyraźnej
   przyczyny) i udokumentuj tę decyzję w raporcie jako do potwierdzenia przez właściciela.
4. `tsc --noEmit` czysty.
5. Istniejące testy dyplomacji nadal zielone: `gra/tools/*dyplo*-test.cjs`,
   `gra/tools/diplomacy-*-test.cjs`, `gra/tools/dyplo-warunek-niespelniony-czerwony-tooltip-test.cjs`
   (jeśli już istnieje po integracji `R-DYPLO-WARUNEK-NIESPELNIONY-CZERWONY-TOOLTIP-Q1| —
   sprawdź git log czy zintegrowany, jeśli tak dopisz jego bramkę do listy sprawdzanych).
6. 5 bramek referencyjnych zielone.
7. Grep całego `gra/src` po starej nazwie `ekspansjaPrzyGranicy` po zmianie = ZERO trafień
   (poza ew. komentarzami historycznymi/CHANGELOG jeśli explicite uzasadnione, nie kodem).

ALLOWLISTA (nic poza tym)
- gra/src/main.ts (4 miejsca wymienione w RECON, WYŁĄCZNIE przepięcie na
  ownersHaveSharedLandBorder + rename pola).
- gra/src/game/diplomacy.ts (rename pola w typie + miejscu użycia, ZERO zmian formuły
  `ekspansjaGranica_zaufanie_perTura`).
- gra/src/game/diplomacy-factors.ts (rename pola + etykiety UI jeśli tu jest, ZERO zmian
  wagi/wkładu czynnika).
- gra/src/game/diplomacy-proposals.ts (rename pola + WYŁĄCZNIE nazwy stałej
  `NAP_EKSPANSJA_RELACJA_NARZUT`, wartość 20 NIETKNIĘTA, próg `progNapRelacja(110)`
  NIETKNIĘTY).
- Nowe/rozszerzone testy w gra/tools/*-test.cjs.
Zakazane bezwzględnie: zmiana wartości `NAP_EKSPANSJA_RELACJA_NARZUT`/`progNapRelacja`/
`ekspansjaGranica_zaufanie_perTura` (te formuły/liczby zostają dokładnie takie same — zmienia
się WYŁĄCZNIE co je włącza + nazewnictwo), zmiana modelu terytorium
(`territoryOwnerAt`/`cityTerritoryRadius`/`ownersHaveSharedLandBorder` same w sobie — TYLKO
reużycie, zero edycji), dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json, playbook.json.

IZOLACJA
worktree /home/user/wt-dyplo-nap-kara-granica, gałąź
autobot/R-DYPLO-NAP-KARA-GRANICA-REDEFINICJA-Q1, baza jawnie: origin/main (najnowszy commit
na moment dispatchu, ZAWIERAJĄCY już zintegrowany R-HANDEL-SZLAKI-WYMOG-GRANICY-LADOWEJ-Q1 —
zweryfikuj `git log --oneline -1 -- gra/src/game/trade-routes.ts` pokazuje
`ownersHaveSharedLandBorder` PRZED rozpoczęciem pracy).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON). Jedyna dozwolona kompilacja to
node ./node_modules/typescript/bin/tsc --noEmit.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryterium 1 (brak granicy → false) za spełnione testem gdzie obie cywilizacje
są tak blisko siebie geograficznie, że w praktyce i tak by graniczyły — użyj RÓŻNYCH,
jednoznacznie odległych pozycji miast (wzorem reguły anty-halucynacyjnej z
R-HANDEL-SZLAKI-WYMOG-GRANICY-LADOWEJ-Q1, testu n2), z jawnie pokazanym dystansem/promieniami
w raporcie. Zakaz milczącego usunięcia warunku ">2 miasta" bez jawnego udokumentowania tej
decyzji jako punktu do potwierdzenia (kryterium 3).

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i TEJ
SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona, jeśli
zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora.

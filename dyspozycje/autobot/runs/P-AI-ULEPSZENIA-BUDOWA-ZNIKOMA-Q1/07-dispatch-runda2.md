STATUS: DISPATCH (RUNDA 2 — kontynuacja tego samego tematu po ECHO właściciela)
DOMAIN: GAME
TEMAT: P-AI-ULEPSZENIA-BUDOWA-ZNIKOMA-Q1
GOAL RUNDY 2: Właściciel NIE zaakceptował rekomendacji Operatora z rundy 1 (Opcja B —
dać AI ten sam przełącznik "tylko pola z obywatelami" co gracz, ale WYŁĄCZONY) i wskazał
inną, konkretniejszą hipotezę oraz konkretną regułę docelową. Zweryfikuj jego hipotezę
świeżym dowodem i zaimplementuj regułę, którą podał — NIE globalne wyłączenie onlyWorked.

KONTEKST — PRZECZYTAJ W CAŁOŚCI, W TYM RAPORT RUNDY 1 (`01-operator-runda1.md` w tym
katalogu), PRZED PIERWSZĄ ZMIANĄ KODU:
- Runda 1 (Operator+Evaluator, PASS-WITH-NOTES, docs-only, zintegrowana `c814ab1f`) ustaliła:
  `planCityImprovements` (`ai.ts:2494`) hardcoduje `getOnlyWorked: () => true` dla AI (gracz ma
  przełącznik w UI). Kontrfaktyczny eksperyment: wyłączenie `onlyWorked` (budowa WSZĘDZIE w
  terytorium, nie tylko na obrabianych heksach) dało 4.6x-6.6x więcej zbudowanych ulepszeń.
  Rekomendacja rundy 1: Opcja B — dać AI ten sam przełącznik co gracz, wyłączony.
- ODPOWIEDŹ WŁAŚCICIELA (dosłowna, ECHO do tej rundy): "Ale to chyba nie jest problem
  przełącznika, tylko tam, gdzie są obywatele. Powinna być zasada, że jeśli chodzi o
  żywnościowe ulepszenia, to tylko tam, gdzie są obywatele, ale surowce mogą być budowane
  bez problemu wszędzie. To powinna być zasada ogólna dla AI, zarówno państw, miast, jak i
  innych cywilizacji. Dodatkowo w miejscach, w których można budować, czyli tam, gdzie są
  obywatele, nie są budowane ulepszenia, więc to chyba nie jest ten przypadek. Na początku
  sprawdziłbym, czy nie ma blokady na przekazywanie pracy do puli i czy nie jest tak, że
  wszystko idzie na budynki, które z kolei nie są budowane, bo technologie nie są rozwijane."
- To jest DWIE osobne, konkretne instrukcje, obie do wykonania:
  1. **Reguła docelowa** (NIE opcja B z rundy 1): dla AI (cywilizacje główne I miasta-państwa
     — "zarówno państw, miast, jak i innych cywilizacji") ulepszenia ŻYWNOŚCIOWE (farmy i
     analogiczne — sprawdź świeżo w `gra/data` które klucze `Ulepszenie`/kategorie faktycznie
     produkują `zywnosc`) pozostają ograniczone do heksów obrabianych (`onlyWorked=true`),
     ale ulepszenia SUROWCOWE (tartak/kamieniołom/glinianka/kopalnia żelaza i inne nie-
     żywnościowe — sprawdź świeżo pełną listę) mają być budowane BEZ tego ograniczenia,
     wszędzie w terytorium AI. To wymaga rozbicia dzisiejszego jednego globalnego
     `getOnlyWorked: () => true` na logikę zależną od TYPU ulepszenia, nie jednego booleana.
  2. **Dowód/hipoteza do zweryfikowania PRZED zmianą reguły z pkt 1**: właściciel zauważa
     sprzeczność — jeśli nawet na heksach GDZIE budowa JEST dozwolona (obrabiane, `onlyWorked`
     spełnione) ulepszenia i tak nie powstają, to problem NIE jest (wyłącznie) kwalifikacją
     heksu, tylko czymś wcześniej w łańcuchu: (a) blokada/awaria w przekazywaniu Pracy do puli
     ulepszeń, (b) 100% budżetu Pracy AI ląduje w kolejce Budynków, a kolejka Budynków stoi
     pusta/marnuje się bo wymagane technologie nie są odblokowane (BEZPOŚREDNIE powiązanie z
     równolegle prowadzonym tematem `P-AI-BADANIA-ZACOFANIE-Q1` — AI drastycznie w tyle
     technologicznie). Sprawdź świeżo w `diag-znikoma.cjs` (ten katalog) i w kodzie
     (`game/production.ts`, `game/auto-manage.ts`, `game/empire-city-defaults.ts`,
     `ai.ts::planCityImprovements` i wołające go miejsca) czy budżet Pracy przeznaczony na
     ulepszenia (`AI_FIXED_PROCENT_BUDYNKI=50`, więc nominalnie 50% na ulepszenia) FAKTYCZNIE
     trafia do kolejki ulepszeń, czy gdzieś po drodze jest zerowany/przekierowywany/marnowany
     gdy kolejka Budynków jest zablokowana brakiem technologii.

ZADANIE:
1. Zweryfikuj hipotezę właściciela z żywym dowodem (rozszerz/zmodyfikuj `diag-znikoma.cjs` z
   rundy 1 albo napisz nowy harness): dla heksów SPEŁNIAJĄCYCH `onlyWorked` (obrabiane), jaki
   FAKTYCZNIE procent dostępnego budżetu Pracy na ulepszenia jest wykorzystywany vs. marnowany?
   Czy da się zaobserwować sytuację gdzie kolejka Budynków AI stoi (nic do zbudowania z powodu
   brakujących technologii) a jednocześnie ulepszenia terenu też nie powstają mimo dostępnych,
   kwalifikujących się heksów i niezerowej puli Pracy? Jeśli tak — to jest osobna, RÓWNOLEGŁA
   przyczyna do przyczyny (c) z rundy 1 (nie zastępuje jej, oba mogą być prawdziwe naraz).
2. Zaimplementuj regułę z pkt 1 kontekstu: rozbij `onlyWorked` per kategoria ulepszenia
   (żywnościowe = zostaje ograniczone do obrabianych; surowcowe = bez ograniczenia, dla AI).
   Zachowaj istniejące zachowanie GRACZA bez zmian (gracz nadal ma swój ręczny przełącznik,
   dotyczy to wyłącznie ścieżki decyzyjnej AI w `planCityImprovements`).
3. Jeśli krok 1 potwierdzi realny problem z przekazywaniem/marnowaniem Pracy (blokada, albo
   "budżet budynków marnuje się w pustej kolejce zamiast przelać się do ulepszeń") — napraw
   TĘ przyczynę też, w tym samym temacie, z dowodem PRZED/PO. Jeśli naprawa wymaga zmiany
   liczby balansu (np. przesunięcia sufitu 50%) — ZATRZYMAJ SIĘ, to nowy ABC dla właściciela,
   nie zgaduj.
4. Żywy dowód PRZED/PO (ta sama symulacja z rundy 1, 3 ziarna × 150 tur): liczba zbudowanych
   ulepszeń SUROWCOWYCH powinna wzrosnąć wyraźnie (analogicznie do 4.6x-6.6x z rundy 1, ale
   teraz TYLKO dla kategorii surowcowej, żywnościowe zostają na tym samym poziomie co dziś —
   potwierdź że żywnościowe NIE wzrosły, to dowód że rozróżnienie kategorii faktycznie działa).

BINARNE KRYTERIUM SUKCESU: (1) AI buduje ulepszenia surowcowe bez ograniczenia do obrabianych
heksów, żywnościowe nadal tylko na obrabianych — potwierdzone symulacją PRZED/PO z rozbiciem
na obie kategorie. (2) Jawny werdykt (z dowodem) czy istnieje dodatkowy problem przekazywania
Pracy/marnowania budżetu budynków — jeśli tak, naprawiony lub zgłoszony jako nowy ABC. `tsc
--noEmit` czysty, 5 bramek referencyjnych zielone, `ai-ulepszenia-malo-budowane-test.cjs` i
`ai-praca-split-parity-test.cjs` nadal zielone lub świadomie rozszerzone.

ALLOWLISTA:
- `gra/src/game/ai.ts` (WYŁĄCZNIE `planCityImprovements` i bezpośrednio powiązana logika
  kwalifikacji heksów per kategoria ulepszenia)
- `gra/src/game/auto-improvements.ts`, `gra/src/game/production.ts`,
  `gra/src/game/auto-manage.ts`, `gra/src/game/empire-city-defaults.ts` (WYŁĄCZNIE jeśli
  diagnoza pkt 1 wskaże realną blokadę przekazywania Pracy — nie zgaduj z góry)
- `gra/tools/ai-ulepszenia-malo-budowane-test.cjs`, `gra/tools/ai-praca-split-parity-test.cjs`
  (rozszerzenie), nowy diagnostyczny skrypt w
  `dyspozycje/autobot/runs/P-AI-ULEPSZENIA-BUDOWA-ZNIKOMA-Q1/`
- `dyspozycje/autobot/runs/P-AI-ULEPSZENIA-BUDOWA-ZNIKOMA-Q1/*`
Zakaz `git add -A`. Zakaz zmiany liczb balansu (progi/mnożniki/limity, w tym
`AI_FIXED_PROCENT_BUDYNKI`) bez jawnej nowej decyzji właściciela.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz wdrożenia Opcji B z rundy 1 (globalne wyłączenie
onlyWorked) — właściciel ją jawnie odrzucił, to NIE jest zadanie tej rundy. Zakaz deklaracji
przyczyny/naprawy bez dowodu z żywej symulacji. Zakaz przemilczenia interakcji z
`P-AI-BADANIA-ZACOFANIE-Q1` jeśli diagnoza ją potwierdzi — zgłoś to wprost, nawet jeśli nie
naprawiasz obu tematów w jednym miejscu.

IZOLACJA: worktree `/home/user/wt-ai-ulepszenia-budowa`, gałąź
`autobot/P-AI-ULEPSZENIA-BUDOWA-ZNIKOMA-Q1` (odtworzona od `origin/main`, poprzednia treść
rundy 1 już scalona do main jako docs), baza `origin/main` @ `0297dd28`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Liczy się jako RUNDA 2 tego tematu (runda 1 była recon).

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow) — zmiana logiki gry, wymaga Final Control.
DEPLOY/PUSH: NIE WYKONANO

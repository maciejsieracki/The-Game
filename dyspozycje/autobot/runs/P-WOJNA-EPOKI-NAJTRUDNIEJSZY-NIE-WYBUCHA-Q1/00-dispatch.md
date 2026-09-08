STATUS: DISPATCH
DOMAIN: GAME
TEMAT: P-WOJNA-EPOKI-NAJTRUDNIEJSZY-NIE-WYBUCHA-Q1
GOAL: Zdiagnozuj i napraw przypadek, w którym mechanizm "wymuszonej wojny epoki" (forced war
— trzy niezależne moduły: `forced-war-stone.ts`, `forced-war-bronze.ts`, `forced-war-iron.ts`,
wspólny rdzeń parowania `forced-war-common.ts::assignForcedWarPairings`) nie wybucha, dopóki
strony nie nawiązały kontaktu dyplomatycznego ("nie poznały się") — właściciel w rozmowie
POTWIERDZIŁ na żywo, że to jest realny mechanizm w JEGO rozgrywce na najtrudniejszym poziomie
(nie tylko hipoteza): "Wojna nie wybucha, póki się nie poznamy. To jest trochę taki wytrych,
że można uniknąć wojny, dopóki się nie pozna innej cywilizacji." To jest GŁÓWNY, PRAWIE PEWNY
trop tego tematu — potraktuj go jako punkt startowy diagnozy, nie jako jedną z wielu równorzędnych
hipotez, ale ZWERYFIKUJ źródłowo/żywo zanim naprawisz (może być POŚREDNIM skutkiem czegoś
głębszego niż prosty warunek "hasMet").

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ ZMIANĄ KODU:
- Pierwotne zgłoszenie właściciela (dosłowne): "Jeszcze jedna kwestia, na najtrudniejszym
  poziomie nie wiem, dlaczego nie wybucha wojna epoki." Właściciel NIE precyzuje która epoka
  (Kamień/Brąz/Żelazo) — sprawdź wszystkie trzy moduły, mechanizm parowania jest wspólny
  (`assignForcedWarPairings`).
- DOPRECYZOWANIE właściciela w tej samej rozmowie (kluczowe, czyta się jak POTWIERDZONY fakt
  z jego własnej rozgrywki, nie zgadywanie): "Czy jest możliwe, że wojna nie wybucha, ponieważ
  cywilizacje się nie znają? Bo akurat nie poznałem żadnej cywilizacji; być może to byłoby
  powodem." → odpowiedź orkiestratora (research) → właściciel: "Tak, zgadza się. Wojna nie
  wybucha, póki się nie poznamy. To jest trochę taki wytrych, że można uniknąć wojny, dopóki
  się nie pozna innej cywilizacji."
- Właściciel ocenia to jako WADĘ GRY (exploit/"wytrych"), nie jako pożądaną mechanikę — cel
  naprawy: mechanizm wymuszonej wojny epoki MA wybuchać niezależnie od tego, czy gracz/AI
  formalnie "poznał" drugą stronę — albo (a) sam mechanizm wymuszonej wojny wymusza też
  nawiązanie kontaktu/odkrycie jako efekt uboczny wybuchu wojny (tak jak realnie "wypowiedzenie
  wojny" ujawnia przeciwnika), albo (b) eligibility/pairing nie powinien w ogóle wymagać
  uprzedniego "poznania" — wybierz podejście inżynieryjnie czystsze względem istniejącego
  systemu dyplomacji/odkrywania, uzasadnij wybór w raporcie; jeśli oba wydają się już
  porównywalnie inwazyjne/ryzykowne, ZATRZYMAJ SIĘ i zgłoś DECISION_REQUIRED z opisem obu opcji
  zamiast zgadywać.
- Świeżo zweryfikowane przez orkiestratora (POWIERZCHOWNIE, nie pełna diagnoza — potwierdź
  źródłowo): `assignForcedWarPairings` (`forced-war-common.ts`) i moduły `forced-war-*.ts` NIE
  zawierają wprost słów "poznan"/"kontakt"/"hasMet"/"discovered" — jeśli hipoteza właściciela
  jest trafna, blokada leży GDZIE INDZIEJ, prawdopodobnie w jednym z: (i) budowaniu listy
  kandydatów/`triggeredSubjects`/`ForcedWarPairingSubject` w `main.ts` (~linia 31200-31300,
  szukaj `ironTriggeredSubjects`/`bronzeTriggeredSubjects`/`stoneTriggeredSubjects` i tego, co
  poprzedza ich `.push()` — czy jest tam warunek zależny od widoczności/odkrycia przeciwnika),
  (ii) w ogólnej walidacji/egzekucji komendy wypowiedzenia wojny (`wypowiedz_wojne` — szukaj
  gdzie ta komenda jest budowana z wyniku `assignForcedWarPairings` i czy coś ją tam odrzuca
  gdy strony się nie znają), (iii) w ogólnym systemie dyplomacji/`activeDeals`/relacji, gdzie
  jakakolwiek akcja dyplomatyczna (w tym wojna) może być zablokowana zanim istnieje jakikolwiek
  wpis relacji między dwoma ownerId (np. "brak relacji = automatyczny NAP/blokada" zamiast
  neutralnego stanu pozwalającego na wymuszoną wojnę). NIE zakładaj z góry KTÓRY z tych trzech —
  znajdź to źródłowo, potwierdź żywą symulacją (dwie AI, które się nie widziały, na hard,
  wymuszona wojna epoki powinna mimo to wybuchnąć po naprawie).
- Sprawdź też (drugorzędne kandydatury, na wypadek gdyby hipoteza "poznania" okazała się
  niepełna lub nietrafna po weryfikacji źródłowej): próg agresji/DifficultyParams sterowane
  trudnością, okno czasowe/turowe w modułach `forced-war-*.ts` — ale NIE zaczynaj od nich, to
  są zapasowe tropy, główny trop jest wyżej i pochodzi z bezpośredniej obserwacji właściciela.

ZADANIE:
1. Odtwórz problem z dowodem — headless symulacja: dwie/trzy AI startujące geograficznie
   rozdzielone (poza wzajemnym zasięgiem widoczności na starcie, tak jak w realnej rozgrywce
   właściciela), gra do momentu gdy przynajmniej jedna wchodzi w epokę kwalifikującą do
   wymuszonej wojny, BEZ sztucznego wymuszania kontaktu/odkrycia. Zmierz: czy
   `isEligibleForXForcedWar` zwraca `true`, czy `triggeredSubjects` dostaje wpis, i czy mimo to
   `assignForcedWarPairings`/faktyczna wojna nigdy nie dochodzi do skutku dopóki strony się nie
   "poznają" (porównaj z tą samą symulacją, w której obie strony mają already nawiązany kontakt
   od startu — czy TAM wojna wybucha normalnie). To bezpośrednio zweryfikuje/obali hipotezę
   właściciela.
2. Ustal DOKŁADNE miejsce blokady z dowodem (patrz trzy kandydatury w KONTEKŚCIE) — czy to
   filtr przy budowie `triggeredSubjects`, blokada przy egzekucji komendy wojny, czy ogólna
   reguła dyplomacji "brak relacji = zablokowane". Rozróżnij czy jest to POWIĄZANE z poziomem
   trudności (być może na łatwiejszych poziomach gracz/AI ma większy start-owy zasięg widzenia
   więc szybciej "poznaje" sąsiadów, maskując ten sam defekt) czy jest to defekt UNIWERSALNY,
   niezależny od trudności, który po prostu ujawnia się częściej na hard (np. bo AI ekspanduje
   dalej/wolniej odkrywa sąsiadów) — to determinuje czy fix ma być difficulty-specific czy
   ogólny.
3. Napraw: mechanizm wymuszonej wojny epoki ma wybuchać niezależnie od stanu "poznania" stron
   (patrz GOAL, dwie możliwe ścieżki naprawy — wybierz i uzasadnij). Jeśli naprawa wymaga
   dotknięcia ogólnego systemu dyplomacji/odkrywania (poza samymi plikami `forced-war-*`),
   zachowaj zakres MINIMALNY — tylko to, co konieczne żeby wymuszona wojna nie była blokowana
   brakiem kontaktu, bez zmiany zachowania dla zwykłych (niewymuszonych) wypowiedzeń wojny.
4. Żywy dowód PRZED/PO: ta sama symulacja z punktu 1 — po naprawie wymuszona wojna epoki
   faktycznie wybucha między stronami, które nigdy się wcześniej nie "poznały".

BINARNE KRYTERIUM SUKCESU: jawny, udowodniony werdykt dokładnego mechanizmu blokady (z
dowodem — symulacja, nie domysł z czytania kodu), zgodny lub jawnie korygujący hipotezę
właściciela. Po naprawie: wymuszona wojna epoki wybucha między stronami bez uprzedniego
kontaktu dyplomatycznego, potwierdzone PRZED/PO. Zwykłe (niewymuszone) wypowiedzenia wojny oraz
ogólna logika "trzeba się poznać, żeby handlować/zawierać traktaty" (jeśli taka istnieje i jest
zamierzona) NIE mają zostać zepsute — sprawdź to jako regresję. `tsc --noEmit` czysty, 5 bramek
referencyjnych zielone, istniejące testy wymuszonej wojny (pliki z "forced-war"/
"wymuszona-wojna" w nazwie w `gra/tools/`) nadal zielone lub świadomie rozszerzone.

ALLOWLISTA:
- `gra/src/game/forced-war-stone.ts`, `gra/src/game/forced-war-bronze.ts`,
  `gra/src/game/forced-war-iron.ts`, `gra/src/game/forced-war-common.ts` (WYŁĄCZNIE jeśli
  diagnoza wskaże że przyczyna leży w którymś z tych plików)
- `gra/src/main.ts` (WYŁĄCZNIE miejsca wołania/gatingu tych mechanizmów, wskazane świeżo
  diagnozą — nie przepisuj całej logiki AI/tury)
- `gra/src/game/ai-difficulty-bonus.ts` / parametry trudności (WYŁĄCZNIE jeśli diagnoza
  wprost wskaże że stamtąd pochodzi pośrednia blokada)
- `gra/tools/*-test.cjs` (nowa bramka dowodu albo rozszerzenie istniejącej)
- `dyspozycje/autobot/runs/P-WOJNA-EPOKI-NAJTRUDNIEJSZY-NIE-WYBUCHA-Q1/*`
Zakaz `git add -A`. Zakaz podnoszenia progu/szansy wymuszonej wojny bez wyraźnego dowodu że
to jest przyczyna i bez ABC jeśli wymaga to nowej liczby balansu.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz deklaracji przyczyny bez dowodu z rzeczywistej,
wieloseedowej symulacji (nie samo czytanie kodu — orkiestrator już sprawdził pobieżnie że
moduły NIE wyglądają na difficulty-gated wprost, więc jeśli problem faktycznie istnieje, jest
UKRYTY i wymaga żywego dowodu, nie kolejnego czytania tych samych plików). Zakaz mylenia
"nie zaobserwowałem w jednej rozgrywce" z "kod ma błąd" — wymagany dowód statystyczny z wielu
niezależnych symulacji PRZED deklaracją przyczyny.

IZOLACJA: nowy worktree `/home/user/wt-wojna-epoki-hard`, gałąź
`autobot/P-WOJNA-EPOKI-NAJTRUDNIEJSZY-NIE-WYBUCHA-Q1`, baza `origin/main` @ najświeższy commit
w chwili startu (sprawdź `git fetch origin main` przed założeniem worktree).
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow) — zmiana logiki AI/trudności, wymaga Final Control.
DEPLOY/PUSH: NIE WYKONANO

TEMAT: P-CIVPEDIA-KARTY-CALY-WIERSZ-PRZYCISKIEM-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: gra/src/ui/entityCards/renderer.ts (wspolny renderer wszystkich kart encji),
gra/src/ui/entityCards/technologyAdapter.ts (sekcje "Kolejne technologie" i "Zmiany ekonomiczne")
MODEL+EFFORT: claude-sonnet-5, effort high (UI kart encji, DOM/HTML — NIE gra/src/render/**,
Sonnet 5 wystarcza; ryzyko regresji na wielu juz istniejacych kartach wymaga ostroznosci)

WYZWALACZ (dosłownie od właściciela, dwa zrzuty ekranu: karta technologii "Garncarstwo" i
"Wymiana")
"Te przyciski po prawej stronie nie są potrzebne. Wymaga też rolnictwo oswojenia zwierząt. To
jest wprowadzające w błąd. Jest kolejna technologia wymiana, powinien być przycisk jako wymiana.
W momencie, gdy się naciśnie, pojawia się nam wymiana. To samo z brązownictwem, pismem, religią,
czyli ze wszystkimi ulepszeniami, z wszystkimi kolejnymi technologiami oraz także z budynkami i
jednostkami. Wszystkie powinny być przyciskiem. W momencie, gdy się na nie naciśnie, pojawia się
szersza informacja o danym budynku, ulepszeniu, technologii czy też jednostce. Czyli w wypadku
budynków sam spichlerz, sama garncarnia, sama cegielnia powinna być przyciskiem. Naciskam,
pojawia się karta budynku danego spichlerza, garncarni czy cegielni. To samo w ulepszeniach, to
samo w technologiach, to samo w jednostkach."

RECON (nie powtarzaj — już wykonane przez subagenta Explore tej sesji)
- Wspólny renderer `gra/src/ui/entityCards/renderer.ts`, funkcja `buildGridRowEl` (~94-155):
  `value` renderuje się jako `<button>` TYLKO gdy `row.linkTo` jest ustawione — ale dotyczy to
  WYŁĄCZNIE prawej kolumny (`.entity-card-row-value`), NIGDY lewej (`label`), niezależnie od
  danych. Dodatkowo TYLKO gdy `row.value === ''` (linia ~142) CAŁY wiersz dostaje fallbackowe
  atrybuty `data-row-entity-*` + klasę `entity-card-row--linked` (cursor:pointer) — świadomy,
  udokumentowany warunek z wcześniejszej "RUNDA 2" (komentarz ~124-146), dodany dla Budynków/
  Jednostek (gdzie `value` jest puste). Warunek CELOWO nie obejmuje wierszy z niepustym `value`.
- W `technologyAdapter.ts`, sekcja "Kolejne technologie" (~210-225): dla wierszy z
  `otherPrereqs.length>0` `linkTo` wskazuje POPRAWNIE na docelową technologię (np. "Wymiana"),
  ale `value` pokazuje tekst INNYCH wymagań ("Wymaga też: Rolnictwo, Oswojenie zwierząt") —
  klikalny jest WYŁĄCZNIE ten tekst po prawej (dziala, ale nie kojarzy się z linkiem do
  "Wymiana"), a klik na samą nazwę "Wymiana" (label) NIC NIE ROBI — to prawdziwy bug
  funkcjonalny (brak klikalności na labelu), nie tylko wizualny. Ten sam wzorzec (niepusty
  `value` + `linkTo` na encję opisaną przez `label`, nie przez `value`) występuje też w sekcji
  "Zmiany ekonomiczne" tego samego adaptera (~230-256, econRows) — niezgłoszone przez
  właściciela wprost, ale identyczny ukryty problem, tego samego pliku.
- Budynki/Jednostki/Ulepszenia terenu w kartach technologii (`value:''`) — zgodnie z kodem CAŁY
  wiersz JUŻ powinien być klikalny (fallback już istnieje) — wymaga POTWIERDZENIA żywym testem
  w przeglądarce, nie zakładania że działa (nie wykluczona regresja od czasu tamtego zapisu).
- Inne adaptery (`unitAdapter.ts:151-164`, `improvementAdapter.ts:126-149`, `wonderAdapter.ts:
  90-97`) ustawiają `value` RÓWNE nazwie encji docelowej linku — tam problem NIE występuje
  (to co widać jako przycisk, to dokładnie cel linku). Sekcja "Wymagania" (pills,
  `buildPillRowEl`) też bez problemu — pigułka zawsze pokazuje nazwę celu.
- Wniosek reconu: to NIE jest jeden punkt awarii naprawialny jedną zmianą w samym renderer.ts —
  potrzebna kombinacja: (a) dane w `technologyAdapter.ts` (sekcje Kolejne technologie/Zmiany
  ekonomiczne) powinny, wzorem Budynków/Jednostek, dawać `value:''` i przenieść tekst
  "Wymaga też:..." np. do osobnego, NIEklikalnego elementu (trailing/badge/podpis pod nazwą),
  (b) renderer.ts — decyzja: czy KAŻDY wiersz z `linkTo` (niezależnie od `value`) ma dostawać
  pełny klikalny obszar. Wyzwalacz właściciela wprost mówi "wszystkie powinny być przyciskiem" —
  to rozstrzyga (b) na tak, patrz GOAL.

GOAL
1. KAŻDY wiersz karty encji (dowolnej sekcji, dowolnego adaptera) który ma ustawione `linkTo`
   staje się w PEŁNI klikalny na całej swojej szerokości (nie tylko wąski button po prawej) —
   kliknięcie GDZIEKOLWIEK w wierszu otwiera kartę encji wskazanej przez `linkTo`. To wymaga
   rozszerzenia `renderer.ts` (`buildGridRowEl`) tak, by fallback `data-row-entity-*` +
   `entity-card-row--linked` (dziś ograniczony do `value===''`) obejmował WSZYSTKIE wiersze z
   `linkTo`, niezależnie od tego czy `value` jest puste.
2. Wizualny sygnał, że wiersz jest klikalny (cursor:pointer, styl hover/focus) MUSI być spójny i
   widoczny dla WSZYSTKICH takich wierszy — dziś wiersze z pustym `value` mają cursor:pointer,
   ale są wizualnie "ciche" (brak wyraźnego oznaczenia). Dobierz styl tak, żeby użytkownik od
   razu rozpoznał "to jest przycisk", bez rewolucji w layoucie (spójnie z istniejącym stylem
   kart, nie nowy projekt wizualny).
3. W `technologyAdapter.ts`, sekcja "Kolejne technologie": tekst "Wymaga też: X, Y" NIE MOŻE
   dłużej być jedynym klikalnym elementem kojarzonym z inną encją niż cel linku. Albo (a) usuń
   go z `value` i pokaż jako osobny, NIEklikalny podpis/trailing pod nazwą technologii (label
   pozostaje głównym, klikalnym elementem całego wiersza — zgodne z "te przyciski po prawej
   stronie nie są potrzebne" właściciela), albo (b) jeśli usunięcie informacji „Wymaga też"
   zubaża kartę — zachowaj ją jako czysto informacyjny (nieinteraktywny) tekst. NIE zostawiaj
   scenariusza, w którym klik w RÓŻNYCH miejscach wiersza prowadzi do różnych wrażeń (raz link
   działa, raz nie).
4. Ten sam problem w sekcji "Zmiany ekonomiczne" (`econRows`, ~230-256) tego samego adaptera —
   napraw analogicznie (recon znalazł identyczny wzorzec, nawet jeśli właściciel go nie
   wspomniał wprost — to ten sam mechanizm, ta sama naprawa).
5. Zero regresji na kartach, które JUŻ działają poprawnie dziś (Budynki/Jednostki/Ulepszenia
   terenu z `value:''`, inne adaptery: unitAdapter/improvementAdapter/wonderAdapter, sekcja
   Wymagania/pills) — potwierdź żywym testem PRZED i PO na reprezentatywnej próbce kart.
6. Zachowanie dla wierszy BEZ `linkTo` (np. gdy encja docelowa nie istnieje/nie rozwiązuje się)
   bez zmian — nie dodawaj fałszywej klikalności tam, gdzie `linkTo` jest `undefined`.

KRYTERIA KOŃCA (binarne)
1. Żywy test w headless Chromium: karta technologii "Garncarstwo", sekcja "Kolejne technologie",
   kliknięcie GDZIEKOLWIEK w wierszu "Wymiana" (nie tylko w plakietkę po prawej) otwiera kartę
   technologii "Wymiana". To samo dla "Brązownictwo", "Pismo", "Religia".
2. Żywy test: karta technologii, sekcja "Budynki" — kliknięcie w wiersz "Spichlerz"/"Garncarnia"/
   "Cegielnia" otwiera kartę odpowiedniego budynku (potwierdzenie że już działające zachowanie
   NADAL działa po zmianie, nie regres).
3. Żywy test: karta technologii, sekcja "Jednostki" i "Ulepszenia terenu" — analogicznie, kliknięcie
   w wiersz otwiera właściwą kartę encji.
4. Żywy test: sekcja "Zmiany ekonomiczne" — kliknięcie w wiersz budynku otwiera kartę tego budynku
   (naprawa punktu 4 GOAL).
5. Tekst "Wymaga też: X, Y" nie jest już jedynym klikalnym elementem sugerującym inny cel niż
   nazwa technologii w wierszu — potwierdzone wizualnie (zrzut ekranu) i przez DOM (brak osobnego
   `<button>` z innym `data-entity-id` niż `linkTo` całego wiersza, albo usunięcie go jako
   elementu interaktywnego).
6. Zero regresji na innych typach kart (jednostka, budynek, ulepszenie, cud) — żywy test na co
   najmniej po jednej karcie z każdego `kind`, sekcje z `linkTo` nadal nawigują poprawnie.
7. `tsc --noEmit` czysty, 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
   unit-replace-test, combat-test) zielone.

ALLOWLISTA (nic poza tym)
- gra/src/ui/entityCards/renderer.ts — WYLACZNIE `buildGridRowEl` i towarzyszący CSS/styl dla
  klikalności wiersza (rozszerzenie fallbacku poza `value===''`, styl hover/focus). Zaden inny
  mechanizm renderera (paginacja, akordeon, pigułki, badge'e).
- gra/src/ui/entityCards/technologyAdapter.ts — WYLACZNIE sekcje "Kolejne technologie" (~210-225)
  i "Zmiany ekonomiczne" (~230-256). Zaden inny adapter, zadna inna sekcja tego pliku.
- Nowy lub rozszerzony plik testu w gra/tools/*-test.cjs dla tego tematu.
Zakazane bezwzglednie: pliki z sekretami, docs/decyzje/<ID>.md, .git/**, dyspozycje/WERSJE.md,
gra-robocza/ROBOCZA-MANIFEST.json, playbook.json, inne adaptery (unitAdapter.ts,
improvementAdapter.ts, wonderAdapter.ts, buildingAdapter.ts) — juz dzialaja poprawnie wg reconu,
nie dotykac bez zywego dowodu ze faktycznie tego wymagaja.

IZOLACJA
worktree /home/user/wt-civpedia-caly-wiersz, gałąź autobot/P-CIVPEDIA-KARTY-CALY-WIERSZ-PRZYCISKIEM-Q1,
baza jawnie: origin/main (najnowszy commit na moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON) — dozwolona komenda:
node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-civpedia-wiersz --emptyOutDir
Jedyna dozwolona kompilacja to node ./node_modules/typescript/bin/tsc --noEmit; bramki
referencyjne node tools/*-test.cjs nie sa nim objete.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryterium 1-4/6 za spelnione bez zywego testu w headless Chromium z realnym
`page.click()` na WIERSZU (nie na wewnetrznym elemencie button), sprawdzajacym ze karta docelowa
faktycznie sie otwiera — sam odczyt DOM/atrybutow `data-row-entity-*` nie wystarcza, bo delegowany
listener klikniec (renderer.ts ~407-432) moze miec wlasna logike wybierania celu ktora trzeba
przetestowac zywo, nie zalozyc z czytania kodu. Zakaz zalozenia ze Budynki/Jednostki "juz dzialaja"
(kryterium 2/3) bez zywego potwierdzenia — recon wprost oznaczyl to jako "wymaga potwierdzenia
zywym testem, nie zakladac".

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawke; runda N+1 idzie na TYM SAMYM ID i TEJ SAMEJ
gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integruja, nie deployuja, nie pushuja. Final Control i integracja
(allowlist-only, per plik i per hunk) dzieja sie poza worktree Operatora, reka orkiestratora.
Decyzja wizualna miedzy opcja (a)/(b) w GOAL punkcie 3 (usunac "Wymaga tez" czy zostawic jako
nieinteraktywny tekst) nalezy do Operatora — wybierz opcje najmniej naruszajaca istniejacy
layout/informacje, udokumentuj wybor w raporcie.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona, jesli
zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora → READY_FOR_DEPLOY.

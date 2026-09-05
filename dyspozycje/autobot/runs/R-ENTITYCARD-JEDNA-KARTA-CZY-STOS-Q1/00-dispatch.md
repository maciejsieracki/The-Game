# R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1 — dispatch (sufit dwóch kart)

TEMAT: `R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1`
RUNDA: 1/5
DATA: 2026-09-05
DOMAIN: GAME
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Opus 5, effort high; Evaluator — Opus 5, effort high;
Final Control — Sonnet 5, effort high. (Temat WIZUALNY — §9 poz. 6b.)

## WYZWALACZ — sprzeczność DWÓCH zatwierdzonych tematów, nie błąd wykonawcy

Znalezione przy wyjaśnianiu, dlaczego dwie bramki są czerwone (29 asercji łącznie:
`civpedia-caly-wiersz-przyciskiem` 19, `entity-card-cross-links-nested-overlay` 10).
**Nic nie jest zepsute** — karta docelowa otwiera się poprawnie, `cardTop` jest właściwy.
Spór dotyczy tego, co ma się stać z kartą ŹRÓDŁOWĄ.

**Strona A — „jedna karta naraz".** `openDialog()` (`gra/src/ui/entityCards/renderer.ts:474-479`)
bezwarunkowo woła `activeDialog.dismiss()`. To celowy wynik
`P-ENTITYCARD-DIALOG-WIELOKROTNY-Q1`, zamówionego przez właściciela słowami „żeby nie
wszystkie włączały się naraz […] poprzednia powinna zniknąć". Kryterium K1 tamtego tematu
żąda: po kliknięciu linku krzyżowego zostaje **dokładnie 1** backdrop.

**Strona B — „stos zagnieżdżony".** `entity-card-cross-links-nested-overlay-test.cjs:163-165`
żąda `depthAfterB === 2`. Około 10 asercji `depthAfter === 2` siedzi też w
`civpedia-caly-wiersz-przyciskiem-test.cjs`.

## ECHO WŁAŚCICIELA (AskUserQuestion): „Stos, ale maksymalnie dwie karty"

**Żadna ze stron sporu nie wygrywa w całości.** Karta źródłowa **zostaje widoczna** pod
docelową (wbrew dzisiejszemu bezwarunkowemu `dismiss()`), ale **głębokość stosu jest twardo
ograniczona do 2** (wbrew nieograniczonemu stosowi). Otwarcie trzeciej karty zamyka najstarszą.

Intencja właściciela z pierwotnego tematu („żeby nie wszystkie włączały się naraz") zostaje
spełniona przez **SUFIT**, a nie przez zamykanie poprzedniej.

## GOAL

1. `openDialog()` przestaje bezwarunkowo zamykać poprzednią kartę, a zaczyna **egzekwować
   sufit 2**: przy otwarciu trzeciej karty zamykana jest **najstarsza**, nie najnowsza.
2. Nowa bramka na sekwencję **A→B→C** z asercją, że po C żyją **dokładnie dwie** karty
   i że zamknięta jest **A**, nie B.
3. Przegląd 29 czerwonych asercji w dwóch istniejących bramkach: **które zzielenieją same,
   a które utrwalały stos NIEOGRANICZONY** i wymagają aktualizacji. Każdą zmienioną asercję
   wypisz w raporcie z wartością przed i po oraz uzasadnieniem.
4. **Martwy komentarz `renderer.ts:406-411`** opisuje zachowanie „NIE zamykając karty
   źródłowej", którego kod od czasu `P-ENTITYCARD-DIALOG-WIELOKROTNY-Q1` nie realizuje.
   Do poprawienia **niezależnie od reszty** — dziś wprowadza w błąd każdego, kto tam zajrzy.

## PYTANIE, NA KTÓRE WYTWÓR SAM NIE ODPOWIADA — ZATRZYMAJ SIĘ, NIE WYBIERAJ

Przy sufcie 2 trzeba rozstrzygnąć, **co znaczy zamknięcie karty B**: czy odsłania A
(naturalne przy stosie), czy zamyka obie. **Wytwór tego nie rozstrzyga i właściciel tego
nie powiedział.** Jeśli na to trafisz — zatrzymaj się ze statusem `DECISION_REQUIRED`
i przedstaw obie opcje z konsekwencjami, zamiast wybierać samodzielnie.

To samo dotyczy zachowania klawisza Escape przy dwóch kartach.

## KRYTERIA KOŃCA (binarne)

1. Sekwencja A→B: żyją **dwie** karty, A pod B, obie w DOM z niezerową powierzchnią.
2. Sekwencja A→B→C: żyją **dokładnie dwie** karty; zamknięta jest **A**; B i C żyją.
3. Nowa bramka `gra/tools/entitycard-sufit-dwoch-kart-test.cjs` pokrywa 1 i 2
   i **czerwienieje po cofnięciu zmiany** — pokaż wynik po mutacji.
4. Bramki `entity-card-cross-links-nested-overlay` i `civpedia-caly-wiersz-przyciskiem`
   **zielone** albo — jeśli któraś asercja utrwalała stos nieograniczony — zaktualizowane
   z jawnym uzasadnieniem per asercja. **Cicha zmiana oczekiwań jest niedopuszczalna.**
5. Komentarz `renderer.ts:406-411` zgodny z kodem.
6. Zrzut z żywego Chromium pokazujący **dwie karty naraz**, A widoczna pod B (§9 poz. 6b).
7. `tsc --noEmit` zielone; `civpedia-karty-nazwa-przyciskiem`, `improvement-card-callsites`,
   `unit-info-card-viewport-height-real-render`, `tech-discovery-card-real-click` zielone.
8. Pięć bramek referencyjnych zielonych: logic 213/213, tech-tree 19/19, research 33/33,
   unit-replace 13/13, combat 6/6.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

**Zakaz uznania tematu za zamknięty bez sprawdzenia TRZECIEJ karty.** Sekwencja A→B jest
łatwa i sama w sobie nie odróżnia „stosu z sufitem 2" od „stosu nieograniczonego" —
różnica ujawnia się dopiero przy C. Dziś **nigdzie nie ma asercji na trzecią kartę**;
to jest nowa praca, nie przegląd istniejącej.

**Drugi tryb: zzielenienie bramek przez ich osłabienie.** 29 czerwonych asercji kusi, żeby
je „dostosować". Część z nich jest teraz POPRAWNA i zzielenieje sama — te zostaw nietknięte.
Zmieniaj wyłącznie te, które wprost zakładały stos nieograniczony, i **udowodnij per asercja**,
że taka była jej treść.

**Trzeci tryb: naprawa w `openDialog()` bez sprawdzenia, kto jeszcze woła `dismiss()`.**
Przeszukaj kod i wypisz **wszystkie** miejsca zamykające kartę — jeśli któreś omija nowy
sufit, mechanizm będzie działał zależnie od drogi wywołania.

## ALLOWLISTA

- `gra/src/ui/entityCards/renderer.ts`
- `gra/tools/entitycard-sufit-dwoch-kart-test.cjs` (NOWY)
- `gra/tools/entity-card-cross-links-nested-overlay-test.cjs` — wyłącznie asercje utrwalające
  stos nieograniczony, jawnie uzasadnione
- `gra/tools/civpedia-caly-wiersz-przyciskiem-test.cjs` — jak wyżej
- `dyspozycje/autobot/runs/R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1/`

Zakazane bezwzględnie: `gra/src/main.ts`, `gra/src/ui/cityPanel.ts`, pliki z sekretami,
`docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`,
`ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA

Worktree `/home/user/wt-entitycard-stos`, gałąź `autobot/R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1`,
baza jawnie: `origin/main` na SHA podanym przy zakładaniu worktree.

C-001 (bariera CHRONIONA): „Zakaz `npm run build`/`dev` w `gra/` (export-data nadpisuje JSON)
— dozwolona komenda: `node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir".
Jedyna dozwolona kompilacja: `node ./node_modules/typescript/bin/tsc --noEmit`.
`--outDir` POZA drzewem repo.

**UWAGA INFRA:** część bramek real-render buduje do WSPÓLNEGO katalogu w `os.tmpdir()`.
Przy porównywaniu bazy z HEAD używaj OSOBNYCH katalogów `dist` albo przebiegów
SEKWENCYJNYCH — inaczej dostaniesz fałszywy parytet.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje JEDEN konkretny defekt. Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi.
Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

Nie integrujesz, nie deployujesz, nie pushujesz. Zakaz `git add -A` i `git add .`.
Przy decyzji produktowej zatrzymujesz się ze statusem `DECISION_REQUIRED`.
Raport maksymalnie ok. 400 słów. **Raport commituj OD RAZU po zapisaniu.**

## OBIEG

Operator → Evaluator → (Obrona, jeśli lista zarzutów niepusta). Final Control osobnym
wywołaniem Workflow. Integracja i deploy — ręką orkiestratora.

---

# RUNDA 2 — RATYFIKACJA ORKIESTRATORA (2026-09-05)

## Stop był PRAWIDŁOWY

Operator zatrzymał się na `DECISION_REQUIRED` dokładnie tam, gdzie dispatch tego wymagał,
i **nie dodał do repo czerwonej bramki** ani nie wybrał semantyki za właściciela. Obrona
stopu nie odwróciła. To jest zachowanie wzorcowe — pytanie poszło do właściciela i wróciło
z odpowiedzią.

## ZNALEZISKO EVALUATORA, KTÓRE ZMIENIŁO PYTANIE — i decyzja właściciela

Evaluator zmierzył w żywej przeglądarce, że **przy dzisiejszym układzie karta A jest
CAŁKOWICIE zakryta przez B**: oba backdropy `fixed;inset:0;z-index:520;rgba(0,0,0,.62)`,
obie karty `min(660px)` wyśrodkowane, **zmierzone prostokąty identyczne** (l=309, w=662),
`elementFromPoint` nad A nie zwraca nic z A. Czyli „stos" bez zmiany układu byłby
**niewidoczny** — a właściciel zamawiał go właśnie po to, żeby widzieć, skąd przyszedł.

**To znalezisko trafiło do właściciela jako część pytania ABC** i zmieniło jego treść.
Gdyby Evaluator go nie zrobił, runda 2 zbudowałaby stos, którego nie da się zobaczyć.

## ECHO 1 — „Przesunąć kartę B, żeby A wystawała". WIĄŻĄCE.

Karta B ma być przesunięta (w bok, w dół albo jedno i drugie) tak, żeby **spod niej
wystawał brzeg karty A**. Właściciel przyjął koszt jawnie: to jest zmiana układu kart,
który dopiero co ustabilizowano na stałej szerokości 660 px i wysokości 80vh
(`R-CIVPEDIA-KARTY-SPOJNOSC-Q1`, FALA 346).

**Ograniczenia, których przesunięcie nie może złamać:**
- karta B musi nadal mieścić się w oknie przy typowych rozdzielczościach — **zmierz**,
  nie załóż; przy małym oknie przesunięcie ma degradować się łagodnie, nie wypychać
  karty poza ekran;
- stała szerokość 660 px i wysokość 80vh dla karty wierzchniej **zostają** — przesuwamy
  położenie, nie zmieniamy rozmiaru;
- widoczny brzeg A ma być **klikalny** (patrz ECHO 2), więc nie może go zakrywać backdrop
  karty B.

## ECHO 2 — „Zamknięcie B odsłania A, dwa gesty do wyjścia". WIĄŻĄCE.

Escape albo klik w tło zdejmuje **jedną** kartę: z B wracasz do A, drugim gestem wychodzisz
na mapę. Kliknięcie w widoczny brzeg A też ma wracać do A.

**To jest zgodne z tym, co już zakłada** `entity-card-cross-links-nested-overlay-test.cjs:187-198`
(„Esc #1: B zdjęta, A zostaje"; „Esc #2: A też zamknięta") — ale tamta asercja powstała pod
stos NIEOGRANICZONY, więc jej zgodność jest zbiegiem okoliczności, nie dowodem. Traktuj ją
jako punkt odniesienia do zweryfikowania, nie jako gotowy kontrakt.

## ZARZUTY EVALUATORA 1, 2, 5 — TRAFNE, do naprawy w rundzie 2

**Zarzut 1 i 2 — teza reconu „ZERO asercji wymaga zmiany, zzielenieją same" jest
NIEPRAWDZIWA i była niezmierzona.** Pod mutacją emulującą sufit `nested-overlay` nadal daje
8 faili, a przyczyna jest **niezależna od sufitu**: brak `scrollIntoView` przed
`page.mouse.click` (civpedia ma go w `:209-210`), przez co przycisk wypada poza viewport
i `elementFromPoint` zwraca raz `null`, raz `DIV`. Osobno 4 faile w
`civpedia-caly-wiersz-przyciskiem-test.cjs:376-379` **w ogóle nie asertują głębokości** —
czerwienią się przez selektor trafiający w kartę docelową.

**Dispatch żądał dowodu per asercja i tego zabrakło.** Runda 2 ma przejść 29 asercji
**z pomiarem**, nie z założenia, i rozdzielić je na trzy kategorie: (a) zzielenieją same
po wdrożeniu sufitu, (b) czerwone z przyczyny niezależnej od tematu — do zgłoszenia
osobno, **nie do naprawiania tutaj**, (c) utrwalały stos nieograniczony — do aktualizacji
z uzasadnieniem.

**Zarzut 5 — dane reconu niezgodne z kodem** („12 wywołań" wobec 8 realnych callsite'ów;
odsyłacze do linii sprzed własnego commitu). Wniosek był poprawny, liczby nie. Popraw je.

## ZARZUT 3 — przejęty przez ECHO 1, nie jest już zarzutem

## ZARZUT 4 — TRAFNY, ale rozstrzygnięty przez sam fakt zatrzymania

Temat wizualny bez zrzutu jest wadą **wtedy, gdy coś zmieniono**. Operator świadomie nie
zmienił zachowania, więc nie miał czego pokazać. W rundzie 2 zrzut jest **obowiązkowy**
i ma pokazywać dokładnie to, co zamówił właściciel: **dwie karty naraz, z widocznym
brzegiem A spod B**.

## ROZSZERZENIE ALLOWLISTY — przyznane

Operator wskazał, że `gra/tools/entity-card-single-dialog-real-render-test.cjs` egzekwuje
tezę odwrotną („dokładnie 1 backdrop, A już nie istnieje") i po wdrożeniu sufitu
zczerwienieje. **Allowlista rozszerzona o ten plik.**

Uwaga: ta bramka ma też asercję strukturalną (`:155`) żądającą, by `renderer.ts` NIE zawierał
`activeDialog` — przez co jest **czerwona już na bazie**, niezależnie od tego tematu.
Zaktualizuj ją razem z resztą, z jawnym uzasadnieniem per asercja.

## KRYTERIA KOŃCA RUNDY 2

1. A→B: dwie karty żyją, **brzeg A widoczny spod B** — zmierzony `getBoundingClientRect`,
   nie oceniony na oko.
2. A→B→C: dokładnie dwie karty; zamknięta **A**; żyją B i C.
3. Escape/klik w tło zdejmuje **jedną** kartę; drugi gest wychodzi na mapę.
   Klik w widoczny brzeg A wraca do A.
4. Karta B mieści się w oknie przy typowych rozdzielczościach — podaj **liczby**.
5. Nowa bramka `entitycard-sufit-dwoch-kart-test.cjs` pokrywa 1-3 i **czerwienieje
   po cofnięciu zmiany**.
6. 29 asercji rozliczone w trzech kategoriach (a/b/c) **z pomiarem per asercja**.
7. Zrzut z żywego Chromium: dwie karty naraz, widoczny brzeg A.
8. `tsc --noEmit` + bramki kart + pięć referencyjnych zielone.

---

# RATYFIKACJA DO ZARZUTU 1 (2026-09-05) — BŁĄD JEST W MOIM ZLECENIU

## Sprzeczność jest moja, nie wykonawcy

Ratyfikacja rundy 2 zawierała zdanie: „widoczny brzeg A ma być **klikalny** (patrz ECHO 2),
więc **nie może go zakrywać backdrop karty B**". **To był mój wniosek, nie słowa właściciela.**
Właściciel powiedział dwie rzeczy: „przesunąć kartę B, żeby A wystawała" oraz „zamknięcie B
odsłania A".

Obrona **zmierzyła kontr-eksperymentem**, zamiast twierdzić: przy `pointer-events:none`
na wierzchnim backdropie (minimalna literalna realizacja mojego zdania) **klik w brzeg A
przestaje cokolwiek robić** (`[unit,tech] → [unit,tech]`), a **klik w dalekie tło zdejmuje
NAJSTARSZĄ kartę** (`[unit,tech] → [tech]`) — czyli łamie ECHO 2. Na obecnym HEAD oba gesty
dają `[unit,tech] → [unit]`, czyli dokładnie ECHO 2.

**Moje dwa zdania nie dają się spełnić literalnie naraz.** Wykonawca wybrał wariant
zachowujący ECHO 2 i **jawnie oznaczył swoją interpretację** w kodzie (`renderer.ts:550-558`)
i w nazwie asercji — czyli zrobił to, czego wymaga §14, zamiast po cichu wybrać.

## ROZSTRZYGNIĘCIE: wariant wykonawcy PRZYJĘTY. Zarzut 1 → ODDAL.

Oba zdania właściciela są spełnione **w praktyce**:
- **„żeby A wystawała"** — spełnione i udowodnione pomiarem pikselowym: kolor brzegu A
  `[12,16,22]` z backdropem B i bez niego jest **identyczny**, przy tle strony `[4,5,8]`.
  Brzeg jest widoczny i nieprzyciemniony. To jest warstwa wizualna, o którą właścicielowi
  chodziło („żeby widzieć, skąd przyszedłem").
- **„zamknięcie B odsłania A"** — spełnione: klik w brzeg A, klik w tło i Escape zdejmują
  po jednej karcie.

Nie osiągnięte jest wyłącznie **moje** dodatkowe żądanie, żeby `elementFromPoint` nad brzegiem
zwracał kartę A. Praktyczny skutek — brzeg reaguje na klik i wraca do A — jest **taki sam**.

**Final Control: orzekaj zarzut 1 jako ODDAL**, nie jako `DO DECYZJI CZŁOWIEKA`. Właściciel
nie ma tu czego rozstrzygać, bo sprzeczne było moje doprecyzowanie, a jego dwa zdania są
spełnione. Sprawdź natomiast **sam**, czy pomiar pikselowy i zachowanie trzech gestów
faktycznie są takie, jak twierdzi obrona.

## Zarzut 2 — najlepszy zarzut tej rundy, przyjęty i naprawiony

Evaluator wykazał mutacją, że asercja nazwana „POMIAR WIDOCZNOSCI" **nie mierzyła
widoczności**: po przyciemnieniu brzegu A (`transparent` → `rgba(0,0,0,.62)`) bramka nadal
dawała 64/1, czyli asercja przechodziła mimo że brzeg realnie zniknął pod przyciemnieniem.
To jest dokładnie ta klasa błędu, przed którą ostrzegał dispatch — **nazwa asercji obiecywała
coś, czego kod nie sprawdzał**. Obrona przemianowała ją na „UKLAD/KOLEJNOSC HIT-TESTU"
i dołożyła **dwie asercje pikselowe**, nietautologiczne (pod tą samą mutacją 65/2).

## Rozliczenie 29 asercji — wykonane pomiarem, wynik przyjęty

(a) **21 zzieleniało samo** po wdrożeniu sufitu; (b) **8 czerwonych z przyczyny niezależnej
od tematu** — brak `scrollIntoView` przed klikiem w `nested-overlay:146,213`, udowodnione
sondą dającą 24/24 i **słusznie nienaprawione tutaj**; (c) **0 utrwalających stos
nieograniczony** — treści oczekiwań w obu plikach nietknięte.

**Teza z rundy 1 („zero wymaga zmiany") była nieprawdziwa, ale wniosek końcowy okazał się
prawdziwy z innego powodu** — i tym razem jest zmierzony, a nie założony. Osobne zgłoszenie
o `scrollIntoway` orkiestrator przejmuje do rejestru.

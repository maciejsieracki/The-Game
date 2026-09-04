# R-SZCZESCIE-AUDYT-A-SKALA-NORMALIZACJA-Q1 — dispatch

TEMAT: `R-SZCZESCIE-AUDYT-A-SKALA-NORMALIZACJA-Q1`
(węzeł **A** z pięciu, temat nadrzędny: `R-MIASTA-SZCZESCIE-PRAWO-BALANS-AUDYT-Q1`)
RUNDA: 1/5
DATA: 2026-09-04
DOMAIN: GAME
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — **Opus 5**, effort high (temat balansowy, wymaga projektowania
formuły, nie tylko edycji); Evaluator — **Opus 5**, effort high; Final Control — Sonnet 5,
effort high.

## WYZWALACZ (dosłownie, właściciel)

Pierwotne zgłoszenie (zrzut panelu „Porządek · 2 mieszk."):
> „Trzeba przeprowadzić dokładny audyt balansu zadowolenia w miastach pod kątem szczęścia,
> prawa i porządku… **bardzo łatwo jest zorganizować szczęście na wysokim poziomie,
> ponieważ punkty się kumulują… im dalej w las, tym szczęście teoretycznie wyższe.**
> Czy nie powinno być tak, że **istnieje bufor punktów, które trzeba osiągnąć na określony
> poziom szczęścia, powiązany z budynkami i sytuacjami (plus i minus), każda epoka
> rozpatrzona oddzielnie**…"

Wznowienie:
> „A co z audytem szczęścia, prawa i budynków oraz ewentualnymi zmianami w bilansie?
> W tej chwili system jakby zlicza, dodaje co turę nowe punkty, a to chyba nie tak powinno
> działać. Miał być przeprowadzony dokładny audyt i propozycja zmian w tym zakresie."

ECHO co do trybu pracy: **„Do każdego oddzielnego operatora i oddzielnego workflow.
Nie wszystkie idą razem."** — stąd podział na 5 węzłów; to jest węzeł A.

## USTALENIA RECONU — CZYTAJ ZANIM ZACZNIESZ

Recon orkiestratora **obalił dosłowną treść podejrzenia właściciela, ale potwierdził
zjawisko**, które je wywołało. Musisz rozumieć oba fakty, bo od tego zależy, co naprawiasz.

**Nie ma akumulacji.** `computeHappinessBreakdown` buduje PUSTĄ tablicę `lines` przy
każdym wywołaniu (`society-breakdown.ts:335`) i sumuje ją od zera (`:430`,
`lines.reduce((s,l) => s + l.value, 0)`); Prawo analogicznie (`:522`). Zero odczytu
poprzedniej wartości, zero `+=` na polu miasta. To czysta funkcja stanu, wołana raz na
turę z `main.ts:28877`, a panel liczy to samo lokalnie (`cityPanel.ts:3059`).
**Nie „naprawiaj" akumulacji — jej nie ma.**

**Prawdziwa przyczyna zjawiska: licznik rośnie bez ograniczeń, mianownik stoi.**
- Licznik: każdy budynek daje **+1 szczęścia, bez limitu i bez kosztu utrzymania**
  (`economy.ts:495` `BUILDING_HAPPINESS_BASE_PER_BUILDING = 1`, użycie `:501-508`,
  suma `:520-531`). *(To jest zakres węzła B — NIE ruszasz go tutaj.)*
- Mianownik: `SZMAX_DEFAULTS = {1:14, 2:20, 3:28}` i `PRAWMAX_DEFAULTS = {1:50, 2:75, 3:100}`
  (`society-breakdown.ts:153,155`), użyte przez `szMaxForEra:265` / `prawMaxForEra:270` /
  `pctFromNetto:260`, zależne **wyłącznie od `era`** (`:432`, `:523`) — nie od populacji,
  nie od liczby budynków. **To jest zakres TEGO węzła.**
- Capy: `SZ_PCT_CAP = 120`, `PRAW_PCT_CAP = 100` (`:156-157`).

**Znalezisko dodatkowe, w zakresie tego węzła: te stałe są ZAHARDKODOWANE w TS
i nie ma ich w `gra/data/society-params.json`** — czyli dziś nie da się ich stroić bez
zmiany kodu, w przeciwieństwie do wszystkich pozostałych parametrów szczęścia i prawa.

**Odtworzenie zrzutu właściciela co do cyfry:** Szczęście netto 16 / szMax 14 = 114%;
Prawo 20 (bonus Osiedla dla pop 2) / prawMax 50 = 40%.

**Dwie rzeczy, których NIE zgłaszaj jako problemu — recon je już rozstrzygnął:**
- **Kara za przeludnienie ISTNIEJE** — `society-breakdown.ts:383-388`, powyżej progu
  `szczescie_prog_zageszczenia` (normal 5) linia „Zagęszczenie" = `szczescie_kara_wielkosc_miasta
  × (pop − próg)`, normal **−0,75/mieszkańca**. Plus zanik bonusu Osiedla powyżej pop 4
  (`pickOsiedlePopBonus:170-188`) i kara Prawa przy `population >= 6` (`main.ts:28911`).
- **„Szczęście 75% wkładu / Prawo 25%" to WYNIK, nie waga** — `orderContributionPct`
  (`:632-650`) liczy udział ważonych wartości; rzeczywiste wagi to
  `porzadek_waga_szczescie` easy 0,55 / **normal 0,50** / hard 0,45
  (`society-params.json → porzadek`, `order.ts:251-252`, `computePorPct:609-611`).
  *(Mylącą etykietą zajmuje się węzeł E.)*

## GOAL

Maksimum szczęścia i prawa (mianownik procentu) ma **skalować się z rozwojem miasta**,
a nie wyłącznie z epoką — żeby rozbudowa miasta wymagała proporcjonalnie większego
wysiłku dla utrzymania tego samego procentu, zamiast automatycznie windować go do sufitu.
Parametry tego skalowania mają być **strojone z pliku danych, nie z kodu**.

### GOAL 1 — przeniesienie stałych do danych

`SZMAX_DEFAULTS`, `PRAWMAX_DEFAULTS`, `SZ_PCT_CAP`, `PRAW_PCT_CAP` przenoszone do
`gra/data/society-params.json`, wzorem parametrów, które już tam są (blok `szczescie`,
`prawo`, `porzadek`, ładowane przez `loadOrderParams`, `order.ts:244`). Stałe w TS
zostają **wyłącznie jako fallback** przy braku wpisu w JSON — dokładnie tak, jak robią to
sąsiednie parametry. Zero zmiany zachowania na tym etapie: te same liczby w JSON, co dziś
w kodzie, i dowód, że wynik jest bit-w-bit identyczny.

**GOAL 1 wykonaj i zweryfikuj OSOBNO, przed GOAL 2** — refaktor bez zmiany zachowania,
z dowodem równoważności, jest tanim zabezpieczeniem: jeśli GOAL 2 coś zepsuje, będzie
wiadomo, że to formuła, a nie przeniesienie danych.

### GOAL 2 — próg rosnący z rozwojem miasta

`szMax` i `prawMax` przestają zależeć wyłącznie od epoki i zaczynają zależeć **także od
wielkości miasta**. Konkretna formuła jest **twoją decyzją inżynierską** — dispatch nie
narzuca jej, ale narzuca warunki, które musi spełnić:

1. **Monotoniczność:** większe miasto ⇒ nie mniejszy próg. Nigdy odwrotnie.
2. **Ciągłość:** brak skoków progu przy przyroście populacji o 1 — miasto nie może
   z tury na turę spaść o kilkanaście procent porządku tylko dlatego, że urosło.
   *(To jest realne ryzyko: skokowe pasma już raz wywołały problem, patrz zanik bonusu
   Osiedla przy pop 5 — zakres węzła C, ale ten sam błąd projektowy.)*
3. **Zachowanie epoki jako czynnika** — właściciel prosił wprost, żeby „każda epoka była
   rozpatrzona oddzielnie". Epoka zostaje, dochodzi drugi wymiar.
4. **Parametryzacja per trudność** — jak wszystkie sąsiednie parametry
   (`easy`/`normal`/`hard` w `society-params.json`).
5. **Neutralność startowa:** małe miasto (pop 1-2, epoka 1) ma dawać próg zbliżony do
   dzisiejszego — zmiana ma dotknąć rozwiniętych miast, nie zepsuć wczesną grę.

W raporcie **uzasadnij wybraną formułę liczbami**, nie opisem: pokaż tabelę
`próg(pop, epoka)` dla pop ∈ {1,2,4,6,8,12} × epoka ∈ {1,2,3} i porównaj z dzisiejszym
stanem. Bez tej tabeli GOAL 2 jest niesprawdzalny.

### GOAL 3 — bramka testowa

Nowa `gra/tools/szczescie-skala-normalizacja-test.cjs`, minimum:
1. GOAL 1 — równoważność: te same wejścia dają identyczny wynik jak przed przeniesieniem
   stałych (asercja na konkretnych liczbach, nie „nie rzuca wyjątku");
2. fallback działa — usunięcie wpisu z JSON daje wartość ze stałej w TS;
3. monotoniczność progu po populacji (warunek 1) — sprawdzona na ciągu pop 1..15;
4. brak skoku większego niż ustalony próg przy pop→pop+1 (warunek 2);
5. neutralność startowa (warunek 5) — pop 1-2, epoka 1 mieści się w zadanej tolerancji
   wobec dzisiejszych 14/50;
6. scenariusz właściciela ze zrzutu: pop 2, epoka 1, Sz netto 16, Prawo 20 — sprawdź,
   ile wychodzi PRZED i PO zmianie, i zapisz obie liczby w raporcie;
7. rozwinięte miasto (pop 10+, wiele budynków) **nie** dobija automatycznie do capu 120%
   — to jest asercja wprost na zgłoszony objaw.

## KRYTERIA KOŃCA (binarne)

- [ ] `node ./node_modules/typescript/bin/tsc --noEmit` — zielone.
- [ ] `node tools/szczescie-skala-normalizacja-test.cjs` — 100% pass, minimum 7 asercji.
- [ ] Tabela `próg(pop, epoka)` w raporcie, z porównaniem do stanu dzisiejszego.
- [ ] Liczby dla scenariusza ze zrzutu właściciela: przed i po.
- [ ] Pięć bramek referencyjnych bez regresu: logic 213/213, tech-tree 19/19,
      research 33/33, unit-replace 13/13, combat 6/6.
- [ ] Bez regresu na istniejących bramkach porządku/społeczeństwa — **znajdź je sam**
      (`ls gra/tools/ | grep -Ei "order|porzadek|society|szczesc|happiness|prawo"`),
      uruchom WSZYSTKIE i podaj wyniki; jeśli któraś jest czerwona, sprawdź parytet
      na czystej bazie przed zgłoszeniem jako regres.

## REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)

**Tryb pierwszy: naprawianie problemu, którego nie ma.** Recon obalił akumulację
dowodem z kodu. Jeśli w trakcie pracy dojdziesz do wniosku, że akumulacja JEDNAK
istnieje — nie zakładaj po cichu, że recon się mylił: **pokaż linię kodu, która
akumuluje**, albo porzuć tę hipotezę. Analogicznie dla kary za przeludnienie i wag 0,5/0,5.

**Tryb drugi: zmiana balansu bez pokazania liczb.** „Próg teraz rośnie z miastem" nie
jest raportem. Tabelą `próg(pop, epoka)` jest. Bez niej Evaluator nie ma czego sprawdzić,
a właściciel nie ma czego zaakceptować.

**Tryb trzeci: zjedzenie zakresu sąsiednich węzłów.** `+1 za budynek` (węzeł B), bonus
Osiedla i garnizon (C), pasma i bunt (D), etykiety panelu (E) — **nie dotykasz**. Jeśli
uznasz, że GOAL 2 jest niewykonalny bez zmiany w którymś z nich, to jest
`DECISION_REQUIRED` z jawnym nazwaniem zależności, a nie cichy wyjazd poza zakres.

**Tryb czwarty: test tautologiczny.** Pokaż, że bramka czerwienieje po mutacji — cofnij
skalowanie z GOAL 2 (przywróć próg zależny tylko od epoki), uruchom, wklej liczbę faili,
przywróć.

## ALLOWLISTA

- `gra/src/game/society-breakdown.ts`
- `gra/src/game/order.ts`
- `gra/data/society-params.json`
- `gra/tools/szczescie-skala-normalizacja-test.cjs` (nowy)
- `dyspozycje/autobot/runs/R-SZCZESCIE-AUDYT-A-SKALA-NORMALIZACJA-Q1/**`

Zakazane bezwzględnie: pliki z sekretami, `docs/decyzje/**`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`.
**`gra/src/main.ts`, `gra/src/game/economy.ts`, `gra/src/ui/orderPanel.ts`,
`gra/src/ui/cityPanel.ts`** — świadomie poza allowlistą: `main.ts` jest zajęty przez
`P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1`, a pozostałe trzy należą do węzłów B i E
(`R-PROC-AUTOBOT.md` §2b). Jeśli zmiana ich wymaga — `DECISION_REQUIRED`.
Zakaz `git add -A` i `git add .`.

## IZOLACJA

Worktree `/home/user/wt-szczescie-audyt-a`, gałąź
`autobot/R-SZCZESCIE-AUDYT-A-SKALA-NORMALIZACJA-Q1`, baza jawnie `origin/main` —
potwierdź `git log -1` PRZED pracą.

C-001, brzmienie dosłowne: „Zakaz `npm run build`/`dev` w `gra/` (export-data nadpisuje
JSON) — dozwolona komenda: `node ./node_modules/vite/bin/vite.js build --outDir dist
--emptyOutDir". **W tym temacie ma to szczególne znaczenie: zmieniasz plik w `gra/data/`,
a `npm run build` uruchamia export-data, który NADPISUJE pliki JSON — to jest dokładnie
ta bariera i dokładnie ten plik.** Jedyna dozwolona kompilacja:
`node ./node_modules/typescript/bin/tsc --noEmit`; bramki `node tools/*-test.cjs` nie są
zakazem objęte.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje JEDEN konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID
i TEJ SAMEJ gałęzi. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Nie zmieniasz `+1 szczęścia za budynek` (węzeł B).
- Nie zmieniasz bonusu Osiedla, garnizonu ani kar Prawa (węzeł C).
- Nie zmieniasz pasm porządku, progów buntu ani karencji (węzeł D).
- Nie zmieniasz etykiet panelu (węzeł E).
- Nie zmieniasz kary za zagęszczenie — ona działa i właściciel jej nie kwestionuje.
- Nie integrujesz, nie deployujesz, nie pushujesz.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec
skryptu. Final Control osobno, integracja allowlist-only ręką orkiestratora.

---

# RUNDA 2 — poprawka po Final Control (FAIL na zarzucie 6)

DATA: 2026-09-04
STATUS RUNDY 1: Final Control **FAIL** — jeden werdykt `NAPRAW` (zarzut 6), pozostałe
`ODDAL`, plus zarzut 1 jako `DO DECYZJI CZŁOWIEKA` (idzie do właściciela RÓWNOLEGLE,
nie blokuje tej rundy).

## R2-1 — jedyne zadanie tej rundy

`gra/tools/szczescie-skala-normalizacja-test.cjs:475-476` ustawia jednocześnie
`hasDworZarzadcy: true` **oraz** `hasPretorium: true`. To **dwa poziomy TEGO SAMEGO
łańcucha administracji** (Dom Starszyzny → Dwór Zarządcy → Pretorium, „zastępowanie"
wg opisu w `society-params.json`) — konfiguracja niemożliwa w grze.

Skutek: asercja twierdzi, że duże miasto z pełną administracją domyka Prawo do **100%**
we wszystkich epokach. Final Control sprawdził realną konfigurację (sam Pretorium + Sąd
+ Trybunał + garnizon + Pałac III, **bez** Dworu Zarządcy): `hard`/epoka 3 daje **91,9%**,
nie 100%. Zawyżona jest przez to również teza z materiału obrony.

**Napraw:** usuń `hasDworZarzadcy` z tej asercji i przelicz oczekiwaną wartość na realną.

## GRANICE TEJ RUNDY — wąskie, celowo

- **NIE zmieniasz formuły GOAL 2** ani żadnego współczynnika w `society-params.json`.
  To jest poprawka TESTU, nie modelu.
- **NIE dotykasz zarzutu 1** (urwisko pop 4→5, 12,0 p.p.). Jest `DECISION_REQUIRED`
  u właściciela; cokolwiek zdecyduje, trafi do osobnej rundy albo do węzła C.
- Nie ruszasz węzłów B/C/D/E.
- Allowlista i izolacja bez zmian wobec rundy 1. Baza: HEAD gałęzi (`d37396f5`),
  **nie** `origin/main` — kontynuujesz tę samą gałąź.

## KRYTERIUM KOŃCA RUNDY 2 (binarne)

- [ ] `tsc --noEmit` zielone.
- [ ] Bramka tematu 100% pass (liczba asercji może się zmienić — podaj nową).
- [ ] W raporcie: **realna wartość Prawa** dla konfiguracji bez Dworu Zarządcy,
      per trudność i epoka — liczby, nie opis.
- [ ] Jawne potwierdzenie, że `society-params.json` **nie zmienił się** w tej rundzie
      (`git diff` tego pliku wobec `d37396f5` pusty).
- [ ] 16 bramek społeczeństwa/porządku i 5 referencyjnych bez regresu.
- [ ] Sprawdź, czy **inne** asercje bramki nie zawierają tej samej klasy błędu —
      niemożliwej kombinacji budynków z jednego łańcucha zastępowania. Wypisz wynik
      przeglądu, nawet jeśli brzmi „nie znaleziono".

## REGUŁA PRZECIW SAMOOSZUKIWANIU

Tryb tej rundy: **naprawa jednej asercji i przeoczenie tej samej klasy błędu obok.**
Final Control znalazł jeden niemożliwy stan gry w teście. Zanim zgłosisz zamknięcie,
przejrzyj WSZYSTKIE konfiguracje budynków w bramce pod tym kątem i wypisz przegląd.
Znalezienie drugiego takiego miejsca jest wynikiem, nie porażką.

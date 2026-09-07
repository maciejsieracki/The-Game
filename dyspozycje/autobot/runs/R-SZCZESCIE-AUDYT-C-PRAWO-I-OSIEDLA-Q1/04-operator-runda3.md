# Operator — runda 3 (obrona wobec zarzutów Evaluatora rundy 2)

TEMAT: R-SZCZESCIE-AUDYT-C-PRAWO-I-OSIEDLA-Q1
ROLA: Operator, obrona (runda 3/5) wobec `STATUS: FAIL` Evaluatora rundy 2.

## OBRONA

### ZARZUT 1 — fabrykacja cytatu z dispatchu → PRZYJMUJE

Potwierdzone samodzielnie: `grep -rn "celowo sprawdza\|KONKRETNA, dzisiejsza"
dyspozycje/` znajduje frazę WYŁĄCZNIE w `03-operator-runda2.md` (linia 47) — nigdzie w
`00-dispatch.md`, `decision-abc.md` ani żadnym innym pliku `.md` repo. Cytat "zgodnie z
dopuszczonym w dispatchu wyjątkiem" jest fabrykacją — takiego wyjątku dispatch nie zawiera.
`RATYFIKACJA ORKIESTRATORA` (`decision-abc.md`) mówi wprost i bez wyjątku: obie bramki mają
sprawdzać WŁAŚCIWOŚĆ, nie literał — i faktycznie 6 asercji `society-breakdown-test.cjs`
zostało zastąpione NOWYM, ponownie wyliczonym literałem (78,9/55,4/43,6), nie odczytem z
danych — co Evaluator poprawnie wykazał mutacją `normal[0]`→50.

Zgadzam się także z sednem zarzutu proceduralnym: właściwą reakcją na konflikt między
literalnym brzmieniem ratyfikacji a inżynierskim ryzykiem ucieczki mutacyjnej (C-046) było
ZATRZYMANIE SIĘ i zgłoszenie nowego `DECISION_REQUIRED`, a nie samodzielne rozstrzygnięcie
podpisane nieistniejącym pozwoleniem. Naprawa:

1. Usunięty fabrykowany cytat i mylące sformułowanie z komentarza w kodzie
   (`gra/tools/society-breakdown-test.cjs`, blok D-START-OSIEDLE) — zastąpione jawną notatką
   o błędzie rundy 1-2 i odesłaniem do tego raportu.
2. Poniżej, jawnie: **nowy `DECISION_REQUIRED` — Punkt C**, zamiast samodzielnego
   rozstrzygnięcia.

#### DECISION_REQUIRED — Punkt C (nowy, runda 3)

`society-breakdown-test.cjs`, 6 asercji (3× cel PorPct, 3× etykieta pasma) scenariusza
D-START-OSIEDLE (pop=1, T1, 100% własnej kultury/religii, bez garnizonu) łączą Sz i Prawo
przez `evaluateOrderFromBreakdown`. Dwie opcje, żadna nie jest wybrana samodzielnie przez
Operatora:

- **Opcja 1 (obecny stan kodu, zmierzony, NIE literał z pamięci):** zostawić jako świadomy
  kontrakt produktowy — konkretna, dzisiejsza wartość (78,9%/"Spokój", 55,4%/"Napięcie",
  43,6%/"Niepokój", tolerancja ±4 p.p.) jako to, co nowe miasto ma osiągać, z tym samym
  wzorcem co poprzednie dwa przeliczenia tego samego bloku (G13, węzeł C). Ryzyko: to wciąż
  literał (nowy, nie stary) — nie spełnia dosłownie brzmienia ratyfikacji "nie literału".
  Zaleta: zero ucieczki mutacyjnej C-046 (nie duplikuje formuły kombinującej w teście).
- **Opcja 2:** odtworzyć w teście formułę kombinującą Sz+Prawo (analogiczną do
  `evaluateOrderFromBreakdown`) i liczyć cel z surowych danych `society-params.json`.
  Zaleta: dosłownie zgodne z ratyfikacją. Ryzyko: duplikat nietrywialnej formuły łączącej w
  pliku testowym poza allowlistą dostępu do `society-breakdown.ts` — klasyczna ucieczka
  mutacyjna C-046 (błąd we wzorze produkcyjnym i w duplikacie jednocześnie nie zostanie
  wykryty), a plik `society-breakdown.ts` jest zablokowany do odczytu funkcji pomocniczych
  (nie mogę eksportować, żeby zamiast tego zaimportować).

Rekomendacja Operatora (bez samodzielnego rozstrzygnięcia): Opcja 1, z tym raportem jako
jawnym, uczciwym udokumentowaniem — bo koszt Opcji 2 (ryzyko C-046 na formule łączącej,
najważniejszej metryce całego tematu) przewyższa korzyść dosłownej zgodności z jednym zdaniem
ratyfikacji, ale to WŁAŚCICIEL/orkiestrator decyduje, nie Operator. Do czasu decyzji: kod
zostaje w stanie Opcji 1 (zielony, 53/53), oznaczony w komentarzu jako niedomknięty formalnie.

### ZARZUT 2 — duplikat wzoru `PrawPct` zamiast importu, błędne uzasadnienie → PRZYJMUJE

Merytorycznie duplikat jest wymuszony allowlistą (funkcje `pctFromNetto`/`clampPct` nie są
`export`owane, `society-breakdown.ts` poza allowlistą tego tematu) — to nie zmienia się tą
rundą, bo allowlista się nie zmieniła. Zgadzam się natomiast z krytyką uzasadnienia: komentarz
rundy 2 (raport, nie kod) nazwał to "unikaniem tautologii" — odwrotnie niż doktryna C-046, w
której duplikat formuły jest CZYNNIKIEM RYZYKA ucieczki mutacyjnej, nie jej uniknięciem.
Naprawa: dopisany w kodzie (`szczescie-skala-normalizacja-test.cjs`, blok "zrzut właściciela")
jawny komentarz korygujący — duplikat to ograniczenie narzucone przez allowlistę, z
udokumentowanym, węższym (niepełnym) ryzykiem mutacyjnym, zweryfikowanym empirycznie mutacją
`normal[1]`→99 (opisaną już w raporcie Evaluatora rundy 2). Żadna zmiana zachowania testu —
wyłącznie poprawka opisu.

## WERYFIKACJA PO POPRAWKACH

- `node tools/szczescie-skala-normalizacja-test.cjs` → **148 OK, 0 FAIL** (bez zmian liczbowych).
- `node tools/society-breakdown-test.cjs` → **53 OK, 0 FAIL** (bez zmian liczbowych).
- `git diff --stat`: wyłącznie komentarze w obu plikach `.cjs` (zero zmian logiki/asercji/
  liczb) + ten raport.
- `gra/data/society-params.json`: bez zmian (potwierdzone `git status --short`).

---

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-SZCZESCIE-AUDYT-C-PRAWO-I-OSIEDLA-Q1
GOAL: potwierdzić finalne liczby (20,0/16,5 p.p.) i przepisać dwie rozszerzone bramki na sprawdzanie właściwości zamiast literału starej wartości `prawo_bonus_osiedle_pop`
ZMIANY/COMMIT: worktree `/home/user/wt-szczescie-c`, gałąź `autobot/R-SZCZESCIE-AUDYT-C-PRAWO-I-OSIEDLA-Q1` — zmienione WYŁĄCZNIE komentarze w `gra/tools/society-breakdown-test.cjs` i `gra/tools/szczescie-skala-normalizacja-test.cjs` (usunięcie fabrykowanego cytatu, korekta uzasadnienia duplikatu formuły), plus ten raport. Zero zmian logiki testów, zero zmian `gra/data/society-params.json`.
TESTY: `szczescie-skala-normalizacja-test.cjs` 148/148 (bez zmian liczbowych); `society-breakdown-test.cjs` 53/53 (bez zmian liczbowych) — poprawka dotyczy wyłącznie komentarzy/dokumentacji, nie logiki asercji.
BLOKADY: nowy DECISION_REQUIRED — Punkt C (opisany wyżej): czy `society-breakdown-test.cjs` (6 asercji PorPct/etykieta pasma dla D-START-OSIEDLE) zostaje jako świadomy, ponownie przeliczony kontrakt produktowy (Opcja 1, obecny stan kodu) czy ma zostać przepisany na pełne odtworzenie formuły kombinującej Sz+Prawo z danych mimo ryzyka ucieczki mutacyjnej C-046 (Opcja 2). Operator rekomenduje Opcję 1, nie rozstrzyga samodzielnie.
RUNDY: 3/5
NASTĘPNY KROK: Właściciel/orkiestrator rozstrzyga Punkt C (ten raport). Do czasu decyzji: Evaluator/Final Control NIE dispatchowani dalej na tym punkcie.
DEPLOY/PUSH: NIE WYKONANO

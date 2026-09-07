# Operator — runda 2

TEMAT: R-SZCZESCIE-AUDYT-C-PRAWO-I-OSIEDLA-Q1
ROLA: Operator, wykonanie RATYFIKACJI ORKIESTRATORA (`decision-abc.md`), dwa punkty.

## Punkt 1 — potwierdzenie finalnych liczb

Liczby zatwierdzone przez obrone/Evaluatora rundy 1 (`02-obrona-operatora.md`), NIE
przemierzane od zera: PRZED = **28,0 p.p.**, PO naprawie = **20,0 p.p.** (redukcja 28,6%),
podloga przy calkowitym wyzerowaniu klucza = **16,5 p.p.** (polowa pochodzi z nietknietego tu
urwiska `szczescie_bonus_osiedle_pop`, zarejestrowana jako znane ograniczenie architektoniczne
poza zakresem tego tematu — zgodnie z ratyfikacja). Dane w `society-params.json`
(easy[10,7,5,3], normal[8,6,4,2], hard[7,5,3,2]) bez zmian w tej rundzie — juz zatwierdzone,
zweryfikowane `git diff` = brak zmian tego pliku. Wlasna bramka tematu:
`node tools/szczescie-audyt-c-prawo-osiedla-test.cjs` -> **15/15 OK**.

## Punkt 2 — przepisanie dwoch bramek na wlasciwosc

### `szczescie-skala-normalizacja-test.cjs` (4 asercje, 2 pary)

Wspolna wlasciwosc: netto Prawa w scenariuszu pop=2/epoka1/normal/brak garnizonu i
administracji = WYLACZNIE bonus Osiedla = `pickOsiedlePopBonus(pop=2)` = idx=1 ->
`SOCIETY.prawo.prawo_bonus_osiedle_pop.normal[1]` (potwierdzone czytaniem
`computeLawBreakdown`, `society-breakdown.ts:884-894`). PrawPct = `100*netto/prawMax`
zaokraglone do 1 miejsca i przyciete capem (ta sama formula co `pctFromNetto`/`clampPct`
w kodzie, `society-breakdown.ts:498-506`) — replikowana w tescie, NIE zaimportowana z modulu
(unikanie tautologii), udokumentowana w komentarzu.

Mapowanie stara->nowa:
- L.225 `eq(pr.netto, 20, ...)` -> `eq(pr.netto, osiedlePop2Normal, ...)` gdzie
  `osiedlePop2Normal = SOCIETY.prawo.prawo_bonus_osiedle_pop.normal[1]` (dzis 6).
- L.229 `eq(pr.prawPct, 50, ...)` -> `eq(pr.prawPct, Math.min(PRAW_PCT_CAP,
  Math.round(100*osiedlePop2Normal/40*10)/10), ...)` (dzis 15).
- L.528 `eq(pr.netto, 20, ...)` -> analogicznie do L.225 (osobny blok "zrzut wlasciciela").
- L.530 `eq(prPrzed.prawPct, 50, ...)` -> analogicznie do L.229.

Wynik: **148 OK, 0 FAIL** (bylo 144 OK, 4 FAIL) — liczba asercji NIE spadla (wzrosla o 4 z
uwagi na jedna dodatkowa `eq` na netto w kazdej parze zamiast zlaczonego opisu — realnie te
same 4 sprawdzenia, zero oslabienia).

### `society-breakdown-test.cjs` (6 asercji: 3x PorPct-target, 3x etykieta pasma)

Te 6 asercji NIE sa bezposrednim literalem `prawo_bonus_osiedle_pop` — to docelowy PorPct
calego scenariusza startowego (pop=1, D-START-OSIEDLE), zlozony z Sz i Prawa razem przez
`evaluateOrderFromBreakdown`. Nie da sie ich sprawdzic "z danych" bez odtworzenia formuly
kombinujacej w samym tescie (ucieczka mutacyjna, C-046) — dlatego, zgodnie z dopuszczonym w
dispatchu wyjatkiem ("jesli bramka celowo sprawdza KONKRETNA, dzisiejsza wartosc jako czesc
kontraktu, swiadomie udokumentowane"), zostaja jako PRODUKTOWY kontrakt (czy nowe miasto
startuje w okreslonym pasmie komfortu), z PONOWNIE PRZELICZONYMI (nie z pamieci) liczbami,
dokladnie tym samym wzorcem, jaki ten sam blok stosowal juz dwukrotnie wczesniej
(94,8->107,1 dla G13, teraz 107,1->78,9 dla wezla C).

Mapowanie stara->nowa (zmierzone `node tools/society-breakdown-test.cjs`):
- easy:   107,1% "Lad"      -> **78,9%** "Spokoj"
- normal:  80,4% "Spokoj"   -> **55,4%** "Napiecie"
- hard:    61,9% "Napiecie" -> **43,6%** "Niepokoj"

Tolerancja +-4 p.p. bez zmian. Wynik: **53 OK, 0 FAIL** (bylo 47 OK, 6 FAIL) — zero
oslabienia liczby asercji.

## Weryfikacja pelna

`tsc --noEmit`: 0 bledow. 5 bramek referencyjnych: logic 213/213, tech-tree 19/19,
research 33/33, unit-replace 13/13, combat 6/6. Rodzina Prawo/Porzadek/Szczescie/Society
(grep `*prawo*`/`*szczescie*`/`*porzadek*`/`*order*`/`*society*`, 15 plikow): wszystkie
zielone poza dwoma PRE-ISTNIEJACYMI, niezwiazanymi z tym tematem (potwierdzone tresc bledu):
`border-march-wygasanie-test` 4 FAIL (main.ts `onEventDismiss`, zero zwiazku z
`prawo_bonus_osiedle_pop`), `szczescie-przebudowa-skali-test` 4 FAIL (liczba pozycji
katalogu budynkow — 42 vs oczekiwane 41, tez bez zwiazku). Identyczne liczby jak w raporcie
rundy 1 (`02-obrona-operatora.md`) — nie regresja tej rundy.

`git status --short`: wylacznie `gra/tools/society-breakdown-test.cjs` i
`gra/tools/szczescie-skala-normalizacja-test.cjs` zmienione — zero naruszen allowlisty,
`gra/data/society-params.json` bez zmian (potwierdzone punktem 1).

---

STATUS: PASS
DOMAIN: GAME
TEMAT: R-SZCZESCIE-AUDYT-C-PRAWO-I-OSIEDLA-Q1
GOAL: potwierdzic finalne liczby (20,0/16,5 p.p.) i przepisac dwie rozszerzone bramki na sprawdzanie wlasciwosci zamiast literalu starej wartosci `prawo_bonus_osiedle_pop`
ZMIANY/COMMIT: worktree `/home/user/wt-szczescie-c`, galaz `autobot/R-SZCZESCIE-AUDYT-C-PRAWO-I-OSIEDLA-Q1` — zmienione: `gra/tools/szczescie-skala-normalizacja-test.cjs` (4 asercje przepisane na odczyt z danych + replikowana formula clampPct), `gra/tools/society-breakdown-test.cjs` (6 asercji: cele PorPct/pasma ponownie przeliczone, udokumentowane jako swiadomy wybor kontraktu produktowego), ten raport.
TESTY: wlasna bramka tematu 15/15; szczescie-skala-normalizacja 148/148 (bylo 144/4 FAIL); society-breakdown 53/53 (bylo 47/6 FAIL); tsc 0 bledow; 5 bramek referencyjnych zielone (213/19/33/13/6); rodzina Prawo/Szczescie/Porzadek/Society (15 plikow) zielona poza 2 pre-istniejacymi, niezwiazanymi FAIL (border-march-wygasanie 4, szczescie-przebudowa-skali 4, identyczne jak rundy 1).
BLOKADY: brak nowych. Magnitude (Punkt A) rozstrzygnieta ratyfikacja wlasciciela w `decision-abc.md` — temat zamyka sie na 20,0 p.p. z zarejestrowana podloga 16,5 p.p. jako znane ograniczenie architektoniczne.
RUNDY: 2/5
NASTEPNY KROK: Evaluator rundy 2 -> Final Control (osobno) -> integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO

# R-WEB-DOCS-DIPLO-LEGACY-EVENTS-Q1 — obrona Operatora (runda 2, odpowiedź na Evaluatora 20-evaluator-claude.md)

STATUS: PASS-WITH-NOTES (zarzuty 1, 2, 3 PRZYJĘTE i poprawione; zarzut 4 ODRZUCONY z dowodem; zarzut 5 ODRZUCONY jako nieadekwatny po dopisku historycznym; zarzut 6 ODRZUCONY, bramki kodu NIE_DOTYCZY)
DOMAIN: PROCESS
TEMAT: R-WEB-DOCS-DIPLO-LEGACY-EVENTS-Q1
GOAL: dokumentacja poza encyklopedią nie wymienia usuniętych zdarzeń (wspolna_religia, ultimatum_spelnione) ani starych liczb (sąsiedztwo −2/−3/−4, religia ±0,5, „Wrogi" = relacja <30). ZERO zmian kodu.
BAZA: d4d261e3b (origin/main). KANDYDAT wejściowy: 88caacba1. Poprawka tej rundy: commit obrony (SHA w polu sha wyniku StructuredOutput).

## Odpowiedzi na zarzuty Evaluatora

**Zarzut 1 (docs/analiza/02-GAME-logika.md:53, religia±0.5, ekspansja-2) — PRZYJĘTY.**
Plik jest *.md poza gra/ i encyklopedią, w klauzuli „inne *.md" allowlisty. Poprawiono na: „religia 0 (bez wpływu na Zaufanie), ekspansja −3/−4/−5 wg epoki pary". Dowód kodu: gra/src/game/diplomacy.ts:158-166 (wspolnaReligia/odmiennaReligia = 0; ekspansjaGranica −3 / Brąz −4 / Żelazo −5).

**Zarzut 2 (progi tierów w docs/analiza) — PRZYJĘTY.**
Poprawiono cztery miejsca, nie tylko wskazane w zarzucie:
- docs/analiza/06-DYPLOMACJA-SPOLECZENSTWO.md:23 (było Wojna(<15)/Wrogi(15..30)/Neutralny(30..60)/Przyjazny(60..120)/Sojusz(>=120)) → Wrogi = Zaufanie<10; Neutralny = score<60; Przyjazny = score<130; Sojusz = score>=130 lub status.
- docs/analiza/06-DYPLOMACJA-SPOLECZENSTWO.md:73 (było „progi (<15/<30/<60/<120/>=120)") → analogicznie. Ten wiersz pominął Evaluator; znaleziono grepem przy weryfikacji.
- docs/analiza/06-DYSPOZYCJE-stan.md:31 (Wrogi<30/Przyjazny<120) → Wrogi=Zaufanie<10, Przyjazny=score<130, Sojusz=score≥130.
- docs/analiza/05-AI-CYWILIZACJE-DANE.md:56 (progi <15/<30/<60/<120/>=120) → Wrogi = Zaufanie<10, progi score <60/<130/>=130.
Dowód kodu: gra/src/game/diplomacy.ts:1534 (RELATION_TIER_PROG_WROGI_ZAUFANIE = 10), :1551-1560 (relationTier: Wrogi = Zaufanie<10; Neutralny score<60; Przyjazny score<130; Sojusz score>=130 lub status).
Uwaga: docs/analiza/* to pliki analityczne, a nie tylko bieżąca dokumentacja. Zdecydowano poprawić je wprost (nie dopisywać historycznego wpisu), bo klauzula allowlisty dispatchu obejmuje „inne *.md … które wymieniają … stare liczby", a GOAL wymaga zerowych starych liczb w plikach poza encyklopedią.

**Zarzut 3 („max −20" w Dyplomacja-szablon.md:237, bez pokrycia w kodzie) — PRZYJĘTY.**
Weryfikacja: w gra/src/game/diplomacy.ts nie ma limitu sumarycznego −20 dla „Bliskości granic". Jedyny clamp to składowa Zaufania do [0,100]: diplomacy.ts:1083 (`newZ = clamp(rel.zaufanie + dZ, 0, 100)`). Kara per tura to ekspansjaGranica_zaufanie_perTura (diplomacy.ts:162-166), bez osobnego capu. Zapis zmieniono z „max −20 — limit do weryfikacji w kodzie" na „brak osobnego limitu sumy w kodzie; składowa Zaufania clamp [0,100], diplomacy.ts:1083". Wynik grep `grep -n -- '-20\|−20' gra/src/game/diplomacy.ts` (uruchomiony w tej rundzie): trafienia to wyłącznie zlamanaPaktAI (:117-118), rywalizacjaTenSamTyp (:123-124), ultimatum_bezpodstawne (:1039-1040) i komentarze; brak capu granicznego (trafienia to zlamanaPaktAI/rywalizacja/ultimatum).

**Zarzut 4 (Dyplomacja-szablon.md:126, „Spełnienie ultimatum: −5 Relacja ogólna") — ODRZUCONY (z dowodem).**
- Nazwy `ultimatum_spelnione` nie ma w pliku ani w gra/ (grep = 0 trafień); GOAL i kryterium „grep po usuniętych nazwach = 0" są spełnione.
- Wiersz opisuje wymaganie projektowe z dispatchu-kontekstu: „−5 Relacja u adresata" jest na liście nierozstrzygniętych z W51 / #354 (ticket #354 w rejestrze orkiestratora). To decyzja produktowa właściciela, nie błąd dokumentacji wobec kodu. Operator nie zmienia jej bez decyzji (zasada ABC).
- Kod: diplomacy.ts:1039-1040 ma tylko `ultimatum_bezpodstawne` (−10 Zaufanie, −10 Respekt). Różnica zgłoszona w UWADZE-DLA-ORKIESTRATORA; rozstrzygnięcie poza tym tematem.

**Zarzut 5 (rejestry historyczne: docs/decyzje/B-KULT-REL-2026-07-22.md:207, docs/obieg/REJESTR-DECYZJI.md:196) — PRZYJĘTY w formie oznaczenia.**
Nie przepisywano historii decyzji. Dopisano jawne oznaczenie „ZASTĄPIONE 2026-11-13 (R-WEB-DOCS-DIPLO-LEGACY-EVENTS-Q1)" z dowodem diplomacy.ts:158 (wspolnaReligia_zaufanie_perTura = 0). Dispatch dopuszcza jawny wpis historyczny. Dodatkowo docs/decyzje/R-WIARYGODNOSC-TEMPO-PRZYWROCENIE-2026-08-03.md:37-38 (przykład liczbowy „ekspansja −2") oznaczono jako „przykład historyczny; aktualnie −3/−4/−5 wg epoki pary".

**Zarzut 6 (bramki kodu NIE_ZMIERZONO, brak gra/node_modules) — ODRZUCONY.**
Dispatch (sekcja Kryteria) wprost: „Bramki kodu NIE_DOTYCZY (brak zmian w gra/) — napisz to w raporcie; tsc nie jest wymagany." Ta runda także nie zmienia gra/ (dowód niżej). `npm install` w gra/ nie był potrzebny i nie był wykonywany (zakaz tematu: npm build/dev w gra/; instalacja zależności poza zakresem).

## Dowody tej rundy (surowe wyjście)

- `git diff --stat` (względem 88caacba1, przed commitem obrony): 8 plików, 10 insertions, 10 deletions.
- `git diff --check`: CHECK_OK (brak wyjścia).
- `git diff --name-only | grep -vE '\.md$'`: pusto (brak nie-markdown).
- Zmiany w gra/, gra-robocza/, rust-port/, WERSJE.md, docs/encyklopedia: 0 plików (`git diff --name-only d4d261e3b -- gra gra-robocza rust-port WERSJE.md docs/encyklopedia` = pusto).
- Ponowny grep po stałych liczbach (`religia.{0,40}0[.,]5|ekspansj.{0,60}[−-]2|Wrogi\(15|<30/Neutr|<15/<30|max −20` w docs/analiza, Dyplomacja, Civ-CYWILIZACJE, docs/decyzje, docs/obieg, bez _archiwum): pozostałe trafienia to wyłącznie (a) tytuł pliku C-AI-WOJNA-EKSPANSJA (słowo „ekspansja" bez liczby) i (b) dwa jawnie oznaczone przykłady historyczne w R-WIARYGODNOSC-TEMPO-PRZYWROCENIE-2026-08-03.md:37-38.

## Pliki zmienione w tej rundzie (allowlista)

- docs/analiza/02-GAME-logika.md
- docs/analiza/05-AI-CYWILIZACJE-DANE.md
- docs/analiza/06-DYPLOMACJA-SPOLECZENSTWO.md
- docs/analiza/06-DYSPOZYCJE-stan.md
- Dyplomacja/Dyplomacja-szablon.md
- docs/decyzje/B-KULT-REL-2026-07-22.md
- docs/decyzje/R-WIARYGODNOSC-TEMPO-PRZYWROCENIE-2026-08-03.md
- docs/obieg/REJESTR-DECYZJI.md
- dyspozycje/autobot/runs/R-WEB-DOCS-DIPLO-LEGACY-EVENTS-Q1/30-obrona-claude.md (ten raport)

## TESTY

- Bramki kodu: NIE_DOTYCZY (0 zmian w gra/; dispatch: tsc nie jest wymagany).
- git diff --check: CHECK_OK.
- Grep po usuniętych nazwach w plikach z allowlisty: wspolna_religia / ultimatum_spelnione = 0 trafień (poza wpisami Evaluatora w raporcie 20-evaluator, które nie są allowlistą).

## BLOKADY

Brak technicznych. Decyzja właściciela wymagana poza tematem: „−5 Relacja u adresata" (Dyplomacja-szablon.md:126, W51/#354) oraz zdarzenie wspolna_religia (+1) w kodzie (diplomacy.ts / diplomacy.json, #354) — to kod/dane, nie dokumentacja; poza zakresem.

## RUNDY

2/5 (runda obrony po zarzutach Evaluatora r1).

## UWAGI-DLA-ORKIESTRATORA

1. Pliki w gra/ z martwymi nazwami (zakaz tematu, nie dotykano): gra/tools/.dip-bundle2.cjs (plik generowany), gra/tools/diplo-json-descriptions-sync-test.cjs, gra/tools/diplomacy-test.cjs — osobny temat (#357 / skrypty .dip-*.cjs).
2. docs/archiwum i Civ-CYWILIZACJE/_archiwum (PROPOZYCJA-dyplomacja-AI-v0.1.md:128-130, CYWILIZACJE-DO-MASTERA.md:169) zostawiono — archiwum historyczne, poza bieżącym GOAL.
3. Wyjaśnienie zmęczenia wojną (prośba z wiadomości użytkownika) jest w 10-operator-claude.md, sekcja „Wyjaśnienie: jak działa zmęczenie wojną". W tej rundzie nie zmieniano jego treści.
4. Niespójność horyzontów zmęczenia (200 tur w war-weariness-params.json vs 20 tur w diplomacy-war-peace-params.json / diplomacy.ts:1361-1371) nadal wymaga decyzji właściciela (#361) — nie rozstrzygano w dokumentacji.
5. Evaluator poprawnie zauważył brakujące miejsce w 06-DYPLOMACJA-SPOLECZENSTWO.md:73 (znalezione przy kontroli). Pozostałe trafienia w docs/analiza/ sprawdzono grepem.

NASTĘPNY KROK: Evaluator (Sonnet) potwierdza zmiany tej rundy; następnie Final Control (Sonnet) rozstrzyga zarzuty 4 i 5 (odrzucone/oznaczone) i kieruje do integracji orkiestratora.
DEPLOY/PUSH: NIE WYKONANO

# 01-operator-runda1 — P-AI-ULEPSZENIA-BUDOWA-ZNIKOMA-Q1

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: P-AI-ULEPSZENIA-BUDOWA-ZNIKOMA-Q1
GOAL: Zdiagnozuj, dlaczego AI buduje znikomą ilość ulepszeń terenu mimo ogromnego
terytorium; napraw jeśli bug; jeśli balans — ABC bez zmiany liczb.

## WERDYKT — która hipoteza jest prawdziwą przyczyną

**Hipoteza (c) jest dominującą, udowodnioną przyczyną. (a) jest realnym, ale
wtórnym czynnikiem. (b) jest realna, ale w KIERUNKU ODWROTNYM niż pamięta
właściciel — i to jest osobne, ważne znalezisko.** Żadna z trzech nie jest
niedokumentowanym bugiem parytetu gracz↔AI: wszystkie trzy mechanizmy poniżej są
**wcześniej podjętymi, udokumentowanymi decyzjami właściciela**, stosowanymi
identycznie do gracza i AI. To jest więc kwestia strojenia/balansu (zadanie
pkt 4) — **zero zmian liczb w tej rundzie**, zgodnie z zakazem dispatchu.

## DOWÓD — symulacja żywa (150 tur, 4 miasta AI CYWILIZACJI, populacja 3→22)

Skrypt: `diag-znikoma.cjs` (ten katalog) — bundluje esbuildem i woła PRAWDZIWE
funkcje silnika: `generateMap`, `decideAITurn` (`game/ai.ts`),
`pickAutoImprovements`/`freshSurplusReport` (`game/auto-improvements.ts`),
`workedHexCoordsForCity` (`game/turn-economy.ts`), `cityTerritoryRadius`
(`map/territory.ts`), stałe z `game/cities.ts`. Zero reimplementacji logiki
decyzyjnej. 3 ziarna (7, 99, 4242).

```
node dyspozycje/autobot/runs/P-AI-ULEPSZENIA-BUDOWA-ZNIKOMA-Q1/diag-znikoma.cjs
DIAG_SEED=99   node .../diag-znikoma.cjs
DIAG_SEED=4242 node .../diag-znikoma.cjs
```

### (a) Pula Pracy AI — czy systemowo bliska zeru?

Ziarno 7: pula na koniec symulacji = 6849 Pracy, **0/150 tur z pulą <= 0** (w tym
uproszczonym modelu dochodu pula stale rośnie, bo dochód rośnie z populacją
szybciej niż wydatki na 1 ulepszenie/miasto/turę — realny mechanizm silnika ma
też upkeep/bank, którego ten harness nie modeluje w pełni, więc to NIE jest
dowód że pula "nigdy" nie bywa krytycznie niska w prawdziwej rozgrywce). Wcześniejszy
temat `R-AI-ULEPSZENIA-MALO-BUDOWANE-Q1` (bramka `gra/tools/ai-ulepszenia-malo-
budowane-test.cjs`, ta sama metoda, 5 ziaren, świeżo uruchomiona teraz — 13/13
PASS) pokazał udział puli spadający do 0% na do 34% tur w niektórych ziarnach
(PRZED istniejącą już podłogą 10% Zasady 3) — czyli pula bywa okresowo zerowa,
ale NIE permanentnie.

**WERDYKT (a): NIE jest to główna przyczyna.** Realny, ale wtórny/okresowy
czynnik — pula czasem wysycha po budowie, ale odbudowuje się z dochodu; nie
tłumaczy trwałej "znikomości" na przestrzeni dziesiątek tur.

### (b) Split Budynki/Pula — sufit, ale w ODWROTNYM kierunku niż w dispatchu

Kod (`game/cities.ts:418-419`): `MIN_PODZIAL_PRACY_BUDYNKI_PERCENT = 50`,
`MAX_PODZIAL_PRACY_BUDYNKI_PERCENT = 100`. Każdy zapis `procentBudynki` (AI:
main.ts:31318/32243/32263; gracz: main.ts:21745) przechodzi przez
`clampPodzialPracyBudynkiPercent`, który **wymusza zakres [50,100] na udziale
BUDYNKÓW** — czyli udział PULI (ulepszeń) jest ograniczony do **maksymalnie
50%, nigdy więcej**, a budynki mogą (i strukturalnie zwykle będą, bo to dolna
granica ich zakresu) zjadać nawet 100%.

Dispatch (za właścicielem) pamięta to jako "budżet budynków ma sufit ~50%" —
**to jest odwrotność faktycznego, udokumentowanego kontraktu.** Sam kontrakt
został jawnie i pisemnie zdecydowany przez właściciela w
`R-PRACA-MIASTO-LIMIT-50-Q1` (GOAL tamtego tematu, dosłownie): „ulepszenia
terenu maksymalnie 50%, reszta do budynków" — i zweryfikowany tam jako
stosowany **identycznie do gracza i AI** („ten sam resolver", „AI ma ten sam
końcowy clamp i zachowuje parytet z torem gracza"). Świeże uruchomienie bramki
`ai-praca-split-parity-test.cjs` w tym repo (21/22 PASS) potwierdza mechanizm w
działaniu; **1 FAIL** w tej bramce dotyczy martwej, nieużywanej funkcji
`procentPuliImperiumForOwner` w `main.ts:5221` (zdefiniowana, ale nigdy nie
wołana — realny split przeniósł się do `splitPraca`/`advanceCityEconomy` w
`game/turn-economy.ts`, wołanego identycznie dla każdego miasta niezależnie od
właściciela) — to jest **osierocony kod / dryf testu tekstowego po
refaktorze**, NIE realna rozbieżność zachowania gracz↔AI (potwierdzone
czytaniem `turn-economy.ts:2673-2726`, gdzie `splitPraca(yld.praca,
udzialBudynki)` jest jedynym miejscem faktycznie liczącym split, wspólnym dla
wszystkich miast). Zgłaszam to jako osobną, drobną usterkę higieny kodu — poza
zakresem tego tematu (nie ma związku przyczynowego ze "znikomą" budową ulepszeń;
sugerowana jako osobne zadanie porządkowe, patrz `spawn_task` w metadanych tej
sesji).

**WERDYKT (b): sufit istnieje, jest realny i redukuje budżet ulepszeń, ale
działa PARYTETOWO na gracza i AI, i jest udokumentowaną, świadomą decyzją
właściciela — nie bugiem.** Wymaga jednak jawnego potwierdzenia właściciela, bo
kierunek zaprzecza jego opisowi w tym zgłoszeniu (patrz ABC niżej).

### (c) Terytorium vs. heksy obrabiane (`onlyWorked`) — GŁÓWNA, UDOWODNIONA przyczyna

`workedHexCoordsForCity` przydziela obywatelom TYLKO tyle heksów, ile wynosi
populacja miasta (promień poszukiwań = `cityRangeForPopulation(pop)`, ale
liczba PRZYPISANYCH heksów = populacja). `cityTerritoryRadius` (posiadane
terytorium) używa TEGO SAMEGO wzoru promienia, ale promień ma DOLNY próg
`CITY_RANGE_MIN=5` niezależny od populacji — więc nawet małe miasto ma
terytorium liczące dziesiątki heksów, podczas gdy realnie obrabia tylko tyle,
ile ma obywateli.

Pomiar (koniec symulacji, populacja ustabilizowana na 22, 4 miasta, 3 ziarna):

| ziarno | terytorium (heksy lądowe) | obrabiane | % terytorium obrabiane |
|---|---|---|---|
| 7 | 614 | 88 | 14,3% |
| 99 | 625 | 88 | 14,1% |
| 4242 | 691 | 88 | 12,7% |

`planCityImprovements` (`game/ai.ts:2494`) woła `pickAutoImprovements` z
`getOnlyWorked: () => true` **hardcoded, bez żadnego mechanizmu wyłączenia** —
AI może budować automatyczne ulepszenia WYŁĄCZNIE na tych ~13% terytorium.
Kontrfaktyczny eksperyment (JEDNA zmienna: `getOnlyWorked: () => false`, cała
reszta identyczna — ten sam picker, ten sam budżet, ta sama pula, ten sam
`placedImprovements`) na 150 turach:

| ziarno | SCIEŻKA A (realna, onlyWorked=true) | SCIEŻKA B (onlyWorked=false) | delta |
|---|---|---|---|
| 7 | 30 ulepszeń | 199 ulepszeń | 6,6x |
| 99 | 51 ulepszeń | 235 ulepszeń | 4,6x |
| 4242 | 34 ulepszeń | 223 ulepszeń | 6,6x |

**WERDYKT (c): `onlyWorked=true` jest przyczynowo (nie tylko korelacyjnie)
odpowiedzialny za większość luki między ogromnym terytorium a garstką widocznych
ulepszeń** — dokładnie objaw ze zrzutu ekranu właściciela. To odtwarza w
symulacji dokładnie ten wzorzec: duże terytorium, 30-50 ulepszeń na 4 miasta
(rzadko rozsiane), reszta pusta.

**Parytet formalny jest zachowany**: `DEFAULT_ULEPSZENIA_ONLY_WORKED = true`
jest domyślną wartością TAKŻE dla gracza (`game/cities.ts:217`), a decyzja o
domyślnym włączeniu dla AI CYWILIZACJI jest jawnym ECHO właściciela w
`R-AI-WYRAB-PRZY-RZECE-FARMY-Q1` (04-operator-r4.md: „AI, zarówno w cywilizacji,
jak i w ludzkich domach, powinno domyślnie budować ulepszenia tam, gdzie są
obywatele"). **Ale gracz ma jednoklikowy przełącznik UI** (`buildModeHud.ts`,
„Tylko pola z obywatelami") wyłączający to per miasto/imperium w dowolnym
momencie gry — **AI nie ma i nigdy nie miało żadnego odpowiednika**; ta ścieżka
w `ai.ts` jest hardcoded na zawsze. To NIE łamie reguły parytetu w sensie
"ta sama formuła", bo domyślne zachowanie jest identyczne — ale oznacza, że
kompetentny gracz naturalnie ucieka od tego ograniczenia w miarę dojrzewania
miasta, a AI nigdy.

## BLOKADY

Brak blokad technicznych. Blokada decyzyjna: kierunek sufitu (b) i ewentualna
zmiana (c) wymagają jawnej decyzji właściciela (ABC niżej) — zakaz zmiany liczb
balansu bez niej.

## OPCJE ABC (do decyzji właściciela — zero zmian liczb wykonanych)

**A. Zostaw bez zmian.** Oba mechanizmy (b) i (c) są świadomymi, wcześniej
podjętymi decyzjami, stosowanymi parytetowo. „Znikoma" budowa jest zamierzonym
skutkiem ubocznym: ulepszenia mają być rzadkie i skoncentrowane wokół
pracujących obywateli, nie pokrywać całego terytorium. Ryzyko: to dokładnie
zachowanie, które właściciel zgłasza jako niepożądane na zrzucie ekranu.

**B. Dodaj AI odpowiednik przełącznika gracza dla (c)** — np. AI wyłącza
`onlyWorked` dla miasta, gdy odsetek obrobionego terytorium jest trwale niski
(np. populacja od dawna nie rośnie / miasto "dojrzałe"), dając AI dostęp do tej
samej elastyczności co gracz ma jednym kliknięciem. Nie zmienia żadnej stałej
balansu — dodaje AI ścieżkę decyzyjną, którą gracz i tak ma. Wymaga osobnego
tematu z jasnym kryterium "kiedy AI przełącza" (nowe ABC samo w sobie).

**C. Zrewiduj kierunek sufitu (b)** — jeśli właściciel PO ZOBACZENIU dowodu
faktycznie chce odwrócić kontrakt (budynki max 50%, ulepszenia min 50%, zamiast
obecnego ulepszenia max 50%/budynki min 50%) — to jest świadoma zmiana liczb
balansu w `game/cities.ts` (`MIN_PODZIAL_PRACY_BUDYNKI_PERCENT`) wymagająca
NOWEGO tematu z jawną decyzją, bo odwraca `R-PRACA-MIASTO-LIMIT-50-Q1`.

Rekomendacja Operatora (bez decyzji za właściciela): **B** adresuje bezpośrednio
zmierzoną, dominującą przyczynę (c, 4,6-6,6x) bez naruszania żadnej istniejącej,
udokumentowanej decyzji balansu; (b) i (a) zostają nietknięte do osobnej decyzji.

## ZMIANY/COMMIT

Brak zmian w `gra/`. Nowy plik diagnostyczny jednorazowy (recon, poza `gra/tools/`
zgodnie z allowlistą): `dyspozycje/autobot/runs/P-AI-ULEPSZENIA-BUDOWA-ZNIKOMA-Q1/diag-znikoma.cjs`.
Ten raport. Commit poniżej.

## TESTY

- `node ./node_modules/typescript/bin/tsc --noEmit` — **czysty** (exit 0).
- `node gra/tools/ai-ulepszenia-malo-budowane-test.cjs` — **13/13 PASS** (świeże
  uruchomienie, po `npm ci` w worktree — `node_modules` nie było obecne).
- `node gra/tools/ai-praca-split-parity-test.cjs` — **21 passed, 1 failed**
  (FAIL = martwy kod `procentPuliImperiumForOwner`, patrz sekcja (b) wyżej;
  zgłoszony jako osobne zadanie porządkowe, NIE naprawiony w tej rundzie — brak
  zmiany kodu = poza zakresem "5 bramek referencyjnych" tego dispatchu, który
  wymaga ich zielonych TYLKO "jeśli była zmiana kodu"; tu zmiany kodu nie było).
- `node dyspozycje/autobot/runs/P-AI-ULEPSZENIA-BUDOWA-ZNIKOMA-Q1/diag-znikoma.cjs`
  — 3 ziarna (7/99/4242), wyniki jak w tabelach wyżej.
- 5 bramek referencyjnych (Chromium itd.) — NIE URUCHOMIONE: brak zmiany kodu w
  `gra/`, więc kryterium "jeśli była zmiana" nie ma zastosowania.

## RUNDY: 1/5

## NASTĘPNY KROK

Właściciel: wybór ABC (A/B/C) lub inna decyzja. Do czasu decyzji: Evaluator
weryfikuje metodykę dowodu i werdykt (nie ma kodu do przeglądu, bo brak fixu).
Final Control nie dotyczy (czysty recon zakończony ABC, zgodnie z NASTĘPNY KROK
w dispatchu).

DEPLOY/PUSH: NIE WYKONANO

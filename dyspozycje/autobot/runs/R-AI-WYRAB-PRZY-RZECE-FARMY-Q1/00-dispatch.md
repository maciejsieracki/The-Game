
# 00 — DISPATCH

STATUS: DISPATCHOWANE
DOMAIN: GAME
TEMAT: `R-AI-WYRAB-PRZY-RZECE-FARMY-Q1`
GOAL: AI ma **samo wycinać lasy przy rzekach i stawiać tam farmy** — o ile pomiar wykaże,
że to faktycznie lepsze niż stan dzisiejszy. Plus zmierzenie i naprawa przeważania obozów
łowieckich nad pastwiskami.

## Wyzwalacz — ECHO właściciela

> „fajnie żeby AI wycinało samo lasy przy rzekach i stawiało tam farmy"

Poprzednio, w kontekście obozów łowieckich:

> „Cywilizacja, zamiast na przykład budować owcę, często buduje obóz łowiecki."

## ZASTRZEŻENIE DO PRZESŁANKI — Operator MA to rozstrzygnąć PRZED implementacją

Recon znalazł istniejącą decyzję właściciela, która może czynić to zlecenie bezcelowym
albo zmieniać jego kształt:

**`gra/data/terrain-improvements.json:22`** — farma: `„ziemia uprawna; DZIAŁA BEZ rzeki
(podstawowy); MOŻE na lesie (Las) — bez wyrębu (Maciej 2026-07-21)"`, potwierdzone w kodzie
`improvement-build.ts:174-178` (`isFarmBaseTerrain`): na Łące/Równinie farma działa ZAWSZE,
także pod lasem; na Wzgórzach farma WYMAGA nakładki Las.

**Czyli dziś farmę przy rzece można postawić bez wycinania lasu.** Wycinka byłaby wtedy
pracą wydaną na coś, co i tak jest dostępne — chyba że daje coś, czego pomiar nie widzi
z góry: `wyrab` daje Drewno, a las może wpływać na plon farmy albo na inne ulepszenia.

**KROK 1 Operatora jest więc pomiarowy, nie implementacyjny:** porównaj na tej samej mapie
i ziarnie plon oraz koszt trzech wariantów dla pola przy rzece z lasem:
(a) farma na lesie bez wyrębu — stan dzisiejszy;
(b) wyrąb → farma;
(c) wyrąb → farma, licząc Drewno z wyrębu jako zysk.
Podaj liczby (żywność/pieniądz/praca/handel per turę + koszt Pracy + jednorazowe Drewno).

**Jeśli (a) wychodzi nie gorzej niż (b) i (c)** — zlecenie właściciela opiera się na
nieaktualnej przesłance i temat kończy się statusem `DECISION_REQUIRED` z tymi liczbami,
BEZ zmiany kodu. Właściciel zdecyduje, czy mimo to chce wycinki (np. dla Drewna albo
dla wyglądu mapy). **Nie implementuj wycinki „bo tak kazano", jeśli liczby jej nie bronią.**

**Jeśli (b) albo (c) wygrywa** — implementuj preferencję AI zgodnie z KROKIEM 2.

## KROK 2 — implementacja (warunkowa)

AI **już zna** `wyrab`: `auto-improvements.ts:411`, `:432`, `:447`, kolejkowany na samym
końcu (`ai.ts:1808`: „`wyrab` na SAMYM końcu"), `ai.ts:1823` mapuje `drewno: ['tartak','wyrab']`.
Sąsiedztwo rzeki jest już policzalne: `improvement-build.ts:656` `isRiverAdjacent`,
`:583` `buildRiverHexSet`.

Zadanie: AI ma rozpoznać wzorzec „pole przy rzece + las + farma opłacalna po wyrębie"
i zaplanować **dwa kroki** (wyrąb, potem farma) zamiast traktować wyrąb jako zawsze-ostatni.
Zachowaj istniejący kontrakt: `ai.ts:118` mówi wprost, że AI NIE ma per-owner wieloturowego
stanu dla `wyrab` — jeśli Twoja zmiana tego wymaga, **zgłoś to jako BLOCK**, nie obchodź.

## KROK 3 — druga skarga: obozy vs pastwiska

Zmierzone w `R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1`: AI stawia **99 obozów / 56 pastwisk**
(3 ziarna × 40 tur, Operator) i **83/62** (inne ziarna, Evaluator) — **identycznie przed
i po zawężeniu obozów do lasu**. Zawężenie terenu nie zmieniło zachowania AI o jedno pole,
więc przyczyną są **wagi wyboru ulepszeń**, nie dostępność terenu.

Zmierz, dlaczego obóz wygrywa z pastwiskiem, i zaproponuj korektę wag. **Nie zmieniaj wag
„na oko"** — pokaż funkcję oceny, wartości dla obu ulepszeń na tym samym polu i dopiero
wtedy zmianę. Po zmianie podaj nowe liczby na tych samych ziarnach.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

- **ZAKAZ implementacji przed KROKIEM 1.** Ten temat ma udokumentowaną, sprzeczną decyzję
  właściciela z 2026-07-21. Zmiana wbrew niej bez liczb i bez ECHO = FAIL.
- **ZAKAZ strojenia wag bez pomiaru PRZED/PO** na tych samych ziarnach. Jedno ziarno to anegdota.
- **ZAKAZ dowodu regexem po własnym źródle.** Dowodem jest przebieg 40 tur i liczby.
- Każda nowa asercja MUSI czerwienieć po jednej celowanej mutacji — pokaż mutację i wynik.
- Sprawdź, czy zmiana nie psuje `ai-praca-split-parity-test` (parytet gracz/AI) ani
  `auto-improvements-test`.

## Kryteria sukcesu

1. Tabela liczbowa z KROKU 1 (trzy warianty, plon + koszt + Drewno).
2. Jeśli implementacja: AI stawia farmy przy rzece po wyrębie — pomiar PRZED/PO,
   min. 3 ziarna × 40 tur, liczba farm przy rzece.
3. Obozy vs pastwiska: liczby PRZED/PO na tych samych ziarnach co poprzedni temat
   (42, 1337, 2026 oraz 5150, 31337).
4. `tsc --noEmit` 0; 5 bramek referencyjnych zielonych; `auto-improvements-test` 45/0
   bez pogorszenia; `ai-praca-split-parity-test` bez pogorszenia.
5. Nowa bramka tematu z dowodem nietautologiczności.

## Izolacja

Gałąź `autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1` od `origin/main`, worktree per rola.

## Allowlista

`gra/src/game/ai.ts` · `gra/src/game/auto-improvements.ts` · `gra/tools/*` · raporty runu.
Ewentualnie `gra/data/ai-params.json` (wagi) — jeśli tak, **wyłącznie wartości dotyczące
wyboru ulepszeń**, z uzasadnieniem per liczba.

**NIE ruszać:** `gra/src/map/improvement-build.ts` i `gra/data/terrain-improvements.json`
(równoległy temat `R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1` runda 2 pracuje na
`improvement-build.ts` — kolizja = FAIL), `gra/src/main.ts`, `gra/src/ui/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/**`.

**RÓWNOLEGŁE TEMATY (§2b):** `R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1` runda 2
(`improvement-build.ts`) · `P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1` (tylko `gra/tools`) ·
`P-WYDARZENIA-ZBADANO-KLIK-KARTA-TECH-Q1` (`techDiscoveryNotice.ts`, `entityCards/*`,
`sidePanelHud.ts`, `main.ts` ~`:26185`).

## HIGIENA URUCHOMIEŃ

Każde wywołanie w `timeout`. NIE uruchamiać `map-gen-regression-test` — użyj wzorca
z `gra/tools/oboz-lowiecki-ai-40tur-measure.cjs`, który już mierzy AI przez 40 tur.
C-001: zakaz `npm run build`/`dev`. Zakaz `npx`, zakaz `git add -A`.
**Commituj cząstkowe postępy W TRAKCIE** — w tym repo trzy tematy zginęły przez brak commita.

## Pętla

Operator → Evaluator → Final Control → integracja orkiestratora. Limit 5 rund.
Model/effort: **Opus 5 High dla wszystkich trzech ról**. `opts.model` jawnie (C-062).

## Raport terminalny dispatchu

ZMIANY/COMMIT: jeszcze brak — dispatch.
TESTY: kryteria sukcesu 1–5 wyżej.
BLOKADY: brak.
RUNDY: 0/5 (dispatch).
NASTĘPNY KROK: Operator, runda 1 — KROK 1 pomiarowy PRZED implementacją.
DEPLOY/PUSH: NIE WYKONANO.

---

# ROZSZERZENIE — PEŁNA SPECYFIKACJA PRIORYTETÓW AI (właściciel, 2026-08-27)

To rozszerzenie **zastępuje** wcześniejszy KROK 2 i KROK 3 tego dispatchu. Właściciel podał
pełny model zachowania, nie pojedynczą poprawkę. KROK 1 (pomiar przesłanki) **nadal
obowiązuje** i wykonuje się PIERWSZY.

## ECHO właściciela — dosłownie

> „proponuję żeby AI stawiało pastwisko tylko w lesie i tylko wtedy gdy wcześniej zbudowało
> tam tartak. Jakie powinny być priorytety budowania przez AI? Najpierw stara się
> zagospodarować wolne miejsca pod farmy na terenie blisko rzek, czyli z rzeką na heksie.
> Tam jest największa produkcja żywności. Później stara się wyprodukować farmy w tym miejscu
> plus irygację lub farmy plus przodek. Każde miasto powinno mieć las wokół siebie, jeden
> tartak i obóz; ale tylko jeden na każde dziesięć obywateli wystarcza. Jeżeli zagospodaruje
> wszystkie rzeki, to dopiero wtedy zabiera się za inne tereny i wykarczowuje las, i stawia
> kolejne farmy. Priorytetem są heksy z rzekami, bo dają największą produkcję. Najpierw trzeba
> wykarczować las, a potem stawiać farmy. Należy działać kompleksowo: wybrać jeden heks
> z rzeką, wykarczować las (jeśli jest), postawić farmy, potem trzodę, a dopiero potem przejść
> do kolejnego heksu, zamiast robić 15 heksów naraz w sposób niekompleksowo"

## ECHO uzupełniające — pytanie zadane i odpowiedź

Pytanie orkiestratora: propozycja odwraca decyzję właściciela z **2026-07-29** („zakaz
hodowli zwierzęcej na nakładce Las", `isLivestockImprovementBlockedOnForest`,
`improvement-build.ts:180-183`) oraz dane: `owce` = „Wzgórza (bez lasu)", `bydlo` („Trzoda")
= „Łąka, Równina", `lama` = „Wzgórza, Góry".

> **Odpowiedź: „Tak, odwracamy — wszystkie trzy."**

Czyli `owce`, `bydlo`, `lama`: **tylko na nakładce Las i tylko gdy na tym heksie stoi już
tartak**. Decyzja z 2026-07-29 zostaje **wycofana** — Operator ma ją oznaczyć jako wycofaną
w miejscu, gdzie jest zapisana, **bez kasowania treści historycznej** (wzorem
`R-AI-RECRUIT-UPKEEP-GATE.md`).

## Odczytanie niejednoznaczności — Operator MA to potwierdzić, nie przyjąć na wiarę

„farmy plus **przodek**" — w danych nie ma klucza `przodek`. Kluczem `bydlo` nazywa się
**„Trzoda"**, a właściciel dalej pisze „postawić farmy, **potem trzodę**". Orkiestrator
czyta „przodek" jako **przejęzyczenie od „trzodę"** (`bydlo`). Operator MA to zweryfikować
wobec danych i **jeśli znajdzie sensowniejszego kandydata — zgłosić jako `DECISION_REQUIRED`,
nie zgadywać**.

## KONTRAKT DOCELOWY — model zachowania AI

**Zasada nadrzędna: KOMPLEKSOWO, NIE RÓWNOLEGLE.**
AI bierze **jeden heks** i doprowadza go do końca (wyrąb → farma → trzoda), **dopiero potem**
przechodzi do następnego. Zakaz rozgrzebywania 15 heksów naraz. To jest sedno zgłoszenia
i najważniejsze kryterium sukcesu.

**Kolejność priorytetów:**

1. **Heksy z rzeką NA heksie** — najwyższy priorytet, bo dają największą produkcję żywności.
   Dla każdego takiego heksu, po kolei, kompleksowo:
   a. wyrąb lasu, jeśli las jest,
   b. farma,
   c. trzoda (`bydlo`) — z zastrzeżeniem nowej reguły hodowli (patrz niżej: wymaga lasu
      i tartaku, więc na wykarczowanym heksie trzoda **nie będzie możliwa** — Operator MA
      wykryć tę sprzeczność i zgłosić ją jako `DECISION_REQUIRED`, jeśli faktycznie zachodzi),
   d. ewentualnie farma + irygacja jako wariant alternatywny.
2. **Dopiero po zagospodarowaniu WSZYSTKICH rzek** — pozostałe tereny: karczowanie lasu
   i kolejne farmy.
3. **Każde miasto: las wokół siebie + jeden tartak + jeden obóz łowiecki.**
   Limit: **jeden tartak i jeden obóz na każde 10 obywateli** miasta.

**Nowa reguła hodowli:** `owce`, `bydlo`, `lama` — wyłącznie na nakładce `Las`, wyłącznie
gdy na tym samym heksie stoi już `tartak`.

## SPRZECZNOŚĆ WEWNĘTRZNA DO ROZSTRZYGNIĘCIA — Operator MA ją zgłosić, nie zamaskować

Punkt 1 mówi: na heksie z rzeką **wykarczuj las**, potem farma, **potem trzoda**.
Nowa reguła hodowli mówi: trzoda **wymaga lasu i tartaku**.
Po wykarczowaniu lasu nie ma. **Te dwa wymagania nie mogą być spełnione jednocześnie
na tym samym heksie.**

Operator MA to zmierzyć i przedstawić właścicielowi jako `DECISION_REQUIRED` z konkretnymi
wariantami (np.: trzoda na heksie SĄSIEDNIM z lasem i tartakiem; albo trzoda zwolniona
z wymogu lasu; albo kolejność na heksie z rzeką kończy się na farmie). **Zakaz wybierania
za właściciela.** Zakaz cichego pominięcia kroku „potem trzodę".

## KRYTERIA SUKCESU (zastępują punkty 2–3 wcześniejszej listy)

1. **Kompleksowość — mierzalna.** Zdefiniuj metrykę „heksów rozgrzebanych" (zaczętych,
   niedokończonych) w danej turze. PRZED/PO, min. 3 ziarna × 40 tur. Liczba ma **wyraźnie
   spaść**. To jest główne kryterium tego tematu.
2. Farmy na heksach z rzeką: liczba PRZED/PO. Ma wzrosnąć.
3. Kolejność: dla próbki heksów z rzeką pokaż **ślad czasowy** (tura wyrębu, tura farmy,
   tura trzody) dowodzący, że AI kończy heks przed przejściem do następnego.
4. Limit „jeden tartak i jeden obóz na 10 obywateli" — pomiar: miasto o N obywatelach ma
   ≤ ceil(N/10) tartaków i ≤ ceil(N/10) obozów.
5. Nowa reguła hodowli: `owce`/`bydlo`/`lama` niebudowalne poza lasem i bez tartaku —
   pomiar dla gracza, automatu i AI osobno.
6. Obozy vs pastwiska: liczby PRZED/PO na ziarnach 42, 1337, 2026, 5150, 31337
   (baza: 99/56 i 83/62).
7. Decyzja z 2026-07-29 oznaczona jako wycofana, treść historyczna nietknięta.
8. `tsc --noEmit` 0; 5 bramek referencyjnych zielonych; `auto-improvements-test` i
   `ai-praca-split-parity-test` bez pogorszenia.

## ROZSZERZENIE ALLOWLISTY

Dodatkowo: `gra/src/map/improvement-build.ts` (**wyłącznie** `isLivestockImprovementBlockedOnForest`
i sąsiadujący kontrakt hodowli) · `gra/data/terrain-improvements.json` (**wyłącznie** pola
`teren`/`warunek` wpisów `owce`, `bydlo`, `lama`, z adnotacją uzasadniającą w stylu
istniejących wpisów w tym pliku).

**UWAGA — kolizja z równoległym tematem:** `R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1` runda 2
pracuje na `improvement-build.ts` (funkcja `stripImprovementsWhenForestRemoved`).
**Ten temat startuje DOPIERO po jego integracji** — orkiestrator pilnuje kolejności.
Jeśli mimo to zobaczysz konflikt: zgłoś `BLOCK`, nie rozwiązuj go samodzielnie.

## REGUŁA PRZECIW SAMOOSZUKIWANIU — uzupełnienie

- **ZAKAZ uznania kompleksowości za zrobioną bez metryki z punktu 1.** „Wygląda lepiej"
  nie jest wynikiem. Potrzebna liczba przed i po.
- **ZAKAZ cichego rozstrzygnięcia sprzeczności „wyrąb vs trzoda wymaga lasu".**
  To jest `DECISION_REQUIRED` dla właściciela.
- **ZAKAZ zmiany terenów hodowli bez oznaczenia decyzji z 2026-07-29 jako wycofanej.**
  Dokładnie ten błąd (cicha zmiana wbrew zapisanej decyzji) spowodował, że temat rekrutacji
  wracał przez trzy tygodnie.

---

# RUNDA 2 — ECHO właściciela po pomiarze rundy 1 (2026-08-27)

Runda 1 wykonała **wyłącznie KROK 1** i obaliła przesłankę zlecenia liczbami. Właściciel
zobaczył te liczby i podjął dwie decyzje.

## Q1 — wyrąb: **WYCINAĆ MIMO TO**

Właścicielowi przedstawiono pomiar: delta (wyrąb+farma) − (las+farma) na **każdym** terenie
to żywność **+1**, praca **−3**, handel **−2**, drewno **−15/turę**, koszt Pracy **+2,5**.

> **Decyzja: „Wycinać mimo to."** Właściciel świadomie akceptuje gorszy bilans z każdego
> takiego heksu.

To jest **wiążące** — Operator NIE wraca do tej dyskusji i NIE optymalizuje jej z powrotem
„bo liczby". Liczby zostały pokazane, decyzja zapadła. Odnotuj w raporcie, że bilans jest
świadomie ujemny, i tyle.

## Q2 — priorytet rundy 2: **KOMPLEKSOWOŚĆ + TARTAKI**

> **Decyzja: „Kompleksowość + tartaki."**

Runda 2 robi **dokładnie te dwie rzeczy**, nic więcej. Hodowla w lesie, limity „1 na 10
obywateli" i pełny model priorytetów czekają na rundę 3 — nie wciągaj ich tutaj (§14).

## KONSEKWENCJA, KTÓRĄ MUSISZ OBSŁUŻYĆ JAWNIE

Wybór „wycinać" **zamyka** ciąg `wyrąb → farma → trzoda` na tym samym heksie: po wyrębie
nie ma Lasu, a hodowla go wymaga. Zmierzone: wykonalne na **0 heksów**.

Dlatego na heksie z rzeką ciąg kończy się na **farmie**. Trzoda ma trafiać na **heksy leśne
z tartakiem** — a te zaczną istnieć dopiero wtedy, gdy AI zacznie budować tartaki, co jest
drugą połową tej rundy. **Nie pomijaj kroku „potem trzodę" po cichu** — zaimplementuj go
jako osobny heks i **udowodnij pomiarem, że trzoda faktycznie powstaje**.

## ZADANIE RUNDY 2 — dwie rzeczy

### A. Odwrócenie pętli: po HEKSACH, nie po TYPACH

`pickAutoImprovements` (`auto-improvements.ts:402`) iteruje po **typach ulepszeń**.
To jest **strukturalna przyczyna** skargi właściciela („15 heksów naraz niekompleksowo")
— ustalona przez wszystkie trzy role rundy 1. Odwróć ją: AI bierze **heks** i doprowadza
go do końca, dopiero potem następny.

Kolejność wyboru heksa: **najpierw heksy z rzeką NA heksie** (najwyższy plon żywności),
potem reszta.

Na wybranym heksie, po kolei: wyrąb (jeśli las) → farma → kolejne ulepszenia, jakie się
kwalifikują.

### B. AI ma budować tartaki

**AI nie zbudowało ANI JEDNEGO tartaku** na żadnym z 5 ziaren rundy 1, mimo że tartak
kwalifikuje się na **183 heksach**. Znajdź przyczynę i napraw. Bez tego cała reszta
specyfikacji właściciela jest martwa — kontrpomiar Evaluatora pokazał, że reguła hodowli
„Las + tartak" przy zerze tartaków dałaby pastwiska **103 → 0**.

Sprawdź przy okazji, dlaczego AI buduje **zero** dróg, posterunków, fortów, kopalni
i irygacji. Jeśli to ta sama przyczyna co tartaki — napraw razem i powiedz to wprost.
Jeśli inna — **zgłoś do rejestru**, nie naprawiaj tutaj (§14).

## METRYKA — obowiązkowo E1/E2 Evaluatora, NIE metryka Operatora z rundy 1

Metryka Operatora („heks tknięty, ale kwalifikuje kolejne ulepszenie") była
**zdegenerowana** — przypięta do 100% z konstrukcji, nie mogła zejść do zera ani rozróżnić
ziaren. Evaluator to wykrył i zastąpił:

- **E1** — liczba heksów „w toku" równolegle (max i średnia na przebieg)
- **E2** — rozpiętość: ile tur mija między pierwszym a ostatnim ulepszeniem na heksie,
  i ile **obcych** heksów AI tknęło w międzyczasie

Wartości PRZED (runda 1, ziarna 7/99/512/4242/1337): E1 max **35–50**, E1 średnia
**19,1–27,5**, E2 rozpiętość **16,0–19,6 tur**, obcych heksów w międzyczasie **37,6–49,2**.

**Te liczby mają wyraźnie spaść.** To jest główne kryterium tej rundy.

## Kryteria sukcesu rundy 2

1. **E1 i E2 wyraźnie w dół** wobec wartości PRZED wyżej, min. 5 ziaren × 40 tur.
   Podaj tabelę PRZED/PO dla obu metryk.
2. **Ślad czasowy**: dla próbki heksów pokaż, że AI kończy heks przed przejściem do
   następnego (dziś: farma w turze 0, obóz w turze 14, ~44 obce heksy w międzyczasie).
3. **Tartaki > 0** — podaj liczbę per ziarno. Zero = FAIL tej rundy.
4. **Wyrąb faktycznie się dzieje** przy rzece — dziś `wyrab` wywołany **0 razy**
   na 5 ziarnach. Podaj liczbę wyrębów i farm powstałych po wyrębie.
5. **Trzoda powstaje** na heksach leśnych z tartakiem — liczba per ziarno, nie zero.
6. **Priorytet rzek widoczny**: udział farm przy rzece w ogóle farm, PRZED/PO.
7. `tsc --noEmit` 0; 5 bramek referencyjnych zielonych; **bramki obozu łowieckiego
   91/0, 88/0, 5/0, 22/0 bez pogorszenia**; `auto-improvements-test` 45/0;
   `map-improvement-qualify-test` 112/0.
8. Nowa bramka tematu z dowodem nietautologiczności (mutacja + wynik).

## ZASTANY REGRES — nie Twój, nie naprawiaj

`ai-praca-split-parity-test` **21/1** jest czerwony **na czystym `origin/main`** —
zweryfikowane przez Evaluatora na `d0de8164`. Zmierz go na bazie i po zmianie,
podaj obie liczby, **nie pogorsz**. Naprawa to osobny temat.

## ALLOWLISTA RUNDY 2 — zawężona

`gra/src/game/auto-improvements.ts` · `gra/src/game/ai.ts` · `gra/tools/*` · raporty runu.

**NIE ruszać:** `gra/data/**` (reguły terenów to runda 3), `gra/src/map/improvement-build.ts`,
`gra/src/main.ts`, `gra/src/ui/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`.

**Uwaga na allowlistę rundy 1:** wskazywała `gra/data/ai-params.json` jako miejsce wag
wyboru ulepszeń. **Takich wag tam NIE MA** — wybór robi stała lista `AI_IMPROVEMENT_PRIORITY`
w kodzie. Nie szukaj ich w JSON-ie.

---

# KOREKTA ZAKRESU RUNDY 2 — rozróżnienie dwóch AI (właściciel, 2026-08-27)

**Ta sekcja koryguje sekcję „RUNDA 2" powyżej.** Właściciel wprowadził rozróżnienie, którego
poprzednie sekcje NIE robiły — a które zmienia treść zadania. Poprzednia sekcja mówiła
po prostu „AI"; to było niejednoznaczne i jest źródłem tej korekty.

## ECHO właściciela — reguła stała, obowiązuje we WSZYSTKICH przyszłych tematach

> „Bardzo ważne jest, żeby rozróżniać AI, czyli sztuczną inteligencję, która wspiera gracza,
> od AI innych cywilizacji, bo to są dwie różne kwestie i dwa różne postępowania. Jeśli
> będziesz pytał, pytaj konkretnie, czy to ma być AI gracza, czy AI innych cywilizacji."

**Obowiązuje od teraz w każdym raporcie i każdym pytaniu ABC.** Zdanie o „AI" bez kwalifikacji
„gracza" albo „cywilizacji" jest raportem do poprawy.

## Fakt techniczny, który to rozróżnienie czyni istotnym

Obie ścieżki wołają **ten sam silnik** `pickAutoImprovements`, ale z **różną konfiguracją**:

| | AI gracza (`main.ts:27086`) | AI cywilizacji (`ai.ts:1984`) |
|---|---|---|
| budżet Pracy | `playerUlepszeniaPolicy.pracaAutoPercent` (suwak gracza) | `100` |
| **ulepszeń na miasto/turę** | wg polityki gracza | **`maxItemsPerCity: 1`** |
| wyrąb | wg trybu | `skipWyrab: false` |
| archetyp | — | `civArchetype` |

**Wszystkie trzy harnessy rundy 1 wołały `pickAutoImprovements` bezpośrednio**, więc
nie wiadomo, którą konfigurację faktycznie zmierzyły. Operator rundy 2 MA to ustalić
i **podać osobno liczby dla obu ścieżek**.

## ECHO — druga wiadomość właściciela, doprecyzowanie modelu docelowego

> „zasady co do budowania mogą być podobne jak i dla AI gracza, ale AI musi równomiernie
> budować też inne ulepszenia poza ulepszeniami pod żywność. W wypadku gracza, gracz może
> wybrać na przykład opcję »żywność« lub »surowce«, a także »zrównoważoną«. Wtedy istnieją
> różne strategie dla każdego z tych ustawień. Jeśli gracz wybierze produkcję zrównoważoną,
> powinna ona być bardzo zbliżona do tej, którą stosuje AI. Dlatego warto ustalić najlepsze
> strategie: co najpierw, co później, jakie zasady obowiązują. Trzeba to kompleksowo
> przemyśleć, aby rozwój był możliwie najkorzystniejszy zarówno dla AI cywilizacji,
> jak i AI gracza."

### Kontrakt docelowy wynikający z obu wiadomości

1. **Kompleksowość (heks po heksie) dotyczy OBU** ścieżek — to jest wspólna mechanika.
2. **AI cywilizacji ≈ profil „Zrównoważona" gracza.** Mają być bardzo zbliżone.
3. **AI cywilizacji MUSI budować równomiernie**, nie tylko pod żywność. Dziś buduje
   **zero** tartaków, dróg, posterunków, fortów, kopalni i irygacji — to jest wprost
   sprzeczne z tym wymaganiem.
4. **Profile gracza `Żywność` / `Surowce` / `Zrównoważona` mają być RÓŻNYMI strategiami.**
   Dziś `ULEPSZENIA_FOCUS_LABELS` istnieją w UI — Operator MA zmierzyć, **czy i o ile**
   faktycznie różnią się wynikiem. Jeśli dają ten sam rezultat, to jest osobne znalezisko.
5. **Limit `maxItemsPerCity: 1` dla AI cywilizacji ZOSTAJE** — ECHO właściciela:
   > „Zostaw limit, zmień kolejność."
   Czyli AI cywilizacji ma robić jedno ulepszenie na miasto na turę, ale **na tym samym
   heksie aż do końca**, zamiast skakać po mapie. Kompleksowość bez zmiany tempa rozwoju.

## ZADANIE RUNDY 2 — trzy części, w tej kolejności

### A. POMIAR ROZDZIELONY (przed jakąkolwiek zmianą)

Powtórz kluczowe pomiary rundy 1 **osobno dla AI gracza i osobno dla AI cywilizacji**,
przez ich **prawdziwe ścieżki wejścia** (`main.ts:27086` i `ai.ts:1984`), nie przez
bezpośrednie wołanie pickera. Metryki E1/E2 Evaluatora. Podaj tabelę: metryka × ścieżka.
Dodatkowo: dla AI gracza zmierz **osobno każdy profil** (`Żywność`, `Surowce`, `Infra`,
`Zrównoważona`) — czy w ogóle się różnią.

### B. PROJEKT STRATEGII — produkt do akceptacji właściciela, nie do cichego wdrożenia

Właściciel prosi: „warto ustalić najlepsze strategie: co najpierw, co później, jakie zasady
obowiązują". To jest **zadanie projektowe**. Przedstaw dla każdego profilu (`Żywność`,
`Surowce`, `Infra`, `Zrównoważona` = AI cywilizacji) **uporządkowaną listę priorytetów**
z **uzasadnieniem liczbowym z `tileYield`**, nie z intuicji.

Uwzględnij ustalenia rundy 1: wyrąb pod farmę przy rzece daje żywność +1, ale praca −3,
handel −2, drewno −15/turę — właściciel **świadomie wybrał wycinać mimo to** dla ścieżki
rzecznej, ale to nie znaczy, że wyrąb ma być domyślny wszędzie.

**Ten projekt idzie do właściciela jako `DECISION_REQUIRED` PRZED implementacją C**,
chyba że Evaluator i Final Control uznają go za oczywisty. Nie zgaduj priorytetów.

### C. IMPLEMENTACJA — tylko mechanika, nie strategia

Niezależnie od B, zaimplementuj **to, co jest bezsporne**:
- **odwrócenie pętli** `pickAutoImprovements` (`auto-improvements.ts:402`) z „po typach"
  na „po heksach" — wspólne dla obu ścieżek, to jest strukturalna przyczyna skargi;
- **AI cywilizacji zaczyna budować tartaki** (dziś 0 na 183 kwalifikujących się heksach)
  oraz pozostałe pominięte kategorie — wymóg „równomiernie" z ECHO;
- priorytet heksów z rzeką przy wyborze następnego heksu.

## Kryteria sukcesu rundy 2 (zastępują poprzednie)

1. **Tabela E1/E2 PRZED/PO, ROZDZIELONA na AI gracza i AI cywilizacji.** Obie mają spaść.
   Wartości PRZED z rundy 1 (nierozdzielone): E1 max 35–50, E1 śr. 19,1–27,5,
   E2 rozpiętość 16,0–19,6 tur, obcych heksów 37,6–49,2.
2. **Ślad czasowy** dla obu ścieżek osobno.
3. **AI cywilizacji buduje tartaki** — liczba per ziarno, zero = FAIL.
4. **AI cywilizacji buduje równomiernie**: podaj rozkład kategorii (żywność / surowce /
   infra) PRZED i PO. Dziś infra = 0.
5. **Profile gracza faktycznie się różnią** — rozkład kategorii per profil.
6. **`Zrównoważona` gracza ≈ AI cywilizacji** — pokaż, jak blisko (metryka podobieństwa
   rozkładów).
7. `maxItemsPerCity: 1` dla AI cywilizacji **niezmieniony** — asercja.
8. `tsc` 0; 5 bramek referencyjnych; bramki obozu **91/0, 88/0, 5/0, 22/0**; bramka wydarzeń
   **77/0**; `auto-improvements-test` 45/0; `map-improvement-qualify-test` 112/0 — bez pogorszenia.
9. `ai-praca-split-parity-test` **21/1 zastane na `main`** — zmierz na bazie i po zmianie,
   podaj obie liczby, nie pogorsz.
10. Nowa bramka tematu z dowodem nietautologiczności.

## ALLOWLISTA RUNDY 2

`gra/src/game/auto-improvements.ts` · `gra/src/game/ai.ts` · `gra/src/main.ts`
(**wyłącznie** konfiguracja wywołania `pickAutoImprovements` ~`:27086-27094`, jeśli
rozdzielenie profili tego wymaga) · `gra/tools/*` · raporty runu.

**NIE ruszać:** `gra/data/**` (reguły terenów i hodowla = runda 3),
`gra/src/map/improvement-build.ts`, `gra/src/ui/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU — uzupełnienie

- **ZAKAZ zdania o „AI" bez kwalifikacji „gracza" albo „cywilizacji".** To jest wprost
  zlecenie właściciela i dotyczy każdego zdania raportu.
- **ZAKAZ mierzenia przez bezpośrednie wołanie `pickAutoImprovements`** — to był błąd
  rundy 1. Mierz przez prawdziwe ścieżki wejścia obu AI.
- **ZAKAZ cichego ustalenia strategii z części B.** To projekt do akceptacji właściciela.
- Każda nowa asercja MUSI czerwienieć po jednej celowanej mutacji.

---

# RUNDA 3 — ECHO właściciela po pomiarze rundy 2 (2026-08-27)

Runda 2 dostarczyła mechanikę i zmierzyła wszystko trzema niezależnymi narzędziami.
Final Control: `GOTOWOŚĆ DO INTEGRACJI: NIE` — **nie z powodu wady wykonania**, tylko
dlatego, że gałąź w obecnej postaci JEST wariantem W-A, a wybór wariantu należał do właściciela.

## Wynik rundy 2 — AI CYWILIZACJI, PRZED → PO

| metryka | PRZED | PO |
|---|---|---|
| E1 max / średnia | 31 / 17,2 | **3 / 2,3** |
| E2 rozpiętość / obcych heksów | 23,3 tur / 62,1 | **3,5 tur / 2,1** |
| tartak | **0** | **69** |
| kategorie żywność/surowce/infra | 600 / 0 / 0 | **230 / 139 / 231** |
| farmy przy rzece | 35,0 % | **83,8 %** |
| plon żywności/turę | 3522 | 2929 (**−16,8 %**) |

Evaluator odtworzył to **inną metodą** (stan mapy vs strumień rozkazów) i **co do sztuki**;
na własnych ziarnach efekt trzyma. Skarga „15 heksów naraz" jest naprawiona: AI cywilizacji
trzyma teraz **3 heksy w toku zamiast 31** i wraca do heksa po **3,5 tury zamiast 23,3**.

## ECHO — decyzja właściciela

Przedstawiono trzy warianty. Odpowiedź:

> **W-B: domykaj tylko to, co daje plon.**

Heks uznaje się za domknięty, gdy stoją na nim wszystkie ulepszenia **plonowe**.
`posterunek` i `fort` **wychodzą z sekwencji domykania** i mają być budowane osobno,
według potrzeb obronnych.

Uzasadnienie liczbowe: `posterunek` i `fort` mają deltę plonu **0/0/0/0** — zmierzone
niezależnie przez Operatora i Evaluatora — a zjadają **193/600** (Operator) i **166/600**
(Evaluator) wszystkich ulepszeń AI cywilizacji. To jest źródło spadku żywności o 16,8 %.

## ZADANIE RUNDY 3

### A. Wdrożyć W-B

Sekwencja domykania heksa obejmuje **wyłącznie ulepszenia o niezerowej delcie plonu**.
`posterunek` i `fort` budowane osobno, poza domykaniem. **Nie usuwaj ich z gry** — mają
dalej powstawać tam, gdzie mają sens obronny; zmienia się tylko to, że nie blokują
domknięcia heksa.

**Kryterium liczbowe:** plon żywności AI cywilizacji ma **odzyskać większość z −16,8 %**,
przy zachowaniu E1 ≤ 5 i E2 ≤ 6 tur. Podaj obie liczby PRZED (runda 2 = W-A) i PO (W-B).
Jeśli odzysk jest mniejszy niż połowa — powiedz to wprost, nie naciągaj.

### B. `wyrab` — GOAL tematu WCIĄŻ NIESPEŁNIONY

Final Control zgłosił to jawnie i ma rację: **ID tematu brzmi `WYRAB`, a `wyrab` = 0
na obu ścieżkach.** Co gorsza, po zmianie rundy 2 stał się **strukturalnie nieosiągalny**
dla AI cywilizacji: FAZA 2 (`wyrab`) rusza tylko wtedy, gdy FAZA 1 nic nie postawiła,
a przy `maxItemsPerCity: 1` FAZA 1 stawia coś w **600 na 600** rozkazów.

Decyzja właściciela z Q1 jest wiążąca: **„wycinać mimo to"** — świadomie akceptuje
gorszy bilans (żywność +1, praca −3, handel −2, drewno −15/turę) na heksach z rzeką.

Zaimplementuj to tak, żeby wyrąb faktycznie się działał na heksach rzeka+las.
**Kryterium: `wyrab` > 0 na każdym ziarnie, i farmy powstające PO wyrębie > 0.**
Zero = ten temat nadal nie spełnił własnego GOAL-a.

### C. Do rejestru, NIE naprawiać tutaj (§14)

- **`kopalnia_zlota`** ma najwyższą deltę plonu (+2 praca, +10 handel) i jest
  **nieobecna** w 21-pozycyjnym `AI_IMPROVEMENT_PRIORITY`. Potwierdzone przez wszystkie
  trzy role. Osobny temat.
- **`ULEPSZENIA_FOCUS_ZROWNOWAZONE` to TA SAMA STAŁA** co `AI_IMPROVEMENT_PRIORITY`
  (`auto-improvements.ts:61`). ECHO właściciela „Zrównoważona ≈ AI cywilizacji" jest więc
  spełnione **z konstrukcji, nie z wyniku** — podobieństwo rozkładów jest tego skutkiem,
  nie dowodem. Stan zastany. Do świadomej decyzji: czy tak ma zostać.
- Zastany regres `ai-praca-split-parity-test` **21/1 na `main`**. Osobny temat.

## USTALENIA RUNDY 2, KTÓRYCH NIE PODWAŻAMY

- **`Zrównoważona` PRZED była kopią profilu `Żywność`** (310/0/5, identyczne 315 ulepszeń
  i 143 farmy). Odległość TV od AI cywilizacji: PRZED `Żywność` **0,0000**, `Zrównoważona`
  0,0159 — czyli ECHO właściciela było spełnione **przypadkiem, przez degenerację**.
  PO: `Zrównoważona` **0,034**, pozostałe profile 0,595–0,758. Profile są teraz realnie rozłączne.
- **Defekt dróg**, odsłonięty odwróceniem pętli: bez strażnika duplikatu `droga`
  kwalifikowała się w kółko — **37 sztuk na jednym heksie w 40 tur** (Operator),
  31 (Evaluator, ziarno 1337). Strażnik jest w kodzie, ma zostać.
- **BRAK DOWODU** na prawdziwe wejście AI GRACZA (`main.ts` closure `boot()` niebundlowalna) —
  konfiguracja odtworzona 1:1, drift pinuje strażnik tekstowy. Zgłoszone uczciwie przez
  Operatora, potwierdzone przez Evaluatora. Zostaje jako dług dowodowy.
- `maxItemsPerCity: 1` dla AI cywilizacji **nietknięty** — asercja utrzymana.

## Kryteria sukcesu rundy 3

1. **W-B wdrożone**: plon żywności AI cywilizacji odzyskuje większość z −16,8 %,
   przy E1 ≤ 5 i E2 ≤ 6 tur. Tabela W-A → W-B, min. 5 ziaren × 40 tur.
2. `posterunek` i `fort` **nadal powstają**, tylko poza sekwencją domykania — liczba per ziarno.
3. **`wyrab` > 0** na każdym ziarnie; farmy po wyrębie > 0. Rozdzielone: AI gracza / AI cywilizacji.
4. Rozkład kategorii nadal **niezdegenerowany** (infra ≠ 0).
5. Bramka tematu ≥ 16 pass, 0 fail; nowe asercje na W-B i na `wyrab`, każda z mutacją.
6. `tsc` 0; 5 bramek referencyjnych; `auto-improvements` 45/0; `map-improvement-qualify` 112/0;
   bramki obozu **91/0, 88/0, 5/0, 22/0**; `ai-improvements` 52/0; `ai-jednostki-tylko-zakup` 44/0.
7. `ai-praca-split-parity-test` **21/1 zastane** — zmierz na bazie i po zmianie, nie pogorsz.

## ALLOWLISTA RUNDY 3

`gra/src/game/auto-improvements.ts` · `gra/tools/*` · raporty runu.

**NIE ruszać:** `gra/src/game/ai.ts`, `gra/src/main.ts`, `gra/data/**`,
`gra/src/map/improvement-build.ts`, `gra/src/ui/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

- **ZAKAZ zdania o „AI" bez kwalifikacji „gracza" albo „cywilizacji"** — reguła stała właściciela.
- **ZAKAZ raportowania odzysku żywności bez liczby.** „Poprawiło się" nie jest wynikiem.
- **ZAKAZ uznania `wyrab` za zrobiony bez liczby > 0 na każdym ziarnie.** Trzy role rundy 2
  zgodnie stwierdziły, że jest strukturalnie nieosiągalny — samo „powinno działać" nie wystarczy.
- Każda nowa asercja MUSI czerwienieć po jednej celowanej mutacji.
- **outDir unikalny per temat**: `/tmp/civ-dist-airzeki-r3-<rola>`.

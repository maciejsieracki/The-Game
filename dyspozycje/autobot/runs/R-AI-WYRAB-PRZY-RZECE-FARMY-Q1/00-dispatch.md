
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

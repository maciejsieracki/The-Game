# R-HOTSEAT-ETAP6F-PART2-RECON-Q1 — Operator, runda 1 (treść; runda formalna tematu = 2)

## 0. Stan poprzedzający (weryfikacja przed pisaniem)

- KROK 0 wykonany: `git fetch origin main` + `git rebase origin/main` w tym worktree.
  Po rebase HEAD = `6573df80` (`git log -1 --format=%H` w `gra/` potwierdza ten sam SHA
  na poziomie repo), plik `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6F-PART2-RECON-Q1/00-dispatch.md`
  istnieje i jest czytelny (odczytany w całości przed tą notatką). Runda 1 formalna tego
  tematu była `BLOCK` czysto proceduralny (race worktree/main) — bez treści merytorycznej,
  więc ta notatka jest pierwszą faktyczną treścią (stąd nazwa pliku `01-operator-runda1.md`
  mimo że to runda 2 licznika tematu, zgodnie z dyspozycją).
- Przeczytane w całości przed pisaniem: `docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md` (całość,
  sekcje E/F/G), `R-HOTSEAT-ETAP6F-RECON-START-Q1/01-operator-runda1.md` (recon część (i),
  zamknięty PASS-WITH-NOTES), `R-HOTSEAT-ETAP6F-START-MIGRACJA-Q1/01-operator-runda1.md`
  (implementacja część (i), zamknięta PASS).
- Wszystkie numery linii niżej pochodzą ze świeżego `grep`/`Read` na `gra/src/main.ts`
  (36 762 linii), `gra/src/ui/newGameFlow.ts`, `gra/src/game/cluster-start.ts` i
  `gra/src/map/cluster-spawn.ts` w tym worktree PO rebase na `6573df80` — nie kopiowane
  z recon (i), który operował na innym commicie main.ts sprzed tygodni (main.ts zmienia
  się codziennie, zgodnie z ostrzeżeniem w dispatchu; np. `_menuCivId = params.civId ...`
  jest dziś na **34142**, nie na numerze cytowanym w żadnym starszym dokumencie).
- Ważne odróżnienie zakresu od Etapu 8: `PLAN-HOT-SEAT-2-GRACZY.md` §G (ABC-1) stwierdza
  wprost, że **pełna dyplomacja gracz↔gracz to Etap 8**, poza zakresem całego planu 0-7.
  Ten recon (część (ii) pod-etapu 6f) dotyczy WYŁĄCZNIE infrastruktury STARTU — drugiego
  heksu i drugiej cywilizacji — nie mechaniki rozgrywki między dwoma ludźmi.

## 1. Jak DZIŚ działa wybór heksu startowego i cywilizacji (świeży stan, z cytatami)

### 1a. Wybór cywilizacji w kreatorze (menu) — jeden gracz, jedna zmienna modułu

`gra/src/ui/newGameFlow.ts:729`:
```
let selCiv: string | null = null;
```
Pojedyncza zmienna modułu UI kreatora (nie tablica, nie mapa). Ustawiana przez klik na
kafelek cywilizacji w ekranie wyboru (poza zakresem tego recon — nieużyty w allowlisty
inwentaryzacji, ale nazwa `selCiv` i jej jedyność potwierdzają, że kreator ma dokładnie
jeden "slot" na wybór gracza).

`gra/src/ui/newGameFlow.ts:1003` — `function selectedCiv(): CivOption | null` czyta
`selCiv` i zwraca opis wybranej cywilizacji (dla podglądu w UI).

Budowa parametrów nowej gry, `gra/src/ui/newGameFlow.ts:1520-1590` (`buildParams()`):
```
1553:    const startPreview = data
1554-1559: ...playerCivId: selCiv ?? DEFAULT_PLAYER_CIV_ID, ...
...
1561:    civId: selCiv ?? DEFAULT_PLAYER_CIV_ID,
1562:    civName: c ? c.name : '',
...
1590:    selectedAiCivIds: [...selAiCivIds],
```
`NewGameParams.civId`/`civName` (interfejs, `gra/src/ui/newGameFlow.ts:86-87`) są polami
**singularnymi** (`string`, nie `string[]`). Kontrast: `selectedAiCivIds` (linia 136,
budowane z `[...selAiCivIds]` na 1590) jest już tablicą — to jest cywilizacje WYKLUCZONE/
wybrane dla PULI AI, nie drugi slot człowieka; nie ma dziś żadnego analogicznego pola dla
drugiego CZŁOWIEKA.

### 1b. Przejęcie wyboru w main.ts — `_menuCivId`, `applyMenuParams`

`gra/src/main.ts:1630`:
```
1630:    let _menuCivId: string = 'rzymianie'; // E1 default: Rzymianie
```
Zmienna modułu, singularna, domyślnie `'rzymianie'`. Świeży `grep -n "_menuCivId" src/main.ts`
daje **34 trafienia** w tym worktree (fallbacki odczytu `player.civType || _menuCivId || ...`
w kilkunastu miejscach renderu/etykiet — poza zakresem tego recon, to konsumenty, nie
źródło danych; kluczowe miejsce PRZYPISANIA:

`gra/src/main.ts:34142` (wewnątrz `function applyMenuParams(params: NewGameParams): void`,
def. na **34090**):
```
34142:      _menuCivId = params.civId || 'rzymianie';
```
Jedno przypisanie z jednego pola `params.civId`. Kilka linii niżej (34166-34182) — jedyna
gałąź budująca `player.civType`/`player.civBonusy` z `_menuCivId`, bez pętli po fotelach:
```
34167:      {
34168:        const chosenCiv = (data.civs.cywilizacje as any[]).find(
34169:          (c: any) => (c.ikonaId ?? '') === _menuCivId,
34170:        );
34171:        if (chosenCiv) {
34172:          player.civType = _menuCivId;
34173:          player.civBonusy = Array.isArray(chosenCiv.bonusy) ? chosenCiv.bonusy : [];
...
34179:          player.civType = _menuCivId;
34180:          player.civBonusy = [];
34181:          console.warn(`[NewGame] Nacja '${_menuCivId}' nie znaleziona w civs.json — brak bonusów`);
34182:        }
...
34200:        fillAiOwnerCivMap(_menuCivId, _gameSeed);
```
`player` (pojedynczy obiekt globalny stanu gracza — poza zakresem, ale trzeba zauważyć: dziś
istnieje jeden `player`, nie kolekcja per-owner; drugi fotel ludzki ma swój stan przez
`playerStateByHuman`/`exploredByHuman` (Etap 1, `game/human-owners.ts`), ale `civType` samego
"pierwszego" `player` obiektu nie jest tam trzymane per-owner — to osobna oś od `playerState`).

### 1c. Wybór/generacja heksu startowego — algorytmiczny, nie klikany, jeden slot

Gracz **nie klika** heksu startowego w UI — heks jest wyliczany algorytmicznie przez
generator klastra na podstawie cywilizacji gracza + seeda mapy. Dowód:

`gra/src/game/cluster-start.ts:23-24` (interfejs `ClusterStartPlan`) — [KOREKTA RUNDA 2:
poprzednia wersja błędnie podawała `22-24` z `22:export interface...`; świeży
`grep -n "export interface ClusterStartPlan"` i `grep -n "playerStartHex: { q: number; r: number };"`
w tym worktree (HEAD 56562bce) potwierdzają 23/24]:
```
23:export interface ClusterStartPlan {
24:  playerStartHex: { q: number; r: number };
```
Pole singularne (nie `Map`, nie tablica) — jeden heks na cały plan.

`gra/src/main.ts:8435-8459` (`function applyClusterStartPlan`, sygnatura przyjmuje JEDEN
`playerCivId: string`):
```
8435:    function applyClusterStartPlan(
8436:      playerCivId: string,
8437:      seed: number,
8438:      rywaleNaKlaster: number,
8439:      opts?: { skipRenderRefresh?: boolean; preferredCivIds?: readonly string[] },
8440:    ): void {
8441:      const plan = buildClusterStartPlan({
8442:        map,
8443:        civs: data.civs,
8444:        seed,
8445:        playerCivId,
...
8459:      playerStartHex = { ...plan.playerStartHex };
```
Wołane z `applyMenuParams`-łańcucha z pojedynczym `_menuCivId` (np. `main.ts:34827`
`applyClusterStartPlan(_menuCivId, newSeed, _menuCityStates, {...})` — świeży grep
potwierdza to jedno z kilku call-site'ów, wszystkie z pojedynczym `_menuCivId`).

`playerStartHex` — zmienna modułu main.ts, deklaracja **2519**:
```
2519:    let playerStartHex: { q: number; r: number } | null = {
```
przypisywana ponownie na **8459** (wyżej). [KOREKTA RUNDA 2: poprzednia wersja błędnie
podawała 11 trafień — świeży `grep -n "playerStartHex" gra/src/main.ts` w tym worktree
(HEAD 56562bce) daje **15 trafień**, nie 11.] Pełna lista linii: 2519 (deklaracja), 8459
(przypisanie z planu), 9685 (przekazanie jako parametr do `isInStartReveal`), 9775 i 9777
(komentarz opisujący dług projektowy, nie kod), 9786-9787 i 9824-9825 (mgła/widoczność),
12548-12549 (kamera), 22605 (serializacja zapisu), 22630 (komentarz), 22635-22636
(zakładanie pierwszego miasta). Z 15 trafień 3 to linie komentarza (9775, 9777, 22630) —
pozostałe 12 to użycia w kodzie. Konsumenci runtime: `isInStartReveal` (**9685**),
mgła/widoczność (**9786-9787, 9824-9825**), kamera (**12548-12549**), serializacja zapisu
(**22605**), zakładanie pierwszego miasta (**22635-22636**). Kluczowy, JAWNY komentarz w kodzie potwierdzający że to jest znany,
nierozwiązany dług — nie moje odkrycie, cytat z main.ts:

```
9774:      /* R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1 runda 2 (Evaluator runda 1, Zarzut #2): fallback
9775:       * na `playerStartHex`/`startRevealRadius` ma sens WYŁĄCZNIE dla oryginalnego fotela
9776:       * (`HUMAN_OWNER_PRIMARY`) w trakcie JEGO WŁASNEGO onboardingu, przed założeniem
9777:       * pierwszego miasta — `playerStartHex`/`startRevealRadius` NIE są per-owner (znany
9778:       * dług, nierozwiązany w tej rundzie — pełna migracja na Map<ownerId,...> to osobny
9779:       * temat).
```
i strażnik faktycznie użyty na **9786**:
```
9786:      if (ME() === HUMAN_OWNER_PRIMARY && playerStartHex !== null) {
```
— zakodowane założenie "tylko fotel podstawowy ma sens fallbacku heksu startowego".

### 1d. Dowód niezależny: hak testowy `seedSecondSeat` nazywa problem wprost

`gra/src/main.ts:22640-22651` (komentarz + definicja `__hotSeatTestDebug.seedSecondSeat`):
```
22643:    // Playwright). Projekt: recon §4.2. `seedSecondSeat` wstrzykuje drugi fotel + syntetyczny,
22644:    // RÓŻNY stan gry — jedyna droga do stanu 2-fotelowego W TEŚCIE, dopóki Etap 7 (drugi fotel
22645:    // w kreatorze) nie istnieje.
```
oraz sama funkcja `seedSecondSeat` (**22652-22677**) wstrzykuje drugi fotel *ręcznie z
testu* (`humanSeats.humanOwnerIds` + `exploredByHuman`/`playerStateByHuman`/
`pracaPoolByHuman`, opcjonalnie przejmuje istniejące miasto-państwo `reassignCityId`) —
**nie tworzy drugiego `playerStartHex`, nie wywołuje żadnego generatora heksu**, tylko
przypisuje istniejące miasto z mapy nowemu ownerowi, żeby ominąć brak realnej ścieżki.
To potwierdza niezależnie (drugie źródło, nie tylko literatura planu): **realny wybór
drugiego heksu i drugiej cywilizacji w menu jest dziś zerowy — istnieje tylko testowy
obejściowy hak**.

### 1e. Struktury `humanSeats`/`humanOwnerIds` — GOTOWE piętro niżej (Etap 1, poza zakresem zmian)

`gra/src/game/human-owners.ts:21,29`:
```
21:export const HUMAN_OWNER_PRIMARY = 0;
...
29:  readonly humanOwnerIds: readonly number[];
```
Ten mechanizm JUŻ istnieje i już obsługuje N foteli generycznie (`isAiOwner`,
`nextHumanOwnerId`, itd. — zamknięte w `R-HOTSEAT-ETAP6F-START-MIGRACJA-Q1`). To NIE jest
brakującym elementem — brakuje wyłącznie WARSTWY WYŻEJ: skąd `humanSeats.humanOwnerIds`
miałoby wziąć DRUGI heks i DRUGĄ cywilizację, zanim gra w ogóle wystartuje.

## 2. Czego DOKŁADNIE brakuje (lista elementów, nie projekt)

**Dane (struktury):**
1. `NewGameParams.civId`/`civName` (`newGameFlow.ts:86-87`) — pola singularne. Brak
   drugiego pola/tablicy analogicznej do `selectedAiCivIds` (linia 136) dla wyboru
   człowieka #2.
2. `selCiv` (`newGameFlow.ts:729`) — zmienna modułu UI, singularna. Brak drugiego slotu
   stanu UI kreatora (`selCiv2` lub `selCivByHuman: Map<...>`, konwencja do decyzji ABC).
3. `_menuCivId` (`main.ts:1630`) — zmienna modułu main.ts, singularna. Brak odpowiednika
   per-fotel (np. `Map<ownerId, string>`, wzorem istniejących `playerStateByHuman`/
   `exploredByHuman` z Etapu 1 — te już są `Map<number, X>` per-human, więc wzorzec w
   kodzie już istnieje, nie trzeba go wymyślać od zera, tylko powielić).
4. `player.civType`/`player.civBonusy` (main.ts ~34172-34181) — pojedynczy globalny obiekt
   `player`, civType nie jest dziś przechowywany per-owner na tym poziomie (osobna oś od
   `playerStateByHuman`, który JEST per-owner ale nie trzyma `civType`/`civBonusy`).
5. `ClusterStartPlan.playerStartHex` (`cluster-start.ts:23-24`) — pole singularne. Brak
   drugiego heksu w planie (np. `playerStartHexes: Map<ownerId, {q,r}>` lub druga nazwana
   para pól).
6. `applyClusterStartPlan(playerCivId: string, ...)` (`main.ts:8435-8440`) i głębiej
   `buildClusterSpawnPlan`/`buildClusterStartPlan` (`map/cluster-spawn.ts`, poza allowlistą
   plików wskazanych w dispatchu, ale konsument bezpośredni) — sygnatura przyjmuje jeden
   `playerCivId`. Generator mapy/klastra nie ma dziś pojęcia "drugi gracz, zarezerwuj mu
   też heks" — musiałby przyjąć listę cywilizacji-graczy zamiast jednej.
7. `playerStartHex` (main.ts:2519) — zmienna modułu, singularna, z jawnym komentarzem w
   kodzie (9774-9779) że NIE jest per-owner. Minimum 6 konsumentów wskazanych w §1c musi
   przejść na wersję per-owner.

**UI (kroki w kreatorze):**
8. Kreator (`newGameFlow.ts`) ma dziś DOKŁADNIE jeden ekran/krok wyboru cywilizacji
   (jedna zmienna `selCiv`, jeden kafelek aktywny na raz). Brak: drugiego ekranu/kroku,
   ALBO rozszerzenia istniejącego ekranu o drugi wybór widoczny jednocześnie (dwa
   kafelkowe pola zamiast jednego) — wybór KONKRETNEGO wariantu UI to §3 niżej.
9. Brak jakiegokolwiek ekranu/kroku "wybór drugiego heksu startowego" — bo dziś heks NIE
   jest w ogóle klikany przez gracza (jest algorytmiczny, §1c) — więc "wybór heksu" dla
   człowieka #2 to pytanie projektowe wyższego rzędu: czy w ogóle miałby być klikany
   ręcznie (nowa funkcjonalność, której NIE ma nawet dla gracza #1 dziś), czy generowany
   algorytmicznie tak jak dziś, tylko z podwójnym rezerwowaniem miejsca w klastrze
   (rozszerzenie generatora, nie nowy typ UI). To bezpośrednio wpływa na pytania ABC w §4.

**Walidacje (brak dziś, bo nie ma czego walidować przy jednym graczu):**
10. Czy drugi heks startowy musi spełniać te same reguły odległości/terenu co pierwszy
    (dziś generator klastra ma REGUŁY dla relacji gracz↔AI/rywale-tego-samego-typu —
    `rywaleNaKlaster`, `buildSameTypeRivalCandidateHexes` w `cluster-spawn.ts` — ale ZERO
    reguł "gracz↔gracz", bo taka relacja dziś nie istnieje w generatorze).
11. Czy druga cywilizacja gracza może pokrywać się z pierwszą (dziś `_menuSelectedAiCivIds`
    wyklucza cywilizacje AI, ale nie ma pojęcia "wyklucz też cywilizację drugiego
    człowieka" — trzeba by dodać symetryczne wykluczenie, analogicznie do part (i) już
    zamkniętej dla puli AI).
12. Minimalny dystans/pozycjonowanie względem siebie dwóch heksów-ludzi (dziś jedyny
    dystans wymuszany to gracz↔AI/rywale-tego-samego-typu w generatorze klastra) — czy
    dwóch ludzi ma być "blisko" (rywalizacja/kontakt szybki) czy "daleko" (osobne fazy
    rozwoju) jest czystą decyzją projektową, generator dziś nie ma żadnej wbudowanej
    intencji w tej sprawie, bo relacja nie istnieje.

## 3. Warianty projektowe (2-3, żaden nie jest rekomendacją)

### Wariant A — „sekwencyjny": fotel 1 kompletny (cywilizacja + start), potem fotel 2

Kreator przechodzi standardową ścieżkę dla fotela 1 (bez zmian widocznych dla gracza),
a na końcu (albo jako dodatkowy krok "Fotel 2" po dotychczasowym ekranie ustawień)
powtarza WYŁĄCZNIE wybór cywilizacji dla fotela 2 (analogiczny ekran/komponent, drugi
`selCiv2`), heks startowy pozostaje algorytmiczny (generator rezerwuje drugie miejsce
w klastrze na podstawie już znanej cywilizacji fotela 2).

- **Za:** najmniejsza zmiana UI — jeden dodatkowy, znany-wzorcowo ekran (kopia istniejącego
  wyboru cywilizacji), reużywa `selectedCiv()`/kafelki 1:1. Kod main.ts zmienia się głównie
  w warstwie danych (§2 punkty 1-7), nie w interakcji.
- **Przeciw:** narusza symetrię — fotel 1 "wygląda" jak dzisiejsza gra jednoosobowa, fotel
  2 jest wyraźnie "dołożony na końcu", co może sugerować (mylnie lub nie) że fotel 2 jest
  "gorszy"/wtórny. Też: jeśli w przyszłości (poza zakresem, ale warto odnotować dla
  właściciela) dojdzie ręczne klikanie heksu, sekwencyjność wymusza kolejność
  heks1→cyw1→heks2→cyw2 albo cyw1→cyw2→heks1→heks2 — sama nazwa "sekwencyjny" nie
  rozstrzyga w jakiej kolejności są PARY (heks, cyw) dla KAŻDEGO fotela — to osobne
  pytanie ABC (§4).

### Wariant B — „naprzemienny": heks1→heks2→cywilizacja1→cywilizacja2 (albo cyw1→cyw2→...)

Kreator prowadzi obu graczy naprzemiennie przez TE SAME typy kroków, zanim przejdzie do
następnego typu kroku — np. najpierw oboje wybierają (jeśli w ogóle ręcznie, patrz §2.9)
heks, potem oboje wybierają cywilizację. Wymaga jawnego wskazania "czyja teraz kolej"
(ekran przekazania, podobny koncepcyjnie do `showHotSeatHandoff`/`hideHotSeatHandoff`
już istniejących w main.ts dla ETAPU 5, ale użytych tam do przekazania TURY, nie
KREATORA — reużycie komponentu, nie logiki).

- **Za:** symetria jawna dla obu graczy — żaden fotel nie jest "na końcu", oba przechodzą
  identyczny rytm kroków, co czytelniej komunikuje "gra jest dla dwóch równych graczy" od
  pierwszego ekranu.
- **Przeciw:** więcej nowych ekranów przekazania (minimum jeden dodatkowy handoff w
  kreatorze, którego dziś NIE ma — `showHotSeatHandoff` istnieje tylko dla fazy
  rozgrywki, nie kreatora) — więcej nowego kodu UI niż wariant A. Ryzyko pomyłki gracza
  "czyja to kolej wyboru" jest wyższe przy większej liczbie przełączeń niż przy jednym
  bloku na fotel.

### Wariant C — „jeden ekran, dwa pola jednocześnie" (bez handoffu w kreatorze)

Rozszerzenie DZISIEJSZEGO jednego ekranu wyboru cywilizacji o drugie, widoczne obok
pierwszego pole wyboru ("Cywilizacja gracza 1" / "Cywilizacja gracza 2"), wypełniane
przez tę samą osobę siedzącą przy klawiaturze (bez ukrywania ekranu między wyborami —
oboje ludzie fizycznie widzą oba pola na monitorze podczas konfiguracji, PRZED
rozpoczęciem właściwej rozgrywki hot-seat).

- **Za:** zero nowych ekranów przekazania w kreatorze — najmniej nowego kodu UI ze
  wszystkich trzech wariantów, bo nie trzeba w ogóle rozwiązywać "czyja kolej" podczas
  SAMEGO tworzenia gry (w przeciwieństwie do rozgrywki, gdzie ukrywanie info między
  graczami ma sens, w kreatorze przed startem nie ma jeszcze żadnej tajnej informacji do
  ukrycia — obaj i tak zobaczą mapę/przeciwników po starcie).
- **Przeciw:** gorzej się skaluje, gdyby w przyszłości (Etap 8 lub dalej, POZA zakresem
  tego tematu) miała powstać opcja z więcej niż dwoma fotelami ludzkimi — dwa pola
  na sztywno w jednym layoucie nie uogólniają się tak łatwo jak pętla po `humanOwnerIds`
  z wariantu B. Też: jeśli docelowo ma powstać RĘCZNE klikanie heksu startowego (nowa
  funkcjonalność, dziś nieistniejąca nawet dla gracza 1, §2.9), "dwa pola jednocześnie"
  nie przenosi się bezpośrednio na wybór miejsca na mapie (nie da się pokazać dwóch
  niezależnych kursorów na jednej mapie bez dodatkowego UI stanu "czyj to wybór teraz").

## 4. Pytania ABC do właściciela (jawne, BEZ sugerowanego rozstrzygnięcia)

- **ABC-Q1 (heks: klikany czy algorytmiczny?)** Czy drugi heks startowy ma być wybierany
  RĘCZNIE przez gracza (nowa funkcjonalność UI, której DZIŚ nie ma nawet dla gracza 1 —
  patrz §1c, heks jest dziś zawsze algorytmiczny), czy nadal generowany algorytmicznie
  przez `buildClusterSpawnPlan`/`buildClusterStartPlan` (rozszerzenie istniejącego
  generatora o rezerwację drugiego miejsca, spójne z dzisiejszym zachowaniem dla gracza
  1)? Odpowiedź determinuje, czy w ogóle powstaje nowy typ ekranu "wybór heksu na mapie",
  czy tylko zmiana danych wejściowych generatora.
- **ABC-Q2 (kolejność/rytm kroków w kreatorze).** Który z wariantów §3 (A/B/C) — albo inny,
  niewymieniony — ma zostać wybrany dla kolejności/układu kroków wyboru cywilizacji (i
  ewentualnie heksu, zależnie od ABC-Q1) dla dwóch foteli w kreatorze?
- **ABC-Q3 (czy druga cywilizacja może powielać pierwszą?)** Czy fotel 2 może wybrać TĘ
  SAMĄ cywilizację co fotel 1 (dziś generator/`_menuSelectedAiCivIds` nie ma pojęcia
  "wyklucz cywilizację drugiego człowieka" — trzeba by je dodać, jeśli odpowiedź brzmi
  "nie")?
- **ABC-Q4 (reguły odległości/terenu dla pary heksów gracz↔gracz).** Czy dwa heksy
  startowe ludzi mają podlegać JAKIEJŚ regule odległości/pozycjonowania względem siebie
  (blisko = szybki kontakt/rywalizacja, daleko = osobny rozwój na start), czy traktować
  fotel 2 tak jak dziś traktowany jest dowolny inny rywal-tego-samego-typu w generatorze
  (`rywaleNaKlaster`/`buildSameTypeRivalCandidateHexes`) — bez specjalnej reguły
  gracz↔gracz?
- **ABC-Q5 (co z dev/quick-start ścieżkami z literalnym `civId:'rzymianie'`?)** Ten sam
  ABC odziedziczony z recon (i) (`R-HOTSEAT-ETAP6F-RECON-START-Q1` §3, blokada), teraz
  z drugą warstwą: dev/testowe/quick-start ścieżki tworzące `NewGameParams` z jedną
  cywilizacją na sztywno — czy przy hot-seat mają dostać DRUGĄ sztywną wartość (np.
  `'grecy'`), zostać single-seat-only, czy w ogóle pominąć hot-seat (uruchamiać zawsze
  jako single-player niezależnie od flagi)? Nie rozstrzygam, tylko nazywam — dotyczy też
  kroków (i) i (ii) razem.
- **ABC-Q6 (zakres commitu implementacji).** Czy implementacja część (ii) ma objąć
  WSZYSTKIE warstwy naraz (dane main.ts + `cluster-start.ts` + generator mapy głębiej w
  `map/cluster-spawn.ts`, poza allowlistą plików tego recon + UI kreatora), czy ma być
  rozbita na dalsze pod-tematy (np. najpierw dane/generator bez UI, potem UI) — zgodnie z
  regułą projektu "jeden temat = merge w 24h" z `PLAN-HOT-SEAT-2-GRACZY.md` §E, biorąc pod
  uwagę że to jest wyraźnie większy zakres niż część (i) (7 struktur danych + generator
  mapy + nowy UI, kontra 3 funkcje bez zmiany UI w części (i)).

## 5. Wynik

STATUS: PASS
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP6F-PART2-RECON-Q1
GOAL: Recon (bez implementacji) części (ii) pod-etapu 6f — drugi heks startowy i wybór
drugiej cywilizacji w menu startowym; gotowe do decyzji właściciela opcje projektowe.
ZMIANY/COMMIT: Ten dokument (docs-only), `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6F-PART2-RECON-Q1/01-operator-runda1.md`.
Zero zmian w `gra/`.
TESTY: brak (dokument, recon — zgodnie z GOAL i allowlistą dispatchu).
BLOKADY: brak blokad technicznych zamknięcia recon; 6 pytań ABC (§4) wymagane PRZED
implementacją część (ii) — jawnie nazwane, bez sugerowanego rozstrzygnięcia.
RUNDY: 2/5
NASTĘPNY KROK: Operator → Evaluator (weryfikacja świeżości linii, kompletności §1-§4,
braku ukrytej rekomendacji w §3). Final Control NIE dotyczy (docs-only, informational).
DEPLOY/PUSH: NIE WYKONANO

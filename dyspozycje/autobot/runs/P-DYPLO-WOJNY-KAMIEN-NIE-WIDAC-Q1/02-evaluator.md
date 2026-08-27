# 02 — EVALUATOR (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: `P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1`
GOAL: Zweryfikowac NIEZALEZNIE odpowiedz Operatora („w epoce Kamienia nie wybucha
zadna wojna i oto dlaczego") — wlasnym pomiarem, **inna metoda**, na **innych ziarnach
plus jednym jego ziarnie**. Audyt, nie naprawa.
MODEL+EFFORT: **Opus 5, effort high** (Evaluator).
RUNDY: 1/5 · DEPLOY/PUSH: **NIE WYKONANO**

---

## 0. Werdykt w jednym akapicie

**Raport Operatora jest prawdziwy.** Odtworzylem pomiar niezaleznie — inna metoda
(diff calej macierzy `diplomacyRelations` co ture zamiast instrumentacji wnetrza
`ai.ts`), na innych ziarnach (**777, 888**) plus jego wlasnym (**111**) — i dostalem
**dokladnie ten sam wynik: 165 tur rozgrywki w zywym Chromium, ZERO wypowiedzen wojny**,
ani AI↔AI, ani AI→gracz. Na jego ziarnie 111 zgadza sie takze mechanizm: bramka
`!isOwnerClusterCityState` wyklucza wszystkie 6 glownych cywilizacji AI w turze **7**,
przy drugim zdobytym miescie, czyli 13 tur przed tura 20, w ktorej mechanizm mialby
ruszyc. Lacznie z jego 180 turami mamy **345 tur, dwie niezalezne metody, zero wojen**.

Trzy rzeczy dokladam ponad jego raport:

1. **Test przyczynowy Z5, ktorego on nie wykonal.** On wywnioskowal bramke `pre_contact`
   z braku wojen w mutancie M1 plus odczytu kodu. Zbudowalem mutanta **M1+M2** (M1 jak
   u niego, M2 dodatkowo zdejmuje `pre_contact`) — i wojny **faktycznie wybuchly**:
   3 wymuszone wojny Kamienia, tury 20–21, dokladnie miedzy tymi parami, ktore mechanizm
   wybral w jego M1 (1↔15, 22↔29, 8↔36). Wiecej: w censusie komend widac **te konkretne
   trzy komendy** `wypowiedz_wojne` i wszystkie trzy maja warstwe `pre_contact` — czyli
   w grze niezmutowanej zostalyby skasowane. Z5 przestaje byc przeslanka, staje sie dowodem.
2. **Z2 nie jest „rzadko spelniona", tylko arytmetycznie NIESPELNIALNA.** Doprowadzilem
   jego obserwacje do dowodu: `score >= respekt = round(100*rw)`, a `effProgWojnaSila`
   ma podloge 0,38 — wiec spelnienie warunku sily wymusza `score >= 38` przy progu 30.
   Wyczerpujaca siatka parametrow: **23 z 24 komorek calkowicie puste**.
3. **Punkt 5 dispatchu rozstrzygniety POMIAREM, nie odczytem kodu.** W przebiegu M1+M2
   trwaja trzy wojny AI↔AI, a gracz dostaje **0 kart w Wydarzeniach, 0 wierszy w panelu
   dyplomacji i 0 sygnalu na mapie**. Zero informacji.

Noty (nie blokady): jedno zdanie w jego streszczeniu jest nadmiernie ogolne (E1),
jedna tabela probkuje stan w innym punkcie tury niz jego wlasny rejestrator (E2),
oraz trzy drobniejsze uwagi metodyczne (E3–E5). **Zadne z jego piatki znalezisk
Z1–Z5 nie zostalo obalone.**

---

## 1. Jak zweryfikowalem (metoda CELOWO INNA niz Operatora)

Regula przeciw samooszukiwaniu wymaga drugiego **dowodu**, nie drugiego przebiegu tym
samym przyrzadem. Operator instrumentowal **wejscia decyzji**: w `ai.ts`, tuz przy
bramie wojny, zapisywal `rw`, `score`, `effAgresja` i progi — czyli to, co AI *widzi*,
zanim zdecyduje. Moj build **nie dotyka `ai.ts` w ogole** i mierzy **od strony stanu gry**:

| co | Operator | Evaluator (ten raport) |
|---|---|---|
| glowna miara wojen | licznik ocen bramy w `ai.ts` + `state()` po ownerach **posiadajacych miasta** | **diff calej mapy `diplomacyRelations` miedzy turami** — wypowiedzenie = para, ktora w turze N ma status `wojna`, a w N-1 nie miala; obejmuje takze ownerow bez miast |
| brama AI→gracz | `rw`/`score` z wnetrza `decideAIDiplomacy` | `respekt`/`zaufanie` odczytane z relacji w `diplomacyRelations` (silnik zapisuje tam `respekt = round(100*rw)`, `main.ts:27615-27618`) |
| komendy wojny | — | **census na granicy `main.ts`**: ile komend `wypowiedz_wojne` wyprodukowal `decideAIDiplomacy` (`dipCmdsRaw`) i ile przezylo filtr warstwy (`dipCmdsLayered`), plus warstwa `dipLayer` per owner per tura |
| co widzi gracz | `warEventLog` | `warEventLog` **oraz** `collectWarsWithPlayer()` i `collectKnownWarsBetweenOthers()` — czyli funkcje, ktorymi karmiony jest panel dyplomacji |
| ziarna | 111, 222, 333 | **777, 888 (nowe) + 111 (powtorka jego ziarna)** |
| mutanty | M1 (usuniecie galezi `startCityState`) | **M1 + M2 razem** — M1 jak u niego, M2 dodatkowo wylacza `pre_contact` w `filterDiplomacyCommandsForLayer`. To jest test PRZYCZYNOWY hipotezy Z5, ktorego Operator nie wykonal (wnioskowal ja z braku wojen w M1 + odczytu kodu) |

Reszta warunkow identyczna i celowo nieruszona: prawdziwa petla (`doStartGame` +
`triggerPlayerEndTurn`) w zywym Chromium na artefakcie `vite build`, instrumentacja
wstrzykiwana wylacznie w pamieci (`gra/tools/wojny-kamien-ev.vite.config.ts`), brak
kotwicy = twardy blad buildu, `gra/src` i `gra/data` nietkniete.

## 2. Punkt (d) — czy harness Operatora nie mierzy wlasnych stubow

Przeczytalem cala jego instrumentacje linia po linii i sprawdzilem kazda kotwice
w zrodle. **Zaden warunek blokujacy wojne nie jest przez jego harness wylaczany
ani obchodzony.** Rozbicie:

| element harnessu Operatora | co robi | czy moze wyprodukowac wynik „zero wojen" |
|---|---|---|
| `GATE_RECORDER`, `OWNER_RECORDER`, `CANDIDATE_RECORDER` | wylacznie `push` do tablicy w `try/catch`; zero odczytow warunkujacych, zero zapisow do stanu | **nie** |
| kotwice instrumentacji (5 szt.) | brak kotwicy albo kotwica niejednoznaczna = `throw` na etapie buildu | **nie** — cicha awaria instrumentacji jest niemozliwa; sprawdzilem wszystkie 5 kotwic, wszystkie istnieja i sa unikalne |
| `__warAuditBuildParams()` = `buildParams()` | kreator nowej gry nie jest pokazany, wiec `settingValue()` czyta puste DOM i wpada w wartosci domyslne | **nie** — ale ma skutek uboczny wazny dla wniosku (patrz nizej, sciezka 4 wojny na gracza). Odtworzylem te same parametry niezaleznie w swoim buildzie |
| `endTurn()` → `flushDeferredAutoPreBattle()` | rozstrzyga zakolejkowane bitwy automatyczne | **nie** — dotyczy bitew, nie dyplomacji; dyplomacja AI idzie PRZED ruchem (`main.ts:27584`) |
| `clearPreBattle()` → `resetEndTurnBlockers()` | **realna ingerencja**: kasuje `aiCmdResume` | **nie, i to w kierunku przeciwnym** — `aiCmdResume` wznawia liste komend RUCHU (`main.ts:27580`: gałąź `isCommandResume` **omija** blok dyplomacji). Skasowanie wznowienia sprawia, ze owner przy nastepnym przetworzeniu idzie galezia `else`, czyli przez dyplomacje **jeszcze raz**. To moze wojen tylko DODAC, nigdy nie ujac. W jego trzech przebiegach `turnLog` jest pusty (0 zwisow, 0 timeoutow) — wiec ta sciezka i tak sie nie uruchomila |
| `state()` → `getDiploRelation(a,b)` po wszystkich parach | `getDiploRelation` **materializuje** brakujace pary domyslna relacja i wymusza `wojna` dla par z barbarzyncami (`main.ts:7492-7508`) | **nie** — tworzy dokladnie te wartosci, ktore silnik i tak by utworzyl leniwie. **NOTA E3**: to jest sonda, ktora pisze do stanu gry. Moj harness ma ten sam problem (`countActiveWarsForOwner` tez wola `getDiploRelation`), wiec zglaszam to jako **wspolne ograniczenie obu pomiarow**, nie jako zarzut. Ryzyko: `applyWiarygodnoscD4ToRelation` liczy zaufanie z biezacej wiarygodnosci, wiec relacja zmaterializowana w turze 1 moze miec inne zaufanie niz zmaterializowana w turze 30. Skala bledu (kilka punktow zaufania) jest o rzad wielkosci mniejsza niz zmierzony zapas do progu (76–111 punktow), wiec wniosku nie rusza |

**Dowod empiryczny, ze ta ingerencja w ogole nie zachodzi.** W moim przebiegu ziarna 888
dolozylem licznik wywolan `unblock()` (odpowiednik jego `clearPreBattle()`): **`unblockCount = 0`**,
`notes = []`. Bitwy sa automatyczne (`battleAlwaysManual: false` w parametrach domyslnych),
a gracz nie ma armii i nie jest z nikim w wojnie, wiec okno pre-bitwy nie otwiera sie ani razu.
W jego trzech przebiegach `turnLog` jest pusty — ten sam obraz. **Sciezka ryzykowna istnieje
w obu harnessach, ale w zadnym z 7 przebiegow (3 jego + 4 moje) nie zostala uruchomiona.**
(Licznik dolozylem po starcie przebiegow 111/777 i mutanta, wiec dla nich zglaszam to
jako **brak dowodu**, nie jako zero — §13a.)

Sprawdzilem takze, czy jego liczby faktycznie wynikaja z jego surowych zrzutow —
przeliczylem je wlasnym kodem: **zgadzaja sie co do cyfry**, w tym `progSila`
przyjmujaca w danych dokladnie wartosci 0,38 i 0,6, ktore niezaleznie wychodza
z mojej analizy przestrzeni parametrow. Szczegoly: `dowody-ev/weryfikacja-danych-operatora.md`.

## 3. Wynik wlasnego pomiaru — odpowiedz jest TA SAMA co u Operatora

**W epoce Kamienia nie wybucha ani jedna wojna: ani AI↔AI, ani AI→gracz.**
Zmierzone diffem calej macierzy `diplomacyRelations` miedzy kolejnymi turami, czyli
zupelnie inna droga niz u Operatora — i wynik jest identyczny.

### Tabela glowna (ziarno · tury · powtorzenia)

| ziarno | powtorzen | tur | wypowiedzen wojny **ogolem** | z graczem | AI↔AI | wymuszonych Kamienia | par w stanie wojny na koniec | zwisow/timeoutow |
|---|---|---|---|---|---|---|---|---|
| **111** (ziarno Operatora) | 1 | **60** | **0** | **0** | **0** | **0** | **0** | 0 |
| **777** (nowe) | 1 | **60** | **0** | **0** | **0** | **0** | **0** | 0 |
| **888** (nowe) | 1 | **45** | **0** | **0** | **0** | **0** | **0** | 0 |
| *M1+M2, 111 (kontrola)* | 1 | *46* | ***3*** | *0* | ***3*** | ***3*** | *3* | *0* |

### Punkt 1 dispatchu — czy wymuszona wojna Kamienia wybucha

**NIE, zero razy.** Mechanizm zatrzymuje sie na pierwszym kroku — bramka
`!isOwnerClusterCityState(ownerId, ownerCityStateOpts())` (`main.ts:28025`):

| ziarno | glownych cyw. AI | tura przeskoku bramki na „miasto-panstwo" | miast AI w tej turze | ile weszlo do `pending` | ile do `stoneForceWarActiveByPairKey` |
|---|---|---|---|---|---|
| 111 | 6 (id 1, 8, 15, 22, 29, 36) | **7 — wszystkie szesc** | **2** | **0** | **0** |
| 777 | 6 (id 1, 8, 15, 22, 29, 36) | **6 · 7 · 6 · 6 · 7 · 7** | **2** | **0** | **0** |
| 888 | 6 (id 1, 8, 15, 22, 29, 36) | **6 · 6 · 6 · 7 · 7 · 7** | **2** | **0** | **0** |

Bramka staje sie `false` **13 tur przed** tura 20, w ktorej mechanizm mialby ruszyc.
Dlugosc wojny, sposob zakonczenia (2 miasta / odpoczynek / cooldown):
**BRAK DOWODU — nie bylo czego mierzyc** (0 wojen w przebiegach bazowych).
Zmierzone dopiero w przebiegu kontrolnym M1+M2 (§4).

### Punkt 2 dispatchu — czy ktorekolwiek AI wypowiada wojne GRACZOWI

**NIE, zero razy.** Rozklad `respektWzgledny` AI-vs-gracz (odczytany ze stanu:
`respekt` w relacji = `round(100*rw)`, `main.ts:27615-27618`), wylacznie dla AI
**odkrytych przez gracza** — dla nieodkrytych silnik w ogole nie przelicza respektu,
wiec ich wartosci nie sa pomiarem:

| ziarno | obserwacji | pominietych (AI nieodkryte) | rw min | **rw mediana** | rw max | `rw >= 0,6` | `score < 30` | **oba naraz** | min `zaufanie` |
|---|---|---|---|---|---|---|---|---|---|
| 111 | 183 | 2709 | 0,30 | **0,72** | 0,80 | **146** | **0** | **0** | 47 |
| 777 | 183 | 2709 | 0,30 | **0,62** | 0,74 | **116** | **0** | **0** | 47 |
| 888 | 167 | 2005 | 0,30 | **0,63** | 0,73 | **120** | **0** | **0** | 47 |

Kierunek jest jednoznaczny i **odwrotny do hipotezy dispatchu**: przewaga AI nie jest
rzadka — jest regula, a to wlasnie ona blokuje wojne (§6, D1).

### Census komend na granicy `main.ts` — warstwa dyplomacji

| ziarno | rekordow owner x tura | `full` | `simplified` | **`pre_contact`** | komend `wypowiedz_wojne` (raw) | z tego w gracza | po filtrze warstwy |
|---|---|---|---|---|---|---|---|
| 111 | 1212 | **0** | 174 | **1038 (85,6%)** | **0** | **0** | **0** |
| 777 | 1237 | **0** | 172 | **1065 (86,1%)** | **0** | **0** | **0** |
| 888 | 1039 | **0** | 159 | **880 (84,7%)** | **0** | **0** | **0** |
| *M1+M2, 111* | *1045* | *0* | *130* | *915 (87,6%)* | ***3*** | *0* | *3* |

Dwie liczby z tej tabeli sa kluczowe. Po pierwsze: **`full` = 0 przez caly przebieg
bazowy** — gracz przez 60 tur nie odkryl ani jednej **glownej** cywilizacji AI
(odkryte: 43, 44, 45, czyli miasta-panstwa wlasnego klastra). Po drugie:
**zero surowych komend `wypowiedz_wojne`** w 1212 rekordach — zwykla sciezka wojny
(priorytet 4 `decideAIDiplomacy`) nie odpala sie w Kamieniu w ogole, ani wobec gracza,
ani miedzy AI. To potwierdza Z2 i Z3 Operatora na innym poziomie pomiaru niz jego.

### Punkt 3 dispatchu — hipoteza wlasciciela o przejmowaniu miast-panstw

| ziarno | wlascicieli z miastem `startCityState` (poza glownymi AI): start → koniec | stabilizacja od tury | tura wykluczenia AI z mechanizmu | tura startu mechanizmu |
|---|---|---|---|---|
| 111 | 42 → 6 | **24** | **7** | 20 |
| 777 | 42 → 6 | **25** | **6–7** | 20 |
| 888 | 42 → 6 | **24** | **6–7** | 20 |

Intuicja wlasciciela („najpierw przejmuja swoje miasta-panstwa, potem walcza") jest
**zgodna z rytmem gry** — konsolidacja klastrow konczy sie w okolicach tury 24, czyli
po turze 20. Ale **skutek jest odwrotny do oczekiwanego**: juz **pierwsze** przejecie
(tura 7, drugie miasto) trwale wyklucza cywilizacje z mechanizmu, wiec doczekanie
do tury 24 niczego nie odblokowuje. **To nie jest potwierdzenie projektu — to defekt.**
Potwierdzam wniosek Operatora, wlasnym pomiarem i na jego wlasnym ziarnie.

### Punkt 4 dispatchu — czy gracz jest wykluczony jako cel wymuszonej wojny

**TAK.** W przebiegach bazowych kod nie dochodzi do filtra `oid > 0` (mechanizm nie
startuje) — **to jest brak dowodu, nie wynik**. Rozstrzyga przebieg kontrolny M1+M2,
w ktorym mechanizm faktycznie wybral cele i wypowiedzial 3 wojny: **zadna z par nie
zawiera ownera 0** (`1↔15`, `22↔29`, `8↔36`), i zadna z 3 komend `wypowiedz_wojne`
nie miala `targetId === '0'`. Zgodne z litera decyzji `R-EPOKA-KAMIEN-WYMUSZONA-WOJNA-Q1`
(Q2: cel = najblizsza cywilizacja AI) — **nie defekt**, ale wprost tlumaczy zdanie
wlasciciela „nie widze, zeby ktos wypowiedzial mi wojne": ten mechanizm z zalozenia
gracza nie dotyczy.

## 4. Test PRZYCZYNOWY hipotezy Z5 — czego Operator nie wykonal

Operator wywnioskowal Z5 z **braku** wojen w mutancie M1 plus odczytu kodu. Brak
zdarzenia nie jest dowodem przyczyny, wiec zrobilem test rozstrzygajacy: build
**M1 + M2** — M1 jak u niego (wylaczona galaz `startCityState` w
`isOwnerClusterCityState`, `display-names.ts:57`), M2 dodatkowo zamienia
`if (layer === 'pre_contact') return [];` na `return list;`
(`diplomacy-layers.ts:265`). Obie mutacje zyja wylacznie w pamieci buildu.

Ziarno **111** (to samo, na ktorym Operator dostal 0 wojen), ten sam harness:

| miara (tury 1–30) | przebieg BAZOWY | przebieg **M1 + M2** |
|---|---|---|
| glownych AI przeklasyfikowanych na „miasto-panstwo" | **6/6 w turze 7** (po 2 miasta) | **0/6 — nigdy** |
| pierwsza tura z niepustym `stoneForceWarPendingOwners` | **nigdy** | **21** |
| pierwsza tura z niepustym `stoneForceWarActiveByPairKey` | **nigdy** | **20** |
| **wypowiedzen wojny (diff macierzy relacji)** | **0** | **3** |
| pary i tury | — | tura **20**: `1↔15`, `22↔29` · tura **21**: `8↔36` |
| czy to wojny wymuszone Kamienia | — | **3/3 TAK** (para obecna w `stoneForceWarActiveByPairKey`) |
| wojen z udzialem gracza | 0 | **0** |
| `countActiveWarsForOwner` max u dowolnego ownera | **0** | **1** |

**Wniosek A (nietautologicznosc mojego pomiaru):** ten sam harness, to samo ziarno,
te same tury — przebieg bazowy `0`, przebieg zmutowany `3`. Harness mierzy gre,
nie siebie.

**Wniosek B (Z1 potwierdzone przyczynowo, niezaleznie od Operatora):** wylaczenie
galezi `startCityState` sprawia, ze zadna glowna cywilizacja nie jest juz
przeklasyfikowana, a mechanizm rusza dokladnie w turze **20**, zgodnie z decyzja
`R-EPOKA-KAMIEN-WYMUSZONA-WOJNA-Q1`.

**Wniosek C (Z5 potwierdzone przyczynowo — Operator mial racje):** po zdjeciu
`pre_contact` wojny **faktycznie wybuchaja**, i to dokladnie miedzy tymi parami,
ktore mechanizm wybral w jego mutancie M1 (1→15, 8→36, 22→29). Bramka `pre_contact`
byla wiec realna, druga blokada, a nie tylko podejrzeniem.

**Wniosek C-bis — dowod Z5 NA POZIOMIE POJEDYNCZEJ KOMENDY.** Census komend na granicy
`main.ts` w przebiegu M1+M2 (46 tur, 1045 rekordow owner x tura):

| miara | wartosc |
|---|---|
| rekordow owner x tura | 1045 |
| warstwa `full` | **0** |
| warstwa `simplified` | 130 |
| warstwa **`pre_contact`** | **915 (87,6%)** |
| komend `wypowiedz_wojne` wyprodukowanych przez `decideAIDiplomacy` (raw) | **3** — wszystkie w turze 20, wszystkie AI↔AI |
| z tego wycelowanych w gracza | **0** |
| ktore przezyly filtr warstwy (M2 aktywne) | **3** |
| **warstwa tych trzech rekordow** | **`pre_contact` we wszystkich trzech** |

Ostatni wiersz jest rozstrzygajacy: **w grze NIEZMUTOWANEJ te trzy komendy zostalyby
skasowane przez `filterDiplomacyCommandsForLayer`** i wojen bylo by zero. To nie jest
wnioskowanie z braku zdarzenia — to identyfikacja konkretnych trzech komend, ktore
bramka zjada.

Drugi wniosek z tej samej tabeli: w 1045 rekordach **zwykla** sciezka `wypowiedz_wojne`
(priorytet 4 `decideAIDiplomacy`) nie wyprodukowala **ani jednej** komendy — ani wobec
gracza, ani miedzy AI. To potwierdza Z3 Operatora na granicy `main.ts`, niezaleznie
od jego instrumentacji wnetrza `ai.ts`.

**Wniosek D (punkt 5 dispatchu — rozstrzygniety POMIAREM, nie tylko odczytem kodu):**
w przebiegu M1+M2 trwaja **trzy wojny AI↔AI**, a gracz dostaje:

| kanal | liczba sygnalow przy 3 trwajacych wojnach AI↔AI |
|---|---|
| karty w panelu Wydarzen o wojnie | **0** |
| wiersze w sekcji „Wojny znane (wywiad)" panelu dyplomacji | **0** |
| odkrytych nacji przez gracza | **3 z 13** (43, 44, 45 — wylacznie miasta-panstwa wlasnego klastra) |

Zero. **Gracz nie ma jak sie dowiedziec, ze wojna trwa** — pierwszy kanal jest zamkniety
konstrukcyjnie (`main.ts:7753`), a drugi wymaga odkrycia strony konfliktu, czego mgla
wojny w Kamieniu nie pozwala osiagnac. To zamyka punkt 5 dispatchu wynikiem pomiarowym,
a nie samym odczytem kodu.

## 5. Punkt (e) — czy gracz w ogole widzi wojny AI↔AI

Dispatch prosil o sprawdzenie „panel Wydarzen, dyplomacja, mapa". Przeszedlem
wszystkie trzy kanaly w kodzie i zmierzylem dwa z nich w rozgrywce.

| kanal | jak dziala | wojna AI↔AI |
|---|---|---|
| **panel Wydarzen** (`collectTurnEvents`, `main.ts:13273-13282`) | karmiony m.in. z `warEventLog`; karte wojny dopisuje wylacznie `recordWarDeclarationEvent` | **NIE.** Podwojna blokada: (1) miejsce wywolania dopisuje karte tylko gdy `targetId === 0 \|\| ownerId === 0` (`main.ts:28197-28200`); (2) sama funkcja zaczyna sie od `if (declarerId !== 0 && targetId !== 0) return;` (`main.ts:7753`) |
| **toast / komunikat** (`showHintMessage`) | jedyne wywolanie przy wojnie to sciezka klastra miast-panstw NA GRACZA (`main.ts:27239`) | **NIE** |
| **mapa** (obwodka terytorium) | `setDiploRelation` przemalowuje granice tylko gdy `a === 0 \|\| b === 0` i status sie zmienil (`main.ts:8215`); obwodka jednostki (`unitRingStanceForPlayer`, `main.ts:7509-7514`) patrzy wylacznie na relacje z graczem | **NIE** |
| **panel dyplomacji** — sekcja „Wojny znane (wywiad)" (`ui/diplomacyPanel.ts:282-290` ← `collectKnownWarsBetweenOthers`, `main.ts:16067`) | wypisuje pary AI↔AI w stanie wojny, ale **tylko** gdy co najmniej jedna strona jest w `diplomaticallyDiscoveredOwners` | **TAK — i to jedyny kanal.** Pasywny: gracz musi sam otworzyc panel. Zero powiadomienia, zero karty, zero sladu na mapie |

**Odpowiedz na punkt 5: wojna miedzy dwoma AI nie generuje dla gracza ZADNEGO sygnalu
aktywnego.** Jedyny slad to wiersz w sekcji „Wojny znane (wywiad)" panelu dyplomacji,
widoczny wylacznie po recznym otwarciu panelu i wylacznie dla wojen, w ktorych gracz
odkryl przynajmniej jedna ze stron. To potwierdza znalezisko Z4 Operatora i doprecyzowuje
je o nazwe sekcji UI oraz o brak sygnalu na mapie (czego jego raport nie sprawdzal).

## 6. Co dodaje ten raport ponad raport Operatora

### D1 — brama AI→gracz nie jest „rzadko spelniona", tylko **arytmetycznie niespelnialna**

Operator napisal, ze warunki „nie moga byc prawdziwe naraz", i pokazal to na 591
obserwacjach. To jest statystyka. Doprowadzilem to do konca jako **dowod**, z pelna
enumeracja przestrzeni parametrow (`gra/tools/wojny-kamien-ev-brama.cjs`):

`score >= respekt = round(100*rw)` (`main.ts:27615-27618`, `diplomacy.ts:1586-1593`,
`:1738-1743`, `:791-798`), a `effProgWojnaSila ∈ [0,38; 0,68]` (`ai.ts:4017`, `:4032`,
`:4048`, `:4218-4222`). Wiec spelnienie warunku sily wymusza `score >= 38`, przy progu
relacji `30` (Normalny). Siatka 3 trudnosci x 2 `podbojBoost` x 4 `warSilaBonus` x
1001 wartosci `rw` x 101 wartosci `zaufanie`:

**23 z 24 komorek sa calkowicie puste.** Jedyna niepusta: trudnosc **Trudny**
(`progMinimalnyRelacja = 40`), archetyp agresywny o `tolerancjaRyzyka >= 7`
i `sklonnoscDoPodboju >= 4`, `rw ∈ [0,380; 0,399]` i `zaufanie <= 1` — czyli AI
**slabsza** od gracza. Pelna tabela: `dowody-ev/brama-ai-gracz-spelnialsc.md`.

**To odwraca hipoteze dispatchu.** Dispatch zakladal, ze „przewaga 1,5:1 nad graczem
moze byc rzadka". Jest odwrotnie: **przewaga AI czyni wojne niemozliwa**, bo ta sama
liczba (`respekt`) jest jednoczesnie miara przewagi i skladnikiem relacji.

### D2 — pelna enumeracja sciezek wojny na gracza, z jedna dzialajaca

Przeszukalem wszystkie miejsca zapisujace status `wojna` (`'wojna_wypowiedziana'`
+ `setDiploRelation`) — 7 sciezek. Szczegoly z warunkami wejscia:
`dowody-ev/sciezki-wojny-na-gracza.md`. Wynik:

**Przy ustawieniach domyslnych (trudnosc „Normalny") zadna sciezka nie moze doprowadzic
do wypowiedzenia wojny graczowi w epoce Kamienia.** Obserwacja wlasciciela jest w 100%
trafna i wyjasniona konstrukcja kodu, nie pechem ziarna.

**Jedyna sciezka, ktora w ogole moglaby zadzialac**, to wojna klastra miast-panstw
na gracza (`main.ts:27193`) — ale wymaga `_menuCityStateDifficultyVsPlayer === 'hard'`,
a ta zmienna idzie **wprost z trudnosci gry** (`main.ts:29919-29922`), przy domyslnym
`cityStateDifficultyOverride: null` (`ui/newGameFlow.ts:201`). Czyli: **na trudnosci
„Trudny" miasta-panstwa wlasnego typu MOGA wypowiedziec graczowi wojne w Kamieniu;
na „Normalny" nie moze tego zrobic nikt.** To informacja praktyczna dla wlasciciela,
ktorej dispatch nie zawieral. (Operator wymienil te sciezke w §5 swojego raportu jako
uzupelnienie „z odczytu kodu" — potwierdzam ja i podaje brakujaca konsekwencje
dla ustawien menu.)

## 7. Noty do raportu Operatora (nie blokady)

| id | nota | skutek dla wniosku |
|---|---|---|
| **E1** | Zdanie „**Zmierzone: 0/6 glownych AI mialo kontakt z graczem**" (§0, Z5) jest prawdziwe tylko dla przebiegu mutanta M1. W jego wlasnych przebiegach BAZOWYCH gracz odkryl jedna glowna cywilizacje na ziarnie 222 (owner 8, od tury 24) i jedna na 333 (owner 15, od tury 29) — te AI **nie byly** w warstwie `pre_contact` | **zaden** — wojna i tak nie wybuchla, ale zablokowal ja Z2 (relacja), nie Z5. Te dwa przypadki sa najlepsza ilustracja Z2 w calym audycie: `rw` 0,89–0,98 (AI 8–40x silniejsza), kontakt nawiazany, warstwa pelna — i `score` 107–111 przy progu 30 |
| **E2** | Tabela §2 podaje ture przeskoku bramki jako „6/6/6 · 7/7/7" dla ziarna 111. To pochodzi z jego serii `snapshots`; jego **wlasny** rejestrator w petli AI daje dla wszystkich szesciu ownerow ture **7** (i dokladnie 2 miasta). Roznica to punkt probkowania w obrebie jednej tury, w jego wlasnych danych | **zaden** — moj niezalezny pomiar daje **7 dla wszystkich szesciu**, czyli zgodnie z jego rejestratorem. Zapis „6–8" w streszczeniu jest uczciwy, tabela mogla byc precyzyjniejsza |
| **E3** | Sonda `state()` wola `getDiploRelation` po wszystkich parach, co **materializuje** relacje w mapie stanu. To sonda pomiarowa piszaca do stanu gry | **wspolne ograniczenie** — moj `countActiveWarsForOwner` robi to samo. Skala potencjalnego bledu (kilka punktow zaufania) jest o rzad wielkosci mniejsza niz zmierzony zapas do progu |
| **E4** | Predykat `allOk` w jego redukcji sprawdza warunki bramy w izolacji, ignorujac drabinke priorytetow `decideAIDiplomacy` (kazdy wczesniejszy priorytet konczy sie `continue`, wiec czesc par nigdy nie dochodzi do priorytetu 4) | **zaden, kierunek bezpieczny** — pominiecie drabinki moze liczbe „przechodzacych" tylko zawyzyc, a i tak wyszlo 0 |
| **E5** | Jego `state().wars` iteruje po ownerach **posiadajacych miasta**; owner z jednostkami, ale bez miast, jest dla tej miary niewidoczny | **zaden** — moj diff calej mapy `diplomacyRelations` jest scisle szerszy i tez daje 0 |

## 8. Bramki i dowod czystosci (uruchomione przeze mnie, w moim worktree)

| bramka | wynik referencyjny | wynik u mnie |
|---|---|---|
| `node ./node_modules/typescript/bin/tsc --noEmit` | 0 bledow | **0 bledow** (exit 0, pusty output) |
| `logic-test` | 213/213 | **LOGIC OK (213/213)** |
| `tech-tree-test` | 19/0 | **19 pass, 0 fail** |
| `research-test` | 33/33 | **PASSED: 33 / FAILED: 0 / ALL GREEN** |
| `unit-replace-test` | 13/13 | **WSZYSTKIE TESTY ZIELONE (13/13)** |
| `combat-test` | 6/6 | **6/6 pass** |
| `forced-war-stone-test` | 32/0 | **PASSED: 32 / FAILED: 0** |
| `forced-war-stone-main-guard-test` | 18/0 | **18 PASS, 0 FAIL** |
| `ai-war-gate-test` | 24/0 | **24 passed, 0 failed** |
| `diplomacy-war-gates-test` | 19/0 | **19 pass, 0 fail** |
| `alliance-war-obligation-test` | 14/0 | **14 passed, 0 failed** |

`git status --porcelain gra/src gra/data` → **pusto**. `git diff HEAD origin/main -- gra/src gra/data`
→ **pusto**. Caly moj diff to `gra/tools/wojny-kamien-ev*.{ts,cjs}` (4 pliki) + raport i dowody runu.
C-001 respektowane: build wylacznie `node ./node_modules/vite/bin/vite.js build --config
tools/wojny-kamien-ev.vite.config.ts --outDir /tmp/civ-ev-* --emptyOutDir` (outDir poza
drzewem repo), zero `npm run build`/`dev`, zero `npx`, zero `git add -A`, zero
`map-gen-regression-test`. Wyniki czastkowe commitowane w trakcie.

**Bramki mechanizmu (32/0, 18/0, 24/0, 19/0, 14/0) nie sa odpowiedzia na pytanie
wlasciciela i tak ich nie traktuje** — sa zielone, a mechanizm w rozgrywce nie startuje.
To jest dokladnie roznica, przed ktorej myleniem ostrzega §13a.

## 9. Werdykt wobec znalezisk Operatora

| id Operatora | jego teza | moj werdykt | na jakiej podstawie |
|---|---|---|---|
| **Z1** | Przejecie miasta z `startCityState` trwale klasyfikuje glowna cywilizacje AI jako miasto-panstwo → wyzwalacz wojny Kamienia (i Brazu) nigdy nie odpala | **POTWIERDZONE, przyczynowo** | wlasny pomiar stanu: 6/6 glownych AI przeklasyfikowanych w turze **7** przy 2 miastach, `pending` pusty przez 60 tur; mutant M1+M2: 0/6 przeklasyfikowanych i mechanizm rusza w turze **20**. Odczyt kodu: `main.ts:28025`, `:27963`, `:1701` (Braz przy awansie epoki), `display-names.ts:57`, kasowanie `startCityState` tylko przy wchlonieciu dyplomatycznym (`main.ts:23625`), nie przy przejeciu miasta (`main.ts:12459`) |
| **Z2** | Brama wojny wobec gracza jest sprzecznie skonfigurowana | **POTWIERDZONE i WZMOCNIONE** — nie „rzadko spelniona", tylko **arytmetycznie niespelnialna** przy ustawieniach domyslnych. Dowod + wyczerpujaca siatka parametrow: §6 D1 |
| **Z3** | Zwykla sciezka `wypowiedz_wojne` jest w Kamieniu martwa takze miedzy AI | **POTWIERDZONE inna miara** — census komend: **0 surowych komend `wypowiedz_wojne`** w 1212 rekordach owner x tura (ziarno 111, 60 tur); u niego wynik z instrumentacji wnetrza `ai.ts`, u mnie z granicy `main.ts` |
| **Z4** | Wojna AI↔AI nie generuje zadnej karty w panelu Wydarzen; jedyny kanal to pasywny podglad w panelu dyplomacji | **POTWIERDZONE i ROZSZERZONE** — zmierzone w rozgrywce (3 trwajace wojny AI↔AI, 0 kart, 0 wierszy w panelu), plus sprawdzony trzeci kanal, ktorego on nie badal: **mapa tez nie daje sygnalu** (`main.ts:8215`, `:7509-7514`). Szczegoly §5 |
| **Z5** | Warstwa `pre_contact` kasuje wszystkie komendy AI nieodkrytego przez gracza, w tym wypowiedzenie wojny innemu AI | **POTWIERDZONE, przyczynowo — czego on nie zrobil** | mutant M1+M2: po zdjeciu `pre_contact` wojny **faktycznie wybuchaja** (3 wojny, tury 20–21, dokladnie te pary, ktore mechanizm wybral w jego M1). Dodatkowo zidentyfikowane **konkretne trzy komendy**, ktore bramka zjada — wszystkie trzy maja `dipLayer === 'pre_contact'`. Skala: **85,6% rekordow owner x tura w warstwie `pre_contact`, `full` = 0** przez caly przebieg bazowy |

**Zadne znalezisko Operatora nie zostalo obalone.** Wszystkie piec potwierdzone,
dwa (Z2, Z5) doprowadzone z poziomu przeslanki do poziomu dowodu, dwa (Z4, Z1)
rozszerzone o kanaly/miejsca, ktorych jego raport nie sprawdzal.

## 10. Znaleziska dodane przez Evaluatora (OPISANE, NIE NAPRAWIONE)

| id | opis | miejsce | waga |
|---|---|---|---|
| **Z6** | Brama `wypowiedz_wojne` AI→gracz jest **arytmetycznie niespelnialna** na trudnosciach Łatwy i Normalny, dla kazdego AI, kazdej tury i kazdego stosunku sil — bo `respekt` jest jednoczesnie miara przewagi i skladnikiem `score`. Na Trudnym spelnialna w jednej, skrajnie waskiej komorce (AI **slabsza** od gracza, `zaufanie <= 1`). To nie jest „rzadkie zdarzenie", tylko sprzecznosc konstrukcyjna | `ai.ts:4377-4386` + `main.ts:27615-27618` + `diplomacy.ts:791-798`, `:1586-1593`, `:1738-1743`, `:172` | **blokujaca** |
| **Z7** | Jedyna sciezka, ktora w epoce Kamienia MOGLABY doprowadzic do wypowiedzenia graczowi wojny (`resolveClusterCityStateWarOnPlayer`), jest zamknieta przy domyslnej trudnosci: `_menuCityStateDifficultyVsPlayer` idzie wprost z trudnosci gry, a domyslny `cityStateDifficultyOverride` to `null`. Efekt: na „Normalny" **nikt** nie moze wypowiedziec graczowi wojny w Kamieniu; na „Trudny" — moga to zrobic miasta-panstwa wlasnego typu | `main.ts:27193`, `:29919-29922`, `ui/newGameFlow.ts:201` | wysoka (informacja praktyczna dla wlasciciela) |
| **Z8** | Bramka `pre_contact` jest sprzeczna z wlasnym, jawnym komentarzem projektu przy `filterDiplomacyCommandsForEstablishedContact`: „**Wojna moze nastapic po samym odkryciu na mapie**". Filtr warstwy stoi WCZESNIEJ w lancuchu i kasuje wojne calkowicie, zanim ten komentarz zdazy cokolwiek znaczyc | `diplomacy-layers.ts:265` vs `:295-297`; kolejnosc w `main.ts:28117-28131` | srednia (spojnosc projektu) |

**Naprawa ktoregokolwiek = osobny temat po decyzji wlasciciela. W tym temacie nic
nie naprawiam.**

## 11. Raport terminalny

STATUS: **PASS-WITH-NOTES**
DOMAIN: GAME
TEMAT: `P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1`
GOAL: niezalezna weryfikacja audytu Operatora — wykonana, wynik potwierdzony.
ZMIANY/COMMIT: `gra/tools/wojny-kamien-ev.vite.config.ts`, `gra/tools/wojny-kamien-ev.cjs`,
`gra/tools/wojny-kamien-ev-analiza.cjs`, `gra/tools/wojny-kamien-ev-brama.cjs`,
`dyspozycje/autobot/runs/P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1/02-evaluator.md` + `dowody-ev/**`.
**`gra/src/**` i `gra/data/**`: ZERO ZMIAN** (`git status --porcelain gra/src gra/data` → pusto;
`git diff HEAD origin/main -- gra/src gra/data` → pusto).
TESTY: 11 bramek zielonych, wszystkie uruchomione przeze mnie (tabela §8) + wlasny pomiar
**3 ziarna (111, 777, 888) x 60/60/45 tur = 165 tur** w zywym Chromium przez prawdziwa petle
tury, **inna metoda niz Operatora** + przebieg kontrolny **M1+M2** (ziarno 111, 46 tur)
jako dowod nietautologicznosci i przyczynowosci (0 wojen → 3 wojny przy tej samej
konfiguracji i ziarnie).
BLOKADY: **brak.** Zadna liczba Operatora nie rozjechala sie z moja; jego liczby
przeliczylem takze z jego surowych zrzutow — zgodne co do cyfry.
RUNDY: 1/5.
NASTEPNY KROK: **Final Control** (Sonnet 5 High, osobny subagent). Worktree
`/home/user/wt-ev-wojny` zostawiony dla FC; gałąź `autobot/P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1`
wypchnieta. **Temat nie konczy sie integracja kodu** — konczy sie liczbami i decyzja
wlasciciela w sprawie Z1–Z8.
DEPLOY/PUSH: **NIE WYKONANO** (wypchnieta wylacznie galaz tematu).

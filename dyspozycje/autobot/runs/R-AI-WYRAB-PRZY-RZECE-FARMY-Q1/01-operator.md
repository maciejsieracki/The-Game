# 01 — OPERATOR (runda 1/5)

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-AI-WYRAB-PRZY-RZECE-FARMY-Q1
MODEL+EFFORT: Opus 5, effort high
GOAL: AI ma samo wycinac lasy przy rzekach i stawiac tam farmy — o ile pomiar to obroni;
plus model priorytetow AI (kompleksowosc), nowa regula hodowli, obozy vs pastwiska.
GALAZ: `autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1` od `origin/main` (d0de8164), worktree `/home/user/wt-op-airzeki`.

**ZERO ZMIAN W KODZIE GRY W TEJ RUNDZIE.** Dodane wylacznie dwa narzedzia pomiarowe
w `gra/tools/` + artefakty runu. Powody nizej — trzy niezalezne blokady decyzyjne.

---

## KROK 1 (pomiarowy, obowiazkowy) — WYNIK: przeslanka zlecenia jest FALSZYWA

Narzedzie: `gra/tools/rzeka-farma-wyrab-krok1-measure.cjs`. Plony liczone realna funkcja
gry `tileYield` (`src/game/economy.ts:410`), kwalifikacja realnym `isFarmBaseTerrain`
(`src/map/improvement-build.ts:199`). Surowy log: `krok1-pomiar.txt`.

Heks Z RZEKA NA HEKSIE, nakladka Las. Plon **na ture**, koszt Pracy jednorazowo:

| Teren bazowy | wariant | zywnosc | pieniadz | praca | handel | drewno/ture | koszt Pracy | Drewno jednorazowo |
|---|---|---|---|---|---|---|---|---|
| Laka     | (a) las + farma      | **8** | 0 | **9**  | **10** | **15** | **20**   | 0 |
| Laka     | (b) wyrab + farma    | 9 | 0 | 6  | 8  | 0  | 22,5 | 0 |
| Laka     | (c) jw. + Drewno     | 9 | 0 | 6  | 8  | 0  | 22,5 | +25 |
| Rownina  | (a) las + farma      | **7** | 0 | **10** | **9**  | **20** | **20**   | 0 |
| Rownina  | (b) wyrab + farma    | 8 | 0 | 7  | 7  | 5  | 22,5 | 0 |
| Rownina  | (c) jw. + Drewno     | 8 | 0 | 7  | 7  | 5  | 22,5 | +25 |
| Wzgorza  | (a) las + farma      | **6** | 0 | **11** | **8**  | **20** | **20**   | 0 |
| Wzgorza  | (b) wyrab + farma    | 7 | 0 | 8  | 6  | 5  | 22,5 | 0 |
| Wzgorza  | (c) jw. + Drewno     | 7 | 0 | 8  | 6  | 5  | 22,5 | +25 |

DELTA (b) − (a), identyczna na kazdym terenie: **zywnosc +1, praca −3, handel −2, drewno −15**
na ture, przy **+2,5 Pracy kosztu**. Wyrab wymienia 1 zywnosci na 5 innych plonow — na zawsze.

(c) nie ratuje wariantu: jednorazowe **+25 Drewna** kasuje sie po **niespelna 2 turach**
straty −15 Drewna/ture; od tury 3 (c) jest gorsze od (a) tak samo jak (b).

Zakres realny (mapa 36x28 „kontynenty"): heksow „rzeka NA heksie + Las" jest
**22 (ziarno 42) / 44 (1337) / 46 (2026)** — razem **112**. Sprawa nie jest hipotetyczna.

**Wniosek KROKU 1: (a) — stan dzisiejszy — wygrywa z (b) i (c) na kazdym terenie bazowym.**
Zgodnie z dispatchem: `DECISION_REQUIRED`, BEZ implementacji wycinki pod farme.
Farme przy rzece AI moze postawic juz dzis, bez wyrebu — i tak jest lepiej.

**BRAK DOWODU (§13a):** nie zmierzylem, czy Drewno ma wartosc strategiczna poza plonem pola
(np. wąskie gardło budowy w konkretnej turze). Jesli wlasciciel chce wyrebu DLA DREWNA
albo dla wygladu mapy — to osobna, jawna decyzja, nie wniosek z tych liczb.

---

## SPRZECZNOSC WEWNETRZNA #1 — potwierdzona pomiarem, `DECISION_REQUIRED`

Kontrakt pkt 1: na heksie z rzeka **wykarczuj las → farma → potem trzoda**.
Nowa regula hodowli (ECHO 2026-08-27): trzoda **wymaga nakladki Las i tartaku na tym heksie**.
Wyrab usuwa nakladke Las. Oba warunki na tym samym heksie sa **wzajemnie wykluczajace sie**.

Zmierzone (sekcja C w `krok1-pomiar.txt`), heksy rzeka+Las:

| ziarno | rzeka+Las | W1: wyrab→farma→trzoda | W2: BEZ wyrebu — tartak+farma+trzoda na lesie | W3: wyrab→farma, trzoda na SASIEDNIM lesie |
|---|---|---|---|---|
| 42   | 22 | **0** | **22** | 22 |
| 1337 | 44 | **0** | **44** | 43 |
| 2026 | 46 | **0** | **46** | 46 |

W1 = 0 nie jest przypadkiem ziarna — to wynika z definicji: po wyrebie Lasu nie ma.
**W2 dziala na 100% heksow** i nie wymaga ani wyrebu, ani sasiada: tartak wolno stawiac
na lesie i las przy nim **zostaje** (kanon, `map-improvement-qualify-test`: „tartak stays
when forest removed"), farma na lesie jest legalna od decyzji 2026-07-21, trzoda po nowej
regule tez potrzebuje wlasnie lasu i tartaku. **W2 spelnia caly ciag wlasciciela
„farma, potem trzoda" — pod warunkiem, ze skreslimy z niego wyrab.**

Warianty do wyboru przez wlasciciela (Operator NIE wybiera):
- **W2** — na heksie z rzeka: tartak → farma → trzoda, **bez wyrebu**. Spojne z KROKIEM 1,
  z decyzja 2026-07-21 i z nowa regula hodowli naraz. Rekomendacja Operatora.
- **W3** — wyrab → farma na heksie z rzeka, trzoda na sasiednim heksie z lasem i tartakiem.
  Wykonalne na 111/112 heksow, ale placi cena z tabeli KROKU 1 (−3 praca, −2 handel, −15 drewno/ture).
- **W4** — trzoda zwolniona z wymogu lasu na heksach z rzeka (czesciowe cofniecie ECHO 2026-08-27).
- **W5** — ciag na heksie z rzeka konczy sie na farmie, bez trzody.

---

## NIEJEDNOZNACZNOSC #2 — „farmy plus przodek": POTWIERDZONE, bez decyzji wlasciciela

Zweryfikowane wobec `gra/data/terrain-improvements.json` (22 klucze ulepszen):
- klucza `przodek` **nie ma**;
- jedyne ulepszenie o nazwie **„Trzoda"** to klucz `bydlo`;
- `bydlo.warunek` mowi wprost: **„+ farma lub solo"** — dane same sankcjonuja pare „farma + trzoda";
- zaden inny klucz (stadnina, tarasy, irygacja, lodzie_rybackie…) nie jest blizszy ani fonetycznie,
  ani znaczeniowo; wlasciciel dwa zdania dalej pisze „postawic farmy, **potem trzode**".

**Odczyt orkiestratora potwierdzam: „przodek" = przejezyczenie od „trzode" = `bydlo`.**
Sensowniejszego kandydata nie znalazlem, wiec to NIE jest `DECISION_REQUIRED`.

---

## KOMPLEKSOWOSC — metryka i pomiar PRZED (glowne kryterium tematu)

Narzedzie: `gra/tools/ai-kompleksowosc-rozgrzebane-measure.cjs`, harness 1:1 z
`oboz-lowiecki-ai-40tur-measure.cjs`. Surowy log: `kompleksowosc-przed.txt`.

**Definicja metryki „heks rozgrzebany"** (Operator, runda 1): heks jest ROZGRZEBANY, jesli
ma juz ≥1 ulepszenie postawione przez AI, ALE realny kwalifikator gry
(`buildImprovementQualifier`) nadal dopuszcza na nim **co najmniej jedno kolejne** ulepszenie
z listy priorytetow AI (bez `wyrab`). Heks DOMKNIETY = tkniety i nic wiecej sie nie kwalifikuje.
Metryka nie zaklada zadnej intencji AI — czyta wylacznie stan mapy realnym kodem gry.

Pomiar PRZED, **5 ziaren x 40 tur**:

| ziarno | tkniete heksy | **rozgrzebane (koniec)** | domkniete | max w przebiegu | srednia/ture |
|---|---|---|---|---|---|
| 42    | 70 | **70** | **0** | 70 | 48,2 |
| 1337  | 68 | **68** | **0** | 68 | 44,7 |
| 2026  | 70 | **70** | **0** | 70 | 43,0 |
| 5150  | 77 | **77** | **0** | 77 | 44,6 |
| 31337 | 72 | **72** | **0** | 72 | 43,1 |
| **RAZEM** | **357** | **357** | **0** | — | — |

**Skarga wlasciciela potwierdza sie w skrajnej postaci: 357/357 = 100% tknietych heksow
zostaje niedokonczonych, ani jeden nie jest domkniety.** To jest liczba PRZED dla kryterium 1.

Przyczyna jest strukturalna, nie „na oko": `pickAutoImprovements` iteruje
**po TYPACH ulepszen w kolejnosci priorytetu**, a wewnatrz typu bierze **pierwszy
kwalifikujacy sie heks po (q,r)** i przerywa; `maxItemsPerCity = 1` (ai.ts:1998) daje
jedno ulepszenie na miasto na ture. Nigdzie nie ma pojecia „heks w trakcie" —
petla jest zorganizowana wokol typu, nie wokol pola. Zmiana na model „kompleksowo"
to przebudowa osi tej petli, nie strojenie parametru.

---

## OBOZY vs PASTWISKA — przeslanka KROKU 3 dispatchu tez jest falszywa

Dispatch mowi: „przyczyna sa **wagi** wyboru ulepszen". Zmierzone i sprawdzone w kodzie:

1. **Wag nie ma.** `gra/data/ai-params.json` (139 kluczy) nie zawiera **ani jednego** parametru
   wyboru ulepszen terenu — sa tam trudnosc, archetypy, dyplomacja, ekspansja, barbarzyncy,
   cuda, Ludy Morza. Wpis allowlisty „wagi wyboru ulepszen w ai-params.json" **wskazuje na
   cos, co nie istnieje**.
2. **Funkcja oceny nie istnieje.** Wybor to stala, uporzadkowana lista
   `AI_IMPROVEMENT_PRIORITY` (`auto-improvements.ts:41`): `farma, bydlo, owce, lama, tarasy,
   oboz_lowiecki, …`. Pastwiska stoja na pozycjach **1–3**, oboz na **5** — hodowla juz dzis
   ma **wyzszy** priorytet niz oboz. Zaden wynik liczbowy nie jest porownywany.
3. **Oboz i pastwisko nigdy nie konkuruja o to samo pole.** Pomiar kwalifikacji w turze 0,
   po heksach terytorium, 5 ziaren:

| ziarno | pol pod oboz | pol pod hodowle | **pol pod OBA** | zbudowane obozy | zbudowane pastwiska |
|---|---|---|---|---|---|
| 42    | 50 | 20 | **0** | 31 | 19 |
| 1337  | 39 | 21 | **0** | 33 | 20 |
| 2026  | 35 | 18 | **0** | 35 | 17 |
| 5150  | 27 | 21 | **0** | 24 | 21 |
| 31337 | 31 | 22 | **0** | 28 | 22 |
| **RAZEM** | **182** | **102** | **0** | **151** | **99** |

Zbiory sa **rozlaczne**: oboz wymaga nakladki Las, hodowla wymaga jej BRAKU
(`isLivestockImprovementBlockedOnForest`, decyzja 2026-07-29). Stosunek zbudowanych
**151/99** odwzorowuje stosunek dostepnych pol **182/102** — nie preferencje.
**Strojenie wag nie moze tego zmienic, bo nie ma czego stroic i nie ma konkurencji.**

Zgodnosc harnessu z baza poprzedniego tematu: ziarna 42+1337+2026 daja
**99 obozow / 56 pastwisk** — **dokladnie** liczby z zamknietego
`R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1`. Pomiar jest reprodukowalny.

**PROJEKCJA, NIE POMIAR (§13a — BRAK DOWODU):** nowa regula hodowli („tylko Las + tartak")
przeniosla by hodowle **na te same heksy, co oboz** — z 0 pol wspolnych zrobilaby ~182.
Poniewaz `bydlo/owce/lama` stoja w liscie **przed** `oboz_lowiecki`, hodowla zaczela by
obozy **wypierac** — czyli skarga „zamiast owcy buduje oboz" naprawia sie **sama nowa regula
hodowli**, bez dotykania jakichkolwiek wag. Tej projekcji **nie zmierzylem** — wymaga
implementacji, ktora jest zablokowana przez SPRZECZNOSC #1 (ten sam kod hodowli).

---

## Dlaczego runda 1 nie implementuje

- KROK 1 rozstrzygniety przeciw wyrebowi — dispatch zabrania implementacji wprost.
- Punkt 1 kontraktu (wyrab→farma→trzoda) jest **niewykonalny** razem z nowa regula hodowli;
  wybor wariantu W2–W5 nalezy do wlasciciela, a od niego zalezy KSZTALT petli kompleksowosci.
- Nowa regula hodowli i punkt 1 dotykaja **tego samego** kontraktu
  (`isLivestockImprovementBlockedOnForest` + wpisy `owce`/`bydlo`/`lama`) — implementacja
  jednego przed rozstrzygnieciem drugiego to dokladnie ten blad („cicha zmiana wbrew
  zapisanej decyzji"), przed ktorym ostrzega dispatch.
- Decyzja z 2026-07-29 **nie zostala jeszcze oznaczona jako wycofana** — bo nie wolno jej
  wycofac zanim wiadomo, w jakim ksztalcie. Tresc historyczna nietknieta.

Punkty kontraktu **nieblokowane** (limit 1 tartak + 1 oboz na 10 obywateli; priorytet heksow
z rzeka; „dopiero po rzekach inne tereny") sa gotowe do implementacji w rundzie 2, gdy tylko
wroci decyzja — ich pomiar PRZED juz jest w tabelach wyzej.

---

ZMIANY/COMMIT: `gra/tools/rzeka-farma-wyrab-krok1-measure.cjs` (nowy),
`gra/tools/ai-kompleksowosc-rozgrzebane-measure.cjs` (nowy),
`dyspozycje/autobot/runs/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1/{01-operator.md,krok1-pomiar.txt,kompleksowosc-przed.txt}`.
**Zero zmian w `gra/src/**` i `gra/data/**`.**

TESTY (wszystkie w `timeout`, worktree `/home/user/wt-op-airzeki/gra`):
- `tsc --noEmit` — **0 bledow**.
- Bramki referencyjne: logic **213/213** · tech-tree **19/0** · research **33/33** ·
  unit-replace **13/13** · combat **sanity OK**.
- Bez pogorszenia: auto-improvements-test **45/0** · map-improvement-qualify-test **112/0** ·
  oboz-lowiecki-las-test **91/0** · oboz-lowiecki-evaluator-probe **88/0** ·
  oboz-lowiecki-fc-balans **5/0** · oboz-lowiecki-fc-r2-nowa-sciezka **22/0** ·
  ai-jednostki-tylko-zakup-test **44/0**.
- **CZERWONA, ALE NIE MOJA:** `ai-praca-split-parity-test` **21/1**
  (`FAIL: gracz i AI czytaja udzial ulepszen jako dopelnienie jedynego podzialu`).
  Zweryfikowane: **identyczny 21/1 na czystym `origin/main` d0de8164** — regres istnial przed
  ta galezia. Zglaszam jako zastany, nie zielony. Osobne znalezisko.
- Nowej bramki tematu **nie ma** — nie ma czego pinowac przy zerowej zmianie kodu.
  Dowod nietautologicznosci nowej asercji bedzie w rundzie 2 wraz z implementacja.

BLOKADY:
1. `DECISION_REQUIRED` — KROK 1: wyrab pod farme przy rzece jest **gorszy** od stanu
   dzisiejszego na kazdym terenie. Czy mimo to wycinamy (dla Drewna / dla wygladu mapy)?
2. `DECISION_REQUIRED` — sprzecznosc „wyrab → trzoda wymaga lasu": warianty W2 / W3 / W4 / W5.
3. Znalezisko procesowe: allowlista wskazuje `ai-params.json` „wagi wyboru ulepszen" — takich
   parametrow w tym pliku nie ma. Do korekty w dispatchu, nie przez Operatora.
4. Znalezisko zastane: `ai-praca-split-parity-test` czerwony na `main`.

RUNDY: 1/5
NASTEPNY KROK: Evaluator — weryfikacja liczb i metryki; rownolegle pytanie ABC do wlasciciela
o blokady 1 i 2. Implementacja dopiero w rundzie 2, po decyzji.
DEPLOY/PUSH: NIE WYKONANO

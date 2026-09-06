# P-ROSTER-ZWIADOWCA-DRIFT-DWOCH-FUNKCJI-Q1 — Final Control

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: P-ROSTER-ZWIADOWCA-DRIFT-DWOCH-FUNKCJI-Q1
GOAL: sklad bitwy nie moze zalezec od tego, ktora funkcja go policzono; runda 2 (po
ratyfikacji) — naprawa wadliwego fixture'u bramki, ZERO zmian w `gra/src`.
MODEL+EFFORT: **Opus 5, effort high** · ROLA: Final Control · RUNDA 2/5

IZOLACJA: `/home/user/wt-roster-zwiadowca`, galaz `autobot/P-ROSTER-…-Q1`, HEAD `b96dccb4`.
`git merge-base --is-ancestor fe57a068 HEAD` → TAK; `--is-ancestor 91877f11 HEAD` → TAK.
HEAD dalej niz baza = baza + commity rund, nie `BLOCK`. Drzewo czyste przed i po pracy.
Wszystkie mutacje wykonane w KOPII poza repo (`/home/user/fc-roster-clone/gra`), nigdy
przez `git checkout`. Po calej pracy: `git status --short` PUSTE, `git diff --quiet` czysto,
`md5 gra/src/units/battleRoster.ts` = `f8995d1571fe3f1b5be274c530c2f653`,
`md5 gra/src/units/setup.ts` = `7eaaea0431aa5bc2e2a02b3fec1153a1`,
`diff -rq gra/src` worktree vs klon → identyczne.

---

## PYTANIA SPECYFICZNE — ODPOWIEDZI Z WLASNEGO POMIARU

**1. Czy `git diff fe57a068..HEAD -- gra/src/` jest PUSTE?** **TAK — 0 linii.** To jest twarde
kryterium rundy i jest spelnione. `git diff fe57a068..HEAD --stat` w calym `gra/` wskazuje
JEDEN plik: `gra/tools/map-field-battle-test.cjs`. Zadna asercja nie zostala zazieleniona
zmiana kodu gry, wiec zadna jednostka bojowa nie wypadla po cichu z rosteru — wplyw na balans
bitwy w polu: **zerowy, dowiedziony pustym diffem, nie deklaracja**.

**2. Czy przepisana asercja jest MOCNIEJSZA od starej (zbior ID zamiast licznika)?**
**TAK — dowiedzione wlasna mutacja, inna niz wszystkie z raportow.**
`FC-M5`: w `collectUnitsInRadius` dopisane `if (u.r < 0 && u.id !== anchor.id) continue;` —
ciche zgubienie jednostki bojowej `warrior2` (5,-1) ze skladu bitwy. Wynik:
- bramka **HEAD: 21 ok / 1 fail** — czerwieni `…pozostale trzy jednostki bojowe ZOSTAJA…`,
- bramka **BAZOWA `fe57a068` pod TA SAMA mutacja: 20 ok / 0 fail — CALKOWICIE ZIELONA.**

Stary `length === 2` przepuszczal ciche usuniecie jednostki bojowej ze skladu bitwy. Nowy
zestaw (`!ids.has(scout)` + `size === 3` + trzy imienne `has`) tego nie przepuszcza.
Mutacja **predykatu wykluczania** (`FC-M1`: `isCivilianUnit` przestaje uznawac zwiadowce
za cywila — mutacja w `setup.ts`, warstwa nietykana przez zaden raport) daje **17 ok / 5 fail**
i czerwieni imiennie `collectBattleRoster atk: adjacent scout excluded`. Asercja **zaczerwienic
potrafi** — nie jest tautologia.

**3. Czy asercja parytetu obu funkcji istnieje i dziala?** **TAK.** Istnieje
(`map-field-battle-test.cjs`, etykieta `parytet collectBattleRoster == collectAtkRosterNearCity
(zbior ID, wspolny heks bitwy)`) i **czerwieni sie na trzech niezaleznych mutacjach**:
`FC-M2` (odwrocony filtr wlasciciela) 18/4, `FC-M3` (`collectBattleRoster` mierzy od
`anchor.q + 1`) 20/2, `FC-M6` (`collectAtkRosterNearCity` mierzy od kotwicy zamiast od miasta —
**dokladnie klasa rozjazdu, dla ktorej temat powstal**) 21/1. Bramka **bazowa** pod `FC-M6` daje
19/1, czyli tyle samo co bez mutacji — stary zestaw byl na te klase **slepy**. Wersja parytetu
odrzucona przez Operatora (wspolny OBIEKT kotwicy na heksie miasta) byla dowodowo pusta;
wersja dostarczona (ten sam HEKS bitwy osiagany dwiema roznymi drogami) dziala.

---

## PYTANIA WSPOLNE

**A. Czy ktorakolwiek istniejaca asercja zostala oslabiona, usunieta albo pozbawiona zdolnosci
czerwienienia? — NIE.**
Licznik etykiet asercji, baza `fe57a068` → HEAD `b96dccb4`:

| plik bramki | baza | HEAD | zmiana |
|---|---|---|---|
| `gra/tools/map-field-battle-test.cjs` | 20 | **22** | +2 (dwie DODANE etykiety, zero usunietych) |
| `gra/tools/battle-roster-test.cjs` | 7 | 7 | plik poza diffem |
| `gra/tools/retreat-garnizon-fortyfikacja-test.cjs` | 27 | 27 | plik poza diffem |
| `gra/tools/_tmp-battle-roster-test.cjs` | 7 | 7 | plik poza diffem |

`diff` list etykiet baza↔HEAD zwraca wylacznie dwa `>` (dopisania): `…pozostale trzy jednostki
bojowe ZOSTAJA…` i `parytet…`. Etykieta `collectBattleRoster atk: adjacent scout excluded`
zachowana **bajt w bajt**. Asercja `collectAtkRosterNearCity: adjacent scout excluded`
(`length === 2 && !some`) i `collectBattleRoster: 2 allies dist<=1` — nietkniete wraz z ich
fixture'ami. Wszystkie trzy asercje nowe/przepisane maja udowodniona zdolnosc czerwienienia
(pkt 2 i 3 wyzej). Fixture `farAlly` **dodaje** mierzalnosc gornej granicy promienia, nie odbiera
niczego: `FC-M8` (`radiusFrom > 1` → `> 2`) daje HEAD 21/1, baza 19/1 (slepa).

**B. Czy zakres nie wyciekl poza allowliste? — NIE.**
`git diff fe57a068..HEAD --stat` = 10 plikow:
- `gra/tools/map-field-battle-test.cjs` — allowlista poz. 2 (ratyfikacja rozszerzyla ja
  o przepisanie JEDNEJ asercji; wykonano dokladnie jedno przepisanie),
- 8 plikow w `dyspozycje/autobot/runs/P-ROSTER-…-Q1/` — allowlista poz. 3,
- `dyspozycje/autobot/runs/P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1/00-dispatch.md` — **nie jest
  praca zadnego etapu tego tematu**: pochodzi z commitu orkiestratora `91877f11`
  (`git show --name-only` potwierdza), lezacego miedzy baza a HEAD.

`gra/src/**` — 0 linii. `gra/src/main.ts`, `gra/src/battle/mapFieldBattle.ts`, `docs/decyzje/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/**`, `playbook.json` — nietkniete. `git diff --check`
fe57a068..HEAD czysto. Skan diffu na sekrety/klucze/hasla — zero trafien (§9 poz. 3).
Zaden `git add -A`/`git add .` w historii commitow tematu (kazdy commit dotyka wylacznie
jawnych sciezek).

**C. Czy `tsc --noEmit` i piec bramek referencyjnych sa zielone? — TAK, uruchomione przeze mnie.**
`node ./node_modules/typescript/bin/tsc --noEmit` → **exit 0** (tsc 5.9.3, `gra/node_modules`
symlink obecny). `logic-test` **213/213** · `tech-tree-test` **19/19** · `research-test`
**33/33** · `unit-replace-test` **13/13** · `combat-test` **6/6**. Zadnego `npm run build/dev`
nie uruchomilem (§9 poz. 1).

**D. Czy zostala jakakolwiek czerwona bramka w rodzinie tematu? — NIE.**
Lista z grepu po `battleRoster|collectBattleRoster|collectAtkRosterNearCity|collectDefRosterNearCity`
w `gra/tools/`, uruchomiona w calosci: `map-field-battle-test` **22/22 (exit 0)** ·
`battle-roster-test` **7/7** · `retreat-garnizon-fortyfikacja-test` **27/27** ·
`_tmp-battle-roster-test` **7/7**. Sasiedztwo: `battle-summary-test` **exit 0** ·
`auto-battle-power-test` **14/14** · `entity-card-contract-test` **75/75**.
Zadna bramka rodziny nie jest czerwona, wiec pytanie o usprawiedliwienie pomiarem na czystym
`origin/main` nie ma przedmiotu.

---

## REGULA PRZECIW SAMOOSZUKIWANIU — DZIEWIEC WLASNYCH MUTACJI

Kazda w KOPII poza repo, kazda cofnieta kopia pliku, po kazdej md5 zrodel zgodny z worktree.

| # | mutacja | plik | bramka HEAD | bramka BAZOWA |
|---|---|---|---|---|
| FC-M1 | `isCivilianUnit`: zwiadowca przestaje byc cywilem | `setup.ts` | **17 ok / 5 fail** | — |
| FC-M2 | odwrocony filtr `ownerId` (zostaja OBCY, nie swoi) | `battleRoster.ts` | **18 ok / 4 fail** | — |
| FC-M3 | `collectBattleRoster` mierzy od `anchor.q + 1` | `battleRoster.ts` | **20 ok / 2 fail** | — |
| FC-M4 | `collectAtkRosterNearCity` mierzy od `city.r + 1` | `battleRoster.ts` | **22 ok / 0 fail** | — |
| FC-M5 | ciche zgubienie jednostki bojowej `r < 0` | `battleRoster.ts` | **21 ok / 1 fail** | **20 ok / 0 fail** |
| FC-M6 | `collectAtkRosterNearCity` mierzy od KOTWICY | `battleRoster.ts` | **21 ok / 1 fail** (parytet) | 19 ok / 1 fail (bez zmian = slepa) |
| FC-M7 | dryf SAMEGO `battleHex` (kotwica zamiast miasta) | `battleRoster.ts` | **22 ok / 0 fail** | — |
| FC-M8 | promien `> 1` → `> 2` | `battleRoster.ts` | **21 ok / 1 fail** | 19 ok / 1 fail (slepa) |
| FC-M9 | `return out.slice(0, 2)` (zarzut 1 rundy 1) | `battleRoster.ts` | **21 ok / 1 fail** | **20 ok / 0 fail**, `battle-roster-test` 7/7 |

FC-M5 i FC-M9 to twardy, wlasny dowod, ze przepisana asercja **domknela realna dziure**:
w obu wypadkach CALY dotychczasowy zestaw bramek byl zielony przy cichym ubytku jednostki
bojowej ze skladu bitwy. FC-M4 i FC-M7 to **slepe kierunki**, ktore znalazlem — opisane
w OBSERWACJACH; zadna z nich nie jest wada dostarczonej pracy (`gra/src` nietkniete).

---

## WERDYKTY PER ZARZUT (§3c pkt 3; numeracja stala przez rundy)

| # | Zarzut | Werdykt |
|---|---|---|
| Z1 | Teza „zadna zmiana `gra/src` nie zazieleni obu naraz" jest falszywa (kontrprzyklad `out.slice(0,2)`) | **ODDAL** |
| Z2 | Recon rodziny niepelny — czwarta sciezka (`collectPlaytestBattleRoster`) nie wyklucza cywilow; „zero sladu" nieprawdziwe | **DO DECYZJI CZLOWIEKA** |
| Z3 | Kryteria konca 1 i 3 rundy 1 formalnie niespelnione | **ODDAL** |
| Z4 | Teza o parytecie podana bez warunku, przy ktorym zachodzi | **ODDAL** |
| Z5 | Asercja parytetu slepa na klase rozjazdu, dla ktorej temat powstal | **ODDAL** |
| Z6 | Przepisana asercja bez ograniczenia GORNEGO („nikt poza nim" niesprawdzone) | **ODDAL** |
| Z7 | Nietautologicznosc asercji parytetu nie wykazana zadna mutacja | **ODDAL** |
| Z8 (wlasne) | Parytet slepy na dryf srodka pomiaru miasta w kierunku `+r` | **ODDAL** |
| Z9 (wlasne) | Galaz atakujacego nie czyta `ctx.battleHex` — dryf samego `battleHex` niewykrywalny | **ODDAL** |
| Z10 (wlasne) | `REJESTR-PROSB-I-ZADAN.md:5045` nie odzwierciedla stanu faktycznego (§16b pkt 6) | **ODDAL** wobec wytworu + **WARUNEK INTEGRACJI** |
| Z11 (wlasne) | Jawne odchylenie od doslownego brzmienia ratyfikacji (wspolny OBIEKT kotwicy) | **ODDAL** |
| Z12 (wlasne) | Dla kotwicy POZA heksem miasta obie funkcje zwracaja rozne zbiory — doslowne kryterium 3 rundy 1 vs zakaz zmian `gra/src` | **DO DECYZJI CZLOWIEKA** |

### Uzasadnienia

**Z1 — ODDAL.** Odtworzylem kontrprzyklad (FC-M9): na bramce bazowej `out.slice(0,2)` daje
**20 ok / 0 fail**, `battle-roster-test` 7/7 — teza w brzmieniu uniwersalnym byla falszywa.
Obrona to PRZYJELA i zwezila teze do „zadna zmiana ZGODNA Z KONTRAKTEM rosteru"; dodatkowo
dziura jest **realnie domknieta** przez runde 2: ta sama mutacja na HEAD daje 21/1. Zarzut
trafny, ale naprawiony w tej samej petli i zweryfikowany moim pomiarem — zamkniety.

**Z2 — DO DECYZJI CZLOWIEKA.** Czesc faktograficzna zarzutu jest prawdziwa i zostala przez
obrone przyjeta oraz sprostowana. Potwierdzilem odczytem: `gra/src/main.ts:24288-24293` przy
`playtestWalkaActive` deleguje do `collectPlaytestBattleRoster`
(`gra/src/game/playtestWalkaMapy.ts:113-128`), ktora **w ogole nie wola**
`shouldIncludeInBattleRoster` — sasiadujacy zwiadowca WCHODZI tam do rosteru. To jest realny
przypadek GOAL („sklad bitwy zalezy od tego, ktora funkcja go policzyla"), tylko w czwartej
funkcji rodziny. Czego wytwor NIE rozstrzyga: czy to wyjatek zamierzony. Komentarz
`main.ts:24289` mowi o „klastrze armii (owner-filtered)", o cywilach milczy. Flage ustawia
wylacznie `doStartPlaytestWalkaMapy()` (`main.ts:33740`), wiec normalna gra nie jest dotknieta.
Naprawa lezy w `gra/src/main.ts` — **bezwzglednie zakazanym** w allowliscie tego tematu.
Zgodnie z §3c pkt 3 (brak dowodu rozstrzygajacego w ktorakolwiek strone) — decyzja wlasciciela,
nie zgadywanie Final Control. Nie jest to `NAPRAW`: Operator nie mial prawa tego tknac.

**Z3 — ODDAL.** Obrona obalila dowodem: kryterium 2 rundy 1 przewidywalo `DECISION_REQUIRED`
wprost, C-054 mowi, ze `DECISION_REQUIRED` nie zuzywa rundy, a ratyfikacja `7a19f591`
(zweryfikowana w `00-dispatch.md`, sekcja RATYFIKACJA) **zastapila kryteria 1-3**. Kryteria
zastepcze rundy 2 sa spelnione: 22/22 (kryterium 1), pusty diff `gra/src` (kryterium 2),
mutacja predykatu czerwieni (kryterium 3, moje FC-M1), mutacja usuwajaca `warrior2` czerwieni
nowa asercje (kryterium 4, moje FC-M5).

**Z4 — ODDAL.** Obrona wskazala doslowny cytat; sprawdzilem: `01-operator-runda1.md:46`
zawiera „Parytet juz zachodzi: **dla wspolnej kotwicy na heksie miasta** oba rostery zwracaja
identyczny zbior ID". Warunek byl podany.

**Z5 — ODDAL.** Zarzut byl trafny wobec pierwotnej wersji i zostal PRZYJETY oraz naprawiony
w `b96dccb4`. Zweryfikowalem naprawe wlasna mutacja FC-M6 (`collectAtkRosterNearCity` mierzy
od kotwicy, nie od miasta): **21 ok / 1 fail, czerwieni sie wylacznie parytet**. Konstrukcja
„ten sam HEKS bitwy, dwie rozne drogi" faktycznie usuwa tautologie, ktora miala wersja
„wspolny OBIEKT kotwicy". Dodatkowo FC-M3 (dryf srodka w drugiej funkcji) tez czerwieni parytet.

**Z6 — ODDAL.** Naprawa jest w wytworze i dziala: `atkWithScoutIds.size === 3` plus fixture
`farAlly` (u-far, owner 0, Hastati, `(4,2)` — sprawdzilem: `hexDistance` do kotwicy `(5,0)`
= 2 i do miasta `(6,0)` = 2, czyli DOKLADNIE poza kontraktowym promieniem 1). Moja mutacja
FC-M8 (`> 1` → `> 2`) daje **21 ok / 1 fail**; ta sama mutacja na bramce bazowej: 19/1, czyli
tyle co bez mutacji. Sam czlon `size === 3` bez `farAlly` faktycznie nie mialby czego zlapac —
obrona to nazwala i naprawila oba braki naraz.

**Z7 — ODDAL.** Dowod mutacyjny dla parytetu istnieje i go **niezaleznie odtworzylem**:
FC-M2 (18/4), FC-M3 (20/2), FC-M6 (21/1) — w kazdym wypadku wsrod czerwonych jest parytet.
Straznik `size > 1` nie jest jedynym zabezpieczeniem, jak zarzucano; asercja jest zywa.

**Z8 (wlasne) — ODDAL, z obserwacja.** Mutacja FC-M4 (`collectAtkRosterNearCity` mierzy od
`(city.q, city.r + 1)`) zostawia bramke **22/22 zielona**. Przyczyna: na tym fixturze wymuszenie
kotwicy (`out.unshift(anchor)`, `battleRoster.ts:50-52`) ratuje `u0`, a `u3` byl juz poza
rosterem polowym — oba zbiory schodza sie przypadkiem na `{u-anchor-city, u0, u2}`. To NIE
czyni asercji tautologiczna (czerwieni sie na trzech innych mutacjach) — jedna asercja na
jednym fixturze nie moze pokryc wszystkich kierunkow dryfu. Wada dostarczonej pracy: brak.
Zapisuje jako OBSERWACJE do rejestru.

**Z9 (wlasne) — ODDAL, z obserwacja.** `shouldIncludeInBattleRoster` w galezi atakujacego
(`battleRoster.ts:30`) zwraca `u.id === ctx.anchor.id` i **nigdy nie czyta `ctx.battleHex`**.
Mutacja FC-M7 (podmiana `battleHex` w `collectAtkRosterNearCity` z miasta na kotwice, przy
niezmienionym dystansie) daje **22/22 zielone** — pole jest dla sciezki atakujacego martwe,
wiec zaden zestaw asercji tego nie zlapie. To fakt o `gra/src`, nietkniete w tym temacie;
obalona hipoteza RECON dispatchu ma tu swoje zrodlo. OBSERWACJA do rejestru.

**Z10 (wlasne) — ODDAL wobec wytworu, ale WARUNEK INTEGRACJI.** §16b pkt 6 wypada negatywnie:
`dyspozycje/REJESTR-PROSB-I-ZADAN.md:5045` nadal glosi (a) `STATUS: ZAREJESTROWANE, NIE
DISPATCHOWANE`, mimo ze temat przeszedl dwie rundy z ratyfikacja, oraz (b) obalona teze
merytoryczna „`collectBattleRoster` **nie wyklucza** sasiadujacego zwiadowcy… dwie funkcje…
rozjechaly sie w jednym warunku" wraz z zakresem „zrownac warunek wykluczania zwiadowcy w obu
funkcjach". Runda 1 udowodnila, ze rozjazdu nie ma, a orkiestrator to **sam ratyfikowal**
(„Zgloszenie w rejestrze (moje) bylo bledne"). Wobec wytworu Operatora: `ODDAL` — plik jest
**poza allowlista** tematu, Operator nie mial prawa go tknac i slusznie nie tknal. Pozostawienie
tego wpisu bez korekty odtworzy ten sam falszywy temat za pol roku. **Do wykonania recznie przez
orkiestratora przed integracja**, jako czesc tej samej fali.

**Z11 (wlasne) — ODDAL.** Obrona jawnie zadeklarowala odejscie od doslownego brzmienia
ratyfikacji („wspolna kotwica na heksie miasta") i zachowala jej **cel** („zeby funkcje nie
rozjechaly sie w przyszlosci"). Doslowna forma byla dowodowo pusta — potwierdzam wlasnym
pomiarem: przy jednej kotwicy stojacej na heksie miasta `battleHex == kotwica == miasto`, wiec
oba wyrazenia dystansu sa tym samym wyrazeniem. Odchylenie jest zadeklarowane, uzasadnione
dowodem z wytworu i poprawia asercje. Liczba asercji bez zmian (22), zakres bez zmian.

**Z12 (wlasne) — DO DECYZJI CZLOWIEKA.** Dla kotwicy POZA heksem miasta obie funkcje zwracaja
rozne zbiory (zmierzone na fixturze bramki: field `["u-anchor-city","u0","u2","u3"]` vs city
`["u-anchor-city","u0","u2"]`). Doslowne brzmienie kryterium 3 rundy 1 („dla tego samego ukladu
jednostek… ten sam zbior ID") wymagaloby zrownania funkcji, czyli **zmiany `gra/src` zakazanej
w rundzie 2** i realnej zmiany balansu. Argument przeciwny jest rownie mocny: bitwa w polu toczy
sie na heksie kotwicy, a bitwa o miasto na heksie miasta — to sa rozne miejsca starcia i roznica
moze byc z definicji poprawna. Wytwor tego nie rozstrzyga; asercja parytetu swiadomie tej kwestii
nie przesadza i mowi o tym w komentarzu. §3c pkt 3: brak dowodu w ktorakolwiek strone.

---

## CHECKLISTA §16b

1. `00-dispatch.md` istnieje; `GOAL` nie zmienil sie — zwezenie zakresu rundy 2 („naprawa
   fixture'u, nie kodu") jest jawna ratyfikacja orkiestratora w tym samym pliku, nie cicha
   podmiana celu. **OK.**
2. ID `P-ROSTER-ZWIADOWCA-DRIFT-DWOCH-FUNKCJI-Q1` identyczne we wszystkich siedmiu raportach
   i we wszystkich commitach. **OK.**
3. Kazdy z siedmiu zarzutow ma odpowiedz Obrony (4 z rundy 1, 3 z rundy 2) i werdykt wyzej.
   **OK.**
4. `PASS-WITH-NOTES` Evaluatora nie ukryl niczego o GOAL/dowodzie/zakresie/§9 — przeciwnie,
   Z5-Z7 byly trafne i wymusily realne wzmocnienie bramki. Uwagi kosmetyczne (limit slow)
   odnotowane nizej. **OK.**
5. Licznik rund: runda 1 zakonczona `DECISION_REQUIRED` (C-054 — nie zuzywa rundy), runda 2
   oznaczona `2/5` we wszystkich raportach; Obrona liczona jako II faza tej samej rundy, nie
   osobna runda. **Bez cichego resetu. OK.**
6. `REJESTR-PROSB-I-ZADAN.md` — **NIE odzwierciedla stanu faktycznego**, patrz Z10.
7. Temat niedzielony na wezly — nie dotyczy.
8. Agregat: **zero `NAPRAW`**, dwa `DO DECYZJI CZLOWIEKA` (Z2, Z12) → **`DECISION_REQUIRED`**.
   Temat NIE wraca do Operatora; do wlasciciela ida wylacznie te dwie pozycje, reszta stoi
   gotowa do integracji po jego odpowiedzi.

---

## DO DECYZJI WLASCICIELA — DWIE POZYCJE

**(Z2) Tryb playtest liczy sklad bitwy inna funkcja, bez wykluczania cywilow.**
`collectPlaytestBattleRoster` (`gra/src/game/playtestWalkaMapy.ts:113-128`) nie wola
`shouldIncludeInBattleRoster` — sasiadujacy zwiadowca wchodzi do rosteru; w normalnej grze
nie wchodzi. Flaga zapalana wylacznie przez `doStartPlaytestWalkaMapy()` (`main.ts:33740`).
Pytanie: **akceptowany wyjatek dla playtestu, czy defekt do osobnego tematu?** Naprawa wymaga
`gra/src/main.ts`, wiec i tak osobnego tematu z wlasna allowlista.

**(Z12) Czy `collectBattleRoster` i `collectAtkRosterNearCity` maja zwracac ten sam zbior takze
dla kotwicy stojacej OBOK miasta?** Dzis nie zwracaja i asercja parytetu tego nie przesadza.
Zrownanie = zmiana skladu bitwy, czyli balansu — wymaga decyzji, nie „naprawy testu".

## OBSERWACJE (do rejestru orkiestratora, NIE naprawiane w tym temacie)

1. `gra/tools/_tmp-battle-roster-test.cjs` — zacommitowany plik roboczy udajacy bramke;
   uruchomilem: 7/7, ale pisze bundle pod STALA nazwa (klasa bledu z C-001).
2. `collectDefRosterNearCity` (`battleRoster.ts:120-128`) nie filtruje po `ownerId`; kompensuja
   to oba wywolania (`siegeDefenders.ts:16`, `main.ts:25593`) — kruche, dzis dziala.
3. Asercja `map-field-battle-test.cjs:155` (baza) byla wadliwa kopia `battle-roster-test.cjs:105-109`
   — ta sama regula, poprawny fixture, zielona. Kopiowanie asercji bez fixture'u to tryb bledu.
4. Galaz atakujacego nie czyta `ctx.battleHex` — dryf samego pola jest niewykrywalny (Z9, FC-M7).
5. Parytet jest slepy na dryf srodka pomiaru miasta w kierunku `+r` (Z8, FC-M4) — wymusilaby to
   dopiero jednostka lamiaca przypadkowa symetrie fixture'u.
6. `battle-roster-test.cjs:166` `'city atk roster: anchor is always first'` — zarzut
   tautologicznosci podniesiony w rundzie 1; plik poza allowlista tego tematu, do osobnego zapisu.
7. `REJESTR-PROSB-I-ZADAN.md:5045` — Z10, warunek integracji.
8. Limit ok. 400 slow (§GRANICE) przekroczony w czterech raportach: 578 / 439 / 764 / 584.
   Kosmetyczne, odnotowane zamiast przemilczane.

## ZMIANY-COMMIT

Wylacznie ten plik:
`dyspozycje/autobot/runs/P-ROSTER-ZWIADOWCA-DRIFT-DWOCH-FUNKCJI-Q1/09-final-control.md`,
dodany `git add` po jawnej sciezce (C-008, §9 poz. 2). `gra/**` — ZERO zmian z mojej strony.

## TESTY

Wszystkie uruchomione przeze mnie w `/home/user/wt-roster-zwiadowca/gra`:
`tsc --noEmit` exit 0 (5.9.3) · `map-field-battle-test` **22/22** · `logic-test` **213/213** ·
`tech-tree-test` **19/19** · `research-test` **33/33** · `unit-replace-test` **13/13** ·
`combat-test` **6/6** · `battle-roster-test` **7/7** · `retreat-garnizon-fortyfikacja-test`
**27/27** · `battle-summary-test` exit 0 · `auto-battle-power-test` **14/14** ·
`entity-card-contract-test` **75/75** · `_tmp-battle-roster-test` **7/7**.
Dziewiec mutacji FC-M1…FC-M9 — w kopii poza repo, wyniki w tabeli wyzej.

## BLOKADY

Brak wlasnych. Dwie pozycje `DO DECYZJI CZLOWIEKA` (Z2, Z12) czekaja na wlasciciela.
Jeden warunek do wykonania przez orkiestratora przed integracja (Z10, rejestr).

RUNDY: 2/5
NASTEPNY KROK: decyzja wlasciciela w sprawie Z2 i Z12; rownolegle korekta wpisu rejestru (Z10)
reka orkiestratora. Po odpowiedzi — integracja allowlist-only (jeden plik `gra/`), nie wczesniej.
DEPLOY/PUSH: NIE WYKONANO

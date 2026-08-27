# 02 — EVALUATOR (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-AI-WYRAB-PRZY-RZECE-FARMY-Q1
MODEL+EFFORT: Opus 5, effort high
GOAL: weryfikacja rundy 1 Operatora — kazdy pomiar wlasna reka, wlasne ziarna + jedno jego.
GALAZ: `autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1`, worktree `/home/user/wt-ev-airzeki`.
Narzedzie Evaluatora: `gra/tools/ev-rzeka-slad-czasowy-measure.cjs` (nowe, moje).
Surowy log: `ev-pomiar-slad-czasowy.txt`.
Ziarna Evaluatora: **7, 99, 512, 4242** + **1337** (jedno ziarno Operatora, kontrola krzyzowa).
Harness 1:1 z `oboz-lowiecki-ai-40tur-measure.cjs`: mapa 36x28 „kontynenty", 3 miasta, promien 4,
pop 6, `maxItemsPerCity=1`, 40 tur.

**WERDYKT: wnioski Operatora sie bronia; jego GLOWNA METRYKA — nie.**
Werdykt `DECISION_REQUIRED` podtrzymuje. Trzy poprawki obowiazkowe przed runda 2 nizej.

---

## 1. KROK 1 — odtworzony moja reka, zgadza sie co do jednostki

Wlasny bundle `tileYield` + `isFarmBaseTerrain` (nie jego skrypt). Heks rzeka+Las, plon/ture:

| Teren | (a) las+farma | (b) wyrab+farma | (W2) las+farma+tartak | (b) LEGALNA? |
|---|---|---|---|---|
| Laka | zyw 8 · praca 9 · handel 10 · drewno 15 | zyw 9 · praca 6 · handel 8 · drewno 0 | zyw 8 · praca **12** · handel **13** · drewno 15 | tak |
| Rownina | zyw 7 · praca 10 · handel 9 · drewno 20 | zyw 8 · praca 7 · handel 7 · drewno 5 | zyw 7 · praca **13** · handel **12** · drewno 20 | tak |
| Wzgorza | zyw 6 · praca 11 · handel 8 · drewno 20 | zyw 7 · praca 8 · handel 6 · drewno 5 | zyw 6 · praca **14** · handel **11** · drewno 20 | **NIE** |

DELTA (b)−(a) = zyw +1, praca −3, handel −2, drewno −15 na kazdym terenie — **identycznie jak
u Operatora**. (a) wygrywa.

**NOTA 1 (defekt raportu, wniosek mimo to sie utrzymuje).** `isFarmBaseTerrain(Wzgorza, Brak)
= false`: na Wzgorzach po wyrebie farmy **nie da sie postawic w ogole**. Wiersz „Wzgorza (b)"
w tabeli Operatora opisuje stan, ktorego gra nie dopuszcza. Operator wydrukowal te flage
w surowym logu, ale nie oznaczyl wiersza w raporcie. Sprawa realna: ziarno 42 ma 1 taki heks.

**DODATEK MOJ (Operator tego nie policzyl):** wariant **W2** (las zostaje + farma + tartak)
bije (b) w kazdej kolumnie poza zywnoscia: +6 pracy, +5 handlu, +15 drewna na Lace.
To liczbowe wsparcie dla jego rekomendacji W2, ktorej on bronil tylko jakosciowo.

---

## 2. METRYKA KOMPLEKSOWOSCI — **ZDEGENEROWANA, do wymiany** (najwazniejsze znalezisko)

Metryka Operatora: heks „rozgrzebany" = tkniety + `buildImprovementQualifier` dopuszcza
jeszcze cokolwiek z `AI_IMPROVEMENT_PRIORITY`.

Odtworzylem ja na SWOICH ziarnach: **338/338 tknietych = 100%**, tak samo jak jego 357/357.
Reprodukowalna — i **bezuzyteczna**. Powod (moja diagnoza, ktorej on nie zrobil): policzylem,
KTORY klucz trzyma heks otwarty. 5 ziaren x 40 tur:

| klucz trzymajacy heks „otwarty" | na ilu heksach | ile AI ich zbudowalo w 40 turach |
|---|---|---|
| posterunek | 286 | **0** |
| fort | 286 | **0** |
| tartak | 183 | **0** |
| warzelnia_soli | 68 | **0** |
| droga | 39 | **0** |
| glinianka | 29 | **0** |

**`posterunek` i `fort` kwalifikuja sie praktycznie wszedzie i AI nie buduje ich NIGDY.**
Kazdy tkniety heks jest wiec „rozgrzebany" na zawsze, niezaleznie od zachowania AI.
Metryka jest przypieta do 100% z konstrukcji: nie moze zejsc do zera, a jesli w rundzie 2
spadnie, spadnie z powodu niezwiazanego z „15 heksami naraz". Po wyjeciu infrastruktury
(droga/droga_brukowana/posterunek/fort) daje **254/338 = 75%** — nadal nie mierzy skargi.
To dokladnie pulapka z §REGULA PRZECIW SAMOOSZUKIWANIU dispatchu.

### METRYKA EVALUATORA (niezalezna) — E1 i E2

**E1 „heksy w toku rownolegle":** heks jest W TOKU w turze T, jesli dostal pierwsze ulepszenie
w turze ≤ T i dostanie kolejne w turze > T. Czyta wylacznie to, co AI FAKTYCZNIE zrobilo —
nie to, co bylo dozwolone. Doslowne „robi 15 heksow naraz". Idealna kompleksowosc: ≤ 3 (liczba miast).

**E2 „rozpietosc heksa":** dla heksow z ≥2 ulepszeniami — ile tur miedzy pierwszym a ostatnim
i ile INNYCH heksow AI tknelo w tym czasie.

PRZED, 5 ziaren x 40 tur, 120 ulepszen na ziarno:

| ziarno | E1 max | E1 srednia | E2 heksow ≥2 ulepszen | E2 srednia rozpietosc | E2 srednio obcych heksow w miedzyczasie | metryka Operatora |
|---|---|---|---|---|---|---|
| 7 | 40 | 22,4 | 52 | 17,3 tur | 42,4 | 68/68 |
| 99 | 47 | 27,5 | 56 | 19,6 tur | 49,2 | 64/64 |
| 512 | **50** | 25,7 | 54 | 19,0 tur | 46,7 | 66/66 |
| 4242 | 35 | 19,1 | 48 | 16,0 tur | 37,6 | 72/72 |
| 1337 | 41 | 23,4 | 52 | 18,0 tur | 42,9 | 68/68 |
| **RAZEM** | **max 50** | — | 262 | ~18,0 tur | ~43,8 | **338/338** |

**Skarga wlasciciela potwierdzona liczbowo i BEZ degeneracji: AI trzyma otwartych srednio
19–27 heksow naraz, szczytowo 50 — nie 15. Heks z dwoma ulepszeniami czeka srednio 18 tur,
a AI dotyka w tym czasie ~44 innych heksow.** E1 ma sens zejscia do 3 i jest falsyfikowalna.
Uwaga metodyczna: E1 „na koniec" = 0 z konstrukcji (po ostatniej turze nie ma juz zdarzen) —
znaczace sa `max` i `srednia`, nie wartosc koncowa.

**Porownanie obu metryk:** metryka Operatora daje 100% na kazdym ziarnie i nie rozroznia ziaren.
E1 rozroznia (35…50) i koreluje z E2. Wniosek: **metryka Operatora do odrzucenia, E1+E2
jako baza PRZED dla kryterium 1.**

---

## 3. SLAD CZASOWY heksow z rzeka (punkt c zadania) — AI **nie konczy** heksa

Pelne ciagi, ziarno 1337 (pierwsze 8 heksow z rzeka tknietych przez AI):

```
12,7 [Las] : farma@t24
12,8 [Las] : farma@t25
12,9       : farma@t26 -> bydlo@t33
4,5  [Las] : farma@t0  -> oboz_lowiecki@t14
5,4  [Las] : farma@t2  -> oboz_lowiecki@t16
5,5  [Las] : farma@t3  -> oboz_lowiecki@t17
6,4  [Las] : farma@t5  -> oboz_lowiecki@t20
6,5  [Las] : farma@t6  -> oboz_lowiecki@t21
```

Ziarno 99: `4,5 farma@t0 -> oboz@t20`, `5,6 farma@t1 -> oboz@t24`, `6,20 farma@t5 -> bydlo@t26`.
Ziarno 4242: `4,19 farma@t0 -> oboz@t24`, `10,10 farma@t18 -> bydlo@t27`.

**Odpowiedz na pytanie c: NIE.** AI stawia farme, znika na **14–20 tur** i ~44 obce heksy,
potem wraca po drugie ulepszenie. Ani jeden heks nie jest domkniety w jednym ciagu.

**`wyrab@` nie pojawia sie ANI RAZ na 5 ziarnach x 40 tur (wyrab=0).** AI dzis w ogole nie
karczuje — `wyrab` stoi na koncu `AI_IMPROVEMENT_PRIORITY` (poz. 21/21) i lista nigdy
tam nie dochodzi. Potwierdza baze KROKU 1 od drugiej strony.

---

## 4. KONTROLA ODWROTNA (punkt d) — nie ma czego zaglodzic, juz jest zero

Liczby zbudowanych ulepszen, 5 ziaren x 40 tur (120 ulepszen/ziarno):

| klucz | 7 | 99 | 512 | 4242 | 1337 |
|---|---|---|---|---|---|
| farma + hodowla + oboz_lowiecki + lodzie_rybackie | 120 | 120 | 120 | 120 | 120 |
| droga · droga_brukowana · posterunek · fort | 0 | 0 | 0 | 0 | 0 |
| kopalnia_miedzi · _zelaza · _cyny · kamieniolom · glinianka | 0 | 0 | 0 | 0 | 0 |
| **tartak** | **0** | **0** | **0** | **0** | **0** |
| irygacja · tarasy · stadnina · warzelnia_soli · wyrab | 0 | 0 | 0 | 0 | 0 |

**AI dzis nie buduje ani jednej drogi, kopalni, tartaku, irygacji.** Ryzyko „priorytet rzek
zaglodzi reszte" jest bezprzedmiotowe — reszta jest zaglodzona do zera JUZ TERAZ, bo petla
`pickAutoImprovements` iteruje po TYPACH, a `maxItemsPerCity=1` x 40 tur zuzywa caly budzet
na 4 pierwsze pozycje listy. Diagnoza strukturalna Operatora potwierdzona; jest ostrzejsza
niz on napisal. `tartak` kwalifikuje sie na 183 heksach i nie jest wybrany ani razu —
to glodzenie kolejnoscia, nie brak kwalifikacji.

---

## 5. LIMIT „jeden tartak i jeden oboz na 10 obywateli" (punkt e) — pomiar PRZED

Miasta pop 6 → limit `ceil(6/10) = 1` tartaku i 1 obozu na miasto.

| ziarno | c0 (tartak/oboz) | c1 | c2 | limit |
|---|---|---|---|---|
| 7 | 0 / 13 | 0 / 12 | 0 / 5 | 1 / 1 |
| 99 | 0 / **18** | 0 / 9 | 0 / 3 | 1 / 1 |
| 512 | 0 / 13 | 0 / 14 | 0 / 12 | 1 / 1 |
| 4242 | 0 / 11 | 0 / 11 | 0 / 9 | 1 / 1 |
| 1337 | 0 / **17** | 0 / 10 | 0 / 6 | 1 / 1 |

**Limit obozow przekroczony 3–18x w kazdym miescie na kazdym ziarnie. Limit tartakow
spelniony trywialnie (0), ale w zly sposob — kontrakt mowi „kazde miasto MA jeden tartak",
a AI nie buduje zadnego.** To jest liczba PRZED dla kryterium 4.

---

## 6. NOWA REGULA HODOWLI (punkt f) — **BRAK DOWODU + kontrpomiar do projekcji Operatora**

Regula nie jest zaimplementowana (zero zmian w `gra/src`, potwierdzone `git show --stat`),
wiec pomiaru „gracz / automat / AI osobno" **wykonac sie nie da**. Zglaszam jako **BRAK DOWODU
(§13a)**, nie jako zielone. Odnotowuje, ze `stripImprovementsWhenForestRemoved` +
`FOREST_DEPENDENT_IMPROVEMENT_KEYS` (`improvement-build.ts:184-190`) z zamknietego tematu
obozu sa nietkniete — Operator ich nie cofnal.

**Kontrpomiar do jego projekcji.** Operator napisal, ze nowa regula hodowli „naprawia skarge
sama, bez dotykania wag", bo hodowla stanelaby na tych samych polach co oboz i wyparla go
z listy. **Moj pomiar temu przeczy przy niezmienionym pickerze:**

- dzisiejsze pastwiska stoja wylacznie na heksach BEZ lasu (regula 2026-07-29): 103 sztuki
  na 5 moich ziarnach;
- nowa regula wymaga `Las` + `tartak` **na tym samym heksie**;
- **AI buduje 0 tartakow** (tabela §4, wszystkie ziarna).

Wiec przy samej zmianie reguly, bez przebudowy kolejnosci: pastwiska **103 → 0**, obozy
**163 bez zmiany**. Stosunek oboz:pastwisko pogorszylby sie z 163:103 do 163:0 — **odwrotnie
niz projektowal Operator**. Nowa regula hodowli jest wykonalna WYLACZNIE razem z wymuszeniem
tartaku, czyli razem z przebudowa petli na model „kompleksowo". To trzeba powiedziec
wlascicielowi przy wariantach W2–W5.

---

## 7. OBOZY vs PASTWISKA — potwierdzone, w tym kontrola krzyzowa

Moje ziarna, 40 tur: oboz **163** / pastwiska **103** (7: 30/23 · 99: 30/26 · 512: 39/15 ·
4242: 31/19 · 1337: 33/20). Farmy na heksach z rzeka: **64**.

**Kontrola krzyzowa na wspolnym ziarnie 1337:** ja `oboz=33 pastwiska=20 farmy_przy_rzece=17`
— **identycznie** jak Operator (33 / 20 / 17). Harness i liczby Operatora sa reprodukowalne.

Heksy z rzeka w terytorium / tkniete przez AI / z farma: 7: 16/16/15 · 99: 14/14/14 · 512: 0/0/0 · 4242: 21/18/18 · 1337: 20/17/17.
Ziarno 512 ma **0 heksow z rzeka w terytorium** — temat jest silnie zalezny od ziarna;
kryterium 2 („farmy przy rzece maja wzrosnac") wymaga ziaren z rzekami w zasiegu miast.

`ai-params.json`: potwierdzam — **zadnej** wagi wyboru ulepszen. Wszystkie trafienia na
„oboz" to `barbarzyncy_*_obozy` i `ludy_morza_max_obozy` (obozy barbarzynskie, nie ulepszenie).
Zbior pol pod oboz i pod hodowle jest rozlaczny z definicji (oboz wymaga `Las`, hodowla
jego braku) — 0 pol wspolnych potwierdzam.

**NOTA 2 (drobne rozjazdy liczbowe w raporcie Operatora):** `ai-params.json` ma **136** kluczy
najwyzszego poziomu, nie 139. `terrain-improvements.json` ma **24** klucze, nie 22.
Wnioskow nie zmienia, ale to liczby w raporcie, ktore nie odtwarzaja sie.

**NOTA 3:** „farmy plus przodek" = `bydlo` („Trzoda") — potwierdzam wobec danych:
klucza `przodek` nie ma (0 trafien), `bydlo.nazwa = "Trzoda"`, `bydlo.warunek` zawiera
„+ farma lub solo". Zaden z 24 kluczy nie jest blizszym kandydatem. Nie jest to `DECISION_REQUIRED`.

---

## 8. MUTACJE (punkt g)

Operator **nie dodal zadnej asercji ani bramki** (`git show --stat b0baa13a 8f6444c6`:
wylacznie `gra/tools/*` i raporty runu). Nie ma wiec czego mutowac — potwierdzam jego wlasne
zdanie „BRAK DOWODU, nie zielone" dla kryterium 5. Zamiast mutacji zrobilem test mocniejszy:
**odtworzylem jego metryke niezaleznym kodem i pokazalem, ze jest przypieta do 100% z konstrukcji**
(§2) — czyli nie ma stanu swiata, w ktorym by sczerwieniala.

---

## TESTY (wszystkie w `timeout`, worktree `/home/user/wt-ev-airzeki/gra`, moja reka)

- `tsc --noEmit` — **0 bledow** (exit 0).
- Bramki referencyjne: logic **213/213** · tech-tree **19 pass / 0 fail** · research **33/33** ·
  unit-replace **13/13** (exit 0) · combat **6/6**.
- Bez pogorszenia: auto-improvements **45 passed / 0 failed** · map-improvement-qualify **112/0** ·
  oboz-lowiecki-las **91/0** · oboz-lowiecki-evaluator-probe **88/0** · oboz-lowiecki-fc-balans **5/0** ·
  oboz-lowiecki-fc-r2-nowa-sciezka **22/0** · ai-jednostki-tylko-zakup **44/0**.
  Bramki obozu („oboz tylko w lesie") nietkniete — zmian w kodzie nie ma.
- `ai-praca-split-parity-test` — **21 passed / 1 failed** (`FAIL: gracz i AI czytaja udzial
  ulepszen jako dopelnienie jedynego podzialu`). **Zweryfikowane moja reka na czystym
  `origin/main` d0de8164: identyczne 21/1.** Regres ZASTANY, nie z tej galezi. Nie zielone.
- **Build kanon C-001:** `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-ev
  --emptyOutDir` — **PRZESZEDL**, 848 modulow, `index.html` 37 415,20 kB, 32,44 s, exit 0.
- Nowej bramki tematu nadal brak — przy zerowej zmianie kodu nie ma czego pinowac. BRAK DOWODU.

## BLOKADY (podtrzymane + moje)

1. `DECISION_REQUIRED` Operatora #1 (wyrab gorszy od stanu dzisiejszego) — **potwierdzam liczbami**.
   Uzupelnienie: na Wzgorzach wariant (b) jest nie tylko gorszy, ale **nielegalny**.
2. `DECISION_REQUIRED` Operatora #2 (sprzecznosc wyrab/trzoda, W2–W5) — **potwierdzam**.
   Uzupelnienie do przekazania wlascicielowi: W2 wygrywa takze liczbowo (§1), a KAZDY wariant
   z nowa regula hodowli wymaga, zeby AI zaczelo budowac tartaki — dzis buduje ich 0 (§6).
3. Metryka kompleksowosci Operatora **zdegenerowana** — do zastapienia przez E1+E2 (§2).
   To korekta obowiazkowa, nie sugestia: kryterium 1 dispatchu jest na niej oparte.
4. Znalezisko procesowe Operatora (allowlista wskazuje nieistniejace wagi w `ai-params.json`)
   — **potwierdzam**; do korekty w dispatchu przez orkiestratora.
5. Regres zastany `ai-praca-split-parity-test` 21/1 na `main` — potwierdzam wlasnym przebiegiem.

## POPRAWKI OBOWIAZKOWE PRZED RUNDA 2

1. Kryterium 1 mierzyc metryka **E1 (heksy w toku rownolegle)** — PRZED: max 50, srednia 19–27;
   cel: ≤ liczba miast. Metryki „rozgrzebanych" Operatora **nie uzywac** jako kryterium sukcesu.
2. Wiersz „Wzgorza (b)" oznaczyc jako **stan niedostepny** (`isFarmBaseTerrain(Wzgorza, Brak)=false`).
3. Projekcje z §„obozy vs pastwiska" Operatora (hodowla wyprze obozy sama) **skorygowac** —
   przy 0 tartakow daje skutek odwrotny (§6).
4. Poprawic liczniki: `ai-params.json` 136 kluczy, `terrain-improvements.json` 24 klucze.

ZMIANY/COMMIT: `gra/tools/ev-rzeka-slad-czasowy-measure.cjs` (nowy),
`dyspozycje/autobot/runs/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1/{02-evaluator.md,ev-pomiar-slad-czasowy.txt}`.
**Zero zmian w `gra/src/**` i `gra/data/**`.** Allowlista dotrzymana (`gra/tools/*` + raporty runu).

RUNDY: 1/5
NASTEPNY KROK: Final Control (worktree `/home/user/wt-ev-airzeki` zostawiony);
rownolegle ABC do wlasciciela o blokady 1–2 z uzupelnieniem z §1 i §6.
DEPLOY/PUSH: NIE WYKONANO

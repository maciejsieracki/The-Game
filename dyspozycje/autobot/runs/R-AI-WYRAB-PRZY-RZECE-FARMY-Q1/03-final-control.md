# 03 — FINAL CONTROL (runda 1)

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: `R-AI-WYRAB-PRZY-RZECE-FARMY-Q1`
GOAL: rozstrzygnac gotowosc do integracji rundy 1. Priorytet: czy wlasciciel dostal to,
o co prosil („jeden heks do konca, potem nastepny", priorytet rzek).
MODEL+EFFORT: Opus 5, effort high.
RUNDA: 1/5
DEPLOY/PUSH: NIE WYKONANO (push wylacznie na galaz tematu; `main` nietkniety)

---

## 1. Stan Gita — zweryfikowany wlasna reka

`git fetch` wykonany. Galaz `origin/autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1`:

| SHA | co |
|---|---|
| `623cab6b` | szkielet raportu Operatora |
| `8f6444c6` | KROK 1: narzedzie pomiarowe + wynik |
| `b0baa13a` | Operator runda 1 — DECISION_REQUIRED |
| `34e12139` | szkielet raportu Evaluatora |
| `153a4a00` | Evaluator runda 1 — PASS-WITH-NOTES |
| `1abfe90e` | Evaluator: korekta wierszy ziarna 7 |
| `6e5d2287` | **ten raport (szkielet), moja reka** |

Baza: `origin/main` = `d0de8164`. `git diff --stat origin/main...HEAD` = **8 plikow, +1324, −0**:
wylacznie `gra/tools/*.cjs` (3 narzedzia pomiarowe) i raporty runu.
**Zero zmian w `gra/src/**` i `gra/data/**`.** Allowlista dotrzymana z zapasem.
Probny merge: `git merge-tree --write-tree origin/main HEAD` → `50f342a9…`, exit 0,
**bez konfliktow**. Praca JEST w commitach, nie w brudnym drzewie.

## 2. Bramki — moja reka, kazde wywolanie w `timeout`, worktree `/home/user/wt-fc-airzeki`

`tsc --noEmit` **0** · logic **213/213** · tech-tree **19/0** · research **33/33** ·
unit-replace **13/13** · combat **6/6** · auto-improvements **45/0** ·
map-improvement-qualify **112/0** · **oboz-lowiecki-las 91/0** ·
**oboz-lowiecki-evaluator-probe 88/0** · **oboz-lowiecki-fc-balans 5/0** ·
**oboz-lowiecki-fc-r2-nowa-sciezka 22/0** · ai-jednostki-tylko-zakup **44/0**.
Bramki obozu lowieckiego — wszystkie cztery zielone, nic ich nie rusza (bo nic nie ruszono w kodzie).

`ai-praca-split-parity-test` **21/1 — CZERWONY**. Zweryfikowane moja reka na czystym
`origin/main` `d0de8164` (worktree `/home/user/The-Game`): **identyczne 21/1**.
Regres **zastany**, nie wniesiony przez ten temat. Zgodnie z §13a: **BRAK DOWODU**, nie zielone.

**Nowej bramki tematu BRAK** — przy zerowej zmianie kodu nie ma czego pinowac.
Kryterium sukcesu nr 5 dispatchu: **niespelnione (BRAK DOWODU)**.

## 3. RZECZ, KTOREJ NIE ZROBILI TAMCI DWAJ — kronika jednej gry

Operator dal agregat 357/357. Evaluator dal agregat E1 max 50. **Agregat mozna poprawic
nie zmieniajac zachowania.** Wlasciciel prosil o coś innego, wiec zrobilem coś innego:
surowa kronike JEDNEJ gry, tura po turze, ze wspolrzednymi.
Narzedzie: `gra/tools/fc-kronika-jednej-gry.cjs`, wyjscie: `fc-kronika-1337.txt`
(harness 1:1 z `oboz-lowiecki-ai-40tur-measure.cjs`: mapa 36×28 „kontynenty", 3 miasta,
promien 4, pop 6, `maxItemsPerCity=1`, 40 tur).

**Ziarno 1337, miasta c0(4,5) c1(4,19) c2(8,11), 157 heksow terytorium, 20 z rzeka.**
Kronika w skrocie — to, co zobaczylby wlasciciel:

```
t 0: c0 (4,5) farma [RZEKA][LAS] · c1 (4,19) farma [LAS] · c0 (5,7) farma [LAS]
t 1: c0 (4,6) farma · c1 (4,20) farma · c1 (5,18) farma
…      (tury 0–26: 58 farm na 58 ROZNYCH heksach, ani jeden heks domkniety)
t14: c0 (4,5) oboz_lowiecki  ← powrot na heks z tury 0, PO 14 turach
t19: c1 (4,22) bydlo         ← powrot na heks z tury 3, PO 16 turach
t30: c1 (4,19) oboz_lowiecki ← powrot na heks z tury 0, PO 30 turach
t33: c1 (5,18) oboz_lowiecki ← powrot na heks z tury 1, PO 32 turach
t31–39: c0 juz tylko lodzie_rybackie (1,5)…(2,7) — skonczyly sie pola
```

**ZYCIORYS HEKSA — 52 heksy z ≥2 ulepszeniami, srednia rozpietosc 18,0 tur,
srednio 42,9 OBCYCH heksow tknietych w przerwie.** Najgorsze:

| heks | slad | rozpietosc | obcych heksow w przerwie |
|---|---|---|---|
| (5,18) | farma@t1 → oboz@t33 | 32 tury | 60 |
| (4,19) | farma@t0 → oboz@t30 | 30 tur | 58 |
| (6,18) | farma@t4 → oboz@t34 | 30 tur | 61 |
| (7,17) RZEKA | farma@t8 → oboz@t35 | 27 tur | 59 |
| (7,5) RZEKA | farma@t5 → oboz@t25 | 20 tur | 49 |

**WERDYKT OCZAMI WLASCICIELA: NIE, nie dostal tego, o co prosil — i nie jest to
„15 heksow naraz", jest gorzej: 68 heksow naraz.** AI robi jeden przebieg calym
terytorium stawiajac wylacznie `farma`, potem drugi przebieg stawiajac `oboz_lowiecki`,
potem trzeci `bydlo`. Skarga wlasciciela jest **potwierdzona doslownie i w skrajnej postaci**.

Przyczyna strukturalna — potwierdzam niezaleznie, `auto-improvements.ts:402`:
`for (const key of basePriority)` — petla zewnetrzna idzie po TYPACH ulepszen,
wewnetrzna po polach. Dopoki ta kolejnosc petli sie nie odwroci, zadna korekta wag
ani terenow nie zmieni tego zachowania. To jest jedyna realna robota tego tematu.

**PRIORYTET RZEK — nie istnieje.** Ziarna 42 / 1337 / 2026, 40 tur:

| ziarno | heksow z rzeka | tknietych | heksow BEZ rzeki tknietych | 1. ulepszenie POZA rzeka | heksow z rzeka jeszcze pustych w tej chwili | ostatni heks z rzeka tkniety |
|---|---|---|---|---|---|---|
| 42   | 15 | 15 | 55 | **tura 0** | 15 | tura 33 |
| 1337 | 20 | 17 | 51 | **tura 0** | 19 | tura 26 |
| 2026 | 10 |  9 | 61 | **tura 0** | 10 | tura 14 |

AI wychodzi poza rzeki **w turze 0**, majac 100% (42, 2026) i 95% (1337) heksow
z rzeka jeszcze pustych. Zadanie „najpierw wszystkie rzeki" jest niezrealizowane w 100%.

**KONTROLA HARNESSU:** moje ziarna 42+1337+2026 daja `oboz_lowiecki` 31+33+35 = **99**
i pastwiska 19+20+17 = **56** — **dokladnie baza 99/56** poprzedniego tematu.
Harness reprodukowalny, trzecia niezalezna reprodukcja potwierdzona.
`wyrab` = **0** i `tartak` = **0** na wszystkich trzech ziarnach — potwierdzam
kontrpomiar Evaluatora: kazdy wariant W2/W3 wymaga najpierw, zeby AI w ogole zaczelo
budowac tartaki, czego dzis nie robi ani razu.

**LIMIT „1 oboz / 10 obywateli"** (pop 6 → limit 1), ziarno 1337, moja atrybucja
heksow spornych: c0 **15**, c1 **13**, c2 **5** — przekroczenie **5–15×**.
NOTA: Evaluator podal dla 1337 rozbicie 17/10/6; suma identyczna (**33**),
roznica to sposob przypisania heksow lezacych w zasiegu dwoch miast. Wniosek bez zmian.

## 4. Czy `DECISION_REQUIRED` przedstawiono UCZCIWIE

**TAK.** Sprzecznosc „wyrab usuwa las / trzoda wymaga lasu i tartaku" jest w raporcie
Operatora (§SPRZECZNOSC WEWNETRZNA #1) postawiona wprost, z pomiarem (W1 wykonalne na
**0** heksow, W2 na 22/44/46 = **100%**, W3 na 111/112) i z czterema wariantami
**W2/W3/W4/W5**, przy jawnym zdaniu „Operator NIE wybiera". Rekomendacja W2 jest
oznaczona jako rekomendacja, nie jako rozstrzygniecie. Kod nie zostal zmieniony
w zadna strone — sprawdzone diffem, nie deklaracja. Cichego rozstrzygniecia **nie ma**.
Tak samo uczciwie zamkniety jest „przodek" → `bydlo` (nie podniesiony do DECISION_REQUIRED,
z uzasadnieniem z danych) i decyzja 2026-07-29 (**nie** oznaczona jako wycofana, bo jej
ksztalt zalezy od wyboru W2–W5 — to wlasciwa kolejnosc, nie zaniedbanie).

**ALE — LUKA PROCEDURALNA (moja, nowa):** `DECISION_REQUIRED` zyje **wylacznie w raporcie
runu**. `grep -n "WYRAB-PRZY-RZECE" dyspozycje/PYTANIA-OTWARTE.md` → **0 trafien**.
Wlasciciel komunikuje sie tylko w glownym czacie orkiestratora (C-043), a §0c/C-031
wymaga, by kazde otwarte zgloszenie mialo nosnik poza raportem. **Dopoki ABC nie jest
zarejestrowane w `PYTANIA-OTWARTE.md`, ten temat jest o jedno kompaktowanie sesji od
zaginiecia** — dokladnie tym mechanizmem, ktory w tym repo pochlonal juz trzy tematy.
To zadanie orkiestratora przed runda 2, nie Operatora.

## 5. Ocena rundy wobec kryteriow dispatchu

| kryterium | stan |
|---|---|
| 1. Kompleksowosc PRZED/PO, ma wyraznie spasc | **NIESPELNIONE** — jest tylko PRZED; metryka Operatora (357/357) zdegenerowana, potwierdzam korekte Evaluatora; moja kronika daje trzeci, nieliczbowy dowod |
| 2. Farmy przy rzece PRZED/PO | **NIESPELNIONE** — brak PO |
| 3. Slad czasowy dowodzacy domykania heksa | **SPELNIONE ODWROTNIE** — slad istnieje i dowodzi, ze AI heksa NIE domyka |
| 4. Limit tartak/oboz na 10 obywateli | zmierzone PRZED: przekroczenie 5–15×; brak PO |
| 5. Nowa regula hodowli | niezaimplementowana (czeka na W2–W5) |
| 6. Obozy vs pastwiska PRZED/PO | PRZED = 99/56, potwierdzone moja reka; brak PO |
| 7. Decyzja 2026-07-29 oznaczona jako wycofana | swiadomie odlozone do wyboru wariantu — akceptuje |
| 8. Bramki | zielone poza zastanym `ai-praca-split-parity` 21/1 |

Runda 1 wykonala **KROK 1 i tylko KROK 1** — i wykonala go dobrze: obalila przeslanke
zlecenia liczbami zamiast implementowac ja „bo tak kazano". To jest zachowanie zgodne
z §REGULA PRZECIW SAMOOSZUKIWANIU dispatchu, nie uchylanie sie od pracy.
Ale **cel tematu nie zostal dostarczony** i wlasciciel po tej rundzie nadal widzi
w grze dokladnie to, na co sie skarzyl.

## 6. Werdykt

Do integracji nadaja sie **wylacznie artefakty pomiarowe** (3 narzedzia w `gra/tools/*`
+ raporty) — merge czysty, bramki zielone, zero dotkniec `gra/src/**` i `gra/data/**`.
Ale temat jako taki **nie jest gotowy**: glowne kryterium (kompleksowosc) nie ma czesci PO,
a kierunek implementacji jest zablokowany decyzja wlasciciela W2–W5.
Wystawienie `READY_FOR_DEPLOY` byloby tu nieprawda.

**REKOMENDACJA DLA ORKIESTRATORA (kolejnosc obowiazkowa):**
1. Zarejestrowac ABC w `dyspozycje/PYTANIA-OTWARTE.md` — blokady 1 i 2, warianty W2–W5,
   uzupelnione o fakt `tartak = 0` (bez tego W2 i W3 sa martwe niezaleznie od wyboru).
2. Zadac wlascicielowi pytanie w glownym czacie.
3. Runda 2 dopiero po odpowiedzi — i jej rdzeniem ma byc **odwrocenie petli
   `auto-improvements.ts:402` z „po typach" na „po heksach"**, bo to jest jedyne,
   co naprawia skarge wlasciciela. Wagi i tereny sa wtorne.
4. Zastany regres `ai-praca-split-parity-test` 21/1 na `main` — osobny temat, nie ten.

## ZMIANY-COMMIT

`gra/tools/fc-kronika-jednej-gry.cjs` (nowe, pomiar FC) ·
`dyspozycje/autobot/runs/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1/fc-kronika-1337.txt` (surowe wyjscie) ·
`dyspozycje/autobot/runs/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1/03-final-control.md` (ten raport).
Zero zmian w `gra/src/**`, `gra/data/**`, `main.ts`, `ui/**`, `WERSJE.md`, `gra-robocza/**`.

## BLOKADY

1. `DECISION_REQUIRED` — wyrab pod farme przy rzece jest gorszy od stanu dzisiejszego (potwierdzam).
2. `DECISION_REQUIRED` — sprzecznosc wyrab/trzoda, warianty W2–W5 (potwierdzam, uczciwie przedstawione).
3. **Nowa, moja:** brak wpisu ABC w `dyspozycje/PYTANIA-OTWARTE.md` — ryzyko utraty tematu (C-031/§0c).
4. Metryka kompleksowosci Operatora zdegenerowana — korekta Evaluatora (E1/E2) obowiazkowa; moja kronika ja potwierdza.
5. `tartak = 0` na wszystkich zmierzonych ziarnach — wywraca W2 i W3 przed ich wyborem.
6. Zastany regres `ai-praca-split-parity-test` 21/1 na `origin/main` `d0de8164`.

## NASTEPNY KROK

Orkiestrator: ABC do wlasciciela (blokady 1–2 + `tartak = 0`), rejestracja w `PYTANIA-OTWARTE.md`,
dopiero potem runda 2 Operatora.

GOTOWOSC DO INTEGRACJI: NIE

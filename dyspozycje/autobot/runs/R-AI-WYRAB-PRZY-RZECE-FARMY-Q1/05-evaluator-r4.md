# 05 — EVALUATOR, runda 4: R-AI-WYRAB-PRZY-RZECE-FARMY-Q1

STATUS: **FAIL**
DOMAIN: GAME
TEMAT: R-AI-WYRAB-PRZY-RZECE-FARMY-Q1 (Evaluator, runda 4/5)
DATA: 2026-08-28
GAŁĄŹ OCENIANA: `autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1-R4`, commit `6bbefe84`
WORKTREE: `/home/user/wt-ev-ai-r4` (odbity od `origin/…-R4`, `node_modules` przez symlink)

---

## 0. Streszczenie werdyktu

Merytorycznie praca Operatora jest **dobra i w większości potwierdzona moim niezależnym
pomiarem inną metodą**. Osiem z dziesięciu kryteriów końca sprawdziłem samodzielnie i wyszły
zielone; jedno (kryt. 6) **doprowadziłem do końca za Operatora** — dostarczyłem brakującą
weryfikację w prawdziwej przeglądarce (blokada 4 z jego raportu, 15/15).

`FAIL` wystawiam za **dwie rzeczy, których w raporcie Operatora nie ma**:

1. **Luka save/load nowej flagi AI `aiSurplusRedirectedOwners`** (Zasada 3). Flaga nie jest
   w snapshocie, nie ma restore z `?? default`, a jej utrata po `load` zostawia AI
   CYWILIZACJI z trwale zapisanym `procentBudynki = 100` bez własnej ścieżki powrotu.
   `R-PROC-AUTOBOT-EVAL-STRICT-SAVE` FAIL #9 mówi wprost: **FAIL, nie NOTES.**
2. **Kryterium 5 nie jest spełnione w konfiguracji DOMYŚLNEJ.** Dowód Operatora trzyma
   `onlyWorked = false`. Przy `onlyWorked = true` — czyli **po tej rundzie DOMYŚLNIE, dla
   każdej nowej gry** — wszystkie trzy „nieruszane" profile automatu GRACZA zmieniają
   zachowanie (zmierzone: 184/206, 140/162, 4/22 pozycji odcisku różne).

Obie pozycje są naprawialne w rundzie 5 i żadna nie podważa kierunku pracy.

---

## 1. Filtr odwrotny allowlisty — CZYSTO

`git -c core.quotePath=false diff --stat 27be5705(merge-base) HEAD` — 31 plików, **zero poza
allowlistą** rundy 4:

- `gra/src/game/{ai.ts, auto-improvements.ts, cities.ts}`, `gra/src/main.ts`,
  `gra/src/ui/buildModeHud.ts`
- `gra/tools/**` (9 plików)
- `dyspozycje/autobot/runs/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1/**` (18 plików)

Zero zmian w `gra/data/**` (sprawdzone osobno: `diff --stat … -- gra/data` = pusty),
zero w `gra/src/map/improvement-build.ts`, zero w `dyspozycje/WERSJE.md`.

**Potwierdzam ostrzeżenie Operatora o bazie gałęzi:** `merge-base` = `27be5705`, gałąź to
`origin/main` + merge `83f3e766` (runda 3, nigdy nie zintegrowana) + `6bbefe84` (runda 4).
**Merge tej gałęzi wnosi do `main` także całą rundę 3.** Cały wkład rundy 3 mieści się
w allowliście rundy 4 — integrator musi to przyjąć świadomie, ale nie jest to naruszenie.

---

## 2. Mój pomiar — INNA METODA (kryteria 1, 2, 3)

Narzędzie: `gra/tools/ev4-stan-mapy-measure.cjs` (nowe, moje). Cztery świadome różnice wobec
`ai4-popyt-obywatele-measure.cjs` Operatora:

| | Operator | Evaluator |
|---|---|---|
| co liczy | STRUMIEŃ ROZKAZÓW `buildImprovement` | **SNAPSHOT STANU MAPY** po ostatniej turze (faktycznie stojące warstwy + faktycznie usunięte lasy) |
| klasyfikacja kategorii | lista kluczy przepisana ze źródła (`KAT_ZYWNOSC = […]`) | **z danych gry** — `data/terrain-improvements.json`, `bonus.zywnosc > 0` |
| mapa | 36×28 „kontynenty", 3 miasta, pop 6, ziarna 7/99/512/4242/1337 | **44×32 „pangea", 4 miasta, pop 8, ziarna 1–5** |
| „przy obywatelach" | stan w turze wydania rozkazu | **stan KOŃCOWY pól obrabianych** |

Wejście: prawdziwe `decideAITurn` (AI CYWILIZACJI), 5 ziaren × 40 tur.
Surowe wyjścia: `ev4-pomiar-przed.txt`, `ev4-pomiar-po.txt`.

### Kryterium 1 — POMIAR PRZED (baza rundy 3) — POTWIERDZONE

| scenariusz | warstw | żywność | surowce | infra | wyrąb |
|---|---|---|---|---|---|
| bez niedoboru | 800 | 511 (63,9 %) | 111 (13,9 %) | 59 (7,4 %) | 119 (14,9 %) |
| stały niedobór drewna | 800 | 505 (63,1 %) | 117 (14,6 %) | 59 (7,4 %) | 119 (14,9 %) |

**Różnica < 1 pp** — niezależnie potwierdzam kluczową tezę dispatchu i Operatora: przed tą
rundą niedobór **przestawiał kolejność, nie zmieniał zakresu**. (Operator zmierzył 0,5 % na
swoich mapach; ja 0,7 pp na innych — ten sam wniosek.)

### Kryterium 2 — PO ZMIANIE — SPEŁNIONE dla surowców i infrastruktury

| scenariusz | warstw | żywność | surowce | infra | wyrąb |
|---|---|---|---|---|---|
| bez niedoboru | 347 | 345 (99,4 %) | **0** | **0** | 2 (0,6 %) |
| stały niedobór drewna | 692 | 354 | 291 | 45 | 2 |
| niedobór kamienia t15–t24 | 545 | 360 | 142 | 41 | 2 |

Surowce i infrastruktura to **dosłowne zero** bez niedoboru. Ślad czasowy okna (własny
harness pickera, `ev4-kryteria.txt`, niedobór t10–t19):

```
t0..t9   : 15/0 14/0 11/0 10/0 13/0 10/0 10/0 11/0 11/0 10/0     (żywność/NIE-żywność)
t10*..t19*: 0/10  0/10  0/10  0/10  2/8  3/6  4/6  4/5  2/7  2/6
t20..t29 : 10/0 10/0 10/0 10/0 10/0 10/0  8/0  6/0  4/0  3/0
```

Rozkazy niezywnościowe **pojawiają się dokładnie w turze wejścia niedoboru i znikają
dokładnie w turze jego ustania**. Kryterium 2 w tej części spełnione.

**Blokada 2 Operatora POTWIERDZONA co do istoty, ale mniejsza niż raportował:** `wyrab`
zostaje przy braku niedoboru — u Operatora 12 rozkazów (6,2 %), u mnie na innych mapach
**2 warstwy (0,6 %)**. Zgadzam się z jego uzasadnieniem (KROK 0 sekwencji wyrąb→farma po
`R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1`) i z tym, że dosłowne zero = osobna decyzja właściciela.
Zwracam uwagę, że rozrzut 0,6 %–6,2 % między zestawami map jest duży — właściciel podejmując
tę decyzję powinien wiedzieć, że to nie jest stała liczba.

### Kryterium 3 — ZASADA 2 — SPEŁNIONE

| | warstwy poza obywatelami | z tego ZŁOŻOWE (wyjątek) | **NIE-złożowe** |
|---|---|---|---|
| PRZED (bez niedoboru) | 459 / 800 (57,4 %) | 46 | **413 (51,6 %)** |
| PO (bez niedoboru) | 105 / 347 (30,3 %) | 105 | **0 (0,0 %)** |
| PO (niedobór drewna) | 291 / 692 | 291 | **0 (0,0 %)** |

Zero nie-złożowej budowy poza obywatelami we WSZYSTKICH trzech scenariuszach. Udział złóż
podany osobno, zgodnie z wymogiem dispatchu (46 → 105).

### Skutek uboczny, którego Operator nie zmierzył (uzupełniam jego blokadę 6)

Zasada 2 obcina nie tylko budowę niepotrzebną — **warstw ŻYWNOŚCIOWYCH też ubywa: 511 → 345
(−32,5 %)**, a AI CYWILIZACJI stoi bezczynnie w **97 turach na 200** (raport nadwyżki).
To jest zamierzony kierunek („przestań budować dla sztuki"), ale liczbowo mocniejszy, niż
sugeruje raport Operatora — i to jest właśnie ta zmienna, której wpływ na siłę strategiczną
AI pozostaje **BRAKIEM DOWODU (§13a)**. Zgłaszam jako materiał do decyzji właściciela, nie
jako błąd.

---

## 3. Kryterium po kryterium — kontrola niezależna

| # | kryterium | mój werdykt | dowód |
|---|---|---|---|
| 1 | pomiar PRZED, ≥3 ziarna | **OK** | `ev4-pomiar-przed.txt`, 5 ziaren × 40 tur, snapshot mapy |
| 2 | 0 poza żywnością bez niedoboru; okno niedoboru | **OK z zastrzeżeniem** | surowce/infra = 0; `wyrab` 0,6 % zostaje (blokada 2, decyzja właściciela) |
| 3 | Zasada 2 zmierzona osobno, złoża osobno | **OK** | 51,6 % → 0,0 %; złoża 46 → 105 |
| 4 | Zasada 3 — AI CYW. na budynki, gracz NIE rusza suwaka | **CZĘŚCIOWO** | patrz §4 |
| 5 | trzy pozostałe profile bez zmiany | **NIE SPEŁNIONE** | patrz §5 — ZNALEZISKO |
| 6 | R4-Q2 przełącznik, oba zakresy, save/load | **OK** | patrz §6, w tym realna przeglądarka 15/15 |
| 7 | dowód nie-tautologiczny (mutacje) | **OK** | własne 12 mutacji, 12 czerwonych, 0 podejrzanych |
| 8 | pięć bramek + `tsc` | **OK** | patrz §7 |
| 9 | bramka rundy 3 bez pogorszenia | **OK** | `ai2-heks-po-heksie-test` **35/0** |
| 10 | zależność `FARMA-NIE-W-LESIE` w `main` | **OK** | `farma-nie-w-lesie-test` **136/0**, `1e34a667` w `main` |

---

## 4. Kryterium 4 (Zasada 3) — co potwierdzam, a co jest ZNALEZISKIEM

### Potwierdzam — połowa dotycząca AI GRACZA

`pracaAutoPercent` gracza ma w całym `main.ts` **dokładnie trzy miejsca zapisu** (linie
19497, 19517, 19590) i **wszystkie trzy są handlerami suwaka w panelu**. W bloku EOT /
auto-ulepszeń / pętli AI nie ma ani jednego zapisu. Ścieżka nadwyżki gracza to wyłącznie
`showHintMessage(...)`. Reguła stała właściciela (automat gracza doradza, nie decyduje)
jest dotrzymana. Blok Zasady 3 dla AI CYWILIZACJI jest ownerowo zamknięty
(`if (c.ownerId !== ownerId) continue;`) — nie sięga miast gracza.

### Potwierdzam — spójność raportu nadwyżki

Dołożyłem kontrolę, której nie było: czy zdarza się tura z `surplus = true` **i jednocześnie**
wydanym rozkazem (raport wewnętrznie sprzeczny). **AI CYWILIZACJI: 0 na 200 tur.
AI GRACZA: 0 na 150 tur.** Raport nadwyżki jest w pomiarze spójny.

### ZNALEZISKO Z-3 (blokujące) — luka save/load flagi `aiSurplusRedirectedOwners`

`main.ts:7495` deklaruje `const aiSurplusRedirectedOwners = new Set<number>();`. Grep całego
`main.ts` daje **cztery wystąpienia: deklaracja + trzy w bloku Zasady 3**. Flagi **nie ma
w snapshocie zapisu** (`meta:` w `saveSnapshot`, linia ~24905) i **nie ma restore**.

Mechanika przekierowania (`main.ts:28502–28530`):

```
if (surplusRep?.surplus)      { add(ownerId); ownerDefaultPodzialPracy = 100; wszystkie miasta = 100 }
else if (redirected)          { delete(ownerId); przywróć procentBudynki z aiSliderStateByOwner }
```

Stan, który blok ZAPISUJE, jest trwały: `ownerDefaultPodzialPracy` idzie do zapisu
(`meta.ownerDefaultPodzialPracy`), a `city.podzialPracy` idzie do zapisu razem z miastami
(`cities: cities.slice()`). Stan, który steruje POWROTEM, trwały nie jest.

**Ścieżka awarii:** gracz zapisuje grę w turze, w której AI ma nadwyżkę → po `load`
`aiSurplusRedirectedOwners` jest puste → nadwyżka ustaje → gałąź `else if (redirected)` NIE
wykonuje się nigdy → AI zostaje z `procentBudynki = 100`, czyli
`procentPuliImperiumZBudynkow(100) = 0` — **zero Pracy do puli imperium, czyli zero ulepszeń
terenu**, aż do momentu, w którym `decideAIEconomySliders` samo z siebie zwróci
`changed === true`. A `decideAIEconomySliders` porównuje się do `aiSliderStateByOwner`
(też nieutrwalanego), **nie do faktycznego stanu miast** — więc gdy jego cel akurat
pokrywa się z wartością domyślną, `changed` zostaje `false` i **nic nie naprawia stanu**.

`R-PROC-AUTOBOT-EVAL-STRICT-SAVE`, FAIL #9 poz. 1 — „nowe trwałe pole stanu gry (… flagi AI)
bez zapisu w snapshot save i/lub bez restore z bezpiecznymi defaultami" → **FAIL, nie NOTES**.
Wyjątek „efemeryczny cache sesji" **nie ma zastosowania**: brak komentarza „nie persistujemy",
a utrata flagi nie jest neutralna — zostawia zapisany, nieodwracalny stan.

**Naprawa jest mała** (runda 5), do wyboru:
(a) dopisać `aiSurplusRedirectedOwners: Array.from(...)` do `meta` i restore z `?? []`; albo
(b) uniezależnić powrót od flagi — wyliczać docelowy `procentBudynki` bezwarunkowo z
`aiSliderStateByOwner` (z `?? DEFAULT`) i pisać go w każdej turze bez nadwyżki, zamiast
tylko przy przejściu; albo
(c) w ogóle nie zapisywać przekierowania do stanu trwałego, tylko modyfikować podział na czas
jednej tury.

### ZNALEZISKO Z-4 (obserwacja, NIE blokujące) — `anyCandidate` nie widzi wyrębu

`surplusReport.anyCandidate` ustawiane jest w FAZIE 0 i FAZIE 1 oraz przez sondę na końcu.
**KROK 0 (wyrąb rzeka+las) i FAZA 2 (wyrąb) go nie ustawiają**, a sonda iteruje po
`hexPhasePriority`, z której `wyrab` jest wprost wyfiltrowany. Strukturalnie da się więc
uzyskać `surplus = true` w turze, w której automat wydał rozkaz wyrębu — czyli AI dostałoby
sygnał „nie ma czego kupić" mając robotę na topór.

**Nie zaobserwowałem tego ani razu** (0/200 tur AI CYWILIZACJI, 0/150 tur AI GRACZA) — do
osiągnięcia potrzeba konfiguracji, w której `wyrab` jest odblokowany, a `tartak`
i `oboz_lowiecki` nie. Zgłaszam jako obserwację kodową do rundy 5, nie jako podstawę `FAIL`.

### BRAK DOWODU podtrzymany (§13a)

Blokada 3 Operatora zostaje **BRAKIEM DOWODU**: efektu Zasady 3 w kolejce produkcji
prawdziwej rozgrywki nie zmierzył ani on, ani ja (`main.ts` to closure `boot()`). Mogę
potwierdzić tylko mechanikę czystej funkcji: `splitPraca(total, 1.0)` → `doBudynkow = total`,
`doPuli = 0` (`production.ts:1918`), czyli przesunięcie **nie jest no-opem**. Zwracam jednak
uwagę na warunek brzegowy, którego nikt nie odnotował: `pracaImperialPoolGain` przy **pustej
kolejce** oddaje całość Pracy do puli mimo `procentBudynki = 100` — więc dla AI z pustą
kolejką Zasada 3 nie robi nic. Kryterium 4 wprost żąda „dowodu z kolejki produkcji miasta";
ten dowód nadal nie istnieje.

---

## 5. Kryterium 5 — ZNALEZISKO Z-1 (blokujące)

Narzędzie: `gra/tools/ev4-kryteria-check.cjs` — buduje drzewo PRZED (`83f3e766`) i PO
(`6bbefe84`) w jednym procesie i porównuje **odcisk pick po picku** (`t|cityId|q,r|key`),
nie agregaty. 5 ziaren × 30 tur. Wyjście: `ev4-kryteria.txt`.

**5a — test w konfiguracji Operatora (`onlyWorked = false`): POTWIERDZAM ZIELONE.**

```
[ZGODNE] profil "zywnosc"        — 315 pozycji odcisku identycznych
[ZGODNE] profil "surowce"        — 291 pozycji odcisku identycznych
[ZGODNE] profil "infrastruktura" —  94 pozycje odcisku identyczne
[ZGODNE] profil "zrownowazone" BEZ demandDriven — 306 pozycji identycznych
```

Ostatnia linia to dodatkowy dowód, że wołający nieświadomi Zasady 1 (narzędzia, testy legacy)
dostają dokładnie stare zachowanie.

**5b — TEN SAM test przy `onlyWorked = true`: NIE ZGODNE.**

```
[ROZNE] profil "zywnosc"        — 184/206 pozycji rozne
        seed=1 #4: PRZED='t1|c0|4,7|farma'  PO='t1|c0|8,7|oboz_lowiecki'
[ROZNE] profil "surowce"        — 140/162 pozycji rozne
        seed=1 #4: PRZED='t2|c0|5,7|tartak' PO='t2|c0|8,7|glinianka'
[ROZNE] profil "infrastruktura" —   4/22 pozycji rozne
        seed=11 #8: PRZED='t3|c2|9,9|droga' PO='t3|c0|5,7|posterunek'
```

**Dlaczego to jest istotne, a nie akademickie:** ta runda zmienia
`DEFAULT_ULEPSZENIA_ONLY_WORKED` z `false` na `true`
(`freshUlepszeniaEmpirePolicy()` PRZED: `onlyWorked:false` → PO: `onlyWorked:true`,
zmierzone). **`onlyWorked = true` jest od tej rundy stanem DOMYŚLNYM każdej nowej gry.**
Konfiguracja, w której Operator dowodzi „identycznych odcisków", jest po tej rundzie
konfiguracją niedomyślną.

**Atrybucja przyczyn** (zrobiłem kontrolę przez podmianę: kopia drzewa PO z wyciętym
wyjątkiem złożowym, porównana z PO):

- profile „żywność" i „surowce" — **wyjątek złożowy**. Po jego usunięciu drzewo PO daje
  odcisk identyczny z rundą 3. Wyjątek działa **bezwarunkowo, dla wszystkich czterech
  profili**, nie tylko dla `zrownowazone` (`hexAllowsKey` i filtr `candidateHexes` nie
  patrzą na `focus`).
- profil „infrastruktura" — **przeniesienie liczników stanu miasta z `candidateHexes` na
  `radiusHexes`** (`plonoweWPromieniu`, `have`, `forestLeftInRadius`, `lesneMinSpelnione`).
  To korekta (b) zgłoszona przez Operatora w blokadzie 9; skutek: `plonoweWPromieniu`
  osiąga próg `>= population` wcześniej, więc FAZA 0 (posterunek/fort) rusza wcześniej.

**Rozstrzygnięcie, którego Evaluator nie może podjąć sam.** Czytam dispatch tak: Zasada 1
jest wprost ograniczona do `zrownowazone`, a Zasada 2 wprost **nie jest** („domyślnie dla
obu AI", ECHO: „zarówno w cywilizacji, jak i w ludzkich domach"). Przy tym czytaniu kod
Operatora jest **wierny ECHO**, a to **kryterium 5 jest sformułowane za wąsko**. Ale
kryterium 5 jest kryterium końca i w brzmieniu, w jakim zostało zapisane („identyczny wynik
`pickAutoImprovements` na tych trzech profilach PRZED i PO, na tych samych danych
wejściowych"), **nie jest spełnione**. To jest pytanie do właściciela (§10), nie decyzja
Operatora ani moja — a raport Operatora przedstawia kryterium 5 jako w pełni zielone
(„identyczne odciski PRZED i PO"), bez tego zastrzeżenia. Dlatego jest to znalezisko
blokujące: **nie dlatego, że kod jest zły, tylko dlatego, że zakres zmiany jest większy niż
opisany, a właściciel go nie widział.**

---

## 6. Kryterium 6 (R4-Q2) — POTWIERDZONE, w tym BRAKUJĄCA WERYFIKACJA W PRZEGLĄDARCE

### Logika przełącznika — mój niezależny pomiar

```
wolnoWycinacLas=false -> pickow 206, wyrab  0, farma 50
wolnoWycinacLas=true  -> pickow 226, wyrab 10, farma 60
```

Sekwencja wyrąb→farma działa: +10 wyrębów daje +10 farm. Zakres MIASTA sprawdzony osobno —
`getSkipWyrab` różny dla dwóch miast w JEDNYM wywołaniu pickera: wyrąb tylko w `c0`
(`{"c0":1}`), zero w `c1`. Domyślne: `DEFAULT_ULEPSZENIA_WOLNO_WYCINAC_LAS = false`,
`freshUlepszeniaEmpirePolicy().wolnoWycinacLas = false` — sprawdzone na żywym module.

### Save/load nowych pól trwałych — CZYSTO

- `City.ulepszeniaWolnoWycinacLas`: zapis — `cities: cities.slice()` (całe obiekty miast);
  restore — `ensureCitySaveDefaults` (`== null` → `DEFAULT`) + `resolveEffectiveUlepszenia`
  (`?? DEFAULT`). OK.
- `UlepszeniaEmpirePolicy.wolnoWycinacLas`: zapis —
  `meta.ulepszeniaEmpireByOwner: Array.from(entries())` (cały obiekt polityki);
  restore — `(pol.wolnoWycinacLas as boolean) ?? DEFAULT_ULEPSZENIA_WOLNO_WYCINAC_LAS`. OK.

Te dwa nowe pola trwałe **spełniają STRICT-SAVE**. Luka dotyczy wyłącznie flagi z §4.

### Weryfikacja w przeglądarce — DOSTARCZONA (blokada 4 Operatora ZAMKNIĘTA)

Operator zgłosił brak realnej weryfikacji w przeglądarce jako BRAK DOWODU. Granica §9 poz. 6a
wymaga jej bezwarunkowo dla warstwy UI, więc **wykonałem ją sam**:
`gra/tools/ev4-r4q2-przycisk-real-render-test.cjs` — prawdziwy Chromium (Playwright), na
niezmodyfikowanym `createBuildModeHud()` zbudowanym esbuildem, wynik **15 passed, 0 failed**
(`ev4-render.txt`):

- oba przyciski renderują się z niezerowym prostokątem i **są klikalne**
  (`document.elementFromPoint` w środku trafia w przycisk, nie w element zasłaniający);
- **realny `page.mouse.click()`** wywołuje właściwy callback z właściwym argumentem
  (`onUlepszeniaEmpireWyrabChange(true)`, `onUlepszeniaCityWyrabChange("miasto-1", true)`);
- `aria-pressed` i klasa `active` odzwierciedlają OFF/ON — gracz widzi stan przełącznika;
- zakresy są niezależne (państwo OFF + miasto ON w jednym renderze);
- kontrola negatywna: po usunięciu przycisku z DOM ta sama asercja pada (nie tautologia);
- zero błędów konsoli / `pageerror`.

---

## 7. Kryteria 7–10 — bramki, mutacje, regresja

### Pięć bramek referencyjnych (własną ręką, z `gra/`, w `timeout`)

```
logic-test         213/213 (LOGIC OK)
tech-tree-test      19 pass, 0 fail
research-test       33/33 ALL GREEN
unit-replace-test   13/13
combat-test          6/6
```

`node ./node_modules/typescript/bin/tsc --noEmit` → **0 błędów**.
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-ai-r4-ev --emptyOutDir`
→ **OK, built in 18,73 s**.

### Bramki tematu i braku pogorszenia

```
ai2-heks-po-heksie-test (runda 3)   35/0   (kryterium 9 — bez pogorszenia)
ai4-popyt-obywatele-test (runda 4)  48/0
auto-improvements-test              45/0
ai-improvements-test                52/0
map-improvement-qualify-test       117/0
farma-nie-w-lesie-test             136/0
oboz-lowiecki-las-test              91/0
ai-jednostki-tylko-zakup-test       44/0
ulepszenia-praca-percent-test       28/0
ev4-r4q2-przycisk-real-render-test  15/0   (nowa, moja)
```

**`ai-praca-split-parity-test` 21/1 — ZASTANE, POTWIERDZONE OSOBNO.** Wypakowałem czysty
`origin/main` (`27be5705`) do `/tmp/ev4-parity` i uruchomiłem tę samą bramkę: **21 passed,
1 failed, ten sam test 5**. To nie jest regres tej gałęzi. Wymaga osobnego tematu.

### Kryterium 7 — moje własne mutacje (12, inne niż 15 Operatora)

`gra/tools/ev4-mutacje.cjs` — wycinam CAŁE mechanizmy, nie pojedyncze warunki. Każda mutacja
na świeżej kopii drzewa, bramka `ai4-popyt-obywatele-test.cjs`. Baza bez mutacji: ZIELONA.

```
M1  foodOnly zawsze false (Zasada 1 wycięta)                -> 43/5  CZERWONA
M2  hexAllowsKey zawsze true (Zasada 2 wycięta)             -> 47/1  CZERWONA
M3  surplus zawsze false (Zasada 3 wycięta)                 -> 47/1  CZERWONA
M4  DEFAULT_ULEPSZENIA_ONLY_WORKED = false                  -> 45/3  CZERWONA
M5  DEFAULT_ULEPSZENIA_WOLNO_WYCINAC_LAS = true             -> 43/5  CZERWONA
M6  hasNonFoodResourceDeficit zawsze true                   -> 41/7  CZERWONA
M7  `zywnosc` liczy się jako niedobór (kasuje wyjątek)      -> 46/2  CZERWONA
M8  getSkipWyrab ignorowany (zakres MIASTO wycięty)         -> 46/2  CZERWONA
M9  wyjątek złożowy rozlany na każdy klucz                  -> 47/1  CZERWONA
M10 Zasada 1 przecieka na trzy pozostałe profile            -> 46/2  CZERWONA
M11 ai.ts: demandDriven: false                              -> 42/6  CZERWONA
M12 ai.ts: getOnlyWorked: () => false                       -> 46/2  CZERWONA
```

**12 dowodów, 0 podejrzanych, 0 nieudanych podmian.** Bramka rundy 4 nie jest tautologią —
pilnuje każdego z trzech mechanizmów, obu nowych wartości domyślnych, obu zakresów R4-Q2
i wpięcia po stronie `ai.ts`. Potwierdzam wynik Operatora własnym, rozłącznym zestawem.

---

## 8. Kontrola korekt zgłoszonych przez Operatora (blokada 9)

Wszystkie trzy korekty odnalazłem w diffie i uznaję za uzasadnione — ale **jedna ma skutek
uboczny, którego Operator nie odnotował**:

| korekta | ocena |
|---|---|
| (a) minimum leśne liczy się tylko z kluczy możliwych w danej konfiguracji + tylko z odblokowanych | **uzasadniona** — bez tego deadlock i cichy regres mechanizmu rundy 3, czego dispatch zabrania wprost |
| (b) liczniki stanu miasta po **pełnym promieniu** (`radiusHexes`), nie po zawężonej liście | **uzasadniona co do intencji**, ale jest **drugą przyczyną rozjazdu kryterium 5b** (profil „infrastruktura") — patrz §5 |
| (c) FAZA 2: heks z tartakiem/obozem nie idzie pod topór | **uzasadniona** — luka rundy 3, złapana teraz testem I |

Znalezisko metodologiczne Operatora (blokada 8 — węzeł terytorium na heks vs jeden na miasto)
**potwierdzam i stosuję**: moje narzędzia budują jeden węzeł na miasto, w kształcie silnika.
Dlatego moje liczby są porównywalne wewnętrznie i z liczbami rundy 4, **ale nie wprost
z liczbami rund 2 i 3**.

---

## 9. Kontrakt raportu

```
STATUS: FAIL
DOMAIN: GAME
TEMAT: R-AI-WYRAB-PRZY-RZECE-FARMY-Q1 (Evaluator, runda 4/5)
GOAL: AI CYWILIZACJI i AI GRACZA (profil „zrównoważone") budują domyślnie samą żywność;
      niedobór surowca otwiera resztę listy na czas jego trwania; budowa poza złożami tylko
      na heksach obrabianych przez obywateli; nadwyżka → AI CYWILIZACJI przesuwa środki na
      budynki, AI GRACZA wyłącznie sygnalizuje; R4-Q2=C — przełącznik „wolno wycinać las"
      dla automatu GRACZA (państwo + miasto, domyślnie wyłączony).
ZMIANY/COMMIT: gałąź `autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1-R4` @ `6bbefe84` — allowlista
      czysta (31 plików, zero poza nią, zero w `gra/data/**` i `WERSJE.md`). Evaluator dołożył
      wyłącznie artefakty własne: `gra/tools/ev4-stan-mapy-measure.cjs`,
      `gra/tools/ev4-kryteria-check.cjs`, `gra/tools/ev4-mutacje.cjs`,
      `gra/tools/ev4-r4q2-przycisk-real-render-test.cjs`, dwa stuby w `gra/tools/.stubs/`
      oraz `05-evaluator-r4.md` + pięć plików `ev4-*.txt` w katalogu runu.
TESTY: pięć bramek referencyjnych 213/213, 19/0, 33/33, 13/13, 6/6; `tsc --noEmit` 0 błędów;
      build vite → /tmp/civ-dist-ai-r4-ev OK. Bramka rundy 3 `ai2-heks-po-heksie-test` 35/0;
      bramka rundy 4 `ai4-popyt-obywatele-test` 48/0; bez pogorszenia: auto-improvements 45/0,
      ai-improvements 52/0, map-improvement-qualify 117/0, farma-nie-w-lesie 136/0,
      oboz-lowiecki-las 91/0, ai-jednostki-tylko-zakup 44/0, ulepszenia-praca-percent 28/0.
      NOWA, moja bramka UI w prawdziwym Chromium: ev4-r4q2-przycisk-real-render-test 15/0.
      Własny pomiar snapshotem mapy (inna metoda, inne mapy/ziarna) potwierdza kryteria 1/2/3.
      Własne 12 mutacji: 12 czerwonych, 0 podejrzanych.
      ZASTANE, NIE Z TEJ GAŁĘZI: `ai-praca-split-parity-test` 21/1 — ten sam wynik na czystym
      `origin/main` 27be5705 (sprawdzone osobno w /tmp/ev4-parity).
BLOKADY:
  Z-1 (BLOKUJĄCE) Kryterium 5 niespełnione w konfiguracji DOMYŚLNEJ: przy `onlyWorked=true`
      — od tej rundy wartość domyślna — trzy „nieruszane" profile automatu GRACZA zmieniają
      zachowanie (184/206, 140/162, 4/22 pozycji odcisku). Przyczyny: bezwarunkowy wyjątek
      złożowy (żywność, surowce) i przeniesienie liczników na pełny promień (infrastruktura).
      Zmiana jest prawdopodobnie wierna ECHO, ale wykracza poza to, co opisuje raport
      Operatora i poza literalne kryterium 5 — wymaga pytania ABC do właściciela.
  Z-3 (BLOKUJĄCE) Luka save/load: `aiSurplusRedirectedOwners` (nowa flaga AI, Zasada 3) nie
      jest w snapshocie i nie ma restore z `?? default`. Zapisanie gry w turze z nadwyżką
      zostawia po `load` AI CYWILIZACJI z trwałym `procentBudynki = 100` (0 % Pracy do puli
      imperium) bez własnej ścieżki powrotu. R-PROC-AUTOBOT-EVAL-STRICT-SAVE FAIL #9 — FAIL,
      nie NOTES. Naprawa mała, trzy warianty opisane w §4.
  Z-4 (obserwacja) `surplusReport.anyCandidate` nie jest ustawiane przez KROK 0 ani FAZĘ 2
      (wyrąb), a sonda pomija `wyrab` — strukturalnie możliwe `surplus=true` w turze z
      rozkazem wyrębu. NIE zaobserwowane (0/200 tur AI CYW., 0/150 tur AI GRACZA).
  Z-5 (do decyzji właściciela) `wyrab` zostaje przy braku niedoboru (blokada 2 Operatora) —
      potwierdzam co do istoty, ale wielkość zależy od map: 6,2 % (Operator) vs 0,6 % (ja).
  Z-6 (BRAK DOWODU, §13a) Efekt Zasady 3 w kolejce produkcji prawdziwej rozgrywki nadal
      niezmierzony; kryterium 4 żąda dowodu z kolejki. Dodatkowo: `pracaImperialPoolGain`
      przy PUSTEJ kolejce oddaje całość Pracy do puli mimo `procentBudynki=100`, więc dla AI
      z pustą kolejką Zasada 3 jest bezskuteczna — nikt tego dotąd nie odnotował.
  Z-7 (BRAK DOWODU, §13a) Wpływ Zasady 2 na siłę strategiczną AI: zmierzyłem koszt, nie
      skutek — warstw żywnościowych ubywa 511 → 345 (−32,5 %), AI stoi bezczynnie w 97/200
      turach. Materiał do decyzji właściciela.
  Z-8 (do świadomego przyjęcia przy integracji) Merge tej gałęzi wnosi do `main` także całą
      rundę 3 (`83f3e766`), nigdy nie zintegrowaną. Cały jej wkład mieści się w allowliście
      rundy 4 — to nie jest naruszenie, ale musi być decyzją, nie skutkiem ubocznym.
  Z-9 (zastane, poza tematem) `ai-praca-split-parity-test` czerwony na `main`.
RUNDY: 4/5 (po tej rundzie została jedna)
NASTĘPNY KROK: Final Control — kontrola śladu i gotowości; następnie runda 5 Operatora z
      zakresem: (1) domknąć Z-3 (save/load flagi Zasady 3), (2) pytanie ABC do właściciela o
      Z-1 (czy Zasada 2 ma obowiązywać wszystkie cztery profile automatu gracza — jeśli tak,
      kryterium 5 wymaga przeformułowania i bramki na nową, szerszą regułę), (3) opcjonalnie
      Z-4 i dowód z kolejki produkcji dla Z-6.
DEPLOY/PUSH: NIE WYKONANO — wypchnięta wyłącznie gałąź tematu
      `autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1-R4`; zero pushu do `main`, zero integracji,
      zero deployu.
```

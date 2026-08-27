# 02 — EVALUATOR (runda 1) — R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1

Worktree Evaluatora: `/home/user/wt-ev-hodowla-las` (detached `9a0f5789`).
Worktree bazowy do porównań: `/home/user/wt-ev-hodowla-base` (`9015380b` = merge-base z `main`).
Wszystkie liczby niżej pochodzą z uruchomień **własną ręką**, nie z raportu Operatora.

## 1. Filtr odwrotny allowlisty

`git -c core.quotePath=false diff --stat 9015380b..HEAD` — 6 plików, **każdy w allowliście**:

| Plik | Allowlista |
|---|---|
| `gra/src/map/improvement-build.ts` | poz. 1 |
| `gra/data/terrain-improvements.json` | poz. 2 |
| `gra/tools/hodowla-las-test.cjs` (nowy) | poz. 4 |
| `gra/tools/hodowla-las-measure.cjs` (nowy) | poz. 4 |
| `gra/tools/map-improvement-qualify-test.cjs` | poz. 4 |
| `dyspozycje/autobot/runs/<ID>/01-operator.md` | poz. 5 |

Kontrola negatywna: `main.ts`, `gra/src/ui/**` i `dyspozycje/WERSJE.md` **nie występują** w diffie.
Reguły równoległych tematów nietknięte — `isFarmBaseTerrain`, `FOREST_BLOCKED_IMPROVEMENT_KEYS`
i `FOREST_DEPENDENT_IMPROVEMENT_KEYS` pojawiają się w diffie **wyłącznie w komentarzu**.
Sekrety (§16a.5): zero trafień. `git status` pusty, `HEAD == origin/autobot/…` — praca jest
w commitach i wypchnięta (nie ma pracy niezacommitowanej).

## 2. Powtórzenie kluczowego pomiaru — WŁASNA METODA

Operator mierzył zliczaniem heksów na 5 ziarnach `generateMap`. Zrobiłem **dwa własne,
niezależne pomiary**, w tym jeden metodą, której Operator nie użył.

### 2a. Wyczerpująca tabela prawdy (metoda inna niż Operatora)

Dla **każdej** pary (teren bazowy × nakładka) budowana jest osobna mapa z badanym heksem
zawsze tuż przy mieście (zero zależności od zasięgu terytorium i od generatora), a następnie
`buildImprovementQualifier` odpytywany dla **wszystkich 22 kluczy** i 5 profili
cywilizacja/epoka/koń. **7040 komórek** porównanych między `9015380b` a gałęzią:

```
CELLS COMPARED: 7040   CHANGED: 18
wg KLUCZA:   { bydlo: 8, owce: 4, lama: 6 }
wg NAKLADKI: { las: 18 }        <-- ZMIANY POZA LASEM: 0
```

Wszystkie 18 zmian to `false -> true`, wyłącznie na nakładce `las`, wyłącznie dla trzech
kluczy z ECHO, i **dokładnie po własnej regule terenu bazowego każdego z nich**:

- `bydlo` → `laka|las`, `rownina|las` (FLAT_FARM),
- `owce` → `wzgorza|las`,
- `lama` → `wzgorza|las`, `gory|las`.

`stadnina`, `farma`, `irygacja`, `tarasy`, `oboz_lowiecki`, `tartak`, `wyrab` i pozostałe
klucze: **zero zmienionych komórek**.

> Uwaga metodologiczna — pierwsza wersja mojej sondy miała **błąd własny** (siatka 40 szeroka
> przy jednym węźle terytorium; część komórek wypadała poza terytorium i maskowała `bydlo`,
> dając fałszywe „bydło się nie zmieniło"). Zgłaszam to jawnie: wynik powyżej pochodzi
> z wersji poprawionej, w której każda para ma własną mapę.

### 2b. Pomiar na ziarnach WŁASNYCH (innych niż Operatora)

Ziarna Evaluatora `11111, 60606, 1234567, 8080, 2718281, 55555` (Operator miał
`90210, 777, 31415, 20260827, 4242`), mapa 36×28 kontynenty, profil Inkowie/epoka 5,
całość mapy w terytorium, `tradeRouteKonUnlocked=true`. **926 heksów z Lasem, 5122 bez Lasu.**

| klucz | NA LESIE przed | NA LESIE po | teren (las) | POZA LASEM przed | POZA LASEM po |
|---|---|---|---|---|---|
| `owce` | 0 | **70** | `{Wzgorza:70}` | 109 | 109 |
| `bydlo` | 0 | **856** | `{Laka:836, Rownina:20}` | 558 | 558 |
| `lama` | 0 | **70** | `{Wzgorza:70}` | 245 | 245 |
| `stadnina` | 0 | **0** | `{}` | 558 | 558 |

Kryterium 4 spełnione (przed = 0, po > 0 tam gdzie teren pasuje). Kryterium 5 spełnione
**dwoma niezależnymi drogami**: kolumna „poza lasem" identyczna co do sztuki, a tabela prawdy
daje zero zmian poza nakładką `las`. Liczby Operatora (52/725/52 na 777 heksach z lasem)
nie są identyczne z moimi, bo ziarna są inne, ale **proporcje się zgadzają**
(owce 6,7% vs 7,6% heksów leśnych; bydło 93% vs 92%).

`lama` nie dostaje na wygenerowanych mapach ani jednego heksu `gory|las` (generator nie stawia
lasu na Górach), choć silnik na to pozwala — widać to w tabeli prawdy. To nie jest usterka.

## 3. Dziewięć kryteriów końca — sprawdzone niezależnie

| # | Kryterium | Werdykt | Dowód |
|---|---|---|---|
| 1 | Zakaz zdjęty dla `owce`/`bydlo`/`lama` | **OK** | tabela prawdy: 18 komórek `false→true`, tylko te 3 klucze |
| 2 | Wszystkie punkty egzekwowania | **OK** | inwentaryzacja własna, niżej §4 |
| 3 | `terrain-improvements.json` zaktualizowany | **OK** | §5; bramka czerwieni się na rewersji danych |
| 4 | Pomiar PRZED/PO ≥3 ziarna | **OK** | §2b, 6 własnych ziaren |
| 5 | Reszta kwalifikacji bez zmian | **OK** | 0 zmian poza `las` na 7040 komórkach; kolumna „poza lasem" co do sztuki |
| 6 | Dowód nie-tautologiczny | **OK** | §6, 5 własnych mutacji |
| 7 | Pięć bramek + `tsc` | **OK** | §7 |
| 8 | `map-improvement-qualify` bez pogorszenia | **OK** | baseline 117/0 zmierzony przeze mnie na `9015380b` → 126/0 na gałęzi |
| 9 | Bramka obozu bez pogorszenia | **OK** | 91/0 na obu drzewach; `oboz_lowiecki` ma 0 zmienionych komórek w tabeli prawdy |

## 4. Punkty egzekwowania — kontrola własna (kryterium 2)

Nie przyjąłem inwentaryzacji Operatora na słowo; prześledziłem każdą ścieżkę w źródle.

- **Ścieżka gracza** — `createQualifier`: `owce` przez `isOwceBaseTerrain`, `bydlo`/`lama`
  przez usunięcie warunku z gałęzi `switch`. Potwierdzone tabelą prawdy.
- **Automat gracza** — `game/auto-improvements.ts:348` woła `buildImprovementQualifier`.
  Ta sama funkcja, zero własnej logiki terenu.
- **AI CYWILIZACJI** — `game/ai.ts` `planCityImprovements` → `pickAutoImprovements`,
  czyli **ten sam** kwalifikator. `grep` po `ai.ts` za `owce|bydlo|lama|Nakladka.Las|Wzgorza`
  nie pokazuje żadnej własnej reguły terenu hodowli. **Brak asymetrii gracz / automat gracza /
  AI CYWILIZACJI** — trzy ścieżki dzielą jedno źródło prawdy.
- **Gate commitu poza panelem** — `computeImprovementBuildImpact` (`improvement-build.ts:431`)
  i `main.ts:11709`; oba przez wspólny `isImprovementBlockedOnForest`, więc podążają za zmianą
  bez edycji `main.ts`. To potwierdza, że `main.ts` **nie musiał** być ruszony.
- **`galleryTerrainEligible`** — funkcja w ogóle nie przyjmuje nakładki (tylko teren), a `owce`
  → Wzgórza, `bydlo` → FLAT_FARM, `lama` → `TERRAIN_ALLOW.lama` już były poprawne.
  Twierdzenie Operatora „poprawka niepotrzebna" **potwierdzone odczytem źródła**.
- **Save/load** — sprawdzone, nie założone: `migrateImprovementLayers`
  (`game/terrain-improvements.ts:49`) migruje **wyłącznie** stare klucze `kopalnia`; nie ma
  żadnego stripowania po lesie. Zmiana tylko **luzuje** regułę, więc żaden zapis nie staje się
  nielegalny. **Luki save/load brak.**
- **Wyrąb** — `stripImprovementsWhenForestRemoved` filtruje po
  `FOREST_DEPENDENT_IMPROVEMENT_KEYS`, w którym hodowli nie ma → hodowla po wyrębie zostaje.
- **Martwa gałąź hintu** — `getImprovementForestBlockHint` straciła gałąź hodowlaną. Jedyne
  wywołanie (`main.ts:11710`) jest strzeżone przez `isImprovementBlockedOnForest`, który dla
  tych trzech kluczy zwraca teraz `false` → gałąź była faktycznie nieosiągalna. Żaden test
  tekstowy nie pilnował starego napisu (sprawdzone `grep`). Dla `stadnina` zdanie ogólne
  „najpierw wyrąb las" jest **poprawną** radą — mój pomiar pokazuje 558 pól stadniny poza
  lasem przy odblokowanym koniu, więc po wyrębie ulepszenie realnie się kwalifikuje.

## 5. Dane (kryterium 3)

`owce.teren` = „Wzgórza (także z nakładką Las)", `owce.warunek` zaczyna się od realnej reguły
(„solo wzgórze — otwarte LUB z nakładką Las"), a zakaz z 2026-07-29 występuje już tylko jako
**cytat oznaczony `COFNIĘTY 2026-08-27`**. To jest dokładnie wzorzec, który dispatch kazał
powtórzyć za farmą — `farma.warunek` tak samo trzyma uchylony zapis w cudzysłowie. Analogiczny
ślad dopisany przy `bydlo` i `lama`; `stadnina` dostała jawne „nakładka Las NADAL zabroniona".

Dwie uwagi bez wagi blokującej:

1. Dosłowny ciąg „nakładka Las zabroniona" **nadal występuje** w `owce.warunek` (w cudzysłowie,
   jako historia). Asercja bramki celuje w `'nakładka Las zabroniona)'` — **z nawiasem
   zamykającym**, czyli w tę frazę w roli warunku, nie cytatu. Działa, ale jest krucha:
   przeredagowanie interpunkcji w tym polu może ją cicho rozbroić.
2. Pole `warunek` jest **widoczne dla gracza** (`improvementAdapter.ts:128`, wiersz „Warunek"
   w karcie CivPedii) i teraz niesie identyfikatory procesu oraz cytaty ECHO. To jednak
   **konwencja zastana w tym repo** (tak wyglądają już `farma` i `oboz_lowiecki`), a nie regres
   wprowadzony tym tematem — zgłaszam jako obserwację produktową, nie jako usterkę tematu.

## 6. Nietautologiczność — pięć mutacji WŁASNYCH (kryterium 6)

Mutacje nakładane na **kopię** źródła (`HODOWLA_SRC_DIR`), worktree nietknięty. Kontrola
przed i po każdej serii: 100/0.

| # | Mutacja | Wynik bramki |
|---|---|---|
| M0 | kopia bez mutacji (kontrola) | 100 / 0 |
| M1 | `isOwceBaseTerrain`: `Las → false` (rewers zmiany owiec) | **89 / 11 FAIL** |
| M4 | przywrócony `&& nakladka !== Las` w gałęzi `bydlo` | **94 / 6 FAIL** |
| M5 | przywrócony `&& nakladka !== Las` w gałęzi `lama` | **94 / 6 FAIL** |
| M6b | rewers danych: `owce.warunek` + `owce.teren` z powrotem do zakazu | **96 / 4 FAIL** |
| M3 | usunięcie `'owce','bydlo','lama'` z `FOREST_COEXIST_IMPROVEMENT_KEYS` | 100 / 0 (zielona) |

Dodatkowo **cała bramka gałęzi uruchomiona na źródle bazowym** (`HODOWLA_SRC_DIR` →
`wt-ev-hodowla-base/gra/src`) czerwieni się natychmiast (3 × FAIL, potem twardy `TypeError`
na nieistniejącym `isStadninaBlockedOnForest`). Bramka realnie odróżnia stare źródło od nowego.

**M3 zasługuje na osobne zdanie.** Dopisanie trzech kluczy do `FOREST_COEXIST_IMPROVEMENT_KEYS`
jest **behawioralnie obojętne** — po jego usunięciu bramka nadal jest zielona. To nie jest
zarzut: Operator **sam to napisał** w komentarzu w kodzie („Zachowanie … jest dla tych trzech
kluczy identyczne w obu wariantach"), a ja to potwierdziłem pomiarem. Wpis jest udokumentowaną
redundancją czytelnościową, nie ukrytą zmianą zachowania. Warto natomiast wiedzieć, że przez
ten wpis predykat `isStadninaBlockedOnForest` jest dla owiec/bydła/lamy **zamaskowany** —
dlatego mutacja rozszerzająca go z powrotem na całą hodowlę dała tylko 1 FAIL (M2), a nie więcej.

## 7. Bramki — uruchomione własną ręką

Pięć bramek referencyjnych na gałęzi:

```
logic-test         213/213 OK
tech-tree-test     19 pass, 0 fail
research-test      33/33 ALL GREEN
unit-replace-test  13/13 zielone
combat-test        6/6 pass
```

`node ./node_modules/typescript/bin/tsc --noEmit` → **0 błędów**.
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-hodowla-las-ev --emptyOutDir`
→ **OK, 848 modułów, 23.80s**.

Bramki tematu i sąsiednie, **gałąź vs baseline `9015380b`**:

| Bramka | baseline | gałąź |
|---|---|---|
| `map-improvement-qualify-test` | 117 / 0 | **126 / 0** |
| `oboz-lowiecki-las-test` | 91 / 0 | 91 / 0 |
| `farma-nie-w-lesie-test` | 136 / 0 | 136 / 0 |
| `hodowla-las-test` (nowa) | — | **100 / 0** |

**Bramki, których Operator nie raportował, a które dotykają tej samej warstwy** — uruchomiłem
je, żeby zamknąć pytanie o regres automatu i AI CYWILIZACJI. Wszystkie zielone na obu drzewach:

```
ai-improvements-test                52 passed, 0 failed
auto-improvements-test              45 passed, 0 failed
improvement-territory-gate-test      6 pass, 0 fail
pending-improvements-test            8 pass, 0 fail
improvement-card-callsites-test     36 pass, 0 fail
improvement-adapter-resource-note-test  74 pass, 0 fail
```

**Znalezisko Operatora potwierdzone:** `food-hodowla-test` daje **20 OK / 4 FAIL identycznie
na `9015380b` i na gałęzi**. Uruchomiłem na obu drzewach. Regres **nie pochodzi** z tego
tematu, nie jest w kryteriach końca; zgłoszenie Operatora jest uczciwe i zasadne.

## 8. Uwagi (nie blokują integracji)

1. **BRAK DOWODU — warstwa wizualna.** `main.ts` `foodOnForest` obejmuje tylko `farma` i
   `bydlo`, więc bydło na lesie chowa kępę lasu, a owce i lama jej nie chowają. `main.ts` jest
   **poza allowlistą**, więc Operator słusznie tego nie ruszał. **Ja również nie weryfikowałem
   tego w przeglądarce** — zgłaszam jako BRAK DOWODU, nie jako „wygląda źle" ani „wygląda
   dobrze". Zielone bramki tego nie pokrywają. Wymaga osobnego tematu z oględzinami na żywo.
2. **Luka tooltip ↔ silnik (poszerzona, nie stworzona).** W
   `ui/hexContextTooltip.ts:461-463` filtr brzmi `key === 'bydlo' && nakladka !== ZlozeBydla`
   (analogicznie owce/lama). Nakładka jest **jednowartościowa**, więc na heksie z Lasem hodowla
   nigdy nie pojawi się w tooltipie, mimo że silnik ją teraz dopuszcza. Luka istniała wcześniej
   (na `nakladka = Brak` też nie pokazuje), ale ten temat dokłada do niej ~926 zalesionych
   heksów na moich ziarnach. Naprawa to zmiana **logiki** filtra, a allowlista dopuszcza w
   `gra/src/ui/**` wyłącznie **teksty** — poprawnie zostawione poza zakresem (§14).
3. **`demoKeysForHex` (`main.ts:12031`) nieaktualny.** Dla `Nakladka.Las` zwraca
   `['farma','tartak','oboz_lowiecki','droga']` — wymienia `farma`, która od 2026-08-27 jest
   w lesie **zabroniona**, i nie zna hodowli. Jest to nieaktualność wobec **dwóch** tematów
   z tego samego dnia, poza allowlistą. Zgłoszenie Operatora potwierdzam.
4. **Decyzja zakresowa: `stadnina`.** Operator zawęził predykat do stadniny zamiast kasować
   funkcję, bo `stadnina` wpadła w zakaz z 2026-07-29 **pochodną definicji**
   (`surowiecOdblokowany = 'kon'` ⊂ `LIVESTOCK_SUROWIEC_KEYS`), a ECHO „wszystkie trzy"
   wymienia owce/bydło/lamę. **Zgadzam się z tym wyborem** i potwierdzam, że nie jest
   kosmetyczny: zmierzyłem wariant kontrfaktyczny (mutacja M7, zakaz stadniny zdjęty) —
   stadnina dostałaby **856 nowych pól leśnych** na moich 6 ziarnach, dokładnie tyle co bydło.
   Rozstrzygnięcie należy do właściciela; **nie blokuje** integracji, bo stan obecny zachowuje
   regułę sprzed tematu.

## 9. Zgodność GOAL (§16a.9)

`GOAL` w raporcie Operatora jest **zgodny co do treści** z `GOAL` z `00-dispatch.md`, ID tematu
identyczne we wszystkich artefaktach, a nazwane kryteria odpowiadają dziewięciu z dispatchu.
Rozbieżności utraty kontekstu **nie stwierdzam**.

---

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1
GOAL: Hodowla zwierzeca (owce, bydlo, lama) przestaje byc zakazana na heksach z nakladka Las;
      kazda kwalifikuje sie wg wlasnej reguly terenu bazowego, reszta kwalifikacji bez zmian.
ZMIANY/COMMIT: ocenialem galaz autobot/R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1 @ 9a0f5789
      (e2760aca silnik+dane+bramki, 9c82378c usuniecie tautologii, 9a0f5789 raport Operatora).
      Diff 6 plikow, KAZDY w allowliscie; main.ts, gra/src/ui/** i dyspozycje/WERSJE.md
      nietkniete. git status pusty, HEAD == origin — praca w commitach i wypchnieta.
      Wlasny wklad Evaluatora: dyspozycje/autobot/runs/<ID>/02-evaluator.md.
TESTY: PIEC BRAMEK REFERENCYJNYCH wlasna reka: logic 213/213 · tech-tree 19/0 · research 33/33 ·
      unit-replace 13/13 · combat 6/6. tsc --noEmit 0 bledow. vite build --outDir
      /tmp/civ-dist-hodowla-las-ev OK (848 modulow, 23.80s).
      BRAMKI TEMATU galaz vs baseline 9015380b zmierzony przeze mnie:
      map-improvement-qualify 117/0 -> 126/0 · oboz-lowiecki-las 91/0 -> 91/0 ·
      farma-nie-w-lesie 136/0 -> 136/0 · hodowla-las-test 100/0 (nowa).
      BRAMKI SPOZA RAPORTU OPERATORA (warstwa automatu i AI CYWILIZACJI), zielone na obu
      drzewach: ai-improvements 52/0 · auto-improvements 45/0 · improvement-territory-gate 6/0 ·
      pending-improvements 8/0 · improvement-card-callsites 36/0 ·
      improvement-adapter-resource-note 74/0.
      POMIAR WLASNA METODA #1 — wyczerpujaca tabela prawdy 7040 komorek (22 klucze x 8 terenow
      x 8 nakladek x 5 profili cyw./epoki), galaz vs baseline: ZMIENIONYCH 18, wszystkie
      false->true, WSZYSTKIE na nakladce las, wylacznie bydlo(8)/owce(4)/lama(6);
      ZMIAN POZA LASEM: 0. stadnina/farma/irygacja/tarasy/oboz_lowiecki/tartak/wyrab: 0 zmian.
      POMIAR WLASNA METODA #2 — 6 ziaren WLASNYCH (11111,60606,1234567,8080,2718281,55555),
      926 heksow z lasem: owce 0->70 {Wzgorza}, bydlo 0->856 {Laka 836, Rownina 20},
      lama 0->70 {Wzgorza}, stadnina 0->0; kolumna POZA LASEM identyczna przed i po
      (109/558/245/558) — kryterium 5 potwierdzone dwiema niezaleznymi drogami.
      NIETAUTOLOGICZNOSC — 5 mutacji wlasnych: M1 rewers owiec 11 FAIL · M4 rewers bydla 6 FAIL ·
      M5 rewers lamy 6 FAIL · M6b rewers danych owce 4 FAIL · cala bramka na zrodle bazowym
      czerwona. M3 (usuniecie 3 kluczy z FOREST_COEXIST) zielona — potwierdza wprost
      udokumentowane przez Operatora twierdzenie, ze ten wpis jest behawioralnie obojetny.
      SAVE/LOAD: sprawdzone w zrodle, nie zalozone — migrateImprovementLayers migruje wylacznie
      stare klucze `kopalnia`, zero stripowania po lesie; zmiana tylko luzuje regule. Luki brak.
      PARYTET: gracz, automat gracza i AI CYWILIZACJI dziela JEDEN kwalifikator
      (auto-improvements.ts:348 i ai.ts planCityImprovements -> pickAutoImprovements ->
      buildImprovementQualifier); ai.ts nie ma wlasnej reguly terenu hodowli. Asymetrii brak.
      POTWIERDZONE ZNALEZISKO OPERATORA: food-hodowla-test 20 OK / 4 FAIL IDENTYCZNIE na
      9015380b i na galezi — regres NIE pochodzi z tego tematu, nie jest w kryteriach konca.
BLOKADY: brak blokad integracji. Do wiadomosci/decyzji wlasciciela (NIE blokuje):
      (1) BRAK DOWODU wizualnego — foodOnForest w main.ts obejmuje tylko farma+bydlo, wiec
          bydlo na lesie chowa kepe lasu a owce/lama nie; main.ts POZA allowlista, JA TEZ NIE
          weryfikowalem w przegladarce — to jest brak dowodu, nie ocena wygladu;
      (2) luka tooltip<->silnik POSZERZONA (nie stworzona): hexContextTooltip filtruje hodowle
          po zlozu, wiec na lesie jej nie pokaze mimo zgody silnika; naprawa = zmiana LOGIKI,
          a allowlista dopuszcza w gra/src/ui/** tylko TEKSTY — slusznie poza zakresem (§14);
      (3) demoKeysForHex (main.ts:12031) nieaktualny wobec DWOCH tematow z 2026-08-27 —
          zwraca `farma` dla Lasu mimo zakazu i nie zna hodowli; poza allowlista;
      (4) stadnina zostawiona zabroniona — ZGADZAM SIE z ta decyzja; zmierzylem wariant
          kontrfaktyczny: zdjecie zakazu dodaloby 856 pol lesnych na 6 ziarnach (tyle co bydlo),
          wiec to realna zmiana balansu wymagajaca osobnego ECHO, nie kosmetyka;
      (5) drobne: asercja JSON celuje we fraze z nawiasem zamykajacym („…zabroniona)") — dziala,
          ale jest krucha na przeredagowanie interpunkcji w polu `warunek`.
RUNDY: 1/5
NASTEPNY KROK: Final Control (Opus 5, effort high) — kontrola kompletnosci sladu, zgodnosci
      z GOAL i gotowosci do integracji; nastepnie integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO (Evaluator nie integruje, nie deployuje; push wylacznie galezi tematu
      z wlasnym raportem 02-evaluator.md).
```

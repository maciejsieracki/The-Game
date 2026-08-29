```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-ZELAZO-AUDYT-POZOSTALE-Q1-T8
GOAL: Audytować dwie jednostki germańskie — Berserker germański i Wojownik germański
      (SUPER) — z realnym pomiarem geometrii i widoczności z kamery gry, naprawą
      defektów, sekcjami ZGODNOŚĆ HISTORYCZNA i testem real-render z dowodem
      nietautologiczności. Zgodny z 00-dispatch.md, bez dryfu (§16a poz. 9).
MODEL WYKONAWCY (Evaluator): Opus 5, ID `claude-opus-5[1m]` — odczytane z opisu
      środowiska tej sesji, nie z założenia. Dispatch wymaga Opus 5 High (§5a,
      wyjątek graficzny). Model się zgadza. POZIOMU EFFORT nie da się odczytać ze
      środowiska — zgłaszam jako NIEZWERYFIKOWANY, nie jako spełniony (tak samo
      zrobił Operator; to znany gap C-061, nie wada tej pracy).
ZMIANY/COMMIT: 82bdb90729aeee8472da8d41b14f956389bafd37, merge-base == origin/main
      (e799231c) — czysty fast-forward, §9 poz. 9 spełnione.
TESTY: wszystko uruchomione przeze mnie, we WŁASNYM worktree
      /home/user/wt-eval-ZELAZO-AUDYT-T8, nie odczytane z raportu.
BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: Final Control (Sonnet 5 High) — z 3 mikro-poprawkami tekstu (U1-U3).
DEPLOY/PUSH: NIE WYKONANO.
```

## 1. Zakres — mieści się, z jedną rozbieżnością literalną (opisaną w §6)

`git diff origin/main..HEAD --stat`: 3 pliki, wszystkie w allowliście.
`jednostki-z3-plemiona.ts` (+607), `units.ts` (+10/−3), nowy
`tools/zelazo-germanie-real-render-test.cjs`. **`gra/data/**` bez ani jednej
zmienionej linii** (zweryfikowane `git diff --stat -- gra/data` = pusty).
`git diff --check` czysty, brak sekretów (jedyne trafienie skanu to
`userData['perTokenGeos']` — podciąg „token"). `units.ts` = dokładnie 10 linii:
import aliasu + 2 linie dispatchu + komentarze; policzyłem, zgadza się.
**Żadna funkcja nie została usunięta** — diff list funkcji main↔gałąź daje wyłącznie
dodania. Brak nakładki z innym tematem (`git worktree list` = tylko Operator i ja).

## 2. Berserker bez zbroi/tarczy — POTWIERDZONE pomiarem, nie deklaracją

`units.json` odczytany przeze mnie bezpośrednio: `Pancerz = 0`, `Atak dystansowy = 0`,
`Super-jednostka = —`, Uwagi „obnażona pierś, skóra wilka/niedźwiedzia (łeb zwierzęcia
na głowie), topór lub miecz, **bez tarczy**". Model: 30 nazwanych mesh, **ani jednego**
pasującego do `shield|helmet|mail|cuirass|armour|greave|boss`; `anchors.shieldKind /
helmetKind / armorKind` = `'none'`. Zgodne co do joty.

## 3. Wojownik germański w pozie rzutu — POTWIERDZONE

`units.json`: `Atak dystansowy = 4`, `Zasięg 2`, `Ilość pocisków = 4`, Uwagi mówią
wprost „germański wojownik **z frameą** (krótka włócznia do pchnięcia i rzutu)".
Model po T8: `gw-framea-shaft/socket/head`, **zero** mesh `sword|blade`,
`anchors.missileKind = 'framea'`. Oś broni zmierzona przeze mnie:
**(0, 0.9292, −0.3696)** — w górę i w tył, jak twierdzi komentarz. 607 pikseli
z kamery gry. Chwyt w punkcie równowagi (drzewce wystaje za dłoń). Przed T8 był
tam długi miecz `0.026 × 0.210 × 0.013` i **żadnej** broni miotanej — potwierdziłem
na `origin/main`.

## 4. Czy Operator faktycznie mierzył — TAK. Odtworzyłem jego liczby co do cyfry

Kamerę odczytałem sam z `src/render/camera.ts`: `yaw = 0`, `degToRad(52)`. Zbudowałem
**własny** skrypt pomiarowy (esbuild + Chromium, OBB/SAT/rzut ekranowy liczone od zera)
i uruchomiłem go osobno na `origin/main` i na gałęzi.

| Twierdzenie z komentarza/raportu | Mój niezależny pomiar |
|---|---|
| B1 pięść 0.0487 od osi toporzyska | **0.0487** ✓ |
| B1 szczelina w X 0.0055, SAT pięść×toporzysko 0.0000 | **0.0055 / 0** ✓ |
| B2 dół kaptura 0.4900, góra oka 0.5325, SAT 0.0095 | **0.4900 / 0.5325 / 0.0095** ✓ |
| B2 oczy 0 pikseli | oko w całości **zamknięte wewnątrz** bryły kaptura → 0 ✓ |
| B3 minY −0.0005 | **−0.0005** ✓ |
| B4 obie osie ramion (0,1,0) | **(0,1,0) / (0,1,0)** ✓ |
| B5 0/23 nazwanych, brak anchors | **0/23, anchors null** ✓ |
| G2 środek głowy 0.5370, czubek hełmu 0.6290 | **0.5370 / 0.6290** ✓ |
| G3 0/37 nazwanych | **0/37** ✓ |
| PO: chwyt 0.032, oś 0.0000, oczy 60 px (Thorakites 14, Falangita 6) | **0.032 / 0 / 60, 14, 6** ✓ |
| kufa 0.042 przed licem kaptura (0.0575 → 0.0995) | **0.042** ✓ |
| żeleziec 0.070 × 0.120, grot 0.024 × 0.072 × 0.011 | ✓ ✓ |

**Dwa najbardziej falsyfikowalne twierdzenia sprawdziłem przez odtworzenie eksperymentu,
nie przez odczyt:**

- „futrzany płaszcz na plecach dał **0 pikseli**" (K6, decyzja *odrzucona* zapisana
  w kodzie) — dopisałem płytę futra za torsem gsup i policzyłem: **1 mesh, 0 widocznych
  pikseli.** Dokładnie jak twierdzi komentarz.
- „framea po osi przedramienia wchodziła w ramię na **0.0164**" — podmieniłem
  `TH_W = TH_ARM` i zmierzyłem SAT: **0.0164.** Co do cyfry.

To jest mocna strona tej paczki: Operator zapisał w kodzie liczby, które dają się
odtworzyć obcym narzędziem — łącznie z liczbą uzasadniającą **rezygnację** z cechy.

## 5. Brak regresji sąsiadów — dowód empiryczny, nie obietnica

Helpery dostały parametry z domyślną wartością pustą, więc kluczowe było sprawdzenie
skutku, nie intencji. Zmierzyłem trzech sąsiadów poza zakresem **przed i po**:

| | mesh | nazwane | minY | maxY |
|---|---|---|---|---|
| Drużynnik | 32 → 32 | 0 → 0 | 0 → 0 | 0.6540 → 0.6540 |
| Miecznik galijski | 35 → 35 | 0 → 0 | 0 → 0 | 0.7230 → 0.7230 |
| iButho z Iklwa | 37 → 37 | 0 → 0 | 0 → 0 | 0.7861 → 0.7861 |

Identyczne. Intencja allowlisty („nie ruszać T9/T10") jest spełniona **faktycznie**.

## 6. Rozbieżność dispatchu — moja ocena

Allowlista mówi „WYŁĄCZNIE funkcje `buildBerserker()`, `buildGermanSuper()`", a zmiany
dotknęły też `trSeg/trBuildLeg/trBuildArm/trCore/trSuperBanner` oraz stałych i cache'u
geometrii. **Literalnie to wyjście poza brzmienie.** Nie uznaję tego za naruszenie
wymagające rundy, i mówię wprost dlaczego:

1. `buildBerserker()` **nie istniał** w allowlistowanym pliku — dispatch był
   niewykonalny literalnie przez żadną implementację. To wada dispatchu, nie Operatora.
2. Operator **nie obszedł tego po cichu** — zgłosił jako §1 raportu, przed wynikami.
3. Wybrał wariant o **mniejszym** śladzie: alternatywa (naprawa `buildBaseAvatar()`)
   dotyka kilkudziesięciu modeli `units.ts`.
4. Ochronny sens zapisu (Drużynnik/galijski/iButho) jest **udowodniony pomiarem** (§5).
5. Wzorzec (parametr z domyślną wartością pustą) jest ten sam, który przeszedł w T6/T7.

Do rejestru: **dispatche T9/T10 powinny nazywać funkcje, które faktycznie istnieją
we wskazanym pliku** — inaczej ten sam konflikt wróci.

## 7. Sekcja historyczna — rzetelna, anachronizmy nazwane, nie ukryte

Sprawdziłem cytaty i datowania. Germania 4 („rutilae comae"), 6 („rari gladiis…
frameas… angusto et brevi ferro… vel comminus vel eminus", „paucissimis loricae, vix uni
alterive cassis aut galea"), 13 („scutum reliquisse praecipuum flagitium"), 17
(„tegumen omnibus sagum…", „gerunt et ferarum pelles"), 31 (Chattowie, żelazny
pierścień), 38 (węzeł swebski), 43 (Hariowie, „nigra scuta, tincta corpora… feralis
exercitus") — wszystkie oddane wiernie. Ynglinga saga 6, Haraldskvæði/Hrafnsmál ~900,
Hjortspring ~350 p.n.e. (~138 grotów / 11 mieczy), Nydam, Illerup, Torslunda VI–VII w.,
Osterby — datowania i proporcje zgodne ze stanem badań.

Co najważniejsze dla tej roli: **anachronizmy są nazwane, nie przemilczane** — nazwa
„berserkr" jako staronordycka (~1000 lat po jastorfie), wilczy wojownik z Torslundy jako
późniejszy, topór jako marginalny w znaleziskach i **jawnie nie-francisca**, spirala
i pleciona broda jako stylizacje. Prostowanie mitu (rudy odcień mumii bagiennych =
kwasy torfowiska, dowodem jest zdanie Tacyta) jest merytorycznie poprawne. Rogate hełmy
odrzucone słusznie.

## 8. Testy — wszystko uruchomione przeze mnie

**Temat:** `zelazo-germanie-real-render-test` → **80 pass / 0 fail**. Macierz ablacyjna
odtworzona: wiersz BAZA w całości zielony, M0 potwierdza 1 trafienie na mutację,
**każda z H1–H16 czerwienieje pod swoją pojedynczą mutacją** — dowód
nietautologiczności per-asercja jest ważny.

**Bramki §6** (wszystkie zgodne z wartościami referencyjnymi):
`tsc --noEmit` binarką z `node_modules` → **0 błędów**; logic **213/213**; tech-tree
**19/19**; research **33/33 ALL GREEN**; unit-replace **13/13**; combat **6/6**;
unit-power **4 pass / 2 fail** — uruchomiłem tę bramkę **także na `origin/main`**
i tam też jest 4/2, więc **potwierdzone jako pre-istniejące, nie regresja**.

**Seria T1–T7, bez regresji:** gate 24/24, mezopotamia 72/0, śródziemnomorze 83/0,
falanga 40/0, celtowie 42/0, jeździec-oszczepami 57/0, konnica-asyryjska 31/0,
super-rzym-grecja 92/0. Wszystkie liczby zgadzają się z raportem Operatora.

**C-001:** `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-eval-t8-dist
--emptyOutDir` → czysto, exit 0, 848 modułów. Nigdy `npm run build`, nigdy `npx`,
katalog wyjściowy poza drzewem repo. **Granica §9 poz. 1 zachowana.**

**Weryfikacja wizualna (§9 poz. 6a):** własny zrzut z żywego Chromium, powiększony.
Berserker: goły tors, barwnik w kolorze gracza, łeb wilka z uszami, **widoczne oczy**,
brak tarczy i hełmu, topór czytający się jako topór (nie młot). Wojownik germański:
framea pionowo grotem w górę, tarcza ze spiralą zwrócona do kamery, chorągiew po
przeciwnej stronie — dwa słupy rozdzielone, nie nakładają się.

**Odróżnialność:** próg `PROG_PARA = 0.558` jest w pliku **jeden i bez wyjątku** —
sprawdziłem `grep`, luźniejszego 0.550 nie ma (Operator zgłosił, że przejściowo go
dodał i usunął; potwierdzam, że w oddanym kodzie go nie ma). bers/gsup **0.817**,
gsup/galij **0.587**, kontrola miary (ten sam model ze sobą) **0.0000**.

## 9. Znaleziska — pełna lista, jawnie

**U1 (kosmetyczna, raport + commit).** Raport i komunikat commita mówią o Berserkerze
„**29/29** nazwanych mesh". Faktycznie jest **30/30** — policzyłem w kodzie
(5 trCore + 2 barwnik + 3 skóra/przepaska/pas + 6 nóg + włosy + 4 wilk + 3 ramię prawe
+ 3 topór + 3 ramię lewe) i zmierzyłem na żywym modelu. Liczba **nie występuje**
w komentarzach kodu, tylko w raporcie i commicie.

**U2 (mikro-poprawka komentarza).** Nagłówek `buildGermanSuper`, punkt G2: „najwyższy
punkt klingi y = **0.4800**". To jest koniec klingi **wzdłuż jej własnej osi**;
najwyższy punkt jej bryły OBB to **0.4862**. Wniosek nośny („klinga nigdy nie była nad
głową, leżała w całości poniżej środka głowy" — 0.4862 < 0.5370) **pozostaje prawdziwy**.
To niedokładność konwencji pomiaru o 0.006, nie fałsz.

**U3 (mikro-poprawka komentarza — klasa T5/T6/T7).** Nagłówek testu: „każdy bundel M*
… musi zaczerwienić **DOKŁADNIE swoją** asercję". Literalnie nieprawda: M1 czerwieni
H1+H2+H3, M10 sześć, M16 dziewięć. **Egzekwowana** asercja `(M1)` jest sformułowana
w poprawnym kierunku („każda z H1–H16 czerwienieje pod swoją pojedynczą mutacją"),
a pełna macierz jest drukowana, więc **nic nie jest ukryte** — ale zdanie w komentarzu
mówi więcej, niż jest prawdą. To samo zdanie powtarza się w §5 raportu Operatora.

**U4 (dla orkiestratora, §4/§16b).** `dyspozycje/autobot/runs/R-ZELAZO-AUDYT-POZOSTALE-Q1-T8/`
zawiera **wyłącznie** `00-dispatch.md` — brak `01-operator.md`. Dokładnie ta sama luka,
którą T7 musiał uzupełniać osobnym commitem (d8982342).

**U5 (zakres).** Opisane w §6 — rozbieżność literalna, sens spełniony, zero wpływu
udowodnione pomiarem, zgłoszona przez Operatora z własnej inicjatywy.

**U6 (obserwacja, poza zakresem T8).** Cała rodzina Z3 buduje kończyny w płaszczyźnie
YZ, więc tylna (−X) noga rzutuje się na ekran w rozpiętości ~0.046 wobec ~0.159 nogi
przedniej — wygląda jak skrócona. U Berserkera rzuca się w oczy, bo nogi są **bose**;
kąty nóg Wojownika germańskiego T8 **nie zmienił**, a on ma to samo. **Stan zastany
rodziny, nie defekt T8.** Kandydat na osobny temat serii.

**U7 (drobiazg filologiczny).** Dwa cytaty lekko skrócone bez zaznaczenia elipsy:
„scuta lectissimis coloribus distinguunt" (tekst przekazany: „scuta **tantum**
lectissimis…") oraz „aut nudi aut sagulo leves" („**et** nudi aut sagulo leves").
Sens obu zachowany.

**Zgłoszenia Operatora poza zakresem — potwierdzam zasadność wszystkich trzech:**
rozjazd w `units.json` (Wojownik germański: `Epoka = Żelazo`, ale `Dostępna w epokach
= Brąz`) **sprawdziłem w danych — jest**; galij/Drużynnik 0.509 i galij/Hastati 0.526
poniżej progu **na dzisiejszym main, niezależnie od T8** — potwierdzam; martwe
`buildBerserker()`/`buildGermanWarrior()` w `units.ts` — porządek kodu.

## 10. Werdykt i klasyfikacja uwag (§3b)

**PASS-WITH-NOTES.** Klasyfikuję jawnie: **żadna z uwag nie dotyczy kryterium `GOAL`,
dowodu wykonania, granic nienaruszalnych §9 ani gotowości do integracji.**

- Wszystkie 7 kryteriów sukcesu z dispatchu spełnione i zweryfikowane niezależnie.
- Granice §9: poz. 1 (build binarką do /tmp) ✓, poz. 2 (`git add` per plik, brak `-A`) ✓,
  poz. 3 (brak sekretów) ✓, poz. 4 (zero zmian procesu) ✓, poz. 5 (`WERSJE.md`
  nietknięty) ✓, poz. 6a (żywa przeglądarka + nietautologiczność) ✓, poz. 8
  (brak deploya/pusha do main) ✓, poz. 9 (merge-base == origin/main) ✓.
- **U5** jest jedyną uwagą dotykającą zakresu — i jest wadą **dispatchu**, nie pracy
  Operatora: literalne spełnienie było niemożliwe, wybrano wariant o najmniejszym
  śladzie, zgłoszono jawnie, brak wpływu udowodniono pomiarem. **Nie żądam rundy**,
  bo nie istnieje poprawka, która by cokolwiek poprawiła — cofnięcie parametrów
  helperów oznaczałoby duplikację pięciu funkcji, czyli kod gorszy.
- **U1–U3** to mikro-poprawki tekstu (jedna liczba w raporcie/commicie, dwa zdania
  w komentarzach), dokładnie tej klasy, którą Final Control T7 załatwił własnym
  mikro-commitem 6c9fe7cc, nie zwrotem do Operatora. **Rekomenduję ten sam tryb.**
- **U4** to obowiązek artefaktowy orkiestratora/Final Control, nie Operatora.
- **U6, U7** — kosmetyczne/informacyjne, do rejestru.

**Gotowość do integracji: TAK**, po (a) mikro-poprawce U1–U3 i (b) uzupełnieniu
run-trailu U4. Jeśli Final Control uzna, że U5 musi jednak być traktowane jako
naruszenie zakresu w brzmieniu — ma podstawę formalną, żeby mnie nadpisać; podałem
wyżej pełne uzasadnienie, dlaczego oceniam inaczej.

**Artefakty mojej weryfikacji:** worktree `/home/user/wt-eval-ZELAZO-AUDYT-T8`
(czysty; podlinkowałem do niego `gra/node_modules` symlinkiem — do usunięcia przy
sprzątaniu, `git status` go nie widzi). Skrypty i wyniki:
`/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/eval-measure.cjs`,
`.../eval-claims.cjs`, `.../t8-test.log`, zrzuty `.../eval-shots/`, `.../zoom-bers.png`,
`.../zoom-gsup.png`; surowe pomiary `/tmp/eval-t8-PRZED/result.json`
i `/tmp/eval-t8-PO/result.json`.
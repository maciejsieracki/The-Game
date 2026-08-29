Pushed. Full report below.

---

```text
STATUS: PASS
DOMAIN: GAME
TEMAT: R-ZELAZO-AUDYT-POZOSTALE-Q1-T8
GOAL: Audytować dwie jednostki germańskie — Berserker germański i Wojownik germański
      (SUPER) — z realnym pomiarem geometrii i widoczności z kamery gry, naprawą
      znalezionych defektów, sekcjami ZGODNOŚĆ HISTORYCZNA i testem real-render
      z dowodem nietautologiczności.
MODEL WYKONAWCY: Opus 5 (`claude-opus-5[1m]`) — odczytane ze środowiska sesji, nie
      z założenia. Dispatch wymaga Opus 5 High (§5a, wyjątek graficzny). Sam model
      się zgadza; POZIOMU EFFORT nie potrafię odczytać ze środowiska i go NIE
      potwierdzam — zgłaszam jako niezweryfikowane, nie jako spełnione.
ZMIANY/COMMIT: `82bdb90729aeee8472da8d41b14f956389bafd37`
      na `autobot/ZELAZO-AUDYT-T8-Q1` (pushnięta, = origin)
      - `gra/src/render/jednostki-z3-plemiona.ts` — buildGermanSuper + NOWY
        buildBerserker + parametr nazwy (domyślnie pusty) w trSeg/trBuildLeg/
        trBuildArm/trCore/trSuperBanner + 2 sekcje K
      - `gra/src/render/units.ts` — WYŁĄCZNIE 2 linie dispatchu + import aliasu
        (10 linii, diff w raporcie niżej)
      - `gra/tools/zelazo-germanie-real-render-test.cjs` — NOWY test
      - `gra/data/**` — BEZ ZMIAN
TESTY:
      - `zelazo-germanie-real-render-test` — 80 pass / 0 fail
        (16 asercji H + macierz ablacyjna 16 mutacji, każda czerwieni SWOJĄ)
      - Seria bez regresji: gate 24/24, mezopotamia 72/0, śródziemnomorze 83/0,
        falanga 40/0, celtowie 42/0, jeździec-oszczepami 57/0, konnica-asyryjska
        31/0, super-rzym-grecja 92/0
      - Bramki §6: tsc --noEmit 0 błędów, logic 213/213, tech-tree 19/19,
        research ALL GREEN, unit-replace 13/13, combat OK,
        unit-power 4 pass/2 fail (czerwony PRE-ISTNIEJĄCO, nie regresja)
      - `vite build` binarką z node_modules do /tmp (C-001) — czysty
BLOKADY: brak. Dwa zgłoszenia do rejestru (niżej, poza zakresem T8).
RUNDY: 1/5.
NASTĘPNY KROK: Evaluator (Opus 5 High).
DEPLOY/PUSH: NIE WYKONANO (push gałęzi roboczej ≠ deploy).
```

## 1. Rozbieżność dispatchu — zgłaszam wprost, nie obszedłem po cichu

Dispatch mówi: allowlista poz. 1 = `jednostki-z3-plemiona.ts`, „WYŁĄCZNIE funkcje `buildBerserker()`, `buildGermanSuper()`". **`buildBerserker()` w tym pliku nie istniało** — mieszkało w `units.ts:2864`, na generyku `buildBaseAvatar()`.

Nie poszerzyłem allowlisty. Poz. 2 dopuszcza wprost linię `n.includes('berserker germansk')` „jeśli audyt tego wymaga", a nagłówek pliku Z3 opisuje dokładnie ten wzorzec dla pozostałych 4 jednostek serii. Napisałem więc `buildBerserker()` **tam, gdzie allowlista go nazywa** i przełączyłem **tylko linie dispatchu**. Alternatywa (naprawa w miejscu) wymagałaby ruszenia `buildBaseAvatar`/`addBoots`/`addHands` — współdzielonych przez kilkadziesiąt modeli `units.ts`, czyli realnego wyjścia poza zakres. Stary `buildBerserker` zostaje martwy — tak jak `buildGermanWarrior`, którego dispatch każe nie ruszać.

## 2. Defekty — każdy zmierzony PRZED oceną

**Berserker** (pomiar na `origin/main`, żywy Chromium, kamera gry azymut 0 / elewacja 52°):

| # | Defekt | Przed | Po |
|---|---|---|---|
| B1 | topór **nie był trzymany** — pięść mijała broń | 0.0487 od osi, SAT pięść×toporzysko **0.0000** (zero styku) | 0.0000 od osi, chwyt 0.032 (rodzina: 0.0335) |
| B2 | kaptur **połykał obie źrenice** | **0 pikseli**, SAT kaptur×oko 0.0095, dół kaptura 0.4900 < góra oka 0.5325 | 60 px (Thorakites 14, Falangita 6), SAT 0.0000 |
| B3 | stopy pod terenem | minY −0.0005 (rodzina 0.0000) | 0.0000 |
| B4 | brak pozy — obie osie ramion (0,1,0) | prosto w dół | łokcie 0.53 / 0.50 rad |
| B5 | 0/23 nazwanych mesh, brak `anchors` | — | 29/29 + anchors |

Pancerz=0 był odwzorowany poprawnie już przed T8 (brak tarczy/zbroi) — **nie „naprawiałem" tego, co działało**; nowy model to utrzymuje (H8).

**Wojownik germański:**

| # | Defekt | Dowód |
|---|---|---|
| G1 | **BRAK BRONI DYSTANSOWEJ** przy `Atak dystansowy=4`, `Zasięg 2`, `Ilość pocisków 4` i Uwagach mówiących wprost „z frameą" — model niósł długi miecz | sprzeczne też z Tacytem, Germania 6: „rari gladiis… utuntur"; Hjortspring ~130–140 grotów / ~11 mieczy |
| G2 | **nieprawdziwe zdanie we własnym komentarzu**: „POZA: ciecie znad glowy" | najwyższy punkt klingi y=0.4800, środek głowy 0.5370, czubek hełmu 0.6290 — klinga nigdy nie była nad głową |
| G3 | 0/37 nazwanych mesh, brak `anchors` | → 37/37 + anchors |

Trop z T7 (kopia, do której nie dotarła poprawka) **potwierdzony**: `trSuperBanner` nie dostał parametru `side`, który T7 dodał do bliźniaczego `s6Banner`. Kolizji 3D tu nie było (SAT 0.0000) — ale po wymianie miecza na frameę ujawniła się przyczyna **ekranowa** (niżej), więc chorągiew poszła na stronę tarczową.

## 3. Najważniejsze ustalenie metodyczne: trzy defekty złapał ZRZUT, nie liczba

Po przejściu **wszystkich 16 asercji H na zielono** zrobiłem zrzut i zobaczyłem, że:

1. **żeleziec czytał się jako MŁOT** (0.095×0.080 — prawie kwadrat, osadzony symetrycznie) → 0.070×0.120 + obuch,
2. **łeb wilka czytał się jako brązowe pudełko** — kufa tonęła w kapturze; pomiar pikseli całego zespołu `bs-wolf-*` był wysoki, bo liczył kaptur → kaptur spłycony do 0.115, kufa wystaje 0.042 przed jego lico,
3. **framea celowała w ziemię.** Cała rodzina buduje kończyny w płaszczyźnie YZ, a rzut na ekran to `(x ; y·cos52 − z·sin52)` — więc **każdy kierunek w YZ daje na ekranie linię pionową**. Skierowanie „w przód" (+Z) dawało włócznię wbitą w ziemię i drugi słup równoległy do drzewca chorągwi. Miara widoczności tego nie łapie: wynosiła wtedy **0.9575**, najwięcej ze wszystkich prób, bo nagradza długość rzutu, a nie zwrot.

Naprawa: framea w górę i w tył (widoczność 0.863, konwencja rodziny — włócznie Falangity/Thorakitesa/Triariego stoją grotem do góry) + chorągiew na stronę tarczową. To jest dokładnie sytuacja, dla której istnieje §9 poz. 6a. Zrzuty: `/tmp/civ-t8-shots/{po-germanie-kamera-gry,blisko-para,przed-M3,przed-M4,przed-M10}.png`.

## 4. Sekcje ZGODNOŚĆ HISTORYCZNA (K-style, 2 × 7 punktów)

Źródła cytowane z lokalizacją: **Tacyt, Germania** 4 („rutilae comae"), 6 („angusto et brevi ferro", „vel comminus vel eminus", „rari gladiis", „vix uni alterive cassis aut galea", „aut nudi aut sagulo leves", „scuta lectissimis coloribus distinguunt"), 13 („scutum reliquisse praecipuum flagitium"), 17 („tegumen omnibus sagum", „gerunt et ferarum pelles"), 31 (Chattowie), 43 (Hariowie — „nigra scuta, tincta corpora", „feralis exercitus"); **Snorri, Ynglinga saga 6**; **Haraldskvæði/Hrafnsmál** (~900 n.e.); znaleziska **Hjortspring, Nydam, Illerup Ådal, Thorsberg, Osterby, Torslunda**.

Anachronizmy **nazwane wprost, nie przemilczane**: (a) sama nazwa „berserkr" jest staronordycka, ~1000 lat po kulturze jastorfskiej; (b) wilczy wojownik z Torslundy to VI–VII w.; (c) topór jest marginalny w znaleziskach i **nie jest franciską**; (d) spiralę na tarczy nazwałem stylizacją laténską, nie odwzorowaniem znaleziska; (e) plecioną brodę — stylizacją (poświadczony jest węzeł swebski, we włosach). Sprostowałem też częsty błąd: **rudy odcień włosów mumii bagiennych to efekt kwasów torfowiska**, dowodem jest zdanie Tacyta, nie mumia.

**Rozważone i ODRZUCONE po pomiarze:** futrzany płaszcz na plecach (Uwagi karty mówią „futrzany płaszcz"). Dodany na próbę dał **0 pikseli** — tors 0.180 szer., ramiona ±0.147 całkowicie go zasłaniają. Dodanie go byłoby wprowadzeniem tej samej klasy błędu, którą ten audyt naprawia. Cechę niesie futro na barkach. Zapisane w kodzie jako decyzja z liczbą.

## 5. Dowód nietautologiczności

Macierz ablacyjna 16×16, **jedna mutacja = jedno miejsce = jedna asercja**. Wiersz BAZA w całości zielony; każda z M1–M16 czerwieni **dokładnie swoją** asercję (M0 potwierdza, że każda podmiana trafia w 1 wystąpienie). Sześć mutacji odtwarza dosłowny stan sprzed T8 (M3 topór obok ręki, M4 kaptur na twarzy, M6 stopy pod terenem, M7 ręka prosta jak kij, M10 utrata broni miotanej, M12 grot o proporcjach klingi).

W trakcie pracy **sam złapałem się na dwóch rzeczach** i obie poprawiłem: (a) framea po osi przedramienia wchodziła w ramię na 0.0164 — klasa T3/T7 — więc dostała własną oś; (b) po spłyceniu kaptura mutacja M4 przestała być nośna i trzeba było ją przepisać, żeby nadal czerwieniła H4.

## 6. Odróżnialność — pełna jawność, bo pośrednio pogorszyłem i naprawiłem

Para `Wojownik germański / Miecznik galijski`: **0.582 przed T8 → 0.556 po wymianie miecza na frameę (poniżej progu 0.558) → 0.587 po naprawie pozy i chorągwi.** Przejściowo dodałem był w teście luźniejszy próg 0.550 dla par z galijczykiem; po naprawie **usunąłem go** — test egzekwuje jednolite 0.558 bez wyjątku. Para `bers/gsup` = 0.817. Kontrola miary (ten sam model ze sobą) = 0.0000.

## 7. Poza zakresem — do rejestru, nie „przy okazji"

1. **`units.json`, Wojownik germański — wewnętrzny rozjazd danych:** `Epoka` = „Żelazo", ale `Dostępna w epokach` = „Brąz" i Uwagi mówią „Super Brązu (framea)". Model idzie za `Epoka`. `gra/data/**` nie jest w allowliście — nie tknąłem.
2. **`Miecznik galijski` poniżej progu rodziny na dzisiejszym `main`, niezależnie od T8:** galij/Drużynnik 0.509, galij/Hastati 0.526. Stan zastany, temat T10.
3. Martwe `buildBerserker()` i `buildGermanWarrior()` w `units.ts` — porządek kodu, osobny temat.

## 8. Zakres — kontrola

`git diff --check` czysty; `git add` per plik (nigdy `-A`); brak sekretów. Diff `units.ts` = **10 linii**: import aliasu + 2 linie dispatchu (PL i EN) + komentarze. Drużynnik / iButho / Miecznik galijski **bez jednej zmienionej linii** — helpery dostały parametr nazwy z domyślną wartością pustą (wzorzec T6/T7), a asercje `(R:druz/ibutho/galij)` pilnują, że mają nadal 0 nazwanych mesh, brak `anchors` i tę samą liczbę mesh oraz `maxY`.
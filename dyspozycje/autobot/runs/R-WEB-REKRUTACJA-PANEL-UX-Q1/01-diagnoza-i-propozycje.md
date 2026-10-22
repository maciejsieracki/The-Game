STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-REKRUTACJA-PANEL-UX-Q1
GOAL: Diagnoza i propozycja (bez zmian w kodzie gry) czytelniejszego panelu „Rekrutacja” w wersji webowej (`gra/`, pin `origin/main` = `c11f5087`).
ZMIANY/COMMIT: tylko `dyspozycje/autobot/runs/R-WEB-REKRUTACJA-PANEL-UX-Q1/**` (ten dokument + `makiety/` 4×HTML + 8×PNG); `gra/**` nietknięte.
TESTY: pomiar w headless Chromium (Playwright 1.56.1, `/opt/pw-browsers`), smoke JS makiet: 0 błędów konsoli/pageerror w 4/4 plikach; szczegóły w §3. Runda 2: dodatkowy pomiar przy 280 px i 307 px (§3.2b).
BLOKADY: brak. Zmiana kontraktu testów rekrutów (§3.3) wymaga decyzji właściciela — zadaje ją orkiestrator.
RUNDY: 2/5 (odpowiedzi na zarzuty Evaluatora rundy 1 — sekcja „Runda 2” na końcu)
NASTĘPNY KROK: Evaluator → Final Control; potem orkiestrator pokazuje właścicielowi wybór wariantu (ABC) → osobny dispatch implementacyjny.
DEPLOY/PUSH: NIE WYKONANO

Rola: Operator · model: Opus 5.5 medium · data: 2026-10-22 · baza: `origin/main` `c11f5087`.

---

## 1. Diagnoza — jak powstaje obecny układ (plik:linia)

### 1.1 Szerokość panelu — 280–340 px CSS zależnie od okna, nie ~480 px

- `gra/src/ui/hudLayout.ts:21` — `CITY_LEFT_PANEL_W_PX = 340`.
- `gra/src/ui/cityUxFrame.ts:44` — `LEFT_PANEL_W_EXPR = min(24vw, 340px)`; `cityUxFrame.ts:70` — `.civ-ux-left{… width:${LEFT_PANEL_W_EXPR}; min-width:280px}`.
- Wynika z tego (arytmetyka na regule CSS, nie pomiar w grze): panel ma **340 px** dopiero przy oknie ≥ 1417 px CSS (340/0,24), **307 px** przy oknie 1280 px CSS, a **280 px** (dolny limit) przy oknie ≤ 1167 px CSS. 340 px to górna granica, nie „faktyczna” szerokość.
- Zrzut właściciela ma 1173×1408 px, a lewy panel ma na nim ok. 490 px. Przy skalowaniu ok. 1,45 daje to ok. 338 px CSS, czyli górną granicę. **ZAŁOŻENIE:** skalowanie ekranu właściciela ok. 1,4–1,5 (NIE_ZMIERZONO w grze). Makiety mierzę przy 480 px (wartość z dispatchu), 340 px (górna granica z kodu) oraz — od rundy 2 — 307 px (okno 1280 px) i 280 px (dolny limit).

### 1.2 Wiersz jednostki — siatka z kolumną akcji „auto” (przyczyna objawów a–d)

`gra/src/ui/unitRecruitCard.ts`:

| linia | reguła | skutek |
|---|---|---|
| 18–20 | `.unit-recruit-compact-row{display:grid;grid-template-columns:1.65em minmax(0,1fr) auto; grid-template-areas:"icon text actions" "icon cost actions"}` | kolumna akcji ma rozmiar `auto` = pełna naturalna szerokość kontrolek; tekst i koszt dostają tylko resztę (`minmax(0,1fr)`) |
| 31–32, 199–236 | `.bld-compact-actions` zawiera `Ilość` + `−` + input + `+` + `Rekrutuj` (`order:-1` przenosi licznik przed przycisk) | **zmierzona** szerokość kolumny akcji: **198 px** przy obu szerokościach panelu |
| 23–24 | `.unit-compact-text{min-width:0}`, `.unit-compact-meta{white-space:nowrap;text-overflow:ellipsis}` | nazwa/meta ucinane („Łucz…”, „Łuczni…”) — objaw (a) |
| 25–26 | `.unit-compact-cost{white-space:normal;display:inline-flex;flex-wrap:wrap}` | koszt łamie się w wąskiej kolumnie |
| 28, 136–139 | `.unit-recruit-manpower{flex:1 1 100%;flex-wrap:wrap}` z tekstem `Rekruci: dostępne X / potrzebne Y` | przy 61 px kolumny tekst łamie się na 5 linii — objaw (b) |
| 27 + `cityPanel.ts:2748, 2756` | `.bld-infocard-chip{border-radius:20px;padding:…}`, `.bld-infocard-chips{display:flex;flex-wrap:wrap}`; każdy chip (koszt, utrzymanie) to osobny `span.bld-infocard-chips` (`unitRecruitCard.ts:187–196`) | chipy ułożone pionowo jeden pod drugim i ucinane — objaw (c) |
| 21, 164 | `.is-disabled{opacity:.72}` — nieaktywny wiersz ma ten sam układ | nieaktywna karta jest tak samo wysoka — objaw (d) |
| 180 | `mpPart = ' · ${mpCostLabel} 👤'` | emoji w UI (niezgodne z `tokens.css:4` „zero emoji”) — uwaga poboczna |

Ogólne reguły z `gra/src/ui/cityPanel.ts`: `.bld-compact-row` w liniach 3030–3032 (`display:flex` nadpisane przez grid powyżej), `.bld-compact-name{white-space:nowrap;text-overflow:ellipsis}` w linii 3037, `.bld-compact-actions{flex:0 0 auto}` w linii 3038, `.btn-sm` w liniach 3039 i 2107.

**Zmierzone w makiecie stanu obecnego** (`makiety/wariant-0-stan-obecny.html`, CSS przepisany 1:1 z linii wyżej):

| panel | szerokość wiersza | kolumna tekstu/kosztu | kolumna akcji | linie tekstu „Rekruci…” | wysokość wiersza |
|---|---|---|---|---|---|
| 480 px | 451 px | 201 px | 198 px | 2 | 64–94 px |
| 340 px | 311 px | **61 px** | 198 px | **5** | **103–174 px** |

Wniosek: przy 340 px kolumna akcji zajmuje 64% szerokości wiersza. Reszta treści ma 61 px. Objawy (a)–(d) wynikają z jednej reguły: `unitRecruitCard.ts:18`. Do tego tekst o puli rekrutów (`unitRecruitCard.ts:138`) jest **globalny**, a powtarza się na każdej karcie. Jedyną wartością właściwą jednostce jest „potrzebne 2 tys.”.

### 1.3 Przewijanie — objaw (e)

- Lista: `renderPurchasableUnits` (`cityPanel.ts:8971`) przy `scrollFill:true` (`cityPanel.ts:11764–11769`) tworzy `createScrollList(... {fill:true})` (`cityPanel.ts:6504–6519`, `9045–9056`) → `.list-scroll-fill{overflow-y:auto}` (`cityPanel.ts:2239–2240`).
- Karta zakładki: `.civ-w4-tab-body--scroll{overflow-y:auto}` (`cityPanel.ts:2231`), dla rekrutacji nadpisane na `overflow:hidden` (`cityPanel.ts:2236–2238`). Kolumna nadrzędna `.civ-v-left-main{overflow-y:auto}` (`cityPanel.ts:2899`).
- Panel „Szczegóły” po prawej to dok najechania: `attachHoverDetail(row, () => buildUnitDetailCard(...), 220, 'left')` (`cityPanel.ts:8245`; implementacja w `hoverDetailDock.ts:360`), z własnym paskiem przewijania.
- Na zrzucie widać więc dwa niezależne paski przewijania: listę i dok. Czy `.civ-v-left-main` też przewija się w grze przy 1080 px: **NIE_ZMIERZONO** (budowanie weba zabronione).

### 1.4 Pasek zasobów epoki — objaw (f)

- `appendRecruitMilitaryResourceStrip` (`cityPanel.ts:6267`) → `.civ-cs-mil-strip` (`cityPanel.ts:2766`), ikony 32×32 px (`cityPanel.ts:2763`), liczby 16 px (`cityPanel.ts:2765`), `flex-wrap:wrap` (`cityPanel.ts:2761`). Pod nim jest osobny rząd wskaźników Skarb/Dostępne/Kolejka (`appendTabIndicators`, `cityPanel.ts:4291`, wywołanie `9018–9040`).
- Zmierzone w makiecie: pasek ma 45 px, wskaźniki 23 px, plus marginesy. Na zrzucie pasek łamie się na 2 linie (ok. 130 px na zrzucie, czyli ok. 90 px CSS). W makiecie przy 340 px mieści się w 1 linii, bo czcionka zastępcza jest inna (patrz §3.1).
- We wszystkich wariantach A/B/C ten pasek i wskaźniki zastępuje jeden nagłówek o wysokości **24 px** (zmierzone). Pula rekrutów przechodzi do nagłówka.

## 2. Warianty układu (makiety)

Wszystkie makiety leżą w `makiety/`. To samodzielne pliki HTML, bez zależności i bez sieci. Paleta i fonty pochodzą z `gra/src/ui/icons/brand/tokens.css:7–26` oraz `cityPanel.ts:1997–2003`. Klasy przycisków są skopiowane z `cityPanel.ts:2087–2107`.

Parametry URL:
- `?w=480|340` — szerokość panelu;
- `?top=300` — blok „Produkcja” nad panelem, jak na zrzucie;
- `?n=60` — test pojemności;
- `?expand=1` (tylko C) — rozwija grupę „Niedostępne”.

Dane: Epoka Brąz, magazyn Drewno 8 / Brąz 202 / Koń 298, Skarb 3391, Rekruci 269 tys., Kolejka 0, Dostępne 13. Galera, Łucznik i Oszczepnik są ze zrzutu. **ZAŁOŻENIE:** pozostałe 10 pozycji to nazwy z `gra/data/units.json` (Kamień/Brąz) z ilustracyjnymi kosztami. Odczyt paska ze zrzutu (Drewno = 8, bo chip „13 Drewno” jest czerwony) też jest założeniem.

| plik | opis |
|---|---|
| `wariant-0-stan-obecny.html` (+ `-480.png`, `-340.png`) | punkt odniesienia: obecny CSS 1:1; zrzut 340 px odtwarza objawy a–d ze zrzutu właściciela |
| `wariant-A-wiersz.html` (+ PNG) | **A — kompaktowy wiersz w jednej linii.** Każdy wiersz: ikona, nazwa (wielokropek, pełna nazwa w `title`), koszt złoto + surowiec, licznik `−[1]+`, przycisk Rekrutuj. Wiersz niedostępny pokazuje zamiast licznika powód „brak 5 Drewno”. Przy 480 px w wierszu są też rekruci i utrzymanie. Przy ≤400 px (container query) chowane są rekruci i utrzymanie (są w nagłówku i w `title`), a przycisk zostaje samą ikoną. Wysokość wiersza 32 px. |
| `wariant-B-kafelki.html` (+ PNG) | **B — siatka kafelków** (`minmax(98px,1fr)`): ikona, nazwa w 2 liniach, koszt; znacznik „brak” na niedostępnych. Kliknięcie kafelka zaznacza go, a stały pasek akcji na dole pokazuje pełny koszt, rekrutów, utrzymanie, licznik i przycisk Rekrutuj. Szczegóły dalej w `title`/doku. |
| `wariant-C-tabela.html` (+ PNG) | **C — tabela** z przypiętym nagłówkiem. Grupowanie Kategoria/Epoka i sortowanie Koszt/Nazwa (działające `select`). Grupy da się zwijać. Niedostępne są domyślnie zwinięte w „Niedostępne (5)”. Wiersz ma 25 px; licznik i przycisk „+” są w ostatniej kolumnie. |

## 3. Pomiar i porównanie

### 3.1 Metoda

Każdy pomiar uruchamia skrypt Playwright. Viewport ma **1080 px** wysokości, DPR 1. Panel zajmuje całą wysokość (`top=0`) albo leży pod blokiem „Produkcja” 300 px (`top=300`, układ ze zrzutu). Liczony jest wiersz/kafelek, który w całości mieści się w prostokącie listy (`getBoundingClientRect`). „Ucięte nazwy” to elementy z `scrollWidth>clientWidth` albo `scrollHeight>clientHeight`.

Ograniczenia:
- Segoe UI nie jest dostępny w kontenerze, więc działa fallback ze stosu `tokens.css:26` (czcionka systemowa sans, szersza od Segoe). Wyniki są przez to raczej zachowawcze.
- Mierzę makiety CSS, nie realny bundle gry. Budowanie `gra/` jest zabronione.

### 3.2 Wyniki (13 pozycji ze zrzutu; pojemność przy 60 pozycjach)

Zapis „x/13” to liczba pozycji widocznych w całości bez przewijania.

| wariant | 480 px, pełna wys. | 480 px, pod Produkcją | 340 px, pełna wys. | 340 px, pod Produkcją | pojemność 60 poz. (480/340, pełna wys.) | wys. wiersza | ucięte nazwy 340 px | poziome przewijanie |
|---|---|---|---|---|---|---|---|---|
| 0 — stan obecny | 9/13 | 6/13 | **5/13** | **3/13** | 9 / 5 | 64–174 px | 6/13 | nie |
| A — wiersz | 13/13 | 13/13 | 13/13 | 13/13 | **29 / 29** (pod Produkcją 20 / 20) | 32 px | 2/13 | nie |
| B — kafelki | 13/13 | 13/13 | 13/13 | 13/13 | 36 / 24 (pod Produkcją 24 / 15) | 98 px kafelek | 1/13 | nie |
| C — tabela (zwinięte) | 8 akt. + 1 grupa | 8 + 1 | 8 + 1 | 8 + 1 | — | 25 px | 4/8 | nie |
| C — tabela (rozwinięte) | 13/13 | 13/13 | 13/13 | 13/13 | 34 / 34 (pod Produkcją 23 / 23) | 25 px | 4/13 (22/60) | nie |

Smoke test interakcji:
- licznik `+` zmienia 1→2 w A, B i C;
- kliknięcie kafelka w B przełącza pasek akcji na „Łucznik”;
- kliknięcie nagłówka grupy w C zwija ją (2 grupy `collapsed`);
- **0 błędów JS** w 4/4 plikach.

PNG mają 73–157 KB (limit 300 KB).

### 3.2b Wyniki przy węższym panelu (runda 2: 307 px = okno 1280 px, 280 px = dolny limit `cityUxFrame.ts:70`)

Ta sama metoda co w §3.1, te same makiety bez zmian (wysokość 1080 px, DPR 1). W wariancie C wiersze liczone są od dolnej krawędzi przypiętego nagłówka tabeli. Zapis „x/13” jak wyżej.

| wariant | 307 px, pełna wys. | 307 px, pod Produkcją | 280 px, pełna wys. | 280 px, pod Produkcją | wys. wiersza 280 px | ucięte nazwy 307 px | ucięte nazwy 280 px | status rekrutów widoczny na karcie | poziome przewijanie |
|---|---|---|---|---|---|---|---|---|---|
| 0 — stan obecny | 4/13 | 2/13 | 3/13 | 2/13 | 129–226 px | 13/13 | 13/13 | tak | nie |
| A — wiersz | 13/13 | 13/13 | 13/13 | 13/13 | 32 px | 4/13 | **8/13** | **nie** (container query ≤ 400 px) | nie |
| B — kafelki | 13/13 | 10/13 | 13/13 | 10/13 | 98 px | 0/13 | **0/13** | nie (tylko pasek akcji) | nie |
| C — tabela (zwinięte) | 8 + 1 grupa | 8 + 1 | 8 + 1 | 8 + 1 | 25 px | 7/8 | 8/8 | nie | nie |
| C — tabela (rozwinięte) | 13/13 | 13/13 | 13/13 | 13/13 | 25 px | 7/13 | 10/13 | nie | nie |

Ucięte nazwy w A przy 280 px: Galera, Oszczepnik, Wojownik z mieczem i tarczą, Włócznik, Wojownik z toporem, Rydwan (woły), Konnica, Taran okuty. Przy 307 px: Wojownik z mieczem i tarczą, Wojownik z toporem, Rydwan (woły), Taran okuty. 0 błędów JS we wszystkich 20 przebiegach. Wnioski:
- Liczba widocznych pozycji nie zależy od szerokości w A i C. W B spada do 10/13 pod Produkcją przy ≤ 307 px.
- Argument „ucięte nazwy” odwraca się przy wąskim panelu: przy 280 px B ucina 0/13, A 8/13, C 8/8 (zwinięte) lub 10/13 (rozwinięte). Przewaga A nad B w tej metryce istnieje tylko przy 340 px (2/13 wobec 1/13 — praktycznie remis).
- Mitygacja dla A przy ≤ 300 px (np. nazwa w 2 liniach albo schowanie chipu surowca do `title`): **NIE_ZMIERZONO**, makieta tego nie zawiera.

### 3.3 Zalety, wady, zakres, ryzyka

Zakres w LOC to **SZACUNEK** — nic nie jest zaimplementowane.

| | A — wiersz | B — kafelki | C — tabela |
|---|---|---|---|
| Zalety | 2,5–6× więcej pozycji niż teraz. Zachowuje model „wiersz = jednostka + przycisk”, więc gracz kupuje jednym kliknięciem jak dziś. Powód blokady widać od razu. Najmniejsza zmiana DOM. | Najwięcej pozycji przy 480 px (36). Ładny podgląd ikon. Pełne koszty w pasku akcji bez obcinania. | Najgęstszy wiersz (25 px). Grupowanie i sortowanie skalują się na późne epoki. Niedostępne nie zajmują miejsca. |
| Wady | Długie nazwy (np. „Wojownik z mieczem i tarczą”) ucina wielokropek (2/13). Przy 340 px rekruci i utrzymanie są tylko w nagłówku/tooltipie. | Zakup w 2 krokach (wybór → Rekrutuj). Przy 340 px tylko 3 kolumny, 24 pozycje. Pasek akcji zabiera ok. 80 px. Stan zaznaczenia trzeba trzymać między przerysowaniami. | Przy 340 px ucina 4/8 nazw i nagłówek „Surowiec”. Mały cel kliknięcia „+”. Stan sortu/zwinięcia trzeba trzymać między przerysowaniami (`cityPanel.ts:8977` czyści `innerHTML`). Najbardziej „arkuszowy” wygląd. |
| Pliki | `unitRecruitCard.ts` (CSS 18–38, builder 149–286), `cityPanel.ts` (`renderPurchasableUnits` 8971–9057, pasek 6267+, CSS 2761–2767) | jw. + nowy komponent kafelka/paska akcji, stan wyboru per miasto | jw. + renderer tabeli, stan grupowania/sortu/zwinięcia, użycie `categoryOf` (`unitRecruitCard.ts:47–50`) |
| LOC (szac.) | ok. 120–160 w 2 plikach src + ok. 40–60 w testach (8–9 asercji, §3.3) | ok. 300–350 w 2–3 plikach + ok. 120 w testach | ok. 350–450 w 2–3 plikach + ok. 150 w testach |
| Ryzyka testów | **Zmiana zintegrowanego kontraktu z `R-REKRUTACJA-KARTY-BRAK-REKRUTOW-Q1` („unit card exposes recruiter availability/required/shortfall”) — DECYZJA WŁAŚCICIELA, nie „drobna poprawka testów”.** Pełna lista asercji dotkniętych przez A (pula do nagłówka + status chowany przy ≤ 400 px): `recruit-card-manpower-real-render-test.cjs` — **B1** (`:221`, `statusVisible`: karta ma widoczny status rekrutów; przy 280–340 px w A status nie jest widoczny), **B2** (`:222–223`), **B8** (`:248–249`), **B12** (`:263–264`) — dokładny tekst `Rekruci: dostępne X / potrzebne Y`; **B3** (`:224–225`) i **B9** (`:251–253`) — tekst `Brakuje: …` na karcie (w A zastąpiony powodem „brak N …”, więc trzeba zachować element shortfall albo przepisać asercję); `recruitment-panel-height-real-render-test.cjs:382` (regex `/Rekruci: dostępne/`) oraz `:383` (`manpowerStatusCount === rowCount` — zależnie od tego, czy element statusu zostaje w DOM). Razem 7 asercji w pliku manpower + 1–2 w pliku height. B4 (`data-*`), B6/B10 (tooltip), B13–B15 przejdą, jeśli element statusu z atrybutami `data-available/required/missing` zostanie w DOM (może być ukryty wizualnie — wtedy nadal pada B1). `recruit-resource-strip-test.cjs` sprawdza `.civ-cs-mil-strip`/`.civ-cs-mil-era`, więc warto zachować te klasy w nowym nagłówku. Testy `recruit-card-quantity-…` i `recruit-card-stock-chip-…` przejdą bez zmian, jeśli zostaną klasy `.unit-recruit-compact-row`, `.unit-recruit-submit`, `.unit-recruit-quantity-input`, `.bld-infocard-chip(.stock-missing)`. | Jak A (ta sama zmiana kontraktu statusu rekrutów — w B karta nie ma statusu w ogóle), plus `recruit-card-quantity-real-render-test.cjs` (przycisk przenosi się z wiersza do paska akcji) i `recruitment-panel-height-…:281` (`fiveFullCards` przy kafelkach). Ryzyko regresji doku najechania (`cityPanel.ts:8245`) przy kliknięciu kafelka. | Jak B oraz semantyka „widocznych kart” przy zwiniętych grupach. Największe ryzyko regresji HUD (sticky nagłówki w przewijanym kontenerze `cityPanel.ts:2239`). |

## 4. Rekomendacja

**Wariant A — kompaktowy wiersz w jednej linii.** Uzasadnienie:

1. **Usuwa przyczynę, nie objaw.** Objawy a–d biorą się z kolumny akcji `auto` = 198 px w siatce `unitRecruitCard.ts:18–20` i z globalnego tekstu puli powtarzanego w każdej karcie (`unitRecruitCard.ts:138`). Wariant A zmienia dokładnie te dwa miejsca oraz pasek epoki (objaw f).
2. **Wynik pomiaru.** W całym zakresie szerokości z kodu (280–340 px, `cityUxFrame.ts:44,70`) A pokazuje 13/13 pozycji, także pod blokiem Produkcja (stan obecny: 2–5/13). Pojemność przy 340 px to 29 wierszy wobec 5. Nie ma poziomego przewijania. **Słabość A: ucięte nazwy** — 2/13 przy 340 px, 4/13 przy 307 px, **8/13 przy 280 px** (§3.2b); B ucina tu 0/13. Jeśli właściciel ma okno ≤ ~1170 px CSS, ten argument przemawia za B albo za mitygacją w A (NIE_ZMIERZONO).
3. **Najmniejszy zakres kodu, ale nie „najmniejsze ryzyko kontraktu”.** Zostaje jeden wiersz na jednostkę, zakup jednym kliknięciem i dok szczegółów na najechanie. Jednak A (jak B i C) przenosi pulę rekrutów do nagłówka i przy ≤ 400 px chowa status rekrutów na karcie. To odwraca zintegrowany kontrakt `R-REKRUTACJA-KARTY-BRAK-REKRUTOW-Q1` i dotyka ok. 8–9 asercji (B1, B2, B3, B8, B9, B12 + `recruitment-panel-height-…:382–383`, lista w §3.3). **Wymaga decyzji właściciela** (pytanie ABC zadaje orkiestrator): (a) zgoda na status puli w nagłówku + powód blokady w wierszu, (b) A z zachowanym skróconym statusem rekrutów na karcie (np. tylko „brak N rekrutów”, gdy brakuje) — kosztem szerokości wiersza, NIE_ZMIERZONO, (c) zostawić obecny kontrakt.
4. **Warianty B i C** dają porównywalną lub większą pojemność tylko przy 480 px. B wygrywa przy wąskim panelu w metryce uciętych nazw, ale traci 3 pozycje pod Produkcją przy ≤ 307 px i wymaga drugiego kroku zakupu. C ucina najwięcej nazw i wymaga trwałego stanu UI. Oba mają 2–3× większy zakres zmian.

Rekomendacja pozostaje **A**, warunkowo: z decyzją właściciela co do kontraktu statusu rekrutów (pkt 3) i z obowiązkową bramką uciętych nazw przy 280 px w dispatchu implementacyjnym.

Opcjonalne rozszerzenie A (decyzja właściciela, osobna runda): zwijana grupa „Niedostępne (n)” z wariantu C — ok. 30–40 LOC.

Kryteria dla przyszłego dispatchu implementacyjnego:
- bramka `recruitment-panel-height-real-render-test.cjs` z progiem podniesionym z 5 do ≥ 13 pełnych wierszy przy 1080 px;
- realny zrzut w przeglądarce przy 340 px i 280 px (okno ≤ 1167 px CSS), z liczbą uciętych nazw;
- jawna decyzja właściciela co do kontraktu B1/B2/B3/B8/B9/B12 przed zmianą testów;
- brak emoji w wierszu (`unitRecruitCard.ts:180`).

## Uwagi Operatora

- Wątek ze zgłoszenia właściciela („przy 72. turze znowu spowolnienie ładowania miasta i tury”) **nie należy do tego tematu** i nie był tu badany. Wymaga osobnego dispatchu wydajnościowego od orkiestratora.
- Pliki robocze (generator makiet, skrypty pomiaru) zostały w scratchpadzie sesji i nie trafiły do repo.

## Runda 2 — odpowiedzi na zarzuty Evaluatora (runda 1, FAIL)

Baza: commit Operatora rundy 1 `112ff73e` (rodzic `c11f5087`). Makiety bez zmian; poprawiony tylko ten dokument.

1. **Zarzut 1 (wpływ na testy zaniżony, A cofa kontrakt) — PRZYJMUJĘ.** Sprawdzone na pinie: `recruit-card-manpower-real-render-test.cjs:221` (B1 `statusVisible`), `:222–223` (B2), `:224–225` (B3), `:248–249` (B8), `:251–253` (B9), `:263–264` (B12); `recruitment-panel-height-real-render-test.cjs:382–383`. Pomiar: w A przy 280/307/340 px element `.mpc` ma `display:none` (container query `wariant-A-wiersz.html:51`), więc B1 nie przejdzie. Poprawki: §3.3 (pełna lista asercji, oznaczenie jako decyzja właściciela), §4 pkt 3 (bez „najmniejszego ryzyka”, opcje a/b/c dla orkiestratora), kryteria dispatchu implementacyjnego.
2. **Zarzut 2 (340 px to nie pomiar, brak 280 px) — PRZYJMUJĘ.** §1.1 opisuje teraz zakres 280–340 px wynikający z `cityUxFrame.ts:44,70` (340 px dopiero przy oknie ≥ 1417 px CSS). Nowa tabela §3.2b przy 307 px i 280 px potwierdza liczby Evaluatora: A 8/13, B 0/13, stan obecny 13/13 uciętych nazw przy 280 px; widoczne pozycje: stan obecny 3 (2 pod Produkcją), A 13, B 13 (10 pod Produkcją), C 8 zwinięte. Jedna różnica: C rozwinięte przy 280 px ucina **10/13** (Evaluator: 8/13 — zgadza się z C zwiniętym, 8/8). §4 pkt 2 przeliczony: przewaga A w metryce uciętych nazw istnieje tylko przy 340 px.
3. **Zarzut 3 (`tokens.css:3` → `:4`) — PRZYJMUJĘ.** `gra/src/ui/icons/brand/tokens.css:4` zawiera „zero emoji”; poprawione w §1.2.

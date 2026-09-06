# 03 — Operator (obrona), runda 1

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: P-KOPALNIA-PODSWIETLENIE-KOSMETYKA-Q1
MODEL+EFFORT: Opus 5, effort high (rola: Operator/obrona, runda 1/5 — druga faza TEJ SAMEJ rundy)
GOAL: zamknąć N3/N5/N6 i rozstrzygnąć N2 pomiarem, nie opinią.

Guard §2b: HEAD przed pracą `c86c9d73` (Evaluator), łańcuch
`ee1f6756` (baza dispatchu) → `dd0a4c85` (Operator) → `c86c9d73` — oczekiwana
kontynuacja rundy, nie rozbieżność. Drzewo czyste przed i po pracy.

## OBRONA — wszystkie trzy zarzuty PRZYJĘTE

### OBRONA 1 → PRZYJMUJĘ (`n2-scena-bez-warstwy.png` pokazywał maski ID)

Zarzut trafny i defekt potwierdzony w kodzie, nie tylko w opisie.
`n2-depthtest-chromium.cjs:163-166` ustawia `overlay` wyłącznie dla wariantów
`'po'` i `'przed'` — dla `'brak'` zostaje `null`. Ostatni render w `__run` był
warunkowy (`if (overlay) renderer.render(...)`), więc dla `'brak'` ostatnim
renderem na canvasie pozostawał przebieg MASEK ID, mimo że materiały i tło
zostały już przywrócone. Zrzut łapał ten bufor.

Poprawka: render bezwarunkowy po przywróceniu materiałów (materiały i tło są
w tym miejscu już poprawne, więc jeden render obsługuje oba przypadki).

**Dowód, że poprawka jest celowana:** po przegenerowaniu kompletu zrzutów dwa
nośne pliki są BIT-IDENTYCZNE (`md5` niezmienione: `f9f694e4…` PRZED,
`208da7d1…` PO), a zmienił się wyłącznie `n2-scena-bez-warstwy.png`
(`22f0b1f8…` → `4004f5f2…`). Defekt nie dotykał pomiaru. Obejrzałem nowy zrzut:
oświetlona scena referencyjna — Wzgórze, zielony heks z modelem jednostki,
Góra-przesłona. Liczby harnessu odtworzone co do piksela (patrz TESTY).

### OBRONA 2 → PRZYJMUJĘ (komentarz N6 przeszacowywał zasłonięcie)

Zarzut trafny — i potwierdza go mój WŁASNY pomiar z raportu 01, którego wniosku
nie doprowadziłem do końca. Napisałem tam „widoczny pierścień 11,0–45,7 % pola",
a mimo to zostawiłem komentarz mówiący „jedynie wąski pierścień". To była
niekonsekwencja po mojej stronie, nie kwestia interpretacji.

Przeliczyłem niezależnie, skryptem dopisanym jako dowód
(`dowody/n6-pierscien-pomiar.cjs`, raycast po `powierzchniaReliefuY`,
5 wariantów × 2 typy × 720 kierunków, krok promienia 0,00025·R):

| typ | promień przesłaniania | pierścień (pole krążka) | szerokość |
|---|---|---|---|
| Wzgórze | 0,777–0,915·R | 11,1–35,9 % | 0,055–0,193·R |
| **Góra** | **0,714–0,818·R** | **28,8–45,9 %** | **0,152–0,256·R** |

Zbieżne z pomiarem Evaluatora (29,0–46,0 %; 0,257·R) w granicach rozdzielczości.
Przy 45,9 % pola i szerokości 0,256·R słowo „wąski" jest fałszywe.

Poprawka: `gra/src/render/rangeOverlay.ts:459-467` — komentarz przepisany na
zmierzone liczby, z jawnym „krążek NIE znikał w całości" i wskazaniem, że dla
Góry odsłonięta część sięga niemal połowy pola. Zachowana została prawdziwa
przyczyna nieczytelności (zostawało samo obrzeże, oderwane od środka heksa).
**Diff jest wyłącznie komentarzem** — zero zmian wykonywalnych (weryfikacja:
`git diff -U0` po odfiltrowaniu linii ` * ` jest pusty).

### OBRONA 3 → PRZYJMUJĘ (zdanie o `depthTest:false` było fałszywe)

Zarzut trafny bez zastrzeżeń. Zdanie z raportu 01 („w `gra/src/render/` nie ma
już `depthTest:false`") jest FAŁSZYWE. Uściślam liczbę: `grep -rn
'depthTest:[[:space:]]*false' gra/src/render/` daje 15 trafień, z czego 2
w `rangeOverlay.ts` (linie 375 i 471) to PROZA w komentarzach, nie kod —
realnych przypisań jest **13, w 8 plikach** (units ×4, siegeMarker ×3, cities,
unitOwnerEmblem, cityMapStatChip, workerFieldOverlay, cityOkolicaOverlay,
unitStatPlate). Lista plików Evaluatora sumuje się do 13; jego „12" to drobna
pomyłka rachunkowa, która nie osłabia zarzutu.

Zdanie prawdziwe i wystarczające dla N2: `depthTest:false` nie ma w ścieżce
warstwy kopalni — w `rangeOverlay.ts` test głębi zostaje domyślne `true`
(`rangeOverlay.ts:422`: „`depthTest` NIE jest tu ruszany"). Pozostałe 13 to
warstwy HUD/sprite'y (plakietki, emblematy, znaczniki oblężenia) poza tematem
i poza allowlistą — nie ruszam ich.

Poprawka: komórka N2 w tabeli raportu 01 zawężona do prawdziwego zdania plus
sekcja `ERRATA` na końcu 01 (append, jawnie oznaczona, reszta tekstu nietknięta
jako zapis historyczny — nie przepisuję cicho raportu, który Evaluator już ocenił).

## DO DECYZJI CZŁOWIEKA

Bez zmian względem raportu 01: konflikt dispatch↔kod (C-054). `ac09c091`
(2026-08-18) zamknął N2/N3/N5/N6 przed napisaniem dispatchu — Evaluator
potwierdził to niezależnie. Trzy zarzuty były defektami MOJEGO raportu i dowodu,
nie kodu gry; po ich naprawie pytanie o zamknięcie tematu stoi nienaruszone.
Decyzja orkiestratora: zamknąć jako zrealizowany-przed-dispatchem, czy oczekuje
czegoś ponadto.

## ZMIANY/COMMIT

Allowlista poz. 1 i poz. 4, nic poza nią. `git add` po jawnych ścieżkach,
`git diff --check` czysty.

- `gra/src/render/rangeOverlay.ts` — komentarz N6 (zarzut 2), zmiana wyłącznie komentarzowa
- `dyspozycje/…/dowody/n2-depthtest-chromium.cjs` — render bezwarunkowy (zarzut 1)
- `dyspozycje/…/dowody/n2-scena-bez-warstwy.png` — zrzut przegenerowany (zarzut 1)
- `dyspozycje/…/dowody/n6-pierscien-pomiar.cjs` — NOWY, dowód do zarzutu 2
- `dyspozycje/…/01-operator-runda1.md` — ERRATA + dwie korekty zdań (zarzuty 2, 3)
- `dyspozycje/…/03-obrona-runda1.md` — ten raport

## TESTY (uruchomione po poprawkach, komplet)

- `node ./node_modules/typescript/bin/tsc --noEmit` — **0 błędów**
- `kopalnia-podswietlenie-heksow-test.cjs` — **76 passed, 0 failed** (bez spadku)
- logic **213/213** · tech-tree **19/19** · research **33/33** · unit-replace **13/13** · combat **6/6**
- `n2-depthtest-chromium.cjs` przebiegnięty ponownie: PRZED 37 096 px / 1 084 (21,0 %) /
  5 617 (16,1 %); PO 44 291 px / **0** / **0**; widoczność **119 %** — liczby identyczne
  jak w rundzie 1, poprawka zrzutu ich nie ruszyła
- `n6-pierscien-pomiar.cjs` — pierścień 11,1–45,9 % pola, szerokość 0,055–0,256·R

## BLOKADY

C-054 (dispatch↔kod) — wyżej. Poza tym brak.

## RUNDY

1/5 (faza obrony tej samej rundy).

## NASTĘPNY KROK

Final Control — werdykt. Wszystkie trzy zarzuty przyjęte i naprawione w tej samej
rundzie; runda 2 nie jest potrzebna do ich domknięcia.

DEPLOY/PUSH: NIE WYKONANO

STATUS: EVALUATOR
DOMAIN: GAME
TEMAT: P-STADNINA-KONIE-KOSZT-ROZBUDOWY-Q1
GOAL RUNDY 2: Dokończ implementację z rundy 1 — wpięcie realnego magazynu 'kon' do bramki
`qualifies()` (`improvement-build.ts`) i odjęcie 50 'kon' przy faktycznym potwierdzeniu
budowy stadniny poza złożem, w `main.ts`, WYŁĄCZNIE w zakresie rozszerzonej allowlisty
04-dispatch-runda2.md.

Weryfikacja adwersaryjna wykonana niezależnie w tej rundzie (nie na podstawie deklaracji
Operatora): świeży `git diff` per plik, świeże uruchomienie `tsc --noEmit`, 5 bramek
referencyjnych, wszystkich 5 zmienionych/nowych plików testowych, plus 8 DODATKOWYCH plików
testowych korzystających z tego samego `buildImprovementQualifier`, których Operator NIE
wymienił w swoim raporcie (`tarasy-cywilizacje-test`, `zloto-test`, `oboz-lowiecki-las-test`,
`farma-nie-w-lesie-test`, `oboz-lowiecki-wymaga-tartaku-test`, `map-road-movement-test`,
`improvement-territory-gate-test`, `fort-strazniaca-zasieg-zakladania-test`) — porównanie
z bazowym `main` przez `git stash`/`git stash pop` w tej rundzie, niezależnie od Operatora.

WYNIK WERYFIKACJI (potwierdzone, BEZ zarzutu):
- `tsc --noEmit`: 0 błędów (potwierdzone świeżym uruchomieniem).
- 5 bramek referencyjnych: logic-test 213/213, tech-tree-test 19/19, research-test 33/33,
  unit-replace-test 13/13, combat-test 6/6 — zielone, zgodne z deklaracją.
- `stadnina-kon-koszt-test.cjs` 17/17, `stadnina-las-test.cjs` 28/28, `hodowla-las-test.cjs`
  109/109, `hex-tooltip-stadnina-kopalnia-cyny-test.cjs` 29/29 — zielone, zgodne z deklaracją.
- `food-hodowla-test.cjs` (20/4), `map-improvement-qualify-test.cjs` (133/1),
  `eko-tech-paczka4-test.cjs` (8/2), `eko-tech-paczka2-test.cjs` (6/3),
  `cyna-surowiec-test.cjs` (78/0) — potwierdzone IDENTYCZNE na bazowym `main` (własny
  `git stash`), zgodne z deklaracją Operatora.
- DODATKOWO (własna inicjatywa, poza listą Operatora): `tarasy-cywilizacje-test.cjs` (16/1),
  `zloto-test.cjs` (38/7), `oboz-lowiecki-las-test.cjs` (72/19) — również potwierdzone
  IDENTYCZNE na bazowym `main` własnym `git stash`. Zero nowych regresji w tych plikach mimo
  że Operator ich nie sprawdził i nie wymienił — samo w sobie NIE jest zarzutem (wynik jest
  poprawny), ale odnotowuję lukę w raporcie TESTY Operatora dla kompletności.
- Zakres `main.ts`: `git diff --stat` = 33 insercje / 0 usunięć, WYŁĄCZNIE w dwóch
  autoryzowanych punktach (`ImprovementBuildState` ~12544, `commitBuildRequest` ~12953-12975).
  Linie main.ts:4619 i main.ts:6860-6862 (`computeEmpireLivestockUnlocks`) — potwierdzone
  nietknięte, i potwierdzone świeżym czytaniem że służą DO INNYCH celów (odczyt "czy owner ma
  natywny dostęp do surowca" dla handlu/panelu miasta, nie do bramki budowy) — zgodnie z
  zastrzeżeniem decyzji orkiestratora. Brak naruszenia allowlisty main.ts.
- Regresja złoże/bydło/owce/lama: potwierdzona czytaniem `isLivestockUnlockedForPlacement` —
  dla kluczy innych niż 'stadnina' funkcja zawsze zwraca `true` niezależnie od nowych
  parametrów; na złożu konia stadnina zawsze `true` niezależnie od `horseStockAvailable`.
  Zgodne z deklaracją.
- `deductBuildingStockCostAcrossCities` (game/building-stock-cost.ts:185-212) — czytaniem
  potwierdzone, że realnie odejmuje z `city.surowce`, bierze najpierw z miasta o największym
  zapasie, nie schodzi poniżej 0 — funkcja jest realna i współdzielona z innymi miejscami
  odejmowania kosztów (nie nowa, nie atrapa).

ZARZUTY:

1. [Punkt (c) BINARNEGO KRYTERIUM — "realne odjęcie 50 kon przy potwierdzeniu budowy" —
   NIE ma niezależnego żywego dowodu wykonania RZECZYWISTEGO kodu `main.ts::commitBuildRequest`,
   tylko dowód na jego RÓWNOLEGŁEJ SYMULACJI.]
   Nowa bramka `stadnina-kon-koszt-test.cjs` (sekcja "(c)", linie 132-153) NIE wywołuje
   faktycznej funkcji `commitBuildRequest` z `main.ts` (co jest niemożliwe wprost — to
   domknięcie wewnątrz `boot()`, `main.ts` nie jest modułem, zgodnie z własnym uzasadnieniem
   Operatora w komentarzu testu, linie 17-23). Zamiast tego test: (1) ręcznie odtwarza warunek
   bramki `stadninaPozaZlozemNaZlozu`/analogiczny osobno w kodzie testu, (2) osobno wywołuje
   `deductBuildingStockCostAcrossCities(cities, 0, { kon: 50 })` z ręcznie wpisanym kosztem
   `{ kon: 50 }` — czyli test odtwarza to, co main.ts:12953-12975 ROBI, zamiast wykonać ten
   kod. To jest dokładnie wzorzec, który REGUŁA PRZECIW SAMOOSZUKIWANIU (00-dispatch.md,
   dosłownie: "zakaz deklaracji zaimplementowano bez żywego dowodu faktycznego odjęcia 50 z
   magazynu przy potwierdzeniu budowy, NIE TYLKO CZYTANIE WARUNKU W KODZIE") explicite zakazuje
   jako wystarczający dowód — bo w praktyce jest to nadal "czytanie warunku w kodzie" (przez
   autora testu, nie silnik), tylko przepisane jako asercja. Ten sam projekt ma PRECEDENS: gdy
   logika żyje wyłącznie jako domknięcie wewnątrz `main()`/`boot()` (dokładnie ten sam problem co
   tu), `ai-buduje-budynki-test.cjs` (P-AI-NIE-STAWIA-BUDYNKOW-Q1) rozwiązuje to realnym
   `vite build` + realnym headless Chromium + realnym `doStartGame`/`endTurn()`, z wprost
   udokumentowanym uzasadnieniem: "REGUŁA PRZECIW SAMOOSZUKIWANIU dispatchu... zakazuje dowodu
   z deklaracji — dowodem ma być [realny] wzrost w PRAWDZIWEJ pętli". Ten sam standard nie
   został tu zastosowany, mimo że 00-dispatch.md pkt 5 wprost dopuszczał albo headless
   symulację, albo Chromium ("wg tego co się lepiej nadaje") — nie zwalnia to jednak z wymogu,
   żeby wybrana ścieżka faktycznie DOWODZIŁA wykonania rzeczywistego kodu main.ts, a nie jego
   odrębnej rekonstrukcji. Moja własna weryfikacja statyczna diffu main.ts (linie 12953-12975)
   potwierdza, że okablowanie WYGLĄDA poprawnie (ten sam wzorzec co reszta funkcji, właściwa
   zmienna `hex`, właściwy próg, właściwa kolejność względem odjęcia Pracy) — ale to jest
   przegląd kodu, nie żywy dowód, którego dispatch wymaga literalnie dla tego konkretnego punktu.
   Wniosek: punkt (c) binarnego kryterium jest wsparty POŚREDNIO (przegląd kodu + test
   funkcji składowych), nie BEZPOŚREDNIO (wykonanie realnej ścieżki main.ts), wbrew literalnemu
   brzmieniu reguły przeciw samooszukiwaniu z tego tematu.

2. [Nieautoryzowana regresja zachowania AI/automatu miast — poza allowlistą, poza binarnym
   kryterium, ale realna i nierozstrzygnięta przez orkiestratora.]
   `pickAutoImprovements` (`gra/src/game/auto-improvements.ts`, POZA allowlistą tej rundy)
   jest DRUGIM (i jedynym innym) produkcyjnym konsumentem dokładnie tej samej
   `buildImprovementQualifier`/`isLivestockUnlockedForPlacement`, którą ta runda zmieniła
   (potwierdzone: `grep buildImprovementQualifier(` w `gra/src` daje wyłącznie `main.ts` i
   `auto-improvements.ts` jako produkcyjne wywołania). Budowany tam `ImprovementBuildState`
   (linia ~514) NIE ustawia ani `horseStockAvailable`, ani `tradeRouteKonUnlocked` — więc
   qualifier widzi tam zawsze `horseStockAvailable === undefined -> 0` (bezpieczny domyślny
   z komentarza Operatora w `improvement-build.ts`) i `tradeRouteKonUnlocked === undefined ->
   false`. Przed tą rundą automat/AI KORZYSTAŁ z Modelu B: `computeEmpireLivestockUnlocks`
   liczyła się z `state.placedImprovements` (dostarczanego przez `auto-improvements.ts` już
   dziś, bez potrzeby dodatkowego pola), więc jeśli GDZIEKOLWIEK w imperium istniała stadnina
   na złożu, AI mogło budować kolejne stadniny wszędzie za darmo. Po tej rundzie: to źródło
   zniknęło, a nowe źródło (`horseStockAvailable`) nigdy nie dociera do automatu — więc AI/
   miasto-automat NIGDY WIĘCEJ nie zbuduje stadniny poza złożem konia, NAWET gdy imperium ma
   pełne 500 sztuk konia w magazynie. To jest TRWAŁA utrata zdolności AI, wprowadzona jako
   efekt uboczny zmiany we WSPÓŁDZIELONEJ funkcji spoza pliku znajdującego się poza
   allowlistą tej rundy. Operator to WIDZI i opisuje w BLOKADY pkt 2 (05-operator-runda2.md)
   oraz koduje jako "zamierzoną konsekwencję" wprost w zaktualizowanych asercjach
   `hodowla-las-test.cjs` (sekcja 4) — ale to jest jednostronna kwalifikacja Operatora
   ("nie regresja, tylko efekt uboczny") nienaniesiona jako decyzja orkiestratora/właściciela.
   Ten projekt ma udokumentowaną, wysoką wagę dla dokładnie tej kategorii błędu (patrz
   `docs/decyzje/R-PROC-AUTOBOT.md` §Bramki: "AI stawia budynki (POKRYCIE, nie sumy)" — bramka
   zamówiona przez właściciela słowami „żeby to już nigdy nie wróciło", z zastrzeżeniem Final
   Control "nie wolno osłabiać" analogicznej asercji pokrycia). Rekomendacja: wąski
   DECISION_REQUIRED do orkiestratora/właściciela — czy AI/automat ma też płacić 50 kon (czyli
   `auto-improvements.ts` wymaga dopisania do allowlisty w kolejnej rundzie), czy świadomie
   akceptujemy że AI odtąd buduje stadninę WYŁĄCZNIE na złożu — zamiast to rozstrzygać
   milcząco wewnątrz raportu Operatora.

TESTY: (patrz WYNIK WERYFIKACJI wyżej — wszystkie liczby potwierdzone niezależnie w tej
rundzie, świeżym uruchomieniem, nie na podstawie deklaracji Operatora)

BLOKADY:
- Zarzut 1 wymaga decyzji: czy dopuszczamy pośredni dowód (przegląd kodu main.ts +
  test funkcji składowych) jako wystarczający dla punktu (c) binarnego kryterium, czy
  wymagamy realnego Chromium/vite dla main.ts::commitBuildRequest analogicznie do
  `ai-buduje-budynki-test.cjs` — to jest pytanie o poziom rygoru dowodu, nie o poprawność
  kodu (kod WYGLĄDA poprawnie z przeglądu).
- Zarzut 2 wymaga wąskiego DECISION_REQUIRED do orkiestratora/właściciela w sprawie
  `auto-improvements.ts` (poza allowlistą tej rundy) — patrz rekomendacja wyżej.
- Punkt 4 ZADANIA (tooltip "23/50 koni") pozostaje niewdrożony — Operator to jawnie
  zgłosił jako BLOKADĘ 1 w swoim raporcie z uzasadnieniem allowlisty (main.ts:5567 poza
  trzema punktowymi zakresami decyzji orkiestratora). To NIE jest część BINARNEGO
  KRYTERIUM SUKCESU tej rundy (które wymaga wyłącznie 4 punktów żywego dowodu z ZADANIA
  pkt 5, nie punktu 4) — potwierdzam odczyt Operatora, nie stawiam tego jako zarzut, ale
  odnotowuję dla Final Control jako otwarty, jawnie zgłoszony dług.

RUNDY: 2/5
NASTĘPNY KROK: Obrona Operatora na Zarzuty 1-2, następnie Final Control (Ścieżka A,
Workflow) — z rekomendacją: (a) jeśli Final Control uzna kod main.ts za wystarczająco
zweryfikowany przeglądem statycznym + testami funkcji składowych, Zarzut 1 nie blokuje;
jeśli wymaga realnego dowodu wykonania main.ts, wąski dodatek: real vite build + headless
Chromium test analogiczny do ai-buduje-budynki-test.cjs, runda 3; (b) Zarzut 2 wymaga
wąskiego DECISION_REQUIRED do orkiestratora/właściciela o zakres `auto-improvements.ts`
niezależnie od (a).
DEPLOY/PUSH: NIE WYKONANO

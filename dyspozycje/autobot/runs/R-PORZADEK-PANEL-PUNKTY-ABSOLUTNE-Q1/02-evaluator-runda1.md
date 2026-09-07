STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-PORZADEK-PANEL-PUNKTY-ABSOLUTNE-Q1
GOAL: Panel miasta (bloki Szczęście, Prawo) pokazuje obok procentu netto/max w punktach.

ZMIANY-COMMIT: weryfikacja niezależna w `/home/user/wt-porzadek-panel-punkty`
(branch `autobot/R-PORZADEK-PANEL-PUNKTY-ABSOLUTNE-Q1`, HEAD `08d8d31c`). Zero zmian
wprowadzonych przez Evaluatora — tylko odczyt/uruchomienie. Commit tego raportu poniżej.

TESTY (uruchomione samodzielnie, nie tylko przyjęte na słowo):
- `git diff --stat 5fa61be3 HEAD`: dokładnie 5 plików —
  `gra/src/ui/orderPanel.ts` (+8/-0), `gra/src/ui/cityPanel.ts` (+34/-3), nowa bramka
  `gra/tools/porzadek-panel-punkty-absolutne-real-render-test.cjs`, oraz
  `00-dispatch.md`/`01-operator-runda1.md`. `society-breakdown.ts` — ZERO zmian. Zgodne
  z deklaracją Operatora. `git diff --check 5fa61be3 HEAD` czyste (exit 0).
- `npx tsc --noEmit` (z `gra/`): czyste, exit 0.
- Wszystkie istniejące bramki `*citypanel*`/`*cityPanel*`/`*porzadek*` w `gra/tools/`
  uruchomione ponownie samodzielnie:
  `citypanel-konwerter-produkcja-test.cjs` 83/0,
  `citypanel-uwagi-abc-filter-test.cjs` 35/0,
  `citypanel-uwagi-hostcard-removed-real-render-test.cjs` 12/0,
  `porzadek-panel-czytelnosc-test.cjs` 93/0,
  `spichlerz-cap-citypanel-wiring-test.cjs` 12/0 — zgodne z raportem Operatora, 0 fail.
- Nowa bramka `porzadek-panel-punkty-absolutne-real-render-test.cjs` uruchomiona
  samodzielnie: 10/10 pass, żywy DOM (Playwright/Chromium fallback) potwierdza
  `"Szczęście":"27%(9/35 pkt)"` i `"Prawo":"0%(0/47 pkt)"` w obu blokach ORAZ w
  `buildPorzadekDetailCard` — identyczne z tekstem zacytowanym przez Operatora (dowód
  wizualny odtworzony niezależnie, nie tylko przyjęty na słowo; zrzut PNG operatora leżący
  poza repo w innej sesji nie był dostępny do wglądu, więc Evaluator wygenerował własny
  żywy dowód tą samą bramką zamiast polegać na samym opisie).
- Weryfikacja ręczna (b): dociągnięty osobny hook `__cityPanelOrderStateLocalForTest`
  (bez modyfikacji plików produkcyjnych) pokazał surowe wartości silnika dla fixture'u
  testu: `szczescie(netto)=9.4`, `szMax=35.1`, `szPct=26.9`, `porzadek(netto prawa)=0`,
  `prawMax=46.8`, `prawPct=0`. Potwierdzone: `szMax`/`prawMax` w `computeOrderStateLocal`
  (cityPanel.ts ~L3204-3205) pochodzą wprost z `ordPct.sz.szMax` / `ordPct.prawo.prawMax`
  (society-breakdown.ts), NIE przeliczone od nowa, NIE zahardkodowane. Punkt (b) spełniony
  co do pochodzenia liczb.
- (a) `grep -n "OrderState" gra/src` poza cityPanel.ts/orderPanel.ts: konsumenci to
  `main.ts` (buduje/czyta `cityOrderState: Map<string, OrderState>`) i
  `empireDetailPanel.ts`/`empireDetailTypes.ts` (czytają wybrane pola przez
  `cityOrderState.get(...)`, nie przez cały obiekt). `main.ts::cityOrderState.set(...)`
  (~L29890) NIE wystawia `szMax`/`prawMax` (potwierdzone treścią literału) — pola
  pozostają `undefined` tam, gdzie się nie wypełnia, co jest zgodne z opcjonalnością i nie
  psuje istniejących odczytów (żaden z pozostałych konsumentów nie odwołuje się do
  `szMax`/`prawMax`). Brak regresji strukturalnej w `OrderState`.

BLOKADY: brak twardych blokad — dwa zarzuty jakościowe niżej (nie blokują GOAL wprost,
ale naruszają regułę anty-samooszukiwania / czytelność wyniku dla gracza).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator → Final Control (Ścieżka A, Workflow).

ZARZUTY:
1. `gra/src/ui/cityPanel.ts:3322` (wywołanie `appendW4PctMetricBlock` dla bloku "Prawo" w
   `renderSpoleczenstwo`) i `gra/src/ui/cityPanel.ts:3418` (`buildPorzadekDetailCard`,
   wiersz "Prawo"): obie linie budują etykietę punktów z `state.porzadek` —
   `${Math.round(state.porzadek)}/${Math.round(state.prawMax)} pkt`. `state.porzadek` to
   pole udokumentowane w `orderPanel.ts:18` jako „Legacy pkt prawa / pole porzadek
   historyczne" — myląca nazwa, bo w panelu istnieje OSOBNA, znacząca liczbowo inaczej
   metryka „Porządek łącznie" (`state.porPct`, wyświetlana kilka linijek niżej jako trzeci
   blok). Kod w miejscu przypisania (`computeOrderStateLocal`, cityPanel.ts:3202:
   `porzadek: ordPct.prawo.netto`) jest poprawny merytorycznie, ale w OBU miejscach
   WYŚWIETLANIA (3322, 3418) nie ma ŻADNEGO komentarza tłumaczącego, że
   `state.porzadek` = netto punkty Prawa, a NIE netto punkty „Porządku łącznie". To
   dokładnie scenariusz z reguły przeciw samooszukiwaniu w dispatchu tego tematu: przyszły
   czytelnik/edytor kodu, widząc `state.porzadek` obok etykiety „Prawo" i osobny blok
   „Porządek łącznie" kawałek dalej, może pomylić źródło liczby albo — gorzej — przy
   następnej zmianie (np. dodaniu czwartego bloku, refaktorze) podstawić przez pomyłkę
   `state.porPct` w tym samym miejscu, bo nazwa `porzadek` sugeruje właśnie „Porządek", nie
   „Prawo". Żąda się jawnego komentarza inline (lub przezwania/aliasu) przy obu
   wywołaniach, np. `// UWAGA: state.porzadek = netto Prawa (legacy nazwa), NIE mylić z
   state.porPct ("Porządek łącznie")`. Ma znaczenie dla GOAL, bo GOAL to czytelność —
   wprowadzenie punktów miało served jasność, a ukryta pułapka nazewnicza w kodzie
   podważa tę czytelność u źródła, dla następnego programisty.
2. `gra/src/ui/cityPanel.ts:3294-3304` (blok Szczęście) i analogiczne miejsce dla Prawa:
   liczba netto pokazywana w punktach (`Math.round(state.szczescie)` /
   `Math.round(state.porzadek)`) i mianownik (`Math.round(state.szMax)` /
   `Math.round(state.prawMax)`) są zaokrąglane NIEZALEŻNIE od procentu
   (`Math.round(state.szPct)`), który liczony jest z surowych, nie zaokrąglonych wartości
   silnika. Zweryfikowano ręcznie na fixture nowej bramki: surowe
   `netto=9.4, szMax=35.1, szPct=26.9` → wyświetlone `"27% (9/35 pkt)"`. Odbiorca widzący
   „9/35 pkt" naturalnie przeliczy 9÷35 = 25,7%, czyli INNY wynik niż wyświetlone 27% —
   liczby obok siebie nie zgadzają się arytmetycznie mimo że każda z osobna pochodzi z
   prawdziwych danych silnika. To nie błąd danych (obie liczby są autentyczne), ale defekt
   prezentacji, który wprost przeczy motywacji GOAL („punkty obok procentu, żeby procent
   był weryfikowalny") — w tym przykładzie punkty NIE pozwalają zweryfikować procentu,
   tylko wprowadzają w błąd. Do rozważenia przez Final Control: albo zaokrąglać netto/max
   SPÓJNIE z tym, jak liczony jest wyświetlany procent (np. pokazywać procent policzony z
   already-rounded netto/max), albo udokumentować w kodzie, że drobne rozjazdy
   zaokrągleń są świadomie akceptowane (i czy próg tolerancji jest znany/omówiony).
   Nie jest to zerwanie kontraktu punktów (b)/(c) z dyspozycji — obie liczby są realne i
   pochodzą z tej samej struktury — ale jakość czytelności dla gracza jest niżej niż
   sugeruje GOAL.

DEPLOY/PUSH: NIE WYKONANO

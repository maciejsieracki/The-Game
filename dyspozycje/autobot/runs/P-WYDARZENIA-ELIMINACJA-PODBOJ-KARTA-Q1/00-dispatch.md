TEMAT:  P-WYDARZENIA-ELIMINACJA-PODBOJ-KARTA-Q1
RUNDA:  1/5
DATA:   2026-09-12
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ

DECISION_REQUIRED #1 z tematu `R-WYDARZENIA-AUDYT-PRZEKIEROWANIA-Q1`
(zintegrowane, `dyspozycje/PYTANIA-OTWARTE.md`): karta eliminacji cywilizacji
PRZEZ PODBÓJ (dokładnie ta, którą właściciel pokazał na żywo na zrzucie
ekranu) jest dziś bierną kartą „Wydarzenie" bez przejścia — w przeciwieństwie
do eliminacji przez wchłonięcie dyplomatyczne, która ma już pełny modal ze
skrótem „Szczegóły →". **ECHO właściciela 2026-09-12: WARIANT A — zrównać
obie ścieżki.**

## GOAL

Eliminacja cywilizacji PRZEZ PODBÓJ (zdobycie ostatniego miasta przez INNĄ
CYWILIZACJĘ, `newOwner !== 0`) ma emitować DOKŁADNIE TAKI SAM mechanizm
karty jak eliminacja przez wchłonięcie dyplomatyczne: trwała karta w panelu
bocznym „Wydarzenia" (przeżywa `endTurnInProgress`, NIE ginie jako toast) ze
skrótem „Szczegóły →" otwierającym `showCivElimNotice()` z pełną treścią
(etykieta cywilizacji + liczba miast/szczegóły).

## DOKŁADNE MIEJSCA (potwierdzone czytaniem kodu 2026-09-12 — zweryfikuj przed
edycją, main.ts jest bardzo długi i mógł się nieznacznie przesunąć)

**Wzorzec do skopiowania (ścieżka dyplomatyczna, main.ts:28106-28125)**:
```
eliminateOwner(csOwnerId);
if (annexerId === 0) {
  recordCivElimEvent(
    csOwnerId,
    csLabel,
    `Wszystkie miasta (${cityCount}) wchłonięte dyplomatycznie.`,
  );
}
```
`recordCivElimEvent(csOwnerId, civLabel, details)` (main.ts:8397) zapisuje
kartę do `warEventLog` + `civElimEventDetails` (mapa id→szczegóły, czytana
przez `openSidePanelEventLink()` case `'civ-elim'`, main.ts:15356-15363, która
woła `showCivElimNotice({ civLabel, details })`).

**Miejsce do naprawy (ścieżka podboju, funkcja zawierająca
`runCapitalCapturePlunder`-owy kod eliminacji, main.ts ok. 28497-28531)**:
```
const eliminatedDetails = captureReportOneLine(eliminationRows);
...
} else if (newOwner !== 0) {
  // Zdobywcą jest AI — showCityCaptureNotice (modal) wyskakuje WYŁĄCZNIE dla gracza,
  // więc tu nie ma kolizji: toast zostaje jedynym i wystarczającym kanałem.
  showHintMessage(
    `${eliminatedCivLabel} — ELIMINACJA! Ostatnie miasto (${city.name}) przejęte przez ${civLabelForOwner(newOwner)}. ${eliminatedDetails}`,
    6000,
  );
}
eliminateOwner(oldOwner);
```
Ten branch (`newOwner !== 0`, zdobywcą jest AI, ofiara — gracz LUB inna AI —
traci OSTATNIE miasto) jest dokładnie tym przypadkiem z DECISION_REQUIRED.
Zastąp/uzupełnij `showHintMessage(...)` wywołaniem `recordCivElimEvent(
oldOwner, eliminatedCivLabel, eliminatedDetails)` (ta sama zmienna
`eliminatedDetails` już istnieje w tym scope z linii wcześniejszych —
`captureReportOneLine(eliminationRows)`), analogicznie do wzorca
dyplomatycznego. Zdecyduj (i uzasadnij w raporcie), czy toast
`showHintMessage` ma zostać USUNIĘTY (zastąpiony kartą, wzorem ścieżki
dyplomatycznej — komentarz tam mówi wprost „NIE toast") czy zostać OBOK karty
— rekomendacja: usunąć, dla spójności z drugą ścieżką i unikniecia podwójnego
powiadomienia o tym samym zdarzeniu.

**WAŻNE — przypadek `newOwner === 0` (gracz jest zdobywcą)**: NIE dotykaj tej
gałęzi bez wyraźnego potwierdzenia w kodzie — linia 28533 sugeruje, że wynik
`{eliminatedCivLabel, eliminatedDetails}` jest zwracany do wołającego, który
prawdopodobnie pokazuje `showCityCaptureNotice`/inny modal. To POZA zakresem
tego DECISION_REQUIRED (dotyczył karty side-panelu dla WIDZA zdarzenia u
przeciwnika, nie dla gracza-zdobywcy, który i tak dostaje pełnoekranowe
potwierdzenie). Jeśli w trakcie pracy okaże się, że gracz-ofiara (jego własna
eliminacja) też przechodzi przez ten sam branch — zweryfikuj i opisz w
raporcie, nie zgaduj.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ

1. Eliminacja cywilizacji przez podbój (AI-captor, `newOwner !== 0`) emituje
   trwałą kartę side-panelu identyczną mechanizmem z kartą wchłonięcia
   dyplomatycznego (przeżywa koniec tury, ma skrót „Szczegóły →").
2. Kliknięcie karty otwiera `showCivElimNotice()` z poprawną etykietą
   cywilizacji i szczegółami (liczba miast/przyczyna).
3. Ścieżka dyplomatyczna (`recordCivElimEvent` przy `annexerId===0`,
   main.ts:28106-28125) NIETKNIĘTA — zero regresu.
4. Ścieżka gracz-jako-zdobywca (`newOwner===0`) NIETKNIĘTA, chyba że recon w
   trakcie pracy jawnie wykaże że wymaga zmiany — wtedy opisz to w raporcie,
   nie zgaduj.
5. Żywy dowód Chromium: symulacja/test doprowadzający do eliminacji
   przeciwnika przez INNEGO przeciwnika (AI captor), pokazujący nową kartę w
   panelu bocznym i działający klik „Szczegóły →" → modal z treścią.
6. `tsc --noEmit` 0 błędów.
7. 5 bramek referencyjnych bez regresu + istniejące testy zdarzeń/side-panelu
   (`side-panel-event-link-test.cjs`, `sidepanel-event-przekierowania-real-
   render-test.cjs`, `sidepanel-event-header-wydarzenie-real-render-test.cjs`
   jeśli istnieje) bez regresu.

## DOWÓD WIZUALNY (obowiązkowy)

Zrzut ekranu panelu bocznego z nową kartą eliminacji-przez-podbój + zrzut
otwartego modalu `showCivElimNotice` po kliknięciu „Szczegóły →". Zapisz pod
`dowody/eliminacja-podboj-karta-i-modal.png` (jeden lub dwa pliki).

## Allowlista

- `gra/src/main.ts` (WYŁĄCZNIE funkcja zawierająca branch eliminacji-przez-
  podbój, ok. linii 28497-28534 — NIE dotykaj ścieżki dyplomatycznej
  28106-28129 ani niepowiązanych funkcji)
- nowa/rozszerzona bramka w `gra/tools/` (nazwij jasno, np.
  `wydarzenia-eliminacja-podboj-karta-test.cjs`)
- `dowody/eliminacja-podboj-karta-i-modal.png` (nowy plik)

Zakazane: `gra/data/*.json`, `gra/src/ui/entityCards/*`, `civElimNotice.ts`
(funkcja `showCivElimNotice` już istnieje i działa — używaj jej, nie
modyfikuj), pliki z sekretami, `docs/decyzje/*.md`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## Izolacja

Worktree `/home/user/wt-wydarzenia-eliminacja-podboj-karta`, gałąź
`autobot/P-WYDARZENIA-ELIMINACJA-PODBOJ-KARTA-Q1`, baza `origin/main`. C-001:
zakaz `npm run build`/`dev` w `gra/`; dozwolona wyłącznie `node
./node_modules/vite/bin/vite.js build --outDir <katalog spoza repo>
--emptyOutDir` oraz `node ./node_modules/typescript/bin/tsc --noEmit`.

## Procedura naprawcza przy FAIL

Evaluator wskazuje jeden konkretny defekt; runda N+1 na TYM SAMYM ID/gałęzi.
Po 5 rundach: LIMIT-5-EXCEEDED.

## Ograniczenia wyjścia

Maks. ok. 500 słów w raporcie; ścieżki+SHA zamiast diffu; zakaz `git add -A`.
Nie integrujesz, nie deployujesz, nie pushujesz.

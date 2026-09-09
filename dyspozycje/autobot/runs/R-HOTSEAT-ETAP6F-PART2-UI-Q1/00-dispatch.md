# Dispatch — R-HOTSEAT-ETAP6F-PART2-UI-Q1

## Kontekst

Drugi i OSTATNI pod-temat części (ii) Etapu 6f (`R-HOTSEAT-ETAP6F-PART2-RECON-Q1`).
Część (i) danych/generatora (`R-HOTSEAT-ETAP6F-PART2-DATA-Q1`) jest już w pełni
zintegrowana (commit `a59874e6`, zamknięta w rejestrze `c40b71ee`) — istnieje warstwa
danych i generator (`selCiv2`/`civId2`/`civName2` w `NewGameParams`, `HumanDistanceMode`,
`pickSecondHumanStartHex`, `ClusterStartPlan.secondPlayerStartHex/secondPlayerOwnerId`,
`applyClusterStartPlan(...)` z gotowym `opts.secondHumanCivId`/`opts.humanDistanceMode`),
ale ZERO UI ją dziś wywołuje. Ten temat domyka to i tym samym całą resztę planu
hot-seat Etapy 0-7 (`docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md`).

## GOAL

Gracz może z menu „Nowa Gra" świadomie włączyć drugiego człowieka (fotel 2), wybrać mu
cywilizację i tryb odległości heksu startowego względem fotela 1; `doStartGame()`
przekazuje te dane do już istniejącego `applyClusterStartPlan(...)`. Domyślnie
(bez świadomej akcji gracza) zachowanie jest DOKŁADNIE takie jak dziś — jednoosobowe.

## ABC już rozstrzygnięte (recon `R-HOTSEAT-ETAP6F-PART2-RECON-Q1` §4) — WIĄŻĄCE, nie do renegocjacji w tym temacie

- **ABC-Q1 = algorytmiczny.** Heks fotela 2 NIE jest klikany na mapie — generowany
  przez istniejący `pickSecondHumanStartHex`/`buildClusterStartPlan`, tak jak dziś
  dla fotela 1. Nie dodawaj żadnego ekranu wyboru heksu na mapie.
- **ABC-Q2 = Wariant A „sekwencyjny".** Fotel 1 przechodzi standardową, DZISIEJSZĄ
  ścieżkę bez zmian (kroki 1-5 w `newGameFlow.ts`, `curStep`/`STEP_LABELS`
  niezmienione dla fotela 1). Dopiero PO tym dochodzi dodatkowy krok/ekran
  wyłącznie dla wyboru cywilizacji fotela 2 (reużyj `selectedCiv()`/wzorzec
  kafelków z `renderCivStep`, linie ok. 1063-1109) + selektor trybu odległości.
  Nie implementuj wariantu B (naprzemienny) ani C (dwa pola jednocześnie).
- **ABC-Q3 = wyklucz duplikat cywilizacji.** Fotel 2 NIE może wybrać tej samej
  cywilizacji co fotel 1. Warstwa danych już rzuca wyjątek przy duplikacie
  (`cluster-start.ts`, walidacja ABC-Q3 z części (i)) — UI musi to potraktować
  jako obronę w głębi (proaktywnie wykluczyć/wyszarzyć kafelek już wybrany przez
  fotel 1 w ekranie fotela 2), nie polegać wyłącznie na wyjątku w runtime.
- **ABC-Q4 = opcja widoczna dla gracza.** Selektor blisko/daleko/losowo
  (`HumanDistanceMode` z `cluster-spawn.ts`/`cluster-start.ts`) musi być realnym,
  klikalnym elementem UI w nowym ekranie/kroku fotela 2 — nie ukrytą stałą.
- **ABC-Q5 = dev/quick-start ścieżki zostają single-seat-only.** Nie dotykaj żadnej
  ścieżki tworzącej `NewGameParams` z twardo wpisaną jedną cywilizacją (quick-start,
  dev-shortcuts) — mają pozostać bez fotela 2, bez zmian.
- **ABC-Q6 = to jest DRUGI, samodzielny pod-temat.** Zakres tego tematu to WYŁĄCZNIE
  UI + wiring `doStartGame()`. Warstwa danych/generatora jest już gotowa i NIE do
  zmiany poza tym, co wymaga realnego podłączenia.

## Zakres implementacji (wiążący, wynika z recon + odczytu bieżącego stanu kodu)

1. **`gra/src/ui/newGameFlow.ts`**
   - Dodaj mechanizm włączenia trybu „drugi gracz / hot-seat" (checkbox/przełącznik)
     widoczny graczowi w TYM SAMYM kreatorze „Nowa Gra" (WIĄŻĄCE, wprost od
     właściciela 2026-09-09: dziś ani menu główne, ani kreator nie mają żadnego
     wejścia do hot-seatu — jedyny istniejący przycisk „Multiplayer" w menu głównym
     to zablokowany placeholder „wkrótce", `mainMenu.ts:435`, NIE dotykaj go i NIE
     twórz osobnego wejścia menu głównego dla hot-seatu w tym temacie). Rozwiązanie:
     jeden kreator, ta sama ścieżka co dziś dla single-player, z jawnie nazwaną
     opcją (np. „Dodaj drugiego gracza (hot-seat)") — domyślnie WYŁĄCZONA (civ2
     unset, `selCiv2` pozostaje `null`, zero wpływu na dzisiejszy przebieg
     jednoosobowy, jeśli gracz nic nie zmieni). Umieszczenie w obrębie kroku 4
     „Ustawienia Rozgrywki" (`renderSettStep`) jest preferowane — musi być
     widoczne PRZED krokiem 5 (generowanie), żeby dodatkowy krok wyboru
     cywilizacji fotela 2 (niżej) mógł się wstawić zanim gra faktycznie wystartuje.
   - Gdy włączony: po dotychczasowym kroku 4 (albo w jego obrębie — wybierz to,
     co mniej narusza istniejący layout `STEP_LABELS`/`curStep` 1-5) dodaj krok
     wyboru cywilizacji fotela 2, reużywając wzorca `selectedCiv()`/kafelków
     (linie ok. 1063-1109) na nowej zmiennej `selCiv2` (JUŻ zadeklarowanej,
     linia 789, dziś nigdy nie ustawianej — to jest dokładnie luka do zamknięcia).
     Kafelek cywilizacji już wybranej przez fotel 1 (`selCiv`) musi być
     wyszarzony/nieklikalny (ABC-Q3, obrona w głębi).
   - Dodaj selektor `HumanDistanceMode` (blisko/daleko/losowo) w tym samym nowym
     kroku/ekranie fotela 2.
   - `buildParams()` (linie ok. 1613-1629) już emituje `civId2`/`civName2` z
     `selCiv2` — dodaj analogiczne pole `humanDistanceMode` do `NewGameParams`
     (dziś go nie ma, tylko `civId2`/`civName2`, linie 100-102) i do zwracanego
     obiektu, tylko gdy tryb dwuosobowy jest włączony (inaczej `undefined`).
   - `resetujDoDomyslnych()`/reset stanu (linia ok. 1924, `selCiv2 = null`) —
     zresetuj też nowy przełącznik/tryb odległości do wartości domyślnych.
2. **`gra/src/main.ts`**
   - `doStartGame()` (linia ok. 35318): przekaż `params.civId2` i
     `params.humanDistanceMode` do wywołania `applyClusterStartPlan(...)` jako
     `opts.secondHumanCivId`/`opts.humanDistanceMode` — dziś te opcje istnieją
     w sygnaturze (linia ok. 8504-8534) ale wywołanie ich nie przekazuje. To
     JEDYNA zmiana wymagana w tym pliku poza ewentualnym drobnym typowaniem.
3. **Test bramkowy nowy**: `gra/tools/hotseat-etap6f-part2-ui-test.cjs` (wzorem
   `hotseat-etap6f-part2-data-test.cjs`) — musi dowieść na żywym Chromium (build
   vite, C-001):
   a) Domyślnie (bez dotknięcia przełącznika) `NewGameParams` wynikowe z
      kreatora NIE zawiera `civId2`/`humanDistanceMode` (zero regresji na
      dzisiejszej ścieżce jednoosobowej) — dowód przez zrzut stanu, nie
      deklarację.
   b) Po włączeniu trybu dwuosobowego i wyborze cywilizacji fotela 2 + trybu
      odległości: `NewGameParams` zawiera poprawne `civId2`/`civName2`/
      `humanDistanceMode`, a start gry realnie tworzy drugiego człowieka
      (sprawdź efekt końcowy w silniku — nie tylko wartość parametrów).
   c) Kafelek cywilizacji fotela 1 jest niewybieralny/wyszarzony w ekranie
      fotela 2 (ABC-Q3, dowód ze zrzutu DOM/stanu, nie z samej obecności kodu).
   d) Regresja: quick-start/dev-shortcuty (ABC-Q5) nadal produkują
      `NewGameParams` bez `civId2` — niezmienione.

## Notatka — `hotSeatEnabled()` jest martwym kodem, NIE trzeba go wiązać

`main.ts:9781` (`hotSeatEnabled()`, flaga `VITE_CIV_HOTSEAT`/`?hotseat=1`) nigdzie nie
jest dziś wywoływana. Realny mechanizm hot-seat (`advanceSeat()`, handoff, pętle
bankowania per `humanSeats.humanOwnerIds`) jest bramkowany WYŁĄCZNIE długością
`humanSeats.humanOwnerIds` (>1 = drugi fotel aktywny) — NIE tą flagą. Nie trzeba jej
wiązać z nowym UI, żeby ten temat działał. Jeśli chcesz ją usunąć jako martwy kod —
zgłoś to jako osobną, jednolinijkową uwagę w raporcie, NIE rób tego w tym samym
commit-cyklu bez jawnej zgody (poza allowlistą tego tematu, main.ts poza jednym
dozwolonym miejscem w `doStartGame()`).

## Reguła przeciw samooszukiwaniu

Zakaz uznania tego tematu za zamknięty na podstawie samej obecności nowego kodu UI
lub przejścia testu, który tylko sprawdza WARTOŚĆ `NewGameParams` bez uruchomienia
realnego `applyClusterStartPlan`/startu gry na żywym Chromium. Wymagany dowód: zrzut
stanu silnika PO starcie gry z włączonym trybem dwuosobowym pokazujący drugiego
człowieka z jego cywilizacją i heksem startowym różnym od fotela 1 — analogicznie do
dowodu wymaganego w `R-HOTSEAT-ETAP6F-PART2-DATA-Q1` (kolizja z miastami AI była tam
złapana dopiero przy takim dowodzie, nie przy samej jednostce testowej na poziomie
funkcji).

## Binarne kryterium sukcesu

`node gra/tools/hotseat-etap6f-part2-ui-test.cjs` PASS (scenariusze a-d powyżej) ORAZ
`tsc --noEmit` czysty ORAZ 5 bramek referencyjnych (logic-test, tech-tree-test,
research-test, unit-replace-test, combat-test) zielone ORAZ
`node gra/tools/hotseat-etap6f-part2-data-test.cjs` nadal PASS (brak regresji części i).

## Allowlista

- `gra/src/ui/newGameFlow.ts`
- `gra/src/main.ts` (WYŁĄCZNIE wywołanie `applyClusterStartPlan` w `doStartGame()`
  — zakaz zmian poza tym miejscem bez jawnego uzasadnienia w raporcie)
- nowy plik `gra/tools/hotseat-etap6f-part2-ui-test.cjs`

Zakazane bezwzględnie: pliki z sekretami, `docs/decyzje/R-HOTSEAT-ETAP6F-PART2-UI-Q1.md`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`,
`gra/src/map/cluster-spawn.ts`, `gra/src/game/cluster-start.ts` (warstwa danych część (i)
— zamknięta, nie dotykać bez DECISION_REQUIRED).

## Izolacja

Worktree `/home/user/wt-6f-part2-ui`, gałąź `autobot/R-HOTSEAT-ETAP6F-PART2-UI-Q1`,
baza `origin/main` (jawnie, weryfikacja `git merge-base` przed integracją — nie ufaj
deklaracji). C-001: zakaz `npm run build`/`dev` w `gra/`; dozwolona wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir <katalog spoza repo> --emptyOutDir`
oraz `node ./node_modules/typescript/bin/tsc --noEmit`.

## Procedura naprawcza przy FAIL

Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID i
TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## Ograniczenia wyjścia

Maks. ok. 400 słów w raporcie na etap; ścieżki+SHA zamiast diffu; brak `git add -A`;
przy decyzji produktowej — STATUS: DECISION_REQUIRED.

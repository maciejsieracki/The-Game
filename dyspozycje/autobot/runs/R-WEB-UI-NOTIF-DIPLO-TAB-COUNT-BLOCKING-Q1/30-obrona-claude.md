STATUS: PASS-WITH-NOTES (obrona Operatora r2; live NIE_ZMIERZONO z powodem)
DOMAIN: GAME
TEMAT: R-WEB-UI-NOTIF-DIPLO-TAB-COUNT-BLOCKING-Q1
GOAL: licznik zakładki „Dyplomacja” wlicza blokujące propozycje diplo, a lista po kliknięciu zakładki pokazuje te karty; bez zmiany pozostałych liczników i kart blokujących nie-diplo.
ZMIANY-COMMIT: kod obrony `a09b926dc3e0c8f070fe1a298e3fb4f6d549c0d5` (baza 501f78c08, kandydat Operatora 33e691776). Pliki (allowlista): gra/src/ui/sidePanelEventFilter.ts, gra/src/ui/sidePanelHud.ts, gra/tools/notif-diplo-tab-count-blocking-test.cjs. Brak zmian w gra/data, WERSJE.md, main.ts, rust-port/, gra-robocza/. `git diff --check`: czysto. SHA końcowy raportu: patrz pole sha w odpowiedzi (commit tego pliku).

## Odpowiedzi na zarzuty Evaluatora (1adb131c9)

ZARZUT 1 (test nie chroni okablowania HUD) — PRZYJMUJĘ, naprawione.
- Logikę rachunku zakładek przeniesiono z render() do czystej funkcji `sidePanelTabModelOf(events, {activeTab, activeTabPicked})` (sidePanelEventFilter.ts). HUD (sidePanelHud.ts ~760–764) używa wyłącznie jej wyniku: tabCounts, infoEvents, relevantInfo, orderedEvents, activeTab.
- Test sekcja (7) wywołuje tę funkcję (nie helpery) i sprawdza: licznik Dyplomacja = 3 (info diplo + AI↔AI + blokująca diplo), lista zakładki zawiera kartę blokującą (blocking:false), liczba kart = licznik, oryginał zostaje w blockingEvents, nagłówek/„Zamknij wszystkie” (relevantInfo) bez kopii, domyślna zakładka nie przełącza się na Dyplomację, wybór gracza zachowany.
- DOWÓD MUTACYJNY (wykonany): w sidePanelEventFilter.ts w `sidePanelTabModelOf` zamieniono `tabSourceEventsOf(events)` na `allInfoEvents` (stare okablowanie). Wynik: `Wynik: 19 OK, 3 FAIL`, exit 1. Po przywróceniu pliku: `Wynik: 22 OK, 0 FAIL`, exit 0.

ZARZUT 2 (brak weryfikacji live T17, scenariusz war) — PRZYJMUJĘ jako brak; NIE_ZMIERZONO z powodem.
- Powód: runner gra/tools/live-verify-wave-689-697-b2-panel-run.cjs (SCEN=war) to harness wieloturowy dla innego panelu (sekcje probe/pairStates), nie ma w nim kroku „propozycja pokoju od AI w T17 + odczyt licznika/klik zakładki”. Przygotowanie wymaga osobnego runnera i buildu vite do /tmp, poza zakresem tej rundy obrony. Nie wykonano zrzutu licznika „Dyplomacja”=1.
- Uzupełnienie dowodu zamiast live: sidepanel-diplo-dismiss-real-render-test (prawdziwy render DOM, jsdom): 35 pass, 0 fail na bieżącym kodzie (po zmianie tabMirror). Test ten potwierdza: ✕ na karcie blokującej diplo zamyka przez onEventDismiss (B3–B5).

ZARZUT 3 (duplikat karty w DOM, rozjazd nagłówka) — CZĘŚCIOWO PRZYJMUJĘ, CZĘŚCIOWO ODRZUCAM.
- ODRZUCAM jako defekt samo zdublowanie karty (nad zakładkami jako „wymaga decyzji” + kopia na liście „Dyplomacja”). Dispatch (00-dispatch.md, „ZADANIE (1)”, opcja 1) wprost dopuszcza to rozwiązanie: „albo zostają też nad zakładkami ... (wtedy pokaż je też w zakładce ...)”. Oryginał nad zakładkami jest zachowany (sidePanelHud.ts: blockingEvents → orderedEvents), co spełnia „NIE ukrywaj blokującej decyzji gracza”.
- PRZYJMUJĘ i NAPRAWIAM (ukryty defekt wykryty przy obronie): kopia blokująca miała blocking:false, więc (a) renderowała się z przyciskiem ✕ i (b) była zamykana klawiszem Escape (handler sidePanelHud.ts ~660 zamykał każdą kartę `.sp-event:not(.sp-blocking)[data-id]` przez onEventDismiss). Oba to zamknięcie blokującej decyzji poza jej kanałem, czego design (P-DYPLO-KARTA-DECYZJI-DISMISS-UCIETY-Q1) zakazuje. Poprawka: kopia dostaje `tabMirror:true` (sidePanelEventFilter.ts, tabSourceEventsOf); render nie dodaje ✕ dla `tabMirror` i dodaje klasę `sp-mirror`; selektor Escape to `.sp-event:not(.sp-blocking):not(.sp-mirror)[data-id]`. Oryginał (bez tabMirror) zachowuje ✕ i brak Escape jak dotąd.
- ODRZUCAM zarzut o rozjeździe nagłówka: nagłówek „N informacyjnych” liczy relevantInfo = allInfoEvents (bez kopii) z zamiarem — kopia nie jest informacją, tylko kartą decyzji. Nagłówek „N wymaga decyzji” liczy blockingEvents i zawiera tę kartę (1), więc nie wprowadza w błąd. „Zamknij wszystkie informacyjne” (dismissAll) iteruje relevantInfo, więc NIE zamyka blokującej decyzji — zgodnie z dispatchem.
- Znane, nienaprawione (do decyzji orkiestratora): kopia ma to samo data-id co oryginał (dwa elementy DOM o tym samym id). Zachowanie przy kliknięciu/„Rozpatrz” nie zmienia się względem zwykłej karty diplo; nie zgłoszono błędu funkcjonalnego.

## Testy (surowe wyniki, ten commit a09b926dc)
- tsc --noEmit (gra/): exit 0.
- notif-diplo-tab-count-blocking-test.cjs: `Wynik: 25 OK, 0 FAIL`, exit 0 (sekcje 1–8 incl. (7) HUD-wiring i (8) tabMirror).
- Czerwony na bazie 501f78c08: do src przywrócono wersje z 501f78c08 (git show → plik), test: exit 1 (brak eksportu tabSourceEventsOf/sidePanelTabModelOf). Potem przywrócono pliki z roboczego commitu; `25 OK, 0 FAIL`.
- Mutacja (stare okablowanie allInfoEvents): `19 OK, 3 FAIL`, exit 1.
- logic-test: exit 0 (ostatnia linia: `PASS  [213] cityfix: pop1 territory radius is 5 (B min start)`).
- tech-tree-test: exit 0, `20 pass, 0 fail`.
- research-test: exit 0, `PASSED: 33 / FAILED: 0 / TOTAL: 33`.
- unit-replace-test: exit 0, `WSZYSTKIE TESTY ZIELONE (21/21)`.
- combat-test: exit 0, `COMBAT TEST: 6/6 pass`.
- sidepanel-event-tabs-classify-test: exit 0, `PASS`.
- sidepanel-diplo-dismiss-real-render-test (DOM, jsdom): `35 pass, 0 fail`, exit 0 (na kodzie z tabMirror).
- git diff --check: czysto.
- Uwaga środowiskowa: sidepanel-event-tabs-classify i render-test uruchamiane w foreground; render-test trwa >120 s (limit narzędzia wymagał podania timeout).

## Pliki pomocnicze poza commitem
- gra/node_modules utworzono przez `npm ci --ignore-scripts` w worktree (ignorowany przez git, nie commitowany). Do usunięcia przy sprzątaniu worktree przez orkiestratora.
- Pliki robocze wf21-* w katalogu nadrzędnym worktrees/ (logi testów) — usuwane na końcu obrony.

## BLOKADY
- Brak weryfikacji live w przeglądarce (zarzut 2, NIE_ZMIERZONO z powodem jak wyżej). Nie wykonano pomiaru licznika „Dyplomacja”=1 w T17.
- Brak zrzutu ekranu.

## RUNDY
- Obrona Operatora, runda 2/5 (po FAIL-Evaluatora zarzutów 1–3, z 1adb131c9). Poprzedni werdykt: PASS-WITH-NOTES. Decyzja wymagana: brak (decyzje produktowe nie są potrzebne; ewentualna weryfikacja live do zdecydowania przez orkiestratora).

## UWAGI-DLA-ORKIESTRATORA
- Dispatch `00-dispatch.md` nie istnieje w ścieżce origin/main o tej nazwie (git show origin/main: „does not exist”); istnieje w gałęzi origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 i w kandydacie 33e691776. Użyto treści z tej gałęzi (ta sama treść zadania, ZADANIE (1)–(4), ALLOWLISTA).
- Kandydat 33e691776 nie należy do żadnej gałęzi lokalnej/zdalnej pobranej tym worktree (git branch --contains pusty); worktree przełączono detached na 33e691776, a następnie zrobiono commit a09b926dc na tym detached HEAD. Orkiestrator powinien złapać SHA a09b926dc, a nie gałąź.
- Nie pushowano. Nie integrowano na main. Nie deployowano.
- Sugestia na przyszłość (nie wykonywana): ewentualny runner live dla propozycji pokoju w T17 (osobny temat, jeśli właściciel chce dowodu wizualnego).

## NASTĘPNY KROK
Evaluator: ponowna weryfikacja a09b926dc (zarzut 3 naprawiony przez tabMirror; zarzut 1 przez sidePanelTabModelOf z testem (7) i mutacją; zarzut 2 jako NIE_ZMIERZONO). Potem Final Control.

DEPLOY/PUSH: NIE WYKONANO

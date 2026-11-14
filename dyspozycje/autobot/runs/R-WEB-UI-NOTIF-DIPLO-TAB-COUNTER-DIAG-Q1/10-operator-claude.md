# R-WEB-UI-NOTIF-DIPLO-TAB-COUNTER-DIAG-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES (diagnoza bez zmian w grze; werdykt: ZAMIERZONE + DECYZJA PRODUKTOWA)
DOMAIN: GAME (diagnoza UI panelu wydarzeń; zero zmian w kodzie)
TEMAT: R-WEB-UI-NOTIF-DIPLO-TAB-COUNTER-DIAG-Q1
GOAL: ustalić, czy licznik zakładki „Dyplomacja” zostaje 0 przy propozycji pokoju od AI przez błąd, czy zamierzenie.
BAZA: 3cc49c07b (origin/main, „ROBOCZA 78c3a278 FALA 702”), checkout --detach.
ZMIANY-COMMIT: tylko ten raport (dyspozycje/autobot/runs/R-WEB-UI-NOTIF-DIPLO-TAB-COUNTER-DIAG-Q1/10-operator-claude.md). Zero zmian w gra/src, gra/data, WERSJE.md.
SHA: patrz pole sha w odpowiedzi (commit z tym plikiem).

## 1. Skąd bierze się karta propozycji (potwierdzone w kodzie)

- Karta „Dyplomacja: <AI> Rozpatrz” NIE jest osobnym widżetem. To wpis `SidePanelEvent` z listy zdarzeń tury:
  - gra/src/main.ts:19545-19551 — pętla `for (const p of pendingDiplomacyInbox)` dodaje `{ id: p.id, title: 'Dyplomacja: ' + p.civName, kind: 'diplo', blocking: true }`.
  - gra/src/main.ts:19555-19566 — to samo dla `negotiationTable` (stół negocjacyjny, `id: n.id`, `kind: 'diplo'`, `blocking: true`).
  - „Rozpatrz →” to tekst zwiniętej karty blokującej w kolejce: gra/src/ui/sidePanelHud.ts:866-869.
- Wpis powstaje przy `enqueueDiplomacyPending` (gra/src/main.ts ~21914-21935), id `diplo-pend-…`.

## 2. Gdzie wpis wpada w liczniki

- gra/src/ui/sidePanelHud.ts:760-761 — `blockingEvents = events.filter(ev => ev.blocking === true)`; `allInfoEvents = events.filter(ev => ev.blocking !== true)`.
- gra/src/ui/sidePanelHud.ts:763 — `tabCounts = tabCountsOf(allInfoEvents, true)`. Liczniki zakładek liczą WYŁĄCZNIE `allInfoEvents`.
- Karta blokująca (`blocking: true`) nie trafia do `tabCountsOf` w ogóle, więc licznik „Dyplomacja” nie może jej wliczyć.
- Komentarz projektowy, gra/src/ui/sidePanelHud.ts:757-759: „R-WEB-UI-NOTIFICATIONS-3-TABS-PRUNE-Q1: karty blokujące są zawsze widoczne (niezależnie od zakładki); zakładki filtrują WYŁĄCZNIE wpisy informacyjne.”
- Karta jest widoczna w innym miejscu: nagłówek liczy ją jako „N wymaga decyzji” (gra/src/ui/sidePanelHud.ts:775-776) i stoi na górze kolejki (`orderedEvents = [...blockingEvents, ...infoEvents]`, linia 769).

## 3. Klasyfikacja `eventTabOf` (ma znaczenie tylko dla wpisów informacyjnych)

- gra/src/ui/sidePanelEventTabs.ts:77 — reguła 1: `kind === 'diplo' || origin === 'other-civs' || title.startsWith('Dyplomacja')` → `'dyplomacja'`. Reguła 1 wyprzedza `blocking` (linia 80).
- Test na kopii pliku z HEAD (node 22 `--experimental-strip-types`, bez esbuild):
  - blocking diplo card (`Dyplomacja: Egipt`, kind diplo, blocking true) → `dyplomacja`
  - info diplo entry (kind diplo, blocking false) → `dyplomacja`
  - blocking enemy card (kind enemy, blocking true) → `wazne`
- Rozbieżność z treścią dispatchu: dispatch zakładał „karty blokujące trafiają do Ważne”. Dla `kind:'diplo'` klasyfikator daje Dyplomację. Nie ma to wpływu na licznik, bo karty blokujące są wykluczone z `tabCountsOf` (punkt 2). Ma to wpływ tylko, jeśli kiedyś zmieni się filtr z linii 761.

## 4. Werdykt

**ZAMIERZONE (w świetle kodu i komentarza z R-WEB-UI-NOTIFICATIONS-3-TABS-PRUNE-Q1), z otwartą DECYZJĄ PRODUKTOWĄ.**

- Licznik zakładki to licznik wpisów informacyjnych. Propozycja pokoju jest kartą decyzyjną (`blocking: true`) i jest pokazywana jako „1 wymaga decyzji” oraz jako pierwsza karta w kolejce. Zero w „Dyplomacja” nie znaczy, że propozycja zginęła.
- NIE stwierdzono błędu wykonania: wpis jest budowany, trafia do `events` i do `blockingEvents`.

**DECYZJA PRODUKTOWA (pytanie ABC do właściciela):**
- Pytanie: czy licznik zakładki „Dyplomacja” ma wliczać także otwarte karty decyzyjne dyplomacji (propozycje AI, stół negocjacyjny)?
  - A — zostaje obecny stan (rekomendacja): licznik = tylko informacyjne; propozycja widoczna w nagłówku „wymaga decyzji” i na górze kolejki. Zero zmian.
  - B — licznik „Dyplomacja” wlicza też `blocking && kind==='diplo'`. Zmiana: sidePanelHud.ts:763 (dodać te karty do liczenia zakładki dyplomacja, bez zmiany listy blokujących); szacunek ≤ 10 linii + test. Konsekwencja: licznik „Dyplomacja” i „N wymaga decyzji” pokażą tę samą kartę dwa razy.
- Rekomendacja Operatora: A, bo powielanie liczby w dwóch miejscach jest mylące, a karta jest już widoczna.

**Kandydat na osobny temat (tylko jeśli właściciel wybierze B):** poprawka dokumentacji komentarza w gra/src/ui/sidePanelEventTabs.ts:7-16 i sidePanelHud.ts:757-759, bo dispatch i komentarze mówią „blocking → Ważne”, a kod daje „Dyplomacja” dla `kind:'diplo'`.

## 5. Zakresy niezbadane (NIE_ZMIERZONO)

- NIE_ZMIERZONO na żywo: nie uruchomiono gry ani runnera `gra/tools/live-verify-wave-689-697-b2-panel-run.cjs`; liczby z zrzutów T17 nie były odtwarzane. Werdykt opiera się na kodzie, nie na DOM.
- NIE_ZMIERZONO: plakietka na ikonie dyplomacji i kafel w tablicy negocjacji (osobne widżety; nie badane).
- NIE_ZMIERZONO: `negotiationTable` — `negot-*` nie sprawdzano pod kątem, czy karta stołu może pojawić się bez wpisu `diplo-pend-*`.
- Nie uruchamiano testów `gra/tools/sidepanel-event-tabs-classify-test.cjs` (brak `node_modules/esbuild` w worktree; nie instalowano zależności).

## 6. Bramki

- `git diff --check`: wykonać przed commitem (wynik w odpowiedzi orkiestratora).
- Zero zmian w gra/src i gra/data (potwierdzone `git status` przed commitem).

## UWAGI-DLA-ORKIESTRATORA

- Dispatch znajduje się wyłącznie w gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (w `origin/main` ścieżka nie istnieje). Odczytano z tej gałęzi.
- Dla rozstrzygnięcia B/A właściciel potrzebuje pytania ABC (zasada 3 CLAUDE.md). Operator nie wybiera progu/balansu sam.

RUNDY: 1/5
NASTĘPNY KROK: decyzja właściciela A/B (pytanie wyżej); przy B osobny temat R-WEB-* (≤ 10 linii) z testem.
DEPLOY/PUSH: NIE WYKONANO

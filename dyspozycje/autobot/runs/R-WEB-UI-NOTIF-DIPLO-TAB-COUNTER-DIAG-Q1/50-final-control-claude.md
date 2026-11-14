# R-WEB-UI-NOTIF-DIPLO-TAB-COUNTER-DIAG-Q1 — raport Final Control

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (diagnoza UI, zero zmian w kodzie)
TEMAT: R-WEB-UI-NOTIF-DIPLO-TAB-COUNTER-DIAG-Q1
GOAL: ustalić, czy licznik zakładki „Dyplomacja” = 0 przy propozycji pokoju od AI to defekt czy zamierzenie.
ZMIANY-COMMIT: kandydat bd905d63a (tylko 10-operator-claude.md, 70 linii). Integrować bd905d63a (raport FC dołączony osobnym commitem).
TESTY (z surowego wyjścia):
- git merge-base --is-ancestor 3cc49c07b bd905d63a: TAK (potomek bazy).
- git diff --stat 3cc49c07b bd905d63a: 1 plik, 70 insercji; zero zmian w gra/src, gra/data, WERSJE.md (allowlista OK).
- git diff --check 3cc49c07b bd905d63a: czysty.
- tsc --noEmit i 5 bramek referencyjnych: nie uruchomiono; diff zawiera wyłącznie .md, więc kod identyczny z bazą (nie ma czego porównywać baza vs kandydat).
- Cytaty plik:linia zweryfikowane samodzielnie na bd905d63a: sidePanelHud.ts:760-763 (tabCounts z allInfoEvents; blocking wykluczone), sidePanelEventTabs.ts:77 (kind==='diplo' przed blocking → dyplomacja), main.ts:19543-19566 (kind:'diplo', blocking:true). Zgodne z raportem.
WERDYKT MERYTORYCZNY: ZAMIERZONE (komentarz sidePanelHud.ts:757-759) + DECYZJA PRODUKTOWA A/B do właściciela; rekomendacja A.

ZARZUTY:
1. Pole SHA / diff --check bez wyniku: ODDAL (drobne, dokumentacyjne). FC podaje SHA bd905d63a i wynik diff --check (czysty).
2. Wariant B niepełny (lista po kliknięciu nie pokaże karty, bo filtr działa na allInfoEvents): ODDAL jako zarzut do raportu, ale POTWIERDZONE w kodzie (sidePanelHud.ts:761-768) — wzmacnia rekomendację A. Przy wyborze B zmiana nie mieści się w „≤10 linii”: trzeba też zmienić listę zakładki. Do pytania ABC dla właściciela.
3. NIE_ZMIERZONO na żywo zbyt zachowawcze: ODDAL (drobne). Werdykt rozstrzyga kod; dowód DOM T17 istnieje w runie LIVE-VERIFY-WAVE-689-697-B2. Test sidepanel-event-tabs-classify-test.cjs nie uruchomiony (brak zmian w kodzie).
Brak pozycji NAPRAW. Brak weryfikacji w Chromium: temat bez zmian wizualnych.

BLOKADY: brak. Uwaga: obrona Operatora zakończyła się BLOCK infrastrukturalnym (brak worktree), bez wpływu na werdykt — zarzuty rozpatrzone tu bezpośrednio.
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator integruje raport; pytanie ABC do właściciela (A: zostaje, rekomendowane; B: licznik + zmiana listy zakładki, większa niż 10 linii). Przy B — osobny temat R-WEB-*.

UWAGI-DLA-ORKIESTRATORA: dispatch istnieje tylko na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0, nie w origin/main.
DEPLOY-PUSH: NIE WYKONANO

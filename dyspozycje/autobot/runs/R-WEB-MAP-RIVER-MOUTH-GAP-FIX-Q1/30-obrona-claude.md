STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-MAP-RIVER-MOUTH-GAP-FIX-Q1
GOAL: wymusić ujście głównej rzeki, gdy odstęp wzdłuż wybrzeża > limit (Standard 7, Mała 5); kontynenty 42 i pangea 7 do worstGap <= 7.
ZMIANY/COMMIT: gra/tools/river-mouth-gap-enforce-test.cjs (nowy test, CZERWONY na bazie e80d07efb, zgodnie z dispatchem). Kod generatora (gra/src/map/*) bez zmian: próba naprawy została wycofana (patrz DIAGNOZA-2). Baza: b1808092e (kandydat) = e80d07efb w gra/src.
TESTY:
- Odtworzenie na bazie, r3 kontynenty seed 42, 168x120 (skrypt repro/r3-river-mouth-gap.cjs, surowe wyjście):
  limitMaxGap=7, landMassesChecked=20, mainRiverPaths=120, worstGapAll=18.
  badMasses (rozmiar:worstGap): 265:15, 145:11, 12:12, 12:9, 10:10, 590:10, 1011:8, 19:18. Łącznie 8 z 20 mas łamie limit.
  Czas generacji (total) 111674 ms (riversMain 72920, riversFill 34077) — jedyny pomiar bazowy; PO naprawie NIE ZMIERZONO (brak naprawy).
- Nowy test gra/tools/river-mouth-gap-enforce-test.cjs na bazie: 0 pass, 2 fail (wynik surowy):
  FAIL: kontynenty seed 42: ujścia main co ≤7 hex wzdłuż brzegu (złe masy 8, worst 18)
  FAIL: pangea seed 7: ujścia main co ≤7 hex wzdłuż brzegu (złe masy 1, worst 15)
  river-mouth-gap-enforce-test: 0 pass, 2 fail (exit 1, czas 2m7s).
  Mutacja i zielony po naprawie: NIE ZMIERZONO (brak naprawy).
- tsc: `npx tsc --noEmit -p gra` exit 0 (na drzewie z nowym testem; kod generatora nietknięty).
- Bramki logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297/0, climate-band, river-sea-buffer, rodzina rzek (river-density, river-loop, river-path-adjacency, river-yield-both-sides), earth-template: NIE ZMIERZONO (brak zmiany kodu gry; nie uruchamiane, by nie tracić rund na bramki bez efektu).
- Mała mapa (limit 5) i 3 dodatkowe mapy z tabelą przed/po: NIE ZMIERZONO (brak naprawy, brak sensu porównania przed/po).

ODPOWIEDZI NA ZARZUTY EVALUATORA:
1. PRZYJMUJĘ. Kandydat nie zawiera naprawy i ta runda również nie dostarcza naprawy. Próbę naprawy opisano w DIAGNOZA-2; wynik negatywny, kod wycofany (git checkout gra/src/map/gen-helpers.ts).
2. PRZYJMUJĘ. Dodano test (gra/tools/river-mouth-gap-enforce-test.cjs) dla kontynenty 42 i pangea 7; jest czerwony na bazie (dowód w TESTY). Zieloną stronę i mutację NIE ZMIERZONO, bo nie ma naprawy.
3. PRZYJMUJĘ. Tabela per masa zmierzona na bazie (TESTY): masy 265, 145, 12 (×2), 10, 590, 1011, 19. Przyczyny per masa NIE ZDIAGNOZOWANE dla masy 19 i 265 poza wnioskiem z DIAGNOZA-2.
4. PRZYJMUJĘ. Liczby 424/299/254 z 10-operator-claude.md pochodziły z instrumentacji wycofanej po pomiarze i nie są w repo ani w tym raporcie. Wycofuję je jako niezweryfikowane. Nie powtarzam ich jako dowodu.
5. PRZYJMUJĘ. Opcja A została wypróbowana w wariancie „usuń rzeki nie-główne w promieniu 3 heksów od luki, dodaj ujście main, przy porażce przywróć stan” (DIAGNOZA-2). Wynik: 63 próby na kontynenty 42, 0 sukcesów, worstGap bez zmian (18). Opcje B (awans rzeki do main) nie wypróbowano. Opcja C to zmiana reguły — decyzja właściciela.
6. PRZYJMUJĘ. Decyzja inżynierska (wybór A lub B) nie wymaga pytania do właściciela i nie jest nim tutaj. Pytanie do właściciela dotyczy tylko skutku dla gracza (opcja C). Propozycja pytania w języku gry (dla orkiestratora, nie wysłana przeze mnie):
   Temat: ujścia rzek na mapach kontynentów. Sytuacja: na części wybrzeży odcinek bez ujścia rzeki ma do 18 pól, a obietnica gry to 7 pól. Cel: zdecydować, czy obietnica ma być dotrzymywana.
   A (Rekomendowane): dotrzymywać 7 pól zawsze, nawet jeśli rozmieszczenie innych rzek na tych mapach się zmieni. Gracz zobaczy inne mapy dla tych samych ustawień. Za: obietnica spełniona, wybrzeża mają wodę w zasięgu. Przeciw: mapy zmieniają wygląd, a wykonanie nie jest jeszcze potwierdzone (próba techniczna nie zadziałała).
   B: zostawić obecne mapy i zmienić obietnicę na większy zasięg (np. 18 pól). Za: mapy bez zmian, prosta zmiana. Przeciw: wybrzeża bez rzeki w większym zasięgu, sprzeczne z dotychczasową obietnicą.
   Konsekwencja implementacyjna A: nowy wybór ujścia z przestawianiem rzek nie-głównych (kod generatora, około 1 funkcja). Konsekwencja testowa: testy rzek i piny generatora do przepięcia. B: tylko stała limitu i test.
   Szczegóły (dla orkiestratora): gra/src/map/gen-helpers.ts:5727, :9780 (topUpMainRiverCoastMouthGapsOnce), gra/tools/river-mouth-gap-enforce-test.cjs.
7. PRZYJMUJĘ. Pangea 7 zmierzona na bazie: worst 15 (1 masa). Pozostałe pozycje (tabela przed/po, mała mapa, 3 dodatkowe mapy, pomiar wydajności po naprawie, bramki) NIE ZMIERZONO z powodu braku naprawy; wydajność bazowa: 111674 ms.

DIAGNOZA-2 (wynik nowej próby, zmierzony):
- Wariant 1: usunięcie jednej rzeki nie-głównej w promieniu 2 heksów od luki; przy porażce przywrócenie stanu. Próby: 73 (wyjście DBGDISP), sukcesów 0.
- Wariant 2: usunięcie wszystkich rzek nie-głównych w promieniu 3 heksów od luki (jedna próba na cel), przywrócenie przy porażce. Próby: 63, sukcesów 0. Worst gap bez zmian (repro: worstGapAll=18, te same 8 mas).
- Wniosek: sama obecność rzek nie-głównych sąsiadujących z brzegiem NIE wyjaśnia porażki ujścia main. Przy usuniętych rzekach tryPlaceMainRiverAtMouth nadal zwraca false. Możliwe przyczyny (NIE ZMIERZONO, do sprawdzenia): minLen ścieżki (traceRiverFromCoast musi dać path.length >= acceptThreshold), isPathTooCloseToRiverHexes z pathSep 2 względem głównych, riverPathRespectsSeaBuffer. To jest luka diagnozy w raporcie 10-operator-claude.md.
- Kod eksperymentu wycofany; nie jest w commicie.

RUNDY: 2/5 (runda 1: BLOCK; runda 2 (ta): BLOCK, bez naprawy). Ostatni werdykt Evaluatora: BLOCK/FAIL. Decyzja wymagana: orkiestrator decyduje, czy wysłać pytanie A/B/C (propozycja w ODPOWIEDZI-6), a także czy Operator ma dalej diagnozować przyczynę porażki tryPlaceMainRiverAtMouth (wariant przed zmianą kodu).
NASTĘPNY KROK: (1) orkiestrator: pytanie do właściciela wg propozycji ODPOWIEDZI-6; (2) kolejna runda Operatora: diagnoza przyczyny w tryPlaceMainRiverAtMouth (minLen/pathSep/riverPathRespectsSeaBuffer) per masa 19 i 265 z pomiarem, zanim jakakolwiek naprawa.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Test gra/tools/river-mouth-gap-enforce-test.cjs jest celowo czerwony na bazie. Nie włączać go do bramek przed naprawą.
- Do uruchomienia repro i testu zainstalowano zależności gra (npm ci --ignore-scripts); po zakończeniu rundy usuwam gra/node_modules zgodnie z dispatchem.
- Sekcja 3 dokumentu GENERATOR-MAP-BLEDY-REPRO-2026-11-25.md (wymuszenie ujścia jako prosta naprawa) nie jest potwierdzona.

# R-WEB-BATTLE-FLEE-MANUAL-MODE-HARAPPA-MEASURE-Q1 — Final Control

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (bitwa 3D, tryb reczny, ucieczka)
TEMAT: R-WEB-BATTLE-FLEE-MANUAL-MODE-HARAPPA-MEASURE-Q1
GOAL: tryb reczny bitwy 3D respektuje limit ruchu ucieczki jak autobitwa; Harappa nie ucieka szybciej niz limit.
ZMIANY/COMMIT: kandydat 171df12b2b52ce9888813af3445d6129f12a5160; `git merge-base --is-ancestor 2ab6e3a05 171df12b2` = tak. diff --stat vs baza: 6 plikow, 253 wstawien (battleScene.ts +12, battle-flee-manual-test.cjs +73, browser-entry.ts +87, .html +3, raporty 10-operator i 30-obrona). Wszystko w allowliscie; brak zmian danych, WERSJE.md, gra-robocza/kanon, rust-port.

## Werdykty per zarzut
1. Jednostka Harappy niezmierzona: ZASADNY, NAPRAWIONY. Przypadek Harappan Gate Guard (civ Harappa), normalny 3, limit 1, max 1/tura — moj przebieg: 6 PASS / 0 FAIL.
2. Brak asercji manualMode: ZASADNY, NAPRAWIONY CZESCIOWO. Asercja manualMode===true jest w tescie i przechodzi we wszystkich 3 przypadkach. Rozbicie nadal wymuszone (ru.routed w turze 1), nie organiczne — nota.
3. Rozbicie w lancuchu rozkazu recznego: ZASADNY. Poprawka w kodzie (`_manualOrderAfterStep`, battleScene.ts ~19394) jest spojna ze wzorem `normalPlan` (~6232) i `_fleeStep` (~10462), tsc czysty, regresje zielone. BRAK dowodu E2E (nie zmierzono w przegladarce) — nota, nie blokada: zmiana dotyka tylko jednostek zroutowanych w trakcie lancucha.
4. Drobne (liczba FAIL mutacji, brak unit-replace 21): ZASADNY, nieistotny; unit-replace 21/21 uruchomiony.

## TESTY (wlasne, surowe wyjscie)
- tsc --noEmit: exit 0
- battle-flee-manual-test Wojownik (FLEE_CASE=0): 6 PASS / 0 FAIL, maxPerRound 2
- Rydwan (FLEE_CASE=1): 6 PASS / 0 FAIL, maxPerRound 3
- Harappa (FLEE_CASE=2): 6 PASS / 0 FAIL, maxPerRound 1
- battle-flee-speed-parity-test (auto): 53 PASS / 0 FAIL
- logic-test 213/213; tech-tree 20/0; research 33/0 ALL GREEN; combat 6/6; unit-replace 21/21; ai-unit-replace-same-rules 45/0 (wszystkie exit 0)
- Mutacji nie powtarzalem (wynik obrony 3 PASS/3 FAIL przyjety z raportu; NIE ZMIERZONO przeze mnie).
Uwaga: node_modules podlinkowane tymczasowo z innego worktree, usuniete po testach.

BLOKADY: brak
NIE ZMIERZONO: rozbicie w lancuchu rozkazu E2E; rozbicie organiczne; odwrot na mapie i animacja (STEP_GAP_MS). Wniosek dla zgloszenia: sciezka reczna byla zgodna z limitem (Wojownik 2, Rydwan 3, Harappa 1) — przyczyna "szybkiej Harappy" nie lezy w limicie ruchu w tym trybie.
UWAGI-DLA-ORKIESTRATORA: zaproponowany temat Q2 (E2E rozbicia w lancuchu + odwrot na mapie + animacja) — decyzja orkiestratora.
RUNDY: 1/5 (FC)
NASTEPNY KROK: integracja orkiestratora (merge 171df12b2 do main, bramki), potem decyzja o Q2.
DEPLOY/PUSH: NIE WYKONANO

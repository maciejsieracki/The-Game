# R-WEB-BATTLE-FLEE-MOVE-HALF-Q1 — Final Control (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-FLEE-MOVE-HALF-Q1
GOAL: uciekinier w jednej turze bitwy max floor(0,5 x normalny zasieg), min 1 heks; mnoznik jedyny w combat-params.json "ucieczka".mnoznik_ruchu; ruch zwyklych jednostek bez zmian.
ZMIANY/COMMIT: kandydat e4be7a82d61ebcf1720477b0185d1e5a506c1908 (potomek bazy 1b8ce0d39: merge-base --is-ancestor = tak). Diff vs baza: gra/src/battle/battleScene.ts, gra/data/combat-params.json (tylko pole ucieczka.mnoznik_ruchu 0.5, przed: brak = 1.0), gra/tools/battle-flee-move-half-test.cjs + browser-entry.{ts,html}, runs/**. Allowlista zachowana; brak WERSJE.md, units.json, morale, ai.ts. integration_sha = e4be7a82d61ebcf1720477b0185d1e5a506c1908 (+ ten raport).

TESTY (ZMIERZONO samodzielnie na e4be7a82d):
- tsc --noEmit rc=0; logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; unit-power 6/0.
- battle-flee-move-half-test (skip, Chromium headless przez Vite): 43 PASS / 0 FAIL (konnica 7 -> 3, piechota 3 -> 1, 4 -> 2 wg logu).
- Mutacja mnoznik_ruchu = 1: 6 PASS / 36 FAIL (test czerwony), plik przywrocony.
- battle-routed-pursued-destroyed: 30/0.
- mgla-sciezka-inwariant: 41 pass / 1 fail; jedyny FAIL = src/game/ai.ts:3741/3776/3777/3824; ai.ts bajt w bajt identyczny z baza 1b8ce0d39, wiec to dlug bazowy (znany: zadania #270/#292), nie regresja.
- git diff --check: czysty.
- NIE ZMIERZONO przeze mnie: battle-neverrout-hold (Obrona: 58/0 rc=0, kandydat nie dotyka morale/neverRout), map-gen, pozostale bramki niezwiazane (zmiana tylko w ruchu uciekiniera).

ROZSTRZYGNIECIE ZARZUTOW:
1 AUTO-batch: ODDAL — poprawka normalPlan w _resolveAutoBatchMovement obecna w kandydacie; przeglad kodu: jednostka zlamana w trakcie fali przechodzi na _fleeStep z zapasem (mnoznik - przebyte). Uwaga: normalPlan=true jest przekazywane dla kazdego move/attack steps>0, takze dla zlamanych przed planowaniem; skutek jest poprawny (nadal limit 50%, re-plan ucieczki zamiast zamrozonej sciezki). Brak testu scenariusza -> NOTE.
2 AUTO watch: NIE ZMIERZONO (>590 s, zakaz background) -> NOTE, nie blokuje; kod wspolny (_fleeStep).
3 Brak zrzutu: ODDAL — dispatch dopuszcza log; log kroków z prawdziwej sceny w Chromium jest (43/0).
4 Pomin/instant: ODDAL — grep computeInstantResult w battleScene.ts: brak ruchu uciekinierow; NIE ZMIERZONO runtime -> NOTE.
5 Dokumentacja: ODDAL — poradnik opisuje morale/odwrot, nie tempo; brak potrzeby wikiBundle.
6 dispatch w main: ODDAL — plik istnieje (git show zwraca tresc).
7 neverrout/mgla: ODDAL — mgla = dlug bazowy udowodniony identycznoscia ai.ts; neverrout 58/0 wg Obrony.
Zadne NAPRAW; DO DECYZJI CZLOWIEKA: brak.

BLOKADY: brak.
RUNDY: FC 1/5.
UWAGI-DLA-ORKIESTRATORA: do LIVE-VERIFY po deployu: tryb AUTO sceniczny i scenariusz zlamania w trakcie fali. Dlug REPIN Rust: combat-params "ucieczka".
NASTEPNY KROK: integracja orkiestratora (merge e4be7a82d + ten raport), build, deploy ROBOCZA.
DEPLOY/PUSH: NIE WYKONANO

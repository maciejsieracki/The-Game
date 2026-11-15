STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-SUMMARY-ANNIHILATION-LINE-Q1
GOAL: osobna linia "Unicestwienie" (kto, ile jednostek, powod: wyczerpany limit odwrotow) w podsumowaniu bitwy; brak linii gdy limit nie wyczerpany; gracz i AI.
ZMIANY/COMMIT: kandydat do integracji ec0d905fd (rodzic 99107dc32, 206f2ee4e; kod operatora 206f2ee4e + poprawka obrony 99107dc32). Pliki kodu: gra/src/game/battle-summary.ts, gra/src/game/post-battle-map.ts, gra/src/main.ts, gra/src/ui/postBattleSummary.ts, gra/tools/battle-summary-annihilation-test.cjs. Ten raport: jedyny nowy plik FC.

WERYFIKACJA RODOWODU (git):
- Kandydat NIE jest potomkiem bazy z dispatchu 52c44be1b (merge-base 005cd9ab0). Jego rodzic kodu to 392aa14c1 (FALA 737), ktory jest przodkiem origin/main (45ded9579, FALA 738).
- Diff 392aa14c1..ec0d905fd = 7 plikow, +382/-2, git diff --check czysto. Zadnych zmian poza wymienionymi.
- git merge-tree ec0d905fd z origin/main (45ded9579) oraz z 52c44be1b: czysto, bez konfliktow. Probny merge d145cb781 (nie wypchniety) = origin/main + kandydat, diff vs origin/main identyczny z 7 plikami powyzej.

TESTY (na probnym merge d145cb781 = origin/main + ec0d905fd; liczby z surowego wyjscia):
- npx tsc --noEmit: exit 0, 0 linii.
- battle-summary-annihilation-test: pass=20 fail=0.
- battle-retreat-limit-test: 43 pass, 0 fail. post-battle-map-test: 32 pass, 0 fail. battle-summary-test: OK.
- Bramki referencyjne: logic-test 213/213; tech-tree-test 20/20; research-test 33/33; unit-replace-test 21/21; combat-test 6/6; unit-power-test 6/0. Wszystkie zielone, zadnej czerwonej, wiec porownanie baza-vs-kandydat nie bylo potrzebne.
- Mutacja M5 (zakomentowanie body.appendChild(annLine) w postBattleSummary.ts): test => pass=19 fail=1 (FAIL d1), czyli czerwieni. Plik przywrocony (git checkout), drzewo czyste.
- Chromium (realny showPostBattleSummary + realny buildPostBattleSummary, build vite poza repo, serwowane przez HTTP, chromium 1194 z /opt/pw-browsers, bez bledow strony):
  * annihilatedDefUnits=2: [data-annihilation=obronca] "Unicestwienie: Grecy — 2 jednostki zniszczone; powód: wyczerpany limit odwrotów (trzy odwroty w tej turze)."
  * annihilatedAtkUnits=1: [data-annihilation=atakujacy] "Unicestwienie: Rzymianie — 1 jednostka zniszczona; powód: ..."
  * brak liczników: zero elementow [data-annihilation].
  Zrzuty (poza repo): scratchpad/fc/def2.png, atk1.png, none.png. Linia widoczna pod "Straty łącznie", odrebna wizualnie.
- NIE_ZMIERZONO: pelny boot() gry z prawdziwa bitwa mapowa prowadzaca do unicestwienia (cala sciezka main.ts). Wpiecie main.ts (pbHolder/onPostBattleResult, 14 linii) sprawdzone czytaniem kodu + pin d2; applyPostBattleMap -> liczniki pokryte testem a (post-battle-map).

WERDYKTY ZARZUTOW:
1. Test nie lapie braku appendChild: ODDAL. Obrona zaostrzyla pin d1, mutacja M5 teraz czerwieni (zmierzone). Dodatkowo realny DOM potwierdzony w Chromium. Pozostaje uwaga: pin nadal regexowy (dlug, patrz UWAGI).
2. Odmiana "1 jednostka zniszczonych": ODDAL. Naprawione w 99107dc32 (1/21 zniszczona, 2-4/22-24 zniszczone, reszta zniszczonych); Chromium pokazuje poprawne formy dla 1 i 2.
3. Brak testu realnej sciezki main.ts i zrzutu Chromium: ODDAL. Zrzut/DOM w Chromium wykonany przez FC (powyzej); sciezka main.ts nadal bez testu uruchomieniowego (NIE_ZMIERZONO), ale kod jest 14 liniami przekazania licznikow i pokryty pinem + testem logiki; ryzyko niskie.
4. Wyjscie poza allowliste (main.ts, battle-summary.ts): ODDAL z adnotacja. Bez nich linia nie powstaje (UI czyta dane z battle-summary, liczniki z main.ts); zmiany minimalne i celowe. Decyzja o akceptacji allowlisty nalezy do orkiestratora (integracja = akceptacja).
5. Licznik = podzbior "Strat łącznie": ODDAL. Kryterium (a) dispatchu: "liczba jednostek z powodem"; linia z definicji dotyczy jednostek zabitych przez wyczerpany limit odwrotow. Tekst jest jednoznaczny.
6. battleScene._buildBattleSummaryData bez pol unicestwienia: ODDAL. Podsumowanie sceny powstaje przed applyPostBattleMap (main.ts:36653), wiec unicestwienia jeszcze nie ma; gracz po walce ręcznej widzi i tak podsumowanie mapowe (main.ts ~36432 applyMapBattleOutcomeWithSummary po bs.play), ktore ma linie. presentPostBattleSummary (35746) jest martwe (zero wywolan).
7. Brak wzmianki w Civpedii/poradniku: ODDAL. grep docs/PORADNIK-GRACZA i docs/encyklopedia: brak tekstu opisujacego podsumowanie bitwy ani unicestwienie; warunek dispatchu ("jesli opisuja podsumowanie") nie zachodzi. wikiBundle bez zmian nie wymaga regeneracji.
DO DECYZJI CZLOWIEKA: brak.
NAPRAW: brak => nie FAIL.

BLOKADY: brak blokujacych.
RUNDY: FC runda 1/5 (po rundzie operatora 1 i obronie).
NASTEPNY KROK: orkiestrator integruje ec0d905fd do aktualnego origin/main (45ded9579; merge-tree czysty). Przed deployem wskazane: ponownie tsc + battle-summary-annihilation-test na wyniku integracji (wikiBundle: brak zmian docs, regeneracja niepotrzebna).
UWAGI-DLA-ORKIESTRATORA: (1) kandydat nie jest potomkiem bazy dispatchu 52c44be1b, lecz 392aa14c1 (przodek origin/main) - merge czysty, ale uzyj merge z origin/main, nie fast-forward. (2) main.ts i battle-summary.ts poza literalna allowlista - akceptacja przy integracji. (3) pin d1 regexowy - dlug do osobnego tematu (test DOM w Chromium w bramce). (4) test boot() z prawdziwa bitwa unicestwiajaca nie wykonany; opcjonalny LIVE-VERIFY po deployu. (5) semantyka "podzbior strat" - jesli wlasciciel woli sumaryczny wiersz, osobny temat.
DEPLOY/PUSH: NIE WYKONANO

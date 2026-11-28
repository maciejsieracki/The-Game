STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SAVE-AICS-ABSORPTION-FIX-Q1
GOAL: wczytanie zapisu zachowuje zegary absorpcji miast-panstw AI (aiCsTrybutSince/aiCsWasalSince/aiCsFailCount); bunt/7/zapis t7 B==A 6/6 na maksimum.
ZMIANY/COMMIT: kandydat f387c2685 (potomek bazy c2ef8d269 - `git merge-base --is-ancestor` OK). gra/src: zero zmian wzgledem bazy c2ef8d269 (poprawka kodu dfae6298c jest juz w bazie). Diff = test statyczny save-load-ai-cs-absorption-state-test.cjs, dokument ZAPIS-AICS-ABSORPCJA-POPRAWKA-2026-11-28.md, run dir, oraz testy/dokumenty z merge'a 125b7aa14 (TDQ16/16B/16C, krok 0 dispatchu; to nie praca tego tematu). Poza allowlista tematu tylko ten merge.
KOD (gra/src/main.ts, odczyt): zapis meta 42826-42828; reset swiata clear 51265-51267; wczytanie clear+restore 53486-53494; usuniecie klucza 40506-40508; uzycie 47530-47597. Trzy mapy obslugiwane symetrycznie; stary zapis bez pol = puste mapy.
TESTY (wlasne, surowe wyjscie, na f387c2685, max nie dotyczy bramek headless):
- tsc --noEmit: exit 0
- save-load-ai-cs-absorption-state-test: 27 PASS / 0 FAIL (T4: mutacje zapis/odtworzenie/czyszczenie reset/wczytanie/slice(0,0)/czyszczenie po odtworzeniu x3 mapy - wszystkie czerwone)
- logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; ai-test 297/0; early-grace-15 33/0; society-breakdown 56/0; ai-city-order-need-wiring 267/0
- Zywe dowody w commicie (odczyt JSON/TXT, nie powtorzone przeze mnie - NIE ZMIERZONO wlasnego biegu live): cfgUsed we wszystkich 4 plikach = Trudny, barbarzyncy trudny, rivals 9, civTypes 14 (maksimum). bunt/7/t7 r2: aiCs 106/106 -> 106/106, tury OK x6, anyDiff=false, pageErrors=0, PASS. Kontrole t3: max/4242, bunt/7, aionly/4242 - 6/6 OK, PASS.
OCENA ZARZUTOW: 1 (brak 6/6 w commicie) - usuniety dowodem aics-bunt7-r2-*; 2 (12/0 vs 27) - rozbieznosc opisowa, nieblokujaca; 3 (slaby test statyczny) - usuniety: kotwica T1, kolejnosc T2, mutacje semantyczne czerwone. Test statyczny pozostaje tekstowy; zywy dowod to kompensuje (ostrzezenie, nie blokada).
BLOKADY: brak.
NOTY: (1) wlasny bieg live bunt/7/t7 nie powtorzony (Evaluator zrobil to niezaleznie na 6d623cea0, main.ts identyczny); (2) poza zakresem: A==A', klik UI, aionly/bunt t10, render 3D, audyt kandydatow (sekcja 2 dokumentu). (3) merge 125b7aa14 wnosi poza-allowlistowe pliki testowe - zamierzone krokiem 0.
UWAGI-DLA-ORKIESTRATORA: gra/src nie rrozni sie od bazy c2ef8d269, wiec deploy FALA 937 niesie kod z dfae6298c (juz w bazie); sprawdz, ze ROBOCZA budowana jest z main zawierajacego dfae6298c.
RUNDY: FC 1/5 (temat: runda 2 po obronie)
NASTEPNY KROK: integracja orkiestratora (merge f387c2685, bramki, deploy ROBOCZA)
DEPLOY/PUSH: NIE WYKONANO

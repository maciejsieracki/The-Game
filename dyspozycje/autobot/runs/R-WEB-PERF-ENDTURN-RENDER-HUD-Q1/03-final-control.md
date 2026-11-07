# FINAL CONTROL R4 (po obronie R4) -- R-WEB-PERF-ENDTURN-RENDER-HUD-Q1

STATUS: PASS-WITH-NOTES (kod i bramki) + DECISION_REQUIRED (tylko kryterium liczbowe ECHO, decyzja orkiestratora)
DOMAIN: GAME (WEB)
TEMAT: R-WEB-PERF-ENDTURN-RENDER-HUD-Q1
GOAL: wydajnosc render/HUD konca tury bez zmiany obrazu i logiki.
ZMIANY/COMMIT: kod do integracji 3c00d9edbb35b9d515f0057d0d6aa439a4900539 (parent fc3c631acee22d75c99fc0b1b07dfe67f2b0ea12). Baza main 6a673c838. Commit raportu FC: parent 3c00d9edb (SHA w odpowiedzi).

## Rozstrzygniecie zarzutow (FC R3)
1. Brak A/B baza vs R3 -- ODDAL (wykonane: 5 par naprzemiennie, evidence/r4/ab-base-vs-*.txt). fc3c631 -30,0%, R4 -18,9% unii EOT1+2+3. Kryterium -35,7% nie spelnione zadnym wariantem -> DO DECYZJI CZLOWIEKA (orkiestrator: zmiana ECHO albo R5 z wezsza regula flushu = opcja C). Nie usterka kodu.
2. Test zachowania na modelu zamiast sceny -- ODDAL z dlugiem. Sam zweryfikowalem: jedyna sciezka wznowienia to callback launchIncomingMapFieldBattle -> runAiPhaseThenFlush (try/catch/finally, flush po kazdym wyjsciu); hak zerowany po catch eAILoop (main.ts ~40912); test resume-flush wyciaga prawdziwy helper i sprawdza okablowanie, mutacja lamie helper. Brak zywego scenariusza bitwa->wznowienie (harness bez wstrzykiwania bitwy) -- NIE ZMIERZONO na zywo; dlug do rejestru, nie blokuje (kod prosty, przeglad czysty).
3. Klatka posrednia -- ODDAL (moot). Dowod CSS (pointer-events:none, tlo przezroczyste do 55%); R4 nie opiera juz poprawnosci na tym zalozeniu: zmiany z haka refreshFog i odwiedziny widocznych zetonow flushuja w klatce postepu. Zrzutu w polowie fazy nie wykonano (NIE ZMIERZONO). Pelna klatka po EOT: 0 niezgodnych dzieci sceny, 125 px max d1 w znanym pasku HUD x1584-1587 (szum 83 px miedzy dwiema synchronizacjami).
4. Luka refreshFog -- ODDAL (naprawione w 3c00d9edb: hak ustawia aiUnitVisiblePending; diff przejrzany, test statyczny zaktualizowany). Koszt: -30,0% -> -18,9%.
5. Bramki nieodtworzone -- ODDAL; odtworzone przeze mnie po npm ci na 3c00d9edb: tsc EXIT=0; logic 213/213; resume-flush EXIT=0; deferral-regression EXIT=0; unit-renderer-overlay-sync 17/0; capture-render-sync 23/0; city-badge-zoom-lod 67/0; memory-static-geometry-pool 18/0; memory-static-material-pool-pixel 7/0.
6. ai-city-render-batch-test pada (linia 70) -- ODDAL jako dlug przedistniejacy (wg obrony identycznie na bazie 6a673c838; u mnie test takze konczy sie bledem). Do rejestru dlugow testowych.
7. Allowlista -- OK: diff vs 6a673c838 to wylacznie gra/src/main.ts, gra/tools/perf-endturn-render-*.cjs, dyspozycje/autobot/runs/R-WEB-PERF-ENDTURN-RENDER-HUD-Q1/**. git diff --check czysty. Zero zmian w gra/data, rust-port, WERSJE.md.

Brak pozycji NAPRAW -> brak FAIL. Jedna pozycja DO DECYZJI (kryterium).

## Rekomendacja integracji
Integrowac 3c00d9edb (opcja A: bez znanej luki, -18,9% unii, -23,3% suma). fc3c631 (opcja B) ma znana luke refreshFog -- odradzam. Opcja C (R5, wezszy flush) opcjonalna, niezmierzona.
Warunek: orkiestrator zapisuje w ECHO zmiane kryterium (z -35,7% na zmierzone -18,9%) albo zleca R5.
Kolejnosc wzgledem origin/rust-port/parity-v2: rozlaczne (parity-v2 nie zmienia zadnego pliku gra/ od merge-base f4c89d008), brak konfliktu. Najpierw merge origin/main (main = 6a673c838 = merge-base, bez nowych zmian), web do main; parity-v2 niezalezny, dowolna kolejnosc; REPIN Rust po webie.
Porzadki: stash civ-r3-tmp i /tmp/civ-eot-w do usuniecia przez orkiestratora.

RUNDY: 4/5
NASTEPNY KROK: decyzja orkiestratora (ECHO kryterium) -> integracja 3c00d9edb -> READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-SOURCE-LEDGER-SKAD-ZAPASY-Q1
GOAL: partia 2 z 4 — ksiegowanie zuzycia i handlu w ksiedze zrodel zapasow; zgodnosc ksiegi z magazynem w realnej grze (UI i partie 3-4 poza zakresem).
ZMIANY/COMMIT: kandydat b9559d6a757f4e2d70646c19465bdfcb854287a1 (potomek bazy f44bddb5c: git merge-base --is-ancestor = OK). Wlasny diff vs merge main 3b5ecd2e1: resource-ledger.ts, turn-economy.ts, main.ts, 3 testy/narzedzia w gra/tools + 30-obrona-claude.md; w allowliscie, bez WERSJE/manifest/rust-port. integration_sha = b9559d6a7 (kod 083c0d18c). Ten raport to osobny commit.
TESTY (surowe wyniki FC na b9559d6a7):
- tsc --noEmit: exit 0
- logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; unit-power 6/0 (bramki referencyjne = wartosci referencyjne, brak czerwonych)
- resource-ledger-engine-test 20/0 (mutacja cap: FAIL zgodnie z oczekiwaniem); resource-ledger-trade-test 27/0; resource-ledger-test 1030/0; resource-ledger-consume-test 30/0
- vite build (poza repo) exit 0; live-measure (headless Chromium, realny bundle), seedy 7 i 2024 x 30 tur: maxAbsDiff 0, nonzeroRows 0, hashEqualCount 30/30, pageErrors 0/0, offRecordsEmpty true. Mutacje analityczne (pominiecie rodzaju zrodla) daja rozjazd >0 dla 14 rodzajow, w tym warzelnia 75, umowa_wymiany 100, wycinka 220/165. Sol: osobne wpisy "Warzelnia (<miasto>)" i "Umowa wymiany z <civ>" (+20/-20).
- czas tury ksiega ON/OFF: seed 7 702/713 ms; seed 2024 863/788 ms (+9,5%, pojedynczy pomiar, szum nieustalony)
- git diff --check: czysty
NIE ZMIERZONO: seed 99991 (czas; wg Evaluatora 3x30/30 na kandydacie sprzed obrony r4); E3c z aktywnymi trasami; powtorzenie pomiaru czasu seed 2024.
ROZSTRZYGNIECIE ZARZUTOW:
1 ODDAL (do uwag): wycinka gracza ksiegowana ta sama konstrukcja co wycinka AI (AI mierzone live, mutacja czerwona); linia gracza wpieta po creditOwnerResourceStock. UWAGA: moja mutacja wycinkaGot->0 w main.ts nadal daje trade-test 27/0 (testy 7g-7i sa tekstowe i nie pinuja kwoty) — slabosc testu, nie defekt kodu; zalecane doprecyzowanie regexu 7h o `wycinkaGot`.
2 DO DECYZJI CZLOWIEKA: szlak E3c (main.ts ok. 40337) nadal przesuwa zapasy bez ksiegi; zgodnie z DODATKIEM 2/3 nie zmieniany ani nie ksiegowany do decyzji ABC (usunac / ksiegowac); opisany i zinstrumentowany. Do decyzji gra z aktywnymi trasami moze miec rozjazd ksiegi.
3 ODDAL: naprawione w 083c0d18c (sol per heks Warzelni, scenariusz warzelnia2 w engine-test). Uwaga kosmetyczna: dwa wpisy tego samego miasta maja te sama etykiete "Warzelnia (<miasto>)" przy roznych kluczach — UI (partia 4) powinien je scalic.
4 ODDAL: ograniczenie metody (scena zasiana hakiem ?civTest=1); realna mutacja jest w engine-test (6 czerwonych).
5 ODDAL: informacja; nieksiegowane zrodla (lup, zwrot rekrutacji, zdobycie miasta, dary) i zapis okna pending to partie 3-4.
BLOKADY: decyzja ABC w sprawie E3c; technicznych brak.
RUNDY: FC r5/5 (ostatnia); PASS-WITH-NOTES, zadnego zarzutu NAPRAW.
NASTEPNY KROK: orkiestrator integruje b9559d6a7 (merge z aktualnym main, bramki), ABC E3c, partie 3 i 4 jako nowe dispatche; sprzatanie worktree i /tmp.
UWAGI-DLA-ORKIESTRATORA: (a) zaostrzyc test 7h na `wycinkaGot`; (b) powtorzyc pomiar czasu tury seed 2024 w partii 4; (c) scalic identyczne etykiety Warzelni w UI; (d) E3c wymaga decyzji przed pelnym zamknieciem kryterium (a).
DEPLOY/PUSH: NIE WYKONANO

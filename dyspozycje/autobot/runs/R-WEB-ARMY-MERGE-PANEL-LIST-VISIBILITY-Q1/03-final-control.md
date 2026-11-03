STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-ARMY-MERGE-PANEL-LIST-VISIBILITY-Q1
GOAL: Panel POLACZENIE ARMII zawsze pokazuje licznik laczny i ile jednostek jest pod spodem listy; logika laczenia bez zmian.
ZMIANY/COMMIT: oceniony ad7a66c24 (rodzic 59d326396, baza f568e1ed3). Diff do allowlisty: armyMergePanel.ts, nowy army-merge-panel-list-visibility-test.cjs, dwa zaktualizowane testy, katalog runs/<ID>. Brak zmian w main.ts, armyMergePickPanel.ts, WERSJE.md, gra-robocza, rust-port. git diff --check czysty.
TESTY (odtworzone przeze mnie na ad7a66c24): tsc EXIT=0; list-visibility 104 pass 0 fail EXIT=0 (1280x720/20: panel 625 px, 15 kafli, "jeszcze 3 jednostki", "Na polu: 18 · Dolacza: 2 · Razem: 20"; 45 jedn.: 29 i 36 na 360 px); scroll-real-render 27/27; production-mount 9/9; dismiss-bounce 16/16. node_modules usuniete.
ROZSTRZYGNIECIE ZARZUTOW:
- Uwaga 1 (mutant offsetTop): ODDAL - obrona dodala przemiatanie scrollTop co 7 px; kod w armyMergePanel.ts:284 liczy offsetTop+offsetHeight, test 104/104.
- Uwaga 2 (Enter/autofokus): ODDAL - GOAL (e) obejmuje klawiature/aria; onMerge/onSeparate niezmienione; Enter bez fokusu na przycisku nadal laczy; globalny skrot Spacji (main.ts:~40101) robi preventDefault, test obrony potwierdza merge=0. Cofniecie autofokusu to opcja orkiestratora, nie bloker.
- Uwaga 3 (army-split-panel-scroll-grid-test czerwony): ODDAL - PRE_REF=origin/main zawiera juz wdrozony panel podzialu; z ARMY_SPLIT_PRE_REF=798ec59eb~1 18/0 (gate-obrona-army-split-pre-ref.txt). Plik nietkniety, nie regresja.
- Uwaga 4 (rozbieznosci raportu, brak odtworzenia uciecia 18+2): ODDAL - kosmetyka, jawnie oznaczone; zgloszenie rozwiazane licznikiem i wskaznikiem.
- Uwaga 5: bez zarzutu.
Zadnego NAPRAW, zadnego DO DECYZJI CZLOWIEKA.
BLOKADY: brak.
RUNDY: Final Control po rundzie 2/5.
NASTEPNY KROK: integracja orkiestratora ad7a66c24 (z 59d326396) na origin/main (db9433d62); pliki nie zachodza na zmiany main od f568e1ed3. Kolejnosc wzgledem origin/rust-port/parity-v2: niezalezne (zmiany tylko w gra/, zero w rust-port/); integrowac na main niezaleznie, parity-v2 zsynchronizowac pozniej zwyklym merge. Deploy do gra-robocza / WERSJE.md dopiero po osobnej autoryzacji.
DEPLOY/PUSH: NIE WYKONANO

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WEARINESS-PW-FOLLOWUP-C615-BOTH-CITIES-Q1
GOAL: cena pokoju C = 615 PW jako jedyna stala (bez mnoznika cywilizacji i tury); AI->gracz bez mnoznika; licznik zmeczenia = miasta utracone przez OBIE strony, ta sama liczba w tabeli PW i w ticku AI<->AI.

ZMIANY/COMMIT:
- Kandydat do integracji (kod + raporty Operatora/Obrony): b1fb6ac1ed670eca78f95391fefc609af2b3e1a8
- Potomek bazy: `git merge-base --is-ancestor 78af786ed b1fb6ac1e` = TAK (78af786ed = aktualny origin/main; 3fab00ce0 z dispatchu tez jest przodkiem kandydata). Diff vs baza: 17 plikow, +409/-72 (3 commity: 110ee2146, 9022a504e, b1fb6ac1e).
- Pliki kodu/danych: gra/data/diplomacy-acceptance-points.json (500->615), gra/src/game/{ai,diplomacy-proposals,diplomacy-war-peace-profile,war-weariness}.ts, gra/src/main.ts (+8/-2), gra/src/data/wikiBundle.json, docs/encyklopedia/pojecia/{rozejm-pokoj,zmeczenie-wojna}.md, dyspozycje/PROPOZYCJA-ZMECZENIE-JAKO-PW-POKOJ.md, 5 testow w gra/tools/, raporty runs/<ID>/.
- Allowlista: wszystkie pliki w allowliscie POZA gra/src/main.ts (uwaga proceduralna, patrz zarzut 7).
- Ten raport: commit osobny (tylko 50-final-control-claude.md). Do integracji bierz KOD z b1fb6ac1e.

TESTY (surowe wyniki, uruchomione przeze mnie na b1fb6ac1e; srodowisko: esbuild/jsdom/three doinstalowane do katalogu poza repo, gra/node_modules to symlink NIEzatwierdzany):
- tsc --noEmit (tsc 6.0.2 z --ignoreDeprecations 6.0; projekt wymaga 5.9.3, brak @types/three): 176 bledow srodowiskowych, 0 w ai.ts / diplomacy-proposals.ts / diplomacy-war-peace-profile.ts / war-weariness.ts; w main.ts tylko 'three' i implicit-any w liniach niezwiazanych ze zmiana (3364, 16370, 31932+, 46106). Wynik: brak bledow wprowadzonych przez diff. Czysty 0 NIE_ZMIERZONO (srodowisko bez node_modules projektu).
- git diff --check: nie uruchomiony wprost (narzedzie odrzucilo forme polecenia); worktree po testach czysty, wikiBundle regenerowany = identyczny bajtowo (WIKI_IDENTICAL).
- diplo-weariness-c615-both-cities-test: PASS=11 FAIL=0
- diplomacy-acceptance-points-test: 304 pass, 0 fail (zarzut 1: ZAMKNIETY)
- diplo-truce-r4-ai-test: 24 pass / 0 fail (zarzut 2: ZAMKNIETY)
- diplo-war-peace-profile-unit-test: 198/0
- diplo-weariness-as-pw-peace-item-test: PASS=76 FAIL=0
- diplo-weariness-pw-behavior-test: 87/0; pw-row-ui: 10/0; 20-turns: PASS=30; city-only: PASS=30; unconditional-end: PASS=22
- ai-war-weariness-peace-test: PASS=101 FAIL=0
- diplomacy-proposal-test: 200/200 PASS
- diplomacy-city-cession-r3-test: 56 pass / 17 fail na kandydacie ORAZ 56 pass / 17 fail na bazie 78af786ed (zmierzone w tym samym worktree, ta sama lista 17 FAIL; roznia sie wylacznie etykietami zaktualizowanymi w tescie). Dlug bazowy, nie regresja (zarzut 3: nowy fail 'cena pokoju = traktaty.pokoj.punkty' ZNIKNAL; AI_MIASTO_CENA_POKOJU_PN czytane z JSON).
- 5 bramek referencyjnych: logic-test 213/213; tech-tree-test 20 pass 0 fail; research-test 33/33 ALL GREEN; unit-replace-test 21/21; combat-test 6/6.
- Mutacja wiazania main.ts (lostCitiesResponder: lostCitiesForWeariness(...) -> s.lostCities): c615-test PASS=10 FAIL=1 (czerwieni asercja (f)); zachowanie sciezki tabeli sprawdza regex, bo main.ts nie jest ladowalny w jednostkowym tescie — styl zgodny z innymi straznikami main.ts w repo. Zweryfikowalem recznie poprawnosc: warStateFromRecord(...,String(a),...) zwraca utraty per wlasciciel, wiec lostCities(responder)+lostCities(proposer) = suma obu stron = lostA+lostB z ticku.
- pw-weary-table-browser-test (Chromium, DOM z realnym evaluateProposal): NIE_ZMIERZONO przeze mnie (brak playwright/vite w srodowisku, dysk 0,5 GB wolnego). Wynik Operatora/Obrony: BROWSER PASS, wiersze +17 i +427 PW — przyjety jako dowod posredni, nie moj pomiar.

ROZSTRZYGNIECIE ZARZUTOW:
1. Regresja acceptance-points (7 FAIL): ODDAL (naprawione w obronie; 304/0 zmierzone).
2. Regresja truce-r4 (1 FAIL): ODDAL (24/0 zmierzone).
3. Stala lustrzana ai.ts 500: ODDAL (czyta JSON; city-cession-r3 = ta sama lista 17 FAIL co baza).
4. Brak testu behawioralnego tabela<->tick: ODDAL / uwaga. Dodano test zachowania ticka i wspolna funkcje lostCitiesForWeariness; sciezka tabeli w main.ts pokryta tylko asercja regexowa (potwierdzone mutacja). Dopuszczalne; zalecany pozniejszy helper w module testowalnym (UWAGA-2).
5. Nieaktualna dokumentacja: ODDAL w czesci docs/wikiBundle (poprawione, bundle odtwarza sie identycznie). Tekst UI gra/src/ui/diplomacyTradeBasket.ts:862 ('baza ~500 PW, modyfikator +-90%') POZA allowlista i nieaktualny — DO DECYZJI ORKIESTRATORA (maly osobny temat). Tekst jest przyblizony ('~') i wczesniej tez nie odpowiadal dokladnie cenie, wiec nie blokuje integracji.
6. Ryzyko zalozenia AI->gracz 500->615: ODDAL. Dispatch/ABC pkt (1) = C stale 615 bez rozgalezien; pkt (2) dotyczy braku mnoznika cywilizacji (zachowane: priceMultiplier = 1). Zmiana 500->615 wynika wprost z (1). Martwy komentarz przy priceMultiplier poprawiony; `void profile;` kosmetyka — notatka.
7. main.ts poza allowlista: DO DECYZJI ORKIESTRATORA (formalnie dopisac do allowlisty). Zmiana minimalna, konieczna dla wariantu A tabeli, bez kolizji tekstowej z innymi tematami zauwazonej w diffie (hunk ~l.1634 import i ~l.12130). Przy integracji sprawdz merge z R-WEB-AI-TRADE-OFFER-NEED-... i GATE-PROJ.
8. Nazwa/typ lostCitiesResponder (pulapka semantyczna): ODDAL — komentarz typu poprawiony ('NAZWA HISTORYCZNA ... suma obu stron'). Uwaga: ta sama suma zasila tez bramke R5 (lostCitiesInWar -> too_early gdy 0) i wearyInfo.lostCities (UI) — zgodne z decyzja (3) 'wszedzie'. Rename pola = osobny temat (dotyka wiecej plikow).
9. Live-audit W66/W80B: NIE_ZMIERZONO (wymaga dlugiej gry na zywo z vite build; ani Operator, ani ja). Dispatch dopuszcza 'wynik albo NIE_ZMIERZONO z powodem' — powod podany. Do wykonania po integracji/deployu.
10. Zrzut Chromium pelnej gry (?civTest=1): NIE_ZMIERZONO. Jest test DOM w realnym Chromium z prawdziwym evaluateProposal (wynik Operatora). Dispatch mowil 'NIE pomijaj' — dowod w pelnej grze pozostaje do wykonania przez orkiestratora po deployu na ROBOCZA (nie zmienia kodu; ryzyko UI niskie: wiersz 'Zmeczenie wojna +N PW' pochodzi z niezmienionej sciezki wearyPwItem).
11. Dispatch 15/62 vs funkcja 17/68: ODDAL — 615/36=17,08; 615/9=68,3; liczy kod, nie szacunek z dispatchu.

Zaden zarzut nie wymaga NAPRAWY kodu przez Operatora -> brak FAIL.

BLOKADY: brak blokad integracji. Otwarte (nie blokuja): zarzut 5-UI, 7, 9, 10; dlug bazowy 17 FAIL city-cession-r3; srodowisko bez node_modules projektu (tsc/Chromium NIE_ZMIERZONO w pelnym zakresie).
RUNDY: FC 1/5 (po r1 Operatora i r1 Obrony; wczesniej Evaluator r1 FAIL na 110ee2146).
NASTEPNY KROK: integracja orkiestratora b1fb6ac1e do main (sprawdz ancestry i diff --stat), pelne bramki na zintegrowanym stanie, dopisz main.ts do allowlisty, deploy ROBOCZA; potem pomiar live W66/W80B i zrzut ?civTest=1.
UWAGI-DLA-ORKIESTRATORA: (a) diplomacyTradeBasket.ts:862 tekst 'baza ~500 PW' — maly temat; (b) helper testowalny dla wiazania main.ts; (c) dlug bazowy diplomacy-city-cession-r3 17 FAIL (decide-path) — osobny temat; (d) Obrona rozpakowala git archive do /tmp/claude-0/base (katalog innej sesji) — sprawdz, czy nic nie nadpisano; (e) dysk ~0,5 GB wolnego — ponizej progu 4 GB.
DEPLOY/PUSH: NIE WYKONANO

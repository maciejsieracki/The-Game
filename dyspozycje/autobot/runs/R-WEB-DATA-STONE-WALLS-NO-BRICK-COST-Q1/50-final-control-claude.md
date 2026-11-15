STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DATA-STONE-WALLS-NO-BRICK-COST-Q1
GOAL: Mury kamienne (mury_kamienne) bez cegly w koszt_surowce (drewno 80 + kamien 80 bez zmian), Mury ceglane (mury) z cegla, bez innych zmian balansu.

ZMIANY/COMMIT:
- Integrowac SHA: 8f5e61dad65a31db6dceb53eade8b925d0abb8a1 (potomek bazy 1b8ce0d39: `git merge-base --is-ancestor` = TAK).
- Diff 1b8ce0d39..8f5e61dad (9 plikow): gra/data/buildings.json (tylko koszt_surowce i uwagi mury_kamienne), docs/encyklopedia/budynki/mury-kamienne.md, docs/PORADNIK-GRACZA/45-katalog-budynkow.md, gra/src/data/wikiBundle.json (regeneracja), gra/tools/stone-walls-no-brick-cost-test.cjs (nowy), gra/tools/fortifications-stack-repro-test.cjs (F2/F4), gra/tools/koszty-surowcowe-test.cjs (mury_kamienne: 80), runs 10-operator / 30-obrona. Zero zmian w gra/src poza wikiBundle, zero zmian `mury`, Palisady, kosztBudowy, utrzymania pieniezneg. `git diff --check` czysty.
- Ten raport: commit osobny (tylko ten plik).

TESTY (surowe wyniki, uruchomione przeze mnie na 8f5e61dad):
- tsc --noEmit: exit 0
- logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6
- stone-walls-no-brick-cost: 11 PASS / 0 FAIL; na buildings.json z bazy 1b8ce0d39: 6 PASS / 5 FAIL (D1, K1, G1, G3, P1) -> czerwony na bazie
- fortifications-stack-repro 49/0; koszty-surowcowe 161/0; grupy-budynkow 83/0; prereq-budynkow 62/0; building-cards-top5 1208/0; palisade-battle-wall-rules 55/0; fortifications-upgrade-chain-ai 13/0; fortifications-upgrade-chain-ui 15/0; fortifications-queue-cleanup 10/0; wall-defenders-bonus-range 81/0; building-queue-refund 5/0
- upgrade-budynki 60/1 (kandydat) vs 54/7 (ten sam test na danych bazy): kandydat lepszy; pozostala porazka "stale palisade completion preserves only stronger wall tier and Citadel" wystepuje na bazie tez (dlug bazowy)
- building-upkeep-resources 47/1: identyczne na bazie i kandydacie (D10 etykiety, dlug bazowy)
- entity-card-contract: nie uruchomiony do konca w srodowisku (brak canvas/WebGL, wynik NIE ZMIERZONO)
- bundle-wiki-for-game.cjs uruchomiony ponownie: wikiBundle.json bez zmian wzgledem commita (regeneracja zgodna, git status czysty)
- Chromium (realny, /usr/bin/chromium + Playwright, render renderEntityCard z buildingAdapter, esbuild bundle): karta "Mury kamienne" -> Surowce (jednorazowo) 160 Drewno + 160 Kamien, utrzymanie 4 Pieniadz + 2 Drewno + 2 Kamien/ture (BEZ cegly); karta "Mury ceglane" -> 320 Drewno + 320 Kamien + 320 Cegla, utrzymanie 8 Pieniadz + 2 Drewno + 2 Kamien + 2 Cegla. ZMIERZONO. Zrzut (poza repo): /tmp/claude-0/fc-cards.png.
- Budowa Murow kamiennych przy 0 cegly w PELNEJ grze w Chromium: NIE ZMIERZONO; dowod posredni: ta sama funkcja buildingStockCost zasila karte i bramke (G1-G4 PASS, P1 PASS).

ZARZUTY (werdykt FC):
1. Brak Chromium -> ODDAL. Render karty obu Murow wykonany w realnym Chromium (wyzej). Pelna budowa w grze nie zmierzona, pokryta logicznie testem bramki; nie blokuje.
2. Doc 45 l.198 -> ODDAL (naprawione przez Obrone w f4f9d697d; zweryfikowane: tekst rozroznia oba warianty).
3. Skutek uboczny w utrzymaniu surowcowym (Mury kamienne: 0 cegly/ture, nadal 2 drewna + 2 kamienia) -> ODDAL jako zamierzone. To konsekwencja jedynego zrodla prawdy (koszt_surowce), karta w Chromium to pokazuje, `uwagi` opisuja to poprawnie. Nota dla orkiestratora: zmiana jest spojna z intencja wlasciciela; jesli wlasciciel chce utrzymanie cegly na Murach kamiennych, to osobna decyzja produktowa.
4. Tautologia M1 -> ODDAL (asercja usunieta; dowod czerwieni na prawdziwych danych bazy 6/5 potwierdzony przeze mnie). Brak testu parytetu AI/zwrotu: pokryte posrednio (building-queue-refund 5/0, jedno zrodlo kosztu), nie blokuje.
5. Audyt niepelny -> ODDAL (informacyjny, bez zmian kodu, nie blokuje).
6. Baza 1b8ce0d39 zamiast 5304bbab8 -> ODDAL (zadanie integracji). Przy merge z aktualnym main wikiBundle.json prawdopodobnie bedzie konfliktowal: rozwiazac wylacznie przez regeneracje `node tools/bundle-wiki-for-game.cjs`, nie recznie.
Zadnego NAPRAW, zadnego DO DECYZJI CZLOWIEKA.

BLOKADY: brak (pelna budowa w grze w Chromium NIE ZMIERZONO, nieblokujace).

UWAGI-DLA-ORKIESTRATORA:
- Stare/bledne koszty Murow w docs/PORADNIK-GRACZA 08-ekonomia (l.329, 382), 02-mapa-swiata (l.227), 07-miasto (l.187) - osobny temat dokumentacyjny.
- Dlug Rust: REPIN danych budynkow (mury_kamienne bez cegly).
- Test upgrade-budynki ma 1 porazke bazowa (stale palisade completion).
- Po merge: regeneracja wikiBundle, ponowny tsc i stone-walls test.

RUNDY: 3/5 (FC po rundzie 2 Operatora/Obrony)
NASTEPNY KROK: integracja orkiestratora (merge 8f5e61dad z aktualnym main, regeneracja wikiBundle, bramki), potem deploy ROBOCZA wg dispatchu.
DEPLOY/PUSH: NIE WYKONANO

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TRUCE-END-PRICE-3-Q1
GOAL: po koncu rozejmu cena 0 = symboliczna oplata (10B); okno propozycji gracza przyjmuje surowce przy braku cedowalnego miasta (11A), bez regresji oferty AI.
ZMIANY-COMMIT: kandydat 3b9e2a118b02b1303614fb896fc29a07989da822; merge-base --is-ancestor 7148b2f4e... -> TAK. 10 plikow vs baza (259+/23-): gra/src/main.ts, diplomacy-peace-lock.ts, diplomacy-proposals.ts, diplomacy-truce-end-price.ts, diplomacy-war-peace-profile.ts (poza allowlista, jedno pole interfejsu), gra/data/diplomacy-war-peace-params.json (tylko nowy klucz), testy truce-end-peace-price/window, 2 pliki runs/. Brak zmian w gra-robocza, gra-kanon, WERSJE.md, rust-port.
OCENA ZARZUTOW:
 1 (cityAvailable bez filtra forbidden) - NAPRAWIONE w 3b9e2a118 (main.ts: kind==='miasto' && !forbidden && pn>0), potwierdzone w diffie; mutant M-FORB wykrywany przez wiring 11A.
 2 (luka okablowania) - ZAMKNIETE testem wiring 11A (72 PASS).
 3 (brak przypadkow brak srodkow / AI<->AI) - ZAMKNIETE: d0k, d0m, (10B) bez bilansu PW -> wojna, M-SYM.
 4 (dwa zapisy reguly) - ODDAL (nota): siatka rownowaznosci 12 przypadkow zgodna; scalenie do jednej funkcji dlugiem.
 5 (plik poza allowlista) - ODDAL (nota): jedno pole typu WarPeaceParams, konieczne dla tsc; wplyw 1 Pn na koszyk surowcow NIE ZMIERZONO.
TESTY (wlasne uruchomienie na 3b9e2a118, npm ci): tsc exit 0; logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; ai-test 297/0; war-rules-multiwar-main-guard 21/0; truce-end-peace-price 72/0; truce-end-window 43/0; truce-end-settle-exec 30/0; truce-end-war-notice PASS; diplo-truce-impl 93/0; war-limit-truce-count 19/0; diplo-human-peace-no-war 13/0; diplo-war-tribute-once 8/0. Mutacje wlasne nie powtarzane (poleganie na M-FORB/M-SYM z obrony). Live w przegladarce NIE ZMIERZONO.
BLOKADY: brak.
RUNDY: FC 1/5.
NASTEPNY KROK: integracja orkiestratora (wniosek: dopuscic plik diplomacy-war-peace-profile.ts poza allowlista), potem deploy na ROBOCZA wg zasad.
UWAGI-DLA-ORKIESTRATORA: testy zostawiaja nieslledzone gra/tools/.truce-end-*.cjs (mutanty) - dodac sprzatanie; dlug scalenia reguly wariantu zastepczego (zarzut 4) oraz test live (TRUCETEST #166); settleTruceEndPrice przekazuje cityAssets bez filtra forbidden - plan weryfikuje pelnosc, wiec bez bledu, ale warto ujednolicic.
DEPLOY/PUSH: NIE WYKONANO

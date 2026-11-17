STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tylko UI)
TEMAT: R-WEB-UI-RESOURCE-CARD-NUMBERS-ONLY-DETAILS-COLLAPSED-Q1
GOAL: karta surowca i naglowek Surowce same liczby brutto/netto; "Zobacz szczegoly zuzycia" i "Skad zapasy" zawsze zwiniete.
ZMIANY/COMMIT: kandydat 8395a3f6d3120edd9d840ade733ca8afb0e238be (potomek bazy 7ac79dafb: merge-base --is-ancestor OK). Diff vs baza: empireDetailPanel.ts (grossNetNumbersSub, resGrossNetLineHtml, zawsze open=false, usuniety capture/restore SkadDetailsOpen), 4 testy tools/*.cjs + nowy resource-card-numbers-only-test.cjs, hud-topbar-grid-gross-net-test.cjs (tylko regex asercji), dowody. Kod gry poza UI bez zmian.

ZARZUTY:
1. hud-topbar regex (czesc B --dist): ODDAL/ZALATWIONE przez obrone. Poprawka to wylacznie asercja tekstu (Surowce: "+brutto -> +netto", pozostale zakladki bez zmian); rozszerzenie allowlisty ZATWIERDZAM (analogiczne do pozostalych testow z listy, inaczej test czerwony na zywej grze). Brak NAPRAW.
2. Zrzut zywej gry (kryt. d): ODDAL. Obrona dostarczyla dowody/surowce-zywa-gra-1600x1000.png; OBEJRZANY przeze mnie: naglowek "+52 -> -13" bez slow, karty "+5 · +2", "+2 · 0", "+45 · +45", "0 · -60", "Zobacz szczegoly zuzycia" zwiniete. Wartosci +313 · +233 zaleza od stanu gry; forma +X · +Y spelniona.

TESTY (wlasny przebieg, node_modules po npm ci, usuniete po pracy):
- tsc --noEmit: 0 bledow.
- resource-card-numbers-only-test 14/0 (z mutantami M1, M2 wykrytymi); resource-cards-gross-net-test 24/0; resource-cards-plusx-badge-test 31/0; resource-ledger-skad-dom-test 13/0.
- 5 bramek: logic-test 213/213; tech-tree-test 20/0; research-test 33/0; unit-replace-test 21/21; combat-test 6/6. Dodatkowo praca-na-pieniadz-test 6/0; trade-routes-income-test 134/0.
- hud-topbar-grid-gross-net-test (bez --dist): 151 ok / 0 fail; czesc B NIE_ZMIERZONO przeze mnie (brak --dist); obrona zmierzyla --dist: kandydat 166/3 vs baza 167/2, 3 fail = endTurn w sandboxie (dlug harnessu #414/#417), nie regresja.
- git diff --check vs baza: OK. git grep SkadDetailsOpen: tylko asercje nieobecnosci w testach.
- Zywy Chromium: NIE przeprowadzony przeze mnie ponownie; opieram sie na obejrzanym zrzucie obrony (kandydat c094e0db2 kodu = ten sam kod src co 8395a3f6d, roznica to test/dowody).

BLOKADY: brak.
RUNDY: FC r1/5.
UWAGI-DLA-ORKIESTRATORA: (1) zwijanie "Skad zapasy" nie zmierzone na zywej grze (zapasy 0 -> blok nie renderowany); pokryte testem DOM D6/D7. (2) wspolna grossNetSub (Nauka/Zywnosc/Handel) nadal ze slowami - kandydaci do ujednolicenia. (3) wiki §53.1a opisuje stary tekst - wiki-sync. (4) resourceSourceLedgerHtml.ts komentarze l.26-28 nieaktualne (poza allowlista). (5) grossNetNumbersSub jest exportowana (uzywana tylko w pliku) - kosmetyka.
NASTEPNY KROK: integracja orkiestratora SHA 8395a3f6d3120edd9d840ade733ca8afb0e238be (plus ten raport), potem bramki i deploy ROBOCZA.
DEPLOY/PUSH: NIE WYKONANO

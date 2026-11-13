STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-HUD-GROSS-NET-REST-Q1
RUNDA: obrona 1 (nad 14a664cf6)

Z1 PRZYJMUJE: prawy baner (Armia..Religia) mial max-width 50vw-340px (ujemne przy 640 px), chipy nowrap -- w harnessie
   chipy Kultura/Religia lezaly poza ekranem juz przy 1280 px (x do 1548). Poprawka w hud.ts: max-width max(150px, min(50vw-352px,780px)),
   zawijanie chipow, <=1500 px etykiety ukryte (tooltip zostaje), <=1100 px klaster w kolumne, <=700 px baner konczy sie za medalionem Mocy.
   Pomiar PO (z zasymulowanymi przyciskami Civpedia+Menu): 640 px baner x=405..620 (Moc konczy sie na 395), 5 chipow w obrebie.
Z2 ODRZUCAM (czesciowo): dla Kultury/Religii/Obywateli/Miast HUD-state nie ma osobnych strat, wiec widoczna linia brutto/netto
   dublowalaby te sama liczbe; dodanie strat = zmiana logiki gry (poza allowlista). Tooltip zawiera jawna adnotacje. Brutto miasta Skarbca: NIE_ZMIERZONO.
Z3 PRZYJMUJE: test rozszerzony o prawy baner na 1280/1024/800/640 (5 chipow, szerokosc >=100, brak wylewania, brak nachodzenia na Moc,
   klaster z przyciskami). 2 nowe mutanty prawego banera WYKRYTE (10/10 mutantow).
Z4 INFORMACYJNIE: bez zmian; hud-moc-warstwa nadal czerwony (baseline, 7 FAIL strukturalnych).

TESTY: tsc EXIT=0; hud-gross-net-rest-test 756 ok 0 fail; hud-topbar-grid-gross-net 1190 ok; hud-number-abbrev OK; praca-pula-rate-parity 20/0.
BLOKADY: wysokosc stosu prawego (przyciski+baner) przy <=800 px ~148 px -- kolizja z minimapa/dockiem NIE_ZMIERZONO (harness bez nich); przyciski w tescie to symulacja klas b-wiki/b-menu.
DEPLOY/PUSH: NIE WYKONANO

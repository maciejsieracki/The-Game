STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-NOTIF-EMPTY-QUEUE-NO-BUILDING-AVAILABLE-Q2
GOAL: Powiadomienie "Produkcja: <miasto> - Kolejka pusta" tylko gdy w miescie jest realnie do wybudowania budynek/ulepszenie (stac gracza) i kolejka jest pusta; rekrutacja jednostek go nie wywoluje.
ZMIANY/COMMIT: kandydat b0f4356b97d701c308b2df5a48fafb01d95bdfe2 (potomek bazy 7d3cd3099 - `git merge-base --is-ancestor` = TAK). Diff vs baza: gra/src/main.ts (usunieta cityHasAffordableUnitRecruitment, galaz rekrutacji w cityHasActionableProduction, czlon `|u:` w productionOptionsFingerprint, tekst "wybierz budynek"), gra/tools/notif-empty-queue-buildable-test.cjs, gra/tools/notif-empty-queue-gate-behaviour-test.cjs (nowy), runs/.../10-operator-claude.md, 30-obrona-claude.md. W allowliscie. Zmiana w main.ts nie dotyka showVictoryScreen ani aiUpkeepRunwayAllows. integration_sha = b0f4356b9 (kod); ten raport = osobny commit nad nim.
TESTY (surowe wyniki, gra/, node_modules przez symlink, usuniety po pracy):
- tsc --noEmit: exit 0
- notif-empty-queue-buildable-test: 20 pass / 0 fail
- notif-empty-queue-gate-behaviour-test: 11 pass / 0 fail (wykonuje realne funkcje z main.ts na realnych danych; przypadki i-iv; mutacje M1-M3 wykryte)
- logic-test 213/213; tech-tree-test 20/0; research-test 33/0; unit-replace-test 21/21; combat-test 6/6 (wszystkie = wartosci referencyjne, brak czerwonych, porownanie z baza niepotrzebne)
- sidepanel-notification-tabs-test 29/0; notif-diplo-tab-count-blocking-test 25/0 (pozostale powiadomienia bez regresji)
WERDYKTY PER ZARZUT:
1 ODDAL - obrona dostarczyla test wykonawczy (11/11), przypadki i-iv + mutacje; zweryfikowane uruchomieniem.
2 ODDAL z NOTATKA - zywy bieg w Chromium NIE_ZMIERZONO (operator, obrona i FC). Zbudowanie kandydata wymaga vite poza repo + stanu "wszystko zbudowane" przez kreator; zmiana to usuniecie galezi + tekst, a realna bramka jest wykonana testem behawioralnym. Kryterium (b) dispatchu pozostaje formalnie NIESPELNIONE - weryfikacja na zywo po deployu na ROBOCZA (temat LIVE-VERIFY) jest zalecana.
3 ODDAL - cityHasAffordableLevelUpgrade uzywa tego samego predykatu co sekcja "Ulepsz" w cityPanel.ts (9361-9420); ulepszenie jest zamierzone w DODATKU 0 ("budynek lub ulepszenie"). Gate = to, co panel oferuje jako akcje. Ryzyko resztkowe: jesli panel oferuje "Ulepsz" przy budynku na maks. poziomie, karta nadal sie pokaze - ale wtedy panel tez pokazuje akcje (spojnosc z panelem). NIE_ZMIERZONO w stanie ze zrzutu.
4 ODDAL - koszt budynku = surowce (chipy tech/stock/other w buildingCanBuildNow); skarbiec/manpower dotycza jednostek. Zalozenie: kolejkowanie budynku nie wymaga skarbca (przycisk Kup za zloto jest opcja dodatkowa).
5 ODDAL - guardy oblezenia byly tylko rekrutacyjne (usuniete slusznie); sekcja A (isCityUnderSiege) uzywana gdzie indziej; odcisk bez `|up:`/`|u:` pokryty testem (M3).
BLOKADY: brak (zywy bieg NIE_ZMIERZONO - nota).
RUNDY: 1/5 operatora + obrona r2 + FC.
UWAGI-DLA-ORKIESTRATORA: (1) po deployu zweryfikowac na zywo: miasto bez dostepnych budynkow nie ma karty "Produkcja", miasto z dostepnym budynkiem ma "Kolejka pusta - wybierz budynek". (2) ew. dlug Rust: REPIN jesli bramka powiadomien istnieje w rust-port. (3) rejestr #444 domknac po deployu FALA 772.
NASTEPNY KROK: integracja orkiestratora b0f4356b9 -> bramki -> deploy ROBOCZA.
DEPLOY/PUSH: NIE WYKONANO

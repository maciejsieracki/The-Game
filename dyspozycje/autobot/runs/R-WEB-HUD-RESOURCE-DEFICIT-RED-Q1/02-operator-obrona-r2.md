STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-HUD-RESOURCE-DEFICIT-RED-Q1
RUNDY: 2/5 (obrona)

Zarzut 1: PRZYJMUJĘ. runwayShort: zapas<0 => alarm; bilans>=0 => brak alarmu (także zapas 0 i floor(+0,6)=0); zapas 0 + bilans<0 => alarm. Test: goldZero/foodZero NIE czerwone, goldZeroNeg/foodZeroNeg/goldNegStock czerwone. Mutacja starej logiki: 2 FAIL (zabita).
Zarzut 2: PRZYJMUJĘ. Raport r1 zawyżył (5,3 vs realne 4,79). Kolor zmieniony na #ee6c6c: 5,67:1 na (20,26,38), 4,81 na jaśniejszym (34,40,52). Test wymaga >= 5,0.
Zarzut 3: PRZYJMUJĘ. main.ts: niedobór surowców z buildEmpireResourceRows(ownerId) dla ownerId != 0 (read-only). NIEZWERYFIKOWANE na żywej grze hot-seat. Złoto/żywność: bez zmian, czytane z singletonów jak dotąd.
Zarzut 4: ODRZUCAM częściowo. Karty TopBar w cityPanel.ts (buildTopBar*DetailCard) to karty lokalne miasta, bez logiki koloru niedoboru i bez wartości chipów HUD; poza GOAL pod względem danych. empireDetailPanel: własny stan 'bad' (resStateOf). Brak zrzutu chipa Surowce: potwierdza go tylko test DOM (przyznaję). Próg N=5 arbitralny, do akceptacji właściciela.

TESTY: nowy test 41 pass / 0 fail; tsc --noEmit EXIT=0 (z @types/three, vite w scratchpadzie); regresji 28 testów nie powtarzano (zmiana tylko logiki progu i koloru). Logi gate-*-r2.txt.
REPIN UI: hud.ts i hudChip6c.ts mają kopie w Rust, zanotować w LEDGER przy integracji. Rust nie ruszany.
DEPLOY/PUSH: NIE WYKONANO

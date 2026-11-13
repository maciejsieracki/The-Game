STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-GOODS-LABEL-RUDA-MIEDZI-Q1
GOAL: w dyplomacji (Dobra handlowe → Surowce) surowiec „Ruda" ma być wyświetlany jako „Ruda miedzi" (obok „Ruda cyny"); klucz `ruda` bez zmian. DODATEK 1: aktywny surowiec z zapasem 0 pokazuje „×0"; oferowanie zapasu 0 zablokowane.
BAZA: origin/main dcca72b78 (worktree; runda 1, bez wcześniejszych rund). Gałąź tematu dispatchu (claude/sprawdzenie-funkcjonalnosci-ek4ra0) NIE jest przodkiem main — kod źródłowy brany z main.
ZMIANY/COMMIT: allowlista: gra/src/game/diplomacy-goods.ts (DISPLAY_LABEL_OVERRIDE 'Ruda' → 'Ruda miedzi'; ilosc 0 dla aktywnego surowca bez zapasu, z wyjątkiem ceramiki; ilosc undefined dla ceramiki), gra/tools/diplomacy-goods-kat-test.cjs (+9 asercji), dyspozycje/autobot/runs/R-WEB-DIPLO-GOODS-LABEL-RUDA-MIEDZI-Q1/01-operator-r1.md. Klucz `ruda`, resource-access.ts, building-resource-gate.ts i zapisy NIE zmienione.
TESTY:
- node gra/tools/diplomacy-goods-kat-test.cjs → PASS 16 FAIL 0 (Ruda → „Ruda miedzi"; klucz ruda; aktywny zapas 0 → „Ruda miedzi ×0"; zapas 7 → „Ruda miedzi ×7"; magazyn bez dostępu → „Ruda miedzi ×3"; brak etykiety „Ruda" w indeksie; Ceramika ilosc undefined; Sól zapas 0 → ilosc 0).
- cd gra && node_modules/.bin/tsc --noEmit → brak linii „error TS" (exit 0).
- Brak `npm run build`/`dev`. Brak WERSJE.md, brak gra-robocza, brak push/deploy.
- Oferowanie zapasu 0: sprawdzone użycia ilosc — diplomacy-resource-trade-pick.ts:42 (`?? 0`), :138 (`> 0`), quantityTradableGoodOptions w main.ts:3580 (maxQty > 0), ai-resource-needs.ts (`?? 0`), main.ts:22495/22562/22604/22608 (`?? 0`). ilosc 0 zachowuje się jak undefined we wszystkich ścieżkach ofert/kupna.
BLOKADY / ZAŁOŻENIA:
- Z1 (poza allowlistą, NIE zmieniane): gra/src/game/diplomacy-display.ts:429 RESOURCE_KEY_LABEL.ruda = 'Ruda' używane przez resourceDisplayLabel() (ui/diplomacyTradeBasket.ts — koszyk/oferty). Koszyk nadal pokazuje „Ruda" tam, gdzie wywołuje resourceDisplayLabel('ruda'). Do decyzji orkiestratora: dopuszczenie diplomacy-display.ts do allowlisty (1 linia) albo osobny temat.
- Z2 (poza allowlistą, NIE zmieniane): gra/src/main.ts:3557-3558 priceableTradableGoodOptions buduje etykietę „label ×N" wprost z g.ilosc — dla ilosc 0 pojawi się „×0" także w listach zasobów oferty dla surowców z dostępem boolean (np. Sól/Koń bez zapasu). Zgodne z literą DODATKU 1, ale to szerszy efekt niż „surowce ilościowe"; do potwierdzenia przez Evaluatora/właściciela.
- Z3 założenie: „Ruda" w indeksie dyplomacji = złoże miedzi (labelsForKopalniaMiedziOnHex / nakładka ZlozeRudy); „Ruda żelaza" i „Ruda cyny" bez zmian.
- Z4 założenie: ceramika zostaje bez „×0" (Maciej 2026-07-23: ceramika nie kumuluje sztuk).
- Z5 (poza zakresem, nie zmieniane): indeks deduplikuje po kluczu; gdy aktywne są jednocześnie „Ruda" i „Ruda żelaza" (klucz ruda), wygrywa pierwsza etykieta — zachowanie sprzed zmiany.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator R1 (Sonnet): ocena Z1/Z2 oraz diff gra/src/game/diplomacy-goods.ts.
DEPLOY/PUSH: NIE WYKONANO

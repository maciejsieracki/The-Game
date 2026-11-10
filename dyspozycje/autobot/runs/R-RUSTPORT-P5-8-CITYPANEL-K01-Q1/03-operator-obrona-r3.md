STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K01-Q1
GOAL: Port K01 (139 jednostek, 1 360 LOC, pin edb8fb56) do src-tauri/frontend-v2/src/ui/cityPanel/. Cel NIE został osiągnięty w tej rundzie.
ZMIANY/COMMIT: baza be3d662a (detached). Ta runda dodaje wyłącznie 03-operator-obrona-r3.md w run-dir. Zero zmian w src/, gra/**, PORTING-QUEUE.md, tools/, WERSJE.md.

ODPOWIEDZI NA ZARZUTY (stan zweryfikowany w be3d662a):
1. PRZYJMUJĘ. Potwierdzone: src-tauri/frontend-v2/src/ui/cityPanel/ nie istnieje; K01 nie został przeniesiony. Poprawka NIE wykonana w r3. Zob. plan niżej.
2. PRZYJMUJĘ. Potwierdzone: tools/dom-harness/run-k01.mjs nie istnieje. Brak harnessu, kryterium NIE_ZMIERZONO.
3. PRZYJMUJĘ. Potwierdzone: viewmodel/types.ts:268 `export type RebelStateDto = NieZmierzonoDto;` (placeholder). Mutacje pól buntu nie mają kształtu DTO.
4. PRZYJMUJĘ. Potwierdzone: w be3d662a brak tabeli było/jest i listy zmian API dla K01. Rundy 1–2 zawierały inwentarz i pomiary, bez kodu.
5. PRZYJMUJĘ. Potwierdzone: brak wpisu K01 w src-tauri/frontend-v2/PORTING-QUEUE.md i brak dyspozycje/rust-port/p5/P5-8-K01.md.
6. PRZYJMUJĘ. Zielone npm run check, typecheck i cargo fmt (raport r2) mierzą stan bazy bez K01. Nie są dowodem postępu kryteriów K01; w raporcie traktować je jako baseline.
7. PRZYJMUJĘ. Potwierdzone: r1 (1014a156) i r2 (be3d662a) to dokumenty i pomiary; krok Operator-impl z dispatchu nie został wykonany. Dwa wywołania Operatora nie wyczerpały zakresu. Wymagany powrót do Operatora-impl z tym samym ID.

DOWODY Z TEJ RUNDY (src-tauri/frontend-v2/src; src w 2c2f58f8 i be3d662a identyczny, git diff --stat na src pusty):
- Symbole K01 już przeniesione do ui/ (import można przepisać na ścieżkę względną): signedPl -> ui/formatPl.ts; attachInteractiveDetail -> ui/hoverDetailDock.ts; brandIconSvg, buildingIconSvg, unitIconSvg, mapResourceIconSvg -> ui/icons/brandAssets.ts; scienceOwlIconHtml -> ui/icons/scienceOwlIcon.ts; resourceTextClass -> ui/resourceColors.ts; UI_PARAMS -> ui/uiParams.ts; unitInfographicSvg, unitInfographicMedallionHtml -> ui/unitInfographic.ts. Razem 11 z 11 symboli z BLOKADY 6 w r2 ma odpowiednik w ui/ (zgodność sygnatur do sprawdzenia w porcie).
- Symbole z game/* bez odpowiednika w frontend-v2 (grep `export` po src: 0 trafień): stockResourceLabel, citizenUpkeepDisplayLines, daninaLabel (oraz reszta z inwentarza r1). Każdy wymaga pola DTO albo komendy kontrolera (P5.13), nie kopii logiki.
- viewmodel/types.ts:259 CityGrowthDto i :371 CityPanelDto.growth istnieją; pole rebelState :274 wskazuje na placeholder :268.

ZAŁOŻENIA (rozstrzygnięte, nie pytania):
- Z6: 11 symboli ui/ importowanych z odpowiedników w ui/ (bez kopii), zgodność sygnatur sprawdzana w porcie.
- Z7: Symbole game/* (52 minus 11 z Z6, wg inwentarza r1) przepisywane na pola DTO; brakujące pola (RebelStateDto, daninaLabelForCity) — stub 1:1 zachowania pinu zgodnie z pomiarem r2, bez nowego pola w UI.
- Z8: Nagłówek pinu (linie 1–284) nieportowany (jak Z2 w r1).

PLAN r3-impl (kolejny Operator, ten sam ID): (a) kopia 139 jednostek (pomiar-r2.json unit_block==1) do src-tauri/frontend-v2/src/ui/cityPanel/k01-fundament.ts z importami tylko z ../viewmodel, ../controller, ../ui; (b) tabela było/jest i lista zmian API; (c) tools/dom-harness/run-k01.mjs wg wzorca run-cityux.mjs; (d) mutacje pól DTO; (e) wpis w PORTING-QUEUE.md; (f) dyspozycje/rust-port/p5/P5-8-K01.md; (g) npm run check i typecheck po każdym commicie częściowym.

TESTY:
- Baseline (raport r2, nie dowód K01): npm run check EXIT=0; npm run typecheck EXIT=0; cargo fmt --check EXIT=0.
- Harness K01: NIE_ZMIERZONO (brak kodu K01).
- Mutacje pól DTO: NIE_ZMIERZONO (brak kodu K01).
- git diff --check: NIE_ZMIERZONO w tej rundzie (brak nowego kodu poza run-dir).
BLOKADY: 1) brak implementacji K01; 2) 52 symbole game/* wymagają pól DTO (RebelStateDto placeholder; CityGrowthDto bez zweryfikowanego mapowania na clampedGrowthBreakdown); 3) brak harnessu DOM; 4) brak PORTING-QUEUE i P5-8-K01.md.
RUNDY: 3/5 (ostatni werdykt: FAIL, zarzuty 1–7; decyzja wymagana: NIE)
NASTĘPNY KROK: Operator-impl r3 (PLAN r3-impl powyżej) -> Evaluator -> Obrona -> Final Control, ten sam ID.
DEPLOY/PUSH: NIE WYKONANO

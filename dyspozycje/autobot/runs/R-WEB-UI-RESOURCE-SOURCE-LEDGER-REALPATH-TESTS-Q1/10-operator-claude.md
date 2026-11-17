STATUS: PASS (kryteria a-e wykonane; jedno NIE ZMIERZONO opisane w BLOKADY)
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-SOURCE-LEDGER-REALPATH-TESTS-Q1
GOAL: domknac kryteria (a) i (b) naprawami z FC: testy realnej sciezki nowych zrodel ksiegi, zapis na realnym buildzie, rozmiar N=10, wycinka gracza.

ZMIANY/COMMIT: baza 119b6b23fcf01bfff3a906b709bcb63a9af7afb1 (origin/main). Pliki (allowlista):
- gra/src/main.ts: (1) bunt miasta wyodrebniony do funkcji `transferCityToRebelFactionWithLedger` (ta sama tresc, wolana z petli tury i z testu); (2) zapis `resourceLedgerHistory: ledgerHistoryToSave(ownerId => isHuman(ownerId))`; (3) hak `window.__ledgerRealPathDebug` (tylko ?civTest=1) — kazda metoda wola PRAWDZIWA funkcje gry (cancelRecruitmentPurchase, disbandPlayerUnit/disbandAiSupportUnit, applyMapBattleOutcome, resolveSiegeSurrender, transferCityByTreaty, annexCityStateToOwner, executePnDealTransfer, performUnitReplace, buildSiegeEngine, commitBuildRequest, buildSaveGameSnapshot/restoreGameFromSave); hak tylko przygotowuje scene i czyta stan.
- gra/src/game/resource-ledger.ts: `ledgerHistoryToSave(keepOwner?)` — opcjonalny filtr wlascicieli.
- gra/tools/resource-ledger-realpath-live-test.cjs (NOWY): testy na realnym buildzie w Chromium; czesci `sources`, `wycinka`, `save`, `size`.
- gra/tools/resource-ledger-realpath-mutation-test.cjs (NOWY): 16 mutacji na realnym buildzie (podmiana zrodla -> build vite poza repo -> test -> wymagane czerwono -> przywrocenie pliku).
- gra/tools/resource-ledger-trade-test.cjs: usuniete tekstowe 7j/7k (zastapione realnym testem + mutacja m13); 7g-7i zostaja jako kontrola strukturalna.
- ten raport.

TESTY (liczby z surowego wyjscia):
(1) Realna sciezka zrodel, `--part sources`, ziarno 7, Chromium, bundle vite z /tmp: 45 passed, 0 failed. Pokryte (kazde: zapas sie zmienia, wpis ksiegi ma polska etykiete i rodzaj, suma wpisow = zmiana magazynu dla kazdego wlasciciela i surowca, roznica 0): Zwrot z rekrutacji; Zwrot z rozwiazania jednostki (gracz i AI); Lup z bitwy (applyMapBattleOutcome z realnym lupem); Zdobycie miasta / Oddanie miasta (resolveSiegeSurrender); Cesja miasta (otrzymane/oddane); Przylaczenie miasta-panstwa; Bunt miasta (przejete/utrata); Dar dla/od; Zastap jednostke (Wojownik -> Procarz); Machina oblezniercza (Taran; 12 jednostek oblegajacych, bo 1 machina na 10); Stadnina (kon) -50. Brak pageerror.
(2) Wycinka gracza, `--part wycinka`: 5 passed, 0 failed — REALNY tick tury (endTurn w Chromium): wpis `wycinka|0` 'Wycinka lasu' kind wycinka kwota 10 (pracaPerTurn=10), drewno 0 -> 11 = 5(teren)+10(wycinka)-3(utrzymanie)-1(obywatele), roznica 0.
(3) Zapis na realnym buildzie, `--part save`: 8 passed, 0 failed — realny buildSaveGameSnapshot zawiera resourceLedgerHistory (6 tickow po 6 turach, N=10), round trip (realny restoreGameFromSave) zachowuje dziennik (rowny JSON), stary zapis bez pola => pusty dziennik bez wyjatku, po wczytaniu kolejna tura dopisuje tick, pole zapisu zawiera tylko wlasciciela-czlowieka.
(4) Mutacje na realnym buildzie (`resource-ledger-realpath-mutation-test.cjs`): 16/16 ZABITE (czerwone): m01 lup, m02 zwrot rekrutacji, m03 zwrot rozwiazania gracz, m04 zwrot rozwiazania AI, m05 zdobycie/oddanie, m06 cesja, m07 przylaczenie, m08 bunt, m09 dar, m10 Zastap, m11 machina, m12 Stadnina, m13 wycinka kwota 0, m14 USUNIECIE commitLedgerHistoryTick (main.ts ~40559) => 'len=0', m15 usuniecie restoreLedgerHistoryFromSave => czerwono na starym zapisie, m16 zapis dziennika wszystkich wlascicieli => rozmiar 107139 B > 50 KB.
(5) ROZMIAR N=10 (gracz + 5 AI = 6 wlascicieli; --part size):
  - ziarno 7, po 12 turach (tura gry 13): pamiec wszyscy 107139 B (104,6 KB); POLE ZAPISU 18206 B (17,8 KB); ticki=10.
  - ziarno 7, po 30 turach (tura gry 31): pamiec wszyscy 121882 B (119,0 KB; gracz 16750, AI 16038-31850 B); POLE ZAPISU 16821 B (16,4 KB).
  - ziarno 2024, po 44 turach: pamiec wszyscy 149461 B (146,0 KB; AI do 51873 B); POLE ZAPISU 14555 B (14,2 KB).
  - >50 KB => OGRANICZENIE: zapis tylko wlascicieli-ludzi (`ledgerHistoryToSave(isHuman)`), bo karta „Skad zapasy” czyta dziennik wylacznie wlasciciela-czlowieka (empireDetailPanel.ts:3614). Pole zapisu 14-18 KB (cel <=50 KB spelniony; hotseat 2-3 ludzi — NIE ZMIERZONO).
  - Tura ~60: NIE ZMIERZONO — w tej scenie (gracz + 5 AI dodanych hakiem spawnOwnerCity) endTurn wisi (timeout 90 s) przy turze 31 (ziarno 7) i 45 (ziarno 2024); to ta sama rodzina co znany zwis endTurn ~tura 57 (czesc B). Rozmiar jest nasycony od 10 ticka (N=10), wiec wartosc po 60 turach nie powinna odbiegac od pomiarow po 30/44 turach, ale to nie jest pomiar.
(6) Bramki referencyjne: logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6.
(7) Testy ledger: resource-ledger-test 1030/0; engine 20/0; consume 30/0; trade 27/0 (po usunieciu tekstowych 7j/7k); owner-delta 8/0; save-history 15/0; skad-dom 9/0; skad-ui 18/0.
(8) tsc --noEmit: 0 bledow. git diff --check: czysty. Dysk: 11 GB wolne.

BLOKADY:
- Pomiar rozmiaru po ~60 turach NIE ZMIERZONO (zwis endTurn w scenie testowej, czesc B).
- `npm run build`/`dev` w gra/ NIE uzyte; bundle `vite build --outDir /tmp/civ-ledger-dist|mut` poza repo.
- Bunt testowany przez wspolna funkcje `transferCityToRebelFactionWithLedger` (realna, wolana tez z petli tury), a nie przez doprowadzenie miasta do buntu w petli tury (wymagaloby wymuszenia porzadku publicznego) — ZALOZENIE.

RUNDY: 1/5
NASTEPNY KROK: Evaluator (sprawdzic zerowy wplyw haka bez ?civTest=1 — blok jest otoczony `if (/[?&]civTest=1/.test(location.search))`; uruchomic `node tools/resource-ledger-realpath-live-test.cjs --dist <build> --part sources|wycinka|save|size` oraz `node tools/resource-ledger-realpath-mutation-test.cjs --ids m01,...`).
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
1. Zwis endTurn przy turze ~31-45 w scenie „gracz + 5 AI” (timeout 90 s; po timeoucie getWorldState().turn zglosil 1) — nowe dane do diagnozy w czesci B (ziarna 7 i 2024, AI dodane hakiem spawnOwnerCity).
2. Zapis dziennika AI nie jest potrzebny UI; jesli UI zacznie czytac dziennik AI, trzeba zmienic filtr w main.ts (`ledgerHistoryToSave(ownerId => isHuman(ownerId))`).
3. Naglowek resource-ledger-owner-delta-test.cjs mowi, ze pokrycie wpiec robi live-measure; od teraz robi je tez resource-ledger-realpath-live-test.cjs (naglowek nie edytowany).

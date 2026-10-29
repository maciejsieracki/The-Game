STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K04-Q1
GOAL: Port calego kawalka K04 (32 jednostki) z pinu edb8fb56 do src-tauri/frontend-v2/src/ui/cityPanel/k04-*.ts
ZMIANY/COMMIT: oceniany 2443d212 (baza 84e48879 = origin/rust-port/parity-v2; brak rozjazdu, merge-base = 84e48879). Allowlista czysta (11 plikow: k04-stock.ts, k04-buildings.ts, viewmodel/types.ts, tools/dom-harness/{run,mutate}-k04-units[-b2].mjs, PORTING-QUEUE.md, P5-8-K04.md, runs/.../K04-Q1/*). Zero zmian w gra/, rust-port, WERSJE.md. git diff --check: czysto.
TESTY (odtworzone samodzielnie): npm ci 0; typecheck 0; npm run check 0 (self-test 33/15, 161 plikow 0 trafien, verify-pin-copies 435 niezgodnych=0); run-k04-units (pin edb8fb56) 22 przyp. OK=21 ROZNICA=0 ROZNICA_ZALOZONA=1; run-k04-units-b2 17/17 OK; mutate-k04-units 15/15; mutate-k04-units-b2 10/10 wykrytych, 0 przezylo. cargo: NIE_DOTYCZY.
WERDYKT ZARZUTOW:
1. Zakres 11/32 -> NAPRAW (brak 21 jednostek: batch 3 i 4 + 3 karty TopBar Rekruci/Praca/Zloto do dopisania na liste w P5-8-K04.md). Kryterium konca dispatchu = caly kawalek.
2. Harness/mutacje tylko dla batch 1-2 -> NAPRAW (rozszerzyc o kazda nowa jednostke).
3. PORTING-QUEUE/P5-8-K04.md niekompletne -> NAPRAW (uzupelnic wraz z batchami 3-4; dopisac trzy karty TopBar).
4. Zgodnosc DTO z silnikiem Rust (K04-Z1/Z3) NIE_ZMIERZONO -> ODDAL (zalozenie udokumentowane; weryfikacja w temacie integracji Rust/DTO, nie blokuje portu UI).
5. ROZNICA_ZALOZONA=1 cancelQueueItem (K04-Z2) -> ODDAL (zalozenie jawne; weryfikacja po stronie Rust).
Brak DO DECYZJI CZLOWIEKA. Jakosc batchy 1-2 potwierdzona, brak oslabionych testow.
BLOKADY: brak technicznych; jedyny powod FAIL = niekompletny zakres.
RUNDY: 3/5 przeprowadzone (r1 impl, r2 pomiary, r3 batch 2); nastepna r4/5 u Operatora.
NASTEPNY KROK: Operator r4 (batch 3: appendCityResourceStockStrip, appendRecruitMilitaryResourceStrip, addItem, appendBuildActionButtons, bindBuildQueueDragReorder, renderSurowce, cityPracaSplit, readPodzialPracy) i r5 (batch 4: cztery buildXxxDetailCard, 8 kart TopBar, religiaSzPunkty, resolveCityHealth, resolveEmpireSnap, __cityPanelOrderStateLocalForTest), z harnessem i mutacjami per jednostka; limit 5 rund wymaga zmieszczenia obu batchy w 2 rundach (inaczej LIMIT-5-EXCEEDED -> decyzja wlasciciela przez orkiestratora). Potem Evaluator, Final Control.
INTEGRACJA: SHA do integracji dopiero po PASS. Obecny kandydat czesciowy 2443d212 opiera sie bezposrednio na origin/rust-port/parity-v2 (84e48879) - przy przyszlej integracji fast-forward/cherry-pick bez konfliktow; NIE integrowac w stanie 11/32.
DEPLOY/PUSH: NIE WYKONANO

STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K08D-Q1
GOAL: Final Control po rundzie 2/5. Orzeczenie na dowodzie: checkout detached 648c69b8, swieze npm ci, pin edb8fb56 w katalogu poza repo.
ZMIANY-COMMIT: kod 0027f295 (runda 2), dokumentacja 648c69b8 (ostatni SHA Operatora). Ten plik dodaje osobny commit Final Control, tylko run-dir. Allowlista: git diff --name-status f5d34b52..648c69b8 tylko sciezki dozwolone, zero gra/**, .rs, WERSJE.md, package.json. git diff --check czysty.
TESTY (powtorzone samodzielnie):
- npm ci EXIT 0; npm run check EXIT 0 (206 plikow, 0 trafien, pin-copies 435, niezgodnych 0); npm run typecheck EXIT 0
- verify-k08d-copies handel i slider: OK, fails 0
- run-k08d-handel-pin: 34/34; run-k08d-wiring: 17/17
- mutate-k08d-handel: 6/6 + pola DTO/cfg 9/9 ZABITE; mutate-k08d-wiring: 9/9 ZABITE
- measure-k08d-drift (cur-dir = korzen repo): 0/4 zmienionych
- grep any / as unknown / @ts-ignore w k08d-*.ts i k08dWiring.ts: 0 trafien
- logi .txt: zaden nie konczy sie pusta linia
- cargo clippy/test: NIE_ZMIERZONO (brak gdk-3.0.pc wg Operatora; brak zmian w .rs)
ROZSTRZYGNIECIE ZARZUTOW:
1. test wykonania wiringu + mutacje: ODDAL (17/17 i 9/9 potwierdzone)
2. mutacje pol DTO/cfg: ODDAL (9/9 potwierdzone)
3. renderWealth, renderReligia i zaleznosci niedowiezione: NAPRAW. Zakres dispatchu to 3 jednostki; dostarczono renderHandelSlidersPanel (+ buildHandelDetailCard, ownerHasMennica, activeTradeRouteCountForCity). Runda 2/5, temat otwarty.
4. dryf po pinie: ODDAL (zmierzony 0/4, reprodukowane)
5. P5.13 w buildHandelDetailCard: NAPRAW. k08d-handel.ts:67-78 nadal liczy w UI koniunkcje bramki Mennicy (maMennica, mennicaAktywna, mennicaSpiZBrakuZlota) oraz buildEconParams/mnoznik; dispatch wymaga delegatow albo pol DTO dla regul gry. Cichy fallback `?? true` usuniety (cfgK08dRequired): ta czesc ODDAL.
6. niezgodnosc typu id (port number vs pin string): ODDAL jako udokumentowany kontrakt K08D-Z10, naprawa w K09 (mapowanie id) - K09 ma to jawnie przejac. DO DECYZJI CZLOWIEKA: nie.
7. logi: ODDAL (brak pustych linii; nazewnictwo r1/r2 wyjasnione w dossier §8)
BLOKADY: zarzuty 3 i 5 (NAPRAW). Przegladarka/CSS NIE_ZMIERZONO.
RUNDY: 2/5. Ostatni werdykt: FAIL. Decyzja wlasciciela nie jest wymagana.
NASTEPNY KROK: runda 3 do Operatora, ten sam ID: (a) delegat mennicaGate i usuniecie koniunkcji reguly z UI; (b) partia wealth (renderWealth + loadWealthParams, wealthCap, computeOrderStateLocal, buildWealthDetailCard, appendWealthCompactStrip); (c) partia religia (renderReligia + religiaSzPunkty, appendCompositionBlock, buildTopBarReligiaDetailCard, resolveEmpireSnap); kazda z bramkami, harnessem pin-exec i mutacjami; potem Evaluator i Final Control. Kolejnosc wzgledem origin/rust-port/parity-v2: jego tip = f5d34b52 = merge-base 648c69b8, czyli linia Operatora jest czystym fast-forwardem, bez rebase. Integracja dopiero po PASS; 648c69b8 NIE do integracji.
DEPLOY/PUSH: NIE WYKONANO

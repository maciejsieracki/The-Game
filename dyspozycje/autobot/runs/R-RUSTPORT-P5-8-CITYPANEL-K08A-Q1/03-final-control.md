STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K08A-Q1
GOAL: Port K08A (jednostki K08 bez DOM) do `src-tauri/frontend-v2/src/ui/cityPanel/k08a-fundament.ts`; FC r3 po naprawie zarzutu 1 FC r2 (sync lustra K06A).
ZMIANY/COMMIT: kod a42bab1b, pomiary f4d622dc (baza e145d022 / 249bca66). Wszystkie zmienione pliki w allowliście; zero zmian w gra/**, package.json, WERSJE.md, *.rs.
TESTY (odtworzone samodzielnie na f4d622dc, własny pin edb8fb56 w katalogu poza repo):
- verify-k08a-copies: EXIT 0, 15 bloków, 13 podstawień, OK
- run-k08a-units: EXIT 0, 48 wektorów, 0 różnic
- mutate-k08a-units: 50/50 ZABITA
- npm run check: EXIT 0 (pin-copies 435, niezgodnych 0); npm run typecheck: EXIT 0
- git diff --check 249bca66 f4d622dc: czysto
- cargo: nie dotyczy (brak .rs w diffie)
ZARZUTY: brak (zarzuty = []). Zarzut 1 FC r2 naprawiony: resolveK08aActiveCity = resolveK07aActiveCity + sync K06A (ten sam id; null zeruje lustro), zgodnie z pinem cityPanel.ts:10329-10346.
NOTATKI (ODDAL, nie blokują): N1 rozjazd lustr K07A/K06A (inne id / K06A null) nie naprawiany, dotyczy wiązania K09, NIE_ZMIERZONO; N2 rzutowanie `as unknown as CityK06` = założenie K08A-Z4; N3 wiązanie setK08aDeps/lustr w kontrolerze/K09 i zachowanie w przeglądarce NIE_ZMIERZONO.
BLOKADY: brak
RUNDY: 3/5
NASTĘPNY KROK: integracja orkiestratora na origin/rust-port/parity-v2 (12574ab8). K08A zależy tylko od zintegrowanych K01A..K07A; K07B (pliki k07b-*) niezależne, dopiski w viewmodel/types.ts tylko dopisując; kolejność K08A vs K07B dowolna, przy konflikcie w PORTING-QUEUE.md/types.ts scalić dopisując.
DEPLOY/PUSH: NIE WYKONANO

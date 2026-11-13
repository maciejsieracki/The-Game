STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-SIEGE-BLOCKADE-NO-RECRUIT-REINFORCE-Q1
GOAL: Obległe miasto nie rekrutuje, nie dostaje posiłków i nie przyjmuje obcych jednostek (gracz, AI, barbarzyńcy).
ZMIANY/COMMIT: oceniany HEAD 022fe4cca (baza 95a4b25ab; commity 0a9463ea9, 963cfd2dc, 022fe4cca). Final Control nie zmienia kodu.
Allowlista: city-siege-state.ts (nowy), main.ts, cityPanel.ts, units/setup.ts (poza allowlistą, wyjątek zaakceptowany: jedyny wspólny punkt ruchu gracza/AI/barbarzyńców, hak domyślnie null), recruitment-batch-contract-test.cjs, nowy test, runs/**. Brak zmian w battle/**, ai*.ts, WERSJE.md, rust-port, src-tauri. git diff --check czysto.

ROZSTRZYGNIĘCIE ZARZUTÓW:
1. Luka odwrotu/teleportu/spawn: ODDAL (naprawione w r2: retreatHexPassable w obu punktach odwrotu, test E1/E2 RED/GREEN, mutacja E5; spawnTransferredUnit martwy E14; spawnDifficultyBonusUnit tylko granty startowe E15).
2. Brak testów AI/barbarzyńcy/hot-seat/save-load: ODDAL (naprawione E6-E13). NIE_ZMIERZONO: żywa pętla tury AI w Chromium, jawnie zapisane.
3. Przycisk DOM i przejście tury z zablokowaną kolejką tylko strukturalnie: ODDAL (jawna luka; D2/D3 żywy zakup w Chromium działa).
4. setup.ts poza allowlistą: ODDAL (wyjątek zaakceptowany).
5. Hak testowy tylko za ?civTest=1: ODDAL.
Zero NAPRAW, zero DO DECYZJI CZŁOWIEKA.

TESTY (odtworzone samodzielnie na 022fe4cca):
- tsc --noEmit: EXIT=0
- siege-blockade-no-recruit-reinforce: 57 OK / 0 FAIL (z Chromium)
- city-siege-wall-rules 50/0, map-siege 6/0, oblezenie 27/0, siege-ai 17/0, siege-defenders 12/0, roster-space-next-active-unit 43/0, recruitment-batch-contract 17/0, post-battle-map 32/0, pre-battle-defender-retreat OK, retreat-garnizon-fortyfikacja 27/0, pr141-f04-unit-speed-activation EXIT=0.
- Dług sprzed tematu (identyczny na bazie wg Evaluatora/Obrony): ai-siege-requires-war, promote-to-front, naval-water-access-gate, pre-battle-retreat-exhausted (27/6).
BLOKADY: brak
RUNDY: Final Control 1/5 (cykl: Operator r1, Obrona r2)
NASTĘPNY KROK: integracja orkiestratora; SHA do integracji: 022fe4cca (plus commit tego raportu). Zmiany dotyczą wyłącznie gra/ i runs/, więc są rozłączne z origin/rust-port/parity-v2 (b520768b0): integrować do linii webowej niezależnie; parity-v2 wymaga później osobnego REPIN, jeśli panel/ruch ma parytet w Rust.
DEPLOY/PUSH: NIE WYKONANO

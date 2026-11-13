STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-ERA-WAR-DELAYS-Q1
GOAL: Kamień zostaje za bramką R1 (tura 40); Brąz i Żelazo: wojna epoki po 20 turach od wejścia TEGO ownera w epokę, bez bramki R1; zwykłe wypowiedzenie nadal pod R1.
ZMIANY/COMMIT: kod 2e37619e5 (baza origin/main a8823b16b). Pliki: gra/data/war-rules-params.json, gra/src/game/war-rules-multiwar.ts, gra/src/game/forced-war-bronze.ts, gra/src/game/forced-war-iron.ts, gra/src/main.ts (pula przed turą 40, bramka wypowiedz_wojne, bramka gracza-pierwszego); testy: forced-war-bronze-test.cjs, forced-war-iron-test.cjs, forced-war-reguly-multi-turn-simulation-test.cjs, war-rules-multiwar-main-guard-test.cjs, NOWY gra/tools/era-war-delays-test.cjs. Nietknięte: gra-robocza/**, WERSJE.md, rust-port/**, forced-war-stone.ts, ai.ts.
TESTY:
- era-war-delays-test.cjs (nowy): 41 OK / 0 FAIL (parametry JSON; bramka R1 w turach 30/39/40 dla Kamienia, Brązu, Żelaza i zwykłego wypowiedzenia; próg 19 vs 20 tur niezależnie od tury gry; flow headless pula -> parowanie -> bramka komendy; statyczne okablowanie main.ts)
- forced-war-bronze-test.cjs 48/0; forced-war-iron-test.cjs 55/0; forced-war-reguly-multi-turn-simulation-test.cjs 48/0 (K5 zaktualizowany do 20: A 10->30, B 40->60)
- war-rules-multiwar-main-guard-test.cjs 21/0 (asercja R1 przepisana na nowy filtr puli); war-rules-multiwar-test 57/0; era-war-all-eras-test 10/0; era-war-ignore-treaties-test 22/0; forced-war-stone-test, forced-war-relation-gate-test, forced-war-stone-main-guard-test, forced-war-iron-main-guard-test, forced-war-waves-test, forced-war-trojstronna-test, war-epoch-player-first-test, war-epoch-player-first-main-guard-test, war-era-counter-test, ai-war-gate-test, ai-ofensywa-wojna-epoki-test, ai-early-no-major-war-test: wszystkie zielone
- logic-test.cjs: LOGIC OK (213/213); ai-test.cjs: 274 passed / 20 failed (= baza)
- tsc --noEmit: 0 błędów
- war-allin-capital-test.cjs: 96 passed / 2 failed. Dwie asercje 6b (hash flagi OFF dla aiVsAi i noLandPath) failują IDENTYCZNIE na czystym origin/main (sprawdzone tymczasowym checkoutem źródeł bazy, potem przywrócone). Nie jest to regresja tego tematu.
- Dowód w grze (pełna pętla main.ts, Chromium): NIE_ZMIERZONO
BLOKADY: brak blokad kodu. Otwarte do decyzji orkiestratora (poza allowlistą, nie zmieniane): warAllInContextFor (main.ts ~33417) nadal zwraca brak marszu przed turą 40 dla każdej cywilizacji AI, także dla wojny Brązu/Żelaza wypowiedzianej przed 40 — wojna wybucha (wypowiedzenie), ale marsz/all-in startuje dopiero od tury 40.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) + Final Control (Sonnet); integracja orkiestratora po FC.
DEPLOY/PUSH: NIE WYKONANO

ZAŁOŻENIA (do akceptacji):
(a) Kamień: R1 bez zmian (eraForcedWarIgnoreR1 nie zawiera stone); stała Kamienia 25 nietknięta.
(b) Brąz/Żelazo: progi z JSON eraForcedWarStartTurnsFromEra = 20; stałe w forced-war-bronze.ts i forced-war-iron.ts czytają JSON. Iron importuje WAR_RULES_PARAMS z war-rules-multiwar (bez zależności Żelazo->Brąz).
(c) R1 pomijana dla tagów bronze/iron w: filtrze puli przed turą 40 (main.ts), bramce komendy wypowiedz_wojne (eraTag: gateForcedTagAny) i bramce gracza-pierwszego (eraTag z epoki partnera AI: 2->bronze, 3->iron). Sygnatura isPlayerPairGateOpen bez zmian (guard zachowany).
(d) Odpoczynek po wojnie (20) i cooldown tej samej cywilizacji (20) bez zmian; nie kolidują z progiem startu, bo mierzą inny okres.
(e) Wojna epoki nadal omija NAP/peaceLock (ERAIGN); sojusz nadal blokuje.

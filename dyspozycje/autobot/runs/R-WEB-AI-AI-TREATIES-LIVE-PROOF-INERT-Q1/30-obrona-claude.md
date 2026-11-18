STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar; logika gry bez zmian)
TEMAT: R-WEB-AI-AI-TREATIES-LIVE-PROOF-INERT-Q1 (obrona, runda 4/5, baza db29c24d1 / kandydat cec91fedd)
GOAL: odpowiedź na zarzuty 1-7 Evaluatora (28ca72882).
ZMIANY-COMMIT: gra/src/main.ts (+3: pole `factors` w odczycie civTest `aiAiNapLiveProof.state`, tylko odczyt rejestru diplomacyFactorLog); gra/tools/ai-ai-treaty-live-proof-breach-test.cjs (asercje A3b/A3c z rejestru zdarzeń); dowody/wiring-clean/ i dowody/wiring-MUTANT-D0/ (logi wiring/events dodane git add -f); dowody/punkt3-kara-r3-*.{json,log}. Logika gry NIE zmieniana.
ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ, POPRAWIONO. Rejestr pary (state.factors) pokazuje w breakTreatiesOnWar zdarzenie zlamana_obietnica_ai delta −20 (ON i OFF, tura 1), przed zerowaniem przez wojna_wypowiedziana −80. Dowód: dowody/punkt3-kara-r3-bundle.json.
2. PRZYJMUJĘ, POPRAWIONO. seed4242.wiring.log (wiring-clean, MD5 a8c04ffb; MUTANT c83d0abc) zacommitowany przez git add -f.
3. PRZYJMUJĘ, NIE POPRAWIONO. Liczniki ticku/prób/odmów wymagają haka wewnątrz tickAiAiTreatyRequests (poza allowlistą: tylko hooki civTest). NIE ZMIERZONO.
4. PRZYJMUJĘ, NIE ROZSTRZYGNIĘTO. Dane (wiring-clean/seed4242.jsonl): płatnik Fenicjanie(22) skarbiec na końcu tur 8-24 max 233 (t23), nigdy ≥829; odbiorca Egipt(1) skok maks. +72/turę. Metryka = aiSkarbiecByOwner (ten sam stan co planer), więc próbki EOT nie łapią stanu w chwili tick. Przelew D złotem NIE POTWIERDZONY stanem. NIE ZMIERZONO.
5. POPRAWIONO w zakresie repo. wiring-test na zacommitowanych dowodach: clean 4 OK / 0 FAIL; MUTANT-D0 3 OK / 1 FAIL (A3 dopl=0, napD=[0]). Mutacja była w logu/kopii, nie w kodzie repo (mutacji kodu nie da się odtworzyć z repo).
6. PRZYJMUJĘ, NIE POPRAWIONO. Wspólna funkcja zastosowania wyniku wymaga zmiany ciała tickAiAiTreatyRequests (poza allowlistą). DECYZJA ORKIESTRATORA.
7. PRZYJMUJĘ. Przyczyna „Target page closed" NIE ZBADANA. NIE ZMIERZONO.
POMIARY R3 (surowe):
- breach bundle (scratchpad dist-r3): 12 OK / 0 FAIL; kara Respekt ON−OFF = −30 (dON −30, dOFF 0); LOW 20→0.
- breach MUTANT dR=0 (sed w kopii main.ts, rebuild, przywrócono, cmp OK): 10 OK / 2 FAIL (A4 kara 0, A5 20 zamiast 0).
- wiring-test: clean 4/0; MUTANT 3/1 (patrz pkt 5).
- tsc --noEmit: exit 0. ai-ai-treaty-evaluate-test: 21 pass / 0 fail. ai-ai-treaty-nap-wiring-test: ZIELONE.
- NIE PONOWIONO w tej rundzie: logic-test, tech-tree, research, unit-replace, combat (zielone na cec91fedd; zmiana main.ts dotyczy tylko odczytu civTest).
BLOKADY: pkt 3 i 4 wymagają hooków w ciele tickAiAiTreatyRequests (decyzja: allowlista).
RUNDY: 4/5
NASTĘPNY KROK: Evaluator ponownie na tym SHA; orkiestrator decyduje o pkt 3, 4, 6.
DEPLOY/PUSH: NIE WYKONANO

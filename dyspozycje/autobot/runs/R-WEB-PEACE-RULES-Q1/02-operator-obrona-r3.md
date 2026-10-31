STATUS: PASS-WITH-NOTES (obrona Operatora po zarzutach Evaluatora r3; werdykt należy do Evaluatora i Final Control)
DOMAIN: GAME (WEB, gra/)
TEMAT: R-WEB-PEACE-RULES-Q1
GOAL: Odpowiedź na zarzuty 1-4 z FAIL Evaluatora (baza: commit e0b82d85b). Bez zmian reguł poza zarzutem 2 (spójność AI z R5a).
ZMIANY/COMMIT: baza e0b82d85b (detach). Commit obrony: patrz SHA w odpowiedzi orkiestratorowi (nie wypchnięty).
  Allowlista: gra/src/game/ai.ts (bramka czasu wojny dla propozycji AI); gra/src/main.ts (TYLKO hak testowy sendPeaceProposalForTest w bloku __peaceRulesTestDebug); gra/tools/diplo-war-peace-sim-test.cjs; gra/tools/diplo-war-peace-live-test.cjs; gra/tools/diplo-war-peace-main-guard-test.cjs (dopasowanie wzorców do nowego warunku); evidence/ (usunięto live-A-stan-silnika.png, dodano live-A-odmowa-pokoju-komunikat.png, odświeżono live-B1). Brak zmian w gra-robocza, WERSJE.md, forced-war-*, R8/R9.
TESTY (po poprawkach, lokalnie):
- tsc --noEmit: PASS (rc 0)
- diplo-war-peace-sim-test: 22/0 (w tym nowe S1a, S7b, M_TUR; S6/S6b przeniesione do tury 7 = minTurWojny zulusi)
- diplo-war-peace-live-test (Chromium, vite build do katalogu scratchpad): 17/0; mutacja M1 (if (false && isFeelingStronger…) w profile.ts:353) → 2 FAIL (powód i DOM), plik przywrócony git checkout
- diplo-war-peace-main-guard 28/0; profile-unit 198/0; gate 11/0; d7 8/0; brake 51/0; peace-lock 9/0; diplomacy-test 148/0; war-rules-multiwar-main-guard 21/0

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. Dodano realną ścieżkę wysłania z ekranu negocjacji: hak sendPeaceProposalForTest woła handleNegotiatedProposal (ten sam handler co modal) i handleNegotiationAccept (ten sam handler co onAcceptNegotiation/„Przyjmij w Punkty wymiany", main.ts ~22907). Odmowa idzie przez previewNegotiationEntry → hint #civ-hint-toast: „Nie można wysłać — AI czuje się silniejsze — odrzuca pokój…". Asercja DOM w A1 (widoczność + regex), negatywna asercja DOM w A2 (po 10 turach brak „silniejsze"). Zrzut: evidence/live-A-odmowa-pokoju-komunikat.png (widoczny toast z komunikatem). Test nietautologiczny: M1 daje FAIL w DOM.
   Ograniczenie: klik myszą nie jest symulowany; test wywołuje ten sam handler, który wiąże przycisk.
2. PRZYJMUJĘ. Błąd: AI składało propozycję w turze 1, bo bramka minTurWojny dotyczyła tylko gracza. Poprawka ai.ts: aiPeaceTimeOk = turnsAtWarRel >= warProfile.minTurWojny, dodana do warunku zaproponuj_pokoj. ZAMIANA ZAŁOŻENIA F2: AI składa propozycję pokoju dopiero, gdy spełnia obie bramki, których używa evaluatePeaceAiGate dla gracza (czas wojny i „nie czuje się silniejsze"). Dowód: S1 (AI rw 0.2 proponuje od tury 7 = minTurWojny zulusi, potem co 3); S1a (0 propozycji przed minTur); S7b (0 naruszeń „za wcześnie" w 6 siatkach rw × lost × 30 tur); mutant M_TUR wykrywalny (propozycja w turze 1, S7b > 0). S7 nadal zapewnia spójność „silniejsze".
3. PRZYJMUJĘ. Dodano asercje wartości: w live B1 prog = 15 i N = 6 (profil grecy) oraz tekst dokładny w DOM „Ryzyko wojny z Grecy: 2 tur do wypowiedzenia (łączna Relacja ≤ 15)". Regresja wartości (np. zmiana n) czerwieni test.
4. PRZYJMUJĘ. Numeracja w raporcie: zrzuty = 2 PNG (live-A-odmowa-pokoju-komunikat.png, live-B1-ostrzezenie-hamulca.png). Stary zrzut live-A-stan-silnika.png usunięty.

BLOKADY (bez zmian, poza zarzutami):
1. Klik myszą nie jest symulowany (hak wywołuje handler przycisku). Opisane w ODPOWIEDZI 1.
2. Ostrzeżenie hamulca domyślnie ukryte filtrem „Inne cyw." (OFF). Decyzja UX poza allowlistą, nie zmieniano.
3. Numeracja rund: dispatch 3/5, nazwa pliku 02-operator-obrona-r3.md.

RUNDY: 3/5 (wg dispatchu; po FAIL Evaluatora r3 ta obrona jest odpowiedzią na ten sam ID)
NASTĘPNY KROK: Evaluator (Sonnet) — ponowna weryfikacja zarzutów 1-4; potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

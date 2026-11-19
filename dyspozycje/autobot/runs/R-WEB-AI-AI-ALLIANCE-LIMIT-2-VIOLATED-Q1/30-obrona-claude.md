# R-WEB-AI-AI-ALLIANCE-LIMIT-2-VIOLATED-Q1 — obrona Operatora (runda 2, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-AI-ALLIANCE-LIMIT-2-VIOLATED-Q1
GOAL: wspólne sprawdzenie limitu 2 sojuszy na cywilizację AI we wszystkich ścieżkach zawierania sojuszu, za flagą torSojuszyAktywny (OFF = bez zmian).
ZMIANY-COMMIT: baza 96564a039 (kandydat). Allowlista: gra/src/main.ts, gra/tools/ai-ai-alliance-limit-test.cjs, ten raport.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. Bieg dowodowy 100 tur (seed 4242) NIE WYKONANO; szacunek ~2,5 h CPU, nie mieści się w tej rundzie. Brak dowodu runtime po poprawce.
2. PRZYJMUJĘ i NAPRAWIONO. Ścieżka wniosków gracz↔AI (applyProposalOutcomeImpl, main.ts ~26846) nie miała bramki. Dodano aiAiAllianceLimitBlokujeDeal(result.deal): gdy flaga ON, sojusz łamiący limit zmienia wynik na accepted=false z powodem. Pozostałe wywołania applyAcceptedProposal (granice ~15715, handel AI↔AI ~25254) nie tworzą rodzajów sojuszu (sojusz_* tylko w diplomacy-proposals.ts:1676, 3015).
3. PRZYJMUJĘ i NAPRAWIONO. Dodano test wiązań (W) czytający źródło main.ts: 4 wzorce (tor tick, gałąź sióstr, blokada wniosku, funkcja blokady). Mutanty usuwające każdy wzorzec: 4/4 wykryte. Wynik: WIRING main.ts OK.
4. PRZYJMUJĘ (NIE ZMIERZONO). Brak biegu OFF vs ON. Zachowanie przy OFF wynika z kodu: wszystkie nowe bramki są za isAiAiAllianceTickEnabled(), a tickAiAiAllianceRequests wychodzi przy OFF. To nie jest pomiar bit-w-bit.
5. PRZYJMUJĘ jako założenie jawnie zapisane: licznik liczy też sojusze z graczem (wymóg dispatchu). Poprzedni tor (E3) liczył wyłącznie AI↔AI. Wpływu na liczbę zawieranych sojuszy przy ON nie zmierzono.
6. PRZYJMUJĘ w części, z dowodem z danych. Audyt /tmp/allflags-keep/seed4242-all1.jsonl (ai-ai-alliance-limit-audit.cjs): pierwsze przekroczenie t80, civ 1, trzy sojusze: 1-13, 1-19, 1-22. W t75 civ 1 miała 1-13 i 1-22; w oknie t75–t80 pojawiła się para 1-19 (sasiad=false, zaufanie 100, pokoj=sojusz) i to ona przekracza limit. Dane nie niosą id traktatu ani pola źródła, więc ścieżka NIE ZMIERZONO. Para 1-19 nie sąsiaduje, co przemawia przeciw hipotezie „tylko granica”. Ścieżka sióstr: sisterAllianceEligible (diplomacy.ts:814) sprawdza wojnę i willingness, bez granicy. Tor: wspolnaGranica jest tylko przypisywane (ai-ai-alliance-tick.ts:239), nie bramkuje planera. Obie ścieżki są więc możliwe. Hipoteza „sojusze sióstr” pozostaje niepotwierdzona. Hipotezy zero-trust i koalicja odrzucone: ich pliki nie tworzą traktatów sojuszu (brak addTreaty, tylko zrywanie).

TESTY (surowe wyniki, ta runda):
- tsc --noEmit: EXIT 0
- ai-ai-alliance-limit-test.cjs: PRAWDZIWY MODUŁ OK; WIRING OK; mutanty modułu 4/4; mutanty wiązań 4/4; SUMMARY: limit suite OK (exit 0)
- ai-ai-alliance-tick-test: suite 19/19 OK; mutanty 8/8 (exit 0)
- diplomacy-zero-trust-unit: PASS=43 FAIL=0
- ai-ai-coalition-test: ZIELONE
- diplomacy-alliance-strength: 33 OK, 0 FAIL
- diplomacy-war-limit-unit: pass=57 fail=0
- logic-test: LOGIC OK (213/213); research-test: ALL GREEN; ai-unit-replace-same-rules: 45/0; combat-test: All sanity checks passed
- tech-tree (20): NIE ZMIERZONO w tej rundzie

BLOKADY / NIE ZMIERZONO:
- bieg runtime 100 tur (ON i OFF): NIE WYKONANO
- identyfikacja ścieżki pary 1-19 w danych: NIE ZMIERZONO
- wpływ zmiany licznika (z graczem) na liczbę sojuszy: NIE ZMIERZONO

UWAGA-DLA-ORKIESTRATORA: formSisterAlliancesIfThreatened (main.ts ~24788) nadal nie jest bramkowane flagą torSojuszy; bramka limitu działa tylko przy torSojuszyAktywny=true. Decyzja o uniezależnieniu należy do właściciela.

RUNDY: 2/5 (runda 1 PASS-WITH-NOTES; runda 2 = ta obrona)
NASTĘPNY KROK: Evaluator: weryfikacja diffu i wiązań; bieg 100 tur ON seed 4242 przed READY_FOR_DEPLOY (decyzja orkiestratora o czasie CPU).
DEPLOY/PUSH: NIE WYKONANO

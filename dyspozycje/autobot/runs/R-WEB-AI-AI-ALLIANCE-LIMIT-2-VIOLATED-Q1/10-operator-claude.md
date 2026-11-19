# R-WEB-AI-AI-ALLIANCE-LIMIT-2-VIOLATED-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-AI-ALLIANCE-LIMIT-2-VIOLATED-Q1
GOAL: jedno wspólne sprawdzenie limitu 2 sojuszy na cywilizację we wszystkich ścieżkach zawierania sojuszu AI↔AI, za flagą torSojuszyAktywny.
ZMIANY-COMMIT: baza f6f4df37 (origin/main). Allowlista: gra/src/main.ts (+25/-11), nowy gra/src/game/ai-ai-alliance-limit.ts, nowe gra/tools/ai-ai-alliance-limit-test.cjs i gra/tools/ai-ai-alliance-limit-audit.cjs, ten raport. Commit: SHA w polu sha.

ANALIZA (ścieżki i dane):
- Dane: 3 ziarna ON (all1) i 2 OFF (all0), 30 wierszy po 5 tur. Maks. sojuszy na cywilizację w serii: 6 (seed 4242), 7 (seed 7), 4 (seed 99). Civ 1 przekracza limit pierwszy w turze 80 / 55 / 70. Duplikaty par: 0. Pary spoza AI: 0. W OFF: 0 sojuszy.
- Dwie jedyne ścieżki tworzące sojusz AI↔AI (grep addTreaty):
  1. tickAiAiAllianceRequests, main.ts ~25761 — liczy limit z activeDeals; w tym zakresie kod poprawny.
  2. formSisterAlliancesIfThreatened, main.ts ~24788 (`sojusz_siostry_`) — BEZ sprawdzenia limitu. To najbardziej prawdopodobne źródło przekroczeń (hipoteza a). NIE ZMIERZONO na poziomie identyfikatora traktatu w danych pomiaru (dane nie niosą id).
- Hipotezy (b) i (c): odrzucone w danych (pary unikalne, wszystkie aiAi=true, strony są cywilizacjami). Hipoteza (d) NIE ZMIERZONO.

NAPRAWA:
- ai-ai-alliance-limit.ts: liczbaSojuszyCywilizacji (z pełnego activeDeals; strony = główne AI ∪ gracz; bez państw-miast) i sojuszLimitPozwala (obie strony poniżej limitu).
- Tick: alliancesCount z tej funkcji (zamiast lokalnej pętli).
- Gałąź sióstr: bramka `isAiAiAllianceTickEnabled() && !aiAiAllianceLimitPozwala(a,b)`.
- Założenie: limit liczy sojusze z graczem (wg dispatchu), zapisane w nagłówku modułu.

TESTY:
- tsc --noEmit: EXIT 0.
- ai-ai-alliance-tick-test: 19/19, mutanty 8/8.
- ai-ai-alliance-limit-test (nowy): PRAWDZIWY MODUŁ OK; mutanty 4/4 wykryte (M1 off-by-one, M2 strona AI pominięta, M3 gracz nieliczony, M4 tylko strona a).
- diplomacy-zero-trust-unit: 43/0. ai-ai-coalition-test: ZIELONE. diplomacy-alliance-strength: 33/0. diplomacy-war-limit-unit: 57/0.
- logic-test 213/213, tech-tree 20/0, research ALL GREEN, unit-replace 21/21, combat OK.

BLOKADY / NIE ZMIERZONO:
- Bieg dowodowy 100 tur (runner FALA 860, seed 4242) NIE WYKONANO: pomiar 150 tur trwał ~13 257 s (~3,7 h), 100 tur ~2,5 h — nie mieści się w tej rundzie. Brak dowodu runtime po poprawce.
- UWAGA-DLA-ORKIESTRATORA: formSisterAlliancesIfThreatened nie jest bramkowane flagą torSojuszy; bramka limitu działa tylko przy torSojuszyAktywny=true. Przy OFF ścieżka sióstr pozostaje bez limitu (zgodnie z wymogiem bit-w-bit). Decyzja, czy bramkę uniezależnić od flagi, należy do właściciela.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator — weryfikacja diffu (allowlista, gałąź sióstr); bieg 100 tur przy OFF/ON seed 4242 jako osobny temat dowodowy, gdy będzie czas CPU.
DEPLOY/PUSH: NIE WYKONANO

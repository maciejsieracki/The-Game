STATUS: DISPATCH (RUNDA 2 — Evaluator wydał FAIL, realna regresja potwierdzona)
DOMAIN: GAME
TEMAT: P-AI-ARMIA-ROZPROSZENIE-BRAK-KONCENTRACJI-Q1
GOAL RUNDY 2: Napraw regresję z rundy 1 — fix poprawnie rozwiązał "fałszywe fronty" (pojedynczy
nieszkodliwy barbarzyniec liczony jako osobny front, blokujący konsolidację), ale PRZY OKAZJI
zepsuł dokładnie chroniony scenariusz: gdy DWA geograficznie odrębne, PRAWDZIWE zagrożenia
(aktywna wojna z dwóch kierunków) mają już przydzielonych obrońców domu, `threatFrontCount`
po odfiltrowaniu spada do 0 i zostaje sztucznie podniesiony do 1 — więc wolne (nie-obrończe)
jednostki spod OBU miast maszerują dziesiątki heksów i łączą się w jeden klaster, mimo że oba
miasta nadal są pod osobnym, realnym atakiem. To jest odwrotność GOAL tematu.

KONTEKST — PRZECZYTAJ RUNDĘ 1 W CAŁOŚCI (raport Evaluatora poniżej, plus `ai.ts` diff
`e4775657..ea70b768`) PRZED PIERWSZĄ ZMIANĄ KODU:

ZARZUT EVALUATORA RUNDY 1 (PEŁNY, do naprawienia):
"Regresja funkcjonalna — naprawa faktycznie NISZCZY dokładnie ten scenariusz, który dispatch
i BINARNE KRYTERIUM SUKCESU nakazują chronić. Miejsce: `gra/src/game/ai.ts`
(`homeDefenseCoveredThreatIds` + `threatFrontCount = countThreatFronts(engageableEnemyUnits
.filter(...))` + klamra `threatFrontCount <= 1 ? 1 : threatFrontCount`). Mechanizm: gdy DWA
geograficznie odrębne, realne zagrożenia (nie błądzący barbarzyńcy, tylko aktywna wojna z
dwóch stron) każde dostają przydzielonego obrońcę domu (co jest normą przy typowej liczbie
jednostek na miasto, nie wyjątkiem), `threatFrontCount` po odfiltrowaniu spada do 0 i zostaje
sztucznie podniesiony do 1. `planArmyFrontMerge` z `targetClusterCount=1` każe WSZYSTKIM
wolnym (nie-obrończym) jednostkom połączyć się w JEDEN klaster — więc rezerwa spod miasta A
maszeruje dziesiątki heksów w stronę rezerwy miasta B, mimo że OBA miasta nadal są pod
realnym, osobnym atakiem."

ZARZUT 2 (dot. bramki, do naprawienia RÓWNOLEGLE z fixem):
"Istniejący test regresyjny scenario 2 (`army-concentration-test.cjs`) strukturalnie NIE MOŻE
wykryć powyższej regresji — woła `decideAITurn` z `myCities: []`, więc `homeThreats`/
`homeDefenderAssignments` są ZAWSZE puste niezależnie od liczby wrogów. Nowy scenariusz 4 też
tego nie pokrywa (tylko nieszkodliwi barbarzyńcy). Brakuje scenariusza: miasta + DWA prawdziwe
fronty wojenne + przydzieleni obrońcy domu na KAŻDYM froncie — dokładnie kombinacja, w której
fix się psuje."

ZADANIE:
1. Napraw `threatFrontCount`/logikę liczenia frontów tak, żeby liczyła GEOGRAFICZNE klastry
   zagrożeń PRZED odfiltrowaniem obrońców domu (albo odejmowała obrońców PER FRONT, nie
   globalnie zerując cały licznik) — cel: nieszkodliwy pojedynczy barbarzyniec przy JEDNYM
   mieście nadal NIE blokuje konsolidacji (cel rundy 1, musi zostać), ALE dwa geograficznie
   odrębne, prawdziwe fronty wojenne NADAL wymuszają `targetClusterCount >= 2` niezależnie od
   tego, czy każdy z nich ma już przydzielonego obrońcę domu.
2. Dodaj do `army-concentration-test.cjs` scenariusz z REALNYMI miastami (`myCities` niepuste)
   + DWOMA geograficznie odrębnymi, prawdziwymi frontami wojennymi + przydzielonymi obrońcami
   domu na obu — dokładnie kombinacja z zarzutu 2, której dziś brakuje.
3. Żywy dowód PRZED/PO na NIEZALEŻNYM scenariuszu (wzorem tego, który zbudował Evaluator w
   rundzie 1 — dwa miasta ~50 heksów od siebie, każde pod osobnym realnym atakiem, plus
   rezerwowe jednostki): PO naprawie klastry NIE łączą się w jeden mimo przydzielonych
   obrońców domu na obu frontach (żaden cross-front merge), a scenariusz rundy 1 (pojedynczy
   nieszkodliwy barbarzyniec przy każdym z 5 miast → konsolidacja do 1-2 klastrów) NADAL
   działa (brak regresji cofającej fix rundy 1).

BINARNE KRYTERIUM SUKCESU: (1) scenariusz rundy 1 (rozproszone garnizony bez realnego
zagrożenia z dwóch stron) nadal się konsoliduje; (2) scenariusz DWÓCH prawdziwych,
geograficznie odrębnych frontów wojennych NIE prowadzi do cross-front merge, nawet gdy oba
mają przydzielonych obrońców domu — potwierdzone PRZED/PO w NIEZALEŻNYM, żywym scenariuszu
(nie tylko istniejącą bramką, która strukturalnie nie mogła tego złapać). `tsc --noEmit`
czysty, 5 bramek referencyjnych zielone, `army-concentration-test.cjs` zielone z nowym
scenariuszem pokrywającym dokładnie tę kombinację.

ALLOWLISTA: bez zmian względem rundy 1 — `gra/src/game/army-concentration.ts`,
`gra/src/game/ai.ts` (logika `threatFrontCount`/liczenia frontów), `gra/tools/*-test.cjs`,
`dyspozycje/autobot/runs/P-AI-ARMIA-ROZPROSZENIE-BRAK-KONCENTRACJI-Q1/*`.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz polegania na `army-concentration-test.cjs` scenario 2
jako dowodu braku regresji — udowodnione że strukturalnie nie może jej złapać (myCities:[]).
Wymagany NIEZALEŻNY, żywy scenariusz z realnymi miastami. Zakaz cofnięcia fixu rundy 1 (nie
przywracaj starego zachowania "pojedynczy barbarzyniec = osobny front") w ramach naprawy tej
regresji — oba wymogi muszą być spełnione jednocześnie.

IZOLACJA: worktree `/home/user/wt-ai-armia-koncentracja` (JUŻ ISTNIEJE, ta sama gałąź
`autobot/P-AI-ARMIA-ROZPROSZENIE-BRAK-KONCENTRACJI-Q1`, HEAD `ea70b768`) — kontynuuj na tej
samej gałęzi.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Liczy się jako RUNDA 2.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow).
DEPLOY/PUSH: NIE WYKONANO

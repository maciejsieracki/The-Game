STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-AI-ALLIANCES-E3-WIRING-FLAGGED-Q1
GOAL: Sojusze AI↔AI (cel min. 1, limit 2 na cywilizację) za flagą torSojuszyAktywny=false; zachowanie gry bez zmian.
ZMIANY/COMMIT: kandydat 5aaaa469b5f649179a7fb03d9f615d34cb36cc0f; `git merge-base --is-ancestor e29f8c8b3 5aaaa469b` = OK. `git diff --stat e29f8c8b3 5aaaa469b`: 6 plików, +672/-1 (ai-ai-alliance-tick.ts nowy, ai-ai-treaty-params.json, main.ts +98, ai-ai-alliance-tick-test.cjs nowy, 2 raporty). Wszystko w allowliście; brak zmian w gra-robocza/, WERSJE.md, manifest, rust-port/. Flaga w danych = false; main.ts: bramka isAiAiAllianceTickEnabled() na początku tickAiAiAllianceRequests, wołanie po NAP w try/catch, hak tylko w __truceTestDebug (civTest).
TESTY (własne, surowe wyjście, node_modules z npm ci --ignore-scripts):
- tsc --noEmit: EXIT 0
- logic-test: 213/213; tech-tree: 20/0; research: 33/0; unit-replace-test: 21/21; combat: 6/6; unit-power: 6/0
- ai-ai-alliance-tick-test: suite 19/19 OK, mutanty 8/8 wykryte (M7 limit proponenta i M8 hasAlliance zamykają zarzuty 3 i 4)
- ai-ai-treaty-evaluate-test: 21 pass / 0 fail, mutanty niewykryte 0; ai-ai-treaty-nap-wiring-test: 44/44, 6 mutantów wykrytych
- Bieg dymny 30 tur seed 4242 z flagą true: NIE_ZMIERZONO (wymaga bundla budowanego poza repo; FC nie buduje w gra/).
ROZSTRZYGNIĘCIE ZARZUTÓW:
1. Brak runnera/analizatora ai-ai-alliance-measure-*: ODDAL (uwaga). Pomiar 150 tur robi orkiestrator wg dispatchu; istniejący runner ai-economy-measure-run.cjs można użyć, ale brak haka odczytu liczby sojuszy AI↔AI w main.ts. Flaga false = zero wpływu na grę, więc nie blokuje integracji.
2. Brak biegu dymnego z flagą true: ODDAL. Dowód statyczny (S12) + czysta logika z 19 testami; wpięcie ma try/catch. Dowód dynamiczny obowiązkowy PRZED włączeniem flagi (ABC), nie przed integracją toru wyłączonego.
3. Mutacja limitu proponenta: NAPRAW wykonane w obronie (S13, M7), zweryfikowane.
4. Mutacja hasAlliance: NAPRAW wykonane (S14, M8), zweryfikowane.
5. Zawarcie przez addTreaty + syncRelationFromDeals zamiast applyProposalOutcomeImpl: ODDAL (nota); zgodne z precedensem sojuszy siostrzanych i tickiem NAP; applyProposalOutcomeImpl wymaga wyniku z UI gracza. Przejrzałem logikę: deterministyczna, skarbiec nie schodzi poniżej zera, brak duplikatów par.
6. Brak UI "Układy w świecie": ODDAL; zgodnie z dispatchem (pkt 5) bez nowego UI.
BLOKADY: brak blokad integracji.
UWAGI-DLA-ORKIESTRATORA:
- Przed włączeniem flagi: osobny temat na hak odczytu liczby sojuszy AI↔AI + analizator, bieg dymny 30 tur seed 4242 i 150 tur x 3 ziarna; efekt kaskady wezwania do wojny (alliance-war-obligation) niezmierzony.
- unit-replace-full-cost-test: 1 FAIL wg operatora identyczny na bazie; FC tego nie sprawdzał (poza bramkami referencyjnymi).
RUNDY: 2/5 (FC po obronie rundy 2)
NASTĘPNY KROK: integracja orkiestratora (merge 5aaaa469b, bramki), deploy tylko za osobną autoryzacją; flaga zostaje false.
DEPLOY/PUSH: NIE WYKONANO

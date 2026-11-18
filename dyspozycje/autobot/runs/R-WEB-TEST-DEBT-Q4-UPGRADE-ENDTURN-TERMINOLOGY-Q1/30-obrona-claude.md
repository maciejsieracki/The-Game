# R-WEB-TEST-DEBT-Q4-UPGRADE-ENDTURN-TERMINOLOGY-Q1 — obrona runda 2

STATUS: DECISION_REQUIRED
DOMAIN: GAME (tylko testy/narzędzia; gra/src nietknięte)
TEMAT: R-WEB-TEST-DEBT-Q4-UPGRADE-ENDTURN-TERMINOLOGY-Q1
GOAL: odpowiedź na zarzuty Evaluatora (1a59c8307); testy 1, 3 naprawione, 2 i 4 rozstrzygnięte.
ZMIANY-COMMIT: `0f37c725a` (upgrade-budynki, zarzut 1), `bef255fd2` (end-turn, zarzut 3), ten raport `3bc359371`. Baza 6834485a1.

## Odpowiedzi na zarzuty
1. PRZYJMUJĘ (asercja, nie logika gry). Stan ['mury_kamienne','mury','fort'] jest zestarzały; produkcja nie podaje go wprost do applyCompletedBuildingIds, bo wczytanie zapisu (main.ts:50764) najpierw wywołuje collapseFortificationChain. Asercja sprawdza ten łańcuch: `collapseFortificationChain(applyCompletedBuildingIds(...))` → ['mury','fort']. Przed: 60 pass / 1 fail; po: 61 pass / 0 fail. Kandydat Q1: applyCompletedBuildingIds nie naprawia wcześniejszego układania etapów (production.ts:919-923); w grze nieosiągalne.
2. PRZYJMUJĘ diagnozę, NIE naprawiam (allowlista). CSV `budynki-top5.csv:13` mówi „do 50 sztuk”; `gra/data/building-cards-top5.json` (851fc3fd8, ręczna edycja) mówi „30/50/70/90/110”. Generator odtwarza „do 50” (diff: tylko garncarnia top5[0]). Sonda naprawy samym CSV (poza repo) kończy się BŁĘDEM generatora: „garncarnia top5.0.zdanie … występuje 0×”. Naprawa wymaga CSV i `card-text-corrections.cjs` / `gen-building-cards-top5.korekty.json`, czyli plików spoza allowlisty. Regeneracji JSON nie robię (cofnęłaby decyzję 2026-11-14). Test zostaje czerwony, bez osłabiania.
3. PRZYJMUJĘ i naprawiam. Kotwica `\n    function ` → wzorzec `\n[ \t]+(?:export )?function nazwa(`, bez okna 2500 znaków; brak kotwicy = jawny FAIL.
4. PRZYJMUJĘ jako uwagę poza zakresem: administrator-panel-real-render-test.cjs i administrator-icon-everywhere-render-test.cjs (FALLBACK_CHROME chromium-1194) poza allowlistą, nie ruszane. Kandydat na osobny temat.

## Mutacje (kopia w /tmp/claude-0/mut, nie repo)
- A: collapseFortificationChain bez efektu → upgrade `60 pass, 1 fail` (FAIL: stale palisade…).
- B: usunięte `noteEndTurnBlockedByNns();` w gałęzi NNS → end-turn `passed=35 failed=1` (FAIL: (f)…).
- C: wcięcia funkcji 4→2 spacje → end-turn `passed=36 failed=0`.

## TESTY (surowe wyniki)
- tsc --noEmit: exit 0.
- logic-test: `LOGIC OK (213/213)`.
- tech-tree-test: `20 pass, 0 fail`.
- research-test: `PASSED: 33 / FAILED: 0 / TOTAL: 33`.
- unit-replace-test: `WSZYSTKIE TESTY ZIELONE (21/21)`.
- combat-test: `All sanity checks passed.` exit 0.
- upgrade-budynki-test: `61 pass, 0 fail`.
- end-turn-block-event-test: `passed=36 failed=0`.
- terminology-trade-vs-tax-test: `798 pass, 1 fail` (bez zmian; zarzut 2).
- barb-karencja-czas-trwania-real-render-test: `WYNIK: 13 PASS, 0 FAIL`.

## BLOKADY
Zarzut 2 (terminology [G]) wymaga decyzji Q2.

## RUNDY
2/5 (r1: 6834485a1; r2: ten raport).

## DECYZJE DLA ORKIESTRATORA
- Q1: zaakceptować kompozycję z load-time collapse w teście upgrade, albo osobny temat na applyCompletedBuildingIds.
- Q2: allowlista dla CSV i warstwy korekt (zarzut 2), albo inne rozstrzygnięcie.

## NASTĘPNY KROK
Final Control po Q2 (pozostałe trzy testy gotowe).

DEPLOY-PUSH: NIE WYKONANO

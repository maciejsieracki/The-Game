STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ERA-WAR-PAIRING-ALLIANCE-NO-BLOCK-Q1
GOAL: sojusz nie blokuje wojny epoki; parowanie do skutku z preferencja bez sojuszu; fallback po trzech; bramki zielone.
ZMIANY/COMMIT: kandydat d3be296531e97ba79b7b2227c68bda90f1830795; baza aa96cfc618de124e48b74408870115854293e6c5 jest przodkiem kandydata (merge-base --is-ancestor OK). git diff --stat: 13 plikow, +466/-61; wszystkie w allowliscie (gra/src/game/{ai,forced-war-common,war-rules-multiwar}.ts, gra/src/main.ts, testy gra/tools/*, run dir). Brak gra-robocza/, WERSJE.md, rust-port/.
TESTY (surowe, wlasny przebieg FC na kandydacie, npm ci w worktree): tsc --noEmit exit 0; logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; era-war-pairing-alliance 19/0; era-war-ignore-treaties 22/0; forced-war-stone 31/0; forced-war-bronze 48/0; forced-war-bronze-main-guard 22/0; forced-war-iron-main-guard 36/0; forced-war-trojstronna 23/0; war-rules-multiwar-main-guard 21/0; war-era-counter 82/0; era-war-delays 55/0.
Mutacja zrodla (isWarTreatyBlocked: 'if (input.eraWar) return false;' -> 'return input.hasAlliance;'): era-war-pairing-alliance 17 pass / 2 fail (E1/E2 czerwone) - zarzut 1 faktycznie zalatany. Plik przywrocony.
wojna-wymuszona-parowanie-test.cjs: TypeError (reading 'ownerId') - ten sam blad na kandydacie; na bazie test rowniez konczy sie bledem Node (dlug sprzed zmiany, nie regresja).
OCENA ZARZUTOW: 1 naprawiony (E1/E2 na prawdziwym module, mutacja czerwona - potwierdzone). 2 naprawiony (B1b, waga DP widoczna w diffie; sondy wariantu bez wagi nie powtarzano). 3 naprawiony (komentarze w ai.ts, main.ts, forced-war-common.ts, war-rules-multiwar.ts zaktualizowane; guardy stone/iron-alliance usuniete wraz z komentarzem). 4 ODDAL jako uwaga: pomiar seed 4242 >=90 tur NIE ZMIERZONO; brak dokumentu ERAWAR-PAROWANIE; skutecznosc w grze bez dowodu.
Uwaga merytoryczna: usuniecie guardow hasAllianceTreaty (ai.ts x3) i stone/iron-alliance-guard (main.ts) zgodne z decyzja wlasciciela 2026-11-22; zerwanie sojuszu przy wojnie wg komentarza przez breakTreatiesOnWar (runtime nieweryfikowane).
BLOKADY: brak (pomiar kierunkowy = NIE ZMIERZONO, nieblokujacy).
RUNDY: FC po rundzie 2/5.
NASTEPNY KROK: integracja orkiestratora (merge-tree, bramki), READY_FOR_DEPLOY po jej wyniku; osobny temat pomiaru seed 4242 PRZED/PO.
UWAGI-DLA-ORKIESTRATORA: pomiar seed 4242 + dokument ERAWAR-PAROWANIE-2026-11-25.md do zlecenia osobno; wojna-wymuszona-parowanie-test czerwony od bazy (dlug #69/#78).
DEPLOY/PUSH: NIE WYKONANO

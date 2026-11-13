STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-RECRUIT-LIST-ORDER-BY-ERA-Q1
GOAL: Lista rekrutacji (panel miasta i panel Armia): epoka malejaco, w epoce sila malejaco, jeden komparator.
ZMIANY/COMMIT: weryfikowano 78794a23d (kod 6f61f1d70) na bazie 57a7ada40. Diff = recruit-list-order.ts (nowy), cityPanel.ts (+5/-3), recruit-list-order-by-era-test.cjs (nowy), artefakty runu. Zero zmian poza allowlista. git diff --check OK. FC nie zmienial kodu.
TESTY (wlasny przebieg FC): npm ci --ignore-scripts OK; tsc --noEmit EXIT=0; recruit-list-order-by-era-test.cjs 18 pass / 0 fail EXIT=0 (Chromium, 3 mutacje lamia test). Regresje: diff gate-regress-pre vs post = SAME (opieram sie na logach operatora; 6 padajacych testow identycznych przed i po).
ZARZUTY: brak. Uwagi: (1) main.ts:17549 sortuje tylko snapshot options, nieczytany w src/ui; main.ts:6873 to AI, main.ts:7120 to picker zamiennikow - ODDAL, poza zakresem. (2) nieaktualna asercja w unit-power-sort-test.cjs padala przed zmiana - ODDAL (nie regresja). (3) Rydwan (woly) nad Wojownikiem w epoce 1 wynika z przyjetej miary fieldPower - zgodne z dispatchem.
BLOKADY: brak
RUNDY: 1/5 (FC)
NASTEPNY KROK: integracja orkiestratora; SHA do integracji: 78794a23d (6f61f1d70 + 78794a23d) plus ten commit FC. Baza 57a7ada40 NIE jest przodkiem origin/rust-port/parity-v2 (6b3882cad); kolejnosc: najpierw main/baza, parity-v2 po (zero zmian w rust-port/**, brak konfliktu).
DEPLOY/PUSH: NIE WYKONANO

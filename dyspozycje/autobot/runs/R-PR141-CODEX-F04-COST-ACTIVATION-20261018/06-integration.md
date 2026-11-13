STATUS: INTEGRATED-LOCALLY-WITH-NOTES
DOMAIN: ECONOMY / BOUNDED COST ACTIVATION
TEMAT: R-PR141-CODEX-F04-COST-ACTIVATION-20261018
DATA: 2026-10-18
GOAL: Zmaterializować decyzję root o przyjęciu dokładnie bounded F-04 cost consumer scope po `05-final-control.md`; bez product-wide acceptance.

## Decyzja integracyjna

Root przyjął lokalnie bounded scope raportowany przez Final Control (PASS-WITH-NOTES): dwa zatwierdzone koszty z owner-resolved wartościami, zero jako replacement pokrywającego efekt, odrębny Impi-only G11 rebate pozostaje additive według 3B/5A, a tempo/trudność i payment/refund contracts zachowują kolejność. To zapis decyzji root, nie niezależna ponowna akceptacja przez Operatora.

Scope obejmuje właściwe player/AI production catalogs, replacement/purchase quotes i building quote/payment; numeric UI projection inputs były sprawdzone, ale nie browser/DOM output. Brak nowych all-zero speed/rush consumers i brak Manpower-cost rule.

## Evidence i historia

Zapisane wyniki: target test 19 PASS; defense test 66 PASS; G11/Impi test 705 PASS; building pace 6 PASS; building stock/refund 5 PASS; TypeScript check PASS; `git diff --check` PASS. Final Control niczego nie uruchamiał. Owner/negative controls obejmują wszystkie 15 matrix rows, unknown key, human/seat/AI/missing/fallback; Roman no-double-discount i non-Impi controls. Rounding/floor/difficulty i stored payment/refund paths są źródłowo ograniczone, bez twierdzenia o live transaction/browser.

## Granice

Lokalnie przyjęto wyłącznie dwa bounded cost effects. Nie oznacza to acceptance pozostałych 22 F-04 IDs, gameplay/runtime behavior, 93×15 PR141 ani READY_FOR_DEPLOY. Wspólny dirty tree wymaga zachowania zmian pozostałych lanes. Bez commit, push, merge, deploy i publikacji.

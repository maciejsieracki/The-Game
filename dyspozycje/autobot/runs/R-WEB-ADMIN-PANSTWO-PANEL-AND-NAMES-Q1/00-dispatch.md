# R-WEB-ADMIN-PANSTWO-PANEL-AND-NAMES-Q1 — dispatch (2026-11-13, #327)

GOAL (#327, po silniku #316 / FALA 673): (1) panel Państwa pokazuje administratora państwa (jeden na Państwo, tryb auto jeden dla całego Państwa) i jego stan; (2) w tekstach gracza nazwy to dokładnie „administrator państwa” (ulepszenia, zasięg całego Państwa) i „administrator miasta” (budynki w mieście); nie mieszać nazw i zakresów.
BAZA: origin/main (bff897c9bd743bfab5c57b3d138eb37c76da7e5e). Operator: HAIKU.
ALLOWLISTA: gra/src/ui/ (panel Państwa i teksty administratorów — tylko napisy i podpięcie stanu z silnika), gra/src/main.ts (tylko wiring stanu do panelu), NOWY gra/tools/admin-panstwo-panel-names-test.cjs, dyspozycje/autobot/runs/R-WEB-ADMIN-PANSTWO-PANEL-AND-NAMES-Q1/**. Zakaz: zmian reguł administratora, kosztów, progów, auto-ulepszeń, JSON balansu, WERSJE.md, gra-robocza/, rust-port/, git add -A.
ŚRODOWISKO: worktree; w gra/ npm ci --ignore-scripts; ZAKAZ npm run build/dev; tsc --noEmit wolno.
KRYTERIA KOŃCA: tsc 0; 5 bramek (logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6) z surowym wyjściem; test: panel Państwa pokazuje stan administratora państwa; teksty zawierają tylko dwie nazwy (bez starych nazw); mutacja (stara nazwa) czerwieni test; raport 10-operator-claude.md z SHA i listą zmienionych napisów. Nie integrujesz, nie pushujesz na main.

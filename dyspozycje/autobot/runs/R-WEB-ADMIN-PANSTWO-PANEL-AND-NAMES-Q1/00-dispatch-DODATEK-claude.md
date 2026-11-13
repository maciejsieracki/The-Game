# R-WEB-ADMIN-PANSTWO-PANEL-AND-NAMES-Q1 — dispatch (2026-11-13, #327)

GOAL (#327, po silniku #316 / FALA 673): (1) panel Państwa pokazuje administratora państwa (jeden na Państwo, tryb auto jeden dla całego Państwa) i jego stan; (2) w tekstach gracza nazwy to dokładnie „administrator państwa” (ulepszenia, zasięg całego Państwa) i „administrator miasta” (budynki w mieście); nie mieszać nazw i zakresów.
BAZA: origin/main (bff897c9bd743bfab5c57b3d138eb37c76da7e5e). Operator: HAIKU.
ALLOWLISTA: gra/src/ui/ (panel Państwa i teksty administratorów — tylko napisy i podpięcie stanu z silnika), gra/src/main.ts (tylko wiring stanu do panelu), NOWY gra/tools/admin-panstwo-panel-names-test.cjs, dyspozycje/autobot/runs/R-WEB-ADMIN-PANSTWO-PANEL-AND-NAMES-Q1/**. Zakaz: zmian reguł administratora, kosztów, progów, auto-ulepszeń, JSON balansu, WERSJE.md, gra-robocza/, rust-port/, git add -A.
ŚRODOWISKO: worktree; w gra/ npm ci --ignore-scripts; ZAKAZ npm run build/dev; tsc --noEmit wolno.
KRYTERIA KOŃCA: tsc 0; 5 bramek (logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6) z surowym wyjściem; test: panel Państwa pokazuje stan administratora państwa; teksty zawierają tylko dwie nazwy (bez starych nazw); mutacja (stara nazwa) czerwieni test; raport 10-operator-claude.md z SHA i listą zmienionych napisów. Nie integrujesz, nie pushujesz na main.

## DODATEK (runda 2, 2026-11-13) — rozszerzenie allowlisty po FC FAIL r1 (decyzja orkiestratora)
BAZA: kandydat 2c6b0d33a (potomek bff897c9b). Nie zaczynaj od zera — popraw ten kandydat.
POWÓD: FC r1 — Z1: stare „administrator ulepszeń” nadal w tekstach gracza poza src/ui; Z3: 3 testy przeglądarkowe asertują stare napisy. Nazwy są już zatwierdzone przez właściciela (administrator państwa / administrator miasta), więc to zmiana samych napisów, nie reguł.
ALLOWLISTA ROZSZERZONA (tylko napisy i asercje na napisy):
- gra/src/main.ts: napisy „administrator ulepszeń” (powiadomienia ok. 10222–10225, showHintMessage ok. 27127–27213, powiadomienie migracyjne ok. 47870–47876) → „administrator państwa” / „administrator miasta” zależnie od zakresu.
- gra/src/game/auto-build-gate.ts (ok. 112), gra/src/game/city-administrator.ts (ok. 189): tylko treści tekstów.
- gra/data/city-administrator-params.json: tylko pola opis_gracza (ok. 23, 27) — bez zmian liczb i progów.
- gra/src/data/wikiBundle.json: tylko przez istniejący skrypt generacji wiki (nie ręcznie).
- testy: gra/tools/administrator-panel-real-render-test.cjs, gra/tools/improvement-admin-tooltip-real-render-test.cjs, gra/tools/administrator-icon-everywhere-render*.cjs — asercje zaktualizowane do nowych nazw, bez osłabiania progów.
ZAKAZ: zmian kosztów, progów, auto-ulepszeń, reguł zatrudnienia, WERSJE.md, gra-robocza/, rust-port/, git add -A.
ZASADA ZAKRESU (zatwierdzona): panel Państwa i teksty „administrator państwa” mówią o WSZYSTKICH miastach Państwa; „administrator miasta” — o jednym mieście. Nie łącz obu.
KRYTERIA KOŃCA: tsc 0; 5 bramek z surowym wyjściem; admin-panstwo-panel-names-test 0 FAIL, z 0 trafieniami starej nazwy w gra/src, gra/data, gra/tools i wikiBundle; mutacja starej nazwy w pliku czerwieni test; trzy testy przeglądarkowe — jeśli niewykonalne w tej sesji, NIE_ZMIERZONO z powodem (nie zmieniać progów). Raport 10-operator-claude.md (runda 2). Nie integrujesz, nie pushujesz na main.

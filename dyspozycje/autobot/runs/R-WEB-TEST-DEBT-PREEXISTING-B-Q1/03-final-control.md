STATUS: FAIL
DOMAIN: GAME (WEB) — dług testowy
TEMAT: R-WEB-TEST-DEBT-PREEXISTING-B-Q1
GOAL: partia 1 splaty listy B; cel min. 15 testów zielonych albo usuniętych z uzasadnieniem.
RUNDY: FC po rundzie 2/5 (wynik 13/15). Wraca do TEGO SAMEGO ID, runda 3.

## Weryfikacja niezależna (commit 4222aeded, baza a8823b16b)
- Allowlista: 10 plików gra/tools/*-test.cjs + 01/02-operator-*.md. Zero zmian w gra/src, gra/data, gra-robocza, WERSJE.md, rust-port. `git diff --check`: czysto.
- Wyniki (node_modules tylko symlink, usunięty po pracy):
  unit-power 6/6; unit-replace 15/15; unit-recruit-nazwa zielony (exit 0); unit-detail-card-entitycard-migration 40/0; unit-info-card-army-interaction 7/0; unit-info-card-wiring 6/0; unit-power-sort 13/0; unit-resource-upkeep 7/0; ai-jednostki-tylko-zakup 45/0; era-recruit-panel-refresh 4/0; forced-war-bronze-main-guard, forced-war-bronze-new-game-reset 41/0, forced-war-iron-main-guard 35/0 (zielone na bieżącym main, bez zmian).
- Regresje: tsc --noEmit EXIT 0; logic-test 213/213; mgla-sciezka-inwariant 39/3 (niezmieniony, klasa B zgodnie z raportem).
- Przegląd zmian asercji: unit-power-sort 2→1 trafienie jest poprawne (obie listy idą dziś przez wspólny recruitPanelPurchasableUnits → sortRecruitListByEra, cityPanel.ts:9213/9228; zmiana z 219456bae); ai-jednostki D11 nadal liczy punkt zużycia i dodatkowo wiąże prognozę; unit-resource-upkeep: Włócznik stock 50 = 25 (units.json) × Brąz 2; harness stuby w era-recruit-panel-refresh są no-op bez zmiany asercji. Brak osłabienia sensu, brak SKIP.

## Zarzuty i orzeczenia
1. 13/15 zamiast min. 15 — NAPRAW (brakuje 2; eko-tech-paczka5 jest wg Operatora tanią klasą A wobec 2ebd0d7f0, plus eko-tech-paczka1–4, diplomacy-*, empire-*, era-cud/change-toast, auto-battle-simultaneous nietknięte).
2. ai-test (20 FAIL) i ai-zdobycie-miasta-adiacencja-test nadal bez klasyfikacji (NIE_ZMIERZONO) — NAPRAW (pkt 1 dispatchu niezrealizowany; wymagana tabela per FAIL: asercja nieaktualna / kod błędny / martwy).
3. tsc — ODDAL (wykonane, EXIT 0, potwierdzone niezależnie).
4. Rodzina unit-* — ODDAL (8/8 sklasyfikowane z SHA i zielone).
5. Dysk poniżej progu webu — ODDAL jako uwaga procesowa dla orkiestratora (przy FC wolne 2,8 GB; node_modules tylko symlink read-only).
6. mgla-sciezka-inwariant (klasa B, 39/42) — DO ZAŁOŻENIA przez orkiestratora jako osobny temat R-WEB-TEST-DEBT-MGLA-INWARIANT-NEW-SITES-Q1 (stała zgoda); wymaga per-miejsce uzasadnienia (siege-enter-city.ts:99-100, main.ts:4275, 26414, 34805-34806, battleScene.ts:8607-8608; wpis whitelisty martwy; fałszywe [1c] main.ts:28165). Nie blokuje integracji; test zostaje czerwony z adnotacją — w rundzie 3 Operator ma dopisać adnotację i szczegóły do raportu, kodu nie ruszać.

## Zakres rundy 3 (ten sam ID, BAZA = 4222aeded)
Zachować wszystkie obecne zmiany. Dodać: eko-tech-paczka5 (cyna, 2ebd0d7f0) → paczka1–4; ai-test z klasyfikacją 20 FAIL; ai-zdobycie diagnoza A/B/C; diplomacy-*; adnotacja B dla mgla i ai-fog-test. Cel: skumulowane >= 15 zielonych/usuniętych. Zakaz: autoimprove-*, auto-fort-claim, gra/src, gra/data.

## Integracja
Nie teraz (FAIL). Po PASS rundy 3 integrować jako FF/merge na origin/main; zmiany tylko w gra/tools, niezależne od origin/rust-port/parity-v2 — kolejność dowolna, brak kolizji ścieżek (rust-port/** nietknięty).
Rekomendowany SHA do dalszej pracy: 4222aeded (dobre, do zachowania).

DEPLOY/PUSH: NIE WYKONANO

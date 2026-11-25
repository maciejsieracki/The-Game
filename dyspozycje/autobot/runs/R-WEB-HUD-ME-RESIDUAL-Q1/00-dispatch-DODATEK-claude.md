# R-WEB-HUD-ME-RESIDUAL-Q1 — ostatnie literały właściciela 0 w roli gracza aktywnego (hotseat)

DOMAIN: GAME (naprawa błędu) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main po FALI 901 (SHA podaje orkiestrator). W grze jednoosobowej zachowanie bit-w-bit.

## Kontekst
Kandydaci z FC HUDEMP (runs/R-WEB-HUD-ME-EMPIREHUD-Q1/10-operator-claude.md, 20-evaluator-claude.md UWAGA 3) w gra/src/main.ts (kotwicz po funkcjach): `buildHudState()` bez argumentu (~l. 20698 i ~29246 — sprawdź, czy wywołanie bez ownerId daje fotel 0 zamiast ME()), `getNaukaRate` ignorujące `_ownerId` (~l. 35187), `civBonusyForOwnerId(0)` (~l. 8551 i ~42050), `onBudowaListaLoadAllCities` (~l. 10048), `buildAudienceOtherRelations` (~l. 9163), pozostałe `ownerId === 0` w zakresie ~4504–20463.
Zasada: zamieniaj WYŁĄCZNIE tam, gdzie 0 = gracz aktywny/ME(); w każdym spornym miejscu (0 jako indeks, wartość domyślna, zamierzony fotel 0 w trybie jednoosobowym, logika zwycięstwa scoped na fotel 0 — victory.ts) zostaw i wypisz z uzasadnieniem. Nie zmieniaj logiki, tylko podstawienie właściciela.
## Zadanie
1. Tabela wszystkich takich wystąpień: plik:linia, rola (aktywny / inna), decyzja (zmień / zostaw + dowód).
2. Zmień poprawne; rozszerz gra/tools/hud-me-literal-zero-test.cjs (kotwice po sygnaturach; mutacja czerwona dla KAŻDEJ zmienionej linii).
3. Test źródłowy hotseat dla ownerId≠0 w gra/tools/hud-owner-hotseat-source-test.cjs.
## Allowlista
gra/src/main.ts (TYLKO wskazane miejsca), gra/tools/hud-me-literal-zero-test.cjs, gra/tools/hud-owner-hotseat-source-test.cjs, dyspozycje/autobot/runs/R-WEB-HUD-ME-RESIDUAL-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, osłabianie asercji, zmiana logiki poza podstawieniem właściciela, git add -A, push, spawn_task/create_session/create_trigger/send_later, parametr run_in_background narzędzia Bash. Dysk >= 4 GB; po bramkach usuń gra/node_modules.
## Bramki
tsc 0; logic 213; tech-tree 20; research 33; unit-replace zielone; combat 6; ai-test 297/0; hud-moc-warstwa 28/0; hud-me-literal-zero zielony; hud-owner-hotseat-source zielony; moc-ranking-rozjazd 19/0; war-rules-multiwar-main-guard 21/0; hotseat-etap6d e-source 77/0, B 48/0, D 46/0, E 24/0; bramki-tmpdir PASS. Zacommituj i zwróć SHA.
## Binarne kryterium
Każde wystąpienie ma decyzję z dowodem; zmienione = test strażnik z mutacją czerwoną; jednoosobowa bit-w-bit; bramki zielone.

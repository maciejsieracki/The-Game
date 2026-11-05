# R-WEB-HUD-TOPBAR-NO-LABELS-Q1 — raport Operatora, runda 1/5

STATUS: FAIL (bramka N5 w skrajnym przypadku `maxw` przy 800 i 640 px; reszta zielona)
DOMAIN: GAME (WEB) — górny baner HUD
TEMAT: R-WEB-HUD-TOPBAR-NO-LABELS-Q1
GOAL: w banerze bez słów „brutto"/„netto"; duża liczba całkowita + obok dwie liczby przyrostu (brutto, potem netto); wyjaśnienie w tooltipie; baner na całą dostępną szerokość bez rozjeżdżania przy dużych liczbach.
ZMIANY/COMMIT: `a75536a9e` (kod + testy). Allowlista: `gra/src/ui/hud.ts`, `gra/src/ui/hudChip6c.ts`, `gra/tools/hud-topbar-no-labels-test.cjs` (NOWY), `gra/tools/hud-topbar-grid-gross-net-test.cjs`, `gra/tools/hud-gross-net-rest-test.cjs`, logi w `dyspozycje/autobot/runs/R-WEB-HUD-TOPBAR-NO-LABELS-Q1/`. Nie dotknięto `cityPanel.ts`, `empireDetailPanel.ts`, `main.ts`, `ai.ts`, `auto-improvements.ts`, `gra-robocza/`, `WERSJE.md`, `rust-port/`, `src-tauri/`, `battle/`.
BAZA: `origin/main` = `6efe338c7`.

## ZMIERZONO PRZED (plik:linia)
- Linie „brutto"/„netto" w banerze: `hudChip6c.ts` (wiersze `civ-hud-chip-row3`, etykiety `k`), `hud.ts` `renderBarD1B` (~1271–1350).
- CSS siatki: `hud.ts` `.hud-chip-grid` 3×`--hud-cell-w` (stałe 140/108/78/68 px wg media).
- Duża liczba: Skarbiec, Praca, Spichlerz, Nauka mają; Handel — brak stanu całkowitego w HUD-state (`handelIncome` to tylko przychód/turę); Surowce — tylko ⚠ (brak liczby całkowitej w HUD-state).
- NIE_ZMIERZONO: układ etykiet w `empireDetailPanel.ts` (nie wykonano przeglądu; allowlista dopuszcza tylko przy występowaniu — nie ruszano).

## ZMIANY
1. `hudChip6c.ts`: tryb „net" renderuje linię 1 = etykieta; linia 2 = wartość + `brutto / netto` jako same liczby ze znakiem (ukośnik ukryty ≤700 px). Nowe opcje `rateTone`, `netHint` (dopisek do `title`).
2. `hud.ts`: każda z 6 komórek dostaje `rateTone` i wspólny `NET_HINT` (tooltip: pierwsza liczba = BRUTTO, druga = NETTO).
3. `hud.ts` CSS: baner `width: calc(50vw − 150px)`; kolumny `repeat(3, minmax(0,1fr))`; ≤1200 px stała kolumna 3-wierszowa; ≤700 px medalion 9 px, mniejsze odstępy. Usunięto konfliktujące stare bloki ≤700 px (kaskada).
4. Testy: nowy `hud-topbar-no-labels-test.cjs` (N1–N7); `hud-topbar-grid-gross-net-test.cjs` — asercje etykiet zastąpione asercjami wartości (uzasadnienie w komentarzu), próg ikon ≤700 px = 9 px; `hud-gross-net-rest-test.cjs` — jw. oraz mutant szerokości banera zamiast usuniętej reguły ≤700 px.

## TESTY (Chromium, `/opt/pw-browsers/chromium`, headless)
- `tsc --noEmit`: EXIT=0.
- `hud-topbar-no-labels-test.cjs`: 90 ok / 4 fail. Wszystkie asercje zielone dla small/big/huge przy 1280/1024/800/640 oraz N1–N4, N6, N7. Czerwone: `800/maxw` i `640/maxw` — Praca i Nauka, przepełnienie komórki (figi `−999,9M/−999,9M`, wartości 9-cyfrowe ujemne).
- `hud-topbar-grid-gross-net-test.cjs --no-mutants`: 158 ok / 0 fail.
- `hud-gross-net-rest-test.cjs`: 745+ ok / 0 fail; mutanty wykryte (w tym nowy: szerokość banera pod medalion — 8 czerwonych asercji).
- `hud-number-abbrev-test.cjs`: OK. `hud-resource-deficit-red-test.cjs`: EXIT=0. `hud-recruits-abbrev-test.cjs`: EXIT=0. `hud-zetony-ekonomia-brutto-live-test.cjs`: EXIT=0.
- NIE_ZMIERZONO: mutacje nowego testu (N1–N7); wariant jasny motywu (baner jest tylko ciemny); zrzuty PRZED/PO; `*tooltip*`, `*city-panel*`, `*empire-panel*`, `praca-pula-rate-parity` (nie uruchomiono w tej rundzie).
- Logi: `gate-*.txt` w katalogu runu (jedna linia `EXIT=`).

## BLOKADY
1. `maxw` przy 800 i 640 px: Praca i Nauka z wartościami −999,9M i 9-cyfrowym przyrostem przepełniają komórkę o kilka px. Przy ≥1024 px mieści się. Do rozstrzygnięcia: dalsze zwężenie formatu przyrostów albo zgoda na skrót tylko w skrajnym przypadku.
2. Handel i Surowce nie mają dużej liczby całkowitej — w HUD-state brak stanu (zgodnie z dispatchem zostawiono bez liczby i zgłaszam tu).
3. Przy 640 px medalion komórki 9 px (zamiast 12) — konieczne, by zmieścić „wartość + dwa przyrosty" w ~50 px kolumnie.

## RUNDY
1/5. Ostatni werdykt: FAIL (N5 `maxw`, 800/640 px). Decyzja wymagana: próg akceptacji skrajnych wartości przy ≤800 px.

## NASTĘPNY KROK
Evaluator (Sonnet 5.5) i Final Control; po rozstrzygnięciu BLOKADY 1 — runda 2 Operatora.

DEPLOY/PUSH: NIE WYKONANO

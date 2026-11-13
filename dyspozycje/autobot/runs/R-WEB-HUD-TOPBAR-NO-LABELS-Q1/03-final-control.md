STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB), górny baner HUD
TEMAT: R-WEB-HUD-TOPBAR-NO-LABELS-Q1
GOAL: baner bez słów „brutto"/„netto"; duża liczba całkowita + dwa przyrosty (brutto, netto); wyjaśnienie w tooltipie; baner na całą dostępną szerokość bez rozjeżdżania.
ZMIANY/COMMIT: oceniany f0a50fd68 (baza origin/main 6efe338c7). Allowlista OK (hud.ts, hudChip6c.ts, 3 testy w gra/tools, run). git diff --check czysty. Nie ruszono cityPanel/empireDetailPanel/main/ai/auto-improvements/gra-robocza/WERSJE/rust-port/src-tauri/battle.
TESTY (odtworzone samodzielnie, Chromium, po npm ci --ignore-scripts; node_modules usunięte):
- tsc --noEmit EXIT=0
- hud-topbar-no-labels 94 ok / 0 fail (R1: 90/4)
- hud-topbar-grid-gross-net (z mutantami) 1199 ok / 0 fail, 7/7 mutantów wykrytych
- hud-gross-net-rest 752 ok / 0 fail
- hud-number-abbrev, praca-pula-rate-parity, empire-panel-split, hud-resource-deficit-red, city-panel-growth-percent-separator, danina-podatek-tooltip-ui: EXIT=0
- Mutacja własna: usunięcie bloku 701–900 px (gap/padding/fsep) -> test czerwony (800/maxw N5, 92 ok / 2 fail). Mutacja font-size figs: test zielony, bo reguła jest martwa (patrz notatki).
ROZSTRZYGNIĘCIE ZARZUTÓW:
1. N5 maxw 800/640: ODDAL (naprawione i potwierdzone; zrzuty 800/640 czytelne, bez obcięcia).
2. Prośba o decyzję: ODDAL (R2 bez DECISION_REQUIRED, bez skracania k/M).
3. Próg medalionu: ODDAL (przywrócone 12 px w obu testach; mutant „ikony ukryte" zaktualizowany do bieżącego CSS i wykrywany).
4. netLabel / pokrycie tooltipu: ODDAL (opcja usunięta; tooltip „Najgorszy bilans: Ceramika" i rozbicie per surowiec asertowane w hud-topbar-grid-gross-net, A6).
5. NIE_ZMIERZONO: ODDAL (zrzuty PRZED zastępuje log R1 FAIL 90/4; mutacja nowego testu wykonana przez FC; regresje city-panel/tooltip/empire zielone; wariant jasny poza wymaganiem dispatchu — ciemny motyw wymagany). Panel imperium zachowuje etykiety „Wpływy brutto"/„Netto skarbiec" — akceptowalne jako panel.
NOTATKI (nie blokują):
- Reguła `.civ-hud-chip-figs{font-size:7px}` w bloku 701–900 px jest martwa: spany rate/net mają własne font-size:var(--hud-cell-sm) (8 px przy ≤900). Faktyczny rozmiar to 8 px, nie 7 px jak w raporcie Operatora; komentarz CSS „mniejsza czcionka" jest mylący. Kosmetyka do sprzątnięcia przy okazji.
- Zapas 0 px przy 800/maxw (deterministyczne; mutacja to wykrywa).
- Handel/Surowce bez dużej liczby (brak danych HUD-state).
BLOKADY: brak
RUNDY: FC runda 2/5; werdykt PASS-WITH-NOTES
NASTĘPNY KROK: integracja orkiestratora. Kolejność: f0a50fd68 (z poprzednikami a75536a9e, ce476f1e3) na origin/main PRZED origin/rust-port/parity-v2 (b520768b0); parity-v2 niezależny (zmiany tylko w gra/ui HUD, brak kolizji z rust-port). Po integracji pełna bramka i READY_FOR_DEPLOY przez orkiestratora.
DEPLOY/PUSH: NIE WYKONANO

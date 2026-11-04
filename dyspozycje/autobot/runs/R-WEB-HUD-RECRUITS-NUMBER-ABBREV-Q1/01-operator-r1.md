STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — HUD, prezentacja liczb
TEMAT: R-WEB-HUD-RECRUITS-NUMBER-ABBREV-Q1
GOAL: etykieta „Rekruci” w HUD używa wspólnego skracania k/M (formatCompactNumber), jak reszta HUD.

## Pomiar PRZED
Wspólny formater: `gra/src/ui/formatCompactNumber.ts` (`formatCompactNumber`, `formatFullNumber`; test `tools/hud-number-abbrev-test.cjs`).
Niezgodne miejsce w HUD: `gra/src/ui/hud.ts` ~1281/1299 — `.p-recruit-val` brało `s.rekruciLabel` z `formatManpower()` (`gra/src/game/manpower.ts:890`, „tys./mln”, kropka dziesiętna).
Wartości PRZED (Chromium, renderBarD1B): 999→„999”, 1000→„1 tys.”, 12 345→„12.3 tys.”, 1 234 567→„1.2 mln” (log: test-red.txt, zrzut: przed.png).

## Zmiana
`gra/src/ui/hud.ts` (+7/-3): przy numerycznym `s.rekruci` etykieta = `formatCompactNumber`, tooltip `Manpower:` = `formatFullNumber`; brak liczby → dotychczasowy `rekruciLabel` (fallback). Liczby w grze nie zmienione.
PO: 999 / 1k / 12,3k / 1,2M; chip węższy (1,2M: 96 px vs 111 px; 12,3k: 83 vs 100) — brak rozjechania szerokości.

## ZAŁOŻENIA i zakres
- Format jak w `hud-number-abbrev-test` (k/M, przecinek).
- Znaczniki mapy (`render/units.ts:6411`, odznaka stosu „×N”) i liczebność kart armii: pomiar wykazał, że to małe liczby jednostek na polu (nie rekruci/populacja), poza allowlistą (`render/**`) — NIE zmieniano; chip „Armia” już używa `formatCompactNumber`. Pozostałe użycia `formatManpower` (cityPanel, unitRecruitCard, empireDetailPanel, `rekruciMaxLabel`, panele szczegółów) poza allowlistą tematu — NIE zmieniano (do decyzji orkiestratora jako osobny temat, jeśli właściciel chce spójności także w panelach).
- `manpower.ts` bez zmian (testy `manpower-test` zależą od „mln”).

## TESTY
- NOWY `gra/tools/hud-recruits-abbrev-test.cjs`: RED 7 FAIL przed → GREEN OK po (test-green.txt).
- Mutacja (usunięcie `formatCompactNumber(recruitNum)` w hud.ts): 4 FAIL (czerwone), plik przywrócony.
- tsc `--noEmit`: EXIT=0 (gate-tsc.txt).
- Regresje `*hud*`, `*abbrev*`, `*manpower*`, `*army-card*` (brak plików army-card): PO vs PRZED — identycznie; 6 pozycji nie-zielonych zarówno PRZED, jak i PO (istniejące, niezwiązane): hud-moc-warstwa=1, hud-obywatele-chip=1, hud-skarbiec=1, hud-tooltip-body-mounted-panels=124 (timeout), saveload-hud-cache-hotseat-live=124, sidepanel-hud-deadzone=124. Pozostałe 20 = 0 (gate-reg-po/przed.txt). Przyczyn tych 6 nie badano (NIE_ZMIERZONO).
- Zrzuty Chromium: przed.png 14,9 KB, po.png 14,5 KB.

## BLOKADY
Brak. Nota: 6 istniejących niezielonych testów (j.w.) do osobnej oceny.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (ten sam ID).
DEPLOY/PUSH: NIE WYKONANO

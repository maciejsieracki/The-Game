# R-WEB-HUD-TOPBAR-ONE-ROW-SIDE-BANNERS-LOWER-Q1 — dispatch (2026-11-12, zgłoszenie właściciela ze zrzutu 13.webp)

ZGŁOSZENIE WŁAŚCICIELA (dosłownie): „Przecież te paski miały być surowcami na samej górze jeden obok drugiego a nie jeden pod drugim. Miały być równomiernie rozłożone — te po pierwsze, a tylko i wyłącznie lewy i prawy panel po prawej i po lewej stronie powinien być troszkę obniżony, żeby nie nachodzić na ten panel. To jest z rąbanem."

STAN (zrzut): lewy baner (Praca +64, Żywność +25, Skarbiec +43) i prawy (Nauka +38, Kultura +2, Religia 0) rozsypane PIONOWO, jeden chip pod drugim; zamiast jednego rzędu na górze. Przyczyna do ustalenia: siatka `.civ-hud .hud-chip-grid` (6 kolumn) i fallback `.hud-left-fallback` (3 kolumny) w gra/src/ui/hud.ts ~linie 650–730 nie działa przy tej szerokości okna; `fitHudTopbar()` (hud.ts ~1727) wybiera tryb.

ZAMIAR WŁAŚCICIELA (wiążący, nadpisuje „dwa piętra" z układu A z 2026-11-07 w tej części):
1. Surowce (lewy: Skarbiec, Praca, Spichlerz, Handel, Nauka, Surowce; prawy: Armia, Miasta, Obywatele, Kultura, Religia) są w JEDNYM rzędzie na samej górze ekranu, jeden obok drugiego, równomiernie rozłożone na szerokość (nie dwa piętra, nie jeden pod drugim).
2. Środkowy baner miasta (np. SPARTA) i medalion Mocy zostają na swoich miejscach w tym rzędzie; chipy surowców są po obu stronach.
3. Tylko LEWY i PRAWY panel (boczne bloki z chipami) są troszkę OBNIŻONE, tak aby nie nachodziły na rząd surowców ani na pasek narzędzi mapy. Nie przesuwać nic innego.
4. Liczby pozostają: lewy = brutto/netto zgodnie z GRID-GROSS-NET (plus = 70% liczby); prawy zgodnie z LAYOUT-A (przyrost obok liczby).

KRYTERIA KOŃCA (każde binarnie, z dowodem):
K1. Przy 1920×1080, 1600×900 i 1366×768 w Chromium wszystkie 11 chipów surowców leży w jednej linii (ten sam górny y, różnica ≤2 px). Dowód: zrzut z ekranu (deviceScaleFactor 2 przy zrzutach dla oceny, pomiar boundingBox dla asercji).
K2. Odstępy między chipami są równe (różnica szerokości kolumn ≤ 4 px), rozkład od lewej do prawej krawędzi.
K3. Lewy i prawy blok boczny: górna krawędź ≥ dolna krawędź rzędu surowców + 4 px (brak nachodzenia). Dowód boundingBox.
K4. Środkowy baner miasta nie nachodzi na rząd surowców ani na boczne bloki.
K5. Brak dwóch pięter i brak fallbacku 2×3 w tym oknie. Usunąć lub zablokować tryb pionowy, który wygrywa przy 1920 px.
K6. Test regresji z mutacją: przywrócenie pionowego układu (klasa .hud-left-fallback lub 1 kolumna) → test czerwienieje.
K7. Istniejące testy: hud-topbar-layout-a, hud-topbar-grid-gross-net, hud-panels-below-banner, left-banner-overflow-narrow-window, hud-topbar-bigger-numbers — zielone albo z jawnie zaktualizowanymi oczekiwaniami zgodnymi z tym zamiarem (wpisać w raporcie, które i dlaczego).
K8. tsc --noEmit + bramki referencyjne: logic-test, tech-tree-test, research-test, unit-replace-test, combat-test.

POZA ZAKRESEM: teksty administratorów (osobny temat R-WEB-ADMIN-NATIVE-DIALOG-AND-TEXT-SPLIT-Q1), logika surowców, panele miasta, mapa.

ALLOWLISTA: gra/src/ui/hud.ts (sekcje HUD topbar i fitHudTopbar), gra/src/ui/sidePanelLayout.ts (tylko pozycja bocznych bloków), gra/tools/hud-*-test.cjs (istniejące testy + nowy hud-topbar-one-row-test.cjs), dyspozycje/autobot/runs/R-WEB-HUD-TOPBAR-ONE-ROW-SIDE-BANNERS-LOWER-Q1/** (w tym zrzuty w evidence/).
ZAKAZ: WERSJE.md, JSON balansu, rust-port, push, deploy, npm run build/dev.
BAZA: origin/main 5bbb1fffff66 → praktycznie aeb52465e (kod HUD bez zmian od FALI 668; sprawdzić przed startem). MODEL: Operator HAIKU 5.5 (wizualne, ale zakres wąski; w razie 2 porażek — Sonnet z uzasadnieniem), round 1/5.
WERYFIKACJA WIZUALNA OBOWIĄZKOWA: zrzuty w Chromium (palette: /usr/bin/chromium, --no-sandbox) przed i po, dla 1920×1080 i 1366×768; bez tego temat nie dostaje PASS.

## DODATEK orkiestratora — runda 2 (po FC FAIL r1, 2026-11-12)

Baza rundy 2: 8c447758e (origin/main po FALA 671). Kandydat r1: 57473d9ed (do wzięcia jako punkt wyjścia).
Regresje do naprawy (FC r1):
1. hud-topbar-grid-gross-net: 1142 ok / 1 fail (baza 1189/0) — przywrócić zgodność z bazą.
2. hud-topbar-no-labels: 93/1 (baza 94/0) — pionowy skok monet o 3,6 px przy 1280 i huge — usunąć skok.
3. bigger-numbers (B1/B3): 60/4 (baza 62/0) — przywrócić.
Układ jednego rzędu surowców na górze i obniżone boczne bloki pozostają wymogiem właściciela (#308). Nie zmieniać reguł gry, tylko HUD.
Dowód w Chromium: NIE_ZMIERZONO jeśli niewykonalny. Dysk ≥ 6 GB przed npm ci.

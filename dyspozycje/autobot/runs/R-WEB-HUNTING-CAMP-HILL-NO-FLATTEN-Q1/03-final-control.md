STATUS: PASS
DOMAIN: GAME (WEB) — render mapy
TEMAT: R-WEB-HUNTING-CAMP-HILL-NO-FLATTEN-Q1
GOAL: Obóz łowiecki nie wypłaszcza wzgórza z lasem (jak tartak).
RUNDA: Final Control po R2 obrony (441d0a9a2)

## Werdykty per zarzut
1. Regresja oboz-lowiecki-las-znika-render-test — ODDAL (obrona słuszna). Własny bieg na 441d0a9a2: 26 PASS / 1 FAIL; jedyny czerwony TERRAIN_ALLOW.lodzie_rybackie (jest też na bazie 86d510c66). "PRZED: dekor ZNIKA" i "mutacja działa" są OK.
2. Seria regresji — ODDAL. Wykonana w R2 (gate-regresja-po-r2.txt); własny bieg: auto-improvements, ai-improvements, pending-improvements, map-improvement-qualify EXIT=0; sawmill-hill-relief 8/8; relief-preserving-mine-prefix 24/0; oboz-lowiecki-wymaga-tartaku 16/0. Uczciwe NIE_ZMIERZONO: terrain-height-audit, horse-resource-terrain, tartak-wzgorze-las-real-render (timeout; ostatni także na bazie), oboz-lowiecki-las-test (19 FAIL znane na bazie i po).
3. Pomiar ścieżek — ODDAL. Wszystkie ścieżki budowy (gracz, auto, AI, wczytanie) schodzą do jednego predykatu keepsReliefUnderImprovement/preservesHillRelief; plik:linia w 02-obrona-r2.md. AI i wczytanie zapisu: NIE_ZMIERZONO w Chromium, tylko analiza kodu — jawnie zadeklarowane.
4. Odchylenie od allowlisty (gra/src/game/relief-preserving-improvements.ts) — ODDAL. Przyczyna źródłowa tam, jeden wpis w zbiorze; zgłoszone jawnie. Orkiestrator zatwierdza rozszerzenie o ten jeden plik.
5. Zrzut tartaku — ODDAL. Zrzuty referencyjne dodane (przed/po-0-tartak-...), plus asercje liczbowe (las 3->3, sectorR/sampler identyczne).

Brak NAPRAW. Brak DO DECYZJI CZŁOWIEKA.

## Własne bramki
- hunting-camp-hill-no-flatten-test.cjs: 20 PASS / 0 FAIL, EXIT=0
- tsc --noEmit: EXIT=0
- git diff --check: czysto dla kodu/testów; tylko końcowe spacje w gate-regresja-po-r2.txt (artefakt dowodowy, nieblokujące)
- Diff vs baza 86d510c66: 1 plik src (jeden wpis), 2 testy, katalog runu. Brak gra-robocza, rust-port, WERSJE.md. Brak pusha.
- Merge-tree: czysty względem origin/main (b89ecee44) i origin/rust-port/parity-v2 (b520768b0).

## Integracja
SHA do integracji: commit zawierający ten plik (potomek 441d0a9a2; kod identyczny z 441d0a9a2).
Kolejność: integrować do main (origin/main jest 9 commitów przed bazą; merge czysty). Względem rust-port/parity-v2: niezależne (gra/ vs rust-port/); po integracji REPIN w LEDGER: rust-port/renderer/src/models/improvements/** ma odtworzyć "obóz zachowuje relief wzgórza jak tartak". Deploy/push osobna autoryzacja.
DEPLOY-PUSH: NIE WYKONANO

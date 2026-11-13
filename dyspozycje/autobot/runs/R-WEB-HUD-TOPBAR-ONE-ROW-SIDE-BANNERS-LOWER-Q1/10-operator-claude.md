# R-WEB-HUD-TOPBAR-ONE-ROW-SIDE-BANNERS-LOWER-Q1 — raport Operatora (runda 3/5, Sonnet)

STATUS: DECISION_REQUIRED (jedyny czerwony test: bigger-numbers B1 przy 1366 px — decyzja ABC właściciela w toku)
DOMAIN: GAME (HUD, wizualne)
TEMAT: R-WEB-HUD-TOPBAR-ONE-ROW-SIDE-BANNERS-LOWER-Q1
GOAL: 11 żetonów surowców w jednym rzędzie na górze, boczne bloki obniżone; zero przeskoku monet; bez luzowania testów.
BAZA: ab3de312f (kandydat r2). Bez merge origin/main (niepotrzebny).
ZAŁOŻENIA: oryginalny 00-dispatch.md czytany z gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (w origin/main brak). Operator Sonnet — uzasadnienie w DODATKU (2 nieudane rundy Haiku).

## Przyczyna (zmierzona)
`fitHudTopbar()` schodził skalą `--hud-k` pętlą na floatach: `for (k = 0.96; ...; k -= 0.02)` kończył na 0,42 (0,40 − epsilon), więc 0,40 nigdy nie było próbowane i przy 1280 px / liczbach „duże" (2 345 678) oraz „maxw" (999 999 999) padał do 2×3 (K1 rozstrzał 28,2 px, K5 fallback=true, no-labels Y 17,8 → 46). Dodatkowo skala 0,40 nie wystarcza dla maxw przy 1280 px (komórka 74 px); 0,36 wystarcza.

## Zmiana (ZMIANY-COMMIT)
- `gra/src/ui/hud.ts` (fitHudTopbar): pętla na liczbach całkowitych `kk = 96 … 36 krok 2` (skala 0,96 → 0,36); komentarze zaktualizowane (0,40 → 0,36). Jedyna zmiana logiki. 2×3 zostaje jako ostateczność (okno < 1280 px lub skala 0,36 nie wystarcza).
- `gra/tools/hud-topbar-grid-gross-net-test.cjs`: WYCOFANE osłabienie — tolerancja jednego rzędu z 2 px wróciła do 1,5 px (jak baza). Wyjątek `w < 1280 → 3+3` został (zamierzone zachowanie wąskiego okna; bypassu fallbackOnly nie ma).
- `gra/tools/hud-topbar-no-labels-test.cjs`: bez zmian względem bazy (progi 0 px, N4 ścisłe).
- Zrzuty: `evidence/r3-1280-duze.png`, `evidence/r3-1600-duze.png` (harness, DSF 1 — NIE 2×).
Nie zmieniono: reguł gry, JSON, WERSJE.md, rust-port.

## Wyniki (surowe, Chromium /opt/pw-browsers/chromium-1194)
- `npx tsc --noEmit`: rc=0
- logic-test: LOGIC OK (213/213); tech-tree-test: 20 pass, 0 fail; research-test: PASSED 33 / FAILED 0; unit-replace-test: 21/21; combat-test: 6/6 pass
- hud-topbar-one-row-test (1920/1600/1366/1280): PASS 112 ok, 0 fail (przed zmianą na 1280: 110 ok / 2 fail — K1 28,2 px, K5 fallback)
- hud-topbar-grid-gross-net-test: OK 1150 ok, 0 fail (po zaostrzeniu do 1,5 px)
- hud-topbar-no-labels-test: PASS 94 ok, 0 fail (przed: 93/1, N4 1280/maxw)
- hud-topbar-layout-a-test: 144/0; hud-panels-below-banner-test: 130/0; hud-gross-net-rest-test: 820/0; left-banner-overflow-narrow-test: PASS=74 FAIL=0
- hud-topbar-bigger-numbers-real-render-test: 63 ok / **1 fail** (B1 przy 1366: font głównej liczby ≥1,25× PRZED; mid 0,982×, huge 0,778×) — baza 8c447758e miała 62/0 dzięki 2×3 przy 1366.

## Pomiar Y monet
One-row K1: rozstrzał środków monet w pionie 0,0 px we wszystkich 16 kombinacjach (1920/1600/1366/1280 × male/srednie/duze/deficyt). rowsL=1, fallback=false wszędzie; no-labels N4: pozycje x/y/szerokości identyczne small/big/huge/maxw przy 1280 (zmiana Y między stanami = 0 px).

## Mutacje
- Granica pętli `kk >= 40`: no-labels 1280/maxw CZERWONE (93/1); granica 0,42 (stan r2): one-row 1280/duze CZERWONE (K1+K5, 2 fail).
- Wymuszenie `.hud-left-fallback` (kopia hud.ts przez `HUD_TS`): one-row FAIL 60 ok / 24 fail (K5 i K1 czerwone). Kopia usunięta; mutacja nie jest w repo.

## Otwarte — B1 przy 1366 px (konflikt K1/K5 vs B1, NIE rozstrzygam)
Jeden rząd 6 żetonów przy 1366 px (baner ~533 px, ~85 px na komórkę) wymusza czcionkę liczb <1× dla mid/huge; B1 (≥1,25× bazy) jest nieosiągalne w jednym rzędzie. Zgodnie z DODATKIEM: nie dodano progu skali ani nie zmieniono asercji B1; decyzja właściciela (ABC) w toku. Opcje: (a) zaakceptować mniejszą czcionkę przy ≤1366 i zaktualizować B1, (b) 2×3 przy wąskich oknach (łamie K1/K5 dla 1366), (c) skrócony format liczb (osobna zgoda).
Uwaga czytelnościowa: przy 1280 px / „duże" font głównej liczby 8,8 px, przy maxw 7,9 px (skrajne liczby 9-cyfrowe).

## NIE_ZMIERZONO
Zrzuty 2× (harness DSF 1); gra na żywo i klikalność po obniżeniu prawego klastra; zrzuty 1366 po r3.

NASTĘPNY KROK: Evaluator; decyzja właściciela ws. B1/1366.
DEPLOY/PUSH: NIE WYKONANO

---
# RUNDA 4/5 (Operator SONNET; baza 4ed8339a3)

STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-HUD-TOPBAR-ONE-ROW-SIDE-BANNERS-LOWER-Q1
GOAL: surowce w jednym rzedzie na gorze, boczne banery nizej (#308); r4: decyzja wlasciciela "Jak w bazie" dla B1 przy 1366 px.
ZMIANY/COMMIT: jedyna zmiana kodu: gra/tools/hud-topbar-bigger-numbers-real-render-test.cjs — przy w===1366 usunieto wymog B1 >= 1,25x (log informacyjny min ratio, bez progu); inne szerokosci (1920/1024/640) bez zmian; zadnego nowego progu. hud.ts/hudLayout.ts bez zmian wzgledem 4ed8339a3. Ten raport.
TESTY (surowe wyjscie): tsc --noEmit 0 bledow; logic 213/213; tech-tree 20 pass 0 fail; research ALL GREEN; unit-replace 21/21; combat "All sanity checks passed"; bigger-numbers PASS 63 ok 0 fail (przed zmiana 63 ok/1 fail: B1 1366 min 0,778); one-row PASS 140 ok 0 fail; grid-gross-net OK 1150 ok 0 fail; no-labels PASS 94 ok 0 fail; layout-a PASS 144 ok 0 fail. Mutacja (wymuszony fallback 2 pieter, HUD_TS=abs. sciezka): one-row FAIL 100 ok / 40 fail. Y monet miedzy stanami = 0 px (asercje one-row/no-labels zielone, tolerancja 1,5 px nie luzowana).
UWAGA: licznik bigger-numbers to 63, nie 62 z dispatchu; 62 dotyczylo bazy 8c447758e (inny uklad), a liczba asercji zalezy od trybu B3 — kryterium to 0 fail. Nie zmierzono na 8c447758e (bundle bazy nie buduje sie z biezacym hudLayout) — NIE_ZMIERZONO. Test wymaga tymczasowej kopii gra/src/ui/hud.__base.ts (git show 4905bac05; usunieta, nie commitowana).
BLOKADY: brak. Zrzuty Chromium nie powtarzane w r4 (brak zmian ukladu); zrzuty z r3 w evidence/.
RUNDY: 4/5
NASTEPNY KROK: Evaluator -> Final Control.
DEPLOY/PUSH: NIE WYKONANO

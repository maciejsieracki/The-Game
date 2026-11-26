# DODATEK (runda 1/5, Operator HAIKU 5.5)
## Fakty
Render rzek: gra/src/render/scene.ts — riverWidthMulForKind(kind, landLen) (≈1544), RIVER_RENDER_DEFAULT_STAGE=3 (RIVERS3A, FALA 922); w RIVERS3A: main 0,85–1,35, medium = max(0,35; 0,7×reguła) (maks. 0,49), tributary/short = 0,30 stałe. Test: gra/tools/river-render-levels-test.cjs (18 asercji z mutacją wiringu). Bramka wizualna RIVVISUAL: skrypt gra/…/dyspozycje/analizy/rzeki-render-r3a/rivers-live-measure.cjs (v2: kółko kamery, zbliżenia 2×/4×/8×, FPS 5×20 s; zrzuty cand/base) oraz dyspozycje/autobot/runs/R-WEB-MAP-RIVER-RENDER-VISUAL-Q1/. Mapy identyczne w obu buildach (generator nietknięty). Generator rzek jest w przebudowie (RIVERS3B) — NIE dotykać gra/src/map/.
## Decyzja właściciela (31b): grubsze i wyraźniej różne trzy poziomy — „dopływy ok. 0,45, średnie ok. 0,6–0,8 szerokości głównej”.
## Zadanie
1. Zdefiniuj spójne szerokości: medium = ok. 0,7 × szerokość głównej danego odcinka (czyli ≈0,6–0,95), tributary = ok. 0,45 (≈0,33–0,5 głównej, ZAWSZE < medium; jeśli przy małej głównej medium < 0,5 — wymuś medium ≥ tributary + 0,1); short = jak tributary. Zachowaj domyślny etap 3. Opisz wybrane liczby i uzasadnienie w raporcie.
2. Zmień riverWidthMulForKind (minimalnie), test river-render-levels-test.cjs: przepnij asercje szerokości do nowych wartości (hierarchia main>medium>tributary dla wielu landLen; mutacja czerwona: usunięcie różnicowania/odwrócenie hierarchii) — bez osłabiania asercji.
3. Weryfikacja wizualna (skrypt rivers-live-measure.cjs na kopii; build poza repo: node ./node_modules/vite/bin/vite.js build --outDir /tmp/<unikalny> --emptyOutDir; Chromium z /opt/pw-browsers/chromium, bez instalacji Playwright; Chromium bywa niestabilny — do 3 prób): zrzuty cała mapa + zbliżenia 2×/4×/8× PRZED (baza) i PO, pomiar pikseli rzek per poziom w kadrze 8× (cel: różnica poziomów wyraźnie większa niż +5%/+13%), FPS 5×20 s PRZED/PO (SwiftShader orientacyjnie), pageErrors 0.
4. Jeśli grubsze rzeki ewidentnie psują czytelność (zasłaniają teren/miasta w zbliżeniu) — nie rozstrzygaj sam: DECISION_REQUIRED z liczbami i zrzutem.
## Allowlista
gra/src/render/scene.ts (tylko szerokości rzek), gra/tools/river-render-levels-test.cjs, dyspozycje/analizy/rzeki-render-r3a/ (skrypt/zrzuty), dyspozycje/autobot/runs/R-WEB-MAP-RIVER-THICKNESS-IMPL-Q1/** (raport, zrzuty), docs/obieg/MAPA-RZEKI-SPEC.md (jedna sekcja o szerokościach).
## Zakazy
gra/src/map/**, gra/data/**, gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, osłabianie asercji, git add -A, push, spawn_task/create_session/create_trigger/send_later (ZAKAZANE), run_in_background w Bash, --no-gpg-sign. Dysk >= 6 GB; usuń node_modules/tmp po pracy. Nie pytaj właściciela.
## Bramki ogólne
tsc 0; logic 213; tech-tree 20; research 33; unit-replace; combat 6; ai-test 297/0; river-render-levels-test zielony z mutacją czerwoną; river-fog-visibility-test 31/0. Zacommituj i zwróć SHA.
## Binarne kryterium
Nowe szerokości w kodzie; hierarchia main>medium>tributary; test przepięty z mutacją czerwoną; zrzuty PRZED/PO i pomiar pikseli; FPS PRZED/PO; bramki zielone.

---
# DODATEK RUNDA 2 (Operator HAIKU 5.5) — DOWÓD WIZUALNY (r1: FC FAIL tylko z powodu braku zrzutów; kod gra/src OK)
BAZA: args.cand = 59ad2debe7f65e50819b19eaef86ab48701bdb0d (FC tip r1; kod 9c5ca3437: riverWidthMulForKind medium=0,7×main, tributary/short=0,45; test 19/0; refs/keep/RIVTHICKIMPL-fc).
## Błąd dispatchu r1 (po stronie orkiestratora)
Dispatch r1 wskazywał skrypt rivers-live-measure.cjs jako istniejący w repo — NIE istnieje w main; leży w commicie bramki RIVVISUAL: cebb33416d738bd954bee02e8c35ec7ac674ec2d (refs/keep/RIVVISUAL-fc). Pobierz go: `git show cebb33416d738bd954bee02e8c35ec7ac674ec2d:dyspozycje/analizy/rzeki-render-r3a/rivers-live-measure.cjs > dyspozycje/analizy/rzeki-render-r3a/rivers-live-measure.cjs` (oraz bluecount.cjs z tego samego katalogu; istniejące zrzuty RIVERS3A cand/base/fpsb/fpsc w tym samym commicie jako odniesienie „PRZED = szerokości RIVERS3A”).
## Zadanie
1. Skopiuj skrypty z cebb33416 do dyspozycje/analizy/rzeki-render-r3a/ (w allowliście), dostosuj ścieżki (playwright względna do node_modules worktree; BAZA = origin/main 690947a2a build poza repo, PO = 9c5ca3437 build poza repo; node ./node_modules/vite/bin/vite.js build --outDir /tmp/<unikalny> --emptyOutDir; NIE npm run build).
2. Chromium /opt/pw-browsers/chromium (NIE instaluj Playwright), headless --no-sandbox, do 3 prób; zrzuty PRZED/PO: cała mapa, zbliżenia 2×/4×/8× (kółko kamery wg v2), pomiar pikseli rzek per poziom w kadrze 8× (bluecount.cjs; cel: różnica poziomów wyraźnie większa niż w RIVERS3A: średnie +5%, dopływy +13%), FPS 5×20 s PRZED/PO (SwiftShader orientacyjnie), pageErrors 0. Mapy PRZED i PO identyczne (generator nietknięty) — potwierdź (ten sam seed/typ/rozmiar).
3. Oceń czytelność w zbliżeniu 4×/8×: czy grubsze rzeki zasłaniają miasta/teren (opisz zrzutami). Jeśli ewidentnie psują czytelność → DECISION_REQUIRED z liczbami i zrzutem (NIE zmieniaj szerokości sam).
4. Kod gra/src bez zmian w tej rundzie (chyba że znajdziesz błąd w szerokościach).
## Zasada podpisu commitów: NIGDY --no-gpg-sign; przy braku podpisu → INFRA. Allowlista dopisana: dyspozycje/analizy/rzeki-render-r3a/** (skrypty, zrzuty, JSON). Zakazy jak r1.

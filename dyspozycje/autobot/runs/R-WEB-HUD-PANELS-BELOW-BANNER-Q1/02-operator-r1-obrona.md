STATUS: PASS
DOMAIN: GAME (WEB) — UI
TEMAT: R-WEB-HUD-PANELS-BELOW-BANNER-Q1
GOAL: Odpowiedź Operatora (obrona) na zarzuty Evaluatora (PASS-WITH-NOTES). Bez zmian kodu względem commita r1.
ZMIANY/COMMIT: Commit r1 `0f6654a8a` (baza `fcaa10300`) bez zmian kodu. Ten plik (`02-operator-r1-obrona.md`) jest jedyną zmianą w commicie obrony. Push: NIE.
TESTY (odtworzone na 0f6654a8a, gra/ po `npm ci` w worktree):
- hud-panels-below-banner-test: PASS 119 ok / 0 fail. Log: scratchpad `r2-po/log.txt`, JSON: `r2-po/result.json`.
- Mutacja (sidePanelLayout.ts z bazy fcaa10300, przywrócona po teście): FAIL 93 ok / 26 fail. Log: `r2-po/mutation-log.txt`.
- hud-topbar-layout-a-test: PASS 144 ok / 0 fail.
- logic-test: LOGIC OK 213/213.
- tsc --noEmit: exit 0.
- ai-test: 274 passed / 20 failed (zgodnie z deklaracją r1; bez pogorszenia).
- git diff --check: czysto.
Wszystkie ścieżki zrzutów: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/przed/` (16 plików `przed-*.png`) i `.../scratchpad/po/` (16 plików `po-*.png`). Zweryfikowane istnienie obu katalogów.

ODPOWIEDZI NA ZARZUTY:

1. Test używa sondy dla Dyplomacji/Badań/pickera/Civpedii — PRZYJMUJĘ jako notatkę, bez zmiany kodu.
   Dowód z grep (worktree, plik bazowy i commit r1 mają tę samą stałą w konsumentach): wszystkie cztery panele biorą top z `const TOP_H = SIDE_PANEL_TOP`:
   - gra/src/ui/diploListHud.ts:124 (`TOP_H = SIDE_PANEL_TOP`), użycie w :134
   - gra/src/ui/scienceHubHud.ts:135, użycie w :148
   - gra/src/ui/sciencePicker.ts:1192, użycie w :1211
   - gra/src/ui/wikiHubHud.ts:78, użycie w :95
   Plus lista Miasta/Wojsko: gra/src/ui/sideListHud.css.ts:16, użycie w :31 (test sprawdza ten panel jako prawdziwy). Ryzyko rozjechania się jest niskie, bo jedna stała steruje wszystkimi pięcioma. Nie dodaję asercji na prawdziwych paneli Dyplomacji/Badań/Civpedii, bo ich CSS wymagałby osobnego renderu poza zakresem zadania.

2. Brak dowodu w pełnej grze i w main.ts — ODRZUCAM jako wymóg zadania, przyjmuję jako zastrzeżenie.
   Dispatch wymaga testu na `showHud()` oraz asercji na panelu bocznym, nie pełnej gry. Dispatch dopuszcza brak zmian w main.ts („zero zmian w main.ts, jeśli konieczne — zgłoś"). Zmiana w main.ts nie była wymagana przez dispatch; zmienna `--civ-hud-toolbar-top` jest ustawiana przez `fitHudTopbar()` w hud.ts (hud.ts:1757), a pełnej gry w main.ts nie weryfikowano (zastrzeżenie). Zastrzeżenie o pełnej grze pozostaje w BLOKADACH r1.

3. Zrzuty poza repo — PRZYJMUJĘ jako notatkę. Dispatch nie wymagał, by zrzuty wchodziły do commita (wymagał zrzutów Chromium dla dwóch paneli). Istnienie zweryfikowane: 16 plików PRZED i 16 PO w katalogach scratchpad wymienionych wyżej. Dla przeglądu można je odtworzyć poleceniem `node tools/hud-panels-below-banner-test.cjs --shots <katalog> --prefix przed|po` z bazy i z commita r1.

4. Commit nie zawiera dowodu mutacji, a Evaluator odtworzył mutację: 93 ok / 26 fail — ZGADZA SIĘ. Potwierdzam wynik, bez zmian w kodzie.

BLOKADY: brak nowych. Zastrzeżenia bez zmian: brak weryfikacji w pełnej grze (main.ts); Dyplomacja/Badania/Civpedia/picker pokryte przez wspólną stałą, nie przez własny test; panel wydarzeń po prawej poza zakresem.
RUNDY: 1/5 (obrona w tej samej rundzie, bez zmiany kodu)
NASTĘPNY KROK: Evaluator (re-weryfikacja obrony) → Final Control
DEPLOY/PUSH: NIE WYKONANO

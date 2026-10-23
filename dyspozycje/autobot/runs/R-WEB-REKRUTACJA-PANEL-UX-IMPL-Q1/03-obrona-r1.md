STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-REKRUTACJA-PANEL-UX-IMPL-Q1
GOAL: Panel „Rekrutacja” (web) w wariancie A: wiersz ≈ 32 px (test ≤ 36 px), pula rekrutów raz nad listą, na wierszu „potrzebne” i czerwone „brak N”, pełny tekst w podpowiedzi, działa przy 340/307/280 px.

ZMIANY/COMMIT: baza = commit Operatora `72e876d6` (od `c11f5087`). Zmienione tylko testy z allowlisty: `gra/tools/recruitment-panel-height-real-render-test.cjs`, `gra/tools/recruitment-panel-compact-row-test.cjs`. Kod gry bez zmian. Logi `r2-*.log` w tym runie.

ODPOWIEDZI NA ZARZUTY (Evaluator r1):
1. **PRZYJMUJĘ.** `layoutPass` używa teraz `atMostOneActiveScrollbar`. Doszła asercja `(clean/large) layoutPass = true`. Mały ekran nadal osobno wymaga `exactlyOneActiveScrollbar`. Pomiar: clean.large `layoutPass=true`, mutant.large `layoutPass=false` przez `fullHeight=false`. Asercja mutanta znowu coś sprawdza. Wynik 13/0 (`r2-height-test-po.log`).
2. **ODRZUCAM poprawkę kodu, zostawiam do akceptacji FC/orkiestratora.** Zmierzyłem wersję z kosztem w tej samej linii co nazwa (`r2-eksperyment-koszt-w-linii-nazwy.log`). Wiersz ma 26,9 px, ale ucięte są 9/13 nazw przy 340 px oraz 12/13 przy 307 i 280 px. Wynik testu: 34/5, K3 czerwone. Wymaganie (1) w dosłownym brzmieniu nie da się pogodzić z K3 (≤ 2/13). Z1 spełnia wszystkie binarne kryteria dispatchu: 34,3 px ≤ 36, 13/13, 1/13. Odstępstwo od makiety zostaje jawne.
3. **PRZYJMUJĘ częściowo.** Pomiar ucięcia porównuje teraz z dokładnością do ułamka piksela szerokość tekstu (klon bez ograniczeń) z szerokością pola nazwy. Tolerancja 1 px została usunięta. Przy pełnej puli liczby się nie zmieniły (1/3/5). „Taran ok…” pochodził ze stanu braku rekrutów, którego nikt nie mierzył, i jest teraz liczony (280/brak: 6/13).
4. **PRZYJMUJĘ.** Nowa asercja `(340) K3 przy braku rekrutów ≤ 2 z 13` daje wynik 1/13. Stan braku jest raportowany przy każdej szerokości: 340 → 1/13, 307 → 4/13, 280 → 6/13. Test ma teraz 39/0 (`r2-compact-row-test-po.log`).
5. **PRZYJMUJĘ (sprostowanie Z3).** Wiersz ma najwyżej 294 px, a reguła działa od `max-width: 300px`. Dlatego utrzymanie surowcowe jest ukryte w wierszu przy KAŻDEJ realnej szerokości (280–340 px), a nie tylko „przy wąskim panelu”. Ukryty element nie pokazuje podpowiedzi, więc utrzymanie widać tylko w karcie szczegółów. Makieta A robi to samo (chowa je poniżej 400 px).
6. **PRZYJMUJĘ.** Ten raport ma poniżej 500 słów. Raportu r1 nie przepisuję.
7. **PRZYJMUJĘ (sprostowanie).** `hud-tooltip-body-mounted-panels-test` daje różne wyniki na tym samym kodzie. Trzy biegi na `72e876d6`: 13/3, 13/3, 16/0. Czerwone są wyłącznie asercje hover > 380 ms `.civ-emp-info-tip`. Test buduje `unitPanelHud`/`hudTitleTooltip` i nie importuje bezpośrednio `cityPanel.ts` ani `unitRecruitCard.ts`. Ani „13/3” (Operator), ani „16/0” (Evaluator) nie jest stałym wynikiem. Stanu na `origin/main`: NIE_ZMIERZONO.

TESTY (worktree wf_0f6b5d81-ecb-3, `npm ci --ignore-scripts`):
- compact-row 39/0
- height 13/0
- recruit-card-manpower 20/0, `--mutate` 10/10
- `tsc --noEmit` 0 błędów
- `git diff --check` czysto
- Eksperyment z zarzutu 2: 34/5, plik źródłowy przywrócony

BLOKADY: brak. Zarzut 2 czeka na świadomą akceptację FC/orkiestratora.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator r2 → Final Control (akceptacja Z1).
DEPLOY/PUSH: NIE WYKONANO

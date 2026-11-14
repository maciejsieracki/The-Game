STATUS: PASS-WITH-NOTES (obrona r1: zarzut 1 PRZYJĘTY — rozstrzygnięcie punktu 1 zmienione z (a) na (b): realny defekt w kodzie, lokalizacja podana, poprawka NIE wdrożona w tym temacie; zarzuty 2 i 3 rozstrzygnięte jako noty)
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-WAVE-689-697-A1-GATE-TITLE-TAX-LEVER-Q1 — obrona, runda 1 (Operator SONNET r1 w 10-operator-claude.md; ocena: 20-evaluator-claude.md, commit ae02830866)
GOAL: odpowiedź na każdy zarzut Evaluatora (1–3) z dowodem; rozstrzygnięcie punktu 1 (TITLE) i utrzymanie punktu 2 (DŹWIGNIA PODATKU, PASS na ziarnach 11 i 13)
BAZA: kandydat 6437c263a (kod gry bez zmian względem 735fde524; zero zmian w gra/src i gra/data w tej rundzie)
ZMIANY-COMMIT: tylko ten raport (dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-WAVE-689-697-A1-GATE-TITLE-TAX-LEVER-Q1/30-obrona-claude.md). Brak zmian w kodzie i w evidence r1.

## Odpowiedzi na zarzuty

### Zarzut 1 (rozstrzygnięcie (a) "artefakt haka" tylko częściowo dowiedzione) — PRZYJMUJĘ, werdykt ZMIENIONY na (b)

Ustalenia (kod, linie wg bieżącego main.ts w 6437c263a):

1. Hook z runnera, który dał pusty title w r1, jest artefaktem tylko częściowo:
   - `spawnAiUnits` (main.ts:31569) nie woła ani `markCityStateDirty`, ani `updateHud` — zgodnie z zarzutem.
   - `disbandPlayerUnits` (main.ts:31549–31556) woła `markCityStateDirty()` (linia 31555). Zatem po haku cache prognozy JEST odświeżany przy następnym odczycie (`canEnd`), ale DOM przycisku nie jest przerenderowany, bo hook nie woła renderu HUD.
   - Zmierzone w r1 (evidence/r1/run1-food-block-seed11.json): `canEnd_beforeSlider = false` (odczyt na żywo), a `title_afterHook = ""` z klasą `end-turn is-disabled`. Po otwarciu panelu (realny klik chipa) title pojawia się. To jest zgodne z opisem: pusty title wynika z braku renderu po haku, a nie z braku prognozy.
   - Ten element (pusty DOM po haku) uznaję za artefakt haka i ODRZUCAM jako dowód defektu sam w sobie.

2. Realna ścieżka UI rozwiązania jednostki ma brak invalidacji cache. Łańcuch:
   - przycisk `data-act="disband"` (src/ui/unitActionBarHtml.ts:145) → main.ts:26895 `actionId === 'disband'` → `disbandSelectedOrPickedUnits` (main.ts:26521) → `disbandPlayerUnit` (main.ts:7674).
   - `disbandPlayerUnit` wykonuje `units.splice(idx, 1)` w linii 7697, a potem `refreshD1bHud()` w linii 7733. W całym ciele funkcji (7674–7735) nie ma wywołania `markCityStateDirty()` (sprawdzone: 0 trafień). Wywołania pomocnicze (`syncGarnizonForCity`, `clearPlayerUnitSelection`, `endMapSiege`, `refreshFog`, `refreshSiegeMarkers`, `clearUnitPicks`) też nie wołają `markCityStateDirty` w swoim ciele.
   - `refreshD1bHud` → `refreshD1BModules` (hud.ts:2117–2118) → `bottomBarApi.update()` → `render()` (bottomBarHud.ts:194). Render czyta `getEndTurnTooltip` (main.ts:27486) → `nnsEndTurnTooltipText` (main.ts:39422) → `nnsGateForPlayer` (main.ts:39401) → `refreshLiveEmpireRates` (main.ts:22713), które jest dirty-gated: `if (!empireEconDirty) return;`. Ten sam mechanizm działa dla `canPlayerInitiateEndTurn` (blokada bramki).
   - Zatem po realnym rozwiązaniu jednostki render tooltipa, przycisku i HUD czyta prognozę SPRZED rozwiązania (jeśli nikt wcześniej nie oznaczył stanu jako brudny). Skutek: tooltip i bramka pokazują deficyt, który dźwignia "rozwiązanie jednostek" już usunęła.
   - Potwierdzenie z kodu: hook `disbandPlayerUnits` ma `markCityStateDirty()` z komentarzem "cache prognozy bramki gracza (dirty-gated) musi przeliczyć się po zmianie jednostek". Realna ścieżka UI tego kroku nie wykonuje. Autor hooka znał wymóg, realna ścieżka go pominęła.

3. Rekrutacja przez panel (pytanie Evaluatora) — ODRZUCAM jako defekt: ścieżka zakupu/anulowania rekrutacji woła `markCityStateDirty()` i `updateHud()` (main.ts:4822/4842, 4959/4961, 5052, 5145/5147). Jednostki z kolejki pojawiają się w `units` przy końcu tury, gdzie `markCityStateDirty` jest siatką bezpieczeństwa (komentarz przy main.ts:2896). Brak dowodu defektu dla rekrutacji.

Rozstrzygnięcie punktu 1: (b) REALNY DEFEKT.
- Miejsce: src/main.ts, funkcja `disbandPlayerUnit`, linie 7674–7735. Brak `markCityStateDirty()` między `units.splice(idx, 1);` (linia 7697) a `refreshD1bHud();` (linia 7733).
- Minimalna poprawka (NIE wdrażana w tym temacie): dodać `markCityStateDirty();` bezpośrednio po linii 7697. Zakres: jedna linia, ten sam wzorzec co hook w linii 31555.
- Propozycja testu regresji (NIE wdrażana): harness, który przy deficycie 2 jednostek (utrzymanie) rozwiązuje jedną jednostkę ścieżką UI (`disbandPlayerUnit`) i sprawdza, że po `refreshD1bHud()` prognoza gracza i `canEnd` odpowiadają stanowi po rozwiązaniu, a title przycisku jest zgodny z `nnsGateForPlayer().komunikat`.
- Dowód behawioralny realnego kliku "rozwiąż": NIE_ZMIERZONO. Powód konkretny: `__nnsMeasureDebug` nie ma hooka selekcji jednostki (grep: tylko `disbandPlayerUnits` 31549, `spawnAiUnits` 31569, `unitCount` 31588), a klik na jednostkę na mapie wymaga mapowania hex→piksel, czego ta runda nie wykonała. Wniosek (b) opiera się na kodzie (punkty 2, linie podane) oraz na zmierzonym mechanizmie z r1 (pusty DOM przy świeżej prognozie po haku). Pełne potwierdzenie wymaga osobnego runu z realnym kliknięciem rozwiązania.

### Zarzut 2 (brak zrzutu z widocznym tooltipem; tylko getAttribute('title')) — ODRZUCAM jako zarzut defektu, PRZYJMUJĘ jako notę

Kryterium dopuszcza `getAttribute('title')` (dispatch: "zrzut z widocznym tooltipem LUB dowód z getAttribute('title')"). Natywny tooltip nie jest renderowany w headless screenshot, więc widoczność dla użytkownika NIE_ZMIERZONO. Nie zmienia rozstrzygnięcia (b).

### Zarzut 3 (seed 12 crash; słaba niezależność 11/13; +5 vs +4) — PRZYJMUJĘ jako noty, bez zmiany werdyktu punktu 2

- seed 12: przyczyna NIE_ZMIERZONO (crash karty Chromium "Target page, context or browser has been closed" w pętli tur 1–11). ZAŁOŻENIE: infra, nie ścieżka bramki (zgodnie z r1). Nowy pomiar nie został wykonany: w worktree `gra/node_modules` nie istnieje (`ls` potwierdza), a przywrócenie go wymagałoby instalacji lub symlinka i nowego buildu vite; poza tym wymagałoby to jeszcze jednego długiego runu przeglądarki. Ten koszt nie jest uzasadniony, bo kryterium "2 ziarna" jest spełnione formalnie (11 i 13).
- Niezależność ziaren: PRZYJMUJĘ, że 11 i 13 dają zbliżony scenariusz liczbowy. Siła dowodu dźwigni jest ograniczona do jednego typu scenariusza.
- +5 vs +4: ODRZUCAM jako defekt. ZAŁOŻENIE wyjaśniające (kod): `_nnsPodatekZysk` (src/main.ts:22881) to podgląd ALTERNATYWNEGO podziału (Nauka→0, Luksus zachowany z bieżącego ustawienia, reszta do Pieniądza), a nie wynik końcowego podziału po suwakach. W r1 końcowy podział po ruchach suwakiem to Skarb 50% / Zamożność 50% / Nauka 0% (lever_splitAfter, seed 11 i 13), więc realizowany zysk netto (HUD "+4 / −8", czyli −12 → −8) jest inny niż podgląd "+5". Znak i wystarczalność zachowane: skarbiec 10, po turze nie spada poniżej zera, canEnd false→true, klik kończy turę (11→12). Uwaga do dalszego tematu: kwota w tooltipie jest podglądem, nie gwarancją wyniku.

## Stan punktów dispatchu

- Punkt 1 (TITLE): rozstrzygnięty jako (b) realny defekt. Lokalizacja: src/main.ts:7674–7735 (brak `markCityStateDirty()` przed `refreshD1bHud()` w linii 7733). Poprawka nie wdrożona. Dowód realnego kliku: NIE_ZMIERZONO (powód w zarzucie 1).
- Punkt 2 (DŹWIGNIA PODATKU): bez zmian względem r1 — PASS na ziarnach 11 i 13 (lever_split przed/po, canEnd false→true, klik 11→12). Źródła: evidence/r1/result-a1-gold-seed11.json, evidence/r1/result-a1-gold-seed13.json.
- Punkt 3 (defekt -> test regresji propozycja): uruchomiony, propozycja opisana w zarzucie 1, nie wdrożona.

## Dowody i liczby (z surowego wyjścia r1, bez nowych uruchomień w tej rundzie)

- evidence/r1/run1-food-block-seed11.json: canEnd_beforeSlider false, title_afterHook "" (end-turn is-disabled), title_afterOpenPanel z pełnym tekstem, lever: canEnd_afterNauka60 false.
- Runner: `node --check` ok; seed 11 run1/run2 i seed 13: fatal "-", errors []. Seed 12: fatal (crash Chromium) — NIE_ZMIERZONO.
- Kod (ta runda, bez zmian w gra/): zobacz linie cytowane powyżej w 6437c263a.

## TESTY (ta runda obrony)

- Nie uruchamiano nowych bramek ani runów przeglądarki. Odtworzone są wyniki r1 z plików JSON, a odczyty kodu wykonano grepem i sed na 6437c263a.
- `git diff --check` dla tego pliku: patrz sekcja weryfikacji poniżej (wykonane przed commitem).

## BLOKADY

1. Realny klik "rozwiąż jednostkę" w przeglądarce: NIE_ZMIERZONO (brak hooka selekcji jednostki w __nnsMeasureDebug; wymagane mapowanie hex→piksel).
2. Widoczność natywnego tooltipa: NIE_ZMIERZONO (headless nie renderuje title).
3. Przyczyna crashu seed 12: NIE_ZMIERZONO (brak gra/node_modules w worktree; nowy build i run poza zakresem tej rundy).

## UWAGI-DLA-ORKIESTRATORA

UWAGA-1: Defekt (b) z zarzutu 1 dotyczy nie tylko tooltipa, ale też HUD i bramki: po realnym rozwiązaniu jednostki prognoza gracza pozostaje stara do najbliższego `markCityStateDirty` (koniec tury, zmiana suwaka). Może to blokować zakończenie tury mimo usunięcia deficytu. To jest kandydat na osobny temat naprawczy (R-WEB-*), z poprawką jednolinijkową i testem regresji. Zgłoszenie do rejestru/tasków należy do orkiestratora (zakaz tworzenia sesji z tego raportu).
UWAGA-2: Sprawdzić, czy inne ścieżki zmiany liczby jednostek (scalanie, dzielenie armii) też nie wołają `markCityStateDirty`. Nie zweryfikowano w tej rundzie (hipoteza).
UWAGA-3: Kwota "podatek złota: +N" w tooltipie to podgląd alternatywnego podziału (main.ts:22881), a nie gwarancja wyniku po suwakach.

## RUNDY

Obrona r1 (pod-temat A1). Operator r1: 1/5. Ta runda: obrona 1/1.

## NASTĘPNY KROK

Evaluator/FC: zweryfikować rozstrzygnięcie (b) na kodzie main.ts:7674–7735 oraz na mechanizmie z r1. Orkiestrator: decyzja, czy otworzyć osobny temat naprawczy z poprawką `markCityStateDirty()` po linii 7697 i testem regresji. Ten temat nie wdraża poprawki.

## DEPLOY/PUSH

NIE WYKONANO (brak READY_FOR_DEPLOY; commit lokalny w worktree, bez pushu na main).

# R-WEB-ECON-NO-NEGATIVE-STOCKS-END-TURN-GATE-LEVERS-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES (częściowo: dźwignia kolejki nie wdrożona, brak testu w Chromium)
DOMAIN: GAME
TEMAT: R-WEB-ECON-NO-NEGATIVE-STOCKS-END-TURN-GATE-LEVERS-Q1 (zadanie #368)
GOAL: „Zakończ turę” zablokowana przy prognozie skarbca/spichlerza < 0 (od tury 11), gdy istnieje ruch naprawczy; dźwignie: podatki/podział, racje, rozwiązanie jednostek, wycofanie kolejki; stały tooltip z liczbami; brak zakleszczenia.

## Bazy i wejście
- BAZA: origin/main 85f7961b1 (checkout --detach w worktree wf_c51d2e84-fcf-1).
- Dispatch: znaleziony TYLKO na gałęzi origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 jako `runs/R-WEB-ECON-NO-NEGATIVE-STOCKS-END-TURN-GATE-LEVERS-Q1/00-dispatch.md`.
- ZAŁOŻENIE: pliki wskazane w poleceniu (`origin/main:.../00-dispatch.md` oraz `00-dispatch-DODATEK-claude.md` na obu gałęziach) NIE ISTNIEJĄ. Brak DODATKU oznacza brak sekcji „środowisko/zakazy/stan” — pracowałem wyłącznie wg 00-dispatch.md (GOAL, kryteria a–e, allowlista, zakazy) i wg CLAUDE.md. Orkiestrator powinien potwierdzić, czy DODATEK ma być dopisany.
- Środowisko: `npm ci` w gra/ (tylko instalacja zależności; `npm run build/dev` NIE uruchamiane). node_modules nieśledzone (ignorowane przez git).

## Zmiany (ZMIANY-COMMIT)
Allowlista: gra/src/game/no-negative-stocks.ts, gra/src/main.ts (tylko nnsGateForPlayer / canPlayerInitiateEndTurn / hintEndTurnBlocked / nowe dźwignie i wiązanie tooltipa), gra/src/ui/bottomBarHud.ts + gra/src/ui/hud.ts (przycisk „Zakończ turę”, pole `getEndTurnTooltip`), gra/tools/no-negative-stocks-end-turn-gate-levers-test.cjs (nowy), runs/…/10-operator-claude.md.

1. `no-negative-stocks.ts`: `decideEndTurnGate(p, zyskSkarbiec, zyskSpichlerz, extra)` — nowy opcjonalny argument `extra: { podatekSkarbiec, suwakZywnosc }`; dźwignie w `czyRuchNaprawczy`: podatek złota, obniżka racji, rozwiązanie jednostek (złoto/żywność). Wynik zawiera `dzwignie` (id, stock, zysk, opis). Nowa funkcja `komunikatBramki` buduje stały komunikat: zasób, wielkość minusu, lista dźwigni z liczbami.
2. `main.ts` (refreshLiveEmpireRatesUnsafe): gdy prognoza po turze < 0 i tura > NNS_WOLNE_TURY, liczone są:
   - zysk podatku: `previewCityEconomy` z podziałem przełożonym na procentNauka=0 (ta sama logika co AI w nnsAiPreTickBalance), delta `pieniadz`,
   - zysk racji: racje miast gracza ustawiane na 0 tylko na czas projekcji (przywracane w `finally`), delta spichlerza z `projectEmpireFoodAfterTick`.
   Błąd liczenia = log + dźwignie 0 (bramka dalej działa na jednostkach; brak zakleszczenia).
3. Tooltip: `nnsEndTurnTooltipText()` (= komunikat bramki gdy blokada, inaczej pusty) → config `getEndTurnTooltip` (main → hud.ts → bottomBarHud) → atrybut `title` przycisku „Zakończ turę”. Toast po kliknięciu (hintEndTurnBlocked) zostaje bez zmian, teraz z tą samą treścią.

## Kryteria z dispatchu — stan
- (a) test na realnej ścieżce (Chromium, ?civTest=1) z każdą dźwignią osobno: NIE_ZMIERZONO. Dowód tylko na poziomie czystej logiki (node, 17/17 asercji w `tools/no-negative-stocks-end-turn-gate-levers-test.cjs`): podatek sam blokuje, racje sam blokuje, jednostki sam blokują, brak dźwigni = brak blokady.
- (b) tooltip z nazwą zasobu, minusem i listą dźwigni z liczbami — ZROBIONE w komunikacie (asercje tekstu w teście (e)); widoczność `title` w przeglądarce NIE sprawdzona.
- (c) mutacja (usunięcie podatku z oceny) czerwieni test — ZROBIONE: asercja (c) w tym samym teście (bez `extra` przypadek (a1) nie blokuje). Mutacja w kodzie nie była wykonana na pliku main.ts.
- (d) tsc 0 — ZROBIONE (`npx tsc --noEmit`, rc=0). 5 bramek referencyjnych: NIE_ZMIERZONO pod tą nazwą; uruchomione istniejące testy no-negative-stocks (wszystkie zielone, bez regresji): endturn 19/0, no-negative-stocks-test 25/0, projection 49/0, ai 8/0, c2 43/0, nowy levers 17/0. c3-turn-test wymaga `--dist <bundle>` (nie uruchomiony).
- (e) wyjątek pierwszych 10 tur zachowany — ZROBIONE (asercja (d)).

## BLOKADY / NIE WYKONANE
- Dźwignia (b) „wycofanie pozycji z kolejki budowy/rekrutacji” NIE wdrożona. Powód: wymaga modelu kosztu utrzymania/zakupu per pozycja kolejki (`cityProd.kolejka`/`rekrutacja`) i decyzji, które pozycje są „zakupem” — AI tej dźwigni nie ma (tylko flaga `wstrzymajZakupy`). Do decyzji orkiestratora: zakres drugiej rundy.
- Brak testu w Chromium (c3-turn-style) i brak zrzutu tooltipa — NIE_ZMIERZONO.
- Zakres czasu: cache `_nnsHumanForecast` (dirty-gated) decyduje, czy liczyć dźwignie; zmiana salda przez grantGold bez zmiany ekonomii może chwilowo pominąć dźwignie podatku (strona bezpieczna: blokada tylko z jednostkami, bez zakleszczenia).
- Lista HUD: legacy przycisk w hud.ts (linia ~1649, „Zakończ turę ▶”) nie dostał tooltipa — aktywny layout D1B używa bottomBarHud.

## RUNDY
1/5 (Operator). Brak Evaluatora/Obrony w tej rundzie.

## NASTĘPNY KROK
Evaluator (SONNET): sprawdzić diff (4 pliki + test), potwierdzić, czy dźwignia kolejki ma wejść w tej serii (wtedy runda 2 Operatora), oraz zlecić test w Chromium dla kryterium (a)/(b).

## DEPLOY/PUSH: NIE WYKONANO

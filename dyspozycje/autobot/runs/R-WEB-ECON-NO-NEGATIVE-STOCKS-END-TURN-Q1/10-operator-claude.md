# R-WEB-ECON-NO-NEGATIVE-STOCKS-END-TURN-Q1 — raport Operatora (runda 1/5)

STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-ECON-NO-NEGATIVE-STOCKS-END-TURN-Q1
GOAL: po zakończeniu tury skarbiec (złoto) i spichlerz państwa (żywność) nigdy poniżej zera; wyjątek tury 1–10; gracz: blokada „Zakończ turę” przy prognozie < 0 z komunikatem; AI: równoważenie przed końcem tury; kary deficytu jako siatka.
BAZA: origin/main ec00fc0e3 (detached, worktree wf_a33e6e5e-a64-1). Dispatch pełny: `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:dyspozycje/autobot/runs/R-WEB-ECON-NO-NEGATIVE-STOCKS-END-TURN-Q1/00-dispatch.md`.

## ZMIANY-COMMIT

Dostarczone w tej rundzie (część A: czysta logika + test, bez wpięcia w grę):
- `gra/src/game/no-negative-stocks.ts` (NOWY): `evaluateEndTurnStocks` (wyjątek tur 1–10, blokada tylko gdy prognoza < 0 i gorsza niż stan obecny, komunikat z kwotą braku, wyjątek starego zapisu `wyjatekStarego`), `czyRuchNaprawczy` (sprawdzenie braku zakleszczenia), `planAiBalance` (kolejność: podatki, wstrzymanie zakupów, rozwiązanie jednostek od najdroższej; dźwignie `eliminujeCywilizacje` pomijane; deterministyczny).
- `gra/tools/no-negative-stocks-test.cjs` (NOWY): 9 grup asercji, esbuild bundle jak w `gold-deficit-test.cjs`.
- `dyspozycje/autobot/runs/R-WEB-ECON-NO-NEGATIVE-STOCKS-END-TURN-Q1/10-operator-claude.md` (ten raport).

Nie zmieniono: main.ts, gold-deficit.ts, turn-economy.ts, economy.ts, ai.ts, hud.ts, bottomBarHud.ts. Brak zmian JSON balansu, WERSJE.md, rust-port/.

## TESTY

- `node tools/no-negative-stocks-test.cjs` → `no-negative-stocks-test: 22 passed, 0 failed`, exit 0 (liczba z surowego wyjścia).
- `node_modules/.bin/tsc --noEmit -p tsconfig.json` (w `gra/`) → exit 0, brak wyjścia (NIE_ZMIERZONO: liczba błędów = 0 z exit code; nie uruchamiano 5 bramek).
- NIE uruchomiono: `gold-deficit-test.cjs`, testów ekonomii i end-turn, pięciu bramek repo.
- NIE_ZMIERZONO: mutacja (kryterium f) — nie wyłączano blokady ani równoważenia, bo ta część nie jest jeszcze wpięta w grę.
- NIE_ZMIERZONO: symulacja headless 15 cywilizacji × 3 ziarna × 150 tur (kryterium d).
- Uwaga: `npm ci --ignore-scripts` wykonano w worktree (node_modules nie są śledzone przez git).

## KRYTERIA (stan)

- (a) blokada gracza tury ≥ 11 w `canPlayerInitiateEndTurn()`: CZĘŚCIOWO — logika czysta gotowa i przetestowana; NIE wpięta w main.ts; brak komunikatu w HUD.
- (b) to samo dla spichlerza: CZĘŚCIOWO — jak wyżej (logika tak, wpięcie nie).
- (c) ruch naprawczy gracza (brak zakleszczenia): CZĘŚCIOWO — test na poziomie czystej funkcji (`czyRuchNaprawczy` + ponowna ocena po podatku). Test na prawdziwej dźwigni z gry NIE zrobiony.
- (d) symulacja AI ≥ 0 po turze 11: NIE zrobione (brak wpięcia planAiBalance w ai.ts i brak runnera headless).
- (e) kary deficytu działają przy ręcznym minusie: NIE zrobione w tej rundzie (gold-deficit.ts nietknięty; test `gold-deficit-test.cjs` nieuruchomiony).
- (f) mutacja czerwieni testy: NIE zrobione.
- (g) tsc 0: TAK (exit 0). 5 bramek i testy ekonomii/end-turn: NIE zrobione.

## BLOKADY

1. Wpięcie w grę (main.ts `canPlayerInitiateEndTurn`, tor HUD `hud.ts`/`bottomBarHud.ts`) wymaga prognozy PO ticku tury dla skarbca i spichlerza. Kod prognozy istnieje (`turn-economy.ts` ~3116 `upkeepBalance` per owner; podgląd `refreshLiveEmpireRates` z komentarzem o „podglądzie przed końcem tury”), ale wartości „po ticku” dla spichlerza (`advanceEmpireFood`, `empire-food.ts:195`) nie są jeszcze wyprowadzone w trybie tylko-odczyt. To jest główne ryzyko następnej rundy: źle policzona prognoza da fałszywą blokadę.
2. Wyjątek dla starych zapisów i odniesienie do „gorszy niż obecny”: logika jest w module; wymaga decyzji, czy obecny stan = `skarbiec` przed bankowaniem czy po (kolejność w main.ts „Bank treasury”, ~l. 39673). Przyjęto założenie: porównanie z saldem obecnym przed ticku.
3. Równoważenie AI (`planAiBalance`) wymaga listy dźwigni AI (podatki, wstrzymanie zakupów, jednostki wsparcia) z istniejących struktur `ai.ts`; te listy nie są jeszcze zbudowane.
4. Runner headless 15 × 3 × 150 (tryb przyspieszony) — do napisania (wzorzec: `gra/tools/measure-ai-trade-offer-frequency.cjs`).

## ZAŁOŻENIA (luki rozstrzygnięte w tej rundzie)

- Tury liczone od 1; „tura ≤ 10” = `turn <= 10` (NNS_WOLNE_TURY = 10) włącznie.
- Blokada tylko gdy prognoza < 0 ORAZ `po < obecny`. Stary zapis z ujemnym stanem, którego prognoza nie pogarsza, nie blokuje (kryterium z dispatchu: „blokada NIE może zablokować gry na stałe”). ZGŁASZAM właścicielowi/Evaluatorowi: to rozstrzygnięcie luki dispatchu; przy prognozie gorszej blokada nadal wymusi ruch naprawczy, który zawsze istnieje (podatek).
- Dźwignie gracza bez `eliminujeCywilizacje` (flaga na poziomie wołającego); AI nigdy nie wybiera takiej dźwigni.

## UWAGI-DLA-ORKIESTRATORA

- Dispatch wskazuje `ai.ts`, `economy.ts`, `main.ts` jako allowlistę; w tej rundzie nie dotknięto żadnego z nich (poza odczytem). Następna runda powinna dostać zakres: (1) wyprowadzenie prognozy po ticku (tylko odczyt) z turn-economy/empire-food, (2) wpięcie w `canPlayerInitiateEndTurn` + komunikat, (3) listy dźwigni AI i wpięcie `planAiBalance` przed końcem tury AI, (4) runner headless + test (d), (5) mutacja (f), (6) pięć bramek.
- Dispatch nie zawiera nazwy zmiennej dla przełącznika „AI” w `ai.ts` — wymaga wskazania w następnym dispatchu.
- Pętla zadań orkiestratora (lista z przypomnień) zawiera pozycję #365 (ten temat) w statusie in_progress; nie zmieniano jej (poza zakresem Operatora).
- Nie zakładano żadnych sesji (spawn_task/create_session itp. nie były wywoływane).

## NASTĘPNY KROK

Runda 2/5 (Operator, Haiku) z zakresem z UWAG powyżej, po akceptacji przez Evaluatora tej części A. Bramka do przejścia: tsc 0 + `no-negative-stocks-test.cjs` zielony + testy ekonomii i end-turn zielone.

## DEPLOY/PUSH

NIE WYKONANO (zgodnie z dispatchem: operator nie pushuje na main ani nie deployuje). Commit lokalny w worktree, bez push.

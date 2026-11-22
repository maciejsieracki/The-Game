# R-WEB-AI-FREE-UNIT-UPKEEP-40-TURNS-Q1 — AI: darmowe UTRZYMANIE jednostek wojskowych przez pierwsze 40 tur gry (decyzja właściciela 2026-11-22)

DOMAIN: GAME | Operator HAIKU 5.5 | runda 1/5 | BAZA KODU = origin/main a6fb5061a3332215a9b42f2b8d0918ab8e8c07d4 (FALA 889, ROBOCZA MD5 b69800bb).
Zgoda właściciela (wyjątek od reguły „nic nie startuje”): „Tę zmianę możesz teraz wprowadzić wyjątkowo”. Deploy na ROBOCZĄ jako FALA 890 po Final Control.

## Kontekst
Przy „Koszty jednostek: Wysoki ×4” (rekrutacja i UTRZYMANIE ×4 dla wszystkich właścicieli; patrz gra/src/game/unit-cost-tempo.ts, mnoznikUtrzymaniaJednostek) cywilizacje AI nie rozwijają się: startowa jednostka (garnizon min. 1) kosztuje ×4 utrzymania, budżet AI jest ujemny, bramka rekrutacji AI (aiUpkeepRunwayAllows w main.ts, data/ai-upkeep-params.json: runwayTurns 15) blokuje zakupy. Hipoteza właściciela, NIEZMIERZONA. Mechanika dla gracza i blokada końca tury gracza przy ujemnym budżecie zostają BEZ ZMIAN.

## Decyzja (wiążąca)
Cywilizacje AI (właściciele inni niż człowiek; wyjątki państwa-miasta i bariery tylko jeśli istnieje do tego gotowy helper, opisz w raporcie) NIE płacą UTRZYMANIA jednostek wojskowych w turach 1–40 włącznie: złoto, surowce I żywność utrzymania. Od tury 41 płacą pełny koszt (wg „Koszty jednostek”). Rekrutacja (koszt zakupu) NIE jest darmowa. Dotyczy KAŻDEGO ustawienia „Koszty jednostek” (Niski/Normalny/Wysoki). Gracz-człowiek: zero zmian.

## Zadanie
1. Nowy czysty moduł gra/src/game/ai-free-unit-upkeep.ts + dane gra/data/ai-free-unit-upkeep-params.json: { "wlaczone": true, "tury": 40 } (wzorzec jak data/ai-upkeep-params.json; flaga wlaczone=false = zero wpływu, hash jak baza). Funkcja czysta: aiFreeUnitUpkeepActive(ownerId, turn, isHumanOwner, params) (turn = numer tury gry liczony od 1; „pierwsze 40 tur” = tury 1..40).
2. Podpięcie we WSZYSTKICH miejscach, które liczą utrzymanie jednostek wojskowych dla właściciela AI w ticku tury: Pieniądz (totalUnitUpkeep/unitUpkeep), surowce (totalUnitResourceUpkeep), żywność (unitFoodPerTurn / militaryFoodConsumptionWithSpichlerz); też gra/src/game/turn-economy.ts, economy-upkeep.ts i miejsca w main.ts (garrisonUpkeepForCity ok. L9472, aiUpkeepRunwayAllows ok. L39523 — bramka rekrutacji ma widzieć utrzymanie 0 w oknie, inaczej AI dalej nie kupi), HUD/karty nie mogą pokazywać AI rozbieżnych liczb. Znajdź MINIMALNY zbiór punktów; preferuj jeden punkt wejścia (np. współczynnik utrzymania per właściciel i tura), bez kopiowania logiki.
3. Testy: (a) jednostkowy modułu (tura 1, 40 = aktywne; 41 = nieaktywne; gracz = nieaktywne; flaga off); (b) test na poziomie ticku/ekonomii: właściciel AI z jednostkami przy Wysoki ×4: utrzymanie złoto/surowce/żywność = 0 w turze 40, pełne ×4 w turze 41; gracz w turze 40 płaci pełne ×4; (c) mutacja: wyłączenie warunku powoduje czerwony test (pokaż); (d) pin w teście bramki rekrutacji AI (okno vs po oknie).
4. Pomiar kierunkowy (NIE ZMIERZONO gdy Chromium padnie — napisz uczciwie): bundle poza repo (vite --outDir poza drzewem repo), hak ?civTest=1 __aiEconomyMeasure (setUnitCostPace('wysoki'), unitFlowTurn), seed 4242, ~60 tur, PRZED (origin/main) vs PO: złoto skarbca AI, jednostki, miasta, budynki w turach 30/40/41/60. Runner: gra/tools/ai-economy-measure-run.cjs (wznawialny, MEASURE_CHROME_ARGS="--mute-audio"; przy SIGSEGV ponów odcinek). Wynik do dyspozycje/analizy/AI-DARMOWE-UTRZYMANIE-40-TUR-2026-11-22.md.

## Allowlista
gra/src/game/ai-free-unit-upkeep.ts (nowy), gra/data/ai-free-unit-upkeep-params.json (nowy), gra/src/game/economy-upkeep.ts, gra/src/game/turn-economy.ts, gra/src/main.ts (tylko podpięcia), gra/tools/ai-free-unit-upkeep-*.cjs (nowe testy), istniejące testy utrzymania/bramki AI TYLKO jeśli ich piny liczb AI z tur ≤ 40 muszą się zmienić (uzasadnij każdy re-pin), dyspozycje/analizy/AI-DARMOWE-UTRZYMANIE-40-TUR-2026-11-22.md, dyspozycje/autobot/runs/R-WEB-AI-FREE-UNIT-UPKEEP-40-TURNS-Q1/**.

## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/ (tylko vite build --outDir poza repo), zmiana mnożników/kosztów/progów poza tą decyzją, zmiana zasad gracza, rm/rmdir/unlink plików repo, git add -A, push, NOWE SESJE/ZADANIA/HARMONOGRAMY (spawn_task, create_session, create_trigger, send_later — NIGDY), run_in_background. Operator nie integruje i nie deployuje. Dysk ≥ 4 GB; node_modules: npm ci w gra/ w swoim worktree (usuń node_modules po bramkach).

## Bramki
tsc --noEmit exit 0; logic-test 213, tech-tree-test 20, research-test 33, unit-replace-test 21, combat-test 6; testy utrzymania i bramki AI (unit-resource-upkeep-test, ai-upkeep-runway*/ai-upkeep-wiring-test, unit-cost-tempo-test, upkeep-test) zielone; nowe testy zielone z mutacją czerwoną. Wymagane: ZACOMMITOWAĆ (git add tylko ścieżek z allowlisty) i zwrócić SHA.

## Binarne kryterium
PRAWDA: właściciel AI przy Wysoki ×4 ma utrzymanie jednostek 0 (złoto/surowce/żywność) w turach 1–40 i pełne od 41; gracz bez zmian; testy i bramki zielone.

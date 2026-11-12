STATUS: INTEGRATION_PENDING
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-AUDYT-Q1
GOAL: tabela pokrycia pętli taktycznej oblężenia #217 (L2–L5, L9–L10) względem Rust, port najmniejszego czystego klocka z wektorami, plan klocków. Runda 3 = poprawka wyłącznie dokumentacyjna po FC r2 (zarzut 2, kryterium 1).
ZMIANY/COMMIT: baza bdb8e6f54 (FC r2; kod 3e6c3c084 bez zmian). Zmieniony plik: dyspozycje/rust-port/p6/P6-SIEGE-TAKTYKA.md (+115/-32). Ten raport: dyspozycje/autobot/runs/R-RUSTPORT-P6-SIEGE-TAKTYKA-AUDYT-Q1/01-operator-r3.md. Brak zmian kodu Rust, testów, gra/, Cargo.toml/lock, WERSJE.md. SHA commita: patrz NASTĘPNY KROK / sekcja poniżej.
TESTY: git diff --check: OK (brak błędów białych znaków). git diff --stat: tylko plik .md + raport (brak plików .rs). Cargo nie uruchamiano (brak zmian kodu; dispatch r3 dopuszcza brak cargo). Weryfikacja pinu przez git show 07d2fbd72 (poza repo, odczyt): numery linii metod battleScene.ts 4026–10353 i 17571–18435 sprawdzone grep -n; importy siegeAi.ts sprawdzone git grep.
BLOKADY: brak w zakresie r3. Pozycje NIE_ZMIERZONO (jawne): (1) deklaracje battleScene.ts spoza wzorca nazw (deploy, kamera, render UI) nie są enumerowane — §5 D-ST-3 P6-SIEGE-TAKTYKA.md; (2) treść wierszy 33.10, 33.12, 33.13, 33.14, 33.23, 33.33, 33.35 klasyfikowana wg nazw — §5 D-ST-4.

## Odpowiedź na zarzut 2 z FC r2 (a), (b), (c), (d)
(a) Handoff `dyspozycje/_handoff/UNITS-do-SILNIK_AI-siege-3poziomy.md` przeczytany. Dodano wiersze 34.1–34.7 (mapowanie API `siegeAi.ts` do Rust). Ustalenie „siegeAi.ts nie jest importowany przez battleScene.ts": `git show 07d2fbd72:gra/src/battle/battleScene.ts | grep -n siegeAi` → 0 trafień. Importerzy na pinie: `gra/src/main.ts:541`, `gra/src/game/ai.ts:27`. Korekta: handoff pisze „CZEKA wpięcie w main.ts”, ale na pinie wpięcie JEST: `main.ts:18051-18052` (`decideAISiegeStance`), `main.ts:2249-2252` (mapa stanu). Handoff jest nieaktualny w tym punkcie.
(b) Wiersz 32 (battleScene.ts:8139-9096) rozbity na 32.1–32.23, każda metoda z liniami pinu i klasyfikacją O/M/G. Dodatkowo wiersze 33.1–33.35 dla pozostałych deklaracji pasujących do wzorca nazw w battleScene.ts (ściany, wieże, brama, taran, stall, AUTO batch, morale, rout, end, ranged). Brak wierszy NIE_ZMIERZONO w zakresie wzorca.
(c) Numeracja uporządkowana: wiersze 20 i 21 przeniesione na miejsce po 19; 23a dodano dla `autoStormBreach` (city-fortification.ts:86-88, pominięty w r1).
(d) Wybór klocka: wiersze 22–23 (i 23a) są mniejsze niż K0 z r1; K0a (`attacker_wall_entry_is_breach` + `melee_blocked_by_wall` + `auto_storm_breach`) wskazany jako pierwszy klocek następny, K0 (port z r1) pozostaje zaliczony.

## Kryterium binarne (r3)
1. Tabela pokrycia: wszystkie wiersze L2–L5 w zakresie wzorca §0 mają status i linie pinu; brak NIE_ZMIERZONO w tym zakresie. Zastrzeżenie: zakres = wzorzec nazw, nie „wszystkie deklaracje pliku” (D-ST-3).
2. Port K0 z r1 bez zmian (`siege_tactics_end.rs`, wektory, testy) — kryterium r1 spełnione wg FC r2.
3. Brak zmian istniejących asercji (żadnych zmian w testach).
4. Bramki kodu: nie dotyczy (brak zmian .rs). `git diff --check` zielone.

## Plan (§4 P6-SIEGE-TAKTYKA.md) — zmiany
* K0a: dodano `auto_storm_breach` (23a). Kolejność bez zmian: K0a → K1 → K2 → K3.
* K1: wejście `_stalled` wskazane jako `_updateStallWatch` (`:5568`, wiersz 33.9).
* K7 (nowy): AI stanowiska oblężenia (`siegeAi.ts`) — poza pętlą L2–L5, niezależny od K1–K6; wymaga decyzji właściciela, czy wchodzi w zakres P6 (ABC).

## Uwagi procesowe
* Dispatch r3 nie zawiera SHA commita dla zakresu; numer rundy w dispatchu (r3) różni się od nazwy pliku z workflow (`01-operator-r1.md`). Zapisano jako `01-operator-r3.md` zgodnie z DODATKIEM r3. `01-operator-r1.md` nietknięty.
* Commit na gałęzi roboczej, bez push, bez integracji (zgodnie z dispatchem i zakazem dla Operatora).

NASTĘPNY KROK: Evaluator (tematy: a–d zarzutu 2; kryteria 1–4) -> Final Control. Integracja wyłącznie przez orkiestratora.
DEPLOY/PUSH: NIE WYKONANO

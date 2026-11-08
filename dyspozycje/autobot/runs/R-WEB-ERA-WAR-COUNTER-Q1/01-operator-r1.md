# R-WEB-ERA-WAR-COUNTER-Q1 — Operator, runda 1/5

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, `gra/`)
TEMAT: R-WEB-ERA-WAR-COUNTER-Q1
GOAL: licznik wojen epoki per cywilizacja i epoka (najwyżej 1, także gracz; napastnik lub cel); koniec globalnego limitu i obejścia R3; wojny wymuszone tylko dla Kamienia; partner gracza od stolicy; powód wojny widoczny dla gracza; zapis licznika w meta.
ZMIANY/COMMIT: commit `1db3e99b4` (kod + testy, branch `web/R-WEB-ERA-WAR-COUNTER-Q1`, PUSH NIE).
Allowlista: `gra/data/war-rules-params.json`, `gra/src/game/forced-war-common.ts`, `gra/src/game/war-rules-multiwar.ts`, `gra/src/main.ts` (tylko bloki wojen wymuszonych, licznika, zapisu, komunikatu), `gra/tools/**`. Nie dotknięto `ai.ts`, `gra-robocza/**`, `WERSJE.md`, `rust-port/**`, `src-tauri/**`.

Realizacja (plik:linia po zmianie w `gra/src/main.ts`):
- (1, 2) `eraWarCountByCivKey` (klucz `owner:epoka`, zużycie przy wypowiedzeniu, napastnik i cel); `waveActorBypassR3` usunięty; `maxEraForcedWarsPerEra` = null; nowy `maxEraForcedWarsPerCivPerEra: 1`.
- (3) `forced-war-common.ts` `assignForcedWarPairings`: opcja `isEraWarExhausted` filtruje pulę, kandydatów partnera gracza i dołączanie do par.
- (4) `enabledForcedWarEras: ["stone"]`; filtr w puli parowania (Brąz/Żelazo) i odrzucenie deklaracji wyłączonej epoki.
- (5) `playerCity` = stolica (`capitalCityIdForOwner(0)`), fallback pierwsze miasto.
- (6) hint „Wojna epoki (Kamień): X wypowiada wojnę” + wpis w karcie zdarzeń (`recordWarDeclarationEvent(..., reasonLabel)`); hamulec: „Wojna z progu zaufania”.
- (7) meta `warRulesEraWarCountByCiv`; stary zapis: odbudowa z aktywnych par; nowa gra czyści licznik.

TESTY:
- `tsc --noEmit`: PASS (baza: PASS).
- Nowy `gra/tools/war-era-counter-test.cjs`: 49 OK / 0 FAIL. Mutacje (11/11 zabite): cel zdjęty z bramki, limit null, filtr puli, kandydat gracza, dołączanie, flaga epok, klucz bez epoki, Brąz w puli, partner od pierwszego miasta, brak zużycia celu, brak zapisu meta.
- Bramki baza → po zmianie (identyczne poza jawnymi zmianami): war-rules-multiwar 55→57 OK; war-rules-multiwar-main-guard 21 OK; war-epoch-player-first 33/0; forced-war-stone 38/0 + main-guard 19/0; forced-war-bronze 56/0 + main-guard 28/0; forced-war-iron 58/0 + main-guard 37/0 (po korekcie regexu); forced-war-trojstronna 23/0 + main-guard 14/0; wojna-wymuszona-parowanie 47/0; p-wojna-wymuszona-trzy-naprawy 13/0; forced-war-reguly-multi-turn 50/0; forced-war-iron-era-enter-turn-save-load 20/0; load-game-regression 34/0; load-game-blockers-exec 15/0; diplo-tick-war-brake 51/0 + unit 69/0; endturn-battle-deadlock 38/0.
- Znane czerwone z bazy, bez zmian: war-epoch-player-first-main-guard 33/1 (newGameFlow), forced-war-waves 16/1, forced-war-bronze-new-game-reset (crash Node), wojna-wymuszona-prog-tury-gracz 6/3.
- Jawnie zmienione asercje (uzasadnienie w komentarzach testów): `war-rules-multiwar-test` R3j (null), `war-epoch-player-first-test` Z5 (globalny limit zniesiony), `war-epoch-player-first-main-guard-test` waveSnapshotR3 (bypass usunięty, sprawdzany licznik), `forced-war-iron-main-guard-test` (regex: gracz od stolicy; opcja `isEraWarExhausted`).
- NIE_ZMIERZONO: zrzut Chromium hintu po wypowiedzeniu wojny epoki (kryterium 5) — nie wykonany w tej rundzie.

BLOKADY: brak weryfikacji w przeglądarce (kryterium 5). Live testy Brązu/Żelaza (`forced-war-*-live`) zakładają aktywne Brąz/Żelazo i nie były uruchamiane.

ZAŁOŻENIA:
- Licznik kluczowany epoką właściciela w chwili wypowiedzenia i sprawdzany w bieżącej epoce; awans = nowy klucz.
- Pending Brązu/Żelaza nadal się uzbraja (zachowana sąsiedztwo `add` + `set` dla guardów), ale jest nieaktywny: nie wchodzi do puli, a deklaracje tej epoki są odrzucane flagą.
- Stary zapis: licznik odtwarzany z aktywnych par (obie strony = 1 w bieżącej epoce).
- Leftover, którego strony mają zużyty licznik, trafia do `unresolvedOwnerIds` (log DECISION_REQUIRED w kolejnej turze) — dołączanie w tej samej epoce jest z założenia niemożliwe.
- Wojna z progu zaufania dostaje tytuł „Wojna z progu zaufania” w karcie zdarzeń.
- Temat obwódek armii i kolorów (`R-WEB-ARMY-EMBLEM-RING-CIV-COLOR-Q1`) jest poza tym dispatchem i nie był wykonywany.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) odtwarza testy; Operator r2 — zrzut Chromium hintu (kryterium 5).
DEPLOY/PUSH: NIE WYKONANO

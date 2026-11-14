# R-WEB-BATTLE-FLEE-MOVE-HALF-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-FLEE-MOVE-HALF-Q1
GOAL: uciekająca (zrootowana) jednostka w bitwie przemieszcza się w jednej turze nie więcej niż 50% normalnego zasięgu ruchu tej samej jednostki (floor, minimum 1 heks); nigdy szybciej niż nie-uciekająca; mnożnik 0,5 w jednym miejscu (data/combat-params.json "ucieczka".mnoznik_ruchu).

## Źródła
- Dispatch: `00-dispatch.md` nie istnieje w `origin/main` pod tą ścieżką; użyto DODATKU z gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (`00-dispatch-DODATEK-claude.md`) jak w zleceniu.
- Baza: `1b8ce0d39` (origin/main), worktree odłączony od tego SHA.

## ZMIANY-COMMIT
- `gra/src/battle/battleScene.ts`:
  - `_fleeStep`: przed sprawdzeniem `moveLeft` zapas ruchu uciekiniera ustawiany RAZ na turę (`ru.fleeBudgetRound !== this.roundNo` → `moveLeft = min(moveLeft, _fleeMovePointsFor)`). Kolejne kroki tej samej tury (`_schedule`) zachowują pozostały zapas.
  - nowa metoda `_fleeMovePointsFor(bu)` = `max(1, floor(_movementPointsFor(bu) * mnoznik_ruchu))`; mnożnik czytany z `combatParamsData.ucieczka.mnoznik_ruchu` (jedyne miejsce; brak/nie-dodatnia wartość = 1).
  - pole `fleeBudgetRound?: number` w `RuntimeBattleUnit`.
  - Brak zmian zapisów pozycji (`.q =`/`.r =`): 0 dodanych linii.
- `gra/data/combat-params.json`: nowa sekcja `"ucieczka": { "_opis": ..., "mnoznik_ruchu": 0.5 }`. Wartość PRZED: brak pola (efektywnie 1,0); PO: 0,5. Żadnych innych pól, `units.json` nietknięty.
- `gra/tools/battle-flee-move-half-browser-entry.ts` + `.html` (nowe): prawdziwa bitwa 3D w Chromium, hook na `_doMove` zlicza kroki każdej zrootowanej jednostki na turę (`roundNo`), zapisuje normalny zasięg (`_movementPointsFor`).
- `gra/tools/battle-flee-move-half-test.cjs` (nowy): 3 przypadki (Konnica vs Wojownik; Hastati 2:1; Konnica uciekinier w obronie). Limit WPISANY w teście (0,5), nie czytany z JSON, żeby mutacja `mnoznik_ruchu = 1` czerwieniła test. Zmienna `FLEE_MODE` (skip domyślnie; watch = AUTO).

## TESTY
ZMIERZONO — test `node tools/battle-flee-move-half-test.cjs` (Chromium headless, Vite):
- Baza (PRZED poprawką, z parametrem i kodem bez zmian): **4 PASS / 16 FAIL**. Zmierzone kroki uciekiniera na turę: Warrior (normalny zasięg 4) = **4**/turę (2× limit); Hastati (normalny 3) = **3**/turę (3× limit). To potwierdza zgłoszenie właściciela: uciekinierzy idą z pełnym zapasem.
- Po poprawce: **42 PASS / 0 FAIL**. Warrior max 2/turę (limit 2), Hastati max 1 (limit 1), Horseman (Konnica, normalny 7) max **3**/turę (limit 3). Konnica 7 → 3 zgodnie z dispatchem; piechota 4 → 2 (Warrior) potwierdzona.
- Mutacja (`"ucieczka".mnoznik_ruchu` = 1 w combat-params.json, po czym przywrócone 0,5): **6 PASS / 29 FAIL** → test czerwony pod mutacją. Plik JSON po przywróceniu zweryfikowany (`grep`): 0,5.
- Regresja bitwy pościgu `tools/battle-routed-pursued-destroyed-test.cjs` (TMPDIR=/dev/shm): **30 PASS / 0 FAIL**.
- `tools/battle-neverrout-hold-test.cjs`: exit 0 (zielony). Wykonany w pierwszym planie, ok. kilku minut.
- Bramki referencyjne (§6 R-PROC-AUTOBOT; `node` z `gra/`):
  - `node ./node_modules/typescript/bin/tsc --noEmit`: exit 0 (0 błędów)
  - `logic-test.cjs`: 213/213
  - `tech-tree-test.cjs`: 20/20
  - `research-test.cjs`: 33/33
  - `unit-replace-test.cjs`: 21/21
  - `combat-test.cjs`: 6/6
  - `unit-power-test.cjs`: 6 pass / 0 fail
  - `mgla-sciezka-inwariant-test.cjs`: **41 PASS / 1 FAIL** (kontekst niżej w BLOKADY).
- `git diff --check`: czysty.
- `npm ci` wykonane w worktree `gra/` (brak node_modules w worktree); nie uruchamiano `npm run build/dev`.

## KONTROLA ZAKRESU / CO NIE ZMIENIONO
- Ruch zwykłych (nie-uciekających) jednostek: NIEZMIENIONY (poprawka dotyka wyłącznie `_fleeStep`, który wywołują tylko zrootowane jednostki). `_paceCapFor` zwraca Infinity dla `routed` od dawna.
- Morale, warunki załamania, `neverRout`, `units.json`: NIEZMIENIONE.
- Ścieżki ucieczki: wszystkie ruchy uciekiniera idą przez `_fleeStep` (w tym planer AUTO-batch `_resolveAutoBatchMovement` i klony planowania), więc mnożnik obejmuje je wspólnie. `computeInstantResult` (tryb „Pomiń"-rozstrzygnięcie natychmiastowe, `battleScene.ts` od ok. l.20703) NIE zawiera ruchu uciekinierów (brak `_doMove`/`_fleeStep`) — nic tam nie wymagało zmiany; NIE ZMIERZONO w osobnym pomiarze trybu „instant" (test używa trybu skip = `scene.skip()`).
- `combat.ts` / `auto-battle-power.ts`: nie wymagały zmian (brak osobnej symulacji ruchu ucieczki; `routed` tam to wynik rozstrzygnięcia, nie ruch).
- Dokumentacja: `docs/PORADNIK-GRACZA/*` NIE opisuje prędkości/zasięgu uciekinierów (przeszukano: 10-walka.md, 14-ai-zagrozenia.md, 57-katalog-jednostek.md) — zgodnie z warunkiem dispatchu („jeśli opisano") brak synchronizacji; wikiBundle NIE regenerowano (brak zmiany treści).

## BLOKADY
- **Tryb AUTO sceniczny (`FLEE_MODE=watch`) — NIE ZMIERZONO.** Przebieg w tle przekroczył limit 590 s pierwszego planu i został przerwany; nie uruchamiano w tle (zasada procesu). Kod `_fleeStep` jest wspólny dla AUTO i ręcznego, więc poprawka dotyczy też AUTO, ale liczby z Chromium dla AUTO NIE ZMIERZONO.
- **Zrzut ekranu bitwy — NIE ZMIERZONO.** Dowód w Chromium to log kroków na turę z prawdziwej sceny (nie zrzut).
- **`mgla-sciezka-inwariant-test.cjs` 41/1 — NIE ZMIERZONO na bazie.** Jedyny FAIL: „kazdy zapis pozycji jednostki w gra/src jest jawnie sklasyfikowany" — trafienia w `src/game/ai.ts:3741, 3776, 3777, 3824` (zapisy `.q/.r` w AI). Mój diff NIE dodaje żadnego zapisu `.q =`/`.r =` (zmierzone: 0 linii), więc nie jest to skutek tego tematu; nie uruchamiano testu na czystej bazie `1b8ce0d39`, więc przyczyny nie potwierdzam. Zgłaszam do orkiestratora (dług testowy, por. #292/#270 w rejestrze właściciela).
- **REPIN Rust (dług):** dispatch wspomina dług Rust; nie wykonywano (poza zakresem; Rust port nie był w allowliście). Do decyzji orkiestratora.

## UWAGI-DLA-ORKIESTRATORA
- Dispatch-bazowy `00-dispatch.md` nie istnieje w `origin/main` (tylko DODATEK w gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`). Orkiestrator może chcieć to uporządkować.
- Pozycja w rejestrze właściciela #392 („Ucieczka w bitwie: 50% ruchu") — po FC do odhaczenia; pozycja #399 („dziobie") i #309 („po utracie morale brak ucieczki i pościgu") to inne tematy, nie dotknięte.

## RUNDY
1/5 (Operator, Haiku). Bez powtórki rundy.

## NASTĘPNY KROK
Evaluator (Sonnet) → Obrona (Haiku, jeśli zarzuty) → Final Control (Sonnet). Do sprawdzenia przez niezależnego Evaluatora: pomiar AUTO (`FLEE_MODE=watch`) i mgla 41/1 na czystej bazie.

## DEPLOY/PUSH: NIE WYKONANO

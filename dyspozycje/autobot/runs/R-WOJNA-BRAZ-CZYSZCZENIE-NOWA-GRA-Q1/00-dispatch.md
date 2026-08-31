TEMAT:  R-WOJNA-BRAZ-CZYSZCZENIE-NOWA-GRA-Q1
RUNDA:  1/5
DATA:   2026-08-31
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Nota (e) Evaluatora z `P-WOJNA-BRAZ-NIE-CZYSCI-REJESTROW-NOWA-GRA-Q1`
(2026-08-28): mechanizm wymuszonej wojny Brązu nie czyści swoich rejestrów
(aktywne wojny, cooldowny) przy starcie nowej gry — ownerId są reużywane
między rozgrywkami. Orkiestrator zweryfikował grepem 2026-08-31: blok „nowa
gra" w `gra/src/main.ts` (~linia 31270-31300) jawnie czyści
`stoneForceWar{Pending,Cycle,RestUntilByOwner,ActiveByPairKey}` i
`ironForceWar{...}` (z komentarzem wprost tłumaczącym dlaczego — reużycie
ownerId), ale odpowiadające `bronzeForceWar{Pending,Cycle,RestUntilByOwner,
ActiveByPairKey}` są w tym bloku NIEOBECNE — potwierdzony, realny, wciąż
otwarty dług. Żelazo i Kamień poprawne, tylko Brąz brakuje.

## GOAL
Dopisać do tego samego bloku „nowa gra" (main.ts ~31288, obok istniejących
wywołań `stoneForceWar*.clear()`) analogiczne cztery wywołania:
`bronzeForceWarPendingOwners.clear()`, `bronzeForceWarCycleOwners.clear()`,
`bronzeForceWarRestUntilByOwner.clear()`, `bronzeForceWarActiveByPairKey.clear()`
— dokładnie ten sam wzorzec co sąsiednie bloki Kamienia/Żelaza, z analogicznym
komentarzem wyjaśniającym (reużycie ownerId między grami).

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Wszystkie 4 wywołania `bronzeForceWar*.clear()` obecne w bloku nowej gry,
   w tym samym miejscu/stylu co stone/iron — wklejony diff.
2. Realny test (jednostkowy, egzekucja prawdziwego kodu main.ts — nie regex
   nad tekstem): symuluj rejestr Brązu z niepustym stanem (pending/cycle/
   restUntil/activePair), wywołaj ścieżkę „nowa gra", potwierdź WSZYSTKIE 4
   struktury puste po wywołaniu.
3. Mutacja: usunięcie jednego z nowych 4 wywołań MUSI zaczerwienić nowy test
   (dowód, że test faktycznie coś sprawdza, nie jest tautologiczny) — wklejony
   dowód dla co najmniej 1 z 4 wywołań.
4. Zero zmian w logice samego mechanizmu wymuszonej wojny Brązu (forced-war-
   bronze.ts) — to czysto porządek stanu przy restarcie, nie zmiana reguł wojny.
5. 5 bramek referencyjnych zielone + `tsc --noEmit` 0 błędów + istniejące
   testy forced-war-bronze/forced-war-stone/forced-war-iron bez regresu.

## ALLOWLISTA — nic poza tym
`gra/src/main.ts` (wyłącznie blok „nowa gra" ~linia 31270-31300, dopisanie 4
linii + komentarz), nowy lub rozszerzony plik testowy w `gra/tools/`.
Zakazane bezwzględnie: `gra/src/game/forced-war-bronze.ts` i pozostałe pliki
mechanizmu wymuszonej wojny (logika wojny nietknięta), `gra/data/**`,
`docs/decyzje/<ID>.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-WOJNA-BRAZ-CZYSZCZENIE-NOWA-GRA-Q1`, baza
JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 2 za spełnione bez realnej egzekucji ścieżki „nowa
gra" (wyodrębniony tekst funkcji z main.ts + `new Function`, wzorem
`muzyka-braz-era-playlist-test.cjs`) — sam fakt, że linijki `.clear()` istnieją
w źródle, nie dowodzi że są wywoływane we właściwym miejscu/kolejności.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`). Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only i cutuje kolejną FALĘ ROBOCZA.

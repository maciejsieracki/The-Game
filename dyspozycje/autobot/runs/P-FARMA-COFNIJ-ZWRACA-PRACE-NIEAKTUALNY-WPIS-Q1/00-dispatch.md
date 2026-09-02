TEMAT:  P-FARMA-COFNIJ-ZWRACA-PRACE-NIEAKTUALNY-WPIS-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Znalezisko Final Control z 2026-08-27 (temat `R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1`,
`03-final-control.md` §6 "ZNALEZISKO 2"), świadomie zostawione poza GOAL tamtego
tematu i zarejestrowane osobno, nigdy nie zdispatchowane. Kontynuacja pętli
AutoBot — kolejny temat z backlogu, poza aktywnym wątkiem CivPedii/Fazy 3.

## RECON (wykonany przez Explore, nie powtarzać)
Mechanizm "cofnij" dla ulepszeń terenu (np. farmy) różni się od kolejki
budowy miasta (`cancelQueueItem` w `cityPanel.ts`, refunduje wyłącznie
surowce, NIE Pracę). Ulepszenia terenu: `gra/src/game/pending-improvements.ts`
(`PendingImprovementsTurn`) — Praca płacona z GÓRY przy zakolejkowaniu,
ulepszenie widoczne na mapie od razu ("pending"), można cofnąć TYLKO w tej
samej turze, przed `commitTurn()` na granicy tury.

Handler cofnięcia: `gra/src/main.ts:11711-11743`
`undoPendingBuildRequest(req)`:
- `pendingImprovementsTurn.remove(req.hexKey, req.key)` zdejmuje wpis.
- Dla zwykłego ulepszenia (nie `wycinka`): filtruje `req.key` z
  `placedImprovements.get(req.hexKey)` — best-effort, BEZ walidacji że wpis
  faktycznie tam jeszcze jest.
- Linie 11733-11736: **BEZWARUNKOWO** `if (pending.kosztPraca > 0) {
  playerPracaPool += pending.kosztPraca; ... }`, toast "Cofnięto — Praca
  zwrócona (X)".
`applyBuildRequest(req)` (main.ts:11780-11784) kieruje do tego handlera
WYŁĄCZNIE na podstawie `pendingImprovementsTurn.has(req.hexKey, req.key)` —
nigdy nie sprawdza czy instancja ulepszenia fizycznie nadal istnieje na heksie.

Usuwanie farm z lasu: `sweepLegacyFarmsOnForest` (main.ts:12199-12217, woła
`removeLegacyFarmsOnForest` z `map/improvement-build.ts:326`) mutuje WYŁĄCZNIE
`placedImprovements` i pola heksu. Ten moduł NIE zna `pendingImprovementsTurn`
(osobna struktura, osobny plik) — zero synchronizacji między nimi.

Dokładny mechanizm luki: stary zapis gry (sprzed reguły z 2026-08-27) mógł
zawierać niescommitowany wpis `PendingImprovementEntry{hexKey, key:'farma',
kosztPraca:40}` dla farmy legalnie postawionej wtedy na lesie. Przy wczytaniu:
(1) `restorePlacedImprovementsFromSave` uruchamia sweep — farma znika z
`placedImprovements`; (2) `pendingImprovementsTurn = PendingImprovementsTurn
.fromSave(...)` (main.ts:33332-33334) przywraca kolejkę pending BEZ
sprawdzenia czy sweep właśnie coś z niej unieważnił; (3) UI nadal pokazuje
ten heks jako klikalny "cofnij" (osobny bypass w `improvement-build.ts:938`/
`:1460`, `pendingUndoKeys` omija WSZYSTKIE reguły kwalifikacji — to
NIEZALEŻNY, kosmetyczny wątek, POZA zakresem tego tematu, nie naprawiaj go
tutaj); (4) gracz klika cofnij → `undoPendingBuildRequest` bezwarunkowo
zwraca Pracę za coś, co już nie istnieje.

## GOAL
W `undoPendingBuildRequest` (`gra/src/main.ts:11711-11743`), PRZED zwrotem
`pending.kosztPraca` (linia ~11733): sprawdź czy `req.key` FAKTYCZNIE nadal
jest obecny wśród aktualnych warstw ulepszeń heksu `req.hexKey` — dla
zwykłego ulepszenia: czy `placedImprovements.get(req.hexKey)` nadal zawiera
`req.key`; dla `action === 'wycinka'`: analogiczny, adekwatny sposób
weryfikacji istnienia stanu wycinki na tym heksie (np. `hexClearingStates`
lub odpowiadająca struktura — sprawdź realny kod, nie zgaduj nazwy).
- Jeśli ulepszenie/stan NADAL istnieje (normalny, terminowy przypadek
  cofnięcia w tej samej turze) — zachowanie DOKŁADNIE jak dziś, zero zmian:
  usuń wpis pending, zwróć Pracę, standardowy toast.
- Jeśli ulepszenie/stan JUŻ NIE istnieje (przypadek z RECON — desynchronizacja
  po jakimkolwiek mechanizmie, który usunął instancję niezależnie od kolejki
  pending, np. sweep lasu) — nadal usuń przestarzały wpis z
  `pendingImprovementsTurn` (porządkowanie stanu), ale NIE zwiększaj
  `playerPracaPool`, i pokaż UCZCIWY toast informujący że nic nie zwrócono
  (np. "Cofnięto — ulepszenie już nie istnieje, Praca nie została zwrócona" —
  dopasuj dokładne brzmienie do konwencji istniejących toastów w tym pliku).

Zero zmian w `pending-improvements.ts`, `improvement-build.ts` (w tym bypass
`pendingUndoKeys` w `qualifies`/`handleHexClick` — to osobny, kosmetyczny
temat poza zakresem), `sweepLegacyFarmsOnForest`/`removeLegacyFarmsOnForest`,
ani w żadnym innym miejscu poza samym `undoPendingBuildRequest`.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Żywy dowód w headless Chromium: skonstruuj stan gry z desynchronizacją
   (wpis w `pendingImprovementsTurn` dla ulepszenia, którego NIE MA już w
   `placedImprovements` dla tego heksu — bezpośrednio przez API silnika w
   teście, nie musisz odtwarzać całej ścieżki starego zapisu) i kliknij
   "cofnij" na tym wpisie — `playerPracaPool`/pula Pracy gracza NIE wzrasta,
   toast NIE twierdzi że Praca została zwrócona.
2. Ten sam żywy dowód dla NORMALNEGO przypadku: zakolejkuj ulepszenie w tej
   samej turze, natychmiast cofnij — Praca WRACA dokładnie jak dziś (zero
   regresu), standardowy toast.
3. Wpis w `pendingImprovementsTurn` jest usuwany w OBU przypadkach (stan
   kolejki pozostaje spójny, nie zostaje osierocony wpis).
4. Diff ograniczony wyłącznie do `undoPendingBuildRequest` w `main.ts` —
   dowód: brak zmian w `pending-improvements.ts`, `improvement-build.ts`,
   `sweepLegacyFarmsOnForest`.
5. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu +
   nowy/rozszerzony trwały test w `gra/tools/` pokrywający kryteria 1-3.

## ALLOWLISTA — nic poza tym
`gra/src/main.ts` (WYŁĄCZNIE funkcja `undoPendingBuildRequest`), nowy/
rozszerzony plik testowy w `gra/tools/`. Zakazane bezwzględnie:
`gra/src/game/pending-improvements.ts`, `gra/src/map/improvement-build.ts`
(w tym bypass `pendingUndoKeys` w `qualifies`/`handleHexClick` — osobny
temat), `sweepLegacyFarmsOnForest`/`removeLegacyFarmsOnForest` i cała
logika usuwania farm z lasu, `applyBuildRequest` (routing pozostaje bez
zmian — nadal kieruje po `pendingImprovementsTurn.has`), `gra/data/**`,
docs/decyzje/<ID>.md, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/P-FARMA-COFNIJ-ZWRACA-PRACE-NIEAKTUALNY-WPIS-Q1`,
baza JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`,
`dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 1 za spełnione bez realnego, żywego scenariusza w
przeglądarce odtwarzającego desynchronizację (nie samego czytania kodu ani
testu jednostkowego na wyciętej funkcji w izolacji od silnika). Zakaz
"naprawienia" przez całkowite zablokowanie zwrotu Pracy we WSZYSTKICH
przypadkach (to złamałoby kryterium 2, realny regres normalnego, uczciwego
cofnięcia) — fix MUSI rozróżniać oba przypadki, nie eliminować funkcję
zwrotu Pracy w ogóle.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`; build produkcyjny wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist --emptyOutDir`
dla żywego testu w przeglądarce). Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only i cutuje kolejną FALĘ ROBOCZA.

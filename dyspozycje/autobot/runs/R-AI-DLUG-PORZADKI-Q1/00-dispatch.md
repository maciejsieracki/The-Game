TEMAT:  R-AI-DLUG-PORZADKI-Q1
RUNDA:  1/5
DATA:   2026-08-31
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Trzy drobne, niezależne pozycje długu z audytu `R-AI-WYRAB-PRZY-RZECE-FARMY-Q1`
(2026-08-28), żadna nie wymaga decyzji właściciela, żadna nie blokuje —
zebrane pod jednym tematem, bo wszystkie dotyczą tego samego obszaru kodu
(main.ts, mechanizm AI/automatu gracza) i są zbyt małe na osobne tematy.
Orkiestrator zweryfikował 2026-08-31, że (a) i (b) są wciąż realnie otwarte
(grep `eliminateOwner`/save-load main.ts).

## GOAL — trzy niezależne poprawki (a, b, c), każda z osobnym dowodem

**(a) P-AI-R5-FC3-CLEANUP-OWNERID-REUSE-Q1** — `eliminateOwner()` (main.ts
~24014-24060) czyści dziesiątki map/setów po skasowanej cywilizacji
(`aiSkarbiecByOwner`, `bronzeForceWarPendingOwners`, itd.), ale NIE usuwa
wpisu z `aiSurplusRedirectedOwners` (main.ts:7541) ani z
`aiSliderStateByOwner` (main.ts:7515) — potwierdzone grepem, brak
`.delete(ownerId)` dla obu w tej funkcji. Skutek dziś martwy (reuse ownerId
trafia zwykle w ścieżkę miasta-państwa), ale to ta sama klasa przeoczenia co
już naprawione Z-3. Dopisz `aiSurplusRedirectedOwners.delete(ownerId)` i
`aiSliderStateByOwner.delete(ownerId)` w `eliminateOwner()`, obok istniejących
analogicznych wywołań.

**(b) P-AI-R5-FC4-SLIDER-STATE-NIE-PERSISTOWANY-Q1** — `aiSliderStateByOwner`
(main.ts:7515, Map<number, AiSliderSettings & {lastChangeTurn}>) NIE jest
zapisywany/wczytywany w sejwie (w przeciwieństwie do już naprawionego
`aiSurplusRedirectedOwners`, main.ts ~25270/32535-32538 — użyj TEGO SAMEGO
wzorca: płaska tablica par [ownerId, stan] w `buildSaveGameSnapshot`, odczyt
w `restoreGameFromSave`, stary zapis bez pola = pusty stan). Na ścieżce
wznowienia po komendzie (`isCommandResume`) powrót może jednorazowo trafić w
wartość domyślną zamiast własnego wyboru AI.

**(c) P-FLAGA-MARKCITYSTATEDIRTY-BRAK-ASERCJI-Q1** — istniejąca bramka
tematu flagi miasta-państwa (`R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1`,
2026-08-27/28) ma 31 asercji, ale usunięcie wywołania `markCityStateDirty()`
z bloku `clearCityStateFlagOnCapture` (main.ts, znajdź dokładne miejsce —
grep `clearCityStateFlagOnCapture`) NIE zaczerwienia jej — dziura w pokryciu
potwierdzona przez Final Control tamtego tematu. Dopisz JEDNĄ nową asercję do
tej bramki (znajdź plik testowy grepem po `clearCityStateFlagOnCapture` albo
po nazwie tematu w `gra/tools/`), która czerwienieje, gdy `markCityStateDirty()`
przestaje być wołane w tym konkretnym punkcie — dowód mutacją.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. (a): oba `.delete(ownerId)` obecne w `eliminateOwner()`, z realnym testem
   (egzekucja prawdziwego kodu) potwierdzającym że po eliminacji owner znika
   z OBU struktur.
2. (b): `aiSliderStateByOwner` przeżywa save→load roundtrip z realnymi
   wartościami (nie tylko domyślnymi) — test roundtrip, wzorem istniejącego
   testu dla `aiSurplusRedirectedOwners`.
3. (b): stary zapis (bez nowego pola) wczytuje się bez wyjątku, pusty stan
   (analogicznie do wzorca B5 dla `bronzeForceWarPendingOwners`).
4. (c): nowa asercja w istniejącej bramce; mutacja (usunięcie wywołania
   `markCityStateDirty()` w `clearCityStateFlagOnCapture`) faktycznie
   czerwienieje NOWĄ asercję — wklejony dowód PRZED/PO.
5. Zero regresu w żadnej z trzech poprawek — wszystkie 5 bramek referencyjnych
   + `tsc --noEmit` 0 błędów + istniejące bramki tematu flagi/AI bez pogorszenia.
6. Trzy poprawki NIEZALEŻNE — Evaluator ocenia każdą osobno, FAIL jednej nie
   przesądza o pozostałych (Final Control może orzec per-poprawka jeśli
   potrzeba, tak jak per-zarzut).

## ALLOWLISTA — nic poza tym
`gra/src/main.ts` (WYŁĄCZNIE: `eliminateOwner()`, `buildSaveGameSnapshot`,
`restoreGameFromSave`, `clearCityStateFlagOnCapture` — cztery punkty
wymienione w GOAL, zero innych zmian), istniejący plik testowy bramki flagi
miasta-państwa (rozszerzenie), nowy lub rozszerzony plik testowy w
`gra/tools/` dla (a)/(b). Zakazane bezwzględnie: zmiana logiki flagi
miasta-państwa poza dodaniem wywołania w istniejącym punkcie, `gra/data/**`,
`docs/decyzje/<ID>.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-AI-DLUG-PORZADKI-Q1`, baza JAWNIE
`origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania (b) za zamknięte bez realnego testu roundtrip (zapis wartości
RÓŻNEJ od domyślnej, wczytanie, porównanie) — sam fakt że pole pojawia się w
JSON snapshotu nie dowodzi że odczyt działa. Zakaz uznania (c) za zamknięte
bez wklejonego dowodu mutacji (czerwony test PRZED naprawą asercji / PO
cofnięciu mutacji z powrotem zielony).

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`). Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only i cutuje kolejną FALĘ ROBOCZA.

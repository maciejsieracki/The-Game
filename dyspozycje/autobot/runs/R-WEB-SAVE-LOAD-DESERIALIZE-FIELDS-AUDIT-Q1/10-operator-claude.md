# R-WEB-SAVE-LOAD-DESERIALIZE-FIELDS-AUDIT-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (audyt i narzędzie pomiarowe; kod gry NIE zmieniany)
TEMAT: R-WEB-SAVE-LOAD-DESERIALIZE-FIELDS-AUDIT-Q1 (#434)
GOAL: ustalić, które pola zapisu gubi jawna lista pól w `deserializeGame` (gra/src/game/save.ts) oraz które nie są odtwarzane po `restoreGameFromSave`; narzędzie uruchamialne jednym poleceniem, exit 1 przy polu zgubionym bez uzasadnienia.
BAZA: 178aa1a5b46f436df7257ca774512574e1ba2d55 (origin/main, detached). Wykonano w worktree wf_e7dadd15-1c3-1.

## ZMIANY-COMMIT
- Nowe: `gra/tools/save-load-deserialize-fields-audit.cjs` (narzędzie; tryb live Chromium `--dist`, tryb zrzutów `--raw-a/--raw-b`, mutacja `--mutate <pole>`).
- Dowody: `dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-DESERIALIZE-FIELDS-AUDIT-Q1/evidence/` (raw-A/raw-B z przebiegu live + `raw-mode/` z porównaniem i mutacją, JSON z wierszami tabeli).
- Raport: ten plik.
- Brak zmian w `gra/src`, `gra/data`, WERSJE.md, manifeście, gra-robocza, rust-port.
- SHA commita: patrz pole sha w odpowiedzi StructuredOutput (commit tylko tych trzech ścieżek).

## TESTY
Przebieg live (Chromium `/usr/bin/chromium`, dist zbudowany `npx vite build --outDir /tmp/claude-0/wf-e7-logs/dist` poza repo, seed 4242, 2 tury endTurn, zapis A = 43887 B, zapis B po wczytaniu w NOWEJ stronie = 44012 B):
- Faza (a) raw A vs deserializeGame(raw A): porównano 282 liście. OK 282, GUBIONE 0.
- Faza (b) deserializeGame(raw A) vs raw B (po restoreGameFromSave i ponownym zapisie): porównano 282 liście. OK 277, ZMIENIONE_PO_RESTORE 4, EFEMERYCZNE 1 (`meta.savedAt`), NIE_PRZYWROCONE 0, GUBIONE_PO_RESTORE 0.
- Wynik oryginału: ZIELONY (0 niezaliczonych pól).
- Kontrola czułości (mutacja: usunięta linia `resourceLedgerHistory: Array.isArray(obj2.resourceLedgerHistory)` w kopii src): faza (a) zgłasza GUBIONE `resourceLedgerHistory`, pole obecne w zapisie A (wpisów: patrz raw-A), wynik CZERWONY. Narzędzie zwraca exit 0 tylko gdy oryginał zielony i mutant czerwony.
- Porównanie zrzutów (`--raw-a/--raw-b`, po poprawce porównania kluczy i EFEMERYCZNE): ten sam wynik, dowód `evidence/raw-mode/audit-2026-11-16T04-52-19-377Z.json`.
- Bramki: `npx tsc --noEmit` EXIT 0; logic-test EXIT 0 (LOGIC OK 213/213); tech-tree-test EXIT 0 (20 pass, 0 fail); research-test EXIT 0 (ALL GREEN); unit-replace-test EXIT 0 (21/21); combat-test EXIT 0 („All sanity checks passed.”). `git diff --check` dla nowych plików (untracked, bez błędów spacji końca linii: 0 linii).

## WYNIK AUDYTU (liczby z surowego wyjścia)
- Faza (a): `deserializeGame` NIE gubi żadnego pola zapisu w tym przebiegu. Pole `resourceLedgerHistory` (dawny defekt #432) jest zwracane poprawnie.
- Faza (b), pola ZMIENIONE po restore (informacyjne, nie gubione):
  1. `cities` (1 miasto): `podzialPracy` = null w zapisie A, po restore/ponownym zapisie `{"procentBudynki":50}` (domyślny podział pracy dopisany). Powiązane z #424 (R-WEB-SAVE-LOAD-CITY-WORK-SPLIT-ROUNDTRIP-Q1); wpływ na ekonomię NIE ZMIERZONO w tym temacie.
  2. `meta.bronzeEraEnterTurnByOwner`: w zapisie A `[]`, po restore `[[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[0,3]]`.
  3. `meta.ironEraEnterTurnByOwner`: w zapisie A `[]`, po restore j.w. (tura 3 dla wszystkich właścicieli).
  4. `meta.diplomaticContactEstablished`: w zapisie A `[]`, po restore `[[0,[]]]`.
  Pozycje 2–4 to rozjazd zapisu z runtime po wczytaniu (runtime wypełnia mapy przy restore; zapis A miał je puste). NIE ZMIERZONO, czy to wpływa na tick lub UI. Kandydat do osobnej weryfikacji (nie wdrażane tutaj).
- `meta.ownerDefaultPodzialHandlu`: po porównaniu z kanonicznym kluczem (kolejność kluczy obiektu nie jest różnicą danych) wartości równe.
- Pole `playerEverOwnedCityByOwner` (#433) NIE jest częścią SaveGame: to lokalna zmienna w main.ts (ok. 3167), nie ma jej w save.ts. Narzędzie z definicji go nie widzi (audytuje tylko to, co serializeGame zapisuje). Czy jest odtwarzane po wczytaniu, zostaje poza zakresem tego audytu; wniosek: sprawdzać osobnym tematem, jeśli #433 ma zostać zweryfikowane tą samą drogą.

## BLOKADY / OGRANICZENIA POMIARU (NIE ZMIERZONO tam, gdzie wskazano)
- Tablice są liśćmi: pola wewnątrz `cities`, `units`, `mapSnapshot` nie są porównywane pojedynczo, tylko jako całość. Dlatego 282 to liczba ścieżek do poziomu list/prymitywów, nie wszystkich pól.
- Jedna próbka (1 miasto, seed 4242, 2 tury). Nie obejmuje wielu miast, jednostek czy innych stanów (np. wojny, oblężenia, handel), bo one nie były generowane.
- Faza (b) to porównanie z ponownym zapisem po wczytaniu bez tury (proxy runtime), a nie odczyt bezpośrednio z pamięci modułu: w grze nie ma hooka eksponującego stan po restore, a zmiany w `gra/src` były zakazane. NIE ZMIERZONO wartości w pamięci bezpośrednio.
- Wpływ na tick/UI dla ZMIENIONYCH pozycji: NIE ZMIERZONO (wymaga osobnego pomiaru).
- Brak JUSTIFIED wpisów: lista uzasadnień jest pusta.

## NASTĘPNY KROK
1. Orkiestrator decyduje, czy otworzyć kandydatów: (a) weryfikacja wpływu pozycji 2–4 (era/kontakt w meta po restore: czy runtime rekonstruuje je z bieżącej tury, czy zapis powinien je zachować); (b) pozycja `podzialPracy` pokryta już przez #424.
2. Jeśli orkiestrator chce narzędzie w CI/gatekeeper: pozostaje uruchamiać je komendą `node gra/tools/save-load-deserialize-fields-audit.cjs --dist <abs-dist>` (wymaga Chromium); tryb zrzutów działa bez przeglądarki.

## UWAGI-DLA-ORKIESTRATORA
- Dispatch w `origin/main` (`dyspozycje/autobot/runs/.../00-dispatch.md`) nie istnieje w tym SHA; czytano dodatek z gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (plik `00-dispatch.md` dostępny tam, nie w main).
- Nie utworzono żadnych sesji, zadań, harmonogramów ani subagentów.
- Dysk/sprzątanie: po commicie usuwam `gra/node_modules` i `/tmp/claude-0/wf-e7-logs/dist`.

DEPLOY/PUSH: NIE WYKONANO

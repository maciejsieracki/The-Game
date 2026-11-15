STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1C-FOG-ROZP-Q1
GOAL: rozpoznanie producenta FogViewDto (#212), tylko odczyt, zero zmian kodu
ZMIANY/COMMIT: dyspozycje/rust-port/p4/P4-1C-FOG-ROZPOZNANIE.md (poprawki), ten plik; gałąź
  obrona/R-RUSTPORT-P4-1C-FOG-ROZP-Q1 od 4c86f5d80 (Operator r1); SHA w odpowiedzi workflow
TESTY: rozpoznanie bez kodu; `git diff --check` czysty; zmiany tylko w allowliście; cargo nie uruchamiane
BLOKADY: decyzja ABC dla fotela ≠ 0 (dokument §1.5), do zadania przez orkiestratora
RUNDY: obrona po r1 Evaluatora (1/5)
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO

# Obrona Operatora — odpowiedzi na zarzuty Evaluatora (02-evaluator.md, 605ff986d)

Wszystkie odczyty z `git show 07d2fbd72:gra/src/main.ts` i `…:gra/src/game/save.ts`.

## 1. [KRYTYCZNY] E_r i niezmiennik `vis ⊆ explored` dla fotela ≠ 0 — PRZYJMUJĘ

Dowód z pinu: `main.ts:12799` `const explored`, `:13759` `exploredByHuman = new Map([[HUMAN_OWNER_PRIMARY, explored]])`
(komentarz `:13751-13758`: rozdział per fotel to „runda 2”), `:12864-12866` `fogExploredForRender()`
czyta globalny `explored`, `:13483` zapis do `exploredByHuman.get(ME())`; osobne `Set` dla innych
foteli `:10895`, `:13902`, `:29718`; load utrzymuje alias fotela 0 (`:46393-46411`). Dodatkowo:
`switchActiveHuman` (`:13896`) osiągalne tylko z haka testowego (`:29965`, komentarz `:13893`),
`hotSeatEnabled()` martwy kod (`:12833-12845`).
Poprawka: nowy §1.5 (zachowanie ROZBIEŻNE + szkic pytania ABC A/B/C z rekomendacją C),
§0 p.5, §1.1 wiersz `fogExploredForRender`, §2 reguła `state` i uwaga o niezmienniku (wierne tylko
dla `viewer = 0`), W3 wektor (h) wstrzymany do ABC, zależność W3 od ABC.

## 2. [KRYTYCZNY] migracja v2 → fotel 0 w W1 — PRZYJMUJĘ

Dowód: `save.ts:109-116` („ŚWIADOMIE BEZ funkcji migrującej v2->v3”), `:380-387` („zapis w starym
formacie jest odrzucany … ABC-4: bez migracji”), `:695-706` (`if (ver < 3) throw new IncompatibleSaveFormatError(ver)`).
Poprawka: W1 — tylko v3 `exploredByHuman`, zapis v2 odrzucany błędem; wektory: „zapis v2 → błąd”;
§1.3 nowy wiersz `save.ts:109-116`, `:380-387`, `:695-706`.

## 3. [ISTOTNY] pominięte `updateDiplomaticDiscovery(vis)` — PRZYJMUJĘ

Dowód: `main.ts:13479` (numer w pinie to 13479, nie 13477), def. `:22528-22533`,
`diplomaticallyDiscoveredOwnersSet()` per fotel `ME()` `:10058-10062`.
Poprawka: §0 p.4, §1.1 nowy wiersz, §1.3 nowy wiersz, W2 zakres (oba haki z `refreshFog`).

## 4. [ŚREDNI] zapisy ścieżką i traktatem do fotela 0; brak PaktNieagresji — PRZYJMUJĘ

Dowód: `main.ts:13461`, `:31636`, `:43637`, `:44137` `addExplored(explored, …)` (globalny alias
fotela 0); `:24573-24579` `revealsTerritoryOnSign` obejmuje `PaktNieagresji`; `:24580` warunek
`proposerId === 0 || responderId === 0`; `:24582` `addExplored(explored, …)`.
Poprawka: §1.3 wiersze ścieżki i traktatu (pełna lista 5 rodzajów, legacy `UmowaHandlowa` wyłączona,
fotel 0 na sztywno), §0 p.4, W2 zakres.

## 5. [DROBNY] cytat `applyFogVisibility` — PRZYJMUJĘ

Dowód: `main.ts:13503-13504` `(vis, true, ME())` / `(vis, true)`; `:13512-13513` `(ALL_KEYS, false, ME())` / `(ALL_KEYS, false)`.
Poprawka: §1.4 wiersz z wiernymi literałami.

## 6. [DROBNY] `:24903` i `:29718` w §1.3 — PRZYJMUJĘ

Dowód: `main.ts:24902-24906` `resetFogToCurrentlyVisible` (hak testowy) `explored.clear()`;
`:29714-29718` hak testowy dodania fotela `exploredByHuman.set(...)`.
Poprawka: §1.3 dwa wiersze „Nie dotyczy (hak testowy)”.

## Poprawka własna przy okazji

§1.1: `const vis = currentVisible()` jest w pinie w `main.ts:13478` (było `:13476`) — poprawione.

## Pozycja 7 (bramki Evaluatora)

Brak zarzutu — informacja o odtworzonych bramkach; obrona nie zmienia kodu, więc bramki cargo
pozostają ważne (diff obrony obejmuje tylko 2 pliki dokumentacji z allowlisty).

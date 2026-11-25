# R-WEB-TEST-HARDEN-TMPGATE-CLUSTER-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: INFRA (testy)
TEMAT: R-WEB-TEST-HARDEN-TMPGATE-CLUSTER-Q1
GOAL: domknąć dwie luki bramki unikalnych nazw tmp (zapis stałej nazwy pod os.tmpdir() przechodził) oraz zbadać mutant rivalIndex +1→+2 w asercji cluster-plan-name.
ZMIANY-COMMIT:
- 4bf8eb398 — gra/tools/bramki-tmpdir-unikalnosc-test.cjs: nowa reguła R7 (stała nazwa doklejona do korzenia `os.tmpdir()` lub zmiennej-korzenia, bez względu na to, w której instrukcji stoi zapis), rozszerzenie R1 i isReadOnlyRoot o `path.posix.join` / `path.win32.join`, samotest +7 asercji (6 fixture'ów zapisu + 1 fixture odczytu bez trafienia).
- 69cbb4691 — gra/tools/cluster-plan-name-test.cjs: tylko komentarz; mutant rivalIndex oznaczony jako RÓWNOWAŻNY z dowodem. Bez nowej asercji, bez zmiany wyniku testu.
- Ten raport (dyspozycje/autobot/runs/R-WEB-TEST-HARDEN-TMPGATE-CLUSTER-Q1/10-operator-claude.md) — commit osobny.
- Zero zmian w gra/src i gra/data. Mutacja wykonana wyłącznie na kopii poza repo.

## Luka 1 — bramka tmpdir (ZAMKNIĘTA)

Przed zmianą (baza a80b9bbfa), fixture'y z zapisem stałej nazwy pod korzeniem w INNEJ instrukcji niż zapis lub w formie wprost, zmierzone osobno na kopii bramki w katalogu scratch:
- G1 `const p = \`${T}/civ-stala\`;` + osobne `fs.writeFileSync(p, ..)` — PRZECHODZIŁO (NO-HIT)
- G4 `fs.writeFileSync(path.posix.join(os.tmpdir(), 'civ-stala'), ..)` — PRZECHODZIŁO
- G5 `const p = T.concat('/civ-stala');` + osobny zapis — PRZECHODZIŁO
- G6 `[os.tmpdir(), 'civ-stala'].join('/')` wprost — PRZECHODZIŁO
- G2 `[T,'civ-stala'].join('/')`, G3 `path.posix.join(T,'civ-stala')` w tej samej instrukcji co zapis — już łapane przez R2
Po zmianie (4bf8eb398): G1, G2, G3, G4, G5, G6 — każdy FAIL z trafieniem R2/R7/R1. Fixture odczytu (readdir, `[T, n].join`, `mkdtempSync(path.posix.join(T,'civ-'))`) — bez trafienia.

Bramka na realnym drzewie: PRZED `PASS=10 FAIL=0`, PO `PASS=17 FAIL=0`, przeskanowano 436 plików z tmpdir (z 1956 .cjs). Pierwsza wersja R7 dawała 28 fałszywych trafień na wzorcu `'civ-x-' + process.pid` (znacznik poza literałem); naprawiono zakresem znacznika do domykającego nawiasu/średnika w TYM wyrażeniu (exprTailAfter), nie do reszty linii.

## Luka 2 — cluster-plan-name, mutant rivalIndex +1→+2 (RÓWNOWAŻNY, udokumentowany)

Uwaga o ścieżce: w dispatchu plik podano jako gra/src/game/cluster-spawn.ts. Rzeczywista lokalizacja to gra/src/map/cluster-spawn.ts:420 (`(rivalIndexByCiv.get(slot.typ) ?? 0) + 1`). Mutant zastosowano tam, na kopii.

Analiza kodu:
- cluster-spawn.ts:422 wywołuje clusterRivalCityName(civs, typ, rivalIndex, pools, used) z `used` zawsze zdefiniowanym (Set).
- civ-names.ts:91-96: przy obecnej puli (pools[typ]) wywołuje clusterRivalFromPool(pools, typ, rivalIndex, used). Wtedy implicitUsed = used, więc rivalIndex wpływa tylko na tekst fallbacku `Rywal N`, który jest zwracany wyłącznie gdy pickNextCityNameFromNames nie znajdzie nazwy. Ta funkcja (city-names-pool.ts:195-210) przy niepustej kolejce zawsze zwraca nazwę (z sufiksem, gdy kolejka wyczerpana), więc fallback jest nieosiągalny.
- Ścieżka bez puli (nazwaKlastraAt zależne od indeksu) jest osiągalna tylko dla cywilizacji bez puli. W data/civs.json są 15 cywilizacji, wszystkie 15 ma pulę po 110 nazw (data/city-names-pools.json). Ścieżka jest więc nieosiągalna przy obecnych danych.

Eksperyment (kopie baza/mutant poza repo, scratchpad/mut/):
- Test cluster-plan-name-test.cjs na mutancie: 6 passed, 0 failed (tak samo jak baza). Mutant NIE jest wykrywany przez istniejącą asercję.
- Porównanie wyjścia baza vs mutant: 24 ziarna × 6 cywilizacji = 48 przebiegów (generateMap + buildClusterStartPlan + buildClusterSpawnPlan): roznice_wyjscia_planow=0.
- Sonda clusterRivalCityName: 15 cywilizacji × 2 (z pulą i bez) × indeks 1–12 × 4 kolejne wywołania z rosnącym zbiorem zajętych nazw = 192 wywołania: roznice_nazw=0.
- Zastrzeżenie: porównanie planów serializuje JSON.stringify, a plany zawierają Mapy, więc ten sygnał jest słabszy niż sonda nazw. Dowodem głównym jest analiza kodu i sonda.

Decyzja: mutant +2 oznaczony jako równoważny w komentarzu nagłówkowym cluster-plan-name-test.cjs (69cbb4691). Bez nowej asercji, bo asercja opierałaby się wyłącznie na tekście fallbacku, którego runtime nie zwraca.

## TESTY (surowe wyniki, ten commit 69cbb4691 — zielono)

- `node_modules/.bin/tsc --noEmit` (gra/): exit 0, bez wyjścia
- `node tools/logic-test.cjs`: `LOGIC OK (213/213)`, exit 0
- `node tools/ai-test.cjs`: `ai-test: 297 passed, 0 failed`, exit 0
- `node tools/bramki-tmpdir-unikalnosc-test.cjs`: `PASS=17 FAIL=0`, exit 0
- `node tools/cluster-plan-name-test.cjs`: `6 passed, 0 failed`, exit 0
- `git diff --check`: czysto

Instalacja: `npm ci --ignore-scripts` w gra/ (tylko zależności, bez buildu). `npm run build/dev` NIE uruchamiane.

## BLOKADY

Brak blokad technicznych.

## RUNDY

1/5 — PASS. Brak powrotów.

## NASTĘPNY KROK

Orkiestrator: Final Control dla tematu R-WEB-TEST-HARDEN-TMPGATE-CLUSTER-Q1 (kod: 69cbb4691; raport: ten plik). Opcjonalnie: w FC zwrócić uwagę, czy zakres R7 (fixture z wartością literalną `'civ-'` bez znacznika jest flagowany celowo) jest akceptowalny dla przyszłych bramek.

## UWAGI-DLA-ORKIESTRATORA

- Lokalizacja mutanta w dispatchu (gra/src/game/cluster-spawn.ts) jest błędna; właściwa to gra/src/map/cluster-spawn.ts:420.
- W worktree zainstalowano gra/node_modules (npm ci --ignore-scripts); katalog jest w .gitignore, do sprzątania po FC.
- Scratch z kopiami baza/mutant jest poza repo (scratchpad/mut i scratchpad/gapexp); do usunięcia po FC.

DEPLOY/PUSH: NIE WYKONANO
SHA: 69cbb46914752d987527532a25daa401fdab5a09 (kod + komentarz); raport w commicie następnym po nim

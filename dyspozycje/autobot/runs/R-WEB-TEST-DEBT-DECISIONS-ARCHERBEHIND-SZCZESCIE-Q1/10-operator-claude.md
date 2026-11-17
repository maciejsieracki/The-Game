# R-WEB-TEST-DEBT-DECISIONS-ARCHERBEHIND-SZCZESCIE-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS (tylko `gra/tools` + opis liczb; zero zmian w `gra/src`, `gra/data`)
TEMAT: R-WEB-TEST-DEBT-DECISIONS-ARCHERBEHIND-SZCZESCIE-Q1
GOAL: (1) bitwa-auto-atak-wielojednostkowy — asercja „archer behind infantry” przepisana na zachowanie następcy planera (boczny krok łucznika (2,3)->(2,2), bez wstrzymania i bez wyprzedzania piechoty); (2) szczescie-przebudowa-skali — komplety budynków 11/23/31 zastąpione przez 12/24/32 z dowodem pochodzenia, katalog 44. Oba testy zielone, mutacje czerwienieją.

BAZA: origin/main = 439b1e1ae0a6dbec769495941dff30867aa8857e (≥ bbaa3b27c2dbea5843d8e540b8b58cbf9994b7ea; `git merge-base --is-ancestor bbaa3b27…  439b1e1…` = ancestor). Worktree odłączony (`git checkout --detach 439b1e1ae0a6dbec769495941dff30867aa8857e`).
Uwaga: dispatch `00-dispatch.md` istnieje tylko na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (nie na origin/main) — czytany stamtąd. DODATEK podawał cand bbaa3b27; użyto 439b1e1 (potomek bbaa3b27, spełnia „BAZA ≥ bbaa3b27”).

ZMIANY-COMMIT: patrz sekcja „Commit” niżej (tylko allowlista):
- `gra/tools/bitwa-auto-atak-wielojednostkowy-evaluation-test.cjs` — sekcja Atak: asercje dokładne (archer `kind=move`, `steps=[(2,2)]`; po rundzie 1 infantry (4,3), archer (2,2); runda 2: archer nie wyprzedza piechoty, piechota nie cofnięta). Usunięte stare asercje „hold” i „advance to (3,3)” (opisywały zachowanie sprzed 9dc324bb9).
- `gra/tools/szczescie-przebudowa-skali-test.cjs` — `builtIdsForEra`: oczekiwane 12/24/32 (było 11/23/31); komentarz z historią wartości i zweryfikowanymi commitami.
- `dyspozycje/autobot/runs/R-WEB-TEST-DEBT-DECISIONS-ARCHERBEHIND-SZCZESCIE-Q1/10-operator-claude.md` — ten raport.

Świadomie NIE zmienione: `dyspozycje/BALANS-SZCZESCIE-SKALOWANIE-EPOK.md` linia 21–22 nadal podaje „11 / 23 / 31” (patrz UWAGI). Edycję tego pliku wykonałem, po czym cofnąłem: plik spoza allowlisty (allowlista obejmuje `docs/**`).

## Dowody

### Temat 1 — bitwa-auto-atak (decyzja: ZOSTAJE obecne zachowanie planera)
- Przed zmianą (439b1e1): 7 PASS / 5 FAIL (zgodnie z dispatchem).
- Intencje planera zmierzone (debug na kopii testu, poza repo): runda 1 — infantry `move` (4,3); archer `move` steps `[(2,2)]` (boczny krok, nie hold, nie w przód).
- Po zmianie: 10 PASS / 0 FAIL (`node tools/bitwa-auto-atak-wielojednostkowy-evaluation-test.cjs`, exit 0).
- Mutacja (kryterium b.1), tymczasowa w `gra/src/battle/battleScene.ts` w `_activateUnit`: `if (ru.bu.id === 'archer' && ru.side === 'atk') { done(); return; }` (archer zawsze wstrzymany) → test: **2 FAIL** (asercja kind/steps łucznika w rundzie 1 oraz stan (2,2) po commit). Przywrócone przez usunięcie linii mutacji; `git status` pokazuje tylko 2 pliki testów + ten raport (src czysty).
- Uwaga: mutacja „planer wypycha łucznika przed piechotę” jest pokryta tą samą asercją dokładnej pozycji (steps = [(2,2)]); nie wykonano osobnej mutacji wypchnięcia.

### Temat 2 — szczescie-przebudowa-skali (decyzja: ZOSTAJE 12/24/32)
- Przed zmianą: 532 OK / 3 FAIL (`got 12, want 11`; `got 24, want 23`; `got 32, want 31`).
- Pochodzenie wartości (wykonane skryptem na `buildings.json` z każdego commitu, `git show <sha>:gra/data/buildings.json`):
  - `04660f9d1` — katalog 41 — kit 11 / 23 / 31 (stara wartość testu i dokumentu);
  - `918e59933` (R-BUDYNEK-GARNIZON-NOWY-Q1, dodanie `garnizon`) — katalog 42 — kit 12 / 24 / 32;
  - `HEAD` 439b1e1 — katalog 44 (+`mury_kamienne` 0bf194d76, +`emporion` c80f39cf0) — kit 12 / 24 / 32.
  - Bez zwijania łańcuchów `upgradeFrom` (kontrola): 13 / 29 / 42 (HEAD).
- Po zmianie: 535 OK / 0 FAIL (`node tools/szczescie-przebudowa-skali-test.cjs`, exit 0). Katalog 44 był już asertowany (`eq(buildings.length, 44)`) i przechodzi.
- Mutacja (kryterium b.2), tymczasowa w KOPII DANYCH `gra/data/buildings.json` (`garnizon.epokaWejscia = 99`, czyli usunięcie jednego budynku z kompletu epoki 1): → 532 OK / **3 FAIL** (2b epoki 1/2/3). Plik przywrócony przez `git checkout -- gra/data/buildings.json`; `git status` czysty w `gra/data`.
- Mutacja dodania budynku (kryterium b.2, wariant „dodanie”) NIE wykonana osobno — NIE ZMIERZONO (wariant usunięcia wystarczy do wykazania czerwieni asercji kompletów).

### Bramki (kryterium c) — surowe wyniki z tego uruchomienia
- `node ./node_modules/typescript/bin/tsc --noEmit` → exit 0, 0 błędów.
- `node tools/logic-test.cjs` → `LOGIC OK (213/213)`
- `node tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`
- `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`
- `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`
- `node tools/combat-test.cjs` → `COMBAT TEST: 6/6 pass`
- `node tools/unit-power-test.cjs` → `=== unit-power-test: 6 pass, 0 fail ===`
(Pięć bramek „referencyjnych” z dispatchu nie jest wymienionych po nazwie; uruchomiono wszystkie sześć wierszy tabeli §6 R-PROC-AUTOBOT, z wyjątkiem map-gen i wierszy Chromium — NIE ZMIERZONO.)

### Testy dotykające kompletów szczęścia (kryterium e)
- 49 plików `tools/*.cjs` zawiera `dajeSzczescie`/`builtIdsForEra`/`komplet`. Uruchomione (wszystkie zielone poza jednym, opisanym niżej): `building-happiness-test` 14/0; `budynek-garnizon-test` 83/0; `emporion-building-test` 47/0.
- `citizen-resource-upkeep-test`: 122 PASS / **2 FAIL** — FAIL to asercje tekstowe o `gra/src/main.ts` (kotwica `evaluateOrderFromBreakdown`, mutant F1). Moje zmiany nie dotykają `gra/src` ani `gra/data` (`git diff --stat` = tylko 2 pliki testów), więc to nie jest nowa czerwień wprowadzona tym tematem. NIE ZMIERZONO na czystym 439b1e1 osobno (uznane za niezależne od diffu na podstawie zawartości diffu).
- Pozostałe ~45 plików z listy NIE uruchomione (wiele to testy Chromium/realnego renderu) — NIE ZMIERZONO.

### Kontrola zakresu (kryterium d)
- `git diff origin/main -- gra/src gra/data` → pusty (brak zmian w logice ani danych gry). Komentarze w `src`: brak zmian.

## TESTY
- bitwa-auto-atak-wielojednostkowy: przed 7/5 → po 10/0; mutacja archer-hold → 8/2 (czerwień).
- szczescie-przebudowa-skali: przed 532/3 → po 535/0; mutacja usunięcia garnizonu z kompletu → 532/3 (czerwień).
- bramki §6 (6 wierszy) + tsc: zielone (wyniki wyżej).
- citizen-resource-upkeep: 2 FAIL (poza zakresem, opisane).

## BLOKADY
- Brak blokad dla tematu. Decyzje nie wymagały ABC (zgodnie z dispatchem: „ZOSTAJE” dla obu).
- Zakres allowlisty: opisy liczb poza `gra/tools` (tu: `dyspozycje/BALANS-SZCZESCIE-SKALOWANIE-EPOK.md`) są poza allowlistą (`docs/**`) — nie zmieniane; patrz UWAGI.

## RUNDY
1/5. Ostatni werdykt: brak (Operator). Decyzja wymagana: NIE.

## NASTĘPNY KROK
Evaluator (Sonnet) + Obrona/Final Control wg obiegu. Do rozstrzygnięcia przez Final Control: czy dokument `BALANS-SZCZESCIE-SKALOWANIE-EPOK.md` (poza allowlistą Operatora) ma być poprawiony osobnym tematem dokumentacyjnym (tekst „11/23/31” i „11/26/39” jest nieaktualny).

## DEPLOY/PUSH: NIE WYKONANO

## UWAGI-DLA-ORKIESTRATORA
1. `dyspozycje/BALANS-SZCZESCIE-SKALOWANIE-EPOK.md` l. 21–22 nadal mówi „11 / 23 / 31” i „nie 11 / 26 / 39”. Dane HEAD: 12/24/32 i (bez zwijania) 13/29/42. Plik jest poza allowlistą tematu (`docs/**`), więc nie zmieniałem go. Zalecany osobny temat dokumentacyjny.
2. `gra/tools/szczescie-skala-normalizacja-test.cjs:571` ma etykietę logu „pop 12 / epoka 3 / 31 budynkow” — prawdopodobnie ten sam nieaktualny komplet; poza allowlistą, nie zbadane szczegółowo (NIE ZMIERZONO, czy to ta sama wielkość).
3. `gra/tools/szczescie-przebudowa-skali-test.cjs` — nagłówek sekcji `2a` nadal mówi „19 daje szczescie, 22 daje DOKLADNIE 0”, a lista NIE ma 25 pozycji (asercja liczbowa przechodzi). Tylko etykieta, nie zmieniana (poza zakresem dispatchu).
4. Obserwacja w bitwie-auto-atak (nie błąd testu, do oceny): w rundzie 2 planer nie zwraca kroków ani dla piechoty, ani dla łucznika (oba `move` z pustymi `steps`), mimo że piechota ma wolny kafel przed sobą. Przyczyna NIE ZBADANA (możliwe: spójność formacji / tempo W19/W40 przy łuczniku poza linią). Nie zmieniałem src.
5. Dispatch wymagał mutacji „dodanie/usunięcie jednego budynku” — wykonano tylko usunięcie (patrz wyżej).
6. Rozbieżność w dokumentacji zadania: dispatch mówi „BAZA = origin/main”, a `00-dispatch.md` istnieje tylko na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`. Odnotowane, nie blokuje.

## Commit
Commit zawiera wyłącznie: dwa pliki testów, ten raport (`git add <ścieżka>`, bez `-A`). SHA — w polu `sha` odpowiedzi strukturalnej.

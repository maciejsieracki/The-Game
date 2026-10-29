STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K04B-Q1
GOAL: Odpowiedź Operatora (obrona) na zarzuty Evaluatora r1 z oceny b5c4f51a; odtworzenie stanu z commita Operatora-pomiarów b5c4f51a (baza 57efd4b3, kod 6c2c994a, harness ab973357).
ZMIANY/COMMIT: commit tej rundy (obrona r1) — SHA w raporcie orkiestratora. Allowlista: `src/controller/commands.ts` (dopisek wariantu), `src/ui/cityPanel/k04b-queue.ts`, `dyspozycje/rust-port/p5/P5-8-K04B.md`, `PORTING-QUEUE.md` (dopisek), `runs/R-RUSTPORT-P5-8-CITYPANEL-K04B-Q1/**`. Zero zmian w `gra/**`, `WERSJE.md`, rust-port. Push: NIE WYKONANO.
TESTY:
- `npm ci`: exit 0.
- `npm run typecheck`: exit 0 (po poprawce pkt 1).
- Negatywny dowód typów (plik tymczasowy, usunięty): `kind: 'enqueue_build'` przypisany do `EnqueueBuildCommand` → `TS2322 Type '"enqueue_build"' is not assignable to type '"enqueue_build_item"'`; poprawne `enqueue_build_item` i `move_build` przechodzą.
- `npm run check`: exit 0 (self-test 33/15, 0 błędów; no-logic-imports 165 plików, 0 trafień; verify-pin-copies 435, 0 niezgodnych).
- `run-k04b-units.mjs --pin-dir <pin>`: exit 0, PRZYPADKI=98 OK=98 ROZNICA=0 (dwa przebiegi na tym samym drzewie).
- `mutate-k04b-units.mjs --pin-dir <pin>`: exit 0, MUTACJI=36 WYKRYTYCH=36 PRZEZYTYCH=0.
- `run-k04-units.mjs`: 22 przyp., OK 21, ROZNICA 0, ROZNICA_ZALOZONA 1 (K04-Z2). `run-k04-units-b2.mjs`: 17/17.
- Pin: `git archive edb8fb56 gra/src gra/data` do katalogu w scratchpadzie (poza repo).
BLOKADY: brak.
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Evaluator r2 na ten sam ID, potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Zarzut 1 (kontrakt komend) — PRZYJMUJĘ
- Stan przed: `k04b-queue.ts` zwracał `kind: 'enqueue_build'` z polami `itemKind/itemId/upgrade`; `controller/commands.ts:42` ma `enqueue_build` z `item: string`. `reorder_build` nie istniał w `commands.ts` (grep potwierdza: tylko komentarze w k04b-queue.ts). Typecheck przechodził, bo typy były rozłączne.
- Poprawka:
  1. `controller/commands.ts`: dopisek wariantu `enqueue_build_item` (`owner, city, itemKind: ProductionItemKind, itemId, upgrade`) do `ProposedCommand`. Istniejącego `enqueue_build` nie zmieniano (dopiski only); ujednolicenie = batch 4 / podpinanie kontrolera.
  2. `k04b-queue.ts`: `EnqueueBuildCommand = Extract<ProposedCommand, {kind:'enqueue_build_item'}>` (typ wyprowadzony z kontraktu, nie duplikat); zwracany literał ma `kind: 'enqueue_build_item'`.
  3. Przeciąganie: zamiast duplikatu `reorder_build` użyty istniejący wariant katalogu `move_build` (`from`/`to`), helper `reorderBuildCommandK04b` (`ReorderBuildCommand = Extract<ProposedCommand,{kind:'move_build'}>`). ZAŁOŻENIE K04B-Z6 zapisane w P5-8-K04B.md.
- Dowód: negatywny test typów (wyżej). Harness nie porównuje pola `kind` (porównuje itemId/itemKind/upgrade), więc 98/98 bez zmian.
- Wpis w `PORTING-QUEUE.md` i tabela w `P5-8-K04B.md` zaktualizowane (`enqueue_build_item`, `move_build`).

### Zarzut 2 (pola DTO bez producenta; brak weryfikacji splitu z suwakiem) — ODRZUCAM (część o producencie), PRZYJMUJĘ notę o granicy
- Dowód braku producenta jest faktem: `grep` po `src/` i `tools/` znajduje `podzialPracaSplit` i `unitResourceUpkeepById` tylko w `viewmodel/types.ts:446,448` oraz w konsumentach `k04b-*`. Identycznie dla precedensu K04 batch 2: `ownedLevels` i `upkeepById` (`types.ts:442,444`) nie mają producenta poza `k04-*`. To nie jest luka specyficzna dla K04B, tylko świadome założenie kontraktu DTO: silnik Rust wypełnia pola (K04-Z3, K04B-Z1, K04B-Z2). Dispatch wprost: DTO/mapowanie rozstrzygamy ZAŁOŻENIEM, bez BLOCK. Wypełnianie DTO z silnika poza zakresem UI (P5.13).
- Część „cityPracaSplitK04b nie sprawdza zgodności splitu z suwakiem": ODRZUCAM jako wymóg tego tematu. Weryfikacja wymagałaby ponownego wyliczenia `splitPraca` w UI, czyli naruszenia P5.13. Zgodność wartości z silnikiem jest jawnie NIE_ZMIERZONO (K04B-Z1). Odnotowane jako granica w P5-8-K04B.md; kontrola należy do testów integracyjnych po stronie Rust.

### Zarzut 3 (97 vs 98) — PRZYJMUJĘ (korekta dokumentów; przyczyna 97 NIE_USTALONA)
- `run-k04b-units.mjs` powstał w `ab973357` i nie był zmieniany (`git log -- .../run-k04b-units.mjs` = ab973357, 6c2c994a). Bieżący harness w tym drzewie daje 98 przy dwóch przebiegach. Liczba 97 z raportu operatora-impl (`01-operator-r1.md:15`) i z `P5-8-K04B.md` nie daje się odtworzyć na żadnym commicie harnessu; najbardziej prawdopodobnie była to ręcznie wpisana liczba. To jest hipoteza, nie ustalenie; NIE_ZMIERZONO.
- Poprawka: `P5-8-K04B.md` (pomiar Operator r1) zmieniony na 98 z odsyłaczem do tej sekcji. Raport `01-operator-r1.md` jest historyczny i nie był edytowany.

## Korekty względem poprzedniego stanu
- Nazwa komendy dodania: `enqueue_build` → `enqueue_build_item` (w `P5-8-K04B.md` tabela i Z5, `PORTING-QUEUE.md`).
- Nazwa komendy przeciągnięcia: `reorder_build` → `move_build` (Z6).
- Liczba przypadków batch 3: 97 → 98.

# R-SZCZESCIE-AUDYT-C-PRAWO-I-OSIEDLA-Q1 — Operator, RUNDA 4

## Zgodnosc z ratyfikacja #2 (decision-abc.md) — cytaty

`decision-abc.md` (RATYFIKACJA ORKIESTRATORA #2): "Dodaj slowo kluczowe `export` do dwoch
juz istniejacych, prywatnych funkcji czystych: `pctFromNetto` (ok. linii 503) i `clampPct`
(ok. linii 498) w `gra/src/game/society-breakdown.ts`. **Zero zmiany zachowania**". Wykonane
doslownie — patrz diff nizej, dwie linie, zero innej zmiany.

"Następnie OBIE bramki (`society-breakdown-test.cjs` I `szczescie-skala-normalizacja-test.cjs`)
maja zaimportowac te dwie funkcje i uzyc ich PRAWDZIWEJ implementacji do wyliczenia wartosci
oczekiwanych, zamiast literalu (Opcja 1) LUB duplikatu wzoru (Opcja 2/zarzut 2 rundy 2)."
Wykonane w obu plikach — patrz sekcja ZMIANY.

"Allowlista tego tematu zostaje NINIEJSZYM rozszerzona o: `gra/src/game/society-breakdown.ts`
— WYLACZNIE dodanie `export` przed `function clampPct` i `function pctFromNetto`, zero innych
zmian w tym pliku." Zweryfikowane grepem PRZED edycja (patrz ponizej) i diffem PO.

## Weryfikacja PRZED edycja (SS2b + grep dokladnych linii)

```
$ git log -1 (worktree)
55846e5337ac78bf85d1829602279dc9be866942  <- zgodne z dispatchem

$ grep -n "^function clampPct\|^function pctFromNetto" gra/src/game/society-breakdown.ts
498:function clampPct(x: number, cap: number): number {
503:function pctFromNetto(netto: number, max: number, cap: number): number {
```
Linie zgodne z dispatchem ("ok. linii 498" / "ok. linii 503").

## ZMIANY

1. `gra/src/game/society-breakdown.ts` — dodano `export` przed obiema funkcjami, zero innych
   zmian (diff = tylko te dwa slowa, zweryfikowane `git diff`).
2. `gra/tools/society-breakdown-test.cjs` — usunieto literal celu PorPct (78,9/55,4/43,6).
   Cel PrawPct liczony teraz `M.pctFromNetto(bonus Osiedla z real. `pickOsiedlePopBonus`,
   real. `M.prawMaxForCity`, `scale.prawPctCap`)`; cel PorPct liczony `M.clampPct(wS*SzPct +
   wP*targetPrawPct, cap)` z wagami/capem z real. `M.loadOrderParams`. Dodano cross-check
   asercje `PrawPct produkcyjny == pctFromNetto(...)` (3 nowe, po jednej na trudnosc).
   53 -> 56 asercji (wzrost, zero regresji).
3. `gra/tools/szczescie-skala-normalizacja-test.cjs` — usunieto duplikat formuly
   `Math.min(cap, Math.round(100*netto/max*10)/10)` w dwoch miejscach (blok 1c i blok 6),
   zastapiono `M.pctFromNetto(netto, max, cap)` (import). Usunieto komentarz o "duplikacie
   wymuszonym allowlista" (nieaktualny). 148 asercji bez zmian liczby, formula ta sama tresc
   liczbowa.

## TESTY

- `tsc --noEmit`: 0 bledow.
- `node tools/society-breakdown-test.cjs`: 56 OK, 0 FAIL (bylo 53 OK).
- `node tools/szczescie-skala-normalizacja-test.cjs`: 148 OK, 0 FAIL (bez zmian liczby).
- `node tools/szczescie-audyt-c-prawo-osiedla-test.cjs` (nie modyfikowany): 15 OK, 0 FAIL.
- 5 bramek referencyjnych: logic-test 213/213, tech-tree-test 19/19, research-test 33/33,
  unit-replace-test 13/13, combat-test 6/6 — wszystkie zielone.

### Dowod mutacyjny (zgodnie z binarnym kryterium sukcesu)

Tymczasowa mutacja `clampPct` -> `return 0;` (przywrocona natychmiast po tescie, `git diff`
po przywroceniu identyczny jak przed mutacja — tylko dwa `export`):
- `society-breakdown-test.cjs`: 47 OK, **9 FAIL** (bylo 56/0).
- `szczescie-skala-normalizacja-test.cjs`: 119 OK, **29 FAIL** (bylo 148/0).

Obie bramki zaczerwienily sie pod ta sama mutacja tej samej, prawdziwej funkcji — dowod, ze
import faktycznie dziala (nie zbieg okolicznosci literalu/duplikatu). Po przywroceniu obie
bramki ponownie zielone (56/0, 148/0), tsc 0 bledow, 5 bramek referencyjnych zielone.

## BLOKADY

Brak.

## RUNDY

4/5.

## NASTEPNY KROK

Evaluator, RUNDA 4.

---

STATUS: PASS
DOMAIN: GAME
TEMAT: R-SZCZESCIE-AUDYT-C-PRAWO-I-OSIEDLA-Q1
GOAL: Eksport `clampPct`/`pctFromNetto` z `society-breakdown.ts` (zero zmiany zachowania) i
zastapienie literalu/duplikatu formuly w obu bramkach Prawa/Porzadku prawdziwym importem.
ZMIANY/COMMIT: gra/src/game/society-breakdown.ts (2x export), gra/tools/society-breakdown-test.cjs,
gra/tools/szczescie-skala-normalizacja-test.cjs — commit nastapi zaraz po tym raporcie.
TESTY: tsc --noEmit 0 bledow; society-breakdown-test 56/0 (bylo 53/0); szczescie-skala-normalizacja-test
148/0; szczescie-audyt-c-prawo-osiedla-test 15/0 (niemodyfikowany); 5 bramek referencyjnych zielone;
dowod mutacyjny clampPct->0 zaczerwienil obie bramki tematu (9 i 29 FAIL), przywrocone do zielonego.
BLOKADY: brak.
RUNDY: 4/5.
NASTEPNY KROK: Evaluator, RUNDA 4.
DEPLOY/PUSH: NIE WYKONANO

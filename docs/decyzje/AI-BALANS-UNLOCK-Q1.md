# AI-BALANS-UNLOCK-Q1 — odblokowanie strojenia AI

**Status:** 🟢 ECHO **B** (2026-08-05) — wolno małe kroki AutoBot  
**Supersede częściowe:** `AI-PLAYTEST=B+A` w `R-SOLO-ABC.md` — metryki nadal OK; **zakaz ślepego buffa** zostaje, ale **małe strojenie liczb** dozwolone po ECHO tego ID.

## ECHO

| ID | Odpowiedź | Skutek |
|----|-----------|--------|
| **AI-BALANS-UNLOCK-Q1** | **B** | Odblokuj strojenie teraz (małe kroki + AutoBot + testy) |

## Reguła operacyjna

1. Wolno zmieniać **liczby** w `ai-params.json` / stałe absorb / early — **jedna mała dźwignia na falę**, z testem.
2. Nadal ZAKAZ: przebudowa systemów AI „przy okazji”, buff MP, cheatów gracza.
3. Preferuj pomiar Diag przed dużymi skokami; mały krok bez Diag OK jeśli uzasadniony w AC.
4. Ten batch: **odblokowanie w docs** — pierwsza liczba dopiero gdy jest konkretny AC (nie kręć w ciemno w tym samym PR co F2, chyba że osobny mały AC).

## Evaluator (AutoBot warstwa 2 — 2026-08-05)

**Werdykt:** **PASS**  
**Tip:** `68e2b04` · branch `cursor/feat-absorb-f2-celownik-63a1`

| # | Oś | Wynik |
|---|-----|-------|
| 1 | SCOPE — docs only: ten plik + wpis supersede w `R-SOLO-ABC.md` | ✅ |
| 2 | NO-SIDE-EFFECT — **zero** zmian `ai-params.json` / `panele-sterowania/` w commicie | ✅ |
| 3 | AC — reguła operacyjna B zapisana; supersede częściowy AI-PLAYTEST | ✅ |
| 4 | STRICT — brak liczb balansu w diff `68e2b04` (7 plików) | ✅ |
| 5 | Bramki — `tsc --noEmit` 0 (brak zmian kodu balansu) | ✅ |

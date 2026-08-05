# D-DYPLO-CELOWNIK-Q1 — celownik → stolica

**Status:** 🟢 WDROŻONE (batch AutoBot 2026-08-05)  
**Recon:** w kodzie FALA 240+ już są `dipCapitalLocateBtnHtml` + `onFocusCapital` / `handleDiploFocusCapital` (audiencja + lista).

## ECHO

| ID | Odpowiedź | Skutek |
|----|-----------|--------|
| **D-DYPLO-CELOWNIK-Q1** | **A** | Wdrażaj / domknij teraz |

## AC — dowód

1. ✅ Przycisk celownika na karcie rozmówcy (audiencja) i na wierszu listy dyplo.
2. ✅ Klik → zamyka overlay dyplo → kamera na stolicę ownera.
3. ✅ Gdy brak stolicy / nieznana: **hint** (`showHintMessage`) — nie ciche no-op.
4. Wiring zweryfikowany w kodzie (bez nowego testu DOM).
5. ZAKAZ zmiany logiki dyplomacji / absorb — dotknięto tylko hint w `focusCameraOnOwnerCapital`.

## Pliki-dowody

| Plik | Rola |
|------|------|
| `gra/src/ui/diploUiSkin.ts` | `dipCapitalLocateBtnHtml` — ikona celownika |
| `gra/src/ui/diplomacyAudience.ts` | przycisk + `cfg.onFocusCapital?.(cfg.ownerId)` |
| `gra/src/ui/diploListHud.ts` | przycisk na wierszu listy + `onFocusCapital` |
| `gra/src/main.ts` | `handleDiploFocusCapital`, `focusCameraOnOwnerCapital` (hint przy braku stolicy) |

**Hinty (brak stolicy):**
- brak `capId` → „Brak stolicy na mapie — to państwo nie ma jeszcze miasta-stolicy."
- brak miasta na mapie → „Stolica niedostępna — miasto mogło zostać zdobyte lub zniszczone."

## Evaluator (AutoBot warstwa 2 — 2026-08-05)

**Werdykt:** **PASS**  
**Tip:** `68e2b04` · branch `cursor/feat-absorb-f2-celownik-63a1`

| # | Oś | Wynik |
|---|-----|-------|
| 1 | SCOPE — tylko hint w `focusCameraOnOwnerCapital`; brak zmian logiki dyplo/absorb | ✅ |
| 2 | AC — `showHintMessage` przy braku `capId` i braku miasta na mapie | ✅ |
| 3 | WIRING — `dipCapitalLocateBtnHtml` + `onFocusCapital` w audiencji i liście; `handleDiploFocusCapital` zamyka overlay | ✅ |
| 4 | STRICT — brak testu DOM zgodnie z AC; weryfikacja kodowa hintów | ✅ (AC wyjątek) |
| 5 | STRICT-EDGE — dwa komunikaty rozróżniają brak stolicy vs niedostępność | ✅ |
| 6 | STRICT-PARITY — działa dla gracza i AI (ownerId dowolny) | ✅ |
| 7 | STRICT-SAVE — zero nowych pól | ✅ |
| 8 | Bramki — `tsc --noEmit` 0 | ✅ |

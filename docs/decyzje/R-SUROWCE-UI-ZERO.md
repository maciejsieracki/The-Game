# R-SUROWCE-UI-ZERO — surowce widoczne przy stanie 0

**Status:** ✅ **ZDEPLOYOWANE** `b5ba1b0` · FALA 8 (2026-07-24)  
**Decyzja:** **C-SURUI-Q1 = A** — pokazuj kluczowe surowce także przy 0  
**Zgłoszenie:** Maciej 2026-07-24 — „mockupów nie ma w grze"; pasek miasta i magazyn imperium znikały przy pustej puli na starcie.

**Powiązane:** `R-SUROWCE-DOSTEP` (2026-07-26, wiersze dostępu zawsze widoczne) · `REJESTR-PROSB-I-ZADAN.md` §FALA 8

---

## ECHO

**C-SURUI = A** — rdzeń drewno+kamień w pasku miasta **zawsze** (także przy 0); magazyn imperium bez placeholdera przy pustej puli — realny widok magazynu od tury 1.

---

## Dowód (spot-check 2026-08-05)

| Obszar | Wymaganie | Stan | Plik / funkcja |
|--------|-----------|------|----------------|
| Pasek miasta | Drewno + kamień przy 0 | ✅ | `cityPanel.ts` — `CS_RES_STRIP_CORE`, `appendCityResourceStockStrip`: `.filter(e => e.v > 0 \|\| CS_RES_STRIP_CORE.has(e.k))` (~L5267–5283) |
| Panel imperium | Brak placeholdera przy 0 | ✅ | `main.ts` `buildEmpireResourceRows` zwraca pełny katalog (stock=0, cap ustawiony) → `empireDetailPanel.ts` `renderSurowceSection` renderuje grid magazynowanych; placeholder tylko gdy `rows.length === 0` (ścieżka martwa w normalnej grze) (~L2290–2374, ~L726–776) |

**Gameplay:** bez zmian w tej paczce — wdrożenie już w FALA 8.

---

## Zamknięcie

Wiersz rejestru `R-SUROWCE-UI-ZERO` był **STALE (NOWE)** mimo deployu `b5ba1b0`. Zamknięty audytem AutoBot — kod zgodny z C-SURUI=A, brak dodatkowego deployu.

# R-WIARYGODNOSC — Etap 0 (typy / struktury) — status 2026-08-05

**Status:** 🟢 **ZAMKNIĘTE** — typy FALA 233; pełny mechanizm ZDEPLOYOWANE (audyt `R-WIARYGODNOSC-AUDIT-OPEN-VS-DEPLOYED-2026-08-05.md`).  
**Decyzja:** WIAR-START=A — Etap 0 przed strumieniem Dźwigni 1.  
**Spec:** `dyspozycje/WIARYGODNOSC-SPECYFIKACJA.md`

## Co jest w repo

| Artefakt | Status | Uwagi |
|----------|--------|-------|
| `gra/src/game/wiarygodnosc-types.ts` | ✅ NOWY (Etap 0) | Skala −100…+100, `WiarygodnoscBand`, `WiarygodnoscEventTyp`, `WiarygodnoscEventRecord` — **bez** S1–S4, **bez** tick |
| `gra/src/game/diplomacy-credibility.ts` | ✅ Istniejący (Etap 1+) | Pełny moduł: zapominanie, strumień, dźwignie 1/4, suma całkowita |
| `gra/data/diplomacy.json` | ✅ | Stałe `wiarygodnosc_*` w parametrach |
| `gra/tools/wiarygodnosc-test.cjs` | ✅ | Testy modułu credibility |
| Save/load `meta.wiarygodnosc*` | ✅ w `main.ts` | Poza zakresem Etapu 0 (już wdrożone) |

## Etap 0 — zakres zamknięty

- Typy jednorazowych zdarzeń (N1–N7 + nagrody) — `wiarygodnosc-types.ts`
- Strumień S1–S4 i Dźwignia 1 — **nie** w Etapu 0; implementacja w `diplomacy-credibility.ts` + `main.ts`
- UI badge / ranking — osobne zlecenie (§7 spec)

## Następny krok (po powrocie Macieja)

Przegląd Dźwigni 2–4: `docs/decyzje/R-WIARYGODNOSC-DZWIGNIE-2-4-PRZEGLAD.md` — rekomendacje do akceptacji przed pełnym strumieniem D1.

# CYWILIZACJE → UI: panel dyplomacji — modal wojny (D3-Q1=A)

**Status:** GOTOWE — czeka dyspozycja Master → UI  
**Decyzja Macieja:** **D3-Q1=A** (2026-06-27)

---

## Co przesyłam

Panel dyplomacji v1.0 (**decyzja 4B**): pełne akcje gracza. Model `diplomacy.ts` gotowy (tick AI, Respekt, tier). Panel dziś = **podgląd**.

**D3-Q1=A:** przycisk „Wypowiedz wojnę" → **modal** z tekstem typu *„Wypowiesz wojnę [Nacja]?"* i przyciskami **Tak / Anuluj**. Dopiero **Tak** wywołuje hook SILNIK (zmiana `StanWojny`).

Plik: `gra/src/ui/diplomacyPanel.ts`

---

## Co Odbiorca ma zrobić

1. Dodać przyciski akcji: wojna, pokój, handel/sojusz (zgodnie z `diplomacy.json` akcje).
2. Wojna: modal potwierdzenia (D3-Q1=A) przed callbackiem.
3. Callbacki → SILNIK (handoff osobny po UI mock).
4. Test wizualny + `diplomacy-test.cjs` bez regresji.

---

## DoD

- [ ] Modal wojny A — Tak/Anuluj
- [ ] Pozostałe akcje bez modala (chyba że Master zdecyduje inaczej)
- [ ] Meldunek UI-DO-MASTERA + `→ SILNIK: GOTOWE`

*— Grupa D, 2026-06-27*

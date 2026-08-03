# R-WIARYGODNOSC — paczka ABC §9 (2026-08-03)

## ECHO — komplet (2026-08-03)

| ID | Odpowiedź | Treść |
|----|-----------|--------|
| **R-WIARYGODNOSC-DZWIGNIA2-Q1** | **A** | Bez Dźwigni 2 (sufitu Zaufania zależnego od W). Zostaje strumień W/20 + progi (D3) + pierwszy kontakt (D4). |
| **R-WIARYGODNOSC-NAP-BEZTERMIN-Q1** | **A** | NAP: wybór terminowy (10–20 tur) **lub** bezterminowy |
| **R-WIARYGODNOSC-START-ETAP-Q1** | **A** | Etap 0–2 od razu: typy/save + kary/nagrody + Dźwignia 1 + NAP wg decyzji |

Cytaty: `…NAP-BEZTERMIN-Q1a` · `…START-ETAP-Q1a` · `R-WIARYGODNOSC-DZWIGNIA2-Q1 a`

## Konsekwencje wdrożenia

1. **Dźwignia 1** — `ΔZaufanie/turę = W/20` w `tickDiplomacy` (nie wobec aktualnego wroga — C-WIAR-WROG=A).
2. **Bez Dźwigni 2** — nie budować sufitu Zaufania zależnego od W.
3. **Dźwignia 3** — progi Sojusz W≥0, NAP W≥−40.
4. **Dźwignia 4** — startowe Zaufanie od W przy pierwszym kontakcie.
5. **NAP** — UI/silnik: wariant `turns` albo `bezterminowy` (`wygasaTura: null`).

**Status wdrożenia (2026-08-03):** 🟢 Etap 0–2 w kodzie na branchu `cursor/wiarygodnosc-dzwignia2-a-63a1` — state/save/load, D1 (main.ts AI tick), D3 (`evaluateProposal`), D4 (`diplomacy-layers`), NAP bezterminowy (silnik + checkbox UI), badge W w audiencji. **Bez deploy ROBOCZA.** **TODO:** modale N1–N7 (ostrzeżenia przed karą), ranking Potęgi, pełny rejestr czynników UI.

Źródło: `dyspozycje/WIARYGODNOSC-SPECYFIKACJA.md` §5, §5a, §9.

# R-AUTO-RACJE-RAISE — auto-podnoszenie Wyżywienia + podłoga Spichlerza

**Status:** 🟡 ZAPISANA (Q1=B wdrożone w kodzie branch; Q2–Q4 — **czekają odpowiedzi Macieja**)  
**Data:** 2026-08-04  
**Źródło:** Maciej (playtest FALA 224) + doprecyzowanie po Q1=B

---

## Problem (Maciej)

1. Koniec tury **podnosi** Wyżywienie/rozwój mimo niskiego Spichlerza → potem głód miast → **−1 ludność**.
2. Ten sam mechanizm dotyczy **AI** (major) — AI też może obniżać ludność przez agresywny raise.
3. **Spichlerz nigdy nie powinien spadać poniżej zera.**
4. **Nie powinno dać się** podnieść zużycia (suwak w mieście / auto) ponad to, co cywilizacja utrzyma bez ujemnego Spichlerza na następną turę.

Powiązane: `SPICH-AUTO-Q1` (FALA 212) — auto-**obniżanie** przy deficycie — zostaje.

---

## Q1 (zamknięte) — kto dostaje soft raise

**Odpowiedź Macieja:** **B**

- Gracz: raise tylko przy nadwyżce produkcji miast (`requireProductionSurplus`).
- AI major: bez tej bramki (jak było).

**Uwaga Macieja po Q1:** B nie wystarcza — AI też szkodzi; potrzeba twardej podłogi Spichlerza ≥ 0 i limitu suwaka.

---

## [PACZKA 1/1 — 3 pytania] Q2 · Q3 · Q4

### Q2 — Auto-raise (gracz + AI): twarda podłoga Spichlerza ≥ 0

**Sytuacja:**  
`autoRaiseRationsForGrowth` podnosi Wyżywienie w miastach, jeśli po kroku zapasy Spichlerza ≥ `minStockFloor` (domyślnie 0) **i** (dla gracza od Q1=B) jest nadwyżka produkcji. AI major nadal może podnosić z zapasów przy zerowej nadwyżce produkcji — wtedy **wypompowuje Spichlerz** i w kolejnej turze miasta mogą nie dostać żywności → **spadek ludności**. Maciej: raise może podnosić, ale **tylko do poziomu, przy którym Spichlerz nie zejdzie poniżej zera**.

**Cel pytania:**  
Czy auto-raise (gracz **i** AI) ma zawsze zatrzymać się tak, by po podniesieniu prognozowany Spichlerz ≥ 0 — bez wyjątku „ujemne zapasy na głód wojska”?

**Dlaczego teraz:**  
Bez tego AI i gracz mogą budować / podnosić rozwój, a ludność spada zamiast rosnąć.

**A — Twarda podłoga 0 w auto-raise (gracz + AI), bez wyjątku**  
Przy każdym kroku raise: jeśli po podniesieniu `zapasy + nadwyżka − koszt` < 0 → **nie podnosić** (stop). Dotyczy gracza i AI major tak samo.  
**Za:**  
1. Spełnia wprost: „podwyższa, ale tylko żeby nie było w Spichlerzu mniej niż zero”.  
2. AI nie obniża sobie ludności agresywnym raise.  
**Przeciw:**  
1. AI wolniej dogania max Wyżywienia przy niskich zapasach.  
2. Głód wojska z ujemnego Spichlerza (osobna reguła w `advanceEmpireFood`) może zostać sprzeczny z tą podłogą — wtedy Q4.

**B — Podłoga 0 + AI jak gracz (tylko przy nadwyżce produkcji)**  
Jak A, plus AI też wymaga `nadwyzka > 0` (nie raise z samego zapasu).  
**Za:**  
1. Jeszcze bezpieczniej dla AI.  
2. Spójne z Q1=B dla gracza.  
**Przeciw:**  
1. AI prawie nigdy nie podnosi przy buforze-only.  
2. Wolniejszy powrót AI do wzrostu po kryzysie.

**C — Zostaw soft floor jak dziś (możliwy raise przy zapasach > 0 nawet bez nadwyżki u AI)**  
Tylko dokumentacja / drobne progi.  
**Za:**  
1. Zero zmiany zachowania AI.  
2. Najmniej kodu.  
**Przeciw:**  
1. Nie rozwiązuje obawy Macieja o AI.  
2. Nadal ryzyko spadku ludności.

**Rekomendacja:** **A** — twarda podłoga 0 w auto-raise dla gracza i AI; AI może nadal raise z zapasów, byle nie poniżej zera.

---

### Q3 — Suwak miasta: limit max Wyżywienia

**Sytuacja:**  
Gracz może ręcznie ustawić suwak Wyżywienie/rozwój wysoko; w następnej turze koszt żywności może **zepchnąć Spichlerz poniżej zera** (dziś ujemne zapasy są dozwolone w `advanceEmpireFood`). Maciej: nie powinno być możliwości zwiększenia zużycia ponad limit Spichlerza cywilizacji — de facto max suwaka = najwyższy poziom, przy którym następna tura **nie** zrobi Spichlerza < 0.

**Cel pytania:**  
Czy UI / walidacja ma **blokować** ustawienie Wyżywienia powyżej maksymalnego bezpiecznego poziomu dla cywilizacji?

**Dlaczego teraz:**  
Sam auto-raise nie wystarczy — gracz może nadal „przekręcić” suwak i dostać spadek ludności.

**A — Cap suwaka = max bezpieczny poziom (prognoza Spichlerz ≥ 0)**  
Przy zmianie suwaka (i przy starcie tury): clamp Wyżywienia do najwyższego poziomu, przy którym `zapasy + produkcja − koszt` ≥ 0. Komunikat w UI gdy gracz próbuje wyżej.  
**Za:**  
1. Spełnia „nie ma możliwości zwiększenia zużycia ponad limit”.  
2. Spójne z Q2.  
**Przeciw:**  
1. Więcej logiki UI + testów.  
2. Przy wahaniach produkcji max „skacze” — trzeba czytelnego feedbacku.

**B — Cap tylko ostrzeżenie (żółty), suwak nadal pozwala wyżej**  
Gracz może ustawić ryzykownie; tooltip/ostrzeżenie.  
**Za:**  
1. Pełna kontrola gracza.  
2. Mniej twardej logiki.  
**Przeciw:**  
1. Maciej wprost nie chce możliwości zejścia poniżej zera.  
2. Łatwo zignorować ostrzeżenie.

**C — Bez limitu suwaka (tylko auto-raise z Q2)**  
**Za:**  
1. Zero UI.  
2. Szybkie.  
**Przeciw:**  
1. Nie spełnia wymogu Macieja.  
2. Nadal ręczne „zjedzenie” Spichlerza.

**Rekomendacja:** **A**

---

### Q4 — Spichlerz: czy w ogóle może być < 0?

**Sytuacja:**  
Dziś w `advanceEmpireFood`: po rozliczeniu żywności `if (central < 0) central = central` — **ujemne zapasy dozwolone** (komentarz: głód wojska). Maciej: **Spichlerz nigdy nie powinien spadać poniżej zera.**

**Cel pytania:**  
Czy twardo clampować zapasy Spichlerza do ≥ 0 zawsze, i jak wtedy liczyć głód wojska / miast?

**Dlaczego teraz:**  
Bez tego Q2/Q3 to tylko „staranie się” — silnik i tak może wejść na minus.

**A — Twardy clamp Spichlerz ≥ 0 zawsze; głód bez ujemnego salda**  
Po rozliczeniu: `zapasy = max(0, zapasy)`. Głód miast/wojska liczony z **niedoboru w tej turze** (ile żywności zabrakło), nie z ujemnego bufora między turami.  
**Za:**  
1. Spełnia wprost słowa Macieja.  
2. Prosty model mentalny dla gracza.  
**Przeciw:**  
1. Trzeba przepiąć logikę głodu wojska z „ujemnego Spichlerza”.  
2. Większy zakres zmian + testów.

**B — Clamp ≥ 0 w UI/raportach; w silniku krótki minus tylko wewnętrznie w tej samej turze**  
Po turze zawsze ≥ 0; w trakcie rozliczenia chwilowy minus OK.  
**Za:**  
1. Blisko A bez wielkiej przebudowy.  
2. Spójny odczyt dla gracza.  
**Przeciw:**  
1. Nadal mylące dla debug.  
2. Półśrodek.

**C — Zostaw ujemny Spichlerz (głód wojska jak dziś)**  
**Za:**  
1. Zero regresji głodu wojska.  
2. Najmniej kodu.  
**Przeciw:**  
1. Sprzeczne z Maciejem.  
2. Q2/Q3 słabsze.

**Rekomendacja:** **A**

---

## Odpowiedzi (do uzupełnienia)

| ID | Odpowiedź | Data |
|----|-----------|------|
| Q1 | **B** | 2026-08-04 |
| Q2 | — | — |
| Q3 | — | — |
| Q4 | — | — |

**Hasło wdrożenia całej paczki Q2–Q4:** np. `R-AUTO-RACJE-RAISE-Q2A-Q3A-Q4A` albo `działaj` po odpowiedziach.

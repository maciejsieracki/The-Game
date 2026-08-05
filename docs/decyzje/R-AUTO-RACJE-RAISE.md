# R-AUTO-RACJE-RAISE — auto-podnoszenie Wyżywienia + podłoga Spichlerza

**Status:** 🟢 ZDEPLOYOWANE FALA 225 (`8767b9c0`) — Q1=B · Q2–Q5=A (Maciej 2026-08-05)  
**Data:** 2026-08-04  
**Źródło:** Maciej (playtest FALA 224) + doprecyzowanie po Q1=B + przełącznik auto (2026-08-05)

---

## Problem (Maciej)

1. Koniec tury **podnosi** Wyżywienie/rozwój mimo niskiego Spichlerza → potem głód miast → **−1 ludność**.
2. Ten sam mechanizm dotyczy **AI** (major) — AI też może obniżać ludność przez agresywny raise.
3. **Spichlerz nigdy nie powinien spadać poniżej zera.**
4. **Nie powinno dać się** podnieść zużycia (suwak w mieście / auto) ponad to, co cywilizacja utrzyma bez ujemnego Spichlerza na następną turę.
5. Powinien być **przycisk / przełącznik przy Spichlerzu** — czy gracz chce **automatyczne zarządzanie** (sam obniża i podnosi Wyżywienie wg sytuacji) — **w każdym mieście**.

Powiązane: `SPICH-AUTO-Q1` (FALA 212) — auto-**obniżanie** przy deficycie — zostaje (ale u gracza tylko gdy auto WŁ).

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

## [PACZKA 2/2 — 1 pytanie] Q5

### Q5 — Przełącznik auto zarządzania Wyżywieniem / Spichlerzem w każdym mieście

**Sytuacja:**  
Dziś auto-obniżanie (`SPICH-AUTO`) i auto-podnoszenie (`autoRaiseRationsForGrowth`) działają **bez zgody gracza** na koniec tury — stąd „męczący” efekt podnoszenia mimo ręcznego obniżenia. Maciej: przy Spichlerzu / sekcji Wyżywienie ma być **przycisk**, czy gracz chce **automatyczne zarządzanie Spichlerzem**, które **samodzielnie obniża i podwyższa** poziom Wyżywienia w zależności od sytuacji — **w każdym mieście osobno**.

**Cel pytania:**  
Czy auto (raise + lower) u gracza ma być **opcją per miasto**, a nie zawsze-włączone?

**Dlaczego teraz:**  
Bez tego Q2–Q4 naprawiają podłogę Spichlerza, ale nie dają kontroli „chcę / nie chcę auto”.

**A — Przełącznik per miasto; domyślnie WYŁ u gracza**  
W panelu miasta (przy Wyżywienie / Spichlerz): przełącznik np. „Auto Wyżywienie”. **WŁ:** EOT obniża i podnosi wg reguł Q2–Q4 (Spichlerz ≥ 0). **WYŁ:** pełna ręczna kontrola suwaka — zero auto raise/lower dla tego miasta. Nowe miasta gracza: **WYŁ**. AI major: zawsze auto (bez UI).  
**Za:**  
1. Kończy „męczące” podnoszenie — gracz włącza auto tylko gdy chce.  
2. Spełnia „w każdym mieście” + osobna polityka per miasto.  
**Przeciw:**  
1. Domyślnie WYŁ = mniej „opieki” dla nowych graczy (mogą zapomnieć obniżyć przy kryzysie).  
2. Trzeba zapisać flagę na `City` + UI.

**B — Przełącznik per miasto; domyślnie WŁ u gracza**  
Jak A, ale start / nowe miasta: **WŁ** (jak dzisiejsze zachowanie, dopóki gracz nie wyłączy).  
**Za:**  
1. Zachowanie bliskie obecnemu dla osób, które lubią auto.  
2. Kryzys: auto-lower nadal pomaga od razu.  
**Przeciw:**  
1. Maciej właśnie narzeka na auto raise — default WŁ znów zaskoczy.  
2. Trzeba wiedzieć, że da się wyłączyć.

**C — Jeden przełącznik dla całej cywilizacji (nie per miasto)**  
Globalny „Auto Spichlerz” w HUD / panelu państwa.  
**Za:**  
1. Prostsze UI (jeden przełącznik).  
2. Mniej stanu.  
**Przeciw:**  
1. Maciej powiedział wprost „w każdym mieście”.  
2. Nie da się auto w stolicy i ręcznie w kolonii.

**Rekomendacja:** **A** — per miasto, default WYŁ u gracza; AI zawsze auto.

---

## Odpowiedzi

| ID | Odpowiedź | Data |
|----|-----------|------|
| Q1 | **B** | 2026-08-04 |
| Q2 | **A** | 2026-08-05 — Maciej «działaj z wszystkimi» (= rekomendacje) |
| Q3 | **A** | 2026-08-05 |
| Q4 | **A** | 2026-08-05 |
| Q5 | **A** | 2026-08-05 |

**ECHO:** Zapisałem Q2–Q5 = A. Wdrażam w tej sesji (bez deploy do hasła `deploy`).

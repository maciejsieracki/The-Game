# R-PROC-AUTOBOT-ABC-TURNIEJ — Pytanie ABC jako turniej dwóch niezależnych projektów

**Status:** 🟢 **OBOWIĄZUJE** (Maciej 2026-08-08)
**Rodzic:** `R-PROC-AUTOBOT` · **Reguła Cursor:** `.cursor/rules/autobot-evaluator-operator.mdc`
**Playbook:** `playbook.md` → `C-018` · `dyspozycje/autobot/playbook.json` → `rule_126`

---

## ECHO (Maciej — cytat do zachowania)

> dwie kwestie: pierwsza rzecz, jeżeli masz pytania ABC zawsze przez drugiego ewaluatora rób sobie konkurs ty coś proponujesz, ale drugi ewaluator. Można to spojrzeć świeżym okiem. Także pytania ABC. Zawsze robimy tzw. turnament. Wygrywa ten, który zdaniem ewoluatora jest najlepszy.

## Cel

Jedna propozycja ABC (moja albo dowolnego agenta) ma martwy kąt — ten sam autor rzadko zauważa własne błędne założenie. Turniej wymusza drugą, NIEZALEŻNĄ parę oczu przed tym, jak pytanie w ogóle trafi do właściciela.

## Zasada

**Każde NOWE pytanie ABC**, formułowane od zera (czyli: temat, na który właściciel jeszcze nie odpowiedział literą), przechodzi przez trzy role zanim zostanie pokazane właścicielowi:

1. **Proponent 1** — orkiestrator (albo Operator, jeśli to on natrafił na temat) pisze pełny projekt ABC (Sytuacja / Cel pytania / Dlaczego teraz / warianty A-B-C z ≥2 Za i ≥2 Przeciw każdy / Rekomendacja).
2. **Proponent 2** — NIEZALEŻNY agent, **bez podglądu** projektu Proponenta 1 (dostaje tylko surowe fakty/dane źródłowe problemu, nie cudzą redakcję), pisze WŁASNY, osobny projekt ABC tego samego tematu.
3. **Sędzia** (rola Evaluatora w tym kontekście) — dostaje oba projekty, weryfikuje zgodność z danymi źródłowymi, ocenia kompletność wariantów i trafność Za/Przeciw, i wydaje werdykt: który projekt wygrywa, ALBO syntetyzuje finalną wersję łączącą mocne strony obu (dozwolone i często najlepsze wyjście). Tylko zwycięska/zsyntetyzowana wersja trafia do właściciela.

## Zakres wyjątku

**Nie dotyczy** pytań, na które właściciel **już odpowiedział wprost literą** — te tylko się ECHO'uje (potwierdza treść decyzji) i zapisuje do `dyspozycje/REJESTR-PROSB-I-ZADAN.md` + aktualizuje status w `dyspozycje/PYTANIA-OTWARTE.md`, bez turnieju (turniej dotyczy formułowania pytania, nie potwierdzania odpowiedzi).

**Nie dotyczy** czysto inżynierskich decyzji bez wpływu na gameplay/UX/dane widoczne dla gracza (np. „czy usunąć martwą funkcję i jak dopasować asercję testu") — te podejmuje bezpośrednio wykonawca (Operator/orkiestrator), zgodnie z zasadą projektu „nie twórz problemów, których nie ma" (CLAUDE.md, JAK PRACOWAĆ Z WŁAŚCICIELEM, pkt 7).

## Model

Proponent 2 i Sędzia — te same zasady przydziału modeli co reszta AutoBot (CLAUDE.md §4): Proponent 2 = Sonnet 5 (jak każdy Operator-wykonawca), Sędzia = Opus 5 (rola Evaluatora).

## Powiązane

- `docs/decyzje/R-PROC-AUTOBOT-EVAL-SCOPE.md` i siostrzane STRICT-* — analogiczna logika „druga para oczu przed werdyktem", tu zastosowana do formułowania pytania zamiast do oceny kodu.
- Pierwsze zastosowanie: `BUG-TOOLTIP-MOC-BUDYNKI-Q1`/`BUG-TOOLTIP-SKALA-OBRAZEN-PRZEBICIE` (2026-08-08) — oba niezależne projekty zbiegły się na tej samej rekomendacji (A), Sędzia zsyntetyzował finalną wersję.

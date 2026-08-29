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

1. **Proponent 1** — orkiestrator (albo Operator, jeśli to on natrafił na temat) pisze pełny projekt ABC (Sytuacja / Cel pytania / Dlaczego teraz / warianty A-B-C z ≥2 Za i ≥2 Przeciw każdy / Rekomendacja / Konsekwencje implementacyjne i testowe per wariant) **oraz wskazuje własny „typ"** — którą literę uważa za najlepszą, jednozdaniowe uzasadnienie odwołujące się wprost do `dyspozycje/PROFIL-DECYZYJNY-MACIEJ.md` (który wzorzec z profilu pasuje do kategorii tego tematu i dlaczego).
2. **Proponent 2** — NIEZALEŻNY agent, **bez podglądu** projektu Proponenta 1 (dostaje tylko surowe fakty/dane źródłowe problemu, nie cudzą redakcję), pisze WŁASNY, osobny projekt ABC tego samego tematu, **z własnym „typem"** na tych samych zasadach.
3. **Sędzia** (rola Evaluatora w tym kontekście) — dostaje oba projekty, ocenia dwuwarstwowo:
   - **Warstwa 1 (dominująca):** trafność rozpoznania kategorii tematu i jakość uzasadnienia „typu" względem `PROFIL-DECYZYJNY-MACIEJ.md` — czy Proponent poprawnie zastosował pasujący wzorzec, **nie** czy zgadł literę, którą wybierze właściciel (tego nie da się ocenić z góry).
   - **Warstwa 2 (niuanse, tiebreaker):** zgodność z danymi źródłowymi, kompletność wariantów, trafność Za/Przeciw, czy propozycja realnie domyka problem.

   Wydaje werdykt: który projekt wygrywa, ALBO syntetyzuje finalną wersję łączącą mocne strony obu (dozwolone i często najlepsze wyjście — np. trafniejszy „typ" z jednego, precyzyjniejsze niuanse z drugiego). Do właściciela idzie zwycięska/zsyntetyzowana wersja **z jawną adnotacją przy Rekomendacji**: „wg profilu: typowana [litera], bo [wzorzec]" — widoczna wprost, nigdy ukryta. **Adnotacja jest dodatkową informacją, nie gotową decyzją** — właściciel wybiera literę sam, zawsze pełne A/B/C z Za/Przeciw stoi obok.

**Powiązanie z `PROFIL-DECYZYJNY-MACIEJ.md`:** ten mechanizm jest jedynym dziś usankcjonowanym użyciem profilu poza kalibracją pytania — profil informuje „typ" i wagę Warstwy 1, ale **nigdy** nie zastępuje pytania, nie zawęża opcji A/B/C i nie zakłada wyboru właściciela za niego (`R-PROFIL-TURNIEJ-PUNKTACJA-Q1`, Maciej 2026-08-08 — zgoda na połączenie wariantów A+B z rozmowy o profilu decyzyjnym).

## Zakres wyjątku

**Nie dotyczy** pytań, na które właściciel **już odpowiedział wprost literą** — te tylko się ECHO'uje (potwierdza treść decyzji) i zapisuje do `dyspozycje/REJESTR-PROSB-I-ZADAN.md` + aktualizuje status w `dyspozycje/PYTANIA-OTWARTE.md`, bez turnieju (turniej dotyczy formułowania pytania, nie potwierdzania odpowiedzi).

**Nie dotyczy** czysto inżynierskich decyzji bez wpływu na gameplay/UX/dane widoczne dla gracza (np. „czy usunąć martwą funkcję i jak dopasować asercję testu") — te podejmuje bezpośrednio wykonawca (Operator/orkiestrator), zgodnie z zasadą projektu „nie twórz problemów, których nie ma" (CLAUDE.md, JAK PRACOWAĆ Z WŁAŚCICIELEM, pkt 7).

**Nie dotyczy** bezpośrednich ustaleń wypracowanych żywą rozmową z właścicielem — gdy właściciel sam kształtuje projekt w dialogu (zamiast odpowiadać literą na gotowy, cudzy projekt), turniej broni przed ślepym kątem jednego autora, a tu autorów jest już efektywnie dwóch. Przykład: `R-PROFIL-TURNIEJ-PUNKTACJA-Q1` (2026-08-08) — sama ta zmiana mechanizmu turnieju nie przechodziła turnieju C-018 z tego właśnie tytułu.

## Model

Proponent 2 i Sędzia — te same zasady przydziału modeli co reszta AutoBot (CLAUDE.md §4): Proponent 2 = Sonnet 5 (jak każdy Operator-wykonawca), Sędzia = Opus 5 (rola Evaluatora).

## Powiązane

- `docs/decyzje/R-PROC-AUTOBOT-EVAL-SCOPE.md` i siostrzane STRICT-* — analogiczna logika „druga para oczu przed werdyktem", tu zastosowana do formułowania pytania zamiast do oceny kodu.
- Pierwsze zastosowanie: `BUG-TOOLTIP-MOC-BUDYNKI-Q1`/`BUG-TOOLTIP-SKALA-OBRAZEN-PRZEBICIE` (2026-08-08) — oba niezależne projekty zbiegły się na tej samej rekomendacji (A), Sędzia zsyntetyzował finalną wersję.

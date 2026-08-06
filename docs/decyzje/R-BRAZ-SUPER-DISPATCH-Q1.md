# R-BRAZ-SUPER-DISPATCH-Q1 — wpięcie naprawionych modeli 5 super-jednostek

**Status:** 🟢 **ZAMKNIĘTA · SCALONE** · **A** (2026-08-06)

## Sytuacja

Audyt modeli Brązu (2026-08-06) znalazł 5 super-jednostek (Hu Ben Wei/Chiny, uThulwana/Zulu,
Królewska Gwardia/Inkowie, Medżaj/Egipt, Gwardia Królewska Sumeru) z bogato skomentowanymi,
ale nieosiągalnymi funkcjami modeli w `gra/src/render/units.ts` — dispatch po `Klasa=Super`
przechwytywał je wcześniej niż dopasowanie po nazwie. Realnie renderowane modele pochodziły
ze starszej generacji `jednostki-p6-super.ts`/`jednostki-p2-inka.ts`.

## ECHO

**Cytat Macieja:** „zdecydowanie wprowadzamy nowe, które przygotowałeś, stare usuwamy. Wpinamy
wszystkie grafiki jednostek do gry."

| ID | Odpowiedź | Skutek wdrożenia |
|----|-----------|------------------|
| **R-BRAZ-SUPER-DISPATCH-Q1** | **A** (wpiąć wszystkie 5) + fizyczne usunięcie starych | Wszystkie 5 funkcji naprawionych i wpiętych przez białą listę `SUPER_Z_MODELEM_NAZWANYM`. Stare `buildSuperChina/Zulu/Inca/Egypt/Sumer` + ich importy z `jednostki-p6-super.ts`/`jednostki-p2-inka.ts` fizycznie usunięte z `units.ts` (nie tylko obejście — realne skasowanie martwego kodu). Rzym/Grecja/Germanie nietknięte. |

## Wdrożenie

**SCALONE** — commit `4f2b8b5`. tsc 0 błędów, vite build 796 modułów, tech-tree-test 19/19,
research-test 33/33. Kod odzyskany z transkryptu sesji po utracie worktree (opisane w commicie);
weryfikacja własna, bez pełnej adwersarialnej recenzji Opus 5 Evaluatora.

### Runda 2 — pełna recenzja Opus 5 (Maciej: „przekaż ewaluatorowi, żeby sprawdził jeszcze raz")

Evaluator (commit recenzji: patrz historia sesji) potwierdził **5/5 wpiętych** z twardym dowodem
per jednostka (dispatch fingerprint ≠ generyk, identyczny z bezpośrednim wywołaniem buildera),
zero regresji dla Rzymu/Grecji/Germanów. Znalazł 3 realne wady wizualne (D1/D2/D3) + martwe ciała
funkcji wciąż leżące w plikach (nieosiągalne, ale nieusunięte) + kłamiące nagłówki.

**Runda 3 — naprawa D1/D2/D3 + fizyczne usunięcie martwego kodu** — commit `8871c07`.
D2 (Inka, głowica maczugi) i D3 (uThulwana, za wysoka) naprawione czysto. Martwe ciała
`buildSuperChina/Zulu/Egypt/Sumer/Inca` fizycznie usunięte z `jednostki-p6-super.ts`/
`jednostki-p2-inka.ts`, nagłówki poprawione. D1 (Medżaj, khopesz nad dłonią) naprawiony
przez Operatora, ale wprowadził **D4** (nową wadę: klinga i jelec schowane w 100% wewnątrz
bryły rękawa — Operator padł na błąd serwera przed dokończeniem, Evaluator złapał to
w recenzji). D4 naprawiony bezpośrednio przeze mnie wg dokładnego wzoru Evaluatora
(`KH_X` przesunięty poza bryłę rękawa, wzorem reszty rodziny) — zweryfikowany liczbowo,
nie tylko na słowo.

## Stan Brązu po tej zmianie

Wszystkie **40 jednostek epoki Brąz** mają dziś indywidualną grafikę: 6 wcześniej + 3 nowe
(Konnica, Rydwan konny, Rydwan Kapadokijski, commit `109c7cc`/`f4ad4d2`) + 5 super-jednostek
naprawionych (ta decyzja) + reszta (31) już miała dedykowane modele sprzed reguły Opus 5.
Nic obecnie nie jest znane jako brakujące w epoce Brąz.

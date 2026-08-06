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

## Stan Brązu po tej zmianie

Wszystkie **40 jednostek epoki Brąz** mają dziś indywidualną grafikę: 6 wcześniej + 3 nowe
(Konnica, Rydwan konny, Rydwan Kapadokijski, commit `109c7cc`/`f4ad4d2`) + 5 super-jednostek
naprawionych (ta decyzja) + reszta (31) już miała dedykowane modele sprzed reguły Opus 5.
Nic obecnie nie jest znane jako brakujące w epoce Brąz.

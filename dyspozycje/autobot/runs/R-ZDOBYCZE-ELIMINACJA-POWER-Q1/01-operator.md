# 01 — OPERATOR — runda 4

STATUS: PASS-WITH-NOTES
TEMAT: R-ZDOBYCZE-ELIMINACJA-POWER-Q1
GOAL: Popup eliminacji i stan gry prawidłowo przejmują oraz pokazują Skarbiec, Naukę, technologie i Power pokonanego państwa dla zwykłego przejęcia oraz kapitulacji głodowej.
RUNDY: 4/5

## Stan wejściowy i izolacja

- Checkout: `C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ-clean-main-2026-08-20`
- HEAD: `47cdca15757efb89d5e634e9e9ddff370925708d` (`47cdca15`), Fala 300.
- Przeczytane w tym clean checkout: `README.md`, oba lokalne `SKILL.md`, `00-dispatch.md`, poprzedni `01-operator.md` i `02-evaluator.md`; wykonano też recon procesu, handoffu, rejestru, diffu i kodu.
- Worktree jest zastanie nieczysty. Zmiany poza allowlistą pozostawiono bez dotykania; nie wykonano reset/checkout/clean.
- Dla tego ID nie ma lokalnego `03-final-control.md`; brakujący artefakt odnotowuję zamiast go zgadywać.

## Potwierdzony allowlisted snapshot Power

- Zwykłe przejęcie: `applyCityCaptureToMap` wylicza `powerBeforeCapture` przed `applyCityCaptureAfterBattle`, a następnie przekazuje snapshot do `runCapitalCapturePlunder`.
- Kapitulacja głodowa: `resolveSiegeSurrender` wylicza snapshot przed `city.ownerId = newOwner` i przekazuje go do tego samego helpera.
- Helper używa snapshotu do `lostPower`; fallback bez snapshotu pozostaje zachowany dla legacy/internal callers.
- Kolejność dla eliminacji ostatniego miasta pozostaje: snapshot → transfer → naliczenie zdobyczy Power → popup/komunikat → `eliminateOwner`.
- Szczegóły popupu/komunikatu pokazują Skarbiec, Naukę, liczbę techów i Power; wartości barbarzyńskie są jawnie zerowe.

## Zakres plików

Rzeczywisty diff względem HEAD obejmuje wyłącznie allowlistę:

- `gra/src/main.ts` — snapshot Power w obu ścieżkach i przekazanie do helpera; szczegóły komunikatu zdobyczy.
- `gra/tools/elimination-toast-merge-test.cjs` — asercja dopuszcza opcjonalny argument snapshotu.
- `dyspozycje/autobot/runs/R-ZDOBYCZE-ELIMINACJA-POWER-Q1/01-operator.md` — ten raport.

Nie zmieniano plików poza allowlistą, nie wykonano integracji, commita, deployu ani pushu.

## Testy

- `node tools/capital-capture-test.cjs` — PASS, `86/86`.
- `node tools/elimination-toast-merge-test.cjs` — PASS, `54/54`.
- `node tools/save-load-sort-test.cjs` — PASS, `4/4`.
- `node tools/fsa-autosave-test.cjs` — PASS, `55/55`.
- lokalny `tsc --noEmit` — PASS, exit 0.
- `git diff --check -- src/main.ts tools/elimination-toast-merge-test.cjs` uruchomione z katalogu `gra` — PASS, exit 0.
- Pierwsza próba trzech fixture testów dostała środowiskowy `EPERM` przy tworzeniu plików tymczasowych; ponowienie z wymaganym dostępem zakończyło się pełnym PASS. Nie zmieniono kodu ani nie usuwano zastanych artefaktów.

## BLOKADY

- Brak blokady funkcjonalnej ani typecheckowej.
- Uwaga procesowa: worktree zawiera zastane zmiany i artefakty poza allowlistą; pozostawiono je bez dotykania.

ZMIANY/COMMIT: potwierdzono allowlisted diff w `gra/src/main.ts` i `gra/tools/elimination-toast-merge-test.cjs`; brak commita.
TESTY: `86/86`, `54/54`, `4/4`, `55/55`, `tsc --noEmit` exit 0, `git diff --check` PASS.
BLOKADY: brak blokady funkcjonalnej; tylko zastany nieczysty worktree i odnotowany pierwszy `EPERM` środowiska.
NASTĘPNY KROK: Final Control dla tego samego ID, po uzupełnieniu/odnalezieniu właściwego artefaktu `03-final-control.md`; bez integracji, deployu ani pushu.
DEPLOY/PUSH: NIE WYKONANO

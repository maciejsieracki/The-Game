# 03 — FINAL CONTROL — runda 4

STATUS: PASS-WITH-NOTES
TEMAT: R-ZDOBYCZE-ELIMINACJA-POWER-Q1
GOAL: Popup eliminacji i stan gry prawidłowo przejmują oraz pokazują Skarbiec, Naukę, technologie i Power pokonanego państwa dla zwykłego przejęcia i kapitulacji głodowej.
RUNDY: 4/5

## Zakres kontroli i izolacja

- Kontrolowany wyłącznie checkout: `C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ-clean-main-2026-08-20`.
- HEAD: `47cdca15757efb89d5e634e9e9ddff370925708d` (`47cdca15`), Fala 300.
- Przeczytano: `README.md`, oba lokalne `.claude/skills/*/SKILL.md`, `00-dispatch.md`, `01-operator.md`, `02-evaluator.md` oraz wymagane źródła procesowe.
- Lokalnego `03-final-control.md` nie było przed tą kontrolą; odnotowuję to jako notę provenance, bez tworzenia fikcyjnego dowodu.
- Worktree jest zastanie nieczysty. Obce zmiany i obce artefakty pozostawiono bez resetu, clean, checkoutu i usuwania.

## Bramka funkcjonalna — snapshot przed owner change

- PASS — zwykłe przejęcie: `applyCityCaptureToMap` pobiera `oldOwner`, liczy `powerBeforeCapture` przed `applyCityCaptureAfterBattle`, a następnie przekazuje snapshot do `runCapitalCapturePlunder`.
- PASS — kapitulacja głodowa: `resolveSiegeSurrender` pobiera `oldOwner`, liczy snapshot przed `city.ownerId = newOwner`, a następnie przekazuje go do tego samego helpera.
- PASS — helper używa snapshotu do `lostPower`; fallback bez snapshotu pozostaje wyłącznie dla legacy/internal callers.
- PASS — kolejność eliminacji zachowana: snapshot → transfer → zdobycz Power i komunikat/popup → `eliminateOwner`.
- PASS — szczegóły komunikatu/popupu obejmują Skarbiec, Naukę, liczbę techów i Power; dla zdobywcy barbarzyńskiego wartości są jawnie zerowe.
- PASS — kapitulacja scala szczegóły eliminacji z komunikatem kapitulacji, bez drugiego nadpisującego toastu.

## Testy i bramki

- PASS — `node tools/capital-capture-test.cjs`: `86/86`.
- PASS — `node tools/elimination-toast-merge-test.cjs`: `54/54`.
- PASS — `node tools/save-load-sort-test.cjs`: `4/4`.
- PASS — `node tools/fsa-autosave-test.cjs`: `55/55`.
- PASS — `npx tsc --noEmit`: exit 0, bez błędów.
- PASS — `git diff --check -- gra/src/main.ts gra/tools/elimination-toast-merge-test.cjs`: exit 0.
- Pierwsza próba fixture testów dostała środowiskowy `EPERM` przy zapisie tymczasowych entrypointów w `gra/tools`; ponowienie tych samych testów z wymaganym dostępem zakończyło się pełnym PASS. Nie zmieniono kodu w wyniku tego problemu.

## Diff i allowlista

- PASS — taskowy diff względem HEAD obejmuje `gra/src/main.ts` oraz `gra/tools/elimination-toast-merge-test.cjs`; oba pliki są objęte allowlistą z `00-dispatch.md`.
- PASS-WITH-NOTES — cały checkout ma dodatkowe, zastane zmiany i artefakty poza allowlistą tego tematu. Nie przypisuję ich temu runowi i nie dotykałem ich.
- Brak commita, integracji, deployu i pushu.

## Werdykt i routing

`PASS-WITH-NOTES`: GOAL, snapshot przed owner change dla obu ścieżek, testy `86/86`, `54/54`, `4/4`, `55/55`, typecheck, diff/check i allowlista są potwierdzone. Noty dotyczą wyłącznie zastanie nieczystego worktree, obcych zmian/artefaktów, wcześniejszego braku lokalnego `03` oraz pierwszego środowiskowego `EPERM`; nie są blokadą funkcjonalną.

GOTOWOŚĆ DO INTEGRACJI: TAK — wyłącznie zatwierdzony zakres taskowy z allowlisty, po niezależnej kontroli orkiestratora. Final Control nie wystawia `READY_FOR_DEPLOY`.

ZMIANY/COMMIT: `gra/src/main.ts`, `gra/tools/elimination-toast-merge-test.cjs`; brak commita; artefakt: ten raport.
TESTY: `86/86`, `54/54`, `4/4`, `55/55`, `tsc --noEmit` exit 0, `git diff --check` PASS.
BLOKADY: brak funkcjonalnych; noty provenance o obcych zmianach/artefaktach, braku lokalnego 03 przed kontrolą i środowiskowym EPERM.
NASTĘPNY KROK: routing do orkiestratora — końcowy audyt faktycznego diffu i integracja wyłącznie allowlisty; następnie osobna bramka deploy/push tylko na wyraźne polecenie właściciela.
DEPLOY/PUSH: NIE WYKONANO

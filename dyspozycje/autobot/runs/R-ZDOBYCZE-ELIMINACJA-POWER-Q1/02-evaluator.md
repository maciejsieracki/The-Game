# 02 — EVALUATOR — runda 4

STATUS: PASS-WITH-NOTES
TEMAT: R-ZDOBYCZE-ELIMINACJA-POWER-Q1
GOAL: Popup eliminacji i stan gry prawidłowo przejmują oraz pokazują Skarbiec, Naukę, technologie i Power pokonanego państwa dla zwykłego przejęcia i kapitulacji głodowej.
RUNDY: 4/5

## Zakres i provenance

- Oceniany wyłącznie checkout `Civ-clean-main-2026-08-20`:
  `C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ-clean-main-2026-08-20`.
- HEAD: `47cdca15757efb89d5e634e9e9ddff370925708d` (`47cdca15`), Fala 300.
- Przeczytano: `README.md`, `.claude/skills/civ-autobot/SKILL.md`, procesowy `INDEX-PROCESU.md`, aktywną regułę Evaluator–Operator, `R-PROC-AUTOBOT.md`, `00-dispatch.md`, `01-operator.md` i istniejący `02-evaluator.md`.
- Lokalny `03-final-control.md` nie istnieje. To jest wyłącznie provenance note; nie tworzę ani nie uznaję fikcyjnego dowodu Final Control.
- Checkout ma zastane, mieszane zmiany innych tematów. Nie wykonywano resetu, checkoutu, clean, integracji, commita, deployu ani pushu.

## Weryfikacja snapshotu Power

- PASS — zwykłe przejęcie: `applyCityCaptureToMap` wylicza `powerBeforeCapture` przed `applyCityCaptureAfterBattle`, a następnie przekazuje snapshot do `runCapitalCapturePlunder` (`gra/src/main.ts:23694–23700`, `23783`).
- PASS — kapitulacja głodowa: `resolveSiegeSurrender` wylicza snapshot przed `city.ownerId = newOwner`, a następnie przekazuje go do tego samego helpera (`gra/src/main.ts:12317–12324`, `12380`).
- PASS — helper używa snapshotu do `lostPower`; fallback pozostaje tylko dla legacy/internal callers (`gra/src/main.ts:23553–23565`).
- PASS — kolejność eliminacji: snapshot → transfer/zmiana właściciela → zdobycz Power i komunikat → `eliminateOwner` (`gra/src/main.ts:23565–23599`).
- PASS — popup/toast niesie Skarbiec, Naukę, liczbę techów i Power; dla zdobywcy barbarzyńskiego wartości są jawnie zerowe.
- PASS — kapitulacja scala szczegóły eliminacji z komunikatem kapitulacji, bez drugiego nadpisującego toastu.

## Testy i bramki

- `node tools/capital-capture-test.cjs` — PASS, `86/86`.
- `node tools/elimination-toast-merge-test.cjs` — PASS, `54/54`.
- `node tools/save-load-sort-test.cjs` — PASS, `4/4`.
- `node tools/fsa-autosave-test.cjs` — PASS, `55/55`.
- `npm run typecheck` (`tsc --noEmit`) — PASS, exit 0.
- `git diff --check -- gra/src/main.ts gra/tools/elimination-toast-merge-test.cjs` — PASS, exit 0.
- Pierwsza próba trzech testów fixture’owych dostała środowiskowy `EPERM` przy tworzeniu tymczasowych plików; ponowienie tych samych testów z zatwierdzonym dostępem zakończyło się pełnym PASS. Po testach nie ma lokalnych artefaktów tymczasowych tych fixture’ów.

## Diff i allowlista

- Taskowy zakres potwierdzony w `gra/src/main.ts` i `gra/tools/elimination-toast-merge-test.cjs`; oba pliki mieszczą się w allowliście `00-dispatch.md`.
- Artefakt tego runu pozostaje w `dyspozycje/autobot/runs/R-ZDOBYCZE-ELIMINACJA-POWER-Q1/`.
- Cały checkout nie jest globalnie allowlist-only: `git diff --name-only` pokazuje również zastane zmiany poza allowlistą tego tematu. Zostały wyłączone z oceny i pozostawione bez dotykania; nie przypisuję ich Operatorowi.

## Werdykt i routing

`PASS-WITH-NOTES`: wymagania funkcjonalne snapshotu Power dla zwykłego przejęcia i kapitulacji głodowej, wymagane testy, typecheck i kontrola diffu są zielone. Noty nie są blokadą funkcjonalną: checkout jest zastanie nieczysty, a lokalny brak `03-final-control.md` jest odnotowany jako provenance note.

ZMIANY/COMMIT: oceniono wyłącznie zakres taskowy w allowliście; brak commita.
TESTY: `86/86`, `54/54`, `4/4`, `55/55`, `tsc --noEmit` exit 0, `git diff --check` PASS.
BLOKADY: brak funkcjonalnych; provenance note o braku lokalnego 03 oraz zastane zmiany poza allowlistą.
NASTĘPNY KROK: Final Control dla tego samego ID i rundy 4; Final Control musi dostarczyć własny raport, nie wolno zastępować go tym raportem.
DEPLOY/PUSH: NIE WYKONANO

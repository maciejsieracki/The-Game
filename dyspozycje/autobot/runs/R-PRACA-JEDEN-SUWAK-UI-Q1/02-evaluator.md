# Evaluator — R-PRACA-JEDEN-SUWAK-UI-Q1

STATUS: FAIL (izolacja/allowlista)
TEMAT: R-PRACA-JEDEN-SUWAK-UI-Q1
GOAL: Usunąć dolny niezależny suwak podziału pracy i pozostawić dokładnie jeden renderowany suwak z kontraktem „Budynki (0–100%)” oraz „Pula Pracy (0–50%)”, jednym stanem i jednym handlerem.

BAZA: `Civ-clean-main-2026-08-20`, HEAD `47cdca15757efb89d5e634e9e9ddff370925708d`, zgodny z dispatch. README.md obecny. Evaluator nie wykonał reset/clean/pull/integracji/commita/deployu/push.

ALLOWLISTA VS FAKTYCZNY DIFF:

- Dozwolone zmiany pakietu: `gra/src/ui/empireDetailPanel.ts`, `gra/tools/praca-split-ui-test.cjs`, `dyspozycje/autobot/runs/R-PRACA-JEDEN-SUWAK-UI-Q1/*`.
- Zmiany targetowe są obecne w dwóch pierwszych plikach; raport `01-operator.md` i bieżący raport są nieśledzonymi artefaktami runu.
- Worktree nie jest clean/allowlist-only: `git status --short` wykazuje 25 zmodyfikowanych plików śledzonych poza pakietem oraz wiele nieśledzonych katalogów/plików innych runów (m.in. `R-AUTOBOT-*`, `R-PRACA-MIASTO-*`, `R-REKRUTACJA-*`, `R-TECHNOLOGIA-*`, `dyspozycje/autobot/src/*`, `dyspozycje/autobot/tools/*` i inne testy `gra/tools/*`). Nie przypisuję tych zmian Operatorowi, ale przy żądaniu clean checkout nie można zaliczyć izolacji.

WERYFIKACJA KONTRAKTU: PASS

- W `gra/src/ui/empireDetailPanel.ts` usunięto dolny render/wiring: brak `renderPracaSplitSection`, `wireDefaultPodzialPracyInputs` i `data-praca-key`.
- Pozostaje dokładnie jeden renderowany target `data-praca-empire-split` i jeden listener `input` w `renderEmpirePracaBudgetSplitSection()`, zapisujący przez `onOwnerDefaultPracaSplitChange`.
- Literalne etykiety są obecne: `Budynki (0–100%)` oraz `Pula Pracy (0–50%)`.
- Stan wejściowy to `procentUlepszenia`, zaciskany do 0–50%; Budynki są wyliczane jako `100 - pctPulaPracy`, więc nie ma niezależnych wartości sprzecznych.

TESTY:

- `node tools/praca-split-ui-test.cjs` — PASS, 7/7, exit 0.
- `npm exec tsc -- --noEmit` — PASS, exit 0.
- `npm run build` / `npm run dev` — nie uruchamiano zgodnie z dispatch.
- Deploy/push — nie wykonano.

WERDYKT: Funkcjonalny kontrakt UI i oba wymagane checki przechodzą, lecz całość FAIL z powodu faktycznego diffu poza allowlistą i braku clean checkout. Wymagana jest ponowna ewaluacja na rzeczywiście czystej bazie albo formalne odseparowanie obcych zmian; evaluator nie wykonuje tych operacji.

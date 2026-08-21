# 03 — FINAL CONTROL

STATUS: PASS-WITH-NOTES

TEMAT: R-TECHNOLOGIA-KARTY-PODGLAD-KLIK-Q1

GOAL: Jedna istniejąca karta technologii ma otwierać się kliknięciem z `techTreeView` i `scienceHubHud` jako podgląd, dla czterech stanów technologii, bez automatycznego rozpoczęcia badania; rozpoczęcie badania pozostaje osobną akcją.

ZMIANY/COMMIT:
- README.md potwierdzony jako punkt wejścia procesu.
- Zweryfikowany checkout: branch `work/clean-main-2026-08-20`, HEAD `47cdca15757efb89d5e634e9e9ddff370925708d`; FALA 300 potwierdzona w `dyspozycje/WERSJE.md` jako ROBOCZA / `VERIFY OK`.
- Brak commita tematu, integracji i zmian historii Git.
- Formalny ślad kompletny: wpis w `dyspozycje/REJESTR-PROSB-I-ZADAN.md`, `00-dispatch.md` z formalną allowlistą, `01-operator.md`, `02-evaluator.md` oraz ten raport.
- Faktyczny diff tematu obejmuje wyłącznie trzy pliki z allowlisty: `gra/src/ui/techTreeView.ts`, `gra/src/ui/scienceHubHud.ts`, `gra/src/ui/techDiscoveryNotice.ts` (`+55/-22`). Brak zmian tematu w danych gry, silniku badań i `gra/tools/science-hub-test.cjs`; w zakresie kodu tematu brak zmian niezwiązanych z celem.
- Jedna karta jest współdzielona przez `showTechDiscoveryNotice` jako `.tdn-card`; `techTreeView` i `scienceHubHud` kierują do tego samego trybu `kind: 'preview'`.
- Cztery stany są jawnie obsłużone: `od` (zbadana), `ip` (aktywna), `av` (dostępna), `lk` (zablokowana). Klik w każdym stanie otwiera preview.
- Preview jest osobne od rozpoczęcia badania: start jest dostępny wyłącznie przez osobny `data-act="research"` / callback dla technologii `av`; klik karty nie uruchamia badania.
- `scienceHubHud` obsługuje klik celu aktywnego, wiersza/ikony i pozycji planu; zachowane są osobne akcje wyboru, zamykanie Esc/click-outside i obsługa klawiatury Enter/Space.

TESTY:
- `node tools/technology-discovery-card-visual-test.cjs`: **17 PASS / 0 FAIL**, exit 0.
- `node tools/tech-tree-test.cjs`: **19 PASS / 0 FAIL**, exit 0.
- `node tools/research-test.cjs`: **33 PASS / 0 FAIL**, exit 0.
- `node tools/science-hub-test.cjs`: **5 PASS / 2 FAIL**, exit 1. Oba FAIL-e dotyczą starego progu `>=5`; aktualny wynik silnika i huba jest zgodny `4/4`. Pozostałe asercje zgodności przechodzą. Jest to znany dług testu/progu, nie regresja tego tematu.
- `tsc --noEmit`: raport Evaluatora **0 błędów**, exit 0; ponowna kontrola lokalna również exit 0.
- `git diff --check`: bez błędów whitespace dla diffu tematu.
- Brak dedykowanego live DOM-harnessu dla pełnej macierzy drzewko/hub × cztery stany; pozostaje to notą dowodową, nie wykrytą regresją.

BLOKADY:
- Brak blokady kontraktowej dla zakresu tematu.
- Do osobnej konserwacji pozostaje `science-hub-test`: próg `>=5` powinien zostać zaktualizowany do kontraktu `>=4` albo zastąpiony asercją zgodności hub↔silnik.
- Worktree współdzielone zawiera niezwiązane zmiany innych tematów i artefakty runów. Nie są częścią taskowego diffu i nie zostały zmienione; integracja musi użyć wyłącznie allowlisty.

GOTOWOŚĆ DO INTEGRACJI (TAK/NIE): TAK

NASTĘPNY KROK: Integrator może zintegrować wyłącznie trzy pliki z allowlisty wraz z artefaktami tego runu; następnie przejść osobną bramkę `READY_FOR_DEPLOY`. Korektę progu science hubu i live DOM-harness prowadzić jako osobny temat.

DEPLOY/PUSH: NIE WYKONANO. Nie wykonano integracji, commita, deployu ani pushu.

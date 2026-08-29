# Szablon `00-dispatch.md` — kopiuj do `dyspozycje/autobot/runs/<PEŁNE-ID>/`

Powstaje ZANIM ruszy Operator. Dispatch bez tego pliku jest naruszeniem procesu
(`R-PROC-AUTOBOT.md` §2a, C-044, C-051). Pole puste albo pominięte = dispatch
niekompletny; uzupełnij przed uruchomieniem, nie po raporcie.

---

TEMAT:  <pełne ID, np. R-UI-POPUP-ODKRYCIE-OVERFLOW-Q1>  (niezmienne przez wszystkie rundy)
RUNDA:  <n>/5                        (licznik rośnie PRZED dispatchem — §3)
DATA:   <RRRR-MM-DD>
DOMAIN: GAME | PROCESS | INFRA | INFORMATIONAL      (C-055)
ŚCIEŻKA: A (Workflow) | B (prompt) | C (Cursor Automations)   (§5a)
MODEL + EFFORT per rola: Operator <…> / Evaluator <…> / Final Control <…>
        (§1a, §5a — zapisz też w raporcie etapu; przy temacie wizualnym
         klasyfikacja „graficzny → Opus 5 obie role" jest tu jawna, nie w pamięci)

## WYZWALACZ
<Dlaczego ten temat startuje TERAZ i kto tak zdecydował. Dopuszczalne: decyzja
właściciela (podaj ID ECHO), odblokowanie zależności (co się odblokowało), powrót
po FAIL (numer rundy), przegląd okresowy, zdarzenie zewnętrzne. „Bo była kolej"
nie jest wyzwalaczem.>

## GOAL
<Jedno zdanie: co ma być prawdą po zakończeniu. To samo zdanie trafia do raportu —
rozbieżność łapie Evaluator, §16a pkt 9.>

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
<Nazwane bramki i testy tematu. Kryterium bez nazwanego sprawdzenia jest
niekompletne. Osobno zaznacz, co jest NOWYM sprawdzeniem tego tematu, a co
istniejącą bramką uruchamianą defensywnie — to rozstrzyga próg podziału (§12).>

## ALLOWLISTA — nic poza tym
<pozycje per plik/katalog>
Zakazane bezwzględnie: pliki z sekretami, `docs/decyzje/<ID>.md`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree <ścieżka>, gałąź `autobot/<ID>`, baza **jawnie** (`origin/main` albo inna —
nigdy „domyślna", C-035). Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/` (C-015).

## REGUŁA PRZECIW SAMOOSZUKIWANIU
<Konkretny tryb z tabeli „Nasze tryby samooszukiwania" w `civ-autobot/SKILL.md` —
nie z teorii. To jest pole pomijane najczęściej.>

## PROCEDURA NAPRAWCZA PRZY FAIL
<Co dokładnie robi Evaluator: wskazuje jeden konkretny defekt i poprawkę; runda N+1
idzie na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: `LIMIT-5-EXCEEDED`.
Przy temacie dzielonym na węzły wraca wyłącznie węzeł wskazany przez Evaluatora (§12).>

## GRANICE (naruszenie = FAIL)
<odesłanie do `R-PROC-AUTOBOT.md` §9 + pozycje szczególnie istotne dla tego tematu>

## OBIEG
Operator → Evaluator → Final Control → integracja orkiestratora → READY_FOR_DEPLOY
→ osobna bramka deploy/push. Operator nie ocenia, nie integruje, nie deployuje, nie pushuje.

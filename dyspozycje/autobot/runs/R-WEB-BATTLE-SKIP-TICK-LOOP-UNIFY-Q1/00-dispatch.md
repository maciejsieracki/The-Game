STATUS: REGISTERED —1/11
DOMAIN: GAME
ID: R-WEB-BATTLE-SKIP-TICK-LOOP-UNIFY-Q1
GOAL: Kolejka#202: ujednolicić Pomiń/AUTO przy oblężeniu Z WYŁOMEM, jeśli odtwarzalne straty są różne. [related_to] wdrożonyBATSKIP589 i limitbezwyłomu600; nie duplikować tych poprawnychpoprawek. Początkoworead-only; po reprodukcji jawnaallowlista. Kryterium: ten sam stan/seed/wejścia ->zgodnywynikobuścieżek, bez zmianbalansu. Zależność: po R-WEB-BATTLE-SIEGE-NEARBY-UNITS-JOIN-Q1.
MODEL: Operator/Evaluator/FinalControlgpt-6-luna high; role sekwencyjne, max4tematy.
BAZA: origin/main poFALI609; dokładnySHA wraporcie.
ALLOWLIST: tenrun; początkowo własnytesttylko gdycelto testdebt, pozostałekod/daneread-only; jawniekwalifikowaćprzededycją.
Testy: aktualnybaseline i meaningfulregresja po dowodzie; bezskip/relax/zgadywaniabalansu. KodkandydatpoFC; deployRobocza/push/readback/cleanup, informational/testonly10N/A.

STATUS: REGISTERED —1/11
DOMAIN: GAME
ID: R-WEB-WONDER-TRANSFER-TEST-DEBT-Q1
GOAL: Odtworzyć wonder-transfer-on-conquest-test.cjs i rozpoznać starytest vsproduktbug. Początkowy zakres tylko własnytest+run, helpersread-only; zachować semantykę przenoszenia cudów, AI/gracz/save/load gdy dotyczy, żadnegoosłabieniaassertions.
MODEL: Operator/Evaluator/FinalControlgpt-6-luna high; role sekwencyjne, max4tematy.
BAZA: origin/main poFALI609; dokładnySHA wraporcie.
ALLOWLIST: tenrun; początkowo własnytesttylko gdycelto testdebt, pozostałekod/daneread-only; jawniekwalifikowaćprzededycją.
Testy: aktualnybaseline i meaningfulregresja po dowodzie; bezskip/relax/zgadywaniabalansu. KodkandydatpoFC; deployRobocza/push/readback/cleanup, informational/testonly10N/A.

IZOLACJA: /tmp/codex-wonder-transfer-609, osobnagałąź. Można commitować własnytest-kandydat na własnejgałęzi, bezpush/merge/deploy.

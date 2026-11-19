STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WAR-BY-ALLIANCE-STRENGTH-Q1
GOAL: słaba AI z sojusznikami wypowiada wojnę siłą bloku (próg 20% + charakter), za flagą domyślnie false.
ZMIANY/COMMIT: kandydat b20509f5807e512944d53df7c582c78ca77328c9 (baza 7a8acd6b8fa2dc4b9b0666823e821ba7e64359c7; merge-base --is-ancestor: OK). Diff --stat: ai.ts +26/-3, main.ts +50, diplomacy-alliance-strength.ts +78 (nowy), diplomacy-alliance-war-params.json +5 (nowy), diplomacy-alliance-strength-unit-test.cjs +180 (nowy), runs/** (10-operator, 30-obrona). Wszystko w allowliście; brak gra-robocza/kanon/WERSJE/rust-port. git diff --check: czysto. Flaga w JSON = false.
TESTY (własne, surowe, npm ci --ignore-scripts w gra/):
- tsc --noEmit: exit 0
- diplomacy-alliance-strength-unit-test: 33 OK, 0 FAIL
- diplomacy-test: 149 passed, 0 failed
- diplomacy-zero-trust-unit-test: PASS=43 FAIL=0
- ai-ai-alliance-tick-test: suite 19/19 OK; mutants 8/8
- logic-test: LOGIC OK (213/213)
- Własna mutacja kopii blockStrength (plik przywrócony, cmp OK): bez filtra wasali 29 OK / 4 FAIL; bez filtra wojnaZAI 30 OK / 3 FAIL; bez wykluczenia partnera-celu 29 OK / 4 FAIL. Testy są czerwone na mutacjach.
- NIE_ZMIERZONO: tech-tree, research, unit-replace, combat (moduły nietknięte), build, zachowanie w przeglądarce, metryki wojen blokowych (liczba, tura pierwszej).
OCENA ZARZUTÓW: 1 (hak w civTest) naprawiony w main.ts (__truceTestDebug.warByAllianceStrengthForTest.setEnabled), potwierdzone w diffie. 2 (wspólny sojusznik w obu blokach) naprawiony (zbiór sojusznicyPrzeciwnika), potwierdzone. 3 (wasal bez ekonomia) odrzucenie zasadne, konserwatywne. 4 (kaskada) opcjonalna, poza zakresem; wojny blokowe rozpoznawalne po sufiksie "[blok sily: ...]" w powodzie komendy.
PRZEGLĄD KODU: flaga OFF = blokSojusznicyDla zwraca [], ai.ts używa milAiSideOwn (parytet decyzji). Warunki Zaufanie<30, agresja, NAP, peaceLocked, okno wczesne nietknięte. Próg z charakterem zachowany (ten sam progPrzewagiWojnyProc).
BLOKADY: brak.
RUNDY: FC 1/5.
NASTĘPNY KROK: integracja orkiestratora (b20509f5, bramki); flaga pozostaje false.
UWAGI-DLA-ORKIESTRATORA: (a) wasal bez pola ekonomia = obie strony traktatu jako wasale (konserwatywnie); (b) kaskada dołączania sojuszników niezaimplementowana; (c) reguła 1+1 nadal niezaimplementowana; (d) pomiar ON wymaga hooka __truceTestDebug.warByAllianceStrengthForTest.
DEPLOY/PUSH: NIE WYKONANO

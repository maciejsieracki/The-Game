# R-WEB-DIPLO-WEARINESS-LEGACY-FIELDS-CLEANUP-Q1 — obrona po zarzutach Evaluatora (r1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (zachowanie gry BEZ zmian; tylko komentarze, nazwy testów, opis JSON)
TEMAT: R-WEB-DIPLO-WEARINESS-LEGACY-FIELDS-CLEANUP-Q1
GOAL: obrona zarzutów Evaluatora względem kandydata c2ad0d490 (baza 3a00b867f = origin/main)
ZMIANY-COMMIT: 59a041860 (ponad c2ad0d490): gra/data/diplomacy-war-peace-params.json — tylko tekst _wzor (bez zmiany wartości). Raport: ten plik.
BAZA: `merge-base --is-ancestor 3a00b867f c2ad0d490` potwierdzone przez checkout detach; kopia node_modules: hardlink z wf_a7425125-b22-2 (cp -al), do sprzątnięcia.

## Odpowiedzi na zarzuty

**Zarzut 1 (cel 1: usunięcie martwych pól) — ODRZUCAM.**
Dispatch (GOAL 1) pozwala usunąć TYLKO pola „całkowicie martwe (nieużywane przez żadną ścieżkę decyzji ani UI ani testy zachowania)”; gdy pole jest używane — zostawić i wpisać do raportu. Dowód (`git grep` na 3a00b867f/c2ad0d490):
- `zmeczenieT`, `warWearinessFraction`, `warWearinessShare`, `WAR_WEARINESS_MAX_SHARE` — w src użyte wyłącznie w `diplomacy-war-peace-profile.ts` (definicja/eksport); poza tym tylko testy zachowania: `diplo-war-peace-profile-unit-test.cjs` l.41–94, `diplo-truce-impl-test.cjs` l.255–259, eksport w `diplo-war-peace-sim-test.cjs` l.55.
- `bazaTur`, `maksTur`, `wagaAgresja` (blok zmeczenie) — zasilają `zmeczenieT` (profile.ts l.185), czyli znów tylko testy.
- Usunięcie wymagałoby zmiany asercji liczbowych (`near(...)` l.79, 91–93 w profile-unit; `warWearinessFraction` w truce-impl), a dispatch tego zakazuje („bez zmiany treści asercji o liczbach”). Zarzut „dispatch zezwalał na edycję testów” jest błędnym odczytem: allowlista pozwala na nazwy/komunikaty i na usunięte odwołania do martwych pól, nie na zmianę asercji zachowania.
- Operator r1 trzymał się więc GOAL 1 literalnie; usunięcie testowego zegara to osobny temat (zapisany w `_wzor`, patrz zarzut 3).

**Zarzut 2 (cel 2, „20 tur” w nazwach) — ODRZUCAM resztę.**
Wskazane cele dispatchu (profile-unit l.79, 91, 92; main-guard l.95) zostały przemianowane w c2ad0d490. Pozostałe trafienia są prawdziwe:
- profile-unit l.117–118 `turnsAtWar: 20` — wejście bramki pokoju (`evaluatePeaceAiGate`), nie zegar zmęczenia; etykieta opisuje wartość wejściową.
- diplo-weariness-20-turns-test.cjs l.66, 72, 73 — scenariusze „tura 20”: 20 × 2,5% = 0,5; +1 miasto = 0,6; +3 miasta = 0,8 (zgodne z war-weariness-params.json). Nazwa pliku odwołuje się do historycznego ID R-WEB-DIPLO-WEARINESS-20-TURNS-Q1 i pozostaje.

**Zarzut 3 (komentarze bez ID następcy) — PRZYJMUJĘ.**
Commit 59a041860: zdanie w `_wzor` brzmi teraz „usunięcie wymaga zmiany asercji testów zachowania, czyli poza allowlistą R-WEB-DIPLO-WEARINESS-LEGACY-FIELDS-CLEANUP-Q1; brak zarejestrowanego ID tematu-następcy, do ustalenia przez orkiestratora”. Komentarz w `diplomacy-peace-lock.ts` l.123–124 nie wskazuje następcy — bez zmian. JSON zwalidowany (`JSON.parse` OK).

## Bramki (liczby z surowego wyjścia, wykonane na 59a041860; gra/ bez build/dev)
- `node ./node_modules/typescript/bin/tsc --noEmit` → exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: COMBAT TEST 6/6 pass
- diplo-war-peace-profile-unit-test: 198 pass / 0 fail
- diplo-weariness-20-turns-test: PASS=31 FAIL=0 (mutant M3 wykryty)
- diplo-war-peace-main-guard-test: 35 pass / 0 fail
- diplo-war-peace-sim-test: 25 pass / 0 fail
- diplo-wiki-weariness-rate-consistency-test: asercje OK 18, FAIL 0
- diplo-peace-pw-power-ratio-test: 48 PASS, 0 FAIL
- diplo-weariness-forced-peace-test: PASS=14 FAIL=0
- `git diff --check` czysty.

Tabela przed/po: NIE ZMIERZONO na bazie 3a00b867f w tej rundzie (zmiany nie dotykają kodu wykonywalnego: komentarze, tekst stringu `_wzor` w JSON, nazwy asercji). Zgodność z bazą wynika z diffu, nie z własnego pomiaru „przed”.

Mutacja na kopii (3b): N/A — w tym temacie nic nie usunięto, więc nie ma czego przywracać.

## RUNDY
Runda 1/5 obrony (odpowiedź na zarzuty r1 Evaluatora). Ostatni werdykt Evaluatora: PASS-WITH-NOTES.

## NASTĘPNY KROK
Evaluator r2 na 59a041860 (zmieniony tylko zarzut 3; zarzuty 1–2 do odrzucenia lub decyzja orkiestratora o osobnym temacie usunięcia zegara testowego).

## UWAGI-DLA-ORKIESTRATORA
- Zegar testowy (zmeczenieT/warWearinessShare/bazaTur/maksTur/wagaAgresja z bloku zmeczenie) może być osobnym tematem, który zmieni asercje w profile-unit i truce-impl — wymaga decyzji, czy warto.
- W worktree `gra/node_modules` to hardlinki z wf_a7425125-b22-2 (cp -al); sprzątanie po stronie orkiestratora.
- Testy uruchamiane na pierwszym planie z TMPDIR=/tmp/cl-b22-3 (krótki TMPDIR, do usunięcia).

DEPLOY/PUSH: NIE WYKONANO

# R-WEB-DOC-CIVPEDIA-ROZEJM-POKOJ-WEARINESS-RATE-2-5PCT-Q1 — obrona Operatora (runda 1/5, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dokumentacja Civpedii)
TEMAT: R-WEB-DOC-CIVPEDIA-ROZEJM-POKOJ-WEARINESS-RATE-2-5PCT-Q1
GOAL: hasło „Rozejm i pokój” podaje tempo zmęczenia 2,5% na turę (pelneTur=40); wikiBundle.json tylko z generatora; strażnik wykrywa błędne tempo.
ZMIANY-COMMIT: baza kandydata 282c9515948aa68b53e8f02231be967c8317ec55 (nad d2df9e43a). Obrona dotyka tylko `gra/tools/diplo-wiki-weariness-rate-consistency-test.cjs` (strażnik) oraz raport. Zmiany: (1) dopasowanie przyrostu za miasto — `10%` / `0,10` jako osobna liczba (nie `110%`, `0,100`); (2) tempo sprawdzane jako `2,5% na tur…` zamiast samego `2,5%`; (3) mutacja „5% na turę” wykonywana na kopii pliku w katalogu tymczasowym (sprzątanym `rmSync` w `finally`). Commit obrony: patrz pole `sha` w wyniku.

## Odpowiedzi na zarzuty Evaluatora (fc8c12920)

1. Zarzut: `includes('10%')` przepuszcza `100%` — ODRZUCAM w tej części. Dowód: `node -e 'console.log("100%".includes("10%"))'` → `false`. Realny brak był inny: `110%` przechodziło (`"110%".includes("10%")` → `true`). PRZYJMUJĘ w tej części: dopasowanie przez `(^|[^0-9,.])(10%|0,10)(?![0-9])`. Dowód: mutacja `+10%` → `+110%` na dysku daje FAIL „brak przyrostu za miasto” (17 OK / 1 FAIL, exit 1).
2. Zarzut: tempo `includes('2,5%')` bez „na turę” — PRZYJMUJĘ. Sprawdzenie zmienione na `includes('2,5% na tur')`. Oba hasła (md i wikiBundle) nadal zawierają „2,5% na turę”; test zielony.
3. Zarzut: mutacja w pamięci, nie na kopii pliku — PRZYJMUJĘ. Dispatch (krok 4) wymaga „kopia pliku z 5% na turę”. Test zapisuje zmutowaną kopię `rozejm-pokoj.md` do `mkdtemp` (os.tmpdir), czyta ją z dysku i sprawdza regex; katalog usuwany w `finally`.
4. Zarzut: stare komentarze poza allowlistą — PRZYJMUJĘ jako ustalenie faktów, ODRZUCAM zmianę. Evaluator znalazł tylko `diplo-weariness-20-turns-test.cjs:6`. Grep Operatora potwierdza cztery miejsca ze starym tempem 5%/turę, które są poza allowlistą (`gra/src/**` i `gra/data/**` są zakazane przez dispatch):
   - `gra/src/game/diplomacy-war-peace-profile.ts:306` (komentarz „5%/turę + 10%/miasto”),
   - `gra/data/diplomacy-war-peace-params.json:57` (`_wzor`, „5%/ture”),
   - `gra/tools/peace-gate-military-strength-test.cjs:91` (komentarz „5%/turę”),
   - `gra/tools/diplo-weariness-20-turns-test.cjs:6` („liniowo 5% na ture”).
   Pozycje „+0,5% na turę” (Asymilacja kultury) to inny kontekst. Do decyzji orkiestratora (nowy temat DOC/komentarze).

## Bramki (surowe kody wyjścia, uruchomione w worktree na 282c9515 + obrona)

- `npm ci --ignore-scripts` w gra/: exit 0.
- `npx tsc --noEmit` (gra/): exit 0, 0 linii wyjścia.
- `node gra/tools/diplo-wiki-weariness-rate-consistency-test.cjs`: exit 0, 18 asercji OK / 0 FAIL; mutanty md=true, bundle=true.
- Mutacja tempa na dysku (`2,5%` → `5%` w rozejm-pokoj.md): exit 1, 15 OK / 3 FAIL. Plik przywrócony `git checkout`.
- Mutacja miasta na dysku (`+10%` → `+110%`): exit 1, 17 OK / 1 FAIL. Plik przywrócony.
- Bramki referencyjne: logic-test 0 (LOGIC OK 213/213), tech-tree-test 0 (20/0), research-test 0, unit-replace-test 0 (21/21), combat-test 0.
- Testy wiki: pr141-matrix-only-data-wiki-test 0, civpedia-wikihubhud-rys-historyczny-duplikacja-test 0.
- `git diff --check` HEAD: exit 0.
- Diff wikiBundle.json z kandydata: nietknięty (generator, 2 pola hasła `pojecia/rozejm-pokoj`, wg Evaluatora).

## Stan worktree / sprzątanie

- `gra/node_modules` (npm ci) zostaje w worktree (gitignored). Nie usunięto: zakaz rm. Do usunięcia przez orkiestratora.
- Pliki w `/tmp/claude-0-*` (npm log, tsc, wyjścia testów) zostają. Do usunięcia przez orkiestratora.
- Commit obejmuje tylko strażnika testu i ten raport.

BLOKADY: brak. NIE ZMIERZONO: widok w przeglądarce (tekst statyczny, nie dotyczy zmian wizualnych).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (r2) → Final Control.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Cztery stare komentarze/opisy z 5%/turę poza allowlistą (punkt 4) — wymagają osobnego tematu lub decyzji.
- Strażnik nie łapie `5%/turę` (zapis ukośnikowy) — BLEDNE_TEMPO obejmuje tylko „5% na turę / za turę”. Niski priorytet.
- Zapis „0,10” w haśle „Zmęczenie wojną” pozostaje akceptowany (zgodnie z wcześniejszą uwagą Operatora).

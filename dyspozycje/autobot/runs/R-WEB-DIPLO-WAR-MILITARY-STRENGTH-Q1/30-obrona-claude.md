# R-WEB-DIPLO-WAR-MILITARY-STRENGTH-Q1 — raport Obrony Operatora (runda 2/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WAR-MILITARY-STRENGTH-Q1
GOAL: Krok 2 z 4 (decyzje właściciela 2026-11-13): miara „Siła militarna” pary w wojnie, liczona OSOBNO od Power, jako czysta funkcja + parametry w JSON + testy. Bez podpięcia do AI, pokoju ani UI (kroki 3 i 4).
BAZA: origin/main d09df3e0b. Kandydat Operatora: cbb40649e (startowy SHA tej rundy).
SHA: patrz pole `sha` w StructuredOutput (commit obrony nad cbb40649e).

## ZałOŻENIA ORKIESTRATORA (luki w dispatchu)

- Dispatch `00-dispatch.md` ORAZ `00-dispatch-DODATEK-claude.md` NIE istnieją na `origin/main` (sprawdzone: `git show origin/main:...` → `path does not exist`). Istnieją na gałęzi `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`. Przeczytano je stamtąd. Treść dispatchu (wymagania 1–4, kryteria końca, allowlista) użyta bez zmian.
- Baza kodu: `origin/main` = d09df3e0b (HEAD worktree przed startem). Kandydat cbb40649e ma rodzica d09df3e0b i zmienia tylko 4 pliki z allowlisty.

## ODPOWIEDZI NA ZARZUTY EVALUATORA

Zarzut 1 (raport Operatora bez opisu wywołania kroków 3 i 4): PRZYJMUJĘ.
Dowód: `10-operator-claude.md`, sekcja „NASTĘPNY KROK” miała jedno zdanie. Dispatch pkt 4 wymaga opisu. Uzupełnienie w sekcji „OPIS WYWOŁANIA DLA KROKÓW 3 I 4” poniżej (bez implementacji). Lista miejsc zliczania bitew (plik:linia) jest w `10-operator-claude.md`, sekcja „MIEJSCA DO ZLICZANIA”, bez zmian.

Zarzut 2 (test (b) z tautologiczną asercją gospodarki): PRZYJMUJĘ.
Dowód: stara asercja przekazywała pola `miasta/techZbadane/...` do funkcji, której interfejs ich nie zna, więc wynik był z natury równy bazie. Zmiana w `gra/tools/diplo-military-strength-test.cjs` (blok (b)): usunięto runtime-przekazanie pól gospodarczych; dodano asercję statyczną „interfejs MilitaryStrengthInput nie ma pól gospodarki”, która wyciąga ciało `export interface MilitaryStrengthInput {...}` z `diplomacy-military-strength.ts` i szuka kluczy `miasta|techZbadane|sumaLudkow|budynki|kulturaImperium|heksy*|ulepszenia*`. Dodano też asercję bazową „siła 100 + 50 + 0 = 150”.
Wynik po zmianie: PASS (patrz TESTY).

Zarzut 3 (mutacja (h) nie wykonywana w skrypcie): PRZYJMUJĘ.
Dowód: w poprzedniej wersji (h) była tylko w nagłówku skryptu. Dodano blok `(h) mutacja progu w parametrach musi czerwienić przypadki (d)`:
- funkcja `countD(params)` liczy niezgodności czterech przypadków progu z bloku (d) (119/100 → brak, 120/100 → A, 100/120 → B, 100/119 → brak);
- bez mutacji: `countD(P) === 0`;
- mutacja wartości `progPrzewagiProc` na 25 i 30 w kopii surowego obiektu JSON, przeładowana przez `loadMilitaryStrengthParams(r)` (ta sama ścieżka co odczyt z pliku): `countD > 0` w obu przypadkach.
Ograniczenie uczciwie nazwane: mutacja NIE zmienia pliku `params.json` na dysku (esbuild bundluje JSON przy starcie skryptu). Dowodzi, że wartość z JSON propaguje się do wyniku i że test (d) ją wykrywa. Mutacja na dysku została wykonana ręcznie przez Operatora (20→25, 3 FAIL) i przywrócona; nie jest powtarzana w skrypcie.

Uwaga Evaluatora „Drobne” (nr 1): nie dotyczy kodu; odpowiedź w punkcie 1 powyżej.

## OPIS WYWOŁANIA DLA KROKÓW 3 I 4 (bez implementacji)

Krok 3 (wypowiadanie wojny: zaufanie i siła militarna):
- Przed wypowiedzeniem wojny: `silaA = computeMilitaryStrength({ armiaPkt, rekrutPkt, punktyWygranychBitewWojna: 0, trybutBonusAktywny })`, gdzie `armiaPkt` i `rekrutPkt` to punkty składników `armia` i `rekruci` z `computeObjectivePower` (flagi `military: true` w power-params.json). Licznik bitew wojny przy wypowiedzeniu = 0 (start od zera).
- `trybutBonusAktywny` = czy strona ma aktywny trybut (licznik 10 tur po stronie integracji, `trybutBonusTur`).
- Wynik porównania: `compareMilitaryStrength({id, sila, armiaPkt}, {id, sila, armiaPkt})` → `przewaga` i `silniejszyId` użyte w decyzji o wypowiedzeniu (próg 20% z JSON).
- Funkcja nie zmienia Power, Respektu, Zaufania ani etykiet — wynik wraca do logiki AI w kroku 3 jako osobna wartość.

Krok 4 (rozejm i pokój):
- Ta sama para wywołań `computeMilitaryStrength` / `compareMilitaryStrength` z aktualnymi `punktyWygranychBitewWojna` tej wojny (licznik per para, do zbudowania w kroku 3/4 — patrz lista w `10-operator-claude.md`).
- Rozejm/pokój wymaga przewagi 20% z `compareMilitaryStrength` (przewaga po stronie przeciwnej niż żądający); miasto jest jedynym słodzikiem (zgodnie z decyzją właściciela, poza tym zakresem).
- Licznik `trybutBonusTur` (10 tur) prowadzi integracja; `computeMilitaryStrength` dostaje `trybutBonusAktywny = true` tylko w turach aktywnego bonusu.

## TESTY (surowe wyniki, uruchomione na cbb40649e + zmiana Obrony)

- `npx tsc --noEmit` → `TSC_EXIT=0` (bez wyjścia).
- `node tools/diplo-military-strength-test.cjs` → `RESULT: 27 PASS / 0 FAIL`, exit 0.
  - (a) 3 PASS; (b) 4 PASS (w tym nowa asercja statyczna i baza 150); (c) 2 PASS; (d) 6 PASS; (e) 1 PASS; (f) 3 PASS; (g) 5 PASS; (h) 3 PASS (bez mutacji, mutacja 25, mutacja 30).
- Bramki referencyjne (ten sam worktree, po zmianie):
  - `node tools/logic-test.cjs` → `LOGIC OK (213/213)`, exit 0
  - `node tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`, exit 0
  - `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`, exit 0
  - `node tools/unit-replace-test.cjs` → `[unit-replace-test] WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0
  - `node tools/combat-test.cjs` → `COMBAT TEST: 6/6 pass`, exit 0
- `npm ci --ignore-scripts` w gra/ → exit 0 (raport audytu npm pominięty, bez wpływu na bramki). `npm run build/dev` NIE uruchamiane.
- `git diff --check` → bez wyjścia (czysto).
- `git diff --stat` (zmiana Obrony): `gra/tools/diplo-military-strength-test.cjs` 35 insertions, 8 deletions.

## ZMIANY / COMMIT

- Zmieniony plik: `gra/tools/diplo-military-strength-test.cjs` (w allowlista).
- Nowy plik raportu: `dyspozycje/autobot/runs/R-WEB-DIPLO-WAR-MILITARY-STRENGTH-Q1/30-obrona-claude.md` (allowlista: `dyspozycje/autobot/runs/R-WEB-DIPLO-WAR-MILITARY-STRENGTH-Q1/**`).
- Commitowane wyłącznie te dwa pliki (`git add <ścieżka>`, bez `-A`). Nie pushowano.
- Pozostałe 4 pliki kodu z cbb40649e (`diplomacy-military-strength.ts`, `diplomacy-military-strength-params.json`, `10-operator-claude.md`, `diplo-military-strength-test.cjs` w wersji Operatora) bez zmian w tej rundzie.

## BLOKADY

Brak.

## RUNDY

2/5 (Obrona, Haiku). Zarzuty 1–3 przyjęte; żaden nie odrzucony.

## NASTĘPNY KROK

Evaluator: ponowna weryfikacja (runda 2) — zmiana wyłącznie w bloku (b) i nowym bloku (h) testu oraz w raporcie. Potem Final Control. Krok 3 (wypowiadanie wojny) i licznik bitew per para — osobne tematy, bez zmian w tej rundzie.

DEPLOY/PUSH: NIE WYKONANO

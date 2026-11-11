# R-WEB-RECRUIT-FOLLOW-GENERAL-BY-ORIGIN-Q1 — obrona (Operator, odpowiedź na Evaluatora, runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-RECRUIT-FOLLOW-GENERAL-BY-ORIGIN-Q1
GOAL: Usunąć zarzuty Evaluatora (682df0661a1bf4f87e4ddd9cf21ad4d66b100ee4) bez zmiany zakresu: zamówienie w mieście OFF, z Armii/Rekrutacji dziedziczy globalny przełącznik, intencja trwa w kolejce do zrodzenia.
BAZA: 6e9b3e430 (start obrony, detached), kod operatora w 6e9b3e430 (e758eba8f przed rundą 1 zawarty w tym łańcuchu).

## ZMIANY / COMMIT

Kod obrony: **cfa6dd064ce25be1482330d33d82614f9670ce9c** (parent 6e9b3e430; `git merge-base --is-ancestor 6e9b3e430 cfa6dd064` = tak). Pliki (allowlista, 3 pliki, +14/−5):
- `gra/src/main.ts` — druga kopia `configureCityPanel` (po Nowej grze, ok. l. 44359) dostaje `origin: RecruitOrigin = 'city'` w `onPurchaseGeneral` i przekazuje `{ isGeneral: true, origin }` (zarzut 1).
- `gra/tools/general-capital-recruitment-order-test.cjs` — regex wymaga teraz jawnego `, 'army'` dla karty generała w Armii (zarzut 3).
- `gra/tools/recruit-follow-general-origin-test.cjs` — nowe asercje: obie kopie callbacków (`countOf(...) === 2`), wiązanie `...followIntent` z `enqueueRecruitment` wewnątrz `purchaseRecruitmentUnit` (zarzut 2).

Raport (ten plik) zacommitowany osobno (SHA w polu odpowiedzi orkiestratora).

## ODPOWIEDZI NA ZARZUTY

1. **PRZYJMUJĘ.** Potwierdzone: `git show 6e9b3e430:gra/src/main.ts` l. 44359 miał `onPurchaseGeneral: (cityId, itemId, koszt) => ... { isGeneral: true }` bez origin. Poprawka: parametr `origin` + przekazanie w `purchaseRecruitmentUnit`. Dowód: test `both configureCityPanel copies: onPurchaseGeneral forwards origin` PASS; `grep -c "onPurchaseGeneral: (cityId: string, itemId: string, koszt: number, origin: RecruitOrigin = 'city')"` = 2. Commit cfa6dd064.
2. **PRZYJMUJĘ CZĘŚCIOWO.** Dodano wiązanie źródłowe, nie test behawioralny. Dowód mutacji M3 (usunięcie `...followIntent,` z wywołania `enqueueRecruitment` w `purchaseRecruitmentUnit`), przeprowadzonej na pliku i przywróconej (`restored True`): `recruit-follow-general-origin-test.cjs` exit 1, `AssertionError ... enqueueRecruitment\(nextProd, \{\s*\.\.\.item,[\s\S]*?\.\.\.followIntent,\s*\}\);` (wcześniej exit 0). Test behawioralny `purchaseRecruitmentUnit` wymagałby harnessu do monolitu `main.ts` (~44k linii, zamknięta funkcja w `boot()`); to poza zakresem tej rundy. ZAŁOŻENIE: wiązanie źródłowe z regexem na wywołanie enqueue jest wystarczające dla tej rundy; luka behawioralna pozostaje jawna (NIE ZMIERZONO w runtime).
3. **PRZYJMUJĘ.** Regex w `general-capital-recruitment-order-test.cjs` zmieniony na `koszt, 'army'\)`. Wynik: source-checks 11 PASS (w tym ten), ok.
4. **PRZYJMUJĘ jako uwagę (bez zmiany kodu).** `purchaseRecruitmentUnits` (main.ts l. 4776) nie ma żadnego wywołania (`grep -rn purchaseRecruitmentUnits gra/src` = tylko definicja i komentarze). Zmiana w niej jest martwym kodem i NIE dowodzi pokrycia partii. Realna partia Armii: `cityPanel.ts` l. 8360 `recruitUnit(entry.city, entry.item, batch, false, 'army')` → `onPurchaseUnit(..., quantity, origin)` → `purchaseRecruitmentUnit(quantity)` z `followIntent` na każdej sztuce. Pokrycie partii wynika z tej ścieżki, nie z `purchaseRecruitmentUnits`. Martwego kodu nie usuwam w tej rundzie (zakres); do decyzji orkiestratora/FC.
5. **NIE ZMIERZONO (weryfikacja na żywo).** Nie uruchomiono Chromium w tej rundzie. Ta runda nie zmienia UI, ale nie potwierdziłem w grze startu OFF w mieście i ON z Armii. Prośba do Final Control: sprawdzić w przeglądarce (maks. 2 procesy) przed READY_FOR_DEPLOY.

## TESTY (surowe wyniki, worktree cfa6dd064)

- `node ./node_modules/typescript/bin/tsc --noEmit` → exit 0 (bez błędów).
- `node tools/recruit-follow-general-origin-test.cjs` → **22 assertions passed**, exit 0 (w rundzie 1: 20).
- Mutacja M3 (usunięcie `...followIntent,`) → exit 1 (czerwony), plik przywrócony, `git diff --stat` czysty poza commitowanymi.
- `node tools/general-capital-recruitment-order-test.cjs` → 11 linii PASS (source-checks), potem `unexpected error: page.evaluate: ReferenceError: hexHasRoomFor is not defined`, exit 1. ZAŁOŻENIE: błąd pre-existing w harnessie przeglądarkowym. Dowód: `git show adb5c1653:gra/src/main.ts` zawiera `hexHasRoomFor` w `purchaseRecruitmentUnit` (l. 4624) i w innych miejscach; diff `adb5c1653..6e9b3e430` ma 0 zmian dotyczących `hexHasRoomFor`. Nie zmierzono na czystej bazie w tej rundzie (brak osobnego checkoutu adb5c1653).
- `git diff --check` → exit 0 (po usunięciu spacji końcowej w nowym teście, przed amendem).
- `npm ci --ignore-scripts` w `gra/` wykonane (tylko do testów; nie `npm run build`/`dev`).

## BLOKADY

- Weryfikacja w przeglądarce: NIE ZMIERZONO (zarzut 5).
- Martwy kod `purchaseRecruitmentUnits` (zarzut 4): uwaga, bez usunięcia.
- Test behawioralny `purchaseRecruitmentUnit` (zarzut 2): poza zakresem; wiązanie tylko źródłowe.
- `general-capital-recruitment-order-test` część przeglądarkowa i `recruitment-batch-contract-test`: pre-existing `hexHasRoomFor` (ZAŁOŻENIE, jak w rundzie 1).

## RUNDY

2/5 (obrona po Evaluatorze, runda 1 Operatora → runda 1 Evaluatora → obrona).

## NASTĘPNY KROK

Evaluator (ponowna ocena zarzutów 1–5 na cfa6dd064) → Final Control (w tym przeglądarka dla zarzutu 5) → integracja orkiestratora. Operator nie integruje i nie pushuje.

DEPLOY/PUSH: NIE WYKONANO

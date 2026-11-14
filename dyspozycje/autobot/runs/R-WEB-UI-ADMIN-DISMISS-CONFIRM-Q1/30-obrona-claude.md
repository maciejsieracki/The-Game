STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-ADMIN-DISMISS-CONFIRM-Q1
GOAL: Odpowiedź obrony Operatora (HAIKU, runda 1) na 7 zarzutów Evaluatora z kandydata 5e2c7f3ed. Każdy zarzut: PRZYJMUJĘ (poprawka + dowód + commit) albo ODRZUCAM (dowód). Kod gry bez zmian poza testem.
ZMIANY-COMMIT: kandydat 5e2c7f3ed (baza fab9a9b75). Obrona: 7bfd5625f — gra/tools/administrator-panel-real-render-test.cjs (A13b nazwa, nowe A13c Anuluj i A13d Esc w kroku potwierdzenia, migawka liczników dla A14). Ten raport: 30-obrona-claude.md (osobny commit). Nie zmieniano gra/src/, gra/data/, WERSJE.md, cityPanel.ts, main.ts, live-verify-administrator-panel.cjs.

## Odpowiedzi na zarzuty

### Zarzut 1 (allowlista: administrator-panel-real-render-test.cjs) — PRZYJMUJĘ, z prośbą o decyzję FC
- Fakt: plik jest poza allowlistą dispatchu (`git diff --name-only fab9a9b75 5e2c7f3ed` pokazuje go obok administratorPanel.ts). Raport 10-operator-claude.md błędnie twierdzi, że „już jest w allowliście” — to nieprawda, sprostowanie tutaj.
- Konieczność: asercja A13 tego testu klikała „Zwolnij” raz i oczekiwała zwolnienia. Po zmianie zachowania (dwa kroki) bez zmiany testu byłby czerwony. Cofnięcie zmiany nie jest możliwe bez czerwonego testu.
- Dlatego: FC/orkiestrator proszeni o (a) dopisanie tego pliku do allowlisty tematu albo (b) wskazanie innego sposobu. Operator nie zmieniał nic więcej poza tym plikiem.

### Zarzut 2 (nowy test to regex na źródle, nie DOM) — ODRZUCAM w zakresie zachowania, PRZYJMUJĘ jako uwagę o kruchości
- Zachowanie (klik Zwolnij / Zwolnij w oknie / Anuluj / Esc) jest sprawdzane w PRAWDZIWYM DOM w Chromium: administrator-panel-real-render-test.cjs, A13, A13a, A13b, A13c, A13d, A14 (kliki `[data-adm-panel-dismiss]`, `[data-adm-dismiss-yes]`, `[data-adm-dismiss-no]`, Esc przez dispatchEvent). Dowód: wynik poniżej.
- admin-dismiss-confirm-test.cjs jest statycznym strażnikiem struktury kodu (regex na handlerBody) i mutacji; nie zastępuje testu DOM i nie jest jego jedynym pokryciem. Przepisanie na test DOM nie dodałoby pokrycia zachowania, którego już nie ma.
- Uwaga przyjęta: regex jest kruchy na formatowanie. Nie przepisano go w tej rundzie (zakres); do rozstrzygnięcia przez FC.

### Zarzut 3 (brak testu DOM dla Anuluj/Esc w kroku potwierdzenia) — PRZYJMUJĘ, naprawione
- Dodano A13c (Anuluj: 0 wywołań onDismiss, nadal zatrudniony, panel otwarty, wraca stopka „Zwolnij”) i A13d (Esc w kroku potwierdzenia: 0 wywołań onDismiss, panel zamknięty).
- Commit 7bfd5625f. Wynik: „55 PASS / 0 FAIL” (surowe wyjście: `PASS: [base] A13c ...`, `PASS: [base] A13d ...`, `55 PASS / 0 FAIL`).

### Zarzut 4 (nazwa A13b nieaktualna) — PRZYJMUJĘ, naprawione
- Nazwa zmieniona na „„Zwolnij” w panelu (bez okna natywnego, dwuetapowo): przed kliknięciem zatrudniony, panel mówi, że koszt nie wraca”. Commit 7bfd5625f.

### Zarzut 5 (live-verify nieaktualny, NIE_ZMIERZONO) — PRZYJMUJĘ
- Fakt: gra/tools/live-verify-administrator-panel.cjs linie 145 i 150 klikają `[data-adm-panel-dismiss]` jednokrotnie i oczekują zwolnienia; linie 119–165 obsługują natywny dialog (`dialogMode`), którego już nie ma. Skrypt da fałszywy FAIL.
- Nie zaktualizowano: plik jest poza allowlistą, a naprawa wymaga przebudowy sekwencji (drugi klik „Zwolnij” w kroku, usunięcie gałęzi dialogu natywnego). Wymaga decyzji FC/orkiestratora (dopisać do allowlisty albo osobny temat R-WEB-LIVE-VERIFY-*).
- Weryfikacja na żywo: NIE_ZMIERZONO. Powód: build gry jest zakazany dla Operatora w gra/ (dozwolony tylko vite --outDir poza repo, nie wykonano w tej rundzie); zrzut okna nie powstał.

### Zarzut 6 (założenie: istnieje natywne okno potwierdzenia zatrudnienia; dispatch nie na origin/main) — PRZYJMUJĘ fakt, ODRZUCAM propozycję window.confirm
- Fakt: na bazie fab9a9b75 natywnego okna zatrudnienia NIE ma; usunął je commit 17b1b401d. Dispatch (00-dispatch.md) założył błędnie istnienie mechanizmu do ponownego użycia. Okno w panelu zrobiono zgodnie z 17b1b401d.
- Fakt 2: 00-dispatch.md nie istnieje na origin/main (`git show origin/main:...00-dispatch.md`: „does not exist”); istnieje na gałęzi origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 (tam go odczytano, wraz z 00-dispatch-DODATEK-claude.md).
- Odrzucam użycie window.confirm: test gra/tools/admin-hire-no-native-dialog-test.cjs wymusza brak window.confirm w administratorPanel.ts, a 17b1b401d jest decyzją właściciela. Zmiana wymagałaby osobnej decyzji ABC właściciela (wskazanie dla orkiestratora), nie zmiany po cichu.
- Dowód: `admin-hire-no-native-dialog-test.cjs` -> „WSZYSTKO ZIELONE”, exit 0 (w tej rundzie).

### Zarzut 7 (duplikat „koszt nie wraca” na ekranie) — ODRZUCAM
- Tekst pytania z dispatchu (GOAL, linia o oknie) wprost zawiera: „Zwolnić administratora miasta <nazwa>? Koszt zatrudnienia nie podlega zwrotowi.” Kopia w oknie potwierdzenia jest celowa: to ostatni ekran przed nieodwracalnym zwolnieniem. Lista efektów nad oknem (effectRows, data-adm-effect="dismiss") to opis skutków, nie pytanie. Bez zmiany.

## TESTY (surowe wyniki w tej rundzie, na 5e2c7f3ed + commit 7bfd5625f)
- `npx tsc --noEmit`: exit 0, bez wyjścia.
- logic-test: „LOGIC OK (213/213)”, exit 0.
- tech-tree-test: „tech-tree-test: 20 pass, 0 fail”, exit 0.
- research-test: „PASSED: 33 / FAILED: 0 / TOTAL: 33” / „ALL GREEN”, exit 0.
- unit-replace-test: „WSZYSTKIE TESTY ZIELONE (21/21)”, exit 0.
- combat-test: „COMBAT TEST: 6/6 pass” / „All sanity checks passed.”, exit 0.
- admin-dismiss-confirm-test.cjs: „== WSZYSTKO ZIELONE ==”, exit 0.
- admin-hire-no-native-dialog-test.cjs: „== WSZYSTKO ZIELONE ==”, exit 0.
- administrator-panel-real-render-test.cjs (Chromium /usr/bin/chromium, bez builda gry): po poprawce „55 PASS / 0 FAIL”, exit 0. Uwaga: przed poprawką snapshotu licznika (commit 7bfd5625f) był 1 FAIL (A14: close 4 zamiast 3, bo nowy krok Esc też zamyka panel) — naprawiono w tym samym commicie, nie ukrywam.
- Czerwień na bazie fab9a9b75 dla real-render: NIE_ZMIERZONO w tej rundzie (Evaluator raportuje 53 PASS na zielono i czerwień przy mutacji window.confirm E9).
- git diff --check: czysty.
- npm ci w gra/ (lokalne node_modules, bez builda): wykonano.

## BLOKADY
1. Allowlista: gra/tools/administrator-panel-real-render-test.cjs poza dispatchem (zarzut 1) — decyzja FC.
2. live-verify-administrator-panel.cjs nieaktualny, poza allowlistą (zarzut 5) — decyzja FC / osobny temat.
3. Weryfikacja na żywo i zrzut: NIE_ZMIERZONO.
4. Decyzja ABC właściciela, jeśli ma być natywne window.confirm zamiast okna w panelu (zarzut 6) — obecnie nie wykonano.
5. Regex w admin-dismiss-confirm-test.cjs kruchy (zarzut 2) — do rozstrzygnięcia przez FC.

## RUNDY
1/5 (runda obrony). Odpowiedź na zarzuty 1–7 z kandydata 5e2c7f3ed.

## UWAGI-DLA-ORKIESTRATORA
- Sprostowanie: 10-operator-claude.md twierdzi, że real-render test był w allowliście — nieprawda.
- Nie wykonano pushu ani zmian w gałęziach innych niż wskazane; nie tworzono sesji ani zadań.

## NASTĘPNY KROK
FC (SONNET): (a) rozstrzygnąć allowlistę dla administrator-panel-real-render-test.cjs; (b) zdecydować o live-verify-administrator-panel.cjs; (c) ocenić obronę zarzutów 2, 6, 7. Kandydat do FC: 7bfd5625f (kod: 5e2c7f3ed + test).

DEPLOY/PUSH: NIE WYKONANO

# R-WEB-UI-TRADE-DIALOG-NO-RERENDER-BOTH-SIDES-Q1 — raport Obrony (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI, web)
TEMAT: R-WEB-UI-TRADE-DIALOG-NO-RERENDER-BOTH-SIDES-Q1
GOAL: bez zmian względem dispatchu (dodanie pozycji nie przebudowuje okna; obie strony w jednym rzucie; neutralna podpowiedź przy pustej stronie; logika wyceny bez zmian).
BAZA: 9ea50e1bf (kandydat Operatora, na 88b257d50). Worktree odłączony na 9ea50e1bf, potem commit obrony.

## ZMIANY/COMMIT

- Kod obrony: `2ff6347f5` (2 pliki: `gra/src/ui/diplomacyTradeBasket.ts`, `gra/tools/trade-dialog-no-rerender-test.cjs`).
- Raport: ten plik, commit osobny (SHA w polu `sha` odpowiedzi).
- Allowlista: bez zmian względem Operatora. Brak zmian w `diplomacyAudience.ts`, `main.ts`, `WERSJE.md`, `gra-robocza/`, `rust-port/`.

## ODPOWIEDZI NA ZARZUTY EVALUATORA

1. (Weryfikacja live: scrollTop 0 przed i po, pełna gra nieuruchomiona) — PRZYJMUJĘ CZĘŚCIOWO. Żywa gra w Chromium (wymaga stanu kampanii) NIE zrobiona w tej rundzie. NIE_ZMIERZONO: realne przewijanie w żywej grze. Poprawiono pomiar w teście (zarzut 2): test ustawia `scrollTop = 40` na `.cdb-body-scroll`, dodaje pozycję po stronie A i sprawdza, że węzeł jest ten sam i wartość 40 została (asercja w 19/19). Zrzuty z wcześniejszej sondy są poza repo i nie są dowodem w tej rundzie.
2. (Brak asercji na tryb, czas, ilości, ultimatum, scrollTop) — PRZYJMUJĘ. Dodano w `trade-dialog-no-rerender-test.cjs` (przed dodaniem po stronie A): wybór „Co turę" (sprawdzany `.selected` po dodaniu), czas umowy 7 (`.cdb-deal-turns`), scrollTop 40 na tym samym węźle, ultimatum wojenne (`.cdb-war-threat-cb`; checkbox istnieje w tym trybie, asercja wykonana). Ilości po stronie B nie są w tym teście: zmiana typu na „Złoto" po stronie B zmieniłaby panel, który test sprawdza wcześniej. NIE_ZMIERZONO dla ilości po stronie B w repo (sprawdzone wyłącznie w sondzie Evaluatora).
3. (Zduplikowany nagłówek z błędnym zdaniem o resetowaniu formularza) — PRZYJMUJĘ. Usunięty skopiowany blok (P-DYPLOMACJA-DUPLIKAT...) i zdanie o resetowaniu; nagłówek zawiera jeden opis i linię o mutacji.
4. (Brak reguły CSS dla `.cdb-neutral-hint`) — PRZYJMUJĘ. Dodana reguła w `diplomacyTradeBasket.ts` obok `.cdb-warn`: `.civ-diplo-basket .cdb-neutral-hint{color:#b8b09a;margin-top:4px;font-style:italic;}`. Wygląd NIE został obejrzany w żywej grze (NIE_ZMIERZONO).
5. (Ścieżki traktatu/pokoju/wasala nie pokryte testem; ryzyko `basketSyncAttributes` z `preserve`) — ODRZUCAM jako wykazany błąd kodu, PRZYJMUJĘ jako ryzyko resztkowe. Brak wykazanego przypadku: istniejące testy zielone (wyniki poniżej). `basketSyncAttributes` przywraca `.selected` tylko, gdy `preserve` jest prawdą, a zmiana stanu przy kliknięciu przechodzi przez DOM przed `refresh()`. Kodu nie zmieniano. Żywe klikanie w trybach traktat/pokój/wasal: NIE_ZMIERZONO. Jeśli Final Control uzna to za wymagane, osobny temat z testem treaty.
6. (Pięć bramek referencyjnych nieuruchomionych przez Operatora) — PRZYJMUJĘ i uruchomiono (wyniki poniżej).

## TESTY (surowe wyniki w tej rundzie, kod 2ff6347f5)

- `npx tsc --noEmit` (gra/): exit 0.
- NOWY `node tools/trade-dialog-no-rerender-test.cjs`: `19/19 PASS` (poprzednio 15/15; dodano asercje z zarzutu 2, w tym warunkową asercję ultimatum, która została wykonana).
- Bramki referencyjne (R-PROC-AUTOBOT §Bramki, z wyjścia):
  - `logic-test.cjs`: exit 0, `LOGIC OK (213/213)`.
  - `tech-tree-test.cjs`: exit 0, `tech-tree-test: 20 pass, 0 fail`.
  - `research-test.cjs`: exit 0, `PASSED: 33 / FAILED: 0 / TOTAL: 33`.
  - `unit-replace-test.cjs`: exit 0, ostatnia linia `[OK] cross-type melee matrix passes for all 15 civilizations; no ranged/mount/siege/civilian/naval leak` (brak jawnego licznika w wyjściu).
  - `combat-test.cjs`: exit 0, `COMBAT TEST: 6/6 pass`.
- Powiązane testy diplomacji (exit 0): `diplomacy-basket-duplicate-ui-test` 31/31; `diplomacy-basket-duplicate-test` 21/21; `diplomacy-basket-edit-test` 25/25; `diplomacy-basket-transfer-test` 24/24; `diplomacy-audience-actions-test` 20 passed, 0 failed; `diplomacy-trade-flex-test` 8/8; `diplomacy-sensible-deals-test` 63 passed, 0 failed; `diplomacy-tech-chip-filter-and-multi-deal-test` 66/66.
- NIE uruchomiono w tej rundzie: `npm run build/dev` (zakaz); żywy Chromium z pełną grą (NIE_ZMIERZONO); testy `diplomacy-audience-close-flush`, `zoom-cutoff`, `deals-active-first` z Operatora (nie powtórzono, bo zapisują PNG do cudzych `dowody/`, patrz UWAGI).
- Mutacja (kryterium d): wykonana przez Operatora (13/15, identyczność węzłów); nie powtórzona w tej rundzie.

## BLOKADY

- Żywa gra w Chromium (kryterium c w pełnej grze, przewijanie w realnym oknie): NIE_ZMIERZONO.
- Ryzyko resztkowe tryby traktatu/pokój/wasal (zarzut 5): NIE_ZMIERZONO na żywo.
- Nie stwierdzono sprzeczności kodu z dispatchem.

## RUNDY

1/5 (ta runda obrony). Brak kolejnych rund.

## NASTĘPNY KROK

Evaluator (Sonnet) powtórnie: sprawdzić commit 2ff6347f5 względem zarzutów 1–6 i zdecydować, czy ryzyko z zarzutu 5 wymaga osobnego tematu. Potem Final Control. Integracja wyłącznie przez orkiestratora.

DEPLOY/PUSH: NIE WYKONANO

## UWAGI-DLA-ORKIESTRATORA

1. Testy `diplomacy-audience-*-real-render-test.cjs` i `zoom-cutoff` zapisują dowody PNG do cudzych katalogów `dyspozycje/autobot/runs/P-DYPLO-UMOWY-AKTYWNE-NA-GORZE-Q1/dowody/` i `P-UI-ZOOM-PRZEGLADARKI-PANELE-UCIETE-Q1/dowody/`. Operator je przywrócił (`git checkout --`). W tej rundzie tych testów nie uruchamiano, więc nic nie zmodyfikowano. Warto to zgłosić jako dług procesowy.
2. Zgłoszenia poza zakresem: brak. Nie tworzono sesji, zadań ani kart.
3. `npm ci --ignore-scripts` w `gra/` wykonano w worktree (node_modules nieśledzone przez git; sprzątnąć po integracji zgodnie z procesem).

# R-WEB-UI-TRADE-DIALOG-NO-RERENDER-BOTH-SIDES-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI, web)
TEMAT: R-WEB-UI-TRADE-DIALOG-NO-RERENDER-BOTH-SIDES-Q1
GOAL: w oknie „Umowa wymiany surowców" dodanie pozycji po jednej stronie (Dodaj do oferty / Dodaj do kontrpropozycji) nie przebudowuje całego okna: pozycja dopisuje się w swojej kolumnie, węzły panelu drugiej strony i przewijanie zostają, wybrane kafle i wpisane wartości są zachowane, obie strony można uzupełnić w dowolnej kolejności przed „Zaproponuj", a pusta strona daje neutralną podpowiedź zamiast ostrzeżenia o odrzuceniu. Logika wyceny i reguły dyplomacji bez zmian.

## ZMIANY/COMMIT

- BAZA: `88b257d50` (origin/main), worktree odłączony (`git checkout --detach 88b257d50`).
- Allowlista użyta: `gra/src/ui/diplomacyTradeBasket.ts` (zmieniony), `gra/tools/trade-dialog-no-rerender-test.cjs` (nowy), ten raport. `gra/src/ui/diplomacyAudience.ts`, `main.ts`, `WERSJE.md`, `gra-robocza/`, `rust-port/` NIETKNIĘTE.
- Przyczyna (diagnoza): każde odświeżenie (`refresh()` po dodaniu, usunięciu, zmianie ilości, kaflu) wołało `renderBasket`, które wykonywało `box.innerHTML = …` dla całego okna. Stąd: kasowanie wpisanych ilości i kafli, reset przewinięcia i zaznaczeń, skok układu.
- Zmiana 1 (rdzeń): zamiast `box.innerHTML` — łatanie DOM „w miejscu" (`morphBasketMarkup`, `basketMorphChildren`). Węzeł, którego wyrenderowany markup (skrót FNV-1a + długość, w atrybucie `data-rhtml`) się nie zmienił, zostaje TYM SAMYM elementem. Zmienione węzły dostają nową treść; przy `basketPreserveFormState` (brak trybu edycji pozycji w tym i poprzednim renderze) wartości i zaznaczenia pól formularza przenoszą się ze starego węzła. Przy edycji pozycji (✎) formularz jest przewypełniany jak dotąd (bez przenoszenia stanu).
- Zmiana 2: listenery w `bindEvents` przechodzą przez `listen()` (WeakMap element → typy zdarzeń), żeby zachowany węzeł nie dostawał zdublowanego handlera. Wszystkie handlery czytają stan w chwili kliknięcia, więc pierwszy zarejestrowany pozostaje poprawny. Pozostał jeden listener poza `bindEvents` (overlay), bez zmian.
- Zmiana 3: `summaryHtml` — gdy jedna strona jest pusta (tryb handlu), zamiast `renderPnBalancePanelFromBasket` (ostrzeżenie „ryzyko odrzucenia") pokazuje `.cdb-neutral-hint`: „Dodaj, co chcesz dostać w zamian — albo wyślij jako dar" (gdy pusta strona kontrpropozycji) lub „Dodaj, co oddasz w zamian — albo wyślij jako dar" (gdy pusta strona oferty). Wycena i progi bez zmian.
- Nie zmieniono: logika wyceny (PW, fair min, bilans), reguły dyplomacji, AI, `main.ts`, `diplomacyAudience.ts`.
- Commit: kod + test + ten raport; SHA w polu `sha` odpowiedzi (commit nie może zawierać własnego SHA w treści raportu).

## TESTY

Wszystkie wyniki z surowego wyjścia komend uruchomionych w tej rundzie.

- `npx tsc --noEmit` (w `gra/`) → exit 0, brak błędów (po ostatniej edycji).
- `node tools/diplomacy-basket-duplicate-ui-test.cjs` → `31/31 PASS` (test istniejący, klika prawdziwe przyciski modala).
- NOWY `node tools/trade-dialog-no-rerender-test.cjs` → `15/15 PASS`. Kryteria: (a) węzeł `.cdb-body-scroll` i węzeł `.cdb-col` strony B są TYMI SAMYMI elementami po dodaniu po stronie A, wybrany kafel strony B zachowany, zaznaczenie zachowane; (b) dodanie po stronie B przy pustej A, potem po stronie A, jedna propozycja z obiema stronami (`onSubmit` wołany raz, payload zawiera „Garncarstwo" i „Obróbka drewna"); (c) pusta strona → `.cdb-neutral-hint` obecny, bez „ryzyko odrzucenia".
- MUTACJA (kryterium d): tymczasowo przywrócone `box.innerHTML = inner` → `13/15 PASS`, 2 FAIL na identyczności węzłów (`.cdb-body-scroll`, `.cdb-col` strony B). Po przywróceniu kodu → `15/15 PASS`.
- Pozostałe testy diplomacji/handlu (wszystkie zielone, zero FAIL w wyjściu):
  - `diplomacy-audience-actions-test.cjs` → 20 passed, 0 failed
  - `diplomacy-audience-close-flush-test.cjs` → 57 pass, 0 fail
  - `diplomacy-audience-deals-active-first-real-render-test.cjs` → 15 PASS, 0 FAIL
  - `diplomacy-audience-zoom-cutoff-real-render-test.cjs` → 11 pass, 0 fail
  - `diplomacy-basket-duplicate-test.cjs` → 21/21 PASS
  - `diplomacy-basket-edit-test.cjs` → 25/25 PASS
  - `diplomacy-basket-transfer-test.cjs` → 24/24 PASS
  - `diplomacy-cyclic-trade-duration-ui-test.cjs` → 12/12 PASS
  - `diplomacy-currency-trade-test.cjs` → 5 pass, 0 fail
  - `diplomacy-relation-deal-text-consistent-test.cjs` → 6 pass / 0 fail
  - `diplomacy-tech-chip-filter-and-multi-deal-test.cjs` → 66/66 PASS
  - `diplomacy-trade-flex-test.cjs` → 8/8 PASS
  - `diplomacy-sensible-deals-test.cjs` → 63 passed, 0 failed
- ŻYWY CHROMIUM (kryterium c): NIE dotyczy pełnej gry. Zbudowany bundle z `diplomacyTradeBasket.ts` (esbuild, te same stuby co w testach) otwarty na stronie w Chromium (`/usr/bin/chromium`, przez `executablePath`; `chromium.launch()` bez opcji nie działa, bo przeglądarka Playwrighta nie jest zainstalowana w tej sesji). Prawdziwe kliknięcia myszą: kafel B → dodanie A (technologia) → dodanie B → „Zaproponuj". Wynik odczytu DOM po dodaniu A: `scrollSameNode: true`, `recvColSameNode: true`, `recvTechValue: "Garncarstwo"`, `recvChipStillSelected: true`, `giveRows: 1`, `neutralHintShown: true`, `warnRyzyko: false`; po dodaniu B: `recvRows: 1`, `giveRows: 1`, `submitDisabled: false`; `pageErrors: []`. Zrzuty: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/live/01-before.png`, `…/02-after-add-give.png` (widoczne: pozycja w OFERUJEMY, zaznaczony kafel w panelu kontrpropozycji, podpowiedź), `…/03-both-sides.png`.
- Pełne 5 bramek z R-PROC-AUTOBOT §Bramki: NIE_ZMIERZONO w tej rundzie (uruchomiono tsc i testy powiązane z tematem, jak wyżej). Nie podaję wyniku pełnego zestawu bramek.

## BLOKADY

- Brak blokady merytorycznej.
- Ograniczenie weryfikacji live: scenariusz live to komponent w prawdziwej przeglądarce, bez stanu gry. Zachowanie przewijania: węzeł kontenera przewijania jest zachowany (sprawdzone), ale wartość `scrollTop` nie została zmierzona, bo treść nie przewijała się przy wysokości 260 px (odczyt 0 przed i po). NIE_ZMIERZONO na żywej grze.
- Nie uruchomiono pełnej gry w Chromium (wymagałoby stanu kampanii); zalecana weryfikacja w grze po integracji.

## RUNDY

1/5 (ten raport). Brak kolejnych rund.

## NASTĘPNY KROK

Evaluator (Sonnet) ma sprawdzić: (1) czy `morphBasketMarkup` nie zostawia nieaktualnego stanu w przypadkach brzegowych (blokada wojenna, tryb umowy traktatowej, przełączenie trybu handel/dar), których ten test nie obejmuje; (2) czy zmiana podpowiedzi nie gubi komunikatu w trybie `gift` (tam `summaryHtml` nie wchodzi w gałąź handlu, więc nie powinna); (3) pełne bramki z R-PROC-AUTOBOT. Następnie Final Control i integracja orkiestratora.

DEPLOY/PUSH: NIE WYKONANO

## UWAGI-DLA-ORKIESTRATORA

1. Istniejące testy UI (`diplomacy-audience-deals-active-first-real-render-test.cjs` i powiązane) NADPISUJĄ pliki PNG w cudzych `dyspozycje/autobot/runs/P-DYPLO-UMOWY-AKTYWNE-NA-GORZE-Q1/dowody/` i `P-UI-ZOOM-PRZEGLADARKI-PANELE-UCIETE-Q1/dowody/` (8 plików modyfikowanych w worktree po uruchomieniu testów). Przywróciłem je `git checkout --`, nie są częścią commita. Warto zgłosić, że testy zapisują dowody do repo.
2. Wykryto i naprawiono w trakcie własnej pracy: odwrócony warunek podpowiedzi (naprawiony przed commitem, test to łapie).
3. Zakres poza tematem, bez działań: nie tworzono żadnych sesji ani zadań, nie integrowano, nie pushowano.

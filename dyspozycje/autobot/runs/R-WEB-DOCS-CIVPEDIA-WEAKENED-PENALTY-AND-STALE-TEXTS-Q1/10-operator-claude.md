STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL
TEMAT: R-WEB-DOCS-CIVPEDIA-WEAKENED-PENALTY-AND-STALE-TEXTS-Q1
GOAL: (1) hasło Civpedii o karze głodu wojska i deficytu złota (zakres, kiedy, o ile, kogo dotyczy, okno przed bitwą), dopisane do indeksu i powiązane linkami; (2) nieaktualne wzmianki „niewdrożone” poprawione po weryfikacji w kodzie; (3) wikiBundle zregenerowany narzędziem.
ZMIANY/COMMIT: baza = origin/main d64cd5d46 (dispatch aa7739998 zawierał tylko pliki dispatchu, bez kodu ostrzeżenia). Zmienione pliki (allowlista): docs/encyklopedia/pojecia/oslabienie-glod-deficyt.md (NOWY), docs/encyklopedia/indeks.md, docs/encyklopedia/pojecia/respekt.md, docs/encyklopedia/pojecia/moc-podzial.md, docs/encyklopedia/pojecia/spichlerz.md (link zwrotny), docs/encyklopedia/pojecia/manpower-rekruci.md (link zwrotny), docs/PORADNIK-GRACZA/12-dyplomacja.md, gra/src/data/wikiBundle.json (tylko `node gra/tools/bundle-wiki-for-game.cjs`), runs/R-WEB-DOCS-CIVPEDIA-WEAKENED-PENALTY-AND-STALE-TEXTS-Q1/** (dispatch + ten raport). Kod gry (gra/src/**, gra/data/**) nie zmieniony.
TESTY (liczby z surowego wyjścia):
- npx tsc --noEmit (gra/): rc=0 (po npm ci w gra/, 71 pakietów)
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: COMBAT TEST: 6/6 pass
- ui-text-leftovers-test.cjs: WSZYSTKO ZIELONE (w tym C1: bundle ma nowy nagłówek zasad Zaufania)
- pr141-matrix-only-data-wiki-test: 15 civ rows and 9 bundled CivPedia pages passed
- diplo-civpedia-values-test: PASS 129 sprawdzeń, 155 wierszy parametrów
- civpedia-historia-infra-test: 18 pass, 0 fail
- prebattle-weakened-warning-test: 22 OK, 0 FAIL
- git diff --check: czysty
- NIE_ZMIERZONO: gry w przeglądarce (kampania → bitwa z ostrzeżeniem); test ai-trade-oneshot-overpay-limit-test nie uruchamiany (poza zakresem, dług #379)
BLOKADY: brak blokad technicznych. Rozbieżności z dispatchem (zob. UWAGI).
RUNDY: 1/5, ostatni werdykt: brak (Operator)
NASTĘPNY KROK: Evaluator (SONNET) weryfikuje treść hasła względem kodu (punkty niżej) i nowe linki; po FC PASS integracja dokumentacji bez deployu gry (wikiBundle wdroży orkiestrator jako FALĘ).
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
1. Baza dispatchu nie zgadza się z plikami. Dispatch wskazywał aa7739998 jako bazę i ścieżki gra/src/game/battle-weakened-note.ts oraz gra/src/ui/... Plik istnieje w gra/src/ui/battle-weakened-note.ts, ale wprowadził go commit b107be3d0 (R-WEB-BATTLE-WEAKENED-HUNGER-DEFICIT-WARNING-Q1), który jest w origin/main, a NIE w aa7739998. Pracowałem na origin/main d64cd5d46, zgodnie z zapisem „BAZA: origin/main d64cd5d46 lub nowszy”. Do wiadomości: w dispatchu jest też zdanie „kroki 1–4 … wdrożone”, które sprawdzałem na main, a nie na aa77399.
2. Korekta faktu z dispatchu: „kogo dotyczy (tylko gracz)” jest BŁĘDNE. Kod nie rozróżnia gracza i AI: isArmyHungry (empire-food.ts) i isGoldDeficit (gold-deficit.ts) sprawdzają tylko barbarzyńców, a goldDeficitBattleOpts/armyHungerBattleOpts (main.ts:34655,34665) nie mają ograniczenia do gracza. Hasło opisuje parytet gracz+AI, barbarzyńcy wyłączeni. Dispatch wymagał „kogo dotyczy (tylko gracz)” — to nie jest zgodne z kodem.
3. Respekt, przewaga militarna: zdarzenia „Przewaga militarna” (+15) i „Słabszy militarnie” (−10) są zdefiniowane w diplomacy.ts (applyDiplomaticEvent, case'y 1014–1021), ale NIE są wywoływane w gra/src (grep poza testami: tylko definicja, case i etykieta diplomacy-factors.ts). Zadanie #328 i #330 w rejestrze są oznaczone „completed”, a kod ich nie wywołuje. To nie jest opis „wdrożone”. Oznaczyłem to w respekt.md i 12-dyplomacja.md jako „do potwierdzenia, nie działa w grze”. DECYZJA DLA WŁAŚCICIELA: czy dopiąć wywołanie (zmiana kodu, osobny temat) czy zostawić opis.
4. Trzy wskazane w dispatchu zdania: respekt.md linia 101 i moc-podzial.md linia 105 przepisane (zasady wdrożone). W 12-dyplomacja.md linia 8 zdanie o „wdrożenie w toku” zastąpione stanem zweryfikowanym. Zaufanie.md — nagłówek „zatwierdzone, jeszcze niewdrożone” występował tylko w aa77399; na origin/main jest już poprawny („Zasady z decyzji właściciela 2026-11-13 (wdrożone)”), więc nie zmieniałem go.
5. Warunki wartości w haśle: mnożnik 0,75 z econ-params (glod_wojska_stat_mult, zloto_deficyt_stat_mult, wszystkie poziomy trudności = 0,75); karencja i atrycja HP (3 tury, 8%/turę normal) również z econ-params. Procent w oknie przed bitwą liczony z mnożnika (battle-weakened-note.ts weakenedPercent).
6. Poza zakresem (nie ruszałem, zgłaszam): test ai-trade-oneshot-overpay-limit-test (dług #379) nie był uruchamiany. Przy okazji zauważono, że civpedia-historia-infra-test wymaga Chromium (fallback /opt/pw-browsers) — działa.
7. Zależność środowiskowa: gra/ nie miała node_modules w świeżym worktree; wykonano `npm ci` w gra/ (tylko instalacja, bez build/dev). node_modules pozostaje w worktree (nieśledzony).

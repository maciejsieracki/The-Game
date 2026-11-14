# R-WEB-DIPLO-LABELS-TRUST-THRESHOLDS-Q1 — DODATEK orkiestratora (runda 1)

## Decyzja właściciela (2026-11-13)
- „Próg trzydzieści zaufania nie jest wrogim poziomem… wrogi powinien zaczynać się poniżej dziesięciu… a przy zerze jest wypowiedziana wojna.” ABC „C”: Wrogi: zaufanie < 10; Nieufny: zaufanie 10–29; od zaufania 30 etykieta jak dziś z relacji (zaufanie + respekt): < 45 Nieufny, < 60 Neutralny, < 120 Życzliwy, ≥ 120 Przyjazny.
- Zmiana dotyczy WYŁĄCZNIE etykiety i jej opisu. Progi umów (pakt, sojusz itd.) zostają.

## Stan obecny
gra/src/game/diplomacy-display.ts, funkcja nastawienieLabelFromScore(zaufanie, respekt, opts) (ok. linii 333): w wojnie zawsze „Wrogi”; poza wojną po sumie zaufanie+respekt: <30 Wrogi, <45 Nieufny, <60 Neutralny, <120 Życzliwy, ≥120 Przyjazny. Wywołania: gra/src/ui/diplomacyAudience.ts ok. 1275 i 2251. W wojnie zaufanie wynosi dziś 0 (krok 1 wdrożony), więc nowa reguła daje „Wrogi” także bez twardego wyjątku — nie usuwaj wyjątku wojny, jeśli testy go pokrywają; zmień tylko, jeśli jest sprzeczny z nową regułą, i opisz w raporcie.

## Wymagane
1. Nowa reguła etykiety (progi 10 i 30 odczytane ze stałych/JSON zgodnie z istniejącą praktyką w tym pliku; jeśli próg 30 jest wspólny z progiem paktu, nie wiąż ich — osobna stała dla etykiety).
2. Zaktualizuj dopisek/hint o wojnie i o „limicie wojennym 29” tylko jeśli stał się nieprawdziwy (limit 29 usunięty w kroku 1; sprawdź, czy tekst w audiencji jeszcze się wyświetla).
3. Hasło docs/encyklopedia/pojecia/relacja.md i inne opisujące etykiety (np. poradnik gracza 12-dyplomacja.md): przenieś etykiety z bloku „zatwierdzone, jeszcze niewdrożone” do opisu obecnych; zregeneruj wikiBundle.json skryptem; zaktualizuj test wartości Civpedii (etykiety).
4. Nowy test gra/tools/diplo-labels-trust-thresholds-test.cjs: zaufanie 0, 9, 10, 29, 30 przy różnych respektach (w tym wysoki respekt + zaufanie 9 → Wrogi; zaufanie 25 + respekt 100 → Nieufny); progi 45/60/120 od zaufania ≥30; w wojnie Wrogi; mutacja progu 10 → 30 czerwieni test.

## Kryteria końca (binarne)
- tsc --noEmit exit 0; pięć bramek: logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6; diplomacy-test, diplo-civpedia-values-test, admin-panstwo-panel-names-test zielone; istniejące testy etykiet zaktualizowane tylko w asercjach progów.
- Zrzut z Chromium NIE jest wymagany (zmiana tekstowa); jeśli uruchomisz test render, opisz wynik.

## Środowisko i zakazy
Worktree, w gra/ npm ci --ignore-scripts; ZAKAZ npm run build/dev; tsc --noEmit wolno. Nie integrujesz, nie deployujesz, nie pushujesz na main. Bez git add -A.

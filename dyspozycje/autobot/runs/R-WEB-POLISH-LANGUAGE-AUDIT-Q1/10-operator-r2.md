# R-WEB-POLISH-LANGUAGE-AUDIT-Q1 — Operator LunaHigh, runda 2

STATUS: WYKONANO WĄSKĄ IMPLEMENTACJĘ; audyt całego UI/CIVPEDII pozostaje CZĘŚCIOWY.
DOMAIN: INFORMATIONAL / teksty kart jednostek
TEMAT: R-WEB-POLISH-LANGUAGE-AUDIT-Q1
DATA: 2026-11-10
MODEL: LunaHigh (handover)
BAZA: `HEAD 727bfcf0fd5ca46b5df17410023192408a0d303b`
GOAL: Poprawić potwierdzone PL-01 oraz zatwierdzone mapowania PL-03 w widoku jednostek, bez zmiany liczb, pól/kluczy danych ani terminologii poza zgodą.

## Zakres zatwierdzony

Rundę 2 i allowlistę zapisano przed zmianami w `00-dispatch.md`: `gra/data/units.json` tylko tekst historii Evocati; `gra/src/ui/entityCards/unitAdapter.ts` tylko prezentacja Top3; nowy test `gra/tools/unit-top3-player-language-test.cjs`; raporty tego runu. Nie zmieniano `text-names.ts`: wspólny resolver FALA601 rozwiązuje id terenu, ulepszeń i zasobów, a nie etykiety wolnej prozy Top3. Zamiast rozszerzać jego kontrakt, dodano mały formatter lokalny dla kart jednostek. `Top3` pozostaje bez zmian w `units.json`; `top3Of` przekazuje pola `tytul`/`tekst` jako tekst do wiersza UI, a szukanie źródeł i testów nie wykazało maszynowego użycia ich dosłownych treści.

## Wdrożone

- [units.json](/workspace/main-integration-20261029/gra/data/units.json:5113): „a niektórzy źródła” → „a niektóre źródła”. To potwierdzona, jednoznaczna zgoda; żadna inna treść historyczna się nie zmieniła.
- [unitAdapter.ts](/workspace/main-integration-20261029/gra/src/ui/entityCards/unitAdapter.ts:93): warstwa prezentacji Top3 tłumaczy zatwierdzone etykiety `Health` (z kontekstową polską odmianą: „Zdrowie: N”, „N punktów zdrowia”, „Najwyższa wartość zdrowia” itd.), `fieldPower` → „Moc”, `Bonus vs Spearman` → „Premia przeciw włócznikom”, `Bonus vs Mount` → „Premia przeciw konnym” i `vs Mount` → „przeciw konnym”. Nieznany tekst pozostaje bez zmian; liczby i dane źródłowe nie są mutowane.
- Nieaktualny komentarz adaptera o 0/75 `Opis` i `Top3` zastąpiono opisem warunkowego renderowania. Bez zmian logiki.
- [unit-top3-player-language-test.cjs](/workspace/main-integration-20261029/gra/tools/unit-top3-player-language-test.cjs:1): nowy test rzeczywistego adaptera i DOM renderera, z danymi z `units.json` oraz kontrolowanym wierszem sprawdzającym wszystkie mapowania, zachowanie nieznanej etykiety i niemutowanie źródłowego `Top3`.

## Kontrole

- `cd gra && node tools/unit-top3-player-language-test.cjs` — PASS; renderuje i sprawdza wszystkie **75/75** wypełnionych sekcji Top3, bez mapowanych fragmentów angielskich; osobno potwierdza poprawioną historię Evocati, niezmienioną nieznaną etykietę i zachowanie źródłowych danych.
- Parsowanie `gra/data/units.json` — PASS; 75 jednostek, Evocati ma 3 pozycje Top3.
- `git diff --check` dla zmienionych plików oraz sprawdzenie trailing whitespace — PASS.
- Bez builda, browsera, commitów, deployu, pushu, edycji rejestru globalnego i zmian wiki. W drzewie są równoległe, niezwiązane aktywne zmiany; nie dotykałem ich.

## Pozostałe

- PL-02 (opis iklwy z „dzirot kolący”) pozostaje niezmienione. Evaluator potwierdził błędne słowo, ale nie zatwierdził nazwy zamiennej; wybranie określenia broni wymaga dowodu historyczno-terminologicznego.
- Inne etykiety w Top3, np. `Bonus vs Distance`, `Bonus vs Slinger`, `Bonus vs Swordsman` i `Bonus vs Offensive`, nie zostały zgadnięte ani zmienione. Wymagają osobnych, zatwierdzonych odpowiedników.
- Niniejszy test obejmuje rzeczywiste 75 sekcji Top3 jednostek oraz przykładową historię Evocati; pozostałe ekrany UI, CIVPEDIA i poradniki nie zostały sprawdzone wyczerpująco. Zadanie nadrzędne pozostaje audytem częściowym.

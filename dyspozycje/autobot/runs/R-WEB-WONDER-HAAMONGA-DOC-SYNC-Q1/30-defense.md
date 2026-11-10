# Obrona — R-WEB-WONDER-HAAMONGA-DOC-SYNC-Q1

STATUS: **FAIL**
DOMAIN: **GAME**
TEMAT: `R-WEB-WONDER-HAAMONGA-DOC-SYNC-Q1`
GOAL: Usunąć mylący opis bonusów Ha'amonga z dokumentacji i wygenerowanego bundle.
ZMIANY/COMMIT: Tylko ten raport obrony; bez zmian źródła ani commita.
TESTY: Read-only inspekcja diffów, źródła dokumentacji, wikiBundle, JSON i runtime TypeScript; `git diff --check` raportu.
BLOKADY: Pozostaje aktywne twierdzenie `+3 Wpływu (cywilizacja)` w katalogu poradnika i wygenerowanym bundle.
RUNDY: 2/5
NASTĘPNY KROK: Operator powinien usunąć twierdzenie z poradnika źródłowego, wygenerować ponownie bundle i przekazać zmianę do Evaluatora.
DEPLOY/PUSH: NIE WYKONANO

## Rozstrzygnięcie sprzeciwu Evaluatora

Sprzeciw Evaluatora dotyczący hasła encyklopedycznego został naprawiony: w
`docs/encyklopedia/cuda/hamonga.md` nie ma już twierdzenia o działającym `+3
Wpływu`. Wpis `cuda/hamonga` w `gra/src/data/wikiBundle.json` odzwierciedla tę
zmianę. `gra/data/wonders.json` nadal ma informacyjny wpis
`dyplomacja_wpływ: 3`, a przeszukanie `gra/src` po `dyplomacja_wpływ` znajduje
wyłącznie komentarz w `wonders-data.ts`, więc wpis JSON nie potwierdza aktywnego
efektu runtime.

Jednak wymaganie braku mylącego aktywnego twierdzenia w dokumentacji i bundle nie
jest spełnione globalnie. `docs/PORADNIK-GRACZA/91-katalog-cudow-antyk.md`
wiersz 255 nadal opisuje Ha'amongę jako dającą `+3 Wpływu (cywilizacja)`.
Kanoniczny bundle zawiera tę samą treść w rekordzie poradnika
`91-katalog-cudow-antyk` (`content`). To jest to samo nieobsługiwane twierdzenie,
które Evaluator zakwestionował, a więc odbiorca nadal może odczytać je jako
działający efekt gry. Poprawka Operatora obejmuje tylko hasło encyklopedyczne i
nie usuwa pozostałego twierdzenia z poradnika. Z tego powodu nie potwierdzam
pełnego usunięcia błędu.

## Potwierdzone efekty runtime

- `gra/data/wonders.json` definiuje `bonusy.miasto` Ha'amonga jako `{ kultura: 3,
  zywnosc: 3 }` (pola JSON: `kultura: 3`, `zywnosc: 3`).
- `sumWonderCityYieldsForOwner` w `gra/src/game/wonders-data.ts` sumuje te
  wartości flat; komentarz funkcji mówi, że caller dodaje tę samą sumę do
  każdego miasta właściciela. Opis `+3 kultury i +3 żywności na turę` w haśle
  źródłowym i rekordzie `cuda/hamonga` jest zgodny z tym zachowaniem.
- Wpis `handel_procent` Ha'amonga ma `cel: handel_morski` i `wartosc: 0.15`.
  `sumWonderTradeRouteBonusForOwner` ogranicza ten bonus do tras `morze`, a
  `trade-routes.ts` stosuje go do przychodu z tras. Opis `+15% dochodu z morskich
  tras handlowych` jest zgodny z danymi i implementacją.
- Inertna etykieta `_meta.cuda_wyscigowe_epoka.2.profil` pozostaje już bez
  „rybołówstwo”; wcześniejsze usunięcie pozostaje nietknięte.

## Kontrole

- Źródło hasła `hamonga.md` oraz rekord bundle `encyklopedia` dla `cuda/hamonga`:
  brak `+3 Wpływu` i `dyplomacja_wpływ`; oba zachowują +3 kulturę, +3 żywność i
  +15% dochodu z morskich tras handlowych.
- Źródło poradnika oraz rekord `poradnik` `91-katalog-cudow-antyk` w bundle:
  `+3 Wpływu (cywilizacja)` nadal obecne — **FAIL**.
- Dane i funkcje runtime potwierdzają efekty miejskie i morski bonus opisane
  powyżej; implementacja nie obsługuje `dyplomacja_wpływ`.
- `git diff --check` dla tego raportu: **PASS**.
- Nie uruchamiałem testów produktu ani przeglądarki; nie wprowadzałem zmian
  źródłowych, nie zmieniałem JSON, nie commitowałem i nie deployowałem.

Obrona nie może uznać sprzeciwu za w pełni rozwiązany, dopóki aktywne twierdzenie
pozostaje w źródle poradnika i wygenerowanym bundle. To znalezisko wykracza poza
pliki źródłowe pierwotnej allowlisty; raport wskazuje je, ale nie rozszerza zmian.

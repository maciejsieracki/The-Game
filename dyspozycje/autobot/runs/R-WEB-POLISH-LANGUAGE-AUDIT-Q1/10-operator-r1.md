# R-WEB-POLISH-LANGUAGE-AUDIT-Q1 — Operator LunaHigh, runda 1

STATUS R1: INFORMATIONAL — 3 potwierdzone grupy problemów, bez zmian źródeł produktu
DOMAIN: INFORMATIONAL
TEMAT: R-WEB-POLISH-LANGUAGE-AUDIT-Q1
DATA: 2026-11-10
MODEL: LunaHigh (handover; operator wskazany w kolejce orkiestratora)
BAZA: `HEAD 727bfcf0fd5ca46b5df17410023192408a0d303b`
GOAL: Wskazać potwierdzone, niezdublowane problemy językowe w aktualnych tekstach widocznych dla gracza, z dowodem źródła/renderowania i bez samodzielnej zmiany balansu, nazw ani logiki.
ZMIANY PRODUKTU: brak. Zmieniono wyłącznie status tego dispatchu i dodano niniejszy raport.
TESTY / BUILD / PRZEGLĄDARKA: nie uruchamiano (audyt informacyjny, zgodnie z poleceniem).

## Metoda i zakres pomiaru

Odczytano bieżące teksty kart odkryć/budynków, technologii, budynków, ulepszeń, cudów i jednostek w `gra/data/{tech-cards-top5,building-cards-top5,tech,buildings,terrain-improvements,wonders,units}.json`, a także źródła CIVPEDII/wiki i poradników oraz ścieżki kart jednostek w `gra/src/ui/entityCards/unitAdapter.ts` i `renderer.ts`. Wykonano wyszukiwania po znanych formach błędów, angielskich etykietach statystyk i podejrzanych frazach; przykłady poniżej zweryfikowano bezpośrednio w danych i adapterze. To runda audytu z ograniczonym raportowaniem potwierdzonych punktów, nie poświadczenie lektury każdego tekstu w każdej ścieżce UI.

## Potwierdzone znaleziska

| ID / pewność | Źródło i obecny tekst | Dowód, że widzi go gracz | Bezpieczna propozycja |
|---|---|---|---|
| PL-01 / wysoka — błąd zgody | `gra/data/units.json:5113`: „…a **niektórzy źródła** wspominają…” | `unitAdapter.ts:289` kopiuje `Historia` do `historicalNote`; `renderer.ts:477-479` zapisuje tę treść w sekcji „Rys historyczny” karty jednostki. | „…a **niektóre źródła** wspominają…”. Zmiana jednego przymiotnika; sens bez zmian. |
| PL-02 / wysoka — literówka/niepoprawny wyraz | `gra/data/units.json:5184`: „Iklwa, krótki, szerokoostrzowy **dzirot kolący**…” | Ta sama ścieżka `Historia` karty jednostki: `unitAdapter.ts:289` → `renderer.ts:477-479`. | „Iklwa, **krótka włócznia o szerokim, kłującym ostrzu**, …”. Usuwa nieczytelne/niepoprawne „dzirot” bez zmiany opisywanej funkcji broni. |
| PL-03 / wysoka — angielskie etykiety i identyfikator w polskich Top 3 | `gra/data/units.json:4553-4558` ma „Najwyższe **Health**”, „**Health 40**”, „Najwyższa **fieldPower**”, „**fieldPower 40**”; przykłady dalszych wystąpień: `4904-4905`, `5117-5118`. `886` zawiera „**Bonus vs Spearman** … **vs Mount**”. | `unitAdapter.ts:90-99` mapuje każde pole `Top3[].tytul/tekst` bez tłumaczenia na etykietę/wartość karty. | Dla zdrowia użyć istniejącej etykiety karty „HP” (`unitAdapter.ts:182`), np. „Najwięcej HP” / „40 HP”. Zastąpić `fieldPower` zatwierdzonym polskim określeniem mocy bojowej; rozwinąć „Bonus vs Spearman/Mount” na polskie nazwy przeciwników. Nie wpisuję finalnego brzmienia tych dwóch nazw bez potwierdzenia terminologii. |

## Zaliczenie znanych przykładów / odrzucenia duplikatów

- Błędy „klucza do tras” i „bez której” z wcześniejszych przykładów są już poprawione w bieżącym `tech-cards-top5.json` (wyszukane w tym źródle; obecnie „klucz do tras” / „bez których”). Nie zgłaszam ich ponownie.
- W `building-cards-top5.json` pozostały frazy „2 glina” i „twojej religii”; wcześniejszy raport `R-WEB-TERMINOLOGY-C-AND-ONESHOT-LABEL-Q1/02-operator-r2.md` jawnie odrzucił ten pakiet stylu jako poza ówczesną allowlistą, a dispatch wskazywał go jako przykład. Nie przedstawiam ich jako nowych znalezisk tej rundy; można podjąć je osobnym, wąskim zakresem.
- Wciąż widoczne „Tarasy (Chiny, Inkowie)” jest wcześniejszą, znaną uwagą stylistyczną z dispatchu terminologicznego, a nie nowym znaleziskiem. Nie proponuję tu nazwy dla oczekujących wpisów #201 („Mała rzeka / Rzeka w sąsiedztwie / Tropiki”) ani zmian balansu.
- Nie znaleziono podstaw, by traktować komentarze/debug, klucze JSON poza ścieżką renderowania albo wewnętrzne test fixtures jako tekst gracza.

## Wykonane kontrole

- `rg -n` po konkretnych frazach oraz podgląd dokładnych rekordów w `gra/data/units.json` potwierdziły teksty i numery linii.
- Odczyt `unitAdapter.ts` potwierdził mapowanie `Historia` i `Top3`; odczyt `renderer.ts` potwierdził render `Historia` do treści karty.
- `git status` przed audytem wykazał aktywne, niezwiązane zmiany Ha'amonga i długu testów weteranów. Nie edytowano ich ani żadnego źródła gry/wiki.
- Brak zmian w danych, kodzie, testach, buildzie, rejestrze globalnym i commitach.

## Następny krok

Przekazać trzy pozycje do niezależnej weryfikacji. PL-01 i PL-02 nadają się po potwierdzeniu do małej allowlisty źródła `gra/data/units.json`; PL-03 wymaga sprawdzenia/uzgodnienia brzmień statystyk przed ewentualną zmianą.

# R-WEB-POLISH-UI-ROUTES-AUDIT-Q2 — Operator LunaHigh, runda 1

STATUS: PASS-WITH-NOTES — route inventory traced; four distinct player-visible language findings registered for review.
DOMAIN: INFORMATIONAL
TEMAT: R-WEB-POLISH-UI-ROUTES-AUDIT-Q2
GOAL: Dokończyć audyt pozostałych aktywnych ścieżek UI/Civpedia po partii kart jednostek FALA609, z potwierdzeniem ścieżek renderowania i macierzą pokrycia.
BAZA: `origin/main` = `2b0f49da4c6101a86652e7919f12cd4454d18fdb`; `HEAD` wskazuje ten sam commit.
ZMIANY/COMMIT: tylko ten raport i `11-coverage-matrix.tsv`; kod i dane pozostawione bez zmian; bez commita.
TESTY: Nie uruchamiano. To początkowy audyt read-only; istniejące testy i ścieżki renderowania zinwentaryzowano w macierzy, ale ich istnienie nie jest dowodem poprawności językowej.
BLOKADY: Brak blokady dla przeglądu źródeł. Pełny playtest każdej kombinacji stanu UI nie wykonany; pokrycie opisano per rzeczywista ścieżka i istniejący dowód.
RUNDY: 1/5
NASTĘPNY KROK: Niezależny evaluator weryfikuje cztery wystąpienia i decyduje, czy kwalifikować poprawki w osobnym, allowlistowanym temacie. Decyzje stylistyczne i zakres produktu pozostają po stronie właściciela.
DEPLOY/PUSH: NIE WYKONANO

## Zakres i metoda

Prześledziłem wejścia z `main.ts` do aktywnych rendererów oraz te fragmenty, które faktycznie umieszczają tekst w DOM albo składają HTML widoczny dla gracza. Dla kandydatów sprawdziłem, czy interpolowane dane mają źródło w stanie gry i czy element należy do aktywnej ścieżki. Nie klasyfikowałem surowych wartości JSON jako błędów bez przejścia przez adapter/translator. Audyt językowy tej rundy jest ograniczony do ścieżek wymienionych w macierzy; nie oznacza sprawdzenia każdego napisu w całej grze.

Nie powtarzam napraw z FALA609: werdykt `50-final-control-r4.md` w temacie `R-WEB-POLISH-LANGUAGE-AUDIT-Q1` ogranicza PASS do dwóch historii jednostek i view-only mapowań Top3 po stronie `unitAdapter.ts`. Nie zgłaszam ponownie błędów gramatycznych ani Top3 jednostek. Nie proponuję nazw dla nierozstrzygniętego `#201`.

## Potwierdzone znaleziska

**UI-01 — liczba obrońców na murach ma zawsze formę „oddziały”.** W `gra/src/battle/siegeHud1E.ts:156` renderer fazy szturmu drukuje `${st.garrison} oddziały`. `BattleScene._updateSiegeHud()` w `gra/src/battle/battleScene.ts:7840-7858` wylicza `garrison` z żywych, nieusuniętych jednostek obrońcy i przekazuje do aktywnego HUD oblężenia (`mountSiegeHud1E` w `4114`). Etykieta jest widoczna w fazie szturmu; np. 1 daje „1 oddziały”, 5 daje „5 oddziały”. Propozycja: zastosować odmianę oddział/oddziały/oddziałów z regułą 12–14, albo konstrukcję bez odmiany, zatwierdzoną przez właściciela.

**UI-02 — kwota kosztów utrzymania budynków wygląda jak liczba budynków.** W `gra/src/ui/empireDetailPanel.ts:1108-1144`, `utrzB` jest pobrane jako `economy.bogactwoUtrzymanieBudynkow`, dodane do `koszty`, a więc oznacza kwotę pieniężną. Podsumowanie kosztów renderuje ją jako `${utrzB} budynki`. Gracz otwiera ten widok w panelu imperium; odrębny wiersz poniżej poprawnie nazywa wartość „Utrzymanie budynków” (`1161`). Propozycja: zachować kwotę i opisać ją jako składnik kosztów, np. „budynki: N” albo „utrzymanie budynków: N”; wybór krótszej etykiety jest redakcyjny.

**UI-03 — dynamiczne liczby tur używają wyłącznie formy „tur”.** Są trzy aktywne miejsca: ETA badania w `gra/src/ui/empireDetailPanel.ts:1681-1686` (`N tur` dla każdej dodatniej wartości), pozostały czas umowy handlowej w `3599-3605` (`N tur`) oraz szczegóły propozycji wymiany w `gra/src/ui/diplomacyDealDisplay.ts:35-68, 300-309` (`przez N tur`). Warunki pokazują też przypadek `1 tur`; wartości pochodzą odpowiednio z `research.turnsLeft`, `d.turnsLeft` i `opts.turns`. `diplomacyAudience.ts` importuje renderer w linii 44 i wywołuje go w linii 2019 dla panelu negocjacji, co potwierdza widoczną ścieżkę. Propozycja: w każdym kontekście renderować „1 tura”, „2–4 tury” i „5+ tur” (z wyjątkiem 12–14); istniejący helper `turaCountWord()` w `empireDetailPanel.ts` obsługuje dwie pierwsze lokalizacje do przeniesienia, a moduł dyplomacji wymaga analogicznego formattera.

**UI-04 — tooltip rekrutacji stale odmienia „jednostka” jako „jednostki”.** `gra/src/ui/unitRecruitCard.ts:348-351` ustawia dostępny przyciskowi „Rekrutuj” tytuł `Rekrutuj ${quantity} jednostki…`. `quantity` to stan edytowalnego pola rekrutacji; dla zamówień 5 lub większych widoczna wskazówka ma błędną odmianę („Rekrutuj 5 jednostki”). Ścieżka panelu miasta tworzy tę kartę w `cityPanel.ts:8326+`, a produkcyjne `main.ts` przekazuje `onPurchaseUnit` (30122, 43703), więc tekst nie wynika z testowego braku callbacka. Propozycja: użyć odmiany jednostka/jednostki/jednostek w tytule; sprawdzić też liczbę 21 i zakres 12–14.

## Fałszywe alarmy odrzucone

- `unitRecruitCard.ts:348` zawiera też techniczne „Wymaga podpięcia onPurchaseUnit przez silnik”, ale to jest gałąź awaryjna tylko wtedy, gdy renderer nie dostał callbacka. Obie produkcyjne konfiguracje `main.ts` przekazują `onPurchaseUnit` (30122, 43703); gałąź nie potwierdza więc usterki w normalnej ścieżce gracza i nie została zarejestrowana.
- Wartości kluczy/nazw w danych kart cudów, ulepszeń, technologii i wiki nie były uznawane za błędy na podstawie samego JSON. Sprawdzałem translator/adaptor oraz renderowanie DOM, gdzie było to potrzebne; znane poprawki raw-ID sprzed audytu są poza znaleziskami tej rundy.
- Teksty klas/Top3 kart jednostek nie są kandydatem do ponownego zgłoszenia: znana partia FALA609 jest osobno zaakceptowana z ograniczonym zakresem przez FC r4.

## Granice

Status jest wynikiem source-trace i przeglądu bieżącego kodu, bez uruchamiania przeglądarki ani testów. Macierz rozdziela ścieżki potwierdzone z kodu od miejsc bez przejścia pełnego scenariusza. Znaleziska dotyczą języka/prezentacji i nie upoważniają do zmiany liczb, nazw encji ani mechaniki.

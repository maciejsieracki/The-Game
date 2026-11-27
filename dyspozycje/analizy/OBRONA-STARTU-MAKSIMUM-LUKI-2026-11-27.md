# Obrona startu na MAKSIMUM — domknięcie luk (R-WEB-EARLY-DEFENSE-MAX-GAPS-Q1, tag REALDEF5)

Status: pomiar Operatora, runda 1/5. Zero zmian w `gra/src/**` i `gra/data/**`.
Poprzednik: `OBRONA-STARTU-WERYFIKACJA-2026-11-27.md` oraz REALDEF4 (`213cb0b30`).
Surowe dane: `dyspozycje/autobot/runs/R-WEB-EARLY-DEFENSE-MAX-GAPS-Q1/` (`maxgaps.jsonl`, logi `econ-*.txt`).

## 0. Ustawienia i definicja „maksimum”

Maksimum (zgodnie z dispatchem i REALDEF4): poziom trudności Trudny, barbarzyńcy Trudny, kultura Trudny,
dyplomacja Trudna, koszty jednostek Wysoki ×4, wzrost ludności Wysoki, mapa Mały, Kontynenty, 2 rywali, świat nowej gry (7992 heksów).

Pomiary wykonane na żywo w Chromium (Playwright, `gra/tools/realdef-max-gaps.cjs`, pochodna `realdef-econ-live.cjs`).
Każdy bieg: jedno ziarno, gracz pasywny poza zakupem obrońcy, jedna sesja na ziarno, deterministycznie.

Wariant „barbarzyńcy wyłączeni” = opcja `brak` w kreatorze (`newGameFlow.ts`, `barbariansLevel: 'brak'`) — NIE jest poziomem maksymalnym,
ale jest wariantem wskazanym w dispatchu (punkt 3); traktowany jako wariant izolujący ekonomię od barbarzyńców.

Odstępstwa od dispatchu (jawnie):
- Suwak podatku: ustawiony KLIKNIĘCIEM w suwak „Skarb” w zakładce „Handel” panelu miasta (`#cs-icon-rail-right` → `.handel-w4-sliders input[type=range]`), wartość 100 + zdarzenie `input` (ta sama ścieżka co przeciągnięcie suwaka). Panel otwiera hak `__hotSeatTestDebug.openCityPanelForTest` (jak w REALDEF4). Nie jest to fizyczny ruch myszą.
- „Zakończ turę”: wykonywana hakiem `__civTest.endTurn()` (jak w REALDEF4), NIE klikiem. Bramka tury (komunikat blokady, dźwignie) czytana z haka `gateInfo`, nie z tekstu DOM.
- Zakup obrońcy: REALNY klik w przycisk „Jednostki do rekrutacji” → przycisk zakupu → „Wróć na mapę” (ścieżka p1 z REALDEF4).

Maksimum dla pozostałych parametrów przyjęte jak w REALDEF4 (NIE ZMIERZONO osobno, czy istnieje wyższy poziom któregoś suwaka).

## 1. Realny UI: suwak podatku 100% na Skarb i zakup obrońcy

| Pomiar (ziarno 4242, t1) | Wartość |
|---|---|
| Podział przed kliknięciem (domyślny, t1) | Skarb 30% / Nauka 60% / Zamożność 10% |
| Prognoza Skarbu przed kliknięciem | +2 / turę |
| Podział po kliknięciu suwaka | Skarb 100% / Nauka 0% / Zamożność 0% (odczyt `getTaxSplit`) |
| Prognoza Skarbu po kliknięciu | +8 / turę |
| Prognoza Skarbu t2–t5 (ta sama dźwignia) | +6 / turę |

Wyniki dla pozostałych ziaren (prognoza Skarbu po kliknięciu, t1): 7 → +5; 778899 → +6; 11 → +9; 2024 → +9.

Dispatch oczekiwał prognozy +6 vs +1. Zmierzona baza bez kliknięcia to +2 (domyślny podział 30/60/10, a nie 33%),
a po kliknięciu +5…+9 zależnie od ziarna. Różnica wynika z innej bazy domyślnej, nie z błędu pomiaru; NIE ZGADUJĘ przyczyny spoza danych.

Skutek Nauki: po kliknięciu Nauka = 0% (odczyt w t1). Nauka w t2–t20 NIE ZMIERZONO (runner nie logował podziału per tura).
Co gracz traci: Nauka = 60% podziału domyślnego, czyli cały dopływ badań w tej dźwigni (kwota badań NIE ZMIERZONO).

Zakup obrońcy klikiem (ziarna 4242 i 7, t5): „Łucznik” — najtańsza jednostka wojskowa (koszt 12 Skarbu + 13 Drewna wg wiersza rekrutacji).
Klik przeszedł (`ok: true`), panel zamknięty realnym przyciskiem. Skarb 26 → 20, Drewno 16 → 7 (po przychodzie +4).

## 2. Drewno

| Ziarno | Drewno t1 → t5 | Drewno t6–t20 (przed utratą/blokadą) | Obrońca kupiony |
|---|---|---|---|
| 4242 | 0 → 4 → 8 → 12 → 16 | 7 (po zakupie), 0 w t7 | t5 |
| 7 | 0 → 4 → 8 → 12 → 16 | 7 (po zakupie) | t5 |
| 778899 | 0 przez cały bieg | 0 | NIE (brak Drewna) |
| 11 | 0 przez cały bieg | 0 | NIE (brak Drewna) |
| 2024 | 0 przez cały bieg | 0 | NIE (brak Drewna) |

Obserwacja: na ziarnach 4242 i 7 miasto daje +4 Drewna / turę od t2; na 778899, 11, 2024 przychód Drewna wynosi 0 w każdej turze t1–t20
(także w wariancie bez barbarzyńców), nawet przy Skarbie rosnącym do 135.
Wniosek: na tych ziarnach brak jest źródła Drewna w pierwszych turach, nie tylko zakupu.

NIE ZMIERZONO: liczba heksów lasu w promieniu pracy miasta startowego (runner nie czyta danych terenu; brak haka terenu w `readState`).
Pytanie „czy da się zdobyć Drewno w t1–10 przez kupno/handel/wioski” NIE ZMIERZONO (nie podjęto prób handlu ani wiosek).
Źródło +4/turę na 4242/7 NIE ZIDENTYFIKOWANE (domyślna hipoteza: praca w mieście na lesie — do potwierdzenia pomiarem terenu).

## 3. Barbarzyńcy

Wariant „barbarzyńcy wyłączeni” (`brak`), suwak i zakup jak wyżej:

| Ziarno | Wynik 20 tur | Zatrzymanie „Zakończ turę” | Miasto |
|---|---|---|---|
| 4242 | zatrzymanie t7 (żywność) | t7: Spichlerz −5 / turę | przeżyte |
| 7 | zatrzymanie t6 (żywność) | t6: Spichlerz −16 / turę | przeżyte |
| 778899 | 20 tur ukończonych | działa | przeżyte |
| 11 | 20 tur ukończonych | działa | przeżyte |
| 2024 | 20 tur ukończonych | działa | przeżyte |

Wniosek 3a: pasywny gracz przeżywa t20 na 3 z 5 ziaren bez barbarzyńców, a „Zakończ turę” działa (hakiem) w tych 3 biegach.
Na 4242 i 7 blokada wynika z ekonomii żywności po zakupie obrońcy (patrz §4), a nie z barbarzyńców — ta sama blokada występuje w wariancie Trudnym.

Barbarzyńcy Trudny (wariant maksimum, tylko z zakupem klikiem):

| Ziarno | Utrata miasta | Pierwsza widoczna jednostka barbarzyńska (min. odległość, liczba widocznych) | Zakup obrońcy |
|---|---|---|---|
| 4242 | nie | brak widocznych do t6 | t5 (blokada t7) |
| 7 | nie | brak widocznych do t6 | t5 (blokada t6) |
| 778899 | TAK, t13 | t11: odl. 2, n=1; t12: odl. 1, n=2 | NIE (brak Drewna) |
| 11 | TAK, t16 | t14: odl. 3, n=1; t15: odl. 1, n=2 | NIE (brak Drewna) |
| 2024 | TAK, t10 | t8: odl. 3, n=1; t9: odl. 1, n=1 | NIE (brak Drewna) |

Fale t15–t20 (liczba jednostek barbarzyńskich w promieniu 5): NIE ZMIERZONO w formie „liczba w promieniu 5”.
Sonda wroga (`foreignNear`) zwraca listę `właściciel:typ` bez współrzędnych; w danych są tylko liczba widocznych jednostek i odległość minimalna.
Dla ziaren, gdzie gracz przeżywa z obrońcą (4242, 7), miasto zostało zablokowane przed t20, więc fal t15–20 nie obserwowano.

## 4. Utrzymanie obrońcy i blokada „Zakończ turę” (ziarna 4242 i 7, maksimum)

Na ziarnie 4242 (Trudny, barbarzyńcy Trudny, zakup w t5):

| Tura | Skarb | Żywność (spichlerz) | Drewno | Prognoza Żywności | Prognoza Skarbu | Jednostki wojskowe | Zakończ turę |
|---|---|---|---|---|---|---|---|
| 1 | 0 | 0 | — | +1 | +2 | 0 | tak |
| 4 | 20 | 3 | 12 | +1 | +6 | 0 | tak |
| 5 | 26 | 4 | 16 | +1 | +6 | 0 | tak, zakup Łucznika |
| 6 | 20 | 5 | 7 | −15 | −10 | 1 | tak |
| 7 | 10 | 0 | 0 | −5 | −10 | 1 | NIE: „zabraknie 5 żywności”; dźwignie: rozwiązanie jednostek +16 Żywności lub +16 Złota |

Na ziarnie 7 analogicznie: zakup w t5, prognoza Żywności −16 w t6, blokada w t6.

Wniosek 4a: jeden Łucznik na maksimum zmienia prognozę żywności z +1 na −15 / turę (utrzymanie jednostki, ta sama wartość co w REALDEF4 ~16 Żywności).
Spichlerz przy starcie wynosi 0–5, więc blokada pojawia się w turze 6–7 z pewnością. To jest zgodne z komunikatem gry „Nie można zakończyć tury”.
Dźwignia „rozwiązanie jednostek” jest jedynym wyjściem w tej konfiguracji.

## 5. Startowy Wojownik (konfiguracja domyślna vs maksimum)

Odpowiedź z kodu (ten sam punkt, nie zgadywanie):
- `gra/src/game/ai-difficulty-bonus.ts`, linie 150–155: `playerStartUnitCount(difficulty)`: easy = 2, normal = 1, hard = 0.
  Komentarz nad funkcją: „Jednostki wojskowe gracza po założeniu pierwszego miasta: easy=2, normal=1, hard=0.”
- `gra/src/main.ts`, linie 12124–12129: `grantPlayerStartUnits` wywołuje `playerStartUnitCount(_menuDifficulty)` i spawnuje `AI_DIFFICULTY_BONUS_UNIT_TYPE` (= `Wojownik`, `ai-difficulty-bonus.ts:15`).
- Zwiadowca nie zależy od trudności: `grantStartingScout` (`main.ts`, linie 12137–12145) dodaje Zwiadowcę dla człowieka zawsze (idempotentnie).

Wniosek 5a: brak Wojownika na Trudnym (hard = 0) jest jawnym wpisem tabeli z komentarzem; wygląda na świadomą zasadę poziomu trudności.
Uzasadnienia biznesowego w kodzie nie ma. Decyzja „czy tak ma być” należy do właściciela (pytanie ABC po turnieju, nie w tym temacie).
Ta sama różnica wpływa na pomiary: na domyślnym (Normalny) gracz startuje z Wojownikiem, na maksimum z samym Zwiadowcą.

## 6. Tabela wniosków (maksimum, 5 ziaren)

Legenda: „obrońca” = Łucznik kupiony klikiem; „utrzymywalny” = po zakupie prognoza Żywności ≥ 0.

| Ziarno | Utrata miasta (barbarzyńcy Trudny) | Przeżycie t20 | Tura pierwszego obrońcy | Utrzymywalny | Drewno (t1–t10) |
|---|---|---|---|---|---|
| 4242 | nie | nie: blokada t7 (ekonomia) | t5 | NIE (−15/turę po zakupie) | +4/turę od t2 |
| 7 | nie | nie: blokada t6 (ekonomia) | t5 | NIE (−16/turę po zakupie) | +4/turę od t2 |
| 778899 | TAK, t13 | nie | brak (Drewno 0) | — | 0 |
| 11 | TAK, t16 | nie | brak (Drewno 0) | — | 0 |
| 2024 | TAK, t10 | nie | brak (Drewno 0) | — | 0 |

Barbarzyńcy wyłączeni: przeżycie t20 w 3/5 ziarnach (778899, 11, 2024); 4242 i 7 blokowane przez ekonomię żywności w t6–7 niezależnie od barbarzyńców.

Jedno zdanie wniosku: na maksimum pasywny gracz traci jedyne miasto w 3 z 5 ziaren między t10 a t16, bo bez Drewna nie kupi żadnego obrońcy,
a na dwóch ziarnach, gdzie Drewno jest, pierwszy obrońca od razu blokuje „Zakończ turę” przez utrzymanie żywności.

## 7. NIE ZMIERZONO (zestawienie)

- Liczba heksów lasu w promieniu pracy miasta (brak haka terenu).
- Handel/kupno Drewna i wioski jako źródło Drewna w t1–10.
- Źródło +4 Drewna/turę na ziarnach 4242 i 7.
- Nauka w t2–t20 i kwota utraconych badań.
- Barbarzyńcy w promieniu 5 (liczba per odległość); dostępna jest tylko liczba widocznych jednostek i minimalna odległość.
- Fale barbarzyńców t15–20 dla ziaren z przeżyciem z obrońcą (brak takich biegów).
- Klik na „Zakończ turę” (użyto hak `__civTest.endTurn`).
- Wyższy niż „maksymalny” poziom któregokolwiek suwaka (przyjęto wartości z REALDEF4).

## 8. Decyzja (nie w tym temacie)

Dispatch nie prosi o zmianę balansu. Wnioski §6 i §4 są gotowe jako dane do pytania ABC właściciela po turnieju
(co ma wynikać z tej luki: Drewno startowe, koszt utrzymania pierwszej jednostki, czy blokada tury po zakupie ma być akceptowana).

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P1-16F-CIVPEDIA-JEDNOSTKI-Q1
GOAL: Status z dowodem dla 51 haseł grupy CivPedii „Jednostki” wobec gra/data/units.json na pinie edb8fb56.
ZMIANY/COMMIT: nowy plik dyspozycje/rust-port/p1/P1-16F-CIVPEDIA-JEDNOSTKI.md (allowlista). Brak commitów.
TESTY: skrypt porównawczy (scratchpad jed16f/compare.py) na danych z pina: 51/51 haseł ze statusem; 49/49 jednostek porównanych liczbowo; 2/2 pojęcia (Bród, Manpower).
Wynik: NADAL ISTNIEJE 43, NAPRAWIONY 7 (6 jednostek + Bród), NIEROZSTRZYGNIĘTY 1 (Manpower).
BLOKADY: brak. Zastrzeżenia: NAPRAWIONY = zgodne pola liczbowe, proza nieprzeliczona; pole "Surowiec" wiki traktowane jako utrzymanie; epoka = pierwszy wpis Dostępna w epokach; wiki = 1/2 fieldPower dla jednostek konnych i rydwanów.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Haiku 5.5 medium) — adwersaryjna kontrola wybranych wierszy i reguł porównania.
DEPLOY/PUSH: NIE WYKONANO

## Obrona (ta sama runda 1/5, druga tura Operatora)

OBRONA: 1 -> PRZYJMUJE: ratio 2× (nie ×5); §2c AUDYT dotyczy budynków. Przyczyna: commit 4c1126de (2026-09-16) przepołowił koszty w units.json; wiki (ostatnia zmiana 918e5993, 2026-09-06) = wartości sprzed tego commitu, 48/49 kosztów równa się dokładnie.
OBRONA: 2 -> ODRZUCAM hipotezę tempa jako przyczynę: KOSZT_JEDNOSTEK_PACE to mnożnik runtime, domyślne tempo to 'niski' (x1.0, playerState.ts:156, main.ts `?? 'niski'`); wiki nie deklaruje tempa. Rozstrzygnięcie przyczyny: 4c1126de. NADAL ISTNIEJE pozostaje (rozjazd wiki vs pin potwierdzony), przyczyna odnotowana.
OBRONA: 3 -> PRZYJMUJE wyjaśnienie: AUDYT §5 (46/49) opisuje stan przed 4c1126de i 161ab227 (oba po 2026-08-13). Dowód: wiki = pre-4c dla 48/49 kosztów; wiki = pre-161ab227 dla 9/9 siły w polu konnych/rydwanów.
OBRONA: 4 -> PRZYJMUJE: Hieros Lochos przeniesiony do NIEROZSTRZYGNIĘTY (Epoka Żelazo vs wiki Brąz = Dostępna[0] Brąz). Konflikt epoki również odnotowany dla Falangi i Wojownika germańskiego (wiki zgadza się z różnymi polami); pozostałe 46 haseł zgodne z obydwoma polami.
OBRONA: 5 -> PRZYJMUJE: Galera ruch 4/— zgodny z wiki „4 (mapa) / — (bitwa)”; dopisane w wierszu 4, status bez zmian.
OBRONA: 6 -> PRZYJMUJE w zakresie dowodu: 25/25 jawnych bonusów z wiki zgodnych z units.json; dane mają bonus vs Mount 50 nieopisany w wiki dla Falangi, Wojownika germańskiego i Wojownika mykeńskiego (dopisane w wierszach 2, 40, 41); status bez zmian.

Zaktualizowany wynik: NADAL ISTNIEJE 43, NAPRAWIONY 6 (5 jednostek + Bród), NIEROZSTRZYGNIĘTY 2 (Hieros Lochos, Manpower). Sprawdzono 51/51.
Plik: dyspozycje/rust-port/p1/P1-16F-CIVPEDIA-JEDNOSTKI.md (§5 zawiera dowody).

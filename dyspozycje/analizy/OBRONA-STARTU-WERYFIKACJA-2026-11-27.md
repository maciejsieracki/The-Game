# Obrona startu gracza — weryfikacja na żywo (R-WEB-EARLY-DEFENSE-VERIFY-Q1, tag REALDEF4)

Data: 2026-11-27. Baza: origin/main 479668c1e. Narzędzie: `gra/tools/realdef-econ-live.cjs` (runner r3, rozszerzony o zmienną `REALDEF_CFG`).
Dane: `dyspozycje/autobot/runs/R-WEB-EARLY-DEFENSE-VERIFY-Q1/dane/econ-REALDEF4-{max,domyslna,wysoki-latwi}.jsonl`.
Zakres: pomiar wyłącznie (zero zmian w `gra/src`, `gra/data`, `WERSJE.md`). Nie proponuje zmiany balansu.

## Co mierzono

- Świat nowej gry (7992 heksów), czekanie na `[ClusterStart]` (poprawka harnessu z r3).
- Politykі: **P0** = pasywny gracz (zero akcji poza zakończeniem tury); **P2** = obrońca: w turze 1 suwak podatku na 100% Pieniądz (ta sama funkcja co suwak, `applyPodzialHandluGracza`), potem zakup najtańszej jednostki wojskowej w panelu miasta, gdy stać gracza (Skarb i Drewno).
- Horyzont: 20 tur (przebieg kończy się przy przegranej miasta, blokadzie „Zakończ turę” lub po t20).
- Ziarna: 4242, 7, 778899, 11, 2024 — po jednym przebiegu każde (gra deterministyczna, powtórzeń nie robiono).
- Konfiguracje:
  - **max**: Trudny, barbarzyńcy Trudny, dyplomacja trudna, kultura trudna, koszt jednostek Wysoki ×4 (`kosztJednostekPace: wysoki`), wzrost ludności wysoki, mapa Mały/Kontynenty. Odczyt z `settingsReadback`: `difficulty: hard`, `kosztJednostekPace: wysoki`. Uznane za maksimum jak w dispatchu; interpretacja „Wysoki ×4” jako ustawienia kosztu jednostek to założenie (etykiety UI nie odczytywano).
  - **domyslna**: Normalny (`difficulty: normal`), barbarzyńcy Normalni, dyplomacja Łatwa, kultura Łatwa, wszystkie tempa Normalne (`settingsReadback` potwierdza `normal`, `latwa`, `latwy`, `normalny`).
  - **wysoki-latwi**: jak max, ale barbarzyńcy Łatwi.
- Konfiguracja „wyłączeni barbarzyńcy” z dispatchu NIE mierzona (poza zakresem tej rundy).

## Tabela: ziarno × konfiguracja (jeden przebieg na komórkę)

Legenda: „strata tN” = miasto przegrane w turze N (`lossTurn`); „przeżycie t20” = 20 tur ukończonych bez utraty; „blokada tN” = „Zakończ turę” zablokowane przez bramkę Skarbu w turze N (harness nie mógł kontynuować); obrońca = zakup jednostki w turze podanej w nawiasie.

| Ziarno | max P0 (pasywny) | max P2 (obrońca, 100% Pieniądz) | domyślna P0 | domyślna P2 | Barb. Łatwi P0 | Barb. Łatwi P2 |
|---|---|---|---|---|---|---|
| 4242 | strata t10 | blokada t7 (obrońca t5 — zakup, potem zabraknie 5 Skarbu) | blokada t1 (zabraknie 6) | przeżycie t20 (Skarb 0 stale, prognoza 0/turę) | przeżycie t20 | blokada t7 (obrońca t5, zabraknie 5) |
| 7 | strata t21 (po zakończeniu t20) | blokada t6 (obrońca t5, zabraknie 3) | blokada t1 (zabraknie 6) | blokada t1 (zabraknie 3, nawet przy 100%) | przeżycie t20 | blokada t6 (obrońca t5, zabraknie 3) |
| 778899 | strata t13 | strata t13 (brak Drewna: obrońca niekupiony) | blokada t1 (zabraknie 6) | blokada t1 (zabraknie 2, nawet przy 100%) | przeżycie t20 | przeżycie t20 (bez zakupu, brak Drewna) |
| 11 | strata t16 | strata t16 (brak Drewna) | blokada t1 (zabraknie 5) | przeżycie t20 (Skarb rośnie do 125) | przeżycie t20 | przeżycie t20 |
| 2024 | strata t10 | strata t10 (brak Drewna) | blokada t1 (zabraknie 5) | przeżycie t20 (Skarb 19) | strata t17 | strata t17 |

Uwagi do tabeli:
- Kolumny „blokada tN” oznaczają, że harness nie mógł zakończyć tury; to NIE jest wynik przeżycia.
- Max P2: „strata t16/t13/t10” przy braku zakupu oznacza, że gracz nie miał Drewna (patrz niżej); obrońca nie został kupiony.
- Domyślna P2 dla ziarna 4242 i 11, 2024: zero strat do t20.

## Wnioski per konfiguracja (jedno zdanie)

- **max**: pasywny gracz traci jedyne miasto w 5/5 ziaren (t10–t21); obrońca w P2 kupiony tylko na ziarnach 4242 i 7 (t5), a na obu zaraz blokuje „Zakończ turę” (t6–t7, brak Skarbu na utrzymanie).
- **domyslna**: pasywny gracz nie kończy nawet tury 1 (Skarb 0, prognoza −5/−6 na wszystkich 5 ziarnach); z suwakiem 100% Pieniądz tura 1 przechodzi na 3/5 ziaren (4242, 11, 2024 — przeżycie do t20 bez utraty miasta), a na 2 pozostałych blokada (7 i 778899).
- **wysoki-latwi**: pasywny gracz przeżywa t20 na 4/5 ziaren (strata tylko na 2024, t17); to barbarzyńcy Łatwi odpowiadają za większość różnicy względem max.

Odpowiedź na pytanie 1 („czy problem jest specyficzny dla maksimum”): NIE w pełni. Pasywna utrata miasta występuje w max na 5/5 ziaren i w wysoki-latwi na 1/5 (2024). W domyślnej grze pasywny gracz w ogóle nie przechodzi tury 1 (blokada bramki Skarbu), więc P0 w tej konfiguracji nie daje danych o utracie miasta. Obrońca przy 100% Pieniądz domyślnie przeżywa 3/5 ziaren do t20.

## Horyzont t20 (pytanie 2)

- Przebiegi, które doszły do t20 bez utraty miasta: wysoki-latwi P0 (4242, 7, 778899, 11), domyslna P2 (4242, 11, 2024), wysoki-latwi P2 (778899, 11).
- max P0 ziarno 7: miasto przetrwało 20 ukończonych tur i zostało stracone po zakończeniu t20 (`lossTurn` 21). W t19–t20 barbarzyńcy na dystansie 3 i 1 od miasta, obok 2 jednostek barbarzyńców („Wojownik szekelesz”).
- Fale barbarzyńców w t15–t20 są widoczne w danych (`barbMinDist`, `foreignNear`) tylko tam, gdzie miasto jest zagrożone; ich liczebności nie rozbijano dalej.

## Drewno, ziarno 778899 (pytanie 3)

- Zmierzone: zasób Drewno w `stock` wynosi **0 przez wszystkie 12 tur** na ziarnie 778899 (P0 i P2, max). Na ziarnach 4242 i 7 Drewno rośnie od t2 (+4/turę).
- NIE ZMIERZONO: liczba heksów lasu w promieniu miasta (brak hooka odczytującego zasoby kafelków), czy da się zdobyć Drewno w t1–10 (np. praca na lesie, kupno na rynku). Wniosek „cecha mapy” wymaga osobnego odczytu map.

## Realny UI i suwak (pytanie 4)

- Zmierzone: po zastosowaniu suwaka 100% Pieniądz (funkcja UI `applyPodzialHandluGracza`) prognoza Skarbu w t2 wynosi **6/turę** na 4242 (P0: 1) i **4/turę** na 7 (P0: 1). Na domyślnej grze (ziarna 11 i 2024) prognoza w t1 wynosi −5, a od t2 +1/turę. Nauka po zmianie = 0.
- NIE ZMIERZONO: klik w suwak w panelu gry (runner wywołuje tę samą funkcję, bez kliknięcia), skutek Nauki 0 dla czegokolwiek w t1–20 (brak śledzenia badań w runnerze).
- Alternatywa „mniej Pieniędzy” nie była mierzona (poza zakresem).

## Dodatkowe obserwacje (do rozstrzygnięcia przez orkiestratora, nie zmieniano gry)

1. **Domyślna gra: pasywny gracz nie może zakończyć tury 1.** Bramka „Zakończ turę” zablokowana na wszystkich 5 ziarnach (prognoza −5/−6, Skarb 0), komunikat: „po zakończeniu tury zabraknie 5–6 złota”. W max prognoza tury 1 wynosi +2. Przyczyna różnicy NIE ZBADANA (kandydat: domyślny podział podatku 60 Nauka / 30 Pieniądz / 10 Luksus, bo P2 go zmienia na 100% Pieniądz). Do weryfikacji, czy to zamierzone; kandydat BŁĄD-GRY, nie rozstrzygnięty.
2. **P2 domyślna, ziarno 4242:** `firstDefenderTurn` = 2 mimo braku zakupu (`purchaseTurn` brak). Pole runnera nie zostało zweryfikowane; traktować jako NIE ZMIERZONO.
3. **Brak Drewna na 778899** blokuje zakup obrońcy w każdej konfiguracji (w tym domyślnej i max).

## NIE ZMIERZONO (zbiorczo)

- Konfiguracja „barbarzyńcy wyłączeni”.
- Powtórzenia ziaren (gra deterministyczna; każde ziarno liczone raz).
- Liczba lasu w promieniu miasta na 778899; możliwość zdobycia Drewna w t1–10.
- Klik suwaka w UI; skutki Nauki 0 w t1–20.
- Fale barbarzyńców liczebnie w t15–20 (tylko odległości i obecność jednostek).
- Pełny rozkład Skarbu w max P2 po zakupie (tylko do blokady).

## Ograniczenia metody

- Każdy przebieg kończy się przy pierwszej blokadzie bramki lub utracie miasta; wynik „blokada tN” nie opisuje przeżycia.
- Strata miasta w danych oznacza przegraną w sensie harnessu (owner=-1, zdobywca: barbarzyńcy).
- Maksimum przyjęte jak w r3 (Trudny + barbarzyńcy Trudny + kultura trudna + dyplomacja trudna + koszt jednostek Wysoki ×4 + wzrost ludności wysoki).

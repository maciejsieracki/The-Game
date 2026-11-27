# Obrona startu gracza — weryfikacja na żywo (R-WEB-EARLY-DEFENSE-VERIFY-Q1, tag REALDEF4)

Data: 2026-11-27. Baza: origin/main 479668c1e. Narzędzie: `gra/tools/realdef-econ-live.cjs` (runner r3, rozszerzony o zmienną `REALDEF_CFG`).
Dane: `dyspozycje/autobot/runs/R-WEB-EARLY-DEFENSE-VERIFY-Q1/dane/econ-REALDEF4-{max,domyslna,wysoki-latwi}.jsonl`.
Zakres: pomiar wyłącznie (zero zmian w `gra/src`, `gra/data`, `WERSJE.md`). Nie proponuje zmiany balansu.

## Co mierzono

- Świat nowej gry (7992 heksów), czekanie na `[ClusterStart]` (poprawka harnessu z r3).
- Polityki: **P0** = pasywny gracz (zero akcji poza zakończeniem tury; na mieście zostaje startowa jednostka, patrz Korekta 7); **P2** = obrońca: w turze 1 suwak podatku na 100% Pieniądz, ustawiony hakiem pomiarowym `__nnsMeasureDebug.setTaxSplit(100,0,0)` (NIE kliknięciem w panel, patrz Korekta 3), potem zakup najtańszej jednostki wojskowej w panelu miasta, gdy stać gracza (Skarb i Drewno). Tury kończy hak `__civTest.endTurn`.
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
- Domyślna P2 dla ziarna 4242, 11 i 2024: brak utraty miasta do t20, ALE obrońca nie został kupiony (`purchaseTurn` brak); w tej konfiguracji na mieście od t1 stoi startowy Wojownik (patrz Korekta 1 i 7), więc brak utraty nie jest dowodem skuteczności obrony.

## Wnioski per konfiguracja (jedno zdanie)

- **max**: pasywny gracz traci jedyne miasto w 5/5 ziaren (t10–t21); obrońca w P2 kupiony tylko na ziarnach 4242 i 7 (t5), a na obu zaraz blokuje „Zakończ turę” (t6–t7, brak Skarbu na utrzymanie).
- **domyslna**: pasywny gracz nie kończy nawet tury 1 (Skarb 0, prognoza −5/−6 na wszystkich 5 ziarnach); z suwakiem 100% Pieniądz tura 1 przechodzi na 3/5 ziaren (4242, 11, 2024 — brak utraty miasta do t20, bez zakupu obrońcy), a na 2 pozostałych blokada (7 i 778899). Ta konfiguracja startuje z Wojownikiem na mieście (max nie), co nie zostało wyjaśnione.
- **wysoki-latwi**: pasywny gracz przeżywa t20 na 4/5 ziaren (strata tylko na 2024, t17); to barbarzyńcy Łatwi odpowiadają za większość różnicy względem max.

Odpowiedź na pytanie 1 („czy problem jest specyficzny dla maksimum”): NIE w pełni. Pasywna utrata miasta występuje w max na 5/5 ziaren i w wysoki-latwi na 1/5 (2024). W domyślnej grze pasywny gracz w ogóle nie przechodzi tury 1 (blokada bramki Skarbu), więc P0 w tej konfiguracji nie daje danych o utracie miasta.
Korekta (zarzut Evaluatora 1): wcześniejsze zdanie „obrońca przy 100% Pieniądz domyślnie przeżywa 3/5 ziaren” jest WYCOFANE. W domyślnej P2 obrońca nie został kupiony na żadnym ziarnie (`purchaseTurn` brak), więc przeżycie 4242, 11, 2024 nie jest efektem obrony. Różnica względem max może wynikać z obecności startowego Wojownika na mieście (Korekta 7) i z łagodniejszych barbarzyńców, ale przyczyna NIE ZBADANA. Łatwi P2 (778899, 11) też bez zakupu obrońcy.

## Horyzont t20 (pytanie 2)

- Przebiegi, które doszły do t20 bez utraty miasta: wysoki-latwi P0 (4242, 7, 778899, 11), domyslna P2 (4242, 11, 2024), wysoki-latwi P2 (778899, 11).
- max P0 ziarno 7: miasto przetrwało 20 ukończonych tur i zostało stracone po zakończeniu t20 (`lossTurn` 21). W t19–t20 barbarzyńcy na dystansie 3 i 1 od miasta, obok 2 jednostek barbarzyńców („Wojownik szekelesz”).
- Fale barbarzyńców w t15–t20 są widoczne w danych (`barbMinDist`, `foreignNear`) tylko tam, gdzie miasto jest zagrożone; ich liczebności nie rozbijano dalej.

## Drewno, ziarno 778899 (pytanie 3)

- Zmierzone: zasób Drewno w `stock` wynosi **0 przez wszystkie 12 tur** na ziarnie 778899 (P0 i P2, max). Na ziarnach 4242 i 7 Drewno rośnie od t2 (+4/turę).
- NIE ZMIERZONO: liczba heksów lasu w promieniu miasta (brak hooka odczytującego zasoby kafelków), czy da się zdobyć Drewno w t1–10 (np. praca na lesie, kupno na rynku). Wniosek o „cesze mapy” (brak Drewna jako właściwość mapy) NIE jest udowodniony; wymaga osobnego odczytu kafelków.

## Realny UI i suwak (pytanie 4)

- Zmierzone (hak pomiarowy `__nnsMeasureDebug.setTaxSplit`, nie klik w UI; patrz Korekta 3): po ustawieniu suwaka 100% Pieniądz prognoza Skarbu w t2 wynosi **6/turę** na 4242 (P0: 1) i **4/turę** na 7 (P0: 1). Na domyślnej grze (ziarna 11 i 2024) prognoza w t1 wynosi −5, a od t2 +1/turę. Nauka po zmianie = 0.
- NIE ZMIERZONO: klik w suwak w panelu gry (runner wywołuje tę samą funkcję, bez kliknięcia), skutek Nauki 0 dla czegokolwiek w t1–20 (brak śledzenia badań w runnerze).
- Alternatywa „mniej Pieniędzy” nie była mierzona (poza zakresem).

## Dodatkowe obserwacje (do rozstrzygnięcia przez orkiestratora, nie zmieniano gry)

1. **Domyślna gra: pasywny gracz nie może zakończyć tury 1 (obserwacja, NIE kandydat BŁĄD-GRY w tym dokumencie).** Bramka „Zakończ turę” zablokowana na wszystkich 5 ziarnach (prognoza −5/−6, Skarb 0), komunikat: „po zakończeniu tury zabraknie 5–6 złota”. W max prognoza tury 1 wynosi +2. Zjawisko zmierzone, ocena zamierzenia należy do analizy `dyspozycje/analizy/NNS-T1-I-KOSZT-ULEPSZEN-ZYWNOSC-2026-11-26.md` (sekcja pytania 12): wg tej analizy blokada tury 1 jest zamierzona (decyzja z 2026-11-14), a pytanie 12 czeka na właściciela. Przyczyna różnicy max/domyślna (podział podatku, koszty) NIE ZBADANA w tym pomiarze.
2. **`firstDefenderTurn` = 2 w domyślnej P2 (4242, 11, 2024) NIE oznacza obrońcy.** Pole liczy KAŻDĄ jednostkę wojskową na mieście (poza zwiadowcą, osadnikiem, robotnikiem). W danych `turns[0].playerOnHex` = ["Zwiadowca","Wojownik"] już w turze 1, czyli to startowy Wojownik, nie zakupiona jednostka (Korekta 7).
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

## Korekty po przeglądzie Evaluatora (runda obrony 1/5)

Każdy zarzut z raportu Evaluatora (commit 20ad521f2) ma status PRZYJĘTY (poprawka w tej rundzie lub NIE ZMIERZONO) albo ODRZUCONY z dowodem. Odrzuconego nie ma.

1. **PRZYJĘTY: wniosek o skuteczności obrony w domyślnej grze wycofany.** Dowód: `dane/econ-REALDEF4-domyslna.jsonl`, wiersze `kind=result`, `policy=p2`: `purchaseTurn=null` na 4242, 11, 2024 (Drewno 0 lub brak klucza). Obrońca nie został kupiony, więc przeżycie tych ziaren nie jest efektem obrony. Łatwi P2 (778899, 11) też bez zakupu. Evaluator wskazał, że na ziarnie 11 `barbMinDist`=1 od t7 do t20 bez utraty miasta: to NIE ZBADANE.
2. **PRZYJĘTY: pole `barb` było błędne.** We wszystkich 30 wierszach trzech plików `"barb":"trudny"` (`grep`), bo runner zapisywał stałą `BARB_LEVEL` (zmienna `DEFEAT_BARB_LEVEL`), a nie poziom przekazany w ustawieniach. Poprawka w `gra/tools/realdef-econ-live.cjs` (wiersz zapisu wyniku): `barb: ADV.barbariansLevel`. Istniejące dane NIE zostały przepisane; dla konfiguracji domyślnej i wysoki-latwi poziom barbarzyńców czytać z nazwy konfiguracji (Normalni / Łatwi). `settingsReadback` nie zawiera `barbariansLevel`, więc poziom barbarzyńców jest ustawiony, ale NIE ZWERYFIKOWANY odczytem. Wcześniejsze zdanie, że readback to potwierdza, jest wycofane.
3. **PRZYJĘTY: naruszenie zakazu haków.** Suwak ustawiany przez `window.__nnsMeasureDebug.setTaxSplit(100,0,0)` (`gra/tools/realdef-econ-live.cjs`, wiersz 232), a tura kończona przez `window.__civTest.endTurn()` (wiersz 300). To hak zmieniający stan, nie UI, więc zakaz z dispatchu został złamany. Punkt 4 dispatchu (klik w panel) NIE WYKONANO. Liczby „+6/turę” i „+4/turę” dotyczą stanu ustawionego hakiem, nie klikniętego suwaka. Skutek Nauki 0 NIE ZMIERZONO. Potwierdzenie wymaga osobnej rundy z kliknięciem w UI.
4. **PRZYJĘTY: „cecha mapy” nieudowodniona.** Zmierzono tylko zasób Drewna = 0 przez 12 tur na 778899. Liczba lasu w promieniu miasta i możliwość zdobycia Drewna w t1–10: NIE ZMIERZONO. Wariant (c) z dispatchu brzmi „barbarzyńcy Łatwi lub wyłączeni”: zmierzono wariant Łatwych, wariant „wyłączeni” NIE ZMIERZONO. Horyzont t15–20: tylko odległości i obecność jednostek, liczebność fal NIE ZMIERZONO.
5. **PRZYJĘTY: konfiguracja „domyślna” nie jest w pełni domyślna.** Runner ustawia `battleAlwaysManual: false`, a domyślne ustawienia kreatora to `true` (`gra/src/ui/newGameFlow.ts`, wiersz 304). `villageRewardsEnabled: true` oraz parametry świata (Mały, Kontynenty, 2 rywali) NIE ZWERYFIKOWANO jako domyślne kreatora. Wpływ odchyleń NIE ZMIERZONO. Runnera nie zmieniano, bo to wymagałoby ponownego biegu.
6. **PRZYJĘTY: etykieta BŁĄD-GRY usunięta.** Blokada tury 1 w domyślnej grze jest zjawiskiem zmierzonym (5/5 ziaren). Ocena zamierzenia należy do `dyspozycje/analizy/NNS-T1-I-KOSZT-ULEPSZEN-ZYWNOSC-2026-11-26.md` (sekcja pytania 12): wg tej analizy blokada jest zamierzona (decyzja z 2026-11-14), a pytanie 12 czeka na właściciela. Rozbieżność, która nie jest tu wyjaśniona: NNS-T1 podaje prognozę −2 (4242) i −3 (777) przy podatkach 30/60/10, a ten pomiar daje −5/−6 w konfiguracji domyślnej (P0, bez zmiany podatku). Przyczyna NIE ZBADANA.
7. **PRZYJĘTY z dowodem: `firstDefenderTurn` nie oznacza obrońcy.** Pole liczy każdą jednostkę wojskową na mieście poza zwiadowcą, osadnikiem i robotnikiem. W danych `turns[0].playerOnHex` konfiguracji domyślnej = `["Zwiadowca","Wojownik"]` we wszystkich 10 wierszach (P0 i P2), czyli startowy Wojownik. W max i wysoki-latwi `["Zwiadowca"]`. Konsekwencja: konfiguracja domyślna startuje z Wojownikiem na mieście, max nie, a przyczyna tej różnicy NIE ZBADANA. Dlatego pasywny gracz w domyślnej grze NIE jest bez obrony. W runnerze dodano komentarz przy `firstDefenderTurn`.
8. **PRZYJĘTY: drobne.** Literówka „Politykі” poprawiona na „Polityki”. Wiersz „domyślna P2: zero strat” doprecyzowany: bez zakupu obrońcy, z startowym Wojownikiem.

Wynik po korekcie: tabela ziarno × konfiguracja pozostaje bez zmian (liczby nie zostały przeliczone ani zmienione). Wnioski zawężono: w domyślnej grze brak utraty miasta nie jest dowodem obrony, a konfiguracja domyślna różni się od max startowymi jednostkami, czego ten pomiar nie wyjaśnia.

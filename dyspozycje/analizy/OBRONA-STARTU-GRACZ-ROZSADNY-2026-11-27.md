# Obrona startu gracza — REALDEF, runda 3 (2026-11-27)

Tag: R-WEB-EARLY-DEFENSE-REALISTIC-Q1, runda 3/5 (Operator Sonnet). Baza kodu: `0fa94344c` (origin/main).
Zero zmian w `gra/src`, `gra/data`, `WERSJE.md`, manifeście, `rust-port/`. Zmiany tylko w narzędziach pomiarowych
(`gra/tools/realdef-econ-live.cjs` nowy, `gra/tools/realdef-live.cjs` tylko nagłówek ostrzegawczy) i w dokumentach.
Dane: `dyspozycje/autobot/runs/R-WEB-EARLY-DEFENSE-REALISTIC-Q1/dane/` (JSONL, jeden wiersz na przebieg).

Ustawienia wszystkich pomiarów = MAKSIMUM: Trudny, dyplomacja „trudna”, Koszty jednostek Wysoki ×4, Wzrost ludności Wysoki,
kultura „trudny”, barbarzyńcy Trudny, mapa Mały / Kontynenty, jakość mapy Wysoka. Readback ustawień z gry
(`__settingsLive.getSettings()`) jest w polu `settingsReadback` każdego wiersza. Poziom maksymalny dźwigni dochodu
(suwak podatku) = 100% na Pieniądz (wariant P2).

## 0. Najważniejsze (cztery zdania)

1. **Wszystkie dotychczasowe pomiary tego tematu i DEFEAT (r1, r2 i pierwsze 54 przebiegi tej rundy) były wykonane na świecie
   startowym (podgląd, 1008 heksów), a nie na wygenerowanym świecie nowej gry (7992 heksów)** — błąd harnessu, nie gry (§1).
   Na prawidłowym świecie wynik jest zależny od ziarna: ziarno 4242 — miasto ginie w 10. turze w 13/13 przebiegów, 778899 — w 13. turze
   w 10/10, ziarno 7 — 0/10 utrat do 14. tury (barbarzyńcy nie podeszli).
2. **Najtańszy obrońca (12 Pieniędzy + 13 Drewna) jest dostępny najwcześniej w 5. turze** — i tylko wtedy, gdy gracz przesunie CAŁY podatek na Pieniądze
   (poziom maksymalny; dochód Skarbu rośnie z +1 do +6 na turę, Nauka spada do 0); przy domyślnym podatku najwcześniej w 12. turze.
3. **Pierwszy obrońca jest nieutrzymywalny**: utrzymanie 16 Pieniędzy + 16 Żywności na turę przy dochodzie +6 / +1 — gra blokuje
   „Zakończ turę” w 6.–7. turze (§5). Czy jeden obrońca w ogóle zatrzymałby barbarzyńców: NIE ZMIERZONO (P2).
4. Utrata `owner=null` z r2 = artefakt tego samego wyścigu (podmiana świata na prawdziwy po 16–22 s), nie błąd gry i nie efekt otwartego panelu (§1).

## 1. Błąd harnessu: wyścig z generowaniem świata (diagnoza `owner=null` i wymóg „bez zależności od czasu rzeczywistego”)

Objaw (r2): w części przebiegów miasto znikało z listy (`owner=null`), licznik tury wracał do 1, `gameOver=false`.
Odtworzenie minimalne (bez żadnych kliknięć, tylko `endTurn` + odczyt co 200 ms, log wszystkich komunikatów konsoli):

| Czas od otwarcia strony | Zdarzenie (log gry) |
|---|---|
| 0,6 s | start strony; 1,7 s: `mapGen total=1033 ms`, 2,7 s: `buildScene hexCount=1008` = **świat startowy (podgląd)** |
| 3,3 s | `[NewGame] Nacja gracza…` — start generowania świata NOWEJ gry (ten sam moment co `startNewGame`) |
| 2,3 s i dalej | `awaitingFirstPlayerCity` jest `true` **już na świecie podglądu** — runner (`waitForFunction(awaitingFirstCity)`) zakłada miasto i gra tury na podglądzie |
| ok. 20–29 s (generowanie trwa 16–23 s przy obciążeniu maszyny 10–17; bez obciążenia krócej — NIE ZMIERZONO) | `mapGen total=16–23 s`, potem `buildScene hexCount=7992`, `[ClusterStart]`, `blocked: awaitingFirstPlayerCity` = **prawdziwy świat podmienia stan gry**: lista miast pusta, tura 1 |

- Brak nawigacji strony (`framenavigated` tylko przy ładowaniu), brak crasha, brak komunikatu `[Victory]` — to nie przegrana ani przeładowanie.
- Gdy przebieg kończy się przed podmianą (typowo przy 0 s bezczynności, ~8–10 s), wynik dotyczy świata podglądu; gdy trwa dłużej (bezczynność 1,6 s/turę,
  wolniejsza maszyna) widać `owner=null`. Dlatego „opóźnienia czasu rzeczywistego zmieniają wynik” (r2) i „P1 gubi miasto w 5.–7. turze”.
- **Weryfikacja diagnozy:** bez poprawki `owner=null` występuje tym częściej, im dłużej trwa przebieg: `dopen` (panel otwarty) 0/4, `dclose` (otwórz+zamknij panel) 2/4, `didle` (1,6 s bezczynności/turę) 7/10 (plik NIEWAZNE, pole `infra`);
  z poprawką (czekanie na log `[ClusterStart]` przed założeniem miasta): 0/3 (`didle`, ziarno 4242, wszystkie utrata w 10. turze, identycznie jak bez bezczynności).
  Zależność od czasu trwania przebiegu, nie od rodzaju akcji (zakup/panel), wskazuje na wyścig; wycofane: „panel zmienia dochód”, „panel zrywa stan sesji”.
- Poprawka w nowym runnerze: czekanie na `[ClusterStart]` (log tylko z zastosowania świata nowej gry) przed `awaitingFirstCity`. Zmierzone: `hexCount=7992` w każdym wierszu
  (`mapGenLog`). Na prawidłowym świecie gospodarka jest **identyczna we wszystkich przebiegach danego ziarna** (r2: „tempo losowe per przebieg” było losowością świata podglądu).
- Skutek dla wcześniejszych wyników: DEFEAT (34/37) i P0 z r2 (11/12) oraz moje pierwsze 36 przebiegów P0 na podglądzie (33/36) opisują świat podglądu. Fisher dwustronny:
  P0 prawidłowy świat (23 utraty / 10 przeżyć) vs DEFEAT (34/3): p = 0,029; vs P0 na podglądzie (33/3): p = 0,030 — różnica istotna.
- **UWAGA-DLA-ORKIESTRATORA:** ten sam wzorzec (`startNewGame` → od razu `awaitingFirstCity`) mają `defeat-cause-live.cjs`, `realdef-live.cjs` i inne runnery (lista w raporcie);
  krótkie przebiegi (≤ 20 s) są zagrożone, długie (150 tur) wznawiają się same po podmianie. Nie weryfikowałem ich poza tymi dwoma.

## 2. Inwentarz ekonomii startu (bez udziału UI; wyłącznie odczyty; P0 pasywny; świat nowej gry)

Źródło: `dane-r3-econ-swiat-nowej-gry.jsonl` (wiersze `policy=p0`: 33 przebiegi = 13 + 10 + 10). `turn` = `gateInfo().turn`; wiersz `turns[i]` = stan na POCZĄTKU tury i+1.

| Ziarno | Przebiegi | Miasto utracone | Tura utraty | Zdobywca | Pierwszy barbarzyńca ≤ 3 heksy | Utrata po jego pojawieniu |
|---|---|---|---|---|---|---|
| 4242 | 13 | 13/13 | 10 (min = med = max) | barbarzyńcy | tura 8 (13/13) | 2 tury |
| 778899 | 10 | 10/10 | 13 | barbarzyńcy | tura 11 (10/10) | 2 tury |
| 7 | 10 | 0/10 (do tury 14) | — | — | brak do tury 14 | — |
| razem | 33 | 23/33 | med 10 | | | |

Tura utraty ma jedną definicję: numer tury odczytany po zakończeniu tury, w której miasto zmieniło właściciela (= liczba ukończonych tur + 1). W danych `owner=null` = 0 wierszy (INFRA = 0).
Pole `infra`/`powodNiewiarygodnosci` w JSONL oznacza wiersz, w którym miasto zniknęło bez zdobywcy (−1).

Zasoby na początku tury (ziarna są deterministyczne — wszystkie przebiegi ziarna dają te same liczby):

| Tura | Skarb (Pieniądze) wszystkie ziarna | Drewno 4242 / 7 / 778899 | Żywność w Spichlerzu 4242 / 7 / 778899 |
|---|---|---|---|
| 1 | 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| 2 | 2 | 4 / 4 / 0 | 1 / 0 / 1 |
| 4 | 4 | 12 / 12 / 0 | 3 / 0 / 3 |
| 5 | 5 | 16 / 16 / 0 | 4 / 0 / 4 |
| 8 | 8 | 28 / 28 / 0 | 7 / 0 / 7 |
| 10 | 10 | (utrata) / 36 / 0 | — / 0 / 9 |
| 12 | 12 | — / 44 / 0 | — / 0 / 11 |

- Dochód Skarbu (prognoza gry): +2 w turze 1, potem +1 na turę (344/344 odczytów t ≥ 2). Żywność netto +1 (ziarna 4242, 778899) albo 0 (ziarno 7). Praca miasta 7→6 (4242), 5→4 (7), 4→3 (778899).
- Drewno przychodzi z początkowego terenu: +4/turę (4242, 7), **brak w ogóle na ziarnie 778899** (zapas tylko Gliny — 10/10 przebiegów). Kamień +1/turę, Glina +6…+11/turę.
- Wiersze rekrutacji (czytane z gry w każdej turze 1–14, wszystkie ziarna, bez zmian w czasie — nowych jednostek wojskowych w tym horyzoncie nie przybywa):

| Jednostka | Koszt Pieniądze (×4) | Drewno | Pula rekrutów | Dostępność (miasta zdolne / wszystkie) |
|---|---|---|---|---|
| Oszczepnik | 12 | 13 | 2000 | 1 / 1 |
| Łucznik | 12 | 13 | 2000 | 1 / 1 |
| Wojownik | 20 | 13 | 2000 | 1 / 1 |
| Rydwan (woły) | 60 | 25 | 2000 | 1 / 1 |

Wymagana technologia lub budynek: w tej grze wiersze są dostępne od tury 1 bez badań (i zakup przez panel miasta w P1/P2 się powiódł bez badań); wymóg Koszar/technologii NIE występuje.

**Rozkład „najwcześniejsza tura, w której gracza STAĆ na najtańszą jednostkę wojskową” (Skarb ≥ 12 i Drewno ≥ 13), podatek domyślny (P0):**

| Ziarno | Skarb ≥ 12 | Drewno ≥ 13 | Oba | Tura utraty miasta |
|---|---|---|---|---|
| 4242 | tura 12 (ekstrapolacja: Skarb = numer tury; pomiar kończy się w t9, miasto ginie t10) | tura 5 | **tura 12 (ekstrapolacja)** | 10 |
| 7 | tura 12 | tura 5 | **tura 12** | brak do 14 |
| 778899 | tura 12 | **nigdy** (brak Drewna) | **nigdy** | 13 |

Min/med/max po wszystkich 33 przebiegach: „oba” = tura 12 w 10 przebiegach (cały zbiór ziarna 7), w 23 przebiegach nie w ich horyzoncie. Kupno przed utratą miasta w 10/33 przebiegów — **wyłącznie na ziarnie 7, gdzie barbarzyńcy nie przyszli**.
Na ziarnach, gdzie miasto ginie (4242, 778899): **0/23 przebiegów** miało środki na obrońcę przed utratą miasta przy domyślnym podatku.

## 3. Czas produkcji jednostki (Wysoki ×4)

- Jednostki wojskowe kosztują **Pieniądze, Drewno i pulę rekrutów, nie Pracę** (`unitProductionItem`/`purchaseRecruitmentUnit`: koszt w złocie, `unitStockCost` w surowcach, manpower z imperium). Praca miasta (4–7/turę) nie bierze udziału.
- Po zapłacie jednostka trafia do kolejki rekrutacji i **pojawia się w mieście na początku następnej tury** (limit 1 jednostka/turę/miasto). Zmierzone realnym kliknięciem: zakup w turze 5 → jednostka w mieście w turze 6 (P2: ziarno 4242 4/4 przebiegów, ziarno 7 1/1); zakup w turze 12 → w turze 13 (P1, ziarno 7, 3/3).
- Czas „od zlecenia do obrońcy” = 1 tura. Wąskim gardłem jest zdobycie środków (Pieniądze), nie produkcja.

## 4. Inne środki obrony w turach 1–14 (c) i panel armii (d)

- **Palisada** (22 Pracy, 60 Drewna, technologia „Obróbka drewna”) i **Mury kamienne** (35 Pracy, 80 Drewna + 80 Kamienia, „Murarstwo”): z zapasu Drewna (4242/7: +4/turę) 60 Drewna to tura 16, 80 Drewna tura 21, 80 Kamienia ok. tura 81 (+1/turę) —
  **niedostępne przed turą utraty 10/13 niezależnie od Pracy i badań**; na ziarnie 778899 nigdy (brak Drewna). (Wyliczenie z zmierzonych zapasów; budowy nie próbowałem.)
- Garnizon (budynek, 30 Pracy + 30 Drewna, bez technologii): opis w danych to „stała straż porządkowa, budynek PRAWA, nie wojska” — nie jest obroną; wpływu na szturm NIE ZMIERZONO.
- Fort: wymaga Murów i technologii (poza zasięgiem). Awans Zwiadowcy: NIE ZMIERZONO.
- **Panel armii / generał:** zamówienie z panelu armii wymaga wybranego generała (gra odmawia bez niego); w turach 1–14 gracz ma tylko Zwiadowcę, dostępność generała NIE ZMIERZONO. Zakup przez panel miasta (zakładka „Jednostki do rekrutacji”) działa bez generała — tą ścieżką wykonano P1/P2.

## 5. P1 i P2 (akcje gracza wyłącznie realnymi ścieżkami; bez haków zmieniających stan)

Protokół: panel miasta otwierany **tylko w turze, w której odczyt pokazuje, że gracza stać** (brak bezczynności i otwartego panelu w pozostałych turach); zakładka „Jednostki do rekrutacji” →
przycisk zakupu najtańszej jednostki → zamknięcie przyciskiem „Wróć na mapę”. Nie użyto `forceFortLive`, `__siegeBlockTestDebug.tryPurchase`, `prepareEndTurnGate`, `setPlayerTreasury` ani żadnego haka zmieniającego stan.
Wyjątek jawny (P2): suwak podatku ustawiany funkcją gry `applyPodzialHandluGracza` (ta sama co suwak w UI) — dźwignia gracza, nie „cheat”.

| Wariant | Ziarno | Przebiegi | Zakup w turze | Obrońca w mieście od tury | Co dalej |
|---|---|---|---|---|---|
| P1 (podatek domyślny) | 7 | 3 | 12 (3/3) | 13 | tura 13: „Zakończ turę” zablokowana (brakuje 14 Pieniędzy i 8 Żywności na turę) |
| P1 | 4242 | — (=P0: stać dopiero w t12, miasto ginie t10) | brak | — | niewykonalne przed utratą |
| P1 | 778899 | — (=P0: brak Drewna) | brak | — | niewykonalne |
| P2 (100% podatku na Pieniądze) | 4242 | 4 | **5 (4/4)** | **6** | tura 7: blokada „zabraknie 5 Żywności”; jedyne dźwignie to rozwiązanie jednostki (+16 Pieniędzy, +16 Żywności) |
| P2 | 7 | 1 | 5 | 6 | tura 6: blokada (zabraknie 3 Pieniędzy, Spichlerz) |
| P2 | 778899 | 2 | brak (Drewno 0) | — | miasto ginie w 13. turze (identycznie jak P0) |

- P2 (4242): Skarb 0 → 8 → 14 → 20 → 26 w turach 1–5 (prognoza +6/turę zamiast +1), zakup Łucznika w turze 5 (Drewno 16→3, Skarb 26→14), tura 6: obrońca na polu miasta;
  prognoza netto po zakupie: Skarb −10/turę (z +6), Żywność −15/turę (z +1) → utrzymanie jednostki ≈ 16 Pieniędzy + 16 Żywności na turę (komunikat gry: „rozwiązanie jednostek +16 złota i +16 żywności na turę”).
- Cena podatku 100% na Pieniądze: Nauka 0 (60%→0%) — gracz nie prowadzi badań.
- P2/P3 poza zakupem (bitwy ręczne, mury): **NIE ZMIERZONO** — przebieg nie dochodzi do tury 8–10 (blokada końca tury w 6.–7. turze po zakupie), a mury poza zasięgiem Drewna (§4). Próba: P2 ziarno 4242 ×4, ziarno 7 ×1 — wszystkie zatrzymane blokadą tury.
- Fisher P1 vs P0 / P2 vs P0: nie dotyczy — P1 i P2 nie dochodzą do utraty miasta (blokada) albo są identyczne z P0 (brak zakupu); liczba utrat w P1/P2 = 0, w P0 = 23/33.

## 6. Wnioski (bez oceny „czy za trudne” — to decyzja właściciela)

1. Pytanie rundy „czy rozsądny gracz może mieć obrońcę przed utratą miasta (8–13)”: przy podatku domyślnym — **nie** na ziarnach 4242 i 778899 (0/23 przebiegów); przy 100% podatku na Pieniądze — **tak, od 6. tury**
   na ziarnach z Drewnem (4242, 7), ale **nie na 778899** (brak Drewna w ogóle).
2. Obrońca kupiony w 5. turze **blokuje koniec tury w 6.–7. turze** (utrzymanie 16 + 16 na turę vs dochód +6 / +1). Czy gracz mógłby go utrzymać innymi środkami (Żywność, racje, Targowisko, rozwiązanie Zwiadowcy): NIE ZMIERZONO; komunikat gry wskazuje wyłącznie rozwiązanie jednostek.
3. Wynik zależy od ziarna: 4242 i 778899 giną (10., 13. tura), 7 do 14. tury nie traci miasta. Przeżywalność do 20. tury: NIE ZMIERZONO (horyzont 14 tur).
4. Poprzednie liczby (92%, „tempo losowe”, „Skarb ≥ 12 w turze 7 w 4/12 przebiegów”) pochodzą ze świata podglądu i są wycofane.

## 7. DECISION_REQUIRED (jedno zdanie konfliktu na wariant; bez proponowania rozwiązania)

Na najtrudniejszym ustawieniu pierwszy obrońca, na którego gracza stać najwcześniej w 5. turze (tylko po przesunięciu całego podatku na Pieniądze, bez nauki), kosztuje 16 Pieniędzy i 16 Żywności na turę utrzymania przy dochodzie +6 i +1, więc gra przestaje pozwalać zakończyć turę.
- Wariant A (mniejsze lub zerowe utrzymanie pierwszych jednostek gracza, jak dziś ma komputer w pierwszych turach): obrońca da się utrzymać, ale najtrudniejsze ustawienie kosztów jednostek traci znaczenie na początku gry.
- Wariant B (gracz zaczyna z jednostką bojową): miasto ma obrońcę od tury 1, ale ta jednostka też musi mieć utrzymanie, inaczej problem wraca.
- Wariant C (bez zmian): na ziarnach 4242 i 778899 miasto ginie w 10. i 13. turze w 23/23 przebiegów, a jedyny dostępny obrońca jest nieutrzymywalny.
Szczegóły (nie do pytania właścicielowi): ten dokument §2, §5; dane `dane-r3-econ-swiat-nowej-gry.jsonl`. Czy jeden Łucznik zatrzymałby 1–3 Wojowników barbarzyńców: NIE ZMIERZONO (wymaga rozstrzygnięcia utrzymania lub wariantu A/B).

## 8. NIE ZMIERZONO / ograniczenia

- Przeżywalność do tury 20 (horyzont 12–14 tur); ziarna poza 4242, 7, 778899; poziomy barbarzyńców inne niż „Trudny”.
- P2 (bitwy ręczne) i P3 (mury): patrz §5. Wpływ obrońcy na wynik szturmu: NIE ZMIERZONO.
- Czas badań potrzebnych do Palisady/Murów (zbędny dla wniosku — Drewno jest ograniczeniem).
- Pula rekrutów (manpower): odczyt nie ma haka; zakup przez panel powiódł się w 8/8 prób, więc w tych turach starczało.
- Ziarno 778899: rozstrzygnięcie, czy brak Drewna to cecha mapy (zasób), nie badane.
- Pozostałe runnery z tym samym wzorcem startu (§1) nie były weryfikowane.

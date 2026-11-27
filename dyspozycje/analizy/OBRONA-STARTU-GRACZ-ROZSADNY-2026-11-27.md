# Obrona startu gracza — REALDEF, runda 3 (poprawiona po obronie, 2026-11-27)

Tag: R-WEB-EARLY-DEFENSE-REALISTIC-Q1, runda 3/5. Baza kodu: `0fa94344c` (origin/main); kandydat do obrony: `4be8bb0fc`.
Zero zmian w `gra/src`, `gra/data`, `WERSJE.md`, manifeście, `rust-port/`. Ta runda zmienia tylko dokumenty (ten plik
i raport w `dyspozycje/autobot/runs/R-WEB-EARLY-DEFENSE-REALISTIC-Q1/`). Narzędzia z kandydata (`gra/tools/realdef-econ-live.cjs`,
`gra/tools/realdef-live.cjs`) pozostają bez zmian.
Dane: `dyspozycje/autobot/runs/R-WEB-EARLY-DEFENSE-REALISTIC-Q1/dane/` (JSONL, jeden wiersz na przebieg).

Ustawienia pomiarów = MAKSIMUM: Trudny, dyplomacja „trudna”, koszty jednostek Wysoki ×4, kultura „trudny”, barbarzyńcy Trudny,
mapa Mały / Kontynenty. Readback ustawień jest w polu `settingsReadback` każdego wiersza (zgodny z tym opisem).

**Jednostka statystyczna = ziarno, nie przebieg.** Świat nowej gry jest deterministyczny: w każdym ziarnie gospodarka jest identyczna
we wszystkich przebiegach (sprawdzone: 33 przebiegi P0 dają 3 różne serie skarbu, po jednej na ziarno). Dlatego powtórzenia NIE są
niezależnymi próbami i ŻADEN test istotności nie jest tu raportowany. Efektywna próba = 3 ziarna.

## 0. Najważniejsze

1. **Wyniki z poprzednich rund (DEFEAT 34/37, r2 11/12, pierwsze przebiegi r3) pochodzą ze świata podglądu (1008 heksów), nie
   świata nowej gry (7992 heksy).** Diagnoza wyścigu harnessu opiera się na logach czasu i pomiarach kontrolnych; poprawki
   nie wykazano na pełnym zestawie. DEFEAT i realdef r1–r2 NIE zostały ponownie uruchomione (§1, §9).
2. **Na świecie nowej gry, P0 (pasywny, podatek domyślny), ziarno 4242 — miasto ginie w turze 10 (13/13 przebiegów, jedna seria);
   778899 — w turze 13 (10/10, jedna seria); ziarno 7 — brak utraty do tury 14 (10/10, jedna seria).** Dwa z trzech ziaren tracą miasto.
3. **Najwcześniejsza tura, w której gracz MA środki na najtańszego obrońcę (Oszczepnik/Łucznik: 12 Pieniędzy + 13 Drewna):**
   ziarno 7 — tura 12 (zmierzone do tury 14); ziarno 4242 — tura 12 (EKSTRAPOLACJA: pomiar kończy się w turze 9); ziarno 778899 — nigdy
   w turach 1–12 (brak Drewna, przyczyna nie zbadana). Przed turą utraty miasta (10 / 13) gracz na ziarnach tracących miasto NIE
   ma środków przy podatku domyślnym.
4. **Wariant z całym podatkiem na Pieniądze (P2) daje obrońcę w turze 5 (ziarna 4242, 7), ale jest to wynik INFORMACYJNY:
   użyto funkcji gry ustawiającej podatek przez hak (§5, §9 pkt 4).** Jego utrzymanie blokuje koniec tury w turach 6–7 — NIE ZMIERZONO
   w dłuższym horyzoncie, więc nie wolno z tego wnioskować o „nieutrzymywalności” jednostki.

## 1. Diagnoza harnessu (wyścig z generowaniem świata) — status: WNIOSKOWANE, częściowo zweryfikowane

Objaw (r2): w części przebiegów miasto znikało z listy (`owner=null`), licznik tury wracał do 1, `gameOver=false`.

Hipoteza: `startNewGame` uruchamia generowanie świata nowej gry (16–23 s przy obciążeniu), a runner od razu zakłada miasto
i gra tury na świecie podglądu. Podmiana na prawdziwy świat czyści stan. Sygnatury z logów czasu (log przeglądarki):
- ok. 2,7 s: `buildScene hexCount=1008` (świat podglądu); 3,3 s: start `[NewGame]`;
- ok. 20–29 s: `mapGen total=16–23 s`, potem `buildScene hexCount=7992`, `[ClusterStart]` (świat nowej gry).

Dane pośrednie (plik NIEWAZNE, świat podglądu, pole `infra`): `dopen` (panel otwarty) owner=null 0/4, `dclose` 2/4,
`didle` (1,6 s bezczynności/turę) 7/10. Zależność od czasu trwania przebiegu jest zgodna z hipotezą, ale NIE jest
dowodem przyczynowym — nie odtworzono zdarzenia w sposób kontrolowany na świecie nowej gry.

Poprawka w runnerze r3 (czekanie na `[ClusterStart]` przed założeniem miasta): w świecie nowej gry `hexCount=7992` w każdym wierszu
(`mapGenLog`), a `owner=null` = 0 wierszy. Poprawki NIE zweryfikowano na pełnym zestawie przebiegów z bezczynnością (`didle`) na
świecie nowej gry — to jest NIE ZMIERZONO.

Wycofane wcześniejsze tezy: „panel zmienia dochód”, „panel zrywa stan sesji”, „tempo losowe per przebieg” (losowość była
artefaktem świata podglądu).

UWAGA-DLA-ORKIESTRATORA: ten sam wzorzec startu (`startNewGame` → od razu `awaitingFirstPlayerCity`) mają `defeat-cause-live.cjs`,
`realdef-live.cjs` i inne runnery. NIE weryfikowałem ich. Wynik DEFEAT (34/37) i realdef r1–r2 należy traktować jako
niezweryfikowane co do świata.

## 2. Inwentarz ekonomii startu (bez akcji gracza; wyłącznie odczyty; P0 pasywny; świat nowej gry)

Źródło: `dane-r3-econ-swiat-nowej-gry.jsonl`, wiersze `policy=p0` (33 przebiegi: ziarno 4242 — 13, ziarno 7 — 10, ziarno 778899 — 10).
Wiersz `turns[i]` = stan na POCZĄTKU tury i+1. Ziarna są deterministyczne: jedna seria na ziarno.

| Ziarno | Przebiegi | Miasto utracone | Tura utraty | Zdobywca | Turns odczytane |
|---|---|---|---|---|---|
| 4242 | 13 (1 seria) | 13/13 | 10 | barbarzyńcy | do tury 9 (utrata w 10) |
| 778899 | 10 (1 seria) | 10/10 | 13 | barbarzyńcy | do tury 12 |
| 7 | 10 (1 seria) | 0/10 | — | — | do tury 14 |

Definicja tury (spójna w runnerze, pole `definicjaTury`): `tura_utraty = gateInfo().turn` odczytane po zakończeniu tury, w której miasto
zmieniło właściciela, czyli liczba ukończonych tur + 1. Zgodność z definicją w DEFEAT NIE ZWERYFIKOWANA (DEFEAT nie był ponownie
uruchomiony), więc porównania „tura utraty” między dokumentami są niewalidowane.

Pole `infra`/`powodNiewiarygodnosci` (wiersze z miastem zniknięte bez zdobywcy): wartość `false` w 46/46 wierszach
świata nowej gry. Mechanizm owner=null NIE został pozytywnie przetestowany w tym świecie — jedyny dowód to plik NIEWAZNE (§1).

Zasoby na początku tury (odczyt; ziarna identyczne w obrębie ziarna):

| Tura | Skarb (Pieniądze), wszystkie ziarna | Drewno 4242 / 7 / 778899 | Kamień 4242 / 7 / 778899 |
|---|---|---|---|
| 2 | 2 | 4 / 4 / 0 | — |
| 5 | 5 | 16 / 16 / 0 | 4 / 4 / 0 |
| 8 | 8 | 28 / 28 / 0 | 7 / 7 / 0 |
| 9 | 9 | 32 / 32 / 0 | 8 / 8 / 0 |
| 12 | 12 (ziarno 7 i 778899 zmierzone; 4242 niezmierzone) | — / 44 / 0 | — / 11 / 0 |

Glina (zapas): 4242 — 44 w turze 5, 88 w turze 9; 7 — 24 i 48; 778899 — 32 i 64 (tury 5 i 9). Żywność (Spichlerz) w tej rundzie nie była
porównywana z tabelą i NIE jest tu raportowana.

- Dochód Skarbu (prognoza gry, P0): +2 w turze 1, potem +1 na turę. Drewno: +4/turę na 4242 i 7, **brak na 778899** (przyczyna NIE
  ZBADANA — zapas tylko Gliny). Praca miasta 7→6 (4242), 5→4 (7), 4→3 (778899).
- Rekrutacja (odczyt z gry, tury 1–14, bez zmian w czasie):

| Jednostka | Koszt Pieniądze (×4) | Drewno | Pula rekrutów | Dostępność |
|---|---|---|---|---|
| Oszczepnik | 12 | 13 | 2000 | od tury 1, bez technologii |
| Łucznik | 12 | 13 | 2000 | od tury 1, bez technologii |
| Wojownik | 20 | 13 | 2000 | od tury 1, bez technologii |
| Rydwan (woły) | 60 | 25 | 2000 | od tury 1, bez technologii |

Najwcześniejsza tura ze Skarbem ≥ 12 i Drewnem ≥ 13 (P0, podatek domyślny):

| Ziarno | Skarb ≥ 12 | Drewno ≥ 13 | Oba | Tura utraty miasta |
|---|---|---|---|---|
| 7 | 12 (zmierzone) | 5 (zmierzone) | **12 (zmierzone)** | brak do 14 |
| 4242 | 12 (EKSTRAPOLACJA: Skarb = numer tury; pomiar do tury 9) | 5 (zmierzone) | **12 (ekstrapolacja)** | 10 |
| 778899 | 12 (zmierzone) | nigdy w turach 1–12 | nigdy w turach 1–12 | 13 |

Na ziarnach tracących miasto (4242, 778899) przy podatku domyślnym: 0 z 2 ziaren ma środki na obrońcę przed turą utraty.
Na ziarnie 7 środki są od tury 12, a miasto nie ginie — wynik nie rozstrzyga pytania o obronę.

## 3. Czas produkcji jednostki (Wysoki ×4)

- Jednostki wojskowe kosztują Pieniądze i Drewno oraz pulę rekrutów; NIE kosztują Pracy miasta (koszt w złocie i surowcach
  z odczytu rekrutacji). Praca nie wchodzi w obronę startu.
- Zakup przez panel miasta (zakładka „Jednostki do rekrutacji”, bez generała) dodaje jednostkę do kolejki; jednostka pojawia się
  w mieście w następnej turze. Zmierzone realnym kliknięciem: zakup w turze 5 → obrońca w turze 6 (P2: ziarno 4242 4/4 przebiegów,
  ziarno 7 1/1); zakup w turze 12 → w turze 13 (P1, ziarno 7, 3/3). Czas od zlecenia = 1 tura; wąskim gardłem są środki (Pieniądze).
- Czas produkcji przez Pracę miasta (odczyt kolejki produkcji miasta, bez klikania): NIE ZMIERZONO w tej rundzie.

## 4. Inne środki obrony w turach 1–14 i panel armii

- Palisada (technologia „Obróbka drewna", 60 Drewna) i Mury kamienne (80 Drewna + 80 Kamienia, „Murarstwo"): WYLICZENIE z zapasów
  (Drewno +4/turę na 4242 i 7 → 60 Drewna ok. tura 16, 80 Drewna ok. tura 21; Kamień +1/turę → 80 ok. tura 81). Budowy NIE próbowano.
  Na 778899 nie do wyliczenia (brak Drewna). Wpływ murów na obronę: NIE ZMIERZONO.
- Garnizon (budynek, 30 Pracy + 30 Drewna): wg opisu w danych budynek prawa, nie wojsko. Wpływu na szturm NIE ZMIERZONO.
- Fort: wymaga Murów i technologii (poza zasięgiem w tym horyzoncie, wyliczenie). Awans Zwiadowcy: NIE ZMIERZONO.
- Panel armii / generał: zamówienie z panelu armii wymaga wybranego generała; dostępność generała w turach 1–14: NIE ZMIERZONO.

## 5. P1 i P2 (akcje gracza wyłącznie realnymi ścieżkami — z jednym zastrzeżeniem)

Protokół: panel miasta otwierany w turze, w której gracza stać; zakładka „Jednostki do rekrutacji” → przycisk zakupu najtańszej
jednostki → zamknięcie „Wróć na mapę”. Zakup przez UI powiódł się w 8/8 prób.

| Wariant | Ziarno | Przebiegi | Zakup w turze | Obrońca w mieście od tury | Co dalej |
|---|---|---|---|---|---|
| P1 (podatek domyślny) | 7 | 3 (1 seria) | 12 (3/3) | 13 | tura 13: Skarb 12→1, „Zakończ turę” zablokowana |
| P1 | 4242 | 0 (wnioskowane) | — | — | nie zmierzono: miasto ginie w turze 10, zanim gracz ma środki (z inwentarza §2) |
| P1 | 778899 | 0 (wnioskowane) | — | — | nie zmierzono: brak Drewna (§2) |
| P2 (podatek 100% na Pieniądze, dźwignia przez funkcję gry — zastrzeżenie) | 4242 | 4 (1 seria) | 5 (4/4) | 6 | tura 7: blokada (brak Żywności na utrzymanie) |
| P2 | 7 | 1 | 5 | 6 | tura 6: blokada |
| P2 | 778899 | 2 | brak (Drewno 0) | — | miasto ginie w turze 13, jak P0 |

Zastrzeżenie P2: suwak podatku ustawiono funkcją gry `applyPodzialHandluGracza` (ta sama, której używa suwak w UI), przez hak.
Dodatek r2 zakazywał haków zmieniających stan, więc P2 jest wynikiem INFORMACYJNYM. Nie służy do wniosków o balansie bez
potwierdzenia suwakiem w UI.

Zdarzenie niewyjaśnione (P2, ziarno 4242, przebieg 1): Drewno 16 → zakup (−13) → 3 → tura 6: 7 → tura 7: **0**, mimo +4/turę
i bez zakupu. Spichlerz 5 → 0 w tym samym czasie. Przyczyna NIE ZBADANA (możliwe: utrzymanie jednostki surowcem lub zdarzenie
gry); nie wolno tego przypisywać utrzymaniu jednostki bez dalszego odczytu.

Próba P2/P3 poza zakupem (bitwy ręczne, mury): NIE ZMIERZONO — przebiegi są zatrzymywane blokadą końca tury w turach 6–7.

Poprzednia teza „obrońca nieutrzymywalny” jest zawężona: w 1–2 obserwowanych turach po zakupie gra blokuje koniec tury (P1 tura 13,
P2 tury 6–7). Utrzymanie przez dłuższy horyzont, racje, Targowisko i rozwiązanie Zwiadowcy: NIE ZMIERZONO.

Fisher: NIE RAPORTOWANY. Liczby utrat są jedną serią na ziarno (§0); porównania par wariantów nie są próbami niezależnymi.

## 6. Wnioski (bez oceny „czy za trudne” — to decyzja właściciela)

1. Pytanie rundy: czy rozsądny gracz może mieć obrońcę przed utratą miasta. Przy podatku domyślnym — na ziarnach tracących miasto
   (4242, 778899): NIE, w zbadanych turach (0 z 2 ziaren). Przy podatku 100% na Pieniądze (informacyjnie) — na ziarnie 4242 i 7
   od tury 6, na 778899 NIE (brak Drewna).
2. Wynik zależy od ziarna: 2 z 3 ziaren tracą miasto (w turach 10 i 13). Przeżywalność do tury 20: NIE ZMIERZONO (horyzont 14 tur).
3. Wartość „tura 12” dla ziarna 4242 jest ekstrapolacją; dla 7 i 778899 zmierzona.

## 7. DECISION_REQUIRED (dla orkiestratora; jedno zdanie konfliktu na wariant; bez proponowania rozwiązania)

Na ziarnach 4242 i 778899 miasto ginie w turze 10 i 13, a w zbadanych turach gracz na maksimum nie ma środków na obrońcę przed tą turą
(przy podatku domyślnym); obrońca dostępny wcześniej wymaga przesunięcia całego podatku na Pieniądze, co wyłącza naukę, a jego
utrzymanie blokuje koniec tury po 1–2 turach.
- Wariant A (bez zmian): na tych ziarnach gracz na maksimum nie ma obrońcy przed utratą miasta.
- Wariant B (zmiana kosztu lub utrzymania wczesnych jednostek): obrońca wcześniej, kosztem innej ekonomii gracza w pierwszych turach.
- Wariant C (zmiana startu, np. jednostka wojskowa od tury 1): miasto ma obrońcę od początku, zmienia się rozpoczęcie gry dla każdego gracza.
Szczegóły (nie do pytania właścicielowi): §2, §5; dane `dane-r3-econ-swiat-nowej-gry.jsonl`.
Warunek: wniosek wymaga potwierdzenia suwakiem w UI (P2 jest informacyjny) i ustalenia przyczyny braku Drewna na 778899.

## 8. NIE ZMIERZONO / ograniczenia

- Przeżywalność do tury 20; ziarna poza 4242, 7, 778899; poziomy barbarzyńców inne niż Trudny.
- P1 na ziarnach 4242 i 778899 (nie zmierzono, wnioskowane z inwentarza); P1 n = 3 (jedno ziarno) zamiast ≥ 20/ziarno.
- P2 (bitwy ręczne) i P3 (mury): NIE ZMIERZONO. Wpływ obrońcy na szturm: NIE ZMIERZONO.
- Liczba i siła jednostek barbarzyńców w pobliżu w turze utraty: NIE ZMIERZONO w danych r3 (pole `lastBarbNear` 1/2/0 — tylko odległość, nie liczebność).
- Czas produkcji przez Pracę miasta: NIE ZMIERZONO. Czas badań Palisady/Murów: NIE ZMIERZONO.
- Przyczyna braku Drewna na 778899: NIE ZBADANA. Przyczyna spadku Drewna w P2 4242 (§5): NIE ZBADANA.
- Pula rekrutów (manpower): odczyt bez haka; zakupy powiodły się 8/8.

## 9. Odpowiedzi na zarzuty Evaluatora (runda 3, commit 307db1ff8)

1. PRZYJMUJĘ. Dowód z danych: 33 przebiegi P0 dają 3 serie skarbu (po jednej na ziarno). Pseudoreplikacja usunięta: liczba przebiegów
   nie jest już ani podstawą próby, ani wynikiem; Fisher usunięty; zdanie „23/23” z DECISION_REQUIRED usunięte.
2. PRZYJMUJĘ. P1 nie osiąga ≥ 20/ziarno (n = 3 na jednym ziarnie); P2 n = 4 / 1 / 2; horyzont 14 tur. Dla 4242 i 778899 P1 jest
   wnioskiem z inwentarza, nie pomiarem (zaznaczone). Kryterium „≥ 20 przebiegów” niezrealizowane — jawnie NIE ZMIERZONO.
3. PRZYJMUJĘ, z rozróżnieniem: (a) „tura 12” dla 4242 jest ekstrapolacją (oznaczone); dla 7 i 778899 Skarb 12 w turze 12 jest zmierzony
   (przebiegi sięgają tury 12–14). (b) Budowa Palisady/Murów NIE była próbowana — oznaczone jako wyliczenie. (c) Przyczyna braku
   Drewna na 778899 NIE zbadana; wniosek „nigdy” ograniczony do tur 1–12 i zaznaczony jako niezbadany.
4. PRZYJMUJĘ. Hak `setTaxSplit` (P2) zmienia stan; dodatek r2 tego zakazywał. Zachowano jako wynik INFORMACYJNY z zastrzeżeniem
   (§5), bez wniosku o trwałości. Słowo „nieutrzymywalny” wycofane (zastąpione „blokada w 1–2 turach, dłuższy horyzont NIE ZMIERZONO”).
   Spadek Drewna w P2 (§5) oznaczony jako niewyjaśniony. Alternatywy utrzymania: NIE ZMIERZONO (nie ODRZUCAM — brak pomiaru).
5. PRZYJMUJĘ. Tezy o DEFEAT i realdef r1–r2 są wnioskowane z diagnozy, nie zweryfikowane (nagłówek zmieniony; §0 pkt 1). Definicja `turn`
   nie została uzgodniona z DEFEAT — oznaczone w §2.
6. PRZYJMUJĘ. Pole `infra` = false w 46/46; mechanizm niewiarygodności NIE przetestowany pozytywnie na świecie nowej gry (§2, §8).
   Liczebność barbarzyńców w turze utraty: NIE ZMIERZONO (tylko odległość `lastBarbNear`).

Zarzuty nie odrzucone z dowodem: brak.

## 10. Wykonanie (ta runda)

Zmiany: wyłącznie dokumenty. Kod gry, runnery i dane JSONL bez zmian. Bramki (tsc, logic, ai-test) nie były uruchamiane ponownie
w tej rundzie, bo nie zmieniono kodu; wyniki z kandydata 4be8bb0fc (wg Evaluatora): tsc exit 0, LOGIC OK 213/213, ai-test 297 passed, 0 failed.

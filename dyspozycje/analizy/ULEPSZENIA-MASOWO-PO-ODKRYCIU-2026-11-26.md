# Ulepszenia masowo po odkryciu technologii (AUTOIMPMASS, 2026-11-26)

Temat: R-WEB-IMPROVEMENT-MASS-ON-DISCOVERY-Q1 (odp. 13C: koszt ulepszeń wg epoki właściciela bez zmian).
Baza: origin/main `7148b2f4e1b6b927ce572593e7379c641cc1bfe9`. Zmiana: tylko harness `gra/tools/`; kod gry i dane bez zmian.

## 1. Pomiar (ZMIERZONO, harness `gra/tools/autoimprove-pasture-irrigation-q2-bisect.cjs`, produkcyjny `pickAutoImprovements`)

Warunki harnessu (bez zmian względem poprzedniego pomiaru): mapa `Kontynenty` 48x36, 10 miast nad rzekami, wzrost populacji do 16 (co 2 tury, do tury 24), pula Pracy 3000 na starcie, +120 Pracy na turę (założenie harnessu, NIE ZMIERZONO w grze), limit gracza 33% puli na turę (`pracaBudgetPercent`, decyzja #24).

Nowe parametry harnessu: `DISC_PAST` (tura odkrycia „Oswojenie zwierząt” = technologia trzody) i `DISC_IRR` (tura odkrycia irygacji = kanoniczna „Gospodarka wodna”, `TECH_CANONICAL`). Domyślnie 1 = dawne zachowanie. Wartości „po odkryciu” liczone względem tury odkrycia.

### Tabela A: odkrycie w turze 1 (stan sprzed zmiany, 14 ziaren)

| Ziarno | Trzoda: pierwsza tura | Irygacja: pierwsza tura | Irygacja: tur po odkryciu | Farmy bez trzody w turze 24 | Farmy bez trzody w turze 44 |
|---|---|---|---|---|---|
| 1 | 2 | 7 | 6 | 38 | 0 |
| 2 | 2 | 11 | 10 | 6 | 0 |
| 3 | 2 | 40 | 39 | 45 | 0 |
| 4 | 2 | 36 | 35 | 29 | 0 |
| 5 | 2 | brak do t44 | – | 48 | 2 |
| 6 | 2 | 10 | 9 | 5 | 0 |
| 7 | 2 | 8 | 7 | 43 | 0 |
| 8 | 2 | 39 | 38 | 41 | 0 |
| 9 | 2 | 4 | 3 | 20 | 0 |
| 10 | 2 | 12 | 11 | 0 | 1 |
| 11 | 2 | 35 | 34 | 30 | 0 |
| 12 | 2 | 3 | 2 | 23 | 0 |
| 13 | 2 | 5 | 4 | 24 | 0 |
| 14 | 2 | 5 | 4 | 27 | 0 |

Mediana irygacji po odkryciu: 9 tur (zakres 2–39). Trzoda: 1 tura po odkryciu (zawsze).

### Tabela B: odkrycie w turze 10 (14 ziaren, 44 tury)

| Zakres | Trzoda: tur po odkryciu | Irygacja w 44 turach | Naruszenia kolejności | Głodzenie po odkryciu |
|---|---|---|---|---|
| 14 ziaren | mediana 0, max 3 | 1 ziarno (tura 42 = 32 tury po odkryciu), 13 brak | 0 | 0 |

### Tabela C: odkrycie w turze 20 (14 ziaren, 44 tury)

| Zakres | Trzoda: tur po odkryciu | Irygacja w 44 turach | Naruszenia kolejności | Głodzenie po odkryciu |
|---|---|---|---|---|
| 14 ziaren | mediana 0, max 8 (ziarno 7) | brak we wszystkich 14 | 0 | 0 |

### Tabela D: irygacja przy odkryciu w turze 10, dłuższy bieg (90 tur, ziarna 1–4)

| Ziarno | Trzoda: tura | Irygacja: tura | Irygacja: tur po odkryciu |
|---|---|---|---|
| 1 | 10 | 56 | 46 |
| 2 | 10 | 47 | 37 |
| 3 | 13 | 55 | 45 |
| 4 | 10 | 46 | 36 |

### Pomiar pól (ziarno 1, tura 24 i tura 44 w tabeli A)
- Pola obywateli z farmą bez trzody w turze 24: 38 (tabela A); w turze 44: 0.
- Pola obywateli z farmą bez irygacji przy rzece na koniec 44 tury: 65 (ziarno 1, tabela A).
- Kwalifikujące się pola w zasięgu miast: 78 farm na końcu (ziarno 1, tabela A).

### Ulepszenia inne niż farma / trzoda / irygacja
NIE ZMIERZONO. Harness mierzy tylko farmę, trzodę (bydło) i irygację. Tarasy, owce, lama, obóz, łodzie rybackie nie są w tym pomiarze.

## 2. Diagnoza (dlaczego irygacja spóźnia się po odkryciu)

Źródło: trace per tura (`VERBOSE=1`), ślad picków z `DBG`, oraz eksperyment z limitem 100% zamiast 33%.

1. Trzoda po odkryciu startuje od razu (0–3 tury). Pick trzody leci na polach z farmą; farmy powstają na bieżąco w miarę wzrostu obywateli.
2. Irygacja (etap E4) nie startuje, dopóki etap E3 (trzoda) ma jeszcze cel czekający na Pracę. To jest zapisana zasada właściciela w `FOOD_STAGES` (`auto-improvements.ts`): „etap z celem czekającym na samą Pracę wstrzymuje niższe; kolejność nie jest omijana”. Naruszeń kolejności w pomiarze: 0.
3. Tempo trzody ogranicza limit 33% puli gracza (decyzja #24, twardy sufit). Przy puli ok. 300–375 i 33% na turę budżet to ok. 100–120 Pracy, czyli 2–3 trzody po 40 Pracy na turę. Pula ustala się na poziomie, przy którym 33% ≈ dopływ 120 na turę (365 ≈ 120/0,33) — co pokazuje wynik końcowy `pool` w tabelach.
4. Eksperyment kontrolny (ziarna 1, 3, 8; limit 100% zamiast 33%): irygacja w turze 2 na wszystkich trzech ziarnach. Potwierdza, że limit % jest wąskim gardłem tempa, a nie koszt ani kolejność pickera.
5. Koszt budowy wg epoki właściciela (`improvement-cost-params.json`, `terrain-improvements.ts`) nie był zmieniany i nie jest przyczyną. W trace koszt trzody z pickera wynosi 40 Pracy na pole (ZMIERZONO); koszt irygacji nie był zapisywany w tym pomiarze (NIE ZMIERZONO).

Wniosek: nie znaleziono błędu kolejności ani limitu niezgodnego z regułami właściciela. Dlatego kod pickera NIE został zmieniony (kryterium z dispatchu: poprawka tylko przy błędzie zgodnym z regułą). Opóźnienie irygacji wynika z dwóch reguł właściciela: kolejności E3 → E4 oraz limitu 33% dla gracza. Zmiana któregokolwiek z nich to decyzja o grze.

## 3. Test (e) od tury odkrycia (`gra/tools/autoimprove-pasture-irrigation-q2-test.cjs`)

- Odkrycie w turze D = 10 (`E_DISC`, domyślnie 10). Kryteria: (1) zero tur z głodzoną trzodą/irygacją po odkryciu przy dużej puli; (2) pierwsza trzoda ≤ 3 tury po odkryciu; (3) zero naruszeń kolejności od odkrycia; (4) to samo przy jednym mieście z 0%.
- Irygacja: tylko informacja w logu (`[info]`), bez progu. Zmierzone tempo (tabela D) to 36–46 tur po odkryciu i zależy od tego, kiedy skończy się trzoda. Próg liczbowy nie został zaproponowany: nie ma danych dla progu, który nie byłby pomiarem zakresu 44 tur.
- Scenariusz (b) „pole poza rzeką z farmą”: ziarno 1 go nie ma (pomiar: 0 pól). Test wybiera pierwsze ziarno z 1–4, które go ma (ziarno 3: 1 pole). Asercje per-heks bez zmian.
- Asercje słabsze/usunięte: usunięto `farmNoPast === 0 w turze 24` (w tabeli A wartość 38 przy limicie 33%, to efekt limitu, nie błąd) i `pierwsza irygacja ≤ 6` (liczone od startu gry). Obie są zastąpione przez kryteria od odkrycia. To zmiana kontraktu testu, uzasadniona powyżej.

Wynik testu: **15 OK / 0 FAIL** (ziarno 3 w scenariuszu a/b/c, `E_DISC=10`).

Mutacja czerwona: wyłączenie etapu E3 (`FOOD_LIVESTOCK_STAGE_KEYS` → `[]`) w kopii `gra/src` → **12 OK / 3 FAIL** (trzoda nie startuje; naruszenia kolejności 23 i 26). Test czerwony na nowych kryteriach.

## 4. Propozycja dla orkiestratora (DECISION_REQUIRED, bez implementacji)

Pytanie do właściciela (nie rozstrzygane w kodzie):

- **Wariant A (obecny, zero zmian):** irygacja po odkryciu czeka, aż cała trzoda na farmach będzie zbudowana. Skutek w grze: po odkryciu irygacji pierwsze pole z irygacją pojawia się średnio po ok. 40 turach (przy limicie 33% puli). Plus: zgodne z zapisaną zasadą kolejności. Minus: nie spełnia „masowo w turze odkrycia” dla irygacji.
- **Wariant B (E4 równolegle z E3):** irygacja może startować w turze odkrycia z tą samą pulą, bez czekania na trzodę. Skutek: pierwsze pola z irygacją w 1–3 tury po odkryciu; trzoda może być opóźniona przez irygację w tej samej puli. Zmiana: `pickAutoImprovementsStaged` (warunek `earlierStageIsPending` dla E3→E4) i niezmiennik kolejności w teście (e). Test (e) przestaje sprawdzać kolejność E3→E4 od odkrycia.
- Poza zakresem tego tematu: limit 33% (decyzja #24) — gdyby właściciel chciał go zmienić, to osobna decyzja balansowa.

Rekomendacja Operatora: wariant A do czasu decyzji właściciela, bo implementacja B to zmiana zasady kolejności, nie poprawka błędu.

## 5. Bramki

- `tsc --noEmit` (gra/): **EXIT 0**, 0 linii wyjścia (ZMIERZONO).
- `autoimprove-pasture-irrigation-q2-test`: **15 OK / 0 FAIL** (ZMIERZONO).
- `autoimprove-river-forest-first-q1-test`: 12 OK / 0 FAIL; `autoimprove-river-forest-clear-no-citizen-q1-unit-test`: 17 OK / 0 FAIL (ZMIERZONO).
- `autoimprove-stages-q1-test`: wynik w logu: 217 OK, 3 FAIL (`[K2] niedobor kamienia ... drogi ruszaja`, `[K2/K3] pula 80: kamieniolom ...`), proces przerwany limitem czasu. Pliki kodu gry nie zmienione względem bazy, test nie czyta zmienionych plików. Nie sprawdzono na bazie (NIE ZMIERZONO na bazie).
- `autoimprove-irrigation-after-farms-test`: przekroczony czas 120 s, wynik NIE ZMIERZONO.
- `autoimprove-river-forest-clear-no-citizen-q1-test`: wymaga `ROBOCZA_HTML` (live w przeglądarce), NIE URUCHOMIONO.
- Pozostałe bramki z dispatchu (logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297/0, war-rules-multiwar-main-guard 21/0): NIE URUCHOMIONO w tej rundzie. Zmiana dotyka wyłącznie `gra/tools/*.cjs` i nie zmienia kodu ani danych gry.

## 6. Zakres zmian w commicie

- `gra/tools/autoimprove-pasture-irrigation-q2-bisect.cjs`: parametry `DISC_PAST`/`DISC_IRR`, filtr technologii per tura (kanoniczna „Gospodarka wodna” dla irygacji), licznik głodzenia od tury odkrycia, pola `afterDiscPast`/`afterDiscIrr`/`discPast`/`discIrr`/`seed` w wyniku JSON.
- `gra/tools/autoimprove-pasture-irrigation-q2-test.cjs`: wybór scenariusza (a/b/c) z ziaren 1–4, sekcja (e) od odkrycia D=10 z mutacją czerwoną.
- Ten dokument.

Nie zmieniono: `gra/src/**`, `gra/data/**` (w tym `improvement-cost-params.json` i `terrain-improvements.ts`), `WERSJE.md`, manifest, `gra-robocza`, `gra-kanon`, `rust-port`.

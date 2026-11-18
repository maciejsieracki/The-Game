# Rozejm i pokój

## Metadane

| Pole | Wartość |
|------|---------|
| id | `rozejm-pokoj` |
| tytuł | Rozejm i pokój |
| kategoria | Dyplomacja |
| poradnik_ref | Część XII §79.3 |
| json_ref | `diplomacy-war-peace-params.json`, `war-weariness-params.json`, `diplomacy-peace-lock.ts` |
| stan | Stan na 2026-11-13 (weryfikacja w kodzie) |

---

## Wiki‑S

**Rozejm** kończy wojnę na określony czas (5, 10 albo 15 tur). Po jego upływie można zaproponować **pokój**. **Pokój** kończy wojnę na stałe i daje karencję, w której nie można wrócić do ataku. Jedynym słodzikiem przy pokoju jest **miasto**; złoto i surowce nie kupują pokoju.

---

## Wiki‑M

### Rozejm

- Do wyboru są rozejmy na **5, 10 albo 15 tur**; domyślnie **10**.
- Po zakończeniu rozejmu pojawia się propozycja pokoju; zgoda oznacza pokój, brak zgody oznacza wznowienie wojny.
- Zawarcie rozejmu ustawia Zaufanie pary na **10** (od razu, `diplomacy.json:rozejm_zaufanie_ustawienie`).

### Pokój

- Zawarcie pokoju ustawia Zaufanie pary na **20** (od razu; także przy pokoju po rozejmie, `diplomacy.json:pokoj_zaufanie_ustawienie`).
- Pokój jest stały. Po pokoju następuje **karencja** 40 tur; dla chronionego przegrywającego (patrz hasło **Zmęczenie wojną**) karencja trwa 100 tur.
- Pokój z przegrywającym może kosztować miasta: przegrywający, który jest już wyczerpany wojną, oddaje miasta.

### Zasady pokoju (wdrożone)

- **Słabsza strona szuka pokoju, silniejsza go odrzuca.** Silniejsza strona wg siły militarnej (patrz **Siła militarna** w haśle **Moc (Power) i jej podział na wojskowy i gospodarczy**) odrzuca pokój bez miasta. Słabsza strona i strona w paśmie wyrównania rozpatrywane są dalej.
- **Próg różnicy siły w grze wynosi 0**: każda różnica decyduje. Wartość w `diplomacy-war-peace-params.json:progRozniceSilyPokoj` można zmienić bez kodu (np. 20 = różnica ±20% nie wymusza odrzucenia).
- **Miasto jako jedyny słodzik.** Ceny pokoju są płacone wyłącznie miastami. Złoto i surowce nie wchodzą w ofertę pokoju.
- **Minimalny czas wojny** zależy od profilu cywilizacji: od 1 do 8 tur (domyślnie 5). Przed tym czasem AI odrzuca pokój zawsze (`diplomacy-war-peace-params.json:minTurWojny`). Niezależnie od profilu obowiązuje wspólna blokada: pierwsze 10 pełnych tur wojny nie przyjmuje żadnej propozycji pokoju ani rozejmu, także od AI (`PEACE_PROPOSAL_MIN_WAR_TURNS = 10`, `diplomacy-peace-proposal-timing.ts`). Obie bramki obowiązują jednocześnie.
- **Cena pokoju maleje ze zmęczeniem: 6000 PN na starcie wojny, 0 przy zmęczeniu 100%** (`war-weariness-params.json:cenaPokoju.cenaStartPn`, funkcja `wearinessPeaceCashPn`: cena = 6000 × (1 − L), L = poziom zmęczenia pary, ABC 2026-11-17, R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1). Ta sama cena dla panelu dyplomacji, decyzji AI, AI↔AI i pokoju wymuszonego. Rozejm ma osobną wycenę. Bramka relacji: przy relacji, dla której wycena bazowa daje 0, cena pozostaje 0.

### Zmęczenie wojną a pokój

Licznik zmęczenia (2,5% na turę od startu wojny (100% po 40 turach), +10% za każde zmienione miasto, patrz hasło **Zmęczenie wojną**) zmienia zasady pokoju:
- **50%** — silniejsza strona obniża cenę pokoju, słabsza szuka pokoju;
- **80%** — AI proponuje pokój z miastami przegrywającego (bez pokoju bezwarunkowego);
- **100%** — **pokój wymuszony**: wyraźnie przegrywający oddaje miasta do zrównoważenia ceny (oddaje tyle miast, ile trzeba do pokrycia ceny; stolica nigdy; brak progu min. 3 miast); przy remisie sił albo cenie 0 (zmęczenie 100%) pokój bez miast (patrz hasło **Zmęczenie wojną**).

Pierwsze propozycje pokoju AI pojawiają się od tury 10 wojny.

### Kiedy AI proponuje rozejm, a kiedy pokój

- AI nie proponuje pokoju, gdy jest militarnie silniejsza (siła militarna, patrz **Siła militarna**), ani przed minimalnym czasem wojny z profilu i przed turą 10.
- AI proponuje pokój, gdy jest militarnie słabsza (wtedy zawsze, sygnał `f` w `ai.ts`), albo gdy zachodzi jeden z sygnałów (`diplomacy-war-peace-params.json:sygnalyPokoju`, `aiPeaceSignals`): (a) rw ≤ **0,4** (`progPokojSlabosc`), gdzie słabość mierzy respekt względny, a nie siła militarna; (b) co najmniej jedno miasto utracone w tej wojnie i rw ≤ **0,5** (`progRwMiasta`); (c) zdrowie armii poniżej progu z profilu (`progZdrowia`); (d) pat: co najmniej **15** tur wojny (`patTurWojny`) i brak zmiany miast przez **10** tur (`patBrakZmianyTur`); (e) zmęczenie wojną co najmniej **0,4** (`progSygnaluPokoju`).
- Wobec gracza słabsza AI proponuje pokój wyłącznie z miastem. Gdy nie ma miasta do oddania, nie proponuje wcale (`ai.ts`, `peaceWeakerNoCityVsPlayer`).
- Tryb: **pokój stały**, gdy zmęczenie osiągnęło 1, gotowość AI do pokoju wynosi co najmniej **0,7** albo Zaufanie co najmniej **60**; w pozostałych przypadkach **rozejm**. (Wartości z `diplomacy-peace-lock.ts`.)

### Plusy i minusy

**Dla gracza**
- Plus: rozejm daje krótką przerwę w walce z jasno określonym końcem.
- Plus: pokój kończy wojnę na stałe i otwiera drogę do dalszej współpracy.
- Minus: po zakończeniu rozejmu wojna może wrócić, jeśli druga strona odrzuci pokój.
- Minus: pokój z przegrywającym bywa kosztowny w miastach, jeśli ten je oferuje.

**Dla AI**
- Plus: rozejm daje AI przerwę bez stałego pokoju.
- Minus: pokój stały zamyka możliwość zdobycia miast, dlatego AI proponuje go dopiero przy spełnionych warunkach.

---

## Przykład liczbowy

Wojna trwa 12 tur. Gracz proponuje rozejm na 10 tur. Po 10 turach pojawia się propozycja pokoju; jeśli AI zgodzi się, wojna kończy się pokojem, Zaufanie ustawia się na 20 i zaczyna się karencja 40 tur. Gdyby AI była militarnie silniejsza, odrzuci pokój bez miasta.

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/12-dyplomacja.md` §79.3

---

## Parametry

| Wartość | Skąd (plik:klucz) |
|--------:|-------------------|
| 5 | `kod:truce-option-min` (`diplomacy-peace-lock.ts`, `TRUCE_DURATION_OPTIONS`) |
| 15 | `kod:truce-option-max` (`diplomacy-peace-lock.ts`, `TRUCE_DURATION_OPTIONS`) |
| 10 | `kod:truce-default` (`diplomacy-peace-lock.ts`, `TRUCE_DEFAULT_TURNS`) |
| 1 | `kod:truce-ai-fatigue` (`diplomacy-peace-lock.ts`, `TRUCE_AI_FATIGUE_PEACE_MIN`) |
| 0.7 | `kod:truce-ai-willingness` (`diplomacy-peace-lock.ts`, `TRUCE_AI_WILLINGNESS_PEACE_MIN`) |
| 60 | `kod:truce-ai-trust` (`diplomacy-peace-lock.ts`, `TRUCE_AI_TRUST_PEACE_MIN`) |
| 0.20 | `diplomacy-war-peace-params.json:przewagaMilitarna.prog` |
| 0 | `diplomacy-war-peace-params.json:progRozniceSilyPokoj.wartosc` |
| 0 | `diplomacy-war-peace-params.json:pokojAiAi.minBilansPW` |
| 40 | `war-weariness-params.json:przegrywajacy.karencjaPoPokojuTur` |
| 100 | `war-weariness-params.json:przegrywajacy.karencjaChronionegoTur` |
| 20 | `diplomacy-war-peace-params.json:cenaPokoju.turyBezOgraniczenAi` (nieużywany od C=615; zostaje w JSON do sprzątania) |
| 5 | `diplomacy-war-peace-params.json:minTurWojny.baza` |
| 1 | `diplomacy-war-peace-params.json:minTurWojny.min` |
| 8 | `diplomacy-war-peace-params.json:minTurWojny.max` |
| 0.4 | `diplomacy-war-peace-params.json:zmeczenie.progSygnaluPokoju` |
| 0.5 | `war-weariness-params.json:zmeczenie.progChetnosci` |
| 0.8 | `war-weariness-params.json:zmeczenie.progWzajemnyPokoj` |
| 0.5 | `diplomacy-war-peace-params.json:sygnalyPokoju.progRwMiasta` |
| 15 | `diplomacy-war-peace-params.json:sygnalyPokoju.patTurWojny` |
| 10 | `diplomacy-war-peace-params.json:sygnalyPokoju.patBrakZmianyTur` |

---

## Historia / decyzje

Hasło zweryfikowane w kodzie 2026-11-13 (R-WEB-DIPLO-CIVPEDIA-Q1, runda 3). Zasady pokoju (siła militarna zamiast Power, miasto jako jedyny słodzik, usunięcie warunku „czuje się silniejsze” i mnożnika ceny od siły) są wdrożone (kroki 4a i 4b, FALA 685). Dawne wiersze tabeli (odrzucenie rw 0,55, odrzucenie po 10 turach) zostały usunięte, bo bramka `evaluatePeaceAiGate` ich nie używa.

Od 2026-11-17 (R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1) opis w `war-weariness-params.json` i kod są zgodne: oferta pokoju zmęczenia to wyłącznie miasta za jedną cenę (`wearinessPeaceCashPn`), w liczbie minimalnej równoważącej cenę (`planCityPeacePayment`).
